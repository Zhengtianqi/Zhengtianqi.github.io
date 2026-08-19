---
title: 分布式锁：从Redis到Zookeeper的选型与实践
date: 2026-09-03
category: 架构设计
tag: ["分布式锁", "Redis", "Zookeeper", "分布式"]
---

# 分布式锁：从Redis到Zookeeper的选型与实践

> 分布式锁是分布式系统中保证互斥访问共享资源的重要机制。
> 本文深入剖析Redis和Zookeeper两种分布式锁的实现原理、对比分析和实战案例，帮助你选择合适的分布式锁方案。

## 一、为什么需要分布式锁

### 1.1 分布式系统并发问题

```
并发问题场景：

┌─────────────────────────────────────────────────────────────┐
│  场景：商品库存扣减                                          │
│                                                             │
│  服务A ──→ 查询库存=100 ──→ 扣减 ──→ 库存=99                 │
│  服务B ──→ 查询库存=100 ──→ 扣减 ──→ 库存=99                 │
│                                                             │
│  问题：两个服务都扣减了，实际库存应该是98                      │
└─────────────────────────────────────────────────────────────┘

解决方案：
├─ 乐观锁：版本号控制
├─ 悲观锁：数据库锁
└─ 分布式锁：跨进程互斥
```

### 1.2 分布式锁要求

| 要求 | 说明 |
|------|------|
| 互斥性 | 同一时刻只有一个客户端持有锁 |
| 防死锁 | 客户端崩溃时锁能自动释放 |
| 容错性 | 锁服务宕机时不影响业务 |
| 可重入 | 同一客户端可多次获取锁 |

## 二、Redis分布式锁

### 2.1 基本实现

```java
// Redis分布式锁实现
@Component
public class RedisDistributedLock {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_TIMEOUT = 30000; // 30秒
    
    /**
     * 获取锁
     */
    public boolean tryLock(String key, String clientId, long timeout) {
        String lockKey = LOCK_PREFIX + key;
        
        // 使用SET NX EX原子操作
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, clientId, timeout, TimeUnit.MILLISECONDS);
        
        return Boolean.TRUE.equals(result);
    }
    
    /**
     * 释放锁
     */
    public boolean releaseLock(String key, String clientId) {
        String lockKey = LOCK_PREFIX + key;
        
        // 使用Lua脚本保证原子性
        String script = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "   return redis.call('del', KEYS[1]) " +
            "else " +
            "   return 0 " +
            "end";
        
        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(lockKey),
            clientId
        );
        
        return Long.valueOf(1L).equals(result);
    }
}
```

### 2.2 Redisson实现

```java
// Redisson分布式锁
@Service
public class RedissonDistributedLock {
    
    @Autowired
    private RedissonClient redisson;
    
    /**
     * 获取锁
     */
    public void executeWithLock(String lockKey, Runnable task) {
        RLock lock = redisson.getLock(lockKey);
        
        try {
            // 尝试获取锁，最多等待3秒，锁持有时间30秒
            if (lock.tryLock(3, 30, TimeUnit.SECONDS)) {
                task.run();
            } else {
                throw new RuntimeException("获取锁失败");
            }
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
    
    /**
     * 可重入锁
     */
    public void executeWithReentrantLock(String lockKey, Runnable task) {
        RLock lock = redisson.getLock(lockKey);
        
        try {
            lock.lock();
            task.run();
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

### 2.3 Redis锁问题

```
Redis锁问题：

1. 锁过期但业务未完成
   ├─ 问题：锁过期后被其他客户端获取
   └─ 解决：使用看门狗机制续期

2. Redis主从切换
   ├─ 问题：主节点宕机，从节点提升为主，锁丢失
   └─ 解决：使用RedLock算法

3. 并发问题
   ├─ 问题：SET NX和EX不是原子操作
   └─ 解决：使用SET key value NX EX命令
```

## 三、Zookeeper分布式锁

### 3.1 基本原理

```
Zookeeper锁原理：

创建临时顺序节点：
├─ /lock/resource-000000001
├─ /lock/resource-000000002
└─ /lock/resource-000000003

获取锁：
├─ 获取/lock下所有子节点
├─ 判断自己是否是最小节点
├─ 是 → 获取锁成功
└─ 否 → 监听前一个节点

释放锁：
├─ 删除自己的节点
├─ 通知下一个节点
└─ 下一个节点获取锁
```

### 3.2 Curator实现

```java
// Curator分布式锁
@Service
public class ZookeeperDistributedLock {
    
    @Autowired
    private CuratorFramework curator;
    
    /**
     * 可重入锁
     */
    public void executeWithLock(String lockKey, Runnable task) {
        InterProcessMutex lock = new InterProcessMutex(curator, "/locks/" + lockKey);
        
        try {
            if (lock.acquire(3, TimeUnit.SECONDS)) {
                task.run();
            } else {
                throw new RuntimeException("获取锁失败");
            }
        } finally {
            try {
                if (lock.isAcquiredInThisProcess()) {
                    lock.release();
                }
            } catch (Exception e) {
                log.error("释放锁失败", e);
            }
        }
    }
    
    /**
     * 读写锁
     */
    public void executeWithReadWriteLock(String lockKey, Runnable readTask, Runnable writeTask) {
        InterProcessReadWriteLock rwLock = new InterProcessReadWriteLock(curator, "/locks/" + lockKey);
        
        try {
            // 读锁
            if (rwLock.acquireReadLock(3, TimeUnit.SECONDS)) {
                readTask.run();
            }
            
            // 写锁
            if (rwLock.acquireWriteLock(3, TimeUnit.SECONDS)) {
                writeTask.run();
            }
        } finally {
            try {
                rwLock.release();
            } catch (Exception e) {
                log.error("释放锁失败", e);
            }
        }
    }
}
```

## 四、Redis vs Zookeeper对比

### 4.1 特性对比

| 特性 | Redis | Zookeeper |
|------|-------|-----------|
| 性能 | 高 | 中 |
| 可用性 | 高 | 中 |
| 一致性 | 最终一致性 | 强一致性 |
| 实现复杂度 | 低 | 中 |
| 锁机制 | 基于SET NX | 临时顺序节点 |
| 自动过期 | 支持 | 会话过期 |

### 4.2 选择建议

```
选择策略：

1. 性能要求高？
   ├─ 是 → Redis
   └─ 否 → 继续

2. 一致性要求高？
   ├─ 是 → Zookeeper
   └─ 否 → 继续

3. 已有Redis集群？
   ├─ 是 → Redis
   └─ 否 → 继续

4. 已有Zookeeper集群？
   ├─ 是 → Zookeeper
   └─ 否 → Redis (部署简单)
```

## 五、RedLock算法

### 5.1 算法原理

```
RedLock算法：

1. 获取当前时间T1
2. 依次向N个Redis实例获取锁
3. 计算获取锁耗时 = 当前时间 - T1
4. 判断：
   ├─ 获取锁数量 > N/2 且 耗时 < 锁过期时间 → 成功
   └─ 否则 → 失败

5. 获取锁失败时，向所有实例发送释放锁命令
```

### 5.2 实现示例

```java
// RedLock实现
@Component
public class RedisRedLock {
    
    private List<RedissonClient> redissonClients;
    
    public void executeWithRedLock(String lockKey, Runnable task) {
        // 获取多个锁
        List<RLock> locks = new ArrayList<>();
        for (RedissonClient client : redissonClients) {
            locks.add(client.getLock(lockKey));
        }
        
        // 尝试获取所有锁
        boolean acquired = false;
        try {
            acquired = tryAcquireAll(locks, 3, TimeUnit.SECONDS);
            
            if (acquired) {
                task.run();
            } else {
                throw new RuntimeException("RedLock获取失败");
            }
        } finally {
            if (acquired) {
                releaseAll(locks);
            }
        }
    }
    
    private boolean tryAcquireAll(List<RLock> locks, long timeout, TimeUnit unit) {
        long deadline = System.nanoTime() + unit.toNanos(timeout);
        
        for (RLock lock : locks) {
            long remaining = deadline - System.nanoTime();
            if (remaining <= 0) {
                return false;
            }
            
            try {
                if (!lock.tryLock(remaining, TimeUnit.NANOSECONDS)) {
                    return false;
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        
        return true;
    }
}
```

## 六、实战案例

### 6.1 库存扣减

```java
@Service
public class InventoryService {
    
    @Autowired
    private RedisDistributedLock lockManager;
    
    public boolean deductStock(String productId, int quantity) {
        String lockKey = "stock:" + productId;
        String clientId = UUID.randomUUID().toString();
        
        try {
            // 获取锁
            if (!lockManager.tryLock(lockKey, clientId, 10000)) {
                throw new RuntimeException("系统繁忙，请稍后重试");
            }
            
            // 扣减库存
            Inventory inventory = inventoryMapper.selectByProductId(productId);
            if (inventory.getStock() < quantity) {
                return false;
            }
            
            inventory.setStock(inventory.getStock() - quantity);
            inventoryMapper.updateStock(productId, inventory.getStock());
            
            return true;
        } finally {
            lockManager.releaseLock(lockKey, clientId);
        }
    }
}
```

### 6.2 分布式任务调度

```java
@Service
public class TaskScheduler {
    
    @Autowired
    private CuratorFramework curator;
    
    public void executeWithLock(String taskId, Runnable task) {
        InterProcessMutex lock = new InterProcessMutex(curator, "/task-locks/" + taskId);
        
        try {
            if (lock.acquire(5, TimeUnit.SECONDS)) {
                task.run();
            }
        } finally {
            try {
                if (lock.isAcquiredInThisProcess()) {
                    lock.release();
                }
            } catch (Exception e) {
                log.error("释放锁失败", e);
            }
        }
    }
}
```

## 七、最佳实践

### 7.1 使用建议

| 建议 | 说明 |
|------|------|
| 设置过期时间 | 避免死锁 |
| 使用看门狗 | 自动续期 |
| 锁粒度合理 | 避免锁冲突 |
| 异常处理 | 确保释放锁 |

### 7.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 锁失效 | 过期时间太短 | 使用看门狗机制 |
| 死锁 | 未释放锁 | try-finally确保释放 |
| 并发问题 | 锁粒度不对 | 调整锁粒度 |

