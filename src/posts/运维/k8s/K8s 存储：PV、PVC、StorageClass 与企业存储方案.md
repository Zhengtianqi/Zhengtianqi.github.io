---
title: K8s 存储：PV、PVC、StorageClass 与企业存储方案
tag: ["Kubernetes", "K8s", "存储", "DevOps", "云原生"]
category: 运维
date: 2026-06-27
---

# K8s 存储：PV、PVC、StorageClass 与企业存储方案

> 在 K8s 上跑无状态应用很简单，但一旦涉及数据库、消息队列等有状态应用，存储就是绕不开的话题。本文从 PV/PVC 基础概念讲起，一路到动态供给、CSI 插件、企业级存储方案，帮你彻底搞懂 K8s 存储。

## 一、K8s 存储体系全景

### 1.1 为什么需要存储抽象

容器的文件系统是临时的——容器重启后数据就没了。早期 Docker 用 Volume 挂载宿主机目录，但这在 K8s 中行不通：

- Pod 可能被调度到任何节点
- 节点故障后 Pod 迁移，数据留在了旧节点上
- 不同应用对存储性能要求不同（SSD vs HDD）

所以 K8s 设计了一套**存储抽象体系**：

```
开发者视角：PVC（我要 100GB SSD 存储）
管理员视角：PV（我有 1TB NFS 存储）
供给方式：StorageClass（自动创建 PV）
底层实现：CSI 插件（对接 Ceph、阿里云云盘、AWS EBS 等）
```

### 1.2 核心概念层级

```
Pod  ──挂载──>  PVC  ──绑定──>  PV  ──对应──>  真实存储(NFS/Ceph/云盘)
                                    ↑
                        StorageClass ──动态创建──┘
```

| 概念 | 角色 | 说明 |
|------|------|------|
| **Volume** | Pod 内 | 最基础的存储卷，随 Pod 生命周期 |
| **PV** | 集群级 | 持久化存储，独立于 Pod 存在 |
| **PVC** | 命名空间级 | 用户对存储的"申请单" |
| **StorageClass** | 集群级 | 存储的"菜单"，按需自动创建 PV |
| **CSI** | 系统级 | 第三方存储插件标准接口 |

## 二、Volume：Pod 级别存储

### 2.1 常见 Volume 类型

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volume-demo
spec:
  containers:
    - name: app
      image: nginx
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
        - name: cache-vol
          mountPath: /tmp/cache
        - name: data-vol
          mountPath: /data
  volumes:
    # 1. emptyDir：临时目录，Pod 删除即消失
    - name: cache-vol
      emptyDir:
        sizeLimit: 1Gi
    
    # 2. ConfigMap：配置文件挂载
    - name: config-vol
      configMap:
        name: app-config
    
    # 3. hostPath：挂载宿主机目录（危险！生产慎用）
    - name: data-vol
      hostPath:
        path: /data/app
        type: DirectoryOrCreate
```

**emptyDir 的特殊用法——内存盘：**

```yaml
volumes:
  - name: tmp-vol
    emptyDir:
      medium: Memory      # 使用 tmpfs（内存），极快但重启即失
      sizeLimit: 512Mi
```

适合做临时计算空间，比如图片处理中间文件。

**避坑：hostPath 的三大风险**

1. Pod 迁移到其他节点后数据不在
2. 挂载宿主机敏感目录可能造成安全问题
3. 多个 Pod 写同一个 hostPath 目录会有并发问题

生产环境**几乎不用** hostPath，除了节点级 Agent（如日志采集、监控）。

## 三、PV 和 PVC：持久化存储

### 3.1 静态供给（手动创建 PV）

管理员手动创建 PV：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-001
spec:
  capacity:
    storage: 100Gi
  accessModes:
    - ReadWriteMany        # 多节点读写
  persistentVolumeReclaimPolicy: Retain    # PVC 删除后 PV 数据保留
  nfs:
    server: 192.168.1.100
    path: /data/nfs/share1
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-app-data
  namespace: production
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 50Gi       # 申请 50GB，会绑定到 >= 50GB 的 PV
```

### 3.2 accessModes 详解

| 模式 | 缩写 | 说明 | 典型场景 |
|------|------|------|----------|
| ReadWriteOnce | RWO | 单节点读写 | 数据库、有状态应用 |
| ReadOnlyMany | ROX | 多节点只读 | 配置文件、静态资源 |
| ReadWriteMany | RWX | 多节点读写 | NFS、CephFS 共享存储 |
| ReadWriteOncePod | RWOP | 单 Pod 读写（K8s 1.22+） | 防止同节点多 Pod 写冲突 |

**注意：不是所有存储都支持所有模式。** 比如 AWS EBS 只支持 RWO，要 RWX 必须用 NFS 或 CephFS。

### 3.3 回收策略

```yaml
persistentVolumeReclaimPolicy: Retain    # 保留数据，手动清理
# persistentVolumeReclaimPolicy: Delete  # 删除 PVC 时自动删除 PV 和数据
# persistentVolumeReclaimPolicy: Recycle # 已废弃，清空数据后 PV 可重新绑定
```

**生产环境强烈建议用 `Retain`**。曾经有人误删 PVC，`Delete` 策略下数据瞬间消失，造成灾难。

## 四、StorageClass：动态供给

### 4.1 为什么需要动态供给

静态供给的问题：管理员要手动创建 PV，工作量大且不灵活。动态供给让 K8s **在用户创建 PVC 时自动创建 PV**。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: disk.csi.aliyun.com          # CSI 驱动名称
parameters:
  type: cloud_essd                         # 阿里云 ESSD 云盘
  performanceLevel: PL1                    # 性能等级
reclaimPolicy: Delete                      # PVC 删除时自动回收
volumeBindingMode: WaitForFirstConsumer    # 延迟绑定，等 Pod 调度后再创建 PV
allowVolumeExpansion: true                 # 允许在线扩容
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data
spec:
  storageClassName: fast-ssd
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 200Gi
```

**volumeBindingMode 的选择：**

- `Immediate`：PVC 创建时立即绑定 PV。但如果 Pod 还没调度，PV 可能在错误节点上
- `WaitForFirstConsumer`：等到 Pod 调度后再创建并绑定 PV。**推荐使用**，尤其多可用区集群

### 4.2 常见 CSI 驱动配置

**阿里云云盘：**

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: alicloud-disk-essd
provisioner: disk.csi.aliyun.com
parameters:
  type: cloud_essd
  performanceLevel: PL1
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

**AWS EBS：**

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

**本地 Ceph RBD：**

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-rbd
provisioner: rbd.csi.ceph.com
parameters:
  clusterID: <ceph-cluster-id>
  pool: rbd-pool
  imageFormat: "2"
  imageFeatures: layering
  csi.storage.k8s.io/provisioner-secret-name: ceph-secret
  csi.storage.k8s.io/provisioner-secret-namespace: ceph
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

## 五、有状态应用存储实践

### 5.1 MySQL 主从集群存储

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless
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
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
            - name: config
              mountPath: /etc/mysql/conf.d
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
      volumes:
        - name: config
          configMap:
            name: mysql-config
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        storageClassName: fast-ssd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 500Gi
```

**每个 MySQL Pod 的存储是独立的：**

```
mysql-0 → pvc-data-mysql-0 → pv-aaa → cloud-disk-001 (500GB)
mysql-1 → pvc-data-mysql-1 → pv-bbb → cloud-disk-002 (500GB)
mysql-2 → pvc-data-mysql-2 → pv-ccc → cloud-disk-003 (500GB)
```

即使 `mysql-1` 的 Pod 重建，PVC 还在，新 Pod 会挂载同一个云盘，数据不丢失。

### 5.2 Kafka 集群存储

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-headless
  replicas: 3
  template:
    spec:
      containers:
        - name: kafka
          image: confluentinc/cp-kafka:7.5.0
          env:
            - name: KAFKA_BROKER_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
              # 但 broker.id 需要数字，用 init container 处理
          volumeMounts:
            - name: data
              mountPath: /var/lib/kafka/data
            - name: logs
              mountPath: /var/lib/kafka/logs
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        storageClassName: fast-ssd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Ti
    - metadata:
        name: logs
      spec:
        storageClassName: standard-hdd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
```

### 5.3 Redis Cluster 存储

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis-headless
  replicas: 6                      # 3主3从
  template:
    spec:
      initContainers:
        - name: init
          image: redis:7
          command:
            - /bin/sh
            - -c
            - |
              ORDINAL=$(echo $POD_NAME | rev | cut -d'-' -f1)
              if [ $((ORDINAL % 2)) -eq 0 ]; then
                echo "yes" > /data/node.conf  # 主节点
              else
                echo "no" > /data/node.conf   # 从节点
              fi
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          volumeMounts:
            - name: data
              mountPath: /data
      containers:
        - name: redis
          image: redis:7
          args: ["redis-server", "/data/node.conf"]
          volumeMounts:
            - name: data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        storageClassName: fast-ssd
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 50Gi
```

## 六、存储扩容与迁移

### 6.1 在线扩容 PVC

```bash
# 编辑 PVC，修改 storage 请求
kubectl patch pvc mysql-data -p '{"spec":{"resources":{"requests":{"storage":"500Gi"}}}}'

# 查看扩容状态
kubectl get pvc mysql-data -w
```

前提是 StorageClass 的 `allowVolumeExpansion: true`。扩容过程中 Pod 不需要重启，但底层扩容可能需要几分钟。

**注意：存储只能扩容不能缩容。** 规划容量时要留好余量。

### 6.2 跨存储类型迁移

当需要从 NFS 迁移到云盘时：

```bash
# 1. 停止应用（让数据不再写入）
kubectl scale statefulset mysql --replicas=0

# 2. 创建新 PVC（新存储类型）
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-new
spec:
  storageClassName: fast-ssd
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 500Gi
EOF

# 3. 启动一个临时 Pod，同时挂载新旧 PVC，复制数据
kubectl run data-migrator --rm -it --image=busybox \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "migrator",
        "image": "busybox",
        "command": ["sh", "-c", "cp -a /old-data/. /new-data/"],
        "volumeMounts": [
          {"name": "old", "mountPath": "/old-data"},
          {"name": "new", "mountPath": "/new-data"}
        ]
      }],
      "volumes": [
        {"name": "old", "persistentVolumeClaim": {"claimName": "mysql-data"}},
        {"name": "new", "persistentVolumeClaim": {"claimName": "mysql-data-new"}}
      ]
    }
  }'

# 4. 修改 StatefulSet 指向新 PVC，重新启动
```

## 七、企业存储方案对比

### 7.1 常见存储方案

| 方案 | 类型 | RWX | 性能 | 运维复杂度 | 适用场景 |
|------|------|-----|------|-----------|----------|
| **NFS** | 网络 | ✅ | 中 | 低 | 共享文件、测试环境 |
| **Ceph RBD** | 块 | ❌ | 高 | 高 | 数据库、生产环境 |
| **CephFS** | 文件 | ✅ | 中高 | 高 | 共享存储、ML训练 |
| **云盘(EBS/云盘)** | 块 | ❌ | 高 | 低 | 云上数据库 |
| **Longhorn** | 块 | ❌ | 中 | 低 | K8s 原生存储 |
| **OpenEBS** | 块 | ❌ | 中 | 中 | K8s 原生存储 |

### 7.2 NFS 部署示例（适合中小团队）

```yaml
# NFS StorageClass（使用 NFS Subdir External Provisioner）
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-storage
provisioner: nfs.csi.k8s.io
parameters:
  server: 192.168.1.100
  share: /data/nfs
  subDir: ${pvc.metadata.namespace}-${pvc.metadata.name}
reclaimPolicy: Retain
volumeBindingMode: Immediate
```

### 7.3 Longhorn（Rancher 出品，推荐）

Longhorn 是专为 K8s 设计的分布式块存储，部署简单：

```bash
# 安装 Longhorn
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.6.0/deploy/longhorn.yaml

# 使用
kubectl get sc longhorn
```

```yaml
# PVC 直接使用
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
spec:
  storageClassName: longhorn
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 100Gi
```

Longhorn 的优势：
- 安装即用，无需额外存储集群
- 支持快照、备份到 S3
- 支持跨节点副本
- 有 Web UI 管理界面

## 八、避坑指南

### 8.1 PVC 一直 Pending

```bash
kubectl describe pvc <name>

# 常见原因：
# 1. 没有匹配的 PV（静态供给）
# 2. StorageClass 的 provisioner 没装好
# 3. WaitForFirstConsumer 模式下还没有 Pod 消费
# 4. 底层存储配额用完
# 5. 可用区不匹配
```

### 8.2 Pod 挂载 Volume 失败

```bash
kubectl describe pod <name>

# 常见错误：
# "Unable to attach or mount volumes: timed out waiting for the condition"
# 原因：
# 1. NFS 服务器不可达
# 2. CSI 驱动未安装或异常
# 3. 节点上没有 CSI 插件的 Node 组件
# 4. 云盘已经被其他实例占用（EBS 只能挂载到一个实例）
```

### 8.3 数据丢失的常见原因

```
❌ reclaimPolicy: Delete + 误删 PVC → 数据直接没了
❌ statefulset 的 volumeClaimTemplates 改了 name → 旧 PVC 不再关联
❌ 用了 emptyDir 当持久化存储 → Pod 重启数据全丢
❌ NFS 单点故障 → 所有依赖 NFS 的应用挂掉
```

## 九、面试要点总结

### 高频面试题

1. **PV 和 PVC 的关系？**
   - PV 是集群级存储资源，PVC 是用户对存储的请求
   - PVC 通过 storageClassName 和 accessModes 匹配 PV
   - 一个 PV 只能绑定一个 PVC

2. **静态供给和动态供给的区别？**
   - 静态：管理员手动创建 PV，PVC 去匹配
   - 动态：PVC 创建时，StorageClass 自动创建 PV
   - 生产环境用动态供给，效率高

3. **StorageClass 的 volumeBindingMode 有什么区别？**
   - Immediate：PVC 创建即绑定，可能导致 PV 在错误节点
   - WaitForFirstConsumer：等 Pod 调度后再绑定，推荐使用

4. **StatefulSet 的 volumeClaimTemplates 有什么作用？**
   - 为每个 Pod 自动创建独立 PVC
   - PVC 名称格式：{pvc-name}-{pod-name}（如 data-mysql-0）
   - Pod 重建后挂载同一个 PVC，数据不丢失

5. **ReadWriteOnce 和 ReadWriteMany 的区别？**
   - RWO：同一时间只能被一个节点读写（云盘、RBD）
   - RWX：可被多个节点同时读写（NFS、CephFS）
   - 数据库用 RWO，共享文件用 RWX

### 核心知识点速记

```
Volume = Pod 内存储，随 Pod 生命周期
PV = 持久化存储，独立于 Pod
PVC = 存储申请单
StorageClass = 动态供给工厂
CSI = 第三方存储插件标准
RWO = 单节点读写（云盘）
RWX = 多节点读写（NFS/CephFS）
Retain = PVC 删除后 PV 数据保留
WaitForFirstConsumer = 延迟绑定
volumeClaimTemplates = StatefulSet 的存储模板
```

## 总结

K8s 存储体系的核心是**解耦**：开发者只关心"我要多少存储"，不用关心底层用什么存储。通过 PV/PVC/StorageClass 三层抽象，实现了存储供给的自动化。

对于 Java 后端开发者，实际工作中最常做的是：
1. 写 PVC 申请存储
2. 在 StatefulSet 中用 volumeClaimTemplates
3. 遇到存储问题时会看 `kubectl describe pvc` 排查

如果团队不大，推荐用 Longhorn 或 NFS 作为起步方案。上了云就直接用云厂商的 CSI 驱动，省心省力。

下篇我们将深入 K8s Operator，看看如何用 CRD 扩展 Kubernetes 能力。
