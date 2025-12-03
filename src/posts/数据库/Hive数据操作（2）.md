---
title: Hive数据操作（2）
author: zheng
tag:

  - hive
category:
  - 大数据
date: 2020-01-19 15:50:00

---

Hive 中 SQL  JOIN 语句，只支持等值连接

# 一、INNER JOIN

	内连接（INNER JOIN）中，只有进行连接的两个表中都存在于连接标准相匹配的数据才会被保留下来。不支持 >= 等不相等匹配、ON子句中谓词之间不能使用OR。

```java
// 苹果公司股价 AAPL   IBM股价IBM
// ON子句指定了两个表间数据进行连接的条件
// WHERE子句限制了左边表是AAPL的记录，右边表是IBM的记录

hive> SELECT a.ymd, a.price_close, b.price_close
	>FROM stocks a JOIN stocks b ON a.ymd = b.ymd 
	>WHERE a.symbol = 'AAPL' AND b.symbol = 'IBM';

2010-01-04  214.01  132.45
2010-01-05  214.38  130.85
...
```

大多数情况下，Hive会对每对 JOIN 连接对象启动一个 MapReduce 任务。

		Hive同时假定查询中最后一个表是对打的那个表。在对每行记录进行连接操作时，它会尝试将其他表缓存起来，然后扫描最后那个表进行计算。

		所以优化JOIN的时候，将小表放在前边，大表放到后边。

```java
... 小表 JOIN 大表 ON ...
```

# 二、LEFT OUTER JOIN

		用法和 INNER JOIN 一致，但是这种操作，会返回左侧表所有的记录，当右边表根据连接条件没有对应的记录时，那么右表响应的列的值是NULL

```java
... 全部数据表 LEFT OUTER JOIN 对应条件的表 ON ...
```

# 三、RIGHT OUTER JOIN

		用法和 INNER JOIN 一致，右外连接（RIGHT OUTER JOIN）会返回右边表所有符合WHERE语句的记录。左表中匹配不上的字段值用NULL代替。

# 四、FULL OUTER JOIN

		最后介绍的完全外连接（FULL OUTER JOIN）将会返回所有表中符合 WHERE 语句条件的所有记录。

		如果任一表的指定字段没有符合条件的值的话，那么就使用 NULL 值代替。

```java
hive>SELECT s.ymd, s.symbol, s.price_close, d.divided
	>FROM dividends d FULL OUTER JOIN stocks s ON d.ymd = s.ymd AND d.symbol = s.symbol
	>WHERE s.symbol = 'AAPL';

...
1987-05-07 AAPL 80.25 NULL
1987-05-08 AAPL 97.0 NULL
1987-05-11 AAPL 77.0 0.015
...
```

# 五、LEFT SEMI-JOIN

		左开半连接（LEFT SEMI-JOIN）会返回左边表的记录，前提是其记录对于右表满足 ON 语句中的判定条件。

		这个子句的出现是为了解决 IN ... EXISTS结构的。

```java
// 因为 Hive 不支持以下查询：
SELECT s.ymd, s.symbol, s.price_close FROM stocks s WHERE s.ymd, s.symbol IN(SELECT d.yml, d.symbol FROM dividends d);

// 所以利用 LEFT SEMI JOIN
// SELECT 和 WHERE 语句中不能引用到右边表中的字段
hive> SELECT s.yml, s.symbol, s.price_close
    > FROM stocks s LEFT SEMI JOIN dividends d ON s.ymd = d.ymd AND s.symbol = d.symbol;

...
1962-11-05  IBM   361.5
1962-08-07	IBM   373.25
1962-05-08  IBM   459.5
1962-02-06  IBM   551.5
```

		注：SEMI-JOIN 比通常的 INNER JOIN 要更加高效：对于左表的一条指定的记录，在右边表中一旦找到匹配的记录，Hive 就会立即停止扫描。从这点来看，左边表中选择的列是可以预测的。

# 六、map-side JOIN

		如果所有表中只有一张表是小表，那么可以在最大的表通过 mapper 的时候将小表完全放到内存中。

		Hive 可以在 map 段执行连接过程（称为 map-side JOIN），这是因为 Hive 可以和内存中的小表进行逐一匹配，从而省略掉常规连接操作所需要的 reduce 过程。即使对于很小的数据集，这个优化也明显地要快于常规的连接操作：不仅减少了 reduce 过程，而且有时还可以同时减少 map 过程的执行步骤。

```java
// 当设置了以下的属性，内连接也可以使用这个优化(hive v0.7+) 
// 但是右外连接（RIGHT OUTER JOIN）和全外连接（FULL OUTER JOIN）不支持此优化
hive>set hive.auto.convert.join=true

hive> SELECT s.ymd, s.symbol, s.price_close, d.dividend
    > FROM stocks s JOIN dividends d ON s.ymd = d.ymd AND s.symbol = d.symbol 	  > WHERE s.symbol = 'AAPL';

// 属于小表的属性
hive.mapjoin.smalltable.filesize=25000000
```

类似的：

		表中的数据必须是按照 ON 语句中的键进行分桶的，而且其中一张表的分桶的个数必须是另一张表分桶个数的若干倍，当满足这些条件时：

		Hive 可以在 map 阶段按照分桶数据进行连接。因此这种情况下，不需要先获取到表中所有的内容，之后采取和另一张表中每个分桶进行匹配连接。

```java
// 默认没有开启
set hive.optimize.bucketmapJOIN=true
// 涉及的分桶表具有相同的分桶数，而且数据是按照 连接键 或 桶的键进行排序的
// 此时 Hive 可以执行一个更快的分类-合并连接（sort-merge JOIN）
// 默认没有开启
set hive.input.format=org.apache.hadoop.hive.ql.io.BucketizedHiveInputFormat;
set hive.optimize.bucketmapjoin=true;
set hive.optimize.bucketmapjoin.sortedmerge=true;
```

# 七、ORDER BY 和 SORT BY

		Hive 中 ORDER BY 语句和其他的 SQL 方言中的定义是一样的。会对查询结果集执行一个全局排序：所有数据都通过一个 reducer 进行处理的过程。对于大数据集，这个过程可能会消耗太漫长的时间来执行。（全局有序）

		Hive 增加了一个可供选择的方式，也就是 SORT BY，其只会在每个 reducer 中对数据进行排序，也就是执行一个局部排序过程。这可以保证每个 reducer 的输出数据都是有序的（但并非全局有序）。这样可以提高后面进行的全局排序的效率。（每个reducer有序）

		注：当只有一个reducer时上述结果相同；默认升序ASC  降序DESC；若hive.maperd.mode=strict 时，语句必须加 LIMIT

# 八、CLUSTER BY

```java
// CLUSTER BY = DISTRIBUTE BY ... SORT BY 语句。
// 此语句会剥夺 SORT BY 的并行性
hive> SELECT a.ymd, s.symbol, s.price_close
    > FROM stocks s CLUSTER BY s.symbol
    
2010-02-08 AAPL 194.12
2010-02-05 AAPL 195.46
2010-02-04 AAPL 192.05
...
2010-01-27 AAPL 207.88
...
```

