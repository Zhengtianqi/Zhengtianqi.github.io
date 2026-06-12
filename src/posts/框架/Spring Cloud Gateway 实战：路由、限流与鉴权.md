---
title: Spring Cloud Gateway 实战：路由、限流与鉴权
date: 2026-06-11
category: spring
tag: ["Gateway", "路由"]
---

# Spring Cloud Gateway 实战：路由、限流与鉴权

## 前言

在微服务架构中，API 网关是流量的"前门"。它承担着路由转发、限流、鉴权、日志、跨域处理等横切关注点。Spring Cloud Gateway 作为 Spring 生态的网关解决方案，基于 WebFlux 反应式编程模型，性能出色，生态完善。

本文从实战出发，系统讲解 Spring Cloud Gateway 的核心概念、路由配置、限流鉴权和生产环境调优。

---

## 一、为什么需要 API 网关？

### 1.1 微服务架构中的痛点

```
没有网关时：
  客户端 ──→ 用户服务 (8081)
  客户端 ──→ 订单服务 (8082)
  客户端 ──→ 商品服务 (8083)

问题：
  - 客户端需要知道所有服务的地址
  - 认证逻辑在每个服务中重复
  - 跨域配置需要在每个服务中设置
  - 限流、日志等横切关注点散落各处
  - 前端调用多个不同域名/端口很麻烦

有了网关后：
  客户端 ──→ 网关 (8080) ──→ 用户服务
                │         ──→ 订单服务
                │         ──→ 商品服务
```

### 1.2 Spring Cloud Gateway vs Zuul

| 特性 | Spring Cloud Gateway | Netflix Zuul 1.x | Netflix Zuul 2.x |
|------|---------------------|------------------|------------------|
| 编程模型 | 反应式（Reactor） | 阻塞式（Servlet） | 反应式（Netty） |
| 性能 | 高 | 一般 | 高 |
| Spring 生态 | 原生集成 | 需要适配 | 需要适配 |
| 维护状态 | ✅ 活跃 | ❌ 停更 | ⚠️ 半维护 |
| 学习曲线 | 中等 | 低 | 高 |

**结论：新项目直接选 Spring Cloud Gateway。**

---

## 二、核心架构

### 2.1 三大核心概念

```
Route（路由）：
  网关的基本构建块。包含 ID、目标 URI、Predicate 集合和 Filter 集合。

Predicate（断言）：
  匹配 HTTP 请求的条件。Java 8 的 Predicate 函数式接口。
  例如：path=/api/users/**、host=*.example.com、header=X-API-Version

Filter（过滤器）：
  对请求/响应进行修改的拦截器。
  分为 GatewayFilter（路由级别）和 GlobalFilter（全局）
```

### 2.2 请求处理流程

```
Client → Gateway
  ↓
1. Gateway Handler Mapping：匹配 Route
  ↓
2. Predicate：判断请求是否满足条件
  ↓
3. Pre Filters：请求发送到下游前执行的过滤器链
  ↓
4. Proxy Filter：实际转发请求到下游服务
  ↓
5. Post Filters：收到下游响应后执行的过滤器链
  ↓
Client ← Response
```

### 2.3 项目搭建

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<!-- 注意：不要引入 spring-boot-starter-web，会冲突 -->
```

```yaml
# application.yml
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service  # lb:// 表示负载均衡
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
```

```java
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

---

## 三、路由配置详解

### 3.1 Predicate 断言类型

| 断言 | 说明 | 示例 |
|------|------|------|
| `Path` | 路径匹配 | `Path=/api/users/**` |
| `Host` | 域名匹配 | `Host=api.example.com` |
| `Method` | HTTP 方法 | `Method=GET,POST` |
| `Header` | 请求头匹配 | `Header=X-Request-Id,\d+` |
| `Query` | 查询参数匹配 | `Query=version,v2` |
| `Cookie` | Cookie 匹配 | `Cookie=sessionId,abc.*` |
| `RemoteAddr` | 客户端 IP | `RemoteAddr=192.168.1.0/24` |
| `Weight` | 权重路由（灰度） | `Weight=group1,80` |
| `Before/After/Between` | 时间匹配 | `After=2024-01-01T00:00:00+08:00[Asia/Shanghai]` |

### 3.2 路由配置示例

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 用户服务
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1

        # 订单服务：仅允许 GET 和 POST
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST
          filters:
            - StripPrefix=1

        # 内部管理接口：限制来源 IP
        - id: admin-service
          uri: lb://admin-service
          predicates:
            - Path=/api/admin/**
            - RemoteAddr=10.0.0.0/8,172.16.0.0/12
          filters:
            - StripPrefix=1

        # 第三方回调：按域名分流
        - id: callback-handler
          uri: lb://callback-service
          predicates:
            - Host=callback.example.com
            - Path=/webhook/**
```

### 3.3 Java 代码配置路由

```java
@Configuration
public class GatewayRouteConfig {

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("user-service", r -> r
                .path("/api/users/**")
                .filters(f -> f
                    .stripPrefix(1)
                    .addRequestHeader("X-Gateway-Source", "gateway")
                    .retry(3) // 重试 3 次
                )
                .uri("lb://user-service")
            )
            .route("order-service", r -> r
                .path("/api/orders/**")
                .and().method(HttpMethod.GET, HttpMethod.POST)
                .filters(f -> f.stripPrefix(1))
                .uri("lb://order-service")
            )
            .build();
    }
}
```

### 3.4 动态路由（基于注册中心）

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true            # 开启服务发现
          lower-case-service-id: true  # 服务名转小写
          # 自动为每个注册的服务创建路由
          # 例如：user-service → /user-service/**
```

```java
// 程序化动态路由（从数据库/配置中心加载）
@Component
public class DynamicRouteService {

    @Autowired
    private RouteDefinitionWriter routeDefinitionWriter;

    public void addRoute(RouteDefinition definition) {
        routeDefinitionWriter.save(Mono.just(definition)).subscribe();
    }

    public void deleteRoute(String routeId) {
        routeDefinitionWriter.delete(Mono.just(routeId)).subscribe();
    }

    public void updateRoute(RouteDefinition definition) {
        deleteRoute(definition.getId());
        addRoute(definition);
    }
}
```

---

## 四、过滤器体系

### 4.1 内置 GatewayFilter

| 过滤器 | 说明 |
|--------|------|
| `AddRequestHeader` | 添加请求头 |
| `AddRequestParameter` | 添加请求参数 |
| `AddResponseHeader` | 添加响应头 |
| `RemoveRequestHeader` | 移除请求头 |
| `RemoveResponseHeader` | 移除响应头 |
| `SetRequestHeader` | 设置（覆盖）请求头 |
| `SetResponseHeader` | 设置（覆盖）响应头 |
| `RewritePath` | 路径重写 |
| `StripPrefix` | 剥离路径前缀 |
| `PrefixPath` | 添加路径前缀 |
| `Retry` | 重试 |
| `RequestRateLimiter` | 限流 |
| `CircuitBreaker` | 熔断 |
| `RequestSize` | 请求体大小限制 |
| `SetStatus` | 设置响应状态码 |
| `RedirectTo` | 重定向 |

### 4.2 自定义 GatewayFilter

```java
@Component
public class LoggingGatewayFilterFactory
        extends AbstractGatewayFilterFactory<LoggingGatewayFilterFactory.Config> {

    public LoggingGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            long startTime = System.currentTimeMillis();

            log.info("Request: {} {} from {}",
                request.getMethod(), request.getURI(), request.getRemoteAddress());

            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                long duration = System.currentTimeMillis() - startTime;
                ServerHttpResponse response = exchange.getResponse();
                HttpStatusCode statusCode = response.getStatusCode();

                log.info("Response: {} {} {}ms",
                    request.getURI().getPath(), statusCode, duration);

                if (duration > config.getSlowThreshold()) {
                    log.warn("Slow request: {} {} {}ms",
                        request.getMethod(), request.getURI().getPath(), duration);
                }
            }));
        };
    }

    @Data
    public static class Config {
        private long slowThreshold = 3000; // 慢请求阈值（毫秒）
    }
}
```

```yaml
# 使用自定义过滤器
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - Logging=slowThreshold:2000
```

### 4.3 自定义 GlobalFilter

```java
@Component
@Order(-1) // 数字越小优先级越高
public class RequestIdGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 检查请求头中是否有 Request-Id
        String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-Id");
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString().replace("-", "");
        }

        // 添加到请求头（传递给下游）
        ServerHttpRequest request = exchange.getRequest().mutate()
            .header("X-Request-Id", requestId)
            .build();

        // 添加到响应头
        exchange.getResponse().getHeaders().set("X-Request-Id", requestId);

        // 存入 MDC 用于日志追踪
        exchange.getAttributes().put("requestId", requestId);

        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return -1; // 最早执行
    }
}
```

---

## 五、限流实现

### 5.1 RequestRateLimiter 原理

Spring Cloud Gateway 基于 **令牌桶算法** 实现限流，需要 Redis 存储令牌状态。

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter:
                  replenishRate: 10       # 每秒填充 10 个令牌
                  burstCapacity: 20       # 令牌桶容量 20
                  requestedTokens: 1      # 每次请求消耗 1 个令牌
```

### 5.2 自定义 KeyResolver

```java
@Configuration
public class RateLimiterConfig {

    // 按 IP 限流
    @Bean
    @Primary
    KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
        );
    }

    // 按用户限流（结合认证信息）
    @Bean
    KeyResolver userKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getHeaders().getFirst("X-User-Id")
        );
    }

    // 按接口限流
    @Bean
    KeyResolver apiKeyResolver() {
        return exchange -> Mono.just(
            exchange.getRequest().getPath().value()
        );
    }

    // 组合限流：IP + 接口
    @Bean
    KeyResolver combineKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress()
                .getAddress().getHostAddress();
            String path = exchange.getRequest().getPath().value();
            return Mono.just(ip + ":" + path);
        };
    }
}
```

### 5.3 精细化限流配置

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 登录接口严格限流（防暴力破解）
        - id: auth-service-login
          uri: lb://auth-service
          predicates:
            - Path=/auth/login
          filters:
            - name: RequestRateLimiter
              args:
                key-resolver: "#{@ipKeyResolver}"
                redis-rate-limiter.replenishRate: 1
                redis-rate-limiter.burstCapacity: 3
                redis-rate-limiter.requestedTokens: 1

        # 普通接口宽松限流
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - name: RequestRateLimiter
              args:
                key-resolver: "#{@userKeyResolver}"
                redis-rate-limiter.replenishRate: 50
                redis-rate-limiter.burstCapacity: 100
```

### 5.4 限流响应定制

```java
@Configuration
public class GatewayConfig {

    @Bean
    public WebExceptionHandler rateLimitExceptionHandler() {
        return (exchange, ex) -> {
            if (ex instanceof ResponseStatusException rse
                    && rse.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

                String body = """
                    {
                      "code": 10429,
                      "message": "请求频率超限，请稍后再试",
                      "data": null,
                      "timestamp": %d
                    }
                    """.formatted(System.currentTimeMillis());

                DataBuffer buffer = exchange.getResponse()
                    .bufferFactory()
                    .wrap(body.getBytes(StandardCharsets.UTF_8));

                return exchange.getResponse().writeWith(Mono.just(buffer));
            }
            return Mono.error(ex);
        };
    }
}
```

---

## 六、网关鉴权

### 6.1 JWT 校验 GlobalFilter

```java
@Component
@Order(0)
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // 白名单路径
    private static final List<String> WHITELIST = List.of(
        "/auth/login",
        "/auth/register",
        "/public/**",
        "/actuator/health"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // 白名单直接放行
        if (isWhitelisted(path)) {
            return chain.filter(exchange);
        }

        // 获取 Token
        String token = extractToken(exchange.getRequest());
        if (token == null) {
            return unauthorized(exchange, "未提供认证令牌");
        }

        // 验证 Token
        try {
            Claims claims = jwtTokenProvider.validateToken(token);
            // 将用户信息传递给下游服务
            ServerHttpRequest request = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Name", claims.get("username", String.class))
                .header("X-User-Roles", String.join(",",
                    claims.get("roles", List.class)))
                .build();

            return chain.filter(exchange.mutate().request(request).build());
        } catch (JwtException e) {
            return unauthorized(exchange, "令牌无效或已过期");
        }
    }

    private String extractToken(ServerHttpRequest request) {
        String bearer = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format("""
            {"code":401,"message":"%s","data":null}
            """, message);

        DataBuffer buffer = exchange.getResponse()
            .bufferFactory()
            .wrap(body.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private boolean isWhitelisted(String path) {
        return WHITELIST.stream().anyMatch(p ->
            new AntPathMatcher().match(p, path)
        );
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
```

### 6.2 权限校验 Filter

```java
@Component
@Order(1) // 在 JWT 校验之后
public class AuthorizationFilter implements GlobalFilter, Ordered {

    // 路径 → 所需角色映射（生产环境应从配置或数据库读取）
    private static final Map<String, List<String>> ROLE_MAPPING = Map.of(
        "/api/admin/**", List.of("ROLE_ADMIN"),
        "/api/reports/**", List.of("ROLE_ADMIN", "ROLE_ANALYST"),
        "/api/orders/manage/**", List.of("ROLE_ADMIN", "ROLE_OPERATOR")
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String userRoles = exchange.getRequest().getHeaders().getFirst("X-User-Roles");

        if (userRoles == null) {
            return chain.filter(exchange);
        }

        List<String> roles = Arrays.asList(userRoles.split(","));

        // 检查路径是否需要特定角色
        Optional<Map.Entry<String, List<String>>> required = ROLE_MAPPING.entrySet()
            .stream()
            .filter(e -> new AntPathMatcher().match(e.getKey(), path))
            .findFirst();

        if (required.isPresent()) {
            boolean hasRole = required.get().getValue().stream()
                .anyMatch(roles::contains);

            if (!hasRole) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                exchange.getResponse().getHeaders()
                    .setContentType(MediaType.APPLICATION_JSON);

                String body = """
                    {"code":403,"message":"权限不足，无法访问此资源","data":null}
                    """;

                DataBuffer buffer = exchange.getResponse()
                    .bufferFactory()
                    .wrap(body.getBytes(StandardCharsets.UTF_8));

                return exchange.getResponse().writeWith(Mono.just(buffer));
            }
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return 1;
    }
}
```

### 6.3 下游服务获取用户信息

```java
// 下游服务的拦截器
@Component
public class UserContextInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler) {
        // 从网关透传的 Header 中获取用户信息
        String userId = request.getHeader("X-User-Id");
        String userName = request.getHeader("X-User-Name");
        String userRoles = request.getHeader("X-User-Roles");

        if (userId != null) {
            UserContext context = new UserContext();
            context.setUserId(Long.parseLong(userId));
            context.setUsername(userName);
            context.setRoles(Arrays.asList(userRoles != null
                ? userRoles.split(",") : new String[0]));

            UserContextHolder.set(context);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
            HttpServletResponse response, Object handler, Exception ex) {
        UserContextHolder.clear();
    }
}
```

---

## 七、跨域配置

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins:
              - "https://www.example.com"
              - "http://localhost:3000"
            allowedMethods:
              - GET
              - POST
              - PUT
              - PATCH
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
```

```java
// Java 配置
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://www.example.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
```

---

## 八、灰度发布路由

### 8.1 Weight 断言（金丝雀发布）

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 稳定版：80% 流量
        - id: user-service-stable
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
            - Weight=stable, 80
          filters:
            - StripPrefix=1

        # 灰度版：20% 流量
        - id: user-service-canary
          uri: lb://user-service-canary
          predicates:
            - Path=/api/users/**
            - Weight=stable, 20
          filters:
            - StripPrefix=1
```

### 8.2 基于 Header 的灰度路由

```java
@Component
public class CanaryRouteFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String canary = request.getHeaders().getFirst("X-Canary");

        if ("true".equalsIgnoreCase(canary)) {
            // 修改请求，路由到灰度服务
            ServerHttpRequest mutated = request.mutate()
                .header("X-Route-To", "canary")
                .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -2; // 在 JWT 校验之前
    }
}
```

---

## 九、生产环境调优

### 9.1 Netty 线程配置

```yaml
spring:
  cloud:
    gateway:
      httpclient:
        # 连接超时
        connect-timeout: 5000
        # 响应超时
        response-timeout: 30s
        # 连接池
        pool:
          type: elastic
          max-idle-time: 60s
          max-life-time: 600s
          # elastic 类型下的配置
          max-connections: 1000
          acquire-timeout: 45000
```

### 9.2 Reactor Netty 底层配置

```java
@Component
public class NettyConfiguration {

    @Bean
    public ReactorResourceFactory reactorClientResourceFactory() {
        ReactorResourceFactory factory = new ReactorResourceFactory();

        // 调整工作线程数
        factory.setLoopResources(LoopResources.create(
            "gateway-http",        // 线程名前缀
            Runtime.getRuntime().availableProcessors(), // 工作线程数
            true                   // daemon 线程
        ));

        // 全局连接池
        ConnectionProvider provider = ConnectionProvider.builder("gateway-http-pool")
            .maxConnections(1000)
            .pendingAcquireMaxCount(5000)
            .pendingAcquireTimeout(Duration.ofSeconds(45))
            .maxIdleTime(Duration.ofSeconds(60))
            .maxLifeTime(Duration.ofMinutes(10))
            .build();

        factory.setConnectionProvider(provider);
        return factory;
    }
}
```

### 9.3 JVM 参数建议

```bash
# Gateway 网关的 JVM 参数
java -jar gateway.jar \
  -Xms2g -Xmx2g \                         # 固定堆大小，避免动态调整
  -XX:+UseG1GC \                           # G1 垃圾收集器
  -XX:MaxGCPauseMillis=200 \               # 最大 GC 暂停时间
  -XX:+DisableExplicitGC \                 # 禁止显式 GC
  -Dio.netty.allocator.type=pooled \       # Netty 池化内存
  -Dio.netty.noUnsafe=true \               # 安全模式（某些云环境需要）
  -Dreactor.netty.pool.leasingStrategy=fifo # 连接池 FIFO 策略
```

### 9.4 监控与可观测性

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,gateway
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}
```

```yaml
# 访问网关专属指标
GET /actuator/gateway/routes      # 路由列表
GET /actuator/gateway/routefilters  # 过滤器列表
GET /actuator/gateway/globalfilters # 全局过滤器列表
GET /actuator/metrics/gateway.requests  # 请求指标
```

### 9.5 熔断降级

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
          filters:
            - name: CircuitBreaker
              args:
                name: userServiceCircuitBreaker
                fallbackUri: forward:/fallback/user
```

```java
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/user")
    public Mono<Result<Void>> userFallback() {
        return Mono.just(Result.error(ErrorCode.SYS_SERVICE_UNAVAILABLE));
    }
}
```

### 9.6 常见坑与解决方案

**坑1：请求体只能读取一次**

```java
// 问题：GlobalFilter 中读取了 request body，下游拿不到
// 解决：缓存请求体
@Component
public class CacheBodyGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (exchange.getRequest().getHeaders().getContentType() != null
                && exchange.getRequest().getMethod() == HttpMethod.POST) {
            return DataBufferUtils.join(exchange.getRequest().getBody())
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    // 缓存
                    exchange.getAttributes().put("cachedRequestBody", bytes);

                    // 重建请求体
                    DataBuffer newBuffer = exchange.getResponse()
                        .bufferFactory().wrap(bytes);
                    ServerHttpRequest mutated = exchange.getRequest().mutate()
                        .header("Content-Length", String.valueOf(bytes.length))
                        .build();

                    return chain.filter(exchange.mutate()
                        .request(new CachedBodyServerHttpRequest(mutated, bytes)).build());
                });
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -3;
    }
}
```

**坑2：大文件上传内存溢出**

```yaml
spring:
  codec:
    max-in-memory-size: 10MB  # 限制内存中缓存的大小
```

---

## 十、总结

本文从实战出发，覆盖了 Spring Cloud Gateway 的核心使用场景：

| 场景 | 实现方式 |
|------|---------|
| 路由转发 | Route + Predicate |
| 动态路由 | RouteDefinitionWriter / Nacos |
| 请求处理 | GatewayFilter |
| 横切关注点 | GlobalFilter |
| 限流 | RequestRateLimiter + Redis |
| JWT 鉴权 | GlobalFilter 校验 + Header 透传 |
| 灰度发布 | Weight Predicate / Header 路由 |
| 跨域 | globalcors 配置 |
| 熔断降级 | CircuitBreaker + Fallback |

**核心建议**：
- Gateway 只做横切关注点（鉴权、限流、日志），不要放业务逻辑
- GlobalFilter 的 order 很重要，建议：缓存请求体（-3）→ 灰度路由（-2）→ 日志追踪（-1）→ JWT 校验（0）→ 权限检查（1）
- 连接池和超时配置必须根据下游服务的实际响应时间调整
- 配合注册中心（Nacos/Eureka）使用，享受动态上下线的便利
- 生产环境一定开启监控指标，关注网关的延迟和错误率

网关是整个系统的入口，它挂了整个系统都不可用。花时间调优绝对值得。

---

*本文基于 Spring Cloud 2023.x + Spring Cloud Gateway 4.1.x 编写。*
