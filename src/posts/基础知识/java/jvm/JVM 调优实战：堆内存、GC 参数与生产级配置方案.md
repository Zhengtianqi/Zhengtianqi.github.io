---
title: JVM 调优实战：堆内存、GC 参数与生产级配置方案
tag: ["JVM", "GC", "调优", "G1", "ZGC", "生产环境"]
category: 基础知识
date: 2026-07-02
---

# JVM 调优实战：堆内存、GC 参数与生产级配置方案

线上 GC 频繁？STW 太长？堆配多大合适？G1 和 ZGC 怎么选？JVM 调优不是背参数，而是理解内存模型 + GC 原理 + 线上验证的系统工程。

---

## 一、JVM 内存模型回顾

### 1.1 堆内存结构

```
┌───────────────────────────────────────────────────┐
│                    JVM Heap                        │
├─────────────────┬─────────────────────────────────┤
│  Young Generation│       Old Generation            │
│  (Young Gen)     │       (Old Gen)                 │
├──────┬──────────┤                                  │
│ Eden │ S0 | S1  │                                  │
│ 80%  │10%| 10%  │                                  │
├──────┴──────────┴─────────────────────────────────┤
│  Young : Old = 1 : 2（默认）                       │
│  Eden : S0 : S1 = 8 : 1 : 1                       │
└───────────────────────────────────────────────────┘

对象生命周期：
  new → Eden → Minor GC → S0/S1 → 经过多次 GC 仍存活 → Old Gen
                                                         ↓
                                                    Major GC / Full GC
```

### 1.2 堆外内存

```
除了堆，JVM 还使用以下内存：

Metaspace（元空间，Java 8+）：
  存储类元数据，替代永久代
  默认无上限（受物理内存限制），建议设置上限

Direct Memory（直接内存）：
  NIO ByteBuffer.allocateDirect() 分配
  Netty 大量使用，不受堆大小限制

Thread Stack（线程栈）：
  每个线程默认 1MB
  500 个线程 = 500MB

Code Cache（代码缓存）：
  JIT 编译后的机器码
  默认 240MB

JVM 自身：
  GC 数据结构、标记位图等
  约为堆大小的 5-10%
```

---

## 二、GC 算法选型

### 2.1 GC 对比

| GC | Java 版本 | STW | 堆大小 | 适合场景 | 吞吐量 | 延迟 |
|----|----------|-----|--------|---------|--------|------|
| Serial | 8+ | 长 | <100MB | 单核 | 高 | 高 |
| Parallel | 8+ | 中 | <4GB | 批处理 | 最高 | 中 |
| CMS | 8-14 | 短(并发) | <8GB | 低延迟(已废弃) | 中 | 低 |
| G1 | 9+(默认) | 可控 | 4-32GB | 通用 | 中高 | 低 |
| ZGC | 15+(生产) | <1ms | 8TB+ | 超低延迟 | 中 | 极低 |
| Shenandoah | 15+ | <10ms | 8TB+ | 低延迟 | 中 | 极低 |

### 2.2 选型决策

```
堆 < 4GB → Parallel（吞吐量优先）或 G1
堆 4-32GB → G1（通用推荐）
堆 > 32GB → ZGC（超低延迟）
延迟敏感（<10ms STW）→ ZGC
吞吐量优先（批处理）→ Parallel
Java 17+ 新项目 → G1（默认）或 ZGC（延迟敏感）
```

---

## 三、G1 调优实战

### 3.1 G1 核心概念

```
G1（Garbage First）将堆划分为多个 Region（区域）：

┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│E │E │S │O │O │H │H │O │E │O │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│O │E │E │O │S │O │H │O │E │O │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│E │O │O │E │O │O │E │O │S │O │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘

E = Eden  S = Survivor  O = Old  H = Humongous（大对象）

Region 大小：1-32MB（自动计算，堆/2048）
每个 Region 可以动态切换角色

G1 回收策略：
  1. 选择回收价值最高的 Region（Garbage First）
  2. 预测停顿时间：MaxGCPauseMillis（默认 200ms）
  3. 不回收所有 Region，只回收收益最高的
```

### 3.2 G1 关键参数

```bash
# 基础配置
-XX:+UseG1GC                          # 使用 G1
-Xms4g -Xmx4g                         # 堆大小（建议 Xms = Xmx，避免动态扩容）
-XX:MaxGCPauseMillis=200              # 目标停顿时间（不是硬保证）
-XX:G1HeapRegionSize=8m               # Region 大小（默认自动，建议手动设）

# 分代调优
-XX:InitiatingHeapOccupancyPercent=45 # 老年代占用率触发并发标记（默认45%）
-XX:G1NewSizePercent=5                # 新生代最小比例（默认5%）
-XX:G1MaxNewSizePercent=60            # 新生代最大比例（默认60%）
-XX:G1ReservePercent=10               # 预留内存比例（防止疏散失败）

# 混合回收
-XX:G1MixedGCCountTarget=8            # 混合回收次数（分多次回收老年代）
-XX:G1OldCSetRegionThresholdPercent=10 # 每次混合回收的老年代 Region 上限

# 大对象
-XX:G1HeapWastePercent=5              # 允许浪费的堆比例
```

### 3.3 生产环境 G1 配置模板

```bash
# 4-8GB 堆（中型应用）
-XX:+UseG1GC
-Xms6g -Xmx6g
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=4m
-XX:InitiatingHeapOccupancyPercent=35
-XX:ConcGCThreads=4
-XX:ParallelGCThreads=8
-XX:+ParallelRefProcEnabled           # 并行处理引用
-XX:+UseStringDeduplication           # 字符串去重

# 16-32GB 堆（大型应用）
-XX:+UseG1GC
-Xms24g -Xmx24g
-XX:MaxGCPauseMillis=100              # 更低延迟
-XX:G1HeapRegionSize=16m              # 更大 Region
-XX:InitiatingHeapOccupancyPercent=30
-XX:ConcGCThreads=8
-XX:ParallelGCThreads=16
-XX:+ParallelRefProcEnabled
-XX:+UseStringDeduplication
-XX:G1ReservePercent=15               # 更大预留
```

---

## 四、ZGC 调优实战

### 4.1 ZGC 特点

```
ZGC（Z Garbage Collector）：
  - STW < 1ms（Java 16+）
  - 支持 8TB 堆
  - 并发标记 + 并发转移 + 并发重定位
  - 染色指针技术（64 位指针中借用 bit 存 GC 状态）

  适合：堆 > 16GB，延迟要求 < 10ms
```

### 4.2 ZGC 配置

```bash
# Java 17+
-XX:+UseZGC
-Xms16g -Xmx16g
-XX:SoftMaxHeapSize=12g               # 软上限，尽量保持堆不超过此值
-XX:ZCollectionInterval=120           # GC 间隔（秒），0=仅按需
-XX:ZAllocationSpikeTolerance=2.0     # 分配突发容忍度

# Java 21+ 分代 ZGC（推荐）
-XX:+UseZGC
-XX:+ZGenerational                    # 分代 ZGC（Java 21+）
-Xms16g -Xmx16g

# 分代 ZGC 性能更好：
#   新生代频繁回收（STW <1ms）
#   老年代低频回收
#   整体吞吐量提升 10-20%
```

---

## 五、常见调优场景

### 5.1 Minor GC 频繁

```
现象：Minor GC 每秒一次，每次 STW 50ms
原因：Eden 区太小，对象快速填满

方案 1：增大新生代
-XX:G1NewSizePercent=30    # 默认 5%，调大到 30%
-XX:G1MaxNewSizePercent=50 # 默认 60%

方案 2：增大整个堆
-Xms8g -Xmx8g  # 从 4g 增到 8g

方案 3：减少对象分配
- 检查是否有循环内创建大量临时对象
- 用对象池复用
- 用基本类型替代包装类
```

### 5.2 Full GC 频繁

```
现象：Full GC 每隔几分钟一次，STW 2-5 秒

排查步骤：
1. jstat -gc <pid> 1000 → 观察 GC 趋势
2. 看 Old Gen 增长速度
3. 看 Metaspace 是否溢出

常见原因：
  ① 老年代太小 → 增大堆或调 IHOP
  ② 内存泄漏 → dump 分析
  ③ Metaspace 不足 → -XX:MaxMetaspaceSize=512m
  ④ System.gc() 被调用 → -XX:+DisableExplicitGC
  ⑤ 大对象直接进老年代 → -XX:G1HeapRegionSize 调大

调参：
-XX:InitiatingHeapOccupancyPercent=35  # 提前触发并发标记（默认45%）
-XX:+DisableExplicitGC                 # 禁止 System.gc()
```

### 5.3 GC 停顿过长

```
现象：G1 的 Mixed GC 停顿 500ms+，超过 MaxGCPauseMillis

方案 1：降低 MaxGCPauseMillis
-XX:MaxGCPauseMillis=100  # 从 200 降到 100

方案 2：减少每次回收的 Region 数
-XX:G1OldCSetRegionThresholdPercent=5  # 从 10 降到 5

方案 3：增加 GC 线程
-XX:ParallelGCThreads=16   # 默认是 CPU 核数的 5/8
-XX:ConcGCThreads=4        # 默认是 ParallelGCThreads 的 1/4

方案 4：切换 ZGC（如果 Java 17+）
-XX:+UseZGC  # STW < 1ms
```

### 5.4 高分配速率导致 GC 压力

```
现象：对象分配速率 1GB/s，GC 跟不上

诊断：
jcmd <pid> GC.heap_info  # 观察分配速率

优化：
1. 减少对象创建
   - 循环外创建对象
   - StringBuilder 替代字符串拼接
   - 基本类型数组替代集合

2. 对象生命周期分析
   - 短命对象：正常，优化 Eden 大小
   - 中命对象：可能过早晋升，调大晋升阈值
   - 长命对象：检查是否真正需要长存

3. TLAB 调优（Thread Local Allocation Buffer）
   -XX:+UseTLAB                # 默认开启
   -XX:TLABSize=256k           # 增大 TLAB，减少竞争
   -XX:-ResizeTLAB             # 禁止自动调整
```

---

## 六、JVM 监控工具

### 6.1 命令行工具

```bash
# 1. jstat：GC 统计
jstat -gc <pid> 1000 10
# 每秒打印一次，共 10 次
#  S0C    S1C    S0U    S1U    EC     EU     OC     OU     MC     YGC  YGCT  FGC FGCT  GCT
# 20480.0 20480.0 0.0    1536.0 163840.0 81920.0 327680.0 163840.0 78656.0 15  0.234 2  0.456 0.690

# 2. jcmd：多功能诊断
jcmd <pid> GC.heap_info           # 堆信息
jcmd <pid> GC.run                 # 触发 GC
jcmd <pid> Thread.print           # 线程栈
jcmd <pid> VM.flags               # JVM 参数

# 3. jmap：堆 dump
jmap -dump:format=b,file=heap.hprof <pid>
jmap -histo <pid> | head -20      # 对象直方图 Top 20

# 4. jstack：线程栈
jstack <pid> > thread_dump.txt
jstack -l <pid>                   # 包含锁信息
```

### 6.2 GC 日志分析

```bash
# Java 9+ GC 日志配置（JEP 158 统一日志）
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20m

# 日志格式示例（G1）：
# [2.345s][info][gc,start] GC(1) Pause Young (Normal) (G1 Evacuation Pause)
# [2.345s][info][gc,phases] GC(1) Pre Evacuate Collection Set: 0.1ms
# [2.345s][info][gc,phases] GC(1) Evacuate Collection Set: 45.2ms
# [2.390s][info][gc,heap] GC(1) Eden regions: 100->0(100)
# [2.390s][info][gc,heap] GC(1) Old regions: 50->52
# [2.390s][info][gc ] GC(1) Pause Young (Normal) 200M->120M(512M) 45.234ms

# 关键指标：
# - GC 类型（Young/Mixed/Full）
# - GC 前后堆使用量（200M->120M）
# - GC 耗时（45.234ms）
# - GC 频率和间隔
```

### 6.3 GCEasy / GCViewer 在线分析

```
将 gc.log 上传到 https://gceasy.io 分析：

关键指标：
  - Throughput（吞吐量）：应用运行时间 / 总时间，目标 > 95%
  - Average GC Time：平均 GC 耗时
  - Max GC Time：最大 GC 耗时
  - GC 频率分布
  - 堆使用率趋势图

  健康：吞吐量 > 95%，平均 GC < 100ms，无 Full GC
  不健康：吞吐量 < 90%，平均 GC > 500ms，频繁 Full GC
```

---

## 七、生产环境完整 JVM 配置

### 7.1 中型应用（8C 16G 服务器）

```bash
# 推荐配置
-XX:+UseG1GC
-Xms8g -Xmx8g
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=4m
-XX:InitiatingHeapOccupancyPercent=35
-XX:ParallelGCThreads=6
-XX:ConcGCThreads=2
-XX:+ParallelRefProcEnabled
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:MaxMetaspaceSize=512m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
```

### 7.2 大型应用（32C 64G 服务器）

```bash
# Java 17+ 推荐 ZGC
-XX:+UseZGC
-XX:+ZGenerational
-Xms48g -Xmx48g
-XX:SoftMaxHeapSize=40g
-XX:ConcGCThreads=8
-XX:ParallelGCThreads=16
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:MaxMetaspaceSize=1g
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=10,filesize=50m
```

### 7.3 容器环境（K8s Pod）

```bash
# 容器内 JVM 注意事项：
-XX:+UseContainerSupport              # 自动感知容器内存限制（Java 10+，默认开启）
-XX:InitialRAMPercentage=50.0         # 初始堆 = 容器内存 × 50%
-XX:MaxRAMPercentage=75.0             # 最大堆 = 容器内存 × 75%
# 不要用 -Xms -Xmx，让 JVM 根据容器限制自动计算

# K8s YAML 配置
# resources:
#   limits:
#     memory: "4Gi"
#   requests:
#     memory: "3Gi"
# JVM 自动设置堆大小 = 4Gi × 75% = 3Gi
# 预留 1Gi 给堆外内存 + JVM 自身
```

---

## 八、调优方法论

### 8.1 调优流程

```
1. 基线测量
   - 记录当前 GC 日志、堆使用、响应时间
   - 用 jstat / GCEasy 获取基线数据

2. 确定目标
   - 吞吐量优先：吞吐量 > 95%，GC 总时间 < 5%
   - 延迟优先：单次 GC STW < 100ms
   - 不能两者兼顾，按业务选

3. 一次只调一个参数
   - 改一个参数 → 压测 → 对比基线
   - 不要一次改多个参数

4. 压测验证
   - 用 wrk / JMeter 模拟生产流量
   - 至少运行 30 分钟观察 GC 趋势
   - 关注 Young GC 频率、Mixed GC 停顿、Full GC 次数

5. 灰度上线
   - 先在一台机器验证
   - 监控 24h GC 日志
   - 逐步推广到全量
```

### 8.2 调优检查清单

```
□ Xms == Xmx（避免动态扩容导致 Full GC）
□ MaxMetaspaceSize 有上限（防止元空间无限增长）
□ HeapDumpOnOutOfMemoryError 开启（OOM 自动 dump）
□ DisableExplicitGC 开启（防止 System.gc() 干扰）
□ GC 日志开启（线上必备）
□ ParallelRefProcEnabled 开启（G1 并行引用处理）
□ 容器环境用 RAMPercentage 而非 Xmx
□ Region 大小 = 堆大小 / 2048，且在 1-32MB 范围内
□ IHOP 根据老年代增长速度调整（35-45%）
□ GC 线程数 = CPU 核数的 5/8（G1 默认，不要随意改）
```

---

## 九、面试要点

### Q：线上 GC 频繁怎么排查？

1. `jstat -gc <pid> 1000` 观察 GC 趋势，确定是 Minor GC 还是 Full GC 频繁
2. Minor GC 频繁：Eden 太小，增大新生代或整个堆
3. Full GC 频繁：
   - 老年代太小 → 增大堆或降低 IHOP
   - 内存泄漏 → jmap dump + MAT 分析
   - Metaspace 不足 → 增大 MaxMetaspaceSize
   - System.gc() → 加 -XX:+DisableExplicitGC
4. 分析 GC 日志：GCEasy 看吞吐量和停顿分布

### Q：G1 和 ZGC 怎么选？

G1：堆 4-32GB，STW 目标 100-200ms，Java 9+ 默认，通用场景首选。
ZGC：堆 > 16GB，STW 目标 < 10ms，Java 17+ 生产可用，延迟敏感场景首选。
Java 21+ 用分代 ZGC（-XX:+ZGenerational），吞吐量接近 G1，延迟远优于 G1。

### Q：Xms 和 Xmx 为什么建议设成一样？

如果 Xms < Xmx，JVM 堆会动态扩容。每次扩容可能触发 Full GC（重新规划内存区域），导致不可预期的停顿。设成一样避免动态扩容，同时 JVM 启动时就 commit 全部内存，运行时更稳定。

---

## 十、总结

JVM 调优三原则：

1. **先测量再调优**：没有基线数据不要调参
2. **一次调一个参数**：科学实验方法
3. **GC 日志是关键**：所有调优依据来自 GC 日志

记住：**G1 通用首选，ZGC 延迟首选，Xms=Xmx，IHOP 35%，日志必备**。
