import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E8%AF%84%E5%AE%A1%E5%AE%9E%E6%88%98%E6%8C%87%E5%8D%97%EF%BC%9A%E5%A6%82%E4%BD%95%E8%AE%A9%E6%96%B9%E6%A1%88%E8%AF%84%E5%AE%A1%E4%B8%8D%E5%86%8D%E8%B5%B0%E5%BD%A2%E5%BC%8F.html","title":"技术评审实战指南：如何让方案评审不再走形式","lang":"zh-CN","frontmatter":{"title":"技术评审实战指南：如何让方案评审不再走形式","tag":["技术评审","方案设计","团队协作"],"category":"产品与协作","date":"2026-07-03T00:00:00.000Z","description":"技术评审实战指南：如何让方案评审不再走形式 技术评审是技术团队最重要的质量保障环节，但现实中往往变成「走过场」——评审会变成念文档会，问题没人提，上线后才发现方案有硬伤。本文从评审前准备到评审后跟踪，建立完整的技术评审体系。 一、为什么要做技术评审 1.1 评审的价值 1.2 评审反模式 二、评审前准备 2.1 方案文档结构 2.2 预读机制 三、评审...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"技术评审实战指南：如何让方案评审不再走形式\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E8%AF%84%E5%AE%A1%E5%AE%9E%E6%88%98%E6%8C%87%E5%8D%97%EF%BC%9A%E5%A6%82%E4%BD%95%E8%AE%A9%E6%96%B9%E6%A1%88%E8%AF%84%E5%AE%A1%E4%B8%8D%E5%86%8D%E8%B5%B0%E5%BD%A2%E5%BC%8F.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"技术评审实战指南：如何让方案评审不再走形式"}],["meta",{"property":"og:description","content":"技术评审实战指南：如何让方案评审不再走形式 技术评审是技术团队最重要的质量保障环节，但现实中往往变成「走过场」——评审会变成念文档会，问题没人提，上线后才发现方案有硬伤。本文从评审前准备到评审后跟踪，建立完整的技术评审体系。 一、为什么要做技术评审 1.1 评审的价值 1.2 评审反模式 二、评审前准备 2.1 方案文档结构 2.2 预读机制 三、评审..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"团队协作"}],["meta",{"property":"article:tag","content":"方案设计"}],["meta",{"property":"article:tag","content":"技术评审"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":8.35,"words":2505},"filePathRelative":"posts/产品与协作/技术评审实战指南：如何让方案评审不再走形式.md","excerpt":"\\n<p>技术评审是技术团队最重要的质量保障环节，但现实中往往变成「走过场」——评审会变成念文档会，问题没人提，上线后才发现方案有硬伤。本文从评审前准备到评审后跟踪，建立完整的技术评审体系。</p>\\n<hr>\\n<h2>一、为什么要做技术评审</h2>\\n<h3>1.1 评审的价值</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>技术评审的四大价值：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  1. 风险前置</span></span>\\n<span class=\\"line\\"><span>     评审前发现架构问题 = 修改方案 1 天</span></span>\\n<span class=\\"line\\"><span>     开发中发现架构问题 = 修改代码 + 方案 5 天</span></span>\\n<span class=\\"line\\"><span>     上线后发现架构问题 = 紧急修复 + 数据修复 15 天</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  2. 知识共享</span></span>\\n<span class=\\"line\\"><span>     方案作者独自理解系统 → 团队成员不理解</span></span>\\n<span class=\\"line\\"><span>     评审会讲解方案 → 团队对齐理解</span></span>\\n<span class=\\"line\\"><span>     后续维护时不会只有一个人懂</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  3. 架构演进</span></span>\\n<span class=\\"line\\"><span>     评审是架构对齐的机会</span></span>\\n<span class=\\"line\\"><span>     避免各模块各自为政导致架构碎片化</span></span>\\n<span class=\\"line\\"><span>     新方案与已有架构的一致性检查</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  4. 质量兜底</span></span>\\n<span class=\\"line\\"><span>     即使优秀工程师也会遗漏边界条件</span></span>\\n<span class=\\"line\\"><span>     多人审查降低低级错误概率</span></span>\\n<span class=\\"line\\"><span>     生产事故的最有效预防手段</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`技术评审实战指南：如何让方案评审不再走形式.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="技术评审实战指南-如何让方案评审不再走形式" tabindex="-1"><a class="header-anchor" href="#技术评审实战指南-如何让方案评审不再走形式"><span>技术评审实战指南：如何让方案评审不再走形式</span></a></h1><p>技术评审是技术团队最重要的质量保障环节，但现实中往往变成「走过场」——评审会变成念文档会，问题没人提，上线后才发现方案有硬伤。本文从评审前准备到评审后跟踪，建立完整的技术评审体系。</p><hr><h2 id="一、为什么要做技术评审" tabindex="-1"><a class="header-anchor" href="#一、为什么要做技术评审"><span>一、为什么要做技术评审</span></a></h2><h3 id="_1-1-评审的价值" tabindex="-1"><a class="header-anchor" href="#_1-1-评审的价值"><span>1.1 评审的价值</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术评审的四大价值：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 风险前置</span></span>
<span class="line"><span>     评审前发现架构问题 = 修改方案 1 天</span></span>
<span class="line"><span>     开发中发现架构问题 = 修改代码 + 方案 5 天</span></span>
<span class="line"><span>     上线后发现架构问题 = 紧急修复 + 数据修复 15 天</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. 知识共享</span></span>
<span class="line"><span>     方案作者独自理解系统 → 团队成员不理解</span></span>
<span class="line"><span>     评审会讲解方案 → 团队对齐理解</span></span>
<span class="line"><span>     后续维护时不会只有一个人懂</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. 架构演进</span></span>
<span class="line"><span>     评审是架构对齐的机会</span></span>
<span class="line"><span>     避免各模块各自为政导致架构碎片化</span></span>
<span class="line"><span>     新方案与已有架构的一致性检查</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. 质量兜底</span></span>
<span class="line"><span>     即使优秀工程师也会遗漏边界条件</span></span>
<span class="line"><span>     多人审查降低低级错误概率</span></span>
<span class="line"><span>     生产事故的最有效预防手段</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-评审反模式" tabindex="-1"><a class="header-anchor" href="#_1-2-评审反模式"><span>1.2 评审反模式</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>常见评审反模式：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ❌ 一言堂：资深工程师说了算，其他人不敢提异议</span></span>
<span class="line"><span>  ❌ 走过场：评审会 15 分钟结束，没有人提问</span></span>
<span class="line"><span>  ❌ 念文档：作者把方案文档从头到尾念一遍</span></span>
<span class="line"><span>  ❌ 过度设计：简单需求搞了 50 页方案文档</span></span>
<span class="line"><span>  ❌ 无人准备：评审前没人看文档，现场才开始理解</span></span>
<span class="line"><span>  ❌ 只评审不跟踪：评审发现问题但没人跟进修复</span></span>
<span class="line"><span>  ❌ 大而全：一次评审 10 个方案，每个 5 分钟</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、评审前准备" tabindex="-1"><a class="header-anchor" href="#二、评审前准备"><span>二、评审前准备</span></a></h2><h3 id="_2-1-方案文档结构" tabindex="-1"><a class="header-anchor" href="#_2-1-方案文档结构"><span>2.1 方案文档结构</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"># 技术方案：</span><span style="--shiki-light:#986801;--shiki-dark:#E06C75;">[</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">需求名称</span><span style="--shiki-light:#986801;--shiki-dark:#E06C75;">]</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 1. 背景与目标</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 业务背景（为什么做）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 目标（做成什么样）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 非目标（这次不做什么）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 2. 现状分析</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 当前架构图</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 现有方案的问题</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 数据支持（QPS、延迟、错误率）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 3. 方案设计</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 方案对比（至少 2 个方案）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 方案 A：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">    -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 优点：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">    -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 缺点：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 方案 B：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">    -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 优点：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">    -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 缺点：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 选择方案 X 的理由</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 详细设计</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 架构图</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 核心流程图</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 接口设计</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 数据模型变更</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 4. 影响评估</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 影响的模块</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 兼容性（向前/向后）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 性能影响</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 安全影响</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 5. 测试策略</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 单元测试</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 集成测试</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 回归测试范围</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 6. 上线计划</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 灰度策略</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 回滚方案</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 监控告警</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 7. 风险与对策</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 风险 1：xxx → 对策：xxx</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 风险 2：xxx → 对策：xxx</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 8. 里程碑</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 开发：x天</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 测试：x天</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 上线：x天</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 附录</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 参考资料</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 术语表</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-预读机制" tabindex="-1"><a class="header-anchor" href="#_2-2-预读机制"><span>2.2 预读机制</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>预读机制（评审前 24 小时）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  T-48h：作者提交方案文档（Wiki/Confluence/飞书文档）</span></span>
<span class="line"><span>  T-48h~T-24h：参与者预读，在文档上批注问题</span></span>
<span class="line"><span>  T-24h：作者根据批注更新方案（低级问题提前解决）</span></span>
<span class="line"><span>  T-0h：评审会，只讨论批注中未解决的问题 + 深入讨论</span></span>
<span class="line"><span></span></span>
<span class="line"><span>预读的好处：</span></span>
<span class="line"><span>  ✓ 评审会只讨论有价值的问题（不浪费时间在低级问题上）</span></span>
<span class="line"><span>  ✓ 内向的工程师也能通过批注提出意见</span></span>
<span class="line"><span>  ✓ 作者有时间思考回复，不是现场被问住</span></span>
<span class="line"><span>  ✓ 评审会时间从 2 小时缩短到 30-60 分钟</span></span>
<span class="line"><span></span></span>
<span class="line"><span>预读检查清单（参与者用）：</span></span>
<span class="line"><span>  □ 方案是否解决了业务问题？</span></span>
<span class="line"><span>  □ 架构设计是否合理？</span></span>
<span class="line"><span>  □ 是否有更简单的方案？</span></span>
<span class="line"><span>  □ 边界条件是否考虑充分？</span></span>
<span class="line"><span>  □ 异常处理是否完整？</span></span>
<span class="line"><span>  □ 是否影响已有功能？</span></span>
<span class="line"><span>  □ 测试策略是否覆盖关键路径？</span></span>
<span class="line"><span>  □ 回滚方案是否可行？</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、评审会议" tabindex="-1"><a class="header-anchor" href="#三、评审会议"><span>三、评审会议</span></a></h2><h3 id="_3-1-会议组织" tabindex="-1"><a class="header-anchor" href="#_3-1-会议组织"><span>3.1 会议组织</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>评审会议组织：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  参与人：</span></span>
<span class="line"><span>    必须：方案作者、技术负责人、相关模块开发者、测试负责人</span></span>
<span class="line"><span>    可选：架构师、运维、DBA、安全（根据方案影响范围）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  时间：</span></span>
<span class="line"><span>    方案复杂度  小    中    大</span></span>
<span class="line"><span>    会议时长   30min  60min  90min</span></span>
<span class="line"><span>    参与人数   3-4    5-7    8-10</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  议程：</span></span>
<span class="line"><span>    00:00-05:00  作者概述方案（背景+方案选择+核心设计）</span></span>
<span class="line"><span>    05:00-25:00  逐项讨论预读批注中的问题</span></span>
<span class="line"><span>    25:00-30:00  总结 Action Items + 决策</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  规则：</span></span>
<span class="line"><span>    1. 作者只概述，不念文档（大家已预读）</span></span>
<span class="line"><span>    2. 聚焦「有没有问题」而非「怎么做更好」（除非有严重缺陷）</span></span>
<span class="line"><span>    3. 每个问题有明确结论：采纳/不采纳/待定</span></span>
<span class="line"><span>    4. 不在会议上深入讨论实现细节（线下沟通）</span></span>
<span class="line"><span>    5. 记录员记录所有决策和 Action Items</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-问题清单模板" tabindex="-1"><a class="header-anchor" href="#_3-2-问题清单模板"><span>3.2 问题清单模板</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>评审问题清单（会议中实时记录）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  #  编号  问题                              提出人  结论      负责人  截止日</span></span>
<span class="line"><span>  1  P001  订单查询接口没有分页               张三    采纳      王五    06-16</span></span>
<span class="line"><span>  2  P002  Redis 缓存过期时间设置为多少？      李四    采纳(1h)  王五    06-16</span></span>
<span class="line"><span>  3  P003  是否需要考虑跨机房容灾？            赵六    不采纳    -       -</span></span>
<span class="line"><span>  4  P004  回滚方案中数据迁移怎么处理？        张三    待定      王五    06-17</span></span>
<span class="line"><span>  5  P005  告警阈值建议从 5% 降到 2%          李四    采纳      王五    06-16</span></span>
<span class="line"><span></span></span>
<span class="line"><span>问题分类：</span></span>
<span class="line"><span>  P0：阻塞性问题（必须解决才能开发）</span></span>
<span class="line"><span>  P1：重要问题（开发前解决）</span></span>
<span class="line"><span>  P2：建议性问题（开发中解决）</span></span>
<span class="line"><span>  P3：低优先级（后续迭代解决）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>决策记录：</span></span>
<span class="line"><span>  P003 不采纳原因：当前业务量不需要跨机房，下个季度评估</span></span>
<span class="line"><span>  P004 待定原因：需要与 DBA 确认数据迁移工具支持</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、评审后跟踪" tabindex="-1"><a class="header-anchor" href="#四、评审后跟踪"><span>四、评审后跟踪</span></a></h2><h3 id="_4-1-action-item-跟踪" tabindex="-1"><a class="header-anchor" href="#_4-1-action-item-跟踪"><span>4.1 Action Item 跟踪</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Action Item 跟踪机制：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  评审结束 → 24 小时内发出评审纪要</span></span>
<span class="line"><span>  纪要包含：</span></span>
<span class="line"><span>    1. 方案概述</span></span>
<span class="line"><span>    2. 参与人列表</span></span>
<span class="line"><span>    3. 问题清单（含结论）</span></span>
<span class="line"><span>    4. Action Items（含负责人+截止日）</span></span>
<span class="line"><span>    5. 评审结论：通过/有条件通过/不通过</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  跟踪方式：</span></span>
<span class="line"><span>    - Action Items 录入 Jira/飞书任务</span></span>
<span class="line"><span>    - 每日站会同步进度</span></span>
<span class="line"><span>    - 所有 P0 问题解决后才能开始开发</span></span>
<span class="line"><span>    - P1 问题在开发期间解决</span></span>
<span class="line"><span>    - 评审纪要链接放在方案文档顶部</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  评审结论分类：</span></span>
<span class="line"><span>    ✅ 通过：方案无阻塞性问题，可以开始开发</span></span>
<span class="line"><span>    ⚠️ 有条件通过：有 P0 问题，解决后开始开发</span></span>
<span class="line"><span>    ❌ 不通过：方案有根本性问题，需要重新设计</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-方案变更管理" tabindex="-1"><a class="header-anchor" href="#_4-2-方案变更管理"><span>4.2 方案变更管理</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>开发过程中的方案变更：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  场景：开发中发现方案需要修改</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  变更流程：</span></span>
<span class="line"><span>    1. 开发者提出变更申请（在方案文档中标注）</span></span>
<span class="line"><span>    2. 技术负责人评估变更影响</span></span>
<span class="line"><span>    3. 小变更（不影响架构）→ 技术负责人批准</span></span>
<span class="line"><span>    4. 大变更（影响架构/接口）→ 重新评审</span></span>
<span class="line"><span>    5. 更新方案文档（标注变更原因和日期）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  方案文档版本管理：</span></span>
<span class="line"><span>    v1.0 (06-15)：初始版本</span></span>
<span class="line"><span>    v1.1 (06-17)：修改缓存策略（根据评审 P002）</span></span>
<span class="line"><span>    v1.2 (06-20)：新增分页支持（根据评审 P001）</span></span>
<span class="line"><span>    v2.0 (06-25）：架构调整（数据源从 MySQL 改为 ES）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  原则：方案文档是活的文档，开发过程中持续更新</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、不同类型评审的侧重点" tabindex="-1"><a class="header-anchor" href="#五、不同类型评审的侧重点"><span>五、不同类型评审的侧重点</span></a></h2><h3 id="_5-1-评审分类" tabindex="-1"><a class="header-anchor" href="#_5-1-评审分类"><span>5.1 评审分类</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>按评审类型区分侧重点：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌────────────┬──────────────────────────────┐</span></span>
<span class="line"><span>  │  评审类型    │  侧重点                       │</span></span>
<span class="line"><span>  ├────────────┼──────────────────────────────┤</span></span>
<span class="line"><span>  │  架构评审    │  架构合理性、扩展性、          │</span></span>
<span class="line"><span>  │            │  与现有系统一致性              │</span></span>
<span class="line"><span>  ├────────────┼──────────────────────────────┤</span></span>
<span class="line"><span>  │  方案评审    │  技术选型、接口设计、          │</span></span>
<span class="line"><span>  │            │  数据模型、异常处理            │</span></span>
<span class="line"><span>  ├────────────┼──────────────────────────────┤</span></span>
<span class="line"><span>  │  代码评审    │  代码质量、规范、             │</span></span>
<span class="line"><span>  │            │  边界条件、性能               │</span></span>
<span class="line"><span>  ├────────────┼──────────────────────────────┤</span></span>
<span class="line"><span>  │  安全评审    │  权限控制、数据安全、         │</span></span>
<span class="line"><span>  │            │  攻击防护                    │</span></span>
<span class="line"><span>  ├────────────┼──────────────────────────────┤</span></span>
<span class="line"><span>  │  上线评审    │  灰度策略、监控告警、         │</span></span>
<span class="line"><span>  │            │  回滚方案                    │</span></span>
<span class="line"><span>  └────────────┴──────────────────────────────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、面试要点" tabindex="-1"><a class="header-anchor" href="#六、面试要点"><span>六、面试要点</span></a></h2><h3 id="q-技术方案评审怎么做" tabindex="-1"><a class="header-anchor" href="#q-技术方案评审怎么做"><span>Q：技术方案评审怎么做？</span></a></h3><ol><li>评审前 48 小时提交方案文档，包含背景、现状、方案对比、详细设计、影响评估、测试策略、上线计划、风险对策</li><li>参与者预读并在文档上批注，作者提前回复低级问题</li><li>评审会只讨论未解决的批注问题，30-60 分钟</li><li>记录问题清单和 Action Items，每个问题有明确结论</li><li>评审结论分通过/有条件通过/不通过，P0 问题解决后才能开发</li><li>评审后 24 小时发出纪要，Action Items 录入任务系统跟踪</li></ol><h3 id="q-评审中遇到分歧怎么办" tabindex="-1"><a class="header-anchor" href="#q-评审中遇到分歧怎么办"><span>Q：评审中遇到分歧怎么办？</span></a></h3><ol><li>用数据说话：性能压测数据、A/B 测试结果</li><li>用经验说话：参考业界最佳实践、大厂方案</li><li>用原型说话：关键争议点做技术验证 POC</li><li>升级机制：技术负责人决策 → 架构师决策 → CTO 决策</li><li>记录分歧：即使最终决策，也记录不同意见，便于后续复盘</li></ol><h3 id="q-如何避免评审走形式" tabindex="-1"><a class="header-anchor" href="#q-如何避免评审走形式"><span>Q：如何避免评审走形式？</span></a></h3><ol><li>预读机制：评审前必须预读，不预读不参加</li><li>只讨论问题：不念文档，不介绍背景（预读已覆盖）</li><li>问题驱动：每个参与者至少提出一个问题</li><li>结论明确：每个问题有采纳/不采纳/待定结论</li><li>跟踪到底：Action Items 有负责人和截止日</li><li>度量效果：跟踪评审发现的问题数 vs 上线后发现的 bug 数</li></ol><hr><h2 id="七、总结" tabindex="-1"><a class="header-anchor" href="#七、总结"><span>七、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术评审 = 预读 + 会议 + 跟踪</span></span>
<span class="line"><span></span></span>
<span class="line"><span>评审前：方案文档（8 节结构） + 预读批注（24h 前完成）</span></span>
<span class="line"><span>评审中：概述 5min + 逐项讨论 + 决策记录（每项有结论）</span></span>
<span class="line"><span>评审后：24h 内纪要 + Action Items 跟踪 + 方案变更管理</span></span>
<span class="line"><span></span></span>
<span class="line"><span>核心原则：</span></span>
<span class="line"><span>  - 预读是关键（不预读的评审 = 走形式）</span></span>
<span class="line"><span>  - 只讨论有价值的问题（低级问题在批注中解决）</span></span>
<span class="line"><span>  - 每个问题有结论（不悬而未决）</span></span>
<span class="line"><span>  - P0 问题解决后才能开发（阻塞开发）</span></span>
<span class="line"><span>  - 方案文档持续更新（活的文档）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,41)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};