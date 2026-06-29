---
title: 网络超时排查实战：从 TCP 到应用层的分层定位
tag: ["网络超时", "TCP", "排查", "网络诊断", "线上问题排查"]
category: 线上问题排查
date: 2026-06-27
---

# 网络超时排查实战：从 TCP 到应用层的分层定位

> 网络超时排查实战：从 TCP 到应用层的分层定位是计算机网络的核心概念，它涉及数据传输、协议规范和网络安全等关键领域。
> 本文系统介绍了网络超时排查实战：从 TCP 到应用层的分层定位的原理和应用，帮助你理解网络通信机制。

网络超时可能发生在任何一层，我们需要逐层排查：

```
┌────────────────────────────────────────┐
│  应用层 (HTTP/RPC/gRPC)                │  ← 代码逻辑超时配置不当
├────────────────────────────────────────┤
│  中间件层 (Redis/MQ/DB 连接)            │  ← 连接池、心跳配置问题
├────────────────────────────────────────┤
│  传输层 (TCP)                           │  ← 连接建立、保活、重传问题
├────────────────────────────────────────┤
│  网络层 (IP 路由)                       │  ← 路由、MTU、丢包
├────────────────────────────────────────┤
│  链路层 (物理网络)                      │  ← 网卡、交换机、网线
└────────────────────────────────────────┘
```

每一层的排查工具和方法不同，下面逐层分析。

## 二、应用层超时排查

### 2.1 常见超时配置

Java 后端应用中，几乎每个网络调用都有超时配置：

```java
// HTTP 客户端超时
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))    // 连接超时
    .build();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/data"))
    .timeout(Duration.ofSeconds(10))          // 读取超时
    .build();

// OkHttp 超时
OkHttpClient okHttpClient = new OkHttpClient.Builder()
    .connectTimeout(5, TimeUnit.SECONDS)      // 连接超时
    .readTimeout(10, TimeUnit.SECONDS)        // 读取超时
    .writeTimeout(10, TimeUnit.SECONDS)       // 写入超时
    .build();

// RestTemplate 超时
SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
factory.setConnectTimeout(5000);   // 5 秒
factory.setReadTimeout(10000);     // 10 秒
RestTemplate restTemplate = new RestTemplate(factory);

// Feign 超时
feign:
  client:
    config:
      default:
        connect-timeout: 5000   # 5 秒
        read-timeout: 10000     # 10 秒

// 数据库超时（HikariCP）
spring:
  datasource:
    hikari:
      connection-timeout: 5000  # 获取连接超时

// MyBatis 超时
mybatis:
  configuration:
    default-statement-timeout: 10  # SQL 执行超时 10 秒

// Redis 超时
spring:
  redis:
    timeout: 3000  # 3 秒
    lettuce:
      pool:
        max-wait: 2000  # 获取连接超时 2 秒
```

### 2.2 超时配置的三大原则

**原则一：必须设置超时，不能无限等待**

```java
// 危险：没有超时配置
URL url = new URL("https://api.example.com/data");
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
// 默认可能无限等待 → 线程被永久阻塞

// 正确：每个调用都有超时
conn.setConnectTimeout(5000);
conn.setReadTimeout(10000);
```

**原则二：超时时间要有层次**

```
Tomcat 线程超时 (30s)
  └── Feign 调用超时 (10s) ← 必须小于上层
        └── 目标接口超时 (5s) ← 必须小于上层
              └── 数据库超时 (3s) ← 最底层
```

如果底层超时大于上层，上层会先超时，但底层仍在执行，造成资源浪费。

**原则三：超时要可配置、可动态调整**

```java
@Configuration
@ConfigurationProperties(prefix = "app.timeout")
@Data
public class TimeoutConfig {
    private int apiConnect = 5;
    private int apiRead = 10;
    private int dbConnection = 5;
    private int dbQuery = 10;
    private int redis = 3;
}

// 配合 Nacos 动态刷新
@RefreshScope
@RestController
public class ApiController {
    @Autowired
    private TimeoutConfig timeoutConfig;

    @GetMapping("/api/call")
    public String callExternal() {
        OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(timeoutConfig.getApiConnect(), TimeUnit.SECONDS)
            .readTimeout(timeoutConfig.getApiRead(), TimeUnit.SECONDS)
            .build();
        // ...
    }
}
```

### 2.3 应用层排查：看日志

```java
// 记录超时日志，包含关键信息
try {
    String result = externalApi.call(request);
} catch (SocketTimeoutException e) {
    log.error("调用外部接口超时 | url={} | connectTimeout={}ms | readTimeout={}ms | " +
              "totalTime={}ms | thread={}",
              url, connectTimeout, readTimeout,
              System.currentTimeMillis() - startTime,
              Thread.currentThread().getName(), e);
    throw new ServiceException("外部服务调用超时", e);
}
```

日志中要包含：
- 请求 URL
- 超时配置值
- 实际耗时
- 线程名（用于关联 jstack）

## 三、传输层（TCP）排查

### 3.1 TCP 连接建立阶段：connect timeout

**问题现象：**

```
java.net.ConnectException: Connection refused (Connection refused)
# 或
java.net.SocketTimeoutException: connect timed out
```

**排查方法：**

```bash
# 1. telnet 测试端口连通性
telnet 192.168.1.100 3306

# 2. nc (netcat) 测试
nc -zv -w5 192.168.1.100 3306

# 3. curl 测试连接时间
curl -o /dev/null -s -w "time_connect: %{time_connect}\ntime_total: %{time_total}\n" \
     https://api.example.com

# 输出：
# time_connect: 0.002    ← 连接建立 2ms，正常
# time_total: 3.5        ← 总耗时 3.5 秒，读取慢
```

**常见原因：**

| 原因 | 表现 | 解决方案 |
|------|------|----------|
| 目标端口未监听 | Connection refused | 检查目标服务是否启动 |
| 防火墙拦截 | connect timed out | 检查安全组/防火墙规则 |
| 目标服务器负载高 | connect timed out | 检查目标 CPU/内存 |
| DNS 解析慢 | 连接慢 | 检查 DNS 配置 |

### 3.2 TCP 连接保持阶段：read timeout

**问题现象：** 连接建立成功，但数据传输超时：

```
java.net.SocketTimeoutException: Read timed out
```

**排查方法：tcpdump 抓包**

```bash
# 抓取指定端口的 TCP 包
tcpdump -i eth0 -nn -tttt port 3306 -w /tmp/db.pcap

# 分析 TCP 状态
tcpdump -r /tmp/db.pcap -nn | head -50

# 关键分析点：
# 1. 是否有 SYN 无 SYN-ACK → 目标不可达
# 2. 是否有大量重传 → 网络质量问题
# 3. 是否有 RST → 连接被重置
# 4. 是否有 FIN 后长时间无响应 → 连接挂起
```

**用 ss 查看 TCP 连接状态：**

```bash
# 查看所有 TCP 连接状态统计
ss -s

# 查看指定端口的连接详情
ss -tnp | grep 3306

# 输出示例：
# ESTAB  0  0  192.168.1.10:54321  192.168.1.100:3306
```

**TCP 状态分析：**

```bash
# 统计各状态连接数
ss -ant | awk '{print $1}' | sort | uniq -c | sort -rn

# 输出：
#    125 ESTAB        ← 正常连接
#     15 TIME-WAIT    ← 关闭中（正常）
#      8 CLOSE-WAIT   ← 对方关闭了，应用还没关闭（可能有泄漏！）
#      3 SYN-SENT     ← 正在连接（如果持续有，说明目标不可达）
```

### 3.3 TCP 保活（Keep-Alive）问题

**问题场景：** 应用和数据库之间有防火墙/LB，空闲连接被防火墙静默关闭，但应用不知道。

```
应用 → 防火墙 → 数据库

正常: 心跳保活
异常: 防火墙 5 分钟无流量 → 静默关闭连接
      应用不知道 → 下次使用报 "Connection reset"
```

**解决方案：**

```bash
# Linux TCP 层面开启 Keep-Alive
sysctl -w net.ipv4.tcp_keepalive_time=60    # 60 秒后开始探测
sysctl -w net.ipv4.tcp_keepalive_intvl=10   # 每 10 秒探测一次
sysctl -w net.ipv4.tcp_keepalive_probes=6   # 探测 6 次失败才断开

# 应用层面
# HikariCP
spring.datasource.hikari.keepalive-time=120000  # 2 分钟发心跳

# HTTP Client
# OkHttp
okHttpClient.connectionPool().evictAll();  # 定期清理空闲连接
```

### 3.4 TCP 重传问题

```bash
# 查看 TCP 重传统计
ss -ti

# 或查看 /proc/net/snmp
cat /proc/net/snmp | grep -A1 "Tcp:"
# Tcp: RtoAlgorithm RtoMin RtoMax MaxConn ActiveOpens PassiveOpens ...
# Tcp: 1 200 120000 -1 123456 789012 ...  RetransSegs=1234

# 查看 TCP 重传率
nstat -z | grep -i retrans
# TcpRetransSegs = 1234
```

如果重传率高（>1%），说明网络质量有问题，可能是：
- 网卡丢包
- 交换机问题
- MTU 不匹配
- 网络拥塞

## 四、网络层排查

### 4.1 ping 和 traceroute

```bash
# 基本连通性测试
ping -c 10 192.168.1.100

# 带时间戳的 ping（排查间歇性问题）
ping -i 1 -D 192.168.1.100 | while read line; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') $line"
done

# 路由追踪
traceroute 192.168.1.100
# 或
mtr 192.168.1.100  # 持续监控路由
```

### 4.2 mtr：持续路由监控

```bash
mtr -n --report --report-cycles=100 192.168.1.100
```

输出：

```
HOST                    Loss%   Snt    Last   Avg   Best  Wrst StDev
1. 192.168.1.1          0.0%   100    0.3    0.3    0.2   0.5   0.1
2. 10.0.0.1             0.0%   100    1.2    1.1    1.0   2.3   0.2
3. 172.16.0.1          15.0%   100   15.3   14.8   12.1  25.3   3.2  ← 丢包 15%！
4. 192.168.1.100        0.0%   100   16.1   15.9   14.5  20.1   1.1
```

第 3 跳丢包 15%——这就是网络超时的根因，中间路由节点有问题。

### 4.3 DNS 解析问题

**问题现象：** 偶发性连接慢，但 IP 直连正常。

```bash
# 测试 DNS 解析速度
time nslookup api.example.com

# 输出：
# real    0m2.345s  ← DNS 解析花了 2.3 秒！

# 使用 dig 测试
dig api.example.com

# 查看 DNS 配置
cat /etc/resolv.conf
```

**解决方案：**

```bash
# 1. 使用更快的 DNS
echo "nameserver 223.5.5.5" > /etc/resolv.conf  # 阿里 DNS
echo "nameserver 8.8.8.8" >> /etc/resolv.conf   # Google DNS

# 2. JVM 层面配置 DNS 缓存
# -Dnetworkaddress.cache.ttl=60  (缓存 60 秒)
# -Dsun.net.inetaddr.ttl=60

# 3. 应用层面使用本地 DNS 缓存
```

```java
// JVM 启动参数
java -Dnetworkaddress.cache.ttl=60 -Dsun.net.inetaddr.ttl=60 -jar app.jar
```

### 4.4 MTU 问题

**问题现象：** 小包能通，大包不通。

```bash
# 测试不同大小的包
ping -s 1472 -M do 192.168.1.100  # 1472 + 28(ICMP头) = 1500（标准 MTU）
# 如果这个不通，说明路径中有 MTU 瓶颈

# 查看网卡 MTU
ip link show eth0
# 如果 MTU=9000（Jumbo Frame），但中间路由不支持 → 大包被丢弃

# 临时修改 MTU
ip link set eth0 mtu 1500
```

## 五、中间件层超时排查

### 5.1 Redis 超时排查

```bash
# 1. redis-cli 测试延迟
redis-cli -h 192.168.1.100 -p 6379 --latency
# 输出: min: 0, max: 15, avg: 0.3 (2345 samples)  ← 正常

# 2. 慢查询日志
redis-cli SLOWLOG GET 10

# 3. 查看大 Key
redis-cli --bigkeys

# 4. 查看连接数
redis-cli INFO clients
# connected_clients:152
# blocked_clients:0

# 5. 查看 Redis 状态
redis-cli INFO stats | grep -E "rejected|timeout"
# rejected_connections:0
# latest_fork_usec:234  ← 如果很大，说明 RDB/AOF 持久化导致延迟
```

**常见 Redis 超时原因：**

| 原因 | 排查方法 | 解决方案 |
|------|----------|----------|
| 慢命令 | SLOWLOG GET | 避免 KEYS、FLUSHALL 等命令 |
| 大 Key | --bigkeys | 拆分大 Key |
| 持久化阻塞 | INFO stats | 调整 AOF 策略 |
| 网络 | --latency | 网络排查 |
| 连接池 | 应用日志 | 调大连接池 |

### 5.2 Kafka/MQ 超时排查

```bash
# Kafka 消费者延迟
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group my-group

# 输出：
# TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# orders  0          1000            50000           49000  ← 积压 49000！
```

如果消息积压严重，消费者处理不过来，也会表现为接口超时（等待消息处理）。

### 5.3 RPC 框架超时排查（以 Dubbo 为例）

```yaml
dubbo:
  consumer:
    timeout: 5000           # 全局超时 5 秒
    retries: 2              # 重试 2 次
  provider:
    threads: 200            # 服务线程池
    executes: 100           # 每个方法最大并发

# 问题：重试 × 超时 = 总超时时间过长
# 5 秒 × 3 次（1 次调用 + 2 次重试）= 15 秒
```

排查 Dubbo 超时：

```bash
# 查看 Telnet 状态
telnet 127.0.0.1 20880
> status -l
# 查看线程池状态、连接数等

# 查看消费者调用统计
> count com.example.OrderService.createOrder
```

## 六、实战案例：偶发性超时排查

### 6.1 案例背景

某电商系统调用支付接口，99% 的请求在 200ms 内完成，但有 1% 的请求超时（超过 5 秒）。每天发生约 500 次。

### 6.2 排查过程

**第一步：确认超时分布**

```java
// 在调用日志中记录耗时分布
long cost = System.currentTimeMillis() - startTime;
if (cost > 1000) {
    log.warn("支付接口调用慢 | cost={}ms | url={} | traceId={}", cost, url, traceId);
}
```

分析日志发现：超时请求集中在每小时的第 5-10 分钟。

**第二步：排除应用自身问题**

```bash
# 查看超时时 JVM 状态
jstat -gcutil <PID> 1000
# GC 正常，无长停顿
```

**第三步：TCP 层面排查**

```bash
# 在超时时间段抓包
tcpdump -i eth0 -nn -tttt port 443 and host api.payment.com -w /tmp/payment.pcap

# 分析抓包
tcpdump -r /tmp/payment.pcap -nn | awk '{print $1, $2, $3, $4, $5, $6}'
```

发现超时时 TCP 包有大量重传：

```
14:05:23 SYN → 发出 SYN
14:05:24 (重传) SYN → 1 秒后重传
14:05:26 (重传) SYN → 3 秒后又重传
14:05:31 SYN-ACK ← 8 秒后才收到响应
```

**第四步：DNS 排查**

```bash
# 持续 DNS 解析测试
while true; do
    echo "$(date) $(dig +time=2 +tries=1 api.payment.com | grep 'Query time')"
    sleep 5
done
```

发现在超时时段，DNS 解析时间飙升到 2-5 秒。

**第五步：根因确认**

DNS 服务器是公司内部自建的，每小时会做一次日志轮转，轮转期间 DNS 服务短暂不可用（5-10 秒），导致应用解析域名失败/超慢。

### 6.3 解决方案

```bash
# 1. JVM 层面增加 DNS 缓存
java -Dnetworkaddress.cache.ttl=300 -jar app.jar  # 缓存 5 分钟

# 2. 配置备用 DNS
echo "nameserver 223.5.5.5" >> /etc/resolv.conf

# 3. 应用层面使用本地 DNS 缓存（如 dnsmasq）
yum install dnsmasq
echo "cache-size=10000" >> /etc/dnsmasq.conf
```

## 七、网络超时排查工具箱

| 工具 | 层次 | 用途 |
|------|------|------|
| ping | 网络层 | 连通性测试 |
| traceroute / mtr | 网络层 | 路由追踪 |
| telnet / nc | 传输层 | 端口连通性 |
| ss / netstat | 传输层 | TCP 连接状态 |
| tcpdump | 传输层 | 抓包分析 |
| Wireshark | 传输层 | 图形化抓包分析 |
| dig / nslookup | 应用层 | DNS 解析 |
| curl -w | 应用层 | HTTP 各阶段耗时 |
| redis-cli --latency | 中间件 | Redis 延迟 |
| jstack | 应用 | 线程栈分析 |

### curl -w 详解

```bash
curl -o /dev/null -s -w "DNS: %{time_namelookup}s\n\
Connect: %{time_connect}s\n\
TLS: %{time_appconnect}s\n\
TTFB: %{time_starttransfer}s\n\
Total: %{time_total}s\n" \
https://api.example.com

# 输出：
# DNS: 0.023s      ← DNS 解析时间
# Connect: 0.045s  ← TCP 连接时间
# TLS: 0.120s      ← TLS 握手时间
# TTFB: 0.350s     ← 首字节时间
# Total: 0.500s    ← 总时间
```

哪个阶段慢一目了然：

```
DNS 慢 → 查 DNS
Connect 慢 → 查网络/防火墙
TLS 慢 → 查证书/加密配置
TTFB 慢 → 查服务端处理时间
```

## 八、面试要点总结

### Q1：网络超时怎么分层排查？

从上到下逐层排除：
1. 应用层：检查超时配置、日志
2. 中间件层：Redis/MQ/DB 连接和慢查询
3. 传输层：TCP 状态、抓包分析
4. 网络层：ping、traceroute、DNS
5. 链路层：网卡、物理网络

### Q2：TCP 的 CLOSE-WAIT 多是什么问题？

CLOSE-WAIT 多说明对方关闭了连接，但应用没有调用 close()。通常是连接泄漏，代码中获取连接后没有正确关闭。排查方法是 jstack 查看线程栈 + 代码审查。

### Q3：如何排查偶发性网络超时？

1. 持续监控：用 ping + 时间戳记录网络质量
2. 抓包分析：在超时时段 tcpdump 抓包
3. DNS 排查：dig 测试解析速度
4. 检查防火墙/LB 的空闲连接超时
5. 检查是否有网络限速/QoS

### Q4：HTTP 调用超时怎么配置？

必须设置三个超时：
- `connectTimeout`：TCP 连接建立超时（通常 3-5 秒）
- `readTimeout`：数据读取超时（根据业务，通常 5-10 秒）
- `writeTimeout`：数据写入超时（通常 5-10 秒）

不能用默认值（可能无限等待），也不能太大（导致线程被阻塞）。

### Q5：如何预防网络超时问题？

1. 所有网络调用必须设置超时
2. 超时要有层次（底层 < 上层）
3. 开启 TCP Keep-Alive
4. 配置合理的 DNS 缓存
5. 重试 + 熔断 + 降级
6. 监控网络延迟指标

## 九、总结

网络超时排查的核心原则：**分层定位、逐层排除**。

```
快速排查路径：
  curl -w  → 定位哪个阶段慢
  ping/mtr → 排除网络层问题
  ss/tcpdump → 排除 TCP 层问题
  应用日志 → 排除代码问题
  中间件监控 → 排除 Redis/DB 问题
```

记住：**偶发性问题最需要持续监控**。一次性命令看不到的问题，需要用脚本持续采集数据，等问题复现时分析。不要靠"试一试"的心态排查偶发问题，要靠数据。
