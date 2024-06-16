---
title: Docker入门
author: 郑天祺
tag:
  - docker
category:
  - CICD
date: 2020-12-14 13:13:00
---



## docker概念		

​		docker和虚拟机VM结构非常相似，但是docker并非虚拟机技术，容器除了运行其中的应用之外，基本不消耗额外的系统资源，虚拟机需要单独分配 独占内存、磁盘等资源；
​		docker最初的设计优势，正是它比虚拟机更节省内存，启动更快。Docker不停地给大家宣传，”虚拟机需要数分钟启动，而Docker容器只需要50毫秒”。

![image-20201214131527522](/assets/images/image-20201214131527522.png)

## docker架构

![image-20201214131543066](/assets/images/image-20201214131543066.png)

## docker的组成元素

•	Docker Client : Docker提供给用户的客户端。Docker Client提供给用户一个终端，用户输入Docker提供的命令来管理本地或者远程的服务器。
•	Docker Daemon : Docker服务的守护进程。每台服务器（物理机或虚机）上只要安装了Docker的环境，基本上就跑了一个后台程序Docker Daemon，Docker Daemon会接收Docker Client发过来的指令,并对服务器的进行具体操作。
•	Docker Images : 俗称Docker的镜像，这个可难懂了。你暂时可以认为这个就像我们要给电脑装系统用的系统CD盘，里面有操作系统的程序，并且还有一些CD盘在系统的基础上安装了必要的软件，做成的一张 “只读” 的CD。
•	Docker Registry : 这个可认为是Docker Images的仓库，就像git的仓库一样，用来管理Docker镜像的，提供了Docker镜像的上传、下载和浏览等功能，并且提供安全的账号管理可以管理只有自己可见的私人image。就像git的仓库一样，docker也提供了官方的Registry，叫做Dock Hub(http://hub.Docker.com)
•	Docker Container : 俗称Docker的容器，这个是最关键的东西了。Docker Container是真正跑项目程序、消耗机器资源、提供服务的地方，Docker Container通过Docker Images启动，在Docker Images的基础上运行你需要的代码。你可以认为Docker Container提供了系统硬件环境，然后使用了Docker Images这些制作好的系统盘，再加上你的项目代码，跑起来就可以提供服务了。 听到这里，可能你会觉得是不是有点像一个VM利用保存的备份或者快照跑起来环境一样，其实是挺像的，但是实际上是有本质的区别，后面我会细说。

​       (C/S) 架构模式， 使用远程API来管理和创建 Docker容器。Docker容器通过镜像来创建，容器与镜像的关系类 似于面向对象编程中的对象与类；

## docker安装

安装 参考[docker官网](http://www.docker.com/products/docker)

查看安装版本 

```java
docker version
```

![image-20201214131734289](/assets/images/image-20201214131734289.png)

## 测试镜像库

为docker 添加国内镜像 

/etc/docker/daemon.json将: 

{ "registry-mirrors": [" https://obou6wyb.mirror.aliyuncs.com"]}

替换为 { "dns" : [ "192.168.101.2" , "8.8.8.8" ], "registry-mirrors" : [ "https://docker.mirrors.ustc.edu.cn" ] } 

## 重启docker 

```java
systemctl start docker
```

## 查看资源库有tomcat镜像

```java
docker search tomcat
```

![image-20201214131814678](/assets/images/image-20201214131814678.png)

## 从国内docker镜像库下载tomcat、centos

```java
docker pull tomcat/centos/nginx
```

## 查看有哪些镜像 

```java
docker images
```

![image-20201214131847691](/assets/images/image-20201214131847691.png)

## 启动基于tomcat,centos镜像启动容器 

```java
  docker run -p 8081:8080 tomcat 
```

​	若端口被占用，可以指定容器和主机的映射端口 前者是外围访问端口：后者是容器内部端口

```java
docker run -dit -p 4000:4000 centos 

-d 以守护态运行 
-p 宿主机端口映射容器端口 
-i 允许容器内标准输入 
-t 新容器内指定一个伪终端 
```

浏览器查看访问容器tomcat实例http://192.168.6.71:8081/

![image-20201214131948506](/assets/images/image-20201214131948506.png)

第一个容器服务部署成功了！

## 进去伪终端查看 

docker登录容器 

```java
docker exec -it hardcore_edison  "/bin/bash"
```

![image-20201214132014480](/assets/images/image-20201214132014480.png)

## 本地文件复制容器中

```java
docker cp localFile containerID:targetAddress
```

 命令： 

```java
docker cp gag-material.war [b5e1e6975083:/usr/local/tomcat/webapps](http://b5e1e6975083/usr/local/tomcat/webapps) 
```

将本地应用war包上传到tomcat容器的webapps下面，加载应用成功，浏览器显示：

![image-20201214132059091](/assets/images/image-20201214132059091.png)

以上就是docker的简单入门操作；

 构建一个docker镜像需要写一个叫做Dockerfile的文件
 先查看下本地镜像有哪些？

![image-20201214132127621](/assets/images/image-20201214132127621.png)

在某一个目录下面创建一个专门存放此demo的目录，也就是Dockerfile所在的context：

```java
mkdir dockerDemo && cd dockerDemo && touch Dockerfile
```

接下来就开始编写Dockerfile文件了（注意Dockerfile的D需要大写）

```java
 vim Dockerfile
```



```java
#############################################################  
#base image
FROM centos
#MAINTAINER
MAINTAINER [test@qq.com](mailto:test@qq.com)

 

#put nginx into /usr/local/src and unpack nginx
   ADD nginx-1.12.2.tar.gz /usr/local/src

#running required command

  RUN yum install -y gcc gcc-c++ glibc make autoconf openssl openssl-devel 
   RUN yum install -y libxslt-devel -y gd gd-devel GeoIP GeoIP-devel pcre pcre-devel
   RUN useradd -M -s /sbin/nologin nginx

#change dir to /usr/local/src/nginx-1.12.2
   WORKDIR /usr/local/src/nginx-1.12.2
# execute command to compile nginx
    RUN ./configure --user=nginx --group=nginx --prefix=/usr/local/nginx --with-file-aio --with-http_ssl_module --with-http_realip_module --with-http_addition_module --with-http_xslt_module --with-http_image_filter_module --with-http_geoip_module --with-http_sub_module --with-http_dav_module --with-    http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_auth_request_module --with-http_random_index_module --with-http_secure_link_module --with-http_degradation_module --with-http_stub_status_module && make && make install
#对外暴露端口
EXPOSE 80
#############################################################  
```

这里以编译nginx提供web服务来构建新的镜像

下载nginx源码包到docker_demo这个目录下

wget -c https://nginx.org/download/nginx-1.12.2.tar.gz

![image-20201214132215125](/assets/images/image-20201214132215125.png)

## 构建nginx:v1版本镜像

```java
docker build -t centos_nginx:v1 .
```

## 观察日志

每一个步骤都成功

![image-20201214132254636](/assets/images/image-20201214132254636.png)

## 构建步骤

成功构建centos_nginx:v1

![image-20201214132309723](/assets/images/image-20201214132309723.png)

```java
docker images
```

![image-20201214132326043](/assets/images/image-20201214132326043.png)

## 启动容器

```java
docker run -d -p80:80 centos_nginx:v1 /usr/local/nginx/sbin/nginx -g "daemon off;"
```

![image-20201214132343909](/assets/images/image-20201214132343909.png)

## 查看镜像对外暴露端口号

```java
docker port containerID
```

![image-20201214132401207](/assets/images/image-20201214132401207.png)

## 浏览器查看nginx启动状态

![image-20201214132416329](/assets/images/image-20201214132416329.png)

已经完成第一个nginx的镜像构建以及容器启动；