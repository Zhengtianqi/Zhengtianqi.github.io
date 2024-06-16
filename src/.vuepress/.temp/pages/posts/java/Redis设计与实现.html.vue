<template><div><h1 id="数据结构与对象" tabindex="-1"><a class="header-anchor" href="#数据结构与对象" aria-hidden="true">#</a> 数据结构与对象</h1>
<h2 id="简单动态字符串" tabindex="-1"><a class="header-anchor" href="#简单动态字符串" aria-hidden="true">#</a> 简单动态字符串</h2>
<h3 id="sds的定义" tabindex="-1"><a class="header-anchor" href="#sds的定义" aria-hidden="true">#</a> SDS的定义</h3>
<p>每个 <code v-pre>sds.h/sdshdr</code> 结构表示一个 SDS 值：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>struct sdshdr <span class="token punctuation">{</span>
    <span class="token comment">// 记录 buf 数组中已使用字节的数量</span>
    <span class="token comment">// 等于 SDS 所保存字符串的长度</span>
    <span class="token keyword">int</span> len<span class="token punctuation">;</span>
    <span class="token comment">// 记录 buf 数组中未使用字节的数量</span>
    <span class="token keyword">int</span> free<span class="token punctuation">;</span>
    <span class="token comment">// 字节数组，用于保存字符串</span>
    <span class="token keyword">char</span> buf<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>图 2-1 展示了一个 SDS 示例：</p>
<ul>
<li><code v-pre>free</code> 属性的值为 <code v-pre>0</code> ，表示这个 SDS 没有分配任何未使用空间。</li>
<li><code v-pre>len</code> 属性的值为 <code v-pre>5</code> ，表示这个 SDS 保存了一个五字节长的字符串。</li>
<li><code v-pre>buf</code> 属性是一个 <code v-pre>char</code> 类型的数组，数组的前五个字节分别保存了 <code v-pre>'R'</code> 、 <code v-pre>'e'</code> 、 <code v-pre>'d'</code> 、 <code v-pre>'i'</code> 、 <code v-pre>'s'</code> 五个字符，而最后一个字节则保存了空字符 <code v-pre>'\0'</code> 。</li>
</ul>
<figure><img src="/assets/images/ffd661fb15bf746863a6e57d7aca04c4.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>SDS 遵循 C 字符串以空字符结尾的惯例，保存空字符的 <code v-pre>1</code> 字节空间不计算在 SDS 的 <code v-pre>len</code> 属性里面，并且为空字符分配额外的 <code v-pre>1</code> 字节空间，以及添加空字符到字符串末尾等操作都是由 SDS 函数自动完成的，所以这个空字符对于 SDS 的使用者来说是完全透明的。</p>
<p>遵循空字符结尾这一惯例的好处是，SDS 可以直接重用一部分 C 字符串函数库里面的函数。</p>
<p>举个例子，如果我们有一个指向图 2-1 所示 SDS 的指针 <code v-pre>s</code> ，那么我们可以直接使用 <code v-pre>stdio.h/printf</code> 函数，通过执行以下语句：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%s"</span><span class="token punctuation">,</span> s<span class="token operator">-></span>buf<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>来打印出 SDS 保存的字符串值 <code v-pre>&quot;Redis&quot;</code> ，而无须为 SDS 编写专门的打印函数。</p>
<p>图2-2 展示了另一个 SDS 示例:</p>
<ul>
<li>这个 SDS 和之前展示的 SDS 一样，都保存了字符串值 <code v-pre>&quot;Redis&quot;</code> 。</li>
<li>这个 SDS 和之前展示的 SDS 的区别在于，这个 SDS 为 <code v-pre>buf</code> 数组分配了五字节未使用空间，所以它的 <code v-pre>free</code> 属性的值为 <code v-pre>5</code>（图中使用五个空格来表示五字节的未使用空间）。</li>
</ul>
<figure><img src="/assets/images/e13f637bd584b1563442aeaece8cf1e4.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>接下来的一节将详细地说明未使用空间在 SDS 中的作用。</p>
<h3 id="sds-与-c-字符串的区别" tabindex="-1"><a class="header-anchor" href="#sds-与-c-字符串的区别" aria-hidden="true">#</a> SDS 与 C 字符串的区别</h3>
<p>根据传统，C 语言使用长度为 <code v-pre>N+1</code> 的字符数组来表示长度为 <code v-pre>N</code> 的字符串，并且字符数组的最后一个元素总是空字符 <code v-pre>'\0'</code> 。</p>
<p>比如说，图 2-3 就展示了一个值为 <code v-pre>&quot;Redis&quot;</code> 的 C 字符串：</p>
<figure><img src="/assets/images/2cfc91e2dc6104321827e210ccfc595c.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>C 语言使用的这种简单的字符串表示方式，并不能满足 Redis 对字符串在安全性、效率、以及功能方面的要求，本节接下来的内容将详细对比 C 字符串和 SDS 之间的区别，并说明 SDS 比 C 字符串更适用于 Redis 的原因。</p>
<h4 id="常数复杂度获取字符串长度" tabindex="-1"><a class="header-anchor" href="#常数复杂度获取字符串长度" aria-hidden="true">#</a> 常数复杂度获取字符串长度</h4>
<p>因为 C 字符串并不记录自身的长度信息，所以为了获取一个 C 字符串的长度，程序必须遍历整个字符串，对遇到的每个字符进行计数，直到遇到代表字符串结尾的空字符为止，这个操作的复杂度为 O(N) 。</p>
<p>举个例子，图 2-4 展示了程序计算一个 C 字符串长度的过程。</p>
<figure><img src="/assets/images/ce0bdff067bf19a083c5d26b1266bb44.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/edf97c87de27aae8adafce7f255f0870.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/f8f4bde6cb9aeac56366a2f3853f24f3.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/a7d8693f0dccfde8ecd0919cff94ff88.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/879bfdfc7cab85a54bed5a33275c6dc0.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/d133e6d9b982b320594ea62168dbe462.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>和 C 字符串不同，因为 SDS 在 <code v-pre>len</code> 属性中记录了 SDS 本身的长度，所以获取一个 SDS 长度的复杂度仅为 O(1) 。</p>
<p>举个例子，对于图 2-5 所示的 SDS 来说，程序只要访问 SDS 的 <code v-pre>len</code> 属性，就可以立即知道 SDS 的长度为 <code v-pre>5</code> 字节：</p>
<figure><img src="/assets/images/1112dfc7b11a214351a67103cd58a5c8.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>又比如说，对于图 2-6 展示的 SDS 来说，程序只要访问 SDS 的 <code v-pre>len</code> 属性，就可以立即知道 SDS 的长度为 <code v-pre>11</code> 字节。</p>
<figure><img src="/assets/images/7fdd593ac3e140d5cd2e9328b51110c9.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>设置和更新 SDS 长度的工作是由 SDS 的 API 在执行时自动完成的，使用 SDS 无须进行任何手动修改长度的工作。</p>
<p>通过使用 SDS 而不是 C 字符串，Redis 将获取字符串长度所需的复杂度从 O(N) 降低到了 O(1) ，这确保了获取字符串长度的工作不会成为 Redis 的性能瓶颈。</p>
<p>比如说，因为字符串键在底层使用 SDS 来实现，所以即使我们对一个非常长的字符串键反复执行 STRLEN 命令，也不会对系统性能造成任何影响，因为 STRLEN 命令的复杂度仅为 O(1) 。</p>
<h4 id="杜绝缓冲区溢出" tabindex="-1"><a class="header-anchor" href="#杜绝缓冲区溢出" aria-hidden="true">#</a> 杜绝缓冲区溢出</h4>
<p>除了获取字符串长度的复杂度高之外，C 字符串不记录自身长度带来的另一个问题是容易造成缓冲区溢出（buffer overflow）。</p>
<p>举个例子，<code v-pre>&lt;string.h&gt;/strcat</code> 函数可以将 <code v-pre>src</code> 字符串中的内容拼接到 <code v-pre>dest</code> 字符串的末尾：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">char</span> <span class="token operator">*</span><span class="token function">strcat</span><span class="token punctuation">(</span><span class="token keyword">char</span> <span class="token operator">*</span>dest<span class="token punctuation">,</span> <span class="token keyword">const</span> <span class="token keyword">char</span> <span class="token operator">*</span>src<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>因为 C 字符串不记录自身的长度，所以 <code v-pre>strcat</code> 假定用户在执行这个函数时，已经为 <code v-pre>dest</code> 分配了足够多的内存，可以容纳 <code v-pre>src</code> 字符串中的所有内容，而一旦这个假定不成立时，就会产生缓冲区溢出。</p>
<p>举个例子，假设程序里有两个在内存中紧邻着的 C 字符串 <code v-pre>s1</code> 和 <code v-pre>s2</code> ，其中 <code v-pre>s1</code> 保存了字符串 <code v-pre>&quot;Redis&quot;</code> ，而 <code v-pre>s2</code> 则保存了字符串 <code v-pre>&quot;MongoDB&quot;</code> ，如图 2-7 所示。</p>
<figure><img src="/assets/images/9b9139fd46f7419279ba6346b090ddc7.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>如果一个程序员决定通过执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">strcat</span><span class="token punctuation">(</span>s1<span class="token punctuation">,</span> <span class="token string">" Cluster"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>将 <code v-pre>s1</code> 的内容修改为 <code v-pre>&quot;Redis Cluster&quot;</code> ，但粗心的他却忘了在执行 <code v-pre>strcat</code> 之前为 <code v-pre>s1</code> 分配足够的空间，那么在 <code v-pre>strcat</code> 函数执行之后，<code v-pre>s1</code> 的数据将溢出到 <code v-pre>s2</code> 所在的空间中，导致 <code v-pre>s2</code> 保存的内容被意外地修改，如图 2-8 所示。</p>
<figure><img src="/assets/images/79c1c0a4746f50074f0e44491d3cb8b3.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>与 C 字符串不同，SDS 的空间分配策略完全杜绝了发生缓冲区溢出的可能性：当 SDS API 需要对 SDS 进行修改时，API 会先检查 SDS 的空间是否满足修改所需的要求，如果不满足的话，API 会自动将 SDS 的空间扩展至执行修改所需的大小，然后才执行实际的修改操作，所以使用 SDS 既不需要手动修改 SDS 的空间大小，也不会出现前面所说的缓冲区溢出问题。</p>
<p>举个例子，SDS 的 API 里面也有一个用于执行拼接操作的 <code v-pre>sdscat</code> 函数，它可以将一个 C 字符串拼接到给定 SDS 所保存的字符串的后面，但是在执行拼接操作之前，<code v-pre>sdscat</code> 会先检查给定 SDS 的空间是否足够，如果不够的话，<code v-pre>sdscat</code> 就会先扩展 SDS 的空间，然后才执行拼接操作。</p>
<p>比如说，如果我们执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">sdscat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Cluster"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>其中 SDS 值 <code v-pre>s</code> 如图 2-9 所示，那么 <code v-pre>sdscat</code> 将在执行拼接操作之前检查 <code v-pre>s</code> 的长度是否足够，在发现 <code v-pre>s</code> 目前的空间不足以拼接 <code v-pre>&quot; Cluster&quot;</code> 之后，<code v-pre>sdscat</code> 就会先扩展 <code v-pre>s</code> 的空间，然后才执行拼接 <code v-pre>&quot; Cluster&quot;</code> 的操作，拼接操作完成之后的 SDS 如图 2-10 所示。</p>
<figure><img src="/assets/images/a4ef9088f117a8766ac65c4a1a630a34.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/57c9d55222f65769c0ab0844bc5b6432.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>注意图 2-10 所示的 SDS ：<code v-pre>sdscat</code> 不仅对这个 SDS 进行了拼接操作，它还为 SDS 分配了 <code v-pre>13</code> 字节的未使用空间，并且拼接之后的字符串也正好是 <code v-pre>13</code> 字节长，这种现象既不是 bug 也不是巧合，它和 SDS 的空间分配策略有关，接下来的小节将对这一策略进行说明。</p>
<h4 id="减少修改字符串时带来的内存重分配次数" tabindex="-1"><a class="header-anchor" href="#减少修改字符串时带来的内存重分配次数" aria-hidden="true">#</a> 减少修改字符串时带来的内存重分配次数</h4>
<p>正如前两个小节所说，因为 C 字符串并不记录自身的长度，所以对于一个包含了 <code v-pre>N</code> 个字符的 C 字符串来说，这个 C 字符串的底层实现总是一个 <code v-pre>N+1</code> 个字符长的数组（额外的一个字符空间用于保存空字符）。</p>
<p>因为 C 字符串的长度和底层数组的长度之间存在着这种关联性，所以每次增长或者缩短一个 C 字符串，程序都总要对保存这个 C 字符串的数组进行一次内存重分配操作：</p>
<ul>
<li>如果程序执行的是增长字符串的操作，比如拼接操作（append），那么在执行这个操作之前，程序需要先通过内存重分配来扩展底层数组的空间大小 ——如果忘了这一步就会产生缓冲区溢出。</li>
<li>如果程序执行的是缩短字符串的操作，比如截断操作（trim），那么在执行这个操作之后，程序需要通过内存重分配来释放字符串不再使用的那部分空间 ——如果忘了这一步就会产生内存泄漏。</li>
</ul>
<p>举个例子，如果我们持有一个值为 <code v-pre>&quot;Redis&quot;</code> 的 C 字符串 <code v-pre>s</code> ，那么为了将 <code v-pre>s</code> 的值改为 <code v-pre>&quot;Redis Cluster&quot;</code> ，在执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">strcat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Cluster"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>之前，我们需要先使用内存重分配操作，扩展 <code v-pre>s</code> 的空间。</p>
<p>之后，如果我们又打算将 <code v-pre>s</code> 的值从 <code v-pre>&quot;Redis Cluster&quot;</code> 改为 <code v-pre>&quot;Redis Cluster Tutorial&quot;</code> ，那么在执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">strcat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Tutorial"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>之前，我们需要再次使用内存重分配扩展 <code v-pre>s</code> 的空间，诸如此类。</p>
<p>因为内存重分配涉及复杂的算法，并且可能需要执行系统调用，所以它通常是一个比较耗时的操作：</p>
<ul>
<li>在一般程序中，如果修改字符串长度的情况不太常出现，那么每次修改都执行一次内存重分配是可以接受的。</li>
<li>但是 Redis 作为数据库，经常被用于速度要求严苛、数据被频繁修改的场合，如果每次修改字符串的长度都需要执行一次内存重分配的话，那么光是执行内存重分配的时间就会占去修改字符串所用时间的一大部分，如果这种修改频繁地发生的话，可能还会对性能造成影响。</li>
</ul>
<p>为了避免 C 字符串的这种缺陷，SDS 通过未使用空间解除了字符串长度和底层数组长度之间的关联：在 SDS 中，<code v-pre>buf</code> 数组的长度不一定就是字符数量加一，数组里面可以包含未使用的字节，而这些字节的数量就由 SDS 的 <code v-pre>free</code> 属性记录。</p>
<p>通过未使用空间，SDS 实现了空间预分配和惰性空间释放两种优化策略。</p>
<h5 id="空间预分配" tabindex="-1"><a class="header-anchor" href="#空间预分配" aria-hidden="true">#</a> 空间预分配</h5>
<p>空间预分配用于优化 SDS 的字符串增长操作：当 SDS 的 API 对一个 SDS 进行修改，并且需要对 SDS 进行空间扩展的时候，程序不仅会为 SDS 分配修改所必须要的空间，还会为 SDS 分配额外的未使用空间。</p>
<p>其中，额外分配的未使用空间数量由以下公式决定：</p>
<ul>
<li>如果对 SDS 进行修改之后，SDS 的长度（也即是 <code v-pre>len</code> 属性的值）将小于 <code v-pre>1 MB</code> ，那么程序分配和 <code v-pre>len</code> 属性同样大小的未使用空间，这时 SDS <code v-pre>len</code> 属性的值将和 <code v-pre>free</code> 属性的值相同。举个例子，如果进行修改之后，SDS 的 <code v-pre>len</code> 将变成 <code v-pre>13</code> 字节，那么程序也会分配 <code v-pre>13</code> 字节的未使用空间，SDS 的 <code v-pre>buf</code> 数组的实际长度将变成 <code v-pre>13 + 13 + 1 = 27</code> 字节（额外的一字节用于保存空字符）。</li>
<li>如果对 SDS 进行修改之后，SDS 的长度将大于等于 <code v-pre>1 MB</code> ，那么程序会分配 <code v-pre>1 MB</code> 的未使用空间。举个例子，如果进行修改之后，SDS 的 <code v-pre>len</code> 将变成 <code v-pre>30 MB</code> ，那么程序会分配 <code v-pre>1 MB</code> 的未使用空间，SDS 的 <code v-pre>buf</code> 数组的实际长度将为 <code v-pre>30 MB + 1 MB + 1 byte</code> 。</li>
</ul>
<p>通过空间预分配策略，Redis 可以减少连续执行字符串增长操作所需的内存重分配次数。</p>
<p>举个例子，对于图 2-11 所示的 SDS 值 <code v-pre>s</code> 来说，如果我们执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">sdscat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Cluster"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>那么 <code v-pre>sdscat</code> 将执行一次内存重分配操作，将 SDS 的长度修改为 <code v-pre>13</code> 字节，并将 SDS 的未使用空间同样修改为 <code v-pre>13</code> 字节，如图 2-12 所示。</p>
<figure><img src="/assets/images/d6f2bab64eddad3ee5d092672e8fac50.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/41d2985c3545a456341af1e4f5b8231a.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>如果这时，我们再次对 <code v-pre>s</code> 执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">sdscat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Tutorial"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>那么这次 <code v-pre>sdscat</code> 将不需要执行内存重分配：因为未使用空间里面的 <code v-pre>13</code> 字节足以保存 <code v-pre>9</code> 字节的 <code v-pre>&quot; Tutorial&quot;</code> ，执行 <code v-pre>sdscat</code> 之后的 SDS 如图 2-13 所示。</p>
<figure><img src="/assets/images/b5a900fe460481976d0ae062ab18dd61.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>在扩展 SDS 空间之前，SDS API 会先检查未使用空间是否足够，如果足够的话，API 就会直接使用未使用空间，而无须执行内存重分配。</p>
<p>通过这种预分配策略，SDS 将连续增长 <code v-pre>N</code> 次字符串所需的内存重分配次数从必定 <code v-pre>N</code> 次降低为最多 <code v-pre>N</code> 次。</p>
<h5 id="惰性空间释放" tabindex="-1"><a class="header-anchor" href="#惰性空间释放" aria-hidden="true">#</a> 惰性空间释放</h5>
<p>惰性空间释放用于优化 SDS 的字符串缩短操作：当 SDS 的 API 需要缩短 SDS 保存的字符串时，程序并不立即使用内存重分配来回收缩短后多出来的字节，而是使用 <code v-pre>free</code> 属性将这些字节的数量记录起来，并等待将来使用。</p>
<p>举个例子，<code v-pre>sdstrim</code> 函数接受一个 SDS 和一个 C 字符串作为参数，从 SDS 左右两端分别移除所有在 C 字符串中出现过的字符。</p>
<p>比如对于图 2-14 所示的 SDS 值 <code v-pre>s</code> 来说，执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">sdstrim</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">"XY"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>   <span class="token comment">// 移除 SDS 字符串中的所有 'X' 和 'Y'</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>会将 SDS 修改成图 2-15 所示的样子。</p>
<figure><img src="/assets/images/a9ef70a7189d7eeaba7c7b93d1d93e7b.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<figure><img src="/assets/images/f785ade6f77521bce18fc9f8825d4d9b.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>注意执行 <code v-pre>sdstrim</code> 之后的 SDS 并没有释放多出来的 <code v-pre>8</code> 字节空间，而是将这 <code v-pre>8</code> 字节空间作为未使用空间保留在了 SDS 里面，如果将来要对 SDS 进行增长操作的话，这些未使用空间就可能会派上用场。</p>
<p>举个例子，如果现在对 <code v-pre>s</code> 执行：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token function">sdscat</span><span class="token punctuation">(</span>s<span class="token punctuation">,</span> <span class="token string">" Redis"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>那么完成这次 <code v-pre>sdscat</code> 操作将不需要执行内存重分配：因为 SDS 里面预留的 <code v-pre>8</code> 字节空间已经足以拼接 <code v-pre>6</code> 个字节长的 <code v-pre>&quot; Redis&quot;</code> ，如图 2-16 所示。</p>
<figure><img src="/assets/images/2b97031c92882db452d126852b74cfb2.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>通过惰性空间释放策略，SDS 避免了缩短字符串时所需的内存重分配操作，并为将来可能有的增长操作提供了优化。</p>
<p>与此同时，SDS 也提供了相应的 API ，让我们可以在有需要时，真正地释放 SDS 里面的未使用空间，所以不用担心惰性空间释放策略会造成内存浪费。</p>
<h4 id="二进制安全" tabindex="-1"><a class="header-anchor" href="#二进制安全" aria-hidden="true">#</a> 二进制安全</h4>
<p>C 字符串中的字符必须符合某种编码（比如 ASCII），并且除了字符串的末尾之外，字符串里面不能包含空字符，否则最先被程序读入的空字符将被误认为是字符串结尾 ——这些限制使得 C 字符串只能保存文本数据，而不能保存像图片、音频、视频、压缩文件这样的二进制数据。</p>
<p>举个例子，如果有一种使用空字符来分割多个单词的特殊数据格式，如图 2-17 所示，那么这种格式就不能使用 C 字符串来保存，因为 C 字符串所用的函数只会识别出其中的 <code v-pre>&quot;Redis&quot;</code> ，而忽略之后的 <code v-pre>&quot;Cluster&quot;</code> 。</p>
<figure><img src="/assets/images/9c9e497f4dc73587aa9d620a4149101c.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>虽然数据库一般用于保存文本数据，但使用数据库来保存二进制数据的场景也不少见，因此，为了确保 Redis 可以适用于各种不同的使用场景，SDS 的 API 都是二进制安全的（binary-safe）：所有 SDS API 都会以处理二进制的方式来处理 SDS 存放在 <code v-pre>buf</code> 数组里的数据，程序不会对其中的数据做任何限制、过滤、或者假设 ——数据在写入时是什么样的，它被读取时就是什么样。</p>
<p>这也是我们将 SDS 的 <code v-pre>buf</code> 属性称为字节数组的原因 ——Redis 不是用这个数组来保存字符，而是用它来保存一系列二进制数据。</p>
<p>比如说，使用 SDS 来保存之前提到的特殊数据格式就没有任何问题，因为 SDS 使用 <code v-pre>len</code> 属性的值而不是空字符来判断字符串是否结束，如图 2-18 所示。</p>
<figure><img src="/assets/images/157e6450653a0fc457342b5794658fc9.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>通过使用二进制安全的 SDS ，而不是 C 字符串，使得 Redis 不仅可以保存文本数据，还可以保存任意格式的二进制数据。</p>
<h5 id="兼容部分-c-字符串函数" tabindex="-1"><a class="header-anchor" href="#兼容部分-c-字符串函数" aria-hidden="true">#</a> 兼容部分 C 字符串函数</h5>
<p>虽然 SDS 的 API 都是二进制安全的，但它们一样遵循 C 字符串以空字符结尾的惯例：这些 API 总会将 SDS 保存的数据的末尾设置为空字符，并且总会在为 <code v-pre>buf</code> 数组分配空间时多分配一个字节来容纳这个空字符，这是为了让那些保存文本数据的 SDS 可以重用一部分 <code v-pre>&lt;string.h&gt;</code> 库定义的函数。</p>
<figure><img src="/assets/images/d1a8d5d473881fffebc5baccd896258d.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<p>举个例子，如图 2-19 所示，如果我们有一个保存文本数据的 SDS 值 <code v-pre>sds</code> ，那么我们就可以重用 <code v-pre>&lt;string.h&gt;/strcasecmp</code> 函数，使用它来对比 SDS 保存的字符串和另一个 C 字符串：</p>
<div class="language-text line-numbers-mode" data-ext="text"><pre v-pre class="language-text"><code>strcasecmp(sds->buf, "hello world");
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这样 Redis 就不用自己专门去写一个函数来对比 SDS 值和 C 字符串值了。</p>
<p>与此类似，我们还可以将一个保存文本数据的 SDS 作为 <code v-pre>strcat</code> 函数的第二个参数，将 SDS 保存的字符串追加到一个 C 字符串的后面：</p>
<div class="language-text line-numbers-mode" data-ext="text"><pre v-pre class="language-text"><code>strcat(c_string, sds->buf);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这样 Redis 就不用专门编写一个将 SDS 字符串追加到 C 字符串之后的函数了。</p>
<p>通过遵循 C 字符串以空字符结尾的惯例，SDS 可以在有需要时重用 <code v-pre>&lt;string.h&gt;</code> 函数库，从而避免了不必要的代码重复。</p>
<h3 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h3>
<p>表 2-1 对 C 字符串和 SDS 之间的区别进行了总结。</p>
<hr>
<p>表 2-1 C 字符串和 SDS 之间的区别</p>
<figure><img src="/assets/images/image-20220122144100590.png" alt="image-20220122144100590" tabindex="0" loading="lazy"><figcaption>image-20220122144100590</figcaption></figure>
</div></template>


