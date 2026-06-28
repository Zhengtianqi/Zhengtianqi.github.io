---
title: Kafka 进阶：深入理解分区、事务与 exactly-once
date: 2026-06-11
category: 消息队列
tag: ["Kafka", "分区", "事务", "exactly-once", "ISR"]
---

# Kafka 进阶：深入理解分区、事务与 exactly-once

> 消息队列是分布式系统中解耦和异步处理的核心组件，它为系统提供了可靠的消息传递机制。
> 本文介绍了消息队列的核心概念和使用场景，帮助你构建松耦合的分布式系统。

Kafka Topic 被划分为多个 Partition（分区），每个 Partition 是一个**有序的、不可变的消息序列**。

```
Topic: order-events (3 分区)

Partition 0: [msg0] [msg3] [msg6] [msg9] ...
Partition 1: [msg1] [msg4] [msg7] ...
Partition 2: [msg2] [msg5] [msg8] ...

关键特性：
- 每个分区内部严格有序
- 不同分区之间无序
- 消息写入分区后不可修改
- 每个分区有唯一的 Leader
```

### 1.2 Offset 与 Segment

每个分区的消息都有一个唯一的 **Offset**（偏移量），从 0 开始递增：

```
Partition 0:
┌──────────────────────────────────────────────────────┐
│ offset: 0      offset: 1      offset: 2      ...    │
│ [msg-A    ]    [msg-B    ]    [msg-C    ]           │
│ timestamp      timestamp      timestamp             │
└──────────────────────────────────────────────────────┘
```

分区在磁盘上被切分为多个 **Segment** 文件：

```
Partition 0 的磁盘布局：

/var/kafka-logs/order-events-0/
├── 00000000000000000000.log       # Segment 1: offset 0-99999
├── 00000000000000000000.index     # offset 索引
├── 00000000000000000000.timeindex # 时间索引
├── 00000000000000100000.log       # Segment 2: offset 100000-199999
├── 00000000000000100000.index
└── 00000000000000100000.timeindex

为什么用 Segment？
- 便于日志清理（直接删除整个 Segment 文件）
- 提高查找效率（二分查找 Segment，再二分查找 Segment 内的消息）
- 控制单个文件大小
```

### 1.3 生产者分区策略

消息被写入哪个分区由生产者决定：

```java
// 策略 1：指定 Key，按 Key Hash 分区（最常用）
kafkaTemplate.send("order-events",
    order.getOrderId().toString(),  // Key → 同一个订单的所有消息进入同一个分区
    event
);

// 策略 2：不指定 Key，轮询/随机
kafkaTemplate.send("order-events", event);
// 消息均匀分布到所有分区

// 策略 3：指定分区（跳过分区策略）
kafkaTemplate.send("order-events", 2, null, event);
// 强制写入分区 2

// 策略 4：自定义分区器
public class CustomerIdPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        String customerId = (String) key;
        // 高优先级客户 → 分区 0-1（SSD 磁盘）
        if (isVipCustomer(customerId)) {
            return Math.abs(customerId.hashCode()) % 2;
        }
        // 普通客户 → 分区 2-5（HDD 磁盘）
        return 2 + Math.abs(customerId.hashCode()) % 4;
    }
}
```

**选择分区策略的原则**：
- 需要顺序保证 → 指定 Key（同一 Key 进入同一分区）
- 需要均匀负载 → 不指定 Key（轮询）
- 需要定制路由 → 自定义 Partitioner

## 第二部分：ISR 机制

### 2.1 什么是 ISR

ISR（In-Sync Replicas）：与 Leader 保持同步的副本集合。

```
Topic: order-events, 分区 0, 副本因子 3

    ┌─────────────────────┐
    │    Leader (Broker 1)│  ← 所有读写
    │    offset: 10200    │
    └─────────┬───────────┘
              │ 复制
    ┌─────────┼───────────┐
    │         ▼           │
    │  ┌─────────────┐    │
    │  │Follower     │    │  ISR = [Broker 1, Broker 2]
    │  │(Broker 2)   │    │  (Broker 3 滞后太多，被踢出 ISR)
    │  │offset: 10200│    │
    │  └─────────────┘    │
    │                     │
    │  ┌─────────────┐    │
    │  │Follower     │    │
    │  │(Broker 3)   │    │  ← 已落后 500 条消息
    │  │offset: 9700 │    │
    │  └─────────────┘    │
    └─────────────────────┘
```

**ISR 的意义**：只有 ISR 中的副本才有资格被选为新的 Leader。如果 Leader 宕机，Kafka 从 ISR 中选择一个新 Leader，保证**数据不丢失**。

### 2.2 ISR 的判定标准

```properties
# 关键配置参数

# Follower 向 Leader 发送 Fetch 请求的超时时间
# 如果超过此时间 Follower 没有请求，Leader 会将其踢出 ISR
replica.lag.time.max.ms=30000  # 默认 30 秒

# Follower 最多落后 Leader 的消息数（0.9 之前使用，现已废弃）
# replica.lag.max.messages=4000

# 最小 ISR 数量
# 生产重要数据时设置为 2 以上，保证至少还有 1 个备份
min.insync.replicas=2
```

### 2.3 acks 参数与 ISR 的关系

`acks` 是控制消息持久化可靠性的最重要的生产者参数：

```yaml
# Spring Kafka 生产者配置
spring:
  kafka:
    producer:
      # acks=0: 不等待确认，发送即认为成功
      # 最快，但消息可能丢失
      acks: 0

      # acks=1: Leader 写入成功即返回
      # 平衡性能和可靠性（默认）
      acks: 1

      # acks=all (-1): 所有 ISR 确认后才返回
      # 最可靠，但延迟最高
      acks: all
```

```java
// 不同的可靠性保证
// acks=0: 消息可能丢失
producer.send(record);  // 不等确认，消息可能在网络传输中丢失

// acks=1: Leader 确认即可
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // Leader 写入失败，但可能 Follower 也未同步 → 数据丢失风险
        log.error("发送失败", exception);
    }
});

// acks=all: 最强保证
producer.send(record, (metadata, exception) -> {
    // 所有 ISR 副本确认写入
    // 只要有一个 ISR 副本存活，消息就不会丢
});
```

**金融场景的推荐配置**：
```properties
acks=all
min.insync.replicas=2      # 最少 2 个 ISR
replication.factor=3       # 3 副本
unclean.leader.election.enable=false  # 不允许非 ISR 副本成为 Leader
```

## 第三部分：幂等生产者

### 3.1 为什么需要幂等生产者

在没有幂等性的情况下，生产者重试可能导致消息重复：

```
生产者                    Kafka
  │                        │
  │──── msg-A ────────────→│ 写入成功
  │                        │
  │←──── ack ──────────────│ ← 网络故障，ack 丢失！
  │                        │
  │──── msg-A (重试) ─────→│ 写入成功（但重复了！）
  │                        │
  │←──── ack ──────────────│
```

### 3.2 幂等生产者的原理

启用幂等生产者后，Kafka 为每个生产者分配一个 **Producer ID (PID)**，并为每条消息分配一个 **Sequence Number**：

```
幂等生产者工作流程：

1. 初始化时，Broker 分配 PID=1024
2. 生产者给每个分区的消息递增 Sequence Number：
   Partition 0: seq=0, seq=1, seq=2, ...
   Partition 1: seq=0, seq=1, seq=2, ...
3. Broker 维护每个 <PID, Topic, Partition> 的最近 5 个 seq
4. 如果收到 seq 小于 lastSeq → 重复消息，丢弃
5. 如果收到 seq 大于 lastSeq+1 → 乱序，报错
```

```java
// 启用幂等生产者
@Configuration
public class KafkaConfig {
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        // 启用幂等性（自动设置 acks=all, retries=Integer.MAX_VALUE, max.in.flight.requests.per.connection=5）
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(props);
    }
}
```

**幂等生产者的局限性**：
- 仅在单个 Producer Session 内保证幂等（PID 重启后会变）
- 不能跨 Topic 和跨 Partition 保证幂等
- 不能保证消费者端的 exactly-once

## 第四部分：Kafka 事务

### 4.1 事务的作用

Kafka 事务解决的是**跨分区的原子写入**问题：

```
场景：订单创建需要写入 3 条消息到 3 个不同分区

没有事务：
  消息 1 → Partition 0 ✓ (写入成功)
  消息 2 → Partition 1 ✓ (写入成功)
  消息 3 → Partition 2 ✗ (写入失败！)
  → 消费者看到不完整的数据

有事务：
  消息 1 → Partition 0 ┐
  消息 2 → Partition 1 ├── 原子操作
  消息 3 → Partition 2 ┘
  → 要么全部可见，要么全部不可见
```

### 4.2 事务 API

```java
/**
 * Kafka 事务生产者示例
 * 保证跨分区的原子写入
 */
@Service
public class TransactionalOrderService {

    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional  // 注意：这是 Spring 的 @Transactional，不是 Kafka 事务
    public void createOrder(Order order) {
        // 1. 先保存数据库
        orderRepository.save(order);

        // 2. 发送 Kafka 消息（在 Kafka 事务中）
        kafkaTemplate.executeInTransaction(operations -> {
            // 消息 1: 订单创建事件 → Partition 0
            operations.send("order-events",
                order.getId(), new OrderCreatedEvent(order));

            // 消息 2: 库存扣减事件 → Partition 1
            operations.send("inventory-events",
                order.getId(), new InventoryDeductEvent(order));

            // 消息 3: 通知事件 → Partition 2
            operations.send("notification-events",
                order.getId(), new OrderNotificationEvent(order));

            return true;
        });
        // 三消息原子提交，消费者要么全看到，要么全看不到
    }
}
```

```java
// 另一种写法：使用 @Transactional
@Service
public class OrderService {

    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional  // Kafka 事务
    public void processOrder(Order order) {
        kafkaTemplate.send("order-events", new OrderCreatedEvent(order));
        kafkaTemplate.send("inventory-events", new InventoryDeductEvent(order));
        // 方法结束时自动提交事务
    }
}
```

### 4.3 事务的隔离级别

Kafka 事务提供了两种隔离级别：

```properties
# 消费者隔离级别配置

# read_uncommitted（默认）：可以读到未提交事务的消息
isolation.level=read_uncommitted

# read_committed：只能读到已提交事务的消息
isolation.level=read_committed
```

```java
// read_committed 模式下的消费者
@Bean
public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
        ConsumerFactory<String, String> consumerFactory) {
    ConcurrentKafkaListenerContainerFactory<String, String> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);

    // 只消费已提交事务的消息
    factory.getContainerProperties().set IsolationLevel(
        ContainerProperties.IsolationLevel.READ_COMMITTED);

    return factory;
}
```

**read_committed 的代价**：如果有事务未提交（长事务），当前消费者会一直被阻塞，直到事务提交或超时。需要通过 `transaction.timeout.ms` 控制事务超时时间。

## 第五部分：Exactly-Once 语义

### 5.1 三种语义定义

| 语义 | 含义 | 实现难度 |
|------|------|---------|
| At-Most-Once | 最多一次，可能丢失 | 最容易（acks=0） |
| At-Least-Once | 至少一次，可能重复 | 中等（acks=all + 重试） |
| Exactly-Once | 精确一次，不丢不重 | 最难（幂等+事务+offset管理） |

### 5.2 Kafka 内部的 Exactly-Once

Kafka 内部的 exactly-once 语义指的是：**从 Kafka 读取 → 处理 → 写回 Kafka** 整个过程的精确一次。

```
场景：从 topic-A 消费 → 转换 → 写入 topic-B

Without exactly-once:
  1. Consumer 从 topic-A 读取消息
  2. 处理消息
  3. Producer 写入 topic-B
  4. Consumer 提交 offset
  → 如果步骤 4 失败，重启后会重复消费步骤 2-3 的消息

With exactly-once:
  1. Consumer 从 topic-A 读取消息
  2. 处理消息
  3. Producer 写入 topic-B（事务中）
  4. Consumer 提交 offset（同一事务中）
  → 步骤 3 和 4 原子化，要么都成功，要么都回滚
```

### 5.3 Spring Kafka 的 Exactly-Once 实现

```java
@Configuration
@EnableKafka
public class ExactlyOnceConfig {

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        // 启用事务 ID（幂等性自动启用）
        props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-tx-");
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

/**
 * Exactly-once 消费者：消费 → 处理 → 写回 Kafka
 */
@Component
public class ExactlyOnceOrderProcessor {

    @Autowired private KafkaTemplate<String, Object> kafkaTemplate;

    @KafkaListener(topics = "order-requests", groupId = "order-processor")
    @Transactional  // 开启 Kafka 事务
    public void process(@Payload OrderRequest request,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {

        // 1. 处理消息
        Order order = orderProcessor.process(request);

        // 2. 写入结果到 Kafka
        kafkaTemplate.send("order-results", order.getId().toString(), order);

        // 3. Consumer Offset 自动提交在同一事务中
        // offset 提交和消息写入是原子的
    }
}
```

### 5.4 端到端 Exactly-Once 的完整方案

真正生产环境中，"Kafka 到 Kafka"的 exactly-once 不够用。大部分场景是"Kafka → 数据库 → 其他系统"。

**Kafka + 数据库的 End-to-End Exactly-Once**：

```java
/**
 * 使用"发件箱模式 (Outbox Pattern)" + Kafka Connect
 * 实现 Kafka 到数据库的 exactly-once
 */

// Step 1: 业务数据和消息在同一个数据库事务中写入
@Service
public class OrderOutboxService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OutboxRepository outboxRepository;

    @Transactional  // 数据库事务，不是 Kafka 事务！
    public void createOrder(CreateOrderCommand command) {
        // 1. 保存订单
        Order order = orderRepository.save(command.toOrder());

        // 2. 在同一事务中写入发件箱表
        OutboxMessage message = OutboxMessage.builder()
            .aggregateType("Order")
            .aggregateId(order.getId().toString())
            .eventType("OrderCreated")
            .payload(toJson(OrderCreatedEvent.from(order)))
            .status("PENDING")
            .build();
        outboxRepository.save(message);

        // 订单和发件箱消息在同一事务中提交
        // → 要么都成功，要么都失败
    }
}

// Step 2: Debezium Kafka Connect 监听发件箱表的 binlog
// 自动将发件箱消息发送到 Kafka（保证 exactly-once）
// Debezium 配置：
// {
//   "connector.class": "io.debezium.connector.mysql.MySqlConnector",
//   "table.include.list": "mydb.outbox",
//   ...
// }

// Step 3: 消费者处理消息（实现幂等）
@Component
public class InventoryHandler {
    @KafkaListener(topics = "mydb.outbox", groupId = "inventory-group")
    public void handle(OutboxMessage message) {
        // 幂等处理（消息可能重复投递）
        if (processedMessageRepository.exists(message.getId())) {
            return;
        }
        // 处理业务
        inventoryService.process(message);
        processedMessageRepository.save(message.getId());
    }
}
```

## 第六部分：消费者 Rebalance 机制

### 6.1 Rebalance 触发的场景

Rebalance 是消费者组的重新均衡过程，触发条件：

```
1. 消费者组成员变更（加入/离开）
2. Topic 分区数变更（增加分区）
3. 订阅的 Topic 变更（正则匹配到新 Topic）
```

### 6.2 Rebalance 的影响

```
正常消费：
  Consumer 1: [P0, P1]  ← 分配了分区
  Consumer 2: [P2, P3]

Consumer 2 挂掉：
  → Rebalance 触发
  → 所有消费者暂停消费（Stop-The-World!）
  → Coordinator 重新分配分区
  → Consumer 1: [P0, P1, P2, P3]  ← 接管全部

影响：
  - 消费暂停（通常几秒到几十秒）
  - 消费延迟增加
  - 可能导致重复消费（如果 offset 提交不及时）
```

### 6.3 如何减少 Rebalance 的影响

```java
/**
 * 优化消费者配置，减少不必要的 Rebalance
 */
@Bean
public Map<String, Object> consumerConfigs() {
    Map<String, Object> props = new HashMap<>();

    // 1. 增加 session.timeout.ms（默认 45s，设大一点）
    // 消费者与 Coordinator 之间的心跳超时
    props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 60000);

    // 2. 设置 heartbeat.interval.ms（默认 3s）
    // 心跳间隔，必须小于 session.timeout.ms
    props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10000);

    // 3. 增加 max.poll.interval.ms（默认 5 分钟）
    // 两次 poll 之间的最大间隔，超过则触发 Rebalance
    // 如果业务处理时间较长，务必调大
    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 600000);

    // 4. 减少单次拉取的消息数
    props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);

    // 5. 使用 Cooperative Sticky 分区策略（Kafka 2.4+）
    // 渐进式 Rebalance，不需要全部暂停
    props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
        "org.apache.kafka.clients.consumer.CooperativeStickyAssignor");

    return props;
}
```

**Cooperative Rebalance vs Eager Rebalance**：

```
Eager（默认，0.10.x-2.3.x）：
  Consumer 1: [P0, P1, P2]  →  全部释放  →  [P0, P1]
  Consumer 2: [P3, P4, P5]  →  全部释放  →  [P2, P3, P4, P5]
  所有分区短暂停止消费

Cooperative（2.4+推荐）：
  Consumer 1: [P0, P1, P2]  →  只释放 P2  →  [P0, P1]
  Consumer 2: [P3, P4, P5]  →  接受 P2   →  [P2, P3, P4, P5]
  只有 P2 短暂停止消费，其他分区继续
```

## 第七部分：调优参数

### 7.1 生产者关键参数

```yaml
spring:
  kafka:
    producer:
      # 可靠性（金融场景）
      acks: all
      enable-idempotence: true
      retries: 5

      # 吞吐量
      batch-size: 16384          # 16KB，攒够后批量发送
      linger-ms: 10              # 等待 10ms，让批次更大
      buffer-memory: 33554432   # 32MB 发送缓冲区

      # 压缩
      compression-type: snappy   # snappy 是吞吐和压缩率的平衡点

      # 连接
      max-request-size: 1048576  # 1MB 最大请求
      request-timeout-ms: 30000
```

**参数调优口诀**：
- 要**快**（低延迟）→ `linger.ms=0`, `batch.size` 小一点
- 要**大**（高吞吐）→ `linger.ms` 调大, `batch.size` 调大
- 要**稳**（高可靠）→ `acks=all`, `enable.idempotence=true`, `retries` 多

### 7.2 Broker 端关键参数

```properties
# 日志保留
log.retention.hours=168       # 保留 7 天
log.segment.bytes=1073741824  # 1GB 一个 Segment

# 副本
default.replication.factor=3
min.insync.replicas=2

# 不允许脏选举
unclean.leader.election.enable=false

# 消息大小
message.max.bytes=1048576     # 1MB
replica.fetch.max.bytes=1048576

# 压缩
compression.type=producer     # 保留生产者压缩格式
```

### 7.3 消费者关键参数

```yaml
spring:
  kafka:
    consumer:
      # 消费策略
      auto-offset-reset: latest    # 从最新开始
      enable-auto-commit: false    # 手动提交 offset
      max-poll-records: 100        # 每次最多拉 100 条

      # 可靠性
      isolation-level: read_committed  # 只读已提交事务的消息
```

```java
// 手动提交 offset（推荐）
@KafkaListener(topics = "order-events", groupId = "order-group")
public void onMessage(ConsumerRecord<String, OrderEvent> record,
                      Acknowledgment ack) {
    try {
        processEvent(record.value());
        ack.acknowledge();  // 处理成功后再提交 offset
    } catch (Exception e) {
        log.error("处理失败，offset 不提交，下次 poll 时重新消费", e);
        // 不调用 ack，消息会重新投递
    }
}
```

## 总结

### 核心概念速查表

| 概念 | 一句话解释 | 关键配置 |
|------|-----------|---------|
| **分区** | Topic 的逻辑分片，分区内有序 | Key Hash 决定分区 |
| **Offset** | 消息在分区内的唯一位置 | 消费者提交 offset |
| **ISR** | 与 Leader 保持同步的副本集合 | `min.insync.replicas` |
| **幂等生产者** | 同一 Producer Session 内消息不重复 | `enable.idempotence=true` |
| **Kafka 事务** | 跨分区原子写入 | `transactional.id` |
| **Exactly-Once** | 消费-处理-生产的完整一次语义 | 事务+幂等+Outbox |
| **Rebalance** | 消费者组分区重分配 | Cooperative 策略 |

### Kafka 可靠性递进

```
Level 1: 基本可靠
  acks=1 + retries=3

Level 2: 生产者幂等
  acks=all + enable.idempotence=true

Level 3: 事务消息
  幂等 + transactional.id + isolation.level=read_committed

Level 4: 端到端 Exactly-Once
  事务 + Outbox Pattern + Kafka Connect
```

**大多数场景到 Level 2 就够了**，金融交易到 Level 3-4。

## 参考资料

1. Apache Kafka 官方文档
2. Confluent, "Exactly-Once Semantics in Kafka"
3. Jay Kreps, "Kafka: The Definitive Guide"
