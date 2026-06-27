---
title: 分布式锁深度对比：Redis、ZooKeeper 与 etcd 三种实现选型
tag: ["分布式锁", "Redis", "ZooKeeper", "etcd"]
category: 分布式
date: 2026-06-27
---

# 分布式锁深度对比：Redis、ZooKeeper 与 etcd 三种实现选型

单机锁用 synchronized，分布式锁用什么？Redis RedLock？ZooKeeper 临时节点？etcd Lease？选错了就是生产事故。

---

## 一、三种实现的核心原理

### Redis 分布式锁

```
SET key value NX PX 30000
  NX: 不存在才设置（互斥）
  PX: 过期时间（防死锁）
  value: 唯一标识（防误删）

释放锁：Lua 脚本保证"判断+删除"原子性
```

### ZooKeeper 分布式锁

```
创建临时顺序节点 /lock/node-0001
  临时：Session 断开自动删除（防死锁）
  顺序：ZK 自动编号

加锁：自己是序号最小的节点 → 获得锁
等待：监听前一个节点的删除事件 → 前一个释放后自己获得锁
```

### etcd 分布式锁

```
Lease + TXN（事务）
  Grant Lease（TTL 防死锁）
  TXN: IF key 不存在 THEN PUT key WITH Lease ELSE 失败
  
续约：KeepAlive 定期续约
释放：Revoke Lease 或删除 key
```

---

## 二、核心维度对比

| 维度 | Redis | ZooKeeper | etcd |
|------|-------|-----------|------|
| 一致性 | AP（最终一致） | CP（强一致） | CP（强一致） |
| 可用性 | 高 | 中（半数以上可用） | 高 |
| 性能 | 极高（10万+ QPS） | 中（万级 QPS） | 高（万级 QPS） |
| 锁安全性 | 有极端情况不安全 | 安全 | 安全 |
| 客户端复杂度 | 低 | 中 | 中 |
| 运维成本 | 低 | 高 | 中（K8s 已自带） |
| 适合场景 | 高并发、容忍极小概率不安全 | 强一致要求高 | K8s 环境已有 etcd |

### 锁安全性详解

```
Redis 的极端不安全场景：
1. Client A 获得锁（key=lock, PX=10s）
2. Client A GC STW 15 秒
3. 锁过期，Client B 获得锁
4. Client A 恢复，执行 del lock → 删掉了 B 的锁！
5. Client C 也能获得锁 → 两个客户端同时持锁

解决：
- value 用 UUID，释放时 Lua 脚本校验 value
- 但 GC STW 场景仍然会导致锁过期后"以为"还持有锁

ZooKeeper / etcd 不会有这个问题：
- 临时节点/Lease 在 Session 活着时不会过期
- Session 心跳维持，GC STW 不会导致锁丢失（只要 Session 超时 > STW 时间）
```

---

## 三、Redis 分布式锁实战

### 3.1 Redisson 实现（推荐）

```java
// Redisson 封装了锁续约（Watchdog），比手写 SET NX 安全得多
@Configuration
public class RedissonConfig {
    @Bean
    public RedissonClient redisson() {
        Config config = new Config();
        config.useClusterServers()
            .addNodeAddress("redis://node1:6379", "redis://node2:6379")
            .setLockWatchdogTimeout(30000);  // Watchdog 超时 30s
        return Redisson.create(config);
    }
}

@Service
public class OrderService {
    @Autowired
    private RedissonClient redisson;
    
    public void deductStock(Long productId, int quantity) {
        RLock lock = redisson.getLock("stock:lock:" + productId);
        try {
            // tryLock：等待 5 秒，锁自动释放 30 秒（配合 Watchdog 自动续约）
            if (lock.tryLock(5, 30, TimeUnit.SECONDS)) {
                int stock = productMapper.getStock(productId);
                if (stock < quantity) {
                    throw new BusinessException("库存不足");
                }
                productMapper.deductStock(productId, quantity);
            } else {
                throw new BusinessException("系统繁忙，请重试");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("获取锁中断");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

### 3.2 Watchdog 机制

```
Redisson Watchdog（看门狗）：
1. 获得锁后，默认 30 秒过期
2. 后台线程每 10 秒检查一次，如果锁还被当前线程持有，续约到 30 秒
3. 如果线程崩溃（JVM 挂掉），Watchdog 停止续约，锁 30 秒后自动释放

关键：不用手动设过期时间，让 Watchdog 自动管理
// 正确：不设 leaseTime，启用 Watchdog
lock.tryLock(5, -1, TimeUnit.SECONDS);  // -1 表示启用 Watchdog
// 错误：设了 leaseTime，Watchdog 不启用
lock.tryLock(5, 10, TimeUnit.SECONDS);  // 10 秒后强制释放，不续约
```

---

## 四、ZooKeeper 分布式锁实战

### 4.1 Curator 实现

```java
// Apache Curator 封装了 ZK 分布式锁
@Configuration
public class ZkConfig {
    @Bean
    public InterProcessMutex zkLock() {
        CuratorFramework client = CuratorFrameworkFactory.builder()
            .connectString("zk1:2181,zk2:2181,zk3:2181")
            .sessionTimeoutMs(30000)
            .connectionTimeoutMs(10000)
            .retryPolicy(new ExponentialBackoffRetry(1000, 3))
            .build();
        client.start();
        return new InterProcessMutex(client, "/locks/stock");
    }
}

@Service
public class OrderService {
    @Autowired
    private InterProcessMutex zkLock;
    
    public void deductStock(Long productId, int quantity) throws Exception {
        try {
            // 尝试获取锁，等待 5 秒
            if (zkLock.acquire(5, TimeUnit.SECONDS)) {
                int stock = productMapper.getStock(productId);
                if (stock < quantity) {
                    throw new BusinessException("库存不足");
                }
                productMapper.deductStock(productId, quantity);
            } else {
                throw new BusinessException("获取锁超时");
            }
        } finally {
            if (zkLock.isAcquiredInThisProcess()) {
                zkLock.release();
            }
        }
    }
}
```

---

## 五、etcd 分布式锁实战

### 5.1 jetcd 实现

```java
@Configuration
public class EtcdConfig {
    @Bean
    public Lock etcdLock() {
        Client client = Client.builder()
            .endpoints("http://etcd1:2379", "http://etcd2:2379")
            .build();
        return client.getLockClient();
    }
}

@Service
public class OrderService {
    @Autowired
    private Lock etcdLock;
    @Autowired
    private Client etcdClient;
    
    public void deductStock(Long productId, int quantity) throws Exception {
        // 1. 创建 Lease（TTL 30 秒）
        long leaseId = etcdClient.getLeaseClient().grant(30).get().getID();
        
        try {
            // 2. 尝试获取锁
            ByteSequence lockKey = ByteSequence.from("stock/lock/" + productId, StandardCharsets.UTF_8);
            etcdLock.lock(lockKey, leaseId).get(5, TimeUnit.SECONDS);
            
            // 3. 业务逻辑
            int stock = productMapper.getStock(productId);
            if (stock < quantity) {
                throw new BusinessException("库存不足");
            }
            productMapper.deductStock(productId, quantity);
            
        } finally {
            // 4. 释放锁
            etcdLock.unlock(ByteSequence.from("stock/lock/" + productId, StandardCharsets.UTF_8)).get();
            // 5. 撤销 Lease
            etcdClient.getLeaseClient().revoke(leaseId).get();
        }
    }
}
```

---

## 六、选型决策

```
已有 Redis 且对极端情况下偶尔不安全可接受？
  → Redis + Redisson（性能最高，运维最简单）

需要绝对安全的锁（金融场景）？
  → ZooKeeper（CP 强一致，不会丢锁）

已有 K8s 环境（自带 etcd）？
  → etcd（不用额外引入 ZK）

对性能要求极高（10万+ TPS）？
  → Redis（其他两个达不到这个量级）

锁等待时间要求短（<100ms）？
  → Redis（ZK 和 etcd 的共识协议延迟更高）
```

---

## 七、常见陷阱

### 7.1 Redis 锁的常见错误

```java
// ❌ 错误1：没有过期时间（死锁风险）
jedis.set("lock", "1");  // 如果进程崩溃，锁永远不释放

// ❌ 错误2：释放锁不校验 value（误删别人的锁）
jedis.del("lock");  // 可能删掉了其他客户端的锁

// ❌ 错误3：设了 leaseTime 但业务执行超时
lock.tryLock(5, 10, TimeUnit.SECONDS);  // 10秒后锁释放，但业务还在执行
// 此时其他客户端获得锁，两个客户端同时操作

// ✅ 正确：用 Redisson + Watchdog
lock.tryLock(5, -1, TimeUnit.SECONDS);  // 启用 Watchdog 自动续约
```

### 7.2 锁粒度问题

```java
// ❌ 锁粒度太粗（并发度低）
RLock lock = redisson.getLock("global:lock");  // 全局锁，所有请求排队

// ❌ 锁粒度太细（一致性无法保证）
RLock lock1 = redisson.getLock("stock:" + productId);
RLock lock2 = redisson.getLock("stock:" + productId + ":detail");
// 两个锁，可能出现部分一致性问题

// ✅ 合理粒度
RLock lock = redisson.getLock("stock:" + productId);  // 按商品维度加锁
```

### 7.3 锁与事务的顺序

```java
// ❌ 错误：先开事务再加锁
@Transactional
public void deductStock(Long productId, int quantity) {
    RLock lock = redisson.getLock("stock:" + productId);
    lock.lock();
    try {
        // 事务还没提交，锁就释放了
        // 其他线程读到的是旧数据
    } finally {
        lock.unlock();  // 先释放锁，事务才提交 → 超卖！
    }
}

// ✅ 正确：先加锁再开事务（锁在事务外）
public void deductStock(Long productId, int quantity) {
    RLock lock = redisson.getLock("stock:" + productId);
    lock.lock();
    try {
        doInTransaction(productId, quantity);  // 事务在锁内
    } finally {
        lock.unlock();  // 事务已提交，再释放锁
    }
}
```

---

## 八、面试要点

### Q：Redis 分布式锁安全吗？

不完全安全。极端情况下（GC STW 导致锁过期）会出现多个客户端同时持锁。但用 Redisson + Watchdog 机制可以大幅降低风险。如果业务对一致性要求极高（如金融），应该用 ZooKeeper 或 etcd。

### Q：Redisson 的 Watchdog 原理？

获得锁后启动一个定时任务（每 10 秒执行一次），检查当前线程是否还持有锁，如果是则续约到 30 秒。如果 JVM 崩溃，定时任务停止，锁 30 秒后自动释放。关键前提：不手动设置 leaseTime（设了就不启用 Watchdog）。

### Q：分布式锁和数据库锁怎么选？

- **单机并发**：synchronized / ReentrantLock
- **分布式并发，性能优先**：Redis 锁
- **分布式并发，一致性优先**：ZK / etcd 锁
- **简单场景**：数据库乐观锁（version 字段）或悲观锁（SELECT FOR UPDATE）

---

## 九、总结

分布式锁三板斧：

| 方案 | 一句话 | 适用 |
|------|--------|------|
| Redis + Redisson | 性能最高，极小概率不安全 | 99% 的互联网场景 |
| ZooKeeper Curator | 强一致，绝对安全 | 金融、交易 |
| etcd | K8s 原生，不用额外引入 | 云原生项目 |

记住：**锁在事务外，释放看 value，续约用 Watchdog**。
