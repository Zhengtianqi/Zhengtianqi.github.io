---
title: SLI_SLO_SLA：用数据衡量服务质量
date: 2026-06-11
category: 运维
tag: ["SLI", "SLO", "SLA", "错误预算", "服务质量", "SRE"]
---

# SLI_SLO_SLA：用数据衡量服务质量

> SLI_SLO_SLA：用数据衡量服务质量是保障系统稳定运行的关键，它涉及监控、告警、故障排查等多个方面。
> 本文介绍了SLI_SLO_SLA：用数据衡量服务质量的最佳实践和工具使用，帮助你提升运维能力。

```
SLA (Service Level Agreement)   ← 对外承诺（合同级）
│  "99.9% 可用性，违约赔偿"
│
├── SLO (Service Level Objective) ← 内部目标（比 SLA 更严格）
│   │  "99.95% 可用性"（留出缓冲空间）
│   │
│   └── SLI (Service Level Indicator) ← 实际测量值
│        "过去 30 天：99.97% 可用性"
│
└── 关系：SLI 测量 → SLO 对比 → SLA 承诺
```

### 1.2 定义详解

| 术语 | 定义 | 举例 | 谁关心 |
|------|------|------|--------|
| **SLI** | Service Level Indicator<br>服务水平的**具体测量指标** | "P99 请求延迟 = 200ms"<br>"错误率 = 0.05%" | 工程师 |
| **SLO** | Service Level Objective<br>服务水平的**内部目标值** | "P99 延迟 ≤ 500ms"<br>"可用性 ≥ 99.95%" | SRE/运维 |
| **SLA** | Service Level Agreement<br>服务水平的**对外承诺**<br>（通常有违约条款） | "月可用性 ≥ 99.9%"<br>"低于此值按比例退款" | 客户/业务 |

### 1.3 实际案例

```
案例：AWS S3 的 SLA

SLI：测量到的 S3 API 错误率
  "过去 1 小时，GetObject API 错误率 = 0.02%"

SLO：AWS 内部的 S3 可靠性目标
  "GetObject API 错误率 ≤ 0.01%"（内部不公开）

SLA：AWS 对客户的承诺
  "S3 月可用性 ≥ 99.9%，低于此值赔偿 10%~25% 月度费用"
```

**SLO 比 SLA 更严格的原因**：预留缓冲空间。如果 SLO 和 SLA 一样，一旦 SLI 略有波动就触发违约赔偿，没有容错余地。

## 第二部分：如何选择 SLI

### 2.1 SLI 的四大黄金指标

Google SRE 团队建议从四个维度选择 SLI：

```
┌──────────────────────────────────────────┐
│            四大黄金指标                    │
├────────────┬─────────────────────────────┤
│ 延迟       │ 请求花了多长时间？            │
│ (Latency)  │ P50, P95, P99 延迟          │
├────────────┼─────────────────────────────┤
│ 可用性     │ 服务是否可用？               │
│(Availability)│ 成功响应 / 总请求           │
├────────────┼─────────────────────────────┤
│ 错误率     │ 请求是否成功？               │
│ (Errors)   │ 5xx 错误 / 总请求            │
├────────────┼─────────────────────────────┤
│ 吞吐量     │ 系统能处理多少请求？          │
│(Throughput)│ QPS / TPS                   │
└────────────┴─────────────────────────────┘
```

### 2.2 按场景选择 SLI

**用户面 SLI**（用户体验相关）：
```
请求成功率：GET /api/orders 的 2xx 比例
响应延迟：POST /api/guarantees 的 P95 延迟
页面加载时间：首页加载完成时间
```

**系统面 SLI**（内部运维相关）：
```
数据库连接池可用率
消息队列消费延迟
缓存命中率
JVM GC 暂停时间
错误预算消耗率
```

### 2.3 担保系统的 SLI 定义

```yaml
# guarantee-slis.yaml — 担保系统 SLI 定义

guarantee_core:
  # 担保申请 API
  guarantee_apply:
    availability:
      description: "担保申请 API 成功率"
      promql: |
        sum(rate(http_server_requests_seconds_count{
          uri="/api/guarantees/apply", status=~"2.."}[5m]))
        / sum(rate(http_server_requests_seconds_count{
          uri="/api/guarantees/apply"}[5m]))
    latency:
      description: "担保申请 P99 延迟"
      promql: |
        histogram_quantile(0.99,
          sum(rate(http_server_requests_seconds_bucket{
            uri="/api/guarantees/apply"}[5m])) by (le))

  # 风控评估 API
  risk_evaluate:
    availability:
      promql: |
        sum(rate(http_server_requests_seconds_count{
          uri="/api/risk/evaluate", status=~"2.."}[5m]))
        / sum(rate(http_server_requests_seconds_count{
          uri="/api/risk/evaluate"}[5m]))

  # 签约 API
  contract_sign:
    availability:
      promql: |
        sum(rate(http_server_requests_seconds_count{
          uri="/api/contracts/sign", status=~"2.."}[5m]))
        / sum(rate(http_server_requests_seconds_count{
          uri="/api/contracts/sign"}[5m]))

# 批处理
batch_jobs:
  daily_reconciliation:
    success_rate:
      promql: |
        sum(rate(batch_job_success_total{job="daily_reconciliation"}[24h]))
        / sum(rate(batch_job_total{job="daily_reconciliation"}[24h]))

# 基础设施
infrastructure:
  database:
    availability:
      promql: probe_success{job="mysql-probe"}
  message_queue:
    consumer_lag:
      promql: rocketmq_consumer_offset_diff{group="guarantee-group"}
```

### 2.4 SLI 的度量窗口

```
短窗口（1-5 分钟）→ 告警触发
  "过去 5 分钟，错误率 = 8% → 触发 P0 告警"

中窗口（1 小时）→ 值班响应
  "过去 1 小时，P99 延迟 = 800ms → SLO 有风险"

长窗口（30 天）→ SLO 达标判定
  "过去 30 天，可用性 = 99.92% → 未达到 99.95% 的 SLO"
```

## 第三部分：SLO 制定方法论

### 3.1 SLO 不是 100%

很多团队的第一反应是设 `SLO = 99.99%`。**这是错误的**。

**为什么不能设 100%**：
1. **成本指数增长**：从 99.9% → 99.99%，成本可能增加 10 倍
2. **创新被扼杀**：零错误预算意味着不能做任何变更
3. **用户感知不到**：用户端的可靠性受限于网络、设备等因素

```
可用性          年故障时间        用户可感知？
─────────────────────────────────────────────
99%            3.65 天          很明显
99.9%          8.76 小时        比较明显
99.95%         4.38 小时        偶尔感觉
99.99%         52.6 分钟        几乎无感
99.999%        5.26 分钟        完全无感
```

### 3.2 SLO 制定步骤

**Step 1: 理解用户期望**

不要猜用户需要什么，去测量：

```javascript
// 前端埋点：测量用户实际的延迟体验
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch') {
            metrics.record('api.latency', {
                url: entry.name,
                duration: entry.duration,
                userTier: getUserTier()
            });
        }
    }
});
observer.observe({ entryTypes: ['resource'] });

// 如果 95% 用户的 API 延迟 < 500ms
// 那可以设 SLO: P95 延迟 ≤ 500ms
```

**Step 2: 参考行业标准**

| 服务类型 | 典型 SLO |
|---------|--------|
| 核心交易系统 | 99.99% 可用，P99 ≤ 100ms |
| 互联网 ToC 服务 | 99.95% 可用，P99 ≤ 500ms |
| 内部管理后台 | 99.9% 可用，P95 ≤ 2s |
| 批处理/报表 | 99.5% 可用，无延迟要求 |

**Step 3: 测试并迭代**

```
Week 1-4：测量基线 SLI
  → 实际可用性 = 99.97%

Week 5：设定初始 SLO = 99.95%
  → 有 0.02% 的缓冲空间

Week 6-12：观察 SLO 达标情况
  → 如果轻松达标 → SLO 可以收紧
  → 如果勉强达标 → 先提升系统可靠性再调
  → 如果经常不达标 → SLO 太紧或系统太不稳定
```

### 3.3 担保系统 SLO 定义

```yaml
# guarantee-slos.yaml

services:
  # 担保核心服务
  guarantee-service:
    slos:
      - name: "availability"
        objective: 99.95              # 月可用性 ≥ 99.95%
        measurement_period: 30d
        sli: sum(rate(http_requests_total{status=~"2..|3.."}[30d]))
             / sum(rate(http_requests_total[30d]))

      - name: "latency_p99"
        objective: 1s                 # P99 延迟 ≤ 1 秒
        measurement_period: 30d
        sli: histogram_quantile(0.99,
             rate(http_request_duration_seconds_bucket[30d]))

  # 风控引擎（对延迟敏感）
  risk-service:
    slos:
      - name: "availability"
        objective: 99.99
      - name: "latency_p99"
        objective: 200ms             # 风控评估必须快

  # 通知服务（对延迟不敏感）
  notification-service:
    slos:
      - name: "availability"
        objective: 99.9
      - name: "latency_p95"
        objective: 5s                # 短信晚 5 秒到也无所谓

  # 日终对账（批处理）
  reconciliation:
    slos:
      - name: "daily_completion_rate"
        objective: 99.5              # 对账成功率 ≥ 99.5%
      - name: "completion_time"
        objective: before 6:00 AM    # 必须在早上 6 点前完成
```

## 第四部分：错误预算

### 4.1 什么是错误预算

```
错误预算 = 1 - SLO

SLO = 99.95% 可用
→ 错误预算 = 0.05%
→ 每月可以"坏"的时间 = 30×24×60 × 0.05% = 21.6 分钟
```

**错误预算不是"允许犯错"，而是"允许创新"**：

```
错误预算的用途：
  ✅ 发布新版本
  ✅ 做 A/B 测试
  ✅ 基础设施变更
  ✅ 数据库迁移
  ❌ 修复已知 BUG（这不是"花"预算，这是"赚"预算）
```

### 4.2 错误预算决策框架

```java
/**
 * 错误预算管理器
 */
@Service
public class ErrorBudgetManager {

    private static final double SLO = 0.9995;  // 99.95%

    public ErrorBudgetStatus getStatus() {
        double currentSLI = prometheusClient.query(
            "sum(rate(http_requests_total{status='2..|3..'}[30d]))"
            + " / sum(rate(http_requests_total[30d]))");

        double errorBudgetRemaining = currentSLI - SLO;

        return ErrorBudgetStatus.builder()
            .slo(SLO)
            .currentSli(currentSLI)
            .errorBudgetRemaining(errorBudgetRemaining)
            .status(determineStatus(errorBudgetRemaining))
            .build();
    }

    private BudgetStatus determineStatus(double remaining) {
        if (remaining < 0) return BudgetStatus.EXHAUSTED;    // 预算耗尽
        if (remaining < 0.01) return BudgetStatus.CRITICAL;  // 预算不足
        if (remaining < 0.05) return BudgetStatus.WARNING;   // 预算紧张
        return BudgetStatus.HEALTHY;                          // 预算充足
    }
}
```

**基于错误预算的发布决策**：

```
错误预算剩余    → 可以做什么？
─────────────────────────────────────────────
> 50% (充足)    → 正常发布，无限制
                 → 允许基础设施变更

20-50% (正常)   → 正常发布
                 → 审慎的基础设施变更

5-20% (紧张)    → 只做关键修复和低风险发布
                 → 冻结基础设施变更
                 → 团队聚焦可靠性改进

< 5% (危急)     → 冻结所有发布
                 → 全员修复可靠性问题
                 → 需要 VP 审批才能变更

< 0% (耗尽)     → 违反了 SLO
                 → 冻结所有非紧急变更
                 → 事后复盘
```

### 4.3 Grafana 错误预算面板

```json
{
  "panels": [
    {
      "title": "错误预算剩余",
      "type": "gauge",
      "targets": [
        {
          "expr": "(0.9995 - (sum(rate(http_requests_total{status!~'5..'}[30d])) / sum(rate(http_requests_total[30d])))) / 0.0005 * 100",
          "legendFormat": "错误预算剩余 %"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "red" },
              { "value": 20, "color": "yellow" },
              { "value": 50, "color": "green" }
            ]
          }
        }
      }
    },
    {
      "title": "错误预算消耗趋势",
      "type": "graph",
      "targets": [
        {
          "expr": "0.0005 - (1 - sum(rate(http_requests_total{status!~'5..'}[30d])) / sum(rate(http_requests_total[30d])))",
          "legendFormat": "剩余错误预算"
        }
      ]
    }
  ]
}
```

## 第五部分：实战——为担保系统定义完整的 SLI/SLO

### 5.1 系统全景的 SLI/SLO 矩阵

```
服务                 SLI 指标              SLO              测量期
──────────────────────────────────────────────────────────────
担保申请 API        成功率                 ≥ 99.95%          30 天
                    P99 延迟              ≤ 1s              30 天
──────────────────────────────────────────────────────────────
风控评估引擎        成功率                 ≥ 99.99%          30 天
                    P99 延迟              ≤ 200ms           30 天
                    P99.9 延迟            ≤ 500ms           30 天
──────────────────────────────────────────────────────────────
电子签约 API        成功率                 ≥ 99.9%           30 天
                    P95 延迟              ≤ 3s              30 天
──────────────────────────────────────────────────────────────
额度服务            成功率                 ≥ 99.95%          30 天
                    P99 查询延迟          ≤ 500ms           30 天
──────────────────────────────────────────────────────────────
消息队列            消息投递成功率         ≥ 99.99%          30 天
                    消息消费延迟           ≤ 1s              1 小时
──────────────────────────────────────────────────────────────
数据库              连接可用率             ≥ 99.99%          30 天
                    慢查询比例             ≤ 1%              1 小时
──────────────────────────────────────────────────────────────
日终对账            对账完成率             ≥ 99.5%           每日
                    完成时间              早于 6:00 AM       每日
```

### 5.2 SLI 的 Prometheus 记录规则

```yaml
# prometheus-rules.yml
groups:
  - name: sli-recording-rules
    interval: 30s
    rules:
      # 担保申请成功率（30 天窗口）
      - record: guarantee:apply:success_rate_30d
        expr: |
          sum(rate(http_server_requests_seconds_count{
            uri="/api/guarantees/apply", status=~"2.."}[30d]))
          / sum(rate(http_server_requests_seconds_count{
            uri="/api/guarantees/apply"}[30d]))

      # 风控评估 P99 延迟（30 天窗口）
      - record: risk:evaluate:latency_p99_30d
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_server_requests_seconds_bucket{
              uri="/api/risk/evaluate"}[30d])) by (le))

      # 全局可用性
      - record: global:availability_30d
        expr: |
          sum(rate(http_server_requests_seconds_count{
            status=~"2..|3.."}[30d]))
          / sum(rate(http_server_requests_seconds_count[30d]))

      # 错误预算剩余（担保服务）
      - record: guarantee:error_budget_remaining_30d
        expr: |
          (0.9995 - (
            sum(rate(http_server_requests_seconds_count{
              service="guarantee-service", status=~"2..|3.."}[30d]))
            / sum(rate(http_server_requests_seconds_count{
              service="guarantee-service"}[30d]))
          )) / 0.0005
```

### 5.3 SLO 达标告警

```yaml
groups:
  - name: slo-alerts
    rules:
      # 错误预算消耗过快（24 小时内消耗 > 20% 的月预算）
      - alert: ErrorBudgetBurnRateHigh
        expr: |
          (
            (1 - sum(rate(http_server_requests_seconds_count{
              status!~"5.."}[1h]))
            / sum(rate(http_server_requests_seconds_count[1h])))
            / (1 - 0.9995)
          ) > 14.4
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "错误预算消耗速度过快"
          description: |
            过去 1 小时消耗了 14.4 倍正常速率的错误预算。
            按此速度，错误预算将在 2.5 天内耗尽。

      # 错误预算即将耗尽（30 天内剩余 < 10%）
      - alert: ErrorBudgetNearlyExhausted
        expr: guarantee:error_budget_remaining_30d < 0.10
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "担保服务错误预算即将耗尽"
          description: "错误预算剩余: {{ $value | humanizePercentage }}"

      # P99 延迟超标
      - alert: P99LatencyAboveSLO
        expr: risk:evaluate:latency_p99_30d > 0.2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "风控服务 P99 延迟超过 200ms SLO"
```

## 第六部分：SLO 文化落地

### 6.1 月度 SLO 评审

```
月度 SLO 评审会议（1 小时）：

1. 回顾上月 SLO 达标情况 (10 分钟)
   - 哪些达标？哪些未达标？
   - 错误预算消耗了多少？

2. 未达标原因分析 (20 分钟)
   - 根因分析（不是指责人）
   - 改进方案

3. 错误预算使用决策 (15 分钟)
   - 下月是否有重大发布需要消耗预算？
   - 是否需要暂停发布来积累预算？

4. SLO 调整讨论 (15 分钟)
   - 当前 SLO 是否合理？
   - 业务变化是否需要调整？
```

### 6.2 错误预算的"金主"原则

```
谁使用错误预算？        → 产品经理和业务方
谁管理错误预算？        → SRE 团队
什么时候可以花预算？     → 产品经理有"花钱"的决定权
什么时候不能花？        → 预算耗尽时，SRE 有否决权

错误预算 = 可靠性领域的"预算制"管理
就像财务预算一样，花完了就没了，要等下个月
```

### 6.3 SLI/SLO 成熟度模型

```
Level 1: "我们有关键指标监控"
  有 Prometheus/Grafana，但 SLO 不正式

Level 2: "我们有 SLO 定义"
  关键服务有 SLO，定期评审

Level 3: "我们用错误预算驱动决策"
  发布/回滚决策基于错误预算
  超标时自动冻结

Level 4: "SLO 是团队文化"
  每个团队都有 SLO 看板
  On-call 据此决策
  SLO 持续优化

Level 5: "SLO 驱动业务决策"
  产品规划考虑 SLO 影响
  新功能有 SLO 要求
  合同 SLA 基于内部 SLO
```

## 总结

### 核心公式

```
SLI ≤ SLO ≤ SLA

SLI：实际测量（"P99 延迟 = 120ms"）
SLO：内部目标（"P99 延迟 ≤ 200ms"）
SLA：对外承诺（"P99 延迟 ≤ 500ms"）

错误预算 = 1 - SLO
错误预算消耗率 > 警戒线 → 冻结变更
错误预算剩余 ≈ 0 → Stop Everything, Fix Reliability
```

### 行动清单

| 步骤 | 时间 | 产出 |
|------|------|------|
| 1. 定义核心 SLI | 第 1 周 | 5-10 个 SLI 指标 |
| 2. 测量基线 | 第 2-4 周 | SLI 历史数据 |
| 3. 设定初始 SLO | 第 5 周 | SLO 文档 |
| 4. 配置监控告警 | 第 6 周 | Grafana 面板 + 告警 |
| 5. 引入错误预算 | 第 7 周 | 错误预算看板 |
| 6. 月度评审 | 持续 | SLO 评审报告 |

> **不要把 SLO 设为 100%。给系统留出错的空间，就是给创新留出空间。**
