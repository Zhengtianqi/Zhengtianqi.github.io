---
title: DNS
author: ztq
tag:
  - DNS
category:
  - 网络
date: 2020-07-21 15:57:00

---

# 1、介绍  

		在互联网中是用IP来标识一台服务器的。IP地址虽然能够代表一台设备，但是由于记忆起来比较困难，所以将其替换成一个能够理解和识别的名字，这个名字我们称作为域名。

		在域名后面会定义一个IP地址用来指向网站服务器。DNS负责域名到IP地址的对应。

		DNS 是域名系统(Domain Name System，缩写：DNS)是互联网的一项服务。它将域名和IP地址相互映射的一个分布式数据库，在数据库中保存域名与IP的对照关系，从而使人更方便地访问互联网。

		DNS解析是分布式存储的，从结构上来说最顶层是，根域名服务器(ROOT DNS Server)，存储260个顶级域名服务器的IP地址。对于Ipv4来说全球有13个根域名服务器，它储存了每个域(如.com .net .cn)的解析和域名服务器的地址信息。简单的说，根域名服务器就是存放顶级域名服务器地址的。

		在根域名服务器下一级就是，顶级域名服务器。例如.com的域名服务器，存储的是一些一级域名的权威DNS服务器地址(如toutiao.com的DNS)。

		顶级域名又称一级域名，顶级域名可以分为三类，即gTLD、ccTLD和New gTLD：

		gTLD：国际顶级域名(generic top-level domains，gTLD)，例如：.com/.net/.org等都属于gTLD;

		ccTLD：国家和地区顶级域名(country code top-level domains，简称ccTLD)，例如：中国是.cn域名，日本是.jp域名;

		New gTLD：新顶级域名(New gTLD)，例如：.xyz/.top/.red/.help等新顶级域名。

![image-20200721195559652](/assets/images/DNS1.png)

# 2、DNS解析原理

![image-20200721195702373](/assets/images/DNS2.png)



通过9步来诠释DNS解析过程：

（1）用户请求通过浏览器输入要访问网站的地址，例如：www.toutiao.com。浏览器会在自己的缓存中查找URL对应IP地址。如果之前访问过，保存了这个URL对应IP地址的缓存，那么就直接访问IP地址。如果没有缓存，进入到第2步。

（2）通过计算机本地的Host文件配置，可以设置URL和IP地址的映射关系。比如windows下是通过C:\windwos\system32\driver\etc\hosts文件来设置的，linux中则是/etc/named.confg文件。这里查找本地的Host文件，看是有IP地址的缓存。如果在文件中依旧没有找到映射关系，进入第3步

（3）请求Local DNS Server，通过本地运营商获取URL和IP的映射关系。如果在校园网，DNS服务器就在学校，如果是小区网络，DNS服务器是运营商提供的。总之这个服务器在物理位置上离发起请求的计算机比较近。Local DNS Server缓存了大量的DNS解析结果。由于它的性能较好，物理上的距离又比较近，它通常会在很短的时间内返回指定域名的解析结果。80%的DNS解析需求在这一步就满足了。如果在这一步还是没有完成DNS解析，进入第4步

（4）通过Root DNS Server进行解析，ROOT DNS Server会根据请求的URL 返回给Local DNS Server顶级域名服务器的地址。例如：查询的是”.com”的域名，就查询 gTL对应的域名服务器的地址

（5）返回顶级域名服务器的地址以后，访问对应的顶级域名服务器(gTLD、ccTLD、New gTLD)，并且返回Name Server服务器地址。这个Name Server就是网站注册的域名服务器，上面包含了网站URL和IP的对应信息。例如你在某个域名服务提供商申请的域名，这个域名就由他们的服务器来解析。这个Name Server是由域名提供商维护的

（6）Name Server会把指定域名的A记录或者CNAME返回给Local DNS Server，并且设置一个TTL

- A (Address) 记录是用来指定主机名(或域名)对应的IP地址记录。用户可以将该域名下的网站服务器指向到自己的web server上。同时也可以设置您域名的二级域名。
- CNAME：别名记录。这种记录允许您将多个名字映射到另外一个域名。通常用于同时提供WWW和MAIL服务的计算机。例如，有一台计算机名为“host.mydomain.com”(A记录)。它同时提供WWW和MAIL服务，为了便于用户访问服务。服务商从方便维护的角度，一般也建议用户使用CNAME记录绑定域名的。如果主机使用了双线IP，显然使用CNAME也要方便一些。
- TTL(Time To Live)：也就是设置这个DNS解析在Local DNS Server上面的过期时间。超过了这个过期时间，URL和IP的映射就会被删除，需要获取还要请求Name Server

（7）如果此时获取的是A记录，那么就可以直接访问网站的IP了。但是通常来说大型的网站都会返回CNAME，然后将其传给GTM Server

		GTM(Global Traffic Manager的简写)即全局流量管理，基于网宿智能DNS、分布式监控体系，实现实时故障切换及全球负载均衡，保障应用服务的持续高可用性。传给GTM的目的就是希望通过GTM的负载均衡机制，帮助用户找到最适合自己的服务器IP。

		也就是离自己最近，性能最好，服务器状态最健康的。而且大多数的网站会做CDN缓存，此时就更需要使用GTM帮你找到网络节点中适合你的CDN缓存服务器。

（8）找到CDN缓存服务器以后，可以直接从服务器上面获取一些静态资源，例如：HTML、CSS、JS和图片。但是一些动态资源，例如商品信息，订单信息，需要通过第9步

（9）对于没有缓存的动态资源需要从应用服务器获取，在应用服务器与互联网之间通常有一层负载均衡器负责反向代理。有它路由到应用服务器上







借鉴于：https://network.51cto.com/art/202003/613009.htm 

作者：崔皓来源：[51CTO技术栈](https://www.toutiao.com/i6807234747488535054/)|2020-03-23 15:08
