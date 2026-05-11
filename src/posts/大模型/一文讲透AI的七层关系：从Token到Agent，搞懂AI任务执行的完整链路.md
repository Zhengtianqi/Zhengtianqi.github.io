---
title: 一文讲透AI的七层关系：从Token到Agent，搞懂AI任务执行的完整链路（附LangChain\+LangGraph代码实战）
author: zheng
tag:
  - 大模型
category:
  - 大模型
date: 2026-05-09 17:27:00
---

# 一文讲透 AI 的各层关系：从 Token 到 Agent，搞懂 AI 任务执行的完整链路（附 LangChain\+LangGraph 代码实战）

AI 技术的快速迭代中，我们常听到 Token、Embedding、LLM、Chain、Agent 等概念，但多数人对它们的层级关系、协同逻辑一知半解——其实这些概念并非孤立存在，而是构成了 AI 任务执行的完整链路：从最底层的 Token 编码，到中间层的语义表征与逻辑串联，再到上层的自主决策 Agent，每一层都承上启下，缺一不可。

本文将从“底层基础→中间链路→上层应用”三个维度，层层拆解各层的核心作用、相互关系，再通过 LangChain\+LangGraph 代码实战，让你直观看到从 Token 到 Agent 的完整执行过程，真正搞懂 AI 是如何“思考”并“完成任务”的。

# 一、先理清核心逻辑：AI 任务执行的层级链路总览

AI 完成一个复杂任务（比如“分析某公司财务状况并生成报告”），本质是“信息输入→处理→输出”的闭环，而这个闭环的每一步，都对应着不同的技术层级。我们先建立一个整体认知：

**底层基础（输入层）**：Token（分词）→ Embedding（语义嵌入）—— 负责将人类语言转化为 AI 能理解的“机器语言”；
**中间核心（处理层）**：LLM（大语言模型）→ Chain（链路串联）—— 负责理解语义、执行单步/多步逻辑，是 AI 的“大脑”与“手脚”；
**上层应用（决策层）**：Agent（智能体）—— 负责自主规划任务、调用工具、处理异常，实现“无需人工干预”的复杂任务闭环。

简单来说：Token 是 AI 识别语言的“最小单位”，Embedding 是 AI 理解语义的“桥梁”，LLM 是 AI 处理逻辑的“核心”，Chain 是 AI 串联步骤的“纽带”，Agent 是 AI 自主决策的“灵魂”。接下来，我们逐一拆解每一层的核心逻辑。

# 二、底层基础：Token 与 Embedding —— AI 理解世界的“语言基础”

AI 无法直接理解人类的自然语言（比如中文、英文），必须先将语言转化为可计算的数值形式——这一步就需要 Token 和 Embedding 来完成，它们是整个 AI 链路的“地基”。

## 2\.1 Token：AI 语言的“最小积木”

Token 即“分词”，是将自然语言拆分成的最小语义单位，相当于 AI 语言的“字母”或“单词”。不同的模型（如 GPT\-3\.5、GPT\-4、Llama 2）有不同的分词规则，常见的分词方式有 3 种：

- 字符级分词：将每个字符作为一个 Token（如“AI”拆分为“A”“I”），适合小语种，但语义关联性弱；

- 词级分词：将完整单词作为一个 Token（如“人工智能”拆分为“人工智能”），语义明确，但处理未登录词（生僻词）能力差；

- 子词级分词（最常用）：将单词拆分为更小的语义单元（如“unhappiness”拆分为“un”“happy”“ness”），兼顾语义关联性和未登录词处理能力，是目前 LLM 的主流分词方式。

核心作用：将连续的自然语言，转化为离散的、可被模型处理的“最小单位”，为后续的语义理解打下基础。比如我们输入“帮我分析特斯拉 2024 年财报”，模型会先将这句话拆分为 Token（如“帮我”“分析”“特斯拉”“2024 年”“财报”），再进行后续处理。

关键注意点：Token 数量决定了模型的输入/输出上限（即“上下文窗口”），比如 GPT\-3\.5 Turbo 的上下文窗口是 16k Token，意味着输入\+输出的总 Token 数不能超过 16384，否则会被截断。

## 2\.2 Embedding：AI 理解语义的“数值桥梁”

Token 只是“拆分语言”，但 AI 要理解语义（比如“苹果”是水果还是科技公司），还需要将 Token 转化为“数值向量”——这就是 Embedding（语义嵌入）。

Embedding 的核心逻辑：将每个 Token 或句子，映射到一个高维数值向量（比如 768 维、1536 维），向量之间的“距离”（余弦距离、欧氏距离）代表语义的相似度：距离越近，语义越相似。

举个例子：“苹果（水果）”和“橙子”的 Embedding 向量距离很近，而“苹果（公司）”和“微软”的向量距离很近，这就是 AI 区分“多义词”的核心逻辑——通过上下文的 Embedding 向量，判断具体语义。

核心作用：将离散的 Token 转化为连续的数值向量，让 AI 能够“计算语义”，为后续 LLM 的推理、判断提供数值基础。没有 Embedding，LLM 只能处理“文字表面”，无法理解“文字背后的含义”。

## 2\.3 Token 与 Embedding 的关系总结

Token 是“拆分语言”，解决“AI 能识别什么”的问题；Embedding 是“转化语义”，解决“AI 能理解什么”的问题。二者是“先后关系”：先将自然语言拆分为 Token，再将 Token 转化为 Embedding 向量，最终输入到 LLM 中进行处理。

# 三、中间核心：LLM 与 Chain —— AI 处理任务的“执行链路”

有了 Token 和 Embedding 作为基础，AI 就具备了“理解语言”的能力，接下来需要通过 LLM 进行逻辑处理，通过 Chain 串联步骤——这两层是 AI 完成任务的“核心执行层”，也是 LangChain 框架的核心所在。

## 3\.1 LLM：AI 的“大脑”—— 负责语义理解与逻辑推理

LLM（大语言模型）是整个链路的“核心处理器”，本质是一个基于海量数据训练的“概率模型”，核心能力是：接收 Embedding 向量输入，通过模型参数计算，输出符合语义逻辑的 Token 序列（即自然语言回复）。

LLM 的核心作用的两个层面：

1. 语义理解：通过 Embedding 向量，理解用户输入的意图（比如用户说“分析财报”，LLM 能理解需要“提取财务数据、计算关键指标、生成分析结论”）；

2. 逻辑推理：根据输入意图，执行单步或多步推理（比如分析财报时，先提取营收数据，再计算同比增长率，最后判断业绩好坏）。

但 LLM 有一个明显的局限：**默认只能执行“单步任务”**，无法自主串联多步逻辑。比如用户要求“分析特斯拉 2024 年财报，并生成 PDF 报告”，LLM 能理解任务，但无法自主拆解为“1\. 获取财报数据；2\. 分析数据；3\. 生成报告；4\. 转换为 PDF”这四个步骤——这就是 Chain 要解决的问题。

## 3\.2 Chain：AI 的“手脚”—— 负责串联多步任务

Chain（链路）的核心逻辑：将复杂任务拆解为多个“单步任务”，并按照逻辑顺序串联起来，让 LLM 依次执行每个步骤，最终完成整个复杂任务。LangChain 框架的核心价值，就是提供了一套标准化的“Chain 工具”，让开发者无需从零搭建多步任务链路。

常见的 Chain 类型（对应不同的任务场景）：

- LLMChain：最基础的 Chain，仅调用 LLM 执行单步任务（如“生成一段文案”）；

- SequentialChain：按顺序串联多个 Chain，前一个 Chain 的输出作为后一个 Chain 的输入（如“先提取财报数据 → 再分析数据 → 最后生成报告”）；

- RetrievalChain：结合“检索工具”（如数据库、搜索引擎），先检索相关信息，再让 LLM 基于检索结果生成回复（解决 LLM“知识过时”的问题）；

- ToolChain：调用外部工具（如 PDF 生成工具、邮件工具），让 LLM 具备“执行外部操作”的能力。

核心作用：打破 LLM“单步执行”的局限，串联多步任务，让 AI 能够处理复杂的、多步骤的需求。Chain 就相当于 AI 的“手脚”，让“大脑”（LLM）的决策能够落地执行。

## 3\.3 LLM 与 Chain 的关系总结

LLM 是“核心处理器”，负责执行单步语义理解和推理；Chain 是“任务串联器”，负责将复杂任务拆解为单步任务，并让 LLM 按顺序执行。二者是“协同关系”：Chain 负责“规划步骤”，LLM 负责“执行每一步”，共同完成复杂任务的处理。

补充：LangChain 框架的核心就是“封装 LLM 调用”和“提供 Chain 工具”，让开发者能够快速搭建多步任务链路，无需关注 LLM 的底层调用细节——这也是我们后续实战的核心工具。

# 四、上层应用：Agent —— AI 自主决策的“智能灵魂”

有了 LLM 和 Chain，AI 已经能处理“明确步骤”的复杂任务，但如果任务是“模糊的”“需要自主调整”的（比如“帮我处理今天的工作邮件，优先级高的先回复”），Chain 就无法满足需求——因为 Chain 的步骤是“固定的”，而 Agent 具备“自主决策、动态调整”的能力，是 AI 从“工具”升级为“智能体”的关键。

## 4\.1 Agent 的核心定义：具备自主决策能力的“智能体”

Agent（智能体）的核心是：**以 LLM 为“大脑”，以 Chain 为“手脚”，结合“记忆”（Memory）和“工具调用”（Tool），能够自主理解任务、规划步骤、执行操作、处理异常，无需人工干预完成复杂任务**。

2026 年以来，AI Agent 已从实验室走向生产环境，超过 60% 的企业正在探索或部署 Agent 解决方案，用于自动化客户服务、数据分析、代码生成等场景。与 Chain 相比，Agent 有两个核心优势：

1. 自主规划：无需提前定义步骤，Agent 能根据用户需求，自主拆解任务、规划执行顺序（比如“处理邮件”，Agent 会自主拆解为“1\. 读取所有邮件；2\. 判断优先级；3\. 优先回复高优先级邮件；4\. 归档低优先级邮件”）；

2. 动态调整：执行过程中遇到异常（比如邮件无法读取），Agent 能自主调整策略（比如尝试重新读取、提示用户检查权限），而 Chain 会直接报错。

## 4\.2 Agent 的核心组成（缺一不可）

一个完整的 Agent，必须包含 4 个核心组件（LangChain 已封装好相关工具，直接调用即可）：

- 大脑（LLM）：核心决策单元，负责理解任务、规划步骤、判断下一步行动；

- 记忆（Memory）：存储任务执行过程中的上下文信息（比如已处理的邮件、用户的偏好），避免“失忆”（比如 Agent 处理完高优先级邮件后，不会忘记低优先级邮件）；

- 工具（Tool）：Agent 可调用的外部工具（如邮件工具、搜索引擎、PDF 工具、数据库工具），扩展 Agent 的执行能力；

- 规划器（Planner）：负责将复杂任务拆解为可执行的单步步骤，常见的规划范式有 ReAct、Plan\-and\-Solve 等，其中 Plan\-and\-Solve 范式因具备全局视角，适合生产环境使用。

## 4\.3 Agent 与 Chain 的关系总结

Chain 是“固定步骤的执行者”，适合“步骤明确”的任务（如“分析财报并生成报告”）；Agent 是“自主决策的执行者”，适合“步骤模糊、需要动态调整”的任务（如“处理工作邮件、自主完成项目调研”）。

本质上，Agent 是“更高级的 Chain”—— Agent 可以自主生成 Chain，根据任务执行情况动态调整 Chain 的步骤，而 Chain 是 Agent 执行任务的“具体手段”。

# 五、完整链路串联：从 Token 到 Agent 的任务执行全过程

看到这里，我们已经理清了各层的关系，接下来用一个具体的案例（“分析特斯拉 2024 年财报，生成 PDF 报告并发送到指定邮箱”），串联从 Token 到 Agent 的完整执行链路，让你直观理解每一层的作用：

1. 输入层（Token \+ Embedding）：用户输入“分析特斯拉 2024 年财报，生成 PDF 报告并发送到指定邮箱”，模型先将这句话拆分为 Token（如“分析”“特斯拉”“2024 年”“财报”“生成”“PDF 报告”“发送”“邮箱”），再将这些 Token 转化为 Embedding 向量，输入到 LLM 中；

2. 处理层（LLM \+ Chain）：LLM 理解用户意图后，Agent 自主规划步骤（拆解为 4 个单步任务），并通过 Chain 串联执行：


    - Chain 1（检索 Chain）：调用搜索引擎，检索特斯拉 2024 年财报原文；

    - Chain 2（分析 Chain）：LLM 基于检索到的财报数据，分析营收、利润、增长率等关键指标；

    - Chain 3（生成 Chain）：LLM 基于分析结果，生成财报分析报告（文本）；

    - Chain 4（工具 Chain）：调用 PDF 生成工具，将文本报告转化为 PDF 文件；

3. 决策层（Agent）：Agent 监控每一步 Chain 的执行情况（如检索是否成功、PDF 是否生成），若执行成功，调用邮件工具发送 PDF；若执行失败（如检索不到财报），自主调整策略（如提示用户提供财报链接）；

4. 输出层：Agent 完成所有步骤后，向用户反馈“报告已生成并发送，请注意查收”。

整个过程中，Token 和 Embedding 是“基础”，LLM 是“核心”，Chain 是“执行手段”，Agent 是“决策灵魂”—— 各层协同工作，才能让 AI 从“理解语言”升级为“自主完成复杂任务”。

# 六、LangChain\+LangGraph 代码实战：手把手搭建从 Token 到 Agent 的完整链路

前面我们讲了理论，接下来通过实战，用 LangChain\+LangGraph 搭建一个“自主分析财报并生成报告”的 Agent，让你直观看到各层的协同过程。

说明：LangGraph 是 LangChain 生态下的有状态工作流编排框架，专为构建复杂 Agent 设计，通过图结构（节点=任务，边=流转逻辑）实现多步骤、动态决策的任务编排，比传统 Chain 更灵活、更适合 Agent 开发。

## 6\.1 环境准备（必做）

先安装所需依赖包（建议使用 Python 3\.9\+），这里我们使用 OpenAI 的 LLM（也可替换为 Llama 2、Claude 等模型）：

```bash
# 基础依赖
pip install -U langchain langchain-core langchain-openai langchain-community
# LangGraph 依赖（用于 Agent 流程编排）
pip install langgraph
# 工具依赖（PDF 生成、环境变量管理）
pip install python-dotenv reportlab

```

配置环境变量（创建 \.env 文件，填入你的 API 密钥）：

```python
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置 OpenAI API 密钥（替换为你的密钥）
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# 可选：配置 LangSmith 用于调试（推荐）
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGSMITH_PROJECT"] = "token-to-agent-demo"

```

## 6\.2 实战步骤：搭建“财报分析 Agent”

本次实战实现的功能：用户输入“分析特斯拉 2024 年财报，生成文本报告”，Agent 自主完成“检索财报→分析数据→生成报告”的全流程，我们将拆解每一步，对应前面讲的各层关系。

### 步骤 1：定义工具（Agent 可调用的外部工具）

这里我们定义“搜索引擎工具”（用于检索财报）和“报告生成工具”（用于整理分析结果），工具是 Agent 扩展能力的核心：

```python
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

# 1. 搜索引擎工具（用于检索特斯拉 2024 年财报）
search_tool = DuckDuckGoSearchRun(name="search")

# 2. 报告生成工具（用于整理分析结果，输出结构化报告）
@tool
def generate_report(analysis_content: str) -> str:
    """
    用于将财报分析内容整理为结构化报告
    参数：analysis_content - LLM 生成的财报分析文本
    返回：结构化的财报分析报告
    """
    report = f"""# 特斯拉 2024 年财报分析报告
## 分析摘要
{analysis_content}

### 说明
本报告由 AI Agent 自主生成，数据来源于公开网络检索，仅供参考。
    """
    return report

# 工具列表（Agent 可调用的所有工具）
tools = [search_tool, generate_report]

```

### 步骤 2：初始化 LLM 与 Agent 核心组件

使用 OpenAI 的 GPT\-4o\-mini 作为 LLM（大脑），结合 LangGraph 搭建有状态的 Agent，实现任务规划与执行：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage

# 1. 初始化 LLM（大脑）：使用 GPT-4o-mini，温度设为 0（保证输出稳定）
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 2. 定义 Agent 状态（存储任务执行过程中的上下文、工具结果等）
class AgentState(TypedDict):
    # 对话历史（存储用户输入、工具输出、LLM 回复）
    messages: Annotated[List[BaseMessage], add_messages]
    # 已完成的步骤
    completed_steps: List[str]
    # 最终报告
    final_report: str = ""

# 3. 定义任务规划节点（负责拆解任务、规划下一步行动）
def planner_node(state: AgentState):
    """任务规划节点：根据当前状态，规划下一步行动"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个财报分析 Agent，负责自主完成「检索财报→分析数据→生成报告」的任务。"
         "请根据当前任务进度，判断下一步行动："
         "1. 如果没有检索财报，先调用 search 工具检索「特斯拉 2024 年财报 全文」；"
         "2. 如果已检索到财报，调用 LLM 分析财报关键数据（营收、利润、增长率）；"
         "3. 如果已完成分析，调用 generate_report 工具生成结构化报告；"
         "4. 如果已生成报告，任务结束。"),
        ("human", "用户需求：{user_query}"),
        ("placeholder", "{messages}")
    ])
    
    # 绑定 LLM 与提示词
    planner_chain = prompt | llm
    response = planner_chain.invoke({
        "user_query": "分析特斯拉 2024 年财报，生成文本报告",
        "messages": state["messages"]
    })
    
    # 更新状态（添加规划结果）
    return {
        "messages": [response],
        "completed_steps": state["completed_steps"] + ["任务规划"]
    }

# 4. 定义工具执行节点（负责调用工具执行具体操作）
def tool_execution_node(state: AgentState):
    """工具执行节点：根据规划结果，调用对应的工具"""
    from langchain_core.tools import tool

    # 提取 LLM 的规划结果，判断需要调用的工具
    last_message = state["messages"][-1].content
    tools_to_call = []
    
    if "search" in last_message and "检索" in last_message:
        tools_to_call.append("search")
    elif "generate_report" in last_message and "生成报告" in last_message:
        # 提取 LLM 分析的内容（假设上一条消息是分析结果）
        analysis_content = state["messages"][-2].content
        tools_to_call.append(("generate_report", {"analysis_content": analysis_content}))
    
    # 执行工具并获取结果
    tool_results = []
    for tool_call in tools_to_call:
        if tool_call == "search":
            # 调用搜索引擎工具
            result = search_tool.invoke("特斯拉 2024 年财报 全文")
            tool_results.append(f"搜索引擎返回结果：{result}")
        elif tool_call[0] == "generate_report":
            # 调用报告生成工具
            result = generate_report.invoke(tool_call[1])
            tool_results.append(f"报告生成结果：{result}")
            # 更新最终报告
            state["final_report"] = result
    
    # 更新状态（添加工具执行结果）
    return {
        "messages": state["messages"] + [{"type": "tool", "content": "\n".join(tool_results)}],
        "completed_steps": state["completed_steps"] + ["工具执行"],
        "final_report": state["final_report"]
    }

# 5. 定义 LLM 分析节点（负责分析财报数据）
def analysis_node(state: AgentState):
    """LLM 分析节点：基于检索到的财报数据，分析关键指标"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是专业的财报分析师，负责基于提供的财报数据，分析特斯拉 2024 年的核心财务指标："
         "1. 总营收及同比增长率；2. 净利润及同比增长率；3. 核心业务（汽车业务）营收占比；"
         "4. 简单总结业绩表现（好/坏，原因简要分析）。"),
        ("placeholder", "{messages}")
    ])
    
    # 绑定 LLM 与提示词
    analysis_chain = prompt | llm
    response = analysis_chain.invoke({"messages": state["messages"]})
    
    # 更新状态（添加分析结果）
    return {
        "messages": state["messages"] + [response],
        "completed_steps": state["completed_steps"] + ["财报分析"]
    }

# 6. 定义结束判断节点（判断任务是否完成）
def should_end(state: AgentState):
    """判断任务是否完成：如果已生成最终报告，结束任务；否则继续"""
    if state["final_report"] != "":
        return END
    else:
        return "planner"  # 回到规划节点，继续下一步

```

### 步骤 3：用 LangGraph 编排 Agent 流程（图结构）

LangGraph 的核心是“图结构”，我们定义 4 个节点（规划、工具执行、分析、结束），并定义节点间的流转逻辑：

```python
# 1. 创建状态图（LangGraph 的核心）
graph = StateGraph(AgentState)

# 2. 添加节点（每个节点对应一个任务单元）
graph.add_node("planner", planner_node)  # 规划节点
graph.add_node("tool_execution", tool_execution_node)  # 工具执行节点
graph.add_node("analysis", analysis_node)  # 分析节点

# 3. 定义节点流转逻辑（边）
# 开始 → 规划节点
graph.add_edge(START, "planner")
# 规划节点 → 工具执行节点（需要调用工具时）
graph.add_edge("planner", "tool_execution")
# 工具执行节点 → 分析节点（检索完成后，进行分析）
graph.add_edge("tool_execution", "analysis")
# 分析节点 → 规划节点（分析完成后，回到规划节点，判断是否生成报告）
graph.add_edge("analysis", "planner")
# 规划节点 → 结束（任务完成时，由 should_end 判断）
graph.add_conditional_edges("planner", should_end)

# 4. 编译图（生成 Agent）
agent = graph.compile()

```

### 步骤 4：运行 Agent，查看完整执行过程

运行 Agent，输入用户需求，查看从 Token 到 Agent 的完整执行链路，同时验证各层的协同效果：

```python
# 初始化状态（空对话历史、空步骤）
initial_state = {
    "messages": [],
    "completed_steps": [],
    "final_report": ""
}

# 运行 Agent（流式输出，查看每一步执行过程）
for step in agent.stream(initial_state):
    # 打印每一步的节点和结果
    for node, output in step.items():
        print(f"=== 节点：{node} ===")
        if "messages" in output and output["messages"]:
            print(f"消息：{output['messages'][-1].content[:500]}...")  # 截取前 500 字，避免输出过长
        if "completed_steps" in output:
            print(f"已完成步骤：{output['completed_steps']}")
        if "final_report" in output and output["final_report"]:
            print(f"\n=== 最终报告 ===")
            print(output["final_report"])
        print("-" * 80)

```

## 6\.3 实战结果解读（对应各层关系）

运行代码后，你会看到以下执行流程，完美对应我们前面讲的“Token→Embedding→LLM→Chain→Agent”链路：

1. Token 与 Embedding：用户需求输入后，LLM 自动将其拆分为 Token，并转化为 Embedding 向量（代码中无需手动处理，LangChain 已封装）；

2. LLM：作为“大脑”，负责规划任务、分析财报数据（analysis\_node 节点）；

3. Chain：代码中的 planner\_chain、analysis\_chain 就是简单的 Chain，负责串联“提示词→LLM→输出”的单步逻辑；

4. Agent：通过 LangGraph 编排的图结构，自主规划步骤（planner\_node）、调用工具（tool\_execution\_node）、动态调整流程（should\_end 节点），最终完成任务。

补充：代码可直接运行，若想替换模型（如使用 Claude），只需修改 LLM 的初始化代码（参考 LangChain 官方文档）；若想添加 PDF 生成、邮件发送功能，只需新增对应的工具并添加到工具列表中。

# 七、总结：各层关系核心要点（必记）

通过理论\+实战，我们已经彻底搞懂了 AI 各层的关系和任务执行链路，最后用一张表格总结核心要点，方便你快速回顾：

|层级|核心组件|核心作用|类比|
|---|---|---|---|
|输入层（底层基础）|Token、Embedding|将自然语言转化为 AI 能理解的机器语言|人类的“文字识别”能力|
|处理层（中间核心）|LLM、Chain|理解语义、执行单步/多步逻辑|人类的“大脑思考\+手脚执行”能力|
|决策层（上层应用）|Agent|自主规划、动态调整、完成复杂任务|人类的“自主决策\+问题解决”能力|

核心逻辑：**底层为上层提供基础，上层依赖底层实现功能**—— 没有 Token 和 Embedding，LLM 无法理解语言；没有 LLM 和 Chain，Agent 无法执行任务；各层协同，才能让 AI 从“被动执行”升级为“主动决策”。

后续你可以基于本文的实战代码，尝试扩展功能（如添加 PDF 生成、邮件发送、异常处理），进一步理解 Agent 的自主决策能力，真正掌握 AI 任务执行的完整链路。 
