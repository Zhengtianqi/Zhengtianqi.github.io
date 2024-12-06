---
title: Hive数据定义
author: ztq
tag:
  - hive
category:
  - 大数据
date: 2020-01-17 14:18:00

---

# 一、Hive 与 Mysql不同

		Hive不支持行级插入操作、更新操作和删除操作，

		Hive不支持事务。	

# 二、Hive中的数据库

Hive 中数据库的概念本质上仅仅是表的一个目录或者命名空间。

```java
// 1、数据库目录为：
hive.metastore.warehouse.dir

// 2、创建数据库 ：
CREATE DATABASE financials;    

// 3、已经存在则： 
CREATE DATABASE IF NOT EXISTS financials;

// 4、查看数据库：
SHOW DATABASES;    SHOW DATABASES LIKE 'f.*';

// 5、修改默数据库位置：
CREATE DATABASE financials LOCATION '/my/preferred/directory';

// 6、切换工作数据库：
USE financials;

 (Hive v0.8.0，可以修改当前工作数据库为默认数据库，set hive.cli.print.current.db=true;)

// 7、删除数据库：
DROP DATABASE IF EXISTS financials;
```

	

```java
// 8、级联删除数据库（含表）：
DROP DATABASE IF EXISTS financials CASCADE;

// 9、可以使用  ALTER DATABASE 为数据库的 DBPROPERTIES 设置键-值对属性值，来描述数据库的属性信息，其他不可以更改：
ALTER DATABASES financials SET DBPROPERTIES('edited-by' = 'Joe Dba')
    
// 10、删除表
DROP TABLE IF EXISTS employees;

// 11、表重命名
ALTER TABLE log_messages RENAME TO logmsgs;

// 12、 对某个字段重命名，并修改位置、类型或者注释
ALTER TABLE log_messages
CHANGE COLUMN hms hours_minutes_seconds INT
COMMENT 'The hours, minutes, and seconds part of the timestamp'
AFTER severity;
// 13、增加列
ALTER TABLE log_messages ADD COLUMNS(
	app_name STRING COMMENT 'Application name',
    session_id LONG COMMENT 'The current session id'
);
// 14、删除或者替换列
ALTER TABLE log_messages REPLACE COLUMNS(
	hours_mins_secs INT COMMENT 'hour, minute, seconds from timestamp',
    severity STRING COMMENT 'The message severity'
    message STRING COMMENT 'The rest of the message'
);
// 15、修改表属性
ALTER TABLE log_messages SET TBLPROPERTIES(
	'notes' = 'The process id is no longer captured; this column is always NULL'
);
// 16、修改存储属性
ALTER TABLE log_messages PARTITION(year = 2012, month = 1, day =1) SET FILEFORMAT SEQUENCEFILE;
```



# 三、分区表、管理表

	数据分区：通常使用分区来水平分散压力，将数据从物理上转移到和使用最频繁的用户更近的地方，以及实现其他目的。

	先按照 国家 ， 后按照 州 分区

```java
CREATE TABLE employees(
	name	STRING,
	salary	FLOAT,
	subordinates	ARRAY<STRING>,
	deductions	MAP<STRING, FLOAT>,
	adress	STRUCT<street:STRING, city:STRING, state:STRING, zip:INT>
)
PARTITIONED BY (country STRING, state STRING)
```

分区表改变了 Hive 对数据存储的组织方式。

对比：

	（1）如果我们是在mydb数据库中创建的这个表，那么对于这个表只会有一个employees目录与之对应：

	

```java
hdfs://master_server/user/hive/warehouse/mydb.db/employees
```

	（2）但是，Hive 现在将会创建好可以反映分区结构的子目录。如：

```java
...
.../employees/country=CA/state=AB
.../employees/country=CA/state=BC
...
.../employees/country=US/state=AL
.../employees/country=US/state=AK
...
```

当我们查询美国伊利诺斯州所有雇员：

```java
SELECT * FROM employees WHERE country  = 'US' AND state = 'IL';
```

更快，所以分区显著的提高查询性能。

但是如果全查询数据非常大，会执行巨大的 MapReduce 任务。

建议将Hive设置为 “strict(严格)” 模式，如果没有WHERE过滤的话，会禁止提交这个任务：

```java
set hive.mapred.mode=strict
    
// SHOW PARTITIONS命令查看表中存在的所有分区：
SHOW PARTITION employees;

// 查看指定分区
SHOW PARTITIONS employees PARTITION(country='US')
SHOW PARTITIONS employees PARTITION(country='US', state='AK')
```

```java
// 日志文件
ALTER TABLE log_messages ADD PARTITION(year = 2012,month = 1,day = 2)
LOCATION 'hdfs://master_server/data/log_message/2012/01/02';
```

