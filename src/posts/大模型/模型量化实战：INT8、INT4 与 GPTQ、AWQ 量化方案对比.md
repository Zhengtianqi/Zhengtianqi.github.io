---
title: 模型量化实战：INT8、INT4 与 GPTQ、AWQ 量化方案对比
tag: ["量化", "INT8", "INT4", "GPTQ", "AWQ", "大模型部署"]
category: 大模型
date: 2026-06-27
---

# 模型量化实战：INT8、INT4 与 GPTQ、AWQ 量化方案对比

LLM 推理太贵？显存不够？量化是最直接的方案。INT8 省一半显存，INT4 省四分之三，但效果损失多少？怎么选？一篇讲透。

---

## 一、量化基础

### 1.1 什么是量化

```
FP32（32位浮点）→ INT8（8位整数）→ INT4（4位整数）

模型显存对比（7B 模型）：
  FP32:  28 GB  （4 bytes × 7B）
  FP16:  14 GB  （2 bytes × 7B）
  INT8:   7 GB  （1 byte  × 7B）
  INT4:  3.5 GB （0.5 bytes × 7B）

→ INT4 量化后，7B 模型只需 3.5GB 显存
→ 一张 4090（24GB）可以跑 70B 模型的 INT4 量化版
```

### 1.2 量化分类

```
按量化时机：
  PTQ（Post-Training Quantization）：训练后量化，不需要重新训练
  QAT（Quantization-Aware Training）：训练感知量化，需要在训练中模拟量化

按量化粒度：
  Per-Tensor：整个张量用一个 scale
  Per-Channel：每个通道一个 scale（更精确，推荐）
  Per-Group：每 N 个元素一个 scale（如 GPTQ 每 128 个）

按对称性：
  对称量化：[-127, 127]，zero_point=0
  非对称量化：[0, 255]，zero_point≠0
```

---

## 二、量化方法对比

### 2.1 方法一览

| 方法 | 精度 | 推理速度 | 效果损失 | 适用场景 |
|------|------|---------|---------|---------|
| FP16 | 16bit | 基准 | 无 | 基准 |
| INT8（W8A8） | 8bit | 1.5-2x | <1% | 生产环境推荐 |
| INT4（W4A16） | 4bit权重 | 2-3x | 1-3% | 消费级 GPU |
| GPTQ | 4bit | 2-3x | 1-2% | 通用量化 |
| AWQ | 4bit | 2-3x | 0.5-1% | 最推荐 |
| GGUF | 4-8bit | 1.5-2x | 1-3% | CPU 推理 |
| SmoothQuant | 8bit | 1.5-2x | <1% | W8A8 |

```
W8A8：权重 INT8 + 激活 INT8（推理快，需要硬件支持）
W4A16：权重 INT4 + 激活 FP16（推理稍慢，但显存省得多）
W4A8：权重 INT4 + 激活 INT8（折中方案）
```

### 2.2 选型建议

```
有 A100/H100：直接用 FP16 或 W8A8（硬件支持 INT8 矩阵乘法）
有 4090/3090：AWQ INT4（显存最优，效果损失小）
只有 CPU：GGUF Q4_K_M（llama.cpp 量化方案）
追求极致效果：FP16 或不量化
追求极致显存：INT4（GPTQ/AWQ）
```

---

## 三、GPTQ 量化

### 3.1 GPTQ 原理

```
GPTQ（GPT Quantization）：
  逐层量化，每次量化一列权重
  利用 Hessian 矩阵的逆来补偿量化误差
  将量化误差分摊到还未量化的权重上

核心思想：
  不是简单地 round(W / scale)
  而是量化一个权重后，调整其他权重来补偿误差
  → 整体输出误差最小化
```

### 3.2 GPTQ 实战

```python
# 安装
# pip install auto-gptq optimum

from transformers import AutoModelForCausalLM, AutoTokenizer
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

# 1. 准备校准数据
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2-7B")
calibration_texts = [
    "融资担保是指担保机构为被担保人向银行提供担保",
    "Java虚拟机的内存结构包括堆、栈、方法区",
    "微服务架构的核心是将单体应用拆分为多个独立服务",
    # ... 128-1024 条校准数据
]
calibration_data = tokenizer(calibration_texts, return_tensors="pt", padding=True, truncation=True, max_length=512)

# 2. 配置量化参数
quantize_config = BaseQuantizeConfig(
    bits=4,                # 4 bit 量化
    group_size=128,        # 每 128 个权重共享一个 scale
    desc_act=False,        # 是否按激活值排序量化顺序
)

# 3. 量化
model = AutoGPTQForCausalLM.from_pretrained("Qwen/Qwen2-7B", quantize_config)
model.quantize(calibration_data)

# 4. 保存
model.save_quantized("./qwen2-7b-gptq-4bit")
tokenizer.save_pretrained("./qwen2-7b-gptq-4bit")

# 5. 加载使用
quantized_model = AutoGPTQForCausalLM.from_quantized(
    "./qwen2-7b-gptq-4bit",
    device="cuda:0",
)
```

---

## 四、AWQ 量化

### 4.1 AWQ 原理

```
AWQ（Activation-aware Weight Quantization）：
  核心发现：不是所有权重都同等重要
  根据"激活值"来判断哪些权重重要（激活值大的通道对应的权重重要）
  对重要权重保持高精度，对不重要的权重量化

与 GPTQ 的区别：
  GPTQ：逐列量化 + 误差补偿
  AWQ：激活感知 + 重要性缩放

AWQ 通常比 GPTQ 效果略好，且不需要校准数据做反向传播
```

### 4.2 AWQ 实战

```python
# 安装
# pip install autoawq

from awq import AutoAWQForCausalLM
from transformers import AutoTokenizer

# 1. 加载模型
model_path = "Qwen/Qwen2-7B"
model = AutoAWQForCausalLM.from_pretrained(model_path)
tokenizer = AutoTokenizer.from_pretrained(model_path)

# 2. 准备校准数据
calibration_data = [
    "融资担保业务的核心风险包括信用风险、操作风险和市场风险",
    "Spring Boot自动配置通过SPI机制实现",
    # ...
]

# 3. 配置并量化
quant_config = {
    "zero_point": True,       # 使用零点（非对称量化）
    "q_group_size": 128,      # 分组大小
    "w_bit": 4,               # 4 bit
    "version": "GEMM",        # GEMM 适合大部分场景
}

model.quantize(tokenizer, quant_config=quant_config, calib_data=calibration_data)

# 4. 保存
model.save_quantized("./qwen2-7b-awq-4bit")
tokenizer.save_pretrained("./qwen2-7b-awq-4bit")

# 5. 加载使用
from transformers import AutoModelForCausalLM
quantized_model = AutoModelForCausalLM.from_pretrained(
    "./qwen2-7b-awq-4bit",
    device_map="auto"
)
```

---

## 五、vLLM 加载量化模型

### 5.1 vLLM + GPTQ

```python
from vllm import LLM, SamplingParams

# vLLM 原生支持 GPTQ 量化模型
llm = LLM(
    model="./qwen2-7b-gptq-4bit",
    quantization="gptq",        # 量化方式
    dtype="float16",            # 激活精度
    gpu_memory_utilization=0.9,
    max_model_len=4096,
)

sampling = SamplingParams(temperature=0.7, max_tokens=512)
output = llm.generate("解释一下融资担保的概念", sampling)
print(output[0].outputs[0].text)
```

### 5.2 vLLM + AWQ

```python
# vLLM 原生支持 AWQ
llm = LLM(
    model="./qwen2-7b-awq-4bit",
    quantization="awq",
    dtype="float16",
    gpu_memory_utilization=0.9,
)
```

### 5.3 性能对比

```bash
# vLLM benchmark
python -m vllm.entrypoints.openai.api_server \
  --model ./qwen2-7b-awq-4bit \
  --quantization awq \
  --port 8000

# 压测
# FP16: ~50 tokens/s, 14GB 显存
# INT8: ~80 tokens/s, 7GB 显存
# INT4: ~120 tokens/s, 3.5GB 显存
# INT4 比 FP16 快 2.4x，显存减少 75%
```

---

## 六、GGUF 与 llama.cpp

### 6.1 GGUF 格式

```
GGUF（GPT-Generated Unified Format）：
  llama.cpp 专用格式，支持 CPU/GPU 混合推理
  支持多种量化级别：Q2_K, Q3_K_M, Q4_K_M, Q5_K_M, Q6_K, Q8_0
  推荐用 Q4_K_M（4bit，效果和性能最佳平衡）

适用场景：
  - 没有 GPU，只有 CPU
  - Mac M1/M2（Metal 加速）
  - 混合推理（部分层在 GPU，部分在 CPU）
```

### 6.2 转换与量化

```bash
# 安装 llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# 1. 将 HF 模型转为 GGUF（FP16）
python convert_hf_to_gguf.py /path/to/Qwen2-7B --outfile qwen2-7b-fp16.gguf

# 2. 量化为 Q4_K_M
./llama-quantize qwen2-7b-fp16.gguf qwen2-7b-q4_k_m.gguf Q4_K_M

# 3. 运行
./llama-cli -m qwen2-7b-q4_k_m.gguf -p "解释融资担保" -n 512

# 4. 用 GPU 加速（如有 NVIDIA GPU）
./llama-cli -m qwen2-7b-q4_k_m.gguf -p "解释融资担保" -n 512 -ngl 32
# -ngl 32: 32 层放到 GPU 计算
```

---

## 七、量化效果评估

### 7.1 评估指标

```python
# 量化后必须评估效果损失
# 1. Perplexity（困惑度）：越低越好
# 2. 下游任务准确率：MMLU、C-Eval、GSM8K
# 3. 生成质量：人工评估或 GPT-4 评估

# Perplexity 评估
from lm_eval import simple_evaluate
results = simple_evaluate(
    model="hf",
    model_args="pretrained=./qwen2-7b-awq-4bit",
    tasks=["mmlu", "ceval-validation"],
    num_fewshot=5,
)
print(results["results"])
```

### 7.2 典型效果损失

```
模型：Qwen2-7B
                FP16    INT8    INT4(GPTQ)  INT4(AWQ)
Perplexity ↓   5.12    5.15    5.23        5.19
MMLU ↑        72.3%   72.1%   70.8%       71.5%
C-Eval ↑      78.5%   78.3%   76.9%       77.6%
GSM8K ↑       82.1%   81.8%   79.5%       80.3%

结论：
  INT8 几乎无损（<1%）
  INT4 AWQ 损失 1-2%，GPTQ 损失 2-3%
  AWQ 整体优于 GPTQ
```

---

## 八、生产环境部署建议

### 8.1 部署方案

```yaml
# 方案 1：单卡 4090 部署 7B INT4
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-serving
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        args:
        - --model
        - ./qwen2-7b-awq-4bit
        - --quantization
        - awq
        - --dtype
        - float16
        - --gpu-memory-utilization
        - "0.9"
        - --max-model-len
        - "8192"
        resources:
          limits:
            nvidia.com/gpu: 1  # 一张 4090 即可
```

### 8.2 量化选择决策树

```
有 A100/H100？
  ├─ 是 → FP16（效果最好，显存够用）
  │       或 W8A8（追求吞吐量）
  └─ 否 → 有 4090/3090？
          ├─ 是 → AWQ INT4（显存最优）
          │       7B 模型：3.5GB 显存
          │       14B 模型：7GB 显存
          │       72B 模型：36GB 显存（需 2 张 4090）
          └─ 否 → 只有 CPU/Mac？
                  └─ GGUF Q4_K_M（llama.cpp）
```

---

## 九、面试要点

### Q：INT8 和 INT4 量化有什么区别？效果损失大吗？

INT8 将权重从 FP16（2字节）压缩到 INT8（1字节），显存减半，效果损失通常 <1%。INT4 压缩到 0.5 字节，显存减少 75%，效果损失 1-3%。INT8 几乎无损，INT4 在精度敏感场景需评估。

### Q：GPTQ 和 AWQ 怎么选？

AWQ 整体优于 GPTQ：效果损失更小（AWQ 利用激活值感知权重重要性），量化速度更快，推理性能相当。如果没有特殊原因，优先选 AWQ。

### Q：量化后推理为什么可能更快？

1. 显存带宽是推理瓶颈，INT4 读取权重的数据量减少 75%
2. GPU 有 INT8 矩阵乘法单元（Tensor Core），INT8 计算比 FP16 快 2x
3. 模型小了，KV Cache 可用空间更大，并发量更高

---

## 十、总结

量化三板斧：

1. **选方法**：AWQ INT4（消费级 GPU）/ W8A8（企业级 GPU）/ GGUF（CPU）
2. **评效果**：量化后跑 Perplexity + MMLU，确保损失可接受
3. **上部署**：vLLM 加载量化模型，享受显存减少 + 吞吐提升

记住：**AWQ 优于 GPTQ，INT8 几乎无损，INT4 省 75% 显存，vLLM 原生支持量化推理**。
