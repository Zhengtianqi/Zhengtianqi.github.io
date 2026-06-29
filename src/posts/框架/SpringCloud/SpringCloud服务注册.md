---
title: SpringCloud服务注册
tag: ["SpringCloud", "服务注册", "微服务"]
category: spring
date: 2020-12-14
---

# SpringCloud服务注册

> Spring是Java生态中最流行的企业级框架，它为企业应用提供了全面的解决方案。
> 本文介绍了Spring框架的核心特性和使用方式，帮助你快速上手企业级开发。


```java
<!-- https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-starter-alibaba-nacos-discovery -->
		<dependency>	
            <groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
		</dependency>

```

# 2、配置文件添加注册服务器地址

在application.yaml配置文件内添加Nacos Server的地址：

```
#应用基本信息配置
spring:
    application:
        name: nacos-provider-demo  #修改此处为您的应用程序名称
        group: test #部门
        developer:  developer #<负责人姓名>
    cloud:
        nacos:
            discovery:
                server-addr: nacos.xt.com    #Nacos服务地址

```

# 3、开启服务发现功能

在启动类添加 Spring Cloud 原生注解 @EnableDiscoveryClient ，开启服务注册发现功能：

```
@SpringBootApplication
@EnableDiscoveryClient
public class NacosProviderDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(NacosProviderDemoApplication.class, args);
    }

}
```

# 4、配置服务接口

```java
@RestController
public class EchoController {

    @RequestMapping(value = "/echo/{string}", method = RequestMethod.GET)
    public String echo(@PathVariable String string) {
        return "Hello Nacos Discovery " + string;
    }

}
```

# 5、确认服务注册结果

运行Nacos-provider-demo，打开Nacos管理服务，可以看到nacos-prodiver-demo已经成功注册。

![image-20201214122255720](/assets/images/image-20201214122255720.png)
