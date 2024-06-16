<template><div><h1 id="一、基本数据类型" tabindex="-1"><a class="header-anchor" href="#一、基本数据类型" aria-hidden="true">#</a> 一、基本数据类型</h1>
<figure><img src="/assets/images/hive数据结构.png" alt="image-20200117105348449" tabindex="0" loading="lazy"><figcaption>image-20200117105348449</figcaption></figure>
<figure><img src="/assets/images/hive数据结构1.png" alt="image-20200117105505918" tabindex="0" loading="lazy"><figcaption>image-20200117105505918</figcaption></figure>
<p>上面图列表了Hive所支持的基本数据类型。</p>
<p>相同：这些数据类型是对 JAVA 中接口的实现，例如STRING是java中的String</p>
<p>不同：</p>
<p>​		1、在其他SQL方言中，通常会提供限制最大长度的 “字符数组” ，但是Hive不支持。</p>
<p>​		因为 Hive 是为了优化磁盘的读和写的性能，列长度不重要（定长易于索引）</p>
<p>​		2、TIMESTAMP的值可以是整数（距离Unix新纪元时间1970年1月1日，午夜12点的秒数）</p>
<p>​		；也可以是浮点数，精确到纳秒（小数点后9位）；还可以是字符号串，YYYY-MM-DD hh:mm:ss.fffffffff</p>
<p>​		3、TIMESTAMPS表示 UTC 时间。Hive 本身提供了不同时区相互转换的内置函数，to_utc_timestamp函数和 from_utc_timestamp函数</p>
<p>​		4、BINARY 和 VARCHAR 类似，但和 BLOB 不同。BINARY可以在记录中包含任意字节，这样可以防止Hive尝试将其作为数字，字符串等进行解析。</p>
<p>​		如果需要省略每行记录的尾部，无需使用 BINARY 数据类型。如果一个表的标结果指定的是3列，而实际数据文件每行记录包含有 5 个字段的话，那么 在 Hive 中最后 2 列数据将会被省略掉。</p>
<p>​		当 查询 将float与double对比，或者 int 和 float对比时，隐式使用较大的类型。</p>
<p>​		5、当需要把 字符串 转成 数值，那么需要显式：... cast(s AS INT) ... ;</p>
<h1 id="二、集合数据类型" tabindex="-1"><a class="header-anchor" href="#二、集合数据类型" aria-hidden="true">#</a> 二、集合数据类型</h1>
<p>Hive 中的列支持使用 strut map 和 array 集合数据类型，如下图</p>
<figure><img src="/assets/images/hive集合数据类型.png" alt="image-20200117111045081" tabindex="0" loading="lazy"><figcaption>image-20200117111045081</figcaption></figure>
<p>Hive 中没有 键 的概念，但是用户可以对表建立索引。</p>
<h1 id="三、创建表的实例" tabindex="-1"><a class="header-anchor" href="#三、创建表的实例" aria-hidden="true">#</a> 三、创建表的实例</h1>
<p>人力资源的员工表</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token constant">CREATE</span> <span class="token class-name">TABLE</span> <span class="token function">employees</span><span class="token punctuation">(</span>
	name <span class="token constant">STRTING</span><span class="token punctuation">,</span>
	salary <span class="token constant">FLOAT</span><span class="token punctuation">,</span>
	subordinates <span class="token constant">ARRAY</span><span class="token generics"><span class="token punctuation">&lt;</span>STRING<span class="token punctuation">></span></span><span class="token punctuation">,</span>
	deductions <span class="token constant">MAP</span><span class="token generics"><span class="token punctuation">&lt;</span>STRING<span class="token punctuation">,</span> STRING<span class="token punctuation">></span></span><span class="token punctuation">;</span>
    adress <span class="token constant">STRUCT</span><span class="token operator">&lt;</span>street<span class="token operator">:</span><span class="token constant">STRING</span><span class="token punctuation">,</span> city<span class="token operator">:</span><span class="token constant">STRING</span><span class="token operator">></span><span class="token punctuation">,</span> state<span class="token operator">:</span><span class="token constant">STRING</span><span class="token punctuation">,</span> zip<span class="token operator">:</span><span class="token constant">INT</span><span class="token punctuation">)</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="四、文本文件数据编码" tabindex="-1"><a class="header-anchor" href="#四、文本文件数据编码" aria-hidden="true">#</a> 四、文本文件数据编码</h1>
<p>Hive中默认的记录和 字段分隔符</p>
<figure><img src="/assets/images/image-20200117113506023.png" alt="image-20200117113506023" tabindex="0" loading="lazy"><figcaption>image-20200117113506023</figcaption></figure>
<p>实例使用：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token constant">CREATE</span> <span class="token class-name">TABLE</span> <span class="token function">some_data</span><span class="token punctuation">(</span>
	first <span class="token constant">FLOAT</span><span class="token punctuation">,</span>
	second <span class="token constant">FLOAT</span><span class="token punctuation">,</span>
	third <span class="token constant">FLOAT</span>
<span class="token punctuation">)</span>
<span class="token constant">ROW</span> <span class="token constant">FORMAT</span> <span class="token constant">DELIMITED</span>
<span class="token constant">FIELDS</span> <span class="token constant">TERMINQTED</span> <span class="token constant">BY</span> <span class="token char">','</span> <span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>用例如使用  '\t' (也就是指标建) 作为字段分隔符。可以利用他处理CSV格式数据。</p>
</div></template>


