import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/hdfs/HDFS%E6%96%87%E4%BB%B6%E6%93%8D%E4%BD%9C.html","title":"HDFS文件操作","lang":"zh-CN","frontmatter":{"title":"HDFS文件操作","tag":["HDFS","HADOOP","大数据"],"category":"大数据","date":"2019-12-16T00:00:00.000Z","description":"HDFS文件操作 HDFS文件操作是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。 本文介绍了HDFS文件操作的原理和应用场景，帮助你进入大数据领域。 例如：数据中心d1中有一个机架r1中一个节点n1表示为d1/r1/n1 二、写文件 HDFS有一个分布式系统，客户端通过调用这个实例的create()方法就可以创建文件。 DFS会发给...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"HDFS文件操作\\",\\"image\\":[\\"https://zhengtianqi.github.io/assets/images/hdfs-read-file.png\\",\\"https://zhengtianqi.github.io/assets/images/hdfs-write-file.png\\"],\\"datePublished\\":\\"2019-12-16T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/hdfs/HDFS%E6%96%87%E4%BB%B6%E6%93%8D%E4%BD%9C.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"HDFS文件操作"}],["meta",{"property":"og:description","content":"HDFS文件操作 HDFS文件操作是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。 本文介绍了HDFS文件操作的原理和应用场景，帮助你进入大数据领域。 例如：数据中心d1中有一个机架r1中一个节点n1表示为d1/r1/n1 二、写文件 HDFS有一个分布式系统，客户端通过调用这个实例的create()方法就可以创建文件。 DFS会发给..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://zhengtianqi.github.io/assets/images/hdfs-read-file.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"大数据"}],["meta",{"property":"article:tag","content":"HADOOP"}],["meta",{"property":"article:tag","content":"HDFS"}],["meta",{"property":"article:published_time","content":"2019-12-16T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1718546797000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"270490096@qq.com","commits":9,"url":"https://github.com/zhengtianqi"},{"name":"郑天祺","username":"","email":"270490096@qq.com","commits":3}]},"readingTime":{"minutes":4.33,"words":1300},"filePathRelative":"posts/数据库/hdfs/HDFS文件操作.md","excerpt":"\\n<blockquote>\\n<p>HDFS文件操作是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。<br>\\n本文介绍了HDFS文件操作的原理和应用场景，帮助你进入大数据领域。</p>\\n</blockquote>\\n<pre><code>HDFS有一个文件系统实例，客户端通过调用这个实例的open()方法就可以打开系统中希望读取的文件。\\n\\nHDFS通过RPC调用NameNode获取文件块的位置信息，对于文件的每一个块，NameNode会返回该块副本DataNode的节点地址。\\n\\n另外，客户端还会根据网络拓扑来确定它与每一个DataNode的位置信息，从离它最近的那个DataNode获取数据块的副本，最理想的情况是数据块就储存在客户端所在的节点上。\\n\\n具体过程：\\n\\n![image-20191216155358635](/assets/images/hdfs-read-file.png)\\n\\n（1）客户端发起请求\\n\\n（2）客户端与NameNode得到文件的块及位置信息列表\\n\\n（3）客户端直接和DataNode交互读取数据\\n\\n（4）读取完成关闭连接\\n\\n这样设计的巧妙之处有：\\n\\n（1）在运行MapReduce任务时，每个客户端就是一个DataNode节点。\\n\\n（2）NameNode 仅需要相应块的位置信息请求，否则随着客户端的增加，NameNode会很快成为瓶颈。\\n\\nHadoop的网络拓扑。在海量数据处理过程中，主要限制因素时节点之间的带宽。衡量两个节点之间的带宽往往很难实现，在这里Hadoop采取了一个简单的方法，它把网络拓扑看成一棵树，两个节点的距离等于他们到最近共同祖先距离的综合，而树的层次可以这么划分：\\n\\na、同一个节点中的进程\\n\\nb、同一机架上的不同节点\\n\\nc、同一数据中心不同机架\\n\\nd、不同数据中心的节点\\n</code></pre>","autoDesc":true}`),a={name:`HDFS文件操作.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="hdfs文件操作" tabindex="-1"><a class="header-anchor" href="#hdfs文件操作"><span>HDFS文件操作</span></a></h1><blockquote><p>HDFS文件操作是大数据领域的核心技术，它为海量数据的存储和处理提供了强大的支持。<br> 本文介绍了HDFS文件操作的原理和应用场景，帮助你进入大数据领域。</p></blockquote><pre><code>HDFS有一个文件系统实例，客户端通过调用这个实例的open()方法就可以打开系统中希望读取的文件。

HDFS通过RPC调用NameNode获取文件块的位置信息，对于文件的每一个块，NameNode会返回该块副本DataNode的节点地址。

另外，客户端还会根据网络拓扑来确定它与每一个DataNode的位置信息，从离它最近的那个DataNode获取数据块的副本，最理想的情况是数据块就储存在客户端所在的节点上。

具体过程：

![image-20191216155358635](/assets/images/hdfs-read-file.png)

（1）客户端发起请求

（2）客户端与NameNode得到文件的块及位置信息列表

（3）客户端直接和DataNode交互读取数据

（4）读取完成关闭连接

这样设计的巧妙之处有：

（1）在运行MapReduce任务时，每个客户端就是一个DataNode节点。

（2）NameNode 仅需要相应块的位置信息请求，否则随着客户端的增加，NameNode会很快成为瓶颈。

Hadoop的网络拓扑。在海量数据处理过程中，主要限制因素时节点之间的带宽。衡量两个节点之间的带宽往往很难实现，在这里Hadoop采取了一个简单的方法，它把网络拓扑看成一棵树，两个节点的距离等于他们到最近共同祖先距离的综合，而树的层次可以这么划分：

a、同一个节点中的进程

b、同一机架上的不同节点

c、同一数据中心不同机架

d、不同数据中心的节点
</code></pre><p>例如：数据中心d1中有一个机架r1中一个节点n1表示为d1/r1/n1</p><pre><code>a、distance(d1/r1/n1,d1/r1/n1)=0;

b、distance(d1/r1/n1,d1/r1/n2)=2;

c、distance(d1/r1/n1,d1/r2/n3)=4;

d、distance(d1/r1/n1,d2/r3/n4)=6; 
</code></pre><h1 id="二、写文件" tabindex="-1"><a class="header-anchor" href="#二、写文件"><span>二、写文件</span></a></h1><p>HDFS有一个分布式系统，客户端通过调用这个实例的create()方法就可以创建文件。</p><p>DFS会发给NameNode一个RPC调用，在文件系统的命名空间创建一个新文件。</p><p>在创建文件前NameNode会做一些检查，看看文件是否存在，客户端是否有创建权限等。</p><p>若检查通过，NameNode会为创建文件写一条记录到本地磁盘的EditLog；</p><p>若不通过会向客户端抛出IOException。</p><figure><img src="/assets/images/hdfs-write-file.png" alt="image-20191216163905988" tabindex="0" loading="lazy"><figcaption>image-20191216163905988</figcaption></figure><p>（1）首先，第一个DataNode是以数据包（4KB）的形式从客户端接收数据的，DataNode在把数据包写入到本地磁盘的同时会向第二个DataNode（作为副本节点）传送数据。</p><p>（2）在第二个DataNode把接收到的数据包写入本地磁盘时会向第三个DataNode发送数据包。</p><p>（3）第三个DataNode开始向本地磁盘写入数据包。此时，数据包以流水线的形式被写入和备份到所有DataNode节点。</p><p>（4）传送管道中的每个DataNode节点在收到数据后都会向前面那个DataNode发送一个ACK，最终 第一个DataNode会向客户端发回一个ACK。</p><p>（感觉这个ACK和TCP/IP协议中的差不多：ACK (Acknowledge character）即是确认字符，在数据通信中，接收站发给发送站的一种传输类<a href="https://baike.baidu.com/item/%E6%8E%A7%E5%88%B6%E5%AD%97%E7%AC%A6/6913704" target="_blank" rel="noopener noreferrer">控制字符</a>。表示发来的数据已确认接收无误。）</p><p>（5）当客户端收到数据块的确认之后，数据块被认为已经持久化到所有节点，然后客户端会向NameNode发送一个确认。</p><p>（这里是最后一次ACK吗？还有有一个seq？因为上边说每次发送的数据包是4KB比较小，每次都有ACK吧应该，还是最后检验程序完整性？感觉和文件上传很类似，期待研究源码！）</p><p>（6）如果管道中的任何一个DataNode失败，管道会被关闭，数据将会继续写到剩余的DataNode中。同时NameNode会被告知待备份状态，NameNode会继续备份数据到新的可用的节点。</p><p>解答上述疑问：数据块都会通过计算校验和来检测数据的完整性，校验和以隐藏文件的形式被单独存放在HDFS中，供读取时进行完整性校验。</p><h1 id="三、删除文件" tabindex="-1"><a class="header-anchor" href="#三、删除文件"><span>三、删除文件</span></a></h1><p>HADOOP 删除文件三部曲</p><p>（1）NameNode只是重命名被删除的文件到 /trash 目录，因为重命名操作只是元信息的变动，所以整个过程非常快。在 /trash 中文件会被保留一定间隔的时间（默认6h）</p><pre><code>（在这个期间文件可以恢复）；
</code></pre><p>（2）当指定的时间到达，NameNode将会把文件从命名空间中删除；</p><p>（3）标记删除的文件块释放空间，HDFS文件系统显示空间增加。</p><h1 id="四、修改文件" tabindex="-1"><a class="header-anchor" href="#四、修改文件"><span>四、修改文件</span></a></h1><p>想啥呢?</p>`,29)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};