---
title: Embedding 模型选型与微调：BGE、M3E 与领域适配实践
tag: ["Embedding", "BGE", "向量检索", "RAG", "微调"]
category: 大模型
date: 2026-06-27
---

# Embedding 模型选型与微调：BGE、M3E 与领域适配实践

RAG 效果不好？检索召回率低？大概率是 Embedding 模型没选对或没调好。Embedding 是 RAG 的地基，地基不稳，后面再怎么调 Prompt 都是白费。

---

## 一、Embedding 基础

### 1.1 什么是 Embedding

```
文本 → Embedding 模型 → 向量（如 768 维浮点数组）

"今天天气很好" → [0.12, -0.34, 0.56, ..., 0.78]  (768 维)
"今天气候不错" → [0.11, -0.32, 0.55, ..., 0.77]  (相似度高)
"我想吃火锅"   → [0.89, 0.12, -0.67, ..., 0.03]  (相似度低)

相似度计算：
  余弦相似度：cos(A, B) = (A·B) / (|A| × |B|)
  点积：dot(A, B) = Σ(ai × bi)
  欧氏距离：d(A, B) = √Σ(ai - bi)²
```

### 1.2 Embedding 在 RAG 中的位置

```
用户问题
    │
    ▼
Embedding 模型 → Query 向量
    │
    ▼
向量数据库 → 检索 Top-K 文档（余弦相似度）
    │
    ▼
LLM → 生成回答

Embedding 质量 → 检索召回率 → RAG 效果
如果 Embedding 把不相关的文档召回了，LLM 会被误导
如果 Embedding 漏掉了相关文档，LLM 缺少上下文
```

---

## 二、主流 Embedding 模型对比

### 2.1 模型一览

| 模型 | 维度 | 最大长度 | 中文支持 | 排行榜 | 许可证 |
|------|------|---------|---------|--------|--------|
| BGE-large-zh-v1.5 | 1024 | 512 | ⭐⭐⭐⭐⭐ | MTEB 中文 Top | MIT |
| BGE-M3 | 1024 | 8192 | ⭐⭐⭐⭐⭐ | MTEB Top | MIT |
| M3E-large | 1024 | 512 | ⭐⭐⭐⭐ | MTEB 中文 Top | Apache 2.0 |
| text-embedding-3-large (OpenAI) | 3072 | 8191 | ⭐⭐⭐ | MTEB Top | 商用 API |
| GTE-large-zh | 1024 | 512 | ⭐⭐⭐⭐ | MTEB 高 | Apache 2.0 |
| Jina-embeddings-v3 | 1024 | 8192 | ⭐⭐⭐ | MTEB Top | CC-BY-NC |

### 2.2 选型建议

```
中文场景首选：BGE-large-zh-v1.5 或 BGE-M3
  - BGE-large-zh：512 token，适合短文本，效果好
  - BGE-M3：8192 token，支持长文本，多功能（稠密+稀疏+ColBERT）

长文档场景：BGE-M3（8192 token）
  - 减少 chunk 切分次数
  - 保留更长上下文

英文/多语言：text-embedding-3-large（OpenAI）或 BGE-M3
  - OpenAI 效果好但收费
  - BGE-M3 免费可部署

领域特殊（医疗/法律/金融）：微调 BGE
  - 通用模型在专业领域召回率低
  - 微调后召回率可提升 15-30%
```

### 2.3 BGE-M3 三种向量

```python
# BGE-M3 同时输出三种向量，可混合使用
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

# 编码
embeddings = model.encode(
    ['什么是融资担保？', '融资担保的业务模式'],
    return_dense=True,    # 稠密向量（用于语义检索）
    return_sparse=True,   # 稀疏向量（类似 BM25，关键词匹配）
    return_colbert_vecs=True  # ColBERT 向量（精细交互）
)

# 稠密向量：语义相似度，但可能丢失关键词信息
# 稀疏向量：关键词匹配，但缺少语义理解
# ColBERT：token 级交互，效果最好但计算最贵

# 混合检索（推荐）：
# 1. 稠密向量召回 Top-100
# 2. 稀疏向量召回 Top-100
# 3. 合并去重
# 4. ColBERT 重排 Top-20
# 5. 取 Top-5 给 LLM
```

---

## 三、使用 BGE-large-zh

### 3.1 本地部署

```python
from FlagEmbedding import FlagModel

# 加载模型
model = FlagModel(
    'BAAI/bge-large-zh-v1.5',
    query_instruction_for_retrieval="为这个句子生成表示用于检索相关文章：",
    use_fp16=True
)

# 编码查询
queries = ["融资担保的风险控制措施有哪些？"]
query_embeddings = model.encode_queries(queries)

# 编码文档
documents = [
    "融资担保机构应建立完善的风险评估体系，包括贷前调查、贷中审查、贷后管理。",
    "担保公司的业务模式包括融资担保、非融资担保和再担保。",
    "银行与担保公司合作开展总对总批量担保业务，降低中小企业融资门槛。"
]
doc_embeddings = model.encode(documents)

# 计算相似度
sim_scores = query_embeddings @ doc_embeddings.T
print(sim_scores)
# [[0.85, 0.72, 0.68]]  → 第一个文档最相关
```

### 3.2 通过 sentence-transformers 使用

```python
from sentence_transformers import SentenceTransformer

# BGE 模型
model = SentenceTransformer('BAAI/bge-large-zh-v1.5')

# 编码
embeddings = model.encode([
    "融资担保的风险控制",
    "担保业务风险管理"
])

# 相似度
from sentence_transformers.util import cos_sim
similarity = cos_sim([embeddings[0]], [embeddings[1]])
print(f"相似度: {similarity[0][0]:.4f}")
```

### 3.3 通过 API 部署

```python
# 用 Text Embeddings Inference (TEI) 部署
# docker 启动
# docker run -p 8080:80 -v /data/models:/models \
#   ghcr.io/huggingface/text-embeddings-inference:cpu-1.5 \
#   --model-id BAAI/bge-large-zh-v1.5

import httpx

async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "http://localhost:8080/embed",
            json={"inputs": text}
        )
        return resp.json()[0]
```

---

## 四、领域微调

### 4.1 什么时候需要微调

```
不需要微调：
  - 通用知识问答
  - 开放域对话
  - 新闻、百科类内容

需要微调：
  - 专业领域（医疗、法律、金融、担保）
  - 有大量专有名词和术语
  - 通用模型召回率 < 70%
  - 有标注好的正负样本对
```

### 4.2 数据准备

```python
# 微调数据格式：(query, positive, negative)
# 每条数据包含：查询、相关文档、不相关文档

data = [
    {
        "query": "融资担保的代偿条件是什么？",
        "positive": "当债务人未能按期偿还债务时，担保机构按照约定代为偿还，代偿条件包括债务逾期、催收无效等。",
        "negative": "融资担保的申请流程包括提交申请、审核、签约、放款四个步骤。"
    },
    {
        "query": "再担保的分担比例怎么确定？",
        "positive": "再担保机构与原担保机构按照约定比例分担风险，通常再担保承担20%-40%的责任份额。",
        "negative": "担保费率由担保机构根据项目风险等级确定，一般不超过银行同期贷款利率的50%。"
    }
]

# 数据量建议：
# 最少 500 对，推荐 5000+ 对
# 每条数据 1 个 positive + 1-3 个 negative
# negative 要有挑战性（同领域但不相关的文档）
```

### 4.3 微调 BGE

```python
# 使用 FlagEmbedding 官方微调脚本
# git clone https://github.com/FlagOpen/FlagEmbedding.git

# 准备数据文件 train.jsonl
# {"query": "xxx", "pos": ["xxx"], "neg": ["xxx", "yyy"]}

# 启动微调
# torchrun --nproc_per_node 1 \
#   -m FlagEmbedding.finetune.run \
#   --output_dir ./finetuned_bge \
#   --model_name_or_path BAAI/bge-large-zh-v1.5 \
#   --train_data ./train.jsonl \
#   --learning_rate 5e-6 \
#   --num_train_epochs 3 \
#   --per_device_train_batch_size 32 \
#   --max_query_length 64 \
#   --max_passage_length 256 \
#   --temperature 0.02 \
#   --negatives_cross_device \
#   --use_inbatch_neg
```

### 4.4 LoRA 微调（低成本）

```python
# 用 LoRA 微调，只训练少量参数
from peft import LoraConfig, get_peft_model
from sentence_transformers import SentenceTransformer
import torch

model = SentenceTransformer('BAAI/bge-large-zh-v1.5')

# 冻结基础模型，只训练 LoRA 适配器
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["query", "key", "value"],
    lora_dropout=0.1,
    bias="none",
    task_type="FEATURE_EXTRACTION"
)

# 应用 LoRA
transformer = model[0].auto_model
transformer = get_peft_model(transformer, lora_config)
transformer.print_trainable_parameters()
# trainable params: 1,179,648 || all params: 325,996,544 || trainable%: 0.36%

# 只训练 0.36% 的参数，效果接近全量微调
```

### 4.5 评估微调效果

```python
# 构建评估集
eval_data = [
    {"query": "代偿后如何追偿？", "relevant_doc_id": "doc_001"},
    {"query": "担保费率标准", "relevant_doc_id": "doc_045"},
    # ...
]

# 评估指标
# Recall@K：Top-K 中包含正确文档的比例
# MRR（Mean Reciprocal Rank）：正确文档排名倒数的均值
# NDCG@K：考虑排名位置的归一化折扣累积增益

def evaluate(model, eval_data, corpus, k=5):
    recall = 0
    mrr = 0
    for item in eval_data:
        query_emb = model.encode([item["query"]])
        doc_embs = model.encode(corpus)
        scores = query_emb @ doc_embs.T
        top_k_idx = scores.argsort()[0][-k:][::-1]
        
        if item["relevant_doc_id"] in [corpus[i]["id"] for i in top_k_idx]:
            recall += 1
            rank = list(top_k_idx).index(
                [i for i, c in enumerate(corpus) if c["id"] == item["relevant_doc_id"]][0]
            ) + 1
            mrr += 1 / rank
    
    return {
        f"Recall@{k}": recall / len(eval_data),
        "MRR": mrr / len(eval_data)
    }
```

---

## 五、向量维度与量化

### 5.1 降维

```python
# BGE-large: 1024 维
# 有些场景不需要这么高维度，可以降维减少存储

# 方法 1：PCA 降维
from sklearn.decomposition import PCA
pca = PCA(n_components=256)
reduced_embeddings = pca.fit_transform(embeddings)

# 方法 2：Matryoshka Embedding（俄罗斯套娃）
# text-embedding-3-large 支持
import openai
response = openai.embeddings.create(
    input="融资担保风险控制",
    model="text-embedding-3-large",
    dimensions=256  # 直接输出 256 维
)
# 前 256 维就包含了大部分信息
```

### 5.2 量化

```python
# FP32 → INT8 量化，存储减少 75%
import numpy as np

def quantize_to_int8(embeddings: np.ndarray) -> tuple[np.ndarray, float, float]:
    """量化到 INT8"""
    scale = np.max(np.abs(embeddings)) / 127
    quantized = np.round(embeddings / scale).astype(np.int8)
    return quantized, scale

def dequantize(quantized: np.ndarray, scale: float) -> np.ndarray:
    return quantized * scale

# 原始：1024 维 × 4 字节(FP32) = 4096 字节/条
# 量化后：1024 维 × 1 字节(INT8) = 1024 字节/条
# 存储减少 75%，检索速度几乎不变
```

---

## 六、RAG 中的 Embedding 最佳实践

### 6.1 Chunk 策略

```python
# Chunk 大小影响检索质量
# 太小：语义不完整
# 太大：包含无关信息，稀释相似度

# 推荐 chunk 配置
chunk_config = {
    "chunk_size": 500,        # 每块约 500 字符
    "chunk_overlap": 50,      # 重叠 50 字符，避免切断语义
    "separator": "\n\n",      # 按段落切分
}

# 对于 BGE-M3（8192 token），可以加大 chunk
chunk_config_m3 = {
    "chunk_size": 2000,
    "chunk_overlap": 200,
}
```

### 6.2 Query 改写

```python
# 用户查询可能太短或口语化，先改写再 Embedding
# 例："代偿" → "融资担保代偿的条件和流程"

# 用 LLM 改写
def rewrite_query(query: str, llm) -> str:
    prompt = f"""请将以下用户查询改写为更适合检索的形式，保留原意，补充关键词：
    原始查询：{query}
    改写后："""
    return llm.generate(prompt)

# 效果：
# "代偿" → "融资担保代偿条件 代偿流程 代偿后追偿"
# 检索召回率提升 20%+
```

### 6.3 混合检索

```python
# 稠密向量（语义） + 稀疏向量（关键词） + BM25
# 三路召回 + RRF 融合

def hybrid_search(query: str, top_k: int = 10):
    # 1. 稠密向量检索
    dense_results = vector_db.search(query, top_k=50)
    
    # 2. BM25 检索
    bm25_results = bm25_db.search(query, top_k=50)
    
    # 3. RRF 融合排序
    rrf_score = {}
    for rank, doc in enumerate(dense_results):
        rrf_score[doc.id] = rrf_score.get(doc.id, 0) + 1 / (rank + 1)
    for rank, doc in enumerate(bm25_results):
        rrf_score[doc.id] = rrf_score.get(doc.id, 0) + 1 / (rank + 1)
    
    # 排序取 Top-K
    sorted_docs = sorted(rrf_score.items(), key=lambda x: -x[1])[:top_k]
    return sorted_docs
```

---

## 七、面试要点

### Q：BGE 和 OpenAI text-embedding-3 怎么选？

BGE 优势：免费、可本地部署、中文效果好、可微调。OpenAI 优势：多语言、API 简单、无需运维。中文场景 + 有 GPU → BGE；英文/多语言 + 快速上线 → OpenAI。

### Q：为什么 RAG 中 Embedding 比 reranker 更重要？

Embedding 决定了"能不能召回"，reranker 决定了"召回后排得对不对"。如果 Embedding 召回不到相关文档，reranker 再好也没用。Embedding 是地基，必须先选好/调好。

### Q：如何评估 Embedding 模型效果？

构建评估集（query + relevant_doc），用 Recall@K（K=1,5,10）、MRR、NDCG 评估。一般 Recall@5 > 80% 是合格线。微调后提升 10%+ 才值得微调。

---

## 八、总结

Embedding 选型三步法：

1. **选模型**：中文用 BGE-large-zh 或 BGE-M3，多语言用 OpenAI
2. **评估效果**：构建领域评估集，测 Recall@5，低于 70% 考虑微调
3. **混合检索**：稠密 + 稀疏 + BM25 三路召回 + RRF 融合

记住：**Embedding 是 RAG 地基，选对模型 + 微调领域数据 + 混合检索 = 高召回率**。
