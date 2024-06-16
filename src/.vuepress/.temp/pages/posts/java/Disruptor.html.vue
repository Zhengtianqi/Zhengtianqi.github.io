<template><div><h1 id="disruptor" tabindex="-1"><a class="header-anchor" href="#disruptor" aria-hidden="true">#</a> <a href="https://github.com/LMAX-Exchange/disruptor" target="_blank" rel="noopener noreferrer">disruptor<ExternalLinkIcon/></a></h1>
<p>------高性能的线程间消息传递框架</p>
<h2 id="介绍" tabindex="-1"><a class="header-anchor" href="#介绍" aria-hidden="true">#</a> 介绍：</h2>
<p>Disruptor类似于java的BlockingQueue。与队列一样，Disruptor的目的是在同一进程内的线程之间传递数据。</p>
<p>但是，Disruptor提供了与队列不同的关键功能：</p>
<p>1、同一个“事件”可以有多个消费者，消费者之间既可以并行处理，也可以相互依赖形成处理的先后次序(形成一个依赖图)</p>
<p>2、为事件（events）预先分配内存空间</p>
<p>3、针对极高的性能目标而实现的极度优化和无锁的设计；</p>
<p>​    应用场景：</p>
<h2 id="类图" tabindex="-1"><a class="header-anchor" href="#类图" aria-hidden="true">#</a> 类图：</h2>
<figure><img src="/assets/images/5a377b3b.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<h2 id="核心概念" tabindex="-1"><a class="header-anchor" href="#核心概念" aria-hidden="true">#</a> 核心概念：</h2>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/RingBuffer.java" target="_blank" rel="noopener noreferrer">RingBuffer<ExternalLinkIcon/></a> 从3.0开始，RingBuffer仅负责存储和更新通过Disruptor的数据（事件）。它是Disruptor底层数据结构实现，核心类，是线程间交换数据的中转地。</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/Sequence.java" target="_blank" rel="noopener noreferrer">Sequence<ExternalLinkIcon/></a> 序号，声明一个序号，用于跟踪ringbuffer中任务的变化和消费者的消费情况。</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/Sequencer.java" target="_blank" rel="noopener noreferrer">Sequencer<ExternalLinkIcon/></a> Sequencer 是 Disruptor 的真正核心。此接口有两个实现类 SingleProducerSequencer、MultiProducerSequencer ，它们定义在生产者和消费者之间快速、正确地传递数据的并发算法。</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/SequenceBarrier.java" target="_blank" rel="noopener noreferrer">SequenceBarrier<ExternalLinkIcon/></a> 序号栅栏，管理和协调生产者的游标序号和各个消费者的序号，确保生产者不会覆盖消费者未来得及处理的消息，确保存在依赖的消费者之间能够按照正确的顺序处理。</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/WaitStrategy.java" target="_blank" rel="noopener noreferrer">WaitStrategy<ExternalLinkIcon/></a> 定义Consumer如何进行等待下一个事件的策略（注：Disruptor 定义了多种不同的策略，针对不同的场景，提供了不一样的性能表现）。</p>
<p>Event 从生产者传递给消费者的数据单位**。**</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/EventProcessor.java" target="_blank" rel="noopener noreferrer">EventProcessor<ExternalLinkIcon/></a> 事件处理器，监听RingBuffer的事件，并消费可用事件，从RingBuffer读取的事件会交由实际的生产者实现类来消费；它会一直侦听下一个可用的序号，直到该序号对应的事件已经准备好。</p>
<p><a href="https://github.com/LMAX-Exchange/disruptor/blob/master/src/main/java/com/lmax/disruptor/EventHandler.java" target="_blank" rel="noopener noreferrer">EventHandler<ExternalLinkIcon/></a> 业务处理器，是实际消费者的接口，完成具体的业务逻辑实现，用户实现该接口，代表着消费者。</p>
<p>Producer 生产者，用户线程充当该角色，producer向RingBuffer写入事件。</p>
<h2 id="dsl图" tabindex="-1"><a class="header-anchor" href="#dsl图" aria-hidden="true">#</a> DSL图：</h2>
<figure><img src="/assets/images/7f3f75ca.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>Disruptor——对外暴露的门面类，提供start()，stop()，消费者事件注册，生产者事件发布等api；</p>
<p>RingBuffer——对生产者提供下一序号获取、entry元素获取、entry数据更改等api；</p>
<p>EventHandler——消费者的接口定义，提供onEvent()方法，负责具体业务逻辑实现；</p>
<p>EventHandlerGroup——业务处理器分组，管理多个业务处理器的依赖关系，提供then()、before()、after()等api</p>
<h2 id="ringbuffer实现" tabindex="-1"><a class="header-anchor" href="#ringbuffer实现" aria-hidden="true">#</a> RingBuffer实现：</h2>
<p>RingBuffer顾名思义，就是一个内存环，每一次读写操作都循环利用这个内存环，从而避免频繁分配和回收内存，减轻GC压力，同时由于RingBuffer可以实现为无锁的队列，从而整体上大幅提高系统性能。</p>
<p>1.RingBuffer是由一个大数组组成的。（比链表快，对CPU缓存友好）</p>
<p>2.RingBuffer的“指针”（也称为序列或游标）是java long类型的（64位有符号数），指针采用往上计数自增的方式。</p>
<p>3.RingBuffer中的指针进行按RingBuffer的size取模找出数组的下标来定位入口。为了提高性能，通常将RingBuffer的size大小设置成实际使用的2倍。</p>
<figure><img src="/assets/images/a7ade6c9.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>RingBuffer没有尾指针，只维护一个指向下一个可用位置的序号。RingBuffer和常用的队列之间的区别是，不删除buffer中的数据，也就是说这些数据一直存放在buffer中，直到新的数据覆盖他们。</p>
<p><strong>消费者读取数据：</strong></p>
<p>​    <img src="/assets/images/4e12cc06.png" alt="img" loading="lazy"></p>
<p>消费者(<em>Consumer</em>)是一个想从<em>RingBuffer</em>里读取数据的线程，它可以访问<em>ConsumerBarrier</em>对象——这个对象由<em>RingBuffer</em>创建并且代表消费者与<em>RingBuffer</em>进行交互。就像<em>RingBuffer</em>显然需要一个序号才能找到下一个可用节点一样，消费者也需要知道它将要处理的序号——每个消费者都需要找到下一个它要访问的序号。在上面的例子中，消费者处理完了<em>RingBuffer</em>里序号<em>8</em>之前（包括<em>8</em>）的所有数据，那么它期待访问的下一个序号是<em>9</em>。</p>
<p>消费者可以调用<em>ConsumerBarrier</em>对象的*waitFor()*方法，传递它所需要的下一个序号.</p>
<p>final long availableSeq = consumerBarrier.waitFor(nextSequence);</p>
<p><em>ConsumerBarrier</em>返回<em>RingBuffer</em>的最大可访问序号——在上面的例子中是<em>12</em>。</p>
<p>接下来，消费者会一直原地停留，等待更多数据被写入<em>RingBuffer</em>。并且，一旦数据写入后消费者会收到通知——节点<em>9</em>，<em>10</em>，<em>11</em>和<em>12</em> 已写入。现在序号<em>12</em>到了，消费者可以让<em>ConsumerBarrier</em>去拿这些序号节点里的数据了</p>
<figure><img src="/assets/images/227d0458.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>拿到了数据后，消费者(<em><strong>Consumer</strong></em>)会更新自己的标识(<em><strong>cursor</strong></em>)。</p>
<h2 id="这样做有助于平缓延迟的峰值" tabindex="-1"><a class="header-anchor" href="#这样做有助于平缓延迟的峰值" aria-hidden="true">#</a> 这样做有助于平缓延迟的峰值？</h2>
<p>以前需要逐个节点地询问“我可以拿下一个数据吗？现在可以了么？现在呢？”，消费者(<em>Consumer</em>)现在只需要简单的说“当你拿到的数字比我这个要大的时候请告诉我”，函数返回值会告诉它有多少个新的节点可以读取数据了。因为这些新的节点的确已经写入了数据（<em>RingBuffer</em>本身的序号已经更新），而且消费者对这些节点的唯一操作是读而不是写，因此访问不用加锁。这太好了，不仅代码实现起来可以更加安全和简单，而且不用加锁使得速度更快。另一个好处是你可以用多个消费者(<em>Consumer)<em>去读同一个</em>RingBuffer</em> ，不需要加锁，也不需要用另外的队列来协调不同的线程(消费者)。这样你可以在<em>Disruptor</em>的协调下实现真正的并发数据处理。</p>
<h2 id="生产者写入数据" tabindex="-1"><a class="header-anchor" href="#生产者写入数据" aria-hidden="true">#</a> 生产者写入数据：</h2>
<p>写入 RingBuffer 的过程涉及到两阶段提交 (two-phase commit)。首先，你的生产者需要申请 buffer 里的下一个节点。然后，当生产者向节点写完数据，它将会调用 ProducerBarrier 的 commit 方法。</p>
<p>RingBuffer 还是与消费端一样提供了一个 ProducerBarrier 对象，让生产者通过它来写入 RingBuffer。</p>
<p>ProducerBarrier如何防止RingBuffer重叠</p>
<figure><img src="/assets/images/d94cd34e.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>在这幅图中，我们假设只有一个生产者写入 RingBuffer。</p>
<p>ConsumerTrackingProducerBarrier对象拥有所有正在访问 RingBuffer 的消费者列表。Disruptor 由消费者负责通知它们处理到了哪个序列号，而不是 RingBuffer。所以，如果我们想确定我们没有让 RingBuffer 重叠，需要检查所有的消费者们都读到了哪里。</p>
<p>在上图中，有一个 消费者 顺利的读到了最大序号 12（用红色/粉色高亮）。第二个消费者 有点儿落后——可能它在做 I/O 操作之类的——它停在序号 3。因此消费者 2 在赶上消费者 1 之前要跑完整个RingBuffer一圈的距离。</p>
<p>现在生产者想要写入 RingBuffer 中序号 3 占据的节点，因为它是 RingBuffer 当前游标的下一个节点。但是 ProducerBarrier 明白现在不能写入，因为有一个消费者正在占用它。所以，ProducerBarrier 停下来自旋 (spins)，等待，直到那个消费者离开。</p>
<h2 id="申请下一个节点" tabindex="-1"><a class="header-anchor" href="#申请下一个节点" aria-hidden="true">#</a> 申请下一个节点：</h2>
<figure><img src="/assets/images/145d5664.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>ProducerBarier会看到下一个节点——序号 3 那个已经可以用了。它会抢占这个节点上的 Entry（它是一个放写入到某个序号的 RingBuffer 数据的桶），把下一个序号（13）更新成 Entry 的序号，然后把 Entry 返回给生产者。生产者可以接着往 Entry 里写入数据。</p>
<h2 id="提交新的数据" tabindex="-1"><a class="header-anchor" href="#提交新的数据" aria-hidden="true">#</a> 提交新的数据：</h2>
<figure><img src="/assets/images/b235f114.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>当生产者结束向 Entry 写入数据后，它会要求 ProducerBarrier 提交。</p>
<p>ProducerBarrier先等待RingBuffer的游标追上当前的位置（对于单生产者这毫无意义－比如，我们已经知道游标到了 12 ，而且没有其他人正在写入RingBuffer）。然后 ProducerBarrier 更新 RingBuffer 的游标到刚才写入的 Entry 序号－在我们这儿是 13。接下来，ProducerBarrier 会让消费者知道buffer 中有新东西了。它戳一下 ConsumerBarrier 上的 WaitStrategy 对象说－“喂，醒醒！有事情发生了！”（注意－不同的 WaitStrategy 实现以不同的方式来实现提醒，取决于它是否采用阻塞模式）。现在消费者 1 可以读 Entry 13 的数据，消费者 2 可以读 Entry 13 以及前面的所有数据。</p>
<h2 id="producerbarrier上的批处理" tabindex="-1"><a class="header-anchor" href="#producerbarrier上的批处理" aria-hidden="true">#</a> ProducerBarrier上的批处理</h2>
<p>Disruptor 可以同时在生产者和消费者两端实现批处理。</p>
<figure><img src="/assets/images/b4d68165.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>ProducerBarrier 知道 RingBuffer 的游标指向 12，而最慢的消费者在 9 的位置，它就可以让生产者写入节点 3，4，5，6，7 和 8，中间不需要再次检查消费者的位置。</p>
<h2 id="多个生产者的场景" tabindex="-1"><a class="header-anchor" href="#多个生产者的场景" aria-hidden="true">#</a> 多个生产者的场景</h2>
<figure><img src="/assets/images/9cb319ab.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>现在生产者 1 申请提交节点 13 的数据（生产者 1 发出的绿色箭头代表这个请求）。ProducerBarrier 让 ClaimStrategy 先等待 RingBuffer 的游标到达序号 12，当然现在已经到了。因此 RingBuffer 移动游标到 13，让 ProducerBarrier 戳一下 WaitStrategy 告诉所有人都知道 RingBuffer 有更新了。现在 ProducerBarrier 可以完成生产者 2 的请求，让 RingBuffer 移动游标到 14，并且通知所有人都知道。</p>
<p>RingBuffer的内容顺序总是会遵循nextEntry()的初始调用顺序。也就是说，如果一个生产者在写入 RingBuffer 的时候暂停了，只有当它解除暂停后，其他等待中的提交才会立即执行。</p>
<p>资料：</p>
<p>官方<a href="https://github.com/LMAX-Exchange/disruptor/wiki/Introduction" target="_blank" rel="noopener noreferrer">https://github.com/LMAX-Exchange/disruptor/wiki/Introduction<ExternalLinkIcon/></a></p>
<p>官翻<a href="https://www.cnblogs.com/daoqidelv/p/6995888.html" target="_blank" rel="noopener noreferrer">https://www.cnblogs.com/daoqidelv/p/6995888.html<ExternalLinkIcon/></a></p>
<p>博客<a href="http://ifeve.com/dissecting-disruptor-whats-so-special/" target="_blank" rel="noopener noreferrer">http://ifeve.com/dissecting-disruptor-whats-so-special/<ExternalLinkIcon/></a></p>
<p><a href="https://my.oschina.net/u/1765168/blog/1807887" target="_blank" rel="noopener noreferrer">https://my.oschina.net/u/1765168/blog/1807887<ExternalLinkIcon/></a></p>
<p><a href="https://www.jianshu.com/p/f6d0d0c2a647" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/f6d0d0c2a647<ExternalLinkIcon/></a></p>
<p><a href="https://www.jianshu.com/p/4a202ef547cc" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/4a202ef547cc<ExternalLinkIcon/></a></p>
<p>补充：</p>
<p>流程简图：</p>
<figure><img src="/assets/images/d325d29a.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>等待策略</p>
<p>BlockingWaitStrategy默认的等待策略。利用锁和等待机制的WaitStrategyCPU消耗少但是延迟比较高</p>
<p>BusySpinWaitStrategy自旋等待。这种策略会利用CPU资源来避免系统调用带来的延迟抖动当线程可以绑定到指定CPU(核)的时候可以使用这个策略。</p>
<p>LiteBlockingWaitStrategy实现方法也是阻塞等待</p>
<p>SleepingWaitStrategy是另一种较为平衡CPU消耗与延迟的WaitStrategy在不同次数的重试后采用不同的策略选择继续尝试或者让出CPU或者sleep。这种策略延迟不均匀。</p>
<p>TimeoutBlockingWaitStrategy实现方法是阻塞给定的时间超过时间的话会抛出超时异常。</p>
<p>YieldingWaitStrategy实现方法是先自旋(100次)不行再临时让出调度(yield)。和SleepingWaitStrategy一样也是一种高性能与CPU资源之间取舍的折中方案但这个策略不会带来显著的延迟抖动。</p>
<p>PhasedBackoffWaitStrategy实现方法是先自旋(10000次)不行再临时让出调度(yield)不行再使用其他的策略进行等待。可以根据具体场景自行设置自旋时间、yield时间和备用等待策略。</p>
<p>新消费者，怎么获取下标，每个核心类怎么用 实现方式。伪共享</p>
</div></template>


