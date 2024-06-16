---
title: Hive数据操作（3）
author: 郑天祺
tag:
  - hive
category:
  - 大数据
date: 2020-01-20 14:27:00
---

# 一、类型转换

​		（1）cast() 函数，可以使用这个函数对指定的值进行显式的类型转换。

例如：

```java
// 当salary字段的值是不合法的浮点数字符串的话，Hive会返回NULL
SELECT name, salary FROM employees WHERE cast(salary AS FLOAT) < 100000.0;
```

注：将浮点数转换成整数的推荐方式是round()或者floor()函数，而不是使用类型转换操作符cast

​		（2）类型转换 BINARY 值（hive v0.8.0）

```java
// 只支持将 BINARY 转换为 STRING 类型(也可以 STRING 转为 BINARY)
SELECT (2.0 * cast(cast(b string) as double)) from src;
```

# 二、抽样查询

​		对于非常大的数据集，有时用户需要使用的是一个具有代表性的查询结果而不是全部结果。Hive可以通过对表进行分桶抽样来满足这个需求。

例如：

```java
// 假设 numbers 表只有 number 字段，其值是 1 到 10
// 可以利用 rand() 函数进行抽样，这个函数会返回一个随机值。
// 以下的语句返回的值会不相同
hive> SELECT * from numbers TABLESAMPLE(BUCKET 3 OUT OF 10 ON rand()) s;
hive> SELECT * from numbers TABLESAMPLE(BUCKET 3 OUT OF 10 ON rand()) s;
hive> SELECT * from numbers TABLESAMPLE(BUCKET 3 OUT OF 10 ON rand()) s;

// 如果按照指定的列而不是rand()函数进行分桶，同一语句多次执行的返回值是相同的
hive> SELECT * from numbers TABLESAMPLE(BUCKET 3 OUT OF 10 ON number) s;
hive> SELECT * from numbers TABLESAMPLE(BUCKET 5 OUT OF 10 ON number) s;
hive> SELECT * from numbers TABLESAMPLE(BUCKET 3 OUT OF 10 ON number) s;   

// 分桶语句中的分母表示的是数据将会被散列的桶的个数?，而分子表示将会选择的桶的个数：
hive> SELECT * from numbers TABLESAMPLE(BUCKET 1 OUT OF 2 ON number) s;
hive> SELECT * from numbers TABLESAMPLE(BUCKET 2 OUT OF 2 ON number) s;
```

# 三、数据块抽样

​		Hive 提供了另一种按照抽样百分比进行抽样的方式，这种是基于行数的，按照输入路径下的数据块百分比进行抽样：

```java
hive> SELECT * from numbersflat TABLESAMPLE(0.1 * PERCENT) s;
```

注：这种抽样方式不一定适用于所有的文件格式。

# 四、UNION ALL

​		UNION ALL 可以将 2个或多个表进行合并。

​		每一个 union 子查询都必须具有相同的列，而且对应的每个字段的字段类型必须是一致的。