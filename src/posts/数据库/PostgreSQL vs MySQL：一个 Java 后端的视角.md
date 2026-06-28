---
title: PostgreSQL vs MySQL：一个 Java 后端的视角
tag: ["MySQL", "PostgreSQL", "数据库"]
category: 数据库
date: 2026-06-12
---

# PostgreSQL vs MySQL：一个 Java 后端的视角

> MySQL是世界上最流行的开源关系型数据库，它为Web应用提供了稳定可靠的数据存储方案。
> 本文系统梳理了MySQL的核心概念和最佳实践，是后端开发者的必备知识。

MySQL 诞生于 1995 年，由瑞典公司 MySQL AB 开发。其设计初衷是追求**简单、快速、易用**，最早定位为中小型 Web 应用的数据库解决方案。2008 年被 Sun Microsystems 收购，2009 年随 Sun 一起归入 Oracle 旗下。

MySQL 的两个重要分支：
- **MySQL Community Edition**：Oracle 维护的开源版本
- **MariaDB**：MySQL 创始人 Monty Widenius 在 Oracle 收购后创建的兼容分支

MySQL 在互联网行业有着不可撼动的地位，LAMP（Linux + Apache + MySQL + PHP）技术栈奠定了它的江湖地位。国内几乎所有互联网大厂在早期都重度使用 MySQL。

### 1.2 PostgreSQL 的发展历程

PostgreSQL 的历史可以追溯到 1986 年的 POSTGRES 项目（加州大学伯克利分校），1996 年正式更名为 PostgreSQL。它是**学院派**的代表，从一开始就注重 SQL 标准的兼容性、数据完整性和扩展性。

PostgreSQL 的核心理念是："做最先进的开源数据库"（The World's Most Advanced Open Source Relational Database）。

### 1.3 定位差异总结

| 维度 | MySQL | PostgreSQL |
|------|-------|------------|
| 出身 | 工业界（商业公司） | 学术界（伯克利大学） |
| 设计哲学 | 简单实用，够用就好 | 严谨规范，功能完备 |
| 历史包袱 | 较重（早期版本功能简陋） | 较轻（起点高） |
| 典型用户 | 互联网公司、中小型应用 | 企业级应用、GIS、数据分析 |
| 社区风格 | 多个分支，生态分散 | 统一社区，方向明确 |

## 二、核心架构差异

### 2.1 进程模型

**MySQL** 默认使用**多线程模型**：一个进程，多个线程处理连接。内存共享方便，但一个线程崩溃可能影响整个服务。

**PostgreSQL** 使用**多进程模型**：主进程 fork 出子进程处理每个连接。隔离性好，一个连接的崩溃不会影响其他连接，但进程切换开销略大于线程切换。

```
MySQL:  1 进程 + N 线程
PG:     1 主进程 + N 子进程 (每连接一个)
```

> **实际影响**：在极高并发场景下（数千连接），MySQL 的多线程模型在内存效率上更有优势。但现代应用通常使用连接池将连接数控制在百级别，差异不那么明显。

### 2.2 存储引擎架构

这是两者**最根本的架构差异**之一。

**MySQL** 支持**可插拔存储引擎**：
- InnoDB（默认）：支持事务、行锁、MVCC
- MyISAM：不支持事务、表锁、全文索引（旧版）
- Memory：数据存内存、重启丢失
- 其他：TokuDB、RocksDB 等

```sql
-- MySQL 可以按表指定存储引擎
CREATE TABLE orders (
    id INT PRIMARY KEY,
    amount DECIMAL(10,2)
) ENGINE=InnoDB;

CREATE TABLE logs (
    id INT PRIMARY KEY,
    message TEXT
) ENGINE=MyISAM;  -- 日志表不需要事务
```

**PostgreSQL** 只有**一个存储引擎**，但通过强大的扩展机制实现类似功能。所有表统一管理，事务行为一致，不会有"某个表不支持事务"的尴尬。

> **观点**：MySQL 的插件式引擎是一把双刃剑。灵活的同时也带来了碎片化——不同引擎的特性差异可能导致选错。PG 的统一引擎让人更省心，功能通过扩展（Extension）提供更加优雅。

## 三、MVCC 实现机制对比

MVCC（Multi-Version Concurrency Control，多版本并发控制）是现代数据库实现高并发读写分离的核心技术。PG 和 MySQL 的实现思路完全不同。

### 3.1 PostgreSQL 的多版本存储

PG 的 MVCC 采用**纯追加**方式：UPDATE 操作实际上是在表中插入一行新数据，同时标记旧行为过期。

```
-- 原始数据
ID=1, name='Alice', xmin=100, xmax=0    ← 当前版本

-- 执行 UPDATE users SET name='Bob' WHERE id=1 后
ID=1, name='Alice', xmin=100, xmax=200  ← 旧版本（对事务200之后不可见）
ID=1, name='Bob',   xmin=200, xmax=0    ← 新版本（当前版本）
```

每行数据有两个隐藏系统字段：
- **xmin**：插入此行的事务 ID
- **xmax**：删除/更新此行的事务 ID（0 表示当前有效）

**优点**：回滚极快（不需要 undo）、实现简单、历史数据可查询
**缺点**：需要 VACUUM 清理死元组、表膨胀问题

```sql
-- PG 可以看到死元组
SELECT n_dead_tup, n_live_tup, last_vacuum
FROM pg_stat_user_tables
WHERE relname = 'users';
```

**VACUUM 机制**：PG 的后台进程定期清理被标记为删除的旧版本数据。9.6 之后有了自动 VACUUM，但仍需关注。

```sql
-- 手动 VACUUM
VACUUM ANALYZE users;

-- 查看 VACUUM 状态
SELECT relname, last_autovacuum, autovacuum_count
FROM pg_stat_user_tables
WHERE relname = 'users';
```

### 3.2 MySQL (InnoDB) 的 MVCC

InnoDB 使用 **undo log + rollback segment** 机制：

```
-- 数据页上始终是最新版本
-- 旧版本存储在 undo log 中
-- 每条记录有隐藏列：DB_TRX_ID, DB_ROLL_PTR

-- UPDATE 流程
1. 将当前数据复制到 undo log
2. 更新数据页上的数据
3. 将 DB_ROLL_PTR 指向 undo log 中的旧版本
4. 更新 DB_TRX_ID 为当前事务 ID
```

**ReadView（读视图）**：InnoDB 通过 ReadView 判断哪些版本对当前事务可见，核心是维护活跃事务列表。

**优点**：不需要 VACUUM、数据页始终干净
**缺点**：回滚复杂（需从 undo log 重建）、长事务导致 undo log 膨胀

### 3.3 实际影响对比

```java
// 场景：在长事务中执行大量 UPDATE
// PostgreSQL
@Transactional
public void batchUpdateInPG() {
    // 每次 UPDATE 在表中产生死元组
    // 长事务期间无法 VACUUM 这些死元组
    // 可能导致表膨胀，查询变慢
    for (int i = 0; i < 100000; i++) {
        jdbcTemplate.update("UPDATE users SET status = ? WHERE id = ?", i % 5, i);
    }
}

// MySQL：同样场景下表现更好
@Transactional
public void batchUpdateInMySQL() {
    // 旧版本在 undo log 中，数据页保持干净
    // 但 undo log 会膨胀
    // 理论上更适合高并发更新场景
}
```

> **结论**：对于**读多写少**的场景，PG 的 MVCC 实现更优（无需 undo）。对于**更新密集**的场景，MySQL 更合适。但两者的差距在现代硬件上其实不大。

## 四、索引能力对比

索引是数据库性能的核心。PG 在这一领域具有显著优势。

### 4.1 支持的索引类型

| 索引类型 | MySQL | PostgreSQL | 说明 |
|----------|-------|------------|------|
| B-Tree | ✅ | ✅ | 最通用的索引，等值查询+范围查询 |
| Hash | ✅ (Memory引擎) | ✅ | 仅等值查询，不常用 |
| Full-Text | ✅ | ✅ | 全文检索 |
| Spatial (R-Tree) | ✅ | ✅ | 地理位置索引 |
| **GiST** | ❌ | ✅ | 通用搜索树，可自定义 |
| **GIN** | ❌ | ✅ | 倒排索引，JSONB/数组/全文 |
| **BRIN** | ❌ | ✅ | 块范围索引，超大规模时序数据 |
| **SP-GiST** | ❌ | ✅ | 空间分区 GiST |
| **表达式索引** | ❌ (8.0+ 部分支持) | ✅ | 对表达式建索引 |
| **部分索引** | ❌ | ✅ | 仅对满足条件的行建索引 |
| **覆盖索引** | ✅ | ✅ (11+) | 索引包含所有查询列 |

### 4.2 GIN 索引实战（PG 独有）

GIN（Generalized Inverted Index）是 PG 的杀手级特性，适合 JSONB、数组、全文检索等场景：

```sql
-- JSONB 索引
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    attributes JSONB
);

-- 对 JSONB 列创建 GIN 索引
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- 查询所有红色、XL 码的商品
SELECT * FROM products
WHERE attributes @> '{"color": "red", "size": "XL"}';

-- 查询包含特定标签的商品
CREATE INDEX idx_products_tags ON products USING GIN ((attributes->'tags'));

SELECT * FROM products
WHERE attributes->'tags' ? 'premium';
```

```sql
-- 数组索引
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[]
);

CREATE INDEX idx_articles_tags ON articles USING GIN (tags);

-- 查询包含任意标签的文章
SELECT * FROM articles WHERE tags @> ARRAY['java', 'spring'];
```

在 MySQL 中要实现类似 JSON 高效查询，要么使用 JSON 函数（无法使用 B-Tree 索引），要么将数据拆分为关联表，都会带来额外的复杂度。

### 4.3 BRIN 索引（PG 独有）

BRIN（Block Range INdex）适合**超大规模、物理上按序存储**的数据：

```sql
-- 时序数据：按时间顺序插入
CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT,
    temperature DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT now()
);

-- BRIN 索引仅占 B-Tree 的 1/1000 大小
CREATE INDEX idx_sensor_time ON sensor_data USING BRIN (recorded_at);

-- 10亿行数据，BRIN 索引可能仅几十MB
-- 查询性能虽不如 B-Tree，但对扫描场景足够
SELECT * FROM sensor_data
WHERE recorded_at BETWEEN '2024-01-01' AND '2024-01-02';
```

这种场景在 MySQL 中只能使用 B-Tree，索引体积可能是 BRIN 的百倍以上。

### 4.4 部分索引 & 表达式索引

```sql
-- PG 部分索引：仅索引活跃用户
CREATE INDEX idx_active_users ON users (last_login)
WHERE active = true;

-- 仅索引未删除的订单（数据仓库场景常用）
CREATE INDEX idx_orders_amount ON orders (total_amount)
WHERE deleted_at IS NULL;

-- PG 表达式索引：对计算后的值建索引
CREATE INDEX idx_lower_email ON users (LOWER(email));

-- 查询直接命中索引
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
```

```
-- MySQL 8.0 开始支持函数索引（功能等价于 PG 表达式索引）
CREATE INDEX idx_lower_email ON users ((LOWER(email)));
-- 但仍不支持部分索引
```

### 4.5 索引使用建议

**PostgreSQL 更适合的场景**：
- 大量 JSON 数据需要灵活查询
- 全文检索需求
- 超大规模时序/日志数据
- 需要复杂的条件索引

**MySQL 更适合的场景**：
- 简单的 CRUD 应用（B-Tree 完全够用）
- InnoDB 的聚簇索引带来更好的主键查询性能
- 不依赖高级索引特性

## 五、SQL 标准兼容性

### 5.1 标准兼容对比

PostgreSQL 一直以**最接近 SQL 标准**著称，而 MySQL 在早期为了追求简单牺牲了大量标准兼容。

| 特性 | MySQL | PostgreSQL |
|------|-------|------------|
| CHECK 约束 | 8.0.16+ 才真正支持 | 完整支持 |
| CTE (WITH) | 8.0+ 支持 | 完整支持（含递归） |
| 窗口函数 | 8.0+ 支持 | 9.0+（更早） |
| FULL OUTER JOIN | ❌ | ✅ |
| EXCEPT / INTERSECT | ❌（可模拟） | ✅ |
| DISTINCT ON | ❌ | ✅（非常实用） |
| UPSERT | ✅ (ON DUPLICATE KEY / INSERT ON DUPLICATE) | ✅ (ON CONFLICT) |
| LATERAL JOIN | 8.0.14+ | ✅ |
| 自定义类型 | ❌ | ✅ |
| DOMAIN | ❌ | ✅ |
| 表继承 | ❌ | ✅ |

### 5.2 DISTINCT ON：PG 的隐藏神器

```sql
-- 查询每个用户的最新一条订单
-- 这个需求在 MySQL 中非常麻烦

-- PostgreSQL 写法（优雅）
SELECT DISTINCT ON (user_id)
    user_id, order_id, amount, created_at
FROM orders
ORDER BY user_id, created_at DESC;

-- MySQL 写法（需要子查询）
SELECT o.*
FROM orders o
INNER JOIN (
    SELECT user_id, MAX(created_at) AS max_time
    FROM orders
    GROUP BY user_id
) t ON o.user_id = t.user_id AND o.created_at = t.max_time;
```

### 5.3 FULL OUTER JOIN

```sql
-- 完整外连接：返回两个表中所有行
-- PG 直接支持
SELECT u.id, u.name, o.amount
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- MySQL 需要 UNION + LEFT JOIN + RIGHT JOIN 模拟
SELECT u.id, u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id
UNION
SELECT u.id, u.name, o.amount FROM users u RIGHT JOIN orders o ON u.id = o.user_id
WHERE u.id IS NULL;
```

## 六、扩展性生态

### 6.1 PostgreSQL 的扩展（Extension）机制

PG 的扩展系统是其**最强大的武器**之一，几乎可以无痛添加新功能：

```sql
-- 查看已安装的扩展
SELECT * FROM pg_extension;

-- 常用的扩展
CREATE EXTENSION postgis;        -- 地理信息系统
CREATE EXTENSION pg_trgm;        -- 模糊搜索（相似文本匹配）
CREATE EXTENSION hstore;         -- 键值对存储
CREATE EXTENSION "uuid-ossp";    -- UUID 生成
CREATE EXTENSION pgcrypto;       -- 加密函数
CREATE EXTENSION pg_stat_statements; -- SQL 性能分析
CREATE EXTENSION postgres_fdw;   -- 跨数据库查询（联邦查询）
CREATE EXTENSION timescaledb;    -- 时序数据库（需单独安装）
CREATE EXTENSION pgvector;       -- AI 向量搜索
```

### 6.2 关键扩展详解

**PostGIS：地理信息系统的事实标准**

```sql
CREATE EXTENSION postgis;

-- 存储地理数据
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    geo GEOGRAPHY(POINT)
);

-- 查找 5 公里内的门店
SELECT name
FROM locations
WHERE ST_DWithin(
    geo,
    ST_MakePoint(121.4737, 31.2304)::geography,  -- 上海坐标
    5000  -- 5km
);
```

**pg_trgm：模糊搜索**

```sql
CREATE EXTENSION pg_trgm;

-- 创建索引加速相似搜索
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- 查找相似名称（容忍拼写错误）
SELECT name, similarity(name, 'iPhone') AS sim
FROM products
WHERE name % 'iPhone'  -- % 是相似度操作符
ORDER BY sim DESC;
```

**pgvector：AI/ML 向量检索**

```sql
CREATE EXTENSION vector;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)  -- OpenAI embedding 维度
);

-- 查找最相似的文档
SELECT content, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

### 6.3 MySQL 的扩展方式

MySQL 的"扩展"主要通过：
- 存储引擎插件（安装门槛高，需编译）
- UDF（自定义函数，功能有限）
- 组件（8.0+，仅限少数官方组件）

```sql
-- MySQL 8.0 组件
INSTALL COMPONENT 'file://component_validate_password';
```

相比之下，PG 的 `CREATE EXTENSION` 一行命令搞定，扩展可以自由分发、一键安装，生态繁荣得多。

## 七、数据类型对比

### 7.1 JSON 支持

PostgreSQL 的 JSON 支持明显更强：

```sql
-- PG：两种 JSON 类型
-- json：存储原始 JSON 文本（保留空格、键顺序）
-- jsonb：二进制存储（支持索引、去重键、更高效）

CREATE TABLE pg_configs (
    id SERIAL PRIMARY KEY,
    data JSONB  -- 推荐用 jsonb
);

-- 插入
INSERT INTO pg_configs (data) VALUES ('{"app": "myapp", "port": 8080, "features": ["auth", "api"]}');

-- 查询 JSON 内部字段
SELECT data->>'app' AS app_name FROM pg_configs;

-- 检查是否包含
SELECT * FROM pg_configs WHERE data @> '{"port": 8080}';

-- 更新 JSON 内部字段
UPDATE pg_configs SET data = data || '{"port": 9090}'::jsonb;

-- JSONB 数组操作
SELECT * FROM pg_configs WHERE data->'features' ? 'auth';
```

```sql
-- MySQL 的 JSON：功能接近但不如 PG 丰富
CREATE TABLE mysql_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data JSON
);

-- 查询
SELECT data->>'$.app' FROM mysql_configs;
SELECT * FROM mysql_configs WHERE JSON_CONTAINS(data, '8080', '$.port');

-- MySQL 无法在 JSON 列上创建 B-Tree 索引
-- 只能创建虚拟列 + 虚拟列索引（8.0.17+）
ALTER TABLE mysql_configs ADD port INT GENERATED ALWAYS AS (data->>'$.port');
CREATE INDEX idx_port ON mysql_configs (port);
```

PG 的 JSONB + GIN 索引组合在 JSON 数据密集型应用中优势明显。

### 7.2 数组类型（PG 独有）

```sql
-- PG 原生支持数组，可以直接作为列类型
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    question VARCHAR(500),
    options TEXT[],
    scores INT[]
);

INSERT INTO surveys (question, options, scores)
VALUES ('最喜欢的语言？', ARRAY['Java', 'Python', 'Go'], '{5, 4, 3}');

-- 查询数组包含
SELECT * FROM surveys WHERE 'Java' = ANY(options);

-- 数组长度
SELECT question, array_length(options, 1) FROM surveys;

-- UNNEST 展开数组
SELECT question, unnest(options) AS opt FROM surveys;
```

MySQL 只能通过关联表或在应用层处理数组，复杂度更高。

### 7.3 其他类型差异

| 特性 | MySQL | PostgreSQL |
|------|-------|------------|
| 布尔值 | TINYINT(1) 模拟 | 原生 BOOLEAN |
| UUID | CHAR(36) 存储 | 原生 UUID 类型 |
| IP 地址 | VARCHAR 存储 | 原生 INET/CIDR |
| 网络地址 | VARCHAR 存储 | MACADDR 类型 |
| 范围类型 | ❌ | int4range, daterange 等 |
| 枚举 | ENUM（不支持修改） | CREATE TYPE（更灵活） |
| 自定义复合类型 | ❌ | CREATE TYPE ... AS () |

## 八、Java 生态集成对比

### 8.1 Spring Boot 集成

两者在 Spring Boot 中的集成都非常成熟：

```xml
<!-- PostgreSQL -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>

<!-- MySQL -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>
```

```yaml
# application.yml - PostgreSQL
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: postgres
    password: ${DB_PASSWORD}
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate

# application.yml - MySQL
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: ${DB_PASSWORD}
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
    hibernate:
      ddl-auto: validate
```

### 8.2 JPA/Hibernate 差异

```java
// PG 的 UUID 类型原生化
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;  // PG 中直接映射为 UUID 类型
    // MySQL 中映射为 BINARY(16) 或 CHAR(36)
}

// PG 原生支持 JSONB
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "jsonb")
    private String attributes;  // PG 中确实存在为 JSONB

    // Hibernate 6+ 更优雅的方式
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> attributesMap;
}
```

### 8.3 MyBatis 集成

```xml
<!-- MyBatis XML - PostgreSQL JSONB 查询 -->
<select id="findByAttribute" resultType="Product">
    SELECT id, name, attributes
    FROM products
    WHERE attributes @> #{attribute}::jsonb
</select>

<!-- MyBatis - PG 数组类型 -->
<insert id="insertSurvey">
    INSERT INTO surveys (question, options)
    VALUES (#{question}, #{options, typeHandler=ArrayTypeHandler})
</insert>
```

```java
// PG 数组类型处理器
public class ArrayTypeHandler extends BaseTypeHandler<String[]> {
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
            String[] parameter, JdbcType jdbcType) throws SQLException {
        // 将 Java 数组转为 PG 数组
        Array array = ps.getConnection().createArrayOf("text", parameter);
        ps.setArray(i, array);
    }
    // ... 其他方法省略
}
```

### 8.4 Flyway/Liquibase 迁移脚本差异

Flyway 迁移 SQL 需要适配不同数据库：

```sql
-- V1__init.sql (PostgreSQL)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- V1__init.sql (MySQL)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

如果项目可能未来更换数据库，Flyway 的 Java 迁移更灵活（可在代码层适配）。

## 九、性能对比与调优

### 9.1 读性能

**简单 SELECT**：两者接近，MySQL 的聚簇索引在主键查询上略优（数据即索引叶子节点）。

**复杂 JOIN + 聚合**：PostgreSQL 的查询优化器更成熟，复杂查询通常更快。

```sql
-- 这种复杂查询在 PG 中表现更好
EXPLAIN ANALYZE
SELECT
    u.region,
    COUNT(DISTINCT o.id) AS order_count,
    SUM(o.total) AS revenue,
    AVG(o.total) AS avg_order_value,
    RANK() OVER (PARTITION BY u.region ORDER BY SUM(o.total) DESC)
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= '2024-01-01'
GROUP BY u.region, u.id;
```

### 9.2 写性能

**简单 INSERT**：MySQL 通常更快（行锁开销小、undo log 写开销低）。

**批量 INSERT + 更新**：各有千秋，取决于具体场景。

```sql
-- PG 的 COPY 命令是批量导入之王
COPY users (name, email, city) FROM '/data/users.csv' CSV HEADER;

-- MySQL 的 LOAD DATA 也很快
LOAD DATA INFILE '/data/users.csv' INTO TABLE users
FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
```

### 9.3 连接池差异

PG 的多进程模型意味着每个连接消耗更多内存（约 5-10MB），**强烈建议**使用连接池：

```
应用 → PgBouncer（连接池）→ PostgreSQL
      ↓ 1000个应用连接
      ↓ 池化为50个数据库连接
```

MySQL 的线程模型单连接开销较小，但仍推荐连接池（HikariCP）：

```yaml
# HikariCP 配置（PG 和 MySQL 通用）
spring:
  datasource:
    hikari:
      maximum-pool-size: 20   # PG 建议不超过 CPU 核数的 2-3 倍
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 9.4 关键配置调优

**PostgreSQL 关键参数**：

```ini
# postgresql.conf
shared_buffers = 4GB              # 共享内存缓冲区（25% 系统内存）
effective_cache_size = 12GB       # 操作系统的文件缓存估算（75% 系统内存）
work_mem = 64MB                   # 单个操作的排序/哈希内存（按并发数*work_mem < 可用内存）
maintenance_work_mem = 512MB      # VACUUM/CREATE INDEX 的内存
random_page_cost = 1.1            # SSD 环境下调低（默认4.0是针对HDD）
effective_io_concurrency = 200    # SSD 可设高
max_connections = 100             # 配合连接池使用，不宜过大
wal_level = replica               # 如需复制
max_wal_size = 2GB
checkpoint_timeout = 15min
```

**MySQL 关键参数**：

```ini
# my.cnf
innodb_buffer_pool_size = 8G      # 缓冲池（70-80% 系统内存）
innodb_log_file_size = 512M       # redo log 大小
innodb_flush_log_at_trx_commit = 2 # 适当降低持久性要求可提升性能
innodb_io_capacity = 2000         # SSD 设高
max_connections = 200
thread_cache_size = 100
query_cache_type = 0              # 8.0 已移除
tmp_table_size = 64M
```

## 十、运维与监控

### 10.1 备份恢复

```bash
# PG 备份
pg_dump -h localhost -U postgres -d mydb -F c -f backup.dump
# 恢复
pg_restore -h localhost -U postgres -d mydb backup.dump

# 物理备份（更快）
pg_basebackup -h localhost -U postgres -D /backup/base -Ft -z -P
```

```bash
# MySQL 备份
mysqldump -h localhost -u root -p mydb --single-transaction --routines --triggers > backup.sql
# 恢复
mysql -h localhost -u root -p mydb < backup.sql

# 物理备份（Percona XtraBackup 更好）
xtrabackup --backup --target-dir=/backup/base
```

### 10.2 监控关键指标

```sql
-- PG：连接数
SELECT count(*) FROM pg_stat_activity;

-- PG：慢查询
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- PG：表大小
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

```sql
-- MySQL：连接数
SHOW STATUS LIKE 'Threads_connected';

-- MySQL：慢查询
-- 先开启：SET GLOBAL slow_query_log = 1;
SHOW VARIABLES LIKE 'slow_query_log_file';

-- MySQL：表大小
SELECT table_name,
       ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.tables
WHERE table_schema = 'mydb'
ORDER BY (data_length + index_length) DESC;
```

## 十一、选型建议：什么场景选哪个？

### 选择 PostgreSQL 的场景

1. **地理信息系统（GIS）**：PostGIS 无可替代
2. **复杂查询与分析**：报表、数据仓库、复杂统计
3. **JSON 数据密集型应用**：需要灵活查询 JSON 内部字段
4. **需要高级数据类型**：数组、范围、自定义类型
5. **数据完整性要求极高**：CHECK 约束、复杂外键、ANSI SQL 标准
6. **全文检索**：基础全文检索不想引入 Elasticsearch 时
7. **AI/向量检索**：pgvector 扩展
8. **时序数据**：TimescaleDB 扩展
9. **希望统一使用一个数据库引擎**：从简单到复杂都能搞定

### 选择 MySQL 的场景

1. **简单 CRUD 应用**：电商、CMS、论坛等
2. **读多写多的高并发场景**：互联网核心业务
3. **团队更熟悉 MySQL**：学习成本低
4. **需要大量成熟工具生态**：Percona Toolkit、gh-ost（在线改表）、Canal
5. **云服务选择更多**：国内云厂商的 MySQL 托管服务非常成熟
6. **主从复制已经满足需求**：不必要分布式事务
7. **已有 MySQL 基础设施**：迁移成本高

### 我的个人建议

- **新项目默认选 PostgreSQL**：除非有明确的理由选择其他数据库
- **互联网高并发 OLTP**：MySQL 仍然是非常安全的选择
- **企业级/数据密集型**：PostgreSQL 明显更合适
- **混合使用也不是坏事**：关键业务用 MySQL（运维成熟度），分析/报表用 PG

## 十二、总结

| 维度 | PostgreSQL | MySQL |
|------|------------|-------|
| 学习曲线 | 较陡（功能多） | 较平缓 |
| 功能丰富度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| SQL 标准兼容 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 简单查询性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 复杂查询性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 扩展性 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 运维成熟度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Java 生态 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 云服务成熟度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 社区活跃度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**最后的话**：选择数据库不是选择题而是判断题。弄清楚你的需求是什么，你的团队擅长什么，你的项目未来怎么发展。两个数据库都是优秀的开源产品，没有绝对的"谁更好"。作为 Java 后端开发者，两个都应该熟悉，这样才能在项目中做出最适合的技术决策。

*本文写于 2024 年，MySQL 版本基于 8.0，PostgreSQL 版本基于 16。*
