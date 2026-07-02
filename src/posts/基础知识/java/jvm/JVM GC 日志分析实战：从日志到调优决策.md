---
title: JVM GC 日志分析实战：从日志到调优决策
tag: ["JVM", "GC", "日志分析", "GCEasy", "调优"]
category: 基础知识
date: 2026-07-02
---

# JVM GC 日志分析实战：从日志到调优决策

GC 日志就像应用的体检报告，能看出内存健康状况。但一堆数字看不懂？不知道哪些指标关键？从日志配置到分析解读，一篇讲透 GC 日志。

---

## 一、GC 日志配置

### 1.1 Java 9+ 统一日志（Xlog）

```bash
# 基础配置（推荐）
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20m

# 参数解析：
# gc*           → 所有 GC 相关日志
# file=         → 输出文件
# time,uptime   → 时间格式（绝对时间 + 运行时长）
# level         → 日志级别（info/warning/error）
# tags          → 日志标签（gc,heap,cpu,startup）
# filecount=5   → 保留 5 个文件
# filesize=20m  → 每个文件 20MB

# 容器环境（输出到 stdout）
-Xlog:gc*:stdout:time,level,tags

# 详细配置（包含 GC 原因 + 堆详情）
-Xlog:gc*=info,gc+heap=debug,gc+task=debug:file=/var/log/gc.log:time,level,tags:filecount=5,filesize=20m
```

### 1.2 必配 JVM 参数

```bash
# GC 日志 + OOM dump（生产标配）
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-XX:+PrintCommandLineFlags    # 打印 JVM 参数（Java 8）
```

---

## 二、G1 GC 日志解读

### 2.1 Young GC 日志

```
[2024-07-02T10:30:00.123+0800][2.345s][info][gc,start    ] GC(1) Pause Young (Normal) (G1 Evacuation Pause)
[2024-07-02T10:30:00.123+0800][2.345s][info][gc,task     ] GC(1) Using 6 workers of 8 for evacuation
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,phases   ] GC(1) Pre Evacuate Collection Set: 0.1ms
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,phases   ] GC(1) Evacuate Collection Set: 44.2ms
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,phases   ] GC(1) Post Evacuate Collection Set: 0.8ms
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,phases   ] GC(1) Other: 0.1ms
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,heap     ] GC(1) Eden regions: 100->0(100)
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,heap     ] GC(1) Survivor regions: 0->10(10)
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,heap     ] GC(1) Old regions: 50->52
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,heap     ] GC(1) Humongous regions: 3->3
[2024-07-02T10:30:00.168+0800][2.390s][info][gc,metaspace] GC(1) Metaspace: 128MB->128MB(512MB)
[2024-07-02T10:30:00.168+0800][2.390s][info][gc          ] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 200M->120M(512M) 45.234ms

关键行解读（最后一行）：
  GC(1)                            → 第 1 次 GC
  Pause Young (Normal)             → Young GC（正常触发）
  (G1 Evacuation Pause)            → GC 原因（G1 疏散暂停）
  200M->120M                       → GC 前堆使用 200M，GC 后 120M
  (512M)                           → 堆总大小 512M
  45.234ms                         → GC 停顿时间

各阶段耗时：
  Pre Evacuate: 0.1ms   → 回收前准备
  Evacuate:     44.2ms  → 复制存活对象（主要耗时）
  Post Evacuate: 0.8ms  → 回收后处理（RSet 更新等）
  Other:        0.1ms   → 其他

Region 变化：
  Eden:      100→0(100)  → 100 个 Eden Region 全部清空
  Survivor:  0→10(10)    → 10 个 Survivor Region
  Old:       50→52       → 老年代 +2（晋升的对象）
```

### 2.2 Mixed GC 日志

```
[2.345s][info][gc,start ] GC(15) Pause Mixed (G1 Evacuation Pause)
[2.345s][info][gc,task  ] GC(15) Using 6 workers of 8 for evacuation
[2.390s][info][gc,phases] GC(15) Pre Evacuate Collection Set: 0.1ms
[2.390s][info][gc,phases] GC(15) Evacuate Collection Set: 78.3ms
[2.390s][info][gc,phases] GC(15) Post Evacuate Collection Set: 1.2ms
[2.390s][info][gc,heap  ] GC(15) Eden regions: 100->0(80)
[2.390s][info][gc,heap  ] GC(15) Survivor regions: 10->10(10)
[2.390s][info][gc,heap  ] GC(15) Old regions: 200->180     ← 老年代减少！
[2.390s][info][gc       ] GC(15) Pause Mixed (G1 Evacuation Pause) 350M->200M(512M) 80.5ms

Mixed GC vs Young GC 区别：
  Young GC: 只回收 Eden + Survivor
  Mixed GC: 回收 Eden + Survivor + 部分 Old Region
  Old regions: 200→180 → 回收了 20 个 Old Region
  Eden: 100→0(80) → 下次 Eden 上限变为 80（给 Mixed GC 留时间）
```

### 2.3 Full GC 日志

```
[5.678s][info][gc,start] GC(25) Pause Full (G1 Compaction Pause)
[5.678s][warning][gc    ] GC(25) Full GC triggered: evacuation failure
[6.234s][info][gc,heap  ] GC(25) Old regions: 480->50
[6.234s][info][gc       ] GC(25) Pause Full (G1 Compaction Pause) 490M->60M(512M) 556.0ms

Full GC 信号（应该避免）：
  1. STW 时间长（556ms vs Young GC 45ms）
  2. 触发原因是 evacuation failure（疏散失败）
  3. Full GC 后老年代从 480 降到 50 → 说明不是泄漏，是来不及回收
```

### 2.4 并发标记周期日志

```
# 阶段 1：初始标记（搭便车在 Young GC 上）
[10.000s][info][gc,start] GC(30) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[10.045s][info][gc      ] GC(30) Pause Young (Concurrent Start) 200M->120M(512M) 45ms

# 阶段 2：并发标记开始
[10.045s][info][gc,marking] GC(30) Concurrent Mark Cycle
[10.045s][info][gc,marking] GC(30) Concurrent Clear Claimed Marks
[10.046s][info][gc,marking] GC(30) Concurrent Clear Claimed Marks 1.0ms
[10.046s][info][gc,marking] GC(30) Concurrent Scan Root Regions
[10.050s][info][gc,marking] GC(30) Concurrent Scan Root Regions 4.2ms
[10.050s][info][gc,marking] GC(30) Concurrent Mark (10.050s)
[10.050s][info][gc,marking] GC(30) Concurrent Mark From Roots
[10.200s][info][gc,marking] GC(30) Concurrent Mark From Roots 150.3ms

# 阶段 3：重新标记
[10.200s][info][gc,start  ] GC(30) Pause Remark
[10.205s][info][gc        ] GC(30) Pause Remark 120M->120M(512M) 5.0ms

# 阶段 4：清理
[10.205s][info][gc,start  ] GC(30) Pause Cleanup
[10.208s][info][gc        ] GC(30) Pause Cleanup 120M->118M(512M) 3.0ms

# 并发标记完成后 → 后续触发 Mixed GC
[10.300s][info][gc,start  ] GC(31) Pause Mixed (G1 Evacuation Pause)
```

---

## 三、关键指标分析

### 3.1 吞吐量

```
吞吐量 = 应用运行时间 / 总时间 × 100%

计算：
  总运行时间：60 秒
  GC 总时间：3 秒（Young GC 2s + Mixed GC 0.8s + Full GC 0.2s）
  吞吐量 = (60 - 3) / 60 = 95%

健康标准：
  优秀：> 95%
  正常：90-95%
  不健康：< 90%（需要调优）
  危险：< 85%（紧急调优）
```

### 3.2 GC 频率

```
Young GC 频率：
  健康：每 5-30 秒一次
  不健康：每 1-2 秒一次 → Eden 太小
  危险：每秒多次 → 严重问题

Mixed GC 频率：
  正常：每 30-120 秒一次
  不健康：每 10 秒一次 → 老年代增长太快

Full GC 频率：
  健康：0 次（不应该出现）
  不健康：每小时 1-2 次
  危险：每分钟多次 → 紧急处理
```

### 3.3 停顿时间分布

```
分析 GC 日志中所有停顿时间，画分布图：

  0-50ms    : ████████████████████ 500次 (80%)  ← 正常
  50-100ms  : ██████ 80次 (13%)                 ← 可接受
  100-200ms : ██ 30次 (5%)                      ← 注意
  200-500ms : █ 10次 (1.5%)                     ← 需优化
  500ms+    : ▌ 3次 (0.5%)                      ← 严重

目标：
  P50 < 50ms
  P99 < 200ms
  P999 < 500ms
  Max < 1s（Full GC 除外）
```

### 3.4 回收效率

```
Young GC 回收效率：
  回收前 200M → 回收后 120M → 回收 80M
  效率 = 80M / 200M = 40%（正常，60% 是存活对象）
  
  效率 < 20% → 存活对象太多，Eden 太小
  效率 > 80% → 很好，大部分是垃圾

Mixed GC 回收效率：
  Old: 200→180 → 回收 20 个 Region = 80M
  效率看 Old Region 回收比例
  回收 < 5% → 垃圾不多，IHOP 太低
  回收 > 30% → 很好
```

---

## 四、GCEasy 在线分析

### 4.1 使用步骤

```
1. 收集 GC 日志
   cat /var/log/gc.log
   
2. 上传到 https://gceasy.io
   
3. 查看报告关键指标
```

### 4.2 关键报告解读

```
1. Throughput（吞吐量）
   目标：> 95%
   如果 < 90% → 需要调优

2. Average GC Pause（平均停顿）
   目标：< 100ms
   
3. Max GC Pause（最大停顿）
   目标：< 500ms

4. GC Cause Distribution（GC 嶳因分布）
   System.gc() → 加 -XX:+DisableExplicitGC
   Metadata GC Threshold → Metaspace 不够
   Allocation Failure → 正常 Young GC
   G1 Evacuation Pause → 正常 G1
   Concurrent Mode Failure → CMS 退化

5. Heap Usage After GC（GC 后堆使用趋势）
   持续上升 → 内存泄漏
   波动稳定 → 正常

6. Young/Old Generation Size（分代大小）
   新生代太小 → Young GC 频繁
   老年代太小 → Full GC 频繁
```

---

## 五、常见 GC 日志问题诊断

### 5.1 Young GC 频繁

```
日志特征：
  GC 间隔 < 2 秒
  每次 Young GC 40-50ms
  Eden: 50→0(50) Region 较少

诊断：
  Eden 区太小，对象快速填满

修复：
  -XX:G1NewSizePercent=30   # 增大新生代下限
  -XX:G1MaxNewSizePercent=50 # 增大新生代上限
  或增大堆：-Xms8g -Xmx8g
```

### 5.2 Mixed GC 停顿过长

```
日志特征：
  Pause Mixed 200ms+
  Evacuate Collection Set 180ms+

诊断：
  每次回收的 Old Region 太多

修复：
  -XX:G1MixedGCCountTarget=16    # 分更多次回收
  -XX:G1OldCSetRegionThresholdPercent=5  # 每次回收更少 Region
  -XX:MaxGCPauseMillis=100       # 降低目标停顿
```

### 5.3 Full GC 出现

```
日志特征：
  Pause Full (G1 Compaction Pause)
  耗时 500ms-5s

诊断方向（看 Full GC 原因）：
  1. "evacuation failure" → 预留空间不足
     修复：-XX:G1ReservePercent=15
  
  2. "Metadata GC Threshold" → Metaspace 不足
     修复：-XX:MaxMetaspaceSize=512m
  
  3. "System.gc()" → 代码调用了 System.gc()
     修复：-XX:+DisableExplicitGC
  
  4. "Allocation Failure" + 老年代几乎不降 → 内存泄漏
     修复：dump + MAT 分析
```

### 5.4 并发标记频繁

```
日志特征：
  Concurrent Mark Cycle 频繁触发（每 30 秒一次）

诊断：
  老年代增长太快 → IHOP 阈值太低或内存泄漏

修复：
  -XX:InitiatingHeapOccupancyPercent=45  # 调高 IHOP（如果太低）
  如果是泄漏 → dump 分析
```

---

## 六、GC 日志分析脚本

```bash
# 1. 统计 GC 次数和类型
grep -c "Pause Young" gc.log
grep -c "Pause Mixed" gc.log
grep -c "Pause Full" gc.log

# 2. 提取所有 GC 停顿时间并排序
grep "Pause" gc.log | grep -oP '\d+\.\d+ms' | sort -n | tail -20
# 最大 20 次停顿

# 3. 统计吞吐量
total_time=$(tail -1 gc.log | grep -oP '\d+\.\d+s' | head -1 | tr -d 's')
gc_time=$(grep "Pause" gc.log | grep -oP '\d+\.\d+ms' | awk '{sum += $1} END {print sum/1000}')
echo "Throughput: $(echo "scale=2; (1 - $gc_time / $total_time) * 100" | bc)%"

# 4. 查找 Full GC
grep "Pause Full" gc.log

# 5. 查找 System.gc()
grep "System.gc" gc.log

# 6. 提取 Young GC 间隔
grep "Pause Young" gc.log | grep -oP '^\[.*?\]' | head -20
```

---

## 七、面试要点

### Q：GC 日志怎么分析？

1. 看吞吐量：GC 总时间 / 运行时间，目标 > 95%
2. 看停顿分布：P50/P99/Max 停顿
3. 看是否有 Full GC：正常不应该有
4. 看 GC 原因：System.gc() / 元空间 / 疏散失败
5. 看堆使用趋势：GC 后堆是否持续增长（泄漏）
6. 用 GCEasy 在线分析工具可视化

### Q：GC 日志中 Mixed GC 和 Young GC 的区别？

Young GC 只回收年轻代（Eden + Survivor），Mixed GC 在 Young GC 基础上额外回收部分老年代 Region。日志区别：Mixed GC 的 Old regions 会减少（如 200→180），Young GC 的 Old regions 可能增加（晋升）。Mixed GC 在并发标记周期后触发，分多次完成。

### Q：Full GC 怎么避免？

1. 确保堆够大或 IHOP 合理（提前触发并发标记）
2. 增大 G1ReservePercent 防止疏散失败
3. 设置 MaxMetaspaceSize 防止元空间溢出
4. 加 -XX:+DisableExplicitGC 禁止 System.gc()
5. 修复内存泄漏
6. 监控 GC 日志，在 Full GC 前调优

---

## 八、总结

GC 日志分析四步法：

1. **看吞吐量**：> 95% 健康，< 90% 需调优
2. **看停顿分布**：P99 < 200ms，Max < 1s
3. **看 Full GC**：正常 0 次，出现就排查
4. **看堆趋势**：GC 后堆使用是否持续增长

记住：**GC 日志是 JVM 体检报告，GCEasy 是在线分析工具，Full GC 是危险信号，吞吐量 95% 是底线**。
