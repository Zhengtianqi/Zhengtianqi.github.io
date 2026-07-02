---
title: JVM 线上问题排查：从 jstack/jmap/jstat 到 Arthas 实战
tag: ["JVM", "线上排查", "jstack", "Arthas", "性能诊断"]
category: 基础知识
date: 2026-07-02
---

# JVM 线上问题排查：从 jstack/jmap/jstat 到 Arthas 实战

CPU 飙高但不知道哪个线程？接口偶发卡顿排查不到？内存涨不停但不知道哪里泄漏？线上问题排查是后端工程师的核心能力，这篇覆盖 6 大高频场景。

---

## 一、排查工具箱

### 1.1 JDK 自带工具

```
jps          → 列出 Java 进程
jstat        → GC 统计信息
jstack       → 线程栈 dump
jmap         → 堆 dump + 对象直方图
jcmd         → 多功能诊断（推荐）
jinfo        → 查看/修改 JVM 参数
jhat         → 堆 dump 分析（已过时，用 MAT）
jhsdb        → Java 9+ 堆调试工具
```

### 1.2 Arthas（阿里诊断工具）

```bash
# 安装
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 选择 Java 进程
[arthas@12345]$ dashboard    # 总览
[arthas@12345]$ thread       # 线程
[arthas@12345]$ jad          # 反编译
[arthas@12345]$ watch        # 方法执行观测
[arthas@12345]$ trace        # 方法调用链路
[arthas@12345]$ profiler     # 火焰图
```

---

## 二、场景一：CPU 100% 排查

### 2.1 排查链路

```
top → 找到 CPU 高的 Java 进程 PID
top -Hp <PID> → 找到 CPU 高的线程 TID
printf "%x\n" <TID> → 转为十六进制
jstack <PID> | grep <hex_TID> → 定位线程栈
```

### 2.2 实战演示

```bash
# 1. top 找到 Java 进程
top
#   PID  USER   %CPU  COMMAND
#   12345 app    185%  java -jar order-service.jar

# 2. top -Hp 找到高 CPU 线程
top -Hp 12345
#   PID    USER  %CPU  COMMAND
#   12378  app    98%   java -jar order-service.jar

# 3. 线程 ID 转十六进制
printf "%x\n" 12378
#   305a

# 4. jstack 定位
jstack 12345 | grep "0x305a" -A 30
```

### 2.3 常见根因

```
1. 死循环 / 无限循环
   "http-nio-8080-exec-3" #45 daemon prio=5
   at com.order.service.OrderService.process(OrderService.java:128)
   → 检查循环条件

2. 频繁 GC
   "GC task thread#0" prio=5
   → jstat -gc 看 GC 频率，调优 JVM

3. 正则回溯
   at java.util.regex.Pattern$Curly.match0(Pattern.java:4274)
   → 正则优化或预编译

4. 序列化大对象
   at com.fasterxml.jackson.databind.ser.BeanSerializer.serialize
   → 避免序列化大对象，用分页
```

### 2.4 Arthas 方式

```bash
[arthas@12345]$ thread -n 3
# 显示 CPU 占用最高的 3 个线程
# NAME           CPU%  STATE    THREAD_ID
# http-nio-8080  98.5  RUNNABLE 45
# GC task thread 45.2  RUNNABLE 2
# ...

[arthas@12345]$ thread 45
# 查看线程 45 的完整栈
```

---

## 三、场景二：内存泄漏排查

### 3.1 发现内存泄漏

```bash
# 1. jstat 监控堆使用趋势
jstat -gc <pid> 5000
#  每 5 秒打印一次，观察 Old Gen 是否持续增长且不下降
#  OU（Old Used）持续增长 → Major GC 后 OU 不降 → 内存泄漏

# 2. jmap 看对象直方图
jmap -histo:live <pid> | head -30

# num     #instances         #bytes  class name (module)
#-------------------------------------------------------
#    1:       1523678      122145432  byte[] (java.base@17)
#    2:        856432       54811712  com.order.entity.OrderItem
#    3:        456789       32732088  java.lang.String
#    4:        123456       19752960  java.util.HashMap$Node

# OrderItem 实例数异常多 → 疑似泄漏
```

### 3.2 Dump 堆内存

```bash
# 方式 1：jmap dump
jmap -dump:format=b,file=/data/dumps/heap.hprof <pid>

# 方式 2：jcmd dump（推荐，更稳定）
jcmd <pid> GC.heap_dump /data/dumps/heap.hprof

# 方式 3：OOM 自动 dump（提前配置）
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/

# 方式 4：Arthas dump
[arthas@12345]$ heapdump /data/dumps/heap.hprof
```

### 3.3 MAT 分析

```
MAT（Memory Analyzer Tool）分析步骤：

1. 打开 heap.hprof
2. 查看 Leak Suspects 报告
   → 自动识别疑似泄漏点
3. Dominator Tree
   → 按对象持有内存大小排序，找最大的
4. Path to GC Roots
   → 看对象为什么不被回收（谁引用了它）
5. OQL 查询
   → SELECT * FROM com.order.entity.OrderItem WHERE _amount > 10000

常见泄漏模式：
  ① ThreadLocal 未清理 → 线程池中线程复用，ThreadLocal 一直引用
  ② 静态集合无限增长 → static Map/List 只 put 不 remove
  ③ 监听器未注销 → 事件源一直持有监听器引用
  ④ 缓存无淘汰策略 → 自建缓存无 LRU/TTL
  ⑤ 连接未关闭 → 数据库连接/HTTP 连接泄漏
```

### 3.4 Arthas 在线分析

```bash
# 查看对象数量
[arthas@12345]$ ognl '@java.lang.management.ManagementFactory@getRuntimeMXBean()'

# 监控方法创建的对象
[arthas@12345]$ watch com.order.service.OrderService createOrder \
  '@java.util.concurrent.atomic.AtomicLong@getAndIncrement()' -x 2

# 查看某个类的实例数
[arthas@12345]$ vmtool --action getInstances --className java.util.HashMap --limit 10
```

---

## 四、场景三：接口响应慢排查

### 4.1 分层排查

```
接口慢的 6 大原因：
  ① 数据库慢查询
  ② 外部调用超时（HTTP/RPC）
  ③ 锁竞争
  ④ GC 停顿
  ⑤ 序列化大对象
  ⑥ 线程池排队
```

### 4.2 Arthas trace 链路追踪

```bash
# trace 方法内部调用链路，看每一步耗时
[arthas@12345]$ trace com.order.controller.OrderController getOrder '*'
# ---ts=2024-07-02 10:30:00---thread=http-nio-8080-exec-1
# com.order.controller.OrderController:getOrder() [2.5ms]
# ├─── com.order.service.OrderService:findById() [2.1ms]
# │    ├─── com.order.mapper.OrderMapper:selectById() [1.8ms]  ← 数据库慢
# │    └─── com.order.service.UserService:getUserName() [0.3ms]
# └─── com.order.util.ResponseUtil:build() [0.1ms]

# 发现 findById 内部 selectById 耗时 1.8ms
# 继续深入 trace
[arthas@12345]$ trace com.order.mapper.OrderMapper selectById '*'
```

### 4.3 watch 方法观测

```bash
# 观测方法入参、返回值、耗时
[arthas@12345]$ watch com.order.service.OrderService findById \
  '{params, returnObj, #cost}' -x 2 -n 5
# 打印 5 次：
# method=com.order.service.OrderService.findById cost=2.1ms
# params=[Ljava.lang.Object;[order123]
# returnObj=Order{id='order123', amount=500.0}

# 条件过滤：只看耗时 > 100ms 的调用
[arthas@12345]$ watch com.order.service.OrderService findById \
  '{params, returnObj, #cost}' '#cost > 100' -x 2
```

### 4.4 profiler 火焰图

```bash
# 生成 CPU 火焰图，定位热点方法
[arthas@12345]$ profiler start
# 等待 30 秒
[arthas@12345]$ profiler stop --format html
# 生成 flamegraph.html，浏览器打开

# 火焰图怎么看：
# - 横轴：CPU 占用时间
# - 纵轴：调用栈深度
# - 越宽的函数 = CPU 占用越多 = 优化目标
```

---

## 五、场景四：死锁排查

### 5.1 jstack 检测死锁

```bash
jstack <pid> | grep -A 5 "Found .* deadlock"
```

```
输出示例：
Found one Java-level deadlock:
=============================
"http-nio-8080-exec-1":
  waiting to lock monitor 0x00007f8b0c006238 (object 0x000000076b4a3e28, a java.lang.Object),
  which is held by "http-nio-8080-exec-2"
"http-nio-8080-exec-2":
  waiting to lock monitor 0x00007f8b0c005ed8 (object 0x000000076b4a3e18, a java.lang.Object),
  which is held by "http-nio-8080-exec-1"

Java stack information for the threads listed above:
===================================================
"http-nio-8080-exec-1":
  at com.order.service.OrderService.transfer(OrderService.java:45)
  - waiting to lock <0x000000076b4a3e28> (a java.lang.Object)
  - locked <0x000000076b4a3e18> (a java.lang.Object)
"http-nio-8080-exec-2":
  at com.order.service.OrderService.transfer(OrderService.java:50)
  - waiting to lock <0x000000076b4a3e18> (a java.lang.Object)
  - locked <0x000000076b4a3e28> (a java.lang.Object)
```

### 5.2 Arthas 检测死锁

```bash
[arthas@12345]$ thread -b
# 查找阻塞其他线程的线程（死锁根因）
# "http-nio-8080-exec-2" Id=45 BLOCKED
#   at com.order.service.OrderService.transfer(OrderService.java:50)
#   - waiting to lock <0x000000076b4a3e18> ...
#   - locked <0x000000076b4a3e28> ...
```

### 5.3 死锁修复模式

```java
// 问题代码：加锁顺序不一致
class OrderService {
    public void transfer(Account from, Account to, BigDecimal amount) {
        synchronized (from) {          // 线程1: lock A → lock B
            synchronized (to) {        // 线程2: lock B → lock A → 死锁
                from.debit(amount);
                to.credit(amount);
            }
        }
    }
}

// 修复 1：统一加锁顺序（按 ID 排序）
class OrderService {
    public void transfer(Account from, Account to, BigDecimal amount) {
        Account first = from.getId() < to.getId() ? from : to;
        Account second = from.getId() < to.getId() ? to : from;
        synchronized (first) {
            synchronized (second) {
                from.debit(amount);
                to.credit(amount);
            }
        }
    }
}

// 修复 2：使用 tryLock + 超时
class OrderService {
    public void transfer(Account from, Account to, BigDecimal amount) {
        while (true) {
            if (from.getLock().tryLock(1, TimeUnit.SECONDS)) {
                try {
                    if (to.getLock().tryLock(1, TimeUnit.SECONDS)) {
                        try {
                            from.debit(amount);
                            to.credit(amount);
                            return;
                        } finally {
                            to.getLock().unlock();
                        }
                    }
                } finally {
                    from.getLock().unlock();
                }
            }
        }
    }
}
```

---

## 六、场景五：类加载冲突排查

### 6.1 问题现象

```
java.lang.NoSuchMethodError: com.google.gson.JsonElement.getAsInt()
或
java.lang.ClassCastException: com.xxx.Order cannot be cast to com.xxx.Order
（同一个类被不同 ClassLoader 加载）
```

### 6.2 Arthas 排查

```bash
# 查看类加载器
[arthas@12345]$ classloader
# name                                      numberOfInstances  loadedCountTotal
# sun.misc.Launcher$AppClassLoader          1                  3456
# org.springframework.boot.devtools.restart 1                  1234
# TomcatEmbeddedWebappClassLoader           2                  5678

# 查看类来自哪个 jar
[arthas@12345]$ sc -d com.google.gson.JsonElement
# class-info        com.google.gson.JsonElement
# class-loader      sun.misc.Launcher$AppClassLoader@5e91993f
# classFile         /usr/local/tomcat/webapps/app/WEB-INF/lib/gson-2.8.0.jar

# 查看方法是否存在
[arthas@12345]$ sm com.google.gson.JsonElement getAsInt
# com.google.gson.JsonElement#getAsInt()

# 反编译确认
[arthas@12345]$ jad com.google.gson.JsonElement
```

### 6.3 Maven 依赖冲突

```bash
# Maven 依赖树
mvn dependency:tree -Dincludes=com.google.code.gson:gson
# [INFO] +- com.example:order:jar:1.0.0
# [INFO] |  +- com.google.code.gson:gson:jar:2.8.0:compile
# [INFO] |  +- com.xxx:lib:jar:1.2.0:compile
# [INFO] |  |  \- com.google.code.gson:gson:jar:2.5:compile  ← 冲突！

# 解决：排除旧版本
<dependency>
    <groupId>com.xxx</groupId>
    <artifactId>lib</artifactId>
    <version>1.2.0</version>
    <exclusions>
        <exclusion>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

---

## 七、场景六：频繁 Full GC 排查

### 7.1 排查步骤

```bash
# 1. 观察 GC 趋势
jstat -gc <pid> 1000 60
# 每秒打印，持续 60 秒，关注：
# - OU（Old Used）是否持续增长
# - FGC（Full GC 次数）是否增长
# - FGCT（Full GC 时间）累计

# 2. 确认 Full GC 原因
jcmd <pid> GC.heap_info
#  G1 Heap:
#   regions = 2048
#   capacity = 4294967296 (4096.0MB)
#   used     = 3892314112 (3712.0MB)  ← 使用率 90%+ → 老年代不足
#  ...

# 3. 查看 GC 日志
tail -100 /var/log/gc.log | grep "Full GC"
# [10.345s][info][gc] GC(15) Pause Full (G1 Compaction Pause) 3.8G->3.5G(4G) 2.345s
# Full GC 后堆使用从 3.8G 降到 3.5G → 回收不多 → 内存泄漏或大对象
```

### 7.2 常见原因与修复

```
原因 1：老年代不足
  现象：Full GC 后 OU 大幅下降
  修复：增大堆或降低 IHOP

原因 2：内存泄漏
  现象：Full GC 后 OU 几乎不降
  修复：dump + MAT 分析

原因 3：大对象直接进老年代
  现象：大对象分配日志
  修复：增大 G1HeapRegionSize

原因 4：Metaspace 不足
  现象：Full GC (Metadata GC Threshold)
  修复：-XX:MaxMetaspaceSize=512m

原因 5：System.gc()
  现象：Full GC (System.gc())
  修复：-XX:+DisableExplicitGC

原因 6：Concurrent Mode Failure（CMS）
  现象：Full GC (Concurrent Mode Failure)
  修复：降低 CMSInitiatingOccupancyFraction
```

---

## 八、Arthas 高级技巧

### 8.1 热更新代码

```bash
# 1. 反编译类
[arthas@12345]$ jad --source-only com.order.service.OrderService > OrderService.java

# 2. 修改代码（vim 编辑）

# 3. 编译
[arthas@12345]$ mc /tmp/OrderService.java -d /tmp

# 4. 热加载
[arthas@12345]$ redefine /tmp/com/order/service/OrderService.class
# 线上热修复，不需要重启应用！
```

### 8.2 动态修改日志级别

```bash
# 查看当前日志级别
[arthas@12345]$ ognl '@org.slf4j.LoggerFactory@getLogger("com.order").getLevel()'

# 修改为 DEBUG
[arthas@12345]$ ognl '@org.slf4j.LoggerFactory@getLogger("com.order").setLevel(@ch.qos.logback.classic.Level@DEBUG)'
```

### 8.3 监控方法执行成功率

```bash
# 监控方法调用，统计成功/失败次数
[arthas@12345]$ monitor com.order.service.OrderService createOrder -c 10
# period=10秒
# timestamp            class                            method       total  success  fail  rt(ms)
# 2024-07-02 10:30:10  OrderService                     createOrder  100    98       2     45.2
```

---

## 九、排查工具速查表

| 场景 | 命令 | 工具 |
|------|------|------|
| CPU 高 | `top -Hp <pid>` + `jstack` | top/jstack/Arthas |
| 内存泄漏 | `jmap -histo` + dump + MAT | jmap/MAT/Arthas |
| 接口慢 | `trace` + `watch` | Arthas |
| 死锁 | `jstack` + `thread -b` | jstack/Arthas |
| 类冲突 | `sc -d` + `jad` | Arthas |
| Full GC | `jstat -gc` + GC 日志 | jstat/GCEasy |
| 线程阻塞 | `thread` + `thread <id>` | Arthas |
| 火焰图 | `profiler start/stop` | Arthas/async-profiler |

---

## 十、面试要点

### Q：线上 CPU 突然 100% 怎么排查？

1. `top` 找到 CPU 高的 Java 进程 PID
2. `top -Hp <PID>` 找到 CPU 高的线程 TID
3. `printf "%x\n" <TID>` 转十六进制
4. `jstack <PID> | grep <hex_TID>` 定位线程栈
5. 分析代码：死循环、频繁 GC、正则回溯、序列化
6. Arthas `thread -n 3` 快速定位

### Q：内存泄漏怎么排查？

1. `jstat -gc` 观察老年代是否持续增长不下降
2. `jmap -histo:live` 看对象数量 Top
3. `jmap -dump` 导出堆 dump
4. MAT 打开 dump，看 Leak Suspects + Dominator Tree
5. Path to GC Roots 找到引用链
6. 常见原因：ThreadLocal 未清理、静态集合无限增长、连接未关闭

### Q：Arthas 的 trace 和 watch 有什么区别？

trace：追踪方法内部所有子调用的耗时，看"时间花在哪了"。
watch：观测方法入参、返回值、异常、耗时，看"方法执行了什么"。
组合使用：先 trace 定位慢的子调用，再 watch 查看具体参数和返回值。

---

## 十一、总结

线上排查六步法：

1. **CPU 高**：top → top -Hp → jstack → 定位线程栈
2. **内存泄漏**：jstat → jmap → dump → MAT 分析
3. **接口慢**：Arthas trace → 定位慢调用 → watch 看参数
4. **死锁**：jstack → thread -b → 统一加锁顺序
5. **类冲突**：Arthas sc/jad → Maven 依赖树 → 排除冲突
6. **Full GC**：jstat → GC 日志 → 按原因分类修复

记住：**Arthas 是线上排查神器，trace 定位耗时，watch 观测参数，thread 找阻塞，profiler 画火焰图**。
