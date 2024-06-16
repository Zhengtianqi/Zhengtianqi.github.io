---
title: Redis数据结构与对象（三）-字典
author: ztq
tag:

  - redis
category:
  - 数据库
date: 2022-01-25 15:58:00

---

## 字典的实现

Redis 的字典使用哈希表作为底层实现，一个哈希表里面可以有多个哈希表节点，而每个哈希表节点就保存了字典中的一个键值对。

接下来的三个小节将分别介绍 Redis 的哈希表、哈希表节点、以及字典的实现。

## 哈希表

Redis 字典所使用的哈希表由 `dict.h/dictht` 结构定义：

```java
typedef struct dictht {
    // 哈希表数组
    dictEntry **table;
    // 哈希表大小
    unsigned long size;
    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size - 1
    unsigned long sizemask;
    // 该哈希表已有节点的数量
    unsigned long used;
} dictht;
```

`table` 属性是一个数组，数组中的每个元素都是一个指向 `dict.h/dictEntry` 结构的指针，每个 `dictEntry` 结构保存着一个键值对。

`size` 属性记录了哈希表的大小，也即是 `table` 数组的大小，而 `used` 属性则记录了哈希表目前已有节点（键值对）的数量。

`sizemask` 属性的值总是等于 `size - 1` ，这个属性和哈希值一起决定一个键应该被放到 `table` 数组的哪个索引上面。

图 4-1 展示了一个大小为 `4` 的空哈希表（没有包含任何键值对）。

![字典的实现 - 图1](/assets/images/d234cadc40e81da676a8b541d9cb6ab4.png)

## 哈希表节点

哈希表节点使用 `dictEntry` 结构表示，每个 `dictEntry` 结构都保存着一个键值对：

```java
typedef struct dictEntry {
    // 键
    void *key;
    // 值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
    } v;
    // 指向下个哈希表节点，形成链表
    struct dictEntry *next;
} dictEntry;
```

`key` 属性保存着键值对中的键，而 `v` 属性则保存着键值对中的值，其中键值对的值可以是一个指针，或者是一个 `uint64_t` 整数，又或者是一个 `int64_t` 整数。

`next` 属性是指向另一个哈希表节点的指针，这个指针可以将多个哈希值相同的键值对连接在一次，以此来解决键冲突（collision）的问题。

举个例子，图 4-2 就展示了如何通过 `next` 指针，将两个索引值相同的键 `k1` 和 `k0` 连接在一起。

![字典的实现 - 图2](/assets/images/d9710d39e895a6eb8210645c6e0b85e3.png)

## 字典

Redis 中的字典由 `dict.h/dict` 结构表示：

```java
typedef struct dict {
    // 类型特定函数
    dictType *type;
    // 私有数据
    void *privdata;
    // 哈希表
    dictht ht[2];
    // rehash 索引
    // 当 rehash 不在进行时，值为 -1
    int rehashidx; /* rehashing not in progress if rehashidx == -1 */
} dict;
```

`type` 属性和 `privdata` 属性是针对不同类型的键值对，为创建多态字典而设置的：

- `type` 属性是一个指向 `dictType` 结构的指针，每个 `dictType` 结构保存了一簇用于操作特定类型键值对的函数，Redis 会为用途不同的字典设置不同的类型特定函数。
- 而 `privdata` 属性则保存了需要传给那些类型特定函数的可选参数。

```java
typedef struct dictType {
    // 计算哈希值的函数
    unsigned int (*hashFunction)(const void *key);
    // 复制键的函数
    void *(*keyDup)(void *privdata, const void *key);
    // 复制值的函数
    void *(*valDup)(void *privdata, const void *obj);
    // 对比键的函数
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);
    // 销毁键的函数
    void (*keyDestructor)(void *privdata, void *key);
    // 销毁值的函数
    void (*valDestructor)(void *privdata, void *obj);
} dictType;
```

`ht` 属性是一个包含两个项的数组，数组中的每个项都是一个 `dictht` 哈希表，一般情况下，字典只使用 `ht[0]` 哈希表，`ht[1]` 哈希表只会在对 `ht[0]` 哈希表进行 rehash 时使用。

除了 `ht[1]` 之外，另一个和 rehash 有关的属性就是 `rehashidx` ：它记录了 rehash 目前的进度，如果目前没有在进行 rehash ，那么它的值为 `-1` 。

图 4-3 展示了一个普通状态下（没有进行 rehash）的字典：

![字典的实现 - 图3](/assets/images/eac62f3b0d93e90dd8f19789d013c1ec.png)

## 哈希算法

当要将一个新的键值对添加到字典里面时，程序需要先根据键值对的键计算出哈希值和索引值，然后再根据索引值，将包含新键值对的哈希表节点放到哈希表数组的指定索引上面。

Redis 计算哈希值和索引值的方法如下：

```java
# 使用字典设置的哈希函数，计算键 key 的哈希值
hash = dict->type->hashFunction(key);
 
# 使用哈希表的 sizemask 属性和哈希值，计算出索引值
# 根据情况不同， ht[x] 可以是 ht[0] 或者 ht[1]
index = hash & dict->ht[x].sizemask;
```

![哈希算法 - 图1](/assets/images/108cd6b414ab2dbb30126c0fb0700e23.png)

举个例子，对于图 4-4 所示的字典来说，如果我们要将一个键值对 `k0` 和 `v0` 添加到字典里面，那么程序会先使用语句：

```java
hash = dict->type->hashFunction(k0);
```

计算键 `k0` 的哈希值。

假设计算得出的哈希值为 `8` ，那么程序会继续使用语句：

```java
index = hash & dict->ht[0].sizemask = 8 & 3 = 0;
```

计算出键 k0 的索引值 0 ，这表示包含键值对 k0 和 v0 的节点应该被放置到哈希表数组的索引 0 位置上，如图 4-5 所示。

![哈希算法 - 图2](/assets/images/b126a2a46dcd9ec3380c1b5bd4992bb3.png)

当字典被用作数据库的底层实现，或者哈希键的底层实现时，Redis 使用 MurmurHash2 算法来计算键的哈希值。

MurmurHash 算法最初由 Austin Appleby 于 2008 年发明，这种算法的优点在于，即使输入的键是有规律的，算法仍能给出一个很好的随机分布性，并且算法的计算速度也非常快。

MurmurHash 算法目前的最新版本为 MurmurHash3 ，而 Redis 使用的是 MurmurHash2 ，关于 MurmurHash 算法的更多信息可以参考该算法的主页：http://code.google.com/p/smhasher/ 。

