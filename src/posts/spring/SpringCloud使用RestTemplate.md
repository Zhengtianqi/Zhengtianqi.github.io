---
title: SpringCloud使用RestTemplate
author: 郑天祺
tag:
  - SpringCloud
category:
  - spring
  
date: 2020-12-14 12:37:00
---

# 1、引入依赖

```java
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

# 2、配置

```java
spring:
  application:
    name: server-discovery-consumer #修改此处为您的应用程序名称
    group: test #部门
    developer:  developer#<负责人姓名>
  cloud:
    nacos:
      discovery:
        server-addr: nacos.com    #Nacos服务地址

server:
  port: 8081

```

3、使用RestTemplate进行服务调用

```java
@Autowired
private NamingService namingService;

@Autowired
private RestTemplate restTemplate;
 
/**
 * 在不使用feign组件时，使用nacos的NamingService配合RestTemplate的实现服务的发现及调用
 */
@RequestMapping(value = "/hello/{name}", method = RequestMethod.GET)
public String echo(@PathVariable String name) {
    try {
        //获取服务实例列表 参数分别为实例名、是否为健康实例
        Instance instance = namingService.selectOneHealthyInstance("server-provider", true);
        String sendUrl = "http://" + instance.getIp() + ":" + instance.getPort() + "/echo/" + name;
        String result = restTemplate.getForObject(sendUrl, String.class);
        //打印log
        return result;
    } catch (NacosException e) {
        e.printStackTrace();
    }
    return null;
}

```

# 4、调用

调用3中的echo方法即可远程调用 discovery-provider 服务的echo方法

![image-20201214124300675](/assets/images/image-20201214124300675.png)