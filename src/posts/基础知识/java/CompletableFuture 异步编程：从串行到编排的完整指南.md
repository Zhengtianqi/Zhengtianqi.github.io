---
title: CompletableFuture 异步编程：从串行到编排的完整指南
tag: ["Java", "并发编程", "CompletableFuture", "异步编程"]
category: 基础知识
date: 2026-07-03
---

# CompletableFuture 异步编程：从串行到编排的完整指南

> CompletableFuture 是 Java 8 引入的异步编程利器，它将 Future 的能力从"等待结果"扩展到"编排任务"。本文将从基础创建到复杂编排，全面剖析 CompletableFuture 的使用方法、底层原理和避坑技巧。

## 一、从 Future 到 CompletableFuture

### 1.1 Future 的局限性

```java
// Future 的基本用法
ExecutorService executor = Executors.newFixedThreadPool(4);
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "Hello";
});

// ❌ Future的三大局限：
// 1. 阻塞获取结果：get()会阻塞当前线程
String result = future.get();  // 阻塞！

// 2. 无法注册回调：不知道什么时候完成
// 只能轮询 isDone()
while (!future.isDone()) {
    // 忙等待，浪费CPU
}

// 3. 无法链式组合：A完成后触发B，再触发C...
// 需要嵌套调用，造成"回调地狱"
```

### 1.2 CompletableFuture 的优势

```
┌─────────────────────────────────────────────────────────┐
│           Future vs CompletableFuture                   │
├──────────────┬──────────────────┬───────────────────────┤
│    能力       │    Future        │  CompletableFuture   │
├──────────────┼──────────────────┼───────────────────────┤
│  获取结果     │  只能阻塞get()   │  回调 + 阻塞 + 轮询  │
├──────────────┼──────────────────┼───────────────────────┤
│  注册回调     │  ❌ 不支持       │  ✅ thenApply等      │
├──────────────┼──────────────────┼───────────────────────┤
│  链式组合     │  ❌ 不支持       │  ✅ thenCompose      │
├──────────────┼──────────────────┼───────────────────────┤
│  并行组合     │  ❌ 不支持       │  ✅ allOf/anyOf     │
├──────────────┼──────────────────┼───────────────────────┤
│  异常处理     │  ❌ 不支持       │  ✅ exceptionally    │
├──────────────┼──────────────────┼───────────────────────┤
│  手动完成     │  ❌ 不支持       │  ✅ complete()       │
├──────────────┼──────────────────┼───────────────────────┤
│  取消任务     │  ✅ cancel()     │  ✅ cancel()         │
└──────────────┴──────────────────┴───────────────────────┘
```

## 二、创建 CompletableFuture

### 2.1 异步创建方式

```java
// ① supplyAsync：有返回值的异步任务
CompletableFuture<String> cf1 = CompletableFuture.supplyAsync(() -> {
    System.out.println("执行任务: " + Thread.currentThread().getName());
    simulateDelay(500);
    return "异步结果";
});
// 默认使用 ForkJoinPool.commonPool()

// ② runAsync：无返回值的异步任务
CompletableFuture<Void> cf2 = CompletableFuture.runAsync(() -> {
    System.out.println("执行无返回值任务");
    simulateDelay(300);
});

// ③ supplyAsync + 自定义线程池（推荐！）
ExecutorService executor = Executors.newFixedThreadPool(8);
CompletableFuture<String> cf3 = CompletableFuture.supplyAsync(() -> {
    return "使用自定义线程池";
}, executor);  // ★ 传入自定义Executor

// ④ 已完成的CompletableFuture（用于测试或快速返回）
CompletableFuture<String> cf4 = CompletableFuture.completedFuture("立即完成");
CompletableFuture<String> cf5 = CompletableFuture.failedFuture(
    new RuntimeException("立即失败"));  // JDK 9+
```

### 2.2 线程池选择策略

```
┌──────────────────────────────────────────────────────────┐
│              CompletableFuture 线程池选择                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────┐         │
│  │  supplyAsync/runAsync 没有指定Executor        │         │
│  │  → 使用 ForkJoinPool.commonPool()            │         │
│  │  → 默认并行度 = CPU核心数 - 1                 │         │
│  │  → 所有应用共享一个commonPool!                │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
│  ┌─────────────────────────────────────────────┐         │
│  │  回调方法 (thenApply等) 没有指定Executor       │         │
│  │  → 谁完成谁执行（可能在前一个任务的线程中执行）  │         │
│  │  → 如果前一步已完成，在调用线程中同步执行       │         │
│  └─────────────────────────────────────────────┘         │
│                                                          │
│  ⚠ 坑：commonPool被其他任务占满时，新任务会排队          │
│     → 建议重要任务使用独立的线程池                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 三、串行编排

### 3.1 三种串行方法对比

```java
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "Hello");

// ① thenApply：接收上一步结果，返回新值（有返回值）
CompletableFuture<Integer> cf1 = cf.thenApply(s -> {
    return s.length();  // String → Integer
});
// cf1.get() = 5

// ② thenAccept：接收上一步结果，无返回值（消费型）
CompletableFuture<Void> cf2 = cf.thenAccept(s -> {
    System.out.println("收到: " + s);  // 消费结果，无返回
});
// cf2.get() = null

// ③ thenRun：不接收上一步结果，无返回值（执行型）
CompletableFuture<Void> cf3 = cf.thenRun(() -> {
    System.out.println("上一步完成了");  // 不关心结果
});
// cf3.get() = null
```

### 3.2 串行编排图解

```
thenApply：T → R（转换）
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ supplyAsync│───►│  thenApply   │───►│  结果     │
│ 返回 T    │     │  T → R       │     │  类型 R   │
└──────────┘     └──────────────┘     └──────────┘

thenAccept：T → void（消费）
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ supplyAsync│───►│  thenAccept  │───►│  void    │
│ 返回 T    │     │  T → void    │     │  (null)  │
└──────────┘     └──────────────┘     └──────────┘

thenRun：void → void（执行）
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ supplyAsync│───►│   thenRun    │───►│  void    │
│ 返回 T    │     │  () → void   │     │  (null)  │
└──────────┘     └──────────────┘     └──────────┘
```

### 3.3 同步与异步版本

```java
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> "data");

// 同步版本：在前一个任务的线程中执行（或调用线程）
CompletableFuture<String> cf1 = cf.thenApply(s -> s + " processed");

// 异步版本（Async后缀）：提交到 ForkJoinPool 执行
CompletableFuture<String> cf2 = cf.thenApplyAsync(s -> s + " processed");

// 异步版本 + 自定义线程池
CompletableFuture<String> cf3 = cf.thenApplyAsync(s -> s + " processed", executor);
```

```
同步 vs 异步执行时机：
═══════════════════════════════════════════

场景1：前一步未完成时
  thenApply：        在前一步的线程中执行回调
  thenApplyAsync：   提交到线程池异步执行回调

场景2：前一步已完成时
  thenApply：        在调用线程中同步执行回调
  thenApplyAsync：   提交到线程池异步执行回调

执行路径示例（thenApply）：
┌──────────┐         ┌──────────┐
│ Thread-A │         │ Thread-B │
│ 执行任务1 │         │ 调用     │
│ 完成后   │         │ thenApply│
│ 执行回调 │         │          │
└──────────┘         └──────────┘
  如果任务1已完成，回调在Thread-B中同步执行
  如果任务1未完成，回调在Thread-A中执行（任务1完成后）

执行路径示例（thenApplyAsync）：
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Thread-A │         │ Thread-B │         │ Thread-C │
│ 执行任务1 │         │ 调用     │         │ 线程池   │
│          │         │ thenApply│         │ 执行回调 │
└──────────┘         └──────────┘         └──────────┘
  无论任务1是否完成，回调都提交到线程池异步执行
```

## 四、组合编排

### 4.1 thenCombine：合并两个独立 Future

```java
// 场景：并行查询两个服务，合并结果
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    simulateDelay(500);
    return "用户信息";
});

CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    simulateDelay(300);
    return "订单信息";
});

// thenCombine：两个Future都完成后，合并结果
CompletableFuture<String> combined = future1.thenCombine(future2, (userInfo, orderInfo) -> {
    return userInfo + " + " + orderInfo;
});
// combined.get() = "用户信息 + 订单信息"
// 总耗时 ≈ max(500, 300) = 500ms（并行执行）
```

```
thenCombine 图解：

  future1 ──┐
             ├──► thenCombine ──► 合并结果
  future2 ──┘

  两个Future并行执行，都完成后调用BiFunction合并
  耗时 = max(future1耗时, future2耗时)
```

### 4.2 thenCompose：链式依赖（flatMap）

```java
// 场景：第一步查用户ID，第二步用ID查订单（依赖关系）
CompletableFuture<Integer> getUserId = CompletableFuture.supplyAsync(() -> {
    simulateDelay(200);
    return 42;  // 用户ID
});

// ❌ thenApply会导致嵌套
CompletableFuture<CompletableFuture<String>> nested =
    getUserId.thenApply(id -> getOrderById(id));  // 嵌套！

// ✅ thenCompose自动展平
CompletableFuture<String> composed = getUserId.thenCompose(id -> {
    return CompletableFuture.supplyAsync(() -> {
        return "订单-" + id;
    });
});
// composed.get() = "订单-42"
```

```
thenApply vs thenCompose：
═══════════════════════════════════════════

thenApply (map)：T → R
  输入T，返回R，结果类型 = CompletableFuture<R>
  
  future.thenApply(t -> transform(t))
  类型：CompletableFuture<R>

thenCompose (flatMap)：T → CompletableFuture<R>
  输入T，返回CompletableFuture<R>，自动展平
  
  future.thenCompose(t -> anotherAsync(t))
  类型：CompletableFuture<R>（不是CompletableFuture<CompletableFuture<R>>）

类比：
  thenApply  ≈ Stream.map    (一对一转换)
  thenCompose ≈ Stream.flatMap (一对多展开，自动展平)
```

### 4.3 实战：多服务并行编排

```java
// 场景：电商商品详情页，需要并行调用多个服务
public CompletableFuture<ProductDetail> getProductDetail(Long productId) {
    // 基础信息服务
    CompletableFuture<Product> productFuture = CompletableFuture
        .supplyAsync(() -> productService.getProduct(productId), ioExecutor);

    // 评论服务（依赖商品ID，不依赖商品详情）
    CompletableFuture<List<Review>> reviewFuture = CompletableFuture
        .supplyAsync(() -> reviewService.getReviews(productId), ioExecutor);

    // 推荐服务（依赖商品ID）
    CompletableFuture<List<Product>> recommendFuture = CompletableFuture
        .supplyAsync(() -> recommendService.getRecommendations(productId), ioExecutor);

    // 库存服务
    CompletableFuture<Integer> stockFuture = CompletableFuture
        .supplyAsync(() -> stockService.getStock(productId), ioExecutor);

    // 等待所有结果，合并
    return productFuture.thenCombine(reviewFuture, (product, reviews) -> {
            ProductDetail detail = new ProductDetail();
            detail.setProduct(product);
            detail.setReviews(reviews);
            return detail;
        }).thenCombine(recommendFuture, (detail, recommends) -> {
            detail.setRecommendations(recommends);
            return detail;
        }).thenCombine(stockFuture, (detail, stock) -> {
            detail.setStock(stock);
            return detail;
        });
    // 总耗时 ≈ max(各服务耗时) 而非累加
}
```

编排图解：

```
                    productId
                        │
         ┌──────────┬───┴────┬──────────┐
         ▼          ▼        ▼          ▼
    ┌─────────┐┌─────────┐┌─────────┐┌─────────┐
    │ 商品服务 ││ 评论服务 ││ 推荐服务 ││ 库存服务 │
    │ 200ms   ││ 150ms   ││ 300ms   ││ 100ms   │
    └────┬────┘└────┬────┘└────┬────┘└────┬────┘
         │          │           │          │
         └──────┬───┴───────────┴──────────┘
                │
                ▼
         ┌──────────┐
         │  合并结果  │
         │ ProductDetail│
         └──────────┘

    串行调用总耗时 = 200+150+300+100 = 750ms
    并行编排总耗时 = max(200,150,300,100) = 300ms
    性能提升 = 2.5倍
```

## 五、异常处理

### 5.1 三种异常处理方式

```java
CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> {
    if (Math.random() > 0.5) {
        throw new RuntimeException("服务异常");
    }
    return "成功";
});

// ① exceptionally：只在异常时触发（类似 try-catch）
CompletableFuture<String> cf1 = cf.exceptionally(ex -> {
    System.out.println("发生异常: " + ex.getMessage());
    return "默认值";  // 返回兜底值
});

// ② handle：无论成功或异常都触发（类似 try-catch-finally）
CompletableFuture<String> cf2 = cf.handle((result, ex) -> {
    if (ex != null) {
        System.out.println("异常: " + ex.getMessage());
        return "降级值";
    }
    return result.toUpperCase();  // 正常处理
});

// ③ whenComplete：类似 finally，不能修改结果
CompletableFuture<String> cf3 = cf.whenComplete((result, ex) -> {
    if (ex != null) {
        System.out.println("记录异常日志: " + ex.getMessage());
        // 不能返回新值，异常会继续传播
    } else {
        System.out.println("成功结果: " + result);
        // 不能修改result
    }
});
// cf3的结果与cf相同（异常也会传播）
```

### 5.2 三种方式对比

```
┌───────────────┬─────────────┬─────────────┬─────────────┐
│     方法       │ exceptionally│   handle    │ whenComplete│
├───────────────┼─────────────┼─────────────┼─────────────┤
│  触发时机      │  仅异常时    │  成功+异常   │  成功+异常   │
├───────────────┼─────────────┼─────────────┼─────────────┤
│  能否修改结果  │  ✅ 可返回新值│  ✅ 可返回新值│  ❌ 不可修改 │
├───────────────┼─────────────┼─────────────┼─────────────┤
│  异常传播      │  不传播      │  不传播      │  传播       │
│               │  （已处理）  │  （已处理）  │  （未处理）  │
├───────────────┼─────────────┼─────────────┼─────────────┤
│  类比          │  catch       │  catch+return│  finally    │
├───────────────┼─────────────┼─────────────┼─────────────┤
│  用途          │  降级兜底    │  统一处理    │  日志/清理   │
└───────────────┴─────────────┴─────────────┴─────────────┘
```

### 5.3 异常处理实战

```java
// 多级降级策略
public CompletableFuture<String> fetchWithFallback(String url) {
    return CompletableFuture
        .supplyAsync(() -> httpClient.get(url), ioExecutor)  // 原始请求
        .exceptionally(ex -> {
            log.warn("主请求失败，尝试备用服务: {}", ex.getMessage());
            return httpClient.get(url + "?backup=true");  // 降级1：备用服务
        })
        .exceptionally(ex -> {
            log.warn("备用服务失败，返回缓存: {}", ex.getMessage());
            return cache.get(url);  // 降级2：缓存
        })
        .exceptionally(ex -> {
            log.error("所有降级策略失败", ex);
            return "{}";  // 降级3：默认值
        })
        .whenComplete((result, ex) -> {
            // 记录指标
            metrics.record("fetch", result != null ? "success" : "failure");
        });
}
```

## 六、allOf / anyOf：批量编排

### 6.1 allOf：等待全部完成

```java
// 场景：批量请求，等全部完成
List<CompletableFuture<String>> futures = urls.stream()
    .map(url -> CompletableFuture.supplyAsync(
        () -> httpClient.get(url), ioExecutor))
    .collect(Collectors.toList());

// allOf返回CompletableFuture<Void>，需要手动获取结果
CompletableFuture<Void> allDone = CompletableFuture.allOf(
    futures.toArray(new CompletableFuture[0]));

// 转换为CompletableFuture<List<String>>
CompletableFuture<List<String>> allResults = allDone.thenApply(v ->
    futures.stream()
        .map(CompletableFuture::join)  // 此时所有都已完成，join不会阻塞
        .collect(Collectors.toList())
);
```

### 6.2 anyOf：任一完成即返回

```java
// 场景：多源查询，最快返回的胜出
CompletableFuture<String> source1 = CompletableFuture.supplyAsync(
    () -> querySource1(key), ioExecutor);
CompletableFuture<String> source2 = CompletableFuture.supplyAsync(
    () -> querySource2(key), ioExecutor);
CompletableFuture<String> source3 = CompletableFuture.supplyAsync(
    () -> querySource3(key), ioExecutor);

// anyOf返回CompletableFuture<Object>，第一个完成的胜出
CompletableFuture<Object> fastest = CompletableFuture.anyOf(source1, source2, source3);
String result = (String) fastest.get();  // 最快源的结果
```

### 6.3 allOf / anyOf 图解

```
allOf：等待全部完成
═══════════════════════════════
  future1 ──┐
  future2 ──┼──► allOf ──► 完成（所有都完成后）
  future3 ──┘

  如果future1=2s, future2=1s, future3=3s
  allOf在3s时完成（取最大值）

  ⚠ 如果其中一个异常，allOf的future也会异常
    但其他future仍在执行（不会取消！）

anyOf：任一完成即返回
═══════════════════════════════
  future1 ──┐
  future2 ──┼──► anyOf ──► 完成（第一个完成后）
  future3 ──┘

  如果future1=2s, future2=1s, future3=3s
  anyOf在1s时完成（future2先完成）

  ⚠ 其他未完成的future仍在执行（不会自动取消！）
    可能浪费资源
```

## 七、CompletableFuture 原理浅析

### 7.1 内部结构

```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T> {
    // 结果值或异常
    volatile Object result;       // null表示未完成
    // 后续回调链（栈结构）
    volatile Completion stack;    // 回调链表头

    // Completion是一个链表节点，封装了回调函数
    abstract static class Completion extends ForkJoinTask<Void>
        implements Runnable, AsynchronousCompletionTask {
        volatile Completion next;  // 下一个回调
        // ...
    }
}
```

### 7.2 回调注册与触发

```
CompletableFuture 回调注册流程：
═══════════════════════════════════════════

1. 调用 thenApply(fn)
   ┌──────────────────────────────────────┐
   │ 如果当前CF已完成                        │
   │ → 直接触发回调（可能异步执行）           │
   └──────────────────────────────────────┘
   ┌──────────────────────────────────────┐
   │ 如果当前CF未完成                       │
   │ → 创建Completion节点                   │
   │ → CAS入栈（tryPushStack）              │
   │ → 等待完成时统一触发                    │
   └──────────────────────────────────────┘

2. 任务执行完成（complete(value)）
   ┌──────────────────────────────────────┐
   │ 设置result = value                    │
   │ 遍历stack，依次触发所有Completion       │
   │ 每个Completion执行自己的回调逻辑         │
   │ 可能创建新的CompletableFuture           │
   └──────────────────────────────────────┘

栈结构：
   CF ──► Completion3 ──► Completion2 ──► Completion1
          (thenApply c)   (thenApply b)   (thenApply a)
          
   完成时从栈顶开始遍历执行
```

### 7.3 complete 方法

```java
// 手动完成 CompletableFuture
public boolean complete(T value) {
    boolean triggered = false;
    // CAS将result从null设置为value
    if (result == null)
        triggered = UNSAFE.compareAndSwapObject(this, RESULT, null,
                                                 value == null ? NIL : value);
    // 触发所有回调
    if (triggered)
        postComplete();
    return triggered;
}

// postComplete：触发所有注册的回调
private void postComplete() {
    // 遍历stack，执行每个Completion
    while ((q = stack) != null) {
        // CAS弹出栈顶
        if (UNSAFE.compareAndSwapObject(this, STACK, q, q.next)) {
            // 执行回调
            q.tryFire(SYNC);
        }
    }
}
```

## 八、线程池选择与避坑

### 8.1 线程池选择策略

```java
// ① IO密集型任务：使用自定义线程池
ExecutorService ioExecutor = new ThreadPoolExecutor(
    20,                          // 核心线程数（IO密集型可以多一些）
    50,                          // 最大线程数
    60L, TimeUnit.SECONDS,       // 空闲超时
    new LinkedBlockingQueue<>(1000),  // 有界队列
    new ThreadFactoryBuilder()
        .setNameFormat("cf-io-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略
);

// ② CPU密集型任务：使用 ForkJoinPool 或固定大小线程池
ExecutorService cpuExecutor = Executors.newWorkStealingPool(
    Runtime.getRuntime().availableProcessors());

// ③ 混合任务：分离IO和CPU线程池
CompletableFuture.supplyAsync(() -> fetchData(), ioExecutor)     // IO
    .thenApplyAsync(data -> processData(data), cpuExecutor)      // CPU
    .thenAcceptAsync(result -> saveResult(result), ioExecutor);  // IO
```

### 8.2 避坑指南

#### 坑1：默认 ForkJoinPool 的共享问题

```java
// ❌ 所有未指定线程池的异步任务共用commonPool
// 一个模块的慢任务会拖垮整个应用
CompletableFuture.supplyAsync(() -> {
    Thread.sleep(10000);  // 慢任务占用commonPool线程
    return "slow";
});
CompletableFuture.supplyAsync(() -> {
    return "fast";  // 如果commonPool已满，这个任务会排队等待
});

// ✅ 为不同模块使用独立线程池
CompletableFuture.supplyAsync(() -> slowTask(), slowExecutor);
CompletableFuture.supplyAsync(() -> fastTask(), fastExecutor);
```

#### 坑2：在 CompletableFuture 中阻塞等待

```java
// ❌ 在回调中阻塞会导致线程被占用
CompletableFuture.supplyAsync(() -> {
    CompletableFuture<String> inner = CompletableFuture.supplyAsync(() -> fetchData());
    return inner.get();  // 阻塞！占用当前线程
}, executor);

// ✅ 使用 thenCompose 避免阻塞
CompletableFuture.supplyAsync(() -> startRequest(), executor)
    .thenCompose(response -> CompletableFuture.supplyAsync(
        () -> fetchData(response.getId()), executor));  // 非阻塞
```

#### 坑3：get() 永久阻塞

```java
// ❌ get() 无超时，可能永久阻塞
String result = future.get();  // 如果任务卡住，永远等待

// ✅ 设置超时
String result = future.get(5, TimeUnit.SECONDS);  // 5秒超时

// ✅ JDK 9+：orTimeout / completeOnTimeout
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> slowTask())
    .orTimeout(3, TimeUnit.SECONDS)              // 3秒超时抛异常
    .completeOnTimeout("default", 3, TimeUnit.SECONDS);  // 3秒超时返回默认值
```

#### 坑4：allOf 异常处理

```java
// ❌ allOf中一个失败，整个链异常，其他任务仍在跑
CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
// 如果f1失败，all.get()会立即抛异常
// 但f2、f3仍在执行（浪费资源）

// ✅ 给每个Future加异常处理，防止单个失败影响全局
List<CompletableFuture<String>> safeFutures = futures.stream()
    .map(f -> f.exceptionally(ex -> null))  // 每个都兜底
    .collect(Collectors.toList());

CompletableFuture<Void> all = CompletableFuture.allOf(
    safeFutures.toArray(new CompletableFuture[0]));

// ✅ 使用handle统一处理
all.handle((v, ex) -> {
    if (ex != null) {
        log.error("部分任务失败", ex);
    }
    return v;
});
```

#### 坑5：未取消未完成的Future

```java
// ❌ anyOf后其他Future仍在执行
CompletableFuture.anyOf(f1, f2, f3)
    .thenAccept(result -> {
        // f2胜出，但f1和f3仍在浪费CPU
    });

// ✅ 手动取消其他Future（Java 9+）
// 注意：cancel(true)只能取消尚未开始的任务
// CompletableFuture的cancel是"完成"而非"中断"
```

## 九、完整实战示例

### 9.1 并行数据加载

```java
public class DataLoader {

    private final ExecutorService executor;

    public DataLoader() {
        this.executor = new ThreadPoolExecutor(
            10, 20, 60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(500),
            r -> {
                Thread t = new Thread(r, "data-loader");
                t.setDaemon(true);
                return t;
            }
        );
    }

    public CompletableFuture<PageData> loadPageData(String userId) {
        long start = System.currentTimeMillis();

        // 并行加载用户信息、订单列表、推荐商品
        CompletableFuture<User> userFuture = CompletableFuture
            .supplyAsync(() -> userService.getUser(userId), executor)
            .exceptionally(ex -> User.anonymous());

        CompletableFuture<List<Order>> ordersFuture = CompletableFuture
            .supplyAsync(() -> orderService.getOrders(userId), executor)
            .exceptionally(ex -> Collections.emptyList());

        CompletableFuture<List<Product>> recommendFuture = CompletableFuture
            .supplyAsync(() -> recommendService.recommend(userId), executor)
            .exceptionally(ex -> Collections.emptyList());

        // 查最近订单的物流（依赖ordersFuture）
        CompletableFuture<List<Logistics>> logisticsFuture = ordersFuture
            .thenComposeAsync(orders -> {
                if (orders.isEmpty()) {
                    return CompletableFuture.completedFuture(Collections.emptyList());
                }
                String latestOrderId = orders.get(0).getId();
                return CompletableFuture.supplyAsync(
                    () -> logisticsService.track(latestOrderId), executor);
            }, executor)
            .exceptionally(ex -> Collections.emptyList());

        // 等待全部完成并组装
        return CompletableFuture.allOf(
                userFuture, ordersFuture, recommendFuture, logisticsFuture
            )
            .thenApplyAsync(v -> {
                PageData page = new PageData();
                page.setUser(userFuture.join());
                page.setOrders(ordersFuture.join());
                page.setRecommendations(recommendFuture.join());
                page.setLogistics(logisticsFuture.join());
                page.setLoadTimeMs(System.currentTimeMillis() - start);
                return page;
            }, executor)
            .orTimeout(3, TimeUnit.SECONDS)  // 整体超时3秒
            .exceptionally(ex -> {
                log.error("加载页面数据超时或失败", ex);
                return PageData.empty();
            });
    }
}
```

## 十、面试要点

### Q1: CompletableFuture 和 Future 的区别？

**A：** CompletableFuture 是 Future 的增强版，主要增加了：
1. **回调机制**：可以注册 thenApply 等回调，完成后自动执行，无需阻塞等待
2. **组合能力**：thenCompose（链式依赖）、thenCombine（合并两个独立结果）、allOf/anyOf（批量处理）
3. **异常处理**：exceptionally、handle、whenComplete 三层处理
4. **手动完成**：可以 complete() / completeExceptionally() 手动设置结果

### Q2: thenApply 和 thenCompose 的区别？

**A：** 
- `thenApply` 类似 `map`：接收 `Function<T, R>`，返回 `CompletableFuture<R>`
- `thenCompose` 类似 `flatMap`：接收 `Function<T, CompletableFuture<R>>`，返回 `CompletableFuture<R>`（自动展平）
- 当下一步也是异步操作时用 thenCompose，避免 `CompletableFuture<CompletableFuture<R>>` 嵌套。

### Q3: CompletableFuture 默认使用什么线程池？

**A：** 默认使用 `ForkJoinPool.commonPool()`，并行度为 CPU核心数-1。这是全局共享的线程池，所有应用的 CompletableFuture 共用。如果 commonPool 被慢任务占满，会影响其他异步任务。**推荐为关键任务使用独立线程池。**

### Q4: exceptionally、handle、whenComplete 的区别？

**A：**
- `exceptionally`：只在异常时触发，类似 catch，可以返回降级值
- `handle`：无论成功失败都触发，类似 try-catch-finally，可以修改结果
- `whenComplete`：无论成功失败都触发，但不能修改结果，异常会继续传播，适合日志记录

### Q5: allOf 和 anyOf 的异常行为？

**A：** 
- `allOf`：任一 Future 异常时，allOf 的 Future 也会异常完成。但其他 Future 不会自动取消，仍在执行。需要给每个 Future 单独加 exceptionally 兜底。
- `anyOf`：第一个完成的 Future（无论成功或异常）的结果就是 anyOf 的结果。其他 Future 仍在执行。

### Q6: 如何给 CompletableFuture 设置超时？

**A：** 
- JDK 8：`future.get(5, TimeUnit.SECONDS)` 阻塞等待超时
- JDK 9+：`future.orTimeout(5, TimeUnit.SECONDS)` 异步超时（抛 TimeoutException）
- JDK 9+：`future.completeOnTimeout(default, 5, TimeUnit.SECONDS)` 异步超时返回默认值

## 十一、总结

CompletableFuture 是 Java 异步编程的核心工具：

1. **创建**：supplyAsync（有返回值）、runAsync（无返回值），推荐使用自定义线程池
2. **串行**：thenApply（转换）、thenAccept（消费）、thenRun（执行）
3. **组合**：thenCombine（合并两个独立结果）、thenCompose（链式依赖）
4. **批量**：allOf（全部完成）、anyOf（任一完成）
5. **异常**：exceptionally（降级）、handle（统一处理）、whenComplete（日志）
6. **超时**：orTimeout / completeOnTimeout（JDK 9+）

核心原则：
- **优先使用异步版本**（Async后缀）避免回调在调用线程同步执行
- **使用独立线程池**避免 commonPool 共享问题
- **合理使用 thenCompose** 避免嵌套和阻塞
- **给每个 Future 加异常兜底**防止单点失败扩散
- **设置超时**避免永久阻塞
