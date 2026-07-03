---
title: Spring Boot 3 新特性全景：从 Jakarta EE 到原生镜像
tag: ["Spring Boot 3", "Jakarta EE", "GraalVM", "虚拟线程", "Spring"]
category: 框架
date: 2026-07-03
---

# Spring Boot 3 新特性全景：从 Jakarta EE 到原生镜像

Spring Boot 3 是五年来最大的版本跃迁。Jakarta EE 迁移、GraalVM 原生镜像、虚拟线程支持——每个都是重大变革。哪些影响你的代码？怎么平滑升级？

---

## 一、Spring Boot 3 核心变化

### 1.1 版本跃迁

```
Spring Boot 版本演进：
  2.x (2018-2022) → Java 8+
  3.0 (2022-11)   → Java 17+
  3.1 (2023-05)   → Docker Compose 支持
  3.2 (2023-11)   → 虚拟线程、RestClient
  3.3 (2024-05)   → Pulsar 支持、结构化日志
  3.4 (2025-11)   → 进一步原生镜像优化

核心变化：
  1. Java 17 最低版本（推荐 21）
  2. Jakarta EE 9+（javax → jakarta）
  3. GraalVM 原生镜像一等公民
  4. 虚拟线程支持（3.2+）
  5. 可观测性内置（Micrometer + OTel）
```

---

## 二、Jakarta EE 迁移

### 2.1 javax → jakarta

```java
// Spring Boot 2.x (javax)
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;

// Spring Boot 3.x (jakarta)
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;

// 影响范围：
//   javax.servlet.*  → jakarta.servlet.*
//   javax.persistence.* → jakarta.persistence.*
//   javax.validation.* → jakarta.validation.*
//   javax.annotation.* → jakarta.annotation.*
//   javax.mail.* → jakarta.mail.*
```

### 2.2 升级注意事项

```xml
<!-- 第三方依赖也需要升级到 Jakarta 版本 -->
<!-- Tomcat 10+（不是 9）-->
<!-- Hibernate 6+（不是 5）-->
<!-- Jetty 11+ -->

<!-- Maven 升级 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
</parent>

<!-- 需要升级的依赖 -->
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <!-- Tomcat 10+ 才支持 Jakarta -->
</dependency>

<!-- 可能需要替换的依赖 -->
<!-- javax.servlet → jakarta.servlet -->
<!-- javax.mail (JavaMail) → jakarta.mail -->
<!-- swagger 2 → springdoc-openapi（OpenAPI 3）-->
```

### 2.3 自动迁移工具

```bash
# 使用 Spring Boot Migrator
# https://github.com/spring-projects-experimental/spring-boot-migrator

# 或使用 OpenRewrite
# pom.xml 添加插件
<plugin>
    <groupId>org.openrewrite.maven</groupId>
    <artifactId>rewrite-maven-plugin</artifactId>
    <version>5.0.0</version>
    <configuration>
        <activeRecipes>
            <recipe>org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta</recipe>
        </activeRecipes>
    </configuration>
</plugin>

# 执行迁移
mvn rewrite:run
```

---

## 三、GraalVM 原生镜像

### 3.1 什么是原生镜像

```
传统 JVM 启动：
  加载 class → 解析 → JIT 编译 → 运行
  启动时间：2-10 秒
  内存占用：200MB+

GraalVM 原生镜像：
  AOT 编译 → 生成独立可执行文件 → 直接运行
  启动时间：0.01-0.1 秒
  内存占用：20-50MB

适用场景：
  ✅ Serverless / FaaS（冷启动敏感）
  ✅ CLI 工具
  ✅ 微服务（大量实例）
  ❌ 长时间运行的重型应用（JIT 优化更好）
  ❌ 需要动态类加载的场景
```

### 3.2 使用

```bash
# 1. 添加 native-maven-plugin
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
</plugin>

# 2. 创建 native profile
<profiles>
    <profile>
        <id>native</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.graalvm.buildtools</groupId>
                    <artifactId>native-maven-plugin</artifactId>
                    <configuration>
                        <buildArgs>
                            <buildArg>-H:Name=myapp</buildArg>
                            <buildArg>-H:+ReportExceptionStackTraces</buildArg>
                        </buildArgs>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>

# 3. 构建原生镜像（需要 GraalVM）
mvn -Pnative native:compile

# 4. 运行
./target/myapp
# 启动时间：0.045s
# 内存：28MB
```

### 3.3 限制与解决

```java
// 限制 1：反射需要配置
// 问题：GraalVM AOT 编译不知道哪些类会被反射加载
@RegisterReflectionForBinding(OrderDTO.class)  // 显式注册
public class OrderService { ... }

// 或在 META-INF/native-image/reflect-config.json 中配置
[
  {
    "name": "com.example.OrderDTO",
    "allDeclaredConstructors": true,
    "allDeclaredMethods": true,
    "allDeclaredFields": true
  }
]

// 限制 2：动态代理
// Spring Boot 3 自动处理大部分代理，但自定义代理需要配置

// 限制 3：资源文件
// src/main/resources 下的文件需要显式包含
@ImportResource("classpath:application.yml")

// 限制 4：JNI / 第三方 native 库
// 需要额外配置 --native-image-info

// Spring Boot 3 的 Native Hints
@NativeHint(
    options = "--enable-url-protocols=http,https"
)
@NativeHint(
    trigger = MySqlDataSource.class,
    types = @TypeHint(typeNames = "com.mysql.cj.jdbc.MysqlDataSource")
)
public class MyApp { ... }
```

---

## 四、虚拟线程支持

### 4.1 开启虚拟线程

```java
// Spring Boot 3.2+ 开启虚拟线程
// application.yml
spring:
  threads:
    virtual:
      enabled: true

// 效果：
// Tomcat/Jetty 的请求处理线程切换为虚拟线程
// 每个 HTTP 请求在虚拟线程中处理
// 不再需要手动管理线程池
```

### 4.2 性能对比

```
测试条件：10000 并发请求，每个请求 200ms IO 等待

平台线程（200 线程池）：
  QPS: ~1000
  内存: ~2GB（200 线程 × 1MB 栈）
  P99: 5000ms（排队等待线程）

虚拟线程：
  QPS: ~48000
  内存: ~200MB
  P99: 250ms
  → 48 倍提升！

注意：CPU 密集型任务没有提升（虚拟线程不增加 CPU）
虚拟线程优势在 IO 密集型场景
```

### 4.3 注意事项

```java
// ⚠️ 虚拟线程 + synchronized = pinning
// synchronized 块会导致虚拟线程"钉"在载体线程上

// 问题代码
public synchronized Order getOrder(String id) {
    // 虚拟线程会被钉在载体线程上
    // 导致载体线程被占用
    return db.findById(id);
}

// 修复：用 ReentrantLock 替代 synchronized
private final ReentrantLock lock = new ReentrantLock();

public Order getOrder(String id) {
    lock.lock();
    try {
        return db.findById(id);
    } finally {
        lock.unlock();
    }
}

// 检测 pinning
// JDK 21+ 添加 JVM 参数
-Djdk.tracePinnedThreads=full
```

---

## 五、可观测性内置

### 5.1 Micrometer + OpenTelemetry

```yaml
# Spring Boot 3 内置可观测性
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: order-service
  tracing:
    sampling:
      probability: 1.0  # 采样率

# 依赖
# spring-boot-starter-actuator
# micrometer-registry-prometheus
# micrometer-tracing-bridge-otel
# opentelemetry-exporter-otlp
```

### 5.2 自定义指标

```java
@RestController
public class OrderController {
    
    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderTimer;
    
    public OrderController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.orderCounter = Counter.builder("order.created")
            .description("Number of orders created")
            .tag("type", "normal")
            .register(meterRegistry);
        this.orderTimer = Timer.builder("order.processing")
            .description("Order processing time")
            .register(meterRegistry);
    }
    
    @PostMapping("/orders")
    public Order createOrder(@RequestBody OrderRequest req) {
        return orderTimer.record(() -> {
            Order order = orderService.create(req);
            orderCounter.increment();
            return order;
        });
    }
}

// Prometheus 查询
// rate(order_created_total{type="normal"}[1m])
// histogram_quantile(0.99, rate(order_processing_seconds_bucket[5m]))
```

---

## 六、RestClient（3.2+）

```java
// Spring Boot 3.2 新增 RestClient（替代 RestTemplate）

// 创建
@Bean
RestClient restClient(RestClient.Builder builder) {
    return builder
        .baseUrl("https://api.example.com")
        .defaultHeader("Authorization", "Bearer token")
        .build();
}

// 使用
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable String id) {
    return restClient.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .body(Order.class);
}

// POST
@PostMapping("/orders")
public Order createOrder(@RequestBody OrderRequest req) {
    return restClient.post()
        .uri("/orders")
        .contentType(MediaType.APPLICATION_JSON)
        .body(req)
        .retrieve()
        .body(Order.class);
}

// 错误处理
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable String id) {
    return restClient.get()
        .uri("/orders/{id}", id)
        .retrieve()
        .onStatus(status -> status.is4xxClientError(), 
            (req, resp) -> {
                throw new NotFoundException("Order not found");
            })
        .body(Order.class);
}

// RestClient vs RestTemplate：
//   RestClient: 流式 API、不可变、线程安全
//   RestTemplate: 模板模式、可变、已过时
//   WebClient: 响应式、非阻塞
```

---

## 七、其他重要新特性

### 7.1 Docker Compose 支持

```yaml
# spring-boot-docker-compose
# application.yml
spring:
  docker:
    compose:
      enabled: true
      file: docker-compose.yml

# 启动时自动启动 Docker Compose
# 停止时自动关闭
# 自动连接数据库/Redis 等
```

### 7.2 结构化日志（3.4+）

```yaml
# application.yml
logging:
  structured:
    format:
      console: ecs  # Elastic Common Schema
      # 或 json / gelf
```

### 7.3 Problem Details（RFC 7807）

```java
// Spring Boot 3 自动支持 RFC 7807 错误格式
@ExceptionHandler(OrderNotFound.class)
public ProblemDetail handleNotFound(OrderNotFound ex) {
    ProblemDetail problem = ProblemDetail.forStatus(404);
    problem.setTitle("Order Not Found");
    problem.setDetail(ex.getMessage());
    problem.setProperty("orderId", ex.getOrderId());
    return problem;
}

// 输出
// {
//   "type": "about:blank",
//   "title": "Order Not Found",
//   "status": 404,
//   "detail": "Order 12345 not found",
//   "orderId": "12345"
// }
```

---

## 八、升级清单

```
升级步骤：
  1. Java 升级到 17+（推荐 21）
  2. Spring Boot 升级到 3.x
  3. javax → jakarta 包名迁移
  4. 第三方依赖升级到 Jakarta 版本
  5. 测试框架升级（JUnit 5、Mockito 5）
  6. 配置文件检查（弃用属性替换）
  7. 如用 GraalVM：配置反射/资源
  8. 如用虚拟线程：替换 synchronized
  9. 可观测性配置

常见问题：
  1. Swagger 2 不兼容 → 迁移到 springdoc-openapi
  2. MyBatis 旧版不兼容 → 升级到 3.5.13+
  3. Druid 旧版不兼容 → 升级到 1.2.20+
  4. MapStruct 等代码生成工具需要升级
```

---

## 九、面试要点

### Q：Spring Boot 3 最大的变化是什么？

三个最大变化：
1. Jakarta EE 迁移（javax → jakarta），需要全量包名替换
2. GraalVM 原生镜像支持，AOT 编译实现毫秒级启动
3. Java 17 最低版本，支持虚拟线程（3.2+）

### Q：虚拟线程在 Spring Boot 3 中怎么用？

一行配置开启：`spring.threads.virtual.enabled=true`。Tomcat 请求处理线程切换为虚拟线程，每个请求在虚拟线程中处理。适合 IO 密集型场景，QPS 可提升几十倍。注意：synchronized 块会导致虚拟线程 pinning，需替换为 ReentrantLock。

### Q：GraalVM 原生镜像有什么限制？

1. 反射需要显式配置（注册类或 JSON 配置）
2. 动态代理受限
3. 资源文件需要显式包含
4. JNI/native 库需要额外配置
5. 构建时间较长
Spring Boot 3 提供 Native Hints 简化配置，大部分框架级反射已自动处理。

---

## 十、总结

Spring Boot 3 核心升级点：

```
Jakarta EE → 包名迁移（javax → jakarta）
GraalVM    → 原生镜像（毫秒启动、低内存）
虚拟线程   → IO 密集场景 QPS 倍增
可观测性   → Micrometer + OTel 内置
RestClient → 替代 RestTemplate
Docker Compose → 开发环境自动管理
```

记住：**Spring Boot 3 是五年来最大升级，Java 17 是门槛，Jakarta 是必修课，虚拟线程是杀手锏**。
