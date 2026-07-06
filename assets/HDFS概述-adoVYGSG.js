import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/hdfs/HDFS%E6%A6%82%E8%BF%B0.html","title":"HDFS概述","lang":"zh-CN","frontmatter":{"title":"HDFS概述","tag":["HDFS","HADOOP","大数据"],"category":"大数据","date":"2019-12-16T00:00:00.000Z","description":"HDFS概述 HDFS概述是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。 本文介绍了HDFS概述的原理和应用场景，帮助你进入大数据领域。 本文权威指南读书笔记 二、主要组件与架构 (1) NameNode a. 文件名目录名及它们之间的层级关系 (2) DataNode （3）元信息的持久化 （4）SecondaryNameNode...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"HDFS概述\\",\\"image\\":[\\"https://zhengtianqi.github.io/assets/images/hdfs.png\\",\\"https://zhengtianqi.github.io/assets/images/secondaryNameNode.jpg\\"],\\"datePublished\\":\\"2019-12-16T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/hdfs/HDFS%E6%A6%82%E8%BF%B0.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"HDFS概述"}],["meta",{"property":"og:description","content":"HDFS概述 HDFS概述是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。 本文介绍了HDFS概述的原理和应用场景，帮助你进入大数据领域。 本文权威指南读书笔记 二、主要组件与架构 (1) NameNode a. 文件名目录名及它们之间的层级关系 (2) DataNode （3）元信息的持久化 （4）SecondaryNameNode..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://zhengtianqi.github.io/assets/images/hdfs.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"大数据"}],["meta",{"property":"article:tag","content":"HADOOP"}],["meta",{"property":"article:tag","content":"HDFS"}],["meta",{"property":"article:published_time","content":"2019-12-16T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1718546797000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"270490096@qq.com","commits":9,"url":"https://github.com/zhengtianqi"},{"name":"郑天祺","username":"","email":"270490096@qq.com","commits":3}]},"readingTime":{"minutes":5.11,"words":1532},"filePathRelative":"posts/数据库/hdfs/HDFS概述.md","excerpt":"\\n<blockquote>\\n<p>HDFS概述是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。<br>\\n本文介绍了HDFS概述的原理和应用场景，帮助你进入大数据领域。</p>\\n</blockquote>\\n<p>本文权威指南读书笔记</p>\\n<pre><code>（1）存储大文件：HDFS支持GB级别大小的文件；\\n\\n（2）流式数据访问：保证高吞吐量\\n\\n（3）容错性：完善的冗余备份机制；\\n\\n（4）简单的一致性模型：一次写入多次读取；\\n\\n（5）移动计算优于移动数据：HDFS使应用计算移动到离他最近数据位置的接口；\\n\\n（6）兼容各种硬件和软件平台。\\n\\nHDFS不适合的场景：\\n\\n（1）大量小文件：文件的元数据存储在NameNode内容中，大量小文件意味着元数据增加，会占用大量内存；\\n\\n（2）低延迟数据访问：HDFS是专门针对吞吐量而不是用户低延迟；\\n\\n（3）多用户写入：导致一致性维护困难。\\n</code></pre>","autoDesc":true}`),a={name:`HDFS概述.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="hdfs概述" tabindex="-1"><a class="header-anchor" href="#hdfs概述"><span>HDFS概述</span></a></h1><blockquote><p>HDFS概述是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。<br> 本文介绍了HDFS概述的原理和应用场景，帮助你进入大数据领域。</p></blockquote><p>本文权威指南读书笔记</p><pre><code>（1）存储大文件：HDFS支持GB级别大小的文件；

（2）流式数据访问：保证高吞吐量

（3）容错性：完善的冗余备份机制；

（4）简单的一致性模型：一次写入多次读取；

（5）移动计算优于移动数据：HDFS使应用计算移动到离他最近数据位置的接口；

（6）兼容各种硬件和软件平台。

HDFS不适合的场景：

（1）大量小文件：文件的元数据存储在NameNode内容中，大量小文件意味着元数据增加，会占用大量内存；

（2）低延迟数据访问：HDFS是专门针对吞吐量而不是用户低延迟；

（3）多用户写入：导致一致性维护困难。
</code></pre><h1 id="二、主要组件与架构" tabindex="-1"><a class="header-anchor" href="#二、主要组件与架构"><span>二、主要组件与架构</span></a></h1><pre><code>主要三个组件：NameNode、SecondaryNameNode 和 DataNode

（HDFS以主从模式运行，其中NameNode、SecondaryNameNode运行再Master节点，DataNode运行再Slave节点上）

NameNode负责信息维护者，DateNode负责存取数据。

![image-20191216141048512](/assets/images/hdfs.png)
</code></pre><h2 id="_1-namenode" tabindex="-1"><a class="header-anchor" href="#_1-namenode"><span>(1) NameNode</span></a></h2><pre><code>NameNode管理着文件系统的命名空间 , 它维护文件系统树及树中的所有文件和目录

NameNode也负责维护所有这些文件或目录的打开、关闭、移动、重命名等操作。
</code></pre><p>a. 文件名目录名及它们之间的层级关系</p><pre><code>	b. 文件目录的所有者及其权限

	c.每个文件块的名及文件有哪些块组成

NameNode启动时加载到内存中，元信息会保存各个块的名称及文件由哪些块组成。

NameNode占用大量内存和I/O资源，对Name容错机制也十分重要
</code></pre><h2 id="_2-datanode" tabindex="-1"><a class="header-anchor" href="#_2-datanode"><span>(2) DataNode</span></a></h2><pre><code>DataNode是HDFS中的Worker节点，它负责存储数据块，也负责为系统客户端提供数据块的读写服务，同时还会根据NameNode的指示来进行创建、删除和复制等操作。此外，它还会通过心跳定期向NameNode发送所存储文件块列表信息。

负责实际文件数据的保存于操作，与客户端直接交互。

例子：一条元信息记录会占用200B内存空间。 假设块大小为64MB，备份数量是3，那么一个1GB大小的文件将占用16*3=48个文件块。如果现在有1000个1MB大小的文件，则会占用1000*3=3000个文件块（多个文件不能放到一个块中）。

可以得出，如果文件越小，存储同等大小文件所需要的元信息就越多，所以，Hadoop更喜欢大文件。
</code></pre><h2 id="_3-元信息的持久化" tabindex="-1"><a class="header-anchor" href="#_3-元信息的持久化"><span>（3）元信息的持久化</span></a></h2><pre><code>在NameNode中存放元信息的文件是fsimage。在系统运行期间所有对元信息的操作都保存在内存中并被持久化到另一个edits中，并且edits文件和fsimage文件会SecondaryNameNode周期性地合并。
</code></pre><h2 id="_4-secondarynamenode" tabindex="-1"><a class="header-anchor" href="#_4-secondarynamenode"><span>（4）SecondaryNameNode</span></a></h2><pre><code>在NameNode启动时，首先会加载fsimage到内存中，在系统运行期间，所有对NameNode的操作也都保存在内存中，同时为了防止数据丢失，这些操作又会不断的持久化到本地edits文件中。

edits文件的目的是为了提高系统的操作效率，NameNode在更新内存的元信息之前都会先将操作写入edits文件。在NameNode重启的过程中，edits会和fsimage合并到一起，但是合并的过程会影响到Hadoop重启的速度，SecondaryNameNode就是为了解决这个问题：
</code></pre><figure><img src="/assets/images/secondaryNameNode.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><pre><code>SecondaryNameNode的角色就是定期合并edits和fsimage文件：

a、合并之前告知NameNode把所有的操作写到新的edites文件并将其命名为edits.new。

b、SecondaryNameNode从NameNode请求fsimage和edits文件。

c、SecondaryNameNode把fsimage和edits文件合并成新的fsimage文件。

d、NameNode从SecondaryName获取合并好的新的fsimage并将旧的替换掉，并

使用的检查点：

	fsimage：保存的是上个检查点的HDFS的元信息

	edits：保存的是从上个检查点开始发生的HDFS元信息状态改变信息

	fstime：保存了最后一个检查点的时间戳
</code></pre><h1 id="三、数据备份" tabindex="-1"><a class="header-anchor" href="#三、数据备份"><span>三、数据备份</span></a></h1><pre><code>HDFS通过备份数据块的形式来实现容错，除了文件的最后一个数据块外，其他所有数据块大小都是一样的，数据块的大小和备份银子都是可以配置的。

NmaeNode负责各个数据块的备份，DataNode会通过心跳的方式定期向NameNode发送自己节点上的Block报告，这个报告包含了DataNode节点上的所有数据块的列表。

写数据时候通过负载均衡，进行同步，但是会影响效率。当Hadoop的NameNode节点启动时，会进入安全模式。当副本数满足最小副本数，系统会退出安全模式。
</code></pre><h1 id="四、通信协议" tabindex="-1"><a class="header-anchor" href="#四、通信协议"><span>四、通信协议</span></a></h1><pre><code>所有的HDFS中的沟通协议都是基于TCP/IP协议的

（1）一个客户端通过指定的TCP端口与NameNode机器建立连接，并通过Client Protocol协议与NameNode交互。 NameNode只被动接受请求。

（2）DataNode则通过DataNode Protocol协议与NameNode进行沟通。

（3）HDFS的RPC对Client Protocol 和 DataNode Protocol做了封装。
</code></pre><h1 id="五、可靠性保证" tabindex="-1"><a class="header-anchor" href="#五、可靠性保证"><span>五、可靠性保证</span></a></h1><pre><code>HDFS可以允许DataNode失败。

DataNode会定期（默认3s）向NameNode发送心跳，若NameNode在指定时间间隔内没有收到心跳，它就认为此节点已经失败。此时NameNode把失败节点的数据备份到另一个健康的节点，这就保证了集群始终维持指定的副本数。

HDFS可以检测到数据块损坏。在读取数据块时，HDFS会对数据块和保存的校验和文件匹配，如果不匹配，NameNode会重新备份损坏的数据块。
</code></pre>`,24)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};