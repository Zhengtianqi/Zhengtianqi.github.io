---
title: Agent 记忆系统设计：从短期到长期记忆的工程实践
tag: ["Agent", "Memory", "记忆系统", "LangChain", "大模型"]
category: 大模型
date: 2026-06-27
---

# Agent 记忆系统设计：从短期到长期记忆的工程实践

Agent 聊着聊着就"失忆"了？多轮对话后忘了用户是谁？长期记忆太贵？记忆系统是 Agent 从"聊天机器人"到"个人助手"的关键一跃。

---

## 一、为什么 Agent 需要记忆

### 1.1 LLM 的记忆局限

```
LLM 的"记忆"= 上下文窗口（Context Window）
  GPT-4: 128K tokens ≈ 10 万字
  Claude 3: 200K tokens ≈ 15 万字
  
问题：
  1. 窗口有限：聊久了历史消息超出窗口，被截断
  2. 成本高昂：每次请求带上全部历史，token 费用爆炸
  3. 跨会话失忆：新会话从零开始，不记得之前的对话
  4. 无个性化：不知道用户是谁、偏好什么
```

### 1.2 人类记忆模型

```
感觉记忆（<1秒）→ 短期记忆（几分钟）→ 长期记忆（数年）

短期记忆：
  - 当前对话上下文
  - 工作中的变量和状态
  
长期记忆：
  - 语义记忆：事实知识（用户姓名、偏好）
  - 情景记忆：具体事件（上周聊了什么）
  - 程序记忆：技能和习惯（常用工具、操作流程）
```

---

## 二、记忆系统架构

```
┌────────────────────────────────────────────────┐
│                  Agent Memory                  │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ 短期记忆  │  │ 工作记忆  │  │  长期记忆     │ │
│  │          │  │          │  │              │ │
│  │ 对话历史  │  │ 当前任务  │  │  语义记忆     │ │
│  │ 上下文窗口│  │ 变量状态  │  │  情景记忆     │ │
│  │          │  │ 工具结果  │  │  程序记忆     │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│       │              │              │          │
│       ▼              ▼              ▼          │
│  Buffer Window   State Mgr    Vector DB        │
│  Summary         Scratchpad   Knowledge Graph  │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 三、短期记忆实现

### 3.1 Buffer Window（滑动窗口）

```python
from collections import deque

class BufferMemory:
    """只保留最近 K 轮对话"""
    def __init__(self, max_messages: int = 10):
        self.buffer = deque(maxlen=max_messages)
    
    def add(self, role: str, content: str):
        self.buffer.append({"role": role, "content": content})
    
    def get_messages(self) -> list[dict]:
        return list(self.buffer)
    
    def get_prompt(self) -> str:
        messages = self.get_messages()
        return "\n".join([f"{m['role']}: {m['content']}" for m in messages])

# 问题：超过窗口的历史完全丢失
# 优化：对超出窗口的历史做摘要
```

### 3.2 Summary Memory（摘要记忆）

```python
class SummaryMemory:
    """对旧对话做摘要，保留最近对话"""
    def __init__(self, llm, max_messages: int = 6):
        self.llm = llm
        self.max_messages = max_messages
        self.summary = ""
        self.recent = deque(maxlen=max_messages)
    
    def add(self, role: str, content: str):
        self.recent.append({"role": role, "content": content})
        
        # 当 recent 满了，最旧的消息被挤出，合并到摘要
        if len(self.recent) == self.max_messages:
            oldest = self.recent[0]
            self._update_summary(oldest)
    
    def _update_summary(self, old_message: dict):
        prompt = f"""请将以下信息合并到已有摘要中，保持简洁：
        
        已有摘要：{self.summary}
        新增内容：{old_message['role']}: {old_message['content']}
        
        更新后的摘要："""
        self.summary = self.llm.generate(prompt)
    
    def get_prompt(self) -> str:
        return f"对话摘要：{self.summary}\n\n最近对话：\n{self._format_recent()}"
```

### 3.3 Token Buffer（Token 级别控制）

```python
import tiktoken

class TokenBufferMemory:
    """按 token 数量控制，不按消息条数"""
    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens
        self.messages = []
        self.encoder = tiktoken.encoding_for_model("gpt-4")
    
    def add(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        self._trim()
    
    def _trim(self):
        """从前面删除消息直到 token 数达标"""
        while self._count_tokens() > self.max_tokens and self.messages:
            self.messages.pop(0)
    
    def _count_tokens(self) -> int:
        total = 0
        for msg in self.messages:
            total += len(self.encoder.encode(msg["content"]))
            total += 4  # 每条消息 overhead
        return total
```

---

## 四、长期记忆实现

### 4.1 向量检索记忆

```python
from chromadb import Client

class VectorLongTermMemory:
    """用向量数据库存储长期记忆"""
    def __init__(self, embedding_model):
        self.client = Client()
        self.collection = self.client.create_collection("memory")
        self.embedding_model = embedding_model
    
    def remember(self, content: str, metadata: dict = None):
        """存储记忆"""
        embedding = self.embedding_model.encode(content)
        self.collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[metadata or {}],
            ids=[f"mem_{self.collection.count()}"]
        )
    
    def recall(self, query: str, top_k: int = 5) -> list[str]:
        """检索相关记忆"""
        query_embedding = self.embedding_model.encode(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        return results["documents"][0]
    
    def forget(self, memory_id: str):
        """删除记忆"""
        self.collection.delete(ids=[memory_id])
```

### 4.2 结构化记忆（实体-属性-值）

```python
class StructuredMemory:
    """存储用户信息、偏好等结构化记忆"""
    def __init__(self):
        self.user_profile = {}  # 实体属性
        self.facts = []          # 事实列表
        self.preferences = {}    # 偏好
    
    def update_profile(self, key: str, value: str):
        """更新用户画像"""
        self.user_profile[key] = {
            "value": value,
            "updated_at": datetime.now().isoformat()
        }
    
    def add_fact(self, fact: str, source: str = "conversation"):
        """添加事实"""
        self.facts.append({
            "content": fact,
            "source": source,
            "created_at": datetime.now().isoformat()
        })
    
    def get_context(self) -> str:
        """生成上下文注入 Prompt"""
        lines = ["[用户画像]"]
        for k, v in self.user_profile.items():
            lines.append(f"- {k}: {v['value']}")
        
        lines.append("\n[已知事实]")
        for f in self.facts[-10:]:  # 最近10条
            lines.append(f"- {f['content']}")
        
        return "\n".join(lines)

# 使用
memory = StructuredMemory()
memory.update_profile("name", "张三")
memory.update_profile("job", "Java后端开发")
memory.add_fact("正在准备LLM面试")
memory.add_fact("关注担保业务系统")

# 注入到 Prompt
context = memory.get_context()
# [用户画像]
# - name: 张三
# - job: Java后端开发
#
# [已知事实]
# - 正在准备LLM面试
# - 关注担保业务系统
```

### 4.3 知识图谱记忆

```python
class KnowledgeGraphMemory:
    """用知识图谱存储关系型记忆"""
    def __init__(self):
        self.entities = {}  # 实体 → 属性
        self.relations = []  # (主体, 关系, 客体)
    
    def add_entity(self, name: str, entity_type: str, properties: dict = None):
        self.entities[name] = {
            "type": entity_type,
            "properties": properties or {}
        }
    
    def add_relation(self, subject: str, relation: str, obj: str):
        self.relations.append({
            "subject": subject,
            "relation": relation,
            "object": obj
        })
    
    def query_entity(self, name: str) -> dict:
        """查询实体及其关系"""
        entity = self.entities.get(name, {})
        related = [r for r in self.relations 
                   if r["subject"] == name or r["object"] == name]
        return {
            "entity": entity,
            "relations": related
        }
    
    def to_prompt(self, entity_name: str) -> str:
        info = self.query_entity(entity_name)
        lines = [f"关于 {entity_name} 的记忆："]
        lines.append(f"类型：{info['entity'].get('type', '未知')}")
        for r in info["relations"]:
            lines.append(f"- {r['subject']} {r['relation']} {r['object']}")
        return "\n".join(lines)

# 使用
kg = KnowledgeGraphMemory()
kg.add_entity("张三", "用户", {"技能": "Java", "级别": "高级"})
kg.add_entity("融资担保系统", "项目")
kg.add_relation("张三", "负责", "融资担保系统")
kg.add_relation("融资担保系统", "使用", "Spring Cloud")

print(kg.to_prompt("张三"))
# 关于 张三 的记忆：
# 类型：用户
# - 张三 负责 融资担保系统
# - 融资担保系统 使用 Spring Cloud
```

---

## 五、记忆管理策略

### 5.1 记忆写入：什么值得记

```python
class MemoryManager:
    def __init__(self, llm, long_term_memory):
        self.llm = llm
        self.ltm = long_term_memory
    
    async def process_turn(self, user_input: str, assistant_reply: str):
        """每轮对话后判断是否需要存储记忆"""
        prompt = f"""分析以下对话，提取值得长期记忆的信息。
        只提取重要信息（用户偏好、事实、决策），忽略闲聊。
        
        对话：
        用户：{user_input}
        助手：{assistant_reply}
        
        值得记忆的信息（JSON格式，没有则返回空数组）：
        [{{"type": "profile|fact|preference", "content": "..."}}]
        """
        result = self.llm.generate(prompt)
        memories = parse_json(result)
        
        for mem in memories:
            if mem["type"] == "profile":
                self.ltm.update_profile(mem["content"])
            elif mem["type"] == "fact":
                self.ltm.add_fact(mem["content"])
            elif mem["type"] == "preference":
                self.ltm.remember(mem["content"], {"type": "preference"})
```

### 5.2 记忆检索：什么时候召回

```python
class MemoryRetriever:
    def __init__(self, long_term_memory, llm):
        self.ltm = long_term_memory
        self.llm = llm
    
    async def get_relevant_memories(self, user_input: str) -> str:
        """检索与当前输入相关的记忆"""
        # 1. 向量检索相关记忆
        vector_results = self.ltm.recall(user_input, top_k=3)
        
        # 2. 结构化记忆直接获取
        profile = self.ltm.get_profile_context()
        
        # 3. 组合
        context_parts = []
        if profile:
            context_parts.append(f"[用户信息]\n{profile}")
        if vector_results:
            memory_text = "\n".join([f"- {m}" for m in vector_results])
            context_parts.append(f"[相关记忆]\n{memory_text}")
        
        return "\n\n".join(context_parts) if context_parts else ""
    
    async def build_prompt(self, user_input: str, short_term: str) -> str:
        memories = await self.get_relevant_memories(user_input)
        
        prompt_parts = []
        if memories:
            prompt_parts.append(memories)
        if short_term:
            prompt_parts.append(f"[对话历史]\n{short_term}")
        prompt_parts.append(f"[当前输入]\n{user_input}")
        
        return "\n\n".join(prompt_parts)
```

### 5.3 记忆衰减与遗忘

```python
import time

class MemoryDecay:
    """模拟人类遗忘曲线"""
    def __init__(self, half_life_hours: float = 168):  # 默认半衰期 7 天
        self.half_life = half_life_hours * 3600
    
    def get_weight(self, memory: dict) -> float:
        """计算记忆权重"""
        age = time.time() - memory.get("timestamp", time.time())
        access_count = memory.get("access_count", 0)
        
        # 时间衰减
        time_weight = 0.5 ** (age / self.half_life)
        
        # 访问增强（越常被访问，衰减越慢）
        access_boost = min(1 + access_count * 0.1, 3.0)
        
        return time_weight * access_boost
    
    def should_forget(self, memory: dict, threshold: float = 0.1) -> bool:
        return self.get_weight(memory) < threshold
```

---

## 六、LangChain 记忆模块

### 6.1 LangChain 内置记忆

```python
from langchain.memory import (
    ConversationBufferMemory,
    ConversationBufferWindowMemory,
    ConversationSummaryMemory,
    ConversationSummaryBufferMemory,
    VectorStoreRetrieverMemory
)
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 1. 简单 Buffer
memory = ConversationBufferMemory()

# 2. 窗口记忆（最近 K 轮）
memory = ConversationBufferWindowMemory(k=5)

# 3. 摘要记忆
memory = ConversationSummaryMemory(llm=llm)

# 4. 摘要 + Buffer（推荐）
memory = ConversationSummaryBufferMemory(
    llm=llm,
    max_token_count=2000  # 超过 2000 token 的部分做摘要
)

# 5. 向量检索记忆
vectorstore = Chroma(embedding_function=OpenAIEmbeddings())
memory = VectorStoreRetrieverMemory(retriever=vectorstore.as_retriever())

# 使用
memory.save_context(
    {"input": "我叫张三"},
    {"output": "你好，张三！"}
)
memory.load_memory_variables({"input": "我叫什么名字？"})
# {'history': 'Human: 我叫张三\nAI: 你好，张三！'}
```

### 6.2 自定义记忆类

```python
from langchain.memory.chat_memory import BaseChatMemory

class HybridMemory(BaseChatMemory):
    """短期 Buffer + 长期向量 + 结构化"""
    
    def __init__(self, llm, embedding_model, max_messages=10):
        super().__init__()
        self.llm = llm
        self.short_term = deque(maxlen=max_messages)
        self.vector_memory = VectorLongTermMemory(embedding_model)
        self.structured = StructuredMemory()
    
    def save_context(self, inputs, outputs):
        user_input = inputs.get("input", "")
        ai_output = outputs.get("output", "")
        
        # 存入短期记忆
        self.short_term.append({"role": "human", "content": user_input})
        self.short_term.append({"role": "ai", "content": ai_output})
        
        # 异步提取并存储长期记忆
        self._extract_and_store(user_input, ai_output)
    
    def load_memory_variables(self, inputs):
        user_input = inputs.get("input", "")
        
        # 短期记忆
        recent = list(self.short_term)
        
        # 长期记忆检索
        long_term = self.vector_memory.recall(user_input, top_k=3)
        
        # 结构化记忆
        profile = self.structured.get_context()
        
        return {
            "recent_history": self._format(recent),
            "long_term_memory": "\n".join(long_term),
            "user_profile": profile
        }
```

---

## 七、生产环境实践

### 7.1 记忆存储分层

```
热记忆（Redis）：
  - 最近 24h 对话
  - 当前用户画像
  - TTL: 24h
  
温记忆（PostgreSQL）：
  - 30天内的对话摘要
  - 结构化记忆
  - 索引：user_id + created_at

冷记忆（向量数据库）：
  - 全部历史记忆
  - 向量检索
  - 永久存储
```

### 7.2 多用户记忆隔离

```python
class UserMemoryManager:
    def __init__(self):
        self.memories = {}  # user_id → Memory
    
    def get_memory(self, user_id: str) -> 'Memory':
        if user_id not in self.memories:
            self.memories[user_id] = self._create_memory(user_id)
        return self.memories[user_id]
    
    def _create_memory(self, user_id: str):
        # 每个用户独立的记忆空间
        return HybridMemory(
            short_term=BufferMemory(max_messages=10),
            long_term=VectorLongTermMemory(
                collection=f"user_{user_id}"
            ),
            structured=StructuredMemory()
        )
```

---

## 八、面试要点

### Q：Agent 的记忆系统怎么设计？

三层记忆：
1. 短期记忆：对话历史，用 Buffer/Summary 管理，控制在 token 限制内
2. 长期记忆：向量数据库存储，按语义检索
3. 结构化记忆：用户画像、偏好等，用 KV 存储直接查询

写入时：LLM 提取值得记忆的信息，存入长期记忆。读取时：向量检索 + 结构化查询，组合注入 Prompt。

### Q：如何解决长期记忆的成本问题？

1. 分层存储：热记忆 Redis、温记忆 PG、冷记忆向量库
2. 摘要压缩：旧对话先摘要再存储
3. 遗忘机制：基于时间衰减 + 访问频率，低权重记忆定期清理
4. 按需检索：不是每次都检索全部记忆，根据当前查询相关性检索

### Q：LangChain 的记忆模块有哪些？

Buffer（全量）、Window（窗口）、Summary（摘要）、SummaryBuffer（混合）、VectorStoreRetriever（向量检索）、EntityMemory（实体记忆）。生产推荐 SummaryBuffer + VectorStore 组合。

---

## 九、总结

Agent 记忆三层架构：

1. **短期记忆**：滑动窗口 + 摘要，管理对话上下文
2. **长期记忆**：向量数据库，语义检索历史信息
3. **结构化记忆**：用户画像和事实，直接查询

记住：**短期记忆用 Buffer，长期记忆用向量库，结构化记忆用 KV，记忆管理要遗忘机制**。
