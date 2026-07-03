---
title: AQS 源码深度剖析：ReentrantLock 与 Condition 的实现原理
tag: ["Java", "并发编程", "AQS", "源码解析"]
category: 基础知识
date: 2026-07-03
---

# AQS 源码深度剖析：ReentrantLock 与 Condition 的实现原理

> AQS（AbstractQueuedSynchronizer）是 Java 并发包的基石。理解 AQS，就等于拿到了理解 ReentrantLock、Semaphore、CountDownLatch、ReentrantReadWriteLock 等一系列同步工具的万能钥匙。本文将从核心设计到源码逐行剖析，带你彻底搞懂 AQS。

## 一、AQS 核心设计：state + CLH 队列

### 1.1 设计哲学

AQS 的核心思想可以用一句话概括：**用一个 volatile int state 表示同步状态，用一个 CLH 变种队列管理等待线程**。

```
┌─────────────────────────────────────────────────────────┐
│                    AQS 核心架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐    volatile int state    ┌─────────────┐ │
│   │ Sync    │ ◄─────────────────────► │ state 字段   │ │
│   │ (继承   │    0 = 空闲              │ (同步状态)   │ │
│   │  AQS)   │    >0 = 已获取           └─────────────┘ │
│   └─────────┘                                          │
│        │                                               │
│        ▼                                               │
│   ┌─────────────────────────────────────────────┐      │
│   │          CLH 等待队列 (双向链表)              │      │
│   │                                             │      │
│   │   head ◄──► Node1 ◄──► Node2 ◄──► Node3     │      │
│   │   (哨兵)    (等待     (等待     (等待        │      │
│   │             线程A)    线程B)    线程C)       │      │
│   │                                             │      │
│   │  每个Node包含:                               │      │
│   │  - thread: 等待的线程引用                     │      │
│   │  - waitStatus: 等待状态                      │      │
│   │  - prev/next: 前驱/后继节点                   │      │
│   │  - nextWaiter: Condition队列的下一个节点      │      │
│   └─────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心字段源码

```java
public abstract class AbstractQueuedSynchronizer
    extends AbstractOwnableSynchronizer
    implements java.io.Serializable {

    // 等待队列的头节点（哨兵节点，不存储线程）
    private transient volatile Node head;

    // 等待队列的尾节点
    private transient volatile Node tail;

    // 同步状态：0表示空闲，>0表示已获取
    // ReentrantLock中：0=未锁定，1=锁定一次，2=重入一次...
    // Semaphore中：表示剩余许可数
    // CountDownLatch中：表示还剩多少个计数
    private volatile int state;

    // 指向持有锁的线程（继承自AbstractOwnableSynchronizer）
    // private transient Thread exclusiveOwnerThread;
}
```

### 1.3 Node 节点详解

```java
static final class Node {
    // 共享模式标记
    static final Node SHARED = new Node();
    // 独占模式标记
    static final Node EXCLUSIVE = null;

    // waitStatus 取值
    static final int CANCELLED =  1;  // 节点已取消（超时或中断）
    static final int SIGNAL    = -1;  // 后继节点需要被唤醒
    static final int CONDITION = -2;  // 节点在Condition等待队列中
    static final int PROPAGATE = -3;  // 共享模式下传播唤醒

    volatile int waitStatus;       // 等待状态
    volatile Node prev;            // 前驱节点
    volatile Node next;            // 后继节点
    volatile Thread thread;        // 等待的线程
    Node nextWaiter;               // Condition队列中的下一个节点

    // 判断是否为共享模式
    final boolean isShared() {
        return nextWaiter == SHARED;
    }

    // 获取前驱节点（非空检查）
    final Node predecessor() throws NullPointerException {
        Node p = prev;
        if (p == null)
            throw new NullPointerException();
        return p;
    }
}
```

### 1.4 CLH 队列结构图

```
CLH (Craig, Landin, and Hagersten) 队列变种：

     head                                          tail
      │                                              │
      ▼                                              ▼
   ┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐
   │ 哨兵  │◄───►│ Node1│◄───►│ Node2│◄───►│ Node3│
   │      │     │      │     │      │     │      │
   │ws=-1 │     │ws=-1 │     │ws=-1 │     │ws= 0 │
   │thread│     │thrd=A│     │thrd=B│     │thrd=C│
   │ =null│     │      │     │      │     │      │
   └──────┘     └──────┘     └──────┘     └──────┘

   说明：
   - head 是哨兵节点，thread 为 null，它不代表任何线程
   - 每个节点的 waitStatus=SIGNAL(-1) 表示其后继节点需要被唤醒
   - 尾节点的 waitStatus=0，因为它没有后继节点
   - 队列是先进先出 (FIFO) 的，保证公平性
```

## 二、ReentrantLock 获取锁源码剖析

### 2.1 ReentrantLock 整体结构

```java
public class ReentrantLock implements Lock, java.io.Serializable {

    private final Sync sync;

    // 同步器基类，继承AQS
    abstract static class Sync extends AbstractQueuedSynchronizer {
        // 非公平获取（子类实现）
        abstract void lock();
        // 非公平tryAcquire
        final boolean nonfairTryAcquire(int acquires) { ... }
        // 公平tryAcquire由FairSync实现
        // 释放锁逻辑（公平/非公平通用）
        protected final boolean tryRelease(int releases) { ... }
    }

    // 非公平同步器
    static final class NonfairSync extends Sync {
        final void lock() { ... }
        protected final boolean tryAcquire(int acquires) { ... }
    }

    // 公平同步器
    static final class FairSync extends Sync {
        final void lock() { ... }
        protected final boolean tryAcquire(int acquires) { ... }
    }

    // 默认非公平锁
    public ReentrantLock() {
        sync = new NonfairSync();
    }

    // 可选择公平/非公平
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }
}
```

### 2.2 非公平锁获取：lock() 方法

```java
// NonfairSync.lock()
final void lock() {
    // 第一步：直接CAS尝试将state从0改为1（插队！）
    if (compareAndSetState(0, 1)) {
        // 成功：设置当前线程为持有者
        setExclusiveOwnerThread(Thread.currentThread());
    } else {
        // 失败：走AQS的acquire流程
        acquire(1);
    }
}
```

**非公平的体现**：新线程不检查队列中是否有等待者，直接尝试 CAS 抢锁。如果恰好锁被释放，新线程可以"插队"获取锁，导致队列中的等待线程可能长期拿不到锁。

### 2.3 AQS acquire 方法——核心入口

```java
// AQS.acquire()
public final void acquire(int arg) {
    if (
        !tryAcquire(arg)                    // ① 尝试获取锁
        && acquireQueued(                    // ② 入队等待
            addWaiter(Node.EXCLUSIVE), arg)  //    先将当前线程包装成Node加入队列
        && Thread.interrupted()              // ③ 如果在等待过程中被中断，补充中断标记
    )
        throw new InterruptedException();
}

// 方法的执行顺序（短路逻辑）：
// 1. tryAcquire: 尝试直接获取锁（由子类实现）
// 2. addWaiter: 如果获取失败，将当前线程包装成Node加入等待队列尾部
// 3. acquireQueued: 在队列中自旋等待，满足条件时尝试获取锁
// 4. 如果等待过程中被中断，最终抛出InterruptedException
```

### 2.4 非公平 tryAcquire 源码

```java
// NonfairSync.tryAcquire()
protected final boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
}

// Sync.nonfairTryAcquire()
final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();

    if (c == 0) {
        // state=0 表示锁空闲
        // 非公平锁：不检查队列，直接CAS抢锁
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        // 当前线程已经持有锁 → 重入
        int nextc = c + acquires;
        if (nextc < 0) // int溢出检查
            throw new Error("Maximum lock count exceeded");
        setState(nextc);  // 重入不需要CAS，因为只有持有者能重入
        return true;
    }
    return false;  // 获取失败
}
```

### 2.5 公平 tryAcquire 源码

```java
// FairSync.tryAcquire()
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();

    if (c == 0) {
        // ★ 关键区别：hasQueuedPredecessors() 检查队列中是否有等待者
        // 公平锁：如果有其他线程在排队，不插队
        if (!hasQueuedPredecessors() &&
            compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        // 重入逻辑与非公平相同
        int nextc = c + acquires;
        if (nextc < 0)
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}

// hasQueuedPredecessors：检查队列中是否有排在自己前面的线程
public final boolean hasQueuedPredecessors() {
    Node t = tail;
    Node h = head;
    Node s;
    // h != t：队列不为空（至少有一个等待节点）
    // s.thread != currentThread：头节点的后继不是当前线程
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
```

### 2.6 addWaiter：入队

```java
// AQS.addWaiter()
private Node addWaiter(Node mode) {
    // 将当前线程包装成Node
    Node node = new Node(Thread.currentThread(), mode);

    // 快速路径：尝试直接在尾部添加
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {  // CAS设置尾节点
            pred.next = node;
            return node;
        }
    }

    // 快速路径失败 → 走enq自旋入队
    enq(node);
    return node;
}

// enq：自旋+CAS入队（处理并发竞争）
private Node enq(final Node node) {
    for (;;) {  // 自旋
        Node t = tail;
        if (t == null) {
            // 队列为空：先初始化一个哨兵头节点
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            // 队列不为空：CAS添加到尾部
            node.prev = t;
            if (compareAndSetTail(t, node)) {
                t.next = node;
                return t;
            }
            // CAS失败：说明有其他线程竞争，继续自旋重试
        }
    }
}
```

入队过程图解：

```
Step 1: 队列为空，初始化哨兵节点
┌──────────┐
│  head    │ ← tail 也指向这里
│ (哨兵)    │
│ thread=null│
│ ws = 0   │
└──────────┘

Step 2: 线程A入队
┌──────────┐     ┌──────────┐
│  head    │◄───►│  NodeA   │
│ (哨兵)    │     │ thread=A │
│ ws = -1  │     │ ws = 0   │ ← tail
└──────────┘     └──────────┘

Step 3: 线程B入队
┌──────────┐     ┌──────────┐     ┌──────────┐
│  head    │◄───►│  NodeA   │◄───►│  NodeB   │
│ (哨兵)    │     │ thread=A │     │ thread=B │
│ ws = -1  │     │ ws = -1  │     │ ws = 0   │ ← tail
└──────────┘     └──────────┘     └──────────┘
```

### 2.7 acquireQueued：自旋等待获取锁

```java
// AQS.acquireQueued()
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {  // 自旋
            final Node p = node.predecessor();  // 获取前驱节点

            // 如果前驱是head，说明轮到自己了，尝试获取
            if (p == head && tryAcquire(arg)) {
                // 获取成功：将自己设为head
                setHead(node);
                p.next = null;  // 帮助GC
                failed = false;
                return interrupted;
            }

            // 判断是否应该挂起（前驱不是head，或获取失败）
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())      // LockSupport.park() 挂起线程
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);  // 异常时取消节点
    }
}

// shouldParkAfterFailedAcquire：判断是否应该挂起
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
    int ws = pred.waitStatus;
    if (ws == Node.SIGNAL)
        // 前驱已经设置了SIGNAL，可以安全挂起
        return true;

    if (ws > 0) {
        // 前驱已取消，跳过所有取消节点，找到有效前驱
        do {
            node.prev = pred = pred.prev;
        } while (pred.waitStatus > 0);
        pred.next = node;
    } else {
        // 前驱状态为0或PROPAGATE，设置为SIGNAL
        // 这样前驱释放锁时会唤醒后继
        compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
    }
    return false;  // 还不能挂起，需要再自旋一次
}

// parkAndCheckInterrupt：挂起线程并检查中断
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this);  // 挂起当前线程
    return Thread.interrupted();  // 被唤醒后检查中断状态
}
```

acquireQueued 流程图：

```
                  ┌─────────────────────────────┐
                  │    acquireQueued(node, arg)  │
                  └─────────────┬───────────────┘
                                │
                                ▼
                  ┌─────────────────────────────┐
                  │  获取前驱节点 p = node.prev  │
                  └─────────────┬───────────────┘
                                │
                                ▼
                  ┌──────────────────────┐     是
           ┌──────┤  p == head ?         ├──────────┐
           │      └──────────────────────┘           │
           │ 否                                      ▼
           │                              ┌──────────────────┐
           │                              │  tryAcquire(arg)  │
           │                              └────────┬─────────┘
           │                                       │
           │                              ┌────────┴────────┐
           │                         成功 │                 │ 失败
           │                              ▼                 │
           │                  ┌──────────────────┐           │
           │                  │ setHead(node)    │           │
           │                  │ 清理旧head       │           │
           │                  │ return interrupted│          │
           │                  └──────────────────┘           │
           │                                                 │
           ▼                                                 │
    ┌──────────────────────┐                                │
    │ shouldParkAfter      │                                │
    │ FailedAcquire(p,node)│                                │
    └────────┬─────────────┘                                │
             │                                               │
        ┌────┴────┐                                          │
    true│         │false                                     │
        ▼         ▼                                          │
  ┌──────────┐  回到自旋循环 ◄───────────────────────────────┘
  │ park()   │
  │ 挂起线程  │
  └────┬─────┘
       │ 被唤醒(unpark)
       ▼
  ┌──────────────┐
  │检查中断状态   │
  │回到自旋循环  │
  └──────────────┘
```

## 三、ReentrantLock 释放锁源码

### 3.1 release 方法

```java
// AQS.release()
public final boolean release(int arg) {
    if (tryRelease(arg)) {           // ① 尝试释放
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);       // ② 唤醒后继节点
        return true;
    }
    return false;
}
```

### 3.2 tryRelease 源码

```java
// Sync.tryRelease()
protected final boolean tryRelease(int releases) {
    int c = getState() - releases;

    // 检查：只有持有锁的线程才能释放
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();

    boolean free = false;
    if (c == 0) {
        // state归零，锁完全释放
        free = true;
        setExclusiveOwnerThread(null);  // 清除持有者
    }
    setState(c);  // 更新state（不需要CAS，因为只有持有者能释放）
    return free;
}
```

### 3.3 unparkSuccessor：唤醒后继

```java
// AQS.unparkSuccessor()
private void unparkSuccessor(Node node) {
    int ws = node.waitStatus;
    if (ws < 0)
        // 将head的waitStatus重置为0（清除SIGNAL标记）
        compareAndSetWaitStatus(node, ws, 0);

    Node s = node.next;
    if (s == null || s.waitStatus > 0) {
        // 后继为空或已取消，从尾向前找第一个有效节点
        s = null;
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    if (s != null)
        LockSupport.unpark(s.thread);  // 唤醒后继线程
}
```

**为什么从尾向前遍历？** 因为 `enq` 入队时，是先设置 `node.prev = pred`，再 CAS 设置 tail，最后才设置 `pred.next = node`。如果从前往后遍历，可能遇到 `next` 还没设置的情况。但 `prev` 链是完整可靠的。

## 四、Condition 的 await/signal 原理

### 4.1 Condition 核心概念

Condition 是 AQS 提供的条件等待机制，相当于 Object 的 wait/notify，但更加灵活：

- 一个 Lock 可以创建多个 Condition，实现多条件等待
- Condition 维护自己的等待队列（单向链表）
- await/signal 必须在持有锁的情况下调用

```
┌──────────────────────────────────────────────────────────────┐
│              Condition 工作原理                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   同步队列 (AQS Queue)          Condition 等待队列            │
│   ┌──────┐  ┌──────┐          ┌──────┐  ┌──────┐           │
│   │ head │◄►│NodeA │          │first │─►│NodeC │           │
│   └──────┘  └──────┘          │waiter│  │waiter│           │
│              │                 └──────┘  └──────┘           │
│              │                     ▲                        │
│              │    signal()         │                        │
│              │   ──────────────────►│                        │
│              │   将NodeC从Condition                          │
│              │   队列移到同步队列                              │
│              │                                              │
│   ┌──────┐  ┌──────┐                                   │
│   │NodeB │◄►│NodeD │                                   │
│   └──────┘  └──────┘                                   │
│                                                              │
│   说明：                                                      │
│   - 同步队列是双向链表，等待获取锁                              │
│   - Condition队列是单向链表，等待条件满足                       │
│   - signal将节点从Condition队列转移到同步队列                   │
│   - 转移后节点需要在同步队列中重新竞争锁                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 await 方法源码

```java
// ConditionObject.await()
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();

    // ① 将当前线程加入Condition等待队列
    Node node = addConditionWaiter();

    // ② 完全释放锁（保存当前state，以便后续恢复）
    int savedState = fullyRelease(node);

    int interruptMode = 0;

    // ③ 检查是否在同步队列中（被signal唤醒后会进入同步队列）
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);  // 不在同步队列 → 挂起
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;  // 被中断则退出
    }

    // ④ 在同步队列中重新竞争锁
    if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
        interruptMode = REINTERRUPT;

    // ⑤ 清理取消的节点
    if (node.nextWaiter != null)
        unlinkCancelledWaiters();

    // ⑥ 处理中断
    if (interruptMode != 0)
        reportInterruptAfterWait(interruptMode);
}
```

### 4.3 addConditionWaiter：加入 Condition 队列

```java
// ConditionObject.addConditionWaiter()
private Node addConditionWaiter() {
    Node t = lastWaiter;  // Condition队列的尾节点

    // 清理已取消的尾节点
    if (t != null && t.waitStatus != Node.CONDITION) {
        unlinkCancelledWaiters();
        t = lastWaiter;
    }

    // 创建新的CONDITION节点
    Node node = new Node(Thread.currentThread(), Node.CONDITION);

    if (t == null)
        firstWaiter = node;  // 第一个等待者
    else
        t.nextWaiter = node;  // 追加到尾部

    lastWaiter = node;
    return node;
}
```

### 4.4 signal 方法源码

```java
// ConditionObject.signal()
public final void signal() {
    // 检查当前线程是否持有锁
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();

    Node first = firstWaiter;
    if (first != null)
        doSignal(first);  // 唤醒第一个等待者
}

// doSignal：将节点从Condition队列移到同步队列
private void doSignal(Node first) {
    do {
        if ((firstWaiter = first.nextWaiter) == null)
            lastWaiter = null;  // 队列清空
        first.nextWaiter = null;
    } while (!transferForSignal(first) &&   // 转移节点
             (first = firstWaiter) != null);
}

// transferForSignal：核心转移逻辑
final boolean transferForSignal(Node node) {
    // 将waitStatus从CONDITION改为0
    if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
        return false;  // CAS失败说明节点已取消

    // 入同步队列
    Node p = enq(node);
    int ws = p.waitStatus;

    // 设置前驱为SIGNAL（确保后续能被唤醒）
    if (ws > 0 || !compareAndSetWaitStatus(p, ws, Node.SIGNAL))
        LockSupport.unpark(node.thread);  // 前驱已取消或CAS失败，直接唤醒

    return true;
}
```

### 4.5 await/signal 完整流程图

```
线程A持有锁，调用condition.await()
═════════════════════════════════════

  时间线：
  ─────────────────────────────────────────────────►
  
  t1: 线程A创建CONDITION节点
      ┌─────────────┐
      │ Condition队列│: A(ws=CONDITION)
      └─────────────┘
  
  t2: 线程A释放锁 (fullyRelease, state从1变为0)
      ┌─────────────┐
      │ 同步队列      │: 空
      └─────────────┘
  
  t3: 线程A挂起 (LockSupport.park)
      线程B获取到锁
  
  t4: 线程B调用condition.signal()
      → 将A从Condition队列移到同步队列
      ┌─────────────┐
      │ 同步队列      │: head◄──►A(ws=SIGNAL)
      └─────────────┘
      ┌─────────────┐
      │ Condition队列│: 空
      └─────────────┘
  
  t5: 线程B释放锁 → unpark线程A
  
  t6: 线程A被唤醒，在同步队列中重新竞争锁
      → 获取成功，恢复savedState
  
  完整路径：Condition队列 ──signal──► 同步队列 ──acquireQueued──► 获取锁
```

## 五、AQS 在 Semaphore 中的应用

### 5.1 Semaphore 实现原理

Semaphore 使用 AQS 的**共享模式**。state 表示剩余许可数。

```java
// Semaphore.NonfairSync.tryAcquireShared()
// 非公平模式：直接尝试CAS减少state
int nonfairTryAcquireShared(int acquires) {
    for (;;) {
        int available = getState();
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;  // 负数=获取失败，非负=成功
    }
}

// Semaphore.FairSync.tryAcquireShared()
// 公平模式：先检查队列
int tryAcquireShared(int acquires) {
    for (;;) {
        if (hasQueuedPredecessors())  // 有排队者则不插队
            return -1;
        int available = getState();
        int remaining = available - acquires;
        if (remaining < 0 ||
            compareAndSetState(available, remaining))
            return remaining;
    }
}
```

### 5.2 Semaphore 释放许可

```java
// Semaphore.Sync.tryReleaseShared()
protected final boolean tryReleaseShared(int releases) {
    for (;;) {
        int current = getState();
        int next = current + releases;
        if (next < current) // 溢出检查
            throw new Error("Maximum permit count exceeded");
        if (compareAndSetState(current, next))
            return true;  // CAS增加state
    }
}
```

## 六、AQS 在 CountDownLatch 中的应用

CountDownLatch 使用 AQS 共享模式，state 表示剩余计数。

```java
// CountDownLatch.Sync
private static final class Sync extends AbstractQueuedSynchronizer {
    Sync(int count) {
        setState(count);  // 初始state = 计数值
    }

    // 等待：state减到0时返回1（成功）
    int tryAcquireShared(int acquires) {
        return (getState() == 0) ? 1 : -1;
    }

    // 计数减一：CAS将state减1
    boolean tryReleaseShared(int releases) {
        for (;;) {
            int c = getState();
            if (c == 0)
                return false;  // 已经到0了
            int nextc = c - 1;
            if (compareAndSetState(c, nextc))
                return nextc == 0;  // 减到0时返回true，触发唤醒
        }
    }
}

// await方法
public void await() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
    // 内部调用tryAcquireShared: state==0返回1继续执行，否则-1进入等待队列
}

// countDown方法
public void countDown() {
    sync.releaseShared(1);
    // 内部调用tryReleaseShared: state减1，减到0时唤醒所有等待线程
}
```

CountDownLatch 原理图：

```
初始：state = 3

线程main调用await()：
  state=3 ≠ 0 → 入等待队列
  
线程1调用countDown()：
  state: 3 → 2 → 返回false → 不唤醒
  
线程2调用countDown()：
  state: 2 → 1 → 返回false → 不唤醒
  
线程3调用countDown()：
  state: 1 → 0 → 返回true → 唤醒所有等待线程！

等待队列中的main线程被唤醒，继续执行
```

## 七、公平锁 vs 非公平锁对比

```
┌────────────┬─────────────────────────┬─────────────────────────┐
│   特性      │     公平锁 (Fair)        │   非公平锁 (Nonfair)     │
├────────────┼─────────────────────────┼─────────────────────────┤
│  获取顺序    │  FIFO，严格按排队顺序     │  允许插队，新线程先抢    │
├────────────┼─────────────────────────┼─────────────────────────┤
│  吞吐量     │  较低（频繁线程切换）      │  较高（减少线程切换）    │
├────────────┼─────────────────────────┼─────────────────────────┤
│  饥饿       │  不会                    │  可能（队列线程饥饿）    │
├────────────┼─────────────────────────┼─────────────────────────┤
│  实现区别    │  tryAcquire中检查         │  tryAcquire中不检查     │
│            │  hasQueuedPredecessors   │  直接CAS竞争            │
├────────────┼─────────────────────────┼─────────────────────────┤
│  适用场景    │  对响应时间敏感           │  追求吞吐量             │
│            │  需要严格顺序              │  一般场景               │
├────────────┼─────────────────────────┼─────────────────────────┤
│  默认选择    │                          │  ReentrantLock默认使用  │
└────────────┴─────────────────────────┴─────────────────────────┘
```

## 八、面试要点

### Q1: AQS 的核心设计是什么？

**A：** AQS 核心由两部分组成：
1. **volatile int state**：表示同步状态，通过 CAS 修改。不同同步工具赋予不同含义——ReentrantLock 中 0=空闲、>0=重入次数；Semaphore 中表示剩余许可；CountDownLatch 中表示剩余计数。
2. **CLH 变种队列**：一个双向链表，管理获取锁失败后等待的线程。每个 Node 封装了一个线程引用和等待状态。队列是 FIFO 的，保证公平性。

### Q2: 公平锁和非公平锁的区别？为什么默认用非公平锁？

**A：** 
- **公平锁**：tryAcquire 时先检查 `hasQueuedPredecessors()`，队列有等待者则排队，严格 FIFO。
- **非公平锁**：tryAcquire 时直接 CAS 抢锁，不管队列。
- **默认非公平的原因**：非公平锁吞吐量更高。线程释放锁后，如果恰好有新线程到来，直接获取锁，避免了唤醒队列线程的上下文切换开销。代价是队列中的线程可能"饥饿"。

### Q3: AQS 中为什么 unparkSuccessor 要从尾向前遍历？

**A：** 因为入队操作 `enq` 的顺序是：先设置 `node.prev = pred`，再 CAS 设置 tail，最后设置 `pred.next = node`。从前往后遍历可能遇到 `next` 尚未设置的情况。而 `prev` 链在 CAS 之前就已建立，是可靠的。所以从尾向前遍历能保证遍历到所有有效节点。

### Q4: Condition 的 await/signal 和 Object 的 wait/notify 有什么区别？

**A：**
1. **多条件**：一个 Lock 可以创建多个 Condition，实现多条件等待；而 Object 的 wait/notify 只有一个条件队列。
2. **精确唤醒**：可以 `conditionA.signal()` 只唤醒等待 conditionA 的线程；而 notifyAll 会唤醒所有等待线程。
3. **等待时释放锁**：两者都在等待时释放锁，被唤醒后重新竞争锁。
4. **使用方式**：Condition 必须配合 Lock 使用，且必须在持有锁的情况下调用 await/signal。

### Q5: ReentrantLock 的重入是如何实现的？

**A：** 通过 state 字段实现。tryAcquire 时检查 `current == getExclusiveOwnerThread()`，如果是持有者重入，则 `state += acquires`，不需要 CAS（因为只有持有者能操作）。tryRelease 时 `state -= releases`，直到 state=0 才完全释放锁并清除持有者。

### Q6: AQS 独占模式和共享模式的区别？

**A：**
- **独占模式**（ReentrantLock）：同一时刻只有一个线程能获取到资源。实现 `tryAcquire/tryRelease`。
- **共享模式**（Semaphore、CountDownLatch）：允许多个线程同时获取资源。实现 `tryAcquireShared/tryReleaseShared`。
- 共享模式多了"传播"机制：一个线程获取成功后，会唤醒后继节点并让其也尝试获取，形成链式唤醒。

### Q7: CountDownLatch 和 CyclicBarrier 的区别？

**A：**
- CountDownLatch 基于 AQS 共享模式，state 递减到 0 时唤醒所有等待线程。**一次性**，不可重置。
- CyclicBarrier 基于 ReentrantLock + Condition 实现，所有线程到达 barrier 后一起释放。**可重置**，可重复使用。

## 九、避坑指南

### 坑1：忘记在 finally 中释放锁

```java
// ❌ 错误：异常导致锁泄漏
lock.lock();
doSomething();  // 如果抛异常，锁永远不会释放！
lock.unlock();

// ✅ 正确：在finally中释放
lock.lock();
try {
    doSomething();
} finally {
    lock.unlock();
}
```

### 坑2：Condition 的 await/signal 没有持有锁

```java
// ❌ 错误：没有持有锁就调用await
Condition condition = lock.newCondition();
condition.await();  // 抛 IllegalMonitorStateException!

// ✅ 正确：先获取锁
lock.lock();
try {
    condition.await();
} finally {
    lock.unlock();
}
```

### 坑3：混淆 signal 和 signalAll

```java
// signal 只唤醒一个等待线程
// 如果有多个条件，可能唤醒错误的线程
// signalAll 唤醒所有等待线程

// 多条件场景下推荐用 signalAll 避免遗漏
```

### 坑4：LockSupport.park 可能被虚假唤醒

```java
// park 可能在没有 unpark 的情况下返回（虚假唤醒）
// AQS 通过自旋+条件检查来解决这个问题
// 自己使用 LockSupport 时要注意：
while (!condition) {
    LockSupport.park();
    // park返回后需要重新检查条件
}
```

## 十、总结

AQS 是 Java 并发包的基石，其核心设计精妙而简洁：

1. **state + CAS**：提供原子性的状态管理
2. **CLH 队列**：提供公平的等待队列管理
3. **模板方法模式**：AQS 定义 acquire/release 流程，子类只需实现 tryAcquire/tryRelease
4. **独占/共享双模式**：一套框架支持多种同步工具

理解 AQS 的关键路径：
- **获取锁**：tryAcquire → addWaiter → acquireQueued（自旋+park）
- **释放锁**：tryRelease → unparkSuccessor（唤醒后继）
- **Condition**：await（释放锁+入Condition队列）→ signal（移到同步队列）

掌握 AQS 后，ReentrantLock、Semaphore、CountDownLatch、ReentrantReadWriteLock 等工具的源码都可以触类旁通。
