---
title: "分库分表实战：ShardingSphere 使用指南"
tag: ["MySQL", "ShardingSphere", "分库分表", "数据库", "分布式"]
category: 数据库
date: 2026-06-27
---

# 分库分表实战：ShardingSphere 使用指南

> 分库分表实战：ShardingSphere 使用指南是系统设计的核心，它决定了数据的存储方式和访问效率。
> 本文介绍了分库分表实战：ShardingSphere 使用指南的原理和最佳实践，帮助你构建高效的数据存储方案。

MySQL 单库单表会遇到以下瓶颈：

| 维度 | 瓶颈点 | 表现 |
|------|--------|------|
| **数据量** | 单表 > 1000 万行 | 查询变慢，索引膨胀 |
| **写入** | 单库写入 QPS > 5000 | 主从延迟大，锁竞争 |
| **连接数** | max_connections 不够 | 应用获取连接超时 |
| **磁盘** | 单机磁盘空间不足 | 无法写入新数据 |
| **DDL** | 大表 DDL 耗时长 | 加字段/索引导致阻塞 |

### 1.2 分库分表的本质

```
分库：解决连接数、写入 QPS、磁盘空间问题
分表：解决单表数据量大、查询慢的问题
```

**先垂直再水平：**

```
垂直分库：按业务拆分（订单库、用户库、商品库）
垂直分表：按字段拆分（热字段 vs 冷字段）
水平分库：同一个表的数据分散到不同数据库实例
水平分表：同一个表的数据分散到多张表
```

### 1.3 分库分表带来的挑战

分库分表不是银弹，它带来了新的问题：

- **跨库 JOIN**：不同库的表无法直接 JOIN
- **分布式事务**：跨库写入需要分布式事务保证
- **全局唯一 ID**：自增 ID 不再适用
- **跨库分页排序**：limit 100000, 10 需要每个分片查 100010 条
- **数据迁移**：从单库迁移到分库需要方案

ShardingSphere 就是为了解决这些挑战而生的。

## 二、ShardingSphere 概述

### 2.1 两种部署模式

| 模式 | 说明 | 特点 |
|------|------|------|
| **ShardingSphere-JDBC** | 客户端分片，以 jar 包嵌入应用 | 性能好，无额外中间件，每个应用需配置 |
| **ShardingSphere-Proxy** | 代理层分片，应用连接 Proxy | 应用无感知，多语言支持，多一跳网络 |

**选型建议：**
- 单一 Java 技术栈 → ShardingSphere-JDBC
- 多语言技术栈 → ShardingSphere-Proxy
- 追求极致性能 → ShardingSphere-JDBC
- 运维统一管理 → ShardingSphere-Proxy
- 混合使用 → JDBC + Proxy 混合部署

### 2.2 核心概念

```
逻辑表：orders（开发者看到的表名）
物理表：orders_0, orders_1, orders_2...（实际存在的表）
数据节点：ds_0.orders_0, ds_1.orders_1（库.表）
分片键：user_id（用于决定数据路由的字段）
分片算法：决定数据落到哪个分片的规则
```

## 三、分片策略详解

### 3.1 分片键选择

分片键是分库分表最重要的决策：

**选分片键的原则：**
1. **查询条件经常包含的字段**：避免全表路由
2. **数据分布均匀的字段**：避免数据倾斜
3. **不可变字段**：避免数据迁移

```sql
-- ❌ 错误选择：用 status 做分片键
-- status 只有几个值，数据严重倾斜
-- 大部分查询不以 status 为条件，需要广播到所有分片

-- ✅ 正确选择：用 user_id 做分片键
-- user_id 分布均匀
-- 大部分查询都是"查某个用户的订单"，能精确路由
SELECT * FROM orders WHERE user_id = 100 AND status = 'PAID';
```

### 3.2 分片算法

**1. 取模分片**

```java
// user_id % 分片数 = 分片序号
// 4 个分片：user_id=100 → 100%4=0 → 分片0
//          user_id=101 → 101%4=1 → 分片1
```

优点：数据均匀分布
缺点：扩容时需要重新分配所有数据

**2. 范围分片**

```java
// user_id 1-1000万 → 分片0
// user_id 1000万-2000万 → 分片1
```

优点：扩容简单，新数据写新分片
缺点：可能数据倾斜（热点数据集中在某个范围）

**3. 一致性哈希分片**

```java
// 用一致性哈希环，节点增减时只影响相邻数据
```

优点：扩缩容时迁移数据量少
缺点：实现复杂

**4. 行表达式分片（最常用）**

```groovy
// 分库：ds_${user_id % 2}
// 分表：orders_${user_id % 4}
```

## 四、ShardingSphere-JDBC 实战

### 4.1 引入依赖

```xml
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc</artifactId>
    <version>5.5.0</version>
</dependency>
```

### 4.2 Spring Boot 配置

**方式一：YAML 配置**

```yaml
spring:
  datasource:
    driver-class-name: org.apache.shardingsphere.driver.ShardingSphereDriver
    url: jdbc:shardingsphere:classpath:sharding-config.yaml

# sharding-config.yaml（放在 resources 目录下）
dataSources:
  ds_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://192.168.1.10:3306/order_db_0
    username: root
    password: ${MYSQL_PASSWORD}
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  
  ds_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://192.168.1.11:3306/order_db_1
    username: root
    password: ${MYSQL_PASSWORD}
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1

rules:
  - !SHARDING
    tables:
      orders:
        # 数据节点：2库 × 4表 = 8个分片
        actualDataNodes: ds_${0..1}.orders_${0..3}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: db_mod
        tableStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: table_mod
        keyGenerateStrategy:
          column: id
          keyGeneratorName: snowflake
    
    # 分片算法
    shardingAlgorithms:
      db_mod:
        type: MOD
        props:
          sharding-count: 2        # 分库数
      table_mod:
        type: MOD
        props:
          sharding-count: 4        # 分表数
    
    # 分布式 ID 生成器
    keyGenerators:
      snowflake:
        type: SNOWFLAKE
        props:
          worker-id: 1
    
    # 广播表（所有库都有全量数据的表）
    broadcastTables:
      - dict_order_status
      - dict_payment_type
    
    # 绑定表（关联表用相同分片键和分片算法，保证 JOIN 时在同一分片）
    bindingTables:
      - orders,order_items
```

**方式二：Java 代码配置**

```java
@Configuration
public class ShardingSphereConfig {

    @Bean
    public DataSource dataSource() throws SQLException {
        // 1. 配置数据源
        Map<String, DataSource> dataSourceMap = new HashMap<>();
        dataSourceMap.put("ds_0", createDataSource("192.168.1.10:3306/order_db_0"));
        dataSourceMap.put("ds_1", createDataSource("192.168.1.11:3306/order_db_1"));

        // 2. 配置分片规则
        ShardingRuleConfiguration shardingConfig = new ShardingRuleConfiguration();
        shardingConfig.getTables().add(getOrderTableRuleConfiguration());
        shardingConfig.getTables().add(getOrderItemTableRuleConfiguration());

        // 3. 配置分片算法
        shardingConfig.getShardingAlgorithms().put("db_mod", 
            new AlgorithmConfiguration("MOD", PropertiesBuilder.build(
                new Property("sharding-count", "2"))));
        shardingConfig.getShardingAlgorithms().put("table_mod", 
            new AlgorithmConfiguration("MOD", PropertiesBuilder.build(
                new Property("sharding-count", "4"))));

        // 4. 配置分布式 ID
        shardingConfig.getKeyGenerators().put("snowflake", 
            new AlgorithmConfiguration("SNOWFLAKE", PropertiesBuilder.build(
                new Property("worker-id", "1"))));

        // 5. 绑定表
        shardingConfig.getBindingTables().add(new ShardingTableReferenceRuleConfiguration(
            "orders,order_items"));

        // 6. 广播表
        shardingConfig.getBroadcastTables().add("dict_order_status");

        // 7. 创建数据源
        return ShardingSphereDataSourceFactory.createDataSource(
            dataSourceMap, Arrays.asList(shardingConfig), 
            new Properties());
    }

    private ShardingTableRuleConfiguration getOrderTableRuleConfiguration() {
        ShardingTableRuleConfiguration config = new ShardingTableRuleConfiguration(
            "orders", "ds_${0..1}.orders_${0..3}");
        config.setDatabaseShardingStandard(new ShardingStandardConfiguration(
            "user_id", "db_mod", null));
        config.setTableShardingStandard(new ShardingStandardConfiguration(
            "user_id", "table_mod", null));
        config.setKeyGenerateStrategy(new KeyGenerateStrategyConfiguration(
            "id", "snowflake"));
        return config;
    }

    private DataSource createDataSource(String url) {
        HikariDataSource ds = new HikariDataSource();
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setJdbcUrl("jdbc:mysql://" + url);
        ds.setUsername("root");
        ds.setPassword("password");
        ds.setMaximumPoolSize(50);
        return ds;
    }
}
```

### 4.3 使用示例

配置好后，开发者**完全无感知**，像操作单表一样写 SQL：

```java
@Service
public class OrderService {

    @Autowired
    private OrderMapper orderMapper;

    public void createOrder(Order order) {
        // 不用关心路由，ShardingSphere 自动处理
        orderMapper.insert(order);
        // id 自动生成（Snowflake），user_id 决定路由到哪个分片
    }

    public Order getOrder(Long id, Long userId) {
        // 必须带分片键 user_id，否则会广播到所有分片
        return orderMapper.selectByIdAndUserId(id, userId);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        // 精确路由：只查一个分片
        return orderMapper.selectByUserId(userId);
    }

    public List<Order> getAllOrders() {
        // ❌ 广播路由：查所有分片，然后归并
        // 性能差，生产慎用
        return orderMapper.selectAll();
    }
}
```

```java
@Mapper
public interface OrderMapper {
    @Insert("INSERT INTO orders (id, user_id, amount, status, created_at) " +
            "VALUES (#{id}, #{userId}, #{amount}, #{status}, #{createdAt})")
    void insert(Order order);

    @Select("SELECT * FROM orders WHERE id = #{id} AND user_id = #{userId}")
    Order selectByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT * FROM orders WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<Order> selectByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM orders WHERE status = #{status}")
    List<Order> selectByStatus(@Param("status") String status);
}
```

## 五、ShardingSphere-Proxy 实战

### 5.1 部署 Proxy

```yaml
# server.yaml
mode:
  type: Cluster
  repository:
    type: ZooKeeper
    props:
      namespace: governance_ds
      server-lists: zk1:2181,zk2:2181,zk3:2181
      retryIntervalMilliseconds: 500
      timeToLiveSeconds: 60
      maxRetries: 3
      operationTimeoutMilliseconds: 500

authority:
  users:
    - user: root@%
      password: root_password
    - user: app
      password: app_password
  privilege:
    type: ALL_PERMITTED

props:
  max-connections-size-per-query: 1
  kernel-executor-size: 16
  proxy-frontend-flush-threshold: 128
  sql-show: true                  # 打印实际路由 SQL（调试用）
```

```yaml
# config-sharding.yaml
dataSources:
  ds_0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://192.168.1.10:3306/order_db_0
    username: root
    password: ${MYSQL_PASSWORD}
  ds_1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://192.168.1.11:3306/order_db_1
    username: root
    password: ${MYSQL_PASSWORD}

rules:
  - !SHARDING
    tables:
      orders:
        actualDataNodes: ds_${0..1}.orders_${0..3}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: db_mod
        tableStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: table_mod
        keyGenerateStrategy:
          column: id
          keyGeneratorName: snowflake
    shardingAlgorithms:
      db_mod:
        type: MOD
        props:
          sharding-count: 2
      table_mod:
        type: MOD
        props:
          sharding-count: 4
    keyGenerators:
      snowflake:
        type: SNOWFLAKE
```

```bash
# 启动 Proxy
tar -xzf apache-shardingsphere-proxy-5.5.0-bin.tar.gz
cd apache-shardingsphere-proxy-5.5.0-bin
# 放入 MySQL JDBC 驱动到 lib 目录
cp mysql-connector-j-8.4.0.jar lib/
# 启动
bin/start.sh
# 默认监听 3307 端口
```

应用连接 Proxy 就像连普通 MySQL 一样：

```yaml
spring:
  datasource:
    url: jdbc:mysql://192.168.1.20:3307/order_db
    username: app
    password: app_password
```

## 六、核心功能详解

### 6.1 分布式主键

ShardingSphere 内置了 Snowflake（雪花算法）ID 生成器：

```java
// 雪花算法 ID 结构（64位）：
// | 1位符号 | 41位时间戳 | 10位机器ID | 12位序列号 |
// 每毫秒可生成 4096 个 ID，不重复

// 配置
keyGenerators:
  snowflake:
    type: SNOWFLAKE
    props:
      worker-id: 1              # 工作机器 ID
      max-vibration-offset: 1   # 最大抖动上限值（提升生成速度）
      max-tolerate-time-difference-milliseconds: 10  # 时钟回拨容忍
```

**避坑：时钟回拨**

雪花算法依赖时间戳，如果服务器时间回拨（NTP 同步），可能生成重复 ID。ShardingSphere 内置了时钟回拨容忍机制，但最好确保服务器时间同步可靠。

### 6.2 绑定表

绑定表是分片规则相同的表，JOIN 时可以避免笛卡尔积路由：

```sql
-- orders 和 order_items 都用 user_id 分片，分片数相同
-- 配置为绑定表后，JOIN 时精确路由到同一分片

-- 配置了绑定表：
SELECT o.*, oi.* FROM orders o 
JOIN order_items oi ON o.id = oi.order_id 
WHERE o.user_id = 100;
-- 路由到 1 个分片，高效

-- 没配置绑定表：
-- 路由到 4 个分片的笛卡尔积 = 16 次查询，低效
```

### 6.3 广播表

字典表、配置表等小表，在每个库都存一份全量数据：

```yaml
broadcastTables:
  - dict_order_status
  - dict_payment_type
  - sys_config
```

```sql
-- 查询只查一个分片
SELECT * FROM dict_order_status;
-- 结果从任意一个数据源返回

-- 写入广播到所有分片
INSERT INTO dict_order_status VALUES (5, 'REFUNDED');
-- 所有数据源都执行这条 INSERT
```

### 6.4 读写分离

ShardingSphere 支持分库分表 + 读写分离：

```yaml
rules:
  - !SHARDING
    tables:
      orders:
        actualDataNodes: ms_ds_${0..1}.orders_${0..3}
        # ...
  
  - !READWRITE_SPLITTING
    dataSources:
      ms_ds_0:
        writeDataSourceName: ds_0
        readDataSourceNames:
          - ds_0_read_0
          - ds_0_read_1
        loadBalancerName: round_robin
      ms_ds_1:
        writeDataSourceName: ds_1
        readDataSourceNames:
          - ds_1_read_0
          - ds_1_read_1
        loadBalancerName: round_robin
    loadBalancers:
      round_robin:
        type: ROUND_ROBIN
```

**读写分离注意：**
- 写操作走主库，读操作走从库
- 主从延迟可能导致读不到刚写入的数据
- 强一致读场景需要走主库（Hint 强制路由）

```java
// 强制走主库
HintManager hintManager = HintManager.getInstance();
hintManager.addWriteOnly();
try {
    order = orderMapper.selectById(id);
} finally {
    hintManager.close();
}
```

## 七、跨库查询与数据迁移

### 7.1 跨库查询的挑战

```sql
-- ❌ 不带分片键的查询：广播到所有分片
SELECT * FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 10;
-- 每个分片查 10 条，归并后返回 10 条

-- ❌ 跨库 JOIN：不同分片的表无法 JOIN
SELECT o.*, u.name FROM orders o 
JOIN users u ON o.user_id = u.id   -- users 在另一个库
WHERE o.status = 'PAID';

-- ❌ 跨库分页：LIMIT 1000000, 10
-- 每个分片查 100010 条，归并后取 10 条
-- 4 个分片 × 100010 = 40 万行数据在内存中排序
```

### 7.2 跨库查询解决方案

**方案一：绑定表 + 广播表**

```sql
-- users 是广播表（每个库都有全量）
SELECT o.*, u.name FROM orders o 
JOIN users u ON o.user_id = u.id
WHERE o.user_id = 100;
-- 本地 JOIN，无跨库问题

-- orders 和 order_items 是绑定表
SELECT o.*, oi.product_name FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 100;
-- 同一分片 JOIN
```

**方案二：应用层组装**

```java
public OrderDetail getOrderDetail(Long orderId, Long userId) {
    // 1. 查订单（精确路由）
    Order order = orderMapper.selectByIdAndUserId(orderId, userId);
    
    // 2. 查用户（走用户库）
    User user = userMapper.selectById(order.getUserId());
    
    // 3. 查订单项（绑定表，同一分片）
    List<OrderItem> items = orderItemMapper.selectByOrderId(orderId, userId);
    
    // 4. 应用层组装
    return OrderDetail.builder()
        .order(order)
        .user(user)
        .items(items)
        .build();
}
```

**方案三：Elasticsearch 辅助查询**

```java
// 复杂查询走 ES，简单查询走 MySQL
public Page<Order> searchOrders(OrderSearchRequest request) {
    // 1. ES 搜索（支持复杂条件、排序、分页）
    List<Long> orderIds = elasticSearchClient.search(
        "orders", request.toQueryBuilder(), request.getPage());
    
    if (orderIds.isEmpty()) {
        return Page.empty();
    }
    
    // 2. MySQL 取完整数据（IN 查询）
    List<Order> orders = orderMapper.selectByIds(orderIds);
    
    // 3. 按 ES 的顺序排序
    return sortByIds(orders, orderIds);
}
```

### 7.3 数据迁移方案

从单库迁移到分库分表：

```java
@Service
public class DataMigrationService {

    @Autowired
    private OldOrderMapper oldMapper;   // 旧数据源
    @Autowired
    private NewOrderMapper newMapper;   // ShardingSphere 数据源

    /**
     * 双写迁移方案
     */
    public void migrate() {
        // 阶段1：存量数据迁移
        int page = 0, size = 1000;
        while (true) {
            List<Order> batch = oldMapper.selectPage(page, size);
            if (batch.isEmpty()) break;
            
            for (Order order : batch) {
                // 双写：旧库和新库同时写
                newMapper.insert(order);
            }
            
            log.info("迁移进度: page={}, 已迁移={}", page, (page + 1) * size);
            page++;
        }

        // 阶段2：增量同步（通过 Canal 监听 binlog）
        // canal client 消费 binlog，实时同步到新库
        
        // 阶段3：校验数据一致性
        // 对比新旧库数据条数、抽样校验
        
        // 阶段4：切读流量
        // 先切 10% 读流量到新库，观察，逐步增加到 100%
        
        // 阶段5：切写流量
        // 停止双写，所有写入走新库
        
        // 阶段6：下线旧库
    }
}
```

**双写迁移的关键步骤：**

```
1. 存量迁移：批量迁移历史数据
2. 增量同步：Canal 监听 binlog 实时同步
3. 数据校验：Count 对比 + 抽样对比
4. 灰度切读：10% → 50% → 100%
5. 切写：停止双写，新库为主
6. 下线旧库：观察一段时间后下线
```

## 八、分布式事务

### 8.1 XA 事务（强一致）

```yaml
# 开启 XA 事务管理
props:
  xa-transaction-manager-type: Atomikos
```

```java
@Service
public class OrderService {

    @Transactional
    @ShardingSphereTransactionType(TransactionType.XA)  // 使用 XA 事务
    public void createOrder(Order order, List<OrderItem> items) {
        orderMapper.insert(order);           // 可能路由到 ds_0
        for (OrderItem item : items) {
            orderItemMapper.insert(item);    // 可能路由到 ds_1
        }
        // XA 保证两个库要么同时成功，要么同时回滚
    }
}
```

**XA 的缺点：** 性能差（需要两阶段提交），不适合高并发场景。

### 8.2 Seata AT 模式（推荐）

```yaml
# 配置 Seata
props:
  xa-transaction-manager-type: Seata
```

```java
@Service
public class OrderService {

    @GlobalTransactional   // Seata 全局事务
    @ShardingSphereTransactionType(TransactionType.BASE)
    public void createOrder(Order order) {
        orderMapper.insert(order);           // 扣库存（ds_0）
        inventoryMapper.deduct(order.getProducts());  // 减库存（ds_1）
        // Seata AT 模式：自动生成回滚 SQL，最终一致
    }
}
```

### 8.3 本地事务 + 消息队列（最终一致）

```java
@Service
public class OrderService {

    @Transactional
    public void createOrder(Order order) {
        // 本地事务：订单库写入
        orderMapper.insert(order);
        
        // 发送消息：异步处理库存
        mqProducer.send("inventory-deduct", new InventoryEvent(order));
        // 库存服务消费消息，幂等处理
    }
}
```

**三种方案对比：**

| 方案 | 一致性 | 性能 | 复杂度 | 适用场景 |
|------|--------|------|--------|----------|
| XA | 强一致 | 差 | 中 | 资金核心 |
| Seata AT | 最终一致 | 中 | 中 | 通用业务 |
| 本地消息表 | 最终一致 | 好 | 高 | 高并发 |

## 九、避坑指南

### 9.1 不带分片键的查询

```java
// ❌ 广播路由，查所有分片
orderMapper.selectByStatus("PAID");

// ✅ 带分片键，精确路由
orderMapper.selectByUserIdAndStatus(userId, "PAID");
```

**如果必须不带分片键查询？** 用 ES 或 Redis 做二级索引。

### 9.2 跨库分页性能问题

```java
// ❌ 深分页跨库：每个分片查 100020 条
List<Order> orders = orderMapper.selectAllOrderPaged(1000000, 20);

// ✅ 改为基于分片键的游标分页
// 记住上一页最后的 user_id，下一页从该 id 开始
List<Order> orders = orderMapper.selectOrdersAfterUserId(lastUserId, 20);
```

### 9.3 事务范围控制

```java
// ❌ 大事务：跨多个分片，持有锁时间长
@Transactional
public void batchCreateOrders(List<Order> orders) {
    for (Order order : orders) {
        orderMapper.insert(order);  // 可能路由到不同分片
    }
    // 1000 个订单，可能涉及 8 个分片的锁
}

// ✅ 小事务：分批处理
public void batchCreateOrders(List<Order> orders) {
    Lists.partition(orders, 100).forEach(batch -> {
        transactionTemplate.execute(status -> {
            batch.forEach(orderMapper::insert);
            return null;
        });
    });
}
```

### 9.4 索引和约束限制

```sql
-- ❌ 跨库的唯一约束无法生效
-- user_id=100 的订单在 ds_0，user_id=101 的订单在 ds_1
-- 不同库的 order_no 不能保证唯一（除非用分布式 ID）
ALTER TABLE orders ADD UNIQUE INDEX idx_order_no (order_no);
-- 如果 order_no 不是分片键，跨库唯一约束无效

-- ✅ 用应用层 + 分布式 ID 保证唯一
-- Snowflake ID 天然唯一
-- 或用 Redis INCR 生成唯一序号
```

## 十、面试要点总结

### 高频面试题

1. **分库分表怎么选分片键？**
   - 查询条件中高频出现的字段
   - 数据分布均匀的字段
   - 不可变字段
   - 典型选择：user_id、order_id

2. **ShardingSphere-JDBC 和 Proxy 的区别？**
   - JDBC 是客户端分片，无额外网络开销，性能好
   - Proxy 是代理层分片，应用无感知，支持多语言
   - JDBC 适合 Java 单一技术栈，Proxy 适合多语言

3. **分库分表后如何解决跨库 JOIN？**
   - 绑定表：分片规则相同的表在同一分片 JOIN
   - 广播表：小表全量冗余
   - 应用层组装：分别查询后在应用层关联
   - ES 辅助：复杂查询走 ES

4. **分库分表后怎么做分布式事务？**
   - XA：强一致但性能差
   - Seata AT：最终一致，自动回滚
   - 本地消息表：最终一致，高并发友好

5. **分库分表后深分页怎么优化？**
   - 带分片键：游标分页（记住上页最后的 id）
   - 不带分片键：ES 辅助查询
   - 避免跨库深分页

6. **数据迁移怎么做？**
   - 存量迁移 + 增量同步（Canal）
   - 双写过渡
   - 灰度切读 → 切写 → 下线旧库

### 核心知识点速记

```
分库 = 解决连接/写入/磁盘瓶颈
分表 = 解决单表数据量大
分片键 = 数据路由的依据
绑定表 = 分片规则相同的表，JOIN 高效
广播表 = 小表全量冗余
回表 = 二级索引→聚簇索引
Snowflake = 分布式 ID 生成算法
ShardingSphere-JDBC = 客户端分片
ShardingSphere-Proxy = 代理层分片
双写迁移 = 存量+增量+灰度切换
```

## 总结

分库分表是数据库扩展的终极手段，但它带来了复杂性。在决定分库分表前，先尝试以下优化：

1. **SQL 优化**：加索引、优化执行计划
2. **读写分离**：主写从读，缓解单库压力
3. **缓存**：热点数据放 Redis
4. **冷热分离**：历史数据归档

如果以上手段都不够，再上分库分表。记住：**分库分表是最后的手段，不是第一选择。**

ShardingSphere 是目前最成熟的分库分表方案，掌握它的核心概念（分片键、分片算法、绑定表、广播表）和实战配置，就能应对大部分分库分表场景。

实际落地建议：先在测试环境完整演练，包括数据迁移、跨库查询、分布式事务，验证后再上生产。分库分表一旦上线，回退成本极高。
