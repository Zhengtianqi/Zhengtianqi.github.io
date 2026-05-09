---
title: 一文讲透AI的七层关系：从Token到Agent，搞懂AI任务执行的完整链路（附LangChain\+LangGraph代码实战）
author: zheng
tag:
  - 大模型
category:
  - 大模型
date: 2026-05-09 17:27:00
---
# 一文讲透AI的七层关系：从Token到Agent，搞懂AI任务执行的完整链路（附LangChain\+LangGraph代码实战）

初学大模型开发，总会被 **Token、Prompt、Context、Agent、Harness、MCP、Skills** 这些概念搞混淆。

本文梳理**AI七层层级关系**，从理论到工程落地，附带：

- 基础概念逐层拆解

- LangChain 基础代码示例

- **LangGraph 多步骤Agent编排进阶实战**

适合 CSDN 直接发布，收藏即可入门大模型Agent开发。

## 一、AI七层关系总览（由底层到上层）

1. **Token**：大模型理解文本的最小单位

2. **Prompt 提示词**：用户下达任务指令

3. **Context 上下文**：对话/文档记忆与背景信息

4. **Agent 智能体**：自主任务拆解、决策、工具调用

5. **Harness 工程框架**：流程编排、权限约束、重试、监控

6. **MCP 连接协议层**：统一对接外部API、服务、数据库

7. **Skills 可复用技能库**：封装好的业务能力，可被Agent随时调用

**核心链路：**

`Token → Prompt → Context → Agent → Harness流程约束 → MCP外部连通 → Skills业务能力执行`

---

## 二、七层概念通俗拆解

### 1\. Token

大模型识字的**最小颗粒**，一个汉字、字母、标点都可算作一个Token，决定上下文窗口、计费、长度限制。

### 2\. Prompt

给模型的角色、任务、格式、约束指令，是一切AI任务的入口。

### 3\. Context

历史对话、参考文档、业务背景，让模型拥有“记忆”和“知识库”。

### 4\. Agent

不再单次问答，可**自主拆解复杂任务、分步执行、自动选工具**。

### 5\. Harness

给Agent加“规则框”：最大重试、超时限制、流程管控、日志监控、异常熔断。

### 6\. MCP

统一网关层，标准化对接第三方API、CSDN发布、天气、数据库、接口服务。

### 7\. Skills

把常用业务封装成可复用技能：写博客、排版、发布、数据分析，一次封装多处调用。

---

## 三、基础依赖安装

```bash
pip install langchain openai tiktoken requests langgraph
```

---

## 四、前六层基础代码（精简保留，不冗余）

### 4\.1 Token 计算

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
text = "写一篇Python技术CSDN博客"
tokens = enc.encode(text)
print(f"Token数量：{len(tokens)}")
```

### 4\.2 Prompt 模板

```python
from langchain.prompts import PromptTemplate

prompt = PromptTemplate(
    input_variables=["topic"],
    template="你是CSDN资深博主，请写一篇{topic}技术博客，输出Markdown格式。"
)
print(prompt.format(topic="LangGraph多Agent开发"))
```

### 4\.3 上下文记忆 Context

```python
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain

llm = ChatOpenAI(temperature=0)
memory = ConversationBufferMemory()
conv = ConversationChain(llm=llm, memory=memory)

conv.predict(input="我想学习LangGraph")
print(conv.predict(input="帮我写一篇入门教程"))
print("上下文记录：\n", memory.buffer)
```

---

## 五、重点：LangGraph 多步骤 Agent 编排进阶示例

### 业务场景

实现一个**多节点流水线Agent**，分三步自动执行：

1. 博客主题构思

2. 生成Markdown正文

3. 模拟发布到CSDN

通过LangGraph实现**状态流转、节点编排、分步可控**，完美对应七层架构里的 `Agent \+ Harness 流程编排`。

### 完整可运行代码

```python
from typing import TypedDict, Annotated, Sequence
import operator
from langchain.chat_models import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

# 1. 定义全局状态：贯穿整个多步骤流程
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    topic: str        # 博客主题
    outline: str      # 大纲构思
    content: str      # 正文内容
    publish_result: str # 发布结果

# 2. 初始化大模型
llm = ChatOpenAI(temperature=0.7)

# 节点1：主题构思 & 生成大纲
def blog_outline_node(state: AgentState) -> AgentState:
    topic = state["topic"]
    prompt = f"你是CSDN技术博主，请围绕【{topic}】生成一篇技术博客详细大纲。"
    res = llm.invoke(prompt)
    return {
        "messages": [AIMessage(content=res.content)],
        "outline": res.content
    }

# 节点2：根据大纲生成完整Markdown正文
def blog_write_node(state: AgentState) -> AgentState:
    outline = state["outline"]
    prompt = f"根据以下博客大纲，写一篇完整CSDN技术博客，严格Markdown格式：\n{outline}"
    res = llm.invoke(prompt)
    return {
        "messages": [AIMessage(content=res.content)],
        "content": res.content
    }

# 节点3：MCP+Skills 模拟发布到CSDN
def blog_publish_node(state: AgentState) -> AgentState:
    content = state["content"]
    # 模拟MCP协议调用外部CSDN接口
    publish_res = f"✅ 已通过MCP协议将博客发布至CSDN，正文长度：{len(content)} 字符"
    return {
        "messages": [AIMessage(content=publish_res)],
        "publish_result": publish_res
    }

# 3. 构建LangGraph工作流
workflow = StateGraph(AgentState)

# 添加三个业务节点
workflow.add_node("outline", blog_outline_node)
workflow.add_node("write", blog_write_node)
workflow.add_node("publish", blog_publish_node)

# 设置执行流程：大纲 -> 写作 -> 发布 -> 结束
workflow.set_entry_point("outline")
workflow.add_edge("outline", "write")
workflow.add_edge("write", "publish")
workflow.add_edge("publish", END)

# 编译图
app = workflow.compile()

# 4. 执行整个多步骤Agent流程
if __name__ == "__main__":
    init_state = {
        "messages": [],
        "topic": "LangGraph实现多步骤Agent编排实战",
        "outline": "",
        "content": "",
        "publish_result": ""
    }

    result = app.invoke(init_state)

    print("=" * 60)
    print("📋 博客大纲：")
    print(result["outline"])
    print("=" * 60)
    print("📝 博客正文(Markdown)：")
    print(result["content"])
    print("=" * 60)
    print("🚀 发布结果：")
    print(result["publish_result"])
```

### 代码对应七层架构解析

1. **Token**：底层模型自动分词

2. **Prompt**：每个节点内的任务指令

3. **Context**：AgentState 全局状态保存所有中间结果

4. **Agent**：LangGraph 整体就是智能体调度核心

5. **Harness**：固定流程编排、节点顺序、可控执行，就是工程约束框架

6. **MCP**：publish 节点模拟统一调用外部CSDN接口

7. **Skills**：大纲生成、正文写作、发布能力，都是可复用技能

---

## 六、为什么要学懂AI七层关系 \+ LangGraph

1. 告别概念混乱，一次性理清大模型、Agent、应用的层级关系

2. 掌握 LangGraph 可以实现**复杂多步骤任务编排**，远超普通单Agent

3. 可直接落地 RAG、智能客服、自动化办公、AI创作流水线

4. 适合作为 CSDN 技术博文、面试知识点、个人项目架构底座

---

## 七、总结

AI七层关系是从**基础原理**到**工程落地**的完整分层：

`Token → Prompt → Context → Agent → Harness → MCP → Skills`

而 **LangGraph** 是现代Agent开发最强编排框架，用来实现多节点、状态持久、流程可控的复杂AI任务，是进阶大模型开发的必备技能。

---

### 附：代码运行注意事项

1. 安装依赖后，需设置 OpenAI API Key（替换为个人密钥）：`export OPENAI\_API\_KEY=\&\#34;your\-api\-key\&\#34;`

2. 代码可直接复制运行，LangGraph 节点流程可根据需求调整顺序、新增节点

3. 发布节点为模拟调用，实际开发可替换为CSDN官方API实现真实发布

> （注：文档部分内容可能由 AI 生成）
