---
title: Redisson 分布式锁源码解析：看门狗、可重入与红锁争议
tag: ["Redis", "Redisson", "分布式锁", "源码", "看门狗"]
category: 数据库
date: 2026-07-03
---

# Redisson 分布式锁源码解析：看门狗、可重入与红锁争议

SETNX 做分布式锁太简陋？Redisson 才是生产级方案。看门狗自动续期、Hash 结构实现可重入、Lua 脚本保证原子性——从源码级别彻底搞懂 Redisson 分布式锁。

---

## 一、SETNX 方案的问题

```
基础 SETNX 方案：

SET lock:order:123 1 NX EX 30  # 加锁（30s 过期）

问题：
  1. 业务执行超过 30s → 锁自动释放 → 其他线程获取锁 → 并发问题
  2. 线程 A 超时释放锁 → 线程 B 获取锁 → 线程 A 执行完删除锁 → 删了 B 的锁
  3. 不可重入：同一线程再次获取锁会失败
  4. 无法等待：获取失败只能轮询
  5. 无公平性

Redisson 解决方案：
  1. 看门狗（Watchdog）→ 自动续期
  2. UUID:threadId 标识 → 不会删错锁
  3. Hash 结构 → 可重入
  4. Pub/Sub → 通知等待
  5. 公平锁支持
```

---

## 二、Redisson 加锁源码

### 2.1 加锁流程

```java
// Redisson 加锁入口
RLock lock = redisson.getLock("lock:order:123");
lock.lock();  // 或 lock.lock(30, TimeUnit.SECONDS)

// 源码跟踪：RedissonLock.lock()
public void lock() {
    try {
        lock(-1, null, null);  // leaseTime=-1 表示启动看门狗
    } catch (InterruptedException e) {
        throw new IllegalStateException();
    }
}

// 核心方法：tryAcquire
private RFuture<Boolean> tryAcquireAsync(long leaseTime, TimeUnit unit, long threadId) {
    if (leaseTime != -1) {
        // 指定了过期时间 → 不启动看门狗
        return tryLockInnerAsync(leaseTime, unit, threadId, RedisCommands.EVAL_NULL_BOOLEAN);
    }
    
    // 未指定过期时间 → 先加锁（30s），然后启动看门狗
    RFuture<Boolean> ttlRemainingFuture = tryLockInnerAsync(
        commandExecutor.getConnectionManager().getCfg().getLockWatchdogTimeout(),
        TimeUnit.MILLISECONDS, threadId, RedisCommands.EVAL_NULL_BOOLEAN);
    
    ttlRemainingFuture.onComplete((ttlRemaining, e) -> {
        if (e == null && ttlRemaining) {
            // 加锁成功 → 启动看门狗
            scheduleExpirationRenewal(threadId);
        }
    });
    return ttlRemainingFuture;
}
```

### 2.2 加锁 Lua 脚本

```lua
-- tryLockInnerAsync 的 Lua 脚本（简化）

-- 参数：
--   KEYS[1] = 锁的名称 "lock:order:123"
--   ARGV[1] = 过期时间 30000（ms）
--   ARGV[2] = 客户端ID:线程ID "uuid:threadId"

-- 1. 锁不存在 → 创建 Hash，设置重入计数=1，设置过期时间
if (redis.call('exists', KEYS[1]) == 0) then
    redis.call('hset', KEYS[1], ARGV[2], 1);     -- Hash: {field=uuid:threadId, value=1}
    redis.call('pexpire', KEYS[1], ARGV[1]);      -- 过期时间 30s
    return nil;
end;

-- 2. 锁存在且是当前线程持有 → 重入计数+1
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);   -- 重入计数+1
    redis.call('pexpire', KEYS[1], ARGV[1]);       -- 续期 30s
    return nil;
end;

-- 3. 锁被其他线程持有 → 返回剩余过期时间（毫秒）
return redis.call('pttl', KEYS[1]);

-- 为什么用 Hash 而不是 String？
--   String: 只能存一个值，无法记录持有者
--   Hash:   field=uuid:threadId（持有者标识），value=重入次数
--   → 天然支持可重入
```

### 2.3 数据结构

```
Redis 中锁的数据结构：

  Key: "lock:order:123"
  Type: Hash
  Value: {
    "9e3f72-4b8a-4a2e-9f1c-6d7e8f:1": 2   ← field=UUID:threadId, value=重入次数
  }
  TTL: 30000ms

  解读：
    锁被线程 "9e3f72...:1" 持有
    重入 2 次（调用了 2 次 lock()，需要 2 次 unlock()）
    30 秒后自动过期（看门狗会续期）
```

---

## 三、看门狗（Watchdog）机制

### 3.1 原理

```
看门狗工作流程：

  时间线：
  0s    ──→ 加锁成功（过期时间 30s）
  10s   ──→ 看门狗第一次续期（重置为 30s）
  20s   ──→ 看门狗第二次续期（重置为 30s）
  30s   ──→ 看门狗第三次续期（重置为 30s）
  ...     （每 10s 续期一次，只要线程还活着）
  
  业务完成 → unlock() → 看门狗停止
  线程崩溃 → 看门狗停止 → 30s 后锁自动释放

续期间隔 = lockWatchdogTimeout / 3 = 30000 / 3 = 10000ms（10s）
```

### 3.2 源码

```java
// 看门狗核心：ExpirationRenewal
private void scheduleExpirationRenewal(long threadId) {
    // 创建 RenewalTask
    Timeout task = commandExecutor.getConnectionManager().newTimeout(new TimerTask() {
        @Override
        public void run(Timeout timeout) throws Exception {
            // 续期 Lua 脚本
            RFuture<Boolean> future = renewExpirationAsync(threadId);
            future.onComplete((res, e) -> {
                if (e == null && res) {
                    // 续期成功 → 安排下一次续期
                    scheduleExpirationRenewal(threadId);  // 递归调用
                }
                // 续期失败（锁不存在/已释放）→ 停止看门狗
            });
        }
    }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);
    // internalLockLeaseTime = 30000ms
    // 续期间隔 = 30000 / 3 = 10000ms
}
```

```lua
-- 续期 Lua 脚本
-- KEYS[1] = 锁名称
-- ARGV[1] = 过期时间 30000
-- ARGV[2] = uuid:threadId

if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    -- 锁还在且是当前线程持有 → 续期
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return 1;
end;
-- 锁不存在或不是当前线程的 → 不续期
return 0;
```

### 3.3 看门狗注意事项

```java
// ⚠️ 注意：只有不指定 leaseTime 才启动看门狗
lock.lock();                        // ✅ 启动看门狗
lock.lock(30, TimeUnit.SECONDS);    // ❌ 不启动看门狗（30s 后自动释放）

// ⚠️ 看门狗不能替代 unlock
// 看门狗只是防止业务未完成时锁过期
// 业务完成后必须 unlock()，否则看门狗会一直续期

// ⚠️ 看门狗依赖客户端存活
// 客户端进程崩溃 → 看门狗停止 → 锁 30s 后自动释放
// 这是期望行为：防止死锁

// 推荐实践
RLock lock = redisson.getLock("lock:order:123");
try {
    // 不指定过期时间 → 看门狗自动续期
    if (lock.tryLock(10, TimeUnit.SECONDS)) {  // 最多等 10s 获取锁
        // 业务逻辑
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();  // 一定要在 finally 中释放
    }
}
```

---

## 四、释放锁源码

```lua
-- unlock Lua 脚本
-- KEYS[1] = 锁名称
-- KEYS[2] = 频道名 "redisson_lock__channel:lock:order:123"
-- ARGV[1] = 通知消息 0（表示锁已释放）
-- ARGV[2] = 过期时间 30000
-- ARGV[3] = uuid:threadId

-- 1. 锁不存在或不是当前线程的 → 返回 null
if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then
    return nil;
end;

-- 2. 重入计数-1
local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1);

if (counter > 0) then
    -- 还有重入 → 只续期，不删除
    redis.call('pexpire', KEYS[1], ARGV[2]);
    return 0;
else
    -- 重入计数归零 → 删除锁 + 通知等待线程
    redis.call('del', KEYS[1]);
    redis.call('publish', KEYS[2], ARGV[1]);  -- Pub/Sub 通知
    return 1;
end;
```

---

## 五、RedLock 算法与争议

### 5.1 RedLock 算法

```
RedLock：多 Redis 实例的分布式锁

  假设有 5 个独立的 Redis 实例（不是集群/主从）

  1. 获取当前时间 T1
  2. 依次向 5 个 Redis 实例发送 SET NX（加锁请求）
     每个请求设置很短的超时（如 50ms）
  3. 获取当前时间 T2
  4. 如果成功获取 ≥ 3 个（N/2+1）锁，且 T2-T1 < 锁有效期
     → 加锁成功
  5. 否则 → 向所有实例发送 DEL（释放锁）

  为什么要多数？→ 容错：2 个实例宕机也不影响
  
  为什么要独立实例？→ 避免主从同步延迟导致的锁丢失
```

### 5.2 RedLock 的争议

```
Martin Kleppmann（《DDIA》作者）的批评：

1. 时钟漂移问题
   RedLock 依赖各节点时钟一致性
   如果某节点时钟跳变 → 锁提前过期 → 多个客户端同时持锁
   NTP 同步不保证精确同步

2. GC 暂停问题
   客户端获取锁后 → STW GC 暂停几秒 → 锁过期
   → 其他客户端获取锁 → 两个客户端同时持锁
   
3. 网络延迟
   获取锁后网络分区 → 锁过期 → 其他客户端获取锁

antirez（Redis 作者）的回应：
  - 时钟问题可通过运维手段缓解
  - GC 暂停问题所有分布式锁都存在
  - RedLock 比 Redis 主从方案更可靠

结论：
  - 需要绝对正确的分布式锁 → 用 ZooKeeper/etcd（Raft 共识）
  - 接受极小概率错误 → Redis 单实例 + Redisson 足够
  - RedLock 复杂且收益有限 → 不推荐
```

---

## 六、Redisson 其他锁类型

```java
// 1. 公平锁
RLock fairLock = redisson.getFairLock("fairLock");
fairLock.lock();  // 按请求顺序获取锁

// 2. 读写锁
RReadWriteLock rwLock = redisson.getReadWriteLock("rwLock");
rwLock.readLock().lock();   // 读锁（共享）
rwLock.writeLock().lock();  // 写锁（排他）

// 3. 联锁（MultiLock）
RLock lock1 = redisson1.getLock("lock1");
RLock lock2 = redisson2.getLock("lock2");
RLock lock3 = redisson3.getLock("lock3");
RLock multiLock = redisson.getMultiLock(lock1, lock2, lock3);
multiLock.lock();  // 同时获取 3 把锁才算成功

// 4. 红锁（RedLock）— 已标记 @Deprecated
// RLock redLock = redisson.getRedLock(lock1, lock2, lock3);
// redLock.lock();

// 5. 信号量
RSemaphore semaphore = redisson.getSemaphore("semaphore");
semaphore.trySetPermits(3);  // 3 个许可
semaphore.acquire();          // 获取许可
semaphore.release();          // 释放许可

// 6. 闭锁
RCountDownLatch latch = redisson.getCountDownLatch("latch");
latch.trySetCount(3);  // 等待 3 个完成
latch.countDown();
latch.await();
```

---

## 七、面试要点

### Q：Redisson 看门狗原理？

只有调用 `lock()` 不指定过期时间时才启动看门狗。加锁时设置 30s 过期，看门狗每 10s（30/3）检查锁是否还被当前线程持有，如果是则续期到 30s。看门狗通过定时任务递归调用实现，续期成功则安排下一次续期，续期失败则停止。线程崩溃后看门狗停止，锁 30s 后自动释放，防止死锁。

### Q：Redisson 怎么实现可重入？

用 Hash 结构存储锁信息：field = `UUID:threadId`（持有者标识），value = 重入次数。加锁时如果 Hash 中已有当前线程的 field，则 value+1 并续期。释放锁时 value-1，归零则删除锁。整个过程用 Lua 脚本保证原子性。

### Q：RedLock 为什么有争议？

Martin Kleppmann 指出三个问题：1. 时钟漂移导致锁提前过期 2. GC 暂停导致客户端不知锁已过期 3. 网络分区同理。antirez 回应说时钟问题可运维解决，GC 问题是所有分布式锁的通病。结论：需要绝对正确用 ZooKeeper/etcd，接受极小概率错误用 Redis 单实例 + Redisson，RedLock 复杂且收益有限不推荐。

---

## 八、总结

```
Redisson 分布式锁核心：
  加锁：Lua 脚本 + Hash 结构（支持可重入）
  续期：看门狗每 10s 自动续期（不指定 leaseTime 时）
  解锁：Lua 脚本 + 重入计数-1 + Pub/Sub 通知
  等待：Pub/Sub 订阅锁释放通知（不轮询）

锁类型：可重入锁 / 公平锁 / 读写锁 / 联锁 / 信号量 / 闭锁
RedLock：多实例多数派，有时钟争议，不推荐

生产建议：
  - 用 lock() 不指定过期时间（看门狗续期）
  - tryLock 设置等待超时
  - finally 中 unlock
  - 判断 isHeldByCurrentThread 避免释放非自己持有的锁
```
