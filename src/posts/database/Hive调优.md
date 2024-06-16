---
title: Hive调优
author: 郑天祺
tag:

  - hive
category:
  - 大数据
date: 2020-01-21 16:48:00

---

# 一、使用EXPLAIN

​		查看逻辑，更多用 EXPLAIN EXTENDED

# 二、限制调整LIMIT

# 三、JOIN优化

​		表足够小用map-side JOIN

# 四、本地模式

​	对于小数据集，单机或单线程执行时间比较短

```java
hive> set oldjobtracker=${hiveconf.mapred.job.tracker};
hive> set mapred.job.tracker=local;
hive> set mapred.tmp.dir=/home/edward/tmp
hive> SELECT * from people WHERE firstname=bob;
hive> set mapred.job.tracker=${oldjobtracker};
```

# 五、并行执行

hive.exec.parallell=true

# 六、严格模式

hive.mapred.mode=strict

（1）必须有WHERE

（2）对于ORDER BY 的语句必须有LIMIT

（3）限制笛卡尔基的查询

# 七、调整mapper和reducer个数

# 八、JVM重用

# 九、索引

# 十、动态分区

# 十一、推测执行

# 十二、单个MapReducer中多个GROUP BY

# 十三、虚拟列