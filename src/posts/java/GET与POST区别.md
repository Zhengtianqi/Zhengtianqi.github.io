---
title: GET与POST区别
author: 郑天祺
tag:
  - GET/POST
category:
  - 网络
date: 2020-07-21 08:29:00

---

# 1、介绍

​		最常用的利用GET和POST请求后端数据。GET和POST是HTTP与服务器交互的方式，交互方式还有DELETE、PUT、HEAD、OPTIONS、CONNECT等。

​	先看看GET和POST的样貌：

## GET请求

```java
GET /empty_project/inde.jsp HTTP/1.1
  Host: localhost:8088
  Connection: keep-alive
  Upgrade-Insecure-Requests: 1
  User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko)       Chrome/55.0.2883.87 Safari/537.36
  Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
  Accept-Encoding: gzip, deflate, sdch, br
  Accept-Language: zh-CN,zh;q=0.8
  Cookie: pgv_pvi=4403687424
```

Accept 浏览器支持的类型
Accept-Language 浏览器支持的语言
Accept-Encoding 浏览器支持的压缩格式
Host 请求的主机
Connection keep-alive 这个是链接一小段时间

## GET响应

```java
HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Set-Cookie: JSESSIONID=F463F5132A34573215C941893534BF26; Path=/empty_project; HttpOnly
Content-Type: text/html;charset=utf-8
Content-Length: 196
Date: Mon, 02 Jan 2017 08:52:48 GMT
```

响应行 (协议/版本 状态码 状态码解析)

响应头 （key/value格式）

空行

响应正文

## POST请求

```java
POST /index.jsp HTTP/1.1
Host: localhost:8088
Connection: keep-alive
Content-Length: 35
Cache-Control: max-age=0
Origin: http://localhost:8088
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36
Content-Type: application/x-www-form-urlencoded
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Referer: http://localhost:8088/login.html
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.8
Cookie: pgv_pvi=4403687424

username=username&password=password
```

Content-Type 使用application/x-www-form-urlencoded

转化为字节 -- 加上128 -- 转化为16进制 -- 添加%

## POST响应

```java
POST /index.jsp HTTP/1.1
Host: localhost:8088
Connection: keep-alive
Content-Length: 252
Cache-Control: max-age=0
Origin: http://localhost:8088
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36
Content-Type: multipart/form-data; boundary=----WebKitFormBoundarySN8ehdkx6tF3Ngiq
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Referer: http://localhost:8088/login.html
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.8
Cookie: pgv_pvi=4403687424; JSESSIONID=061657A0C03921CB478ACB889502C93A

------WebKitFormBoundarySN8ehdkx6tF3Ngiq
Content-Disposition: form-data; name="username"

sdfdsf
------WebKitFormBoundarySN8ehdkx6tF3Ngiq
Content-Disposition: form-data; name="password"

sdfdsfsdfdsf
------WebKitFormBoundarySN8ehdkx6tF3Ngiq--
```

# 2、W3C表格对比

![image-20200721091103941](/assets/images/GETPOST.png)

## （1）表格对比：

​		GET 用于获取信息，是无副作用的，是幂等的，且可缓存
​		POST 用于修改服务器上的数据，有副作用，非幂等，不可缓存

​		幂等性：是指无论调用多少次都不会有不同结果的一种特性，一般是指HTTP GET的查询方法。

## （2）交互对比

​		GET产生一个TCP数据包，POST产生两个TCP数据包：

​		对于GET方式的请求，游览器会把http header和data一并发送出去，服务器响应200（返回数据）

​		对于POST请求。游览器先发送header，服务器响应100 continue，游览器再发送data，服务器响应200 ok（返回数据）3、

# 3、面试问题

## （1）GET方法的参数写法是固定的吗？

​		一般约定中我们都是把参数写在?后边，用&分割

​		但是我们知道，解析报文的过程是通过获取 TCP 数据，用正则等工具从数据中获取 Header 和 Body，从而提取参数。

​		比如header请求头中添加token，来验证用户是否登录等权限问题。

​		也就是说，我们可以自己约定参数的写法，只要服务端能够解释出来就行，万变不离其宗。

## （2）GET 方法的长度限制是怎么回事？

​		网络上都会提到浏览器地址栏输入的参数是有限的。

​		首先说明一点，HTTP 协议没有 Body 和 URL 的长度限制，对 URL 限制的大多是浏览器和服务器的原因。

​		浏览器原因就不说了，服务器是因为处理长 URL 要消耗比较多的资源，为了性能和安全（防止恶意构造长 URL 来攻击）考虑，会给 URL 长度加限制。

## （3）POST 方法比 GET 方法安全？

​		有人说POST 比 GET 安全，因为数据在地址栏上不可见。

​		然而，从传输的角度来说，他们都是不安全的，因为 HTTP 在网络上是明文传输的，只要在网络节点上捉包，就能完整地获取数据报文。（个人发现某60和某讯电脑管家，会将GET和POST请求数据包完整的上传到他们的服务器，解析后你提交的信息就会被破解。类似于中间人攻击也会导致泄露，不安全）

​		要想安全传输，就只有利用非对称加密，也就是 HTTPS。

参考：http://www.javanx.cn/20190227/get-post/

## （4）POST 方法会产生两个 TCP 数据包？

​		上述文章中提到，post 会将 header 和 body 分开发送，先发送 header，服务端返回 100 状态码再发送 body。

​		HTTP 协议中没有明确说明 POST 会产生两个 TCP 数据包，而且实际测试(Chrome)发现，header 和 body 不会分开发送。

​		所以，header 和 body 分开发送是部分浏览器或框架的请求方法，不属于 post 必然行为。