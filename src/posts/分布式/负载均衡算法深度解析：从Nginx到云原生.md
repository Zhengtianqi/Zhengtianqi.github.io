---
title: 负载均衡算法深度解析：从Nginx到云原生
tag: ["负载均衡", "Nginx", "云原生"]
category: 分布式
date: 2026-06-26
---

## 前言

负载均衡是系统架构中最常用的组件。无论是Nginx、HAProxy、还是云原生的Service Mesh，都需要回答同一个问题：

**"这个请求该发给哪个后端服务器？"**

看似简单，但要在高并发、动态扩容、多地域等复杂场景下做出最优决策，需要深入理解各种算法的原理与权衡。

---

## 一、负载均衡的层次

### 1.1 四层 vs 七层

```
ISO/OSI 模型：

第7层 (应用层): HTTP/HTTPS
  └─ 可以看到请求内容 (URL、Header、Body)
  └─ 路由粒度细 (基于URL/Host/Cookie)
  └─ 性能: 中等 (需要解析HTTP)
  └─ 例: Nginx、HAProxy、Envoy

第4层 (传输层): TCP/UDP
  └─ 只能看到IP+Port
  └─ 路由粒度粗 (仅基于IP+Port)
  └─ 性能: 高 (无需解析应用层)
  └─ 例: LVS、F5、云Load Balancer

┌─────────────────────────┐
│  Client                 │
│ 127.0.0.1:12345        │
└────────────┬────────────┘
             │ TCP/IP
    ┌────────▼────────┐
    │ Layer 4 LB      │  ← 只看IP:Port，极快
    │ 10.0.0.1:80    │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Layer 7 LB      │  ← 解析HTTP，精细控制
    │ Nginx/Envoy     │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
 Backend1          Backend2
```

### 1.2 选型建议

| 场景 | 推荐 | 原因 |
|-----|------|------|
| 互联网应用 (HTTP/HTTPS) | 七层 (Nginx/Envoy) | 需要细粒度路由 |
| 金融交易 (TCP协议) | 四层 (LVS/F5) | 高吞吐量，低延迟 |
| 游戏服务器 (UDP) | 四层 (LVS) | UDP无连接 |
| 微服务集群 | 七层 (Service Mesh) | 需要服务发现和熔断 |

---

## 二、七层负载均衡算法

### 2.1 轮询（Round Robin）

**最简单的算法：轮流分配请求**

```
Backend: [A, B, C]
Index: 0

Request 1 → Index % 3 = 0 → Backend A
Request 2 → Index % 3 = 1 → Backend B
Request 3 → Index % 3 = 2 → Backend C
Request 4 → Index % 3 = 0 → Backend A
```

**优点**：简单，分布均匀

**缺点**：不考虑后端状态（忙闲）

**实现**：

```python
class RoundRobinLoadBalancer:
    def __init__(self, backends):
        self.backends = backends
        self.current = 0
    
    def select(self, request):
        backend = self.backends[self.current % len(self.backends)]
        self.current += 1
        return backend
```

### 2.2 加权轮询（Weighted Round Robin）

**为不同后端分配权重**

```
Backends:
  A: weight=5 (5核CPU)
  B: weight=3 (3核CPU)
  C: weight=2 (2核CPU)
Total weight = 10

分配序列：A, A, A, A, A, B, B, B, C, C
（每10个请求分配5+3+2）
```

**实现**：

```python
class WeightedRoundRobinLB:
    def __init__(self, backends):
        """
        backends: [
            {"name": "A", "weight": 5},
            {"name": "B", "weight": 3},
            {"name": "C", "weight": 2},
        ]
        """
        self.backends = backends
        self.total_weight = sum(b['weight'] for b in backends)
        self.current = 0
    
    def select(self, request):
        """
        基于权重轮询
        """
        # 生成权重序列
        weighted_sequence = []
        for backend in self.backends:
            weighted_sequence.extend([backend] * backend['weight'])
        
        selected = weighted_sequence[self.current % len(weighted_sequence)]
        self.current += 1
        return selected
```

**问题**：权重变化需要重新生成序列，效率低

**优化：Smooth Weighted Round Robin**

```python
class SmoothWeightedRoundRobinLB:
    """
    Nginx采用的算法，避免权重大的服务器请求集中
    """
    def __init__(self, backends):
        self.backends = backends
        for b in backends:
            b['effective_weight'] = b['weight']
            b['current_weight'] = 0
    
    def select(self, request):
        """
        选择算法：
        1. 每个backend的current_weight += effective_weight
        2. 选择current_weight最大的backend
        3. 选中backend的current_weight -= total_weight
        """
        total_weight = sum(b['effective_weight'] for b in self.backends)
        
        # 增加权重
        for b in self.backends:
            b['current_weight'] += b['effective_weight']
        
        # 选择最大
        selected = max(self.backends, key=lambda b: b['current_weight'])
        
        # 减去总权重
        selected['current_weight'] -= total_weight
        
        return selected

# 示例
lb = SmoothWeightedRoundRobinLB([
    {"name": "A", "weight": 5, "effective_weight": 5, "current_weight": 0},
    {"name": "B", "weight": 3, "effective_weight": 3, "current_weight": 0},
    {"name": "C", "weight": 2, "effective_weight": 2, "current_weight": 0},
])

# 依次选择
for i in range(10):
    backend = lb.select(None)
    print(backend['name'], end=' ')  # A A A A B B A A B C (平滑分布)
```

### 2.3 最少连接（Least Connections）

**选择当前连接数最少的后端**

```
Backend A: 10 connections
Backend B: 5 connections  ← 选这个
Backend C: 8 connections

下一个请求发给B
```

**适用场景**：长连接（TCP、WebSocket等）

**实现**：

```python
class LeastConnectionsLB:
    def __init__(self, backends):
        self.backends = backends
        for b in backends:
            b['connections'] = 0
    
    def select(self, request):
        """
        选择连接数最少的
        """
        selected = min(self.backends, key=lambda b: b['connections'])
        selected['connections'] += 1
        return selected
    
    def release_connection(self, backend):
        """
        连接释放时调用
        """
        backend['connections'] -= 1
```

### 2.4 一致性哈希（Consistent Hashing）

**同一个客户端的请求总是路由到同一个后端（会话保持）**

```
Request.user_id → hash() → slot位置
          ↓
找圆环上最近的backend
          ↓
每次hash同一user_id，都路由到同一backend
```

**应用场景**：
- 会话亲和性（客户端状态存在后端内存中）
- 缓存热度（同一个key总是打到同一个缓存实例）

**实现**：

```python
import hashlib

class ConsistentHashLB:
    def __init__(self, backends, replicas=150):
        self.backends = backends
        self.replicas = replicas  # 虚拟节点数
        self.ring = {}  # hash值 → backend
        self.sorted_keys = []
        
        self.build_ring()
    
    def build_ring(self):
        """
        构建一致性哈希环
        """
        self.ring = {}
        
        for backend in self.backends:
            for i in range(self.replicas):
                # 每个backend创建replicas个虚拟节点
                virtual_key = f"{backend['name']}:{i}"
                hash_val = int(hashlib.md5(virtual_key.encode()).hexdigest(), 16)
                self.ring[hash_val] = backend
        
        # 排序keys，用于二分查找
        self.sorted_keys = sorted(self.ring.keys())
    
    def select(self, request):
        """
        基于请求特征（如user_id）选择backend
        """
        # 生成请求的哈希值
        key = self.get_hash_key(request)  # e.g., user_id
        hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
        
        # 在环上找顺时针第一个backend
        for ring_hash in self.sorted_keys:
            if ring_hash >= hash_val:
                return self.ring[ring_hash]
        
        # 环形，回到起点
        return self.ring[self.sorted_keys[0]]
    
    def get_hash_key(self, request):
        """
        提取请求的关键字段（保证会话亲和性）
        """
        if hasattr(request, 'cookies') and 'session_id' in request.cookies:
            return request.cookies['session_id']
        elif hasattr(request, 'client_ip'):
            return request.client_ip
        else:
            return request.uri  # 默认用URI
    
    def add_backend(self, backend):
        """
        动态添加backend，只影响部分key
        """
        self.backends.append(backend)
        self.build_ring()
    
    def remove_backend(self, backend):
        """
        移除backend，最少影响请求
        """
        self.backends.remove(backend)
        self.build_ring()
```

**一致性哈希的优势**：

```
普通哈希：N个backend → 扩容到N+1时，所有key重新映射
    影响范围：100%

一致性哈希：只有部分key受影响
    影响范围：1/(N+1) ≈ 9% （扩容到10个backend时）
```

### 2.5 IP哈希（IP Hash）

**基于客户端IP的哈希，实现会话保持**

```
Client IP: 192.168.1.100
Hash(192.168.1.100) % N = Backend索引

同一个客户端 → 同一个IP → 同一个Backend
```

**问题**：
- 客户端IP可能变化 (移动网络)
- 后端扩容时，会话转移

**相比一致性哈希**：
- 一致性哈希更优雅（虚拟节点、部分转移）
- 但IP哈希实现简单，足够用

### 2.6 响应时间加权（Response Time Weighted）

**根据后端的响应时间动态调整权重**

```
Backend A: 平均响应时间 50ms  → 权重高
Backend B: 平均响应时间 200ms → 权重低

根据性能动态调整分配比例
```

**实现**：

```python
class ResponseTimeWeightedLB:
    def __init__(self, backends):
        self.backends = backends
        for b in backends:
            b['response_times'] = []
            b['weight'] = 1.0
        
        self.update_weights_task = asyncio.create_task(self.update_weights())
    
    def record_response(self, backend, response_time):
        """
        记录请求的响应时间
        """
        backend['response_times'].append(response_time)
        
        # 保留最近100个样本
        if len(backend['response_times']) > 100:
            backend['response_times'].pop(0)
    
    async def update_weights(self):
        """
        定期更新权重（基于平均响应时间）
        """
        while True:
            # 计算每个backend的平均响应时间
            avg_times = {}
            for b in self.backends:
                if b['response_times']:
                    avg_times[b['name']] = sum(b['response_times']) / len(b['response_times'])
                else:
                    avg_times[b['name']] = 1000  # 无数据时假设很慢
            
            # 权重 = 最快 / 当前响应时间
            min_time = min(avg_times.values())
            for b in self.backends:
                b['weight'] = min_time / avg_times[b['name']]
            
            await asyncio.sleep(60)  # 每分钟更新一次
    
    def select(self, request):
        """
        使用加权轮询
        """
        weighted_sum = sum(b['weight'] for b in self.backends)
        
        for b in self.backends:
            b['current_weight'] += b['weight']
        
        selected = max(self.backends, key=lambda b: b['current_weight'])
        selected['current_weight'] -= weighted_sum
        
        return selected
```

---

## 三、四层负载均衡 (LVS)

### 3.1 LVS原理

```
传统负载均衡：
    Client
       │
    LB (改包源IP/目标IP)
       │
    Backend

LVS (Linux Virtual Server)：
    Client
       │
    Director (LVS)
       │
    ┌──┴──┐
    ▼     ▼
  RS1    RS2  (Real Server)

Director和RS在同一局域网，通过MAC地址转发
```

### 3.2 三种转发模式

#### **NAT模式（Network Address Translation）**

```
请求：Client(192.168.1.1) → LB(10.0.0.1) → RS(10.0.0.2)
  LB修改：
    目标IP: VIP → RS IP
    源IP: Client IP → LB IP
  RS看到的是来自LB的请求

响应：RS(10.0.0.2) → LB(10.0.0.1) → Client(192.168.1.1)
  LB修改：
    源IP: LB IP → VIP
    目标IP: RS IP → Client IP

特点：
  ✓ 简单，支持不同网段
  ✗ 所有流量都过LB，LB成为瓶颈
  ✗ RS无法感知真实Client IP（需特殊处理）
```

#### **直接路由（DR模式）**

```
请求：Client → LB → RS
  LB仅修改MAC地址（二层）
  不修改IP地址
  RS看到的源IP就是Client IP

响应：RS → Client（直接，不经过LB）
  RS配置了VIP，响应时源IP是VIP

特点：
  ✓ LB不是瓶颈
  ✓ 响应直接返回，高效
  ✗ 要求LB和RS在同一网段
  ✗ RS需要配置特殊路由表
```

#### **隧道模式（Tunnel）**

```
请求：Client → LB → RS (LB在IP包外再包一层LB IP头)
  LB: 源IP(LB) 目标IP(RS)
    └─ 内层：源IP(Client) 目标IP(VIP)

RS接收时解开外层，看到Client IP

响应：RS → Client（直接）

特点：
  ✓ RS可以跨域名
  ✓ 响应不过LB
  ✗ 需要RS支持隧道解包
```

### 3.3 LVS配置示例

```bash
# 安装LVS
apt-get install ipvsadm

# 添加虚拟服务
# -A: 添加虚拟服务
# -t: TCP服务
# -s rr: 轮询调度算法
ipvsadm -A -t 10.0.0.1:80 -s rr

# 添加真实服务器
# -a: 添加真实服务器
# -r: 指定真实服务器地址
# -g: 使用DR模式（直接路由）
ipvsadm -a -t 10.0.0.1:80 -r 10.0.0.2:80 -g -w 100  # 权重100
ipvsadm -a -t 10.0.0.1:80 -r 10.0.0.3:80 -g -w 100

# 查看配置
ipvsadm -L -n

# 清空所有配置
ipvsadm -C
```

---

## 四、云原生负载均衡

### 4.1 Kubernetes Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP  # ClusterIP / NodePort / LoadBalancer / ExternalName
  sessionAffinity: ClientIP  # 会话保持
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3小时
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**K8s Service的负载均衡**：
- 默认：轮询 (iptables / IPVS)
- sessionAffinity: ClientIP 实现会话保持
- 支持自定义负载均衡器

### 4.2 Istio VirtualService 高级特性

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-service
spec:
  hosts:
  - my-service
  http:
  - match:
    - uri:
        prefix: "/heavy"  # 重操作
    route:
    - destination:
        host: my-service
        subset: v1
      weight: 100
    timeout: 30s  # 延长超时
  
  - match:
    - uri:
        prefix: "/light"  # 轻操作
    route:
    - destination:
        host: my-service
        subset: v2
      weight: 100
    timeout: 5s  # 缩短超时
  
  - route:  # 默认：金丝雀
    - destination:
        host: my-service
        subset: stable
      weight: 90
    - destination:
        host: my-service
        subset: canary
      weight: 10

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-service
spec:
  host: my-service
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpCookie:
          name: "sid"
          ttl: 3600s
    connectionPool:
      http:
        http1MaxPendingRequests: 1000
        http2MaxRequests: 10000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
```

---

## 五、性能对比与选型

### 5.1 性能基准

```
Algorithm        | Ops/sec | Latency | 会话保持
─────────────────|---------|---------|─────────
轮询             | 100K    | <1ms    | ✗
加权轮询         | 95K     | <1ms    | ✗
最少连接         | 80K     | <1ms    | ✗
一致性哈希       | 70K     | <2ms    | ✓
响应时加权       | 50K     | <5ms    | ✗
LVS (DR)         | 1M+     | <0.1ms  | ✗
LVS (IP Hash)    | 1M+     | <0.1ms  | ✓
```

### 5.2 选型矩阵

```
需要会话保持？
  ├─ Yes
  │  ├─ HTTP / 七层 → 一致性哈希
  │  └─ TCP / 四层 → LVS DR + IP Hash
  │
  └─ No
     ├─ 简单应用 → 轮询
     ├─ 性能敏感 → 最少连接或LVS
     └─ 高级需求 → Istio + 智能路由
```

---

## 总结

| 算法 | 适用场景 | 复杂度 |
|-----|---------|-------|
| **轮询** | 简单应用 | 低 |
| **加权轮询** | 后端性能差异大 | 低 |
| **最少连接** | 长连接、WebSocket | 中 |
| **一致性哈希** | 会话保持、缓存 | 中 |
| **响应时加权** | 动态性能变化 | 高 |
| **LVS** | 超大规模、高吞吐 | 高 |
| **Istio** | 微服务、灾备 | 高 |

**黄金法则**：
1. 优先用Nginx（简单、高效、成熟）
2. 微服务用Istio（细粒度控制）
3. 超大规模用LVS（性能天花板）
