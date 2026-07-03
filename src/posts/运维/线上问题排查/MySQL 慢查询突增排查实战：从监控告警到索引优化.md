---
title: MySQL 慢查询突增排查实战：从监控告警到索引优化
tag: ["MySQL", "慢查询", "索引优化", "执行计划", "线上排障"]
category: 运维
date: 2026-07-03
---

# MySQL 慢查询突增排查实战：从监控告警到索引优化

> 上午 10 点，618 大促正在如火如荼进行，你收到钉钉告警：订单库慢查询数从每分钟 5 条飙升到 2000 条，数据库 CPU 从 30% 跳到 90%，接口 P99 从 50ms 涨到 3000ms。用户开始在 App 上看到加载转圈。这是 DBA 和开发面临的最紧张场景之一——慢查询突增。

## 一、慢查询突增的常见触发因素

慢查询突增往往不是"突然出现了慢 SQL"，而是"原来快的 SQL 突然变慢了"。理解触发因素是快速定位的前提。

### 1.1 触发因素全景图

```
┌──────────────────────────────────────────────────────────────────┐
│                   慢查询突增触发因素                              │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  数据变化      │  统计信息变化   │  执行计划漂移   │  环境因素       │
├───────────────┼───────────────┼───────────────┼─────────────────┤
│ 数据量增长    │ 统计信息过期   │ 索引选择错误   │ 并发连接突增     │
│ 数据分布变化  │ ANALYZE 未执行 │ 全表扫描替代   │ 锁等待传导       │
│ 冷数据变热    │ 采样比例不足   │ JOIN 顺序变化  │ 临时表/排序溢出  │
│ 大事务未提交  │ 直方图缺失     │ 子查询展开失败  │ buffer pool 不足│
└───────────────┴───────────────┴───────────────┴─────────────────┘
```

### 1.2 典型触发场景详解

**场景 A：数据量跨过临界点**

```sql
-- 这条查询本来走索引，扫描 5000 行，耗时 5ms
SELECT * FROM orders 
WHERE merchant_id = 10086 
  AND status = 'PAID' 
  AND create_time > '2026-06-01'
ORDER BY create_time DESC 
LIMIT 20;

-- 当 merchant_id=10086 的订单从 5 万增长到 50 万时：
-- 1. 索引扫描行数增加 10 倍
-- 2. 如果优化器认为全表扫描更"便宜"，会放弃索引
-- 3. 一旦放弃索引，扫描行数从 5000 变成全表 500 万
-- 4. 慢查询出现
```

**场景 B：统计信息过期导致执行计划漂移**

```sql
-- 查看表的统计信息更新时间
SELECT table_name, table_rows, 
       data_length, index_length,
       update_time,
       check_time
FROM information_schema.tables 
WHERE table_schema = 'order_db';

-- MySQL 的统计信息是基于采样的，默认采样 20 个数据页
-- 如果数据分布发生变化但统计信息未更新
-- 优化器会做出错误的执行计划选择

-- 模拟统计信息更新前后执行计划变化
-- 更新前（统计信息过期）
EXPLAIN SELECT * FROM orders WHERE status = 'PAID' AND create_time > '2026-06-01';
-- type: ALL, rows: 5000000, Extra: Using where  ← 全表扫描！

-- 更新统计信息
ANALYZE TABLE orders;

-- 更新后
EXPLAIN SELECT * FROM orders WHERE status = 'PAID' AND create_time > '2026-06-01';
-- type: range, rows: 50000, key: idx_status_time, Extra: Using index condition  ← 走索引了
```

**场景 C：并发突增导致锁等待传导**

```sql
-- 查看当前锁等待情况（MySQL 8.0+）
SELECT 
    r.trx_id AS waiting_trx_id,
    r.trx_mysql_thread_id AS waiting_thread,
    r.trx_query AS waiting_query,
    b.trx_id AS blocking_trx_id,
    b.trx_mysql_thread_id AS blocking_thread,
    b.trx_query AS blocking_query,
    TIMESTAMPDIFF(SECOND, r.trx_wait_started, NOW()) AS wait_seconds
FROM information_schema.innodb_lock_waits w
JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;

-- 如果 blocking_query 是一条 UPDATE 且执行了很久
-- 所有等待它的 SELECT ... FOR UPDATE 都会变慢
-- 表现为慢查询突增
```

## 二、排查工具链

### 2.1 工具链总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    慢查询排查工具链                              │
├──────────────┬───────────────┬────────────────┬────────────────┤
│  发现层      │  分析层        │  深度诊断层     │  验证层        │
├──────────────┼───────────────┼────────────────┼────────────────┤
│ 监控告警    │ pt-query-digest│ EXPLAIN        │ 测试环境复现   │
│ 慢查询日志  │ SHOW PROCESSLIST│ EXPLAIN ANALYZE│ 压测对比       │
│ performance │ SHOW ENGINE    │ optimizer trace│ APM 链路追踪   │
│  schema     │ INNODB STATUS  │ profiling       │               │
└──────────────┴───────────────┴────────────────┴────────────────┘
```

### 2.2 pt-query-digest：慢查询日志分析利器

```bash
# 安装 Percona Toolkit
yum install percona-toolkit  # CentOS
apt install percona-toolkit  # Ubuntu

# 基本用法：分析慢查询日志
pt-query-digest /var/lib/mysql/mysql-slow.log > /tmp/slow_report.txt

# 按时间范围分析
pt-query-digest --since "2026-07-03 10:00:00" --until "2026-07-03 11:00:00" \
  /var/lib/mysql/mysql-slow.log

# 只看某个库
pt-query-digest --filter '$event->{db} eq "order_db"' \
  /var/lib/mysql/mysql-slow.log

# 输出到报告文件
pt-query-digest --limit 10 --report /tmp/top10_slow.txt \
  /var/lib/mysql/mysql-slow.log
```

**pt-query-digest 输出示例**：

```
# 360ms user time, 50ms system time, 30.00M rss, 50.00M vsz
# Current date: Sat Jul  3 10:30:00 2026
# Hostname: db-master-01
# Files: mysql-slow.log
# Overall: 15.23k total, 120 unique, 2.50 QPS, 0.45x concurrency _______
# Time range: 2026-07-03 10:00:00 to 10:10:00
# Attribute          total     min     max     avg     95%
# ============     =====   =====   =====   =====   =====
# Exec time         5234s    1ms   120s   344ms   2000ms
# Lock time           56s       0     5s     4ms    10ms
# Rows sent        850.50k       0  10.00k   57.06  100.00
# Rows examine       2.30G       0  10.00M 158.72k  500.00k

# Profile
# Rank Query ID           Response time  Calls  R/Call    V/M   Item
# ==== ================== ============== ====== ========= ===== =====
#    1 0xABC123DEF456...  3200.0 61.1%   5234   0.6114  0.12 SELECT orders
#    2 0xDEF789GHI012...   800.0 15.3%   2300   0.3478  0.08 SELECT order_items
#    3 0x123ABC456DEF...   500.0  9.6%   1500   0.3333  0.05 SELECT payments
#    4 0x456DEF789ABC...   300.0  5.7%    800   0.3750  0.03 SELECT orders
#    5 0x789ABC123DEF...   200.0  3.8%    500   0.4000  0.02 SELECT refunds

# 看第 1 名：占 61.1% 的慢查询时间，调用了 5234 次
# 这就是首要排查目标
```

### 2.3 定位到具体 SQL 后的分析

```bash
# 查看 pt-query-digest 报告中的详细 SQL
# 找到 Rank 1 对应的查询：

# Query 1: 2.50 QPS, 0.45x concurrency, ID 0xABC123DEF456...
# Scores: V/M = 0.12
# Time range: 2026-07-03 10:00:00 to 10:10:00
# Attribute    pct   total     min     max     avg     95%
# ============ === ======= ======= ======= ======= =======
# Count         34   5234
# Exec time     61   3200s    200ms   5000ms   611ms   2000ms
# Lock time     45     25s       0    500ms     5ms    20ms
# Rows sent     12  100.00k       0   100.00   19.56   50.00
# Rows examine  60    1.40G       0  10.00M 273.50k  500.00k
# 
# EXPLAIN SELECT * FROM orders 
# WHERE merchant_id = 10086 AND status = 'PAID' 
# AND create_time > '2026-06-01'
# ORDER BY create_time DESC LIMIT 20;
```

**关键指标解读**：
- **Rows examine = 1.40G / 5234 次 ≈ 273.50k 行/次**：平均每次扫描 27 万行
- **Rows sent = 20 行/次**：实际只需要 20 行
- **扫描行/返回行 = 13675 倍**：效率极低，索引肯定有问题

## 三、EXPLAIN 执行计划深度分析

### 3.1 EXPLAIN 输出详解

```sql
-- 执行 EXPLAIN
EXPLAIN SELECT * FROM orders 
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;

-- 输出：
+----+-------------+--------+------------+------+------------------------+------+---------+-------+--------+----------+-------------+
| id | select_type | table  | partitions | type | possible_keys          | key  | key_len | ref   | rows   | filtered | Extra       |
+----+-------------+--------+------------+------+------------------------+------+---------+-------+--------+----------+-------------+
|  1 | SIMPLE      | orders | NULL       | ref  | idx_merchant,idx_time  | idx_merchant | 4 | const | 500000 |     1.00 | Using where; Using filesort |
+----+-------------+--------+------------+------+------------------------+------+---------+-------+--------+----------+-------------+
```

**关键字段解读**：

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXPLAIN 关键字段                              │
├──────────┬───────────────────────────────────────────────────────┤
│ type     │ 访问类型（从好到差）：                                │
│          │ system > const > eq_ref > ref > range > index > ALL  │
│          │ 当前: ref ← 还行，但可以更好                         │
├──────────┼───────────────────────────────────────────────────────┤
│ key      │ 实际使用的索引                                       │
│          │ 当前: idx_merchant ← 只用了 merchant_id 索引          │
├──────────┼───────────────────────────────────────────────────────┤
│ rows     │ 预估扫描行数                                         │
│          │ 当前: 500000 ← 太多了！                              │
├──────────┼───────────────────────────────────────────────────────┤
│ filtered │ 过滤后剩余百分比                                     │
│          │ 当前: 1.00% ← 意味着 99% 的行被丢弃，严重浪费        │
├──────────┼───────────────────────────────────────────────────────┤
│ Extra    │ 附加信息                                             │
│          │ Using where: 需要后过滤                              │
│          │ Using filesort: 需要额外排序 ← 性能杀手！             │
│          │ Using index: 覆盖索引，不需要回表                     │
│          │ Using temporary: 使用临时表 ← 性能杀手！              │
└──────────┴───────────────────────────────────────────────────────┘
```

### 3.2 EXPLAIN ANALYZE（MySQL 8.0+）

```sql
-- EXPLAIN ANALYZE 实际执行查询并给出真实数据
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;

-- 输出：
-- -> Limit: 20 row(s)  (cost=500000.25 rows=500000) (actual time=0.045..2340.678 rows=20 loops=1)
--     -> Sort: orders.create_time DESC, limit input to 20 row(s) per chunk  (cost=500000.25 rows=500000) (actual time=0.044..2340.660 rows=5234 loops=1)
--         -> Index lookup on orders using idx_merchant (merchant_id=10086), with index condition: ((orders.`status` = 'PAID') and (orders.create_time > '2026-06-01'))  (cost=500000.25 rows=500000) (actual time=0.038..2100.123 rows=5234 loops=1)

-- 分析：
-- 1. 索引 idx_merchant 定位到 500000 行
-- 2. Using index condition 过滤后剩 5234 行
-- 3. Sort（filesort）排序 5234 行，耗时 2340ms
-- 4. 最终 Limit 取 20 行
-- 瓶颈：排序 5234 行太慢
```

### 3.3 Optimizer Trace：理解优化器的决策过程

```sql
-- 开启 optimizer trace
SET optimizer_trace = "enabled=on,end_marker=on,one_line=off";

-- 执行查询
SELECT * FROM orders 
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;

-- 查看 trace
SELECT * FROM information_schema.optimizer_trace\G

-- 关键输出（简化版）：
-- {
--   "steps": [
--     {
--       "join_preparation": { ... }
--     },
--     {
--       "join_optimization": {
--         "steps": [
--           {
--             "reconsidering_access_paths": {
--               "best_path": {
--                 "access_type": "ref",
--                 "index": "idx_merchant",
--                 "rows": 500000,
--                 "cost": 100250.25
--               },
--               "alternative_paths": [
--                 {
--                   "access_type": "range",
--                   "index": "idx_status_time",
--                   "rows": 2000000,
--                   "cost": 500000.00  ← 成本更高，被放弃
--                 }
--               ]
--             }
--           }
--         ]
--       }
--     }
--   ]
-- }

-- 优化器选择了 idx_merchant（成本 100250）而非 idx_status_time（成本 500000）
-- 但 idx_merchant 需要大量行扫描 + filesort
-- 如果有 (merchant_id, status, create_time) 联合索引，成本会最低
```

## 四、索引优化实战

### 4.1 索引设计原则

```
┌──────────────────────────────────────────────────────────────────┐
│                  联合索引设计原则                                 │
│                                                                  │
│  最左前缀原则：索引 (a, b, c) 可以匹配：                         │
│  ✓ WHERE a = ?                                                   │
│  ✓ WHERE a = ? AND b = ?                                         │
│  ✓ WHERE a = ? AND b = ? AND c = ?                               │
│  ✗ WHERE b = ?                                                   │
│  ✗ WHERE c = ?                                                   │
│                                                                  │
│  设计策略：                                                       │
│  1. 等值条件字段放前面，范围条件字段放后面                        │
│  2. 高选择性字段放前面                                           │
│  3. 排序字段放在最后                                             │
│  4. 避免超过 5 个字段的联合索引                                   │
│                                                                  │
│  本案例的索引设计：                                               │
│  查询条件: merchant_id = ? AND status = ? AND create_time > ?    │
│  排序条件: create_time DESC                                      │
│                                                                  │
│  最佳索引: (merchant_id, status, create_time)                    │
│  等值条件: merchant_id, status → 放前面                          │
│  范围条件+排序: create_time → 放最后                             │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 创建优化索引

```sql
-- 创建联合索引（先在测试环境验证）
ALTER TABLE orders ADD INDEX idx_merchant_status_time (merchant_id, status, create_time);

-- 验证执行计划
EXPLAIN SELECT * FROM orders 
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;

-- 优化后输出：
-- type: range                    ← 范围扫描
-- key: idx_merchant_status_time  ← 使用联合索引
-- rows: 100                      ← 只扫描 100 行（从 500000 降到 100）
-- filtered: 100.00               ← 100% 命中，无浪费
-- Extra: Using index condition   ← 没有 filesort 了！

-- 对比优化前后：
+--------+-----------+-----------+------------+-----------+
| 指标    | 优化前    | 优化后    | 提升倍数   | 说明      |
+--------+-----------+-----------+------------+-----------+
| type   | ref       | range     | -          | 更精准    |
| rows   | 500000    | 100       | 5000x      | 扫描行数  |
| filtered| 1.00%    | 100.00%   | 100x       | 命中率    |
| Extra  | filesort  | 无        | -          | 无需排序  |
| 耗时    | 2340ms    | 3ms       | 780x       | 实际耗时  |
+--------+-----------+-----------+------------+-----------+
```

### 4.3 在线 DDL 与无锁变更

在生产环境加索引时，直接 `ALTER TABLE` 可能导致锁表：

```sql
-- 危险！大表直接 ALTER 可能锁表数小时
ALTER TABLE orders ADD INDEX idx_merchant_status_time (merchant_id, status, create_time);

-- 方案 1：MySQL 8.0+ 支持 INPLACE DDL（大部分场景不锁表）
ALTER TABLE orders ADD INDEX idx_merchant_status_time (merchant_id, status, create_time), ALGORITHM=INPLACE, LOCK=NONE;

-- 方案 2：使用 pt-online-schema-change（适合超大表）
pt-online-schema-change \
  --alter "ADD INDEX idx_merchant_status_time (merchant_id, status, create_time)" \
  --execute \
  --chunk-size=5000 \
  --max-load="Threads_running=50" \
  --critical-load="Threads_running=100" \
  D=order_db,t=orders,h=127.0.0.1,u=root,p=password

-- 方案 3：使用 gh-ost（GitHub 的无锁变更工具）
gh-ost --host=127.0.0.1 --user=root --password=password \
  --database=order_db --table=orders \
  --alter "ADD INDEX idx_merchant_status_time (merchant_id, status, create_time)" \
  --execute
```

## 五、紧急处理 vs 根因修复

### 5.1 处理决策树

```
                    慢查询突增告警
                         │
                         ▼
                  是否影响核心接口？
                   /         \
                 是            否
                 /              \
               ▼                ▼
          紧急止血           监控观察
               │                │
       ┌───────┼───────┐       │
       ▼       ▼       ▼       ▼
    限流    Kill   只读    继续观察
    降级    慢SQL   降级
       │       │       │
       └───────┼───────┘
               ▼
          根因分析
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
    索引    统计   SQL
    优化    信息    重写
       │     更新
       ▼       │       ▼
    加索引  ANALYZE  代码修改
       │     TABLE   发布上线
       ▼
    验证效果
```

### 5.2 紧急处理措施

```bash
# 措施 1：Kill 执行时间超过 60 秒的查询
mysql -e "
SELECT GROUP_CONCAT(CONCAT('KILL ', id, ';') SEPARATOR ' ')
FROM information_schema.processlist
WHERE command != 'Sleep' AND time > 60;" | mysql

# 措施 2：限制并发连接数（防止雪崩）
-- 设置最大连接数
SET GLOBAL max_connections = 200;
-- 设置 wait_timeout
SET GLOBAL wait_timeout = 60;

# 措施 3：读写分离切换（如果有多节点）
-- 将读流量切到只读节点
UPDATE app_config SET db_read_endpoint = 'read-replica-01:3306' WHERE config_key = 'db_read';

# 措施 4：限流降级（应用层）
-- 配置 Sentinel 规则
curl -X POST http://config-center/api/sentinel/rule \
  -d '{"resource":"orderQuery","count":50,"grade":1,"strategy":0}'
```

### 5.3 根因修复

```sql
-- 修复 1：更新统计信息
ANALYZE TABLE orders;
ANALYZE TABLE order_items;

-- 修复 2：添加缺失的索引
ALTER TABLE orders ADD INDEX idx_merchant_status_time (merchant_id, status, create_time);

-- 修复 3：固定执行计划（临时方案，防止执行计划漂移）
-- 使用 FORCE INDEX
SELECT * FROM orders FORCE INDEX (idx_merchant_status_time)
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;

-- 修复 4：使用 index hint（当优化器选错索引时）
SELECT * FROM orders USE INDEX (idx_merchant_status_time)
WHERE merchant_id = 10086 AND status = 'PAID' 
AND create_time > '2026-06-01'
ORDER BY create_time DESC LIMIT 20;
```

## 六、常见慢查询模式与优化

### 6.1 模式一：深分页问题

```sql
-- 问题：LIMIT 100000, 20 需要扫描 100020 行
SELECT * FROM orders 
WHERE merchant_id = 10086 
ORDER BY id DESC 
LIMIT 100000, 20;
-- 耗时：2.3 秒

-- 优化方案 1：游标分页（推荐）
SELECT * FROM orders 
WHERE merchant_id = 10086 AND id < 12345678
ORDER BY id DESC 
LIMIT 20;
-- 耗时：3ms

-- 优化方案 2：延迟关联
SELECT t.* FROM orders t
INNER JOIN (
    SELECT id FROM orders 
    WHERE merchant_id = 10086 
    ORDER BY id DESC 
    LIMIT 100000, 20
) tmp ON t.id = tmp.id;
-- 耗时：50ms（子查询走覆盖索引，减少回表）

-- 优化方案 3： BETWEEN 范围查询
SELECT * FROM orders 
WHERE merchant_id = 10086 AND id BETWEEN 12345658 AND 12345678
ORDER BY id DESC;
-- 耗时：2ms
```

### 6.2 模式二：JOIN 时驱动表选错

```sql
-- 问题：小表驱动大表 vs 大表驱动小表
-- orders 表 5000 万行，merchants 表 1000 行

-- 错误的执行计划（大表驱动小表）：
EXPLAIN SELECT * FROM orders o 
JOIN merchants m ON o.merchant_id = m.id 
WHERE m.status = 'ACTIVE';
-- 优化器可能选择 orders 作为驱动表 → 5000 万次 JOIN

-- 强制小表驱动：
SELECT STRAIGHT_JOIN * FROM merchants m
JOIN orders o ON o.merchant_id = m.id 
WHERE m.status = 'ACTIVE' AND m.is_deleted = 0;
-- STRAIGHT_JOIN 强制左表为驱动表
-- 1000 行 × 查索引 → 效率高得多

-- 更好的方案：确保 JOIN 字段有索引
ALTER TABLE orders ADD INDEX idx_merchant_id (merchant_id);
-- 然后让优化器自己选
```

### 6.3 模式三：子查询低效

```sql
-- 问题：NOT IN 子查询效率低
SELECT * FROM orders 
WHERE id NOT IN (
    SELECT order_id FROM order_refunds WHERE refund_status = 'PROCESSING'
);
-- 耗时：15 秒

-- 优化：改写为 LEFT JOIN ... IS NULL
SELECT o.* FROM orders o
LEFT JOIN order_refunds r ON o.id = r.order_id AND r.refund_status = 'PROCESSING'
WHERE r.order_id IS NULL;
-- 耗时：200ms

-- 或使用 NOT EXISTS
SELECT * FROM orders o 
WHERE NOT EXISTS (
    SELECT 1 FROM order_refunds r 
    WHERE r.order_id = o.id AND r.refund_status = 'PROCESSING'
);
-- 耗时：180ms
```

### 6.4 模式四：LIKE 前缀模糊查询

```sql
-- 问题：前导通配符导致全表扫描
SELECT * FROM orders WHERE order_no LIKE '%2026070310%';
-- type: ALL, rows: 50000000 ← 全表扫描

-- 优化 1：如果查询前缀确定，去掉前导 %
SELECT * FROM orders WHERE order_no LIKE 'ORD2026070310%';
-- type: range, key: idx_order_no ← 走索引

-- 优化 2：如果必须前导模糊，使用全文索引
ALTER TABLE orders ADD FULLTEXT INDEX ft_order_no (order_no);
SELECT * FROM orders WHERE MATCH(order_no) AGAINST('2026070310' IN BOOLEAN MODE);

-- 优化 3：如果 order_no 有规律，用范围查询替代
SELECT * FROM orders 
WHERE order_no >= 'ORD2026070310000' 
  AND order_no <= 'ORD2026070310999';
```

## 七、慢查询监控体系建设

### 7.1 MySQL 慢查询日志配置

```ini
# my.cnf 配置
[mysqld]
# 慢查询阈值（秒）
long_query_time = 0.5
# 记录未使用索引的查询
log_queries_not_using_indexes = ON
# 慢查询日志路径
slow_query_log_file = /var/log/mysql/mysql-slow.log
# 慢查询日志开启
slow_query_log = ON
# 记录扫描行数超过此阈值的查询
min_examined_row_limit = 1000
# 日志格式（MySQL 5.7+）
log_output = FILE
# 记录管理语句
log_slow_admin_statements = ON
# 记录复制语句
log_slow_slave_statements = ON
```

### 7.2 Performance Schema 监控

```sql
-- 开启 statements digest 采样
UPDATE performance_schema.setup_consumers 
SET ENABLED = 'YES' 
WHERE NAME LIKE '%statement%';

-- 查看最耗时的 SQL 模板
SELECT 
    digest_text,
    count_star AS exec_count,
    round(sum_timer_wait/1000000, 2) AS total_ms,
    round(avg_timer_wait/1000000, 2) AS avg_ms,
    round(max_timer_wait/1000000, 2) AS max_ms,
    sum_rows_examined,
    sum_rows_sent,
    round(sum_rows_examined / count_star, 0) AS avg_rows_examined
FROM performance_schema.events_statements_summary_by_digest
WHERE digest_text IS NOT NULL
ORDER BY sum_timer_wait DESC
LIMIT 10;

-- 查看当前正在执行的慢查询
SELECT 
    thread_id,
    sql_text,
    timer_wait/1000000000000 AS duration_sec,
    rows_examined,
    rows_sent,
    event_name
FROM performance_schema.events_statements_current
WHERE timer_wait > 500000000000  -- 超过 0.5 秒
ORDER BY timer_wait DESC;
```

### 7.3 Prometheus + Grafana 告警

```yaml
# Prometheus 规则
groups:
  - name: mysql-slow-query
    rules:
      - alert: MysqlSlowQuerySpike
        expr: |
          rate(mysql_global_status_slow_queries[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Slow query spike on {{ $labels.instance }}"
          description: "Slow query rate: {{ $value }}/s"
      
      - alert: MysqlHighFullScan
        expr: |
          rate(mysql_global_status_select_full_join[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High full scan rate on {{ $labels.instance }}"
```

## 八、面试要点

### Q1: MySQL 慢查询突增，排查步骤是什么？

**参考回答**：

> 1. **确认范围**：是单个 SQL 变慢还是整体变慢？用 `SHOW PROCESSLIST` 看当前活跃查询
> 2. **分析慢查询日志**：用 `pt-query-digest` 按 Response time 排序，找出 Top N 慢 SQL
> 3. **EXPLAIN 分析**：看执行计划，重点关注 type、key、rows、Extra 字段
> 4. **判断原因**：
>    - 如果 rows 很大 → 索引问题
>    - 如果 Extra 有 Using filesort → 排序问题
>    - 如果 Extra 有 Using temporary → 临时表问题
>    - 如果 rows 小但慢 → 锁等待或 IO 问题
> 5. **紧急处理**：Kill 长查询 + 限流降级
> 6. **根因修复**：加索引 / 更新统计信息 / 重写 SQL

### Q2: 什么情况下会出现执行计划漂移？如何预防？

**参考回答**：

> 执行计划漂移通常发生在：
> 1. **统计信息过期**：数据大量增删但 `ANALYZE TABLE` 未执行
> 2. **数据分布变化**：如某个枚举值从 1% 变成 50%，优化器可能改换索引
> 3. **并发查询互相影响**：一个查询的 buffer pool 预热影响了另一个查询
> 4. **MySQL 版本升级**：优化器策略变化
> 
> 预防方法：
> - 定期执行 `ANALYZE TABLE`
> - 使用 `ANALYZE TABLE ... PERSISTENT FOR` 持久化统计信息
> - 对关键 SQL 使用 `FORCE INDEX` 固定索引
> - 建立慢查询基线，异常时对比执行计划变化

### Q3: 如何判断一个索引是否有效？EXPLAIN 中哪些字段最关键？

**参考回答**：

> 重点关注四个字段：
> 1. **type**：理想值是 `const`、`eq_ref`、`ref`、`range`，最差是 `ALL`
> 2. **rows**：预估扫描行数，越小越好
> 3. **filtered**：过滤后剩余百分比，100% 最好
> 4. **Extra**：`Using index`（覆盖索引）最好，`Using filesort` 和 `Using temporary` 最差
> 
> 核心判断标准：**扫描行数 / 返回行数** 的比值越接近 1 越好。如果扫描 10 万行返回 10 行，索引效率极低。

### Q4: MySQL 中深分页如何优化？

**参考回答**：

> 三种方案：
> 1. **游标分页**：记录上一页最后一条记录的 ID，用 `WHERE id < last_id` 替代 `OFFSET`
> 2. **延迟关联**：先通过子查询（走覆盖索引）获取 ID，再 JOIN 回表
> 3. **BETWEEN 范围查询**：如果 ID 连续，直接用 `WHERE id BETWEEN ? AND ?`

## 九、避坑指南

### 坑 1：ANALYZE TABLE 的时机

```sql
-- 不要在业务高峰期执行 ANALYZE TABLE
-- 它虽然不会锁表，但会触发统计信息重新计算
-- 可能导致一批 SQL 的执行计划同时变化

-- 正确做法：在低峰期执行，或者使用持久化统计信息
SET PERSIST innodb_stats_persistent = ON;
SET PERSIST innodb_stats_auto_recalc = ON;
```

### 坑 2：索引不是越多越好

```sql
-- 每增加一个索引：
-- 1. 写入性能下降（需要维护索引树）
-- 2. 磁盘空间增加
-- 3. 优化器选择路径增多，可能选错

-- 查看索引使用情况
SELECT 
    index_name,
    table_name,
    rows_read,
    rows_indexed,
    IF(rows_read > 0, 'USED', 'UNUSED') AS status
FROM information_schema.index_statistics
WHERE table_schema = 'order_db';

-- 删除未使用的索引
ALTER TABLE orders DROP INDEX idx_unused;
```

### 坑 3：EXPLAIN 的 rows 是估算值

```sql
-- EXPLAIN 的 rows 是基于统计信息的估算值
-- 实际值可能差 10 倍以上

-- 如果需要精确值，用 EXPLAIN ANALYZE（MySQL 8.0+）
EXPLAIN ANALYZE SELECT * FROM orders WHERE merchant_id = 10086;

-- 或者直接测量
SET profiling = 1;
SELECT * FROM orders WHERE merchant_id = 10086;
SHOW PROFILE;
```

### 坑 4：FORCE INDEX 可能导致更差的结果

```sql
-- 当数据分布变化后，FORCE INDEX 指定的索引可能不再最优
-- 定期审查所有 FORCE INDEX 的使用

-- 查找代码中的 FORCE INDEX
grep -rn "FORCE INDEX\|USE INDEX\|IGNORE INDEX" src/ --include="*.java"

-- 建议用注释说明原因
SELECT * FROM orders FORCE INDEX (idx_merchant_time) 
-- FORCE INDEX: 优化器在 merchant_id 数据分布不均时选错索引，已确认此索引最优
WHERE merchant_id = 10086 AND status = 'PAID';
```

### 坑 5：慢查询日志文件过大

```bash
# 慢查询日志可能增长到几十 GB
ls -lh /var/lib/mysql/mysql-slow.log
# -rw-rw---- 1 mysql mysql 50G Jul 3 10:00 mysql-slow.log

# 配置日志轮转
# /etc/logrotate.d/mysql-slow
/var/lib/mysql/mysql-slow.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 660 mysql mysql
    postrotate
        mysqladmin flush-logs
    endscript
}
```

## 十、预防体系

### 10.1 SQL 上线审核流程

```
┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  开发提交  │───▶│  SQL 审核    │───▶│  测试环境    │───▶│  生产发布    │
│  SQL       │    │  (自动+人工) │    │  验证        │    │              │
└────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                        │                    │
                        ▼                    ▼
                   EXPLAIN 检查         压测验证
                   索引检查             执行计划对比
                   规范检查             慢查询基线
```

### 10.2 自动化 SQL 审核工具

```sql
-- 使用 pt-query-advisor 自动审核 SQL
pt-query-digest --review h=127.0.0.1,D=query_review,t=review_table \
  /var/lib/mysql/mysql-slow.log

-- 或使用 Yearning / Archery 等 SQL 审核平台
-- 配置审核规则：
-- 1. 禁止 SELECT *
-- 2. 必须有 WHERE 条件
-- 3. LIMIT 必须有上限
-- 4. 禁止不带 ON 条件的 JOIN
-- 5. 索引字段必须有 NOT NULL 约束
```

### 10.3 执行计划基线对比

```bash
#!/bin/bash
# compare-execution-plan.sh — 定期对比关键 SQL 的执行计划

CRITICAL_SQLS=(
    "SELECT * FROM orders WHERE merchant_id = 10086 AND status = 'PAID' ORDER BY create_time DESC LIMIT 20"
    "SELECT COUNT(*) FROM orders WHERE create_time > '2026-07-01' AND status = 'PAID'"
)

BASELINE_DIR="/opt/mysql-baseline"
CURRENT_DIR="/opt/mysql-current"

mkdir -p $CURRENT_DIR

for sql in "${CRITICAL_SQLS[@]}"; do
    hash=$(echo "$sql" | md5sum | awk '{print $1}')
    mysql -e "EXPLAIN $sql" > $CURRENT_DIR/explain_$hash.txt
done

# 对比基线
for f in $CURRENT_DIR/*.txt; do
    base=$BASELINE_DIR/$(basename $f)
    if [ -f "$base" ]; then
        if ! diff -q "$base" "$f" > /dev/null; then
            echo "[ALERT] Execution plan changed for $(basename $f)"
            diff "$base" "$f"
        fi
    fi
done
```

## 总结

MySQL 慢查询突增排查的核心流程：**监控告警 → pt-query-digest 定位 Top SQL → EXPLAIN 分析执行计划 → 判断根因 → 紧急处理 + 根因修复**。

三点核心经验：
1. **慢查询突增的根因通常是"原来快的 SQL 变慢了"**，而不是新出现的慢 SQL
2. **统计信息过期是执行计划漂移的最常见原因**，定期 ANALYZE TABLE 是成本最低的预防措施
3. **索引设计遵循"等值在前、范围在后、排序最后"原则**，一个好的联合索引可以消灭 90% 的慢查询
