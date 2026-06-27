---
title: 延迟任务系统：Redis ZSet 与消息队列方案对比
tag: ["架构设计", "Redis", "RabbitMQ", "延迟队列", "分布式"]
category: 架构设计
date: 2026-06-27
---

# 延迟任务系统：Redis ZSet 与消息队列方案对比

> "下单后 30 分钟未支付自动取消"、"会员到期前 3 天发短信提醒"、"预约会议开始前 10 分钟推送通知"——这些都是延迟任务场景。延迟任务系统是后端开发中的常见需求，方案选型却让人纠结。本文对比三种主流方案，帮你做出合适的选择。

## 一、延迟任务场景分析

### 1.1 典型场景

| 场景 | 延迟时间 | 精度要求 | 量级 |
|---|---|---|---|
| 订单超时取消 | 30 分钟 | 分钟级 | 高 |
| 会员到期提醒 | 3 天 | 小时级 | 中 |
| 预约提醒 | 10 分钟 | 分钟级 | 中 |
| 延迟重试 | 指数退避 | 秒级 | 高 |
| 定时推送 | 固定时间点 | 秒级 | 高 |

### 1.2 核心需求

1. **精确触发**：到了时间一定要触发
2. **可靠触发**：不能丢任务
3. **高吞吐**：大量延迟任务并存
4. **可取消**：任务还没执行时可以取消
5. **可修改**：延迟时间可调整

---

## 二、方案一：Redis ZSet（推荐中小规模）

### 2.1 原理

利用 Redis Sorted Set 的特性：以到期时间戳为 score，任务 ID 为 member，按 score 排序。后台线程轮询取出到期的任务执行。

```
ZADD delay:tasks 1719500000 "task:001"   # score = 到期时间戳
ZADD delay:tasks 1719500060 "task:002"
ZADD delay:tasks 1719500120 "task:003"

ZRANGEBYSCORE delay:tasks 0 <当前时间戳>  # 取出到期任务
```

### 2.2 完整实现

#### 任务实体

```java
@Data
public class DelayTask implements Serializable {
    private String taskId;
    private String taskType;       // 任务类型
    private String payload;        // 任务数据 JSON
    private long executeTime;      // 执行时间戳
    private int retryCount;        // 重试次数
    private int maxRetry;          // 最大重试次数
}
```

#### 生产者——添加延迟任务

```java
@Service
public class DelayTaskProducer {

    @Autowired
    private StringRedisTemplate redis;

    private static final String ZSET_KEY = "delay:tasks";
    private static final String TASK_DETAIL_KEY = "delay:task:detail:";  // Hash 存任务详情

    /**
     * 添加延迟任务
     */
    public String addTask(DelayTask task) {
        if (task.getTaskId() == null) {
            task.setTaskId(UUID.randomUUID().toString());
        }
        task.setRetryCount(0);

        // 1. 任务详情存 Hash
        redis.opsForHash().put(TASK_DETAIL_KEY + task.getTaskId(), 
            "data", JSON.toJSONString(task));

        // 2. ZSet 中添加 score = 执行时间
        redis.opsForZSet().add(ZSET_KEY, task.getTaskId(), task.getExecuteTime());

        return task.getTaskId();
    }

    /**
     * 取消任务
     */
    public boolean cancelTask(String taskId) {
        Long removed = redis.opsForZSet().remove(ZSET_KEY, taskId);
        redis.delete(TASK_DETAIL_KEY + taskId);
        return removed != null && removed > 0;
    }

    /**
     * 修改执行时间
     */
    public boolean updateExecuteTime(String taskId, long newExecuteTime) {
        Double score = redis.opsForZSet().score(ZSET_KEY, taskId);
        if (score == null) return false;

        redis.opsForZSet().add(ZSET_KEY, taskId, newExecuteTime);

        // 更新详情
        String detail = (String) redis.opsForHash().get(TASK_DETAIL_KEY + taskId, "data");
        DelayTask task = JSON.parseObject(detail, DelayTask.class);
        task.setExecuteTime(newExecuteTime);
        redis.opsForHash().put(TASK_DETAIL_KEY + taskId, "data", JSON.toJSONString(task));
        
        return true;
    }
}
```

#### 消费者——轮询执行

```java
@Component
public class DelayTaskConsumer {

    @Autowired
    private StringRedisTemplate redis;
    
    @Autowired
    private DelayTaskProducer producer;
    
    @Autowired
    private Map<String, DelayTaskHandler> handlerMap;  // Spring 注入所有处理器

    private static final String ZSET_KEY = "delay:tasks";
    private static final String TASK_DETAIL_KEY = "delay:task:detail:";

    @Scheduled(fixedRate = 1000)  // 每秒扫描一次
    public void scanAndExecute() {
        long now = System.currentTimeMillis();
        
        // 1. 取出到期的任务（最多100个）
        Set<ZSetOperations.TypedTuple<String>> tuples = redis.opsForZSet()
            .rangeByScoreWithScores(ZSET_KEY, 0, now, 0, 100);

        if (tuples == null || tuples.isEmpty()) return;

        for (ZSetOperations.TypedTuple<String> tuple : tuples) {
            String taskId = tuple.getValue();
            
            // 2. 原子移除（防止多消费者重复处理）
            Long removed = redis.opsForZSet().remove(ZSET_KEY, taskId);
            if (removed == null || removed == 0) continue;  // 已被其他消费者取走

            // 3. 获取任务详情
            String detail = (String) redis.opsForHash().get(TASK_DETAIL_KEY + taskId, "data");
            if (detail == null) continue;

            DelayTask task = JSON.parseObject(detail, DelayTask.class);

            // 4. 执行任务
            try {
                DelayTaskHandler handler = handlerMap.get(task.getTaskType());
                if (handler != null) {
                    handler.execute(task);
                }
                // 5. 执行成功，清理详情
                redis.delete(TASK_DETAIL_KEY + taskId);
            } catch (Exception e) {
                log.error("延迟任务执行失败: {}", task, e);
                // 6. 失败重试
                handleRetry(task);
            }
        }
    }

    private void handleRetry(DelayTask task) {
        if (task.getRetryCount() >= task.getMaxRetry()) {
            log.error("任务重试次数耗尽: {}", task);
            redis.delete(TASK_DETAIL_KEY + task.getTaskId());
            // 发送到死信队列
            return;
        }
        task.setRetryCount(task.getRetryCount() + 1);
        // 指数退避
        long delay = (long) Math.pow(2, task.getRetryCount()) * 60 * 1000;
        task.setExecuteTime(System.currentTimeMillis() + delay);
        producer.addTask(task);
    }
}
```

#### 任务处理器接口

```java
public interface DelayTaskHandler {
    String getType();
    void execute(DelayTask task);
}

@Component("orderCancel")
public class OrderCancelHandler implements DelayTaskHandler {
    @Override
    public String getType() { return "orderCancel"; }
    
    @Override
    public void execute(DelayTask task) {
        OrderCancelPayload payload = JSON.parseObject(task.getPayload(), 
            OrderCancelPayload.class);
        orderService.cancelOrder(payload.getOrderId(), "超时未支付自动取消");
    }
}
```

### 2.3 优缺点

| 优点 | 缺点 |
|---|---|
| 实现简单 | 需要轮询，有秒级延迟 |
| 支持任务取消/修改 | 单机内存限制 |
| 精度可调（轮询频率） | 多实例需分布式锁 |
| Redis 天然高性能 | 宕机会丢任务（除非开持久化） |

---

## 三、方案二：RabbitMQ TTL + 死信队列

### 3.1 原理

```
消息 → 正常队列(设置TTL) → 过期 → 死信交换机 → 死信队列 → 消费者
```

消息进入正常队列时设置 TTL，消息过期后通过 DLX（Dead Letter Exchange）转发到死信队列，消费者监听死信队列执行任务。

### 3.2 完整实现

#### 配置

```java
@Configuration
public class RabbitMQConfig {

    // 正常交换机和队列
    public static final String DELAY_EXCHANGE = "delay.exchange";
    public static final String DELAY_QUEUE = "delay.queue";
    
    // 死信交换机和队列
    public static final String DEAD_LETTER_EXCHANGE = "dead.letter.exchange";
    public static final String DEAD_LETTER_QUEUE = "dead.letter.queue";
    public static final String DEAD_LETTER_ROUTING_KEY = "dead.letter.routing.key";

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }

    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(deadLetterQueue())
            .to(deadLetterExchange())
            .with(DEAD_LETTER_ROUTING_KEY);
    }

    @Bean
    public DirectExchange delayExchange() {
        return new DirectExchange(DELAY_EXCHANGE);
    }

    // 正常队列：设置死信路由
    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable(DELAY_QUEUE)
            .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", DEAD_LETTER_ROUTING_KEY)
            .build();
    }

    @Bean
    public Binding delayBinding() {
        return BindingBuilder.bind(delayQueue())
            .to(delayExchange())
            .with("delay.routing.key");
    }
}
```

#### 生产者

```java
@Service
public class DelayTaskProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 发送延迟任务
     * @param payload 任务数据
     * @param delayMillis 延迟毫秒数
     */
    public void sendDelayTask(Object payload, long delayMillis) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.DELAY_EXCHANGE,
            "delay.routing.key",
            JSON.toJSONString(payload),
            message -> {
                // 设置消息 TTL
                message.getMessageProperties().setExpiration(String.valueOf(delayMillis));
                return message;
            }
        );
    }
}
```

#### 消费者

```java
@Component
public class DelayTaskConsumer {

    @RabbitListener(queues = RabbitMQConfig.DEAD_LETTER_QUEUE)
    public void onMessage(String message) {
        try {
            DelayTaskPayload payload = JSON.parseObject(message, DelayTaskPayload.class);
            log.info("收到延迟任务: {}", payload);
            
            // 执行任务
            taskExecutor.execute(payload);
        } catch (Exception e) {
            log.error("延迟任务执行失败: {}", message, e);
            throw new AmqpRejectAndDontRequeueException(e);
        }
    }
}
```

### 3.3 RabbitMQ 延迟消息插件的坑

RabbitMQ 社区提供了 `rabbitmq_delayed_message_exchange` 插件，可以直接发延迟消息：

```java
// 使用插件后，直接设置 x-delay 头
rabbitTemplate.convertAndSend(
    "delayed.exchange",  // 安装插件后的延迟交换机
    "routing.key",
    payload,
    message -> {
        message.getMessageProperties().setHeader("x-delay", delayMillis);
        return message;
    }
);
```

### 3.4 TTL 队列方式的坑——消息阻塞

```
队列中有两条消息：
  消息A: TTL = 60分钟
  消息B: TTL = 1分钟

消息A先入队 → 消息B后入队
RabbitMQ 只检查队头消息 → 消息A没过期 → 消息B即使过期了也不会被移除！
```

**解决方案**：每条消息单独设置 TTL，不用队列级 TTL。或者用延迟消息插件。

### 3.5 优缺点

| 优点 | 缺点 |
|---|---|
| 消息可靠（持久化 + ACK） | TTL 队列有消息阻塞问题 |
| 高吞吐 | 不支持任务取消（消息已发出） |
| 原生重试机制 | 延迟时间不好修改 |
| 分布式天然支持 | 架构较重 |

---

## 四、方案三：时间轮（Hashed Wheel Timer）

### 4.1 原理

时间轮类似时钟：一个环形数组，每个格子代表一个时间刻度。指针按固定速度转动，转到某个格子时执行该格子里的所有任务。

```
时间轮（60格，每格1秒）：
[0] → task1
[1] → 
[2] → task2, task3
...
[59] → taskN

指针每秒走一格，走到 [2] 时执行 task2 和 task3
```

### 4.2 Netty 的 HashedWheelTimer

```java
import io.netty.util.HashedWheelTimer;
import io.netty.util.Timeout;
import io.netty.util.TimerTask;

import java.util.concurrent.TimeUnit;

public class TimeWheelDelayTaskService {

    private final HashedWheelTimer timer = new HashedWheelTimer(
        Executors.defaultThreadFactory(),  // 线程工厂
        1,                                  // tick 持续时间
        TimeUnit.SECONDS,                   // 时间单位
        3600                                // wheel 大小（3600格 = 1小时）
    );

    /**
     * 添加延迟任务
     */
    public Timeout addTask(Runnable task, long delay, TimeUnit unit) {
        return timer.newTimeout(timeout -> {
            try {
                task.run();
            } catch (Exception e) {
                log.error("时间轮任务执行失败", e);
            }
        }, delay, unit);
    }

    /**
     * 取消任务
     */
    public void cancelTask(Timeout timeout) {
        timeout.cancel();
    }
}
```

使用：

```java
// 30分钟后取消订单
Timeout timeout = timerService.addTask(() -> {
    orderService.cancelOrder(orderId, "超时未支付");
}, 30, TimeUnit.MINUTES);

// 用户支付了，取消延迟任务
if (order.isPaid()) {
    timerService.cancelTask(timeout);
}
```

### 4.3 多级时间轮

单个时间轮能表达的延迟范围有限（格子数 × tick 间隔）。要表达更大范围，用多级时间轮：

```
第一级：3600格 × 1秒 = 1小时
第二级：24格 × 1小时 = 1天
第三级：30格 × 1天 = 1月
```

任务先放第一级，第一级转完一圈后把第二级当前格的任务降级到第一级。类似水表的进位机制。

### 4.4 优缺点

| 优点 | 缺点 |
|---|---|
| 性能极高（O(1)） | 单机内存，不持久化 |
| 支持任务取消 | 重启丢失任务 |
| 精度高 | 大范围延迟需要多级时间轮 |
| 无外部依赖 | 不适合分布式场景 |

---

## 五、方案对比与选型

| 维度 | Redis ZSet | RabbitMQ TTL/DLX | 时间轮 |
|---|---|---|---|
| 实现复杂度 | 中 | 高 | 低 |
| 精度 | 秒级（取决于轮询频率） | 秒级 | 毫秒级 |
| 可靠性 | 中（需持久化） | 高（持久化 + ACK） | 低（内存） |
| 可取消 | ✅ | ❌ | ✅ |
| 可修改延迟 | ✅ | ❌ | ❌（需取消重建） |
| 分布式 | ✅ | ✅ | ❌ |
| 吞吐量 | 高 | 很高 | 极高 |
| 适合规模 | 中小规模（万级任务） | 大规模（百万级） | 小规模（单机） |
| 适合场景 | 订单超时、预约提醒 | 海量延迟消息 | 连接超时、重试定时器 |

### 选型建议

```
任务量 < 10万，需要取消/修改 → Redis ZSet
任务量 > 100万，需要高可靠 → RabbitMQ + 延迟插件
单机超高性能，允许丢任务 → 时间轮
```

---

## 六、生产级增强

### 6.1 Redis ZSet 方案的分片

单个 ZSet 的 score 范围太大时性能会下降。按时间分片：

```java
// 按分钟分片
String getShardKey(long executeTime) {
    long minute = executeTime / 60000;
    return "delay:tasks:" + minute;
}

// 添加任务
public String addTask(DelayTask task) {
    String shardKey = getShardKey(task.getExecuteTime());
    redis.opsForZSet().add(shardKey, task.getTaskId(), task.getExecuteTime());
    // 设置过期时间（执行时间 + 1小时后自动清理）
    redis.expire(shardKey, (task.getExecuteTime() - System.currentTimeMillis()) / 1000 + 3600);
    return task.getTaskId();
}

// 扫描：只扫当前分钟的 shard
public void scanAndExecute() {
    long now = System.currentTimeMillis();
    String currentShard = getShardKey(now);
    // ... 扫描 currentShard
}
```

### 6.2 持久化兜底

Redis ZSet 方案中，如果 Redis 宕机会丢任务。用 Redis AOF + RDB 持久化，同时加数据库兜底：

```java
// 添加任务时同时写数据库
@Transactional
public String addTask(DelayTask task) {
    // 1. 写数据库
    delayTaskRepo.save(task);
    // 2. 写 Redis ZSet
    redis.opsForZSet().add(ZSET_KEY, task.getTaskId(), task.getExecuteTime());
    return task.getTaskId();
}

// 启动时从数据库恢复未执行的任务
@PostConstruct
public void recoverTasks() {
    List<DelayTask> pendingTasks = delayTaskRepo
        .findByStatusAndExecuteTimeBefore(TaskStatus.PENDING, new Date());
    for (DelayTask task : pendingTasks) {
        redis.opsForZSet().add(ZSET_KEY, task.getTaskId(), task.getExecuteTime());
    }
    log.info("恢复 {} 个延迟任务", pendingTasks.size());
}
```

### 6.3 监控告警

```java
// 监控延迟任务积压量
@Scheduled(fixedRate = 60000)
public void monitor() {
    Long count = redis.opsForZSet().zCard(ZSET_KEY);
    if (count > 10000) {
        alertService.sendAlert("延迟任务积压: " + count + " 个");
    }
    
    // 监控过期未执行的任务
    long now = System.currentTimeMillis();
    Set<String> overdue = redis.opsForZSet()
        .rangeByScore(ZSET_KEY, 0, now - 60000);  // 1分钟前该执行的
    if (overdue != null && !overdue.isEmpty()) {
        log.warn("过期未执行任务: {} 个", overdue.size());
    }
}
```

---

## 七、避坑指南

| 坑 | 说明 | 解决方案 |
|---|---|---|
| ZSet 轮询空转 | 没有到期任务时持续轮询浪费资源 | 算出最近一个任务的执行时间，sleep 到那时再查 |
| 多消费者重复消费 | 多个实例同时扫描 ZSet | ZREM 原子删除，谁删成功谁执行 |
| RabbitMQ 消息阻塞 | TTL 队列只看队头 | 每条消息单独设 TTL 或用延迟插件 |
| 时间轮丢任务 | 重启内存数据丢失 | 持久化 + 恢复机制 |
| 任务执行超时 | 任务执行时间过长阻塞轮询 | 异步执行 + 线程池 |
| 时区问题 | 服务器时区不一致 | 统一用时间戳 |

---

## 八、面试要点

**Q1：Redis ZSet 实现延迟队列的原理？**

答：以任务 ID 为 member，到期时间戳为 score 存入 ZSet。后台线程每秒调用 `ZRANGEBYSCORE` 取出 score <= 当前时间的任务，用 `ZREM` 原子删除来防止多消费者重复消费。任务详情存在 Hash 中。

**Q2：RabbitMQ 实现延迟队列的两种方式？**

答：1）TTL + DLX：消息设 TTL，过期后通过死信交换机转发到死信队列。注意队列级 TTL 有消息阻塞问题（队头消息没过期，后面的消息即使过期也不会被移除），建议用消息级 TTL。2）延迟消息插件 `rabbitmq_delayed_message_exchange`：直接在交换机层面支持延迟，更简洁。

**Q3：时间轮的原理？适合什么场景？**

答：环形数组 + 定时指针。每个格子存任务列表，指针每 tick 转一格，执行该格子的任务。O(1) 时间复杂度，性能极高。适合大量短延迟任务（如连接超时、心跳检测、重试定时器）。不适合需要持久化的场景。Netty 的 `HashedWheelTimer` 是成熟实现。

**Q4：Redis ZSet 方案怎么保证任务不丢？**

答：1）Redis 开启 AOF 持久化。2）任务同时写数据库，启动时从数据库恢复未执行的任务。3）任务执行成功后再从 Redis 和数据库删除，失败则重试。4）超时未执行的任务有监控告警。

**Q5：如果延迟任务量很大（千万级），怎么扩展？**

答：1）Redis 分片：按时间分片到多个 ZSet，避免单 key 过大。2）用 RabbitMQ + 延迟插件，天然支持高吞吐。3）Kafka + 时间轮：Kafka 做存储，消费者用时间轮做调度。4）专业延迟队列服务：如 QMQ、Beanstalkd。

---

## 总结

延迟任务系统没有银弹，选型要根据实际场景：

- **Redis ZSet**：万级任务，需要取消/修改，中小项目首选
- **RabbitMQ**：百万级任务，高可靠要求，已有 MQ 基础设施
- **时间轮**：单机高性能场景，连接超时/重试定时器

核心设计要点：
1. **可靠性**：任务不能丢，执行失败要重试
2. **幂等性**：任务可能被重复消费，消费端必须幂等
3. **可取消**：订单支付后要取消超时取消任务
4. **监控**：积压告警 + 过期未执行告警

实际项目中，Redis ZSet 是最常用的方案。简单、够用、灵活。等到扛不住了再上 MQ 方案，技术的演进应该是渐进的。
