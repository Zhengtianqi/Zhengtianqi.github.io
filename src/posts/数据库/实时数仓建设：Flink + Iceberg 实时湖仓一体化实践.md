---
title: 实时数仓建设：Flink + Iceberg 实时湖仓一体化实践
tag: ["Flink", "Iceberg", "实时数仓", "湖仓一体"]
category: 数据库
date: 2026-06-27
---

# 实时数仓建设：Flink + Iceberg 实时湖仓一体化实践

> 实时数仓建设：Flink + Iceberg 实时湖仓一体化实践是系统设计的核心，它决定了数据的存储方式和访问效率。
> 本文介绍了实时数仓建设：Flink + Iceberg 实时湖仓一体化实践的原理和最佳实践，帮助你构建高效的数据存储方案。


Lambda 架构太复杂（离线+实时两套链路），纯实时太贵（Kafka 存不下全量数据）。Flink + Iceberg 的湖仓一体架构是当下的最优解。

## 一、架构演进

### 1.1 传统离线数仓（Hive）

```
MySQL → Sqoop → HDFS → Hive（T+1 跑批） → BI 报表
问题：数据延迟一天，无法做实时决策
```

### 1.2 Lambda 架构（离线+实时）

```
离线层：MySQL → Sqoop → HDFS → Hive（T+1）
实时层：MySQL → Canal → Kafka → Flink → Redis/ClickHouse
问题：两套代码，数据不一致，运维成本翻倍
```

### 1.3 湖仓一体（Flink + Iceberg）

```
MySQL → Flink CDC → Iceberg（存储） → Flink（计算） → 应用层
一条链路，既支持批处理又支持流处理，存储统一
```

## 二、为什么是 Iceberg

| 特性 | Hive | Hudi | Iceberg | Delta Lake |
|------|------|------|---------|------------|
| ACID | 不支持 | 支持 | 支持 | 支持 |
| Schema 演进 | 有限 | 有限 | 完整（支持改名/改类型/重排） | 有限 |
| 时间旅行 | 不支持 | 支持 | 支持 | 支持 |
| 分区演进 | 不支持 | 不支持 | 支持（隐藏分区） | 不支持 |
| 引擎兼容 | Hive/Spark | Spark/Flink | Spark/Flink/Trino | Spark |
| 数据格式 | ORC/Parquet | Parquet | Parquet/AVRO/ORC | Parquet |
| 社区 | Apache | Apache | Apache | Databricks |

Iceberg 核心优势：**隐藏分区**和**Schema 演进**是最强的。

## 三、Flink CDC 实时入湖

### 3.1 架构

```
MySQL (binlog)
    │
    ├─ Flink CDC Source（全量+增量）
    │
    ├─ Flink SQL（ETL 清洗）
    │
    └─ Iceberg Sink（写入 S3/HDFS）
         │
         ├─ 快照查询（批处理）
         ├─ 增量读取（流处理）
         └─ Time Travel（历史版本查询）
```

### 3.2 Flink SQL 实战

```sql
-- 1. 创建 Iceberg Catalog
CREATE CATALOG iceberg_catalog WITH (
    'type' = 'iceberg',
    'catalog-type' = 'hive',
    'uri' = 'thrift://hive-metastore:9083',
    'warehouse' = 's3://data-warehouse/iceberg'
);

-- 2. 创建 MySQL CDC Source 表
CREATE TABLE mysql_orders (
    id BIGINT,
    user_id BIGINT,
    product_id BIGINT,
    amount DECIMAL(10, 2),
    status STRING,
    create_time TIMESTAMP(3),
    update_time TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql',
    'port' = '3306',
    'username' = 'flink',
    'password' = '***',
    'database-name' = 'order_db',
    'table-name' = 'orders'
);

-- 3. 创建 Iceberg 目标表
CREATE TABLE iceberg_catalog.dw.orders (
    id BIGINT,
    user_id BIGINT,
    product_id BIGINT,
    amount DECIMAL(10, 2),
    status STRING,
    create_time TIMESTAMP(3),
    update_time TIMESTAMP(3),
    dt STRING,  -- 分区字段
    PRIMARY KEY (id) NOT ENFORCED
) PARTITIONED BY (dt);

-- 4. 实时同步 + ETL
INSERT INTO iceberg_catalog.dw.orders
SELECT 
    id, user_id, product_id, amount, status, 
    create_time, update_time,
    DATE_FORMAT(create_time, 'yyyy-MM-dd') as dt
FROM mysql_orders;

-- 这个 INSERT INTO 会持续运行，MySQL 的变更实时同步到 Iceberg
```

### 3.3 Java API 方式

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

// 1. 创建 MySQL CDC Source
TableSource<?> mysqlSource = MySqlTableSource.<RowData>builder()
    .hostname("mysql")
    .port(3306)
    .username("flink")
    .password("***")
    .databaseList("order_db")
    .tableList("order_db.orders")
    .deserializer(new JsonDebeziumDeserializationSchema())
    .build();

// 2. 读取数据
DataStream<RowData> stream = env.addSource(mysqlSource, "mysql-cdc");

// 3. 写入 Iceberg
tableEnv.executeSql("CREATE CATALOG iceberg_catalog WITH (...)");
Table icebergTable = tableEnv.fromDataStream(stream);
icebergTable.executeInsert("iceberg_catalog.dw.orders");

env.execute("mysql-to-iceberg");
```

## 四、Iceberg 高级特性

### 4.1 隐藏分区

```sql
-- 传统 Hive：分区字段必须出现在数据中
CREATE TABLE hive_orders (
    id BIGINT,
    create_time TIMESTAMP,
    dt STRING  -- 多余字段，只为分区
) PARTITIONED BY (dt);

-- Iceberg：隐藏分区，不需要额外的分区字段
CREATE TABLE iceberg_orders (
    id BIGINT,
    create_time TIMESTAMP
) PARTITIONED BY (days(create_time));
-- 查询时自动按时间过滤，用户无感知
-- SELECT * FROM iceberg_orders WHERE create_time > '2026-06-01'
-- → 自动只扫描 6 月之后的分区文件
```

### 4.2 时间旅行

```sql
-- 查看历史快照
SELECT * FROM orders VERSION AS OF 1234567890;

-- 查看某个时间点的数据
SELECT * FROM orders TIMESTAMP AS OF '2026-06-01 10:00:00';

-- 对比两个版本的数据差异
SELECT * FROM orders VERSION AS OF 1234567890
EXCEPT
SELECT * FROM orders VERSION AS OF 1234567891;
```

### 4.3 Schema 演进

```sql
-- 添加列（不影响历史数据）
ALTER TABLE orders ADD COLUMN status STRING;

-- 重命名列
ALTER TABLE orders RENAME COLUMN user_id TO customer_id;

-- 修改列类型（int → bigint）
ALTER TABLE orders ALTER COLUMN amount TYPE BIGINT;

-- 删除列
ALTER TABLE orders DROP COLUMN deprecated_field;

-- 重排列顺序
ALTER TABLE orders ALTER COLUMN status AFTER id;
```

### 4.4 分区演进

```sql
-- 初始：按天分区
CREATE TABLE orders (...) PARTITIONED BY (days(create_time));

-- 后来发现粒度太细，改为按月分区
ALTER TABLE orders REPLACE PARTITION FIELD 
    days(create_time) WITH months(create_time);
-- 历史分区不变，新数据按月分区，查询自动兼容
```

## 五、数据查询

### 5.1 Trino/Presto 查询 Iceberg

```sql
-- Trino 连接 Iceberg
SELECT 
    dt,
    COUNT(*) as order_count,
    SUM(amount) as total_amount
FROM iceberg.orders
WHERE dt BETWEEN '2026-06-01' AND '2026-06-30'
GROUP BY dt
ORDER BY dt;

-- 时间旅行
SELECT * FROM iceberg.orders FOR VERSION AS OF 1234567890;

-- 增量查询（查最近一小时变更的数据）
SELECT * FROM iceberg.orders 
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '1' HOUR;
```

### 5.2 Flink 流式读取

```sql
-- Flink 流式读取 Iceberg 增量变更
SET 'execution.runtime-mode' = 'streaming';

SELECT * FROM iceberg_catalog.dw.orders /*+ OPTIONS('streaming'='true', 'monitor-interval'='10s') */;
-- 每 10 秒扫描一次新数据，实现近实时
```

## 六、数据合并与压缩

### 6.1 小文件合并

```java
// Iceberg 写入会产生大量小文件，需要定期合并
// 用 Flink 或 Spark 定期触发 compaction

// Flink SQL
CALL iceberg_catalog.system.rewrite_data_files(
    table => 'dw.orders',
    options => map('min-input-files', '5', 'target-file-size-bytes', '536870912')
);
// 合并 < 5 个小文件为 512MB 的大文件
```

### 6.2 过期快照清理

```sql
-- 保留最近 7 天的快照，更早的清理
CALL iceberg_catalog.system.expire_snapshots(
    table => 'dw.orders',
    older_than => TIMESTAMP '2026-06-20 00:00:00',
    retain_last => 10  -- 至少保留 10 个快照
);

-- 建议每天定时执行，避免元数据膨胀
```

## 七、生产环境最佳实践

### 7.1 分区策略

```
按数据量和查询模式选择分区粒度：
- 日增量 < 1GB：按月分区
- 日增量 1-10GB：按天分区
- 日增量 > 10GB：按小时分区

避免分区过多：
- 单表分区数建议 < 10万
- 分区过多会导致元数据膨胀和查询变慢
```

### 7.2 数据生命周期

```sql
-- 分区过期清理（删除 90 天前的分区）
ALTER TABLE orders SET PROPERTIES (
    'write.metadata.delete-after-commit.enabled' = 'true',
    'write.metadata.previous-versions-max' = '10'
);

-- 定期执行分区清理
DELETE FROM orders WHERE dt < '2026-03-01';
```

### 7.3 监控

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| 小文件数 | 分区下文件数 | > 100 |
| 快照数 | 历史快照数 | > 1000 |
| 写入延迟 | Flink → Iceberg | > 5 分钟 |
| 数据文件大小 | 平均文件大小 | < 10MB |

## 八、面试要点

### Q：湖仓一体和传统数仓有什么区别？

传统数仓（Hive）：T+1 批处理，不支持 ACID，Schema 变更困难。
湖仓一体（Iceberg）：支持 ACID 事务、流批一体、Schema 演进、时间旅行。一套存储同时支持实时和离线计算，消除 Lambda 架构的双链路问题。

### Q：为什么选 Iceberg 不选 Hudi？

- Iceberg 的隐藏分区和分区演进最强
- Iceberg 引擎兼容性最好（Spark/Flink/Trino 都支持）
- Hudi 更适合 Upsert 频繁的场景（有主键的 CDC 入湖）
- Iceberg 更适合分析型查询

### Q：Flink CDC 的原理？

Flink CDC 基于 Debezium，直接读取 MySQL binlog：
1. 全量阶段：读取全表数据（不锁表，基于一致性快照）
2. 增量阶段：切换到 binlog 读取，保证不丢不重
3. 全量+增量无缝切换，不需要额外的 Kafka 中转

## 九、总结

Flink + Iceberg 湖仓一体的核心价值：

1. **一条链路**：Flink CDC 实时入湖，消除 Lambda 双链路
2. **一套存储**：Iceberg 同时支持批查询和流读取
3. **ACID 事务**：数据写入即可读，没有一致性问题
4. **Schema 演进**：在线改表不影响历史数据

记住：**入湖用 Flink CDC，查询用 Trino，小文件要定期合并，快照要定期过期**。
