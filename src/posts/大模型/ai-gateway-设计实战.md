---
title: AI Gateway 设计实战：多模型路由、限流与成本控制
tag: ["AI Gateway", "多模型路由", "限流", "成本控制"]
category: 大模型
date: 2026-07-03
---

# AI Gateway 设计实战：多模型路由、限流与成本控制

> 当你的系统同时使用 GPT-4、Claude、Llama 和 DeepSeek，当你的月度 API 账单从 1 万涨到 10 万，当你需要在不同模型间动态切换以保证服务可用性——你需要一个 AI Gateway。本文将从架构设计到代码实现，全面解析生产级 AI Gateway 的构建方法。

## 一、AI Gateway 是什么？为什么需要它？

### 1.1 痛点场景

```
没有 AI Gateway 的系统:

┌──────────────────────────────────────────────────┐
│                   业务代码                        │
│                                                  │
│  if task == "code":                              │
│      response = openai.chat.completions.create(  │
│          model="gpt-4o", ...)                    │
│  elif task == "long_text":                       │
│      response = anthropic.messages.create(       │
│          model="claude-sonnet-4-20250514", ...)  │
│  elif task == "cheap_chat":                      │
│      response = openai.chat.completions.create(  │
│          model="gpt-4o-mini", ...)               │
│                                                  │
│  问题:                                           │
│  1. API Key 散落各处，安全风险                   │
│  2. 一个模型挂了，整个功能不可用                  │
│  3. 无法控制成本，月账单不可预测                  │
│  4. 没有限流，一个用户可以耗尽所有配额             │
│  5. 无法统一监控和日志                            │
│  6. 切换模型需要改代码                            │
│  7. 没有缓存，重复请求浪费钱                      │
└──────────────────────────────────────────────────┘

有 AI Gateway 的系统:

┌──────────┐    ┌──────────────────────────┐    ┌──────────┐
│ 业务代码  │───▶│      AI Gateway          │───▶│ GPT-4o   │
│          │    │                          │    ├──────────┤
│ 统一API   │◀───│ 路由 / 限流 / 缓存 / 监控 │◀───│ Claude   │
│          │    │                          │    ├──────────┤
│          │    │                          │───▶│ Llama    │
└──────────┘    └──────────────────────────┘    ├──────────┤
                                                │ DeepSeek │
                                                └──────────┘
业务代码只和一个 API 通信，所有管控集中在 Gateway 层
```

### 1.2 AI Gateway 的核心功能

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Gateway 核心功能                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── 1. 多模型路由 ─────────────────────────────────────┐ │
│  │ 按任务类型路由: 代码→GPT-4o, 长文→Claude, 简单→GPT-4o-mini│
│  │ 按成本路由: 优先用便宜模型，复杂请求再升级               │
│  │ 按延迟路由: 实时场景用快模型，离线任务用强模型            │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 2. 限流与配额 ─────────────────────────────────────┐ │
│  │ Token 级别限流: 每分钟最多 N tokens (不是 RPM)         │
│  │ 用户配额: 每用户每天最多消费 $X                        │
│  │ 项目配额: 每项目每月最多 N 次调用                       │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 3. 成本控制 ───────────────────────────────────────┐ │
│  │ 语义缓存: 相似请求命中缓存，节省 30-50% 成本            │
│  │ 模型降级: 高峰期自动降级到便宜模型                      │
│  │ Prompt 压缩: 减少输入 token 数                         │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 4. 可靠性 ─────────────────────────────────────────┐ │
│  │ 自动重试: 指数退避重试                                  │
│  │ 故障转移: A模型挂了自动切到B模型                        │
│  │ 超时控制: 避免长时间等待                                │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 5. 可观测性 ───────────────────────────────────────┐ │
│  │ 调用量监控: 每模型/每用户/每项目的调用量                │
│  │ 延迟监控: P50/P95/P99 延迟                             │
│  │ 成本监控: 实时 Token 消耗和费用                         │
│  │ 错误监控: 错误率、错误类型分布                          │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 6. 安全 ───────────────────────────────────────────┐ │
│  │ API Key 统一管理: 业务代码不接触 Key                    │
│  │ 内容审核: 输入/输出过滤                                │
│  │ 敏感信息脱敏: PII 检测和替换                           │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 二、架构设计

### 2.1 整体架构

```
                    ┌──────────────────────────────────────────────────┐
                    │                  客户端                           │
                    │         (业务系统 / 前端 / CLI)                   │
                    └──────────────────┬───────────────────────────────┘
                                       │
                                POST /v1/chat/completions
                                       │
                    ┌──────────────────▼───────────────────────────────┐
                    │              API Gateway 层                      │
                    │  (认证 / CORS / 请求大小限制 / 基础限流)          │
                    └──────────────────┬───────────────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────────────┐
                    │           AI Gateway 核心层                      │
                    │                                                  │
                    │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
                    │  │  请求预处理 │  │   路由引擎  │  │  限流器   │ │
                    │  │  - 认证     │  │  - 模型选择 │  │ - Token  │ │
                    │  │  - 日志     │  │  - 负载均衡 │  │   限流   │ │
                    │  │  - PII脱敏  │  │  - 故障转移 │  │ - 配额   │ │
                    │  │  - 审计     │  │             │  │   管理   │ │
                    │  └────────────┘  └──────┬──────┘  └───────────┘ │
                    │                         │                        │
                    │  ┌────────────┐  ┌──────▼──────┐  ┌───────────┐ │
                    │  │  后处理    │  │  缓存层     │  │  执行器   │ │
                    │  │  - 结果校验│  │  - 语义缓存 │  │  - 调用   │ │
                    │  │  - 审计    │◀─│  - 精确缓存 │◀─│    上游   │ │
                    │  │  - 计费    │  │             │  │  - 重试   │ │
                    │  │  - 监控    │  └─────────────┘  │  - 超时   │ │
                    │  └────────────┘                   └───────────┘ │
                    └──────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────────────┐
                    │              上游模型提供方                       │
                    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
                    │  │OpenAI│ │Anthropic│ │Azure│ │Local│ │其他 │      │
                    │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
                    └──────────────────────────────────────────────────┘
```

### 2.2 请求处理流程

```python
from dataclasses import dataclass, field
from typing import Optional, Any
from enum import Enum
import time
import hashlib
import json

class ModelProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE = "azure"
    LOCAL = "local"
    DEEPSEEK = "deepseek"

@dataclass
class AIRequest:
    """统一的 AI 请求结构"""
    # 请求信息
    request_id: str
    user_id: str
    project_id: str
    timestamp: float = field(default_factory=time.time)
    
    # 模型参数
    messages: list[dict] = field(default_factory=list)
    model: Optional[str] = None          # 指定模型（可选，不指定则由路由器决定）
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = False
    
    # 路由提示
    task_type: Optional[str] = None       # code | chat | reasoning | summary | translate
    priority: str = "normal"              # low | normal | high
    
    # 元数据
    metadata: dict = field(default_factory=dict)
    
    # 运行时信息（Gateway 填充）
    routed_model: Optional[str] = None
    provider: Optional[ModelProvider] = None
    cache_key: Optional[str] = None
    cache_hit: bool = False
    retry_count: int = 0

@dataclass
class AIResponse:
    """统一的 AI 响应结构"""
    request_id: str
    content: str
    model: str
    provider: ModelProvider
    
    # Token 信息
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    
    # 成本信息
    cost_usd: float = 0.0
    
    # 性能信息
    latency_ms: float = 0.0
    cache_hit: bool = False
    
    # 错误信息
    error: Optional[str] = None
    error_type: Optional[str] = None


class AIGateway:
    """AI Gateway 核心"""
    
    def __init__(self):
        self.router = ModelRouter()
        self.rate_limiter = TokenRateLimiter()
        self.cache = SemanticCache()
        self.executor = ModelExecutor()
        self.monitor = MetricsCollector()
        self.cost_tracker = CostTracker()
    
    async def process(self, request: AIRequest) -> AIResponse:
        """处理请求的完整流水线"""
        
        # ========== 1. 预处理 ==========
        # 1a. 认证
        self.authenticate(request)
        
        # 1b. PII 脱敏
        request = self.sanitize_pii(request)
        
        # 1c. 计算缓存 key
        request.cache_key = self.compute_cache_key(request)
        
        # ========== 2. 缓存检查 ==========
        cached = await self.cache.get(request.cache_key)
        if cached:
            cached.cache_hit = True
            self.monitor.record_cache_hit(request, cached)
            return cached
        
        # ========== 3. 限流检查 ==========
        allowed, reason = self.rate_limiter.check(request)
        if not allowed:
            return AIResponse(
                request_id=request.request_id,
                content="",
                model="",
                provider=ModelProvider.OPENAI,
                error=f"Rate limited: {reason}",
                error_type="rate_limit"
            )
        
        # ========== 4. 路由 ==========
        if request.model is None:
            route = self.router.route(request)
            request.routed_model = route.model
            request.provider = route.provider
        else:
            request.routed_model = request.model
            request.provider = self.router.get_provider(request.model)
        
        # ========== 5. 执行（带重试和故障转移）==========
        response = await self.executor.execute_with_failover(request)
        
        # ========== 6. 后处理 ==========
        # 6a. 结果校验
        if response.error is None:
            response = self.validate_response(response)
        
        # 6b. 缓存写入
        if response.error is None and not request.stream:
            await self.cache.set(request.cache_key, response, ttl=3600)
        
        # 6c. 计费
        cost = self.cost_tracker.calculate(request, response)
        response.cost_usd = cost
        
        # 6d. 监控
        self.monitor.record(request, response)
        
        return response
    
    def authenticate(self, request: AIRequest):
        """认证"""
        # API Key 验证、JWT 验证等
        pass
    
    def sanitize_pii(self, request: AIRequest) -> AIRequest:
        """PII 脱敏"""
        import re
        for msg in request.messages:
            if msg.get("role") == "user":
                # 手机号脱敏
                msg["content"] = re.sub(
                    r'1[3-9]\d{9}',
                    '1**-****-****',
                    msg["content"]
                )
                # 邮箱脱敏
                msg["content"] = re.sub(
                    r'[\w.-]+@[\w.-]+\.\w+',
                    '***@***.***',
                    msg["content"]
                )
        return request
    
    def compute_cache_key(self, request: AIRequest) -> str:
        """计算缓存 key"""
        key_data = {
            "messages": request.messages,
            "model": request.routed_model or request.model,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        key_str = json.dumps(key_data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(key_str.encode()).hexdigest()
    
    def validate_response(self, response: AIResponse) -> AIResponse:
        """响应校验"""
        if not response.content or len(response.content.strip()) == 0:
            response.error = "Empty response"
            response.error_type = "empty_response"
        return response
```

## 三、多模型路由策略

### 3.1 路由策略设计

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
import random

@dataclass
class RouteDecision:
    model: str
    provider: ModelProvider
    reason: str

class RoutingStrategy(ABC):
    """路由策略基类"""
    
    @abstractmethod
    def route(self, request: AIRequest) -> RouteDecision:
        pass

class TaskBasedRouter(RoutingStrategy):
    """按任务类型路由"""
    
    TASK_MODEL_MAP = {
        "code":       {"model": "gpt-4o",         "provider": ModelProvider.OPENAI},
        "reasoning":  {"model": "claude-sonnet-4-20250514", "provider": ModelProvider.ANTHROPIC},
        "long_text":  {"model": "claude-sonnet-4-20250514", "provider": ModelProvider.ANTHROPIC},
        "chat":       {"model": "gpt-4o-mini",    "provider": ModelProvider.OPENAI},
        "summary":    {"model": "deepseek-chat",  "provider": ModelProvider.DEEPSEEK},
        "translate":  {"model": "deepseek-chat",  "provider": ModelProvider.DEEPSEEK},
        "embedding":  {"model": "text-embedding-3-small", "provider": ModelProvider.OPENAI},
    }
    
    def route(self, request: AIRequest) -> RouteDecision:
        task = request.task_type or "chat"
        config = self.TASK_MODEL_MAP.get(task, self.TASK_MODEL_MAP["chat"])
        return RouteDecision(
            model=config["model"],
            provider=config["provider"],
            reason=f"task_type={task}"
        )


class CostBasedRouter(RoutingStrategy):
    """按成本路由：优先用便宜模型"""
    
    # 模型按成本从低到高排序
    MODEL_COST_TIERS = [
        {"model": "gpt-4o-mini",   "provider": ModelProvider.OPENAI,    "cost_per_1k": 0.00015},
        {"model": "deepseek-chat", "provider": ModelProvider.DEEPSEEK,  "cost_per_1k": 0.00027},
        {"model": "claude-3-haiku","provider": ModelProvider.ANTHROPIC, "cost_per_1k": 0.00025},
        {"model": "gpt-4o",        "provider": ModelProvider.OPENAI,    "cost_per_1k": 0.005},
        {"model": "claude-sonnet-4-20250514", "provider": ModelProvider.ANTHROPIC, "cost_per_1k": 0.003},
    ]
    
    # 复杂度阈值（根据 prompt 长度和任务类型判断）
    COMPLEXITY_RULES = {
        "simple": 0,      # 简单任务用最便宜的
        "medium": 2,      # 中等任务用中等模型
        "complex": 4,     # 复杂任务用最强模型
    }
    
    def route(self, request: AIRequest) -> RouteDecision:
        complexity = self.assess_complexity(request)
        tier_index = self.COMPLEXITY_RULES[complexity]
        model_config = self.MODEL_COST_TIERS[min(tier_index, len(self.MODEL_COST_TIERS) - 1)]
        
        return RouteDecision(
            model=model_config["model"],
            provider=model_config["provider"],
            reason=f"cost_optimized, complexity={complexity}"
        )
    
    def assess_complexity(self, request: AIRequest) -> str:
        """评估请求复杂度"""
        # 基于多个信号判断
        total_chars = sum(len(m.get("content", "")) for m in request.messages)
        
        # 简单: 短消息 + 简单任务
        if total_chars < 200 and request.task_type in ("chat", "summary"):
            return "simple"
        
        # 复杂: 长消息 + 推理任务
        if total_chars > 2000 or request.task_type in ("reasoning", "code"):
            return "complex"
        
        return "medium"


class LatencyBasedRouter(RoutingStrategy):
    """按延迟路由：实时场景用快模型"""
    
    MODEL_LATENCY = {
        "gpt-4o-mini":    {"p50_ms": 500,  "p95_ms": 1500},
        "deepseek-chat":  {"p50_ms": 800,  "p95_ms": 2000},
        "gpt-4o":         {"p50_ms": 1200, "p95_ms": 3000},
        "claude-sonnet-4-20250514": {"p50_ms": 1500, "p95_ms": 4000},
    }
    
    def __init__(self, latency_budget_ms: int = 2000):
        self.latency_budget = latency_budget_ms
    
    def route(self, request: AIRequest) -> RouteDecision:
        # 选择 P95 延迟在预算内的最强模型
        candidates = [
            (model, info) for model, info in self.MODEL_LATENCY.items()
            if info["p95_ms"] <= self.latency_budget
        ]
        
        if not candidates:
            # 没有模型满足延迟要求，选最快的
            fastest = min(self.MODEL_LATENCY.items(), key=lambda x: x[1]["p50_ms"])
            return RouteDecision(
                model=fastest[0],
                provider=self.get_provider(fastest[0]),
                reason=f"latency_optimized, no model within budget, fastest available"
            )
        
        # 在满足延迟的模型中选最强的（成本最高的）
        best = max(candidates, key=lambda x: x[1]["p50_ms"])
        return RouteDecision(
            model=best[0],
            provider=self.get_provider(best[0]),
            reason=f"latency_optimized, budget={self.latency_budget}ms"
        )
    
    def get_provider(self, model: str) -> ModelProvider:
        if "gpt" in model or "text-embedding" in model:
            return ModelProvider.OPENAI
        elif "claude" in model:
            return ModelProvider.ANTHROPIC
        elif "deepseek" in model:
            return ModelProvider.DEEPSEEK
        return ModelProvider.OPENAI


class WeightedLoadBalancer(RoutingStrategy):
    """加权负载均衡"""
    
    def __init__(self, weights: dict[str, float] = None):
        self.weights = weights or {
            "gpt-4o": 0.3,
            "claude-sonnet-4-20250514": 0.3,
            "deepseek-chat": 0.25,
            "gpt-4o-mini": 0.15,
        }
    
    def route(self, request: AIRequest) -> RouteDecision:
        models = list(self.weights.keys())
        weights = list(self.weights.values())
        selected = random.choices(models, weights=weights, k=1)[0]
        
        return RouteDecision(
            model=selected,
            provider=self.get_provider(selected),
            reason=f"load_balanced, weight={self.weights[selected]}"
        )
    
    def get_provider(self, model: str) -> ModelProvider:
        if "gpt" in model:
            return ModelProvider.OPENAI
        elif "claude" in model:
            return ModelProvider.ANTHROPIC
        elif "deepseek" in model:
            return ModelProvider.DEEPSEEK
        return ModelProvider.OPENAI


class ModelRouter:
    """模型路由器：组合多种策略"""
    
    def __init__(self):
        self.task_router = TaskBasedRouter()
        self.cost_router = CostBasedRouter()
        self.latency_router = LatencyBasedRouter()
        self.lb_router = WeightedLoadBalancer()
        
        # 模型列表（健康状态）
        self.model_health: dict[str, bool] = {}
        self.model_providers = {
            "gpt-4o": ModelProvider.OPENAI,
            "gpt-4o-mini": ModelProvider.OPENAI,
            "claude-sonnet-4-20250514": ModelProvider.ANTHROPIC,
            "claude-3-haiku-20240307": ModelProvider.ANTHROPIC,
            "deepseek-chat": ModelProvider.DEEPSEEK,
        }
    
    def route(
        self,
        request: AIRequest,
        strategy: str = "task"
    ) -> RouteDecision:
        """路由决策"""
        
        if strategy == "task":
            decision = self.task_router.route(request)
        elif strategy == "cost":
            decision = self.cost_router.route(request)
        elif strategy == "latency":
            decision = self.latency_router.route(request)
        elif strategy == "load_balance":
            decision = self.lb_router.route(request)
        else:
            decision = self.task_router.route(request)
        
        # 健康检查：如果选择的模型不健康，故障转移
        if not self.model_health.get(decision.model, True):
            decision = self._failover(decision, request)
        
        return decision
    
    def _failover(self, original: RouteDecision, request: AIRequest) -> RouteDecision:
        """故障转移"""
        # 找同类备选模型
        fallback_map = {
            "gpt-4o": "claude-sonnet-4-20250514",
            "claude-sonnet-4-20250514": "gpt-4o",
            "gpt-4o-mini": "deepseek-chat",
            "deepseek-chat": "gpt-4o-mini",
        }
        
        fallback_model = fallback_map.get(original.model)
        if fallback_model and self.model_health.get(fallback_model, True):
            return RouteDecision(
                model=fallback_model,
                provider=self.model_providers[fallback_model],
                reason=f"failover from {original.model} (unhealthy)"
            )
        
        # 如果备选也不健康，用任意健康模型
        for model, healthy in self.model_health.items():
            if healthy:
                return RouteDecision(
                    model=model,
                    provider=self.model_providers[model],
                    reason=f"failover to any healthy model"
                )
        
        raise RuntimeError("所有模型都不可用")
    
    def get_provider(self, model: str) -> ModelProvider:
        return self.model_providers.get(model, ModelProvider.OPENAI)
```

## 四、Token 级别限流

### 4.1 为什么是 Token 限流而非 RPM？

```python
# 传统 RPM (Requests Per Minute) 限流的问题:
# 用户A: 每次请求 100 tokens → 每分钟60次 → 6,000 tokens/min
# 用户B: 每次请求 10,000 tokens → 每分钟60次 → 600,000 tokens/min
# 同样的 RPM 限制下，用户B 的成本是用户A 的 100 倍！

# Token 级别限流:
# 限制每分钟 10,000 tokens
# 用户A: 可以发 100 次请求（每次100 tokens）
# 用户B: 只能发 1 次请求（每次10,000 tokens）
# 公平！


class TokenRateLimiter:
    """Token 级别限流器"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client  # 生产环境用 Redis
        self.local_store: dict[str, list[float]] = {}  # 简单场景用内存
        self.local_tokens: dict[str, list[int]] = {}
    
    def check(
        self,
        request: AIRequest,
        limits: dict = None
    ) -> tuple[bool, str]:
        """检查是否允许请求"""
        
        default_limits = {
            "rpm": 60,              # 每分钟请求数
            "tpm": 10000,           # 每分钟 token 数
            "daily_token_quota": 1_000_000,  # 每日 token 配额
            "daily_cost_quota": 10.0,        # 每日成本配额 ($)
        }
        limits = limits or default_limits
        
        # 估算请求 token 数
        estimated_tokens = self.estimate_tokens(request)
        
        # 1. RPM 检查
        rpm_key = f"rpm:{request.user_id}"
        rpm = self._get_count(rpm_key, window=60)
        if rpm >= limits["rpm"]:
            return False, f"RPM 超限: {rpm}/{limits['rpm']}"
        
        # 2. TPM 检查
        tpm_key = f"tpm:{request.user_id}"
        tpm = self._get_count(tpm_key, window=60)
        if tpm + estimated_tokens > limits["tpm"]:
            return False, f"TPM 超限: {tpm + estimated_tokens}/{limits['tpm']}"
        
        # 3. 日配额检查
        daily_key = f"daily:{request.user_id}:{time.strftime('%Y-%m-%d')}"
        daily_tokens = self._get_count(daily_key, window=86400)
        if daily_tokens + estimated_tokens > limits["daily_token_quota"]:
            return False, f"日 Token 配额超限: {daily_tokens + estimated_tokens}/{limits['daily_token_quota']}"
        
        # 4. 记录使用量
        self._increment(rpm_key, 1, 60)
        self._increment(tpm_key, estimated_tokens, 60)
        self._increment(daily_key, estimated_tokens, 86400)
        
        return True, "OK"
    
    def estimate_tokens(self, request: AIRequest) -> int:
        """估算请求 token 数"""
        # 粗略估算: 1 token ≈ 4 字符（英文）或 1.5 字符（中文）
        total_chars = sum(len(m.get("content", "")) for m in request.messages)
        
        # 检测语言
        chinese_chars = sum(
            1 for m in request.messages 
            for c in m.get("content", "") 
            if '\u4e00' <= c <= '\u9fff'
        )
        chinese_ratio = chinese_chars / max(total_chars, 1)
        
        if chinese_ratio > 0.3:
            estimated = total_chars / 1.5  # 中文为主
        else:
            estimated = total_chars / 4    # 英文为主
        
        # 加上预期输出 token
        estimated += request.max_tokens
        
        return int(estimated)
    
    def _get_count(self, key: str, window: int) -> int:
        """获取滑动窗口内的计数"""
        if self.redis:
            # Redis 实现（滑动窗口）
            import time
            now = time.time()
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, now - window)
            pipe.zcard(key)
            pipe.execute()
            return pipe.execute()[1]
        else:
            # 内存实现
            import time
            now = time.time()
            if key not in self.local_store:
                return 0
            self.local_store[key] = [
                t for t in self.local_store[key] if t > now - window
            ]
            return len(self.local_store[key])
    
    def _increment(self, key: str, count: int, window: int):
        """增加计数"""
        if self.redis:
            import time
            now = time.time()
            self.redis.zadd(key, {f"{now}:{count}": now})
            self.redis.expire(key, window)
        else:
            import time
            now = time.time()
            if key not in self.local_store:
                self.local_store[key] = []
            self.local_store[key].extend([now] * count)
```

### 4.2 多层级配额管理

```python
class QuotaManager:
    """多层级配额管理"""
    
    # 配额层级: 全局 > 项目 > 用户 > 会话
    QUOTA_HIERARCHY = {
        "global": {
            "tpm": 500_000,
            "daily_tokens": 50_000_000,
            "daily_cost": 500.0,
        },
        "project": {
            "tpm": 100_000,
            "daily_tokens": 10_000_000,
            "daily_cost": 100.0,
        },
        "user": {
            "tpm": 10_000,
            "daily_tokens": 1_000_000,
            "daily_cost": 10.0,
        },
        "session": {
            "tpm": 5_000,
            "daily_tokens": 200_000,
            "daily_cost": 2.0,
        },
    }
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
    
    def check_quota(
        self,
        user_id: str,
        project_id: str,
        session_id: str,
        estimated_tokens: int,
        estimated_cost: float
    ) -> tuple[bool, str]:
        """检查所有层级的配额"""
        
        levels = [
            ("global", "global"),
            ("project", project_id),
            ("user", user_id),
            ("session", session_id),
        ]
        
        for level, entity_id in levels:
            quota = self.QUOTA_HIERARCHY[level]
            
            # 检查每个维度
            for dim, limit in quota.items():
                current = self._get_usage(level, entity_id, dim)
                increment = estimated_tokens if "token" in dim else estimated_cost
                
                if current + increment > limit:
                    return False, (
                        f"{level}.{entity_id}.{dim} 超限: "
                        f"{current + increment}/{limit}"
                    )
        
        return True, "OK"
    
    def record_usage(
        self,
        user_id: str,
        project_id: str,
        session_id: str,
        tokens_used: int,
        cost: float
    ):
        """记录实际使用量"""
        levels = [
            ("global", "global"),
            ("project", project_id),
            ("user", user_id),
            ("session", session_id),
        ]
        
        for level, entity_id in levels:
            self._increment_usage(level, entity_id, "tpm", tokens_used)
            self._increment_usage(level, entity_id, "daily_tokens", tokens_used)
            self._increment_usage(level, entity_id, "daily_cost", cost)
```

## 五、成本控制

### 5.1 语义缓存

```python
import numpy as np
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class CacheEntry:
    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    created_at: datetime
    ttl_seconds: int
    hit_count: int = 0

class SemanticCache:
    """语义缓存：相似请求命中缓存"""
    
    def __init__(
        self,
        embed_model=None,
        similarity_threshold: float = 0.95,
        max_size: int = 10000,
        default_ttl: int = 3600
    ):
        self.embed_model = embed_model  # 嵌入模型
        self.similarity_threshold = similarity_threshold
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: dict[str, CacheEntry] = {}
        self.embeddings: dict[str, np.ndarray] = {}
    
    async def get(self, cache_key: str) -> AIResponse | None:
        """查找缓存"""
        # 1. 精确匹配
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if self._is_valid(entry):
                entry.hit_count += 1
                return self._to_response(entry, cache_key, exact_match=True)
            else:
                self._remove(cache_key)
        
        # 2. 语义匹配（需要嵌入模型）
        if self.embed_model:
            query_embed = await self._embed(cache_key)
            similar = self._find_similar(query_embed)
            if similar:
                similar_key, similarity = similar
                entry = self.cache[similar_key]
                if self._is_valid(entry):
                    entry.hit_count += 1
                    return self._to_response(entry, similar_key, exact_match=False, 
                                           similarity=similarity)
        
        return None
    
    async def set(self, cache_key: str, response: AIResponse, ttl: int = None):
        """写入缓存"""
        if len(self.cache) >= self.max_size:
            self._evict()
        
        entry = CacheEntry(
            content=response.content,
            model=response.model,
            prompt_tokens=response.prompt_tokens,
            completion_tokens=response.completion_tokens,
            created_at=datetime.now(),
            ttl_seconds=ttl or self.default_ttl
        )
        self.cache[cache_key] = entry
        
        if self.embed_model:
            self.embeddings[cache_key] = await self._embed(cache_key)
    
    def _is_valid(self, entry: CacheEntry) -> bool:
        """检查缓存是否过期"""
        age = (datetime.now() - entry.created_at).total_seconds()
        return age < entry.ttl_seconds
    
    def _find_similar(self, query_embed: np.ndarray) -> tuple[str, float] | None:
        """找到最相似的缓存"""
        if not self.embeddings:
            return None
        
        best_key = None
        best_sim = 0
        
        for key, embed in self.embeddings.items():
            sim = np.dot(query_embed, embed) / (
                np.linalg.norm(query_embed) * np.linalg.norm(embed)
            )
            if sim > best_sim:
                best_sim = sim
                best_key = key
        
        if best_sim >= self.similarity_threshold:
            return best_key, best_sim
        return None
    
    def _evict(self):
        """LRU 淘汰"""
        oldest = min(self.cache.items(), key=lambda x: x[1].created_at)
        self._remove(oldest[0])
    
    def _remove(self, key: str):
        self.cache.pop(key, None)
        self.embeddings.pop(key, None)
```

### 5.2 模型降级策略

```python
class ModelDegrader:
    """模型降级策略"""
    
    def __init__(self, cost_tracker, monthly_budget: float = 5000.0):
        self.cost_tracker = cost_tracker
        self.monthly_budget = monthly_budget
        
        # 降级阶梯
        self.degradation_tiers = [
            # Tier 0: 预算充足，用最强模型
            {"threshold": 0.5, "models": {
                "code": "gpt-4o",
                "reasoning": "claude-sonnet-4-20250514",
                "chat": "gpt-4o",
                "default": "gpt-4o",
            }},
            # Tier 1: 预算过半，用中等模型
            {"threshold": 0.7, "models": {
                "code": "gpt-4o",
                "reasoning": "claude-sonnet-4-20250514",
                "chat": "gpt-4o-mini",
                "default": "gpt-4o-mini",
            }},
            # Tier 2: 预算紧张，全用便宜模型
            {"threshold": 0.85, "models": {
                "code": "deepseek-chat",
                "reasoning": "deepseek-chat",
                "chat": "gpt-4o-mini",
                "default": "gpt-4o-mini",
            }},
            # Tier 3: 预算即将耗尽，只允许最便宜的
            {"threshold": 0.95, "models": {
                "code": "gpt-4o-mini",
                "reasoning": "gpt-4o-mini",
                "chat": "gpt-4o-mini",
                "default": "gpt-4o-mini",
            }},
        ]
    
    def get_model(self, task_type: str) -> str:
        """根据预算使用率选择模型"""
        usage_rate = self.cost_tracker.get_monthly_usage() / self.monthly_budget
        
        for tier in self.degradation_tiers:
            if usage_rate < tier["threshold"]:
                return tier["models"].get(task_type, tier["models"]["default"])
        
        # 超出预算
        raise RuntimeError(f"月预算已用完: {usage_rate:.1%}")


class CostTracker:
    """成本追踪器"""
    
    # 模型定价 ($/1K tokens)
    PRICING = {
        "gpt-4o":          {"input": 0.0025,  "output": 0.01},
        "gpt-4o-mini":     {"input": 0.00015, "output": 0.0006},
        "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
        "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
        "deepseek-chat":   {"input": 0.00027, "output": 0.0011},
    }
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.daily_costs: dict[str, float] = {}
        self.monthly_costs: dict[str, float] = {}
    
    def calculate(self, request: AIRequest, response: AIResponse) -> float:
        """计算单次请求成本"""
        model = response.model
        if model not in self.PRICING:
            return 0.0
        
        pricing = self.PRICING[model]
        input_cost = (response.prompt_tokens / 1000) * pricing["input"]
        output_cost = (response.completion_tokens / 1000) * pricing["output"]
        total = input_cost + output_cost
        
        # 记录
        self._record(request.user_id, request.project_id, total)
        
        return total
    
    def _record(self, user_id: str, project_id: str, cost: float):
        """记录成本"""
        today = time.strftime("%Y-%m-%d")
        month = time.strftime("%Y-%m")
        
        key_daily = f"cost:daily:{today}:{user_id}"
        key_monthly = f"cost:monthly:{month}:{project_id}"
        
        if self.redis:
            self.redis.incrbyfloat(key_daily, cost)
            self.redis.incrbyfloat(key_monthly, cost)
            self.redis.expire(key_daily, 86400 * 2)
            self.redis.expire(key_monthly, 86400 * 35)
        else:
            self.daily_costs[key_daily] = self.daily_costs.get(key_daily, 0) + cost
            self.monthly_costs[key_monthly] = self.monthly_costs.get(key_monthly, 0) + cost
    
    def get_monthly_usage(self) -> float:
        """获取当月总成本"""
        month = time.strftime("%Y-%m")
        if self.redis:
            total = 0
            for key in self.redis.keys(f"cost:monthly:{month}:*"):
                total += float(self.redis.get(key))
            return total
        else:
            return sum(
                v for k, v in self.monthly_costs.items()
                if month in k
            )
```

### 5.3 Prompt 压缩

```python
class PromptCompressor:
    """Prompt 压缩器"""
    
    def __init__(self, max_input_tokens: int = 6000):
        self.max_input_tokens = max_input_tokens
    
    def compress(self, messages: list[dict]) -> list[dict]:
        """压缩 prompt 以减少 token 数"""
        
        # 1. 计算当前 token 估算
        total_chars = sum(len(m.get("content", "")) for m in messages)
        estimated_tokens = total_chars // 4  # 粗略估算
        
        if estimated_tokens <= self.max_input_tokens:
            return messages  # 不需要压缩
        
        # 2. 策略1: 移除历史对话中的旧消息
        compressed = self._truncate_history(messages)
        
        # 3. 策略2: 摘要历史对话
        if self._estimate_tokens(compressed) > self.max_input_tokens:
            compressed = self._summarize_history(compressed)
        
        # 4. 策略3: 移除冗余信息
        compressed = self._remove_redundancy(compressed)
        
        return compressed
    
    def _truncate_history(self, messages: list[dict]) -> list[dict]:
        """截断历史对话，保留最近 N 轮"""
        # 保留系统消息
        system_msgs = [m for m in messages if m.get("role") == "system"]
        conversation = [m for m in messages if m.get("role") != "system"]
        
        # 保留最近 5 轮（10条消息）
        max_turns = 10
        if len(conversation) > max_turns:
            conversation = conversation[-max_turns:]
        
        return system_msgs + conversation
    
    def _summarize_history(self, messages: list[dict]) -> list[dict]:
        """摘要历史对话"""
        system_msgs = [m for m in messages if m.get("role") == "system"]
        conversation = [m for m in messages if m.get("role") != "system"]
        
        if len(conversation) <= 2:
            return messages
        
        # 将早期对话摘要为一条消息
        old_conversation = conversation[:-4]  # 保留最近4条
        recent = conversation[-4:]
        
        # 生成摘要（实际场景中调用 LLM）
        summary = self._generate_summary(old_conversation)
        
        summary_msg = {
            "role": "system",
            "content": f"[对话历史摘要] {summary}"
        }
        
        return system_msgs + [summary_msg] + recent
    
    def _generate_summary(self, messages: list[dict]) -> str:
        """生成对话摘要"""
        # 简化实现：拼接关键信息
        # 生产环境应调用 LLM 生成摘要
        key_points = []
        for msg in messages:
            if msg.get("role") == "user":
                key_points.append(f"用户问: {msg['content'][:100]}")
            elif msg.get("role") == "assistant":
                key_points.append(f"AI答: {msg['content'][:100]}")
        
        return " | ".join(key_points[-5:])  # 最近5个关键点
    
    def _remove_redundancy(self, messages: list[dict]) -> list[dict]:
        """移除冗余信息"""
        for msg in messages:
            content = msg.get("content", "")
            # 移除多余空行
            import re
            content = re.sub(r'\n{3,}', '\n\n', content)
            # 移除多余空格
            content = re.sub(r' {2,}', ' ', content)
            msg["content"] = content
        return messages
```

## 六、模型执行器与故障转移

```python
import asyncio
import time
from typing import Optional

class ModelExecutor:
    """模型执行器：带重试和故障转移"""
    
    def __init__(self, max_retries: int = 3, timeout: float = 30.0):
        self.max_retries = max_retries
        self.timeout = timeout
        
        # 模型客户端
        self.clients = {
            ModelProvider.OPENAI: self._init_openai(),
            ModelProvider.ANTHROPIC: self._init_anthropic(),
            ModelProvider.DEEPSEEK: self._init_deepseek(),
        }
    
    async def execute_with_failover(
        self,
        request: AIRequest,
        failover_models: list[str] = None
    ) -> AIResponse:
        """带故障转移的执行"""
        
        models_to_try = [request.routed_model] + (failover_models or [])
        
        for i, model in enumerate(models_to_try):
            try:
                response = await self._execute_with_retry(request, model)
                if response.error is None:
                    return response
                
                # 如果是内容过滤等非临时错误，不重试
                if response.error_type in ("content_filter", "invalid_request"):
                    return response
                    
            except Exception as e:
                print(f"模型 {model} 执行失败: {e}")
                if i < len(models_to_try) - 1:
                    print(f"故障转移到: {models_to_try[i+1]}")
                    request.routed_model = models_to_try[i + 1]
                    request.provider = self._get_provider(models_to_try[i + 1])
                    continue
                else:
                    return AIResponse(
                        request_id=request.request_id,
                        content="",
                        model=model,
                        provider=request.provider or ModelProvider.OPENAI,
                        error=f"所有模型都失败: {str(e)}",
                        error_type="all_models_failed"
                    )
        
        return response
    
    async def _execute_with_retry(
        self,
        request: AIRequest,
        model: str
    ) -> AIResponse:
        """带重试的执行"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                # 超时控制
                response = await asyncio.wait_for(
                    self._call_model(request, model),
                    timeout=self.timeout * (attempt + 1)  # 递增超时
                )
                
                response.latency_ms = (time.time() - start_time) * 1000
                response.retry_count = attempt
                
                return response
                
            except asyncio.TimeoutError:
                last_error = "Timeout"
                print(f"超时, 重试 {attempt + 1}/{self.max_retries}")
            except Exception as e:
                last_error = str(e)
                # 指数退避
                wait_time = 2 ** attempt
                print(f"错误: {e}, 等待 {wait_time}s 后重试")
                await asyncio.sleep(wait_time)
        
        return AIResponse(
            request_id=request.request_id,
            content="",
            model=model,
            provider=request.provider or ModelProvider.OPENAI,
            error=f"重试 {self.max_retries} 次后仍失败: {last_error}",
            error_type="retry_exhausted"
        )
    
    async def _call_model(self, request: AIRequest, model: str) -> AIResponse:
        """调用具体模型"""
        provider = request.provider or self._get_provider(model)
        client = self.clients.get(provider)
        
        if client is None:
            raise ValueError(f"未配置 provider: {provider}")
        
        # 按 provider 调用
        if provider == ModelProvider.OPENAI:
            return await self._call_openai(client, request, model)
        elif provider == ModelProvider.ANTHROPIC:
            return await self._call_anthropic(client, request, model)
        elif provider == ModelProvider.DEEPSEEK:
            return await self._call_deepseek(client, request, model)
    
    async def _call_openai(self, client, request: AIRequest, model: str) -> AIResponse:
        """调用 OpenAI API"""
        import openai
        
        response = await client.chat.completions.create(
            model=model,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        
        choice = response.choices[0]
        usage = response.usage
        
        return AIResponse(
            request_id=request.request_id,
            content=choice.message.content,
            model=model,
            provider=ModelProvider.OPENAI,
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=usage.total_tokens,
        )
    
    async def _call_anthropic(self, client, request: AIRequest, model: str) -> AIResponse:
        """调用 Anthropic API"""
        # 分离系统消息和对话消息
        system_content = ""
        messages = []
        for msg in request.messages:
            if msg["role"] == "system":
                system_content += msg["content"] + "\n"
            else:
                messages.append(msg)
        
        response = await client.messages.create(
            model=model,
            system=system_content.strip(),
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        
        content = "".join(block.text for block in response.content if hasattr(block, 'text'))
        
        return AIResponse(
            request_id=request.request_id,
            content=content,
            model=model,
            provider=ModelProvider.ANTHROPIC,
            prompt_tokens=response.usage.input_tokens,
            completion_tokens=response.usage.output_tokens,
            total_tokens=response.usage.input_tokens + response.usage.output_tokens,
        )
    
    def _get_provider(self, model: str) -> ModelProvider:
        if "gpt" in model:
            return ModelProvider.OPENAI
        elif "claude" in model:
            return ModelProvider.ANTHROPIC
        elif "deepseek" in model:
            return ModelProvider.DEEPSEEK
        return ModelProvider.OPENAI
```

## 七、可观测性

```python
from collections import defaultdict
from datetime import datetime
import statistics

class MetricsCollector:
    """指标收集器"""
    
    def __init__(self):
        self.metrics = {
            "requests": defaultdict(int),
            "tokens": defaultdict(int),
            "costs": defaultdict(float),
            "latencies": defaultdict(list),
            "errors": defaultdict(int),
            "cache_hits": defaultdict(int),
            "cache_misses": defaultdict(int),
        }
    
    def record(self, request: AIRequest, response: AIResponse):
        """记录请求指标"""
        model = response.model
        user = request.user_id
        project = request.project_id
        
        # 请求数
        self.metrics["requests"][f"model:{model}"] += 1
        self.metrics["requests"][f"user:{user}"] += 1
        self.metrics["requests"][f"project:{project}"] += 1
        self.metrics["requests"]["total"] += 1
        
        # Token 数
        self.metrics["tokens"][f"model:{model}:input"] += response.prompt_tokens
        self.metrics["tokens"][f"model:{model}:output"] += response.completion_tokens
        self.metrics["tokens"][f"model:{model}:total"] += response.total_tokens
        
        # 成本
        self.metrics["costs"][f"model:{model}"] += response.cost_usd
        self.metrics["costs"][f"user:{user}"] += response.cost_usd
        self.metrics["costs"][f"project:{project}"] += response.cost_usd
        self.metrics["costs"]["total"] += response.cost_usd
        
        # 延迟
        self.metrics["latencies"][f"model:{model}"].append(response.latency_ms)
        self.metrics["latencies"]["total"].append(response.latency_ms)
        
        # 错误
        if response.error:
            self.metrics["errors"][f"model:{model}:{response.error_type}"] += 1
            self.metrics["errors"]["total"] += 1
        
        # 缓存
        if response.cache_hit:
            self.metrics["cache_hits"]["total"] += 1
        else:
            self.metrics["cache_misses"]["total"] += 1
    
    def get_dashboard(self) -> dict:
        """获取监控面板数据"""
        total_requests = self.metrics["requests"]["total"]
        total_cost = self.metrics["costs"]["total"]
        
        # 延迟统计
        all_latencies = self.metrics["latencies"]["total"]
        latency_stats = {}
        if all_latencies:
            latency_stats = {
                "p50": statistics.median(all_latencies),
                "p95": statistics.quantiles(all_latencies, n=20)[18] if len(all_latencies) > 20 else max(all_latencies),
                "p99": statistics.quantiles(all_latencies, n=100)[98] if len(all_latencies) > 100 else max(all_latencies),
                "avg": statistics.mean(all_latencies),
            }
        
        # 缓存命中率
        cache_hits = self.metrics["cache_hits"]["total"]
        cache_misses = self.metrics["cache_misses"]["total"]
        cache_total = cache_hits + cache_misses
        cache_hit_rate = cache_hits / cache_total if cache_total > 0 else 0
        
        # 错误率
        error_rate = self.metrics["errors"]["total"] / total_requests if total_requests > 0 else 0
        
        return {
            "summary": {
                "total_requests": total_requests,
                "total_cost_usd": round(total_cost, 4),
                "error_rate": f"{error_rate:.2%}",
                "cache_hit_rate": f"{cache_hit_rate:.2%}",
                "latency_ms": {k: round(v, 1) for k, v in latency_stats.items()},
            },
            "by_model": self._model_breakdown(),
            "by_user": self._user_breakdown(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _model_breakdown(self) -> dict:
        """按模型分解"""
        breakdown = {}
        for key, count in self.metrics["requests"].items():
            if key.startswith("model:"):
                model = key.split(":")[1]
                breakdown[model] = {
                    "requests": count,
                    "tokens": self.metrics["tokens"].get(f"model:{model}:total", 0),
                    "cost_usd": round(self.metrics["costs"].get(f"model:{model}", 0), 4),
                }
        return breakdown
    
    def _user_breakdown(self) -> dict:
        """按用户分解"""
        breakdown = {}
        for key, count in self.metrics["requests"].items():
            if key.startswith("user:"):
                user = key.split(":", 1)[1]
                breakdown[user] = {
                    "requests": count,
                    "cost_usd": round(self.metrics["costs"].get(f"user:{user}", 0), 4),
                }
        return breakdown
```

## 八、完整使用示例

```python
# ===== 完整的 AI Gateway 使用示例 =====

import asyncio

async def main():
    # 初始化 Gateway
    gateway = AIGateway()
    
    # 配置路由策略
    gateway.router.strategy = "task"  # task | cost | latency | load_balance
    
    # 场景1: 代码生成
    code_request = AIRequest(
        request_id="req_001",
        user_id="user_alice",
        project_id="proj_backend",
        messages=[
            {"role": "system", "content": "你是一个 Python 专家"},
            {"role": "user", "content": "写一个快速排序的实现"}
        ],
        task_type="code",
        max_tokens=500,
    )
    
    response = await gateway.process(code_request)
    print(f"代码生成 ({response.model}): ${response.cost_usd:.4f}")
    
    # 场景2: 简单聊天（自动路由到便宜模型）
    chat_request = AIRequest(
        request_id="req_002",
        user_id="user_alice",
        project_id="proj_backend",
        messages=[
            {"role": "user", "content": "今天天气真好"}
        ],
        task_type="chat",
        max_tokens=100,
    )
    
    response = await gateway.process(chat_request)
    print(f"聊天 ({response.model}): ${response.cost_usd:.4f}")
    
    # 场景3: 相同请求第二次（命中缓存）
    response2 = await gateway.process(chat_request)
    print(f"缓存命中: {response2.cache_hit}, 节省: ${response2.cost_usd:.4f}")
    
    # 查看监控面板
    dashboard = gateway.monitor.get_dashboard()
    print(f"\n=== 监控面板 ===")
    print(f"总请求: {dashboard['summary']['total_requests']}")
    print(f"总成本: ${dashboard['summary']['total_cost_usd']}")
    print(f"缓存命中率: {dashboard['summary']['cache_hit_rate']}")
    print(f"P95延迟: {dashboard['summary']['latency_ms'].get('p95', 0)}ms")

asyncio.run(main())
```

## 九、面试要点

### Q1: AI Gateway 的核心价值是什么？

**答**：(1) 统一入口——业务代码只对接一个 API，模型切换零代码改动；(2) 成本控制——语义缓存节省 30-50%、模型降级在预算紧张时自动切换便宜模型、Prompt 压缩减少输入 token；(3) 可靠性——自动重试、故障转移、超时控制保障服务可用性；(4) 可观测性——统一监控调用量、延迟、成本、错误率；(5) 安全——API Key 集中管理、PII 脱敏、内容审核。

### Q2: Token 级别限流和 RPM 限流有什么区别？

**答**：RPM（每分钟请求数）限流无法区分请求大小——一个 10000 token 的请求和一个 100 token 的请求算同样的"一次"。Token 级别限流直接限制每分钟的 token 总量，更公平也更精确——高消耗用户自然受限更多，低消耗用户不受影响。实际中两者结合使用：RPM 防止请求洪水，TPM 控制实际资源消耗。

### Q3: 语义缓存和精确缓存有什么区别？

**答**：精确缓存要求请求完全一致（通常 hash 匹配），命中率低但 100% 准确。语义缓存用嵌入模型计算请求的语义相似度，相似请求（如"今天天气"和"今日天气"）可以命中同一个缓存，命中率显著提升但可能有误差。实践建议：(1) 高精度场景用精确缓存；(2) 闲聊/FAQ 场景用语义缓存（相似度阈值设 0.95 以上）；(3) 缓存设置合理 TTL，避免过期信息。

### Q4: 如何实现模型故障转移？

**答**：(1) 健康检查——定期 ping 各模型 API，维护健康状态表；(2) 故障转移链——每个模型配置一个备选模型（如 GPT-4o → Claude → DeepSeek）；(3) 自动切换——主模型失败时自动切到备选，对调用方透明；(4) 半开恢复——故障模型恢复后先进入"半开"状态，只放少量请求验证，确认稳定后再恢复全量。

### Q5: 如何控制大模型的月度成本？

**答**：四层控制：(1) 缓存——语义缓存+精确缓存，重复请求不花钱；(2) 路由——简单任务自动用便宜模型（GPT-4o-mini 比 GPT-4o 便宜 16 倍）；(3) 降级——预算使用超过阈值时自动降级（50% 时降级非关键任务，70% 时全量降级，90% 时只读缓存）；(4) 配额——按用户/项目设硬配额上限，超出直接拒绝。

## 十、避坑指南

### 坑1: 缓存导致用户看到"别人的"回答

```python
# ❌ 缓存 key 不包含用户信息
cache_key = hash(messages + model + temperature)
# 如果两个用户问了相同的问题，会命中同一个缓存
# 可能泄露上下文信息

# ✅ 缓存 key 包含用户上下文（除非是无状态问答）
cache_key = hash(
    user_id +            # 用户隔离
    messages + 
    model + 
    temperature +
    max_tokens
)

# ✅ 对于通用问答（无个人信息），可以跨用户共享缓存
# 但要确保 messages 中不包含用户隐私信息
```

### 坑2: 故障转移导致成本翻倍

```python
# ❌ 没有限制故障转移的模型
failover_chain = ["gpt-4o", "claude-sonnet-4-20250514", "gpt-4o"]  # GPT-4o 出现两次
# 如果 GPT-4o 挂了，会先试 GPT-4o（失败），再试 Claude，再试 GPT-4o（又失败）
# 浪费时间和成本

# ✅ 故障转移链不重复，且备选模型成本相当或更低
failover_chain = ["gpt-4o", "claude-sonnet-4-20250514", "deepseek-chat"]
```

### 坑3: Token 估算不准导致限流失效

```python
# ❌ 用简单的字符数估算
estimated_tokens = len(text) / 4  # 中文场景严重低估

# ✅ 用 tokenizer 精确计算
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4o")
exact_tokens = len(enc.encode(text))

# ✅ 至少区分中英文
chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
if chinese_chars / len(text) > 0.3:
    estimated = len(text) / 1.5  # 中文为主
else:
    estimated = len(text) / 4    # 英文为主
```

### 坑4: 忽略流式请求的限流

```python
# ❌ 流式请求只计了请求 token，没计输出 token
# 用户可以发起大量流式请求消耗输出 token

# ✅ 流式请求也要限流
# 1. 预留输出 token 额度: estimated = input_tokens + max_tokens
# 2. 流式完成后更新实际消耗
# 3. 如果实际超限，记录超额使用并限制后续请求
```

### 坑5: 监控数据没有按维度细分

```python
# ❌ 只看总量
total_cost = sum(all_costs)
print(f"本月总成本: ${total_cost}")
# 看不出哪个模型/用户/项目在烧钱

# ✅ 多维度监控
dashboard = {
    "by_model": {"gpt-4o": 3000, "claude": 1500, "deepseek": 500},
    "by_user": {"alice": 2000, "bob": 1500, "charlie": 1500},
    "by_project": {"backend": 2500, "frontend": 1500, "data": 1000},
    "by_task": {"code": 2000, "chat": 800, "reasoning": 2200},
    "trend": "本周比上周+15%，主要由 backend 项目的 code 任务驱动",
}
```

## 十一、总结

AI Gateway 是大模型生产化部署的核心基础设施。核心要点：

1. **路由是大脑**：按任务/成本/延迟多策略路由，配合健康检查和故障转移
2. **限流是保险**：Token 级别限流比 RPM 更公平，多层级配额防止成本失控
3. **缓存是省钱利器**：语义缓存可节省 30-50% 成本，但要注意隐私和时效
4. **成本控制是生存线**：缓存+路由降级+配额三管齐下，月度成本可预测
5. **可观测性是眼睛**：多维度监控（模型/用户/项目/任务），P95 延迟和成本趋势
6. **可靠性是底线**：重试+故障转移+超时控制+熔断，保障服务可用性
