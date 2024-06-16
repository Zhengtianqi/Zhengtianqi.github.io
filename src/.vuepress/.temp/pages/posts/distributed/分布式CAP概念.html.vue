<template><div><p>​		2000年7月，加州大学伯克利分校的Eric Brewer教授ACM PODC会议上提出CAP猜想。两年后，麻省理工学院的seth Gilbert和Nancy Lynch从理论上证明了CAP。之后，CAP理论正式成为分布式计算领域的公认理论。(理论是有时间期限的，没有绝对意义上的公理，是相对于目前计算机科学水平)；</p>
<h2 id="cap原理概述" tabindex="-1"><a class="header-anchor" href="#cap原理概述" aria-hidden="true">#</a> CAP原理概述</h2>
<p>​      一个分布式系统最多只能同时满足一致性(consistency)、可用性(Availability)、分区容错性(Partition tolerance)的两个</p>
<figure><img src="/assets/images/image-20201214134902337.png" alt="image-20201214134902337" tabindex="0" loading="lazy"><figcaption>image-20201214134902337</figcaption></figure>
<h2 id="consistency-一致性" tabindex="-1"><a class="header-anchor" href="#consistency-一致性" aria-hidden="true">#</a> Consistency 一致性</h2>
<p>​		一致性指“all nodes see the same data at the same time”，即更新操作成功并返回客户端完成后，所有节点在同一时间的数据完全一致，所以，一致性，说的就是数据一致性。分布式的一致性。<br>
​		对于一致性，可以分为从客户端和服务端两个不同的视角。从客户端来看，一致性主要指的是多并发访问时更新过的数据如何获取的问题。从服务端来看，则是更新如何复制分布到整个系统，以保证数据最终一致。<br>
​		一致性是因为有并发读写才有的问题，因此在理解一致性的问题时，一定要注意结合考虑并发读写的场景。从客户端角度，多进程并发访问时，更新过的数据在不同进程如何获取的不同策略，决定了不同的一致性。</p>
<h2 id="三种一致性策略" tabindex="-1"><a class="header-anchor" href="#三种一致性策略" aria-hidden="true">#</a> 三种一致性策略</h2>
<p>​		对于关系型数据库，要求更新过的数据能被后续的访问都能看到，这是强一致性。<br>
​		如果能容忍后续的部分或者全部访问不到，则是弱一致性。<br>
​		如果经过一段时间后要求能访问到更新后的数据，则是最终一致性。<br>
​		CAP中说，不可能同时满足的这个一致性指的是强一致性。</p>
<h2 id="availability-可用性" tabindex="-1"><a class="header-anchor" href="#availability-可用性" aria-hidden="true">#</a> Availability 可用性</h2>
<p>​		可用性指“Reads and writes always succeed”，即服务一直可用，而且是正常响应时间。<br>
​		对于一个可用性的分布式系统，每一个非故障的节点必须对每一个请求作出响应。所以，在衡量一个系统的可用性的时候，都是通过停机时间来计算的，借鉴淘宝的标准如下：</p>
<figure><img src="/assets/images/image-20201214135053884.png" alt="image-20201214135053884" tabindex="0" loading="lazy"><figcaption>image-20201214135053884</figcaption></figure>
<p>​		通常我们描述一个系统的可用性时，我们说淘宝的系统可用性可以达到5个9，意思就是说他的可用水平是99.999%，即全年停机时间不超过 (1-0.99999)<em>365</em>24*60 = 5.256 min，这是一个极高的要求。</p>
<p>​		好的可用性主要是指系统能够很好的为用户服务，不出现用户操作失败或者访问超时等用户体验不好的情况。一个分布式系统，上下游设计很多系统如负载均衡、WEB服务器、应用代码、数据库服务器等，任何一个节点的不稳定都可以影响可用性。</p>
<h2 id="partition-tolerance分区容错性" tabindex="-1"><a class="header-anchor" href="#partition-tolerance分区容错性" aria-hidden="true">#</a> Partition Tolerance分区容错性</h2>
<p>​		分区容错性指“the system continues to operate despite arbitrary message loss or failure of part of the system”，即分布式系统在遇到某节点或网络分区故障的时候，仍然能够对外提供满足一致性和可用性的服务。<br>
​		分区容错性和扩展性紧密相关。在分布式应用中，可能因为一些分布式的原因导致系统无法正常运转。好的分区容错性要求能够使应用虽然是一个分布式系统，而看上去却好像是在一个可以运转正常的整体。比如现在的分布式系统中有某一个或者几个机器宕掉了，其他剩下的机器还能够正常运转满足系统需求，或者是机器之间有网络异常，将分布式系统分隔未独立的几个部分，各个部分还能维持分布式系统的运作，这样就具有好的分区容错性。<br>
​		简单点说，就是在网络中断，消息丢失的情况下，系统如果还能正常工作，就是有比较好的分区容错性。</p>
<h2 id="ca-without-p" tabindex="-1"><a class="header-anchor" href="#ca-without-p" aria-hidden="true">#</a> CA without P</h2>
<p>​		这种情况在分布式系统中几乎是不存在的。首先在分布式环境下，网络分区是一个自然的事实。因为分区是必然的，所以如果舍弃P，意味着要舍弃分布式系统。那也就没有必要再讨论CAP理论了。这也是为什么在前面的CAP证明中，我们以系统满足P为前提论述了无法同时满足C和A。<br>
比如我们熟知的关系型数据库，如My Sql和Oracle就是保证了可用性和数据一致性，但是他并不是个分布式系统。一旦关系型数据库要考虑主备同步、集群部署等就必须要把P也考虑进来。<br>
​		其实，在CAP理论中。C，A，P三者并不是平等的，CAP之父在《Spanner，真时，CAP理论》一文中写到：<br>
如果说Spanner真有什么特别之处，那就是谷歌的广域网。Google通过建立私有网络以及强大的网络工程能力来保证P，在多年运营改进的基础上，在生产环境中可以最大程度的减少分区发生，从而实现高可用性。<br>
​		从Google的经验中可以得到的结论是，无法通过降低CA来提升P。要想提升系统的分区容错性，需要通过提升基础设施的稳定性来保障。<br>
​		所以，对于一个分布式系统来说。P是一个基本要求，CAP三者中，只能在CA两者之间做权衡，并且要想尽办法提升P。</p>
<h2 id="cp-without-a" tabindex="-1"><a class="header-anchor" href="#cp-without-a" aria-hidden="true">#</a> CP without A</h2>
<p>​		如果一个分布式系统不要求强的可用性，即容许系统停机或者长时间无响应的话，就可以在CAP三者中保障CP而舍弃A。一个保证了CP而一个舍弃了A的分布式系统，一旦发生网络故障或者消息丢失等情况，就要牺牲用户的体验，等待所有数据全部一致了之后再让用户访问系统。<br>
​		设计成CP的系统其实也不少，其中最典型的就是很多分布式数据库，他们都是设计成CP的。在发生极端情况时，优先保证数据的强一致性，代价就是舍弃系统的可用性。如Redis、HBase等，还有分布式系统中常用的Zookeeper也是在CAP三者之中选择优先保证CP的。<br>
​		无论是像Redis、HBase这种分布式存储系统，还是像Zookeeper这种分布式协调组件。数据的一致性是他们最最基本的要求。一个连数据一致性都保证不了的分布式存储要他有何用？</p>
<h2 id="cpwithouta示例说明" tabindex="-1"><a class="header-anchor" href="#cpwithouta示例说明" aria-hidden="true">#</a> CPwithoutA示例说明</h2>
<p>ZooKeeper是个CP（一致性+分区容错性）<br>
即任何时刻对ZooKeeper的访问请求能得到一致的数据结果，同时系统对网络分割具备容错性。但是它不能保证每次服务请求的可用性，也就是在极端环境下(出现网络分区的情况下，需要重新选主节点，这个时候zookeeper是不能立即响应请求的)，ZooKeeper可能会丢弃一些请求，消费者程序需要重新请求才能获得结果。ZooKeeper是分布式协调服务，它的职责是保证数据在其管辖下的所有服务之间保持同步、一致。所以就不难理解为什么ZooKeeper被设计成CP而不是AP特性的了。</p>
<h2 id="hbase是强一致性系统" tabindex="-1"><a class="header-anchor" href="#hbase是强一致性系统" aria-hidden="true">#</a> HBase是强一致性系统</h2>
<p>Hbase具有以下特点<br>
•	每个值只出现在一个REGION<br>
•	同一时间一个Region只分配给一个Region服务器<br>
•	行内的mutation操作都是原子的(原子性操作是指：如果把一个事务可看作是一个程序,它要么完整的被执行,要么完全不执行)。<br>
•	put操作要么成功，要么完全失败。</p>
<p>​		联系上文提到的一致性特点，可以得出HBase是强一致性系统的结论。</p>
<p>​		当某台region server fail的时候，它管理的region failover到其他region server时，需要根据WAL log（Write-Ahead Logging）来redo(redolog，有一种日志文件叫做重做日志文件)，这时候进行redo的region应该是unavailable的，所以hbase降低了可用性，提高了一致性。设想一下，如果redo的region能够响应请求，那么可用性提高了，则必然返回不一致的数据(因为redo可能还没完成)，那么hbase就降低一致性来提高可用性了。</p>
<h2 id="cpwithouta示例说明-1" tabindex="-1"><a class="header-anchor" href="#cpwithouta示例说明-1" aria-hidden="true">#</a> CPwithoutA示例说明</h2>
<h2 id="ap-wihtout-c" tabindex="-1"><a class="header-anchor" href="#ap-wihtout-c" aria-hidden="true">#</a> AP wihtout C</h2>
<p>​		要高可用并允许分区，则需放弃一致性。一旦网络问题发生，节点之间可能会失去联系。为了保证高可用，需要在用户访问时可以马上得到返回，则每个节点只能用本地数据提供服务，而这样会导致全局数据的不一致性。<br>
​		这种舍弃强一致性而保证系统的分区容错性和可用性的场景和案例非常多。前面我们介绍可用性的时候说到过，很多系统在可用性方面会做很多事情来保证系统的全年可用性可以达到N个9，所以，对于很多业务系统来说，比如淘宝的购物，12306的买票。都是在可用性和一致性之间舍弃了一致性而选择可用性。</p>
<h2 id="apwithoutc示例说明" tabindex="-1"><a class="header-anchor" href="#apwithoutc示例说明" aria-hidden="true">#</a> APwithoutC示例说明</h2>
<p>​		你在xx电商双十一购物的时候，同时下单的并发很高，如果先检查库存，再减库存，确定下单的话，效率会很低，减库存+下单的原子操作成为系统瓶颈，效应时间过长，用户体验就非常差了，为了提高用户体验，不用每一次下单都减库存，而是隔一段时间检查库存，这样会导致商家超卖，用户下单体验好了，超卖的那部分用户的收货时候就会出现库存不足，收货延迟的现象。<br>
你在12306买票的时候肯定遇到过这种场景，当你购买的时候提示你是有票的（但是可能实际已经没票了），你也正常的去输入验证码，下单了。但是过了一会系统提示你下单失败，余票不足。这其实就是先在可用性方面保证系统可以正常的服务，然后在数据的一致性方面做了些牺牲，会影响一些用户体验，但是也不至于造成用户流程的严重阻塞。<br>
​      我们说很多网站牺牲了一致性，选择了可用性，这其实也不准确的。就比如上面的买票的例子，其实舍弃的只是强一致性。退而求其次保证了最终一致性。也就是说，虽然下单的瞬间，关于车票的库存可能存在数据不一致的情况，但是过了一段时间，还是要保证最终一致性的。<br>
对于多数大型互联网应用的场景，主机众多、部署分散，而且现在的集群规模越来越大，所以节点故障、网络故障是常态，而且要保证服务可用性达到N个9，即保证P和A，舍弃C（退而求其次保证最终一致性）。虽然某些地方会影响客户体验，但没达到造成用户流程的严重程度。</p>
<h2 id="apwithoutc示例说明-1" tabindex="-1"><a class="header-anchor" href="#apwithoutc示例说明-1" aria-hidden="true">#</a> APwithoutC示例说明</h2>
<p>​		上面介绍了如何CAP中权衡及取舍以及典型的案例。孰优孰略，没有定论，只能根据场景定夺，适合的才是最好的。<br>
​		对于涉及到钱财这样不能有一丝让步的场景，C必须保证。网络发生故障宁可停止服务，这是保证CA，舍弃P。比如前几年支付宝光缆被挖断的事件，在网络出现故障的时候，支付宝就在可用性和数据一致性之间选择了数据一致性，用户感受到的是支付宝系统长时间宕机，但是其实背后是无数的工程师在恢复数据，保证数数据的一致性。<br>
​		对于其他场景，比较普遍的做法是选择可用性和分区容错性，舍弃强一致性，退而求其次使用最终一致性来保证数据的安全。这其实是分布式领域的另外一个理论——BASE理论(CAP的C变成最终一致性)。</p>
</div></template>


