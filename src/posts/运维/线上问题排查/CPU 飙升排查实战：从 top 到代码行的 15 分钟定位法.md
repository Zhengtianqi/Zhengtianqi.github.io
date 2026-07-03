---
title: CPU 飙升排查实战：从 top 到代码行的 15 分钟定位法
tag: ["CPU飙升", "Arthas", "async-profiler", "JVM调优", "线上排障"]
category: 运维
date: 2026-07-03
---

# CPU 飙升排查实战：从 top 到代码行的 15 分钟定位法

> 凌晨 3 点，你被监控告警吵醒：线上某核心服务 CPU 使用率突破 95%。用户开始反馈接口超时，此时你只有 15 分钟时间，必须在故障扩散前定位到具体的代码行。本文带你走完从告警到代码行的全链路定位过程。

## 一、CPU 飙升的常见原因全景图

在动手排查之前，先建立 CPU 飙升原因的全局认知。不同原因对应的排查工具和修复方案完全不同：

```
┌─────────────────────────────────────────────────────────────┐
│                    CPU 飙升原因分类                           │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  代码层面     │  JVM 层面    │  GC 层面     │  外部因素       │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ 死循环       │ JIT 编译     │ Full GC      │ 流量突增       │
│ 正则回溯     │ 类加载开销   │ GC 线程过多  │ 被其他进程挤占 │
│ 高频序列化   │ 线程数过多   │ GC 算法不适配│ 容器 CPU 限制  │
│ 密集计算     │ 锁自旋       │              │                │
│ 递归无终止   │              │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

**经验统计**（基于 50+ 线上案例）：

| 原因类型 | 占比 | 平均定位时间 |
|---------|------|------------|
| 代码死循环/低效循环 | 35% | 8 分钟 |
| GC 频繁导致 | 25% | 12 分钟 |
| 正则表达式回溯 | 15% | 20 分钟 |
| 流量突增/负载升高 | 10% | 5 分钟 |
| 序列化/反序列化开销 | 8% | 15 分钟 |
| 其他（锁自旋、JIT 等） | 7% | 20 分钟 |

## 二、15 分钟定位法：标准排查流程

### 2.1 排查时间线

```
时间轴：
0min  2min   4min   6min   8min   10min  12min  15min
  │     │     │     │     │     │     │     │
  ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼
 top → top -H → jstack → 线程匹配 → 代码定位 → 验证 → 修复
 │     │       │        │          │          │       │
 │     │       │        │          │          │       └─ 热修复/回滚
 │     │       │        │          │          └─ Arthas 反编译确认
 │     │       │        │          └─ 找到具体类和方法
 │     │       │        └─ nid 匹配线程栈
 │     │       └─ 抓取线程快照
 │     └─ 定位高 CPU 线程
 └─ 确认进程
```

### 2.2 第一步：top 确认目标进程（0-2 分钟）

```bash
# 执行 top，按 P 按 CPU 排序
top -c

# 关键输出示例：
#   PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND
# 28431 appuser   20   0  8.5g   3.2g   12m  S 98.6  4.1  120:35.61 java -jar order-service.jar
```

确认目标 PID 后，记住这个数字。接下来所有操作都围绕它展开。

```bash
# 也可以用一行命令快速定位
ps -eo pid,user,%cpu,cmd --sort=-%cpu | head -5
```

### 2.3 第二步：top -H 定位高 CPU 线程（2-4 分钟）

```bash
# 查看进程内各线程的 CPU 使用情况
top -H -p 28431

# 关键输出示例：
#   PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND
# 28455 appuser   20   0  8.5g   3.2g   12m  R 85.3  4.1   45:22.18 java
# 28456 appuser   20   0  8.5g   3.2g   12m  R 12.1  4.1    8:33.05 java
# 28457 appuser   20   0  8.5g   3.2g   12m  S  1.2  4.1    0:15.33 java
```

**关键操作**：记录下 CPU 最高的线程 PID（如 28455），将其转换为十六进制：

```bash
# 将十进制线程 PID 转为十六进制
printf "%x\n" 28455
# 输出: 6f37
```

### 2.4 第三步：jstack 抓取线程快照（4-6 分钟）

```bash
# 抓取线程栈（推荐抓 3 次，间隔 2 秒，对比更准确）
jstack 28431 > /tmp/thread_dump_1.txt
sleep 2
jstack 28431 > /tmp/thread_dump_2.txt
sleep 2
jstack 28431 > /tmp/thread_dump_3.txt

# 在线程栈中搜索对应的 nid（十六进制线程 ID）
grep "nid=0x6f37" /tmp/thread_dump_1.txt -A 30
```

**典型输出**：

```
"http-nio-8080-exec-12" #58 daemon prio=5 os_prio=0 tid=0x00007f8b8c4a2800 nid=0x6f37 runnable [0x00007f8b4f3f5000]
   java.lang.Thread.State: RUNNABLE
        at com.order.service.PriceCalculator.calculateBatchPrice(PriceCalculator.java:147)
        at com.order.service.OrderService.processOrder(OrderService.java:89)
        at com.order.controller.OrderController.createOrder(OrderController.java:45)
        at sun.reflect.GeneratedMethodAccessor123.invoke(Unknown Source)
        ...
```

**到这一步，你已经定位到了具体的方法和代码行。** 从第 0 分钟到现在，应该不超过 6 分钟。

### 2.5 第四步：代码确认与验证（6-10 分钟）

拿到代码行号后，查看代码：

```bash
# 查看指定行附近的代码
sed -n '140,160p' /path/to/PriceCalculator.java
```

假设定位到的问题是 `PriceCalculator.java:147` 处有一个循环：

```java
// PriceCalculator.java 第 140-160 行
public BigDecimal calculateBatchPrice(List<OrderItem> items, PricingRule rule) {
    BigDecimal total = BigDecimal.ZERO;
    // 第 147 行：问题代码 — 嵌套循环导致 O(n²) 复杂度
    for (OrderItem item : items) {
        for (PricingTier tier : rule.getTiers()) {  // 每次 rule.getTiers() 都返回新 List
            if (item.getQuantity() >= tier.getMinQty() 
                && item.getQuantity() <= tier.getMaxQty()) {
                total = total.add(item.getPrice()
                    .multiply(BigDecimal.valueOf(tier.getDiscountRate())));
                break;
            }
        }
    }
    return total;
}
```

## 三、进阶工具：Arthas 与 async-profiler

当 jstack 能定位到方法但无法确定更细节的热点时，需要使用 Arthas 或 async-profiler。

### 3.1 Arthas 定位 CPU 热点

```bash
# 下载并启动 Arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar 28431

# 方法 1：thread 命令 — 直接查看最忙的线程
[arthas@28431]$ thread -n 5
# 展示 CPU 使用率最高的 5 个线程，含完整堆栈

# 方法 2：profiler 命令 — 生成火焰图
[arthas@28431]$ profiler start
# 等待 30 秒
[arthas@28431]$ profiler stop --format html
# 生成火焰图 HTML 文件
```

**火焰图分析要点**：

```
火焰图示例（文本化表示）：

┌──────────────────────────────────────────────────────────────────┐
│                          java                                    │
├──────────────────────────────────────────────────────────────────┤
│              PriceCalculator.calculateBatchPrice (65%)           │
├──────────────────────────────────────────────────────────────────┤
│    BigDecimal.multiply (20%)  │ rule.getTiers (30%) │ 其他 (15%) │
└──────────────────────────────────────────────────────────────────┘

关键解读：
1. calculateBatchPrice 占了 65% 的 CPU — 确认是热点方法
2. rule.getTiers 占了其中的 30% — 每次调用创建新 List 的开销
3. BigDecimal.multiply 占了 20% — 可考虑用基本类型优化
```

### 3.2 Arthas trace 命令逐层定位

```bash
# 追踪方法内部各子调用的耗时
[arthas@28431]$ trace com.order.service.PriceCalculator calculateBatchPrice -n 5

# 输出示例：
# `---[15.23ms] com.order.service.PriceCalculator::calculateBatchPrice()
#     +---[0.02ms] java.util.List::size()
#     +---[4.56ms] com.order.PricingRule::getTiers()   ← 占 30%
#     +---[8.72ms] java.math.BigDecimal::multiply()    ← 占 57%
#     `---[1.93ms] java.math.BigDecimal::add()         ← 占 13%
```

### 3.3 Arthas watch 命令查看入参/返回值

```bash
# 观察方法的入参和返回值，确认是否有异常数据
[arthas@28431]$ watch com.order.service.PriceCalculator calculateBatchPrice \
  "{params, returnObj}" -x 2 -n 3

# 输出示例：
# params[0] = [OrderItem{qty=1000, price=9.9}, OrderItem{qty=500, price=19.9}, ...] (size=5000)
# params[1] = PricingRule{tiers=[...]}
# returnObj = 123456.78
```

**发现关键线索**：items 列表 size=5000，远超正常水平（通常 50-100），这是数据量异常导致的 CPU 飙升。

### 3.4 async-profiler 生成更精准的火焰图

```bash
# 下载 async-profiler
curl -L https://github.com/async-profiler/async-profiler/releases/download/v3.0/async-profiler-3.0-linux-x64.tar.gz | tar xz

# 启动 profiling（CPU 模式），采样 60 秒
./profiler.sh -d 60 -f /tmp/cpu-flame.html 28431

# 也可以指定事件类型
./profiler.sh -e cpu -d 60 -f /tmp/cpu-flame.html 28431
./profiler.sh -e alloc -d 60 -f /tmp/alloc-flame.html 28431  # 内存分配火焰图
```

**async-profiler vs Arthas profiler 对比**：

| 特性 | Arthas profiler | async-profiler |
|------|----------------|----------------|
| 侵入性 | 中（Agent 加载） | 低（JVMTI） |
| 采样精度 | 基于 JFR/ASM | 基于 perf_events |
| 对生产影响 | 较小 | 极小 |
| 支持的事件 | CPU | CPU、alloc、lock、cache-miss |
| 输出格式 | HTML | HTML、JFR、collapsed |
| 推荐场景 | 快速定位 | 深度分析 |

## 四、常见 CPU 飙升场景详解

### 4.1 场景一：死循环 / 无限循环

**代码示例**：

```java
// 典型死循环：条件永远为 true
public void processMessages(MessageQueue queue) {
    while (!queue.isEmpty()) {  // 当 queue 被并发修改时，isEmpty 可能永远返回 false
        Message msg = queue.poll();
        if (msg != null) {
            processMessage(msg);
        }
        // 如果 queue 实际为空但 isEmpty 返回 false（并发场景），
        // poll() 返回 null，processMessage 不执行，但循环不停
    }
}

// 更隐蔽的死循环：HashMap 死循环（JDK 7 多线程扩容导致链表环）
private Map<String, Object> cache = new HashMap<>();
// 多线程并发 put 可能导致环形链表，get 操作陷入死循环
```

**排查特征**：
- top -H 显示某线程 CPU 持续 100%
- jstack 多次抓取，线程栈始终在同一位置
- 线程状态为 RUNNABLE

**修复方案**：

```java
// 方案 1：使用 ConcurrentHashMap 替代 HashMap
private Map<String, Object> cache = new ConcurrentHashMap<>();

// 方案 2：为循环增加超时和重试限制
public void processMessages(MessageQueue queue) {
    long startTime = System.currentTimeMillis();
    long timeout = 30_000; // 30 秒超时
    
    while (!queue.isEmpty()) {
        if (System.currentTimeMillis() - startTime > timeout) {
            log.warn("Message processing timeout, remaining: {}", queue.size());
            break;
        }
        Message msg = queue.poll(100, TimeUnit.MILLISECONDS); // 阻塞等待，避免空转
        if (msg != null) {
            processMessage(msg);
        }
    }
}
```

### 4.2 场景二：正则表达式回溯灾难

这是最容易被忽略的 CPU 杀手之一。

**问题代码**：

```java
// 正则回溯灾难：当输入不匹配时，引擎会尝试指数级的回溯路径
private static final Pattern BAD_REGEX = 
    Pattern.compile("^(a+)+$");  // 嵌套量词导致指数级回溯

public boolean validate(String input) {
    return BAD_REGEX.matcher(input).matches();
}

// 攻击输入：当传入 "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!" (30个a + 1个!) 时
// 正则引擎需要尝试 2^30 ≈ 10亿次回溯，CPU 直接拉满
```

**排查特征**：
- jstack 显示栈在 `java.util.regex.Pattern` 相关方法
- 可能出现在任意 HTTP 请求处理线程
- 接口响应时间与输入长度呈指数关系

**修复方案**：

```java
// 方案 1：优化正则表达式，避免嵌套量词
private static final Pattern GOOD_REGEX = 
    Pattern.compile("^a+$");  // 简化正则

// 方案 2：使用占有量词（possessive quantifier）防止回溯
private static final Pattern OPTIMIZED_REGEX = 
    Pattern.compile("^(a++)+$");  // a++ 是占有量词，匹配后不回溯

// 方案 3：限制输入长度 + 使用 RE2 引擎（线性时间）
// Google RE2 引擎不支持反向引用，但保证线性时间
// Maven 依赖：com.google.re2j:re2j
import com.google.re2j.Pattern;

private static final com.google.re2j.Pattern SAFE_REGEX = 
    com.google.re2j.Pattern.compile("^(a+)+$");

public boolean validate(String input) {
    if (input.length() > 100) {  // 长度限制是第一道防线
        return false;
    }
    return SAFE_REGEX.matcher(input).matches();
}
```

### 4.3 场景三：GC 导致的 CPU 飙升

**排查方法**：

```bash
# 查看 GC 频率和耗时
jstat -gcutil 28431 1000 10

#  输出示例：
#   S0     S1     E      O      M     CCS    YGC   YGCT   FGC   FGCT    GCT
#   0.00  98.44  73.12  89.77  95.34  91.22  234  12.34   45  38.56   50.90
#   0.00  98.44  81.56  91.23  95.34  91.22  236  12.45   46  39.78   52.23
#   0.00  98.44  90.22  93.45  95.34  91.22  238  12.56   47  41.02   53.58

# 解读：
# FGC (Full GC 次数) 从 45 → 47，2 秒内发生了 2 次 Full GC
# FGCT (Full GC 总耗时) 从 38.56 → 41.02，单次约 0.7 秒
# GCT (GC 总耗时) 占比 = 53.58 / (234 * 1) ≈ 22.8% → 严重影响应用

# 查看 GC 日志（JDK 8）
tail -100 /path/to/gc.log

# JDK 11+ 使用统一日志
java -Xlog:gc*:file=/path/to/gc.log:time,uptime:filecount=10,filesize=50M -jar app.jar
```

**GC 调优示例**：

```bash
# 原始 JVM 参数（问题配置）
java -Xms2g -Xmx2g -XX:+UseParallelGC -jar order-service.jar

# 优化配置：G1GC + 合理暂停时间目标
java -Xms4g -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:G1HeapRegionSize=16m \
  -XX:InitiatingHeapOccupancyPercent=45 \
  -XX:G1ReservePercent=15 \
  -Xlog:gc*:file=/var/log/gc/gc.log:time,uptime:filecount=10,filesize=50M \
  -jar order-service.jar
```

### 4.4 场景四：高频序列化/反序列化

**问题代码**：

```java
// 每次 RPC 调用都做 JSON 序列化，大对象 + 高并发 = CPU 飙升
public class OrderClient {
    private ObjectMapper mapper = new ObjectMapper(); // 每个实例一个 ObjectMapper
    
    public String sendOrder(Order order) {
        // 大对象序列化：order 包含 1000 个子项
        return mapper.writeValueAsString(order); // 重复创建 ObjectMapper + 大对象序列化
    }
}

// 更严重的情况：XML 序列化
public String toXml(Order order) {
    JAXBContext context = JAXBContext.newInstance(Order.class); // 每次创建 Context！
    Marshaller marshaller = context.createMarshaller();
    StringWriter writer = new StringWriter();
    marshaller.marshal(order, writer);
    return writer.toString();
}
```

**排查特征**：
- jstack 栈在 `com.fasterxml.jackson` 或 `javax.xml.bind` 包
- top -H 显示多个线程都有较高 CPU

**修复方案**：

```java
// 方案 1：复用 ObjectMapper（线程安全）
public class OrderClient {
    private static final ObjectMapper MAPPER = new ObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    
    public String sendOrder(Order order) {
        return MAPPER.writeValueAsString(order);
    }
}

// 方案 2：使用更高效的序列化框架
// 如 Protobuf、Kryo、JSONB 等
public class OrderClient {
    private static final Jsonb JSONB = JsonbBuilder.create();
    
    public String sendOrder(Order order) {
        return JSONB.toJson(order);
    }
}

// 方案 3：JAXB Context 缓存
public class XmlSerializer {
    private static final JAXBContext CONTEXT;
    
    static {
        try {
            CONTEXT = JAXBContext.newInstance(Order.class, OrderItem.class);
        } catch (JAXBException e) {
            throw new RuntimeException("Failed to init JAXB", e);
        }
    }
    
    public String toXml(Order order) {
        try {
            Marshaller marshaller = CONTEXT.createMarshaller();
            StringWriter writer = new StringWriter();
            marshaller.marshal(order, writer);
            return writer.toString();
        } catch (JAXBException e) {
            throw new RuntimeException("XML marshal failed", e);
        }
    }
}
```

### 4.5 场景五：线程数过多导致的 CPU 上下文切换

```bash
# 查看线程数
jstack 28431 | grep "java.lang.Thread.State" | wc -l

# 如果超过 500，需要排查线程池配置
# 查看 CPU 上下文切换次数
vmstat 1 5

#  cs (context switch) 列：
#  r  b   swpd   free   buff  cache   in   cs us sy id wa st
#  3  0      0 234567  12345 456789 5678 12345 65 20 15  0  0
#  ↑                                      ↑
#  运行队列                                上下文切换次数
#  如果 cs 超过 50000/秒，说明线程数过多
```

**修复方案**：

```java
// 问题：每次请求创建新线程
public void process(Request req) {
    new Thread(() -> handleRequest(req)).start(); // 不可控！
}

// 修复：使用受控线程池
private static final ThreadPoolExecutor EXECUTOR = new ThreadPoolExecutor(
    32,                          // 核心线程数
    64,                          // 最大线程数
    60L, TimeUnit.SECONDS,       // 空闲存活时间
    new LinkedBlockingQueue<>(1000),  // 有界队列
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略：回退到调用线程
);

public void process(Request req) {
    EXECUTOR.submit(() -> handleRequest(req));
}
```

## 五、容器环境下的特殊注意事项

### 5.1 Docker / K8s 环境的 CPU 限制

```bash
# 在容器内 top 显示的是宿主机 CPU，容易误判
# 应该查看容器的 CPU 限制
cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us   # CPU 配额
cat /sys/fs/cgroup/cpu/cpu.cfs_period_us  # CPU 周期
# 实际 CPU 核数 = quota / period

# 例：quota=400000, period=100000 → 4 核
# 如果 top 显示 200%，但容器只有 4 核，实际使用率 = 200/400 = 50%

# JDK 10+ 会自动识别容器 CPU 限制
# JDK 8 需要添加参数
java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75 -jar app.jar
```

### 5.2 在 K8s Pod 中获取线程栈

```bash
# Pod 内通常没有 jstack，需要用 kubectl exec
kubectl exec -it pod-name -- jstack 1 > /tmp/thread_dump.txt

# 如果 Pod 内没有 JDK 工具，使用 kubectl debug
kubectl debug -it pod-name --image=openjdk:11-jdk --target=container-name
# 在 debug 容器中执行 jstack

# 或者使用 arthas 在容器中启动
kubectl exec -it pod-name -- java -jar /path/to/arthas-boot.jar
```

## 六、CPU 飙升排查决策树

```
                    CPU 飙升告警
                         │
                         ▼
                   top 确认进程
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Java 进程   非Java进程   多进程
              │                      │
              ▼                      ▼
         top -H              排查其他进程
         定位线程
              │
              ▼
         jstack 抓栈
         nid 匹配
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
  代码方法  GC 相关   线程数过多
    │         │          │
    ▼         ▼          ▼
  Arthas   jstat      vmstat
  trace    分析       看 cs 次数
    │         │          │
    ▼         ▼          ▼
  定位到    GC 调优    线程池
  代码行    或排查     限制
    │      内存泄漏
    ▼
  修复代码
```

## 七、紧急处理 SOP

当 CPU 飙升需要立即处理时，按以下优先级执行：

```bash
# Step 1: 确认是否为单实例（如果是多实例，先摘除故障节点）
curl -X POST http://gateway/admin/deregister -d '{"service":"order-service","instance":"10.0.1.23:8080"}'

# Step 2: 抓取诊断数据（15 秒内完成）
PID=$(jps | grep order | awk '{print $1}')
jstack $PID > /tmp/jstack_$(date +%s).txt
jstat -gcutil $PID 1000 5 > /tmp/gcstat_$(date +%s).txt
top -H -b -n 1 -p $PID > /tmp/topH_$(date +%s).txt

# Step 3: 快速分析
# 查看高 CPU 线程
grep -A 20 "nid=0x$(printf '%x' $(tail -1 /tmp/topH_*.txt | awk '{print $1}'))" /tmp/jstack_*.txt

# Step 4: 如果确认是代码问题，热修复或回滚
# 如果是流量突增，限流降级
curl -X POST http://gateway/admin/limit -d '{"service":"order-service","qps":100}'
```

## 八、面试要点

### Q1: 线上 CPU 飙升到 100%，你的排查步骤是什么？

**参考回答**：

> 1. 用 `top` 命令确认是哪个 Java 进程 CPU 高
> 2. 用 `top -H -p <pid>` 查看进程内哪个线程 CPU 高，记录线程 PID
> 3. 用 `printf "%x\n" <tid>` 将线程 PID 转为十六进制
> 4. 用 `jstack <pid>` 抓取线程栈，搜索对应的 nid
> 5. 分析线程栈定位到具体方法
> 6. 用 Arthas `trace` 或 `profiler` 进一步确认热点
> 7. 查看代码修复问题
> 
> 如果是 GC 导致的，用 `jstat -gcutil` 查看 GC 频率和耗时，分析 GC 日志。

### Q2: 正则表达式导致 CPU 飙升的原因是什么？如何避免？

**参考回答**：

> 正则表达式的回溯灾难（ReDoS）。当正则中使用嵌套量词（如 `(a+)+`）或重叠分支时，对于不匹配的输入，引擎会尝试指数级的回溯路径。
> 
> 避免方法：
> 1. 避免嵌套量词
> 2. 使用占有量词 `++`、`?+`、`*+`
> 3. 限制输入长度
> 4. 使用 RE2 引擎（线性时间保证）

### Q3: Arthas 和 async-profiler 的原理区别是什么？

**参考回答**：

> - **Arthas** 基于 ASM 字节码注入，通过修改方法入口和出口植入采样代码，侵入性相对较高但功能更丰富（可以 watch、trace、monitor 等）
> - **async-profiler** 基于 Linux `perf_events` 和 JVMTI，通过操作系统级的信号采样获取调用栈，侵入性极低，对生产环境影响小
> - Arthas 更适合交互式排查（查看参数、反编译），async-profiler 更适合长时间的性能采样分析

### Q4: 容器环境下 CPU 排查有什么不同？

**参考回答**：

> 1. `top` 命令显示的是宿主机 CPU，需要结合 cgroup 限制判断实际使用率
> 2. 容器内可能没有 JDK 工具，需要通过 `kubectl debug` 注入诊断容器
> 3. JDK 8 默认不识别容器 CPU 限制，需要加 `-XX:+UseContainerSupport`
> 4. CPU 限制可能导致 JVM 的 GC 线程数、编译线程数计算异常，需要手动指定

## 九、避坑指南

### 坑 1：top 在容器中看到的 CPU 不准

容器内 `top` 默认显示宿主机所有 CPU 的数据。一个限制为 2 核的容器中，如果 top 显示 CPU 使用率 50%，实际可能是 100%（2/2 核）。

**解决方案**：使用 `cat /sys/fs/cgroup/cpu/stat` 或在监控系统中读取 cgroup 级别的 CPU 数据。

### 坑 2：jstack 抓取时应用 STW

`jstack` 本身不会导致 STW（Stop The World），但如果使用 `jmap -heap` 或 `jmap -dump` 则会。排查 CPU 问题时只用 jstack 和 jstat，不要用 jmap。

### 坑 3：Arthas 的 trace 影响性能

`trace` 命令会在方法入口出口注入代码，高并发场景下可能放大延迟。生产环境建议：
- 限制采样次数：`-n 5`
- 精确匹配类名：避免 `trace *.*`
- 及时关闭：用完执行 `stop` 退出

### 坑 4：忽视 JIT 编译带来的短暂 CPU 飙升

JVM 启动初期或方法被频繁调用触发 JIT 编译时，CPU 会短暂飙升。这是正常现象，通常持续 10-30 秒后回落。如果 CPU 飙升后不回落，才需要深入排查。

### 坑 5：多实例环境下只看一个节点

多实例部署时，可能是负载不均导致单节点 CPU 飙升。排查时先看整体 QPS 分布：

```bash
# 检查各实例 QPS
for ip in 10.0.1.{21..25}; do
    echo "$ip: $(curl -s http://$ip:8080/metrics | grep http_requests_total | tail -1)"
done
```

如果某节点 QPS 是其他节点的 3-5 倍，先排查负载均衡配置。

## 十、预防体系建设

### 10.1 监控告警配置

```yaml
# Prometheus 告警规则示例
groups:
  - name: cpu-alerts
    rules:
      - alert: HighCpuUsage
        expr: |
          100 - (avg by(instance) 
          (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage > 80% on {{ $labels.instance }}"
          
      - alert: CpuSpikeDetected
        expr: |
          deriv(container_cpu_usage_seconds_total{container="app"}[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CPU usage rapidly increasing on {{ $labels.instance }}"
```

### 10.2 自动化诊断脚本

```bash
#!/bin/bash
# auto-cpu-diag.sh — CPU 飙升自动诊断脚本
# 部署到所有 Java 节点，由告警触发

THRESHOLD=80
PID=$(jps | grep -v Jps | awk '{print $1}')

CURRENT_CPU=$(top -b -n 1 -p $PID | tail -1 | awk '{print $9}')

if (( $(echo "$CURRENT_CPU > $THRESHOLD" | bc -l) )); then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    DIR="/tmp/cpu-diag/$TIMESTAMP"
    mkdir -p $DIR
    
    echo "[$(date)] CPU: ${CURRENT_CPU}% — capturing diagnostics..."
    top -H -b -n 3 -p $PID > $DIR/top_h.txt
    jstack $PID > $DIR/jstack.txt
    jstat -gcutil $PID 1000 10 > $DIR/gcstat.txt
    
    # 自动提取高 CPU 线程的栈
    HIGH_TID=$(head -10 $DIR/top_h.txt | grep -v "PID" | head -1 | awk '{print $1}')
    HEX_TID=$(printf "%x\n" $HIGH_TID)
    grep "nid=0x$HEX_TID" $DIR/jstack.txt -A 30 > $DIR/hot_thread.txt
    
    echo "Diagnostics saved to $DIR"
    echo "Hot thread nid: 0x$HEX_TID"
    cat $DIR/hot_thread.txt
fi
```

### 10.3 Code Review CPU 风险 Checklist

| 检查项 | 说明 | 风险等级 |
|-------|------|---------|
| 循环内是否有重复计算 | 如每次 `rule.getTiers()` 返回新对象 | 高 |
| 是否有正则表达式校验 | 检查是否存在嵌套量词 | 高 |
| 序列化对象是否过大 | 大对象 JSON 序列化开销大 | 中 |
| 线程池配置是否合理 | 无界队列 + 无限线程 | 高 |
| 是否有递归调用 | 缺少终止条件 | 高 |
| BigDecimal 是否频繁创建 | 循环中频繁 new BigDecimal | 中 |
| Map/List 初始容量是否指定 | 频繁扩容消耗 CPU | 低 |

## 总结

CPU 飙升排查的核心链路：**top → top -H → jstack → nid 匹配 → 代码行**，这条链路在 95% 的场景中都能快速定位问题。Arthas 和 async-profiler 是两个关键的进阶工具，前者适合交互式排查，后者适合深度性能分析。

记住三点：
1. **先确认是 Java 进程还是其他进程**，别一上来就 jstack
2. **GC 导致的 CPU 飙升很常见**，jstat 一看便知
3. **正则回溯是最容易被忽略的 CPU 杀手**，对用户输入的正则校验要特别留意
