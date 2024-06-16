<template><div><h1 id="_1、介绍" tabindex="-1"><a class="header-anchor" href="#_1、介绍" aria-hidden="true">#</a> 1、介绍</h1>
<h2 id="_1-运行速度" tabindex="-1"><a class="header-anchor" href="#_1-运行速度" aria-hidden="true">#</a> （1）运行速度</h2>
<p>​		StringBuilder &gt; StringBuffer &gt; String<br>
​		String为字符串常量，而StringBuilder和StringBuffer均为字符串变量，即String对象一旦创建之后该对象是不可更改的，但后两者的对象是变量，是可以更改的。</p>
<p>​		因为String修改其实是new了一个新对象，原来的String被JVM的垃圾回收机制（GC）给回收掉了。</p>
<figure><img src="/assets/images/StringUpdate.png" alt="image-20200721154908228" tabindex="0" loading="lazy"><figcaption>image-20200721154908228</figcaption></figure>
<p>​		Java中对String对象进行的操作实际上是一个不断创建新的对象并且将旧的对象回收的一个过程，所以执行速度很慢。</p>
<h2 id="_2-线程安全" tabindex="-1"><a class="header-anchor" href="#_2-线程安全" aria-hidden="true">#</a> （2）线程安全</h2>
<p>StringBuffer对方法加了同步锁或者对调用的方法加了同步锁，所以是线程安全的</p>
<h2 id="_3-继承关系" tabindex="-1"><a class="header-anchor" href="#_3-继承关系" aria-hidden="true">#</a> （3）继承关系</h2>
<figure><img src="/assets/images/StringStringBuilderStringBuffer.png" alt="image-20200721155019047" tabindex="0" loading="lazy"><figcaption>image-20200721155019047</figcaption></figure>
<h1 id="_2、对比" tabindex="-1"><a class="header-anchor" href="#_2、对比" aria-hidden="true">#</a> 2、对比</h1>
<figure><img src="/assets/images/StringBuilder.png" alt="image-20200721154514018" tabindex="0" loading="lazy"><figcaption>image-20200721154514018</figcaption></figure>
<p>参考：<a href="https://blog.csdn.net/itchuxuezhe_yang/article/details/89966303" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/itchuxuezhe_yang/article/details/89966303<ExternalLinkIcon/></a></p>
</div></template>


