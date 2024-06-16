<template><div><h1 id="自旋锁" tabindex="-1"><a class="header-anchor" href="#自旋锁" aria-hidden="true">#</a> 自旋锁</h1>
<h2 id="_1、自旋锁概念-spinlock" tabindex="-1"><a class="header-anchor" href="#_1、自旋锁概念-spinlock" aria-hidden="true">#</a> 1、自旋锁概念（spinlock）</h2>
<p>是指当一个线程在获取锁的时候，如果锁已经被其它线程获取，那么该线程将循环等待，然后不断的判断锁是否能够被成功获取，直到获取到锁才会退出循环。</p>
<p>获取锁的线程一直处于活跃状态，但是并没有执行任何有效的任务，使用这种锁会造成busy-waiting。</p>
<h2 id="_2、自旋锁的优点" tabindex="-1"><a class="header-anchor" href="#_2、自旋锁的优点" aria-hidden="true">#</a> 2、自旋锁的优点 :</h2>
<p>自旋锁不会使线程状态发生切换，一直处于用户态，即线程一直都是active的；不会使线程进入阻塞状态，减少了不必要的上下文切换，执行速度快非自旋锁在获取不到锁的时候会进入阻塞状态，从而进入内核态，当获取到锁的时候需要从内核态恢复，需要线程上下文切换。 （线程被阻塞后便进入内核（Linux）调度状态，这个会导致系统在用户态与内核态之间来回切换，严重影响锁的性能）</p>
<h2 id="_3、自旋锁应用" tabindex="-1"><a class="header-anchor" href="#_3、自旋锁应用" aria-hidden="true">#</a> 3、自旋锁应用 :</h2>
<p>由于自旋锁只是将当前线程不停地执行循环体，不进行线程状态的改变，所以响应速度更快。但当线程数不停增加时，性能下降明显，因为每个线程都需要执行，占用CPU时间。</p>
<p>如果线程竞争不激烈，并且保持锁的时间段。适合使用自旋锁。</p>
<h2 id="_4、简单自旋锁的实现" tabindex="-1"><a class="header-anchor" href="#_4、简单自旋锁的实现" aria-hidden="true">#</a> 4、简单自旋锁的实现 ：</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">SimpleSpinLock</span> <span class="token punctuation">{</span>
     <span class="token doc-comment comment">/**
      * 持有锁的线程，null表示锁未被线程持有
      */</span>
     <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token class-name">AtomicReference</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Thread</span><span class="token punctuation">></span></span> ref <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">AtomicReference</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token class-name">Lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token class-name">Thread</span> currentThread <span class="token operator">=</span> <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token comment">// 当ref为null的时候compareAndSet返回true，反之为false</span>
         <span class="token comment">// 通过循环不断的自旋判断锁是否被其他线程持有</span>
         <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token operator">!</span>ref<span class="token punctuation">.</span><span class="token function">compareAndSet</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">,</span> currentThread<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token punctuation">}</span>
     <span class="token punctuation">}</span>

   <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">unLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">Thread</span> currentThread <span class="token operator">=</span> <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>ref<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">!=</span> currentThread<span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token punctuation">}</span>
         ref<span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>

test：

<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">SimpleSpinLockTest</span> <span class="token punctuation">{</span>

    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">int</span> n <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">InterruptedException</span> <span class="token punctuation">{</span>
         <span class="token class-name">ThreadPoolExecutor</span> pool <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">SECONDS</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">LinkedBlockingQueue</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">DefaultNameThreadFactory</span><span class="token punctuation">(</span><span class="token string">"SimpleSpinLock"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token class-name">CountDownLatch</span> countDownLatch <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">CountDownLatch</span><span class="token punctuation">(</span><span class="token number">100</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token class-name">SimpleSpinLock</span> simpleSpinLock <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SimpleSpinLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token number">100</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
             pool<span class="token punctuation">.</span><span class="token function">submit</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-></span> <span class="token punctuation">{</span>
                 <span class="token class-name"><span class="token namespace">simpleSpinLock<span class="token punctuation">.</span></span>Lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
                 n<span class="token operator">++</span><span class="token punctuation">;</span>
                 simpleSpinLock<span class="token punctuation">.</span><span class="token function">unLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
                 <span class="token comment">// 计数减一</span>
                 countDownLatch<span class="token punctuation">.</span><span class="token function">countDown</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
             <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span>
         <span class="token comment">// 要求主线程等待所有任务全部准备好才一起并行执行</span>
         countDownLatch<span class="token punctuation">.</span><span class="token function">await</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>n<span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5、可重入的自旋锁和不可重入的自旋锁" tabindex="-1"><a class="header-anchor" href="#_5、可重入的自旋锁和不可重入的自旋锁" aria-hidden="true">#</a> 5、可重入的自旋锁和不可重入的自旋锁 ：</h2>
<p>仔细分析一下上述就可以看出，它是不支持重入的，即当一个线程第一次已经获取到了该锁，在锁释放之前又一次重新获取该锁，第二次就不能成功获取到。</p>
<p>由于不满足CAS，所以第二次获取会进入while循环等待，而如果是可重入锁，第二次也是应该能够成功获取到的。为了实现可重入锁，我们需要引入一个计数器，用来记录获取锁的线程数----》其他章节可重入锁</p>
<h2 id="_6、-另有三种常见的形式" tabindex="-1"><a class="header-anchor" href="#_6、-另有三种常见的形式" aria-hidden="true">#</a> 6、  另有三种常见的形式 :</h2>
<p>TicketLock ，CLHlock 和 MCSlock：<a href="https://www.cnblogs.com/stevenczp/p/7136416.html" target="_blank" rel="noopener noreferrer">https://www.cnblogs.com/stevenczp/p/7136416.html<ExternalLinkIcon/></a></p>
</div></template>


