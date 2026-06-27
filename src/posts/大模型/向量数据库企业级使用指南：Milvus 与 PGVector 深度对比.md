---
title: 向量数据库企业级使用指南：Milvus 与 PGVector 深度对比
tag: ["向量数据库", "Milvus", "PGVector", "RAG"]
category: 大模型
date: 2026-06-27
---

# 向量数据库企业级使用指南：Milvus 与 PGVector 深度对比

做 RAG 项目最关键的基础设施就是向量数据库。选 Milvus 还是 PGVector？不是"谁更好"的问题，而是"什么场景用什么"。

---

## 一、向量数据库核心能力

| 能力 | 说明 | 重要性 |
|------|------|--------|
| 向量索引 | HNSW、IVF、FLAT 等索引类型 | ⭐⭐⭐⭐⭐ |
| 相似度计算 | 余弦、内积、欧氏距离 | ⭐⭐⭐⭐ |
| 过滤检索 | 标量字段过滤 + 向量检索 | ⭐⭐⭐⭐⭐ |
| 分布式扩展 | 水平扩展、分片 | ⭐⭐⭐⭐ |
| 事务支持 | ACID 事务 | ⭐⭐⭐ |
| 运维成本 | 部署复杂度、监控 | ⭐⭐⭐⭐ |

---

## 二、Milvus vs PGVector 全面对比

| 维度 | Milvus | PGVector |
|------|--------|----------|
| 架构 | 分布式专用向量数据库 | PostgreSQL 扩展插件 |
| 索引类型 | HNSW、IVF_FLAT、IVF_SQ8、IVF_PQ、DiskANN | HNSW、IVF_FLAT |
| 最大向量数 | 十亿级 | 千万级（超出后性能下降） |
| 维度上限 | 32768 | 16000 |
| 标量过滤 | 丰富（字段类型齐全） | SQL WHERE（灵活强大） |
| 事务 | 不支持 ACID | 完整 ACID |
| 部署 | 独立集群（etcd + MinIO + Pulsar） | 随 PG 部署，零额外成本 |
| 运维 | 高（多组件） | 低（已有 PG 则零增量） |
| 适合场景 | 大规模向量、专用 AI 项目 | 中小规模、PG 已有栈 |

---

## 三、Milvus 实战

### 3.1 部署

```yaml
# docker-compose.yml（单机版）
version: '3.5'
services:
  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
    volumes:
      - etcd_data:/etcd
    command: etcd -advertise-client-urls=http://etcd:2379 -listen-client-urls http://0.0.0.0:2379

  minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - minio_data:/minio_data
    command: minio server /minio_data

  milvus:
    image: milvusdb/milvus:v2.4.0
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    ports:
      - "19530:19530"  # gRPC
      - "9091:9091"    # HTTP
    depends_on:
      - etcd
      - minio

volumes:
  etcd_data:
  minio_data:
```

### 3.2 Python SDK 使用

```python
from pymilvus import MilvusClient, DataType

# 1. 连接
client = MilvusClient(uri="http://localhost:19530")

# 2. 创建 Collection（带标量字段）
client.create_collection(
    collection_name="documents",
    dimension=1024,  # BGE-large 维度
    # Milvus 2.4+ Lite 模式自动创建 id + vector 字段
)

# 如果需要标量过滤，需要定义 Schema
from pymilvus import CollectionSchema, FieldSchema

fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1024),
    FieldSchema(name="doc_type", dtype=DataType.VARCHAR, max_length=64),  # 标量过滤字段
    FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="create_time", dtype=DataType.INT64),
]
schema = CollectionSchema(fields, description="文档向量库")

# 3. 创建索引
index_params = client.prepare_index_params()
index_params.add_index(
    field_name="embedding",
    index_type="HNSW",
    metric_type="COSINE",
    params={"M": 16, "efConstruction": 256}
)

# 4. 插入数据
data = [
    {"embedding": [0.1, 0.2, ...], "doc_type": "policy", "source": "doc1.pdf", "create_time": 1719500000},
    {"embedding": [0.3, 0.4, ...], "doc_type": "faq", "source": "doc2.pdf", "create_time": 1719500001},
]
client.insert(collection_name="documents", data=data)

# 5. 向量检索 + 标量过滤
results = client.search(
    collection_name="documents",
    data=[query_embedding],  # 查询向量
    filter='doc_type == "policy" and create_time > 1719400000',
    output_fields=["source", "doc_type"],
    search_params={"params": {"ef": 64}},  # HNSW 搜索参数
    limit=10
)
```

### 3.3 索引选择指南

| 索引类型 | 适合数据量 | 内存占用 | 构建速度 | 查询速度 | 适用场景 |
|---------|-----------|---------|---------|---------|---------|
| FLAT | <10万 | 低 | 快 | 暴力搜索 | 小数据集，100%召回 |
| IVF_FLAT | 10万-100万 | 中 | 中 | 快 | 中等数据，可接受轻微精度损失 |
| HNSW | 100万-1000万 | 高 | 慢 | 极快 | 大数据，低延迟 |
| IVF_SQ8 | 100万-1亿 | 低 | 中 | 快 | 内存受限场景 |
| DiskANN | 1亿+ | 低（磁盘） | 慢 | 中 | 超大规模，成本敏感 |

---

## 四、PGVector 实战

### 4.1 安装

```sql
-- PostgreSQL 15+ 已内置 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证安装
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 4.2 建表与索引

```sql
-- 1. 建表
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1024),  -- BGE-large 维度
    doc_type VARCHAR(64),
    source VARCHAR(256),
    create_time BIGINT
);

-- 2. 创建 HNSW 索引（PGVector 0.5+ 支持）
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. 或者 IVFFLAT 索引
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- lists = sqrt(行数)

-- 4. 调整搜索参数
SET hnsw.ef_search = 64;  -- 搜索时 ef 参数，越大越准但越慢
```

### 4.3 Java/Spring Boot 集成

```java
// 实体类
@Entity
@Table(name = "documents")
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String content;
    
    @Column(columnDefinition = "vector(1024)")
    private float[] embedding;  // PGVector 向量字段
    
    private String docType;
    private String source;
    private Long createTime;
}

// Repository - 原生 SQL 查询
@Repository
public class DocumentRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    public List<Document> search(float[] queryVector, String docType, int limit) {
        String vectorStr = Arrays.stream(queryVector)
            .mapToObj(String::valueOf)
            .collect(Collectors.joining(","));
        
        String sql = """
            SELECT * FROM documents 
            WHERE doc_type = :docType
            ORDER BY embedding <=> cast(:vector as vector(1024))
            LIMIT :limit
            """;
        
        return em.createNativeQuery(sql, Document.class)
            .setParameter("docType", docType)
            .setParameter("vector", "[" + vectorStr + "]")
            .setParameter("limit", limit)
            .getResultList();
    }
}
```

### 4.4 Spring AI 集成（更优雅）

```java
@Configuration
public class VectorStoreConfig {
    
    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
            .dimensions(1024)
            .distanceType(PgVectorStore.PgDistanceType.COSINE_DISTANCE)
            .indexType(PgVectorStore.PgIndexType.HNSW)
            .build();
    }
}

// 使用
@Autowired
private VectorStore vectorStore;

// 存入向量
vectorStore.add(List.of(
    new Document("担保业务流程...", Map.of("docType", "policy"))
));

// 检索
List<Document> results = vectorStore.similaritySearch(
    SearchRequest.query("担保业务流程")
        .withTopK(5)
        .withFilterExpression("docType == 'policy'")
);
```

---

## 五、选型决策框架

```
数据量 < 100万 且已有 PostgreSQL？
  → PGVector（零运维成本，SQL 过滤天然强大）
  
数据量 100万-1000万，需要高性能检索？
  → Milvus（HNSW 索引性能更好，专用优化）
  
数据量 > 1亿？
  → Milvus + DiskANN（磁盘索引，成本可控）
  
需要 ACID 事务（向量+标量一致性）？
  → PGVector（Milvus 不支持事务）
  
团队没有 K8s/DevOps 运维能力？
  → PGVector（Milvus 运维门槛较高）
  
纯 AI 项目，不需要关系型数据？
  → Milvus（专用工具做专用的事）
```

---

## 六、性能调优

### 6.1 Milvus 调优

```python
# 1. HNSW 参数调优
# M: 每个节点的最大连接数，越大越准但内存越多。推荐 16-48
# efConstruction: 构建时搜索宽度，越大越准但构建越慢。推荐 200-500
# ef: 查询时搜索宽度，越大越准但查询越慢。推荐 64-256

# 2. 分区（Partition）加速过滤
client.create_partition(collection_name="documents", partition_name="policy_docs")
# 插入时指定分区
client.insert(collection_name="documents", data=data, partition_name="policy_docs")
# 查询时指定分区，减少扫描范围
client.search(collection_name="documents", data=[q], partition_names=["policy_docs"])

# 3. 动态字段（Milvus 2.4+）
# 无需预定义 Schema，直接插入动态字段
data = [{"embedding": [...], "author": "张三", "tags": ["金融", "担保"]}]
```

### 6.2 PGVector 调优

```sql
-- 1. 选择合适的距离运算符
-- <-> : 欧氏距离
-- <#> : 负内积
-- <=> : 余弦距离（最常用）

-- 2. HNSW 参数
SET hnsw.ef_search = 128;  -- 搜索精度，64-256
-- 建索引时
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);  -- m 越大越准但索引越大

-- 3. 分区表加速过滤
CREATE TABLE documents (
    id BIGSERIAL,
    content TEXT,
    embedding vector(1024),
    doc_type VARCHAR(64)
) PARTITION BY LIST (doc_type);

CREATE TABLE documents_policy PARTITION OF documents FOR VALUES IN ('policy');
CREATE TABLE documents_faq PARTITION OF documents FOR VALUES IN ('faq');

-- 4. 批量插入优化
-- 使用 COPY 而非 INSERT
COPY documents (content, embedding, doc_type) FROM '/tmp/data.csv' WITH CSV;

-- 5. 并行查询
SET max_parallel_workers_per_gather = 4;
```

---

## 七、面试要点

### Q：Milvus 和 PGVector 怎么选？

看三个维度：
1. **数据量**：百万级以下 PGVector，亿级以上 Milvus
2. **运维能力**：有 K8s 团队选 Milvus，不想引入新组件选 PGVector
3. **事务需求**：需要向量与业务数据强一致选 PGVector，纯检索选 Milvus

### Q：HNSW 和 IVF 索引怎么选？

- **HNSW**：查询延迟低（<10ms），但内存占用高，适合对延迟敏感的场景
- **IVF**：内存占用低，但查询延迟高，适合成本敏感的大规模场景
- 生产环境推荐 HNSW，除非数据量过亿且内存受限

---

## 八、总结

向量数据库没有银弹：**PGVector 胜在简单、事务、SQL 生态；Milvus 胜在性能、规模、功能丰富**。

对大多数中型项目（百万级文档），PGVector 是最优解——零运维成本，SQL 过滤天然强大，Spring AI 原生支持。只有当你需要十亿级向量或极致检索性能时，才需要上 Milvus。
