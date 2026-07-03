---
title: "MySQL 高可用方案对比：MHA、MGR、Orchestrator 选型"
tag:
  - MySQL
  - 高可用
  - MHA
  - MGR
  - Orchestrator
  - 面试
category: 数据库
date: 2026-07-03
---

# MySQL 高可用方案对比：MHA、MGR、Orchestrator 选型

> 数据库高可用是后端架构的生命线。主库挂了怎么办？数据会不会丢？切换要多久？本文对比四种主流 MySQL 高可用方案，从架构原理到生产实践，帮你做出正确选型。

## 一、为什么需要高可用

**高可用核心指标：**

| 指标 | 含义 | 目标 |
|------|------|------|
| RTO | 恢复时间目标 | < 30s |
| RPO | 数据丢失目标 | 0 或秒级 |
| 可用性 | 全年可用占比 | 99.99%（年宕机 < 52.6 分钟） |

MySQL 高可用本质 = **主从复制 + 自动故障转移**。

```
┌──────────┐   复制    ┌──────────┐
│  Master  │ ────────→ │  Slave   │
│ (读写)    │           │ (只读)    │
└──────────┘           └──────────┘
     │  Master 宕机          │
     ▼                      ▼
┌──────────┐           ┌──────────┐
│  旧Master │  切换     │  新Master │
│  (下线)   │ ←─────── │  (读写)   │
└──────────┘           └──────────┘
```

---

## 二、MHA（Master High Availability）

### 2.1 架构

```
┌──────────────────────────────────────────────┐
│                  MHA 架构                      │
├──────────────────────────────────────────────┤
│  ┌──────────────┐                            │
│  │ MHA Manager  │  (独立部署，监控 + 决策)     │
│  └──────┬───────┘                            │
│         │ 监控                                │
│    ┌────┼────┐                               │
│    ▼    ▼    ▼                               │
│  ┌────┐ ┌────┐ ┌────┐                        │
│  │M1  │ │S1  │ │S2  │                        │
│  │Master││Slave││Slave│                       │
│  └────┘ └────┘ └────┘                        │
│    每台机器部署 MHA Node                       │
└──────────────────────────────────────────────┘
```

| 组件 | 部署位置 | 职责 |
|------|----------|------|
| MHA Manager | 独立机器 | 监控集群、判定故障、执行切换 |
| MHA Node | 每台 MySQL 服务器 | 辅助提取 relay log、应用差异 binlog |

### 2.2 故障转移流程

```
1. 检测 (Detect)
   Manager 连续 ping Master，超时 → 判定宕机

2. 选举 (Elect)
   - relay log 最新的优先
   - 指定优先级 (candidate_master)
   - 排除 no_master 节点

3. 数据补偿 (Recover)
   ┌──────────────────────────────────────┐
   │ 从旧 Master binlog 提取未复制的数据    │
   │ 各 Slave 应用差异 binlog → 数据对齐    │
   │ 新 Master 应用完所有 relay log         │
   └──────────────────────────────────────┘

4. 切换 (Switch)
   - 新 Master read_only=0
   - 其他 Slave 指向新 Master
   - 更新 VIP 或通知应用层

5. 恢复旧主 (可选)
   旧 Master 恢复后作为 Slave 加入集群
```

### 2.3 配置示例

```ini
# /etc/mha/app1.cnf
[server default]
manager_workdir=/var/log/mha/app1
manager_log=/var/log/mha/app1/manager.log
repl_user=repl
repl_password=Repl@123
ping_interval=3

[server1]
hostname=192.168.1.101
port=3306
candidate_master=1

[server2]
hostname=192.168.1.102
port=3306
candidate_master=1

[server3]
hostname=192.168.1.103
port=3306
no_master=1
```

```bash
# 启动 MHA Manager
masterha_manager --conf=/etc/mha/app1.cnf &

# 检查复制状态
masterha_check_repl --conf=/etc/mha/app1.cnf

# 手动在线切换
masterha_master_switch --conf=/etc/mha/app1.cnf --master_state=alive --new_master_host=192.168.1.102
```

### 2.4 优缺点

**优点：** 成熟稳定，大规模生产验证；数据丢失最小化（binlog补偿）；支持半同步复制。

**缺点：** Manager 单点；不支持自动添加新节点；Python 2 编写，作者已停更；切换 10-30s。

> ⚠️ **避坑**：MHA Manager 自身是单点，建议部署两套 Manager + Keepalived 互备。

---

## 三、MGR（MySQL Group Replication）

### 3.1 架构

```
┌──────────────────────────────────────────────┐
│              MGR 架构 (单主模式)               │
├──────────────────────────────────────────────┤
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  Node 1  │  │  Node 2  │  │  Node 3  │  │
│   │ Primary  │  │ Secondary│  │ Secondary│  │
│   │ (读写)   │  │ (只读)   │  │ (只读)   │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        └──────┬──────┴──────┬──────┘         │
│               │ Group Communication           │
│               │ (XCom/Paxos)                 │
│               ▼                               │
│        ┌──────────────┐                      │
│        │  GCS 层       │                      │
│        └──────────────┘                      │
│   事务写入 → 广播认证 → 多数派确认 → 提交      │
└──────────────────────────────────────────────┘
```

### 3.2 单主 vs 多主

```
【单主模式】(推荐)
  Primary(R/W) ← 自动选举
  Secondary(R/O) ← 自动只读

【多主模式】(不推荐生产)
  所有节点 R/W，冲突通过认证解决
  ⚠️ 不支持外键、SERIALIZABLE
  ⚠️ 冲突多时性能下降明显
```

### 3.3 核心机制：Certification-Based Replication

```
1. 事务在本地执行，写入 binlog
2. 事务提交时，广播到 Group
3. 所有节点认证 (Certification)
   - 检测 WW 冲突（同一行被并发修改）
   - 无冲突 → 认证通过
   - 有冲突 → 先到达提交，后到达回滚
4. 多数派确认 (Paxos)
5. 各节点本地应用并提交

  ┌─────┐     ┌─────┐     ┌─────┐
  │Node1│     │Node2│     │Node3│
  │T1:OK│     │T1:OK│     │T1:OK│
  │T2:AB│     │T2:OK│     │T2:OK│
  └─────┘     └─────┘     └─────┘
  T1 全部通过 → 提交
  T2 在 Node1 冲突 → 回滚
```

### 3.4 配置示例

```sql
-- my.cnf
[mysqld]
server_id=1
gtid_mode=ON
enforce_gtid_consistency=ON
binlog_format=ROW
binlog_row_image=FULL

plugin_load_add='group_replication.so'
group_replication_group_name="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
group_replication_local_address="192.168.1.101:33061"
group_replication_group_seeds="192.168.1.101:33061,192.168.1.102:33061,192.168.1.103:33061"
group_replication_single_primary_mode=ON
```

```sql
-- Node 1 引导集群
SET GLOBAL group_replication_bootstrap_group=ON;
START GROUP_REPLICATION;
SET GLOBAL group_replication_bootstrap_group=OFF;

-- Node 2 & 3 加入
START GROUP_REPLICATION;

-- 查看状态
SELECT * FROM performance_schema.replication_group_members;
```

```
+-----------+------+---------+-------------+--------+
| MEMBER_HOST|ROLE  | STATE   |             |        |
+-----------+------+---------+-------------+--------+
| node1     |PRIMARY| ONLINE  |             |        |
| node2     |SECONDARY| ONLINE|             |        |
| node3     |SECONDARY| ONLINE|             |        |
+-----------+------+---------+-------------+--------+
```

### 3.5 故障检测与自动切换

```
1. 成员检测：心跳 5s 超时 → UNREACHABLE → 多数派确认 → DEAD
2. Primary 选举：事务版本号最大优先 → uuid 最小次之
3. 新 Primary：read_only=0 → 恢复残存事务 → 对外服务
4. 客户端重连：需 MySQL Router / ProxySQL 自动路由

切换时间：5-10s
数据丢失：0（已认证事务必然已提交）
```

### 3.6 优缺点

**优点：** 官方原生，RPO=0，自动检测切换无需外部组件。

**缺点：** 至少 3 节点，写需多数派确认有损耗；网络延迟敏感；不支持 MyISAM；最大 9 节点；需 MySQL Router 做读写分离。

---

## 四、Orchestrator

### 4.1 架构

```
┌──────────────────────────────────────────────────┐
│                Orchestrator 架构                  │
├──────────────────────────────────────────────────┤
│  ┌──────────────────┐                            │
│  │ Orchestrator     │  (Go，Web UI + API)        │
│  │ + 后端 MySQL/SQLite│                          │
│  └────────┬─────────┘                            │
│     ┌─────┼─────┬─────┐                          │
│     ▼     ▼     ▼     ▼                          │
│  ┌─────┐┌─────┐┌─────┐┌─────┐                   │
│  │ M1  ││ S1  ││ S2  ││ S3  │  任意拓扑          │
│  └─────┘└──┬──┘└─────┘└─────┘                   │
│            ▼                                     │
│         ┌─────┐  级联复制                         │
│         │ S1a │                                   │
│         └─────┘                                   │
└──────────────────────────────────────────────────┘
```

### 4.2 核心功能

| 功能 | 说明 |
|------|------|
| 拓扑发现 | 自动探测 MySQL 实例及主从关系 |
| 拓扑重构 | 可视化拖拽或 CLI 调整复制关系 |
| 故障转移 | 自动或手动提升 Slave 为 Master |
| 恢复审计 | 记录所有拓扑变更 |
| Pseudo-GTID | 无 GTID 也能安全重构拓扑 |

### 4.3 配置示例

```json
{
  "ListenAddress": ":3000",
  "MySQLTopologyUser": "orc_client",
  "MySQLTopologyPassword": "Orc@123",
  "BackendMySQLHost": "127.0.0.1",
  "BackendMySQLDatabase": "orchestrator",
  "MasterFailoverLostInstancesDowntimeMinutes": 10,
  "RecoverMasterClusterFilters": ["*"],
  "PostMasterFailoverProcesses": [
    "/usr/local/orchestrator/hooks/post_master_failover.sh {failureCluster} {successorHost}"
  ]
}
```

```bash
orchestrator -c discover -i 192.168.1.101    # 发现集群
orchestrator -c topology -i 192.168.1.101     # 查看拓扑
orchestrator -c graceful-master-takeover -i 192.168.1.101 -d 192.168.1.102  # 手动切换
```

### 4.4 优缺点

**优点：** Go 单二进制部署简单；Web UI 可视化；支持任意拓扑；Pseudo-GTID；GitHub 大规模验证。

**缺点：** 数据补偿不如 MHA 精细；需额外后端存储；自动故障转移需谨慎配置；无 VIP 管理。

---

## 五、其他方案

### 5.1 Keepalived + 双主

```
┌──────────┐    ┌──────────┐
│ MySQL-A  │←──→│ MySQL-B  │
│ (Active) │    │ (Standby)│
└────┬─────┘    └────┬─────┘
     └────→│VIP│←───┘
            └─┬─┘
              │ 客户端
切换快(<3s) 但有脑裂风险，不适合大规模
```

### 5.2 MySQL InnoDB Cluster

官方一体化方案 = MySQL Shell + MGR + MySQL Router：

```
┌──────────────┐
│ MySQL Shell  │  管理工具
├──────────────┤
│ MGR          │  数据一致性 + 自动切换
├──────────────┤
│ MySQL Router │  读写分离路由
├──────────────┤
│ 应用层       │
└──────────────┘
```

```javascript
// MySQL Shell 创建集群
var cluster = dba.createCluster('myCluster')
cluster.addInstance('root@node2:3306')
cluster.addInstance('root@node3:3306')
cluster.status()
```

---

## 六、对比选型矩阵

| 维度 | MHA | MGR | Orchestrator | Keepalived | InnoDB Cluster |
|------|-----|-----|-------------|------------|----------------|
| **维护状态** | 基本停更 | 官方维护 | 活跃 | 活跃 | 官方维护 |
| **切换时间** | 10-30s | 5-10s | 10-60s | 1-3s | 5-10s |
| **数据丢失** | 极小 | 0 | 取决于延迟 | 取决于延迟 | 0 |
| **外部组件** | Manager+Node | 无（内置） | Orc进程 | Keepalived | MySQL Router |
| **节点要求** | ≥2 | ≥3（奇数） | ≥2 | 2 | ≥3（奇数） |
| **写性能损耗** | 无 | 有（Paxos） | 无 | 无 | 有（Paxos） |
| **运维复杂度** | 中 | 低 | 中高 | 低 | 低 |
| **Web UI** | 无 | 无 | 有 | 无 | 有 |
| **生产验证** | 广泛 | 广泛 | GitHub等 | 小规模 | 逐渐普及 |

### 选型决策树

```
          ┌─────────────────────┐
          │  需要 MySQL 高可用    │
          └──────────┬──────────┘
                     │
          ┌──────────┴──────────┐
          │  能用 MySQL 8.0+？   │
          └──┬───────┬──────────┘
            是       否
             │       │
     ┌───────┘       └──────┐
     ▼                      ▼
  追求强一致              数据补偿优先
  RPO=0                  用 MHA
  → MGR / InnoDB Cluster
     │
  ┌──┴──────────┐
  │ 需要拓扑管理？│
  └──┬──────┬───┘
    是      否
     │      │
     ▼      ▼
  Orchestrator  InnoDB Cluster
  + MGR         (开箱即用)
```

---

## 七、生产环境部署建议

### 网络规划

```
┌─────────────────────────────────────────────────┐
│  机房 A (北京)       机房 B (上海)    机房 C     │
│  ┌──────────┐       ┌──────────┐  ┌──────────┐ │
│  │ Node 1   │←────→│ Node 2   │←→│ Node 3   │ │
│  │ PRIMARY  │       │SECONDARY │  │SECONDARY │ │
│  └──────────┘       └──────────┘  └──────────┘ │
│         延迟 < 10ms 理想                         │
│  ⚠️ MGR 跨机房延迟 > 30ms 写性能明显下降         │
│  ⚠️ 建议同城建集群，跨城用异步复制               │
└─────────────────────────────────────────────────┘
```

### 监控 SQL

```sql
-- 集群成员状态
SELECT MEMBER_HOST, MEMBER_ROLE, MEMBER_STATE
FROM performance_schema.replication_group_members;

-- 复制延迟
SELECT MEMBER_ID, COUNT_TRANSACTIONS_IN_QUEUE
FROM performance_schema.replication_group_member_stats;
```

### 日常检查清单

```
□ 集群成员状态（全部 ONLINE）
□ 复制延迟（接近 0）
□ GTID 一致性
□ 磁盘空间（binlog 增长）
□ 错误日志
□ 季度故障转移演练
□ 每周备份恢复测试
```

---

## 八、故障转移演练

```
阶段 1：准备
  □ 通知团队    □ 确认备份    □ 回滚方案    □ 低峰期

阶段 2：注入故障
  kill mysqld / iptables 阻断 / systemctl stop

阶段 3：观察切换
  □ 记录开始时间    □ 观察新 Primary 选举
  □ 验证应用恢复    □ 记录完成时间    □ 验证数据一致

阶段 4：恢复旧节点
  □ 修复旧 Master    □ 以 Slave 重新加入    □ 验证同步

阶段 5：总结
  □ 记录 RTO/RPO    □ 分析改进    □ 更新文档
```

---

## 九、面试要点

### Q1：MHA、MGR、Orchestrator 核心区别？

**A**：
- **MHA**：外部 Manager 监控，故障时 binlog 补偿后提升 Slave。异步复制，RTO 10-30s。
- **MGR**：MySQL 内置 Paxos 协议，自动检测选举。RPO=0，RTO 5-10s，需 ≥3 节点。
- **Orchestrator**：拓扑管理工具，强项是管理复杂拓扑，支持 Pseudo-GTID。故障转移不如 MHA 精细。

### Q2：MGR 强一致性怎么保证？

**A**：基于 Paxos 变体（XCom）。事务提交前广播到 Group 认证，多数派确认后才提交。已提交事务至少在多数派节点存在，不会丢失。冲突事务被回滚。RPO=0。

### Q3：MHA 如何不丢数据？

**A**：1）从旧 Master binlog 提取未复制事件（如可达）；2）识别 relay log 最新的 Slave；3）差异 binlog 应用到各 Slave 对齐；4）提升最新 Slave。旧 Master 不可达则丢失=复制延迟。配合半同步可降低风险。

### Q4：MGR 为什么至少 3 节点？

**A**：多数派协议。3 节点容忍 1 故障（2/3），5 节点容忍 2（3/5）。偶数不比奇数多容忍故障反而增加开销。最少 3，最多 9。

### Q5：Pseudo-GTID 是什么？

**A**：无 GTID 环境下，Orchestrator 定期在 Master 执行特殊注释语句注入 binlog 标记。通过标记在 Slave relay log 中找到对应位点，安全重构复制关系。相当于模拟 GTID。

### Q6：Keepalived 脑裂如何避免？

**A**：1）仲裁机制（第三台 ping 检查）；2）调低 vrrp 优先级差值；3）fencing（关闭对端）；4）第三方监控检测双主；5）应用层幂等设计。

### Q7：生产如何选型？

**A**：
- 新项目 + MySQL 8.0 → InnoDB Cluster（开箱即用）
- 追求强一致 → MGR 单主
- 不能升级 MySQL → MHA
- 复杂拓扑 → Orchestrator
- 小规模 → Keepalived + 双主
- 跨地域 → 同 region MGR，跨 region 异步复制

### Q8：MGR 多主模式为什么不推荐生产？

**A**：1）并发写同行冲突回滚多；2）冲突检测有开销；3）不支持外键和 SERIALIZABLE；4）交叉事务死锁风险；5）生产案例少。

---

## 十、总结

1. **MHA**：经典方案，数据补偿精细但已停更
2. **MGR**：官方强一致，RPO=0，新项目首选
3. **Orchestrator**：拓扑管理之王，复杂拓扑场景
4. **Keepalived**：简单快速，小规模双主
5. **InnoDB Cluster**：官方一体化，开箱即用

无论选哪种，必须：✅ 定期演练 ✅ 监控延迟 ✅ 做好备份 ✅ 回滚预案

> **高可用不是选一个工具，而是一套完整体系**——监控、告警、演练、备份、恢复，缺一不可。

---

## 附录 A：高可用方案配置检查清单

### MHA 检查清单

```
□ 1. SSH 免密互通（所有节点间）
□ 2. MySQL 复制用户权限正确
□ 3. relay_log_purge=0（保留 relay log 用于补偿）
□ 4. log_bin=ON（所有节点开启 binlog）
□ 5. read_only=1（Slave 节点设置）
□ 6. replicate_same_server_id=0
□ 7. manager_log 路径有写权限
□ 8. ping_interval 设置合理（建议 3s）
□ 9. candidate_master / no_master 标记正确
□ 10. Manager 进程有守护（supervisord / systemd）
□ 11. VIP 脚本测试通过
□ 12. 故障转移脚本测试通过
```

### MGR 检查清单

```
□ 1. 所有节点 server_id 不同
□ 2. gtid_mode=ON
□ 3. binlog_format=ROW
□ 4. binlog_row_image=FULL
□ 5. slave_preserve_commit_order=ON（8.0+）
□ 6. group_replication_group_name 全部一致
□ 7. group_replication_local_address 各节点不同
□ 8. group_replication_group_seeds 包含所有节点
□ 9. 防火墙放通 33061 端口（或自定义端口）
□ 10. 至少 3 节点（奇数）
□ 11. 所有节点 MySQL 版本一致
□ 12. mysql.user 表中 replication 用户权限正确
```

### Orchestrator 检查清单

```
□ 1. 后端数据库（MySQL/SQLite）可用
□ 2. 拓扑用户权限足够（REPLICATION CLIENT, SUPER）
□ 3. 发现配置覆盖所有实例
□ 4. Hook 脚本路径正确且有执行权限
□ 5. PreventCrossDataCenterMasterFailover 按需配置
□ 6. 审计日志开启
□ 7. Web UI 访问控制配置
□ 8. 自动恢复策略经测试验证
□ 9. 与 VIP/Proxy 的集成脚本测试通过
```

---

## 附录 B：高可用监控告警方案

### Prometheus + Grafana 监控指标

```yaml
# mysql_exporter 关键指标
- mysql_up                           # 实例存活
- mysql_slave_status_slave_io_running  # IO 线程
- mysql_slave_status_slave_sql_running # SQL 线程
- mysql_slave_status_seconds_behind_master  # 复制延迟

# MGR 专用指标
- mysql_global_status_group_replication_members   # 成员数
- mysql_global_status_group_replication_primary   # Primary 标识
- mysql_global_status_group_replication_connected # 连接状态
```

### 告警规则示例

```yaml
groups:
- name: mysql_ha
  rules:
  # 主从复制中断
  - alert: MySQLReplicationBroken
    expr: mysql_slave_status_slave_io_running == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "MySQL replication IO thread stopped"

  # 复制延迟 > 30s
  - alert: MySQLReplicationLag
    expr: mysql_slave_status_seconds_behind_master > 30
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "MySQL replication lag > 30s"

  # MGR 成员减少
  - alert: MGRMemberCountChanged
    expr: mysql_global_status_group_replication_members < 3
    for: 30s
    labels:
      severity: critical
    annotations:
      summary: "MGR member count < 3"

  # MGR 无 Primary
  - alert: MGRNoPrimary
    expr: mysql_global_status_group_replication_primary == 0
    for: 10s
    labels:
      severity: critical
    annotations:
      summary: "MGR has no PRIMARY"
```

---

## 附录 C：故障转移时间线分析

```
┌──────────────────────────────────────────────────────────────────┐
│          各方案故障转移时间线对比                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MHA (10-30s):                                                   │
│  0s──────3s──────────8s────────────15s──────────25s            │
│  │  检测  │  收集binlog │  补偿数据  │  切换+通知   │            │
│  │        │             │           │              │            │
│                                                                  │
│  MGR (5-10s):                                                    │
│  0s──────5s────────8s────────10s                                │
│  │  检测  │  选举  │  恢复  │                                      │
│  │        │        │        │                                      │
│                                                                  │
│  Orchestrator (10-60s):                                          │
│  0s──────5s──────────15s──────────30s──────────60s             │
│  │  检测  │  确认故障  │  选择候选  │  执行切换  │  通知应用      │
│  │        │           │           │            │               │
│                                                                  │
│  Keepalived (1-3s):                                              │
│  0s────1s────3s                                                  │
│  │  检测 │  VIP漂移 │                                            │
│  │       │        │                                              │
│  ⚠️ 最快但可能丢数据                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 附录 D：常见故障场景与应对

| 故障场景 | MHA | MGR | Orchestrator |
|---------|-----|-----|-------------|
| Master 宕机 | 自动切换 | 自动选举 | 自动/手动切换 |
| 网络分区 | Manager 检测不到 Master → 可能误切换 | 多数派存活则正常 | 需配置防脑裂 |
| Slave 宕机 | 不影响服务 | 不影响（多数派存活） | 标记为下线 |
| 所有 Slave 宕机 | 无法切换 | 集群不可用 | 无法切换 |
| Manager/Orc 宕机 | MHA 停止监控 | 无影响（内置） | 停止监控 |
| 磁盘满 | 实例崩溃 → 触发切换 | 实例崩溃 → 触发选举 | 实例崩溃 → 触发切换 |
| 误删数据 | binlog 可恢复 | 需备份恢复 | 需备份恢复 |

> ⚠️ **重点**：高可用方案解决的是"实例故障"，不是"人为误操作"。误删数据必须靠**定期备份 + binlog 恢复**。
