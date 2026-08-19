---
title: CompletableFuture异步编程完全指南
date: 2026-08-24
category: 基础知识
tag: ["Java", "异步编程", "CompletableFuture", "并发"]
---

# CompletableFuture异步编程完全指南

> CompletableFuture是Java 8引入的异步编程工具，支持链式调用、组合、异常处理，是现代Java异步编程的核心。
> 本文系统介绍CompletableFuture的核心API、使用场景和实战案例，帮助你掌握异步编程的精髓。

## 一、异步编程演进

### 1.1 Java异步编程方式对比

| 方式 | 特点 | 缺点 |
|------|------|------|
| Thread | 基础线程 | 手动管理，无返回值 |
| Runnable/Callable | 定义任务 | 需要手动执行 |
| Future | 获取结果 | 阻塞等待，无链式 |
| CompletableFuture | 异步+链式 | 功能强大 |

### 1.2 CompletableFuture核心能力

```
CompletableFuture能力：

1. 异步执行
   supplyAsync() / runAsync()

2. 链式调用
   thenApply() / thenAccept() / thenRun()

3. 组合操作
   thenCompose() / thenCombine() / allOf()

4. 异常处理
   exceptionally() / handle() / whenComplete()

5. 结果转换
   applyToEither() / acceptEither()
```

## 二、基础API详解

### 2.1 创建CompletableFuture

```java
// 1. 异步执行有返回值的任务
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    return fetchData();
});

// 2. 异步执行无返回值的任务
CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
    saveData();
});

// 3. 指定线程池
ExecutorService executor = Executors.newFixedThreadPool(10);
CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
    return fetchData();
}, executor);
```

### 2.2 链式调用

```java
// thenApply: 转换结果
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> getUserId())
    .thenApply(userId -> getUser(userId))
    .thenApply(user -> user.getName());

// thenAccept: 消费结果
CompletableFuture<Void> future = CompletableFuture
    .supplyAsync(() -> getUserId())
    .thenAccept(userId -> log.info("User ID: {}", userId));

// thenRun: 执行后续操作
CompletableFuture<Void> future = CompletableFuture
    .supplyAsync(() -> getUserId())
    .thenRun(() -> log.info("操作完成"));
```

### 2.3 异步链式调用

```java
// thenApplyAsync: 异步转换
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> getUserId())
    .thenApplyAsync(userId -> getUser(userId))  // 异步执行
    .thenApplyAsync(user -> user.getName());    // 异步执行

// thenCompose: 扁平化嵌套(避免Future<Future<T>>)
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> getUserId())
    .thenCompose(userId -> getUser(userId));  // 返回CompletableFuture
```

## 三、组合操作

### 3.1 两个Future组合

```java
// thenCombine: 组合两个结果
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");

CompletableFuture<String> result = future1.thenCombine(future2, 
    (s1, s2) -> s1 + " " + s2);

// thenAcceptBoth: 消费两个结果
future1.thenAcceptBoth(future2, (s1, s2) -> {
    log.info("Result: {} {}", s1, s2);
});

// runAfterBoth: 两个都完成后执行
future1.runAfterBoth(future2, () -> {
    log.info("Both completed");
});
```

### 3.2 任一完成

```java
// applyToEither: 任一完成时转换
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> fetchFromSource1());
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> fetchFromSource2());

CompletableFuture<String> result = future1.applyToEither(future2, 
    response -> response);

// acceptEither: 任一完成时消费
future1.acceptEither(future2, response -> {
    log.info("Got response: {}", response);
});

// runAfterEither: 任一完成后执行
future1.runAfterEither(future2, () -> {
    log.info("One completed");
});
```

### 3.3 多个Future组合

```java
// allOf: 所有完成
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "A");
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "B");
CompletableFuture<String> f3 = CompletableFuture.supplyAsync(() -> "C");

CompletableFuture<Void> allFuture = CompletableFuture.allOf(f1, f2, f3);

// 等待所有完成后获取结果
CompletableFuture<List<String>> result = allFuture.thenApply(v -> 
    Arrays.asList(f1.join(), f2.join(), f3.join())
);

// anyOf: 任一完成
CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(f1, f2, f3);
```

## 四、异常处理

### 4.1 异常处理API

```java
// exceptionally: 异常时的默认值
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData())
    .exceptionally(ex -> {
        log.error("Error: ", ex);
        return "default";
    });

// handle: 处理结果和异常
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData())
    .handle((result, ex) -> {
        if (ex != null) {
            log.error("Error: ", ex);
            return "default";
        }
        return result;
    });

// whenComplete: 完成时执行(不改变结果)
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData())
    .whenComplete((result, ex) -> {
        if (ex != null) {
            log.error("Error: ", ex);
        } else {
            log.info("Success: {}", result);
        }
    });
```

### 4.2 异常处理最佳实践

```java
// 链式异常处理
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> {
        if (random.nextBoolean()) {
            throw new RuntimeException("Error");
        }
        return "Success";
    })
    .exceptionally(ex -> {
        log.error("Caught exception: ", ex);
        return "Fallback";
    })
    .thenApply(result -> {
        // 继续处理
        return result.toUpperCase();
    });

// 超时处理
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData())
    .completeOnTimeout("Timeout", 3, TimeUnit.SECONDS);
```

## 五、实战案例

### 5.1 并行查询优化

```java
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private CreditMapper creditMapper;
    
    // 串行查询(慢)
    public UserDetailVO getUserDetail(Long userId) {
        User user = userMapper.selectById(userId);
        List<Order> orders = orderMapper.selectByUserId(userId);
        Credit credit = creditMapper.selectByUserId(userId);
        return buildVO(user, orders, credit);
    }
    
    // 并行查询(快)
    public CompletableFuture<UserDetailVO> getUserDetailAsync(Long userId) {
        CompletableFuture<User> userFuture = CompletableFuture
            .supplyAsync(() -> userMapper.selectById(userId));
        
        CompletableFuture<List<Order>> orderFuture = CompletableFuture
            .supplyAsync(() -> orderMapper.selectByUserId(userId));
        
        CompletableFuture<Credit> creditFuture = CompletableFuture
            .supplyAsync(() -> creditMapper.selectByUserId(userId));
        
        return userFuture.thenCombine(orderFuture, (user, orders) -> 
            user).thenCombine(creditFuture, (user, credit) -> 
            buildVO(user, orderFuture.join(), credit));
    }
}
```

### 5.2 并发调用外部服务

```java
@Service
public class AggregationService {
    
    public CompletableFuture<AggregationResult> aggregate(String param) {
        CompletableFuture<String> future1 = callService1(param);
        CompletableFuture<String> future2 = callService2(param);
        CompletableFuture<String> future3 = callService3(param);
        
        return CompletableFuture.allOf(future1, future2, future3)
            .thenApply(v -> AggregationResult.builder()
                .result1(future1.join())
                .result2(future2.join())
                .result3(future3.join())
                .build());
    }
    
    // 带超时的调用
    private CompletableFuture<String> callService1(String param) {
        return CompletableFuture
            .supplyAsync(() -> {
                // 调用外部服务
                return httpClient.get("http://service1/api?param=" + param);
            })
            .completeOnTimeout("timeout", 3, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                log.error("Service1调用失败: ", ex);
                return "error";
            });
    }
}
```

### 5.3 异步任务编排

```java
@Service
public class TaskOrchestration {
    
    public void executeWorkflow(String taskId) {
        // 第一步：验证
        CompletableFuture<Boolean> validateFuture = CompletableFuture
            .supplyAsync(() -> validateTask(taskId));
        
        // 第二步：处理(依赖验证)
        CompletableFuture<String> processFuture = validateFuture
            .thenApplyAsync(valid -> {
                if (!valid) throw new RuntimeException("验证失败");
                return processTask(taskId);
            });
        
        // 第三步：保存(依赖处理)
        CompletableFuture<Void> saveFuture = processFuture
            .thenAcceptAsync(result -> saveResult(taskId, result));
        
        // 第四步：通知(独立执行)
        CompletableFuture<Void> notifyFuture = processFuture
            .thenRunAsync(() -> sendNotification(taskId));
        
        // 等待所有完成
        CompletableFuture.allOf(saveFuture, notifyFuture)
            .whenComplete((v, ex) -> {
                if (ex != null) {
                    log.error("工作流执行失败: ", ex);
                } else {
                    log.info("工作流执行完成");
                }
            });
    }
}
```

## 六、线程池配置

### 6.1 自定义线程池

```java
@Configuration
public class AsyncConfig {
    
    @Bean("asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(1000);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

// 使用自定义线程池
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData(), asyncExecutor);
```

### 6.2 避免ForkJoinPool.commonPool

```java
// 问题：默认使用ForkJoinPool.commonPool
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData());

// 解决：指定线程池
ExecutorService executor = Executors.newFixedThreadPool(10);
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchData(), executor);
```

## 七、最佳实践

### 7.1 使用建议

| 场景 | 建议 |
|------|------|
| IO密集型 | 使用CompletableFuture |
| CPU密集型 | 考虑并行流 |
| 简单转换 | 使用thenApply |
| 扁平化嵌套 | 使用thenCompose |
| 组合多个结果 | 使用thenCombine/allOf |

### 7.2 常见陷阱

```java
// 陷阱1：未处理异常
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    throw new RuntimeException("Error");
});
// 未调用exceptionally/handle，异常被吞

// 陷阱2：阻塞获取结果
String result = future.get();  // 可能阻塞
// 应使用completeOnTimeout或exceptionally

// 陷阱3：未指定线程池
// 默认使用commonPool，可能阻塞其他CompletableFuture
```

### 7.3 监控与调试

```java
// 添加日志
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> {
        log.info("开始执行");
        return fetchData();
    })
    .whenComplete((result, ex) -> {
        if (ex != null) {
            log.error("执行失败: ", ex);
        } else {
            log.info("执行完成: {}", result);
        }
    });
```
