---
title: SpringCloud client配置
author: 郑天祺
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:32:00
---

# 1、pom.xml添加starter依赖

```java
<!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-alibaba-nacos-config -->
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

# 2、配置文件

创建配置文件  bootstrap.properties ，并添加基础配置信息：

```java
bootstrap.properties 
#配置中心地址
spring.cloud.nacos.config.server-addr=nacos.xt.com
#配置项 dataId 前缀
spring.cloud.nacos.config.prefix=supervision.web-platform.kafka.consumer
#配置格式，建议使用properties或yaml，同时为dataId的后缀
spring.cloud.nacos.config.file-extension=properties
#配置组id
spring.cloud.nacos.config.group=supervision:web-platform
```

# 3、加载配置

使用 Spring 的注解  @Value  设置属性值，使用 Spring Cloud 原生注解  @RefreshScope  实现配置自动更新。 

示例代码

```java
@RestController
@RefreshScope
public class HelloController {
 
    @Value("${user.code:默认值}")
    private String userCode;
 
    @RequestMapping("/hello")
    public String hello() {
        return "Hello, this is a nacos-config-demo. userCode=" + userCode;
    }
}
```

