---
title: K8s 资源管理与调度：QoS、LimitRange、ResourceQuota 与 HPA/VPA
tag: ["Kubernetes", "QoS", "HPA", "VPA", "资源管理"]
category: 运维
date: 2026-06-27
---

# K8s 资源管理与调度：QoS、LimitRange、ResourceQuota 与 HPA/VPA

Pod 被 OOMKilled？节点资源不均衡？HPA 扩缩容不及时？这些都是资源管理没做好。K8s 资源管理从 requests/limits 到 QoS 到自动伸缩，是一条完整链路。

---

## 一、资源请求与限制

### 1.1 requests 和 limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: order-service
spec:
  containers:
  - name: app
    image: order:v1.0
    resources:
      requests:        # 调度依据：保证最低资源
        cpu: "500m"    # 0.5 核
        memory: "512Mi"
      limits:          # 上限：超过会被限制或杀死
        cpu: "1000m"   # 1 核
        memory: "1Gi"
```

### 1.2 CPU 和 Memory 的区别

```
CPU：
  requests：调度依据，保证最低 CPU
  limits：CFS 限流，超过会被 throttle（CPU 节流，不是杀死）
  
Memory：
  requests：调度依据，保证最低内存
  limits：超过会被 OOMKilled（直接杀进程）
```

### 1.3 CPU 单位

```
1 CPU = 1000m（millicore）
500m = 0.5 核
100m = 0.1 核

CPU 是可压缩资源（compressible）：可以 throttle
Memory 是不可压缩资源（incompressible）：只能 OOMKill
```

---

## 二、QoS 等级

K8s 根据 requests/limits 自动将 Pod 分为三个 QoS 等级，决定 OOM 时谁先被杀。

### 2.1 三种 QoS

```
Guaranteed（保证级）     → requests == limits（所有容器）
Burstable（突发级）       → requests < limits 或部分设置
BestEffort（尽力级）      → 没有设置 requests/limits

OOM 优先级（谁先被杀）：
  BestEffort > Burstable > Guaranteed
  同等级内：内存使用率最高的先被杀
```

### 2.2 如何确保 Guaranteed

```yaml
# 所有容器都设置 requests == limits → Guaranteed
apiVersion: v1
kind: Pod
metadata:
  name: critical-service
spec:
  containers:
  - name: app
    image: app:v1
    resources:
      requests:
        cpu: "1"
        memory: "1Gi"
      limits:
        cpu: "1"       # == requests
        memory: "1Gi"  # == requests

# 生产环境核心服务必须用 Guaranteed
# 原因：
# 1. OOM 时最后被杀
# 2. 调度器优先调度
# 3. CPU 不会被 throttle（limits == requests）
```

### 2.3 查看 Pod QoS

```bash
kubectl get pod order-service -o jsonpath='{.status.qosClass}'
# Guaranteed / Burstable / BestEffort

# 查看 OOM 分数
cat /proc/<pid>/oom_score
# 分数越高越先被杀
```

---

## 三、LimitRange（命名空间级限制）

防止用户创建不合理资源配置的 Pod。

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: resource-limits
  namespace: production
spec:
  limits:
  # 默认值（没设 limits 时使用）
  - default:          # default = limits
      cpu: "1"
      memory: "1Gi"
    defaultRequest:   # defaultRequest = requests
      cpu: "200m"
      memory: "256Mi"
    type: Container
  
  # 限制范围
  - max:
      cpu: "4"
      memory: "8Gi"
    min:
      cpu: "100m"
      memory: "128Mi"
    type: Container
  
  # PVC 限制
  - max:
      storage: "100Gi"
    min:
      storage: "1Gi"
    type: PersistentVolumeClaim
```

```bash
# 如果 Pod 没设 resources，LimitRange 会注入默认值
# 如果 Pod 超出 max/min，创建被拒绝
kubectl apply -f limitrange.yaml
```

---

## 四、ResourceQuota（命名空间配额）

限制命名空间总资源使用量。

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: quota
  namespace: production
spec:
  hard:
    # CPU/Memory 配额
    requests.cpu: "10"        # 命名空间总 CPU 请求上限 10 核
    requests.memory: "20Gi"
    limits.cpu: "20"          # 命名空间总 CPU limit 上限 20 核
    limits.memory: "40Gi"
    
    # 对象数量配额
    pods: "50"                # 最多 50 个 Pod
    services: "20"
    configmaps: "100"
    secrets: "50"
    persistentvolumeclaims: "10"
    
    # 按 QoS 限制
    pods.low: "10"            # BestEffort 最多 10 个
```

```bash
# 查看配额使用情况
kubectl describe resourcequota quota -n production

# 输出：
# Name:            quota
# Resource         Used  Hard
# --------         ----  ----
# requests.cpu     6     10
# requests.memory  12Gi  20Gi
# pods             28    50
```

---

## 五、HPA：水平自动扩缩容

### 5.1 HPA 工作原理

```
                    ┌─────────────┐
                    │ Metrics API │
                    │ (CPU/Memory)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     HPA     │
                    │ Controller  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     replicas=3      replicas=5      replicas=2
     (当前)          (扩容)          (缩容)
     
HPA 每 15 秒轮询一次 Metrics
根据当前指标 / 目标指标 计算 desiredReplicas
desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))
```

### 5.2 基于 CPU 的 HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization  # 利用率
        averageUtilization: 70  # 目标 CPU 利用率 70%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0  # 扩容立即执行
      policies:
      - type: Percent
        value: 100                    # 每次最多扩容 100%
        periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300  # 缩容等 5 分钟
      policies:
      - type: Percent
        value: 10                      # 每次最多缩容 10%
        periodSeconds: 60
```

### 5.3 基于自定义指标

```yaml
# 需要先部署 Prometheus Adapter
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-hpa-custom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 30
  metrics:
  # 基于 QPS 扩缩容
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"  # 每个 Pod 目标 1000 QPS
  # 基于消息队列长度
  - type: External
    external:
      metric:
        name: rabbitmq_queue_messages
        selector:
          matchLabels:
            queue: order_queue
      target:
        type: AverageValue
        averageValue: "100"  # 队列超过 100 条消息就扩容
```

### 5.4 安装 Metrics Server

```bash
# HPA 需要 Metrics Server 提供 CPU/Memory 指标
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 验证
kubectl top nodes
kubectl top pods -n production

# 如果 top 命令报错，检查 metrics-server 日志
kubectl logs -n kube-system metrics-server-xxx
```

---

## 六、VPA：垂直自动扩缩容

VPA 自动调整 Pod 的 requests/limits，适合无法水平扩展的应用（如数据库）。

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: mysql-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: StatefulSet
    name: mysql
  updatePolicy:
    updateMode: "Auto"  # Auto / Initial / Off
    # Auto: 自动调整并重启 Pod
    # Initial: 只在 Pod 创建时调整
    # Off: 只推荐不执行
  resourcePolicy:
    containerPolicies:
    - containerName: mysql
      minAllowed:
        cpu: 500m
        memory: 1Gi
      maxAllowed:
        cpu: 4
        memory: 8Gi
      controlledResources: ["cpu", "memory"]
```

> ⚠️ VPA Auto 模式会重启 Pod 来应用新的资源配置，不适合对中断敏感的服务。通常 VPA 和 HPA 不能同时用于同一个维度（CPU/Memory）。

---

## 七、节点调度与亲和性

### 7.1 nodeSelector（简单版）

```yaml
spec:
  nodeSelector:
    disktype: ssd  # 只调度到有 ssd 标签的节点
```

### 7.2 nodeAffinity（高级版）

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:  # 硬性要求
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/arch
            operator: In
            values:
            - amd64
      preferredDuringSchedulingIgnoredDuringExecution:  # 软性偏好
      - weight: 80
        preference:
          matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
            - cn-east-1a
```

### 7.3 podAffinity / podAntiAffinity

```yaml
spec:
  affinity:
    # Pod 反亲和：同一 Deployment 的 Pod 调度到不同 Node
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: order-service
        topologyKey: kubernetes.io/hostname  # 以 Node 为拓扑域
    # Pod 亲和：order-service 和 redis 部署到同一 Node
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: redis
          topologyKey: kubernetes.io/hostname
```

### 7.4 污点与容忍

```bash
# 给 Node 打污点（专用节点）
kubectl taint nodes gpu-node gpu=true:NoSchedule
# NoSchedule: 不调度新 Pod
# NoExecute: 驱逐现有不容忍的 Pod
# PreferNoSchedule: 尽量不调度
```

```yaml
spec:
  tolerations:
  - key: "gpu"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
  # 只有容忍 gpu 污点的 Pod 才能调度到 gpu-node
```

---

## 八、生产环境最佳实践

### 8.1 资源配置建议

| 服务类型 | QoS | requests.cpu | limits.cpu | requests.memory | limits.memory |
|---------|-----|-------------|-----------|----------------|--------------|
| 核心服务 | Guaranteed | 1 | 1 | 2Gi | 2Gi |
| 普通服务 | Burstable | 200m | 1 | 256Mi | 1Gi |
| 批处理 | Burstable | 100m | 500m | 128Mi | 512Mi |
| GPU 服务 | Guaranteed | 1 | 1 | 4Gi | 4Gi |

### 8.2 HPA 配置建议

```
1. minReplicas >= 2（高可用最低要求）
2. maxReplicas 设合理上限（防止雪崩）
3. scaleDown stabilizationWindow >= 300s（避免频繁缩容）
4. scaleUp stabilizationWindow = 0（扩容要快）
5. 目标 CPU 利用率 60-70%（留余量）
6. 配合 readinessProbe 确保新 Pod 就绪后才接流量
```

---

## 九、面试要点

### Q：K8s 的 QoS 有哪些等级？怎么决定的？

三个等级：Guaranteed、Burstable、BestEffort。
- Guaranteed：所有容器 requests == limits
- Burstable：至少一个容器有 requests 但不等于 limits
- BestEffort：所有容器都没设 requests/limits
OOM 时优先杀 BestEffort，再杀 Burstable，最后杀 Guaranteed。

### Q：HPA 扩缩容的原理？

HPA Controller 每 15 秒从 Metrics API 获取指标，计算 desiredReplicas = ceil(currentReplicas * currentMetric / targetMetric)。如果 desired != current，更新 Deployment replicas。扩容立即执行，缩容有 stabilization window（默认 5 分钟）。

### Q：VPA 和 HPA 能同时用吗？

可以但不能对同一资源维度。比如 HPA 基于 CPU 扩缩容，VPA 调整 Memory，这是可以的。如果 HPA 和 VPA 都调整 CPU，会冲突。VPA 会重启 Pod 来应用新配置，不适合频繁变化。

---

## 十、总结

K8s 资源管理三板斧：

1. **QoS**：核心服务用 Guaranteed，设 requests == limits
2. **HPA**：基于 CPU/QPS 自动扩缩，扩快缩慢
3. **ResourceQuota**：命名空间级配额，防止资源抢占

记住：**requests 是调度依据，limits 是上限，QoS 决定谁先被杀，HPA 管水平扩缩，VPA 管垂直调整**。
