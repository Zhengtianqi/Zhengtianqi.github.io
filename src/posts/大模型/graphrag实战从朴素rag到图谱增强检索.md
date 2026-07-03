---
title: "GraphRAG 实战：从朴素 RAG 到图谱增强检索的跃迁"
tag: ["GraphRAG", "知识图谱", "RAG", "微软", "图增强检索", "实体抽取"]
category: 大模型
date: 2026-07-03
---

# GraphRAG 实战：从朴素 RAG 到图谱增强检索的跃迁

> "朴素 RAG 像是在一堆散落的纸条中找答案，GraphRAG 则是先看完目录和索引，再精准定位。"

## 引言：朴素 RAG 的天花板

传统 RAG（Retrieval-Augmented Generation）的流程很简单：把文档切块 → 向量化 → 检索 Top-K → 喂给 LLM 生成答案。这个方案在简单问答上效果不错，但在复杂场景下有明显局限。

### 朴素 RAG 的三大局限

```
┌──────────────────────────────────────────────────────┐
│              朴素 RAG 的三大局限                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  局限 1：全局理解缺失                                 │
│  ─────────────────                                   │
│  问题："这部小说的主要主题是什么？"                    │
│  朴素 RAG：检索到几个片段，无法概括全书主题            │
│  原因：chunk 级检索丢失了全局视角                     │
│                                                      │
│  局限 2：多跳推理弱                                   │
│  ─────────────────                                   │
│  问题："A 公司的 CEO 毕业于哪所大学？"                 │
│  朴素 RAG：可能只检索到 A 公司的介绍，或 CEO 的名字    │
│  原因：答案需要 A 公司 → CEO → 教育背景，多跳推理      │
│                                                      │
│  局限 3：关系理解差                                   │
│  ─────────────────                                   │
│  问题："张三和李四是什么关系？"                        │
│  朴素 RAG：可能找到张三和李四各自的描述，但找不到关系   │
│  原因：关系信息分散在不同文档中                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 一个具体例子

假设我们有以下文档：

```
文档 1: "张三是 ABC 公司的技术总监，负责 AI 平台架构。"
文档 2: "李四是 ABC 公司的 CTO，统筹技术战略。"
文档 3: "ABC 公司去年收购了 XYZ 科技，XYZ 的核心团队加入了 ABC。"
文档 4: "王五原是 XYZ 科技的创始人，现在在 ABC 负责 AI 平台。"
```

问题：**"张三和王五是什么关系？"**

朴素 RAG 可能只检索到文档 1 和文档 4，但无法建立"张三负责 AI 平台 → 王五也在 AI 平台 → 他们是同事/上下级"这个推理链。

GraphRAG 通过构建知识图谱，将实体和关系显式建模，就能轻松回答这类问题。

## 一、GraphRAG 架构全解

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    GraphRAG 完整架构                          │
│                                                             │
│  ┌──────────┐                                               │
│  │ 原始文档  │                                               │
│  └────┬─────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ 文档分块      │───►│ 实体抽取      │                      │
│  │ (Text Split) │    │ (NER + LLM)  │                      │
│  └──────────────┘    └──────┬───────┘                      │
│                              │                              │
│                              ▼                              │
│                      ┌──────────────┐                      │
│                      │ 关系抽取      │                      │
│                      │ (RE + LLM)   │                      │
│                      └──────┬───────┘                      │
│                              │                              │
│                              ▼                              │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ 向量索引      │◄───│ 知识图谱      │                      │
│  │ (Embedding)  │    │ (Nodes+Edges)│                      │
│  └──────┬───────┘    └──────┬───────┘                      │
│         │                   │                               │
│         │     ┌─────────────┘                               │
│         │     │                                              │
│         ▼     ▼                                              │
│  ┌──────────────────┐                                       │
│  │ 社区发现          │                                       │
│  │ (Community Det.)  │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │ 社区摘要生成      │                                       │
│  │ (LLM Summary)    │                                       │
│  └────────┬─────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────┐                       │
│  │         查询时                    │                       │
│  │  ┌────────┐   ┌────────┐         │                       │
│  │  │全局查询 │   │局部查询 │         │                       │
│  │  │(社区匹配)│   │(向量+图)│         │                       │
│  │  └────────┘   └────────┘         │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念

**实体（Entity/Node）**：文档中提到的具体对象，如人名、机构、地点、概念等。

**关系（Relationship/Edge）**：实体之间的关联，如"工作于"、"毕业于"、"收购了"。

**社区（Community）**：通过图聚类算法发现的实体群组，同一社区内的实体关系紧密。例如"ABC 公司技术团队"社区包含张三、李四、王五等。

**社区摘要（Community Summary）**：LLM 为每个社区生成的自然语言摘要，提供全局视角。

## 二、实体抽取：从文本到图谱

### 2.1 实体抽取方法

GraphRAG 使用 LLM 进行实体和关系抽取，相比传统 NER 方法更灵活：

```python
"""
使用 LLM 进行实体和关系抽取
"""
import json
from openai import OpenAI

client = OpenAI()

ENTITY_EXTRACTION_PROMPT = """你是一个信息抽取专家。请从以下文本中抽取实体和关系。

文本：
{text}

抽取要求：
1. 识别所有重要实体（人名、机构、地点、概念等）
2. 识别实体之间的关系
3. 为每个实体提供简短描述

输出 JSON 格式：
{{
  "entities": [
    {{
      "name": "实体名称",
      "type": "PERSON|ORGANIZATION|LOCATION|CONCEPT|EVENT",
      "description": "实体描述"
    }}
  ],
  "relationships": [
    {{
      "source": "源实体名称",
      "target": "目标实体名称",
      "type": "关系类型（如：工作于、毕业于、收购了）",
      "description": "关系描述",
      "strength": 0.0-1.0  # 关系强度
    }}
  ]
}}

只输出 JSON，不要其他文字。"""

def extract_entities_and_relations(text_chunk: str) -> dict:
    """从文本块中抽取实体和关系"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是一个信息抽取专家，只输出 JSON。"},
            {"role": "user", "content": ENTITY_EXTRACTION_PROMPT.format(text=text_chunk)}
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )
    return json.loads(response.choices[0].message.content)


# 示例
text = """
张三是 ABC 公司的技术总监，负责 AI 平台架构。
他之前在 DEF 实验室工作，研究方向是大语言模型。
李四是 ABC 公司的 CTO，统筹技术战略，是张三的直接上级。
ABC 公司去年收购了 XYZ 科技，XYZ 的核心团队加入了 ABC。
王五原是 XYZ 科技的创始人，现在在 ABC 负责 AI 平台，向张三汇报。
"""

result = extract_entities_and_relations(text)
print(json.dumps(result, ensure_ascii=False, indent=2))
```

输出示例：
```json
{
  "entities": [
    {"name": "张三", "type": "PERSON", "description": "ABC公司技术总监，负责AI平台架构"},
    {"name": "李四", "type": "PERSON", "description": "ABC公司CTO，统筹技术战略"},
    {"name": "王五", "type": "PERSON", "description": "XYZ科技创始人，现ABC负责AI平台"},
    {"name": "ABC公司", "type": "ORGANIZATION", "description": "收购了XYZ科技的公司"},
    {"name": "DEF实验室", "type": "ORGANIZATION", "description": "张三之前工作的研究机构"},
    {"name": "XYZ科技", "type": "ORGANIZATION", "description": "被ABC收购的公司"}
  ],
  "relationships": [
    {"source": "张三", "target": "ABC公司", "type": "工作于", "description": "技术总监", "strength": 0.9},
    {"source": "张三", "target": "DEF实验室", "type": "曾工作于", "description": "研究大语言模型", "strength": 0.7},
    {"source": "李四", "target": "ABC公司", "type": "工作于", "description": "CTO", "strength": 0.9},
    {"source": "李四", "target": "张三", "type": "上级", "description": "张三的直接上级", "strength": 0.8},
    {"source": "ABC公司", "target": "XYZ科技", "type": "收购了", "description": "去年收购", "strength": 0.9},
    {"source": "王五", "target": "XYZ科技", "type": "创立", "description": "创始人", "strength": 0.9},
    {"source": "王五", "target": "ABC公司", "type": "工作于", "description": "负责AI平台", "strength": 0.9},
    {"source": "王五", "target": "张三", "type": "汇报给", "description": "向张三汇报", "strength": 0.8}
  ]
}
```

### 2.2 构建知识图谱

```python
"""
将抽取的实体和关系构建为知识图谱
使用 networkx 进行图操作
"""
import networkx as nx
from typing import List, Dict

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.Graph()

    def add_entities(self, entities: List[Dict]):
        """添加实体节点"""
        for entity in entities:
            self.graph.add_node(
                entity["name"],
                type=entity["type"],
                description=entity["description"]
            )

    def add_relationships(self, relationships: List[Dict]):
        """添加关系边"""
        for rel in relationships:
            if rel["source"] in self.graph and rel["target"] in self.graph:
                self.graph.add_edge(
                    rel["source"],
                    rel["target"],
                    type=rel["type"],
                    description=rel["description"],
                    weight=rel.get("strength", 0.5)
                )

    def get_neighbors(self, entity_name: str, hops: int = 2) -> List[str]:
        """获取 N 跳邻居"""
        if entity_name not in self.graph:
            return []
        return list(nx.single_source_shortest_path_length(
            self.graph, entity_name, cutoff=hops
        ).keys())

    def get_community(self, entity_name: str) -> int:
        """获取实体所属社区"""
        communities = nx.community.louvain_communities(self.graph)
        for i, comm in enumerate(communities):
            if entity_name in comm:
                return i
        return -1

    def shortest_path(self, source: str, target: str) -> List[str]:
        """获取两个实体间的最短路径"""
        try:
            return nx.shortest_path(self.graph, source, target)
        except nx.NetworkXNoPath:
            return []

    def visualize_text(self):
        """文本方式可视化图谱"""
        lines = ["=== 知识图谱 ===\n"]
        lines.append(f"节点数: {self.graph.number_of_nodes()}")
        lines.append(f"边数: {self.graph.number_of_edges()}\n")

        lines.append("--- 节点 ---")
        for node, data in self.graph.nodes(data=True):
            lines.append(f"  [{data.get('type', 'UNKNOWN')}] {node}: {data.get('description', '')}")

        lines.append("\n--- 边 ---")
        for u, v, data in self.graph.edges(data=True):
            lines.append(f"  {u} --[{data.get('type', '')}]--> {v}")

        return "\n".join(lines)


# 使用示例
kg = KnowledgeGraph()
kg.add_entities(result["entities"])
kg.add_relationships(result["relationships"])

# 查询张三和王五的关系路径
path = kg.shortest_path("张三", "王五")
print(f"张三 → 王五 路径: {path}")
# 输出: ['张三', 'ABC公司', '王五'] 或 ['张三', '王五']

# 查询张三的 2 跳邻居
neighbors = kg.get_neighbors("张三", hops=2)
print(f"张三的 2 跳邻居: {neighbors}")
```

## 三、社区发现与摘要

### 3.1 社区发现算法

GraphRAG 使用层次化聚类将知识图谱划分为社区：

```
┌─────────────────────────────────────────────┐
│           层次化社区发现                      │
│                                             │
│  Level 0 (最细):                            │
│  ┌───┐ ┌───┐   ┌───┐ ┌───┐               │
│  │ A │ │ B │   │ C │ │ D │  ...           │
│  └─┬─┘ └─┬─┘   └─┬─┘ └─┬─┘               │
│    └──┬──┘      └──┬──┘                    │
│       │            │                        │
│  Level 1:                                   │
│  ┌───┬───┐    ┌───┬───┐                   │
│  │社区1 │    │社区2 │   ...                │
│  │ A,B  │    │ C,D │                       │
│  └─────┘    └─────┘                        │
│       │            │                        │
│  Level 2 (最粗):                            │
│  ┌─────────────┐                           │
│  │   社区 A     │                           │
│  │ (社区1+社区2)│                           │
│  └─────────────┘                           │
└─────────────────────────────────────────────┘
```

```python
"""
社区发现实现
使用 Louvain 算法进行层次化聚类
"""
import networkx as nx
from typing import Dict, List, Set

class CommunityDetector:
    def __init__(self, graph: nx.Graph):
        self.graph = graph

    def detect_hierarchical(
        self,
        max_levels: int = 3,
        resolution: float = 1.0
    ) -> Dict[int, List[Set[str]]]:
        """
        层次化社区发现
        返回: {level: [community_set1, community_set2, ...]}
        """
        levels = {}
        current_graph = self.graph.copy()

        for level in range(max_levels):
            # Louvain 社区发现
            communities = nx.community.louvain_communities(
                current_graph,
                resolution=resolution * (level + 1)
            )

            if len(communities) <= 1:
                break

            levels[level] = communities

            # 构建下一层的图（社区作为节点）
            new_graph = nx.Graph()
            for i, comm in enumerate(communities):
                new_graph.add_node(f"community_{level}_{i}")

            # 社区间的边
            for u, v, data in current_graph.edges(data=True):
                comm_u = self._find_community(u, communities)
                comm_v = self._find_community(v, communities)
                if comm_u != comm_v:
                    if new_graph.has_edge(comm_u, comm_v):
                        new_graph[comm_u][comm_v]["weight"] += data.get("weight", 1)
                    else:
                        new_graph.add_edge(comm_u, comm_v, weight=data.get("weight", 1))

            current_graph = new_graph

        return levels

    def _find_community(self, node, communities):
        for i, comm in enumerate(communities):
            if node in comm:
                return f"community_{i}"
        return None
```

### 3.2 社区摘要生成

```python
"""
为每个社区生成 LLM 摘要
"""
from openai import OpenAI

client = OpenAI()

COMMUNITY_SUMMARY_PROMPT = """你是一个知识图谱分析专家。以下是一个知识图谱社区中的实体和关系信息。
请生成一段简洁的摘要，描述这个社区的核心主题和关键信息。

社区实体：
{entities}

社区关系：
{relationships}

要求：
1. 摘要长度 100-300 字
2. 突出核心主题
3. 包含关键实体和关系
4. 用自然语言描述

摘要："""

def generate_community_summary(
    community_nodes: List[Dict],
    community_edges: List[Dict]
) -> str:
    """为社区生成摘要"""
    entities_text = "\n".join([
        f"- [{e['type']}] {e['name']}: {e['description']}"
        for e in community_nodes
    ])

    relationships_text = "\n".join([
        f"- {r['source']} --[{r['type']}]--> {r['target']}: {r['description']}"
        for r in community_edges
    ])

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": COMMUNITY_SUMMARY_PROMPT.format(
                entities=entities_text,
                relationships=relationships_text
            )}
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content


# 示例：为"ABC公司技术团队"社区生成摘要
community_entities = [
    {"name": "张三", "type": "PERSON", "description": "技术总监，负责AI平台"},
    {"name": "李四", "type": "PERSON", "description": "CTO，统筹技术战略"},
    {"name": "王五", "type": "PERSON", "description": "原XYZ创始人，现负责AI平台"},
    {"name": "ABC公司", "type": "ORGANIZATION", "description": "收购了XYZ科技"},
]

community_relations = [
    {"source": "张三", "target": "ABC公司", "type": "工作于", "description": "技术总监"},
    {"source": "李四", "target": "ABC公司", "type": "工作于", "description": "CTO"},
    {"source": "李四", "target": "张三", "type": "上级", "description": "直接上级"},
    {"source": "王五", "target": "ABC公司", "type": "工作于", "description": "AI平台负责人"},
    {"source": "王五", "target": "张三", "type": "汇报给", "description": "向张三汇报"},
]

summary = generate_community_summary(community_entities, community_relations)
print(summary)
# 输出示例：
# "ABC公司技术团队由CTO李四领导，下设技术总监张三负责AI平台架构。
# 王五（原XYZ科技创始人，随收购加入ABC）也在AI平台工作，向张三汇报。
# 该团队核心聚焦AI技术方向，管理层次清晰：李四 → 张三 → 王五。"
```

## 四、查询策略：全局 vs 局部

GraphRAG 支持两种查询模式，分别解决不同类型的问题：

```
┌─────────────────────────────────────────────────────────┐
│                 GraphRAG 查询模式                         │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   全局查询         │    │   局部查询         │          │
│  │  (Global Search)  │    │  (Local Search)   │          │
│  ├──────────────────┤    ├──────────────────┤          │
│  │ 适合：全局性问题   │    │ 适合：具体问题     │          │
│  │ "文档的主要主题"  │    │ "张三的职位"      │          │
│  │ "有哪些关键人物"  │    │ "ABC收购了谁"     │          │
│  ├──────────────────┤    ├──────────────────┤          │
│  │ 方法：           │    │ 方法：            │          │
│  │ 1. 搜索社区摘要   │    │ 1. 向量检索相关片段│          │
│  │ 2. LLM 聚合生成   │    │ 2. 图谱扩展上下文  │          │
│  │ 3. 综合多社区信息 │    │ 3. LLM 生成答案   │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 4.1 全局查询实现

```python
"""
全局查询：基于社区摘要回答全局性问题
"""
class GlobalSearchEngine:
    def __init__(self, community_summaries: List[dict], llm_client):
        self.summaries = community_summaries
        self.client = llm_client

    def search(self, query: str, top_k: int = 5) -> str:
        """全局搜索"""

        # 步骤 1: 用 embedding 检索最相关的社区摘要
        relevant_communities = self._retrieve_communities(query, top_k)

        # 步骤 2: 让 LLM 基于多个社区摘要生成综合答案
        context = "\n\n".join([
            f"--- 社区 {c['id']} ---\n{c['summary']}"
            for c in relevant_communities
        ])

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个基于知识图谱社区摘要回答问题的助手。"},
                {"role": "user", "content": f"""基于以下社区摘要回答问题。

社区摘要：
{context}

问题：{query}

请综合多个社区的信息给出全面答案。如果信息不足，请说明。"""}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content

    def _retrieve_communities(self, query: str, top_k: int) -> List[dict]:
        """检索最相关的社区"""
        # 实际实现中使用 embedding 相似度
        # 这里简化为关键词匹配
        scored = []
        for comm in self.summaries:
            score = sum(1 for w in query.split() if w in comm["summary"])
            scored.append((score, comm))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:top_k]]
```

### 4.2 局部查询实现

```python
"""
局部查询：结合向量检索和图谱扩展回答具体问题
"""
class LocalSearchEngine:
    def __init__(self, kg: KnowledgeGraph, vector_store, llm_client):
        self.kg = kg
        self.vector_store = vector_store
        self.client = llm_client

    def search(self, query: str, top_k: int = 5, hops: int = 2) -> str:
        """局部搜索：向量检索 + 图谱扩展"""

        # 步骤 1: 向量检索相关文本块
        chunks = self.vector_store.search(query, top_k=top_k)

        # 步骤 2: 从检索到的文本中识别实体
        entities = self._extract_entities_from_chunks(chunks)

        # 步骤 3: 图谱扩展 —— 获取相关实体的邻居和关系
        expanded_context = self._expand_from_graph(entities, hops=hops)

        # 步骤 4: LLM 生成答案
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "你是一个基于知识图谱和文档回答问题的助手。"},
                {"role": "user", "content": f"""基于以下信息回答问题。

相关文档片段：
{self._format_chunks(chunks)}

知识图谱上下文：
{expanded_context}

问题：{query}

请基于文档和知识图谱信息给出准确答案。"""}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content

    def _extract_entities_from_chunks(self, chunks) -> List[str]:
        """从文本块中识别已知实体"""
        entities = []
        for chunk in chunks:
            for node in self.kg.graph.nodes():
                if node in chunk.text:
                    entities.append(node)
        return list(set(entities))

    def _expand_from_graph(self, entities: List[str], hops: int) -> str:
        """从图谱中扩展上下文"""
        lines = []
        for entity in entities:
            if entity in self.kg.graph:
                # 获取实体信息
                node_data = self.kg.graph.nodes[entity]
                lines.append(f"\n[{node_data.get('type', '')}] {entity}: {node_data.get('description', '')}")

                # 获取关系
                for neighbor in self.kg.graph.neighbors(entity):
                    edge_data = self.kg.graph.edges[entity, neighbor]
                    neighbor_data = self.kg.graph.nodes[neighbor]
                    lines.append(f"  → {neighbor} ({neighbor_data.get('description', '')})")
                    lines.append(f"    关系: {edge_data.get('type', '')} - {edge_data.get('description', '')}")

                # 2 跳邻居
                if hops >= 2:
                    for neighbor in self.kg.graph.neighbors(entity):
                        for neighbor2 in self.kg.graph.neighbors(neighbor):
                            if neighbor2 != entity:
                                edge = self.kg.graph.edges[neighbor, neighbor2]
                                lines.append(f"    →→ {neighbor2} (via {neighbor}, {edge.get('type', '')})")

        return "\n".join(lines)

    def _format_chunks(self, chunks) -> str:
        return "\n\n".join([f"[片段 {i+1}] {c.text}" for i, c in enumerate(chunks)])
```

## 五、微软 GraphRAG 实现解析

### 5.1 微软 GraphRAG 架构

微软在 2024 年开源了 GraphRAG 的完整实现（`microsoft/graphrag`），其核心流程：

```
┌─────────────────────────────────────────────────────┐
│            微软 GraphRAG 管线                        │
│                                                     │
│  Input → Document Chunking → Entity Extraction     │
│        → Graph Construction → Community Detection   │
│        → Community Summarization → Query Engine     │
│                                                     │
│  两种查询模式：                                      │
│  • Global Search: 遍历社区摘要                      │
│  • Local Search: 实体中心检索                       │
└─────────────────────────────────────────────────────┘
```

### 5.2 使用微软 GraphRAG

```python
"""
微软 GraphRAG 使用示例
pip install graphrag
"""

# 步骤 1: 初始化项目
# 在终端运行:
# graphrag init --root ./graphrag_project

# 步骤 2: 配置 settings.yaml
"""
# settings.yaml 核心配置
encoding_model: cl100k_base
skip_workflows: []
llm:
  api_key: ${GRAPHRAG_API_KEY}
  type: openai_chat
  model: gpt-4o-mini
  max_tokens: 4000
  temperature: 0
  requests_per_minute: 50
  concurrent_requests: 25

embeddings:
  llm:
    api_key: ${GRAPHRAG_API_KEY}
    type: openai_embedding
    model: text-embedding-3-small
    concurrent_requests: 25

chunks:
  size: 1200
  overlap: 100
  group_by_column: id

input:
  type: file
  file_type: text
  base_dir: input

storage:
  type: file
  base_dir: output

cache:
  type: file
  base_dir: cache

community_reports:
  max_length: 2000
  prompt: prompts/community_report.txt

entities:
  max_gleanings: 1
  prompt: prompts/entity_extraction.txt
"""

# 步骤 3: 构建索引
# graphrag index --root ./graphrag_project

# 步骤 4: 查询
import asyncio
from graphrag.query.indexed_lookup import get_entity_summaries
from graphrag.query.structured_search.local_search.mixed_context import (
    build_local_search_context,
)
from graphrag.query.structured_search.global_search.community_context import (
    build_global_search_context,
)

async def global_query(question: str):
    """全局查询"""
    # 加载社区摘要
    context_builder = build_global_search_context(
        community_reports=load_community_reports(),
        entities=load_entities(),
        relationships=load_relationships(),
    )

    # LLM 搜索
    result = await global_search_engine.search(
        query=question,
        context_builder=context_builder,
        max_data=10,  # 使用最多 10 个社区
    )
    return result.response

async def local_query(question: str):
    """局部查询"""
    context_builder = build_local_search_context(
        entities=load_entities(),
        relationships=load_relationships(),
        community_reports=load_community_reports(),
        text_units=load_text_units(),
    )

    result = await local_search_engine.search(
        query=question,
        context_builder=context_builder,
        max_data=20,
    )
    return result.response

# 使用
answer = asyncio.run(global_query("文档的主要主题是什么？"))
answer = asyncio.run(local_query("张三和王五是什么关系？"))
```

## 六、效果对比与成本分析

### 6.1 效果对比

```
┌─────────────────────────────────────────────────────────────┐
│          GraphRAG vs 朴素 RAG 效果对比                       │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   问题类型    │  朴素 RAG     │  GraphRAG    │  提升幅度     │
├──────────────┼──────────────┼──────────────┼───────────────┤
│  事实问答     │  ★★★★☆       │  ★★★★☆      │  持平         │
│  全局摘要     │  ★★☆☆☆       │  ★★★★☆      │  +50%        │
│  多跳推理     │  ★★☆☆☆       │  ★★★★☆      │  +60%        │
│  关系问答     │  ★★☆☆☆       │  ★★★★★      │  +80%        │
│  时间序列     │  ★★★☆☆       │  ★★★☆☆      │  持平         │
│  对比分析     │  ★★☆☆☆       │  ★★★★☆      │  +50%        │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### 6.2 成本分析

```python
"""
GraphRAG 成本估算
"""

# 索引构建成本（一次性）
def estimate_indexing_cost(
    num_documents: int,
    avg_doc_length: int,  # tokens
    entity_extraction_cost_per_chunk: float = 0.002,  # USD per chunk
    community_summary_cost: float = 0.005,
    chunk_size: int = 1200,
):
    """估算索引构建成本"""
    num_chunks = num_documents * (avg_doc_length // chunk_size)

    # 实体抽取成本
    entity_cost = num_chunks * entity_extraction_cost_per_chunk

    # 社区摘要成本
    num_communities = max(10, num_documents // 5)  # 估计社区数
    summary_cost = num_communities * community_summary_cost

    # Embedding 成本
    embedding_cost = num_chunks * 0.0001  # 大约

    total = entity_cost + summary_cost + embedding_cost

    return {
        "num_chunks": num_chunks,
        "num_communities": num_communities,
        "entity_extraction_cost": entity_cost,
        "community_summary_cost": summary_cost,
        "embedding_cost": embedding_cost,
        "total_cost": total,
    }

# 示例：100 篇文档，每篇 5000 tokens
cost = estimate_indexing_cost(100, 5000)
print(f"索引成本估算: ${cost['total_cost']:.2f}")
print(f"  文档块数: {cost['num_chunks']}")
print(f"  社区数: {cost['num_communities']}")
print(f"  实体抽取: ${cost['entity_extraction_cost']:.2f}")
print(f"  社区摘要: ${cost['community_summary_cost']:.2f}")
print(f"  Embedding: ${cost['embedding_cost']:.2f}")

# 查询成本对比
def estimate_query_cost(
    query_type: str,  # "naive_rag" or "graphrag_global" or "graphrag_local"
    num_chunks_retrieved: int = 5,
    num_communities_used: int = 10,
):
    """估算单次查询成本"""
    costs = {
        "naive_rag": num_chunks_retrieved * 500 * 0.00001,  # ~500 tokens per chunk
        "graphrag_global": num_communities_used * 300 * 0.00001,  # ~300 tokens per summary
        "graphrag_local": num_chunks_retrieved * 500 * 0.00001 + 5,  # 向量检索 + 图谱扩展
    }
    return costs.get(query_type, 0)

print(f"\n单次查询成本:")
print(f"  朴素 RAG: ${estimate_query_cost('naive_rag'):.4f}")
print(f"  GraphRAG 全局: ${estimate_query_cost('graphrag_global'):.4f}")
print(f"  GraphRAG 局部: ${estimate_query_cost('graphrag_local'):.4f}")
```

### 6.3 何时该用 GraphRAG

```
┌──────────────────────────────────────────────────┐
│            GraphRAG 适用场景决策                   │
│                                                  │
│  适合 GraphRAG:                                   │
│  ✅ 需要全局性总结的问题                           │
│  ✅ 文档间有复杂关系                               │
│  ✅ 多跳推理需求                                   │
│  ✅ 文档量较大（>100 篇）且有关联                  │
│  ✅ 长期使用的知识库（索引成本可摊销）             │
│                                                  │
│  适合朴素 RAG:                                    │
│  ✅ 简单事实问答                                   │
│  ✅ 文档间无关联                                   │
│  ✅ 文档量小                                       │
│  ✅ 频繁更新的数据（重建索引成本高）               │
│  ✅ 预算有限                                      │
│                                                  │
│  混合策略（推荐）:                                 │
│  ✅ 同时构建向量索引和图谱索引                     │
│  ✅ 简单问题走朴素 RAG                             │
│  ✅ 复杂问题走 GraphRAG                           │
│  ✅ 用路由模型判断问题类型                         │
└──────────────────────────────────────────────────┘
```

## 七、自建 GraphRAG 完整示例

```python
"""
完整的 GraphRAG 实现（简化版）
整合了文档处理 → 实体抽取 → 图谱构建 → 社区发现 → 查询
"""
import json
import networkx as nx
from typing import List, Dict, Optional
from dataclasses import dataclass, field

@dataclass
class TextChunk:
    id: str
    text: str
    source: str

@dataclass
class Entity:
    name: str
    type: str
    description: str

@dataclass
class Relationship:
    source: str
    target: str
    type: str
    description: str
    weight: float = 0.5

@dataclass
class Community:
    id: int
    entities: List[str]
    summary: str = ""

class SimpleGraphRAG:
    """简化版 GraphRAG 实现"""

    def __init__(self, llm_client, embed_model=None):
        self.client = llm_client
        self.embed_model = embed_model
        self.graph = nx.Graph()
        self.chunks: List[TextChunk] = []
        self.communities: List[Community] = []
        self.entity_to_chunks: Dict[str, List[str]] = {}

    def add_documents(self, documents: List[str], chunk_size: int = 1200):
        """添加文档并构建索引"""
        # 1. 分块
        for doc_idx, doc in enumerate(documents):
            for i in range(0, len(doc), chunk_size):
                chunk = TextChunk(
                    id=f"doc{doc_idx}_chunk{i//chunk_size}",
                    text=doc[i:i+chunk_size],
                    source=f"document_{doc_idx}"
                )
                self.chunks.append(chunk)

        # 2. 实体抽取
        for chunk in self.chunks:
            result = self._extract_entities(chunk.text)
            self._add_to_graph(result, chunk.id)

        # 3. 社区发现
        self._detect_communities()

        # 4. 社区摘要
        for community in self.communities:
            community.summary = self._summarize_community(community)

    def _extract_entities(self, text: str) -> dict:
        """LLM 实体抽取"""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": f"从以下文本中抽取实体和关系，输出 JSON，包含 entities 和 relationships 数组：\n\n{text}"
            }],
            response_format={"type": "json_object"},
            temperature=0.0,
        )
        return json.loads(response.choices[0].message.content)

    def _add_to_graph(self, extraction: dict, chunk_id: str):
        """将抽取结果添加到图谱"""
        for ent in extraction.get("entities", []):
            self.graph.add_node(
                ent["name"],
                type=ent.get("type", "UNKNOWN"),
                description=ent.get("description", "")
            )
            if ent["name"] not in self.entity_to_chunks:
                self.entity_to_chunks[ent["name"]] = []
            self.entity_to_chunks[ent["name"]].append(chunk_id)

        for rel in extraction.get("relationships", []):
            if rel["source"] in self.graph and rel["target"] in self.graph:
                self.graph.add_edge(
                    rel["source"], rel["target"],
                    type=rel.get("type", ""),
                    description=rel.get("description", ""),
                    weight=rel.get("strength", 0.5)
                )

    def _detect_communities(self):
        """Louvain 社区发现"""
        if self.graph.number_of_nodes() == 0:
            return
        communities = nx.community.louvain_communities(self.graph)
        self.communities = [
            Community(id=i, entities=list(comm))
            for i, comm in enumerate(communities)
        ]

    def _summarize_community(self, community: Community) -> str:
        """LLM 生成社区摘要"""
        entities_info = []
        for ent_name in community.entities:
            if ent_name in self.graph:
                data = self.graph.nodes[ent_name]
                entities_info.append(f"[{data.get('type','')}] {ent_name}: {data.get('description','')}")

        relations_info = []
        for u, v, d in self.graph.edges(data=True):
            if u in community.entities and v in community.entities:
                relations_info.append(f"{u} --[{d.get('type','')}]--> {v}")

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": f"为以下知识图谱社区生成简短摘要：\n\n实体:\n{chr(10).join(entities_info)}\n\n关系:\n{chr(10).join(relations_info)}"
            }],
            temperature=0.3,
        )
        return response.choices[0].message.content

    def query(self, question: str, mode: str = "auto") -> str:
        """查询"""
        if mode == "auto":
            # 简单路由：全局性问题用 global，具体问题用 local
            global_keywords = ["总结", "概述", "主题", "主要", "所有", "哪些"]
            mode = "global" if any(kw in question for kw in global_keywords) else "local"

        if mode == "global":
            return self._global_query(question)
        else:
            return self._local_query(question)

    def _global_query(self, question: str) -> str:
        """全局查询"""
        # 检索最相关的社区摘要
        relevant = []
        for comm in self.communities:
            score = sum(1 for w in question if w in comm.summary)
            relevant.append((score, comm))
        relevant.sort(key=lambda x: x[0], reverse=True)
        top_communities = [c for _, c in relevant[:5]]

        context = "\n\n".join([f"社区 {c.id}: {c.summary}" for c in top_communities])
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "基于社区摘要回答问题。"},
                {"role": "user", "content": f"社区摘要:\n{context}\n\n问题: {question}"}
            ],
        )
        return response.choices[0].message.content

    def _local_query(self, question: str) -> str:
        """局部查询"""
        # 识别问题中的实体
        related_entities = []
        for node in self.graph.nodes():
            if node in question:
                related_entities.append(node)

        # 构建图谱上下文
        graph_context = []
        for entity in related_entities:
            data = self.graph.nodes[entity]
            graph_context.append(f"[{data.get('type','')}] {entity}: {data.get('description','')}")
            for neighbor in self.graph.neighbors(entity):
                edge = self.graph.edges[entity, neighbor]
                neighbor_data = self.graph.nodes[neighbor]
                graph_context.append(f"  → {neighbor}: {neighbor_data.get('description','')} (关系: {edge.get('type','')})")

        # 找到相关文本块
        related_chunks = []
        for entity in related_entities:
            for chunk_id in self.entity_to_chunks.get(entity, []):
                chunk = next((c for c in self.chunks if c.id == chunk_id), None)
                if chunk:
                    related_chunks.append(chunk.text[:500])

        context = "\n".join(graph_context) + "\n\n" + "\n".join(related_chunks)
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "基于知识图谱和文档回答问题。"},
                {"role": "user", "content": f"上下文:\n{context}\n\n问题: {question}"}
            ],
        )
        return response.choices[0].message.content
```

## 八、面试要点

### Q1：GraphRAG 和朴素 RAG 的核心区别？

**回答**：朴素 RAG 在 chunk 级别做向量检索，丢失了全局视角和实体关系。GraphRAG 额外构建知识图谱，通过实体抽取、关系建模和社区发现，提供了两层能力：(1) 全局查询通过社区摘要回答宏观问题；(2) 局部查询通过图谱扩展实现多跳推理。

### Q2：GraphRAG 的索引成本很高，如何优化？

**回答**：
1. 使用更小的模型做实体抽取（如 GPT-4o-mini 而非 GPT-4o）
2. 增大 chunk size 减少抽取次数
3. 增量索引：只处理新增/变更文档
4. 缓存实体抽取结果，避免重复处理
5. 使用传统 NER（如 spaCy）做初筛，LLM 只处理复杂关系

### Q3：什么场景不适合用 GraphRAG？

**回答**：
1. 文档间无关联的独立内容（如产品评价集合）
2. 数据频繁更新（重建图谱成本高）
3. 简单事实问答（朴素 RAG 足够）
4. 文档量很小（< 50 篇，图谱价值不大）
5. 预算有限的场景

### Q4：社区发现为什么用 Louvain？

**回答**：Louvain 算法通过最大化模块度（Modularity）来发现社区，速度快（近似线性），支持层次化聚类，且不需要预设社区数量。这些特性非常适合 GraphRAG 的场景：文档量大、不知道有多少主题、需要层次化视角。

## 九、避坑指南

### 坑 1：实体抽取的粒度问题

抽取太细 → 图谱过于复杂，噪音多；抽取太粗 → 丢失关键关系。建议：先用小样本测试，人工检查抽取质量，调整 prompt。

### 坑 2：忽略实体消歧

```
# "苹果"可能指水果也可能指公司
# 需要做实体消歧

def disambiguate_entities(entities):
    """简单的实体消歧"""
    for ent in entities:
        if ent["name"] == "苹果":
            # 根据 description 判断
            if "公司" in ent.get("description", "") or "科技" in ent.get("description", ""):
                ent["name"] = "苹果公司"
            else:
                ent["name"] = "苹果(水果)"
    return entities
```

### 坑 3：社区摘要质量不稳定

社区太小时摘要信息不足，社区太大时摘要太笼统。建议控制社区大小在 5-20 个实体之间，通过调整 Louvain 的 resolution 参数控制。

### 坑 4：忘记处理孤立节点

有些实体没有关系边（孤立节点），社区发现会把它们单独成社区。建议过滤掉孤立节点或合并到最近的社区。

### 坑 5：查询路由不准

自动路由（全局 vs 局部）可能误判。建议提供手动模式选择，或用 LLM 做路由判断。

## 总结

GraphRAG 是对朴素 RAG 的重要升级，通过知识图谱补齐了全局理解和多跳推理的短板。它的核心创新：

1. **实体-关系图谱**：显式建模文档中的实体和关系
2. **社区发现**：通过图聚类提供层次化的全局视角
3. **双模查询**：全局查询用社区摘要，局部查询用图谱扩展
4. **成本权衡**：索引成本高但可摊销，适合长期使用的知识库

> **一句话总结**：GraphRAG = 朴素 RAG + 知识图谱 + 社区摘要，用空间换时间，用索引成本换查询质量。
