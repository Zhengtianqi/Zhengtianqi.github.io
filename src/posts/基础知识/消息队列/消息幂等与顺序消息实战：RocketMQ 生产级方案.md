---
title: 消息幂等与顺序消息实战：RocketMQ 生产级方案
tag: ["RocketMQ", "幂等", "顺序消息", "事务消息", "消息可靠性"]
category: 基础知识
date: 2026-07-03
---

# 消息幂等与顺序消息实战：RocketMQ 生产级方案

消息队列三大难题：重复消息、乱序、丢消息。RocketMQ 怎么解决？幂等消费、顺序消息、事务消息——生产级方案一篇讲透。

---

## 一、消息重复原因

```
消息重复的三个来源：

1. Producer 重试
   Producer → Broker：发送消息
   Broker → Producer：ACK（网络丢包）
   Producer → Broker：重试（同一消息发两次）
   → Broker 已写入两条

2. Consumer Rebalance
   Consumer A 消费 msg-1, msg-2（未提交 Offset）
   Rebalance → msg-1, msg-2 分给 Consumer B
   Consumer B 重新消费 msg-1, msg-2
   → 重复消费

3. Consumer 处理成功但 Offset 提交失败
   Consumer 消费 msg-1 → 处理成功 → 提交 Offset 失败
   Consumer 重启 → 从旧 Offset 开始消费
   → msg-1 重复消费

结论：消息重复不可避免，必须在消费端做幂等
```

---

## 二、幂等消费方案

### 2.1 数据库去重表

```java
@Component
@RocketMQMessageListener(topic = "orders", consumerGroup = "order-consumer")
public class OrderConsumer implements RocketMQListener<OrderMessage> {
    
    @Autowired
    private JdbcTemplate jdbc;
    
    @Override
    @Transactional
    public void onMessage(OrderMessage message) {
        // 1. 检查是否已处理（去重表）
        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM msg_consume_log WHERE msg_id = ?",
            Integer.class, message.getMsgId());
        
        if (count > 0) {
            return;  // 已处理，幂等返回
        }
        
        // 2. 业务处理
        orderService.process(message);
        
        // 3. 记录已处理
        jdbc.update(
            "INSERT INTO msg_consume_log(msg_id, consumer, consume_time) VALUES(?, ?, NOW())",
            message.getMsgId(), "order-consumer");
    }
}

-- 去重表
CREATE TABLE msg_consume_log (
    msg_id VARCHAR(64) PRIMARY KEY,
    consumer VARCHAR(128),
    consume_time DATETIME,
    INDEX idx_consume_time (consume_time)
);

-- 问题：每次消费都要查库 + 写库，性能差
-- 优化：定期清理过期记录（如保留 7 天）
```

### 2.2 Redis SETNX 方案

```java
@Override
public void onMessage(OrderMessage message) {
    String key = "msg:consumed:" + message.getMsgId();
    
    // SETNX + 过期时间（原子操作）
    Boolean firstTime = redis.opsForValue()
        .setIfAbsent(key, "1", 7, TimeUnit.DAYS);
    
    if (Boolean.FALSE.equals(firstTime)) {
        return;  // 已处理
    }
    
    try {
        orderService.process(message);
    } catch (Exception e) {
        // 处理失败 → 删除标记，允许重试
        redis.delete(key);
        throw e;
    }
}

// 优势：高性能
// 风险：Redis 宕机可能短暂失效
// 建议：Redis + DB 双保险（Redis 快速过滤 + DB 最终保障）
```

### 2.3 状态机幂等

```java
// 利用业务状态天然幂等
@Override
@Transactional
public void onMessage(OrderMessage message) {
    Order order = orderMapper.selectById(message.getOrderId());
    
    if (order == null) return;
    
    // 状态机检查：只有待支付才能改为已支付
    if ("PENDING".equals(order.getStatus())) {
        order.setStatus("PAID");
        order.setPayTime(LocalDateTime.now());
        orderMapper.updateById(order);
        // 状态变更前先检查 → 天然幂等
    }
    // 如果已经是 PAID → 幂等跳过
}

// 适用场景：订单状态流转、账户状态变更等有状态的业务
```

---

## 三、顺序消息

### 3.1 全局有序 vs 分区有序

```
全局有序：
  只有一个 MessageQueue
  所有消息严格有序
  牺牲并发（一个 Consumer 只能串行消费）
  → 性能极差，几乎不用

分区有序（推荐）：
  同一业务 Key 的消息发到同一 MessageQueue
  同一 MessageQueue 由同一 Consumer 串行消费
  → 同一业务 Key 的消息有序，不同 Key 可并行

  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │ Queue 0 │  │ Queue 1 │  │ Queue 2 │
  │ Order A │  │ Order B │  │ Order C │
  │ A:create│  │ B:create│  │ C:create│
  │ A:pay   │  │ B:pay   │  │ C:pay   │
  │ A:ship  │  │ B:ship  │  │ C:ship  │
  └─────────┘  └─────────┘  └─────────┘
       │              │              │
  Consumer 0    Consumer 1    Consumer 2
  (串行消费)     (串行消费)     (串行消费)

  同一订单的 create→pay→ship 顺序保证
  不同订单之间可以并行处理
```

### 3.2 RocketMQ 顺序生产

```java
// Producer：按业务 Key 选择 MessageQueue
@Component
public class OrderMessageProducer {
    
    @Autowired
    private DefaultMQPushConsumer consumer;
    
    @Autowired
    private DefaultMQProducer producer;
    
    public void sendOrderMessage(OrderEvent event) {
        String orderId = event.getOrderId();
        
        Message msg = new Message(
            "order-topic",
            "create",  // tag
            orderId,   // key
            JSON.toJSONBytes(event)
        );
        
        // MessageQueueSelector：按 orderId 选择 Queue
        SendResult result = producer.send(msg, new MessageQueueSelector() {
            @Override
            public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                String orderId = (String) arg;
                int index = Math.abs(orderId.hashCode()) % mqs.size();
                return mqs.get(index);
            }
        }, orderId);
        // 同一 orderId 的消息总是发到同一 Queue
    }
    
    // 发送同一订单的多个事件
    public void sendOrderLifecycle(Order order) {
        sendOrderMessage(new OrderEvent(order.getId(), "CREATE", order));
        sendOrderMessage(new OrderEvent(order.getId(), "PAY", order));
        sendOrderMessage(new OrderEvent(order.getId(), "SHIP", order));
        // 这三条消息按 orderId hash → 同一 Queue → 有序
    }
}
```

### 3.3 RocketMQ 顺序消费

```java
// Consumer：顺序消费（MessageListenerOrderly）
@Component
@RocketMQMessageListener(
    topic = "order-topic",
    consumerGroup = "order-consumer",
    consumeMode = ConsumeMode.ORDERLY  // 顺序消费（关键！）
)
public class OrderSequentialConsumer implements RocketMQListener<OrderEvent> {
    
    @Override
    public void onMessage(OrderEvent event) {
        // 同一 Queue 的消息串行调用 onMessage
        // 保证顺序：CREATE → PAY → SHIP
        switch (event.getType()) {
            case "CREATE":
                orderService.create(event);
                break;
            case "PAY":
                orderService.pay(event);
                break;
            case "SHIP":
                orderService.ship(event);
                break;
        }
    }
}

// ConsumeMode.CONCURRENTLY（并发消费）vs ORDERLY（顺序消费）：
// CONCURRENTLY：多线程并发消费，可能乱序
// ORDERLY：同一 Queue 串行消费，保证顺序
//   代价：一个消息阻塞 → 后续消息全部等待
//   超时：consumeTimeout 默认 15 分钟
```

### 3.4 顺序消息避坑

```
坑 1：消息重试导致乱序
  消费 msg-1 失败 → 重试 msg-1 → 同时消费 msg-2
  → msg-2 可能先于 msg-1 处理成功
  
  RocketMQ 顺序消费的处理：
    消费失败 → 不继续消费下一条 → 重试当前消息
    → 保证顺序但可能阻塞
  
  建议：消费逻辑尽量不抛异常，失败记录到 DB 异步处理

坑 2：Broker 扩缩容导致 Queue 变化
  Queue 从 4 个变成 8 个 → hash 路由变化
  → 同一 orderId 的消息可能到不同 Queue → 乱序
  
  建议：提前规划 Queue 数量，避免线上扩容
  或在迁移期间双写

坑 3：顺序消费 + 幂等
  顺序消费也可能因为 Rebalance 导致重复
  → 顺序消费也需要幂等
```

---

## 四、事务消息

### 4.1 半消息机制

```
RocketMQ 事务消息流程：

  Producer                Broker              Consumer
     │                       │                    │
     │  1.发送半消息           │                    │
     │ ─────────────────────→ │                    │
     │                       │ (半消息对Consumer不可见) │
     │  2.半消息发送成功        │                    │
     │ ←───────────────────── │                    │
     │                       │                    │
     │  3.执行本地事务          │                    │
     │ (操作数据库等)           │                    │
     │                       │                    │
     │  4.提交/回滚            │                    │
     │ ─────────────────────→ │                    │
     │                       │                    │
     │             (提交→消息可见)                    │
     │                       │ ──────────────────→ │
     │                       │  5.Consumer消费       │
     │                       │                    │
     │  (如果步骤4超时)         │                    │
     │  6.回查本地事务状态       │                    │
     │ ←───────────────────── │                    │
     │  7.返回提交/回滚         │                    │
     │ ─────────────────────→ │                    │

半消息（Half Message）：
  发送到 Broker 但对 Consumer 不可见的消息
  存储在特殊 Topic：RMQ_SYS_TRANS_HALF_TOPIC
  提交后转移到真正的 Topic
```

### 4.2 代码实现

```java
// 事务消息 Producer
@Component
public class OrderTransactionProducer {
    
    @Autowired
    private TransactionMQProducer producer;
    
    public void sendOrderTransaction(Order order) {
        Message msg = new Message(
            "order-topic",
            "transaction",
            order.getId(),
            JSON.toJSONBytes(order)
        );
        
        // 发送事务消息
        producer.sendMessageInTransaction(msg, order);
    }
}

// 事务监听器
@RocketMQTransactionListener
public class OrderTransactionListener implements RocketMQLocalTransactionListener {
    
    @Autowired
    private OrderService orderService;
    
    /**
     * 执行本地事务（半消息发送成功后调用）
     */
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(
            Message msg, Object arg) {
        Order order = (Order) arg;
        
        try {
            // 执行本地事务（写数据库）
            orderService.createOrder(order);
            // 本地事务成功 → 提交半消息
            return RocketMQLocalTransactionState.COMMIT;
        } catch (Exception e) {
            // 本地事务失败 → 回滚半消息
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }
    
    /**
     * 事务回查（Broker 未收到提交/回滚时调用）
     */
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
        String orderId = msg.getKeys();
        
        // 查询本地事务是否成功
        Order order = orderService.findById(orderId);
        
        if (order != null && "CREATED".equals(order.getStatus())) {
            // 订单已创建 → 提交
            return RocketMQLocalTransactionState.COMMIT;
        } else if (order != null) {
            // 订单状态异常 → 回滚
            return RocketMQLocalTransactionState.ROLLBACK;
        } else {
            // 订单不存在 → 未知（Broker 会继续回查）
            return RocketMQLocalTransactionState.UNKNOWN;
        }
    }
}
```

### 4.3 事务消息 vs 本地消息表

```
事务消息（RocketMQ）：
  优势：不需要额外建表，框架级保证
  劣势：与 RocketMQ 强耦合，回查需要业务实现

本地消息表（通用方案）：
  优势：与 MQ 无关，任何 MQ 都可用
  劣势：需要建表 + 定时任务扫描

本地消息表方案：
  1. 本地事务：业务操作 + 写消息表（同一个事务）
  2. 定时任务：扫描消息表，发送到 MQ
  3. 发送成功：更新消息状态
  4. 消费端：幂等消费

-- 本地消息表
CREATE TABLE local_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    biz_id VARCHAR(64) NOT NULL,
    topic VARCHAR(128) NOT NULL,
    body TEXT NOT NULL,
    status TINYINT DEFAULT 0,  -- 0=待发送 1=已发送
    retry_count INT DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME
);
```

---

## 五、消息可靠性三重保障

### 5.1 生产端不丢

```java
// 1. 同步发送 + 重试
producer.setRetryTimesWhenSendFailed(3);
SendResult result = producer.send(msg);
if (result.getSendStatus() != SendStatus.SEND_OK) {
    // 处理发送失败
    throw new RuntimeException("Send failed: " + result.getSendStatus());
}

// 2. 异步发送 + 回调
producer.send(msg, new SendCallback() {
    @Override
    public void onSuccess(SendResult result) { }
    
    @Override
    public void onException(Throwable e) {
        // 发送失败 → 落库 + 定时重试
        saveToRetryTable(msg);
    }
});
```

### 5.2 Broker 不丢

```
# Broker 配置
# 刷盘方式
flushDiskType=SYNC_FLUSH       # 同步刷盘（性能差但安全）
# ASYNC_FLUSH                  # 异步刷盘（默认，性能好但宕机可能丢）

# 主从同步
brokerRole=SYNC_MASTER         # 同步主从（Master 等Slave写完才返回）
# ASYNC_MASTER                 # 异步主从（默认）

# 推荐配置（可靠性优先）：
flushDiskType=SYNC_FLUSH + brokerRole=SYNC_MASTER
# 性能优先：
flushDiskType=ASYNC_FLUSH + brokerRole=ASYNC_MASTER
```

### 5.3 消费端不丢

```java
// 消费成功后再提交 Offset（手动提交）
@Component
@RocketMQMessageListener(topic = "orders", consumerGroup = "order-consumer")
public class OrderConsumer implements RocketMQListener<OrderMessage> {
    
    @Override
    @Transactional
    public void onMessage(OrderMessage message) {
        try {
            // 1. 业务处理
            orderService.process(message);
            // 2. 处理成功 → 方法正常返回 → 自动 ACK
        } catch (Exception e) {
            // 3. 处理失败 → 抛异常 → 不 ACK → 稍后重试
            throw e;
        }
    }
}

// 消费失败的重试策略
// maxReconsumeTimes=16  // 最多重试 16 次
// 重试间隔：1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
// 16 次后进入死信队列
```

---

## 六、面试要点

### Q：消息重复消费怎么解决？

消息重复不可避免（网络重试、Rebalance、Offset 提交失败），消费端做幂等：
1. 去重表：消费前查 msg_consume_log，存在则跳过
2. Redis SETNX：消费前 setIfAbsent，失败则跳过
3. 状态机：业务状态检查（PENDING→PAID），已处理则跳过
推荐：Redis 快速过滤 + DB 最终保障

### Q：RocketMQ 顺序消息怎么实现？

生产端：用 MessageQueueSelector 按 业务 Key（如 orderId）hash 选择 Queue，保证同一 Key 的消息到同一 Queue。
消费端：ConsumeMode.ORDERLY 串行消费同一 Queue，保证顺序。
注意：顺序消费 + 消费失败重试会阻塞后续消息，需要异步处理失败逻辑。顺序消费也需要幂等。

### Q：RocketMQ 事务消息原理？

两阶段：1. 发送半消息（对 Consumer 不可见）2. 执行本地事务后提交/回滚。
如果超时未提交，Broker 回查 Producer 本地事务状态（checkLocalTransaction），根据结果决定提交或回滚。
保证：本地事务 + 消息发送的原子性（要么都成功，要么都失败）。

---

## 七、总结

```
幂等三方案：去重表 / Redis SETNX / 状态机
顺序消息：MessageQueueSelector（生产端）+ ConsumeMode.ORDERLY（消费端）
事务消息：半消息 + 本地事务 + 回查
可靠性：同步刷盘 + 同步主从 + 手动 ACK + 重试 + 死信队列

生产配置建议：
  生产端：同步发送 + 重试 3 次
  Broker：同步刷盘 + 同步主从
  消费端：手动 ACK + 幂等消费 + 死信处理
```
