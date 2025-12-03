---
title: TCP IP四层网络模型
author: zheng
tag:
  - TCP/IP
category:
  - 网络
date: 2019-08-30 15:12:00

---

## 1、用户发送请求

![](/assets/images/TCPIP用户发送请求.png)

## 2、服务器接收请求

![](/assets/images/TCPIP服务器接收请求.png)

## 3、网络连接模型

（《网络是怎么连接的》课本翻译）

![](/assets/images/网络连接模型.png)

## 4、使用协议进行通讯

	socket是一种抽象层，应用程序通过它来发送和接收数据，就像应用程序打开一个文件句柄，把数据读写到磁盘上一样。主要的socket类型为：
	1.流套接字（stream socket）-TCP
	2.数据报文套接字（datagram socket）-UDP

![](/assets/images/使用协议进行通讯.png)

## 5、Socket通讯模型

![](/assets/images/Socket通讯模型.png)

6、TCP协议的通信过程

	对于TCP通信来说，每个TCPSocket的内核中都有一个发送缓冲区和一个接收缓冲区，TCP的全双工的工作模式及TCP的滑动窗口就是依赖于这两个独立的Buffer和该Buffer的填充状态。

![](/assets/images/TCP协议通讯过程.png)

![](/assets/images/TCP协议通讯过程1.png)

![](/assets/images/TCP协议通讯过程2.png)