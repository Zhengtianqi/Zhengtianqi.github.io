---
title: 初识redis（3）-持久化
author: ztq
tag:
  - redis
category:
  - 数据库
date: 2021-08-01 22:43:00

---

# 1、Redis 数据持久化概念

Redis 的数据持久化，即：将内存中的数据存储到硬盘（本文中亦称之为 “落地”）。Redis 提供了 RDB 和 AOF 两种持久化的方法：
•	RDB：基于特定的时间间隔将数据 “全量快照”，生成 RDB 文件并落地
•	AOF (Append Only File)：将 Redis 接收到命令以 “增量追加” 的方式，写入 AOF 文件
Redis 允许使用任意一种持久化方法，亦允许同时使用或同时不使用。以下将阐述两者涉及的配置选项、命令以及优缺点。

# 2、RDB 与 AOF 优缺点和选择

RDB
•	非常适合于备份以及灾难恢复的场景
•	能够最大化 Redis 性能
•	相对于 AOF，RDB 文件在 Redis 启动时能够更快加载
•	若期望将数据丢失的可能性最小化，RDB 并不适用
AOF
•	基于 “追加” 和 “文件同步” 的特性，AOF 具有更佳的 “持久化” 表现
•	对于相同的数据，AOF 文件大小通常将超过 RDB
综合而言，如果能够承担一定程度的数据丢失风险，仅启用 RDB 持久化即可。但并不建议只启用 AOF 持久化，毕竟 RDB 文件更适合于数据备份。
若 RDB 持久化和 AOF 持久化同时启用，Redis 启动时，将加载 AOF 文件，毕竟 AOF 具有更佳的 “持久化” 表现。

# 3、RDB

## 配置选项

```java
save 900 1                       # RDB 落地选项，900 秒内有 1 次写入，即落地新的 RDB 文件。
                                 # 允许多个 save 配置，满足任意配置即开始新的 RDB 文件落地；若无 save 配置，即表示关闭 RDB 数据持久化
                                 # 
stop-writes-on-bgsave-error yes  # RDB 文件写入失败时，Redis 是否停止接收写命令，默认 yes，即停止
rdbcompression yes               # 是否压缩 RDB 文件，默认 yes，即压缩
rdbchecksum yes                  # 是否启用 RDB 文件校验，默认 yes，即生成 CRC64，写入 RDB 文件结尾
dbfilename dump.rdb              # RDB 文件名称
dir ./                           # RDB 文件路径（说明：配置与 AOF 共享）
```

RDB 相关的配置，应当结合业务的实际，例如：
•	当 RDB 文件写入失败时，若能够通过其他的运维手段进行及时处理，则无需开启 stop-writes-on-bgsave-error，以避免线上服务的中断
•	若开启 rdbcompression 与 rdbchecksum 选项，RDB 文件的落地、Redis 启动时的 RDB 文件加载，将产生额外的性能损耗

## RDB 相关

### •	SAVE

“同步” 创建 RDB 文件，SAVE 将阻塞 Redis，Redis 将不能响应其他任何命令，直到 RDB 文件完成创建与落地。

### •	BGSAVE

“异步” 创建 RDB 文件，Redis 创建子进程：父进程继续提供服务，由子进程生成并落地 RDB 文件。
当配置选项中任意的 save 配置条件满足时，Redis 将自动地 “触发” BGSAVE 命令。

### •	LASTSAVE

获取最后一次成功落地 RDB 文件的 Unix 时间。

# 4、AOF

## 配置选项

```java
appendonly no                    # 是否启用 AOF 数据持久化，默认 no，即关闭
appendfilename "appendonly.aof"  # AOF 文件名称
# AOF 文件同步选项
appendfsync everysec             
no-appendfsync-on-rewrite no     
# AOF 文件 rewrite 选项
auto-aof-rewrite-percentage 100  
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes           # 若 AOF 文件的结尾处损坏（由操作系统故障引起），Redis 启动时加载 AOF 文件，根据 aof-load-truncated 配置：
                                 #   默认 yes：忽略 AOF 文件结尾处的损坏
                                 #   no：Redis 进程退出
                                 #
dir ./                           # AOF 文件路径（说明：配置与 RDB 共享）
```

## AOF 相关

AOF 文件同步，即通过系统调用 fsync()将 AOF 文件位于操作系统缓冲区的部分（取决于 write()的工作机制）写入硬盘。
特别说明：fsync()并不确保缓冲区的内容一定能够写入硬盘，其工作机制取决于操作系统。

### appendfsync 配置选项：

•	always：每次写入 AOF 文件，都进行一次 fsync() 系统调用
•	everysec：默认，每秒进行一次 fsync() 系统调用
•	no：不进行 fsync() 系统调用，完全由操作系统控制

### no-appendfsync-on-rewrite 配置选项：

•	yes：即 Redis 进行 AOF 文件 rewrite 时（或落地 RDB 文件时），fsync() 系统调用暂停，以避免可能产生的阻塞
•	no：默认，即 Redis 进行 AOF 文件 rewrite 时，继续进行 fsync() 系统调用

### AOF 文件 rewrite

作为 Redis 命令的 “log”，AOF 文件的大小必须持续增长。Redis 提供 AOF 文件 rewrite 特性，能够移除 AOF 文件的冗余命令以减少 AOF 文件大小。
例如：Redis 针对一个 key 执行了 100 次的 SET，AOF 文件仅保留最后一次 SET 命令即可。

### BGREWRITEAOF 命令：

“异步” 进行 Redis AOF 文件 rewrite
•	若 Redis 正在进行创建 RDB 文件，AOF 文件 rewrite 将等待 RDB 文件创建完成后开始
•	若 AOF 文件 rewrite 正在进行 ，BGREWRITEAOF 命令将不会开始新的 AOF 文件 rewrite

### auto-aof-rewrite-percentage & auto-aof-rewrite-min-size 配置选项：

AOF 文件自动 rewrite 机制，当 AOF 文件大小达到以下阈值，Redis 即自动开始 AOF 文件 rewrite：
•	增长百分比超过 auto-aof-rewrite-percentage（相对于上一次 rewrite 完成时的 AOF 文件）
•	超过 auto-aof-rewrite-min-size
通过设置 auto-aof-rewrite-percentage 为 0，即关闭 AOF 文件的自动 rewrite。

