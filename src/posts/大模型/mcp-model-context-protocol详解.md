---
title: "MCP（Model Context Protocol）详解：大模型的 USB-C 接口"
tag: ["MCP", "Model Context Protocol", "Anthropic", "工具调用", "协议设计"]
category: 大模型
date: 2026-07-03
---

# MCP（Model Context Protocol）详解：大模型的 USB-C 接口

> "MCP 之于 AI Agent，如同 USB-C 之于电子设备 —— 一个统一接口，连接无限可能。"

## 引言：为什么需要 MCP？

在 MCP 出现之前，每当你想让大模型连接一个新工具（比如 GitHub、Slack、数据库），你都需要：

1. 阅读 API 文档
2. 手写 Function Calling 的 schema
3. 在代码中实现工具调用逻辑
4. 处理认证、错误、重试
5. 如果换一个模型，可能还要重新适配

**M 个模型 × N 个工具 = M×N 个适配**，这是一个 O(MN) 的灾难。

2024 年 11 月，Anthropic 发布了 **Model Context Protocol（MCP）**，一个开放协议，标准化了应用程序如何向大模型提供上下文。它的目标是把这个 O(MN) 的问题降为 O(M+N)：

```
┌─────────────┐          ┌─────────────┐
│   模型 A     │          │  工具 1      │
│   模型 B     │◄── MCP ──►│  工具 2      │
│   模型 C     │          │  工具 3      │
└─────────────┘          └─────────────┘
    O(M) 适配                  O(N) 适配
```

## 一、MCP 协议设计理念

### 1.1 核心设计原则

MCP 的设计受到 **Language Server Protocol（LSP）** 的深刻启发。LSP 解决了编辑器与语言服务器之间的碎片化问题：以前每个编辑器都要为每种语言单独写插件，有了 LSP 后，任何编辑器都能连接任何语言服务器。

MCP 做了类似的事情，但面向的是大模型与外部工具/数据源的连接：

| 设计原则 | 说明 |
|---------|------|
| **开放标准** | 协议完全开源，不绑定任何模型厂商 |
| **双向通信** | 基于 JSON-RPC 2.0，支持请求-响应和通知 |
| **有状态会话** | Server 可以维护会话状态，支持多轮交互 |
| **传输无关** | 支持 stdio 和 SSE（Server-Sent Events）两种传输方式 |
| **可组合** | 一个 Host 可以同时连接多个 MCP Server |

### 1.2 通信协议：JSON-RPC 2.0

MCP 使用 JSON-RPC 2.0 作为消息格式，这是一种轻量级的远程过程调用协议：

```json
// 客户端 → 服务端：请求
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}

// 服务端 → 客户端：响应
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "search_docs",
        "description": "搜索技术文档库",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "搜索关键词" }
          },
          "required": ["query"]
        }
      }
    ]
  }
}

// 服务端 → 客户端：通知（无 id）
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": { "progress": 50, "total": 100 }
}
```

### 1.3 传输层

MCP 支持两种传输方式：

```
┌─────────────────────────────────────────────────┐
│                  传输方式对比                     │
├──────────────┬──────────────────────────────────┤
│   stdio      │  本地进程通信，适合本地工具        │
│              │  子进程 stdin/stdout 传输 JSON-RPC │
├──────────────┼──────────────────────────────────┤
│   SSE        │  HTTP + Server-Sent Events        │
│              │  适合远程服务和 Web 部署           │
│              │  支持长连接和流式传输              │
└──────────────┴──────────────────────────────────┘
```

## 二、MCP 三大角色：Host / Client / Server

MCP 架构由三个核心角色组成，理解它们的关系是掌握 MCP 的关键：

```
┌───────────────────────────────────────────────────────┐
│                      Host (宿主)                       │
│                   (如 Claude Desktop)                  │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Client A   │  │   Client B   │  │   Client C   │  │
│  │              │  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
     MCP 协议          MCP 协议          MCP 协议
          │                 │                 │
  ┌───────▼───────┐ ┌──────▼────────┐ ┌──────▼───────┐
  │  Server A      │ │  Server B      │ │  Server C     │
  │  (GitHub)      │ │  (数据库)       │ │  (文件系统)    │
  │                │ │                │ │               │
  │ - Tools        │ │ - Tools        │ │ - Resources   │
  │ - Resources    │ │ - Resources    │ │ - Prompts     │
  │ - Prompts      │ │ - Prompts      │ │               │
  └────────────────┘ └────────────────┘ └───────────────┘
```

### 2.1 Host（宿主）

Host 是用户直接交互的应用程序，例如 Claude Desktop、Cursor IDE 等。它的职责：

- **管理生命周期**：启动和停止 MCP Server 进程
- **权限控制**：决定哪些 Server 可以被调用，用户授权机制
- **聚合上下文**：将多个 Server 的能力整合后提供给 LLM
- **UI 渲染**：将 Server 返回的结果展示给用户

### 2.2 Client（客户端）

Client 是 Host 内部的连接管理器，每个 Client 实例负责与一个 Server 通信：

- **协议握手**：初始化连接，协商版本和能力
- **消息路由**：在 Host 和 Server 之间转发 JSON-RPC 消息
- **能力协商**：声明支持哪些特性（tools、resources、prompts）

### 2.3 Server（服务端）

Server 是具体能力的提供者，每个 Server 可以暴露三种能力：

- **Tools**：可执行函数（如搜索代码、查询数据库）
- **Resources**：可读取数据源（如文件内容、数据库记录）
- **Prompts**：预定义的提示模板

## 三、三种能力：Tools / Resources / Prompts

### 3.1 Tools（工具）

Tools 是最常用的能力类型，类似于 Function Calling，但有更丰富的语义：

```python
# MCP Server 暴露一个工具
from mcp.server import Server
from mcp.types import Tool, TextContent
import json

server = Server("weather-server")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_weather",
            description="查询指定城市的天气信息",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如 '北京'"
                    },
                    "units": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位",
                        "default": "celsius"
                    }
                },
                "required": ["city"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "get_weather":
        city = arguments["city"]
        # 实际调用天气 API
        weather_data = await fetch_weather(city)
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "city": city,
                    "temperature": weather_data["temp"],
                    "condition": weather_data["condition"],
                    "humidity": weather_data["humidity"]
                }, ensure_ascii=False)
            )
        ]
```

### 3.2 Resources（资源）

Resources 是只读数据源，模型可以按需读取，但不能执行：

```python
@server.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri="file:///project/docs/architecture.md",
            name="架构文档",
            description="项目架构设计文档",
            mimeType="text/markdown"
        ),
        Resource(
            uri="database://users/schema",
            name="用户表结构",
            description="数据库用户表 schema 信息",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    if uri.startswith("file://"):
        path = uri[7:]
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    elif uri.startswith("database://"):
        # 查询数据库 schema
        return json.dumps(get_table_schema())
```

**Tools vs Resources 的区别：**

| 特性 | Tools | Resources |
|------|-------|-----------|
| 执行方式 | 模型主动调用 | 模型引用读取 |
| 副作用 | 可能有（写数据库、发邮件） | 无（只读） |
| 控制权 | 模型决定何时调用 | 应用决定何时提供 |
| 典型用途 | 搜索、操作、计算 | 文档、配置、数据 |

### 3.3 Prompts（提示模板）

Prompts 是预定义的提示模板，用户可以从 UI 中选择使用：

```python
@server.list_prompts()
async def list_prompts() -> list[Prompt]:
    return [
        Prompt(
            name="code-review",
            description="代码审查提示模板",
            arguments=[
                PromptArgument(
                    name="language",
                    description="编程语言",
                    required=True
                ),
                PromptArgument(
                    name="code",
                    description="待审查的代码",
                    required=True
                )
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> list[PromptMessage]:
    if name == "code-review":
        language = arguments["language"]
        code = arguments["code"]
        return [
            PromptMessage(
                role="user",
                content=TextContent(
                    type="text",
                    text=f"""请审查以下 {language} 代码，关注：
1. 安全性问题
2. 性能瓶颈
3. 可读性与命名规范
4. 潜在 bug

代码：
```
{code}
```

请按严重程度排序输出问题列表。"""
                )
            )
        ]
```

## 四、MCP 与 Function Calling 的对比与互补

### 4.1 核心差异

```
┌─────────────────────────────────────────────────────────┐
│              Function Calling 模式                       │
│                                                         │
│   ┌──────┐    function     ┌──────────┐               │
│   │ 模型  │ ──definitions──►│ 开发者代码 │               │
│   │      │ ◄──result────── │          │               │
│   └──────┘                 └──────────┘               │
│                                                         │
│   特点：紧耦合，每个应用独立实现                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   MCP 模式                               │
│                                                         │
│   ┌──────┐    MCP       ┌────────┐    MCP    ┌───────┐ │
│   │ Host  │ ◄─protocol─►│ Client │ ◄─proto──►│Server │ │
│   │      │              └────────┘           └───────┘ │
│   └──────┘                                              │
│                                                         │
│   特点：标准化协议，解耦模型与工具                        │
└─────────────────────────────────────────────────────────┘
```

### 4.2 详细对比表

| 维度 | Function Calling | MCP |
|------|-----------------|-----|
| **协议** | 各厂商自定义格式 | 开放标准 JSON-RPC 2.0 |
| **发现机制** | 硬编码在代码中 | 运行时动态发现（list_tools） |
| **复用性** | 每个应用重新实现 | 写一次 Server，到处用 |
| **状态管理** | 无状态（通常） | 有状态会话 |
| **传输方式** | 进程内函数调用 | stdio / SSE（可远程） |
| **能力类型** | 仅有工具调用 | Tools + Resources + Prompts |
| **权限控制** | 完全由开发者控制 | 协议层面支持用户授权 |
| **生态** | 各厂商各自为政 | 开放生态，社区共建 |

### 4.3 互补关系

MCP 并不是要完全取代 Function Calling，它们是互补的：

```python
# 场景对比

# 场景 1：简单内部工具 → Function Calling 更合适
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().isoformat()

# 场景 2：连接外部服务 → MCP 更合适
# 一个 MCP GitHub Server 可以被 Claude Desktop、Cursor、
# Windsurf 等所有支持 MCP 的客户端使用

# 场景 3：需要动态发现工具 → MCP 更合适
# MCP Server 可以根据上下文动态暴露不同工具集

# 场景 4：高性能要求 → Function Calling 更合适
# MCP 的 JSON-RPC 序列化/反序列化有额外开销
```

## 五、实战：搭建一个 MCP Server

下面我们搭建一个完整的「技术文档搜索」MCP Server，支持工具调用和资源读取：

### 5.1 项目结构

```
mcp-doc-search/
├── pyproject.toml
├── server.py
└── docs/
    ├── python.md
    ├── javascript.md
    └── rust.md
```

### 5.2 完整实现

```python
# server.py
"""
技术文档搜索 MCP Server
提供文档搜索工具和文档资源读取
"""
import asyncio
import json
import os
from pathlib import Path
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    Resource,
    TextContent,
    Prompt,
    PromptArgument,
    PromptMessage,
    GetPromptResult
)

# ── 初始化 Server ──
server = Server("doc-search")
DOCS_DIR = Path(__file__).parent / "docs"

# ── 文档索引 ──
def build_index():
    """构建简单的文档索引"""
    index = {}
    for doc_path in DOCS_DIR.glob("*.md"):
        content = doc_path.read_text(encoding="utf-8")
        index[doc_path.stem] = {
            "path": str(doc_path),
            "title": doc_path.stem,
            "content": content,
            "words": set(content.lower().split())
        }
    return index

DOC_INDEX = {}

@server.initialize()
async def handle_initialize():
    global DOC_INDEX
    DOC_INDEX = build_index()
    return {
        "protocolVersion": "2024-11-05",
        "serverInfo": {"name": "doc-search", "version": "1.0.0"},
        "capabilities": {
            "tools": {},
            "resources": {},
            "prompts": {}
        }
    }

# ── Tools ──
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_docs",
            description="搜索技术文档库。输入关键词，返回匹配的文档片段。",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回结果数量上限",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="list_all_docs",
            description="列出所有可用的技术文档",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="summarize_doc",
            description="生成指定文档的摘要",
            inputSchema={
                "type": "object",
                "properties": {
                    "doc_name": {
                        "type": "string",
                        "description": "文档名称（不含扩展名）"
                    }
                },
                "required": ["doc_name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "search_docs":
        query = arguments["query"].lower()
        limit = arguments.get("limit", 5)
        query_words = set(query.split())

        results = []
        for doc_name, doc_data in DOC_INDEX.items():
            # 简单的词频匹配
            overlap = query_words & doc_data["words"]
            if overlap:
                score = len(overlap) / len(query_words) if query_words else 0
                # 找到匹配的上下文片段
                content = doc_data["content"]
                snippets = []
                for i, line in enumerate(content.split("\n")):
                    if any(w in line.lower() for w in query_words):
                        start = max(0, i - 1)
                        end = min(len(content.split("\n")), i + 2)
                        snippets.append("\n".join(content.split("\n")[start:end]))

                results.append({
                    "doc": doc_name,
                    "score": round(score, 2),
                    "snippets": snippets[:3]
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:limit]

        if not results:
            return [TextContent(type="text", text=f"未找到与 '{query}' 相关的文档")]

        return [TextContent(
            type="text",
            text=json.dumps(results, ensure_ascii=False, indent=2)
        )]

    elif name == "list_all_docs":
        docs = [{"name": k, "size": len(v["content"])} for k, v in DOC_INDEX.items()]
        return [TextContent(
            type="text",
            text=json.dumps(docs, ensure_ascii=False, indent=2)
        )]

    elif name == "summarize_doc":
        doc_name = arguments["doc_name"]
        if doc_name not in DOC_INDEX:
            return [TextContent(type="text", text=f"文档 '{doc_name}' 不存在")]
        content = DOC_INDEX[doc_name]["content"]
        # 简单提取标题和首段作为摘要
        lines = content.split("\n")
        headings = [l for l in lines if l.startswith("#")]
        first_para = ""
        for line in lines:
            if line.strip() and not line.startswith("#"):
                first_para = line.strip()
                break
        summary = {
            "doc": doc_name,
            "headings": headings,
            "preview": first_para[:200],
            "total_lines": len(lines)
        }
        return [TextContent(
            type="text",
            text=json.dumps(summary, ensure_ascii=False, indent=2)
        )]

    return [TextContent(type="text", text=f"未知工具: {name}")]

# ── Resources ──
@server.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri=f"doc://{doc_name}",
            name=doc_name,
            description=f"技术文档: {doc_name}",
            mimeType="text/markdown"
        )
        for doc_name in DOC_INDEX.keys()
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    # 解析 URI: doc://python
    if uri.startswith("doc://"):
        doc_name = uri[6:]
        if doc_name in DOC_INDEX:
            return DOC_INDEX[doc_name]["content"]
    raise ValueError(f"未知资源 URI: {uri}")

# ── Prompts ──
@server.list_prompts()
async def list_prompts() -> list[Prompt]:
    return [
        Prompt(
            name="explain-concept",
            description="基于文档库解释某个技术概念",
            arguments=[
                PromptArgument(
                    name="concept",
                    description="要解释的技术概念",
                    required=True
                )
            ]
        )
    ]

@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> GetPromptResult:
    if name == "explain-concept":
        concept = arguments["concept"]
        # 先搜索相关文档
        related = []
        for doc_name, doc_data in DOC_INDEX.items():
            if concept.lower() in doc_data["content"].lower():
                related.append(doc_name)

        context = ""
        if related:
            context = f"\n\n相关文档：{', '.join(related)}\n"
            for r in related[:3]:
                context += f"\n--- {r} ---\n"
                context += DOC_INDEX[r]["content"][:1000] + "...\n"

        return GetPromptResult(
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(
                        type="text",
                        text=f"""请解释概念：{concept}

请基于以下文档内容进行解释，确保准确性和深度。{context}

要求：
1. 给出清晰的定义
2. 提供使用场景
3. 列出关键注意事项"""
                    )
                )
            ]
        )

# ── 启动 Server ──
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)

if __name__ == "__main__":
    asyncio.run(main())
```

### 5.3 配置到 Claude Desktop

在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "doc-search": {
      "command": "python",
      "args": ["server.py"],
      "cwd": "/path/to/mcp-doc-search"
    }
  }
}
```

### 5.4 使用 Python SDK 测试

```python
"""测试 MCP Server"""
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_server():
    # 连接 Server
    server_params = StdioServerParameters(
        command="python",
        args=["server.py"],
        cwd="/path/to/mcp-doc-search"
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 初始化
            await session.initialize()

            # 列出工具
            tools = await session.list_tools()
            print("可用工具:")
            for tool in tools.tools:
                print(f"  - {tool.name}: {tool.description}")

            # 列出资源
            resources = await session.list_resources()
            print("\n可用资源:")
            for res in resources.resources:
                print(f"  - {res.uri}: {res.name}")

            # 调用工具
            result = await session.call_tool(
                "search_docs",
                {"query": "async await", "limit": 3}
            )
            print(f"\n搜索结果:\n{result.content[0].text}")

            # 读取资源
            content = await session.read_resource("doc://python")
            print(f"\n文档内容（前 200 字）:\n{content[:200]}")

asyncio.run(test_server())
```

## 六、MCP 生态现状与发展

### 6.1 已有的 MCP Server

截至 2026 年初，社区已经涌现了大量 MCP Server：

| 分类 | Server | 功能 |
|------|--------|------|
| 开发工具 | github-mcp-server | GitHub 仓库管理 |
| | gitlab-mcp-server | GitLab 操作 |
| | filesystem-mcp-server | 文件系统访问 |
| 数据库 | postgres-mcp-server | PostgreSQL 查询 |
| | sqlite-mcp-server | SQLite 操作 |
| 搜索 | brave-search-mcp | Brave 搜索 |
| | google-search-mcp | Google 搜索 |
| 云服务 | aws-mcp-server | AWS 服务管理 |
| | gcp-mcp-server | GCP 操作 |
| 办公 | slack-mcp-server | Slack 消息 |
| | notion-mcp-server | Notion 文档 |

### 6.2 支持的客户端

```
┌─────────────────────────────────────────────┐
│           支持 MCP 的客户端                   │
├──────────────┬──────────────────────────────┤
│ Claude Desktop│ Anthropic 官方桌面应用       │
│ Cursor        │ AI 代码编辑器                │
│ Windsurf      │ AI IDE                      │
│ Zed           │ 高性能编辑器                  │
│ Cline         │ VS Code 插件                │
│ Continue      │ 开源 AI 编程助手              │
└──────────────┴──────────────────────────────┘
```

### 6.3 未来展望

MCP 协议正在快速发展，以下是一些趋势：

1. **远程 MCP Server**：基于 SSE 的远程 Server 将使工具即服务成为可能
2. **MCP Marketplace**：类似 VS Code 插件市场，一键安装 MCP Server
3. **流式输出**：支持 Server 流式返回结果，适合长时间任务
4. **多模态支持**：支持图片、音频等非文本资源
5. **安全沙箱**：Server 在沙箱中执行，防止恶意操作

## 七、面试要点

### Q1：MCP 和 Function Calling 有什么区别？

**核心回答**：Function Calling 是模型层面的能力，定义了模型如何决定调用函数；MCP 是协议层面的标准，定义了应用如何向模型暴露工具和数据。MCP 运行在 Function Calling 之上 —— Host 可以通过 MCP 发现工具，然后将其注册为 Function Calling 的工具定义。MCP 的价值在于标准化和复用性。

### Q2：MCP 的三种能力（Tools/Resources/Prompts）有什么区别？

- **Tools**：模型主动调用的函数，可能有副作用，如搜索、写入、计算
- **Resources**：模型引用读取的只读数据，无副作用，如文件、配置
- **Prompts**：预定义的提示模板，用户从 UI 选择后填充参数，引导模型执行特定任务

### Q3：MCP 如何保证安全？

1. **Host 权限控制**：用户需要授权每个 Server 的访问权限
2. **传输隔离**：stdio 模式下 Server 作为本地子进程运行，SSE 模式支持认证
3. **资源只读**：Resources 设计为只读，减少风险
4. **用户确认**：敏感操作可以要求用户在 Host UI 上确认

### Q4：什么场景适合用 MCP，什么场景适合直接用 Function Calling？

- **适合 MCP**：需要连接多个外部服务、需要复用工具、需要动态发现工具、需要给用户提供工具选择
- **适合 Function Calling**：简单的内部函数、性能敏感场景、不需要跨应用复用

## 八、避坑指南

### 坑 1：不要把所有逻辑都做成 Tool

很多人一上来就把所有功能都做成 Tool，导致工具列表过长，模型选择困难。**最佳实践**：

- 核心功能做成 Tool
- 静态数据做成 Resource
- 常见交互模式做成 Prompt
- 工具数量控制在 5-10 个以内

### 坑 2：stdio 传输模式的缓冲区问题

Python 的 print 默认有缓冲，会导致 JSON-RPC 消息延迟：

```python
# ❌ 错误：有缓冲，消息可能不会立即发送
print(json.dumps(message))

# ✅ 正确：使用 flush 或直接写入 stderr
import sys
print(json.dumps(message), flush=True)
# 或使用 MCP SDK 的 stdio_server，它会正确处理
```

### 坑 3：异步处理的坑

MCP Server 是异步的，如果你调用的底层 API 是同步的，会阻塞事件循环：

```python
# ❌ 错误：阻塞事件循环
@server.call_tool()
async def call_tool(name, arguments):
    result = requests.get("https://api.example.com/data")  # 阻塞！
    return result.text

# ✅ 正确：使用异步 HTTP 客户端
import httpx

@server.call_tool()
async def call_tool(name, arguments):
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.example.com/data")
        return resp.text

# ✅ 也可以：用 run_in_executor 包装同步代码
import asyncio
from functools import partial

@server.call_tool()
async def call_tool(name, arguments):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, requests.get, "https://api.example.com/data")
    return result.text
```

### 坑 4：工具描述要精确

MCP 的工具描述直接决定了模型调用工具的准确率。描述要包括：

- **功能说明**：这个工具做什么
- **输入说明**：每个参数的含义和格式
- **输出说明**：返回什么格式的数据
- **使用条件**：什么时候该用这个工具

### 坑 5：错误处理要友好

当工具执行失败时，返回结构化的错误信息，而不是抛异常：

```python
# ❌ 错误：抛异常，模型不知道发生了什么
@server.call_tool()
async def call_tool(name, arguments):
    result = api_call(arguments["query"])  # 可能抛异常
    return result

# ✅ 正确：返回错误信息，模型可以据此调整
@server.call_tool()
async def call_tool(name, arguments):
    try:
        result = await api_call(arguments["query"])
        return [TextContent(type="text", text=json.dumps(result))]
    except ConnectionError:
        return [TextContent(
            type="text",
            text=json.dumps({"error": "网络连接失败", "retry_after": 5})
        )]
    except ValueError as e:
        return [TextContent(
            type="text",
            text=json.dumps({"error": f"参数错误: {str(e)}"})
        )]
```

## 总结

MCP 是大模型工具生态的重要基础设施。它的核心价值在于**标准化**：让工具开发者写一次 Server，让模型开发者接一次协议，就能实现 N×M 的连接。

关键要点：
1. MCP 是协议，不是框架 —— 它定义了通信规则，不限制实现方式
2. 三种能力（Tools/Resources/Prompts）覆盖了模型与外部世界交互的主要模式
3. MCP 与 Function Calling 互补，不是替代关系
4. 安全性通过 Host 权限控制 + 协议设计 + 用户确认三层保障
5. 生态正在快速发展，现在是参与的好时机

> **一句话总结**：MCP 让工具开发从「为每个模型单独适配」变成了「写一次，到处用」，这是大模型生态走向成熟的重要标志。