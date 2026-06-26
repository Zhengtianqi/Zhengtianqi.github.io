---
title: CDN原理与实现：DNS路由、边缘计算与缓存策略
tag: ["DNS路由", "边缘计算", "缓存策略", "CDN"]
category: 分布式
date: 2026-06-25
---

# CDN原理与实现：DNS路由、边缘计算与缓存策略

## 前言

互联网中，距离和延迟是性能的大敌。用户在北京访问托管在深圳的服务器，需要跨越千公里网络，延迟至少50ms。

**CDN（Content Delivery Network）** 的核心理念是：

```
远端服务器 ← 离用户最近的边缘节点
↓
通过全球分布的节点，将内容"推送"到用户身边
```

本文详解CDN的架构原理、DNS解析策略、边缘计算与缓存机制。

---

## 一、CDN基本原理

### 1.1 问题场景

```
without CDN:
用户 (北京)
  ↓ 10000km
源服务器 (硅谷)
  ↓ 延迟：200ms+

with CDN:
用户 (北京)
  ↓ 100km
CDN节点 (北京)
  ↓ 延迟：10ms+
  ↓ 回源到源服务器 (硅谷)
```

### 1.2 工作流程

```
1. 用户请求静态资源
   User → Browser: GET /image.jpg

2. 浏览器DNS查询 (解析 image.example.com)
   Browser → DNS: 查询 image.example.com

3. DNS返回CDN节点地址 (地理位置感知)
   DNS ← 返回: 123.45.67.89 (北京节点)

4. 浏览器请求CDN节点
   Browser → CDN节点: GET /image.jpg

5. CDN节点检查缓存
   CDN节点检查: 本地有image.jpg缓存吗？
   ├─ 有 + 未过期 → 直接返回 (Hit)
   └─ 无或过期 → 回源到源服务器 (Miss)

6. 如果Miss，回源
   CDN节点 → 源服务器: GET /image.jpg
   源服务器 → CDN节点: 200 OK + 文件内容

7. 缓存并返回
   CDN节点: 缓存文件，返回给用户
   CDN节点 → Browser: 200 OK + 文件内容
```

### 1.3 CDN的三层架构

```
┌──────────────────────────┐
│ 全局负载均衡 (GSLB)      │
│ 地理位置感知DNS          │
│ (高层次的重定向)         │
└───────────┬──────────────┘
            │
      ┌─────┴──────┬──────────┐
      ▼            ▼          ▼
   ┌─────┐      ┌─────┐    ┌─────┐
   │PoP1 │      │PoP2 │    │PoP3 │
   │(北京)      │(上海)    │(深圳)
   │ ┌───────┐  │        
   │ │边缘   │  │
   │ │节点   │  │
   │ └───────┘  │
   └─────┘      └─────┘    └─────┘
      │            │          │
      └────────────┼──────────┘
                   │ (回源到源服务器)
            ┌──────▼────────┐
            │ 源服务器      │
            │ (Origin)      │
            └───────────────┘
```

---

## 二、DNS智能解析与地理位置感知

### 2.1 传统DNS的问题

```
标准DNS解析：
example.com → A record → 123.45.67.89 (全局唯一IP)

问题：
└─ 所有用户都解析到同一IP
└─ 用户离服务器可能很远
└─ 网络延迟高
```

### 2.2 GSLB（全局服务负载均衡）

**关键思想**：根据用户**地理位置**，返回最近的CDN节点IP

```python
# DNS查询处理流程
def handle_dns_query(domain, client_ip):
    """
    domain: 用户查询的域名 (e.g., img.example.com)
    client_ip: 发起查询的客户端IP
    """
    # 1. 获取客户端地理位置
    location = geo_lookup(client_ip)  # GeoIP库
    # location = {"country": "CN", "city": "Beijing", "lat": 39.9, "lon": 116.4}
    
    # 2. 查询该地区可用的CDN节点
    available_nodes = get_nodes_in_region(location['country'], location['city'])
    # available_nodes = [
    #     {"ip": "123.45.67.1", "city": "Beijing", "load": 0.4},
    #     {"ip": "123.45.67.2", "city": "Beijing", "load": 0.6},
    # ]
    
    # 3. 选择负载最低的节点
    selected_node = min(available_nodes, key=lambda x: x['load'])
    
    # 4. 返回IP地址
    return selected_node['ip']  # e.g., 123.45.67.1
```

### 2.3 DNS优化技术

#### **1. DNS分级**

```
Domain: img.example.com

层级1: example.com
  Type: A
  Value: gslb.example.com (GSLB权威服务器IP)

层级2: gslb.example.com
  Type: A
  Value: 123.45.67.89

用户查询流程：
1. 查询 img.example.com
2. 递归解析：
   根DNS → 返回 .com DNS服务器
   .com DNS → 返回 example.com DNS服务器
   example.com DNS → 返回 gslb.example.com
   gslb.example.com DNS → 返回最近的CDN节点IP

优点：可以在GSLB层做精细控制
```

#### **2. TTL（Time To Live）策略**

```
CDN节点IP TTL = 60秒
├─ 优点：节点故障时，用户快速重新解析
├─ 缺点：DNS查询频率高，服务器压力大

源服务器IP TTL = 3600秒
├─ 优点：减少DNS查询，节省带宽
├─ 缺点：故障恢复慢

策略：
├─ 热门资源（高QPS）: TTL=60s
└─ 冷资源（低QPS）: TTL=3600s
```

#### **3. 健康检查驱动的DNS**

```python
class HealthCheckDrivenDNS:
    def __init__(self):
        self.nodes = {
            "beijing": [
                {"ip": "123.45.67.1", "healthy": True},
                {"ip": "123.45.67.2", "healthy": True},
            ],
            "shanghai": [
                {"ip": "124.45.67.1", "healthy": False},  # 故障
                {"ip": "124.45.67.2", "healthy": True},
            ]
        }
    
    async def health_check(self):
        """
        定期检查各节点健康状态
        """
        while True:
            for region, nodes in self.nodes.items():
                for node in nodes:
                    try:
                        # HTTP HEAD请求或TCP连接检查
                        response = await http_client.head(
                            f"http://{node['ip']}/health",
                            timeout=2
                        )
                        node['healthy'] = response.status_code == 200
                    except Exception:
                        node['healthy'] = False
            
            await asyncio.sleep(10)  # 每10秒检查一次
    
    def resolve(self, domain, client_ip):
        """
        只返回健康的节点
        """
        location = geo_lookup(client_ip)
        healthy_nodes = [
            n for n in self.nodes[location['city']]
            if n['healthy']
        ]
        
        if not healthy_nodes:
            # 本地无健康节点，降级到临近地区
            healthy_nodes = self.get_backup_nodes(location)
        
        return random.choice(healthy_nodes)['ip']
```

---

## 三、CDN边缘节点架构

### 3.1 节点分层

```
Tier 1 (中心节点)
├─ 保存完整内容库
├─ 容量: 100TB+
├─ 网络: 高带宽
├─ 数量: 3-5个全球主要城市

Tier 2 (区域节点)
├─ 保存热门内容
├─ 容量: 10TB
├─ 网络: 中等带宽
├─ 数量: 20-50个

Tier 3 (边缘节点)
├─ 保存超热内容
├─ 容量: 1TB
├─ 网络: 低成本网络(运营商)
├─ 数量: 100+

Cache-Miss回源流程：
Tier 3 (用户请求)
  ↓ Miss
Tier 2
  ↓ Miss
Tier 1 (中心节点)
  ↓ Miss
源服务器
```

### 3.2 缓存分层

```python
class CDNNode:
    def __init__(self, tier: str):
        self.tier = tier  # "edge" / "regional" / "center"
        self.cache = {}  # {key: (value, expiry_time, hit_count)}
        self.parent_node = None  # 上层节点
        self.origin = None  # 源服务器
    
    async def get(self, url, headers=None):
        """
        分层缓存获取
        """
        # 1. 检查本地缓存
        cache_key = self.get_cache_key(url, headers)
        
        if cache_key in self.cache:
            value, expiry_time, hit_count = self.cache[cache_key]
            
            if time.time() < expiry_time:
                # 缓存有效
                self.cache[cache_key] = (value, expiry_time, hit_count + 1)
                return {"status": 200, "body": value, "from": "local_cache"}
            else:
                # 缓存过期，删除
                del self.cache[cache_key]
        
        # 2. 本地Miss，查询上层节点
        if self.parent_node:
            response = await self.parent_node.get(url, headers)
            if response['status'] == 200:
                # 上层命中，缓存到本层
                self.cache_response(cache_key, response)
                return response
        
        # 3. 上层也Miss，回源到源服务器
        response = await self.origin.get(url, headers)
        if response['status'] == 200:
            self.cache_response(cache_key, response)
        
        return response
    
    def cache_response(self, key, response):
        """
        缓存响应，根据HTTP头设置TTL
        """
        cache_control = response.get('cache-control', '')
        
        # 解析Cache-Control
        ttl = self.parse_cache_control(cache_control)
        
        # 根据层级调整TTL
        if self.tier == "edge":
            ttl = min(ttl, 3600)  # 边缘节点最多缓存1小时
        elif self.tier == "regional":
            ttl = min(ttl, 86400)  # 区域节点最多缓存1天
        
        expiry_time = time.time() + ttl
        self.cache[key] = (response['body'], expiry_time, 0)
    
    def parse_cache_control(self, cache_control: str) -> int:
        """
        解析Cache-Control头，返回TTL秒数
        """
        import re
        
        # max-age=3600
        match = re.search(r'max-age=(\d+)', cache_control)
        if match:
            return int(match.group(1))
        
        # no-cache / no-store → 不缓存
        if 'no-cache' in cache_control or 'no-store' in cache_control:
            return 0
        
        # 默认缓存1小时
        return 3600
    
    def get_cache_key(self, url, headers):
        """
        生成缓存键，考虑Vary头
        """
        vary = headers.get('vary', '') if headers else ''
        
        # 如果设置了Vary，需要考虑这些请求头
        # 例如 Vary: User-Agent, Accept-Encoding
        cache_key = url
        
        if 'user-agent' in vary.lower():
            cache_key += f"|UA:{headers.get('user-agent', '')}"
        
        if 'accept-encoding' in vary.lower():
            cache_key += f"|AE:{headers.get('accept-encoding', '')}"
        
        return cache_key
```

### 3.3 缓存预热与推送

```python
class CDNPrefetch:
    """
    提前推送热点内容到边缘节点，避免回源
    """
    
    async def prefetch_content(self, content_list, target_regions):
        """
        预热：将内容推送到指定地区的所有边缘节点
        
        content_list: ["/image1.jpg", "/image2.jpg", ...]
        target_regions: ["beijing", "shanghai", "guangzhou"]
        """
        for region in target_regions:
            nodes = self.get_edge_nodes(region)
            
            for node in nodes:
                for content_url in content_list:
                    # 从源服务器获取内容
                    response = await self.origin.get(content_url)
                    
                    # 推送到边缘节点
                    await node.push(content_url, response['body'])
    
    async def schedule_prefetch(self):
        """
        定时预热，例如：
        - 每天凌晨2点预热热门视频到全部节点
        - 大促前一小时预热活动页面
        """
        while True:
            # 获取近7天的热点内容Top 1000
            hot_contents = await self.analytics.get_hot_contents(days=7, limit=1000)
            
            # 推送到所有Tier 2节点
            await self.prefetch_content(
                hot_contents,
                target_regions=self.get_all_regions()
            )
            
            await asyncio.sleep(86400)  # 24小时更新一次
```

---

## 四、CDN缓存策略

### 4.1 缓存键设计

```python
class CacheKeyStrategy:
    """
    不同的缓存键策略，影响缓存命中率
    """
    
    def basic_key(self, url: str) -> str:
        """
        最简单：只用URL
        /image.jpg?v=1 和 /image.jpg?v=2 是不同缓存键
        """
        return url
    
    def normalized_key(self, url: str) -> str:
        """
        规范化：忽略版本号参数
        /image.jpg?v=1 和 /image.jpg?v=2 是相同缓存键
        """
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        
        # 删除版本号参数
        params = urllib.parse.parse_qs(parsed.query)
        params.pop('v', None)
        
        new_query = urllib.parse.urlencode(params)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{new_query}"
    
    def vary_aware_key(self, url: str, headers: dict) -> str:
        """
        感知Vary头：同一URL根据客户端特征生成不同缓存
        """
        key = url
        
        # 如果响应header中有Vary: Accept-Encoding
        # 需要为不同编码分别缓存
        if 'accept-encoding' in headers.get('vary', '').lower():
            encoding = headers.get('accept-encoding', 'gzip')
            key += f"|{encoding}"
        
        return key
    
    def hash_key(self, url: str) -> str:
        """
        哈希键：压缩长URL
        防止超长URL浪费内存
        """
        import hashlib
        return hashlib.md5(url.encode()).hexdigest()
```

### 4.2 缓存有效期（TTL）

```python
class TTLStrategy:
    """
    根据内容类型设置不同的TTL
    """
    
    def get_ttl(self, content_type: str, url: str) -> int:
        """
        返回秒数
        """
        # 静态资源 (永远不变)
        if self.is_versioned(url):  # /js/app.abc123.js
            return 31536000  # 1年
        
        # 图片
        if content_type.startswith('image/'):
            return 86400  # 1天
        
        # HTML (经常更新)
        if content_type == 'text/html':
            return 3600  # 1小时
        
        # API响应 (实时性高)
        if '/api/' in url:
            return 300  # 5分钟
        
        # 默认
        return 3600
    
    def is_versioned(self, url: str) -> bool:
        """
        判断URL是否包含版本号（可以长期缓存）
        /js/app.abc123.js → True
        /images/logo.png → False
        """
        import re
        # 匹配包含hash的资源
        return bool(re.search(r'\.[a-f0-9]{8,}\.', url))
```

### 4.3 缓存更新策略

```python
class CacheInvalidation:
    """
    缓存失效策略
    """
    
    async def purge_by_url(self, urls: list):
        """
        主动清除特定URL的缓存
        """
        for region in self.regions:
            nodes = self.get_nodes(region)
            for node in nodes:
                for url in urls:
                    await node.delete_cache(url)
    
    async def purge_by_pattern(self, pattern: str):
        """
        按正则表达式删除缓存
        pattern: "/images/.*\.jpg"
        """
        import re
        regex = re.compile(pattern)
        
        for region in self.regions:
            nodes = self.get_nodes(region)
            for node in nodes:
                cached_urls = list(node.cache.keys())
                for url in cached_urls:
                    if regex.match(url):
                        await node.delete_cache(url)
    
    async def update_on_publish(self, content_id: str):
        """
        内容发布时主动更新CDN缓存
        """
        # 1. 获取新内容
        new_content = await self.origin.get_content(content_id)
        
        # 2. 推送给所有边缘节点
        for region in self.regions:
            nodes = self.get_nodes(region)
            for node in nodes:
                await node.update(content_id, new_content)
        
        # 3. 发送缓存失效通知给上层
        await self.notify_upper_tiers(content_id)
    
    async def stale_while_revalidate(self, url: str):
        """
        缓存过期但仍可用的策略
        
        Stale-While-Revalidate: 86400
        表示：缓存过期后，仍可使用1天，但在后台更新
        """
        cache_entry = self.cache.get(url)
        
        if not cache_entry:
            return None  # 缓存不存在
        
        value, expiry_time, last_validated = cache_entry
        current_time = time.time()
        
        if current_time < expiry_time:
            # 缓存有效，直接返回
            return value
        
        # 缓存过期
        if current_time < expiry_time + 86400:
            # 在SWR窗口内，返回过期数据，后台更新
            asyncio.create_task(self.revalidate(url))
            return value
        
        # 超过SWR窗口，需要重新获取
        return await self.get_fresh(url)
    
    async def revalidate(self, url: str):
        """
        后台验证缓存是否仍有效
        """
        response = await self.origin.get(url)
        if response['status'] == 200:
            self.cache[url] = (response['body'], time.time() + 3600, time.time())
```

---

## 五、性能指标与监控

### 5.1 关键指标

```python
class CDNMetrics:
    def __init__(self):
        self.metrics = {
            "cache_hit_ratio": 0,  # 缓存命中率，目标>90%
            "origin_bandwidth": 0,  # 源服务器带宽（越低越好）
            "edge_bandwidth": 0,    # 边缘节点带宽
            "p99_latency": 0,       # 99分位延迟，目标<100ms
            "availability": 0,      # 可用性，目标>99.9%
        }
    
    def calculate_hit_ratio(self, hits: int, misses: int) -> float:
        """
        缓存命中率 = Hits / (Hits + Misses)
        """
        total = hits + misses
        if total == 0:
            return 0
        return hits / total
    
    def estimate_origin_load(self, total_requests: int, hit_ratio: float) -> int:
        """
        源服务器负荷
        = 总请求数 * (1 - 缓存命中率)
        """
        return int(total_requests * (1 - hit_ratio))
    
    def calculate_bandwidth_savings(self, edge_bw: int, origin_bw: int) -> float:
        """
        带宽节省比例
        = (Edge - Origin) / Edge
        """
        if edge_bw == 0:
            return 0
        return (edge_bw - origin_bw) / edge_bw
```

### 5.2 监控告警

```python
class CDNMonitoring:
    async def monitor(self):
        """
        实时监控CDN状态
        """
        while True:
            metrics = {
                "hit_ratio": self.calculate_hit_ratio(),
                "origin_qps": self.get_origin_qps(),
                "edge_latency": self.get_edge_latency(),
                "node_health": self.check_node_health(),
            }
            
            # 告警规则
            if metrics["hit_ratio"] < 0.8:
                await self.alert("缓存命中率过低")
            
            if metrics["origin_qps"] > 10000:
                await self.alert("源服务器QPS过高，考虑增加缓存时间")
            
            if metrics["edge_latency"] > 100:  # ms
                await self.alert("边缘节点延迟高")
            
            await asyncio.sleep(60)
```

---

## 总结

CDN是互联网必备基础设施，关键要点：

1. **地理位置感知DNS**：根据用户位置返回最近节点
2. **分层缓存**：中心→区域→边缘，减少回源
3. **缓存策略**：合理设置TTL，提高命中率
4. **故障转移**：健康检查+自动降级
5. **监控告警**：关注命中率、延迟、源站压力

**商用CDN推荐**：
- 阿里云CDN / 腾讯云CDN（国内）
- Cloudflare / Akamai（国际）
- 自建CDN（超大规模，如Google、Netflix）
