---
title: K8s 网络与流量管理：CNI 插件、Service 负载均衡与 Ingress 实战
tag: ["Kubernetes", "CNI", "Service", "Ingress", "网络"]
category: 运维
date: 2026-06-27
---

# K8s 网络与流量管理：CNI 插件、Service 负载均衡与 Ingress 实战

K8s 网络是云原生最难的领域之一。Pod 之间怎么通信？Service 怎么负载均衡？外部流量怎么进来？CNI、kube-proxy、Ingress 三层体系一次讲清。

---

## 一、K8s 网络模型

K8s 网络的四个核心问题：

```
1. 容器间通信（同一 Pod 内）    → localhost（共享网络命名空间）
2. Pod 间通信（同一 Node）      → 通过 cni0 网桥/路由
3. Pod 间通信（跨 Node）        → CNI 插件实现（Overlay 或 Underlay）
4. Service 与外部通信           → kube-proxy + Ingress/LB
```

K8s 网络基本原则：
- 每个 Pod 有独立 IP，无 NAT
- Pod 之间直接通信，无 NAT
- Node 与 Pod 之间直接通信，无 NAT

---

## 二、CNI 插件详解

### 2.1 CNI 是什么

CNI（Container Network Interface）是 K8s 的网络插件标准。kubelet 在创建 Pod 时调用 CNI 插件为 Pod 配置网络。

### 2.2 主流 CNI 对比

| CNI | 模式 | 性能 | 功能 | 适用场景 |
|-----|------|------|------|---------|
| Flannel | Overlay (VXLAN) | 中 | 简单 | 小规模集群 |
| Calico | BGP / Overlay | 高 | NetworkPolicy | 生产环境（最常用） |
| Cilium | eBPF | 极高 | NetworkPolicy + 可观测 | 大规模、高性能 |
| Weave | Overlay | 中 | 加密 | 中小规模 |

### 2.3 Calico 架构

```
Node 1                          Node 2
┌─────────────────┐            ┌─────────────────┐
│  Pod A (10.1.1.5)│            │  Pod B (10.1.2.3)│
│    │             │            │    │             │
│  veth pair       │            │  veth pair       │
│    │             │            │    │             │
│  tunl0 (IPSec)   │            │  tunl0 (IPSec)   │
│    │             │            │    │             │
│  BGP Agent        │◄──────────►│  BGP Agent       │
│  (路由交换)        │   BGP     │  (路由交换)        │
└─────────────────┘  路由       └─────────────────┘

Calico 用 BGP 协议在 Node 之间交换路由信息
Pod 流量通过 tunl0 隧道或直接路由到目标 Node
```

### 2.4 安装 Calico

```bash
# 安装 Calico（ Tigera Operator 方式，推荐）
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/tigera-operator.yaml
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/custom-resources.yaml

# 查看 Calico 状态
kubectl get pods -n calico-system
kubectl get installation default -o yaml

# 查看 BGP 对等状态
calicoctl node status
```

### 2.5 NetworkPolicy（网络隔离）

```yaml
# 默认拒绝所有入站
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}  # 选中所有 Pod
  policyTypes:
  - Ingress

---
# 只允许 frontend 访问 backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

---

## 三、Service 负载均衡

### 3.1 Service 类型

```
ClusterIP（默认）   → 集群内部虚拟 IP，外部不可访问
NodePort            → 在每个 Node 上开端口（30000-32767）
LoadBalancer        → 云厂商 LB（AWS ELB / 阿里云 SLB）
ExternalName        → CNAME 到外部域名
Headless            → 无 ClusterIP，直接返回 Pod IP（用于 StatefulSet）
```

### 3.2 Service 工作原理

```
                    Service (ClusterIP: 10.96.0.100)
                              │
                    kube-proxy（每个 Node 运行）
                              │
                    iptables / IPVS 规则
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
        Pod 1 (10.1.1.5)  Pod 2 (10.1.1.6)  Pod 3 (10.1.2.3)
        
kube-proxy 监听 Service/Endpoint 变化，写入 iptables/IPVS 规则
流量到达 Node 时，iptables 根据规则 DNAT 到后端 Pod IP
```

### 3.3 iptables vs IPVS

| 模式 | 算法 | 性能 | 规模 | 推荐场景 |
|------|------|------|------|---------|
| iptables | 随机 | 中 | < 1000 Service | 小规模 |
| IPVS | 轮询/最少连接/源地址哈希 | 高 | > 1000 Service | 大规模（推荐） |

```bash
# 切换 IPVS 模式
kubectl edit configmap kube-proxy -n kube-system
# 修改 mode: "ipvs"

# 重启 kube-proxy
kubectl rollout restart daemonset kube-proxy -n kube-system

# 验证 IPVS 规则
ipvsadm -Ln | grep 10.96.0.100
# -> TCP 10.96.0.100:80 rr
#    -> 10.1.1.5:8080
#    -> 10.1.1.6:8080
#    -> 10.1.2.3:8080
```

### 3.4 Service 实战

```yaml
# 普通 Service
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  type: ClusterIP
  selector:
    app: order
  ports:
  - port: 80          # Service 端口
    targetPort: 8080  # Pod 端口
    protocol: TCP

---
# Headless Service（用于 StatefulSet）
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None     # 无 ClusterIP
  selector:
    app: mysql
  ports:
  - port: 3306
# DNS 查询返回 Pod IP 列表：mysql-0.mysql-headless, mysql-1.mysql-headless

---
# NodePort Service
apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
spec:
  type: NodePort
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080   # 外部访问 NodeIP:30080

---
# Session Affinity（会话保持）
apiVersion: v1
kind: Service
metadata:
  name: sticky-service
spec:
  type: ClusterIP
  selector:
    app: web
  sessionAffinity: ClientIP  # 基于客户端 IP 会话保持
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800   # 3 小时
  ports:
  - port: 80
    targetPort: 8080
```

---

## 四、Ingress：HTTP 层路由

### 4.1 为什么需要 Ingress

```
没有 Ingress：
  每个服务暴露一个 LoadBalancer → 每个 LB 收费 → 太贵
  每个服务暴露一个 NodePort → 端口管理混乱 → 不安全

有 Ingress：
  一个 LB → Ingress Controller → 根据域名/路径路由到不同 Service
  只需一个 LB，成本最低
```

### 4.2 Ingress 架构

```
外部用户
    │
    │ HTTP/HTTPS
    │
Cloud LoadBalancer（阿里云 SLB / AWS ELB）
    │
    │
Ingress Controller Pod（Nginx/Traefik/Envoy）
    │ 读取 Ingress 规则，生成 Nginx 配置
    │
    ├──→ Service A (order.example.com)
    ├──→ Service B (pay.example.com)
    └──→ Service C (api.example.com/v2/*)
```

### 4.3 Nginx Ingress 实战

```bash
# 安装 Nginx Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

```yaml
# Ingress 规则
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"  # 限流
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - "*.example.com"
    secretName: tls-secret
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /order
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80
      - path: /pay
        pathType: Prefix
        backend:
          service:
            name: pay-service
            port:
              number: 80
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 80
```

### 4.4 金丝雀发布

```yaml
# 主版本（90%流量）
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "false"
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-stable
            port:
              number: 80

---
# 金丝雀版本（10%流量）
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-canary-new
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% 流量
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-canary
            port:
              number: 80
```

---

## 五、DNS 与服务发现

### 5.1 CoreDNS

```bash
# K8s 内置 DNS 服务
kubectl get svc -n kube-system kube-dns

# Service DNS 格式：
# <service-name>.<namespace>.svc.cluster.local
# 例：order-service.default.svc.cluster.local

# Pod DNS（Headless Service + StatefulSet）：
# <pod-name>.<service-name>.<namespace>.svc.cluster.local
# 例：mysql-0.mysql-headless.default.svc.cluster.local

# 测试 DNS 解析
kubectl run dns-test --image=busybox:1.36 --rm -it -- nslookup order-service.default
```

### 5.2 DNS 策略

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dns-test
spec:
  dnsPolicy: ClusterFirst  # 默认：先查集群 DNS，再查外部
  # dnsPolicy: Default     # 用 Node 的 DNS 配置
  # dnsPolicy: None        # 自定义
  dnsConfig:
    nameservers:
    - 8.8.8.8
    searches:
    - example.com
    options:
    - name: ndots
      value: "5"
  containers:
  - name: test
    image: busybox
```

---

## 六、实战：Spring Boot 微服务网络配置

### 6.1 部署清单

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order
        image: registry.example.com/order:v1.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: prod
        - name: PAY_SERVICE_URL
          value: "http://pay-service:80"  # Service DNS 名称
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
  - port: 80
    targetPort: 8080
```

### 6.2 网络安全策略

```yaml
# 只允许前端调用订单服务
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: order-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 8080  # 允许 Prometheus 抓取
```

---

## 七、故障排查

### 7.1 常见网络问题

```bash
# 1. Pod 之间不通
# 检查 CNI 是否正常
kubectl get pods -n kube-system | grep calico
kubectl logs -n calico-system calico-node-xxx

# 2. Service 无法访问
# 检查 Endpoints 是否正常
kubectl get endpoints order-service
# 如果 ENDPOINTS 为空 → selector 不匹配或 Pod 不健康

# 3. DNS 解析失败
kubectl run dns-test --image=busybox:1.36 --rm -it -- nslookup order-service
kubectl logs -n kube-system coredns-xxx

# 4. Ingress 无法访问
kubectl describe ingress app-ingress
kubectl logs -n ingress-nginx ingress-nginx-controller-xxx

# 5. 跨 Node Pod 通信失败
# 检查 CNI 路由
ip route | grep tunl0
# 检查 iptables
iptables -t nat -L | grep order-service
```

### 7.2 网络调试工具

```yaml
# 网络调试 Pod
apiVersion: v1
kind: Pod
metadata:
  name: network-debug
spec:
  containers:
  - name: debug
    image: nicolaka/netshoot:latest
    command: ["sleep", "3600"]
  restartPolicy: Always
```

```bash
# 进入调试 Pod
kubectl exec -it network-debug -- bash

# 常用调试命令
nslookup order-service           # DNS 解析
curl http://order-service        # Service 连通性
ping 10.1.1.5                    # Pod 连通性
tcpdump -i eth0 port 8080        # 抓包
traceroute 10.1.2.3              # 路由追踪
mtr 10.1.2.3                     # 持续路由追踪
```

---

## 八、面试要点

### Q：K8s Service 的 ClusterIP 是怎么工作的？

ClusterIP 是一个虚拟 IP，本身不绑定任何网络接口。kube-proxy 在每个 Node 上写 iptables/IPVS 规则，将发往 ClusterIP 的流量 DNAT 到后端 Pod IP。实际流量是通过 iptables/IPVS 规则直接转发到 Pod 的，不经过 Service。

### Q：kube-proxy 的 iptables 和 IPVS 模式有什么区别？

- iptables：规则是链式的，匹配复杂度 O(n)，大规模时性能下降
- IPVS：基于哈希表，匹配复杂度 O(1)，支持更多负载均衡算法（轮询/最少连接/源地址哈希），大规模集群推荐

### Q：Ingress 和 Service 有什么区别？

- Service 是四层（TCP/UDP）负载均衡，不感知 HTTP 协议
- Ingress 是七层（HTTP/HTTPS）负载均衡，支持域名和路径路由、TLS 终止、金丝雀发布
- Ingress 本身是规则，需要 Ingress Controller（如 Nginx）来实际执行

---

## 九、总结

K8s 网络三层体系：

1. **CNI（Pod 网络）**：Calico 最常用，Cilium 性能最强
2. **Service（四层负载）**：IPVS 模式 + Headless Service 用于 StatefulSet
3. **Ingress（七层路由）**：Nginx Ingress 最成熟，金丝雀发布用 canary-weight

记住：**CNI 管 Pod 通信，kube-proxy 管 Service 转发，Ingress 管 HTTP 路由**。
