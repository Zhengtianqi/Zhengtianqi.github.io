---
title: JVM 内存模型与 volatile 深度剖析：可见性、有序性与 JMM
tag: ["JVM", "JMM", "volatile", "happens-before", "内存模型"]
category: 基础知识
date: 2026-07-02
---

# JVM 内存模型与 volatile 深度剖析：可见性、有序性与 JMM

volatile 到底保证什么？指令重排怎么导致双重检查锁失效？happens-before 是什么？JMM 不是内存结构，而是并发编程的"交通规则"。

---

## 一、JMM 是什么

### 1.1 JMM vs JVM 内存结构

```
JVM 内存结构（运行时数据区）：
  堆、栈、方法区、程序计数器 → 物理内存划分

JMM（Java Memory Model，Java 内存模型）：
  描述多线程环境下变量的访问规则
  不是物理内存划分，而是抽象的并发规则

JMM 核心：
  每个线程有自己的工作内存（CPU 缓存/寄存器抽象）
  所有线程共享主内存
  
  线程不能直接读写主内存
  线程只能操作工作内存中的副本
  工作内存与主内存之间通过 save/load 同步

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Thread A    │  │  Thread B    │  │  Thread C    │
  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
  │ │工作内存   │ │  │ │工作内存   │ │  │ │工作内存   │ │
  │ │ x = 0    │ │  │ │ x = 1    │ │  │ │ x = 0    │ │
  │ └────┬─────┘ │  │ └────┬─────┘ │  │ └────┬─────┘ │
  └──────┼───────┘  └──────┼───────┘  └──────┼───────┘
         │ save/load       │ save/load       │ save/load
         ▼                 ▼                 ▼
  ┌──────────────────────────────────────────────┐
  │                  主内存                        │
  │              x = 0 (初始值)                    │
  └──────────────────────────────────────────────┘

问题：
  Thread B 把 x 改成 1 → 写到工作内存 → 还没 save 到主内存
  Thread A 读 x → 从工作内存读 → 还是 0 → 可见性问题！
```

---

## 二、三大特性

### 2.1 可见性

```java
// 可见性问题示例
class VisibilityProblem {
    private boolean stopped = false;  // 普通变量
    
    public void stop() {
        stopped = true;  // Thread A 设置
    }
    
    public void run() {
        while (!stopped) {
            // Thread B 可能永远看不到 stopped = true
            // 因为 Thread B 的工作内存中 stopped 还是 false
            // → 死循环！
        }
    }
}

// 修复：volatile 保证可见性
class VisibilityFixed {
    private volatile boolean stopped = false;
    
    public void stop() {
        stopped = true;  // volatile 写 → 立即刷新到主内存
    }
    
    public void run() {
        while (!stopped) {
            // volatile 读 → 每次从主内存读
            // Thread A 写入后 Thread B 立即可见
        }
    }
}
```

### 2.2 有序性

```java
// 指令重排示例
class ReorderingProblem {
    int x = 0, y = 0;
    
    void writer() {
        x = 1;   // 可能被重排到 y=2 后面
        y = 2;
    }
    
    void reader() {
        if (y == 2) {
            // 不保证 x == 1！
            // 因为 writer 中 x=1 和 y=2 可能被重排
        }
    }
}

// 重排规则：
// 在单线程内，重排不能改变执行结果（as-if-serial）
// 但多线程下，重排会改变可见性顺序
```

### 2.3 原子性

```java
// volatile 不保证原子性！
class AtomicityProblem {
    private volatile int count = 0;
    
    public void increment() {
        count++;  // 不是原子操作！
        // count++ = 读 + 加 1 + 写
        // volatile 只保证读和写各自可见
        // 但读和写之间可能被其他线程插入
    }
}

// 修复 1：synchronized
public synchronized void increment() {
    count++;
}

// 修复 2：AtomicInteger
private AtomicInteger count = new AtomicInteger(0);
public void increment() {
    count.incrementAndGet();  // CAS 原子操作
}
```

---

## 三、volatile 深度解析

### 3.1 volatile 做了什么

```
volatile 写：
  1. 将工作内存的值刷新到主内存
  2. 插入 StoreStore 屏障（前面的写操作先于 volatile 写完成）
  3. 插入 StoreLoad 屏障（volatile 写先于后续的读操作）

volatile 读：
  1. 从主内存读取最新值
  2. 插入 LoadLoad 屏障（volatile 读先于后面的读操作）
  3. 插入 LoadStore 屏障（volatile 读先于后面的写操作）

底层实现（x86 架构）：
  volatile 写 → lock 前缀指令 → CPU 缓存行刷到主内存
  → 通过 MESI 缓存一致性协议使其他 CPU 缓存行失效
  → 其他 CPU 读时从主内存重新加载

  代价：volatile 写比普通写慢 10-100 倍
```

### 3.2 内存屏障

```
四种内存屏障：

LoadLoad：Load1; LoadLoad; Load2
  → Load1 必须在 Load2 之前完成

StoreStore：Store1; StoreStore; Store2
  → Store1 必须在 Store2 之前刷新到内存

LoadStore：Load1; LoadStore; Store2
  → Load1 必须在 Store2 之前完成

StoreLoad：Store1; StoreLoad; Load2
  → Store1 必须刷新到内存后才能执行 Load2
  → 最重的屏障（全能屏障）

volatile 的屏障插入策略：
  volatile 写之前：StoreStore 屏障
  volatile 写之后：StoreLoad 屏障
  volatile 读之后：LoadLoad 屏障 + LoadStore 屏障
```

### 3.3 volatile 不保证原子性

```java
// 经典反例
public class VolatileNotAtomic {
    private volatile int count = 0;
    
    public static void main(String[] args) throws Exception {
        VolatileNotAtomic demo = new VolatileNotAtomic();
        
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) demo.count++;
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) demo.count++;
        });
        
        t1.start(); t2.start();
        t1.join(); t2.join();
        
        System.out.println(demo.count);  // 不是 20000！
        // 可能是 15342, 18756 等
    }
}

// count++ 字节码：
// 1. getfield count    → 读 count（volatile 读，从主内存读）
// 2. iconst_1          → 压入常量 1
// 3. iadd              → 加 1
// 4. putfield count    → 写 count（volatile 写，刷到主内存）
//
// 线程 A 读到 count=0，加 1，还没写
// 线程 B 读到 count=0（volatile 保证读到最新，但此时 A 还没写）
// 线程 A 写 count=1
// 线程 B 写 count=1（覆盖了 A 的结果）
// → 丢失更新
```

---

## 四、指令重排

### 4.1 重排类型

```
1. 编译器重排：编译器优化指令顺序
   javac / JIT 可能重排

2. CPU 重排：CPU 乱序执行
   Store Buffer + Invalidate Queue 导致 Store-Store 重排
   x86 较强（只允许 Store-Store 重排）
   ARM 较弱（允许各种重排）

3. 内存重排：CPU 缓存导致可见性顺序变化
   MESI 协议 + Store Buffer 导致
```

### 4.2 重排导致的双重检查锁失效

```java
// 问题代码：双重检查锁单例
public class Singleton {
    private static Singleton instance;  // 没有 volatile！
    
    public static Singleton getInstance() {
        if (instance == null) {                // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) {         // 第二次检查
                    instance = new Singleton(); // 问题在这！
                }
            }
        }
        return instance;
    }
}

// instance = new Singleton() 不是原子的，分三步：
// 1. 分配内存空间
// 2. 初始化对象（调用构造函数）
// 3. 将引用指向内存地址
//
// 重排后可能变成：
// 1. 分配内存空间
// 3. 将引用指向内存地址  ← instance 不为 null 了！
// 2. 初始化对象
//
// 线程 B 在第一次检查时看到 instance != null
// → 直接返回未初始化的对象 → NPE！

// 修复：加 volatile
private static volatile Singleton instance;
// volatile 禁止 2 和 3 的重排（StoreStore 屏障）
```

---

## 五、happens-before 规则

### 5.1 八条规则

```
happens-before：如果 A happens-before B，则 A 的操作对 B 可见

1. 程序顺序规则（Program Order Rule）：
   同一线程内，前面的操作 happens-before 后面的操作
   
2. 监视器锁规则（Monitor Lock Rule）：
   unlock 操作 happens-before 后续对同一个锁的 lock 操作
   
3. volatile 变量规则（Volatile Variable Rule）：
   volatile 写 happens-before 后续的 volatile 读
   
4. 线程启动规则（Thread Start Rule）：
   Thread.start() happens-before 该线程的所有操作
   
5. 线程终止规则（Thread Termination Rule）：
   线程的所有操作 happens-before Thread.join() 返回
   
6. 线程中断规则（Thread Interruption Rule）：
   interrupt() 调用 happens-before 被中断线程检测到中断
   
7. 对象终结规则（Finalizer Rule）：
   对象初始化完成 happens-before finalize() 方法
   
8. 传递性（Transitivity）：
   A happens-before B，B happens-before C → A happens-before C
```

### 5.2 实战推导

```java
// 利用 happens-before 分析可见性
class HappensBeforeExample {
    int x = 0;
    volatile boolean v = false;
    
    // Thread A
    void writer() {
        x = 42;        // (1) 普通写
        v = true;      // (2) volatile 写
    }
    
    // Thread B
    void reader() {
        if (v) {        // (3) volatile 读
            int r = x;  // (4) 普通读 → r 一定等于 42
        }
    }
}

// 推导：
// (1) happens-before (2)  → 程序顺序规则（同一线程）
// (2) happens-before (3)  → volatile 变量规则（volatile 写 hb volatile 读）
// (3) happens-before (4)  → 程序顺序规则（同一线程）
// 传递性：(1) happens-before (4)
// → 所以 x=42 对 reader 可见，r 一定等于 42

// 这就是 volatile 的经典用法：作为"信号量"保证前面所有写操作可见
```

---

## 六、volatile 应用场景

### 6.1 状态标志

```java
// 场景：线程停止标志
private volatile boolean running = true;

public void run() {
    while (running) {
        // 工作循环
    }
}

public void shutdown() {
    running = false;  // 其他线程能立即看到
}
```

### 6.2 DCL 单例

```java
// 场景：双重检查锁单例
public class Singleton {
    private static volatile Singleton instance;
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

### 6.3 安全发布

```java
// 场景：volatile 安全发布对象
class Configuration {
    private volatile Config config;  // volatile 保证完整可见性
    
    public void updateConfig(Config newConfig) {
        // volatile 写：newConfig 的所有字段在 volatile 写之前完成
        this.config = newConfig;
    }
    
    public Config getConfig() {
        // volatile 读：读到引用后，所有字段也可见
        return this.config;
    }
}
```

### 6.4 不适合的场景

```java
// 不适合：计数器（不保证原子性）
private volatile int count = 0;
count++;  // 线程不安全！

// 不适合：复合操作
private volatile Map<String, String> cache;
// check-then-act 仍然不安全
if (!cache.containsKey(key)) {  // 检查
    cache.put(key, value);       // 操作 → 可能有多个线程同时通过检查
}
```

---

## 七、synchronized 与 volatile 对比

| 维度 | synchronized | volatile |
|------|-------------|----------|
| 原子性 | ✅ 保证 | ❌ 不保证 |
| 可见性 | ✅ 保证 | ✅ 保证 |
| 有序性 | ✅ 保证 | ✅ 保证（部分） |
| 阻塞 | 是 | 否 |
| 粒度 | 代码块/方法 | 变量 |
| 性能 | 较重 | 较轻 |
| 编译优化 | 限制 | 限制（禁止重排） |
| 适用 | 复合操作 | 状态标志/安全发布 |

---

## 八、final 的内存语义

```java
// final 字段的初始化安全保证
class FinalFieldExample {
    final int x;
    int y;
    
    public FinalFieldExample() {
        x = 42;  // final 字段
        y = 43;  // 非 final 字段
    }
}

// 线程 A 创建对象
FinalFieldExample obj = new FinalFieldExample();

// 线程 B 读 obj
// final 字段：保证 x = 42（构造函数完成对其他线程可见）
// 非 final 字段：y 可能是 0（未初始化）或 43（指令重排）

// 这是为什么 immutable 对象要用 final：
// final 保证构造完成后所有线程能看到正确值
// 无需 volatile 或 synchronized
```

---

## 九、面试要点

### Q：volatile 和 synchronized 的区别？

volatile 只保证可见性和有序性，不保证原子性。synchronized 三者都保证。volatile 适合状态标志（boolean flag），synchronized 适合复合操作（count++）。volatile 不阻塞，性能更好。volatile 禁止指令重排，synchronized 也禁止重排但粒度更大。

### Q：双重检查锁为什么需要 volatile？

`instance = new Singleton()` 不是原子操作，分为分配内存、初始化对象、引用赋值三步。没有 volatile 时，编译器/CPU 可能将"引用赋值"重排到"初始化对象"前面。其他线程在第一次检查时看到 instance != null，但对象还没初始化完成，直接使用会 NPE。volatile 通过 StoreStore 屏障禁止重排。

### Q：happens-before 是什么？

happens-before 是 JMM 定义的可见性规则：如果 A happens-before B，则 A 的操作对 B 可见。八条规则中最重要的三条：程序顺序（单线程内顺序）、volatile 写 happens-before volatile 读、监视器锁 unlock happens-before lock。通过传递性可以推导跨线程的可见性。

---

## 十、总结

JMM 核心知识：

```
三大特性：
  可见性 → volatile / synchronized
  有序性 → volatile / synchronized（禁止重排）
  原子性 → synchronized / Atomic 类

volatile 两个作用：
  1. 保证可见性（读从主内存读，写刷到主内存）
  2. 禁止指令重排（内存屏障）

happens-before：
  传递性的可见性规则，连接单线程和多线程

记住：volatile 保可见不保原子，DCL 必须 volatile，final 保证初始化安全。
```
