---
title: RAG 实战：Document Loader 文档加载器详解
tag: ["RAG", "大模型", "文档加载"]
category: 大模型
date: 2026-05-13
---

# RAG 实战：Document Loader 文档加载器详解

## 一、前言

在 RAG（检索增强生成）架构中，**Document Loader 文档加载器**是整个链路的**入口第一环**。

核心作用：把本地文件、网页、数据库、知识库等**各类异构数据源**，统一解析为 RAG 标准的 `Document` 文档对象，为后续**文本分割、向量化、向量入库、检索召回**提供原始素材。

没有文档加载器，RAG 就无法接入外部私有知识库，也就失去了「私有数据增强大模型」的核心能力。

本文基于 LangChain 生态，从零梳理 Document Loader 原理、常用加载器、实战代码、适配场景与避坑要点，可直接用于项目开发与学习。

## 二、Document Loader 核心概念

### 2.1 核心职责

1. **读取数据源**：本地文件、PDF、Word、Markdown、网页、Excel、数据库、飞书/Notion 知识库等；

2. **内容解析提取**：剥离格式、样式、页眉页脚，提取纯文本内容；

3. **封装为 Document 对象**：统一结构，供后续 `TextSplitter` 切分、Embedding 向量化。

### 2.2 Document 对象结构

LangChain 标准文档结构：

```python
class Document:
    page_content: str  # 文档核心文本内容
    metadata: dict     # 元数据：来源路径、文件名、页码、时间、作者等
```

元数据作用：检索后溯源、过滤文档、引用出处、做权限控制。

## 三、常用 Document Loader 分类

### 3.1 本地文件类 Loader（最常用）

|加载器|支持格式|适用场景|
|---|---|---|
|TextLoader|.txt、.md|纯文本、markdown 笔记|
|PyPDFLoader|.pdf|论文、手册、电子文档|
|Docx2txtLoader|.docx|Word 文档资料|
|CSVLoader|.csv、Excel|结构化表格数据|
|UnstructuredLoader|多格式兼容|未知格式、混合文档|

### 3.2 网络&amp;在线资源 Loader

- WebBaseLoader：抓取普通网页正文

- SitemapLoader：全站站点地图批量爬取

- NotionLoader：Notion 知识库导入

- FeishuLoader：飞书文档、知识库加载

### 3.3 数据库&amp;结构化 Loader

- SQLDatabaseLoader：MySQL/Postgres 数据库表数据

- JSONLoader：JSON 配置、接口返回数据

## 四、环境依赖安装

```bash
# 基础 langchain
pip install langchain langchain-community

# PDF 解析依赖
pip install pypdf

# Word 解析
pip install docx2txt

# 网页爬取
pip install beautifulsoup4 lxml
```

## 五、实战代码示例

### 5.1 加载本地 Markdown / TXT 文件

```python
from langchain_community.document_loaders import TextLoader

# 初始化加载器
loader = TextLoader("./knowledge/实战笔记.md", encoding="utf-8")

# 加载为文档列表
documents = loader.load()

# 查看结果
print(f"文档数量：{len(documents)}")
print("内容预览：")
print(documents[0].page_content[:300])
print("元数据：", documents[0].metadata)
```

### 5.2 加载 PDF 文档

```python
from langchain_community.document_loaders import PyPDFLoader

loader = PyPDFLoader("./knowledge/技术手册.pdf")
documents = loader.load()

# 按页码拆分，每一页一个 Document
for idx, doc in enumerate(documents):
    print(f"第{idx+1}页：{doc.page_content[:200]}")
    print("页码元数据：", doc.metadata)
```

### 5.3 批量加载整个文件夹文档

```python
from langchain_community.document_loaders import DirectoryLoader

# 批量加载目录下所有 md/txt 文件
loader = DirectoryLoader(
    path="./knowledge/",
    glob="**/*.md",  # 匹配格式
    loader_cls=TextLoader
)

documents = loader.load()
print(f"批量加载文档总数：{len(documents)}")
```

### 5.4 网页内容加载

```python
from langchain_community.document_loaders import WebBaseLoader

# 加载单网页
loader = WebBaseLoader("https://xxx.com/tech/article")
documents = loader.load()

print(documents[0].page_content[:500])
```

## 六、Loader 常见问题与避坑

1. **编码报错**
加载 txt/md 时指定 `encoding="utf-8"`，Windows 文档可尝试 `gbk`。

2. **PDF 乱码、公式无法解析**
纯扫描版 PDF 普通 Loader 无法提取，需用 OCR 类加载器。

3. **网页爬取多余广告、导航栏**
WebBaseLoader 会自动提取正文，复杂网站可配合 BeautifulSoup 自定义筛选标签。

4. **大文件一次性加载内存溢出**
使用 `loader.lazy_load()` 懒加载，迭代读取，避免一次性载入全部文档。

## 七、Loader 在 RAG 完整链路中的位置

```plain text
数据源 -> DocumentLoader 加载 -> TextSplitter 文本切分 
-> Embedding 向量化 -> 向量数据库入库 
-> 用户问题 -> 问题向量化 -> 相似度检索 
-> 召回文档拼接 Prompt -> LLM 生成回答
```

Loader 是 RAG 链路**数据入口**，Loader 解析质量直接决定后续检索准确度和问答效果。

## 八、总结

1. Document Loader 是 RAG 接入私有数据的**第一道关口**，统一各类数据源为标准 Document；

2. 日常开发优先使用 `TextLoader、PyPDFLoader、DirectoryLoader` 满足 80% 本地知识库场景；

3. 元数据 metadata 一定要保留，用于溯源、过滤、业务权限控制；

4. 大文件、多文件推荐目录批量加载 + 懒加载，优化内存占用。

---

&gt; 本文基于 LangChain 最新版本编写，代码可直接复制运行，如需扩展 OCR 加载器、数据库加载等进阶用法，可留言补充。

## 九、进阶用法：OCR 加载器（解决扫描版 PDF 解析问题）

### 9.1 适用场景

当遇到**纯扫描版 PDF、图片格式文档**时，普通 PyPDFLoader 无法提取文本（会出现乱码或空白），此时需使用 OCR（光学字符识别）类加载器，通过识别图片中的文字完成解析。

### 9.2 依赖安装

```bash
# OCR 核心依赖
pip install pytesseract pillow

# 扫描版 PDF 解析依赖（将 PDF 转为图片后识别）
pip install pdf2image

# Windows 额外安装：Tesseract OCR 引擎（官网下载：https://github.com/UB-Mannheim/tesseract/wiki）
# Mac 额外安装：brew install tesseract
# Linux 额外安装：sudo apt-get install tesseract-ocr
```

### 9.3 实战代码（OCR 加载扫描版 PDF）

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders.image import UnstructuredImageLoader
from pdf2image import convert_from_path
import os

# 1. 定义 OCR 解析函数（将扫描版 PDF 转为图片，再识别文本）
def ocr_pdf_loader(pdf_path):
    # 临时文件夹存储 PDF 转后的图片
    temp_dir = "./temp_images"
    os.makedirs(temp_dir, exist_ok=True)
    
    # 将 PDF 每一页转为图片
    images = convert_from_path(pdf_path)
    documents = []
    
    # 逐张图片 OCR 识别
    for idx, image in enumerate(images):
        image_path = os.path.join(temp_dir, f"page_{idx+1}.png")
        image.save(image_path)
        
        # 用 UnstructuredImageLoader 加载图片并 OCR 解析
        loader = UnstructuredImageLoader(image_path)
        doc = loader.load()[0]
        
        # 补充元数据（页码、原 PDF 路径）
        doc.metadata.update({
            "source": pdf_path,
            "page": idx + 1,
            "type": "scan_pdf_ocr"
        })
        documents.append(doc)
    
    # 删除临时图片
    for file in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, file))
    os.rmdir(temp_dir)
    
    return documents

# 2. 调用 OCR 加载器解析扫描版 PDF
scan_pdf_documents = ocr_pdf_loader("./knowledge/扫描版技术手册.pdf")

# 3. 查看解析结果
print(f"扫描版 PDF 总页数：{len(scan_pdf_documents)}")
print("第1页解析内容预览：")
print(scan_pdf_documents[0].page_content[:300])
print("元数据：", scan_pdf_documents[0].metadata)
```

### 9.4 OCR 加载器避坑要点

1. **引擎安装问题**：必须安装 Tesseract OCR 引擎，否则会报错“pytesseract.pytesseract.TesseractNotFoundError”，需配置环境变量或在代码中指定引擎路径。

2. **识别精度**：模糊、倾斜、有干扰线的扫描件识别精度会下降，可先对图片进行预处理（裁剪、纠偏、去噪）后再解析。

3. **性能优化**：大体积扫描版 PDF 转图会占用较多内存，建议使用懒加载模式，逐页解析并及时清理临时文件。