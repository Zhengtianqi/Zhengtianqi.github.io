---
title: TypeScript 完全指南：从入门到精通
author: zheng
tags:
  - TypeScript
category: 前端
date: 2026-05-30
---

# TypeScript 完全指南：从入门到精通

## 目录

## 1. TypeScript 简介

TypeScript 是由微软开发并维护的开源编程语言，它是 JavaScript 的超集，添加了静态类型系统和基于类的面向对象特性。TypeScript 代码最终会被编译（转译）为纯 JavaScript 代码，可以在任何支持 JavaScript 的环境中运行。

### 1.1 为什么选择 TypeScript？

- **静态类型检查**：在编译阶段就能发现类型错误，减少运行时错误
- **更好的 IDE 支持**：智能提示、自动补全、重构等功能
- **代码可读性**：类型注解让代码意图更清晰
- **大型项目友好**：类型系统帮助管理复杂的项目结构
- **渐进式采用**：可以逐步将 JavaScript 项目迁移到 TypeScript

### 1.2 TypeScript 与 JavaScript 的关系

```typescript
// JavaScript
function greet(name) {
  return `Hello, ${name}`;
}

// TypeScript
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

TypeScript 添加了类型注解（`string`），但编译后生成的 JavaScript 与原生 JavaScript 几乎相同。

---

## 2. 安装与配置

### 2.1 安装 Node.js 和 npm

TypeScript 依赖 Node.js 环境。首先确保已安装 Node.js（推荐 LTS 版本）：

```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v
```

### 2.2 全局安装 TypeScript

```bash
# 使用 npm 全局安装
npm install -g typescript

# 使用 yarn 全局安装
yarn global add typescript

# 检查 TypeScript 版本
tsc --version
```

### 2.3 在项目中安装 TypeScript

```bash
# 初始化项目（如果还没有 package.json）
npm init -y

# 安装 TypeScript 作为开发依赖
npm install --save-dev typescript

# 安装类型定义（可选，但推荐）
npm install --save-dev @types/node
```

### 2.4 初始化 TypeScript 配置

```bash
# 生成 tsconfig.json 配置文件
npx tsc --init
```

这将创建一个默认的 `tsconfig.json` 文件，包含常用的编译选项。

### 2.5 项目结构示例

```
my-typescript-project/
├── src/                    # 源代码目录
│   ├── index.ts           # 入口文件
│   ├── utils/             # 工具函数
│   └── components/        # 组件
├── dist/                   # 编译输出目录
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目配置
└── README.md
```

---

## 3. TypeScript 核心特性

### 3.1 静态类型系统

TypeScript 在编译时进行类型检查，而不是运行时：

```typescript
// 类型错误会在编译时被发现
let count: number = 10;
count = "hello";  // ❌ 错误：类型 'string' 不能分配给类型 'number'
```

### 3.2 类型推断

TypeScript 可以自动推断变量类型：

```typescript
let name = "TypeScript";  // 自动推断为 string 类型
name = 123;  // ❌ 错误

let numbers = [1, 2, 3];  // 自动推断为 number[]
numbers.push("hello");  // ❌ 错误
```

### 3.3 结构类型系统

TypeScript 使用结构类型系统（鸭子类型）：

```typescript
interface Point {
  x: number;
  y: number;
}

function printPoint(p: Point) {
  console.log(p.x, p.y);
}

// 只要对象具有相同的结构，就可以使用
const point = { x: 10, y: 20 };
printPoint(point);  // ✅ 正确

const anotherPoint = { x: 5, y: 10, z: 15 };
printPoint(anotherPoint);  // ✅ 正确（多余属性被忽略）
```

### 3.4 增强的 JavaScript 支持

TypeScript 支持所有最新的 JavaScript 特性，并提供类型安全：

```typescript
// 解构赋值
const { x, y } = { x: 1, y: 2 };

// 展开运算符
const arr = [1, 2, ...[3, 4, 5]];

// 可选链
const value = obj?.prop?.nestedProp;

// 空值合并
const name = userInput ?? "Default";
```

---

## 4. 编译选项详解

`tsconfig.json` 是 TypeScript 项目的配置文件，控制编译行为。

### 4.1 完整的 tsconfig.json 示例

```json
{
  "compilerOptions": {
    // 目标与模块
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    
    // 严格检查
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // 额外的检查
    "useUnknownInCatchVariables": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // 互操作性
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    
    // 输出
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    
    // JSX 支持
    "jsx": "react-jsx",
    
    // 其他
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.2 常用编译选项详解

#### 目标与模块相关

| 选项 | 说明 | 常用值 |
|------|------|--------|
| `target` | JavaScript 目标版本 | ES3, ES5, ES2015, ES2020, ESNext |
| `module` | 模块系统 | CommonJS, ESNext, UMD, AMD |
| `lib` | 库文件声明 | ES2020, DOM, DOM.Iterable |
| `moduleResolution` | 模块解析策略 | node, classic, bundler |

#### 严格检查相关

| 选项 | 说明 |
|------|------|
| `strict` | 启用所有严格类型检查选项 |
| `noImplicitAny` | 隐式 any 类型报错 |
| `strictNullChecks` | 严格 null 和 undefined 检查 |
| `strictFunctionTypes` | 严格函数类型检查 |
| `noImplicitReturns` | 函数必须有返回值 |
| `noFallthroughCasesInSwitch` | switch case 必须有 break |

#### 输出相关

| 选项 | 说明 |
|------|------|
| `outDir` | 输出目录 |
| `rootDir` | 根目录 |
| `declaration` | 生成 .d.ts 声明文件 |
| `sourceMap` | 生成 source map 文件 |
| `removeComments` | 移除注释 |

#### 互操作性相关

| 选项 | 说明 |
|------|------|
| `esModuleInterop` | 改善与 CommonJS 的互操作性 |
| `allowSyntheticDefaultImports` | 允许默认导入 |
| `resolveJsonModule` | 允许导入 JSON 文件 |

### 4.3 编译命令

```bash
# 编译整个项目
npx tsc

# 编译单个文件
npx tsc src/index.ts

# 监听模式（自动编译）
npx tsc --watch

# 检查类型但不输出文件
npx tsc --noEmit

# 增量编译（加快编译速度）
npx tsc --incremental
```

---

## 5. 基础类型

### 5.1 布尔型（boolean）

```typescript
let isDone: boolean = false;
let isActive: boolean = true;

// 类型推断
let enabled = true;  // boolean
```

### 5.2 数值型（number）

```typescript
let age: number = 25;
let price: number = 19.99;
let binary: number = 0b1010;  // 二进制
let octal: number = 0o123;    // 八进制
let hex: number = 0x1A;       // 十六进制

// 特殊数值
let infinity: number = Infinity;
let negativeInfinity: number = -Infinity;
let notANumber: number = NaN;
```

### 5.3 字符串型（string）

```typescript
let name: string = "TypeScript";
let greeting: string = `Hello, ${name}!`;  // 模板字符串

// 字符串方法
let upperName = name.toUpperCase();  // "TYPESCRIPT"
let length = name.length;  // 10
```

### 5.4 数组（Array）

```typescript
// 两种声明方式
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// 混合类型数组（不推荐）
let mixed: (string | number)[] = [1, "two", 3];

// 数组操作
numbers.push(4);
let first = numbers[0];
let length = numbers.length;
```

### 5.5 元组（Tuple）

元组是固定长度和固定类型元素的数组：

```typescript
// [string, number]
let user: [string, number] = ["Alice", 25];

// 访问元素
let name = user[0];  // string
let age = user[1];   // number

// 错误示例
// user[0] = 123;  // ❌ 错误：类型 'number' 不能分配给类型 'string'

// 可变长度元组
let可变长度：[string, ...number[]] = ["Alice", 1, 2, 3];
```

### 5.6 枚举（enum）

```typescript
// 数字枚举
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

let dir: Direction = Direction.Up;

// 指定值的枚举
enum Status {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

// 字符串枚举
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

// 计算成员
enum Size {
  Small = 1,
  Medium = Small * 2,
  Large = Medium * 2
}

// 异构图枚举
enum Mixed {
  A = 1,
  B = "two",
  C = 3
}
```

### 5.7 任意类型（any）

`any` 表示任何类型，关闭类型检查：

```typescript
let anything: any = "hello";
anything = 123;
anything = { name: "TypeScript" };

// any 类型的方法调用
anything.anyMethod();  // ✅ 不会报错（但运行时可能出错）

// 不推荐过度使用 any
```

### 5.8 未知类型（unknown）

`unknown` 是类型安全的 `any`，使用前必须进行类型检查：

```typescript
let value: unknown = "hello";

// 类型检查后才能使用
if (typeof value === "string") {
  console.log(value.toUpperCase());  // ✅ 正确
}

// 类型断言
let str = value as string;

// 类型守卫
function isString(val: unknown): val is string {
  return typeof val === "string";
}

if (isString(value)) {
  console.log(value.length);  // ✅ 正确
}
```

### 5.9 空类型（void）

`void` 表示没有值，常用于函数返回值：

```typescript
function logMessage(message: string): void {
  console.log(message);
  // 不需要 return
}

// 变量声明为 void 只能赋值为 undefined 或 void
let useless: void = undefined;
```

### 5.10 never 类型

`never` 表示永不返回的值：

```typescript
// 抛出异常的函数
function throwError(message: string): never {
  throw new Error(message);
}

// 无限循环的函数
function infiniteLoop(): never {
  while (true) {
    // 永不停止
  }
}

// 用于类型收窄
function process(value: string | number) {
  if (typeof value === "string") {
    return value.length;
  } else if (typeof value === "number") {
    return value.toFixed(2);
  }
  // 这里 TypeScript 知道类型是 never
  // 因为所有可能的类型都已处理
}
```

### 5.11 null 和 undefined

```typescript
// 默认情况下，null 和 undefined 是所有类型的子类型
let str: string = undefined;  // ✅ 允许（strictNullChecks 关闭时）

// 启用 strictNullChecks 后
let name: string | null = null;
let age: number | undefined = undefined;

// 可选链操作符
const user = { name: "Alice" };
const city = user?.address?.city;  // 安全访问

// 空值合并操作符
const displayName = userInput ?? "Guest";
```

### 5.12 联合类型（Union Types）

```typescript
// 变量可以是多种类型之一
let id: string | number;
id = "123";
id = 456;

// 联合类型的公共成员
function printId(id: string | number) {
  console.log(id.toString());  // toString 是 string 和 number 的公共方法
}

// 类型守卫
if (typeof id === "string") {
  console.log(id.toUpperCase());  // 类型收窄为 string
}
```

### 5.13 交叉类型（Intersection Types）

```typescript
// 合并多个类型
interface A {
  name: string;
}

interface B {
  age: number;
}

type Person = A & B;  // { name: string; age: number }

const person: Person = {
  name: "Alice",
  age: 25
};

// 与对象字面量交叉
const enhanced = {
  name: "Alice"
} & { age: 25 };
```

---

## 6. 变量声明

### 6.1 let 和 const

```typescript
// let：可变变量
let count = 0;
count = 1;  // ✅ 可以重新赋值

// const：常量
const PI = 3.14159;
// PI = 3.14;  // ❌ 错误：不能重新赋值

// const 对象（引用不可变，内容可变）
const user = { name: "Alice" };
user.name = "Bob";  // ✅ 可以修改属性
// user = {};  // ❌ 错误：不能重新赋值
```

### 6.2 类型注解

```typescript
// 显式类型注解
let name: string = "Alice";
let age: number = 25;
let isActive: boolean = true;

// 数组类型注解
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"];

// 函数类型注解
let greet: (name: string) => string = (name) => `Hello, ${name}`;
```

### 6.3 类型推断

```typescript
// TypeScript 自动推断类型
let message = "Hello";  // 推断为 string
let count = 42;         // 推断为 number
let items = [1, 2, 3];  // 推断为 number[]

// 函数返回类型推断
function add(a: number, b: number) {
  return a + b;  // 推断返回类型为 number
}
```

### 6.4 类型断言

```typescript
// as 语法（推荐）
let someValue: unknown = "hello";
let strLength = (someValue as string).length;

// <type> 语法（在 JSX 中不能用）
let strLength2 = (<string>someValue).length;

// 非空断言
let name: string | null = null;
let firstChar = name!.charAt(0);  // 断言 name 不为 null
```

### 6.5 解构赋值

```typescript
// 对象解构
const user = { name: "Alice", age: 25, city: "NYC" };
const { name, age } = user;
const { city: userCity } = user;  // 重命名
const { name: userName = "Guest" } = {};  // 默认值

// 数组解构
const colors = ["red", "green", "blue"];
const [first, second] = colors;
const [, , third] = colors;  // 跳过元素
const [a, ...rest] = colors;  // 剩余元素

// 类型注解
const { name: n }: { name: string; age: number } = user;
```

### 6.6 展开运算符

```typescript
// 对象展开
const defaultConfig = { timeout: 5000, retries: 3 };
const customConfig = { ...defaultConfig, timeout: 10000 };

// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];

// 函数调用展开
function sum(a: number, b: number, c: number) {
  return a + b + c;
}
const nums = [1, 2, 3];
const result = sum(...nums);
```

---

## 7. 运算符

### 7.1 算术运算符

```typescript
let a = 10, b = 3;

console.log(a + b);  // 13  加法
console.log(a - b);  // 7   减法
console.log(a * b);  // 30  乘法
console.log(a / b);  // 3.33... 除法
console.log(a % b);  // 1   取余
console.log(a ** b); // 1000  幂运算
console.log(++a);    // 11  前置递增
console.log(b++);    // 3   后置递增
console.log(--a);    // 10  前置递减
```

### 7.2 比较运算符

```typescript
let x = 5, y = "5";

console.log(x == y);   // true  相等（类型转换）
console.log(x === y);  // false 严格相等（不转换类型）
console.log(x != y);   // false  不相等
console.log(x !== y);  // true   严格不相等
console.log(x > y);    // false
console.log(x < y);    // false
console.log(x >= y);   // true
console.log(x <= y);   // true
```

### 7.3 逻辑运算符

```typescript
let a = true, b = false;

console.log(a && b);  // false  逻辑与
console.log(a || b);  // true   逻辑或
console.log(!a);      // false  逻辑非

// 短路求值
const username = userInput || "Guest";  // 如果 userInput 为假，使用 "Guest"
const value = data && data.value;      // 如果 data 为真，获取 value

// 空值合并运算符（只检查 null 和 undefined）
const count = input ?? 0;  // 如果 input 是 null 或 undefined，使用 0
```

### 7.4 位运算符

```typescript
let a = 5;  // 二进制：0101
let b = 3;  // 二进制：0011

console.log(a & b);   // 1   按位与 (0101 & 0011 = 0001)
console.log(a | b);   // 7   按位或 (0101 | 0011 = 0111)
console.log(a ^ b);   // 6   按位异或 (0101 ^ 0011 = 0110)
console.log(~a);      // -6  按位取反
console.log(a << 1);  // 10  左移
console.log(a >> 1);  // 2   右移
console.log(a >>> 1); // 2   无符号右移
```

### 7.5 赋值运算符

```typescript
let x = 10;

x += 5;  // x = 15  加后赋值
x -= 3;  // x = 12  减后赋值
x *= 2;  // x = 24  乘后赋值
x /= 4;  // x = 6   除后赋值
x %= 4;  // x = 2   取余后赋值
x **= 2; // x = 4   幂后赋值
x &= 1;  // x = 0   按位与后赋值
x |= 1;  // x = 1   按位或后赋值
x ^= 1;  // x = 0   按位异或后赋值
```

### 7.6 三元运算符

```typescript
let age = 18;
let status = age >= 18 ? "成年" : "未成年";

// 嵌套三元
let grade = score >= 90 ? "A" : score >= 60 ? "B" : "C";

// 与逻辑运算符结合
let message = condition ? "成功" : error ? "失败" : "未知";
```

### 7.7 可选链运算符

```typescript
interface Address {
  city?: string;
  street?: string;
}

interface User {
  name: string;
  address?: Address;
}

const user: User = { name: "Alice" };

// 安全访问嵌套属性
const city = user.address?.city;  // undefined，不会报错

// 安全访问数组元素
const first = arr?.[0];

// 安全调用方法
const result = obj?.method?.();

// 链式访问
const zip = user?.address?.location?.zipCode;
```

### 7.8 空值合并运算符

```typescript
// 只在左侧为 null 或 undefined 时使用右侧值
const name = userInput ?? "Guest";
const count = inputCount ?? 0;
const enabled = flag ?? true;

// 与 || 的区别
const zero = 0;
console.log(zero || "default");  // "default"（0 是假值）
console.log(zero ?? "default");  // 0（0 不是 null/undefined）
```

---

## 8. 条件语句

### 8.1 if...else 语句

```typescript
let score = 85;

if (score >= 90) {
  console.log("优秀");
} else if (score >= 60) {
  console.log("及格");
} else {
  console.log("不及格");
}

// 类型收窄
function printValue(value: string | number) {
  if (typeof value === "string") {
    console.log(value.toUpperCase());  // value 被收窄为 string
  } else {
    console.log(value.toFixed(2));     // value 被收窄为 number
  }
}
```

### 8.2 switch 语句

```typescript
let day = 3;

switch (day) {
  case 1:
    console.log("星期一");
    break;
  case 2:
    console.log("星期二");
    break;
  case 3:
    console.log("星期三");
    break;
  default:
    console.log("其他");
}

// 多个 case
switch (day) {
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
    console.log("工作日");
    break;
  case 6:
  case 7:
    console.log("周末");
    break;
}

// 枚举 switch
enum Status {
  Pending,
  Approved,
  Rejected
}

function handleStatus(status: Status) {
  switch (status) {
    case Status.Pending:
      return "等待处理";
    case Status.Approved:
      return "已批准";
    case Status.Rejected:
      return "已拒绝";
    // 启用 noFallthroughCasesInSwitch 后，必须处理所有情况
  }
}
```

### 8.3 类型守卫

```typescript
// 类型谓词
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function process(value: unknown) {
  if (isString(value)) {
    console.log(value.length);  // value 被收窄为 string
  }
}

// in 操作符守卫
function getAnimalSound(animal: { bark?: () => void; meow?: () => void }) {
  if ("bark" in animal) {
    animal.bark!();  // animal 被收窄为有 bark 属性的类型
  } else if ("meow" in animal) {
    animal.meow!();
  }
}

// instanceof 守卫
function handleValue(value: string | Date) {
  if (value instanceof Date) {
    console.log(value.toISOString());
  } else {
    console.log(value.toUpperCase());
  }
}
```

### 8.4 满足类型检查

```typescript
// 使用 satisfies 关键字（TypeScript 4.9+）
interface Config {
  timeout: number;
  retries: number;
  name?: string;
}

const config = {
  timeout: 5000,
  retries: 3,
  name: "API"
} satisfies Config;

// config 保持其字面量类型，但确保满足 Config 接口
```

---

## 9. 循环语句

### 9.1 for 循环

```typescript
// 基本 for 循环
for (let i = 0; i < 5; i++) {
  console.log(i);  // 0, 1, 2, 3, 4
}

// 多个变量
for (let i = 0, j = 10; i < 5; i++, j--) {
  console.log(i, j);
}

// 无限循环
// for (;;) {
//   break;  // 使用 break 退出
// }
```

### 9.2 while 循环

```typescript
let count = 0;

while (count < 5) {
  console.log(count);
  count++;
}

// do...while 循环
let num = 0;

do {
  console.log(num);
  num++;
} while (num < 5);  // 至少执行一次
```

### 9.3 for...of 循环

```typescript
// 遍历数组
const numbers = [1, 2, 3, 4, 5];
for (const num of numbers) {
  console.log(num);
}

// 遍历字符串
const str = "TypeScript";
for (const char of str) {
  console.log(char);
}

// 遍历 Set
const set = new Set([1, 2, 3]);
for (const value of set) {
  console.log(value);
}

// 遍历 Map
const map = new Map([["a", 1], ["b", 2]]);
for (const [key, value] of map) {
  console.log(key, value);
}

// 使用 break 和 continue
for (const num of numbers) {
  if (num === 3) continue;  // 跳过 3
  if (num === 5) break;     // 遇到 5 退出
  console.log(num);
}
```

### 9.4 for...in 循环

```typescript
// 遍历对象属性
const user = { name: "Alice", age: 25, city: "NYC" };

for (const key in user) {
  console.log(key, user[key]);
}

// 遍历数组（不推荐，会遍历所有可枚举属性）
const arr = [1, 2, 3];
arr.customProp = "test";

for (const index in arr) {
  console.log(index, arr[index]);  // 会输出 customProp
}

// 使用 hasOwnProperty 过滤
for (const key in user) {
  if (user.hasOwnProperty(key)) {
    console.log(key, user[key]);
  }
}
```

### 9.5 循环中的闭包问题

```typescript
// 错误示例（使用 var）
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 输出 3, 3, 3
  }, 100);
}

// 正确示例（使用 let）
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);  // 输出 0, 1, 2
  }, 100);
}

// 使用 IIFE（立即调用函数表达式）
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);  // 输出 0, 1, 2
    }, 100);
  })(i);
}
```

---

## 10. 函数

### 10.1 函数声明

```typescript
// 基本函数声明
function greet(name: string): string {
  return `Hello, ${name}`;
}

// 返回值类型推断
function add(a: number, b: number) {
  return a + b;  // 返回类型自动推断为 number
}

// 无返回值函数
function logMessage(message: string): void {
  console.log(message);
}

// 不返回值的函数
function throwError(): never {
  throw new Error("出错了");
}
```

### 10.2 函数表达式

```typescript
// 函数表达式
const greet = function(name: string): string {
  return `Hello, ${name}`;
};

// 匿名函数
const fn: (x: number) => number = function(x) {
  return x * 2;
};

// 命名函数表达式
const calculate = function calc(a: number, b: number): number {
  return a + b;
};
```

### 10.3 参数类型

```typescript
// 必需参数
function add(a: number, b: number): number {
  return a + b;
}

// 可选参数
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

// 默认参数
function multiply(a: number, b: number = 1): number {
  return a * b;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

// 混合参数
function process(name: string, ...tags: string[]): string {
  return `${name}: ${tags.join(", ")}`;
}
```

### 10.4 函数类型

```typescript
// 函数类型注解
type AddFunction = (a: number, b: number) => number;

const add: AddFunction = (a, b) => a + b;

// 复杂函数类型
type Callback = (result: string, error: Error | null) => void;

function fetchData(callback: Callback) {
  callback("数据", null);
}

// 可选参数类型
type OptionalCallback = (data?: string) => void;
```

### 10.5 函数重载

```typescript
// 多个重载签名
function toString(value: number): string;
function toString(value: string): string;
function toString(value: boolean): string;
function toString(value: number | string | boolean): string {
  return String(value);
}

// 不同参数数量
function getFirst<T>(arr: T[]): T;
function getFirst<T>(arr: T[], defaultValue: T): T;
function getFirst<T>(arr: T[], defaultValue?: T): T {
  return arr[0] ?? defaultValue!;
}

// 不同参数类型
function parse(value: string): number;
function parse(value: number): number;
function parse(value: string | number): number {
  return typeof value === "string" ? parseInt(value) : value;
}
```

### 10.6 可选链与函数调用

```typescript
interface Service {
  getData?(): Promise<string>;
}

class Container {
  service?: Service;
}

const container = new Container();

// 安全调用可能不存在的方法
const data = container.service?.getData?.();
```

---

## 11. 函数重载

函数重载允许同一个函数有不同的调用方式，TypeScript 会根据传入参数的类型选择正确的重载签名。

### 11.1 基本重载

```typescript
// 根据参数类型不同
function format(value: number): string;
function format(value: string): string;
function format(value: Date): string;
function format(value: number | string | Date): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  } else if (typeof value === "string") {
    return value.toUpperCase();
  } else {
    return value.toISOString();
  }
}

format(3.14159);    // "3.14"
format("hello");    // "HELLO"
format(new Date()); // "2024-01-01T00:00:00.000Z"
```

### 11.2 参数数量重载

```typescript
// 不同参数数量
function createPoint(x: number, y: number): { x: number; y: number };
function createPoint(pos: { x: number; y: number }): { x: number; y: number };
function createPoint(
  x: number | { x: number; y: number },
  y?: number
): { x: number; y: number } {
  if (typeof x === "number" && typeof y === "number") {
    return { x, y };
  } else {
    return x as { x: number; y: number };
  }
}

createPoint(1, 2);           // { x: 1, y: 2 }
createPoint({ x: 1, y: 2 }); // { x: 1, y: 2 }
```

### 11.3 返回类型重载

```typescript
// 根据参数返回不同类型
function getData(id: number): Promise<User>;
function getData(ids: number[]): Promise<User[]>;
function getData(id: number | number[]): Promise<User | User[]> {
  if (Array.isArray(id)) {
    return fetchUsers(id);
  } else {
    return fetchUser(id);
  }
}
```

### 11.4 泛型重载

```typescript
// 泛型函数重载
function first<T>(arr: T[]): T;
function first<T>(arr: T[], defaultValue: T): T;
function first<T>(arr: T[], defaultValue?: T): T {
  return arr[0] ?? defaultValue!;
}

first([1, 2, 3]);           // number
first(["a", "b"]);          // string
first([], "default");       // string
```

### 11.5 重载注意事项

```typescript
// ✅ 正确：重载签名必须在实现签名之前
function overload(a: number): number;
function overload(a: string): string;
function overload(a: number | string): number | string {
  return a;
}

// ❌ 错误：重载签名顺序不对
// function overload(a: number | string): number | string { ... }
// function overload(a: number): number;  // 错误

// ✅ 正确：实现签名必须兼容所有重载签名
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any): any {  // 实现签名必须足够宽泛
  return a + b;
}
```

---

## 12. 箭头函数

箭头函数是 ES6 引入的简洁函数语法，TypeScript 为其提供了完整的类型支持。

### 12.1 基本语法

```typescript
// 基本箭头函数
const add = (a: number, b: number): number => a + b;

// 单个参数（可以省略括号）
const square = (x: number): number => x * x;
const square2 = (x: number) => x * x;  // 返回类型推断

// 无参数
const getRandom = (): number => Math.random();

// 多个语句（需要大括号和 return）
const process = (x: number): number => {
  x = x * 2;
  x = x + 1;
  return x;
};

// 返回对象（需要用括号包裹）
const createUser = (name: string) => ({ name, age: 25 });
```

### 12.2 this 绑定

```typescript
class Counter {
  count = 0;

  // 普通方法：this 取决于调用方式
  incrementNormal() {
    setTimeout(() => {
      // this 可能不是 Counter 实例
      this.count++;
    }, 100);
  }

  // 箭头函数属性：this 绑定到类实例
  incrementArrow = () => {
    setTimeout(() => {
      this.count++;  // this 正确指向 Counter 实例
    }, 100);
  };

  // 使用 bind
  incrementBound = function() {
    setTimeout(() => {
      this.count++;
    }, 100);
  }.bind(this);
}
```

### 12.3 箭头函数与回调

```typescript
// 数组方法
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map((n: number) => n * 2);
const evens = numbers.filter((n: number) => n % 2 === 0);
const sum = numbers.reduce((acc: number, n: number) => acc + n, 0);

// 事件处理
button.addEventListener("click", (event: MouseEvent) => {
  console.log(event.target);
});

// Promise
fetch("/api/data")
  .then((response: Response) => response.json())
  .then((data: any) => console.log(data))
  .catch((error: Error) => console.error(error));
```

### 12.4 箭头函数类型

```typescript
// 箭头函数类型注解
type BinaryOperation = (a: number, b: number) => number;

const add: BinaryOperation = (a, b) => a + b;
const subtract: BinaryOperation = (a, b) => a - b;

// 复杂类型
type EventHandler = (event: CustomEvent<Data>) => void | Promise<void>;

// 高阶函数
type MapFunction<T, U> = (item: T, index: number, array: T[]) => U;

function map<T, U>(array: T[], fn: MapFunction<T, U>): U[] {
  return array.map(fn);
}
```

### 12.5 箭头函数限制

```typescript
// ❌ 箭头函数不能作为构造函数
const Person = (name: string) => {
  this.name = name;
};
// new Person("Alice");  // 错误

// ❌ 箭头函数没有自己的 this
const obj = {
  name: "Alice",
  // greet: () => {
  //   console.log(this.name);  // this 不是 obj
  // },
  greet() {
    console.log(this.name);  // 正确
  }
};

// ❌ 箭头函数没有 arguments 对象
const fn = () => {
  // arguments;  // 错误
};
```

---

## 13. 迭代器与生成器

### 13.1 可迭代对象（Iterable）

```typescript
// Iterable 接口
interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}

// 自定义可迭代对象
class Range implements Iterable<number> {
  constructor(private start: number, private end: number) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    return {
      next: (): IteratorResult<number> => {
        if (current > this.end) {
          return { done: true, value: undefined };
        }
        return { done: false, value: current++ };
      }
    };
  }
}

// 使用
for (const num of new Range(1, 5)) {
  console.log(num);  // 1, 2, 3, 4, 5
}

// 展开运算符
const arr = [...new Range(1, 3)];  // [1, 2, 3]
```

### 13.2 迭代器（Iterator）

```typescript
// Iterator 接口
interface Iterator<T> {
  next(): IteratorResult<T>;
}

interface IteratorResult<T> {
  done: boolean;
  value: T;
}

// 手动使用迭代器
const iterable = [1, 2, 3];
const iterator = iterable[Symbol.iterator]();

console.log(iterator.next());  // { value: 1, done: false }
console.log(iterator.next());  // { value: 2, done: false }
console.log(iterator.next());  // { value: 3, done: false }
console.log(iterator.next());  // { value: undefined, done: true }
```

### 13.3 生成器函数

```typescript
// 基本生成器
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = numberGenerator();
console.log(gen.next());  // { value: 1, done: false }
console.log(gen.next());  // { value: 2, done: false }
console.log(gen.next());  // { value: 3, done: false }
console.log(gen.next());  // { value: undefined, done: true }

// 带参数的生成器
function* counter(max: number) {
  for (let i = 0; i < max; i++) {
    yield i;
  }
}

// 生成器返回值
function* genWithReturn() {
  yield 1;
  yield 2;
  return "完成";
}

const gen2 = genWithReturn();
gen2.next();
gen2.next();
console.log(gen2.next());  // { value: "完成", done: true }
```

### 13.4 生成器与参数

```typescript
// yield 表达式可以接收值
function* echo() {
  let input;
  while (input !== "quit") {
    input = yield input;
  }
}

const e = echo();
console.log(e.next().value);     // undefined
console.log(e.next("hello").value);  // "hello"
console.log(e.next("world").value);  // "world"
e.next("quit");
```

### 13.5 生成器委托

```typescript
// yield* 委托给另一个迭代器
function* numbers() {
  yield 1;
  yield 2;
}

function* letters() {
  yield "a";
  yield "b";
}

function* combined() {
  yield* numbers();
  yield* letters();
}

for (const value of combined()) {
  console.log(value);  // 1, 2, "a", "b"
}
```

### 13.6 异步生成器

```typescript
// AsyncIterable 和 AsyncIterator
interface AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

interface AsyncIterator<T> {
  next(): Promise<IteratorResult<T>>;
}

// 异步生成器函数
async function* asyncNumberGenerator() {
  yield 1;
  await new Promise(resolve => setTimeout(resolve, 100));
  yield 2;
  await new Promise(resolve => setTimeout(resolve, 100));
  yield 3;
}

// 使用 for-await-of
async function process() {
  for await (const num of asyncNumberGenerator()) {
    console.log(num);
  }
}
```

### 13.7 实际应用场景

```typescript
// 分页数据加载
async function* fetchPages(url: string) {
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();
    
    if (data.items.length === 0) break;
    
    for (const item of data.items) {
      yield item;
    }
    page++;
  }
}

// 使用
for await (const item of fetchPages("/api/items")) {
  console.log(item);
}

// 无限序列
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// 取前 10 个斐波那契数
const fib = fibonacci();
for (let i = 0; i < 10; i++) {
  console.log(fib.next().value);
}
```

---

## 14. 接口与类型别名

### 14.1 接口（Interface）

```typescript
// 基本接口
interface User {
  id: number;
  name: string;
  email?: string;  // 可选属性
  readonly createdAt: Date;  // 只读属性
}

const user: User = {
  id: 1,
  name: "Alice",
  createdAt: new Date()
};

// 函数接口
interface Formatter {
  (value: string): string;
}

const toUpper: Formatter = (value) => value.toUpperCase();

// 可调用接口
interface CallableInterface {
  (name: string): void;
}

const greet: CallableInterface = (name) => console.log(`Hello, ${name}`);

// 可实例化接口
interface Constructor {
  new (name: string): string;
}

class MyClass implements Constructor {
  constructor(name: string) {
    return name;
  }
}
```

### 14.2 接口扩展

```typescript
// 单接口扩展
interface Person {
  name: string;
}

interface Employee extends Person {
  employeeId: number;
  department: string;
}

// 多接口扩展
interface A {
  a: string;
}

interface B {
  b: number;
}

interface C extends A, B {
  c: boolean;
}

// 接口合并
interface User {
  name: string;
}

interface User {
  age: number;
}

// 合并后：{ name: string; age: number }
const user: User = { name: "Alice", age: 25 };
```

### 14.3 类型别名（Type Alias）

```typescript
// 基本类型别名
type ID = string | number;
type Status = "pending" | "approved" | "rejected";

// 对象类型别名
type User = {
  id: number;
  name: string;
  email: string;
};

// 数组类型别名
type NumberArray = number[];
type StringArray = Array<string>;

// 函数类型别名
type Comparator = (a: number, b: number) => number;

// 联合类型别名
type Point = [number, number];
type EventHandler = (event: Event) => void;
```

### 14.4 接口 vs 类型别名

```typescript
// 接口 - 适合定义对象形状
interface User {
  name: string;
  age: number;
}

// 类型别名 - 适合联合类型、元组等
type ID = string | number;
type Coordinates = [number, number];

// 接口可以扩展和合并
interface A { a: string; }
interface A { b: number; }  // 合并

// 类型别名不能合并
// type B = { a: string; }
// type B = { b: number; }  // 错误

// 接口更适合被实现
class MyClass implements User {}

// 类型别名可以用 extends（条件类型）
type IsString<T> = T extends string ? true : false;
```

### 14.5 映射类型

```typescript
// Partial - 所有属性可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; }

// Required - 所有属性必需
type RequiredUser = Required<User>;

// Pick - 选取部分属性
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string; }

// Omit - 排除部分属性
type UserWithoutEmail = Omit<User, "email">;
// { id: number; name: string; }

// Record - 键值对类型
type UserMap = Record<string, User>;
type StatusMap = Record<Status, number>;

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>;

// Extract - 提取联合类型子集
type Positive = Extract<number, 1 | 2 | 3>;

// Exclude - 排除联合类型子集
type NonZero = Exclude<0 | 1 | 2 | 3, 0>;

// ReturnType - 获取函数返回类型
type FetchResult = ReturnType<typeof fetch>;

// Parameters - 获取函数参数类型
type FetchParams = Parameters<typeof fetch>;

// Awaited - 获取 Promise 解析类型
type Unpromised<T> = Awaited<Promise<T>>;
```

### 14.6 条件类型

```typescript
// 基本条件类型
type IsString<T> = T extends string ? true : false;

type IsString1 = IsString<string>;  // true
type IsString2 = IsString<number>;  // false

// 分布式条件类型
type ToString<T> = T extends string | number ? string : never;

// 提取属性类型
type PropertyType<T, K extends keyof T> = T[K];

type UserName = PropertyType<User, "name">;  // string

// 复杂的条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
```

---

## 15. 类与面向对象

### 15.1 基本类

```typescript
class Person {
  // 公共属性
  name: string;
  age: number;

  // 构造函数
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 方法
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }

  // 静态方法
  static createAnonymous(): Person {
    return new Person("Anonymous", 0);
  }
}

const person = new Person("Alice", 25);
console.log(person.greet());
```

### 15.2 访问修饰符

```typescript
class Person {
  public name: string;      // 公共（默认）
  protected age: number;    // 受保护（类及其子类可访问）
  private email: string;    // 私有（仅类内部可访问）

  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }
}

class Employee extends Person {
  // this.age;  // ✅ 可以访问 protected
  // this.email;  // ❌ 不能访问 private
}

const p = new Person("Alice", 25, "alice@example.com");
// p.name;  // ✅
// p.age;  // ❌
// p.email;  // ❌
```

### 15.3 属性简写

```typescript
class Person {
  // 构造函数参数属性简写
  constructor(
    public name: string,
    private age: number,
    protected department: string,
    readonly id: number
  ) {}
}

// 等价于：
class Person2 {
  name: string;
  private age: number;
  protected department: string;
  readonly id: number;

  constructor(name: string, age: number, department: string, id: number) {
    this.name = name;
    this.age = age;
    this.department = department;
    this.id = id;
  }
}
```

### 15.4 Getter 和 Setter

```typescript
class Person {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  // Getter
  get name(): string {
    return this._name;
  }

  // Setter
  set name(value: string) {
    if (value.length === 0) {
      throw new Error("Name cannot be empty");
    }
    this._name = value;
  }
}

const person = new Person("Alice");
console.log(person.name);  // 调用 getter
person.name = "Bob";       // 调用 setter
```

### 15.5 继承

```typescript
class Animal {
  constructor(public name: string) {}

  speak(): string {
    return "Some sound";
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);  // 调用父类构造函数
    this.breed = breed;
  }

  // 方法重写
  speak(): string {
    return "Woof!";
  }

  fetch(): void {
    console.log(`${this.name} is fetching`);
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak());  // "Woof!"
```

### 15.6 抽象类

```typescript
// 抽象类不能被实例化
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  describe(): string {
    return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius * this.radius;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

// const shape = new Shape();  // ❌ 错误：不能实例化抽象类
const circle = new Circle(5);
console.log(circle.describe());
```

### 15.7 实现接口

```typescript
interface Drawable {
  draw(): void;
}

interface Resizable {
  resize(factor: number): void;
}

class Rectangle implements Drawable, Resizable {
  constructor(public width: number, public height: number) {}

  draw(): void {
    console.log(`Drawing rectangle: ${this.width}x${this.height}`);
  }

  resize(factor: number): void {
    this.width *= factor;
    this.height *= factor;
  }
}
```

### 15.8 类类型

```typescript
// 类类型
interface PointConstructor {
  new (x: number, y: number): Point;
}

interface Point {
  x: number;
  y: number;
}

class PointImpl implements Point {
  constructor(public x: number, public y: number) {}
}

function createPoint(ctor: PointConstructor): Point {
  return new ctor(0, 0);
}
```

---

## 16. 泛型

泛型允许创建可重用的组件，这些组件可以工作于多种类型。

### 16.1 泛型函数

```typescript
// 基本泛型函数
function identity<T>(arg: T): T {
  return arg;
}

const output1 = identity<string>("hello");  // 显式指定
const output2 = identity("hello");          // 类型推断

// 多个类型参数
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const result = merge({ a: 1 }, { b: 2 });
// 类型：{ a: number; b: number }
```

### 16.2 泛型接口

```typescript
// 泛型接口
interface Box<T> {
  value: T;
}

const stringBox: Box<string> = { value: "hello" };
const numberBox: Box<number> = { value: 42 };

// 泛型方法接口
interface Repository<T> {
  get(id: string): T;
  save(entity: T): void;
  delete(id: string): void;
}

class UserRepository implements Repository<User> {
  get(id: string): User { /* ... */ }
  save(entity: User): void { /* ... */ }
  delete(id: string): void { /* ... */ }
}
```

### 16.3 泛型类

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
console.log(numberStack.pop());  // 2
```

### 16.4 泛型约束

```typescript
// 使用 extends 约束
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length);
}

logLength("hello");      // ✅ string 有 length
logLength([1, 2, 3]);    // ✅ array 有 length
// logLength(123);       // ❌ number 没有 length

// 约束类
class Animal {
  speak(): void {}
}

class Dog extends Animal {
  speak(): void { console.log("Woof"); }
}

function makeSound<T extends Animal>(animal: T): void {
  animal.speak();
}
```

### 16.5 泛型类型参数

```typescript
// 在类型中使用泛型
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 默认类型参数
function identity<T = string>(arg: T): T {
  return arg;
}

const output = identity("hello");  // T 默认为 string

// 联合类型约束
function getLength<T extends string | number>(value: T): number {
  return value.length ?? value.toString().length;
}
```

### 16.6 实用泛型工具

```typescript
// 获取数组元素类型
type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

type Element = ArrayElement<[string, number, boolean]>;  // string | number | boolean

// 获取函数参数类型
type FunctionParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

// 获取函数返回类型
type FunctionReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

// 条件泛型
type IsArray<T> = T extends readonly any[] ? true : false;

type T1 = IsArray<string[]>;  // true
type T2 = IsArray<string>;    // false
```

---

## 17. 高级类型

### 17.1 联合类型进阶

```typescript
// 类型收窄
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();  // value: string
  }
  return value.toFixed(2);  // value: number
}

// 字面量类型
type Direction = "up" | "down" | "left" | "right";
type Status = 0 | 1 | 2;

// 区分字面量和基础类型
type Size = "small" | "medium" | "large";

function setSize(size: Size) {
  // size 只能是 "small"、"medium" 或 "large"
}
```

### 17.2 交叉类型进阶

```typescript
// 多个接口交叉
interface A { a: string; }
interface B { b: number; }
interface C { c: boolean; }

type ABC = A & B & C;

// 覆盖属性
interface X { name: string; }
interface Y { name: number; }

type XY = X & Y;  // { name: string & number } = { name: never }

// 部分覆盖
interface Base {
  id: number;
  name: string;
}

type ReadOnlyBase = Base & { readonly id: number };
```

### 17.3 工具类型

```typescript
// Partial - 所有属性可选
type PartialUser = Partial<User>;

// Required - 所有属性必需
type RequiredUser = Required<User>;

// Pick - 选取属性
type UserPreview = Pick<User, "id" | "name">;

// Omit - 排除属性
type UserInternal = Omit<User, "password">;

// Record - 映射类型
type UserMap = Record<string, User>;
type PermissionMap = Record<Permission, boolean>;

// Readonly - 所有属性只读
type Config = Readonly<Settings>;

// Extract - 提取子集
type PositiveNumbers = Extract<number, 1 | 2 | 3>;

// Exclude - 排除子集
type NonZero = Exclude<0 | 1 | 2, 0>;

// Pick 和 Omit 组合
type UserPublic = Pick<User, "id" | "name" | "email">;
type UserInternal = Omit<UserPublic, "email"> & { password: string };
```

### 17.4 条件类型进阶

```typescript
// 嵌套条件类型
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// 映射 + 条件
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// 推断类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Result = UnwrapPromise<Promise<string>>;  // string

// 可分配性检查
type IsAssignable<T, U> = T extends U ? true : false;
```

### 17.5 模板字面量类型

```typescript
// 基本模板字面量
type Event = "click" | "hover" | "focus";
type EventHandler<T extends Event> = `on${Capitalize<T>}`;

type ClickHandler = EventHandler<"click">;  // "onClick"

// 联合模板字面量
type CSSProperties = `--${string}`;
type ClassName = `${string}-${string}-${string}`;

// 条件模板字面量
type APIEndpoint = `/api/v${1 | 2}/${"users" | "posts"}`;
// "/api/v1/users" | "/api/v1/posts" | "/api/v2/users" | "/api/v2/posts"

// 字符串操作
type Upper<T extends string> = T extends `${infer A}${infer Rest}`
  ? `${Uppercase<A>}${Upper<Rest>}`
  : T;
```

### 17.6 字符串操作类型

```typescript
// TypeScript 4.1+ 字符串操作
type Greeting = `Hello, ${string}!`;

// 内置字符串工具类型
type A = Uppercase<"hello">;  // "HELLO"
type B = Lowercase<"HELLO">;  // "hello"
type C = Capitalize<"hello">; // "Hello"
type D = Uncapitalize<"Hello">; // "hello"

// 字符串操作（TypeScript 5.0+）
type A = Replace<"hello world", "world", "ts">;  // "hello ts"
type B = Replace<"hello world", "l", "x">;       // "hexxo world"
type C = Replace<"hello world", "l", "x", 2>;    // "hexlo world"

type D = Split<"a,b,c", ",">;  // ["a", "b", "c"]
type E = Join<["a", "b", "c"], ",">;  // "a,b,c"

type F = Trim<"  hello  ">;  // "hello"
type G = StartsWith<"hello", "hel">;  // true
type H = EndsWith<"hello", "lo">;     // true
```

### 17.7 元组类型进阶

```typescript
// 固定长度元组
type Point = [number, number];
type RGB = [number, number, number];

// 可变长度元组
type Strings = [string, ...string[]];

// 嵌套元组
type Nested = [number, [string, boolean]];

// 元组操作
type Head<T extends any[]> = T extends [infer H, ...infer _] ? H : never;
type Tail<T extends any[]> = T extends [infer _, ...infer R] ? R : never;

type H = Head<[1, 2, 3]>;  // 1
type T = Tail<[1, 2, 3]>;  // [2, 3]
```

---

## 18. 装饰器

装饰器是一种特殊声明，可以附加到类声明、方法、访问符、参数或属性上。

### 18.1 类装饰器

```typescript
// 类装饰器
function sealed(constructor: Function): void {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
}
```

### 18.2 属性装饰器

```typescript
// 属性装饰器
function logged(target: any, propertyKey: string | symbol): void {
  const original = target[propertyKey];
  target[propertyKey] = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return original.apply(this, args);
  };
}

class Calculator {
  @logged
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### 18.3 方法装饰器

```typescript
// 方法装饰器
function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}

class Example {
  @enumerable(false)
  method() {}
}
```

### 18.4 参数装饰器

```typescript
// 参数装饰器
function logParameter(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number
): void {
  console.log(`Parameter ${parameterIndex} of ${propertyKey}`);
}

class Service {
  method(@logParameter param: string) {}
}
```

### 18.5 装饰器工厂

```typescript
// 装饰器工厂
function optional() {
  return function (target: any, propertyKey: string) {
    const original = target[propertyKey];
    target[propertyKey] = function (...args: any[]) {
      if (args.length > 0) {
        return original.apply(this, args);
      }
      return original.apply(this, [undefined]);
    };
  };
}

// 带参数的装饰器工厂
function validate(min: number, max: number) {
  return function (target: any, propertyKey: string) {
    let privateValue: number;

    const getter = function (): number {
      return privateValue;
    };

    const setter = function (value: number) {
      if (value < min || value > max) {
        throw new Error(`Value must be between ${min} and ${max}`);
      }
      privateValue = value;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
}

class Person {
  @validate(0, 150)
  age: number;
}
```

### 18.6 实际应用场景

```typescript
// JSON 序列化装饰器
function json() {
  return function (target: any, propertyKey: string) {
    const original = target[propertyKey];
    target[propertyKey] = function () {
      const result = original.apply(this, arguments);
      return JSON.stringify(result);
    };
  };
}

class API {
  @json
  getData() {
    return { name: "Alice", age: 25 };
  }
}

// 授权装饰器
function requireAuth(roles: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const user = this.getCurrentUser();
      if (!roles.includes(user.role)) {
        throw new Error("Unauthorized");
      }
      return original.apply(this, args);
    };
  };
}

class AdminPanel {
  @requireAuth(["admin"])
  deleteUser(id: number) {}
}
```

---

## 19. 模块与命名空间

### 19.1 ES 模块

```typescript
// 导出
export const name = "TypeScript";
export const version = 5.0;

export interface User {
  id: number;
  name: string;
}

export function greet(user: User): string {
  return `Hello, ${user.name}`;
}

// 默认导出
export default class UserService {
  // ...
}

// 导入
import { name, version, User, greet } from "./module";
import UserService from "./module";
import * as Module from "./module";

// 重新导出
export { name } from "./other";
export { greet as sayHello } from "./module";
```

### 19.2 模块合并

```typescript
// 文件 1: shapes.ts
export namespace Shapes {
  export class Circle {
    constructor(public radius: number) {}
  }
}

// 文件 2: shapes.ts（同一文件或其他文件）
export namespace Shapes {
  export class Square {
    constructor(public side: number) {}
  }
}

// 使用
import { Shapes } from "./shapes";
const circle = new Shapes.Circle(5);
const square = new Shapes.Square(10);
```

### 19.3 命名空间

```typescript
// 命名空间
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }

  export const lettersRegexp = /^[A-Za-z]+$/;

  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string): boolean {
      return lettersRegexp.test(s);
    }
  }
}

// 使用
const validator: Validation.StringValidator = new Validation.LettersOnlyValidator();
```

### 19.4 模块路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@utils/*": ["utils/*"],
      "@components/*": ["components/*"],
      "@types/*": ["types/*"]
    }
  }
}
```

```typescript
// 使用别名
import { formatDate } from "@utils/date";
import { Button } from "@components/Button";
```

### 19.5 声明文件

```typescript
// .d.ts 文件
declare module "my-library" {
  export function doSomething(value: string): void;
  export interface Config {
    enabled: boolean;
  }
}

// 全局声明
declare global {
  interface Window {
    customProp: string;
  }
}

export {};
```

---

## 20. 最佳实践

### 20.1 严格模式配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 20.2 类型命名规范

```typescript
// 接口：用于定义对象形状，可被实现
interface User {
  id: number;
  name: string;
}

// 类型别名：用于联合类型、元组、复杂类型
type ID = string | number;
type Coordinates = [number, number];

// 类：用于创建实例
class UserService {
  // ...
}
```

### 20.3 避免 any

```typescript
// ❌ 不推荐
function processData(data: any) {
  return data.value;
}

// ✅ 推荐
function processData<T>(data: { value: T }): T {
  return data.value;
}

// ✅ 或使用 unknown
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return data.value;
  }
}
```

### 20.4 使用类型守卫

```typescript
// 自定义类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

function process(value: unknown) {
  if (isUser(value)) {
    console.log(value.name);  // 类型安全
  }
}
```

### 20.5 代码组织

```
src/
├── types/          # 类型定义
│   ├── user.ts
│   └── api.ts
├── utils/          # 工具函数
│   └── helpers.ts
├── services/       # 服务层
│   └── api.ts
├── components/     # 组件
└── index.ts        # 入口
```

### 20.6 性能优化

```typescript
// 使用增量编译
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}

// 使用 skipLibCheck
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}

// 使用 declaration 只生成需要的声明文件
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

---

## 总结

TypeScript 为 JavaScript 开发带来了强大的类型系统和现代化的开发体验。通过本文的学习，你应该掌握了：

1. **基础内容**：安装配置、基础类型、变量声明、运算符、控制流
2. **函数相关**：函数声明、函数重载、箭头函数
3. **面向对象**：类、继承、接口、抽象类
4. **高级特性**：泛型、高级类型、装饰器、迭代器
5. **工程化**：模块系统、编译选项、最佳实践

TypeScript 的学习是一个持续的过程，建议在实际项目中不断练习，逐步掌握更多高级特性。随着 TypeScript 版本的更新，还会有更多新特性出现，保持学习的态度非常重要。

### 推荐资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)

---