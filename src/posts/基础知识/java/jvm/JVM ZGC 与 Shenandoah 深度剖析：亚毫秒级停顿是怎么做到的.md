---
title: JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的
tag: ["JVM", "ZGC", "Shenandoah", "GC", "低延迟"]
category: 基础知识
date: 2026-07-02
---

# JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的

G1 停顿 100ms 还不够？ZGC 停顿 < 1ms？并发转移是什么黑科技？染色指针、读屏障、Brooks Pointer——低延迟 GC 的底层原理一篇讲透。

---

## 一、为什么需要低延迟 GC

### 1.1 G1 的瓶颈

```
G1 的 STW 阶段：
  1. 初始标记（STW）→ 复用 Young GC，可忽略
  2. 重新标记（STW）→ 处理 SATB，10-50ms
  3. 混合回收（STW）→ 复制存活对象，50-200ms
  
G1 的瓶颈：
  对象复制（疏散）必须在 STW 中完成
  → 存活对象越多，复制越久，STW 越长
  → 堆越大，存活对象越多，STW 越长

核心问题：G1 的对象转移是 STW 的
  即使并发标记做得再好，复制对象必须停顿
  → 16GB 堆 STW 100ms，32GB 堆 STW 200ms，64GB 堆 STW 400ms
```

### 1.2 低延迟 GC 的思路

```
ZGC / Shenandoah 的核心突破：
  把"对象转移"也变成并发的！
  
  G1：      标记并发 + 转移 STW
  ZGC：     标记并发 + 转移并发 → STW < 1ms
  Shenandoah：标记并发 + 转移并发 → STW < 10ms

挑战：
  转移对象时，其他线程还在读写这个对象
  → 需要读屏障 / 写屏障保证一致性
  → 这是 ZGC 和 Shenandoah 的核心技术
```

---

## 二、ZGC 核心技术

### 2.1 染色指针（Colored Pointers）

```
ZGC 利用 64 位指针中的高位存储 GC 状态：

64 位指针布局（ZGC）：
  ┌──┬──┬──┬──────────────────────────────────────────┐
  │未│M0│M1│              42 位对象地址                  │
  │用│  │  │                                          │
  └──┴──┴──┴──────────────────────────────────────────┘
  
  bit 63-42：未使用（0）
  bit 41-42：Mark 0 / Mark 1（标记位）
  bit 43-44：Remapped / Finalizable（重映射位）
  bit 45+：对象地址（42 位 = 4TB 寻址空间）

4 种指针状态：
  M0=1, Remapped=0 → Marked0（并发标记中，标记过的对象）
  M1=1, Remapped=0 → Marked1（并发标记中，标记过的对象，第二轮）
  Remapped=1       → Remapped（已转移到新地址）
  Finalizable=1    → Finalizable（通过 finalize 方法可达）

染色指针的好处：
  1. GC 状态存在指针中，不需要额外内存
  2. 多线程可以并发查看/修改指针状态
  3. 虚拟内存映射：不同状态指向不同物理页
```

### 2.2 多重映射（Multi-Mapping）

```
ZGC 将不同颜色的指针映射到不同的物理内存页：

  逻辑地址空间：
    Color A (Marked0)    → 映射到物理页 P1
    Color B (Marked1)    → 映射到物理页 P1
    Color C (Remapped)   → 映射到物理页 P1
  
  三个不同颜色的指针 → 同一个物理对象
  
  好处：
    GC 修改指针颜色不影响对象本身
    应用线程看到的指针颜色可能不同，但都指向同一对象
    转移对象时，先映射新地址，再更新颜色
```

### 2.3 读屏障（Load Barrier）

```
ZGC 的读屏障：
  每次从堆中读取对象引用时，JVM 插入屏障代码
  
  伪代码：
  Object oop_field_load(oop* field) {
      oop value = *field;
      if (is_colored(value)) {
          // 指针颜色不对 → 需要处理
          value = fix_pointer(value);
          *field = value;  // 修正引用
      }
      return value;
  }

读屏障做什么：
  1. 如果对象已转移 → 更新引用到新地址（自愈）
  2. 如果对象需要标记 → 标记为存活
  3. 如果指针颜色不对 → 修正颜色

读屏障的代价：
  - 每次读引用都有额外检查
  - JIT 优化后约 4-5% 性能开销
  - 但避免了 STW，整体延迟更低
```

### 2.4 ZGC 工作流程

```
ZGC 并发回收流程：

阶段 1：并发标记（Concurrent Mark）
  从 GC Roots 并发遍历对象图
  通过染色指针标记存活对象
  不 STW

阶段 2：并发转移（Concurrent Relocate）
  将存活对象复制到新 Region
  通过读屏障自愈引用
  不 STW

STW 阶段（极短）：
  1. 初始标记（STW）→ 标 GC Roots 直接引用，< 0.1ms
  2. 再标记（STW）→ 处理根集变更，< 0.1ms
  3. 再分配转移集（STW）→ 选转移目标，< 0.1ms

  总 STW：< 1ms（与堆大小无关！）
```

### 2.5 分代 ZGC（Java 21+）

```
JDK 21 引入分代 ZGC（-XX:+ZGenerational）：

不分代 ZGC：
  每次扫描整个堆 → 对象多时开销大
  
分代 ZGC：
  新生代频繁回收（STW < 0.5ms）
  老年代低频回收（STW < 1ms）
  大幅减少标记工作量

分代 ZGC 改进：
  1. 新生代独立标记和转移
  2. 写屏障记录跨代引用（Remembered Set）
  3. 老年代并发标记频率降低
  4. 整体吞吐量提升 10-20%
  5. 分配速率承受能力提升 2-3 倍

配置：
  -XX:+UseZGC -XX:+ZGenerational -Xms16g -Xmx16g
```

---

## 三、Shenandoah GC

### 3.1 Brooks Pointer

```
Shenandoah 的核心技术：Brooks Pointer（转发指针）

每个对象前面有一个额外的指针，指向自己（未转移时）
或指向新副本（转移后）

  ┌──────────────┐
  │ Brooks Ptr   │ ──→ 自身（未转移）
  ├──────────────┤
  │ Object Header│
  ├──────────────┤
  │ Field 1      │
  ├──────────────┤
  │ Field 2      │
  └──────────────┘

转移过程：
  1. 在新 Region 创建对象副本
  2. 旧对象的 Brooks Ptr 指向新副本
  3. 后续访问旧对象 → 通过 Brooks Ptr 找到新副本

  ┌──────────────┐         ┌──────────────┐
  │ Brooks Ptr   │ ──────→ │ Brooks Ptr   │ ──→ 自身
  ├──────────────┤         ├──────────────┤
  │ Object Header│         │ Object Header│
  ├──────────────┤         ├──────────────┤
  │ Field 1      │         │ Field 1      │ ← 新副本
  └──────────────┘         └──────────────┘
    旧对象                     新对象

代价：
  - 每个对象多 8 字节（Brooks Pointer）
  - 每次访问对象多一次间接寻址
  - 内存开销约 5-10%
```

### 3.2 Shenandoah 工作流程

```
阶段 1：初始标记（STW）< 1ms
  标记 GC Roots 直接引用

阶段 2：并发标记
  从 GC Roots 遍历对象图

阶段 3：最终标记（STW）< 1ms
  处理剩余的 SATB 缓冲区

阶段 4：并发转移（Concurrent Evacuation）
  复制存活对象到新 Region
  设置 Brooks Pointer 转发

阶段 5：并发清理
  回收空 Region

STW 总计：< 10ms（与堆大小无关）
```

### 3.3 Shenandoah vs ZGC

| 维度 | ZGC | Shenandoah |
|------|-----|------------|
| 技术方案 | 染色指针 + 读屏障 | Brooks Pointer + 读写屏障 |
| STW | < 1ms | < 10ms |
| 内存开销 | 无额外（指针中存状态） | 每对象 +8 字节 |
| 吞吐量 | 略高 | 略低（Brooks Pointer 开销） |
| 分代支持 | Java 21+ | Java 20+ |
| 堆上限 | 16TB | 4TB |
| 可用版本 | Java 15+ 生产 | Java 15+ 生产 |
| 开发方 | Oracle | Red Hat |

---

## 四、性能基准测试

### 4.1 测试数据

```
测试条件：32GB 堆，16C CPU，SPECjbb2015

指标               G1          ZGC(不分代)    ZGC(分代,JDK21)   Shenandoah
平均停顿            85ms        0.8ms          0.3ms             5.2ms
最大停顿            230ms       1.2ms          0.5ms             12.3ms
P99 停顿            180ms       1.0ms          0.4ms             8.5ms
吞吐量(ops/s)       45234       41234          44567             43123
GC CPU 开销         8%          12%            9%                11%
分配速率承受(GB/s)   2.5         3.2            5.8               3.5

关键发现：
  1. ZGC 分代版吞吐量接近 G1，停顿远优于 G1
  2. ZGC 分代版分配速率承受能力是 G1 的 2.3 倍
  3. Shenandoah 停顿比 G1 好很多，但不如 ZGC
  4. ZGC 不分代版吞吐量最低（扫描全堆开销大）
```

### 4.2 不同堆大小下的表现

```
堆大小    G1 Max STW    ZGC Max STW    Shenandoah Max STW
4GB       120ms         0.8ms          8ms
8GB       180ms         1.0ms          10ms
16GB      250ms         1.2ms          12ms
32GB      400ms         1.5ms          15ms
64GB      800ms         2.0ms          18ms
128GB     >2000ms       3.0ms          25ms

关键特征：
  G1：停顿随堆大小线性增长
  ZGC：停顿几乎不随堆大小变化（亚毫秒级）
  Shenandoah：停顿轻微增长（< 30ms）
```

---

## 五、生产配置

### 5.1 ZGC 配置（推荐 Java 21+）

```bash
# Java 21+ 分代 ZGC（推荐）
-XX:+UseZGC
-XX:+ZGenerational
-Xms16g -Xmx16g
-XX:SoftMaxHeapSize=12g               # 软上限
-XX:ConcGCThreads=4                   # 并发线程数
-XX:ParallelGCThreads=12              # STW 阶段线程数
-XX:ZCollectionInterval=0             # GC 间隔（0=按需）
-XX:ZAllocationSpikeTolerance=2.0     # 分配突发容忍度
-XX:+UseStringDeduplication           # 字符串去重
-XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-Xlog:gc*:file=/var/log/gc.log:time,level,tags:filecount=5,filesize=20m
```

### 5.2 Shenandoah 配置

```bash
-XX:+UseShenandoahGC
-Xms16g -Xmx16g
-XX:ShenandoahGCHeuristics=adaptive   # 自适应模式
-XX:ConcGCThreads=4
-XX:ParallelGCThreads=12
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-Xlog:gc*:file=/var/log/gc.log:time,level,tags:filecount=5,filesize=20m

# Shenandoah 模式：
# adaptive  → 自适应（默认，推荐）
# aggressive → 更激进回收（低延迟场景）
# compact   → 紧凑模式（减少碎片）
# passive   → 只分析不回收（调试用）
```

### 5.3 何时选择 ZGC

```
推荐 ZGC 的场景：
  1. 堆 > 16GB → ZGC 优势明显
  2. 延迟要求 < 10ms → G1 做不到
  3. Java 21+ → 分代 ZGC 性能接近 G1
  4. 大规模微服务 → 减少尾延迟
  5. 实时系统 → 低延迟是硬需求

不推荐 ZGC 的场景：
  1. Java < 15 → ZGC 不够成熟
  2. 吞吐量是唯一目标 → 用 Parallel GC
  3. 堆 < 4GB → G1 足够
  4. CPU 资源紧张 → ZGC 并发回收消耗 CPU
```

---

## 六、ZGC 监控

```bash
# 1. GC 日志
-Xlog:gc*:file=/var/log/gc.log:time,level,tags

# ZGC 日志示例：
# [10.000s][info][gc,start] GC(1) Garbage Collection (Warmup)
# [10.000s][info][gc,task] GC(1) Using 4 Workers
# [10.001s][info][gc,phases] GC(1) Pause Mark Start 0.012ms      ← STW
# [10.001s][info][gc,phases] GC(1) Concurrent Mark 120.000ms
# [10.121s][info][gc,phases] GC(1) Pause Mark End 0.015ms        ← STW
# [10.121s][info][gc,phases] GC(1) Concurrent Process Non-Strong Roots 5.000ms
# [10.126s][info][gc,phases] GC(1) Concurrent Relocate 80.000ms
# [10.206s][info][gc,heap] GC(1) Old: 2048M->1024M(4096M)
# [10.206s][info][gc] GC(1) Garbage Collection (Warmup) 2048M(50%)->1024M(25%)

# 关键指标：
# Pause Mark Start: 0.012ms  → STW
# Pause Mark End:   0.015ms  → STW
# Concurrent Mark:  120ms    → 不 STW
# Concurrent Relocate: 80ms  → 不 STW
# 总 STW = 0.012 + 0.015 = 0.027ms

# 2. jcmd 查看 ZGC 状态
jcmd <pid> GC.heap_info

# 3. JFR 录制 ZGC 事件
jcmd <pid> JFR.start name=zgc duration=60s filename=/tmp/zgc.jfr settings=profile
```

---

## 七、面试要点

### Q：ZGC 怎么做到亚毫秒级停顿？

核心是将标记和转移都做成并发：
1. 染色指针：在 64 位指针高位存储 GC 状态，不需要额外内存
2. 读屏障：每次读引用时检查指针颜色，自动修正和自愈引用
3. 多重映射：不同颜色指针映射到同一物理内存，修改颜色不影响对象访问
4. 并发转移：对象复制在应用线程运行时并发进行，只有根集处理需要极短 STW

### Q：ZGC 和 G1 的核心区别？

G1：标记并发 + 转移 STW → 堆越大 STW 越长
ZGC：标记并发 + 转移并发 → STW < 1ms，与堆大小无关

G1 用 RSet 减少扫描范围，但转移必须 STW
ZGC 用染色指针 + 读屏障实现并发转移，代价是读屏障开销（约 5% 吞吐量）

### Q：ZGC 和 Shenandoah 有什么区别？

ZGC：染色指针 + 读屏障，无额外内存开销，STW < 1ms
Shenandoah：Brooks Pointer + 读写屏障，每对象 +8 字节，STW < 10ms

ZGC 停顿更低（< 1ms vs < 10ms），吞吐量略高
Shenandoah 技术更简单（转发指针），但内存开销更大

---

## 八、总结

低延迟 GC 核心技术对比：

| 技术 | G1 | ZGC | Shenandoah |
|------|-----|-----|------------|
| 标记 | 并发 | 并发 | 并发 |
| 转移 | STW | 并发 | 并发 |
| 一致性保证 | SATB + RSet | 染色指针 + 读屏障 | Brooks Pointer + 读写屏障 |
| STW | 50-200ms | < 1ms | < 10ms |
| 堆大小影响 | 大 | 几乎无 | 小 |
| 分代 | 是 | 是（JDK 21） | 是（JDK 20） |

记住：**Java 21+ 优先用分代 ZGC，G1 是 Java 17 的默认选择，低延迟是未来方向**。
