---
title: SpringCloud运维接口
author: ztq
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:31:00
---

注意：默认端点 path 前面有一级 /actuator ，例如：http://服务地址/actuator/info

```java
Endpoint ID	Description
auditevents	显示应用暴露的审计事件 (比如认证进入、订单失败)
info	显示应用的基本信息
health	显示应用的健康状态
metrics	显示应用的度量信息
metrics/{name}	显示应用指定名称的度量信息，例如：http://localhost:8080/actuator/metrics/system.cpu.count
loggers	显示和修改配置的loggers
logfile	返回log file中的内容(如果logging.file或者logging.path被设置)
httptrace	显示HTTP足迹，最近100个HTTP request/repsponse
env	显示当前的环境特性
env/{name}	显示指定名称的环境信息，例如：http://localhost:8080/actuator/spring.application.name
flyway	显示数据库迁移路径的详细信息
liquidbase	显示Liquibase 数据库迁移的纤细信息
shutdown	让你逐步关闭应用
mappings	显示所有的@RequestMapping路径
scheduledtasks	显示应用中的调度任务
threaddump	执行一个线程dump
heapdump	返回一个GZip压缩的JVM堆dump
```

