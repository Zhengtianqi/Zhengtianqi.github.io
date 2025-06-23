---
title: 初识redis（4）-主从架构
author: ztq
tag:

  - redis
category:
  - 数据库
date: 2021-08-02 00:13:00

---

# 1、Redis “主 - 从” 机制

Redis 提供 “主 - 从” 的数据复制：“从” Redis 即作为 “主” Redis 的数据副本。“从” Redis，既能够用于读性能的扩展，亦能够作为数据备份的一种手段。

同时，Redis 支持 [Redis Sentinel](https://redis.io/topics/sentinel)，实现 “主 - 从” 监控、故障迁移，限于篇幅，本文不予以展开。

# 2、工作机制

## “主 **-** 从” 数据复制的基本工作机制

- 已建立的 “主” - “从” 连接，“主”     Redis 不断地将命令发送到 “从” Redis
- 若连接中断（例如：网络问题），“从” Redis 将尝试重新建立连接，并尝试 “半 - 重新同步”
- 若无法进行 “半 - 重新同步”，“从” Redis 将尝试进行 “重新同步”（“主 - 从” 连接首次建立，亦执行 “重新同步”）

## 关于 “半 - 重新同步” & “重新同步”

- “半 - 重新同步”：“从” Redis 将尝试获取连接中断期间于 “主” Redis 执行的命令（存储于 backlog）
- “重新同步”
  - “主” Redis 创建数据快照（RDB 文件）、同步到 “从” Redis，开始将 “主” Redis 执行的命令发送到 “从” Redis
  - “从” Redis 丢弃当前数据，加载 “主” Redis 的 RDB 文件，开始执行 “主” Redis 发送的命令

“数据复制” 对于 “主” Redis 全部是异步的；对于 “从” Redis，大部分是异步的，但 “重新同步” 涉及 “丢弃当前数据，加载 RDB 文件”，将引起 “短暂中断”。

# 3、“主 - 从” 配置

```java
slaveof master_ip master_port  # “从” Redis 配置：“主” Redis - IP &  port
masterauth master_password     # “从” Redis 配置：“主” Redis - 密码

slave-serve-stale-data yes     # “从” Redis 配置：当 “主 - 从” 连接中断或 “从” Redis 正在进行初始化同步，“从” Redis 是否提供服务：
                               #   yes: 默认，以 “从” Redis 当前数据提供服务
                               #   no: 对于接收到的命令，“从” Redis 返回 “SYNC in progress”（INFO、SLAVEOF 命令除外）
                               #
slave-read-only yes            # “从” Redis 配置：是否 “只读”，默认 yes


“主” Redis 配置：根据已连接的 “从” Redis 情况，“主” Redis 是否接收 “写命令”
min-slaves-to-write 3
min-slaves-max-lag 10
表示：最少有 3 个已连接的 “从” Redis，且延迟小于等于 10 秒

min-slaves-to-write 3          # 默认 0，即无论 “从” Redis 的连接情况，始终接收 “写命令”
min-slaves-max-lag 10
```

以上的代码，仅列出了部分关键的配置。其他类似于：diskless 复制、backlog 配置，限于篇幅，未能列出，详情内容请参考 [redis.conf for Redis 2.8](https://raw.githubusercontent.com/antirez/redis/2.8/redis.conf)。

# 4、“主 - 从” 命令

1. SLAVEOF host port
   将 Redis 配置作为 “从” Redis，其 “主” Redis 位置即为 host:port。
2. SLAVEOF NO ONE
   终止 “从” Redis 自 “主” Redis 的数据同步。
   特别说明：SLAVEOF NO ONE 包含了 Redis 设计之初，关于 “自由” 的思想：“If slavery is not wrong, nothing is wrong. -- Abraham Lincoln”。

# 5、“主 - 从” 链

“从” Redis 能够作为其他 Redis 的 “主” Redis，由此构建级联结构的 “主 - 从” 链。并且，“主” Redis 能够与多个 “从” Redis 建立连接，建立 “树状” 结构。

![image-20210802000052243](/assets/images/image-20210802000052243.png)

