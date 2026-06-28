---
title: 分布式追踪：从 Jaeger 到 OpenTelemetry
tag: ["分布式追踪", "OpenTelemetry", "Jaeger", "可观测性", "微服务"]
category: 分布式
date: 2026-06-27
---

# 分布式追踪：从 Jaeger 到 OpenTelemetry

> 分布式追踪：从 Jaeger 到 OpenTelemetry是分布式系统中的核心话题，它涉及数据一致性、可用性和分区容错等关键挑战。
> 本文深入分析了分布式追踪：从 Jaeger 到 OpenTelemetry的原理和解决方案，帮助你构建可靠的分布式系统。

用户反馈"下单很慢"，但你的系统是这样的：

```
用户 → API网关 → 订单服务 → 库存服务 → 仓储服务
                            → 优惠券服务
                            → 支付服务 → 风控服务 → 银行接口
```

你打开 ELK 查日志，发现：
- 订单服务日志：`2026-06-27 10:00:01 收到下单请求`，`10:00:08 下单完成`
- 7 秒花在哪了？不知道
- 每个服务都说自己只花了 200ms
- 但加起来不到 1 秒，剩下 6 秒去哪了？

**分布式追踪能告诉你**：支付服务调用银行接口花了 6.5 秒（银行接口超时）。

### 1.2 可观测性三支柱

```
可观测性（Observability）
├── Metrics（指标）：系统状态的聚合数字（CPU、QPS、延迟）
├── Logging（日志）：离散的事件记录
└── Tracing（追踪）：请求在分布式系统中的完整路径
```

三者相辅相成：
- Metrics 告诉你**出了什么问题**（延迟升高）
- Tracing 告诉你**问题在哪里**（哪个服务慢）
- Logging 告诉你**为什么出问题**（具体错误信息）

## 二、核心概念

### 2.1 Trace 和 Span

```
Trace（追踪）：一次完整请求的调用链
├── Span A：API网关 (0ms - 100ms)
│   ├── Span B：订单服务 (10ms - 90ms)
│   │   ├── Span C：库存服务 (15ms - 30ms)
│   │   ├── Span D：优惠券服务 (35ms - 40ms)
│   │   └── Span E：支付服务 (45ms - 85ms)
│   │       └── Span F：风控服务 (50ms - 80ms)
│   │           └── Span G：银行接口 (55ms - 75ms)
```

**Span 的核心字段：**

| 字段 | 说明 | 示例 |
|------|------|------|
| traceId | 整条链路唯一 ID | `a1b2c3d4e5f6` |
| spanId | 当前 Span 的 ID | `span-001` |
| parentId | 父 Span 的 ID | `span-000` |
| operationName | 操作名称 | `POST /api/orders` |
| startTime | 开始时间 | 1719500001000 |
| duration | 持续时间 | 100ms |
| tags | 键值对标签 | `http.status=200` |
| logs | 事件日志 | 异常信息 |
| spanKind | Span 类型 | SERVER / CLIENT / INTERNAL |

### 2.2 传播机制

Trace 信息如何在服务间传递？通过 HTTP Header：

```
# W3C TraceContext 标准格式
traceparent: 00-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4-span001-01
# 格式：00-<traceId>-<spanId>-<flags>
```

当服务 A 调用服务 B 时：
1. 服务 A 创建 Span，生成 traceId 和 spanId
2. 服务 A 在 HTTP 请求头中注入 traceparent
3. 服务 B 从请求头提取 traceparent，创建子 Span
4. 服务 B 的 span 的 parentId = 服务 A 的 spanId

### 2.3 Span Kind

| 类型 | 说明 | 示例 |
|------|------|------|
| SERVER | 服务端接收请求 | Spring MVC Controller |
| CLIENT | 客户端发起请求 | RestTemplate / Feign |
| INTERNAL | 内部方法调用 | Service 层方法 |
| PRODUCER | 消息生产者 | Kafka Producer |
| CONSUMER | 消息消费者 | Kafka Listener |

## 三、OpenTelemetry 标准

### 3.1 OpenTelemetry 是什么

OpenTelemetry（简称 OTel）是 CNCF 的可观测性标准，合并了 OpenTracing 和 OpenCensus。

**核心价值：**
- **厂商无关**：一套 API，对接任意后端（Jaeger、Zipkin、Datadog...）
- **统一标准**：Trace、Metrics、Logs 三合一
- **自动注入**：支持自动 instrumentation，无需改业务代码

### 3.2 架构

```
应用代码 → OTel SDK → OTel Collector → 后端(Jaeger/Prometheus/...)
                ↑
          自动 Instrumentation
```

### 3.3 Spring Boot 集成 OpenTelemetry

**方式一：自动 Instrumentation（推荐）**

使用 OpenTelemetry Java Agent，零代码侵入：

```xml
<!-- pom.xml 只需要加这个 -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-spring-boot-starter</artifactId>
    <version>2.6.0</version>
</dependency>
```

```yaml
# application.yml
otel:
  service:
    name: order-service                    # 服务名称
  exporter:
    otlp:
      endpoint: http://otel-collector:4317  # OTel Collector 地址
      protocol: grpc
  traces:
    sampler:
      type: parentbased_traceidratio       # 采样策略
      arg: 0.1                              # 采样率 10%
  resource:
    attributes:
      deployment.environment: production    # 环境标签
      service.version: v1.2.0               # 版本标签
```

**方式二：手动创建 Span**

```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.context.Scope;

@Service
public class OrderService {

    private static final Tracer tracer = 
        GlobalOpenTelemetry.getTracer("order-service");

    public Order createOrder(OrderRequest request) {
        // 创建自定义 Span
        Span span = tracer.spanBuilder("createOrder")
            .setAttribute("user.id", request.getUserId())
            .setAttribute("order.product_count", request.getProducts().size())
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            // 业务逻辑
            Order order = doCreateOrder(request);
            
            span.setAttribute("order.id", order.getId());
            span.setAttribute("order.amount", order.getAmount().doubleValue());
            return order;
        } catch (Exception e) {
            span.recordException(e);
            span.setStatus(StatusCode.ERROR, e.getMessage());
            throw e;
        } finally {
            span.end();
        }
    }

    // 更简洁的写法：用 @WithSpan 注解
    @WithSpan("validateOrder")
    public void validateOrder(@SpanAttribute("order.request") OrderRequest request) {
        // 自动创建 Span
        if (request.getProducts().isEmpty()) {
            throw new IllegalArgumentException("商品列表不能为空");
        }
    }
}
```

### 3.4 传播 Context 到异步线程

```java
@Service
public class OrderService {

    @Autowired
    private Tracer tracer;

    public void processOrderAsync(Order order) {
        // 捕获当前 Context
        Context context = Context.current();

        CompletableFuture.runAsync(() -> {
            // 将 Context 传播到异步线程
            try (Scope scope = context.makeCurrent()) {
                Span asyncSpan = tracer.spanBuilder("asyncProcessOrder")
                    .setAttribute("order.id", order.getId())
                    .startSpan();
                try {
                    // 异步处理逻辑
                    Thread.sleep(1000);
                    sendNotification(order);
                } finally {
                    asyncSpan.end();
                }
            }
        });
    }
}
```

**避坑：@Async 默认不传播 Trace Context**

```java
@Configuration
public class TraceConfig {

    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        // 关键：设置装饰器传播 Context
        executor.setTaskDecorator(runnable -> {
            Context context = Context.current();
            return () -> {
                try (Scope scope = context.makeCurrent()) {
                    runnable.run();
                }
            };
        });
        executor.initialize();
        return executor;
    }
}
```

### 3.5 Kafka 消息追踪

```java
// 生产者：注入 Trace Context 到消息头
@Component
public class OrderEventProducer {

    @Autowired
    private Tracer tracer;
    @Autowired
    private TextMapPropagator propagator;

    public void sendOrderEvent(Order order) {
        Span span = tracer.spanBuilder("kafka.send:order-events")
            .setSpanKind(SpanKind.PRODUCER)
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            ProducerRecord<String, String> record = new ProducerRecord<>(
                "order-events",
                order.getId().toString(),
                JsonUtils.toJson(order)
            );

            // 注入 Trace Context 到 Kafka Headers
            propagator.inject(Context.current(), record, 
                (carrier, key, value) -> carrier.headers().add(key, value.getBytes()));

            kafkaTemplate.send(record);
        } finally {
            span.end();
        }
    }
}

// 消费者：从消息头提取 Trace Context
@Component
public class OrderEventConsumer {

    @Autowired
    private Tracer tracer;
    @Autowired
    private TextMapPropagator propagator;

    @KafkaListener(topics = "order-events")
    public void consume(ConsumerRecord<String, String> record) {
        // 从 Kafka Headers 提取 Trace Context
        Context extractedContext = propagator.extract(
            Context.current(),
            record,
            (carrier, key) -> {
                Header header = carrier.headers().lastHeader(key);
                return header != null ? new String(header.value()) : null;
            }
        );

        Span span = tracer.spanBuilder("kafka.consume:order-events")
            .setParent(extractedContext)
            .setSpanKind(SpanKind.CONSUMER)
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            Order order = JsonUtils.fromJson(record.value(), Order.class);
            processOrder(order);
        } finally {
            span.end();
        }
    }
}
```

## 四、采样策略

### 4.1 为什么需要采样

线上流量大时，追踪每条请求代价太高。假设 10,000 QPS，每个请求 10 个 Span，每个 Span 1KB，一天就是 8.6TB。所以需要采样。

### 4.2 采样策略对比

| 策略 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| AlwaysOn | 全量采样 | 不遗漏任何请求 | 资源消耗大 |
| AlwaysOff | 不采样 | 零开销 | 没数据 |
| TraceIDRatio | 按比例采样 | 控制量 | 可能漏掉慢请求 |
| ParentBased | 跟随父决策 | 链路完整 | 依赖入口采样 |
| JaegerRemote | 动态采样 | 灵活调整 | 依赖 Collector |

### 4.3 生产推荐配置

```yaml
otel:
  traces:
    sampler:
      # 推荐组合：ParentBased + TraceIDRatio
      type: parentbased_traceidratio
      arg: 0.1                    # 基础采样率 10%
      
      # 更细粒度配置
      parentbased:
        root:
          type: traceidratio
          arg: 0.1                 # 根 Span 采样 10%
        remoteParentSampled:
          type: always_on          # 远程父 Span 已采样 → 全采样
        remoteParentNotSampled:
          type: always_off         # 远程父 Span 未采样 → 不采样
        localParentSampled:
          type: always_on
        localParentNotSampled:
          type: always_off
```

### 4.4 智能采样：慢请求全采样

```java
public class SmartSampler implements Sampler {

    private final Sampler delegate;
    private final long slowThresholdMs;

    public SmartSampler(Sampler delegate, long slowThresholdMs) {
        this.delegate = delegate;
        this.slowThresholdMs = slowThresholdMs;
    }

    @Override
    public SamplingResult shouldSample(Context context, String traceId,
            String name, SpanKind spanKind, Attributes attributes,
            List<LinkData> parentLinks) {
        
        // 先按基础策略采样
        SamplingResult result = delegate.shouldSample(
            context, traceId, name, spanKind, attributes, parentLinks);
        
        if (result.getDecision() == SamplingDecision.RECORD_AND_SAMPLE) {
            return result;
        }

        // 检查是否有慢请求标记（通过 attributes 传入）
        if (attributes != null) {
            Long duration = attributes.get(AttributeKey.longKey("http.response.duration"));
            if (duration != null && duration > slowThresholdMs) {
                // 慢请求强制采样
                return SamplingResult.create(SamplingDecision.RECORD_AND_SAMPLE);
            }
        }

        // 检查是否有错误标记
        if (attributes != null) {
            Integer statusCode = attributes.get(AttributeKey.longKey("http.response.status_code"));
            if (statusCode != null && statusCode >= 500) {
                return SamplingResult.create(SamplingDecision.RECORD_AND_SAMPLE);
            }
        }

        return result;
    }
}
```

## 五、Jaeger 部署与使用

### 5.1 部署 Jaeger

**Docker Compose 方式：**

```yaml
# docker-compose.yml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:1.57
    ports:
      - "16686:16686"    # Jaeger UI
      - "4317:4317"      # OTLP gRPC
      - "4318:4318"      # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=memory    # 生产环境用 elasticsearch
    volumes:
      - jaeger-data:/badger

  # 生产环境建议用 Elasticsearch 存储
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
    volumes:
      - es-data:/usr/share/elasticsearch/data

volumes:
  jaeger-data:
  es-data:
```

**K8s 部署（Jaeger Operator）：**

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
spec:
  strategy: production
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
    esRollover:
      schedule: "0 2 * * *"      # 每天滚动
  ui:
    options:
      dependencies:
        menuEnabled: true
  ingress:
    enabled: true
    hosts:
      - jaeger.example.com
```

### 5.2 OTel Collector 部署

OTel Collector 是数据中转站，负责接收、处理、导出追踪数据：

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    sendBatchSize: 1024

  # 采样过滤：丢弃非错误且快的 Span
  filter:
    traces:
      span:
        - 'attributes["http.status_code"] < 400 and duration < 1000000000'

  # 资源属性处理
  resource:
    attributes:
      - key: deployment.environment
        value: production
        action: upsert

  # 尾部采样：根据完整 Trace 信息决定是否采样
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow
        type: latency
        latency:
          threshold_ms: 1000
      - name: random
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

exporters:
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true
  # 也可以导出到其他后端
  # zipkin:
  #   endpoint: http://zipkin:9411/api/v2/spans
  # datadog:
  #   api:
  #     key: ${DD_API_KEY}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [resource, filter, tail_sampling, batch]
      exporters: [jaeger]
```

**K8s 部署 Collector：**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
spec:
  replicas: 3
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:0.103.0
          args: ["--config=/etc/otelcol/config.yaml"]
          ports:
            - containerPort: 4317
            - containerPort: 4318
          volumeMounts:
            - name: config
              mountPath: /etc/otelcol
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
spec:
  selector:
    app: otel-collector
  ports:
    - name: grpc
      port: 4317
      targetPort: 4317
    - name: http
      port: 4318
      targetPort: 4318
```

## 六、实战：完整的追踪链路

### 6.1 微服务调用链

```
用户 → API网关 → 订单服务 → 库存服务
                      → 支付服务 → 银行接口
                      → 通知服务(MQ异步)
```

### 6.2 各服务配置

**API 网关（Spring Cloud Gateway）：**

```yaml
# 网关只需要加依赖和配置，自动追踪
otel:
  service:
    name: api-gateway
  exporter:
    otlp:
      endpoint: http://otel-collector:4317
  traces:
    sampler:
      type: parentbased_traceidratio
      arg: 1.0    # 网关层全采样，后续服务通过 ParentBased 跟随
```

**订单服务（自动 + 手动 Span）：**

```java
@RestController
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/api/orders")
    public Result createOrder(@RequestBody OrderRequest request) {
        // OTel 自动创建了 SERVER Span
        return Result.ok(orderService.createOrder(request));
    }
}

@Service
public class OrderService {

    private static final Tracer tracer = GlobalOpenTelemetry.getTracer("order-service");

    @Autowired
    private InventoryClient inventoryClient;
    @Autowired
    private PaymentClient paymentClient;
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @WithSpan("order.create")
    public Order createOrder(@SpanAttribute("order.request") OrderRequest request) {
        // 1. 扣库存（Feign 调用，自动追踪）
        inventoryClient.deduct(request.getProducts());

        // 2. 支付（Feign 调用，自动追踪）
        PaymentResult payment = paymentClient.pay(request.getPayment());

        // 3. 手动 Span：记录业务逻辑
        Span businessSpan = tracer.spanBuilder("order.business_logic")
            .setAttribute("order.amount", payment.getAmount().doubleValue())
            .startSpan();
        try {
            Order order = Order.builder()
                .userId(request.getUserId())
                .products(request.getProducts())
                .paymentId(payment.getPaymentId())
                .amount(payment.getAmount())
                .status(OrderStatus.PAID)
                .build();
            orderRepository.save(order);

            // 4. 发送异步通知（Kafka，需要手动传播 Context）
            sendNotification(order);

            return order;
        } finally {
            businessSpan.end();
        }
    }

    private void sendNotification(Order order) {
        Span span = tracer.spanBuilder("kafka.send:notifications")
            .setSpanKind(SpanKind.PRODUCER)
            .startSpan();
        try (Scope scope = span.makeCurrent()) {
            ProducerRecord<String, String> record = new ProducerRecord<>(
                "notifications", order.getId().toString(), JsonUtils.toJson(order)
            );
            // 传播 Context
            GlobalOpenTelemetry.getPropagators()
                .getTextMapPropagator()
                .inject(Context.current(), record,
                    (carrier, key, value) -> carrier.headers().add(key, value.getBytes()));

            kafkaTemplate.send(record);
        } finally {
            span.end();
        }
    }
}
```

### 6.3 在 Jaeger 中分析

打开 Jaeger UI（http://localhost:16686），选择服务 `order-service`，查找 Trace：

```
Trace: POST /api/orders (总耗时 2.3s)
├── API网关 SERVER span (0ms - 2300ms)
│   └── 订单服务 SERVER span (5ms - 2290ms)
│       ├── 库存服务 CLIENT span (10ms - 50ms)         ← 40ms 正常
│       │   └── 库存服务 SERVER span (12ms - 45ms)
│       ├── 支付服务 CLIENT span (55ms - 2280ms)        ← 2225ms 慢！
│       │   └── 支付服务 SERVER span (58ms - 2275ms)
│       │       └── 银行接口 CLIENT span (60ms - 2270ms) ← 2210ms 超时
│       └── order.business_logic INTERNAL span (2280ms - 2285ms)
```

一眼看出：银行接口超时导致整体变慢。

### 6.4 添加自定义标签方便查询

```java
// 在 Span 上添加业务标签
Span.current().setAttribute("user.tier", "VIP");
Span.current().setAttribute("order.channel", "mobile_app");
Span.current().setAttribute("error.type", "bank_timeout");
```

在 Jaeger UI 中可以按标签搜索：`error.type=bank_timeout`

## 七、常见问题与避坑

### 7.1 Trace 断链

**原因：** Context 传播中断

```java
// ❌ Trace 断链：新线程没有 Context
@Async
public void process(Order order) {
    // 这里的 Span.current() 是空的，因为 Context 没有传播
    Span span = tracer.spanBuilder("process").startSpan();  // 新的 traceId
    // ...
}

// ✅ 正确：传播 Context
@Async
public void process(Order order) {
    // 通过 TaskDecorator 已传播 Context
    Span span = tracer.spanBuilder("process").startSpan();  // 继承 traceId
    // ...
}
```

### 7.2 采样率设置不当

```yaml
# ❌ 每个服务独立采样，链路不完整
# 服务A: sampling=0.1, 服务B: sampling=0.1
# 实际链路完整率只有 0.1 * 0.1 = 1%

# ✅ 入口全采样，后续 ParentBased 跟随
# 网关: sampling=1.0, 后续服务: parentbased
```

### 7.3 Span 过多

```java
// ❌ 每个内部方法都创建 Span，导致 Span 爆炸
public Order createOrder(OrderRequest req) {
    validateRequest(req);      // 创建 Span
    checkUser(req.getUserId()); // 创建 Span
    checkProducts(req);        // 创建 Span
    calculatePrice(req);       // 创建 Span
    // ... 10 个方法 10 个 Span
}

// ✅ 只在关键节点创建 Span
@WithSpan("order.create")
public Order createOrder(OrderRequest req) {
    // 内部方法不创建 Span，用日志记录
    validateRequest(req);
    checkUser(req.getUserId());
    // ...
}
```

### 7.4 Collector 性能瓶颈

```yaml
# Collector 处理能力不足时，增加副本和批处理
processors:
  batch:
    timeout: 5s
    sendBatchSize: 2048        # 增大批次
    sendBatchMaxSize: 4096

# K8s HPA 自动扩缩
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: otel-collector-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: otel-collector
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## 八、面试要点总结

### 高频面试题

1. **什么是分布式追踪？**
   - 记录请求在分布式系统中的完整调用路径
   - 通过 Trace 和 Span 组织调用关系
   - 帮助定位性能瓶颈和错误来源

2. **Trace Context 如何在服务间传播？**
   - 通过 HTTP Header（W3C TraceContext 标准）
   - 格式：`traceparent: 00-<traceId>-<spanId>-<flags>`
   - 异步场景需要手动传播（ThreadLocal/Context）

3. **采样策略有哪些？怎么选？**
   - AlwaysOn：全采样，适合测试
   - TraceIDRatio：按比例采样，适合高流量
   - ParentBased：跟随父决策，保证链路完整
   - 尾部采样：根据完整 Trace 信息决定，适合精准采样
   - 生产推荐：入口 ParentBased + 尾部采样

4. **OpenTelemetry 的优势是什么？**
   - 厂商无关，一套 API 对接多个后端
   - CNCF 标准，生态丰富
   - 支持 Trace/Metrics/Logs 三合一
   - 自动 Instrumentation，零代码侵入

5. **Jaeger 和 Zipkin 的区别？**
   - Jaeger：Uber 开源，功能丰富，支持自适应采样
   - Zipkin：Twitter 开源，轻量简单
   - 两者都兼容 OpenTelemetry，可以随时切换

### 核心知识点速记

```
Trace = 一次完整请求的调用链
Span = 调用链中的一个节点
traceparent = W3C 标准传播头
ParentBased = 跟随父 Span 采样决策
尾部采样 = 看完整 Trace 再决定采样
OTel Collector = 数据中转站
Jaeger = 追踪后端 + UI
@WithSpan = 自动创建 Span 的注解
Context 传播 = 异步/跨进程传播 Trace
```

## 总结

分布式追踪是微服务可观测性的核心能力。没有追踪，线上排障就像在黑屋子里找猫。

实践路径：
1. 部署 Jaeger + OTel Collector
2. 所有微服务接入 OpenTelemetry SDK
3. 配置合理的采样策略（入口全采 + 尾部采样）
4. 关键业务逻辑添加自定义 Span 和标签
5. 在 Jaeger UI 中建立查询习惯，定期分析慢请求

记住：**追踪的价值不在于数据多少，而在于你能多快定位问题。**
