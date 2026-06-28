---
title: NewSQL 数据库深度对比：TiDB 与 CockroachDB 的架构与选型
tag: ["TiDB", "CockroachDB", "NewSQL", "分布式数据库"]
category: 数据库
date: 2026-06-27
---

# NewSQL 数据库深度对比：TiDB 与 CockroachDB 的架构与选型

> NewSQL 数据库深度对比：TiDB 与 CockroachDB 的架构与选型是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。
> 本文介绍了NewSQL 数据库深度对比：TiDB 与 CockroachDB 的架构与选型的设计原则和实践经验，帮助你提升架构设计能力。


MySQL 分库分表到一定程度就是运维噩梦。NewSQL 数据库 promises "水平扩展 + SQL + ACID"，但 TiDB 和 CockroachDB 怎么选？

## 一、为什么需要 NewSQL

| 方案 | 扩展性 | ACID | SQL | 运维 |
|------|--------|------|-----|------|
| MySQL 单机 | 差 | 完整 | 完整 | 简单 |
| MySQL 分库分表 | 好 | 分布式事务难 | 跨库 JOIN 难 | 噩梦 |
| MongoDB | 好 | 弱 | NoSQL | 中等 |
| TiDB / CockroachDB | 好 | 完整 | 完整 | 中等 |

NewSQL 的核心价值：**像用 MySQL 一样用，但能水平扩展到 PB 级**。

## 二、TiDB 架构

```
TiDB Server（计算层，无状态）
    │  解析 SQL → 生成执行计划 → 下推到 TiKV
    │
TiKV（存储层，分布式 KV）
    │  Raft 共识 + MVCC + 行存储
    │
TiFlash（列存，HTAP）
    │  实时行列同步，支持 OLAP 查询
    │
PD（Placement Driver，调度）
       Region 调度、负载均衡、时间戳分配
```

**TiDB 核心特点**：
- 计算存储分离：TiDB Server 无状态可任意扩缩
- Raft 共识：数据多副本强一致
- HTAP：TiKV（行存）+ TiFlash（列存）同时支持 OLTP 和 OLAP
- 兼容 MySQL 协议：应用层几乎不用改

## 三、CockroachDB 架构

```
CockroachDB Node（每个节点既计算又存储）
    │  SQL 层 → KV 层 → Raft 共识
    │  Range 分片（默认 512MB）
    │
    │  无中心架构，所有节点对等
    │  用 HLC（Hybrid Logical Clock）做时间排序
```

**CockroachDB 核心特点**：
- 无中心：没有 PD 类似的调度节点，所有节点对等
- 强一致性：每个 Range 用 Raft 共识
- 地域分布式：原生支持多地域部署，数据可按地域放置
- PostgreSQL 兼容：支持大部分 PG 语法

## 四、核心对比

| 维度 | TiDB | CockroachDB |
|------|------|-------------|
| SQL 兼容 | MySQL 协议 | PostgreSQL 语法 |
| 架构 | 计算存储分离 | 一体化 |
| 调度 | 中心化（PD） | 去中心化 |
| HTAP | 支持（TiFlash） | 不支持 |
| 事务模型 | Percolator（两阶段提交） | 乐观锁 + HLC |
| 多地域 | 支持（Placement Rules） | 原生支持更强 |
| 生态 | 中国生态好 | 欧美生态好 |
| 语言 | Go + Rust | Go |
| 社区 | PingCAP（中国） | Cockroach Labs（美国） |

## 五、TiDB 实战

### 5.1 Docker 部署（开发环境）

```bash
# 使用 TiUP 快速部署
curl --proto '=https' --tlsv1.2 -sSf https://tiup-mirrors.pingcap.com/install.sh | sh
source ~/.bash_profile
tiup playground v7.5.0 --db 1 --pd 1 --kv 1
# 启动后连接 4000 端口（MySQL 协议）
mysql -h 127.0.0.1 -P 4000 -u root
```

### 5.2 Java 连接

```java
// TiDB 兼容 MySQL 协议，直接用 MySQL 驱动
spring:
  datasource:
    url: jdbc:mysql://tidb:4000/mydb?useSSL=false
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: ""

// MyBatis 正常使用，无需改动
```

### 5.3 关键特性

```sql
-- 1. 自动分片（无需手动分库分表）
-- TiDB 自动将表按 Region（96MB）分片到不同节点
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    amount DECIMAL(10,2),
    create_time TIMESTAMP
);

-- 2. 在线 DDL（不锁表）
ALTER TABLE orders ADD COLUMN status VARCHAR(20);
-- 线上直接执行，不影响读写

-- 3. 分布式事务（透明使用）
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- 自动两阶段提交，跨节点强一致

-- 4. HTAP（TiFlash 列存分析）
-- 开启 TiFlash 副本
ALTER TABLE orders SET TIFLAP_REPLICA 1;
-- 分析查询自动路由到 TiFlash（列存），不影响 TiKV（行存）的 OLTP

-- 5. 数据放置策略（多地域）
ALTER TABLE orders PLACEMENT POLICY='cn-east';
-- 将订单数据放在华东节点
```

## 六、CockroachDB 实战

### 6.1 Docker 部署

```bash
# 单节点启动
docker run -p 26257:26257 -p 8080:8080 \
  cockroachdb/cockroach:v23.2.0 start-single-node \
  --insecure

# 连接（PostgreSQL 协议）
cockroach sql --insecure --host=localhost:26257
```

### 6.2 Java 连接

```java
// CockroachDB 兼容 PG 协议
spring:
  datasource:
    url: jdbc:postgresql://cockroach:26257/mydb?sslmode=disable
    driver-class-name: org.postgresql.Driver
    username: root
    password: ""
```

### 6.3 关键特性

```sql
-- 1. 地域感知表（多地域部署核心特性）
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT,
    region STRING NOT NULL,
    amount DECIMAL(10,2)
) LOCALITY REGIONAL BY ROW;

-- 数据按 region 字段自动放到对应地域节点
-- 读写本地数据延迟 < 10ms

-- 2. 在线 Schema 变更
ALTER TABLE orders ADD COLUMN status STRING;
-- 不锁表，在线完成

-- 3. 分布式事务
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 4. Follower Reads（从副本读）
-- 默认从 Raft Leader 读，延迟可能较高
-- 开启 Follower Reads 可以从最近的副本读
SET variable follower_read_timestamp = true;
SELECT * FROM orders WHERE create_time > '2026-06-01';
-- 从最近的副本读取，降低延迟
```

## 七、选型决策

```
已有 MySQL 技术栈，想平滑迁移？
  → TiDB（MySQL 协议兼容，代码改动最小）

已有 PostgreSQL 技术栈？
  → CockroachDB（PG 语法兼容）

需要 HTAP（同时做 OLTP 和 OLAP）？
  → TiDB（TiFlash 列存引擎）

需要多地域部署，数据地域合规？
  → CockroachDB（地域感知更强）

团队在国内，需要中文文档和社区支持？
  → TiDB（PingCAP 中国公司，社区活跃）

团队偏好无中心架构？
  → CockroachDB（无 PD 节点）
```

## 八、迁移注意事项

### MySQL → TiDB 迁移

```bash
# 1. 全量迁移（DM 工具）
tiup dm deploy dm-cluster 1.0.0 ./topology.yaml
tiup dm start dm-cluster

# 2. 增量同步（DM 自动接管 binlog）
# 配置 MySQL → TiDB 的同步任务

# 3. 数据校验
tiup sync-diff-inspector
# 对比 MySQL 和 TiDB 数据一致性

# 4. 切流
# 先双写，校验数据一致后切读流量到 TiDB
```

### 注意事项

```sql
-- TiDB 不支持的 MySQL 特性：
-- 1. 存储过程（TiDB 7.5 支持大部分）
-- 2. 外键约束（TiDB 语法兼容但不强制约束，7.5 开始支持）
-- 3. 自增 ID 可能不连续（TiDB 是分布式分配）
-- 4. 不支持 SELECT ... FOR UPDATE 的 NOWAIT 语法（部分版本支持）

-- 建议主键用 AUTO_RANDOM 替代 AUTO_INCREMENT
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_RANDOM,  -- 分布式自增，避免热点
    ...
);
```

## 九、面试要点

### Q：什么场景需要 NewSQL？

1. **数据量超单机极限**：MySQL 单表 > 5000 万行，查询性能下降
2. **分库分表运维成本高**：跨库 JOIN、分布式事务难以处理
3. **需要在线扩缩容**：业务增长快，需要不停机扩展
4. **需要 HTAP**：同时做交易和分析，不想维护两套系统

### Q：TiDB 和 MySQL 有什么区别？

- TiDB 兼容 MySQL 协议但底层是分布式 KV 存储
- 自动分片：不需要手动分库分表
- 分布式事务：跨节点 ACID
- 在线 DDL：不锁表
- HTAP：行列混合存储

### Q：TiDB 的事务模型是什么？

Percolator 模型，基于两阶段提交（2PC）：
1. Prewrite：锁住涉及的数据，写入临时版本
2. Commit：写入 Commit 记录，释放锁
3. 清理：异步清理临时数据
冲突时通过 MVCC 做快照隔离（SI）

## 十、总结

NewSQL 不是银弹，但在以下场景值得投入：

- 数据量 > 1TB 且持续增长
- 分库分表运维成本已经成为负担
- 需要分布式高可用（RPO=0）

选型原则：**MySQL 栈选 TiDB，PG 栈选 CockroachDB，需要 HTAP 选 TiDB，需要多地域选 CockroachDB**。
