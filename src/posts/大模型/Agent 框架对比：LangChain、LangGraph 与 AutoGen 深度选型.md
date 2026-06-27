---
title: Agent 框架对比：LangChain、LangGraph 与 AutoGen 深度选型
tag: ["Agent", "LangChain", "LangGraph", "AutoGen"]
category: 大模型
date: 2026-06-27
---

# Agent 框架对比：LangChain、LangGraph 与 AutoGen 深度选型

做 AI Agent 项目，框架选型是第一道坎。LangChain 太重？LangGraph 太新？AutoEn 适合多智能体？本文一网打尽。

---

## 一、三大框架定位

| 框架 | 定位 | 核心优势 | 适合场景 |
|------|------|---------|---------|
| LangChain | 全家桶 LLM 应用框架 | 生态丰富、组件齐全 | 快速原型、RAG、简单 Agent |
| LangGraph | 有状态 Agent 编排框架 | 状态机、循环、人机协作 | 复杂工作流、多步推理 |
| AutoGen | 多智能体对话框架 | 多 Agent 协作、角色分工 | 多角色讨论、代码生成 |

---

## 二、LangChain：生态王者

### 2.1 核心能力

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor

# 定义工具
@tool
def search_guarantee_policy(query: str) -> str:
    """搜索担保政策文档"""
    # 实际调用检索系统
    return f"找到关于 {query} 的政策文档..."

@tool
def calculate_fee(amount: float, rate: float) -> float:
    """计算担保费用"""
    return amount * rate

# 创建 Agent
llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [search_guarantee_policy, calculate_fee]

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个担保业务助手，可以搜索政策文档和计算费用。"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 执行
result = executor.invoke({"input": "担保金额100万，费率1.5%，帮我算费用"})
```

### 2.2 优缺点

**优点**：
- 生态最丰富：200+ 集成（向量库、文档加载器、工具）
- LCEL（LangChain Expression Language）链式组合优雅
- LangSmith 调试和监控
- 文档和社区最成熟

**缺点**：
- Agent 执行流程不够透明，调试困难
- 复杂工作流（循环、条件分支）支持弱
- 抽象层太多，理解成本高

---

## 三、LangGraph：状态机驱动

### 3.1 核心理念

LangGraph 把 Agent 看作**状态机**：每个节点是一个函数，边是条件路由，状态在节点间传递。

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langchain_openai import ChatOpenAI

# 1. 定义状态
class AgentState(TypedDict):
    messages: list
    retrieved_docs: list
    answer: str
    needs_human_review: bool

# 2. 定义节点函数
def retrieve_node(state: AgentState) -> AgentState:
    """检索节点"""
    query = state["messages"][-1]
    docs = vector_store.similarity_search(query, k=3)
    return {"retrieved_docs": docs}

def generate_node(state: AgentState) -> AgentState:
    """生成节点"""
    context = "\n".join([d.page_content for d in state["retrieved_docs"]])
    answer = llm.invoke(f"基于以下信息回答：\n{context}\n\n问题：{state['messages'][-1]}")
    return {"answer": answer.content}

def review_node(state: AgentState) -> AgentState:
    """人工审核节点"""
    # 判断是否需要人工审核
    if "风险" in state["answer"] or "不确定" in state["answer"]:
        return {"needs_human_review": True}
    return {"needs_human_review": False}

def should_review(state: AgentState) -> str:
    """条件路由"""
    if state["needs_human_review"]:
        return "human_review"
    return END

# 3. 构建图
graph = StateGraph(AgentState)
graph.add_node("retrieve", retrieve_node)
graph.add_node("generate", generate_node)
graph.add_node("review", review_node)
graph.add_node("human_review", human_review_node)

graph.set_entry_point("retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", "review")
graph.add_conditional_edges("review", should_review)

# 4. 编译执行
app = graph.compile()
result = app.invoke({"messages": ["担保业务的风险有哪些？"]})
```

### 3.2 核心优势

```
LangChain Agent 的执行是"黑盒"：
  LLM 决策 → 调工具 → LLM 决策 → 调工具 → ... → 最终回答
  你无法控制流程，全靠 LLM 判断

LangGraph 的执行是"白盒"：
  retrieve → generate → review → [需要人工?] → human_review / END
  每一步都是你定义的，流程完全可控
```

| 特性 | LangChain Agent | LangGraph |
|------|----------------|-----------|
| 流程控制 | LLM 自主决策 | 开发者定义状态机 |
| 循环 | 不支持显式循环 | 支持循环（条件边回到之前节点） |
| 人机协作 | 不支持 | 内置 interrupt 支持 |
| 状态持久化 | 不支持 | Checkpoint 持久化 |
| 调试 | 困难 | 清晰的节点流转 |

### 3.3 实战：带记忆和人工审核的 RAG Agent

```python
from langgraph.checkpoint.memory import MemorySaver

# 带记忆的 Agent
checkpointer = MemorySaver()
app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["human_review"]  # 在人工审核前暂停
)

# 第一次对话
config = {"configurable": {"thread_id": "user-123"}}
result = app.invoke(
    {"messages": ["什么是融资担保？"]},
    config=config
)

# 第二次对话（有上下文记忆）
result = app.invoke(
    {"messages": ["那反担保呢？"]},
    config=config  # 同一 thread_id 会自动加载之前的对话历史
)
```

---

## 四、AutoGen：多智能体协作

### 4.1 核心理念

AutoGen 专注于**多 Agent 对话**：不同角色的 Agent 互相讨论，协作完成任务。

```python
import autogen

# 1. 配置 LLM
config_list = [{
    "model": "gpt-4o",
    "api_key": "your-api-key",
}]

# 2. 创建 Agent 角色
user_proxy = autogen.UserProxyAgent(
    name="用户",
    human_input_mode="ALWAYS",  # 需要人工输入
)

coder = autogen.AssistantAgent(
    name="程序员",
    system_message="你是一个资深 Java 开发者，负责编写代码。",
    llm_config={"config_list": config_list},
)

reviewer = autogen.AssistantAgent(
    name="代码审查员",
    system_message="你是一个严格的代码审查员，检查代码质量、安全性和性能。",
    llm_config={"config_list": config_list},
)

# 3. 发起对话
user_proxy.initiate_chat(
    coder,
    message="帮我写一个 Java 分布式锁的实现",
    # 对话会在 coder 和 reviewer 之间自动流转
)
```

### 4.2 GroupChat：多 Agent 讨论

```python
# 创建群聊
groupchat = autogen.GroupChat(
    agents=[user_proxy, coder, reviewer, architect],
    messages=[],
    max_round=10,  # 最多 10 轮对话
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config={"config_list": config_list},
)

# 发起讨论
user_proxy.initiate_chat(
    manager,
    message="设计一个担保业务系统的架构方案，需要考虑高可用和分布式事务"
)
# architect 提出架构方案 → coder 补充代码实现 → reviewer 审查 → 循环讨论
```

### 4.3 适用场景

```
LangChain/LangGraph：单 Agent + 工具调用
  → 一个 Agent 调用多个工具完成任务

AutoGen：多 Agent 协作
  → 多个不同角色的 Agent 互相讨论
  → 适合：代码生成+审查、方案讨论、角色扮演
```

---

## 五、选型决策

```
你的 Agent 需要什么？

单 Agent + 工具调用 + RAG：
  → LangChain（快速原型）或 LangGraph（需要流程控制）

复杂工作流（多步骤、条件分支、循环）：
  → LangGraph（状态机是最佳抽象）

需要人工介入审核：
  → LangGraph（内置 interrupt 机制）

多角色讨论/协作：
  → AutoGen（多 Agent 对话是核心能力）

需要长期记忆和状态恢复：
  → LangGraph（Checkpoint 机制）

需要最大灵活性和最少约束：
  → 不用框架，直接调 LLM API + 自定义编排
```

### 实际项目推荐

| 项目类型 | 推荐框架 | 原因 |
|---------|---------|------|
| RAG 问答系统 | LangChain | 组件齐全，快速落地 |
| 多步推理 Agent | LangGraph | 流程可控，状态管理 |
| 代码生成+审查 | AutoGen | 多角色天然适合 |
| 客服 Bot | LangChain | 简单工具调用即可 |
| 复杂业务流程审批 | LangGraph | 人机协作+状态机 |
| 多专家讨论系统 | AutoGen | GroupChat 机制 |

---

## 六、性能与成本对比

| 维度 | LangChain | LangGraph | AutoGen |
|------|-----------|-----------|---------|
| LLM 调用次数 | 中（Agent 决策） | 低（固定流程） | 高（多 Agent 对话） |
| Token 消耗 | 中 | 低 | 高 |
| 延迟 | 中 | 低 | 高 |
| 开发效率 | 高（快速原型） | 中（需设计状态机） | 中（需定义角色） |
| 可控性 | 低 | 高 | 中 |

> AutoGen 多 Agent 对话的 Token 消耗是最高的——每轮讨论所有 Agent 都会看到完整历史。对于成本敏感的场景，LangGraph 的固定流程更经济。

---

## 七、面试要点

### Q：LangChain 和 LangGraph 有什么区别？

LangChain 是全家桶 LLM 应用框架，适合快速搭建 RAG 和简单 Agent；LangGraph 是基于状态机的 Agent 编排框架，适合复杂工作流。核心区别：LangChain 的 Agent 执行流程由 LLM 自主决策（黑盒），LangGraph 的执行流程由开发者定义（白盒），支持循环、条件分支、人机协作和状态持久化。

### Q：什么时候用多 Agent 框架？

当任务需要不同专业角色的 Agent 协作完成时（如代码生成+审查、方案设计+评估），多 Agent 框架（AutoGen）比单 Agent 更有效。但代价是 Token 消耗高、延迟大，需要权衡。

---

## 八、总结

三个框架不是竞争关系，而是互补：

- **LangChain**：快速原型，生态丰富，RAG 首选
- **LangGraph**：复杂流程，状态管理，生产级 Agent 首选
- **AutoGen**：多角色协作，代码生成+审查场景

选型原则：**先用 LangChain 跑通原型，流程复杂了迁移到 LangGraph，需要多角色讨论了加 AutoGen**。
