---
title: MySQL 慢查询治理：从 pt-query-digest 到在线 DDL
tag: ["MySQL", "慢查询", "pt-query-digest", "Online DDL", "SQL优化"]
category: 数据库
date: 2026-07-03
---

# MySQL 慢查询治理：从 pt-query-digest 到在线 DDL

线上 MySQL 突然变慢？慢查询日志堆了几十个 G？怎么定位、怎么分析、怎么治理？pt-query-digest 怎么用？加索引会不会锁表？一篇讲透慢查询全流程治理。

---

## 一、慢查询日志

### 1.1 开启与配置

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;           -- 超过 1s 的查询记录
SET GLOBAL log_queries_not_using_indexes = ON;  -- 记录未用索引的查询
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL min_examined_row_limit = 100;  -- 扫描行数 < 100 不记录

-- 持久化配置（my.cnf）
[mysqld]
slow_query_log = ON
long_query_time = 1
log_queries_not_using_indexes = ON
slow_query_log_file = /var/log/mysql/slow.log
min_examined_row_limit = 100
log_slow_admin_statements = ON   -- 记录慢 DDL
log_slow_slave_statements = ON   -- 记录从库慢查询

-- 慢查询日志格式
-- Time: 2024-06-01T10:23:45.123456Z
-- User@Host: app[app] @ [10.0.0.1]  Id: 12345
-- Query_time: 2.345678  Lock_time: 0.000123  Rows_sent: 10  Rows_examined: 1000000
-- SET timestamp=1717235025;
-- SELECT * FROM orders WHERE user_id = 12345 ORDER BY create_time DESC;
```

### 1.2 关键指标

```
慢查询日志中的关键指标：

  Query_time    查询总耗时（秒）
  Lock_time     等待锁的时间（秒）
  Rows_sent     返回客户端的行数
  Rows_examined 存储引擎扫描的行数

  理想比例：Rows_examined ≈ Rows_sent
  危险信号：Rows_examined >> Rows_sent（扫描了大量行但只返回少量）

  示例分析：
  Query_time: 2.34   ← 慢
  Rows_sent: 10      ← 只返回 10 行
  Rows_examined: 100万 ← 但扫描了 100 万行
  → 典型缺索引问题（100万:10 = 10万倍浪费）
```

---

## 二、pt-query-digest

### 2.1 基本用法

```bash
# 安装 Percona Toolkit
# Ubuntu: apt install percona-toolkit
# CentOS: yum install percona-toolkit

# 基本用法：分析慢查询日志
pt-query-digest /var/log/mysql/slow.log

# 输出结构：
# 1. 总体统计（查询总数、去重后数量、总耗时等）
# 2. 慢查询排行（按总耗时排序）
# 3. 每条查询的详细统计

# 只看 Top 10
pt-query-digest --limit 10 /var/log/mysql/slow.log

# 按特定维度排序
pt-query-digest --order-by Query_time:sum /var/log/mysql/slow.log
# 排序维度：Query_time:sum / Query_time:avg / Lock_time:sum / Rows_examined:sum

# 过滤条件
pt-query-digest --filter '$event->{arg} =~ /orders/' /var/log/mysql/slow.log
# 只分析与 orders 表相关的查询

# 分析特定时间段
pt-query-digest --since '2024-06-01 00:00:00' --until '2024-06-01 12:00:00' /var/log/mysql/slow.log

# 从 Processlist 实时抓取
pt-query-digest --processlist h=localhost,u=root,p=pass --interval 30
```

### 2.2 输出解读

```
pt-query-digest 输出示例：

# 总体统计
# 5.2s user time, 0.1s system time, 40.3M rss
# Overall: 15,234 total, 321 unique, 2.1 QPS, 0.54x concurrency
# Time range: 2024-06-01 08:00:00 to 10:00:00
# Attribute   total   min   max   avg   95%   stddev  median
# ============ ====== ===== ===== ===== =====  ======  ======
# Exec time    8232s  1.0s  34s   0.54s 2.3s   1.2s    0.3s
# Lock time      12s   0     3s    0.8ms 15us   45ms    0
# Rows sent    125.2k  0     10k   8.4   100    145     0
# Rows exam   452.1M   0     50M   30.5k 200k   500k    100

  解读：
    15,234 条慢查询，321 条去重
    总耗时 8232 秒，平均每条 0.54 秒
    95% 的查询在 2.3 秒以内
    总扫描行数 452M → 需要优化

# 慢查询排行（Top 1）
# Rank Query ID        Response time  Calls R/Call  V/M   Item
# ==== =============== ============== ===== ====== =====  ========
#    1 0xABC123...      4523.5 54.9%   1234 3.67   0.23  SELECT orders

# 详细统计
# Query 1: 2.1 QPS, 1.1x concurrency, ID 0xABC123
# Scores: V/M = 0.23
# Time range: 2024-06-01 08:00:00 to 10:00:00
# Attribute   pct   total   min   max   avg   95%   stddev  median
# ============ === ====== ===== ===== ===== =====  ======  ======
# Count         8    1234
# Exec time    54   4524s  1.0s  34s   3.7s  8.2s   2.1s    3.1s
# Lock time     0   100ms   0     50ms  80us  10us   3ms     0
# Rows sent     0   12.3k   10    10    10    10     0       10
# Rows exam    80  361.7M   0    50M   293k  1.5M   800k    200k
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms
# 100ms
#    1s  ################################################################
#  10s+  ########
# Tables
#    SHOW TABLE STATUS LIKE 'orders'\G
#    SHOW CREATE TABLE `orders`\G
# EXPLAIN
SELECT * FROM orders WHERE user_id = 12345 ORDER BY create_time DESC LIMIT 10\G

  解读：
    这条查询执行了 1234 次，总耗时 4524 秒（占 54.9%）
    平均每次扫描 293k 行，但只返回 10 行
    → 缺索引（user_id + create_time 联合索引）
```

### 2.3 定位慢查询

```
pt-query-digest 分析流程：

  1. 收集慢查询日志（至少 1-2 小时）
  2. pt-query-digest 排序 → 找 Top N
  3. 重点关注：
     - 总耗时最高（Response time 占比大）
     - 调用次数最多（Calls 高）
     - 扫描行数最多（Rows exam 高）
     - V/M 高（执行时间波动大 → 不稳定）
  4. 对每条 Top 查询：
     - EXPLAIN 看执行计划
     - 检查索引是否缺失
     - 检查 SQL 写法是否合理
     - 检查表结构是否合理

  高频小慢查询 vs 低频大慢查询：
    高频（QPS 1000+，每次 0.1s）→ 累积影响大 → 优先优化
    低频（每天 1 次，每次 30s）→ 单次影响大 → 次优先
```

---

## 三、SQL 优化实战

### 3.1 索引优化

```sql
-- 案例 1：缺少索引
-- 慢查询：SELECT * FROM orders WHERE user_id = 12345 AND status = 'PAID';
-- EXPLAIN: type=ALL, rows=100万

-- 优化：加联合索引
ALTER TABLE orders ADD INDEX idx_user_status(user_id, status);
-- 优化后：type=ref, rows=50

-- 案例 2：索引列使用函数
-- 慢查询：SELECT * FROM orders WHERE YEAR(create_time) = 2024;
-- EXPLAIN: type=ALL（索引失效）

-- 优化：改写为范围查询
SELECT * FROM orders 
  WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01';
-- 优化后：type=range

-- 案例 3：ORDER BY 无索引
-- 慢查询：SELECT * FROM orders ORDER BY create_time DESC LIMIT 10;
-- Extra: Using filesort

-- 优化：给 ORDER BY 列加索引
ALTER TABLE orders ADD INDEX idx_create_time(create_time);
-- 优化后：Extra: NULL（利用索引有序性，无需排序）

-- 案例 4：深分页
-- 慢查询：SELECT * FROM orders ORDER BY id LIMIT 1000000, 10;
-- 扫描 100 万行只为取 10 行

-- 优化：游标分页（记住上一页最后一条 id）
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 10;
-- 只扫描 10 行

-- 优化：关联分页
SELECT o.* FROM orders o
  INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 10) t
  ON o.id = t.id;
-- 子查询走覆盖索引，只取 id → 快
```

### 3.2 JOIN 优化

```sql
-- 案例：大表 JOIN 无索引
-- 慢查询：
SELECT o.*, p.name FROM orders o 
  JOIN products p ON o.product_id = p.id  -- products.id 有主键索引
  WHERE o.user_id = 12345;                -- orders.user_id 无索引

-- EXPLAIN:
-- orders: type=ALL, rows=100万 (驱动表全表扫描)
-- products: type=eq_ref, key=PRIMARY (被驱动表用主键)

-- 问题：orders 表全表扫描 → 扫描 100 万行 × 1 次主键查询
-- 优化：给 orders.user_id 加索引
ALTER TABLE orders ADD INDEX idx_user_id(user_id);
-- 优化后：orders: type=ref, rows=50

-- 驱动表选择原则：
-- MySQL 优化器自动选择小结果集的表作为驱动表
-- 小表驱动大表：100 行 × 10000 次查找 > 10000 行 × 100 次查找
-- 可以用 STRAIGHT_JOIN 强制顺序（谨慎使用）
SELECT /*+ JOIN_ORDER(o, p) */ o.*, p.name 
  FROM orders o JOIN products p ON o.product_id = p.id
  WHERE o.user_id = 12345;

-- JOIN 优化总结：
-- 1. 被驱动表的 JOIN 列必须有索引
-- 2. 小结果集驱动大结果集
-- 3. 用覆盖索引避免回表
-- 4. 限制 JOIN 层数（不超过 3 层）
```

### 3.3 子查询优化

```sql
-- 慢：子查询（MySQL 5.6 之前会创建临时表）
SELECT * FROM orders 
  WHERE user_id IN (SELECT id FROM users WHERE vip = 1);
-- 子查询可能被优化为半连接（5.6+），但有时效果不好

-- 优化：改为 JOIN
SELECT o.* FROM orders o 
  JOIN users u ON o.user_id = u.id 
  WHERE u.vip = 1;
-- JOIN 可以利用索引，效率更高

-- 慢：NOT IN 子查询
SELECT * FROM orders 
  WHERE user_id NOT IN (SELECT user_id FROM refunded_orders);
-- NOT IN 效率极差

-- 优化：LEFT JOIN + IS NULL
SELECT o.* FROM orders o
  LEFT JOIN refunded_orders r ON o.user_id = r.user_id
  WHERE r.user_id IS NULL;
```

---

## 四、在线 DDL

### 4.1 DDL 锁表问题

```
传统 ALTER TABLE 的问题：

  ALTER TABLE orders ADD INDEX idx_user_id(user_id);
  → 创建临时表 → 复制数据 → 重命名 → 锁表
  → 1000 万行表 → 锁表 30 分钟 → 业务不可用

MySQL Online DDL（5.6+）：
  在线加索引 → 不锁表（或极短锁表）
  INSTANT（8.0+）→ 元数据级别，瞬间完成

Online DDL 算法：
  COPY:     创建临时表 → 复制数据 → 替换（锁表）
  INPLACE:  原地修改（不锁表或极短锁表）
  INSTANT:  只修改元数据（瞬间，8.0+）
```

### 4.2 Online DDL 使用

```sql
-- 指定算法和锁策略
ALTER TABLE orders 
  ADD INDEX idx_user_id(user_id), 
  ALGORITHM=INPLACE, 
  LOCK=NONE;
-- ALGORITHM=INPLACE: 原地修改（不创建临时表）
-- LOCK=NONE: 不锁表（允许读写）

-- INSTANT DDL（MySQL 8.0+）
ALTER TABLE orders 
  ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING',
  ALGORITHM=INSTANT;
-- 瞬间完成（只修改元数据）

-- 查看 DDL 进度（MySQL 8.0+）
SELECT * FROM performance_schema.events_stages_current
  WHERE EVENT_NAME LIKE 'stage/innodb/alter%';
-- 事件：stage/innodb/alter table (read PK and internal sort)
-- 事件：stage/innodb/alter table (merge sort)
-- 事件：stage/innodb/alter table (log apply)
```

### 4.3 各操作支持的算法

```
操作                    COPY    INPLACE    INSTANT
──────────────────────────────────────────────────
添加列（末尾）           ✓       ✓          ✓(8.0+)
删除列                   ✓       ✓          ✗
添加索引                 ✓       ✓          ✗
删除索引                 ✓       ✓          ✗
修改列类型               ✓       ✗          ✗
添加默认值               ✓       ✓          ✓(8.0+)
重命名列                 ✓       ✓          ✗
修改列 NULL→NOT NULL    ✓       ✓          ✗
修改字符集               ✓       部分        ✗

注意：
  INPLACE 也可能有短暂锁（开始和结束阶段）
  大表添加索引建议用 pt-online-schema-change（pt-osc）或 gh-ost
```

### 4.4 pt-online-schema-change

```bash
# pt-osc：Percona 在线 DDL 工具
# 原理：
#   1. 创建影子表（_orders_new）
#   2. 在影子表上执行 DDL
#   3. 创建触发器同步增量数据
#   4. 分块复制旧表数据到影子表
#   5. 重命名表（原子操作）
#   6. 删除旧表

# 示例：在线加索引
pt-online-schema-change \
  --alter "ADD INDEX idx_user_id(user_id)" \
  --execute \
  --chunk-size=1000 \
  --max-load="Threads_running=50" \
  D=mydb,t=orders,h=localhost,u=root,p=pass

# 关键参数：
# --chunk-size: 每次复制的行数（控制负载）
# --max-load: 超过阈值则暂停（控制影响）
# --critical-load: 超过则中止
# --execute: 真正执行（不加则只检查）

# gh-ost（GitHub 工具，更推荐）
# 优势：不用触发器（通过 binlog 同步），对主库负载更小
gh-ost --alter "ADD INDEX idx_user_id(user_id)" \
  --database=mydb --table=orders \
  --host=localhost --user=root --password=pass \
  --execute
```

---

## 五、慢查询治理流程

```
慢查询治理 SOP：

  1. 发现（持续监控）
     - 慢查询日志 + pt-query-digest
     - APM 工具（Datadog / 阿里云 DAS）
     - 数据库监控（Prometheus + Grafana）

  2. 分析（定位根因）
     - pt-query-digest 排行 → Top N
     - EXPLAIN 查看执行计划
     - 检查索引、SQL 写法、表结构

  3. 优化（执行改进）
     - 加索引（Online DDL / pt-osc / gh-ost）
     - 改写 SQL（避免索引失效写法）
     - 拆分大表（分库分表）
     - 缓存（Redis 减少数据库压力）

  4. 验证（确认效果）
     - 测试环境验证执行计划
     - 生产灰度发布
     - 对比优化前后的 Query_time

  5. 预防（防止复发）
     - SQL 审核流程（上线前 EXPLAIN）
     - 慢查询告警（> 1s 自动告警）
     - 定期 pt-query-digest 巡检
     - 索引覆盖率检查
```

---

## 六、面试要点

### Q：线上慢查询怎么排查？

1. 确认慢查询日志已开启（slow_query_log = ON, long_query_time = 1）
2. 用 pt-query-digest 分析慢查询日志，按总耗时排序找 Top N
3. 对 Top 查询用 EXPLAIN 看执行计划，检查 type/rows/Extra
4. 常见问题：缺索引（type=ALL）、索引失效（函数/隐式转换/LIKE '%'/OR）、Using filesort（排序无索引）、深分页
5. 优化方案：加索引（Online DDL）、改写 SQL、游标分页、缓存
6. 验证：测试环境 EXPLAIN → 灰度上线 → 对比 Query_time

### Q：大表加索引会不会锁表？

MySQL 5.6+ 支持 Online DDL（ALGORITHM=INPLACE, LOCK=NONE），加索引不锁表。但大表（千万级）可能耗时很长且占用资源。推荐用 pt-online-schema-change 或 gh-ost：
- pt-osc：创建影子表 + 触发器同步 + 分块复制 + 原子重命名
- gh-ost：通过 binlog 同步（不用触发器），对主库负载更小

### Q：深分页怎么优化？

`LIMIT 1000000, 10` 会扫描 100 万行只取 10 行。
优化方案：
1. 游标分页：记住上一页最后的 id，`WHERE id > last_id LIMIT 10`
2. 关联分页：子查询走覆盖索引只取 id，再 JOIN 取完整行
3. 业务限制：不允许看超过 100 页

---

## 七、总结

```
慢查询治理全流程：
  发现：慢查询日志 + pt-query-digest + APM
  分析：EXPLAIN 查看 type/Extra/rows
  优化：加索引 / 改写 SQL / 游标分页 / 缓存
  验证：测试环境 → 灰度 → 对比
  预防：SQL 审核 + 慢查询告警 + 定期巡检

pt-query-digest：分析慢查询日志，按耗时排序，快速定位 Top N
关键指标：Query_time / Rows_examined / Rows_sent
  理想：Rows_examined ≈ Rows_sent
  危险：Rows_examined >> Rows_sent

在线 DDL：
  ALGORITHM=INPLACE, LOCK=NONE（MySQL 5.6+）
  ALGORITHM=INSTANT（MySQL 8.0+，瞬间完成）
  大表推荐 pt-osc / gh-ost（更稳定可控）
```
