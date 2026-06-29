---
title: API网关安全：WAF、限流、签名与黑白名单实践
tag: ["WAF", "限流", "签名", "黑白名单"]
category: 安全
date: 2026-06-26
---

# API网关安全：WAF、限流、签名与黑白名单实践

> 数字签名是现代密码学的重要应用，它通过非对称加密技术为数字内容提供身份认证和完整性验证。
> 本文介绍了数字签名的原理和实现方式，帮助你理解这一核心安全技术。

```
┌──────────────────────────┐
│ 应用层                    │
│ ├─ 业务逻辑               │
│ └─ 数据验证               │
├──────────────────────────┤
│ API网关层（重点）         │
│ ├─ WAF（应用层防火墙）   │
│ ├─ 限流                   │
│ ├─ 签名验证               │
│ ├─ IP黑白名单             │
│ └─ DDoS防护               │
├──────────────────────────┤
│ 传输层                    │
│ ├─ HTTPS/TLS              │
│ └─ CA证书                 │
├──────────────────────────┤
│ 网络层                    │
│ ├─ 防火墙                 │
│ ├─ CDN/WAF                │
│ └─ 入侵检测（IDS）        │
└──────────────────────────┘

各层独立防护，纵深防御
```

## 二、WAF（Web Application Firewall）

### 2.1 常见Web攻击与防护

```
攻击类型          示例                防护方式
─────────────────────────────────────────
SQL注入          ' OR '1'='1         参数化查询、输入过滤
XSS              <script>alert()</script>  HTML转义、CSP
CSRF             跨站请求伪造         CSRF token验证
XXE              XML外部实体攻击      禁用外部实体解析
路径遍历         ../../../etc/passwd  路径规范化
命令注入         ; rm -rf /          禁用危险字符
DDoS             海量并发请求         限流、IP黑名单
```

### 2.2 WAF规则引擎

```python
# API网关安全：WAF、限流、签名与黑白名单实践


class WAFEngine:
    """
    WAF规则引擎
    """
    
    def __init__(self):
        self.rules = []
    
    def add_rule(self, pattern: str, action: str):
        """
        添加WAF规则
        pattern: 正则表达式
        action: "BLOCK" / "LOG" / "ALLOW"
        """
        self.rules.append({'pattern': pattern, 'action': action})
    
    def check_request(self, request) -> bool:
        """
        检查请求是否触发WAF规则
        返回True表示通过，False表示被阻止
        """
        for rule in self.rules:
            if self.match_rule(request, rule['pattern']):
                if rule['action'] == 'BLOCK':
                    return False  # 阻止请求
                elif rule['action'] == 'LOG':
                    self.log_suspicious(request, rule)
                    # 继续检查其他规则
        
        return True  # 通过所有规则
    
    def match_rule(self, request, pattern: str) -> bool:
        """
        匹配规则
        """
        import re
        
        # 检查URL、参数、请求头、Body
        targets = [
            request.path,
            str(request.args),
            str(request.headers),
            request.get_data(as_text=True)
        ]
        
        for target in targets:
            if re.search(pattern, target, re.IGNORECASE):
                return True
        
        return False

# WAF规则示例
waf = WAFEngine()

# SQL注入防护
waf.add_rule(
    r"(\sunion\s|select\s|insert\s|update\s|delete\s|drop\s)",
    "BLOCK"  # 阻止SQL关键字
)

# XSS防护
waf.add_rule(
    r"(<script|javascript:|onerror=|onclick=)",
    "BLOCK"  # 阻止恶意脚本
)

# 路径遍历防护
waf.add_rule(
    r"(\.\./|\.\.\\)",
    "BLOCK"  # 阻止目录遍历
)

# 命令注入防护
waf.add_rule(
    r"(;|&&|\||`|\$\()",
    "LOG"  # 记录但不阻止（可能有误报）
)
```

### 2.3 商用WAF推荐

```
国内：
  ├─ 阿里云WAF（云盾）
  ├─ 腾讯云WAF
  ├─ 360网站卫士
  └─ 奇安信WebDefense

国际：
  ├─ CloudFlare WAF（免费/付费）
  ├─ AWS WAF
  ├─ Azure WAF
  └─ Imperva SecureSphere
  
开源：
  ├─ ModSecurity
  ├─ Coraza（ModSecurity 3）
  └─ libModSecurity
```

## 三、限流（Rate Limiting）

### 3.1 限流算法

#### **1. 固定窗口（Fixed Window）**

```
最简单，但有边界问题

时间线：
  08:00:00 ├─────────────────┤ 08:01:00  (第1分钟，限100请求)
  08:01:00 ├─────────────────┤ 08:02:00  (第2分钟，限100请求)
  
场景：08:00:59秒的最后一秒来了50个请求
      08:01:00秒的第一秒来了50个请求
      实际上100请求在2秒内完成，超过实际限流！

代码：
```

```python
class FixedWindowRateLimiter:
    def __init__(self, max_requests: int, window_size: int):
        self.max_requests = max_requests  # 最大请求数
        self.window_size = window_size    # 时间窗口（秒）
        self.requests = {}                # {user_id: [timestamps]}
    
    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        window_start = int(now) // self.window_size * self.window_size
        
        # 获取当前窗口的请求列表
        key = f"{user_id}:{window_start}"
        
        if key not in self.requests:
            self.requests[key] = []
        
        # 检查当前窗口是否超限
        if len(self.requests[key]) >= self.max_requests:
            return False
        
        self.requests[key].append(now)
        return True
```

#### **2. 滑动窗口（Sliding Window）**

```
解决固定窗口的边界问题

时间线：
  ├─10秒前 ─── 5秒前 ─── 现在
  │
  └─ 只统计最近10秒内的请求

特点：
  ✓ 精确度高
  ✗ 内存占用大（需存储所有时间戳）
  ✗ 计算复杂度高
```

```python
class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_size: int):
        self.max_requests = max_requests
        self.window_size = window_size
        self.requests = {}  # {user_id: [timestamps]}
    
    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        # 删除窗口外的请求
        cutoff_time = now - self.window_size
        self.requests[user_id] = [
            ts for ts in self.requests[user_id]
            if ts > cutoff_time
        ]
        
        # 检查是否超限
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(now)
        return True
```

#### **3. 令牌桶（Token Bucket）**

**最常用，支持突发流量**

```
概念：
  ├─ 桶容量：100个令牌
  ├─ 补充速率：10个令牌/秒（1000请求/100秒）
  ├─ 每个请求消耗1个令牌
  └─ 令牌不足则拒绝请求

特点：
  ✓ 支持突发（预存令牌）
  ✓ 精确度高
  ✓ 适合生产环境
  ✗ 需要定时器补充令牌
```

```python
class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate: float):
        """
        capacity: 桶容量（最多存多少令牌）
        refill_rate: 补充速率（令牌/秒）
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = {}  # {user_id: {'tokens': float, 'last_refill': float}}
    
    def is_allowed(self, user_id: str, tokens_needed: int = 1) -> bool:
        now = time.time()
        
        if user_id not in self.tokens:
            self.tokens[user_id] = {
                'tokens': self.capacity,
                'last_refill': now
            }
        
        user_bucket = self.tokens[user_id]
        
        # 补充令牌
        time_passed = now - user_bucket['last_refill']
        user_bucket['tokens'] = min(
            self.capacity,
            user_bucket['tokens'] + time_passed * self.refill_rate
        )
        user_bucket['last_refill'] = now
        
        # 检查是否有足够令牌
        if user_bucket['tokens'] >= tokens_needed:
            user_bucket['tokens'] -= tokens_needed
            return True
        
        return False

# 使用示例
limiter = TokenBucketRateLimiter(capacity=100, refill_rate=10)

for i in range(150):
    if limiter.is_allowed('user123'):
        print(f"Request {i} allowed")
    else:
        print(f"Request {i} REJECTED (rate limit)")
    
    time.sleep(0.05)  # 20请求/秒
```

### 3.2 分布式限流（Redis实现）

```python
import redis
from datetime import datetime, timedelta

class DistributedRateLimiter:
    """
    基于Redis的分布式限流
    
    当有多个网关服务器时，需要统一的限流
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def is_allowed(self, user_id: str, max_requests: int, window_seconds: int) -> bool:
        """
        使用Redis Lua脚本实现原子性限流
        """
        key = f"rate_limit:{user_id}"
        
        # Lua脚本保证原子性
        lua_script = """
        local key = KEYS[1]
        local max_requests = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- 获取当前请求数
        local current = tonumber(redis.call('GET', key)) or 0
        
        if current < max_requests then
            -- 还有配额，增加计数
            redis.call('INCR', key)
            redis.call('EXPIRE', key, window)
            return 1  -- 允许
        else
            return 0  -- 拒绝
        end
        """
        
        result = self.redis.eval(
            lua_script,
            1,
            key,
            max_requests,
            window_seconds,
            int(time.time())
        )
        
        return result == 1

# 使用示例
redis_client = redis.Redis(host='localhost', port=6379)
limiter = DistributedRateLimiter(redis_client)

if limiter.is_allowed('user123', max_requests=100, window_seconds=60):
    # 处理请求
    pass
else:
    # 返回429 Too Many Requests
    return {'error': 'Rate limit exceeded'}, 429
```

## 四、请求签名验证

### 4.1 场景

```
问题：第三方应用调用你的API，如何证明请求来自可信源？

解决：请求签名
  ├─ 第三方应用用私钥签名请求
  ├─ API网关用公钥验证签名
  └─ 防止中间人篡改请求
```

### 4.2 实现方案

```python
import hmac
import hashlib
import time
from base64 import b64encode

class APISignature:
    """
    API请求签名验证
    """
    
    @staticmethod
    def generate_signature(method: str, path: str, body: str, timestamp: str, secret: str) -> str:
        """
        客户端：生成签名
        
        签名内容：
          string_to_sign = METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + BODY
          signature = HMAC-SHA256(string_to_sign, SECRET)
        """
        string_to_sign = f"{method}\n{path}\n{timestamp}\n{body}"
        
        signature = hmac.new(
            secret.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        return b64encode(signature).decode('utf-8')
    
    @staticmethod
    def verify_signature(request, app_secret: str, max_age_seconds: int = 300) -> bool:
        """
        服务端：验证签名
        """
        # 1. 检查必要的签名头
        signature = request.headers.get('X-Signature')
        timestamp = request.headers.get('X-Timestamp')
        app_id = request.headers.get('X-App-ID')
        
        if not (signature and timestamp and app_id):
            return False
        
        # 2. 检查时间戳（防止重放攻击）
        try:
            request_time = int(timestamp)
            current_time = int(time.time())
            
            if abs(current_time - request_time) > max_age_seconds:
                return False  # 请求太旧
        except ValueError:
            return False
        
        # 3. 重新计算签名
        body = request.get_data(as_text=True)
        expected_signature = APISignature.generate_signature(
            request.method,
            request.path,
            body,
            timestamp,
            app_secret
        )
        
        # 4. 使用恒定时间比较（防止时序攻击）
        return hmac.compare_digest(signature, expected_signature)

# 客户端使用示例
class APIClient:
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
    
    def make_request(self, method: str, path: str, body: str = ""):
        """发送带签名的请求"""
        timestamp = str(int(time.time()))
        
        signature = APISignature.generate_signature(
            method, path, body, timestamp, self.app_secret
        )
        
        headers = {
            'X-App-ID': self.app_id,
            'X-Timestamp': timestamp,
            'X-Signature': signature
        }
        
        response = requests.request(
            method, f"https://api.example.com{path}",
            data=body,
            headers=headers
        )
        
        return response

# 服务端使用示例（Flask）
app = Flask(__name__)

# 存储已注册应用的密钥
REGISTERED_APPS = {
    'client_001': 'secret_key_001',
    'client_002': 'secret_key_002'
}

@app.before_request
def verify_signature():
    """在每个请求前验证签名"""
    app_id = request.headers.get('X-App-ID')
    
    if app_id not in REGISTERED_APPS:
        return {'error': 'Unknown app'}, 401
    
    app_secret = REGISTERED_APPS[app_id]
    
    if not APISignature.verify_signature(request, app_secret):
        return {'error': 'Invalid signature'}, 401

@app.route('/api/data', methods=['GET', 'POST'])
def get_data():
    """需要签名的API"""
    return {'data': 'sensitive information'}
```

## 五、IP黑白名单

### 5.1 实现

```python
class IPWhitelistBlacklist:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def add_to_whitelist(self, ip: str, ttl: int = None):
        """添加IP到白名单"""
        key = f"ip:whitelist:{ip}"
        self.redis.set(key, 1, ex=ttl)
    
    def add_to_blacklist(self, ip: str, reason: str, ttl: int = 3600):
        """添加IP到黑名单"""
        key = f"ip:blacklist:{ip}"
        self.redis.set(key, reason, ex=ttl)  # 默认黑名单1小时
    
    def is_whitelisted(self, ip: str) -> bool:
        """检查IP是否在白名单中"""
        return self.redis.exists(f"ip:whitelist:{ip}")
    
    def is_blacklisted(self, ip: str) -> bool:
        """检查IP是否在黑名单中"""
        return self.redis.exists(f"ip:blacklist:{ip}")
    
    def check_access(self, ip: str) -> bool:
        """检查IP是否允许访问"""
        # 1. 如果在黑名单中，直接拒绝
        if self.is_blacklisted(ip):
            return False
        
        # 2. 如果有白名单，只允许白名单中的IP
        has_whitelist = self.redis.exists("ip:whitelist:*")
        if has_whitelist:
            return self.is_whitelisted(ip)
        
        # 3. 默认允许
        return True

# Flask集成
@app.before_request
def check_ip_whitelist_blacklist():
    """检查IP是否被允许"""
    client_ip = request.remote_addr
    
    if not ip_filter.check_access(client_ip):
        return {'error': 'Access denied'}, 403

# 管理API
@app.route('/admin/ip-whitelist', methods=['POST'])
@admin_required
def add_whitelist():
    """添加IP到白名单"""
    ip = request.json.get('ip')
    ip_filter.add_to_whitelist(ip)
    return {'success': True}

@app.route('/admin/ip-blacklist', methods=['POST'])
@admin_required
def add_blacklist():
    """添加IP到黑名单"""
    ip = request.json.get('ip')
    reason = request.json.get('reason')
    ip_filter.add_to_blacklist(ip, reason)
    return {'success': True}
```

## 总结

API网关安全检查清单：

- [ ] WAF规则定期更新
- [ ] 限流配置合理（支持突发）
- [ ] 请求签名验证（防篡改）
- [ ] IP黑白名单（防暴力）
- [ ] 日志记录完整（审计追踪）
- [ ] HTTPS强制（加密传输）
- [ ] 异常告警完善（快速响应）
- [ ] 定期安全测试（发现漏洞）

**黄金法则**：
1. 纵深防御（多层防护）
2. 最小权限（只开放必要端口）
3. 监控告警（及时发现异常）
4. 定期更新（跟进安全补丁）
