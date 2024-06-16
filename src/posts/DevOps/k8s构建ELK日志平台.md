---
title: k8s构建ELK日志平台
author: ztq
tag:
  - k8s
  - elk
category:
  - CICD
  
date: 2021-04-13 14:40:00
---



# k8s构建ELK日志平台

## Pod中附加专用日志收集的容器

# 一、概述

目前主流日志收集系统为：Filebeat + ELK，本文尝试使用该系统对k8s里部署的Pod进行日志收集并加以图形可视化展示；

日志收集方案设计图

![img](/assets/images/70db7f87.jpg)

# 二、优缺点

每个预应用程序的Pod中增加一个日志收集容器，使用emptyDir共享日志目录，让日志收集程序能够读取到。

![img](/assets/images/743e6cec.jpg)

优点：低耦合。

缺点：每个Pod启动一个日志收集代理，增加资源消耗，并增加运维维护成本。

 

# 三、部署ELK日志平台

ELK官网：

https://www.elastic.co/cn/

配置yum源参考：

https://www.elastic.co/guide/en/logstash/current/installing-logstash.html

## 3.1 安装JDK

```java
$ yum install -y java-1.8.0-openjdk 
```



## 3.2 配置yum源

```java
[zhengtianqi@root ~]# vim /etc/yum.repos.d/elk.repo 
[logstash-7.x]
name=Elastic repository for 7.x packages 
baseurl=https://artifacts.elastic.co/packages/7.x/yum 
gpgcheck=1 
gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch 
enabled=1 
autorefresh=1 
type=rpm-md 
```



## 3.3 安装ELK

```java
[root@qixiao1v zhengtianqi]# sudo su root
[root@qixiao1v zhengtianqi]# yum install -y logstash elasticsearch kibana 
```

## 3.4 ELK相关配置

这里主要对ES和kibana的主配置文件进行配置，指定相关IP和端口等。

### 配置ES：

```java
[root@qixiao1v zhengtianqi]# grep -Ev '^#|^$' /etc/elasticsearch/elasticsearch.yml 

path.data: /var/lib/elasticsearch 

path.logs: /var/log/elasticsearch 

bootstrap.memory_lock: false 

network.host: 0.0.0.0 

http.port: 9200 

discovery.type: single-node # 如果启动单节点，则需要添加此参数 
```

注意，ES需要优化一些内核参数：

```java
[root@qixiao1v zhengtianqi]# vim /etc/security/limits.conf 
# End of file 
* soft nofile 60000 
* hard nofile 65535 
* soft nproc 65535 
* hard nproc 65535 
[root@qixiao1v zhengtianqi]# vim /etc/security/limits.d/20-nproc.conf 
* soft nproc 65535 
root soft nproc 65535 
```

### 运行：

```java
 [root@qixiao1v zhengtianqi]# sysctl –p
```

生效配置。

### 配置kibana：

```java
[root@qixiao1v zhengtianqi]# grep -Ev '^#|^$' /etc/kibana/kibana.yml 
server.port: 5601 
server.host: "10.16.13.52" 
server.name: "kibana" 
elasticsearch.hosts: ["http://10.16.13.52:9200"] 
kibana.index: ".kibana" 
i18n.locale: "zh-CN" 
```

## 3.5 启动ES和Kibana

```java
[root@qixiao1v zhengtianqi]# systemctl start elasticsearch 
[root@qixiao1v zhengtianqi]# systemctl enable elasticsearch 
[root@qixiao1v zhengtianqi]# systemctl start kibana 
[root@qixiao1v zhengtianqi]# systemctl enable kibana 
[root@qixiao1v zhengtianqi]# netstat -lntup|grep java 
tcp  0  0 0.0.0.0:9200  0.0.0.0:*  LISTEN  31645/java 
tcp  0  0 0.0.0.0:9300  0.0.0.0:*  LISTEN  31645/java 
```

访问kibana：[http://10.16.13.52:5601](http://10.16.13.52:5601/)

 

# 四、采集k8s应用日志部署

采集日志客户端采用Filebeat来进行采集日志，使用ConfigMap的形式来存储Filebeat的配置，采用ConfigMap形式部署Filebeat，然后将配置文件和日志挂载到Filebeat的Pod中，利用Filebeat采集k8s的集群日志。

## 4.1 部署Filebeat日志收集客户端

### 4.1.1 编写Filebeat配置文件

采用ConfigMap来保存Filebeat的配置文件，然后启动Pod时挂载到Pod里的容器里。

```java
[root@k8s-master-128 elk]# cat k8s-logs.yaml
apiVersion: v1
kind: ConfigMap # 保存Filebeat的配置信息
metadata:
  name: k8s-logs-filebeat-config
  namespace: kube-system

data:
  filebeat.yml: |-
    filebeat.prospectors:
      - type: log
        paths:
          - /opt/kubernetes/logs/* # 指定k8s集群的采集日志目录，星号匹配所有该目录下的文件
        fields:
          app: k8s
          type: module
        fields_under_root: true

    output.logstash:
      hosts: ['172.16.194.128:5044'] # 这里写logstash启动的监听地址和端口

---

apiVersion: apps/v1
kind: DaemonSet # 使用DaemonSet方式将Filebeat部署到集群每个节点上
metadata:
  name: k8s-logs # Pod名称
  namespace: kube-system # 指定运行命名空间
spec:
  selector:
    matchLabels:
      project: k8s
      app: filebeat
  template:
    metadata:
      labels:
        project: k8s
        app: filebeat
    spec:
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:6.4.2
        args: [
          "-c", "/etc/filebeat.yml",
          "-e",
        ]
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
          limits:
            cpu: 500m
            memory: 500Mi
        securityContext:
          runAsUser: 0
        volumeMounts:
        - name: filebeat-config
          mountPath: /etc/filebeat.yml
          subPath: filebeat.yml
        - name: k8s-logs
          mountPath: /opt/kubernetes/logs
      volumes:
      - name: k8s-logs
        hostPath:
          path: /opt/kubernetes/logs # 将主机上的目录挂载到Pod容器里
      - name: filebeat-config
        configMap:
          name: k8s-logs-filebeat-config # 指定configmap挂载到Pod容器里
```



### 4.1.2 上传Filebeat配置文件

```
[root@k8s-master-128 elk]# kubectl create -f k8s-logs.yaml
configmap/k8s-logs-filebeat-config created
daemonset.apps/k8s-logs created
[root@k8s-master-128 elk]# kubectl get -f k8s-logs.yaml
NAME DATA AGE
configmap/k8s-logs-filebeat-config 1 6s

NAME DESIRED CURRENT READY UP-TO-DATE AVAILABLE NODE SELECTOR AGE
daemonset.apps/k8s-logs 2 2 0 2 0 <none> 5s

[root@k8s-master-128 elk]# kubectl get pod -A|grep k8s-log
kube-system k8s-logs-7wwlx 1/1 Running 0 5m
kube-system k8s-logs-pd8m2 1/1 Running 0 5m
```



### 4.1.3 上传Filebeat配置文件是否成功

检测配置的日志目录是否有挂载到Pod中：

```java
[root@k8s-master-128 elk]# kubectl exec -it -n kube-system k8s-logs-7wwlx bash
[root@k8s-logs-7wwlx filebeat]# ls -lh /opt/kubernetes/logs/ -d
drwxr-xr-x 2 root root 8.0K Jun 3 06:44 /opt/kubernetes/logs/
[root@k8s-logs-7wwlx filebeat]# cat /etc/filebeat.yml
filebeat.prospectors:
  - type: log
    paths:
      - /opt/kubernetes/logs/* # 指定k8s集群的采集日志目录，星号匹配所有该目录下的文件
    fields:
      app: k8s
      type: module
    fields_under_root: true

output.logstash:
  hosts: ['172.16.194.128:5044'] # 这里写logstash启动的监听地址和端口
```

4.1.3过程也可以进入k8s管理页面 -> 命名空间选择 -> 配置与存储修改配置文件



### 4.1.4 创建/修改pod，更新项目配置文件

```java
[root@]# kubectl get pod,deploy -n root 
NAME                 READY  STATUS  RESTARTS  AGE 
pod/qixiao-569bf65846-bdrd4     3/3   Running  0     3d22h 
pod/qixiao-569bf65846-swwlj     3/3   Running  0     3d22h 
pod/qixiao-569bf65846-xr9v7     3/3   Running  0     3d22h 
pod/qixiao-socket-7d7dfcff76-6kqwt  1/1   Running  0     25d 
NAME   DESIRED  CURRENT  UP-TO-DATE  AVAILABLE  AGE 
deployment.extensions/root  3  3  3  3  592d 
[root@]# kubectl edit deployment.extensions/root -n root
```



4.1.4过程也可以进入k8s管理页面：命名空间选择qixiao -> 工作负载 -> 部署 -> qixiao –> 右侧三个点 –> 查看 /编辑YAML -> 复制出来修改 -> 修改完点击更新

## 4.2 配置Logstash接收日志

### 4.2.1 配置logstash配置文件

```java
[root@k8s-master-128 elk]# cat filebeat-to-logstash.conf
input {
  beats {
     port => 5044
  }
}

filter {
}

output {
    if [type] == "module" {
        elasticsearch {
            hosts => ["http://127.0.0.1:9200"]
            index => "k8s-log-%{+YYYY.MM.dd}"
        }
    }
    stdout { codec=> rubydebug }
}
```

上述配置文件中的[type] == "pipeline"为filebeat-configmap.yaml中的fields:

type:

### 4.2.2 启动/重启logstash

```java
[root@]# systemctl start logstash
```

注意：每次修改需要重启logstash

```java
[root@]# systemctl restart logstash
```

 

### 4.2.3 logstash部署是否成功

```java
# 调试启动
[root@k8s-master-128 elk]# /usr/share/logstash/bin/logstash -f filebeat-to-logstash.conf

# 守护程序启动：需要编辑配置文件，去掉stdout配置
[root@k8s-master-128 elk]# cp filebeat-to-logstash.conf /etc/logstash/conf.d/logstash.conf
[root@k8s-master-128 elk]# systemctl start logstash

[root@k8s-master-128 ~]# netstat -lntup|grep java
tcp6 0 0 :::9200 :::* LISTEN 119229/java
tcp6 0 0 :::5044 :::* LISTEN 710/java
tcp6 0 0 :::9300 :::* LISTEN 119229/java
tcp6 0 0 127.0.0.1:9600 :::* LISTEN 710/java
```

 

# 五、展示ELK日志

## 5.1 配置Kibana展示日志

左侧导航栏 -> 点击Management –> 点击Stack Management –> Kibana 索引模式 -> 创建索引模式 ）-> 时间字段@timestamp -> 创建成功

![img](/assets/images/1337b059.png)

 



## 5.2 查看kibana日志

左侧导航栏 -> Kibana -> Discover

![img](/assets/images/fb523dd6.png)

![img](/assets/images/e18c9709.jpg)

 

 

## 5.3 绘制kibana图表

左侧导航栏 -> Kibana -> dashboards –> 创建 仪表板 -> 新建

 

以TSVB为例：

面板选择 -> 索引模式-> 时间字段@timestamp

![img](/assets/images/480c47d9.png)

![img](/assets/images/8fb0cd0c.png)

![img](/assets/images/ea179a09.png)

![img](/assets/images/5a824e2f.png)

参考文档：https://nicksors.cc/2019/07/11/kubernetes%E7%B3%BB%E5%88%97%E4%B9%8B%E3%80%8Ak8s%E6%9E%84%E5%BB%BAELK%E6%97%A5%E5%BF%97%E5%B9%B3%E5%8F%B0%E3%80%8B.html