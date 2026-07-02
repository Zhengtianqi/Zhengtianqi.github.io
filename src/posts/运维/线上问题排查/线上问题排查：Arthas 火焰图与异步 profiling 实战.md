---
title: 线上问题排查：Arthas 火焰图与异步 profiling 实战
tag: ["Arthas", "火焰图", "async-profiler", "性能分析", "线上排查"]
category: 运维
date: 2026-07-02
---

# 线上问题排查：Arthas 火焰图与异步 profiling 实战

接口偶发慢但找不到原因？CPU 不高但响应延迟大？火焰图是性能分析的终极武器，一眼定位热点代码。

---

## 一、火焰图基础

### 1.1 什么是火焰图

```
火焰图（Flame Graph）：
  将 CPU 采样数据可视化为"火焰"形状的 SVG 图
  
  ┌────────────────────────────────────────────────┐
  │                  main()                        │ ← 栈底（宽=CPU时间多）
  │  ┌──────────┐  ┌────────────────┐              │
  │  │ handle() │  │ process()      │              │
  │  │ ┌──────┐ │  │ ┌────────────┐ │              │
  │  │ │ db() │ │  │ │ serialize()│ │              │ ← 栈顶（窄=CPU时间少）
  │  │ └──────┘ │  │ └────────────┘ │              │
  │  └──────────┘  └────────────────┘              │
  └────────────────────────────────────────────────┘
  
  横轴：CPU 占用时间比例（越宽越热）
  纵轴：调用栈深度（从下到上）
  颜色：随机（不影响分析）

看图口诀：
  找最宽的"平台" → CPU 占用最多的方法 → 优化目标
  找最深的"柱子" → 调用链最长的路径 → 可能有问题
```

### 1.2 火焰图类型

```
CPU 火焰图：on-CPU，分析 CPU 消耗
  → 适合：CPU 高、死循环、计算密集

Off-CPU 火焰图：off-CPU，分析阻塞和等待
  → 适合：CPU 不高但延迟大（IO 等待、锁等待、sleep）

内存火焰图：分配内存分析
  → 适合：内存分配速率高、GC 压力

系统火焰图：内核态 + 用户态
  → 适合：系统调用分析
```

---

## 二、async-profiler

### 2.1 安装

```bash
# 下载
wget https://github.com/async-profiler/async-profiler/releases/latest/async-profiler-linux-x64.tar.gz
tar xzf async-profiler-linux-x64.tar.gz
cd async-profiler-linux-x64

# 或用包管理器
# macOS: brew install async-profiler
```

### 2.2 CPU Profiling

```bash
# 基础用法
./profiler.sh -d 30 -f flame.html <pid>
# -d 30: 采样 30 秒
# -f flame.html: 输出火焰图
# <pid>: Java 进程 PID

# 指定事件类型
./profiler.sh -d 30 -e cpu -f cpu.html <pid>       # CPU 火焰图
./profiler.sh -d 30 -e alloc -f alloc.html <pid>     # 内存分配火焰图
./profiler.sh -d 30 -e lock -f lock.html <pid>       # 锁竞争火焰图
./profiler.sh -d 30 -e cache-misses -f cache.html <pid>  # 缓存未命中

# 多事件同时采样
./profiler.sh -d 30 -e cpu,alloc -f combined.html <pid>
```

### 2.3 Off-CPU Profiling

```bash
# Off-CPU：分析线程阻塞（IO、锁、sleep）
./profiler.sh -d 60 -e wall -f wall.html <pid>
# wall = wall-clock time，包括 on-CPU 和 off-CPU

# 场景：接口延迟高但 CPU 不高
# wall 火焰图能看到时间花在哪：
#   - 数据库 IO 等待
#   - HTTP 调用等待
#   - 锁等待
#   - Thread.sleep
```

---

## 三、Arthas profiler

### 3.1 基本用法

```bash
[arthas@12345]$ profiler start
# 开始采样

# 等待 30-60 秒（采样）

[arthas@12345]$ profiler stop --format html
# 停止采样，生成火焰图
# 文件保存到：arthas-output/profiler.html

# 指定输出路径
[arthas@12345]$ profiler stop --file /tmp/flame.html --format html
```

### 3.2 指定采样事件

```bash
# CPU 采样（默认）
[arthas@12345]$ profiler start --event cpu

# 内存分配采样
[arthas@12345]$ profiler start --event alloc

# 锁采样
[arthas@12345]$ profiler start --event lock

# Wall clock（包含等待时间）
[arthas@12345]$ profiler start --event wall
```

### 3.3 采样设置

```bash
# 采样间隔（纳秒，默认 10ms = 10000000ns）
[arthas@12345]$ profiler start --interval 1000000  # 1ms 间隔

# 采样时长
[arthas@12345]$ profiler start --duration 60  # 60 秒后自动停止

# 只采样指定线程
[arthas@12345]$ profiler start --threads "http-nio-8080-exec-*"
```

---

## 四、实战案例

### 4.1 案例：接口偶发慢 3 秒

```
现象：订单查询接口 P99 = 3000ms，但 CPU 使用率只有 20%
排查思路：CPU 不高但延迟大 → 用 wall 火焰图找阻塞点
```

```bash
# 1. wall 火焰图采样
[arthas@12345]$ profiler start --event wall --duration 120
# 运行 2 分钟，期间压测接口

[arthas@12345]$ profiler stop --format html

# 2. 分析火焰图
# 发现一大块"平台"在：
#   com.order.service.OrderService.findById()
#     → com.zaxxer.hikari.pool.HikariPool.getConnection()
#       → java.util.concurrent.Semaphore.acquire()
#
# 结论：数据库连接池等待！
# HikariCP 连接数不够，请求排队等待获取连接

# 3. 修复
# 增大连接池：spring.datasource.hikari.maximum-pool-size=50
# 或优化慢查询减少连接持有时间
```

### 4.2 案例：高 GC 压力

```
现象：Minor GC 每秒一次，分配速率 2GB/s
```

```bash
# 1. 内存分配火焰图
[arthas@12345]$ profiler start --event alloc --duration 60
[arthas@12345]$ profiler stop --format html

# 2. 分析火焰图
# 发现大量分配在：
#   com.order.converter.OrderConverter.toDTO()
#     → new OrderDTO()  ← 每次请求创建大量 DTO 对象
#     → new ArrayList<>()  ← 集合频繁创建
#
#   com.fasterxml.jackson.databind.ser.BeanSerializer.serialize()
#     → new ByteArrayBuilder()  ← JSON 序列化产生大字节数组

# 3. 修复
# - OrderDTO 对象池化或复用
# - 减少 JSON 序列化范围（只序列化需要的字段）
# - 用 @JsonIgnore 减少序列化字段数
# - 考虑用 Protobuf 替代 JSON
```

### 4.3 案例：锁竞争导致吞吐量上不去

```
现象：QPS 到 5000 后无法提升，CPU 60%，但线程数很多
```

```bash
# 1. 锁采样
[arthas@12345]$ profiler start --event lock --duration 60
[arthas@12345]$ profiler stop --format html

# 2. 分析火焰图
# 发现锁竞争在：
#   com.order.cache.LocalCache.get()
#     → java.util.concurrent.ConcurrentHashMap.computeIfAbsent()
#       → java.util.concurrent.ConcurrentHashMap$Segment.lock()
#
# 结论：本地缓存用 ConcurrentHashMap，computeIfAbsent 持有锁导致竞争

# 3. 修复
# - 用 Caffeine 替代 ConcurrentHashMap（更好的并发性能）
# - 或用读写锁分离
# - 或用分段锁
```

---

## 五、火焰图阅读技巧

### 5.1 找热点

```
技巧 1：找最宽的"平台"
  宽度 = CPU 时间
  最宽的平台 = 最耗时的方法
  优化它收益最大

技巧 2：找"平顶"不找"尖顶"
  平顶：方法本身耗时长（计算密集）
  尖顶：调用链长但每层耗时短（正常调用栈）

技巧 3：从栈底往上看
  栈底是入口（main / tomcat 线程）
  沿着最宽的路径往上 → 找到具体的耗时方法
```

### 5.2 常见模式

```
模式 1：底部宽，顶部窄
  → 正常，大部分时间在底层计算

模式 2：中间突然变宽
  → 某个方法本身耗时长，优化它
  例：JSON 序列化、反射调用、正则匹配

模式 3：大量细碎的小火焰
  → 线程频繁创建销毁，或任务太碎
  优化：线程池、批量处理

模式 4：wall 火焰图中一大块平的
  → 线程在等待（IO、锁、sleep）
  优化：异步化、增大并发、减少等待
```

---

## 六、JFR（Java Flight Recorder）

### 6.1 JFR 介绍

```
JFR（Java Flight Recorder）：
  JDK 内置的低开销性能采集工具
  Java 11+ 开源免费，无需商业许可
  
特点：
  - 开销 < 1%（生产环境可常开）
  - 采集事件级数据（GC、锁、IO、方法执行）
  - 输出 .jfr 文件，用 JMC（Java Mission Control）分析
```

### 6.2 使用

```bash
# 1. 启动 JFR 录制（命令行）
jcmd <pid> JFR.start name=profiling duration=60s filename=/tmp/profiling.jfr

# 2. 或在 JVM 启动时常开
-XX:StartFlightRecording=duration=60s,filename=/tmp/profiling.jfr,settings=profile

# 3. dump 录制
jcmd <pid> JFR.dump name=profiling filename=/tmp/profiling.jfr

# 4. 停止录制
jcmd <pid> JFR.stop name=profiling

# 5. 用 JMC 分析
# 下载 JMC: https://adoptium.net/jmc
# 打开 .jfr 文件，查看：
#   - 方法执行耗时（类似火焰图）
#   - GC 事件
#   - 锁竞争
#   - IO 事件
#   - 内存分配
```

---

## 七、对比总结

| 工具 | 开销 | 输出 | 优势 | 劣势 |
|------|------|------|------|------|
| async-profiler | <1% | 火焰图 HTML | 低开销、多事件 | 需要安装 |
| Arthas profiler | <1% | 火焰图 HTML | 无需额外安装 | 功能不如 async-profiler 丰富 |
| JFR | <1% | .jfr 文件 | JDK 内置、事件丰富 | 需要 JMC 分析 |
| jstack 手动 | 0 | 线程栈文本 | 简单 | 数据量少、不连续 |
| BCI（字节码注入） | 5-10% | 自定义 | 精确到方法 | 开销大 |

### 使用建议

```
日常排查 → Arthas profiler（方便快捷）
深度分析 → async-profiler（多事件、低开销）
长期监控 → JFR（常开，开销极低）
方法级观测 → Arthas trace/watch（精确到方法调用）
```

---

## 八、面试要点

### Q：线上接口慢，CPU 不高，怎么排查？

CPU 不高但慢，说明线程在等待。用 wall-clock 火焰图（async-profiler -e wall 或 Arthas profiler --event wall）采样，找最宽的"平台"定位等待点。常见原因：数据库连接池等待、HTTP 调用超时、锁竞争、Thread.sleep。

### Q：火焰图怎么看？

横轴是 CPU/时间占比，纵轴是调用栈。找最宽的"平台"——那就是 CPU 花时间最多的方法。底部宽顶部窄是正常的（底层计算耗时），中间突然变宽说明某个方法本身耗时大（优化目标）。Wall 火焰图中一大块平的表示线程在等待（IO/锁/sleep）。

### Q：async-profiler 和 JFR 怎么选？

async-profiler：生成火焰图直观、多事件类型（cpu/alloc/lock/wall）、跨平台。
JFR：JDK 内置、事件更丰富（GC/IO/锁/方法执行）、适合长期采集。
日常排查用 async-profiler/Arthas（快），生产长期监控用 JFR（开销极低）。

---

## 九、总结

火焰图排查三步法：

1. **选事件**：CPU 高用 cpu，延迟大用 wall，GC 频繁用 alloc，锁竞争用 lock
2. **采样**：Arthas profiler 或 async-profiler，采样 30-60 秒
3. **看图**：找最宽的平台，定位到具体方法，优化

记住：**CPU 高用 cpu 火焰图，延迟高用 wall 火焰图，GC 频繁用 alloc 火焰图，找最宽的平台就是优化目标**。
