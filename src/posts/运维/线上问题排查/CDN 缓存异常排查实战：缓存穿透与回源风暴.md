---
title: CDN 缓存异常排查实战：缓存穿透与回源风暴
tag: ["CDN", "缓存穿透", "回源风暴", "缓存预热", "排查"]
category: 运维
date: 2026-07-03
---

# CDN 缓存异常排查实战：缓存穿透与回源风暴

> CDN 是高并发系统的第一道防线，但缓存配置不当可能导致穿透甚至回源风暴，瞬间压垮源站。本文从 CDN 缓存层级、命中率监控、穿透场景到回源风暴防护，完整还原一次线上 CDN 事故的全链路排查过程。

## 一、问题背景

某内容平台在热门活动期间，源站服务器 CPU 突然飙升到 100%，数据库连接池耗尽，大量请求超时。但前端 CDN 命中率监控显示为 92%，看似正常。

深入排查后发现：剩余 8% 的未命中请求中，有大量带随机参数的相同 URL 请求穿透到源站，形成了"高命中率下的回源风暴"。

```
[告警] 源站 CPU 使用率: 98% (阈值: 80%)
[告警] 源站 QPS: 15,000 (正常: 2,000)
[告警] 数据库连接池: 200/200 (已耗尽)
[告警] CDN 命中率: 92% (看似正常)
[告警] 源站响应时间: P99 = 8.5s (正常: 200ms)
```

## 二、CDN 缓存层级与命中率监控

### 2.1 CDN 缓存架构

```
┌────────────────────────────────────────────────────────────────────┐
│                      CDN 多级缓存架构                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  用户请求                                                           │
│      │                                                             │
│      ▼                                                             │
│  ┌─────────────┐                                                   │
│  │ 浏览器缓存   │  Cache-Control: max-age=300                       │
│  └──────┬──────┘                                                   │
│         │ 未命中                                                    │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │ CDN 边缘节点 │  L1 Cache，距离用户最近                            │
│  │ (Edge)      │  缓存时间: 短(分钟级)                              │
│  └──────┬──────┘                                                   │
│         │ 未命中                                                    │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │ CDN 中心节点 │  L2 Cache，回源前最后一道防线                      │
│  │ (Origin)    │  缓存时间: 中(小时级)                              │
│  └──────┬──────┘                                                   │
│         │ 未命中                                                    │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │ 源站服务器   │  应用服务器 + 数据库                               │
│  │ (Origin)    │  最宝贵的资源，必须保护                             │
│  └─────────────┘                                                   │
│                                                                    │
│  缓存层级的"漏斗效应":                                               │
│  边缘节点 100 万 QPS → 中心节点 10 万 QPS → 源站 1 万 QPS           │
│  每一层都应该过滤掉 90% 的请求                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心监控指标

```
┌──────────────────────────────────────────────────────────────────┐
│                    CDN 监控指标体系                                │
├─────────────────┬────────────────────────────────────────────────┤
│   指标类别       │   具体指标                                     │
├─────────────────┼────────────────────────────────────────────────┤
│  命中率          │  边缘命中率、中心命中率、总命中率                │
│  回源率          │  回源 QPS、回源带宽、回源延迟                   │
│  状态码分布      │  2xx/3xx/4xx/5xx 占比                          │
│  流量            │  入流量、出流量、回源流量                       │
│  缓存使用率      │  节点缓存空间使用比例                           │
│  TOP URL         │  访问最多的 URL、回源最多的 URL                 │
│  状态码 499/502  │  客户端取消、源站错误                           │
└─────────────────┴────────────────────────────────────────────────┘
```

### 2.3 命中率监控告警

```yaml
# Prometheus + Grafana CDN 监控告警
groups:
  - name: cdn_alert
    rules:
      # 总命中率低于 90%
      - alert: CDNLowHitRate
        expr: cdn_cache_hit_ratio < 0.90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CDN命中率低于90%: {{ $value }}"

      # 回源 QPS 突增
      - alert: CDNOriginQPSSpike
        expr: rate(cdn_origin_requests_total[5m]) > 5000
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "回源QPS超过5000: {{ $value }}"

      # 回源率超过 15%
      - alert: CDNHighOriginRatio
        expr: cdn_origin_ratio > 0.15
        for: 5m
        labels:
          severity: critical

      # 源站 5xx 比例
      - alert: CDNOriginErrorRate
        expr: rate(cdn_origin_status_5xx_total[5m]) /
              rate(cdn_origin_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
```

## 三、缓存穿透场景排查

### 3.1 穿透根因决策树

```
                    CDN 缓存穿透
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
      URL参数变化    缓存键设计不当   缓存规则错误
           │             │             │
    ┌──────┤        ┌────┤        ┌────┤
    ▼      ▼        ▼    ▼        ▼    ▼
  随机    跟踪     忽略  大小    TTL  无缓存
  参数    参数     参数  写键    太短  规则
  (timestamp)  (utm)  设置  错误       缺失
```

### 3.2 场景一：URL 参数变化导致穿透

```nginx
# 问题描述：
# 同一个资源 URL 带了不同的查询参数，CDN 将其视为不同请求
# 导致缓存命中率极低

# 请求示例：
GET /api/product/123?ts=1688371200123   # 缓存未命中 → 回源
GET /api/product/123?ts=1688371200456   # 缓存未命中 → 回源
GET /api/product/123?ts=1688371200789   # 缓存未命中 → 回源
# 每个请求的 ts 参数不同，CDN 认为是不同的 URL

# 解决方案：CDN 配置忽略指定参数
# 以阿里云 CDN 为例：
# 控制台 → 缓存配置 → 忽略参数 → 设置忽略 ts 参数

# 或使用 nginx 作为源站时的配置
# nginx.conf
location /api/product/ {
    # 忽略 ts 参数，只缓存基于 path 的响应
    proxy_cache_key "$scheme$request_method$host$request_uri";
    # 但 $request_uri 包含参数，需要处理
    # 方案：使用 Lua 或 map 提取纯 path
    set $cache_key "";
    access_by_lua_block {
        local uri = ngx.var.uri  -- 不含参数的 URI
        ngx.var.cache_key = ngx.var.scheme .. ngx.var.host .. uri
    }
    proxy_cache_key $cache_key;
}
```

```java
// Java 侧解决方案：规范化 URL
// 在生成 CDN URL 时，去掉不必要的参数
public class CDNUrlBuilder {

    // 需要忽略的参数（不影响内容的参数）
    private static final Set<String> IGNORE_PARAMS = Set.of(
        "ts", "_", "callback", "utm_source", "utm_medium"
    );

    public static String buildUrl(String path, Map<String, String> params) {
        // 过滤掉不影响内容的参数
        Map<String, String> filtered = params.entrySet().stream()
            .filter(e -> !IGNORE_PARAMS.contains(e.getKey()))
            .sorted(Map.Entry.comparingByKey())  // 排序保证一致性
            .collect(Collectors.toMap(
                Map.Entry::getKey, Map.Entry::getValue,
                (a, b) -> a, LinkedHashMap::new));

        if (filtered.isEmpty()) {
            return path;
        }

        String queryString = filtered.entrySet().stream()
            .map(e -> e.getKey() + "=" + e.getValue())
            .collect(Collectors.joining("&"));

        return path + "?" + queryString;
    }
}
```

### 3.3 场景二：缓存键设计不当

```java
// 问题：API 响应包含用户个性化信息，但被 CDN 缓存了
// 导致用户 A 看到了用户 B 的数据

// 错误示例：
@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    @GetMapping
    @Cacheable(value = "userProfile")  // 没有区分用户！
    public UserProfile getProfile(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return userService.getProfile(userId);
        // 不同用户的请求被缓存为同一个 key
        // 用户 B 可能拿到用户 A 的 profile
    }
}

// 正确示例：
@RestController
@RequestMapping("/api/user/profile")
public class UserProfileController {

    @GetMapping
    @Cacheable(value = "userProfile", key = "#userId")
    public UserProfile getProfile(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return userService.getProfile(userId);
        // 每个用户一个独立的缓存 key
    }
}
```

### 3.4 场景三：Vary 头处理不当

```nginx
# Vary 头告诉 CDN 同一 URL 需要根据指定头缓存不同版本
# 常见问题：Vary 头设置过多导致缓存碎片化

# 问题配置：
# Vary: Accept-Encoding, Accept-Language, User-Agent, Cookie
# User-Agent 有数千种 → 每种 UA 一个缓存副本 → 命中率极低

# 正确做法：只 Vary 必要的头
location / {
    # 只对编码方式做 Vary
    add_header Vary "Accept-Encoding";

    # 规范化 User-Agent：只区分移动端和 PC 端
    set $device_type "pc";
    if ($http_user_agent ~* "(Android|iPhone|iPad)") {
        set $device_type "mobile";
    }
    # 用 $device_type 参与缓存键，而不是原始 UA
    proxy_cache_key "$scheme$host$request_uri$device_type";
}
```

### 3.5 场景四：缓存规则冲突

```
# CDN 缓存规则冲突示例
# 规则1: /api/* 缓存 0 秒（不缓存）
# 规则2: *.json 缓存 300 秒
# 规则3: /api/*.json 缓存 60 秒
#
# 当请求 /api/product/list.json 时，匹配哪条规则？
# 不同 CDN 厂商的规则优先级不同，可能导致意外行为

# 排查方法：
# 1. 查看 CDN 控制台的规则优先级
# 2. 使用 curl -I 查看实际返回的缓存头
curl -I https://cdn.example.com/api/product/list.json

# 响应头中的关键信息：
# X-Cache: MISS (未命中) / HIT (命中)
# X-Cache-Lookup: Hit From MemCache (边缘命中)
# Age: 120 (已在缓存中存在 120 秒)
# Cache-Control: max-age=300
```

## 四、回源风暴排查

### 4.1 回源风暴触发条件

```
┌──────────────────────────────────────────────────────────────────┐
│                   回源风暴触发条件                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  条件1: 缓存集中过期                                              │
│  ─────────────────────                                           │
│  大量缓存同时过期 → 同时回源 → 源站被打爆                         │
│                                                                  │
│  条件2: 缓存预热不足                                              │
│  ─────────────────────                                           │
│  新内容发布但未预热 → 首批请求全部回源                            │
│                                                                  │
│  条件3: 穿透请求叠加                                              │
│  ─────────────────────                                           │
│  8% 穿透 × 100万 QPS = 8万 QPS 到源站                            │
│                                                                  │
│  条件4: 源站慢响应导致缓存雪崩                                    │
│  ─────────────────────                                           │
│  源站慢 → CDN 等待 → 缓存过期 → 更多回源 → 源站更慢              │
│                                                                  │
│  条件5: CDN 节点故障                                              │
│  ─────────────────────                                           │
│  某边缘节点挂了 → 请求转移到其他节点 → 其他节点缓存不足 → 回源    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 回源风暴复现分析

```python
# 回源风暴模拟分析
# 假设条件：
# - 总 QPS: 100 万
# - CDN 命中率: 92%
# - 回源率: 8%
# - 源站最大承受: 5000 QPS

total_qps = 1_000_000
hit_rate = 0.92
origin_qps = total_qps * (1 - hit_rate)
origin_capacity = 5000

print(f"总 QPS: {total_qps:,}")
print(f"CDN 命中: {total_qps * hit_rate:,.0f}")
print(f"回源 QPS: {origin_qps:,.0f}")
print(f"源站容量: {origin_capacity:,}")
print(f"超载倍数: {origin_qps / origin_capacity:.1f}x")

# 输出:
# 总 QPS: 1,000,000
# CDN 命中: 920,000
# 回源 QPS: 80,000
# 源站容量: 5,000
# 超载倍数: 16.0x  ← 源站被 16 倍流量打爆
```

### 4.3 回源 TOP URL 分析

```bash
# 阿里云 CDN 控制台查看回源 TOP URL
# 或通过日志分析

# CDN 回源日志格式：
# [时间] [边缘节点IP] [请求方法] [URL] [状态码] [响应时间] [回源IP]

# 分析回源最多的 URL
awk '{print $4}' /var/log/cdn/origin.log | \
  sort | uniq -c | sort -rn | head -20

# 输出示例：
# 152340 /api/product/detail?id=123&ts=1688371200123
# 134560 /api/product/detail?id=123&ts=1688371200456
# 128790 /api/product/detail?id=123&ts=1688371200789
#
# 发现：同一个商品详情，因为 ts 参数不同，被回源了 3 次
# 这就是穿透的根因！

# 进一步分析：去掉 ts 参数后的 URL 分布
awk '{print $4}' /var/log/cdn/origin.log | \
  sed 's/&ts=[0-9]*//g' | \
  sort | uniq -c | sort -rn | head -20

# 输出示例：
# 415690 /api/product/detail?id=123  ← 实际只需要回源 1 次！
# 89230  /api/product/detail?id=456
# 56780  /api/product/detail?id=789
```

## 五、熔断保护与限流

### 5.1 CDN 侧限流

```
┌──────────────────────────────────────────────────────────────────┐
│                    CDN 限流策略                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 单 IP 限流                                                   │
│     同一 IP 超过 100 QPS → 返回 429                              │
│                                                                  │
│  2. 单 URL 限流                                                  │
│     同一 URL 回源超过 50 QPS → 返回缓存旧内容或 429              │
│                                                                  │
│  3. 全局回源限流                                                 │
│     总回源 QPS 超过阈值 → 触发熔断                                │
│                                                                  │
│  4. stale-while-revalidate                                       │
│     缓存过期后先返回旧内容，后台异步刷新                           │
│                                                                  │
│  5. 请求折叠 (Request Coalescing)                                │
│     多个相同 URL 的回源请求合并为一个                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 请求折叠配置

```nginx
# Nginx 代理缓存请求折叠
# proxy_cache_lock: 同一 URL 的多个请求只回源一个
# proxy_cache_lock_timeout: 折叠超时时间

location /api/ {
    proxy_cache cache_zone;
    proxy_cache_key $scheme$host$request_uri;

    # 请求折叠：同一 URL 并发只回源一次
    proxy_cache_lock on;
    proxy_cache_lock_timeout 10s;    # 等待获取锁的超时
    proxy_cache_lock_age 5s;         # 锁的最大持有时间

    # 锁获取失败的请求直接返回旧缓存
    proxy_cache_use_stale updating;  # 更新时使用旧缓存
    proxy_cache_background_update on; # 后台异步更新

    # stale-while-revalidate
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;

    add_header X-Cache-Status $upstream_cache_status;
}
```

### 5.3 源站限流保护

```java
/**
 * 源站限流保护器
 * 当回源 QPS 超过阈值时，直接返回降级内容
 */
@Component
public class OriginRateLimiter {

    private final RateLimiter rateLimiter;
    private final Cache<String, CachedResponse> staleCache;

    public OriginRateLimiter() {
        this.rateLimiter = RateLimiter.create(3000); // 源站最大 3000 QPS
        this.staleCache = Caffe.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .build();
    }

    public ResponseEntity<?> handleRequest(String url, Supplier<ResponseEntity<?>> supplier) {
        // 尝试获取令牌
        if (!rateLimiter.tryAcquire()) {
            // 限流：返回旧缓存或降级内容
            CachedResponse stale = staleCache.getIfPresent(url);
            if (stale != null) {
                return ResponseEntity.ok()
                    .header("X-Stale", "true")
                    .body(stale.getBody());
            }
            return ResponseEntity.status(429)
                .header("Retry-After", "5")
                .body("Too Many Requests");
        }

        // 正常处理
        ResponseEntity<?> response = supplier.get();
        if (response.getStatusCode().is2xxSuccessful()) {
            // 缓存成功响应作为 stale 备用
            staleCache.put(url, new CachedResponse(response.getBody()));
        }

        return response;
    }
}
```

### 5.4 熔断器实现

```java
/**
 * CDN 回源熔断器
 * 当源站错误率超过阈值时，自动熔断
 */
@Component
public class OriginCircuitBreaker {

    private final CircuitBreaker circuitBreaker;

    public OriginCircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)           // 错误率 50% 触发熔断
            .slowCallRateThreshold(60)          // 慢调用比例 60% 触发熔断
            .slowCallDurationThreshold(Duration.ofSeconds(2)) // 慢调用阈值
            .waitDurationInOpenState(Duration.ofSeconds(30))  // 熔断恢复等待
            .slidingWindowSize(100)             // 滑动窗口大小
            .minimumNumberOfCalls(20)           // 最小调用数
            .permittedNumberOfCallsInHalfOpenState(10) // 半开状态试探调用数
            .build();

        this.circuitBreaker = CircuitBreaker.of("originBreaker", config);
    }

    public <T> T execute(Supplier<T> supplier, Supplier<T> fallback) {
        return CircuitBreaker.decorateSupplier(circuitBreaker, supplier)
            .get();
        // 熔断时自动走 fallback
    }
}
```

## 六、缓存预热与主动刷新

### 6.1 缓存预热方案

```
┌──────────────────────────────────────────────────────────────────┐
│                    缓存预热策略                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 定时预热                                                     │
│     ─────────                                                   │
│     每天凌晨主动拉取热门内容列表 → 批量预热到 CDN                 │
│                                                                  │
│  2. 发布预热                                                     │
│     ─────────                                                   │
│     新内容发布时同步触发 CDN 预热                                 │
│                                                                  │
│  3. 懒加载预热                                                   │
│     ─────────                                                   │
│     首次回源时异步预热相似内容                                    │
│                                                                  │
│  4. 多级预热                                                     │
│     ─────────                                                   │
│     先预热中心节点，再推送到边缘节点                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

```java
/**
 * CDN 缓存预热服务
 */
@Service
public class CDNCacheWarmupService {

    @Autowired
    private CDNClient cdnClient;

    @Autowired
    private ProductRepository productRepository;

    /**
     * 定时预热热门内容
     * 每天凌晨 3 点执行
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void warmupHotContent() {
        // 1. 获取热门商品列表
        List<Product> hotProducts = productRepository.findTop100ByOrderByViewCountDesc();

        // 2. 批量预热
        List<String> urls = hotProducts.stream()
            .map(p -> "/api/product/detail?id=" + p.getId())
            .collect(Collectors.toList());

        // 3. 分批推送预热请求（每批 100 个 URL）
        Lists.partition(urls, 100).forEach(batch -> {
            try {
                CDNWarmupResult result = cdnClient.warmup(batch);
                log.info("预热完成: 成功={}, 失败={}", result.getSuccess(), result.getFailed());
            } catch (Exception e) {
                log.error("预热失败", e);
            }
        });
    }

    /**
     * 新内容发布时预热
     */
    @EventListener
    public void onProductPublished(ProductPublishedEvent event) {
        String url = "/api/product/detail?id=" + event.getProductId();
        cdnClient.warmup(List.of(url));
        log.info("新内容预热: {}", url);
    }

    /**
     * 活动开始前批量预热
     */
    public void warmupForCampaign(String campaignId, LocalDateTime startTime) {
        // 提前 30 分钟开始预热
        LocalDateTime warmupTime = startTime.minusMinutes(30);

        ScheduledExecutor<?> scheduled = scheduler.schedule(warmupTime, () -> {
            List<String> campaignUrls = getCampaignUrls(campaignId);
            Lists.partition(campaignUrls, 50).forEach(batch -> {
                cdnClient.warmup(batch);
                Thread.sleep(1000); // 控制预热速率
            });
        });
    }
}
```

### 6.2 主动刷新策略

```java
/**
 * CDN 缓存主动刷新
 * 当内容变更时，主动通知 CDN 刷新缓存
 */
@Service
public class CDNCachePurgeService {

    @Autowired
    private CDNClient cdnClient;

    /**
     * 商品信息更新后刷新缓存
     */
    @EventListener
    @Async
    public void onProductUpdated(ProductUpdatedEvent event) {
        String url = "/api/product/detail?id=" + event.getProductId();

        // 刷新 CDN 缓存
        cdnClient.purge(PurgeType.URL, List.of(url));

        // 同时预热新内容
        cdnClient.warmup(List.of(url));

        log.info("缓存刷新+预热: {}", url);
    }

    /**
     * 批量刷新（目录级别）
     */
    public void purgeDirectory(String directory) {
        // 按目录刷新（某些 CDN 支持）
        cdnClient.purge(PurgeType.DIRECTORY, List.of(directory));
        log.info("目录刷新: {}", directory);
    }
}
```

### 6.3 缓存版本管理

```java
/**
 * 通过版本号管理缓存
 * 内容变更时更新版本号，URL 自然变化
 */
@RestController
public class ProductController {

    @GetMapping("/api/product/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        Product product = productService.getById(id);

        // 使用 ETag 做缓存校验
        String etag = "\"" + product.getVersion() + "\"";

        return ResponseEntity.ok()
            .header("ETag", etag)
            .header("Cache-Control", "public, max-age=300")
            // stale-while-revalidate: 过期后允许返回旧内容 60 秒
            .header("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
            .body(product);
    }
}

// 版本号更新
@Entity
public class Product {
    @Id
    private Long id;

    @Version
    private Long version;  // JPA 自动维护版本号

    // 当产品信息变更时，version 自动 +1
    // CDN 缓存的 ETag 变化 → 自动失效
}
```

## 七、CDN 配置最佳实践

### 7.1 缓存规则配置

```
┌──────────────────────────────────────────────────────────────────┐
│                   CDN 缓存规则最佳实践                              │
├───────────────────┬──────────────────────────────────────────────┤
│  资源类型          │  缓存策略                                     │
├───────────────────┼──────────────────────────────────────────────┤
│ 静态资源 (js/css) │  长期缓存(1年) + 文件名哈希                    │
│ 图片/视频          │  长期缓存(30天) + 版本号 URL                   │
│ HTML 页面          │  短期缓存(5分钟) + stale-while-revalidate      │
│ API JSON          │  短期缓存(60秒) + 按 key 缓存                  │
│ 用户数据 API       │  不缓存 (Cache-Control: no-store)             │
│ 个人中心          │  不缓存 (需登录态)                             │
└───────────────────┴──────────────────────────────────────────────┘
```

### 7.2 完整 nginx 缓存配置

```nginx
# nginx CDN 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2
    keys_zone=cdn_cache:100m
    max_size=10g
    inactive=60m
    use_temp_path=off;

server {
    listen 80;
    server_name cdn.example.com;

    # 静态资源 - 长期缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$ {
        proxy_cache cdn_cache;
        proxy_cache_key $scheme$host$uri;  # 不含参数，静态资源参数无意义
        proxy_cache_valid 200 302 365d;
        proxy_cache_valid 404 1m;

        # 请求折叠
        proxy_cache_lock on;
        proxy_cache_lock_timeout 10s;

        # 过期时使用旧缓存
        proxy_cache_use_stale error timeout updating;
        proxy_cache_background_update on;

        # 添加缓存状态头
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=31536000, immutable";

        proxy_pass http://origin;
    }

    # API - 短期缓存
    location /api/public/ {
        proxy_cache cdn_cache;
        proxy_cache_key $scheme$host$request_uri;  # 包含参数
        proxy_cache_valid 200 60s;
        proxy_cache_valid 404 10s;

        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;
        proxy_cache_use_stale updating error;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=60, stale-while-revalidate=30";

        proxy_pass http://origin;
    }

    # 用户数据 - 不缓存
    location /api/user/ {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        proxy_pass http://origin;
    }
}
```

## 八、避坑指南

### 8.1 CDN 缓存常见坑

| 序号 | 坑点 | 影响 | 预防措施 |
|-----|------|------|---------|
| 1 | 随机参数穿透 | 回源风暴 | CDN 配置忽略无关参数 |
| 2 | 缓存同一 URL 不同用户数据 | 数据泄露 | API 响应加 Vary 或不缓存 |
| 3 | 缓存集中过期 | 源站突增 | TTL 加随机偏移量 |
| 4 | 发布未预热 | 首批请求全回源 | 发布触发 CDN 预热 |
| 5 | POST 请求被缓存 | 数据错误 | CDN 不缓存非 GET 请求 |
| 6 | 健康检查被缓存 | 检查失效 | 健康检查 URL 加 no-cache |
| 7 | CORS 头被缓存 | 跨域失败 | Vary: Origin |
| 8 | gzip 与 br 缓存冲突 | 编码错误 | Vary: Accept-Encoding |

### 8.2 TTL 随机化防雪崩

```java
/**
 * 缓存 TTL 随机化，防止集中过期
 */
public class CacheTTLUtil {

    private static final Random random = new Random();

    /**
     * 基础 TTL + 随机偏移
     * @param baseTTL 基础过期时间（秒）
     * @param jitter  随机偏移范围（秒）
     * @return 实际 TTL
     */
    public static int withJitter(int baseTTL, int jitter) {
        return baseTTL + random.nextInt(jitter * 2) - jitter;
    }

    // 示例：300 ± 60 秒
    // 240~360 秒之间随机过期
    // 避免大量缓存同时过期
}
```

## 九、面试要点

### Q1: CDN 缓存穿透怎么排查？

**回答框架：**
1. **看回源日志**：分析回源 TOP URL，看是否有参数变化
2. **看命中率分布**：按 URL 维度看命中率，找出低命中 URL
3. **看缓存键**：确认 CDN 的 cache-key 是否正确
4. **看 Vary 头**：检查是否有不必要的 Vary 导致缓存碎片化

### Q2: 回源风暴怎么处理？

**回答框架：**
1. **紧急限流**：CDN 侧和源站同时限流
2. **请求折叠**：同一 URL 并发回源只发一个请求
3. **stale-while-revalidate**：过期先返回旧内容，后台刷新
4. **缓存预热**：提前预热热门内容
5. **TTL 随机化**：防止缓存集中过期

### Q3: 如何设计 CDN 缓存策略？

**回答要点：**
1. 按资源类型分级：静态资源长期缓存、API 短期缓存、用户数据不缓存
2. 忽略无关参数：ts、utm 等不影响内容的参数
3. 多级缓存：边缘 + 中心 + 源站
4. 主动预热 + 被动刷新结合
5. 监控命中率 + 回源率双指标

### Q4: stale-while-revalidate 的作用是什么？

**回答要点：**
1. 缓存过期后先返回旧内容，不阻塞用户请求
2. 后台异步刷新缓存
3. 有效降低回源延迟
4. 防止缓存过期瞬间的回源风暴

### Q5: CDN 请求折叠的原理？

**回答要点：**
1. 同一 URL 的多个并发回源请求只发一个
2. 其他请求等待第一个请求返回后共享结果
3. Nginx 通过 `proxy_cache_lock on` 实现
4. 有效防止缓存击穿（大量请求同时穿透）

## 十、总结

CDN 缓存异常排查的核心原则：

1. **命中率不是唯一指标** — 92% 命中率下仍有 8% 穿透可能压垮源站
2. **回源 QPS 才是关键** — 监控回源绝对值而非仅看百分比
3. **请求折叠是银弹** — 同 URL 并发回源合并为一
4. **预热胜于刷新** — 主动预热比被动等待命中更可靠
5. **TTL 必须随机化** — 防止缓存集中过期导致的雪崩