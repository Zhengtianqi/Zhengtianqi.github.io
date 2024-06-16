---
title: k8s集群搭建
author: ztq
tag:

  - k8s
category:
  - CICD
date: 2022-04-04 21:42:00

---

## 1. 安装要求

在开始之前，部署Kubernetes集群机器需要满足以下几个条件：

- 一台或多台机器，操作系统 CentOS7.x-86_x64
- 硬件配置：2GB或更多RAM，2个CPU或更多CPU，硬盘30GB或更多
- 可以访问外网，需要拉取镜像，如果服务器不能上网，需要提前下载镜像并导入节点
- 禁止swap分区
- docker和k8s保持官网一致的版本，否则有报错

## 2. 准备环境

| 角色   | IP            |
| ------ | ------------- |
| master | 192.168.2.145 |
| node1  | 192.168.2.146 |
| node2  | 192.168.2.147 |

```java
# 关闭防火墙
systemctl stop firewalld # 临时
systemctl disable firewalld # 永久

# 关闭selinux
setenforce 0  # 临时
sed -i 's/enforcing/disabled/' /etc/selinux/config  # 永久

# 关闭swap
swapoff -a  # 临时
sed -ri 's/.*swap.*/#&/' /etc/fstab    # 永久

# 根据规划设置主机名
hostnamectl set-hostname <hostname>

# 在master添加hosts
cat >> /etc/hosts << EOF
192.168.2.145 k8smaster
192.168.2.146 k8snode1
192.168.2.147 k8snode2
EOF

# 将桥接的IPv4流量传递到iptables的链
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system  # 生效

# 时间同步
yum install ntpdate -y
ntpdate time.windows.com
```

## 3. 所有节点安装Docker/kubeadm/kubelet

Kubernetes默认CRI（容器运行时）为Docker，因此先安装Docker。

### 3.1 安装Docker

```java
$ wget https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo -O /etc/yum.repos.d/docker-ce.repo
$ yum -y install docker-ce-18.06.1.ce-3.el7
$ systemctl enable docker && systemctl start docker
$ docker --version
Docker version 18.06.1-ce, build e68fc7a
```

```java
$ cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": ["https://b9pmyelo.mirror.aliyuncs.com"]
}
EOF
```

### 3.2 添加阿里云YUM软件源

```java
$ cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

### 3.3 安装kubeadm，kubelet和kubectl

由于版本更新频繁，这里指定版本号部署：

```java
$ yum install -y kubelet-1.18.0 kubeadm-1.18.0 kubectl-1.18.0
$ systemctl enable kubelet
```

## 4. 部署Kubernetes Master

在192.168.2.145（Master）执行。

```java
$ kubeadm init \
  --apiserver-advertise-address=192.168.2.145 \
  --image-repository registry.cn-hangzhou.aliyuncs.com/google_containers \
  --kubernetes-version v1.23.5 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16
```

由于默认拉取镜像地址k8s.gcr.io国内无法访问，这里指定阿里云镜像仓库地址。

使用kubectl工具：

从节点没有，从主节点拷过去

[The connection to the server localhost:8080 was refused - did you specify the right host or port?](https://blog.csdn.net/M82_A1/article/details/99671934)）

```java
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
$ kubectl get nodes
```

![image-20220404214709099](/assets/images/image-20220404214709099.png)

## 5. 加入Kubernetes Node

在192.168.2.146/13（Node）执行。

向集群添加新节点，执行在kubeadm init输出的kubeadm join命令：（这条命令是Master执行init时生成的）

![image-20220404214514222](/assets/images/image-20220404214514222.png)

```java
$ kubeadm join 192.168.2.145:6443 --token tps61f.37r065fhvmvgmxk6 \
        --discovery-token-ca-cert-hash sha256:ccff7f62596ebe95207ec22d3d32fa9183a0200d7cfc50b6a10cfa1626593a2e
```

默认token有效期为24小时，当过期之后，该token就不可用了。这时就需要重新创建token，操作如下：

```java
kubeadm token create --print-join-command
```

## 6. 部署CNI网络插件

```java
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

默认镜像地址无法访问，sed命令修改为docker hub镜像仓库。

可以参考[kube-flannel.yml(已修改镜像下载数据源)](https://blog.csdn.net/weixin_43298522/article/details/109769013)

```java
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

kubectl get pods -n kube-system
NAME                          READY   STATUS    RESTARTS   AGE
kube-flannel-ds-amd64-2pc95   1/1     Running   0          72s
```

## 7. 测试kubernetes集群

在Kubernetes集群中创建一个pod，验证是否正常运行：

```java
$ kubectl create deployment nginx --image=nginx
$ kubectl expose deployment nginx --port=80 --type=NodePort
$ kubectl get pod,svc
```

访问地址：http://NodeIP:Port  
