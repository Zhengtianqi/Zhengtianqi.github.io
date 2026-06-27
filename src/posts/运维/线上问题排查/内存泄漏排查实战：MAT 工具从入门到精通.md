---
title: 内存泄漏排查实战：MAT 工具从入门到精通
tag: ["内存泄漏", "MAT", "JVM", "heap dump", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 内存泄漏排查实战：MAT 工具从入门到精通

> 线上服务每隔几天就 OOM 一次，重启后恢复正常，然后周而复始。这就是典型的内存泄漏场景。本文带你用 MAT（Memory Analyzer Tool）从 heap dump 中揪出内存泄漏的元凶。

## 一、什么是内存泄漏？

在 Java 中，内存泄漏（Memory Leak）是指：**对象已经不再使用，但仍然被 GC Root 可达，无法被垃圾回收器回收**。

与 C/C++ 的内存泄漏不同，Java 的内存泄漏不是"内存丢了"，而是"该回收的没回收"。

```java
// 典型的内存泄漏：静态 List 不断添加对象，从不清理
public class CacheManager {
    private static final List<byte[]> CACHE = new ArrayList<>();

    public void put(byte[] data) {
        CACHE.add(data);  // 永远不会被 GC 回收！
    }
}
```

### 内存泄漏 vs 内存溢出

- **内存泄漏（Memory Leak）**：对象无法被回收，堆内存逐渐被占满
- **内存溢出（OOM）**：堆内存不足，无法分配新对象，抛出 `OutOfMemoryError`

内存泄漏是"因"，内存溢出是"果"。持续的内存泄漏最终会导致 OOM。

## 二、Heap Dump 是什么？怎么抓？

### 2.1 什么是 Heap Dump

Heap Dump（堆转储）是 JVM 在某个时间点的内存快照，包含了：

- 所有 Java 对象的信息（类、字段、值）
- 对象之间的引用关系
- GC Root 信息
- 线程信息（栈帧中的局部变量）

常见格式是 HPROF 文件，可以用 MAT、JProfiler、VisualVM 等工具打开。

### 2.2 主动抓取 Heap Dump

**方法一：jmap 命令**

```bash
# 查看进程
jps -l
# 输出: 12345 com.example.MyApplication

# 抓取 heap dump
jmap -dump:format=b,file=/data/dumps/heap.hprof 12345
```

**方法二：jcmd 命令（推荐，JDK 8+）**

```bash
jcmd 12345 GC.heap_dump /data/dumps/heap.hprof
```

**方法三：JVM 参数自动抓取（推荐生产环境使用）**

```bash
# OOM 时自动生成 heap dump
java -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/data/dumps/ \
     -jar my-app.jar
```

这是最重要的配置——线上 OOM 时自动抓取 dump，事后分析。

**方法四：Arthas 在线抓取**

```bash
# 使用 Arthas
heapdump /data/dumps/heap.hprof
```

### 2.3 抓取时机很重要

```
内存使用曲线:
  100% ┤                                          ╱← OOM 发生
       │                                       ╱╱
   80% ┤                                    ╱╱
       │                                 ╱╱
   60% ┤                             ╱╱
       │                         ╱╱
   40% ┤                    ╱╱
       │               ╱╱
   20% ┤         ╱╱╱╱
        └──────────────────────────────────────────
        09:00   10:00   11:00   12:00   13:00   14:00
                                    ↑
                              在这里抓 dump 最合适
```

不要等到 OOM 再抓——那时候堆里全是各种对象，干扰太多。建议在内存使用率 70%-80% 时抓取，这时候泄漏对象已经积累到一定程度，但还没到不可分析的地步。

## 三、MAT 工具安装与基本使用

### 3.1 安装

**方式一：独立安装**

从 Eclipse 官网下载：https://eclipse.dev/mat/

**方式二：Eclipse 插件**

Help → Eclipse Marketplace → 搜索 "Memory Analyzer"

**方式三：命令行版本（适合服务器环境）**

```bash
# 下载并解压
wget https://archive.apache.org/dist/mat/1.14.0/MemoryAnalyzer-1.14.0-linux.gtk.x86_64.zip
unzip MemoryAnalyzer-1.14.0-linux.gtk.x86_64.zip

# 分析 heap dump（生成 HTML 报告）
./ParseHeapDump.sh /data/dumps/heap.hprof org.eclipse.mat.api:suspects
```

### 3.2 调整 MAT 内存

分析大 heap dump 需要给 MAT 分配足够的内存：

```ini
# 修改 MemoryAnalyzer.ini
-Xmx4g   # 分析 1G 的 dump 至少需要 2G 内存
-XX:+UseG1GC
```

### 3.3 打开 Heap Dump

File → Open Heap Dump → 选择 .hprof 文件

MAT 会自动生成 Leak Suspects Report（泄漏嫌疑报告），这是最快的分析入口。

## 四、MAT 核心概念详解

### 4.1 Shallow Heap vs Retained Heap

这是 MAT 最重要的两个概念：

- **Shallow Heap（浅堆）**：对象本身占用的内存大小
  - 一个 Integer 对象：16 字节（对象头 + int 值）
  - 一个 ArrayList 对象：约 40 字素（对象头 + 数组引用 + size 等）

- **Retained Heap（深堆 / 保留堆）**：对象被 GC 回收后能释放的总内存
  - 包括对象自身 + 所有仅通过该对象可达的其他对象
  - 一个 ArrayList 持有 10000 个 String，Retained Heap 可能是 500KB

```
GC Root
  │
  ├── ArrayList (Shallow: 40B, Retained: 500KB)
  │     ├── String "hello" (Shallow: 24B, Retained: 24B)
  │     ├── String "world" (Shallow: 24B, Retained: 24B)
  │     └── ... 10000 个 String
  │
  └── HashMap (Shallow: 48B, Retained: 300KB)
        └── ... 其他对象
```

**关键结论**：排查内存泄漏时，重点关注 **Retained Heap** 最大的对象。

### 4.2 GC Root

GC Root 是垃圾回收的起点，从 GC Root 可达的对象不会被回收。常见的 GC Root 类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| System Class | 系统类加载器加载的类 | java.util.HashMap 类中的静态字段 |
| Thread | 活跃线程 | 线程栈帧中的局部变量 |
| Java Local | 方法局部变量 | 正在执行的方法中的变量 |
| Static Field | 静态字段 | 类的 static 变量 |
| Finalizer | Finalizer 队列 | 等待执行 finalize() 的对象 |
| JNI Global | JNI 全局引用 | Native 代码持有的 Java 对象 |

内存泄漏的本质：对象被 GC Root 间接引用，无法被回收。

### 4.3 Dominator Tree（支配树）

支配树是 MAT 最核心的分析工具。它展示了对象的"支配关系"：

- 如果对象 A 支配对象 B，意味着所有到 B 的路径都必须经过 A
- 删除 A 就会删除 B 及其所有被支配的对象

```
Dominator Tree:
  ┌─ ArrayList (Retained: 500KB)          ← 支配 500KB
  │   ├─ String[10000] (Retained: 480KB)  ← 被支配
  │   │   ├─ String "hello" (24B)
  │   │   └─ ...
  │   └─ modCount (4B)
  │
  ┌─ Thread (Retained: 200KB)
  │   └─ StringBuilder (Retained: 180KB)
```

在支配树中，Retained Heap 最大的对象就是内存泄漏的主要嫌疑。

## 五、MAT 实战分析：五步定位内存泄漏

### 5.1 第一步：查看 Leak Suspects 报告

打开 heap dump 后，MAT 自动生成 Leak Suspects 报告：

```
Problem Suspect 1:
  The class "java.util.HashMap" occupies 850 MB (42.5%) of the heap.
  The memory is accumulated in one instance of "java.util.HashMap"
  loaded by "java.net.URLClassLoader @ 0x7f8b0c001234".

  Thread: http-nio-8080-exec-5
  Description: One instance of java.util.HashMap keeps 850MB.
```

这个报告直接告诉你：一个 HashMap 占了 850MB，这就是泄漏源头。

### 5.2 第二步：查看 Dominator Tree

菜单：MAT → Histogram → 点击 "Dominator Tree"

按 Retained Heap 降序排列，找到占用最大的对象：

```
Class Name                              | Shallow Heap | Retained Heap | Percentage
------------------------------------------------------------------------
java.util.HashMap                       | 48           | 850,000,000  | 42.50%
com.example.cache.LocalCache            | 32           | 850,000,048  | 42.50%
java.lang.Thread                        | 104          | 50,000,000   | 2.50%
byte[]                                  | 30,000,000   | 30,000,000   | 1.50%
```

可以看到 `LocalCache` 持有了一个 `HashMap`，占用了 850MB。

### 5.3 第三步：查看引用链（Path to GC Roots）

右键目标对象 → Merge Shortest Paths to GC Roots → exclude weak/soft references

```
http-nio-8080-exec-5 (Thread)
  └── local variable: LocalCache
      └── field: cache (HashMap)
          └── entry: "user:sessions"
              └── value: ArrayList
                  └── 500000 个 Session 对象
```

这条引用链告诉你：Thread → LocalCache → HashMap → ArrayList → 50 万个 Session 对象。

### 5.4 第四步：分析对象内容

右键 HashMap → List Objects → with incoming references：

```
java.util.HashMap @ 0x7f8b0c005678
  ├── "user:sessions" → ArrayList (500,000 entries)
  │     ├── Session (userId=1, lastAccess=2026-06-20 10:00:00)
  │     ├── Session (userId=2, lastAccess=2026-06-20 10:01:00)
  │     └── ... 50 万个，最早的 session 已经 7 天没访问了！
  │
  └── "user:profiles" → HashMap (10,000 entries)
```

找到问题：`user:sessions` 这个缓存 key 下有 50 万个 Session 对象，而且很多是 7 天前的，从未被清理。

### 5.5 第五步：定位代码

通过引用链中对象的类信息，定位到具体代码：

```java
// 问题代码：本地缓存只进不出
public class LocalCache {
    private static final Map<String, Object> CACHE = new HashMap<>();

    public static void put(String key, Object value) {
        CACHE.put(key, value);  // 只放不删！
    }

    public static Object get(String key) {
        return CACHE.get(key);
    }
    // 缺少：过期清理、容量限制、淘汰策略
}
```

## 六、常见内存泄漏场景

### 6.1 静态集合类泄漏

```java
// 最常见的泄漏：静态 Map 不断膨胀
public class UserCache {
    private static final Map<Long, User> USER_MAP = new HashMap<>();

    public static User getUser(Long id) {
        return USER_MAP.computeIfAbsent(id, UserMapper::selectById);
    }
    // USER_MAP 只增不减，最终 OOM
}
```

**修复：使用有容量限制的缓存**

```java
public class UserCache {
    // 使用 Caffeine，设置最大容量和过期时间
    private static final Cache<Long, User> USER_CACHE = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(30, TimeUnit.MINUTES)
        .build();

    public static User getUser(Long id) {
        return USER_CACHE.get(id, UserMapper::selectById);
    }
}
```

### 6.2 ThreadLocal 泄漏

```java
// 问题代码：线程池中 ThreadLocal 不清理
public class UserContext {
    private static final ThreadLocal<User> CURRENT_USER = new ThreadLocal<>();

    public static void setUser(User user) {
        CURRENT_USER.set(user);
    }
    // 没有调用 remove()！
}

// 线程池中的线程会被复用，ThreadLocal 中的 User 对象永远不会被回收
// 特别是 User 对象持有大字段时，泄漏更严重
```

**修复：使用完一定要 remove**

```java
public class UserInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        User user = parseUser(req);
        UserContext.setUser(user);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp,
                                 Object handler, Exception ex) {
        // 关键：请求结束后清理 ThreadLocal
        UserContext.remove();
    }
}
```

### 6.3 监听器未注销

```java
// 问题代码：注册了监听器但从未注销
public class OrderService {
    public OrderService(EventBus eventBus) {
        eventBus.register(this);  // 注册监听器
    }

    @Subscribe
    public void onEvent(OrderEvent event) {
        // 处理事件
    }
    // OrderService 被销毁时没有调用 eventBus.unregister(this)
    // EventBus 持有 OrderService 的引用，导致无法 GC
}
```

### 6.4 内部类持有外部类引用

```java
// 问题代码：非静态内部类持有外部类引用
public class Outer {
    private byte[] bigData = new byte[10 * 1024 * 1024];  // 10MB

    class Inner {  // 非静态内部类，隐式持有 Outer.this 引用
        public void doSomething() {
            // ...
        }
    }

    public Inner getInner() {
        return new Inner();  // 返回内部类实例
        // 只要 Inner 被持有，Outer（及其 10MB bigData）就无法被 GC
    }
}
```

**修复：使用静态内部类**

```java
public class Outer {
    private byte[] bigData = new byte[10 * 1024 * 1024];

    static class Inner {  // 静态内部类，不持有外部类引用
        public void doSomething() {
            // ...
        }
    }
}
```

### 6.5 数据库连接 / IO 资源未关闭

```java
// 问题代码：异常时连接未关闭
public User getUser(Long id) {
    Connection conn = dataSource.getConnection();
    PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
    ps.setLong(1, id);
    ResultSet rs = ps.executeQuery();
    if (rs.next()) {
        return mapUser(rs);
    }
    // 如果上面抛异常，conn 永远不会关闭 → 连接泄漏
    rs.close();
    ps.close();
    conn.close();
    return null;
}
```

**修复：try-with-resources**

```java
public User getUser(Long id) throws SQLException {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE id = ?")) {
        ps.setLong(1, id);
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return mapUser(rs);
            }
        }
    }
    return null;
}
```

## 七、MAT 高级技巧

### 7.1 OQL（Object Query Language）

MAT 支持 SQL 风格的对象查询语言：

```sql
-- 查询所有 ArrayList，size > 1000
SELECT * FROM java.util.ArrayList WHERE size > 1000

-- 查询所有 String，值包含 "session"
SELECT * FROM java.lang.String WHERE toString LIKE ".*session.*"

-- 查询某个类的所有实例
SELECT * FROM com.example.User

-- 查询 HashMap 中 key 包含 "cache" 的 entry
SELECT * FROM java.util.HashMap$Entry WHERE key.toString LIKE ".*cache.*"
```

### 7.2 对比两个 Heap Dump

当内存持续增长时，抓两个 dump 对比，找出增长的对象：

1. 打开 Dump A（早期）
2. 打开 Dump B（晚期）
3. 菜单：Compare → Compare Two Heap Dumps

```
Class Name              | A Count | B Count | Delta
----------------------------------------------------
java.lang.String        | 100,000 | 500,000 | +400,000  ← 暴涨！
java.util.HashMap$Entry | 50,000  | 250,000 | +200,000
byte[]                  | 10,000  | 50,000  | +40,000
```

String 暴涨了 40 万个，这就是泄漏对象。

### 7.3 Group By 类 / 包

在 Histogram 中按类或包分组，快速定位是哪个模块的问题：

```
Package                              | Objects | Shallow Heap
--------------------------------------------------------------
com.example.service                   | 500,000 | 40 MB
  com.example.service.cache           | 450,000 | 36 MB  ← 问题在这个包
  com.example.service.order           | 30,000  | 3 MB
  com.example.service.user            | 20,000  | 1 MB
```

## 八、线上内存监控自动化

### 8.1 配置 OOM 自动 dump

```bash
# 启动参数
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/data/dumps/
-XX:+HeapDumpAfterFullGC          # Full GC 后也 dump（可选）
-XX:HeapDumpSegmentSize=100m      # 分段写入，避免写盘阻塞
```

### 8.2 告警规则

```yaml
# Prometheus + Grafana 告警规则
groups:
  - name: jvm
    rules:
      - alert: HeapUsageHigh
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        annotations:
          summary: "堆内存使用率超过 85%"

      - alert: FullGCCountHigh
        expr: increase(jvm_gc_full_count[1h]) > 5
        annotations:
          summary: "1 小时内 Full GC 超过 5 次"
```

### 8.3 自动触发 dump 脚本

```bash
#!/bin/bash
# 当堆内存使用率超过 80% 时自动 dump
PID=$(jps -l | grep 'my-app' | awk '{print $1}')
MAX_HEAP=$(jstat -gccapacity $PID | tail -1 | awk '{print $4}')
USED_HEAP=$(jstat -gccapacity $PID | tail -1 | awk '{print $3}')

RATIO=$((USED_HEAP * 100 / MAX_HEAP))
if [ $RATIO -gt 80 ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    jcmd $PID GC.heap_dump /data/dumps/heap_${TIMESTAMP}.hprof
    echo "Heap dump generated: heap_${TIMESTAMP}.hprof" | mail -s "OOM Alert" ops@company.com
fi
```

## 九、面试要点总结

### Q1：什么是内存泄漏？Java 中如何检测？

内存泄漏是指对象不再使用但无法被 GC 回收。检测方法：
1. 监控堆内存使用趋势——持续增长不回落说明有泄漏
2. 使用 `jmap -dump` 抓取 heap dump
3. 用 MAT 分析 Retained Heap 最大的对象
4. 查看引用链，定位到具体代码

### Q2：Shallow Heap 和 Retained Heap 的区别？

- Shallow Heap：对象自身占用的内存
- Retained Heap：对象被回收后能释放的总内存（包括其支配的所有对象）
- 排查泄漏时重点看 Retained Heap

### Q3：常见的 Java 内存泄漏场景有哪些？

1. 静态集合类只增不减
2. ThreadLocal 未调用 remove()
3. 监听器/回调未注销
4. 非静态内部类持有外部类引用
5. 数据库连接/IO 流未关闭
6. 缓存无过期策略

### Q4：MAT 中如何找到内存泄漏的对象？

1. 查看 Leak Suspects 自动报告
2. 查看 Dominator Tree，找 Retained Heap 最大的对象
3. 右键 → Merge Shortest Paths to GC Roots → 找引用链
4. 对比多个 dump，找增长最快的对象

### Q5：如何预防内存泄漏？

1. 使用 Caffeine/Guava Cache 替代手动 Map 缓存
2. ThreadLocal 使用后必须 remove
3. 资源操作使用 try-with-resources
4. 内部类优先用 static
5. 配置 `-XX:+HeapDumpOnOutOfMemoryError`
6. 上线内存监控告警

## 十、总结

内存泄漏排查的核心流程：

```
发现（监控告警） → 抓取 heap dump → MAT 分析
→ Dominator Tree 找大对象 → 引用链定位代码 → 修复验证
```

MAT 是内存分析的瑞士军刀，掌握以下核心功能就够用：

- **Leak Suspects**：自动报告，快速定位
- **Dominator Tree**：找 Retained Heap 最大的对象
- **Path to GC Roots**：找到引用链
- **Histogram**：按类统计对象数量
- **Compare**：对比两个 dump，找增量

记住：**内存泄漏不是突然发生的，是日积月累的**。好的监控体系比好的排查工具更重要。
