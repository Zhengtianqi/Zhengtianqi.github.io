---
title: SpringCloud使用Feign
author: 郑天祺
tag:
  - SpringCloud
category:
  - spring
  
date: 2020-12-14 12:38:00
---

# 1、引入依赖

```java
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

# 2、添加配置

此处主要为nacos服务端地址配置

```java
spring:
  application:
    name: discovery-consumer-feign #修改此处为您的应用程序名称
    group: test #部门
    developer: developer #<负责人姓名>
  cloud:
    nacos:
      discovery:
        server-addr: nacos.goo.com    #Nacos服务地址
management:
  endpoints:
    web:
      exposure:
        include: "*"  #打开所有端点，默认是info,health
  endpoint:
    health:
      show-details: always #显示health的明细内容，默认是never
server:
  port: 8081

```

# 3、主类添加相关注解

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients    //启用feign调用，该注解会扫描@FeignClient注解
public class ConsumerFeignApplication {

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(ConsumerFeignApplication.class, args);
        System.out.println(context.getEnvironment().getProperty("spring.application.name"));
    }
}
```

# 4、定义FeignClient,用与服务调用

```java
//定义接口，增加FeignClient注解，在注解中使用name属性指定调用的具体服务名
@FeignClient(name = "discovery-provider")
public interface RemoteClient {
    
    //此处的请求方式同服务端提供的访问方式相同
    @GetMapping(value = "/echo/{name}")
    String hello(@PathVariable("name") String name);

}
```

# 5.注入4中的FeignClient

调用其hello方法 即可调用远程服务。

![image-20201214124603810](/assets/images/image-20201214124603810.png)