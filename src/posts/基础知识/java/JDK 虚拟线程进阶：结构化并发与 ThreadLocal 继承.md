---
title: JDK 虚拟线程进阶：结构化并发与 ThreadLocal 继承
tag: ["Java", "并发编程", "虚拟线程", "结构化并发", "JDK21"]
category: 基础知识
date: 2026-07-03
---

# JDK 虚拟线程进阶：结构化并发与 ThreadLocal 继承

> 虚拟线程（Virtual Thread）是 JDK 21 正式引入的革命性特性，它让 Java 开发者可以用同步代码的风格编写高并发程序。但虚拟线程不只是"轻量级线程"，它还带来了结构化并发（Structured Concurrency）和 Scoped Values 等新范式。本文将深入探讨虚拟线程的进阶用法、原理、陷阱以及与传统并发模型的对比。

## 一、虚拟线程 vs 平台线程

### 1.1 基本概念

```
┌──────────────────────────────────────────────────────────────┐
│              平台线程 vs 虚拟线程                              │
├──────────────────┬───────────────────┬───────────────────────┤
│      特性         │    平台线程        │     虚拟线程          │
│                  │  (Platform Thread) │  (Virtual Thread)     │
├──────────────────┼───────────────────┼───────────────────────┤
│  底层实现         │  OS线程(1:1映射)   │  JVM调度(用户态)      │
├──────────────────┼───────────────────┼───────────────────────┤
│  内存占用         │  ~1MB栈空间        │  ~几KB(动态增长)      │
├──────────────────┼───────────────────┼───────────────────────┤
│  创建成本         │  高(系统调用)      │  极低(Java对象)       │
├──────────────────┼───────────────────┼───────────────────────┤
│  上下文切换       │  内核切换(~1μs)    │  JVM切换(~100ns)      │
├──────────────────┼───────────────────┼───────────────────────┤
│  数量上限         │  ~数千             │  ~数百万              │
├──────────────────┼───────────────────┼───────────────────────┤
│  调度方式         │  OS抢占式调度      │  ForkJoinPool协作式   │
├──────────────────┼───────────────────┼───────────────────────┤
│  阻塞行为         │  阻塞OS线程        │  让出carrier线程      │
│                  │  (浪费资源)        │  (不浪费资源)         │
├──────────────────┼───────────────────┼───────────────────────┤
│  适用场景         │  CPU密集型         │  IO密集型             │
├──────────────────┼───────────────────┼───────────────────────┤
│  API              │  Thread            │  Thread.ofVirtual()  │
│                  │                    │  Thread.startVirtualThread│
└──────────────────┴───────────────────┴───────────────────────┘
```

### 1.2 虚拟线程架构

```
┌──────────────────────────────────────────────────────────────┐
│                  虚拟线程调度架构                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Virtual  │ │ Virtual  │ │ Virtual  │ │ Virtual  │  ...    │
│  │ Thread 1 │ │ Thread 2 │ │ Thread 3 │ │ Thread N │         │
│  │ (用户态) │ │ (用户态) │ │ (用户态) │ │ (用户态) │         │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘            │
│       │           │           │           │                  │
│       │  阻塞时yield让出carrier线程         │                  │
│       │           │           │           │                  │
│       ▼           ▼           ▼           ▼                  │
│  ┌──────────────────────────────────────────────┐           │
│  │         JVM 虚拟线程调度器                     │           │
│  │    (ForkJoinPool, 默认并行度=CPU核心数)        │           │
│  └──────────────────────┬───────────────────────┘           │
│                         │                                    │
│       ┌─────────────────┼─────────────────┐                 │
│       │                 │                 │                 │
│       ▼                 ▼                 ▼                 │
│  ┌──────────┐    ┌──────────┐      ┌──────────┐            │
│  │ Carrier   │    │ Carrier   │      │ Carrier   │           │
│  │ Thread 1  │    │ Thread 2  │      │ Thread N  │           │
│  │ (平台线程)│    │ (平台线程)│      │ (平台线程)│           │
│  │ OS线程   │    │ OS线程   │      │ OS线程   │            │
│  └──────────┘    └──────────┘      └──────────┘            │
│                                                              │
│  关键点：                                                     │
│  1. 虚拟线程挂载(Mount)到Carrier线程上执行                    │
│  2. 遇到阻塞操作(IO/sleep/park)时卸载(Unmount)               │
│  3. Carrier线程可以执行其他虚拟线程                           │
│  4. 阻塞结束后虚拟线程重新挂载到某个Carrier线程               │
│  5. 虚拟线程的栈存储在堆上(Continuation对象)                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 虚拟线程创建方式

```java
// ① 直接创建并启动
Thread vt = Thread.startVirtualThread(() -> {
    System.out.println("虚拟线程: " + Thread.currentThread());
});

// ② 创建但不启动（显式调用start）
Thread vt2 = Thread.ofVirtual().unstarted(() -> {
    System.out.println("unstarted虚拟线程");
});
vt2.start();

// ③ 命名虚拟线程
Thread vt3 = Thread.ofVirtual()
    .name("my-vt-", 0)  // 名称前缀+序号
    .start(() -> System.out.println("命名虚拟线程"));

// ④ 使用Executors（不推荐，直接用Thread更好）
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> "task1");
    executor.submit(() -> "task2");
}  // try-with-resources自动关闭（等待所有任务完成）

// ⑤ 虚拟线程中使用虚拟线程
Thread.startVirtualThread(() -> {
    // 外层虚拟线程
    Thread inner = Thread.startVirtualThread(() -> {
        // 内层虚拟线程
    });
    inner.join();  // 等待内层完成
});
```

### 1.4 虚拟线程的阻塞行为

```java
// 虚拟线程遇到阻塞操作时不会阻塞Carrier线程
Thread vt = Thread.startVirtualThread(() -> {
    System.out.println("线程: " + Thread.currentThread() + 
        ", isVirtual: " + Thread.currentThread().isVirtual());
    
    // 以下操作都会yield（让出Carrier线程）：
    Thread.sleep(1000);                    // ✅ sleep
    socket.getInputStream().read();        // ✅ 阻塞IO
    lock.lock();                           // ✅ ReentrantLock
    future.get();                          // ✅ Future.get
    BlockingQueue.take();                  // ✅ 队列阻塞
    
    // 以下操作不会yield（继续占用Carrier线程）：
    while (true) { /* busy loop */ }       // ❌ CPU密集
    Thread.onSpinWait();                   // ❌ 自旋
    Object.wait();                         // ❌ 旧版wait可能不yield
});
```

### 1.5 不适用场景：synchronized 和 CPU 密集

```java
// ⚠ synchronized会pin（钉住）虚拟线程到Carrier线程！
// JDK 21中synchronized导致虚拟线程无法yield
// JDK 24修复了这个问题（JEP 491）

// ❌ JDK 21中：synchronized会pin
Thread.startVirtualThread(() -> {
    synchronized (lock) {
        // 在synchronized块中阻塞会pin住Carrier线程
        // Carrier线程被占用，无法执行其他虚拟线程
        Thread.sleep(1000);  // Carrier线程也被阻塞！
    }
});

// ✅ 使用ReentrantLock替代synchronized
Thread.startVirtualThread(() -> {
    lock.lock();
    try {
        Thread.sleep(1000);  // 虚拟线程yield，Carrier线程释放
    } finally {
        lock.unlock();
    }
});

// ❌ CPU密集型任务不适合虚拟线程
Thread.startVirtualThread(() -> {
    // 虚拟线程占用Carrier线程做计算
    // 没有阻塞点可以yield
    // 和平台线程没有区别，还多了调度开销
    while (!done) {
        compute();  // 纯计算，不yield
    }
});
```

## 二、结构化并发（Structured Concurrency）

### 2.1 传统并发的问题

```java
// ❌ 传统并发：任务之间没有结构化关系
// 一个子任务失败，其他子任务仍在执行（资源泄漏）
ExecutorService executor = Executors.newFixedThreadPool(4);

Future<User> userFuture = executor.submit(() -> fetchUser(id));
Future<Order> orderFuture = executor.submit(() -> fetchOrder(id));
Future<Recommend> recFuture = executor.submit(() -> fetchRecommend(id));

try {
    User user = userFuture.get();      // 如果这里抛异常
    Order order = orderFuture.get();   // 下面不会执行
    Recommend rec = recFuture.get();   // 但orderFuture和recFuture仍在运行！
} catch (Exception e) {
    // 无法自动取消其他Future
    // 子任务可能无限运行（资源泄漏）
    orderFuture.cancel(true);  // 手动取消，繁琐且不可靠
    recFuture.cancel(true);
}

// 问题：
// 1. 子任务生命周期不受控
// 2. 一个失败需要手动取消其他
// 3. 异常处理复杂
// 4. 无法统一超时
```

### 2.2 结构化并发：StructuredTaskScope

```java
// ✅ 结构化并发：父子任务生命周期绑定
// JDK 21+ (Preview), JDK 24+ (正式)

// ShutdownOnFailure：任一失败则取消所有
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    // 并行启动子任务
    StructuredTaskScope.Subtask<User> userTask = 
        scope.fork(() -> fetchUser(id));
    StructuredTaskScope.Subtask<Order> orderTask = 
        scope.fork(() -> fetchOrder(id));
    StructuredTaskScope.Subtask<Recommend> recTask = 
        scope.fork(() -> fetchRecommend(id));

    // 等待所有子任务完成（或某个失败）
    scope.join();           // 等待所有完成
    scope.throwIfFailed();  // 如果有失败，抛异常

    // 所有成功 → 获取结果
    User user = userTask.get();
    Order order = orderTask.get();
    Recommend rec = recTask.get();
    
    return new PageData(user, order, rec);
}  // try-with-resources自动关闭scope
// 退出scope时：所有子任务保证已完成或已取消
```

### 2.3 结构化并发原理图

```
┌──────────────────────────────────────────────────────────────┐
│              结构化并发 vs 传统并发                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  传统并发（无结构）：                                          │
│  ─────────────────                                           │
│       ┌──► Task A ──────────────────►                        │
│       │                                                      │
│  Parent──► Task B ──✗(失败)─────X                            │
│       │       ↓                                              │
│       │   Parent不知道B失败了                                 │
│       │                                                      │
│       └──► Task C ──────────────────► (继续运行，资源泄漏!)  │
│                                                              │
│  结构化并发（StructuredTaskScope）：                          │
│  ─────────────────                                           │
│       ┌──► Task A ───┐                                       │
│       │              │                                       │
│  Scope──► Task B ──✗─┤──► B失败 → 取消A和C                   │
│       │     ↓        │                                       │
│       │   触发shutdown  Scope.join()返回                     │
│       │              │                                       │
│       └──► Task C ──X─┘  (被取消，不再运行)                   │
│                                                              │
│  保证：退出Scope时，所有子任务要么完成要么已取消               │
│  不会存在"孤儿任务"                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.4 ShutdownOnSuccess：任一成功即返回

```java
// 场景：多源查询，取最快返回的结果
try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
    scope.fork(() -> querySource1(key));
    scope.fork(() -> querySource2(key));
    scope.fork(() -> querySource3(key));
    
    scope.join();  // 等待第一个成功（成功后自动取消其他）
    
    String result = scope.result();  // 获取第一个成功的结果
    System.out.println("最快结果: " + result);
}
// 退出scope时，其他慢的子任务已被取消
```

### 2.5 自定义 StructuredTaskScope

```java
// 自定义Scope：限制最大并发数 + 超时
public class BoundedScope<T> extends StructuredTaskScope<T> {
    private final Semaphore permits;
    private final Duration timeout;
    private final Collection<Subtask<T>> results = 
        Collections.synchronizedCollection(new ArrayList<>());

    public BoundedScope(int maxConcurrency, Duration timeout) {
        this.permits = new Semaphore(maxConcurrency);
        this.timeout = timeout;
    }

    @Override
    protected void handleComplete(Subtask<? extends T> subtask) {
        if (subtask.state() == Subtask.State.SUCCESS) {
            results.add((Subtask<T>) subtask);
        }
    }

    public <U extends T> Subtask<U> forkBounded(Callable<U> task) 
        throws InterruptedException {
        permits.acquire();
        try {
            return super.fork(() -> {
                try {
                    return task.call();
                } finally {
                    permits.release();
                }
            });
        } catch (Exception e) {
            permits.release();
            throw new RuntimeException(e);
        }
    }

    public List<T> results() {
        ensureOwnerAndJoined();
        return results.stream().map(Subtask::get).toList();
    }

    public void joinUntil(Instant deadline) 
        throws InterruptedException, TimeoutException {
        super.joinUntil(deadline);
    }
}
```

### 2.6 结构化并发完整示例

```java
// 完整的服务端示例：并行获取用户页面数据
public PageData loadPage(String userId) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure(
            "page-loader", Thread.ofVirtual().factory())) {
        
        // 并行fork子任务
        var userTask = scope.fork(() -> {
            return userService.getUser(userId);
        });
        
        var ordersTask = scope.fork(() -> {
            return orderService.getRecentOrders(userId, 10);
        });
        
        var recommendTask = scope.fork(() -> {
            // 推荐服务内部也可以使用结构化并发
            return recommendService.recommend(userId);
        });
        
        // 设置整体超时
        scope.joinUntil(Instant.now().plusSeconds(3));
        scope.throwIfFailed();  // 任一失败抛异常
        
        // 组装结果
        return new PageData(
            userTask.get(),
            ordersTask.get(),
            recommendTask.get()
        );
    }
    // 退出scope时：
    // - 所有成功的子任务已完成
    // - 失败的子任务已取消
    // - 不会存在仍在运行的子任务
}
```

## 三、ThreadLocal 在虚拟线程中的问题

### 3.1 ThreadLocal 继承问题

```java
// ThreadLocal在虚拟线程中的三大问题：
// 1. 继承开销：虚拟线程可以创建数百万个，每个都继承ThreadLocal
// 2. 内存占用：百万级虚拟线程 × 每个ThreadLocal = 大量内存
// 3. 生命周期：虚拟线程生命周期长，ThreadLocal不会及时清理

// 传统ThreadLocal模式
private static final ThreadLocal<UserContext> contextHolder = 
    ThreadLocal.withInitial(() -> new UserContext());

// ❌ 在虚拟线程中使用ThreadLocal的问题
// 假设有100万个虚拟线程，每个都设置了ThreadLocal
// → 100万个UserContext对象驻留在内存中
// → 即使虚拟线程执行完毕，ThreadLocal也可能不被GC

// 更严重的：InheritableThreadLocal
private static final ThreadLocal<String> requestId = 
    new InheritableThreadLocal<>();

// 父线程设置requestId
requestId.set("REQ-123");

// 创建虚拟线程（虚拟线程继承InheritableThreadLocal）
Thread vt = Thread.startVirtualThread(() -> {
    System.out.println(requestId.get());  // "REQ-123"
    // 每个虚拟线程都会拷贝一份父线程的InheritableThreadLocal
    // 百万虚拟线程 → 百万次拷贝！
});
```

### 3.2 ThreadLocal 内存占用分析

```
┌──────────────────────────────────────────────────────────────┐
│           ThreadLocal 内存占用对比                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  平台线程场景（~1000线程）：                                  │
│  ─────────────────                                          │
│  1000线程 × 5个ThreadLocal × 平均200字节                     │
│  = 1MB内存（可接受）                                         │
│                                                              │
│  虚拟线程场景（~1,000,000线程）：                             │
│  ─────────────────                                          │
│  1,000,000线程 × 5个ThreadLocal × 平均200字节                │
│  = 1GB内存（严重！）                                         │
│                                                              │
│  问题更严重的是InheritableThreadLocal：                      │
│  - 每个子线程创建时，遍历父线程的所有InheritableThreadLocal   │
│  - 对每个值调用childValue()进行复制                          │
│  - 百万级虚拟线程的创建会严重拖慢性能                         │
│                                                              │
│  时间复杂度：                                                │
│  创建1个虚拟线程：O(父线程的InheritableThreadLocal数量)       │
│  创建100万个虚拟线程：O(100万 × InheritableThreadLocal数量)   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 虚拟线程中 ThreadLocal 的 pinning 问题

```java
// ⚠ JDK 21中，synchronized + ThreadLocal = 更严重的问题

// 如果在synchronized块中访问ThreadLocal
// 虚拟线程被pin到Carrier线程
// Carrier线程被阻塞，无法执行其他虚拟线程

synchronized (someLock) {
    // 虚拟线程被pin
    contextHolder.get();  // 获取ThreadLocal
    blockingIOCall();     // 阻塞IO → Carrier线程也被阻塞！
}

// ✅ 替代方案：使用ReentrantLock
lock.lock();
try {
    contextHolder.get();
    blockingIOCall();     // 虚拟线程yield，Carrier线程释放
} finally {
    lock.unlock();
}
```

## 四、Scoped Values：ThreadLocal 的替代方案

### 4.1 Scoped Values 基本概念

```java
// ScopedValue（JDK 21+ Preview, JDK 25+ 正式）
// 设计目标：不可变、有界、自动清理

// 定义ScopedValue
private static final ScopedValue<UserContext> CURRENT_USER = 
    ScopedValue.newInstance();

// 使用方式
ScopedValue.where(CURRENT_USER, new UserContext("user123")).run(() -> {
    // 在这个作用域内，CURRENT_USER.get()可以获取值
    handleRequest();
    
    // 嵌套创建虚拟线程，自动继承ScopedValue（不拷贝！）
    Thread.startVirtualThread(() -> {
        UserContext ctx = CURRENT_USER.get();  // 获取到值
        System.out.println(ctx.userId());
    });
});
// 退出run()后，CURRENT_USER自动清理（不需要remove()）

// ⚠ ScopedValue是不可变的
// 在作用域内不能修改CURRENT_USER的值（只能读取）
```

### 4.2 ScopedValue vs ThreadLocal 对比

```
┌──────────────────┬────────────────────┬────────────────────┐
│      特性         │    ThreadLocal      │    ScopedValue     │
├──────────────────┼────────────────────┼────────────────────┤
│  可变性           │  可读可写          │  只读（不可变）      │
├──────────────────┼────────────────────┼────────────────────┤
│  生命周期         │  线程生命周期      │  作用域（自动清理）  │
│                  │  需手动remove()    │  退出scope自动清理   │
├──────────────────┼────────────────────┼────────────────────┤
│  子线程继承       │  InheritableTL     │  自动继承（零拷贝）  │
│                  │  (拷贝所有值)      │  (共享同一绑定)      │
├──────────────────┼────────────────────┼────────────────────┤
│  内存占用         │  每线程独立副本    │  绑定对象共享        │
│                  │  百万线程=百万副本  │  百万线程=一份绑定   │
├──────────────────┼────────────────────┼────────────────────┤
│  线程安全         │  可变，需注意      │  不可变，天然安全    │
├──────────────────┼────────────────────┼────────────────────┤
│  使用方式         │  set/get/remove   │  where().run()/call()│
├──────────────────┼────────────────────┼────────────────────┤
│  适用场景         │  旧代码兼容        │  虚拟线程首选        │
│                  │  需要可变状态      │  只读上下文传递      │
└──────────────────┴────────────────────┴────────────────────┘
```

### 4.3 ScopedValue 继承机制

```java
// ScopedValue的继承是"零拷贝"的
private static final ScopedValue<String> REQUEST_ID = 
    ScopedValue.newInstance();

// 父线程绑定
ScopedValue.where(REQUEST_ID, "REQ-001").run(() -> {
    System.out.println("父: " + REQUEST_ID.get());  // REQ-001
    
    // 创建虚拟线程
    Thread vt1 = Thread.startVirtualThread(() -> {
        System.out.println("子1: " + REQUEST_ID.get());  // REQ-001
    });
    
    Thread vt2 = Thread.startVirtualThread(() -> {
        System.out.println("子2: " + REQUEST_ID.get());  // REQ-001
    });
    
    vt1.join();
    vt2.join();
});
// 退出run()后，REQUEST_ID绑定自动消失

// ★ 关键区别：
// ThreadLocal: 每个子线程拷贝一份值 → 内存 × 线程数
// ScopedValue: 所有子线程共享同一绑定 → 内存固定（不随线程数增长）
```

### 4.4 ScopedValue 实战：请求上下文传递

```java
// 定义请求上下文
public record RequestContext(
    String requestId,
    String userId,
    String tenantId,
    Instant requestTime
) {}

public class RequestContextHolder {
    private static final ScopedValue<RequestContext> CONTEXT = 
        ScopedValue.newInstance();
    
    // 在请求入口绑定上下文
    public static <T> T withContext(RequestContext ctx, Callable<T> action) 
        throws Exception {
        return ScopedValue.where(CONTEXT, ctx).call(action);
    }
    
    public static RequestContext get() {
        return CONTEXT.get();
    }
    
    public static boolean isBound() {
        return CONTEXT.isBound();
    }
}

// 使用示例
public class OrderController {
    
    public OrderResponse createOrder(OrderRequest req) throws Exception {
        RequestContext ctx = new RequestContext(
            UUID.randomUUID().toString(),
            req.getUserId(),
            req.getTenantId(),
            Instant.now()
        );
        
        return RequestContextHolder.withContext(ctx, () -> {
            // 这里以及所有子线程都可以访问ctx
            return orderService.create(req);
        });
    }
}

// OrderService中（可能在虚拟线程中）
public class OrderService {
    public Order create(OrderRequest req) throws Exception {
        RequestContext ctx = RequestContextHolder.get();
        log.info("创建订单, requestId={}, userId={}", 
            ctx.requestId(), ctx.userId());
        
        // 并行调用，子任务自动继承上下文
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            var inventoryTask = scope.fork(() -> {
                // ctx可用！不需要手动传递
                return inventoryService.reserve(req);
            });
            var paymentTask = scope.fork(() -> {
                return paymentService.preAuth(req);
            });
            
            scope.join();
            scope.throwIfFailed();
            
            return new Order(
                inventoryTask.get(),
                paymentTask.get()
            );
        }
    }
}
```

### 4.5 多级 ScopedValue 绑定

```java
private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();
private static final ScopedValue<String> TENANT_ID = ScopedValue.newInstance();
private static final ScopedValue<Instant> START_TIME = ScopedValue.newInstance();

// 多级绑定
ScopedValue.where(USER_ID, "user123")
    .where(TENANT_ID, "tenant456")
    .where(START_TIME, Instant.now())
    .run(() -> {
        // 所有三个ScopedValue都可用
        String userId = USER_ID.get();
        String tenantId = TENANT_ID.get();
        Instant startTime = START_TIME.get();
        
        // 嵌套绑定（覆盖）
        ScopedValue.where(USER_ID, "admin").run(() -> {
            System.out.println(USER_ID.get());  // "admin"（内层覆盖）
            System.out.println(TENANT_ID.get()); // "tenant456"（外层保留）
        });
        
        System.out.println(USER_ID.get());  // "user123"（恢复）
    });
```

## 五、虚拟线程适用场景

### 5.1 适用 vs 不适用

```
┌──────────────────────────────────────────────────────────────┐
│              虚拟线程适用场景分析                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ 适合虚拟线程：                                             │
│  ──────────────                                              │
│  • HTTP请求处理（大量请求，每个请求IO等待）                    │
│  • 数据库查询（连接池等待）                                    │
│  • 微服务调用（RPC等待）                                      │
│  • 文件IO操作                                                │
│  • 消息消费处理                                               │
│  • WebSocket连接管理                                          │
│                                                              │
│  ❌ 不适合虚拟线程：                                           │
│  ────────────────                                            │
│  • CPU密集型计算（加密、压缩、排序）                           │
│  • 需要精确控制并发的场景（用平台线程+线程池）                  │
│  • 使用Thread-local大量可变状态的旧代码                        │
│  • 大量使用synchronized的旧代码（JDK21 pin问题）              │
│                                                              │
│  ⚠ 需要注意：                                                 │
│  ─────────                                                   │
│  • 混合型任务：IO部分用虚拟线程，CPU部分用平台线程              │
│  • 第三方库使用synchronized + 阻塞IO：可能pin                 │
│  • 需要监控虚拟线程的pin情况：                                 │
│    -Djdk.tracePinnedThreads=full                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 实战：虚拟线程 + 结构化并发的 Web 服务

```java
// 使用虚拟线程处理HTTP请求
public class VirtualThreadServer {

    public static void main(String[] args) throws IOException {
        // 每个请求一个虚拟线程
        try (var server = new ServerSocket(8080);
             var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            
            System.out.println("服务器启动，使用虚拟线程");
            
            while (!Thread.currentThread().isInterrupted()) {
                Socket client = server.accept();
                
                executor.submit(() -> {
                    try (client) {
                        handleRequest(client);
                    } catch (IOException e) {
                        log.error("请求处理失败", e);
                    }
                });
                // 每个请求在独立虚拟线程中处理
                // 可以创建数百万个虚拟线程
            }
        }
    }
    
    private static void handleRequest(Socket client) throws IOException {
        // 使用ScopedValue传递请求上下文
        RequestContext ctx = new RequestContext(
            UUID.randomUUID().toString(),
            "user-" + Thread.currentThread().threadId(),
            Instant.now()
        );
        
        ScopedValue.where(REQUEST_CTX, ctx).run(() -> {
            // 解析请求
            Request req = parseRequest(client);
            
            // 使用结构化并发并行处理
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                var dataTask = scope.fork(() -> fetchData(req));
                var userTask = scope.fork(() -> fetchUser(req));
                
                scope.joinUntil(Instant.now().plusSeconds(2));
                scope.throwIfFailed();
                
                Response resp = new Response(dataTask.get(), userTask.get());
                sendResponse(client, resp);
            } catch (Exception e) {
                sendError(client, 500, e.getMessage());
            }
        });
    }
}
```

## 六、虚拟线程 vs Reactor 响应式编程

### 6.1 对比分析

```
┌──────────────────┬─────────────────────┬─────────────────────┐
│      特性         │    虚拟线程          │    Reactor          │
│                  │  (Virtual Threads)  │  (响应式编程)        │
├──────────────────┼─────────────────────┼─────────────────────┤
│  编程模型         │  同步阻塞            │  异步非阻塞          │
│                  │  (传统写法)         │  (Mono/Flux链式)    │
├──────────────────┼─────────────────────┼─────────────────────┤
│  代码可读性       │  ★★★★★ 高          │  ★★☆☆☆ 低            │
├──────────────────┼─────────────────────┼─────────────────────┤
│  调试难度         │  ★★☆☆☆ 低          │  ★★★★★ 高            │
│                  │  正常的线程栈        │  回调地狱，栈丢失    │
├──────────────────┼─────────────────────┼─────────────────────┤
│  生态兼容         │  ★★★★★ 完全兼容    │  ★★★☆☆ 需要适配      │
│                  │  现有库直接可用      │  需要Reactive库     │
├──────────────────┼─────────────────────┼─────────────────────┤
│  资源效率         │  ★★★★☆ 高          │  ★★★★★ 非常高        │
│                  │  虚拟线程调度开销    │  事件循环，极低开销  │
├──────────────────┼─────────────────────┼─────────────────────┤
│  背压支持         │  ★★☆☆☆ 有限        │  ★★★★★ 原生支持      │
├──────────────────┼─────────────────────┼─────────────────────┤
│  请求处理模型     │  一请求一线程        │  事件循环+回调      │
├──────────────────┼─────────────────────┼─────────────────────┤
│  JDK版本要求      │  JDK 21+           │  JDK 8+             │
├──────────────────┼─────────────────────┼─────────────────────┤
│  学习成本         │  ★☆☆☆☆ 极低        │  ★★★★☆ 较高          │
│                  │  写同步代码即可      │  需学习操作符/调度器 │
└──────────────────┴─────────────────────┴─────────────────────┘
```

### 6.2 代码对比

```java
// 场景：并行查询3个服务，合并结果

// ① 虚拟线程写法（同步风格，易读）
public CompletableFuture<Result> fetchV() {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure("fetch")) {
        var a = scope.fork(() -> serviceA.get());
        var b = scope.fork(() -> serviceB.get());
        var c = scope.fork(() -> serviceC.get());
        
        scope.joinUntil(Instant.now().plusSeconds(5));
        scope.throwIfFailed();
        
        return CompletableFuture.completedFuture(
            new Result(a.get(), b.get(), c.get()));
    }
}

// ② Reactor写法（异步链式，复杂）
public Mono<Result> fetchR() {
    return Mono.zip(
            Mono.fromCallable(() -> serviceA.get())
                .subscribeOn(Schedulers.boundedElastic()),
            Mono.fromCallable(() -> serviceB.get())
                .subscribeOn(Schedulers.boundedElastic()),
            Mono.fromCallable(() -> serviceC.get())
                .subscribeOn(Schedulers.boundedElastic())
        )
        .timeout(Duration.ofSeconds(5))
        .map(tuple -> new Result(
            tuple.getT1(), tuple.getT2(), tuple.getT3()
        ))
        .onErrorResume(e -> Mono.error(
            new FetchException("查询失败", e)));
}

// ③ 传统线程池 + CompletableFuture
public CompletableFuture<Result> fetchC(Executor executor) {
    var fa = CompletableFuture.supplyAsync(() -> serviceA.get(), executor);
    var fb = CompletableFuture.supplyAsync(() -> serviceB.get(), executor);
    var fc = CompletableFuture.supplyAsync(() -> serviceC.get(), executor);
    
    return CompletableFuture.allOf(fa, fb, fc)
        .orTimeout(5, TimeUnit.SECONDS)
        .thenApply(v -> new Result(
            fa.join(), fb.join(), fc.join()))
        .exceptionally(ex -> {
            throw new FetchException("查询失败", ex);
        });
}
```

### 6.3 迁移建议

```
┌──────────────────────────────────────────────────────────────┐
│                  迁移建议                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 新项目（JDK 21+）：                                       │
│     → 直接使用虚拟线程 + 结构化并发                           │
│     → 不需要引入Reactor/WebFlux                              │
│     → 编程模型简单，维护成本低                                │
│                                                              │
│  2. 现有Reactor项目：                                         │
│     → 不急于迁移，Reactor仍然有效                             │
│     → 新模块可以尝试虚拟线程                                  │
│     → 逐步替换复杂链式调用                                    │
│                                                              │
│  3. 现有CompletableFuture项目：                               │
│     → 可以平滑迁移到虚拟线程                                  │
│     → 将异步链改回同步调用 + 虚拟线程                         │
│     → 用StructuredTaskScope替代allOf/anyOf                   │
│                                                              │
│  4. 传统线程池项目：                                          │
│     → IO密集型：用Executors.newVirtualThreadPerTaskExecutor  │
│     → CPU密集型：保持平台线程池不变                           │
│                                                              │
│  5. 注意事项：                                                │
│     → 检查synchronized使用，替换为ReentrantLock              │
│     → 检查ThreadLocal使用，替换为ScopedValue                 │
│     → 监控pin情况：-Djdk.tracePinnedThreads=full             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 七、面试要点

### Q1: 虚拟线程和平台线程有什么区别？

**A：** 
- **实现**：平台线程 1:1 映射 OS 线程；虚拟线程由 JVM 调度，挂载到少量 Carrier 线程上
- **资源**：平台线程约 1MB 栈；虚拟线程几 KB，可创建数百万个
- **阻塞**：平台线程阻塞浪费 OS 资源；虚拟线程阻塞时 yield，释放 Carrier 线程
- **适用**：平台线程适合 CPU 密集型；虚拟线程适合 IO 密集型

### Q2: 虚拟线程的 pinning 问题是什么？

**A：** JDK 21 中，当虚拟线程在 `synchronized` 块内阻塞时，无法 yield，会"钉住"（pin）Carrier 线程，导致 Carrier 线程被阻塞。解决方案是用 `ReentrantLock` 替代 `synchronized`。JDK 24（JEP 491）修复了这个问题。可以通过 `-Djdk.tracePinnedThreads=full` 检测 pin 情况。

### Q3: 什么是结构化并发？

**A：** 结构化并发通过 `StructuredTaskScope` 将父子任务的生命周期绑定。核心保证：
1. 父任务退出时，所有子任务保证已完成或已取消
2. 子任务失败可以自动取消其他子任务
3. 不存在"孤儿任务"泄露资源
- `ShutdownOnFailure`：任一失败取消所有
- `ShutdownOnSuccess`：任一成功取消其他

### Q4: ScopedValue 相比 ThreadLocal 有什么优势？

**A：**
1. **不可变**：绑定后只读，避免可变状态的线程安全问题
2. **自动清理**：退出作用域自动清理，不需要手动 remove()
3. **零拷贝继承**：子线程共享同一绑定，不复制值。百万虚拟线程只有一份绑定
4. **有界**：值只在 where().run() 作用域内可见，不会泄漏

### Q5: 虚拟线程能完全替代 Reactor 吗？

**A：** 在大多数 IO 密集型场景可以替代。虚拟线程的优势是同步编程模型、代码可读性、调试友好、生态兼容。但 Reactor 在以下场景仍有优势：
1. 需要精细背压控制的流式处理
2. 极高吞吐的事件循环场景
3. 需要 JDK < 21 的项目
4. 已有大量 Reactor 代码的项目

### Q6: 虚拟线程使用什么调度器？

**A：** 默认使用 `ForkJoinPool` 的共享池，并行度为 `CPU核心数`。虚拟线程被挂载到 Carrier 线程上执行，遇到阻塞操作（sleep、IO、park、Lock 等）时自动卸载，Carrier 线程可以执行其他虚拟线程。阻塞结束后虚拟线程重新挂载到某个 Carrier 线程。

### Q7: 什么时候不应用虚拟线程？

**A：**
1. **CPU 密集型任务**：没有阻塞点可以 yield，虚拟线程退化为平台线程
2. **使用大量 synchronized 的旧代码**：pinning 问题降低并发度
3. **需要精确控制并发数**：虚拟线程数量太大，不如线程池可控
4. **依赖 ThreadLocal 可变状态**：百万虚拟线程的 ThreadLocal 内存爆炸

## 八、避坑指南

### 坑1：synchronized + 阻塞导致 pin

```java
// ❌ JDK 21: synchronized内阻塞会pin
public synchronized String fetchData() {
    return httpClient.get(url);  // 阻塞IO在synchronized内 → pin!
}

// ✅ 使用ReentrantLock替代
private final ReentrantLock lock = new ReentrantLock();

public String fetchData() {
    lock.lock();
    try {
        return httpClient.get(url);  // 虚拟线程正常yield
    } finally {
        lock.unlock();
    }
}
```

### 坑2：池化虚拟线程

```java
// ❌ 虚拟线程不应该池化！
// 虚拟线程创建成本极低，用完即弃
ExecutorService pool = Executors.newFixedThreadPool(100, 
    Thread.ofVirtual().factory());  // 池化虚拟线程没有意义

// ✅ 每个任务一个虚拟线程
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
```

### 坑3：ThreadLocal 不清理

```java
// ❌ 虚拟线程中ThreadLocal不清理导致内存泄漏
Thread.startVirtualThread(() -> {
    contextHolder.set(largeObject);  // 设置ThreadLocal
    doWork();
    // 忘记remove()！虚拟线程虽然结束，但可能被缓存
    // largeObject无法被GC
});

// ✅ 使用ScopedValue替代（自动清理）
// 或确保finally中remove()
Thread.startVirtualThread(() -> {
    try {
        contextHolder.set(largeObject);
        doWork();
    } finally {
        contextHolder.remove();  // 确保清理
    }
});
```

### 坑4：虚拟线程中调用 CPU 密集代码

```java
// ❌ CPU密集型任务在虚拟线程中没有好处
Thread.startVirtualThread(() -> {
    // 纯计算，没有阻塞点
    // 虚拟线程占用Carrier线程，无法yield
    // 和平台线程一样，还多了调度开销
    result = heavyComputation();
});

// ✅ CPU密集型用平台线程
executor.execute(() -> heavyComputation());  // 平台线程池
```

## 九、总结

虚拟线程是 Java 并发编程的里程碑式特性：

1. **编程模型**：同步代码风格实现高并发，大幅降低心智负担
2. **资源效率**：百万级线程并发，阻塞不浪费资源
3. **结构化并发**：StructuredTaskScope 绑定父子生命周期，杜绝资源泄漏
4. **ScopedValue**：替代 ThreadLocal，不可变、零拷贝、自动清理

最佳实践：
- **IO 密集用虚拟线程，CPU 密集用平台线程**
- **用 ReentrantLock 替代 synchronized**（JDK 21）
- **用 ScopedValue 替代 ThreadLocal**
- **用 StructuredTaskScope 替代 CompletableFuture.allOf**
- **不要池化虚拟线程**
- **监控 pinning 情况**

虚拟线程不是银弹，但它在 IO 密集型场景下让"一请求一线程"模型重新变得可行，同时避免了异步编程的复杂性。这是 Java 对抗 Go goroutine 和 Kotlin coroutine 的有力武器。
