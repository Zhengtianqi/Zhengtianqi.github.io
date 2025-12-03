---
title: 初识redis（5）-内存调优
author: zheng
tag:

  - redis
category:
  - 数据库
date: 2021-08-02 00:14:00

---

# 1、优化 Redis 内存使用

合理的 Redis 实例，内存的占有量不应当超过 60%，当内存使用率过高时，应该予以清理及优化。

# 2、使用 ziplist & intset

## ziplist 优化机制

ziplist 实现了 “紧凑” 的数据结构，通过尽可能减少非数据节点的占用，以提供内存密度。

![image-20210802000308665](/assets/images/image-20210802000308665.png)

图中所示，ziplist 整体结构：
•	zl-bytes：整个 ziplist 占用内存的字节数
•	zl-tail：ziplist 尾节点距离起始地址的字节数
•	zl-len：ziplist 包含的节点数量
•	entry：节点
•	zl-end：ziplist 末端标记，固定 0xFF
ziplist 节点结构：
•	previous-entry-length：前一个节点占用内存的字节数
•	encoding：节点编码，明确节点存储内容属于 “字节数组” 或整数，并明确长度（即占用的字节数）
•	content：节点存储内容
“散列表”、“链表”、“有序集合”，使用 ziplist，受益于其 “紧凑” 的数据结构，相较于 hashtable、linkedlist、skiplist，能够有效减少内存占用。
然而，受限于 “紧凑” 的数据结构，随着节点数量增长和节点大小膨胀，基于 ziplist 实现的 “散列表”、“链表”、“有序集合”，性能将显著下降。

## intset 优化机制

intset 使用整型数组作为存储的数据结构。通常，hashtable 实现的 Redis 集合，其成员以 “字符串” 结构进行存储，intset 由此能够显著降低内存使用。

类似于 ziplist，同样受限于其整型数组，“集合” 成员数量的增长将引起 “集合” 性能的下降。

# 3、ziplist & intset配置

```java
 “散列表” 使用 ziplist 的限制条件：
  - 成员数量不超过 hash-max-ziplist-entries
  - 最大内存占用的成员，内存占用不超过 hash-max-ziplist-value (字节)
两者必须同时具备，任意条件不满足，即无法使用 ziplist    
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

 “链表” 使用 ziplist 的限制条件
list-max-ziplist-entries 512
list-max-ziplist-value 64

“有序集合” 使用 ziplist 的限制条件
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

“集合” 使用 intset 的限制条件:
- 成员全部为 64 位有符号整数
- 成员数量不超过 set-max-intset-entries
set-max-intset-entries 512

```

附加说明：ziplist & intset 的限制条件，是基于内存占用和性能的综合考虑。

# 4、数据分片

Redis 作为任何单实例的数据服务，最终会遇到容量和性能瓶颈。前文阐述的 Redis “主 - 从”，即为常见且有效的扩展 Redis 读性能的方案。 “数据分片” 构建 Redis 集群。常用的方案包括：Redis Cluster、[twemproxy](https://github.com/twitter/twemproxy)、[Codis](https://github.com/CodisLabs)。

## 分布式 “数据分片”

分布式 “数据分片”：选取合适的方式将 Redis 数据分布于不同的实例，由此降低单实例的内存使用，实现优化。

## 单实例 “数据分片”

通常而言，单实例 “数据分片”，并不能直接降低 Redis 内存使用，需要结合 ziplist 等内存优化方式，以 “散列表” 为例：
•	以散列表的键作为 “数据分片” 的 “路由”，将单个内存占用量大的 “散列表” 分片到多个内存占有量小的 “散列表”
•	内存占有量小的 “散列表”（例如：“散列表” 成员数量少） 能够以 ziplist 方式减少内存占用
由此，有效地实现内存使用的优化。

## 基于业务进行优化

基于业务，通常能够取得良好的 Redis 内存优化效果，例如：
•	尽可能短的 Redis 键，例如：以 “u_178” 替代 “user_id_178”
•	选择合适的 Redis 数据结构，例如：合理地选择 “散列表” 替代 “字符串”，若 “字符串” 数量较少，使用一个 “散列表” 替代，通常能够减少内存使用
•	减少存储于 Redis 的业务数据量

# 5、数据分片配置

“数据分片” - 使用 [Codis](https://github.com/CodisLabs)

选择 Codis 的原因
Codis 来自于 “豌豆荚”，相对于 twemproxy，选择 Codis 的原因：
•	twemproxy 无法实现动态水平扩展
•	Codis 运行于多核机器能够获得更好的应用
相对于 Redis Cluster，选择 Codis 的原因：
•	Redis Cluster 必须使用 Redis 3.0 以上版本的客户端
•	Redis Cluster 无法支持 pipeline



Codis 架构

![image-20210802000916321](/assets/images/image-20210802000916321.png)

图中所示，Codis 架构中引入了 codis-proxy，由 codis-proxy 基于 Redis key 计算分片，将命令转发到 codis-group，因此：对于绝大多数的命令，客户端对于 Codis 的接入是透明的。



Codis 针对 Redis key 计算 CRC32，默认分为 1024 个 Slot，进而路由到特定的 codis-group，实现分片。
除了 “数据分片”，Codis 的特性还包括：
•	提供了 codis-fe & codis-dashborad 作为集群管理工具
•	允许多个 codis-proxy，实现 proxy 层的高可用
•	codis-group 支持 “主 - 从”，引入 redis-sentinel 实现 “主 - 从” 故障迁移
必须说明的是：“数据分片” 扩展容量和性能的同时，亦限制了 Redis 若干方便的能力，例如：Codis 不支持事务、部分命令不支持。
