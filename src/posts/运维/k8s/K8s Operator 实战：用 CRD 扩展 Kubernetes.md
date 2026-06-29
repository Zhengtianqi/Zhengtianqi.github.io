---
title: K8s Operator 实战：用 CRD 扩展 Kubernetes
tag: ["Kubernetes", "K8s", "Operator", "CRD", "云原生"]
category: 运维
date: 2026-06-27
---

# K8s Operator 实战：用 CRD 扩展 Kubernetes

> Kubernetes是容器编排领域的标准，它为容器化应用提供了自动化部署、扩缩容和管理能力。
> 本文介绍了Kubernetes的核心概念和实践经验，帮助你构建云原生应用。

假设你要在 K8s 上管理一个 MySQL 主从集群，传统做法需要：

1. 写一堆 YAML 部署 StatefulSet
2. 手动初始化主从复制
3. 手动创建用户、数据库
4. 节点故障时手动修复
5. 备份需要手动配 CronJob

每次操作都要人工介入，这不"云原生"。

**Operator 的思路：把运维专家的知识写成代码。**

你定义一个 `MySQLCluster` 资源，告诉 K8s"我要一个 3 节点的 MySQL 集群"，Operator 控制器自动完成所有工作：

```yaml
apiVersion: database.example.com/v1
kind: MySQLCluster
metadata:
  name: my-db
spec:
  replicas: 3
  version: "8.0"
  storage: 500Gi
  backup:
    enabled: true
    schedule: "0 2 * * *"
```

### 1.2 Operator = CRD + Controller

```
CRD（Custom Resource Definition）：定义新的资源类型
     ↓
CR（Custom Resource）：具体实例（如 MySQLCluster my-db）
     ↓
Controller：监听 CR 变化，执行运维逻辑
```

**核心循环（Reconcile Loop）：**

```
观察当前状态 → 对比期望状态 → 执行操作使两者一致
```

这不是新概念，就是控制论的负反馈。K8s 本身所有控制器都是这个模式。

### 1.3 业界知名 Operator

| Operator | 功能 |
|----------|------|
| **Prometheus Operator** | 管理 Prometheus 实例、告警规则 |
| **Cert Manager** | 自动签发和续期 TLS 证书 |
| **ArgoCD Operator** | 管理 GitOps 部署 |
| **Strimzi** | 管理 Kafka 集群 |
| **Operator Hub** | 社区 Operator 市场 |

## 二、CRD 定义详解

### 2.1 最简 CRD

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: mysqlclusters.database.example.com
spec:
  group: database.example.com          # API 组名
  names:
    kind: MySQLCluster                 # 资源类型名
    listKind: MySQLClusterList
    singular: mysqlcluster
    plural: mysqlclusters
    shortNames: ["mc"]                 # kubectl get mc
  scope: Namespaced                    # 命名空间级（或 Cluster）
  versions:
    - name: v1
      served: true                     # 是否提供此版本 API
      storage: true                    # 是否为存储版本（只能一个）
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas:
                  type: integer
                  minimum: 1
                  maximum: 9
                  default: 3
                version:
                  type: string
                  pattern: "^8\\.[0-9]+\\.[0-9]+$"
                storage:
                  type: string
                  default: "100Gi"
                config:
                  type: object
                  properties:
                    innodbBufferPoolSize:
                      type: string
                    maxConnections:
                      type: integer
                backup:
                  type: object
                  properties:
                    enabled:
                      type: boolean
                      default: false
                    schedule:
                      type: string
                    retention:
                      type: string
                      default: "7d"
            status:
              type: object
              properties:
                phase:
                  type: string
                  enum: ["Creating", "Running", "Scaling", "Failed"]
                readyReplicas:
                  type: integer
                conditions:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                      status:
                        type: string
                      message:
                        type: string
```

### 2.2 使用 CRD

创建 CRD 后，就可以像原生资源一样操作：

```bash
# 创建 CRD
kubectl apply -f mysqlcluster-crd.yaml

# 创建 MySQLCluster 实例
kubectl apply -f - <<EOF
apiVersion: database.example.com/v1
kind: MySQLCluster
metadata:
  name: my-db
  namespace: production
spec:
  replicas: 3
  version: "8.0.35"
  storage: "500Gi"
  config:
    innodbBufferPoolSize: "2G"
    maxConnections: 1000
  backup:
    enabled: true
    schedule: "0 2 * * *"
EOF

# 查看实例
kubectl get mysqlclusters -n production
kubectl get mc -n production        # 使用短名

# 查看详情
kubectl describe mysqlcluster my-db -n production

# 修改配置
kubectl patch mysqlcluster my-db --type merge -p '{"spec":{"replicas":5}}'
```

### 2.3 CRD 的高级特性

**AdditionalPrinterColumns：自定义 kubectl 输出列**

```yaml
versions:
  - name: v1
    additionalPrinterColumns:
      - name: Replicas
        type: integer
        jsonPath: .spec.replicas
      - name: Ready
        type: integer
        jsonPath: .status.readyReplicas
      - name: Phase
        type: string
        jsonPath: .status.phase
      - name: Age
        type: date
        jsonPath: .metadata.creationTimestamp
```

效果：

```
NAME      REPLICAS   READY   PHASE     AGE
my-db     3          3       Running   5m
```

**Subresources：status 和 scale 子资源**

```yaml
versions:
  - name: v1
    subresources:
      status: {}              # 启用 status 子资源
      scale:
        specReplicasPath: .spec.replicas
        statusReplicasPath: .status.readyReplicas
```

启用 scale 后可以直接用 `kubectl scale`：

```bash
kubectl scale mysqlcluster my-db --replicas=5
```

## 三、Controller 开发实战

### 3.1 用 Go 开发 Controller（主流方式）

使用 [Kubebuilder](https://book.kubebuilder.io/) 脚手架：

```bash
# 安装 Kubebuilder
curl -L -o kubebuilder https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/

# 创建项目
mkdir mysql-operator && cd mysql-operator
kubebuilder init --domain example.com --repo example.com/mysql-operator

# 创建 API
kubebuilder create api --group database --version v1 --kind MySQLCluster
```

### 3.2 定义 CRD Go 类型

```go
// api/v1/mysqlcluster_types.go

package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// MySQLClusterSpec 定义期望状态
type MySQLClusterSpec struct {
    Replicas int32         `json:"replicas,omitempty"`
    Version  string        `json:"version,omitempty"`
    Storage  string        `json:"storage,omitempty"`
    Config   MySQLConfig   `json:"config,omitempty"`
    Backup   BackupConfig  `json:"backup,omitempty"`
}

type MySQLConfig struct {
    InnodbBufferPoolSize string `json:"innodbBufferPoolSize,omitempty"`
    MaxConnections       int    `json:"maxConnections,omitempty"`
}

type BackupConfig struct {
    Enabled   bool   `json:"enabled,omitempty"`
    Schedule  string `json:"schedule,omitempty"`
    Retention string `json:"retention,omitempty"`
}

// MySQLClusterStatus 定义观察到的状态
type MySQLClusterStatus struct {
    Phase         string             `json:"phase,omitempty"`
    ReadyReplicas int32              `json:"readyReplicas,omitempty"`
    Conditions    []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:subresource:scale:specpath=.spec.replicas,statuspath=.status.readyReplicas
type MySQLCluster struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   MySQLClusterSpec   `json:"spec,omitempty"`
    Status MySQLClusterStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type MySQLClusterList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []MySQLCluster `json:"items"`
}

func init() {
    SchemeBuilder.Register(&MySQLCluster{}, &MySQLClusterList{})
}
```

### 3.3 Reconcile 控制器核心逻辑

```go
// internal/controller/mysqlcluster_controller.go

package controller

import (
    "context"
    "fmt"
    "time"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/api/errors"
    "k8s.io/apimachinery/pkg/api/resource"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/types"
    "k8s.io/apimachinery/pkg/util/intstr"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

    databasev1 "example.com/mysql-operator/api/v1"
)

type MySQLClusterReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=database.example.com,resources=mysqlclusters,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=database.example.com,resources=mysqlclusters/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete

func (r *MySQLClusterReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := ctrl.LoggerFrom(ctx)

    // 1. 获取 MySQLCluster 实例
    var mysqlCluster databasev1.MySQLCluster
    if err := r.Get(ctx, req.NamespacedName, &mysqlCluster); err != nil {
        if errors.IsNotFound(err) {
            return ctrl.Result{}, nil  // 已被删除，无需处理
        }
        return ctrl.Result{}, err
    }

    // 2. 确保 Headless Service 存在
    if err := r.ensureHeadlessService(ctx, &mysqlCluster); err != nil {
        log.Error(err, "Failed to ensure Headless Service")
        return ctrl.Result{RequeueAfter: 30 * time.Second}, err
    }

    // 3. 确保 Secret 存在（MySQL root 密码）
    if err := r.ensureSecret(ctx, &mysqlCluster); err != nil {
        log.Error(err, "Failed to ensure Secret")
        return ctrl.Result{RequeueAfter: 30 * time.Second}, err
    }

    // 4. 确保 StatefulSet 存在
    if err := r.ensureStatefulSet(ctx, &mysqlCluster); err != nil {
        log.Error(err, "Failed to ensure StatefulSet")
        return ctrl.Result{RequeueAfter: 30 * time.Second}, err
    }

    // 5. 更新 Status
    if err := r.updateStatus(ctx, &mysqlCluster); err != nil {
        log.Error(err, "Failed to update status")
        return ctrl.Result{}, err
    }

    // 6. 如果启用了备份，确保 CronJob 存在
    if mysqlCluster.Spec.Backup.Enabled {
        if err := r.ensureBackupCronJob(ctx, &mysqlCluster); err != nil {
            log.Error(err, "Failed to ensure backup CronJob")
        }
    }

    return ctrl.Result{RequeueAfter: 60 * time.Second}, nil  // 定期 reconcile
}

func (r *MySQLClusterReconciler) ensureStatefulSet(ctx context.Context, mc *databasev1.MySQLCluster) error {
    var sts appsv1.StatefulSet
    name := types.NamespacedName{Name: mc.Name, Namespace: mc.Namespace}

    desiredSts := r.buildStatefulSet(mc)

    if err := r.Get(ctx, name, &sts); err != nil {
        if errors.IsNotFound(err) {
            controllerutil.SetControllerReference(mc, desiredSts, r.Scheme)
            return r.Create(ctx, desiredSts)
        }
        return err
    }

    // 更新已有的 StatefulSet
    sts.Spec.Replicas = &mc.Spec.Replicas
    sts.Spec.Template.Spec.Containers[0].Image = fmt.Sprintf("mysql:%s", mc.Spec.Version)
    return r.Update(ctx, &sts)
}

func (r *MySQLClusterReconciler) buildStatefulSet(mc *databasev1.MySQLCluster) *appsv1.StatefulSet {
    replicas := mc.Spec.Replicas
    return &appsv1.StatefulSet{
        ObjectMeta: metav1.ObjectMeta{
            Name:      mc.Name,
            Namespace: mc.Namespace,
        },
        Spec: appsv1.StatefulSetSpec{
            ServiceName: mc.Name + "-headless",
            Replicas:    &replicas,
            Selector: &metav1.LabelSelector{
                MatchLabels: map[string]string{"app": mc.Name},
            },
            Template: corev1.PodTemplateSpec{
                ObjectMeta: metav1.ObjectMeta{
                    Labels: map[string]string{"app": mc.Name},
                },
                Spec: corev1.PodSpec{
                    Containers: []corev1.Container{{
                        Name:  "mysql",
                        Image: fmt.Sprintf("mysql:%s", mc.Spec.Version),
                        Env: []corev1.EnvVar{
                            {Name: "MYSQL_ROOT_PASSWORD", ValueFrom: &corev1.EnvVarSource{
                                SecretKeyRef: &corev1.SecretKeySelector{
                                    LocalObjectReference: corev1.LocalObjectReference{Name: mc.Name + "-secret"},
                                    Key:                  "root-password",
                                },
                            }},
                        },
                        Ports: []corev1.ContainerPort{
                            {ContainerPort: 3306, Name: "mysql"},
                        },
                        VolumeMounts: []corev1.VolumeMount{
                            {Name: "data", MountPath: "/var/lib/mysql"},
                        },
                        Resources: corev1.ResourceRequirements{
                            Requests: corev1.ResourceList{
                                corev1.ResourceCPU:    resource.MustParse("500m"),
                                corev1.ResourceMemory: resource.MustParse("1Gi"),
                            },
                            Limits: corev1.ResourceList{
                                corev1.ResourceCPU:    resource.MustParse("2000m"),
                                corev1.ResourceMemory: resource.MustParse("4Gi"),
                            },
                        },
                    }},
                },
            },
            VolumeClaimTemplates: []corev1.PersistentVolumeClaim{
                {
                    ObjectMeta: metav1.ObjectMeta{Name: "data"},
                    Spec: corev1.PersistentVolumeClaimSpec{
                        AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
                        Resources: corev1.ResourceRequirements{
                            Requests: corev1.ResourceList{
                                corev1.ResourceStorage: resource.MustParse(mc.Spec.Storage),
                            },
                        },
                    },
                },
            },
        },
    }
}

func (r *MySQLClusterReconciler) updateStatus(ctx context.Context, mc *databasev1.MySQLCluster) error {
    var sts appsv1.StatefulSet
    if err := r.Get(ctx, types.NamespacedName{Name: mc.Name, Namespace: mc.Namespace}, &sts); err != nil {
        return err
    }

    mc.Status.ReadyReplicas = sts.Status.ReadyReplicas
    if sts.Status.ReadyReplicas == mc.Spec.Replicas {
        mc.Status.Phase = "Running"
    } else if sts.Status.ReadyReplicas > 0 {
        mc.Status.Phase = "Scaling"
    } else {
        mc.Status.Phase = "Creating"
    }

    return r.Status().Update(ctx, mc)
}

// SetupWithManager 注册控制器
func (r *MySQLClusterReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&databasev1.MySQLCluster{}).
        Owns(&appsv1.StatefulSet{}).
        Owns(&corev1.Service{}).
        Owns(&corev1.Secret{}).
        Complete(r)
}
```

### 3.4 用 Java 开发 Operator（Fabric8）

如果你是 Java 开发者，不想学 Go，可以用 [Fabric8 Kubernetes Client](https://github.com/fabric8io/kubernetes-client) 开发 Operator：

```java
// pom.xml
/*
<dependency>
    <groupId>io.fabric8</groupId>
    <artifactId>kubernetes-client</artifactId>
    <version>6.13.4</version>
</dependency>
<dependency>
    <groupId>io.fabric8</groupId>
    <artifactId>kubernetes-model-apiextensions</artifactId>
    <version>6.13.4</version>
</dependency>
*/

// 1. 定义 CRD 的 Java 模型
public class MySQLClusterSpec {
    private int replicas = 3;
    private String version = "8.0";
    private String storage = "100Gi";
    // getter/setter ...
}

public class MySQLClusterStatus {
    private String phase;
    private int readyReplicas;
    // getter/setter ...
}

public class MySQLCluster extends CustomResource<MySQLClusterSpec, MySQLClusterStatus> {
}

public class MySQLClusterList extends DefaultKubernetesResourceList<MySQLCluster> {
}

// 2. 注册 CRD
try (KubernetesClient client = new KubernetesClientBuilder().build()) {
    CustomResourceDefinition crd = client.apiextensions().v1()
        .customResourceDefinitions()
        .load(new FileInputStream("mysqlcluster-crd.yaml"))
        .item();
    
    client.apiextensions().v1().customResourceDefinitions().resource(crd).create();

    // 3. 启动 Informer 监听变化
    client.resources(MySQLCluster.class)
        .inAnyNamespace()
        .inform(new ResourceEventHandler<>() {
            @Override
            public void onAdd(MySQLCluster mc) {
                System.out.println("MySQLCluster created: " + mc.getMetadata().getName());
                reconcile(client, mc);
            }

            @Override
            public void onUpdate(MySQLCluster oldMC, MySQLCluster newMC) {
                System.out.println("MySQLCluster updated: " + newMC.getMetadata().getName());
                reconcile(client, newMC);
            }

            @Override
            public void onDelete(MySQLCluster mc, boolean deletedFinalStateUnknown) {
                System.out.println("MySQLCluster deleted: " + mc.getMetadata().getName());
                // 清理逻辑
            }
        });

    // 保持运行
    Thread.currentThread().join();
}

// 4. Reconcile 逻辑
static void reconcile(KubernetesClient client, MySQLCluster mc) {
    String namespace = mc.getMetadata().getNamespace();
    String name = mc.getMetadata().getName();
    int replicas = mc.getSpec().getReplicas();

    // 创建 Headless Service
    Service service = new ServiceBuilder()
        .withNewMetadata().withName(name + "-headless").withNamespace(namespace).endMetadata()
        .withNewSpec()
        .withClusterIP("None")
        .withSelector(Map.of("app", name))
        .addNewPort().withPort(3306).endPort()
        .endSpec()
        .build();
    client.services().inNamespace(namespace).resource(service).serverSideApply();

    // 创建 StatefulSet
    StatefulSet sts = new StatefulSetBuilder()
        .withNewMetadata().withName(name).withNamespace(namespace).endMetadata()
        .withNewSpec()
        .withServiceName(name + "-headless")
        .withReplicas(replicas)
        .withNewSelector().withMatchLabels(Map.of("app", name)).endSelector()
        .withNewTemplate()
        .withNewMetadata().withLabels(Map.of("app", name)).endMetadata()
        .withNewSpec()
        .addNewContainer()
        .withName("mysql")
        .withImage("mysql:" + mc.getSpec().getVersion())
        .addNewPort().withContainerPort(3306).endPort()
        .addNewVolumeMount().withName("data").withMountPath("/var/lib/mysql").endVolumeMount()
        .endContainer()
        .endSpec()
        .endTemplate()
        .addNewVolumeClaimTemplate()
        .withNewMetadata().withName("data").endMetadata()
        .withNewSpec()
        .withAccessModes("ReadWriteOnce")
        .withNewResources()
        .addToRequests("storage", new Quantity(mc.getSpec().getStorage()))
        .endResources()
        .endSpec()
        .endVolumeClaimTemplate()
        .endSpec()
        .build();
    client.apps().statefulSets().inNamespace(namespace).resource(sts).serverSideApply();

    // 更新 Status
    mc.getStatus().setPhase("Running");
    mc.getStatus().setReadyReplicas(replicas);
    client.resource(mc).updateStatus();
}
```

### 3.5 Operator SDK（另一种选择）

Operator SDK 是 Red Hat 出品的脚手架，支持 Go/Ansible/Helm 三种模式：

```bash
# 安装 Operator SDK
curl -LO https://github.com/operator-framework/operator-sdk/releases/latest/download/operator-sdk_linux_amd64
chmod +x operator-sdk_linux_amd64 && mv operator-sdk_linux_amd64 /usr/local/bin/operator-sdk

# 创建项目
operator-sdk init --domain example.com --repo example.com/mysql-operator

# 创建 API
operator-sdk create api --group database --version v1 --kind MySQLCluster --resource --controller
```

## 四、实战案例：Redis Operator

让我们看一个完整的 Redis Operator 示例：

```go
func (r *RedisClusterReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // 1. 获取 RedisCluster
    var redisCluster cachev1alpha1.RedisCluster
    if err := r.Get(ctx, req.NamespacedName, &redisCluster); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // 2. 创建 ConfigMap（Redis 配置）
    cm := r.buildRedisConfig(&redisCluster)
    if err := r.CreateOrUpdate(ctx, cm); err != nil {
        return ctrl.Result{}, err
    }

    // 3. 创建 Headless Service
    svc := r.buildHeadlessService(&redisCluster)
    if err := r.CreateOrUpdate(ctx, svc); err != nil {
        return ctrl.Result{}, err
    }

    // 4. 创建 StatefulSet
    sts := r.buildStatefulSet(&redisCluster)
    if err := r.CreateOrUpdate(ctx, sts); err != nil {
        return ctrl.Result{}, err
    }

    // 5. 检查所有 Pod 是否就绪
    if sts.Status.ReadyReplicas != redisCluster.Spec.Replicas {
        r.updateStatus(ctx, &redisCluster, "Scaling", int(sts.Status.ReadyReplicas))
        return ctrl.Result{RequeueAfter: 10 * time.Second}, nil
    }

    // 6. 初始化集群（只在首次创建时执行）
    if redisCluster.Status.Phase == "" {
        if err := r.initRedisCluster(ctx, &redisCluster); err != nil {
            r.updateStatus(ctx, &redisCluster, "Failed", 0)
            return ctrl.Result{RequeueAfter: 30 * time.Second}, err
        }
    }

    // 7. 更新状态为 Running
    r.updateStatus(ctx, &redisCluster, "Running", int(sts.Status.ReadyReplicas))

    return ctrl.Result{RequeueAfter: 60 * time.Second}, nil
}

func (r *RedisClusterReconciler) initRedisCluster(ctx context.Context, rc *databasev1.RedisCluster) error {
    // 收集所有 Pod 的 IP
    var podIPs []string
    for i := 0; i < int(rc.Spec.Replicas); i++ {
        podName := fmt.Sprintf("%s-%d", rc.Name, i)
        pod, err := r.getPod(ctx, podName, rc.Namespace)
        if err != nil {
            return err
        }
        podIPs = append(podIPs, fmt.Sprintf("%s:6379", pod.Status.PodIP))
    }

    // 执行 redis-cli --cluster create
    cmd := exec.CommandContext(ctx, "redis-cli",
        "--cluster", "create",
        strings.Join(podIPs, " "),
        "--cluster-replicas", "1",
        "--cluster-yes",
    )
    return cmd.Run()
}
```

## 五、测试与部署

### 5.1 本地测试（envtest）

```go
// 使用 controller-runtime 的 envtest
func TestReconcile(t *testing.T) {
    // 启动临时 API Server
    testEnv := &envtest.Environment{CRDDirectoryPaths: []string{"./config/crd"}}
    cfg, _ := testEnv.Start()
    defer testEnv.Stop()

    // 创建 Manager 和 Controller
    mgr, _ := ctrl.NewManager(cfg, ctrl.Options{})
    reconciler := &MySQLClusterReconciler{Client: mgr.GetClient()}
    reconciler.SetupWithManager(mgr)

    // 创建测试用例
    mc := &databasev1.MySQLCluster{
        ObjectMeta: metav1.ObjectMeta{Name: "test", Namespace: "default"},
        Spec:       databasev1.MySQLClusterSpec{Replicas: 3, Version: "8.0"},
    }
    mgr.GetClient().Create(context.Background(), mc)

    // 验证 StatefulSet 是否被创建
    Eventually(func() bool {
        sts := &appsv1.StatefulSet{}
        err := mgr.GetClient().Get(context.Background(),
            types.NamespacedName{Name: "test", Namespace: "default"}, sts)
        return err == nil && *sts.Spec.Replicas == 3
    }, 5*time.Second, 100*time.Millisecond).Should(BeTrue())
}
```

### 5.2 部署 Operator

```bash
# 构建镜像
docker build -t myrepo/mysql-operator:latest .

# 推送镜像
docker push myrepo/mysql-operator:latest

# 生成部署清单
make manifests    # 生成 CRD YAML
make install      # 安装 CRD 到集群

# 部署 Operator
make deploy       # 部署 Operator Deployment

# 创建 MySQLCluster 实例
kubectl apply -f config/samples/database_v1_mysqlcluster.yaml
```

## 六、避坑指南

### 6.1 Reconcile 幂等性

**最重要的原则：Reconcile 必须幂等。** 同一个输入多次执行，结果应该一致。

```go
// ❌ 错误：每次都创建新资源
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    r.Create(ctx, newStatefulSet)  // 已经存在会报错
}

// ✅ 正确：先查再创建/更新
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var sts appsv1.StatefulSet
    err := r.Get(ctx, namespacedName, &sts)
    if errors.IsNotFound(err) {
        return ctrl.Result{}, r.Create(ctx, desiredSts)
    }
    // 对比并更新
    return ctrl.Result{}, r.Update(ctx, &sts)
}
```

### 6.2 不要在 Reconcile 中执行耗时操作

```go
// ❌ 错误：在 Reconcile 中等待 Pod 就绪
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    for {
        if podReady() { break }
        time.Sleep(5 * time.Second)  // 阻塞！
    }
}

// ✅ 正确：返回 RequeueAfter，让控制器稍后再查
func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    if !podReady() {
        return ctrl.Result{RequeueAfter: 10 * time.Second}, nil  // 10秒后再来
    }
    return ctrl.Result{}, nil
}
```

### 6.3 Finalizer：删除前清理

当 CR 被删除时，可能需要清理外部资源：

```go
const finalizerName = "database.example.com/finalizer"

func (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var mc databasev1.MySQLCluster
    r.Get(ctx, req.NamespacedName, &mc)

    if !mc.DeletionTimestamp.IsZero() {
        // 正在删除
        if controllerutil.ContainsFinalizer(&mc, finalizerName) {
            // 清理外部资源（如删除云盘快照）
            if err := r.cleanupExternalResources(ctx, &mc); err != nil {
                return ctrl.Result{}, err  // 清理失败，重试
            }
            // 移除 finalizer
            controllerutil.RemoveFinalizer(&mc, finalizerName)
            r.Update(ctx, &mc)
        }
        return ctrl.Result{}, nil
    }

    // 添加 finalizer
    if !controllerutil.ContainsFinalizer(&mc, finalizerName) {
        controllerutil.AddFinalizer(&mc, finalizerName)
        r.Update(ctx, &mc)
        return ctrl.Result{Requeue: true}, nil
    }

    // 正常 reconcile 逻辑...
}
```

### 6.4 RBAC 权限

```go
// +kubebuilder:rbac:groups=database.example.com,resources=mysqlclusters,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services;secrets;configmaps,verbs=get;list;watch;create;update;patch;delete
```

忘了加权限，Controller 会一直报 403 Forbidden。kubebuilder 的注释会自动生成 RBAC YAML。

## 七、面试要点总结

### 高频面试题

1. **Operator 的核心原理是什么？**
   - CRD 定义自定义资源
   - Controller 监听资源变化
   - Reconcile 循环使实际状态趋近期望状态
   - 本质是"运维知识代码化"

2. **Reconcile 循环为什么必须幂等？**
   - 事件可能重复触发（List-Watch 机制）
   - 多个事件可能合并
   - 控制器重启后会重新 reconcile 所有资源
   - 幂等保证多次执行结果一致

3. **Finalizer 的作用？**
   - 防止 CR 在外部资源清理前被删除
   - 删除时先执行清理逻辑，再移除 Finalizer
   - 没有 Finalizer，CR 会立即从 etcd 删除

4. **CRD 的 status 子资源为什么重要？**
   - status 和 spec 分离，用户不能直接改 status
   - Controller 通过 status 子资源更新状态
   - 避免 Controller 更新 status 时覆盖用户的 spec

5. **Operator 和 Helm 的区别？**
   - Helm 是模板引擎，一次性部署
   - Operator 是持续运行的控制器，持续调谐
   - Operator 能处理 Day-2 操作（扩容、备份、升级）
   - 两者可以结合使用

### 核心知识点速记

```
Operator = CRD + Controller
CRD = 定义新资源类型
CR = CRD 的实例
Reconcile = 观察→对比→调谐的循环
幂等性 = 多次执行结果一致
Finalizer = 删除前的清理钩子
Kubebuilder = Go Operator 脚手架
Operator SDK = Red Hat 的 Operator 脚手架
Fabric8 = Java K8s Client
```

## 总结

Operator 是 K8s 最强大的扩展机制，它把运维专家的知识编码为软件。通过 CRD + Controller 模式，你可以让 K8s 管理任何复杂的应用。

对于 Java 开发者：
- 如果团队以 Java 为主，用 Fabric8 开发 Operator
- 如果愿意学 Go，Kubebuilder 是更好的选择（生态更完善）
- 如果不想写代码，Operator SDK 的 Helm/Ansible 模式也能满足简单场景

关键原则：**Reconcile 要幂等，不要阻塞，用 RequeueAfter 轮询。**
