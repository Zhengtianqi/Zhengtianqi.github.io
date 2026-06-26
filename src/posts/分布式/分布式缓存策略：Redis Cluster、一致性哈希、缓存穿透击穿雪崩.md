---
title: 分布式缓存策略：Redis Cluster、一致性哈希、缓存穿透/击穿/雪崩
tag: ["Redis", "分布式缓存", "一致性哈希", "缓存设计"]
category: 分布式
date: 2026-06-25
---

# 分布式缓存策略：Redis Cluster、一致性哈希、缓存穿透/击穿/雪崩

## 前言

Redis 几乎成了所有后端项目的标配组件，从简单的 KV 存储到分布式缓存，从消息队列到流处理，它的角色越来越多样。但当单机 Redis 无法满足需求时，分布式缓存就登场了。

本文将系统性地梳理分布式缓存的核心问题：Redis Cluster 的架构原理、一致性哈希算法、以及实战中最头疼的缓存穿透、击穿、雪崩三大问题及其解决方案。这些不是面试题，而是我在实际项目中真金白银踩过的坑。

---

## 一、单机 Redis 的瓶颈

### 1.1 为什么需要分布式？

单机 Redis 的瓶颈通常在三个方面：

1. **内存容量**：单台物理机的内存有限（通常 64GB-512GB），缓存量到了瓶颈
2. **连接数**：Redis 是单线程模型，一个连接就是一个线程上下文，单机连接数通常限制在 10000 左右
3. **吞吐量**：虽然单节点 QPS 能达到 5-10 万，但面对亿级用户的系统，远远不够

以担保业务系统为例：我们有 2000 万注册企业用户，每个用户平均缓存 10 条数据，加上业务相关的热点数据，总缓存量可能超过 200GB，单机 Redis 完全不够。

### 1.2 常见的分布式方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 客户端分片 | 简单、性能高 | 扩容需要手动迁移、客户端逻辑复杂 | 数据分布均匀的简单场景 |
| 代理分片（Twemproxy） | 客户端无感知 | 代理成为瓶颈、增加延迟 | 中小规模 |
| Redis Cluster | 去中心化、自动扩容 | 有一定迁移开销、客户端需要支持 Cluster 协议 | 生产环境推荐 |

---

## 二、Redis Cluster 架构深度解析

### 2.1 什么是 Redis Cluster？

Redis Cluster 是 Redis 官方提供的分布式解决方案，从 3.0 版本开始引入。它具备以下特性：

- **数据分片**：使用 16384 个 hash slot 进行数据分配
- **高可用**：主从复制 + 故障自动转移
- **去中心化**：每个节点都持有部分数据，无中心节点

### 2.2 Hash Slot 机制

Redis Cluster 将数据分成 16384 个 slot，每个 slot 负责一部分数据范围：

```
slot 0        slot 1        slot 5460   slot 5461   slot 10922   slot 10923   slot 16383
|-------------|-------------|-----------|-----------|------------|------------|
  Node A              Node A          Node B              Node C
```

**如何确定 key 落在哪个 slot？**

```java
// Redis 内部使用 CRC16 算法计算
int slot = CRC16(key) % 16384;

// Spring Data Redis 示例
@Autowired
private StringRedisTemplate redisTemplate;

// 在 Cluster 模式下，key 会自动计算 slot
redisTemplate.opsForValue().set("user:123:profile", "data");
// "user:123:profile" 会被计算到某个 slot，路由到对应节点
```

**关键点**：如果你的 key 中包含变量部分（如 `user:{123}:profile`），可以使用 `{}` 指定 hash tag：

```java
// {123} 确保同一用户的所有 key 都落在同一个 slot
redisTemplate.opsForValue().set("user:{123}:profile", "data");
redisTemplate.opsForValue().set("user:{123}:orders", "data");
// 这两个 key 都在同一个 slot，可以做 Lua 脚本的原子操作
```

### 2.3 主从复制与故障转移

每个主节点可以有一个或多个从节点：

```
Node A (Master, slots 0-5460)  -->  Node A-Slave1
Node B (Master, slots 5461-10922)  -->  Node B-Slave1
Node C (Master, slots 10923-16383)  -->  Node C-Slave1
```

**故障转移流程**：

1. 多个从节点发现主节点不可达（主观下线）
2. 超过半数从节点确认主节点不可达（客观下线）
3. 选举一个从节点提升为主节点
4. 接管原主节点的 slot

```java
// 配置 Redis Cluster
spring:
  redis:
    cluster:
      nodes:
        - 192.168.1.10:6379
        - 192.168.1.11:6379
        - 192.168.1.12:6379
      max-redirects: 3  # 最大重定向次数
    lettuce:
      cluster:
        refresh:
          adaptive: true  # 自动刷新拓扑
```

### 2.4 扩容与数据迁移

**扩容流程**：

1. 新增节点加入 Cluster
2. 使用 `redis-trib` 工具重新分配 slot
3. 后台异步迁移数据（不阻塞业务请求）

```bash
# 添加新节点
redis-cli --cluster add-node 192.168.1.13:6379 192.168.1.10:6379

# 重新分配 slot（每个节点均匀分配）
redis-cli --cluster reshard 192.168.1.10:6379 \
  --cluster-from all \
  --cluster-to <new-node-id> \
  --cluster-slots 5461 \
  --cluster-yes
```

**关键点**：迁移过程中，集群仍然可写，但部分请求可能会返回 `MOVED` 或 `ASK` 重定向响应，客户端需要处理这些错误并自动重试。

---

## 三、一致性哈希算法

### 3.1 为什么需要一致性哈希？

在简单的取模分片中，增加或删除一个节点会导致大量 key 失效。例如：

```
节点数 3: key.hash() % 3 = 0, 1, 2
节点数 4: key.hash() % 4 = 0, 1, 2, 3  ← 大量 key 需要重新分配！
```

取模分片的缺点是：**节点变化时，约 (N-1)/N 的数据需要迁移**。

### 3.2 一致性哈希原理

一致性哈希将 2^32 个整数映射到一个圆环上：

```
        +------------------+
       /                    \
      |   0              2^32  |
       \                    /
        +------------------+
          A              B   C
          ↑             ↑    ↑
       节点A          节点B  节点C

key 落在哪个区间，就归属哪个节点
```

**算法逻辑**：

```java
public class ConsistentHash {
    private final SortedMap<Integer, String> circle = new TreeMap<>();
    private final int virtualNodeCount = 150; // 虚拟节点数

    // 添加真实节点
    public void addNode(String node) {
        for (int i = 0; i < virtualNodeCount; i++) {
            int hash = hash("VNODE:" + node + ":" + i);
            circle.put(hash, node);
        }
    }

    // 获取节点
    public String getNode(String key) {
        int hash = hash(key);
        SortedMap<Integer, String> tailMap = circle.tailMap(hash);
        Integer nextKey = tailMap.isEmpty() ? circle.firstKey() : tailMap.firstKey();
        return circle.get(nextKey);
    }

    private int hash(String key) {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(key.getBytes());
        return ((digest[3] & 0xFF) << 24) | ((digest[2] & 0xFF) << 16)
             | ((digest[1] & 0xFF) << 8) | (digest[0] & 0xFF);
    }
}
```

**虚拟节点的作用**：

| 虚拟节点数 | 数据均匀度 | 内存开销 | 推荐值 |
|-----------|-----------|---------|--------|
| 10 | 较差 | 低 | 小规模 |
| 100 | 良好 | 中 | 中等规模 |
| 150-300 | 优秀 | 高 | 生产环境推荐 |

### 3.3 一致性哈希 vs 取模分片

| 场景 | 取模分片 | 一致性哈希 |
|------|---------|-----------|
| 节点增加 1 个 | ~N% 数据迁移 | ~1/N 数据迁移 |
| 节点删除 1 个 | ~N% 数据迁移 | ~1/N 数据迁移 |
| 数据分布 | 均匀（取决于 key 分布） | 依赖虚拟节点数 |
| 实现复杂度 | 简单 | 中等 |

在 Redis Cluster 中，官方选择了 hash slot 方案而不是一致性哈希，主要是因为在 16384 个 slot 的场景下，数据迁移是可控的，而且可以更精确地分配数据。

---

## 四、缓存三大问题：穿透、击穿、雪崩

这是面试高频题，但更重要的是，它们在生产中是真能搞死系统的。

### 4.1 缓存穿透

**问题**：查询**不存在**的数据，每次都直接打到数据库。

```
请求 1: key="user:-1"  → 缓存未命中 → 数据库查询 → 无数据
请求 2: key="user:-1"  → 缓存未命中 → 数据库查询 → 无数据
请求 3: key="user:-1"  → ...
```

如果攻击者大量请求不存在的 key，数据库会被打挂。

**解决方案**：

**方案一：缓存空值**

```java
public String getUser(int userId) {
    String cacheKey = "user:" + userId;
    String value = redisTemplate.opsForValue().get(cacheKey);
    if (value != null) {
        if (value.equals("")) {  // 空值标记
            return null;
        }
        return value;
    }
    // 查询数据库
    User user = userMapper.selectById(userId);
    if (user == null) {
        // 缓存空值，过期时间设短一些（5 分钟）
        redisTemplate.opsForValue().set(cacheKey, "", 5, TimeUnit.MINUTES);
        return null;
    }
    // 缓存真实数据，过期时间设长一些（30 分钟）
    redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
    return user;
}
```

**方案二：布隆过滤器（Bloom Filter）**

```java
@Component
public class BloomFilterUtil {
    private BloomFilter<String> userBloomFilter;

    @PostConstruct
    public void init() {
        // 预计元素数量 2000 万，错误率 0.01
        userBloomFilter = BloomFilter.create(
            Funnels.stringFunnel(Charsets.UTF_8),
            20_000_000,
            0.01
        );
        // 初始化时将所有有效的 userId 加入布隆过滤器
        List<Integer> userIds = userMapper.selectAllUserIds();
        for (Integer id : userIds) {
            userBloomFilter.put(String.valueOf(id));
        }
    }

    public boolean mightContain(int userId) {
        return userBloomFilter.mightContain(String.valueOf(userId));
    }
}

// 使用
public String getUser(int userId) {
    if (!bloomFilter.mightContain(userId)) {
        return null;  // 布隆过滤器说不存在，大概率真的不存在
    }
    // 继续走缓存逻辑...
}
```

布隆过滤器的特点：
- **不存在**：一定能准确判断
- **存在**：有一定误判率（比如 1%）
- **空间效率极高**：2000 万数据，误率 1%，仅需约 19MB

### 4.2 缓存击穿

**问题**：某个**热点 key** 过期瞬间，大量并发请求同时打到数据库。

```
t=0:    缓存中有数据 ✅
t=1:    key 过期 ❌
t=2:    1000 个请求同时到达 → 全部查数据库 💥
```

与穿透的区别：穿透查的是**不存在**的数据，击穿查的是**存在但过期**的数据。

**解决方案：互斥锁（互斥重建）**

```java
public String getUser(int userId) {
    String cacheKey = "user:" + userId;
    String value = redisTemplate.opsForValue().get(cacheKey);
    if (value != null) {
        return value;
    }
    // 缓存过期，使用分布式锁重建缓存
    String lockKey = "lock:" + cacheKey;
    boolean locked = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
    if (locked) {
        try {
            // 双重检查：锁内再检查一次缓存
            value = redisTemplate.opsForValue().get(cacheKey);
            if (value != null) {
                return value;
            }
            // 查询数据库
            User user = userMapper.selectById(userId);
            if (user != null) {
                redisTemplate.opsForValue().set(cacheKey, 
                    JSON.toJSONString(user), 30, TimeUnit.MINUTES);
                return JSON.toJSONString(user);
            }
            return null;
        } finally {
            redisTemplate.delete(lockKey);  // 释放锁
        }
    } else {
        // 其他线程在重建，等待后重试
        try { Thread.sleep(50); } catch (InterruptedException e) {}
        return getUser(userId);  // 递归重试
    }
}
```

**方案二：逻辑过期（不推荐简单场景使用）**

```java
public class LogicalExpire<T> {
    private T data;
    private LocalDateTime expireTime;
    private boolean refreshLock;  // 是否需要刷新
}

// 缓存时存储逻辑过期时间
public void setWithLogicalExpire(String key, T value, 
        long time, TimeUnit unit) {
    LogicalExpire<T> expireData = new LogicalExpire<>();
    expireData.setData(value);
    expireData.setExpireTime(LocalDateTime.now().plus(time, unit.toChronoUnit()));
    expireData.setRefreshLock(false);
    redisTemplate.opsForValue().set(key, JSON.toJSONString(expireData));
}
```

逻辑过期方案适用于**读多写少**的热点数据，可以在后台异步刷新，用户无感知。

### 4.3 缓存雪崩

**问题**：大量 key **同时过期**，或者 Redis 集群**整体宕机**。

```
t=0:    1000 个 key 同时过期
t=1:    全部请求打到数据库 💥
```

或者更糟糕的情况：Redis 集群宕机，所有请求都打到数据库。

**解决方案**：

**方案一：过期时间加随机值**

```java
// 基础过期时间 + 随机偏移量（±5 分钟）
long baseExpire = 30 * 60;  // 30 分钟
long randomOffset = ThreadLocalRandom.current().nextLong(-5 * 60, 5 * 60);
long actualExpire = baseExpire + randomOffset;
redisTemplate.opsForValue().set(key, value, Math.max(0, actualExpire), TimeUnit.SECONDS);
```

**方案二：多层缓存**

```
客户端本地缓存 → Caffeine（1 分钟） → Redis 集群（30 分钟） → 数据库
```

```java
@Component
public class MultiLevelCacheService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private UserMapper userMapper;
    
    // 本地缓存（Caffeine）
    private Cache<String, String> localCache = Caffeine.newBuilder()
        .maximumSize(10000)
        .expireAfterWrite(1, TimeUnit.MINUTES)
        .build();

    public String getUser(int userId) {
        String cacheKey = "user:" + userId;
        
        // 1. 本地缓存
        String localValue = localCache.getIfPresent(cacheKey);
        if (localValue != null) {
            return localValue;
        }
        
        // 2. Redis 缓存
        String redisValue = redisTemplate.opsForValue().get(cacheKey);
        if (redisValue != null) {
            localCache.put(cacheKey, redisValue);
            return redisValue;
        }
        
        // 3. 数据库
        User user = userMapper.selectById(userId);
        if (user != null) {
            String json = JSON.toJSONString(user);
            redisTemplate.opsForValue().set(cacheKey, json, 30, TimeUnit.MINUTES);
            localCache.put(cacheKey, json);
            return json;
        }
        return null;
    }
}
```

**方案三：Redis 高可用**

- 使用 Redis Cluster，避免单点故障
- 重要业务配置双集群（主集群 + 备用集群）
- 设置合理的降级策略：Redis 挂了，直接查数据库（但要做好限流保护）

```java
@Component
public class ResilientCacheService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RateLimiter rateLimiter;

    public String getUserWithFallback(int userId) {
        String cacheKey = "user:" + userId;
        
        try {
            String value = redisTemplate.opsForValue().get(cacheKey);
            if (value != null) {
                return value;
            }
        } catch (Exception e) {
            // Redis 挂了，降级到数据库查询
            log.error("Redis 不可用，降级查询数据库", e);
        }
        
        // 限流保护
        if (!rateLimiter.tryAcquire("db-" + userId)) {
            throw new RuntimeException("请求过于频繁，请稍后再试");
        }
        
        return userMapper.selectById(userId);
    }
}
```

---

## 五、实战：担保业务中的缓存设计

### 5.1 担保系统的缓存特点

担保系统有几个特点决定了缓存策略：

1. **数据量大**：千万级企业用户、百万级担保合同
2. **读写比例悬殊**：查询远多于写入（约 10:1）
3. **热点数据明显**：大客户的信息频繁访问
4. **数据一致性要求高**：金融场景不能乱

### 5.2 我们的缓存方案

```java
@Service
public class GuaranteeCacheService {
    
    // 合同状态缓存（5 分钟）
    private static final long CONTRACT_STATUS_TTL = 5 * 60;
    
    // 企业基础信息缓存（30 分钟）
    private static final long ENTERPRISE_INFO_TTL = 30 * 60;
    
    // 用户信息缓存（2 小时）
    private static final long USER_INFO_TTL = 2 * 60 * 60;

    public ContractStatus getContractStatus(String contractNo) {
        String cacheKey = "contract:status:" + contractNo;
        
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return JSON.parseObject(cached, ContractStatus.class);
            }
        } catch (Exception e) {
            log.error("Redis 读取失败", e);
        }
        
        ContractStatus status = contractMapper.getStatusByNo(contractNo);
        if (status != null) {
            try {
                redisTemplate.opsForValue().set(cacheKey, 
                    JSON.toJSONString(status), CONTRACT_STATUS_TTL, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Redis 写入失败，下次读取将查数据库", e);
            }
        }
        return status;
    }
}
```

### 5.3 缓存更新策略：Cache-Aside 模式

担保系统中我们采用的是 **Cache-Aside（旁路缓存）** 模式：

```
读：先查缓存 → 命中返回 → 未命中查数据库 → 写入缓存
写：先写数据库 → 删除缓存（不是更新缓存！）
```

**为什么删除缓存而不是更新缓存？**

1. **减少一致性问题的复杂度**：更新缓存需要同步多个副本
2. **避免脏数据**：并发写可能导致最后一次写的值被覆盖
3. **减少 Redis 写压力**：读多写少的场景，删除比更新效率高

---

## 六、总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 缓存穿透 | 查不存在的数据 | 布隆过滤器 / 缓存空值 |
| 缓存击穿 | 热点 key 过期 | 互斥锁 / 逻辑过期 |
| 缓存雪崩 | 大量 key 同时过期 / Redis 宕机 | 随机过期时间 / 多层缓存 / 高可用 |

分布式缓存不是银弹，它带来了便利，也带来了复杂度。在实际设计中，要根据业务场景权衡：

- 读多写少 → 多级缓存 + 合理过期
- 数据一致性要求高 → 短 TTL + Cache-Aside 模式
- 高并发场景 → 加本地缓存 + 限流降级

---

## 写在最后

这篇文章梳理的内容，每一个都是我在生产环境里真踩过坑的。尤其是缓存击穿和雪崩，在担保系统上线初期，就因为热点 key 过期导致数据库 CPU 飙到 100%。

做技术不能只停留在"知道"，要能在压力下做出正确的选择。希望这些经验对你有帮助。
