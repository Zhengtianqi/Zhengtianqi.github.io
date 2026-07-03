---
title: Kafka 源码级深度：Producer 与 Consumer 核心流程与 ISR 机制
tag: ["Kafka", "源码", "Producer", "Consumer", "ISR", "Exactly-Once"]
category: 基础知识
date: 2026-07-03
---

# Kafka 源码级深度：Producer 与 Consumer 核心流程与 ISR 机制

会用 Kafka 和懂 Kafka 是两个层次。Producer 发送经过哪些组件？Consumer Group 怎么做 Rebalance？ISR 到底怎么保证数据不丢？从源码级别彻底讲透。

---

## 一、Producer 发送流程

### 1.1 完整流程

```
用户调用 producer.send(record)
    │
    ▼
┌──────────────┐
│  Interceptors │ ← 拦截器链（onSend）
└──────┬───────┘
       ▼
┌──────────────┐
│  Serializer   │ ← Key/Value 序列化
└──────┬───────┘
       ▼
┌──────────────┐
│  Partitioner  │ ← 分区选择
└──────┬───────┘
       ▼
┌──────────────┐
│  RecordAccumulator │ ← 消息累加器（按分区组织 Batch）
│  ┌──────────────┐  │
│  │ Partition 0  │  │
│  │ [batch1][batch2]│
│  │ Partition 1  │  │
│  │ [batch1]     │  │
│  └──────────────┘  │
└──────┬───────────┘
       ▼
┌──────────────┐
│   Sender 线程  │ ← 后台线程，从累加器拉取 Batch
└──────┬───────┘
       ▼
┌──────────────┐
│  NetworkClient │ ← NIO 网络发送
└──────┬───────┘
       ▼
┌──────────────┐
│   Broker      │ ← Kafka 服务器
└──────────────┘
       │
       ▼
┌──────────────┐
│  Interceptors │ ← onAcknowledgement（收到 ACK 后）
└──────────────┘
```

### 1.2 分区策略源码

```java
// DefaultPartitioner 分区选择逻辑
public int partition(String topic, Object key, byte[] keyBytes,
                     Object value, byte[] valueBytes, Cluster cluster) {
    
    List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
    int numPartitions = partitions.size();
    
    if (keyBytes == null) {
        // 无 Key：轮询（Round-Robin），但用 Sticky 保证同一 Batch 不跨分区
        int nextValue = nextValue(topic);
        // 用 partition 数量做取模
        return Utils.toPositive(nextValue) % numPartitions;
    } else {
        // 有 Key：对 Key 做 Hash 取模
        return Utils.toPositive(Utils.murmur2(keyBytes)) % numPartitions;
    }
}

// 自定义分区器
public class OrderPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        // 按订单类型分区
        Order order = (Order) value;
        if ("vip".equals(order.getType())) {
            return 0;  // VIP 订单到 0 号分区
        }
        return Math.abs(order.getUserId().hashCode()) % (cluster.partitionCountForTopic(topic) - 1) + 1;
    }
}
```

### 1.3 ACK 机制

```java
// acks 配置
producer.ack = 0    // 不等确认，发完就走（可能丢数据）
producer.ack = 1    // Leader 写入即确认（Leader 挂了可能丢）
producer.ack = -1   // ISR 全部写入才确认（最安全，all）
producer.ack = 1    // Leader + 至少 1 个 follower（折中）

// 源码：ClientResponse 处理
private void handleProduceResponse(ClientResponse response, ProducerBatch batch) {
    ProduceResponse.PartitionResponse partResp = response.responseBody().responses().get(batch.topicPartition);
    
    switch (partResp.error) {
        case NONE:  // 成功
            batch.complete(partResp.baseOffset, partResp.logAppendTime);
            break;
        case NOT_ENOUGH_REPLICAS:  // ISR 不足
            // 重试
            batch.reenqueue();
            break;
        case NOT_LEADER_FOR_PARTITION:  // Leader 切换
            // 重新获取元数据后重试
            metadata.requestUpdate();
            batch.reenqueue();
            break;
    }
}
```

---

## 二、Consumer Group 与 Rebalance

### 2.1 Consumer Group 协调

```
Consumer Group 架构：

  ┌──────────────────────────────────────────────┐
  │              Group Coordinator                │
  │           (Broker 上的一个组件)                │
  │                                              │
  │  维护：                                       │
  │   - Group 成员列表                            │
  │   - 分区分配方案                              │
  │   - 消费 Offset                               │
  └───────────────┬──────────────────────────────┘
                  │ 心跳 / 请求
  ┌───────────────┼───────────────────────────┐
  │               │                           │
  ▼               ▼                           ▼
Consumer 1    Consumer 2                 Consumer 3
P0, P1        P2, P3                     P4, P5

Rebalance 触发条件：
  1. Consumer 加入 Group（新启动）
  2. Consumer 离开 Group（关闭/崩溃）
  3. Consumer 心跳超时（session.timeout.ms）
  4. 分区数变化（Topic 增加分区）
  5. 订阅 Topic 变化
```

### 2.2 分配策略

```java
// 三种分配策略（partition.assignment.strategy）

// 1. RangeAssignor（默认）
//   按 Topic 维度，分区按 Consumer 数量均分
//   Topic-A: 6 分区, 3 Consumer → 每个 2 分区
//   Topic-B: 3 分区, 3 Consumer → 每个 1 分区
//   问题：Consumer 0 总是多分（不均匀）

// 2. RoundRobinAssignor
//   所有 Topic 的分区混合，轮询分配
//   更均匀

// 3. StickyAssignor（推荐）
//   尽量保持上次分配，减少 Rebalance 时的分区迁移
//   Rebalance 时只重新分配变化的分区

// 4. CooperativeStickyAssignor（Kafka 2.4+）
//   增量 Rebalance：不需要 Stop-The-World
//   每次只交接需要变更的分区，其他分区继续消费
```

### 2.3 Rebalance 流程

```
Rebalance 两阶段协议：

阶段 1：JoinGroup（选 Leader + 成员同步）
  Consumer → Coordinator: "我要加入 Group"
  Coordinator: 等待所有成员加入
  Coordinator → Consumer 1 (Leader): "你是 Leader，这是成员列表"
  Coordinator → Consumer 2,3: "你是 Follower，等分配结果"

阶段 2：SyncGroup（分配方案下发）
  Consumer 1 (Leader) → Coordinator: "这是分配方案"
    P0,P1 → Consumer 1
    P2,P3 → Consumer 2
    P4,P5 → Consumer 3
  Coordinator → Consumer 2: "你负责 P2,P3"
  Coordinator → Consumer 3: "你负责 P4,P5"

Rebalance 代价：
  - Stop-The-World（CooperativeStickyAssignor 除外）
  - 所有 Consumer 停止消费
  - 重新分配分区
  - 可能导致重复消费（Offset 未提交）
```

### 2.4 消费 Offset 管理

```java
// Consumer 自动提交（简单但可能重复消费）
props.put("enable.auto.commit", "true");
props.put("auto.commit.interval.ms", "5000");  // 每 5 秒提交

// 手动提交（推荐）
props.put("enable.auto.commit", "false");

// 同步提交（阻塞等待）
consumer.commitSync();

// 异步提交（不阻塞，但可能失败）
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) {
        log.error("Commit failed: {}", exception);
    }
});

// 最佳实践：同步+异步组合
try {
    while (true) {
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
        process(records);
        consumer.commitAsync();  // 正常用异步
    }
} finally {
    try {
        consumer.commitSync();  // 退出前同步确保提交
    } finally {
        consumer.close();
    }
}
```

---

## 三、ISR 机制

### 3.1 ISR 核心概念

```
每个 Partition 的副本分为三类：

  ┌─────────────────────────────────────────────────┐
  │              Partition (3 副本)                  │
  │                                                 │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
  │  │ Leader   │  │ Follower │  │ Follower │     │
  │  │ (Broker1)│  │ (Broker2)│  │ (Broker3)│     │
  │  │  LEO=100 │  │  LEO=98  │  │  LEO=95  │     │
  │  └──────────┘  └──────────┘  └──────────┘     │
  │       │                                         │
  │       │  ISR = {Broker1, Broker2}              │
  │       │  (Broker3 落后太多，被踢出 ISR)          │
  │       │                                         │
  │       │  HW = min(LEO of ISR) = 98             │
  │       │  (High Watermark，消费者只能看到 HW 之前) │
  │       │                                         │
  │       │  LEO = 100 (Leader End Offset)          │
  └─────────────────────────────────────────────────┘

ISR (In-Sync Replicas)：
  与 Leader 保持同步的副本集合
  条件：follower LEO 与 leader LEO 差距 < replica.lag.time.max.ms（默认 30s）
  超过这个时间未同步 → 被踢出 ISR

HW (High Watermark)：
  ISR 中最小的 LEO
  Consumer 只能消费 HW 之前的消息
  保证已消费的消息在所有 ISR 副本中都存在

LEO (Log End Offset)：
  每个副本的下一条写入位置
```

### 3.2 ISR 动态维护

```java
// Broker 端 ISR 管理（简化）

// Leader 副本跟踪每个 Follower 的同步进度
class ReplicaManager {
    
    // 检查 ISR 变更
    def maybeShrinkIsr(topicPartition: TopicPartition): Unit = {
        val leaderReplica = getLeaderReplica(topicPartition)
        val isr = leaderReplica.isr  // 当前 ISR
        
        // 找出需要移除的副本
        val outOfSync = isr.filter { replica =>
            // 判断条件：最后同步时间超过 replica.lag.time.max.ms
            time.currentTimeMillis() - replica.lastCaughtUpTime > replicaLagTimeMaxMs
        }
        
        if (outOfSync.nonEmpty) {
            val newIsr = isr.diff(outOfSync)
            // 更新 ISR 到 ZooKeeper / KRaft
            updateIsr(topicPartition, newIsr)
            leaderReplica.isr = newIsr
        }
    }
    
    // Follower 追上 Leader 时加入 ISR
    def maybeExpandIsr(topicPartition: TopicPartition): Unit = {
        val leaderReplica = getLeaderReplica(topicPartition)
        val followerReplica = getFollowerReplica(topicPartition)
        
        if (!leaderReplica.isr.contains(followerReplica)) {
            if (followerReplica.leo >= leaderReplica.hw) {
                // Follower 追上了 HW → 加入 ISR
                val newIsr = leaderReplica.isr :+ followerReplica
                updateIsr(topicPartition, newIsr)
                leaderReplica.isr = newIsr
            }
        }
    }
}
```

### 3.3 ISR 与数据可靠性

```
acks=-1（all）的写入流程：

  Producer → Leader: 写入消息
  Leader: 写入本地 Log，LEO++
  Follower: 从 Leader 拉取消息
  Follower: 写入本地 Log，LEO++
  Follower: 向 Leader 汇报 LEO
  
  Leader: 检查 ISR 中所有副本是否都已写入
    ISR 全部写入 → 更新 HW → 回复 Producer ACK
  
  如果 ISR 中有副本超时未同步：
    1. 超时副本被踢出 ISR
    2. ISR 缩小后，等待剩余 ISR 全部写入
    3. 如果 ISR 只剩 Leader → min.insync.replicas 不满足 → 写入失败

关键参数：
  min.insync.replicas=2  # ISR 最少 2 个副本才允许写入
  # 与 acks=-1 配合使用
  # 如果 ISR < min.insync.replicas → 抛出 NotEnoughReplicasException
```

---

## 四、Exactly-Once 实现

### 4.1 幂等 Producer

```java
// 开启幂等性
props.put("enable.idempotence", "true");  // Kafka 3.0+ 默认开启
props.put("acks", "all");                 // 幂等必须 acks=all
props.put("retries", Integer.MAX_VALUE);  // 无限重试
props.put("max.in.flight.requests.per.connection", "5");  // ≤5

// 幂等原理：
// 1. Producer 启动时获取 PID（Producer ID）
// 2. 每条消息携带 Sequence Number（递增）
// 3. Broker 端去重：相同 PID + Partition + SequenceNumber → 去重

// PID <Partition> <SequenceNumber> → 消息
//   PID=1   P0     Seq=0    → 写入
//   PID=1   P0     Seq=1    → 写入
//   PID=1   P0     Seq=1    → 重复！Broker 去重，不写入
//   PID=1   P0     Seq=2    → 写入

// 限制：只能保证单 Partition 内幂等，不能跨 Partition
```

### 4.2 事务

```java
// 事务 Producer：跨 Partition 原子写入
props.put("transactional.id", "order-tx-1");  // 事务 ID（必须全局唯一）
props.put("enable.idempotence", "true");

// 使用
KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();  // 初始化事务

try {
    producer.beginTransaction();
    
    // 发送到多个 Partition（原子性）
    producer.send(new ProducerRecord<>("orders", "order-1"));
    producer.send(new ProducerRecord<>("inventory", "stock-1"));
    producer.send(new ProducerRecord<>("notifications", "notify-1"));
    
    // 提交 Consumer Offset（消费+处理+生产原子化）
    producer.sendOffsetsToTransaction(
        Collections.singletonMap(
            new TopicPartition("input-topic", 0),
            new OffsetAndMetadata(lastConsumedOffset + 1)
        ),
        consumer.groupMetadata()
    );
    
    producer.commitTransaction();  // 原子提交
    
} catch (Exception e) {
    producer.abortTransaction();  // 原子回滚
}

// 事务原理：
// 1. Producer 向 Transaction Coordinator 注册事务
// 2. 发送的消息带 transactional.id 标记
// 3. commit/abort 时，Coordinator 写入 TRANSACTON_MARKER
// 4. Consumer 通过 read.isolation.level=read_committed 过滤未提交的消息
```

---

## 五、面试要点

### Q：Kafka 怎么保证消息不丢？

三端保证：
1. Producer：acks=-1（all）+ 重试
2. Broker：min.insync.replicas≥2 + replication.factor≥3
3. Consumer：手动提交 Offset + 幂等消费

acks=-1 时，Leader 等 ISR 全部写入才回复 ACK。如果 ISR < min.insync.replicas 则拒绝写入。这样即使 Leader 挂了，ISR 中的副本都有数据。

### Q：ISR 是什么？怎么动态维护？

ISR（In-Sync Replicas）是与 Leader 保持同步的副本集合。Broker 定期检查每个 Follower 的同步进度，如果 Follower 落后时间超过 replica.lag.time.max.ms，则踢出 ISR。当 Follower 追上 HW 时重新加入 ISR。ISR 动态变化保证 HW 的推进只依赖活跃副本。

### Q：Kafka 的 Exactly-Once 怎么实现？

两层机制：
1. 幂等 Producer：PID + Sequence Number 实现 Single-Partition 幂等
2. 事务：Transaction Coordinator + Two-Phase Commit 实现跨 Partition 原子写入
配合 Consumer 的 read_committed 隔离级别，只消费已提交的消息。消费+处理+生产可以原子化（sendOffsetsToTransaction）。

---

## 六、总结

```
Producer：拦截器→序列化→分区→累加器→Sender→Broker
Consumer：Group Coordinator → JoinGroup → SyncGroup → 分区分配 → poll
ISR：与 Leader 同步的副本集合，动态维护，HW = min(LEO of ISR)
Exactly-Once：幂等（PID+Seq）+ 事务（跨 Partition 原子写入）

可靠性配置：
  acks=-1 + min.insync.replicas=2 + replication.factor=3
```
