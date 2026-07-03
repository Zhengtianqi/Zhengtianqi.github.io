---
title: ConcurrentHashMap 源码解析：JDK 8 的并发安全策略
tag: ["Java", "并发编程", "ConcurrentHashMap", "源码解析"]
category: 基础知识
date: 2026-07-03
---

# ConcurrentHashMap 源码解析：JDK 8 的并发安全策略

> ConcurrentHashMap 是 Java 并发编程中使用频率最高的并发容器之一。从 JDK 7 的分段锁到 JDK 8 的 CAS + synchronized，其实现经历了重大演进。本文将深入剖析 JDK 8 中 ConcurrentHashMap 的核心实现，包括 put、get、扩容、size 等关键流程的源码级分析。

## 一、JDK 7 vs JDK 8 架构对比

### 1.1 JDK 7：分段锁（Segment）

```
┌─────────────────────────────────────────────────────────┐
│              JDK 7 ConcurrentHashMap 架构                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐       ┌──────────┐         │
│  │ Segment0 │  │ Segment1 │  ...  │ Segment15│         │
│  │ (锁)     │  │ (锁)     │       │ (锁)     │         │
│  └────┬─────┘  └────┬─────┘       └────┬─────┘         │
│       │              │                  │               │
│       ▼              ▼                  ▼               │
│  ┌─────────┐    ┌─────────┐       ┌─────────┐          │
│  │Entry[]  │    │Entry[]  │       │Entry[]  │          │
│  │ table   │    │ table   │       │ table   │          │
│  └─────────┘    └─────────┘       └─────────┘          │
│                                                         │
│  默认16个Segment，每个Segment独立加锁                      │
│  并发度 = Segment数量（默认16）                           │
│  锁粒度：Segment级别                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 JDK 8：CAS + synchronized

```
┌─────────────────────────────────────────────────────────┐
│              JDK 8 ConcurrentHashMap 架构                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────┐        │
│  │           Node[] table (哈希桶数组)          │        │
│  │                                             │        │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┐    │        │
│  │  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │...│    │        │
│  │  └─┬─┴───┴─┬─┴───┴─┬─┴───┴───┴─┬─┴───┘    │        │
│  │    │       │       │           │           │        │
│  │    ▼       ▼       ▼           ▼           │        │
│  │  Node    Node    TreeBin     null         │        │
│  │   │       │       (红黑树)                  │        │
│  │   ▼       ▼                                 │        │
│  │  Node    Node                              │        │
│  │   │                                        │        │
│  │   ▼                                        │        │
│  │  null                                      │        │
│  │                                            │        │
│  │  锁粒度：桶级别（单个Node头节点）             │        │
│  │  并发度 = 桶数量（默认16，扩容后翻倍）        │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.3 核心对比

```
┌──────────────┬────────────────────┬────────────────────┐
│     特性      │     JDK 7          │     JDK 8          │
├──────────────┼────────────────────┼────────────────────┤
│  锁实现       │  ReentrantLock     │  CAS + synchronized│
│   (Segment)   │  (Segment继承)     │  (桶头节点)         │
├──────────────┼────────────────────┼────────────────────┤
│  锁粒度       │  Segment级别       │  桶级别（更细）     │
├──────────────┼────────────────────┼────────────────────┤
│  默认并发度    │  16 (Segment数)    │  16 (桶数)         │
├──────────────┼────────────────────┼────────────────────┤
│  数据结构     │  Entry[] + 链表    │  Node[] + 链表/    │
│              │                    │  红黑树             │
├──────────────┼────────────────────┼────────────────────┤
│  查询复杂度   │  O(n) 链表         │  O(log n) 红黑树   │
│  (最坏)      │                    │  (桶内节点>8)       │
├──────────────┼────────────────────┼────────────────────┤
│  并发扩容     │  单Segment重hash   │  多线程协助迁移     │
├──────────────┼────────────────────┼────────────────────┤
│  写操作       │  全程加锁          │  空桶CAS+非空synchronized│
└──────────────┴────────────────────┴────────────────────┘
```

## 二、核心字段与数据结构

### 2.1 核心字段

```java
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V>
    implements ConcurrentMap<K,V>, Serializable {

    // 哈希桶数组，延迟初始化（第一次put时创建）
    transient volatile Node<K,V>[] table;

    // 扩容时的下一个表
    private transient volatile Node<K,V>[] nextTable;

    // 基础计数（无竞争时使用）
    private transient volatile long baseCount;

    // 控制table初始化/扩容的标志
    // -1: 正在初始化
    // -(1 + 活跃线程数): 正在扩容
    // 0: 默认，未初始化
    // >0: 阈值（容量 × 负载因子）
    private transient volatile int sizeCtl;

    // 扩容时下一个要迁移的桶索引（转移下界）
    private transient volatile int transferIndex;

    // 默认初始容量 16
    private static final int DEFAULT_CAPACITY = 16;

    // 默认负载因子 0.75
    private static final float LOAD_FACTOR = 0.75f;

    // 链表转红黑树阈值：桶内节点数 > 8
    static final int TREEIFY_THRESHOLD = 8;

    // 红黑树退化为链表阈值：桶内节点数 <= 6
    static final int UNTREEIFY_THRESHOLD = 6;

    // 转红黑树的最小table容量（必须>64才允许转树）
    static final int MIN_TREEIFY_CAPACITY = 64;
}
```

### 2.2 Node 结构

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;        // key的hash值（不可变）
    final K key;           // key（不可变）
    volatile V val;        // value（volatile，保证可见性）
    volatile Node<K,V> next;  // 下一个节点（volatile）

    Node(int hash, K key, V val, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.val = val;
        this.next = next;
    }
}
```

### 2.3 特殊节点类型

```java
// ForwardingNode：扩容期间的占位节点
// hash值为MOVED(-1)，表示该桶已迁移完成
static final class ForwardingNode<K,V> extends Node<K,V> {
    final Node<K,V>[] nextTable;  // 指向新表
    ForwardingNode(Node<K,V>[] tab) {
        super(MOVED, null, null, null);
        this.nextTable = tab;
    }
}

// TreeBin：红黑树的代理节点
// hash值为TREEBIN(-2)，放在桶的第一个位置
// 它不存储数据，而是代理对红黑树的读写操作
static final class TreeBin<K,V> extends Node<K,V> {
    TreeNode<K,V> root;      // 红黑树根节点
    volatile TreeNode<K,V> first;  // 链表头（用于退化）
    volatile Thread waiter;  // 等待的线程
    volatile int lockState;  // 锁状态（读锁/写锁）
    // ...
}

// ReservationNode：computeIfAbsent中使用的保留节点
// hash值为RESERVED(-3)
```

## 三、put 流程深度解析

### 3.1 put 方法入口

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {
    // ConcurrentHashMap 不允许 null key 或 null value
    if (key == null || value == null) throw new NullPointerException();

    // ① 计算hash（spread，防止高位冲突）
    int hash = spread(key.hashCode());
    int binCount = 0;  // 当前桶的节点计数

    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;

        // ② table为空 → 初始化
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();

        // ③ 目标桶为空 → CAS插入（无锁操作）
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            if (casTabAt(tab, i, null,
                         new Node<K,V>(hash, key, value, null)))
                break;  // CAS成功，插入完成
            // CAS失败：竞争，继续自旋
        }

        // ④ 当前桶是ForwardingNode → 协助扩容
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);

        // ⑤ 桶非空 → synchronized加锁插入
        else {
            V oldVal = null;
            synchronized (f) {  // 锁住桶的头节点
                // 双重检查：确保f仍然是头节点
                if (tabAt(tab, i) == f) {
                    // 5a. 链表节点
                    if (fh >= 0) {
                        binCount = 1;
                        for (Node<K,V> e = f;; ++binCount) {
                            K ek;
                            // key相同 → 覆盖value
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K,V> pred = e;
                            // 到达链表尾部 → 追加新节点
                            if ((e = e.next) == null) {
                                pred.next = new Node<K,V>(hash, key,
                                                          value, null);
                                break;
                            }
                        }
                    }
                    // 5b. 红黑树节点
                    else if (f instanceof TreeBin) {
                        Node<K,V> p;
                        binCount = 2;
                        if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                              value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            // 5c. 检查是否需要树化
            if (binCount != 0) {
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);  // 链表转红黑树
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    // ⑥ 增加计数，检查扩容
    addCount(1L, binCount);
    return null;
}
```

### 3.2 put 流程图

```
┌──────────────────────────────────────────────────────────┐
│                   ConcurrentHashMap.put()                │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  key/value null检查  │──null──► NullPointerException
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  hash = spread(key) │
              │  (高低16位异或)      │
              └──────────┬──────────┘
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
  ┌──────────────┐              ┌──────────────┐
  │ table为空?   │──是──────────►│ initTable()  │
  └──────┬───────┘              │ 初始化table  │
         │ 否                    └──────┬───────┘
         ▼                               │
  ┌──────────────┐                       │
  │ 桶为空?      │                       │
  │ tabAt(tab,i) │                       │
  └──────┬───────┘                       │
         │                               │
    ┌────┴────┐                          │
   是│         │否                        │
    ▼         ▼                          │
  ┌──────┐  ┌──────────┐                 │
  │ CAS  │  │ Forwarding│                 │
  │插入  │  │ Node?    │                 │
  └──┬───┘  └────┬─────┘                 │
     │      ┌────┴────┐                  │
     │     是│         │否                │
     │      ▼         ▼                  │
     │  ┌────────┐ ┌────────────┐        │
     │  │ help   │ │synchronized│        │
     │  │Transfer│ │ 锁住头节点  │        │
     │  │ 协助扩容│ │            │        │
     │  └────────┘ │ 链表? 遍历  │        │
     │             │  追加/覆盖  │        │
     │             │            │        │
     │             │ TreeBin?   │        │
     │             │  putTreeVal│        │
     │             └─────┬──────┘        │
     │                   │               │
     │                   ▼               │
     │          ┌──────────────┐         │
     │          │ binCount>=8? │         │
     │          │ treeifyBin   │         │
     │          └──────┬───────┘         │
     │                 │                 │
     ▼                 ▼                 ▼
  ┌──────────────────────────────────────────┐
  │         addCount(1, binCount)            │
  │         增加计数，检查扩容                 │
  └──────────────────────────────────────────┘
```

### 3.3 spread：hash 扰动

```java
// hash扰动：(h ^ (h >>> 16)) & HASH_BITS
static final int spread(int h) {
    // 高16位与低16位异或，增加散列性
    // & 0x7fffffff 保证结果为正数（最高位为0）
    // 正数是因为负hash有特殊含义：-1=MOVED, -2=TREEBIN, -3=RESERVED
    return (h ^ (h >>> 16)) & HASH_BITS;
}
```

### 3.4 initTable：线程安全的初始化

```java
private final Node<K,V>[] initTable() {
    Node<K,V>[] tab; int sc;
    while ((tab = table) == null || tab.length == 0) {
        // sizeCtl < 0 表示正在初始化或扩容
        if ((sc = sizeCtl) < 0)
            Thread.yield();  // 让出CPU，等待初始化完成
        else if (U.compareAndSwapInt(this, SIZECTL, sc, -1)) {
            // CAS将sizeCtl改为-1，表示正在初始化
            try {
                if ((tab = table) == null || tab.length == 0) {
                    int n = (sc > 0) ? sc : DEFAULT_CAPACITY;
                    @SuppressWarnings("unchecked")
                    Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n];
                    table = tab = nt;
                    sc = n - (n >>> 2);  // 阈值 = 0.75n
                }
            } finally {
                sizeCtl = sc;  // 设置阈值
            }
            break;
        }
    }
    return tab;
}
```

### 3.5 tabAt / casTabAt：volatile 语义的内存操作

```java
// 这些方法使用Unsafe提供volatile语义的原子操作

// 获取桶i的节点（volatile读）
static final <K,V> Node<K,V> tabAt(Node<K,V>[] tab, int i) {
    return (Node<K,V>)U.getReferenceAcquire(tab, ((long)i << ASHIFT) + ABASE);
}

// CAS设置桶i的节点
static final <K,V> boolean casTabAt(Node<K,V>[] tab, int i,
                                     Node<K,V> c, Node<K,V> v) {
    return U.compareAndSetReference(tab, ((long)i << ASHIFT) + ABASE, c, v);
}

// volatile设置桶i的节点
static final <K,V> void setTabAt(Node<K,V>[] tab, int i, Node<K,V> v) {
    U.putReferenceRelease(tab, ((long)i << ASHIFT) + ABASE, v);
}
```

## 四、扩容机制：多线程协助迁移

### 4.1 扩容触发条件

```java
// 在addCount中检查扩容
private final void addCount(long x, int check) {
    // ...计数逻辑...

    if (check >= 0) {
        Node<K,V>[] tab, nt; int n, sc;
        // 如果元素总数超过阈值，触发扩容
        while (s >= (long)(sc = sizeCtl) && (tab = table) != null &&
               (n = tab.length) < MAXIMUM_CAPACITY) {
            // 计算扩容标记
            int rs = resizeStamp(n);
            if (sc < 0) {
                // 正在扩容，检查是否可以协助
                if ((sc >>> RESIZE_STAMP_SHIFT) != rs || sc == rs + 1 ||
                    sc == rs + MAX_RESIZERS || (nt = nextTable) == null ||
                    transferIndex <= 0)
                    break;  // 不需要协助
                if (U.compareAndSwapInt(this, SIZECTL, sc, sc + 1))
                    transfer(tab, nt);  // 协助扩容
            }
            else if (U.compareAndSwapInt(this, SIZECTL, sc,
                                         (rs << RESIZE_STAMP_SHIFT) + 2))
                transfer(tab, null);  // 发起扩容
        }
    }
}
```

### 4.2 transfer：多线程迁移核心

```java
private final void transfer(Node<K,V>[] tab, Node<K,V>[] nextTab) {
    int n = tab.length, stride;

    // 计算每个线程负责迁移的桶数量
    // 最小16，保证不会太小导致频繁争抢
    if ((stride = (NCPU > 1) ? (n >>> 3) / NCPU : n) < MIN_TRANSFER_STRIDE)
        stride = MIN_TRANSFER_STRIDE;

    if (nextTab == null) {
        // 发起者创建新表（容量翻倍）
        try {
            @SuppressWarnings("unchecked")
            Node<K,V>[] nt = (Node<K,V>[])new Node<?,?>[n << 1];
            nextTab = nt;
        } catch (Throwable ex) {
            sizeCtl = Integer.MAX_VALUE;
            return;
        }
        nextTable = nextTab;
        transferIndex = n;  // 从旧表末尾开始迁移
    }

    int nextn = nextTab.length;
    ForwardingNode<K,V> fwd = new ForwardingNode<K,V>(nextTab);

    boolean advance = true;
    boolean finishing = false;

    for (int i = 0, bound = 0;;) {
        Node<K,V> f; int fh;

        // ① 领取任务（分配迁移区间）
        while (advance) {
            int nextIndex, nextBound;
            if (--i >= bound || finishing)
                advance = false;
            else if ((nextIndex = transferIndex) <= 0) {
                i = -1;  // 所有桶已分配完
                advance = false;
            }
            else if (U.compareAndSwapInt
                     (this, TRANSFERINDEX, nextIndex,
                      nextBound = (nextIndex > stride ?
                                   nextIndex - stride : 0))) {
                bound = nextBound;
                i = nextIndex - 1;
                advance = false;
            }
        }

        // ② 迁移完成检查
        if (i < 0 || i >= n || i + n >= nextn) {
            if (finishing) {
                nextTable = null;
                table = nextTab;  // 切换到新表
                sizeCtl = (n << 1) - (n >>> 1);  // 新阈值 = 0.75 * 2n
                return;
            }
            // CAS减少扩容线程数
            if (U.compareAndSwapInt(this, SIZECTL, sc = sizeCtl, sc - 1)) {
                if ((sc - 2) != resizeStamp(n) << RESIZE_STAMP_SHIFT)
                    return;  // 还有其他线程在迁移
                finishing = advance = true;
                i = n;  // 重新检查一遍
            }
        }

        // ③ 桶为空 → 放置ForwardingNode
        else if ((f = tabAt(tab, i)) == null)
            advance = casTabAt(tab, i, null, fwd);

        // ④ 已迁移（ForwardingNode）→ 跳过
        else if ((fh = f.hash) == MOVED)
            advance = true;

        // ⑤ 迁移桶内数据
        else {
            synchronized (f) {  // 锁住头节点
                if (tabAt(tab, i) == f) {
                    Node<K,V> ln, hn;
                    if (fh >= 0) {
                        // 5a. 链表迁移
                        // 将链表拆成两条：低位链(原位置)和高位链(原位置+n)
                        int runBit = fh & n;
                        Node<K,V> lastRun = f;
                        // 找到最后一段连续相同bit的节点
                        for (Node<K,V> p = f.next; p != null; p = p.next) {
                            int b = p.hash & n;
                            if (b != runBit) {
                                runBit = b;
                                lastRun = p;
                            }
                        }
                        if (runBit == 0) {
                            ln = lastRun;
                            hn = null;
                        } else {
                            hn = lastRun;
                            ln = null;
                        }
                        // 遍历构建两条链
                        for (Node<K,V> p = f; p != lastRun.next; p = p.next) {
                            int ph = p.hash & n;
                            if (ph == 0)
                                ln = new Node<K,V>(p.hash, p.key, p.val, ln);
                            else
                                hn = new Node<K,V>(p.hash, p.key, p.val, hn);
                        }
                        // 低位链放原位置i
                        setTabAt(nextTab, i, ln);
                        // 高位链放位置i+n
                        setTabAt(nextTab, i + n, hn);
                        // 旧表标记为已迁移
                        setTabAt(tab, i, fwd);
                        advance = true;
                    }
                    else if (f instanceof TreeBin) {
                        // 5b. 红黑树迁移
                        TreeBin<K,V> t = (TreeBin<K,V>)f;
                        TreeNode<K,V> lo = null, loTail = null;
                        TreeNode<K,V> hi = null, hiTail = null;
                        int lc = 0, hc = 0;
                        for (Node<K,V> e = t.first; e != null; e = e.next) {
                            int h = e.hash;
                            TreeNode<K,V> p = new TreeNode<K,V>
                                (h, e.key, e.val, null, null);
                            if ((h & n) == 0) {
                                if ((p.prev = loTail) == null)
                                    lo = p;
                                else
                                    loTail.next = p;
                                loTail = p;
                                ++lc;
                            } else {
                                if ((p.prev = hiTail) == null)
                                    hi = p;
                                else
                                    hiTail.next = p;
                                hiTail = p;
                                ++hc;
                            }
                        }
                        // 迁移后如果节点数<=6，退化为链表
                        ln = (lc <= UNTREEIFY_THRESHOLD) ? untreeify(lo) :
                            (hc != 0) ? new TreeBin<K,V>(lo) : t;
                        hn = (hc <= UNTREEIFY_THRESHOLD) ? untreeify(hi) :
                            (lc != 0) ? new TreeBin<K,V>(hi) : t;
                        setTabAt(nextTab, i, ln);
                        setTabAt(nextTab, i + n, hn);
                        setTabAt(tab, i, fwd);
                        advance = true;
                    }
                }
            }
        }
    }
}
```

### 4.3 扩容迁移图解

```
扩容前：table.length = 4 (n=4)
桶索引 = (hash & 0x3)  → 只用hash最低2位

扩容后：table.length = 8 (n=8)
桶索引 = (hash & 0x7)  → 用hash最低3位

迁移策略：
- hash的第3位(bit 2)为0 → 留在原位置
- hash的第3位(bit 2)为1 → 迁移到 原位置 + 4

示例：桶0的链表迁移
┌──────────────────────────────────────────────────┐
│  旧表 桶0                                         │
│  Node(hash=0b100) → Node(hash=0b000) → Node(hash=0b100) │
│                                                  │
│  hash & n (n=4):                                 │
│  0b100 & 100 = 4 ≠ 0 → 高位链                    │
│  0b000 & 100 = 0    → 低位链                     │
│  0b100 & 100 = 4 ≠ 0 → 高位链                    │
│                                                  │
│  拆分结果：                                       │
│  低位链(桶0):  Node(hash=0b000)                  │
│  高位链(桶4):  Node(hash=0b100) → Node(hash=0b100)│
│                                                  │
│  新表:                                           │
│  桶0: 低位链                                     │
│  桶4: 高位链 (= 原位置 + n)                      │
└──────────────────────────────────────────────────┘
```

### 4.4 多线程协助扩容图解

```
扩容时多线程协作：
═══════════════════════════════════════════

旧表(长度16): [0][1][2][3][4][5][6][7][8][9][A][B][C][D][E][F]
                                                        ↑
                                                  transferIndex=16

线程1领取 [12,15]  →  迁移桶15,14,13,12
线程2领取 [8,11]   →  迁移桶11,10,9,8
线程3领取 [4,7]    →  迁移桶7,6,5,4
线程4领取 [0,3]    →  迁移桶3,2,1,0

每个线程领取一个stride(默认16)大小的区间
从右向左迁移
迁移完一个桶就放置ForwardingNode标记

put线程遇到ForwardingNode → helpTransfer() 协助迁移

┌─────────────────────────────────────────────────┐
│  旧表桶状态:                                     │
│  [F][F][F][F][F][F][F][F][→][→][→][→][迁移中][ ][ ][ ]│
│   已迁移                        线程2正在迁移   线程1正在迁移│
│  F = ForwardingNode                              │
└─────────────────────────────────────────────────┘
```

## 五、get 流程：无锁读取

### 5.1 get 方法源码

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    int h = spread(key.hashCode());  // ① 计算hash

    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {  // ② 定位桶

        if ((eh = e.hash) == h) {  // ③ 头节点匹配
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                return e.val;
        }
        else if (e instanceof ForwardingNode)
            // ④ 正在扩容 → 到新表查找
            return (p = ((ForwardingNode<K,V>)e).find(h, key)) != null ?
                p.val : null;
        else if (eh < 0)
            // ⑤ TreeBin或ReservationNode → 调用find
            return (p = e.find(h, key)) != null ? p.val : null;

        // ⑥ 遍历链表
        while ((e = e.next) != null) {
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

### 5.2 get 为什么不加锁？

```
┌──────────────────────────────────────────────────────────┐
│              get 不加锁的保证机制                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Node.val 和 Node.next 是 volatile                    │
│     → 任何线程对val/next的修改对其他线程立即可见            │
│                                                          │
│  2. tabAt 使用 Unsafe.getReferenceAcquire                 │
│     → 具有volatile读语义，保证看到最新的桶头节点           │
│                                                          │
│  3. Hash值、Key在Node创建后不可变（final）                │
│     → 不需要担心读到不一致的hash或key                      │
│                                                          │
│  4. 扩容时ForwardingNode指向新表                          │
│     → get操作会自动到新表查找，不会丢失数据               │
│                                                          │
│  5. 弱一致性：get可能读到旧值                              │
│     → 但不会读到"部分写入"的损坏数据                      │
│     → 这是并发容器的合理权衡                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 六、size 统计：CounterCell 机制

### 6.1 问题背景

并发环境下直接用 CAS 更新一个计数器会导致大量竞争。ConcurrentHashMap 采用了类似 LongAdder 的分段计数策略。

### 6.2 CounterCell 实现

```java
// 计数单元：用@Contended避免伪共享
@jdk.internal.vm.annotation.Contended
static final class CounterCell {
    volatile long value;
    CounterCell(long x) { value = x; }
}

// 两个计数来源
private transient volatile long baseCount;        // 无竞争时用
private transient volatile CounterCell[] counterCells;  // 有竞争时分段

// 获取总数
public int size() {
    long n = sumCount();
    return ((n < 0L) ? 0 :
            (n > (long)Integer.MAX_VALUE) ? Integer.MAX_VALUE :
            (int)n);
}

final long sumCount() {
    CounterCell[] as = counterCells;
    long sum = baseCount;
    if (as != null) {
        // 累加所有CounterCell
        for (CounterCell a : as)
            if (a != null)
                sum += a.value;
    }
    return sum;
}
```

### 6.3 addCount 更新逻辑

```java
// 简化版的addCount计数逻辑
private final void addCount(long x, int check) {
    CounterCell[] as; long b, s;
    if ((as = counterCells) != null ||
        !U.compareAndSetLong(this, BASECOUNT, b = baseCount, s = b + x)) {
        // baseCount的CAS失败 → 使用CounterCell
        CounterCell a; long v; int m;
        boolean uncontended = true;
        if (as == null || (m = as.length - 1) < 0 ||
            (a = as[ThreadLocalRandom.getProbe() & m]) == null ||
            !(uncontended =
              U.compareAndSetLong(a, CELLVALUE, v = a.value, v + x))) {
            // CounterCell也为空或CAS失败 → 走fullAddCount
            fullAddCount(x, uncontended);
            return;
        }
        s = sumCount();  // 重新计算总数
    }
    // 检查扩容...
}
```

计数策略图：

```
┌──────────────────────────────────────────────────────────┐
│              size 计数策略                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   线程1 ──CAS──► baseCount                               │
│                    │                                     │
│                 成功? → 完成                               │
│                 失败? ↓                                   │
│                                                          │
│   线程1 ──CAS──► CounterCell[0]                          │
│   线程2 ──CAS──► CounterCell[1]                          │
│   线程3 ──CAS──► CounterCell[2]                          │
│                    │                                     │
│                                                          │
│   size = baseCount + Σ(CounterCell[i].value)             │
│                                                          │
│   原理：将一个热点计数分散到多个CounterCell               │
│         减少CAS竞争，提高并发吞吐量                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 七、链表转红黑树

### 7.1 treeifyBin 方法

```java
private final void treeifyBin(Node<K,V>[] tab, int index) {
    Node<K,V> b; int n, sc;
    if (tab != null) {
        // ★ table容量 < 64 时，优先扩容而不是树化
        if ((n = tab.length) < MIN_TREEIFY_CAPACITY)
            tryPresize(n << 1);  // 扩容2倍
        else if ((b = tabAt(tab, index)) != null && b.hash >= 0) {
            synchronized (b) {  // 锁住头节点
                if (tabAt(tab, index) == b) {
                    TreeNode<K,V> hd = null, tl = null;
                    // 将Node链表转为TreeNode链表
                    for (Node<K,V> e = b; e != null; e = e.next) {
                        TreeNode<K,V> p =
                            new TreeNode<K,V>(e.hash, e.key, e.val,
                                              null, null);
                        if ((p.prev = tl) == null)
                            hd = p;
                        else
                            tl.next = p;
                        tl = p;
                    }
                    // 用TreeBin包装红黑树
                    setTabAt(tab, index, new TreeBin<K,V>(hd));
                }
            }
        }
    }
}
```

### 7.2 树化条件

```
┌──────────────────────────────────────────────────┐
│              链表转红黑树的条件                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  条件1: 桶内节点数 > TREEIFY_THRESHOLD (8)        │
│  条件2: table容量 >= MIN_TREEIFY_CAPACITY (64)   │
│                                                  │
│  如果条件1满足但条件2不满足：                       │
│    → 优先扩容（tryPresize）                       │
│    → 扩容后链表可能被分散到不同桶                   │
│    → 避免不必要的树化开销                         │
│                                                  │
│  红黑树退化为链表：                               │
│    → 桶内节点数 <= UNTREEIFY_THRESHOLD (6)        │
│    → 发生在扩容迁移时                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 八、面试要点

### Q1: ConcurrentHashMap 在 JDK 8 中为什么放弃分段锁？

**A：** 
1. **锁粒度更细**：JDK 7 的锁粒度是 Segment（默认16个），JDK 8 是桶级别（单个 Node），并发度从固定16提升到与桶数相同。
2. **减少内存开销**：Segment 本身是 ReentrantLock 的子类，每个 Segment 维护自己的数组，内存开销大。JDK 8 直接用 `Node[] table`，省去了 Segment 层。
3. **红黑树优化**：JDK 8 引入红黑树，将最坏查询复杂度从 O(n) 降为 O(log n)，hash 碰撞严重时性能更好。

### Q2: ConcurrentHashMap 的 put 流程是什么？

**A：** 
1. 计算 hash（spread 扰动）
2. table 为空则 initTable 初始化
3. 目标桶为空 → CAS 插入新节点（无锁）
4. 桶是 ForwardingNode → helpTransfer 协助扩容
5. 桶非空 → synchronized 锁住头节点，遍历链表/红黑树插入或覆盖
6. 桶内节点数 > 8 且表容量 ≥ 64 → treeifyBin 转红黑树
7. addCount 增加计数，检查扩容

### Q3: get 为什么不需要加锁？

**A：** Node 的 `val` 和 `next` 是 volatile 的，`tabAt` 使用 Unsafe 的 volatile 语义读取桶头节点。Key 和 hash 是 final 不可变。因此 get 操作可以无锁安全读取，最差情况是读到稍旧的值（弱一致性），但不会读到损坏数据。扩容时 ForwardingNode 会引导 get 到新表查找。

### Q4: ConcurrentHashMap 如何实现多线程扩容？

**A：** 
1. 扩容时创建 `nextTable`（容量翻倍），设置 `transferIndex` 为旧表长度。
2. 每个参与迁移的线程通过 CAS 领取一个 stride（默认16）大小的桶区间。
3. 迁移时锁住桶头节点（synchronized），将链表拆成低位链和高位链（根据 `hash & n`），分别放到新表的 `i` 和 `i+n` 位置。
4. 迁移完的桶放置 `ForwardingNode` 标记。
5. put 线程遇到 ForwardingNode 时会调用 `helpTransfer` 协助迁移。

### Q5: ConcurrentHashMap 为什么不允许 null key 和 null value？

**A：** 因为在并发环境下无法区分"key不存在"和"value为null"。HashMap 可以通过 `contains(key)` 检查，但在并发场景下，`get` 和 `contains` 之间可能被其他线程修改，产生二义性问题。为了避免这种歧义，直接禁止 null。

### Q6: size 方法返回的值准确吗？

**A：** 是一个**弱一致性**的估算值。使用 CounterCell 分段计数机制，`sumCount` 累加 baseCount 和所有 CounterCell 的值。由于各 CounterCell 的读取不是原子的，在并发写入时可能略有偏差，但在没有并发写入时是精确的。

## 九、避坑指南

### 坑1：在迭代过程中修改 Map

```java
// ❌ ConcurrentHashMap 的迭代器是弱一致的
// 可以在迭代时删除（通过迭代器的remove）
// 但不保证看到迭代期间的修改
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
// ...填充数据...
for (String key : map.keySet()) {
    map.put("new" + key, 1);  // 可能看到也可能看不到新key
}

// ✅ 使用 entrySet 迭代 + remove
Iterator<Map.Entry<String, Integer>> it = map.entrySet().iterator();
while (it.hasNext()) {
    Map.Entry<String, Integer> entry = it.next();
    if (entry.getValue() == 0) {
        it.remove();  // 安全删除
    }
}
```

### 坑2：computeIfAbsent 中递归修改

```java
// ❌ 在computeIfAbsent的lambda中修改同一个map可能死锁
map.computeIfAbsent("A", k -> {
    map.put("B", 1);  // 可能导致死锁（synchronized重入问题）
    return 1;
});

// ✅ 先computeIfAbsent，再单独put
map.computeIfAbsent("A", k -> 1);
map.put("B", 1);
```

### 坑3：误以为 size 精确

```java
// ❌ size()是估算值，不要用于精确判断
if (map.size() == 0) {  // 可能在并发下不准确
    doSomething();
}

// ✅ 使用 isEmpty() 判断空
if (map.isEmpty()) {
    doSomething();
}
```

### 坑4：忽略弱一致性

```java
// ❌ put后立即get可能读不到（极小概率，但有理论可能）
map.put("key", "value");
// 其他线程可能在扩容迁移过程中
String v = map.get("key");  // 可能返回null（弱一致性）

// ✅ 如果需要强一致性，使用Collections.synchronizedMap或加锁
```

## 十、总结

ConcurrentHashMap JDK 8 的设计是并发编程的典范：

1. **锁策略**：空桶 CAS（无锁）+ 非空桶 synchronized（细粒度），兼顾性能和正确性
2. **数据结构**：链表 + 红黑树，自适应地处理 hash 碰撞
3. **扩容**：多线程协助迁移，ForwardingNode 引导读写操作到新表
4. **计数**：CounterCell 分段计数，减少 CAS 竞争
5. **读操作**：全程无锁，volatile 保证可见性，接受弱一致性

关键设计思想：**减少锁竞争**（CAS优先）、**减小锁粒度**（桶级别）、**多线程协作**（协助扩容）、**用空间换时间**（CounterCell）。
