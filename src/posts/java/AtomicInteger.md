---
title: AtomicInteger
author: ztq
tag:

  - java基础
category:
  - 面试
date: 2020-07-24 15:52:00

---

# 1、介绍		

AtomicInteger属于JUC并发包下的原子类，继承关系如下：

```java
public class AtomicInteger extends Number implements java.io.Serializable
```

java 的并发机制中有三个特性：原子性、可见性和有序性。

synchronized可以保证可见性、有序性，无法保证原子性，AtomicInteger作用是保证原子性。

# 2、先看一个例子：

```java
package cn.edu.bjut;

import com.google.common.util.concurrent.ThreadFactoryBuilder;
import java.util.concurrent.*;

public class Main {
    private static volatile int a = 1;

    public static void main(String[] args) {
        // 创建线程工厂实例
        ThreadFactory namedThreadFactory = new ThreadFactoryBuilder().setNameFormat("demo-pool-%d").build();
        // 创建线程池，核心线程数、最大线程数、空闲保持时间、队列长度、拒绝策略可自行定义
        ExecutorService pool = new ThreadPoolExecutor(5, 50, 0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(1024), namedThreadFactory, new ThreadPoolExecutor.AbortPolicy());
        // 
        for (int i = 0; i < 5; i++) {
            pool.submit(() -> {
                try {
                	System.out.println(a++);
                	Thread.sleep(500);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
            });
        }
        System.out.println(a);
    }
}
```

结果：

```java
1
4
4
3
5
2
```

定义变量a，保证a的可见性。用5个线程分别a++，但是结果不是5，每次都有不同的结果，且最后结果不是5，因为：

（1）每个线程从内存中读取a的值

（2）对a进行+1操作

（3）把a重新刷新回内存

当CPU切换分片  或者   第三步（3）线程未刷新回内存，此时我们线程就读相当于脏数据。

# 3、再看一个例子：

```java
package cn.edu.bjut;


import com.google.common.util.concurrent.ThreadFactoryBuilder;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    private static AtomicInteger a = new AtomicInteger();

    public static void main(String[] args) {
        // 创建线程工厂实例
        ThreadFactory namedThreadFactory = new ThreadFactoryBuilder().setNameFormat("demo-pool-%d").build();
        // 创建线程池，核心线程数、最大线程数、空闲保持时间、队列长度、拒绝策略可自行定义
        ExecutorService pool = new ThreadPoolExecutor(5, 50, 0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(1024), namedThreadFactory, new ThreadPoolExecutor.AbortPolicy());
        // 
        for (int i = 0; i < 5; i++) {
            pool.submit(() -> {
                try {
                		System.out.println(a.incrementAndGet());
                		Thread.sleep(500);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
            });
        }
		System.out.println(a);
    }
}

```

结果：

```java
2
4
1
3
5
5
```

利用AtomicInteger定义变量a，保证a的原子性。用5个线程分别a++，但是结果不是5，每次都有不同的结果，但是最后结果是5，因为：

# 4、AtomicInteger如何保证原子性

## （1）、源码分析

AtomicInteger使用了incrementAndGet函数（类中还有很多个API都是利用相同的方式保证原子性）

```java
    private static final Unsafe U = Unsafe.getUnsafe();
    private static final long VALUE = U.objectFieldOffset(AtomicInteger.class, "value");

    private volatile int value;

	/**
     * 以原子方式递增当前值,
     *
     * 相当于addAndGet(1)
     *
     * @return 更新的值
     */
    public final int incrementAndGet() {
        return U.getAndAddInt(this, VALUE, 1) + 1;
    }
```

底层使用的是unsafe的getAndAddInt方法，对象 U 和 参数 VALUE

### （1）U

```java
private static final Unsafe U = Unsafe.getUnsafe();
```

利用的是compareAndSwapInt，又称CAS，即比较并替换，实现并发算法时常用到的一种技术。

CAS操作包含三个操作数：内存位置、预期原值及新值。

执行CAS操作的时候，将内存位置的值与预期原值比较，如果相匹配，那么处理器会自动将该位置值更新为新值，否则，处理器不做任何操作。

Unsafe类使Java语言拥有了类似C语言指针一样操作内存空间的能力，这无疑也增加了程序发生相关指针问题的风险。在程序中过度、不正确使用Unsafe类会使得程序出错的概率变大，使得Java这种安全的语言变得不再“安全”，因此对Unsafe的使用一定要慎重。在jdk1.9中，对Usafe进行了删除。

### （2）VALUE

```java
 private static final long VALUE = U.objectFieldOffset(AtomicInteger.class, "value");
```

VALUE是 long 类型的，代表的含义就是对象的地址的偏移量。

```java
U.getAndAddInt(this, VALUE, 1) + 1;
```

U 通过 getAndAddInt()  方法，对原先对象的地址进行了加 1 操作，得到一个最新的值，然后+1；

那么怎么保证 getAndAddInt() 方法是最新的值呢？

```java
@HotSpotIntrinsicCandidate
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        v = getIntVolatile(o, offset);
    } while (!weakCompareAndSetInt(o, offset, v, v + delta));
    return v;
}
```

底层通过 weakCompareAndSetInt 这个CAS机制来完成的增加操作：

param1：o 是当前对象

param2：offset 表示内存地址的偏移量

param3：v + delta 表示要增加的值

AtomicInteger的原理就是这，主要是通过Usafe的方式来完成的。Usafe又是通过CAS机制来实现的。

CAS算法是乐观锁的一种，Java原子类中的递增操作就通过CAS自旋实现的。



## （2）、源码注释

```java
package java.util.concurrent.atomic;

import java.lang.invoke.VarHandle;
import java.util.function.IntBinaryOperator;
import java.util.function.IntUnaryOperator;
import jdk.internal.misc.Unsafe;

/**
 * 一个int值，可以进行原子更新
 */
public class AtomicInteger extends Number implements java.io.Serializable {
    private static final long serialVersionUID = 6214790243416807050L;

    /*
     * 该类打算使用VarHandles实现，但存在未解析的循环启动依赖项。
     */
    private static final Unsafe U = Unsafe.getUnsafe();
    private static final long VALUE
        = U.objectFieldOffset(AtomicInteger.class, "value");

    private volatile int value;

    /**
     * 构造函数，使用给定的初始值创建新的AtomicInteger
     *
     * @param initialValue the initial value
     */
    public AtomicInteger(int initialValue) {
        value = initialValue;
    }

    /**
     * 构造函数，默认的AtomicInteger的value为0
     */
    public AtomicInteger() {
    }

    /**
     * @return 返回当前值
     * 
     */
    public final int get() {
        return value;
    }

    /**
     * 将值设置为newValue
     * 
     * @param newValue 指定的新值
     */
    public final void set(int newValue) {
        value = newValue;
    }

    /**
     * 将值设置为newValue
     * 
     * @param newValue 指定的新值
     * @since 1.6
     */
    public final void lazySet(int newValue) {
        U.putIntRelease(this, VALUE, newValue);
    }

    /**
     *
     *原子性地将值设置为newValue，并返回旧值
     *
     * @param newValue 指定的新值
     * @return 返回旧值
     */
    public final int getAndSet(int newValue) {
        return U.getAndSetInt(this, VALUE, newValue);
    }

    /**
     * CAS
     *
     * 如果当前值等于expectedValue，原子将该值设置为newValue
     *
     * @param expectedValue 指定的期望值
     * @param newValue 指定的新值
     * @return 如果成功返回true，实际值与预期值不相等返回false
     */
    public final boolean compareAndSet(int expectedValue, int newValue) {
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }

    /**
     * 如果当前值等于expectedValue，原子将该值设置为newValue}
     *
     * @param expectedValue 指定的期望值
     * @param newValue 指定的新值
     * @return 如果成功返回true
     * @since 9
     */
    public final boolean weakCompareAndSetPlain(int expectedValue, int newValue) {
        return U.weakCompareAndSetIntPlain(this, VALUE, expectedValue, newValue);
    }

    /**
     * 以原子方式递增当前值,
     *
     * 相当于getAndAdd(1)
     *
     * @return 先前的值
     */
    public final int getAndIncrement() {
        return U.getAndAddInt(this, VALUE, 1);
    }

    /**
     * 原子递减当前值,
     *
     * 相当于getAndAdd(-1)
     *
     * @return 先前的值
     */
    public final int getAndDecrement() {
        return U.getAndAddInt(this, VALUE, -1);
    }

    /**
     * 以原子方式将给定值与当前值相加
     * 
     * @param delta 要加的值
     * @return 先前的值
     */
    public final int getAndAdd(int delta) {
        return U.getAndAddInt(this, VALUE, delta);
    }

    /**
     * 以原子方式递增当前值,
     *
     * 相当于addAndGet(1)
     *
     * @return 更新的值
     */
    public final int incrementAndGet() {
        return U.getAndAddInt(this, VALUE, 1) + 1;
    }

    /**
     * 以原子方式递减当前值

     * 相当于addAndGet(-1)
     *
     * @return 更新的值
     */
    public final int decrementAndGet() {
        return U.getAndAddInt(this, VALUE, -1) - 1;
    }

    /**
     * 以原子方式将给定值与当前值相加
     * 
     * @param delta 要添加的值
     * @return 更新的值
     */
    public final int addAndGet(int delta) {
        return U.getAndAddInt(this, VALUE, delta) + delta;
    }

    /**
     * 使用应用给定函数的结果以原子方式更新当前值，返回先前的值
     * 该函数应该没有副作用，因为当尝试的更新由于线程之间的争用而失败时，可以重新应用该函数
     *
     * @param updateFunction 无副作用的功能
     * @return 先前的值
     * @since 1.8
     */
    public final int getAndUpdate(IntUnaryOperator updateFunction) {
        int prev = get(), next = 0;
        for (boolean haveNext = false;;) {
            if (!haveNext)
                next = updateFunction.applyAsInt(prev);
            if (weakCompareAndSetVolatile(prev, next))
                return prev;
            haveNext = (prev == (prev = get()));
        }
    }

    /**
     * 使用应用给定函数的结果以原子方式更新当前值，返回更新后的值。
     * 该函数应该没有副作用，因为当尝试的更新由于线程之间的争用而失败时，可以重新应用该函数
     *
     * @param updateFunction 无副作用的功能
     * @return 更新后的值
     * @since 1.8
     */
    public final int updateAndGet(IntUnaryOperator updateFunction) {
        int prev = get(), next = 0;
        for (boolean haveNext = false;;) {
            if (!haveNext)
                next = updateFunction.applyAsInt(prev);
            if (weakCompareAndSetVolatile(prev, next))
                return next;
            haveNext = (prev == (prev = get()));
        }
    }
	.................
}
```

