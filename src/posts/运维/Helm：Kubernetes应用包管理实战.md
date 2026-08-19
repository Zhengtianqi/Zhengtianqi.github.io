---
title: Helm：Kubernetes应用包管理实战
date: 2026-08-30
category: 运维
tag: ["Helm", "Kubernetes", "包管理", "云原生"]
---

# Helm：Kubernetes应用包管理实战

> Helm是Kubernetes的包管理器，类似于Linux的yum/apt，可以简化应用的安装、升级和管理。
> 本文系统介绍Helm的核心概念、Chart开发和实战应用，帮助你掌握K8s应用管理的最佳实践。

## 一、Helm概述

### 1.1 核心概念

| 概念 | 说明 |
|------|------|
| Chart | 应用包，包含所有K8s资源定义 |
| Repository | Chart仓库 |
| Release | Chart的运行实例 |
| Values | 配置参数 |

### 1.2 Helm架构

```
Helm架构：

┌─────────────────────────────────────────────────────────────┐
│                    Helm Client                               │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  命令行工具  │  │  Chart仓库  │                           │
│  └─────────────┘  └─────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    Tiller (Helm 2)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Chart解析   │  │  模板渲染   │  │  K8s API调用        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Kubernetes                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Deployments │  │  Services   │  │  ConfigMaps         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 二、Helm安装与配置

### 2.1 安装Helm

```bash
# Linux/Mac
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Windows
choco install kubernetes-helm

# 验证安装
helm version
```

### 2.2 配置仓库

```bash
# 添加常用仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# 更新仓库
helm repo update

# 搜索Chart
helm search repo nginx
```

## 三、Chart结构

### 3.1 Chart目录结构

```
mychart/
├── Chart.yaml          # Chart元数据
├── values.yaml         # 默认配置值
├── charts/             # 依赖的子Chart
├── templates/          # 模板文件
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl    # 模板助手函数
│   └── NOTES.txt       # 安装说明
└── README.md           # 说明文档
```

### 3.2 Chart.yaml

```yaml
apiVersion: v2
name: mychart
description: A Helm chart for Kubernetes
type: application
version: 0.1.0
appVersion: "1.0.0"
maintainers:
  - name: Your Name
    email: your@email.com
dependencies:
  - name: redis
    version: "17.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

### 3.3 values.yaml

```yaml
# 默认配置
replicaCount: 3

image:
  repository: nginx
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 500m
    memory: 128Mi
  requests:
    cpu: 250m
    memory: 64Mi

redis:
  enabled: false
```

## 四、模板语法

### 4.1 基础语法

```yaml
# 变量引用
{{ .Values.replicaCount }}

# 对象访问
{{ .Values.image.repository }}

# 条件判断
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
{{- end }}

# 循环
{{- range .Values.ingress.hosts }}
- host: {{ .host }}
{{- end }}

# 模板定义
{{- define "mychart.fullname" -}}
{{- .Release.Name }}-{{ .Chart.Name }}
{{- end }}

# 使用模板
{{ include "mychart.fullname" . }}
```

### 4.2 常用函数

```yaml
# 默认值
{{ .Values.name | default "myapp" }}

# 引用
{{ include "mychart.fullname" . | trunc 63 | trimSuffix "-" }}

# 列表
{{ list "a" "b" "c" | join "," }}

# 字典
{{ dict "key1" "value1" "key2" "value2" | toYaml }}

# 编码
{{ .Values.password | b64enc }}

# 解码
{{ .Values.secret | b64dec }}
```

## 五、Chart开发

### 5.1 创建Chart

```bash
# 创建新Chart
helm create mychart

# 目录结构
mychart/
├── Chart.yaml
├── values.yaml
├── charts/
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── _helpers.tpl
│   └── NOTES.txt
└── .helmignore
```

### 5.2 自定义模板

```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "mychart.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "mychart.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        {{- if .Values.resources }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        {{- end }}
```

## 六、实战操作

### 6.1 Chart生命周期

```bash
# 安装
helm install myrelease ./mychart
helm install myrelease ./mychart -f custom-values.yaml
helm install myrelease ./mychart --set replicaCount=5

# 升级
helm upgrade myrelease ./mychart
helm upgrade myrelease ./mychart -f new-values.yaml

# 回滚
helm rollback myrelease 1

# 卸载
helm uninstall myrelease

# 查看状态
helm list
helm status myrelease
helm history myrelease
```

### 6.2 模板调试

```bash
# 渲染模板
helm template myrelease ./mychart

# 检查配置
helm lint ./mychart

# 调试安装
helm install myrelease ./mychart --dry-run --debug
```

## 七、实战案例

### 7.1 部署Spring Boot应用

```yaml
# Chart.yaml
apiVersion: v2
name: spring-boot-app
description: A Helm chart for Spring Boot application
version: 0.1.0
appVersion: "1.0.0"

# values.yaml
replicaCount: 3

image:
  repository: myregistry/spring-boot-app
  tag: "latest"

service:
  type: ClusterIP
  port: 8080

ingress:
  enabled: true
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix

env:
  SPRING_PROFILES_ACTIVE: production
  DB_HOST: mysql-service
  REDIS_HOST: redis-service

resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 500m
    memory: 256Mi
```

### 7.2 部署监控栈

```bash
# 部署Prometheus + Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123
```

## 八、最佳实践

### 8.1 Chart设计原则

| 原则 | 说明 |
|------|------|
| 可配置 | 通过values.yaml提供配置 |
| 可升级 | 支持无缝升级 |
| 可回滚 | 支持快速回滚 |
| 可测试 | 提供测试模板 |

### 8.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 模板渲染错误 | 语法错误 | 使用helm template调试 |
| 资源冲突 | 名称重复 | 使用include生成唯一名称 |
| 依赖问题 | 子Chart未安装 | 使用helm dependency update |

