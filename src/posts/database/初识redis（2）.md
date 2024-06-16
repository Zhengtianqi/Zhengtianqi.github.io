---
title: 初识redis（2）-基本特性
author: ztq
tag:
  - redis
category:
  - 数据库
date: 2021-08-01 22:08:00
---

# 1、排序

​		Redis 的排序操作和其他编程语言的排序操作一样，都可以根据某种比较规则对一系列元素进行有序的排列。负责执行排序操作的SORT命令可以根据字符串、列表、集合、有序集合、散列这5种键里面存储着的数据，对列表、集合以及有序集合进行排序。如果读者之前曾经使用过关系数据库的话，那么可以将SORT命令看作是SQL语言里的order by子句。

SORT source-key [BY pattern] [LIMIT offset count] [GET pattern [GETpattern ...] ] [ASC|DESC] [ALPHA] [STORE dest-key] 根据给定的选项，对输入列表、集合或者有序集合进行排序，然后返回或者存储排序的结果

```java
127.0.0.1:6379> lrange myList 0 -1
1) "10"
2) "-1"
3) "2"
4) "3"
127.0.0.1:6379> sort myList asc
1) "-1"
2) "2"
3) "3"
4) "10"
```

# 2、事务

​		有时候为了同时处理多个结构，我们需要向Redis 发送多个命令。尽管Redis有几个可以在两个键之间复制或者移动元素的命令，但却没有那种可以在两个不同类型之间移动元素的命令(虽然可以使用ZUNIONSTORE命令将元素从一个集合复制到一个有序集合)。为了对相同或者不同类型的多个键执行操作，Redis有5个命令可以让用户在不被打断(interruption )的情况下对多个键执行操作，它们分别是WATCH、MULTI、EXEC、UNWATCH和 DISCARD。

​		Redis的基本事务( basic transaction)需要用到MULTI命令和EXEC命令，这种事务可以让一个客户端在不被其他客户端打断的情况下执行多个命令。和关系数据库那种可以在执行的过程中进行回滚( rollback)的事务不同，在Redis里面，被MULTI命令和EXEC命令包围的所有命令会一个接-一个地执行， 直到所有命令都执行完毕为止。当一个事务执行完毕之后，Redis 才会处理其他客户端的命令。

# 3、键的过期时间

​		在使用Redis存储数据的时候，有些数据可能在某个时间点之后就不再有用了，用户可以使用DEL命令显式地删除这些无用数据,也可以通过Redis的过期时间(expiration)特性来让一个键在给定的时限(timeout)之后自动被删除。当我们说一个键“带有生存时间(time to live)”或者一个键“会在特定时间之后过期(expire)”时，我们指的是Redis会在这个键的过期时间到达时自动删除该键。

- PERSIST key-name		移除键的过期时间
- TTL key-name		查看给定键距离过期还有多少秒
- EXPIRE key-name seconds		让给定键在指定的秒数之后过期
- EXPIREAT key-name timestamp		将给定键的过期时间设置为给定的UNIX时间戳
- PTTL key-name		查看给定键距离过期时间还有多少毫秒，这个命令在Redis 2.6或以上版本可用
- PEXPIRE key-name milliseconds		让给定键在指定的毫秒数之后过期，这个命令在Redis 2.6或以上版本可用
- PEXPIREAT key-name timestamp-milliseconds		将一个毫秒级精度的UNIX时间戳设置为给定键的过期时间，这个命令在 Redis 2.6或以上版本可用

