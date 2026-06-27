---
title: 部署策略对比：蓝绿 vs 金丝雀 vs 滚动，怎么选
tag: ["CICD"]
date: 2026-06-12
category: CICD
---

# 部署策略对比：蓝绿 vs 金丝雀 vs 滚动，怎么选

> 部署策略选错，轻则用户体验受损，重则生产事故。本文从原理到实践，帮你做出正确选择。

## 1. 四种主流部署策略图解

### 1.1 策略全景图

```
┌─────────────────────────────────────────────────────────────────┐
│                      四种部署策略对比                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  滚动更新（Rolling Update）                                      │
│  ┌───┐     ┌───┐     ┌───┐     ┌───┐                           │
│  │ v1 │ →  │ v2 │ →  │ v2 │ →  │ v2 │  逐个替换                   │
│  └───┘     └───┘     └───┘     └───┘                           │
│  ┌───┐     ┌───┐     ┌───┐     ┌───┐                           │
│  │ v1 │     │ v1 │ →  │ v2 │ →  │ v2 │                           │
│  └───┘     └───┘     └───┘     └───┘                           │
│  ┌───┐     ┌───┐     ┌───┐     ┌───┐                           │
│  │ v1 │     │ v1 │     │ v1 │ →  │ v2 │                           │
│  └───┘     └───┘     └───┘     └───┘                           │
│                                                                 │
│  蓝绿部署（Blue-Green）                                          │
│   ┌─────────────────┐         ┌─────────────────┐               │
│   │    Blue (v1)    │  切换 → │   Green (v2)    │               │
│   │   所有流量在这里    │ ──────→│   所有流量切过来   │               │
│   └─────────────────┘         └─────────────────┘               │
│                                                                 │
│  金丝雀发布（Canary）                                            │
│   流量: 90% v1  ──┐                                             │
│                  ├──→ 观察指标 → 10% OK → 50% → 100%             │
│   流量: 10% v2  ──┘                                             │
│                                                                 │
│  A/B 测试                                                        │
│   用户群A → v1 (对照组)                                          │
│   用户群B → v2 (实验组)  → 对比转化率/留存率                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 一图看懂对比

| 策略 | 部署时间 | 资源需求 | 回滚速度 | 风险控制 | 用户影响 |
|------|---------|---------|---------|---------|---------|
| 滚动更新 | 中 | 原有 | 中 | 中 | 部分用户短暂影响 |
| 蓝绿部署 | 快 | 2x | 极快（秒级） | 高 | 零影响（切换瞬间除外） |
| 金丝雀发布 | 慢 | 原有+ | 快 | 极高 | 小部分用户可能有影响 |
| A/B 测试 | - | - | - | - | 见下文区分 |

---

## 2. 滚动更新：原理、K8s 实现、优缺点

### 2.1 滚动更新原理

滚动更新（Rolling Update）是最常见的部署策略。它**逐步用新版本替换旧版本的实例**，在这个过程中，服务始终保持可用。

```
时间线：

T0: [v1] [v1] [v1]        全部旧版本运行
T1: [v2] [v1] [v1]        启动 1 个新版本，停止 1 个旧版本
T2: [v2] [v2] [v1]        继续替换
T3: [v2] [v2] [v2]        全部替换完成

关键参数：
  maxSurge：部署过程中允许超出期望副本数的最大数量（默认 25%）
  maxUnavailable：部署过程中允许不可用的最大数量（默认 25%）
```

### 2.2 K8s 实现

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 6
  # ─── 滚动更新策略 ───
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2         # 最多额外创建 2 个 Pod（总数不超过 8）
      maxUnavailable: 1   # 最多 1 个 Pod 不可用（始终 ≥ 5 个 Pod 服务）

  selector:
    matchLabels:
      app: myapp

  template:
    metadata:
      labels:
        app: myapp
        version: "2.0.0"  # ← 更新这个标签触发滚动更新
    spec:
      containers:
      - name: myapp
        image: myapp:2.0.0
        ports:
        - containerPort: 8080

        # ─── 就绪探针（Readiness Probe） ───
        # 关键！确保新 Pod 真正就绪后才接收流量
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10  # 启动后等 10 秒再检查
          periodSeconds: 5         # 每 5 秒检查一次
          failureThreshold: 3      # 连续失败 3 次判定为未就绪

        # ─── 存活探针（Liveness Probe） ───
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10

        # ─── 优雅停机 ───
        lifecycle:
          preStop:
            exec:
              command:
                - /bin/sh
                - -c
                - |
                  # 1. 先从 Service 摘除（不接收新请求）
                  # 2. 等待现有请求处理完成
                  sleep 15
```

**执行滚动更新**：

```bash
# 更新镜像触发滚动更新
kubectl set image deployment/myapp myapp=myapp:2.0.0

# 查看滚动更新状态
kubectl rollout status deployment/myapp

# 如果发现问题，回滚
kubectl rollout undo deployment/myapp

# 回滚到指定版本
kubectl rollout undo deployment/myapp --to-revision=3

# 查看回滚历史
kubectl rollout history deployment/myapp

# 暂停/恢复滚动更新
kubectl rollout pause deployment/myapp
kubectl rollout resume deployment/myapp
```

### 2.3 滚动更新的优缺点

```
优点：
  ├── 零停机：始终有足够的 Pod 服务流量
  ├── 资源节省：不需要额外的资源
  ├── 逐步替换：问题影响范围可控
  └── K8s 原生支持：配置简单，开箱即用

缺点：
  ├── 回滚慢：需要重新滚动回去（和部署一样的时间）
  ├── 版本混合：部署期间新旧版本同时存在
  │   └── 可能导致兼容性问题（新 API + 旧数据库 schema）
  ├── 无法定向测试：不能只给部分用户用新版
  └── 依赖 Readiness Probe：探针配错了会导致雪崩
```

**适用场景**：一般 Web 服务、API 服务，对兼容性要求不高的场景。

---

## 3. 蓝绿部署：原理、流量切换、成本分析

### 3.1 蓝绿部署原理

蓝绿部署（Blue-Green）的核心思想是：**准备两套完全相同的环境**，一套运行旧版本（蓝色），一套部署新版本（绿色）。验证新版本没问题后，**一键切换流量**。

```
┌──────────────────────────────────────────────────────────┐
│                     蓝绿部署流程                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: 初始状态                                        │
│         ┌─────────────┐                                  │
│  用户 → │  Blue (v1)  │  ← 100% 流量                      │
│         └─────────────┘                                  │
│         ┌─────────────┐                                  │
│         │  Green (空)  │  ← 空闲                          │
│         └─────────────┘                                  │
│                                                          │
│  Step 2: 部署新版本                                      │
│         ┌─────────────┐                                  │
│  用户 → │  Blue (v1)  │  ← 100% 流量                      │
│         └─────────────┘                                  │
│         ┌─────────────┐                                  │
│         │ Green (v2)  │  ← 已部署，无流量，可充分验证        │
│         └─────────────┘                                  │
│                                                          │
│  Step 3: 切换流量                                       │
│         ┌─────────────┐                                  │
│         │  Blue (v1)  │  ← 0% 流量（备用回滚）             │
│         └─────────────┘                                  │
│         ┌─────────────┐                                  │
│  用户 → │ Green (v2)  │  ← 100% 流量                      │
│         └─────────────┘                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 K8s Service 切换实现

```yaml
# ─── blue-deployment.yaml ───
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0

---
# ─── green-deployment.yaml ───
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
      - name: myapp
        image: myapp:2.0.0

---
# ─── service.yaml（关键：通过修改 selector 切换流量） ───
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # ← 一开始指向 blue
    # 切换时改为 version: green
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

**一键切换脚本**：

```bash
#!/bin/bash
# switch-traffic.sh

CURRENT=$(kubectl get service myapp -o jsonpath='{.spec.selector.version}')
echo "当前活跃环境: $CURRENT"

if [ "$CURRENT" == "blue" ]; then
  TARGET="green"
else
  TARGET="blue"
fi

echo "切换流量到: $TARGET"

# 切换 Service 的 selector
kubectl patch service myapp -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET\"}}}"

echo "流量已切换到 $TARGET"

# 等待切换生效
sleep 5

# 健康检查
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://myapp.example.com/health)
if [ "$HEALTH" == "200" ]; then
  echo "✅ 切换成功，健康检查通过"
else
  echo "❌ 健康检查失败，立即回滚！"
  ROLLBACK=$CURRENT
  kubectl patch service myapp -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK\"}}}"
  echo "已回滚到 $ROLLBACK"
fi
```

### 3.3 蓝绿部署的成本分析

```
┌──────────────────────────────────────────────────────────┐
│              蓝绿部署的成本                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  基础设施成本: ×2                                          │
│  ├── 始终需要两套环境（3 Blue + 3 Green = 6 个 Pod）        │
│  └── 如果数据库也复制 → 成本更高                            │
│                                                          │
│  数据库挑战:                                               │
│  ├── 两套环境共享一个数据库？→ 新旧版本 schema 兼容问题        │
│  ├── 两套环境独立数据库？→ 需要数据同步                      │
│  └── 推荐: 数据库向后兼容迁移（先迁移 schema，再部署代码）      │
│                                                          │
│  适用条件:                                                │
│  ├── 对可用性要求极高（金融交易、支付系统）                    │
│  ├── 能承受 2x 基础设施成本                                │
│  ├── 数据库 schema 向后兼容或能处理数据迁移                   │
│  └── 回滚时间要求 < 1 分钟                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**优缺点**：

```
优点：
  ├── 回滚极快（秒级）：只需把流量切回去
  ├── 零停机：切换瞬间对用户透明
  ├── 提前验证：Green 环境可以充分测试后再切流量
  └── 隔离性好：新版本不影响旧版本

缺点：
  ├── 成本翻倍：需要 2 倍的硬件资源
  ├── 数据库难题：schema 迁移需要特殊处理
  ├── 长连接问题：WebSocket、gRPC 长连接切换时可能断开
  └── 非生产流量丢失：切换时正在处理的事务可能中断
```

---

## 4. 金丝雀发布：原理、流量规则、回滚机制

### 4.1 金丝雀发布原理

金丝雀（Canary）的名字来源于煤矿工人带金丝雀下井检测毒气。部署中同样：**先让一小部分用户"试毒"，没问题再逐步扩大**。

```
时间线:
  T0:  v1:100%                         全部用户访问旧版
  T1:  v1:95%,  v2:5%                  5% 用户访问新版（观察 10 分钟）
  T2:  v1:75%,  v2:25%                 扩大到 25%
  T3:  v1:50%,  v2:50%                 扩大到 50%
  T4:  v1:25%,  v2:75%                 扩大到 75%
  T5:  v1:0%,   v2:100%                全量切换

  任何时候发现指标异常 → 立即回滚到 v1:100%
```

### 4.2 Istio + K8s 实现金丝雀

```yaml
# ─── 两个 Deployment ───
# myapp-v1（稳定版）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-v1
spec:
  replicas: 9
  selector:
    matchLabels:
      app: myapp
      version: v1
  template:
    metadata:
      labels:
        app: myapp
        version: v1
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0

---
# myapp-v2（金丝雀版）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
      version: v2
  template:
    metadata:
      labels:
        app: myapp
        version: v2
    spec:
      containers:
      - name: myapp
        image: myapp:2.0.0

---
# ─── Istio VirtualService：控制流量分配 ───
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp.example.com
  http:
  - match:
    - headers:
        canary:
          exact: "true"            # ← 携带此 Header 的请求强制走金丝雀
    route:
    - destination:
        host: myapp
        subset: v2
  - route:
    - destination:
        host: myapp
        subset: v1
      weight: 90                  # 90% 流量 → v1
    - destination:
        host: myapp
        subset: v2
      weight: 10                  # 10% 流量 → v2

---
# ─── DestinationRule：定义子集 ───
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp
spec:
  host: myapp
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

**逐步扩大金丝雀**：

```bash
#!/bin/bash
# canary-promotion.sh

# 10% → 25%
echo "扩大金丝雀到 25%..."
kubectl scale deployment myapp-v2 --replicas=3
kubectl patch virtualservice myapp --type=json -p='[
  {"op":"replace","path":"/spec/http/0/route/0/weight","value":75},
  {"op":"replace","path":"/spec/http/0/route/1/weight","value":25}
]'

# 观察指标
echo "等待 10 分钟观察指标..."
sleep 600  # 自动化环境中应该是监控循环

# 检查错误率
ERROR_RATE=$(curl -s http://prometheus:9090/api/v1/query?query=rate(http_errors_total{version=\"v2\"}[5m]))
if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  echo "!!! 错误率超标，立即回滚 !!!"
  kubectl scale deployment myapp-v2 --replicas=0
  kubectl patch virtualservice myapp --type=json -p='[
    {"op":"replace","path":"/spec/http/0/route/0/weight","value":100},
    {"op":"replace","path":"/spec/http/0/route/1/weight","value":0}
  ]'
  exit 1
fi

echo "✅ 指标正常，继续扩大到 50%..."
# ... 继续扩大的逻辑
```

### 4.3 金丝雀的监控指标体系

```
┌──────────────────────────────────────────────────────────┐
│           金丝雀发布监控仪表盘                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  必须监控的指标（Golden Signals）：                         │
│                                                          │
│  1. 延迟（Latency）                                       │
│     ├── P50、P95、P99 延迟                                │
│     └── 对比 v1 vs v2 的延迟差异                           │
│                                                          │
│  2. 流量（Traffic）                                       │
│     ├── QPS（每秒请求数）                                  │
│     └── 确认流量分配比例是否正确                            │
│                                                          │
│  3. 错误率（Errors）                                      │
│     ├── 5xx 错误率                                        │
│     ├── 业务异常率                                        │
│     └── v2 的错误率 vs v1 的错误率                         │
│                                                          │
│  4. 饱和度（Saturation）                                  │
│     ├── CPU / 内存 / 磁盘使用率                            │
│     └── 连接池、线程池饱和度                               │
│                                                          │
│  可选的业务指标：                                          │
│  ├── 下单成功率 vs 下单量                                  │
│  ├── 支付成功率                                           │
│  └── 用户留存率（需要更长时间观察）                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 5. A/B 测试 vs 金丝雀发布的区别

### 5.1 本质不同

这是一个最常见的混淆点。两者都在"分流"，但目的完全不同：

| 维度 | 金丝雀发布（Canary） | A/B 测试 |
|------|-------------------|---------|
| **目的** | 降低发布风险 | 验证业务假设 |
| **关注的指标** | 错误率、延迟、CPU | 转化率、留存率、点击率 |
| **决策方式** | 指标是否安全 | 哪个版本效果更好 |
| **持续时间** | 分钟到小时 | 天到周 |
| **最终结果** | 全量上线或回滚 | 选更好的版本全量上线 |
| **分流方式** | 随机分流 | 按用户 ID 哈希分流（保证一致性） |
| **典型场景** | "新版本会不会崩？" | "新按钮能提升转化率吗？" |

### 5.2 实例对比

```
金丝雀发布（Canary）场景：
  → 后端 API 升级 v1 → v2
  → 先给 10% 流量走 v2
  → 观察错误率、延迟 30 分钟
  → 没问题 → 100% v2
  → 问题：v2 和 v1 功能完全一致，只是代码变了

A/B 测试场景：
  → 前端首页改版
  → 50% 用户看旧版（对照组），50% 看新版（实验组）
  → 观察 7 天：新版注册转化率 4.2% vs 旧版 3.8%
  → 新版胜出 → 100% 切换新版
  → 问题：两个版本功能不一样，要验证哪个更好
```

### 5.3 A/B 测试的技术实现

```yaml
# Istio：按 Header 分流（用户 ID 哈希保证一致性）
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: frontend-ab
spec:
  http:
  - match:
    - headers:
        cookie:
          regex: ".*ab_group=experiment.*"
    route:
    - destination:
        host: frontend
        subset: experiment       # 实验组
  - match:
    - headers:
        cookie:
          regex: ".*ab_group=control.*"
    route:
    - destination:
        host: frontend
        subset: control          # 对照组
  - route:                       # 无 Cookie 的用户随机分配
    - destination:
        host: frontend
        subset: control
      weight: 50
    - destination:
        host: frontend
        subset: experiment
      weight: 50
```

---

## 6. 选择框架：根据业务场景选策略

### 6.1 决策树

```
开始 ──→ 你有 2x 的资源预算吗？
           │
     ┌─────┴─────┐
     │ YES       │ NO
     ▼           ▼
  蓝绿部署      你能接受新旧版本同时运行吗？
  （秒级回滚）       │
             ┌─────┴─────┐
             │ YES       │ NO
             ▼           ▼
          金丝雀发布    滚动更新
          （最安全）    （最简单）
```

### 6.2 场景推荐矩阵

| 业务场景 | 推荐策略 | 原因 |
|---------|---------|------|
| **金融核心系统**（支付、交易） | 蓝绿部署 | 秒级回滚，零风险 |
| **电商后端服务** | 金丝雀发布 | 逐步验证，兼顾安全与效率 |
| **内部管理系统** | 滚动更新 | 简单够用，对可用性要求不高 |
| **高流量 C 端应用** | 金丝雀发布 | 用真实流量验证，发现问题影响小 |
| **AI 模型服务** | 金丝雀 + A/B | 对比模型效果，逐步放量 |
| **前端页面改版** | A/B 测试 | 验证假设，数据驱动决策 |
| **基础设施升级**（数据库、缓存） | 蓝绿部署 | 不想在同一集群里混合运行 |
| **移动 App 发版** | 金丝雀发布（分阶段） | 先 1% → 10% → 50% → 100% |

### 6.3 不同规模团队的选择

```
初创团队（< 10 人）：
  → 滚动更新。简单、够用、成本低。
  → K8s 默认支持，不需要额外配置。

中型团队（10-50 人）：
  → 滚动更新 + 关键服务金丝雀发布。
  → 一般服务用滚动，核心服务加金丝雀。

大型团队（50+ 人）：
  → 蓝绿部署（核心）+ 金丝雀发布（一般）。
  → 配合 Service Mesh（Istio/Linkerd）实现。

金融/合规团队：
  → 蓝绿部署。监管要求、审计、回滚必须在秒级完成。
```

---

## 7. 结合 Spring Cloud + K8s 的实践

### 7.1 Spring Cloud + K8s 部署架构

```
┌──────────────────────────────────────────────────────────┐
│            Spring Cloud on Kubernetes                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  传统 Spring Cloud 组件 → K8s 替代方案：                   │
│                                                          │
│  Eureka（服务注册） → K8s Service + CoreDNS                │
│  Ribbon（负载均衡） → K8s Service（iptables/IPVS）          │
│  Zuul/Gateway  → K8s Ingress + Spring Cloud Gateway      │
│  Config Server → K8s ConfigMap + Secret                  │
│  Hystrix      → Resilience4j + K8s Health Probe          │
│  Sleuth/Zipkin → Jaeger + OpenTelemetry                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Spring Cloud Gateway 金丝雀路由

```yaml
# application.yml - Spring Cloud Gateway
spring:
  cloud:
    gateway:
      routes:
        - id: order-service-canary
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Header=X-Canary, true     # ← 携带此 Header 的请求
          filters:
            - RewritePath=/api/orders/(?<segment>.*), /$\{segment}
          metadata:
            version: canary            # ← 路由到金丝雀实例

        - id: order-service-stable
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          metadata:
            version: stable            # ← 默认路由到稳定版

      # 结合 Spring Cloud LoadBalancer 的加权路由
      loadbalancer:
        configurations: weighted
```

```java
// 基于 Nacos 权重的金丝雀路由
@Configuration
public class CanaryLoadBalancerConfig {

    @Bean
    public ReactorLoadBalancer<ServiceInstance> canaryLoadBalancer(
            Environment environment,
            LoadBalancerClientFactory factory) {

        String serviceName = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        ObjectProvider<ServiceInstance> instances = factory.getLazyProvider(serviceName);

        return new CanaryWeightedLoadBalancer(instances, serviceName);
    }
}

public class CanaryWeightedLoadBalancer implements ReactorLoadBalancer<ServiceInstance> {

    private final ObjectProvider<ServiceInstance> instances;
    private final String serviceName;

    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        // 获取所有实例
        List<ServiceInstance> allInstances = instances.stream().toList();

        // 分离稳定版和灰度版
        List<ServiceInstance> stableInstances = filterByVersion(allInstances, "stable");
        List<ServiceInstance> canaryInstances = filterByVersion(allInstances, "canary");

        // 检查请求是否标记为灰度
        RequestDataContext context = (RequestDataContext) request.getContext();
        boolean isCanary = "true".equals(
            context.getClientRequest().getHeaders().getFirst("X-Canary"));

        if (isCanary && !canaryInstances.isEmpty()) {
            // 灰度用户 → 优先灰度实例
            return Mono.just(new DefaultResponse(randomPick(canaryInstances)));
        }

        // 普通用户 → 随机选择一个实例
        return Mono.just(new DefaultResponse(randomPick(allInstances)));
    }

    private List<ServiceInstance> filterByVersion(List<ServiceInstance> instances,
                                                   String version) {
        return instances.stream()
                .filter(i -> version.equals(i.getMetadata().get("version")))
                .toList();
    }

    private ServiceInstance randomPick(List<ServiceInstance> instances) {
        int index = ThreadLocalRandom.current().nextInt(instances.size());
        return instances.get(index);
    }
}
```

### 7.3 完整的部署流程建议

```yaml
# 一个完整的金丝雀部署流程（结合 Spring Cloud + K8s + GitHub Actions）

# 第 1 步：CI 构建 Docker 镜像（前文已覆盖）

# 第 2 步：部署金丝雀（1 个 Pod）
- name: Deploy Canary
  run: |
    kubectl apply -f k8s/deployment-canary.yaml
    kubectl scale deployment myapp-canary --replicas=1

# 第 3 步：等待金丝雀就绪
- name: Wait for canary ready
  run: |
    kubectl wait --for=condition=ready pod \
      -l version=canary --timeout=120s

# 第 4 步：运行冒烟测试
- name: Smoke test canary
  run: |
    curl -H "X-Canary: true" https://api.example.com/health

# 第 5 步：逐步扩大金丝雀
- name: Expand canary to 20%
  run: |
    kubectl scale deployment myapp-canary --replicas=2
    # 等待 5 分钟观察
    sleep 300

# 第 6 步：检查 Prometheus 指标
- name: Check canary metrics
  run: |
    ERROR_RATE=$(curl -s "http://prometheus/query?..." | jq '.data.result[0].value[1]')
    if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
      echo "Error rate too high, rolling back!"
      kubectl scale deployment myapp-canary --replicas=0
      exit 1
    fi

# 第 7 步：全量部署
- name: Full rollout
  run: |
    kubectl set image deployment/myapp myapp=$IMAGE:$VERSION
    kubectl rollout status deployment/myapp --timeout=5m
    kubectl scale deployment myapp-canary --replicas=0
```

---

## 总结

### 一句话总结四种策略

```
滚动更新 → "温水煮青蛙"，逐步替换，最常用的默认选择
蓝绿部署 → "预备替补"，随时准备两套，一键切换，成本高但最安全
金丝雀发布 → "派侦察兵"，小范围探路，确认安全后大军推进
A/B 测试 → "实验对照组"，验证业务假设，不是部署策略
```

### 最终建议

1. **默认用滚动更新**，它能满足 80% 场景的需求
2. **核心业务用金丝雀发布**，尤其是高流量 C 端服务
3. **金融/支付系统用蓝绿部署**，回滚必须是秒级的
4. **不要把 A/B 测试当部署策略用**，它们解决的问题不同
5. **无论哪种策略，三个基础不能少**：
   - 健康检查（Readiness + Liveness Probe）
   - 监控告警（Prometheus + Grafana + AlertManager）
   - 回滚预案（每次部署前都想好怎么回滚）

> **最重要的一点**：部署策略只是工具，真正决定部署质量的，是你的**监控能力**和**回滚速度**。没有监控就部署，等于闭着眼过马路。