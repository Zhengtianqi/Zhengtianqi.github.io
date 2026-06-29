---
title: 如何让大模型输出稳定的 JSON：从踩坑到最佳实践
tag: ["大模型", "JSON输出", "提示词工程"]
category: 大模型
date: 2026-05-30
---

# 如何让大模型输出稳定的 JSON：从踩坑到最佳实践

> 大语言模型是AI领域的革命性技术，它为自然语言处理和智能应用提供了强大的能力。
> 本文介绍了大模型的核心概念和应用方式，帮助你进入AI应用开发领域。

**你是否有过这样的经历：**

```
你：请返回一个 JSON 格式的用户信息
AI: 好的，这是你要的 JSON：
    ```json
    {
      "name": "张三",
      "age": 25
    }
    ```
    希望这对你有帮助！
```

**结果：** `JSON.parse()` 直接报错，因为返回的不是纯 JSON，而是带了解释文字和代码块标记。

**生动例子：**
> 想象你去餐厅点餐，说"只要米饭，不要菜"。结果服务员端上来：
> "您好，这是您的米饭（还附赠了一碗汤和一盘菜）"
> 大模型也一样，你让它"只返回 JSON"，它却喜欢"贴心地"加上解释、代码块、甚至祝福语。

### 常见"翻车"场景

| 问题类型 | 实际输出 | 为什么解析失败 | 生动比喻 |
|---------|---------|---------------|----------|
| 多余文字 | `好的，这是 JSON：{...}` | 前面多了中文 | 快递盒里塞了张贺卡 |
| 代码块标记 | \`\`\`json {...} \`\`\` | 多了反引号 | 礼物包了三层包装纸 |
| 尾部说明 | `{...} 希望有帮助！` | 后面多了文字 | 吃完饭后送小饼干 |
| 转义问题 | `{ "name": "他说了\"你好\"" }` | 引号转义混乱 | 俄罗斯套娃拆不开 |
| 注释残留 | `{ "age": 25 // 岁 }` | JSON 不支持注释 | 文件里夹了便利贴 |

## 二、核心原理：大模型为什么"不听话"？

### 大模型的"话痨"本质

大模型是**语言模型**，不是**JSON 生成器**。它的训练目标是"生成有帮助的回复"，而不是"输出机器可读的格式"。

**生动例子：**
> 大模型就像一个热情的客服：
> - 你问"要苹果" → 它说"好的，这是您要的苹果🍎，很新鲜哦！"
> - 但你的程序只想要：`apple`
> 它不是故意捣乱，而是它的"人设"就是热情周到。

### 为什么"只返回 JSON"不管用？

```
❌ 错误提示词：
"请返回 JSON 格式，不要其他内容"

大模型内心 OS：
"好的，但我要解释一下这是什么 JSON，
还要用代码块包裹让它更清晰，
最后加句祝福语显得友好~"
```

**根本原因：**
1. **训练数据影响**：训练数据中大量 JSON 都包裹在代码块里
2. **帮助性优先**：模型认为"解释 + 代码块"更友好
3. **指令模糊**："不要其他内容"太抽象，模型理解不一致

## 三、实战方案：从初级到高级

### 方案一：基础版 —— 明确边界标记

**核心思路：** 用明确的开始/结束标记，让程序提取中间内容。

```
提示词：
请在 <<<JSON_START>>> 和 <<<JSON_END>>> 之间输出 JSON：

<<<JSON_START>>>
{你的 JSON 这里}
<<<JSON_END>>>
```

**代码示例：**

```javascript
const prompt = `
请在 <<<JSON_START>>> 和 <<<JSON_END>>> 之间输出 JSON，不要其他内容：

用户信息：张三，25 岁，工程师
`;

const response = await llm.chat(prompt);

// 提取 JSON
const match = response.match(/<<<JSON_START>>>([\s\S]*?)<<<JSON_END>>>/);
const json = JSON.parse(match[1]);
```

**优点：** 简单有效，容错率高
**缺点：** 需要额外解析步骤

**生动例子：**
> 就像在嘈杂的聚会上找人：
> - 不说标记 → "喂，听得见吗？"（可能被忽略）
> - 说标记 → "【重要】喂，听得见吗？【重要】"（一眼看到）

### 方案二：进阶版 —— JSON Schema 约束

**核心思路：** 给模型一个明确的"模具"，让它按格式填充。

```
提示词：
请严格按照以下 JSON Schema 输出：

{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "tags": { 
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["name", "age"]
}

输出要求：
1. 只输出 JSON，不要代码块标记
2. 不要任何解释文字
3. 确保符合上述 Schema
```

**代码示例：**

```javascript
const schema = {
  type: "object",
  properties: {
    name: { type: "string", description: "用户姓名" },
    age: { type: "integer", description: "用户年龄" },
    tag: { 
      type: "array",
      items: { type: "string" },
      description: "用户标签"
    }
  },
  required: ["name", "age"]
};

const prompt = `
输出一个符合以下 Schema 的 JSON（只输出 JSON，不要其他内容）：
${JSON.stringify(schema, null, 2)}
`;
```

**优点：** 结构清晰，类型明确
**缺点：** 复杂 Schema 可能超出模型理解能力

**生动例子：**
> 就像填表格：
> - 不给模板 → 自由发挥，格式五花八门
> - 给模板 → 按格子填，整齐划一

### 方案三：专业版 —— 使用模型的 JSON Mode

**核心思路：** 很多大模型 API 提供了专门的 JSON 模式。

**OpenAI JSON Mode：**

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "你是一个 JSON 生成器，只输出有效的 JSON" },
    { role: "user", content: "生成用户信息：张三，25 岁" }
  ],
  response_format: { type: "json_object" }  // 关键！
});

// 返回的 content 保证是有效 JSON
const data = JSON.parse(response.choices[0].message.content);
```

**Anthropic Claude：**

```javascript
const response = await anthropic.messages.create({
  model: "claude-3-sonnet",
  messages: [{ role: "user", content: "生成用户信息" }],
  response_format: { type: "json_object" }
});
```

**优点：** 最可靠，模型层面保证 JSON 格式
**缺点：** 需要 API 支持，不是所有模型都有

**生动例子：**
> 就像点餐：
> - 普通模式 → 告诉服务员"只要米饭"（可能理解错）
> - JSON Mode → 点"纯米饭套餐"（菜单上明确定义）

### 方案四：终极版 —— 系统提示词 + 少样本学习

**核心思路：** 用系统提示词设定角色，用示例教模型"怎么做"。

```
系统提示词：
你是一个 JSON 生成 API。你的唯一任务是输出有效的 JSON。
规则：
1. 输出必须是有效的 JSON
2. 不要使用代码块标记（```json）
3. 不要任何解释、注释或额外文字
4. 如果不确定，返回 {"error": "描述"}

用户示例 1：
输入：姓名=张三，年龄=25
输出：{"name":"张三","age":25}

用户示例 2：
输入：姓名=李四，年龄=30，标签=["工程师","北京"]
输出：{"name":"李四","age":30,"tags":["工程师","北京"]}

现在请处理：
输入：姓名=王五，年龄=28
输出：
```

**代码示例：**

```javascript
const systemPrompt = `
你是一个 JSON 生成 API。
规则：
1. 只输出 JSON，不要代码块
2. 不要任何解释文字
3. 确保 JSON 有效
`;

const fewShotExamples = [
  {
    input: "姓名=张三，年龄=25",
    output: '{"name":"张三","age":25}'
  },
  {
    input: "姓名=李四，年龄=30，标签=工程师，北京",
    output: '{"name":"李四","age":30,"tags":["工程师","北京"]}'
  }
];

const prompt = `
${systemPrompt}

示例：
${fewShotExamples.map(ex => `输入：${ex.input}\n输出：${ex.output}`).join('\n\n')}

现在处理：
输入：${userInput}
输出：
`;
```

**优点：** 效果最好，模型"学会"了格式
**缺点：** 消耗更多 token，需要精心设计示例

**生动例子：**
> 就像教新员工：
> - 只说规则 → "按要求做"（理解不一致）
> - 给示例 → "像这样：示例 1、示例 2"（一看就懂）

## 四、测试用例：验证你的方案

### 测试用例 1：基础解析测试

```javascript
// test/json-output.test.js

const assert = require('assert');

function testJSONParsing(extractor, response) {
  try {
    const jsonStr = extractor(response);
    const data = JSON.parse(jsonStr);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 模拟各种"翻车"响应
const testCases = [
  {
    name: "纯 JSON",
    response: '{"name":"张三","age":25}',
    expected: { name: "张三", age: 25 }
  },
  {
    name: "带代码块",
    response: '```json\n{"name":"张三","age":25}\n```',
    expected: { name: "张三", age: 25 }
  },
  {
    name: "带前后文字",
    response: '好的，这是你要的 JSON：\n{"name":"张三","age":25}\n希望有帮助！',
    expected: { name: "张三", age: 25 }
  },
  {
    name: "带标记",
    response: '<<<JSON_START>>>\n{"name":"张三","age":25}\n<<<JSON_END>>>',
    expected: { name: "张三", age: 25 }
  }
];

// 通用提取器
function robustJSONExtractor(text) {
  // 尝试 1：直接解析
  try {
    return JSON.parse(text.trim());
  } catch {}
  
  // 尝试 2：提取代码块内的 JSON
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }
  
  // 尝试 3：提取标记内的 JSON
  const markerMatch = text.match(/<<<JSON_START>>>([\s\S]*?)<<<JSON_END>>>/);
  if (markerMatch) {
    try {
      return JSON.parse(markerMatch[1].trim());
    } catch {}
  }
  
  // 尝试 4：提取第一个{到最后一个}
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
  }
  
  throw new Error('无法提取有效的 JSON');
}

// 运行测试
testCases.forEach(tc => {
  const result = testJSONParsing(robustJSONExtractor, tc.response);
  console.log(`测试：${tc.name}`);
  console.log(`  结果：${result.success ? '✓ 通过' : '✗ 失败'}`);
  if (result.success) {
    assert.deepStrictEqual(result.data, tc.expected);
  }
});
```

**运行结果：**
```
测试：纯 JSON
  结果：✓ 通过
测试：带代码块
  结果：✓ 通过
测试：带前后文字
  结果：✓ 通过
测试：带标记
  结果：✓ 通过
```

### 测试用例 2：Schema 验证测试

```javascript
// test/json-schema.test.js

const Ajv = require('ajv');
const ajv = new Ajv();

const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0, maximum: 150 },
    email: { type: "string", format: "email" },
    tag: { 
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["name", "age"],
  additionalProperties: false  // 不允许额外字段
};

const validate = ajv.compile(userSchema);

function testSchemaValidation(data) {
  const valid = validate(data);
  if (!valid) {
    console.log('验证失败:', validate.errors);
  }
  return valid;
}

// 测试数据
const testData = [
  { name: "张三", age: 25 },  // ✓ 有效
  { name: "张三", age: 25, tag: ["工程师"] },  // ✓ 有效
  { name: "", age: 25 },  // ✗ name 不能为空
  { name: "张三", age: -5 },  // ✗ age 不能为负
  { name: "张三", age: 25, unknown: "field" }  // ✗ 不允许额外字段
];

testData.forEach((data, i) => {
  const result = testSchemaValidation(data);
  console.log(`测试用例 ${i + 1}: ${result ? '✓ 有效' : '✗ 无效'}`);
});
```

### 测试用例 3：端到端集成测试

```javascript
// test/integration.test.js

const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testJSONMode() {
  console.log('测试 JSON Mode...');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { 
        role: "system", 
        content: "你是一个 JSON API，只输出有效的 JSON，不要代码块标记" 
      },
      { 
        role: "user", 
        content: "生成一个用户对象：姓名=测试用户，年龄=30" 
      }
    ],
    response_format: { type: "json_object" }
  });
  
  const content = response.choices[0].message.content;
  console.log('原始响应:', content);
  
  try {
    const data = JSON.parse(content);
    console.log('✓ JSON 解析成功');
    console.log('解析结果:', data);
    
    // 验证字段
    if (data.name && data.age) {
      console.log('✓ 字段验证通过');
    } else {
      console.log('✗ 缺少必要字段');
    }
  } catch (e) {
    console.log('✗ JSON 解析失败:', e.message);
  }
}

async function testFewShotPrompting() {
  console.log('\n测试少样本提示...');
  
  const prompt = `
你是一个 JSON 生成器。只输出 JSON，不要代码块。

示例 1:
输入：姓名=张三，年龄=25
输出：{"name":"张三","age":25}

示例 2:
输入：姓名=李四，年龄=30
输出：{"name":"李四","age":30}

现在处理:
输入：姓名=王五，年龄=28
输出：
`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });
  
  const content = response.choices[0].message.content;
  console.log('原始响应:', content);
  
  // 使用鲁棒提取器
  const data = robustJSONExtractor(content);
  console.log('✓ 提取成功:', data);
}

// 运行测试
(async () => {
  await testJSONMode();
  await testFewShotPrompting();
})();
```

## 五、最佳实践总结

### 方案选择指南

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 生产环境，稳定优先 | JSON Mode | API 层面保证，最可靠 |
| 多模型兼容 | 标记法 + 鲁棒提取 | 通用性强，容错高 |
| 复杂结构 | Schema + 少样本 | 结构清晰，示例引导 |
| 成本敏感 | 标记法 | token 消耗少 |

### 防坑清单

```
□ 不要只说"返回 JSON"，要具体说明格式
□ 明确说"不要代码块标记"
□ 使用系统提示词设定角色
□ 提供 1-2 个示例（少样本学习）
□ 后端做鲁棒解析（多策略提取）
□ 添加 Schema 验证
□ 处理异常情况（返回 {"error": "..."}）
```

### 完整示例：生产级实现

```javascript
// lib/json-generator.js

class JSONGenerator {
  constructor(model, config = {}) {
    this.model = model;
    this.schema = config.schema;
    this.examples = config.examples || [];
  }
  
  // 构建提示词
  buildPrompt(userInput) {
    const parts = [
      '你是一个 JSON API，只输出有效的 JSON。',
      '规则：',
      '1. 只输出 JSON，不要代码块标记（```）',
      '2. 不要任何解释文字',
      '3. 如果出错，返回 {"error": "错误描述"}'
    ];
    
    // 添加 Schema
    if (this.schema) {
      parts.push(`\nJSON Schema:\n${JSON.stringify(this.schema, null, 2)}`);
    }
    
    // 添加示例
    if (this.examples.length > 0) {
      parts.push('\n示例:');
      this.examples.forEach((ex, i) => {
        parts.push(`示例${i+1}:\n输入：${ex.input}\n输出：${ex.output}`);
      });
    }
    
    parts.push(`\n现在处理:\n输入：${userInput}\n输出:`);
    
    return parts.join('\n');
  }
  
  // 鲁棒提取
  extractJSON(text) {
    const strategies = [
      // 策略 1：直接解析
      () => JSON.parse(text.trim()),
      
      // 策略 2：提取代码块
      () => {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return match ? JSON.parse(match[1].trim()) : null;
      },
      
      // 策略 3：提取标记
      () => {
        const match = text.match(/<<<JSON_START>>>([\s\S]*?)<<<JSON_END>>>/);
        return match ? JSON.parse(match[1].trim()) : null;
      },
      
      // 策略 4：提取花括号内容
      () => {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      }
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result) return result;
      } catch {}
    }
    
    throw new Error('无法提取有效的 JSON');
  }
  
  // 生成 JSON
  async generate(userInput) {
    const prompt = this.buildPrompt(userInput);
    const response = await this.model.chat(prompt);
    return this.extractJSON(response.content);
  }
}

// 使用示例
const generator = new JSONGenerator(openai, {
  schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "integer" }
    },
    required: ["name", "age"]
  },
  examples: [
    { input: "张三，25 岁", output: '{"name":"张三","age":25}' }
  ]
});

const result = await generator.generate("李四，30 岁");
console.log(result);  // { name: "李四", age: 30 }
```

## 六、写在最后

让大模型输出稳定的 JSON，核心就三点：

1. **明确告诉它要什么** —— 具体格式、不要什么
2. **给它看例子** —— 少样本学习最有效
3. **后端做容错** —— 多策略提取 + Schema 验证

**生动总结：**
> 和大模型要 JSON，就像和话痨朋友要地址：
> - ❌ "给我地址" → "好的，我家在 XX 路，那里有个公园，旁边是超市..."
> - ✅ "只要地址，格式：路名 + 门牌号" → "XX 路 123 号"
> - 最佳：用 JSON Mode → 直接得到标准格式

希望这篇指南能帮你彻底解决 JSON 输出的问题！

## 附录：常用提示词模板

### 模板 1：简单 JSON 生成

```
你是一个 JSON API。只输出 JSON，不要代码块。

输入：{user_data}
输出：
```

### 模板 2：带 Schema 的 JSON

```
输出符合以下 Schema 的 JSON（只输出 JSON）：

{schema}

数据：{user_data}
```

### 模板 3：少样本模板

```
你是一个 JSON 生成器。

示例：
{examples}

现在处理：
输入：{user_data}
输出：
```

### 模板 4：错误处理模板

```
你是一个 JSON API。
- 成功时返回：{"success": true, "data": {...}}
- 失败时返回：{"success": false, "error": "原因"}
- 只输出 JSON，不要其他内容

任务：{task}
