---
title: 接口响应慢排查实战：从 APM 到代码级定位
tag: ["接口优化", "APM", "性能排查", "慢SQL", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 接口响应慢排查实战：从 APM 到代码级定位

> 接口响应慢排查实战：从 APM 到代码级定位是一个重要的技术主题，它在现代软件开发中扮演着关键角色。
> 本文系统介绍了接口响应慢排查实战：从 APM 到代码级定位的核心概念和实践经验，帮助你深入理解这一技术领域。

在动手排查之前，先脑补一下接口慢的可能原因，按层次分类：

```
┌──────────────────────────────────────────────┐
│              客户端 → CDN → LB                │  网络层
├──────────────────────────────────────────────┤
│          Nginx / API Gateway                  │  反向代理层
├──────────────────────────────────────────────┤
│    Tomcat / Jetty 线程池                      │  容器层
├──────────────────────────────────────────────┤
│  业务代码（循环、序列化、反射、锁等待）        │  应用层
├──────────────────────────────────────────────┤
│  数据库（慢SQL、锁等待、连接池）               │  存储层
├──────────────────────────────────────────────┤
│  缓存（Redis、本地缓存命中率）                 │  缓存层
├──────────────────────────────────────────────┤
│  外部服务（第三方API、RPC调用）                │  外部依赖
├──────────────────────────────────────────────┤
│  JVM（GC、JIT 编译）                          │  运行时层
└──────────────────────────────────────────────┘
```

每一层都可能是瓶颈所在。我们需要一套分层定位的方法论。

## 二、排查方法论：从宏观到微观

### 2.1 第一层：APM 全链路监控

如果你有 APM（Application Performance Monitoring）工具（如 SkyWalking、Pinpoint、Jaeger、Elastic APM），这是最快的方式。

**APM 能告诉你什么：**

```
Trace ID: a1b2c3d4
接口: GET /api/order/list
总耗时: 3250ms

├── Tomcat 等待线程: 50ms
├── Spring Filter/Interceptor: 20ms
├── Controller 方法: 3180ms
│   ├── 用户鉴权 (Redis): 30ms
│   ├── 查询订单列表 (MySQL): 2800ms  ← 瓶颈在这里！
│   │   ├── 获取连接: 500ms          ← 连接池等待
│   │   └── SQL 执行: 2300ms         ← 慢 SQL
│   ├── 查询商品信息 (RPC): 200ms
│   └── 数据组装序列化: 150ms
└── 响应返回: 0ms
```

一目了然——MySQL 查询耗时 2800ms，其中 SQL 执行 2300ms，连接池等待 500ms。

### 2.2 没有 APM 怎么办？手动打点

如果没有任何监控工具，最快的办法是加日志打点：

```java
@GetMapping("/api/order/list")
public Result<List<OrderVO>> listOrders(@RequestParam Long userId) {
    long start = System.currentTimeMillis();

    // 用户鉴权
    long t1 = System.currentTimeMillis();
    User user = authService.authenticate(userId);
    long t2 = System.currentTimeMillis();

    // 查询订单
    List<Order> orders = orderService.queryOrders(userId);
    long t3 = System.currentTimeMillis();

    // 查询商品信息
    Map<Long, Product> productMap = productService.batchGetProducts(orders);
    long t4 = System.currentTimeMillis();

    // 数据组装
    List<OrderVO> result = assembleOrders(orders, productMap);
    long t5 = System.currentTimeMillis();

    log.info("listOrders 耗时分解: auth={}ms, queryOrders={}ms, " +
             "getProducts={}ms, assemble={}ms, total={}ms",
             t2 - t1, t3 - t2, t4 - t3, t5 - t4, t5 - start);

    return Result.success(result);
}
```

日志输出：

```
listOrders 耗时分解: auth=30ms, queryOrders=2800ms, getProducts=200ms, assemble=150ms, total=3180ms
```

这种临时打点虽然土，但非常有效。上线后保留这些日志，后续排查效率会大大提升。

### 2.3 使用 Arthas 临时诊断

如果连日志打点都没加，Arthas 可以在不停机的情况下帮你定位：

```bash
# 启动 Arthas
java -jar arthas-boot.jar

# 监控方法执行耗时
trace com.example.controller.OrderController listOrders -n 5
```

输出：

```
`---[3250ms] com.example.controller.OrderController:listOrders()
    +---[30ms] com.example.service.AuthService:authenticate()
    +---[2800ms] com.example.service.OrderService:queryOrders()
    |   `---[500ms] com.example.pool.ConnectionPool:getConnection()
    |   `---[2300ms] com.example.mapper.OrderMapper:selectByUserId()
    +---[200ms] com.example.service.ProductService:batchGetProducts()
    `---[150ms] com.example.controller.OrderController:assembleOrders()
```

完美还原每一层的耗时！

## 三、慢 SQL 定位与优化

慢 SQL 是接口慢的最常见原因，占比通常超过 50%。

### 3.1 开启慢查询日志

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL long_query_time = 1;  -- 超过 1 秒的查询记录
```

### 3.2 分析慢查询日志

```bash
# 使用 mysqldumpslow 分析
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log
```

输出示例：

```
Count: 245  Time=2.35s (575s)  Lock=0.01s (2s)  Rows=15000.0 (3675000)
  SELECT * FROM orders WHERE user_id = N AND status = 'S' ORDER BY create_time DESC
```

这条 SQL 执行了 245 次，平均 2.35 秒，总共消耗了 575 秒——这就是罪魁祸首。

### 3.3 EXPLAIN 分析执行计划

```sql
EXPLAIN SELECT * FROM orders
WHERE user_id = 12345 AND status = 'PAID'
ORDER BY create_time DESC;
```

重点关注：

| 列 | 值 | 含义 |
|---|---|---|
| type | ALL | 全表扫描，最差情况 |
| key | NULL | 没用索引 |
| rows | 1500000 | 扫描了 150 万行 |
| Extra | Using filesort | 需要额外排序 |

### 3.4 优化方案

**添加联合索引：**

```sql
-- 原来没有合适索引，加一个联合索引
ALTER TABLE orders ADD INDEX idx_user_status_time (user_id, status, create_time);
```

加完索引后再 EXPLAIN：

| 列 | 值 | 含义 |
|---|---|---|
| type | ref | 使用了非唯一索引 |
| key | idx_user_status_time | 走了新索引 |
| rows | 50 | 只扫描了 50 行 |
| Extra | (空) | 无 filesort |

SQL 从 2.3 秒降到 5 毫秒。

**避免 SELECT \*：**

```java
// 错误：查出大量不需要的字段
@Select("SELECT * FROM orders WHERE user_id = #{userId}")
List<Order> selectByUserId(Long userId);

// 正确：只查需要的字段
@Select("SELECT id, order_no, amount, status, create_time " +
        "FROM orders WHERE user_id = #{userId} AND status = #{status} " +
        "ORDER BY create_time DESC")
List<Order> selectByUserIdAndStatus(@Param("userId") Long userId,
                                     @Param("status") String status);
```

**分页优化——深分页问题：**

```sql
-- 慢：深分页，需要扫描前 100000 条
SELECT * FROM orders ORDER BY id LIMIT 100000, 20;

-- 快：使用游标分页（延迟关联）
SELECT * FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY id LIMIT 100000, 20
) t ON o.id = t.id;
```

## 四、锁等待导致的接口慢

### 4.1 synchronized 锁竞争

```java
// 问题代码：高并发下所有请求排队
public class OrderService {
    public synchronized void createOrder(Order order) {
        // 这里做了大量 IO 操作，但整个方法都被锁住
        validateOrder(order);      // 50ms
        saveToDB(order);           // 100ms
        sendMQ(order);             // 50ms
        sendEmail(order);          // 200ms
    }
}
// QPS 200 时，平均等待时间 = 200 * 400ms = 80秒！
```

**排查方式：jstack 分析线程状态**

```bash
jstack <PID> | grep -A 5 "BLOCKED"
```

如果看到大量 BLOCKED 状态的线程，就是锁竞争导致的。

**修复：缩小锁粒度**

```java
public void createOrder(Order order) {
    validateOrder(order);  // 不需要加锁

    synchronized (this) {
        saveToDB(order);   // 只有写库需要加锁
    }                     // 锁持有时间从 400ms 降到 100ms

    sendMQ(order);        // 不需要加锁
    sendEmail(order);     // 不需要加锁
}
```

### 4.2 数据库行锁等待

```sql
-- 查看当前锁等待
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
SELECT * FROM information_schema.INNODB_LOCKS;

-- 查看正在执行的事务
SELECT * FROM information_schema.INNODB_TRX;

-- MySQL 8.0+
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM performance_schema.data_locks;
```

如果发现某条 UPDATE 语句长时间持有行锁，需要检查：

- 是否有长事务未提交
- 是否有慢 SQL 在事务中执行
- 是否可以用批量操作替代循环单条操作

## 五、GC 导致的接口慢

### 5.1 GC 问题表现

GC 导致的接口慢有一个明显特征：**间歇性**的延迟飙升。大部分请求正常，偶尔一批请求同时变慢。

```
正常: 50ms, 52ms, 48ms, 51ms, 49ms
飙升: 50ms, 1200ms, 1350ms, 1100ms, 50ms, 52ms  ← 这一段是 GC
```

### 5.2 排查 GC 日志

```bash
# 查看当前 JVM 参数
jcmd <PID> VM.flags

# 开启 GC 日志（JDK 11+）
java -Xlog:gc*=info,gc+heap=debug:file=/var/log/gc.log:time,uptime:filecount=10,filesize=100M ...

# JDK 8
-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:/var/log/gc.log
```

**GC 日志分析：**

```
[2026-06-27T10:15:30.123+0800] GC(42) Pause Full (G1 Compaction Pause)
[2026-06-27T10:15:30.123+0800] GC(42)   Before: 4G->2G(6G)
[2026-06-27T10:15:30.123+0800] GC(42)   After:  2G->1.5G(6G)
[2026-06-27T10:15:31.456+0800] GC(42)   Pause Full 4G->1.5G(6G) 1333ms  ← Full GC 停了 1.3 秒！
```

### 5.3 常见 GC 问题与修复

**问题一：频繁 Young GC**

```
原因：新生代太小，对象频繁进入老年代
解决：增大新生代 -Xmn 或调整 G1 region size
```

**问题二：Full GC 频繁**

```
原因：老年代空间不足，大对象直接进老年代
解决：
  - 检查是否有大对象（大数组、大 List）
  - 增大堆内存 -Xmx
  - 设置大对象阈值 -XX:G1HeapRegionSize=16m
```

**问题三：GC 停顿过长**

```
原因：堆太大，单次 GC 扫描时间长
解决：
  - G1: 设置停顿目标 -XX:MaxGCPauseMillis=200
  - ZGC: 适用于大堆，停顿 < 10ms（JDK 15+）
  - ParallelGC: 吞吐量优先，适合后台任务
```

### 5.4 使用 jstat 实时监控

```bash
# 每秒打印 GC 统计
jstat -gcutil <PID> 1000

  S0     S1     E      O      M     CCS    YGC   YGCT    FGC   FGCT    GCT
  0.00  98.44  67.23  45.12  94.56  91.23   234  12.345    5   3.456  15.801
```

如果 FGC（Full GC 次数）持续增长，FGCT（Full GC 总时间）很大，说明 GC 有严重问题。

## 六、网络与序列化耗时

### 6.1 RPC 调用耗时

```java
// 问题：循环调用 RPC
public List<OrderVO> getOrderList(Long userId) {
    List<Order> orders = orderMapper.selectByUserId(userId);

    List<OrderVO> result = new ArrayList<>();
    for (Order order : orders) {
        // 每个订单都调一次商品服务 → 50 个订单就是 50 次 RPC
        Product product = productRpcService.getProduct(order.getProductId());
        result.add(convert(order, product));
    }
    return result;
}
```

如果每次 RPC 30ms，50 个订单就是 1.5 秒。

**修复：批量调用**

```java
public List<OrderVO> getOrderList(Long userId) {
    List<Order> orders = orderMapper.selectByUserId(userId);

    // 批量获取所有商品信息，一次 RPC
    Set<Long> productIds = orders.stream()
        .map(Order::getProductId)
        .collect(Collectors.toSet());
    Map<Long, Product> productMap = productRpcService.batchGetProducts(productIds);

    List<OrderVO> result = new ArrayList<>();
    for (Order order : orders) {
        result.add(convert(order, productMap.get(order.getProductId())));
    }
    return result;
}
```

从 50 次 RPC 降为 1 次，耗时从 1.5 秒降到 30ms。

### 6.2 序列化耗时

```java
// 问题：返回大量数据，JSON 序列化耗时
@GetMapping("/api/order/export")
public List<OrderVO> exportAllOrders() {
    // 返回 10 万条数据
    List<Order> orders = orderMapper.selectAll();
    return convertToVOList(orders);  // Jackson 序列化 10 万条 = 800ms+
}
```

**修复方案：**

```java
// 方案一：分页返回
@GetMapping("/api/order/list")
public PageResult<OrderVO> listOrders(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size) {
    return orderService.pageQuery(page, size);
}

// 方案二：使用更快的序列化框架
// 对于内部 RPC，使用 Protobuf 替代 JSON
// 对于 HTTP 接口，考虑使用 Jackson 的 Afterburner 模块

// 方案三：流式返回（适合导出场景）
@GetMapping("/api/order/export")
public void exportOrders(HttpServletResponse response) {
    response.setContentType("text/csv");
    try (PrintWriter writer = response.getWriter()) {
        // 分批查询 + 流式写入
        int page = 1;
        List<Order> batch;
        do {
            batch = orderMapper.selectByPage(page++, 1000);
            for (Order order : batch) {
                writer.println(toCsvLine(order));
            }
            writer.flush();  // 及时刷新缓冲区
        } while (!batch.isEmpty());
    }
}
```

## 七、容器层问题：Tomcat 线程池

### 7.1 线程池耗尽

```yaml
# Spring Boot 默认配置
server:
  tomcat:
    threads:
      max: 200        # 最大线程数
      min-spare: 10   # 最小空闲线程
    accept-count: 100 # 接收队列长度
```

当并发请求超过 200，多余的请求进入 accept-count 队列；队列也满了，新请求直接返回 503。

**排查方式：**

```java
// 通过 JMX 监控 Tomcat 线程池
@Bean
public void monitorTomcat() {
    MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();
    ObjectName name = new ObjectName("Tomcat:type=ThreadPool,name=\"http-nio-8080\"");
    int activeThreads = (int) mbs.getAttribute(name, "activeCount");
    int maxThreads = (int) mbs.getAttribute(name, "maxThreads");
    log.info("Tomcat 线程池: {}/{}", activeThreads, maxThreads);
}
```

**修复方案：**

```yaml
server:
  tomcat:
    threads:
      max: 500       # 根据压测结果调整
      min-spare: 50
    accept-count: 200
    max-connections: 10000
    connection-timeout: 5000  # 5 秒超时
```

### 7.2 异步处理释放线程

对于耗时较长的接口（如报表导出、批量处理），使用异步处理：

```java
@GetMapping("/api/report/generate")
public Result<String> generateReport(@RequestParam String type) {
    String taskId = reportService.submitReportTask(type);
    return Result.success(taskId);  // 立即返回任务 ID
}

@GetMapping("/api/report/status")
public Result<ReportStatus> getReportStatus(@RequestParam String taskId) {
    return Result.success(reportService.getTaskStatus(taskId));
}
```

## 八、缓存层问题

### 8.1 缓存击穿

热点 key 过期瞬间，大量请求穿透到数据库：

```java
// 问题代码
public Product getProduct(Long id) {
    Product product = redisTemplate.get("product:" + id);
    if (product == null) {
        // 缓存 miss，查数据库
        product = productMapper.selectById(id);
        if (product != null) {
            redisTemplate.set("product:" + id, product, 30, TimeUnit.MINUTES);
        }
    }
    return product;
}
```

**修复：使用互斥锁防止击穿**

```java
public Product getProduct(Long id) {
    String key = "product:" + id;
    Product product = redisTemplate.get(key);
    if (product != null) {
        return product;
    }

    // 获取分布式锁，只让一个线程去查数据库
    String lockKey = "lock:product:" + id;
    try {
        boolean locked = redisTemplate.setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        if (!locked) {
            // 没拿到锁，短暂等待后重试
            Thread.sleep(50);
            return getProduct(id);
        }

        // 双重检查
        product = redisTemplate.get(key);
        if (product != null) {
            return product;
        }

        product = productMapper.selectById(id);
        if (product != null) {
            redisTemplate.set(key, product, 30, TimeUnit.MINUTES);
        }
        return product;
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("获取产品信息被中断", e);
    } finally {
        redisTemplate.delete(lockKey);
    }
}
```

### 8.2 缓存穿透

查询不存在的数据，每次都打到数据库：

```java
// 修复：缓存空值
public Product getProduct(Long id) {
    String key = "product:" + id;
    Object cached = redisTemplate.get(key);

    if (cached != null) {
        if (cached == NULL_PLACEHOLDER) {
            return null;  // 缓存的空值
        }
        return (Product) cached;
    }

    Product product = productMapper.selectById(id);
    if (product != null) {
        redisTemplate.set(key, product, 30, TimeUnit.MINUTES);
    } else {
        // 缓存空值，短过期时间
        redisTemplate.set(key, NULL_PLACEHOLDER, 5, TimeUnit.MINUTES);
    }
    return product;
}
```

## 九、排查工具箱速查表

| 工具 | 用途 | 命令 |
|------|------|------|
| jstack | 线程快照 | `jstack <PID>` |
| jstat | GC 监控 | `jstat -gcutil <PID> 1000` |
| jmap | 内存快照 | `jmap -dump:format=b,file=heap.hprof <PID>` |
| Arthas | 在线诊断 | `trace`、`watch`、`monitor` |
| SkyWalking | 全链路追踪 | APM 平台 |
| slow log | 慢 SQL | `SHOW VARIABLES LIKE 'slow_query_log%'` |
| EXPLAIN | SQL 执行计划 | `EXPLAIN SELECT ...` |
| tcpdump | 网络抓包 | `tcpdump -i eth0 port 3306` |
| Wireshark | 抓包分析 | GUI 工具 |
| vmstat | 系统负载 | `vmstat 1` |

## 十、面试要点总结

### Q1：线上接口响应慢，你怎么排查？

分层排查：
1. 先看 APM 全链路追踪，定位耗时在哪个环节
2. 如果是数据库，看慢查询日志 + EXPLAIN
3. 如果是应用层，用 Arthas trace 定位方法耗时
4. 如果是 GC，看 GC 日志 + jstat
5. 如果是网络，看 TCP 层延迟

### Q2：慢 SQL 如何优化？

- EXPLAIN 分析执行计划，确保走索引
- 添加合适的联合索引（注意最左前缀原则）
- 避免 SELECT *，只查需要的字段
- 深分页用游标分页或延迟关联
- 大表考虑分库分表

### Q3：如何排查 GC 导致的接口慢？

- 开启 GC 日志，分析 Full GC 频率和停顿时间
- jstat -gcutil 实时监控各区域使用率
- 如果 Full GC 频繁，检查是否有内存泄漏
- 考虑切换 GC 算法（G1 → ZGC）

### Q4：缓存击穿、穿透、雪崩的区别？

- **击穿**：热点 key 过期，大量请求穿透到 DB → 互斥锁
- **穿透**：查询不存在的数据 → 缓存空值 / 布隆过滤器
- **雪崩**：大量 key 同时过期 → 过期时间加随机值

### Q5：如何避免循环调用 RPC？

使用批量接口。先收集所有需要的产品 ID，一次性批量查询，将 N 次 RPC 降为 1 次。这是接口优化中投入产出比最高的手段之一。

## 十一、总结

接口慢排查的核心思路是 **分层定位、逐层排除**：

1. **先看全貌**：APM 链路追踪或日志打点，定位耗时在哪一层
2. **数据库层**：慢查询日志 + EXPLAIN，这是最常见的原因
3. **应用层**：锁等待、循环 RPC、大对象序列化
4. **JVM 层**：GC 停顿、堆内存配置
5. **网络层**：TCP 延迟、DNS 解析、连接建立

记住一个原则：**不要猜测，要用数据说话**。先打点、先看监控，有了数据再下结论。经验会告诉你大概率是慢 SQL，但数据会让你不遗漏那些低概率但高影响的根因。
