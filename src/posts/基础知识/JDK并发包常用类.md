---
title: JDK并发包常用类
author: ztq
tag:
  - java
category:
  - java基础
date: 2022-04-08 22:05:00

---

# 1、工具类

提供并发控制手段: CountDownLatch、CyclicBarrier、Semaphore

线程间数据交换: Exchanger

## CountDownLatch：

允许一个或多个线程等待其他线程完成操作。

CountDownLatch的构造函数接受一个int类型的参数作为计数器，你想等待n个点完成，就传入n。

两个重要的方法:

countDown()：调用时，n会减1。

await()：调用会阻塞当前线程，直到n变成0。

await(long time,TimeUnit unit)：等待特定时间后，就不会继续阻塞当前线程。

tips:计数器必须大于等于0，当为0时，await就不会阻塞当前线程。

不提供重新初始化或修改内部计数器的值的功能。

## CyclicBarrier

可循环使用的屏障。

让一组线程到达一个屏障（也可以叫同步点)时被阻塞，直到最后一个线程到达屏障时，屏障才会开门，所有被屏障拦截的线程才会继续运行。

CyclicBarrier默认构造放时CyclicBarrier(int parities) ,其参数表示屏障拦截的线程数量，每个线程调用await方法告诉CyclicBarrier我已经到达屏障，然后当前线程被阻塞。

```java
// 王者荣耀需要10个玩家
CyclicBarrier cyclicBarrier = new CyclicBarrier(3, new Runnable() {
        @Override
        public void run()
            // 这是玩家都到齐之后会执行的代码
            System.out.println("10人都已到达游戏战场")
        }
    });

// 定义10线程，相当于10个玩家
  for (int i = 0; i < 10; i++) {
      final int finalI = i;
      new Thread(new Runnable() {
          @Override
          public void run() {
              try {
                  // 模拟每人到游戏战场所需时间 
                  Thread.sleep((long) (Math.random()*5000));
              } catch (InterruptedException e) {
                  e.printStackTrace();
              }
              System.out.println("第"+Thread.currentThread().getName()+"个人到达游戏战场");
              try {
                  // 等待其他人到达游戏战场
                  cyclicBarrier.await();
              } catch (InterruptedException e) {
                  e.printStackTrace();
              } catch (BrokenBarrierException e) {
                  e.printStackTrace();
              }
              System.out.println(Thread.currentThread().getName()+"比赛开始");
          }
      }, String.valueOf(finalI)).start();
  }
```



## CountDownLatch和CyclicBarrier区别

countDownLatch：

计数器：计数器只能使用一次。

等待：一个线程或多个等待另外n个线程完成之后才能执行。

CyclicBarrier：

计数器：计数器可以重置(通过reset()方法)。

等待：n个线程相互等待，任何一个线程完成之前，所有的线程都必须等待。

## Semaphore

用来控制同时访问资源的线程数量，通过协调各个线程，来保证合理的公共资源的访问。

应用场景:流量控制，特别是公共资源有限的应用场景，比如数据链接，限流等。

```java
Semaphore semaphore = new Semaphore(10,true);
semaphore.acquire();
//do something here
semaphore.release();
```

```java
public class TestCar {
    // 停车场同时容纳的车辆10
    private  static  Semaphore semaphore=new Semaphore(10);
    public static void main(String[] args) {
        // 模拟100辆车进入停车场
        for(int i=0;i<100;i++){
            Thread thread=new Thread(new Runnable() {
                public void run() {
                    try {
                        System.out.println("===="+Thread.currentThread().getName()+"来到停车场");
                        if(semaphore.availablePermits()==0){
                            System.out.println("车位不足，请耐心等待");
                        }
                        //获取令牌尝试进入停车场
                        semaphore.acquire();
                        System.out.println(Thread.currentThread().getName()+"成功进入停车场");
                        //模拟车辆在停车场停留的时间
                        Thread.sleep(new Random().nextInt(10000));
                        System.out.println(Thread.currentThread().getName()+"驶出停车场");
                        //释放令牌，腾出停车场车位
                        semaphore.release();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            },i+"号车");
            thread.start();
        }
    }
}
```



## Exchanger

Exchanger是一个用于线程间协作的工具类，它提供一个同步点，在这个同步点上，两个线程可以交换彼此的数据。

比如第一个线程执行exchange()方法，它会一直等待第二个线程也执行exchange，当两个线程都到同步点，就可以交换数据了。

一般来说为了避免一直等待的情况，可以使用exchange( x,long timeout,TimeUnit unit),设置最大等待时间。Exchanger可以用于遗传算法。
