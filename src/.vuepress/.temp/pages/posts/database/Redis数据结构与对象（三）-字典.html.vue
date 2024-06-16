<template><div><h2 id="字典的实现" tabindex="-1"><a class="header-anchor" href="#字典的实现" aria-hidden="true">#</a> 字典的实现</h2>
<p>Redis 的字典使用哈希表作为底层实现，一个哈希表里面可以有多个哈希表节点，而每个哈希表节点就保存了字典中的一个键值对。</p>
<p>接下来的三个小节将分别介绍 Redis 的哈希表、哈希表节点、以及字典的实现。</p>
<h2 id="哈希表" tabindex="-1"><a class="header-anchor" href="#哈希表" aria-hidden="true">#</a> 哈希表</h2>
<p>Redis 字典所使用的哈希表由 <code v-pre>dict.h/dictht</code> 结构定义：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>typedef struct dictht <span class="token punctuation">{</span>
    <span class="token comment">// 哈希表数组</span>
    dictEntry <span class="token operator">*</span><span class="token operator">*</span>table<span class="token punctuation">;</span>
    <span class="token comment">// 哈希表大小</span>
    unsigned <span class="token keyword">long</span> size<span class="token punctuation">;</span>
    <span class="token comment">// 哈希表大小掩码，用于计算索引值</span>
    <span class="token comment">// 总是等于 size - 1</span>
    unsigned <span class="token keyword">long</span> sizemask<span class="token punctuation">;</span>
    <span class="token comment">// 该哈希表已有节点的数量</span>
    unsigned <span class="token keyword">long</span> used<span class="token punctuation">;</span>
<span class="token punctuation">}</span> dictht<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>table</code> 属性是一个数组，数组中的每个元素都是一个指向 <code v-pre>dict.h/dictEntry</code> 结构的指针，每个 <code v-pre>dictEntry</code> 结构保存着一个键值对。</p>
<p><code v-pre>size</code> 属性记录了哈希表的大小，也即是 <code v-pre>table</code> 数组的大小，而 <code v-pre>used</code> 属性则记录了哈希表目前已有节点（键值对）的数量。</p>
<p><code v-pre>sizemask</code> 属性的值总是等于 <code v-pre>size - 1</code> ，这个属性和哈希值一起决定一个键应该被放到 <code v-pre>table</code> 数组的哪个索引上面。</p>
<p>图 4-1 展示了一个大小为 <code v-pre>4</code> 的空哈希表（没有包含任何键值对）。</p>
<figure><img src="/assets/images/d234cadc40e81da676a8b541d9cb6ab4.png" alt="字典的实现 - 图1" tabindex="0" loading="lazy"><figcaption>字典的实现 - 图1</figcaption></figure>
<h2 id="哈希表节点" tabindex="-1"><a class="header-anchor" href="#哈希表节点" aria-hidden="true">#</a> 哈希表节点</h2>
<p>哈希表节点使用 <code v-pre>dictEntry</code> 结构表示，每个 <code v-pre>dictEntry</code> 结构都保存着一个键值对：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>typedef struct dictEntry <span class="token punctuation">{</span>
    <span class="token comment">// 键</span>
    <span class="token keyword">void</span> <span class="token operator">*</span>key<span class="token punctuation">;</span>
    <span class="token comment">// 值</span>
    union <span class="token punctuation">{</span>
        <span class="token keyword">void</span> <span class="token operator">*</span>val<span class="token punctuation">;</span>
        uint64_t u64<span class="token punctuation">;</span>
        int64_t s64<span class="token punctuation">;</span>
    <span class="token punctuation">}</span> v<span class="token punctuation">;</span>
    <span class="token comment">// 指向下个哈希表节点，形成链表</span>
    struct dictEntry <span class="token operator">*</span>next<span class="token punctuation">;</span>
<span class="token punctuation">}</span> dictEntry<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>key</code> 属性保存着键值对中的键，而 <code v-pre>v</code> 属性则保存着键值对中的值，其中键值对的值可以是一个指针，或者是一个 <code v-pre>uint64_t</code> 整数，又或者是一个 <code v-pre>int64_t</code> 整数。</p>
<p><code v-pre>next</code> 属性是指向另一个哈希表节点的指针，这个指针可以将多个哈希值相同的键值对连接在一次，以此来解决键冲突（collision）的问题。</p>
<p>举个例子，图 4-2 就展示了如何通过 <code v-pre>next</code> 指针，将两个索引值相同的键 <code v-pre>k1</code> 和 <code v-pre>k0</code> 连接在一起。</p>
<figure><img src="/assets/images/d9710d39e895a6eb8210645c6e0b85e3.png" alt="字典的实现 - 图2" tabindex="0" loading="lazy"><figcaption>字典的实现 - 图2</figcaption></figure>
<h2 id="字典" tabindex="-1"><a class="header-anchor" href="#字典" aria-hidden="true">#</a> 字典</h2>
<p>Redis 中的字典由 <code v-pre>dict.h/dict</code> 结构表示：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>typedef struct dict <span class="token punctuation">{</span>
    <span class="token comment">// 类型特定函数</span>
    dictType <span class="token operator">*</span>type<span class="token punctuation">;</span>
    <span class="token comment">// 私有数据</span>
    <span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">;</span>
    <span class="token comment">// 哈希表</span>
    dictht ht<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token comment">// rehash 索引</span>
    <span class="token comment">// 当 rehash 不在进行时，值为 -1</span>
    <span class="token keyword">int</span> rehashidx<span class="token punctuation">;</span> <span class="token comment">/* rehashing not in progress if rehashidx == -1 */</span>
<span class="token punctuation">}</span> dict<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>type</code> 属性和 <code v-pre>privdata</code> 属性是针对不同类型的键值对，为创建多态字典而设置的：</p>
<ul>
<li><code v-pre>type</code> 属性是一个指向 <code v-pre>dictType</code> 结构的指针，每个 <code v-pre>dictType</code> 结构保存了一簇用于操作特定类型键值对的函数，Redis 会为用途不同的字典设置不同的类型特定函数。</li>
<li>而 <code v-pre>privdata</code> 属性则保存了需要传给那些类型特定函数的可选参数。</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>typedef struct dictType <span class="token punctuation">{</span>
    <span class="token comment">// 计算哈希值的函数</span>
    unsigned <span class="token keyword">int</span> <span class="token punctuation">(</span><span class="token operator">*</span>hashFunction<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">const</span> <span class="token keyword">void</span> <span class="token operator">*</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 复制键的函数</span>
    <span class="token keyword">void</span> <span class="token operator">*</span><span class="token punctuation">(</span><span class="token operator">*</span>keyDup<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">,</span> <span class="token keyword">const</span> <span class="token keyword">void</span> <span class="token operator">*</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 复制值的函数</span>
    <span class="token keyword">void</span> <span class="token operator">*</span><span class="token punctuation">(</span><span class="token operator">*</span>valDup<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">,</span> <span class="token keyword">const</span> <span class="token keyword">void</span> <span class="token operator">*</span>obj<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 对比键的函数</span>
    <span class="token keyword">int</span> <span class="token punctuation">(</span><span class="token operator">*</span>keyCompare<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">,</span> <span class="token keyword">const</span> <span class="token keyword">void</span> <span class="token operator">*</span>key1<span class="token punctuation">,</span> <span class="token keyword">const</span> <span class="token keyword">void</span> <span class="token operator">*</span>key2<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 销毁键的函数</span>
    <span class="token keyword">void</span> <span class="token punctuation">(</span><span class="token operator">*</span>keyDestructor<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">,</span> <span class="token keyword">void</span> <span class="token operator">*</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 销毁值的函数</span>
    <span class="token keyword">void</span> <span class="token punctuation">(</span><span class="token operator">*</span>valDestructor<span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token keyword">void</span> <span class="token operator">*</span>privdata<span class="token punctuation">,</span> <span class="token keyword">void</span> <span class="token operator">*</span>obj<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span> dictType<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>ht</code> 属性是一个包含两个项的数组，数组中的每个项都是一个 <code v-pre>dictht</code> 哈希表，一般情况下，字典只使用 <code v-pre>ht[0]</code> 哈希表，<code v-pre>ht[1]</code> 哈希表只会在对 <code v-pre>ht[0]</code> 哈希表进行 rehash 时使用。</p>
<p>除了 <code v-pre>ht[1]</code> 之外，另一个和 rehash 有关的属性就是 <code v-pre>rehashidx</code> ：它记录了 rehash 目前的进度，如果目前没有在进行 rehash ，那么它的值为 <code v-pre>-1</code> 。</p>
<p>图 4-3 展示了一个普通状态下（没有进行 rehash）的字典：</p>
<figure><img src="/assets/images/eac62f3b0d93e90dd8f19789d013c1ec.png" alt="字典的实现 - 图3" tabindex="0" loading="lazy"><figcaption>字典的实现 - 图3</figcaption></figure>
<h2 id="哈希算法" tabindex="-1"><a class="header-anchor" href="#哈希算法" aria-hidden="true">#</a> 哈希算法</h2>
<p>当要将一个新的键值对添加到字典里面时，程序需要先根据键值对的键计算出哈希值和索引值，然后再根据索引值，将包含新键值对的哈希表节点放到哈希表数组的指定索引上面。</p>
<p>Redis 计算哈希值和索引值的方法如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 使用字典设置的哈希函数，计算键 key 的哈希值
hash <span class="token operator">=</span> dict<span class="token operator">-></span>type<span class="token operator">-></span><span class="token function">hashFunction</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
 
# 使用哈希表的 sizemask 属性和哈希值，计算出索引值
# 根据情况不同， ht<span class="token punctuation">[</span>x<span class="token punctuation">]</span> 可以是 ht<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span> 或者 ht<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
index <span class="token operator">=</span> hash <span class="token operator">&amp;</span> dict<span class="token operator">-></span>ht<span class="token punctuation">[</span>x<span class="token punctuation">]</span><span class="token punctuation">.</span>sizemask<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="/assets/images/108cd6b414ab2dbb30126c0fb0700e23.png" alt="哈希算法 - 图1" tabindex="0" loading="lazy"><figcaption>哈希算法 - 图1</figcaption></figure>
<p>举个例子，对于图 4-4 所示的字典来说，如果我们要将一个键值对 <code v-pre>k0</code> 和 <code v-pre>v0</code> 添加到字典里面，那么程序会先使用语句：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>hash <span class="token operator">=</span> dict<span class="token operator">-></span>type<span class="token operator">-></span><span class="token function">hashFunction</span><span class="token punctuation">(</span>k0<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>计算键 <code v-pre>k0</code> 的哈希值。</p>
<p>假设计算得出的哈希值为 <code v-pre>8</code> ，那么程序会继续使用语句：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>index <span class="token operator">=</span> hash <span class="token operator">&amp;</span> dict<span class="token operator">-></span>ht<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>sizemask <span class="token operator">=</span> <span class="token number">8</span> <span class="token operator">&amp;</span> <span class="token number">3</span> <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>计算出键 k0 的索引值 0 ，这表示包含键值对 k0 和 v0 的节点应该被放置到哈希表数组的索引 0 位置上，如图 4-5 所示。</p>
<figure><img src="/assets/images/b126a2a46dcd9ec3380c1b5bd4992bb3.png" alt="哈希算法 - 图2" tabindex="0" loading="lazy"><figcaption>哈希算法 - 图2</figcaption></figure>
<p>当字典被用作数据库的底层实现，或者哈希键的底层实现时，Redis 使用 MurmurHash2 算法来计算键的哈希值。</p>
<p>MurmurHash 算法最初由 Austin Appleby 于 2008 年发明，这种算法的优点在于，即使输入的键是有规律的，算法仍能给出一个很好的随机分布性，并且算法的计算速度也非常快。</p>
<p>MurmurHash 算法目前的最新版本为 MurmurHash3 ，而 Redis 使用的是 MurmurHash2 ，关于 MurmurHash 算法的更多信息可以参考该算法的主页：<a href="http://code.google.com/p/smhasher/" target="_blank" rel="noopener noreferrer">http://code.google.com/p/smhasher/<ExternalLinkIcon/></a> 。</p>
</div></template>


