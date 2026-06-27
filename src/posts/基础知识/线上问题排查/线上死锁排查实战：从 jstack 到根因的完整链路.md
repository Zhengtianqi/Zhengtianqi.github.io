---
title: 线上死锁排查实战：从 jstack 到根因的完整链路
tag: ["死锁", "jstack", "线程排查", "Java", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 线上死锁排查实战：从 jstack 到根因的完整链路

> 凌晨 3 点，你被电话叫醒：线上某个接口全部超时，用户疯狂投诉。你打开监控发现 CPU 不高、内存正常，但请求就是卡住不动——大概率是死锁了。本文带你从现象到根因，完整走一遍死锁排查的全链路。

## 一、死锁是什么？先搞清楚概念

死锁（Deadlock）是指两个或两个以上的线程在执行过程中，因争夺资源而造成的一种互相等待的现象。如果没有外力干预，它们都将无法继续执行。

经典的死锁四个必要条件（缺一不可）：

1. **互斥条件**：资源同一时刻只能被一个线程占用
2. **请求与保持条件**：线程已获得部分资源，又请求新资源时被阻塞，但不释放已占有的资源
3. **不剥夺条件**：线程已获得的资源不能被其他线程强行剥夺
4. **循环等待条件**：若干线程之间形成头尾相接的循环等待资源关系

在实际的 Java 后端开发中，我们常遇到三类死锁：

- **synchronized 关键字导致的死锁** — 最经典，也最容易复现
- **数据库层面的死锁** — 行锁冲突导致的事务死锁
- **分布式锁死锁** — Redis/Zookeeper 分布式锁使用不当

下面我们逐一排查。

## 二、synchronized 死锁排查

### 2.1 模拟一个经典的 synchronized 死锁

先写一段能产生死锁的代码，方便后续分析：

```java
public class DeadLockDemo {

    private static final Object lockA = new Object();
    private static final Object lockB = new Object();

    public static void main(String[] args) {
        // 线程1：先拿 A，再拿 B
        new Thread(() -> {
            synchronized (lockA) {
                System.out.println("Thread-1 拿到了 lockA");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (lockB) {
                    System.out.println("Thread-1 拿到了 lockB");
                }
            }
        }, "Thread-1").start();

        // 线程2：先拿 B，再拿 A
        new Thread(() -> {
            synchronized (lockB) {
                System.out.println("Thread-2 拿到了 lockB");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (lockA) {
                    System.out.println("Thread-2 拿到了 lockA");
                }
            }
        }, "Thread-2").start();
    }
}
```

运行后你会看到：

```
Thread-1 拿到了 lockA
Thread-2 拿到了 lockB
```

然后程序就卡住了，永远不会打印第三行。这就是死锁。

### 2.2 第一步：用 jps 找到进程

```bash
jps -l
```

输出：

```
12345 com.example.DeadLockDemo
23456 sun.tools.jps.Jps
```

找到你的 Java 进程 PID，这里是 `12345`。

### 2.3 第二步：用 jstack 抓取线程快照

```bash
jstack 12345 > thread_dump.txt
```

打开 `thread_dump.txt`，直接搜索 `deadlock`：

```
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f8b0c0062b8 (object 0x000000076b6a0a90, a java.lang.Object),
  which is held by "Thread-2"
"Thread-2":
  waiting to lock monitor 0x00007f8b0c003ed8 (object 0x000000076b6a0a80, a java.lang.Object),
  which is held by "Thread-1"

Java stack information for the threads listed above:
===================================================
"Thread-1":
    at DeadLockDemo.lambda$main$0(DeadLockDemo.java:18)
    - waiting to lock <0x000000076b6a0a90> (a java.lang.Object)  ← 等待 lockB
    - locked <0x000000076b6a0a80> (a java.lang.Object)            ← 已持有 lockA
"Thread-2":
    at DeadLockDemo.lambda$main$1(DeadLockDemo.java:31)
    - waiting to lock <0x000000076b6a0a80> (a java.lang.Object)  ← 等待 lockA
    - locked <0x000000076b6a0a90> (a java.lang.Object)            ← 已持有 lockB

Found 1 deadlock.
```

jstack 非常贴心，直接告诉你 `Found 1 deadlock`，并且画出了完整的等待链：

- Thread-1 持有 lockA，等待 lockB
- Thread-2 持有 lockB，等待 lockA

### 2.4 第三步：在线上环境如何自动化抓取

线上环境不可能让你手动敲 jstack。通常的做法是：

**方案一：脚本定时采集**

```bash
#!/bin/bash
PID=$(jps -l | grep 'your-app' | awk '{print $1}')
jstack $PID > /data/dumps/thread_$(date +%Y%m%d_%H%M%S).txt
```

**方案二：通过 JMX 自动检测死锁**

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;

public class DeadlockDetector {

    public static void checkDeadlock() {
        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        long[] deadlockedThreads = threadBean.findDeadlockedThreads();

        if (deadlockedThreads != null && deadlockedThreads.length > 0) {
            // 触发告警
            System.err.println("检测到死锁！线程 ID: "
                + Arrays.toString(deadlockedThreads));
            // 自动 dump 线程栈
            ThreadInfo[] threadInfos = threadBean.getThreadInfo(deadlockedThreads);
            for (ThreadInfo info : threadInfos) {
                System.err.println(info);
            }
            // 可以在这里触发 jstack dump 或发送告警邮件
        }
    }
}
```

**方案三：Arthas 在线诊断**

```bash
# 下载 arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar

# 启动并选择目标进程
java -jar arthas-boot.jar

# 查看死锁
thread -b   # 找出阻塞其他线程的线程
thread     # 查看所有线程状态
```

### 2.5 修复方案

**修复方案一：统一加锁顺序**

最简单有效的方案——所有线程按相同顺序获取锁：

```java
// 修复后：两个线程都先拿 lockA，再拿 lockB
public static void main(String[] args) {
    new Thread(() -> {
        synchronized (lockA) {       // 先拿 A
            synchronized (lockB) {   // 再拿 B
                // do something
            }
        }
    }, "Thread-1").start();

    new Thread(() -> {
        synchronized (lockA) {       // 先拿 A，不再是先拿 B
            synchronized (lockB) {   // 再拿 B
                // do something
            }
        }
    }, "Thread-2").start();
}
```

**修复方案二：使用 tryLock 带超时**

```java
import java.util.concurrent.locks.ReentrantLock;

private static final ReentrantLock lockA = new ReentrantLock();
private static final ReentrantLock lockB = new ReentrantLock();

new Thread(() -> {
    try {
        if (lockA.tryLock(3, TimeUnit.SECONDS)) {
            try {
                if (lockB.tryLock(3, TimeUnit.SECONDS)) {
                    try {
                        // do something
                    } finally {
                        lockB.unlock();
                    }
                }
            } finally {
                lockA.unlock();
            }
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}, "Thread-1").start();
```

`tryLock` 带超时的好处是：即使发生死锁，也能在超时后自动退出，释放资源，打破死锁状态。

## 三、数据库死锁排查

### 3.1 数据库死锁长什么样

数据库死锁通常表现为业务日志中突然出现大量异常：

```
org.springframework.dao.DeadlockLoserDataAccessException:
### Error updating database.  Cause: com.mysql.cj.jdbc.exceptions.MySQLTransactionDeadlockDetectionException
### SQL: UPDATE account SET balance = balance - ? WHERE id = ?
### The error occurred while setting parameters
### SQL: Deadlock found when trying to get lock; try restarting transaction
```

### 3.2 MySQL 死锁排查步骤

**第一步：查看最近一次死锁日志**

```sql
SHOW ENGINE INNODB STATUS\G
```

在输出的 `LATEST DETECTED DEADLOCK` 部分：

```
========================
LATEST DETECTED DEADLOCK
========================
*** (1) TRANSACTION:
TRANSACTION 12345, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 3 lock struct(s), heap size 1136, 2 row lock(s)
UPDATE account SET balance = balance - 100 WHERE id = 2

*** (2) TRANSACTION:
TRANSACTION 12346, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
3 lock struct(s), heap size 1136, 2 row lock(s)
UPDATE account SET balance = balance - 100 WHERE id = 1

*** (2) HOLDS THE LOCK(S):
RECORD LOCKS space id 50 page no 3 n bits 72 index PRIMARY of table `test`.`account`
trx id 12346 lock_mode X locks rec but not gap

*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 50 page no 3 n bits 72 index PRIMARY of table `test`.`account`
trx id 12346 lock_mode X locks rec but not gap waiting

*** (1) TRANSACTION:
TRANSACTION 12345, ACTIVE 2 sec starting index read
mysql tables in use 1, locked 1
3 lock lock struct(s), heap size 1136, 2 row lock(s)
UPDATE account SET balance = balance - 100 WHERE id = 1

*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 50 page no 3 n bits 72 index PRIMARY of table `test`.`account`
trx id 12345 lock_mode X locks rec but not gap waiting

*** (2) ROLLS BACK TRANSACTION
```

从死锁日志中可以清晰地看到：
- 事务 A 要更新 id=1 的行，但该行被事务 B 锁住
- 事务 B 要更新 id=2 的行，但该行被事务 A 锁住
- MySQL 选择回滚代价较小的事务 B

**第二步：确认是否开启了死锁日志**

```sql
-- 查看死锁日志是否开启
SHOW VARIABLES LIKE 'innodb_print_all_deadlocks';

-- 如果没开启，建议开启（记录所有死锁到 error log）
SET GLOBAL innodb_print_all_deadlocks = ON;
```

**第三步：开启全量事务日志辅助排查**

```sql
-- 开启 general log（仅排查期间开启，生产谨慎使用）
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general.log';
```

### 3.3 常见数据库死锁场景

**场景一：交叉更新**

```java
// 转账逻辑：A 转 B，同时 B 转 A
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 事务1: A→B，先锁 from(A) 再锁 to(B)
    accountMapper.deduct(fromId, amount);
    accountMapper.add(toId, amount);
}

@Transactional
public void transferReverse(Long fromId, Long toId, BigDecimal amount) {
    // 事务2: B→A，先锁 from(B) 再锁 to(A)
    // 两个事务并发执行时就会死锁
    accountMapper.deduct(fromId, amount);
    accountMapper.add(toId, amount);
}
```

**场景二：唯一索引冲突 + INSERT 死锁**

多个线程并发 INSERT 相同的唯一键值，会触发 `S锁 → X锁` 的升级过程，导致死锁。

**场景三：间隙锁（Gap Lock）死锁**

在 RR（可重复读）隔离级别下，范围查询会加间隙锁：

```sql
-- 事务1：锁住 (10, 20) 的间隙
SELECT * FROM orders WHERE amount > 10 AND amount < 20 FOR UPDATE;

-- 事务2：尝试在间隙中插入
INSERT INTO orders (amount) VALUES (15);  -- 被阻塞

-- 同时事务1又尝试做其他操作，恰好等事务2持有的锁 → 死锁
```

### 3.4 数据库死锁修复方案

**方案一：统一操作顺序**

```java
// 修复：转账时始终按 ID 从小到大的顺序加锁
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    Long first = Math.min(fromId, toId);
    Long second = Math.max(fromId, toId);

    // 先操作 ID 小的，再操作 ID 大的
    accountMapper.deduct(first, amount);
    accountMapper.add(second, amount);
}
```

**方案二：降低隔离级别为 RC**

```sql
-- 将隔离级别从 RR 改为 RC，消除间隙锁
SET GLOBAL transaction_isolation = 'READ-COMMITTED';
```

注意：RC 级别会引入不可重复读问题，需要根据业务场景权衡。

**方案三：合理使用索引**

没有索引的更新操作会锁表，走索引则只锁行。确保更新条件都走索引：

```sql
-- 确认更新走的是索引
EXPLAIN UPDATE account SET balance = balance - 100 WHERE id = 1;
-- type 应该是 const 或 ref，不能是 ALL
```

**方案四：捕获死锁异常并重试**

```java
@Retryable(
    value = DeadlockLoserDataAccessException.class,
    maxAttempts = 3,
    backoff = @Backoff(delay = 100, multiplier = 2)
)
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    accountMapper.deduct(fromId, amount);
    accountMapper.add(toId, amount);
}
```

## 四、分布式锁死锁排查

### 4.1 Redis 分布式锁死锁场景

**场景一：锁未设置过期时间**

```java
// 错误示范：没有设置过期时间
String lockKey = "lock:order:" + orderId;
jedis.set(lockKey, "value");  // 没有 NX + PX 参数
try {
    // 业务逻辑
    // 如果这里抛异常，锁永远不释放 → 死锁
} finally {
    jedis.del(lockKey);  // 可能执行不到
}
```

**场景二：锁过期但业务未执行完**

```java
// 线程A获取锁，过期时间10秒
jedis.set(lockKey, "threadA", SetParams.setParams().nx().px(10000));

// 线程A业务执行了15秒，锁在第10秒自动释放
// 线程B在第10秒获取到锁

// 线程A执行完，del 了线程B的锁！
// 线程C又来获取锁...连锁问题
jedis.del(lockKey);
```

### 4.2 排查方法

**查看 Redis 中的锁**

```bash
# 查看锁是否存在
redis-cli GET lock:order:12345

# 查看锁的 TTL
redis-cli TTL lock:order:12345

# 如果返回 -1，说明锁没有过期时间 → 死锁
# 如果返回 -2，说明锁不存在
```

**使用 Redisson 的看门狗机制**

Redisson 提供了自动续期的看门狗（Watchdog），默认每 10 秒续期一次，续到 30 秒：

```java
Config config = new Config();
config.useSingleServer().setAddress("redis://127.0.0.1:6379");
RedissonClient redisson = Redisson.create(config);

RLock lock = redisson.getLock("lock:order:" + orderId);
try {
    // 默认看门狗续期，不需要手动设置过期时间
    lock.lock();
    // 业务逻辑
} finally {
    lock.unlock();
}
```

### 4.3 分布式锁最佳实践

```java
public boolean tryLockWithRetry(String lockKey, String requestId, int expireTime, int retryTimes) {
    int times = 0;
    while (times < retryTimes) {
        // 使用 Lua 脚本保证原子性
        String luaScript =
            "if redis.call('setnx', KEYS[1], ARGV[1]) == 1 then " +
            "    redis.call('expire', KEYS[1], ARGV[2]) " +
            "    return 1 " +
            "else " +
            "    return 0 " +
            "end";

        Long result = jedis.eval(luaScript, 1, lockKey, requestId, String.valueOf(expireTime));
        if (result != null && result == 1) {
            return true;
        }
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        times++;
    }
    return false;
}

// 释放锁时验证是否是自己的锁
public boolean unlock(String lockKey, String requestId) {
    String luaScript =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    Long result = jedis.eval(luaScript, 1, lockKey, requestId);
    return result != null && result == 1;
}
```

## 五、线上排查实战 SOP

当线上发生死锁时，按照以下 SOP 快速处理：

### 5.1 紧急止血

```
1. 确认死锁范围（影响哪些接口）
2. 如果是数据库死锁 → MySQL 会自动检测并回滚一个事务，通常能自愈
3. 如果是 Java 层死锁 → 重启应用（临时方案）
4. 如果是分布式锁死锁 → 手动清理 Redis 中的死锁 key
```

### 5.2 信息收集

```bash
# 1. 保存线程 dump（连续 3 次，间隔 5 秒）
jstack <PID> > /tmp/dump1.txt
sleep 5
jstack <PID> > /tmp/dump2.txt
sleep 5
jstack <PID> > /tmp/dump3.txt

# 2. 保存数据库死锁日志
mysql -e "SHOW ENGINE INNODB STATUS\G" > /tmp/innodb_status.txt

# 3. 保存 Redis 锁信息
redis-cli KEYS "lock:*" > /tmp/redis_locks.txt
```

### 5.3 根因分析

```
1. 分析 jstack dump，找到死锁线程
2. 对比 3 次 dump，确认是持续死锁还是偶发
3. 根据线程栈定位到具体代码行
4. 分析加锁顺序，画出锁依赖图
5. 制定修复方案
```

### 5.4 修复验证

```
1. 代码修复（统一加锁顺序 / tryLock 超时 / 降低锁粒度）
2. 编写单元测试覆盖并发场景
3. 预发环境压测验证
4. 灰度发布，持续观察
```

## 六、死锁预防的最佳实践

| 实践 | 说明 |
|------|------|
| 统一加锁顺序 | 所有线程按相同顺序获取锁，最有效的预防手段 |
| 缩小锁范围 | synchronized 块尽量小，减少持锁时间 |
| 使用 tryLock 带超时 | 避免永久等待，超时后自动释放 |
| 使用并发工具类 | 用 ConcurrentHashMap、AtomicLong 等替代手动加锁 |
| 数据库索引优化 | 确保 UPDATE/DELETE 走索引，避免锁升级 |
| 分布式锁设过期时间 | 必须设置合理的过期时间 + 看门狗续期 |
| 避免嵌套事务 | 事务中不要嵌套事务，减少锁持有时间 |

## 七、面试要点总结

### Q1：什么是死锁？产生死锁的四个必要条件是什么？

死锁是指两个或多个线程互相等待对方持有的资源，导致都无法继续执行。四个必要条件：互斥、请求与保持、不剥夺、循环等待。

### Q2：如何排查 Java 线上死锁？

使用 `jstack` 抓取线程快照，搜索 `deadlock` 关键字。jstack 会自动检测并输出死锁信息，包括每个线程持有的锁和等待的锁。也可以用 Arthas 的 `thread -b` 命令快速定位。

### Q3：如何预防 synchronized 死锁？

- 统一加锁顺序（最有效）
- 使用 `ReentrantLock.tryLock()` 带超时
- 减小锁粒度，缩小同步范围
- 使用并发容器替代手动加锁

### Q4：数据库死锁如何排查？

通过 `SHOW ENGINE INNODB STATUS` 查看死锁日志，找到两个事务的 SQL 和锁信息。常见原因是交叉更新同一批数据，解决方案是统一操作顺序、降低隔离级别或添加重试机制。

### Q5：Redis 分布式锁如何避免死锁？

- 设置合理的过期时间
- 使用 Lua 脚本保证加锁和设置过期时间的原子性
- 使用 Redisson 看门狗自动续期
- 释放锁时验证是否是自己的锁（防止误删）

## 八、总结

死锁是线上最常见的问题之一，但它也是最容易被定位的问题——jstack 和数据库死锁日志都能直接告诉你死锁在哪里。真正的难点在于：

1. **快速响应**：建立自动化告警，死锁发生时第一时间感知
2. **根因分析**：画出完整的锁依赖图，找到加锁顺序的矛盾点
3. **彻底修复**：不只是临时重启，要从代码层面消除死锁可能性
4. **预防机制**：建立编码规范，Code Review 时关注锁的使用

记住：**最好的排查是预防，最好的预防是规范**。
