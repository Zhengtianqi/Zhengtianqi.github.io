---
title: PostgreSQL进阶特性实战：窗口函数、CTE与JSONB
tag: ["MySQL", "PostgreSQL", "数据库"]
category: 数据库
date: 2026-06-12
---

# PostgreSQL进阶特性实战：窗口函数、CTE与JSONB

> PostgreSQL进阶特性实战：窗口函数、CTE与JSONB是系统设计的核心，它决定了数据的存储方式和访问效率。
> 本文介绍了PostgreSQL进阶特性实战：窗口函数、CTE与JSONB的原理和最佳实践，帮助你构建高效的数据存储方案。

窗口函数（Window Function）在**不折叠行**的前提下进行聚合计算。与 GROUP BY 不同，窗口函数保留了每一行的独立性，同时可以引用"窗口"内的其他行。

```sql
-- GROUP BY：行被折叠
SELECT department, AVG(salary) FROM employees GROUP BY department;
-- 结果：每个部门一行

-- 窗口函数：保留每一行，同时附加部门平均工资
SELECT
    name, department, salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
-- 结果：每个员工一行，多了 dept_avg 列
```

### 1.2 基础语法

```sql
函数名() OVER (
    PARTITION BY 列名       -- 分组
    ORDER BY 列名           -- 排序
    ROWS/RANGE BETWEEN ...  -- 窗口范围
)
```

### 1.3 排名函数

先创建示例数据：

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    hire_date DATE
);

INSERT INTO employees (name, department, salary, hire_date) VALUES
('张三', '技术部', 15000, '2020-03-15'),
('李四', '技术部', 18000, '2019-06-01'),
('王五', '技术部', 18000, '2019-08-20'),
('赵六', '技术部', 12000, '2021-01-10'),
('孙七', '产品部', 16000, '2020-05-01'),
('周八', '产品部', 14000, '2021-03-01'),
('吴九', '产品部', 14000, '2020-09-15'),
('郑十', '销售部', 13000, '2022-01-01');
```

**ROW_NUMBER()**：严格排队，不重复

```sql
SELECT
    name, department, salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
FROM employees;
```

| name | department | salary | rn |
|------|------------|--------|----|
| 李四 | 技术部 | 18000 | 1 |
| 王五 | 技术部 | 18000 | 2 |
| 张三 | 技术部 | 15000 | 3 |
| 赵六 | 技术部 | 12000 | 4 |
| 孙七 | 产品部 | 16000 | 1 |
| 周八 | 产品部 | 14000 | 2 |
| 吴九 | 产品部 | 14000 | 3 |

**RANK()**：同值同排名，下一个排名跳号

```sql
SELECT
    name, department, salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank
FROM employees;
```

| name | department | salary | rank |
|------|------------|--------|------|
| 李四 | 技术部 | 18000 | 1 |
| 王五 | 技术部 | 18000 | 1 |
| 张三 | 技术部 | 15000 | 3 |  ← 跳过了2

**DENSE_RANK()**：同值同排名，下一个排名不跳号

```sql
SELECT
    name, department, salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rnk
FROM employees;
```

| name | department | salary | dense_rnk |
|------|------------|--------|-----------|
| 李四 | 技术部 | 18000 | 1 |
| 王五 | 技术部 | 18000 | 1 |
| 张三 | 技术部 | 15000 | 2 |  ← 连续

**NTILE(N)**：将数据均分为 N 组

```sql
-- 将员工按工资分为 3 个等级
SELECT
    name, salary,
    NTILE(3) OVER (ORDER BY salary DESC) AS salary_tier
FROM employees;
```

### 1.4 LAG 与 LEAD：前后引用

这两个函数是**同比/环比分析**的利器。

```sql
-- 按部门内入职顺序，查看前一个和后一个同事的工资
SELECT
    name, department, salary, hire_date,
    LAG(name) OVER (PARTITION BY department ORDER BY hire_date) AS prev_colleague,
    LAG(salary) OVER (PARTITION BY department ORDER BY hire_date) AS prev_salary,
    LEAD(name) OVER (PARTITION BY department ORDER BY hire_date) AS next_colleague,
    LEAD(salary) OVER (PARTITION BY department ORDER BY hire_date) AS next_salary
FROM employees
ORDER BY department, hire_date;
```

**实战：计算月度销售额环比增长率**

```sql
CREATE TABLE monthly_sales (
    month DATE PRIMARY KEY,
    revenue DECIMAL(12,2)
);

INSERT INTO monthly_sales VALUES
('2024-01-01', 100000),
('2024-02-01', 120000),
('2024-03-01', 110000),
('2024-04-01', 150000),
('2024-05-01', 180000),
('2024-06-01', 160000);

-- 计算环比增长率
SELECT
    month,
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month))
        / LAG(revenue) OVER (ORDER BY month) * 100, 2
    ) AS growth_rate_pct
FROM monthly_sales
ORDER BY month;
```

| month | revenue | prev_month_revenue | growth_rate_pct |
|-------|---------|-------------------|-----------------|
| 2024-01-01 | 100000 | NULL | NULL |
| 2024-02-01 | 120000 | 100000 | 20.00 |
| 2024-03-01 | 110000 | 120000 | -8.33 |
| 2024-04-01 | 150000 | 110000 | 36.36 |
| 2024-05-01 | 180000 | 150000 | 20.00 |
| 2024-06-01 | 160000 | 180000 | -11.11 |

### 1.5 聚合窗口函数

聚合函数配合窗口可以实现**累计、移动平均**等分析。

```sql
-- 累计求和（Running Total）
SELECT
    month, revenue,
    SUM(revenue) OVER (ORDER BY month) AS cumulative_revenue
FROM monthly_sales;
```

```sql
-- 移动平均（过去3个月的平均值）
SELECT
    month, revenue,
    ROUND(AVG(revenue) OVER (
        ORDER BY month
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 2) AS moving_avg_3m
FROM monthly_sales;
```

**窗口范围语法详解**：

```sql
-- ROWS：物理行范围
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING  -- 前1行 + 当前行 + 后1行
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW  -- 第一行到当前行（累计）
ROWS BETWEEN 3 PRECEDING AND 3 PRECEDING  -- 前第3行（单行）

-- RANGE：逻辑值范围（需要 ORDER BY 是数字/日期类型）
RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
```

### 1.6 FIRST_VALUE / LAST_VALUE / NTH_VALUE

```sql
SELECT
    name, department, salary,
    FIRST_VALUE(salary) OVER (
        PARTITION BY department ORDER BY salary DESC
    ) AS highest_salary_in_dept,
    salary - FIRST_VALUE(salary) OVER (
        PARTITION BY department ORDER BY salary DESC
    ) AS diff_from_highest
FROM employees;
```

### 1.7 窗口函数实战：Top N 问题

```sql
-- 每个部门工资最高的 2 个人
SELECT name, department, salary, rn
FROM (
    SELECT name, department, salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
) sub
WHERE rn <= 2;
```

这是面试高频题，用窗口函数比自连接优雅得多。

## 二、CTE：让复杂查询清晰可读

### 2.1 什么是 CTE

CTE（Common Table Expression，公用表表达式）可以理解为**在 SQL 中定义临时命名结果集**，让你的查询分层、可读、可复用。

```sql
-- 基本语法
WITH cte_name AS (
    SELECT ...
)
SELECT ... FROM cte_name;
```

**为什么不用子查询？**

```sql
-- 嵌套子查询：难以阅读
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
    FROM employees
    WHERE status = 'active'
) ranked
WHERE rn <= 3;

-- 等价 CTE：层次清晰
WITH ranked_employees AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
    WHERE status = 'active'
)
SELECT * FROM ranked_employees WHERE rn <= 3;
```

### 2.2 多 CTE 链式处理

```sql
-- 分步分析：各部门 → Top2 员工 → 汇总统计
WITH
-- 步骤1：计算部门统计
dept_stats AS (
    SELECT
        department,
        COUNT(*) AS headcount,
        AVG(salary) AS avg_salary,
        MAX(salary) AS max_salary
    FROM employees
    GROUP BY department
),
-- 步骤2：找出每个部门 Top2 高薪员工
top_employees AS (
    SELECT name, department, salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
),
-- 步骤3：统计 Top2 员工在各部门的工资合计
top2_summary AS (
    SELECT department, SUM(salary) AS top2_total
    FROM top_employees
    WHERE rn <= 2
    GROUP BY department
)
-- 最终查询：关联所有中间结果
SELECT
    d.department,
    d.headcount,
    ROUND(d.avg_salary, 2) AS avg_salary,
    d.max_salary,
    COALESCE(t.top2_total, 0) AS top2_total,
    ROUND(COALESCE(t.top2_total, 0) / (d.avg_salary * d.headcount) * 100, 2) AS concentration_pct
FROM dept_stats d
LEFT JOIN top2_summary t ON d.department = t.department
ORDER BY concentration_pct DESC;
```

这种写法让复杂的数据分析逻辑一目了然，比在 Java 里多次查询再拼接优雅太多。

### 2.3 递归 CTE：树形数据查询

递归 CTE 是 PG 的王牌特性，特别适合处理**树形/层级数据**：

```sql
-- 组织架构表
CREATE TABLE org (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    parent_id INT REFERENCES org(id)
);

INSERT INTO org VALUES
(1, 'CEO', NULL),
(2, 'CTO', 1),
(3, 'CFO', 1),
(4, '技术总监', 2),
(5, '产品总监', 2),
(6, '高级工程师A', 4),
(7, '高级工程师B', 4),
(8, '初级工程师', 6),
(9, '财务经理', 3),
(10, '会计', 9);

-- 递归查询：找出 CTO 的所有下属（包含间接下属）
WITH RECURSIVE subordinates AS (
    -- 基础情况：直接下属
    SELECT id, name, parent_id, 1 AS level
    FROM org
    WHERE parent_id = 2  -- CTO 的 id

    UNION ALL

    -- 递归：下属的下属
    SELECT o.id, o.name, o.parent_id, s.level + 1
    FROM org o
    INNER JOIN subordinates s ON o.parent_id = s.id
)
SELECT
    id,
    LPAD('', (level - 1) * 4, ' ') || name AS org_chart,
    level
FROM subordinates
ORDER BY level, id;
```

结果：

```
org_chart              | level
CTO                    | 1
    技术总监            | 2
    产品总监            | 2
        高级工程师A     | 3
        高级工程师B     | 3
            初级工程师  | 4
```

**递归 CTE 实战：商品分类树**

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    parent_id INT REFERENCES categories(id)
);

INSERT INTO categories VALUES
(1, '电子产品', NULL),
(2, '手机', 1),
(3, '电脑', 1),
(4, '智能手机', 2),
(5, '功能手机', 2),
(6, '笔记本', 3),
(7, '台式机', 3),
(8, '游戏本', 6),
(9, '轻薄本', 6);

-- 查询某个分类的所有子分类（递归向下）
WITH RECURSIVE sub_categories AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM categories
    WHERE id = 1  -- 从电子产品开始

    UNION ALL

    SELECT c.id, c.name, c.parent_id, sc.depth + 1
    FROM categories c
    INNER JOIN sub_categories sc ON c.parent_id = sc.id
)
SELECT id, LPAD('', (depth - 1) * 2, '--') || name AS category_path, depth
FROM sub_categories
ORDER BY depth, id;
```

```sql
-- 从叶子节点向上追溯（反向递归）
WITH RECURSIVE ancestors AS (
    SELECT id, name, parent_id, 0 AS depth
    FROM categories
    WHERE id = 8  -- 从游戏本开始

    UNION ALL

    SELECT c.id, c.name, c.parent_id, a.depth + 1
    FROM categories c
    INNER JOIN ancestors a ON c.id = a.parent_id
)
SELECT id, name, parent_id, depth
FROM ancestors
ORDER BY depth;
```

结果（游戏本 → 笔记本 → 电脑 → 电子产品）：

```
id | name       | parent_id | depth
8  | 游戏本     | 6         | 0
6  | 笔记本     | 3         | 1
3  | 电脑       | 1         | 2
1  | 电子产品   | NULL      | 3
```

### 2.4 CTE 的性能注意事项

CTE 在 PG 12 之前是**优化屏障**（Optimization Fence），即 CTE 内的查询会被单独执行，不能与外层查询合并优化。PG 12 开始支持 `MATERIALIZED` / `NOT MATERIALIZED` 提示：

```sql
-- PG 12+：告诉优化器可以内联 CTE
WITH cte AS NOT MATERIALIZED (
    SELECT * FROM large_table WHERE condition
)
SELECT * FROM cte WHERE other_condition;
-- 可能被优化为：SELECT * FROM large_table WHERE condition AND other_condition

-- 显式要求物化（缓存中间结果）
WITH cte AS MATERIALIZED (
    SELECT * FROM expensive_query
)
SELECT * FROM cte;
```

**建议**：PG 12 之前避免在 CTE 中做简单过滤然后外层再做复杂操作。PG 12+ 放心使用。

## 三、JSONB：文档数据库的能力

### 3.1 JSON vs JSONB

PG 支持两种 JSON 类型：

| 特性 | JSON | JSONB |
|------|------|-------|
| 存储方式 | 纯文本（保留空格、键顺序） | 二进制（解析后存储） |
| 索引支持 | ❌ | ✅（GIN 索引） |
| 查询性能 | 每次需重新解析 | 已解析，速度快 |
| 写入性能 | 略快 | 需解析，稍慢 |
| 键去重 | ❌ | ✅（自动去重） |
| 推荐场景 | 日志存储 | 查询密集型 |

**核心建议：绝大多数情况下用 JSONB。**

### 3.2 JSONB 基础操作

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    attributes JSONB
);

INSERT INTO products (name, attributes) VALUES
('iPhone 15', '{"brand": "Apple", "color": "black", "storage": 256, "tags": ["premium", "5G"], "dimensions": {"width": 7.16, "height": 14.76}}'),
('Galaxy S24', '{"brand": "Samsung", "color": "white", "storage": 512, "tags": ["premium", "5G", "AI"], "dimensions": {"width": 7.1, "height": 14.7}}'),
('Redmi Note 13', '{"brand": "Xiaomi", "color": "blue", "storage": 128, "tags": ["budget", "5G"], "dimensions": {"width": 7.5, "height": 16.1}}'),
('Pixel 8', '{"brand": "Google", "color": "black", "storage": 256, "tags": ["premium", "AI", "camera"], "dimensions": {"width": 7.09, "height": 15.05}}');
```

**提取字段**：

```sql
-- -> 返回 JSONB 对象
-- ->> 返回文本
SELECT
    name,
    attributes->>'brand' AS brand,
    attributes->>'color' AS color,
    (attributes->>'storage')::INT AS storage
FROM products;
```

**嵌套路径访问**：

```sql
SELECT
    name,
    attributes#>'{dimensions,width}' AS width_jsonb,   -- #> 按路径取 JSONB
    attributes#>>'{dimensions,height}' AS height_text  -- #>> 按路径取文本
FROM products;
```

### 3.3 JSONB 包含查询与 GIN 索引

```sql
-- @> 包含操作符：判断 JSONB 是否包含指定对象
-- 查找黑色、256G 的手机
SELECT name, attributes->>'brand' AS brand
FROM products
WHERE attributes @> '{"color": "black", "storage": 256}';
-- 结果：iPhone 15, Pixel 8

-- <@ 被包含操作符
SELECT name FROM products
WHERE '{"color": "black"}'::jsonb <@ attributes;

-- ? 操作符：检查键是否存在
SELECT name FROM products
WHERE attributes ? 'tags';

-- ?| 操作符：检查任意键是否存在
-- ?& 操作符：检查所有键是否存在
```

**创建 GIN 索引加速 JSONB 查询**：

```sql
-- 对整个 JSONB 列创建 GIN 索引
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- 验证索引生效
EXPLAIN ANALYZE
SELECT * FROM products WHERE attributes @> '{"color": "black"}';
-- 应看到 Bitmap Index Scan on idx_products_attributes
```

**对特定路径建索引**：

```sql
-- 对 brand 字段建 B-Tree 索引（查询模式固定时更高效）
CREATE INDEX idx_products_brand ON products ((attributes->>'brand'));

-- 对 tags 建 GIN 索引
CREATE INDEX idx_products_tags ON products USING GIN ((attributes->'tags'));
```

### 3.4 JSONB 更新操作

```sql
-- || 合并操作符：添加/覆盖字段
UPDATE products
SET attributes = attributes || '{"discount": 0.15}'::jsonb
WHERE name = 'iPhone 15';

-- - 删除键
UPDATE products
SET attributes = attributes - 'discount'
WHERE name = 'iPhone 15';

-- jsonb_set：精确设置嵌套值
UPDATE products
SET attributes = jsonb_set(attributes, '{dimensions,width}', '7.20')
WHERE name = 'iPhone 15';

-- jsonb_insert：在数组中插入
UPDATE products
SET attributes = jsonb_insert(attributes, '{tags,0}', '"flagship"')
WHERE name = 'iPhone 15';
```

### 3.5 JSONB 聚合

```sql
-- jsonb_agg：将查询结果聚合为 JSONB 数组
SELECT jsonb_agg(
    jsonb_build_object(
        'name', name,
        'brand', attributes->>'brand',
        'storage', attributes->>'storage'
    )
) AS product_list
FROM products
WHERE attributes @> '{"tags": "premium"}';

-- jsonb_object_agg：聚合为 JSONB 对象
SELECT jsonb_object_agg(name, attributes->>'brand') AS name_brand_map
FROM products;
```

### 3.6 JSONB 实战：灵活配置系统

```sql
-- 商户配置表：不同商户有不同配置项
CREATE TABLE merchant_configs (
    id SERIAL PRIMARY KEY,
    merchant_id INT NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(merchant_id, config_type)
);

-- 支付配置各不相同
INSERT INTO merchant_configs (merchant_id, config_type, config_data) VALUES
(1, 'payment', '{"methods": ["wechat", "alipay"], "wechat": {"app_id": "wx001", "mch_id": "123"}}'),
(2, 'payment', '{"methods": ["alipay", "unionpay"], "alipay": {"app_id": "ali002"}}'),
(1, 'notification', '{"channels": ["sms", "email"], "templates": {"sms": "SMS_001"}}');

-- 查询支持微信支付的商户（不同结构统一查询）
SELECT merchant_id, config_data->'wechat'->>'app_id' AS wechat_app_id
FROM merchant_configs
WHERE config_type = 'payment'
  AND config_data @> '{"methods": ["wechat"]}';

-- 查询所有开通了 alipay 的商户
SELECT merchant_id
FROM merchant_configs
WHERE config_type = 'payment'
  AND config_data->'methods' ? 'alipay';
```

这种灵活配置方案在 MySQL 中要么用多表关联（复杂），要么用 JSON 列但查询效率低（无法建索引）。

## 四、全文检索：内置的搜索引擎

### 4.1 tsvector 和 tsquery

PG 内置的全文检索能力足以替代轻量级的 Elasticsearch 场景：

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    content TEXT,
    search_vector TSVECTOR  -- 预计算的搜索向量
);

-- 生成搜索向量
UPDATE articles SET search_vector = to_tsvector('english', title || ' ' || content);

-- 创建 GIN 索引
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
```

### 4.2 全文检索查询

```sql
-- 基础全文搜索
SELECT title, ts_rank(search_vector, query) AS rank
FROM articles,
     to_tsquery('english', 'database & performance') AS query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- 短语搜索
SELECT title FROM articles
WHERE search_vector @@ phraseto_tsquery('english', 'database performance tuning');

-- 带加权的搜索
SELECT
    title,
    ts_rank(
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B'),
        to_tsquery('english', 'database')
    ) AS rank
FROM articles
WHERE
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
    @@ to_tsquery('english', 'database')
ORDER BY rank DESC;
```

### 4.3 中文全文检索

PG 默认支持英文分词，中文需要使用扩展：

```sql
-- 安装中文分词扩展（需要先安装 zhparser）
CREATE EXTENSION zhparser;
CREATE TEXT SEARCH CONFIGURATION chinese (PARSER = zhparser);
ALTER TEXT SEARCH CONFIGURATION chinese ADD MAPPING FOR n,v,a,i,e,l WITH simple;

-- 使用中文配置
SELECT to_tsvector('chinese', 'PostgreSQL 是一个功能强大的开源数据库');

-- 中文搜索
SELECT * FROM articles
WHERE to_tsvector('chinese', content) @@ to_tsquery('chinese', '数据库 & 性能');
```

或者使用 pg_jieba（结巴分词扩展）、pg_bigm 等。

## 五、复杂报表实战：综合运用

让我们用学到的所有知识，实现一个电商数据分析报表：

```sql
-- 表结构
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    product_id INT,
    quantity INT,
    amount DECIMAL(10,2),
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    region VARCHAR(50),
    registered_at DATE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    category_id INT,
    price DECIMAL(10,2)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    parent_id INT REFERENCES categories(id)
);

-- 插入测试数据
INSERT INTO users VALUES
(1, 'Alice', '华东', '2024-01-15'),
(2, 'Bob', '华北', '2024-02-01'),
(3, 'Charlie', '华东', '2024-03-10'),
(4, 'Diana', '华南', '2024-01-20'),
(5, 'Eve', '华北', '2024-04-01');

INSERT INTO categories VALUES
(1, '电子产品', NULL),
(2, '手机', 1),
(3, '配件', 1),
(4, '耳机', 3),
(5, '充电器', 3);

INSERT INTO products VALUES
(1, 'iPhone 15', 2, 6999),
(2, 'Galaxy S24', 2, 6499),
(3, 'AirPods Pro', 4, 1999),
(4, 'GaN 充电器', 5, 149),
(5, 'USB-C 数据线', 5, 29);

INSERT INTO orders VALUES
(1, 1, 1, 1, 6999, 'completed', '2024-05-01 10:00:00+08'),
(2, 2, 2, 1, 6499, 'completed', '2024-05-01 11:00:00+08'),
(3, 1, 3, 2, 3998, 'completed', '2024-05-02 09:00:00+08'),
(4, 3, 4, 3, 447, 'completed', '2024-05-02 14:00:00+08'),
(5, 4, 1, 1, 6999, 'cancelled', '2024-05-03 16:00:00+08'),
(6, 1, 5, 10, 290, 'completed', '2024-05-04 08:00:00+08'),
(7, 2, 4, 2, 298, 'completed', '2024-05-05 12:00:00+08'),
(8, 5, 2, 1, 6499, 'completed', '2024-05-06 10:00:00+08'),
(9, 3, 3, 1, 1999, 'completed', '2024-05-07 11:00:00+08'),
(10, 1, 1, 1, 6999, 'completed', '2024-05-08 15:00:00+08');

-- ====== 综合报表 ======
WITH
-- 1. 每日销售统计
daily_sales AS (
    SELECT
        DATE(created_at) AS sale_date,
        COUNT(*) FILTER (WHERE status = 'completed') AS order_count,
        SUM(amount) FILTER (WHERE status = 'completed') AS revenue,
        COUNT(DISTINCT user_id) AS unique_users
    FROM orders
    GROUP BY DATE(created_at)
),
-- 2. 用户分层：RFM 分析
user_rfm AS (
    SELECT
        user_id,
        MAX(created_at) AS last_order,
        COUNT(*) FILTER (WHERE status = 'completed') AS frequency,
        SUM(amount) FILTER (WHERE status = 'completed') AS monetary
    FROM orders
    GROUP BY user_id
),
user_segments AS (
    SELECT
        user_id,
        NTILE(3) OVER (ORDER BY last_order DESC) AS r_score,
        NTILE(3) OVER (ORDER BY frequency DESC) AS f_score,
        NTILE(3) OVER (ORDER BY monetary DESC) AS m_score
    FROM user_rfm
),
-- 3. 商品排名（含分类信息）
product_ranking AS (
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        c.name AS category_name,
        SUM(o.amount) FILTER (WHERE o.status = 'completed') AS total_revenue,
        SUM(o.quantity) FILTER (WHERE o.status = 'completed') AS total_quantity,
        RANK() OVER (ORDER BY SUM(o.amount) FILTER (WHERE o.status = 'completed') DESC) AS revenue_rank
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN orders o ON p.id = o.product_id
    GROUP BY p.id, p.name, c.name
),
-- 4. 区域分析
region_stats AS (
    SELECT
        u.region,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed') AS order_count,
        COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'completed'), 0) AS revenue,
        ROUND(
            COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'completed'), 0)
            / NULLIF(COUNT(DISTINCT u.id), 0), 2
        ) AS arpu  -- 每用户平均收入
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.region
)
-- 最终输出
SELECT '=== 每日销售趋势 ===' AS report_section, NULL, NULL, NULL
UNION ALL
SELECT sale_date::TEXT, '订单数: ' || order_count, '收入: ' || revenue, 'UV: ' || unique_users
FROM daily_sales
UNION ALL
SELECT '=== 商品排行榜 ===', NULL, NULL, NULL
UNION ALL
SELECT
    revenue_rank || '. ' || product_name,
    '品类: ' || category_name,
    '收入: ¥' || total_revenue,
    '销量: ' || total_quantity
FROM product_ranking
UNION ALL
SELECT '=== 区域分析 ===', NULL, NULL, NULL
UNION ALL
SELECT region, '用户数: ' || user_count, '订单数: ' || order_count, 'ARPU: ¥' || arpu
FROM region_stats
UNION ALL
SELECT '=== 高价值用户 ===', NULL, NULL, NULL
UNION ALL
SELECT
    '用户' || user_id,
    'R: ' || r_score || ' F: ' || f_score || ' M: ' || m_score,
    CASE WHEN r_score = 1 AND f_score = 1 AND m_score = 1
         THEN '核心用户' ELSE '普通用户' END,
    NULL
FROM user_segments
WHERE r_score = 1 AND f_score = 1 AND m_score = 1;
```

这个综合报表展示了窗口函数、CTE、FILTER 子句、JSONB 等多种 PG 高级特性的协同使用。

## 六、Java/MyBatis 中使用 PG 高级特性

### 6.1 窗口函数在 MyBatis 中的使用

```java
// Mapper 接口
@Mapper
public interface EmployeeMapper {

    // 每个部门工资 Top N
    List<EmployeeRankDTO> findTopNByDepartment(@Param("n") int n);

    // 月度销售环比
    List<MonthlyGrowthDTO> getMonthlyGrowth();
}

// DTO
@Data
public class EmployeeRankDTO {
    private String name;
    private String department;
    private BigDecimal salary;
    private Integer rank;
}
```

```xml
<!-- EmployeeMapper.xml -->
<select id="findTopNByDepartment" resultType="EmployeeRankDTO">
    SELECT name, department, salary, rn AS rank
    FROM (
        SELECT name, department, salary,
            ROW_NUMBER() OVER (
                PARTITION BY department
                ORDER BY salary DESC
            ) AS rn
        FROM employees
    ) ranked
    WHERE rn <![CDATA[ <= ]]> #{n}
</select>

<select id="getMonthlyGrowth" resultType="MonthlyGrowthDTO">
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
        ROUND(
            (revenue - LAG(revenue) OVER (ORDER BY month))
            / LAG(revenue) OVER (ORDER BY month) * 100, 2
        ) AS growthRate
    FROM monthly_sales
    ORDER BY month
</select>
```

### 6.2 JSONB 与 MyBatis TypeHandler

```java
// JSONB TypeHandler
@MappedTypes(JsonNode.class)
public class JsonbTypeHandler extends BaseTypeHandler<JsonNode> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
            JsonNode parameter, JdbcType jdbcType) throws SQLException {
        PGobject pgObject = new PGobject();
        pgObject.setType("jsonb");
        pgObject.setValue(parameter.toString());
        ps.setObject(i, pgObject);
    }

    @Override
    public JsonNode getNullableResult(ResultSet rs, String columnName)
            throws SQLException {
        String json = rs.getString(columnName);
        return json == null ? null : MAPPER.readTree(json);
    }

    // ... getNullableResult 其他重载
}
```

```java
// 实体类
@Data
public class Product {
    private Long id;
    private String name;

    @TableField(typeHandler = JsonbTypeHandler.class)
    private JsonNode attributes;  // Jackson JsonNode

    // 或者直接用 Map
    // private Map<String, Object> attributes;
}
```

### 6.3 递归 CTE 在 MyBatis 中的使用

```xml
<!-- CategoryMapper.xml - 查询子分类树 -->
<select id="findSubCategories" resultType="CategoryTreeNode">
    WITH RECURSIVE sub_categories AS (
        SELECT id, name, parent_id, 1 AS depth
        FROM categories
        WHERE id = #{rootId}

        UNION ALL

        SELECT c.id, c.name, c.parent_id, sc.depth + 1
        FROM categories c
        INNER JOIN sub_categories sc ON c.parent_id = sc.id
    )
    SELECT id, name, parent_id, depth
    FROM sub_categories
    ORDER BY depth, id
</select>
```

```java
// Service：内存中构建树结构
public CategoryTreeNode buildTree(Long rootId) {
    List<CategoryTreeNode> flatList = mapper.findSubCategories(rootId);

    // 构建 parent -> children 映射
    Map<Long, List<CategoryTreeNode>> childrenMap = flatList.stream()
        .filter(n -> n.getParentId() != null)
        .collect(Collectors.groupingBy(CategoryTreeNode::getParentId));

    // 递归设置 children
    flatList.forEach(node ->
        node.setChildren(childrenMap.getOrDefault(node.getId(), Collections.emptyList()))
    );

    return flatList.stream()
        .filter(n -> n.getId().equals(rootId))
        .findFirst()
        .orElse(null);
}
```

### 6.4 Spring Data JPA 中使用

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // JSONB 包含查询（原生 SQL）
    @Query(value = "SELECT * FROM products WHERE attributes @> CAST(:filter AS jsonb)",
           nativeQuery = true)
    List<Product> findByAttributesContaining(@Param("filter") String filterJson);

    // 窗口函数分页（复杂查询用原生 SQL 更灵活）
    @Query(value = """
        SELECT * FROM (
            SELECT p.*, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn
            FROM products p
        ) ranked WHERE rn <= :topN
        """, nativeQuery = true)
    List<Product> findTopNPerCategory(@Param("topN") int topN);
}
```

## 七、性能优化建议

### 7.1 窗口函数优化

```sql
-- ❌ 坏：重复的窗口定义
SELECT
    name, department, salary,
    ROW_NUMBER() OVER w AS rn,
    RANK() OVER w AS rank,
    DENSE_RANK() OVER w AS dense_rnk
FROM employees
WINDOW w AS (PARTITION BY department ORDER BY salary DESC);
-- 使用 WINDOW 子句避免重复定义，减少排序代价
```

### 7.2 JSONB 查询优化

```sql
-- ❌ 不好：每次查询都做类型转换
SELECT * FROM products WHERE (attributes->>'price')::numeric > 100;

-- ✅ 更好：创建表达式索引
CREATE INDEX idx_products_price ON products (((attributes->>'price')::numeric));
-- 或者直接使用 jsonb_path_ops 的 GIN 索引
```

### 7.3 递归 CTE 优化

```sql
-- 限制递归深度（防止死循环或不合理的深度遍历）
WITH RECURSIVE tree AS (
    SELECT id, name, parent_id, 1 AS depth
    FROM categories WHERE id = 1
    UNION ALL
    SELECT c.id, c.name, c.parent_id, t.depth + 1
    FROM categories c
    INNER JOIN tree t ON c.parent_id = t.id
    WHERE t.depth < 10  -- 限制最大深度
)
SELECT * FROM tree;

-- 递归 CTE 循环检测（PG 14+）
WITH RECURSIVE tree AS (
    SELECT id, name, parent_id, ARRAY[id] AS path
    FROM categories WHERE id = 1
    UNION ALL
    SELECT c.id, c.name, c.parent_id, t.path || c.id
    FROM categories c
    INNER JOIN tree t ON c.parent_id = t.id
    WHERE NOT c.id = ANY(t.path)  -- 防止循环
)
SELECT * FROM tree;
```

## 八、总结

本文深入讲解了 PostgreSQL 的三大进阶特性：

1. **窗口函数**：排名（ROW_NUMBER/RANK/DENSE_RANK）、前后引用（LAG/LEAD）、聚合窗口——数据分析场景的瑞士军刀
2. **CTE**：让复杂查询可读、可维护；递归 CTE 优雅处理树形数据
3. **JSONB**：在关系型数据库中享受文档数据库的灵活性，GIN 索引保证查询性能

**核心建议**：
- 能用窗口函数解决的 Top N、环比同比问题，不要拉到 Java 里循环处理
- 能用 CTE 拆解的复杂查询，不要写成嵌套 5 层的大 SQL
- 能用 JSONB 的灵活配置场景，不要建一堆 EAV（实体-属性-值）表
- 全文检索量不大的场景，PG 内置的 tsvector 完全够用，不需要引入 ES

**MyBatis/JPA 使用建议**：
- 复杂查询直接用原生 SQL（`@Query(nativeQuery=true)`），不要试图用 JPQL/HQL 模拟
- JSONB 操作务必配置好 TypeHandler
- 递归 CTE 查询 + Java 内存构建树结构，是最佳实践

掌握了这些特性，你将能从"会写 SQL"进化到"能写出让人惊叹的 SQL"。

*本文基于 PostgreSQL 16 编写。大部分特性在 PG 12+ 即可使用。*
