---
title: OOM 排查实战：五种 OOM 类型的根因分析与修复
tag: ["OOM", "JVM", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# OOM 排查实战：五种 OOM 类型的根因分析与修复

> OOM 排查实战：五种 OOM 类型的根因分析与修复是一个重要的技术主题，它在现代软件开发中扮演着关键角色。
> 本文系统介绍了OOM 排查实战：五种 OOM 类型的根因分析与修复的核心概念和实践经验，帮助你深入理解这一技术领域。


`java.lang.OutOfMemoryError` 不是只有 `Java heap space` 一种。不同 OOM 类型对应不同根因，排查方向完全不同。

## 一、五种 OOM 类型速查

| OOM 类型 | 报错信息 | 根因 | 紧急度 |
|---------|---------|------|--------|
| 堆内存溢出 | Java heap space | 内存泄漏/大对象 | ⭐⭐⭐⭐⭐ |
| 元空间溢出 | Metaspace | 动态代理/类加载器泄漏 | ⭐⭐⭐⭐ |
| 直接内存溢出 | Direct buffer memory | NIO/Netty 堆外内存泄漏 | ⭐⭐⭐⭐ |
| 线程数耗尽 | unable to create new native thread | 线程泄漏/线程池配置不当 | ⭐⭐⭐⭐⭐ |
| GC 开销超限 | GC overhead limit exceeded | GC 回收效率极低 | ⭐⭐⭐ |

## 二、Java Heap Space（堆内存溢出）

### 2.1 典型报错

```
java.lang.OutOfMemoryError: Java heap space
    at com.example.service.OrderService.batchImport(OrderService.java:128)
```

### 2.2 排查步骤

```bash
# 1. 确认 OOM 时有 dump 文件（前提是启动时配了 -XX:+HeapDumpOnOutOfMemoryError）
ls -la /tmp/heapdump/

# 2. 如果没有 dump，尝试 jmap（进程还活着的话）
jcmd <pid> GC.heap_dump /tmp/heap_oom.hprof

# 3. 用 MAT 分析 dump 文件
# 重点关注：Leak Suspects Report → 支配树（Dominator Tree）
# 找到占用内存最大的对象及其 GC Root 引用链
```

### 2.3 常见根因与修复

```java
// 根因1：批量查询未分页
List<Order> all = orderMapper.selectAll(); // 100万条直接加载
// 修复：分页处理
int page = 1;
while (true) {
    List<Order> batch = orderMapper.selectPage(page, 1000);
    if (batch.isEmpty()) break;
    process(batch);
    page++;
}

// 根因2：缓存无淘汰策略
Map<String, byte[]> cache = new ConcurrentHashMap<>();
// 修复：使用 Caffeine
Cache<String, byte[]> cache = Caffeine.newBuilder()
    .maximumSize(10000)
    .expireAfterWrite(30, TimeUnit.MINUTES)
    .build();

// 根因3：大文件一次性读取
byte[] data = Files.readAllBytes(path); // 2GB 文件直接炸
// 修复：流式读取
try (InputStream is = Files.newInputStream(path);
     BufferedInputStream bis = new BufferedInputStream(is)) {
    byte[] buffer = new byte[8192];
    int len;
    while ((len = bis.read(buffer)) != -1) {
        // 处理 buffer
    }
}
```

## 三、Metaspace（元空间溢出）

### 3.1 典型报错

```
java.lang.OutOfMemoryError: Metaspace
```

### 3.2 排查步骤

```bash
# 1. 查看已加载类数量
jcmd <pid> VM.classloader_stats | wc -l

# 2. 查看类加载器
jmap -clstats <pid>
# 找到数量异常的 ClassLoader

# 3. dump 后用 MAT 分析 ClassLoader 对象
```

### 3.3 常见根因

```java
// 根因1：Groovy/JS 动态编译脚本
GroovyClassLoader loader = new GroovyClassLoader();
Class<?> clazz = loader.parseClass(script); // 每次都生成新类
// 修复：缓存编译结果，或用 GroovyShell 复用

// 根因2：CGLIB 代理未缓存
// 自定义 AOP 框架时每次都生成新的代理类
// 修复：代理类缓存

// 根因3：热部署/热加载导致旧 ClassLoader 无法卸载
// 修复：确保旧 ClassLoader 的所有引用都断开
```

### 3.4 修复方案

```bash
# 增大 Metaspace
-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m

# Spring Cloud 微服务建议
-XX:MaxMetaspaceSize=512m  # 框架本身类就很多
```

## 四、Direct Buffer Memory（直接内存溢出）

### 4.1 典型报错

```
java.lang.OutOfMemoryError: Direct buffer memory
```

### 4.2 排查步骤

```bash
# 1. 查看直接内存使用量（JDK 11+）
jcmd <pid> VM.native_memory summary | grep "Direct"

# 2. NIO DirectByteBuffer 统计
# 通过 JMX 查看 java.nio.BufferPool 的 direct 池使用量
```

### 4.3 常见根因

```java
// 根因1：Netty ByteBuf 未释放
ByteBuf buf = Unpooled.buffer(1024 * 1024); // 1MB
// 用完后忘记 buf.release();
// Netty 默认使用 DirectByteBuffer，不释放会一直占用堆外内存

// 根因2：NIO ByteBuffer 泄漏
ByteBuffer buffer = ByteBuffer.allocateDirect(10 * 1024 * 1024); // 10MB
// 用完未调用 Cleaner.clean()

// 根因3：Netty 内存泄露检测未开启
// 默认采样检测，生产环境建议开启
```

### 4.4 修复方案

```java
// 1. Netty ByteBuf 必须在 finally 中释放
ByteBuf buf = null;
try {
    buf = Unpooled.buffer(1024);
    // 业务逻辑
} finally {
    if (buf != null) buf.release();
}

// 2. 使用 SimpleChannelInboundHandler 自动释放
public class MyHandler extends SimpleChannelInboundHandler<ByteBuf> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) {
        // SimpleChannelInboundHandler 会自动释放 msg
    }
}

// 3. JVM 参数调整直接内存上限
-XX:MaxDirectMemorySize=1g
// Netty 场景建议设为 -Xmx 的一半

// 4. 开启 Netty 内存泄露检测（测试环境）
-Dio.netty.leakDetection.level=PARANOID
```

## 五、Unable to Create New Native Thread（线程数耗尽）

### 5.1 典型报错

```
java.lang.OutOfMemoryError: unable to create new native thread
```

### 5.2 排查步骤

```bash
# 1. 查看当前线程数
jstack <pid> | grep "java.lang.Thread.State" | wc -l

# 2. 查看系统线程限制
ulimit -u          # 用户最大线程数
cat /proc/<pid>/status | grep Threads  # 当前进程线程数

# 3. 查看线程类型分布
jstack <pid> | grep "java.lang.Thread.State" | sort | uniq -c | sort -rn
```

### 5.3 常见根因

```java
// 根因1：new Thread() 未使用线程池
new Thread(() -> { /* task */ }).start();
// 高并发下每请求创建线程，最终耗尽

// 根因2：线程池配置不当
ExecutorService pool = Executors.newCachedThreadPool();
// 最大线程数 Integer.MAX_VALUE，无限制创建

// 根因3：线程泄漏（创建了但从未关闭）
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
// 每次请求都 new 一个 scheduler，但从不 shutdown
```

### 5.4 修复方案

```java
// 1. 必须使用线程池，禁止裸 new Thread()
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    10, 50, 60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),
    new ThreadFactoryBuilder().setNameFormat("biz-pool-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);

// 2. 禁用 Executors 工厂方法
// Executors.newCachedThreadPool() → 无界线程数
// Executors.newFixedThreadPool() → 无界队列
// 都有风险，必须手动 new ThreadPoolExecutor

// 3. Spring 环境用 @Async 时配置线程池
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(1000);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

// 4. 调整系统限制
# /etc/security/limits.conf
* soft nproc 65535
* hard nproc 65535
```

## 六、GC Overhead Limit Exceeded

### 6.1 典型报错

```
java.lang.OutOfMemoryError: GC overhead limit exceeded
```

### 6.2 含义

JVM 检测到 **98% 的时间在做 GC，但只回收了 2% 的堆内存**，说明 GC 已经无能为力，即将 OOM。

### 6.3 修复

本质上还是堆内存不足或内存泄漏，排查方法同 `Java heap space`。

```bash
# 如果不想让用户看到这个错误，可以禁用（不推荐，只是掩盖问题）
-XX:-UseGCOverheadLimit
```

## 七、OOM 应急预案

### 7.1 发生 OOM 时怎么办

```bash
# 1. 确认是否有 heap dump 文件
ls -la /tmp/heapdump/java_pid*.hprof

# 2. 如果进程还在但无法服务，先摘流量
# K8s 环境
kubectl scale deployment <app> --replicas=0
# 或在网关层摘除节点

# 3. 如果有 dump 文件，拉到本地分析
scp user@server:/tmp/heapdump/java_pid*.hprof ./

# 4. 重启服务恢复
kubectl scale deployment <app> --replicas=3
```

### 7.2 用 MAT 分析 dump 文件

```
1. 打开 MAT → File → Open Heap Dump
2. 点击 Leak Suspects Report（自动分析疑似泄漏点）
3. 看 Dominator Tree（支配树，按对象保留内存大小排序）
4. 找到最大对象 →右键 → Path To GC Roots → exclude weak/soft references
5. 沿引用链找到业务代码中的泄漏点
```

### 7.3 必须配置的 JVM 参数

```bash
# OOM 自动 dump（必须配！）
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/tmp/heapdump/
# 自动创建目录
-XX:+HeapDumpBeforeFullGC  # Full GC 前也 dump（可选，占用磁盘）

# GC 日志
-Xlog:gc*:file=/var/log/gc/gc.log:time,uptime,level,tags:filecount=10,filesize=50M
```

## 八、面试要点

### Q：线上 OOM 怎么排查？

1. 先看 OOM 类型——是 heap space、Metaspace、Direct buffer 还是线程数耗尽
2. 确认有 dump 文件（前提是配了 `-XX:+HeapDumpOnOutOfMemoryError`）
3. 用 MAT 打开 dump → Leak Suspects → Dominator Tree → Path to GC Roots
4. 找到泄漏对象和引用链，定位到代码
5. 如果没有 dump 文件，用 `jmap -histo:live` 看存活对象分布辅助判断

### Q：如何预防 OOM？

1. JVM 参数：配 OOM 自动 dump + 合理堆大小
2. 代码规范：禁止裸 new Thread、禁止全表查询、缓存必须有淘汰策略
3. 监控告警：老年代使用率 >85% 告警、线程数 >500 告警
4. 压测：上线前做长时间压测观察内存趋势

## 九、总结

OOM 排查的核心是**先分类，再定位**。不同 OOM 类型完全不同的排查方向：

- **Heap space** → MAT 分析 dump 找泄漏对象
- **Metaspace** → 查动态代理/类加载器
- **Direct buffer** → 查 Netty/NIO 堆外内存
- **Thread** → 查线程池配置和线程泄漏
- **GC overhead** → 同 heap space

**最重要的教训：生产环境必须配 `-XX:+HeapDumpOnOutOfMemoryError`**。没有 dump 文件的 OOM 排查就是盲人摸象。
