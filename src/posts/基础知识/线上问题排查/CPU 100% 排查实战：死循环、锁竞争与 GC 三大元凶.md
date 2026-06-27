---
title: CPU 100% 排查实战：死循环、锁竞争与 GC 三大元凶
tag: ["CPU", "线上问题排查", "性能优化"]
category: 线上问题排查
date: 2026-06-27
---

# CPU 100% 排查实战：死循环、锁竞争与 GC 三大元凶

线上 CPU 100% 是最常见的高优故障。本文覆盖从告警到定位到修复的完整链路，所有命令均可直接使用。

---

## 一、CPU 飙高的三大元凶

| 元凶 | 特征 | 占用表现 |
|------|------|---------|
| 死循环/大量计算 | 某个业务线程 CPU 独高 | 单线程 CPU 接近 100% |
| GC 频繁 | GC 线程组 CPU 高 | 多个 GC 线程均高，伴随 Full GC |
| 锁竞争 | 多个线程 CPU 均高但无产出 | 上下文切换极高，sys CPU 远高于 user CPU |

---

## 二、排查五步法

### 步骤1：确认进程

```bash
top
# 找到 CPU 最高的 Java 进程 PID
```

### 步骤2：定位线程

```bash
top -Hp <pid>
# -H 显示线程级，找到 CPU 最高的线程 ID
# 将线程 ID 转为十六进制
printf "0x%x\n" <tid>
# 例如 12345 -> 0x3039
```

### 步骤3：查看线程堆栈

```bash
jstack <pid> | grep -A 30 "0x3039"
# 找到对应线程的堆栈，看它卡在哪里
```

### 步骤4：区分原因

```
如果堆栈在业务代码里 → 死循环或大量计算
如果堆栈在 GC 线程 → GC 问题（参考 Full GC 排查文章）
如果堆栈在 BLOCKED/WAITING → 锁竞争
```

### 步骤5：修复

根据具体原因修复，下面分类讲。

---

## 三、元凶一：死循环与大量计算

### 3.1 典型代码

```java
// 场景1：while 循环条件错误
while (flag) {
    // flag 永远为 true，且循环体内没有 sleep
    process();
}

// 场景2：正则灾难（ReDoS）
String regex = "(a+)+$";
"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!".matches(regex);
// 指数级回溯，CPU 直接拉满

// 场景3：HashMap 多线程死循环（JDK 7）
// JDK 8 虽然修复了死循环，但多线程 put 仍可能数据丢失
Map<String, String> map = new HashMap<>();
// 多线程并发 put + resize
```

### 3.2 排查过程

```bash
# 1. 找到高 CPU 线程
top -Hp <pid>
# 假设线程 TID = 12345

# 2. 转十六进制
printf "0x%x\n" 12345
# 输出 0x3039

# 3. 查看堆栈
jstack <pid> | grep -A 50 "nid=0x3039"
```

典型输出：

```
"http-nio-8080-exec-3" #15 daemon prio=5 os_prio=0 tid=0x... nid=0x3039 runnable [0x...]
   java.lang.Thread.State: RUNNABLE
        at com.example.service.OrderService.calculatePrice(OrderService.java:128)
        at com.example.service.OrderService.processOrder(OrderService.java:95)
        at com.example.controller.OrderController.create(OrderController.java:45)
```

看到 `OrderService.java:128` 处于 RUNNABLE 状态，直接去看代码。

### 3.3 解决方案

```java
// 1. while 循环加 sleep
while (flag) {
    process();
    Thread.sleep(100); // 让出 CPU
}

// 2. 正则预编译 + 超时
private static final Pattern SAFE_PATTERN = Pattern.compile("^[a-zA-Z0-9]{1,100}$");
// 避免使用回溯风险的正则，或使用长度限制

// 3. 使用 ConcurrentHashMap 替代 HashMap
Map<String, String> map = new ConcurrentHashMap<>();
```

---

## 四、元凶二：GC 频繁

### 4.1 判断方法

```bash
# top -H 发现高 CPU 线程名都是 GC task thread
"http-nio-8080-exec-3" nid=0x3039 RUNNABLE
"GC task thread#0 (ParallelGC)" nid=0x3031 RUNNABLE
"GC task thread#1 (ParallelGC)" nid=0x3032 RUNNABLE
"GC task thread#2 (ParallelGC)" nid=0x3033 RUNNABLE
```

多个 GC 线程同时高 CPU，基本确认是 GC 问题，直接转 Full GC 排查流程。

### 4.2 快速止血

```bash
# 临时扩堆（需要重启）
# 修改 JVM 参数 -Xmx4g -> -Xmx8g

# 或者在 K8s 环境中临时扩容
kubectl scale deployment <app> --replicas=4
```

---

## 五、元凶三：锁竞争

### 5.1 判断方法

```bash
# 1. 查看 CPU 是否 sys 远高于 user
top
# us: 15%  sy: 85%  → sys 占比极高，说明内核态开销大，大概率是锁竞争

# 2. 查看上下文切换次数
pidstat -w -p <pid> 1 5
# cswch/s（自愿切换）和 nvcswch/s（非自愿切换）都很高

# 3. jstack 查看线程状态
jstack <pid> | grep "java.lang.Thread.State" | sort | uniq -c | sort -rn
# 如果 BLOCKED 状态的线程很多，就是锁竞争
```

### 5.2 典型场景

```java
// 场景1：synchronized 锁粒度太粗
public class OrderService {
    public synchronized void processOrder(Order order) {
        // 整个方法加锁，所有订单串行处理
        validate(order);    // 校验，不需要锁
        calculate(order);   // 计算，不需要锁
        save(order);        // 入库，需要锁
    }
}

// 场景2：数据库连接池耗尽，线程都在等连接
// 连接池 max-active=10，但并发 200，190 个线程在等连接

// 场景3：分布式锁未设置超时
RLock lock = redissonClient.getLock("order_lock");
lock.lock(); // 没有超时，如果持有锁的线程挂了，所有线程永久阻塞
```

### 5.3 解决方案

```java
// 1. 缩小锁粒度
public void processOrder(Order order) {
    validate(order);   // 无锁
    calculate(order);  // 无锁
    synchronized (this) {
        save(order);   // 只锁需要同步的部分
    }
}

// 更好的方式：用细粒度锁
private final Striped<Lock> locks = Striped.lock(64);
public void processOrder(Order order) {
    Lock lock = locks.get(order.getUserId());
    lock.lock();
    try {
        save(order);
    } finally {
        lock.unlock();
    }
}

// 2. 调整连接池配置
spring:
  datasource:
    hikari:
      maximum-pool-size: 50        # 根据并发量调整
      connection-timeout: 3000     # 获取连接超时 3 秒
      max-lifetime: 1800000        # 连接最大生命周期 30 分钟

// 3. 分布式锁设置超时
RLock lock = redissonClient.getLock("order_lock");
boolean acquired = lock.tryLock(3, 30, TimeUnit.SECONDS);
// 等待 3 秒，持有 30 秒自动释放
if (!acquired) {
    throw new BusinessException("系统繁忙，请稍后重试");
}
try {
    // 业务逻辑
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

---

## 六、其他常见 CPU 飙高场景

### 6.1 序列化/反序列化大对象

```java
// Jackson 序列化一个包含 10 万条数据的 List
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(hugeList); // CPU 和内存双爆

// 解决：分批序列化或用流式 API
try (JsonGenerator gen = mapper.getFactory().createGenerator(out)) {
    gen.writeStartArray();
    for (Item item : hugeList) {
        gen.writeObject(item);
    }
    gen.writeEndArray();
}
```

### 6.2 日志异步队列阻塞

```java
// Log4j2 异步队列满了后会阻塞业务线程
// 配置异步日志队列大小
<AsyncLoggerRingBufferSize>262144</AsyncLoggerRingBufferSize>

// 或者使用 Disruptor 作为异步日志队列（Log4j2 默认）
```

### 6.3 全表扫描导致数据库 CPU 传导

```java
// MyBatis 动态 SQL 拼接出错，导致全表扫描
// 排查：查看慢查询日志，发现 SQL 没有 WHERE 条件
// 解决：修复 SQL，加索引
```

---

## 七、Arthas 在线诊断实战

```bash
# 安装启动
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar <pid>

# 1. dashboard 总览
dashboard

# 2. thread 查看高 CPU 线程
thread -n 3
# 打印 CPU 占比最高的 3 个线程堆栈

# 3. thread 查看阻塞线程
thread -b
# 找出阻塞其他线程的"罪魁祸首"

# 4. trace 追踪方法耗时
trace com.example.Service method -n 5
# 找出方法内部哪一步最耗时

# 5. watch 观察方法入参出参
watch com.example.Service method "{params, returnObj}" -x 2

# 6. profiler 生成火焰图
profiler start
# 等 30 秒
profiler stop --format html
# 生成火焰图，直观看 CPU 花在哪里
```

---

## 八、面试要点

### Q：线上 CPU 100% 怎么排查？

**标准回答**：
1. `top` 找到 CPU 最高的 Java 进程
2. `top -Hp <pid>` 找到 CPU 最高的线程
3. `printf "0x%x" <tid>` 转十六进制
4. `jstack <pid> | grep <hex_tid>` 查看线程堆栈
5. 根据堆栈判断：业务代码（死循环/计算）、GC 线程（Full GC）、BLOCKED（锁竞争）
6. 对症修复：修代码、调 JVM 参数、优化锁

### Q：sys CPU 高但 user CPU 低是什么原因？

大概率是**锁竞争**导致大量上下文切换。线程在内核态做调度切换，但用户态没有实际计算。用 `pidstat -w` 看上下文切换次数确认。

---

## 九、总结

CPU 100% 排查的核心是**定位到线程级别**。记住五步法：top → top -Hp → printf hex → jstack → 看堆栈分类处理。

生产环境必备：
1. APM 监控（SkyWalking/Pinpoint）能快速定位慢接口
2. Arthas 预装，随时在线诊断
3. JVM 监控告警（Prometheus + JVM Exporter）
4. 日志规范，关键路径有 traceId
