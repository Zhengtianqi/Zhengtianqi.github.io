---
title: Future使用
author: 郑天祺
tag:
  - java
category:
  - java基础
date: 2023-09-23 10:15:00
---
所谓异步调用其实就是实现一个可无需等待被调用函数的返回值而让操作继续运行的方法。
在 Java 语言中，简单的讲就是另启一个线程来完成调用中的部分计算，使调用继续运行或返回，而不需要等待计算结果。但调用者仍需要取线程的计算结果。

# 一、 Future 是什么
## 作用
future 可以用于异步获取多线程任务结果 , Callable 用于产生结果，Future 用于获取结果
## 流程
当 Future 进行 submit 开始 , 业务处理已经在多线程中开始 , 而 Get 即从多线程中获取数据
当 Get 获取时业务还未处理完 ,  当前线程会阻塞 , 直到业务处理完成 . 所以需要注意 future 的任务安排
使用 future 会有以下效果：
- 1 启动多线程任务
- 2 处理其他事情
- 3 收集多线程任务结果
# 二、 Runnable 与 Callable
在执行多个任务的时候，使用Java标准库提供的线程池是非常方便的。我们提交的任务只需要实现Runnable接口，就可以让线程池去执行：
```java
class Task implements Runnable {
    public String result;

    public void run() {
        this.result = longTimeCalculation(); 
    }
}
```
Runnable接口有个问题，它的方法没有返回值。如果任务需要一个返回结果，那么只能保存到变量，还要提供额外的方法读取，非常不便。
所以，Java标准库还提供了一个Callable接口，和Runnable接口比，它多了一个返回值：
```java
class Task implements Callable<String> {
    public String call() throws Exception {
        return longTimeCalculation(); 
    }
}
```
并且Callable接口是一个泛型接口，可以返回指定类型的结果。
# 三、Future使用
现在的问题是，如何获得异步执行的结果？
如果仔细看ExecutorService.submit()方法，可以看到，它返回了一个Future类型，一个Future类型的实例代表一个未来能获取结果的对象：
```java
ExecutorService executor = Executors.newFixedThreadPool(4); 
// 定义任务:
Callable<String> task = new Task();
// 提交任务并获得Future:
Future<String> future = executor.submit(task);
// 从Future获取异步执行返回的结果:
String result = future.get(); // 可能阻塞
```
当我们提交一个Callable任务后，我们会同时获得一个Future对象，然后，我们在主线程某个时刻调用Future对象的get()方法，就可以获得异步执行的结果。
在调用get()时，如果异步任务已经完成，我们就直接获得结果。如果异步任务还没有完成，那么get()会阻塞，直到任务完成后才返回结果。
一个Future接口表示一个未来可能会返回的结果，它定义的方法有：
```java
get()：获取结果（可能会等待）
get(long timeout, TimeUnit unit)：获取结果，但只等待指定的时间；
cancel(boolean mayInterruptIfRunning)：取消当前任务；
isDone()：判断任务是否已完成。
```
# 四、CompletableFuture和Supplier
阻塞的方式显然和我们的异步编程的初衷相违背，轮询的方式又会耗费无谓的 CPU 资源，而且也不能及时地得到计算结果，为什么不能用观察者设计模式呢？ 
即当计算结果完成及时通知监听者。（例如通过回调的方式）所以在JDK8中引入了一个新的类CompletableFuture。
Java 8 中, 新增加了一个包含 50 个方法左右的类 CompletableFuture，它提供了非常强大的 Future 的扩展功能，可以帮助我们简化异步编程的复杂性，并且提供了函数式编程的能力，可以通过回调的方式处理计算结果，也提供了转换和组合 CompletableFuture 的方法。
对于阻塞或者轮询方式，依然可以通过 CompletableFuture 类的 CompletionStage 和 Future 接口方式支持。
Supplier是一个函数接口，其SAM(单一抽象方法)是get()。

它不接收任何参数，返回一个值，并且只抛出非受检的异常：
```java
 T get();
```
此接口最常见的用例之一是推迟某些代码的执行。
Optional类有一些方法接收Supplier作为参数，例如Optional.or()、Optional.orElseGet()。
因此，Supplier只有在Optional为空的时候才会执行。
我们还可以在异步计算上下文中使用它，特别是在CompletableFuture API中。
某些方法接收Supplier作为参数，例如supplyAsync()方法。
示例1：单个任务,让我们定义一个只执行一个异步任务的方法：
```java
public static void main(String[] args) throws Exception {
        // 在 Java8 中，推荐使用 Lambda 来替代匿名 Supplier 实现类
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                Thread.sleep(2000);
            } catch (Exception e) {
            }
            return "I have completed";
        });
        System.out.println(future.get());
}
```
在这种情况下，lambda表达式定义了Supplier，但我们也可以定义一个实现类。多亏了CompletableFuture，我们为异步操作定义了一个模板，使其更易于理解和修改。 join()方法提供Supplier的返回值。
示例2：结合两个 CompletableFuture：我们还可以在Supplier接口和CompletableFuture的支持下开发一系列任务：
```java
public static void main(String[] args) throws Exception {
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");
        CompletableFuture<Void> combinedFuture = CompletableFuture.allOf(future1, future2);
        // 这个方法不会合并结果，可以看到他的返回值是 Void 类型
        combinedFuture.get();
        // 我们需要手动来处理每一个并行异步任务的结果
        String combined = 
        Stream.of(future1, future2)
            .map(CompletableFuture::join)
            .collect(Collectors.joining(" "));
        System.out.println(combined);
}
```
示例3：转换和作用于异步任务的结果 (thenApply)
我们可以叠加功能，把多个 future 组合在一起等该方法的作用是在该计算阶段正常完成后，将该计算阶段的结果作为参数传递给参数 fn 值的函数Function，并会返回一个新的 CompletionStage
```java
public static void main(String[] args) throws Exception {
    // 在 Java8 中，推荐使用 Lambda 来替代匿名 Supplier 实现类
    CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(2000);
        } catch (Exception e) {
        }
        return "I have completed";
    });
    CompletableFuture<String> upperfuture = future.thenApply(String::toUpperCase);
    System.out.println(upperfuture.get());
}
```
示例3：运行完成的异步任务的结果 (thenAccept/thenRun)
在 future 的管道里有两种典型的“最终”阶段方法。他们在你使用 future 的值的时候做好准备，当 thenAccept() 提供最终的值时，thenRun 执行 Runnable。
Consumer 接口方法 void accept(T t); 包含一个参数，但是没有返回值
```java
public static void main(String[] args) throws Exception {
    // 在 Java8 中，推荐使用 Lambda 来替代匿名 Supplier 实现类
    CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(2000);
        } catch (Exception e) {
        }
        return "I have completed";
    });
    future.thenAccept(s -> {
        System.out.println(s);
    });
    // 等待将来完成，然后返回结果。
    future.get();
}
```

总结：使用CompletableFuture–Supplier方法定义异步任务链可以解决之前使用Future–Callable方法引入的一些问题：
- 链中的每个任务都是独立的，因此，如果任务执行失败，我们可以通过exceptionally()块来处理它。
- join()方法不需要在编译时处理受检的异常。
- 我们可以设计一个异步任务模板，完善每个任务的状态处理。


参考：
- https://juejin.cn/post/6941010435512467493
- https://www.jianshu.com/p/73aaec23009d
- https://www.liaoxuefeng.com/wiki/1252599548343744/1306581155184674
- https://tu-yucheng.github.io/java/2023/07/05/java-callable-vs-supplier.html