---
title: MySQL 索引原理与优化实战：从 B+ 树到慢查询治理
tag: ["MySQL", "索引", "B+树", "慢查询", "优化"]
category: 数据库
date: 2026-06-27
---

# MySQL 索引原理与优化实战：从 B+ 树到慢查询治理

线上接口突然变慢？慢查询日志暴涨？CPU 飙升？90% 的数据库性能问题都是索引问题。从 B+ 树底层原理到生产实战，一篇讲透 MySQL 索引优化。

---

## 一、B+ 树索引原理

### 1.1 为什么是 B+ 树

```
B 树（B-Tree）：
  每个节点存数据 → 一个节点能存的 key 少 → 树更高 → 磁盘 IO 更多

B+ 树（B+ Tree）：
  非叶子节点只存 key → 一个节点能存更多 key → 树更矮 → IO 更少
  数据只存叶子节点 → 叶子节点用双向链表连接 → 范围查询极快

MySQL InnoDB 选择 B+ 树的原因：
  1. 磁盘 IO 少（树矮，通常 3-4 层即可存千万级数据）
  2. 范围查询快（叶子节点链表，一次定位后顺序扫描）
  3. 查询稳定（每次都查到叶子节点，时间复杂度稳定 O(logN)）
```

### 1.2 InnoDB B+ 树结构

```
                    ┌─────────────────────┐
     第1层          │  10 | 20 | 30 | 40   │          ← 非叶子节点（只存 key + 指针）
                    └──┬────┬────┬────┬───┘
            ┌──────────┘    │    │    └──────────┐
            ▼               ▼    ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ 5  8  10 │    │ 15 18 20 │    │ 25 28 30 │      ← 叶子节点（key + data）
     └──┬───────┘◄──►└──────────┘◄──►└──────────┘     ← 双向链表
        │               │               │
     [data]          [data]          [data]

一个 InnoDB 页默认 16KB：
  非叶子节点：一个页约存 1170 个 key（假设 key+指针=14B）
  叶子节点：一个页约存 16 条数据（假设每条 1KB）
  3 层 B+ 树：1170 × 1170 × 16 ≈ 2190 万条记录
  → 3 次 IO 即可定位任意一条数据
```

---

## 二、聚簇索引 vs 非聚簇索引

### 2.1 聚簇索引（Clustered Index）

```
聚簇索引：数据和索引存在一起，叶子节点直接存整行数据
InnoDB 的主键索引就是聚簇索引

一张表只能有一个聚簇索引（数据只能按一种顺序物理存储）

主键查询：SELECT * FROM order WHERE id = 100
  → 在聚簇索引 B+ 树上定位 → 直接拿到整行数据
  → 1 次查询
```

### 2.2 非聚簇索引（Secondary Index）

```
非聚簇索引：叶子节点存的是主键值，不是整行数据
需要回表（Bookmark Lookup）才能拿到完整数据

普通索引查询：SELECT * FROM order WHERE order_no = 'ORD001'
  1. 在二级索引 B+ 树上找到 order_no = 'ORD001' → 拿到主键 id = 100
  2. 回表：在聚簇索引上用 id = 100 找到整行数据
  → 2 次查询（回表）

覆盖索引：SELECT id, order_no FROM order WHERE order_no = 'ORD001'
  → 二级索引上就能拿到 id 和 order_no，不需要回表
  → 1 次查询（索引覆盖）
```

### 2.3 InnoDB vs MyISAM

```
InnoDB：
  聚簇索引（数据）+ 二级索引（主键值）
  主键查询快（1 次 IO），二级索引需回表

MyISAM：
  数据和索引分离存储
  所有索引都是非聚簇的，叶子节点存数据行地址
  没有聚簇索引的概念
```

---

## 三、索引类型与使用

### 3.1 索引类型

```sql
-- 主键索引（聚簇索引）
CREATE TABLE `order` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  ...
);

-- 唯一索引
ALTER TABLE `order` ADD UNIQUE INDEX uk_order_no (`order_no`);

-- 普通索引
ALTER TABLE `order` ADD INDEX idx_user_id (`user_id`);

-- 联合索引（最左前缀原则）
ALTER TABLE `order` ADD INDEX idx_user_status_time (`user_id`, `status`, `create_time`);

-- 前缀索引（长字符串）
ALTER TABLE `order` ADD INDEX idx_remark (`remark`(20));

-- 全文索引
ALTER TABLE `order` ADD FULLTEXT INDEX ft_content (`content`);
```

### 3.2 联合索引与最左前缀原则

```
联合索引 (a, b, c) 的 B+ 树排序：
  先按 a 排序，a 相同按 b 排序，b 相同按 c 排序

  a b c
  1 1 1
  1 1 2
  1 2 1
  1 2 3
  2 1 1
  2 1 2

能走索引的查询：
  WHERE a = 1                    ✅ 用到 a
  WHERE a = 1 AND b = 2          ✅ 用到 a, b
  WHERE a = 1 AND b = 2 AND c = 1 ✅ 用到 a, b, c
  WHERE a = 1 AND c = 1          ✅ 只用到 a（c 不能跳过 b）
  WHERE a > 1 AND b = 2          ✅ 只用到 a（范围查询后中断）
  WHERE b = 2                    ❌ 不走索引（缺少最左列 a）
  WHERE b = 2 AND c = 1          ❌ 不走索引
```

### 3.3 索引下推（ICP, Index Condition Pushdown）

```sql
-- 联合索引 (a, b)
-- MySQL 5.6 之前：
SELECT * FROM t WHERE a = 1 AND b LIKE '%abc%';
-- 1. 在索引上找到所有 a = 1 的记录
-- 2. 回表检查每条记录的 b LIKE '%abc%'
-- 回表次数 = a = 1 的记录数

-- MySQL 5.6+ ICP：
-- 1. 在索引上找到所有 a = 1 的记录
-- 2. 在索引上直接过滤 b LIKE '%abc%'（索引下推）
-- 3. 只对满足条件的记录回表
-- 回表次数 = a = 1 AND b LIKE '%abc%' 的记录数（大幅减少）
```

---

## 四、EXPLAIN 执行计划详解

### 4.1 EXPLAIN 字段

```sql
EXPLAIN SELECT * FROM `order` WHERE user_id = 100 AND status = 1;
```

| 字段 | 含义 | 关注点 |
|------|------|--------|
| id | 查询序号 | id 大的先执行 |
| select_type | 查询类型 | SIMPLE/PRIMARY/SUBQUERY |
| **table** | 表名 | |
| **type** | 访问类型 | ⭐ 重点：system > const > eq_ref > ref > range > index > ALL |
| **possible_keys** | 可能用的索引 | |
| **key** | 实际用的索引 | ⭐ NULL 表示没用索引 |
| **key_len** | 索引使用长度 | ⭐ 判断联合索引用了几个字段 |
| ref | 索引比较来源 | const/func/列名 |
| **rows** | 预估扫描行数 | ⭐ 越小越好 |
| **Extra** | 额外信息 | ⭐ Using index / Using filesort / Using temporary |

### 4.2 type 详解

```
system   → 表只有一行（系统表）
const    → 主键或唯一索引等值查询
eq_ref   → JOIN 时被驱动表用主键/唯一索引
ref      → 普通索引等值查询
range    → 索引范围查询（BETWEEN, >, <, IN）
index    → 扫描整个索引树（比 ALL 好，但不理想）
ALL      → 全表扫描（最差，必须优化）
```

### 4.3 Extra 详解

```
Using index              → 覆盖索引，不回表（好）
Using where              → 用 WHERE 过滤（正常）
Using index condition    → 索引下推（好）
Using filesort           → 文件排序（需优化）
Using temporary          → 使用临时表（需优化）
Using MRR                → 多范围读优化
```

### 4.4 实战分析

```sql
-- 案例 1：全表扫描
EXPLAIN SELECT * FROM `order` WHERE remark LIKE '%退款%';
-- type: ALL, key: NULL
-- 优化：前缀LIKE '%退款' 可走索引，双 % 不能

-- 案例 2：索引失效
EXPLAIN SELECT * FROM `order` WHERE DATE(create_time) = '2024-01-01';
-- type: ALL, key: NULL
-- 函数作用于索引列导致失效
-- 优化：WHERE create_time >= '2024-01-01' AND create_time < '2024-01-02'

-- 案例 3：隐式类型转换
EXPLAIN SELECT * FROM `order` WHERE order_no = 12345;
-- type: ALL, key: NULL
-- order_no 是 varchar，传了 int 导致隐式转换失效
-- 优化：WHERE order_no = '12345'

-- 案例 4：联合索引中断
-- 索引：(user_id, status, create_time)
EXPLAIN SELECT * FROM `order` WHERE user_id = 100 AND create_time > '2024-01-01';
-- key_len: 8（只用到了 user_id，status 被跳过）
-- 优化：WHERE user_id = 100 AND status IS NOT NULL AND create_time > '2024-01-01'
```

---

## 五、索引失效场景

### 5.1 十大索引失效场景

```sql
-- 1. 函数操作索引列
WHERE YEAR(create_time) = 2024           -- ❌ 失效
WHERE DATE(create_time) = '2024-01-01'   -- ❌ 失效
-- ✅ WHERE create_time >= '2024-01-01' AND create_time < '2024-01-02'

-- 2. 隐式类型转换
WHERE order_no = 12345                    -- ❌ 失效（varchar 列传 int）
WHERE user_id = '100'                     -- ✅ 不失效（int 列传 string，MySQL 自动转）

-- 3. 运算操作
WHERE id + 1 = 100                        -- ❌ 失效
WHERE id = 100 - 1                        -- ✅ 不失效

-- 4. 左模糊
WHERE order_no LIKE '%ORD'                -- ❌ 失效
WHERE order_no LIKE 'ORD%'                -- ✅ 不失效

-- 5. OR 连接非索引列
WHERE user_id = 100 OR remark = 'xxx'     -- ❌ 失效（remark 无索引）
-- ✅ 给 remark 加索引，或用 UNION

-- 6. != 或 <>
WHERE status != 1                         -- ❌ 可能失效（取决于数据分布）
-- ✅ 改为 IN：WHERE status IN (0, 2, 3)

-- 7. NOT IN / NOT EXISTS
WHERE id NOT IN (1, 2, 3)                 -- ❌ 可能失效
-- ✅ 用 LEFT JOIN 替代

-- 8. IS NOT NULL（某些情况）
WHERE create_time IS NOT NULL             -- ❌ 可能失效（如果大部分非 NULL）

-- 9. 联合索引最左前缀违反
-- 索引 (a, b, c)
WHERE b = 1 AND c = 2                     -- ❌ 失效

-- 10. ORDER BY 与索引方向不一致
-- 索引 (a, b)
WHERE a = 1 ORDER BY b DESC, c ASC        -- ❌ c 方向不一致，filesort
```

---

## 六、慢查询治理

### 6.1 开启慢查询日志

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;           -- 超过 1 秒记录
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL log_queries_not_using_indexes = 'ON';  -- 记录未用索引的查询

-- 永久生效：my.cnf
-- [mysqld]
-- slow_query_log = 1
-- slow_query_log_file = /var/log/mysql/slow.log
-- long_query_time = 1
-- log_queries_not_using_indexes = 1
```

### 6.2 使用 pt-query-digest 分析

```bash
# 安装 Percona Toolkit
yum install percona-toolkit

# 分析慢查询日志
pt-query-digest /var/log/mysql/slow.log > slow-report.txt

# 输出示例：
# Rank  Query ID           Response time   Calls  R/Call   V/M
# ===== ================== =============== ====== ======== =====
# 1     0xABC123...         120.5 45.2%    500    0.241    0.1
# 2     0xDEF456...          80.3 30.1%    200    0.402    0.2

# 重点关注 Response time 占比高的查询
```

### 6.3 实战：慢查询优化案例

```sql
-- 慢查询：
SELECT * FROM `order` 
WHERE user_id = 100 AND status = 1 
ORDER BY create_time DESC 
LIMIT 20;

-- EXPLAIN: type=ref, rows=50000, Extra: Using filesort
-- 问题：有 (user_id, status, create_time) 索引，但 filesort

-- 原因：MySQL 5.7 之前，ORDER BY DESC 与索引方向不一致
-- 优化：创建降序索引（MySQL 8.0+）
ALTER TABLE `order` 
  ADD INDEX idx_user_status_time_desc (`user_id`, `status`, `create_time` DESC);

-- 或者：调整联合索引顺序，让范围查询列在最后
ALTER TABLE `order` 
  ADD INDEX idx_user_status_time (`user_id`, `status`, `create_time`);
-- WHERE user_id = 100 AND status = 1 ORDER BY create_time DESC
-- 索引天然有序，避免 filesort
```

---

## 七、索引优化策略

### 7.1 索引设计原则

```
1. 查询频繁的 WHERE / JOIN / ORDER BY / GROUP BY 列建索引
2. 区分度高的列建索引（选择性 > 70%）
3. 联合索引按区分度从高到低排列
4. 避免冗余索引（(a,b) 已包含 (a) 的前缀）
5. 单表索引数量不超过 5 个
6. 字符串列用前缀索引
7. 尽量用覆盖索引避免回表
```

### 7.2 索引选择性

```sql
-- 计算索引选择性
SELECT 
  COUNT(DISTINCT status) / COUNT(*) AS status_selectivity,
  COUNT(DISTINCT user_id) / COUNT(*) AS user_id_selectivity,
  COUNT(DISTINCT create_time) / COUNT(*) AS time_selectivity
FROM `order`;

-- 理想选择性 > 0.7
-- status_selectivity: 0.05（只有几个状态值，不适合单独建索引）
-- user_id_selectivity: 0.8（好）
-- time_selectivity: 0.99（好）

-- 联合索引顺序：(create_time, user_id, status) 按选择性从高到低
-- 但要考虑最左前缀原则与查询条件匹配
```

### 7.3 覆盖索引优化

```sql
-- 查询 1：需要回表
SELECT * FROM `order` WHERE user_id = 100;
-- 优化：无法避免回表（需要所有字段）

-- 查询 2：可以覆盖
SELECT id, user_id, status FROM `order` WHERE user_id = 100;
-- 如果有索引 (user_id, status)，id 是主键自动包含
-- → 覆盖索引，不回表

-- 查询 3：优化为覆盖索引
-- 原始
SELECT order_no, amount, status FROM `order` WHERE user_id = 100;
-- 建索引
ALTER TABLE `order` ADD INDEX idx_user_no_amount_status (`user_id`, `order_no`, `amount`, `status`);
-- 但索引太宽，写入性能下降，需权衡
```

---

## 八、生产环境实战

### 8.1 线上加索引（Online DDL）

```sql
-- MySQL 5.6+ 支持 Online DDL，加索引不锁表
ALTER TABLE `order` ADD INDEX idx_user_id (`user_id`), ALGORITHM=INPLACE, LOCK=NONE;

-- 大表加索引用 pt-online-schema-change
pt-online-schema-change \
  --alter "ADD INDEX idx_user_id (user_id)" \
  --execute \
  D=orders,t=order

-- 原理：
-- 1. 创建影子表
-- 2. 复制数据 + 创建索引
-- 3. 用触发器同步增量变更
-- 4. 原子重命名切换
```

### 8.2 索引监控

```sql
-- 查看索引使用情况
SELECT 
  object_schema AS db,
  object_name AS table_name,
  index_name,
  count_read,       -- 索引读取次数
  count_write,      -- 索引写入次数
  count_fetch       -- 索引回表次数
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'orders'
ORDER BY count_read DESC;

-- 找从未使用的索引（可删除）
SELECT * FROM sys.schema_unused_indexes
WHERE object_schema NOT IN ('information_schema', 'mysql', 'sys');
```

---

## 九、面试要点

### Q：为什么 MySQL 用 B+ 树而不是 B 树、红黑树、Hash？

- **vs B 树**：B+ 树非叶子节点不存数据，一个节点能存更多 key，树更矮，IO 更少。叶子节点链表支持范围查询。
- **vs 红黑树**：红黑树是二叉树，树高远大于 B+ 树（1000 万数据，红黑树高约 23，B+ 树高约 3），IO 次数太多。
- **vs Hash**：Hash 查询单条 O(1) 很快，但不支持范围查询、排序，Memory 引擎用 Hash 索引。

### Q：聚簇索引和非聚簇索引的区别？

聚簇索引的叶子节点直接存数据行（InnoDB 主键索引），一张表只能有一个。非聚簇索引的叶子节点存主键值，需要回表。查询时尽量用覆盖索引避免回表。

### Q：联合索引 (a,b,c) 以下查询能走索引吗？

```sql
WHERE a = 1 AND b > 2 AND c = 3   -- a,b 走索引，c 不走（范围查询后中断）
WHERE a = 1 ORDER BY b, c         -- 走索引（索引天然有序）
WHERE a = 1 AND b IN (1,2) AND c = 3  -- a,b,c 都走索引（IN 等值查询）
```

---

## 十、总结

索引优化三板斧：

1. **建对索引**：联合索引按区分度排序，遵循最左前缀原则
2. **用对索引**：避免索引失效场景（函数、隐式转换、左模糊、运算）
3. **少回表**：覆盖索引优先，只查需要的字段

记住：**type 要到 ref 以上，rows 要尽量小，Extra 不能有 filesort 和 temporary**。
