---
title: HiveQL视图
author: ztq
tag:

  - hive
category:
  - 大数据
date: 2020-01-20 16:27:00

---

		视图可以允许保存一个查询（并）像对待表一样对这个查询进行操作。（这是一个逻辑结构，因为它不像一个表会存储数据。

# 一、使用视图来降低查询复杂度

	当查询长且复杂，通过使用视图将这个查询语句分割成多个小的、更可控的片段可以降低这种复杂度。

例如：

改进前：Hive 查询语句中含有多层嵌套

```java
FROM(
	SELECT * FROM people JOIN cart ON (cart.people_id=people.id) WHERE firstname='john'
) a SELECT a.lastname WHERE a.id=3;
```

改进后：利用视图进行查询

```java
CREATE VIEW shorter_join AS SELECT * FROM people JOIN cart ON (cart.people_id=people.id) WHERE firstname='john'
// 这样就可以像操作表一样来操作这个视图了，简化了查询语句
SELECT lastname FROM shorter_join WHERE id=3;
```

# 二、使用视图来限制基于条件过滤的数据

		基于一个 或者 多个列的值 来限制 输出结果。可以通过创建视图来限制数据访问，可以用来保护信息不被随意查询：

```java
hive> CREATE TABLE userinfo(
	> firstname string, lastname string, ssn string, password string);

hive> CREATE VIEW safer_user_info AS
    > SELECT firstname, lastname FROM userinfo;
```

		Hive目前不支持的功能：有的数据库，允许将视图作为一个安全机制，也就是不给用户直接访问具有敏感数据的原始表，而是提供给用户一个通过WHERE子句限制了的视图，以供访问。Hive中用户必须能够访问整个底层的原始表的权限，视图才能工作。

# 三、 动态分区中的视图和 map 类型

		Hive 支持 array、map 和 struct 数据类型，这些数据类型在传统的数据库中并不常见，因为他们破坏了第一范式。

		Hive 可将一整行文本作为一个 map，加上视图功能，就允许用户可以基于同一个物理表构建多个逻辑表。

		视图如下：三个字段作为key, 视图名为 orders

```java
CREATE VIEW orders(state, city, part) AS SELECT cols["state"], cols["city"], cols["part"]
FROM dynamicatable WHERE cols["type"] = "request";
```

