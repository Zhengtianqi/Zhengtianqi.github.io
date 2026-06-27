---
title: Full GC 排查实战：从现象到根因的完整排查链路
tag: ["JVM", "GC", "线上问题排查", "Full GC"]
category: 线上问题排查
date: 2026-06-27
---

# Full GC 排查实战：从现象到根因的完整排查链路

线上系统突然报警，CPU 飙到 100%，接口响应从 50ms 飙到 5000ms，日志里全是 `Full GC` —— 这是每个 Java 后端都经历过的噩梦。

本文不讲 GC 理论（假设你已经了解分代收集、CMS/G1 基础），聚焦于一个核心问题：**线上 Full GC 频繁，如何从现象一步步定位到根因，并最终解决？**

---

## 一、Full GC 的现象与影响

### 1.1 典型的故障现象

```
[告警] 2026-06-27 14:23:01 - 服务响应时间 P99 > 3000ms
[告警] 2026-06-27 14:23:15 - CPU 使用率 > 95%
[日志] 2026-06-27 14:23:18 - java.lang.OutOfMemoryError: Java heap space
[GC日志] [Full GC (Ergonomics) [PSYoungGen: 0K -> 0K] [ParOldGen: 17179869184K -> 17179869180K] [Metaspace: 51200K -> 51200K] 17179869184K -> 17179869180K, 12.3456789 secs]
```

Full GC 的影响是毁灭性的：

| 影响维度 | 表现 | 原因 |
|---------|------|------|
| 响应时间 | 接口从 50ms 飙到秒级 | Full GC 过程中 STW（Stop The World），整个应用暂停 |
| CPU | CPU 使用率飙到 100% | GC 线程全速运转，用户线程被挂起 |
| 吞吐量 | QPS 断崖式下跌 | STW 期间无法处理任何请求 |
| 稳定性 | 最终 OOM 导致服务崩溃 | 内存无法回收，堆耗尽 |

### 1.2 Full GC vs Minor GC vs Mixed GC

不是所有 GC 都需要紧急处理，先搞清楚类型：

| GC 类型 | 触发条件 | STW 时间 | 是否需要处理 |
|---------|---------|---------|-------------|
| Minor GC (Young GC) | Eden 区满 | 几十毫秒 | 正常现象，无需处理 |
| Mixed GC | 老年代占用率超过阈值 | 几十到几百毫秒 | G1 正常行为，观察频率即可 |
| Full GC | 老年代满 / Metaspace 满 / System.gc() / 分配失败 | 秒级甚至十几秒 | **必须处理** |

> ⚠️ **关键认知**：Full GC 是 JVM 的"最后手段"，频繁 Full GC 说明内存管理出了问题，必须排查。

---

## 二、排查工具箱：你需要掌握的命令

### 2.1 第一时间要做的三件事

```bash
# 1. 查看进程状态（确认是不是 GC 导致的 CPU 飙高）
top -Hp <pid>
# 找到 CPU 最高的线程 ID，如果是 "GC task thread" 就确认是 GC 问题

# 2. 查看 GC 统计信息
jstat -gcutil <pid> 1000 10
# 每秒输出一次，共 10 次，观察 O 区（老年代）和 YGC/FGC 次数

# 3. 导出 GC 日志（如果启动时配置了 -Xlog:gc*）
jcmd <pid> GC.heap_info
```

### 2.2 jstat 输出解读

```
  S0     S1     E      O      M     CCS    YGC    YGCT    FGC    FGCT    GCT
  0.00  98.44  67.12  99.87  96.34  91.28  1234   15.678   56   145.234  160.912
```

| 列 | 含义 | 关注点 |
|---|------|--------|
| O | 老年代使用率 | 持续 >90% 说明老年代回收不动了 |
| FGC | Full GC 次数 | 如果每秒都在增长，说明在疯狂 Full GC |
| FGCT | Full GC 总耗时 | 单次 FGCT / (FGC差值) = 单次 Full GC 耗时 |
| GCT | GC 总耗时 | GCT/YGCT 比例可以看出 GC 效率 |

### 2.3 堆内存分析

```bash
# 导出堆 dump 文件（生产环境慎用，会导致 STW）
jmap -dump:format=b,file=heap.hprof <pid>

# 或者使用 jcmd（推荐，更安全）
jcmd <pid> GC.heap_dump /tmp/heap.hprof

# 查看堆内存对象统计（不加 --live 只看统计，不触发 GC）
jmap -histo <pid> | head -20

# 只看存活对象（会触发 Full GC，生产环境慎用）
jmap -histo:live <pid> | head -20
```

### 2.4 在线诊断工具 Arthas（生产环境推荐）

```bash
# 启动 Arthas
java -jar arthas-boot.jar <pid>

# 查看 JVM 信息
dashboard

# 查看 GC 情况
vmtool --action getInstances --className java.lang.String --limit 10

# 追踪方法调用
trace com.example.Service method

# 查看对象大小
ognl '@java.lang.Runtime@getRuntime().freeMemory()'
```

---

## 三、Full GC 六大根因与排查路径

### 3.1 根因一：内存泄漏（最常见）

**现象**：老年代使用率持续上升，Full GC 后老年代使用率不下降。

**排查步骤**：

```bash
# 1. 连续观察 jstat，确认老年代是否"只进不出"
jstat -gcutil <pid> 1000 10
# 如果 O 列持续在 99% 不下降，基本确认是内存泄漏

# 2. 导出两次 heap dump（间隔 5-10 分钟）
jcmd <pid> GC.heap_dump /tmp/heap1.hprof
# 等 5-10 分钟
jcmd <pid> GC.heap_dump /tmp/heap2.hprof

# 3. 用 MAT（Memory Analyzer Tool）对比两个 dump
# 找到数量持续增长的对象，就是泄漏点
```

**常见内存泄漏场景**：

```java
// 场景1：静态集合类无限增长
public class CacheManager {
    private static final Map<String, Object> CACHE = new HashMap<>();
    // 只 put 不 remove，永远不会被 GC
    public static void put(String key, Object value) {
        CACHE.put(key, value);
    }
}

// 场景2：ThreadLocal 未清理
public class UserContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();
    // 线程池复用线程，ThreadLocal 不清理会导致内存泄漏
    public static void set(User user) {
        currentUser.set(user);
    }
    // 忘记写 remove 方法
}

// 场景3：监听器/回调未注销
public class EventListener {
    public void register() {
        EventBus.register(this); // 注册了监听器
    }
    // 对象销毁时没有 EventBus.unregister(this)
    // 导致监听器一直持有 this 引用，无法 GC
}

// 场景4：内部类持有外部类引用
public class Outer {
    private List<Runnable> tasks = new ArrayList<>();
    
    public void start() {
        // 匿名内部类隐式持有 Outer.this 引用
        Runnable task = new Runnable() {
            @Override
            public void run() {
                System.out.println(Outer.this.name);
            }
        };
        tasks.add(task);
    }
}
```

**解决方案**：

```java
// 1. 使用 WeakHashMap 或 Caffeine 替代静态 HashMap
private static final Map<String, Object> CACHE = 
    new Caffeine().maximumSize(10000).expireAfterWrite(30, TimeUnit.MINUTES).build();

// 2. ThreadLocal 必须在 finally 中清理
try {
    currentUser.set(user);
    // 业务逻辑
} finally {
    currentUser.remove();
}

// 3. 监听器在销毁时注销
@PreDestroy
public void destroy() {
    EventBus.unregister(this);
}

// 4. 使用静态内部类替代匿名内部类
public static class Task implements Runnable {
    private final String name;
    public Task(String name) { this.name = name; }
    @Override
    public void run() { System.out.println(name); }
}
```

### 3.2 根因二：大对象直接进入老年代

**现象**：Minor GC 频繁触发 Full GC，老年代使用率波动较大但整体呈上升趋势。

**排查步骤**：

```bash
# 查看 GC 日志中的大对象分配
# JDK 17+ 的 ZGC 日志：
# grep "Large Object Allocation" gc.log

# 查看对象直方图
jmap -histo <pid> | head -30
# 找到 byte[] 或 char[] 占用异常大的情况
```

**常见场景**：

```java
// 场景1：一次性查询大量数据
// 一次查询 10 万条记录，每条 1KB = 100MB 的大对象
List<Order> orders = orderMapper.selectAll(); // 直接查全表

// 场景2：大文件一次性读取
byte[] bytes = Files.readAllBytes(Paths.get("huge_file.csv")); // 500MB 文件

// 场景3：SQL 查询未分页
// SELECT * FROM log_table WHERE create_time > '2026-01-01'
// 返回数百万条记录
```

**解决方案**：

```java
// 1. 分页查询
int pageNum = 1;
int pageSize = 1000;
while (true) {
    List<Order> batch = orderMapper.selectPage(pageNum, pageSize);
    if (batch.isEmpty()) break;
    // 处理当前批次
    pageNum++;
}

// 2. 流式读取大文件
try (BufferedReader reader = Files.newBufferedReader(path)) {
    String line;
    while ((line = reader.readLine()) != null) {
        // 逐行处理
    }
}

// 3. MyBatis 流式查询
@Select("SELECT * FROM log_table WHERE create_time > #{date}")
@Options(resultSetType = ResultSetType.FORWARD_ONLY, fetchSize = Integer.MIN_VALUE)
void streamQuery(@Param("date") String date, ResultHandler<Log> handler);
```

### 3.3 根因三：Metaspace 空间不足

**现象**：Full GC 日志显示 `[Metaspace: 51200K -> 51200K]`，Metaspace 使用率不下降。

**排查步骤**：

```bash
# 查看 Metaspace 使用情况
jstat -gcutil <pid> 1000 5
# M 列持续 100%

# 查看类加载统计
jcmd <pid> VM.classloader_stats
```

**常见场景**：

```java
// 场景1：动态代理类无限生成（如反射调用未缓存）
Method method = clazz.getMethod("process");
// 每次调用都生成新的代理类
Object proxy = Proxy.newProxyInstance(loader, interfaces, handler);

// 场景2：CGLIB 动态代理未缓存
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(Service.class);
// 每次都创建新的 Enhancer，生成新的代理类
Service proxy = (Service) enhancer.create();

// 场景3：Groovy 脚本动态编译
GroovyClassLoader loader = new GroovyClassLoader();
// 每次都编译新脚本，类不会卸载
Class<?> clazz = loader.parseClass(scriptText);
```

**解决方案**：

```java
// 1. 设置合理的 Metaspace 大小
-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m

// 2. 缓存代理类
private static final MethodHandles.Lookup lookup = MethodHandles.lookup();
// 使用 MethodHandle 替代反射，避免动态代理

// 3. Spring 中 CGLIB 代理已经做了缓存，自定义 CGLIB 也要加缓存
private static final Map<Class<?>, Object> PROXY_CACHE = new ConcurrentHashMap<>();
public static <T> T createProxy(Class<T> targetClass) {
    return (T) PROXY_CACHE.computeIfAbsent(targetClass, clazz -> {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(clazz);
        enhancer.setCallback(new MethodInterceptor() { ... });
        return enhancer.create();
    });
}
```

### 3.4 根因四：System.gc() 被显式调用

**现象**：Full GC 日志显示 `[Full GC (System.gc())]`，但堆内存使用率不高。

**排查步骤**：

```bash
# 查看 GC 日志触发原因
grep "System.gc" gc.log

# 查看是否有代码调用了 System.gc()
# 搜索代码库
grep -r "System.gc()" --include="*.java" .
grep -r "Runtime.getRuntime().gc()" --include="*.java" .
```

**常见场景**：

```java
// 场景1：第三方库调用了 System.gc()
// 如 RMI 框架默认会周期性调用 System.gc()
// 场景2：开发人员"优化"代码
public void clearCache() {
    cache.clear();
    System.gc(); // "主动"触发 GC，实际上适得其反
}
```

**解决方案**：

```bash
# JVM 启动参数禁用 System.gc()
-XX:+DisableExplicitGC

# 或者使用 G1 时更温和的处理
-XX:+ExplicitGCInvokesConcurrent
```

### 3.5 根因五：堆内存分配不合理

**现象**：Full GC 频繁但每次回收后老年代使用率能降到 30% 以下，说明不是泄漏而是堆太小。

**排查步骤**：

```bash
# 查看堆内存配置
jcmd <pid> VM.flags | grep -E "HeapSize|NewSize|OldSize"

# 查看实际堆使用情况
jcmd <pid> GC.heap_info
```

**常见配置问题**：

```
# 问题1：堆太小
-Xmx2g  # 对于日活百万的应用，2G 堆太小

# 问题2：年轻代和老年代比例不合理
-XX:NewRatio=2  # 老年代:年轻代 = 2:1，老年代太大导致 Minor GC 频繁晋升

# 问题3：Metaspace 太小
-XX:MaxMetaspaceSize=128m  # 对于 Spring Cloud 微服务，128M 不够
```

**解决方案**：

```bash
# 合理的 JVM 参数配置（8G 内存机器，中型应用）
-Xms4g -Xmx4g                    # 堆大小固定，避免动态扩缩
-XX:NewRatio=1                    # 年轻代:老年代 = 1:1
-XX:SurvivorRatio=8               # Eden:S0:S1 = 8:1:1
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m
-XX:+UseG1GC                      # 使用 G1 收集器
-XX:MaxGCPauseMillis=200          # 目标停顿时间 200ms
-XX:G1HeapRegionSize=16m          # Region 大小
-XX:+ParallelRefProcEnabled       # 并行处理引用
-XX:+HeapDumpOnOutOfMemoryError   # OOM 时自动 dump
-XX:HeapDumpPath=/tmp/heapdump    # dump 文件路径
```

### 3.6 根因六：并发标记失败（CMS 的 Concurrent Mode Failure）

**现象**：GC 日志显示 `concurrent mode failure` 或 `promotion failed`。

> 注意：JDK 14+ 已移除 CMS，如果你用的是 G1 或 ZGC，这个问题不存在。但很多老系统还在用 CMS。

**原因**：CMS 在并发标记阶段，老年代空间不足以支持新对象的晋升。

**解决方案**：

```bash
# 方案1：增大老年代或减小 CMS 触发阈值
-XX:CMSInitiatingOccupancyFraction=68  # 老年代使用率到 68% 就开始 CMS
-XX:+UseCMSInitiatingOccupancyOnly      # 不自适应，固定使用上面设定的值

# 方案2：升级到 G1 或 ZGC（推荐）
-XX:+UseG1GC
# 或
-XX:+UseZGC  # JDK 15+ 生产可用，亚毫秒级停顿
```

---

## 四、完整排查流程图

```
告警触发（CPU飙高/响应慢）
    │
    ▼
jstat -gcutil <pid> 1000 10
    │
    ├── FGC 持续增长？
    │       │
    │       ▼
    │   导出 GC 日志，查看 Full GC 触发原因
    │       │
    │       ├── System.gc() → 检查代码，加 -XX:+DisableExplicitGC
    │       │
    │       ├── Metaspace 满 → 检查动态代理/类加载，增大 Metaspace
    │       │
    │       ├── 老年代满 → jmap -histo:live 查看对象
    │       │       │
    │       │       ├── Full GC 后老年代下降 → 堆太小，调大 -Xmx
    │       │       │
    │       │       └── Full GC 后老年代不下降 → 内存泄漏！
    │       │               │
    │       │               ▼
    │       │           导出两次 heap dump，MAT 对比分析
    │       │           定位泄漏对象 → 修复代码
    │       │
    │       └── promotion failed → 老年代碎片/空间不足
    │               │
    │               ▼
    │           增大老年代 / 升级 G1 / 调整晋升策略
    │
    └── FGC 没有增长 → 排查其他原因（死循环/大量计算/锁竞争）
```

---

## 五、JVM 调优参数速查表

### 5.1 通用参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| -Xms | 初始堆大小 | 与 -Xmx 相同 |
| -Xmx | 最大堆大小 | 物理内存的 50-70% |
| -Xmn | 年轻代大小 | 堆的 1/3 到 1/2 |
| -XX:MetaspaceSize | Metaspace 初始大小 | 256m |
| -XX:MaxMetaspaceSize | Metaspace 最大大小 | 512m |
| -XX:+HeapDumpOnOutOfMemoryError | OOM 时自动 dump | 必开 |
| -XX:HeapDumpPath | dump 文件路径 | /tmp/heapdump |

### 5.2 G1 参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| -XX:+UseG1GC | 启用 G1 | JDK 9+ 默认 |
| -XX:MaxGCPauseMillis | 目标停顿时间 | 200 |
| -XX:G1HeapRegionSize | Region 大小 | 16m（4G堆） |
| -XX:InitiatingHeapOccupancyPercent | 触发并发标记的阈值 | 45 |
| -XX:G1ReservePercent | 保留内存百分比 | 10 |

### 5.3 ZGC 参数（JDK 17+）

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| -XX:+UseZGC | 启用 ZGC | JDK 17+ |
| -XX:ZAllocationSpikeTolerance | 分配突增容忍度 | 2.0 |
| -XX:ConcGCThreads | 并发 GC 线程数 | CPU核数的 1/4 |

---

## 六、面试要点

### Q1：线上 Full GC 频繁，你怎么排查？

**回答框架**：
1. 先用 `jstat -gcutil` 确认 Full GC 频率和各区域使用率
2. 看 Full GC 后老年代是否下降——下降说明堆不够，不下降说明内存泄漏
3. 如果是泄漏，用 `jmap -dump` 导出 heap dump，用 MAT 分析支配树找到泄漏对象
4. 如果不是泄漏，检查是否有大对象分配、System.gc() 调用、Metaspace 不足等
5. 对症下药：扩堆、修代码、调参数

### Q2：什么情况下用 G1，什么情况下用 ZGC？

- **G1**：堆 4-32G，停顿目标 100-200ms，JDK 11+ 默认推荐
- **ZGC**：堆 8G-16TB，停顿目标 <10ms，适合对延迟极度敏感的场景（交易系统、实时计算），JDK 17+ 生产可用

### Q3：如何防止内存泄漏？

1. 代码层面：静态集合用 WeakHashMap 或 Caffeine 替代；ThreadLocal 在 finally 中 remove；监听器及时注销
2. 监控层面：接 Prometheus + Grafana 监控 JVM 内存，设置老年代使用率 >85% 告警
3. 压测层面：上线前进行长时间压测，观察堆内存是否持续增长

---

## 七、总结

Full GC 排查的核心逻辑：**先分类（是哪种 Full GC），再定位（根因是什么），最后修复（改代码还是调参数）**。

记住一个原则：**Full GC 不可怕，可怕的是没有监控、没有日志、没有预案**。

生产环境必须做到：
1. 启动时配置 GC 日志：`-Xlog:gc*:file=gc.log:time,uptime,level,tags`
2. 开启 OOM 自动 dump：`-XX:+HeapDumpOnOutOfMemoryError`
3. 接入 JVM 监控：Prometheus + Grafana + JVM Exporter
4. 定期做压测和内存分析，不要等线上出问题才发现