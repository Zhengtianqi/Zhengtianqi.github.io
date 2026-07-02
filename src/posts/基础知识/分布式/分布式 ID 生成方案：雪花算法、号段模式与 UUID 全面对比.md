---
title: 分布式 ID 生成方案：雪花算法、号段模式与 UUID 全面对比
tag: ["分布式ID", "雪花算法", "号段模式", "UUID", "架构设计"]
category: 分布式
date: 2026-06-27
---

# 分布式 ID 生成方案：雪花算法、号段模式与 UUID 全面对比

分库分表后主键怎么生成？高并发下 ID 生成会不会成瓶颈？多机房怎么避免冲突？从 UUID 到雪花算法到号段模式，一篇讲透。

---

## 一、为什么需要分布式 ID

### 1.1 单库自增 ID 的问题

```
单库：AUTO_INCREMENT → 简单好用

分库分表后：
  DB1: id = 1, 2, 3, ...
  DB2: id = 1, 2, 3, ...  → 冲突！

解决方法 1：步长设置
  DB1: 1, 3, 5, 7, ...（步长=2，起始=1）
  DB2: 2, 4, 6, 8, ...（步长=2，起始=2）
  问题：扩容困难，不能加机器

解决方法 2：独立 ID 生成服务
  → 分布式 ID 方案
```

### 1.2 分布式 ID 要求

```
1. 全局唯一：不能重复
2. 趋势递增：有利于 B+ 树索引（随机插入导致页分裂）
3. 高可用：ID 生成不能成为系统瓶颈
4. 高性能：QPS 10万+
5. 信息安全：不易被猜测（不暴露业务量）
```

---

## 二、UUID

### 2.1 UUID 版本

```
UUID v1：基于时间戳 + MAC 地址
  优点：有序（时间戳）
  缺点：暴露 MAC 地址，隐私问题

UUID v2：DCE Security
  基本不用

UUID v3：基于命名空间 + MD5
  确定性生成

UUID v4：随机
  最常用，36 字符：550e8400-e29b-41d4-a716-446655440000
  优点：简单，无碰撞风险
  缺点：无序（索引灾难），太长（36 字符 = 128 bit）

UUID v5：基于命名空间 + SHA-1
  类似 v3

UUID v7（2023）：时间戳排序 + 随机
  有序！解决了 v4 无序问题
  未来推荐
```

### 2.2 Java 实现

```java
// UUID v4（最常用）
String uuid = UUID.randomUUID().toString();
// "550e8400-e29b-41d4-a716-446655440000"

// 去掉横线
String id = uuid.replace("-", "");
// "550e8400e29b41d4a716446655440000"（32 字符）

// UUID v7（Java 21+ 或用 com.github.f4b6a3:uuid-creator）
import com.github.f4b6a3.uuid.UuidCreator;
String uuidV7 = UuidCreator.getTimeOrderedEpoch().toString();
```

### 2.3 优缺点

```
优点：
  ✅ 本地生成，无网络开销
  ✅ 全局唯一，无冲突
  ✅ 实现简单

缺点：
  ❌ 无序（v4），B+ 树插入性能差
  ❌ 太长（36 字符），索引占空间
  ❌ 不可读
  ❌ 不能反映时间信息

结论：不推荐用于数据库主键
适合：trace_id、request_id、文件名
```

---

## 三、雪花算法（Snowflake）

### 3.1 结构

```
Snowflake ID（64 bit）：

 0 | 00000000 00000000 00000000 00000000 00000000 0 | 00000 00000 0 | 000000000000
   |<──────────────── 41 bit 时间戳 ─────────────────>|<─10bit─>|<── 12bit ──>+
   |  毫秒级，可用 69 年                                  | 机器ID  |   序列号    |
   sign(1bit)                                          workerId  sequence

总长：64 bit → 可以用 long 存储（Java）
含义：时间 + 机器 + 序列

  41 bit 时间戳：毫秒级，(1 << 41) / (1000 * 60 * 60 * 24 * 365) ≈ 69 年
  10 bit 机器ID：1024 台机器
  12 bit 序列号：每毫秒 4096 个 ID

理论 QPS：1024 × 4096 = 419 万/毫秒 = 41.9 亿/秒
```

### 3.2 Java 实现

```java
public class SnowflakeIdWorker {
    
    // 起始时间戳（2024-01-01 00:00:00）
    private static final long EPOCH = 1704067200000L;
    
    // 各部分位数
    private static final long WORKER_ID_BITS = 10L;
    private static final long SEQUENCE_BITS = 12L;
    
    // 最大值
    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS);  // 1023
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);     // 4095
    
    // 位移
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;                    // 12
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;   // 22
    
    // 掩码
    private static final long SEQUENCE_MASK = MAX_SEQUENCE;
    
    private final long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;
    
    public SnowflakeIdWorker(long workerId) {
        if (workerId < 0 || workerId > MAX_WORKER_ID) {
            throw new IllegalArgumentException(
                "workerId must be between 0 and " + MAX_WORKER_ID);
        }
        this.workerId = workerId;
    }
    
    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        
        // 时钟回拨检查
        if (timestamp < lastTimestamp) {
            throw new IllegalStateException(
                "Clock moved backwards. Refusing to generate id for " 
                + (lastTimestamp - timestamp) + " milliseconds");
        }
        
        if (timestamp == lastTimestamp) {
            // 同一毫秒内，序列号递增
            sequence = (sequence + 1) & SEQUENCE_MASK;
            if (sequence == 0) {
                // 序列号用完，等待下一毫秒
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }
        
        lastTimestamp = timestamp;
        
        return ((timestamp - EPOCH) << TIMESTAMP_SHIFT)
             | (workerId << WORKER_ID_SHIFT)
             | sequence;
    }
    
    private long tilNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }
    
    // 使用
    public static void main(String[] args) {
        SnowflakeIdWorker idWorker = new SnowflakeIdWorker(1);
        for (int i = 0; i < 10; i++) {
            System.out.println(idWorker.nextId());
        }
        // 1234567890123456789
        // 1234567890123456790
        // ...
    }
}
```

### 3.3 时钟回拨问题

```java
// 时钟回拨：服务器时间突然倒退
// 原因：NTP 同步、虚拟机迁移

// 解决方案 1：抛异常（简单粗暴）
if (timestamp < lastTimestamp) {
    throw new IllegalStateException("Clock moved backwards");
}

// 解决方案 2：等待回拨时间
if (timestamp < lastTimestamp) {
    long offset = lastTimestamp - timestamp;
    if (offset <= 5) {
        // 回拨 5ms 以内，等待
        Thread.sleep(offset);
        timestamp = System.currentTimeMillis();
    } else {
        throw new IllegalStateException("Clock moved backwards > 5ms");
    }
}

// 解决方案 3：借用未来时间（百度 UidGenerator）
// 不用当前时间，用上次时间 + 1ms，这样 ID 仍然递增
// 但可能产生"未来 ID"

// 解决方案 4：位运算借用序列号空间（美团 Leaf）
// 用几个 bit 存储回拨次数
```

### 3.4 机器 ID 分配

```
方案 1：配置文件手动分配
  worker-id: 1  # 每台机器不同
  问题：运维麻烦

方案 2：ZooKeeper 自动分配
  启动时在 ZK 创建临时节点，节点序号作为 workerId
  优点：自动分配
  缺点：依赖 ZK

方案 3：数据库自增
  启动时 INSERT 获取自增 ID 作为 workerId
  优点：简单
  缺点：机器重启 ID 会变

方案 4：Redis INCR
  redis.incr("snowflake:worker:id")
  优点：简单高性能
  缺点：依赖 Redis

方案 5：IP + Port 生成
  workerId = (IP 最后一段 << 8 | port 后两位) & 0x3FF
  优点：无依赖
  缺点：可能冲突
```

---

## 四、号段模式（Leaf-Segment）

### 4.1 原理

```
号段模式：每次从数据库批量获取一批 ID，用完再取

数据库表：
  CREATE TABLE id_segment (
    biz_tag     VARCHAR(128) PRIMARY KEY,  -- 业务标识
    max_id      BIGINT NOT NULL,           -- 当前最大 ID
    step        INT NOT NULL,              -- 步长（每次取多少）
    version     INT NOT NULL,              -- 乐观锁
    update_time TIMESTAMP
  );

流程：
  1. 应用启动：SELECT max_id, step FROM id_segment WHERE biz_tag = 'order'
     → max_id = 1000, step = 2000
  2. 更新：UPDATE id_segment SET max_id = 3000, version = version + 1 
            WHERE biz_tag = 'order' AND version = 0
  3. 应用内存中持有 [1001, 3000] 号段
  4. 每次取 ID：1001, 1002, ..., 3000
  5. 用完后再取下一段
```

### 4.2 Java 实现

```java
public class LeafSegment {
    
    private final JdbcTemplate jdbcTemplate;
    private final String bizTag;
    
    private AtomicLong currentId;    // 当前 ID
    private volatile long maxId;      // 号段最大值
    private volatile long step;       // 步长
    private volatile boolean loading = false;  // 是否在加载下一段
    
    public LeafSegment(JdbcTemplate jdbcTemplate, String bizTag) {
        this.jdbcTemplate = jdbcTemplate;
        this.bizTag = bizTag;
        loadSegment();  // 初始加载
    }
    
    private synchronized void loadSegment() {
        // 乐观锁重试
        for (int i = 0; i < 3; i++) {
            Segment segment = getSegment();
            boolean success = updateSegment(segment);
            if (success) {
                this.currentId = new AtomicLong(segment.maxId);
                this.maxId = segment.maxId + segment.step;
                this.step = segment.step;
                return;
            }
        }
        throw new RuntimeException("Failed to load segment");
    }
    
    private Segment getSegment() {
        return jdbcTemplate.queryForObject(
            "SELECT max_id, step, version FROM id_segment WHERE biz_tag = ?",
            (rs, rowNum) -> {
                Segment s = new Segment();
                s.maxId = rs.getLong("max_id");
                s.step = rs.getInt("step");
                s.version = rs.getInt("version");
                return s;
            },
            bizTag
        );
    }
    
    private boolean updateSegment(Segment segment) {
        int rows = jdbcTemplate.update(
            "UPDATE id_segment SET max_id = max_id + step, version = version + 1 " +
            "WHERE biz_tag = ? AND version = ?",
            bizTag, segment.version
        );
        return rows > 0;
    }
    
    public long nextId() {
        long id = currentId.getAndIncrement();
        
        // 号段用到 10% 时，异步加载下一段
        if (id > maxId - step * 0.1 && !loading) {
            loading = true;
            CompletableFuture.runAsync(() -> {
                loadSegment();
                loading = false;
            });
        }
        
        // 号段用完，同步加载
        if (id >= maxId) {
            loadSegment();
            return nextId();
        }
        
        return id;
    }
    
    static class Segment {
        long maxId;
        int step;
        int version;
    }
}
```

### 4.3 双 Buffer 优化

```
问题：号段用完时同步加载，会有短暂阻塞

双 Buffer 方案：
  Buffer A：当前使用中
  Buffer B：预加载

  当 A 用到 10% 时，异步加载 B
  A 用完时，无缝切换到 B
  同时异步加载新的 A

  → 永远不会阻塞
```

---

## 五、Leaf（美团）

### 5.1 Leaf 架构

```
Leaf 同时支持两种模式：

1. Leaf-Segment（号段模式）：
   适合：ID 趋势递增，对连续性有要求
   特点：DB 依赖，双 Buffer 优化

2. Leaf-Snowflake（雪花模式）：
   适合：对性能要求高，不依赖 DB
   特点：ZK 分配 workerId，解决时钟回拨

Leaf-Snowflake 时钟回拨处理：
  1. 启动时在 ZK 注册 workerId，同时上报时间戳
  2. 生成 ID 前先检查 ZK 上报的时间戳
  3. 如果本地时间 < 上次上报时间，说明回拨
  4. 等待回拨时间过去（报警但不抛异常）
  5. 每隔一段时间上报时间戳到 ZK
```

---

## 六、Redis 生成

### 6.1 INCR 方案

```java
// 简单方案
Long id = redis.incr("id:order");
// 优点：简单、高性能、自增
// 缺点：依赖 Redis、持久化问题

// 优化：Redis 集群 + 步长
// 每个 Redis 节点步长不同
// node1: incr by 1, step=3 → 1, 4, 7, 10...
// node2: incr by 2, step=3 → 2, 5, 8, 11...
// node3: incr by 3, step=3 → 3, 6, 9, 12...
```

### 6.2 Lua 脚本

```lua
-- 带日期前缀的 ID 生成
-- 格式：YYYYMMDD + 6位序号
local key = "id:" .. KEYS[1] .. ":" .. os.date("%Y%m%d")
local seq = redis.call("INCR", key)
if seq == 1 then
    redis.call("EXPIRE", key, 86400)  -- 24小时过期
end
return string.format("%s%06d", os.date("%Y%m%d"), seq)
-- 结果：20240627000001
```

---

## 七、方案对比

| 方案 | 性能 | 可用性 | 趋势递增 | 依赖 | 适合场景 |
|------|------|--------|---------|------|---------|
| UUID | 极高 | 极高 | ❌（v4）/✅（v7） | 无 | trace_id |
| Snowflake | 极高 | 高 | ✅ | 时钟 | 通用主键 |
| 号段模式 | 高 | 高 | ✅ | DB | 中等规模 |
| Leaf | 高 | 高 | ✅ | DB/ZK | 大规模 |
| Redis | 高 | 中 | ✅ | Redis | 简单场景 |
| 数据库自增 | 低 | 低 | ✅ | DB | 单库 |

### 选型建议

```
QPS < 1万：数据库号段模式（简单可靠）
QPS 1万-100万：雪花算法（本地生成，无依赖）
QPS > 100万：雪花算法 + 多机房部署
需要排序/分页：雪花算法（趋势递增）
对连续性无要求：UUID v7
多机房：雪花算法 + 机器ID隔离
```

---

## 八、多机房方案

```
机房 A：workerId 0-511
机房 B：workerId 512-1023

雪花算法 10 bit workerId 分配：
  1 bit 机房标识 + 9 bit 机房内机器标识
  机房 A：0xxx xxxxxx（0-511）
  机房 B：1xxx xxxxxx（512-1023）

或：不同机房用不同的 EPOCH（起始时间）
  机房 A：EPOCH = 1704067200000
  机房 B：EPOCH = 1704067200001
  → ID 永远不会冲突（时间戳偏移不同）
```

---

## 九、面试要点

### Q：雪花算法的时钟回拨怎么解决？

时钟回拨指服务器时间倒退（NTP 同步导致）。解决方案：
1. 回拨时间短（<5ms）：Thread.sleep 等待
2. 回拨时间长：抛异常或报警
3. 百度 UidGenerator：借用未来时间
4. 美团 Leaf：ZK 上报时间戳，检测回拨后等待

### Q：号段模式和雪花算法怎么选？

号段模式：DB 依赖，ID 连续，适合中等规模（QPS < 10万）
雪花算法：无依赖，本地生成，适合大规模（QPS > 10万）
美团 Leaf 同时支持两种，按场景选。

### Q：为什么不用 UUID 做数据库主键？

UUID v4 是随机的，插入 B+ 树时随机位置写入，导致页分裂频繁，IO 增加。如果用 UUID，选 v7（时间排序），但仍然比 long 占更多空间（16 字节 vs 8 字节）。

---

## 十、总结

分布式 ID 选型决策树：

```
需要全局唯一 ID？
  ├─ QPS < 1万 → 号段模式（DB 批量取号）
  ├─ QPS > 1万 → 雪花算法（本地生成）
  └─ 不做主键 → UUID v7 / UUID v4
```

记住：**雪花算法最通用（高性能+无依赖+趋势递增），号段模式最稳妥（简单+连续），UUID 不做主键**。
