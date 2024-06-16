---
title: 基于JavaAgent的全链路监控（3）
author: 郑天祺
tag:

  - javaagent
category:
  - java基础
date: 2020-07-19 17:25:00

---

# 《利用javaagent进行 JVM内存与GC信息的采集》

# 1、介绍

​		除了监控java方法的执行耗时，我们还需要获取应用实例的jvm内存与gc信息，以实时把控我们的服务器性能是否在安全范围。监控jvm内存与gc信息是非常重要的，尤其是在大促以及微博火热爆点的时候，我们需要根据监控信息进行扩容，以保证系统稳定。

# 2、编码

在---
title: 基于JavaAgent的全链路监控（2）的基础上增加

## （1）MyAgent.java

​		

```java
package cn.edu.bjut.agent;

import com.google.common.util.concurrent.ThreadFactoryBuilder;
import java.util.concurrent.*;

/**
 * @author zhengtianqi
 */
public class MyAgent {

    /**
     * JVM 首先尝试在代理类上调用以下方法
     */
    public static void premain(String agentArgs, Instrumentation inst) {
            // 使用ScheduledExecutorService创建定时任务
        ScheduledExecutorService schedule =
                new ScheduledThreadPoolExecutor(1, new ThreadFactoryBuilder().setNameFormat("scheduled-%d").build());
        // 创建并执行在给定延迟后启用的一次性操作
        schedule.scheduleAtFixedRate(() ->

        {
            // 此方法为打印jvm信息喝gc信息
            JvmStack.printMemoryMetric();
            JvmStack.printGcMetric();
        }, 0L, 1000L, TimeUnit.MILLISECONDS);
     }

    /**
     * 如果代理类没有实现上面的方法，那么 JVM 将尝试调用该方法
     */
    public static void premain(String agentArgs) {
    }
}
```

