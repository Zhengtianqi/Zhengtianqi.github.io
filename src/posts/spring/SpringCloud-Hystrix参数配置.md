---
title: SpringCloud Hystrix参数配置
author: ztq
tag:
  - SpringCloud
category:
  - spring
  
date: 2020-12-14 11:33:00
---

Hystrix修改默认配置有两种方式，注解参数注入，和application.yml配置文件配置。

# 1、方法一：注解参数注入

```java
    @RequestMapping(value = "/helloHystrixA/{string}", method = RequestMethod.GET)
    @HystrixCommand(fallbackMethod = "testFallback", // 请求失败降级回调方法，值为方法名，不需要括号
        commandProperties = {// 针对单个方法的配置
            @HystrixProperty(name = "circuitBreaker.enabled", value = "true"), // 开启熔断器，可不加默认为true
            @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50"), // 请求错误超过50%，开启熔断器
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10"), // 一个周期(十秒)内超过10个请求才进行进行容错率判断
            @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "10000"),// 开启熔断器后过10秒再尝试访问
        })
    public String helloHystirxA(@PathVariable String string) {
        return "Nacos服务发现：远端调用成功！ result="
            + restTemplate.getForObject("http://nacos.provider.demo/hello/" + string, String.class);

```

# 2、方法二：配置文件

分两步，首先在代码里配置commandKey：

```java
@RequestMapping(value = "/helloHystrixB/{string}", method = RequestMethod.GET)
    @HystrixCommand(commandKey = "testCommand", // 为修饰的方法定义一个 commandKey，不设置默认取方法名为commandKey
        fallbackMethod = "testFallback"// 请求失败降级回调方法，值为方法名，不需要括号
    )
    public String helloHystirxB(@PathVariable String string) {
        return "Nacos服务发现：远端调用成功！ result="
            + restTemplate.getForObject("http://nacos.provider.demo/hello/" + string, String.class);
    }

```

然后在application.yml里配置 commandKey = "testCommand" 对应的配置项：

```java
hystrix:
    command:
        testCommand: #commandKey，配置作用于指定的commandKey
            # ============  常用的熔断器配置  =============
            circuitBreaker:
                enabled: true #默认为true，可不用配置
                errorThresholdPercentage: 50 #一个监测周期（默认10s），请求失败率超过50%开启熔断器
                requestVolumeThreshold: 10 #一个监测周期内，超过10个请求才进行进行容错率判断
                sleepWindowInMilliseconds: 10000 #开启熔断器后过10s再尝试访问，默认5s
            metrics:
                rollingStats:
                    timeInMilliseconds: 10000 #监测周期时长（单位 ms）,默认10000，即10秒
                    numBuckets: 10 #监测周期切分为10个buckets
                         #结合上面的参数就是10秒监测周期 分为10个buckets，每个buckets 1秒；每1秒进行1次监测计算
                         #注意 timeInMilliseconds % numBuckets 必须为0 否则会触发异常
            #============  常用的资源隔离配置 ============
            execution:
                isolation:
                    strategy: THREAD # THREAD：线程隔离， SEMAPHORE：信号量隔离；默认线程隔离
                    thread:
                        timeoutInMilliseconds: 400 #占用线程调用接口的超时时间
                        interruptOnTimeout: true #占用线程超时 是否中断线程的执行
                    timeout:
                        enabled: true #开启超时限制
                    semaphore:
                        maxConcurrentRequests: 20 #信号量隔离下才有效，最大的信号量值，可以理解为 最大支持的并发数
            fallback:
                isolation:
                    semaphore:
                        maxConcurrentRequests: 20 #降级回调方法允许的最大调用

```

注：如果将application.yml中的commandKey设置为default，则会作为全局默认配置，覆盖Hystrix自身的默认配置。