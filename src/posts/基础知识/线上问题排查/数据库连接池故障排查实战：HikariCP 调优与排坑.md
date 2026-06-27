---
title: 数据库连接池故障排查实战：HikariCP 调优与排坑
tag: ["HikariCP", "数据库连接池", "连接泄漏", "调优", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 数据库连接池故障排查实战：HikariCP 调优与排坑

> "CPU 不高、内存不高、磁盘 IO 也正常，但接口就是慢。" 这是数据库连接池问题的典型症状。连接池是应用和数据库之间的桥梁，桥堵了，一切都会堵。本文以 Spring Boot 默认的 HikariCP 为例，带你排查连接池的各种故障。

## 一、HikariCP 核心参数速查

### 1.1 关键配置参数

```yaml
spring:
  datasource:
    hikari:
      # 连接池大小
      maximum-pool-size: 20              # 最大连接数（最重要）
      minimum-idle: 20                   # 最小空闲连接数（建议 = maximum-pool-size）

      # 连接生命周期
      max-lifetime: 1800000              # 连接最大存活时间 30 分钟
      connection-timeout: 30000          # 获取连接超时时间 30 秒
      idle-timeout: 600000              # 空闲连接超时 10 分钟（minIdle < maxPool 时生效）

      # 健康检查
      connection-test-query: SELECT 1    # 连接测试 SQL（MySQL 可以用 SELECT 1）
      validation-timeout: 5000          # 校验超时 5 秒
      keepalive-time: 120000            # 保活探测间隔 2 分钟

      # 泄漏检测
      leak-detection-threshold: 60000   # 连接泄漏检测阈值 60 秒
```

### 1.2 maximum-pool-size 怎么算

HikariCP 官方给出的公式：

```
最优连接数 = (连接数 × (1 + 等待时间/执行时间)) × CPU核心数
```

简化版经验值：

| 数据库部署方式 | 推荐连接数 |
|--------------|----------|
| 单机应用 + 单机 DB | 10-20 |
| 多实例应用 + 单机 DB | 10-20 / 实例数 |
| 单机应用 + 云数据库 | 20-50 |
| 高并发微服务 | 20-30 |

**关键原则**：连接数不是越多越好！过多的连接会增加数据库上下文切换开销，反而降低性能。

HikariCP 官方建议：`maximum-pool-size` 和 `minimum-idle` 设置为相同的值，避免动态创建/销毁连接的开销。

## 二、故障场景一：连接池耗尽

### 2.1 问题现象

```
告警: 接口 /api/order/create 超时
日志: HikariPool-1 - Connection is not available, request timed out after 30000ms
```

所有需要数据库操作的接口全部超时，应用日志中大量出现 `Connection is not available`。

### 2.2 排查步骤

**第一步：查看连接池状态**

```java
// 通过 JMX 查看 HikariCP 状态
@Bean
public void monitorHikari(HikariDataSource dataSource) {
    HikariPoolMXBean pool = dataSource.getHikariPoolMXBean();
    log.info("HikariCP 状态: active={}, idle={}, total={}, waiting={}",
        pool.getActiveConnections(),
        pool.getIdleConnections(),
        pool.getTotalConnections(),
        pool.getThreadsAwaitingConnection());
}
```

如果输出：

```
HikariCP 状态: active=20, idle=0, total=20, waiting=15
```

20 个连接全部活跃，0 个空闲，15 个线程在等待连接——连接池已经耗尽。

**第二步：查看数据库连接**

```sql
-- MySQL 查看当前连接
SHOW PROCESSLIST;

-- 或查看连接数统计
SELECT DB, COUNT(*) as conn_count
FROM information_schema.PROCESSLIST
WHERE INFO IS NOT NULL
GROUP BY DB;
```

如果 MySQL 显示 20 个连接，但大部分状态是 `Sleep`，说明连接被占着但没在用——这是连接泄漏的典型表现。

**第三步：查看等待连接的线程**

```bash
jstack <PID> | grep -B 2 -A 5 "getConnection"
```

输出：

```
"http-nio-8080-exec-5" #42 prio=5
   java.lang.Thread.State: WAITING (on monitor)
   at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
   - waiting to lock <0x000000076b123456> (a com.zaxxer.hikari.pool.HikariPool)
   at com.example.service.OrderService.createOrder(OrderService.java:45)
```

大量线程在 `HikariPool.getConnection` 处等待。

### 2.3 根因分析

连接池耗尽的常见原因：

1. **慢 SQL**：SQL 执行时间长，连接被长时间占用
2. **事务过长**：大事务持有连接时间长
3. **连接泄漏**：获取连接但未归还
4. **连接数配置过少**：并发量超过了连接池大小
5. **死锁**：数据库层面死锁导致连接卡住

### 2.4 修复方案

**方案一：开启泄漏检测**

```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 30000  # 30 秒未归还的连接标记为泄漏
```

开启后，HikariCP 会在日志中打印泄漏堆栈：

```
WARN  com.zaxxer.hikari.pool.ProxyLeakTask - Apparent connection leak detected
    at com.example.service.ReportService.generateReport(ReportService.java:78)
    at com.example.controller.ReportController.export(ReportController.java:35)
```

直接告诉你 `ReportService.generateReport` 方法在泄漏连接。

**方案二：优化慢 SQL**

```sql
-- 查看慢查询
SELECT * FROM mysql.slow_log
WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY query_time DESC
LIMIT 20;
```

**方案三：缩小事务范围**

```java
// 问题代码：事务包裹了不需要的 IO 操作
@Transactional
public void createOrder(Order order) {
    // 数据库操作 - 需要事务
    orderMapper.insert(order);
    orderItemMapper.batchInsert(order.getItems());

    // 以下操作不需要在事务中，但连接被占着！
    sendMQ(order);          // 200ms
    sendEmail(order);       // 500ms
    pushNotification(order); // 300ms
    // 连接被多占用了 1 秒
}

// 修复：将非数据库操作移出事务
public void createOrder(Order order) {
    // 事务只包含数据库操作
    orderTransactionalService.saveOrder(order);

    // 事务外执行
    sendMQ(order);
    sendEmail(order);
    pushNotification(order);
}

@Transactional
private void saveOrder(Order order) {
    orderMapper.insert(order);
    orderItemMapper.batchInsert(order.getItems());
}
```

## 三、故障场景二：连接泄漏

### 3.1 问题代码

```java
// 问题代码：手动获取连接但忘记关闭
@Autowired
private DataSource dataSource;

public void batchInsert(List<User> users) {
    try {
        Connection conn = dataSource.getConnection();  // 获取连接
        PreparedStatement ps = conn.prepareStatement(
            "INSERT INTO users (name, email) VALUES (?, ?)");

        for (User user : users) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.addBatch();
        }
        ps.executeBatch();

        // 如果这里抛异常，conn 永远不会关闭！
        ps.close();
        conn.close();  // 可能执行不到
    } catch (SQLException e) {
        log.error("批量插入失败", e);
        // 异常后连接未归还 → 泄漏
    }
}
```

### 3.2 排查方法

**开启泄漏检测：**

```yaml
spring:
  datasource:
    hikari:
      leak-detection-threshold: 10000  # 10 秒
```

**日志输出：**

```
WARN  HikariPool-1 - Apparent connection leak detected.
Connection trace:
    at com.example.service.UserService.batchInsert(UserService.java:125)
    at com.example.controller.UserController.importUsers(UserController.java:42)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
```

### 3.3 修复方案

**方案一：try-with-resources**

```java
public void batchInsert(List<User> users) {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(
             "INSERT INTO users (name, email) VALUES (?, ?)")) {

        for (User user : users) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.addBatch();
        }
        ps.executeBatch();
    } catch (SQLException e) {
        log.error("批量插入失败", e);
        throw new RuntimeException("批量插入失败", e);
    }
    // try-with-resources 自动关闭 conn 和 ps
}
```

**方案二：使用 Spring 事务管理**

```java
@Transactional
public void batchInsert(List<User> users) {
    // Spring 自动管理连接，方法结束后自动归还
    for (User user : users) {
        userMapper.insert(user);
    }
}
```

### 3.4 真实案例：定时任务中的连接泄漏

```java
// 问题代码：@Async 定时任务中，事务传播不当导致连接泄漏
@Scheduled(cron = "0 0 2 * * ?")
@Async
public void generateDailyReport() {
    // 这个方法开启了事务
    List<Order> orders = orderMapper.selectAll();

    for (Order order : orders) {
        // 每次调用都在同一个事务中，连接一直被持有
        // 如果 orders 有 10 万条，处理 30 分钟，连接被占 30 分钟
        updateOrderStatus(order);
        sendNotification(order);
    }
}

// 修复：缩小事务粒度
@Scheduled(cron = "0 0 2 * * ?")
public void generateDailyReport() {
    List<Order> orders = orderMapper.selectAll();  // 无事务，用完连接就归还

    for (Order order : orders) {
        // 每条订单独立事务
        processSingleOrder(order);
    }
}

@Transactional
public void processSingleOrder(Order order) {
    updateOrderStatus(order);
}
```

## 四、故障场景三：连接超时配置不当

### 4.1 问题现象

```
Caused by: java.sql.SQLTransientConnectionException:
HikariPool-1 - Connection is not available, request timed out after 30000ms.
```

### 4.2 连接超时的原因链

```
获取连接超时 (30s)
  ├── 连接池已满 + 等待超时
  ├── 数据库拒绝连接
  ├── 网络不通
  └── 连接创建失败（认证/权限问题）
```

### 4.3 排查方法

**查看 HikariCP 日志：**

```
DEBUG HikariPool-1 - Pool stats (total=20, active=20, idle=0, waiting=15)
DEBUG HikariPool-1 - Add connection elided, queue is empty
WARN  HikariPool-1 - Caught exception while adding connection
```

**查看 MySQL 连接数配置：**

```sql
-- MySQL 最大连接数
SHOW VARIABLES LIKE 'max_connections';
-- 默认 151，如果应用连接池 20 个 × 10 实例 = 200，就超了

-- 当前连接数
SHOW STATUS LIKE 'Threads_connected';
```

### 4.4 配置调优

**MySQL 侧：**

```sql
-- 适当增大 max_connections
SET GLOBAL max_connections = 500;

-- 查看已用连接
SHOW STATUS LIKE 'Threads_connected';

-- 调整 wait_timeout（空闲连接超时）
SET GLOBAL wait_timeout = 600;  -- 10 分钟
```

**应用侧：**

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # 根据并发量调整
      minimum-idle: 20             # 与 max 相同
      connection-timeout: 5000     # 获取连接超时 5 秒（默认 30 秒太长）
      max-lifetime: 1800000        # 连接最大生命 30 分钟
      keepalive-time: 120000       # 保活 2 分钟
      leak-detection-threshold: 30000  # 泄漏检测 30 秒
```

**为什么 connection-timeout 要调小？**

默认 30 秒意味着线程会等 30 秒才报错。在高并发场景下，30 秒足以让 Tomcat 线程池也耗尽，导致雪崩。调到 5 秒可以快速失败，触发降级逻辑。

## 五、故障场景四：网络问题导致连接失效

### 5.1 问题现象

应用正常运行一段时间后，突然报错：

```
ERROR: Communications link failure
The last packet successfully received from the server was 50,234 milliseconds ago.
The last packet sent successfully to the server was 50,234 milliseconds ago.
```

### 5.2 原因分析

常见于以下场景：

1. **MySQL 主动断开空闲连接**：MySQL 的 `wait_timeout` 默认 8 小时，但云数据库可能更短
2. **防火墙/负载均衡器断开空闲连接**：云环境的 LVS/F5 会清理空闲 TCP 连接
3. **网络抖动**：VPC 网络偶发性问题

### 5.3 修复方案

**配置连接保活：**

```yaml
spring:
  datasource:
    hikari:
      # 连接最大生命时间，要小于 MySQL 的 wait_timeout
      max-lifetime: 600000   # 10 分钟（MySQL wait_timeout 默认 8 小时，但云 DB 可能 10 分钟）

      # 保活探测，定期发送心跳
      keepalive-time: 120000  # 2 分钟发一次心跳

      # 连接测试
      connection-test-query: SELECT 1
      validation-timeout: 3000
```

**关键原则：`max-lifetime` 必须小于 MySQL 的 `wait_timeout`！**

```sql
-- 查看 MySQL 的 wait_timeout
SHOW VARIABLES LIKE 'wait_timeout';
-- 如果是 600（10分钟），那么 HikariCP 的 max-lifetime 应设为 540（9分钟）
```

如果 `max-lifetime > wait_timeout`，连接会在 MySQL 侧被关闭，但 HikariCP 还认为它是活的，下次使用就会报错。

## 六、HikariCP 性能调优最佳实践

### 6.1 推荐配置模板

```yaml
spring:
  datasource:
    url: jdbc:mysql://host:3306/db?useSSL=false&serverTimezone=Asia/Shanghai&rewriteBatchedStatements=true
    username: root
    password: xxx
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      # 连接池大小：CPU 密集型 = CPU 核心数 × 2；IO 密集型 = CPU 核心数 × (1 + IO时间/CPU时间)
      maximum-pool-size: 20
      minimum-idle: 20

      # 超时配置
      connection-timeout: 5000      # 获取连接超时 5 秒
      validation-timeout: 3000      # 校验超时 3 秒

      # 生命周期
      max-lifetime: 600000          # 10 分钟（需 < MySQL wait_timeout）
      keepalive-time: 120000        # 2 分钟保活
      idle-timeout: 600000          # 10 分钟（minimumIdle < maximumPoolSize 时生效）

      # 泄漏检测
      leak-detection-threshold: 30000  # 30 秒

      # 其他
      connection-test-query: SELECT 1
      auto-commit: true
      pool-name: OrderHikariPool
```

### 6.2 多数据源配置

```java
@Configuration
public class DataSourceConfig {

    @Primary
    @Bean("orderDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.order")
    public DataSource orderDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean("userDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.user")
    public DataSource userDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }
}
```

```yaml
spring:
  datasource:
    order:
      jdbc-url: jdbc:mysql://order-db:3306/order_db
      hikari:
        maximum-pool-size: 20
        pool-name: OrderHikariPool
    user:
      jdbc-url: jdbc:mysql://user-db:3306/user_db
      hikari:
        maximum-pool-size: 10
        pool-name: UserHikariPool
```

### 6.3 连接池监控面板

```java
@Configuration
public class HikariMetricsConfig {

    @Bean
    public MeterBinder hikariMetrics(HikariDataSource dataSource) {
        return new MeterBinder() {
            @Override
            public void bindTo(MeterRegistry registry) {
                HikariPoolMXBean pool = dataSource.getHikariPoolMXBean();

                Gauge.builder("hikari.active", pool, HikariPoolMXBean::getActiveConnections)
                    .tag("pool", dataSource.getPoolName())
                    .register(registry);
                Gauge.builder("hikari.idle", pool, HikariPoolMXBean::getIdleConnections)
                    .tag("pool", dataSource.getPoolName())
                    .register(registry);
                Gauge.builder("hikari.total", pool, HikariPoolMXBean::getTotalConnections)
                    .tag("pool", dataSource.getPoolName())
                    .register(registry);
                Gauge.builder("hikari.waiting", pool, HikariPoolMXBean::getThreadsAwaitingConnection)
                    .tag("pool", dataSource.getPoolName())
                    .register(registry);
            }
        };
    }
}
```

## 七、HikariCP vs 其他连接池

| 特性 | HikariCP | Druid | DBCP2 |
|------|----------|-------|-------|
| 性能 | 最快 | 快 | 一般 |
| 代码量 | ~13KB | ~200KB | ~80KB |
| 监控 | JMX | 内置监控页面 | JMX |
| SQL 防火墙 | 无 | 有 | 无 |
| 连接泄漏检测 | 内置 | 内置 | 无 |
| Spring Boot 默认 | 是 | 否 | 否 |

HikariCP 以极致的性能著称，但缺少 Druid 的 SQL 防火墙和监控页面。如果安全防护需求强，可以考虑 Druid。

## 八、面试要点总结

### Q1：HikariCP 为什么快？

1. 使用 `FastList` 替代 `ArrayList`，避免范围检查
2. 使用 `ConcurrentBag` 实现无锁连接获取
3. 使用 `CopyOnWriteArrayList` 管理监听器
4. 精简的字节码，JIT 优化友好
5. 代理类使用 `Javassist` 动态生成，避免反射开销

### Q2：连接池大小怎么设置？

- 不是越大越好，过多连接增加 DB 上下文切换
- 公式：`连接数 = (1 + IO时间/CPU时间) × CPU核心数`
- 实际以压测为准，通常 10-20
- `minimum-idle` 建议等于 `maximum-pool-size`

### Q3：连接泄漏怎么排查？

1. 开启 `leak-detection-threshold`（如 30 秒）
2. HikariCP 会在日志中打印泄漏堆栈
3. 检查代码中手动获取连接是否用了 try-with-resources
4. 检查事务范围是否过大

### Q4：连接池耗尽怎么处理？

1. 查看连接池状态：active、idle、waiting
2. 查看 MySQL `SHOW PROCESSLIST` 确认连接状态
3. jstack 查看等待连接的线程
4. 排查慢 SQL 和大事务
5. 检查 `max_connections` 是否够用
6. 临时调大连接池或重启

### Q5：max-lifetime 为什么要小于 MySQL 的 wait_timeout？

如果 `max-lifetime > wait_timeout`，MySQL 会先关闭空闲连接，但 HikariCP 还认为连接有效。下次使用时就会报 `Communications link failure`。设置 `max-lifetime` 略小于 `wait_timeout`，让 HikariCP 主动回收连接。

## 九、总结

数据库连接池故障排查的黄金法则：

1. **监控是前提**：active/idle/waiting 三个指标必须有告警
2. **泄漏检测必开**：`leak-detection-threshold` 是排查泄漏的利器
3. **事务要小**：90% 的连接占用问题是事务范围过大
4. **配置要合理**：`max-lifetime < wait_timeout`，`connection-timeout` 不要太长
5. **慢 SQL 是根因**：连接池耗尽的根因通常是 SQL 慢，不是连接池配置问题

记住：**连接池是"水管"，不是"水池"**。水管堵了，再大的水池也没用。保持水管畅通（SQL 快、事务小），比加粗水管（增大连接池）更重要。
