---
title: SpringCloud使用Feign+Ribbon+Hystrix
author: zheng
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 12:39:00
---

# 1、引入依赖

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
</dependency>
```

# 2、增加相关配置

```
spring:
  application:
    name: server-consumer-feign-hystrix #修改此处为您的应用程序名称
    group: test #部门
    developer: developer  #<负责人姓名>
  cloud:
    nacos:
      discovery:
        server-addr: nacos.com    #Nacos服务地址
  main:
    allow-bean-definition-overriding: true
#允许feign开启熔断器，默认未开启
feign:
  hystrix:
    enabled: true
management:
  endpoints:
    web:
      exposure:
        include: "*"  #打开所有端点，默认是info,health
  endpoint:
    health:
      show-details: always #显示health的明细内容，默认是never
server:
  port: 8086
```

# 3、增加FeignClient

```java
@FeignClient(name = "discovery-provider", fallbackFactory = HystrixClientFallbackFactory.class)
public interface RemoteClient {

    @LoadBalanced
    @GetMapping(value = "/echo/{name}")
    String hello(@PathVariable("name") String name);
}
```

# 4、修改默认的负载均衡规则

```java
@Configuration
public class AppointRibbonMetric {
    @Bean
    public IRule ribbonRule(){
       //此处的RoundRobinRule()为轮询方式的负载均衡
       return new RoundRobinRule();
    }
}
```

# 5、增加对应方法的Hystrix配置

```java
@Component
public class HystrixClientFallbackFactory implements FallbackFactory<RemoteClient> {

    @Override
    public RemoteClient create(Throwable throwable) {
       return (name)-> "请求失败. name=" + name;
    }
}
```

# 6、使用效果如下

## 1）.启动两个服务端，端口分别为8080，8090

![image-20201214125402694](/assets/images/image-20201214125402694.png)

## 2）.启动服务消费端，多次调用对应的服务

![image-20201214125453643](/assets/images/image-20201214125453643.png)

![image-20201214125504552](/assets/images/image-20201214125504552.png)

由上方两张图可见，在每次调用时，均会路由到不同端口的实例上。

## 3）. 关掉两个服务端实例

![image-20201214125529023](/assets/images/image-20201214125529023.png)

再次访问时返回了对应fallback中的返回值。