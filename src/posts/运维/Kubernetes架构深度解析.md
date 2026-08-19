---
title: Kubernetes架构深度解析
date: 2026-08-29
category: 运维
tag: ["Kubernetes", "K8s", "容器编排", "云原生"]
---

# Kubernetes架构深度解析

> Kubernetes是云原生时代的容器编排标准，理解其架构设计是部署和管理微服务的基础。
> 本文深入剖析Kubernetes的核心架构、组件功能和工作原理，帮助你掌握容器编排的精髓。

## 一、Kubernetes概述

### 1.1 核心能力

| 能力 | 说明 |
|------|------|
| 自动装箱 | 自动调度Pod到节点 |
| 自我修复 | 自动重启失败容器 |
| 水平扩展 | 根据负载自动扩缩容 |
| 服务发现 | 自动注册和发现服务 |
| 滚动更新 | 零停机部署 |
| 存储编排 | 自动挂载存储系统 |

### 1.2 架构概览

```
Kubernetes架构：

┌─────────────────────────────────────────────────────────────┐
│                    Master节点                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Server │  │  Scheduler  │  │  Controller Manager │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐                                           │
│  │  etcd       │                                           │
│  └─────────────┘                                           │
├─────────────────────────────────────────────────────────────┤
│                    Worker节点                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  kubelet    │  │  kube-proxy │  │  Container Runtime  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 二、核心组件详解

### 2.1 Master组件

| 组件 | 作用 |
|------|------|
| API Server | 集群入口，处理所有请求 |
| Scheduler | 调度Pod到节点 |
| Controller Manager | 控制器管理，维护集群状态 |
| etcd | 分布式KV存储，保存集群状态 |

### 2.2 Node组件

| 组件 | 作用 |
|------|------|
| kubelet | 节点代理，管理Pod生命周期 |
| kube-proxy | 网络代理，实现Service负载均衡 |
| Container Runtime | 容器运行时，如Docker、containerd |

## 三、核心概念

### 3.1 Pod

```yaml
# Pod定义
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: my-app
spec:
  containers:
  - name: my-container
    image: nginx:latest
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### 3.2 Deployment

```yaml
# Deployment定义
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-container
        image: nginx:latest
        ports:
        - containerPort: 80
```

### 3.3 Service

```yaml
# Service定义
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP  # ClusterIP, NodePort, LoadBalancer
```

## 四、工作原理

### 4.1 Pod创建流程

```
Pod创建流程：

1. 用户提交Pod定义
   └─ kubectl create -f pod.yaml

2. API Server处理请求
   └─ 验证请求，存储到etcd

3. Scheduler调度
   └─ 选择合适的节点

4. kubelet执行
   └─ 创建容器，启动Pod

5. kube-proxy配置网络
   └─ 配置iptables规则
```

### 4.2 控制器原理

```java
// 控制器循环
while (true) {
    // 1. 观察当前状态
    currentState = observeCurrentState();
    
    // 2. 比较期望状态和当前状态
    desiredState = getDesiredState();
    
    // 3. 执行调谐动作
    if (currentState != desiredState) {
        reconcile(currentState, desiredState);
    }
    
    // 等待下一次循环
    wait();
}
```

## 五、实战操作

### 5.1 常用命令

```bash
# 集群信息
kubectl cluster-info
kubectl get nodes

# Pod操作
kubectl get pods
kubectl describe pod my-pod
kubectl logs my-pod
kubectl exec -it my-pod -- /bin/bash

# Deployment操作
kubectl get deployments
kubectl scale deployment my-deployment --replicas=5
kubectl rollout status deployment my-deployment

# Service操作
kubectl get services
kubectl expose deployment my-deployment --port=80 --type=LoadBalancer
```

### 5.2 资源管理

```bash
# 查看资源使用
kubectl top nodes
kubectl top pods

# 资源配额
kubectl describe resourcequota

# 命名空间
kubectl create namespace production
kubectl get pods -n production
```

## 六、最佳实践

### 6.1 Pod设计原则

| 原则 | 说明 |
|------|------|
| 单一职责 | 每个Pod只运行一个容器 |
| 无状态 | Pod不保存状态 |
| 可组合 | 小容器组合成大应用 |
| 可观测 | 配置健康检查和日志 |

### 6.2 部署策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| Recreate | 先删除旧Pod，再创建新Pod | 不允许版本共存 |
| RollingUpdate | 逐个替换Pod | 零停机部署 |
