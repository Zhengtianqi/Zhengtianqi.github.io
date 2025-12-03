---
title: Tomcat性能优化整理
author: zheng
tag:

  - tomcat
category:
  - 面试
date: 2020-11-17 12:34:00

---

# 1、JVM参数调优

```java
-Xms<size>
```

表示JVM初始化堆的大小

```java
-Xmx<size>
```

表示JVM堆的最大值

		这两个值的大小一般根据需要进行设置。当应用程序需要的内存超出堆的最大值时虚拟机就会提示内存溢出，并且导致应用服务崩溃。因此一般建议堆的最大值设置为可用内存的最大值的80%。

		在catalina.bat中，设置JAVA_OPTS='-xms256m-Xmx512M‘，表示初始化内存为256 MB，可以使用的最大内存为512 MB。

# 2、禁用DNS查询

		当web应用程序向要记录客户端的信息时，它也会记录客户端的IP地址或者通过域名服务器查找机器名转换为IP地址。

		DNS查询需要占用网络，并且包括可能从很多很远的服务器或者不起作用的服务器上去获取对应的IP的过程，这样会消耗一定的时间。

		为了消除DNS查询对性能的影响我们可以关闭DNS查询，方式是修改server.xml文件中的enableLookups参数值。

# 3、调整线程数

		通过应用程序的连接器(Connector)进行性能控制的的参数是创建的处理请求的线程数。Tomcat 使用线程池加速响应速度来处理请求。

		在Java中线程是程序运行时的路径，是在一个程序中与其它控制线程无关的、能够独立运行的代码段。它们共享相同的地址空间。

		多线程帮助程序员写出CPU最大利用率的高效程序，使空闲时间保持最低，从而接更多的请求。

		Tomcat4中可以通过修改minProcessors和maxProcessors的值来控制线程数。这些值在安装后就已经设定为默认值并且是足够使用的，但是随着站点的扩容而改大这些值。

		minProcessors 服务器启动时创建的处理请求的线程数应该足够处理一个小量的负载。也就是说，如果一天内每秒仅发生5次单击事件，并且每个请求任务处理需要1秒钟，那么预先设置线程数为5就足够了。但在你的站点访问量较大时就需要设置更大的线程数，指定为参数maxProcessors的值。

		maxProcessors的值也是有上限的，应防止流量不可控制(或者恶意的服务攻击)，从而导致超出了虚拟机使用内存的大小。如果要加大并发连接数，应同时加大这两个参数。

		Web server 允许的最大连接数还受制于操作系统的内核参数设置，通常Windows是2000个左右，Linux是1000个左右。

在Tomcat5对这些参数进行了调整，请看下面属性:

		maxThreads Tomcat 使用线程来处理接收的每个请求。这个值表示Tomcat可创建的最大的线程数。
		acceptCount指定当所有可以使用的处理请求的线程数都被使用时，可以放到处理队列中的请求数，超过这个数的请求将不予处理。
		connnection Timeout网络连接超时，单位:毫秒。设置为0表示永不超时，这样设置有隐患的。通常可设置为30000毫秒。

		minSpareThreadsTomcat初始化时创建的线程数。
		maxSpareThreads一旦创建的线程超过这个值，Tomcat就会关闭不再需要的socket 线程。

		最好的方式是多设置几次并且进行测试，观察响应时间和内存使用情况。在不同的机器、操作系统或虚拟机组合的情况下可能会不同，而且并不是所有人的web站点的流量都是一样的，因此没有一刀切的方案来确定线程数的值。

# 4、加大Tomcat内存

		首先检查程序有没有限入死循环
		这个问题主要还是由这个问题 java.lang.0utOfMemoryError:Javaheap space引起的。

		第一次出现这样的的问题以后，引发了其他的问题。在网上—查可能是JAVA的堆栈设置太小的原因。

跟据网上的答案大致有这两种解决方法:

（1）设置环境变量
		解决方法:手动设置Heap size
		修改TOMCAT_HOME/bin/catalina.sh

		set JAVA_OPTS=-Xms32m-Xmx512m

		可以根据自己机器的内存进行更改。

（2）java-Xms32m-Xmx800m className
		就是在执行JAVA类文件时加上这个参数，其中className
是需要执行的确类名。(包括包名)这个解决问题了。而且执行的速度比没有设置的时候快很多。

		如果在测试的时候可能会用Eclispe这时候就需要在Eclipse->run-arguments中的VM arguments中输入-Xms32m-Xmx800m这个参数就可以了。

（3）java.lang.OutOfMemoryError: PermGen space
PermGen space的全称是Permanent Generation space ,是指内存的永久保存区域，这块内存主要是被JVM存放Class和Meta信息的,Class在被Loader时就会被放到PermGen space中,它和存放类实例(Instance)的Heap区域不同,GC(GarbageCollection)不会在主程序运行期对PermGen space进行清理，所以如果你的应用中有很多CLASS的话，就很可能出现PermGen space 错误。
解决方法:手动设置MaxPermSize大小修

（4）java.lang.OutOfMemoryError:Java heap space Heap size设置
		JVM堆的设置是指java程序运行过程中JVM可以调配使用的内存空间的设置.JVM在启动的时候会自动设置Heap size的值，其初始空间(即-Xms)是物理内存的1/64，最大空间(-Xmx)是物理内存的1/4。可以利用JVM提供的-Xmn-Xms-Xmx等选项可进行设置。Heap size的大小是Young Generation和TenuredGeneraion之和。

		提示:在JVM中如果98%的时间是用于GC且可用的Heap size不足2%的时候将抛出此异常信息。
		提示:Heap Size最大不要超过可用物理内存的80%，一般的要将-Xms 和-Xmx选项设置为相同，而-Xms为1/4的-Xmx值。
解决方法:手动设置Heap size
修改 TOMCAT_HOME/bin/catalina.sh
在“echo"Using CATALINA_BASE:$CATALINA_BASE""上面加入以下行:JAVA_OPTS="-server-Xms800m-Xmx800m-XX:MaxNewSize=256m"







5、