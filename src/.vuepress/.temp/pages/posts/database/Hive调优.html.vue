<template><div><h1 id="一、使用explain" tabindex="-1"><a class="header-anchor" href="#一、使用explain" aria-hidden="true">#</a> 一、使用EXPLAIN</h1>
<p>​		查看逻辑，更多用 EXPLAIN EXTENDED</p>
<h1 id="二、限制调整limit" tabindex="-1"><a class="header-anchor" href="#二、限制调整limit" aria-hidden="true">#</a> 二、限制调整LIMIT</h1>
<h1 id="三、join优化" tabindex="-1"><a class="header-anchor" href="#三、join优化" aria-hidden="true">#</a> 三、JOIN优化</h1>
<p>​		表足够小用map-side JOIN</p>
<h1 id="四、本地模式" tabindex="-1"><a class="header-anchor" href="#四、本地模式" aria-hidden="true">#</a> 四、本地模式</h1>
<p>​	对于小数据集，单机或单线程执行时间比较短</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>hive<span class="token operator">></span> set oldjobtracker<span class="token operator">=</span>$<span class="token punctuation">{</span>hiveconf<span class="token punctuation">.</span>mapred<span class="token punctuation">.</span>job<span class="token punctuation">.</span>tracker<span class="token punctuation">}</span><span class="token punctuation">;</span>
hive<span class="token operator">></span> set mapred<span class="token punctuation">.</span>job<span class="token punctuation">.</span>tracker<span class="token operator">=</span>local<span class="token punctuation">;</span>
hive<span class="token operator">></span> set mapred<span class="token punctuation">.</span>tmp<span class="token punctuation">.</span>dir<span class="token operator">=</span><span class="token operator">/</span>home<span class="token operator">/</span>edward<span class="token operator">/</span>tmp
hive<span class="token operator">></span> <span class="token constant">SELECT</span> <span class="token operator">*</span> from people <span class="token class-name">WHERE</span> firstname<span class="token operator">=</span>bob<span class="token punctuation">;</span>
hive<span class="token operator">></span> set mapred<span class="token punctuation">.</span>job<span class="token punctuation">.</span>tracker<span class="token operator">=</span>$<span class="token punctuation">{</span>oldjobtracker<span class="token punctuation">}</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="五、并行执行" tabindex="-1"><a class="header-anchor" href="#五、并行执行" aria-hidden="true">#</a> 五、并行执行</h1>
<p>hive.exec.parallell=true</p>
<h1 id="六、严格模式" tabindex="-1"><a class="header-anchor" href="#六、严格模式" aria-hidden="true">#</a> 六、严格模式</h1>
<p>hive.mapred.mode=strict</p>
<p>（1）必须有WHERE</p>
<p>（2）对于ORDER BY 的语句必须有LIMIT</p>
<p>（3）限制笛卡尔基的查询</p>
<h1 id="七、调整mapper和reducer个数" tabindex="-1"><a class="header-anchor" href="#七、调整mapper和reducer个数" aria-hidden="true">#</a> 七、调整mapper和reducer个数</h1>
<h1 id="八、jvm重用" tabindex="-1"><a class="header-anchor" href="#八、jvm重用" aria-hidden="true">#</a> 八、JVM重用</h1>
<h1 id="九、索引" tabindex="-1"><a class="header-anchor" href="#九、索引" aria-hidden="true">#</a> 九、索引</h1>
<h1 id="十、动态分区" tabindex="-1"><a class="header-anchor" href="#十、动态分区" aria-hidden="true">#</a> 十、动态分区</h1>
<h1 id="十一、推测执行" tabindex="-1"><a class="header-anchor" href="#十一、推测执行" aria-hidden="true">#</a> 十一、推测执行</h1>
<h1 id="十二、单个mapreducer中多个group-by" tabindex="-1"><a class="header-anchor" href="#十二、单个mapreducer中多个group-by" aria-hidden="true">#</a> 十二、单个MapReducer中多个GROUP BY</h1>
<h1 id="十三、虚拟列" tabindex="-1"><a class="header-anchor" href="#十三、虚拟列" aria-hidden="true">#</a> 十三、虚拟列</h1>
</div></template>


