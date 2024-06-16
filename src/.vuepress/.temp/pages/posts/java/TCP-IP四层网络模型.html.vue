<template><div><h2 id="_1、用户发送请求" tabindex="-1"><a class="header-anchor" href="#_1、用户发送请求" aria-hidden="true">#</a> 1、用户发送请求</h2>
<figure><img src="/assets/images/TCPIP用户发送请求.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_2、服务器接收请求" tabindex="-1"><a class="header-anchor" href="#_2、服务器接收请求" aria-hidden="true">#</a> 2、服务器接收请求</h2>
<figure><img src="/assets/images/TCPIP服务器接收请求.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_3、网络连接模型" tabindex="-1"><a class="header-anchor" href="#_3、网络连接模型" aria-hidden="true">#</a> 3、网络连接模型</h2>
<p>（《网络是怎么连接的》课本翻译）</p>
<figure><img src="/assets/images/网络连接模型.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_4、使用协议进行通讯" tabindex="-1"><a class="header-anchor" href="#_4、使用协议进行通讯" aria-hidden="true">#</a> 4、使用协议进行通讯</h2>
<p>​	socket是一种抽象层，应用程序通过它来发送和接收数据，就像应用程序打开一个文件句柄，把数据读写到磁盘上一样。主要的socket类型为：<br>
​	1.流套接字（stream socket）-TCP<br>
​	2.数据报文套接字（datagram socket）-UDP</p>
<figure><img src="/assets/images/使用协议进行通讯.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_5、socket通讯模型" tabindex="-1"><a class="header-anchor" href="#_5、socket通讯模型" aria-hidden="true">#</a> 5、Socket通讯模型</h2>
<figure><img src="/assets/images/Socket通讯模型.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<p>6、TCP协议的通信过程</p>
<p>​	对于TCP通信来说，每个TCPSocket的内核中都有一个发送缓冲区和一个接收缓冲区，TCP的全双工的工作模式及TCP的滑动窗口就是依赖于这两个独立的Buffer和该Buffer的填充状态。</p>
<figure><img src="/assets/images/TCP协议通讯过程.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<figure><img src="/assets/images/TCP协议通讯过程1.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<figure><img src="/assets/images/TCP协议通讯过程2.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
</div></template>


