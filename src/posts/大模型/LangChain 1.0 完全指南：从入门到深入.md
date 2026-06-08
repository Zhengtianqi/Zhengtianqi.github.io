---
title: LangChain 1.0 完全指南：从入门到深入

tag:
  - AI
  - LangChain
category: 大模型
date: 2026-05-13
---

# LangChain 1.0 完全指南：从入门到深入

> **适用人群：** AI 应用开发者、LLM 工程师、后端开发者

## 背景

### 从混乱到秩序

2022 年，机器学习工程师 Harrison Chase 创建了 LangChain 开源项目，初衷是解决 LLM 应用开发中的"巴别塔困境"——OpenAI、Anthropic、Cohere 等厂商 API 格式各异，开发者需要为每个项目重复实现对话管理、提示模板、工具调用等基础设施，这些工作占据了 80% 的开发时间。

在 1.0 之前，社区的主要抱怨集中在三点：

- **抽象过重**：大量中间层让调试变得困难
- **API 频繁变动**：版本间不兼容让开发者痛苦不堪
- **依赖臃肿**：700+ 集成塞进单一包，安装即地狱

**2025年10月23日**，LangChain 团队正式发布 LangChain 1.0 与 LangGraph 1.0，这是首个生产就绪的稳定版本，经过了 **Uber、LinkedIn、Klarna、JP Morgan** 等企业的生产环境验证。

> 官方承诺：1.0 是稳定版本，2.0 不会有重大破坏性调整。

---

## 核心革新

### 三大方向重构

LangChain 1.0 围绕以下三大核心方向进行了彻底重构：

```
更统一  →  create_agent() 统一入口，终结碎片化
更可控  →  中间件机制，细粒度控制每个执行步骤  
更生产就绪  →  标准化数据结构，支持 CI/CD 工程化落地
```

### 1. 全新 `create_agent()` API

旧版本构建一个 Agent 需要手动配置提示词模板、工具列表、AgentExecutor 等多个组件，代码量常达 100+ 行。

**1.0 版本：一行代码搞定**

```python
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=[search, sql, send_email],
    system_prompt="你是客户支持助理，请友好且准确地回答。"
)

result = agent.invoke({"messages": [("user", "帮我查一下订单状态")]})
```

`create_agent()` 底层默认基于 LangGraph 引擎实现，原生支持：
- 持久化执行（Checkpointing）
- 实时流式响应（Streaming）
- 人工介入机制（Human-in-the-loop）
- 状态持久存储（State Persistence）

### 2. 统一内容块接口

不同模型对推理过程的标记各不相同（`think`、`reason` 等），1.0 统一为 `type == "reasoning"`：

```python
from langchain_anthropic import ChatAnthropic

model = ChatAnthropic(model="claude-sonnet-4-5-20250929")
response = model.invoke("解释量子纠缠")

for block in response.content_blocks:
    if block["type"] == "reasoning":
        print(f"推理过程: {block['reasoning']}")
    elif block["type"] == "text":
        print(f"回答内容: {block['text']}")
    elif block["type"] == "tool_call":
        print(f"工具调用: {block['name']}({block['args']})")
```

### 3. 中间件（Middleware）机制

中间件定义了一组钩子，允许在 Agent 循环的每个步骤实现细粒度控制：

| 内置中间件 | 功能描述 |
|---|---|
| `HumanApproval` | 暂停执行，让用户审批/编辑/拒绝工具调用 |
| `ContextSummarizer` | 当消息历史接近上下文限制时自动压缩 |
| `PIIRedactor` | 敏感信息脱敏，保护用户隐私 |

### 4. 五维记忆体系

LangChain 1.0 将记忆分为五种类型：

```
短期记忆  →  当前会话消息历史（InMemorySaver）
长期记忆  →  跨会话用户偏好（持久化存储）
语义记忆  →  事实性知识（向量数据库）
情景记忆  →  历史交互事件
程序性记忆  →  行为规则和系统提示更新
```

---

## 架构全景图

```
┌─────────────────────────────────────────────────────┐
│                  LangChain 生态系统                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐    ┌────────────────────────┐  │
│  │   LangChain 1.0  │    │     LangGraph 1.0      │  │
│  │  (高层 Agent API) │    │   (底层图编排框架)      │  │
│  │                 │    │                        │  │
│  │  create_agent() │───▶│  StateGraph            │  │
│  │  Middleware      │    │  Nodes / Edges         │  │
│  │  Memory System   │    │  Checkpointer          │  │
│  └─────────────────┘    └────────────────────────┘  │
│           │                        │                │
│           └──────────┬─────────────┘                │
│                      ▼                              │
│  ┌───────────────────────────────────────────────┐  │
│  │             langchain-core                    │  │
│  │   (LCEL / BaseMessage / BaseTool / ...)       │  │
│  └───────────────────────────────────────────────┘  │
│                      │                              │
│  ┌───────────────────────────────────────────────┐  │
│  │          langchain-community / 集成包           │  │
│  │  OpenAI / Anthropic / Cohere / Chroma / ...   │  │
│  └───────────────────────────────────────────────┘  │
│                      │                              │
│  ┌───────────────────────────────────────────────┐  │
│  │             LangSmith                         │  │
│  │      (可观测性 / Tracing / Evaluation)         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 环境搭建

### 系统要求

- Python **3.10+**（1.0 不再支持 Python 3.9）
- pip / uv / conda

### 安装

```bash
# 推荐使用 uv（更快）
uv pip install --upgrade langchain langgraph langchain-openai

# 或使用 pip
pip install --upgrade langchain langgraph langchain-openai

# 如果使用 Anthropic
pip install langchain-anthropic

# 多 Agent Supervisor（可选）
pip install langgraph-supervisor

# 社区工具集
pip install langchain-community

# 如需 LangSmith 可观测性
pip install langsmith
```

### 环境变量配置

```bash
# .env 文件
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LANGCHAIN_API_KEY=ls__...          # LangSmith（可选）
LANGCHAIN_TRACING_V2=true          # 开启追踪（可选）
LANGCHAIN_PROJECT=my-agent-project # 项目名（可选）
```

```python
# 加载环境变量
from dotenv import load_dotenv
load_dotenv()
```

### 验证安装

```python
import langchain
import langgraph
print(f"LangChain: {langchain.__version__}")
print(f"LangGraph: {langgraph.__version__}")
# 输出：LangChain: 1.x.x / LangGraph: 1.x.x
```

---

## 入门：基础用法

### 1. 最简单的对话

```python
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

# 统一初始化接口（支持所有主流 LLM）
llm = init_chat_model(
    model="gpt-4o-mini",
    model_provider="openai",
    temperature=0.7
)

messages = [
    SystemMessage("你是一个专业的 Python 教学助手"),
    HumanMessage("请解释什么是装饰器，并给出一个例子")
]

response = llm.invoke(messages)
print(response.content)
```

### 2. 流式输出

```python
# 逐 token 流式返回
for chunk in llm.stream(messages):
    print(chunk.content, end="", flush=True)
```

### 3. 批量调用

```python
questions = [
    [HumanMessage("Python 和 JavaScript 的区别？")],
    [HumanMessage("什么是 REST API？")],
    [HumanMessage("解释一下什么是 Docker？")],
]

responses = llm.batch(questions)
for r in responses:
    print(r.content[:100])
```

### 4. 提示词模板

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一位{role}专家，请用{language}回答问题"),
    ("human", "{question}")
])

chain = prompt | llm

result = chain.invoke({
    "role": "Python 编程",
    "language": "中文",
    "question": "如何实现单例模式？"
})
print(result.content)
```

### 5. 输出解析器

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field

# 结构化输出
class CodeReview(BaseModel):
    score: int = Field(description="代码质量评分 1-10")
    issues: list[str] = Field(description="发现的问题列表")
    suggestions: list[str] = Field(description="优化建议")

parser = JsonOutputParser(pydantic_object=CodeReview)

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是代码审查专家。{format_instructions}"),
    ("human", "请审查以下代码：\n{code}")
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser

result = chain.invoke({
    "code": "def add(a,b): return a+b"
})
print(f"评分: {result['score']}")
print(f"问题: {result['issues']}")
```

---

## 进阶：LangGraph 状态图

LangGraph 是 LangChain 官方推出的底层编排框架，将 Agent 工作流表示为**有向状态图（Directed State Graph）**。

### 核心概念

```
State（状态）  →  贯穿整个图的共享数据容器
Node（节点）   →  图中的每个执行单元（函数/Agent）
Edge（边）     →  节点间的连接（普通边/条件边）
Checkpointer  →  状态快照，支持断点续跑和人工介入
```

### 第一个 LangGraph 程序

```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain.chat_models import init_chat_model

# 1. 定义状态结构
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # 自动合并，不覆盖
    user_info: str
    step_count: int

# 2. 初始化 LLM
llm = init_chat_model("gpt-4o-mini", model_provider="openai")

# 3. 定义节点函数
def chat_node(state: AgentState) -> AgentState:
    response = llm.invoke(state["messages"])
    return {
        "messages": [response],
        "step_count": state.get("step_count", 0) + 1
    }

def should_continue(state: AgentState) -> str:
    """条件路由：决定下一步走向"""
    messages = state["messages"]
    last_message = messages[-1]
    
    # 如果最后一条消息有工具调用，继续执行工具
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "end"

# 4. 构建图
workflow = StateGraph(AgentState)
workflow.add_node("chat", chat_node)

# 设置入口点
workflow.set_entry_point("chat")

# 添加条件边
workflow.add_conditional_edges(
    "chat",
    should_continue,
    {
        "tools": "chat",  # 循环执行
        "end": END
    }
)

# 5. 编译并运行
app = workflow.compile()

result = app.invoke({
    "messages": [("user", "你好，请介绍一下自己")],
    "step_count": 0
})
print(result["messages"][-1].content)
```

### 带工具的 ReAct Agent

```python
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode

@tool
def search_web(query: str) -> str:
    """搜索网络信息"""
    # 实际项目中接入真实搜索 API
    return f"搜索 '{query}' 的结果：这是模拟的搜索结果..."

@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    try:
        result = eval(expression)
        return f"计算结果：{result}"
    except Exception as e:
        return f"计算错误：{e}"

tools = [search_web, calculate]
llm_with_tools = llm.bind_tools(tools)

# 工具执行节点（LangGraph 内置）
tool_node = ToolNode(tools)

def agent_node(state):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def router(state):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", router, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")  # 工具执行完回到 agent

app = workflow.compile()

result = app.invoke({
    "messages": [("user", "帮我搜索一下 LangChain 最新动态，并计算 256 的平方根")]
})
for msg in result["messages"]:
    print(f"[{msg.type}]: {msg.content[:200]}")
```

### 持久化 Checkpointing

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver  # 生产环境推荐

# 内存持久化（开发测试）
memory = InMemorySaver()

# SQLite 持久化（生产推荐）
# memory = SqliteSaver.from_conn_string("checkpoints.db")

app = workflow.compile(checkpointer=memory)

# 使用 thread_id 区分不同会话
config = {"configurable": {"thread_id": "user-123-session-1"}}

# 第一次调用
app.invoke({"messages": [("user", "我叫张三")]}, config=config)

# 第二次调用（自动记住上下文）
result = app.invoke({"messages": [("user", "你还记得我叫什么吗？")]}, config=config)
print(result["messages"][-1].content)  # 输出：你叫张三
```

---

## 深入：多 Agent 协作

### Supervisor 模式

```python
from langgraph_supervisor import create_supervisor
from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")

# 定义专家 Agent
researcher = create_agent(
    model=llm,
    tools=[web_search, academic_search],
    system_prompt="你是研究专家，负责收集和分析信息"
)

coder = create_agent(
    model=llm,
    tools=[python_repl, code_review],
    system_prompt="你是编程专家，负责编写和审查代码"
)

writer = create_agent(
    model=llm,
    tools=[grammar_check],
    system_prompt="你是写作专家，负责撰写清晰易懂的内容"
)

# Supervisor 动态协调所有 Agent
supervisor = create_supervisor(
    agents={
        "researcher": researcher,
        "coder": coder,
        "writer": writer
    },
    workflow_type="dynamic",  # 动态决定调用顺序
    llm=llm
)

result = supervisor.invoke({
    "task": "研究最新的 AI 框架，写代码示例，然后写一篇技术教程"
})
```

### 工具返回 Command（新特性）

工具现在可以直接控制图的状态和路由，实现更灵活的动态流程：

```python
from langchain_core.tools import tool
from langgraph.types import Command

@tool
def smart_validator(data: str, state) -> Command:
    """智能验证器——根据结果决定下一步路由"""
    result = validate(data)
    
    if result["valid"]:
        return Command(
            update={"validated_data": data, "status": "ok"},
            goto="process"       # 跳转到处理节点
        )
    elif result["can_fix"]:
        return Command(
            update={"errors": result["errors"]},
            goto="auto_fix"      # 跳转到自动修复节点
        )
    else:
        return Command(
            update={"errors": result["errors"]},
            goto="human_review"  # 跳转到人工审核节点
        )
```

---

## 生产级特性

### 人机协同（Human-in-the-Loop）

```python
from langchain.middleware import HumanApprovalMiddleware

# 在工具调用执行前等待人工确认
agent = create_agent(
    model=llm,
    tools=[send_email, delete_record, make_payment],
    system_prompt="你是财务助理",
    middleware=[
        HumanApprovalMiddleware(
            # 只有涉及金额的操作才需要审批
            requires_approval=lambda tool_call: tool_call["name"] in ["make_payment", "delete_record"]
        )
    ]
)
```

### 上下文压缩中间件

```python
from langchain.middleware import ContextSummarizerMiddleware

agent = create_agent(
    model=llm,
    tools=[...],
    middleware=[
        ContextSummarizerMiddleware(
            max_tokens=8000,   # 超过此限制时触发压缩
            keep_recent=10,    # 保留最近 10 条消息原文
            summary_model=llm  # 用于生成摘要的模型
        )
    ]
)
```

### LangSmith 可观测性

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls__your_key"
os.environ["LANGCHAIN_PROJECT"] = "production-agent"

# 之后所有的 LangChain 调用会自动上报到 LangSmith
# 可以在 Dashboard 中查看：
# - 完整的调用链路追踪
# - 每步的输入/输出/耗时/Token 消耗
# - 错误日志和异常堆栈
# - A/B 测试和 Evaluation
```

---

## 实战 Demo：RAG 知识库 Agent

下面是一个完整的端到端示例——基于本地文档的智能问答 Agent：

```python
"""
RAG 知识库 Agent Demo
功能：上传文档 → 向量化存储 → 智能检索 → LLM 回答
"""
import os
from typing import TypedDict, Annotated
from langchain.chat_models import init_chat_model
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import InMemorySaver

# ─── 1. 构建向量知识库 ─────────────────────────────────────────
def build_knowledge_base(docs_dir: str = "./docs"):
    """加载文档并构建向量索引"""
    loader = DirectoryLoader(docs_dir, glob="**/*.md")
    docs = loader.load()
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    splits = splitter.split_documents(docs)
    
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(splits, embeddings)
    
    return vectorstore.as_retriever(search_kwargs={"k": 4})

retriever = build_knowledge_base()

# ─── 2. 定义工具 ──────────────────────────────────────────────
@tool
def search_knowledge_base(query: str) -> str:
    """从知识库中检索相关信息"""
    docs = retriever.get_relevant_documents(query)
    if not docs:
        return "知识库中未找到相关内容"
    
    results = []
    for i, doc in enumerate(docs, 1):
        results.append(f"【片段 {i}】\n{doc.page_content}\n来源：{doc.metadata.get('source', '未知')}")
    
    return "\n\n".join(results)

@tool
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")

tools = [search_knowledge_base, get_current_time]

# ─── 3. 构建 Agent ────────────────────────────────────────────
from langchain.agents import create_agent

llm = init_chat_model("gpt-4o-mini", model_provider="openai")

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="""你是一个专业的知识库助理。
    
回答问题时请遵循以下原则：
1. 优先使用 search_knowledge_base 工具检索相关信息
2. 基于检索结果给出准确、有依据的回答
3. 如果知识库中没有相关信息，诚实告知用户
4. 回答要简洁清晰，必要时给出来源引用""",
)

# ─── 4. 运行对话 ──────────────────────────────────────────────
def chat(question: str, thread_id: str = "default"):
    result = agent.invoke(
        {"messages": [("user", question)]},
        config={"configurable": {"thread_id": thread_id}}
    )
    return result["messages"][-1].content

# 测试
if __name__ == "__main__":
    print("=== RAG 知识库 Agent 启动 ===\n")
    
    questions = [
        "LangChain 1.0 有哪些核心特性？",
        "如何使用 create_agent 创建一个 Agent？",
        "LangGraph 和 LangChain 有什么区别？"
    ]
    
    for q in questions:
        print(f"❓ {q}")
        answer = chat(q, thread_id="demo-session")
        print(f"💡 {answer}\n")
        print("-" * 60)
```

---

## 迁移指南

### 旧版 → 1.0 对照表

| 旧版 (0.x) | 新版 (1.0) | 说明 |
|---|---|---|
| `create_react_agent()` (langgraph.prebuilt) | `create_agent()` (langchain.agents) | 统一入口 |
| `AgentExecutor` | `create_agent()` | 彻底移除 |
| `LLMChain` | LCEL (`prompt \| llm \| parser`) | 弃用 |
| `ConversationBufferMemory` | `InMemorySaver` + checkpointer | 新记忆体系 |
| `initialize_agent()` | `create_agent()` | 移除 |
| Python 3.9 | Python 3.10+ | 最低版本要求提升 |

### 代码迁移示例

```python
# ❌ 旧版写法（0.x）
from langgraph.prebuilt import create_react_agent
from langchain.memory import ConversationBufferMemory

agent = create_react_agent(
    model=ChatOpenAI(model="gpt-4"),
    tools=tools,
    state_modifier=system_prompt  # 复杂的提示词模板
)
memory = ConversationBufferMemory()

# ✅ 新版写法（1.0）
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model=ChatOpenAI(model="gpt-4o-mini"),
    tools=tools,
    system_prompt="简洁的系统提示词"  # 自动处理格式
)
# 记忆直接通过 checkpointer 管理，无需手动配置
```

---

## 框架选型

### LangChain vs LangGraph 怎么选？

官方建议的框架选型策略：

```
需要快速构建智能体，原型到生产
    → 使用 LangChain（create_agent）
    
需要精确控制执行流程、复杂条件分支、多 Agent 协作
    → 使用 LangGraph（StateGraph）
    
大型企业项目，需要两者结合
    → LangChain 负责标准化 Agent，LangGraph 负责复杂工作流编排
```

### 学习路径建议

```
阶段一（1-2天）：基础概念
  └─ 安装环境，完成 Quickstart
  └─ 掌握 LLM 调用、Prompt Template、LCEL 链

阶段二（3-5天）：核心技能
  └─ create_agent() 构建工具 Agent
  └─ RAG 系统（文档加载 → 向量化 → 检索 → 生成）
  └─ Memory 与多轮对话

阶段三（3-5天）：LangGraph 进阶
  └─ StateGraph 核心概念（State/Nodes/Edges）
  └─ Checkpointing 与 Human-in-the-loop
  └─ 多 Agent 协作（Supervisor 模式）

阶段四（2-3天）：生产化
  └─ LangSmith 可观测性与追踪
  └─ 中间件（Middleware）配置
  └─ 错误处理与性能优化
```

---

## 总结

LangChain 1.0 的发布标志着 AI 智能体开发正式进入**工程化阶段**。

三大核心价值：

1. **更统一**：`create_agent()` 统一入口，终结碎片化时代，学习成本大幅降低
2. **更可控**：中间件机制让每个执行步骤都可审计、可干预
3. **更生产就绪**：经过 Uber、LinkedIn 等企业验证，官方承诺稳定性

LangChain 与 LangGraph 的协同分工日趋清晰：LangChain 负责快速构建标准化智能体，LangGraph 负责深度定制复杂工作流，两者共同构成了当前最成熟的 Agent 开发生态。

对于开发者而言，现在是入场的最好时机——稳定的 API、成熟的生态、详尽的文档，让 AI 应用从"能跑就行"走向"可以上线"。

---

## 参考资源

- 官方文档：[docs.langchain.com](https://docs.langchain.com)
- LangGraph 文档：[langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)
- LangSmith：[smith.langchain.com](https://smith.langchain.com)
- Python 迁移指南：[docs.langchain.com/oss/python/migrate](https://docs.langchain.com/oss/python/migrate/langchain-v1)
- LangChain Academy：免费的 LangGraph 入门课程

---

*本文基于 LangChain 1.0 / LangGraph 1.0（2025年10月）编写，如有 API 变更请以官方文档为准。*