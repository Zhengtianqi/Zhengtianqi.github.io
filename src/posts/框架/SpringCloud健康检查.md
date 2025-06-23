---
title: SpringCloud健康检查
author: ztq
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:31:00
---

# 服务健康检查：

基于Spring Cloud体系，可以使用spring cloud  actuator组件

# 1、POM依赖

```java
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

# 2、Application.yml配置

```java
management:
    port: 8080  #actuator端口，保持与tomcat端口一致
    endpoints:
        web:
          exposure:
            include: "*"  #打开所有端点，默认是never
    endpoint:
        health:
            show-details: always #显示health的明细内容，默认是never

```

# 3、访问路径： 

http://服务地址/actuator/health



# 4、响应报文内容

```java
{
    "status": "UP", 
    "details": {
        "diskSpace": {
            "status": "UP", 
            "details": {
                "total": 499963174912, 
                "free": 200715714560, 
                "threshold": 10485760
            }
        }
    }
}
```

其中status状态含义如下

![image-20201214114013294](/assets/images/image-20201214114013294.png)



# 5、服务自检主动通知

```java
{
	"status": "当前状态（以整数形式字符串表示）"，
	"msg": "说明信息"，
}
```

status状态值描述：

0：服务正常

1：处理能力紧张，需要扩容

2：服务内部错误 ，需要重启或版本回滚

3：服务获取依赖资源失败，需要人工干预