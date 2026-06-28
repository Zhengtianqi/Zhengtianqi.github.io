---
title: Paxos/Raft：分布式一致性算法深入详解
tag: ["Paxos", "Raft", "分布式一致性"]
category: 分布式
date: 2026-06-25
---

# Paxos/Raft：分布式一致性算法深入详解

> Paxos/Raft：分布式一致性算法深入详解是分布式系统中的核心话题，它涉及数据一致性、可用性和分区容错等关键挑战。
> 本文深入分析了Paxos/Raft：分布式一致性算法深入详解的原理和解决方案，帮助你构建可靠的分布式系统。

**场景**：5个服务器需要选择一个值（如新的Leader）

```
Server 1: 选择 A
Server 2: 选择 A
Server 3: 选择 B
Server 4: 离线（无法通信）
Server 5: 选择 A

目标：4个活跃节点中的3个选了A，最终应该选A
```

**需满足的条件**：

| 条件 | 含义 | 场景 |
|-----|------|------|
| **Safety（安全性）** | 不能选错，即使网络分区也不能有两个值被接受 | 两个Leader同时上台 |
| **Liveness（活性）** | 最终能选出一个值，不能永远卡住 | 投票无限轮次 |
| **Fault Tolerance** | 容忍部分节点故障 | 最多容忍f个故障，需≥2f+1个节点 |

### 1.2 FLP不可能性定理

**Fischer, Lynch, Paterson** 在1985年证明了一个重要定理：

**在异步系统中，即使只有一个节点故障，也不可能同时满足Safety和Liveness**

```
异步系统：无法确定消息延迟有多久
├─ 网络可能很慢（但最终会到达）
├─ 节点可能停顿很久（但最终会恢复）
└─ 你无法区分"节点宕机"和"消息延迟"

结果：无法确定是否应该超时+选择新Leader
```

**推论**：实际系统必须做**部分妥协**

| 算法 | 选择 |
|-----|------|
| **Paxos** | Safety > Liveness（宁可卡住，不能出错） |
| **Raft** | 在Safety基础上，优化Liveness |
| **Bitcoin** | Liveness > Safety（允许暂时分叉） |

## 二、Paxos：最强的共识算法

### 2.1 基本概念

Paxos将节点分为三种角色：

1. **Proposer（提议者）**：提议一个值
2. **Acceptor（接受者）**：投票同意/反对
3. **Learner（学习者）**：获取最终决议（可与Acceptor/Proposer重合）

**算法分为两个阶段**：

#### **Phase 1A: Prepare（准备阶段）**

```
Proposer 向所有 Acceptor 发送：
  Prepare(proposal_number)
  
  例如：Prepare(3)
  
Acceptor 收到后，判断：
  if proposal_number > 最大见过的proposal_number:
    记录 max_proposal = proposal_number
    回复：Promise(max_proposal, 最高接受的提议值)
  else:
    忽略（或回复拒绝）
```

**例子**：

```
Proposer 1 发送 Prepare(1)
  ↓
Acceptor A: 收到 Prepare(1) → 回复 Promise(1, null)
Acceptor B: 收到 Prepare(1) → 回复 Promise(1, null)
Acceptor C: 收到 Prepare(1) → 回复 Promise(1, null)

Proposer 1 得到多数回复(3/5)，继续Phase 2
```

#### **Phase 1B: Accept（接受阶段）**

```
Proposer 收到多数Promise后，发送：
  Accept(proposal_number, value)
  
  其中value的选择规则：
  if 收到的Promise中有值:
    选择 max_proposal_number 对应的值（保证一致性！）
  else:
    可选择任何值
    
Acceptor 收到Accept后：
  if proposal_number >= max_proposal:
    接受这个值，回复 Accepted(proposal_number, value)
  else:
    拒绝（说明有更新的Prepare到达）
```

**关键规则**（保证一致性的核心）：

```
如果某个值在某个时刻被大多数Acceptor接受，
那么后续所有Prepare阶段中，该值会被选中并继续传播。

原因：
  假设值V在第N轮被大多数接受
  第N+1轮Prepare时，Proposer会发送更大的proposal_number
  大多数Acceptor会回复包含V的Promise
  因此V会继续被选中并接受
```

### 2.2 Paxos执行流程示例

**场景**：5个节点决策是否关闭服务器

```
Node 1 (Proposer): 提议 "关闭"
Node 2 (Proposer): 提议 "不关闭"
Node 3,4,5 (Acceptor)

时间线：
─────────────────────────────────────────

T1: Node 1 发送 Prepare(1)
    Node 3 回复 Promise(1, null)
    Node 4 回复 Promise(1, null)
    Node 1 得到多数(2/3) → 继续
    
T2: Node 2 发送 Prepare(2)
    Node 4 回复 Promise(2, null)  ← 注意：更新了max_proposal
    Node 5 回复 Promise(2, null)
    Node 2 得到多数 → 继续

T3: Node 1 发送 Accept(1, "关闭")
    Node 3 回复 Accepted(1, "关闭")
    但Node 4 已记录max_proposal=2，拒绝！
    Node 1 只得到1/3 → 失败

T4: Node 2 发送 Accept(2, "不关闭")
    Node 3 回复 Accepted(2, "不关闭")
    Node 4 回复 Accepted(2, "不关闭")
    Node 5 回复 Accepted(2, "不关闭")
    Node 2 得到多数(3/3) → 成功！

结果：最终决议="不关闭"（因为Node 2的proposal_number更大）
```

### 2.3 Paxos的难点

**问题1：活锁（Livelock）**

```
Proposer A 和 B 互相"打断"：

A发送Prepare(1) → Acceptor接受
B发送Prepare(2) → Acceptor拒绝A的Accept(1)
A发送Prepare(3) → Acceptor拒绝B的Accept(2)
B发送Prepare(4) → ...

结果：Proposal_number不断增大，永远无法进入Accept阶段！
```

**解决**：选择一个 **Leader Proposer**，只有它能提议

**问题2：难以理解和实现**

```
为什么Phase 1必须有两个阶段？
为什么Accept阶段要选最大proposal_number对应的值？
为什么需要多数？

这些问题需要形式化证明，非常复杂。
实际上，即使是Google、Amazon的工程师也容易出错。
```

## 三、Raft：易于理解的共识算法

Raft由Stanford提出，目标是设计一个**易于理解的共识算法**。

### 3.1 核心概念

**Raft引入更强的约束来简化算法**：

| 特性 | Paxos | Raft |
|-----|-------|------|
| 角色 | Proposer/Acceptor/Learner混杂 | 明确的Leader/Follower/Candidate |
| Term（轮次） | Proposal Number | 更强的隔离性 |
| Leader | 无强制Leader | **必须有唯一Leader** |
| 日志 | 无概念 | **基于日志复制** |

### 3.2 Raft的三个子问题

#### **问题1：Leader选举**

**规则**：
1. 每个Term中最多一个Leader
2. Candidate在某个Term获得多数投票 → 成为Leader
3. Follower如果在超时时间内没收到Leader心跳 → 变成Candidate

**实现**：

```python
class RaftNode:
    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers
        self.state = "FOLLOWER"  # FOLLOWER | CANDIDATE | LEADER
        
# Paxos/Raft：分布式一致性算法深入详解


        self.current_term = 0  # 当前任期
        self.voted_for = None  # 当前任期投票给谁
        self.log = []  # 日志条目
        
        # 易失状态（内存）
        self.commit_index = 0  # 已提交的最大日志索引
        self.last_applied = 0  # 已应用到状态机的日志索引
        
        # Leader状态
        self.next_index = {}  # 待发给各Follower的日志索引
        self.match_index = {}  # 各Follower已复制的日志索引
        
        self.election_timeout = random.randint(150, 300)  # ms
        self.last_heartbeat_time = time.time()
    
    async def election_timeout_handler(self):
        """
        Follower超时未收到Leader心跳 → 发起选举
        """
        while True:
            await asyncio.sleep(self.election_timeout / 1000)
            
            if self.state == "FOLLOWER":
                if time.time() - self.last_heartbeat_time > self.election_timeout / 1000:
                    await self.start_election()
    
    async def start_election(self):
        """
        Candidate发起选举
        """
        self.current_term += 1
        self.state = "CANDIDATE"
        self.voted_for = self.node_id  # 投票给自己
        
        # 记录日志，用于选举限制
        last_log_index = len(self.log) - 1
        last_log_term = self.log[last_log_index]['term'] if self.log else 0
        
        # 并行发送RequestVote RPC
        votes_received = 1  # 自己的一票
        
        for peer in self.peers:
            response = await self.send_vote_request(
                peer,
                term=self.current_term,
                candidate_id=self.node_id,
                last_log_index=last_log_index,
                last_log_term=last_log_term
            )
            
            if response and response['vote_granted']:
                votes_received += 1
        
        # 获得多数投票 → 成为Leader
        if votes_received > len(self.peers) / 2:
            await self.become_leader()
        else:
            self.state = "FOLLOWER"
    
    async def become_leader(self):
        """
        成为Leader
        """
        self.state = "LEADER"
        print(f"Node {self.node_id} became LEADER in term {self.current_term}")
        
        # 初始化Leader状态
        for peer in self.peers:
            self.next_index[peer] = len(self.log)
            self.match_index[peer] = 0
        
        # 立即发送心跳（AppendEntries RPC，不含日志条目）
        await self.send_heartbeats()
    
    async def send_heartbeats(self):
        """
        Leader定期发送心跳保持权威性
        """
        while self.state == "LEADER":
            for peer in self.peers:
                await self.append_entries(peer)
            
            await asyncio.sleep(0.05)  # 心跳间隔50ms
    
    async def append_entries(self, peer):
        """
        AppendEntries RPC：复制日志 / 发送心跳
        """
        prev_log_index = self.next_index[peer] - 1
        prev_log_term = self.log[prev_log_index]['term'] if prev_log_index >= 0 else 0
        
        # 需要发送给Follower的日志条目
        entries = self.log[self.next_index[peer]:]
        
        response = await self.send_append_entries_rpc(
            peer,
            term=self.current_term,
            leader_id=self.node_id,
            prev_log_index=prev_log_index,
            prev_log_term=prev_log_term,
            entries=entries,
            leader_commit=self.commit_index
        )
        
        if response:
            if response['success']:
                # Follower复制成功
                self.match_index[peer] = len(self.log) - 1
                self.next_index[peer] = len(self.log)
            else:
                # Follower日志不匹配，回退
                self.next_index[peer] = max(0, self.next_index[peer] - 1)
    
    async def handle_append_entries(self, request):
        """
        Follower处理AppendEntries RPC
        """
        # 更新心跳时间
        self.last_heartbeat_time = time.time()
        
        # 任期检查
        if request['term'] < self.current_term:
            return {'success': False}
        
        if request['term'] > self.current_term:
            self.current_term = request['term']
            self.voted_for = None
            self.state = "FOLLOWER"
        
        # 日志检查：Follower必须有prev_log
        if request['prev_log_index'] >= len(self.log):
            return {'success': False}
        
        if request['prev_log_index'] >= 0:
            if self.log[request['prev_log_index']]['term'] != request['prev_log_term']:
                return {'success': False}
        
        # 日志复制：追加新条目
        for i, entry in enumerate(request['entries']):
            log_index = request['prev_log_index'] + 1 + i
            if log_index >= len(self.log):
                self.log.append(entry)
            elif self.log[log_index]['term'] != entry['term']:
                # 删除冲突条目及之后的所有条目
                self.log = self.log[:log_index]
                self.log.append(entry)
        
        # 更新提交索引
        if request['leader_commit'] > self.commit_index:
            self.commit_index = min(
                request['leader_commit'],
                len(self.log) - 1
            )
        
        return {'success': True, 'term': self.current_term}
```

#### **问题2：日志复制**

Leader将客户端请求追加到日志，然后复制给Followers

```
Leader:
┌──────────────────────────────┐
│ 日志：[cmd1, cmd2, cmd3]      │
│ committed_index = 2           │ ← 已提交给状态机
└──────────────────────────────┘

Follower A:
┌──────────────────────────────┐
│ 日志：[cmd1, cmd2]            │
│ committed_index = 2           │
└──────────────────────────────┘
(缺少cmd3，Leader会继续推送)

Follower B:
┌──────────────────────────────┐
│ 日志：[cmd1, cmd2, cmd3]      │
│ committed_index = 2           │
└──────────────────────────────┘
(已复制，但Leader还未标记为已提交)
```

**日志提交规则**：

```
Leader只有在满足以下条件时，才能提交一条日志：
1. 该日志是当前任期的（保证不会应用旧任期的日志）
2. 大多数Followers已复制该日志（保证持久化）
```

**代码**：

```python
async def handle_client_request(self, command):
    """
    客户端请求 → 追加到日志
    """
    if self.state != "LEADER":
        return {'error': 'Not leader'}
    
    # 添加日志条目
    log_entry = {
        'term': self.current_term,
        'command': command,
        'index': len(self.log)
    }
    self.log.append(log_entry)
    
    # 异步复制给Followers（通过心跳/AppendEntries）
    # 等待大多数回复后，更新commit_index
    
    return {'success': True, 'log_index': len(self.log) - 1}

async def update_commit_index(self):
    """
    定期检查是否可以提交日志
    """
    while True:
        if self.state == "LEADER":
            # 找到大多数Followers已复制的最大索引
            replicated_indices = sorted(
                [self.match_index[peer] for peer in self.peers] + [len(self.log) - 1]
            )
            majority_index = replicated_indices[len(replicated_indices) // 2]
            
            # 只提交当前任期的日志
            if majority_index > self.commit_index:
                if self.log[majority_index]['term'] == self.current_term:
                    self.commit_index = majority_index
                    await self.apply_log()
        
        await asyncio.sleep(0.01)

async def apply_log(self):
    """
    将已提交的日志应用到状态机
    """
    while self.last_applied < self.commit_index:
        self.last_applied += 1
        command = self.log[self.last_applied]['command']
        
        # 应用到状态机（KV存储、数据库等）
        await self.state_machine.apply(command)
```

#### **问题3：安全性保证**

**Leader完整性（Leader Completeness）**：

```
如果一条日志已经提交，那么后续的Leader必然包含这条日志

证明：
  假设日志在任期T中提交（大多数节点有它）
  后续Leader在任期T+1选举时，会从大多数节点获得投票
  由鸽笼原理，至少一个投票者同时见过该日志（T任期那个多数 ∩ T+1任期多数）
  Raft的投票规则保证：只投票给日志更新的Candidate
  ∴ T+1任期的Leader日志包含T任期的所有提交日志
```

**投票规则**：

```python
async def handle_vote_request(self, request):
    """
    处理RequestVote RPC
    """
    if request['term'] > self.current_term:
        self.current_term = request['term']
        self.voted_for = None
    
    # 只投票给日志更新的Candidate
    is_log_ok = (
        request['last_log_term'] > self.get_last_log_term() or
        (request['last_log_term'] == self.get_last_log_term() and 
         request['last_log_index'] >= self.get_last_log_index())
    )
    
    if request['term'] == self.current_term and is_log_ok:
        if self.voted_for is None or self.voted_for == request['candidate_id']:
            self.voted_for = request['candidate_id']
            return {'vote_granted': True}
    
    return {'vote_granted': False}
```

### 3.3 Raft与Paxos对比

| 特性 | Paxos | Raft |
|-----|-------|------|
| 理解难度 | 极难（需要形式化证明） | 容易（状态机清晰） |
| 实现难度 | 容易出错 | 相对容易 |
| 性能 | 略高（无强制Leader） | 略低（强制Leader） |
| 容错能力 | 相同（都是f < n/2） | 相同 |
| 应用 | Google Chubby | etcd、Consul、HDFS 3.0 |

## 四、实战应用：etcd 中的 Raft

### 4.1 etcd架构

```
┌─────────────────┐
│ 客户端          │
└────────┬────────┘
         │
┌────────▼──────────────────┐
│ etcd Server               │
│  ┌────────────────────┐   │
│  │ Raft Module        │   │
│  │ - Leader Election  │   │
│  │ - Log Replication  │   │
│  │ - State Machine    │   │
│  └────────────────────┘   │
│  ┌────────────────────┐   │
│  │ KV Store           │   │
│  │ (BoltDB)           │   │
│  └────────────────────┘   │
└────────┬──────────────────┘
         │
      网络 (Raft通信)
         │
   ┌─────┴────┬──────┐
   ↓          ↓      ↓
 etcd1      etcd2   etcd3
(集群)
```

### 4.2 部署与高可用

**三节点集群推荐配置**：

```yaml
# etcd 配置
# node1.yaml
name: 'etcd1'
listen-client-urls: 'http://0.0.0.0:2379'
advertise-client-urls: 'http://10.0.0.1:2379'
listen-peer-urls: 'http://0.0.0.0:2380'
initial-advertise-peer-urls: 'http://10.0.0.1:2380'
initial-cluster: 'etcd1=http://10.0.0.1:2380,etcd2=http://10.0.0.2:2380,etcd3=http://10.0.0.3:2380'
initial-cluster-state: 'new'
initial-cluster-token: 'etcd-cluster-1'
```

**容错能力**：

```
5节点集群可容忍2个节点故障
  需要3个节点(多数) = 5 - 2
  
3节点集群可容忍1个节点故障
  需要2个节点(多数) = 3 - 1
  
1节点集群不容忍任何故障(生产禁用)
```

### 4.3 故障恢复

**场景1：Follower宕机**

```
Leader持续发送心跳给该Follower
Follower恢复后，收到Leader的AppendEntries，快速追上

恢复时间：O(日志大小)
```

**场景2：Leader宕机**

```
T0: Leader宕机
T1: Followers超时未收到心跳
T2: 有一个Follower发起选举
T3: 获得多数投票，成为新Leader
T4: 客户端重定向到新Leader

总耗时：150-300ms (election_timeout)
```

**场景3：网络分割**

```
原始：5个节点，1个Leader

分割：
  分组A: 3个节点 (含Leader)
  分组B: 2个节点

分组A: 有多数，可继续写入
分组B: 无多数，选举失败，无法写入(正确!)

恢复：
  网络恢复后，分组B加入，通过日志复制追上分组A
```

## 五、性能优化

### 5.1 快照机制

```
日志无限增长 → 占用内存/磁盘 → 恢复慢

解决：定期生成快照
├─ 快照内容：当前状态机的完整状态
├─ 快照时间点：commit_index
└─ 快照后删除旧日志

例子：
  应用1000条命令
  状态机状态：{key1: val1, key2: val2, ...}
  
  创建快照
  
  之后的日志只需保留快照点之后的命令（例如命令1001-1100）
```

**实现**：

```python
async def create_snapshot(self):
    """
    创建快照
    """
    if self.last_applied == 0:
        return
    
    snapshot = {
        'term': self.current_term,
        'index': self.last_applied,
        'data': await self.state_machine.snapshot()  # 序列化完整状态
    }
    
    # 写入磁盘
    with open(f'snapshot-{self.last_applied}.bin', 'wb') as f:
        f.write(pickle.dumps(snapshot))
    
    # 删除快照前的日志
    self.log = self.log[self.last_applied:]

async def load_snapshot(self):
    """
    启动时恢复快照
    """
    latest_snapshot = max(glob.glob('snapshot-*.bin'))
    
    with open(latest_snapshot, 'rb') as f:
        snapshot = pickle.loads(f.read())
    
    self.last_applied = snapshot['index']
    await self.state_machine.restore(snapshot['data'])
```

### 5.2 批量提交

```python
async def batch_write(self, commands, timeout=100):
    """
    将多条命令一起追加，减少网络往返
    """
    batch = []
    
    for command in commands:
        batch.append({
            'term': self.current_term,
            'command': command
        })
    
    # 一次AppendEntries包含多条日志
    self.log.extend(batch)
    
    # 等待多数Follower回复
    # 返回结果
```

## 总结

| 算法 | 安全性 | 可用性 | 易用性 | 应用 |
|-----|-------|-------|-------|------|
| **Paxos** | ⭐⭐⭐ | ⭐⭐ | ⭐ | Google Chubby, Spanner |
| **Raft** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | etcd, Consul, HDFS 3.0 |

**黄金法则**：
1. **优先选择Raft**（易于理解和实现）
2. 如果需要更多自由度，考虑Paxos
3. 生产环境推荐用成熟库（Seata、etcd），不要自己实现
