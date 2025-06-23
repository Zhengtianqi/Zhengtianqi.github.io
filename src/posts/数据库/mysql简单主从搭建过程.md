---
title: mysql简单主从搭建过程
author: ztq
tag:

  - mysql
category:
  - 数据库
date: 2022-04-11 23:32:00

---

# 一、mysql集群介绍

[MySql集群简介-告诉你为什么要用集群部署 - 掘金 (juejin.cn)](https://juejin.cn/post/6985187754493607966)

[mysql高可用集群方案 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/102798762)

[MYSQL集群简介及对比 - 掘金 (juejin.cn)](https://juejin.cn/post/7027910561459503141)

[mysql八大集群架构的优点和缺点总结](https://www.yisu.com/zixun/527196.html)

# 二、mysql安装（一主一从）

一台作为主服务器，一台作为从服务器，主服务器进行写操作，从服务器进行读操作。

所有机器

## step1、删除自带mariadb

```java
rpm -qa | grep mariadb
rpm -e --nodeps mariadb-libs-5.5.60-1.el7_5.x86_64
```

## step2、安装mysql

```java
cd /data/environment
tar -xvf mysql-5.7.37-1.el7.x86_64.rpm-bundle.tar
rpm -ivh mysql-community-common-5.7.37-1.el7.x86_64.rpm
rpm -ivh mysql-community-libs-5.7.37-1.el7.x86_64.rpm
rpm -ivh mysql-community-client-5.7.37-1.el7.x86_64.rpm
rpm -ivh mysql-community-server-5.7.37-1.el7.x86_64.rpm
```

## step3、启动并创建用户

```java
systemctl start mysqld
systemctl enable mysqld

cat /var/log/mysqld.log | grep password
mysql -u root -p
use mysql;
alter user 'root'@'localhost' identified by 'zheng&test123';
select host from user where user='root';
update user set host = '%' where user ='root';
flush privileges;
exit;
```

## step4、my.cnf配置



```java
vim /etc/my.cnf
主配置
server-id=1
log-bin=mysql-bin
log-slave-updates=1
binlog-do-db=repl  #需要同步的数据库,如果没有本行表示同步所有的数据库
binlog-ignore-db=mysql  #被忽略的数据

从配置
server-id=2
log-bin= mysql-bin
relay-log= mysql-relay-bin
read-only=1 #设置为只读
log-slave-updates=1 #实现级联复制需要，即把relay-log中的同步到bin-log中
replicate-do-db=repl #要同步的数据库,不写本行表示同步所有数据库
    
```

## step5、slave启动

```java
mysql -u root -p

CHANGE MASTER TO
MASTER_HOST='192.168.2.145',
MASTER_USER='master',
MASTER_PASSWORD='zheng&test123',
MASTER_PORT=3306,
MASTER_LOG_FILE='mysql-bin.000001',
MASTER_LOG_POS=120;
```

step6、启动是否成功

```java
mysql -u root -p

show slave status \G;
```
