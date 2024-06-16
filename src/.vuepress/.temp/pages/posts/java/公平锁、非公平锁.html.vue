<template><div><p>1、概念：</p>
<p>​        公平锁：加锁前先查看是否有排队等待的线程，有的话优先处理排在前面的线程，先来先得。<br>
​        公平所：线程加锁时直接尝试获取锁，获取不到就自动到队尾等待。</p>
<p>​        更多的是直接使用非公平锁：非公平锁比公平锁性能高5-10倍，因为公平锁需要在多核情况下维护一个队列，如果当前线程不是队列的第一个无法获取锁，增加了线程切换次数。</p>
<p>​        原理 ： <a href="https://www.cnblogs.com/little-fly/p/10365109.html" target="_blank" rel="noopener noreferrer">https://www.cnblogs.com/little-fly/p/10365109.html<ExternalLinkIcon/></a></p>
<p>​        <a href="https://www.jianshu.com/p/06340f8feb05" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/06340f8feb05<ExternalLinkIcon/></a></p>
<p>​</p>
<p>2、Java语言中:</p>
<p>​    公平和非公平锁的队列都基于锁内部维护的一个双向链表，表结点Node的值就是每一个请求当前锁的线程。</p>
<p>​    两者的区别：<a href="https://www.jianshu.com/p/c7d17b5c6be3" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/c7d17b5c6be3<ExternalLinkIcon/></a></p>
</div></template>


