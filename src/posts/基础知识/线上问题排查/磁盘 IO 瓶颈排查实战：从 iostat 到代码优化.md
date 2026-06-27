---
title: 磁盘 IO 瓶颈排查实战：从 iostat 到代码优化
tag: ["磁盘IO", "iostat", "性能优化", "日志优化", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 磁盘 IO 瓶颈排查实战：从 iostat 到代码优化

> 系统负载飙高、接口响应变慢、CPU 使用率不高但 load average 居高不下——这通常是磁盘 IO 瓶颈的表现。本文带你从 iostat 到代码优化，完整解决磁盘 IO 问题。

## 一、磁盘 IO 瓶颈的表现

磁盘 IO 瓶颈通常有以下特征：

```
现象:
  - load average 高（如 16.0），但 CPU 使用率不高（如 20%）
  - iowait 高（%iowait > 20%）
  - 应用响应慢，特别是涉及文件操作的接口
  - 磁盘队列深度高
  - 日志写入变慢
  - 数据库性能下降
```

### load average 高但 CPU 不高的原因

`load average` 表示系统平均负载，它不只看 CPU，还看 **等待 IO 的进程**。当大量进程在等磁盘 IO 时，load 也会高。

```
CPU 使用率: 20%  ← 不高
%iowait: 60%     ← 很高！
load average: 16.0  ← 因为有 16 个进程在等 IO
```

## 二、iostat：磁盘 IO 分析利器

### 2.1 安装与基本使用

```bash
# CentOS/RHEL
yum install -y sysstat

# Ubuntu/Debian
apt install -y sysstat

# 基本使用：每秒输出一次
iostat -x 1

# 输出：
Linux 5.15.0-25-generic (server01)   06/27/2026   _x86_64_  (8 CPU)

Device     r/s     w/s     rkB/s    wkB/s   rrqm/s   wrqm/s  %util  aqu-sz  await  r_await  w_await  svctm
sda       50.00   200.00  800.0    3200.0    5.0     20.0    95.0   8.5    42.5   15.0     50.0     3.8
sdb        0.00    0.00    0.0      0.0      0.0      0.0     0.0   0.0     0.0    0.0      0.0      0.0
```

### 2.2 关键指标解读

| 指标 | 含义 | 告警阈值 |
|------|------|----------|
| r/s | 每秒读次数 | - |
| w/s | 每秒写次数 | - |
| rkB/s | 每秒读取 KB | - |
| wkB/s | 每秒写入 KB | - |
| %util | 磁盘利用率 | > 80% |
| aqu-sz | 平均队列长度 | > 2 |
| await | 平均 IO 等待时间(ms) | > 20ms (SSD) / > 10ms (NVMe) |
| svctm | 平均服务时间(ms) | > 10ms |

**最重要的指标：**

1. **%util**：磁盘利用率。> 80% 说明磁盘接近满载。
2. **await**：IO 等待时间。这是应用感受到的延迟，包括了排队时间和服务时间。SSD 通常 < 5ms，HDD < 20ms。
3. **aqu-sz**：队列长度。> 2 说明 IO 请求在排队。

### 2.3 实例分析

```
# 正常状态
sda   r/s=50  w/s=100  %util=30  await=2.5  aqu-sz=0.5

# IO 瓶颈
sda   r/s=200 w/s=500  %util=98  await=85.3 aqu-sz=12.0
```

瓶颈状态分析：
- %util=98% → 磁盘几乎满载
- await=85.3ms → 每个IO要等 85ms（SSD正常应 < 5ms）
- aqu-sz=12.0 → 12 个 IO 请求在排队

## 三、定位高 IO 进程

### 3.1 iotop

```bash
# 安装
yum install -y iotop   # CentOS
apt install -y iotop   # Ubuntu

# 运行
iotop -o  # 只显示有 IO 的进程

# 输出：
Total DISK READ: 800.00 K/s | Total DISK WRITE: 50.00 M/s
  TID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND
  123  be/4  root      0.00 B/s   45.00 M/s   0.00 %  85.0 %  java -jar app.jar
  456  be/4  mysql     0.00 B/s    3.50 M/s   0.00 %   5.0 %  mysqld
  789  be/4  root      0.00 B/s    1.20 M/s   0.00 %   2.0 %  nginx: worker
```

java 进程写入 45 MB/s，IO 占用 85%——这是 IO 消耗大户。

### 3.2 pidstat

```bash
# 查看进程级 IO 统计
pidstat -d 1

# 输出：
PID   USER   Read/s  Write/s  Command
123   root   0       45 MB/s  java
456   mysql  0       3.5 MB/s mysqld
```

### 3.3 /proc 方式

```bash
# 查看每个进程的 IO 统计
for pid in $(ls /proc/ | grep -E '^[0-9]+$'); do
    io=$(cat /proc/$pid/io 2>/dev/null | grep write_bytes | awk '{print $2}')
    cmd=$(cat /proc/$pid/comm 2>/dev/null)
    if [ "$io" -gt 1048576 ]; then  # > 1MB
        echo "PID=$pid CMD=$cmd WriteBytes=$io"
    fi
done
```

### 3.4 lsof 查看文件描述符

```bash
# 查看某个进程打开的文件
lsof -p <PID> | grep -E "\.log$|\.dat$|\.db$"

# 查看哪个文件在被写入
lsof -p <PID> | grep -i log
```

## 四、常见高 IO 场景与优化

### 4.1 日志写入过高

这是 Java 应用最常见的 IO 问题。

**问题代码：同步写大量日志**

```xml
<!-- Logback 配置：同步写入 -->
<appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>/data/logs/app.log</file>
    <encoder>
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
</appender>
```

每个请求产生大量日志，同步写磁盘会阻塞线程。

**优化一：使用异步日志**

```xml
<!-- Logback 异步 Appender -->
<appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
    <queueSize>4096</queueSize>          <!-- 异步队列大小 -->
    <discardingThreshold>0</discardingThreshold>  <!-- 队列满时不丢弃 -->
    <neverBlock>true</neverBlock>         <!-- 队列满时不阻塞业务线程 -->
    <appender-ref ref="FILE" />
</appender>
```

**优化二：调整日志级别**

```xml
<!-- 生产环境调高日志级别 -->
<root level="INFO">
    <appender-ref ref="ASYNC_FILE" />
</root>

<!-- 框架日志调高 -->
<logger name="org.springframework" level="WARN"/>
<logger name="org.hibernate" level="WARN"/>
<logger name="com.zaxxer.hikari" level="WARN"/>
```

**优化三：采样日志**

```java
// 问题：每次调用都打日志
public void processOrder(Order order) {
    log.info("处理订单: {}", order);  // 每次都打
}

// 优化：采样打印（10% 的请求打日志）
private final AtomicInteger counter = new AtomicInteger(0);

public void processOrder(Order order) {
    if (counter.getAndIncrement() % 10 == 0) {
        log.info("处理订单（采样）: {}", order);
    }
}
```

**优化四：日志压缩和轮转**

```xml
<appender name="ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/data/logs/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>/data/logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
        <maxFileSize>200MB</maxFileSize>
        <maxHistory>30</maxHistory>
        <totalSizeCap>10GB</totalSizeCap>
    </rollingPolicy>
    <encoder>
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
</appender>
```

`.gz` 后缀会自动压缩历史日志，压缩比通常 10:1。

### 4.2 文件读写优化

**问题代码：小包频繁读写**

```java
// 问题：每次读 1KB，读 10000 次 = 10000 次系统调用
public String readFile(String path) throws IOException {
    StringBuilder sb = new StringBuilder();
    try (FileInputStream fis = new FileInputStream(path)) {
        byte[] buffer = new byte[1024];  // 1KB buffer
        int len;
        while ((len = fis.read(buffer)) != -1) {
            sb.append(new String(buffer, 0, len));
        }
    }
    return sb.toString();
}
```

**优化：使用更大的缓冲区**

```java
// 优化：使用 8KB 或更大的 buffer
public String readFile(String path) throws IOException {
    StringBuilder sb = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(
            new FileReader(path), 8192)) {  // 8KB buffer
        char[] buffer = new char[8192];
        int len;
        while ((len = reader.read(buffer)) != -1) {
            sb.append(buffer, 0, len);
        }
    }
    return sb.toString();
}

// 更优：使用 NIO 的 FileChannel + ByteBuffer
public String readFileNIO(String path) throws IOException {
    try (FileChannel channel = FileChannel.open(Paths.get(path), StandardOpenOption.READ)) {
        ByteBuffer buffer = ByteBuffer.allocateDirect(64 * 1024);  // 64KB 直接缓冲区
        StringBuilder sb = new StringBuilder();
        while (channel.read(buffer) != -1) {
            buffer.flip();
            sb.append(StandardCharsets.UTF_8.decode(buffer));
            buffer.clear();
        }
        return sb.toString();
    }
}
```

**写入优化：批量写入**

```java
// 问题：逐条写入
public void writeData(List<String> lines) throws IOException {
    try (FileWriter writer = new FileWriter("/data/output.txt")) {
        for (String line : lines) {
            writer.write(line + "\n");  // 每行一次 IO
        }
    }
}

// 优化：使用 BufferedWriter 批量写入
public void writeData(List<String> lines) throws IOException {
    try (BufferedWriter writer = new BufferedWriter(
            new FileWriter("/data/output.txt"), 65536)) {  // 64KB buffer
        for (String line : lines) {
            writer.write(line);
            writer.newLine();
        }
    }
}
```

### 4.3 数据库 IO 优化

**问题：大批量数据查询导致大量磁盘读**

```java
// 问题：一次性查询 100 万条数据
List<Order> orders = orderMapper.selectAll();  // 全部加载到内存
// MySQL 会将数据写入临时文件，导致大量磁盘 IO
```

**优化：分批查询 + 流式处理**

```java
// MyBatis 流式查询
@Select("SELECT * FROM orders WHERE create_time >= #{startTime}")
@Options(resultSetType = ResultSetType.FORWARD_ONLY, fetchSize = Integer.MIN_VALUE)
Cursor<Order> streamQuery(@Param("startTime") LocalDateTime startTime);

// 使用
try (Cursor<Order> cursor = orderMapper.streamQuery(startTime)) {
    cursor.forEach(order -> {
        processOrder(order);  // 逐条处理，不占用大量内存
    });
}
```

```java
// 批量写入优化
@Insert("<script>" +
    "INSERT INTO orders (order_no, amount, status) VALUES " +
    "<foreach collection='orders' item='order' separator=','>" +
    "(#{order.orderNo}, #{order.amount}, #{order.status})" +
    "</foreach>" +
    "</script>")
void batchInsert(@Param("orders") List<Order> orders);

// JDBC URL 加上 rewriteBatchedStatements=true
// jdbc:mysql://host:3306/db?rewriteBatchedStatements=true
```

### 4.4 临时文件 IO

**问题代码：大量临时文件**

```java
// 问题：每个请求创建临时文件
public void processRequest(Request req) throws IOException {
    File tempFile = File.createTempFile("req_", ".tmp");  // 频繁创建文件
    try {
        // 处理逻辑
        writeToFile(tempFile, req.getData());
        // ...
    } finally {
        tempFile.delete();  // 删除也是 IO 操作
    }
}
```

**优化：使用内存缓冲**

```java
public void processRequest(Request req) throws IOException {
    // 如果数据不大，直接在内存中处理
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    // 处理逻辑
    baos.write(req.getData());
    byte[] result = baos.toByteArray();
    // 不需要临时文件
}
```

## 五、系统级 IO 优化

### 5.1 IO 调度算法

```bash
# 查看当前 IO 调度算法
cat /sys/block/sda/queue/scheduler
# 输出: noop deadline [cfq] mq-deadline kyber bfq

# 修改 IO 调度算法
echo "mq-deadline" > /sys/block/sda/queue/scheduler
```

| 调度算法 | 适用场景 | 特点 |
|---------|---------|------|
| noop | SSD/NVMe | 最简单，不做排序 |
| deadline | 通用 | 保证 IO 不被饿死 |
| cfq | 传统 HDD | 公平分配 IO 带宽 |
| bfq | 桌面 | 交互式响应优先 |

SSD/NVMe 推荐 `noop` 或 `mq-deadline`，HDD 推荐 `deadline`。

### 5.2 文件系统优化

```bash
# 挂载选项优化
mount -o noatime,nodiratime /dev/sda1 /data

# noatime: 不更新文件访问时间，减少写操作
# nodiratime: 不更新目录访问时间

# /etc/fstab 永久生效
/dev/sda1  /data  ext4  defaults,noatime,nodiratime  0 2
```

### 5.3 Swap 优化

```bash
# 查看 swap 使用情况
free -h
# 如果 Swap 使用量大，说明内存不足导致频繁换页 → 大量 IO

# 降低 swappiness（减少 swap 使用）
sysctl -w vm.swappiness=10  # 默认 60，改为 10

# 生产环境建议
echo "vm.swappiness=10" >> /etc/sysctl.conf
```

### 5.4 磁盘选型

| 磁盘类型 | IOPS | 适用场景 |
|---------|------|---------|
| HDD 7200rpm | ~100 | 冷数据存储 |
| SATA SSD | ~10,000 | 通用 |
| NVMe SSD | ~100,000+ | 高性能数据库、日志 |
| 云盘 SSD | ~10,000-30,000 | 云数据库 |

**IOPS 计算：** 如果应用每秒写 5000 次日志，HDD（100 IOPS）显然不够，SSD（10000 IOPS）可以。

## 六、实战案例：日志导致 IO 瓶颈

### 6.1 问题背景

某应用接口响应时间从 50ms 飙升到 500ms，监控显示：

```
CPU: 25% (不高)
%iowait: 55% (很高)
load average: 12.5 (高)
磁盘 %util: 98%
磁盘 await: 45ms (高)
```

### 6.2 排查过程

**第一步：iostat 确认磁盘瓶颈**

```bash
iostat -x 1
# sda  w/s=800  wkB/s=40000  %util=98  await=45
# 磁盘每秒 800 次写，40MB/s，几乎满载
```

**第二步：iotop 找到高 IO 进程**

```bash
iotop -o
# java 进程写入 38MB/s，IO 占 90%
```

**第三步：lsof 查看在写什么文件**

```bash
lsof -p <PID> | grep "\.log"
# java  12345  root  120w  REG  8,1  2147483648  /data/logs/app.log
# 文件大小 2GB！
```

**第四步：查看日志配置**

```xml
<!-- 发现：同步写入 + DEBUG 级别 -->
<root level="DEBUG">
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>/data/logs/app.log</file>
    </appender>
</root>
```

根因：DEBUG 级别日志量巨大，同步写磁盘导致 IO 瓶颈。

### 6.3 修复方案

```xml
<!-- 1. 改为 INFO 级别 -->
<root level="INFO">
    <appender-ref ref="ASYNC_FILE" />
</root>

<!-- 2. 使用异步 Appender -->
<appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
    <queueSize>8192</queueSize>
    <discardingThreshold>0</discardingThreshold>
    <neverBlock>true</neverBlock>
    <appender-ref ref="ROLLING_FILE" />
</appender>

<!-- 3. 日志轮转 + 压缩 -->
<appender name="ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>/data/logs/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>/data/logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
        <maxFileSize>200MB</maxFileSize>
        <maxHistory>30</maxHistory>
        <totalSizeCap>5GB</totalSizeCap>
    </rollingPolicy>
    <encoder>
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
</appender>
```

修复后效果：

```
CPU: 30%
%iowait: 5% (正常)
load average: 2.1 (正常)
磁盘 %util: 25%
接口响应: 55ms (正常)
```

## 七、面试要点总结

### Q1：磁盘 IO 高怎么排查？

1. `iostat -x 1` 查看 %util、await、aqu-sz
2. `iotop -o` 找到高 IO 进程
3. `lsof -p <PID>` 查看在读写什么文件
4. 针对文件类型分析（日志？数据？临时文件？）
5. 代码优化（异步、批量、缓存）

### Q2：iostat 中 %util 和 await 分别表示什么？

- **%util**：磁盘利用率，磁盘在采样周期内有 IO 的时间占比。> 80% 说明接近满载
- **await**：每个 IO 请求的平均等待时间（排队 + 服务）。SSD 正常 < 5ms，HDD < 20ms

### Q3：Java 应用日志 IO 高怎么优化？

1. 生产环境使用 INFO 级别，关闭 DEBUG
2. 使用异步 Appender（AsyncAppender）
3. 日志轮转 + 压缩（.gz）
4. 采样打印（不是每条都打）
5. 框架日志调高到 WARN

### Q4：load average 高但 CPU 不高是什么原因？

通常是 IO 等待导致的。`load average` 包含了等待 CPU 和等待 IO 的进程。`%iowait` 高说明大量进程在等磁盘 IO。

### Q5：文件读写如何优化？

1. 使用 BufferedInputStream/BufferedReader（增加缓冲区）
2. 使用 NIO 的 FileChannel + ByteBuffer
3. 使用 DirectByteBuffer 减少内存拷贝
4. 批量写入而非逐条写入
5. 小文件用内存替代临时文件
6. 数据库使用流式查询避免大结果集

## 八、总结

磁盘 IO 排查的核心路径：

```
iostat 确认 IO 瓶颈
  → iotop 找到高 IO 进程
    → lsof 查看具体文件
      → 代码优化（日志/文件/DB）
        → 系统优化（调度算法/文件系统/硬件）
```

Java 应用 IO 问题的 90% 是日志导致的。优化日志配置是最投入产出比最高的操作：

1. **异步** — AsyncAppender
2. **高级别** — INFO/WARN
3. **压缩** — .gz 轮转
4. **限量** — totalSizeCap

记住：**磁盘是最慢的硬件，能不写就不写，能少写就少写，能异步就异步**。
