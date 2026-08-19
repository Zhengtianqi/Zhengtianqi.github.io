---
title: Java并发包核心：AQS原理深度剖析
date: 2026-08-19
category: 基础知识
tag: ["Java", "并发编程", "AQS", "Lock", "并发包"]
---

# Java并发包核心：AQS原理深度剖析

> AQS(AbstractQueuedSynchronizer)是Java并发包的基石，ReentrantLock、Semaphore、CountDownLatch等都基于它实现。
> 本文深入剖析AQS的设计思想、实现原理和源码分析，帮助你理解Java并发编程的核心机制。

## 一、AQS概述

### 1.1 AQS在并发包中的地位

```
java.util.concurrent包结构：

├── locks
│   ├── ReentrantLock        (基于AQS)
│   ├── ReentrantReadWriteLock (基于AQS)
│   └── StampedLock          (基于AQS)
├── synchronizers
│   ├── CountDownLatch       (基于AQS)
│   ├── CyclicBarrier        (基于Lock)
│   ├── Semaphore            (基于AQS)
│   └── Exchanger
└── atomic
    ├── AtomicInteger
    ├── AtomicLong
    └── AtomicReference
```

### 1.2 AQS核心思想

| 核心概念 | 说明 |
|----------|------|
| state | 同步状态，int类型，通过CAS修改 |
| CLH队列 | 双向链表实现的等待队列 |
| 独占模式 | 只有一个线程能获取锁(ReentrantLock) |
| 共享模式 | 多个线程可同时获取(Semaphore、CountDownLatch) |

## 二、AQS源码分析

### 2.1 核心数据结构

```java
public abstract class AbstractQueuedSynchronizer {
    // 同步状态
    private volatile int state;
    
    // CLH队列头节点
    private transient volatile Node head;
    
    // CLH队列尾节点
    private transient volatile Node tail;
    
    // 节点定义
    static final class Node {
        volatile Node prev;
        volatile Node next;
        volatile Thread thread;
        volatile int waitStatus;
        
        static final int SIGNAL = -1;      // 等待被唤醒
        static final int CANCELLED = 1;    // 已取消
        static final int CONDITION = -2;   // 在条件队列中
        static final int PROPAGATE = -3;   // 传播模式
    }
}
```

### 2.2 独占模式获取锁流程

```
acquire(1)流程：

┌─────────────────────────────────────────────────────────────┐
│  1. tryAcquire(arg)                                         │
│     ├─ 成功 → 返回true，获取锁成功                           │
│     └─ 失败 → 进入步骤2                                     │
├─────────────────────────────────────────────────────────────┤
│  2. addWaiter(Node.EXCLUSIVE)                               │
│     └─ 创建节点，加入CLH队列尾部                             │
├─────────────────────────────────────────────────────────────┤
│  3. acquireQueued(node, arg)                                │
│     ├─ 自旋获取锁                                           │
│     ├─ 检查是否需要阻塞                                      │
│     └─ 阻塞等待被唤醒                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 源码详解

```java
// 获取独占锁
public final void acquire(int arg) {
    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}

// 尝试获取锁(子类实现)
protected boolean tryAcquire(int arg) {
    throw new UnsupportedOperationException();
}

// 添加等待节点
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    // 快速尝试
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    // 快速失败，入队
    enq(node);
    return node;
}

// 在队列中等待获取
final boolean acquireQueued(final Node node, int arg) {
    boolean interrupted = false;
    for (;;) {
        final Node p = node.predecessor();
        if (p == head && tryAcquire(arg)) {
            setHead(node);
            p.next = null;
            return interrupted;
        }
        // 判断是否需要阻塞
        if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
            interrupted = true;
    }
}

// 阻塞当前线程
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);
    return Thread.interrupted();
}
```

### 2.4 释放锁流程

```
release(1)流程：

┌─────────────────────────────────────────────────────────────┐
│  1. tryRelease(arg)                                         │
│     ├─ 成功 → 进入步骤2                                     │
│     └─ 失败 → 返回false                                     │
├─────────────────────────────────────────────────────────────┤
│  2. 唤醒后继节点                                             │
│     └─ unparkSuccessor(head)                                │
│         └─ LockSupport.unpark(head.thread)                  │
└─────────────────────────────────────────────────────────────┘
```

## 三、基于AQS的实现类

### 3.1 ReentrantLock

```java
// 公平锁实现
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 检查是否有等待的线程(公平性)
        if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    } else if (current == getExclusiveOwnerThread()) {
        // 可重入
        int nextc = c + acquires;
        setState(nextc);
        return true;
    }
    return false;
}
```

### 3.2 Semaphore

```java
// 共享模式获取
protected int tryAcquireShared(int acquires) {
    for (;;) {
        int available = getState();
        int remaining = available - acquires;
        if (remaining < 0 || compareAndSetState(available, remaining))
            return remaining;
    }
}
```

### 3.3 CountDownLatch

```java
// 等待所有线程完成
public void await() throws InterruptedException {
    acquireQueued(addWaiter(Node.SHARED), 1);
}

// 计数减1
public void countDown() {
    sync.releaseShared(1);
}

protected boolean tryReleaseShared(int releases) {
    for (;;) {
        int c = getState();
        if (c == 0) return false;
        int nextc = c - 1;
        if (compareAndSetState(c, nextc))
            return nextc == 0;
    }
}
```

## 四、ReentrantLock vs synchronized

### 4.1 功能对比

| 特性 | ReentrantLock | synchronized |
|------|---------------|--------------|
| 锁获取方式 | tryLock()非阻塞 | 阻塞等待 |
| 可中断 | lockInterruptibly() | 不可中断 |
| 超时获取 | tryLock(timeout) | 不支持 |
| 公平性 | 支持公平/非公平 | 非公平 |
| 条件变量 | 多个Condition | 单个wait/notify |
| 可重入 | 支持 | 支持 |
| 性能 | 接近synchronized | JDK6+优化后接近 |

### 4.2 选择建议

```
选择策略：

1. 简单同步场景
   └─ 优先使用synchronized

2. 需要高级功能
   ├─ 可中断 → ReentrantLock
   ├─ 超时获取 → ReentrantLock
   ├─ 公平性 → ReentrantLock
   └─ 多条件 → ReentrantLock

3. 性能考虑
   ├─ 低竞争 → synchronized
   └─ 高竞争 → ReentrantLock
```

## 五、实战案例

### 5.1 可中断锁

```java
public class InterruptibleLock {
    private final ReentrantLock lock = new ReentrantLock();
    
    public void doSomething() throws InterruptedException {
        lock.lockInterruptibly();
        try {
            // 业务逻辑
            Thread.sleep(10000);
        } finally {
            lock.unlock();
        }
    }
}

// 使用
Thread t1 = new Thread(() -> {
    try {
        doSomething();
    } catch (InterruptedException e) {
        System.out.println("线程被中断");
    }
});
t1.start();

Thread.sleep(1000);
t1.interrupt();  // 中断线程
```

### 5.2 超时获取锁

```java
public class TimeoutLock {
    private final ReentrantLock lock = new ReentrantLock();
    
    public boolean tryDoSomething() {
        try {
            if (lock.tryLock(3, TimeUnit.SECONDS)) {
                try {
                    // 业务逻辑
                    return true;
                } finally {
                    lock.unlock();
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return false;
    }
}
```

### 5.3 多条件变量

```java
public class BoundedBuffer {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    
    private final Object[] items = new Object[100];
    private int count, putIdx, takeIdx;
    
    public void put(Object x) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length)
                notFull.await();  // 等待非满
            items[putIdx] = x;
            if (++putIdx == items.length) putIdx = 0;
            count++;
            notEmpty.signal();  // 通知非空
        } finally {
            lock.unlock();
        }
    }
    
    public Object take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0)
                notEmpty.await();  // 等待非空
            Object x = items[takeIdx];
            if (++takeIdx == items.length) takeIdx = 0;
            count--;
            notFull.signal();  // 通知非满
            return x;
        } finally {
            lock.unlock();
        }
    }
}
```

## 六、性能优化

### 6.1 锁优化技巧

| 技巧 | 说明 |
|------|------|
| 减小锁粒度 | 只同步必要代码 |
| 缩短持锁时间 | 避免在锁内做IO操作 |
| 使用读写锁 | 读多写少场景 |
| 无锁编程 | CAS、原子类 |

### 6.2 避免死锁

```java
// 死锁预防：统一加锁顺序
public void transfer(Account from, Account to, int amount) {
    Object first = from.getId() < to.getId() ? from : to;
    Object second = from.getId() < to.getId() ? to : from;
    
    synchronized (first) {
        synchronized (second) {
            from.debit(amount);
            to.credit(amount);
        }
    }
}
```

## 七、常见问题

### 7.1 AQS面试题

| 问题 | 答案要点 |
|------|----------|
| AQS如何实现锁？ | state + CLH队列 + CAS |
| 公平锁和非公平锁区别？ | 公平锁检查队列，非公平锁直接尝试 |
| Condition如何实现？ | 条件队列 + 同步队列转换 |
| 为什么用CLH队列？ | 低延迟、低内存、公平性 |
