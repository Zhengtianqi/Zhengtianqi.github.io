---
title: LeetCode 1. 两数之和（Two Sum）
author: zheng
tag:
  - java基础
  - LeetCode
category:
  - 刷题
date: 2026-05-26 09:45:00
---

# LeetCode 1. 两数之和（Two Sum）

> **难度**：简单 | **标签**：数组、哈希表

---

## 📌 题目描述

给定一个整数数组 `nums` 和一个目标值 `target`，请你在该数组中找出和为目标值的那两个整数，并返回它们的**数组下标**。

你可以假设每种输入只会对应一个答案，并且你不能使用同一个元素两次。

### 示例

```
输入：nums = [2, 7, 11, 15], target = 9
输出：[0, 1]
解释：因为 nums[0] + nums[1] = 2 + 7 = 9，所以返回 [0, 1]
```

---

## 💡 解题思路

### 暴力法（Brute Force）

最直观的思路：两层循环，枚举所有两数组合，检查和是否等于 `target`。

- 外层遍历每个元素 `nums[i]`
- 内层遍历其后的元素 `nums[j]`
- 若 `nums[i] + nums[j] == target`，返回 `[i, j]`

**时间复杂度**：O(n²)  
**空间复杂度**：O(1)

> ❌ 数据量大时性能堪忧，不推荐作为最终解法。

---

### 哈希表法（HashMap）—— ✅ 最优解

核心思想：**一遍扫描 + 哈希表记录已访问的数及其下标**。

对于当前数字 `num`，我们需要找的是 `target - num`。如果这个"补数"之前已经出现过（存在于哈希表中），直接返回结果；否则把当前数存入哈希表继续往后走。

#### 算法步骤：

1. 创建一个 `Map<Integer, Integer>`，用于存储「数值 → 下标」的映射
2. 遍历数组 `nums`：
   - 计算补数 `complement = target - nums[i]`
   - 如果 `map.containsKey(complement)` → 找到了！返回 `[map.get(complement), i]`
   - 否则将当前数存入 map：`map.put(nums[i], i)`
3. （题目保证必有解，无需处理找不到的情况）

#### 为什么可行？

- 哈希表的 `containsKey` 是 O(1)，整体只需一次遍历
- "先查后存"保证了不会重复使用同一个元素
- 天然满足「恰好一个解」的约束

**时间复杂度**：O(n)  
**空间复杂度**：O(n)

---

## 🧮 图解示例

以 `nums = [2, 7, 11, 15], target = 9` 为例：

| 步骤 | 当前数 | 补数 (target - num) | Map 状态 | 操作 |
|:---:|:---:|:---:|:---|:---|
| 1 | 2 | 7 | `{}` | 7 不在 map 中，存入 `{2→0}` |
| 2 | 7 | **2** ✅ | `{2→0}` | 2 在 map 中！返回 `[0, 1]` |

只用了 **2 步**就找到答案，不需要遍历完整个数组。

---

## 🔨 Java 实现

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // 存储数值到索引的映射
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];

            // 先查找：补数是否已经出现过？
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }

            // 再存入：当前数加入哈希表 key：值，value：位置
            map.put(nums[i], i);
        }

        // 题目保证必有解，此处不会执行
        throw new IllegalArgumentException("No solution");
    }
}
```

### 代码要点说明

| 要点 | 说明 |
|:---|:---|
| `new HashMap<>()` | O(1) 查找的关键，用空间换时间 |
| **先查后存** | 避免同一元素被使用两次（如 `target=4, nums=[2,...]`） |
| `throw IllegalArgumentException` | 兜底异常，实际 LeetCode 可省略 |

---

## 📊 复杂度对比

| 方法 | 时间复杂度 | 空间复杂度 | 推荐度 |
|:---|:---:|:---:|:---:|
| 暴力枚举 | O(n²) | O(1) | ⭐ |
| **哈希表** | **O(n)** | **O(n)** | **⭐⭐⭐⭐⭐** |

---

## 🎯 总结

这道题是哈希表应用的经典入门题。关键洞察在于：

> **把"找两个数"转化为"找一个数的补数"，利用哈希表将查找从 O(n) 降到 O(1)。**

掌握这个模式后，类似的「两数之和」变种（如有序数组可用双指针、返回具体值而非下标等）都能举一反三。
