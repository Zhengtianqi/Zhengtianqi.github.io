import{n as e,o as t,r as n}from"./app-CS-P9NMX.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/java/jvm/JVM%20ZGC%20%E4%B8%8E%20Shenandoah%20%E6%B7%B1%E5%BA%A6%E5%89%96%E6%9E%90%EF%BC%9A%E4%BA%9A%E6%AF%AB%E7%A7%92%E7%BA%A7%E5%81%9C%E9%A1%BF%E6%98%AF%E6%80%8E%E4%B9%88%E5%81%9A%E5%88%B0%E7%9A%84.html","title":"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的","lang":"zh-CN","frontmatter":{"title":"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的","tag":["JVM","ZGC","Shenandoah","GC","低延迟"],"category":"基础知识","date":"2026-07-02T00:00:00.000Z","description":"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的 G1 停顿 100ms 还不够？ZGC 停顿 &lt; 1ms？并发转移是什么黑科技？染色指针、读屏障、Brooks Pointer——低延迟 GC 的底层原理一篇讲透。 一、为什么需要低延迟 GC 1.1 G1 的瓶颈 1.2 低延迟 GC 的思路 二、ZGC 核心技术 2...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-02T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-02T14:31:39.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/java/jvm/JVM%20ZGC%20%E4%B8%8E%20Shenandoah%20%E6%B7%B1%E5%BA%A6%E5%89%96%E6%9E%90%EF%BC%9A%E4%BA%9A%E6%AF%AB%E7%A7%92%E7%BA%A7%E5%81%9C%E9%A1%BF%E6%98%AF%E6%80%8E%E4%B9%88%E5%81%9A%E5%88%B0%E7%9A%84.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的"}],["meta",{"property":"og:description","content":"JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的 G1 停顿 100ms 还不够？ZGC 停顿 &lt; 1ms？并发转移是什么黑科技？染色指针、读屏障、Brooks Pointer——低延迟 GC 的底层原理一篇讲透。 一、为什么需要低延迟 GC 1.1 G1 的瓶颈 1.2 低延迟 GC 的思路 二、ZGC 核心技术 2..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-02T14:31:39.000Z"}],["meta",{"property":"article:tag","content":"低延迟"}],["meta",{"property":"article:tag","content":"GC"}],["meta",{"property":"article:tag","content":"Shenandoah"}],["meta",{"property":"article:tag","content":"ZGC"}],["meta",{"property":"article:tag","content":"JVM"}],["meta",{"property":"article:published_time","content":"2026-07-02T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-02T14:31:39.000Z"}]]},"git":{"createdTime":1783002699000,"updatedTime":1783002699000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":8.51,"words":2554},"filePathRelative":"posts/基础知识/java/jvm/JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的.md","excerpt":"\\n<p>G1 停顿 100ms 还不够？ZGC 停顿 &lt; 1ms？并发转移是什么黑科技？染色指针、读屏障、Brooks Pointer——低延迟 GC 的底层原理一篇讲透。</p>\\n<hr>\\n<h2>一、为什么需要低延迟 GC</h2>\\n<h3>1.1 G1 的瓶颈</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>G1 的 STW 阶段：</span></span>\\n<span class=\\"line\\"><span>  1. 初始标记（STW）→ 复用 Young GC，可忽略</span></span>\\n<span class=\\"line\\"><span>  2. 重新标记（STW）→ 处理 SATB，10-50ms</span></span>\\n<span class=\\"line\\"><span>  3. 混合回收（STW）→ 复制存活对象，50-200ms</span></span>\\n<span class=\\"line\\"><span>  </span></span>\\n<span class=\\"line\\"><span>G1 的瓶颈：</span></span>\\n<span class=\\"line\\"><span>  对象复制（疏散）必须在 STW 中完成</span></span>\\n<span class=\\"line\\"><span>  → 存活对象越多，复制越久，STW 越长</span></span>\\n<span class=\\"line\\"><span>  → 堆越大，存活对象越多，STW 越长</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>核心问题：G1 的对象转移是 STW 的</span></span>\\n<span class=\\"line\\"><span>  即使并发标记做得再好，复制对象必须停顿</span></span>\\n<span class=\\"line\\"><span>  → 16GB 堆 STW 100ms，32GB 堆 STW 200ms，64GB 堆 STW 400ms</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="jvm-zgc-与-shenandoah-深度剖析-亚毫秒级停顿是怎么做到的" tabindex="-1"><a class="header-anchor" href="#jvm-zgc-与-shenandoah-深度剖析-亚毫秒级停顿是怎么做到的"><span>JVM ZGC 与 Shenandoah 深度剖析：亚毫秒级停顿是怎么做到的</span></a></h1><p>G1 停顿 100ms 还不够？ZGC 停顿 &lt; 1ms？并发转移是什么黑科技？染色指针、读屏障、Brooks Pointer——低延迟 GC 的底层原理一篇讲透。</p><hr><h2 id="一、为什么需要低延迟-gc" tabindex="-1"><a class="header-anchor" href="#一、为什么需要低延迟-gc"><span>一、为什么需要低延迟 GC</span></a></h2><h3 id="_1-1-g1-的瓶颈" tabindex="-1"><a class="header-anchor" href="#_1-1-g1-的瓶颈"><span>1.1 G1 的瓶颈</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>G1 的 STW 阶段：</span></span>
<span class="line"><span>  1. 初始标记（STW）→ 复用 Young GC，可忽略</span></span>
<span class="line"><span>  2. 重新标记（STW）→ 处理 SATB，10-50ms</span></span>
<span class="line"><span>  3. 混合回收（STW）→ 复制存活对象，50-200ms</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>G1 的瓶颈：</span></span>
<span class="line"><span>  对象复制（疏散）必须在 STW 中完成</span></span>
<span class="line"><span>  → 存活对象越多，复制越久，STW 越长</span></span>
<span class="line"><span>  → 堆越大，存活对象越多，STW 越长</span></span>
<span class="line"><span></span></span>
<span class="line"><span>核心问题：G1 的对象转移是 STW 的</span></span>
<span class="line"><span>  即使并发标记做得再好，复制对象必须停顿</span></span>
<span class="line"><span>  → 16GB 堆 STW 100ms，32GB 堆 STW 200ms，64GB 堆 STW 400ms</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-低延迟-gc-的思路" tabindex="-1"><a class="header-anchor" href="#_1-2-低延迟-gc-的思路"><span>1.2 低延迟 GC 的思路</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ZGC / Shenandoah 的核心突破：</span></span>
<span class="line"><span>  把&quot;对象转移&quot;也变成并发的！</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  G1：      标记并发 + 转移 STW</span></span>
<span class="line"><span>  ZGC：     标记并发 + 转移并发 → STW &lt; 1ms</span></span>
<span class="line"><span>  Shenandoah：标记并发 + 转移并发 → STW &lt; 10ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>挑战：</span></span>
<span class="line"><span>  转移对象时，其他线程还在读写这个对象</span></span>
<span class="line"><span>  → 需要读屏障 / 写屏障保证一致性</span></span>
<span class="line"><span>  → 这是 ZGC 和 Shenandoah 的核心技术</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、zgc-核心技术" tabindex="-1"><a class="header-anchor" href="#二、zgc-核心技术"><span>二、ZGC 核心技术</span></a></h2><h3 id="_2-1-染色指针-colored-pointers" tabindex="-1"><a class="header-anchor" href="#_2-1-染色指针-colored-pointers"><span>2.1 染色指针（Colored Pointers）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ZGC 利用 64 位指针中的高位存储 GC 状态：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>64 位指针布局（ZGC）：</span></span>
<span class="line"><span>  ┌──┬──┬──┬──────────────────────────────────────────┐</span></span>
<span class="line"><span>  │未│M0│M1│              42 位对象地址                  │</span></span>
<span class="line"><span>  │用│  │  │                                          │</span></span>
<span class="line"><span>  └──┴──┴──┴──────────────────────────────────────────┘</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  bit 63-42：未使用（0）</span></span>
<span class="line"><span>  bit 41-42：Mark 0 / Mark 1（标记位）</span></span>
<span class="line"><span>  bit 43-44：Remapped / Finalizable（重映射位）</span></span>
<span class="line"><span>  bit 45+：对象地址（42 位 = 4TB 寻址空间）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4 种指针状态：</span></span>
<span class="line"><span>  M0=1, Remapped=0 → Marked0（并发标记中，标记过的对象）</span></span>
<span class="line"><span>  M1=1, Remapped=0 → Marked1（并发标记中，标记过的对象，第二轮）</span></span>
<span class="line"><span>  Remapped=1       → Remapped（已转移到新地址）</span></span>
<span class="line"><span>  Finalizable=1    → Finalizable（通过 finalize 方法可达）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>染色指针的好处：</span></span>
<span class="line"><span>  1. GC 状态存在指针中，不需要额外内存</span></span>
<span class="line"><span>  2. 多线程可以并发查看/修改指针状态</span></span>
<span class="line"><span>  3. 虚拟内存映射：不同状态指向不同物理页</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-多重映射-multi-mapping" tabindex="-1"><a class="header-anchor" href="#_2-2-多重映射-multi-mapping"><span>2.2 多重映射（Multi-Mapping）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ZGC 将不同颜色的指针映射到不同的物理内存页：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  逻辑地址空间：</span></span>
<span class="line"><span>    Color A (Marked0)    → 映射到物理页 P1</span></span>
<span class="line"><span>    Color B (Marked1)    → 映射到物理页 P1</span></span>
<span class="line"><span>    Color C (Remapped)   → 映射到物理页 P1</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  三个不同颜色的指针 → 同一个物理对象</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  好处：</span></span>
<span class="line"><span>    GC 修改指针颜色不影响对象本身</span></span>
<span class="line"><span>    应用线程看到的指针颜色可能不同，但都指向同一对象</span></span>
<span class="line"><span>    转移对象时，先映射新地址，再更新颜色</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-读屏障-load-barrier" tabindex="-1"><a class="header-anchor" href="#_2-3-读屏障-load-barrier"><span>2.3 读屏障（Load Barrier）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ZGC 的读屏障：</span></span>
<span class="line"><span>  每次从堆中读取对象引用时，JVM 插入屏障代码</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  伪代码：</span></span>
<span class="line"><span>  Object oop_field_load(oop* field) {</span></span>
<span class="line"><span>      oop value = *field;</span></span>
<span class="line"><span>      if (is_colored(value)) {</span></span>
<span class="line"><span>          // 指针颜色不对 → 需要处理</span></span>
<span class="line"><span>          value = fix_pointer(value);</span></span>
<span class="line"><span>          *field = value;  // 修正引用</span></span>
<span class="line"><span>      }</span></span>
<span class="line"><span>      return value;</span></span>
<span class="line"><span>  }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>读屏障做什么：</span></span>
<span class="line"><span>  1. 如果对象已转移 → 更新引用到新地址（自愈）</span></span>
<span class="line"><span>  2. 如果对象需要标记 → 标记为存活</span></span>
<span class="line"><span>  3. 如果指针颜色不对 → 修正颜色</span></span>
<span class="line"><span></span></span>
<span class="line"><span>读屏障的代价：</span></span>
<span class="line"><span>  - 每次读引用都有额外检查</span></span>
<span class="line"><span>  - JIT 优化后约 4-5% 性能开销</span></span>
<span class="line"><span>  - 但避免了 STW，整体延迟更低</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-4-zgc-工作流程" tabindex="-1"><a class="header-anchor" href="#_2-4-zgc-工作流程"><span>2.4 ZGC 工作流程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ZGC 并发回收流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 1：并发标记（Concurrent Mark）</span></span>
<span class="line"><span>  从 GC Roots 并发遍历对象图</span></span>
<span class="line"><span>  通过染色指针标记存活对象</span></span>
<span class="line"><span>  不 STW</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 2：并发转移（Concurrent Relocate）</span></span>
<span class="line"><span>  将存活对象复制到新 Region</span></span>
<span class="line"><span>  通过读屏障自愈引用</span></span>
<span class="line"><span>  不 STW</span></span>
<span class="line"><span></span></span>
<span class="line"><span>STW 阶段（极短）：</span></span>
<span class="line"><span>  1. 初始标记（STW）→ 标 GC Roots 直接引用，&lt; 0.1ms</span></span>
<span class="line"><span>  2. 再标记（STW）→ 处理根集变更，&lt; 0.1ms</span></span>
<span class="line"><span>  3. 再分配转移集（STW）→ 选转移目标，&lt; 0.1ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  总 STW：&lt; 1ms（与堆大小无关！）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-分代-zgc-java-21" tabindex="-1"><a class="header-anchor" href="#_2-5-分代-zgc-java-21"><span>2.5 分代 ZGC（Java 21+）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>JDK 21 引入分代 ZGC（-XX:+ZGenerational）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>不分代 ZGC：</span></span>
<span class="line"><span>  每次扫描整个堆 → 对象多时开销大</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>分代 ZGC：</span></span>
<span class="line"><span>  新生代频繁回收（STW &lt; 0.5ms）</span></span>
<span class="line"><span>  老年代低频回收（STW &lt; 1ms）</span></span>
<span class="line"><span>  大幅减少标记工作量</span></span>
<span class="line"><span></span></span>
<span class="line"><span>分代 ZGC 改进：</span></span>
<span class="line"><span>  1. 新生代独立标记和转移</span></span>
<span class="line"><span>  2. 写屏障记录跨代引用（Remembered Set）</span></span>
<span class="line"><span>  3. 老年代并发标记频率降低</span></span>
<span class="line"><span>  4. 整体吞吐量提升 10-20%</span></span>
<span class="line"><span>  5. 分配速率承受能力提升 2-3 倍</span></span>
<span class="line"><span></span></span>
<span class="line"><span>配置：</span></span>
<span class="line"><span>  -XX:+UseZGC -XX:+ZGenerational -Xms16g -Xmx16g</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、shenandoah-gc" tabindex="-1"><a class="header-anchor" href="#三、shenandoah-gc"><span>三、Shenandoah GC</span></a></h2><h3 id="_3-1-brooks-pointer" tabindex="-1"><a class="header-anchor" href="#_3-1-brooks-pointer"><span>3.1 Brooks Pointer</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Shenandoah 的核心技术：Brooks Pointer（转发指针）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>每个对象前面有一个额外的指针，指向自己（未转移时）</span></span>
<span class="line"><span>或指向新副本（转移后）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────────┐</span></span>
<span class="line"><span>  │ Brooks Ptr   │ ──→ 自身（未转移）</span></span>
<span class="line"><span>  ├──────────────┤</span></span>
<span class="line"><span>  │ Object Header│</span></span>
<span class="line"><span>  ├──────────────┤</span></span>
<span class="line"><span>  │ Field 1      │</span></span>
<span class="line"><span>  ├──────────────┤</span></span>
<span class="line"><span>  │ Field 2      │</span></span>
<span class="line"><span>  └──────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>转移过程：</span></span>
<span class="line"><span>  1. 在新 Region 创建对象副本</span></span>
<span class="line"><span>  2. 旧对象的 Brooks Ptr 指向新副本</span></span>
<span class="line"><span>  3. 后续访问旧对象 → 通过 Brooks Ptr 找到新副本</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────────┐         ┌──────────────┐</span></span>
<span class="line"><span>  │ Brooks Ptr   │ ──────→ │ Brooks Ptr   │ ──→ 自身</span></span>
<span class="line"><span>  ├──────────────┤         ├──────────────┤</span></span>
<span class="line"><span>  │ Object Header│         │ Object Header│</span></span>
<span class="line"><span>  ├──────────────┤         ├──────────────┤</span></span>
<span class="line"><span>  │ Field 1      │         │ Field 1      │ ← 新副本</span></span>
<span class="line"><span>  └──────────────┘         └──────────────┘</span></span>
<span class="line"><span>    旧对象                     新对象</span></span>
<span class="line"><span></span></span>
<span class="line"><span>代价：</span></span>
<span class="line"><span>  - 每个对象多 8 字节（Brooks Pointer）</span></span>
<span class="line"><span>  - 每次访问对象多一次间接寻址</span></span>
<span class="line"><span>  - 内存开销约 5-10%</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-shenandoah-工作流程" tabindex="-1"><a class="header-anchor" href="#_3-2-shenandoah-工作流程"><span>3.2 Shenandoah 工作流程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>阶段 1：初始标记（STW）&lt; 1ms</span></span>
<span class="line"><span>  标记 GC Roots 直接引用</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 2：并发标记</span></span>
<span class="line"><span>  从 GC Roots 遍历对象图</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 3：最终标记（STW）&lt; 1ms</span></span>
<span class="line"><span>  处理剩余的 SATB 缓冲区</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 4：并发转移（Concurrent Evacuation）</span></span>
<span class="line"><span>  复制存活对象到新 Region</span></span>
<span class="line"><span>  设置 Brooks Pointer 转发</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 5：并发清理</span></span>
<span class="line"><span>  回收空 Region</span></span>
<span class="line"><span></span></span>
<span class="line"><span>STW 总计：&lt; 10ms（与堆大小无关）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-shenandoah-vs-zgc" tabindex="-1"><a class="header-anchor" href="#_3-3-shenandoah-vs-zgc"><span>3.3 Shenandoah vs ZGC</span></a></h3><table><thead><tr><th>维度</th><th>ZGC</th><th>Shenandoah</th></tr></thead><tbody><tr><td>技术方案</td><td>染色指针 + 读屏障</td><td>Brooks Pointer + 读写屏障</td></tr><tr><td>STW</td><td>&lt; 1ms</td><td>&lt; 10ms</td></tr><tr><td>内存开销</td><td>无额外（指针中存状态）</td><td>每对象 +8 字节</td></tr><tr><td>吞吐量</td><td>略高</td><td>略低（Brooks Pointer 开销）</td></tr><tr><td>分代支持</td><td>Java 21+</td><td>Java 20+</td></tr><tr><td>堆上限</td><td>16TB</td><td>4TB</td></tr><tr><td>可用版本</td><td>Java 15+ 生产</td><td>Java 15+ 生产</td></tr><tr><td>开发方</td><td>Oracle</td><td>Red Hat</td></tr></tbody></table><hr><h2 id="四、性能基准测试" tabindex="-1"><a class="header-anchor" href="#四、性能基准测试"><span>四、性能基准测试</span></a></h2><h3 id="_4-1-测试数据" tabindex="-1"><a class="header-anchor" href="#_4-1-测试数据"><span>4.1 测试数据</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>测试条件：32GB 堆，16C CPU，SPECjbb2015</span></span>
<span class="line"><span></span></span>
<span class="line"><span>指标               G1          ZGC(不分代)    ZGC(分代,JDK21)   Shenandoah</span></span>
<span class="line"><span>平均停顿            85ms        0.8ms          0.3ms             5.2ms</span></span>
<span class="line"><span>最大停顿            230ms       1.2ms          0.5ms             12.3ms</span></span>
<span class="line"><span>P99 停顿            180ms       1.0ms          0.4ms             8.5ms</span></span>
<span class="line"><span>吞吐量(ops/s)       45234       41234          44567             43123</span></span>
<span class="line"><span>GC CPU 开销         8%          12%            9%                11%</span></span>
<span class="line"><span>分配速率承受(GB/s)   2.5         3.2            5.8               3.5</span></span>
<span class="line"><span></span></span>
<span class="line"><span>关键发现：</span></span>
<span class="line"><span>  1. ZGC 分代版吞吐量接近 G1，停顿远优于 G1</span></span>
<span class="line"><span>  2. ZGC 分代版分配速率承受能力是 G1 的 2.3 倍</span></span>
<span class="line"><span>  3. Shenandoah 停顿比 G1 好很多，但不如 ZGC</span></span>
<span class="line"><span>  4. ZGC 不分代版吞吐量最低（扫描全堆开销大）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-不同堆大小下的表现" tabindex="-1"><a class="header-anchor" href="#_4-2-不同堆大小下的表现"><span>4.2 不同堆大小下的表现</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>堆大小    G1 Max STW    ZGC Max STW    Shenandoah Max STW</span></span>
<span class="line"><span>4GB       120ms         0.8ms          8ms</span></span>
<span class="line"><span>8GB       180ms         1.0ms          10ms</span></span>
<span class="line"><span>16GB      250ms         1.2ms          12ms</span></span>
<span class="line"><span>32GB      400ms         1.5ms          15ms</span></span>
<span class="line"><span>64GB      800ms         2.0ms          18ms</span></span>
<span class="line"><span>128GB     &gt;2000ms       3.0ms          25ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>关键特征：</span></span>
<span class="line"><span>  G1：停顿随堆大小线性增长</span></span>
<span class="line"><span>  ZGC：停顿几乎不随堆大小变化（亚毫秒级）</span></span>
<span class="line"><span>  Shenandoah：停顿轻微增长（&lt; 30ms）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、生产配置" tabindex="-1"><a class="header-anchor" href="#五、生产配置"><span>五、生产配置</span></a></h2><h3 id="_5-1-zgc-配置-推荐-java-21" tabindex="-1"><a class="header-anchor" href="#_5-1-zgc-配置-推荐-java-21"><span>5.1 ZGC 配置（推荐 Java 21+）</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Java 21+ 分代 ZGC（推荐）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseZGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+ZGenerational</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xms16g</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -Xmx16g</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:SoftMaxHeapSize</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=12g</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">               # 软上限</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ConcGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=4</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">                   # 并发线程数</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ParallelGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=12</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">              # STW 阶段线程数</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ZCollectionInterval</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=0</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">             # GC 间隔（0=按需）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ZAllocationSpikeTolerance</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=2.0</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">     # 分配突发容忍度</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseStringDeduplication</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">           # 字符串去重</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+DisableExplicitGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+HeapDumpOnOutOfMemoryError</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:HeapDumpPath</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/data/dumps/</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xlog:gc*:file</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/var/log/gc.log:time,level,tags:filecount=5,filesize=20m</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-shenandoah-配置" tabindex="-1"><a class="header-anchor" href="#_5-2-shenandoah-配置"><span>5.2 Shenandoah 配置</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseShenandoahGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xms16g</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> -Xmx16g</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ShenandoahGCHeuristics</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=adaptive</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">   # 自适应模式</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ConcGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=4</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:ParallelGCThreads</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=12</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+UseStringDeduplication</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+DisableExplicitGC</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:+HeapDumpOnOutOfMemoryError</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-XX:HeapDumpPath</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/data/dumps/</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xlog:gc*:file</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/var/log/gc.log:time,level,tags:filecount=5,filesize=20m</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Shenandoah 模式：</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># adaptive  → 自适应（默认，推荐）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># aggressive → 更激进回收（低延迟场景）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># compact   → 紧凑模式（减少碎片）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># passive   → 只分析不回收（调试用）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-3-何时选择-zgc" tabindex="-1"><a class="header-anchor" href="#_5-3-何时选择-zgc"><span>5.3 何时选择 ZGC</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>推荐 ZGC 的场景：</span></span>
<span class="line"><span>  1. 堆 &gt; 16GB → ZGC 优势明显</span></span>
<span class="line"><span>  2. 延迟要求 &lt; 10ms → G1 做不到</span></span>
<span class="line"><span>  3. Java 21+ → 分代 ZGC 性能接近 G1</span></span>
<span class="line"><span>  4. 大规模微服务 → 减少尾延迟</span></span>
<span class="line"><span>  5. 实时系统 → 低延迟是硬需求</span></span>
<span class="line"><span></span></span>
<span class="line"><span>不推荐 ZGC 的场景：</span></span>
<span class="line"><span>  1. Java &lt; 15 → ZGC 不够成熟</span></span>
<span class="line"><span>  2. 吞吐量是唯一目标 → 用 Parallel GC</span></span>
<span class="line"><span>  3. 堆 &lt; 4GB → G1 足够</span></span>
<span class="line"><span>  4. CPU 资源紧张 → ZGC 并发回收消耗 CPU</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、zgc-监控" tabindex="-1"><a class="header-anchor" href="#六、zgc-监控"><span>六、ZGC 监控</span></a></h2><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 1. GC 日志</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">-Xlog:gc*:file</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=/var/log/gc.log:time,level,tags</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># ZGC 日志示例：</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.000s][info][gc,start] GC(1) Garbage Collection (Warmup)</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.000s][info][gc,task] GC(1) Using 4 Workers</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.001s][info][gc,phases] GC(1) Pause Mark Start 0.012ms      ← STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.001s][info][gc,phases] GC(1) Concurrent Mark 120.000ms</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.121s][info][gc,phases] GC(1) Pause Mark End 0.015ms        ← STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.121s][info][gc,phases] GC(1) Concurrent Process Non-Strong Roots 5.000ms</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.126s][info][gc,phases] GC(1) Concurrent Relocate 80.000ms</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.206s][info][gc,heap] GC(1) Old: 2048M-&gt;1024M(4096M)</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># [10.206s][info][gc] GC(1) Garbage Collection (Warmup) 2048M(50%)-&gt;1024M(25%)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 关键指标：</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Pause Mark Start: 0.012ms  → STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Pause Mark End:   0.015ms  → STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Concurrent Mark:  120ms    → 不 STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Concurrent Relocate: 80ms  → 不 STW</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 总 STW = 0.012 + 0.015 = 0.027ms</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 2. jcmd 查看 ZGC 状态</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">jcmd</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &lt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">pi</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">d&gt; </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">GC.heap_info</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 3. JFR 录制 ZGC 事件</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">jcmd</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &lt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">pi</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">d&gt; </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">JFR.start</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> name=zgc</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> duration=60s</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> filename=/tmp/zgc.jfr</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> settings=profile</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="七、面试要点" tabindex="-1"><a class="header-anchor" href="#七、面试要点"><span>七、面试要点</span></a></h2><h3 id="q-zgc-怎么做到亚毫秒级停顿" tabindex="-1"><a class="header-anchor" href="#q-zgc-怎么做到亚毫秒级停顿"><span>Q：ZGC 怎么做到亚毫秒级停顿？</span></a></h3><p>核心是将标记和转移都做成并发：</p><ol><li>染色指针：在 64 位指针高位存储 GC 状态，不需要额外内存</li><li>读屏障：每次读引用时检查指针颜色，自动修正和自愈引用</li><li>多重映射：不同颜色指针映射到同一物理内存，修改颜色不影响对象访问</li><li>并发转移：对象复制在应用线程运行时并发进行，只有根集处理需要极短 STW</li></ol><h3 id="q-zgc-和-g1-的核心区别" tabindex="-1"><a class="header-anchor" href="#q-zgc-和-g1-的核心区别"><span>Q：ZGC 和 G1 的核心区别？</span></a></h3><p>G1：标记并发 + 转移 STW → 堆越大 STW 越长<br> ZGC：标记并发 + 转移并发 → STW &lt; 1ms，与堆大小无关</p><p>G1 用 RSet 减少扫描范围，但转移必须 STW<br> ZGC 用染色指针 + 读屏障实现并发转移，代价是读屏障开销（约 5% 吞吐量）</p><h3 id="q-zgc-和-shenandoah-有什么区别" tabindex="-1"><a class="header-anchor" href="#q-zgc-和-shenandoah-有什么区别"><span>Q：ZGC 和 Shenandoah 有什么区别？</span></a></h3><p>ZGC：染色指针 + 读屏障，无额外内存开销，STW &lt; 1ms<br> Shenandoah：Brooks Pointer + 读写屏障，每对象 +8 字节，STW &lt; 10ms</p><p>ZGC 停顿更低（&lt; 1ms vs &lt; 10ms），吞吐量略高<br> Shenandoah 技术更简单（转发指针），但内存开销更大</p><hr><h2 id="八、总结" tabindex="-1"><a class="header-anchor" href="#八、总结"><span>八、总结</span></a></h2><p>低延迟 GC 核心技术对比：</p><table><thead><tr><th>技术</th><th>G1</th><th>ZGC</th><th>Shenandoah</th></tr></thead><tbody><tr><td>标记</td><td>并发</td><td>并发</td><td>并发</td></tr><tr><td>转移</td><td>STW</td><td>并发</td><td>并发</td></tr><tr><td>一致性保证</td><td>SATB + RSet</td><td>染色指针 + 读屏障</td><td>Brooks Pointer + 读写屏障</td></tr><tr><td>STW</td><td>50-200ms</td><td>&lt; 1ms</td><td>&lt; 10ms</td></tr><tr><td>堆大小影响</td><td>大</td><td>几乎无</td><td>小</td></tr><tr><td>分代</td><td>是</td><td>是（JDK 21）</td><td>是（JDK 20）</td></tr></tbody></table><p>记住：<strong>Java 21+ 优先用分代 ZGC，G1 是 Java 17 的默认选择，低延迟是未来方向</strong>。</p>`,61)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};