---
title: interrupt方法对线程的影响
tag:
  - java
category:
  - java基础
author: zheng
date: 2024-12-19 14:02:00
---
在Java中，`interrupt()` 方法是 `Thread` 类中的一个实例方法，用于中断线程。它并不直接终止线程的执行，而是设置线程的中断状态（即把该线程的中断标志设为 true）。线程可以定期检查这个中断状态，以判断是否应该提前退出或改变行为。以下是 `interrupt()` 方法对线程的影响：

### 1. 中断状态
- 当调用 `thread.interrupt()` 时，如果线程正在运行，那么它的中断状态将被设置为 true。线程可以通过 `Thread.currentThread().isInterrupted()` 来检查自身的中断状态。
- 如果线程已经处于中断状态，则再次调用 `interrupt()` 不会有额外的效果。

### 2. 对阻塞方法的影响
- **等待状态**：当一个线程处于等待、睡眠或加入其他线程（如 `wait()`, `sleep()`, `join()`）等阻塞状态时，调用 `interrupt()` 会抛出 `InterruptedException` 并清除中断状态（即将中断标志重置为 false）。因此，如果你希望线程在这些状态下能够响应中断，你需要捕获 `InterruptedException` 并适当地处理它。

```java
  try {
      Thread.sleep(1000);
  } catch (InterruptedException e) {
      // 处理中断
      System.out.println("Thread was interrupted during sleep.");
      // 通常在这里可以选择退出或者重新设置中断状态
      Thread.currentThread().interrupt(); // 重新设置中断状态
  }
```

- **锁上的等待**：如果线程正在等待获取一个同步锁（例如，在进入 `synchronized` 块或调用 `Lock.lock()` 时），那么调用 `interrupt()` 不会导致 `InterruptedException` 被抛出，因为这些操作不会响应中断。但是，一旦线程获得了锁并开始执行临界区代码，它就可以检测到自己的中断状态。

### 3. 线程的正常执行
- 如果线程正在执行普通的非阻塞代码，调用 `interrupt()` 只会设置中断状态，而不会立即停止线程的执行。线程必须通过周期性地检查 `Thread.interrupted()` 或 `Thread.currentThread().isInterrupted()` 来决定如何响应中断请求。`Thread.interrupted()` 是一个静态方法，它不仅返回当前线程的中断状态，还会清除该状态；而 `Thread.currentThread().isInterrupted()` 只返回中断状态但不改变它。

### 4. 线程池中的影响
- 在使用 `ExecutorService` 等线程池时，调用 `shutdownNow()` 方法会尝试中断所有正在执行的任务，并返回尚未开始的任务列表。这有助于优雅地关闭线程池，使得正在运行的任务有机会清理资源和保存进度。

### 5. 最佳实践
- 应该尽量让线程能够响应中断，而不是简单地忽略它们。良好的做法是在适当的地方检查中断状态，并根据需要做出反应，比如干净地退出任务。
- 如果你捕获了 `InterruptedException`，你应该要么自己处理中断（比如退出任务），要么重新设置中断状态（通过调用 `Thread.currentThread().interrupt()`），以便允许调用栈上的更高层代码知道中断发生了。

### 6. 注意事项
- `interrupt()` 不是一个强制性的终止机制，它只是提供了一种合作的方式来通知线程应该停止其所做的工作。线程可以选择忽略中断请求，但这通常不是推荐的做法，因为它可能会导致资源泄漏或应用程序无法正确关闭。