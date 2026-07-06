import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97%EF%BC%9A%E5%A6%82%E4%BD%95%E5%86%99%E5%87%BA%E4%BA%BA%E8%83%BD%E7%9C%8B%E6%87%82%E7%9A%84%E6%96%87%E6%A1%A3%E5%92%8C%E6%96%B9%E6%A1%88.html","title":"技术写作指南：如何写出人能看懂的文档和方案","lang":"zh-CN","frontmatter":{"title":"技术写作指南：如何写出人能看懂的文档和方案","tag":["技术写作","文档","沟通"],"category":"产品与协作","date":"2026-07-03T00:00:00.000Z","description":"技术写作指南：如何写出人能看懂的文档和方案 技术文档写了很多，但没人看？方案写了几十页，评审时大家还是在问「这个方案到底要做什么」？问题不在技术深度，而在表达方式。本文从结构化思维到图表规范，帮你写出真正有人看的技术文档。 一、技术文档分类 二、结构化写作方法 2.1 金字塔原理 2.2 MECE 原则 2.3 SCQA 框架 三、图表表达规范 3.1...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"技术写作指南：如何写出人能看懂的文档和方案\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E5%86%99%E4%BD%9C%E6%8C%87%E5%8D%97%EF%BC%9A%E5%A6%82%E4%BD%95%E5%86%99%E5%87%BA%E4%BA%BA%E8%83%BD%E7%9C%8B%E6%87%82%E7%9A%84%E6%96%87%E6%A1%A3%E5%92%8C%E6%96%B9%E6%A1%88.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"技术写作指南：如何写出人能看懂的文档和方案"}],["meta",{"property":"og:description","content":"技术写作指南：如何写出人能看懂的文档和方案 技术文档写了很多，但没人看？方案写了几十页，评审时大家还是在问「这个方案到底要做什么」？问题不在技术深度，而在表达方式。本文从结构化思维到图表规范，帮你写出真正有人看的技术文档。 一、技术文档分类 二、结构化写作方法 2.1 金字塔原理 2.2 MECE 原则 2.3 SCQA 框架 三、图表表达规范 3.1..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"沟通"}],["meta",{"property":"article:tag","content":"文档"}],["meta",{"property":"article:tag","content":"技术写作"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":6.46,"words":1938},"filePathRelative":"posts/产品与协作/技术写作指南：如何写出人能看懂的文档和方案.md","excerpt":"\\n<p>技术文档写了很多，但没人看？方案写了几十页，评审时大家还是在问「这个方案到底要做什么」？问题不在技术深度，而在表达方式。本文从结构化思维到图表规范，帮你写出真正有人看的技术文档。</p>\\n<hr>\\n<h2>一、技术文档分类</h2>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>技术文档四大类型：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  ┌──────────────┬──────────────────────┬────────────────┐</span></span>\\n<span class=\\"line\\"><span>  │  类型          │  读者                 │  核心目标       │</span></span>\\n<span class=\\"line\\"><span>  ├──────────────┼──────────────────────┼────────────────┤</span></span>\\n<span class=\\"line\\"><span>  │  设计文档      │  技术团队              │  方案对齐+评审  │</span></span>\\n<span class=\\"line\\"><span>  │  API 文档     │  调用方开发者           │  快速接入      │</span></span>\\n<span class=\\"line\\"><span>  │  运维手册      │  运维/SRE             │  故障处理      │</span></span>\\n<span class=\\"line\\"><span>  │  复盘报告      │  团队+管理层           │  总结教训      │</span></span>\\n<span class=\\"line\\"><span>  └──────────────┴──────────────────────┴────────────────┘</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>写作黄金法则：</span></span>\\n<span class=\\"line\\"><span>  1. 先说结论，再说过程（金字塔原理）</span></span>\\n<span class=\\"line\\"><span>  2. 读者优先（写给谁看就站在谁的角度写）</span></span>\\n<span class=\\"line\\"><span>  3. 一图胜千言（能用图不用表，能用表不用段落）</span></span>\\n<span class=\\"line\\"><span>  4. 可执行（每个段落读者读完知道下一步做什么）</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`技术写作指南：如何写出人能看懂的文档和方案.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="技术写作指南-如何写出人能看懂的文档和方案" tabindex="-1"><a class="header-anchor" href="#技术写作指南-如何写出人能看懂的文档和方案"><span>技术写作指南：如何写出人能看懂的文档和方案</span></a></h1><p>技术文档写了很多，但没人看？方案写了几十页，评审时大家还是在问「这个方案到底要做什么」？问题不在技术深度，而在表达方式。本文从结构化思维到图表规范，帮你写出真正有人看的技术文档。</p><hr><h2 id="一、技术文档分类" tabindex="-1"><a class="header-anchor" href="#一、技术文档分类"><span>一、技术文档分类</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术文档四大类型：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────────┬──────────────────────┬────────────────┐</span></span>
<span class="line"><span>  │  类型          │  读者                 │  核心目标       │</span></span>
<span class="line"><span>  ├──────────────┼──────────────────────┼────────────────┤</span></span>
<span class="line"><span>  │  设计文档      │  技术团队              │  方案对齐+评审  │</span></span>
<span class="line"><span>  │  API 文档     │  调用方开发者           │  快速接入      │</span></span>
<span class="line"><span>  │  运维手册      │  运维/SRE             │  故障处理      │</span></span>
<span class="line"><span>  │  复盘报告      │  团队+管理层           │  总结教训      │</span></span>
<span class="line"><span>  └──────────────┴──────────────────────┴────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>写作黄金法则：</span></span>
<span class="line"><span>  1. 先说结论，再说过程（金字塔原理）</span></span>
<span class="line"><span>  2. 读者优先（写给谁看就站在谁的角度写）</span></span>
<span class="line"><span>  3. 一图胜千言（能用图不用表，能用表不用段落）</span></span>
<span class="line"><span>  4. 可执行（每个段落读者读完知道下一步做什么）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、结构化写作方法" tabindex="-1"><a class="header-anchor" href="#二、结构化写作方法"><span>二、结构化写作方法</span></a></h2><h3 id="_2-1-金字塔原理" tabindex="-1"><a class="header-anchor" href="#_2-1-金字塔原理"><span>2.1 金字塔原理</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>金字塔原理：结论先行，逐层展开</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ❌ 错误写法（倒三角）：</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  我们调研了 3 种方案：</span></span>
<span class="line"><span>  方案 A 用 Redis，优点是快但数据量大时内存不够</span></span>
<span class="line"><span>  方案 B 用 MySQL，优点是稳定但查询慢</span></span>
<span class="line"><span>  方案 C 用 ES，支持全文搜索且扩展性好</span></span>
<span class="line"><span>  综合考虑，我们选择方案 C。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  问题：读者读到最后一行才知道结论</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ✅ 正确写法（金字塔）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  我们选择 ES 作为搜索引擎。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  原因有三：</span></span>
<span class="line"><span>  1. 支持全文搜索（MySQL 的 LIKE 性能差）</span></span>
<span class="line"><span>  2. 水平扩展（Redis 内存成本高）</span></span>
<span class="line"><span>  3. 与现有日志系统统一技术栈</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  方案对比：</span></span>
<span class="line"><span>  ┌────────┬────────┬────────┬────────┐</span></span>
<span class="line"><span>  │        │ Redis  │ MySQL  │  ES    │</span></span>
<span class="line"><span>  │ 搜索   │ 精确匹配│ LIKE 慢 │ 全文搜索│</span></span>
<span class="line"><span>  │ 扩展   │ 内存限制│ 分库分表│ 水平扩展│</span></span>
<span class="line"><span>  │ 成本   │ 内存贵  │ 低     │ 中     │</span></span>
<span class="line"><span>  └────────┴────────┴────────┴────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  现象 → 结论 → 依据 → 细节</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-mece-原则" tabindex="-1"><a class="header-anchor" href="#_2-2-mece-原则"><span>2.2 MECE 原则</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>MECE（Mutually Exclusive, Collectively Exhaustive）：</span></span>
<span class="line"><span>  相互独立，完全穷尽</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  分类时做到不重叠、不遗漏</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ❌ 不 MECE：</span></span>
<span class="line"><span>  &quot;性能问题分为：CPU 问题、内存问题、数据库问题&quot;</span></span>
<span class="line"><span>  → 数据库问题可能也是 CPU 问题（重叠）</span></span>
<span class="line"><span>  → 遗漏了网络问题、IO 问题</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ✅ MECE：</span></span>
<span class="line"><span>  &quot;性能问题按资源分类：</span></span>
<span class="line"><span>   CPU、内存、磁盘 IO、网络、数据库、应用代码&quot;</span></span>
<span class="line"><span>  → 每个分类独立，合在一起覆盖所有可能</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  在技术文档中的应用：</span></span>
<span class="line"><span>  - 方案对比：列全所有可行方案</span></span>
<span class="line"><span>  - 影响评估：覆盖所有受影响模块</span></span>
<span class="line"><span>  - 风险列举：覆盖技术/业务/安全/合规</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-scqa-框架" tabindex="-1"><a class="header-anchor" href="#_2-3-scqa-框架"><span>2.3 SCQA 框架</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>SCQA：情境 → 冲突 → 问题 → 答案</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  S（Situation）：情境——读者认可的背景</span></span>
<span class="line"><span>  &quot;我们的订单系统日均处理 100 万订单，</span></span>
<span class="line"><span>   P99 响应时间 200ms&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  C（Complication）：冲突——打破了情境</span></span>
<span class="line"><span>  &quot;大促期间 QPS 涨 10 倍，P99 飙升到 2s，</span></span>
<span class="line"><span>   丢单率上升 3%&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Q（Question）：问题——读者心中的疑问</span></span>
<span class="line"><span>  &quot;如何在大促期间保持 P99 &lt; 500ms？&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  A（Answer）：答案——你的方案</span></span>
<span class="line"><span>  &quot;引入 Redis 缓存 + 读写分离 + 限流降级，</span></span>
<span class="line"><span>   预期 P99 降到 300ms&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  效果：读者自然被吸引，从「为什么要做」到「怎么做」</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、图表表达规范" tabindex="-1"><a class="header-anchor" href="#三、图表表达规范"><span>三、图表表达规范</span></a></h2><h3 id="_3-1-架构图" tabindex="-1"><a class="header-anchor" href="#_3-1-架构图"><span>3.1 架构图</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>架构图规范：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 层次清晰（从上到下：用户 → 应用 → 数据）</span></span>
<span class="line"><span>  2. 箭头方向表示数据流/调用关系</span></span>
<span class="line"><span>  3. 每个框标注名称 + 技术栈</span></span>
<span class="line"><span>  4. 用不同颜色区分：外部/应用/中间件/存储</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  示例：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────┐     ┌──────────┐</span></span>
<span class="line"><span>  │  Web 前端  │     │  APP 客户端 │</span></span>
<span class="line"><span>  │  (Vue 3)  │     │  (Flutter) │</span></span>
<span class="line"><span>  └─────┬────┘     └─────┬──────┘</span></span>
<span class="line"><span>        │                │</span></span>
<span class="line"><span>        ▼                ▼</span></span>
<span class="line"><span>  ┌─────────────────────────────┐</span></span>
<span class="line"><span>  │      API Gateway (Nginx)     │</span></span>
<span class="line"><span>  └─────────────┬───────────────┘</span></span>
<span class="line"><span>                │</span></span>
<span class="line"><span>    ┌───────────┼───────────┐</span></span>
<span class="line"><span>    ▼           ▼           ▼</span></span>
<span class="line"><span>  ┌──────┐  ┌──────┐   ┌──────┐</span></span>
<span class="line"><span>  │用户服务│  │订单服务│   │商品服务│</span></span>
<span class="line"><span>  │(Java) │  │(Java) │   │(Go)  │</span></span>
<span class="line"><span>  └───┬──┘  └───┬──┘   └───┬──┘</span></span>
<span class="line"><span>      │         │          │</span></span>
<span class="line"><span>      ▼         ▼          ▼</span></span>
<span class="line"><span>  ┌──────┐  ┌──────┐   ┌──────┐</span></span>
<span class="line"><span>  │MySQL │  │MySQL │   │ ES   │</span></span>
<span class="line"><span>  └──────┘  └──────┘   └──────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-流程图" tabindex="-1"><a class="header-anchor" href="#_3-2-流程图"><span>3.2 流程图</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>流程图规范：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  使用标准符号：</span></span>
<span class="line"><span>  ○  开始/结束</span></span>
<span class="line"><span>  □  处理步骤</span></span>
<span class="line"><span>  ◇  判断</span></span>
<span class="line"><span>  ▽  数据输入/输出</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  示例（订单流程）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ○ 开始</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  ▽ 用户提交订单</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  ◇ 库存充足？</span></span>
<span class="line"><span>  │ ├── 否 → 返回缺货提示 → ○ 结束</span></span>
<span class="line"><span>  │ └── 是</span></span>
<span class="line"><span>  │        │</span></span>
<span class="line"><span>  □ 创建订单（状态：待支付）</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  □ 发送支付消息</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  ◇ 15 分钟内支付？</span></span>
<span class="line"><span>  │ ├── 否 → 取消订单 → ○ 结束</span></span>
<span class="line"><span>  │ └── 是</span></span>
<span class="line"><span>  │        │</span></span>
<span class="line"><span>  □ 更新订单（状态：已支付）</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  □ 发送物流消息</span></span>
<span class="line"><span>  │</span></span>
<span class="line"><span>  ○ 结束</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-时序图" tabindex="-1"><a class="header-anchor" href="#_3-3-时序图"><span>3.3 时序图</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>时序图规范：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  参与者：用户 / Web / API / DB</span></span>
<span class="line"><span>  消息：→ 同步调用，--&gt; 异步消息</span></span>
<span class="line"><span>  激活条：表示处理时间</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  示例（登录时序）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  用户      Web      API      Redis     MySQL</span></span>
<span class="line"><span>   │         │        │         │         │</span></span>
<span class="line"><span>   │─POST──→│        │         │         │</span></span>
<span class="line"><span>   │  login  │        │         │         │</span></span>
<span class="line"><span>   │         │─POST──→│         │         │</span></span>
<span class="line"><span>   │         │        │─GET────→│         │</span></span>
<span class="line"><span>   │         │        │  token  │         │</span></span>
<span class="line"><span>   │         │        │←───OK───│         │</span></span>
<span class="line"><span>   │         │        │                   │</span></span>
<span class="line"><span>   │         │        │─SELECT──────────→│</span></span>
<span class="line"><span>   │         │        │  user             │</span></span>
<span class="line"><span>   │         │        │←─────result───────│</span></span>
<span class="line"><span>   │         │        │                   │</span></span>
<span class="line"><span>   │         │        │─SET────→│         │</span></span>
<span class="line"><span>   │         │        │  session│         │</span></span>
<span class="line"><span>   │         │←──200──│         │         │</span></span>
<span class="line"><span>   │←──200───│        │         │         │</span></span>
<span class="line"><span>   │  token  │        │         │         │</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、不同类型文档的写作要点" tabindex="-1"><a class="header-anchor" href="#四、不同类型文档的写作要点"><span>四、不同类型文档的写作要点</span></a></h2><h3 id="_4-1-设计文档" tabindex="-1"><a class="header-anchor" href="#_4-1-设计文档"><span>4.1 设计文档</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 设计文档 Checklist</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 背景与目标（为什么做，做成什么样）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 现状分析（当前怎么做的，有什么问题）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 方案对比（至少 2 个方案，列出优缺点）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 详细设计（架构图 + 流程图 + 接口 + 数据模型）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 影响评估（影响哪些模块，兼容性）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 测试策略</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 上线计划（灰度 + 回滚）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">□ 风险与对策</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">常见问题：</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">  ❌ 只有方案没有对比（为什么选这个方案？）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">  ❌ 只有架构没有流程（数据怎么流转？）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">  ❌ 只有正常路径没有异常处理（出错怎么办？）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">  ❌ 没有影响评估（改了什么其他模块？）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-复盘报告" tabindex="-1"><a class="header-anchor" href="#_4-2-复盘报告"><span>4.2 复盘报告</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 复盘报告模板</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 事件概述</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 时间：2024-06-15 14:30 ~ 15:45（75 分钟）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 影响：订单服务不可用，影响 12,000 笔订单</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 严重级别：P0</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 时间线</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">14:30  监控告警：订单服务错误率 100%</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">14:32  值班收到告警，开始排查</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">14:35  定位到 MySQL 慢查询导致连接池耗尽</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">14:40  临时方案：扩容连接池</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">14:45  连接池扩容完成，服务恢复</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">15:00  确认根因：索引被误删</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">15:15  恢复索引</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">15:30  验证服务正常</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">15:45  事件关闭</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 根因分析（5Why）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">1.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 为什么服务不可用？→ MySQL 连接池耗尽</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">2.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 为什么连接池耗尽？→ 慢查询占用连接不释放</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">3.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 为什么有慢查询？→ 全表扫描（索引缺失）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">4.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 为什么索引缺失？→ 06-14 凌晨 DDL 误删索引</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">5.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 为什么 DDL 误删？→ DDL 评审缺少索引检查</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 改进措施</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| # | 改进项 | 负责人 | 截止日 | 状态 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">|---|--------|--------|--------|------|</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 1 | DDL 评审增加索引检查项 | 张三 | 06-20 | 已完成 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 2 | 慢查询告警阈值从 1s 降到 500ms | 李四 | 06-18 | 已完成 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 3 | 连接池监控大盘补充 | 王五 | 06-25 | 进行中 |</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、面试要点" tabindex="-1"><a class="header-anchor" href="#五、面试要点"><span>五、面试要点</span></a></h2><h3 id="q-技术方案文档怎么写" tabindex="-1"><a class="header-anchor" href="#q-技术方案文档怎么写"><span>Q：技术方案文档怎么写？</span></a></h3><ol><li>背景+目标（为什么做）2. 现状分析（当前问题）3. 方案对比（至少 2 个，列出优缺点和选择理由）4. 详细设计（架构图+流程图+接口+数据模型）5. 影响评估 6. 测试策略 7. 上线计划（灰度+回滚）8. 风险与对策。核心原则：结论先行（金字塔原理），方案有对比，异常有处理。</li></ol><h3 id="q-如何提高文档的可读性" tabindex="-1"><a class="header-anchor" href="#q-如何提高文档的可读性"><span>Q：如何提高文档的可读性？</span></a></h3><ol><li>金字塔原理：结论先行，逐层展开 2. MECE 分类：不重叠不遗漏 3. 一图胜千言：架构图/流程图/时序图 4. 段落 &lt; 5 行，多用列表 5. 预读机制：评审前发出，减少会议时间 6. 持续更新：文档是活的，随方案变更更新。</li></ol><hr><h2 id="六、总结" tabindex="-1"><a class="header-anchor" href="#六、总结"><span>六、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术写作 = 结构化思维 + 图表表达 + 读者意识</span></span>
<span class="line"><span></span></span>
<span class="line"><span>结构化：金字塔原理（结论先行）+ MECE（不重叠不遗漏）+ SCQA（情境-冲突-问题-答案）</span></span>
<span class="line"><span>图表：架构图（层次+箭头）+ 流程图（标准符号）+ 时序图（交互顺序）</span></span>
<span class="line"><span>分类：设计文档（8 节结构）/ API 文档 / 运维手册 / 复盘报告</span></span>
<span class="line"><span></span></span>
<span class="line"><span>核心原则：</span></span>
<span class="line"><span>  - 先说结论再说过程</span></span>
<span class="line"><span>  - 写给读者看，不是写给自己看</span></span>
<span class="line"><span>  - 能用图不用表，能用表不用段落</span></span>
<span class="line"><span>  - 文档是活的，持续更新</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,36)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};