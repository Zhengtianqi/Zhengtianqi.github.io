---
title: 虚拟线程(Loom)：Java并发的未来
date: 2026-08-25
category: 基础知识
tag: ["Java", "虚拟线程", "Project Loom", "并发", "JDK21"]
---

# 虚拟线程(Loom)：Java并发的未来

> 虚拟线程是Project Loom的核心成果，以极低的成本实现百万级并发，是Java并发编程的革命性突破。
> 本文系统介绍虚拟线程的设计理念、核心特性和实战应用，帮助你拥抱Java并发的未来。

## 一、线程模型演进

### 1.1 并发模型对比

| 模型 | 特点 | 优点 | 缺点 |
|------|------|------|------|
| 平台线程 | 1:1映射OS线程 | 稳定可靠 | 资源消耗大 |
| 协程 | M:N映射 | 轻量级 | 需要特殊支持 |
| 虚拟线程 | M:N映射 | 轻量级+平台线程API | 新特性 |

### 1.2 平台线程的局限

```
平台线程问题：

1. 资源消耗
   - 每个线程约1MB栈空间
   - 上下文切换成本高
   - 1000个线程 ≈ 1GB内存

2. 编程复杂
   - 线程池配置复杂
   - 异步编程困难
   - 调试困难

3. 扩展性限制
   - 难以支持百万并发
   - 线程池大小难以确定
```

## 二、虚拟线程核心特性

### 2.1 设计理念

```
虚拟线程架构：

┌─────────────────────────────────────────────────────────────┐
│                    应用层                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  虚拟线程  虚拟线程  虚拟线程  虚拟线程  虚拟线程  ...   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ (M:N映射)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    载体线程池                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │  载体线程    │  │  载体线程    │  │  载体线程    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    操作系统线程                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心特性

| 特性 | 说明 |
|------|------|
| 轻量级 | 几KB内存，支持百万并发 |
| 平台线程API | 兼容Thread API |
| 阻塞不浪费 | 阻塞时释放载体线程 |
| 结构化并发 | 结构化并发API |
| 作用域值 | Scoped Values替代ThreadLocal |

## 三、虚拟线程使用

### 3.1 创建虚拟线程

```java
// 方式1：Thread.ofVirtual()
Thread vThread = Thread.ofVirtual()
    .name("vthread-", 0)
    .start(() -> {
        System.out.println("Hello from virtual thread");
    });

// 方式2：Thread.ofVirtual().factory()
ThreadFactory factory = Thread.ofVirtual()
    .name("vthread-", 0)
    .factory();
Thread vThread = factory.newThread(() -> {
    System.out.println("Hello from virtual thread");
});

// 方式3：Executors.newVirtualThreadPerTaskExecutor()
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
}
```

### 3.2 与平台线程对比

```java
// 平台线程
ExecutorService platformExecutor = Executors.newFixedThreadPool(100);
for (int i = 0; i < 10000; i++) {
    platformExecutor.submit(() -> {
        // 100个线程处理10000个任务
        // 可能排队等待
    });
}

// 虚拟线程
try (var virtualExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10000; i++) {
        virtualExecutor.submit(() -> {
            // 10000个虚拟线程并发执行
            // 每个任务一个虚拟线程
        });
    }
}
```

## 四、虚拟线程最佳实践

### 4.1 适用场景

| 场景 | 推荐度 | 原因 |
|------|--------|------|
| IO密集型 | ⭐⭐⭐⭐⭐ | 阻塞时释放载体线程 |
| 高并发连接 | ⭐⭐⭐⭐⭐ | 支持百万并发 |
| 简单同步代码 | ⭐⭐⭐⭐⭐ | 无需修改代码 |
| CPU密集型 | ⭐⭐ | 无性能优势 |

### 4.2 不适用场景

```java
// 问题1：synchronized阻塞
// 虚拟线程在synchronized内阻塞时，会固定载体线程
synchronized (lock) {
    // 阻塞时不会释放载体线程
    Thread.sleep(Duration.ofSeconds(1));
}

// 解决：使用ReentrantLock
private final Lock lock = new ReentrantLock();

lock.lock();
try {
    // 阻塞时会释放载体线程
    Thread.sleep(Duration.ofSeconds(1));
} finally {
    lock.unlock();
}
```

### 4.3 结构化并发

```java
// 结构化并发API (JDK 21 Preview)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> user = scope.fork(() -> findUser(userId));
    Future<Integer> order = scope.fork(() -> fetchOrder(orderId));
    
    scope.join();
    
    // 两个任务都完成
    return new UserOrder(user.resultNow(), order.resultNow());
}
```

### 4.4 作用域值

```java
// Scoped Values (替代ThreadLocal)
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

public void handleRequest() {
    ScopedValue.where(CURRENT_USER, user).run(() -> {
        // 在虚拟线程中可访问
        processRequest();
    });
}

private void processRequest() {
    User user = CURRENT_USER.get();  // 无需传递参数
}
```

## 五、实战案例

### 5.1 高并发HTTP服务

```java
@SpringBootApplication
public class VirtualThreadApplication {
    
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(VirtualThreadApplication.class);
        
        // 配置虚拟线程
        app.setDefaultProperties(Map.of(
            "server.tomcat.threads.max", "200",
            "spring.threads.virtual.enabled", "true"
        ));
        
        app.run(args);
    }
}

// 或者配置Tomcat
@Bean
public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
    return factory -> factory.addConnectorCustomizers(connector -> {
        ProtocolHandler handler = connector.getProtocolHandler();
        if (handler instanceof AbstractProtocol<?> protocol) {
            protocol.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        }
    });
}
```

### 5.2 数据库连接池优化

```java
// 问题：虚拟线程+数据库连接池
// 传统连接池会限制并发

// 解决：使用虚拟线程感知的连接池
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(100);  // 小连接池

// 虚拟线程会等待连接，但不会阻塞载体线程
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Void>> futures = new ArrayList<>();
    
    for (int i = 0; i < 10000; i++) {
        futures.add(executor.submit(() -> {
            try (var conn = dataSource.getConnection()) {
                // 使用连接
                executeQuery(conn);
            }
        }));
    }
    
    // 等待所有任务完成
    futures.forEach(Future::join);
}
```

### 5.3 异步任务编排

```java
@Service
public class OrderService {
    
    public CompletableFuture<OrderResult> createOrder(OrderRequest request) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // 虚拟线程执行异步任务
            CompletableFuture<Boolean> inventoryFuture = CompletableFuture
                .supplyAsync(() -> checkInventory(request), executor);
            
            CompletableFuture<Boolean> creditFuture = CompletableFuture
                .supplyAsync(() -> checkCredit(request), executor);
            
            CompletableFuture<Boolean> riskFuture = CompletableFuture
                .supplyAsync(() -> checkRisk(request), executor);
            
            // 等待所有检查完成
            return CompletableFuture.allOf(inventoryFuture, creditFuture, riskFuture)
                .thenApply(v -> {
                    // 创建订单
                    return createOrderInternal(request);
                });
        }
    }
}
```

## 六、性能对比

### 6.1 基准测试

```java
// 测试代码
public class VirtualThreadBenchmark {
    
    @Benchmark
    public void platformThreads() throws Exception {
        try (var executor = Executors.newFixedThreadPool(100)) {
            IntStream.range(0, 10000).forEach(i -> {
                executor.submit(() -> {
                    Thread.sleep(Duration.ofMillis(100));
                });
            });
        }
    }
    
    @Benchmark
    public void virtualThreads() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 10000).forEach(i -> {
                executor.submit(() -> {
                    Thread.sleep(Duration.ofMillis(100));
                });
            });
        }
    }
}
```

### 6.2 性能数据

| 指标 | 平台线程(100) | 虚拟线程(10000) | 提升 |
|------|---------------|-----------------|------|
| 吞吐量 | 1000任务/秒 | 10000任务/秒 | 10x |
| 内存占用 | 100MB | 10MB | 10x |
| 上下文切换 | 高 | 低 | - |
| 响应时间 | 100ms | 10ms | 10x |

## 七、迁移指南

### 7.1 迁移步骤

```
迁移步骤：

1. 评估适用性
   ├─ IO密集型 → 推荐迁移
   ├─ CPU密集型 → 不推荐迁移
   └─ 混合型 → 部分迁移

2. 升级JDK
   └─ 升级到JDK 21+

3. 代码修改
   ├─ 替换线程池为虚拟线程执行器
   ├─ 检查synchronized使用
   └─ 测试验证

4. 性能测试
   └─ 对比迁移前后性能
```

### 7.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 性能未提升 | CPU密集型任务 | 不适用虚拟线程 |
| 内存溢出 | 虚拟线程数量过多 | 控制并发数量 |
| 死锁 | synchronized阻塞 | 使用ReentrantLock |

## 八、最佳实践

### 8.1 使用建议

1. **优先使用虚拟线程**：IO密集型场景
2. **避免synchronized**：使用ReentrantLock
3. **控制并发数量**：避免创建过多虚拟线程
4. **监控和调试**：使用JFR和JMC

### 8.2 注意事项

| 注意点 | 说明 |
|--------|------|
| JDK版本 | 需要JDK 21+ |
| 框架支持 | Spring Boot 3.2+ |
| 连接池 | 使用虚拟线程感知的连接池 |
| ThreadLocal | 考虑使用Scoped Values |
