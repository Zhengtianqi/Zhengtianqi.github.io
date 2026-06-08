---
title: LeetCode 2. 两数相加（Add Two Numbers）

tag:
  - java基础
  - LeetCode
category: 刷题
date: 2026-05-26
---

# LeetCode 2. 两数相加（Add Two Numbers）

> **难度**：中等 | **标签**：链表、数学

---

## 📌 题目描述

给你两个**非空**的链表，表示两个非负整数。它们每位数字都是按照**逆序**方式存储的，并且每个节点只能存储**一位数字**。

请你将两个数相加，并以相同形式（逆序链表）返回表示和的链表。

你可以假设除了数字 0 之外，这两个数都不会以零开头。

### 示例

```
输入：(2 → 4 → 3) + (5 → 6 → 4)
输出：7 → 0 → 8
解释：342 + 465 = 807
```

---

## 💡 解题思路

### 核心洞察

这道题的本质就是**小学列竖式加法**——从低位到高位逐位相加，处理进位。

链表的逆序存储天然契合这个流程：
- 链表头 = 数字低位
- 遍历方向 = 从低位到高位
- 不需要反转链表，直接从头遍历即可

### 算法步骤

1. 初始化一个 **哑节点（dummy head）** 作为结果链表的哨兵，用 `tail` 指针跟踪当前尾部
2. 初始化 `carry = 0` 表示进位
3. 同时遍历两个链表（只要 `l1` 或 `l2` 不为空就继续）：
   - 取出当前位的值（节点为空则视为 0）
   - 计算 **sum = l1.val + l2.val + carry**
   - 当前位结果 = `sum % 10`
   - 新进位 = `sum / 10`
   - 创建新节点接到 `tail` 后面，`tail` 后移
4. 遍历结束后，如果 `carry > 0`，再接一个进位节点
5. 返回 `dummy.next`（跳过哑节点）

### 为什么需要哑节点？

哑节点统一了头节点的处理逻辑。没有它的话，第一次创建节点需要特殊判断；有了它，每次操作都是统一的「创建节点 → 接到 tail 后面」。

---

## 🧮 图解示例

以 `(2→4→3) + (5→6→4)` 为例：

| 步骤 | l1 位 | l2 位 | 进位 | sum | 结果位 | 新进位 | 结果链表 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | 2 | 5 | 0 | 7 | 7 | 0 | `7 → null` |
| 2 | 4 | 6 | 0 | 10 | 0 | 1 | `7 → 0 → null` |
| 3 | 3 | 4 | 1 | 8 | 8 | 0 | `7 → 0 → 8 → null` |
| 结束 | null | null | 0 | — | — | — | ✅ 无剩余进位 |

最终返回：`7 → 0 → 8`

---

## 🔨 Java 实现

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // 哑节点：简化头节点处理
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        int carry = 0; // 进位

        // 只要还有一个链表没遍历完，就继续
        while (l1 != null || l2 != null) {
            int val1 = (l1 != null) ? l1.val : 0;
            int val2 = (l2 != null) ? l2.val : 0;

            int sum = val1 + val2 + carry;

            // 计算当前位和新的进位
            carry = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;

            // 后移指针
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }

        // 处理最后的进位（如 99 + 1 = 100）
        if (carry > 0) {
            tail.next = new ListNode(carry);
        }

        return dummy.next;
    }
}
```

### 代码要点说明

| 要点 | 说明 |
|:---|:---|
| `dummy` 哑节点 | 统一头节点操作，避免 if-else 特殊处理 |
| `carry = sum / 10` | 整除自动取整，Java 中自动截断小数 |
| `sum % 10` | 取余得到当前位 |
| `val1 = (l1 != null) ? l1.val : 0` | 处理两链长度不等的情况 |
| 循环后检查 `carry` | 关键！如 `5+5=10` 会产生额外一位 |

---

## 🧪 更多示例

### 示例 2：有进位且长度不等

```
输入：(9 → 9 → 9) + (1)
输出：0 → 0 → 0 → 1
解释：999 + 1 = 1000
```

| 步骤 | l1 | l2 | carry | sum | 结果位 | 链表状态 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | 9 | 1 | 0 | 10 | 0 | `0 → null` |
| 2 | 9 | null | 1 | 10 | 0 | `0 → 0 → null` |
| 3 | 9 | null | 1 | 10 | 0 | `0 → 0 → 0 → null` |
| 结束 | — | — | **1** | — | — | 补进位 → `0 → 0 → 0 → 1` |

---

## 📊 复杂度分析

| 维度 | 复杂度 | 说明 |
|:---|:---:|:---|
| 时间 | **O(max(m, n))** | m、n 分别为两条链表长度，只需一次遍历 |
| 空间 | **O(max(m, n))** | 结果链表最长为 max(m, n) + 1（考虑进位） |

> 💡 注意：题目说"无需考虑数值 int/float 的限制"，正是因为我们按位运算，不会发生溢出。这是链表表示法的核心优势。

---

## 🎯 总结

这道题是**链表操作 + 模拟运算**的经典模板题。关键模式：

> **哑节点 + 尾插法 + 进位变量** —— 这套组合拳可以解决几乎所有"大数加减法"类题目。

扩展思路：
- 如果链表是**正序**存储？→ 先反转链表，或用栈辅助
- 如果要做**减法**？→ 类似思路，借位代替进位
- 如果要做**乘法**？→ 嵌套循环 + 多路归并进位

---

## 🚀 扩展题目详解

### 扩展一：两数相加 II（正序链表）

**LeetCode 445. Add Two Numbers II**

如果链表是**正序**存储（高位 → 低位），例如 `7→2→4→3` 表示 7243，直接从头遍历就无法对齐低位了。

#### 解法一：反转链表法

```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // 1. 反转两个链表
        l1 = reverse(l1);
        l2 = reverse(l2);
        
        // 2. 按原题思路相加
        ListNode sum = addReversed(l1, l2);
        
        // 3. 反转结果（恢复正序）
        return reverse(sum);
    }
    
    private ListNode reverse(ListNode head) {
        ListNode prev = null;
        while (head != null) {
            ListNode next = head.next;
            head.next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }
    
    private ListNode addReversed(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        int carry = 0;
        
        while (l1 != null || l2 != null) {
            int val1 = (l1 != null) ? l1.val : 0;
            int val2 = (l2 != null) ? l2.val : 0;
            int sum = val1 + val2 + carry;
            carry = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        
        if (carry > 0) {
            tail.next = new ListNode(carry);
        }
        
        return dummy.next;
    }
}
```

#### 解法二：栈辅助法（不修改原链表）

```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        Stack<Integer> stack1 = new Stack<>();
        Stack<Integer> stack2 = new Stack<>();
        
        // 将链表值压入栈（栈顶 = 低位）
        while (l1 != null) {
            stack1.push(l1.val);
            l1 = l1.next;
        }
        while (l2 != null) {
            stack2.push(l2.val);
            l2 = l2.next;
        }
        
        ListNode dummy = new ListNode(0);
        int carry = 0;
        
        // 从栈顶弹出相加（从低位到高位）
        while (!stack1.isEmpty() || !stack2.isEmpty() || carry > 0) {
            int val1 = stack1.isEmpty() ? 0 : stack1.pop();
            int val2 = stack2.isEmpty() ? 0 : stack2.pop();
            int sum = val1 + val2 + carry;
            carry = sum / 10;
            
            // 头插法构建结果链表
            ListNode node = new ListNode(sum % 10);
            node.next = dummy.next;
            dummy.next = node;
        }
        
        return dummy.next;
    }
}
```

#### 对比

| 方法 | 时间复杂度 | 空间复杂度 | 是否修改原链表 |
|:---|:---:|:---:|:---:|
| 反转链表 | O(max(m,n)) | O(1) | ✅ 是 |
| 栈辅助 | O(max(m,n)) | O(m+n) | ❌ 否 |

---

### 扩展二：两数相减

**问题**：给定两个逆序存储的非负整数链表，返回它们的差（假设被减数 ≥ 减数）。

#### 核心思路

与加法类似，只是将**进位**改为**借位**：
- 加法：`sum = val1 + val2 + carry`，`carry = sum / 10`
- 减法：`diff = val1 - val2 - borrow`，若 `diff < 0` 则 `diff += 10`，`borrow = 1`

#### Java 实现

```java
class Solution {
    public ListNode subtractTwoNumbers(ListNode l1, ListNode l2) {
        // 假设 l1 >= l2
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        int borrow = 0; // 借位
        
        while (l1 != null || l2 != null) {
            int val1 = (l1 != null) ? l1.val : 0;
            int val2 = (l2 != null) ? l2.val : 0;
            
            int diff = val1 - val2 - borrow;
            
            if (diff < 0) {
                diff += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            
            tail.next = new ListNode(diff);
            tail = tail.next;
            
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        
        // 去除前导零（如 100 - 99 = 001 → 1）
        return removeLeadingZeros(dummy.next);
    }
    
    private ListNode removeLeadingZeros(ListNode head) {
        while (head != null && head.val == 0 && head.next != null) {
            head = head.next;
        }
        return head;
    }
}
```

#### 示例

```
输入：(5 → 2 → 4) - (3 → 1)  即 425 - 13
输出：2 → 1 → 4              即 412
```

| 步骤 | l1 | l2 | borrow | diff | 结果位 | 链表       |
|:---:|:--:|:--:|:------:|:----:|:------:|:----------|
| 1   | 5  | 3  | 0      | 2    | 2      | 2 → null  |
| 2   | 2  | 1  | 0      | 1    | 1      | 2 → 1 → null |
| 3   | 4  | 0  | 0      | 4    | 4      | 2 → 1 → 4 → null |
---

### 扩展三：两数相乘

**问题**：给定两个逆序存储的非负整数链表，返回它们的积。

#### 核心思路

乘法比加减法复杂，需要：
1. **嵌套循环**：用 l2 的每一位去乘 l1 的整个数
2. **错位相加**：l2 的第 i 位乘 l1 的结果需要左移 i 位（相当于乘以 10^i）
3. **多路归并**：将所有部分积相加

#### Java 实现

```java
class Solution {
    public ListNode multiplyTwoNumbers(ListNode l1, ListNode l2) {
        // 特殊情况：任一为 0 则结果为 0
        if (isZero(l1) || isZero(l2)) {
            return new ListNode(0);
        }
        
        ListNode result = new ListNode(0); // 初始化为 0
        
        int position = 0; // l2 当前位的权重（10^position）
        
        while (l2 != null) {
            // 计算 l2 当前位 × l1 的结果
            ListNode partial = multiplyByDigit(l1, l2.val);
            
            // 左移 position 位（末尾补 0）
            for (int i = 0; i < position; i++) {
                partial = shiftLeft(partial);
            }
            
            // 累加到结果
            result = addTwoNumbers(result, partial);
            
            l2 = l2.next;
            position++;
        }
        
        return result;
    }
    
    // 链表 × 单个数字
    private ListNode multiplyByDigit(ListNode l, int digit) {
        if (digit == 0) {
            return new ListNode(0);
        }
        
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        int carry = 0;
        
        while (l != null || carry > 0) {
            int val = (l != null) ? l.val : 0;
            int product = val * digit + carry;
            carry = product / 10;
            tail.next = new ListNode(product % 10);
            tail = tail.next;
            if (l != null) l = l.next;
        }
        
        return dummy.next;
    }
    
    // 左移一位（末尾补 0，相当于 ×10）
    private ListNode shiftLeft(ListNode head) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        return dummy;
    }
    
    private boolean isZero(ListNode head) {
        return head != null && head.val == 0 && head.next == null;
    }
}
```

#### 示例

```
输入：(2 → 4 → 3) × (1 → 5)  即 342 × 51
输出：2 → 2 → 0 → 7 → 1      即 17442

计算过程：
       342
     ×  51
     -----
       342    ← 1 × 342
     17100    ← 5 × 342 × 10
     -----
     17442
```

#### 复杂度分析

| 操作 | 时间复杂度 | 空间复杂度 |
|:---|:---:|:---:|
| 加法 | O(max(m,n)) | O(max(m,n)) |
| 减法 | O(max(m,n)) | O(max(m,n)) |
| 乘法 | O(m × n) | O(m + n) |

---
