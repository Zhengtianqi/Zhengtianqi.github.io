---
title: MFSU 完全指南：从入门到精通

tag:
  - MFSU
category: 前端
date: 2026-05-30
---

# MFSU 完全指南：从入门到精通

---

## 1. MFSU 简介

### 1.1 什么是 MFSU？

MFSU（Micro Frontend Single Page Application）是一个基于微前端架构的单页应用开发框架。它旨在解决大型前端项目中常见的痛点，如：

- **代码复用**：通过微应用实现组件和功能的复用
- **独立部署**：各微应用可以独立开发、测试和部署
- **技术栈无关**：不同微应用可以使用不同的技术栈
- **团队协作**：多个团队可以并行开发不同的微应用
- **渐进式升级**：可以逐步迁移旧项目到新技术栈

### 1.2 MFSU 的核心特性

- **零配置启动**：开箱即用，无需复杂配置
- **路由驱动**：基于路由的微应用加载机制
- **插件化架构**：丰富的插件生态系统
- **TypeScript 优先**：完整的 TypeScript 类型支持
- **性能优化**：代码分割、懒加载、预加载等优化
- **开发体验**：热更新、源码映射、智能提示

### 1.3 MFSU 与其他微前端方案对比

| 特性 | MFSU | qiankun | micro-app | single-spa |
|------|------|---------|-----------|------------|
| 配置复杂度 | 低 | 中 | 低 | 高 |
| 样式隔离 | 自动 | 手动 | 自动 | 手动 |
| JS 沙箱 | 支持 | 支持 | 支持 | 需配置 |
| 路由管理 | 内置 | 需配置 | 内置 | 需配置 |
| 开发体验 | 优秀 | 良好 | 良好 | 一般 |
| 学习曲线 | 平缓 | 中等 | 平缓 | 陡峭 |

---

## 2. 开发环境搭建

### 2.1 系统要求

- **Node.js**：>= 16.0.0（推荐 18.x LTS）
- **npm/yarn/pnpm**：任意一个包管理器
- **操作系统**：Windows / macOS / Linux

### 2.2 安装 Node.js

```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v

# 使用 nvm 管理 Node.js 版本（推荐）
nvm install 18
nvm use 18
nvm alias default 18
```

### 2.3 创建 MFSU 项目

#### 方式一：使用官方脚手架

```bash
# 使用 npm create
npm create mfsu@latest

# 使用 yarn
yarn create mfsu

# 使用 pnpm
pnpm create mfsu
```

#### 方式二：使用 npx 快速创建

```bash
npx mfsu-cli create my-app
cd my-app
npm install
npm run dev
```

#### 方式三：手动初始化

```bash
# 创建项目目录
mkdir my-mfsu-app
cd my-mfsu-app

# 初始化 package.json
npm init -y

# 安装 MFSU 核心依赖
npm install @mfsu/core
npm install -D @mfsu/cli @mfsu/vite-plugin

# 创建配置文件
npx mfsu init
```

### 2.4 项目结构初始化

```bash
# 运行开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 2.5 开发工具推荐

```json
{
  "推荐插件": {
    "VS Code": [
      "Volar (Vue 3)",
      "ESLint",
      "Prettier",
      "Path Intellisense",
      "Auto Rename Tag"
    ],
    "WebStorm": [
      "内置 TypeScript 支持",
      "内置 ESLint",
      "内置 Git 集成"
    ]
  }
}
```

---

## 3. 项目目录结构

### 3.1 标准目录结构

```
my-mfsu-app/
├── public/                 # 静态资源目录
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── apps/              # 微应用目录
│   │   ├── app1/          # 微应用 1
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── mfsu.config.ts
│   │   └── app2/          # 微应用 2
│   ├── shared/            # 共享代码
│   │   ├── components/    # 共享组件
│   │   ├── utils/         # 工具函数
│   │   ├── types/         # 类型定义
│   │   └── styles/        # 共享样式
│   ├── layouts/           # 布局组件
│   │   ├── MainLayout.vue
│   │   └── AuthLayout.vue
│   ├── router/            # 路由配置
│   │   └── index.ts
│   ├── plugins/           # 插件配置
│   ├── mock/              # Mock 数据
│   ├── styles/            # 全局样式
│   │   └── variables.css
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── tests/                 # 测试文件
│   ├── unit/
│   └── e2e/
├── mfsu.config.ts         # MFSU 配置文件
├── vite.config.ts         # Vite 配置文件
├── tsconfig.json          # TypeScript 配置
├── package.json
└── README.md
```

### 3.2 微应用目录结构

```
apps/app1/
├── src/
│   ├── components/        # 应用组件
│   ├── views/             # 页面视图
│   ├── stores/            # 状态管理
│   ├── composables/       # 组合式函数
│   ├── api/               # API 请求
│   ├── types/             # 类型定义
│   └── index.ts           # 应用入口
├── public/                # 应用静态资源
├── package.json
└── mfsu.app.config.ts     # 应用配置
```

### 3.3 共享代码目录

```
shared/
├── components/
│   ├── Button/
│   │   ├── Button.vue
│   │   ├── Button.ts
│   │   └── index.ts
│   └── Input/
│       ├── Input.vue
│       └── index.ts
├── utils/
│   ├── request.ts
│   ├── storage.ts
│   └── format.ts
├── types/
│   ├── user.ts
│   └── common.ts
├── styles/
│   ├── variables.css
│   └── mixins.css
└── index.ts               # 统一导出
```

---

## 4. 路由系统

### 4.1 基础路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { defineRoute } from '@mfsu/router'

const routes = [
  // 普通路由
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  
  // 微应用路由
  defineRoute({
    path: '/app1',
    name: 'App1',
    app: 'app1',  // 微应用标识
    layout: 'MainLayout',
  }),
  
  // 嵌套路由
  {
    path: '/user',
    component: () => import('@/layouts/UserLayout.vue'),
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/User/Profile.vue'),
      },
      {
        path: 'settings',
        name: 'UserSettings',
        component: () => import('@/views/User/Settings.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

### 4.2 路由元信息

```typescript
{
  path: '/dashboard',
  name: 'Dashboard',
  component: () => import('@/views/Dashboard.vue'),
  meta: {
    title: '仪表盘',           // 页面标题
    requiresAuth: true,        // 需要认证
    roles: ['admin', 'user'],  // 所需角色
    layout: 'MainLayout',      // 布局组件
    keepAlive: true,           // 保持激活状态
    menu: {
      icon: 'dashboard',
      order: 1,
      parent: 'system'
    }
  }
}
```

### 4.3 路由守卫

```typescript
// router/guards.ts
import router from './index'

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - MFSU` : 'MFSU'
  
  // 权限检查
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next('/login')
      return
    }
  }
  
  // 角色检查
  if (to.meta.roles) {
    const userRoles = getUserRoles()
    if (!to.meta.roles.some(role => userRoles.includes(role))) {
      next('/unauthorized')
      return
    }
  }
  
  next()
})

// 全局后置守卫
router.afterEach((to, from) => {
  // 页面动画
  document.body.classList.add('fade-in')
  setTimeout(() => {
    document.body.classList.remove('fade-in')
  }, 300)
  
  // 滚动到顶部
  window.scrollTo(0, 0)
})

// 路由解析守卫
router.beforeResolve((to, from, next) => {
  // 路由解析前的最后检查
  if (to.name === 'App1') {
    // 预加载微应用资源
    preloadApp('app1')
  }
  next()
})
```

### 4.4 动态路由

```typescript
// router/dynamic.ts
import { RouteRecordRaw } from 'vue-router'

const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: '/module/:moduleId',
    name: 'DynamicModule',
    component: () => import('@/views/DynamicModule.vue'),
  },
]

export function addDynamicRoutes(routes: RouteRecordRaw[]) {
  routes.forEach(route => {
    if (!router.hasRoute(route.name as string)) {
      router.addRoute(route)
    }
  })
}

export function removeDynamicRoutes(routeNames: string[]) {
  routeNames.forEach(name => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
}
```

### 4.5 路由懒加载

```typescript
// 微应用路由懒加载
defineRoute({
  path: '/heavy-app',
  app: 'heavy-app',
  lazy: true,  // 启用懒加载
  preload: 'visible',  // 预加载策略：'immediate' | 'visible' | 'idle'
})

// 组件路由懒加载
{
  path: '/page',
  component: () => import('@/views/Page.vue'),
}
```

### 4.6 路由重定向

```typescript
{
  path: '/old-path',
  redirect: '/new-path',
}

{
  path: '/users',
  redirect: '/users/list',
  children: [
    { path: 'list', component: UsersList },
    { path: ':id', component: UserDetail },
  ],
}

// 外部重定向
{
  path: '/external',
  redirect: 'https://example.com',
}
```

---

## 5. 插件系统

### 5.1 内置插件

MFSU 提供了丰富的内置插件：

```typescript
// mfsu.config.ts
import { defineConfig } from '@mfsu/config'

export default defineConfig({
  plugins: [
    // 路由插件
    mfsuRouter(),
    
    // 状态管理插件
    mfsuPinia(),
    
    // HTTP 请求插件
    mfsuAxios(),
    
    // 国际化插件
    mfsuI18n(),
    
    // 图标插件
    mfsuIcons(),
    
    // 动画插件
    mfsuAnimate(),
  ]
})
```

### 5.2 插件配置

```typescript
// 路由插件配置
mfsuRouter({
  mode: 'history',
  base: '/',
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// Pinia 插件配置
mfsuPinia({
  storesDir: './src/stores',
  autoImport: true,
  devtools: true,
})

// Axios 插件配置
mfsuAxios({
  baseURL: '/api',
  timeout: 10000,
  interceptors: {
    request: (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    response: (error) => {
      if (error.response?.status === 401) {
        router.push('/login')
      }
      return Promise.reject(error)
    },
  },
})
```

### 5.3 插件生命周期

```typescript
// 自定义插件
function myPlugin(options: MyPluginOptions) {
  return {
    name: 'my-plugin',
    
    // 插件安装时调用
    async setup(mfsuApp) {
      console.log('Plugin setup')
    },
    
    // 应用挂载前
    beforeMount() {
      console.log('Before mount')
    },
    
    // 应用挂载后
    async mounted() {
      console.log('Mounted')
    },
    
    // 应用卸载前
    beforeUnmount() {
      console.log('Before unmount')
    },
    
    // 应用卸载后
    unmounted() {
      console.log('Unmounted')
    },
  }
}
```

### 5.4 插件通信

```typescript
// 插件间通信
const pluginBus = {
  events: new Map<string, Set<Function>>(),
  
  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  },
  
  off(event: string, handler: Function) {
    this.events.get(event)?.delete(handler)
  },
  
  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(handler => handler(...args))
  },
}

// 使用
pluginBus.on('user-login', (user) => {
  console.log('User logged in:', user)
})

pluginBus.emit('user-login', { id: 1, name: 'Alice' })
```

---

## 6. Mock 数据

### 6.1 Mock 配置

```typescript
// mock/index.ts
import { setupMock } from '@mfsu/mock'

setupMock({
  // 仅在开发环境启用
  enable: import.meta.env.DEV,
  
  // Mock 文件目录
  mockDir: './src/mock',
  
  // 延迟模拟
  delay: 300,
  
  // 失败模拟
  failRate: 0.1,
})
```

### 6.2 RESTful API Mock

```typescript
// mock/user.ts
import { defineMock } from '@mfsu/mock'

export default defineMock({
  // GET /api/users
  'GET /api/users': {
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
  },
  
  // GET /api/users/:id
  'GET /api/users/:id': ({ params }) => {
    const user = { id: params.id, name: 'Alice', email: 'alice@example.com' }
    return { data: user }
  },
  
  // POST /api/users
  'POST /api/users': ({ body }) => {
    const newUser = { id: Date.now(), ...body }
    return { data: newUser, message: '创建成功' }
  },
  
  // PUT /api/users/:id
  'PUT /api/users/:id': ({ params, body }) => {
    return { data: { id: params.id, ...body }, message: '更新成功' }
  },
  
  // DELETE /api/users/:id
  'DELETE /api/users/:id': ({ params }) => {
    return { message: `用户 ${params.id} 已删除` }
  },
})
```

### 6.3 GraphQL Mock

```typescript
// mock/graphql.ts
import { defineGraphQLMock } from '@mfsu/mock'

export default defineGraphQLMock({
  Query: {
    user: (_, { id }) => ({
      id,
      name: 'Alice',
      email: 'alice@example.com',
    }),
    users: () => [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  },
  Mutation: {
    createUser: (_, { input }) => ({
      id: Date.now(),
      ...input,
    }),
  },
})
```

### 6.4 动态 Mock

```typescript
// mock/dynamic.ts
import { defineMock } from '@mfsu/mock'

let userIds = [1, 2, 3]

export default defineMock({
  // 动态数据
  'GET /api/users': () => {
    return {
      data: userIds.map(id => ({
        id,
        name: `User ${id}`,
      })),
    }
  },
  
  // 添加用户
  'POST /api/users': ({ body }) => {
    const newId = Math.max(...userIds) + 1
    userIds.push(newId)
    return { data: { id: newId, ...body } }
  },
  
  // 删除用户
  'DELETE /api/users/:id': ({ params }) => {
    userIds = userIds.filter(id => id !== params.id)
    return { message: '删除成功' }
  },
})
```

### 6.5 Mock 工具函数

```typescript
// mock/utils.ts
import { defineMock } from '@mfsu/mock'

// 生成随机数据
export function randomUser(id: number) {
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    age: Math.floor(Math.random() * 50) + 18,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  }
}

// 分页数据
export function paginatedData(items: any[], page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    data: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

// 使用
export default defineMock({
  'GET /api/users': ({ query }) => {
    const users = Array.from({ length: 100 }, (_, i) => randomUser(i + 1))
    return paginatedData(users, query.page, query.pageSize)
  },
})
```

---

## 7. 代理配置

### 7.1 基础代理配置

```typescript
// mfsu.config.ts
import { defineConfig } from '@mfsu/config'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      // 简单代理
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      
      // 多个环境代理
      '/api/v1': {
        target: 'http://dev-api.example.com',
        changeOrigin: true,
      },
      '/api/v2': {
        target: 'http://staging-api.example.com',
        changeOrigin: true,
      },
    },
  },
})
```

### 7.2 高级代理配置

```typescript
export default defineConfig({
  server: {
    proxy: {
      // 路径重写
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      
      // 请求头修改
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Custom-Header', 'value')
          })
        },
      },
      
      // WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      
      // 条件代理
      '/api': {
        target: (req) => {
          const env = req.headers['x-env']
          if (env === 'prod') {
            return 'https://prod-api.example.com'
          }
          return 'http://localhost:8080'
        },
        changeOrigin: true,
      },
    },
  },
})
```

### 7.3 环境变量代理

```typescript
// .env.development
VITE_API_BASE=http://dev-api.example.com

// .env.production
VITE_API_BASE=https://api.example.com

// mfsu.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_BASE,
        changeOrigin: true,
      },
    },
  },
})
```

### 7.4 代理拦截器

```typescript
// plugins/api-interceptor.ts
import { definePlugin } from '@mfsu/core'

export function apiInterceptor() {
  return definePlugin({
    name: 'api-interceptor',
    
    setup() {
      // 请求拦截
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const [url, config] = args
          console.log('Request:', url, config)
          
          const response = await target.apply(thisArg, args)
          console.log('Response:', response.status)
          
          return response
        },
      })
    },
  })
}
```

---

## 8. 样式方案

### 8.1 CSS 变量

```css
/* styles/variables.css */
:root {
  /* 颜色 */
  --color-primary: #3b82f6;
  --color-primary-light: #60a5fa;
  --color-primary-dark: #2563eb;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* 字体 */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-lg: 18px;
  
  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* 暗色模式 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
}

[data-theme='dark'] {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
}
```

### 8.2 CSS Modules

```vue
<!-- Button.vue -->
<template>
  <button :class="[$style.button, $style[variant]]">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'outline'
}>()
</script>

<style module>
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.primary:hover {
  background: var(--color-primary-dark);
}

.secondary {
  background: var(--color-secondary);
  color: var(--text-primary);
}

.outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}
</style>
```

### 8.3 Scoped CSS

```vue
<template>
  <div class="container">
    <h1 class="title">标题</h1>
    <p class="text">内容</p>
  </div>
</template>

<style scoped>
.container {
  padding: var(--spacing-lg);
}

.title {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.text {
  color: var(--text-secondary);
}

/* 深度选择器 */
:deep(.child-class) {
  color: red;
}

/* 全局样式 */
:global(.global-class) {
  color: blue;
}
</style>
```

### 8.4 CSS-in-JS

```typescript
// styles/theme.ts
import { css } from '@emotion/react'

export const buttonStyles = {
  primary: css`
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    
    &:hover {
      background: #2563eb;
    }
  `,
  
  secondary: css`
    padding: 8px 16px;
    background: transparent;
    color: #3b82f6;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    cursor: pointer;
  `,
}
```

### 8.5 Tailwind CSS

```typescript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}
```

```vue
<template>
  <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
    点击我
  </button>
</template>
```

### 8.6 样式隔离

```typescript
// mfsu.config.ts
export default defineConfig({
  style: {
    // 样式隔离策略
    isolation: 'shadow-dom',  // 'none' | 'shadow-dom' | 'css-scoping'
    
    // 全局样式
    globalStyles: [
      '@/styles/variables.css',
      '@/styles/reset.css',
    ],
    
    // 样式预处理器
    preprocessor: 'scss',  // 'none' | 'scss' | 'less' | 'sass'
  },
})
```

---

## 9. 路由数据加载

### 9.1 基础数据加载

```typescript
// router/routes.ts
import { defineRoute } from '@mfsu/router'

export default defineRoute({
  path: '/user/:id',
  component: () => import('@/views/UserDetail.vue'),
  
  // 路由数据加载
  load: async ({ params }) => {
    const response = await fetch(`/api/users/${params.id}`)
    const user = await response.json()
    return { user }
  },
})
```

```vue
<!-- UserDetail.vue -->
<template>
  <div v-if="routeData.user">
    <h1>{{ routeData.user.name }}</h1>
    <p>{{ routeData.user.email }}</p>
  </div>
  <div v-else>加载中...</div>
</template>

<script setup lang="ts">
const routeData = useRouteData()
</script>
```

### 9.2 并行数据加载

```typescript
export default defineRoute({
  path: '/dashboard',
  component: () => import('@/views/Dashboard.vue'),
  
  load: async () => {
    // 并行加载多个数据
    const [user, stats, notifications] = await Promise.all([
      fetch('/api/user').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/notifications').then(r => r.json()),
    ])
    
    return { user, stats, notifications }
  },
})
```

### 9.3 条件数据加载

```typescript
export default defineRoute({
  path: '/admin',
  component: () => import('@/views/Admin.vue'),
  
  load: async ({ route }) => {
    const user = await getCurrentUser()
    
    if (!user || !user.isAdmin) {
      throw new RouteError('Unauthorized', 403)
    }
    
    return {
      user,
      permissions: await getUserPermissions(user.id),
    }
  },
})
```

### 9.4 数据加载策略

```typescript
export default defineRoute({
  path: '/heavy-page',
  component: () => import('@/views/HeavyPage.vue'),
  
  load: async () => {
    return { data: await fetchData() }
  },
  
  // 加载策略
  loadStrategy: {
    // 是否等待数据加载完成
    waitForData: true,
    
    // 是否显示骨架屏
    showSkeleton: true,
    
    // 是否缓存数据
    cache: true,
    
    // 缓存过期时间（毫秒）
    cacheTTL: 5 * 60 * 1000,
    
    // 是否后台刷新
    backgroundRefresh: true,
  },
})
```

### 9.5 使用 Load Context

```vue
<template>
  <div>
    <Suspense>
      <template #default>
        <AsyncComponent />
      </template>
      <template #fallback>
        <Skeleton />
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
const loadContext = useLoadContext()

// 访问加载的数据
const data = loadContext.data

// 检查加载状态
const isLoading = loadContext.isLoading
const error = loadContext.error
</script>
```

---

## 10. TypeScript 支持

### 10.1 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    
    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@components/*": ["src/components/*"],
    },
    
    // 类型检查
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
  },
  
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
  ],
  
  "exclude": ["node_modules", "dist"],
  
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

### 10.2 类型声明文件

```typescript
// src/types/mfsu.d.ts
declare module '@mfsu/core' {
  export interface MfsuApp {
    mount(container: Element): void
    unmount(): void
  }
}

// src/types/router.d.ts
declare module '@mfsu/router' {
  export interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
  }
}

// src/types/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 10.3 组件类型定义

```typescript
// src/components/Button/Button.ts
import type { ExtractPropTypes } from 'vue'

export const buttonProps = {
  variant: {
    type: String as PropType<'primary' | 'secondary' | 'outline'>,
    default: 'primary',
  },
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md',
  },
  loading: Boolean,
  disabled: Boolean,
}

export type ButtonProps = ExtractPropTypes<typeof buttonProps>

export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void
}
```

### 10.4 API 类型定义

```typescript
// src/api/types.ts
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  createdAt: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface UserResponse extends ApiResponse<User> {}
export interface UsersResponse extends ApiResponse<User[]> {}
```

### 10.5 泛型工具类型

```typescript
// src/types/utils.ts
// 获取对象值类型
export type ValueOf<T> = T[keyof T]

// 部分必填
export type RequiredDeep<T> = {
  [K in keyof T]-?: T[K] extends object ? RequiredDeep<T[K]> : T[K]
}

// 部分可选
export type OptionalDeep<T> = {
  [K in keyof T]+?: T[K] extends object ? OptionalDeep<T[K]> : T[K]
}

// 只读深度
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

// 排除 null 和 undefined
export type NonNullableDeep<T> = T extends null | undefined
  ? never
  : T extends object
    ? { [K in keyof T]: NonNullableDeep<T[K]> }
    : T

// 响应式类型
export type MaybeRef<T> = T | Ref<T>
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)
```

---

## 11. 环境变量

### 11.1 环境文件

```bash
# .env
# 所有环境共享
NODE_ENV=development

# .env.development
VITE_APP_TITLE=MFSU 开发环境
VITE_API_BASE=http://localhost:8080/api
VITE_DEBUG=true

# .env.production
VITE_APP_TITLE=MFSU 生产环境
VITE_API_BASE=https://api.example.com
VITE_DEBUG=false

# .env.staging
VITE_APP_TITLE=MFSU 预发布环境
VITE_API_BASE=https://staging-api.example.com
VITE_DEBUG=true

# .env.local
# 本地覆盖（不会被提交到 Git）
VITE_API_BASE=http://local-api:8080/api
```

### 11.2 环境变量使用

```typescript
// 访问环境变量
const title = import.meta.env.VITE_APP_TITLE
const apiBase = import.meta.env.VITE_API_BASE
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

// 类型安全的访问
interface ImportMetaEnv {
  VITE_APP_TITLE: string
  VITE_API_BASE: string
  VITE_DEBUG: boolean
}

const env = import.meta.env as unknown as ImportMetaEnv
```

### 11.3 环境配置

```typescript
// src/config/env.ts
export const env = {
  app: {
    title: import.meta.env.VITE_APP_TITLE,
    version: import.meta.env.VITE_APP_VERSION,
  },
  api: {
    base: import.meta.env.VITE_API_BASE,
    timeout: 10000,
  },
  features: {
    debug: import.meta.env.VITE_DEBUG === 'true',
    analytics: import.meta.env.VITE_ANALYTICS === 'true',
  },
}

// 环境检测
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD
export const isStaging = import.meta.env.VITE_ENV === 'staging'
```

### 11.4 条件编译

```typescript
// 开发环境代码
if (import.meta.env.DEV) {
  console.log('开发模式')
  // 开发工具
  initDevTools()
}

// 生产环境代码
if (import.meta.env.PROD) {
  // 生产优化
  initAnalytics()
}

// 条件导入
const debugUtils = import.meta.env.DEV
  ? await import('@/utils/debug')
  : null
```

---

## 12. 脚手架工具

### 12.1 创建项目

```bash
# 使用官方脚手架
npm create mfsu@latest

# 选择模板
# ? 请选择模板：
#   blank          # 空白项目
#   basic          # 基础项目
#   enterprise     # 企业级项目
#   micro-frontend # 微前端项目
```

### 12.2 脚手架命令

```bash
# 创建新应用
npx mfsu-cli create my-app

# 添加微应用
npx mfsu-cli add-app app1

# 添加组件
npx mfsu-cli add-component Button

# 添加页面
npx mfsu-cli add-page dashboard

# 添加路由
npx mfsu-cli add-route

# 添加插件
npx mfsu-cli add-plugin axios

# 初始化 Git
npx mfsu-cli init-git

# 生成文档
npx mfsu-cli generate-docs
```

### 12.3 脚手架配置

```json
// .mfsurc.json
{
  "project": {
    "name": "my-app",
    "version": "1.0.0",
    "type": "micro-frontend"
  },
  "templates": {
    "component": "./templates/component.hbs",
    "page": "./templates/page.hbs",
    "app": "./templates/app.hbs"
  },
  "defaults": {
    "language": "typescript",
    "style": "scss",
    "lint": true
  }
}
```

### 12.4 自定义模板

```handlebars
<!-- templates/component.hbs -->
<template>
  <div class="{{ kebabCase name }}">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  // 属性
}>()

defineEmits<{
  // 事件
}>()
</script>

<style scoped>
.{{ kebabCase name }} {
  /* 样式 */
}
</style>
```

---

## 13. 微生成器

### 13.1 什么是微生成器

微生成器（Micro Generator）是 MFSU 提供的代码生成工具，可以快速生成微应用、组件、页面等代码结构。

### 13.2 使用微生成器

```bash
# 生成微应用
npx mfsu-cli generate app user-center

# 生成组件
npx mfsu-cli generate component UserCard

# 生成页面
npx mfsu-cli generate page user-profile

# 生成 API 类型
npx mfsu-cli generate types api

# 生成测试文件
npx mfsu-cli generate test UserCard
```

### 13.3 生成器配置

```typescript
// generators.config.ts
import { defineGenerators } from '@mfsu/generator'

export default defineGenerators({
  app: {
    template: './templates/app',
    prompts: [
      {
        name: 'name',
        type: 'input',
        message: '应用名称：',
      },
      {
        name: 'description',
        type: 'input',
        message: '应用描述：',
      },
      {
        name: 'framework',
        type: 'list',
        message: '选择框架：',
        choices: ['Vue', 'React', 'Solid'],
      },
    ],
  },
  component: {
    template: './templates/component',
    prompts: [
      {
        name: 'name',
        type: 'input',
        message: '组件名称：',
      },
    ],
  },
})
```

### 13.4 自定义生成器

```typescript
// generators/custom.ts
import { defineGenerator } from '@mfsu/generator'

export const customGenerator = defineGenerator({
  name: 'custom',
  
  prompts: [
    {
      name: 'name',
      type: 'input',
      message: '请输入名称：',
    },
  ],
  
  async generate({ name, answers }) {
    // 生成文件
    await this.writeFile(
      `src/${answers.type}/${name}/${name}.ts`,
      this.renderTemplate('template.hbs', answers)
    )
    
    // 修改现有文件
    await this.appendFile(
      'src/index.ts',
      `export * from './${answers.type}/${name}'\n`
    )
    
    console.log(`✅ ${name} 生成成功`)
  },
})
```

---

## 14. 编码规范

### 14.1 ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
}
```

### 14.2 Prettier 配置

```javascript
// .prettierrc.cjs
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  arrowParens: 'always',
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false,
  htmlWhitespaceSensitivity: 'strict',
}
```

### 14.3 EditorConfig

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.json]
indent_size = 2

[Makefile]
indent_style = tab
```

### 14.4 代码风格指南

```typescript
// ✅ 推荐
interface User {
  id: number
  name: string
}

const getUser = async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}

// ❌ 不推荐
interface User{
  id:number;
  name:string;
}

const getUser = async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### 14.5 命名规范

```typescript
// 组件：PascalCase
const UserProfile = defineComponent({})

// 变量/函数：camelCase
const getUserInfo = async () => {}

// 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'

// 类型/接口：PascalCase
interface UserResponse {}
type UserId = number

// 文件：kebab-case（组件）/ camelCase（其他）
// UserProfile.vue
// user-api.ts
// user-service.ts
```

---

## 15. 调试技巧

### 15.1 开发工具

```typescript
// mfsu.config.ts
export default defineConfig({
  dev: {
    // 开启源码映射
    sourcemap: true,
    
    // 开启热更新
    hot: true,
    
    // 开发工具
    devTools: {
      vue: true,      // Vue DevTools
      pinia: true,    // Pinia DevTools
      router: true,   // Router DevTools
    },
    
    // 日志级别
    logLevel: 'debug',  // 'error' | 'warn' | 'info' | 'debug'
  },
})
```

### 15.2 浏览器调试

```typescript
// 条件断点
if (import.meta.env.DEV) {
  // 性能分析
  console.time('render')
  // ... 代码
  console.timeEnd('render')
  
  // 内存分析
  console.memory
  
  // 自定义日志
  console.group('User Module')
  console.log('User:', user)
  console.groupEnd()
}
```

### 15.3 网络请求调试

```typescript
// plugins/debug-axios.ts
import axios from 'axios'

if (import.meta.env.DEV) {
  axios.interceptors.request.use((config) => {
    console.group(`📡 Request: ${config.method?.toUpperCase()} ${config.url}`)
    console.log('URL:', config.url)
    console.log('Params:', config.params)
    console.log('Data:', config.data)
    console.groupEnd()
    return config
  })
  
  axios.interceptors.response.use(
    (response) => {
      console.group(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.groupEnd()
      return response
    },
    (error) => {
      console.group(`❌ Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
      console.log('Status:', error.response?.status)
      console.log('Message:', error.message)
      console.groupEnd()
      return Promise.reject(error)
    }
  )
}
```

### 15.4 性能调试

```typescript
// utils/perf.ts
export class PerformanceMonitor {
  private marks = new Map<string, number>()
  
  mark(name: string) {
    this.marks.set(name, performance.now())
  }
  
  measure(name: string, startMark?: string) {
    const start = startMark ? this.marks.get(startMark) : performance.now()
    const end = performance.now()
    console.log(`⏱️ ${name}: ${(end - start!).toFixed(2)}ms`)
  }
  
  clear() {
    this.marks.clear()
  }
}

// 使用
const perf = new PerformanceMonitor()
perf.mark('before-render')
// ... 渲染代码
perf.measure('render', 'before-render')
```

### 15.5 错误追踪

```typescript
// plugins/error-handler.ts
export function initErrorHandler() {
  // 全局错误处理
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error)
    // 上报错误
    reportError(event.error)
  })
  
  // 未捕获的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Rejection:', event.reason)
    reportError(event.reason)
  })
  
  // Vue 错误处理
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue Error:', err, info)
    reportError(err, { instance, info })
  }
}
```

---

## 16. 测试方案

### 16.1 单元测试

```typescript
// tests/unit/user.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { getUser, createUser } from '@/services/user'

describe('User Service', () => {
  it('should get user by id', async () => {
    const mockUser = { id: 1, name: 'Alice' }
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockUser),
    } as Response)
    
    const user = await getUser(1)
    
    expect(user).toEqual(mockUser)
    expect(fetch).toHaveBeenCalledWith('/api/users/1')
  })
  
  it('should create user', async () => {
    const userData = { name: 'Bob', email: 'bob@example.com' }
    const mockResponse = { id: 2, ...userData }
    
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    } as Response)
    
    const user = await createUser(userData)
    
    expect(user.id).toBe(2)
    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  })
})
```

### 16.2 组件测试

```typescript
// tests/unit/components/Button.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button/Button.vue'

describe('Button', () => {
  it('renders correctly', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
        label: 'Click me',
      },
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('btn-primary')
  })
  
  it('emits click event', async () => {
    const wrapper = mount(Button)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })
  
  it('shows loading state', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
    })
    
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})
```

### 16.3 E2E 测试

```typescript
// tests/e2e/user.spec.ts
import { describe, it, expect } from '@playwright/test'

describe('User Flow', () => {
  it('should login and view dashboard', async ({ page }) => {
    // 访问登录页
    await page.goto('/login')
    
    // 输入用户名密码
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password123')
    
    // 点击登录
    await page.click('[data-testid="login-button"]')
    
    // 验证跳转
    await expect(page).toHaveURL('/dashboard')
    
    // 验证用户信息
    await expect(page.locator('[data-testid="user-name"]'))
      .toContainText('testuser')
  })
})
```

### 16.4 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 16.5 测试脚本

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## 17. 开发自定义插件

### 17.1 插件基础

```typescript
// plugins/my-plugin.ts
import { definePlugin } from '@mfsu/core'

export function myPlugin(options: MyPluginOptions) {
  return definePlugin({
    name: 'my-plugin',
    version: '1.0.0',
    
    // 插件配置
    defaults: {
      enabled: true,
      debug: false,
    },
    
    // 合并配置
    merge: (config, options) => ({
      ...config,
      ...options,
    }),
    
    // 插件安装
    async setup(mfsuApp, config) {
      if (!config.enabled) {
        return
      }
      
      // 注册全局组件
      mfsuApp.component('MyComponent', MyComponent)
      
      // 注册全局指令
      mfsuApp.directive('my-directive', myDirective)
      
      // 注册全局混入
      mfsuApp.mixin(myMixin)
      
      if (config.debug) {
        console.log('MyPlugin initialized')
      }
    },
  })
}
```

### 17.2 插件示例：API 插件

```typescript
// plugins/api-plugin.ts
import axios from 'axios'
import { definePlugin } from '@mfsu/core'

export interface ApiPluginOptions {
  baseURL: string
  timeout?: number
  interceptors?: {
    request?: (config: any) => any
    response?: (response: any) => any
  }
}

export function apiPlugin(options: ApiPluginOptions) {
  return definePlugin({
    name: 'api-plugin',
    
    setup(mfsuApp, config) {
      const api = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout || 10000,
      })
      
      // 请求拦截器
      if (config.interceptors?.request) {
        api.interceptors.request.use(config.interceptors.request)
      }
      
      // 响应拦截器
      if (config.interceptors?.response) {
        api.interceptors.response.use(config.interceptors.response)
      }
      
      // 提供全局 API 实例
      mfsuApp.config.globalProperties.$api = api
      
      // 提供组合式函数
      const useApi = () => ({ api })
      mfsuApp.config.globalProperties.useApi = useApi
    },
  })
}
```

### 17.3 插件示例：状态管理插件

```typescript
// plugins/state-plugin.ts
import { createPinia } from 'pinia'
import { definePlugin } from '@mfsu/core'

export function statePlugin() {
  return definePlugin({
    name: 'state-plugin',
    
    setup(mfsuApp) {
      const pinia = createPinia()
      
      // 安装 Pinia
      mfsuApp.use(pinia)
      
      // 提供组合式函数
      const useStore = (name: string) => {
        return pinia.useStore(name)
      }
      
      mfsuApp.config.globalProperties.useStore = useStore
    },
  })
}
```

### 17.4 插件发布

```json
// package.json
{
  "name": "mfsu-plugin-my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@mfsu/core": "^1.0.0"
  }
}
```

---

## 18. MPA 模式

### 18.1 什么是 MPA

MPA（Multi-Page Application）多页应用模式，适用于需要 SEO 优化、首屏加载速度要求高的场景。

### 18.2 MPA 配置

```typescript
// mfsu.config.ts
export default defineConfig({
  // 启用 MPA 模式
  mode: 'mpa',
  
  pages: [
    {
      // 首页
      path: '/',
      template: 'index.html',
      entry: 'src/pages/index.ts',
      title: '首页',
    },
    {
      // 产品页
      path: '/product',
      template: 'product.html',
      entry: 'src/pages/product.ts',
      title: '产品',
    },
    {
      // 动态路由
      path: '/article/:id',
      template: 'article.html',
      entry: 'src/pages/article.ts',
      title: '文章详情',
    },
  ],
})
```

### 18.3 MPA 页面入口

```typescript
// src/pages/index.ts
import { createApp } from 'vue'
import IndexPage from './IndexPage.vue'

const app = createApp(IndexPage)
app.mount('#app')

// 预加载其他资源
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./other-module')
  })
}
```

### 18.4 MPA 共享代码

```typescript
// src/shared/mpa.ts
// 共享的初始化代码
export function initShared() {
  // 初始化全局状态
  initStore()
  
  // 初始化全局事件
  initEventBus()
  
  // 初始化全局配置
  initConfig()
}

// 每个页面入口都需要调用
// src/pages/index.ts
import { initShared } from '@/shared/mpa'
initShared()
```

### 18.5 MPA 路由

```typescript
// src/pages/article.ts
import { createApp } from 'vue'
import ArticlePage from './ArticlePage.vue'

// 获取 URL 参数
const urlParams = new URLSearchParams(window.location.search)
const articleId = urlParams.get('id') || window.location.pathname.split('/').pop()

const app = createApp(ArticlePage, { id: articleId })
app.mount('#app')
```

### 18.6 MPA 与 SPA 混合

```typescript
// mfsu.config.ts
export default defineConfig({
  // 混合模式
  mode: 'hybrid',
  
  // SPA 路由
  routes: [
    {
      path: '/app',
      component: () => import('@/views/App.vue'),
    },
  ],
  
  // MPA 页面
  pages: [
    {
      path: '/',
      template: 'index.html',
      entry: 'src/pages/index.ts',
    },
  ],
})
```

---

## 19. 进阶实践

### 19.1 微应用通信

```typescript
// 使用自定义事件
const bus = {
  events: new Map(),
  
  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event).add(handler)
  },
  
  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(handler => handler(...args))
  },
}

// 微应用 A
bus.emit('user-login', { id: 1, name: 'Alice' })

// 微应用 B
bus.on('user-login', (user) => {
  console.log('User logged in:', user)
})
```

### 19.2 状态共享

```typescript
// shared/store.ts
import { create } from 'zustand'

interface SharedState {
  user: User | null
  setUser: (user: User | null) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const useSharedStore = create<SharedState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  theme: 'light',
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
  })),
}))
```

### 19.3 性能优化

```typescript
// mfsu.config.ts
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['element-plus'],
        },
      },
    },
    
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // 预加载
    preload: true,
    
    // 预取
    prefetch: true,
  },
})
```

### 19.4 错误边界

```vue
<!-- ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-boundary">
    <h2>出错了</h2>
    <p>{{ error.message }}</p>
    <button @click="retry">重试</button>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
const error = ref<Error | null>(null)

defineExpose({
  setError: (e: Error) => {
    error.value = e
  },
  clearError: () => {
    error.value = null
  },
})

const retry = () => {
  error.value = null
}
</script>
```

### 19.5 服务端渲染准备

```typescript
// ssr/utils.ts
export function prepareForSSR(app) {
  // 标记为 SSR 模式
  app.config.globalProperties.$ssr = true
  
  // 禁用客户端-only 的功能
  app.config.globalProperties.$window = null
  app.config.globalProperties.$document = null
}

// 组件中检查
if (!import.meta.env.SSR) {
  // 客户端-only 代码
  window.addEventListener('scroll', handleScroll)
}
```

---

## 20. 最佳实践

### 20.1 项目组织

```
# 推荐的项目结构
src/
├── apps/           # 微应用
├── shared/         # 共享代码
│   ├── components/ # 共享组件
│   ├── composables/# 共享组合式函数
│   ├── stores/     # 共享状态
│   ├── utils/      # 工具函数
│   └── types/      # 类型定义
├── layouts/        # 布局组件
├── views/          # 页面组件
├── router/         # 路由配置
├── plugins/        # 插件
├── styles/         # 全局样式
└── api/            # API 定义
```

### 20.2 代码分割策略

```typescript
// 按路由分割
const routes = [
  {
    path: '/heavy',
    component: () => import('@/views/Heavy.vue'),
  },
]

// 按功能分割
const userModule = () => import('@/modules/user')
const orderModule = () => import('@/modules/order')

// 共享代码提取
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['vue', 'vue-router'],
          'vendor-ui': ['element-plus'],
          'vendor-utils': ['lodash-es', 'dayjs'],
        },
      },
    },
  },
}
```

### 20.3 错误处理

```typescript
// 统一错误处理
export class AppError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    // 应用错误
    showErrorToast(error.message)
  } else if (error instanceof Error) {
    // 未知错误
    console.error('Unexpected error:', error)
    showErrorToast('系统错误，请稍后重试')
  }
  
  // 上报错误
  reportError(error)
}
```

### 20.4 安全最佳实践

```typescript
// XSS 防护
import { DOMPurify } from 'dompurify'

export function sanitizeHTML(html: string) {
  return DOMPurify.sanitize(html)
}

// CSRF 防护
export function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1]
}

// 敏感信息不暴露
if (import.meta.env.PROD) {
  // 生产环境移除敏感信息
  delete process.env.SECRET_KEY
}
```

### 20.5 性能监控

```typescript
// 性能监控
export function initPerformanceMonitoring() {
  // 监听性能事件
  window.addEventListener('load', () => {
    const perf = performance.getEntriesByType('navigation')[0]
    
    console.log('DNS 查询时间:', perf.domainLookupEnd - perf.domainLookupStart)
    console.log('TCP 连接时间:', perf.connectEnd - perf.connectStart)
    console.log('首字节时间:', perf.responseStart - perf.requestStart)
    console.log('DOM 解析时间:', perf.domComplete - perf.domLoading)
  })
  
  // 监听长任务
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('长任务:', entry.duration, 'ms')
        }
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  }
}
```

---

## 总结

MFSU 是一个功能强大的微前端开发框架，提供了从项目创建到生产部署的完整解决方案。通过本文的学习，你应该掌握了：

1. **基础内容**：开发环境搭建、项目结构、路由系统
2. **核心功能**：插件系统、Mock 数据、代理配置、样式方案
3. **高级特性**：路由数据加载、TypeScript 支持、环境变量
4. **工程化**：脚手架、微生成器、编码规范、调试、测试
5. **进阶实践**：自定义插件、MPA 模式、性能优化

MFSU 的学习是一个持续的过程，建议在实际项目中不断练习，逐步掌握更多高级特性。

### 推荐资源

- [MFSU 官方文档](https://umijs.org/)

---
