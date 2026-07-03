---
title: "DPO vs RLHF vs PPO：大模型对齐算法深度对比"
tag: ["RLHF", "DPO", "PPO", "对齐", "强化学习", "SFT"]
category: 大模型
date: 2026-07-03
---

# DPO vs RLHF vs PPO：大模型对齐算法深度对比

> "让模型变聪明靠预训练，让模型变乖靠对齐。但对齐这条路，有人走了三步，有人只走了一步。"

## 引言：为什么需要对齐？

大模型预训练后，虽然具备了海量知识，但有三个问题：

1. **不对齐人类意图**：你问"请帮我写一封邮件"，它可能继续补全为"请帮我写一封辞职信的模板……"
2. **可能产生有害内容**：没有安全护栏，模型可能输出歧视、暴力等有害内容
3. **不会拒绝**：面对超出能力范围的请求，不会说"我不知道"

**对齐（Alignment）** 的目标就是让模型的行为与人类期望一致：有帮助（Helpful）、诚实（Honest）、无害（Harmless）—— 即 **HHH 原则**。

目前主流对齐方法有三条路线：

```
┌─────────────────────────────────────────────────────┐
│                 大模型对齐方法谱系                    │
├──────────────┬──────────────────────────────────────┤
│  RLHF + PPO  │ 三阶段：SFT → RM → PPO              │
│              │ 效果最好，工程最复杂                  │
├──────────────┼──────────────────────────────────────┤
│  DPO         │ 两阶段：SFT → DPO                   │
│              │ 绕过奖励模型和 RL，简化训练           │
├──────────────┼──────────────────────────────────────┤
│  RLHF 变体   │ KTO / IPO / ORPO 等                  │
│              │ 在 DPO 基础上进一步简化或改进         │
└──────────────┴──────────────────────────────────────┘
```

## 一、RLHF 三阶段：SFT → RM → PPO

### 1.1 整体流程

RLHF（Reinforcement Learning from Human Feedback）是最经典的对齐方法，由 OpenAI 在 InstructGPT 论文中提出，GPT-3.5/4 的核心训练方法：

```
┌──────────────────────────────────────────────────────────────┐
│                    RLHF 三阶段流程                            │
│                                                              │
│  阶段1: SFT (Supervised Fine-Tuning)                         │
│  ┌──────────┐    高质量指令数据    ┌──────────────┐         │
│  │ 预训练模型 │ ──────────────────► │ SFT 模型      │         │
│  └──────────┘                     └──────┬───────┘         │
│                                           │                  │
│  阶段2: RM (Reward Model)                ▼                  │
│  ┌──────────────┐   偏好数据     ┌──────────────┐         │
│  │ 人工标注偏好   │ ────────────► │ 奖励模型 RM    │         │
│  │ (A好还是B好)   │               │ 给回答打分     │         │
│  └──────────────┘               └──────┬───────┘         │
│                                         │                    │
│  阶段3: PPO (Proximal Policy Optimization)                   │
│  ┌──────────────┐   RM 打分      ┌──────────────┐         │
│  │ SFT 模型      │ ◄──────────── │ 奖励模型      │         │
│  │ (策略网络)     │               └──────────────┘         │
│  │               │                                        │
│  │  生成回答 → RM打分 → 计算奖励 → 更新策略                  │
│  └───────────────┘                                        │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                        │
│  │ 对齐后的模型   │                                        │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 阶段一：SFT（监督微调）

SFT 是用高质量的指令-回答对来微调预训练模型：

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTTrainer, SFTConfig
from datasets import Dataset

# 准备 SFT 数据
sft_data = [
    {
        "instruction": "解释什么是递归",
        "input": "",
        "output": "递归是一种编程技巧，函数在执行过程中调用自身..."
    },
    {
        "instruction": "写一个 Python 冒泡排序",
        "input": "",
        "output": "def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr"
    }
]

dataset = Dataset.from_list(sft_data)

# 使用 Alpaca 模板格式化
def format_prompt(example):
    prompt = f"""### Instruction:
{example['instruction']}

### Response:
{example['output']}"""
    return {"text": prompt}

dataset = dataset.map(format_prompt)

# 训练
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

config = SFTConfig(
    output_dir="./sft-model",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    max_seq_length=2048,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=config,
)
trainer.train()
```

### 1.3 阶段二：训练奖励模型（RM）

奖励模型学习人类偏好：给定一个问题和两个回答，判断哪个更好。

```python
"""
奖励模型训练
数据格式：(prompt, chosen_response, rejected_response)
"""
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from trl import RewardTrainer, RewardConfig
from datasets import Dataset

# 偏好数据
preference_data = [
    {
        "prompt": "如何学习编程？",
        "chosen": "学习编程的建议路径：\n1. 选择一门入门语言（推荐 Python）\n2. 掌握基础语法\n3. 做小项目练习\n4. 学习数据结构和算法\n5. 参与开源项目",
        "rejected": "你问怎么学编程？随便学呗，反正也不难。"
    },
    {
        "prompt": "什么是闭包？",
        "chosen": "闭包是指一个函数能够访问其外部作用域中的变量，即使外部函数已经返回。在 JavaScript 中：\n```js\nfunction outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    return count;\n  };\n}\n```\n这里 inner 就是闭包，它捕获了 outer 的 count 变量。",
        "rejected": "闭包就是一个函数里面套另一个函数。"
    }
]

dataset = Dataset.from_list(preference_data)

# 奖励模型通常是 SequenceClassification（输出一个标量分数）
rm_model = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3-8B",
    num_labels=1,  # 输出单个奖励分数
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

config = RewardConfig(
    output_dir="./reward-model",
    num_train_epochs=1,
    per_device_train_batch_size=2,
    learning_rate=5e-6,
    gradient_accumulation_steps=8,
    max_length=2048,
)

trainer = RewardTrainer(
    model=rm_model,
    args=config,
    train_dataset=dataset,
)
trainer.train()

# 奖励模型的使用方式
def get_reward(prompt, response):
    """给定 prompt 和 response，返回奖励分数"""
    inputs = tokenizer(prompt + response, return_tensors="pt", truncation=True, max_length=2048)
    with torch.no_grad():
        reward = rm_model(**inputs).logits[0, 0]
    return reward.item()
```

**RM 训练的损失函数**：

```
L_RM = -log(σ(r(x, y_chosen) - r(x, y_rejected)))

其中：
- r(x, y) 是奖励模型对 (prompt=x, response=y) 的打分
- σ 是 sigmoid 函数
- 目标：让好回答的分数高于差回答
```

### 1.4 阶段三：PPO 训练

PPO 是最复杂的阶段，涉及 4 个模型：

```
┌─────────────────────────────────────────────────────┐
│                  PPO 训练架构                        │
│                                                     │
│  ┌─────────────┐     ┌─────────────┐              │
│  │ Policy Model │     │  RM (冻结)   │              │
│  │ (SFT 初始化)  │     │  给回答打分   │              │
│  │  正在训练     │     │              │              │
│  └──────┬──────┘     └──────┬──────┘              │
│         │                   │                       │
│         │ 生成回答            │ 打分                  │
│         ▼                   ▼                       │
│  ┌─────────────┐     ┌─────────────┐              │
│  │ Reference    │     │ Value Model  │              │
│  │ Model (冻结)  │     │ (策略初始化)  │              │
│  │ 计算 KL 惩罚  │     │ 预估状态价值  │              │
│  └─────────────┘     └─────────────┘              │
│                                                     │
│  总共 4 个模型在显存中！                              │
└─────────────────────────────────────────────────────┘
```

```python
"""
PPO 训练完整流程
使用 TRL 库
"""
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

# ── 1. 加载 4 个模型 ──

# (1) Policy Model（要训练的）
policy_model = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-model")

# (2) Reference Model（冻结，计算 KL 散度）
ref_model = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-model")

# (3) Reward Model（冻结，打分）
rm_model = AutoModelForSequenceClassification.from_pretrained("./reward-model")

# (4) Value Model 已内嵌在 Policy Model 中（ValueHead）

# ── 2. PPO 配置 ──
ppo_config = PPOConfig(
    batch_size=64,
    mini_batch_size=16,
    learning_rate=5e-7,  # PPO 学习率要很小
    ppo_epochs=4,         # 每批数据训练 4 轮
    kl_penalty="kl",      # KL 散度惩罚
    target_kl=6.0,        # 目标 KL 值
    init_kl_coef=0.2,     # KL 惩罚系数
    adap_kl_ctrl=True,    # 自适应 KL 控制
    cliprange=0.2,        # PPO 裁剪范围
    vf_coef=0.1,          # Value 函数损失系数
)

# ── 3. 准备数据 ──
prompts = [
    "请解释什么是递归",
    "写一个 Python 快速排序",
    # ...
]

# ── 4. PPO 训练循环 ──
tokenizer = AutoTokenizer.from_pretrained("./sft-model")
ppo_trainer = PPOTrainer(
    config=ppo_config,
    model=policy_model,
    ref_model=ref_model,
    tokenizer=tokenizer,
    dataset=prompt_dataset,
)

for batch in ppo_trainer.dataloader:
    # 步骤 1: Policy 生成回答
    response_tensors = ppo_trainer.generate(
        batch["input_ids"],
        max_new_tokens=256,
        do_sample=True,
        top_p=0.9,
        temperature=0.7,
    )
    responses = [tokenizer.decode(r, skip_special_tokens=True) for r in response_tensors]

    # 步骤 2: RM 打分
    rewards = []
    for prompt, response in zip(batch["query"], responses):
        reward = get_reward_from_rm(rm_model, prompt, response)
        rewards.append(torch.tensor(reward))

    # 步骤 3: PPO 更新（内部计算 KL 惩罚 + 裁剪）
    stats = ppo_trainer.step(
        batch["input_ids"],
        response_tensors,
        rewards
    )

    # 打印训练统计
    print(f"KL: {stats['objective/kl']:.4f}")
    print(f"Reward: {stats['ppo/mean_scores']:.4f}")
    print(f"Loss: {stats['ppo/loss']:.4f}")
```

**PPO 的核心公式**：

```
PPO 损失 = min(
    ratio * advantage,
    clip(ratio, 1-ε, 1+ε) * advantage
) - β * KL(π_new || π_ref)

其中：
- ratio = π_new(a|s) / π_old(a|s)   新旧策略的概率比
- advantage = R(s,a) - V(s)          优势函数
- ε = 0.2                            裁剪范围
- β * KL                             KL 惩罚，防止偏离参考模型太远
```

## 二、PPO 算法原理详解

### 2.1 为什么用 PPO 而不是普通 Policy Gradient？

普通 Policy Gradient 的问题：

```
┌─────────────────────────────────────────────────┐
│  普通 Policy Gradient 的更新步长不固定           │
│                                                 │
│  如果步长太大：策略崩溃，性能骤降后无法恢复      │
│  如果步长太小：训练太慢                          │
│                                                 │
│  PPO 的核心思想：限制策略更新幅度                 │
│  → ratio 裁剪确保新策略不偏离旧策略太远           │
└─────────────────────────────────────────────────┘
```

### 2.2 PPO 的优势估计

```python
"""
优势函数计算（GAE: Generalized Advantage Estimation）
"""
def compute_gae(rewards, values, gamma=0.99, lam=0.95):
    """
    GAE 计算
    rewards: 每步的奖励 [r1, r2, ..., rT]
    values:  Value Model 对每步的估值 [v1, v2, ..., vT]
    gamma:   折扣因子
    lam:     GAE 参数，控制 bias-variance 权衡
    """
    T = len(rewards)
    advantages = [0] * T
    last_gae = 0

    for t in reversed(range(T)):
        if t == T - 1:
            next_value = 0  # 终止状态
        else:
            next_value = values[t + 1]

        delta = rewards[t] + gamma * next_value - values[t]
        last_gae = delta + gamma * lam * last_gae
        advantages[t] = last_gae

    returns = [adv + val for adv, val in zip(advantages, values)]
    return advantages, returns

# 示例
rewards = [0.0, 0.0, 0.0, 1.0]  # 前 3 步无奖励，最后一步获得奖励
values =  [0.2, 0.4, 0.7, 0.9]  # Value Model 的预估

advantages, returns = compute_gae(rewards, values)
print(f"Advantages: {advantages}")  # 优势函数
print(f"Returns: {returns}")        # 目标回报
```

### 2.3 PPO 完整损失函数

```python
def ppo_loss(
    old_log_probs,  # 旧策略的 log π(a|s)
    new_log_probs,  # 新策略的 log π(a|s)
    advantages,     # 优势函数
    returns,        # 目标回报
    old_values,     # 旧 Value 预估
    cliprange=0.2,  # 裁剪范围
    vf_coef=0.1,    # Value 损失系数
    kl_coef=0.2,    # KL 惩罚系数
):
    # 1. Policy Loss（策略损失）
    ratio = torch.exp(new_log_probs - old_log_probs)
    surrogate1 = ratio * advantages
    surrogate2 = torch.clamp(ratio, 1 - cliprange, 1 + cliprange) * advantages
    policy_loss = -torch.min(surrogate1, surrogate2).mean()

    # 2. Value Loss（价值损失）
    value_pred = old_values  # 简化，实际用新 Value
    value_loss = 0.5 * (returns - value_pred).pow(2).mean()

    # 3. KL 惩罚
    kl = (old_log_probs - new_log_probs).mean()

    # 总损失
    total_loss = policy_loss + vf_coef * value_loss + kl_coef * kl
    return total_loss, policy_loss, value_loss, kl
```

## 三、DPO：绕过奖励模型直接优化

### 3.1 DPO 的核心洞察

DPO（Direct Preference Optimization）的核心思想来自于一个数学发现：

**RLHF 的最优策略可以显式地用奖励函数表示**：

```
π*(y|x) = (1/Z(x)) * π_ref(y|x) * exp(r(x,y) / β)

其中 Z(x) 是归一化因子
```

反过来，奖励函数可以用策略表示：

```
r(x,y) = β * log(π*(y|x) / π_ref(y|x)) + β * log(Z(x))
```

**关键洞察**：把这个奖励函数代入 RM 的训练目标（让好回答分数高于差回答），可以直接得到一个只用策略模型的损失函数，**不需要显式的奖励模型**！

```
┌─────────────────────────────────────────────────┐
│              DPO 的简化逻辑                      │
│                                                 │
│  RLHF:  SFT → 训练 RM → PPO 训练 Policy         │
│         (3 阶段, 4 个模型)                       │
│                                                 │
│  DPO:   SFT → DPO 直接优化 Policy               │
│         (2 阶段, 2 个模型: Policy + Reference)   │
│                                                 │
│  省去了: RM 训练 + RL 训练循环                   │
└─────────────────────────────────────────────────┘
```

### 3.2 DPO 损失函数

```
L_DPO = -log σ(β * [log(π_θ(y_w|x)/π_ref(y_w|x)) - log(π_θ(y_l|x)/π_ref(y_l|x))])

其中：
- y_w: 偏好的回答（chosen）
- y_l: 不偏好的回答（rejected）
- π_θ: 当前策略（正在训练）
- π_ref: 参考策略（SFT 模型，冻结）
- β: 温度参数，控制偏离参考模型的程度
- σ: sigmoid 函数
```

直觉理解：**让 Policy 在好回答上的概率比 Reference 高，在差回答上的概率比 Reference 低。**

### 3.3 DPO 代码实现

```python
"""
DPO 训练完整实现
"""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOTrainer, DPOConfig
from datasets import Dataset

# ── 1. 准备偏好数据 ──
preference_data = [
    {
        "prompt": "如何学习机器学习？",
        "chosen": "学习机器学习的系统路径：\n1. 数学基础：线性代数、概率统计、微积分\n2. 编程基础：Python + NumPy/Pandas\n3. 经典教材：《机器学习》周志华、《PRML》\n4. 实践：Kaggle 比赛、复现经典论文\n5. 深入：阅读最新顶会论文",
        "rejected": "买本书看就行了。"
    },
    {
        "prompt": "解释梯度下降",
        "chosen": "梯度下降是一种优化算法，通过沿着损失函数梯度的反方向更新参数来最小化损失。\n\n数学表达：θ = θ - η * ∇L(θ)\n\n其中 θ 是参数，η 是学习率，∇L(θ) 是损失函数对参数的梯度。\n\n类比：站在山上，每一步沿最陡的方向往下走。",
        "rejected": "梯度下降就是往下走。"
    }
]

dataset = Dataset.from_list(preference_data)

# ── 2. 加载模型 ──
# Policy Model（要训练的）
model = AutoModelForCausalLM.from_pretrained(
    "./sft-model",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# Reference Model（冻结，用于计算概率比）
ref_model = AutoModelForCausalLM.from_pretrained(
    "./sft-model",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

tokenizer = AutoTokenizer.from_pretrained("./sft-model")

# ── 3. DPO 配置 ──
config = DPOConfig(
    output_dir="./dpo-model",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    warmup_ratio=0.1,
    beta=0.1,           # DPO 温度参数，通常 0.1-0.5
    max_length=2048,
    max_prompt_length=1024,
    lr_scheduler_type="cosine",
)

# ── 4. 训练 ──
trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    args=config,
    train_dataset=dataset,
    processing_class=tokenizer,
)

trainer.train()

# ── 5. 手动实现 DPO Loss（理解原理）──
def dpo_loss_manual(
    policy_model,
    ref_model,
    prompt_ids,
    chosen_ids,
    rejected_ids,
    beta=0.1
):
    """
    手动计算 DPO 损失，帮助理解原理
    """
    # 计算 log π(y|x) 对每个 token 的 log prob
    def get_log_probs(model, input_ids, labels):
        outputs = model(input_ids=input_ids, labels=labels)
        log_probs = -outputs.loss  # transformers 的 loss 是负 log likelihood
        return log_probs

    # Policy 模型的 log prob
    policy_chosen_lp = get_log_probs(policy_model, prompt_ids, chosen_ids)
    policy_rejected_lp = get_log_probs(policy_model, prompt_ids, rejected_ids)

    # Reference 模型的 log prob（不计算梯度）
    with torch.no_grad():
        ref_chosen_lp = get_log_probs(ref_model, prompt_ids, chosen_ids)
        ref_rejected_lp = get_log_probs(ref_model, prompt_ids, rejected_ids)

    # 计算 log ratio
    chosen_logratio = policy_chosen_lp - ref_chosen_lp
    rejected_logratio = policy_rejected_lp - ref_rejected_lp

    # DPO Loss
    logits = beta * (chosen_logratio - rejected_logratio)
    loss = -torch.nn.functional.logsigmoid(logits).mean()

    # 计算指标
    with torch.no_grad():
        chosen_reward = beta * chosen_logratio
        rejected_reward = beta * rejected_logratio
        accuracy = (chosen_reward > rejected_reward).float().mean()

    return loss, chosen_reward.mean(), rejected_reward.mean(), accuracy
```

## 四、训练稳定性问题与解决方案

### 4.1 PPO 的常见不稳定问题

```
┌──────────────────────────────────────────────────────┐
│              PPO 训练不稳定的表现                      │
├──────────────────────────────────────────────────────┤
│  1. 奖励黑客（Reward Hacking）                        │
│     模型找到 RM 的漏洞，生成高分但无意义的回答         │
│                                                      │
│  2. KL 发散                                           │
│     策略偏离参考模型太远，失去原有能力                  │
│                                                      │
│  3. 模式崩溃（Mode Collapse）                         │
│     模型只生成少数几种回答模式，多样性丧失              │
│                                                      │
│  4. 训练震荡                                          │
│     Loss 来回波动，不收敛                              │
└──────────────────────────────────────────────────────┘
```

### 4.2 解决方案

```python
# ── 方案 1：自适应 KL 控制 ──
class AdaptiveKLController:
    """自适应 KL 惩罚系数"""
    def __init__(self, init_kl_coef=0.2, target_kl=6.0, horizon=10000):
        self.kl_coef = init_kl_coef
        self.target = target_kl
        self.horizon = horizon

    def update(self, current_kl):
        """根据当前 KL 值调整系数"""
        error = current_kl - self.target
        if error > 0:  # KL 太大，增加惩罚
            self.kl_coef *= 1 + 0.1 * (error / self.target)
        else:          # KL 太小，减少惩罚
            self.kl_coef *= 1 - 0.05 * abs(error / self.target)
        self.kl_coef = max(0.01, min(self.kl_coef, 1.0))

# ── 方案 2：奖励裁剪 ──
def clip_rewards(rewards, max_reward=5.0, min_reward=-5.0):
    """裁剪奖励范围，防止极端值"""
    return torch.clamp(rewards, min_reward, max_reward)

# ── 方案 3：熵正则化 ──
def entropy_bonus(logits, beta_ent=0.01):
    """增加熵奖励，鼓励多样性"""
    probs = torch.softmax(logits, dim=-1)
    entropy = -torch.sum(probs * torch.log(probs + 1e-8), dim=-1)
    return beta_ent * entropy.mean()

# ── 方案 4：学习率调度 ──
from transformers import get_cosine_schedule_with_warmup

scheduler = get_cosine_schedule_with_warmup(
    optimizer,
    num_warmup_steps=100,
    num_training_steps=total_steps,
)
```

### 4.3 DPO 的稳定性问题

```python
# DPO 虽然比 PPO 稳定，但也有自己的问题

# 问题 1: β 值选择敏感
# β 太大 → 过于保守，学不到偏好
# β 太小 → 过于激进，可能崩溃
# 建议从 0.1 开始，逐步调整

# 问题 2: 长度偏差
# DPO 可能偏好短回答或长回答
# 解决：在损失中加入长度归一化

def dpo_loss_length_normalized(
    chosen_logratio,
    rejected_logratio,
    chosen_length,
    rejected_length,
    beta=0.1
):
    """长度归一化的 DPO 损失"""
    chosen_logratio_norm = chosen_logratio / chosen_length
    rejected_logratio_norm = rejected_logratio / rejected_length
    logits = beta * (chosen_logratio_norm - rejected_logratio_norm)
    return -torch.nn.functional.logsigmoid(logits).mean()
```

## 五、对齐效果评估与选择策略

### 5.1 评估方法

```python
"""
对齐效果评估
"""
# 方法 1：自动评估 - 奖励模型打分
def evaluate_with_rm(model, rm_model, eval_prompts):
    """用 RM 对模型生成结果打分"""
    scores = []
    for prompt in eval_prompts:
        response = model.generate(prompt, max_new_tokens=256)
        score = rm_model.score(prompt, response)
        scores.append(score)
    return sum(scores) / len(scores)

# 方法 2：LLM-as-Judge
judge_prompt = """请评估以下回答的质量，给出 1-10 的评分。

问题：{question}
回答：{answer}

评分标准：
- 准确性（3分）：信息是否正确
- 有帮助性（3分）：是否直接回答了问题
- 完整性（2分）：是否覆盖了关键点
- 清晰度（2分）：表达是否清晰易懂

请给出总分和各项得分。
"""

# 方法 3：人工评估
evaluation_dimensions = {
    "helpful": "回答是否有帮助？",
    "honest": "回答是否诚实（承认不确定）？",
    "harmless": "回答是否有害？",
    "natural": "回答是否自然流畅？",
}

# 方法 4：对战胜率
def win_rate(model_a_responses, model_b_responses, judge_model):
    """计算 model A 对 model B 的胜率"""
    a_wins = 0
    for a, b in zip(model_a_responses, model_b_responses):
        # 让 judge 判断 A vs B
        winner = judge_model.compare(a, b)
        if winner == "A":
            a_wins += 1
    return a_wins / len(model_a_responses)
```

### 5.2 PPO vs DPO 选择策略

```
┌─────────────────────────────────────────────────────────────┐
│                   PPO vs DPO 选择决策树                       │
│                                                             │
│  你有充足的算力（>8×A100）？                                 │
│  ├─ 是 → 追求最佳效果？                                      │
│  │   ├─ 是 → PPO（上限更高，但调参难）                       │
│  │   └─ 否 → DPO（稳定，效果好）                             │
│  └─ 否 → DPO（显存需求低，只需 2 个模型）                    │
│                                                             │
│  你有大量高质量偏好数据（>100K）？                            │
│  ├─ 是 → PPO 能充分利用数据                                 │
│  └─ 否 → DPO（数据量少时更稳定）                             │
│                                                             │
│  你的任务需要在线学习？                                      │
│  ├─ 是 → PPO（支持在线采样和更新）                           │
│  └─ 否 → DPO（离线优化即可）                                 │
│                                                             │
│  你的团队有 RL 经验？                                        │
│  ├─ 是 → PPO                                                │
│  └─ 否 → DPO（简单得多）                                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 效果对比

| 维度 | RLHF + PPO | DPO |
|------|-----------|-----|
| 训练阶段 | 3（SFT+RM+PPO） | 2（SFT+DPO） |
| 模型数量 | 4（Policy+Ref+RM+Value） | 2（Policy+Ref） |
| 显存需求 | 极高 | 中等 |
| 调参难度 | 高（多个超参互相影响） | 低（主要调 β） |
| 训练稳定性 | 低（RL 天然不稳定） | 高（类似 SFT） |
| 效果上限 | 高 | 中高（略低于 PPO） |
| 数据利用率 | 高（可多次采样） | 中（离线数据） |
| 在线学习 | 支持 | 不支持 |
| 代表模型 | GPT-4, Claude | Llama-3-8B-Instruct, Zephyr |

## 六、其他对齐方法简介

### 6.1 KTO（Kahneman-Tversky Optimization）

KTO 不需要成对偏好数据，只需要二元反馈（好/坏）：

```python
# KTO Loss：每个样本只需要一个标签
def kto_loss(policy_logratio, is_desirable, beta=0.1):
    """
    is_desirable: True/False（这个回答好不好）
    不需要 chosen-rejected 对
    """
    if is_desirable:
        loss = -torch.nn.functional.logsigmoid(beta * policy_logratio)
    else:
        loss = -torch.nn.functional.logsigmoid(-beta * policy_logratio)
    return loss.mean()
```

### 6.2 ORPO（Odds Ratio Preference Optimization）

ORPO 更进一步，连 SFT 阶段都省了，直接在预训练模型上用偏好数据训练：

```python
# ORPO = SFT Loss + 偏好损失
# 一步到位，不需要单独的 SFT 阶段
```

### 6.3 方法对比总览

```
方法       阶段数   需要RM   需要RL   需要成对数据   难度
─────────────────────────────────────────────────────
RLHF+PPO    3       ✅       ✅       ✅           ★★★★★
DPO         2       ❌       ❌       ✅           ★★★
KTO         2       ❌       ❌       ❌           ★★☆
ORPO        1       ❌       ❌       ✅           ★★☆
IPO         2       ❌       ❌       ✅           ★★☆
```

## 七、面试要点

### Q1：RLHF 中 PPO 的作用是什么？为什么不直接用 SFT？

**回答**：SFT 只能学到模仿标注数据，无法优化「人类偏好」这个目标。PPO 通过奖励模型提供的反馈信号，可以探索更优的回答策略。例如，SFT 只见过一种写法，但 PPO 可以通过奖励信号发现更好的表达方式。

### Q2：DPO 为什么能绕过奖励模型？

**回答**：DPO 利用了 RLHF 的数学等价性：RLHF 的最优策略可以显式地用奖励函数表示，反过来奖励函数也可以用策略表示。将这个关系代入 RM 的训练目标后，奖励函数被消掉了，得到一个直接优化策略的损失函数。所以不是"不需要奖励模型"，而是"奖励模型被隐式地内嵌在策略优化中了"。

### Q3：PPO 训练中 KL 惩罚的作用？

**回答**：KL 惩罚防止策略偏离参考模型太远。没有 KL 惩罚，模型可能通过 reward hacking 获得高奖励但生成无意义文本。KL 惩罚确保模型在对齐偏好的同时保留 SFT 阶段学到的基础能力。

### Q4：DPO 的 β 参数怎么调？

**回答**：β 控制策略偏离参考模型的程度。β 大 → 更保守，变化小；β 小 → 更激进，变化大。通常 0.1-0.5 之间。建议从 0.1 开始，如果模型变化太小就降低 β，如果崩溃就增大 β。

### Q5：什么情况下 DPO 不如 PPO？

**回答**：
1. 需要在线学习（持续用新数据更新）
2. 有大量高质量偏好数据（PPO 能更好利用）
3. 任务需要探索（PPO 可以发现新策略，DPO 只能从给定数据学习）
4. 追求极致效果（PPO 上限略高于 DPO）

## 八、避坑指南

### 坑 1：PPO 的学习率设置过大

PPO 的学习率应该是 SFT 的 1/10 到 1/100。SFT 用 2e-5，PPO 应该用 5e-7 到 5e-8。学习率太大直接导致策略崩溃。

### 坑 2：DPO 的偏好数据质量不够

DPO 对数据质量比 PPO 更敏感。成对偏好数据中，chosen 和 rejected 的质量差异要明确。如果差异太小，DPO 学不到东西；如果标注不一致，DPO 会学到错误的偏好。

```python
# ❌ 差的数据：差异不明确
{"prompt": "什么是 Python", "chosen": "Python 是一种编程语言", "rejected": "Python 是一种语言"}

# ✅ 好数据：差异明确
{"prompt": "什么是 Python", "chosen": "Python 是一种高级编程语言，由 Guido van Rossum 于 1991 年创建。它以简洁的语法和强大的生态著称，广泛用于 Web 开发、数据科学、AI 等领域。", "rejected": "Python 是一种语言。"}
```

### 坑 3：忘记冻结 Reference Model

```python
# ❌ 错误：Reference Model 也更新了
ref_model = AutoModelForCausalLM.from_pretrained("./sft-model")
# 忘记 freeze！
trainer = DPOTrainer(model=model, ref_model=ref_model, ...)

# ✅ 正确：冻结 Reference Model
ref_model = AutoModelForCausalLM.from_pretrained("./sft-model")
for param in ref_model.parameters():
    param.requires_grad = False
ref_model.eval()
```

### 坑 4：PPO 的 RM 和 Policy 不兼容

RM 和 Policy 应该用同一个 tokenizer，最好用同一个 base model 初始化。否则 token 分布不匹配，RM 打分不准。

### 坑 5：忽略评估中的长度偏差

模型可能通过生成长回答来提高得分（因为长回答通常信息更多）。评估时要控制长度变量，或加入长度惩罚。

## 总结

| 维度 | RLHF + PPO | DPO |
|------|-----------|-----|
| 复杂度 | 高 | 低 |
| 效果 | 略好 | 好 |
| 稳定性 | 低 | 高 |
| 资源需求 | 高 | 低 |
| 适合场景 | 大厂大算力 | 中小团队 |

**2026 年的趋势**：DPO 及其变体（KTO、ORPO）正在成为主流，PPO 更多用于追求极致效果的大厂。对于大多数团队，DPO 是性价比最高的选择。

> **一句话总结**：PPO 是"效果最好但最难训"的方法，DPO 是"效果够好且好训"的方法。选 PPO 当你追求极限，选 DPO 当你追求效率。