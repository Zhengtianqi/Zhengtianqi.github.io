---
title: vLLM 与 PagedAttention：大模型高性能推理服务实战
tag: ["vLLM", "推理优化", "大模型部署"]
category: 大模型
date: 2026-06-27
---

# vLLM 与 PagedAttention：大模型高性能推理服务实战

自己部署大模型，最痛的就是推理慢、显存不够。vLLM 凭借 PagedAttention 技术，吞吐量比 HuggingFace Transformers 高 24 倍，是目前最主流的开源推理框架。

---

## 一、为什么需要 vLLM

### 1.1 原生推理的问题

```
HuggingFace Transformers 原生推理：
  - 每个 request 预分配最大 KV Cache 空间（如 2048 tokens）
  - 实际只用了 200 tokens → 90% 显存浪费
  - 无法批量并发：每个 request 独占显存
  - 吞吐量：~50 tokens/s（7B 模型，A10 GPU）
```

### 1.2 vLLM 的解决方案

| 技术 | 说明 | 效果 |
|------|------|------|
| PagedAttention | KV Cache 分页管理（类似操作系统的虚拟内存） | 显存利用率从 20% → 90%+ |
| Continuous Batching | 动态批处理，新请求随时加入 | 吞吐量提升 8-24 倍 |
| Prefix Caching | 共享前缀缓存 | 多轮对话场景延迟降低 50% |
| Tensor Parallelism | 张量并行 | 多 GPU 支持大模型 |

---

## 二、部署实战

### 2.1 Docker 部署（推荐）

```bash
# 拉取镜像
docker pull vllm/vllm-openai:latest

# 启动服务（兼容 OpenAI API 格式）
docker run --gpus all -p 8000:8000 \
  -v /data/models:/models \
  vllm/vllm-openai:latest \
  --model /models/Qwen2.5-7B-Instruct \
  --served-model-name qwen-7b \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9 \
  --tensor-parallel-size 1 \
  --enable-prefix-caching
```

### 2.2 关键参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| --model | 模型路径 | 本地路径或 HuggingFace ID |
| --max-model-len | 最大上下文长度 | 32768（根据显存调整） |
| --gpu-memory-utilization | GPU 显存使用率 | 0.9（留 10% 给系统） |
| --tensor-parallel-size | 张量并行数 | GPU 数量 |
| --enable-prefix-caching | 前缀缓存 | 多轮对话必开 |
| --quantization | 量化 | awq / gptq / fp8 |
| --max-num-seqs | 最大并发序列 | 256（根据显存调整） |
| --swap-space | CPU 交换空间（GB） | 4 |

### 2.3 Python API 调用

```python
from openai import OpenAI

# vLLM 兼容 OpenAI API
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy"  # vLLM 默认不验证 key
)

# Chat 补全
response = client.chat.completions.create(
    model="qwen-7b",
    messages=[
        {"role": "system", "content": "你是一个担保业务助手。"},
        {"role": "user", "content": "什么是融资担保？"}
    ],
    temperature=0.7,
    max_tokens=512,
)
print(response.choices[0].message.content)

# 流式输出
stream = client.chat.completions.create(
    model="qwen-7b",
    messages=[{"role": "user", "content": "写一段担保业务介绍"}}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## 三、PagedAttention 原理

### 3.1 传统 KV Cache 的问题

```
传统方式：为每个请求预分配连续的 KV Cache 空间

Request 1: [KV Cache: 2048 slots]  实际用了 200  →  浪费 1848 slots
Request 2: [KV Cache: 2048 slots]  实际用了 500  →  浪费 1548 slots
Request 3: [KV Cache: 2048 slots]  实际用了 1000 →  浪费 1048 slots

显存碎片严重，无法并发更多请求
```

### 3.2 PagedAttention 的分页管理

```
vLLM：将 KV Cache 分成固定大小的 Block（如 16 tokens/block）

物理显存：
Block 0: [Req1 token 0-15]
Block 1: [Req1 token 16-31]  [Req2 token 0-15 的部分]
Block 2: [Req2 token 16-31]
Block 3: [Req3 token 0-15]
Block 4: [空闲]

每个请求维护一个 Block Table（类似页表）：
Req1 → [Block 0, Block 1]
Req2 → [Block 2]
Req3 → [Block 3]

优势：
1. 按需分配，不预分配 → 显存利用率 90%+
2. 无碎片 → 可以并发更多请求
3. Block 可共享 → 前缀缓存天然支持
```

---

## 四、性能调优

### 4.1 量化部署

```bash
# AWQ 量化（推荐，精度损失小）
docker run --gpus all -p 8000:8000 \
  -v /data/models:/models \
  vllm/vllm-openai:latest \
  --model /models/Qwen2.5-7B-Instruct-AWQ \
  --quantization awq \
  --max-model-len 32768

# GPTQ 量化
--quantization gptq

# FP8 量化（H100 GPU 支持）
--quantization fp8
```

量化效果对比：

| 精度 | 显存（7B模型） | 吞吐量 | 精度损失 |
|------|--------------|--------|---------|
| FP16 | 14GB | 1x | 基准 |
| AWQ-INT4 | 5GB | 2x | <1% |
| GPTQ-INT4 | 5GB | 1.8x | 1-2% |
| FP8 | 7GB | 1.5x | <0.5% |

### 4.2 前缀缓存

```python
# 多轮对话场景，System Prompt 和历史对话是重复前缀
# 开启 --enable-prefix-caching 后，vLLM 会自动缓存已计算的 KV

# 第一次请求（会缓存 System Prompt 的 KV）
response1 = client.chat.completions.create(
    model="qwen-7b",
    messages=[
        {"role": "system", "content": "你是一个担保业务助手，以下是大段系统提示...（2000 tokens）"},
        {"role": "user", "content": "什么是融资担保？"}
    ]
)

# 第二次请求（System Prompt 的 KV 直接复用，节省 2000 tokens 的计算）
response2 = client.chat.completions.create(
    model="qwen-7b",
    messages=[
        {"role": "system", "content": "你是一个担保业务助手，以下是大段系统提示...（2000 tokens）"},
        {"role": "user", "content": "什么是融资担保？"},  # 历史对话
        {"role": "assistant", "content": "融资担保是..."},
        {"role": "user", "content": "反担保呢？"}  # 新问题
    ]
)
# 第二次请求的前 2000+ tokens 都走缓存，首 token 延迟从 800ms → 200ms
```

### 4.3 多 GPU 张量并行

```bash
# 双 GPU 张量并行
docker run --gpus all -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model /models/Qwen2.5-72B-Instruct-AWQ \
  --tensor-parallel-size 2 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.9

# 72B 模型 AWQ 量化后约 36GB，单卡 A100 80G 可跑
# 但双卡张量并行可以显著降低延迟
```

---

## 五、生产环境部署架构

### 5.1 负载均衡

```yaml
# Nginx 负载均衡配置
upstream vllm_backend {
    server gpu-node-1:8000 max_fails=3 fail_timeout=30s;
    server gpu-node-2:8000 max_fails=3 fail_timeout=30s;
    server gpu-node-3:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location /v1/ {
        proxy_pass http://vllm_backend;
        proxy_set_header Host $host;
        proxy_read_timeout 300s;  # LLM 生成可能较慢
    }
    
    location /health {
        proxy_pass http://vllm_backend/health;
    }
}
```

### 5.2 K8s 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-qwen-7b
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vllm-qwen-7b
  template:
    metadata:
      labels:
        app: vllm-qwen-7b
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        args:
          - --model=/models/Qwen2.5-7B-Instruct
          - --max-model-len=32768
          - --gpu-memory-utilization=0.9
          - --enable-prefix-caching
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: 32Gi
          requests:
            nvidia.com/gpu: 1
            memory: 16Gi
        volumeMounts:
        - name: model-volume
          mountPath: /models
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 120  # 模型加载需要时间
          periodSeconds: 10
      volumes:
      - name: model-volume
        persistentVolumeClaim:
          claimName: model-pvc
```

### 5.3 监控

```python
# vLLM 内置 Prometheus 指标
# 访问 http://localhost:8000/metrics

# 关键指标：
# vllm:num_requests_running    正在运行的请求数
# vllm:num_requests_waiting    排队等待的请求数
# vllm:gpu_cache_usage_perc    KV Cache 使用率
# vllm:time_to_first_token_seconds  首 Token 延迟
# vllm:time_per_output_token_seconds  生成每个 Token 的时间
# vllm:e2e_request_latency_seconds   端到端延迟
```

Grafana 告警规则：

| 指标 | 告警阈值 | 说明 |
|------|---------|------|
| gpu_cache_usage_perc | > 0.9 | KV Cache 快满了，需要扩容 |
| num_requests_waiting | > 10 | 排队过多，需要扩容 |
| time_to_first_token_seconds | > 2s | 首 Token 延迟过高 |
| e2e_request_latency_seconds | > 30s | 端到端延迟过高 |

---

## 六、面试要点

### Q：vLLM 为什么比 Transformers 快？

核心是 PagedAttention 技术：将 KV Cache 分成固定大小的 Block 按需分配，避免了传统方式预分配连续空间的浪费。显存利用率从 20% 提升到 90%+，从而可以并发更多请求。加上 Continuous Batching 动态批处理，吞吐量提升 8-24 倍。

### Q：7B 模型部署需要多大显存？

- FP16：约 14GB（模型权重 7GB + KV Cache 7GB）
- AWQ-INT4：约 8GB（模型权重 4GB + KV Cache 4GB）
- 建议用 A10（24GB）或 RTX 4090（24GB）部署 7B 模型

### Q：如何选择量化方案？

- **AWQ**：精度损失最小（<1%），推荐生产使用
- **GPTQ**：略快但精度损失稍大（1-2%）
- **FP8**：H100 专属，性能和精度的最佳平衡
- **GGUF**：CPU 推理用，GPU 不推荐

---

## 七、总结

vLLM 是目前大模型推理部署的事实标准。记住三个关键优化：

1. **PagedAttention**：分页管理 KV Cache，显存利用率最大化
2. **Continuous Batching**：动态批处理，吞吐量最大化
3. **Prefix Caching**：前缀缓存，多轮对话延迟最小化

生产部署核心参数：`--gpu-memory-utilization 0.9 --enable-prefix-caching --quantization awq`
