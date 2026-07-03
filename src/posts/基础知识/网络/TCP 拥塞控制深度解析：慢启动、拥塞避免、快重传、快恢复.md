---
title: TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复
tag: ["TCP", "拥塞控制", "慢启动", "网络", "拥塞避免"]
category: 基础知识
date: 2026-07-03
---

# TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复

TCP 怎么判断网络拥塞？为什么不是一上来就全速发？慢启动到底有多"慢"？四个算法如何协作？从原理到代码，一篇搞懂 TCP 拥塞控制。

---

## 一、为什么需要拥塞控制

```
没有拥塞控制的后果：

  场景：100 个发送方同时向同一个路由器发数据
  路由器缓冲区有限 → 缓冲区满 → 丢包
  发送方发现丢包 → 重传 → 更多数据 → 更多丢包
  → 拥塞崩溃（Congestion Collapse）

  1986 年 10 月，互联网拥塞崩溃：
    某链路容量 32 kbps → 实际吞吐降到 40 bps
    → 下降 800 倍！

  TCP 拥塞控制目标：
    1. 避免网络拥塞（不发包太多）
    2. 公平分享带宽（不发包太少）
    3. 快速利用带宽（尽快达到最优速率）

  核心思想：探测网络容量，逐步增加发送速率
            发现拥塞 → 立即降低速率
```

---

## 二、核心概念

```
cwnd（Congestion Window，拥塞窗口）：
  发送方维护的窗口，限制已发送未确认的数据量
  实际发送窗口 = min(cwnd, rwnd)
  rwnd = 接收方 advertised window（流量控制）

rwnd（Receiver Window）：
  接收方通告的窗口大小（流量控制）
  接收方处理不过来时减小 rwnd

ssthresh（Slow Start Threshold，慢启动阈值）：
  慢启动和拥塞避免的分界线
  cwnd < ssthresh → 慢启动（指数增长）
  cwnd ≥ ssthresh → 拥塞避免（线性增长）

  初始值：ssthresh = 任意大（如 65535 字节）
  拥塞时：ssthresh = cwnd / 2

RTT（Round Trip Time，往返时间）：
  发送数据到收到 ACK 的时间
  用于计算超时时间 RTO（Retransmission Timeout）
  RTO = SRTT + 4 × RTTVAR（平滑 RTT + 4 倍 RTT 偏差）
```

---

## 三、四大算法

### 3.1 慢启动（Slow Start）

```
慢启动：cwnd 指数增长

  初始 cwnd = 1 MSS（通常 1460 字节）

  RTT 1: 发送 1 MSS → 收到 ACK → cwnd = 2
  RTT 2: 发送 2 MSS → 收到 2 ACK → cwnd = 4
  RTT 3: 发送 4 MSS → 收到 4 ACK → cwnd = 8
  RTT 4: 发送 8 MSS → 收到 8 ACK → cwnd = 16
  RTT 5: 发送 16 MSS → 收到 16 ACK → cwnd = 32

  时间轴：
  cwnd
   32 │                    ┌───┐
   16 │              ┌─────┘   │
    8 │        ┌─────┘         │
    4 │   ┌────┘               │
    2 │───┘                    │
    1 ─┘                       │
      └────────────────────────┴──→ RTT
       1  2  3  4  5  6

  特点：
    - 每收到一个 ACK，cwnd + 1 MSS
    - 每个 RTT 翻倍（指数增长）
    - 名字叫"慢"启动，但增长很快
    - "慢"是相对于"一开始就全速发"而言的

  停止条件：
    cwnd ≥ ssthresh → 切换到拥塞避免
    或检测到丢包 → 降低 cwnd
```

### 3.2 拥塞避免（Congestion Avoidance）

```
拥塞避免：cwnd 线性增长

  cwnd ≥ ssthresh 后，每个 RTT cwnd + 1 MSS

  RTT 6: cwnd = 32 → 发送 32 MSS → 收到 32 ACK → cwnd = 33
  RTT 7: cwnd = 33 → 发送 33 MSS → 收到 33 ACK → cwnd = 34
  RTT 8: cwnd = 34 → ...

  时间轴（续慢启动后）：
  cwnd
   40 │                         ┌──/
   35 │                    ┌───/
   32 │ ssthresh ──────────┘
   16 │              ┌─────
    8 │        ┌─────┘
    4 │   ┌────┘
    2 │───┘
    1 ─┘
      └──────────────────────────→ RTT
       1  2  3  4  5  6  7  8  9

  特点：
    - 每收到一个 ACK，cwnd += 1/cwnd MSS
    - 每个 RTT cwnd + 1（线性增长）
    - 增长速度远慢于慢启动
    - 目的是缓慢探测网络极限
```

### 3.3 快重传（Fast Retransmit）

```
快重传：不等超时，收到 3 个重复 ACK 立即重传

  正常情况：
  发送 seq=1 → ACK 2
  发送 seq=2 → ACK 3
  发送 seq=3 → ACK 4

  丢包场景（seq=2 丢失）：
  发送 seq=1 → ACK 2
  发送 seq=2 → 丢失！
  发送 seq=3 → ACK 2（重复 ACK #1，期望 2 但收到 3）
  发送 seq=4 → ACK 2（重复 ACK #2）
  发送 seq=5 → ACK 2（重复 ACK #3）
  → 收到 3 个重复 ACK → 立即重传 seq=2（不等超时）

  为什么 3 个重复 ACK？
    1 个重复 ACK 可能是乱序（包重新排序）
    2 个重复 ACK 可能是乱序
    3 个重复 ACK → 很可能是丢包

  优势：
    不需要等 RTO 超时（可能几百毫秒）
    收到 3 个重复 ACK 立即重传（通常 1 个 RTT 内）
```

### 3.4 快恢复（Fast Recovery）

```
快恢复：快重传后不回到慢启动，而是减半继续

  收到 3 个重复 ACK 后：
    1. ssthresh = cwnd / 2
    2. cwnd = ssthresh（不回到 1）
    3. 进入拥塞避免（线性增长）

  对比超时丢包（RTO 超时）：
    1. ssthresh = cwnd / 2
    2. cwnd = 1（回到慢启动）
    3. 进入慢启动（指数增长）

  为什么快恢复不回到 cwnd=1？
    3 个重复 ACK 说明：
      - 数据包确实丢失了
      - 但后续数据包到达了接收方（否则不会有重复 ACK）
      → 网络只是轻度拥塞，不需要大幅降低速率

  状态转换图：

  ┌──────────┐  cwnd ≥ ssthresh  ┌──────────┐
  │ 慢启动    │ ────────────────→ │ 拥塞避免   │
  │ (指数)    │ ←──────────────── │ (线性)    │
  └──────────┘                   └──────────┘
       │                              │
       │ RTO 超时                      │ 3次重复ACK
       │ cwnd=1, ssthresh=cwnd/2      │ ssthresh=cwnd/2, cwnd=ssthresh
       │                              ▼
       │                        ┌──────────┐
       └────────────────────────│ 快恢复    │
                                │ (线性)    │
                                └──────────┘
```

---

## 四、完整流程示例

```
完整拥塞控制流程：

cwnd
 64 │          ┌──┐         ┌──/
 32 │     ┌────┘  │    ┌────┘  ──── 拥塞避免
 16 │   ┌─┘       │  ┌─┘
  8 │ ┌─┘         │ ┌┘         ssthresh = 32 → 16
  4 │─┘           │└┘           cwnd = 16
  2 │             │
  1 │             │
    └─────────────┴──────────────→ RTT
     1 2 3 4 5  6 7 8 9 10 11

  RTT 1-5: 慢启动（cwnd: 1→2→4→8→16→32）
  RTT 5: cwnd=32 ≥ ssthresh=32 → 切换拥塞避免
  RTT 6: 拥塞避免 cwnd=33（收到 3 个重复 ACK）
  RTT 6: 快重传 + 快恢复
    ssthresh = 33/2 = 16
    cwnd = 16 → 进入拥塞避免
  RTT 7-11: 拥塞避免（cwnd: 16→17→18→19→20）

  如果 RTT 10 发生 RTO 超时：
    ssthresh = 20/2 = 10
    cwnd = 1 → 回到慢启动
```

---

## 五、现代拥塞控制算法

### 5.1 Reno / NewReno

```
Reno（1988）：
  四大算法的经典实现
  慢启动 + 拥塞避免 + 快重传 + 快恢复
  → 互联网标准，TCP 默认

NewReno（1999）：
  Reno 的改进版
  处理一个窗口内多个丢包
  → 避免 Reno 的多次快重传降低 cwnd 过多
```

### 5.2 Cubic

```
Cubic（Linux 默认，2008-2024）：
  cwnd 增长不是线性，而是三次函数（cubic curve）

  cwnd(t) = C × (t - K)³ + W_max
  C = 0.4（常数）
  K = (W_max × β / C)^(1/3)
  β = 0.7（乘性减少因子）

  特点：
    - 拥塞后快速恢复到之前的水位
    - 在高 RTT 链路上表现更好
    - 比 Reno 更激进
    - Linux 2.6.19 起默认

  曲线：
  cwnd
       │        ┌───┐
       │      ┌─┘   └─┐
       │    ┌─┘       └─┐
       │  ┌─┘           └─→
       │┌─┘
       └──────────────────→ time
         超时后快速爬升 → 然后放缓 → 再加速
```

### 5.3 BBR

```
BBR（Bottleneck Bandwidth and RTT，Google 2016）：
  不基于丢包的拥塞控制

  传统算法（Reno/Cubic）：
    把丢包当作拥塞信号
    问题：现代网络交换机有大缓冲区 → 丢包前缓冲区已满 → 延迟暴增

  BBR 理念：
    探测瓶颈带宽和最小 RTT
    cwnd = BtlBw × minRTT
    不依赖丢包判断拥塞

  四个阶段：
    1. Startup：指数增长，探测 BtlBw
    2. Drain：排空缓冲区队列
    3. ProbeBW：稳态，周期性探测带宽
    4. ProbeRTT：周期性探测最小 RTT

  优势：
    - 高带宽长 RTT 链路性能更好
    - 不填满缓冲区 → 延迟更低
    - 公平性好

  Linux 启用 BBR：
    sysctl net.ipv4.tcp_congestion_control=bbr
    # 内核 4.9+ 支持
```

### 5.4 算法对比

```
              Reno        Cubic       BBR
──────────────────────────────────────────────
判断拥塞      丢包         丢包         延迟+带宽
cwnd 增长     线性         三次函数     基于模型
缓冲区利用    高           高           低
高 RTT 性能   差           好           好
公平性        好           一般         一般
Linux 默认    < 2.6.19    2.6.19+     需手动开启
适用          通用         通用         高带宽/长 RTT
```

---

## 六、Java 网络编程中的 TCP 调优

```java
// Java Socket TCP 参数设置
Socket socket = new Socket();
// 连接前设置参数

// TCP_NODELAY：禁用 Nagle 算法
// Nagle 算法：小包合并，减少网络包数量
// 禁用后：小包立即发送（低延迟场景如游戏/SSH）
socket.setTcpNoDelay(true);

// SO_SNDBUF / SO_RCVBUF：发送/接收缓冲区大小
socket.setSendBufferSize(64 * 1024);   // 64 KB
socket.setReceiveBufferSize(64 * 1024); // 64 KB

// SO_TIMEOUT：读超时
socket.setSoTimeout(5000);  // 5 秒

// KeepAlive：TCP 保活
socket.setKeepAlive(true);

// Linux 系统级 TCP 调优
// /etc/sysctl.conf
// net.ipv4.tcp_congestion_control = bbr  # 使用 BBR
// net.core.rmem_max = 16777216           # 最大接收缓冲区
// net.core.wmem_max = 16777216           # 最大发送缓冲区
// net.ipv4.tcp_rmem = 4096 87380 16777216  # 接收缓冲区 min/default/max
// net.ipv4.tcp_wmem = 4096 65536 16777216  # 发送缓冲区 min/default/max
// net.ipv4.tcp_slow_start_after_idle = 0    # 禁用空闲后慢启动
```

---

## 七、面试要点

### Q：TCP 拥塞控制四个算法？

1. 慢启动：cwnd 从 1 开始，每个 RTT 翻倍（指数增长），直到 ssthresh
2. 拥塞避免：cwnd ≥ ssthresh 后，每个 RTT +1 MSS（线性增长）
3. 快重传：收到 3 个重复 ACK → 立即重传丢失包（不等超时）
4. 快恢复：快重传后 ssthresh = cwnd/2，cwnd = ssthresh（不回到 1，继续拥塞避免）

### Q：快恢复和超时处理的区别？

3 个重复 ACK（快重传）：说明只有个别包丢失，后续包仍能到达，网络只是轻度拥塞。ssthresh = cwnd/2，cwnd = ssthresh，继续拥塞避免（不回到慢启动）。

RTO 超时：说明网络严重拥塞，可能多个包丢失。ssthresh = cwnd/2，cwnd = 1，回到慢启动重新探测。

### Q：BBR 算法的优势？

传统算法（Reno/Cubic）基于丢包判断拥塞：有丢包就降速。但现代网络交换机有大缓冲区，丢包前缓冲区已满导致延迟暴增（Bufferbloat）。BBR 通过探测瓶颈带宽（BtlBw）和最小 RTT 来计算最优 cwnd，不依赖丢包信号。优势：高带宽长 RTT 链路性能更好、延迟更低、不完全填满缓冲区。

---

## 八、总结

```
TCP 拥塞控制 = 慢启动 + 拥塞避免 + 快重传 + 快恢复

慢启动：cwnd 指数增长（每 RTT 翻倍），cwnd < ssthresh
拥塞避免：cwnd 线性增长（每 RTT +1），cwnd ≥ ssthresh
快重传：3 个重复 ACK → 立即重传
快恢复：ssthresh=cwnd/2, cwnd=ssthresh（不回到 1）

两个降低 cwnd 的场景：
  3 次重复 ACK → 快恢复（cwnd 减半）
  RTO 超时 → 慢启动（cwnd=1）

算法演进：Reno → Cubic（Linux 默认）→ BBR（Google）
  Reno：基于丢包，线性增长
  Cubic：三次函数增长，更快恢复
  BBR：基于带宽+RTT，不依赖丢包，低延迟
```
