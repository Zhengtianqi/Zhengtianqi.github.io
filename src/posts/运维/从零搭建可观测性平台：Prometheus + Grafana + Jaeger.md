---
title: 从零搭建可观测性平台：Prometheus + Grafana + Jaeger
date: 2026-06-11
category: 运维
tag: ["可观测性", "Prometheus", "Grafana", "Jaeger", "OpenTelemetry", "Spring Boot"]
---

# 从零搭建可观测性平台：Prometheus + Grafana + Jaeger

## 前言

"线上出问题了，看日志才发现。"——这是运维的噩梦。可观测性（Observability）让系统变得"透明"，让你在问题发生前就能察觉，发生时能快速定位根因。

本文带你从零搭建一套完整的可观测性平台，覆盖 **Metrics + Tracing + Logging** 三大支柱。

---

## 第一部分：可观测性三大支柱

### 1.1 三支柱全景

```
┌─────────────────────────────────────────────────────────┐
│                   可观测性平台                            │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Metrics    │  │  Tracing    │  │  Logging    │     │
│  │  (指标)     │  │  (追踪)     │  │  (日志)     │     │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤     │
│  │ Prometheus  │  │  Jaeger     │  │  ELK/Loki   │     │
│  │ + Grafana   │  │  + OTEL     │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  回答什么问题：    回答什么问题：   回答什么问题：         │
│  "系统现在正常吗？" "请求经过了哪些  "出错时的详细         │
│  "QPS是多少？"    服务？哪里慢了？" 上下文是什么？"       │
│  "错误率多少？"                                      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 三支柱关系

```
一次 API 请求的全链路：

Logging:  [Gateway 日志] → [Order 日志] → [Inventory 日志] → [DB 日志]
               │                │               │
               └────────────────┼───────────────┘
                                │
Tracing:    ┌───────────────────┼───────────────────┐
            │ Span 1            │ Span 2            │ Span 3
            │ gateway → order   │ order → inventory │ inventory → DB
            │ (20ms)            │ (50ms)            │ (30ms)
            └───────────────────┴───────────────────┘
                                │
Metrics:    聚合后的数值指标
            request_total{service="order"} = 1000
            request_duration_seconds{service="order"}[p99] = 0.05
            error_total{service="inventory"} = 5
```

---

## 第二部分：Prometheus 核心概念

### 2.1 架构概览

```
┌──────────────────────────────────────────────┐
│              Prometheus Server                │
│  ┌────────────────────────────────┐          │
│  │  拉取 (Pull)                   │          │
│  │  /actuator/prometheus          │          │
│  └────────────────────────────────┘          │
│  ┌────────────────┐ ┌────────────────────┐   │
│  │  TSDB 时序数据库│ │  PromQL 查询引擎   │   │
│  └────────────────┘ └────────────────────┘   │
│  ┌────────────────┐ ┌────────────────────┐   │
│  │  Alertmanager  │ │  Grafana 集成      │   │
│  └────────────────┘ └────────────────────┘   │
└──────────────────────────────────────────────┘
         ↑ Pull 指标 (每 15 秒)
┌────────┼────────┬────────┬────────┐
│  App1  │ App2   │  DB    │ Redis  │
│:8080/  │:8081/  │:9104/  │:9121/  │
│metrics │metrics │metrics │metrics │
└────────┴────────┴────────┴────────┘
```

### 2.2 四种核心指标类型

```sql
# 1. Counter（计数器）：只增不减
http_requests_total{endpoint="/api/orders", method="POST"} 15234
# 适合：请求总数、错误总数、处理字节数

# rate() 计算每秒增量
rate(http_requests_total{endpoint="/api/orders"}[5m])
# → 过去 5 分钟每秒平均请求数

# 2. Gauge（仪表盘）：可增可减
jvm_memory_used_bytes{area="heap"} 2.5e+08
# 适合：内存使用量、连接数、队列长度

# 3. Histogram（直方图）：分布统计
http_request_duration_seconds_bucket{le="0.1"} 5000
http_request_duration_seconds_bucket{le="0.5"} 8500
http_request_duration_seconds_bucket{le="1.0"} 9200
# → 5000 个请求 ≤ 0.1s，8500 ≤ 0.5s，9200 ≤ 1.0s

# histogram_quantile() 计算分位数
histogram_quantile(0.99,
  rate(http_request_duration_seconds_bucket[5m]))
# → P99 延迟

# 4. Summary（摘要）：客户端计算分位数
http_request_duration_seconds{quantile="0.99"} 0.45
# 注意：Summary 的分位数不可聚合，Histogram 的可聚合
# 推荐使用 Histogram！
```

### 2.3 PromQL 常用查询

```sql
# 基础查询
up{job="order-service"}     # 服务是否存活
jvm_memory_used_bytes        # JVM 内存使用

# 速率计算
rate(http_server_requests_seconds_count{uri="/api/orders"}[5m])
# → 过去 5 分钟每秒订单 API 请求数

# 错误率
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/ sum(rate(http_server_requests_seconds_count[5m])) * 100
# → 5xx 错误率百分比

# P99 延迟
histogram_quantile(0.99,
  sum(rate(http_server_requests_seconds_bucket[5m])) by (le))
# → 所有端口的 P99 延迟

# CPU 使用率
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
# → 节点 CPU 使用率百分比
```

### 2.4 Alertmanager 告警规则

```yaml
# prometheus-alerts.yml
groups:
  - name: application-alerts
    rules:
      # 服务宕机
      - alert: ServiceDown
        expr: up{job=~"order-service|guarantee-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} 服务宕机"
          description: "{{ $labels.job }} 已宕机超过 1 分钟"

      # 错误率过高
      - alert: HighErrorRate
        expr: |
          sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
          / sum(rate(http_server_requests_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "错误率超过 5%"
          description: "当前错误率: {{ $value | humanizePercentage }}"

      # JVM 内存使用过高
      - alert: HighJvmMemoryUsage
        expr: |
          sum(jvm_memory_used_bytes{area="heap"})
          / sum(jvm_memory_max_bytes{area="heap"}) > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.job }} JVM 堆内存使用率超过 85%"

      # P99 延迟过高
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_server_requests_seconds_bucket[5m])) by (le, service))
          > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} P99 延迟超过 1 秒"
```

---

## 第三部分：Grafana 面板搭建

### 3.1 JVM 监控面板

**关键指标 Panel**：

```json
// JVM 堆内存使用率 - Gauge（Speedometer 类型）
// PromQL:
sum(jvm_memory_used_bytes{area="heap"}) / sum(jvm_memory_max_bytes{area="heap"}) * 100

// GC 次数和耗时 - Graph
// PromQL:
rate(jvm_gc_pause_seconds_count[5m])

// GC 耗时 - Graph
// PromQL:
rate(jvm_gc_pause_seconds_sum[5m]) / rate(jvm_gc_pause_seconds_count[5m])

// 线程数 - Graph
// PromQL:
jvm_threads_live_threads

// 类加载数 - Graph
// PromQL:
jvm_classes_loaded_classes
```

### 3.2 业务指标面板

```java
/**
 * 自定义业务指标 - 担保业务
 */
@Component
public class GuaranteeBusinessMetrics {

    private final MeterRegistry meterRegistry;

    public GuaranteeBusinessMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // 注册 Gauge：当前生效中的担保数
        Gauge.builder("guarantee.active.count", this,
            GuaranteeBusinessMetrics::getActiveGuaranteeCount)
            .description("当前生效中的担保数量")
            .register(meterRegistry);
    }

    public void recordGuaranteeCreated(GuaranteeApplication guarantee) {
        // 担保创建计数
        Counter.builder("guarantee.created.total")
            .description("担保创建总数")
            .tag("product", guarantee.getProductType().name())
            .register(meterRegistry)
            .increment();
    }

    public void recordGuaranteeAmount(Money amount) {
        // 担保金额统计（Histogram）
        DistributionSummary.builder("guarantee.amount")
            .description("担保金额分布")
            .publishPercentiles(0.5, 0.9, 0.99)
            .register(meterRegistry)
            .record(amount.getAmount().doubleValue());
    }

    public void recordDisburseTime(Timer.Sample sample) {
        sample.stop(Timer.builder("guarantee.disburse.duration")
            .description("放款处理耗时")
            .publishPercentiles(0.5, 0.9, 0.99)
            .register(meterRegistry));
    }

    private double getActiveGuaranteeCount() {
        // 从数据库查询或缓存获取
        return guaranteeRepository.countByStatus(GuaranteeStatus.ACTIVE);
    }
}
```

**业务面板 PromQL**：

```sql
# 担保创建速率（每分钟）
rate(guarantee_created_total[1m]) * 60

# 担保金额 P99
guarantee_amount_percentile{quantile="0.99"}

# 生效中的担保总数
guarantee_active_count

# 放款处理耗时 P99
histogram_quantile(0.99,
  rate(guarantee_disburse_duration_seconds_bucket[5m]))
```

---

## 第四部分：Jaeger + OpenTelemetry 全链路追踪

### 4.1 OpenTelemetry 自动探针

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-spring-boot-starter</artifactId>
    <version>1.33.0</version>
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
</dependency>
```

```yaml
# application.yml
otel:
  service:
    name: guarantee-service
  exporter:
    otlp:
      endpoint: http://jaeger-collector:4317  # OTLP gRPC 端口
  traces:
    exporter: otlp
  metrics:
    exporter: none  # 指标交给 Prometheus
  logs:
    exporter: none  # 日志交给 Loki/ELK
```

### 4.2 自定义 Span

```java
/**
 * 自定义追踪 - 担保放款流程
 */
@Service
public class DisburseService {

    @Autowired private Tracer tracer;
    @Autowired private BankClient bankClient;

    public DisburseResult disburse(DisburseCommand command) {
        // 创建自定义 Span
        Span span = tracer.spanBuilder("guarantee.disburse")
            .setAttribute("guarantee.id", command.getGuaranteeId())
            .setAttribute("amount", command.getAmount().toString())
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            // 子 Span: 银行放款调用
            BankTransferResult bankResult = callBankTransfer(command, span);

            // 子 Span: 更新担保状态
            updateGuaranteeStatus(command);

            span.setAttribute("transfer.id", bankResult.getTransferId());
            span.setStatus(StatusCode.OK);

            return DisburseResult.success();

        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }

    private BankTransferResult callBankTransfer(
            DisburseCommand command, Span parentSpan) {
        Span childSpan = tracer.spanBuilder("bank.transfer")
            .setParent(Context.current().with(parentSpan))
            .setAttribute("bank.code", command.getBankCode())
            .startSpan();

        try (Scope scope = childSpan.makeCurrent()) {
            return bankClient.transfer(command.getBankCode(),
                command.getAmount());
        } finally {
            childSpan.end();
        }
    }
}
```

### 4.3 日志与 Trace 关联

```yaml
# logback-spring.xml - 在日志中注入 traceId 和 spanId
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level
              traceId=%mdc{traceId} spanId=%mdc{spanId}
              %logger{36} - %msg%n"
```

这样当你在 Jaeger 中看到一个慢请求，可以直接用 traceId 去 ELK 中搜索对应的日志，实现 **Metrics → Tracing → Logging** 的完整链路。

---

## 第五部分：Spring Boot 项目接入实战

### 5.1 完整依赖配置

```xml
<!-- pom.xml - 可观测性全家桶 -->
<dependencies>
    <!-- Micrometer → Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
    <!-- Actuator 暴露指标 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <!-- OpenTelemetry -->
    <dependency>
        <groupId>io.opentelemetry.instrumentation</groupId>
        <artifactId>opentelemetry-spring-boot-starter</artifactId>
        <version>1.33.0</version>
    </dependency>
    <!-- Sleuth 替代品：Micrometer Tracing -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-brave</artifactId>
    </dependency>
</dependencies>
```

```yaml
# application.yml - 完整可观测性配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics  # 暴露端点
  metrics:
    tags:
      application: ${spring.application.name}     # 全局 tag
    distribution:
      percentiles-histogram:
        http.server.requests: true                # 启用 Histogram
      slo:
        http.server.requests: 10ms,50ms,100ms,200ms,500ms,1s  # SLO 桶
  tracing:
    sampling:
      probability: 1.0  # 全量采样（生产环境可降至 0.1）
  observations:
    key-values:
      application: ${spring.application.name}

otel:
  service:
    name: ${spring.application.name}
  exporter:
    otlp:
      endpoint: http://jaeger:4317
  traces:
    exporter: otlp

spring:
  application:
    name: guarantee-service
```

### 5.2 添加自定义健康检查

```java
@Component
public class GuaranteeHealthIndicator implements HealthIndicator {

    @Autowired private GuaranteeRepository guaranteeRepository;
    @Autowired private CreditLineClient creditLineClient;

    @Override
    public Health health() {
        // 检查数据库连接
        try {
            long count = guaranteeRepository.count();
            // 检查上游依赖
            boolean creditLineAvailable = creditLineClient.ping();

            if (creditLineAvailable) {
                return Health.up()
                    .withDetail("guaranteeCount", count)
                    .withDetail("creditLineService", "UP")
                    .build();
            }
            return Health.down()
                .withDetail("creditLineService", "DOWN")
                .build();

        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

---

## 第六部分：告警规则设计最佳实践

### 6.1 告警分级

```
P0 (紧急 - 立即处理，5 分钟内响应)
  ├── 服务宕机
  ├── 核心 API 错误率 > 10%
  ├── 数据库连接断开
  └── 消息队列堆积 > 100000

P1 (严重 - 30 分钟内处理)
  ├── API 错误率 > 1%
  ├── P99 延迟 > 5s
  ├── JVM 内存 > 90%
  └── 磁盘使用率 > 85%

P2 (警告 - 工作时间处理)
  ├── API 错误率 > 0.1%
  ├── P95 延迟 > 1s
  ├── CPU 使用率 > 80%
  └── 慢查询数 > 10/min

P3 (通知 - 关注即可)
  ├── 发布/部署事件
  ├── 流量波动异常
  └── 新错误类型出现
```

### 6.2 告警降噪

```yaml
# Alertmanager 配置 - 告警降噪
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s          # 同组告警等待 30s 后发送
  group_interval: 5m        # 同组新告警间隔 5 分钟
  repeat_interval: 4h       # 重复发送间隔 4 小时

  routes:
    - match:
        severity: critical
      receiver: 'oncall-pager'   # P0 → 电话通知
      continue: true

    - match:
        severity: warning
      receiver: 'wechat-group'   # P1/P2 → 微信群
      continue: true

    - match:
        severity: info
      receiver: 'email'           # P3 → 邮件

# 抑制规则：如果服务宕机了，就不要重复报 CPU/内存的告警
inhibit_rules:
  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      alertname: 'HighCpuUsage|HighMemoryUsage'
    equal: ['job']
```

### 6.3 值班轮转

```yaml
# Alertmanager 结合 Opsgenie/PagerDuty 实现值班轮转
receivers:
  - name: 'oncall-pager'
    opsgenie_configs:
      - api_key: 'xxx'
        responders:
          - type: schedule
            name: 'guarantee-oncall'  # 担保团队值班表
        tags:
          - 'guarantee'
        priority: 'P1'
```

---

## 第七部分：Docker Compose 一键部署

```yaml
# docker-compose-observability.yml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  # Jaeger
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"   # UI
      - "4317:4317"     # OTLP gRPC
      - "4318:4318"     # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana-storage:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts.yml'

scrape_configs:
  - job_name: 'guarantee-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']
        labels:
          service: 'guarantee-service'
          environment: 'production'
```

---

## 总结

### 可观测性实施路线

```
Phase 1: 基础监控（1-2 周）
  ├── Prometheus + Grafana 部署
  ├── Spring Boot Actuator + Micrometer 接入
  ├── 基础 JVM 面板搭建
  └── 核心业务指标定义

Phase 2: 全链路追踪（2-4 周）
  ├── Jaeger + OpenTelemetry 部署
  ├── 所有微服务接入
  ├── Trace 可视化
  └── 慢请求分析面板

Phase 3: 告警体系（1-2 周）
  ├── 告警规则定义
  ├── Alertmanager 配置
  ├── 通知渠道集成
  └── 值班轮转配置

Phase 4: 持续优化（持续）
  ├── SLI/SLO 定义与跟踪
  ├── 告警降噪优化
  └── 面板持续完善
```

### 核心工具链速查

| 支柱 | 工具 | 替代方案 |
|------|------|---------|
| Metrics | Prometheus + Grafana | Datadog, New Relic |
| Tracing | Jaeger + OpenTelemetry | Zipkin, SkyWalking |
| Logging | ELK / Loki | Splunk, 阿里云 SLS |

---

## 参考资料

1. Prometheus 官方文档
2. OpenTelemetry Java Instrumentation
3. Micrometer 官方文档
4. Jaeger 官方文档
