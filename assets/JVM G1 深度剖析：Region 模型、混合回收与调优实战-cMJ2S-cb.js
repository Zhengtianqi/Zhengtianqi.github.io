import{n as e,o as t,r as n}from"./app-CS-P9NMX.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/java/jvm/JVM%20G1%20%E6%B7%B1%E5%BA%A6%E5%89%96%E6%9E%90%EF%BC%9ARegion%20%E6%A8%A1%E5%9E%8B%E3%80%81%E6%B7%B7%E5%90%88%E5%9B%9E%E6%94%B6%E4%B8%8E%E8%B0%83%E4%BC%98%E5%AE%9E%E6%88%98.html","title":"JVM G1 深度剖析：Region 模型、混合回收与调优实战","lang":"zh-CN","frontmatter":{"title":"JVM G1 深度剖析：Region 模型、混合回收与调优实战","tag":["JVM","G1","GC","Region","混合回收","调优"],"category":"基础知识","date":"2026-07-02T00:00:00.000Z","description":"JVM G1 深度剖析：Region 模型、混合回收与调优实战 G1 是 Java 9+ 默认 GC，但大多数人只会用默认参数。G1 的 Region 模型怎么工作？Mixed GC 什么时候触发？RSet 有什么用？深入 G1 底层，才能真正做到调优。 一、G1 Region 模型 1.1 Region 划分 1.2 Humongous 对象 二、G...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"JVM G1 深度剖析：Region 模型、混合回收与调优实战\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-02T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-02T14:31:39.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/java/jvm/JVM%20G1%20%E6%B7%B1%E5%BA%A6%E5%89%96%E6%9E%90%EF%BC%9ARegion%20%E6%A8%A1%E5%9E%8B%E3%80%81%E6%B7%B7%E5%90%88%E5%9B%9E%E6%94%B6%E4%B8%8E%E8%B0%83%E4%BC%98%E5%AE%9E%E6%88%98.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"JVM G1 深度剖析：Region 模型、混合回收与调优实战"}],["meta",{"property":"og:description","content":"JVM G1 深度剖析：Region 模型、混合回收与调优实战 G1 是 Java 9+ 默认 GC，但大多数人只会用默认参数。G1 的 Region 模型怎么工作？Mixed GC 什么时候触发？RSet 有什么用？深入 G1 底层，才能真正做到调优。 一、G1 Region 模型 1.1 Region 划分 1.2 Humongous 对象 二、G..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-02T14:31:39.000Z"}],["meta",{"property":"article:tag","content":"调优"}],["meta",{"property":"article:tag","content":"混合回收"}],["meta",{"property":"article:tag","content":"Region"}],["meta",{"property":"article:tag","content":"GC"}],["meta",{"property":"article:tag","content":"G1"}],["meta",{"property":"article:tag","content":"JVM"}],["meta",{"property":"article:published_time","content":"2026-07-02T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-02T14:31:39.000Z"}]]},"git":{"createdTime":1783002699000,"updatedTime":1783002699000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":8.95,"words":2684},"filePathRelative":"posts/基础知识/java/jvm/JVM G1 深度剖析：Region 模型、混合回收与调优实战.md","excerpt":"\\n<p>G1 是 Java 9+ 默认 GC，但大多数人只会用默认参数。G1 的 Region 模型怎么工作？Mixed GC 什么时候触发？RSet 有什么用？深入 G1 底层，才能真正做到调优。</p>\\n<hr>\\n<h2>一、G1 Region 模型</h2>\\n<h3>1.1 Region 划分</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>G1 将堆划分为 2048 个大小相等的 Region（默认）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>堆大小 4GB：Region = 4GB / 2048 = 2MB</span></span>\\n<span class=\\"line\\"><span>堆大小 8GB：Region = 8GB / 2048 = 4MB</span></span>\\n<span class=\\"line\\"><span>堆大小 16GB：Region = 16GB / 2048 = 8MB</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>Region 大小自动计算，也可手动指定：</span></span>\\n<span class=\\"line\\"><span>-XX:G1HeapRegionSize=8m  （必须是 2 的幂，1-32MB）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐</span></span>\\n<span class=\\"line\\"><span>│ E  │ E  │ S  │ O  │ O  │ H  │ H  │- H-│ O  │ E  │</span></span>\\n<span class=\\"line\\"><span>├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤</span></span>\\n<span class=\\"line\\"><span>│ O  │ E  │ E  │ O  │ S  │ O  │ H  │ O  │ E  │ O  │</span></span>\\n<span class=\\"line\\"><span>├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤</span></span>\\n<span class=\\"line\\"><span>│ E  │ O  │ O  │ E  │ O  │ O  │ E  │ O  │ S  │ O  │</span></span>\\n<span class=\\"line\\"><span>└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>E = Eden Region（新生代 Eden）</span></span>\\n<span class=\\"line\\"><span>S = Survivor Region（新生代幸存者）</span></span>\\n<span class=\\"line\\"><span>O = Old Region（老年代）</span></span>\\n<span class=\\"line\\"><span>H = Humongous Region（大对象）</span></span>\\n<span class=\\"line\\"><span>Free = 未分配 Region</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>Region 角色不是固定的：</span></span>\\n<span class=\\"line\\"><span>  一个 Region 这一轮是 Eden，GC 后可能变成 Old</span></span>\\n<span class=\\"line\\"><span>  G1 通过标记位跟踪每个 Region 的角色</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`JVM G1 深度剖析：Region 模型、混合回收与调优实战.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="jvm-g1-深度剖析-region-模型、混合回收与调优实战" tabindex="-1"><a class="header-anchor" href="#jvm-g1-深度剖析-region-模型、混合回收与调优实战"><span>JVM G1 深度剖析：Region 模型、混合回收与调优实战</span></a></h1><p>G1 是 Java 9+ 默认 GC，但大多数人只会用默认参数。G1 的 Region 模型怎么工作？Mixed GC 什么时候触发？RSet 有什么用？深入 G1 底层，才能真正做到调优。</p><hr><h2 id="一、g1-region-模型" tabindex="-1"><a class="header-anchor" href="#一、g1-region-模型"><span>一、G1 Region 模型</span></a></h2><h3 id="_1-1-region-划分" tabindex="-1"><a class="header-anchor" href="#_1-1-region-划分"><span>1.1 Region 划分</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>G1 将堆划分为 2048 个大小相等的 Region（默认）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>堆大小 4GB：Region = 4GB / 2048 = 2MB</span></span>
<span class="line"><span>堆大小 8GB：Region = 8GB / 2048 = 4MB</span></span>
<span class="line"><span>堆大小 16GB：Region = 16GB / 2048 = 8MB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Region 大小自动计算，也可手动指定：</span></span>
<span class="line"><span>-XX:G1HeapRegionSize=8m  （必须是 2 的幂，1-32MB）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐</span></span>
<span class="line"><span>│ E  │ E  │ S  │ O  │ O  │ H  │ H  │- H-│ O  │ E  │</span></span>
<span class="line"><span>├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤</span></span>
<span class="line"><span>│ O  │ E  │ E  │ O  │ S  │ O  │ H  │ O  │ E  │ O  │</span></span>
<span class="line"><span>├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤</span></span>
<span class="line"><span>│ E  │ O  │ O  │ E  │ O  │ O  │ E  │ O  │ S  │ O  │</span></span>
<span class="line"><span>└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>E = Eden Region（新生代 Eden）</span></span>
<span class="line"><span>S = Survivor Region（新生代幸存者）</span></span>
<span class="line"><span>O = Old Region（老年代）</span></span>
<span class="line"><span>H = Humongous Region（大对象）</span></span>
<span class="line"><span>Free = 未分配 Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Region 角色不是固定的：</span></span>
<span class="line"><span>  一个 Region 这一轮是 Eden，GC 后可能变成 Old</span></span>
<span class="line"><span>  G1 通过标记位跟踪每个 Region 的角色</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-humongous-对象" tabindex="-1"><a class="header-anchor" href="#_1-2-humongous-对象"><span>1.2 Humongous 对象</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>大对象（Humongous）：</span></span>
<span class="line"><span>  对象大小 &gt; Region 大小的 50% → 直接分配在连续的 Humongous Region</span></span>
<span class="line"><span>  对象大小 &gt; Region 大小 → 跨多个连续 Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>例：Region = 4MB</span></span>
<span class="line"><span>  对象 2.1MB → Humongous（&gt; 4MB × 50% = 2MB）</span></span>
<span class="line"><span>  对象 10MB → 3 个连续 Humongous Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>大对象的问题：</span></span>
<span class="line"><span>  1. 直接进老年代，不经过 Young GC 回收</span></span>
<span class="line"><span>  2. 占用连续 Region，可能导致空间碎片</span></span>
<span class="line"><span>  3. 回收效率低（需要 Full GC 或并发标记阶段回收）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>优化：</span></span>
<span class="line"><span>  - 增大 Region 大小：-XX:G1HeapRegionSize=16m</span></span>
<span class="line"><span>  - 减少大对象创建：分块处理、流式处理</span></span>
<span class="line"><span>  - 用 -XX:G1HeapWastePercent 控制浪费比例</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、g1-gc-类型" tabindex="-1"><a class="header-anchor" href="#二、g1-gc-类型"><span>二、G1 GC 类型</span></a></h2><h3 id="_2-1-三种-gc" tabindex="-1"><a class="header-anchor" href="#_2-1-三种-gc"><span>2.1 三种 GC</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>1. Young GC（Minor GC）</span></span>
<span class="line"><span>   触发：Eden 区满</span></span>
<span class="line"><span>   回收：所有 Eden + Survivor Region</span></span>
<span class="line"><span>   STW：复制存活对象到新 Survivor / Old Region</span></span>
<span class="line"><span>   停顿时间：通常 10-50ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. Mixed GC（混合回收）</span></span>
<span class="line"><span>   触发：IHOP（InitiatingHeapOccupancyPercent）阈值</span></span>
<span class="line"><span>   回收：所有年轻代 + 部分老年代 Region（垃圾最多的）</span></span>
<span class="line"><span>   STW：分多次完成（G1MixedGCCountTarget 控制）</span></span>
<span class="line"><span>   停顿时间：每次 50-200ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. Full GC（退化）</span></span>
<span class="line"><span>   触发：Mixed GC 跟不上 / 疏散失败 / Metaspace 不足</span></span>
<span class="line"><span>   回收：整个堆</span></span>
<span class="line"><span>   STW：单线程（Java 10 前）/ 多线程（Java 10+）</span></span>
<span class="line"><span>   停顿时间：秒级，应尽量避免</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-gc-触发条件" tabindex="-1"><a class="header-anchor" href="#_2-2-gc-触发条件"><span>2.2 GC 触发条件</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Young GC 触发：</span></span>
<span class="line"><span>  Eden Region 数量达到当前新生代上限</span></span>
<span class="line"><span>  G1MaxNewSizePercent（默认 60%）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Mixed GC 触发链路：</span></span>
<span class="line"><span>  1. 老年代占用 &gt; IHOP（默认 45%）</span></span>
<span class="line"><span>  2. 触发并发标记周期（Concurrent Marking Cycle）</span></span>
<span class="line"><span>  3. 并发标记完成后，G1 知道每个 Region 的垃圾比例</span></span>
<span class="line"><span>  4. 触发 Mixed GC：选择垃圾比例高的 Old Region + 全部 Young Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Full GC 触发：</span></span>
<span class="line"><span>  1. Mixed GC 速度 &lt; 内存分配速度（老年代持续增长）</span></span>
<span class="line"><span>  2. 疏散失败（Evacuation Failure）：To 区放不下存活对象</span></span>
<span class="line"><span>  3. Metaspace 不足</span></span>
<span class="line"><span>  4. System.gc()（如未禁用）</span></span>
<span class="line"><span>  5. 并发标记未完成时老年代已满</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、g1-并发标记周期" tabindex="-1"><a class="header-anchor" href="#三、g1-并发标记周期"><span>三、G1 并发标记周期</span></a></h2><h3 id="_3-1-五个阶段" tabindex="-1"><a class="header-anchor" href="#_3-1-五个阶段"><span>3.1 五个阶段</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>阶段 1：Initial Mark（初始标记）</span></span>
<span class="line"><span>  STW，搭便车在一次 Young GC 上</span></span>
<span class="line"><span>  标记 GC Roots 直接引用的对象</span></span>
<span class="line"><span>  耗时：极短（复用 Young GC 的 STW）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 2：Root Region Scan（根区域扫描）</span></span>
<span class="line"><span>  并发，不 STW</span></span>
<span class="line"><span>  扫描 Survivor Region 引用的老年代对象</span></span>
<span class="line"><span>  必须在下一次 Young GC 前完成</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 3：Concurrent Mark（并发标记）</span></span>
<span class="line"><span>  并发，不 STW</span></span>
<span class="line"><span>  从 GC Roots 遍历整个堆的对象图</span></span>
<span class="line"><span>  使用 SATB（Snapshot-At-The-Beginning）算法</span></span>
<span class="line"><span>  期间产生的变更写入 SATB 缓冲区</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 4：Remark（重新标记）</span></span>
<span class="line"><span>  STW</span></span>
<span class="line"><span>  处理 SATB 缓冲区（并发标记期间的引用变更）</span></span>
<span class="line"><span>  回收空的 Region</span></span>
<span class="line"><span>  耗时：短（只处理增量变更）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 5：Cleanup（清理）</span></span>
<span class="line"><span>  部分 STW</span></span>
<span class="line"><span>  统计每个 Region 的存活对象数和垃圾比例</span></span>
<span class="line"><span>  排序 Region，为 Mixed GC 选区</span></span>
<span class="line"><span>  回收完全没有存活对象的 Region</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-satb-算法" tabindex="-1"><a class="header-anchor" href="#_3-2-satb-算法"><span>3.2 SATB 算法</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>SATB（Snapshot-At-The-Beginning）：</span></span>
<span class="line"><span>  并发标记开始时，逻辑上拍一张&quot;存活快照&quot;</span></span>
<span class="line"><span>  并发标记期间，如果有引用变更（对象被修改）：</span></span>
<span class="line"><span>    旧引用写入 SATB 缓冲区（write barrier）</span></span>
<span class="line"><span>    → 确保旧引用不会被遗漏</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Write Barrier 伪代码：</span></span>
<span class="line"><span>  void oop_field_store(oop* field, oop new_value) {</span></span>
<span class="line"><span>      oop old_value = *field;</span></span>
<span class="line"><span>      if (old_value != null &amp;&amp; concurrent_marking) {</span></span>
<span class="line"><span>          satb_buffer.add(old_value);  // 旧值加入 SATB</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>      *field = new_value;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>SATB 的代价：</span></span>
<span class="line"><span>  - 写屏障开销（每次引用写入都检查）</span></span>
<span class="line"><span>  - 可能多标记一些实际已死亡的对象（浮动垃圾）</span></span>
<span class="line"><span>  - 下一个周期才能回收浮动垃圾</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、rset-记忆集" tabindex="-1"><a class="header-anchor" href="#四、rset-记忆集"><span>四、RSet（记忆集）</span></a></h2><h3 id="_4-1-rset-的作用" tabindex="-1"><a class="header-anchor" href="#_4-1-rset-的作用"><span>4.1 RSet 的作用</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>问题：G1 回收单个 Region 时，需要知道谁引用了它（跨 Region 引用）</span></span>
<span class="line"><span>      如果遍历整个堆 → 太慢</span></span>
<span class="line"><span>解决：RSet（Remembered Set）记录&quot;谁引用了我&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>RSet 是一个哈希表：</span></span>
<span class="line"><span>  Key = 引用者的 Region 索引</span></span>
<span class="line"><span>  Value = 引用者 Region 中的卡页（Card）索引</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Region A 的 RSet：</span></span>
<span class="line"><span>    Region B: [Card 3, Card 7, Card 15]    ← B 的这些卡页引用了 A</span></span>
<span class="line"><span>    Region C: [Card 1, Card 9]              ← C 的这些卡页引用了 A</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  GC 回收 Region A 时，只需扫描 B 和 C 的特定卡页</span></span>
<span class="line"><span>  不用扫描整个堆 → 大幅减少扫描时间</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-rset-维护" tabindex="-1"><a class="header-anchor" href="#_4-2-rset-维护"><span>4.2 RSet 维护</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>RSet 通过 Write Barrier 维护：</span></span>
<span class="line"><span>  每次引用写入时，检查是否跨 Region：</span></span>
<span class="line"><span>    if (引用者和被引用者不在同一 Region) {</span></span>
<span class="line"><span>        被引用者的 RSet.add(引用者的 Card)</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Write Barrier 代价：</span></span>
<span class="line"><span>  - 每次引用写入都有额外开销</span></span>
<span class="line"><span>  - G1 的 Write Barrier 比 CMS 重（CMS 只需要标记，G1 需要更新 RSet）</span></span>
<span class="line"><span>  - 这是 G1 吞吐量比 Parallel GC 低的原因之一</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-3-rset-精度" tabindex="-1"><a class="header-anchor" href="#_4-3-rset-精度"><span>4.3 RSet 精度</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>G1 RSet 有三种精度级别：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. Sparse（稀疏）：只记录 Region 索引 + 少量 Card</span></span>
<span class="line"><span>   → 内存省，但扫描多</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. Fine（精细）：Region 索引 + Card 位数组</span></span>
<span class="line"><span>   → 平衡，默认级别</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. Coarse（粗略）：只记录 Region 索引</span></span>
<span class="line"><span>   → 内存省，但需要扫描整个 Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>G1 会根据 RSet 大小自动在三种精度间切换</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、mixed-gc-调优" tabindex="-1"><a class="header-anchor" href="#五、mixed-gc-调优"><span>五、Mixed GC 调优</span></a></h2><h3 id="_5-1-mixed-gc-关键参数" tabindex="-1"><a class="header-anchor" href="#_5-1-mixed-gc-关键参数"><span>5.1 Mixed GC 关键参数</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 触发时机</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:InitiatingHeapOccupancyPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=35</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 老年代占用 35% 时触发并发标记（默认 45%）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调低 → 提前回收，减少 Full GC 风险</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调高 → 减少并发标记开销，但 Full GC 风险增大</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 回收次数</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1MixedGCCountTarget</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=8</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Mixed GC 分 8 次完成（默认 8）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调大 → 每次回收更少 Region，停顿更短</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调小 → 每次回收更多 Region，可能停顿更长</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 每次回收的老年代上限</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1OldCSetRegionThresholdPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=10</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 每次最多回收 10% 的老年代 Region（默认 10%）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 混合回收的新生代下限</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1MixedGCLiveThresholdPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=85</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Region 中存活对象超过 85% 时不参与混合回收（回收价值低）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调高 → 更多 Region 参与回收，但复制成本增加</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 预留空间</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1ReservePercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=15</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 预留 15% 的堆空间作为 To 区（默认 10%）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 调大 → 减少疏散失败，但可用空间减少</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-调优案例" tabindex="-1"><a class="header-anchor" href="#_5-2-调优案例"><span>5.2 调优案例</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>场景：8GB 堆，G1，频繁 Full GC，停顿 2-5 秒</span></span>
<span class="line"><span></span></span>
<span class="line"><span>诊断：</span></span>
<span class="line"><span>  jstat -gc &lt;pid&gt; 1000</span></span>
<span class="line"><span>  → FGC 每分钟 2-3 次</span></span>
<span class="line"><span>  → OGCT（Old GC Time）累计很高</span></span>
<span class="line"><span>  → Mixed GC 后 Old Used 下降不多</span></span>
<span class="line"><span></span></span>
<span class="line"><span>分析：</span></span>
<span class="line"><span>  1. IHOP = 45%（默认），老年代占 45% 才开始并发标记</span></span>
<span class="line"><span>  2. 并发标记需要时间，标记完成前老年代继续增长</span></span>
<span class="line"><span>  3. Mixed GC 来不及回收，触发 Full GC</span></span>
<span class="line"><span></span></span>
<span class="line"><span>调优：</span></span>
<span class="line"><span>  -XX:InitiatingHeapOccupancyPercent=35   # 提前触发</span></span>
<span class="line"><span>  -XX:G1MixedGCCountTarget=16             # 分更多次回收</span></span>
<span class="line"><span>  -XX:G1ReservePercent=15                 # 增大预留</span></span>
<span class="line"><span>  -XX:MaxGCPauseMillis=100                # 降低目标停顿</span></span>
<span class="line"><span></span></span>
<span class="line"><span>效果：</span></span>
<span class="line"><span>  Full GC 从每分钟 2-3 次降到 0</span></span>
<span class="line"><span>  Mixed GC 停顿 50-80ms</span></span>
<span class="line"><span>  吞吐量提升 12%</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、g1-疏散失败" tabindex="-1"><a class="header-anchor" href="#六、g1-疏散失败"><span>六、G1 疏散失败</span></a></h2><h3 id="_6-1-什么是疏散失败" tabindex="-1"><a class="header-anchor" href="#_6-1-什么是疏散失败"><span>6.1 什么是疏散失败</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>G1 回收时需要复制存活对象到新 Region（疏散）</span></span>
<span class="line"><span>如果目标 Region 空间不足 → 疏散失败（Evacuation Failure）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>疏散失败的后果：</span></span>
<span class="line"><span>  1. 存活对象无法复制，留在原 Region</span></span>
<span class="line"><span>  2. 原 Region 标记为 Old（不回收）</span></span>
<span class="line"><span>  3. 触发 Full GC（退化）</span></span>
<span class="line"><span>  4. STW 时间暴增</span></span>
<span class="line"><span></span></span>
<span class="line"><span>原因：</span></span>
<span class="line"><span>  1. 预留空间不足（To 区不够）</span></span>
<span class="line"><span>  2. 内存碎片（虽然有 Free Region，但不连续）</span></span>
<span class="line"><span>  3. 突发大对象分配</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-2-预防疏散失败" tabindex="-1"><a class="header-anchor" href="#_6-2-预防疏散失败"><span>6.2 预防疏散失败</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 1. 增大预留空间</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1ReservePercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=15</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 默认 10%，调到 15%</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 2. 增大堆</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xms12g</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -Xmx12g</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 从 8g 增到 12g</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 3. 降低 IHOP（提前回收）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:InitiatingHeapOccupancyPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=30</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 4. 减少 Mixed GC 每次回收量</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1OldCSetRegionThresholdPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=5</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 从 10 降到 5</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 5. 增大 Region（减少大对象 Humongous 分配）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1HeapRegionSize</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=8m</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 或 16m</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="七、g1-vs-zgc-性能对比" tabindex="-1"><a class="header-anchor" href="#七、g1-vs-zgc-性能对比"><span>七、G1 vs ZGC 性能对比</span></a></h2><h3 id="_7-1-基准测试" tabindex="-1"><a class="header-anchor" href="#_7-1-基准测试"><span>7.1 基准测试</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>测试条件：16GB 堆，16C CPU，SPECjbb2015</span></span>
<span class="line"><span></span></span>
<span class="line"><span>指标              G1          ZGC(不分代)   ZGC(分代, JDK21)</span></span>
<span class="line"><span>平均停顿          85ms        0.8ms         0.3ms</span></span>
<span class="line"><span>最大停顿          230ms       1.2ms         0.5ms</span></span>
<span class="line"><span>吞吐量            45234 ops/s 41234 ops/s   44567 ops/s</span></span>
<span class="line"><span>GC CPU 开销       8%          12%           9%</span></span>
<span class="line"><span></span></span>
<span class="line"><span>结论：</span></span>
<span class="line"><span>  停顿：ZGC 完胜（&lt; 1ms vs 85ms）</span></span>
<span class="line"><span>  吞吐量：G1 略优（45K vs 41K）</span></span>
<span class="line"><span>  分代 ZGC 吞吐量接近 G1，停顿远优于 G1</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-2-选型建议" tabindex="-1"><a class="header-anchor" href="#_7-2-选型建议"><span>7.2 选型建议</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Java 21+：优先考虑分代 ZGC</span></span>
<span class="line"><span>  -XX:+UseZGC -XX:+ZGenerational</span></span>
<span class="line"><span>  - 停顿 &lt; 1ms，吞吐量接近 G1</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Java 17-20：G1 为主，特殊场景用 ZGC</span></span>
<span class="line"><span>  - 堆 &lt; 16GB → G1</span></span>
<span class="line"><span>  - 堆 &gt; 16GB 或延迟 &lt; 10ms → ZGC</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Java 11-16：G1</span></span>
<span class="line"><span>  - 默认 G1，成熟稳定</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Java 8：G1 或 CMS</span></span>
<span class="line"><span>  - CMS 已废弃，建议迁移到 G1</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="八、g1-生产配置模板" tabindex="-1"><a class="header-anchor" href="#八、g1-生产配置模板"><span>八、G1 生产配置模板</span></a></h2><h3 id="_8-1-通用型-4-8gb-堆" tabindex="-1"><a class="header-anchor" href="#_8-1-通用型-4-8gb-堆"><span>8.1 通用型（4-8GB 堆）</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseG1GC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xms6g</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -Xmx6g</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:MaxGCPauseMillis</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=200</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1HeapRegionSize</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=4m</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:InitiatingHeapOccupancyPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=35</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1ReservePercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=15</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ParallelGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=6</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ConcGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=2</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+ParallelRefProcEnabled</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseStringDeduplication</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+DisableExplicitGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:MaxMetaspaceSize</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=512m</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1MixedGCCountTarget</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=8</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+HeapDumpOnOutOfMemoryError</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:HeapDumpPath</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/data/dumps/</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_8-2-低延迟型-8-16gb-堆" tabindex="-1"><a class="header-anchor" href="#_8-2-低延迟型-8-16gb-堆"><span>8.2 低延迟型（8-16GB 堆）</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseG1GC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xms12g</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -Xmx12g</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:MaxGCPauseMillis</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=100</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">              # 更低延迟目标</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1HeapRegionSize</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=8m</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:InitiatingHeapOccupancyPercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=30</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 更早触发</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1ReservePercent</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=20</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">                # 更大预留</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ParallelGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=10</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ConcGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=4</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:G1MixedGCCountTarget</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=16</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">            # 分更多次回收</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+ParallelRefProcEnabled</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseStringDeduplication</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+DisableExplicitGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+HeapDumpOnOutOfMemoryError</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:HeapDumpPath</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/data/dumps/</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="九、面试要点" tabindex="-1"><a class="header-anchor" href="#九、面试要点"><span>九、面试要点</span></a></h2><h3 id="q-g1-的-mixed-gc-是什么-什么时候触发" tabindex="-1"><a class="header-anchor" href="#q-g1-的-mixed-gc-是什么-什么时候触发"><span>Q：G1 的 Mixed GC 是什么？什么时候触发？</span></a></h3><p>Mixed GC 是 G1 特有的回收方式，同时回收年轻代和部分老年代 Region。触发链路：老年代占用超过 IHOP（默认 45%）→ 触发并发标记周期 → 标记完成后 G1 知道每个 Region 的垃圾比例 → 触发 Mixed GC，每次回收垃圾最多的 Old Region + 全部 Young Region。Mixed GC 分多次完成（G1MixedGCCountTarget 默认 8 次），避免单次停顿过长。</p><h3 id="q-g1-的-rset-有什么用-代价是什么" tabindex="-1"><a class="header-anchor" href="#q-g1-的-rset-有什么用-代价是什么"><span>Q：G1 的 RSet 有什么用？代价是什么？</span></a></h3><p>RSet（Remembered Set）记录&quot;谁引用了我&quot;，让 G1 回收单个 Region 时不需要扫描整个堆。代价是 Write Barrier 开销：每次引用写入都需检查是否跨 Region 并更新 RSet。这是 G1 吞吐量低于 Parallel GC 的主要原因。</p><h3 id="q-g1-发生疏散失败怎么办" tabindex="-1"><a class="header-anchor" href="#q-g1-发生疏散失败怎么办"><span>Q：G1 发生疏散失败怎么办？</span></a></h3><p>疏散失败（Evacuation Failure）指复制存活对象时目标空间不足，导致 Full GC 退化。预防方法：增大 G1ReservePercent（预留空间）、降低 IHOP（提前回收）、增大堆、减少 Mixed GC 每次回收量。</p><hr><h2 id="十、总结" tabindex="-1"><a class="header-anchor" href="#十、总结"><span>十、总结</span></a></h2><p>G1 调优核心参数：</p><table><thead><tr><th>参数</th><th>默认值</th><th>调优方向</th></tr></thead><tbody><tr><td>MaxGCPauseMillis</td><td>200ms</td><td>降 → 停顿短但吞吐降</td></tr><tr><td>IHOP</td><td>45%</td><td>降 → 提前回收防 Full GC</td></tr><tr><td>G1ReservePercent</td><td>10%</td><td>升 → 防疏散失败</td></tr><tr><td>G1HeapRegionSize</td><td>自动</td><td>升 → 减少大对象</td></tr><tr><td>G1MixedGCCountTarget</td><td>8</td><td>升 → 每次停顿更短</td></tr></tbody></table><p>记住：<strong>IHOP 35% 提前回收，预留 15% 防疏散失败，Region 8MB 减少大对象，分代 ZGC 是未来</strong>。</p>`,65)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};