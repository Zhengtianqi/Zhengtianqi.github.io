---
title: SpringCloud服务消费
author: zheng
tag:
  - SpringCloud
category: []
date: 2020-12-14 11:32:00

---

基于Alibaba Nacos Spring Cloud（服务发现）、Spring Cloud OpenFeign（声明式调用，同时整合了熔断器、负载均衡）

# 1、pom.xml添加starter依赖

```java
		<!-- Nacos服务发现 -->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
		</dependency>
        <!-- 声明式调用 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
		<!-- 负载均衡 -->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-ribbon</artifactId>
		</dependency>
		<!-- 熔断器 -->
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
		</dependency>
```

# 2、添加配置文件配置

在application.yaml配置文件内添加Nacos Server的地址，并开启feign的熔断器功能：

```java
#应用基本信息配置
spring:
    application:
        name: nacos-consumer-demo  #修改此处为您的应用程序名称
        group: test #部门
        developer:  developer #<负责人姓名>
    cloud:
        nacos:
            discovery:
                server-addr: nacos.com    #Nacos服务地址
#允许feign开启熔断器，默认未开启
feign:
    hystrix:
        enabled: true

```

# 3、开启服务发现、负载均衡、熔断器功能

在启动类添加 Spring Cloud 原生注解 @EnableDiscoveryClient ，开启服务注册发现功能，添加 @EnableCircuitBreaker 开始熔断器功能：

```java
@SpringBootApplication
@EnableDiscoveryClient   //开启服务发现
@EnableCircuitBreaker    //开始熔断功能
@EnableFeignClients(basePackages = {"com.example"})   //开启Feign客户端，并指定扫描范围
@ComponentScan(basePackages = {"com.example"})
public class NacosFeignDemoApplication {

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(NacosFeignDemoApplication.class, args);
        System.out.println(context.getEnvironment().getProperty("spring.application.name"));
    }
}
```

# 4、创建服务代理类

使用@FeignClient注解声明服务调用的代理类，其中参数含义为：
1.	name：服务提供者注册在服务注册中心的名称；
2.	fallback：使用者提供的断路器实现，必须是当前代理类的实现类；
3.	fallbackFactory：使用者提供的Hystrix的断路器工厂类实现。
注：fallback 与 fallbackFactory 只需要配置一个，建议使用fallbackFactory。 示例如下：

```java
@FeignClient(name = "nacos-provider-demo", fallbackFactory = HystrixClientFallbackFactory.class)
public interface RemoteClient {
    @LoadBalanced
    @GetMapping(value = "/hello")
    String hello();

    @LoadBalanced
    @GetMapping(value = "/hello/{string}")
    String hello(@PathVariable("string") String string);

```

