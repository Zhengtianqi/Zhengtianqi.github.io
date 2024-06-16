<template><div><p>java中池化技术是提前保存大量的资源，以备不时之需以及重复使用。</p>
<h2 id="_1、池化技术" tabindex="-1"><a class="header-anchor" href="#_1、池化技术" aria-hidden="true">#</a> 1、池化技术</h2>
<p>Tips：不是深度学习中的卷积和赤化</p>
<p>在实际应用当做，分配内存、创建进程、线程都会设计到一些系统调用，系统调用需要导致程序从用户态切换到内核态，是非常耗时的操作。因此，当程序中需要频繁的进行内存申请释放，进程、线程创建销毁等操作时，通常会使用内存池、进程池、线程池技术来提升程序的性能。</p>
<p>进程池、线程池：先启动若干数量的线程，并让这些线程都处于睡眠状态，当需要一个开辟一个线程去做具体的工作时，就会唤醒线程池中的某一个睡眠线程，让它去做具体工作，当工作完成后，线程又处于睡眠状态，而不是将线程销毁。当线程数达到一定数量时，可以在队列中等待。</p>
<p>内存池：内存池是指程序预先从操作系统申请一块足够大内存，此后，当程序中需要申请内存的时候，不是直接向操作系统申请，而是直接从内存池中获取；同理，当程序释放内存的时候，并不真正将内存返回给操作系统，而是返回内存池。当程序退出(或者特定时间)时，内存池才将之前申请的内存真正释放。</p>
<h2 id="_2、线程池好处" tabindex="-1"><a class="header-anchor" href="#_2、线程池好处" aria-hidden="true">#</a> 2、线程池好处</h2>
<p>几乎所有需要异步或者并发执行任务的程序都可以使用线程池。</p>
<p>合理使用会给我们带来以下好处。</p>
<p>降低系统消耗：重复利用已经创建的线程降低线程创建和销毁造成的资源消耗。</p>
<p>提高响应速度：当任务到达时，任务不需要等到线程创建就可以立即执行。</p>
<p>提供线程可以管理性：可以通过设置合理分配、调优、监控。</p>
<h2 id="_3、线程池工作流程" tabindex="-1"><a class="header-anchor" href="#_3、线程池工作流程" aria-hidden="true">#</a> 3、线程池工作流程</h2>
<p>1、判断核心线程池里的线程是否都有在执行任务，否-&gt;创建一个新工作线程来执行任务。是-&gt;走下个流程。</p>
<p>2、判断工作队列是否已满，否-&gt;新任务存储在这个工作队列里，是-&gt;走下个流程。</p>
<p>3、判断线程池里的线程是否都在工作状态，否-&gt;创建一个新的工作线程来执行任务，是-&gt;走下个流程。</p>
<p>4、按照设置的策略来处理无法执行的任务。</p>
<h2 id="_4、线程池的创建" tabindex="-1"><a class="header-anchor" href="#_4、线程池的创建" aria-hidden="true">#</a> 4、线程池的创建</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 创建线程工厂实例</span>
<span class="token class-name">ThreadFactory</span> namedThreadFactory <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadFactoryBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setNameFormat</span><span class="token punctuation">(</span><span class="token string">"demo-pool-%d"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// 创建线程池，核心线程数、最大线程数、空闲保持时间、队列长度、拒绝策略可自行定义</span>
<span class="token class-name">ExecutorService</span> pool <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">5</span><span class="token punctuation">,</span> <span class="token number">20</span><span class="token punctuation">,</span> <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">,</span>
            <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token number">1024</span><span class="token punctuation">)</span><span class="token punctuation">,</span> namedThreadFactory<span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor<span class="token punctuation">.</span>AbortPolicy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-corepoolsize" tabindex="-1"><a class="header-anchor" href="#_1-corepoolsize" aria-hidden="true">#</a> 1.corePoolSize：</h3>
<p>核心线程池大小，当提交一个任务时，线程池会创建一个线程来执行任务，即使其他空闲的核心线程能够执行新任务也会创建，等待需要执行的任务数大于线程核心大小就不会继续创建。</p>
<h3 id="_2-maximumpoolsize" tabindex="-1"><a class="header-anchor" href="#_2-maximumpoolsize" aria-hidden="true">#</a> 2.maximumPoolSize：</h3>
<p>线程池最大数，允许创建的最大线程数，如果队列满了，并且已经创建的线程数小于最大线程数，则会创建新的线程执行任务。如果是无界队列，这个参数基本没用。</p>
<h3 id="_3-keepalivetime" tabindex="-1"><a class="header-anchor" href="#_3-keepalivetime" aria-hidden="true">#</a> 3.keepAliveTime：</h3>
<p>线程保持活动时间，线程池工作线程空闲后，保持存活的时间，所以如果任务很多，并且每个任务执行时间较短，可以调大时间，提高线程利用率。</p>
<h3 id="_4-unit" tabindex="-1"><a class="header-anchor" href="#_4-unit" aria-hidden="true">#</a> 4.unit：</h3>
<p>线程保持活动时间单位，天(DAYS)、小时(HOURS)、分钟(MINUTES、毫秒MILLISECONDS).微秒(MICROSECONDS)、纳秒(NANOSECONDS)</p>
<h3 id="_5-workqueue" tabindex="-1"><a class="header-anchor" href="#_5-workqueue" aria-hidden="true">#</a> 5.workQueue：</h3>
<p>任务队列，保存等待执行的任务的阻塞队列。一般来说可以选择如下阻塞队列：</p>
<p>(1) ArrayBlockingQueue:基于数组的有界阻塞队列。</p>
<p>​    (2)LinkedBlockingQueue:基于链表的阻塞队列。</p>
<p>​    (3)SynchronizedQueue:一个不存储元素的阻塞队列。</p>
<p>​    (4)PriorityBlockingQueue:一个具有优先级的阻塞队列。</p>
<h3 id="_6-threadfactory" tabindex="-1"><a class="header-anchor" href="#_6-threadfactory" aria-hidden="true">#</a> 6.threadFactory：</h3>
<p>设置创建线程的工厂，可以通过线程工厂给每个创建出来的线程设置更有意义的名字。</p>
<h3 id="_7-handler" tabindex="-1"><a class="header-anchor" href="#_7-handler" aria-hidden="true">#</a> 7.handler：</h3>
<p>饱和策略也叫拒绝策略。当队列和线程池都满了，即达到饱和状态。所以需要采取策略来处理新的任务。默认策略是AbortPblicy</p>
<p>(1)AbortPolicy:直接抛出异常。</p>
<p>(2)CallerRunsPolicy:调用者所在的线程来运行任务。</p>
<p>(3)DiscardOldestPolicy:丢弃队列里最近的一个任务，并执行当前任务。</p>
<p>(4)DiscardPolicy:不处理，直接丢掉。</p>
<p>当然可以根据自己的应用场景，实现RejectedExecutionHandler接口自定义策略。</p>
<h2 id="_5、向线程池提交任务" tabindex="-1"><a class="header-anchor" href="#_5、向线程池提交任务" aria-hidden="true">#</a> 5、向线程池提交任务</h2>
<p>可以使用execute()和submit()两种方式提交任务。</p>
<p>execute():无返回值，所以无法判断任务是否被执行成功。</p>
<p>submit(:用于提交需要有返回值的任务。线程池返回一个future类型的对象，通过这个future对象可以判断任务是否执行成功，并且可以通过future的get()来获取返回值，get()方法会阻塞当前线程知道任务完成。get(long timeout,TimeUnit unit)可以设置超时时间。</p>
<h2 id="_6、线程池的关闭" tabindex="-1"><a class="header-anchor" href="#_6、线程池的关闭" aria-hidden="true">#</a> 6、线程池的关闭</h2>
<h3 id="_1-正常关闭" tabindex="-1"><a class="header-anchor" href="#_1-正常关闭" aria-hidden="true">#</a> （1）正常关闭</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token class-name">ExecutorService</span> pool<span class="token operator">=</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>；
<span class="token comment">// 用于线程内无迭代，且预期在短时间内能执行完毕的线程任务；</span>
pool<span class="token punctuation">.</span><span class="token function">shutdown</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// 用于线程内有迭代逻辑，或执行完成时间无法预估的场景（此类线程任务代码必须进行中断信号的处理）；</span>
pool<span class="token punctuation">.</span><span class="token function">shutdownNow</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以通过shutdown()或shutdownNow()来关闭线程池。</p>
<p>它们的原理是遍历线程池中的工作线程，然后逐个调用线程的interrupt来中断线程，所以无法响应终端的任务可以能永远无法停止</p>
<p>shutdownNow首先将线程池状态设置成STOP;然后尝试停止所有的正在执行或者暂停的线程，并返回等待执行任务的列表。</p>
<p>shutdown只是将线程池的状态设置成shutdown状态，然后中断所有没有正在执行任务的线程。</p>
<p>只要调用两者之一，isShutdown就会返回true,当所有任务都已关闭，isTerminaed就会返回true。一般来说调用shutdown方法来关闭线程池，如果任务不一定要执行完，可以直接调用shutdownNow方法。</p>
<h3 id="_2-中断异常处理" tabindex="-1"><a class="header-anchor" href="#_2-中断异常处理" aria-hidden="true">#</a> （2）中断异常处理</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>        <span class="token comment">//所有会引起中断异常的代码段都要单独处理中断异常，绝对不可合并在Exception或Throwable里处理；并根据代码结构和业务逻辑判断，是否需要恢复中断异常</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">sleep</span><span class="token punctuation">(</span><span class="token number">1000L</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">InterruptedException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token comment">// 中断处理</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token comment">// 其它异常处理</span>
        <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-库代码中断异常处理" tabindex="-1"><a class="header-anchor" href="#_3-库代码中断异常处理" aria-hidden="true">#</a> （3）库代码中断异常处理</h3>
<p>//库代码中断异常处理主要有两种方式，如下：</p>
<ol>
<li>传递InterruptedException：避开这个异常通常是最明智的策略——只需将InterruptedException传递给方法的调用者。</li>
<li>恢复中断：有时不能抛出InterruptedException，例如代码位于Runnable中时。在这些情况下，捕获InterruptedException并使用当前线程上的Interrupt方法恢复中断状态，这样在调用栈中更高层的代码将看到引发了一个中断。</li>
</ol>
<h3 id="_4-检查中断状态" tabindex="-1"><a class="header-anchor" href="#_4-检查中断状态" aria-hidden="true">#</a> （4）检查中断状态</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 测试当前线程是否已经中断。线程的中断状态 由该方法清除。</span>
<span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">interrupted</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// 测试线程是否已经中断。线程的中断状态不受该方法的影响。</span>
<span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isInterrupted</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-线程内有迭代逻辑时的中断处理参考代码模板" tabindex="-1"><a class="header-anchor" href="#_5-线程内有迭代逻辑时的中断处理参考代码模板" aria-hidden="true">#</a> （5）线程内有迭代逻辑时的中断处理参考代码模板</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>  <span class="token comment">// 迭代必须包含对中断信号的响应，以及对中断异常的处理</span>
        <span class="token keyword">while</span> <span class="token punctuation">(</span>线程中断状态为<span class="token boolean">false</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token comment">// 业务代码</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">int</span> listSize <span class="token operator">=</span> <span class="token number">100</span><span class="token punctuation">;</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> listSize<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>线程中断状态为<span class="token boolean">false</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token keyword">break</span><span class="token punctuation">;</span> 
            <span class="token punctuation">}</span>
            <span class="token comment">// 业务代码</span>
        <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_7、线程池如何配置合理" tabindex="-1"><a class="header-anchor" href="#_7、线程池如何配置合理" aria-hidden="true">#</a> 7、线程池如何配置合理</h2>
<p>配置线程池可以从以下几个方面考虑。</p>
<p>任务是cpu密集型、IO密集型或者混合型·任务优先级，高中低。</p>
<p>任务时间执行长短。</p>
<p>任务依赖性:是否依赖其他系统资源。</p>
<p>cpu密集型可以配置可能小的线程,比如n+1个线程。io密集型可以配置较多的线程，如2n个线程。</p>
<p>混合型可以拆成io密集型任务和cpu密集型任务，</p>
<p>如果两个任务执行时间相差大，否-&gt;分解后执行吞吐量将高于串行执行吞吐量。否-&gt;没必要分解。</p>
<p>可以通过Runtime.getRuntime().availableProcessors()来获取cpu个数。建议使用有界队列，增加系统的预警能力和稳定性。</p>
<h2 id="_8、jdk线程示例" tabindex="-1"><a class="header-anchor" href="#_8、jdk线程示例" aria-hidden="true">#</a> 8、JDK线程示例</h2>
<h3 id="_0-fixedthreadpool" tabindex="-1"><a class="header-anchor" href="#_0-fixedthreadpool" aria-hidden="true">#</a> （0）FixedThreadPool</h3>
<p>可重用固定线程数的线程池。查看源码：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">ExecutorService</span> <span class="token function">newFixedThreadPool</span><span class="token punctuation">(</span><span class="token keyword">int</span> nThreads<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span>nThreads<span class="token punctuation">,</span> nThreads<span class="token punctuation">,</span>
                                  <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">,</span>
                                  <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>corePoolSize和maxPoolSize都被设置成我们设置的nThreads。<br>
当线程池中的线程数大于corePoolSize ,keepAliveTime为多余的空闲线程等待新任务的最长时间，超过这个时间后多余的线程将被终止，如果设为0，表示多余的空闲线程会立即终止。<br>
工作流程:</p>
<p>1.当前线程少于corePoolSize,创建新线程执行任务。</p>
<p>2.当前运行线程等于corePoolSize,将任务加入LinkedBlockingQueue。</p>
<p>3.线程执行完1中的任务，会循环反复从LinkedBlockingQueue获取任务来执行。LinkedBlockingQueue作为线程池工作队列(默认容量Integer.MAX_VALUE)。因此可能会造成如下。</p>
<p>1.当线程数等于corePoolSize时，新任务将在队列中等待，因为线程池中的线程不会超过corePoolSize。</p>
<p>2.maxnumPoolSize等于说是一个无效参数。</p>
<p>3.keepAliveTime等于说也是一个无效参数。</p>
<p>4.运行中的FixedThreadPool(未执行shundown或shundownNow)则不会调用拒绝策略。</p>
<p>5.由于任务可以不停的加到队列，当任务越来越多时很容易造成OOM。</p>
<h3 id="_1-singlethreadexecutor" tabindex="-1"><a class="header-anchor" href="#_1-singlethreadexecutor" aria-hidden="true">#</a> （1）SingleThreadExecutor</h3>
<p>是使用单个worker线程的Executor。查看源码:</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">ExecutorService</span> <span class="token function">newSingleThreadExecutor</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">FinalizableDelegatedExecutorService</span>
            <span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span>
                                    <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">,</span>
                                    <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">ExecutorService</span> <span class="token function">newSingleThreadExecutor</span><span class="token punctuation">(</span><span class="token class-name">ThreadFactory</span> threadFactory<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">FinalizableDelegatedExecutorService</span>
            <span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span>
                                    <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">,</span>
                                    <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                                    threadFactory<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>corePoolSize和maxnumPoolSize被设置为1。其他参数和FixedThreadPool相同。执行流程以及造成的影响同FixedThreadPool。</p>
<h3 id="_2-cachedthreadpool" tabindex="-1"><a class="header-anchor" href="#_2-cachedthreadpool" aria-hidden="true">#</a> （2）CachedThreadPool</h3>
<p>根据需要创建新线程的线程池。查看源码:</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">ExecutorService</span> <span class="token function">newCachedThreadPool</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token class-name">Integer</span><span class="token punctuation">.</span><span class="token constant">MAX_VALUE</span><span class="token punctuation">,</span>
                                      <span class="token number">60L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">SECONDS</span><span class="token punctuation">,</span>
                                      <span class="token keyword">new</span> <span class="token class-name">SynchronousQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>    
<span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">ExecutorService</span> <span class="token function">newCachedThreadPool</span><span class="token punctuation">(</span><span class="token class-name">ThreadFactory</span> threadFactory<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token class-name">Integer</span><span class="token punctuation">.</span><span class="token constant">MAX_VALUE</span><span class="token punctuation">,</span>
                                      <span class="token number">60L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">SECONDS</span><span class="token punctuation">,</span>
                                      <span class="token keyword">new</span> <span class="token class-name">SynchronousQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                                      threadFactory<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>corePoolSize设置为0,maxmumPoolSize为Integer.MAX_VALUE。keepAliveTime为60秒。工作流程:</p>
<p>1.首先执行SynchronousQueue.offer (Runnable task)。如果当前maximumPool中有空闲线程正在执行SynchronousQueue.pol(keepAliveTIme,TimeUnit.NANOSECONDS)，那么主线程执行offer操作与空闲线程执行的poll操作配对成功，主线程把任务交给空闲线程执行，execute方法执行完成；否则执行下面的步骤2。</p>
<p>2.当初始maximumPool为空或者maximumPool中当前没有空闲线程时，将没有线程执行SynchronousQueue.poll (keepAliveTime, TimeUnit.NANOSECONDS)。这种情况下，步骤1将失败。此时CachedThreadPool会创建一个新线程执行任务，execute()方法执行完成。</p>
<p>3.在步骤2中新创建的线程将任务执行完后，会执行SynchronousQueue.poll (keepAliveTime,TimeUnit.NANOSECONDS)。这个poll操作会让空闲线程最多在SynchronousQueue中等待60秒钟。如果60秒钟内主线程提交了一个新任务(主线程执行步骤1)，那么这个空闲线程将执行主线程提交的新任务；否则，这个空闲线程将终止。由于空闲60秒的空闲线程会被终止，因此长时间保持空闲的CachedThreadPool不会使用任何资源。</p>
<h3 id="_3-创建定时任务" tabindex="-1"><a class="header-anchor" href="#_3-创建定时任务" aria-hidden="true">#</a> （3）创建定时任务</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>    <span class="token comment">// 禁止使用Timer，一律使用ScheduledExecutorService</span>
    <span class="token class-name">ScheduledExecutorService</span> schedule <span class="token operator">=</span>
                <span class="token keyword">new</span> <span class="token class-name">ScheduledThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">ThreadFactoryBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setNameFormat</span><span class="token punctuation">(</span><span class="token string">"scheduled-%d"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 创建并执行在给定延迟后启用的一次性操作</span>
    schedule<span class="token punctuation">.</span><span class="token function">schedule</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">DemoWorker</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">60000L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">/*
    *  创建并执行一个在给定初始延迟后首次启用的定期操作，后续操作具有给定的周期；
    *  也就是将在 initialDelay 后开始执行，w然后在 initialDelay+period 后执行，接着在 initialDelay + 2 * period 后执行，依此类推。
    */</span>
    schedule<span class="token punctuation">.</span><span class="token function">scheduleAtFixedRate</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">DemoWorker</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">60000L</span><span class="token punctuation">,</span> <span class="token number">60000L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 创建并执行一个在给定初始延迟后首次启用的定期操作，随后，在每一次执行终止和下一次执行开始之间都存在给定的延迟。</span>
    schedule<span class="token punctuation">.</span><span class="token function">scheduleWithFixedDelay</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">DemoWorker</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">60000L</span><span class="token punctuation">,</span> <span class="token number">60000L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_9、建议" tabindex="-1"><a class="header-anchor" href="#_9、建议" aria-hidden="true">#</a> 9、建议</h2>
<h3 id="countdownlatch实现所有线程达到某一个目标后-再继续进行下一步工作" tabindex="-1"><a class="header-anchor" href="#countdownlatch实现所有线程达到某一个目标后-再继续进行下一步工作" aria-hidden="true">#</a> CountDownLatch实现所有线程达到某一个目标后，再继续进行下一步工作</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token class-name">ThreadFactory</span> namedThreadFactory <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadFactoryBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setNameFormat</span><span class="token punctuation">(</span><span class="token string">"demo-pool-%d"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">ExecutorService</span> executor <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">5</span><span class="token punctuation">,</span> <span class="token number">20</span><span class="token punctuation">,</span> <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">,</span>
 <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Runnable</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token number">1024</span><span class="token punctuation">)</span><span class="token punctuation">,</span> namedThreadFactory<span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor<span class="token punctuation">.</span>AbortPolicy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">int</span> count <span class="token operator">=</span> <span class="token number">500</span><span class="token punctuation">;</span>
<span class="token comment">// CountDownLatch的计数器需要和任务数相同，执行完一个任务调用countDown让计数器减一</span>
<span class="token class-name">CountDownLatch</span> latch <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">CountDownLatch</span><span class="token punctuation">(</span>count<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> count<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    executor<span class="token punctuation">.</span><span class="token function">submit</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">Runnable</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token annotation punctuation">@Override</span>
 <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">try</span> <span class="token punctuation">{</span>
                <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">sleep</span><span class="token punctuation">(</span><span class="token number">50</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"运行任务"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 <span class="token punctuation">}</span>
            latch<span class="token punctuation">.</span><span class="token function">countDown</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
 <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token keyword">try</span> <span class="token punctuation">{</span>
    latch<span class="token punctuation">.</span><span class="token function">await</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">InterruptedException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"都运行完了"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="采用lock加锁在finally块中释放锁-保证不论是否抛出异常锁一定会被释放" tabindex="-1"><a class="header-anchor" href="#采用lock加锁在finally块中释放锁-保证不论是否抛出异常锁一定会被释放" aria-hidden="true">#</a> 采用Lock加锁在finally块中释放锁，保证不论是否抛出异常锁一定会被释放：</h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token class-name">Lock</span> lock <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ReentrantLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
lock<span class="token punctuation">.</span><span class="token function">lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">try</span> <span class="token punctuation">{</span>
    <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token string">"得到了锁"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"do something..."</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token string">"handle exception"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
    lock<span class="token punctuation">.</span><span class="token function">unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span><span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">+</span> <span class="token string">"释放了锁"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>10、springboot线程池ThreadPoolTaskExecutor以及@Async异步注解使用方法</p>
<h3 id="方式一" tabindex="-1"><a class="header-anchor" href="#方式一" aria-hidden="true">#</a> 方式一：</h3>
<p>在Application启动类上面加上@EnableAsync，在需要异步执行的方法上加上@Async注解</p>
<h3 id="方式二-直接调用threadpooltaskexecutor" tabindex="-1"><a class="header-anchor" href="#方式二-直接调用threadpooltaskexecutor" aria-hidden="true">#</a> 方式二：直接调用ThreadPoolTaskExecutor</h3>
<p>配置线程池的类型与参数，如下</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>commons<span class="token punctuation">.</span>lang3<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">BasicThreadFactory</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>context<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">Bean</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>context<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">Configuration</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>scheduling<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ThreadPoolTaskExecutor</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ScheduledExecutorService</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ScheduledThreadPoolExecutor</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ThreadPoolExecutor</span></span><span class="token punctuation">;</span>

<span class="token doc-comment comment">/**
 * 线程池配置
 **/</span>
<span class="token annotation punctuation">@Configuration</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ThreadPoolConfig</span>
<span class="token punctuation">{</span>
    <span class="token comment">// 核心线程池大小</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> corePoolSize <span class="token operator">=</span> <span class="token number">50</span><span class="token punctuation">;</span>

    <span class="token comment">// 最大可创建的线程数</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> maxPoolSize <span class="token operator">=</span> <span class="token number">200</span><span class="token punctuation">;</span>

    <span class="token comment">// 队列最大长度</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> queueCapacity <span class="token operator">=</span> <span class="token number">1000</span><span class="token punctuation">;</span>

    <span class="token comment">// 线程池维护线程所允许的空闲时间</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> keepAliveSeconds <span class="token operator">=</span> <span class="token number">300</span><span class="token punctuation">;</span>

    <span class="token annotation punctuation">@Bean</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"threadPoolTaskExecutor"</span><span class="token punctuation">)</span>
    <span class="token keyword">public</span> <span class="token class-name">ThreadPoolTaskExecutor</span> <span class="token function">threadPoolTaskExecutor</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token punctuation">{</span>
        <span class="token class-name">ThreadPoolTaskExecutor</span> executor <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolTaskExecutor</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        executor<span class="token punctuation">.</span><span class="token function">setMaxPoolSize</span><span class="token punctuation">(</span>maxPoolSize<span class="token punctuation">)</span><span class="token punctuation">;</span>
        executor<span class="token punctuation">.</span><span class="token function">setCorePoolSize</span><span class="token punctuation">(</span>corePoolSize<span class="token punctuation">)</span><span class="token punctuation">;</span>
        executor<span class="token punctuation">.</span><span class="token function">setQueueCapacity</span><span class="token punctuation">(</span>queueCapacity<span class="token punctuation">)</span><span class="token punctuation">;</span>
        executor<span class="token punctuation">.</span><span class="token function">setKeepAliveSeconds</span><span class="token punctuation">(</span>keepAliveSeconds<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 线程池对拒绝任务(无线程可用)的处理策略</span>
        executor<span class="token punctuation">.</span><span class="token function">setRejectedExecutionHandler</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor<span class="token punctuation">.</span>CallerRunsPolicy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> executor<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后使用该配置</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 使用方式一</span>
<span class="token annotation punctuation">@Autowired</span>
<span class="token keyword">private</span> <span class="token class-name">ThreadPoolTaskExecutor</span> threadPoolTaskExecutor<span class="token punctuation">;</span>

        threadPoolTaskExecutor<span class="token punctuation">.</span><span class="token function">submit</span><span class="token punctuation">(</span>xxxxx<span class="token punctuation">)</span><span class="token punctuation">;</span>
        
<span class="token comment">// 使用方式二：必须指定bean名字不然就默认加载到其他的配置</span>
<span class="token annotation punctuation">@Async</span><span class="token punctuation">(</span><span class="token string">"threadPoolTaskExecutor"</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token class-name">String</span> name<span class="token punctuation">)</span><span class="token punctuation">{</span>
        logger<span class="token punctuation">.</span><span class="token function">info</span><span class="token punctuation">(</span><span class="token string">"异步线程启动 started."</span><span class="token operator">+</span>name<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


