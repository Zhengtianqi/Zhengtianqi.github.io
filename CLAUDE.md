# CLAUDE.md

本文件为 Claude Code（及兼容 AI 助手）在本仓库中作业的指引，约定项目背景、构建命令、目录结构与内容规范。

## 项目概述

- 名称：郑天祺的博客（`blog`，version 2.0.0）

- 站点：<https://zhengtianqi.github.io>

- 作者：郑天祺

- 语言：简体中文（`lang: zh-CN`，`base: "/"`）

- 形态：基于 VuePress 2 + vuepress-theme-hope 的个人技术博客，部署于 GitHub Pages

## 技术栈

- 包管理器：**pnpm**（已在 `package.json` 中锁定 `packageManager`，GitHub Actions 也使用 pnpm）

- 框架：VuePress 2.0.0-rc.30（`vuepress-vite` bundler）

- 主题：vuepress-theme-hope 2.0.0-rc.107

- 语言：TypeScript（配置文件为 `.ts`）

- Node：CI 使用 Node 24，构建需预留约 12GB 内存（`NODE_OPTIONS=--max-old-space-size=12288`）

## 常用命令

```bash
pnpm install              # 安装依赖（CI 使用 --frozen-lockfile）
pnpm run docs:dev         # 本地开发（vuepress-vite dev src）
pnpm run docs:clean-dev   # 清理缓存后启动开发
pnpm run docs:build       # 生产构建（产物在 src/.vuepress/dist）
pnpm run docs:update-package  # 升级主题/插件
```

## 目录结构

```
.
├── .github/workflows/deploy-docs.yml   # CI：构建并部署到 GitHub Pages（仅 master 分支触发）
├── CLAUDE.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── src/
    ├── .vuepress/
    │   ├── config.ts        # VuePress 用户配置（base/lang/title/head）
    │   ├── theme.ts         # 主题配置（navbar/sidebar/plugins/markdown/seo/comment）
    │   ├── navbar.ts        # 导航栏（当前仅首页 "/"）
    │   ├── sidebar.ts       # 侧边栏（"文章" 自动按目录结构生成）
    │   ├── styles/          # config.scss / index.scss / palette.scss
    │   ├── public/          # 静态资源（favicon、logo、文章配图等）
    │   └── dist/            # 构建产物（已 gitignore）
    ├── README.md            # 首页（layout: Blog）
    ├── intro.md             # 个人介绍页
    └── posts/               # 博客文章，按主题分目录
        ├── 产品与协作/
        ├── 刷题/
        ├── 基础知识/        # 含 java/分布式/前端/网络 等子目录
        ├── 大模型/
        ├── 安全/
        ├── 担保/            # 担保业务专栏
        ├── 数据库/          # 含 hdfs/hive/mysql/redis 等子目录
        ├── 数据治理/
        ├── 架构设计/
        ├── 框架/
        ├── 测试/
        ├── 设计模式/
        └── 运维/            # 含 docker/k8s/安装/配置 等子目录
        └── 鸡汤/
```

侧边栏 `sidebar.ts` 中"文章"项使用 `children: "structure"`，会**按目录结构自动生成侧边栏**，因此新增文章只需在对应分类目录下新增 `.md` 文件，无需手动注册。

## 文章编写规范

### Frontmatter（必需）

每篇文章以 YAML frontmatter 开头，字段如下：

```markdown
---
title: 文章标题
tag: ["标签1", "标签2"]
category: 分类名            # 须与 posts/ 下的目录名一致
date: YYYY-MM-DD
---
```

- `title`：文章标题，会渲染为 `<h1>` 之前的页面标题

- `tag`：标签数组

- `category`：分类，**必须对应** **`src/posts/`** **下的实际目录名**（如 `担保`、`大模型`、`刷题`、`架构设计`、`java基础` 等）

- `date`：发布日期，ISO `YYYY-MM-DD` 格式

可选 frontmatter 字段（见 `intro.md`）：`icon`、`cover`、`watermark`、`watermarkText`、`sticky`（置顶权重）等。

### 正文结构

正文首行为一级标题 `# 文章标题`，其后通常跟一段 `>` 引用作为摘要/导语，再按章节展开。通用推荐结构：

```
# 标题
> 摘要引语

## 一、背景
## 二、核心要素
## 三、应用场景
## 四、技术细节
## 五、案例
## 六、挑战与展望
```

技术类文章（如刷题、基础知识）可按需调整章节，但应保持"背景→原理→实操→总结"的递进逻辑。

### 数学公式与计算

- **禁止使用 LaTeX 数学公式**（项目未启用 katex/mathjax，见 `theme.ts` 中被注释的 `math` 配置）

- 公式与计算过程一律使用 **代码块** 或 **Markdown 表格** 呈现，例如：

```text
风险度 = 暴露金额 × 违约概率 × 违约损失率
```

| 指标  | 公式           | 说明            |
| --- | ------------ | ------------- |
| 风险度 | E × PD × LGD | 暴露×违约概率×违约损失率 |

### 图片

- 文章配图统一存放于 `src/.vuepress/public/assets/images/`

- Markdown 中引用路径以 `/assets/images/xxx.png` 形式（`public/` 为根）

- 既有图片多为历史快照命名（`image-YYYYMMDDHHmmss.png`、哈希名）或语义命名（`TCP协议通讯过程.png`），新增图片优先使用语义化文件名

## 主题已启用的 Markdown 能力

`theme.ts` 中已开启（撰写文章时可直接使用）：

- `align` / `figure` / `mark` / `sub` / `sup` / `spoiler` / `tasklist` / `tabs` / `codeTabs` / `imgLazyload` / `imgSize` / `gfm` / `attrs` / `component` / `include` / `vPre` / `plantuml`

- 图表：`chartjs`（Chart.js）、`echarts`、`flowchart`（flowchart.ts）、`mermaid`、`markmap`

- 交互：`vuePlayground`（@vue/repl）、`sandpack`（sandpack-vue3）、`kotlinPlayground`

- 组件：`Badge`、`VPCard`（通过 `components` 插件注入，可在文章中直接使用）

未启用：`math`（katex/mathjax，故不写 LaTeX 公式）、`revealjs`（幻灯片）。

## SEO 与评论

- `seo` 插件已配置 fallback 图片与 `BreadcrumbList` 结构化数据生成

- 评论使用 `Giscus`（仓库 `Zhengtianqi/Zhengtianqi.github.io`，分类 `Announcements`）

- 站点 `hostname: https://zhengtianqi.github.io`，会影响 SEO/搜索/Feed 的绝对链接

## 构建与部署

- 触发：推送到 `master` 分支（见 `.github/workflows/deploy-docs.yml`）

- 流程：checkout → pnpm install（frozen-lockfile）→ `docs:build` → 写入 `.nojekyll` → 上传 artifact → 部署到 GitHub Pages

- 本地验证构建时，建议预留内存：`NODE_OPTIONS=--max-old-space-size=12288 pnpm run docs:build`

## 内容约束（硬性）

1. **文章语言**：简体中文
2. **公式呈现**：用代码块 + Markdown 表格，不用 LaTeX
3. **担保类文章**：保存于 `src/posts/担保/`，须包含行业数据来源（天眼查、企查查、税局数据等）与可落地风控模型，结构遵循"背景→核心要素→应用场景→技术细节→案例→挑战"
4. **分类目录**：`category` frontmatter 值必须与 `src/posts/` 下实际目录名一致；若新建分类，先建目录再写文章
5. **静态资源**：放 `src/.vuepress/public/` 下，文章中用 `/...` 绝对路径引用

## 不可破坏的产物

- `src/.vuepress/.cache/`、`src/.vuepress/.temp/`、`src/.vuepress/dist/` 均为构建产物（已 gitignore），不要提交、不要手动改

