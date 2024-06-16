<template><div><h1 id="_1、应用场景" tabindex="-1"><a class="header-anchor" href="#_1、应用场景" aria-hidden="true">#</a> 1、应用场景</h1>
<p>同时为发布和订阅提供高吞吐量、消息持久化、分布式功能、支持数据并行加载到Hadoop中</p>
<p>实际：<br>
1、发布系统通知：如评论、点赞、关注这些事件发生后，可以把这些操作放入到kafka消息队列中，如果用户量一大直接操作数据库，服务器压力顶不住。所以把这些通知先存入kafka中，然后一个个消费掉。<br>
2、一些项目数据同步问题也可以用到。<br>
3、监测数据：分布式应用程序生成的统计数据集中聚合。<br>
4、分布式：假设有系统B、C、D都需要系统A的数据<br>
5、事件采集：其中状态的变化根据时间的顺序记录下来，kafka支持这种非常大的存储日志数据的场景。<br>
如：日志收集、消息系统、活动追踪、运营指标、流式处理、热点点赞、评论、关注、发短信。</p>
<h1 id="_2、架构设计" tabindex="-1"><a class="header-anchor" href="#_2、架构设计" aria-hidden="true">#</a> 2、架构设计</h1>
<p>kafka流程及概念：</p>
<h2 id="_1-kafka中的主题-topic" tabindex="-1"><a class="header-anchor" href="#_1-kafka中的主题-topic" aria-hidden="true">#</a> （1）kafka中的主题(Topic)</h2>
<p>当大家听到京广高速的时候，知道这是一条从北京到广州的高速路，这个是逻辑上的叫法，可以理解成kafka种的Topic。</p>
<h2 id="_2-kafka中的分区-partition" tabindex="-1"><a class="header-anchor" href="#_2-kafka中的分区-partition" aria-hidden="true">#</a> （2）kafka中的分区(Partition)</h2>
<p>一条高速路通常会有对各车道进行分流，每个车道上的车都是通往一个目的地的（属于同一个Topic），这里所说的车道便是Partition。<br>
如下图：其中分区路由可以简单理解成一个Hash函数，生产者在发送消息时，完全可以自定义这个函数来决定分区规则。如果分区规则设定合理，所有消息将均匀地分配到不同的分区中。<br>
<img src="/assets/images/kafka1.png" alt="img" loading="lazy"></p>
<p>通过Topic逻辑分类与Partition物理分片，最终多个Partition均匀地分布在集群中的每台机器上，从而很好地解决了存储的扩展性问题。</p>
<h2 id="_3-kafka中的消费组" tabindex="-1"><a class="header-anchor" href="#_3-kafka中的消费组" aria-hidden="true">#</a> （3）kafka中的消费组</h2>
<p>诉求:<br>
1、消费端需要与partition结合并进行并行处理。<br>
2、广播消费能力: 同一个Topic可以被多个消费者订阅，一条消息能够被消费多次。<br>
3、集群消费能力: 当消费者本身也是集群时，每一条消息只能分发给集群中的一个消费者进行处理。</p>
<p>为了满足以上诉求。Kafka引出消费组的概念，每个消费者都有一个对应的消费组，组间进行广播消费，组内进行集群消费。此外，kafka还限定了: 每个partition只能由消费组中的一个消费者进行消费。</p>
<p>如下图: 假设主题A共有4个分区，消费组2只有两个消费者，最终这两个消费组将平分整个负载，各自消费两个分区的消息。</p>
<figure><img src="/assets/images/kafka2.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>若要加快消息处理速度，向消费组2中增加新的消费者即可，kafka将以Partition为单位重新做负载均衡。当增加到4个消费者时，每个消费者仅需处理1个partition，处理速度将提升两倍。</p>
<h2 id="_4-kafka怎么保证高可用" tabindex="-1"><a class="header-anchor" href="#_4-kafka怎么保证高可用" aria-hidden="true">#</a> （4）kafka怎么保证高可用</h2>
<p>1、消息持久化存储，机器重启后历史数据不被丢失<br>
2、多副本冗余机制，在kafka集群中，每个partition都有多个副本，同一分区的不同副本中保存的是相同的消息。<br>
3、一主多从，其中leader副本负责读写请求。follower副本只负责和leader副本同步消息，当leader副本发生故障时，他才有机会被选举成新的leader副本并对外提供服务，否则一直是待命状态。</p>
<p>现在，假设kafka集群中有4台服务器，主题A和主题B都有两个Partition，且每个Partition各有两个副本，那最终的多副本架构将如下图所示：<br>
<img src="/assets/images/kafka3.png" alt="img" loading="lazy"><br>
很显然，这个集群中任何一台机器宕机，都不会影响kafka的可用性，数据仍然是完整的。</p>
<h2 id="_5-kafka整体架构" tabindex="-1"><a class="header-anchor" href="#_5-kafka整体架构" aria-hidden="true">#</a> （5）kafka整体架构</h2>
<p>如图：<br>
<img src="/assets/images/kafka4.png" alt="img" loading="lazy"></p>
<p>1、producer：生产者，负责创建消息，然后投递到kafka集群中，投递时需要指定消息所属的topic，同时确定好发往哪个partition。<br>
2、consumer：消费者，会根据它所订阅的topic以及所属的消费组，决定从哪些partition中拉去消息。<br>
3、broker：消费服务器，可水平拓展，负责分区管理、消息持久化、故障自动转移等。<br>
4、zookeeper：负责集群的元数据管理的功能，如果集群中有哪些broker节点以及topic，每个topic又有哪些partition等。<br>
5、很显然，在kafka整体架构中，partition是发送消息、存储消息、消费消息的纽带。</p>
<h1 id="_3、kafka性能优势" tabindex="-1"><a class="header-anchor" href="#_3、kafka性能优势" aria-hidden="true">#</a> 3、kafka性能优势</h1>
<p>1、顺序写<br>
Kafka 用的是顺序写，追加数据是追加到末尾，磁盘顺序写的性能极高，在磁盘个数一定，转数达到一定的情况下，基本和内存速度一致。随机写的话是在文件的某个位置修改数据，性能会较低。</p>
<p>2、零拷贝<br>
可以看到数据的拷贝从内存拷贝到 Kafka 服务进程那块，又拷贝到 Socket 缓存那块，整个过程耗费的时间比较高。Kafka 利用了 Linux 的 sendFile 技术（NIO），省去了进程切换和一次数据拷贝，让性能变得更好。</p>
<p>3、日志分段存储<br>
Kafka 规定了一个分区内的 .log 文件最大为 1G，做这个限制目的是为了方便把 .log 加载到内存去操作：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token number">00000000000000000000.</span>index
<span class="token number">00000000000000000000.l</span>og
<span class="token number">00000000000000000000.</span>timeindex

<span class="token number">00000000000005367851.</span>index
<span class="token number">00000000000005367851.l</span>og
<span class="token number">00000000000005367851.</span>timeindex

<span class="token number">00000000000009936472.</span>index
<span class="token number">00000000000009936472.l</span>og
<span class="token number">00000000000009936472.</span>timeindex
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这个 9936472 之类的数字，就是代表了这个日志段文件里包含的起始 Offset，也就说明这个分区里至少都写入了接近 1000 万条数据了。</p>
<p>Kafka Broker 有一个参数，log.segment.bytes，限定了每个日志段文件的大小，最大就是 1GB。</p>
<p>一个日志段文件满了，就自动开一个新的日志段文件来写入，避免单个文件过大，影响文件的读写性能，这个过程叫做 log rolling，正在被写入的那个日志段文件，叫做 active log segment。<br>
如果大家有了解 HDFS 就会发现 NameNode 的 edits log 也会做出限制，所以这些框架都是会考虑到这些问题。</p>
<h1 id="_4、kafka网络设计" tabindex="-1"><a class="header-anchor" href="#_4、kafka网络设计" aria-hidden="true">#</a> 4、kafka网络设计</h1>
<p>1、Acceptor接收客户端发来的请求<br>
2、轮询分发给Processor线程处理<br>
3、Processor将请求封装成Request对象，放到RequestQueue队列<br>
4、KafkaRequestHandlerPool分配工作线程，处理RequestQueue中的请求<br>
5、KafkaRequestHandler线程处理完请求后，将响应Response返回给Processor线程<br>
6、Processor线程将响应返回给客户端<br>
<img src="/assets/images/kafka5.png" alt="img" loading="lazy"><br>
从图中可以看出，SocketServer和KafkaRequestHandlerPool是其中最重要的两个组件：<br>
1、SocketServer：实现Reactor模式，用于处理多个Client（包括客户端和其他broker节点）的并发请求，并将处理结果返给Client<br>
2、KafkaRequestHandlerPool：Reactor模式中的Worker线程池，里面定义了多个工作线程，用于处理实际的I/O请求逻辑。<br>
参照：<a href="https://www.modb.pro/db/131830" target="_blank" rel="noopener noreferrer">https://www.modb.pro/db/131830<ExternalLinkIcon/></a></p>
<h1 id="_5、kafka简单使用步骤" tabindex="-1"><a class="header-anchor" href="#_5、kafka简单使用步骤" aria-hidden="true">#</a> 5、kafka简单使用步骤</h1>
<h2 id="_1-引入依赖" tabindex="-1"><a class="header-anchor" href="#_1-引入依赖" aria-hidden="true">#</a> （1）引入依赖</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>        <span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>kafka<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
        <span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>kafka<span class="token operator">-</span>test<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>scope<span class="token punctuation">></span></span>test<span class="token operator">&lt;</span><span class="token operator">/</span>scope<span class="token operator">></span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2-修改application-yml" tabindex="-1"><a class="header-anchor" href="#_2-修改application-yml" aria-hidden="true">#</a> (2)修改application.yml</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>spring<span class="token operator">:</span>
  application<span class="token operator">:</span>
    name<span class="token operator">:</span> springboot<span class="token operator">-</span>kafka
  kafka<span class="token operator">:</span>
    bootstrap<span class="token operator">-</span>servers<span class="token operator">:</span> <span class="token number">10.5</span><span class="token number">.13</span><span class="token number">.230</span><span class="token operator">:</span><span class="token number">9092</span> # 指定kafka server的地址，集群配多个，中间，逗号隔开
    
    producer<span class="token operator">:</span>
      # 当retris为<span class="token number">0</span>时，produce不会重复。retirs重发，此时repli节点完全成为leader节点，不会产生消息丢失
      retries<span class="token operator">:</span> <span class="token number">0</span>
      # 每次批量发送消息的数量，produce积累到一定数据，一次发送
      batch<span class="token operator">-</span>size<span class="token operator">:</span> <span class="token number">16384</span>
      # 设置生产者内存缓冲区的大小。
      buffer<span class="token operator">-</span>memory<span class="token operator">:</span> <span class="token number">33554432</span>
      # 键的序列化方式
      key<span class="token operator">-</span>serializer<span class="token operator">:</span> <span class="token class-name"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>common<span class="token punctuation">.</span>serialization<span class="token punctuation">.</span></span>StringSerializer</span>
      # 值的序列化方式
      value<span class="token operator">-</span>serializer<span class="token operator">:</span> <span class="token class-name"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>common<span class="token punctuation">.</span>serialization<span class="token punctuation">.</span></span>StringSerializer</span>
      acks<span class="token operator">:</span> all # 可以设置的值为：all， <span class="token operator">-</span><span class="token number">1</span>， <span class="token number">0</span>， <span class="token number">1</span>

    consumer<span class="token operator">:</span>
      # 自动提交的时间间隔 在spring boot <span class="token number">2.</span>X 版本中这里采用的是值的类型为<span class="token class-name">Duration</span> 需要符合特定的格式，如<span class="token number">1</span>S，<span class="token number">1</span>M，<span class="token number">2</span>H，<span class="token number">5D</span> 
      auto<span class="token operator">-</span>commit<span class="token operator">-</span>interval<span class="token operator">:</span> <span class="token number">1</span>s
      group<span class="token operator">-</span>id<span class="token operator">:</span> order
        # 该属性指定了消费者在读取一个没有偏移量的分区或者偏移量无效的情况下该作何处理：
      # latest（默认值）在偏移量无效的情况下，消费者将从最新的记录开始读取数据（在消费者启动之后生成的记录）
      # earliest ：在偏移量无效的情况下，消费者将从起始位置读取分区的记录
      auto<span class="token operator">-</span>offset<span class="token operator">-</span>reset<span class="token operator">:</span> earliest
      # 是否自动提交偏移量，默认值是<span class="token boolean">true</span>，为了避免出现重复数据和数据丢失，可以把它设置为<span class="token boolean">false</span>，然后手动提交偏移量
      enable<span class="token operator">-</span>auto<span class="token operator">-</span>commit<span class="token operator">:</span> <span class="token boolean">false</span>
      # 键的反序列化方式
      key<span class="token operator">-</span>deserializer<span class="token operator">:</span> <span class="token class-name"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>common<span class="token punctuation">.</span>serialization<span class="token punctuation">.</span></span>StringDeserializer</span>
      # 值的反序列化方式
      value<span class="token operator">-</span>deserializer<span class="token operator">:</span> <span class="token class-name"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>common<span class="token punctuation">.</span>serialization<span class="token punctuation">.</span></span>StringDeserializer</span>

    listener<span class="token operator">:</span>
      # 设置并发数
      concurrency<span class="token operator">:</span> <span class="token number">3</span>
      #listner负责ack，每调用一次，就立即commit
      ack<span class="token operator">-</span>mode<span class="token operator">:</span> manual_immediate
      missing<span class="token operator">-</span>topics<span class="token operator">-</span>fatal<span class="token operator">:</span> <span class="token boolean">false</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3-增加constant-java" tabindex="-1"><a class="header-anchor" href="#_3-增加constant-java" aria-hidden="true">#</a> （3）增加Constant.java</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>constant</span><span class="token punctuation">;</span>

<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Constant</span> <span class="token punctuation">{</span>
    <span class="token doc-comment comment">/**
     * topic
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">TOPIC_TEST1</span> <span class="token operator">=</span> <span class="token string">"topic_test1"</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * group
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">TOPIC_GROUP1</span> <span class="token operator">=</span> <span class="token string">"topic_group1"</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4-增加生产者messageservicekafkaimpl-java和messageservice-java" tabindex="-1"><a class="header-anchor" href="#_4-增加生产者messageservicekafkaimpl-java和messageservice-java" aria-hidden="true">#</a> (4)增加生产者MessageServiceKafkaImpl.java和MessageService.java</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>
<span class="token keyword">package</span> <span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>service</span><span class="token punctuation">;</span>

<span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">MessageService</span> <span class="token punctuation">{</span>
    <span class="token keyword">void</span> <span class="token function">sendMessage</span><span class="token punctuation">(</span><span class="token class-name">String</span> id<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>



<span class="token keyword">package</span> <span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>service<span class="token punctuation">.</span>impl</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>constant<span class="token punctuation">.</span></span><span class="token class-name">Constant</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>service<span class="token punctuation">.</span></span><span class="token class-name">MessageService</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>beans<span class="token punctuation">.</span>factory<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">Autowired</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>core<span class="token punctuation">.</span></span><span class="token class-name">KafkaTemplate</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>support<span class="token punctuation">.</span></span><span class="token class-name">SendResult</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>stereotype<span class="token punctuation">.</span></span><span class="token class-name">Service</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ListenableFuture</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ListenableFutureCallback</span></span><span class="token punctuation">;</span>


<span class="token annotation punctuation">@Service</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MessageServiceKafkaImpl</span> <span class="token keyword">implements</span> <span class="token class-name">MessageService</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@Autowired</span>
    <span class="token keyword">private</span> <span class="token class-name">KafkaTemplate</span><span class="token operator">&lt;</span><span class="token class-name">String</span>， <span class="token class-name">Object</span><span class="token operator">></span> kafkaTemplate<span class="token punctuation">;</span>


    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">sendMessage</span><span class="token punctuation">(</span><span class="token class-name">String</span> id<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"待发送短信的订单已纳入处理队列（kafka），id："</span> <span class="token operator">+</span> id<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 发送消息</span>
        <span class="token class-name">ListenableFuture</span><span class="token operator">&lt;</span><span class="token class-name">SendResult</span><span class="token operator">&lt;</span><span class="token class-name">String</span>， <span class="token class-name">Object</span><span class="token operator">>></span> future <span class="token operator">=</span> kafkaTemplate<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token class-name">Constant</span><span class="token punctuation">.</span><span class="token constant">TOPIC_TEST1</span>， id<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 监听消息加入队列结果返回</span>
        future<span class="token punctuation">.</span><span class="token function">addCallback</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ListenableFutureCallback</span><span class="token operator">&lt;</span><span class="token class-name">SendResult</span><span class="token operator">&lt;</span><span class="token class-name">String</span>， <span class="token class-name">Object</span><span class="token operator">>></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>

            <span class="token annotation punctuation">@Override</span>
            <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">onSuccess</span><span class="token punctuation">(</span><span class="token class-name">SendResult</span><span class="token operator">&lt;</span><span class="token class-name">String</span>， <span class="token class-name">Object</span><span class="token operator">></span> stringObjectSendResult<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"生产者发送成功（kafka），id："</span> <span class="token operator">+</span> id<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>

            <span class="token annotation punctuation">@Override</span>
            <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">onFailure</span><span class="token punctuation">(</span><span class="token class-name">Throwable</span> throwable<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"生产者发送失败（kafka），id："</span> <span class="token operator">+</span> id<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">//        kafkaTemplate.send("ztq"， id);</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5-增加消费者messagelistener-java" tabindex="-1"><a class="header-anchor" href="#_5-增加消费者messagelistener-java" aria-hidden="true">#</a> (5)增加消费者MessageListener.java</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>consumer</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>constant<span class="token punctuation">.</span></span><span class="token class-name">Constant</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>clients<span class="token punctuation">.</span>consumer<span class="token punctuation">.</span></span><span class="token class-name">ConsumerRecord</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">KafkaListener</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>support<span class="token punctuation">.</span></span><span class="token class-name">Acknowledgment</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>kafka<span class="token punctuation">.</span>support<span class="token punctuation">.</span></span><span class="token class-name">KafkaHeaders</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>messaging<span class="token punctuation">.</span>handler<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">Header</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>stereotype<span class="token punctuation">.</span></span><span class="token class-name">Component</span></span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span></span><span class="token class-name">Optional</span></span><span class="token punctuation">;</span>

<span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MessageListener</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@KafkaListener</span><span class="token punctuation">(</span>topics <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token class-name">Constant</span><span class="token punctuation">.</span><span class="token constant">TOPIC_TEST1</span><span class="token punctuation">}</span>， groupId <span class="token operator">=</span> <span class="token class-name">Constant</span><span class="token punctuation">.</span><span class="token constant">TOPIC_GROUP1</span><span class="token punctuation">)</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">onMessage</span><span class="token punctuation">(</span><span class="token class-name">ConsumerRecord</span><span class="token operator">&lt;</span><span class="token operator">?</span>， <span class="token operator">?</span><span class="token operator">></span> <span class="token keyword">record</span>， <span class="token class-name">Acknowledgment</span> ack，
                          <span class="token annotation punctuation">@Header</span><span class="token punctuation">(</span><span class="token class-name">KafkaHeaders</span><span class="token punctuation">.</span><span class="token constant">RECEIVED_TOPIC</span><span class="token punctuation">)</span> <span class="token class-name">String</span> topic<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">Optional</span> message <span class="token operator">=</span> <span class="token class-name">Optional</span><span class="token punctuation">.</span><span class="token function">ofNullable</span><span class="token punctuation">(</span>record<span class="token punctuation">.</span><span class="token function">value</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span>message<span class="token punctuation">.</span><span class="token function">isPresent</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">Object</span> msg <span class="token operator">=</span> message<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"已完成短信发送业务(kafka)，id："</span> <span class="token operator">+</span> msg<span class="token punctuation">)</span><span class="token punctuation">;</span>
            ack<span class="token punctuation">.</span><span class="token function">acknowledge</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_6-增加测试类sendmessagetest-java" tabindex="-1"><a class="header-anchor" href="#_6-增加测试类sendmessagetest-java" aria-hidden="true">#</a> (6)增加测试类SendMessageTest.java</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>init</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">com<span class="token punctuation">.</span>example<span class="token punctuation">.</span>service<span class="token punctuation">.</span></span><span class="token class-name">MessageService</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>beans<span class="token punctuation">.</span>factory<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">Autowired</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>stereotype<span class="token punctuation">.</span></span><span class="token class-name">Service</span></span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">PostConstruct</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span></span><span class="token class-name">UUID</span></span><span class="token punctuation">;</span>

<span class="token annotation punctuation">@Service</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">SendMessageTest</span> <span class="token punctuation">{</span>


    <span class="token annotation punctuation">@Autowired</span>
    <span class="token keyword">private</span> <span class="token class-name">MessageService</span> messageService<span class="token punctuation">;</span>

    <span class="token annotation punctuation">@PostConstruct</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">send</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">100</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            messageService<span class="token punctuation">.</span><span class="token function">sendMessage</span><span class="token punctuation">(</span><span class="token constant">UUID</span><span class="token punctuation">.</span><span class="token function">randomUUID</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


