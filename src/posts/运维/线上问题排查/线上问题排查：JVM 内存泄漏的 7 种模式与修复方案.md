---
title: 线上问题排查：JVM 内存泄漏的 7 种模式与修复方案
tag: ["JVM", "内存泄漏", "MAT", "ThreadLocal", "线上排查"]
category: 运维
date: 2026-07-02
---

# 线上问题排查：JVM 内存泄漏的 7 种模式与修复方案

内存泄漏不是重启就能解决的——它会回来。找到根因、彻底修复才是正道。7 种真实泄漏模式，每种都有代码复现、MAT 分析过程和修复方案。

---

## 一、内存泄漏的信号

### 1.1 如何发现

```
信号 1：Full GC 越来越频繁
  第 1 天：每 2 小时一次 Full GC
  第 3 天：每 30 分钟一次
  第 5 天：每 5 分钟一次
  → 典型的内存泄漏趋势

信号 2：GC 后老年代不下降
  Full GC 前老年代 3.5GB
  Full GC 后老年代 3.2GB（只降了 300MB）
  → 存在大量无法回收的对象

信号 3：堆使用量持续上升
  jstat -gc <pid> 5000
  OU（Old Used）持续增长，从不下降

信号 4：OOM 最终爆发
  如果不处理 → 几天/几周后 OOM
```

### 1.2 确认泄漏

```bash
# 1. 连续观察 GC 趋势
jstat -gc <pid> 5000 120
# 每 5 秒打印一次，持续 10 分钟
# 如果 OU 持续上升 → 疑似泄漏

# 2. 两次 dump 对比
# 第一次 dump
jcmd <pid> GC.heap_dump /data/dumps/heap1.hprof

# 等待 30 分钟（让泄漏积累）

# 第二次 dump
jcmd <pid> GC.heap_dump /data/dumps/heap2.hprof

# 3. MAT 对比两个 dump
# File → Compare → Compare Heap Dumps
# 找到增长最多的对象 → 就是泄漏对象
```

---

## 二、泄漏模式 1：ThreadLocal 未清理

### 2.1 泄漏原理

```
ThreadLocal 内存结构：
  Thread → ThreadLocalMap → Entry(key=WeakRef<ThreadLocal>, value=Object)

  key 是弱引用 → ThreadLocal 对象被回收后 key = null
  value 是强引用 → value 无法被回收！
  
  线程池中线程复用 → ThreadLocalMap 一直存在
  → value 一直被引用 → 泄漏
```

### 2.2 代码复现

```java
// 问题代码
public class UserContextHolder {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();
    
    public static void set(User user) {
        currentUser.set(user);
    }
    
    public static User get() {
        return currentUser.get();
    }
    // 没有 remove！
}

// 拦截器设置用户上下文
public class UserInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        User user = parseUser(req);
        UserContextHolder.set(user);  // 设置但从不清理
        return true;
    }
}

// 每次请求 set 一个 User 对象（含大字段）
// 线程池 200 线程 × 每请求 1MB User 对象 = 泄漏
```

### 2.3 修复

```java
// 修复：finally 中清理
public class UserInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        User user = parseUser(req);
        UserContextHolder.set(user);
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp, 
                                 Object handler, Exception ex) {
        UserContextHolder.remove();  // 必须清理！
    }
}

// 或用 try-finally
public void handle(Request req) {
    UserContextHolder.set(req.getUser());
    try {
        // 业务处理
    } finally {
        UserContextHolder.remove();
    }
}

// 最佳实践：包装 ThreadLocal 自动清理
public class AutoCleanThreadLocal<T> extends ThreadLocal<T> {
    private final ThreadLocal<T> delegate = new ThreadLocal<>();
    
    public void set(T value) {
        delegate.set(value);
    }
    
    public T get() {
        return delegate.get();
    }
    
    public void remove() {
        delegate.remove();
    }
}
```

---

## 三、泄漏模式 2：静态集合无限增长

### 3.1 代码复现

```java
// 问题代码：缓存只加不删
public class OrderCache {
    private static final Map<String, Order> cache = new HashMap<>();
    
    public static void put(String orderId, Order order) {
        cache.put(orderId, order);
    }
    
    public static Order get(String orderId) {
        return cache.get(orderId);
    }
    // 没有 remove / 没有 LRU / 没有 TTL
}

// 每天新增 10 万订单 → 缓存每天增长 10 万条
// 30 天后 300 万条 → 堆溢出
```

### 3.2 修复

```java
// 修复 1：用 Caffeine 替代 HashMap
public class OrderCache {
    private static final Cache<String, Order> cache = Caffeine.newBuilder()
        .maximumSize(10000)                       // 最大条数
        .expireAfterWrite(10, TimeUnit.MINUTES)    // 写入后 10 分钟过期
        .expireAfterAccess(5, TimeUnit.MINUTES)    // 访问后 5 分钟过期
        .recordStats()                             // 记录统计
        .build();
    
    public static void put(String orderId, Order order) {
        cache.put(orderId, order);
    }
    
    public static Order get(String orderId) {
        return cache.getIfPresent(orderId);
    }
}

// 修复 2：用 ConcurrentHashMap + 定时清理
public class OrderCache {
    private static final ConcurrentHashMap<String, Order> cache = new ConcurrentHashMap<>();
    
    // 定时清理（每小时执行）
    @Scheduled(fixedRate = 3600000)
    public void cleanup() {
        long expireTime = System.currentTimeMillis() - 600000;  // 10 分钟前
        cache.entrySet().removeIf(e -> e.getValue().getCreateTime() < expireTime);
    }
}
```

---

## 四、泄漏模式 3：监听器/回调未注销

### 4.1 代码复现

```java
// 问题代码：注册监听器但从不注销
public class OrderEventService {
    private final EventBus eventBus;
    
    public void registerListener(OrderListener listener) {
        eventBus.register(listener);  // 注册
    }
    // 没有 unregister！
}

// 每次创建新监听器注册但不注销
// 事件源一直持有监听器引用 → 监听器无法回收 → 泄漏
```

### 4.2 修复

```java
// 修复：生命周期管理
public class OrderEventService {
    private final EventBus eventBus = new EventBus();
    private final Set<OrderListener> registeredListeners = ConcurrentHashMap.newKeySet();
    
    public void registerListener(OrderListener listener) {
        eventBus.register(listener);
        registeredListeners.add(listener);
    }
    
    public void unregisterListener(OrderListener listener) {
        eventBus.unregister(listener);
        registeredListeners.remove(listener);
    }
    
    @PreDestroy
    public void destroy() {
        registeredListeners.forEach(eventBus::unregister);
        registeredListeners.clear();
    }
}

// 或用 WeakReference 持有监听器
public class WeakOrderListener implements OrderListener {
    private final WeakReference<OrderListener> delegate;
    
    public WeakOrderListener(OrderListener listener) {
        this.delegate = new WeakReference<>(listener);
    }
    
    @Override
    public void onOrderEvent(OrderEvent event) {
        OrderListener listener = delegate.get();
        if (listener != null) {
            listener.onOrderEvent(event);
        }
        // 如果 listener 被 GC 回收，delegate.get() 返回 null
        // 不会阻止 listener 被回收
    }
}
```

---

## 五、泄漏模式 4：数据库连接/IO 未关闭

### 5.1 代码复现

```java
// 问题代码：异常时连接未关闭
public class OrderRepository {
    
    public Order findById(String orderId) {
        Connection conn = dataSource.getConnection();
        PreparedStatement ps = conn.prepareStatement("SELECT * FROM orders WHERE id = ?");
        ps.setString(1, orderId);
        ResultSet rs = ps.executeQuery();
        
        if (rs.next()) {
            return mapOrder(rs);
        }
        
        // 异常抛出时 → conn/ps/rs 都不会关闭！
        return null;
    }
}

// 每次异常 → 泄漏一个连接
// 连接池耗尽 → 系统不可用
```

### 5.2 修复

```java
// 修复：try-with-resources
public Order findById(String orderId) throws SQLException {
    String sql = "SELECT * FROM orders WHERE id = ?";
    
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, orderId);
        
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return mapOrder(rs);
            }
        }
    }
    // 自动关闭，即使异常也会关闭
    
    return null;
}

// Spring JdbcTemplate 自动管理连接
@Repository
public class OrderRepository {
    private final JdbcTemplate jdbc;
    
    public Order findById(String orderId) {
        return jdbc.queryForObject(
            "SELECT * FROM orders WHERE id = ?",
            (rs, rowNum) -> mapOrder(rs),
            orderId
        );
    }
}
```

---

## 六、泄漏模式 5：Thread 创建不销毁

### 6.1 代码复现

```java
// 问题代码：每次请求创建新线程
public class OrderService {
    
    public void processOrder(Order order) {
        new Thread(() -> {
            // 耗时处理
            sendNotification(order);
            updateInventory(order);
        }).start();  // 线程创建后不管理
    }
}

// 高并发下创建数千线程
// 每个线程 1MB 栈 → 数 GB 内存
// 线程不结束 → 内存不释放
```

### 6.2 修复

```java
// 修复：使用线程池
public class OrderService {
    
    private static final ExecutorService executor = new ThreadPoolExecutor(
        20, 50, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(1000),
        new ThreadFactoryBuilder().setNameFormat("order-processor-%d").build(),
        new ThreadPoolExecutor.CallerRunsPolicy()
    );
    
    public void processOrder(Order order) {
        executor.submit(() -> {
            sendNotification(order);
            updateInventory(order);
        });
    }
    
    @PreDestroy
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
```

---

## 七、泄漏模式 6：ClassLoader 泄漏

### 7.1 代码复现

```java
// 问题代码：自定义 ClassLoader 加载类但不卸载
public class DynamicModuleLoader {
    
    public void loadModule(String jarPath) {
        URLClassLoader loader = new URLClassLoader(
            new URL[]{new URL("file:" + jarPath)},
            getClass().getClassLoader()
        );
        
        Class<?> clazz = loader.loadClass("com.module.Module");
        Object module = clazz.getDeclaredConstructor().newInstance();
        // 使用 module...
        
        // loader 未关闭 → 加载的类无法卸载 → Metaspace 泄漏
    }
}

// 每次热加载新模块 → 新 ClassLoader → 新类
// 旧 ClassLoader 未释放 → Metaspace 持续增长
```

### 7.2 修复

```java
// 修复：用完关闭 ClassLoader
public void loadModule(String jarPath) {
    try (URLClassLoader loader = new URLClassLoader(
            new URL[]{new URL("file:" + jarPath)},
            getClass().getClassLoader())) {
        
        Class<?> clazz = loader.loadClass("com.module.Module");
        Object module = clazz.getDeclaredConstructor().newInstance();
        // 使用 module...
        
    }  // try-with-resources 自动 close()
    // close() 后 ClassLoader 可被 GC 回收 → 类被卸载
}

// 注意：确保没有其他地方持有 ClassLoader 的引用
// 常见隐藏引用：
//   1. Thread 的 ContextClassLoader
//   2. 静态变量持有 Class 对象
//   3. 日志框架持有 ClassLoader（LogManager）
```

---

## 八、泄漏模式 7：内部类持有外部类引用

### 8.1 代码复现

```java
// 问题代码：非静态内部类持有外部类引用
public class Outer {
    private byte[] largeData = new byte[10 * 1024 * 1024];  // 10MB
    
    class Inner {
        // 非静态内部类隐式持有 Outer.this 引用
        // 即使 Outer 不再使用，只要 Inner 被引用 → Outer 无法回收
        
        void doSomething() {
            // 只用了 Inner 的方法，不需要 Outer 的数据
        }
    }
}

// 场景：将 Inner 对象放入缓存
Map<String, Outer.Inner> cache = new HashMap<>();
Outer outer = new Outer();  // 含 10MB 数据
Outer.Inner inner = outer.new Inner();
cache.put("key", inner);
outer = null;  // 外部类对象设为 null

// 但 inner 还在缓存中 → inner 持有 Outer.this → 10MB 无法回收！
```

### 8.2 修复

```java
// 修复 1：改为静态内部类
public class Outer {
    private byte[] largeData = new byte[10 * 1024 * 1024];
    
    static class Inner {
        // 静态内部类不持有外部类引用
        void doSomething() {
            // 不依赖外部类实例
        }
    }
}

// 修复 2：如果需要外部类数据，显式传入
public class Outer {
    private byte[] largeData = new byte[10 * 1024 * 1024];
    
    static class Inner {
        private final byte[] data;
        
        Inner(byte[] data) {
            this.data = data;  // 显式传入，不持有整个外部类
        }
    }
}

// 规则：如果内部类不需要访问外部类实例变量 → 改为 static
```

---

## 九、MAT 分析实战

### 9.1 Leak Suspects 报告

```
MAT 打开 hprof → Leak Suspects：

问题嫌疑 1：
  Problem Suspect 1:
  The class "com.order.cache.OrderCache" occupies 1.2GB (45%) of the heap.
  The memory is accumulated in one instance of "java.util.HashMap"
  loaded by "sun.misc.Launcher$AppClassLoader".
  
  Thread Context:
  → com.order.cache.OrderCache.cache (HashMap)
  → 1,200,000 个 Order 对象
  → 每个 Order 平均 1KB
  
  修复建议：用 Caffeine 替代 HashMap，设置 maximumSize

问题嫌疑 2：
  Problem Suspect 2:
  500 instances of "java.lang.Thread" loaded by 
  "sun.misc.Launcher$AppClassLoader" occupy 500MB.
  
  Thread Context:
  → 500 个线程，每个 1MB 栈
  → 线程名称：Thread-1, Thread-2, ... Thread-500
  
  修复建议：使用线程池，限制线程数量
```

### 9.2 Dominator Tree

```
Dominator Tree（支配树）按对象持有内存大小排序：

  Shallow Heap  Retained Heap  Class
  ─────────────────────────────────────────────
  512MB         2.5GB          java.util.HashMap          ← 最大
  ├── 512B      1.2GB          java.util.HashMap$Node[]
  │   ├── 1KB   1KB            com.order.entity.Order
  │   ├── 1KB   1KB            com.order.entity.Order
  │   └── ... (120万个 Order)
  └── ...
  256MB         500MB           java.lang.Thread[]         ← 第二大
  128MB         128MB           byte[]                     ← 直接内存

  Shallow Heap：对象自身大小
  Retained Heap：对象被回收后能释放的总大小（包括引用链）
  
  关注 Retained Heap 最大的对象 → 就是泄漏点
```

### 9.3 Path to GC Roots

```
Path to GC Roots：找到对象为什么不被回收

操作：右键对象 → Merge Shortest Paths to GC Roots → exclude weak/soft references

  java.lang.Thread
  └── java.util.concurrent.ConcurrentHashMap$Segment
      └── java.util.concurrent.ConcurrentHashMap
          └── com.order.cache.UserContextHolder.currentUser
              ← 这是一个 ThreadLocal

  结论：ThreadLocal 未清理导致泄漏
  修复：afterCompletion 中调用 remove()
```

---

## 十、面试要点

### Q：怎么判断是内存泄漏还是内存不足？

内存泄漏：Full GC 后老年代使用量几乎不降，且持续增长。
内存不足：Full GC 后老年代大幅下降，只是堆配置不够。

简单方法：连续 Full GC 后看老年代使用量
  持续上升 → 泄漏
  下降到正常水平 → 内存不足（增大堆）

### Q：ThreadLocal 为什么会内存泄漏？

ThreadLocal 的 ThreadLocalMap 中 Entry 的 key 是弱引用（WeakReference），value 是强引用。ThreadLocal 对象被回收后 key 变成 null，但 value 仍被 ThreadLocalMap 强引用。线程池中线程复用，ThreadLocalMap 一直存在，value 无法回收。修复：使用后调用 `remove()`。

### Q：MAT 怎么找内存泄漏？

1. Leak Suspects 报告 → 自动分析嫌疑点
2. Dominator Tree → 按 Retained Heap 排序找最大对象
3. Path to GC Roots → 找到引用链，看谁持有了不该持有的引用
4. 对比两次 dump → 找增长最快的对象

---

## 十一、总结

7 种泄漏模式速查：

| 模式 | 根因 | 修复 |
|------|------|------|
| ThreadLocal | remove 未调用 | finally 中 remove |
| 静态集合 | 只加不删 | Caffeine + 淘汰策略 |
| 监听器 | 未注销 | unregister + @PreDestroy |
| 连接泄漏 | 异常未关闭 | try-with-resources |
| 线程泄漏 | 无限创建 | 线程池 |
| ClassLoader | 未关闭 | close() + 清除引用 |
| 内部类 | 隐式引用 | 改为 static |

记住：**内存泄漏不可怕，可怕的是不分析 dump。ThreadLocal 必清理，集合必须有淘汰，连接必须用 try-with-resources**。
