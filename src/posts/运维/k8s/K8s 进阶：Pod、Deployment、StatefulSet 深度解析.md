---
title: K8s 进阶：Pod、Deployment、StatefulSet 深度解析
tag: ["Kubernetes", "K8s", "DevOps", "云原生"]
category: 运维
date: 2026-06-27
---

# K8s 进阶：Pod、Deployment、StatefulSet 深度解析

> 作为 Java 后端开发者，你可能已经会在 K8s 上部署简单的服务了。但当你面对线上故障、滚动更新出问题、有状态应用部署一团糟时，就需要深入理解 K8s 的核心工作负载模型。本文带你从进阶视角重新审视 Pod、Deployment 和 StatefulSet。

## 一、Pod：不只是"容器的壳"

### 1.1 Pod 的本质

很多初学者认为 Pod 就是"包着一组容器的壳"，但这个理解太浅了。Pod 是 K8s 中**最小的可调度单元**，它存在的意义是：

- **共享网络**：Pod 内所有容器共享同一个网络命名空间（IP、端口空间）
- **共享存储**：Pod 内的 Volume 可以被所有容器挂载
- **共享生命周期**：Pod 作为一个整体被调度、创建、销毁

用一句话总结：**Pod 是一组共享资源的容器的命运共同体**。

### 1.2 Pod 生命周期详解

Pod 的生命周期是面试高频考点，也是排查线上问题的关键。

```
Pending → ContainerCreating → Running → Terminating
                                    ↘ CrashLoopBackOff
                                    ↘ Error
```

**完整的 Pod 状态流转：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  initContainers:        # 1. 先执行 Init 容器（按顺序，串行）
    - name: init-db
      image: busybox
      command: ['sh', '-c', 'until nslookup mysql-service; do sleep 2; done']
  containers:            # 2. Init 容器全部成功后，才启动业务容器
    - name: app
      image: my-app:latest
      lifecycle:         # 3. 生命周期钩子
        postStart:       # 容器启动后执行（不保证在 ENTRYPOINT 之前）
          exec:
            command: ["/bin/sh", "-c", "echo 'started' > /tmp/status"]
        preStop:         # 容器终止前执行
          exec:
            command: ["/bin/sh", "-c", "nginx -s quit; sleep 10"]
      livenessProbe:     # 4. 存活探针：失败则重启容器
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 30
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:    # 5. 就绪探针：失败则从 Service Endpoints 移除
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
      startupProbe:      # 6. 启动探针（K8s 1.16+）：先于 liveness 生效
        httpGet:
          path: /startup
          port: 8080
        failureThreshold: 30
        periodSeconds: 10
  terminationGracePeriodSeconds: 30  # 优雅终止宽限期
```

### 1.3 三种探针的职责区分

这是最容易混淆的知识点：

| 探针 | 作用 | 失败后果 | 适用场景 |
|------|------|----------|----------|
| **startupProbe** | 判断容器是否已启动 | 失败则重启容器 | 慢启动应用（JVM） |
| **livenessProbe** | 判断容器是否健康 | 失败则重启容器 | 检测死锁、假死 |
| **readinessProbe** | 判断容器是否可服务 | 失败则移出 Service Endpoints | 依赖检查、预热 |

**避坑指南：Java 应用一定要配 startupProbe**

Java 应用启动慢（尤其是 Spring Boot 大项目），如果直接配 livenessProbe 且 `initialDelaySeconds` 太短，K8s 会认为应用挂了，不断重启，形成**CrashLoopBackOff 死循环**。

```yaml
# ❌ 错误写法：Java 应用启动要 60s，但 30s 就开始探测
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30   # 太短！

# ✅ 正确写法：用 startupProbe 替代 initialDelay 猜测
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  failureThreshold: 30      # 最多等 30 * 10 = 300 秒
  periodSeconds: 10
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
```

### 1.4 Pod 优雅终止流程

线上发布时，如果 Pod 终止不当，会导致请求丢失。完整流程：

```
1. kubelet 收到删除 Pod 指令
2. Pod 状态变为 Terminating
3. 从 Service Endpoints 中移除（但可能还有流量在飞）
4. 执行 preStop 钩子
5. 发送 SIGTERM 信号给容器主进程
6. 等待 terminationGracePeriodSeconds（默认 30s）
7. 如果超时还没退出，发送 SIGKILL 强制杀死
```

**避坑：preStop + 宽限期配合**

```yaml
spec:
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            # 先等几秒让 Service 摘除节点，再优雅关闭
            command: ["/bin/sh", "-c", "sleep 5 && nginx -s quit"]
  terminationGracePeriodSeconds: 30
```

为什么要 `sleep 5`？因为从 Endpoints 移除到 kube-proxy 更新 iptables/ipvs 规则有延迟，这期间可能还有新请求进来。

## 二、Deployment：滚动的艺术

### 2.1 Deployment 的本质

Deployment 管理的是 ReplicaSet，ReplicaSet 管理 Pod。层级关系：

```
Deployment → ReplicaSet (v1, v2, v3...) → Pod
```

每次更新镜像版本，Deployment 会创建一个新的 ReplicaSet，逐步把旧 ReplicaSet 的 Pod 缩为 0，同时新 ReplicaSet 的 Pod 扩到目标副本数。

### 2.2 滚动更新策略详解

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 3          # 最多比目标副本数多 3 个（可以是百分比 25%）
      maxUnavailable: 2     # 最多比目标副本数少 2 个（可以是百分比 25%）
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:v2
          resources:
            requests:
              cpu: 200m
              memory: 512Mi
            limits:
              cpu: 500m
              memory: 1Gi
```

**maxSurge 和 maxUnavailable 的理解：**

假设 `replicas=10`，`maxSurge=3`，`maxUnavailable=2`：

- 滚动更新过程中，最多有 10+3=13 个 Pod（新+旧）
- 最多有 10-2=8 个 Pod 可用（新+旧）
- 所以至少 8 个可用，最多 13 个存在

**生产环境推荐配置：**

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%        # 控制资源峰值
    maxUnavailable: 0    # 保证不减少可用实例数，零停机
```

`maxUnavailable: 0` 意味着必须先启动新 Pod，健康检查通过后，才杀旧 Pod。代价是需要足够的资源冗余。

### 2.3 版本回滚实战

```bash
# 查看发布历史
kubectl rollout history deployment/my-app

# 查看指定版本的详情
kubectl rollout history deployment/my-app --revision=3

# 回滚到上一版本
kubectl rollout undo deployment/my-app

# 回滚到指定版本
kubectl rollout undo deployment/my-app --to-revision=2

# 查看滚动更新状态
kubectl rollout status deployment/my-app
```

**避坑：`--record` 已废弃**

K8s 1.18+ 不再推荐使用 `--record`，新版本通过 `kustomize` 或 `helm` 注解来记录变更原因：

```yaml
metadata:
  annotations:
    deployment.kubernetes.io/revision: "3"
    kubernetes.io/change-cause: "update image to v2.3.0 for hotfix"
```

### 2.4 HPA 自动扩缩容

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # CPU 使用率超过 70% 扩容
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0    # 扩容立即执行
      policies:
        - type: Percent
          value: 100                    # 每次最多翻倍
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容等 5 分钟稳定期
      policies:
        - type: Percent
          value: 10                     # 每次最多缩 10%
          periodSeconds: 60
```

**避坑：HPA 缩容抖动**

默认配置下，流量波动会导致频繁扩缩容（叫"抖动"）。通过 `scaleDown.stabilizationWindowSeconds` 设置稳定窗口，避免缩容太激进。

## 三、StatefulSet：有状态应用的守护者

### 3.1 为什么需要 StatefulSet

Deployment 适合无状态应用（Web API、微服务），但以下场景 Deployment 无能为力：

- **MySQL 主从集群**：每个节点有不同的数据、不同的 hostname
- **ZooKeeper / etcd**：节点需要稳定的身份参与选举
- **Kafka 集群**：每个 Broker 有独立的 log 目录和 broker.id
- **Elasticsearch**：数据分片需要持久化且与节点绑定

StatefulSet 提供了三个核心保证：

1. **稳定网络身份**：`pod-0`, `pod-1`, `pod-2`（即使重建也是这个名字）
2. **稳定存储**：每个 Pod 绑定独立的 PVC，重建后挂载同一个 Volume
3. **有序部署和扩缩**：按 0, 1, 2... 顺序创建；缩容按逆序 2, 1, 0

### 3.2 StatefulSet 完整示例

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None         # Headless Service，返回 Pod IP 而非 VIP
  selector:
    app: mysql
  ports:
    - port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless    # 必须关联 Headless Service
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: root-password
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name     # mysql-0, mysql-1, mysql-2
            - name: POD_ORDINAL
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['pod.beta.kubernetes.io/ordinal']
          ports:
            - containerPort: 3306
              name: mysql
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:          # 关键：为每个 Pod 自动创建独立 PVC
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi
```

### 3.3 StatefulSet 的网络身份

通过 Headless Service，每个 Pod 会获得一个稳定的 DNS 名称：

```
mysql-0.mysql-headless.default.svc.cluster.local
mysql-1.mysql-headless.default.svc.cluster.local
mysql-2.mysql-headless.default.svc.cluster.local
```

这就是为什么 StatefulSet 适合做数据库集群：

- MySQL 主从：`mysql-0` 是主，`mysql-1`、`mysql-2` 是从
- 应用代码中可以直接用 DNS 名称连接指定节点
- 即使 Pod 重建，DNS 名称不变，连接不会断

**Java 应用中的使用示例：**

```java
// 连接 MySQL 主节点（写）
String masterUrl = "jdbc:mysql://mysql-0.mysql-headless:3306/mydb";

// 连接 MySQL 从节点（读）
String slaveUrl = "jdbc:mysql://mysql-1.mysql-headless:3306/mydb";

// 或者通过普通 Service 连接（自动负载均衡到所有节点）
String anyUrl = "jdbc:mysql://mysql-headless:3306/mydb";
```

### 3.4 滚动更新策略

```yaml
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 1        # 只更新 ordinal >= 1 的 Pod，保护 mysql-0 不被更新
  # 或者用 OnDelete 策略：手动删除 Pod 才触发更新
  # updateStrategy:
  #   type: OnDelete
```

**`partition` 的妙用：灰度更新**

假设 3 个节点，`partition=2`，只有 `mysql-2` 会被更新。验证没问题后，改为 `partition=0`，全部更新。这是 StatefulSet 特有的灰度手段。

### 3.5 Pod 管理策略

```yaml
spec:
  podManagementPolicy: OrderedReady    # 默认：有序（0→1→2）
  # podManagementPolicy: Parallel      # 并行：同时创建所有 Pod
```

对于不需要严格顺序的集群（如 Elasticsearch），用 `Parallel` 可以加快部署速度。

## 四、实战案例：部署 Spring Boot 应用到 K8s

### 4.1 完整部署清单

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  application.yml: |
    server:
      port: 8080
    spring:
      datasource:
        url: jdbc:mysql://mysql-headless:3306/mydb
        username: root
        password: ${MYSQL_PASSWORD}
      redis:
        host: redis-headless
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  MYSQL_PASSWORD: "MyStr0ngP@ss"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-app
  labels:
    app: spring-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: spring-app
  template:
    metadata:
      labels:
        app: spring-app
    spec:
      containers:
        - name: app
          image: registry.cn-hangzhou.aliyuncs.com/myrepo/spring-app:v1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: MYSQL_PASSWORD
            - name: SPRING_PROFILES_ACTIVE
              value: prod
            - name: JAVA_OPTS
              value: "-Xms512m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
          resources:
            requests:
              cpu: 500m
              memory: 768Mi
            limits:
              cpu: 1000m
              memory: 1536Mi
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
          startupProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            failureThreshold: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            periodSeconds: 5
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]
      volumes:
        - name: config
          configMap:
            name: app-config
      terminationGracePeriodSeconds: 60
---
apiVersion: v1
kind: Service
metadata:
  name: spring-app
spec:
  selector:
    app: spring-app
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spring-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spring-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 4.2 Spring Boot 健康检查适配

```java
// application.yml
/*
management:
  endpoint:
    health:
      probes:
        enabled: true
      liveness:
        state:
          enabled: true
      readiness:
        state:
          enabled: true
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
*/

// 自定义健康指示器
@Component
public class DependencyHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        // 检查关键依赖（数据库、Redis 等）
        if (checkDependencies()) {
            return Health.up().build();
        }
        return Health.down().withDetail("error", "dependency check failed").build();
    }
}
```

## 五、常见问题排查

### 5.1 Pod 一直 Pending

```bash
# 查看 Pod 事件
kubectl describe pod <pod-name>

# 常见原因：
# 1. 资源不足：Insufficient cpu/memory
# 2. 节点选择器不匹配：nodeSelector/affinity
# 3. 污点容忍：NoSchedule taint
# 4. PVC 未绑定：等待 PV 分配
```

### 5.2 CrashLoopBackOff

```bash
# 查看容器日志
kubectl logs <pod-name> --previous

# 常见原因：
# 1. 应用启动失败（配置错误、依赖缺失）
# 2. livenessProbe 太激进，应用还没起来就被判定为不健康
# 3. OOMKilled：内存限制太小
```

### 5.3 滚动更新卡住

```bash
# 查看 Deployment 状态
kubectl rollout status deployment/<name>

# 查看新 Pod 是否就绪
kubectl get pods -l app=<name>

# 常见原因：
# 1. readinessProbe 失败：新版本代码有 bug
# 2. 资源不足：maxSurge 的 Pod 无法调度
# 3. 镜像拉取失败：检查镜像仓库和权限
```

## 六、面试要点总结

### 高频面试题

1. **Pod 和容器的区别是什么？**
   - Pod 是 K8s 最小调度单元，容器是 Pod 内的进程
   - Pod 内容器共享网络和存储命名空间
   - Pod 保证一组容器同生命周期

2. **三种探针的区别？**
   - startupProbe：判断是否启动完成，先于其他探针
   - livenessProbe：判断是否存活，失败重启
   - readinessProbe：判断是否可服务，失败摘流量

3. **Deployment 和 StatefulSet 的区别？**
   - Deployment 管理无状态应用，Pod 是随机名称、随机顺序
   - StatefulSet 管理有状态应用，Pod 有稳定身份和存储
   - StatefulSet 需要 Headless Service + volumeClaimTemplates

4. **滚动更新的原理？**
   - 创建新 ReplicaSet，逐步增加新 Pod
   - 同时减少旧 ReplicaSet 的 Pod
   - 通过 maxSurge 和 maxUnavailable 控制节奏

5. **StatefulSet 为什么需要 Headless Service？**
   - Headless Service 返回 Pod IP 而非 VIP
   - 每个 Pod 获得独立 DNS 记录
   - 客户端可以通过 DNS 名称直接访问指定 Pod

### 核心知识点速记

```
Pod = 共享网络+存储的容器组
Deployment = ReplicaSet 管理器，负责滚动更新
StatefulSet = 有状态应用管理器，保证身份+存储稳定
HPA = 自动扩缩容，基于 CPU/内存/自定义指标
Headless Service = 无 VIP，直接返回 Pod IP
Init Container = 先于业务容器执行，串行
maxSurge = 滚动更新时最多多出多少 Pod
maxUnavailable = 滚动更新时最多少多少 Pod
partition = StatefulSet 灰度更新的分界线
```

## 总结

本文深入解析了 K8s 三大核心工作负载：

1. **Pod**：理解生命周期、三种探针、优雅终止，是排查问题的基础
2. **Deployment**：掌握滚动更新策略和 HPA，实现零停机发布和自动扩缩容
3. **StatefulSet**：理解稳定身份和存储，是有状态应用上 K8s 的关键

作为 Java 开发者，最实际的建议是：**把 K8s 的配置当成代码来管理**。用 Helm Chart 或 Kustomize 管理你的部署清单，纳入版本控制，这样你就能像管理代码一样管理基础设施。
