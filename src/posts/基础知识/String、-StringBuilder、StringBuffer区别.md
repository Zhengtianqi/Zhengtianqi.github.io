---
title: String、 StringBuilder、StringBuffer区别
author: ztq
tag:
  - String
  - StringBuilder
  - StringBuffer
category:
  - java基础
date: 2020-07-21 15:43:00

---

# 1、介绍

## （1）运行速度

		StringBuilder > StringBuffer > String
		String为字符串常量，而StringBuilder和StringBuffer均为字符串变量，即String对象一旦创建之后该对象是不可更改的，但后两者的对象是变量，是可以更改的。

		因为String修改其实是new了一个新对象，原来的String被JVM的垃圾回收机制（GC）给回收掉了。

![image-20200721154908228](/assets/images/StringUpdate.png)

		Java中对String对象进行的操作实际上是一个不断创建新的对象并且将旧的对象回收的一个过程，所以执行速度很慢。

## （2）线程安全

　　StringBuffer对方法加了同步锁或者对调用的方法加了同步锁，所以是线程安全的

## （3）继承关系

![image-20200721155019047](/assets/images/StringStringBuilderStringBuffer.png)

# 2、对比

![image-20200721154514018](/assets/images/StringBuilder.png)



参考：https://blog.csdn.net/itchuxuezhe_yang/article/details/89966303