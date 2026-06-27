---
title: K8s Pod 频繁重启排查实战：OOMKilled 与健康检查
tag: ["Kubernetes", "Pod重启", "OOMKilled", "健康检查", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# K8s Pod 频繁重启排查实战：OOMKilled 与健康检查

> "Pod 又重启了！" 这是云原生时代最常见的告警。Pod 频繁重启不仅影响服务可用性，还可能导致请求中断、数据不一致。本文带你排查 K8s 环境下 Pod 重启的两大元凶：OOMKilled 和健康检查配置不当。

## 一、Pod 重启的常见原因

K8s 中 Pod 重启通常由以下原因触发：

| 重启原因 | 占比 | 典型场景 |
|---------|------|---------|
| OOMKilled | 40% | 容器内存超限被 kill |
| Liveness Probe 失败 | 30% | 健康检查配置不当 |
| 应用崩溃 | 15% | 代码 bug 导致退出 |
| 资源不足被驱逐 | 10% | 节点资源不足 |
| 调度问题 | 5% | 节点不可达/亲和性问题 |

本文重点分析前两种，它们占了 70% 以上的案例。

## 二、排查第一步：查看 Pod 状态

### 2.1 kubectl 基本命令

```bash
# 查看 Pod 状态
kubectl get pods -n my-namespace

# 输出：
# NAME                     READY   STATUS    RESTARTS   AGE
# order-service-abc123     1/1     Running   7          30m    ← 重启了 7 次！
# user-service-def456      1/1     Running   0          2h
```

### 2.2 查看 Pod 详情

```bash
kubectl describe pod order-service-abc123 -n my-namespace
```

重点关注 `Last State` 和 `Exit Code`：

```yaml
Containers:
  order-service:
    Container ID:   containerd://abc123...
    State:          Running
    Last State:     Terminated
      Reason:       OOMKilled         ← 被 OOM 杀死！
      Exit Code:    137               ← 137 = 128 + 9 (SIGKILL)
      Started:      Mon, 27 Jun 2026 10:00:00 +0800
      Finished:     Mon, 27 Jun 2026 10:15:23 +0800
    Ready:          True
    Restart Count:  7
    Limits:
      memory:       512Mi             ← 内存限制 512MB
    Requests:
      memory:       256Mi
```

### 2.3 Exit Code 速查表

| Exit Code | 含义 | 常见原因 |
|-----------|------|---------|
| 0 | 正常退出 | 正常关闭 |
| 1 | 应用错误 | 代码异常 |
| 137 | OOMKilled / SIGKILL | 内存超限或被强制杀死 |
| 139 | SIGSEGV | 段错误（native 代码问题） |
| 143 | SIGTERM | 正常终止信号 |

**137 是最常见的异常退出码**，表示进程被 SIGKILL（信号 9）杀死。在 K8s 中通常意味着 OOMKilled。

## 三、OOMKilled 排查

### 3.1 问题现象

```
Pod 频繁重启，RESTARTS 持续增长
Last State Reason: OOMKilled
Exit Code: 137
容器内存限制: 512Mi
```

### 3.2 K8s 内存管理机制

```
K8s 内存配置：
  requests.memory: 256Mi  ← 调度依据（保证能分配到这么多）
  limits.memory:   512Mi  ← 硬限制（超过就会被 OOMKilled）

JVM 内存 ≠ 容器内存：
  容器内存 = JVM 堆 + Metaspace + 线程栈 + 直接内存 + JIT 缓存 + GC 开销
  如果 JVM 堆设为 512MB，但容器限制也是 512MB → 必然 OOMKilled！
```

### 3.3 常见错误：JVM 堆 == 容器内存限制

```yaml
# 问题配置
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: order-service
    image: order-service:latest
    resources:
      limits:
        memory: "512Mi"      # 容器内存限制 512MB
      requests:
        memory: "256Mi"
    env:
    - name: JAVA_OPTS
      value: "-Xmx512m"      # JVM 堆也是 512MB ← 必然 OOMKilled！
```

JVM 堆 512MB + Metaspace(~100MB) + 线程栈(~50MB) + 直接内存 + GC 开销 > 512MB → 容器 OOM。

### 3.4 正确配置

```yaml
# 正确配置：容器内存 = JVM 堆 × 1.5 ~ 2
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: order-service
    image: order-service:latest
    resources:
      limits:
        memory: "1Gi"        # 容器限制 1GB
      requests:
        memory: "768Mi"      # 请求 768MB
    env:
    - name: JAVA_OPTS
      value: "-Xmx512m -Xms512m -XX:MaxMetaspaceSize=128m -XX:MaxDirectMemorySize=128m"
      # 堆 512MB + Metaspace 128MB + 直接内存 128MB + 其他开销 ~200MB ≈ 960MB < 1GB
```

### 3.5 内存分配公式

```
容器内存限制 = JVM 堆 + Metaspace + 直接内存 + 线程栈 + 其他开销

推荐分配：
  JVM 堆:        容器内存 × 50%-60%
  Metaspace:     128MB - 256MB
  直接内存:      128MB（如有 NIO 使用）
  线程栈:        线程数 × 1MB（默认每线程 1MB）
  GC + JIT 开销: ~100MB
  安全余量:      ~50MB

示例（容器 2GB）:
  -Xmx1024m (堆 1GB = 50%)
  -XX:MaxMetaspaceSize=256m
  -XX:MaxDirectMemorySize=256m
  线程栈: 200 线程 × 1MB = 200MB
  其他: 300MB
  总计: ~2GB ← 刚好
```

### 3.6 使用 cgroup 感知参数

JDK 8u191+ 和 JDK 10+ 支持 `UseContainerSupport`（默认开启），JVM 能感知容器内存限制：

```bash
# JDK 8u191+ 推荐参数
JAVA_OPTS="-XX:+UseContainerSupport \
           -XX:MaxRAMPercentage=60.0 \
           -XX:InitialRAMPercentage=60.0 \
           -XX:MinRAMPercentage=60.0"

# MaxRAMPercentage=60 表示 JVM 堆 = 容器内存限制 × 60%
# 容器 1GB → 堆 600MB
```

**注意：不要同时使用 `-Xmx` 和 `MaxRAMPercentage`**，`-Xmx` 会覆盖百分比设置。

### 3.7 内存泄漏导致 OOMKilled

如果配置正确但仍然 OOMKilled，可能是应用有内存泄漏。

**排查方法：**

```yaml
# 配置 OOM 时自动 dump
env:
- name: JAVA_OPTS
  value: "-XX:+HeapDumpOnOutOfMemoryError \
          -XX:HeapDumpPath=/data/dumps/ \
          -XX:+UseContainerSupport \
          -XX:MaxRAMPercentage=60.0"

# 挂载 dump 目录
volumeMounts:
- name: dump-volume
  mountPath: /data/dumps
volumes:
- name: dump-volume
  emptyDir: {}
```

OOM 后从 dump 目录取出 heap dump，用 MAT 分析（参考内存泄漏排查实战那篇）。

```bash
# 从 Pod 中拷贝 dump 文件
kubectl cp my-namespace/order-service-abc123:/data/dumps/heap.hprof /tmp/heap.hprof

# 用 MAT 分析
```

### 3.8 cgroup v2 问题

K8s 1.25+ 默认使用 cgroup v2，部分老版本 JDK 可能不兼容：

```bash
# 检查 cgroup 版本
stat /sys/fs/cgroup/cgroup.controllers
# 如果存在 → cgroup v2
# 如果 No such file → cgroup v1

# JDK 8u372+ 完整支持 cgroup v2
# 如果用老版本 JDK，升级或使用 cgroup v1
```

## 四、Liveness Probe 失败排查

### 4.1 问题现象

```
Pod 重启频繁，但不是 OOMKilled
Last State Reason: Error
Exit Code: 137（被 K8s 杀死）
Events:
  Warning  Unhealthy  10s (x3 over 30s)  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 503
  Warning  Killing    10s                kubelet  Container order-service failed liveness probe, will be restarted
```

Liveness Probe 失败 3 次后，K8s 杀死并重启容器。

### 4.2 健康检查类型

```yaml
# 三种探针
livenessProbe:    # 存活探针 — 失败会重启 Pod
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 60    # 初始延迟（等应用启动）
  periodSeconds: 10          # 检查间隔
  timeoutSeconds: 3          # 超时时间
  failureThreshold: 3        # 连续失败 3 次才判定失败
  successThreshold: 1        # 成功 1 次就恢复

readinessProbe:   # 就绪探针 — 失败会从 Service 摘除（不重启）
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5
  failureThreshold: 3

startupProbe:     # 启动探针 — 用于慢启动应用（JVM 预热）
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 60      # 最多等 5 × 60 = 300 秒启动
```

### 4.3 Liveness Probe 常见问题

**问题一：initialDelaySeconds 太短**

```yaml
# 问题：JVM 启动需要 60 秒，但 30 秒就开始探测
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 30   # ← 30 秒太短！
  periodSeconds: 10
  failureThreshold: 3
# 30 + 10×3 = 60 秒后判定失败，此时应用还没启动完
# → Pod 被重启 → 再次启动 → 再次失败 → 循环重启
```

**修复：使用 startupProbe**

```yaml
# startupProbe 专门用于慢启动场景
# startupProbe 通过前，liveness/readiness 不会执行
startupProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 60      # 5 × 60 = 300 秒启动窗口
  timeoutSeconds: 3

livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  periodSeconds: 10
  failureThreshold: 3
  timeoutSeconds: 3
  # 不需要 initialDelaySeconds 了

readinessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

**问题二：检查路径不当**

```yaml
# 问题：用业务接口做健康检查
livenessProbe:
  httpGet:
    path: /api/order/list   # ← 业务接口，可能因为下游问题变慢
    port: 8080
# 如果数据库慢导致接口超时 → 健康检查超时 → Pod 重启
# 但重启解决不了数据库慢的问题 → 循环重启
```

**修复：使用专门的健康检查端点**

```yaml
# 正确：用专门的健康检查端点
livenessProbe:
  httpGet:
    path: /actuator/health/liveness   # 只检查应用本身是否活着
    port: 8080
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /actuator/health/readiness  # 检查是否准备好接收流量
    port: 8080
  timeoutSeconds: 3
  failureThreshold: 3
```

Spring Boot Actuator 健康检查分组：

```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true   # 启用 K8s 探针端点
      show-details: always
  endpoints:
    web:
      exposure:
        include: health,info,metrics

# 自定义健康检查
# liveness: 只检查 JVM 是否正常
# readiness: 检查依赖（DB、Redis）是否就绪
```

**问题三：timeoutSeconds 太短**

```yaml
# 问题：超时时间 1 秒太短
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  timeoutSeconds: 1        # ← GC 停顿一下就超时了
  failureThreshold: 3
  periodSeconds: 10
```

如果 JVM 发生 GC 停顿（如 500ms），加上网络开销，1 秒可能不够。

**修复：**

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  timeoutSeconds: 3        # 3 秒比较合理
  failureThreshold: 3
  periodSeconds: 10
```

**问题四：检查频率太高**

```yaml
# 问题：每 2 秒检查一次，频率太高
livenessProbe:
  periodSeconds: 2
# 每次健康检查是一次 HTTP 请求，频率太高会占用应用资源
# 特别是 Spring Boot Actuator 的健康检查可能查 DB、Redis
```

**修复：**

```yaml
livenessProbe:
  periodSeconds: 10       # 10 秒一次够了
  failureThreshold: 3     # 30 秒内 3 次失败才重启
```

### 4.4 健康检查最佳实践

```yaml
# Java 应用推荐的探针配置
startupProbe:              # 启动探针：等应用启动
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 60    # 最多等 5 分钟
  timeoutSeconds: 3

livenessProbe:             # 存活探针：应用是否活着
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  failureThreshold: 3     # 30 秒失败才重启
  timeoutSeconds: 3

readinessProbe:            # 就绪探针：是否能接流量
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  failureThreshold: 3     # 15 秒失败就摘流
  timeoutSeconds: 3
```

## 五、实战案例一：JVM 堆配置不当导致 OOMKilled

### 5.1 背景

Java 服务部署在 K8s，容器内存限制 2GB，JVM 参数 `-Xmx2048m`。每 2-3 小时 Pod 重启一次。

### 5.2 分析

```
容器内存限制: 2GB
JVM 堆: 2GB (-Xmx2048m)
其他内存: Metaspace(~200MB) + 线程栈(~200MB) + 直接内存(~100MB) + GC开销(~100MB)
实际需要: 2GB + 600MB = 2.6GB > 2GB → OOMKilled
```

### 5.3 修复

```yaml
# 方案一：增大容器内存限制
resources:
  limits:
    memory: "3Gi"
  requests:
    memory: "2.5Gi"
env:
- name: JAVA_OPTS
  value: "-Xmx2048m -XX:MaxMetaspaceSize=256m -XX:MaxDirectMemorySize=128m"

# 方案二：减小 JVM 堆（推荐）
resources:
  limits:
    memory: "2Gi"
  requests:
    memory: "1.5Gi"
env:
- name: JAVA_OPTS
  value: "-XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0"
  # 堆 = 2GB × 60% = 1200MB，其余给非堆内存
```

## 六、实战案例二：GC 停顿导致 Liveness 失败

### 6.1 背景

Java 服务在 K8s 中运行，每隔几天 Pod 重启一次，重启前有 GC 告警。

### 6.2 排查

```bash
# 查看 Pod 重启前的事件
kubectl get events -n my-namespace --sort-by='.lastTimestamp' | tail -20

# 输出：
# 10m   Warning   Unhealthy   Pod/order-service   Liveness probe failed: Get "http://10.0.1.5:8080/actuator/health": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
# 10m   Warning   Killing     Pod/order-service   Container order-service failed liveness probe, will be restarted
```

Liveness 探针超时了。查看 GC 日志：

```bash
# 查看 GC 日志
kubectl logs order-service-abc123 -n my-namespace --previous | grep "Pause"

# 输出：
# [2026-06-27T10:15:23] GC(245) Pause Full (G1 Compaction Pause) 1.5G->1.2G(1.7G) 4500ms
```

Full GC 停顿 4.5 秒！Liveness 探针 `timeoutSeconds: 3` 秒，3 秒超时 → 判定失败 → 重启。

### 6.3 修复

```yaml
# 方案一：增大探针超时
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  timeoutSeconds: 10       # 10 秒，容忍 GC 停顿
  failureThreshold: 3
  periodSeconds: 10

# 方案二：优化 GC（治本）
env:
- name: JAVA_OPTS
  value: "-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseContainerSupport -XX:MaxRAMPercentage=60.0"
  # 或使用 ZGC（JDK 15+）：-XX:+UseZGC

# 方案三：增大容器内存减少 GC 频率
resources:
  limits:
    memory: "4Gi"
  requests:
    memory: "3Gi"
```

## 七、日志排查技巧

### 7.1 查看重启前日志

```bash
# --previous 查看上次容器退出前的日志
kubectl logs order-service-abc123 -n my-namespace --previous

# 最后 100 行
kubectl logs order-service-abc123 -n my-namespace --previous --tail=100
```

### 7.2 查看事件

```bash
# 查看 Pod 相关事件
kubectl describe pod order-service-abc123 -n my-namespace

# 按时间排序
kubectl get events -n my-namespace --sort-by='.lastTimestamp'

# 过滤 Warning 事件
kubectl get events -n my-namespace --field-selector type=Warning
```

### 7.3 容器退出消息

```bash
# 查看容器状态
kubectl get pod order-service-abc123 -n my-namespace -o jsonpath='{.status.containerStatuses[0].lastState}'

# 输出：
# {"terminated":{"exitCode":137,"reason":"OOMKilled","message":"...","startedAt":"...","finishedAt":"..."}}
```

## 八、Pod 重启预防清单

```yaml
# Java 应用 K8s 部署最佳实践
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      containers:
      - name: order-service
        image: order-service:v1.0.0
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
        env:
        - name: JAVA_OPTS
          value: >-
            -XX:+UseContainerSupport
            -XX:MaxRAMPercentage=60.0
            -XX:InitialRAMPercentage=60.0
            -XX:+HeapDumpOnOutOfMemoryError
            -XX:HeapDumpPath=/data/dumps/
            -XX:+UseG1GC
            -XX:MaxGCPauseMillis=200
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 60
          timeoutSeconds: 3
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          failureThreshold: 3
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 5
          failureThreshold: 3
          timeoutSeconds: 3
        volumeMounts:
        - name: dump-volume
          mountPath: /data/dumps
      volumes:
      - name: dump-volume
        emptyDir: {}
      terminationGracePeriodSeconds: 60  # 优雅关闭 60 秒
```

## 九、面试要点总结

### Q1：Pod 频繁重启怎么排查？

1. `kubectl describe pod` 查看 `Last State` 和 `Exit Code`
2. Exit Code 137 → OOMKilled，检查内存配置
3. Events 中有 `Liveness probe failed` → 健康检查问题
4. `kubectl logs --previous` 查看重启前日志

### Q2：OOMKilled 怎么解决？

1. 检查容器内存限制和 JVM 堆配置是否匹配
2. 容器内存 = JVM 堆 × 1.5 ~ 2（给非堆内存留空间）
3. 使用 `MaxRAMPercentage` 替代硬编码 `-Xmx`
4. 如果配置正确仍然 OOM → 排查内存泄漏
5. 配置 `-XX:+HeapDumpOnOutOfMemoryError` 抓取 dump

### Q3：Liveness Probe 失败怎么排查？

1. 检查 `initialDelaySeconds` 是否太短（应用没启动完就开始探测）
2. 检查 `timeoutSeconds` 是否太短（GC 停顿导致超时）
3. 检查检查路径是否合理（不要用业务接口）
4. 使用 `startupProbe` 解决慢启动问题
5. 优化 GC 停顿时间

### Q4：K8s 三种探针的区别？

- **startupProbe**：启动探针，判断应用是否启动完成。通过前，其他探针不执行
- **livenessProbe**：存活探针，判断应用是否健康。失败会重启 Pod
- **readinessProbe**：就绪探针，判断是否能接流量。失败会从 Service 摘除但不重启

### Q5：Java 应用在 K8s 中内存怎么配置？

```
容器内存限制 = JVM 堆(60%) + Metaspace(10%) + 直接内存(5%) + 线程栈(5%) + 其他(20%)

推荐：
  -XX:+UseContainerSupport
  -XX:MaxRAMPercentage=60.0
  容器内存 = JVM 堆 × 1.5~2
```

## 十、总结

Pod 频繁重启排查的核心思路：

```
kubectl describe pod → 看 Exit Code 和 Reason
  ├── 137/OOMKilled → 检查内存配置
  │     ├── JVM 堆 + 非堆 > 容器限制？→ 调整配置
  │     └── 配置正确仍 OOM？→ 排查内存泄漏
  │
  └── Liveness failed → 检查探针配置
        ├── initialDelaySeconds 太短？→ 用 startupProbe
        ├── timeoutSeconds 太短？→ 增大到 5-10 秒
        ├── 检查路径不对？→ 用 /actuator/health/liveness
        └── GC 停顿？→ 优化 GC 参数
```

Java 应用在 K8s 中最关键的一点：**容器内存 ≠ JVM 堆**。给非堆内存留足空间，用 `MaxRAMPercentage` 替代硬编码 `-Xmx`，90% 的 OOMKilled 问题都能解决。
