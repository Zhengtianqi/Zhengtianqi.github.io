<template><div><h1 id="_4、读写锁" tabindex="-1"><a class="header-anchor" href="#_4、读写锁" aria-hidden="true">#</a> 4、读写锁</h1>
<h2 id="_1、读写锁介绍" tabindex="-1"><a class="header-anchor" href="#_1、读写锁介绍" aria-hidden="true">#</a> 1、读写锁介绍：</h2>
<p>​        ReadWriteLock同Lock一样也是一个接口，提供了readLock和writeLock两种锁的操作机制，一个是只读的锁，一个是写锁。</p>
<p>​        理论上，读写锁比互斥锁允许对于共享数据更大程度的并发。与互斥锁相比，读写锁是否能够提高性能取决于读写数据的频率、读取和写入操作的持续时间、以及读线程和写线程之间的竞争。</p>
<p>​        一些业务场景中，大部分 只是读数据，写数据很少，如果仅仅是读数据的话并不会影响数据正确性（出现脏读），而如果在这种业务场景下，依然使用独占锁的话，很显然这将是出现性能瓶颈的地方。 针对这种读多写少的情况，java还提供了另外一个实现Lock接口的ReentrantReadWriteLock(读写锁)。读写所允许同一时刻被多个读线程访问，但是在写线程访问时，所有的读线程和其他的写线程都会被阻塞。</p>
<p>​</p>
<p>​        读-读能共存，<br>
​         读-写不能共存，<br>
​         写-写不能共存。</p>
<p>连接：<a href="https://blog.csdn.net/j080624/article/details/82790372%E3%80%81https://ifeve.com/read-write-locks/" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/j080624/article/details/82790372、https://ifeve.com/read-write-locks/<ExternalLinkIcon/></a></p>
<h2 id="_2、总结" tabindex="-1"><a class="header-anchor" href="#_2、总结" aria-hidden="true">#</a> 2、总结：</h2>
<ol>
<li><strong>公平性选择</strong>：支持非公平性（默认）和公平的锁获取方式，吞吐量还是非公平优于公平；</li>
<li><strong>重入性</strong>：支持重入，读锁获取后能再次获取，写锁获取之后能够再次获取写锁，同时也能够获取读锁；</li>
<li><strong>锁降级</strong>：遵循获取写锁，获取读锁再释放写锁的次序，写锁能够降级成为读锁</li>
</ol>
<h2 id="_3、写锁的获取" tabindex="-1"><a class="header-anchor" href="#_3、写锁的获取" aria-hidden="true">#</a> 3、写锁的获取：</h2>
<p>​        写锁是独占式锁，而实现写锁的同步语义是通过重写 AQS 中的 tryAcquire() 方法实现的，源码：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">protected</span> <span class="token keyword">final</span> <span class="token keyword">boolean</span> <span class="token function">tryAcquire</span><span class="token punctuation">(</span><span class="token keyword">int</span> acquires<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token class-name">Thread</span> current <span class="token operator">=</span> <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">// 1. 获取 写锁 当前的同步状态</span>
     <span class="token keyword">int</span> c <span class="token operator">=</span> <span class="token function">getState</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">// 2. 获取 写锁 获取的次数</span>
     <span class="token keyword">int</span> w <span class="token operator">=</span> <span class="token function">exclusiveCount</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span>c <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token comment">// (Note: if c != 0 and w == 0 then shared count != 0)</span>
         <span class="token comment">// 3.1 当 读锁 已被读线程获取 或者 当前线程不是已经获取 写锁 的线程的话</span>
         <span class="token comment">// 当前线程获取 写锁失败</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>w <span class="token operator">==</span> <span class="token number">0</span> <span class="token operator">||</span> current <span class="token operator">!=</span> <span class="token function">getExclusiveOwnerThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
             <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>w <span class="token operator">+</span> <span class="token function">exclusiveCount</span><span class="token punctuation">(</span>acquires<span class="token punctuation">)</span> <span class="token operator">></span> <span class="token constant">MAX_COUNT</span><span class="token punctuation">)</span>
             <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">Error</span><span class="token punctuation">(</span><span class="token string">"Maximum lock count exceeded"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token comment">// Reentrant acquire</span>
         <span class="token comment">// 3.2 当前线程 获取写锁，支持可重复加锁</span>
         <span class="token function">setState</span><span class="token punctuation">(</span>c <span class="token operator">+</span> acquires<span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>
     <span class="token comment">// 3.3 写锁 未被任何线程获取，当前线程可获取 写锁</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">writerShouldBlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">||</span><span class="token operator">!</span><span class="token function">compareAndSetState</span><span class="token punctuation">(</span>c<span class="token punctuation">,</span> c <span class="token operator">+</span> acquires<span class="token punctuation">)</span><span class="token punctuation">)</span>
         <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
     <span class="token function">setExclusiveOwnerThread</span><span class="token punctuation">(</span>current<span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
 <span class="token punctuation">}</span>

 

 <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">exclusiveCount</span><span class="token punctuation">(</span><span class="token keyword">int</span> c<span class="token punctuation">)</span> <span class="token punctuation">{</span> 

        <span class="token keyword">return</span> c <span class="token operator">&amp;</span> <span class="token constant">EXCLUSIVE_MASK</span><span class="token punctuation">;</span>

 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>其中EXCLUSIVE_MASK为:  static final int EXCLUSIVE_MASK = (1 &lt;&lt; SHARED_SHIFT) - 1;      EXCLUSIVE _MASK为1左移16位然后减1，即为0x0000FFFF。</p>
<p>而exclusiveCount方法是将同步状态（state为int类型）与0x0000FFFF相与，即取同步状态的低16位。那么低16位代表什么呢？</p>
<p>根据exclusiveCount方法的注释为独占式获取的次数即写锁被获取的次数，现在就可以得出来一个结论同步状态的低16位用来表示写锁的获取次数</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">sharedCount</span><span class="token punctuation">(</span><span class="token keyword">int</span> c<span class="token punctuation">)</span>    <span class="token punctuation">{</span> 

        <span class="token keyword">return</span> c <span class="token operator">>>></span> <span class="token constant">SHARED_SHIFT</span><span class="token punctuation">;</span> 

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>该方法是获取读锁被获取的次数，是将同步状态（int c）右移16次，即取同步状态的高16位，现在我们可以得出另外一个结论同步状态的高16位用来表示读锁被获取的次数。</p>
<figure><img src="/assets/images/读写锁.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>当读锁已经被读线程获取或者写锁已经被其他写线程获取，则写锁获取失败；否则，获取成功并支持重入，增加写状态。</p>
<h2 id="_4、写锁的释放" tabindex="-1"><a class="header-anchor" href="#_4、写锁的释放" aria-hidden="true">#</a> 4、写锁的释放：</h2>
<p>​    写锁释放通过重写AQS的tryRelease方法，源码为：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">protected</span> <span class="token keyword">final</span> <span class="token keyword">boolean</span> <span class="token function">tryRelease</span><span class="token punctuation">(</span><span class="token keyword">int</span> releases<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token function">isHeldExclusively</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
         <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">IllegalMonitorStateException</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">//1. 同步状态减去写状态</span>
     <span class="token keyword">int</span> nextc <span class="token operator">=</span> <span class="token function">getState</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> releases<span class="token punctuation">;</span>
     <span class="token comment">//2. 当前写状态是否为0，为0则释放写锁</span>
     <span class="token keyword">boolean</span> free <span class="token operator">=</span> <span class="token function">exclusiveCount</span><span class="token punctuation">(</span>nextc<span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">;</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span>free<span class="token punctuation">)</span>
         <span class="token function">setExclusiveOwnerThread</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">//3. 不为0则更新同步状态</span>
     <span class="token function">setState</span><span class="token punctuation">(</span>nextc<span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token keyword">return</span> free<span class="token punctuation">;</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>​    减少写状态int nextc = getState() - releases，只需要用当前同步状态直接减去写状态的原因：写状态是由同步状态的低16位表示的。</p>
<h2 id="_5、读锁的获取" tabindex="-1"><a class="header-anchor" href="#_5、读锁的获取" aria-hidden="true">#</a> 5、读锁的获取</h2>
<p>​        读锁不是独占式锁，即同一时刻该锁可以被多个读线程获取也就是一种共享式锁。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">protected</span> <span class="token keyword">final</span> <span class="token keyword">int</span> <span class="token function">tryAcquireShared</span><span class="token punctuation">(</span><span class="token keyword">int</span> unused<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token class-name">Thread</span> current <span class="token operator">=</span> <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token keyword">int</span> c <span class="token operator">=</span> <span class="token function">getState</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">//1. 如果写锁已经被获取并且获取写锁的线程不是当前线程的话，当前</span>
     <span class="token comment">// 线程获取读锁失败返回-1</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">exclusiveCount</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span> <span class="token operator">&amp;&amp;</span>
         <span class="token function">getExclusiveOwnerThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">!=</span> current<span class="token punctuation">)</span>
         <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
     <span class="token keyword">int</span> r <span class="token operator">=</span> <span class="token function">sharedCount</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token function">readerShouldBlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&amp;&amp;</span>
         r <span class="token operator">&lt;</span> <span class="token constant">MAX_COUNT</span> <span class="token operator">&amp;&amp;</span>
         <span class="token comment">//2. 当前线程获取读锁</span>
         <span class="token function">compareAndSetState</span><span class="token punctuation">(</span>c<span class="token punctuation">,</span> c <span class="token operator">+</span> <span class="token constant">SHARED_UNIT</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token comment">//3. 下面的代码主要是新增的一些功能，比如getReadHoldCount()方法</span>
         <span class="token comment">//返回当前获取读锁的次数</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>r <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
             firstReader <span class="token operator">=</span> current<span class="token punctuation">;</span>
             firstReaderHoldCount <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>firstReader <span class="token operator">==</span> current<span class="token punctuation">)</span> <span class="token punctuation">{</span>
             firstReaderHoldCount<span class="token operator">++</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
             <span class="token class-name">HoldCounter</span> rh <span class="token operator">=</span> cachedHoldCounter<span class="token punctuation">;</span>
             <span class="token keyword">if</span> <span class="token punctuation">(</span>rh <span class="token operator">==</span> <span class="token keyword">null</span> <span class="token operator">||</span> rh<span class="token punctuation">.</span>tid <span class="token operator">!=</span> <span class="token function">getThreadId</span><span class="token punctuation">(</span>current<span class="token punctuation">)</span><span class="token punctuation">)</span>
                 cachedHoldCounter <span class="token operator">=</span> rh <span class="token operator">=</span> readHolds<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
             <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>rh<span class="token punctuation">.</span>count <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span>
                 readHolds<span class="token punctuation">.</span><span class="token function">set</span><span class="token punctuation">(</span>rh<span class="token punctuation">)</span><span class="token punctuation">;</span>
             rh<span class="token punctuation">.</span>count<span class="token operator">++</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span>
         <span class="token keyword">return</span> <span class="token number">1</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>
     <span class="token comment">//4. 处理在第二步中CAS操作失败的自旋已经实现重入性</span>
     <span class="token keyword">return</span> <span class="token function">fullTryAcquireShared</span><span class="token punctuation">(</span>current<span class="token punctuation">)</span><span class="token punctuation">;</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>​    当写锁被其他线程获取后，读锁获取失败，否则获取成功利用CAS更新同步状态。</p>
<h2 id="_6、读锁的释放" tabindex="-1"><a class="header-anchor" href="#_6、读锁的释放" aria-hidden="true">#</a> 6、读锁的释放</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">protected</span> <span class="token keyword">final</span> <span class="token keyword">boolean</span> <span class="token function">tryReleaseShared</span><span class="token punctuation">(</span><span class="token keyword">int</span> unused<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token class-name">Thread</span> current <span class="token operator">=</span> <span class="token class-name">Thread</span><span class="token punctuation">.</span><span class="token function">currentThread</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token comment">// 前面还是为了实现getReadHoldCount等新功能</span>
     <span class="token keyword">if</span> <span class="token punctuation">(</span>firstReader <span class="token operator">==</span> current<span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token comment">// assert firstReaderHoldCount > 0;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>firstReaderHoldCount <span class="token operator">==</span> <span class="token number">1</span><span class="token punctuation">)</span>
             firstReader <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
         <span class="token keyword">else</span>
             firstReaderHoldCount<span class="token operator">--</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
         <span class="token class-name">HoldCounter</span> rh <span class="token operator">=</span> cachedHoldCounter<span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>rh <span class="token operator">==</span> <span class="token keyword">null</span> <span class="token operator">||</span> rh<span class="token punctuation">.</span>tid <span class="token operator">!=</span> <span class="token function">getThreadId</span><span class="token punctuation">(</span>current<span class="token punctuation">)</span><span class="token punctuation">)</span>
             rh <span class="token operator">=</span> readHolds<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token keyword">int</span> count <span class="token operator">=</span> rh<span class="token punctuation">.</span>count<span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span>count <span class="token operator">&lt;=</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
             readHolds<span class="token punctuation">.</span><span class="token function">remove</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
             <span class="token keyword">if</span> <span class="token punctuation">(</span>count <span class="token operator">&lt;=</span> <span class="token number">0</span><span class="token punctuation">)</span>
                 <span class="token keyword">throw</span> <span class="token function">unmatchedUnlockException</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span>
         <span class="token operator">--</span>rh<span class="token punctuation">.</span>count<span class="token punctuation">;</span>
     <span class="token punctuation">}</span>     <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token punctuation">;</span><span class="token punctuation">;</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         <span class="token keyword">int</span> c <span class="token operator">=</span> <span class="token function">getState</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token comment">// 读锁释放 将同步状态减去读状态即可</span>
         <span class="token keyword">int</span> nextc <span class="token operator">=</span> c <span class="token operator">-</span> <span class="token constant">SHARED_UNIT</span><span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">compareAndSetState</span><span class="token punctuation">(</span>c<span class="token punctuation">,</span> nextc<span class="token punctuation">)</span><span class="token punctuation">)</span>
             <span class="token comment">// Releasing the read lock has no effect on readers,</span>
             <span class="token comment">// but it may allow waiting writers to proceed if</span>
             <span class="token comment">// both read and write locks are now free.</span>
             <span class="token keyword">return</span> nextc <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_7、锁降级" tabindex="-1"><a class="header-anchor" href="#_7、锁降级" aria-hidden="true">#</a> 7、锁降级</h2>
<p>​        读写锁支持锁降级，遵循按照获取写锁，获取读锁再释放写锁的次序，写锁能够降级成为读锁，不支持锁升级，关于锁降级下面的示例代码摘自ReentrantWriteReadLock源码中：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">void</span> <span class="token function">processCachedData</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
         rwl<span class="token punctuation">.</span><span class="token function">readLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>cacheValid<span class="token punctuation">)</span> <span class="token punctuation">{</span>
             <span class="token comment">// Must release read lock before acquiring write lock</span>
             rwl<span class="token punctuation">.</span><span class="token function">readLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
             rwl<span class="token punctuation">.</span><span class="token function">writeLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
             <span class="token keyword">try</span> <span class="token punctuation">{</span>
                 <span class="token comment">// Recheck state because another thread might have</span>
                 <span class="token comment">// acquired write lock and changed state before we did.</span>
                 <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>cacheValid<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                     data <span class="token operator">=</span> <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
             cacheValid <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
           <span class="token punctuation">}</span>
           <span class="token comment">// Downgrade by acquiring read lock before releasing write lock</span>
           rwl<span class="token punctuation">.</span><span class="token function">readLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">lock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
         <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
           rwl<span class="token punctuation">.</span><span class="token function">writeLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Unlock write, still hold read</span>
         <span class="token punctuation">}</span>
       <span class="token punctuation">}</span>
       <span class="token keyword">try</span> <span class="token punctuation">{</span>
         <span class="token function">use</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span>
       <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
         rwl<span class="token punctuation">.</span><span class="token function">readLock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">unlock</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
       <span class="token punctuation">}</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


