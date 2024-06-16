<template><div><h3 id="disruptor中发布事件相关类" tabindex="-1"><a class="header-anchor" href="#disruptor中发布事件相关类" aria-hidden="true">#</a> Disruptor中发布事件相关类</h3>
<h4 id="ringbuffer、eventfactory" tabindex="-1"><a class="header-anchor" href="#ringbuffer、eventfactory" aria-hidden="true">#</a> RingBuffer、EventFactory</h4>
<p>EventFactory：提供给RingBuffer做事件预填充</p>
<p>Event事件：</p>
<p>1、从生产者到消费者过程中所处理的数据单元；</p>
<p>2、在Disruptor框架中没有类表示Event，因为它完全是由用户定义的，在Disruptor框架中是用泛型表示的；</p>
<h3 id="disruptor中的等待策略" tabindex="-1"><a class="header-anchor" href="#disruptor中的等待策略" aria-hidden="true">#</a> Disruptor中的等待策略</h3>
<h4 id="waitstrategy" tabindex="-1"><a class="header-anchor" href="#waitstrategy" aria-hidden="true">#</a> WaitStrategy</h4>
<p>等待策略的接口</p>
<h4 id="blockingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#blockingwaitstrategy" aria-hidden="true">#</a> BlockingWaitStrategy</h4>
<p>BlockingWaitStrategy的实现方法是阻塞等待。当要求节省CPU资源，而不要求高吞吐量和低延迟的时候使用这个策略</p>
<h4 id="busyspinwaitstrategy" tabindex="-1"><a class="header-anchor" href="#busyspinwaitstrategy" aria-hidden="true">#</a> BusySpinWaitStrategy</h4>
<p>BusySpinWaitStrategy的实现方法是自旋等待。这种策略会利用CPU资源来避免系统调用带来的延迟抖动，当线程可以绑定到指定CPU(核)的时候，最好使用这个策略。</p>
<h4 id="liteblockingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#liteblockingwaitstrategy" aria-hidden="true">#</a> LiteBlockingWaitStrategy</h4>
<p>试图消除有条件的唤醒。相比BlockingWaitStrategy，LiteBlockingWaitStrategy的实现方法也是阻塞等待，但它会减少一些不必要的唤醒。</p>
<p>从源码的注释上看，这个策略在基准性能测试上是会表现出一些性能提升。这种等待策略应该被认为是实验性的，因为官方作者还没有完全证明锁定省略代码的正确性。</p>
<h4 id="litetimeoutblockingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#litetimeoutblockingwaitstrategy" aria-hidden="true">#</a> LiteTimeoutBlockingWaitStrategy</h4>
<p>TimeoutBlockingWaitStrategy的一个变形，当锁无效时，试图无条件唤醒</p>
<h4 id="phasedbackoffwaitstrategy" tabindex="-1"><a class="header-anchor" href="#phasedbackoffwaitstrategy" aria-hidden="true">#</a> PhasedBackoffWaitStrategy</h4>
<p>PhasedBackoffWaitStrategy的实现方法是先自旋(10000次)，不行再临时让出调度(yield)，不行再使用其他的策略进行等待。可以根据具体场景自行设置自旋时间、yield时间和备用等待策略。</p>
<h4 id="sleepingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#sleepingwaitstrategy" aria-hidden="true">#</a> SleepingWaitStrategy</h4>
<p>SleepingWaitStrategy的实现方法是先自旋，不行再临时让出调度(Thread.yield())，不行再短暂的阻塞等待。<br>
对于既想取得高性能，由不想太浪费CPU资源的场景，这个策略是一种比较好的折中方案。</p>
<h4 id="timeoutblockingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#timeoutblockingwaitstrategy" aria-hidden="true">#</a> TimeoutBlockingWaitStrategy</h4>
<p>TimeoutBlockingWaitStrategy的实现方法是阻塞给定的时间，超过时间的话会抛出超时异常。</p>
<h4 id="yieldingwaitstrategy" tabindex="-1"><a class="header-anchor" href="#yieldingwaitstrategy" aria-hidden="true">#</a> YieldingWaitStrategy</h4>
<p>Yielding 策略：在自旋100次尝试后，让出cpu资源，等待下次cpu调度后再行尝试。这个策略会100%消耗CPU，如果其他线程需要CPU资源，但是比忙碌旋转策略（busy spin strategy）更容易放弃CPU该策略在高性能与CPU资源之间取舍的折中方案，这个策略不会带来显著的延迟抖动。</p>
<h3 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h3>
<table>
<thead>
<tr>
<th>等待策略  所在包com.Imax.disruptor</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>Class BlockingWaitStrategy</td>
<td>阻塞等待。当要求节省CPU资源，而不要求高吞吐量和低延迟的时候使用这个策略。</td>
</tr>
<tr>
<td>Class BusySpinWaitStrategy</td>
<td>自旋等待。这种策略会利用CPU资源来避免系统调用带来的延迟抖动，当线程可以绑定到指定CPU(核)的时候，最好使用这个策略。</td>
</tr>
<tr>
<td>Class LiteBlockingWaitStrategy</td>
<td>阻塞等待。相比BlockingWaitStrategy，它会减少一些不必要的唤醒。从而性能好。这种等待策略应该被认为是实验性的，因为官方作者还没有完全证明锁定省略代码的正确性。</td>
</tr>
<tr>
<td>Class TimeoutBlockingWaitStrategy</td>
<td>阻塞给定的时间，超过时间的话会抛出超时异常。</td>
</tr>
<tr>
<td>Class LiteTimeoutBlockingWaitStrategy</td>
<td>TimeoutBlockingWaitStrategy的一个变形，当锁无效时，试图无条件唤醒。</td>
</tr>
<tr>
<td>Class PhasedBackoffWaitStrategy</td>
<td>先自旋(10000次)，不行再临时让出调度(yield)，不行再使用其他的策略进行等待。可以根据具体场景自行设置自旋时间、yield时间和备用等待策略。</td>
</tr>
<tr>
<td>Class SleepingWaitStrategy</td>
<td>先自旋，不行再临时让出调度(Thread.yield())，不行再短暂的阻塞等待。对于既想取得高性能，由不想太浪费CPU资源的场景，这个策略是一种比较好的折中方案。</td>
</tr>
<tr>
<td>Class YieldingWaitStrategy</td>
<td>在自旋100次尝试后，让出cpu资源这个策略会100%消耗CPU，如果其他线程需要CPU资源，但是比忙碌旋转策略（busy spin strategy）更容易放弃CPU。该策略在高性能与CPU资源之间取舍的折中方案，这个策略不会带来显著的延迟抖动。，等待下次cpu调度后再行尝试。</td>
</tr>
<tr>
<td>Interface WaitStrategy</td>
<td>上述等待策略实现接口</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>工具类 所在包com.imax.disruptor.util</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>Enum DaemonThreadFactory</td>
<td>访问ThreadFactory实例。 所有线程都是使用setDaemon(true)创建的守护线程</td>
</tr>
<tr>
<td>Class ThreadHints</td>
<td>用于运行时提高代码性能的提示，</td>
</tr>
<tr>
<td>Class Util</td>
<td>主要用于计算的工具类</td>
</tr>
<tr>
<td>Enum BasicExecutor （com.lmax.disruptor.dsl）</td>
<td>只是简单的实现了Executor接口,用于解决没有传递Executor对象的时候使用默认的BasicExecutor即可,可以理解就是默认提供的线程池对象</td>
</tr>
<tr>
<td>Class BasicExecutor（com.lmax.disruptor.dsl）</td>
<td>默认提供的线程池对象</td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>序列类 所在包com.imax.disruptor</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>Class Sequence</td>
<td>环真正的序列。除了缓存行的填充。Sequence类的其他set、get等方法都是通过UNSAFE对象实现对value值的原子操作</td>
</tr>
<tr>
<td>Class SequenceGroup</td>
<td>继承Sequence，序列组，是用来对sequences属性进行原子更新的，这个类里的sequences数组可以动态的进行增加、删减。</td>
</tr>
<tr>
<td>Class SequenceGroups</td>
<td>用于管理SequenceGroup对象的静态方法</td>
</tr>
<tr>
<td>Class FixedSequenceGroup</td>
<td>包含了若干序列的一个包装类，继承了Sequence只重写了get方法、获取内部序列组中最小的序列值，但其他的&quot;写&quot;方法都不支持。</td>
</tr>
<tr>
<td>Interface Sequencer</td>
<td>通过Sequencer的大部分功能来使用序列。通过Sequencer可以得到一个SequenceBarrier</td>
</tr>
<tr>
<td>Interface SequenceBarrier</td>
<td>消费者主要通过SequenceBarrier来使用序列。读取当前序列值。判断序列是否可用，是否可以消费。对消费者进通知。</td>
</tr>
<tr>
<td>Interface ProcessingSequenceBarrier</td>
<td>SequenceBarrier的具体实现</td>
</tr>
<tr>
<td>Class AbstractSequencer</td>
<td>AbstractSequencer实现了Sequencer，是SingleProducerSequencer和MultiProducerSequencer的基类，基本上的作用就是管理追踪序列和关联当前序列</td>
</tr>
<tr>
<td>Class SingleProducerSequencer</td>
<td>申请序列，发布序列，唤醒消费者</td>
</tr>
<tr>
<td>Class MultiProducerSequencer</td>
<td>适用于多线程的消费者，申请序列，发布序列，唤醒消费者</td>
</tr>
<tr>
<td>Interface Sequenced</td>
<td>Sequenced接口提供的方法都是用来给生产者使用，用于申请序列，发布序列的</td>
</tr>
<tr>
<td>Interface Cursored</td>
<td>Cursored接口只有一个方法，getCursor就是用来获取当前游标的位置，也就是用来获取当前生产者的实时位置。</td>
</tr>
<tr>
<td>Interface SequenceReportingEventHandler</td>
<td>在完成消费事件时通知并设置回调</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>队列类 所在包com.imax.disruptor</th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>Interface EventSequencer</td>
<td>EventSequencer扩展了Sequenced，提供了一些序列功能；同时扩展了DataProvider，提供了按序列值来获取数据的功能。</td>
</tr>
<tr>
<td>Interface DataProvider</td>
<td>提供了按序列值来获取数据的功能</td>
</tr>
<tr>
<td>Interface EventSink</td>
<td>EventSink主要是提供发布事件(就是往队列上放数据)的功能，接口上定义了以各种姿势发布事件的方法。</td>
</tr>
<tr>
<td>Class RingBuffer</td>
<td>数组实现的内部队列。RingBuffer提供了静态工厂方法分别针对单事件发布者和多事件发布者的情况进行RingBuffer实例创建。</td>
</tr>
<tr>
<td>Class DataProvider</td>
<td>DataProvider 提供了根据序列获取对应的对象有两个地方调用。第一是这个Event对象需要被生产者获取往里面填充数据。第二个是在消费时，获取这个Event对象用于消费 *</td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>异常处理类 所在包com.imax.disruptor</th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>Interface ExceptionHandler</td>
<td>事件处理周期中未捕获异常的回调处理程序的接口</td>
</tr>
<tr>
<td>Class ExceptionHandlerWrapper(com.lmax.disruptor.dsl)</td>
<td>异常处理的包装类</td>
</tr>
<tr>
<td>Class IgnoreExceptionHandler</td>
<td>INFO的异常处理程序的便捷实现</td>
</tr>
<tr>
<td>Class FatalExceptionHandler</td>
<td>SEVERE(严重)的异常处理程序的便捷实</td>
</tr>
<tr>
<td>Class InsufficientCapacityException</td>
<td>如果在没有包装消耗序列的情况下，无法将值插入RingBuffer，则抛出异常</td>
</tr>
<tr>
<td>Class ExceptionHandlerSetting（com.lmax.disruptor.dsl）</td>
<td>为特定消费者设置异常处理程序的支持类</td>
</tr>
<tr>
<td></td>
<td></td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>事件类 所在包com.imax.disruptor</th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>Inetface EventSink</td>
<td>这个类主要是提供发布事件(就是往队列上放数据)的功能</td>
</tr>
<tr>
<td>Interface EventFactory</td>
<td>由RingBuffer调用，以预先调用所有事件以填充RingBuffer</td>
</tr>
<tr>
<td>Interface EventHandler</td>
<td>回调接口，用于处理RingBuffer中可用的事件</td>
</tr>
<tr>
<td>Class EventPoller</td>
<td>用于Disruptor的基于轮询。 通过给定的数据提生产者控制序列来创建一个EventPoller</td>
</tr>
<tr>
<td>Interface EventProcessor</td>
<td>事件处理器会等待RingBuffer中的事件变为可用(可处理)，然后处理可用的事件</td>
</tr>
<tr>
<td>Interface EventSequencer</td>
<td>EventSequencer扩展了Sequenced，提供了一些序列功能；同时扩展了DataProvider，提供了按序列值来获取数据的功能。</td>
</tr>
<tr>
<td>Interface EventTranslator</td>
<td>在发布事件时需要传一个事件转换的接口，内部用这个接口做一下数据到事件的转换。</td>
</tr>
</tbody>
</table>
<p>时序图</p>
<figure><img src="/assets/images/8ab72b98.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>类图</p>
<figure><img src="/assets/images/1618295759372.png" alt="1618295759372" tabindex="0" loading="lazy"><figcaption>1618295759372</figcaption></figure>
<p>参考资料：<a href="https://brokendreams.iteye.com/blog/2255720" target="_blank" rel="noopener noreferrer">https://brokendreams.iteye.com/blog/2255720<ExternalLinkIcon/></a></p>
<p><a href="http://www.ibigdata.io/?p=92" target="_blank" rel="noopener noreferrer">http://www.ibigdata.io/?p=92<ExternalLinkIcon/></a></p>
</div></template>


