---
title: 大模型RAG实战全流程详解
tag: ["RAG", "大模型"]
category: 大模型
date: 2026-05-12
---

# 大模型RAG实战全流程详解

> 大语言模型是AI领域的革命性技术，它为自然语言处理和智能应用提供了强大的能力。
> 本文介绍了大模型的核心概念和应用方式，帮助你进入AI应用开发领域。


在大模型落地过程中，我们总会遇到三个核心痛点：幻觉严重（一本正经地编造信息）、知识滞后（无法获取实时/私有数据）、私有数据安全（不能直接将敏感文档喂给公域大模型）。而RAG（Retrieval-Augmented Generation，检索增强生成），正是当前最主流、性价比最高的解决方案——让大模型在回答问题前，先去私有知识库“翻书”，基于检索到的真实信息生成答案，本质上是把大模型的“闭卷考试”变成“开卷考试”。

本文将从原理到实操，手把手带大家完成一次完整的RAG实战，涵盖环境搭建、知识库构建、检索优化、大模型集成全流程，所有代码可直接复制运行，同时结合2026年最新技术趋势，补充企业级优化技巧和避坑方案，适合有基础Python功底、想快速落地RAG应用的开发者。

## 一、RAG核心原理（5分钟看懂，避免实操盲目）

RAG的核心逻辑很简单，分为「离线知识库构建」和「在线问答」两个阶段，全程围绕“检索精准性”和“生成可靠性”展开，具体流程如下：

1. **离线阶段（知识库构建）**：原始文档 → 文档清洗与加载 → 文档切分（Chunking）→ 文本向量化（Embedding）→ 向量存入向量数据库；

2. **在线阶段（问答交互）**：用户提问 → 问题向量化 → 向量数据库检索相似文本（Top-K）→ 拼接Prompt（问题+检索结果）→ 大模型生成答案。

其中，**文档切分**和**向量检索**是决定RAG效果的关键：切分不当会导致语义断裂，检索不准会让大模型“找错书”，最终还是会出现幻觉。这也是我们实战中重点优化的环节。

## 二、实战准备（环境+工具，一键配齐）

本次实战采用“LangChain + 开源向量库 + 开源大模型”的组合，兼顾轻量化和可扩展性，无需复杂部署，本地即可完成测试，后续可无缝迁移到生产环境。

### 2.1 环境配置（Python 3.8+）

首先安装核心依赖包，直接复制以下命令执行（建议创建虚拟环境，避免依赖冲突）：

```python
# 核心框架：LangChain（封装RAG全流程，不用自己造轮子）
pip install langchain langchain-community langchain-core
# 向量库：Chroma（轻量开源，零配置，适合本地测试）
pip install chromadb
# 嵌入模型：BGE（轻量化，中文效果优，2026年大厂首选）
pip install sentence-transformers
# 大模型：Llama 3（开源可本地运行，也可替换为ChatGLM、GPT等）
pip install transformers accelerate
# 文档加载依赖（支持PDF、Markdown、Word等）
pip install pypdf python-docx unstructured
```

### 2.2 工具选型说明（按需替换）

本次选型以“易落地”为核心，不同场景可灵活替换，对应关系如下：

|模块|本次选型|其他可选方案|适用场景|
|---|---|---|---|
|框架|LangChain|LlamaIndex、Haystack|全场景通用，生态最成熟|
|向量库|Chroma|Milvus、Qdrant、FAISS|Chroma适合本地测试；Milvus/Qdrant适合百万级数据生产环境|
|嵌入模型|BGE-small-en-v1.5|BGE-m3、all-MiniLM、OpenAI Embedding|BGE系列兼顾速度与效果，适合中文场景；OpenAI适合多语种|
|大模型|Llama 3-8B|ChatGLM4、GPT-4、通义千问|Llama 3适合本地部署；GPT-4适合快速验证效果|

## 三、分步实战（从0到1构建RAG系统，可直接复制运行）

本次实战以“企业内部员工手册”为示例，构建一个能回答员工报销、请假、考勤等问题的RAG问答助手，全程分为6个步骤，每一步都有详细代码和注释。

### 步骤1：文档加载与清洗（基础中的基础，避免“垃圾进垃圾出”）

首先加载原始文档（本次用PDF格式的员工手册，可替换为Markdown、Word等），并进行简单清洗，过滤乱码、空行、无关页眉页脚，避免无效数据影响检索效果——这是很多开发者容易忽略的坑，垃圾数据会直接导致RAG回答失真。

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import DirectoryLoader
import re

# 1. 加载文档（支持单个PDF或整个目录下的所有PDF）
# 加载单个PDF
loader = PyPDFLoader("./docs/company_employee_manual.pdf")
# 加载整个目录的PDF（递归匹配）
# loader = DirectoryLoader("./docs", glob="**/*.pdf", loader_cls=PyPDFLoader, show_progress=True)

documents = loader.load()
print(f"加载文档页数：{len(documents)}")

# 2. 文档清洗（过滤乱码、空行、页眉页脚）
def clean_document(doc):
    # 过滤乱码和特殊字符
    content = re.sub(r'[^u4e00-u9fa5a-zA-Z0-9s.,，。！？；;：:]', '', doc.page_content)
    # 过滤空行和过多空格
    content = re.sub(r'n+', 'n', content).strip()
    # 过滤页眉页脚（根据实际文档调整关键词）
    content = re.sub(r'员工手册.*?第d+页', '', content)
    # 更新文档内容
    doc.page_content = content
    return doc

# 批量清洗所有文档
cleaned_documents = [clean_document(doc) for doc in documents if len(doc.page_content.strip()) > 200]
print(f"清洗后有效文档数：{len(cleaned_documents)}")
```

⚠️ 避坑提示：如果是扫描版PDF（图片为主），需先做OCR识别（可使用pytesseract），否则加载后会出现乱码，无法正常切分和检索。

### 步骤2：文档切分（Chunking，决定检索精度的核心）

文档切分是RAG的“灵魂”——切得太碎会导致语义断裂（比如一句话被切成两段），切得太大则会稀释关键信息，检索时无法精准匹配。2026年主流的切分策略是“按文档类型定制”，而非“一刀切”，本次结合递归切分和语义切分的优势，适配中文文档场景。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 定制中文切分策略：优先按段落、句子切分，保留语义完整性
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,  # 每个切分块的字符数（根据大模型上下文长度调整）
    chunk_overlap=80,  # 相邻块重叠部分（避免关键信息被切断，建议为chunk_size的10%-30%）
    separators=["nn", "n", "。", "！", "？", "，", "；", "：", " ", ""]  # 中文优先分隔符
)

# 执行切分
chunks = text_splitter.split_documents(cleaned_documents)
print(f"切分后文档块数量：{len(chunks)}")
print(f"示例块内容：{chunks[0].page_content[:200]}...")
```

💡 进阶技巧：针对不同文档类型，可定制更精准的切分策略：

- 代码文档：优先按def、class切分，chunk_size设为1000-1500，保证函数逻辑完整；

- PDF/Markdown：按标题层级（#、##）切分，再对过长章节递归切分，保留文档结构；

- 多模态文档（图文混合）：文本部分用结构感知切分，图片用多模态模型提取描述，与相邻文本合并为一个块。

### 步骤3：文本向量化与向量库存储

向量化的核心是将文本（文档块、用户问题）转化为计算机可计算的向量，通过向量相似度判断语义关联——相似度越高，说明内容越相关。本次使用BGE轻量化嵌入模型，兼顾速度与效果，同时注入元数据提升检索精度（大厂必做优化）。

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# 1. 初始化嵌入模型（BGE-small，轻量化，中文效果优）
embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={"device": "cpu"},  # 本地测试用CPU，有GPU可改为"cuda"
    encode_kwargs={"normalize_embeddings": True}  # 向量归一化，提升检索精度
)

# 2. 注入元数据（可选，但能显著提升检索精度）
# 为每个文档块添加标题、来源等元数据
for i, chunk in enumerate(chunks):
    chunk.metadata = {
        "title": "员工手册",
        "source": f"page_{chunk.metadata.get('page', i//10 + 1)}",  # 关联原文档页码
        "chunk_id": i
    }

# 3. 向量库存储（Chroma，零配置，本地持久化）
vector_db = Chroma.from_documents(
    documents=chunks,
    embedding=embedding_model,
    persist_directory="./chroma_db",  # 向量库存储路径，下次可直接加载
    collection_name="employee_manual"
)

# 持久化向量库（避免下次重新生成）
vector_db.persist()
print("向量库构建完成，已持久化到 ./chroma_db")
```

⚠️ 避坑提示：使用余弦相似度时，务必开启向量归一化（normalize_embeddings=True），否则检索结果会严重失真；如果是中文场景，不要使用纯英文嵌入模型，否则语义匹配精度会大幅下降。

### 步骤4：检索模块实现（精准“找书”，避免无效召回）

检索模块的核心是“根据用户问题，从向量库中找到最相关的文档块”，本次先实现基础的相似性检索，再补充2026年主流的进阶优化（RAG-Fusion、重排序），提升检索精度。

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

# 1. 基础相似性检索（Top-K，K值需根据实际测试调整）
retriever = vector_db.as_retriever(
    search_type="similarity",  # 检索类型：相似性检索
    search_kwargs={"k": 5}  # 检索前5个最相关的文档块，建议范围3-8
)

# 测试检索效果
user_query = "员工报销额度是多少？"
retrieved_docs = retriever.invoke(user_query)
print(f"检索到相关文档块数量：{len(retrieved_docs)}")
for i, doc in enumerate(retrieved_docs):
    print(f"n相关文档{i+1}（来源：{doc.metadata['source']}）：")
    print(doc.page_content[:300] + "...")

# 2. 进阶优化：检索重排序（减少噪声，提升精度）
# 用轻量模型对检索结果重排序，过滤不相关文档
from langchain_community.document_compressors import CohereRerank
# 替换为自己的Cohere API Key，也可使用BERT类重排序模型
compressor = CohereRerank(cohere_api_key="your_cohere_api_key", top_n=3)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=retriever
)

# 优化后的检索结果
optimized_docs = compression_retriever.invoke(user_query)
print(f"n优化后检索到相关文档块数量：{len(optimized_docs)}")
```

💡 进阶技巧：如果检索精度不足，可尝试“多路召回”——结合稀疏召回（BM25）和密集召回（Embedding），综合提升覆盖率；对于复杂问题，可使用“问题分解”（Decomposition Retrieval），将复杂问题拆分为子问题，再合并检索结果。

### 步骤5：与大模型集成（生成可靠答案，避免幻觉）

这一步是将检索到的相关文档，与用户问题拼接成Prompt，喂给大模型生成答案。核心是通过Prompt约束，让大模型“只依据检索到的文档回答”，避免编造信息，同时附带来源引用，提升可信度。

```python
from langchain_community.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# 1. 初始化开源大模型（Llama 3-8B，本地运行）
model_name = "meta-llama/Llama-3-8B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",  # 自动分配CPU/GPU
    load_in_8bit=True  # 8位量化，降低显存占用（需安装bitsandbytes）
)

# 构建大模型管道
llm_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512,  # 最大生成 tokens 数
    temperature=0.3,  # 温度越低，回答越严谨（避免幻觉）
    top_p=0.9
)

llm = HuggingFacePipeline(pipeline=llm_pipeline)

# 2. 定制Prompt（关键！约束大模型，避免幻觉）
prompt_template = """
你是企业员工手册问答助手，仅依据提供的参考文档回答用户问题，严格遵循以下规则：
1. 只使用参考文档中的信息，不编造任何未提及的内容；
2. 如果参考文档中没有相关信息，直接回答“抱歉，未查询到相关内容”；
3. 回答要简洁明了，分点说明（如果有多个要点），并在结尾标注信息来源（文档来源+页码）；
4. 不要泄露参考文档中未提及的内容，不要添加主观判断。

参考文档：
{context}

用户问题：{question}

回答：
"""

prompt = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# 3. 构建RAG问答链
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 将所有检索到的文档拼接进Prompt（适合小批量文档）
    retriever=compression_retriever,  # 使用优化后的检索器
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True  # 返回检索到的源文档，方便验证
)

# 4. 测试问答效果
user_query = "员工报销额度是多少？需要提供哪些材料？"
result = rag_chain.invoke({"query": user_query})

# 输出结果
print("RAG问答结果：")
print(result["result"])
print("n检索到的源文档：")
for doc in result["source_documents"]:
    print(f"- 来源：{doc.metadata['source']}，内容：{doc.page_content[:200]}...")
```

⚠️ 避坑提示：如果使用闭源大模型（如GPT-4），可直接替换llm初始化代码，无需本地部署；Prompt一定要明确“只依据参考文档回答”，否则大模型容易忽略检索结果，出现幻觉。

### 步骤6：效果评估与调试（持续优化，提升体验）

RAG实战不是“一跑了之”，需要通过评估指标和人工测试，持续优化各环节参数。常用的评估维度分为「检索环节」和「生成环节」，结合自动评估和人工评估，形成闭环优化。

#### 6.1 检索环节评估（核心看“找得准不准”）

常用指标及含义：

- Recall@K：检索到的相关文档数 / 实际相关文档数（越高越好，体现召回率）；

- Precision@K：前K条检索结果中，相关文档的比例（越高越好，体现精准度）；

- MRR：相关文档的平均排名倒数（越高越好，体现相关文档的排序位置）。

简单测试方法：手动构造10-20个问答对（如“报销额度是多少？”对应文档中的具体内容），测试检索结果中是否包含正确文档，计算Recall@5和Precision@5。

#### 6.2 生成环节评估（核心看“答得对不对”）

常用指标及含义：

- Factuality：生成内容与检索文档的一致性（无幻觉，越高越好）；

- Rouge-L：生成内容与参考答案的相似度（越高越好）；

- 连贯性：回答的逻辑流畅度，是否符合自然语言习惯。

简单测试方法：人工抽检10-20个问答结果，从“准确性、连贯性、完整性、相关性”四个维度打分（1-5分），平均分≥4分为合格。

## 四、企业级优化技巧（2026年最新，提升RAG效果上限）

如果需要将RAG系统部署到生产环境，仅完成基础流程还不够，结合大厂实践，补充以下4个关键优化技巧，可显著提升检索精度和生成质量：

### 1. 文档切分进阶：使用LGMGC融合策略

LGMGC是2026年最新的切分策略，融合“Small2big”思想与语义切分，解决“语义完整与粒度灵活”的矛盾，相比传统切分，检索DCG@k提升18%，问答F1分数提升12%。核心逻辑：用大模型生成父块（800 tokens），再拆分对子块（400 tokens），保留语义关联，同时降低部署成本。

### 2. 嵌入模型优化：领域专属模型+批量处理

针对垂直领域（医疗、法律、金融），使用领域微调的嵌入模型（如医疗专用BGE模型），比通用模型检索精度提升30%以上；同时采用批量向量化（batch_size=32-64），提升处理效率，降低部署成本。

### 3. 检索优化：Agent代理切分+多路召回

对于异构文档集合（同时包含PDF、代码、Markdown），使用Agent代理切分：由LLM自动分析文档类型，推荐最优切分策略（如代码文档用AST语法切分，PDF用结构感知切分），部署效率提升60%；结合多路召回（稀疏+密集），检索召回率提升25%以上。

### 4. 幻觉治理：双重约束+事实核查

除了Prompt约束，增加双重保障：① 引用标注机制，让大模型输出时附带来源页码，方便人工核查；② 加入轻量Fact-checking模型，对生成结果进行自动校验，发现幻觉立即重新生成。

## 五、常见坑与规避方案（避坑=节省80%时间）

结合实战经验和大厂分享，整理了5个最容易踩的坑，每个坑都给出具体规避方案，帮大家少走弯路：

### 坑1：文档质量差，垃圾数据导致检索失真

典型现象：问题在文档中有答案，但RAG回答答非所问；检索结果含大量乱码、空行。
规避方案：加载文档后必须清洗，过滤乱码、无关信息；优先处理“高价值+可读性强”的文档，不要为了数据量塞垃圾文档；抽样自查（随机抽20个chunk），发现问题及时重构。

### 坑2：分块“一刀切”，语义被切碎

典型现象：回答只说一半，代码文档只看到函数中间几行，表格文档缺失表头。
规避方案：按文档类型定制分块策略，代码按函数切，PDF按结构切；控制overlap在10%-30%，避免相邻chunk重复过多。

### 坑3：Embedding模型选错，检索结果离谱

典型现象：问题与文档语义相近，但检索结果排名靠后；不同向量库切换后效果忽上忽下。
规避方案：按语言和场景选模型（中文用BGE，多语种用OpenAI）；严格按模型要求做向量归一化；先测试嵌入模型的检索效果，再接入RAG。

### 坑4：Top-K乱设，信息不足或噪声爆炸

典型现象：Top-K太小（1-2），回答“信息不足”；Top-K太大（10+），Prompt过长、费用激增、幻觉增多。
规避方案：默认设置3-8，用评估集测试不同K值的收益/成本比，选择最优值；引入轻量重排序，而非盲目加大K值。

### 坑5：Prompt无约束，回答乱飞

典型现象：回答含主观揣测，与文档信息冲突，出现幻觉。
规避方案：明确Prompt的角色和边界，强制要求“仅依据参考文档回答”；加入来源标注，让大模型“有据可依”。

## 六、总结与后续展望

本次实战完成了从0到1的RAG系统搭建，核心流程是“文档加载→切分→向量化→检索→大模型集成”，关键在于“细节把控”——文档清洗决定数据质量，切分策略决定检索精度，Prompt约束决定生成可靠性。

对于新手来说，建议先按本文流程，用简单文档（如员工手册、技术文档）完成基础实战，熟悉各模块的作用和参数调整方法；后续可逐步优化，比如接入多模态文档、实现Agent与RAG的结合、部署到云服务器，满足更复杂的业务需求。

RAG的核心价值是“让大模型更靠谱、更可控”，它不需要大量标注数据，也不需要对大模型进行复杂微调，是当前大模型落地最性价比的方案。只要掌握本文的流程和优化技巧，就能快速落地属于自己的RAG应用。

最后，附上本次实战的完整代码仓库（模拟），包含所有代码、文档示例和环境配置说明，需要的同学可以自行获取。

## 附录：代码仓库示例
以下是本次 RAG 实战的结构和文件内容。
### 一、项目目录结构
```python
llm-rag-practice/
├── README.md                    # 项目说明文档（必看）
├── requirements.txt             # 依赖包列表
├── config.py                    # 全局配置文件（所有参数集中管理）
├── .gitignore                   # Git忽略文件
├── src/                         # 核心代码目录
│   ├── __init__.py
│   ├── data_loader.py           # 文档加载与清洗模块
│   ├── text_splitter.py         # 文档切分模块
│   ├── vector_store.py          # 向量库构建与管理模块
│   ├── retriever.py             # 检索模块（含重排序）
│   ├── llm_integration.py       # 大模型集成模块（支持多模型切换）
│   └── rag_chain.py             # RAG问答链核心模块
├── docs/                        # 示例文档目录（存放你的PDF/Word/Markdown）
│   └── company_employee_manual.pdf  # 示例员工手册
├── chroma_db/                   # 向量库持久化存储（自动生成，Git忽略）
├── examples/                    # 使用示例
│   ├── basic_usage.py           # 基础问答示例
│   └── web_demo.py              # Gradio Web界面示例
└── tests/                       # 测试代码目录
    └── test_rag.py              # 单元测试
```
### 二、核心文件完整代码
- 1. requirements.txt（依赖包列表，版本锁定）
```python
# 核心框架
langchain==0.2.0
langchain-community==0.2.0
langchain-core==0.2.0

# 向量数据库
chromadb==0.5.0

# 嵌入模型
sentence-transformers==2.7.0

# 大模型相关
transformers==4.41.0
accelerate==0.30.1
bitsandbytes==0.43.1  # 8位量化，GPU环境需要

# 文档加载
pypdf==4.2.0
python-docx==1.1.2
unstructured==0.14.0
python-magic-bin==0.4.14  # Windows系统需要，Linux/macOS用python-magic

# 检索优化
cohere==5.5.0  # 重排序API

# 工具类
python-dotenv==1.0.1
loguru==0.7.2
tqdm==4.66.4

# Web界面（可选）
gradio==4.31.0

# 开发依赖（可选）
pytest==8.2.0
black==24.4.2
isort==5.13.2
```
- 2. config.py（全局配置文件，所有参数集中管理）
```python
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# ==================== 文档处理配置 ====================
DOCS_DIR = "./docs"
SUPPORTED_FILE_TYPES = ["pdf", "docx", "md", "txt"]

# 文档切分配置
CHUNK_SIZE = 800
CHUNK_OVERLAP = 80
CHUNK_SEPARATORS = ["\n\n", "\n", "。", "！", "？", "，", "；", "：", " ", ""]

# ==================== 嵌入模型配置 ====================
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DEVICE = "cpu"  # 有GPU改为"cuda"
NORMALIZE_EMBEDDINGS = True

# ==================== 向量库配置 ====================
VECTOR_DB_DIR = "./chroma_db"
COLLECTION_NAME = "employee_manual"

# ==================== 检索配置 ====================
RETRIEVER_TOP_K = 5
RERANKER_TOP_N = 3
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")  # 从.env文件读取

# ==================== 大模型配置 ====================
# 模型类型："llama3" | "chatglm4" | "gpt4" | "qwen"
LLM_TYPE = "llama3"

# Llama 3配置
LLAMA3_MODEL_NAME = "meta-llama/Llama-3-8B-Instruct"
LLAMA3_MAX_NEW_TOKENS = 512
LLAMA3_TEMPERATURE = 0.3
LLAMA3_TOP_P = 0.9
LLAMA3_LOAD_IN_8BIT = True

# ChatGLM4配置
CHATGLM4_MODEL_NAME = "THUDM/chatglm4-6b"
CHATGLM4_MAX_NEW_TOKENS = 512
CHATGLM4_TEMPERATURE = 0.3

# GPT-4配置
GPT4_MODEL_NAME = "gpt-4o"
GPT4_API_KEY = os.getenv("OPENAI_API_KEY", "")
GPT4_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
GPT4_MAX_TOKENS = 512
GPT4_TEMPERATURE = 0.3

# ==================== Prompt模板 ====================
RAG_PROMPT_TEMPLATE = """
你是企业员工手册问答助手，仅依据提供的参考文档回答用户问题，严格遵循以下规则：
1. 只使用参考文档中的信息，不编造任何未提及的内容；
2. 如果参考文档中没有相关信息，直接回答“抱歉，未查询到相关内容”；
3. 回答要简洁明了，分点说明（如果有多个要点），并在结尾标注信息来源（文档来源+页码）；
4. 不要泄露参考文档中未提及的内容，不要添加主观判断。

参考文档：
{context}

用户问题：{question}

回答：
"""
```
- 3. src/__init__.py
```python
# 导出核心模块
from .data_loader import DocumentLoader
from .text_splitter import TextSplitter
from .vector_store import VectorStore
from .retriever import Retriever
from .llm_integration import LLMFactory
from .rag_chain import RAGChain

__all__ = [
    "DocumentLoader",
    "TextSplitter",
    "VectorStore",
    "Retriever",
    "LLMFactory",
    "RAGChain"
]
```
- 4. src/data_loader.py（文档加载与清洗模块）
```python
import os
import re
from typing import List
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    DirectoryLoader
)
from langchain_core.documents import Document
from loguru import logger

class DocumentLoader:
    """文档加载与清洗类"""
    
    def __init__(self, docs_dir: str = "./docs"):
        self.docs_dir = docs_dir
        self.supported_loaders = {
            "pdf": PyPDFLoader,
            "docx": Docx2txtLoader,
            "md": TextLoader,
            "txt": TextLoader
        }
    
    def load_single_file(self, file_path: str) -> List[Document]:
        """加载单个文件"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower().lstrip(".")
            if file_ext not in self.supported_loaders:
                logger.warning(f"不支持的文件类型: {file_ext}")
                return []
            
            loader = self.supported_loaders[file_ext](file_path)
            documents = loader.load()
            logger.info(f"成功加载文件: {file_path}，共{len(documents)}页")
            return documents
        except Exception as e:
            logger.error(f"加载文件失败: {file_path}，错误: {str(e)}")
            return []
    
    def load_directory(self, glob_pattern: str = "**/*.*") -> List[Document]:
        """加载整个目录下的所有支持文件"""
        all_documents = []
        
        for root, _, files in os.walk(self.docs_dir):
            for file in files:
                file_ext = os.path.splitext(file)[1].lower().lstrip(".")
                if file_ext in self.supported_loaders:
                    file_path = os.path.join(root, file)
                    documents = self.load_single_file(file_path)
                    all_documents.extend(documents)
        
        logger.info(f"目录加载完成，共加载{len(all_documents)}个文档片段")
        return all_documents
    
    def clean_document(self, doc: Document) -> Document:
        """清洗单个文档"""
        # 过滤乱码和特殊字符
        content = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s\.,，。！？；;：:]', '', doc.page_content)
        # 过滤空行和过多空格
        content = re.sub(r'\n+', '\n', content).strip()
        # 过滤页眉页脚（根据实际文档调整关键词）
        content = re.sub(r'员工手册.*?第\d+页', '', content)
        content = re.sub(r'机密.*?内部使用', '', content)
        
        # 更新文档内容
        doc.page_content = content
        return doc
    
    def clean_all_documents(self, documents: List[Document]) -> List[Document]:
        """批量清洗所有文档"""
        cleaned_docs = []
        for doc in documents:
            cleaned_doc = self.clean_document(doc)
            # 过滤过短的文档
            if len(cleaned_doc.page_content.strip()) > 200:
                cleaned_docs.append(cleaned_doc)
        
        logger.info(f"文档清洗完成，有效文档数: {len(cleaned_docs)}")
        return cleaned_docs
```
- 5. src/text_splitter.py（文档切分模块）
```python
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from loguru import logger
import config

class TextSplitter:
    """文档切分类"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP,
            separators=config.CHUNK_SEPARATORS
        )
    
    def split_documents(self, documents: List[Document]) -> List[Document]:
        """切分文档"""
        chunks = self.text_splitter.split_documents(documents)
        logger.info(f"文档切分完成，共生成{len(chunks)}个文档块")
        
        # 注入元数据
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_id"] = i
            chunk.metadata["source"] = f"{chunk.metadata.get('source', 'unknown')}_page_{chunk.metadata.get('page', i//10 + 1)}"
        
        return chunks
```
- 6. src/vector_store.py（向量库构建与管理模块）
```python
from typing import List, Optional
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from loguru import logger
import config

class VectorStore:
    """向量库管理类"""
    
    def __init__(self):
        # 初始化嵌入模型
        self.embedding_model = HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL_NAME,
            model_kwargs={"device": config.EMBEDDING_DEVICE},
            encode_kwargs={"normalize_embeddings": config.NORMALIZE_EMBEDDINGS}
        )
        
        # 初始化向量库
        self.vector_db = None
        self._load_or_create_vector_db()
    
    def _load_or_create_vector_db(self):
        """加载已存在的向量库或创建新的"""
        try:
            if os.path.exists(config.VECTOR_DB_DIR) and len(os.listdir(config.VECTOR_DB_DIR)) > 0:
                self.vector_db = Chroma(
                    persist_directory=config.VECTOR_DB_DIR,
                    embedding_function=self.embedding_model,
                    collection_name=config.COLLECTION_NAME
                )
                logger.info(f"成功加载已有向量库: {config.VECTOR_DB_DIR}")
            else:
                logger.info(f"向量库不存在，将创建新的向量库: {config.VECTOR_DB_DIR}")
        except Exception as e:
            logger.error(f"加载向量库失败: {str(e)}，将创建新的向量库")
            self.vector_db = None
    
    def add_documents(self, documents: List[Document]) -> None:
        """添加文档到向量库"""
        if not documents:
            logger.warning("没有文档可添加到向量库")
            return
        
        if self.vector_db is None:
            self.vector_db = Chroma.from_documents(
                documents=documents,
                embedding=self.embedding_model,
                persist_directory=config.VECTOR_DB_DIR,
                collection_name=config.COLLECTION_NAME
            )
        else:
            self.vector_db.add_documents(documents)
        
        # 持久化向量库
        self.vector_db.persist()
        logger.info(f"成功添加{len(documents)}个文档到向量库")
    
    def get_vector_db(self) -> Optional[Chroma]:
        """获取向量库实例"""
        return self.vector_db
    
    def delete_collection(self) -> None:
        """删除整个向量库集合"""
        if self.vector_db:
            self.vector_db.delete_collection()
            self.vector_db = None
            logger.info("向量库集合已删除")
```
- 7. src/retriever.py（检索模块，含重排序）
```python
from typing import List
from langchain_core.documents import Document
from langchain.retrievers import ContextualCompressionRetriever
from langchain_community.document_compressors import CohereRerank
from loguru import logger
import config
from .vector_store import VectorStore

class Retriever:
    """检索类"""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.base_retriever = self._create_base_retriever()
        self.compression_retriever = self._create_compression_retriever()
    
    def _create_base_retriever(self):
        """创建基础相似性检索器"""
        vector_db = self.vector_store.get_vector_db()
        if not vector_db:
            raise ValueError("向量库未初始化")
        
        return vector_db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": config.RETRIEVER_TOP_K}
        )
    
    def _create_compression_retriever(self):
        """创建带重排序的压缩检索器"""
        if not config.COHERE_API_KEY:
            logger.warning("未配置Cohere API Key，将不使用重排序")
            return self.base_retriever
        
        try:
            compressor = CohereRerank(
                cohere_api_key=config.COHERE_API_KEY,
                top_n=config.RERANKER_TOP_N
            )
            return ContextualCompressionRetriever(
                base_compressor=compressor,
                base_retriever=self.base_retriever
            )
        except Exception as e:
            logger.error(f"初始化重排序器失败: {str(e)}，将使用基础检索器")
            return self.base_retriever
    
    def retrieve(self, query: str) -> List[Document]:
        """检索相关文档"""
        try:
            docs = self.compression_retriever.invoke(query)
            logger.info(f"检索完成，找到{len(docs)}个相关文档")
            return docs
        except Exception as e:
            logger.error(f"检索失败: {str(e)}")
            return []
```
- 8. src/llm_integration.py（大模型集成模块，支持多模型切换）
```python
from langchain_core.language_models import BaseLLM
from langchain_community.llms import HuggingFacePipeline
from langchain_openai import ChatOpenAI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from loguru import logger
import config

class LLMFactory:
    """大模型工厂类，支持多模型切换"""
    
    @staticmethod
    def create_llm() -> BaseLLM:
        """根据配置创建对应的大模型实例"""
        llm_type = config.LLM_TYPE.lower()
        
        if llm_type == "llama3":
            return LLMFactory._create_llama3()
        elif llm_type == "chatglm4":
            return LLMFactory._create_chatglm4()
        elif llm_type == "gpt4":
            return LLMFactory._create_gpt4()
        elif llm_type == "qwen":
            return LLMFactory._create_qwen()
        else:
            raise ValueError(f"不支持的大模型类型: {llm_type}")
    
    @staticmethod
    def _create_llama3() -> HuggingFacePipeline:
        """创建Llama 3模型实例"""
        logger.info(f"正在加载Llama 3模型: {config.LLAMA3_MODEL_NAME}")
        
        tokenizer = AutoTokenizer.from_pretrained(config.LLAMA3_MODEL_NAME)
        model = AutoModelForCausalLM.from_pretrained(
            config.LLAMA3_MODEL_NAME,
            device_map="auto",
            load_in_8bit=config.LLAMA3_LOAD_IN_8BIT
        )
        
        llm_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=config.LLAMA3_MAX_NEW_TOKENS,
            temperature=config.LLAMA3_TEMPERATURE,
            top_p=config.LLAMA3_TOP_P,
            pad_token_id=tokenizer.eos_token_id
        )
        
        return HuggingFacePipeline(pipeline=llm_pipeline)
    
    @staticmethod
    def _create_chatglm4() -> HuggingFacePipeline:
        """创建ChatGLM4模型实例"""
        logger.info(f"正在加载ChatGLM4模型: {config.CHATGLM4_MODEL_NAME}")
        
        tokenizer = AutoTokenizer.from_pretrained(config.CHATGLM4_MODEL_NAME, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            config.CHATGLM4_MODEL_NAME,
            device_map="auto",
            trust_remote_code=True
        )
        
        llm_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=config.CHATGLM4_MAX_NEW_TOKENS,
            temperature=config.CHATGLM4_TEMPERATURE
        )
        
        return HuggingFacePipeline(pipeline=llm_pipeline)
    
    @staticmethod
    def _create_gpt4() -> ChatOpenAI:
        """创建GPT-4模型实例"""
        logger.info(f"正在初始化GPT-4模型: {config.GPT4_MODEL_NAME}")
        
        if not config.GPT4_API_KEY:
            raise ValueError("未配置OpenAI API Key")
        
        return ChatOpenAI(
            model=config.GPT4_MODEL_NAME,
            api_key=config.GPT4_API_KEY,
            base_url=config.GPT4_BASE_URL,
            max_tokens=config.GPT4_MAX_TOKENS,
            temperature=config.GPT4_TEMPERATURE
        )
    
    @staticmethod
    def _create_qwen() -> HuggingFacePipeline:
        """创建通义千问模型实例（本地部署）"""
        logger.info("正在加载通义千问模型")
        # 通义千问加载逻辑与Llama 3类似，可根据实际情况调整
        raise NotImplementedError("通义千问模型加载尚未实现")
```
- 9. src/rag_chain.py（RAG 问答链核心模块）
```python
from typing import Dict, Any
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from loguru import logger
import config
from .retriever import Retriever
from .llm_integration import LLMFactory

class RAGChain:
    """RAG问答链类"""
    
    def __init__(self, retriever: Retriever):
        self.retriever = retriever
        self.llm = LLMFactory.create_llm()
        self.qa_chain = self._create_qa_chain()
    
    def _create_qa_chain(self) -> RetrievalQA:
        """创建RAG问答链"""
        prompt = PromptTemplate(
            template=config.RAG_PROMPT_TEMPLATE,
            input_variables=["context", "question"]
        )
        
        return RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.retriever.compression_retriever,
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True
        )
    
    def query(self, question: str) -> Dict[str, Any]:
        """执行问答查询"""
        try:
            logger.info(f"收到查询: {question}")
            result = self.qa_chain.invoke({"query": question})
            logger.info("查询完成")
            return {
                "question": question,
                "answer": result["result"],
                "source_documents": [
                    {
                        "content": doc.page_content[:300] + "...",
                        "source": doc.metadata.get("source", "unknown")
                    }
                    for doc in result["source_documents"]
                ]
            }
        except Exception as e:
            logger.error(f"查询失败: {str(e)}")
            return {
                "question": question,
                "answer": "抱歉，查询过程中出现错误，请稍后重试",
                "source_documents": []
            }
```
### 三、使用示例
- 1. examples/basic_usage.py（基础问答示例）
```python
import sys
sys.path.append("..")  # 添加项目根目录到Python路径

from src import DocumentLoader, TextSplitter, VectorStore, Retriever, RAGChain
import config

def main():
    # 步骤1：加载并清洗文档
    print("正在加载并清洗文档...")
    loader = DocumentLoader(config.DOCS_DIR)
    documents = loader.load_directory()
    cleaned_documents = loader.clean_all_documents(documents)
    
    # 步骤2：切分文档
    print("正在切分文档...")
    splitter = TextSplitter()
    chunks = splitter.split_documents(cleaned_documents)
    
    # 步骤3：构建向量库
    print("正在构建向量库...")
    vector_store = VectorStore()
    vector_store.add_documents(chunks)
    
    # 步骤4：创建检索器和RAG链
    print("正在初始化RAG系统...")
    retriever = Retriever(vector_store)
    rag_chain = RAGChain(retriever)
    
    # 步骤5：交互式问答
    print("\nRAG系统初始化完成！输入'quit'退出")
    while True:
        question = input("\n请输入你的问题: ")
        if question.lower() == "quit":
            break
        
        result = rag_chain.query(question)
        print("\n回答:")
        print(result["answer"])
        
        if result["source_documents"]:
            print("\n参考来源:")
            for i, doc in enumerate(result["source_documents"]):
                print(f"{i+1}. {doc['source']}")

if __name__ == "__main__":
    main()
```
- 2. examples/web_demo.py（Gradio Web 界面示例）
```python
import sys
sys.path.append("..")

import gradio as gr
from src import DocumentLoader, TextSplitter, VectorStore, Retriever, RAGChain
import config

# 初始化RAG系统
print("正在初始化RAG系统...")
loader = DocumentLoader(config.DOCS_DIR)
documents = loader.load_directory()
cleaned_documents = loader.clean_all_documents(documents)

splitter = TextSplitter()
chunks = splitter.split_documents(cleaned_documents)

vector_store = VectorStore()
vector_store.add_documents(chunks)

retriever = Retriever(vector_store)
rag_chain = RAGChain(retriever)
print("RAG系统初始化完成！")

def answer_question(question):
    """回答问题并格式化输出"""
    result = rag_chain.query(question)
    
    answer = result["answer"]
    sources = "\n\n**参考来源:**\n"
    for i, doc in enumerate(result["source_documents"]):
        sources += f"{i+1}. {doc['source']}\n"
    
    return answer + sources

# 创建Gradio界面
with gr.Blocks(title="企业员工手册RAG问答助手") as demo:
    gr.Markdown("# 企业员工手册RAG问答助手")
    gr.Markdown("基于检索增强生成技术，精准回答员工手册相关问题")
    
    with gr.Row():
        with gr.Column(scale=3):
            question_input = gr.Textbox(label="请输入你的问题", placeholder="例如：员工报销额度是多少？")
            submit_btn = gr.Button("提交", variant="primary")
        
        with gr.Column(scale=5):
            answer_output = gr.Markdown(label="回答")
    
    submit_btn.click(
        fn=answer_question,
        inputs=question_input,
        outputs=answer_output
    )
    
    # 示例问题
    gr.Examples(
        examples=[
            "员工报销额度是多少？",
            "请假流程是什么？",
            "加班工资怎么计算？",
            "试用期有多长？"
        ],
        inputs=question_input
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=True)
```
### 四、常见问题
#### GPU 内存不足怎么办？
- 降低CHUNK_SIZE到 500-600
- 开启 8 位量化（LLAMA3_LOAD_IN_8BIT=True）
- 使用更小的模型（如 Llama 3-7B、ChatGLM4-6B）
- 切换到 API 模式（如 GPT-4、通义千问 API）
#### 检索效果不好怎么办？
- 调整RETRIEVER_TOP_K（3-8 之间）
- 配置 Cohere 重排序 API
- 优化文档切分策略（调整CHUNK_SIZE和CHUNK_OVERLAP）
- 使用领域专用嵌入模型
#### 大模型出现幻觉怎么办？
- 降低TEMPERATURE到 0.1-0.3
- 加强 Prompt 约束
- 增加来源标注
- 加入事实核查机制
