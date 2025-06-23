---
title: SpringCloud服务构建
author: ztq
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:30:00
---

# 1、添加依赖

建议使用官方提供的在线地址进行工程的初始化创建：https://start.spring.io

添加Spring Cloud和Spring Cloud Alibaba依赖管理：
	

```java
<properties>
		<java.version>1.8</java.version>
		<spring-cloud.version>Greenwich.SR3</spring-cloud.version>
		<spring-cloud-alibaba.version>0.9.0.RELEASE</spring-cloud-alibaba.version>
</properties>
	<dependencyManagement>
		<dependencies>
			<!--Spring Cloud -->
			<dependency>
				<groupId>org.springframework.cloud</groupId>
				<artifactId>spring-cloud-dependencies</artifactId>
				<version>${spring-cloud.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
			<!--Spring Cloud Alibaba -->
			<dependency>
				<groupId>org.springframework.cloud</groupId>
				<artifactId>spring-cloud-alibaba-dependencies</artifactId>
				<version>${spring-cloud-alibaba.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>
```

注意：spring-cloud-alibaba的0.2.x.RELEASE及0.9.0.RELEASE对应于Spring Boot 2.x版本，不能使用0.1.x.RELEASE版本。

# 2、application.yml配置

注意：每一级退格必须为两个或四个空格，同一级节点需要左对齐，且不能使用制表符TAB。

```java
# 服务端口配置（必填）
server:  
    port: 8080
# 应用基本信息配置（必填）
spring:
    application:
        name: app #修改此处为您的应用程序名称
        group: base #部门
        developer:  developer #<负责人姓名>
# 健康检查通用配置（必填）
management:
    port: 8080  #actuator端口，保持与tomcat端口一致
    endpoints:
        web:
          exposure:
            include: "*"  #打开所有端点，默认是never
    endpoint:
        health:
            show-details: always #显示health的明细内容，默认是never
# 应用定制信息（选填），以info起始，后面的路径和内容能开发人员完全自定义，该信息可由actuator/info请求获取
info:
    interface:
        list: 
            - hello
            - actuator/health
            - actuator/info
    app:
        desc: 这是一条描述信息
```

