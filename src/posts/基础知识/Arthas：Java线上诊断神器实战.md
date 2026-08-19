---
title: Arthas：Java线上诊断神器实战
date: 2026-08-19
category: 基础知识
tag: ["Arthas", "诊断", "性能分析", "线上排查"]
---

# Arthas：Java线上诊断神器实战

> Arthas是阿里巴巴开源的Java诊断工具，支持在线排查问题、性能分析、类热更新等，是生产环境必备的诊断利器。
> 本文系统介绍Arthas的核心功能和实战案例，帮助你快速定位和解决线上问题。

## 一、Arthas简介

### 1.1 核心能力

| 功能 | 说明 |
|------|------|
| 实时监控 | 方法执行耗时、调用次数 |
| 堆栈追踪 | 查看方法调用链路 |
| 反编译 | 动态查看class源码 |
| 类热更新 | 运行时修改class |
| 线程分析 | 死锁检测、线程状态 |
| 内存分析 | 堆转储、对象统计 |
| OGNL表达式 | 运行时执行任意代码 |

### 1.2 安装与启动

```bash
# 方式1：直接下载
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 方式2：使用as.sh (Linux/Mac)
curl -L https://arthas.aliyun.com/install.sh | sh

# 方式3：Docker环境
docker exec -it <container-id> java -jar /path/to/arthas-boot.jar
```

## 二、基础命令详解

### 2.1 进程选择

```bash
# 启动Arthas后会列出Java进程
$ java -jar arthas-boot.jar
* [1]: 12345 com.example.Application
  [2]: 12346 com.example.Service

# 选择进程ID
$ 1
```

### 2.2 dashboard - 仪表盘

```bash
$ dashboard

ID   NAME                          STATE    PRIORITY  %CPU  TIME
1    main                          RUNNABLE 5         45    1200ms
22   http-nio-8080-exec-1          WAITING  5         0     100ms
23   http-nio-8080-exec-2          WAITING  5         0     80ms

Memory:
  Eden Space    256MB   45%   115MB
  Old Gen       512MB   60%   307MB
  Survivor      64MB    30%   19MB

GC:
  G1 Young GC   15      200ms
  G1 Mixed GC   2       150ms
```

### 2.3 thread - 线程分析

```bash
# 查看所有线程
$ thread

# 查看CPU使用最高的线程
$ thread -n 3

# 查看指定线程堆栈
$ thread 22

# 检测死锁
$ thread -b
Found one Java-level deadlock:
=============================
"thread-1":
  waiting to lock monitor 0x00007f8b5c003b18 (object 0x00000007aab9e540, a java.lang.Object),
  which is held by "thread-2"
"thread-2":
  waiting to lock monitor 0x00007f8b5c006288 (object 0x00000007aab9e550, a java.lang.Object),
  which is held by "thread-1"

# 查看线程状态统计
$ thread --state RUNNABLE
```

### 2.4 watch - 方法监控

```bash
# 查看方法入参和返回值
$ watch com.example.UserService getUser '{params, returnObj}' -x 2

# 查看方法异常
$ watch com.example.UserService getUser '{params, throwExp}' -e

# 查看方法执行耗时
$ watch com.example.UserService getUser '{params, returnObj, #cost}' -x 2

# 过滤条件：只看耗时>100ms的调用
$ watch com.example.UserService getUser '{params, returnObj, #cost}' '#cost > 100'

# 查看方法调用栈
$ watch com.example.UserService getUser '{params, target, clazz, method}' -x 2
```

### 2.5 trace - 调用追踪

```bash
# 追踪方法调用链路
$ trace com.example.OrderService createOrder

`---ts=2026-08-22 10:00:00;thread_name=http-nio-8080-exec-1
    +---[3ms] com.example.OrderService.createOrder()
    +---[15ms] com.example.UserService.getUser()
    +---[8ms] com.example.ProductService.checkStock()
    +---[120ms] com.example.OrderMapper.insert()

# 只显示耗时>10ms的方法
$ trace com.example.OrderService createOrder '#cost > 10'
```

### 2.6 stack - 调用栈

```bash
# 查看方法调用栈
$ stack com.example.UserService getUser

ts=2026-08-22 10:00:00;thread_name=http-nio-8080-exec-1;
    @com.example.controller.UserController.getUser()
    at com.example.service.UserService.getUser()
    at com.example.service.impl.UserServiceImpl.getUser()
```

### 2.7 jad - 反编译

```bash
# 反编译整个类
$ jad com.example.UserService

# 反编译指定方法
$ jad com.example.UserService getUser

# 只显示源代码
$ jad --source-only com.example.UserService
```

### 2.8 sc - 类搜索

```bash
# 搜索类
$ sc com.example.*Service

# 查看类加载信息
$ sc -d com.example.UserService

# 搜索实现了某个接口的类
$ sc -d implements com.example.UserService
```

### 2.9 sm - 方法搜索

```bash
# 搜索方法
$ sm com.example.UserService

# 查看方法详情
$ sm -d com.example.UserService getUser
```

## 三、高级功能

### 3.1 OGNL表达式

```bash
# 执行静态方法
$ ognl '@java.lang.System@out.println("hello")'

# 调用对象方法
$ ognl '#obj=@com.example.Application@getContext().getBean("userService"), #obj.getUser(1)'

# 查看系统属性
$ ognl '@System@getProperty("java.version")'

# 修改字段值
$ ognl '#obj=@com.example.Application@getContext().getBean("configService"), #obj.setDebugMode(true)'
```

### 3.2 类热更新

```bash
# 1. 反编译并修改源码
$ jad --source-only com.example.UserService > UserService.java
# 修改 UserService.java

# 2. 编译修改后的class
$ mc /path/to/UserService.java -d /tmp

# 3. 热更新
$ redefine /tmp/com/example/UserService.class

# 注意：
# - 只能修改方法体，不能增删字段/方法
# - 需要开启调试模式
```

### 3.3 堆转储

```bash
# 生成堆转储文件
$ heapdump /tmp/heap.hprof

# 只dump存活对象
$ heapdump --live /tmp/heap.hprof

# 使用MAT分析
# 下载 Eclipse MAT: https:// eclipse.org/mat/
```

### 3.4 WebSocket连接

```bash
# Arthas支持WebSocket连接
# 可以在浏览器中使用Arthas Tunnel Server

# 启动Tunnel Server
java -jar arthas-tunnel-server.jar

# 客户端连接
java -jar arthas-boot.jar --tunnel-server 'ws://127.0.0.1:7777/ws'
```

## 四、实战案例

### 4.1 案例：接口响应慢

**问题：** 用户反馈订单查询接口响应慢

```bash
# 1. 监控方法耗时
$ watch com.example.OrderService queryOrder '{params, returnObj, #cost}' -x 2

# 输出：
# [cost: 1523.45ms] params: [12345], returnObj: Order{...}

# 2. 追踪调用链路
$ trace com.example.OrderService queryOrder

`---ts=2026-08-22 10:00:00
    +---[5ms] com.example.OrderService.queryOrder()
    +---[1500ms] com.example.OrderMapper.selectById()
    +---[8ms] com.example.OrderConverter.toVO()

# 3. 分析SQL
# 发现OrderMapper.selectById()耗时1500ms
# 检查SQL执行计划，发现缺少索引

# 4. 解决方案
# 添加索引: CREATE INDEX idx_order_id ON orders(id)
```

### 4.2 案例：内存泄漏

**问题：** 应用内存持续增长，频繁Full GC

```bash
# 1. 查看内存使用
$ dashboard

Memory:
  Old Gen 512MB 95% 486MB  # 老年代使用率过高

# 2. 查看对象统计
$ heapdump /tmp/heap.hprof

# 3. 使用MAT分析
# 找到Memory Leak Suspects
# 查看Dominator Tree

# 4. 发现问题
# 大量com.example.entity.CacheEntry对象未释放
# 原因：本地缓存未设置过期策略

# 5. 解决方案
# 使用Caffeine代替HashMap，设置TTL和最大容量
```

### 4.3 案例：死锁排查

**问题：** 应用卡住，无法处理请求

```bash
# 1. 检测死锁
$ thread -b

Found one Java-level deadlock:
=============================
"thread-1":
  waiting to lock monitor 0x00007f8b5c003b18
"thread-2":
  waiting to lock monitor 0x00007f8b5c006288

# 2. 查看线程堆栈
$ thread 22

"thread-2" #22 prio=5 os_prio=0 tid=0x00007f8b5c012800 nid=0x5c11 waiting
   java.lang.Thread.State: BLOCKED (on object monitor)
    at com.example.service.OrderService.createOrder(OrderService.java:50)
    - waiting to lock <0x00000007aab9e540> (a java.lang.Object)
    - locked <0x00000007aab9e550> (a java.lang.Object)

# 3. 分析原因
# OrderService.createOrder() 持有锁A，等待锁B
# UserService.getUser() 持有锁B，等待锁A

# 4. 解决方案
# 统一加锁顺序：都先锁Order，再锁User
```

### 4.4 案例：线程池满

**问题：** 请求排队严重，线程池满载

```bash
# 1. 查看线程状态
$ thread --state RUNNABLE | wc -l
50  # 所有线程都在运行

$ thread --state WAITING | wc -l
100  # 大量线程在等待

# 2. 查看线程池配置
$ ognl '#ctx=@com.example.Application@getContext(), #pool=#ctx.getBean("threadPool"), {"coreSize:"+#pool.corePoolSize, "maxSize:"+#pool.maximumPoolSize, "queueSize:"+#pool.queue.size()}'

# 输出：
# coreSize: 10, maxSize: 50, queueSize: 200

# 3. 分析原因
# 线程池配置不合理，核心线程数太小
# 大量任务排队等待

# 4. 解决方案
# 调整线程池参数
# 核心线程数 = CPU核数 * 2
```

## 五、常用脚本

### 5.1 性能分析脚本

```bash
#!/bin/bash
# perf.sh - 性能分析脚本

PID=$1

echo "=== 线程状态统计 ==="
jstack $PID | grep java.lang.Thread.State | sort | uniq -c

echo "=== CPU使用最高的线程 ==="
top -Hp $PID -b -n 1 | head -20

echo "=== GC情况 ==="
jstat -gcutil $PID 1000 5
```

### 5.2 诊断脚本

```bash
#!/bin/bash
# diagnose.sh - 快速诊断脚本

PID=$1
OUTPUT="/tmp/diagnose_$(date +%Y%m%d_%H%M%S)"

mkdir -p $OUTPUT

# 线程堆栈
jstack $PID > $OUTPUT/thread_dump.txt

# 堆信息
jmap -heap $PID > $OUTPUT/heap_info.txt

# GC统计
jstat -gcutil $PID 1000 10 > $OUTPUT/gc_stat.txt

# 生成堆转储
jmap -dump:live,format=b,file=$OUTPUT/heap.hprof $PID

echo "诊断完成，结果保存在: $OUTPUT"
```

## 六、最佳实践

### 6.1 日常巡检

```bash
# 每日巡检清单
1. dashboard  # 查看整体状态
2. thread -n 5  # 检查CPU使用最高的线程
3. jstat -gcutil  # 检查GC情况
4. thread -b  # 检测死锁
```

### 6.2 问题排查流程

```
问题排查流程：

1. 确认现象
   ├─ 响应慢 → watch/trace
   ├─ 内存高 → heapdump
   ├─ CPU高 → thread -n
   └─ 请求失败 → watch -e

2. 收集信息
   ├─ 日志分析
   ├─ 监控指标
   └─ Arthas诊断

3. 定位原因
   ├─ 代码问题
   ├─ 配置问题
   ├─ 资源问题
   └─ 依赖问题

4. 解决问题
   ├─ 代码修复
   ├─ 配置调整
   ├─ 资源扩容
   └─ 依赖升级
```

### 6.3 注意事项

| 注意点 | 说明 |
|--------|------|
| 生产环境谨慎 | 使用watch/trace时注意性能影响 |
| 权限控制 | 限制Arthas访问权限 |
| 日志记录 | 诊断操作记录到审计日志 |
| 临时使用 | 诊断完成后及时退出 |
| 测试验证 | 修改代码后先测试再上线 |
