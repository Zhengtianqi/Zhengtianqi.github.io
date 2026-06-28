---
title: 构建 ReAct+RAG 智能体：从零打造个性化数字人 Demo
tag: ["ReAct", "RAG", "AI Agent"]
category: 大模型
date: 2026-05-13
---

# 构建 ReAct+RAG 智能体：从零打造个性化数字人 Demo

> 大语言模型是AI领域的革命性技术，它为自然语言处理和智能应用提供了强大的能力。
> 本文介绍了大模型的核心概念和应用方式，帮助你进入AI应用开发领域。

ReAct 由 Yao et al. (2022) 提出，核心思想是让 LLM 在 **Reasoning（推理）** 和 **Acting（行动）** 之间交替循环，形成：

```
Thought → Action → Observation → Thought → Action → ...→ Final Answer
```

| 阶段 | 说明 | 示例 |
|------|------|------|
| **Thought** | 模型对当前问题的分析与规划 | "用户问的是产品价格，我需要查询数据库" |
| **Action** | 调用外部工具或 API | `search_knowledge_base("产品价格")` |
| **Observation** | 工具返回的结果 | `{"price": "¥299", "stock": 50}` |
| **Answer** | 基于观测结果生成最终回答 | "该产品售价 299 元，库存充足" |

**优势**：动态推理，可处理多步骤复杂任务；支持工具调用，突破 LLM 知识局限。

### RAG 检索增强生成

RAG 的核心流程：

```
用户查询 → Embedding 编码 → 向量检索 → 召回相关文档 → 注入 Prompt → LLM 生成答案
```

**关键组件**：
- **文档切分**：将知识库切成合适的 Chunk（通常 256-512 tokens）
- **向量数据库**：FAISS、Chroma、Milvus 等
- **Embedding 模型**：`text-embedding-ada-002`、`bge-m3` 等
- **重排序（Rerank）**：用 Cross-Encoder 对召回结果二次排序，提升精准度

### Agent 智能体

Agent = LLM + Memory + Tools + Planning

```
┌─────────────────────────────────────┐
│              Agent Core             │
│                                     │
│  ┌──────────┐    ┌──────────────┐   │
│  │  Memory  │    │   Planning   │   │
│  │ (短期/长期)│    │  (ReAct Loop)│   │
│  └──────────┘    └──────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │           Tools              │   │
│  │  [搜索] [数据库] [API] [代码] │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 个性化数字人

数字人在 Agent 基础上，额外加入：

- **角色设定（Persona）**：姓名、性格、说话风格、专业领域
- **长期记忆（Long-term Memory）**：记住用户偏好、历史对话关键信息
- **个人知识库（Personal KB）**：特定角色专属的 RAG 知识源
- **情感状态（Emotion State）**：根据对话动态调整回应风格

## 整体架构设计

```
┌────────────────────────────────────────────────────────────┐
│                    用户输入 (User Query)                     │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   数字人角色层 (Persona Layer)               │
│   角色设定 + 长期记忆读取 + 情感状态 → 构建系统 Prompt        │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│               ReAct 推理引擎 (ReAct Engine)                  │
│                                                            │
│   Thought → Action → Observation → ... → Final Answer     │
└──────────┬──────────────────────────────────┬─────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐         ┌────────────────────────┐
│   RAG 检索模块        │         │    外部工具集            │
│                      │         │                        │
│  个人知识库 (Chroma)  │         │  • 网络搜索              │
│  + Embedding 检索     │         │  • 计算器                │
│  + Rerank 排序        │         │  • 天气 API             │
└──────────────────────┘         └────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   记忆更新层 (Memory Update)                  │
│              提取关键信息 → 写入长期记忆存储                    │
└────────────────────────────────────────────────────────────┘
```

## 环境搭建

### 依赖安装

```bash
pip install openai chromadb sentence-transformers tiktoken python-dotenv
pip install langchain langchain-community faiss-cpu
```

### 项目结构

```
digital_human_demo/
├── main.py                 # 主入口
├── config.py               # 配置管理
├── agent/
│   ├── react_agent.py      # ReAct 推理引擎
│   ├── tools.py            # 工具注册
│   └── memory.py           # 记忆管理
├── rag/
│   ├── knowledge_base.py   # 知识库构建
│   ├── retriever.py        # 检索器
│   └── docs/               # 知识文档目录
├── persona/
│   ├── digital_human.py    # 数字人核心
│   └── profiles/           # 角色配置文件
│       └── xiaoai.json     # 示例角色：小艾
└── requirements.txt
```

### 环境配置

```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002")
    CHROMA_DB_PATH = "./chroma_db"
    MAX_ITERATIONS = 10          # ReAct 最大循环次数
    TOP_K_RETRIEVAL = 5          # RAG 召回数量
    MEMORY_MAX_ITEMS = 50        # 长期记忆最大条数
```

## ReAct+RAG 智能体实现

### 知识库构建

```python
# rag/knowledge_base.py
import chromadb
from chromadb.utils import embedding_functions
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

class KnowledgeBase:
    def __init__(self, collection_name: str, db_path: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=db_path)
        
        # 使用 OpenAI Embedding
        self.ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-ada-002"
        )
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.ef,
            metadata={"hnsw:space": "cosine"}
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=64,
            separators=["\n\n", "\n", "。", "！", "？", ".", "!"]
        )

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        """将文档切分后加入知识库"""
        all_chunks = []
        all_ids = []
        all_metas = []
        
        for i, text in enumerate(texts):
            chunks = self.text_splitter.split_text(text)
            for j, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_ids.append(f"doc_{i}_chunk_{j}")
                all_metas.append(metadatas[i] if metadatas else {"source": f"doc_{i}"})
        
        # 批量写入（避免单次请求过大）
        batch_size = 100
        for start in range(0, len(all_chunks), batch_size):
            self.collection.add(
                documents=all_chunks[start:start+batch_size],
                ids=all_ids[start:start+batch_size],
                metadatas=all_metas[start:start+batch_size]
            )
        
        print(f"✅ 成功写入 {len(all_chunks)} 个知识块")

    def query(self, query_text: str, top_k: int = 5) -> list[dict]:
        """语义检索"""
        results = self.collection.query(
            query_texts=[query_text],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        docs = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            docs.append({
                "content": doc,
                "metadata": meta,
                "score": 1 - dist  # 转换为相似度
            })
        
        return docs

    def load_from_directory(self, dir_path: str):
        """从目录批量加载 .txt / .md 文件"""
        texts, metas = [], []
        for fname in os.listdir(dir_path):
            if fname.endswith((".txt", ".md")):
                fpath = os.path.join(dir_path, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    texts.append(f.read())
                    metas.append({"source": fname, "type": "file"})
        
        if texts:
            self.add_documents(texts, metas)
```

### ReAct 推理循环

```python
# agent/react_agent.py
from openai import OpenAI
from typing import Callable
import json, re

REACT_SYSTEM_PROMPT = """你是一个智能助手，使用 ReAct 框架解决问题。

每次回复必须严格按照以下格式之一：

格式1（需要使用工具时）：
Thought: [你的推理过程]
Action: [工具名称]
Action Input: [工具输入，JSON格式]

格式2（已有足够信息时）：
Thought: [你的推理过程]
Final Answer: [最终回答]

可用工具：
{tools_description}

规则：
- 每次只能选择一个 Action
- Action Input 必须是合法 JSON
- 收到 Observation 后继续推理
- 不确定时优先使用 rag_search 工具
"""

class ReActAgent:
    def __init__(self, llm_client: OpenAI, model: str, tools: dict[str, Callable]):
        self.client = llm_client
        self.model = model
        self.tools = tools  # {"tool_name": callable_function}
        self.max_iterations = 10

    def _build_tools_description(self) -> str:
        desc = []
        for name, func in self.tools.items():
            doc = func.__doc__ or "无描述"
            desc.append(f"- {name}: {doc.strip()}")
        return "\n".join(desc)

    def _parse_action(self, text: str) -> tuple[str, str] | None:
        """解析模型输出中的 Action 和 Action Input"""
        action_match = re.search(r"Action:\s*(.+?)(?:\n|$)", text)
        input_match = re.search(r"Action Input:\s*(.+?)(?:\nThought|$)", text, re.DOTALL)
        
        if action_match and input_match:
            action = action_match.group(1).strip()
            action_input = input_match.group(1).strip()
            return action, action_input
        return None

    def _parse_final_answer(self, text: str) -> str | None:
        match = re.search(r"Final Answer:\s*(.+?)$", text, re.DOTALL)
        return match.group(1).strip() if match else None

    def run(self, user_query: str, extra_system: str = "") -> str:
        """执行 ReAct 推理循环"""
        system_prompt = REACT_SYSTEM_PROMPT.format(
            tools_description=self._build_tools_description()
        )
        if extra_system:
            system_prompt = extra_system + "\n\n" + system_prompt

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ]

        for iteration in range(self.max_iterations):
            print(f"\n{'='*50}")
            print(f"🔄 ReAct 第 {iteration + 1} 轮")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
                stop=["Observation:"]  # 在 Observation 前停止，等待工具结果
            )
            
            assistant_text = response.choices[0].message.content
            print(f"🤖 模型输出：\n{assistant_text}")

            # 检查是否有最终答案
            final_answer = self._parse_final_answer(assistant_text)
            if final_answer:
                print(f"\n✅ 最终答案：{final_answer}")
                return final_answer

            # 解析并执行 Action
            action_result = self._parse_action(assistant_text)
            if not action_result:
                # 无法解析，直接返回模型输出
                return assistant_text
            
            action_name, action_input_str = action_result
            
            # 执行工具
            try:
                action_input = json.loads(action_input_str)
                if action_name in self.tools:
                    print(f"\n🔧 执行工具：{action_name}({action_input})")
                    observation = self.tools[action_name](**action_input)
                else:
                    observation = f"错误：工具 '{action_name}' 不存在"
            except json.JSONDecodeError:
                observation = f"错误：Action Input 不是合法 JSON：{action_input_str}"
            except Exception as e:
                observation = f"工具执行出错：{str(e)}"
            
            print(f"👁️ 观察结果：{observation}")

            # 将交互历史加入消息
            messages.append({"role": "assistant", "content": assistant_text})
            messages.append({
                "role": "user",
                "content": f"Observation: {observation}\n继续推理："
            })

        return "达到最大推理轮次，无法得出答案。"
```

### 工具注册与调用

```python
# agent/tools.py
from rag.retriever import RAGRetriever
import json

def create_tools(rag_retriever: RAGRetriever) -> dict:
    
    def rag_search(query: str, top_k: int = 3) -> str:
        """从个人知识库中检索相关信息。参数: query(检索关键词), top_k(返回数量)"""
        results = rag_retriever.retrieve(query, top_k=top_k)
        if not results:
            return "知识库中未找到相关内容。"
        
        formatted = []
        for i, r in enumerate(results):
            formatted.append(
                f"[文档{i+1}] 相似度:{r['score']:.2f} 来源:{r['metadata'].get('source','未知')}\n{r['content']}"
            )
        return "\n\n".join(formatted)

    def calculate(expression: str) -> str:
        """执行数学计算。参数: expression(数学表达式字符串，如 '2 + 3 * 4')"""
        try:
            # 安全计算：只允许数字和基本运算符
            allowed = set("0123456789+-*/()., ")
            if all(c in allowed for c in expression):
                result = eval(expression)
                return f"计算结果：{expression} = {result}"
            return "错误：包含不允许的字符"
        except Exception as e:
            return f"计算错误：{e}"

    def get_current_time(timezone: str = "Asia/Shanghai") -> str:
        """获取当前时间。参数: timezone(时区，默认 Asia/Shanghai)"""
        from datetime import datetime
        import pytz
        try:
            tz = pytz.timezone(timezone)
            now = datetime.now(tz)
            return f"当前时间（{timezone}）：{now.strftime('%Y-%m-%d %H:%M:%S %A')}"
        except Exception:
            from datetime import datetime
            return f"当前时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

    def summarize_memory(user_id: str) -> str:
        """查询用户历史记忆摘要。参数: user_id(用户ID)"""
        # 实际项目中从数据库读取
        return f"用户 {user_id} 的记忆摘要：该用户是一名AI工程师，偏好技术深度内容，上次询问了关于向量数据库的选型问题。"

    return {
        "rag_search": rag_search,
        "calculate": calculate,
        "get_current_time": get_current_time,
        "summarize_memory": summarize_memory,
    }
```

## 个性化数字人集成

### 角色配置文件

```json
// persona/profiles/xiaoai.json
{
  "name": "小艾",
  "english_name": "Xiaoai",
  "avatar": "🤖",
  "role": "AI技术助手",
  "personality": "专业、耐心、略带幽默，善于用类比解释复杂概念",
  "speaking_style": "中文为主，技术词汇可保留英文，回答结构清晰，善用emoji增加亲和力",
  "expertise": ["LLM应用开发", "RAG系统", "Agent框架", "向量数据库", "Python工程"],
  "knowledge_base": "rag/docs/ai_tech/",
  "greeting": "你好！我是小艾，专注于AI工程实践。有什么技术问题可以问我～ 🚀",
  "memory_prompt": "请记住用户的技术背景和偏好，在后续对话中保持一致性。"
}
```

### 角色记忆模块

```python
# agent/memory.py
import json
from datetime import datetime
from collections import deque
from openai import OpenAI

class MemoryManager:
    def __init__(self, user_id: str, llm_client: OpenAI, model: str, max_items: int = 50):
        self.user_id = user_id
        self.client = llm_client
        self.model = model
        self.short_term: list[dict] = []        # 当前会话对话历史
        self.long_term: deque[dict] = deque(maxlen=max_items)  # 跨会话记忆
        self._load_long_term()

    def _storage_path(self) -> str:
        return f"./memory/{self.user_id}_memory.json"

    def _load_long_term(self):
        """从文件加载长期记忆"""
        import os
        path = self._storage_path()
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.long_term = deque(data.get("memories", []), maxlen=50)

    def save_long_term(self):
        """持久化长期记忆"""
        import os
        os.makedirs("./memory", exist_ok=True)
        with open(self._storage_path(), "w", encoding="utf-8") as f:
            json.dump({"user_id": self.user_id, "memories": list(self.long_term)}, f, ensure_ascii=False, indent=2)

    def add_turn(self, role: str, content: str):
        """添加对话轮次到短期记忆"""
        self.short_term.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

    def extract_and_store_memory(self, conversation: str):
        """用 LLM 从对话中提取关键记忆点"""
        extract_prompt = f"""从以下对话中提取值得长期记忆的关键信息（用户偏好、重要事实、特殊需求等）。
若无重要信息则返回空列表。以 JSON 数组格式返回，每项包含 "content" 和 "category" 字段。

对话内容：
{conversation}

返回格式示例：
[{{"content": "用户是Python开发者，偏好简洁代码风格", "category": "用户背景"}},
 {{"content": "用户对向量数据库选型有疑问，已推荐Chroma", "category": "技术偏好"}}]"""
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": extract_prompt}],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        try:
            result = json.loads(response.choices[0].message.content)
            memories = result if isinstance(result, list) else result.get("memories", [])
            for mem in memories:
                mem["timestamp"] = datetime.now().isoformat()
                self.long_term.append(mem)
            self.save_long_term()
            print(f"💾 提取并保存了 {len(memories)} 条长期记忆")
        except Exception as e:
            print(f"记忆提取失败：{e}")

    def get_memory_context(self) -> str:
        """构建记忆上下文字符串"""
        if not self.long_term:
            return "（暂无历史记忆）"
        
        lines = ["用户历史记忆："]
        for mem in list(self.long_term)[-10:]:  # 最近10条
            lines.append(f"- [{mem.get('category','其他')}] {mem['content']}")
        return "\n".join(lines)
```

### 个性化对话引擎

```python
# persona/digital_human.py
import json
from openai import OpenAI
from agent.react_agent import ReActAgent
from agent.tools import create_tools
from agent.memory import MemoryManager
from rag.knowledge_base import KnowledgeBase

class DigitalHuman:
    def __init__(self, profile_path: str, user_id: str, config):
        # 加载角色配置
        with open(profile_path, "r", encoding="utf-8") as f:
            self.profile = json.load(f)
        
        self.user_id = user_id
        self.config = config
        
        # 初始化 OpenAI 客户端
        self.client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )
        
        # 初始化知识库
        self.kb = KnowledgeBase(
            collection_name=f"persona_{self.profile['name']}",
            db_path=config.CHROMA_DB_PATH
        )
        # 加载角色专属知识
        import os
        kb_path = self.profile.get("knowledge_base", "")
        if kb_path and os.path.exists(kb_path):
            self.kb.load_from_directory(kb_path)
        
        # 初始化记忆管理器
        self.memory = MemoryManager(
            user_id=user_id,
            llm_client=self.client,
            model=config.LLM_MODEL
        )
        
        # 初始化工具集
        tools = create_tools(rag_retriever=self.kb)
        
        # 初始化 ReAct 智能体
        self.agent = ReActAgent(
            llm_client=self.client,
            model=config.LLM_MODEL,
            tools=tools
        )

    def _build_persona_prompt(self) -> str:
        """构建角色系统 Prompt"""
        p = self.profile
        memory_ctx = self.memory.get_memory_context()
        
        return f"""你是 {p['name']}，{p['role']}。

【角色设定】
- 性格：{p['personality']}
- 说话风格：{p['speaking_style']}
- 专业领域：{', '.join(p['expertise'])}

【用户记忆】
{memory_ctx}

【行为准则】
1. 始终保持 {p['name']} 的角色特征
2. 结合用户历史记忆提供个性化回答
3. 遇到专业问题，优先使用 rag_search 工具查询知识库
4. 回答后适当引导用户深入探讨
"""

    def chat(self, user_input: str) -> str:
        """处理用户输入，返回数字人回复"""
        print(f"\n{'🤖'*20}")
        print(f"{self.profile['avatar']} {self.profile['name']} 正在思考...")
        
        # 记录用户输入
        self.memory.add_turn("user", user_input)
        
        # 构建角色 Prompt
        persona_prompt = self._build_persona_prompt()
        
        # 通过 ReAct 智能体处理
        response = self.agent.run(
            user_query=user_input,
            extra_system=persona_prompt
        )
        
        # 记录助手回复
        self.memory.add_turn("assistant", response)
        
        # 每 5 轮对话提取一次长期记忆
        if len(self.memory.short_term) % 10 == 0:
            recent_conv = "\n".join([
                f"{t['role']}: {t['content']}" 
                for t in self.memory.short_term[-10:]
            ])
            self.memory.extract_and_store_memory(recent_conv)
        
        return response

    def greet(self) -> str:
        return f"{self.profile['avatar']} {self.profile['greeting']}"
```

## 完整 Demo 代码

```python
# main.py - 完整运行入口
from config import Config
from persona.digital_human import DigitalHuman

def main():
    config = Config()
    
    print("=" * 60)
    print("🌟 ReAct + RAG 个性化数字人 Demo")
    print("=" * 60)
    
    # 初始化数字人
    human = DigitalHuman(
        profile_path="persona/profiles/xiaoai.json",
        user_id="user_001",
        config=config
    )
    
    # 打招呼
    print(f"\n{human.greet()}")
    print("\n💡 输入 'quit' 退出，输入 'memory' 查看记忆")
    print("-" * 60)
    
    while True:
        user_input = input("\n👤 你：").strip()
        
        if not user_input:
            continue
        if user_input.lower() == "quit":
            print("\n👋 再见！记忆已保存。")
            human.memory.save_long_term()
            break
        if user_input.lower() == "memory":
            print(f"\n{human.memory.get_memory_context()}")
            continue
        
        response = human.chat(user_input)
        print(f"\n{human.profile['avatar']} {human.profile['name']}：{response}")

if __name__ == "__main__":
    main()
```

## 运行效果展示

下面是一段 Demo 对话示例：

```
====================================================
🌟 ReAct + RAG 个性化数字人 Demo
====================================================

🤖 你好！我是小艾，专注于AI工程实践。有什么技术问题可以问我～ 🚀

👤 你：RAG 和 Fine-tuning 各适合什么场景？

🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖🤖
🤖 小艾 正在思考...

==================================================
🔄 ReAct 第 1 轮
🤖 模型输出：
Thought: 用户问的是 RAG 和 Fine-tuning 的场景对比，这是我知识库里的核心内容，先检索相关资料。
Action: rag_search
Action Input: {"query": "RAG Fine-tuning 对比 适用场景", "top_k": 3}

🔧 执行工具：rag_search({"query": "RAG Fine-tuning 对比 适用场景"})
👁️ 观察结果：[文档1] 相似度:0.91 ...

==================================================
🔄 ReAct 第 2 轮
🤖 模型输出：
Thought: 已获取足够信息，可以给出全面对比。
Final Answer: 好问题！两者适用场景确实不同 🎯

**RAG（检索增强生成）适合：**
- ✅ 知识频繁更新（新闻、文档、产品信息）
- ✅ 需要引用来源和溯源
- ✅ 快速部署，成本低
- ✅ 知识量大但使用频率不均匀

**Fine-tuning（微调）适合：**
- ✅ 特定风格/格式的输出（代码补全、特定行业术语）
- ✅ 知识相对固定，追求极致推理速度
- ✅ 有足够的高质量标注数据

**💡 实践建议：** 大多数业务场景优先选 RAG，开发周期短、可解释性强；当发现模型在特定任务上"说话方式"需要调整时，再考虑 Fine-tuning，或者两者结合（先微调获得领域适应，再 RAG 补充实时知识）。

你目前的应用场景是哪类？我可以给更具体的建议～

✅ 最终答案：好问题！...

🤖 小艾：好问题！...
```

## 优化方向与进阶思路

### 1. RAG 质量提升

```python
# 添加 Rerank 模块
from sentence_transformers import CrossEncoder

class ReRanker:
    def __init__(self, model_name="BAAI/bge-reranker-base"):
        self.model = CrossEncoder(model_name)
    
    def rerank(self, query: str, docs: list[dict], top_k: int = 3) -> list[dict]:
        pairs = [(query, doc["content"]) for doc in docs]
        scores = self.model.predict(pairs)
        ranked = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)
        return [doc for _, doc in ranked[:top_k]]
```

### 2. 多模态数字人

- 集成 **TTS（文字转语音）**：使用 OpenAI TTS API 或 Edge-TTS
- 集成 **数字人形象**：SadTalker、Wav2Lip 驱动面部动画
- 集成 **ASR（语音识别）**：Whisper 实现语音输入

### 3. 生产化改造

| 方向 | 技术选型 |
|------|---------|
| 向量数据库 | Milvus / Weaviate（替代 Chroma） |
| 记忆存储 | Redis（短期） + PostgreSQL（长期） |
| 服务化 | FastAPI + WebSocket 流式响应 |
| 监控 | LangSmith / Langfuse 追踪 ReAct 链路 |
| 并发 | AsyncIO + 连接池优化 |

### 4. 多 Agent 协作

```
用户请求
    │
    ▼
路由 Agent（分类任务类型）
    │
    ├── 技术问题 → 技术小艾（RAG: AI文档库）
    ├── 情感支持 → 心理小暖（RAG: 心理健康知识库）
    └── 商务咨询 → 商务小智（RAG: 行业报告库）
```

## 总结

本文完整实现了一个 **ReAct + RAG + 个性化数字人** 的 Demo 项目，核心要点回顾：

| 模块 | 技术实现 | 关键作用 |
|------|---------|---------|
| **ReAct 引擎** | Thought-Action-Observation 循环 | 多步骤推理与工具调用 |
| **RAG 知识库** | Chroma + OpenAI Embedding | 知识精准召回 |
| **工具集** | 自定义函数注册 | 扩展 Agent 能力边界 |
| **角色记忆** | 短期（会话）+ 长期（持久化）| 个性化交互体验 |
| **数字人层** | Persona Prompt + 记忆注入 | 角色一致性与个性化 |

**整个系统的设计哲学**：让 LLM 专注于推理，让 RAG 负责知识，让 Memory 保证连续性，让 Persona 赋予温度。三者协同，打造真正有用、有记忆、有个性的 AI 数字人。

*本文涉及技术版本：Python 3.11+，OpenAI SDK 1.x，ChromaDB 0.5.x，LangChain 0.3.x*
