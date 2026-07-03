---
title: "MySQL EXPLAIN 执行计划深度解读：type、Extra、key 的含义"
tag:
  - MySQL
  - EXPLAIN
  - 索引优化
  - 查询调优
  - 面试
category: 数据库
date: 2026-07-03
---

# MySQL EXPLAIN 执行计划深度解读：type、Extra、key 的含义

> EXPLAIN 是 MySQL 查询优化的"X 光机"。一条 SQL 跑得慢，不猜、不试，先 EXPLAIN 一把，执行计划一目了然。本文从 12 个字段逐个拆解，配合真实案例与原理图解，带你从"看懂"到"能优化"。

## 一、EXPLAIN 是什么

当你对一条 SELECT 语句加上 `EXPLAIN` 前缀时，MySQL 不会真正执行这条 SQL，而是返回一个"执行计划"——它告诉你 MySQL 打算怎么走索引、扫描多少行、是否用到临时表等。

```sql
EXPLAIN SELECT * FROM users WHERE age > 25 AND city = 'Beijing';
```

MySQL 8.0+ 还支持 `FORMAT=TREE` 和 `FORMAT=JSON`：

```sql
-- 树形格式，更直观地看 JOIN 结构
EXPLAIN FORMAT=TREE SELECT * FROM users u JOIN orders o ON u.id = o.user_id;

-- JSON 格式，包含成本信息
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE age > 25;
```

执行计划的核心输出：

```
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
| id | select_type | table | type       | possible_keys | key   | key_len | ref   | rows  | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
|  1 | SIMPLE      | users | range      | idx_age       | idx_age| 5      | NULL  |  8500 |    33.33 | Using where |
+----+-------------+-------+------------+------+---------------+-------+---------+-------+------+----------+-------------+
```

---

## 二、id —— 查询序号

`id` 表示 SELECT 的序号，标识执行顺序。

| 规则 | 含义 |
|------|------|
| id 相同 | 同一组查询，从上往下执行 |
| id 不同 | id 越大越先执行（子查询/派生表） |
| id 为 NULL | UNION 结果集中的临时表去重操作 |

**原理图解：执行顺序**

```
        ┌─────────────┐
        │  id=2 先执行  │  子查询：从 orders 取 user_id
        │  SUBQUERY    │
        └──────┬───────┘
               │ 结果集
               ▼
        ┌─────────────┐
        │  id=1 后执行  │  主查询：用子查询结果过滤 users
        │  PRIMARY     │
        └─────────────┘
```

---

## 三、select_type —— 查询类型

| 值 | 含义 | 触发场景 |
|----|------|----------|
| `SIMPLE` | 简单查询，无子查询/UNION | 普通单表/多表 JOIN |
| `PRIMARY` | 复杂查询的最外层 | 含子查询时的外层 |
| `SUBQUERY` | 子查询中的第一个 SELECT | `WHERE id IN (SELECT ...)` |
| `DERIVED` | 派生表 | `FROM (SELECT ...) t` |
| `UNION` | UNION 中第二个及之后的 SELECT | `SELECT ... UNION SELECT ...` |
| `UNION RESULT` | UNION 的结果 | 去重临时表 |
| `DEPENDENT SUBQUERY` | 依赖外层的子查询 | 相关子查询（性能差） |

> ⚠️ **避坑**：MySQL 8.0 优化器会自动把一些 DERIVED 合并到外层查询，但并非所有情况。派生表无法走索引，尽量改写为 JOIN。

---

## 四、table —— 访问的表名

可能是真实表名、别名（`u`）、派生表（`<derived2>`）或 UNION 结果（`<union1,2>`）。

---

## 五、type —— 访问类型（核心！）

`type` 是 EXPLAIN 中**最重要的字段**。从快到慢：

```
system > const > eq_ref > ref > range > index > ALL
└─ 最快                                              └─ 最慢
```

### 5.1 const —— 主键/唯一索引等值查询

```sql
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type=const, key=PRIMARY, ref=const
```

通过主键或唯一索引匹配一行，速度极快（O(1)）。

### 5.2 eq_ref —— JOIN 中使用主键/唯一索引

```sql
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- u 表: type=eq_ref, ref=db.o.user_id
```

JOIN 中最好的访问类型，被驱动表通过主键精确匹配一行。

### 5.3 ref —— 非唯一索引等值查询

```sql
EXPLAIN SELECT * FROM users WHERE city = 'Beijing';
-- type=ref, key=idx_city, ref=const
```

日常优化中最常见的目标级别。

### 5.4 range —— 索引范围扫描

```sql
EXPLAIN SELECT * FROM users WHERE age BETWEEN 20 AND 30;
EXPLAIN SELECT * FROM users WHERE id > 1000;
EXPLAIN SELECT * FROM users WHERE city IN ('Beijing', 'Shanghai');
-- type=range, key=idx_age
```

触发条件：`BETWEEN`、`> < >= <=`、`IN`、`IS NULL`。

### 5.5 index —— 全索引扫描

扫描整棵索引树，不需回表。比 ALL 快（索引比数据小），但不如 range/ref。

```sql
EXPLAIN SELECT count(*) FROM users;
-- type=index, key=idx_city (优化器选最小索引)
```

### 5.6 ALL —— 全表扫描（最差！）

```sql
EXPLAIN SELECT * FROM users;  -- 无 WHERE
-- type=ALL, key=NULL
```

> **优化目标**：至少 `range`，最好 `ref` 或 `eq_ref`。`ALL` 是红线。

### type 速查表

```
┌──────────┬───────────────────────┬────────────────┐
│ 级别     │ 含义                  │ 性能           │
├──────────┼───────────────────────┼────────────────┤
│ system   │ 系统表，单行          │ ⭐⭐⭐⭐⭐⭐⭐⭐  │
│ const    │ PK/唯一索引等值       │ ⭐⭐⭐⭐⭐⭐⭐☆  │
│ eq_ref   │ JOIN PK/唯一索引      │ ⭐⭐⭐⭐⭐⭐☆☆  │
│ ref      │ 非唯一索引等值        │ ⭐⭐⭐⭐⭐☆☆☆  │
│ range    │ 索引范围扫描          │ ⭐⭐⭐⭐☆☆☆☆  │
│ index    │ 全索引扫描            │ ⭐⭐⭐☆☆☆☆☆  │
│ ALL      │ 全表扫描              │ ☆☆☆☆☆☆☆☆☆  │
└──────────┴───────────────────────┴────────────────┘
```

---

## 六、possible_keys —— 可能用到的索引

优化器认为**可能适用**的索引列表。有值不代表用了，看 `key` 确认。

> ⚠️ 如果 `possible_keys` 有值但 `key` 为 NULL，说明优化器认为全表扫描比走索引更快（回表代价太大或符合条件的行太多）。

---

## 七、key —— 实际使用的索引

优化器最终选择的索引。NULL 表示没走索引。

```sql
-- 强制使用某索引
SELECT * FROM users FORCE INDEX(idx_city) WHERE city = 'Beijing';
-- 建议使用（可忽略）
SELECT * FROM users USE INDEX(idx_city) WHERE city = 'Beijing';
-- 忽略某索引
SELECT * FROM users IGNORE INDEX(idx_age) WHERE age = 25;
```

> ⚠️ **避坑**：不要滥用 `FORCE INDEX`。数据分布变化后强制索引可能不再最优。

---

## 八、key_len —— 索引使用长度

判断**联合索引用了几个字段**的关键指标。

### 字节数计算规则

| 数据类型 | 字节数 |
|----------|--------|
| `INT` | 4 |
| `BIGINT` | 8 |
| `VARCHAR(n)` | n × 4 + 2（utf8mb4） |
| `DATETIME` | 5 |
| 允许 NULL | +1 |

### 示例

```sql
-- 联合索引 idx_name_age_city (name VARCHAR(50), age INT, city VARCHAR(20))
-- name: 50*4+2=202, age: 4, city: 20*4+2=82, 合计=288

EXPLAIN SELECT * FROM users WHERE name = '张三' AND age = 25;
-- key_len=206 → 用了 name+age

EXPLAIN SELECT * FROM users WHERE name = '张三';
-- key_len=202 → 只用了 name
```

---

## 九、ref —— 索引比较来源

| 值 | 含义 |
|----|------|
| `const` | 常量比较 |
| `db.table.col` | JOIN 关联列 |
| `NULL` | 无索引比较（range/ALL/index） |

---

## 十、rows —— 预估扫描行数

优化器估算值，基于索引基数计算。统计信息过期会偏差很大，用 `ANALYZE TABLE` 更新。

`rows × filtered%` = 实际参与后续处理的行数。

---

## 十一、filtered —— 过滤百分比

WHERE 条件过滤后剩余行百分比。低 filtered 值意味着扫描很多行但大部分丢弃——优化信号。

---

## 十二、Extra —— 附加信息（关键！）

### 12.1 Using index —— 覆盖索引（✅ 好！）

查询列全在索引中，**不需要回表**。

```sql
-- 索引 idx_name_age (name, age)
EXPLAIN SELECT name, age FROM users WHERE name = '张三';
-- Extra: Using index
```

### 12.2 Using where —— 需回表过滤（⚠️ 一般）

服务层对存储引擎返回数据做额外 WHERE 过滤。

### 12.3 Using index condition —— 索引下推 ICP（✅ 好）

MySQL 5.6+ 将 WHERE 条件下推到存储引擎层，索引层过滤，减少回表。

```
【无 ICP】name LIKE '张%' → 1000条全部回表 → age>20过滤 → 100条
  回表次数: 1000 次 ❌

【有 ICP】name LIKE '张%' AND age>20 → 100条 → 回表
  回表次数: 100 次 ✅
```

### 12.4 Using temporary —— 临时表（❌ 差！）

常见于 GROUP BY/DISTINCT 与索引不一致时。大结果集落盘严重影响性能。

### 12.5 Using filesort —— 额外排序（❌ 差！）

ORDER BY 非索引列。优化：为 ORDER BY 列建索引。

### 12.6 Using join buffer —— 无索引 JOIN（❌ 差！）

Block Nested Loop 算法，给关联字段加索引可消除。

### Extra 速查表

| Extra 值 | 好坏 | 含义 |
|----------|------|------|
| `Using index` | ✅ | 覆盖索引，无需回表 |
| `Using index condition` | ✅ | 索引下推，减少回表 |
| `Using where` | ⚠️ | 需回表过滤 |
| `Using temporary` | ❌ | 使用临时表 |
| `Using filesort` | ❌ | 额外排序 |
| `Using join buffer` | ❌ | 无索引 JOIN |
| `Using MRR` | ✅ | 多范围读优化 |

---

## 十三、索引失效场景大全

### 13.1 对索引列使用函数或运算

```sql
-- ❌ 失效
SELECT * FROM users WHERE YEAR(create_time) = 2026;
SELECT * FROM users WHERE age + 1 = 26;

-- ✅ 改写
SELECT * FROM users WHERE create_time >= '2026-01-01' AND create_time < '2027-01-01';
SELECT * FROM users WHERE age = 25;
```

### 13.2 隐式类型转换

```sql
-- ❌ phone 是 VARCHAR 但传数字
SELECT * FROM users WHERE phone = 13800138000;

-- ✅ 传字符串
SELECT * FROM users WHERE phone = '13800138000';
```

### 13.3 LIKE 以通配符开头

```sql
-- ❌ B+树无法定位
SELECT * FROM users WHERE name LIKE '%三';

-- ✅ 前缀匹配
SELECT * FROM users WHERE name LIKE '张%';
```

### 13.4 OR 条件中部分列无索引

```sql
-- ❌ age 有索引但 city 没有 → 全表扫描
SELECT * FROM users WHERE age = 25 OR city = 'Beijing';

-- ✅ 两侧都加索引 → index_merge
ALTER TABLE users ADD INDEX idx_city(city);
```

### 13.5 NOT IN / != 

```sql
-- ❌ 通常不走索引
SELECT * FROM users WHERE city != 'Beijing';

-- ✅ 改写 LEFT JOIN
SELECT u.* FROM users u
LEFT JOIN blacklist b ON u.id = b.user_id
WHERE b.user_id IS NULL;
```

### 13.6 联合索引不满足最左前缀

```sql
-- 联合索引 idx_a_b_c (a, b, c)
-- ✅ WHERE a=1 | WHERE a=1 AND b=2 | WHERE a=1 AND b=2 AND c=3
-- ❌ WHERE b=2 AND c=3 (跳过 a)
-- ⚠️ WHERE a=1 AND c=3 (只用 a，c 通过 ICP)
```

### 索引失效全景图

```
┌──────────────────┬───────────────────────────────────┐
│ 函数/运算包裹列   │ YEAR(col), LEFT(col), col+1       │
│ 隐式类型转换      │ VARCHAR 列传数字                   │
│ LIKE '%xxx'      │ 左模糊导致 B+树无法定位             │
│ OR 部分无索引     │ OR 两侧需都有索引才走 index_merge  │
│ NOT IN / !=      │ 选择性差时优化器放弃索引            │
│ 违反最左前缀      │ 联合索引跳过左侧列                  │
│ ORDER BY 非索引列 │ Using filesort                    │
│ GROUP BY 非索引列 │ Using temporary                   │
└──────────────────┴───────────────────────────────────┘
```

---

## 十四、优化实战案例：从 ALL 到 ref

### 场景：1000 万行订单表

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_no VARCHAR(32) NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL,
    create_time DATETIME NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB;
```

### 优化前

```sql
EXPLAIN SELECT * FROM orders
WHERE user_id = 8888 AND status = 1 AND create_time >= '2026-01-01';
```

```
+----+--------+------+---------------+------------+---------+-------+--------+----------+-----------+
| id | table  | type | possible_keys | key        | key_len | rows  |filtered| Extra    |
+----+--------+------+---------------+------------+---------+-------+--------+----------+-----------+
|  1 | orders | ref  | idx_user_id   | idx_user_id| 8       | 12000 |   1.00 |Using where|
+----+--------+------+---------------+------------+---------+-------+--------+----------+-----------+
```

问题：回表 12000 次只得 120 行结果，filtered=1%。

### 优化第一步：联合索引

```sql
ALTER TABLE orders ADD INDEX idx_uid_status_ctime (user_id, status, create_time);
```

```
+----+--------+-------+--------------+---------------------+---------+------+----------+-----------+
| id | table  | type  | possible_keys| key                 | key_len | rows |filtered  | Extra     |
+----+--------+-------+--------------+---------------------+---------+------+----------+-----------+
|  1 | orders | range | idx_uid_...  | idx_uid_status_ctime| 16      |  150 | 100      |Using index|
|    |        |       |              |                     |         |      |          |condition  |
+----+--------+-------+--------------+---------------------+---------+------+----------+-----------+
```

rows=150，filtered=100%，ICP 生效。

### 优化第二步：覆盖索引

```sql
ALTER TABLE orders ADD INDEX idx_cover (user_id, status, create_time, amount);

EXPLAIN SELECT user_id, status, amount, create_time
FROM orders
WHERE user_id = 8888 AND status = 1 AND create_time >= '2026-01-01';
```

```
+----+--------+------+-----------+-----------+---------+------+----------+-------------+
| id | table  | type | possible  | key       | key_len | rows | filtered | Extra       |
+----+--------+------+-----------+-----------+---------+------+----------+-------------+
|  1 | orders | range| idx_cover | idx_cover | 16      |  150 | 100      | Using index |
+----+--------+------+-----------+-----------+---------+------+----------+-------------+
```

Extra=Using index，**0 次回表**！

### 效果对比

```
┌──────────────┬──────────┬────────┬───────────┬──────────────┐
│ 优化阶段     │ type     │ rows   │ Extra     │ 回表次数     │
├──────────────┼──────────┼────────┼───────────┼──────────────┤
│ 优化前       │ ref      │ 12000  │ Using where│ ~12000      │
│ 联合索引     │ range    │   150  │ Using ICP  │   ~150      │
│ 覆盖索引     │ range    │   150  │ Using index│     0       │
└──────────────┴──────────┴────────┴───────────┴──────────────┘
耗时: 800ms → 15ms → 3ms
```

---

## 十五、复杂查询实战分析

```sql
EXPLAIN
SELECT o.id, o.amount, u.name
FROM orders o JOIN users u ON o.user_id = u.id
WHERE o.status = 'PAID' AND o.create_time > '2026-01-01'
ORDER BY o.amount DESC LIMIT 20;
```

假设输出：

```
+----+-------+--------+------+---------+---------+----------------+--------+----------+---------------------------+
| id | table | type   | key  | key_len | ref     | rows           |filtered| Extra                     |
+----+-------+--------+------+---------+---------+----------------+--------+----------+---------------------------+
|  1 | o     | ALL    | NULL | NULL    | NULL    | 100万          |  10.00 | Using where; Using filesort|
|  1 | u     | eq_ref | PRI  | 8       |db.o.user_id| 1           | 100.00 | NULL                      |
+----+-------+--------+------+---------+---------+----------------+--------+----------+---------------------------+
```

**问题**：orders 全表扫描 + filesort。users 的 eq_ref 没问题。

**优化**：

```sql
-- 加联合索引消除全表扫描 + filesort
CREATE INDEX idx_status_ctime_amount ON orders(status, create_time, amount);

-- 优化后：orders type=range, rows=5000, Extra=Using index condition
-- 扫描行数 100万→5千，消除 filesort
```

---

## 十六、EXPLAIN ANALYZE（MySQL 8.0.18+）

真正执行 SQL 并给出实际耗时：

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 8888 AND status = 1;
```

```
-> Index lookup on orders using idx_uid_status_ctime (user_id=8888, status=1)
    (cost=12.5 rows=150) (actual time=0.12..0.85 rows=148 loops=1)
```

- `cost`：估算成本
- `actual time`：实际耗时（ms）
- `rows`：实际返回行数

> 估算 rows 和 actual rows 差距大时，用 `ANALYZE TABLE` 更新统计信息。

---

## 十七、面试要点

### Q1：EXPLAIN 中 type 有哪些级别？从快到慢排列。

**A**：system > const > eq_ref > ref > range > index > ALL。const 是主键/唯一索引等值查询，eq_ref 是 JOIN 中使用主键/唯一索引，ref 是非唯一索引等值查询。生产环境至少达到 range，ALL 是红线。

### Q2：Using index 和 Using index condition 有什么区别？

**A**：`Using index` 是覆盖索引，查询列全在索引中，不需要回表。`Using index condition` 是索引下推（ICP），WHERE 条件下推到存储引擎层在索引上过滤，减少回表次数，但仍需回表取未覆盖的列。

### Q3：key_len 怎么计算？有什么用？

**A**：key_len 是实际使用的索引字节数，用于判断联合索引用了几个字段。INT=4, BIGINT=8, VARCHAR(n)=n×4+2(utf8mb4), DATETIME=5, 允许 NULL +1。联合索引 (a,b,c) 的 key_len 如果只等于 a 的字节数，说明只用了最左列。

### Q4：possible_keys 有值但 key 为 NULL 是什么原因？

**A**：优化器评估后认为走索引不如全表扫描。原因：1）符合条件的行占比太高，回表代价大；2）统计信息不准。用 `ANALYZE TABLE` 更新后重新评估。

### Q5：Using temporary 和 Using filesort 如何消除？

**A**：`Using temporary` 常见于 GROUP BY/DISTINCT 非索引列，`Using filesort` 常见于 ORDER BY 非索引列。消除方法：为 GROUP BY/ORDER BY 列建合适索引，使数据天然有序。同时出现两者是严重性能问题。

### Q6：索引下推（ICP）的原理？

**A**：无 ICP 时，存储引擎根据索引第一个条件取记录全部回表，服务层再过滤其他条件。有 ICP 后，WHERE 中联合索引列的条件被下推到存储引擎层，在索引上直接过滤，只有满足所有索引条件的记录才回表。大幅减少回表次数。

### Q7：联合索引 (a, b, c) 哪些查询走索引？

**A**：
- `WHERE a=1` → ✅ 用 a
- `WHERE a=1 AND b=2` → ✅ 用 a, b
- `WHERE a=1 AND b=2 AND c=3` → ✅ 用 a, b, c
- `WHERE b=2 AND c=3` → ❌ 违反最左前缀
- `WHERE a=1 AND c=3` → ⚠️ 只用 a，c 通过 ICP 过滤
- `WHERE a=1 AND b>2 AND c=3` → ⚠️ 用 a 和 b 范围扫描，b 是范围查询中断了 c

### Q8：如何判断 SQL 是否需要优化？

**A**：看 EXPLAIN 关键指标：
1. `type` 是否为 ALL
2. `Extra` 是否有 Using temporary 或 Using filesort
3. `rows` 是否远大于实际结果集
4. `filtered` 是否很低（< 10%）
5. `key` 是否为 NULL

---

## 十八、总结

1. **type** 是最重要指标，ALL 需优先解决
2. **Extra** 中 Using temporary 和 Using filesort 是危险信号
3. **key_len** 判断联合索引用了几列
4. **rows × filtered** 评估扫描效率
5. 索引失效有 7 大场景，对号入座
6. 优化路径：联合索引 → 索引下推 → 覆盖索引
7. MySQL 8.0 用 `EXPLAIN ANALYZE` 获取真实耗时

> 记住：**不要猜，先 EXPLAIN**。执行计划会告诉你答案。

---

## 附录 A：EXPLAIN 各字段速查卡

```
┌──────────────┬──────────────────────────────────────────────┐
│ 字段          │ 关键点                                       │
├──────────────┼──────────────────────────────────────────────┤
│ id           │ 越大越先执行；相同则从上往下                 │
│ select_type  │ SIMPLE 最好；DEPENDENT SUBQUERY 需警惕       │
│ table        │ <derivedN> 派生表；<unionM,N> 合并结果      │
│ type         │ 核心！至少 range，ALL 必须优化               │
│ possible_keys│ 候选索引，有值不代表用了                     │
│ key          │ 实际索引，NULL=没走索引                     │
│ key_len      │ 联合索引用了几列的关键指标                   │
│ ref          │ const=常量；tbl.col=JOIN关联；NULL=范围扫描  │
│ rows         │ 预估扫描行数，越少越好                      │
│ filtered     │ 过滤百分比，低=扫描多但大部分丢弃           │
│ Extra        │ Using index 最好；temporary/filesort 最差   │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 附录 B：常见慢查询优化套路

### 套路 1：LIMIT 深度分页

```sql
-- ❌ 慢：扫描前 100000 行再取 10 行
SELECT * FROM orders ORDER BY id LIMIT 100000, 10;

-- ✅ 快：用游标分页（记住上一页最大 id）
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 10;

-- ✅ 快：延迟关联（先查 id 再回表）
SELECT o.* FROM orders o
JOIN (SELECT id FROM orders ORDER BY id LIMIT 100000, 10) t
ON o.id = t.id;
```

### 套路 2：COUNT 优化

```sql
-- ❌ 慢：InnoDB COUNT(*) 需要扫描
SELECT COUNT(*) FROM orders WHERE status = 1;

-- ✅ 方案 1：维护汇总表
SELECT count FROM order_stats WHERE status = 1;

-- ✅ 方案 2：Redis 缓存
-- ✅ 方案 3：估算值（不需要精确时）
EXPLAIN SELECT * FROM orders WHERE status = 1;
-- 看 rows 字段获取估算值
```

### 套路 3：OR 改 UNION

```sql
-- ❌ 可能不走索引
SELECT * FROM users WHERE age = 25 OR city = 'Beijing';

-- ✅ 拆成 UNION ALL（两个查询各走各的索引）
SELECT * FROM users WHERE age = 25
UNION ALL
SELECT * FROM users WHERE city = 'Beijing' AND age != 25;
```

### 套路 4：子查询改 JOIN

```sql
-- ❌ DEPENDENT SUBQUERY（每行都执行子查询）
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE amount > 100);

-- ✅ 改为 JOIN
SELECT DISTINCT u.* FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100;
```

### 套路 5：避免 SELECT *

```sql
-- ❌ 回表取所有列
SELECT * FROM users WHERE city = 'Beijing';

-- ✅ 只取需要的列（可能覆盖索引）
SELECT id, name, age FROM users WHERE city = 'Beijing';
-- 如果有 idx_city_name_age，Extra=Using index，无需回表
```

---

## 附录 C：优化器 hint（MySQL 8.0+）

```sql
-- 优化器 hint（比 FORCE INDEX 更灵活）
SELECT /*+ NO_INDEX_MERGE(u idx_age,idx_city) */ *
FROM users u
WHERE u.age = 25 AND u.city = 'Beijing';

-- 指定 JOIN 顺序
SELECT /*+ JOIN_ORDER(u, o) */ *
FROM users u JOIN orders o ON u.id = o.user_id;

-- 指定 JOIN 算法
SELECT /*+ HASH_JOIN(u, o) */ *
FROM users u JOIN orders o ON u.name = o.customer_name;

-- BKA (Batched Key Access)
SELECT /*+ BKA(o) */ *
FROM users u JOIN orders o ON u.id = o.user_id;
```

> 这些 hint 写在 SQL 注释中，`/*+ ... */`，如果优化器不支持会自动忽略，不影响执行。

---

## 附录 D：optimizer_switch 常用开关

```sql
-- 查看当前开关状态
SHOW VARIABLES LIKE 'optimizer_switch';

-- 关闭 ICP（调试用，生产不建议）
SET optimizer_switch='index_condition_pushdown=off';

-- 关闭 MRR
SET optimizer_switch='mrr=off';

-- 关闭 index_merge
SET optimizer_switch='index_merge=off';

-- 开启 BKA
SET optimizer_switch='batched_key_access=on';
```

| 开关 | 作用 | 默认 |
|------|------|------|
| index_condition_pushdown | 索引下推 | ON |
| mrr | 多范围读 | ON |
| mrr_cost_based | MRR 成本评估 | ON |
| index_merge | 索引合并 | ON |
| batched_key_access | BKA | OFF |
| derived_merge | 派生表合并 | ON |
| hash_join | Hash Join (8.0.18+) | ON |
