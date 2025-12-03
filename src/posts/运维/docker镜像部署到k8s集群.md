---
title: docker镜像部署到k8s集群
author: zheng
tag:
  - k8s
  - docker
category:
  - CICD
date: 2022-04-11 21:20:00

---

# 一、搭建docker私有仓库

本文使用阿里云私有仓库（个人免费版），阿里云--->容器镜像服务

![image-20220411212506831](/assets/images/image-20220411212506831.png)

# 二、docker打包

1、程序目录

```java
ll
    
-rw-r--r-- 1 root root      872 4月  11 22:03 dockerfile
-rw-r--r-- 1 root root     8678 4月  11 21:53 jdk-8u251-linux-x64.tar.gz
-rw-r--r-- 1 root root 75306958 4月  11 21:47 ruoyi.jar
```

![image-20220411220547876](/assets/images/image-20220411220512656.png)

2、编写dockerfile并打包

```java
FROM uquote/jdk8-tomee1.7.3-plume
## 编写人
MAINTAINER zhengtianqi
# 在docker容器构建时拷贝程序
ADD ruoyi.jar ruoyi.jar
# 容器暴露的端口号，需要与jar包在容器中运行使用端口号一致
EXPOSE 80
# 容器启动之后执行的命令， java -jar ROOT.jar
ENTRYPOINT ["java","-jar","ruoyi.jar"]
```

```java
# 打包
docker build -t test:latest .
# 查看
docker images
```

3、登录阿里云镜像仓库

```java
docker login --username=z130****66717 registry.cn-beijing.aliyuncs.com
```

4、将镜像推送到阿里云镜像仓库Registry

```java
docker tag [ImageId] registry.cn-beijing.aliyuncs.com/zhengtianqi/demo:[镜像版本号]
docker push registry.cn-beijing.aliyuncs.com/zhengtianqi/demo:[镜像版本号]
```

5、查看阿里云镜像仓库Registry中的镜像

![image-20220411221525635](/assets/images/image-20220411221525635.png)

6、拉取镜像

```java
docker pull registry.cn-beijing.aliyuncs.com/zhengtianqi/demo:latest
```

# 三、k8s

1、创建yaml文件

```java
kubectl create deployment [pod名称] --image=[docker私有仓库地址/镜像:版本号] -o yaml --dry-run=client > [yaml文件名称].yaml
示例：
kubectl create deployment demo --port=80 --replicas=3 --image=registry.cn-beijing.aliyuncs.com/zhengtianqi/demo:latest -o yaml --dry-run=client > demo.yaml
```

2、查看yaml文件

```java
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: demo
  name: demo
spec:
  replicas: 3
  ports:
  - port: 80
    targetPort: 80  
  selector:
    matchLabels:
      app: demo
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: demo
    spec:
      containers:
      - image: registry.cn-beijing.aliyuncs.com/zhengtianqi/demo:latest
        name: demo
        resources: {}
status: {}
```

3、通过yaml创建服务

```java
kubectl create -f demo.yaml
```

![image-20220411222247494](/assets/images/image-20220411222247494.png)

4、查看创建状态

```java
kubectl get pod
```

5、创建日志查看

```java
kubectl describe pod
```

6、杀死当前pod

```
kubectl delete deployment <deployment名> -n <namespace>
```

7、pod升级

[Kubernetes--k8s---滚动更新--零停机不停服发布服务](https://blog.csdn.net/zzq900503/article/details/101221899)

[Kubernetes滚动更新（无中断平滑发布） (idcsec.com)](http://idcsec.com/2019/03/05/kubernetes滚动更新（无中断平滑发布）/)

# 附：yaml文件详解

```java
# yaml格式的pod定义文件完整内容：
apiVersion: v1           #必选，版本号，例如v1
kind: Pod                #必选，Pod
metadata:                #必选，元数据
  name: string           #必选，Pod名称
  namespace: string      #必选，Pod所属的命名空间
  labels:                #自定义标签
    - name: string       #自定义标签名字
  annotations:           #自定义注释列表
    - name: string
spec:                    #必选，Pod中容器的详细定义
  containers:            #必选，Pod中容器列表
  - name: string         #必选，容器名称
    image: string        #必选，容器的镜像名称
    imagePullPolicy: [Always | Never | IfNotPresent] #获取镜像的策略 Alawys表示下载镜像 IfnotPresent表示优先使用本地镜像，否则下载镜像，Nerver表示仅使用本地镜像
    command: [string]                  #容器的启动命令列表，如不指定，使用打包时使用的启动命令
    args: [string]                     #容器的启动命令参数列表
    workingDir: string                 #容器的工作目录
    volumeMounts:                      #挂载到容器内部的存储卷配置
    - name: string                     #引用pod定义的共享存储卷的名称，需用volumes[]部分定义的的卷名
      mountPath: string               #存储卷在容器内mount的绝对路径，应少于512字符
      readOnly: boolean               #是否为只读模式
    ports:                           #需要暴露的端口库号列表
    - name: string                   #端口号名称
      containerPort: int             #容器需要监听的端口号
      hostPort: int                  #容器所在主机需要监听的端口号，默认与Container相同
      protocol: string               #端口协议，支持TCP和UDP，默认TCP
    env:                             #容器运行前需设置的环境变量列表
    - name: string                   #环境变量名称
      value: string                  #环境变量的值
    resources:                       #资源限制和请求的设置
      limits:                        #资源限制的设置
        cpu: string                  #Cpu的限制，单位为core数，将用于docker run --cpu-shares参数
        memory: string               #内存限制，单位可以为Mib/Gib，将用于docker run --memory参数
      requests:                       #资源请求的设置
        cpu: string                   #Cpu请求，容器启动的初始可用数量
        memory: string                #内存请求，容器启动的初始可用数量
    livenessProbe:                    #对Pod内个容器健康检查的设置，当探测无响应几次后将自动重启该容器，检查方法有exec、httpGet和tcpSocket，对一个容器只需设置其中一种方法即可
      exec:                           #对Pod容器内检查方式设置为exec方式
        command: [string]             #exec方式需要制定的命令或脚本
      httpGet:                        #对Pod内个容器健康检查方法设置为HttpGet，需要制定Path、port
        path: string
        port: number
        host: string
        scheme: string
        HttpHeaders:
        - name: string
          value: string
      tcpSocket:                       #对Pod内个容器健康检查方式设置为tcpSocket方式
         port: number
       initialDelaySeconds: 0       #容器启动完成后首次探测的时间，单位为秒
       timeoutSeconds: 0            #对容器健康检查探测等待响应的超时时间，单位秒，默认1秒
       periodSeconds: 0             #对容器监控检查的定期探测时间设置，单位秒，默认10秒一次
       successThreshold: 0
       failureThreshold: 0
       securityContext:
         privileged:false
    restartPolicy: [Always | Never | OnFailure]#Pod的重启策略，Always表示一旦不管以何种方式终止运行，kubelet都将重启，OnFailure表示只有Pod以非0退出码退出才重启，Nerver表示不再重启该Pod
    nodeSelector: obeject          #设置NodeSelector表示将该Pod调度到包含这个label的node上，以key：value的格式指定
    imagePullSecrets:              #Pull镜像时使用的secret名称，以key：secretkey格式指定
    - name: string
    hostNetwork:false     #是否使用主机网络模式，默认为false，如果设置为true，表示使用宿主机网络
    volumes:                    #在该pod上定义共享存储卷列表
    - name: string              #共享存储卷名称 （volumes类型有很多种）
      emptyDir: {}              #类型为emtyDir的存储卷，与Pod同生命周期的一个临时目录。为空值
      hostPath: string         #类型为hostPath的存储卷，表示挂载Pod所在宿主机的目录
        path: string           #Pod所在宿主机的目录，将被用于同期中mount的目录
      secret:                  #类型为secret的存储卷，挂载集群与定义的secre对象到容器内部
        scretname: string  
        items:     
        - key: string
          path: string
      configMap:             #类型为configMap的存储卷，挂载预定义的configMap对象到容器内部
        name: string
        items:
        - key: string
          path: string
```

