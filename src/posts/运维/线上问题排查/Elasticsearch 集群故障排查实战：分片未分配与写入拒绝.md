---
title: Elasticsearch 集群故障排查实战：分片未分配与写入拒绝
tag: ["Elasticsearch", "分片未分配", "写入拒绝", "circuit breaker", "排查"]
category: 运维
date: 2026-07-03
---

# Elasticsearch 集群故障排查实战：分片未分配与写入拒绝

> Elasticsearch 集群红色/黄色状态、分片未分配、写入被拒——这些是 ES 运维中最棘手的问题。本文从集群状态排查、分片诊断到写入拒绝与熔断器，完整还原一次 ES 集群故障的全链路排查过程。

## 一、问题背景

某日志平台凌晨告警：Elasticsearch 集群状态从 green 变为 red，大量写入请求返回 429 错误，业务日志查询超时。

```
[告警] ES 集群状态: RED (正常: GREEN)
[告警] 未分配分片数: 15
[告警] 写入拒绝: EsRejectedExecutionException (rejected: 1280/5000)
[告警] Heap 使用率: 92% (阈值: 85%)
[告警] 查询延迟: P99 = 12s (正常: 200ms)
```

## 二、集群状态排查

### 2.1 集群状态三层含义

```
┌──────────────────────────────────────────────────────────────────┐
│                   ES 集群状态三级告警                              │
├──────────┬───────────────────────────────────────────────────────┤
│  状态    │  含义                                                │
├──────────┼───────────────────────────────────────────────────────┤
│  GREEN   │  所有主分片和副本分片都已分配，集群健康               │
│          │  → 无需处理                                          │
├──────────┼───────────────────────────────────────────────────────┤
│  YELLOW  │  所有主分片已分配，但部分副本分片未分配               │
│          │  → 数据不丢失风险，需尽快修复                         │
│          │  → 常见于单节点集群或节点离线                         │
├──────────┼───────────────────────────────────────────────────────┤
│  RED     │  部分主分片未分配，数据不完整                        │
│          │  → 紧急！有数据丢失风险                              │
│          │  → 常见于节点宕机、磁盘满、分片损坏                   │
└──────────┴───────────────────────────────────────────────────────┘
```

### 2.2 第一步：查看集群健康状态

```bash
# 查看集群健康状态
curl -s "http://es-node:9200/_cluster/health?pretty"

{
  "cluster_name": "log-cluster",
  "status": "red",                    # 集群状态：红色！
  "timed_out": false,
  "number_of_nodes": 6,               # 节点数：6
  "number_of_data_nodes": 4,          # 数据节点：4
  "active_primary_shards": 240,       # 活跃主分片
  "active_shards": 465,               # 活跃总分片
  "relocating_shards": 0,             # 迁移中的分片
  "initializing_shards": 2,           # 初始化中的分片
  "unassigned_shards": 15,            # 未分配分片：15！
  "unassigned_primary_shards": 3,     # 未分配主分片：3！→ RED 根因
  "delayed_unassigned_shards": 0,
  "number_of_pending_tasks": 0,
  "active_shards_percent_as_number": 96.88
}

# 详细查看（包含索引级别）
curl -s "http://es-node:9200/_cluster/health?level=indices&pretty"

# 找到状态为 red 的索引
# "log-2026.07.03": {
#   "status": "red",
#   "number_of_shards": 10,
#   "number_of_unassigned_shards": 3
# }
```

### 2.3 第二步：查看节点状态

```bash
# 查看所有节点状态
curl -s "http://es-node:9200/_cat/nodes?v"

# 输出示例
ip        heap.percent ram.percent cpu load_1m load_5m node.role master name
10.0.1.1           92          78  85    4.5    3.2  dilm      *      node-1
10.0.1.2           88          72  76    3.8    2.9  dil       -      node-2
10.0.1.3           45          65  23    0.8    0.5  dil       -      node-3
10.0.1.4           0           0    0    0.0    0.0  dil       -      node-4  ← 异常！
10.0.1.5           56          60  18    0.5    0.3  -         -      node-5
10.0.1.6           52          58  15    0.4    0.2  -         -      node-6

# 发现问题：
# 1. node-1 heap.percent=92%，接近 OOM
# 2. node-4 所有指标为 0，可能已离线
```

### 2.4 第三步：查看磁盘使用率

```bash
# 查看磁盘使用率
curl -s "http://es-node:9200/_cat/allocation?v"

# 输出示例
shards disk.indices disk.used disk.avail disk.total disk.percent host      ip        node
   120      450.2gb   500.3gb    49.7gb     550gb           91 10.0.1.1 10.0.1.1 node-1 ← 磁盘 91%！
   115      380.5gb   420.1gb   129.9gb     550gb           76 10.0.1.2 10.0.1.2 node-2
   118      390.1gb   410.5gb   139.5gb     550gb           74 10.0.1.3 10.0.1.3 node-3
     0         0b        0b     550gb      550gb            0 10.0.1.4 10.0.1.4 node-4 ← 无数据！

# 发现：node-1 磁盘使用率 91%，超过 ES 的 cluster.routing.allocation.disk.watermark.high (默认 90%)
# ES 会停止往该节点分配分片
# node-4 没有任何分片，说明节点已离线
```

## 三、分片未分配诊断

### 3.1 使用 _cluster/allocation/explain API

```bash
# 这是最重要的诊断命令！
curl -s "http://es-node:9200/_cluster/allocation/explain?pretty" -d '
{
  "index": "log-2026.07.03",
  "shard": 0,
  "primary": true
}'

# 输出示例
{
  "decisions": [
    {
      "decider": "disk_threshold",          # 决策者：磁盘阈值
      "decision": "NO",
      "explanation": "the node is above the high watermark cluster setting"  # 超过高水位线
    },
    {
      "decider": "node_version",
      "decision": "NO",
      "explanation": "the node is too old to accept the shard"
    }
  ]
}

# 查看所有未分配分片的原因
curl -s "http://es-node:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason" | \
  grep UNASSIGNED

# 输出示例
# log-2026.07.03 0 p UNASSIGNED NODE_LEFT        ← 节点离开
# log-2026.07.03 1 p UNASSIGNED NODE_LEFT
# log-2026.07.03 2 p UNASSIGNED DISK_FULL        ← 磁盘满
# log-2026.07.03 3 r UNASSIGNED ALLOCATION_FAILED ← 分配失败
```

### 3.2 未分配原因分类

```
┌──────────────────────────────────────────────────────────────────┐
│               分片未分配原因及解决方案                              │
├───────────────────┬──────────────────────────────────────────────┤
│  原因              │  解决方案                                    │
├───────────────────┼──────────────────────────────────────────────┤
│ NODE_LEFT         │  节点离线 → 检查节点是否可以恢复              │
│ DISK_FULL         │  磁盘满 → 清理磁盘或增加节点                  │
│ ALLOCATION_FAILED │  分配失败 → 查看详细日志，可能分片损坏        │
│ CLUSTER_RECOVERED │  集群恢复中 → 等待恢复完成                   │
│ INDEX_CREATED     │  索引创建中 → 等待分配完成                   │
│ MANUAL            │  手动取消 → 手动重新分配                     │
│ REPLICA_ADDED     │  副本新增 → 正常，等待分配                   │
└───────────────────┴──────────────────────────────────────────────┘
```

### 3.3 常见场景处理

#### 场景一：节点离线导致分片未分配

```bash
# 1. 确认节点是否真的离线
curl -s "http://es-node:9200/_cat/nodes?v" | grep node-4
# 如果不在列表中，节点确实离线

# 2. 检查离线节点
ssh 10.0.1.4
systemctl status elasticsearch
# 如果服务挂了，尝试重启
sudo systemctl start elasticsearch

# 3. 如果节点无法恢复，需要强制分配分片到其他节点
# 先查看分片详情
curl -s "http://es-node:9200/_cluster/allocation/explain?pretty" -d '
{
  "index": "log-2026.07.03",
  "shard": 0,
  "primary": false
}'

# 4. 如果副本分片有数据，提升为主分片
curl -XPOST "http://es-node:9200/_cluster/reroute?pretty" -d '
{
  "commands": [
    {
      "allocate_stale_primary": {
        "index": "log-2026.07.03",
        "shard": 0,
        "node": "node-3",
        "accept_data_loss": true
      }
    }
  ]
}'
```

#### 场景二：磁盘满导致分片不分配

```bash
# 1. 调整磁盘水位线（临时方案）
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
  }
}'

# 2. 清理旧索引释放空间
# 删除 30 天前的日志索引
curl -XDELETE "http://es-node:9200/log-2026.06.*"

# 3. 或使用 ILM 自动清理
curl -XPUT "http://es-node:9200/_ilm/policy/logs_policy" -d '
{
  "policy": {
    "phases": {
      "hot": { "actions": {} },
      "delete": {
        "min_age": "30d",
        "actions": { "delete": {} }
      }
    }
  }
}'

# 4. 磁盘清理后，手动触发分片重新分配
curl -XPOST "http://es-node:9200/_cluster/reroute?retry_failed=true"
```

#### 场景三：分片损坏

```bash
# 查看分片是否损坏
curl -s "http://es-node:9200/_cat/shards/log-2026.07.03?v&h=index,shard,prirep,state,store.reason"

# 如果分片确实损坏，需要丢弃损坏的分片
curl -XPOST "http://es-node:9200/_cluster/reroute?pretty" -d '
{
  "commands": [
    {
      "allocate_empty_primary": {
        "index": "log-2026.07.03",
        "shard": 0,
        "node": "node-2",
        "accept_data_loss": true
      }
    }
  ]
}'

# ⚠ 注意：这会丢失该分片的数据！
# 只在确认无法恢复时使用
```

## 四、写入拒绝排查

### 4.1 写入拒绝根因

```
┌──────────────────────────────────────────────────────────────────┐
│               EsRejectedExecutionException 根因                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ES 写入流程:                                                    │
│                                                                  │
│  请求 → 节点路由 → 主分片 → 副本分片 → 返回                      │
│              │         │                                         │
│              │         ├─ 写入线程池 (index pool)                 │
│              │         ├─ 队列 (queue_size)                       │
│              │         └─ 拒绝策略 (abort)                        │
│              │                                                   │
│              ▼                                                   │
│  当队列满 → EsRejectedExecutionException                         │
│                                                                  │
│  根因分类:                                                        │
│  1. 写入速度超过处理能力 → 队列积满                               │
│  2. GC 停顿 → 线程池暂停处理 → 队列积满                          │
│  3. 磁盘 IO 慢 → 写入慢 → 队列积满                               │
│  4. heap 过高 → 反复 GC → 线程池暂停 → 队列积满                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 查看线程池状态

```bash
# 查看线程池状态
curl -s "http://es-node:9200/_cat/thread_pool?v&h=node_name,name,active,queue,rejected,completed"

# 输出示例
node_name name           active queue rejected completed
node-1    write               8   200    1280    456789
node-2    write               4   156       0    380123
node-3    write               2    45       0    340456
node-4    write               0     0       0         0  ← 离线

# node-1 写入拒绝 1280 次！队列 200（已满）
# 默认 write 线程池：size=CPU核心数，queue_size=200
```

### 4.3 查看写入延迟

```bash
# 查看索引性能指标
curl -s "http://es-node:9200/_nodes/stats/indices/indexing?pretty"

# 关键指标：
# "index_total": 4567890          # 总写入数
# "index_time_in_millis": 2340000  # 总写入耗时
# "index_current": 8               # 当前活跃写入
# "index_failed": 1280             # 写入失败数
# "throttle_time_in_millis": 45000 # 限流时间

# 计算平均写入延迟
# avg_latency = index_time_in_millis / index_total
# = 2340000 / 4567890 = 0.51ms (正常)
# 但 P99 可能很高，需要看监控
```

### 4.4 写入拒绝解决方案

```bash
# 方案1：增大写入队列（临时缓解）
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    "thread_pool.write.queue_size": 500
  }
}'
# 注意：增大队列只是延迟问题，不解决根本问题
# 队列越大，OOM 风险越高

# 方案2：降低客户端写入速率（推荐）
# 在客户端使用 Bulk Processor 批量写入
# 控制批量大小和发送频率
```

```java
// ES 客户端批量写入优化
BulkProcessor bulkProcessor = BulkProcessor.builder(
        client,
        new BulkProcessor.Listener() {
            @Override
            public void beforeBulk(long executionId, BulkRequest request) {
                log.debug("批量写入: {} 条", request.numberOfActions());
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request,
                                  BulkResponse response) {
                if (response.hasFailures()) {
                    long failed = Arrays.stream(response.getItems())
                        .filter(BulkItemResponse::isFailed)
                        .count();
                    log.warn("批量写入部分失败: {}/{}", failed, request.numberOfActions());
                }
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request,
                                  Throwable failure) {
                log.error("批量写入失败", failure);
                // 被拒绝时，降速重试
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        })
    .setBulkActions(1000)          // 每 1000 条触发一次批量写入
    .setBulkSize(new ByteSizeValue(5, ByteSizeUnit.MB))  // 或 5MB
    .setFlushInterval(TimeValue.timeValueSeconds(5))      // 或 5 秒
    .setConcurrentRequests(2)       // 并发批量请求数
    .setBackoffPolicy(
        BackoffPolicy.exponentialBackoff(
            TimeValue.timeValueMillis(100),  // 初始等待 100ms
            3                                 // 最多重试 3 次
        ))
    .build();
```

### 4.5 写入被拒的自适应降速

```java
/**
 * ES 写入自适应降速器
 * 根据拒绝率动态调整写入速率
 */
public class ESWriteThrottler {

    private final RestHighLevelClient client;
    private final AtomicInteger rejectedCount = new AtomicInteger(0);
    private final AtomicInteger totalCount = new AtomicInteger(0);
    private volatile long currentDelayMs = 0;
    private static final long MAX_DELAY_MS = 500;

    public void index(String index, String id, Map<String, Object> doc) {
        // 动态调整延迟
        applyBackpressure();

        try {
            IndexRequest request = new IndexRequest(index)
                .id(id)
                .source(doc);
            client.index(request, RequestOptions.DEFAULT);
            totalCount.incrementAndGet();
        } catch (EsRejectedExecutionException e) {
            rejectedCount.incrementAndGet();
            // 被拒绝时增加延迟
            increaseDelay();
            // 重试
            retry(index, id, doc);
        }
    }

    private void applyBackpressure() {
        if (currentDelayMs > 0) {
            try {
                Thread.sleep(currentDelayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void increaseDelay() {
        // 指数退避
        currentDelayMs = Math.min(MAX_DELAY_MS, currentDelayMs * 2 + 10);
        log.warn("写入被拒，降速: delay={}ms", currentDelayMs);
    }

    // 定期恢复速率
    @Scheduled(fixedRate = 10000)
    public void recoverDelay() {
        if (currentDelayMs > 0) {
            double rejectionRate = (double) rejectedCount.get() / Math.max(1, totalCount.get());
            if (rejectionRate < 0.01) {  // 拒绝率低于 1%
                currentDelayMs = Math.max(0, currentDelayMs / 2);
                log.info("写入恢复: delay={}ms", currentDelayMs);
            }
            rejectedCount.set(0);
            totalCount.set(0);
        }
    }
}
```

## 五、Heap 使用率过高与 Circuit Breaker

### 5.1 Heap 使用率分析

```bash
# 查看各节点 heap 使用情况
curl -s "http://es-node:9200/_cat/nodes?v&h=name,heap.percent,ram.percent,cpu,load_1m"

# 查看 heap 详情
curl -s "http://es-node:9200/_nodes/stats/jvm?pretty"

# 关键指标：
# "heap_used_in_bytes": 29527900160   # 已用 heap
# "heap_max_in_bytes": 32212254720    # 最大 heap (32GB)
# "heap_used_percent": 91             # 使用率 91%！
# "old_collectors": [{
#   "collection_count": 456,          # Full GC 次数
#   "collection_time_in_millis": 234000  # Full GC 总耗时
# }]
```

### 5.2 Circuit Breaker 机制

```
┌──────────────────────────────────────────────────────────────────┐
│                 ES Circuit Breaker 熔断器                         │
├───────────────────┬──────────────────────────────────────────────┤
│  熔断器类型        │  说明                                        │
├───────────────────┼──────────────────────────────────────────────┤
│  parent            │  总熔断器，限制所有请求的内存使用              │
│  (95% heap)       │  超过 → 拒绝所有请求                         │
├───────────────────┼──────────────────────────────────────────────┤
│  fielddata         │  字段数据缓存（排序、聚合）                   │
│  (40% heap)       │  超过 → 抛错并清空缓存                       │
├───────────────────┼──────────────────────────────────────────────┤
│  request           │  单个请求的内存使用                           │
│  (60% heap)       │  超过 → 拒绝该请求                           │
├───────────────────┼──────────────────────────────────────────────┤
│  accounting        │  请求完成后不能释放的内存                     │
│  (30% heap)       │  超过 → 拒绝新请求                           │
├───────────────────┼──────────────────────────────────────────────┤
│  in_flight_requests│  正在传输中的请求内存                         │
│  (100% heap)      │  超过 → 拒绝新请求                           │
└───────────────────┴──────────────────────────────────────────────┘
```

### 5.3 查看熔断器状态

```bash
# 查看熔断器统计
curl -s "http://es-node:9200/_nodes/stats/breaker?pretty"

# 输出示例
{
  "nodes": {
    "node-1": {
      "breakers": {
        "parent": {
          "limit_size_in_bytes": 30605555964,  # 限制: 95% heap
          "used_size_in_bytes": 28031503512,   # 已用: 87% heap
          "tripped": 15                         # 触发次数: 15 次！
        },
        "fielddata": {
          "limit_size_in_bytes": 12884901888,   # 限制: 40% heap
          "used_size_in_bytes": 8589934592,     # 已用: 27% heap
          "tripped": 3
        },
        "request": {
          "limit_size_in_bytes": 19327352832,   # 限制: 60% heap
          "used_size_in_bytes": 15288238080,    # 已用: 47% heap
          "tripped": 8
        }
      }
    }
  }
}

# parent 熔断器触发 15 次！说明 heap 严重不足
```

### 5.4 Heap 优化方案

```bash
# 1. 查看哪些占用了 heap
curl -s "http://es-node:9200/_cat/indices?v&h=index,docs.count,store.size,fielddata.memory_size"

# 找出 fielddata 占用大的索引
# log-2026.07.03  50000000  50gb  8gb   ← fielddata 8GB！

# 2. 清空 fielddata 缓存（临时方案）
curl -XPOST "http://es-node:9200/log-2026.07.03/_cache/clear?fielddata=true"

# 3. 限制 fielddata 大小
curl -XPUT "http://es-node:9200/log-2026.07.03/_settings" -d '
{
  "index.fielddata.cache.size": "20%"
}'

# 4. 对不需要聚合的字段关闭 fielddata
curl -XPUT "http://es-node:9200/log-2026.07.03/_mapping" -d '
{
  "properties": {
    "raw_log": {
      "type": "text",
      "fielddata": false
    }
  }
}'
```

### 5.5 JVM 调优

```yaml
# elasticsearch.yml (jvm.options)
# 关键 JVM 参数

# Heap 大小（建议 = 物理内存的 50%，不超过 31GB）
-Xms31g
-Xmx31g

# 使用 G1GC（ES 7+ 默认）
-XX:+UseG1GC
-XX:MaxG1PauseSize=200ms

# G1 调优
-XX:G1HeapRegionSize=16m
-XX:InitiatingHeapOccupancyPercent=35

# GC 日志
-Xlog:gc*:file=/var/log/elasticsearch/gc.log:time,uptime,level,tags

# 避免压缩指针退化（<=32GB heap 时使用）
-XX:+UseCompressedOops
```

## 六、集群恢复与分片重平衡

### 6.1 分片重平衡控制

```bash
# 查看当前重平衡设置
curl -s "http://es-node:9200/_cluster/settings?pretty"

# 临时停止分片重平衡（紧急情况，防止恢复流量压垮集群）
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    "cluster.routing.allocation.enable": "none"  # 停止所有分配
  }
}'

# 逐步恢复
# 先只分配主分片
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    "cluster.routing.allocation.enable": "primaries"
  }
}'

# 等主分片恢复完成后，再分配副本
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    "cluster.routing.allocation.enable": "all"
  }
}'
```

### 6.2 控制恢复速率

```bash
# 分片恢复速度控制
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    # 每节点恢复速率限制
    "indices.recovery.max_bytes_per_sec": "100mb",

    # 并发恢复数
    "cluster.routing.allocation.node_concurrent_recoveries": 2,

    # 初始恢复速度（避免恢复刚开始就打满）
    "indices.recovery.initial_bytes_per_sec": "40mb"
  }
}'
```

### 6.3 分片分配过滤

```bash
# 将分片从有问题的节点迁移走
curl -XPUT "http://es-node:9200/_cluster/settings" -d '
{
  "transient": {
    # 排除 node-1（磁盘满）
    "cluster.routing.allocation.exclude._name": "node-1"
  }
}'

# 迁移完成后，节点上不再有分片
# 可以安全下线该节点
```

## 七、监控告警体系

### 7.1 关键监控指标

```yaml
# Prometheus + Elastalert 告警规则
# es_cluster_status.yml
name: ES Cluster Status
type: metric
index: elasticsearch-cluster-stats-*
filter:
  - query:
      query_string:
        query: "status:red"
alert:
  - "pagerduty"
```

```yaml
# Prometheus 告警规则
groups:
  - name: elasticsearch
    rules:
      # 集群状态非绿
      - alert: ESClusterNotGreen
        expr: elasticsearch_cluster_health_status{color="red"} == 1
        for: 1m
        labels:
          severity: critical

      # Heap 使用率过高
      - alert: ESHeapHigh
        expr: elasticsearch_jvm_memory_used_bytes{area="heap"}
              / elasticsearch_jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning

      # 写入拒绝
      - alert: ESWriteRejected
        expr: rate(elasticsearch_threadpool_rejected_count{name="write"}[5m]) > 10
        for: 2m
        labels:
          severity: critical

      # 未分配分片
      - alert: ESUnassignedShards
        expr: elasticsearch_cluster_health_unassigned_shards > 0
        for: 5m
        labels:
          severity: warning

      # 磁盘使用率
      - alert: ESDiskHigh
        expr: elasticsearch_filesystem_data_used_bytes
              / elasticsearch_filesystem_data_total_bytes > 0.85
        for: 5m
        labels:
          severity: warning
```

## 八、避坑指南

### 8.1 ES 集群常见坑

| 序号 | 坑点 | 影响 | 预防措施 |
|-----|------|------|---------|
| 1 | Heap 设置超过 32GB | 压缩指针失效 | 严格 ≤ 31GB |
| 2 | Swap 未关闭 | GC 暴增 | bootstrap.memory_lock: true |
| 3 | 分片数过少 | 无法利用多节点 | 按数据量规划分片 |
| 4 | 分片数过多 | 元数据开销大 | 单节点分片 ≤ 20/G heap |
| 5 | mapping 动态推断 | 字段类型错误 | 严格 mapping，关闭动态推断 |
| 6 | bulk 过大 | OOM | 单次 bulk 5-15MB |
| 7 | 无 ILM 策略 | 索引无限增长 | 配置自动滚动和删除 |
| 8 | replica=0 | 单点故障 | 生产环境至少 replica=1 |

### 8.2 分片规划建议

```
┌──────────────────────────────────────────────────────────────────┐
│                   ES 分片容量规划                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  单分片建议大小: 30-50GB                                         │
│  单节点分片数: ≤ 20 × heap(GB) / 30                             │
│                                                                  │
│  示例规划:                                                        │
│  数据量: 10TB/月                                                 │
│  每日数据: ~330GB                                                │
│  每日分片数: 330 / 50 = 7 → 取 8（2的幂）                        │
│  副本数: 1                                                       │
│  总分片/日: 8 × (1+1) = 16                                       │
│                                                                  │
│  节点规划:                                                        │
│  30 天数据: 330 × 30 = 9.9TB                                     │
│  每节点 2TB → 5 个数据节点                                       │
│  每节点分片: 8 × 30 / 5 = 48 个 ← 可能偏多                      │
│  调整: 6 个节点，每节点 40 个分片                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 九、面试要点

### Q1: ES 集群变红怎么排查？

**回答框架：**
1. `_cluster/health` 看集群状态和未分配分片数
2. `_cluster/allocation/explain` 看分片未分配原因
3. 按原因分类处理：节点离线、磁盘满、分片损坏
4. 紧急时先 `reroute` 恢复主分片

### Q2: ES 写入被拒绝怎么处理？

**回答框架：**
1. `_cat/thread_pool` 查看写入线程池队列和拒绝数
2. 短期：增大 queue_size 或降低客户端写入速率
3. 长期：扩容节点、优化 mapping、使用 ILM 管理索引
4. 客户端侧：批量写入 + 指数退避重试

### Q3: ES Heap 怎么设置和调优？

**回答要点：**
1. Heap ≤ 31GB（压缩指针边界）
2. Xms = Xmx（避免动态调整）
3. G1GC，IHOP=35%
4. fielddata.cache.size 限制 20-40%
5. 磁盘: 内存 ≈ 10:1（如 10TB 磁盘配 1TB 内存的节点）

### Q4: ES 的 circuit breaker 有哪些？

**回答要点：**
1. parent（95%）：总熔断器
2. fielddata（40%）：字段缓存
3. request（60%）：单请求
4. accounting（30%）：不可释放内存
5. in_flight_requests（100%）：传输中请求

### Q5: 如何规划 ES 分片数？

**回答要点：**
1. 单分片 30-50GB
2. 单节点 ≤ 20 × heap(GB) / 30 个分片
3. 分片数 = 预估数据量 / 单分片大小，向上取 2 的幂
4. 生产环境至少 1 个副本
5. 使用 ILM 自动管理索引生命周期

## 十、总结

ES 集群故障排查核心方法论：

1. **先看集群颜色** — green/yellow/red 决定紧急程度
2. **allocation/explain 是核心** — 它会告诉你分片为什么没分配
3. **线程池队列看拒绝** — rejected > 0 就要降速或扩容
4. **Heap 85% 是红线** — 超过就要查 fielddata 和查询内存
5. **磁盘 90% 会停分配** — 提前用 ILM 管理索引生命周期
6. **分片规划要提前做** — 事后调整成本高，提前按数据量规划好分片数和节点数