---
title: Hive模式设计
author: 郑天祺
tag:

  - hive
category:
  - 大数据
date: 2020-01-21 14:09:00

---

# 一、分区

Hive 中分区的功能是非常有用的。因为通常要对输入进行全盘扫描，来满足查询条件。

如：存储日志，log_2020_01_01、log_2020_01_02等

```java
hive> CREATE TABLE 

hive> CREATE TABLE log_2020_01_01 (id int, part string, quantity int);
hive> CREATE TABLE log_2020_01_02 (id int, part string, quantity int);
hive> CREATE TABLE log_2020_01_04 (id int, part string, quantity int);

hive> SELECT part,quantity log_2020_01_01
    > UNION ALL
    > SELECT part,quantity from log_2020_01_04
    > WHERE quantity < 4;
```

Hive 通过 WHERE 子句中表达式来选择查询所需要的指定的分区。这样效率高且清晰明了：

```java
hive> CREATE TABLE supply(id int, part string, quantity int) 
    > PARTITIONED BY(int day);

hive> ALTER TABLE supply add PARTITION (day=20200201)
hive> ALTER TABLE supply add PARTITION (day=20200202)
hive> ALTER TABLE supply add PARTITION (day=20200203)
hive> ...load data...
hive> SELECT part,quantity FROM supply WHERE day>=20200201 AND day<20200203 AND quantity<4;
```

但是不要存储太多的分区和文件夹目录，并且每一个文件要足够大。应该是文件系统中块的若干倍。

## 二、同一份数据多种处理

```java
hive> INSERT OVERWRITE TABLE sales
    > SELECT * FROM history WHERE action='purchased'
hive> INSERT OVERWRITE TABLE credits
    > SELECT * FROM history WHERE action='returned'
// 可以优化上边两边编程下边，而且可以提高扫描速度，扫描一次
hive> FROM history
    > INSERT OVERWRITE sales SELECT * WHERE action='phrchased'
    > INSERT OVERWRITE credits SELECT * WHERE action='returned';
```

# 三、对于每个表的分区

​		ELT 处理过程会涉及到多个处理步骤，每个步骤可能会产生一到多个临时表，这些表仅供下一个job使用。

​		问题：由于查询或原始数据处理的某个步骤出现问题而导致需要对好几天的输入数据重跑 ETL 过程。这时用户可能就需要执行那些一天执行一次的处理过程，来保证在所有的任务都完成之前不会有 job 将临时表覆盖重写。

```java
// 如：有中间表distinct_ip_in_logs
hive> INSERT OVERWRITE table distinct_ip_in_logs 
    > SELECT distict(ip) as ip from weblogs
    > WHERE hit_date='${hiveconf:dt}';

hive> CREATE TABLE state_city_for_day (state string, city, string);

hive> INSERT OVERWRITE state_city_for_day
    > SELECT distinct(state, city) FROM distinct_ip_in_logs
    > JOIN geodata ON (distinct_ip_in_logs.ip=geodata.ip);
```

​		当计算某一天的数据时会导致前一天数据被 INSERT OVERWRITE 语句覆盖掉。

​		如果同时运行两个这样的实例，处理不同日期的数据的话，那么它们就可能会相互影响对方的结果数据。

​		改进方法, 建立分区：

```java
hive -hiveconf dt=2020-01-01
    
hive> INSERT OVERWRITE table distinct_ip_in_logs
    > PARTITION(hit_date=${dt})
    > SELECT distinct(ip) as ip from weblogs
    > WHERE hit_date='${hiveconf:dt}'

hive> CREATE TABLE state_city_for_day(state string,city string)
    > PARTITIION BY (hit_date string)
    
hive> INSERT OVERWRITE table state_city_for_day PARTITION(${hiveconf:dt})
    > SELECT distinct(state,city) FROM distinct_ip_in_logs
    > JOIN geodata ON (distinct_ip_in_logs.ip=geodata.ip)
    > WHERE (hit_date='${hiveconf:dt}')
```

# 四、分桶表数据存储

​		分区提供一个数据隔离和优化查询的遍历的方式。不过，并非所有的数据集都可形成合理的分区。

​		分桶是将数据集分解成更统一管理的若干部分的另一个技术。利用哈希分发到不同的桶中。

```java
// 分区：如果根据user_id分区，会创建太多分区
hive> CREATE TABLE weblog (url STRING, source_ip STRING)>PARTITIONED BY (dt STRING, user_id INT);

hive> FROM raw_weblog
    > INSERT OVERWRITE TABLE page_view PARTITION(dt='2020-06-08', user_id)
    > SELECT server_name, url, source_ip, dt, user_id;

// 分桶：用户数比桶数多，每个桶就会有多个用户的记录
hive> CREATE TABLE weblog (user_id INT, url STRING, source_ip STRING)
    > PARTITIONED BY (dt STRING)
    > CLUSTERED BY (user_id) INTO 96 BUCKETS;

// 此属性强制hive为目标表初始化过程设置一个正确的 reducer 个数。
hive> SET hive.enforce.bucketing=true;
hive> FROM raw_logs
    > INSERT OVERWRITE TABLE weblog
    > PARTITION (dt='2020-02-25')
    > SELECT user_id, url, source_ip WHERE dt = '2020-02-25'
```

# 五、为表增加列

```java
hive> CREATE TABLE weblogs  (version LONG, url STRING)
    > PARTITIONED BY (hit_date int)
    > ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t';

hive> ! cat log1.txt
1 /mystuff
1 /toys
    
hive> LOAD DATA LOCAL INPATH 'log1.txt' int weblogs partition(20200101);
hive> SELECT * FROM weblogs;
1 /mystuff 20200101
1 /toys 20200101
    
// 加新字段
hive> ! cat log2.txt
2 /cars bob
2 /stuff terrys
    
hive> ALTER TABLE weblogs ADD COLUMNS (user_id string);
hive> LOAD DATA LOCAL INPATH 'log2.txt' int weblogs partition(20200101);
hive> SELECT * from weblogs
1 /mystuff 20200101 NULL
2 /toys    20200101 NULL
3 /cars    20200102 bob
4 /stuff   20200102 terry
```

