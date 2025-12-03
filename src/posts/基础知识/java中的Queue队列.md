---
title: java中的Queue队列
author: zheng
tag:
  - java
category:
  - java基础
date: 2020-12-14 13:04:00

---

# 1、介绍

        Queue： 基本上，一个队列就是一个先入先出（FIFO）的数据结构
        Queue接口与List、Set同一级别，都是继承了Collection接口。LinkedList实现了Deque接 口。

# 2、Queue的实现：

 一个是以ConcurrentLinkedQueue为代表的高性能队列； 
 一个是以BlockingQueue接口为代表的阻塞队列； 

## （1）没有实现的阻塞接口队列

		没有实现的阻塞接口的LinkedList： 实现了java.util.Queue接口和java.util.AbstractQueue接口
　　内置的两个不阻塞队列： PriorityQueue 和 ConcurrentLinkedQueue

- PriorityQueue     和 ConcurrentLinkedQueue 类在     Collection Framework 中加入两个具体集合实现。 
- PriorityQueue     类实质上维护了一个有序列表。加入到 Queue 中的元素根据它们的天然排序（通过其 java.util.Comparable 实现）或者根据传递给构造函数的     java.util.Comparator 实现来定位

- ConcurrentLinkedQueue     是基于链接节点的、线程安全的队列。并发访问不需要同步。因为它在队列的尾部添加元素并从头部删除它们，所以只要不需要知道队列的大小，
- ConcurrentLinkedQueue     对公共集合的共享访问就可以工作得很好。收集关于队列大小的信息会很慢，需要遍历队列。

## （2）实现阻塞接口的队列

java.util.concurrent 中加入了 BlockingQueue 接口和五个阻塞队列类。它实质上就是一种带有一点扭曲的 FIFO 数据结构。不是立即从队列中添加或者删除元素，线程执行操作阻塞，直到有空间或者元素可用。
五个队列所提供的各有不同：

　　* ArrayBlockingQueue ：一个由数组支持的有界队列。
　　* LinkedBlockingQueue ：一个由链接节点支持的可选有界队列。
　　* PriorityBlockingQueue ：一个由优先级堆支持的无界优先级队列。
　　* DelayQueue ：一个由优先级堆支持的、基于时间的调度队列。
　　* SynchronousQueue ：一个利用 BlockingQueue 接口的简单聚集（rendezvous）机制。

![image-20201214130757812](/assets/images/image-20201214130757812.png)

# 3、ConcurrentLinkedQueue

```java
/**
 * ConcurrentLinkedQueue : 是一个适用于高并发场景下的队列，通过无锁的方式，实现了高并发状态下的高性能，通常ConcurrentLinkedQueue性能好于BlockingQueue。
 * 它是一个基于链接节点的无界线程安全队列。该队列的元素遵循先进先出的原则。
 * 头是最先加入的，尾是最近加入的，该队列不允许null元素。
 *
 */
public class ConcurrentLinkedQueueDemo {
    private static ConcurrentLinkedQueue q = new ConcurrentLinkedQueue();
    public static void main(String[] args) {
        q.offer("张三");
        q.offer("李四");
        q.offer("王五");
        q.offer("赵六");
        // 从头获取元素,删除该元素
        System.out.println(q.poll());
        // 从头获取元素,不刪除该元素
        System.out.println(q.peek());
        // 获取总长度
        System.out.println(q.size());
    }
}

```

# 4、BlockingQueue

 定义： 
		阻塞队列（BlockingQueue）是一个支持两个附加操作的队列。这两个附加的操作是： 
		1、在队列为空时，获取元素的线程会等待队列变为非空。 
		2、当队列满时，存储元素的线程会等待队列可用。 
阻塞队列是线程安全的。 
用途： 
		阻塞队列常用于生产者和消费者的场景，生产者是往队列里添加元素的线程，消费者是从队列里拿元素的线程。

		阻塞队列就是生产者存放元素的容器，而消费者也只从容器里拿元素。

## 1）ArrayBlockingQueue

```java
/**
 * ArrayBlockingQueue是一个有边界的阻塞队列，它的内部实现是一个数组。
 * 有边界的意思是它的容量是有限的，我们必须在其初始化的时候指定它的容量大小，容量大小一旦指定就不可改变。
 * ArrayBlockingQueue是以先进先出的方式存储数据，最新插入的对象是尾部，最新移出的对象是头部。
 *
 */
public class ArrayBlockingQueueDemo {
    public static void main(String[] args) {
        // 初始化3个队列
        ArrayBlockingQueue array = new ArrayBlockingQueue(3);
        array.add("张三");
        array.add("李四");
        array.add("王五");
        try {
            // 添加阻塞队列
            boolean a = array.offer("赵六", 1, TimeUnit.SECONDS);
            System.out.println(a);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

## 2）LinkedBlockingQueue

```java
/**
 * LinkedBlockingQueue阻塞队列大小的配置是可选的，
 * 如果我们初始化时指定一个大小，它就是有边界的，如果不指定，它就是无边界的。
 * 说是无边界，其实是采用了默认大小为Integer.MAX_VALUE的容量。它的内部实现是一个链表。
 * 和ArrayBlockingQueue一样，LinkedBlockingQueue 也是以先进先出的方式存储数据，最新插入的对象是尾部，最新移出的对象是头部。
 *
 */
public class LinkedBlockingQueueDemo {
    public static void main(String[] args) {
        // 初始化
        LinkedBlockingQueue lbq = new LinkedBlockingQueue(3);
        lbq.add("张三");
        lbq.add("李四");
        lbq.add("李四");
        // 运行结果：3
        System.out.println(lbq.size());
    }
}
```

## 3）PriorityBlockingQueue

```java
/**
 * 实现原理：PriorityBlockingQueue通过使用堆这种数据结构实现将队列中的元素按照某种排序规则进行排序，从而改变先进先出的队列顺序
 * <p>
 * PriorityBlockingQueue是一个没有边界的队列，它的排序规则和 java.util.PriorityQueue一样。需要注意，PriorityBlockingQueue中允许插入null对象。
 * 所有插入PriorityBlockingQueue的对象必须实现 java.lang.Comparable接口，队列优先级的排序规则就是按照我们对这个接口的实现来定义的。
 * 另外，我们可以从PriorityBlockingQueue获得一个迭代器Iterator，但这个迭代器并不保证按照优先级顺序进行迭代。
 * <p>
 * add方法添加元素时，是自下而上的调整堆，取出元素时，是自上而下的调整堆顺序；
 *
 * @Author: zhengtianqi
 * @Date: 2019/7/8 15:54
 */
public class PriorityBlockingQueueDemo {
    public static void main(String[] args) {
        PriorityBlockingQueue<Task> q = new PriorityBlockingQueue<>();
        Task t1 = new Task(); Task t2 = new Task(); Task t3 = new Task();
        t1.setId(2); t2.setId(3); t3.setId(1);
        t1.setName("id为2"); t2.setName("id为3"); t3.setName("id为1");
        q.add(t1); q.add(t2); q.add(t3);
        try {
            System.out.println("容器：" + q);
            System.out.println(q.take().getId());
            System.out.println("容器：" + q);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    public static class Task implements Comparable<Task> {
        private int id;
        private String name;
        public int getId() {
            return id;
        }
        public void setId(int id) {
            this.id = id;
        }
        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }
        @Override
        public int compareTo(Task task) {
            return this.id > task.id ? 1 : (this.id < task.id ? -1 : 0);
        }
        @Override
        public String toString() {
            return this.id + "," + this.name;
        }
    }
}

```

## 4）SynchronousQueue

https://blog.51cto.com/14220760/2416470?source=dra