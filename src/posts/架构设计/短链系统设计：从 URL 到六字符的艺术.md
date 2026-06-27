---
title: 短链系统设计：从 URL 到六字符的艺术
tag: ["架构设计", "短链", "Redis", "Base62", "分布式"]
category: 架构设计
date: 2026-06-27
---

# 短链系统设计：从 URL 到六字符的艺术

> 你在短信里收到 `https://t.co/Ab3x9K`，点开后跳转到了一个超长的 URL。这就是短链系统。看起来简单——不就是个映射吗？但当每天有上亿条短链被创建、上十亿次点击被重定向，简单的事情就变得不简单了。

## 一、为什么需要短链系统

### 1.1 应用场景

| 场景 | 说明 |
|---|---|
| 短信营销 | 短信按字计费，短链省字数省钱 |
| 二维码 | 短链生成的二维码更密集，易扫描 |
| 社交分享 | Twitter 限 280 字符，短链更省空间 |
| 数据统计 | 统计点击量、来源、设备等 |
| 品牌定制 | 自定义短链提升品牌辨识度 |

### 1.2 核心功能

1. **短链生成**：长 URL → 短 URL
2. **短链重定向**：短 URL → 长 URL（301/302 跳转）
3. **数据统计**：点击量、UV、来源等

---

## 二、短链生成方案

### 2.1 哈希方案（MD5 / MurmurHash）

将长 URL 做哈希，取前几位作为短码。

```java
public String generateShortCode(String longUrl) {
    String md5 = DigestUtils.md5Hex(longUrl);
    // 取前6位
    return md5.substring(0, 6);
}
```

**问题**：MD5 有碰撞风险，不同 URL 可能生成相同短码。MurmurHash 碰撞率更低但仍存在。

### 2.2 自增 ID + Base62 编码（推荐）⭐

#### 原理

给每个 URL 分配一个全局唯一 ID，将 ID 转成 Base62 编码作为短码。

```
ID = 123456789
Base62(123456789) = "8m0Kv"
短链 = https://t.co/8m0Kv
```

#### Base62 编码

```java
public class Base62 {
    private static final String CHARS = 
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = CHARS.length();  // 62

    /**
     * ID 转 Base62
     */
    public static String encode(long num) {
        if (num == 0) return "0";
        StringBuilder sb = new StringBuilder();
        while (num > 0) {
            sb.insert(0, CHARS.charAt((int) (num % BASE)));
            num /= BASE;
        }
        return sb.toString();
    }

    /**
     * Base62 转 ID
     */
    public static long decode(String str) {
        long num = 0;
        for (char c : str.toCharArray()) {
            num = num * BASE + CHARS.indexOf(c);
        }
        return num;
    }
}
```

#### ID 从哪来？——发号器

**方案一：数据库自增 ID**

```sql
CREATE TABLE url_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE,
    long_url TEXT,
    create_time DATETIME,
    expire_time DATETIME
);
```

简单但单点瓶颈。

**方案二：Redis 自增**

```java
Long id = redis.opsForValue().increment("short_url:id");
String shortCode = Base62.encode(id);
```

高性能但依赖 Redis 可用性。

**方案三：雪花算法（Snowflake）**

```java
public class SnowflakeIdGenerator {
    private final long epoch = 1704067200000L;  // 2024-01-01
    private final long workerIdBits = 5L;
    private final long datacenterIdBits = 5L;
    private final long sequenceBits = 12L;
    
    private final long maxWorkerId = ~(-1L << workerIdBits);       // 31
    private final long maxDatacenterId = ~(-1L << datacenterIdBits); // 31
    
    private final long workerIdShift = sequenceBits;
    private final long datacenterIdShift = sequenceBits + workerIdBits;
    private final long timestampShift = sequenceBits + workerIdBits + datacenterIdBits;
    private final long sequenceMask = ~(-1L << sequenceBits);

    private final long workerId;
    private final long datacenterId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeIdGenerator(long workerId, long datacenterId) {
        if (workerId > maxWorkerId || workerId < 0) 
            throw new IllegalArgumentException("workerId 超出范围");
        if (datacenterId > maxDatacenterId || datacenterId < 0) 
            throw new IllegalArgumentException("datacenterId 超出范围");
        this.workerId = workerId;
        this.datacenterId = datacenterId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        if (timestamp < lastTimestamp) 
            throw new RuntimeException("时钟回拨");
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) timestamp = tilNextMillis(lastTimestamp);
        } else {
            sequence = 0L;
        }
        lastTimestamp = timestamp;
        return ((timestamp - epoch) << timestampShift)
             | (datacenterId << datacenterIdShift)
             | (workerId << workerIdShift)
             | sequence;
    }

    private long tilNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) timestamp = System.currentTimeMillis();
        return timestamp;
    }
}
```

**方案四：号段模式（Leaf-Segment）**

预分配 ID 范围，减少数据库访问：

```sql
CREATE TABLE id_segment (
    biz_tag VARCHAR(128) PRIMARY KEY,
    max_id BIGINT NOT NULL,
    step INT NOT NULL,
    version INT NOT NULL
);
```

```java
@Service
public class SegmentIdService {
    
    @Autowired
    private JdbcTemplate jdbc;

    private final AtomicLong currentId = new AtomicLong(0);
    private volatile long maxId = 0;

    public synchronized long nextId() {
        // 号段用完了，申请新号段
        if (currentId.get() >= maxId) {
            applyNewSegment();
        }
        return currentId.getAndIncrement();
    }

    private void applyNewSegment() {
        int step = 1000;
        int updated = jdbc.update(
            "UPDATE id_segment SET max_id = max_id + ?, version = version + 1 " +
            "WHERE biz_tag = 'short_url' AND version = ?",
            step, currentVersion
        );
        if (updated == 0) throw new RuntimeException("号段更新失败");
        
        Map<String, Object> row = jdbc.queryForMap(
            "SELECT max_id FROM id_segment WHERE biz_tag = 'short_url'");
        maxId = (Long) row.get("max_id");
        currentId.set(maxId - step);
    }
}
```

### 2.3 方案对比

| 方案 | 优点 | 缺点 | 短码长度 |
|---|---|---|---|
| MD5 哈希 | 无需协调 | 可能碰撞 | 6-8 字符 |
| 自增 ID + Base62 | 无碰撞，短码短 | 依赖发号器 | 6-7 字符 |
| 雪花 ID + Base62 | 分布式，无中心 | ID 较长 | 10-12 字符 |
| 随机生成 | 简单 | 碰撞需重试 | 6 字符 |

**推荐**：自增 ID + Base62 编码。6 字符可表达 62^6 ≈ 568 亿个短链，足够用。

---

## 三、系统架构设计

```
用户 → 负载均衡 → 短链服务
                     ↓
              Redis 缓存(短码→长URL)
                     ↓ (miss)
              MySQL 数据库
```

### 3.1 生成短链流程

```java
@Service
public class ShortUrlService {

    @Autowired
    private StringRedisTemplate redis;
    
    @Autowired
    private ShortUrlRepository repo;
    
    @Autowired
    private SnowflakeIdGenerator idGenerator;

    private static final int SHORT_CODE_LENGTH = 6;
    private static final int CACHE_TTL_DAYS = 30;

    /**
     * 生成长链对应的短链
     */
    public String createShortUrl(String longUrl) {
        // 1. 先查是否已生成过（长URL → 短码 的映射）
        String existCode = redis.opsForValue().get("long:url:" + longUrl.hashCode());
        if (existCode != null) {
            return "https://t.co/" + existCode;
        }

        // 2. 查数据库
        ShortUrl exist = repo.findByLongUrl(longUrl);
        if (exist != null) {
            // 回填缓存
            redis.opsForValue().set("short:url:" + exist.getShortCode(), longUrl, 
                CACHE_TTL_DAYS, TimeUnit.DAYS);
            redis.opsForValue().set("long:url:" + longUrl.hashCode(), 
                exist.getShortCode(), CACHE_TTL_DAYS, TimeUnit.DAYS);
            return "https://t.co/" + exist.getShortCode();
        }

        // 3. 生成新短码
        long id = idGenerator.nextId();
        String shortCode = Base62.encode(id);
        
        // 补齐到6位
        while (shortCode.length() < SHORT_CODE_LENGTH) {
            shortCode = "0" + shortCode;
        }

        // 4. 存入数据库
        ShortUrl entity = new ShortUrl();
        entity.setId(id);
        entity.setShortCode(shortCode);
        entity.setLongUrl(longUrl);
        entity.setCreateTime(new Date());
        entity.setExpireTime(DateUtils.addDays(new Date(), 365));  // 1年有效期
        repo.save(entity);

        // 5. 写入缓存
        redis.opsForValue().set("short:url:" + shortCode, longUrl, 
            CACHE_TTL_DAYS, TimeUnit.DAYS);
        redis.opsForValue().set("long:url:" + longUrl.hashCode(), 
            shortCode, CACHE_TTL_DAYS, TimeUnit.DAYS);

        return "https://t.co/" + shortCode;
    }
}
```

### 3.2 重定向流程

```java
@Controller
public class RedirectController {

    @Autowired
    private StringRedisTemplate redis;
    
    @Autowired
    private ShortUrlRepository repo;

    @GetMapping("/{shortCode}")
    public RedirectView redirect(@PathVariable String shortCode, 
                                  HttpServletRequest request) {
        // 1. 校验短码格式
        if (!isValidShortCode(shortCode)) {
            return new RedirectView("/404");
        }

        // 2. 查缓存
        String longUrl = redis.opsForValue().get("short:url:" + shortCode);
        if (longUrl != null) {
            // 3. 异步记录点击统计
            recordClickAsync(shortCode, request);
            return new RedirectView(longUrl);
        }

        // 4. 缓存未命中，查数据库
        ShortUrl entity = repo.findByShortCode(shortCode);
        if (entity == null || entity.isExpired()) {
            return new RedirectView("/404");
        }

        // 5. 回填缓存
        redis.opsForValue().set("short:url:" + shortCode, entity.getLongUrl(), 
            30, TimeUnit.DAYS);

        // 6. 异步记录点击统计
        recordClickAsync(shortCode, request);

        return new RedirectView(entity.getLongUrl());
    }

    private boolean isValidShortCode(String code) {
        return code != null && code.matches("^[0-9A-Za-z]{4,10}$");
    }

    @Async
    public void recordClickAsync(String shortCode, HttpServletRequest request) {
        ClickRecord record = new ClickRecord();
        record.setShortCode(shortCode);
        record.setIp(RequestUtils.getClientIp(request));
        record.setUserAgent(request.getHeader("User-Agent"));
        record.setReferer(request.getHeader("Referer"));
        record.setClickTime(new Date());
        
        // 写入 MQ，由消费者异步落库
        mqTemplate.send("click-record-topic", record);
    }
}
```

### 3.3 301 vs 302 重定向

| 维度 | 301 永久重定向 | 302 临时重定向 |
|---|---|---|
| 浏览器缓存 | 缓存，下次直接跳 | 不缓存，每次经过短链服务 |
| SEO | 利于 SEO | 不利于 SEO |
| 统计 | 浏览器缓存后统计不到 | 每次都能统计 |

**推荐用 302**：短链系统的一个重要功能就是点击统计，301 会导致后续点击不经过短链服务，统计不到。

---

## 四、缓存设计

### 4.1 缓存策略

```java
// 双缓存：短码→长URL + 长URL哈希→短码
redis.opsForValue().set("short:url:" + shortCode, longUrl, 30, TimeUnit.DAYS);
redis.opsForValue().set("long:url:" + longUrl.hashCode(), shortCode, 30, TimeUnit.DAYS);
```

### 4.2 缓存击穿防护

热门短链过期时大量请求打到数据库，用布隆过滤器 + 互斥锁：

```java
@Service
public class ShortUrlService {

    @Autowired
    private BloomFilter<String> bloomFilter;  // 布隆过滤器

    public String getLongUrl(String shortCode) {
        // 1. 布隆过滤器先判断，不存在直接返回 404
        if (!bloomFilter.mightContain(shortCode)) {
            return null;  // 一定不存在
        }

        // 2. 查缓存
        String longUrl = redis.opsForValue().get("short:url:" + shortCode);
        if (longUrl != null) return longUrl;

        // 3. 缓存未命中，加锁查库（防击穿）
        String lockKey = "lock:" + shortCode;
        String longUrlResult = null;
        try {
            Boolean locked = redis.opsForValue().setIfAbsent(lockKey, "1", 3, TimeUnit.SECONDS);
            if (Boolean.TRUE.equals(locked)) {
                // 双重检查
                longUrl = redis.opsForValue().get("short:url:" + shortCode);
                if (longUrl != null) return longUrl;

                // 查库
                ShortUrl entity = repo.findByShortCode(shortCode);
                if (entity != null) {
                    redis.opsForValue().set("short:url:" + shortCode, 
                        entity.getLongUrl(), 30, TimeUnit.DAYS);
                    longUrlResult = entity.getLongUrl();
                }
            } else {
                // 等待后重试缓存
                Thread.sleep(50);
                return getLongUrl(shortCode);
            }
        } finally {
            redis.delete(lockKey);
        }
        return longUrlResult;
    }
}
```

### 4.3 缓存预热

```java
@PostConstruct
public void preloadCache() {
    // 加载热门短链到缓存
    List<ShortUrl> hotUrls = repo.findTop100ByOrderByClickCountDesc();
    for (ShortUrl url : hotUrls) {
        redis.opsForValue().set("short:url:" + url.getShortCode(), 
            url.getLongUrl(), 30, TimeUnit.DAYS);
        bloomFilter.put(url.getShortCode());
    }
}
```

---

## 五、分库分表

当短链数量过亿，单表扛不住，需要分库分表。

### 5.1 分表策略

```java
// 按 shortCode 的哈希值取模分表
public String getTableName(String shortCode) {
    int hash = Math.abs(shortCode.hashCode());
    int tableIndex = hash % 64;  // 64 张表
    return "short_url_" + tableIndex;
}
```

### 5.2 ShardingSphere 配置

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        short_url:
          actual-data-nodes: ds0.short_url_${0..63}
          table-strategy:
            hash-modulo:
              sharding-column: short_code
              sharding-count: 64
          key-generator:
            column: id
            type: SNOWFLAKE
```

---

## 六、自定义短链

有些用户想用 `https://t.co/my-product` 而不是随机短码。

```java
public String createCustomShortUrl(String longUrl, String customCode) {
    // 1. 校验自定义短码
    if (!customCode.matches("^[a-zA-Z0-9_-]{4,20}$")) {
        throw new IllegalArgumentException("短码格式不正确");
    }

    // 2. 检查是否被占用
    if (redis.opsForValue().get("short:url:" + customCode) != null 
        || repo.findByShortCode(customCode) != null) {
        throw new RuntimeException("短码已被占用");
    }

    // 3. 存储
    ShortUrl entity = new ShortUrl();
    entity.setShortCode(customCode);
    entity.setLongUrl(longUrl);
    entity.setCustom(true);
    repo.save(entity);

    redis.opsForValue().set("short:url:" + customCode, longUrl, 30, TimeUnit.DAYS);
    
    return "https://t.co/" + customCode;
}
```

---

## 七、避坑指南

| 坑 | 说明 | 解决方案 |
|---|---|---|
| 长链重复生成 | 同一 URL 生成多个短码 | 长URL哈希→短码映射缓存 |
| 缓存穿透 | 不存在的短码反复查库 | 布隆过滤器 + 空值缓存 |
| 缓存击穿 | 热点短链过期 | 互斥锁 + 永不过期策略 |
| 短码可预测 | 自增ID暴露生成顺序 | ID 不从1开始，或加随机偏移 |
| 时钟回拨 | 雪花算法生成重复 ID | 时钟回拨检测 + 等待 |
| 有效期管理 | 短链过期但仍可访问 | 定时任务清理过期数据 |

---

## 八、面试要点

**Q1：短链系统怎么生成短码？**

答：推荐自增 ID + Base62 编码。发号器分配全局唯一 ID，将 ID 转为 62 进制字符串（0-9, A-Z, a-z）。6 位 Base62 可表示 568 亿个短链，足够使用。发号器可以用 Redis 自增、雪花算法或号段模式。

**Q2：短链重定向用 301 还是 302？**

答：推荐 302。301 会被浏览器缓存，后续点击不再经过短链服务，导致统计不到点击数据。302 每次都经过短链服务，能准确统计。虽然 302 多一次请求，但短链的核心价值之一就是数据统计。

**Q3：如何防止缓存击穿？**

答：1）布隆过滤器：不存在的短码直接返回 404，不打到数据库。2）互斥锁：缓存未命中时加锁查库，只放一个请求通过。3）热点短链永不过期，后台异步更新。

**Q4：短链系统怎么分库分表？**

答：按 short_code 的哈希值取模分表。查询时先算哈希确定表，再查。如果需要按长 URL 查，建一个反查索引表。ShardingSphere 等中间件可以简化分库分表。

**Q5：短链有有效期吗？怎么管理？**

答：可以设置有效期，也可以永久有效。有效期的实现：数据库存 expire_time 字段，查询时判断；Redis 缓存设 TTL。过期数据用定时任务清理，或惰性删除（查询时发现过期就删）。

---

## 总结

短链系统看似简单，实际上涉及了发号器、Base62 编码、缓存策略、分库分表等多个技术点。核心设计：

- **生成**：自增 ID + Base62，简单无碰撞
- **存储**：MySQL + Redis 缓存，双写
- **重定向**：302 跳转，保证统计
- **防护**：布隆过滤器防穿透，互斥锁防击穿
- **扩展**：分库分表应对海量数据

从面试角度，短链系统考察的是：发号器设计、编码方案选择、缓存策略、高并发处理。把这些点讲清楚，面试基本就稳了。
