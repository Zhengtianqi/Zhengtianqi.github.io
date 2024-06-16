<template><div><p>转自：<a href="https://blog.csdn.net/qq_26222859/article/details/80546917" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/qq_26222859/article/details/80546917<ExternalLinkIcon/></a></p>
<p>参考：<a href="https://www.jianshu.com/p/f05423a21e78" target="_blank" rel="noopener noreferrer">https://www.jianshu.com/p/f05423a21e78<ExternalLinkIcon/></a></p>
<p>通常情况下，为了保证多线程间的有效并发，会要求每个线程持有锁的时间尽可能短，但是大某些情况下，一个程序对同一个锁不间断、高频地请求、同步与释放，会消耗掉一定的系统资源，因为锁的讲求、同步与释放本身会带来性能损耗，这样高频的锁请求就反而不利于系统性能的优化了，虽然单次同步操作的时间可能很短。锁粗化就是告诉我们任何事情都有个度，有些情况下我们反而希望把很多次锁的请求合并成一个请求，以降低短时间内大量锁请求、同步、释放带来的性能损耗。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">doSomethingMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token keyword">synchronized</span><span class="token punctuation">(</span>lock<span class="token punctuation">)</span><span class="token punctuation">{</span>
         <span class="token comment">//do some thing</span>
     <span class="token punctuation">}</span>
     <span class="token comment">//这是还有一些代码，做其它不需要同步的工作，但能很快执行完毕</span>
     <span class="token keyword">synchronized</span><span class="token punctuation">(</span>lock<span class="token punctuation">)</span><span class="token punctuation">{</span>
         <span class="token comment">//do other thing</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面的代码是有两块需要同步操作的，但在这两块需要同步操作的代码之间，需要做一些其它的工作，而这些工作只会花费很少的时间，那么我们就可以把这些工作代码放入锁内，将两个同步代码块合并成一个，以降低多次锁请求、同步、释放带来的系统性能消耗，合并后的代码如下 :</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">doSomethingMethod</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token comment">//进行锁粗化：整合成一次锁请求、同步、释放</span>
     <span class="token keyword">synchronized</span><span class="token punctuation">(</span>lock<span class="token punctuation">)</span><span class="token punctuation">{</span>
         <span class="token comment">//do some thing</span>
         <span class="token comment">//做其它不需要同步但能很快执行完的工作</span>
         <span class="token comment">//do other thing</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注意：这样做是有前提的，就是中间不需要同步的代码能够很快速地完成，如果不需要同步的代码需要花很长时间，就会导致同步块的执行需要花费很长的时间，这样做也就不合理了。</p>
<p>另一种需要锁粗化的极端的情况是：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i<span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">;</span>i<span class="token operator">&lt;</span>size<span class="token punctuation">;</span>i<span class="token operator">++</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token keyword">synchronized</span><span class="token punctuation">(</span>lock<span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上面代码每次循环都会进行锁的请求、同步与释放，看起来貌似没什么问题，且在jdk内部会对这类代码锁的请求做一些优化，但是还不如把加锁代码写在循环体的外面，这样一次锁的请求就可以达到我们的要求，除非有特殊的需要：循环需要花很长时间，但其它线程等不起，要给它们执行的机会。</p>
<p>锁粗化后的代码如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">synchronized</span><span class="token punctuation">(</span>lock<span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i<span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">;</span>i<span class="token operator">&lt;</span>size<span class="token punctuation">;</span>i<span class="token operator">++</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
     <span class="token punctuation">}</span>
 <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


