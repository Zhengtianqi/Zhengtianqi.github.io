---
title: SpringCloud Ribbon参数配置
author: zheng
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:33:00
---

# Ribbon策略类型

![image-20201214123508379](/assets/images/image-20201214123508379.png)

Ribbon负载均衡策略为轮询，如果要修改默认策略 ，有两种方法，分别是创建配置类，和配置application.yml。

# 方法一：创建配置类

```java
 @Configuration  
public class MyRibbonConfig {
    @Bean
    public IRule ribbonRule() {
        //随机策略
        return new RandomRule();
    }
}
然后在启动类上加注解：
@RibbonClient(name = "nacos.provider.demo", configuration = MyRibbonConfig.class)  //name为服务提供者名称

```

# 方法二：配置文件

无须任何配置类和代码，只需要在在application.yml中添加配置：

```java
#针对单个服务配置路由规则，注意 配置的值 需要类全名（包名+类名）；
nacos.config.demo: #目标服务提供名称
    ribbon:
        ConnectionTimeout: 400 #链接超时
        ReadTimeout: 400 #读取超时
        MaxAutoRetries: 1 #重试当前实例的次数
        MaxAutoRetriesNextServer: 1 #服务实例切换重试次数
        ServerListRefreshInterval: 30000 #刷新所服务列表间隔时间
        NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule #配置对应的规则，其他ribbon自带的规则 可查看IRule接口的实现类
```

