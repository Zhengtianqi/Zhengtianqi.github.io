---
title: Java 线程池深度源码解析：Worker 生命周期与拒绝策略
tag: ["Java", "并发编程", "线程池", "源码解析"]
category: 基础知识
date: 2026-07-03
---

# Java 线程池深度源码解析：Worker 生命周期与拒绝策略

> ThreadPoolExecutor 是 Java 线程池的核心实现，几乎所有异步任务调度都建立在它之上。理解线程池的内部机制，对于写出高效、稳定的并发程序至关重要。本文将从核心字段到 execute 流程，从 Worker 生命周期到拒绝策略，逐层剖析线程池的源码实现。

## 一、核心字段解析

### 1.1 ctl：线程池状态与工作线程数

ThreadPoolExecutor 使用一个 AtomicInteger `ctl` 同时编码两个信息：线程池状态（高3位）和工作线程数（低29位）。

```java
public class ThreadPoolExecutor extends AbstractExecutorService {

    // ctl = 线程池状态(高3位) + 工作线程数(低29位)
    private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));

    // COUNT_BITS = 29（Integer.SIZE - 3）
    private static final int COUNT_BITS = Integer.SIZE - 3;

    // CAPACITY = (1 << 29) - 1 = 536870911（最大线程数）
    private static final int CAPACITY   = (1 << COUNT_BITS) - 1;

    // 线程池状态（存储在ctl的高3位）
    // 111: RUNNING    （接受新任务，处理队列任务）
    private static final int RUNNING    = -1 << COUNT_BITS;
    // 000: SHUTDOWN   （不接受新任务，处理队列任务）
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    // 001: STOP       （不接受新任务，丢弃队列任务，中断进行中任务）
    private static final int STOP       =  1 << COUNT_BITS;
    // 010: TIDYING    （所有任务终止，workerCount=0，即将执行terminated()）
    private static final int TIDYING    =  2 << COUNT_BITS;
    // 011: TERMINATED （terminated()执行完毕）

    // 从ctl中获取状态和线程数
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    private static int workerCountOf(int c)  { return c & CAPACITY; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
}
```

### 1.2 状态转换图

```
┌──────────────────────────────────────────────────────────────────┐
│                    线程池状态转换                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐  shutdown()   ┌──────────┐  队列空+workerCount=0   │
│   │RUNNING  │─────────────►│ SHUTDOWN  │──────────────────────►  │
│   │ 111     │              │ 000      │                         │
│   └─────────┘              └──────────┘                         │
│        │                        │                               │
│        │ shutdownNow()          │ shutdownNow()                 │
│        │                        │                               │
│        ▼                        ▼                               │
│   ┌─────────┐              ┌──────────┐                         │
│   │  STOP   │─────────────►│ TIDYING  │                         │
│   │ 001     │ 队列清空+    │ 010      │                         │
│   └─────────┘ workerCount=0└────┬─────┘                         │
│                                │                               │
│                                │ terminated()执行完成           │
│                                ▼                               │
│                           ┌──────────┐                         │
│                           │TERMINATED│                         │
│                           │ 011      │                         │
│                           └──────────┘                         │
│                                                                  │
│  状态数值比较：RUNNING < SHUTDOWN < STOP < TIDYING < TERMINATED  │
│  可以用 < 比较判断状态：                                          │
│    isRunning: c < SHUTDOWN                                       │
│    isAtLeastShutdown: c >= SHUTDOWN                              │
│    isAtLeastStop: c >= STOP                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 其他核心字段

```java
// 工作队列：存储等待执行的任务
private final BlockingQueue<Runnable> workQueue;

// 工作线程集合：存储所有Worker
private final HashSet<Worker> workers = new HashSet<Worker>();

// 线程工厂：用于创建新线程
private volatile ThreadFactory threadFactory;

// 拒绝策略：任务无法执行时的处理方式
private volatile RejectedExecutionHandler handler;

// 核心线程数：即使空闲也保留的线程数
private volatile int corePoolSize;

// 最大线程数：线程池允许的最大线程数
private volatile int maximumPoolSize;

// 空闲线程存活时间：超过corePoolSize的空闲线程的存活时间
private volatile long keepAliveTime;

// 是否允许核心线程超时退出
private volatile boolean allowCoreThreadTimeOut;

// 已完成任务数
private long completedTaskCount;
```

## 二、execute 流程源码剖析

### 2.1 execute 方法

```java
public void execute(Runnable command) {
    if (command == null)
        throw new NullPointerException();

    int c = ctl.get();

    // ① 工作线程数 < corePoolSize → 创建核心线程
    if (workerCountOf(c) < corePoolSize) {
        if (addWorker(command, true))  // true表示核心线程
            return;
        c = ctl.get();  // CAS失败，重新获取ctl
    }

    // ② 线程数 >= corePoolSize → 尝试入队列
    if (isRunning(c) && workQueue.offer(command)) {
        int recheck = ctl.get();  // 双重检查
        // 如果线程池不再运行，移除任务并执行拒绝策略
        if (!isRunning(recheck) && remove(command))
            reject(command);
        // 如果工作线程数为0（可能核心线程被回收），创建一个非核心线程
        else if (workerCountOf(recheck) == 0)
            addWorker(null, false);  // null任务，只是为了创建线程消费队列
    }

    // ③ 队列满 → 尝试创建非核心线程（直到maximumPoolSize）
    else if (!addWorker(command, false))
        // ④ 线程数 >= maximumPoolSize → 执行拒绝策略
        reject(command);
}
```

### 2.2 execute 流程图

```
┌──────────────────────────────────────────────────────────────┐
│                    execute(command)                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────────┐
              │ workerCount < corePoolSize?│
              └─────────┬─────────────────┘
                   是│         │否
                    ▼         │
         ┌──────────────┐    │
         │ addWorker    │    │
         │ (core=true)  │    │
         └──────┬───────┘    │
                │            │
           成功 │  失败       │
            ┌───┘    │       │
         return      ▼       │
                ┌────────────┴───┐
                │ isRunning &&   │
                │ workQueue.offer│
                └───────┬────────┘
                   是│       │否
                    ▼       ▼
           ┌──────────┐  ┌──────────────┐
           │双重检查   │  │ addWorker    │
           │入队成功   │  │ (core=false) │
           └────┬─────┘  └──────┬───────┘
                │               │
        ┌───────┴──────┐   成功 │  失败
   !running│     running │  ┌───┘    │
        ▼         ▼     │  return   ▼
   ┌────────┐ ┌──────┐  │      ┌──────────┐
   │remove  │ │worker│  │      │ reject() │
   │+reject │ │Count=│  │      │ 拒绝策略  │
   └────────┘ │  0?   │  │      └──────────┘
              └───┬──┘  │
              是│   否│  │
               ▼     ▼  │
          ┌────────┐    │
          │addWorker│   │
          │(null,   │   │
          │false)   │   │
          └────────┘   │
                       │
                       ▼
                   任务入队
                   等待执行

  核心流程：
  1. 核心线程未满 → 创建核心线程执行
  2. 核心线程满 → 入队等待
  3. 队列满 → 创建非核心线程执行
  4. 最大线程满 → 拒绝
```

### 2.3 addWorker：创建工作线程

```java
private boolean addWorker(Runnable firstTask, boolean core) {
    retry:
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);

        // 检查线程池状态是否允许创建新Worker
        if (rs >= SHUTDOWN &&
            !(rs == SHUTDOWN &&    // SHUTDOWN状态下允许创建Worker来处理队列
              firstTask == null &&  // 但不能有firstTask（只能消费队列）
              !workQueue.isEmpty()))
            return false;

        for (;;) {
            int wc = workerCountOf(c);
            // 线程数检查
            if (wc >= CAPACITY ||
                wc >= (core ? corePoolSize : maximumPoolSize))
                return false;
            // CAS增加workerCount
            if (compareAndIncrementWorkerCount(c))
                break retry;
            c = ctl.get();  // CAS失败重新获取
            if (runStateOf(c) != rs)
                continue retry;  // 状态变了，重新检查
        }
    }

    // workerCount已增加，开始创建Worker
    boolean workerStarted = false;
    boolean workerAdded = false;
    Worker w = null;
    try {
        // 创建Worker（内部创建线程）
        w = new Worker(firstTask);
        final Thread t = w.thread;
        if (t != null) {
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();  // 加锁保护workers集合
            try {
                int rs = runStateOf(ctl.get());
                // 再次检查状态
                if (rs < SHUTDOWN ||
                    (rs == SHUTDOWN && firstTask == null)) {
                    if (t.isAlive())
                        throw new IllegalThreadStateException();
                    workers.add(w);  // 加入workers集合
                    workerAdded = true;
                }
            } finally {
                mainLock.unlock();
            }
            if (workerAdded) {
                t.start();  // 启动线程！
                workerStarted = true;
            }
        }
    } finally {
        if (!workerStarted)
            addWorkerFailed(w);  // 失败处理
    }
    return workerStarted;
}
```

## 三、Worker：线程池的工作单元

### 3.1 Worker 类结构

```java
private final class Worker
    extends AbstractQueuedSynchronizer  // 继承AQS实现独占锁
    implements Runnable
{
    // Worker对应的线程
    final Thread thread;
    // 初始任务（可能为null）
    Runnable firstTask;
    // 已完成任务数
    volatile long completedTasks;

    Worker(Runnable firstTask) {
        // 初始化AQS状态为-1，表示禁止中断
        // 直到runWorker开始执行时才允许中断
        setState(-1);
        this.firstTask = firstTask;
        this.thread = getThreadFactory().newThread(this);  // 创建线程
    }

    // Worker本身是Runnable，线程启动后执行此方法
    public void run() {
        runWorker(this);
    }

    // ★ AQS实现：不可重入的独占锁
    protected boolean tryAcquire(int unused) {
        // CAS将state从0改为1
        if (compareAndSetState(0, 1)) {
            setExclusiveOwnerThread(Thread.currentThread());
            return true;
        }
        return false;
    }

    protected boolean tryRelease(int unused) {
        setExclusiveOwnerThread(null);
        setState(0);
        return true;
    }

    // 不可重入！tryAcquire不检查当前线程是否持有锁
    // 这确保了shutdown时可以通过tryLock判断Worker是否空闲
}
```

### 3.2 Worker 继承 AQS 的原因

```
┌──────────────────────────────────────────────────────────────┐
│              Worker 继承 AQS 的设计意图                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 实现不可重入的独占锁                                      │
│     → 任务执行前lock()，执行后unlock()                        │
│     → shutdown()可以通过tryLock()判断Worker是否在执行任务      │
│        如果tryLock成功：说明Worker空闲，可以中断               │
│        如果tryLock失败：说明Worker正在执行任务                 │
│                                                              │
│  2. 为什么不用ReentrantLock？                                 │
│     → ReentrantLock是可重入的                                │
│     → 如果任务代码中再次获取锁（重入），tryLock会成功          │
│     → 这会导致shutdown误判正在执行任务的Worker为空闲          │
│     → 不可重入锁避免了这个问题                                │
│                                                              │
│  3. 初始state=-1的作用                                       │
│     → Worker构造时setState(-1)                               │
│     → 在runWorker调用beforeWorkerThread之前，不响应interrupt   │
│     → 防止Worker刚创建还未运行就被中断                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Worker 生命周期图

```
Worker 生命周期：
═══════════════════════════════════════════

┌─────────────┐
│  创建Worker  │ addWorker()
│  state=-1   │ new Worker(firstTask)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  线程启动    │ thread.start()
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  runWorker  │ 
│  循环获取任务│◄─────────────────────────┐
│             │                           │
│  ① lock()   │ state: -1 → 0 → 1        │
│  ② 获取task  │                           │
│  ③ 执行task  │                           │
│  ④ unlock()  │ state: 1 → 0             │
│             │                           │
│  ⑤ 获取下一个│                           │
│     task    │                           │
└──────┬──────┘                           │
       │ 获取到任务                          │
       └───────────────────────────────────┘
       │ 获取不到任务（超时/队列空/池停止）
       ▼
┌─────────────┐
│  processWorkerExit                          │
│  从workers移除                              │
│  CAS减少workerCount                         │
│  尝试终止线程池（tryTerminate）              │
└─────────────┘
```

## 四、runWorker：任务执行循环

### 4.1 runWorker 源码

```java
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask;
    w.firstTask = null;
    w.unlock();  // 将state从-1重置为0，允许中断

    boolean completedAbruptly = true;
    try {
        // 循环获取任务：firstTask || getTask()
        while (task != null || (task = getTask()) != null) {
            w.lock();  // 加锁，表示Worker正在执行任务
            // 检查线程池状态，必要时中断当前线程
            if ((runStateAtLeast(ctl.get(), STOP) ||
                 (Thread.interrupted() &&
                  runStateAtLeast(ctl.get(), STOP))) &&
                !wt.isInterrupted())
                wt.interrupt();

            try {
                beforeExecute(wt, task);  // 前置钩子
                Throwable thrown = null;
                try {
                    task.run();  // ★ 执行任务
                } catch (RuntimeException x) {
                    thrown = x; throw x;
                } catch (Error x) {
                    thrown = x; throw x;
                } catch (Throwable x) {
                    thrown = x;
                    throw new Error(x);
                } finally {
                    afterExecute(task, thrown);  // 后置钩子
                }
            } finally {
                task = null;  // 清理task引用
                w.completedTasks++;  // 完成计数
                w.unlock();  // 解锁
            }
        }
        completedAbruptly = false;
    } finally {
        // Worker退出处理
        processWorkerExit(w, completedAbruptly);
    }
}
```

### 4.2 getTask：获取任务

```java
private Runnable getTask() {
    boolean timedOut = false;

    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);

        // 检查线程池状态
        if (rs >= SHUTDOWN && (rs >= STOP || workQueue.isEmpty())) {
            decrementWorkerCount();  // 减少workerCount
            return null;  // 返回null → Worker退出
        }

        int wc = workerCountOf(c);
        // 是否需要超时控制
        boolean timed = allowCoreThreadTimeOut || wc > corePoolSize;

        // 线程数超过maximumPoolSize（可能被setMaximumPoolSize调整）→ 退出
        // 或者超时且队列空 → 退出
        if ((wc > maximumPoolSize || (timed && timedOut))
            && (wc > 1 || workQueue.isEmpty())) {
            if (compareAndDecrementWorkerCount(c))
                return null;  // CAS减少workerCount，返回null
            continue;  // CAS失败重试
        }

        try {
            Runnable r;
            if (timed)
                // 超时获取：poll最多等keepAliveTime
                r = workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS);
            else
                // 非超时获取：take阻塞直到有任务
                r = workQueue.take();
            if (r != null)
                return r;
            timedOut = true;  // poll超时返回null
        } catch (InterruptedException retry) {
            timedOut = false;  // 被中断，重试
        }
    }
}
```

### 4.3 getTask 流程图

```
┌──────────────────────────────────────────────────────────────┐
│                       getTask()                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────────┐
              │ 检查线程池状态              │
              │ rs >= SHUTDOWN?           │
              └─────────┬─────────────────┘
                   是│         │否
                    ▼         │
         ┌──────────────┐    │
         │ SHUTDOWN &&  │    │
         │ 队列空?      │    │
         │  或 STOP?    │    │
         └───┬──────┬───┘    │
            是│     否│       │
             ▼      └────────┘
        ┌────────┐
        │return  │
        │ null   │
        │Worker  │
        │退出    │
        └────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ timed = allowCoreThread │
         │ TimeOut || wc > core   │
         └───────────┬────────────┘
                │
        ┌───────┴───────┐
    timed│              │!timed
        ▼               ▼
  ┌──────────┐    ┌──────────┐
  │ poll     │    │ take     │
  │ (超时获取)│    │ (阻塞获取)│
  └────┬─────┘    └────┬─────┘
       │               │
       │               │
  ┌────┴────┐     获取到任务
  获取到任务│      return r
  return r │
  超时null │
       │   │
       ▼   ▼
  ┌──────────┐
  │ timedOut │
  │ = true   │
  └────┬─────┘
       │
       ▼
  ┌──────────────────┐
  │ wc>1 || 队列空?  │
  │ CAS减workerCount │
  └────────┬─────────┘
           │
           ▼
       return null
       Worker退出
```

### 4.4 processWorkerExit：Worker 退出处理

```java
private void processWorkerExit(Worker w, boolean completedAbruptly) {
    // 如果是异常退出（task.run抛异常），需要手动减少workerCount
    if (completedAbruptly)
        decrementWorkerCount();

    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        completedTaskCount += w.completedTasks;  // 累加完成任务数
        workers.remove(w);  // 从workers集合移除
    } finally {
        mainLock.unlock();
    }

    tryTerminate();  // 尝试终止线程池

    // 检查是否需要补充Worker
    int c = ctl.get();
    if (runStateLessThan(c, STOP)) {
        if (!completedAbruptly) {
            // 正常退出：根据需要补充
            int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
            if (min == 0 && !workQueue.isEmpty())
                min = 1;
            if (workerCountOf(c) >= min)
                return;  // 线程数足够，不需要补充
        }
        // 异常退出 或 线程数不足 → 创建新Worker
        addWorker(null, false);
    }
}
```

## 五、shutdown vs shutdownNow

### 5.1 shutdown：优雅关闭

```java
public void shutdown() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();  // 安全检查
        advanceRunState(SHUTDOWN);  // CAS将状态改为SHUTDOWN
        interruptIdleWorkers();  // 中断空闲Worker
        onShutdown();  // 钩子方法（ScheduledThreadPoolExecutor有实现）
    } finally {
        mainLock.unlock();
    }
    tryTerminate();  // 尝试终止
}

// 中断空闲Worker：通过tryLock判断是否空闲
private void interruptIdleWorkers() {
    interruptIdleWorkers(false);
}

private void interruptIdleWorkers(boolean onlyOne) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (Worker w : workers) {
            Thread t = w.thread;
            if (!t.isInterrupted() && w.tryLock()) {
                // tryLock成功 → Worker空闲（没在执行任务）
                try {
                    t.interrupt();  // 中断空闲Worker
                } catch (SecurityException ignore) {
                } finally {
                    w.unlock();
                }
            }
            if (onlyOne)
                break;
        }
    } finally {
        mainLock.unlock();
    }
}
```

### 5.2 shutdownNow：强制关闭

```java
public List<Runnable> shutdownNow() {
    List<Runnable> tasks;
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        checkShutdownAccess();
        advanceRunState(STOP);  // 状态改为STOP
        interruptWorkers();    // 中断所有Worker（不管是否空闲）
        tasks = drainQueue();  // 取出队列中所有任务
    } finally {
        mainLock.unlock();
    }
    tryTerminate();
    return tasks;  // 返回未执行的任务列表
}

// 中断所有Worker
private void interruptWorkers() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
        for (Worker w : workers) {
            Thread t = w.thread;
            if (!t.isInterrupted())
                t.interrupt();  // 直接中断，不判断是否空闲
        }
    } finally {
        mainLock.unlock();
    }
}
```

### 5.3 对比表

```
┌────────────────┬──────────────────────┬──────────────────────┐
│     特性        │     shutdown()       │     shutdownNow()    │
├────────────────┼──────────────────────┼──────────────────────┤
│  状态          │  SHUTDOWN            │  STOP                │
├────────────────┼──────────────────────┼──────────────────────┤
│  新任务        │  拒绝（执行拒绝策略）  │  拒绝（执行拒绝策略）  │
├────────────────┼──────────────────────┼──────────────────────┤
│  队列任务      │  继续执行             │  丢弃（drainQueue返回）│
├────────────────┼──────────────────────┼──────────────────────┤
│  正在执行的任务 │  等待执行完成         │  尝试中断（interrupt） │
├────────────────┼──────────────────────┼──────────────────────┤
│  空闲Worker    │  中断（tryLock判断）  │  中断（不判断）       │
├────────────────┼──────────────────────┼──────────────────────┤
│  返回值        │  void                │  List<Runnable>      │
│                │                      │  （未执行的任务）     │
├────────────────┼──────────────────────┼──────────────────────┤
│  适用场景      │  优雅关闭             │  紧急关闭             │
└────────────────┴──────────────────────┴──────────────────────┘
```

## 六、拒绝策略

### 6.1 四种内置拒绝策略

```java
// ① AbortPolicy（默认）：抛出异常
public static class AbortPolicy implements RejectedExecutionHandler {
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        throw new RejectedExecutionException(
            "Task " + r.toString() + " rejected from " + e.toString());
    }
}

// ② CallerRunsPolicy：由提交任务的线程执行
public static class CallerRunsPolicy implements RejectedExecutionHandler {
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            r.run();  // ★ 在调用者线程中直接执行
        }
    }
}

// ③ DiscardPolicy：直接丢弃，不抛异常
public static class DiscardPolicy implements RejectedExecutionHandler {
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        // 什么都不做，任务被静默丢弃
    }
}

// ④ DiscardOldestPolicy：丢弃队列最老的任务，重新提交当前任务
public static class DiscardOldestPolicy implements RejectedExecutionHandler {
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        if (!e.isShutdown()) {
            e.getQueue().poll();  // 丢弃队列头部（最老的任务）
            e.execute(r);         // 重新提交当前任务
        }
    }
}
```

### 6.2 拒绝策略选择图

```
┌──────────────────────────────────────────────────────────────┐
│                    拒绝策略选择指南                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  场景1：不能丢失任务，需要知道任务被拒绝                       │
│    → AbortPolicy（默认）                                     │
│    → 捕获RejectedExecutionException，记录日志/重试           │
│                                                              │
│  场景2：任务不重要，可以丢弃                                  │
│    → DiscardPolicy                                           │
│    → 建议加上监控告警，避免大量丢弃                           │
│                                                              │
│  场景3：新任务优先级高于老任务                                │
│    → DiscardOldestPolicy                                     │
│    → 注意：如果队列是PriorityBlockingQueue可能不适用          │
│                                                              │
│  场景4：需要降低提交速度（反压）                              │
│    → CallerRunsPolicy                                        │
│    → 提交线程自己执行，自然减速                               │
│    → 同时不丢弃任务                                          │
│                                                              │
│  场景5：需要自定义处理（持久化、告警等）                       │
│    → 实现RejectedExecutionHandler接口                       │
│    → 例如：写入MQ、写入数据库、重试等                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 自定义拒绝策略

```java
// 自定义拒绝策略：记录日志 + 持久化到数据库
public class PersistAndLogPolicy implements RejectedExecutionHandler {
    
    private final TaskRepository taskRepo;
    private final MeterRegistry metrics;

    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
        // 1. 记录监控指标
        metrics.counter("threadpool.rejected", "pool", 
            executor.toString()).increment();
        
        // 2. 记录日志
        log.warn("任务被拒绝, pool={}, activeCount={}, queueSize={}",
            executor, executor.getActiveCount(), 
            executor.getQueue().size());
        
        // 3. 如果是可序列化任务，持久化到数据库
        if (r instanceof Serializable) {
            try {
                taskRepo.save((Serializable) r);
                log.info("任务已持久化，稍后重试");
                return;
            } catch (Exception e) {
                log.error("任务持久化失败", e);
            }
        }
        
        // 4. 持久化失败 → 抛异常
        throw new RejectedExecutionException(
            "任务被拒绝且持久化失败: " + r);
    }
}
```

## 七、线程池监控

### 7.1 关键监控指标

```java
ThreadPoolExecutor pool = (ThreadPoolExecutor) executor;

// 1. 当前线程数
int poolSize = pool.getPoolSize();

// 2. 活跃线程数（正在执行任务的线程数）
int activeCount = pool.getActiveCount();

// 3. 核心线程数
int corePoolSize = pool.getCorePoolSize();

// 4. 最大线程数
int maxPoolSize = pool.getMaximumPoolSize();

// 5. 队列积压
int queueSize = pool.getQueue().size();
int queueRemaining = pool.getQueue().remainingCapacity();

// 6. 已完成任务数
long completed = pool.getCompletedTaskCount();

// 7. 任务总量（包括队列中的）
long taskCount = pool.getTaskCount();

// 8. 拒绝次数（需要自定义拒绝策略统计）
// 通过自定义RejectedExecutionHandler统计
```

### 7.2 动态调参

```java
// ThreadPoolExecutor支持运行时调整参数
pool.setCorePoolSize(newCore);      // 调整核心线程数
pool.setMaximumPoolSize(newMax);    // 调整最大线程数
pool.setKeepAliveTime(time, unit);  // 调整空闲时间
pool.setRejectedExecutionHandler(newHandler);  // 更换拒绝策略

// ★ setCorePoolSize的动态效果：
// 如果newCore > oldCore：创建新Worker消费队列
// 如果newCore < oldCore：多余空闲Worker会在下次getTask时退出
```

## 八、面试要点

### Q1: 线程池的 execute 流程是什么？

**A：** 
1. 工作线程数 < corePoolSize → 创建核心线程执行任务（addWorker(core=true)）
2. 线程数 >= corePoolSize → 任务入队列（workQueue.offer）
3. 队列满 → 创建非核心线程执行（addWorker(core=false)）
4. 线程数 >= maximumPoolSize → 执行拒绝策略

口诀：**核心线程 → 队列 → 非核心线程 → 拒绝**。

### Q2: Worker 为什么继承 AQS 而不是 ReentrantLock？

**A：** Worker 需要一个**不可重入**的独占锁来判断 Worker 是否正在执行任务。任务执行前 `lock()`，执行后 `unlock()`。shutdown 时通过 `tryLock()` 判断：成功说明空闲可以中断，失败说明正在执行。如果用 ReentrantLock（可重入），任务代码中如果再次获取锁，`tryLock` 会误判为空闲。

### Q3: shutdown 和 shutdownNow 的区别？

**A：**
- `shutdown`：状态改为 SHUTDOWN，不再接受新任务，但继续执行队列中的任务，只中断空闲 Worker（通过 tryLock 判断）。
- `shutdownNow`：状态改为 STOP，不再接受新任务，丢弃队列任务，中断所有 Worker（包括正在执行的），返回队列中未执行的任务列表。

### Q4: 核心线程会被回收吗？

**A：** 默认不会。但通过 `allowCoreThreadTimeOut(true)` 可以让核心线程在空闲超过 `keepAliveTime` 后自动退出。getTask 方法中 `timed = allowCoreThreadTimeOut || wc > corePoolSize`，如果 `timed` 为 true，使用 `poll(keepAliveTime)` 获取任务，超时返回 null 导致 Worker 退出。

### Q5: 线程池如何保证 workers 集合的线程安全？

**A：** `workers` 是普通 HashSet，不是并发集合。对 workers 的所有操作（add、remove、遍历）都在 `mainLock`（ReentrantLock）保护下进行。这保证了 workers 集合的修改不会出现并发问题。

### Q6: 如何选择线程池参数？

**A：**
- **CPU 密集型**：corePoolSize = N+1（N=CPU核心数），队列可选较小的 LinkedBlockingQueue
- **IO 密集型**：corePoolSize = 2N+1 或更多，队列可选较大的 LinkedBlockingQueue
- **混合型**：根据IO/CPU比例估算，或拆分为两个线程池
- **队列**：有界队列（如 ArrayBlockingQueue）防止 OOM
- **拒绝策略**：CallerRunsPolicy 提供反压，AbortPolicy 提供告警

### Q7: Executors 提供的线程池为什么不推荐使用？

**A：**
- `newFixedThreadPool` 和 `newSingleThreadExecutor`：使用无界队列 `LinkedBlockingQueue`，可能堆积大量任务导致 OOM
- `newCachedThreadPool`：maximumPoolSize = Integer.MAX_VALUE，可能创建大量线程导致 OOM
- `newScheduledThreadPool`：同样使用无界队列
推荐直接用 `new ThreadPoolExecutor(...)` 显式指定所有参数。

## 九、避坑指南

### 坑1：使用无界队列

```java
// ❌ 无界队列：任务无限堆积导致OOM
new ThreadPoolExecutor(4, 8, 60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>());  // 默认Integer.MAX_VALUE容量！

// ✅ 有界队列
new ThreadPoolExecutor(4, 8, 60, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000));  // 明确限制队列大小
```

### 坑2：任务异常导致 Worker 退出

```java
// ❌ 任务抛出未捕获异常 → Worker退出 → 线程数减少
executor.submit(() -> {
    throw new RuntimeException("任务异常");
    // submit会捕获异常存入Future，但如果用execute()就会导致Worker退出
});

// ✅ 任务内部try-catch
executor.execute(() -> {
    try {
        riskyTask();
    } catch (Exception e) {
        log.error("任务执行失败", e);
        // 不要抛出！
    }
});

// ✅ 或者重写afterExecute处理异常
```

### 坑3：忘记关闭线程池

```java
// ❌ 线程池不关闭 → 线程泄漏，JVM无法退出
ExecutorService executor = Executors.newFixedThreadPool(4);
// ...使用后忘记shutdown...

// ✅ 正确关闭
ExecutorService executor = new ThreadPoolExecutor(...);
try {
    // 使用线程池
    executor.submit(task1);
    executor.submit(task2);
} finally {
    executor.shutdown();  // 优雅关闭
    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
        executor.shutdownNow();  // 超时后强制关闭
    }
}
```

### 坑4：submit 和 execute 混淆

```java
// execute：任务异常直接抛出，导致Worker退出
executor.execute(() -> { throw new RuntimeException(); });

// submit：任务异常被封装在Future中，Worker不会退出
Future<?> future = executor.submit(() -> { throw new RuntimeException(); });
try {
    future.get();  // 这里才会抛出ExecutionException
} catch (ExecutionException e) {
    // 获取原始异常
}
```

## 十、总结

ThreadPoolExecutor 的设计精髓在于：

1. **ctl 的巧妙设计**：一个 AtomicInteger 编码状态+线程数，CAS 原子更新
2. **三层任务处理**：核心线程 → 队列 → 非核心线程 → 拒绝
3. **Worker 继承 AQS**：不可重入锁精确判断 Worker 状态
4. **getTask 的阻塞获取**：take（阻塞）或 poll（超时），实现线程的弹性伸缩
5. **shutdown 的优雅设计**：tryLock 区分空闲和忙碌 Worker
6. **拒绝策略的可插拔**：四种内置策略 + 自定义扩展

关键理解路径：
- **提交任务**：execute → addWorker → Worker.run → runWorker → getTask
- **Worker 退出**：getTask 返回 null → processWorkerExit → tryTerminate
- **关闭线程池**：shutdown → interruptIdleWorkers → 各 Worker 退出 → terminated
