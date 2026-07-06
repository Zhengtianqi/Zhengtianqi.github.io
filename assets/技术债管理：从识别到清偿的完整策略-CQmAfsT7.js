import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E5%80%BA%E7%AE%A1%E7%90%86%EF%BC%9A%E4%BB%8E%E8%AF%86%E5%88%AB%E5%88%B0%E6%B8%85%E5%81%BF%E7%9A%84%E5%AE%8C%E6%95%B4%E7%AD%96%E7%95%A5.html","title":"技术债管理：从识别到清偿的完整策略","lang":"zh-CN","frontmatter":{"title":"技术债管理：从识别到清偿的完整策略","tag":["项目管理","重构"],"date":"2026-06-12T00:00:00.000Z","category":"产品与协作","description":"技术债管理：从识别到清偿的完整策略 技术债管理：从识别到清偿的完整策略是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。 本文介绍了技术债管理：从识别到清偿的完整策略的方法论和实践经验，帮助你提升产品思维。 技术债（Technical Debt） 是一个比喻：为了短期利益（快速交付），而在代码质量或架构上做出的妥协，这种妥协在未来会以更高的...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"技术债管理：从识别到清偿的完整策略\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-06-12T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E5%80%BA%E7%AE%A1%E7%90%86%EF%BC%9A%E4%BB%8E%E8%AF%86%E5%88%AB%E5%88%B0%E6%B8%85%E5%81%BF%E7%9A%84%E5%AE%8C%E6%95%B4%E7%AD%96%E7%95%A5.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"技术债管理：从识别到清偿的完整策略"}],["meta",{"property":"og:description","content":"技术债管理：从识别到清偿的完整策略 技术债管理：从识别到清偿的完整策略是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。 本文介绍了技术债管理：从识别到清偿的完整策略的方法论和实践经验，帮助你提升产品思维。 技术债（Technical Debt） 是一个比喻：为了短期利益（快速交付），而在代码质量或架构上做出的妥协，这种妥协在未来会以更高的..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"重构"}],["meta",{"property":"article:tag","content":"项目管理"}],["meta",{"property":"article:published_time","content":"2026-06-12T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1781224443000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":3,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":14.43,"words":4330},"filePathRelative":"posts/产品与协作/技术债管理：从识别到清偿的完整策略.md","excerpt":"\\n<blockquote>\\n<p>技术债管理：从识别到清偿的完整策略是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。<br>\\n本文介绍了技术债管理：从识别到清偿的完整策略的方法论和实践经验，帮助你提升产品思维。</p>\\n</blockquote>\\n<p><strong>技术债（Technical Debt）</strong> 是一个比喻：为了短期利益（快速交付），而在代码质量或架构上做出的妥协，这种妥协在未来会以更高的维护成本&quot;连本带利&quot;地偿还。</p>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>技术债的类比：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>金融债          技术债</span></span>\\n<span class=\\"line\\"><span>────────────────────────────────</span></span>\\n<span class=\\"line\\"><span>借款            为了快速上线，简化设计</span></span>\\n<span class=\\"line\\"><span>利息            每次修改都要比正常多花时间</span></span>\\n<span class=\\"line\\"><span>利滚利          在坏代码上加新功能，越加越乱</span></span>\\n<span class=\\"line\\"><span>破产            系统无法维护，只能重写</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`技术债管理：从识别到清偿的完整策略.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="技术债管理-从识别到清偿的完整策略" tabindex="-1"><a class="header-anchor" href="#技术债管理-从识别到清偿的完整策略"><span>技术债管理：从识别到清偿的完整策略</span></a></h1><blockquote><p>技术债管理：从识别到清偿的完整策略是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。<br> 本文介绍了技术债管理：从识别到清偿的完整策略的方法论和实践经验，帮助你提升产品思维。</p></blockquote><p><strong>技术债（Technical Debt）</strong> 是一个比喻：为了短期利益（快速交付），而在代码质量或架构上做出的妥协，这种妥协在未来会以更高的维护成本&quot;连本带利&quot;地偿还。</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债的类比：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>金融债          技术债</span></span>
<span class="line"><span>────────────────────────────────</span></span>
<span class="line"><span>借款            为了快速上线，简化设计</span></span>
<span class="line"><span>利息            每次修改都要比正常多花时间</span></span>
<span class="line"><span>利滚利          在坏代码上加新功能，越加越乱</span></span>
<span class="line"><span>破产            系统无法维护，只能重写</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-技术债的来源" tabindex="-1"><a class="header-anchor" href="#_1-2-技术债的来源"><span>1.2 技术债的来源</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债的来源可以分为有意和无意两类：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>一、有意产生（战略性技术债）：</span></span>
<span class="line"><span>1. 业务压力：&quot;先上线再说，后面再优化&quot;</span></span>
<span class="line"><span>2. 资源限制：&quot;只有两个开发，先不做读写分离了&quot;</span></span>
<span class="line"><span>3. 快速验证：&quot;MVP 阶段，用单体架构就够了&quot;</span></span>
<span class="line"><span>4. 知识缺乏：&quot;当时不知道这个框架有更好的写法&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>二、无意产生（积累性技术债）：</span></span>
<span class="line"><span>1. 需求变更：最初设计无法覆盖新场景</span></span>
<span class="line"><span>2. 技术演进：框架升级、Java 8 → 17、Spring Boot 2 → 3</span></span>
<span class="line"><span>3. 人员流动：原开发者离职，新人不理解设计意图</span></span>
<span class="line"><span>4. 信息退化：文档过时、注释失真、知识遗失</span></span>
<span class="line"><span>5. 环境变化：用户量从 1000 增长到 100 万，架构没跟上</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-3-技术债不是绝对的-坏事" tabindex="-1"><a class="header-anchor" href="#_1-3-技术债不是绝对的-坏事"><span>1.3 技术债不是绝对的&quot;坏事&quot;</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>好的技术债 vs 坏的技术债：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>好的技术债（战略性）：</span></span>
<span class="line"><span>  - 有明确的&quot;还款计划&quot;</span></span>
<span class="line"><span>  - 评估过风险，可接受</span></span>
<span class="line"><span>  - 有记录，团队知晓</span></span>
<span class="line"><span>  - 例：&quot;先用单体架构跑通业务，6 个月后拆微服务&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>坏的技术债（失控性）：</span></span>
<span class="line"><span>  - 没有记录，没人知道</span></span>
<span class="line"><span>  - 没有还款计划</span></span>
<span class="line"><span>  - 利息在高涨（每次改动越来越难）</span></span>
<span class="line"><span>  - 例：每个新功能都在往一个上帝类里堆代码</span></span>
<span class="line"><span></span></span>
<span class="line"><span>关键区别：</span></span>
<span class="line"><span>  你记录了吗？有还债计划吗？</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="二、技术债的四种类型" tabindex="-1"><a class="header-anchor" href="#二、技术债的四种类型"><span>二、技术债的四种类型</span></a></h2><h3 id="_2-1-设计债" tabindex="-1"><a class="header-anchor" href="#_2-1-设计债"><span>2.1 设计债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>定义：架构层面的妥协和债务</span></span>
<span class="line"><span></span></span>
<span class="line"><span>表现：</span></span>
<span class="line"><span>  - 模块边界模糊，循环依赖</span></span>
<span class="line"><span>  - 上帝类（一个类 5000+ 行，什么都干）</span></span>
<span class="line"><span>  - 缺少抽象层，业务逻辑和基础设施代码混在一起</span></span>
<span class="line"><span>  - 不合理的模块拆分（要么太大、要么太碎）</span></span>
<span class="line"><span>  - 技术选型与业务场景不匹配</span></span>
<span class="line"><span></span></span>
<span class="line"><span>识别信号：</span></span>
<span class="line"><span>  - &quot;要改一个功能，至少要动 5 个模块&quot;</span></span>
<span class="line"><span>  - &quot;新人入职 3 个月还不能独立开发&quot;</span></span>
<span class="line"><span>  - &quot;每次需求评审都在讨论架构要不要改&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>偿还方式：</span></span>
<span class="line"><span>  - 模块拆分/合并</span></span>
<span class="line"><span>  - 引入抽象层</span></span>
<span class="line"><span>  - 领域驱动设计（DDD）重构</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-代码债" tabindex="-1"><a class="header-anchor" href="#_2-2-代码债"><span>2.2 代码债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>定义：代码层面的质量问题</span></span>
<span class="line"><span></span></span>
<span class="line"><span>表现：</span></span>
<span class="line"><span>  - 魔法数字和硬编码</span></span>
<span class="line"><span>  - 重复代码（Copy-Paste 编程）</span></span>
<span class="line"><span>  - 过长的方法（一个方法 200+ 行）</span></span>
<span class="line"><span>  - 过深的嵌套（if-for-for-if...）</span></span>
<span class="line"><span>  - 命名混乱（temp1, temp2, flag, data）</span></span>
<span class="line"><span>  - 缺少单元测试</span></span>
<span class="line"><span>  - 过度复杂的逻辑（可以 10 行写完，写了 100 行）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>识别信号：</span></span>
<span class="line"><span>  - &quot;这个变量叫 flag，但没人知道它代表什么&quot;</span></span>
<span class="line"><span>  - &quot;这段代码我看了三遍也没看懂&quot;</span></span>
<span class="line"><span>  - &quot;改了一行代码，10 个测试挂了&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>偿还方式：</span></span>
<span class="line"><span>  - 重构（提取方法、重命名、消除重复）</span></span>
<span class="line"><span>  - 补充单元测试</span></span>
<span class="line"><span>  - 静态代码分析工具 + 质量门禁</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-测试债" tabindex="-1"><a class="header-anchor" href="#_2-3-测试债"><span>2.3 测试债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>定义：测试覆盖不足或测试质量低</span></span>
<span class="line"><span></span></span>
<span class="line"><span>表现：</span></span>
<span class="line"><span>  - 核心流程没有自动化测试</span></span>
<span class="line"><span>  - 测试覆盖率 &lt; 30%</span></span>
<span class="line"><span>  - 测试不稳定（flaky tests），时过时不过</span></span>
<span class="line"><span>  - 测试依赖外部环境</span></span>
<span class="line"><span>  - 只有集成测试，没有单元测试</span></span>
<span class="line"><span>  - 测试数据硬编码，换环境就挂</span></span>
<span class="line"><span></span></span>
<span class="line"><span>识别信号：</span></span>
<span class="line"><span>  - &quot;这个功能我不敢上线，因为没测过&quot;</span></span>
<span class="line"><span>  - &quot;CI 又红了，但不是我改的代码导致的&quot;</span></span>
<span class="line"><span>  - &quot;测试跑了 2 小时，然后 1/3 失败了&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>偿还方式：</span></span>
<span class="line"><span>  - 增量补充单元测试</span></span>
<span class="line"><span>  - 修复不稳定的测试</span></span>
<span class="line"><span>  - 引入测试数据工厂</span></span>
<span class="line"><span>  - 分离单元测试和集成测试</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-4-文档债" tabindex="-1"><a class="header-anchor" href="#_2-4-文档债"><span>2.4 文档债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>定义：文档缺失、过时或不准确</span></span>
<span class="line"><span></span></span>
<span class="line"><span>表现：</span></span>
<span class="line"><span>  - 接口文档和实际行为不一致</span></span>
<span class="line"><span>  - 没有架构决策记录（ADR）</span></span>
<span class="line"><span>  - 新人入职文档还是 3 年前的</span></span>
<span class="line"><span>  - 关键业务逻辑没有注释</span></span>
<span class="line"><span>  - 部署文档与实际流程对不上</span></span>
<span class="line"><span></span></span>
<span class="line"><span>识别信号：</span></span>
<span class="line"><span>  - &quot;这个接口的参数是什么意思？看代码吧&quot;</span></span>
<span class="line"><span>  - &quot;新人的第一个需求，花了 3 天在理解系统上&quot;</span></span>
<span class="line"><span>  - &quot;问了一圈，没人知道这个功能为什么这么设计&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>偿还方式：</span></span>
<span class="line"><span>  - 接口文档自动生成（Swagger/OpenAPI）</span></span>
<span class="line"><span>  - 建立 ADR（Architecture Decision Record）制度</span></span>
<span class="line"><span>  - README 驱动开发</span></span>
<span class="line"><span>  - 关键决策必须有记录</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-四种债务的关系" tabindex="-1"><a class="header-anchor" href="#_2-5-四种债务的关系"><span>2.5 四种债务的关系</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债的连锁反应：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>设计债 ──→ 代码债 ──→ 测试债</span></span>
<span class="line"><span>  │           │           │</span></span>
<span class="line"><span>  └───────────┴──→ 文档债 ←┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>设计债导致代码难以组织，产生代码债。</span></span>
<span class="line"><span>代码债导致测试难以编写，产生测试债。</span></span>
<span class="line"><span>三者共同导致文档与现实脱节，产生文档债。</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="三、技术债的识别方法" tabindex="-1"><a class="header-anchor" href="#三、技术债的识别方法"><span>三、技术债的识别方法</span></a></h2><h3 id="_3-1-代码审查" tabindex="-1"><a class="header-anchor" href="#_3-1-代码审查"><span>3.1 代码审查</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>代码审查时的技术债嗅觉：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>□ 这个 PR 改动了超过 10 个文件？</span></span>
<span class="line"><span>  → 可能是模块耦合太紧</span></span>
<span class="line"><span></span></span>
<span class="line"><span>□ 为了加一个字段，改了 8 层代码（Controller → Service → Mapper → ...）？</span></span>
<span class="line"><span>  → 可能是层数过多或缺少抽象</span></span>
<span class="line"><span></span></span>
<span class="line"><span>□ Reviewer 看了 30 分钟还没看懂？</span></span>
<span class="line"><span>  → 代码可读性有问题</span></span>
<span class="line"><span></span></span>
<span class="line"><span>□ 改动的地方有没有对应的测试？</span></span>
<span class="line"><span>  → 如果没有，测试债在增加</span></span>
<span class="line"><span></span></span>
<span class="line"><span>□ 代码中有 &quot;// TODO&quot; 或 &quot;// FIXME&quot;？</span></span>
<span class="line"><span>  → 这些都是已知的技术债</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-静态分析工具" tabindex="-1"><a class="header-anchor" href="#_3-2-静态分析工具"><span>3.2 静态分析工具</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># SonarQube 质量门禁配置</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.qualitygate.wait</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">true</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 关键指标阈值</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.coverage.min</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=80%</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">           # 最低测试覆盖率</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.duplications.max</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=3%</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 最大代码重复率</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.complexity.max</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=15</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # 最大圈复杂度</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.bugs.blocker</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=0</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">             # 阻断级 Bug 必须为 0</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sonar.code_smells.max</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">=1000</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">       # 代码异味上限</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>常用静态分析工具：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Java:    SonarQube, Checkstyle, SpotBugs, PMD</span></span>
<span class="line"><span>Python:  Pylint, Flake8, Bandit, mypy</span></span>
<span class="line"><span>JS/TS:   ESLint, Prettier, SonarJS</span></span>
<span class="line"><span>Go:      golangci-lint, go vet</span></span>
<span class="line"><span>通用:    SonarQube, CodeClimate, Codacy</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-线上问题分析" tabindex="-1"><a class="header-anchor" href="#_3-3-线上问题分析"><span>3.3 线上问题分析</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>从线上问题反推技术债：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>问题类型          → 可能的技术债</span></span>
<span class="line"><span>─────────────────────────────────────</span></span>
<span class="line"><span>频繁的 NullPointer  → 缺少空值检查和防御性编程</span></span>
<span class="line"><span>接口超时频繁       → 查询没走索引 或 未做缓存</span></span>
<span class="line"><span>数据不一致         → 缺少事务管理 或 分布式一致性没处理</span></span>
<span class="line"><span>内存溢出           → 资源未释放 或 缓存策略有问题</span></span>
<span class="line"><span>半夜被报警叫醒     → 缺少降级和熔断机制</span></span>
<span class="line"><span>同样的 Bug 反复出现 → 上次只修了症状，没治根</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-4-开发者体验调查" tabindex="-1"><a class="header-anchor" href="#_3-4-开发者体验调查"><span>3.4 开发者体验调查</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>向团队发放技术债问卷（匿名）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>请打分（1-5，1=强烈不同意，5=强烈同意）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 我能在 30 分钟内理解一个陌生模块的核心逻辑 [  ]</span></span>
<span class="line"><span>2. 添加新功能时，我不需要修改现有代码 [  ]</span></span>
<span class="line"><span>3. 如果需要修改，我知道哪些模块会受影响 [  ]</span></span>
<span class="line"><span>4. 我们的测试足够让我有信心上线 [  ]</span></span>
<span class="line"><span>5. 代码审查通常不需要大改（超过 30 分钟评审） [  ]</span></span>
<span class="line"><span>6. 我知道我们的技术债在哪里，以及何时偿还 [  ]</span></span>
<span class="line"><span>7. 我上班时不会因为代码质量问题感到沮丧 [  ]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>总分 &lt; 20 → 🔴 重度技术债，团队已受影响</span></span>
<span class="line"><span>总分 20-28 → 🟡 中度技术债，需要主动管理</span></span>
<span class="line"><span>总分 29-35 → 🟢 轻度技术债，保持健康</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="四、量化技术债-怎么让老板听懂" tabindex="-1"><a class="header-anchor" href="#四、量化技术债-怎么让老板听懂"><span>四、量化技术债：怎么让老板听懂</span></a></h2><h3 id="_4-1-用业务语言翻译技术债" tabindex="-1"><a class="header-anchor" href="#_4-1-用业务语言翻译技术债"><span>4.1 用业务语言翻译技术债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>老板听不懂的：                        老板听得懂的：</span></span>
<span class="line"><span>───────────────────────────────────────────────────────────</span></span>
<span class="line"><span>&quot;这个模块的圈复杂度太高了&quot;             &quot;这个模块改一个需求要 5 天，</span></span>
<span class="line"><span>                                      正常情况下应该 1 天&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>&quot;我们缺少单元测试覆盖率&quot;               &quot;每次上线有 30% 的几率出问题，</span></span>
<span class="line"><span>                                      需要紧急修复&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>&quot;架构需要重构&quot;                         &quot;新功能开发速度从每周 3 个</span></span>
<span class="line"><span>                                      降到每月 2 个了&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>&quot;数据库查询没有走索引&quot;                 &quot;用户打开页面要等 8 秒，</span></span>
<span class="line"><span>                                      可能有 20% 的用户直接关掉了&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-计算技术债的-利息" tabindex="-1"><a class="header-anchor" href="#_4-2-计算技术债的-利息"><span>4.2 计算技术债的&quot;利息&quot;</span></a></h3><div class="language-python line-numbers-mode" data-highlighter="shiki" data-ext="python" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-python"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 技术债利息计算模型</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">class</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> TechnicalDebtCalculator</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">    &quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">    技术债成本 = 额外开发时间 + 额外Bug修复时间 + 新人学习成本</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">    &quot;&quot;&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    def</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> calculate_interest_rate</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#D19A66;--shiki-dark-font-style:italic;"> module</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        计算技术债的&quot;年化利率&quot;：</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        正常情况下开发 X 功能需要 Y 天</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        当前需要 Y * (1 + rate) 天</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 正常开发时间（无技术债的理想情况）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        ideal_time </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">estimate_ideal_time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(module)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 实际开发时间（加上应对技术债的时间）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        actual_time </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">measure_actual_time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(module)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 利息率</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        interest_rate </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> (actual_time </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> ideal_time) </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">/</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> ideal_time</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        return</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> interest_rate</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    def</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> estimate_ideal_time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#D19A66;--shiki-dark-font-style:italic;"> module</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;理想开发时间估算&quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 基于复杂度（功能点数、接口数、表数量）估算</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        complexity_score </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> (</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            module.api_count </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">*</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0.5</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> +</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            module.table_count </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">*</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1.0</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> +</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            module.business_rule_count </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">*</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0.3</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        )</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 以人天为单位</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        return</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> complexity_score </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">*</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    def</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> measure_actual_time</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#D19A66;--shiki-dark-font-style:italic;"> module</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;实际开发时间：从 Git 日志统计&quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 统计最近 3 个月该模块相关的 commit 时间</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        recent_commits </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_commits_for_module</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(module, </span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E06C75;--shiki-dark-font-style:italic;">months</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">3</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        total_hours </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> sum</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(c.development_hours </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">for</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> c </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">in</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> recent_commits)</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        return</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> total_hours </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">/</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 8</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 转为人天</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    def</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> generate_report</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;生成技术债报告（给老板看的版本）&quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        modules </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_all_modules</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">()</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        report </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> []</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        total_extra_cost </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        for</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> m </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">in</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> modules:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            rate </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">calculate_interest_rate</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(m)</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            monthly_cost </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">estimate_monthly_extra_cost</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(m, rate)</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            if</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> rate </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0.2</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 技术债利息 &gt; 20%</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">                report.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">append</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">({</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                    &#39;module&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: m.name,</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                    &#39;interest_rate&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">rate</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.0%</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                    &#39;monthly_waste&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">monthly_cost</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.1f</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 人天/月&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                    &#39;impact&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;🔴 高&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">                })</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">                total_extra_cost </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">+=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> monthly_cost</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # 最终结论（老板最关心的）</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">        print</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;技术债月利息：</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">total_extra_cost</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.1f</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 人天&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">        print</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;相当于 </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">total_extra_cost </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">/</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 22</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.1f</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 个全职开发每月在还债&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">        print</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;年度浪费：约 </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">total_extra_cost </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">*</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 12</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> *</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2000</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.0f</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 元人力成本&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">        # ↑ 假设每人天成本 2000 元</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-3-可视化技术债" tabindex="-1"><a class="header-anchor" href="#_4-3-可视化技术债"><span>4.3 可视化技术债</span></a></h3><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-sql"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- 按模块统计技术债热力图数据</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">SELECT</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    module_name,</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">    AVG</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(cyclomatic_complexity) </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">AS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> avg_complexity,</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">    SUM</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">CASE</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> WHEN</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> test_coverage </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">5</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> THEN</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> ELSE</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> END</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">AS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> low_coverage_files,</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">    COUNT</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">DISTINCT</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> bug_id) </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">AS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> recent_bug_count,</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">    MAX</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(last_refactor_date) </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">AS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> last_refactor,</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    -- 综合债务评分</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    (</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">AVG</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(cyclomatic_complexity) / </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">15</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> * </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">30</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> +</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">     SUM</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">CASE</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> WHEN</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> test_coverage </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&lt;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">5</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> THEN</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> ELSE</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 0</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> END</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) * </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">2</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">5</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> +</span></span>
<span class="line"><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;">     COUNT</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">DISTINCT</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> bug_id) * </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">5</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">AS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> debt_score</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">FROM</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> module_metrics</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">WHERE</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> measure_date </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> DATE_SUB(CURRENT_DATE, INTERVAL </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">90</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> DAY</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">GROUP BY</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> module_name</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">ORDER BY</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> debt_score </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">DESC</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="五、清偿策略" tabindex="-1"><a class="header-anchor" href="#五、清偿策略"><span>五、清偿策略</span></a></h2><h3 id="_5-1-童子军原则-每次提交都比之前干净一点" tabindex="-1"><a class="header-anchor" href="#_5-1-童子军原则-每次提交都比之前干净一点"><span>5.1 童子军原则：每次提交都比之前干净一点</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>童子军原则（Boy Scout Rule）：</span></span>
<span class="line"><span>  &quot;离开营地时，让它比你刚来的时候更干净。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>技术版：</span></span>
<span class="line"><span>  &quot;每次提交代码时，让代码比你签出时更好一点。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>实际操作：</span></span>
<span class="line"><span>  - 修 Bug 时，顺手把相关代码的命名改清楚</span></span>
<span class="line"><span>  - 加功能时，顺手把重复代码提取成方法</span></span>
<span class="line"><span>  - 读代码时，如果发现过时的注释，删除或更新</span></span>
<span class="line"><span>  - Code Review 时，顺便看能否简化逻辑</span></span>
<span class="line"><span></span></span>
<span class="line"><span>好处：</span></span>
<span class="line"><span>  - 不需要额外排期，&quot;顺带手&quot;还债</span></span>
<span class="line"><span>  - 避免&quot;专门还债&quot;带来的&quot;没有业务产出&quot;的质疑</span></span>
<span class="line"><span>  - 积少成多，质量曲线稳步上升而不是忽高忽低</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-技术债冲刺-专项还债" tabindex="-1"><a class="header-anchor" href="#_5-2-技术债冲刺-专项还债"><span>5.2 技术债冲刺：专项还债</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债冲刺的节奏：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>建议频率：</span></span>
<span class="line"><span>  - 每季度安排 1 周作为&quot;还债周&quot;</span></span>
<span class="line"><span>  - 或每个迭代留出 20% 容量</span></span>
<span class="line"><span></span></span>
<span class="line"><span>还债周做什么：</span></span>
<span class="line"><span>  1. 团队投票选出最痛的 3 个技术债</span></span>
<span class="line"><span>  2. 针对每个债制定修复方案</span></span>
<span class="line"><span>  3. 集中一周修复</span></span>
<span class="line"><span>  4. 周五演示：&quot;修复前三件事的对比&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>案例：</span></span>
<span class="line"><span>  某团队每季度安排 5 天技术债冲刺：</span></span>
<span class="line"><span>  - 第 1 季度：统一了所有服务的日志格式，修复了 15 个 flaky tests</span></span>
<span class="line"><span>  - 第 2 季度：把 3 个上帝类拆分成职责清晰的 12 个小类</span></span>
<span class="line"><span>  - 第 3 季度：将 SQL 查询中的 N+1 问题全部修复</span></span>
<span class="line"><span>  - 第 4 季度：升级了 Spring Boot 版本，消除了 200+ 废弃 API 警告</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-3-跟业务需求捆绑" tabindex="-1"><a class="header-anchor" href="#_5-3-跟业务需求捆绑"><span>5.3 跟业务需求捆绑</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>策略：把还债打包进业务需求</span></span>
<span class="line"><span></span></span>
<span class="line"><span>❌ 单独提一个&quot;重构 XX 模块&quot;的需求</span></span>
<span class="line"><span>  → 产品：&quot;重构有什么用？用户感知不到。先做新功能。&quot;</span></span>
<span class="line"><span>  → 永远排不上优先级</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ 把重构作为新功能的一部分</span></span>
<span class="line"><span>  → &quot;这个新功能需要修改 XX 模块，但当前代码难以扩展。</span></span>
<span class="line"><span>     我计划用 2 天做新功能，1 天做必要的重构。&quot;</span></span>
<span class="line"><span>  → 产品接受了，因为重构是为了交付新功能</span></span>
<span class="line"><span></span></span>
<span class="line"><span>实施技巧：</span></span>
<span class="line"><span>  1. 评估新需求的改动范围</span></span>
<span class="line"><span>  2. 如果涉及的技术债阻碍了新需求开发 → 优先处理</span></span>
<span class="line"><span>  3. 如果不涉及 → 先放着，等&quot;碰上了&quot;再说</span></span>
<span class="line"><span>  4. 重构的范围要控制：只做必要的重构，不过度</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-4-技术债看板管理" tabindex="-1"><a class="header-anchor" href="#_5-4-技术债看板管理"><span>5.4 技术债看板管理</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债看板（Kanban）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>列：已识别 → 待评估 → 待修复 → 修复中 → 已完成</span></span>
<span class="line"><span></span></span>
<span class="line"><span>每张卡片包含：</span></span>
<span class="line"><span>  ┌─────────────────────────────┐</span></span>
<span class="line"><span>  │ 🔴 技术债 #TD-042           │</span></span>
<span class="line"><span>  │                             │</span></span>
<span class="line"><span>  │ 标题：订单服务 SQL N+1 问题  │</span></span>
<span class="line"><span>  │ 类型：代码债                 │</span></span>
<span class="line"><span>  │ 影响范围：订单查询、列表接口  │</span></span>
<span class="line"><span>  │ 严重程度：高（影响 70% 查询）│</span></span>
<span class="line"><span>  │ 修复成本：3 人天              │</span></span>
<span class="line"><span>  │ 利息：每次查询多查 50+ 次 DB │</span></span>
<span class="line"><span>  │ 发现时间：2026-03-15        │</span></span>
<span class="line"><span>  │ 负责人：张三                 │</span></span>
<span class="line"><span>  │ 计划修复：2026-Q2 还债周    │</span></span>
<span class="line"><span>  └─────────────────────────────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-5-四种清偿策略对比" tabindex="-1"><a class="header-anchor" href="#_5-5-四种清偿策略对比"><span>5.5 四种清偿策略对比</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>┌──────────┬──────────┬──────────┬──────────┐</span></span>
<span class="line"><span>│ 策略      │ 童子军   │ 冲刺     │ 捆绑     │ 看板     │</span></span>
<span class="line"><span>├──────────┼──────────┼──────────┼──────────┤</span></span>
<span class="line"><span>│ 节奏      │ 持续     │ 周期性   │ 事件驱动 │ 持续     │</span></span>
<span class="line"><span>│ 成本      │ 低       │ 中       │ 中       │ 低       │</span></span>
<span class="line"><span>│ 可见性    │ 低       │ 高       │ 中       │ 高       │</span></span>
<span class="line"><span>│ 适合债务  │ 小债务   │ 大债务   │ 相关债务 │ 所有债务  │</span></span>
<span class="line"><span>│ 需要排期  │ 不需要   │ 需要     │ 部分需要 │ 不需要    │</span></span>
<span class="line"><span>│ 业务感知  │ 无       │ 高       │ 低       │ 低       │</span></span>
<span class="line"><span>└──────────┴──────────┴──────────┴──────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>最佳实践：四种策略组合使用</span></span>
<span class="line"><span>  - 日常开发用&quot;童子军原则&quot;</span></span>
<span class="line"><span>  - 每季度用&quot;技术债冲刺&quot;集中处理大债</span></span>
<span class="line"><span>  - 功能开发遇到阻碍用&quot;捆绑策略&quot;</span></span>
<span class="line"><span>  - 用&quot;看板&quot;保持对技术债的全局可见性</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="六、如何推动团队重视技术债" tabindex="-1"><a class="header-anchor" href="#六、如何推动团队重视技术债"><span>六、如何推动团队重视技术债</span></a></h2><h3 id="_6-1-建立-还债文化" tabindex="-1"><a class="header-anchor" href="#_6-1-建立-还债文化"><span>6.1 建立&quot;还债文化&quot;</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>推动技术债文化的五个步骤：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第一步：让团队&quot;看见&quot;技术债</span></span>
<span class="line"><span>  - 在回顾会议上展示技术债热力图</span></span>
<span class="line"><span>  - 让每个人匿名投票选出最痛苦的 3 个技术债</span></span>
<span class="line"><span>  - 把技术债可视化（看板、仪表盘）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第二步：让技术债有&quot;代价感&quot;</span></span>
<span class="line"><span>  - 统计因技术债导致的 Bug 数量</span></span>
<span class="line"><span>  - 统计因技术债增加的开发时间</span></span>
<span class="line"><span>  - 分享&quot;如果早还债，这个事故就不会发生&quot;的案例</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第三步：为还债创造空间</span></span>
<span class="line"><span>  - 在迭代计划中预留还债容量（10-20%）</span></span>
<span class="line"><span>  - Tech Lead 保护还债时间，不被业务需求挤占</span></span>
<span class="line"><span>  - 把还债纳入 OKR 或绩效考核</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第四步：庆祝还债成果</span></span>
<span class="line"><span>  - 还债完成后，在团队会议展示 &quot;Before vs After&quot;</span></span>
<span class="line"><span>  - 分享性能提升数据、代码简化数据</span></span>
<span class="line"><span>  - 不要只庆祝新功能上线，也要庆祝质量提升</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第五步：把还债变成习惯</span></span>
<span class="line"><span>  - Code Review 时检查&quot;是否顺手还债&quot;</span></span>
<span class="line"><span>  - 新人入职培训中加入&quot;技术债意识&quot;</span></span>
<span class="line"><span>  - 让还债成为&quot;完成&quot;定义的一部分（Definition of Done）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-2-技术债的沟通话术" tabindex="-1"><a class="header-anchor" href="#_6-2-技术债的沟通话术"><span>6.2 技术债的沟通话术</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>跟不同角色沟通技术债：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>对产品经理：</span></span>
<span class="line"><span>  ❌ &quot;我们需要重构，下个迭代不做功能了&quot;</span></span>
<span class="line"><span>  ✅ &quot;订单模块现在的技术基础不太稳固。如果我们花 3 天加固，</span></span>
<span class="line"><span>      下一个需求可以从 5 天缩短到 2 天。相当于这次多花 3 天，</span></span>
<span class="line"><span>      以后每次需求都省 3 天。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>对老板/领导：</span></span>
<span class="line"><span>  ❌ &quot;代码质量太差了，需要还技术债&quot;</span></span>
<span class="line"><span>  ✅ &quot;我们的开发速度从 Q1 的每迭代 8 个需求，降到 Q2 的 5 个。</span></span>
<span class="line"><span>      主要原因是订单模块的维护成本在上升。我建议：Q3 投入 2 周加固，</span></span>
<span class="line"><span>      预计 Q4 恢复到每迭代 7-8 个需求的交付速度。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>对团队成员：</span></span>
<span class="line"><span>  ❌ &quot;你们的代码写得不行，要重构&quot;</span></span>
<span class="line"><span>  ✅ &quot;这个模块现在每次改动都要花 3 天，正常应该 1 天。</span></span>
<span class="line"><span>      我们一起来分析一下原因，看怎么改进。</span></span>
<span class="line"><span>      以后写好代码也是帮未来的自己节省时间。&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-3-制定技术债策略" tabindex="-1"><a class="header-anchor" href="#_6-3-制定技术债策略"><span>6.3 制定技术债策略</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术债策略决策矩阵：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>           │ 改动频率低       │ 改动频率高</span></span>
<span class="line"><span>───────────┼─────────────────┼─────────────────</span></span>
<span class="line"><span>风险低     │ 先不管            │ 童子军原则逐步还</span></span>
<span class="line"><span>           │ 改的时候再说      │</span></span>
<span class="line"><span>───────────┼─────────────────┼─────────────────</span></span>
<span class="line"><span>风险高     │ 排到还债队列       │ 立即修复！</span></span>
<span class="line"><span>           │ 选个时间集中还     │ 最高优先级</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="七、总结" tabindex="-1"><a class="header-anchor" href="#七、总结"><span>七、总结</span></a></h2><h3 id="_7-1-核心要点" tabindex="-1"><a class="header-anchor" href="#_7-1-核心要点"><span>7.1 核心要点</span></a></h3><table><thead><tr><th>要点</th><th>说明</th></tr></thead><tbody><tr><td>技术债不是恶魔</td><td>战略性的技术债可以接受，关键是&quot;有记录、有计划&quot;</td></tr><tr><td>识别 &gt; 量化 &gt; 清偿</td><td>先摸清债务在哪，再算清楚利息，最后有计划地还</td></tr><tr><td>不要企图一次性还清</td><td>技术债是持续运营，像健身一样，贵在坚持</td></tr><tr><td>用业务语言沟通</td><td>老板不关心圈复杂度，关心开发速度快不快</td></tr><tr><td>预防优于治理</td><td>Code Review 和静态分析是防止新债务的第一道防线</td></tr></tbody></table><h3 id="_7-2-行动计划" tabindex="-1"><a class="header-anchor" href="#_7-2-行动计划"><span>7.2 行动计划</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>接下来 30 天，你可以做这些事：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第 1 周：</span></span>
<span class="line"><span>  □ 在团队内发起技术债匿名问卷</span></span>
<span class="line"><span>  □ 运行一次 SonarQube 全量扫描</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第 2 周：</span></span>
<span class="line"><span>  □ 建立技术债看板（物理白板或 Jira）</span></span>
<span class="line"><span>  □ 把 TOP 10 技术债贴上去</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第 3 周：</span></span>
<span class="line"><span>  □ 争取在下个迭代预留 10% 还债容量</span></span>
<span class="line"><span>  □ 制定 Q3 还债冲刺计划</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第 4 周：</span></span>
<span class="line"><span>  □ 进行第一次&quot;还债+新功能&quot;捆绑开发</span></span>
<span class="line"><span>  □ 在团队会议分享成果</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-3-一句话总结" tabindex="-1"><a class="header-anchor" href="#_7-3-一句话总结"><span>7.3 一句话总结</span></a></h3><blockquote><p>技术债就像房间里的灰尘——不会因为你假装看不见就消失。它每天都在积累，唯一的区别是：你选择今天花 10 分钟擦一下，还是三个月后花一整天做大扫除。</p></blockquote>`,61)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};