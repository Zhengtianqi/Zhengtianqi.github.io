---
title: Go 并发编程：goroutine 和 channel 入门
tag: ["Go"]
date: 2026-06-12
category: Go 语言
---

# Go 并发编程：goroutine 和 channel 入门

> Go 并发编程：goroutine 和 channel 入门是现代软件开发的核心挑战，它涉及多线程协调和资源共享等关键问题。
> 本文介绍了Go 并发编程：goroutine 和 channel 入门的原理和最佳实践，帮助你构建高性能的并发系统。

```
并发（Concurrency）：
  同时处理多个任务的能力（不一定是同时执行）
  一个人同时下三盘棋 → 轮流走一步
  单核 CPU 也可以并发

并行（Parallelism）：
  同时执行多个任务
  三个人各自下一盘棋
  必须多核 CPU

通俗理解：
  并发 = 交替执行，看起来像是同时
  并行 = 真正的同时执行
```

### 1.2 Go 的并发哲学

Go 的设计目标不是让你管理线程，而是让你轻松表达并发逻辑：

```go
// 不需要关心线程池、任务队列、Future...
// 一个 go 关键字就够了
go doSomething()
go doSomethingElse()
go doAnotherThing()
```

## 二、goroutine：轻量级用户态线程

### 2.1 goroutine vs Java Thread

```go
// Go：启动 goroutine
func main() {
    go sayHello()          // 新 goroutine，非阻塞
    fmt.Println("main")    // 主 goroutine 继续执行
    time.Sleep(time.Second) // 等待 goroutine 完成
}

func sayHello() {
    fmt.Println("Hello from goroutine")
}
```

| 特性 | Java Thread | Go goroutine |
|------|-------------|-------------|
| 管理 | OS 内核调度 | Go 运行时调度 (GMP) |
| 栈大小 | ~1 MB（固定） | 2 KB 起步，动态伸缩 |
| 创建开销 | 微秒级（系统调用） | 纳秒级（函数调用） |
| 最大数量 | 几千 | 数十万 |
| 是否可抢占 | Java 19+ 虚拟线程 | 从 Go 1.14 开始支持 |
| 上下文切换 | 内核空间 ↔ 用户空间 | 仅在用户空间 |

### 2.2 GMP 调度模型

```
G (Goroutine)：协程
M (Machine/OS Thread)：操作系统线程
P (Processor)：逻辑处理器（调度上下文）

               全局队列
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
     P(0)       P(1)       P(2)
   ┌──────┐  ┌──────┐  ┌──────┐
   │本地队列│  │本地队列│  │本地队列│
   │G G G G│  │G G G G│  │G G G G│
   └──────┘  └──────┘  └──────┘
       │          │          │
       M          M          M
     (OS线程)    (OS线程)    (OS线程)

调度流程：
1. 每个 P 绑定一个 M
2. P 从本地队列取 G 执行
3. G 阻塞 → M 去执行其他 G，G 回到队列
4. G 系统调用 → M 和 G 分离，新 M 接管 P
5. 工作窃取：空闲 P 从其他 P 偷 G
```

### 2.3 展示 goroutine 的轻量

```go
func main() {
    var wg sync.WaitGroup

    start := time.Now()

    // 创建 10 万个 goroutine
    for i := 0; i < 100000; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            time.Sleep(10 * time.Millisecond) // 模拟工作
        }(i)
    }

    wg.Wait()
    fmt.Printf("10万 goroutine 耗时: %v\n", time.Since(start))
    // 输出通常 < 200ms（主要 time.Sleep 的耗时）
}

// 对比：Java 要创建 10 万个线程会直接 OOM
```

## 三、channel：goroutine 之间的通信管道

### 3.1 channel 基础

```go
// 创建 channel
ch := make(chan int)      // 无缓冲 channel
ch := make(chan int, 10)  // 有缓冲 channel，容量 10

// 发送和接收
ch <- 42      // 发送
value := <-ch // 接收
value, ok := <-ch // 接收，ok 表示 channel 是否还开着

// 关闭 channel
close(ch)

// 单向 channel（函数参数中限制方向）
func send(ch chan<- int) { ch <- 42 }          // 只能发送
func receive(ch <-chan int) { val := <-ch }    // 只能接收
```

### 3.2 无缓冲 vs 有缓冲 channel

```go
// 无缓冲 channel：同步通信
// 发送方和接收方必须同时准备好
func unbufferedExample() {
    ch := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        ch <- "Hello"  // 阻塞，直到有人接收
        fmt.Println("发送完成")
    }()

    fmt.Println("等待接收...")
    msg := <-ch  // 阻塞，直到有人发送
    fmt.Println("收到:", msg)
}

// 输出：
// 等待接收...
// (等待 2 秒)
// 发送完成
// 收到: Hello
```

```go
// 有缓冲 channel：异步通信（到容量上限）
func bufferedExample() {
    ch := make(chan string, 3)  // 缓冲 3 个

    ch <- "A"   // 不阻塞
    ch <- "B"   // 不阻塞
    ch <- "C"   // 不阻塞
    // ch <- "D" // 阻塞！缓冲区满了

    fmt.Println(<-ch)  // A
    fmt.Println(<-ch)  // B
    fmt.Println(<-ch)  // C
    // <-ch  // 阻塞！缓冲区空了
}
```

**类比理解**：

```
无缓冲 channel = 当面交易（一手交钱一手交货）
有缓冲 channel = 快递柜（放进去就走，来取就行）
```

### 3.3 select 多路复用

select 是 Go 并发编程中最强大的控制结构之一：

```go
func selectExample() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    // goroutine 1：2 秒后发送
    go func() {
        time.Sleep(2 * time.Second)
        ch1 <- "from ch1"
    }()

    // goroutine 2：1 秒后发送
    go func() {
        time.Sleep(1 * time.Second)
        ch2 <- "from ch2"
    }()

    // select：哪个 channel 先有数据就处理哪个
    select {
    case msg1 := <-ch1:
        fmt.Println("收到:", msg1)
    case msg2 := <-ch2:
        fmt.Println("收到:", msg2)
    case <-time.After(3 * time.Second):  // 超时
        fmt.Println("超时了！")
    }
    // 输出：收到: from ch2（ch2 先发送）
}
```

**select 关键特性**：

```go
// 1. default：非阻塞尝试
select {
case msg := <-ch:
    fmt.Println("收到:", msg)
default:
    fmt.Println("没有消息，不等待")
}

// 2. 多个 case 同时就绪时，随机选一个（公平性）
select {
case <-ch1:
    fmt.Println("ch1")
case <-ch2:
    fmt.Println("ch2")
    // 都就绪 → 随机选一个
}

// 3. 用于超时控制
select {
case result := <-workCh:
    fmt.Println("完成:", result)
case <-time.After(5 * time.Second):
    fmt.Println("超时，取消操作")
}

// 4. 用于优雅退出
for {
    select {
    case job := <-jobCh:
        process(job)
    case <-stopCh:
        fmt.Println("收到停止信号，退出循环")
        return
    }
}
```

### 3.4 channel 关闭的信号机制

```go
// 关闭 channel 是一种广播机制：所有接收方都能感知
func broadcastExample() {
    ch := make(chan struct{})  // 空 struct，不占内存

    // 5 个工作 goroutine
    for i := 0; i < 5; i++ {
        go func(id int) {
            <-ch  // 阻塞等待信号
            fmt.Printf("Worker %d 开始工作\n", id)
        }(i)
    }

    time.Sleep(time.Second)
    close(ch)  // 广播：所有 worker 同时收到信号！
    time.Sleep(time.Second)
}
```

```go
// for-range 读取 channel 直到关闭
func rangeExample() {
    ch := make(chan int, 5)

    go func() {
        for i := 1; i <= 5; i++ {
            ch <- i
        }
        close(ch)  // 必须关闭，否则 range 会死锁
    }()

    // for-range 自动检测 channel 关闭
    for val := range ch {
        fmt.Println(val)
    }
    // 输出：1 2 3 4 5
}
```

## 四、同步原语

### 4.1 sync.WaitGroup

```go
// WaitGroup：等待一组 goroutine 完成（类似 Java 的 CountDownLatch）
func waitGroupExample() {
    var wg sync.WaitGroup
    urls := []string{"url1", "url2", "url3", "url4", "url5"}

    for _, url := range urls {
        wg.Add(1)  // 计数 +1

        go func(u string) {
            defer wg.Done()  // 完成时计数 -1（用 defer 确保一定执行）
            fetch(u)
        }(url)  // 注意：传参避免闭包陷阱
    }

    wg.Wait()  // 阻塞直到计数归零
    fmt.Println("所有请求完成")
}
```

### 4.2 sync.Mutex 和 sync.RWMutex

```go
// Mutex：互斥锁（类似 Java 的 synchronized）
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()  // defer 确保解锁
    c.value++
}

func (c *Counter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}
```

```go
// RWMutex：读写锁（读不互斥，写互斥）
type SafeCache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *SafeCache) Get(key string) (string, bool) {
    c.mu.RLock()         // 读锁，允许多个并发读取
    defer c.mu.RUnlock()
    val, ok := c.data[key]
    return val, ok
}

func (c *SafeCache) Set(key, value string) {
    c.mu.Lock()           // 写锁，独占
    defer c.mu.Unlock()
    c.data[key] = value
}
```

### 4.3 sync.Once

```go
// sync.Once：确保函数只执行一次（类似单例模式）
type Database struct {
    conn string
}

var (
    db   *Database
    once sync.Once
)

func GetDatabase() *Database {
    once.Do(func() {
        // 只执行一次，即使多个 goroutine 同时调用
        fmt.Println("初始化数据库连接...")
        db = &Database{conn: "connected"}
    })
    return db
}
```

## 五、常见并发模式

### 5.1 Pipeline（流水线模式）

```go
// Pipeline：数据流经多个处理阶段
// generate → square → print

// 阶段 1：生成数字
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// 阶段 2：平方
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// 阶段 3：输出
func printChan(in <-chan int) {
    for n := range in {
        fmt.Println(n)
    }
}

func main() {
    // 串联 pipeline
    c1 := generate(2, 3, 4, 5)  // 2, 3, 4, 5
    c2 := square(c1)             // 4, 9, 16, 25
    printChan(c2)
    // 输出：4 9 16 25
}
```

### 5.2 Fan-out / Fan-in（扇出/扇入）

```go
// Fan-out：一个输入 channel，多个工作 goroutine
// Fan-in：多个输入 channel，合并到一个输出 channel

func fanOutFanIn() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    // Fan-out：启动 5 个 worker
    numWorkers := 5
    for w := 0; w < numWorkers; w++ {
        go worker(w, jobs, results)
    }

    // 发送 20 个任务
    for j := 1; j <= 20; j++ {
        jobs <- j
    }
    close(jobs)

    // Fan-in：收集结果
    for r := 1; r <= 20; r++ {
        result := <-results
        fmt.Printf("结果: %d\n", result)
    }
    close(results)
}

func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d 处理任务 %d\n", id, job)
        time.Sleep(time.Millisecond * 100) // 模拟工作
        results <- job * 2
    }
}
```

### 5.3 扇入合并（多个 channel → 一个 channel）

```go
func merge(channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    // 每个输入 channel 启动一个 goroutine 转发
    output := func(c <-chan int) {
        defer wg.Done()
        for n := range c {
            out <- n
        }
    }

    wg.Add(len(channels))
    for _, c := range channels {
        go output(c)
    }

    // 所有转发完成后关闭输出 channel
    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

// 使用
func main() {
    c1 := generate(2, 3, 4)
    c2 := generate(5, 6, 7)
    c3 := generate(8, 9, 10)

    merged := merge(c1, c2, c3)
    for n := range merged {
        fmt.Println(n)  // 所有数字会在一个 channel 中输出
    }
}
```

### 5.4 生产者-消费者

```go
func producerConsumer() {
    const bufferSize = 10
    const numProducers = 3
    const numConsumers = 2
    const itemsToProduce = 30

    items := make(chan int, bufferSize)
    var wg sync.WaitGroup

    // 生产者
    for p := 0; p < numProducers; p++ {
        wg.Add(1)
        go func(producerID int) {
            defer wg.Done()
            for i := 0; i < itemsToProduce/numProducers; i++ {
                item := producerID*100 + i
                items <- item
                fmt.Printf("生产者 %d 生产 %d\n", producerID, item)
                time.Sleep(time.Millisecond * 50)
            }
        }(p)
    }

    // 消费者
    done := make(chan struct{})
    for c := 0; c < numConsumers; c++ {
        go func(consumerID int) {
            for item := range items {
                fmt.Printf("消费者 %d 消费 %d\n", consumerID, item)
                time.Sleep(time.Millisecond * 80)
            }
            done <- struct{}{}
        }(c)
    }

    // 等待所有生产者完成，关闭 channel
    wg.Wait()
    close(items)

    // 等待消费者处理完
    for c := 0; c < numConsumers; c++ {
        <-done
    }
}
```

## 六、context 包：超时控制与取消传播

### 6.1 context 基础

```go
import "context"

// context 的四种创建方式
ctx := context.Background()       // 根 context（main 函数用）
ctx := context.TODO()             // 不确定用哪个时的占位符

ctx, cancel := context.WithCancel(parentCtx)      // 可取消
ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)  // 超时
ctx, cancel := context.WithDeadline(parentCtx, time.Now().Add(5*time.Second)) // 截止时间
```

### 6.2 超时控制

```go
func fetchWithTimeout(ctx context.Context, url string) (string, error) {
    // 创建带超时的子 context
    ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
    defer cancel()  // 防止 context 泄漏

    // 模拟 HTTP 请求
    resultCh := make(chan string, 1)
    errCh := make(chan error, 1)

    go func() {
        time.Sleep(time.Duration(rand.Intn(5)) * time.Second) // 模拟延迟
        resultCh <- fmt.Sprintf("Response from %s", url)
    }()

    select {
    case result := <-resultCh:
        return result, nil
    case <-ctx.Done():
        return "", fmt.Errorf("请求超时: %w", ctx.Err())
    }
}

func main() {
    ctx := context.Background()
    result, err := fetchWithTimeout(ctx, "https://example.com")
    if err != nil {
        fmt.Println("错误:", err)
        return
    }
    fmt.Println(result)
}
```

### 6.3 取消传播

```go
// context 可以层层传递取消信号
func pipeline(ctx context.Context) {
    // 阶段 1
    result1, err := processStage1(ctx)
    if err != nil {
        return
    }

    // 阶段 2
    result2, err := processStage2(ctx, result1)
    if err != nil {
        return
    }

    // 阶段 3
    processStage3(ctx, result2)
}

func processStage1(ctx context.Context) (string, error) {
    select {
    case <-time.After(2 * time.Second):
        return "stage1-done", nil
    case <-ctx.Done():
        return "", ctx.Err()  // 上层取消了，立即返回
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()

    pipeline(ctx)
    // 1 秒后 pipeline 中的所有 stage 都会被取消
}
```

### 6.4 context 在服务器中的应用

```go
// HTTP 服务器中 context 来自请求（gin/标准库自动注入）
func handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()  // 客户端断开连接时自动取消

    // 调用数据库，传递 ctx
    user, err := db.QueryUser(ctx, userID)
    if err != nil {
        // 可能是 ctx 被取消（客户端断开）
        http.Error(w, "查询失败", http.StatusInternalServerError)
        return
    }

    // 调用下游服务，传递 ctx
    order, err := orderClient.GetOrder(ctx, orderID)
    // ...
}

// 数据库操作中检查 ctx
func (r *Repository) QueryUser(ctx context.Context, id int64) (*User, error) {
    // 每次数据库操作前检查 ctx
    if err := ctx.Err(); err != nil {
        return nil, err
    }

    row := r.db.QueryRowContext(ctx, "SELECT * FROM users WHERE id = ?", id)
    // ...
}
```

## 七、与 Java 并发的对比

### 7.1 核心概念映射

| Java | Go |
|------|-----|
| `Thread` | `goroutine` |
| `Runnable` | `func()` |
| `ExecutorService` | 手动 goroutine 管理 + channel |
| `Future<T>` | `<-chan T` |
| `CompletableFuture<T>` | goroutine + channel 组合 |
| `synchronized` | `sync.Mutex` |
| `ReentrantLock` | `sync.Mutex` |
| `ReadWriteLock` | `sync.RWMutex` |
| `CountDownLatch` | `sync.WaitGroup` |
| `CyclicBarrier` | 手动 WaitGroup + channel |
| `BlockingQueue<T>` | `chan T` |
| `Semaphore` | `make(chan struct{}, n)` |
| `ThreadLocal` | goroutine 无需（每个 G 独立栈） |
| `volatile` | `sync/atomic` 或 channel |
| `wait()/notify()` | channel |
| `ThreadPoolExecutor` | 通常不需要（goroutine 够轻量） |

### 7.2 Semaphore 实现对比

```go
// Go：用 buffered channel 实现信号量
type Semaphore chan struct{}

func NewSemaphore(n int) Semaphore {
    return make(Semaphore, n)
}

func (s Semaphore) Acquire() {
    s <- struct{}{}
}

func (s Semaphore) Release() {
    <-s
}

// 使用：最多 10 个并发
func main() {
    sem := NewSemaphore(10)
    var wg sync.WaitGroup

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            sem.Acquire()
            defer sem.Release()

            fmt.Printf("处理 %d\n", id)
            time.Sleep(time.Second)
        }(i)
    }

    wg.Wait()
}
```

### 7.3 为什么 goroutine + channel 更简洁

```java
// Java：用 CompletableFuture 实现简单的并行 + 合并
CompletableFuture<User> userFuture =
    CompletableFuture.supplyAsync(() -> userService.getUser(id));
CompletableFuture<List<Order>> ordersFuture =
    CompletableFuture.supplyAsync(() -> orderService.getOrders(id));

CompletableFuture<Dashboard> dashboardFuture = userFuture
    .thenCombine(ordersFuture, Dashboard::new);

try {
    Dashboard dashboard = dashboardFuture.get(5, TimeUnit.SECONDS);
} catch (TimeoutException e) {
    // 超时处理
}
```

```go
// Go：goroutine + channel，意图更直观
func getDashboard(userID int64) (*Dashboard, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    userCh := make(chan *User, 1)
    errCh := make(chan error, 1)

    go func() {
        user, err := userService.GetUser(ctx, userID)
        if err != nil {
            errCh <- err
            return
        }
        userCh <- user
    }()

    orders, err := orderService.GetOrders(ctx, userID)
    if err != nil {
        return nil, err
    }

    select {
    case user := <-userCh:
        return &Dashboard{User: user, Orders: orders}, nil
    case err := <-errCh:
        return nil, err
    case <-ctx.Done():
        return nil, ctx.Err()
    }
}
```

## 八、实战：并发爬虫

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "sync"
    "time"
)

// 并发爬虫：展示 goroutine + channel 的实际使用
type Crawler struct {
    client    *http.Client
    semaphore chan struct{}  // 控制并发数
    results   chan CrawlResult
    visited   map[string]bool
    mu        sync.Mutex
}

type CrawlResult struct {
    URL        string
    StatusCode int
    Duration   time.Duration
    Error      error
}

func NewCrawler(maxConcurrency int) *Crawler {
    return &Crawler{
        client:    &http.Client{Timeout: 10 * time.Second},
        semaphore: make(chan struct{}, maxConcurrency),
        results:   make(chan CrawlResult, 100),
        visited:   make(map[string]bool),
    }
}

func (c *Crawler) Crawl(ctx context.Context, urls []string) <-chan CrawlResult {
    var wg sync.WaitGroup

    for _, url := range urls {
        // 检查是否已访问
        c.mu.Lock()
        if c.visited[url] {
            c.mu.Unlock()
            continue
        }
        c.visited[url] = true
        c.mu.Unlock()

        wg.Add(1)
        go func(targetURL string) {
            defer wg.Done()

            // 获取信号量（控制并发）
            select {
            case c.semaphore <- struct{}{}:
                defer func() { <-c.semaphore }()
            case <-ctx.Done():
                return
            }

            // 发起请求
            start := time.Now()
            req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
            if err != nil {
                c.results <- CrawlResult{URL: targetURL, Error: err}
                return
            }

            resp, err := c.client.Do(req)
            duration := time.Since(start)

            if err != nil {
                c.results <- CrawlResult{URL: targetURL, Duration: duration, Error: err}
                return
            }
            defer resp.Body.Close()

            c.results <- CrawlResult{
                URL:        targetURL,
                StatusCode: resp.StatusCode,
                Duration:   duration,
            }
        }(url)
    }

    // 等待所有请求完成后关闭 results channel
    go func() {
        wg.Wait()
        close(c.results)
    }()

    return c.results
}

func main() {
    urls := []string{
        "https://www.google.com",
        "https://www.github.com",
        "https://www.stackoverflow.com",
        "https://www.golang.org",
        "https://www.example.com",
    }

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    crawler := NewCrawler(3) // 最多 3 个并发
    results := crawler.Crawl(ctx, urls)

    success, failed := 0, 0
    for result := range results {
        if result.Error != nil {
            failed++
            fmt.Printf("❌ %s: %v (%.2fs)\n", result.URL, result.Error, result.Duration.Seconds())
        } else {
            success++
            fmt.Printf("✅ %s: %d (%.2fs)\n", result.URL, result.StatusCode, result.Duration.Seconds())
        }
    }

    fmt.Printf("\n总计: %d 成功, %d 失败\n", success, failed)
}
```

## 九、实战：并发 HTTP 服务

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

// 并发安全的请求计数器
type RequestCounter struct {
    mu     sync.RWMutex
    counts map[string]int64
    total  int64
}

func NewRequestCounter() *RequestCounter {
    return &RequestCounter{counts: make(map[string]int64)}
}

func (c *RequestCounter) Record(path string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.counts[path]++
    c.total++
}

func (c *RequestCounter) Stats() map[string]interface{} {
    c.mu.RLock()
    defer c.mu.RUnlock()

    // 复制一份避免并发问题
    counts := make(map[string]int64, len(c.counts))
    for k, v := range c.counts {
        counts[k] = v
    }

    return map[string]interface{}{
        "total":  c.total,
        "counts": counts,
    }
}

func main() {
    counter := NewRequestCounter()

    mux := http.NewServeMux()

    // 业务接口（每个请求在独立的 goroutine 中处理）
    mux.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
        counter.Record("/api/hello")

        // 模拟处理时间
        time.Sleep(50 * time.Millisecond)

        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, `{"message": "Hello, World!", "goroutine": %d}`,
            time.Now().UnixNano())
    })

    // 统计接口
    mux.HandleFunc("/api/stats", func(w http.ResponseWriter, r *http.Request) {
        stats := counter.Stats()
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, `{"total": %d, "counts": %v}`,
            stats["total"], stats["counts"])
    })

    // 健康检查
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    })

    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  120 * time.Second,
    }

    // 启动服务器
    go func() {
        log.Println("服务启动在 http://localhost:8080")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("服务启动失败: %v", err)
        }
    }()

    // 优雅关闭
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("正在关闭服务...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("强制关闭: %v", err)
    }

    log.Println("服务已安全关闭")
}
```

## 十、常见坑与最佳实践

### 坑1：goroutine 泄漏

```go
// ❌ goroutine 泄漏：向无人接收的 channel 发送
func leak() {
    ch := make(chan int)

    go func() {
        ch <- 42  // 永远阻塞，goroutine 泄漏
    }()

    // main 函数返回，但 goroutine 还在
}

// ✅ 用 context 控制生命周期
func noLeak(ctx context.Context) {
    ch := make(chan int)

    go func() {
        select {
        case ch <- 42:
        case <-ctx.Done():
            return  // 放弃发送
        }
    }()

    select {
    case val := <-ch:
        fmt.Println(val)
    case <-ctx.Done():
        fmt.Println("取消")
    }
}
```

### 坑2：for-range 中的 goroutine 闭包陷阱

```go
// ❌ 常见错误
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i)  // 打印的值不确定（可能是 5）
    }()
}

// ✅ 传参或局部变量
for i := 0; i < 5; i++ {
    go func(id int) {
        fmt.Println(id)
    }(i)
}

// ✅ Go 1.22+ 修复了这个行为，但建议仍然显式传参
for i := 0; i < 5; i++ {
    i := i  // 创建新变量
    go func() {
        fmt.Println(i)
    }()
}
```

### 坑3：向已关闭的 channel 发送

```go
// ❌ panic: send on closed channel
ch := make(chan int)
close(ch)
ch <- 42  // panic!

// ✅ 检查或只在发送方关闭
func safeSend(ch chan int, value int) (sent bool) {
    defer func() {
        if recover() != nil {
            sent = false
        }
    }()
    ch <- value
    return true
}
```

### 坑4：死锁

```go
// ❌ 死锁：无缓冲 channel，没有接收方
func main() {
    ch := make(chan int)
    ch <- 42  // 死锁！main goroutine 阻塞，没有其他 goroutine 接收
    fmt.Println(<-ch)
}

// ✅ 有接收方
func main() {
    ch := make(chan int)
    go func() {
        ch <- 42
    }()
    fmt.Println(<-ch)
}
```

### 最佳实践总结

```
1. 谁创建 channel 谁关闭（一般原则）
2. 接收方不应关闭 channel
3. 使用 defer 确保锁释放
4. 使用 context 控制超时和取消
5. 避免在持有锁时调用外部函数（可能死锁）
6. 优先用 channel 通信，必要时才用锁
7. goroutine 必须能退出（有出口）
8. buffered channel 设置合理容量
9. 永远不要在 goroutine 中吞掉 panic（用 defer recover）
10. 用 select + time.After 避免永久阻塞
```

## 十一、总结

Go 的并发模型可以归结为一句话：

> **goroutine 用来"做事情"，channel 用来"传消息"，select 用来"做决策"。**

### 学习路径回顾

```
第 1 步：理解 goroutine（轻量、go 关键字、调度模型）
  ↓
第 2 步：掌握 channel（无缓冲同步、有缓冲缓冲、关闭广播）
  ↓
第 3 步：精通 select（多路复用、超时、default）
  ↓
第 4 步：熟悉同步原语（WaitGroup、Mutex、Once）
  ↓
第 5 步：理解并发模式（Pipeline、Fan-out/in、生产者-消费者）
  ↓
第 6 步：掌握 context（超时控制、取消传播）
  ↓
第 7 步：实战中磨炼（爬虫、HTTP 服务、数据处理管道）
```

Go 的并发模型之美在于：它足够简单，简单到只用一个 `go` 关键字就能开启并发；又足够强大，强大到能构建出复杂的分布式系统。

当你从 Java 的线程池、Future、CompletableFuture 中解放出来，用 goroutine 和 channel 表达并发逻辑时，你会发现——并发编程原来可以这么优雅。

*本文基于 Go 1.22 编写。goroutine 调度行为可能随版本更新而变化。*
