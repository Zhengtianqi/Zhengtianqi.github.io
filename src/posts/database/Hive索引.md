---
title: Hive索引
author: ztq
tag:

  - hive
category:
  - 大数据
date: 2020-01-21 10:59:00

---

		Hive没有键的概念，可以对一些字段建立索引来加速某些操作，一张表的索引储存在另外一张表中。EXPLAIN命令可以查看某个查询语句是否用到了索引。

# 一、建索引语法

```java
// 定义表
CREATE TABLE employees(
name STRING,
salary FLOAT,
subordinates ARRAY<STRING>,
deductions MAP<STRING, FLOAT>,
address STRUCT<street:STRING, city:STRING, state:STRING, zip:INT>
)
PARTITIONED BY (country STRING, state STRING); // 分区：hdfs://xxx/2020/02/20/xx

// 建立索引,仅对字段country建立索引 
CREATE INDEX employees_index
ON TABLE employees(country)
// AS ... 指定索引处理器
AS 'org.apache.hadoop.hive.ql.index.compact.CompactIndexHandler'
WITH DEFERRED REBUILD
IDXPROPERTIES('creator' = 'me', 'created_at' = 'some_time')
IN TABLE employees_index_table
PARTITIONED BY (country, name)
COMMENT 'Employees indexed by country and name.'
```

Bitmap索引：适用于排重后值较少的列。

# 二、重建索引

		如果用户指定了 DEFERRED REBUILD，那么新索引将呈现空白状态。在任何时候，都可以进行第一次索引创建或者使用 ALTER INDEX 对索引进行重建：

```java
ALTER INDEX employees_index
ON TABLE employees
// 如果省略掉 PARTITION ，那么将会对所有分区进行重建索引
PARTITION (country = 'US')
REBUILD;
```

# 三、显示索引

```java
// 显示这个表中的所建立的索引
SHOW FORMATTED INDEX ON employees;
```

# 四、删除索引

```java
// 如果有索引表的话，删除一个索引将会删除这个索引表
// 不允许DROP TABLE前DROP INDEX
DROP INDEX IF EXISTS employees_index ON TABLE employees;
```

