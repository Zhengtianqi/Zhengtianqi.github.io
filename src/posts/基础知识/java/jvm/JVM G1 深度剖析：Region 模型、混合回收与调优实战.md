---
title: JVM G1 深度剖析：Region 模型、混合回收与调优实战
tag: ["JVM", "G1", "GC", "Region", "混合回收", "调优"]
category: 基础知识
date: 2026-07-02
---

# JVM G1 深度剖析：Region 模型、混合回收与调优实战

G1 是 Java 9+ 默认 GC，但大多数人只会用默认参数。G1 的 Region 模型怎么工作？Mixed GC 什么时候触发？RSet 有什么用？深入 G1 底层，才能真正做到调优。

---

## 一、G1 Region 模型

### 1.1 Region 划分

```
G1 将堆划分为 2048 个大小相等的 Region（默认）

堆大小 4GB：Region = 4GB / 2048 = 2MB
堆大小 8GB：Region = 8GB / 2048 = 4MB
堆大小 16GB：Region = 16GB / 2048 = 8MB

Region 大小自动计算，也可手动指定：
-XX:G1HeapRegionSize=8m  （必须是 2 的幂，1-32MB）

┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ E  │ E  │ S  │ O  │ O  │ H  │ H  │- H-│ O  │ E  │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ O  │ E  │ E  │ O  │ S  │ O  │ H  │ O  │ E  │ O  │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ E  │ O  │ O  │ E  │ O  │ O  │ E  │ O  │ S  │ O  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘

E = Eden Region（新生代 Eden）
S = Survivor Region（新生代幸存者）
O = Old Region（老年代）
H = Humongous Region（大对象）
Free = 未分配 Region

Region 角色不是固定的：
  一个 Region 这一轮是 Eden，GC 后可能变成 Old
  G1 通过标记位跟踪每个 Region 的角色
```

### 1.2 Humongous 对象

```
大对象（Humongous）：
  对象大小 > Region 大小的 50% → 直接分配在连续的 Humongous Region
  对象大小 > Region 大小 → 跨多个连续 Region

例：Region = 4MB
  对象 2.1MB → Humongous（> 4MB × 50% = 2MB）
  对象 10MB → 3 个连续 Humongous Region

大对象的问题：
  1. 直接进老年代，不经过 Young GC 回收
  2. 占用连续 Region，可能导致空间碎片
  3. 回收效率低（需要 Full GC 或并发标记阶段回收）

优化：
  - 增大 Region 大小：-XX:G1HeapRegionSize=16m
  - 减少大对象创建：分块处理、流式处理
  - 用 -XX:G1HeapWastePercent 控制浪费比例
```

---

## 二、G1 GC 类型

### 2.1 三种 GC

```
1. Young GC（Minor GC）
   触发：Eden 区满
   回收：所有 Eden + Survivor Region
   STW：复制存活对象到新 Survivor / Old Region
   停顿时间：通常 10-50ms

2. Mixed GC（混合回收）
   触发：IHOP（InitiatingHeapOccupancyPercent）阈值
   回收：所有年轻代 + 部分老年代 Region（垃圾最多的）
   STW：分多次完成（G1MixedGCCountTarget 控制）
   停顿时间：每次 50-200ms

3. Full GC（退化）
   触发：Mixed GC 跟不上 / 疏散失败 / Metaspace 不足
   回收：整个堆
   STW：单线程（Java 10 前）/ 多线程（Java 10+）
   停顿时间：秒级，应尽量避免
```

### 2.2 GC 触发条件

```
Young GC 触发：
  Eden Region 数量达到当前新生代上限
  G1MaxNewSizePercent（默认 60%）

Mixed GC 触发链路：
  1. 老年代占用 > IHOP（默认 45%）
  2. 触发并发标记周期（Concurrent Marking Cycle）
  3. 并发标记完成后，G1 知道每个 Region 的垃圾比例
  4. 触发 Mixed GC：选择垃圾比例高的 Old Region + 全部 Young Region

Full GC 触发：
  1. Mixed GC 速度 < 内存分配速度（老年代持续增长）
  2. 疏散失败（Evacuation Failure）：To 区放不下存活对象
  3. Metaspace 不足
  4. System.gc()（如未禁用）
  5. 并发标记未完成时老年代已满
```

---

## 三、G1 并发标记周期

### 3.1 五个阶段

```
阶段 1：Initial Mark（初始标记）
  STW，搭便车在一次 Young GC 上
  标记 GC Roots 直接引用的对象
  耗时：极短（复用 Young GC 的 STW）

阶段 2：Root Region Scan（根区域扫描）
  并发，不 STW
  扫描 Survivor Region 引用的老年代对象
  必须在下一次 Young GC 前完成

阶段 3：Concurrent Mark（并发标记）
  并发，不 STW
  从 GC Roots 遍历整个堆的对象图
  使用 SATB（Snapshot-At-The-Beginning）算法
  期间产生的变更写入 SATB 缓冲区

阶段 4：Remark（重新标记）
  STW
  处理 SATB 缓冲区（并发标记期间的引用变更）
  回收空的 Region
  耗时：短（只处理增量变更）

阶段 5：Cleanup（清理）
  部分 STW
  统计每个 Region 的存活对象数和垃圾比例
  排序 Region，为 Mixed GC 选区
  回收完全没有存活对象的 Region
```

### 3.2 SATB 算法

```
SATB（Snapshot-At-The-Beginning）：
  并发标记开始时，逻辑上拍一张"存活快照"
  并发标记期间，如果有引用变更（对象被修改）：
    旧引用写入 SATB 缓冲区（write barrier）
    → 确保旧引用不会被遗漏

Write Barrier 伪代码：
  void oop_field_store(oop* field, oop new_value) {
      oop old_value = *field;
      if (old_value != null && concurrent_marking) {
          satb_buffer.add(old_value);  // 旧值加入 SATB
      }
      *field = new_value;
  }

SATB 的代价：
  - 写屏障开销（每次引用写入都检查）
  - 可能多标记一些实际已死亡的对象（浮动垃圾）
  - 下一个周期才能回收浮动垃圾
```

---

## 四、RSet（记忆集）

### 4.1 RSet 的作用

```
问题：G1 回收单个 Region 时，需要知道谁引用了它（跨 Region 引用）
      如果遍历整个堆 → 太慢
解决：RSet（Remembered Set）记录"谁引用了我"

RSet 是一个哈希表：
  Key = 引用者的 Region 索引
  Value = 引用者 Region 中的卡页（Card）索引

  Region A 的 RSet：
    Region B: [Card 3, Card 7, Card 15]    ← B 的这些卡页引用了 A
    Region C: [Card 1, Card 9]              ← C 的这些卡页引用了 A

  GC 回收 Region A 时，只需扫描 B 和 C 的特定卡页
  不用扫描整个堆 → 大幅减少扫描时间
```

### 4.2 RSet 维护

```
RSet 通过 Write Barrier 维护：
  每次引用写入时，检查是否跨 Region：
    if (引用者和被引用者不在同一 Region) {
        被引用者的 RSet.add(引用者的 Card)
    }

Write Barrier 代价：
  - 每次引用写入都有额外开销
  - G1 的 Write Barrier 比 CMS 重（CMS 只需要标记，G1 需要更新 RSet）
  - 这是 G1 吞吐量比 Parallel GC 低的原因之一
```

### 4.3 RSet 精度

```
G1 RSet 有三种精度级别：

1. Sparse（稀疏）：只记录 Region 索引 + 少量 Card
   → 内存省，但扫描多

2. Fine（精细）：Region 索引 + Card 位数组
   → 平衡，默认级别

3. Coarse（粗略）：只记录 Region 索引
   → 内存省，但需要扫描整个 Region

G1 会根据 RSet 大小自动在三种精度间切换
```

---

## 五、Mixed GC 调优

### 5.1 Mixed GC 关键参数

```bash
# 触发时机
-XX:InitiatingHeapOccupancyPercent=35
# 老年代占用 35% 时触发并发标记（默认 45%）
# 调低 → 提前回收，减少 Full GC 风险
# 调高 → 减少并发标记开销，但 Full GC 风险增大

# 回收次数
-XX:G1MixedGCCountTarget=8
# Mixed GC 分 8 次完成（默认 8）
# 调大 → 每次回收更少 Region，停顿更短
# 调小 → 每次回收更多 Region，可能停顿更长

# 每次回收的老年代上限
-XX:G1OldCSetRegionThresholdPercent=10
# 每次最多回收 10% 的老年代 Region（默认 10%）

# 混合回收的新生代下限
-XX:G1MixedGCLiveThresholdPercent=85
# Region 中存活对象超过 85% 时不参与混合回收（回收价值低）
# 调高 → 更多 Region 参与回收，但复制成本增加

# 预留空间
-XX:G1ReservePercent=15
# 预留 15% 的堆空间作为 To 区（默认 10%）
# 调大 → 减少疏散失败，但可用空间减少
```

### 5.2 调优案例

```
场景：8GB 堆，G1，频繁 Full GC，停顿 2-5 秒

诊断：
  jstat -gc <pid> 1000
  → FGC 每分钟 2-3 次
  → OGCT（Old GC Time）累计很高
  → Mixed GC 后 Old Used 下降不多

分析：
  1. IHOP = 45%（默认），老年代占 45% 才开始并发标记
  2. 并发标记需要时间，标记完成前老年代继续增长
  3. Mixed GC 来不及回收，触发 Full GC

调优：
  -XX:InitiatingHeapOccupancyPercent=35   # 提前触发
  -XX:G1MixedGCCountTarget=16             # 分更多次回收
  -XX:G1ReservePercent=15                 # 增大预留
  -XX:MaxGCPauseMillis=100                # 降低目标停顿

效果：
  Full GC 从每分钟 2-3 次降到 0
  Mixed GC 停顿 50-80ms
  吞吐量提升 12%
```

---

## 六、G1 疏散失败

### 6.1 什么是疏散失败

```
G1 回收时需要复制存活对象到新 Region（疏散）
如果目标 Region 空间不足 → 疏散失败（Evacuation Failure）

疏散失败的后果：
  1. 存活对象无法复制，留在原 Region
  2. 原 Region 标记为 Old（不回收）
  3. 触发 Full GC（退化）
  4. STW 时间暴增

原因：
  1. 预留空间不足（To 区不够）
  2. 内存碎片（虽然有 Free Region，但不连续）
  3. 突发大对象分配
```

### 6.2 预防疏散失败

```bash
# 1. 增大预留空间
-XX:G1ReservePercent=15  # 默认 10%，调到 15%

# 2. 增大堆
-Xms12g -Xmx12g  # 从 8g 增到 12g

# 3. 降低 IHOP（提前回收）
-XX:InitiatingHeapOccupancyPercent=30

# 4. 减少 Mixed GC 每次回收量
-XX:G1OldCSetRegionThresholdPercent=5  # 从 10 降到 5

# 5. 增大 Region（减少大对象 Humongous 分配）
-XX:G1HeapRegionSize=8m  # 或 16m
```

---

## 七、G1 vs ZGC 性能对比

### 7.1 基准测试

```
测试条件：16GB 堆，16C CPU，SPECjbb2015

指标              G1          ZGC(不分代)   ZGC(分代, JDK21)
平均停顿          85ms        0.8ms         0.3ms
最大停顿          230ms       1.2ms         0.5ms
吞吐量            45234 ops/s 41234 ops/s   44567 ops/s
GC CPU 开销       8%          12%           9%

结论：
  停顿：ZGC 完胜（< 1ms vs 85ms）
  吞吐量：G1 略优（45K vs 41K）
  分代 ZGC 吞吐量接近 G1，停顿远优于 G1
```

### 7.2 选型建议

```
Java 21+：优先考虑分代 ZGC
  -XX:+UseZGC -XX:+ZGenerational
  - 停顿 < 1ms，吞吐量接近 G1

Java 17-20：G1 为主，特殊场景用 ZGC
  - 堆 < 16GB → G1
  - 堆 > 16GB 或延迟 < 10ms → ZGC

Java 11-16：G1
  - 默认 G1，成熟稳定

Java 8：G1 或 CMS
  - CMS 已废弃，建议迁移到 G1
```

---

## 八、G1 生产配置模板

### 8.1 通用型（4-8GB 堆）

```bash
-XX:+UseG1GC
-Xms6g -Xmx6g
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=4m
-XX:InitiatingHeapOccupancyPercent=35
-XX:G1ReservePercent=15
-XX:ParallelGCThreads=6
-XX:ConcGCThreads=2
-XX:+ParallelRefProcEnabled
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:MaxMetaspaceSize=512m
-XX:G1MixedGCCountTarget=8
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
```

### 8.2 低延迟型（8-16GB 堆）

```bash
-XX:+UseG1GC
-Xms12g -Xmx12g
-XX:MaxGCPauseMillis=100              # 更低延迟目标
-XX:G1HeapRegionSize=8m
-XX:InitiatingHeapOccupancyPercent=30  # 更早触发
-XX:G1ReservePercent=20                # 更大预留
-XX:ParallelGCThreads=10
-XX:ConcGCThreads=4
-XX:G1MixedGCCountTarget=16            # 分更多次回收
-XX:+ParallelRefProcEnabled
-XX:+UseStringDeduplication
-XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
```

---

## 九、面试要点

### Q：G1 的 Mixed GC 是什么？什么时候触发？

Mixed GC 是 G1 特有的回收方式，同时回收年轻代和部分老年代 Region。触发链路：老年代占用超过 IHOP（默认 45%）→ 触发并发标记周期 → 标记完成后 G1 知道每个 Region 的垃圾比例 → 触发 Mixed GC，每次回收垃圾最多的 Old Region + 全部 Young Region。Mixed GC 分多次完成（G1MixedGCCountTarget 默认 8 次），避免单次停顿过长。

### Q：G1 的 RSet 有什么用？代价是什么？

RSet（Remembered Set）记录"谁引用了我"，让 G1 回收单个 Region 时不需要扫描整个堆。代价是 Write Barrier 开销：每次引用写入都需检查是否跨 Region 并更新 RSet。这是 G1 吞吐量低于 Parallel GC 的主要原因。

### Q：G1 发生疏散失败怎么办？

疏散失败（Evacuation Failure）指复制存活对象时目标空间不足，导致 Full GC 退化。预防方法：增大 G1ReservePercent（预留空间）、降低 IHOP（提前回收）、增大堆、减少 Mixed GC 每次回收量。

---

## 十、总结

G1 调优核心参数：

| 参数 | 默认值 | 调优方向 |
|------|--------|---------|
| MaxGCPauseMillis | 200ms | 降 → 停顿短但吞吐降 |
| IHOP | 45% | 降 → 提前回收防 Full GC |
| G1ReservePercent | 10% | 升 → 防疏散失败 |
| G1HeapRegionSize | 自动 | 升 → 减少大对象 |
| G1MixedGCCountTarget | 8 | 升 → 每次停顿更短 |

记住：**IHOP 35% 提前回收，预留 15% 防疏散失败，Region 8MB 减少大对象，分代 ZGC 是未来**。
