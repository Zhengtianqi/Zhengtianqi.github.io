---
title: Redis 高可用深度对比：哨兵 vs Cluster vs 主从
tag: ["Redis", "高可用", "Sentinel", "Cluster", "主从复制"]
category: 数据库
date: 2026-07-03
---

# Redis 高可用深度对比：哨兵 vs Cluster vs 主从

单机 Redis 挂了怎么办？主从复制只是开始。Sentinel 能自动故障转移，Cluster 能水平扩展。三种方案怎么选？脑裂怎么防？扩缩容怎么做？

---

## 一、主从复制

### 1.1 架构

```
主从复制架构：

  ┌──────────┐    全量+增量     ┌──────────┐
  │  Master   │ ──────────────→ │  Slave 1  │
  │ (读写)    │                  │ (只读)    │
  └──────────┘                  └──────────┘
       │                             ↑
       │    全量+增量                 │
       ├────────────────────────────→│
       │                             │
       ▼                             ▼
  ┌──────────┐                  ┌──────────┐
  │  Slave 2  │                  │  Slave 3  │
  │ (只读)    │                  │ (只读)    │
  └──────────┘                  └──────────┘

  读写分离：写 Master，读 Slave
  故障恢复：Master 挂了 → 手动切换 Slave 为 Master（无自动故障转移）
```

### 1.2 复制原理

```
全量同步（首次连接 / 断线太久）：

  Slave                          Master
    │                              │
    │ 1. PSYNC ? -1（不知道Master）│
    │ ──────────────────────────→ │
    │                              │
    │ 2. +FULLRESYNC runid offset  │
    │ ←──────────────────────────  │
    │                              │
    │ 3. BGSAVE（生成 RDB）         │
    │                              │
    │ 4. 发送 RDB 文件              │
    │ ←──────────────────────────  │
    │                              │
    │ 5. 发送缓冲区积压命令          │
    │ ←──────────────────────────  │
    │                              │
    │ 6. 加载 RDB + 执行积压命令     │
    │                              │

增量同步（短暂断线后重连）：

  Slave                          Master
    │                              │
    │ 1. PSYNC runid offset        │
    │ ──────────────────────────→ │
    │                              │
    │ 2. +CONTINUE                 │
    │ ←──────────────────────────  │
    │                              │
    │ 3. 发送积压缓冲区命令          │
    │ ←──────────────────────────  │

  条件：offset 在 repl_backlog 缓冲区内（默认 1MB）
  超出缓冲区 → 降级为全量同步

关键参数：
  repl-backlog-size 1mb     # 积压缓冲区大小（建议调大）
  repl-backlog-ttl 3600     # 缓冲区保留时间
  repl-timeout 60           # 复制超时（秒）
  min-slaves-to-write 1     # 至少 1 个 Slave 同步成功才允许写入
  min-slaves-max-lag 10     # Slave 延迟不超过 10s
```

---

## 二、哨兵（Sentinel）

### 2.1 架构

```
Sentinel 架构：

  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │Sentinel 1 │  │Sentinel 2 │  │Sentinel 3 │   ← 奇数个 Sentinel
  │ (Monitor) │  │ (Monitor) │  │ (Monitor) │      至少 3 个
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │              │              │
        │    监控 + 通信  │              │
        ├──────────────┼──────────────┤
        │              │              │
        ▼              ▼              ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  Master   │←─│  Slave 1  │  │  Slave 2  │
  │          │  │          │  │          │
  └──────────┘  └──────────┘  └──────────┘

  Sentinel 职责：
    1. 监控 Master/Slave 存活状态
    2. 通知运维（API / 通知）
    3. 自动故障转移（Master 挂 → 选新 Master）
    4. 配置中心（客户端连 Sentinel 获取 Master 地址）
```

### 2.2 故障转移流程

```
故障转移全流程：

阶段 1：主观下线（SDOWN）
  Sentinel 每 1s 向 Master 发 PING
  超过 down-after-milliseconds（默认 30s）未响应
  → Sentinel 标记 Master 为 SDOWN（主观下线）

阶段 2：客观下线（ODOWN）
  超过 quorum 个 Sentinel 都标记为 SDOWN
  → 标记为 ODOWN（客观下线）
  → 开始故障转移

阶段 3：选举 Leader Sentinel
  基于 Raft 协议选出一个 Sentinel 作为 Leader
  → 由 Leader 执行故障转移

阶段 4：选择新 Master
  Leader 从 Slave 中选一个晋升为 Master：
  筛选条件：
    1. 排除断线的 Slave
    2. 按 slave-priority（优先级）排序
    3. 优先级相同 → 按 replication offset（复制偏移量）排序
    4. 偏移量相同 → 按 runid 字典序排序
  → 最优 Slave 执行 SLAVEOF NO ONE（晋升为 Master）

阶段 5：通知其他 Slave
  Leader 通知其他 Slave：SLAVEOF new_master_ip new_master_port
  → 其他 Slave 同步新 Master

阶段 6：通知客户端
  客户端通过订阅 Sentinel 的频道获取 Master 变更通知
  → 连接新 Master

  旧 Master 恢复后 → 自动成为新 Master 的 Slave

总耗时：down-after-milliseconds + 选举 + 数据同步
  约 30-60s（取决于 down-after-milliseconds 配置）
```

### 2.3 Sentinel 配置

```bash
# sentinel.conf
port 26379

# 监控 Master（名称 IP 端口 quorum）
sentinel monitor mymaster 192.168.1.10 6379 2

# 主观下线超时（ms）
sentinel down-after-milliseconds mymaster 30000

# 故障转移超时
sentinel failover-timeout mymaster 180000

# 并行同步 Slave 数量
sentinel parallel-syncs mymaster 1

# 至少 3 个 Sentinel，quorum = 2
# 奇数个 Sentinel 防止脑裂
```

---

## 三、Cluster

### 3.1 架构

```
Redis Cluster 架构（6 个节点：3主3从）：

  ┌──────────────────────────────────────────────────┐
  │                Redis Cluster                      │
  │                                                  │
  │   槽位 0-5460          槽位 5461-10922           │
  │  ┌──────────┐        ┌──────────┐               │
  │  │ Master A  │        │ Master B  │               │
  │  │ (0-5460)  │        │(5461-10922)│              │
  │  └──────────┘        └──────────┘               │
  │       │                    │                     │
  │  ┌──────────┐        ┌──────────┐               │
  │  │ Slave A'  │        │ Slave B'  │               │
  │  └──────────┘        └──────────┘               │
  │                                                  │
  │           槽位 10923-16383                       │
  │        ┌──────────┐                             │
  │        │ Master C  │                             │
  │        │(10923-    │                             │
  │        │ 16383)    │                             │
  │        └──────────┘                             │
  │             │                                    │
  │        ┌──────────┐                             │
  │        │ Slave C'  │                             │
  │        └──────────┘                             │
  │                                                  │
  │  共 16384 个槽位（0-16383）                       │
  │  每个节点负责一部分槽位                            │
  │  Key → CRC16(key) % 16384 → 槽位 → 节点          │
  └──────────────────────────────────────────────────┘

  特点：
    - 去中心化（无 Sentinel）
    - 节点间 Gossip 协议通信
    - 自动故障转移
    - 水平扩展
    - 客户端直连任意节点
```

### 3.2 槽位与路由

```bash
# Key 路由计算
# redis-cli
> CLUSTER KEYSLOT mykey
(integer) 5798   # CRC16("mykey") % 16384 = 5798

# 5798 在 Master A 的范围（0-5460）？否
# 5798 在 Master B 的范围（5461-10922）？是
# → 路由到 Master B

# MOVED 重定向
> SET mykey hello
(error) MOVED 5798 192.168.1.12:6379
# 客户端收到 MOVED → 连接新节点 → 重新发送
# 客户端缓存槽位映射 → 后续请求直接路由

# ASK 重定向（槽位迁移中）
> SET mykey hello
(error) ASK 5798 192.168.1.13:6379
# 槽位正在迁移 → 临时重定向
# 客户端不更新缓存 → 下次仍走原节点

# Hash Tag（保证多 Key 在同一槽位）
SET {user:123}:name "Alice"
SET {user:123}:age 30
# {user:123} 是 Hash Tag
# CRC16("user:123") % 16384 → 同一槽位
# → 可以在同一节点执行 MGET / 事务 / Pipeline
```

### 3.3 脑裂与处理

```
脑裂场景：

  网络分区：
  ┌──────────────┐         ┌──────────────┐
  │  Master A     │  ╳╳╳   │  Slave A'     │
  │  (分区1)      │  分区   │  (分区2)      │
  │  仍接受写入    │         │  被选为新Master│
  └──────────────┘         └──────────────┘
  
  分区1：Master A 还活着，继续接受写入
  分区2：Slave A' 被选为新 Master，也接受写入
  → 两个 Master 同时写入 → 数据冲突

  Cluster 的处理：
  1. Master A 在 cluster-node-timeout（默认 15s）内无法联系多数节点
  2. Master A 自行进入错误状态 → 拒绝写入
  3. 只有拥有多数分区的节点才能成为 Master

  但在 timeout 窗口期内仍可能脑裂！

  额外防护（min-replicas）：
  # redis.conf
  min-replicas-to-write 1     # 至少 1 个 Slave 在线才允许写入
  min-replicas-max-lag 10     # Slave 延迟不超过 10s
  → Master A 分区后没有 Slave → 拒绝写入 → 防止脑裂
```

### 3.4 扩缩容

```bash
# 扩容：添加新节点
# 1. 启动新 Redis 节点
redis-server --port 6380 --cluster-enabled yes

# 2. 加入集群
redis-cli --cluster add-node 192.168.1.14:6380 192.168.1.10:6379
# 新节点作为 Master 加入，但没有槽位

# 3. 迁移槽位
redis-cli --cluster reshard 192.168.1.10:6379
# 交互式：
#   迁移多少槽位？4096（让新节点负责 4096 个）
#   接收节点ID？新节点的 ID
#   源节点？all（从所有节点迁移）

# 槽位迁移过程（逐个 Key 迁移）：
# 1. CLUSTER SETSLOT <slot> MIGRATING <target_node>
# 2. CLUSTER SETSLOT <slot> IMPORTING <source_node>
# 3. MIGRATE source_host source_port "" 0 0 KEYS key1 key2 ...
# 4. CLUSTER SETSLOT <slot> NODE <target_node>

# 缩容：移除节点
# 1. 先迁移该节点的槽位到其他节点
redis-cli --cluster reshard 192.168.1.10:6379
#   迁移该节点的所有槽位到其他节点

# 2. 移除节点
redis-cli --cluster del-node 192.168.1.10:6379 <node_id>
```

---

## 四、三种方案对比

```
              主从          Sentinel        Cluster
─────────────────────────────────────────────────────
数据分片        ✗             ✗               ✓
自动故障转移    ✗（手动）      ✓               ✓
水平扩展        ✗             ✗               ✓
写入容量        单 Master     单 Master       多 Master
读扩展          ✓（Slave）    ✓（Slave）      ✓（Slave）
客户端复杂度    低            中              高（路由）
运维复杂度    低             中              高
脑裂风险        高             中              低
适用数据量     <10GB         <10GB           >10GB
适用场景       小项目        中等项目          大规模

选型建议：
  < 10GB + 高可用 → Sentinel
  > 10GB 或高写入 → Cluster
  简单读写分离 → 主从
  云上托管 → 直接用云服务（AWS ElastiCache / 阿里云 Redis）
```

---

## 五、面试要点

### Q：Sentinel 和 Cluster 的区别？

1. Sentinel 是主从架构的增强，单 Master 写入，Sentinel 负责监控和故障转移，不支持水平扩展
2. Cluster 是多 Master 架构，数据按 16384 槽位分片，支持水平扩展，内置故障转移（无 Sentinel）
3. Sentinel 适合 < 10GB 数据量，Cluster 适合大规模数据
4. Sentinel 客户端简单（连 Sentinel 获取 Master 地址），Cluster 客户端复杂（需要路由+重定向）

### Q：Redis Cluster 怎么做数据分片？

用 CRC16 算法对 Key 计算，取模 16384 得到槽位号。每个节点负责一部分槽位。客户端缓存槽位映射表，直接路由到对应节点。如果路由错误，节点返回 MOVED 重定向，客户端更新缓存后重试。Hash Tag（`{tag}`）可以强制多个 Key 到同一槽位，支持多 Key 操作。

### Q：Redis 脑裂怎么防？

1. Cluster：`cluster-node-timeout`（默认 15s）内无法联系多数节点 → Master 进入错误状态拒绝写入
2. 配合 `min-replicas-to-write 1` + `min-replicas-max-lag 10` → 没有 Slave 同步时拒绝写入
3. Sentinel 用 quorum 机制确保只有一个 Master 被选出

---

## 六、总结

```
主从：读写分离，手动故障恢复
Sentinel：主从 + 自动故障转移 + 监控，适合中小规模
Cluster：分片 + 自动故障转移 + 水平扩展，适合大规模

核心机制：
  主从：RDB 全量 + backlog 增量
  Sentinel：SDOWN → ODOWN → Raft 选举 → 故障转移
  Cluster：CRC16 % 16384 → 槽位路由 → MOVED/ASK 重定向

生产建议：
  - 至少 3 Sentinel（奇数防脑裂）
  - Cluster 至少 6 节点（3主3从）
  - 开启 min-replicas 防脑裂
  - repl-backlog-size 调大（避免全量同步）
  - 监控 Master 延迟和 Slave 同步状态
```
