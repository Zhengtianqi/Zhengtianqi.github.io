---
title: LLaMA-Factory 实战：低成本微调大模型的完整指南
tag: ["微调", "LLaMA-Factory", "LoRA", "大模型"]
category: 大模型
date: 2026-06-27
---

# LLaMA-Factory 实战：低成本微调大模型的完整指南

> 大语言模型是AI领域的革命性技术，它为自然语言处理和智能应用提供了强大的能力。
> 本文介绍了大模型的核心概念和应用方式，帮助你进入AI应用开发领域。

通用大模型不懂你的业务，全量微调太贵，RAG 又不够精准——LoRA 微调是性价比最高的方案。LLaMA-Factory 让微调变得像填表一样简单。

## 一、为什么选择 LLaMA-Factory

| 对比 | 全量微调 | LoRA 微调（LLaMA-Factory） | RAG |
|------|---------|---------------------------|-----|
| 显存（7B） | 80GB+ | 16GB | 不需要 |
| 效果 | 最好 | 接近全量 | 依赖检索质量 |
| 成本 | 高 | 低 | 最低 |
| 适用 | 领域适配 | 风格/格式/知识注入 | 知识问答 |

LLaMA-Factory 优势：
- **零代码**：Web UI 操作，不用写训练脚本
- **全流程**：数据准备 → 训练 → 评估 → 导出 → 部署
- **多模型**：支持 LLaMA、Qwen、ChatGLM、Mistral 等主流模型
- **多方法**：SFT、DPO、PPO、KTO 全支持

## 二、环境搭建

### 2.1 安装

```bash
# 克隆项目
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory

# 安装依赖（建议用 conda）
conda create -n llama-factory python=3.10
conda activate llama-factory
pip install -e ".[torch,metrics]"

# 如果要用量化（QLoRA）
pip install bitsandbytes

# 启动 Web UI
llamafactory-cli webui
# 访问 http://localhost:7860
```

### 2.2 硬件需求

| 模型大小 | 全量微调 | LoRA | QLoRA (4bit) |
|---------|---------|------|-------------|
| 1.5B | 8GB | 4GB | 2GB |
| 7B | 80GB | 16GB | 8GB |
| 13B | 160GB | 32GB | 16GB |
| 72B | 4x80GB | 80GB | 40GB |

> 7B 模型用 QLoRA，一张 RTX 4090（24GB）就够。

## 三、数据准备

### 3.1 数据格式

LLaMA-Factory 支持 Alpaca 格式和 ShareGPT 格式：

```json
// alpaca 格式（SFT 微调）
[
  {
    "instruction": "解释什么是融资担保",
    "input": "",
    "output": "融资担保是指担保人为借款人向贷款人提供担保，当借款人不能按期偿还贷款时，由担保人代为偿还的法律行为。"
  },
  {
    "instruction": "根据以下信息计算担保费",
    "input": "担保金额：500万元，担保费率：1.5%",
    "output": "担保费 = 担保金额 × 担保费率 = 500万 × 1.5% = 7.5万元"
  }
]

// sharegpt 格式（多轮对话）
[
  {
    "conversations": [
      {"from": "human", "value": "什么是反担保？"},
      {"from": "gpt", "value": "反担保是指第三人为债务人提供担保的同时，要求债务人或其他人向其提供担保的行为..."},
      {"from": "human", "value": "常见的反担保方式有哪些？"},
      {"from": "gpt", "value": "常见的反担保方式包括：1. 保证担保 2. 抵押担保 3. 质押担保 4. 留置 5. 定金"}
    ]
  }
]
```

### 3.2 数据集注册

```python
# 在 LLaMA-Factory/data/dataset_info.json 中注册自定义数据集
{
  "guarantee_sft": {
    "file_name": "guarantee_train.json",
    "columns": {
      "prompt": "instruction",
      "query": "input",
      "response": "output"
    }
  },
  "guarantee_sharegpt": {
    "file_name": "guarantee_sharegpt.json",
    "formatting": "sharegpt",
    "columns": {
      "messages": "conversations"
    }
  }
}

// 把训练数据放到 LLaMA-Factory/data/ 目录下
```

### 3.3 数据质量指南

```python
# 数据量：500-5000 条足够 LoRA 微调
# 质量 > 数量：1000 条高质量数据 > 10000 条低质量数据

# 好的数据示例（详细、准确、格式一致）
{
  "instruction": "分析以下担保业务的风险点",
  "input": "客户A申请融资担保500万，企业经营正常但负债率85%，反担保为信用担保",
  "output": "风险分析：\n1. 负债率风险：企业负债率85%，高于行业警戒线70%，偿债能力存在隐患\n2. 反担保风险：信用担保无实物抵押，风险缓释能力弱\n3. 建议：要求增加不动产抵押或第三方保证作为反担保补充措施"
}

# 坏的数据示例（简短、不一致）
{
  "instruction": "担保风险",
  "input": "",
  "output": "有风险"  # 太简短，模型学不到东西
}
```

## 四、LoRA 微调实战

### 4.1 命令行方式

```bash
llamafactory-cli train \
  --stage sft \
  --model_name_or_path /models/Qwen2.5-7B-Instruct \
  --dataset guarantee_sft \
  --finetuning_type lora \
  --lora_target q_proj,v_proj,k_proj,o_proj \
  --lora_rank 8 \
  --lora_alpha 16 \
  --output_dir ./output/guarantee-lora \
  --num_train_epochs 3 \
  --per_device_train_batch_size 4 \
  --gradient_accumulation_steps 4 \
  --learning_rate 5e-5 \
  --cutoff_len 2048 \
  --bf16 True \
  --logging_steps 10 \
  --save_steps 200
```

### 4.2 关键参数说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| lora_target | LoRA 应用的层 | q_proj,v_proj,k_proj,o_proj（attention 层） |
| lora_rank | LoRA 秩 | 8（轻量）或 16（更强） |
| lora_alpha | LoRA 缩放系数 | rank 的 2 倍 |
| learning_rate | 学习率 | 5e-5（LoRA）或 1e-4（QLoRA） |
| num_train_epochs | 训练轮数 | 3-10 |
| per_device_train_batch_size | 每卡 batch size | 4-8（根据显存调整） |
| gradient_accumulation_steps | 梯度累积 | 4（等于全局 batch = 4*4=16） |
| cutoff_len | 最大序列长度 | 2048（长文本可调大） |

### 4.3 QLoRA（4bit 量化微调）

```bash
llamafactory-cli train \
  --stage sft \
  --model_name_or_path /models/Qwen2.5-7B-Instruct \
  --dataset guarantee_sft \
  --finetuning_type lora \
  --quantization_bit 4 \
  --quantization_method bitsandbytes \
  --lora_target q_proj,v_proj,k_proj,o_proj \
  --lora_rank 8 \
  --lora_alpha 16 \
  --output_dir ./output/guarantee-qlora \
  --num_train_epochs 3 \
  --per_device_train_batch_size 2 \
  --gradient_accumulation_steps 8 \
  --learning_rate 1e-4 \
  --cutoff_len 2048 \
  --bf16 True
# 7B 模型只需 8GB 显存！
```

## 五、模型评估

```bash
# 用微调后的模型做推理测试
llamafactory-cli chat \
  --model_name_or_path /models/Qwen2.5-7B-Instruct \
  --adapter_name_or_path ./output/guarantee-lora \
  --template qwen \
  --finetuning_type lora

# 交互式对话测试
# >>> 什么是融资担保？
# （模型用微调知识回答）
```

## 六、模型导出与部署

### 6.1 导出合并模型

```bash
# 将 LoRA 权重合并到基础模型，导出完整模型
llamafactory-cli export \
  --model_name_or_path /models/Qwen2.5-7B-Instruct \
  --adapter_name_or_path ./output/guarantee-lora \
  --template qwen \
  --finetuning_type lora \
  --export_dir ./output/guarantee-7b-merged
# 导出后可以直接用 vLLM 部署
```

### 6.2 vLLM 部署

```bash
# 用导出的合并模型启动 vLLM 服务
docker run --gpus all -p 8000:8000 \
  -v ./output/guarantee-7b-merged:/models/guarantee-7b \
  vllm/vllm-openai:latest \
  --model /models/guarantee-7b \
  --max-model-len 4096 \
  --enable-prefix-caching
```

## 七、微调效果优化

### 7.1 常见问题与解决

| 问题 | 原因 | 解决 |
|------|------|------|
| 过拟合（训练集好测试集差） | 数据太少 / epoch 太多 | 增加数据量 / 减少 epoch / 加 early stopping |
| 欠拟合（训练集都不好） | 学习率太低 / 数据质量差 | 调大 lr / 检查数据质量 |
| 灾难性遗忘（通用能力丢失） | LoRA rank 太高 / 数据太偏 | 降 rank / 混入通用数据 |
| 输出格式不稳定 | 数据格式不一致 | 统一数据格式 / 增加格式指令 |

### 7.2 数据混合策略

```python
# 混入通用数据防止灾难性遗忘
# 比例：业务数据 70% + 通用数据 30%
{
  "guarantee_mixed": {
    "file_name": "guarantee_train.json",  # 业务数据 700 条
  },
  "alpaca_gpt4_zh": {
    # LLaMA-Factory 内置的通用中文数据集
    # 从中采样 300 条混合
  }
}

# 训练时指定多个数据集
--dataset guarantee_sft,alpaca_gpt4_zh
```

### 7.3 LoRA 层选择

```bash
# 只微调 attention 层（基础）
--lora_target q_proj,v_proj,k_proj,o_proj

# 微调 attention + MLP 层（更强，但参数更多）
--lora_target q_proj,v_proj,k_proj,o_proj,gate_proj,up_proj,down_proj

# 全层 LoRA（最强，接近全量微调效果）
--lora_target all
```

## 八、面试要点

### Q：LoRA 微调的原理是什么？

LoRA（Low-Rank Adaptation）冻结预训练模型权重，在每层旁边增加一个低秩矩阵对（A 和 B，秩为 r）。训练时只更新 A 和 B，推理时 W' = W + B*A。因为 r 远小于原始维度（如 r=8 vs d=4096），参数量减少 99%+，显存大幅降低。

### Q：LoRA 和 QLoRA 的区别？

LoRA 在原始精度（FP16）上训练；QLoRA 先把基础模型量化到 4bit，再在量化模型上做 LoRA 微调。QLoRA 进一步降低显存（7B 模型从 16GB → 8GB），但会有轻微精度损失。

### Q：微调和 RAG 怎么选？

- **RAG**：知识频繁更新、需要可追溯来源、数据量大 → 实时性要求高
- **微调**：需要特定输出格式、风格定制、领域术语理解 → 精度要求高
- **组合**：微调让模型懂领域语言 + RAG 提供最新知识 → 最佳实践

## 九、总结

LLaMA-Factory 让微调变得简单，但**数据质量才是决定效果的关键**。

记住：
1. 数据：500-5000 条高质量数据，格式一致，混入通用数据防遗忘
2. 参数：LoRA rank 8-16，lr 5e-5，3-10 epoch
3. 流程：数据准备 → LoRA 微调 → 评估 → 导出合并 → vLLM 部署
4. 优化：效果不好先看数据，再调参数，最后换模型
