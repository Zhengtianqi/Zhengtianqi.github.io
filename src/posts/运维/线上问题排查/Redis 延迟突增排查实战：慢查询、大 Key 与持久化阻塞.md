---
title: Redis 延迟突增排查实战：慢查询、大 Key 与持久化阻塞
tag: ["Redis", "延迟排查", "大Key", "持久化", "线上排障"]
category: 运维
date: 2026-07-03
---

# Redis 延迟突增排查实战：慢查询、大 Key 与持久化阻塞

> 下午 2 点，你收到告警：Redis 响应延迟 P99 从 2ms 飙升到 50ms。缓存层一旦变慢，后面是数据库被打穿、接口超时、雪崩效应。Redis 延迟问题比 CPU 飙升更棘手——因为 Redis 是单线程的，任何一个阻塞操作都会影响所有请求。本文将系统性地排查 Redis 延迟突增的所有可能原因。

## 一、Redis 延迟问题的特殊性

### 1.1 单线程模型回顾

Redis 的核心命令处理是单线程的（6.0 之后 IO 多线程，但命令执行仍然单线程）：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redis 单线程模型                              │
│                                                                 │
│  客户端 ──┐                                                     │
│  客户端 ──┼──▶ [IO 多线程读取] ──▶ [命令执行单线程] ──▶ [IO 多线程写回] ──▶ 客户端
│  客户端 ──┘                    (6.0+ IO多线程)     ↑            │
│                                                    │            │
│                                              所有命令串行执行     │
│                                              一个慢命令阻塞所有   │
└─────────────────────────────────────────────────────────────────┘
```

**关键推论**：
- 一个 `KEYS *` 命令可以让整个 Redis 卡顿数秒
- 一个 `DEL` 大 Key 可能耗时 100ms+，期间所有其他请求被阻塞
- fork 子进程做 BGSAVE 时如果内存大，fork 本身就会阻塞主线程

### 1.2 延迟原因分类

```
┌──────────────────────────────────────────────────────────────────┐
│              Redis 延迟突增原因分类                               │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  慢命令        │  持久化阻塞   │  内存问题      │  网络因素       │
├───────────────┼───────────────┼───────────────┼─────────────────┤
│ KEYS *       │ fork 阻塞     │ 大 Key 操作   │ 网络抖动         │
│ SMEMBERS     │ AOF fsync    │ 内存碎片       │ TCP backlog 满   │
│ FLUSHALL     │ AOF rewrite  │ 内存淘汰风暴   │ 客户端连接数过多  │
│ 大 Key 操作   │ RDB save     │               │                 │
│ 复杂 Lua 脚本 │              │               │                 │
└───────────────┴───────────────┴───────────────┴─────────────────┘
```

## 二、排查工具链

### 2.1 基础诊断三件套

```bash
# 工具 1：redis-cli --latency — 测量基础延迟
redis-cli -h 10.0.1.20 -p 6379 --latency
# 输出：min: 0, max: 15, avg: 0.45 (5071 samples)
# 如果 avg > 1ms 或 max > 50ms，说明确实有延迟问题

# 工具 2：redis-cli --intrinsic-latency — 测量系统固有延迟
redis-cli --intrinsic-latency 10
# 跑 10 秒，测量操作系统本身的延迟基线
# 输出：Max latency so far: 1 microseconds.
#       Max latency so far: 3 microseconds.
#       ...
#       654321 total runs (avg latency: 0.45 us / 85.12 ms total run)
# 如果固有延迟 > 100us，说明系统有问题（虚拟化、CPU 绑定等）

# 工具 3：redis-cli --bigkeys — 扫描大 Key
redis-cli -h 10.0.1.20 -p 6379 --bigkeys
# 采样扫描所有 Key，输出各类型最大的 Key
```

### 2.2 SLOWLOG 分析

```bash
# 查看 Redis 慢查询日志
redis-cli -h 10.0.1.20 -p 6379 SLOWLOG GET 20

# 输出示例：
# 1) 1) (integer) 14            ← 日志 ID
#    2) (integer) 1625300400     ← 时间戳
#    3) (integer) 52345          ← 执行耗时（微秒），52.3ms
#    4) 1) "KEYS"
#       2) "session:*"           ← 具体命令
#    5) "127.0.0.1:56789"        ← 客户端
#    6) ""                       ← 客户端名称
#
# 2) 1) (integer) 13
#    2) (integer) 1625300395
#    3) (integer) 128000         ← 128ms
#    4) 1) "DEL"
#       2) "user:big:list"       ← 删除大 Key
#    5) "10.0.1.30:45678"
#    6) ""

# 查看慢查询配置
redis-cli CONFIG GET slowlog-log-slower-than
# 默认 10000 微秒 = 10ms

# 调整慢查询阈值（建议 1ms）
redis-cli CONFIG SET slowlog-log-slower-than 1000

# 查看慢查询最大条数
redis-cli CONFIG GET slowlog-max-len
# 默认 128，建议调大
redis-cli CONFIG SET slowlog-max-len 1024
```

### 2.3 INFO 命令全览

```bash
# 获取 Redis 全面信息
redis-cli INFO

# 重点关注以下指标：
# Server
# redis_version:7.0.12
# os:Linux 5.15.0-76-generic
# process_id:1234

# Clients
# connected_clients:512         ← 当前连接数
# blocked_clients:5             ← 阻塞的客户端数（BLPOP 等）
# tracking_clients:0

# Memory
# used_memory:2.5GB             ← 已用内存
# used_memory_rss:3.2GB         ← OS 分配的内存
# mem_fragmentation_ratio:1.28  ← 内存碎片率，>1.5 说明碎片严重
# maxmemory:4GB
# maxmemory_policy:allkeys-lru

# Persistence
# rdb_bgsave_in_progress:0      ← 是否正在 BGSAVE
# rdb_last_save_time:1625300400
# aof_enabled:1
# aof_rewrite_in_progress:0     ← 是否正在 AOF 重写
# aof_last_rewrite_time_sec:5   ← 上次 AOF 重写耗时

# Stats
# total_connections_received:15234
# instantaneous_ops_per_sec:8500 ← 当前 QPS
# latest_fork_usec:23000        ← 上次 fork 耗时（微秒），23ms
# expired_keys:12345
# evicted_keys:678              ← 被淘汰的 Key 数

# Replication (如果是从节点)
# role:slave
# master_link_status:up
# master_last_io_seconds_ago:0  ← 最后与 master 交互时间
# slave_repl_offset:1234567890
```

### 2.4 延迟监控（LATENCY）

```bash
# Redis 4.0+ 内置延迟监控
# 开启延迟监控
redis-cli CONFIG SET latency-monitor-threshold 100  # 阈值 100ms

# 查看延迟事件
redis-cli LATENCY HISTORY event-loop
# 1) 1) (integer) 1625300400    ← 时间戳
#    2) (integer) 150            ← 延迟（毫秒）
#    3) (integer) 1625300400     ← 上一次发生时间
#    4) (integer) 180            ← 上一次延迟

# 查看所有延迟事件
redis-cli LATENCY TREE

# 延迟事件类型：
# event-loop      — 事件循环延迟
# fork            — fork 系统调用延迟
# rdb-unlink-...  — RDB 文件 unlink 延迟
# aof-write       — AOF 写入延迟
# aof-fsync-always — AOF fsync 延迟
# expire-cycle    — 过期 Key 清理延迟
```

## 三、场景一：大 Key 问题

### 3.1 发现大 Key

```bash
# 方法 1：redis-cli --bigkeys（粗略扫描）
redis-cli --bigkeys

# 输出示例：
# -------- sample 1 --------
# 
# Biggest string found so far '"...long value..."' at 'user:profile:10086' with 524288 bytes
# Biggest list  found so far 'task:queue:pending' with 234567 items
# Biggest hash  found so far 'order:detail:99999' with 156 fields
# Biggist set   found so far 'tag:users:hot' with 89012 members
# Biggist zset  found so far 'leaderboard:daily' with 45000 members
# 
# -------- stats -------
# 
# Total samples length (bytes) 9999
# 
# Biggiest   string: 'user:profile:10086' (524288 bytes)
# Biggiest     list: 'task:queue:pending' (234567 items)
# Biggiest     hash: 'order:detail:99999' (156 fields)
# ...
```

```bash
# 方法 2：使用 MEMORY USAGE 命令（精确）
redis-cli MEMORY USAGE user:profile:10086
# 返回该 Key 占用的总内存（字节）

# 批量扫描大 Key（更精确）
redis-cli --scan --pattern '*' | while read key; do
    size=$(redis-cli MEMORY USAGE "$key" 2>/dev/null)
    if [ "$size" -gt 102400 ] 2>/dev/null; then  # > 100KB
        echo "$key: $size bytes"
    fi
done | sort -t: -k2 -rn | head -20

# 方法 3：使用 scan + debug object（不推荐 KEYS，会阻塞）
redis-cli SCAN 0 COUNT 1000 | tail -n +2 | while read key; do
    type=$(redis-cli TYPE "$key")
    case $type in
        list) size=$(redis-cli LLEN "$key") ;;
        hash) size=$(redis-cli HLEN "$key") ;;
        set)  size=$(redis-cli SCARD "$key") ;;
        zset) size=$(redis-cli ZCARD "$key") ;;
        string) size=$(redis-cli STRLEN "$key") ;;
        *) size=0 ;;
    esac
    echo "$type $size $key"
done | sort -k2 -rn | head -20
```

### 3.2 大 Key 的影响

```
┌──────────────────────────────────────────────────────────────────┐
│                     大 Key 的危害                                │
│                                                                  │
│  1. 单次操作耗时：                                               │
│     - DEL 10万元素的 list → 释放内存耗时 50-200ms               │
│     - HGETALL 1万元素的 hash → 网络传输 20-100ms                │
│     - SMEMBERS 5万元素的 set → 阻塞主线程 100ms+               │
│                                                                  │
│  2. 网络带宽：                                                   │
│     - 1MB 的 value 一次返回 → 占满网卡 10ms                     │
│     - 大量客户端同时拉取 → 网络拥塞                              │
│                                                                  │
│  3. 内存不均：                                                   │
│     - Cluster 模式下单个 slot 内存不均 → 集群倾斜               │
│                                                                  │
│  4. 淘汰风暴：                                                   │
│     - 一个大 Key 被淘汰 → 一次释放大量内存 → 引发抖动            │
│                                                                  │
│  5. 过期阻塞：                                                   │
│     - 大 Key 设了过期 → 过期时主动清理阻塞主线程                 │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 大 Key 处理方案

```bash
# 危险操作：直接 DEL 大 Key
redis-cli DEL task:queue:pending  # 234567 元素 → 阻塞 200ms！

# 方案 1：UNLINK（Redis 4.0+，异步删除）
redis-cli UNLINK task:queue:pending
# 主线程只做标记，实际释放由后台线程执行

# 方案 2：分批删除（适合旧版本）
# List 分批删除
redis-cli LRANGE task:queue:pending 0 99  # 先看前 100 个
while [ $(redis-cli LLEN task:queue:pending) -gt 0 ]; do
    redis-cli LTRIM task:queue:pending 100 -1  # 每次删前 100 个
    sleep 0.01  # 控制节奏
done
redis-cli DEL task:queue:pending  # 最后删空 key

# Hash 分批删除
while [ $(redis-cli HLEN order:detail:99999) -gt 100 ]; do
    # 获取前 100 个 field
    fields=$(redis-cli HSCAN order:detail:99999 0 COUNT 100 | tail -n +2 | head -100 | tr '\n' ' ')
    redis-cli HDEL order:detail:99999 $fields
    sleep 0.01
done
redis-cli DEL order:detail:99999

# Set 分批删除
while [ $(redis-cli SCARD tag:users:hot) -gt 100 ]; do
    members=$(redis-cli SSCAN tag:users:hot 0 COUNT 100 | tail -n +2 | head -100 | tr '\n' ' ')
    redis-cli SREM tag:users:hot $members
    sleep 0.01
done
redis-cli DEL tag:users:hot

# 方案 3：配置惰性删除（全局）
# redis.conf
# lazyfree-lazy-eviction yes      # 淘汰时异步删除
# lazyfree-lazy-expire yes        # 过期时异步删除
# lazyfree-lazy-server-del yes    # 服务端 DEL 异步
# lazyfree-lazy-user-del yes      # 用户 DEL 异步（4.0+）
# lazyfree-lazy-user-flush yes    # FLUSHALL/FLUSHDB 异步（6.0+）
```

### 3.4 预防大 Key 的最佳实践

```java
// Java 层面的预防
public class RedisGuard {
    // 设置 Value 大小上限
    private static final int MAX_VALUE_SIZE = 10 * 1024;  // 10KB
    // 设置集合元素数量上限
    private static final int MAX_COLLECTION_SIZE = 10000;
    
    private final Jedis jedis;
    
    public String set(String key, String value) {
        if (value.length() > MAX_VALUE_SIZE) {
            throw new IllegalArgumentException(
                "Value too large: " + value.length() + " > " + MAX_VALUE_SIZE);
        }
        return jedis.set(key, value);
    }
    
    public long hset(String key, String field, String value) {
        // 检查 hash 大小
        long currentSize = jedis.hlen(key);
        if (currentSize >= MAX_COLLECTION_SIZE) {
            log.warn("Hash {} size {} exceeds limit, consider splitting", key, currentSize);
            // 触发告警
            alertService.send("REDIS_BIG_KEY", 
                String.format("Hash %s size=%d", key, currentSize));
        }
        return jedis.hset(key, field, value);
    }
    
    public List<String> lrange(String key, long start, long stop) {
        long len = jedis.llen(key);
        if (len > MAX_COLLECTION_SIZE && stop - start > 100) {
            // 大列表的分页查询限制
            stop = start + 99;
            log.warn("List {} truncated, len={}, returning partial", key, len);
        }
        return jedis.lrange(key, start, stop);
    }
}
```

## 四、场景二：fork 阻塞

### 4.1 fork 阻塞的原理

```
┌──────────────────────────────────────────────────────────────────┐
│                   fork 阻塞原理                                  │
│                                                                  │
│  BGSAVE / BGREWRITEAOF 触发时：                                  │
│                                                                  │
│  主线程 ──▶ fork() ──┬──▶ 主线程继续处理命令                     │
│                      │                                           │
│                      └──▶ 子进程写 RDB/AOF                       │
│                                                                  │
│  fork() 本身是同步调用：                                         │
│  - 需要复制页表（每 4KB 内存一个页表项）                         │
│  - 10GB 内存 → 页表约 20MB → fork 耗时 50-200ms                │
│  - 30GB 内存 → fork 耗时 300-1000ms                             │
│                                                                  │
│  期间主线程完全阻塞！                                            │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 诊断 fork 阻塞

```bash
# 查看上次 fork 耗时
redis-cli INFO persistence | grep fork
# latest_fork_usec:23000  ← 23ms，如果 > 100ms 需要关注

# 查看 fork 频率
redis-cli INFO persistence | grep -E "rdb_last|aof_last"
# rdb_last_save_time:1625300400
# rdb_last_bgsave_status:ok
# aof_last_rewrite_time_sec:5  ← AOF 重写耗时 5 秒
# aof_last_bgrewrite_status:ok

# 查看是否正在进行 BGSAVE / AOF 重写
redis-cli INFO persistence | grep -E "in_progress"
# rdb_bgsave_in_progress:0
# aof_rewrite_in_progress:0
# 如果为 1，说明正在执行，可能是导致延迟的原因
```

### 4.3 fork 阻塞的优化

```bash
# 优化 1：调整 save 策略，减少 fork 频率
# redis.conf
save 900 1      # 900 秒内至少 1 个 key 变化才触发 RDB
save 300 10     # 300 秒内至少 10 个 key 变化
save 60 10000   # 60 秒内至少 10000 个 key 变化
# 如果内存大，可以只保留一条或完全关闭 RDB
# save ""  # 完全关闭 RDB（仅在 AOF 开启时考虑）

# 优化 2：调整 AOF 重写策略
auto-aof-rewrite-percentage 100   # AOF 文件大小增长 100% 才重写
auto-aof-rewrite-min-size 64mb    # AOF 文件最小 64MB 才重写
# 调大这两个值，减少 AOF 重写频率

# 优化 3：使用 no-appendfsync-on-rewrite
# 在 AOF 重写期间不做 fsync，避免双重磁盘 IO
config set no-appendfsync-on-rewrite yes

# 优化 4：开启 transparent_hugepage 关闭
echo never > /sys/kernel/mm/transparent_hugepage/enabled
# THP 会导致 fork 更慢（页表项更大）

# 优化 5：降低内存使用（最根本的方案）
# 如果 Redis 内存 > 10GB 且 fork 耗时 > 100ms
# 考虑拆分成多个小 Redis 实例
```

## 五、场景三：AOF fsync 阻塞

### 5.1 AOF 三种策略对比

```
┌──────────────────────────────────────────────────────────────────┐
│                AOF fsync 策略对比                                │
├──────────────┬─────────────┬──────────────┬────────────────────┤
│   always     │  everysec   │  no          │                    │
├──────────────┼─────────────┼──────────────┼────────────────────┤
│ 每条命令都    │ 每秒一次     │ 由 OS 决定   │                    │
│ fsync        │ fsync       │ 何时刷盘     │                    │
├──────────────┼─────────────┼──────────────┼────────────────────┤
│ 最安全        │ 折中方案    │ 最快         │                    │
│ 性能最差      │ 最多丢 1 秒 │ 可能丢更多   │                    │
│ 阻塞主线程    │ 后台线程做  │ 不阻塞       │                    │
├──────────────┼─────────────┼──────────────┼────────────────────┤
│ ⚠️ 每次写入   │ ✓ 推荐      │ 不推荐       │                    │
│ 都阻塞！      │             │              │                    │
└──────────────┴─────────────┴──────────────┴────────────────────┘
```

### 5.2 诊断 AOF 阻塞

```bash
# 查看当前 AOF 策略
redis-cli CONFIG GET appendfsync
# appendfsync: everysec  ← 每秒一次

# 查看 AOF 相关状态
redis-cli INFO persistence | grep aof
# aof_enabled:1
# aof_rewrite_in_progress:0
# aof_rewrite_scheduled:0
# aof_last_rewrite_time_sec:5
# aof_current_size:234567890
# aof_base_size:200000000
# aof_pending_rewrite:0
# aof_buffer_length:0
# aof_rewrite_buffer_length:0
# aof_pending_bio_fsync:0    ← 等待 fsync 的数量
# aof_delayed_fsync:0        ← 延迟 fsync 的次数

# 如果 aof_delayed_fsync > 0，说明 fsync 跟不上写入速度
```

### 5.3 磁盘 IO 瓶颈导致 AOF 阻塞

```bash
# 检查磁盘 IO 性能
iostat -x 1 5

#  Device     r/s     w/s     rkB/s   wkB/s   avgrq-sz   avgqu-sz   await   %util
#  sda        50.0    200.0   400.0   3200.0  14.4       2.35       11.75   98.5
#                                                                      ↑      ↑
#                                                                  IO 等待  磁盘利用率
#  如果 await > 10ms 或 %util > 90%，说明磁盘 IO 瓶颈

# 测试磁盘写入速度
dd if=/dev/zero of=/tmp/disktest bs=1M count=1000 oflag=direct
# 1000+0 records in
# 1000+0 records out
# 1048576000 bytes (1.0 GB) copied, 5.23456 s, 200 MB/s
# 如果 < 50 MB/s，磁盘太慢

# 解决方案 1：换 SSD
# 解决方案 2：AOF 放到独立磁盘
# 解决方案 3：调整 AOF 策略为 no（不推荐，有数据丢失风险）
```

## 六、场景四：网络因素导致的延迟

### 6.1 区分网络问题 vs Redis 内部问题

```bash
# 步骤 1：在 Redis 服务器上本地测试
redis-cli -h 127.0.0.1 -p 6379 --latency
# 如果本地延迟正常（< 1ms），说明是网络问题

# 步骤 2：在应用服务器上远程测试
redis-cli -h 10.0.1.20 -p 6379 --latency
# 如果远程延迟高，确认是网络问题

# 步骤 3：ping 测试网络延迟
ping -c 10 10.0.1.20
# rtt min/avg/max/mdev = 0.123/0.234/0.456/0.078 ms
# 如果 avg > 1ms 或 mdev > 0.5ms，网络抖动

# 步骤 4：mtr 查看网络路径
mtr -n -c 100 10.0.1.20
# 查看每一跳的延迟和丢包率
```

### 6.2 TCP backlog 满

```bash
# 查看 TCP 连接队列
ss -lnt | grep 6379
# State   Recv-Q   Send-Q   Local Address:Port   Peer Address:Port
# LISTEN  0        511            *:6379              *:*
#         ↑        ↑
#    当前队列    最大队列
# 如果 Recv-Q 持续 > 0，说明 accept 速度跟不上

# 查看 Redis 配置的 TCP backlog
redis-cli CONFIG GET tcp-backlog
# tcp-backlog:511

# 如果连接数多，可以调大
redis-cli CONFIG SET tcp-backlog 1024

# 同时调整系统参数
sysctl -w net.core.somaxconn=1024
sysctl -w net.ipv4.tcp_max_syn_backlog=1024
```

### 6.3 客户端连接数过多

```bash
# 查看当前连接数
redis-cli INFO clients
# connected_clients:512
# blocked_clients:5
# tracking_clients:0
# clients_in_timeout_table:0

# 如果 connected_clients > 10000，需要排查连接泄漏

# 查看客户端列表
redis-cli CLIENT LIST | head -20
# id=1234 addr=10.0.1.30:45678 laddr=10.0.1.20:6379 fd=12 name= age=3600 idle=0 flags=N
# id=1235 addr=10.0.1.31:45679 laddr=10.0.1.20:6379 fd=13 name= age=3600 idle=300 flags=N
#                                                                        ↑
#                                                                   空闲 300 秒，可能泄漏

# 找出空闲时间最长的连接
redis-cli CLIENT LIST | sort -t= -k7 -rn | head -10

# 设置超时时间（秒），自动断开空闲连接
redis-cli CONFIG SET timeout 300  # 5 分钟无操作断开
```

## 七、综合排查流程

### 7.1 排查决策树

```
                    Redis 延迟突增
                         │
                         ▼
              本地 --latency 测试
                   /         \
              正常            异常
              /                \
     网络问题            Redis 内部问题
         │                    │
    ┌────┼────┐         ┌─────┼─────┐
    ▼    ▼    ▼         ▼     ▼     ▼
  ping  mtr  ss     SLOWLOG  INFO  --bigkeys
  测试  路径 backlog  慢命令  状态  大Key
    │    │    │         │     │     │
    └────┴────┘         └─────┴─────┘
         │                    │
    网络层修复           ┌────┼────┐
                        ▼    ▼    ▼
                     fork  AOF  大Key
                     阻塞  fsync 操作
                        │    │    │
                        ▼    ▼    ▼
                     调整  换SSD  UNLINK
                     save  或调
                     策略  策略
```

### 7.2 一键诊断脚本

```bash
#!/bin/bash
# redis-diag.sh — Redis 延迟一键诊断

REDIS_HOST=${1:-127.0.0.1}
REDIS_PORT=${2:-6379}
CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT"

echo "========== Redis 延迟诊断报告 =========="
echo "时间: $(date)"
echo ""

echo ">>> 1. 基础延迟测试"
$CLI --latency -n 100 2>/dev/null || echo "无法连接"

echo ""
echo ">>> 2. 慢查询 TOP 10"
$CLI SLOWLOG GET 10 2>/dev/null

echo ""
echo ">>> 3. 内存状态"
$CLI INFO memory 2>/dev/null | grep -E "used_memory:|used_memory_rss:|mem_fragmentation_ratio:|maxmemory:|maxmemory_policy:"

echo ""
echo ">>> 4. 持久化状态"
$CLI INFO persistence 2>/dev/null | grep -E "rdb_bgsave|aof_rewrite|latest_fork|aof_delayed"

echo ""
echo ">>> 5. 客户端状态"
$CLI INFO clients 2>/dev/null

echo ""
echo ">>> 6. 连接数 TOP 10 空闲最久"
$CLI CLIENT LIST 2>/dev/null | tr ' ' '\n' | grep idle= | sort -t= -k2 -rn | head -10

echo ""
echo ">>> 7. OPS 统计"
$CLI INFO stats 2>/dev/null | grep -E "instantaneous_ops_per_sec|expired_keys|evicted_keys|rejected_connections"

echo ""
echo ">>> 8. 大 Key 扫描（采样）"
$CLI --bigkeys -i 2>/dev/null | grep -E "Biggest|sample"

echo ""
echo ">>> 9. 延迟事件"
$CLI LATENCY TREE 2>/dev/null

echo ""
echo ">>> 10. 系统固有延迟"
$CLI --intrinsic-latency 5 2>/dev/null | tail -3

echo ""
echo "========== 诊断结束 =========="
```

## 八、Redis Cluster 延迟排查的特殊问题

### 8.1 跨 slot 问题

```bash
# Cluster 模式下，跨 slot 的 MGET/MSET 会报错
redis-cli -c MGET key1 key2 key3
# (error) CROSSSLOT Keys in request don't hash to the same slot

# 应用层如果用了 multi-key 操作，需要确保 hash tag
SET {user:10086}:profile "data"
SET {user:10086}:settings "data"
# 这两个 key 在同一个 slot

# 检查 key 所在的 slot
redis-cli CLUSTER KEYSLOT user:10086
# (integer) 12345
```

### 8.2 集群倾斜

```bash
# 查看各节点内存分布
for port in 7000 7001 7002 7003 7004 7005; do
    mem=$(redis-cli -h 127.0.0.1 -p $port INFO memory 2>/dev/null | grep used_memory: | awk -F: '{print $2}')
    keys=$(redis-cli -h 127.0.0.1 -p $port DBSIZE 2>/dev/null | grep -o '[0-9]*')
    echo "Port $port: memory=$mem keys=$keys"
done

# 如果某节点内存是其他节点的 3 倍，说明有倾斜
# 常见原因：大 Key 集中在某个 slot
```

## 九、面试要点

### Q1: Redis 延迟突然变高，排查步骤是什么？

**参考回答**：

> 1. 用 `redis-cli --latency` 在本地和远程分别测试，区分网络问题还是 Redis 问题
> 2. 查 `SLOWLOG GET` 看是否有慢命令（如 KEYS、大 Key 操作）
> 3. 查 `INFO persistence` 看 `latest_fork_usec` 是否过高，判断 fork 阻塞
> 4. 查 `aof_delayed_fsync` 判断 AOF fsync 是否跟不上
> 5. 用 `--bigkeys` 扫描是否有大 Key
> 6. 查 `mem_fragmentation_ratio` 判断内存碎片
> 7. 查 `INFO clients` 判断连接数是否异常

### Q2: Redis 的大 Key 怎么处理？能否直接 DEL？

**参考回答**：

> 不能直接 DEL。DEL 大 Key 是同步操作，会阻塞主线程。对于 10 万元素的 list，DEL 可能阻塞 200ms。
> 
> 处理方法：
> 1. 使用 `UNLINK`（Redis 4.0+），异步删除
> 2. 分批删除：List 用 `LTRIM`，Hash 用 `HSCAN + HDEL`，Set 用 `SSCAN + SREM`
> 3. 开启 `lazyfree` 系列配置
> 4. 预防：在写入时做大小限制，超过阈值告警

### Q3: Redis fork 为什么会导致延迟？如何优化？

**参考回答**：

> fork() 系统调用需要复制父进程的页表。Redis 内存越大，页表越大，fork 耗时越长。10GB 内存 fork 约需 50-200ms，30GB 约 300-1000ms。期间主线程完全阻塞。
> 
> 优化方案：
> 1. 减少 BGSAVE 频率：调整 save 策略
> 2. 减少 AOF 重写频率：调大 auto-aof-rewrite-percentage
> 3. 关闭 THP（Transparent Huge Pages）
> 4. 控制单实例内存（建议 < 10GB），大内存用 Cluster 拆分
> 5. 使用 `activedefrag` 减少内存碎片

### Q4: Redis 6.0 多线程 IO 是不是解决了单线程阻塞问题？

**参考回答**：

> 没有。6.0 的多线程只是 IO 多线程（读取和写回），命令执行仍然是单线程。一个 KEYS * 仍然会阻塞所有请求。多线程 IO 主要解决的是网络 IO 瓶颈，在 QPS 很高时（>10万）有意义，但对于慢命令导致的阻塞没有帮助。

## 十、避坑指南

### 坑 1：SLOWLOG 被覆盖

SLOWLOG 默认只保留 128 条，高并发场景几分钟就会被覆盖。排查时第一时间执行 `SLOWLOG GET 50`，而不是 `SLOWLOG GET`。

```bash
# 调大 SLOWLOG
redis-cli CONFIG SET slowlog-max-len 1024
redis-cli CONFIG SET slowlog-log-slower-than 1000  # 1ms
```

### 坑 2：MONITOR 命令本身就是性能杀手

```bash
# MONITOR 会实时输出所有命令，但会严重降低 Redis 性能
redis-cli MONITOR  # 调试可以用，生产严禁！

# MONITOR 会让 Redis 性能下降 50%+
# 因为每条命令都要额外发送给 MONITOR 客户端
```

### 坑 3：过期 Key 的主动清理阻塞

```bash
# Redis 默认每 100ms 抽样检查过期 Key
# 如果一次清理太多，会阻塞主线程

# 配置：
redis-cli CONFIG GET hz
# hz:10  ← 每秒 10 次（每 100ms 一次）

redis-cli CONFIG GET maxmemory-policy
# maxmemory-policy:allkeys-lru

# 如果有大量同时过期的 Key（如批量设置的 24 小时过期），
# 在过期时刻会出现清理风暴
# 解决：过期时间加随机偏移
```

```java
// Java 层面：过期时间加随机偏移
public void setWithJitter(String key, String value, int baseTtlSeconds) {
    int jitter = ThreadLocalRandom.current().nextInt(0, 300); // 0-300 秒随机
    jedis.setex(key, baseTtlSeconds + jitter, value);
}
```

### 坑 4：Pipeline 中混入慢命令

```java
// 问题：Pipeline 中混入了 EXISTS 等命令，虽然单条快，但 Pipeline 中可能有上百条
Pipeline pipe = jedis.pipelined();
for (String key : hugeKeyList) {
    pipe.exists(key);  // 如果 key 数量 > 10000，即使每条 0.1ms，累计 1 秒
}
pipe.sync();  // 阻塞等待所有结果

// 优化：分批 Pipeline
int batchSize = 100;
for (int i = 0; i < hugeKeyList.size(); i += batchSize) {
    Pipeline pipe = jedis.pipelined();
    for (int j = i; j < Math.min(i + batchSize, hugeKeyList.size()); j++) {
        pipe.exists(hugeKeyList.get(j));
    }
    pipe.sync();
}
```

### 坑 5：info 命令本身很慢

```bash
# 在 Redis 内存很大时，INFO 命令也可能耗时
redis-cli INFO  # 大量统计信息计算

# 优化：只查需要的 section
redis-cli INFO memory     # 只查内存
redis-cli INFO clients    # 只查客户端
redis-cli INFO stats      # 只查统计
```

## 十一、预防体系建设

### 11.1 Redis 监控告警配置

```yaml
# Prometheus alert rules for Redis
groups:
  - name: redis-latency
    rules:
      - alert: RedisHighLatency
        expr: redis_latency_seconds_percentile{quantile="0.99"} > 0.05
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis P99 latency > 50ms"
      
      - alert: RedisSlowCommand
        expr: rate(redis_slowlog_length[5m]) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Redis slow commands detected"
      
      - alert: RedisForkSlow
        expr: redis_latest_fork_seconds > 0.1
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis fork took > 100ms"
      
      - alert: RedisBigKeyDetected
        expr: redis_bigkey_count > 0
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "Redis big keys detected"
      
      - alert: RedisMemoryFragmentation
        expr: redis_memory_fragmentation_ratio > 1.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory fragmentation ratio > 1.5"
```

### 11.2 定期巡检脚本

```bash
#!/bin/bash
# redis-inspection.sh — 每日 Redis 巡检

REDIS_INSTANCES=(
    "127.0.0.1:6379"
    "127.0.0.1:6380"
    "127.0.0.1:6381"
)

for instance in "${REDIS_INSTANCES[@]}"; do
    HOST=$(echo $instance | cut -d: -f1)
    PORT=$(echo $instance | cut -d: -f2)
    CLI="redis-cli -h $HOST -p $PORT"
    
    echo "===== $instance ====="
    
    # 1. 检查大 Key
    $CLI --bigkeys -i 2>/dev/null | grep -E "Biggest" | while read line; do
        echo "[BIGKEY] $line"
    done
    
    # 2. 检查 fork 耗时
    FORK_USEC=$($CLI INFO persistence 2>/dev/null | grep latest_fork_usec | awk -F: '{gsub(/\r/,""); print $2}')
    if [ "$FORK_USEC" -gt 100000 ] 2>/dev/null; then
        echo "[WARN] Fork latency: ${FORK_USEC}us (>100ms)"
    fi
    
    # 3. 检查内存碎片
    FRAG=$($CLI INFO memory 2>/dev/null | grep mem_fragmentation_ratio | awk -F: '{gsub(/\r/,""); print $2}')
    if (( $(echo "$FRAG > 1.5" | bc -l) )); then
        echo "[WARN] Memory fragmentation ratio: $FRAG (>1.5)"
    fi
    
    # 4. 检查 AOF 延迟
    AOF_DELAY=$($CLI INFO persistence 2>/dev/null | grep aof_delayed_fsync | awk -F: '{gsub(/\r/,""); print $2}')
    if [ "$AOF_DELAY" -gt 0 ] 2>/dev/null; then
        echo "[WARN] AOF delayed fsync count: $AOF_DELAY"
    fi
    
    # 5. 检查慢查询
    SLOW_COUNT=$($CLI SLOWLOG LEN 2>/dev/null)
    if [ "$SLOW_COUNT" -gt 10 ] 2>/dev/null; then
        echo "[INFO] Slowlog entries: $SLOW_COUNT"
        $CLI SLOWLOG GET 5 2>/dev/null
    fi
done
```

## 总结

Redis 延迟排查的核心流程：**--latency 测试 → SLOWLOG → INFO persistence → --bigkeys → 针对性修复**。

三个核心经验：
1. **Redis 是单线程的，一个慢命令影响所有请求**——禁用 KEYS、SCAN 替代 SMEMBERS、UNLINK 替代 DEL
2. **fork 阻塞与内存大小成正比**——单实例内存控制在 10GB 以内，关闭 THP
3. **大 Key 是万恶之源**——在写入时就限制大小，定期巡检，发现后用 UNLINK 或分批删除
