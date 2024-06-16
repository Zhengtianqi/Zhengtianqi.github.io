<template><div><h1 id="一、场景" tabindex="-1"><a class="header-anchor" href="#一、场景" aria-hidden="true">#</a> 一、场景</h1>
<p>玩家每天游戏的各种操作（登录，充值等），这些行为都会记录到日志中，根据这些日志信息统计并分析用户行为。</p>
<h2 id="_1-、时延" tabindex="-1"><a class="header-anchor" href="#_1-、时延" aria-hidden="true">#</a> （1）、时延</h2>
<p>​		由于 Hadoop MapReduce 底层设计因素，在进行计算的过程中，在 Map 阶段的处理结果会写入磁盘中，在 Reduce 阶段再去下载 Map 阶段处理完的结果，Reduce 计算完毕后的结果又会回写磁盘中。</p>
<p>​		这样反复操作磁盘，I/O 开销很大，所耗费的时间自然也就偏高。这就意味着，Hadoop MapReduce 计算模型适合处理 批处理任务，而对实时统计任务则不适合，如 股票交易系统，银行交易系统。</p>
<h2 id="_2-、吞吐量" tabindex="-1"><a class="header-anchor" href="#_2-、吞吐量" aria-hidden="true">#</a> （2）、吞吐量</h2>
<p>​		在 Map 阶段中，被访问的数据是不能被修改的，直到整个作业 Job 完成。这就意味着，Hadoop MapReduce 是一个面向批处理的计算模型。</p>
<h2 id="_3-、应用" tabindex="-1"><a class="header-anchor" href="#_3-、应用" aria-hidden="true">#</a> （3）、应用：</h2>
<p>​		适合离线计算，MapReduce 支持统计用户点击量（PV）、独立访问量（UV）及大数据及的信息检索等。</p>
<h1 id="二、整体流程" tabindex="-1"><a class="header-anchor" href="#二、整体流程" aria-hidden="true">#</a> 二、整体流程</h1>
<figure><img src="/assets/images/HDFS-liucheng.png" alt="image-20191223112428348" tabindex="0" loading="lazy"><figcaption>image-20191223112428348</figcaption></figure>
<p>​		a. 收集数据</p>
<figure><img src="/assets/images/data-collect.png" alt="image-20191223112725005" tabindex="0" loading="lazy"><figcaption>image-20191223112725005</figcaption></figure>
<p>​		b. 采用HDFS将收集的数据按照业务进行分类存储</p>
<p>​		c. 使用计算模型进行分析、计算（模型有 Spark 、 Hive 、 Pig、 Tez 、 Flink等）</p>
<h1 id="三、整体分析" tabindex="-1"><a class="header-anchor" href="#三、整体分析" aria-hidden="true">#</a> 三、整体分析</h1>
<h2 id="_1-统计结果" tabindex="-1"><a class="header-anchor" href="#_1-统计结果" aria-hidden="true">#</a> （1）统计结果</h2>
<p>​		针对运营：了解用户对哪些业务感兴趣，需求量比较大，就可以重点投入。</p>
<p>​		针对开发者：统计数据后的结果</p>
<h2 id="_2-分析项目的目的" tabindex="-1"><a class="header-anchor" href="#_2-分析项目的目的" aria-hidden="true">#</a> （2）分析项目的目的</h2>
<p>​		a、可以分析各个业务模块的活跃度、在各个模块停留的时间及用户的消费明细。</p>
<p>​		b、企业制定决策，需要实际数据作为支撑，用户行为结果能够帮助企业在某块业务进行决策时提供可靠的数据依据。</p>
<p>​		c、推送活动信息能不能造成反感。可以通过精准推送来提升用户的留存感，如用户在浏览某商品高，可推荐该商品的优惠活动。</p>
<h1 id="四、行为分析" tabindex="-1"><a class="header-anchor" href="#四、行为分析" aria-hidden="true">#</a> 四、行为分析</h1>
<p>​		从业务数据中有效的分析各类统计指标（KPI）和数据源，让读者能够将<strong>数据源</strong>和**各类统计指标（KPI）**合理地关联起来。</p>
<h2 id="_1-数据源-与-统计指标-kpi-分析" tabindex="-1"><a class="header-anchor" href="#_1-数据源-与-统计指标-kpi-分析" aria-hidden="true">#</a> （1）数据源 与 统计指标（KPI）分析</h2>
<p>​	指标，这是很重要的；</p>
<p>​	合理的制定和可配置的制定可以更加方便后续工作。</p>
<p>​	每条日志记录通常表示：用户的一次行为记录。这些记录以 JSON 数据格式对操作行为进行封装。</p>
<figure><img src="/assets/images/user-log.png" alt="image-20191223114826757" tabindex="0" loading="lazy"><figcaption>image-20191223114826757</figcaption></figure>
<figure><img src="/assets/images/user-behaviour.png" alt="image-20191223114900518" tabindex="0" loading="lazy"><figcaption>image-20191223114900518</figcaption></figure>
<h2 id="_2-数据源-与-统计指标-kpi-的关系" tabindex="-1"><a class="header-anchor" href="#_2-数据源-与-统计指标-kpi-的关系" aria-hidden="true">#</a> （2）数据源 与 统计指标（KPI）的关系</h2>
<figure><img src="/assets/images/dataSource-behaviour-relative.png" alt="image-20191223115309185" tabindex="0" loading="lazy"><figcaption>image-20191223115309185</figcaption></figure>
<h1 id="四、整体设计" tabindex="-1"><a class="header-anchor" href="#四、整体设计" aria-hidden="true">#</a> 四、整体设计</h1>
<h2 id="_1-流程设计" tabindex="-1"><a class="header-anchor" href="#_1-流程设计" aria-hidden="true">#</a> （1）流程设计</h2>
<figure><img src="/assets/images/data-collect-analysis.png" alt="image-20191223115738971" tabindex="0" loading="lazy"><figcaption>image-20191223115738971</figcaption></figure>
<p>解释：</p>
<p>a. 数据量小，简单 使用脚本，反之用Flume等收集集群</p>
<p>b. 原始数据不一定是有效数据，所以要数据清洗，然后在用Hive进行数据建模</p>
<p>c. 实时计算可以用Flink、Spark、Storm</p>
<p>d. 最后结果可以存储在Oracle、Mysql、HBase、或者HDFS</p>
<h2 id="_2-统计指标设计" tabindex="-1"><a class="header-anchor" href="#_2-统计指标设计" aria-hidden="true">#</a> （2）统计指标设计</h2>
<p>a. 用户一周内登陆总数：根据用户ID去重来统计一周内登陆总数</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 用户 ID 去重，全平台，全站点统计</span>

<span class="token class-name">SELECT</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">DISTINCT</span> ‘uid’<span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>b. 用户一周中登陆分布情况，根据 IP 分组统计一周内的用户登录分布情况</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 用户 ID 去重且根据 IP 字段分组，全平台，全站点统计</span>

<span class="token constant">SELECT</span> ‘ip’<span class="token punctuation">,</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">DISTINCT</span> <span class="token char">'uid'</span><span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span> <span class="token constant">GROUP</span> <span class="token constant">BY</span> <span class="token char">'uid'</span><span class="token punctuation">,</span><span class="token char">'ip'</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>c. 不同平台下一周用户的登录情况，根据平台分组统计一周内的用户登录情况</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 用户 ID 去重且根据 plat 字段分组，全站点统计</span>

<span class="token constant">SELECT</span> <span class="token char">'plat'</span><span class="token punctuation">,</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">DISTINCT</span> <span class="token char">'uid'</span><span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span> <span class="token constant">GROUP</span> <span class="token constant">BY</span> <span class="token char">'uid'</span><span class="token punctuation">,</span> <span class="token char">'palt'</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>d. 不同站点下一周用户的登录情况，根据不同站点统计一周内用户的登录情况</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 用户 ID 去重且根据 bpid 字段分组，全平台统计</span>

<span class="token constant">SELECT</span> ‘bpid’<span class="token punctuation">,</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">DISTINCT</span> <span class="token char">'uid'</span><span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span> <span class="token constant">GROUP</span> <span class="token constant">BY</span> <span class="token char">'uid'</span><span class="token punctuation">,</span> <span class="token char">'plat'</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>e. 用户一周内 PC 端和移动端登录情况：根据 PC 字段和移动端字段值来统计一周内用户登录情况</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 使用CASE WHEN 条件语句统计多指标任务</span>

<span class="token class-name">SELECT</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">CASE</span> <span class="token constant">WHEN</span> ‘ispc’ <span class="token operator">=</span> <span class="token number">0</span> <span class="token constant">THEN</span> <span class="token number">1</span> <span class="token constant">END</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">CASE</span> <span class="token constant">WHEN</span> 'ismobile' <span class="token operator">=</span> <span class="token number">1</span> <span class="token constant">THEN</span> <span class="token number">1</span> <span class="token constant">END</span><span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>f.  用户一周内每天的登录总数：按照天分组来统计每天用户登录总数</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">// 按照分区时间分组，用户 ID 去重进行全平台、全站点统计</span>

<span class="token class-name">SELECT</span> tm<span class="token punctuation">,</span> <span class="token function">COUNT</span><span class="token punctuation">(</span><span class="token constant">DISTINCT</span> <span class="token char">'uid'</span><span class="token punctuation">)</span> <span class="token constant">FROM</span> ip_login <span class="token constant">WHERE</span> tm <span class="token constant">BETWEEN</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">23</span> <span class="token constant">AND</span> <span class="token number">2019</span><span class="token operator">-</span><span class="token number">12</span><span class="token operator">-</span><span class="token number">29</span> <span class="token constant">GROUP</span> <span class="token char">'uid'</span><span class="token punctuation">,</span> tm<span class="token punctuation">;</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注意：在编写Hive SQL进行指标统计进行去重</p>
<p>小数量使用 COUNT DISTINCT</p>
<p>数据量大推荐使用 GROUP BY 去重，避免数据倾斜（？） 数据倾斜无非就是大量的相同key被partition分配到一个分区里,造成了'一个人累死,其他人闲死'的情况：<a href="https://blog.csdn.net/weixin_35353187/article/details/84303518" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/weixin_35353187/article/details/84303518<ExternalLinkIcon/></a></p>
<p>此篇文章为《Hadoop大数据挖掘入门到放弃》笔记！</p>
</div></template>


