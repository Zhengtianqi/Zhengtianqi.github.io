---
title: Redis 大 Key 与热 Key 治理：发现、拆分与迁移方案
tag: ["Redis", "大Key", "热Key", "运维", "性能优化"]
category: 数据库
date: 2026-07-03
---

# Redis 大 Key 与热 Key 治理：发现、拆分与迁移方案

线上 Redis 延迟突增？可能是大 Key 在阻塞。CPU 100%？可能是热 Key 在打满单线程。大 Key 和热 Key 是 Redis 运维两大杀手——怎么发现、怎么拆分、怎么迁移？

---

## 一、大 Key

### 1.1 判定标准

```
大 Key 判定标准（经验值）：

  数据类型        大 Key 阈值
  ─────────────────────────────
  String         > 10 KB
  Hash           > 5000 个 field 或 > 10 MB
  List           > 5000 个元素 或 > 10 MB
  Set            > 5000 个元素 或 > 10 MB
  ZSet           > 5000 个元素 或 > 10 MB

  超大 Key（危险）：
  String > 1 MB、集合 > 50000 元素 → 必须立即处理

  实际影响取决于：
  - Redis 版本（6.0 多线程 IO 缓解部分问题）
  - 业务访问模式（读多还是写多）
  - 集群规模（单分片承受能力）
```

### 1.2 大 Key 的危害

```
危害 1：阻塞 Redis（单线程）
  大 Key 操作（如 HGETALL 返回 10 万字段）耗时几十毫秒
  → 期间 Redis 无法处理其他请求
  → 其他请求排队 → 延迟突增

危害 2：网络带宽打满
  一个 10 MB 的 Value → 单次响应 10 MB
  → 千兆网卡 125 MB/s → 12 次请求打满
  → 其他请求超时

危害 3：内存倾斜（集群环境）
  大 Key 集中在某个分片
  → 该分片内存远超其他分片
  → 该分片先触发 maxmemory → 开始淘汰 → 数据丢失

危害 4：删除阻塞
  DEL 一个 10 万元素的 List → Redis 阻塞数百毫秒
  → 全局阻塞

危害 5：持久化卡顿
  RDB BGSAVE fork 子进程 → COW（Copy-On-Write）
  大 Key 所在页被修改 → 需要复制 → 内存翻倍
  AOF rewrite → 写入大 Key 耗时 → AOF 文件膨胀
```

### 1.3 发现大 Key

```bash
# 方法 1：redis-cli --bigkeys（采样）
redis-cli --bigkeys
# 原理：SCAN 遍历，统计各类型的最大 Key
# 优点：在线执行，不影响服务
# 缺点：只采样，可能遗漏；只知道最大，不知道全部大 Key

# 方法 2：redis-cli --memkeys（Redis 7+）
redis-cli --memkeys
# 统计内存占用最大的 Key

# 方法 3：MEMORY USAGE（精确单 Key）
redis-cli
> MEMORY USAGE key:1234
# 返回该 Key 占用的内存（字节）
# 包含 Key 本身 + Value + 元数据

# 方法 4：SCAN + 脚本（全面扫描）
# Python 脚本扫描所有 Key 的大小
import redis
r = redis.Redis()

cursor = 0
big_keys = []
while True:
    cursor, keys = r.scan(cursor, count=1000)
    for key in keys:
        key_type = r.type(key)
        if key_type == b'string':
            size = r.strlen(key)
        elif key_type == b'list':
            size = r.llen(key)
        elif key_type == b'hash':
            size = r.hlen(key)
        elif key_type == b'set':
            size = r.scard(key)
        elif key_type == b'zset':
            size = r.zcard(key)
        else:
            size = 0
        
        if size > 5000:
            big_keys.append((key.decode(), key_type.decode(), size))
    
    if cursor == 0:
        break

big_keys.sort(key=lambda x: x[2], reverse=True)
for key, ktype, size in big_keys[:20]:
    print(f"{key}: type={ktype}, size={size}")
```

### 1.4 大 Key 拆分方案

```
String 大 Key 拆分：

  原始：SET big_json '{"data": [10万条记录...]}'
  
  拆分：按内容分片
  SET big_json:0 '{"data": [前1万条]}'
  SET big_json:1 '{"data": [1-2万条]}'
  ...
  SET big_json:index '{"total": 10, "shards": [0,1,...,9]}'

Hash 大 Key 拆分：

  原始：HSET user:fields {10000个field}
  
  拆分：按 field 分桶
  HSET user:fields:bucket:0 {2500个field}
  HSET user:fields:bucket:1 {2500个field}
  HSET user:fields:bucket:2 {2500个field}
  HSET user:fields:bucket:3 {2500个field}
  
  读取时：hash(field) % 4 → 找到 bucket

List 大 Key 拆分：

  原始：LPUSH logs:2024-01-01 {10万条日志}
  
  拆分：按时间或数量分片
  LPUSH logs:2024-01-01:0 {1万条}
  LPUSH logs:2024-01-01:1 {1万条}
  ...
  SET logs:2024-01-01:meta '{"total": 10, "shards": 10}'

ZSet 大 Key 拆分：

  原始：ZADD ranking {10万个用户}
  
  拆分：按 score 分段
  ZADD ranking:0-1000 {score 0-1000的用户}
  ZADD ranking:1000-2000 {score 1000-2000的用户}
  ...
  查询时：先定位分段 → 再查
```

### 1.5 大 Key 删除

```bash
# ⚠️ 绝对不要 DEL 大 Key！
DEL big_list   # 10万元素的 List → 阻塞 500ms+

# 正确方式 1：UNLINK（Redis 4.0+）
UNLINK big_list   # 异步删除，不阻塞

# 正确方式 2：渐进式删除（兼容旧版本）
# Hash：HSCAN + HDEL
cursor = 0
while True:
    cursor, fields = r.hscan("big_hash", cursor=cursor, count=100)
    for field in fields:
        r.hdel("big_hash", field)
    if cursor == 0:
        break
r.delete("big_hash")

# List：LTRIM 逐步裁剪
while r.llen("big_list") > 0:
    r.ltrim("big_list", 100, -1)  # 每次删前100个

# Set：SSCAN + SREM
# ZSet：ZREMRANGEBYSCORE 逐步删

# Redis 4.0+ 配置：lazyfree
# redis.conf
lazyfree-lazy-eviction yes     # 内存淘汰异步删除
lazyfree-lazy-expire yes       # 过期异步删除
lazyfree-lazy-server-del yes   # 服务端 DEL 异步
```

### 1.6 大 Key 迁移

```bash
# 场景：大 Key 需要从一个 Redis 迁移到另一个

# 方法 1：DUMP + RESTORE（原子迁移）
redis-cli
> DUMP big_key
"\x00\x04key\xc3..."  # 序列化数据
> RESTORE new_big_key 0 "\x00\x04key\xc3..."
# 问题：大 Key 的 DUMP 数据可能很大 → 网络阻塞

# 方法 2：MIGRATE（原子迁移）
MIGRATE target-host target-port "" 0 0 KEYS big_key
# 原理：DUMP + RESTORE + DEL（原子）
# 问题：迁移过程中阻塞源 Redis

# 方法 3：渐进式迁移（推荐）
# 1. 读取旧 Key 数据（分批 SCAN）
# 2. 写入新 Redis（分批写入）
# 3. 标记新 Key 为活跃
# 4. 删除旧 Key（UNLINK）

# 方法 4：阿里云 Redis 工具
# redis-shake / redis-migrate-tool
```

---

## 二、热 Key

### 2.1 热 Key 的危害

```
热 Key：某个 Key 被高频访问

危害：
  1. 单分片 CPU 100%
     热Key 在某个分片 → 该分片 CPU 打满 → 其他请求超时
  
  2. 单分片带宽打满
     热Key 响应大 → 该分片网卡打满
  
  3. 缓存击穿
     热Key 过期瞬间 → 大量请求穿透到 DB → DB 崩溃

典型场景：
  - 秒杀商品 Key
  - 热门新闻 Key
  - 排行榜 Key
  - 验证码 Key（被刷接口）
```

### 2.2 发现热 Key

```bash
# 方法 1：redis-cli --hotkeys（Redis 6+）
# 需要 maxmemory-policy = allkeys-lfu
redis-cli --hotkeys

# 方法 2：MONITOR 命令（慎用！）
# 捕获所有命令，统计 Key 频率
redis-cli monitor | grep -oP '"GET \K[^"]+' | sort | uniq -c | sort -rn | head -20
# ⚠️ MONITOR 会严重降低 Redis 性能！只在排查时短时使用

# 方法 3：客户端统计（推荐）
# 在应用层统计 Key 访问频率
@Component
public class HotKeyCollector {
    private final Map<String, LongAdder> counter = new ConcurrentHashMap<>();
    
    public void record(String key) {
        counter.computeIfAbsent(key, k -> new LongAdder()).increment();
    }
    
    @Scheduled(fixedRate = 10000)  // 每 10s 统计
    public void report() {
        counter.entrySet().stream()
            .sorted(Map.Entry.<String, LongAdder>comparingByValue(
                Comparator.comparingLong(LongAdder::sum)).reversed())
            .limit(20)
            .forEach(e -> log.info("HotKey: {} count={}", e.getKey(), e.getValue().sum()));
        counter.clear();
    }
}

# 方法 4：代理层统计
# Twemproxy / Codis / 阿里云 Proxy
# 代理层天然可以统计 Key 访问频率

# 方法 5：Redis 7+ 热Key 通知
# redis-cli --hotkeys（基于 LFU 计数器）
```

### 2.3 热 Key 解决方案

```
方案 1：本地缓存（多级缓存）

  ┌─────────────────────────────────────────────────────┐
  │                  请求链路                            │
  │                                                     │
  │  Client → Caffeine(本地) → Redis → DB                │
  │                                                     │
  │  热Key 在 Caffeine 中缓存 1-5 秒                      │
  │  90% 请求被本地缓存拦截                               │
  │  Redis QPS 从 10万 降到 1万                           │
  └─────────────────────────────────────────────────────┘

  // 代码实现
  LoadingCache<String, String> localCache = Caffeine.newBuilder()
      .expireAfterWrite(3, TimeUnit.SECONDS)
      .maximumSize(10000)
      .build(key -> redis.get(key));
  
  String value = localCache.get("hot:key:123");
  // 先查本地缓存 → 未命中再查 Redis

方案 2：热 Key 复制（多副本）

  原始：hot_key 只在一个分片
  优化：hot_key:0, hot_key:1, hot_key:2, hot_key:3 分布在多个分片
  
  // 写入时：多写
  for (int i = 0; i < 4; i++) {
      redis.set("hot_key:" + i, value, 30);
  }
  
  // 读取时：随机读副本
  int replica = ThreadLocalRandom.current().nextInt(4);
  String value = redis.get("hot_key:" + replica);
  
  // 压力分散到 4 个分片 → 单分片 QPS 降 75%

方案 3：读写分离
  热Key 读流量 → Slave 节点
  热Key 写流量 → Master 节点
  
  // Redis Cluster 读从库
  // @Redisson 注解读从库
  Config config = new Config();
  config.useClusterServers()
      .setReadMode(ReadMode.SLAVE)  // 读从库
      .addNodeAddress("redis://master:6379");

方案 4：缓存永不过期 + 异步刷新
  // 热Key 永不过期 → 不会缓存击穿
  // 后台定时刷新 → 数据更新
  
  String value = redis.get("hot:key");
  if (value == null) {
      value = db.query();  // DB 查询
      redis.set("hot:key", value);  // 不设过期
  }
  // 定时任务异步刷新
  @Scheduled(fixedRate = 5000)
  public void refreshHotKey() {
      String value = db.query();
      redis.set("hot:key", value);
  }
```

---

## 三、面试要点

### Q：大 Key 怎么发现和处理？

发现：
1. `redis-cli --bigkeys` 快速扫描
2. `MEMORY USAGE key` 精确查看单 Key
3. SCAN + 脚本全面扫描

处理：
1. 拆分：String 分片、Hash 分桶、List 分段、ZSet 分段
2. 删除：UNLINK（4.0+）异步删除，或渐进式删除（HSCAN+HDEL）
3. 预防：控制单个 Key 大小（如 Hash 不超过 5000 field）

### Q：热 Key 怎么解决？

1. 本地缓存：Caffeine 缓存热 Key 1-5 秒，拦截大部分请求
2. 多副本：将热 Key 复制到多个分片，读随机选副本
3. 读写分离：热 Key 读取走从库
4. 永不过期：热 Key 不设过期 + 异步刷新，避免缓存击穿

### Q：为什么不能用 DEL 删除大 Key？

Redis 是单线程的，DEL 大 Key 会阻塞主线程。10 万元素的 List DEL 可能耗时 500ms+，期间所有请求排队。正确做法是用 UNLINK（4.0+）异步删除，或渐进式删除（分批 HDEL/SREM/LTRIM）。

---

## 四、总结

```
大 Key 治理：
  发现：--bigkeys / MEMORY USAGE / SCAN 脚本
  拆分：Hash 分桶 / List 分段 / ZSet 分段
  删除：UNLINK（异步）/ 渐进式删除
  预防：单 Key 不超 5000 元素 / 10KB

热 Key 治理：
  发现：--hotkeys / 客户端统计 / MONITOR（排查）
  解决：本地缓存 / 多副本 / 读写分离 / 永不过期+异步刷新
  预防：监控告警 + 自动降级

Redis 配置建议：
  lazyfree-lazy-eviction yes
  lazyfree-lazy-expire yes
  lazyfree-lazy-server-del yes
  maxmemory-policy allkeys-lfu  # 支持 --hotkeys
```
