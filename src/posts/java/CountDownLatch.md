---
title: CountDownLatch
author: ztq
tag:

  - java
category:
  - java基础
date: 2021-08-07 13:25:00

---

# 1、CountDownLatch简介

		CountDownLatch是一个同步辅助类，在完成一组正在其他线程中执行的操作之前，它允许一个或多个线程一直等待，直到其他线程执行完后再执行。

		类似的任务可以使用线程的  join()  方法实现：在等待时间点调用其他线程的  join()  方法，当前线程就会等待join线程执行完之后才继续执行，但 CountDownLatch 实现更加简单，并且比 join 的功能更多。

CountDownLatch函数列表

```java
CountDownLatch(int count)
构造一个用给定计数初始化的 CountDownLatch。

// 使当前线程在锁存器倒计数至零之前一直等待，除非线程被中断。
void await()
// 使当前线程在锁存器倒计数至零之前一直等待，除非线程被中断或超出了指定的等待时间。
boolean await(long timeout, TimeUnit unit)
// 递减锁存器的计数，如果计数到达零，则释放所有等待的线程。
void countDown()
// 返回当前计数。
long getCount()
// 返回标识此锁存器及其状态的字符串。
String toString()
```

CountDownLatch和CyclicBarrier的区别：

- CountDownLatch的作用是允许1或N个线程等待其他线程完成执行；而CyclicBarrier则是允许N个线程相互等待。
- CountDownLatch的计数器无法被重置；CyclicBarrier的计数器可以被重置后使用，因此它被称为是循环的barrier。

# 2、CountDownLatch使用示例

```java
package com.ztq.task;

import com.google.common.util.concurrent.ThreadFactoryBuilder;

import java.util.concurrent.*;

/**
 * @author zhengtianqi
 */
public class CountDownLatchTest {
    public static void main(String[] args) throws Exception {

        /*创建CountDownLatch实例,计数器的值初始化为3*/
        final CountDownLatch downLatch = new CountDownLatch(7);

        /*创建三个线程,每个线程等待1s,表示执行比较耗时的任务*/
        // 创建线程工厂实例
        ThreadFactory namedThreadFactory = new ThreadFactoryBuilder().setNameFormat("pool-%d").build();
        // 创建线程池，核心线程数、最大线程数、空闲保持时间、队列长度、拒绝策略可自行定义
        ExecutorService pool = new ThreadPoolExecutor(2, 20, 0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(1024), namedThreadFactory, new ThreadPoolExecutor.AbortPolicy());
        pool.execute(new MyTask("选手1到达终点", downLatch));
        pool.execute(new MyTask("选手2到达终点", downLatch));
        pool.execute(new MyTask("选手3到达终点", downLatch));
        pool.execute(new MyTask("选手4到达终点", downLatch));
        pool.execute(new MyTask("选手5到达终点", downLatch));
        pool.execute(new MyTask("选手6到达终点", downLatch));
        pool.execute(new MyTask("选手7到达终点", downLatch));

        /*主线程调用await()方法,等到其他三个线程执行完后才继续执行*/
        downLatch.await();
        System.out.println("赛跑结束");
        pool.shutdown();

    }


    static class MyTask extends Thread {
        private String name;
        private CountDownLatch downLatch;

        public MyTask(String name, CountDownLatch downLatch) {
            this.name = name;
            this.downLatch = downLatch;
        }

        @Override
        public void run() {
            try {
                Thread.sleep(1000);

            } catch (InterruptedException e) {
                e.printStackTrace();

            }
            System.out.println(name);
            /*任务完成后调用CountDownLatch的countDown()方法*/
            downLatch.countDown();
        }
    }
}

```

# 3、CountDownLatch源码分析

		分析CountDownLatch的源码我们可以知道，它是使用了一个内部同步器AQS来实现屏蔽功能的。只有当count的值为零时，同步器的tryAcquireShared的结果为1，其他时候都是-1

```java
     private static final class Sync extends AbstractQueuedSynchronizer {
        private static final long serialVersionUID = 4982264981922014374L;

        Sync(int count) {
            setState(count);
        }

        int getCount() {
            return getState();
        }

        protected int tryAcquireShared(int acquires) {
            return (getState() == 0) ? 1 : -1;
        }

        protected boolean tryReleaseShared(int releases) {
            // Decrement count; signal when transition to zero
            for (;;) {
                int c = getState();
                if (c == 0)
                    return false;
                int nextc = c-1;
                if (compareAndSetState(c, nextc))
                    return nextc == 0;
            }
        }
    }
    public CountDownLatch(int count) {
        if (count < 0) throw new IllegalArgumentException("count < 0");
        this.sync = new Sync(count);
    }

```

# 四、CountDownLatch 的不足

CountDownLatch是一次性的，不可能重新初始化或者修改其内部计数器的值，当CountDownLatch使用完毕后，它不能再次被使用

# 五、CountDownLatch与CyclicBarrier区别

countDownLatch：
计数器：计数器只能使用一次。
等待：一个线程或多个等待另外n个线程完成之后才能执行。

CyclicBarrier：
计数器：计数器可以重置(通过reset()方法)。
等待：n个线程相互等待，任何一个线程完成之前，所有的线程都必须等待。
