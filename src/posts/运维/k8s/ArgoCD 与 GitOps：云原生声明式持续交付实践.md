---
title: ArgoCD 与 GitOps：云原生声明式持续交付实践
tag: ["GitOps", "ArgoCD", "CI/CD", "Kubernetes"]
category: 运维
date: 2026-06-27
---

# ArgoCD 与 GitOps：云原生声明式持续交付实践

Jenkins 管道太重？部署状态不可见？回滚靠手动？GitOps 是 K8s 时代的 CD 标准方案，ArgoCD 是最佳实践工具。

---

## 一、GitOps 核心理念

### 1.1 传统 CD vs GitOps

```
传统 CD：
  CI Pipeline → kubectl apply → Cluster
  问题：谁在什么时候部署了什么？集群状态不可追溯

GitOps：
  CI Pipeline → Git Repo（声明式配置） → ArgoCD → Cluster
  Git 是唯一真相源（Single Source of Truth）
  一切变更通过 PR，可审计、可回滚
```

### 1.2 GitOps 四原则

```
1. 声明式（Declarative）：系统状态用声明式描述（YAML）
2. 版本化（Versioned）：所有状态存在 Git，有完整历史
3. 自动拉取（Pulled）：Agent 自动拉取变更，不是推送
4. 持续协调（Continuously Reconciled）：Agent 持续比对 Git 和集群状态
```

---

## 二、ArgoCD 架构

```
                    Git Repository
                    (K8s YAML / Helm / Kustomize)
                         │
                    argocd-repo-server
                    （拉取 Git，缓存清单）
                         │
                    ┌────▼────┐
                    │ argocd- │
                    │ server  │ ← UI / CLI / API
                    └────┬────┘
                         │
                    argocd-application-controller
                    （持续协调 Git vs Cluster）
                         │
                    ┌────▼────┐
                    │ K8s     │
                    │ Cluster │
                    └─────────┘
```

核心组件：
- **argocd-server**：API Server，提供 UI 和 CLI 接口
- **argocd-repo-server**：拉取 Git 仓库，生成渲染后清单
- **argocd-application-controller**：协调引擎，比对 Git 和集群状态
- **argocd-dex**：SSO 集成（LDAP/OAuth/SAML）

---

## 三、安装与配置

### 3.1 安装 ArgoCD

```bash
# 安装 ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 获取初始密码
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 端口转发访问 UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# 访问 https://localhost:8080

# 安装 ArgoCD CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && mv argocd /usr/local/bin/

# 登录
argocd login localhost:8080 --username admin --password <password>
```

### 3.2 配置 Git 仓库

```bash
# 添加私有仓库凭证
argocd repo add https://github.com/team/k8s-manifests \
  --username git-user \
  --password ghp_xxx

# 查看仓库
argocd repo list
```

---

## 四、Application 部署

### 4.1 创建 Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/team/k8s-manifests
    targetRevision: main
    path: production/order-service  # 仓库中的路径
    # Helm 方式
    # helm:
    #   releaseName: order-service
    #   valueFiles:
    #   - values-prod.yaml
    # Kustomize 方式
    # kustomize:
    #   namePrefix: prod-
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:           # 自动同步
      prune: true        # 删除 Git 中已删除的资源
      selfHeal: true     # 自动修复手动修改（drift 检测）
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
  revisionHistoryLimit: 10  # 保留 10 个历史版本
```

### 4.2 ApplicationSet（多环境部署）

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: microservices
  namespace: argocd
spec:
  generators:
  # Git 目录生成器：每个目录一个 Application
  - git:
      repoURL: https://github.com/team/k8s-manifests
      revision: main
      directories:
      - path: production/*    # production/ 下每个目录一个服务
  template:
    metadata:
      name: '{{path.basename}}'   # 目录名作为 Application 名
    spec:
      project: default
      source:
        repoURL: https://github.com/team/k8s-manifests
        targetRevision: main
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### 4.3 多集群部署

```bash
# 添加目标集群
argocd cluster add prod-cluster --name prod --label environment=production
argocd cluster add staging-cluster --name staging --label environment=staging

# 查看集群
argocd cluster list
```

```yaml
# 多集群 ApplicationSet
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-cluster
spec:
  generators:
  - list:
      elements:
      - cluster: staging
        url: https://staging-cluster:6443
      - cluster: production
        url: https://prod-cluster:6443
  template:
    metadata:
      name: 'order-{{cluster}}'
    spec:
      source:
        repoURL: https://github.com/team/k8s-manifests
        path: '{{cluster}}/order-service'
      destination:
        server: '{{url}}'
        namespace: production
```

---

## 五、同步策略

### 5.1 自动同步 vs 手动同步

```yaml
syncPolicy:
  automated:           # 自动同步：Git 变更自动应用
    prune: true
    selfHeal: true
# vs
syncPolicy: {}         # 手动同步：需要人工触发

# 生产环境建议：手动同步 + PR 审批
# 测试环境建议：自动同步
```

### 5.2 Sync Wave（同步顺序）

```yaml
# 在资源上添加注解控制同步顺序
apiVersion: v1
kind: ConfigMap
metadata:
  name: db-migration
  annotations:
    argocd.argoproj.io/sync-wave: "-1"   # 先执行（负数先执行）
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  annotations:
    argocd.argoproj.io/sync-wave: "0"    # 默认
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    argocd.argoproj.io/sync-wave: "1"    # 最后执行
```

### 5.3 Pre/Post Sync Hooks

```yaml
# PreSync Hook：部署前执行数据库迁移
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    argocd.argoproj.io/hook: PreSync              # PreSync / Sync / PostSync / SyncFail
    argocd.argoproj.io/hook-delete-policy: HookSucceeded  # 成功后删除
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: flyway/flyway:9
        command: ["flyway", "migrate"]
        env:
        - name: FLYWAY_URL
          value: "jdbc:mysql://mysql:3306/orders"
      restartPolicy: OnFailure
```

---

## 六、回滚与恢复

### 6.1 查看历史与回滚

```bash
# 查看同步历史
argocd app history order-service

# 回滚到指定版本
argocd app rollback order-service <revision-id>

# 在 GitOps 中，回滚 = Git Revert
# 推荐方式：Git revert + 自动同步
git revert <bad-commit>
git push origin main
# ArgoCD 自动检测到变更，回滚到之前的状态
```

### 6.2 灾难恢复

```bash
# 导出所有 ArgoCD Application
kubectl get applications -n argocd -o yaml > argocd-backup.yaml

# 恢复
kubectl apply -f argocd-backup.yaml
```

---

## 七、CI/CD 完整流水线

### 7.1 GitHub Actions + ArgoCD

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    # 1. 构建镜像
    - uses: actions/checkout@v4
    - name: Build and Push
      run: |
        docker build -t registry.example.com/order:${{ github.sha }} .
        docker push registry.example.com/order:${{ github.sha }}
    
    # 2. 更新 manifests 仓库
    - name: Update Manifests
      run: |
        git clone https://github.com/team/k8s-manifests
        cd k8s-manifests
        sed -i "s|image:.*|image: registry.example.com/order:${{ github.sha }}|" production/order-service/deployment.yaml
        git config user.name "CI Bot"
        git config user.email "ci@example.com"
        git add .
        git commit -m "deploy: order-service ${{ github.sha }}"
        git push
        # ArgoCD 自动检测到 Git 变更，自动同步到集群
```

### 7.2 ArgoCD Image Updater（自动更新镜像）

```bash
# 安装 ArgoCD Image Updater
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml

# 给 Application 添加注解
kubectl annotate app order-service -n argocd \
  argocd-image-updater.argoproj.io/image-list=order=registry.example.com/order

kubectl annotate app order-service -n argocd \
  argocd-image-updater.argoproj.io/order.update-strategy=latest

# Image Updater 自动检测新镜像，更新 Git 仓库中的镜像版本
```

---

## 八、监控与告警

### 8.1 ArgoCD Metrics

```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd
  namespace: argocd
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-server
  endpoints:
  - port: metrics
    path: /metrics
```

### 8.2 关键告警规则

```yaml
groups:
- name: argocd
  rules:
  - alert: ArgoCDAppOutOfSync
    expr: argocd_app_info{sync_status!="Synced"} == 1
    for: 10m
    annotations:
      summary: "Application {{ $labels.name }} is OutOfSync"
  
  - alert: ArgoCDAppDegraded
    expr: argocd_app_info{health_status!="Healthy"} == 1
    for: 5m
    annotations:
      summary: "Application {{ $labels.name }} is Degraded"
  
  - alert: ArgoCDSyncFailed
    expr: argocd_app_sync_status{sync_status!="Synced"} == 1
    for: 5m
    annotations:
      summary: "Application {{ $labels.name }} sync failed"
```

---

## 九、安全与权限管理

### 9.1 RBAC

```yaml
# ArgoCD Project（项目级隔离）
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production project
  sourceRepos:
  - "https://github.com/team/*"          # 允许的 Git 仓库
  destinations:
  - server: https://kubernetes.default.svc
    namespace: "production"              # 允许部署的命名空间
  clusterResourceWhitelist:
  - group: ""
    kind: Namespace                      # 允许创建的集群级资源
  namespaceResourceBlacklist:
  - group: ""
    kind: ResourceQuota                  # 禁止创建的资源
```

### 9.2 SSO 集成

```yaml
# argocd-cm
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  url: https://argocd.example.com
  dex.config: |
    connectors:
    - type: github
      id: github
      name: GitHub
      config:
        clientID: xxx
        clientSecret: xxx
        orgs:
        - name: team-org
```

---

## 十、面试要点

### Q：GitOps 和传统 CI/CD 有什么区别？

| 维度 | 传统 CI/CD | GitOps |
|------|-----------|--------|
| 部署方式 | Push（CI 推送到集群） | Pull（Agent 拉取 Git） |
| 状态管理 | 集群实际状态难追踪 | Git 是唯一真相源 |
| 审计 | 需要额外审计日志 | Git commit 天然审计 |
| 回滚 | 手动操作 | Git revert 即回滚 |
| 集群权限 | CI 需要 kubectl 权限 | Agent 在集群内，无需外部凭证 |

### Q：ArgoCD 的 selfHeal 是什么？

selfHeal 开启后，如果有人手动修改了集群中的资源（kubectl edit），ArgoCD 会自动将其恢复到 Git 中声明的状态。这保证了集群状态始终与 Git 一致，防止手动修改导致漂移。生产环境建议开启。

### Q：ArgoCD 和 Flux 怎么选？

- ArgoCD：UI 友好，多集群支持好，社区更大
- Flux：更轻量，CNCF 毕业项目，与 GitLab 集成好
- 中大型团队选 ArgoCD（UI + RBAC + 多项目），小团队选 Flux（轻量）

---

## 十一、总结

GitOps 三大价值：

1. **可审计**：所有变更通过 Git PR，谁在什么时候改了什么一目了然
2. **可回滚**：Git revert = 回滚，不需要额外工具
3. **自愈**：selfHeal + 自动同步，集群状态始终与 Git 一致

记住：**Git 是唯一真相源，ArgoCD 是执行者，PR 是变更流程**。
