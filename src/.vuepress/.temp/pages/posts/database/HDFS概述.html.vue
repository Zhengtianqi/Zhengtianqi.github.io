<template><div><p>本文权威指南读书笔记</p>
<h1 id="一、hdfs的设计前提和目标" tabindex="-1"><a class="header-anchor" href="#一、hdfs的设计前提和目标" aria-hidden="true">#</a> 一、HDFS的设计前提和目标</h1>
<p>​	（1）存储大文件：HDFS支持GB级别大小的文件；</p>
<p>​	（2）流式数据访问：保证高吞吐量</p>
<p>​	（3）容错性：完善的冗余备份机制；</p>
<p>​	（4）简单的一致性模型：一次写入多次读取；</p>
<p>​	（5）移动计算优于移动数据：HDFS使应用计算移动到离他最近数据位置的接口；</p>
<p>​	（6）兼容各种硬件和软件平台。</p>
<p>​	HDFS不适合的场景：</p>
<p>​	（1）大量小文件：文件的元数据存储在NameNode内容中，大量小文件意味着元数据增加，会占用大量内存；</p>
<p>​	（2）低延迟数据访问：HDFS是专门针对吞吐量而不是用户低延迟；</p>
<p>​	（3）多用户写入：导致一致性维护困难。</p>
<h1 id="二、主要组件与架构" tabindex="-1"><a class="header-anchor" href="#二、主要组件与架构" aria-hidden="true">#</a> 二、主要组件与架构</h1>
<p>​	主要三个组件：NameNode、SecondaryNameNode 和 DataNode</p>
<p>​	（HDFS以主从模式运行，其中NameNode、SecondaryNameNode运行再Master节点，DataNode运行再Slave节点上）</p>
<p>​	NameNode负责信息维护者，DateNode负责存取数据。</p>
<p>​	<img src="/assets/images/hdfs.png" alt="image-20191216141048512" loading="lazy"></p>
<h2 id="_1-namenode" tabindex="-1"><a class="header-anchor" href="#_1-namenode" aria-hidden="true">#</a> (1) NameNode</h2>
<p>​	NameNode管理着文件系统的命名空间 , 它维护文件系统树及树中的所有文件和目录</p>
<p>​	NameNode也负责维护所有这些文件或目录的打开、关闭、移动、重命名等操作。</p>
<p>​		a. 文件名目录名及它们之间的层级关系</p>
<p>​		b. 文件目录的所有者及其权限</p>
<p>​		c.每个文件块的名及文件有哪些块组成</p>
<p>​	NameNode启动时加载到内存中，元信息会保存各个块的名称及文件由哪些块组成。</p>
<p>​	NameNode占用大量内存和I/O资源，对Name容错机制也十分重要</p>
<h2 id="_2-datanode" tabindex="-1"><a class="header-anchor" href="#_2-datanode" aria-hidden="true">#</a> (2) DataNode</h2>
<p>​	DataNode是HDFS中的Worker节点，它负责存储数据块，也负责为系统客户端提供数据块的读写服务，同时还会根据NameNode的指示来进行创建、删除和复制等操作。此外，它还会通过心跳定期向NameNode发送所存储文件块列表信息。</p>
<p>​	负责实际文件数据的保存于操作，与客户端直接交互。</p>
<p>​	例子：一条元信息记录会占用200B内存空间。 假设块大小为64MB，备份数量是3，那么一个1GB大小的文件将占用16<em>3=48个文件块。如果现在有1000个1MB大小的文件，则会占用1000</em>3=3000个文件块（多个文件不能放到一个块中）。</p>
<p>​	可以得出，如果文件越小，存储同等大小文件所需要的元信息就越多，所以，Hadoop更喜欢大文件。</p>
<h2 id="_3-元信息的持久化" tabindex="-1"><a class="header-anchor" href="#_3-元信息的持久化" aria-hidden="true">#</a> （3）元信息的持久化</h2>
<p>​	在NameNode中存放元信息的文件是fsimage。在系统运行期间所有对元信息的操作都保存在内存中并被持久化到另一个edits中，并且edits文件和fsimage文件会SecondaryNameNode周期性地合并。</p>
<h2 id="_4-secondarynamenode" tabindex="-1"><a class="header-anchor" href="#_4-secondarynamenode" aria-hidden="true">#</a> （4）SecondaryNameNode</h2>
<p>​	在NameNode启动时，首先会加载fsimage到内存中，在系统运行期间，所有对NameNode的操作也都保存在内存中，同时为了防止数据丢失，这些操作又会不断的持久化到本地edits文件中。</p>
<p>​	edits文件的目的是为了提高系统的操作效率，NameNode在更新内存的元信息之前都会先将操作写入edits文件。在NameNode重启的过程中，edits会和fsimage合并到一起，但是合并的过程会影响到Hadoop重启的速度，SecondaryNameNode就是为了解决这个问题：</p>
<figure><img src="/assets/images/secondaryNameNode.jpg" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<p>​	SecondaryNameNode的角色就是定期合并edits和fsimage文件：</p>
<p>​	a、合并之前告知NameNode把所有的操作写到新的edites文件并将其命名为edits.new。</p>
<p>​	b、SecondaryNameNode从NameNode请求fsimage和edits文件。</p>
<p>​	c、SecondaryNameNode把fsimage和edits文件合并成新的fsimage文件。</p>
<p>​	d、NameNode从SecondaryName获取合并好的新的fsimage并将旧的替换掉，并</p>
<p>​	使用的检查点：</p>
<p>​		fsimage：保存的是上个检查点的HDFS的元信息</p>
<p>​		edits：保存的是从上个检查点开始发生的HDFS元信息状态改变信息</p>
<p>​		fstime：保存了最后一个检查点的时间戳</p>
<h1 id="三、数据备份" tabindex="-1"><a class="header-anchor" href="#三、数据备份" aria-hidden="true">#</a> 三、数据备份</h1>
<p>​	HDFS通过备份数据块的形式来实现容错，除了文件的最后一个数据块外，其他所有数据块大小都是一样的，数据块的大小和备份银子都是可以配置的。</p>
<p>​	NmaeNode负责各个数据块的备份，DataNode会通过心跳的方式定期向NameNode发送自己节点上的Block报告，这个报告包含了DataNode节点上的所有数据块的列表。</p>
<p>​	写数据时候通过负载均衡，进行同步，但是会影响效率。当Hadoop的NameNode节点启动时，会进入安全模式。当副本数满足最小副本数，系统会退出安全模式。</p>
<h1 id="四、通信协议" tabindex="-1"><a class="header-anchor" href="#四、通信协议" aria-hidden="true">#</a> 四、通信协议</h1>
<p>​	所有的HDFS中的沟通协议都是基于TCP/IP协议的</p>
<p>​	（1）一个客户端通过指定的TCP端口与NameNode机器建立连接，并通过Client Protocol协议与NameNode交互。 NameNode只被动接受请求。</p>
<p>​	（2）DataNode则通过DataNode Protocol协议与NameNode进行沟通。</p>
<p>​	（3）HDFS的RPC对Client Protocol 和 DataNode Protocol做了封装。</p>
<h1 id="五、可靠性保证" tabindex="-1"><a class="header-anchor" href="#五、可靠性保证" aria-hidden="true">#</a> 五、可靠性保证</h1>
<p>​	HDFS可以允许DataNode失败。</p>
<p>​	DataNode会定期（默认3s）向NameNode发送心跳，若NameNode在指定时间间隔内没有收到心跳，它就认为此节点已经失败。此时NameNode把失败节点的数据备份到另一个健康的节点，这就保证了集群始终维持指定的副本数。</p>
<p>​	HDFS可以检测到数据块损坏。在读取数据块时，HDFS会对数据块和保存的校验和文件匹配，如果不匹配，NameNode会重新备份损坏的数据块。</p>
</div></template>


