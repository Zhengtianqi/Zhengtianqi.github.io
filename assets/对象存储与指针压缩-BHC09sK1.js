import{n as e,o as t,r as n}from"./app-CH3eYcUw.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E4%B8%8E%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A9.html","title":"对象存储与指针压缩","lang":"zh-CN","frontmatter":{"title":"对象存储与指针压缩","tag":["JVM","内存优化","对象模型"],"category":"java基础","date":"2019-11-20T00:00:00.000Z","description":"对象存储与指针压缩 对象存储与指针压缩是一个重要的技术主题，它在现代软件开发中扮演着关键角色。 本文系统介绍了对象存储与指针压缩的核心概念和实践经验，帮助你深入理解这一技术领域。 image-20191120195326698image-20191120195326698 image-20191120195453758image-20191120195...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"对象存储与指针压缩\\",\\"image\\":[\\"https://zhengtianqi.github.io/assets/images/对象存储1.png\\",\\"https://zhengtianqi.github.io/assets/images/java对象存储2.png\\",\\"https://zhengtianqi.github.io/assets/images/java对象存储3.png\\",\\"https://zhengtianqi.github.io/assets/images/指针压缩1.png\\",\\"https://zhengtianqi.github.io/assets/images/指针压缩2.png\\",\\"https://zhengtianqi.github.io/assets/images/指针压缩3.png\\",\\"https://zhengtianqi.github.io/assets/images/指针压缩4.png\\"],\\"datePublished\\":\\"2019-11-20T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E4%B8%8E%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A9.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"对象存储与指针压缩"}],["meta",{"property":"og:description","content":"对象存储与指针压缩 对象存储与指针压缩是一个重要的技术主题，它在现代软件开发中扮演着关键角色。 本文系统介绍了对象存储与指针压缩的核心概念和实践经验，帮助你深入理解这一技术领域。 image-20191120195326698image-20191120195326698 image-20191120195453758image-20191120195..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://zhengtianqi.github.io/assets/images/对象存储1.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"对象模型"}],["meta",{"property":"article:tag","content":"内存优化"}],["meta",{"property":"article:tag","content":"JVM"}],["meta",{"property":"article:published_time","content":"2019-11-20T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1718546797000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"270490096@qq.com","commits":8,"url":"https://github.com/zhengtianqi"},{"name":"郑天祺","username":"","email":"270490096@qq.com","commits":3}]},"readingTime":{"minutes":4.47,"words":1342},"filePathRelative":"posts/基础知识/对象存储与指针压缩.md","excerpt":"\\n<blockquote>\\n<p>对象存储与指针压缩是一个重要的技术主题，它在现代软件开发中扮演着关键角色。<br>\\n本文系统介绍了对象存储与指针压缩的核心概念和实践经验，帮助你深入理解这一技术领域。</p>\\n</blockquote>\\n<pre><code>我们知道在Java中基本数据类型的大小，例如int类型占4个字节、long类型占8个字节，那么Integer对象和Long对象会占用多少内存呢？\\n\\n一、对象存储：\\n\\n一个Java对象在内存中包括对象头、实例数据和补齐填充3个部分：\\n</code></pre>\\n<figure><img src=\\"/assets/images/对象存储1.png\\" alt=\\"image-20191120195326698\\" tabindex=\\"0\\" loading=\\"lazy\\"><figcaption>image-20191120195326698</figcaption></figure>","autoDesc":true}`),a={name:`对象存储与指针压缩.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="对象存储与指针压缩" tabindex="-1"><a class="header-anchor" href="#对象存储与指针压缩"><span>对象存储与指针压缩</span></a></h1><blockquote><p>对象存储与指针压缩是一个重要的技术主题，它在现代软件开发中扮演着关键角色。<br> 本文系统介绍了对象存储与指针压缩的核心概念和实践经验，帮助你深入理解这一技术领域。</p></blockquote><pre><code>我们知道在Java中基本数据类型的大小，例如int类型占4个字节、long类型占8个字节，那么Integer对象和Long对象会占用多少内存呢？

一、对象存储：

一个Java对象在内存中包括对象头、实例数据和补齐填充3个部分：
</code></pre><figure><img src="/assets/images/%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A81.png" alt="image-20191120195326698" tabindex="0" loading="lazy"><figcaption>image-20191120195326698</figcaption></figure><pre><code>(1) 对齐填充 :

Java对象占用空间是8字节对齐的，即所有Java对象占用bytes数必须是8的倍数。

例如，一个包含两个属性的对象：int和byte，这个对象需要占用8+4+1=13个字节，这时就需要加上大小为3字节的padding进行8字节对齐，最终占用大小为16个字节。
</code></pre><figure><img src="/assets/images/java%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A82.png" alt="image-20191120195453758" tabindex="0" loading="lazy"><figcaption>image-20191120195453758</figcaption></figure><p>32位系统 对象头占用空间= 4 + 4 = 8 byte</p><p>64位系统 对象头占用空间= 8 + 8 =16 byte</p><p>64位开启指针压缩 对象头占用空间= 4 + 8 = 12 byte</p><p>注：</p><pre><code>若为数组对象，对象头占用空间 + 4 byte

静态属性不算在对象大小内

从JDK 1.6 update14开始，64位的JVM正式支持了 -XX:+UseCompressedOops 这个可以压缩指针，起到节约内存占用的新参数。

JDK 1.8，默认该参数就是开启的。

(2)  对象的实际数据  

对象实际数据包括了对象的所有成员变量，其大小由各个成员变量的大小决定
</code></pre><figure><img src="/assets/images/java%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A83.png" alt="image-20191120195618441" tabindex="0" loading="lazy"><figcaption>image-20191120195618441</figcaption></figure><pre><code>对于reference类型来说，在32位系统上占用4bytes, 在64位系统上占用8bytes。

对象实际数据包括了对象的所有成员变量，其大小由各个成员变量的大小决定，

比如：byte和boolean是1个字节，short和char是2个字节，int和float是4个字节，long和double是8个字节，reference是4个字节（64位系统中是8个字节）。
</code></pre><p>二、指针压缩</p><pre><code>从上文的分析中可以看到，64位JVM消耗的内存会比32位的要多大约1.5倍，这是因为对象指针在64位JVM下有更宽的寻址。

对于那些将要从32位平台移植到64位的应用来说，平白无辜多了1/2的内存占用，这是开发者不愿意看到的
</code></pre><p>OOP的全称为：Ordinary Object Pointer，就是普通对象指针。启用CompressOops后，会压缩的对象：</p><pre><code>每个Class的属性指针（静态成员变量）；

每个对象的属性指针；

普通对象数组的每个元素指针。

当然，压缩也不是所有的指针都会压缩，对一些特殊类型的指针，JVM是不会优化的，例如指向PermGen（1.8废弃）的Class对象指针、本地变量、堆栈元素、入参、返回值和NULL指针不会被压缩。

1.新生代：Eden+From Survivor+To Survivor

2.老年代：OldGen

3.永久代（方法区的实现） : PermGen-----&gt;替换为Metaspace(本地内存中)

(1) 验证对象头大小
</code></pre><figure><img src="/assets/images/%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A91.png" alt="image-20191120195845734" tabindex="0" loading="lazy"><figcaption>image-20191120195845734</figcaption></figure><pre><code>对象头大小=Class Pointer的空间大小为4字节+MarkWord为8字节=12字节；

实际数据大小=int类型4字节+long类型8字节=12字节（静态变量不在计算范围之内）

共24 byte

(2) 验证对象头大小 非压缩情况下
</code></pre><figure><img src="/assets/images/%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A92.png" alt="image-20191120200005300" tabindex="0" loading="lazy"><figcaption>image-20191120200005300</figcaption></figure><pre><code>对象头大小=Class Pointer的空间大小为8字节+MarkWord为8字节=16字节；

实际数据大小=int类型4字节+int类型4字节=8字节（静态变量不在计算范围之内）

共32byte

(3) 验证对象头对齐填充
</code></pre><figure><img src="/assets/images/%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A93.png" alt="image-20191120200059442" tabindex="0" loading="lazy"><figcaption>image-20191120200059442</figcaption></figure><pre><code>对象头大小=Class Pointer的空间大小为4字节+MarkWord为8字节=12字节；

实际数据大小=int类型4字节+int类型4字节=8字节（静态变量不在计算范围之内）

共20byte 所以需要有4字节的填充

(4) 验证对象头 数组
</code></pre><figure><img src="/assets/images/%E6%8C%87%E9%92%88%E5%8E%8B%E7%BC%A94.png" alt="image-20191120200152966" tabindex="0" loading="lazy"><figcaption>image-20191120200152966</figcaption></figure><pre><code>Shallow Size比较简单，这里对象头大小为12字节， 实际数据大小为4字节，所以Shallow Size为16。

对于Retained Size来说，要计算数组占用的大小，对于数组来说，它的对象头部多了一个用来存储数组长度的空间，该空间大小为4字节，所以数组对象的大小 = 引用对象头大小12字节 + 存储数组长度的空间大小4字节 + 数组的长度\\*数组中对象的RetainedSize + padding大小

long[] arr = new long[6];，它是一个长度为6的long类型的数组，由于long类型的大小为8字节，所以数组中的实际数据是6*8=48字节，那么数组对象的大小=12+4+6*8+0=64，最终的Retained Size=Shallow Size + 数组对象大小=16+64=80。 
</code></pre><p>主要参考：<a href="http://www.ideabuffer.cn/2017/05/06/Java%E5%AF%B9%E8%B1%A1%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80/" target="_blank" rel="noopener noreferrer">http://www.ideabuffer.cn/2017/05/06/Java对象内存布局/</a></p>`,26)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};