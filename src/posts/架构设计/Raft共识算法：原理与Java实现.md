---
title: Raft共识算法：原理与Java实现
date: 2026-09-01
category: 架构设计
tag: ["Raft", "分布式", "共识算法", "一致性"]
---

# Raft共识算法：原理与Java实现

> Raft是分布式系统中最常用的共识算法，理解其原理是设计高可用系统的基础。
> 本文深入剖析Raft的核心机制、Leader选举、日志复制和Java实现，帮助你掌握分布式一致性的精髓。

## 一、为什么需要共识算法

### 1.1 分布式系统挑战

| 挑战 | 说明 |
|------|------|
| 网络分区 | 节点间通信中断 |
| 节点故障 | 服务器宕机、重启 |
| 消息丢失 | 网络包丢失 |
| 消息乱序 | 消息到达顺序不确定 |

### 1.2 一致性模型

```
一致性模型：

强一致性：
├─ 线性一致性 (Linearizability)
└─ 顺序一致性 (Sequential Consistency)

弱一致性：
├─ 最终一致性 (Eventual Consistency)
└─ 因果一致性 (Causal Consistency)

Raft提供：强一致性(线性一致性)
```

## 二、Raft核心概念

### 2.1 节点状态

```
Raft节点状态：

┌─────────────────────────────────────────────────────────────┐
│                    Raft节点状态机                             │
│                                                             │
│  ┌─────────────┐    超时    ┌─────────────┐                 │
│  │  Follower   │ ─────────→ │ Candidate   │                 │
│  │  (跟随者)   │            │  (候选者)   │                 │
│  └─────────────┘ ←───────── └─────────────┘                 │
│        ↑                    获得多数票                       │
│        │                         ↓                          │
│        │                 ┌─────────────┐                    │
│        └──────────────── │  Leader     │                    │
│            发现更高任期  │  (领导者)   │                    │
│                          └─────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心概念

| 概念 | 说明 |
|------|------|
| 任期(Term) | 逻辑时钟，每次选举递增 |
| 日志索引 | 日志条目的位置 |
| 提交索引 | 已提交的最高日志索引 |
| 选举超时 | Follower转为Candidate的时间 |

## 三、Leader选举

### 3.1 选举流程

```
Leader选举流程：

1. Follower等待心跳超时
   └─ 选举超时随机(150-300ms)

2. Follower转为Candidate
   └─ 递增当前任期
   └─ 投票给自己
   └─ 发送RequestVote请求

3. 等待投票结果
   ├─ 获得多数票 → 成为Leader
   ├─ 收到更高任期的心跳 → 转为Follower
   └─ 超时 → 重新选举

4. Leader发送心跳
   └─ 维护领导者地位
```

### 3.2 状态转换

```java
// 节点状态
public enum NodeState {
    FOLLOWER,
    CANDIDATE,
    LEADER
}

// 状态转换
public class RaftNode {
    private NodeState state = NodeState.FOLLOWER;
    private long currentTerm = 0;
    private String votedFor = null;
    
    public void onElectionTimeout() {
        if (state == NodeState.FOLLOWER) {
            // 转为Candidate
            state = NodeState.CANDIDATE;
            currentTerm++;
            votedFor = nodeId;
            startElection();
        }
    }
}
```

## 四、日志复制

### 4.1 日志结构

```
日志结构：

┌─────────────────────────────────────────────────────────────┐
│  Term    │  Index   │  Command   │  Status                   │
├─────────────────────────────────────────────────────────────┤
│  1       │  1       │  set x=1   │  已提交                   │
│  1       │  2       │  set y=2   │  已提交                   │
│  2       │  3       │  set x=3   │  已提交                   │
│  2       │  4       │  set z=4   │  未提交                   │
│  3       │  5       │  set x=5   │  未提交                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 复制流程

```
日志复制流程：

1. 客户端发送命令到Leader
   └─ Leader将命令追加到本地日志

2. Leader发送AppendEntries到Followers
   └─ 包含前一条日志的索引和任期

3. Followers验证日志一致性
   ├─ 一致 → 追加日志，返回成功
   └─ 不一致 → 返回失败，Leader调整

4. Leader收到多数节点成功响应
   └─ 提交日志，应用到状态机

5. Leader通知Followers提交
   └─ 后续心跳携带提交索引
```

### 4.3 日志一致性检查

```java
// AppendEntries RPC
public class AppendEntriesRequest {
    private long term;           // Leader的任期
    private String leaderId;     // Leader的ID
    private long prevLogIndex;   // 前一条日志的索引
    private long prevLogTerm;    // 前一条日志的任期
    private List<LogEntry> entries;  // 日志条目
    private long leaderCommit;   // Leader的提交索引
}

// 日志一致性检查
public boolean checkLogConsistency(long prevLogIndex, long prevLogTerm) {
    if (prevLogIndex == 0) return true;
    
    LogEntry prevEntry = log.get(prevLogIndex);
    if (prevEntry == null) return false;
    
    return prevEntry.getTerm() == prevLogTerm;
}
```

## 五、安全性保证

### 5.1 安全性属性

| 属性 | 说明 |
|------|------|
| 选举安全 | 每个任期最多一个Leader |
| Leader只追加 | Leader不会删除或覆盖日志 |
| 日志匹配 | 不同节点相同索引的日志相同 |
| Leader完整性 | 已提交的日志一定会出现在Leader |

### 5.2 选举限制

```java
// RequestVote RPC
public class RequestVoteRequest {
    private long term;           // Candidate的任期
    private String candidateId;  // Candidate的ID
    private long lastLogIndex;   // Candidate最后日志的索引
    private long lastLogTerm;    // Candidate最后日志的任期
}

// 投票判断
public boolean shouldGrantVote(RequestVoteRequest request) {
    // 1. 候选人任期必须大于等于当前任期
    if (request.getTerm() < currentTerm) {
        return false;
    }
    
    // 2. 候选人日志必须至少和自己一样新
    if (request.getLastLogTerm() < lastLogTerm) {
        return false;
    }
    if (request.getLastLogTerm() == lastLogTerm && 
        request.getLastLogIndex() < lastLogIndex) {
        return false;
    }
    
    // 3. 本任期尚未投票
    if (votedFor != null && !votedFor.equals(request.getCandidateId())) {
        return false;
    }
    
    return true;
}
```

## 六、Java实现

### 6.1 核心数据结构

```java
// 日志条目
public class LogEntry {
    private long term;
    private long index;
    private String command;
    
    public LogEntry(long term, long index, String command) {
        this.term = term;
        this.index = index;
        this.command = command;
    }
}

// Raft节点
public class RaftNode {
    private String nodeId;
    private NodeState state;
    private long currentTerm;
    private String votedFor;
    private List<LogEntry> log;
    private long commitIndex;
    private long lastApplied;
    
    // Leader专用
    private Map<String, Long> nextIndex;
    private Map<String, Long> matchIndex;
}
```

### 6.2 选举实现

```java
public class RaftNode {
    
    private void startElection() {
        currentTerm++;
        state = NodeState.CANDIDATE;
        votedFor = nodeId;
        int voteCount = 1;
        
        // 并行发送RequestVote
        for (String peer : peers) {
            CompletableFuture.supplyAsync(() -> {
                return sendRequestVote(peer);
            }).thenAccept(response -> {
                if (response.isGranted()) {
                    voteCount++;
                    if (voteCount > peers.size() / 2) {
                        becomeLeader();
                    }
                } else if (response.getTerm() > currentTerm) {
                    stepDown(response.getTerm());
                }
            });
        }
    }
    
    private void becomeLeader() {
        state = NodeState.LEADER;
        // 初始化nextIndex和matchIndex
        for (String peer : peers) {
            nextIndex.put(peer, lastLogIndex() + 1);
            matchIndex.put(peer, 0L);
        }
        // 发送心跳
        sendHeartbeats();
    }
}
```

### 6.3 日志复制实现

```java
public class RaftNode {
    
    public void replicateLog(String followerId) {
        long nextIdx = nextIndex.get(followerId);
        
        AppendEntriesRequest request = new AppendEntriesRequest(
            currentTerm,
            nodeId,
            nextIdx - 1,
            getLogTerm(nextIdx - 1),
            getEntriesFrom(nextIdx),
            commitIndex
        );
        
        sendAppendEntries(followerId, request)
            .thenAccept(response -> {
                if (response.isSuccess()) {
                    nextIndex.put(followerId, nextIdx + request.getEntries().size());
                    matchIndex.put(followerId, nextIdx + request.getEntries().size() - 1);
                    advanceCommitIndex();
                } else {
                    // 递减nextIndex重试
                    nextIndex.put(followerId, Math.max(1, nextIdx - 1));
                    replicateLog(followerId);
                }
            });
    }
    
    private void advanceCommitIndex() {
        for (long n = commitIndex + 1; n <= lastLogIndex(); n++) {
            if (getLogTerm(n) == currentTerm) {
                int replicateCount = 1;
                for (String peer : peers) {
                    if (matchIndex.get(peer) >= n) {
                        replicateCount++;
                    }
                }
                if (replicateCount > (peers.size() + 1) / 2) {
                    commitIndex = n;
                    applyCommittedEntries();
                }
            }
        }
    }
}
```

## 七、实战案例

### 7.1 配置中心

```java
// 基于Raft的配置中心
@ConfigurationCenter
public class RaftConfigCenter {
    
    private final RaftNode raftNode;
    
    public void setConfig(String key, String value) {
        // 通过Raft复制配置
        String command = "SET " + key + " " + value;
        raftNode.appendEntry(command);
    }
    
    public String getConfig(String key) {
        // 从Leader读取
        return raftNode.getStateMachine().get(key);
    }
}
```

### 7.2 分布式锁

```java
// 基于Raft的分布式锁
public class RaftDistributedLock {
    
    private final RaftNode raftNode;
    
    public boolean tryLock(String lockKey, String clientId) {
        String command = "LOCK " + lockKey + " " + clientId;
        return raftNode.appendEntry(command).isSuccess();
    }
    
    public void unlock(String lockKey, String clientId) {
        String command = "UNLOCK " + lockKey + " " + clientId;
        raftNode.appendEntry(command);
    }
}
```

## 八、最佳实践

### 8.1 部署建议

| 建议 | 说明 |
|------|------|
| 奇数节点 | 3、5、7个节点 |
| 分布式部署 | 节点分布在不同机器 |
| 监控告警 | 监控选举状态和日志复制 |
| 定期备份 | 备份状态机数据 |

### 8.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 频繁选举 | 网络不稳定 | 调整选举超时 |
| 日志不一致 | 节点重启 | 使用快照恢复 |
| 性能下降 | 日志过大 | 定期快照压缩 |

