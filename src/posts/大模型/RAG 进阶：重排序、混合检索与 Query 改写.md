---
title: RAG 进阶：重排序、混合检索与 Query 改写
tag: ["RAG", "大模型", "检索增强"]
category: 大模型
date: 2026-06-27
---

# RAG 进阶：重排序、混合检索与 Query 改写

> 大语言模型是AI领域的革命性技术，它为自然语言处理和智能应用提供了强大的能力。
> 本文介绍了大模型的核心概念和应用方式，帮助你进入AI应用开发领域。

基础 RAG 的痛点：**检索到的不相关，相关检索不到，大模型还是幻觉**。本文覆盖企业级 RAG 的三大进阶优化技术。

## 一、基础 RAG 的问题

```
用户问："担保业务的反担保措施有哪些？"
基础 RAG 检索结果：
  1. 担保公司简介（不相关）
  2. 反担保措施管理办法（相关但只是概述）
  3. 担保费率标准（不相关）

大模型基于这些"噪声"生成的答案 → 幻觉
```

三个核心问题：
1. **检索精度低**：向量检索只看语义相似，不看关键词匹配
2. **排序不准**：Top-K 里最相关的不在前面
3. **Query 质量差**：用户问法多变，原始 Query 不适合直接检索

## 二、Query 改写（检索前的优化）

### 2.1 为什么需要改写 Query

```
用户输入："怎么申请"
→ 太模糊，向量检索召回大量"怎么申请贷款/信用卡/退款"等无关内容

改写后："担保业务授信申请流程"
→ 精准命中知识库
```

### 2.2 五种 Query 改写策略

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 策略1：Query 扩展（HyDE - 假设性文档嵌入）
# 让大模型先生成一个假设性答案，用答案去检索
hyde_prompt = ChatPromptTemplate.from_template("""
根据以下问题，生成一段可能的答案文档（200字以内），用于后续检索：
问题：{question}
假设答案：
""")
hyde_chain = hyde_prompt | llm
hyde_doc = hyde_chain.invoke({"question": "担保业务流程"})
# 用 hyde_doc 的内容去向量检索，比原始问题效果好

# 策略2：Query 分解（多子查询）
# 把复杂问题拆成多个子问题，分别检索
decompose_prompt = ChatPromptTemplate.from_template("""
将以下复杂问题分解为 2-3 个独立的子问题：
问题：{question}
子问题（JSON数组）：
""")
# "担保业务的流程和风险控制措施" 
# → ["担保业务流程是什么", "担保业务有哪些风险控制措施"]

# 策略3：Query 改写（同义改写）
rewrite_prompt = ChatPromptTemplate.from_template("""
将以下问题改写为更适合检索的形式，保留核心语义：
原问题：{question}
改写后：
""")
# "怎么搞担保" → "融资担保业务申请流程和条件"

# 策略4：Step-back Prompting（后退一步）
# 把具体问题泛化为更通用的背景问题
stepback_prompt = ChatPromptTemplate.from_template("""
将以下具体问题，提取一个更通用的背景问题：
具体问题：{question}
背景问题：
""")
# "融资担保费率是多少" → "融资担保的收费标准是什么"

# 策略5：多路 Query（Multi-Query）
# 生成多个不同角度的检索 Query
multi_query_prompt = ChatPromptTemplate.from_template("""
针对以下问题，从不同角度生成 3 个检索查询：
问题：{question}
查询列表（JSON数组）：
""")
```

### 2.3 实战：多路 Query + 合并检索

```python
from langchain.retrievers import MultiQueryRetriever
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# 初始化向量库
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-zh-v1.5")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

# 使用 MultiQueryRetriever 自动生成多路查询
retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    llm=llm,
)
# 内部会自动生成 3 个不同角度的 Query，分别检索 top-5，去重合并

docs = retriever.invoke("担保业务流程")
# 返回去重后的 top-K 文档，召回率提升 30%+
```

## 三、混合检索（Hybrid Search）

### 3.1 为什么需要混合检索

```
纯向量检索：擅长语义匹配，但漏掉精确关键词
  Query: "RFC 7231" → 向量检索可能返回 "HTTP 协议" 相关文档，但漏掉精确包含 "RFC 7231" 的文档

纯关键词检索（BM25）：擅长精确匹配，但不懂同义/近义
  Query: "担保流程" → BM25 只匹配包含"担保流程"的文档，漏掉"保证手续"等同义表述

混合检索 = 向量 + BM25，取长补短
```

### 3.2 实战：BM25 + 向量混合检索

```python
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma
from langchain.retrievers import EnsembleRetriever

# 1. BM25 关键词检索器
bm25_retriever = BM25Retriever.from_documents(documents)
bm25_retriever.k = 5

# 2. 向量检索器
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 3. 混合检索（加权融合）
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.3, 0.7]  # BM25 权重 0.3，向量权重 0.7
)
# 权重可调：精确匹配场景提高 BM25 权重，语义理解场景提高向量权重

docs = ensemble_retriever.invoke("担保业务反担保措施")
```

### 3.3 RRF（Reciprocal Rank Fusion）算法

```python
# RRF 是比加权融合更科学的排序融合算法
# 公式：RRF_score(d) = Σ 1/(k + rank_i(d))
# k 通常取 60

import numpy as np

def rrf_fusion(result_lists, k=60):
    """
    result_lists: 多路检索结果列表的列表
    返回融合排序后的结果
    """
    scores = {}
    for results in result_lists:
        for rank, doc in enumerate(results, 1):
            if doc.page_content not in scores:
                scores[doc.page_content] = 0
            scores[doc.page_content] += 1.0 / (k + rank)
    
    # 按融合分数排序
    sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_docs

# LangChain 中可用 ContextualCompressionRetriever + RRF
```

## 四、重排序（Reranking）

### 4.1 为什么需要重排序

```
向量检索 Top-5 结果：
  1. 担保业务概述（相似度 0.85，但不直接回答问题）
  2. 反担保措施详解（相似度 0.82，最相关）
  3. 担保费率标准（相似度 0.78，不相关）

问题：向量相似度高 ≠ 回答质量高
解决：用 Cross-Encoder 重排序
```

### 4.2 Bi-Encoder vs Cross-Encoder

| 类型 | 原理 | 速度 | 精度 | 用途 |
|------|------|------|------|------|
| Bi-Encoder | Query 和 Doc 分别编码，算相似度 | 快 | 中 | 初筛（向量检索） |
| Cross-Encoder | Query 和 Doc 拼接后联合编码 | 慢 | 高 | 重排序（精排） |

### 4.3 实战：BGE Reranker

```python
from FlagEmbedding import FlagReranker

# 加载 BGE 重排序模型
reranker = FlagReranker('BAAI/bge-reranker-large', use_fp16=True)

# 对初筛结果重排序
query = "担保业务反担保措施有哪些？"
candidates = [doc.page_content for doc in initial_retrieved_docs]

# Cross-Encoder 打分
pairs = [[query, doc] for doc in candidates]
scores = reranker.compute_score(pairs)

# 按重排分数排序
ranked_results = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
# 取 Top-3 给大模型生成
top_k = ranked_results[:3]
```

### 4.4 完整的检索-重排管线

```python
def rag_pipeline(query, vectorstore, reranker, llm, top_k=3):
    """完整 RAG 管线：多路 Query → 混合检索 → 重排序 → 生成"""
    
    # 1. Query 改写（多路）
    multi_queries = generate_multi_queries(query, llm)
    
    # 2. 混合检索（BM25 + 向量）
    all_results = []
    for q in multi_queries:
        bm25_results = bm25_retriever.invoke(q)
        vector_results = vector_retriever.invoke(q)
        all_results.extend(bm25_results + vector_results)
    
    # 3. 去重
    unique_docs = deduplicate(all_results)
    
    # 4. RRF 融合排序
    fused_docs = rrf_fusion(unique_docs)
    
    # 5. Cross-Encoder 重排序
    pairs = [[query, doc.content] for doc in fused_docs[:20]]  # 初筛 Top-20
    scores = reranker.compute_score(pairs)
    reranked = sorted(zip(fused_docs[:20], scores), key=lambda x: x[1], reverse=True)
    
    # 6. 取 Top-K 构造 Prompt
    context = "\n\n".join([doc.content for doc, _ in reranked[:top_k]])
    
    prompt = f"""基于以下检索结果回答问题：

检索结果：
{context}

问题：{query}

回答："""
    
    answer = llm.invoke(prompt)
    return answer
```

## 五、效果对比

| 方案 | 召回率 | 准确率 | 延迟 |
|------|--------|--------|------|
| 基础 RAG（纯向量） | 65% | 70% | 200ms |
| + Query 改写 | 78% | 75% | 350ms |
| + 混合检索 | 85% | 80% | 400ms |
| + 重排序 | 88% | 92% | 600ms |
| 全部优化 | 92% | 95% | 800ms |

> 延迟增加是值得的——准确率从 70% 提升到 95%，用户体感提升远大于 600ms 的延迟。

## 六、面试要点

### Q：RAG 检索效果不好怎么优化？

1. **Query 优化**：HyDE、多路 Query、Query 分解，提升检索召回率
2. **混合检索**：BM25 + 向量检索，兼顾关键词和语义匹配
3. **重排序**：用 Cross-Encoder 对初筛结果精排，提升 Top-K 准确率
4. **文档切分优化**：合理 Chunk Size、Overlap，避免语义断裂
5. **Embedding 模型**：换用更好的模型如 BGE-M3、bge-large-zh

## 七、总结

RAG 进阶的三大武器：**Query 改写提升召回、混合检索取长补短、重排序提升精度**。

记住：RAG 不是"检索+生成"就完事了，中间每一步都可以优化。生产级 RAG 的标准管线是：多路 Query → 混合检索 → RRF 融合 → Cross-Encoder 重排 → Top-K 生成。
