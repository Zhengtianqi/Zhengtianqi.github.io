---
title: JVM 内存溢出深度排查：从 OOM 到 Metaspace 的全类型实战
tag: ["JVM", "OOM", "内存溢出", "Metaspace", "DirectMemory", "排查"]
category: 基础知识
date: 2026-07-02
---

# JVM 内存溢出深度排查：从 OOM 到 Metaspace 的全类型实战

线上 OOM 怎么快速定位？堆溢出、元空间溢出、直接内存溢出有什么区别？OOM 不只是 heap space，6 种 OOM 类型全覆盖，每种都有真实案例和修复方案。

---

## 一、六种 OOM 类型

```
1. Java heap space        → 堆内存不够，对象太多
2. GC overhead limit      → GC 花费 98% 时间但只回收 2%
3. Metaspace              → 类元数据太多（动态生成类）
4. Direct buffer memory   → NIO 直接内存不够
5. Unable to create new native thread → 线程数超限
6. StackOverflowError     → 栈深度超限（递归）
```

---

## 二、Java Heap Space（堆溢出）

### 2.1 现象

```
java.lang.OutOfMemoryError: Java heap space

常见原因：
  ① 查询数据量太大（无分页）
  ② 内存泄漏（集合只加不删）
  ③ 大文件一次性读入内存
  ④ 缓存无淘汰策略
  ⑤ 堆配置太小
```

### 2.2 实战案例：无分页查询

```java
// 问题代码：一次性查询 100 万条订单
@RestController
public class OrderController {
    
    @GetMapping("/orders/export")
    public List<OrderDTO> exportAll() {
        // 一次查询全部 → OOM
        List<Order> orders = orderMapper.selectAll();
        return orders.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        // 100万 Order 对象 + 100万 OrderDTO 对象 = 约 2GB
        // 堆只有 1GB → OOM
    }
}

// 修复：流式查询 + 分批处理
@GetMapping("/orders/export")
public void exportAll(HttpServletResponse response) {
    try (CsvWriter writer = new CsvWriter(response.getOutputStream())) {
        int pageSize = 1000;
        int lastId = 0;
        while (true) {
            List<Order> batch = orderMapper.selectBatch(lastId, pageSize);
            if (batch.isEmpty()) break;
            
            for (Order order : batch) {
                writer.writeRow(convertToDTO(order));
            }
            lastId = batch.get(batch.size() - 1).getId();
            batch.clear();  // 及时释放
        }
    }
}

// Mapper：游标查询（MyBatis）
@Select("SELECT * FROM orders WHERE id > #{lastId} ORDER BY id LIMIT #{pageSize}")
List<Order> selectBatch(@Param("lastId") int lastId, @Param("pageSize") int pageSize);

// 或用 Cursor（流式查询）
@Select("SELECT * FROM orders")
@Options(resultSetType = ResultSetType.FORWARD_ONLY, fetchSize = Integer.MIN_VALUE)
Cursor<Order> selectAllCursor();
```

### 2.3 排查步骤

```bash
# 1. 确认 OOM 类型
# 日志中找：java.lang.OutOfMemoryError: Java heap space

# 2. 获取堆 dump（提前配置自动 dump）
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/

# 或手动 dump
jmap -dump:format=b,file=heap.hprof <pid>
jcmd <pid> GC.heap_dump /data/dumps/heap.hprof

# 3. MAT 分析
# 打开 hprof → Leak Suspects → Dominator Tree
# 找到占用内存最大的对象 → 查看 GC Roots 引用链

# 4. Arthas 在线分析
[arthas@12345]$ heapdump /tmp/heap.hprof
[arthas@12345]$ ognl '@Runtime@getRuntime().totalMemory()'  # 当前堆使用
```

---

## 三、GC Overhead Limit（GC 开销超限）

### 3.1 现象

```
java.lang.OutOfMemoryError: GC overhead limit exceeded

含义：
  GC 花费 > 98% CPU 时间，但只回收 < 2% 堆内存
  连续 5 次 GC 都这样 → 抛出 OOM
  
本质：堆几乎满了，GC 拼命回收但回不去
  → 通常是内存泄漏的早期信号
```

### 3.2 案例：ThreadLocal 泄漏

```java
// 问题代码：ThreadLocal 未清理
public class UserContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();
    
    public static void set(User user) {
        currentUser.set(user);
    }
    
    public static User get() {
        return currentUser.get();
    }
    // 缺少 remove()！
}

// 在线程池环境下，线程复用
// 每次请求 set 一个大 User 对象
// 请求结束后没有 remove → User 对象一直被 ThreadLocal 引用
// 线程池 200 个线程 × 每次 1MB User 对象 = 泄漏

// 修复：请求结束后清理
@After
public void cleanup() {
    UserContext.remove();  // 必须清理
}

// 或用 try-finally
public void handleRequest(Request req) {
    UserContext.set(req.getUser());
    try {
        // 业务处理
    } finally {
        UserContext.remove();  // 确保清理
    }
}
```

### 3.3 临时关闭（不推荐）

```bash
# 禁用 GC overhead limit 检查
-XX:-UseGCOverheadLimit

# 注意：这只是掩盖问题，OOM 会变成 Java heap space
# 根本解决是修复内存泄漏
```

---

## 四、Metaspace 溢出

### 4.1 现象

```
java.lang.OutOfMemoryError: Metaspace

Metaspace 存储类元数据：
  - 类信息（名称、字段、方法）
  - 常量池
  - 方法字节码
  - JIT 编译信息

常见原因：
  ① 动态代理生成大量类（CGLIB、ByteBuddy）
  ② JSP 重新编译（每次修改生成新类）
  ③ 反射大量创建类
  ④ 类加载器泄漏（自定义 ClassLoader 未回收）
```

### 4.2 案例：CGLIB 动态代理泄漏

```java
// 问题代码：每次请求创建新代理类
public class DynamicProxyFactory {
    
    public static Object createProxy(Object target) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(target.getClass());
        enhancer.setCallback(new MethodInterceptor() {
            public Object intercept(Object obj, Method method, 
                                     Object[] args, MethodProxy proxy) {
                return proxy.invokeSuper(obj, args);
            }
        });
        return enhancer.create();  // 每次创建新类！
    }
}

// 每次调用 createProxy → CGLIB 生成新 Class → Metaspace 增长
// 10 万次调用 → 10 万个 Class → Metaspace 溢出

// 修复：缓存代理类
private static final Map<Class<?>, Object> proxyCache = new ConcurrentHashMap<>();

public static Object createProxy(Object target) {
    return proxyCache.computeIfAbsent(target.getClass(), clazz -> {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(clazz);
        enhancer.setCallback(new MyInterceptor());
        return enhancer.create();
    });
}
```

### 4.3 诊断与修复

```bash
# 1. 查看 Metaspace 使用量
jcmd <pid> GC.heap_info | grep Metaspace
#  Metaspace       used 256MB, capacity 512MB

# 2. 查看已加载类数量
jcmd <pid> VM.classloader_stats
#ClassLoader         classes bytes  parent_loader
#sun.misc.Launcher$AppClassLoader  3456  128MB
#org.springframework.boot.devtools  1234  64MB
#TomcatEmbeddedWebappClassLoader   5678  256MB  ← 异常多

# 3. Arthas 查看类加载器
[arthas@12345]$ classloader
# 查看类加载器数量和加载类数

# 4. 修复
-XX:MaxMetaspaceSize=512m  # 设置上限（默认无上限）
# 同时修复代码中的类泄漏
```

---

## 五、Direct Buffer Memory（直接内存溢出）

### 5.1 现象

```
java.lang.OutOfMemoryError: Direct buffer memory

直接内存（Direct Memory）：
  NIO ByteBuffer.allocateDirect() 分配的堆外内存
  Netty、NIO、零拷贝使用
  
特点：
  - 不受堆大小限制
  - 不受 GC 管理（Cleaner 机制回收，但不及时）
  - 默认上限 = 堆大小（-Xmx）
```

### 5.2 案例：Netty 未释放 ByteBuf

```java
// 问题代码：Netty ByteBuf 未释放
public class OrderHandler extends ChannelInboundHandlerAdapter {
    
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ByteBuf buf = (ByteBuf) msg;
        try {
            byte[] data = new byte[buf.readableBytes()];
            buf.readBytes(data);
            
            // 处理数据
            processOrder(data);
            
        } finally {
            // 忘记释放！
            // buf.release();  ← 必须释放
        }
    }
}

// Netty 使用 Direct ByteBuf
// 每次请求分配直接内存但未释放
// 高并发下直接内存耗尽 → OOM

// 修复：
@Override
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    ByteBuf buf = (ByteBuf) msg;
    try {
        byte[] data = new byte[buf.readableBytes()];
        buf.readBytes(data);
        processOrder(data);
    } finally {
        buf.release();  // 必须释放
    }
}

// 或用 SimpleChannelInboundHandler（自动释放）
public class OrderHandler extends SimpleChannelInboundHandler<ByteBuf> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf buf) {
        byte[] data = new byte[buf.readableBytes()];
        buf.readBytes(data);
        processOrder(data);
        // 自动调用 release()
    }
}
```

### 5.3 诊断

```bash
# 1. 查看直接内存使用
jcmd <pid> VM.native_memory
# Internal:          256MB
# Direct:           1024MB  ← 异常

# 2. 查看直接内存缓冲区
[arthas@12345]$ vmtool --action getInstances \
  --className java.nio.DirectByteBuffer --limit 100

# 3. 设置直接内存上限
-XX:MaxDirectMemorySize=1g  # 限制直接内存 1GB
```

---

## 六、Unable to Create New Native Thread（线程数溢出）

### 6.1 现象

```
java.lang.OutOfMemoryError: unable to create new native thread

原因：
  ① 线程数超过操作系统限制（ulimit -u）
  ② 线程数超过进程内存限制（每个线程默认 1MB 栈）
  ③ 线程池配置过大或无限制
  ④ ThreadLocal 泄漏导致线程无法销毁
```

### 6.2 计算

```
操作系统限制：
  ulimit -u  # 查看用户最大线程数
  # 通常 4096 或 32768

JVM 线程栈：
  每个线程默认 1MB（-Xss1m）
  2000 线程 = 2GB 栈内存

  如果进程内存 4GB：
    堆 2GB + 元空间 512MB + 直接内存 512MB + 线程栈 = 
    2GB + 512MB + 512MB + 2000 × 1MB = 5GB > 4GB → OOM
```

### 6.3 案例：无限制线程池

```java
// 问题代码：newCachedThreadPool 无上限
ExecutorService executor = Executors.newCachedThreadPool();
// 最大线程数 = Integer.MAX_VALUE → 无限制创建线程

// 高并发下创建数千线程 → OOM

// 修复：使用有界线程池
ExecutorService executor = new ThreadPoolExecutor(
    50,                          // 核心线程
    200,                         // 最大线程
    60, TimeUnit.SECONDS,        // 空闲超时
    new LinkedBlockingQueue<>(1000),  // 有界队列
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);
```

### 6.4 排查

```bash
# 1. 查看进程线程数
ps -eLf | grep <pid> | wc -l
# 或
cat /proc/<pid>/status | grep Threads
# Threads: 3500  ← 异常多

# 2. 查看操作系统限制
ulimit -u

# 3. jstack 查看线程状态
jstack <pid> | grep "java.lang.Thread.State" | sort | uniq -c | sort -rn
#   1500 RUNNABLE
#   1000 WAITING (on monitor)
#   500 TIMED_WAITING

# 4. 减小线程栈大小
-Xss256k  # 从 1m 减到 256k，同样内存可创建更多线程
```

---

## 七、OOM 防御体系

### 7.1 预防配置

```bash
# 必配的 JVM 参数
-XX:+HeapDumpOnOutOfMemoryError           # OOM 自动 dump
-XX:HeapDumpPath=/data/dumps/             # dump 文件路径
-XX:OnOutOfMemoryError="kill -9 %p"      # OOM 后杀进程（容器环境）
-XX:MaxMetaspaceSize=512m                 # 元空间上限
-XX:MaxDirectMemorySize=1g                # 直接内存上限
-XX:+ExitOnOutOfMemoryError               # OOM 后退出（Java 8+）

# 容器环境
-XX:+UseContainerSupport                  # 容器内存感知
-XX:MaxRAMPercentage=75.0                 # 堆 = 容器内存 × 75%
```

### 7.2 代码防御

```java
// 1. 查询必须分页
List<Order> orders = orderMapper.selectPage(pageNum, pageSize);

// 2. 缓存必须有淘汰策略
Cache<String, Order> cache = Caffeine.newBuilder()
    .maximumSize(10000)                    // 最大条数
    .expireAfterWrite(10, TimeUnit.MINUTES) // 过期时间
    .build();

// 3. 线程池必须有界
new ThreadPoolExecutor(50, 200, 60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),
    new ThreadPoolExecutor.CallerRunsPolicy());

// 4. ThreadLocal 必须清理
try {
    context.set(user);
    // business
} finally {
    context.remove();
}

// 5. 大文件流式处理
try (BufferedReader reader = new BufferedReader(
        new FileReader(largeFile))) {
    String line;
    while ((line = reader.readLine()) != null) {
        process(line);  // 逐行处理
    }
}

// 6. NIO Buffer 必须释放
try {
    ByteBuffer buf = ByteBuffer.allocateDirect(1024 * 1024);
    // 使用
} finally {
    // Java 9+ Cleaner 会回收，但建议手动释放
    // 或用 Netty 的 ReferenceCountUtil.release()
}
```

### 7.3 监控告警

```yaml
# Prometheus + Grafana 监控
# 关键指标：
  jvm_memory_used_bytes{area="heap"}    # 堆使用量
  jvm_memory_used_bytes{area="nonheap"} # 非堆使用
  jvm_threads_live_threads              # 活跃线程数
  jvm_gc_pause_seconds                  # GC 停顿
  jvm_classes_loaded_classes            # 已加载类数

# 告警规则：
  # 堆使用率 > 85% 持续 5 分钟
  - alert: HighHeapUsage
    expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
    for: 5m
    
  # 线程数 > 1000
  - alert: HighThreadCount
    expr: jvm_threads_live_threads > 1000
    for: 5m
    
  # Full GC 频率 > 1/分钟
  - alert: FrequentFullGC
    expr: rate(jvm_gc_pause_seconds{action="end of major GC"}[1m]) > 0.016
```

---

## 八、OOM 排查速查表

| OOM 类型 | 根因 | 排查工具 | 修复方向 |
|---------|------|---------|---------|
| Java heap space | 对象太多/泄漏 | jmap + MAT | 分页/清理/增大堆 |
| GC overhead | 内存泄漏早期 | jstat + MAT | 找泄漏点修复 |
| Metaspace | 类泄漏 | classloader + jcmd | 缓存代理类/设上限 |
| Direct buffer | NIO 未释放 | native_memory | 释放 ByteBuf/设上限 |
| Native thread | 线程数过多 | ps + jstack | 有界线程池/减栈大小 |
| StackOverflow | 递归太深 | jstack | 限制递归深度/改迭代 |

---

## 九、面试要点

### Q：线上 OOM 怎么排查？

1. 确认 OOM 类型（看错误信息）
2. 如果有 dump → MAT 分析 Leak Suspects
3. 如果没 dump → 提前配 HeapDumpOnOutOfMemoryError
4. 根据类型排查：
   - heap space → jmap + MAT，找大对象或泄漏
   - Metaspace → classloader 看类加载器，找动态生成类的源头
   - Direct buffer → NIO 使用检查，ByteBuf 是否释放
   - Native thread → ps 看线程数，检查线程池配置
5. 修复 + 压测验证

### Q：ThreadLocal 为什么会导致内存泄漏？

ThreadLocal 的 ThreadLocalMap 中，Entry 的 key 是 WeakReference，但 value 是强引用。ThreadLocal 对象被回收后，key 变成 null，但 value 仍被 ThreadLocalMap 引用。线程池中线程复用，ThreadLocalMap 一直存在，value 无法回收。解决：每次使用后调用 `ThreadLocal.remove()`。

### Q：Metaspace 溢出和堆溢出有什么区别？

堆溢出：对象太多，`-Xmx` 控制上限。Metaspace 溢出：类元数据太多，`-XX:MaxMetaspaceSize` 控制上限。Metaspace 在堆外（本地内存），Java 8 替代了永久代。常见 Metaspace 溢出原因：CGLIB/ByteBuddy 动态生成代理类但未缓存、JSP 频繁重编译、类加载器泄漏。

---

## 十、总结

OOM 防御三道防线：

1. **配置防线**：HeapDumpOnOutOfMemoryError + MaxMetaspaceSize + MaxDirectMemorySize
2. **代码防线**：分页查询 + 有界线程池 + 缓存淘汰 + ThreadLocal 清理
3. **监控防线**：堆使用率 > 85% 告警 + Full GC 频率告警 + 线程数告警

记住：**OOM 不是突发事件，是积累的结果。配好 dump 参数，设好上限，监控先行**。
