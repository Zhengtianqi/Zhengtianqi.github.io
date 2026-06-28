---
title: Vue 3 完整指南：Composition API、Pinia 与实战项目
tag: ["Vue 3", "Composition API", "Pinia"]
category: 前端
date: 2026-06-26
---

# Vue 3 完整指南：Composition API、Pinia 与实战项目

> Vue 3 完整指南：Composition API、Pinia 与实战项目是系统间通信的核心，它决定了系统的可扩展性和易用性。
> 本文介绍了Vue 3 完整指南：Composition API、Pinia 与实战项目的设计原则和最佳实践，帮助你构建高质量的接口。

```javascript
// Vue 2: Options API（按类型分组）
export default {
  data() {
    return {
      count: 0,
      message: ''
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    },
    updateMessage(val) {
      this.message = val
    }
  },
  mounted() {
    console.log('Component mounted')
  }
}

问题：
  ├─ 功能分散在data/computed/methods中
  ├─ 同一个逻辑分布在多个选项中
  └─ 大组件难以维护（>500行）

// Vue 3: Composition API（按功能分组）
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    // 所有与count相关的逻辑在一起
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)
    const increment = () => count.value++
    
    // 所有与message相关的逻辑在一起
    const message = ref('')
    const updateMessage = (val) => message.value = val
    
    // 生命周期钩子
    onMounted(() => {
      console.log('Component mounted')
    })
    
    return { count, doubleCount, increment, message, updateMessage }
  }
}

优势：
  ├─ 逻辑内聚（相关代码在一起）
  ├─ 可组合（extract到composable）
  └─ 可维护性高
```

### 1.2 实战对比

```javascript
// 场景：用户搜索框 + 加载状态 + 结果列表

// Vue 2 Options API
export default {
  data() {
    return {
      searchQuery: '',
      results: [],
      isLoading: false,
      error: null,
      page: 1,
      hasMore: true
    }
  },
  computed: {
    filteredResults() {
      return this.results.filter(r => r.name.includes(this.searchQuery))
    },
    displayMessage() {
      if (this.isLoading) return 'Loading...'
      if (this.error) return this.error
      if (this.results.length === 0) return 'No results'
      return `Found ${this.results.length} results`
    }
  },
  methods: {
    async search() {
      this.isLoading = true
      this.error = null
      try {
        const data = await fetch(`/api/search?q=${this.searchQuery}`)
        this.results = data.results
      } catch (e) {
        this.error = e.message
      } finally {
        this.isLoading = false
      }
    },
    async loadMore() {
      this.page++
      // ... 加载更多逻辑
    },
    reset() {
      this.searchQuery = ''
      this.results = []
      this.page = 1
    }
  },
  watch: {
    searchQuery(newVal) {
      if (newVal) this.search()
    }
  }
}

// Vue 3 Composition API + Composable
// composables/useSearch.js
import { ref, computed, watch } from 'vue'

export function useSearch() {
  const searchQuery = ref('')
  const results = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  const search = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/search?q=${searchQuery.value}`)
      results.value = await response.json()
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }
  
  const reset = () => {
    searchQuery.value = ''
    results.value = []
  }
  
  // 监听搜索词变化
  watch(searchQuery, (newVal) => {
    if (newVal) search()
  })
  
  return { searchQuery, results, isLoading, error, search, reset }
}

// 分页逻辑
export function usePagination() {
  const page = ref(1)
  const hasMore = ref(true)
  
  const loadMore = () => page.value++
  
  return { page, hasMore, loadMore }
}

// 组件
<template>
  <div>
    <input v-model="searchQuery" placeholder="Search..." />
    <div v-if="isLoading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <ul v-if="results.length > 0">
      <li v-for="r in results" :key="r.id">{{ r.name }}</li>
    </ul>
    <button v-if="hasMore" @click="loadMore">Load More</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { usePagination } from '@/composables/usePagination'

const { searchQuery, results, isLoading, error } = useSearch()
const { hasMore, loadMore } = usePagination()

const displayMessage = computed(() => {
  if (isLoading.value) return 'Loading...'
  if (error.value) return error.value
  if (results.value.length === 0) return 'No results'
  return `Found ${results.value.length} results`
})
</script>
```

## 二、Pinia状态管理

### 2.1 vs Vuex

```javascript
// Vuex（复杂，样板代码多）
const store = new Vuex.Store({
  state: { count: 0 },
  getters: { doubleCount: s => s.count * 2 },
  mutations: { increment: s => s.count++ },
  actions: { asyncIncrement: async ({ commit }) => { commit('increment') } }
})
store.commit('increment')

// Pinia（简洁，基于Composition API）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCountStore = defineStore('count', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  const increment = () => count.value++
  const asyncIncrement = async () => {
    await new Promise(r => setTimeout(r, 1000))
    increment()
  }
  
  return { count, doubleCount, increment, asyncIncrement }
})

// 使用
const store = useCountStore()
store.increment()
console.log(store.count) // 1
console.log(store.doubleCount) // 2
```

### 2.2 实战案例：用户认证Store

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const token = ref(localStorage.getItem('token'))
  
  // 计算属性
  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const displayName = computed(() => user.value?.name || 'Guest')
  
  // 方法
  const login = async (email, password) => {
    isLoading.value = true
    error.value = null
    try {
      const { user: userData, token: newToken } = await api.login(email, password)
      user.value = userData
      token.value = newToken
      localStorage.setItem('token', newToken)
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  const updateProfile = async (updates) => {
    try {
      const updatedUser = await api.updateProfile(updates)
      user.value = updatedUser
    } catch (e) {
      error.value = e.message
    }
  }
  
  return {
    user,
    isLoading,
    error,
    token,
    isLoggedIn,
    displayName,
    login,
    logout,
    updateProfile
  }
})

// 在组件中使用
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const handleLogin = async () => {
  await userStore.login('alice@example.com', 'password')
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div v-if="userStore.isLoggedIn">
    Welcome, {{ userStore.displayName }}
    <button @click="handleLogout">Logout</button>
  </div>
  <div v-else>
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="handleLogin" :disabled="userStore.isLoading">
      {{ userStore.isLoading ? 'Logging in...' : 'Login' }}
    </button>
  </div>
</template>
```

## 三、响应式系统

### 3.1 ref vs reactive

```javascript
// ref: 包装原始值，通过.value访问
const count = ref(0)
console.log(count.value) // 0
count.value++ // 需要.value

// reactive: 包装对象，直接访问
const user = reactive({ name: 'Alice', age: 30 })
console.log(user.name) // 'Alice'
user.age++ // 直接修改

// 什么时候用？
// ✓ ref: 原始值（string/number/boolean）
// ✓ reactive: 对象和数组

// 但在setup()中，通常推荐用ref
// 因为ref可以解构赋值，reactive不行

// ❌ reactive缺点
const { name, age } = reactive({ name: 'Alice', age: 30 })
name = 'Bob' // 失去响应性！

// ✓ ref的解构
const { count } = useCountStore() // 保持响应性
```

### 3.2 深度监听 vs 浅度监听

```javascript
const user = ref({ name: 'Alice', profile: { age: 30 } })

// 深度监听（默认）- 任何嵌套变化都触发
watch(user, (newVal) => {
  console.log('User changed')
}, { deep: true })

user.value.profile.age = 31 // 触发
user.value = { name: 'Bob', profile: { age: 25 } } // 触发

// 浅度监听 - 仅顶层变化触发
watch(user, () => {
  console.log('User changed')
}, { deep: false })

user.value.profile.age = 31 // 不触发！
user.value = { name: 'Bob', ... } // 触发

// 性能优化：监听单个属性
watch(
  () => user.value.profile.age,
  (newVal) => console.log('Age changed to', newVal)
)

user.value.profile.age = 31 // 触发
```

## 四、性能优化

### 4.1 v-show vs v-if

```javascript
// v-if: 销毁/重建元素（初始化成本高，但显示成本低）
<div v-if="isVisible">Expensive component</div>

// v-show: 仅改变CSS display（初始化成本低，但显示成本高）
<div v-show="isVisible">Expensive component</div>

// 何时用？
// ✓ v-if: 条件不常变化
// ✓ v-show: 频繁切换显示/隐藏
```

### 4.2 计算属性缓存

```javascript
const filteredResults = computed(() => {
  console.log('Computing...')  // 仅当依赖变化时执行
  return results.value.filter(r => r.active)
})

filteredResults.value // "Computing..."
filteredResults.value // 无日志（缓存）
results.value[0].active = false // 依赖变化
filteredResults.value // "Computing..." 重新计算
```

### 4.3 Virtual Scrolling（大列表优化）

```javascript
// 不要这样做：渲染10000行
<ul>
  <li v-for="item in hugeList" :key="item.id">{{ item.name }}</li>
</ul>
// 结果：页面卡死

// 使用virtual-scroll库
import VirtualScroller from 'vue-virtual-scroller'

<virtual-scroller
  :items="hugeList"
  :item-height="50"
  :buffer="5"
  <template #default="{ item }">
    <div>{{ item.name }}</div>
  </template>
</virtual-scroller>

// 原理：只渲染可见区域的元素
// 10000行 → 仅渲染10-15行 → 帧率稳定
```

## 总结

Vue 3学习路线：

1. **基础** → Composition API + setup()
2. **状态管理** → Pinia
3. **最佳实践** → Composables提取逻辑
4. **性能** → 计算属性缓存、virtual scrolling
5. **生态** → VueRouter、Nuxt

**黄金法则**：
- 优先用Composition API（Options API已过时）
- 大组件拆成小composables
- 用Pinia替代Vuex
- 性能敏感场景用computed和v-show
