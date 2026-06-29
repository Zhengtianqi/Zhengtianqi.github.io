---
title: "MySQL 索引原理与优化实战"
tag: ["MySQL", "数据库", "索引优化", "SQL优化", "后端"]
category: 数据库
date: 2026-06-27
---

# MySQL 索引原理与优化实战

> MySQL是世界上最流行的开源关系型数据库，它为Web应用提供了稳定可靠的数据存储方案。
> 本文系统梳理了MySQL的核心概念和最佳实践，是后端开发者的必备知识。

没有索引时，MySQL 查找一条记录需要**全表扫描**（从头到尾扫一遍）。对于 1000 万行的表，这意味着扫描 1000 万行数据。

有索引时，MySQL 通过 B+ 树查找，只需要 3-4 次磁盘 I/O 就能找到目标数据。

**类比：** 索引就像字典的目录。没有目录，找一个字得翻完整本字典；有目录，先查目录定位到页码，直接翻到那一页。

### 1.2 索引的代价

索引不是银弹，它有代价：

- **空间代价**：每个索引是一棵 B+ 树，占额外存储空间
- **写入代价**：INSERT/UPDATE/DELETE 需要同时维护索引树
- **优化器代价**：索引太多会让优化器选择困难

**经验法则：** 一张表 5-6 个索引是合理的上限，超过 10 个就需要审视了。

## 二、B+ 树索引原理

### 2.1 B+ 树结构

MySQL InnoDB 引擎使用 B+ 树作为索引结构：

```
                    [根节点 Page]
                   /      |      \
            [内部节点]  [内部节点]  [内部节点]
           /    |    \    |    \    |    \
       [叶子]→[叶子]→[叶子]→[叶子]→[叶子]→[叶子]   ← 叶子节点双向链表
        |数据|  |数据|  |数据|  |数据|  |数据|  |数据|
```

**B+ 树的关键特性：**

1. **所有数据都在叶子节点**：非叶子节点只存索引（路由）
2. **叶子节点形成双向链表**：范围查询极高效
3. **树很矮**：3-4 层就能存储千万级数据

### 2.2 为什么 B+ 树适合数据库

**对比二叉树：**

二叉树每个节点最多 2 个子节点，存储 1000 万数据需要约 24 层（log2(1000万)），每层一次磁盘 I/O，太慢了。

**对比 B 树：**

B 树的非叶子节点也存数据，导致：
- 每个节点能存的 key 更少，树更高
- 范围查询需要回溯，效率低

**B+ 树的优势：**

InnoDB 默认页大小 16KB，假设主键是 bigint（8字节），指针 6字节：
- 非叶子节点每页可存：16384 / (8+6) ≈ 1170 个 key
- 3 层 B+ 树可存：1170 × 1170 × 16 ≈ 2100 万行（每页 16 行数据）
- 查找任何一行只需 3 次磁盘 I/O

### 2.3 聚簇索引 vs 非聚簇索引

**聚簇索引（Clustered Index）：**

- 叶子节点存储**完整行数据**
- 一张表只能有一个聚簇索引（通常是主键）
- InnoDB 的主键索引就是聚簇索引

```
主键索引（聚簇索引）：
[10 | 行数据] → [20 | 行数据] → [30 | 行数据] → [40 | 行数据]
```

**非聚簇索引（Secondary Index，二级索引）：**

- 叶子节点存储**主键值**（不是行数据）
- 查询需要**回表**：先查二级索引拿到主键，再用主键查聚簇索引
- 一张表可以有多个二级索引

```
二级索引（如 name 列）：
[Alice | 10] → [Bob | 30] → [Charlie | 20] → [David | 40]
         ↓回表      ↓回表        ↓回表          ↓回表
    查聚簇索引   查聚簇索引    查聚簇索引     查聚簇索引
```

### 2.4 回表的代价

```sql
-- 假设有索引：idx_name (name)
SELECT * FROM users WHERE name = 'Alice';

-- 执行过程：
-- 1. 在 idx_name 中查找 Alice → 得到主键 id=10
-- 2. 在聚簇索引中查找 id=10 → 得到完整行数据
-- 3. 这就是"回表"
```

**回表是随机 I/O，性能比顺序 I/O 差很多。** 如果查询只需要索引列，就不用回表，这叫**覆盖索引**。

## 三、索引类型详解

### 3.1 主键索引

```sql
-- 创建表时指定主键（自动创建聚簇索引）
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    email VARCHAR(100)
);

-- 或后续添加
ALTER TABLE users ADD PRIMARY KEY (id);
```

**避坑：没有主键的表**

InnoDB 如果没有主键，会：
1. 先找第一个非空唯一索引作为聚簇索引
2. 如果也没有，InnoDB 会创建一个隐藏的 6 字节 row_id 作为聚簇索引

隐藏 row_id 的问题：
- 你看不到它，无法用于查询
- 所有无主键表共用同一个全局 row_id 计数器，并发时有锁竞争

**结论：每张表必须有主键，推荐自增整数型。**

### 3.2 唯一索引

```sql
CREATE UNIQUE INDEX idx_email ON users(email);
```

唯一索引既保证唯一性，又加速查询。但要注意：

- **插入性能**：唯一索引需要检查唯一性，比普通索引慢
- **死锁风险**：并发插入相同值可能死锁
- **NULL 例外**：唯一索引允许多个 NULL 值

### 3.3 联合索引

```sql
-- 联合索引：最常用的索引类型
CREATE INDEX idx_name_age ON users(name, age, city);
```

**最左前缀原则：**

联合索引 `(name, age, city)` 的 B+ 树是按 name 排序，name 相同按 age 排序，age 相同按 city 排序。

```
能命中索引：
✅ WHERE name = 'Alice'
✅ WHERE name = 'Alice' AND age = 25
✅ WHERE name = 'Alice' AND age = 25 AND city = 'BJ'
✅ WHERE name = 'Alice' AND age > 20        -- name 等值，age 范围

不能命中索引：
❌ WHERE age = 25                            -- 缺少 name（最左前缀）
❌ WHERE city = 'BJ'                         -- 缺少 name 和 age
❌ WHERE name = 'Alice' AND city = 'BJ'      -- 跳过了 age（中间断裂）
```

**关键理解：索引是排序的。** name 相同时 age 是有序的，但如果跳过 age 直接查 city，city 在 name 相同的组内是无序的。

### 3.4 覆盖索引

如果查询的列都包含在索引中，就不需要回表：

```sql
-- 索引：idx_name_age (name, age)

-- ✅ 覆盖索引：只查 name 和 age，不用回表
SELECT name, age FROM users WHERE name = 'Alice';

-- ❌ 需要回表：查了 email，不在索引中
SELECT name, age, email FROM users WHERE name = 'Alice';
```

**优化技巧：利用覆盖索引避免回表**

```sql
-- 假设有联合索引 idx_status_created (status, created_at)

-- ❌ 慢：需要回表取所有字段
SELECT * FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20;

-- ✅ 快：先查主键，再回表（减少回表次数）
SELECT * FROM orders o 
INNER JOIN (
    SELECT id FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20
) t ON o.id = t.id;
```

这个技巧叫**延迟关联**，通过子查询先利用覆盖索引拿到主键，再 JOIN 取完整数据，减少回表次数。

### 3.5 前缀索引

对于长字符串列，可以只索引前 N 个字符：

```sql
-- 只索引 email 前 6 个字符
CREATE INDEX idx_email_prefix ON users(email(6));

-- 但前缀索引不能用于覆盖索引和 ORDER BY
SELECT email FROM users WHERE email = 'alice@test.com';  -- 仍然需要回表验证
```

**前缀长度选择：**

```sql
-- 计算不同前缀长度的选择性
SELECT 
    COUNT(DISTINCT LEFT(email, 4)) / COUNT(*) AS sel_4,
    COUNT(DISTINCT LEFT(email, 5)) / COUNT(*) AS sel_5,
    COUNT(DISTINCT LEFT(email, 6)) / COUNT(*) AS sel_6,
    COUNT(DISTINCT LEFT(email, 7)) / COUNT(*) AS sel_7,
    COUNT(DISTINCT email) / COUNT(*) AS sel_full
FROM users;
```

选择性越接近完整列越好，一般选选择性 > 0.9 的最短前缀。

## 四、索引失效场景

### 4.1 函数操作

```sql
-- 索引：idx_created_at (created_at)

-- ❌ 索引失效：对索引列使用函数
SELECT * FROM orders WHERE DATE(created_at) = '2026-06-27';
SELECT * FROM orders WHERE YEAR(created_at) = 2026;

-- ✅ 索引生效：改写为范围查询
SELECT * FROM orders 
WHERE created_at >= '2026-06-27 00:00:00' 
  AND created_at < '2026-06-28 00:00:00';
```

### 4.2 隐式类型转换

```sql
-- 假设 phone 是 VARCHAR 类型，有索引 idx_phone

-- ❌ 索引失效：传入数字，MySQL 隐式转换为字符串比较
SELECT * FROM users WHERE phone = 13800138000;

-- ✅ 索引生效：传入字符串
SELECT * FROM users WHERE phone = '13800138000';
```

**原因：** MySQL 的规则是"字符串转数字"，所以它把每行的 phone 转成数字再比较，等于对每行用了函数，索引失效。

### 4.3 模糊查询

```sql
-- 索引：idx_name (name)

-- ❌ 索引失效：以 % 开头
SELECT * FROM users WHERE name LIKE '%Alice%';
SELECT * FROM users WHERE name LIKE '%Alice';

-- ✅ 索引生效：前缀匹配
SELECT * FROM users WHERE name LIKE 'Alice%';
```

**如果必须做后缀匹配？** 考虑存一个反转字段：

```sql
-- 存储时额外存一个反转字段
INSERT INTO users(name, name_reversed) VALUES ('Alice', 'ecilA');

-- 查询时用反转字段做前缀匹配
SELECT * FROM users WHERE name_reversed LIKE 'ecilA%';
```

### 4.4 OR 条件

```sql
-- 索引：idx_name (name), idx_age (age)

-- ❌ 可能不走索引：OR 两边必须有索引才能用 index_merge
SELECT * FROM users WHERE name = 'Alice' OR phone = '123';  -- phone 没索引

-- ✅ 都有索引时可以用 index_merge
SELECT * FROM users WHERE name = 'Alice' OR age = 25;

-- ✅ 更好：改写为 UNION
SELECT * FROM users WHERE name = 'Alice'
UNION
SELECT * FROM users WHERE age = 25;
```

### 4.5 范围查询导致后续索引失效

```sql
-- 索引：idx_name_age_city (name, age, city)

-- ❌ city 用不到索引：age 的范围查询导致 city 无法使用索引
SELECT * FROM users WHERE name = 'Alice' AND age > 20 AND city = 'BJ';

-- ✅ 调整索引顺序：(name, city, age)
-- 这样 name 等值 + city 等值 + age 范围，三个都能用到
```

**原则：联合索引中，范围查询的列放最后。**

### 4.6 不等于 (!= / <>)

```sql
-- ❌ 通常不走索引
SELECT * FROM users WHERE status != 'DELETED';

-- ✅ 如果非 deleted 的值很少，可以改写
SELECT * FROM users WHERE status IN ('ACTIVE', 'PENDING');
```

### 4.7 IS NOT NULL

```sql
-- ❌ 通常不走索引（NULL 值少时）
SELECT * FROM users WHERE email IS NOT NULL;

-- ✅ 通常走索引（NULL 值多时）
SELECT * FROM users WHERE email IS NULL;
```

MySQL 优化器会根据数据分布决定是否走索引，不是绝对的。

## 五、执行计划分析

### 5.1 EXPLAIN 详解

```sql
EXPLAIN SELECT * FROM users WHERE name = 'Alice' AND age = 25;
```

```
+----+-------------+-------+------------+------+---------------+----------+---------+-------+------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key      | key_len | ref   | rows | filtered | Extra |
+----+-------------+-------+------------+------+---------------+----------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | users | NULL       | ref  | idx_name_age  | idx_name_age | 128    | const |   10 |    10.00 | NULL  |
+----+-------------+-------+------------+------+---------------+----------+---------+-------+------+----------+-------+
```

**关键字段解读：**

| 字段 | 说明 | 关注点 |
|------|------|--------|
| **type** | 访问类型 | 从好到坏：system > const > eq_ref > ref > range > index > ALL |
| **key** | 实际使用的索引 | NULL 表示没走索引 |
| **key_len** | 索引使用长度 | 判断联合索引用了几个列 |
| **rows** | 预估扫描行数 | 越小越好 |
| **filtered** | 过滤比例 | 越接近 100 越好 |
| **Extra** | 额外信息 | 看到 Using filesort / Using temporary 要警惕 |

### 5.2 type 详解

```sql
-- const：主键或唯一索引等值查询，最多返回一行
EXPLAIN SELECT * FROM users WHERE id = 1;
-- type = const（最优）

-- eq_ref：JOIN 时被驱动表用主键或唯一索引
EXPLAIN SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
-- orders 表 type = eq_ref

-- ref：非唯一索引等值查询
EXPLAIN SELECT * FROM users WHERE name = 'Alice';
-- type = ref

-- range：索引范围查询
EXPLAIN SELECT * FROM users WHERE id BETWEEN 1 AND 100;
-- type = range

-- index：扫描整个索引树（不回表但全索引扫描）
EXPLAIN SELECT count(*) FROM users;
-- type = index

-- ALL：全表扫描（最差）
EXPLAIN SELECT * FROM users WHERE phone = '13800138000';  -- phone 无索引
-- type = ALL
```

**生产红线：type = ALL 必须优化（除非表很小）。**

### 5.3 Extra 详解

| Extra 值 | 说明 | 是否需要优化 |
|----------|------|-------------|
| Using index | 覆盖索引，不回表 | ✅ 理想 |
| Using where | 通过 WHERE 过滤 | ⚠️ 正常 |
| Using index condition | 索引下推（ICP） | ✅ 好优化 |
| Using filesort | 额外排序 | ❌ 需优化 |
| Using temporary | 使用临时表 | ❌ 需优化 |
| Using join buffer | JOIN 无索引用缓冲 | ❌ 需优化 |

**Using filesort 优化：**

```sql
-- ❌ Using filesort：ORDER BY 的列没有索引
SELECT * FROM orders WHERE user_id = 100 ORDER BY created_at DESC;

-- ✅ 创建联合索引
CREATE INDEX idx_user_created ON orders(user_id, created_at);
-- 现在利用索引的有序性，无需额外排序
```

### 5.4 索引下推（ICP）

MySQL 5.6+ 引入的优化：

```sql
-- 索引：idx_name_age (name, age)
SELECT * FROM users WHERE name LIKE 'A%' AND age = 25;

-- 无 ICP：
-- 1. 在索引中找所有 name LIKE 'A%' 的记录（可能 1000 条）
-- 2. 逐条回表，检查 age = 25（1000 次回表）

-- 有 ICP：
-- 1. 在索引中找 name LIKE 'A%' 的记录
-- 2. 同时在索引中检查 age = 25（索引中有 age 字段）
-- 3. 只有 age = 25 的才回表（可能只 10 条回表）
```

ICP 大大减少了回表次数。

## 六、慢 SQL 优化实战

### 6.1 开启慢查询日志

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;        -- 超过 1 秒的查询
SET GLOBAL log_queries_not_using_indexes = 'ON';  -- 记录不走索引的查询

-- 慢查询日志位置
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### 6.2 实战案例一：分页查询优化

```sql
-- ❌ 慢：深分页，MySQL 需要扫描前 1000020 行然后丢弃前 1000000 行
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000000, 20;
-- 执行时间：3.2s

-- ✅ 优化方案1：延迟关联
SELECT o.* FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY created_at DESC LIMIT 1000000, 20
) t ON o.id = t.id;
-- 执行时间：0.3s（子查询走覆盖索引）

-- ✅ 优化方案2：游标分页（记住上一页的最大 id）
SELECT * FROM orders 
WHERE id < 1000000    -- 上一页最后一条的 id
ORDER BY id DESC LIMIT 20;
-- 执行时间：0.001s（主键索引，范围查询）
```

**游标分页的局限：** 只能"上一页/下一页"，不能跳转到指定页。但大多数场景（信息流、动态）够用。

### 6.3 实战案例二：JOIN 优化

```sql
-- ❌ 慢：被驱动表没有索引，Nested Loop Join 全表扫描
SELECT o.*, u.name FROM orders o
JOIN users u ON o.user_id = u.phone   -- phone 没索引
WHERE o.status = 'PAID';
-- 执行时间：12s（10000 订单 × 100000 用户 = 10亿次比较）

-- ✅ 优化：给被驱动表的 JOIN 列加索引
CREATE INDEX idx_phone ON users(phone);
-- 执行时间：0.2s

-- ✅ 更好：JOIN 用主键
SELECT o.*, u.name FROM orders o
JOIN users u ON o.user_id = u.id   -- id 是主键，有索引
WHERE o.status = 'PAID';
```

**JOIN 优化原则：**
1. 被驱动表的 JOIN 列必须有索引
2. 小表驱动大表（小表在外层循环）
3. 用 STRAIGHT_JOIN 强制 JOIN 顺序（谨慎使用）

### 6.4 实战案例三：COUNT 优化

```sql
-- ❌ 慢：COUNT(*) 需要扫描大量行
SELECT COUNT(*) FROM orders WHERE status = 'PENDING' AND created_at > '2026-01-01';

-- ✅ 优化方案1：汇总表
CREATE TABLE order_stats (
    stat_date DATE,
    status VARCHAR(20),
    count INT,
    PRIMARY KEY (stat_date, status)
);

-- 定时更新统计表
INSERT INTO order_stats VALUES (CURDATE(), 'PENDING', 
    (SELECT COUNT(*) FROM orders WHERE status = 'PENDING' AND DATE(created_at) = CURDATE()))
ON DUPLICATE KEY UPDATE count = VALUES(count);

-- 查询走统计表
SELECT SUM(count) FROM order_stats WHERE status = 'PENDING' AND stat_date > '2026-01-01';

-- ✅ 优化方案2：Redis 缓存
-- 维护一个 Redis 计数器，写入订单时 INCR，取消订单时 DECR
String count = redis.get("order:count:pending");
```

### 6.5 实战案例四：复杂查询拆分

```sql
-- ❌ 慢：复杂子查询，临时表 + filesort
SELECT * FROM orders o
WHERE o.user_id IN (
    SELECT user_id FROM orders 
    WHERE product_id = 100 
    GROUP BY user_id 
    HAVING COUNT(*) > 5
)
AND o.status = 'PAID'
ORDER BY o.created_at DESC
LIMIT 20;
-- 执行时间：8s

-- ✅ 拆分为两步
-- Step 1: 查出符合条件的 user_id
SELECT user_id FROM orders 
WHERE product_id = 100 
GROUP BY user_id 
HAVING COUNT(*) > 5;
-- 结果：[1, 5, 12, 28, 35]

-- Step 2: 用结果查询
SELECT * FROM orders 
WHERE user_id IN (1, 5, 12, 28, 35) 
AND status = 'PAID'
ORDER BY created_at DESC 
LIMIT 20;
-- 执行时间：0.1s
```

### 6.6 实战案例五：FORCE INDEX

当优化器选错索引时：

```sql
-- MySQL 可能选了 idx_status 而不是 idx_user_status，导致扫描更多行
SELECT * FROM orders WHERE user_id = 100 AND status = 'PAID';

-- 强制使用更优的联合索引
SELECT * FROM orders FORCE INDEX(idx_user_status) 
WHERE user_id = 100 AND status = 'PAID';
```

**注意：FORCE INDEX 是最后的手段，优先通过调整 SQL 或统计信息让优化器自己选对。**

```sql
-- 更新统计信息
ANALYZE TABLE orders;
```

## 七、索引设计原则

### 7.1 建索引的列

1. **WHERE 条件频繁出现的列**
2. **JOIN 关联的列**（被驱动表）
3. **ORDER BY / GROUP BY 的列**
4. **高选择性的列**（不同值多）

### 7.2 不建索引的列

1. **低选择性**（如 status 只有 0/1）
2. **频繁更新的列**（写入代价高）
3. **大文本/大字段**（索引太大）
4. **很少用于查询的列**

### 7.3 联合索引设计顺序

```
等值查询的列 → 排序列 → 范围查询的列
```

```sql
-- 查询模式：WHERE status = ? AND user_id = ? ORDER BY created_at DESC
-- 索引设计：(status, user_id, created_at)
CREATE INDEX idx_status_user_created ON orders(status, user_id, created_at);
```

## 八、面试要点总结

### 高频面试题

1. **B+ 树为什么适合做数据库索引？**
   - 树矮（3-4层存千万数据），磁盘 I/O 次数少
   - 叶子节点双向链表，范围查询高效
   - 非叶子节点不存数据，能存更多 key，树更矮

2. **聚簇索引和非聚簇索引的区别？**
   - 聚簇索引叶子节点存完整行数据，非聚簇索引存主键值
   - 聚簇索引一张表只能一个，非聚簇索引可以多个
   - 非聚簇索引查询可能需要回表

3. **什么是回表？如何避免？**
   - 回表：二级索引找到主键，再查聚簇索引找行数据
   - 避免：使用覆盖索引，查询列都在索引中

4. **联合索引的最左前缀原则？**
   - 联合索引 (a, b, c) 只能按 a → b → c 的顺序使用
   - 遇到范围查询（>、<、LIKE）后面的列不能用索引
   - 跳过中间列后面的列不能用索引

5. **索引失效的常见场景？**
   - 对索引列使用函数/计算
   - 隐式类型转换
   - LIKE 以 % 开头
   - OR 中有一侧无索引
   - 不等于 (!= / <>)

6. **如何优化深分页？**
   - 延迟关联：子查询走覆盖索引取主键，再 JOIN
   - 游标分页：记住上一页最后的 id，WHERE id < ? LIMIT

### 核心知识点速记

```
B+ 树 = 叶子存数据 + 双向链表 + 树矮
聚簇索引 = 主键索引，存完整行
非聚簇索引 = 二级索引，存主键值
回表 = 二级索引 → 聚簇索引
覆盖索引 = 查询列全在索引中，不回表
最左前缀 = 联合索引按顺序使用
索引下推 = 在索引层过滤，减少回表
Using filesort = 额外排序，需优化
Using temporary = 临时表，需优化
延迟关联 = 深分页优化技巧
```

## 总结

索引优化是 MySQL 性能调优的核心技能。记住以下要点：

1. **理解 B+ 树**：知道为什么索引能加速，就知道为什么有时候不加速
2. **避免索引失效**：函数操作、类型转换、% 前缀是三大杀手
3. **学会看 EXPLAIN**：type、key、rows、Extra 是四个关键字段
4. **联合索引设计**：等值 → 排序 → 范围，遵循最左前缀
5. **覆盖索引**：能不回表就不回表，减少随机 I/O
6. **定期 ANALYZE**：保持统计信息准确，让优化器做对决策

最后一句：**不是加了索引就快，加错了索引反而更慢。** 每次加索引前，先 EXPLAIN 看看执行计划。
