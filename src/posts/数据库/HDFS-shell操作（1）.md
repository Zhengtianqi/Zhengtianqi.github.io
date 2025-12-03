---
title: HDFS shell操作（1）
author: zheng
tag:
  - hadoop
category:
  - 大数据
date: 2020-12-06 11:50:00
---

## 1、创建一个HDFS目录

命令：hdfs dfs -mkdir -p /usr/local/hadoop/data/txtdir

截图：![image-20201206115218466](/assets/images/hdfs创建文件夹.png)

## 2、本地文件上传到HDFS

本地创建文件a.txt,b.txt,c.txt上传到HDFS /usr/local/hadoop/data/txtdir

命令：echo “I am student” > a.txt

       echo “I am teacher” > c.txt

       echo “I like hadoop” > b.txt

       hdfs dfs -put a.txt /usr/local/hadoop/data/txtdir

       hdfs dfs -copyFromLocal b.txt /usr/local/hadoop/data/txtdir

       hdfs dfs -moveFromLocal c.txt /usr/local/hadoop/data/txtdir

截图：![image-20201206115351845](/assets/images/HDFS上传.png)

## 3、查看/usr/local/hadoop/data/txtdir目录结构

命令：hdfs dfs -ls -R /usr/local/hadoop/data/txtdir

截图：

![image-20201206115459406](/assets/images/image-20201206115459406.png)

## 4、查看HDFS上/usr/local/hadoop/data/txtdir下的文件内容

命令：hdfs dfs -cat /usr/local/hadoop/data/txtdir/a.txt

       hdfs dfs -cat /usr/local/hadoop/data/txtdir/b.txt

       hdfs dfs -cat /usr/local/hadoop/data/txtdir/c.txt

截图：![image-20201206115600801](/assets/images/image-20201206115600801.png)

## 5、合并本地多个小文件上传到HDFS

命令：hdfs dfs -appendToFile a.txt b.txt /usr/local/hadoop/data/txtdir/merges.txt

截图：![image-20201206115653987](/assets/images/image-20201206115653987.png)

## 6、 下载a.txt到本地文件系统

命令：hdfs dfs -get /usr/local/hadoop/data/txtdir/a.txt

截图：![image-20201206115738831](/assets/images/image-20201206115738831.png)

## 7、删除HDFS上的/usr/local/hadoop/data/txtdir

命令：hdfs dfs -rm -r /usr/local/hadoop/data/txtdir/

截图：![image-20201206115832025](/assets/images/image-20201206115832025.png)