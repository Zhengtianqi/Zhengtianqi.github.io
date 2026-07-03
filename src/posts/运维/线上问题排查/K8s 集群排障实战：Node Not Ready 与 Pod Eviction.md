---
title: K8s 集群排障实战：Node Not Ready 与 Pod Eviction
tag: ["Kubernetes", "NodeNotReady", "PodEviction", "kubelet", "线上排障"]
category: 运维
date: 2026-07-03
---

# K8s 集群排障实战：Node Not Ready 与 Pod Eviction

> 早上 9 点，你收到告警：K8s 集群有 3 个 Node 状态变成 Not Ready，上面运行的 47 个 Pod 被 Evicted。订单服务的 Pod 在其他节点重建后持续 CrashLoopBackOff。这不是简单的重启能解决的——Node 为什么 Not Ready？Pod 为什么被驱逐？重建后为什么起不来？本文带你完整排查 K8s 集群级故障。

## 一、Node Not Ready：原因全景与快速判断

### 1.1 Node 状态详解

```bash
# 查看所有 Node 状态
kubectl get nodes -o wide

# NAME            STATUS     ROLES    AGE    VERSION    INTERNAL-IP
# worker-node-01  Ready      <none>   120d   v1.28.4    10.0.1.21
# worker-node-02  NotReady   <none>   120d   v1.28.4    10.0.1.22  ← 故障节点
# worker-node-03  NotReady   <none>   120d   v1.28.4    10.0.1.23  ← 故障节点
# worker-node-04  Ready      <none>   90d    v1.28.4    10.0.1.24

# 查看 NotReady 节点的详细信息
kubectl describe node worker-node-02
```

**Node Conditions 详解**：

```
┌──────────────────────────────────────────────────────────────────┐
│                  Node Conditions 状态表                          │
├──────────────────┬──────────────┬───────────────────────────────┤
│ Condition        │ Status 值    │ 含义                          │
├──────────────────┼──────────────┼───────────────────────────────┤
│ Ready            │ True         │ 节点健康，可接受 Pod          │
│                  │ False       │ 节点不健康，kubelet 心跳超时  │
│                  │ Unknown     │ 节点失联，controller 无法联系 │
├──────────────────┼──────────────┼───────────────────────────────┤
│ MemoryPressure   │ True/False   │ 内存不足（可用 < 阈值）       │
│ DiskPressure     │ True/False   │ 磁盘空间不足                  │
│ PIDPressure      │ True/False   │ 进程数过多                    │
│ NetworkUnavailable│ True/False  │ 网络不可用                    │
└──────────────────┴──────────────┴───────────────────────────────┘
```

```yaml
# kubectl describe node 输出示例（故障节点）
Conditions:
  Type              Status  LastHeartbeatTime                LastTransitionTime               Reason                  Message
  ----              ------  -----------------                ------------------               ------                  -------
  MemoryPressure    True    Sat, 03 Jul 2026 09:15:32 +0800  Sat, 03 Jul 2026 09:10:00 +0800  KubeletHasInsufficientMemory  Node has insufficient memory
  DiskPressure      True    Sat, 03 Jul 2026 09:15:32 +0800  Sat, 03 Jul 2026 09:08:00 +0800  KubeletHasNoDiskSpace       Node has no disk space
  PIDPressure       False   Sat, 03 Jul 2026 09:15:32 +0800  Sat, 03 Jul 2026 09:00:00 +0800  KubeletHasSufficientPID
  Ready             False   Sat, 03 Jul 2026 09:15:32 +0800  Sat, 03 Jul 2026 09:12:00 +0800  KubeletNotReady            Kubelet stopped posting node status.
```

### 1.2 Node Not Ready 的常见原因

```
┌──────────────────────────────────────────────────────────────────┐
│                Node Not Ready 原因分类                           │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  kubelet 问题 │  容器运行时    │  资源压力      │  网络/基础设施   │
├───────────────┼───────────────┼───────────────┼─────────────────┤
│ kubelet 崩溃 │ containerd    │ 磁盘满         │ 网络分区         │
│ kubelet 卡住 │ docker daemon │ 内存不足       │ DNS 解析失败     │
│ 证书过期     │ 运行时无响应   │ PID 耗尽      │ API Server 不可达│
│ 配置错误     │ 镜像存储满    │ CPU 100%      │ 节点关机/重启    │
│ cgroup 损坏  │              │               │ 云厂商维护       │
└───────────────┴───────────────┴───────────────┴─────────────────┘
```

## 二、排查步骤：从 Node 到 kubelet

### 2.1 第一步：确认 Node 状态和 Conditions

```bash
# 获取故障节点的详细状态
kubectl describe node worker-node-02 | grep -A 20 "Conditions:"

# 关键信息：
# 1. LastHeartbeatTime — 最后一次心跳时间（如果很久以前，说明 kubelet 可能挂了）
# 2. LastTransitionTime — 状态变化时间（定位故障发生时间点）
# 3. Reason — 具体原因（KubeletNotReady、KubeletHasNoDiskSpace 等）
# 4. Message — 详细描述

# 查看节点上的 Pod 状态
kubectl get pods --all-namespaces --field-selector spec.nodeName=worker-node-02

# 查看被驱逐的 Pod
kubectl get pods --all-namespaces --field-selector spec.nodeName=worker-node-02 \
  -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name}{"\t"}{.status.phase}{"\t"}{.status.reason}{"\n"}{end}'
```

### 2.2 第二步：SSH 到故障节点排查

```bash
# SSH 到故障节点
ssh worker-node-02

# 检查 1：kubelet 是否在运行
systemctl status kubelet

# 输出示例（故障状态）：
# ● kubelet.service - Kubernetes Kubelet
#    Loaded: loaded (/usr/lib/systemd/system/kubelet.service; enabled)
#    Active: active (running)  ← 在运行，但可能卡住了
#    ...
#    CGroup: /system.slice/kubelet.service
#            └─1234 /usr/bin/kubelet --config=/var/lib/kubelet/config.yaml ...

# 检查 2：kubelet 日志
journalctl -u kubelet --since "2026-07-03 09:00" --no-pager | tail -100

# 常见错误日志：
# "Failed to check if container /kubepods is OOM" → cgroup 问题
# "kubelet_node_status.go:XXX] Unable to register node" → API Server 不可达
# "container runtime not ready" → 容器运行时问题
# "disk usage 95% is above threshold" → 磁盘满
# "failed to get container info" → 容器运行时无响应

# 检查 3：磁盘空间
df -h

# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda2        50G   48G   2G   96%  /        ← 根分区快满了！
# /dev/sda3       200G  150G  50G  75%  /var/lib/containers
# /dev/sda1       512M  100M  412M  20%  /boot

# 检查 4：内存
free -h

#               total        used        free      shared  buff/cache   available
# Mem:            16G         14G        200M       100M        1.8G        500M  ← 可用内存不足！
# Swap:           0B          0B          0B

# 检查 5：容器运行时状态（containerd）
crictl info
# 如果超时无响应，说明 containerd 挂了

# 检查 6：进程数
ps aux | wc -l
# 如果 > 10000，可能 PIDPressure

# 检查 7：CPU 负载
uptime
# 09:15:32 up 120 days, load average: 16.50, 15.20, 10.10  ← 16 核机器 load 16+ 说明 CPU 瓶颈
```

### 2.3 第三步：根据症状定位根因

```bash
# 症状 1：磁盘满 → 检查什么占了磁盘
du -sh /var/lib/containers/*  | sort -rh | head -10
du -sh /var/log/* | sort -rh | head -10
du -sh /var/lib/kubelet/* | sort -rh | head -10

# 常见磁盘占用大户：
# 1. /var/lib/containers/storage — 容器镜像和层
# 2. /var/log — 日志文件
# 3. /var/lib/kubelet — kubelet 数据
# 4. /var/lib/containers/overlay-containers — overlay 挂载残留

# 症状 2：内存不足 → 检查 Pod 内存使用
crictl ps -a | awk '{print $1}' | xargs -I{} crictl inspect {} 2>/dev/null | \
  grep -E '"name"|"memory"' | head -40

# 症状 3：kubelet 日志显示容器运行时不可达
# 检查 containerd
systemctl status containerd
journalctl -u containerd --since "2026-07-03 09:00" --no-pager | tail -50

# 检查 containerd 是否有死锁
crictl --timeout=10s ps -a
# 如果超时，containerd 可能卡住了
```

## 三、磁盘满导致 Node Not Ready

这是最常见的 Node Not Ready 原因，占生产事故的 40%+。

### 3.1 磁盘满的根因分析

```
┌──────────────────────────────────────────────────────────────────┐
│                  K8s 节点磁盘占用分析                            │
│                                                                  │
│  /var/lib/containers/     ← 容器镜像和可写层                     │
│  ├── overlay-images/      镜像存储                              │
│  ├── overlay-containers/  容器层                                │
│  └── overlay/             overlay 挂载                          │
│                                                                  │
│  /var/log/                ← 系统和应用日志                       │
│  ├── containers/          容器 stdout/stderr 日志               │
│  ├── pods/                Pod 日志                               │
│  └── journal/             systemd journal                        │
│                                                                  │
│  /var/lib/kubelet/        ← kubelet 数据                        │
│  ├── pods/                Pod 挂载点                             │
│  └── plugins/             CSI 插件                               │
│                                                                  │
│  /var/lib/cni/            ← CNI 网络配置                        │
│  /tmp/                    ← 临时文件                             │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 容器日志爆炸

```bash
# 查看容器日志大小
du -sh /var/log/containers/* | sort -rh | head -20
# 5.2G  /var/log/containers/order-service_default_order-service-abc123.log
# 3.8G  /var/log/containers/payment-service_default_payment-service-def456.log
# 2.1G  /var/log/containers/nginx-ingress_ingress-nginx_nginx-ghi789.log

# 查看 Pod 日志
du -sh /var/log/pods/* | sort -rh | head -20

# 容器日志轮转配置（containerd）
# /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri"]
  [plugins."io.containerd.grpc.v1.cri".containerd]
    # 容器日志配置
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
      ...
  
# Docker 方式（如果用 Docker）：
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",     ← 单个日志文件最大 100MB
    "max-file": "3"         ← 最多保留 3 个文件
  }
}
```

### 3.3 镜像残留

```bash
# 查看镜像列表
crictl images

# 清理未使用的镜像
crictl rmi --prune
# 这会删除所有未被任何容器使用的镜像

# containerd 方式的清理
ctr -n k8s.io images list | grep -v REGISTRY | awk '{print $1}' | xargs -I{} ctr -n k8s.io images rm {}

# 设置自动清理策略
# /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri".image_decryption]
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
    # GC 策略
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.sandbox]
    # ...
```

### 3.4 紧急恢复

```bash
# 紧急清理磁盘（按安全等级排序）

# 1. 清理容器日志（安全）
find /var/log/containers/ -name "*.log" -size +500M -exec truncate -s 0 {} \;

# 2. 清理已退出的容器
crictl ps -a --state Exited -q | xargs -r crictl rm

# 3. 清理未使用的镜像（安全）
crictl rmi --prune

# 4. 清理旧日志（安全）
journalctl --vacuum-size=200M

# 5. 清理临时文件（需确认）
find /tmp -type f -atime +7 -delete

# 6. 清理下载的临时镜像压缩包（安全）
rm -f /tmp/*.tar.gz /var/tmp/*.tar.gz

# 确认磁盘空间恢复
df -h /

# kubelet 应该会自动恢复 Ready 状态
# 如果没有，手动重启 kubelet
systemctl restart kubelet
```

## 四、Pod Eviction 机制详解

### 4.1 Eviction 触发条件

```
┌──────────────────────────────────────────────────────────────────┐
│                Kubelet Eviction 机制                             │
│                                                                  │
│  Kubelet 监控节点资源，当达到阈值时触发 Eviction：               │
│                                                                  │
│  软驱逐（Soft Eviction）：                                       │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ memory.available < 1.5Gi  (eviction-hard)            │      │
│  │ nodefs.available < 10%   (eviction-hard)             │      │
│  │ nodefs.inodesFree < 5%   (eviction-hard)             │      │
│  │ imagefs.available < 15%  (eviction-hard)             │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  驱逐顺序（优先级从低到高）：                                    │
│  1. BestEffort 的 Pod                                           │
│  2. Burstable 中超过 request 的 Pod                             │
│  3. Burstable 中未超过 request 的 Pod                           │
│  4. Guaranteed 的 Pod                                           │
│                                                                  │
│  被驱逐的 Pod 不会自动在原节点重建                               │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 查看 Evicted Pod

```bash
# 查看所有 Evicted Pod
kubectl get pods --all-namespaces --field-selector status.phase=Failed -o jsonpath='{range .items[?(@.status.reason=="Evicted")]}{.metadata.namespace}/{.metadata.name}{"\t"}{.status.message}{"\n"}{end}'

# 输出示例：
# default/order-service-abc123    The node was low on resource: memory. Container order-service was using 2Gi (75% of memory limit)
# default/payment-service-def456  The node was low on resource: disk. 
# monitoring/prometheus-ghi789    The node was low on resource: memory.

# 查看 Eviction 详情
kubectl describe pod order-service-abc123 | grep -A 10 "Reason:"

# 查看事件
kubectl get events --all-namespaces --field-selector reason=Evicted
```

### 4.3 处理 Evicted Pod

```bash
# Evicted Pod 不会自动删除，需要手动清理
# 批量删除 Evicted Pod
kubectl get pods --all-namespaces --field-selector status.phase=Failed | grep Evicted | \
  awk '{print "-n "$1" "$2}' | xargs kubectl delete pod

# 或者用一行命令
kubectl delete pods --all-namespaces --field-selector status.phase=Failed

# 检查 Deployment 是否在健康节点上重建了 Pod
kubectl get pods -n default -l app=order-service -o wide
# NAME              READY   STATUS    RESTARTS   AGE   IP           NODE
# order-service-1  1/1     Running   0          30s   10.244.1.5   worker-node-01  ← 重建在新节点
# order-service-2  1/1     Running   0          30s   10.244.4.5   worker-node-04
```

## 五、kubelet 故障排查

### 5.1 kubelet 常见故障

```bash
# 故障 1：kubelet 证书过期
journalctl -u kubelet | grep -i "certificate\|x509\|tls"
# "failed to get server certificate: certificate has expired or is not yet valid"
# 解决：
cd /etc/kubernetes/pki
openssl x509 -in kubelet.crt -noout -dates
# 如果已过期，重新签发
kubeadm certs renew kubeletcert
systemctl restart kubelet

# 故障 2：kubelet 无法连接 API Server
journalctl -u kubelet | grep -i "api\|connect\|refused"
# "Failed to connect to API Server: dial tcp 10.0.0.1:6443: connect: connection refused"
# 检查 API Server：
kubectl cluster-info
# 如果 API Server 挂了，需要先修复控制面

# 故障 3：cgroup 驱动不匹配
journalctl -u kubelet | grep -i "cgroup"
# "Failed to start ContainerManager: cgroup driver mismatch"
# kubelet 配置 systemd cgroup，但容器运行时配置 cgroupfs
# 解决：统一 cgroup 驱动
# /var/lib/kubelet/config.yaml
# cgroupDriver: systemd

# /etc/containerd/config.toml
# [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
#   [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
#     SystemdCgroup = true

# 故障 4：容器运行时不可达
journalctl -u kubelet | grep -i "runtime\|containerd\|cri"
# "Container runtime not ready: CRI check failed"
# 检查 containerd：
systemctl status containerd
systemctl restart containerd
sleep 5
systemctl restart kubelet
```

### 5.2 kubelet 调试

```bash
# 查看 kubelet 配置
cat /var/lib/kubelet/config.yaml

# 查看 kubelet 运行参数
ps aux | grep kubelet

# 查看 kubelet 的 eviction 配置
cat /var/lib/kubelet/config.yaml | grep -A 10 eviction

# evictionHard:
#   memory.available:  "1.5Gi"    ← 内存可用低于 1.5Gi 触发驱逐
#   nodefs.available:  "10%"      ← 节点磁盘可用低于 10% 触发驱逐
#   nodefs.inodesFree: "5%"       ← inode 低于 5% 触发驱逐
#   imagefs.available: "15%"      ← 镜像磁盘可用低于 15% 触发驱逐

# 查看 kubelet 的心跳配置
cat /var/lib/kubelet/config.yaml | grep -E "nodeStatus|frequency"
# nodeStatusReportFrequency: 60s    ← 每 60 秒报告状态
# nodeStatusUpdateFrequency: 10s    ← 每 10 秒更新状态
# 如果心跳超时（默认 40 秒），Node 变为 NotReady

# 手动检查 kubelet 心跳
curl -k https://localhost:10250/healthz
# ok  ← 健康检查通过
```

## 六、容器运行时故障

### 6.1 containerd 故障排查

```bash
# 查看 containerd 状态
systemctl status containerd

# 查看 containerd 日志
journalctl -u containerd --since "2026-07-03 09:00" --no-pager | tail -100

# 常见故障：
# 1. containerd dead lock
#    "containerd: failed to recover container"
#    解决：重启 containerd
systemctl restart containerd

# 2. 镜像存储损坏
#    "failed to extract layer: unknown blob"
#    解决：清理损坏的镜像
crictl images | awk '{print $3}' | xargs -I{} crictl rmi {} 2>/dev/null
# 或者彻底清理
rm -rf /var/lib/containers/storage/*
systemctl restart containerd

# 3. overlay 挂载残留
#    "failed to mount overlay: device or resource busy"
#    解决：清理残留挂载
umount $(mount | grep overlay | awk '{print $3}')
# 或者用 crictl 清理
crictl ps -a --state NotReady -q | xargs -r crictl rm

# 4. containerd 配置错误
#    "failed to load config: invalid configuration"
#    解决：检查配置文件
containerd config dump | head -50
```

### 6.2 镜像拉取失败导致 CrashLoopBackOff

```bash
# Pod 重建后 CrashLoopBackOff，查看原因
kubectl describe pod order-service-abc123 | tail -20

# Events:
#   Type     Reason          Age                From               Message
#   ----     ------          ----               ----               -------
#   Normal   Scheduled       2m                 default-scheduler  Successfully assigned default/order-service to worker-node-04
#   Warning  FailedMount     1m (x2 over 1m)    kubelet            MountVolume failed: image pull failed: rpc error: code = Unknown
#   Normal   Pulling         1m (x3 over 2m)    kubelet            Pulling image "registry.example.com/order-service:v2.3.1"
#   Warning  Failed          1m (x3 over 2m)    kubelet            Failed to pull image: rpc error: code = Unknown desc = failed to resolve reference: denied: access forbidden
#   Warning  BackOff         30s (x5 over 2m)   kubelet            Back-off restarting failed container

# 排查镜像拉取问题
# 1. 检查镜像引用
kubectl get pod order-service-abc123 -o jsonpath='{.spec.containers[0].image}'

# 2. 检查 imagePullSecrets
kubectl get pod order-service-abc123 -o jsonpath='{.spec.imagePullSecrets}'

# 3. 检查节点上的镜像拉取凭证
crictl pull registry.example.com/order-service:v2.3.1
# 如果报 access forbidden，说明凭证问题

# 4. 检查容器运行时配置
cat /etc/containerd/config.toml | grep -A 5 "registry"
```

## 七、资源碎片与调度失败

### 7.1 调度失败排查

```bash
# Pod 一直 Pending
kubectl get pod order-service-xyz -o wide
# NAME              READY   STATUS    RESTARTS   AGE   IP       NODE     NOMINATED NODE
# order-service-xyz 0/1    Pending   0          5m    <none>   <none>   <none>

# 查看调度失败原因
kubectl describe pod order-service-xyz | tail -15
# Events:
#   Type     Reason            Age   From               Message
#   ----     ------            ----  ----               -------
#   Warning  FailedScheduling  5m    default-scheduler  0/5 nodes are available: 
#   1 node(s) had untolerated taint, 
#   2 node(s) Insufficient memory, 
#   2 node(s) didn't match Pod's node affinity.

# 分析调度失败原因
# 1. 资源不足（Insufficient memory/cpu）
# 2. 亲和性/反亲和性不匹配
# 3. 污点/容忍（Taint/Toleration）不匹配
# 4. 节点选择器（nodeSelector）不匹配
```

### 7.2 资源碎片分析

```bash
# 查看各节点资源分配情况
kubectl describe nodes | grep -A 5 "Allocated:"

# 或者用 kubectl top（需要 metrics-server）
kubectl top nodes

# NAME            CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# worker-node-01  320m         4%     4200Mi          27%
# worker-node-02  0m           0%     0Mi             0%     ← NotReady
# worker-node-03  0m           0%     0Mi             0%     ← NotReady
# worker-node-04  6500m        81%    12000Mi         75%    ← 满了
# worker-node-05  890m         11%    3000Mi          19%

# 可用资源：node-01 和 node-05
# 但如果 Pod 需要请求 8GB 内存，只有 node-01 够用

# 查看各节点 Pod 资源请求
kubectl get pods --all-namespaces -o json | \
  jq '[.items[] | select(.spec.nodeName=="worker-node-04") | 
    {name: .metadata.name, cpu: .spec.containers[].resources.requests.cpu, 
     memory: .spec.containers[].resources.requests.memory}]'
```

### 7.3 资源碎片整理

```bash
# 1. 查看哪些 Pod 占用了过多资源
kubectl get pods --all-namespaces -o json | \
  jq -r '[.items[] | 
    {name: .metadata.namespace + "/" + .metadata.name, 
     node: .spec.nodeName,
     cpu: (.spec.containers[].resources.requests.cpu // "0"),
     memory: (.spec.containers[].resources.requests.memory // "0")}][] | 
    "\(.node)\t\(.cpu)\t\(.memory)\t\(.name)"' | \
  sort -k1,1 -k2,2 | column -t

# 2. 检查是否有 Pod 请求了过多资源但实际不用
# 对比 requests 和实际使用
kubectl top pods --all-namespaces --sort-by=memory

# 3. 如果有 Pod requests 过高，调整 Deployment
kubectl set resources deployment order-service \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=1000m,memory=1Gi

# 4. 考虑使用 Cluster Autoscaler 自动扩容节点
# 或者使用 Descheduler 重新调度均衡负载
```

## 八、完整故障处理流程

### 8.1 SOP：Node Not Ready 标准处理流程

```bash
#!/bin/bash
# node-not-ready-sop.sh

AFFECTED_NODES=$(kubectl get nodes -o jsonpath='{range .items[?(@.status.conditions[?(@.type=="Ready")].status!="True")]}{.metadata.name}{"\n"}{end}')

echo "Affected nodes:"
echo "$AFFECTED_NODES"

for node in $AFFECTED_NODES; do
    echo "===== Processing $node ====="
    
    # Step 1: 获取 Node Conditions
    echo ">>> Conditions:"
    kubectl describe node $node | grep -A 10 "Conditions:"
    
    # Step 2: 确认是否需要排水
    echo ">>> Pods on node:"
    kubectl get pods --all-namespaces --field-selector spec.nodeName=$node --no-headers | wc -l
    
    # Step 3: 如果是磁盘满，SSH 清理
    # 如果是 kubelet 挂了，SSH 重启
    # 如果是硬件故障，Cordon + Drain
    
    # Step 4: Cordon 故障节点（防止新 Pod 调度上来）
    kubectl cordon $node
    
    # Step 5: 尝试修复
    echo ">>> Attempting fix on $node..."
    ssh $node "df -h && systemctl status kubelet && systemctl status containerd"
done

# Step 6: 如果无法修复，Drain 节点
for node in $AFFECTED_NODES; do
    echo ">>> Draining $node..."
    kubectl drain $node --ignore-daemonsets --delete-emptydir-data --force --timeout=300s
done
```

### 8.2 Node Drain 与恢复

```bash
# 安全 Drain 节点
kubectl drain worker-node-02 \
  --ignore-daemonsets \     # 忽略 DaemonSet Pod
  --delete-emptydir-data \  # 删除 emptyDir 数据
  --force \                 # 强制驱逐
  --timeout=300s            # 超时 5 分钟

# Drain 失败的常见原因：
# 1. PodDisruptionBudget 阻止驱逐
# 2. Pod 有 local storage 且非 emptyDir
# 3. Pod 是 DaemonSet 但没加 --ignore-daemonsets

# 查看阻止 Drain 的 Pod
kubectl get pods --all-namespaces --field-selector spec.nodeName=worker-node-02 \
  -o jsonpath='{range .items[]}{.metadata.namespace}/{.metadata.name}{"\t"}{.metadata.ownerReferences[0].kind}{"\n"}{end}'

# 如果有 PodDisruptionBudget 限制
kubectl get pdb --all-namespaces
# 确保 minAvailable 的 Pod 数量满足要求

# 修复后恢复节点
kubectl uncordon worker-node-02
# 节点恢复 Ready 后，Pod 会自动调度上来
```

## 九、预防体系建设

### 9.1 节点监控告警

```yaml
# Prometheus 告警规则
groups:
  - name: k8s-node
    rules:
      - alert: NodeNotReady
        expr: kube_node_status_condition{condition="Ready",status!="true"} == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Node {{ $labels.node }} is Not Ready"
          
      - alert: NodeDiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} 
          / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Node {{ $labels.instance }} disk usage > 85%"
          
      - alert: NodeMemoryPressure
        expr: |
          (node_memory_MemAvailable_bytes 
          / node_memory_MemTotal_bytes) * 100 < 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Node {{ $labels.instance }} memory available < 10%"
          
      - alert: NodePodEviction
        expr: rate(kube_node_status_condition{condition="MemoryPressure",status="true"}[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Pods being evicted on {{ $labels.node }}"
```

### 9.2 定期巡检脚本

```bash
#!/bin/bash
# k8s-node-inspection.sh — K8s 节点定期巡检

echo "===== K8s Node Inspection $(date) ====="

# 1. 节点状态概览
kubectl get nodes -o wide

# 2. 检查 NotReady 节点
NOT_READY=$(kubectl get nodes -o jsonpath='{range .items[?(@.status.conditions[?(@.type=="Ready")].status!="True")]}{.metadata.name}{" "}{end}')
if [ -n "$NOT_READY" ]; then
    echo "[ALERT] Not Ready nodes: $NOT_READY"
    for node in $NOT_READY; do
        echo "--- $node ---"
        kubectl describe node $node | grep -A 10 "Conditions:"
    done
fi

# 3. 检查磁盘使用
for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}'); do
    # 通过 kubectl exec 在节点上检查（需要 debug 容器）
    echo "Node $node disk usage:"
    kubectl debug node/$node -it --image=busybox -- chown 65534:65534 /bin/sh -c "df -h /" 2>/dev/null || true
done

# 4. 检查 Evicted Pod
EVICTED=$(kubectl get pods --all-namespaces --field-selector status.phase=Failed 2>/dev/null | grep Evicted | wc -l)
if [ "$EVICTED" -gt 0 ]; then
    echo "[WARN] Evicted pods: $EVICTED"
    kubectl get pods --all-namespaces --field-selector status.phase=Failed | grep Evicted | head -10
fi

# 5. 检查 CrashLoopBackOff Pod
CRASHING=$(kubectl get pods --all-namespaces --field-selector status.phase=Running 2>/dev/null | grep CrashLoopBackOff | wc -l)
if [ "$CRASHING" -gt 0 ]; then
    echo "[WARN] CrashLoopBackOff pods: $CRASHING"
    kubectl get pods --all-namespaces | grep CrashLoopBackOff
fi

# 6. 检查节点资源分配率
echo ""
echo ">>> Resource allocation:"
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### 9.3 容器日志管理

```yaml
# 推荐的容器日志配置（containerd）
# /etc/containerd/config.toml

[plugins."io.containerd.grpc.v1.cri"]
  # 容器日志配置
  [plugins."io.containerd.grpc.v1.cri".containerd]
    default_runtime_name = "runc"
    # 日志轮转
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
        SystemdCgroup = true

# Kubelet 配置日志轮转
# /var/lib/kubelet/config.yaml
containerLogMaxSize: 100Mi    # 单个日志文件最大 100MB
containerLogMaxFiles: 5       # 最多保留 5 个日志文件
```

### 9.4 配置系统日志轮转

```bash
# /etc/logrotate.d/k8s-container-logs
/var/log/containers/*.log {
    daily
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 200M
}

/var/log/pods/*/*.log {
    daily
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 200M
}

# systemd journal 大小限制
# /etc/systemd/journald.conf
[Journal]
SystemMaxUse=500M
SystemMaxFileSize=50M
RuntimeMaxUse=100M
```

## 十、面试要点

### Q1: K8s Node 变成 Not Ready，怎么排查？

**参考回答**：

> 1. `kubectl describe node` 看 Conditions，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联
> 2. 如果是 DiskPressure，SSH 到节点 `df -h` 检查磁盘，清理容器日志和镜像
> 3. 如果是 MemoryPressure，检查 Pod 内存使用，可能需要加节点或调小 Pod requests
> 4. 如果是 kubelet 失联，SSH 检查 `systemctl status kubelet`，看日志 `journalctl -u kubelet`
> 5. 常见原因：磁盘满、kubelet 崩溃、证书过期、containerd 挂了

### Q2: K8s 的 Pod Eviction 是什么？和 Pod 删除有什么区别？

**参考回答**：

> Pod Eviction 是 kubelet 主动发起的驱逐，通常因为节点资源不足。与手动 `kubectl delete pod` 不同：
> 1. Eviction 是 kubelet 发起的，针对单个 Pod，会设置 `gracePeriodSeconds`
> 2. Evicted Pod 的状态是 `Failed`，Reason 是 `Evicted`，不会自动重建
> 3. Evicted Pod 需要手动删除（或由控制器清理），Deployment 会在其他节点重建新 Pod
> 4. Eviction 有优先级：BestEffort > Burstable > Guaranteed

### Q3: K8s Pod 一直 Pending，怎么排查？

**参考回答**：

> `kubectl describe pod` 看 Events 中的 FailedScheduling 原因：
> 1. `Insufficient memory/cpu`：资源不足，检查节点可用资源，可能需要加节点或调小 requests
> 2. `didn't match node selector/affinity`：调度约束不匹配，检查 nodeSelector 和 affinity 配置
> 3. `had untolerated taint`：节点有污点但 Pod 没有对应的 toleration
> 4. `node(s) had volume node affinity conflict`：PV 绑定到了特定节点

### Q4: 容器运行时 containerd 挂了怎么恢复？

**参考回答**：

> 1. 先 `systemctl status containerd` 确认状态
> 2. `journalctl -u containerd` 查看日志找根因
> 3. 如果是磁盘满导致的，先清理磁盘再重启
> 4. 如果是配置错误，修正配置后重启
> 5. 如果是镜像存储损坏，可能需要清理 `/var/lib/containers/storage`
> 6. 重启 containerd 后等 30 秒再重启 kubelet
> 7. 注意：重启 containerd 会导致该节点所有容器被杀掉

## 十一、避坑指南

### 坑 1：Drain 节点时忘记 PDB

```bash
# PodDisruptionBudget 可能阻止 Drain
# 先检查 PDB
kubectl get pdb --all-namespaces

# 如果 PDB minAvailable=2 但只有 2 个副本，Drain 会一直等
# 临时缩容 PDB
kubectl scale pdb my-pdb --min-available=1
# 或者直接 drain 时加 --force（会忽略 PDB，可能丢数据！）
kubectl drain node --force --ignore-daemonsets --delete-emptydir-data
```

### 坑 2：清理磁盘时误删 kubelet 数据

```bash
# 危险！不要删 /var/lib/kubelet/pods/ 下的内容
# 这是 Pod 的挂载点，删除会导致数据丢失

# 安全的清理路径：
# ✓ /var/log/containers/ — 容器日志
# ✓ /var/log/pods/ — Pod 日志
# ✓ crictl rmi --prune — 未使用镜像
# ✗ /var/lib/kubelet/pods/ — Pod 挂载点，不能删！
# ✗ /var/lib/containers/storage/ — 直接删可能导致 containerd 损坏，用 crictl 清理
```

### 坑 3：Node 频繁 NotReady 的隐藏原因

```bash
# 如果一个节点修复后频繁出问题，可能是：
# 1. 硬件问题 — 跑硬件检测
smartctl -a /dev/sda | grep -i "health\|error"
memtester 1G 1

# 2. 内核 panic — 检查 dmesg
dmesg | grep -i "panic\|oom\|error"

# 3. 网络问题 — 节点与 API Server 之间网络不稳定
# 检查到 API Server 的连通性
while true; do
    curl -k --connect-timeout 2 https://api-server:6443/healthz && echo "OK" || echo "FAIL"
    sleep 1
done
```

### 坑 4：容器日志没有限制大小

```bash
# 如果容器日志没有限制，一个 Pod 可以写满整个磁盘
# 必须配置日志轮转

# 检查当前配置
cat /var/lib/kubelet/config.yaml | grep -i log

# containerLogMaxSize: 100Mi
# containerLogMaxFiles: 5

# 如果没配置，K8s 不会限制日志大小！
# 必须在 kubelet 配置中添加
```

### 坑 5：cordon 后忘记 uncordon

```bash
# 修复节点后忘记 uncordon，导致节点永远不调度新 Pod
# 定期检查 cordon 的节点
kubectl get nodes -o jsonpath='{range .items[?(@.spec.unschedulable==true)]}{.metadata.name}{" (cordoned)\n"}{end}'

# 如果确认已修复，uncordon
kubectl uncordon worker-node-02
```

## 总结

K8s Node Not Ready 排查的核心流程：**kubectl describe node → 看 Conditions → SSH 排查资源（磁盘/内存/PID） → 检查 kubelet 和 containerd → 修复 → uncordon**。

三个核心经验：
1. **磁盘满是 Node Not Ready 的最常见原因**——配置容器日志轮转、定期清理未使用镜像，可以预防 80% 的磁盘类故障
2. **Evicted Pod 不会自动清理**——需要定期巡检和清理，否则会占用 etcd 存储
3. **Drain 前先检查 PDB**——防止 Drain 卡住或导致服务不可用
