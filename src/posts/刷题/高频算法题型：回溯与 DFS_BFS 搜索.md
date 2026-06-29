---
title: 高频算法题型：回溯与 DFS_BFS 搜索
tag: ["算法", "回溯", "DFS", "BFS", "LeetCode"]
category: 刷题
date: 2026-06-27
---

# 高频算法题型：回溯与 DFS_BFS 搜索

> 高频算法题型：回溯与 DFS_BFS 搜索是计算机科学的核心，它为问题解决提供了高效的计算方法。
> 本文介绍了高频算法题型：回溯与 DFS_BFS 搜索的设计思路和实现方式，帮助你提升编程能力。

回溯 = DFS + 撤销选择。本质是在决策树上做深度优先搜索：

```
做选择 → 递归 → 撤销选择
```

### 1.2 通用模板

```java
public void backtrack(路径, 选择列表) {
    if (满足结束条件) {
        结果.add(路径的副本);
        return;
    }
    
    for (选择 : 选择列表) {
        // 做选择
        将该选择从选择列表移除;
        路径.add(选择);
        
        backtrack(路径, 选择列表);
        
        // 撤销选择
        路径.remove(路径.size() - 1);
        将该选择恢复到选择列表;
    }
}
```

> **核心三要素：** 路径（已做的选择）、选择列表（当前可做的选择）、结束条件。

## 二、经典回溯题详解

### 第 1 题：全排列（LeetCode 46）

**题目：** 给定不含重复数字的数组，返回所有全排列。

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, 
                       boolean[] used, List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path)); // 注意要拷贝！
        return;
    }
    
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        
        path.add(nums[i]);
        used[i] = true;
        
        backtrack(nums, path, used, result);
        
        path.remove(path.size() - 1); // 撤销
        used[i] = false;
    }
}
```

> **避坑：** `result.add(new ArrayList<>(path))` 必须拷贝！直接 add path 的话，后续撤销操作会改掉已加入的结果。

### 第 2 题：全排列 II（LeetCode 47）

**题目：** 含重复数字的数组，返回不重复的全排列。

```java
public List<List<Integer>> permuteUnique(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums); // 排序是去重的前提
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path,
                       boolean[] used, List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }
    
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        // 去重：当前和前一个相同，且前一个没用过（说明前一个被撤销了）
        if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1]) continue;
        
        path.add(nums[i]);
        used[i] = true;
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

**去重关键：** `!used[i-1]` 表示前一个相同元素在当前层已经被撤销了（不是在路径中），当前元素会生成和前一个相同的排列，跳过。

### 第 3 题：子集（LeetCode 78）

**题目：** 返回数组所有子集。

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path)); // 每个节点都是一个子集
    
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

**关键区别：** 排列用 `used` 数组，子集/组合用 `start` 控制起始位置避免重复。

### 第 4 题：子集 II（LeetCode 90）

**题目：** 含重复数组的子集（不重复）。

```java
public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));
    
    for (int i = start; i < nums.length; i++) {
        // 同层去重
        if (i > start && nums[i] == nums[i - 1]) continue;
        
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

### 第 5 题：组合总和（LeetCode 39）

**题目：** 无限使用候选数字，找出和为 target 的组合。

```java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int target, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (target == 0) {
        result.add(new ArrayList<>(path));
        return;
    }
    if (target < 0) return; // 剪枝
    
    for (int i = start; i < candidates.length; i++) {
        path.add(candidates[i]);
        // 注意：可以重复使用，所以 start 还是 i（不是 i+1）
        backtrack(candidates, target - candidates[i], i, path, result);
        path.remove(path.size() - 1);
    }
}
```

### 第 6 题：组合总和 II（LeetCode 40）

**题目：** 每个数字只能用一次，和为 target 的组合。

```java
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int target, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (target == 0) {
        result.add(new ArrayList<>(path));
        return;
    }
    
    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > target) break; // 剪枝（已排序）
        if (i > start && candidates[i] == candidates[i - 1]) continue; // 去重
        
        path.add(candidates[i]);
        backtrack(candidates, target - candidates[i], i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

### 第 7 题：括号生成（LeetCode 22）

**题目：** 生成 n 对括号的所有合法组合。

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(new StringBuilder(), 0, 0, n, result);
    return result;
}

private void backtrack(StringBuilder path, int open, int close, 
                       int n, List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }
    
    if (open < n) {
        path.append('(');
        backtrack(path, open + 1, close, n, result);
        path.deleteCharAt(path.length() - 1);
    }
    if (close < open) { // 右括号数量不能超过左括号
        path.append(')');
        backtrack(path, open, close + 1, n, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

### 第 8 题：N 皇后（LeetCode 51）

**题目：** 在 n×n 棋盘上放 n 个皇后，互不攻击。

```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    char[][] board = new char[n][n];
    for (char[] row : board) Arrays.fill(row, '.');
    
    backtrack(board, 0, result);
    return result;
}

private void backtrack(char[][] board, int row, List<List<String>> result) {
    if (row == board.length) {
        result.add(constructBoard(board));
        return;
    }
    
    for (int col = 0; col < board.length; col++) {
        if (!isValid(board, row, col)) continue;
        
        board[row][col] = 'Q';
        backtrack(board, row + 1, result);
        board[row][col] = '.'; // 撤销
    }
}

private boolean isValid(char[][] board, int row, int col) {
    // 检查同列
    for (int i = 0; i < row; i++) {
        if (board[i][col] == 'Q') return false;
    }
    // 检查左上对角线
    for (int i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 'Q') return false;
    }
    // 检查右上对角线
    for (int i = row - 1, j = col + 1; i >= 0 && j < board.length; i--, j++) {
        if (board[i][j] == 'Q') return false;
    }
    return true;
}

private List<String> constructBoard(char[][] board) {
    List<String> result = new ArrayList<>();
    for (char[] row : board) {
        result.add(new String(row));
    }
    return result;
}
```

## 三、DFS 深度优先搜索

### 3.1 DFS 模板

```java
public void dfs(Node node, boolean[] visited) {
    if (node == null || visited[node.id]) return;
    
    visited[node.id] = true;
    // 处理当前节点
    
    for (Node neighbor : node.neighbors) {
        dfs(neighbor, visited);
    }
}
```

### 第 9 题：岛屿数量（LeetCode 200）

**题目：** 统计网格中岛屿数量。

```java
public int numIslands(char[][] grid) {
    int count = 0;
    int m = grid.length, n = grid[0].length;
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j); // 把整个岛沉掉
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length 
        || grid[i][j] != '1') return;
    
    grid[i][j] = '0'; // 标记为已访问
    dfs(grid, i - 1, j); // 上
    dfs(grid, i + 1, j); // 下
    dfs(grid, i, j - 1); // 左
    dfs(grid, i, j + 1); // 右
}
```

### 第 10 题：岛屿最大面积（LeetCode 695）

```java
public int maxAreaOfIsland(int[][] grid) {
    int maxArea = 0;
    int m = grid.length, n = grid[0].length;
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                maxArea = Math.max(maxArea, dfs(grid, i, j));
            }
        }
    }
    return maxArea;
}

private int dfs(int[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length 
        || grid[i][j] != 1) return 0;
    
    grid[i][j] = 0; // 标记已访问
    return 1 + dfs(grid, i - 1, j) 
             + dfs(grid, i + 1, j) 
             + dfs(grid, i, j - 1) 
             + dfs(grid, i, j + 1);
}
```

## 四、BFS 广度优先搜索

### 4.1 BFS 模板

```java
public void bfs(Node start) {
    Queue<Node> queue = new LinkedList<>();
    Set<Node> visited = new HashSet<>();
    
    queue.offer(start);
    visited.add(start);
    
    while (!queue.isEmpty()) {
        Node node = queue.poll();
        // 处理当前节点
        
        for (Node neighbor : node.neighbors) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
}
```

### 4.2 BFS 的优势

- **最短路径**：无权图中 BFS 第一次到达就是最短路径
- **层序遍历**：天然按层处理
- **避免栈溢出**：迭代实现不依赖调用栈

### 第 11 题：腐烂的橘子（LeetCode 994）

**题目：** 每分钟烂橘子会让相邻好橘子变烂，求所有橘子变烂的最少时间。

```java
public int orangesRotting(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    int fresh = 0;
    
    // 找到所有烂橘子，加入队列
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 2) queue.offer(new int[]{i, j});
            else if (grid[i][j] == 1) fresh++;
        }
    }
    
    if (fresh == 0) return 0;
    
    int[][] dirs = {{-1,0}, {1,0}, {0,-1}, {0,1}};
    int minutes = 0;
    
    while (!queue.isEmpty() && fresh > 0) {
        int size = queue.size();
        minutes++;
        
        for (int k = 0; k < size; k++) {
            int[] curr = queue.poll();
            for (int[] d : dirs) {
                int ni = curr[0] + d[0], nj = curr[1] + d[1];
                if (ni >= 0 && ni < m && nj >= 0 && nj < n 
                    && grid[ni][nj] == 1) {
                    grid[ni][nj] = 2;
                    fresh--;
                    queue.offer(new int[]{ni, nj});
                }
            }
        }
    }
    return fresh == 0 ? minutes : -1;
}
```

### 第 12 题：单词搜索（LeetCode 79）

**题目：** 在网格中搜索单词（DFS + 回溯）。

```java
public boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (dfs(board, word, i, j, 0)) return true;
        }
    }
    return false;
}

private boolean dfs(char[][] board, String word, int i, int j, int idx) {
    if (idx == word.length()) return true;
    
    if (i < 0 || i >= board.length || j < 0 || j >= board[0].length 
        || board[i][j] != word.charAt(idx)) return false;
    
    char temp = board[i][j];
    board[i][j] = '#'; // 标记已访问
    
    boolean found = dfs(board, word, i - 1, j, idx + 1)
                 || dfs(board, word, i + 1, j, idx + 1)
                 || dfs(board, word, i, j - 1, idx + 1)
                 || dfs(board, word, i, j + 1, idx + 1);
    
    board[i][j] = temp; // 回溯
    return found;
}
```

## 五、回溯去重技巧总结

### 5.1 排列去重 vs 子集去重

| 类型 | 去重条件 | 说明 |
|------|----------|------|
| 排列 | `i > 0 && nums[i] == nums[i-1] && !used[i-1]` | 同层相同元素，前一个被撤销时跳过 |
| 子集/组合 | `i > start && nums[i] == nums[i-1]` | 同层相同元素直接跳过 |

### 5.2 什么时候排序？

- **需要去重** → 一定要排序（让相同元素相邻）
- **需要剪枝** → 排序后可以提前终止

## 六、剪枝技巧

```java
// 组合问题剪枝
for (int i = start; i < candidates.length; i++) {
    if (candidates[i] > target) break; // 排序后可以安全剪枝
    // ...
}

// N皇后剪枝
if (!isValid(board, row, col)) continue; // 不合法直接跳过
```

**剪枝原则：** 越早剪枝，效率越高。在进入递归之前就排除不可能的分支。

## 七、DFS vs BFS 选择指南

| 场景 | 选择 | 原因 |
|------|------|------|
| 找所有方案 | DFS | 回溯天然适合枚举 |
| 找最短路径 | BFS | 层序遍历第一次到达就是最短 |
| 连通性问题 | 两者均可 | DFS 代码更简洁 |
| 层级相关 | BFS | 天然按层处理 |
| 树的最大深度 | DFS | 递归自然返回深度 |
| 拓扑排序 | BFS | Kahn 算法 |

## 八、面试要点与总结

### 高频面试题

**Q1：回溯和 DFS 的关系？**
> 答：回溯是 DFS 的一种应用。DFS 是遍历图/树的通用方法，回溯特指在搜索过程中"做选择-递归-撤销选择"的模式。所有回溯都是 DFS，但不是所有 DFS 都是回溯。

**Q2：回溯为什么要撤销选择？**
> 答：因为路径是共享的（同一个 List/StringBuilder）。递归返回后如果不撤销，上一次的选择会影响同层其他分支的搜索结果。撤销选择保证了每条搜索路径是独立的。

**Q3：排列和组合的回溯有什么区别？**
> 答：(1) 排列用 `used` 数组标记已选元素，组合用 `start` 控制起始位置；(2) 排列考虑顺序 [1,2] ≠ [2,1]，组合不考虑 [1,2] = [2,1]；(3) 组合通过 `start` 避免生成重复组合。

**Q4：BFS 怎么记录路径？**
> 答：两种方式：(1) 用 `parent` Map 记录每个节点的父节点，终点回溯到起点得到路径；(2) 在队列中直接存路径 `Queue<List<Integer>>`，每个队列元素是一条完整路径。

**Q5：回溯的时间复杂度怎么算？**
> 答：排列问题 O(n × n!)，子集问题 O(n × 2ⁿ)，组合问题 O(n × C(n,k))。通用公式：`递归树节点数 × 每个节点的操作数`。

### 总结

回溯和搜索类题目的通用解题思路：

```
1. 画决策树：把问题抽象成一棵树
2. 确定三要素：路径、选择列表、结束条件
3. 套模板：做选择 → 递归 → 撤销选择
4. 优化：排序 + 剪枝 + 去重
```

**回溯模板核心代码：**
```java
for (选择 : 选择列表) {
    做选择;
    backtrack(...);
    撤销选择;
}
```

**记住这四个字：选、递、撤、判。** 选——做选择；递——递归调用；撤——撤销选择；判——判断结束条件。

> **一句话总结：** 回溯题万变不离其宗——画决策树、套模板、加剪枝。排列用 used，组合用 start，去重先排序，BFS 找最短。
