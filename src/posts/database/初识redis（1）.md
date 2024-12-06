---
title: 初识redis（1）-数据结构
author: ztq
tag:
  - redis
category:
  - 数据库
date: 2021-07-31 12:49:00
---

# 1、Redis数据结构介绍

（1）STRING    

		value：可以是字符串、整数或者浮点数      

		operate：对整个字符串或者字符串的其中一部分执行操作；对整数和浮点数执行自增（increment）或者自减(decrement)操作

（2）LIST

		value：一个链表，链表上的每个节点都包含了—个字符串

		operate：从链表的两端推入或者弹出元素;根据偏移量对链表进行修剪(trim)；读取单个或者多个元素;根据值查找或者移除元素

（3）SET

		value：包含字符串的无序收集器( unordered collection)，并且被包含的每个字符串都是独一无二、各不相同的

		operate：添加、获取、移除单个元素；检查一个元素是否存在于集合中;计算交集、并集、差集；从集合里面随机获取元素

（4）HASH

		value：包含键值对的无序散列表

		operate：添加、获取、移除单个键值对;获取所有键值对

（5）ZSET（有序集合)

		value：字符串成员( member)与浮点数分值( score）之间的有序映射，元素的排列顺序由分值的大小决定

		operate：添加、获取、删除单个元素；根据分值范围（range)或者成员来获取元素

# 2、常用命令

## （1）STRING字符串命令

- SET key-name value		设置值
- GET key-name		获得值
- DEL key-name		删除值

例子：

```java
127.0.0.1:6379> set hello world
OK
127.0.0.1:6379> get hello
"world"
127.0.0.1:6379> del hello
(integer) 1
127.0.0.1:6379> get hello
(nil)
```

- INCR key-name		将键存储的值加上1
- DECR key-name		将键存储的值减去1
- INCRBY key-name amount		将键存储的值加上整数amount
- DECRBY key-name amount		将键存储的值减去整数amount
- INCRBYFLOAT key-name amount		将键存储的值加上浮点数 amount，这个命令在Redis 2.6或以上的版本可用

例子：

```
127.0.0.1:6379> set name 1
OK
127.0.0.1:6379> incr name
(integer) 2
127.0.0.1:6379> get name
"2"
127.0.0.1:6379> decr name
(integer) 1
127.0.0.1:6379> get name
"1"
127.0.0.1:6379> incrby name 2
(integer) 3
127.0.0.1:6379> get name
"3"
```



## （2）LIST列表命令

- RPUSH key-name value [value ...]		将一个或多个值推入列表的右端
- LPUSH key-name value [value ...]		将一个或多个值推入列表的左端
- RPOP key-name		移除并返回列表最右端的元素
- LPOP key-name		移除并返回列表最左端的元素
- LINDEX key-name offset		返回列表中偏移量为offset的元素
- LRANGE key-name start end		返回列表从start偏移量到end偏移量范围内的所有元素,其中偏移量为start和偏移量为end 的元素也会包含在被返回的元素之内
- LTRIM key-name start end		对列表进行修剪，只保留从start偏移量到end偏移量范围内的元素，其中偏移量为start和偏移量为end的元素也会被保留

例子：

```java
127.0.0.1:6379> rpush myList 1 2 3 4
(integer) 4
127.0.0.1:6379> lrange myList 0 4
1) "1"
2) "2"
3) "3"
4) "4"
127.0.0.1:6379> lrange myList 0 -1
1) "1"
2) "2"
3) "3"
4) "4"
127.0.0.1:6379> lpush myList -1 0
(integer) 6
127.0.0.1:6379> lrange myList 0 -1
1) "0"
2) "-1"
3) "1"
4) "2"
5) "3"
6) "4"
```

- BLPOP key-name [ key-name ...] timeout		从第一个非空列表中弹出位于最左端的元素，或者在timeout秒之内阻塞并等待可弹出的元素出现
- BRPOP key-name [key-name ...] timeout		从第一个非空列表中弹出位于最右端的元素，或者在timeout秒之内阻塞并等待可弹出的元素出现
- RPOPLPUSH source-key dest-key		从source-key列表中弹出位于最右端的元素，然后将这个元素推入dest-key列表的最左端，并向用户返回这个元素
- BRPOPLPUSH source-key dest-key timeout		从source-key列表中弹出位于最右端的元素，然后将这个元素推入dest-key列表的最左端，并向用户返回这个元素；如果source-key为空，那么在timeout秒之内阻塞并等待可弹出的元素出现

```java
127.0.0.1:6379> blpop myList 2
1) "myList"
2) "0"
127.0.0.1:6379> blpop myList 2000
1) "myList"
2) "-1"
127.0.0.1:6379> blpop myList 6000
1) "myList"
2) "1"
127.0.0.1:6379> brpop myList 2
1) "myList"
2) "4"
```

# （3）SET集合命令

- SADD key-name item [item ...]		将一个或多个元素添加到集合里面，并返回被添加元素当中原本并不存在于集合里面的元素数量
- SREM key-name item [item ...]		从集合里面移除一个或多个元素，并返回被移除元素的数量
- SISMEMBER key-name item		检查元素item是否存在于集合key-name 里
- SCARD key-name		返回集合包含的元素的数量
- SMEMBERS key-name		返回集合包含的所有元素
- SRANDMEMBER key-name [count]		从集合里面随机地返回一个或多个元素。当count为正数时，命令返回的随机元素不会重复:当count为负数时，命令返回的随机元素可能会出现重复
- SPOP key-name		随机地移除集合中的一个元素，并返回被移除的元素
- SMOVE source-key dest-key item		如果集合source-key包含元素item，那么从集合source-key里面移除元素item，并将元素item添加到集合dest-key中;如果item被成功移除,那么命令返回1，否则返回0

## 用于组合和处理多个集合的Redis命令

- SDIFF key-name [key-name ...]		返回那些存在于第一个集合、但不存在于其他集合中的元素（数学上的差集运算)
- SDIFFSTORE dest-key key-name [key-name ...]		将那些存在于第一个集合但并不存在于其他集合中的元素（数学上的差集运算）存储到dest-key键里面
- SINTER key-name [key-name ...]		返回那些同时存在于所有集合中的元素（数学上的交集运算)
- SINTERSTORE dest-key key-name [key-name ...]		将那些同时存在于所有集合的元素（数学上的交集运算)存储到dest-key键里面
- SUNION key-name [key-name ...]		返回那些至少存在于一个集合中的元素（数学上的并集计算)
- SUNIONSTORE dest-key key-name [key-name ...]		将那些至少存在于一个集合中的元素（数学上的并集计算)存储到dest-key键里面

# （4）HASH散列命令

HMGET key-name key [key ...]		从散列里面获取一个或多个键的值

HMSET key-name key value [key value ...]		为散列里面的一个或多个键设置值

HDEL key-name key [key ...]		删除散列里面的一个或多个键值对，返回成功找到并删除的键值对数量

HLEN key-name		返回散列包含的键值对数量

## 散列的更高级特性

HEXISTS key-name key		检查给定键是否存在于散列中HKEYS key-name———获取散列包含的所有键

HKEYS key-name		获取散列包含的所有键

HVALS key-name		获取散列包含的所有值

HGETALL key-name		获取散列包含的所有键值对

HINCRBY key-name key increment		将键key存储的值加上整数increment

HINCRBYFLOAT key-name key increment		将键key存储的值加上浮点数increment

# （5）ZSET有序集合命令

ZADD key-name score member [score member ...]		将带有给定分值的成员添加到有序集合里面

ZREM key-name member [member ...]		从有序集合里面移除给定的成员，并返回被移除成员的数量

ZCARD key-name		返回有序集合包含的成员数量

ZINCRBY key-name increment member		将member成员的分值加上increment

ZCOUNT key-name min max——返回分值介于min和max之间的成员数量

ZRANK key-name member		返回成员member在有序集合中的排名

ZSCORE key-name member		返回成员member的分值

ZRANGE key-name start stop [WITHSCORES]		返回有序集合中排名介于start和 stop之间的成员，如果给定了可选的WITHSCORES选项，那么命令会将成员的分值也一并返回

## 有序集合的范围型数据获取命令和范围型数据删除命令，以及并集命令和交集命令

ZREVRANK key-name member		返回有序集合里成员member的排名，成员按照分值从大到小排列

ZREVRANGE key-name start stop [WITHSCORES]		返回有序集合给定排名范围内的成员，成员按照分值从大到小排列

ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]		返回有序集合中，分值介于min和max之间的所有成员

ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]		获取有序集合中分值介于min和max之间的所有成员，并按照分值从大到小的顺序来返回它们

ZREMRANGEBYRANK key-name start stop		移除有序集合中排名介于start和stop之间的所有成员

ZREMRANGEBYSCORE key-name min max		移除有序集合中分值介于min和 max之间的所有成员

ZINTERSTORE dest-key key-count key [key ...] [WEIGHTS weight[ weight ...]] [AGGREGATE SUM|MIN|MAX]		对给定的有序集合执行类似于集合的交集运算

ZUNIONSTORE dest-key key-count key [key ...] [WEIGHTS weight[ weight ...]] [AGGREGATE SUM|MIN|MAX]		对给定的有序集合执行类似于集合的并集运算
