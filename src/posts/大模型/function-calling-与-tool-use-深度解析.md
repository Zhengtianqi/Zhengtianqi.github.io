---
title: Function Calling 与 Tool Use 深度解析：从原理到生产实践
tag: ["Function Calling", "Tool Use", "Agent"]
category: 大模型
date: 2026-07-03
---

# Function Calling 与 Tool Use 深度解析：从原理到生产实践

> 当大模型从"聊天助手"进化为"行动助手"，Function Calling 是那把打开现实世界大门的钥匙。本文将从底层原理到生产部署，全面解析大模型工具调用体系。

## 一、Function Calling 的本质：结构化输出的特殊应用

### 1.1 从自由文本到结构化调用

传统大模型的输出是自由文本——你问它天气，它可能回答"今天天气不错"，而不是去查天气。Function Calling 的本质是：**让模型在理解用户意图后，输出一个结构化的函数调用请求，由外部系统执行并将结果返回给模型**。

整个过程可以简化为：

```
用户: "帮我查一下北京明天的天气"
        │
        ▼
┌─────────────────────────────────┐
│  LLM 意图理解                    │
│  输入: 用户消息 + 工具定义列表     │
│  输出: {"name": "get_weather",   │
│         "args": {               │
│           "city": "北京",        │
│           "date": "明天"         │
│         }}                      │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  外部执行层                       │
│  调用 get_weather(city, date)    │
│  返回: {"temp": 15, "rain": 30%} │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  LLM 结果整合                    │
│  "北京明天气温约15°C，           │
│   降雨概率30%，建议带伞。"       │
└─────────────────────────────────┘
```

### 1.2 训练阶段的特殊处理

Function Calling 不是简单的 prompt engineering，而是在模型训练阶段就嵌入了特殊能力。以 GPT-4 为例，模型在 SFT（监督微调）阶段会学习：

1. **识别何时调用工具**：不是所有问题都需要工具
2. **提取正确参数**：从自然语言中抽取结构化参数
3. **生成合法 JSON**：确保输出可以被程序解析
4. **整合工具返回值**：将工具结果融入自然语言回复

训练数据中包含了大量 `<tool_call>` 格式的示例，使模型学会在适当时机输出符合 schema 的结构化数据。

## 二、不同厂商的 Function Calling 实现差异

### 2.1 OpenAI：Function Calling 原生支持

OpenAI 是最早推出 Function Calling 的厂商（2023年6月），其实现方式最为标准化。

```python
import openai
import json

# 定义工具
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_price",
            "description": "获取指定股票的当前价格",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "股票代码，如 AAPL、GOOGL"
                    },
                    "exchange": {
                        "type": "string",
                        "enum": ["NYSE", "NASDAQ", "HKEX"],
                        "description": "交易所"
                    }
                },
                "required": ["symbol"]
            }
        }
    }
]

# 第一次调用：模型决定是否调用函数
response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "苹果公司现在股价多少？"}
    ],
    tools=tools,
    tool_choice="auto"  # auto | none | required | 指定函数
)

# 检查模型是否决定调用函数
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    func_name = tool_call.function.name
    func_args = json.loads(tool_call.function.arguments)
    
    print(f"模型要调用: {func_name}")
    print(f"参数: {func_args}")
    # 输出:
    # 模型要调用: get_stock_price
    # 参数: {'symbol': 'AAPL'}
    
    # 执行函数
    result = get_stock_price(**func_args)
    
    # 将结果返回给模型进行第二轮对话
    messages = [
        {"role": "user", "content": "苹果公司现在股价多少？"},
        response.choices[0].message,
        {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result)
        }
    ]
    
    final_response = openai.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools
    )
    print(final_response.choices[0].message.content)
```

OpenAI 的关键特性：

| 特性 | 说明 |
|------|------|
| `tool_choice` | `auto`（自动决定）、`none`（不调用）、`required`（必须调用）、指定函数名 |
| 并行调用 | GPT-4o 支持一次返回多个 tool_call |
| `tool_call_id` | 用于关联调用与返回结果，支持多轮 |
| 流式输出 | 支持 `stream=True` 时流式返回工具调用 |

### 2.2 Anthropic Claude：Tool Use Block 机制

Claude 使用了一种不同的机制——不是独立的 `tool_calls` 字段，而是将工具调用作为消息内容的一部分（Content Block）。

```python
import anthropic

client = anthropic.Anthropic()

# 定义工具（与 OpenAI 略有不同）
tools = [
    {
        "name": "get_stock_price",
        "description": "获取指定股票的当前价格",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "股票代码，如 AAPL、GOOGL"
                }
            },
            "required": ["symbol"]
        }
    }
]

# Claude 的工具调用
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "苹果公司现在股价多少？"}
    ]
)

# Claude 将工具调用放在 content blocks 中
for block in response.content:
    if block.type == "tool_use":
        print(f"工具名: {block.name}")
        print(f"参数: {block.input}")
        print(f"ID: {block.id}")
        
        # 执行工具
        result = get_stock_price(**block.input)
        
        # 返回结果给 Claude
        followup = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            tools=tools,
            messages=[
                {"role": "user", "content": "苹果公司现在股价多少？"},
                {"role": "assistant", "content": response.content},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result)
                        }
                    ]
                }
            ]
        )
        print(followup.content[0].text)
```

**OpenAI vs Anthropic 的核心差异**：

```
┌─────────────────┬──────────────────────┬──────────────────────┐
│     特性         │  OpenAI              │  Anthropic           │
├─────────────────┼──────────────────────┼──────────────────────┤
│  工具定义字段    │  parameters          │  input_schema        │
│  调用位置        │  message.tool_calls  │  content blocks      │
│  结果返回方式    │  role: "tool"        │  type: "tool_result" │
│  并行调用        │  ✅ 原生支持          │  ✅ 支持              │
│  强制调用控制    │  tool_choice 参数     │  tool_choice 参数     │
│  流式工具调用    │  ✅                  │  ✅                   │
│  工具调用与文本   │  分离（tool_calls     │  混合（content 中     │
│  混合输出        │  独立于 content）     │  可同时有 text 和     │
│                  │                      │  tool_use block）     │
└─────────────────┴──────────────────────┴──────────────────────┘
```

Claude 的混合输出方式有一个显著优势：模型可以在调用工具的同时输出思考文本，例如 "让我查一下苹果公司的股价..."，这对于用户体验来说更自然。

### 2.3 开源模型：通过 Chat Template 实现

开源模型（如 Qwen、Llama、Mistral）的 Function Calling 主要依赖 **Chat Template**——一种在 Jinja2 模板中定义特殊 token 标记工具调用的方式。

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct")

# Qwen2 的工具调用格式
messages = [
    {
        "role": "system",
        "content": "You are a helpful assistant."
    },
    {
        "role": "user",
        "content": "北京天气怎么样？"
    }
]

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"]
            }
        }
    }
]

# 应用 chat template
text = tokenizer.apply_chat_template(
    messages,
    tools=tools,
    tokenize=False,
    add_generation_prompt=True
)

print(text)
```

Qwen2 的 chat template 会将工具定义以特定格式注入到系统提示中：

```
<|im_start|>system
You are a helpful assistant.

# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
{"type": "function", "function": {"name": "get_weather", ...}}
</tools>

For each function call, return a json object with function name and arguments:
<tool_call>
{"name": "function_name", "arguments": {"arg1": "value1"}}
</tool_call>
<|im_end|>
```

不同开源模型的模板格式差异：

```
┌───────────────┬────────────────────────────┬────────────────────────┐
│    模型        │  工具调用标记               │  解析方式               │
├───────────────┼────────────────────────────┼────────────────────────┤
│  Qwen2/2.5    │  <tool_call>JSON</tool_call>│  正则提取 JSON          │
│  Llama 3.1    │  <python_code>JSON</python> │  XML 标签提取           │
│  Mistral      │  [TOOL_CALLS]JSON           │  特殊前缀解析           │
│  GLM-4        │  <tool_call>JSON</tool_call>│  类似 Qwen              │
│  Yi           │  原生 function_call 格式     │  tokenizer 解析         │
└───────────────┴────────────────────────────┴────────────────────────┘
```

## 三、工具定义 Schema 深入

### 3.1 JSON Schema 基础

Function Calling 的工具定义基于 JSON Schema 规范，但各厂商对 JSON Schema 的支持程度不同。以下是完整的 schema 示例：

```python
# 一个复杂的工具定义示例
tool_definitions = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "在商品库中搜索商品。支持关键词搜索、价格过滤和分类筛选。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["electronics", "clothing", "food", "books"],
                        "description": "商品分类"
                    },
                    "price_range": {
                        "type": "object",
                        "properties": {
                            "min": {"type": "number", "description": "最低价格"},
                            "max": {"type": "number", "description": "最高价格"}
                        },
                        "description": "价格范围"
                    },
                    "sort_by": {
                        "type": "string",
                        "enum": ["price_asc", "price_desc", "relevance", "sales"],
                        "default": "relevance",
                        "description": "排序方式"
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 100,
                        "default": 10,
                        "description": "返回数量"
                    }
                },
                "required": ["query"]
            }
        }
    }
]
```

### 3.2 参数提取的常见问题

模型在提取参数时经常出现以下问题：

```python
import json
from datetime import datetime

def validate_tool_args(func_name: str, args: dict, schema: dict) -> dict:
    """校验并修复模型输出的工具参数"""
    errors = []
    cleaned = {}
    
    properties = schema["function"]["parameters"]["properties"]
    required = schema["function"]["parameters"].get("required", [])
    
    for prop_name, prop_schema in properties.items():
        if prop_name in args:
            value = args[prop_name]
            # 类型校验
            expected_type = prop_schema["type"]
            if expected_type == "string" and not isinstance(value, str):
                cleaned[prop_name] = str(value)
            elif expected_type == "number" and isinstance(value, (int, float)):
                cleaned[prop_name] = float(value)
            elif expected_type == "integer" and isinstance(value, (int, float)):
                cleaned[prop_name] = int(value)
            elif expected_type == "boolean":
                cleaned[prop_name] = bool(value)
            elif expected_type == "object" and isinstance(value, dict):
                cleaned[prop_name] = value
            elif expected_type == "array" and isinstance(value, list):
                cleaned[prop_name] = value
            else:
                cleaned[prop_name] = value
                
            # 枚举校验
            if "enum" in prop_schema and cleaned[prop_name] not in prop_schema["enum"]:
                errors.append(f"'{prop_name}' 值 '{cleaned[prop_name]}' 不在允许范围: {prop_schema['enum']}")
            
            # 范围校验
            if "minimum" in prop_schema and isinstance(cleaned[prop_name], (int, float)):
                if cleaned[prop_name] < prop_schema["minimum"]:
                    errors.append(f"'{prop_name}' 值 {cleaned[prop_name]} 小于最小值 {prop_schema['minimum']}")
            if "maximum" in prop_schema and isinstance(cleaned[prop_name], (int, float)):
                if cleaned[prop_name] > prop_schema["maximum"]:
                    errors.append(f"'{prop_name}' 值 {cleaned[prop_name]} 大于最大值 {prop_schema['maximum']}")
        elif prop_name in required:
            errors.append(f"缺少必填参数: '{prop_name}'")
        elif "default" in prop_schema:
            cleaned[prop_name] = prop_schema["default"]
    
    if errors:
        raise ValueError(f"参数校验失败: {'; '.join(errors)}")
    
    return cleaned
```

### 3.3 提高参数提取准确率的技巧

1. **description 要详细**：不要只写 "城市名"，要写 "城市名，如'北京'、'上海'，不支持英文"
2. **用 enum 限定取值**：减少模型的自由发挥空间
3. **提供 default 值**：减少模型需要填写的参数
4. **复杂参数拆分**：嵌套 object 容易出错，尽量拍平
5. **在 description 中给示例**：`"date": "日期，格式 YYYY-MM-DD，如 '2026-01-15'"`

```python
# ❌ 不好的工具定义
bad_tool = {
    "name": "search",
    "description": "搜索",
    "parameters": {
        "type": "object",
        "properties": {
            "q": {"type": "string", "description": "查询"},
            "t": {"type": "string", "description": "类型"}
        }
    }
}

# ✅ 好的工具定义
good_tool = {
    "name": "search_articles",
    "description": "在技术文章库中搜索文章。支持按关键词、作者、标签和发布日期范围筛选。",
    "parameters": {
        "type": "object",
        "properties": {
            "keyword": {
                "type": "string",
                "description": "搜索关键词，如 'Transformer attention'"
            },
            "author": {
                "type": "string",
                "description": "作者名，如 'Ashish Vaswani'"
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "文章标签列表，如 ['NLP', 'deep-learning']"
            },
            "date_from": {
                "type": "string",
                "description": "发布日期起始（含），格式 YYYY-MM-DD，如 '2023-01-01'",
                "pattern": r"^\d{4}-\d{2}-\d{2}$"
            },
            "date_to": {
                "type": "string",
                "description": "发布日期截止（含），格式 YYYY-MM-DD",
                "pattern": r"^\d{4}-\d{2}-\d{2}$"
            }
        },
        "required": ["keyword"]
    }
}
```

## 四、多轮工具调用编排

### 4.1 单轮 vs 多轮 vs 并行调用

```
场景1: 单轮调用
用户 → LLM → 调用 get_weather → 结果 → LLM → 回复

场景2: 多轮串行调用
用户 → LLM → 调用 search_products → 结果
     → LLM → 调用 get_reviews(product_id) → 结果
     → LLM → 调用 get_stock(product_id) → 结果
     → LLM → 综合回复

场景3: 并行调用
用户 → LLM → 同时调用 get_weather + get_calendar + get_news
     → 所有结果返回 → LLM → 综合回复
```

### 4.2 完整的多轮编排框架

```python
import json
import time
from typing import Any, Callable
from dataclasses import dataclass, field

@dataclass
class ToolCallContext:
    """工具调用上下文"""
    call_id: str
    name: str
    arguments: dict
    result: Any = None
    error: str | None = None
    start_time: float = 0
    end_time: float = 0
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

@dataclass
class ToolRegistry:
    """工具注册中心"""
    tools: dict[str, Callable] = field(default_factory=dict)
    schemas: list[dict] = field(default_factory=list)
    
    def register(self, schema: dict, handler: Callable):
        name = schema["function"]["name"]
        self.tools[name] = handler
        self.schemas.append(schema)
    
    def execute(self, name: str, arguments: dict) -> Any:
        if name not in self.tools:
            raise ValueError(f"未知工具: {name}")
        return self.tools[name](**arguments)

class ToolOrchestrator:
    """多轮工具调用编排器"""
    
    def __init__(
        self,
        registry: ToolRegistry,
        max_turns: int = 10,
        tool_timeout: float = 30.0,
        max_retries: int = 2
    ):
        self.registry = registry
        self.max_turns = max_turns
        self.tool_timeout = tool_timeout
        self.max_retries = max_retries
    
    def run(self, user_message: str, client, model: str) -> str:
        """运行多轮工具调用循环"""
        messages = [{"role": "user", "content": user_message}]
        all_contexts: list[ToolCallContext] = []
        
        for turn in range(self.max_turns):
            # 调用模型
            response = self._call_model(client, model, messages)
            assistant_message = response.choices[0].message
            
            # 检查是否有工具调用
            if not assistant_message.tool_calls:
                # 没有工具调用，返回最终回复
                return assistant_message.content
            
            # 将 assistant 消息加入对话
            messages.append(assistant_message)
            
            # 执行所有工具调用
            for tool_call in assistant_message.tool_calls:
                ctx = ToolCallContext(
                    call_id=tool_call.id,
                    name=tool_call.function.name,
                    arguments=json.loads(tool_call.function.arguments)
                )
                
                # 带重试的执行
                for attempt in range(self.max_retries + 1):
                    try:
                        ctx.start_time = time.time()
                        result = self._execute_with_timeout(ctx.name, ctx.arguments)
                        ctx.result = result
                        ctx.end_time = time.time()
                        break
                    except TimeoutError:
                        ctx.error = f"工具执行超时（{self.tool_timeout}s）"
                        ctx.end_time = time.time()
                        if attempt < self.max_retries:
                            print(f"重试 {attempt + 1}/{self.max_retries}: {ctx.name}")
                    except Exception as e:
                        ctx.error = str(e)
                        ctx.end_time = time.time()
                        if attempt < self.max_retries:
                            print(f"重试 {attempt + 1}/{self.max_retries}: {ctx.name}")
                
                all_contexts.append(ctx)
                
                # 将结果（或错误）返回给模型
                result_content = ctx.result if ctx.result is not None else {"error": ctx.error}
                messages.append({
                    "role": "tool",
                    "tool_call_id": ctx.call_id,
                    "content": json.dumps(result_content, ensure_ascii=False, default=str)
                })
            
            # 继续下一轮，让模型处理工具结果
        
        return "达到最大轮次限制，无法完成任务。"
    
    def _call_model(self, client, model, messages):
        return client.chat.completions.create(
            model=model,
            messages=messages,
            tools=self.registry.schemas,
            tool_choice="auto"
        )
    
    def _execute_with_timeout(self, name: str, args: dict):
        """带超时的工具执行"""
        import signal
        from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
        
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self.registry.execute, name, args)
            try:
                return future.result(timeout=self.tool_timeout)
            except FutureTimeout:
                raise TimeoutError(f"工具 {name} 执行超时")


# ===== 使用示例 =====
import openai

# 1. 创建工具注册中心
registry = ToolRegistry()

# 注册天气工具
registry.register(
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名"}
                },
                "required": ["city"]
            }
        }
    },
    lambda city: {"city": city, "temp": 20, "condition": "晴"}
)

# 注册日历工具
registry.register(
    {
        "type": "function",
        "function": {
            "name": "get_schedule",
            "description": "获取指定日期的日程安排",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "日期 YYYY-MM-DD"}
                },
                "required": ["date"]
            }
        }
    },
    lambda date: {"date": date, "events": ["10:00 团队会议", "14:00 代码评审"]}
)

# 2. 运行编排器
orchestrator = ToolOrchestrator(
    registry=registry,
    max_turns=5,
    tool_timeout=10.0
)

client = openai.OpenAI()
result = orchestrator.run(
    "帮我看看北京今天天气怎么样，还有我今天有什么安排",
    client,
    "gpt-4o"
)
print(result)
```

## 五、生产实践：安全、权限与可靠性

### 5.1 工具权限控制

在生产环境中，不是所有用户都能调用所有工具。需要建立分级权限体系：

```python
from enum import IntEnum
from dataclasses import dataclass

class ToolPermission(IntEnum):
    READ_ONLY = 1    # 只读操作：查询、搜索
    WRITE = 2        # 写入操作：创建、修改
    DELETE = 3       # 删除操作
    ADMIN = 4        # 管理操作：配置、权限管理

@dataclass
class UserContext:
    user_id: str
    role: str  # "guest" | "user" | "admin"
    permissions: set[ToolPermission]

class ToolAccessControl:
    """工具访问控制层"""
    
    # 工具 -> 所需权限
    TOOL_PERMISSIONS = {
        "get_weather": ToolPermission.READ_ONLY,
        "search_products": ToolPermission.READ_ONLY,
        "get_schedule": ToolPermission.READ_ONLY,
        "create_order": ToolPermission.WRITE,
        "send_email": ToolPermission.WRITE,
        "delete_account": ToolPermission.DELETE,
        "update_config": ToolPermission.ADMIN,
    }
    
    # 角色 -> 默认权限
    ROLE_PERMISSIONS = {
        "guest": {ToolPermission.READ_ONLY},
        "user": {ToolPermission.READ_ONLY, ToolPermission.WRITE},
        "admin": {ToolPermission.READ_ONLY, ToolPermission.WRITE, 
                  ToolPermission.DELETE, ToolPermission.ADMIN},
    }
    
    def check_permission(self, tool_name: str, user: UserContext) -> bool:
        required = self.TOOL_PERMISSIONS.get(tool_name)
        if required is None:
            return False  # 未注册的工具默认拒绝
        
        user_perms = user.permissions or self.ROLE_PERMISSIONS.get(user.role, set())
        return any(p >= required for p in user_perms)
    
    def filter_tools(self, user: UserContext) -> list[dict]:
        """根据用户权限过滤可用工具"""
        available = []
        for schema in self.registry_schemas:
            tool_name = schema["function"]["name"]
            if self.check_permission(tool_name, user):
                available.append(schema)
        return available
```

### 5.2 工具执行结果校验

```python
from pydantic import BaseModel, ValidationError
from typing import Any

class ToolResultValidator:
    """工具返回结果校验器"""
    
    @staticmethod
    def validate(result: Any, expected_schema: dict | None = None) -> dict:
        """
        校验工具返回结果
        1. 确保结果可序列化
        2. 如果提供了 schema，用 Pydantic 校验
        3. 添加元数据（执行时间、状态等）
        """
        try:
            # 序列化测试
            json_str = json.dumps(result, ensure_ascii=False, default=str)
            
            # 大小限制（防止返回超大结果撑爆上下文窗口）
            max_size = 32 * 1024  # 32KB
            if len(json_str) > max_size:
                # 截断处理
                result = {
                    "truncated": True,
                    "summary": json_str[:max_size],
                    "total_size": len(json_str)
                }
            
            return {
                "status": "success",
                "data": result
            }
        except (TypeError, ValueError) as e:
            return {
                "status": "serialization_error",
                "error": f"结果无法序列化: {e}"
            }
    
    @staticmethod
    def sanitize_for_model(result: dict, max_tokens: int = 500) -> str:
        """将工具结果裁剪到适合放入模型上下文的长度"""
        result_str = json.dumps(result, ensure_ascii=False, default=str)
        # 粗略按 1 token ≈ 3 字符估算
        max_chars = max_tokens * 3
        if len(result_str) > max_chars:
            return result_str[:max_chars] + "...[结果已截断]"
        return result_str
```

### 5.3 超时与熔断

```python
import time
from collections import defaultdict
from functools import wraps

class CircuitBreaker:
    """工具调用熔断器"""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self._failures: dict[str, int] = defaultdict(int)
        self._last_failure_time: dict[str, float] = {}
        self._state: dict[str, str] = defaultdict(lambda: "closed")  # closed | open | half_open
        self._half_open_calls: dict[str, int] = defaultdict(int)
    
    def call(self, tool_name: str, func: Callable, *args, **kwargs):
        state = self._get_state(tool_name)
        
        if state == "open":
            raise RuntimeError(
                f"工具 {tool_name} 熔断中，"
                f"请 {self.recovery_timeout}s 后重试"
            )
        
        if state == "half_open":
            if self._half_open_calls[tool_name] >= self.half_open_max_calls:
                raise RuntimeError(f"工具 {tool_name} 半开状态调用次数已满")
            self._half_open_calls[tool_name] += 1
        
        try:
            result = func(*args, **kwargs)
            self._on_success(tool_name)
            return result
        except Exception as e:
            self._on_failure(tool_name)
            raise
    
    def _get_state(self, tool_name: str) -> str:
        if self._state[tool_name] == "open":
            # 检查是否可以进入半开状态
            if time.time() - self._last_failure_time[tool_name] > self.recovery_timeout:
                self._state[tool_name] = "half_open"
                self._half_open_calls[tool_name] = 0
        return self._state[tool_name]
    
    def _on_success(self, tool_name: str):
        self._failures[tool_name] = 0
        self._state[tool_name] = "closed"
    
    def _on_failure(self, tool_name: str):
        self._failures[tool_name] += 1
        self._last_failure_time[tool_name] = time.time()
        if self._failures[tool_name] >= self.failure_threshold:
            self._state[tool_name] = "open"
```

## 六、Function Calling 与 ReAct 的对比

### 6.1 两种范式的本质差异

```
Function Calling 模式:
┌──────┐     ┌──────┐     ┌──────┐
│ User │────▶│ LLM  │────▶│ Tool │
│      │     │      │     │      │
│      │◀────│      │◀────│      │
└──────┘     └──────┘     └──────┘
模型内部隐式决策，通过训练获得工具调用能力

ReAct 模式:
┌──────┐     ┌──────────────────┐     ┌──────┐
│ User │────▶│ Thought → Action │────▶│ Tool │
│      │     │       ↓          │     │      │
│      │     │  Observation     │◀────│      │
│      │     │       ↓          │     └──────┘
│      │     │  Thought → ...   │
│      │◀────│  Final Answer    │
└──────┘     └──────────────────┘
模型通过 prompt 显式推理，逐步决定下一步行动
```

### 6.2 什么时候用哪个？

```python
# ReAct 模式实现示例
REACT_PROMPT = """你是一个能使用工具的助手。请严格按照以下格式回答：

Thought: 思考下一步该做什么
Action: 工具名称
Action Input: 工具参数（JSON格式）
Observation: 工具返回结果
...（可以多轮 Thought/Action/Observation）
Thought: 我已经获得了足够的信息
Final Answer: 最终回答

可用工具:
{tools_description}

问题: {question}
"""

def react_loop(question: str, tools: dict[str, Callable], llm_call: Callable, max_steps: int = 10):
    """ReAct 推理循环"""
    history = ""
    
    for step in range(max_steps):
        prompt = REACT_PROMPT.format(
            tools_description=format_tools(tools),
            question=question
        ) + history
        
        response = llm_call(prompt)
        
        if "Final Answer:" in response:
            final = response.split("Final Answer:")[1].strip()
            return final
        
        # 解析 Action 和 Action Input
        try:
            action = extract_between(response, "Action:", "\n").strip()
            action_input = extract_between(response, "Action Input:", "\n").strip()
            args = json.loads(action_input)
            
            # 执行工具
            if action in tools:
                result = tools[action](**args)
            else:
                result = f"错误: 未知工具 {action}"
            
            history += f"\nThought: {response}\nObservation: {result}\n"
        except Exception as e:
            history += f"\nThought: {response}\nObservation: 解析错误: {e}\n"
    
    return "达到最大推理步数限制"
```

### 6.3 对比总结

| 维度 | Function Calling | ReAct |
|------|-----------------|-------|
| **决策方式** | 模型内部隐式决策 | 显式 Thought 步骤推理 |
| **延迟** | 低（直接输出调用） | 高（需要生成推理文本） |
| **可解释性** | 中等（能看到调用什么） | 高（能看到推理过程） |
| **错误恢复** | 依赖模型自身 | 可以在 Thought 中调整策略 |
| **模型要求** | 需要支持 FC 的模型 | 任何强模型都可以 |
| **复杂规划** | 较弱（单步决策） | 强（多步推理链） |
| **Token 消耗** | 低 | 高（推理文本） |
| **生产稳定性** | 高 | 中等（输出格式可能不稳定） |

**实践建议**：
- 简单工具调用场景 → **优先用 Function Calling**
- 需要复杂多步推理 → **用 ReAct 或 ReAct + FC 混合**
- 使用开源模型且不支持 FC → **用 ReAct**
- 需要可解释的决策过程 → **用 ReAct**

## 七、生产环境完整架构

```
                    ┌─────────────────────────────────────────┐
                    │              用户请求                    │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │           API Gateway                    │
                    │  (认证、限流、日志)                       │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │         Tool Access Control             │
                    │  (权限校验、工具过滤)                     │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │           LLM 调用层                     │
                    │  (模型路由、重试、降级)                    │
                    └─────────────────┬───────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │  有工具调用？   │
                              └───────┬───────┘
                         是    ┌──────┴──────┐    否
                    ┌─────────▼─────┐   ┌───▼───────────────┐
                    │  Tool Executor │   │  返回最终回复       │
                    │  (超时、熔断)   │   └───────────────────┘
                    └─────────┬─────┘
                              │
                    ┌─────────▼─────┐
                    │ Result Validator│
                    │ (校验、截断)    │
                    └─────────┬─────┘
                              │
                    ┌─────────▼─────┐
                    │  返回 LLM 继续  │
                    └───────────────┘
```

## 八、面试要点

### Q1: Function Calling 和 ReAct 的区别是什么？

**答**：Function Calling 是模型通过训练获得的内置能力，模型直接输出结构化的函数调用 JSON，延迟低、稳定性高，但需要模型原生支持。ReAct 是一种 prompt engineering 范式，通过 Thought-Action-Observation 循环实现工具调用，可解释性更强但延迟更高、token 消耗更大。生产环境优先用 FC，复杂推理场景可用 ReAct+FC 混合。

### Q2: 模型输出的函数参数不合法怎么办？

**答**：三层防御：(1) 在工具定义中用详细的 description、enum、pattern 限定参数格式；(2) 执行前用 JSON Schema 或 Pydantic 校验，不合法时将错误信息返回给模型让其修正；(3) 设置最大重试次数（通常2-3次），超过后降级为提示用户。

### Q3: 如何处理工具调用超时？

**答**：(1) 为每个工具设置合理的超时时间（根据工具特性，如查询类5s、写入类30s）；(2) 使用熔断器模式，连续失败达到阈值后短路；(3) 超时后将错误信息返回给模型，让其决定是否重试或换一种方式回答；(4) 关键工具实现异步调用+轮询模式。

### Q4: 如何防止模型无限循环调用工具？

**答**：(1) 设置 max_turns 硬限制（通常5-10轮）；(2) 检测重复调用（相同工具+相同参数），超过2次直接终止；(3) 在系统提示中明确告知"如果已有足够信息请直接回答"；(4) 使用 tool_choice 参数，在最后几轮强制设为 "none"。

### Q5: 不同模型厂商的 Function Calling 实现有什么差异？

**答**：OpenAI 使用独立的 `tool_calls` 字段，支持 `tool_choice` 控制调用行为，支持并行调用。Anthropic Claude 将工具调用作为 content block 的一部分，可以与文本混合输出，更自然。开源模型通过 chat template 实现，不同模型模板格式不同（Qwen 用 `<tool_call>` 标签，Llama 用 `<python_code>` 标签），需要针对性解析。

## 九、避坑指南

### 坑1: 工具描述太简短导致误调用

```python
# ❌ 灾难级描述
{"name": "delete", "description": "删除", "parameters": {...}}

# ✅ 教科书级描述
{"name": "delete_file", "description": "永久删除指定路径的文件。此操作不可撤销，请确认后再调用。仅支持删除当前用户有权限的文件。", "parameters": {...}}
```

### 坑2: 工具返回结果过大撑爆上下文

```python
# 数据库查询返回 10000 条记录
def search_db(query: str):
    results = db.execute(query)  # 可能返回巨量数据
    # ❌ 直接返回
    # return results
    
    # ✅ 限制返回数量 + 摘要
    if len(results) > 50:
        return {
            "total": len(results),
            "returned": 50,
            "data": results[:50],
            "message": f"共 {len(results)} 条结果，已返回前50条"
        }
    return results
```

### 坑3: 并行调用时的依赖问题

```python
# 模型可能并行调用有依赖关系的工具
# 例如：先查商品ID，再用ID查评论 —— 这两个不能并行

# 解决方案：在工具描述中明确依赖关系
{
    "name": "get_reviews",
    "description": "获取商品评论。需要先调用 search_products 获取 product_id。",
    "parameters": {
        "type": "object",
        "properties": {
            "product_id": {"type": "string", "description": "商品ID，来自 search_products 的返回"}
        }
    }
}
```

### 坑4: 开源模型工具调用格式不稳定

```python
# 开源模型可能输出不标准的工具调用格式
# 需要健壮的解析器

import re

def parse_tool_call_robust(text: str) -> dict | None:
    """多策略工具调用解析"""
    # 策略1: 标准 <tool_call> 标签
    match = re.search(r'<tool_call>\s*(\{.*?\})\s*</tool_call>', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 策略2: ```json 代码块
    match = re.search(r'```(?:json)?\s*(\{.*?"name".*?"arguments".*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 策略3: 裸 JSON（尝试从文本中提取）
    try:
        # 找到包含 "name" 和 "arguments" 的 JSON
        start = text.find('{')
        while start != -1:
            for end in range(len(text), start, -1):
                try:
                    obj = json.loads(text[start:end])
                    if "name" in obj and "arguments" in obj:
                        return obj
                except json.JSONDecodeError:
                    continue
            start = text.find('{', start + 1)
    except Exception:
        pass
    
    return None
```

### 坑5: 忽略 tool_call_id 导致对话混乱

```python
# ❌ 错误：不关联 tool_call_id
messages.append({
    "role": "tool",
    "content": json.dumps(result)  # 缺少 tool_call_id!
})

# ✅ 正确：必须关联
messages.append({
    "role": "tool",
    "tool_call_id": tool_call.id,  # 必须！
    "content": json.dumps(result)
})

# 多个并行调用时，每个结果都要有对应的 tool_call_id
# 顺序可以不同，但 id 必须匹配
```

## 十、总结

Function Calling 是大模型从"对话"走向"行动"的核心能力。理解其底层原理——训练阶段的结构化输出能力、推理阶段的多轮编排、执行阶段的安全控制——是构建生产级 AI Agent 的基础。

核心要点回顾：

1. **原理层面**：FC 本质是模型训练后获得的特殊结构化输出能力，不同厂商实现方式不同
2. **Schema 设计**：好的工具定义 = 清晰的 description + 精确的类型约束 + 合理的枚举限定
3. **编排能力**：多轮调用、并行调用、错误恢复是生产环境的核心需求
4. **安全控制**：权限分级、超时熔断、结果校验三道防线
5. **范式选择**：FC 适合简单直接的工具调用，ReAct 适合复杂多步推理，两者可以混合使用
