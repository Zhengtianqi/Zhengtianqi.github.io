import{n as e,o as t,r as n}from"./app-CAHnBWOD.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E6%96%B9%E6%A1%88%E6%80%8E%E4%B9%88%E5%86%99%E6%89%8D%E8%83%BD%E8%AE%A9%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E7%9C%8B%E6%87%82.html","title":"技术方案怎么写才能让产品经理看懂","lang":"zh-CN","frontmatter":{"title":"技术方案怎么写才能让产品经理看懂","tag":["项目管理"],"date":"2026-06-12T00:00:00.000Z","category":"产品与协作","description":"技术方案怎么写才能让产品经理看懂 技术方案怎么写才能让产品经理看懂是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。 本文介绍了技术方案怎么写才能让产品经理看懂的方法论和实践经验，帮助你提升产品思维。 1.2 PM 真正关心什么 二、技术方案的产品化表达技巧 2.1 核心技术：翻译 2.2 一句话原则 2.3 分层表达 三、架构图：画到什么...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"技术方案怎么写才能让产品经理看懂\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-06-12T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%8A%80%E6%9C%AF%E6%96%B9%E6%A1%88%E6%80%8E%E4%B9%88%E5%86%99%E6%89%8D%E8%83%BD%E8%AE%A9%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E7%9C%8B%E6%87%82.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"技术方案怎么写才能让产品经理看懂"}],["meta",{"property":"og:description","content":"技术方案怎么写才能让产品经理看懂 技术方案怎么写才能让产品经理看懂是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。 本文介绍了技术方案怎么写才能让产品经理看懂的方法论和实践经验，帮助你提升产品思维。 1.2 PM 真正关心什么 二、技术方案的产品化表达技巧 2.1 核心技术：翻译 2.2 一句话原则 2.3 分层表达 三、架构图：画到什么..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"项目管理"}],["meta",{"property":"article:published_time","content":"2026-06-12T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1781224443000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":2,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":11.54,"words":3461},"filePathRelative":"posts/产品与协作/技术方案怎么写才能让产品经理看懂.md","excerpt":"\\n<blockquote>\\n<p>技术方案怎么写才能让产品经理看懂是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。<br>\\n本文介绍了技术方案怎么写才能让产品经理看懂的方法论和实践经验，帮助你提升产品思维。</p>\\n</blockquote>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>PM 看不懂技术方案的五个原因：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>1. 术语轰炸</span></span>\\n<span class=\\"line\\"><span>   \\"我们采用 CQRS 架构，写操作走 Command Bus，</span></span>\\n<span class=\\"line\\"><span>    读操作走 Query Bus，通过 Event Store 实现事件溯源。\\"</span></span>\\n<span class=\\"line\\"><span>   </span></span>\\n<span class=\\"line\\"><span>   PM 内心：CQRS 是什么？Bus？公交车？</span></span>\\n<span class=\\"line\\"><span>   </span></span>\\n<span class=\\"line\\"><span>2. 过早陷入技术细节</span></span>\\n<span class=\\"line\\"><span>   开口就是\\"我们选了 Redis Cluster 7.0 作为缓存，</span></span>\\n<span class=\\"line\\"><span>   RDB 持久化策略，内存淘汰策略用 allkeys-lru...\\"</span></span>\\n<span class=\\"line\\"><span>   </span></span>\\n<span class=\\"line\\"><span>   PM 内心：我只想知道这个功能能不能做，多久能做完。</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>3. 没有翻译\\"技术影响\\"为\\"业务影响\\"</span></span>\\n<span class=\\"line\\"><span>   \\"这个方案的延时是 P99 500ms\\"</span></span>\\n<span class=\\"line\\"><span>   </span></span>\\n<span class=\\"line\\"><span>   PM 内心：500ms 是什么意思？快还是慢？对用户有什么影响？</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>4. 流程图太技术化</span></span>\\n<span class=\\"line\\"><span>   画的是\\"微服务之间 RPC 调用的链路\\"，而不是\\"用户操作流程\\"</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>5. 篇幅太长，抓不住重点</span></span>\\n<span class=\\"line\\"><span>   20 页方案，PM 需要的核心信息可能只有 3 句话</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`技术方案怎么写才能让产品经理看懂.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="技术方案怎么写才能让产品经理看懂" tabindex="-1"><a class="header-anchor" href="#技术方案怎么写才能让产品经理看懂"><span>技术方案怎么写才能让产品经理看懂</span></a></h1><blockquote><p>技术方案怎么写才能让产品经理看懂是连接用户需求和技术实现的桥梁，它决定了产品的价值和用户体验。<br> 本文介绍了技术方案怎么写才能让产品经理看懂的方法论和实践经验，帮助你提升产品思维。</p></blockquote><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>PM 看不懂技术方案的五个原因：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 术语轰炸</span></span>
<span class="line"><span>   &quot;我们采用 CQRS 架构，写操作走 Command Bus，</span></span>
<span class="line"><span>    读操作走 Query Bus，通过 Event Store 实现事件溯源。&quot;</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   PM 内心：CQRS 是什么？Bus？公交车？</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>2. 过早陷入技术细节</span></span>
<span class="line"><span>   开口就是&quot;我们选了 Redis Cluster 7.0 作为缓存，</span></span>
<span class="line"><span>   RDB 持久化策略，内存淘汰策略用 allkeys-lru...&quot;</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   PM 内心：我只想知道这个功能能不能做，多久能做完。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. 没有翻译&quot;技术影响&quot;为&quot;业务影响&quot;</span></span>
<span class="line"><span>   &quot;这个方案的延时是 P99 500ms&quot;</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   PM 内心：500ms 是什么意思？快还是慢？对用户有什么影响？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. 流程图太技术化</span></span>
<span class="line"><span>   画的是&quot;微服务之间 RPC 调用的链路&quot;，而不是&quot;用户操作流程&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5. 篇幅太长，抓不住重点</span></span>
<span class="line"><span>   20 页方案，PM 需要的核心信息可能只有 3 句话</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-pm-真正关心什么" tabindex="-1"><a class="header-anchor" href="#_1-2-pm-真正关心什么"><span>1.2 PM 真正关心什么</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>PM 看技术方案时，ta 想知道的是：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>优先级 1（必须知道）：</span></span>
<span class="line"><span>  ✅ 这个需求能做吗？</span></span>
<span class="line"><span>  ✅ 什么时候能上线？</span></span>
<span class="line"><span>  ✅ 有没有风险可能导致延期？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>优先级 2（最好知道）：</span></span>
<span class="line"><span>  ✅ 技术方案对用户体验有什么影响？</span></span>
<span class="line"><span>  ✅ 有没有 PM 需要做的决策？</span></span>
<span class="line"><span>  ✅ 分阶段上线的话，每个阶段能交付什么？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>优先级 3（可以后续了解）：</span></span>
<span class="line"><span>  ○ 具体用了什么技术？</span></span>
<span class="line"><span>  ○ 数据库怎么设计的？</span></span>
<span class="line"><span>  ○ 架构是怎样的？有什么理由？</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="二、技术方案的产品化表达技巧" tabindex="-1"><a class="header-anchor" href="#二、技术方案的产品化表达技巧"><span>二、技术方案的产品化表达技巧</span></a></h2><h3 id="_2-1-核心技术-翻译" tabindex="-1"><a class="header-anchor" href="#_2-1-核心技术-翻译"><span>2.1 核心技术：翻译</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术语言 → 产品语言的翻译词典：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>技术语言                         产品语言</span></span>
<span class="line"><span>─────────────────────────────────────────────────</span></span>
<span class="line"><span>&quot;数据库读写分离&quot;                 &quot;用户查询速度快 40%&quot;</span></span>
<span class="line"><span>&quot;引入消息队列异步处理&quot;           &quot;用户点击后不用等，后台处理完了通知你&quot;</span></span>
<span class="line"><span>&quot;缓存预热&quot;                       &quot;第一次打开也不会慢&quot;</span></span>
<span class="line"><span>&quot;灰度发布&quot;                       &quot;先让小部分用户试用，没问题再全量&quot;</span></span>
<span class="line"><span>&quot;降级策略&quot;                       &quot;系统忙的时候，核心功能正常用，</span></span>
<span class="line"><span>                                 非核心功能暂时停用&quot;</span></span>
<span class="line"><span>&quot;数据迁移&quot;                       &quot;把老数据搬到新系统里&quot;</span></span>
<span class="line"><span>&quot;幂等性&quot;                         &quot;重复操作不会产生重复结果&quot;</span></span>
<span class="line"><span>&quot;最终一致性&quot;                     &quot;数据会在几秒内同步完成&quot;</span></span>
<span class="line"><span>&quot;微服务&quot;                         &quot;把大系统拆成小模块，各自独立&quot;</span></span>
<span class="line"><span>&quot;熔断&quot;                           &quot;某个功能出问题了，自动关闭防止影响全局&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-一句话原则" tabindex="-1"><a class="header-anchor" href="#_2-2-一句话原则"><span>2.2 一句话原则</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>每个技术决策，都加上一句话的产品影响说明：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>❌ &quot;我们决定使用 MySQL 读写分离 + Redis 缓存&quot;</span></span>
<span class="line"><span>✅ &quot;我们决定使用 MySQL 读写分离 + Redis 缓存。</span></span>
<span class="line"><span>    **对用户的影响**：列表页加载速度从 3 秒降到 0.5 秒。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>❌ &quot;异常流程走消息队列重试，最多重试 3 次&quot;</span></span>
<span class="line"><span>✅ &quot;异常流程走消息队列重试，最多重试 3 次。</span></span>
<span class="line"><span>    **对用户的影响**：网络波动导致的操作失败会自动重试 3 次，</span></span>
<span class="line"><span>    用户只需等待几秒，不需要手动重新操作。&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>❌ &quot;使用 Elasticsearch 作为搜索引擎&quot;</span></span>
<span class="line"><span>✅ &quot;使用 Elasticsearch 作为搜索引擎。</span></span>
<span class="line"><span>    **对用户的影响**：搜索结果从&#39;只能精确匹配&#39;变成</span></span>
<span class="line"><span>    &#39;支持模糊搜索、拼音搜索、同义词搜索&#39;。&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-分层表达" tabindex="-1"><a class="header-anchor" href="#_2-3-分层表达"><span>2.3 分层表达</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术方案的结构：从&quot;产品视图&quot;到&quot;技术视图&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第一层：产品视图（给 PM 和业务方看）</span></span>
<span class="line"><span>  - 一句话总结：这个方案要做什么</span></span>
<span class="line"><span>  - 用户体验变化：用户会感受到什么变化</span></span>
<span class="line"><span>  - 时间线：什么时候能体验</span></span>
<span class="line"><span>  - 风险：可能出现什么问题，影响什么</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第二层：业务视图（给 Tech Lead / 架构师看）</span></span>
<span class="line"><span>  - 技术选型理由</span></span>
<span class="line"><span>  - 架构变化点</span></span>
<span class="line"><span>  - 数据流变化</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第三层：技术视图（给开发团队看）</span></span>
<span class="line"><span>  - 详细接口设计</span></span>
<span class="line"><span>  - 数据模型设计</span></span>
<span class="line"><span>  - 实现方案细节</span></span>
<span class="line"><span>  - 测试策略</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="三、架构图-画到什么粒度让-pm-看懂" tabindex="-1"><a class="header-anchor" href="#三、架构图-画到什么粒度让-pm-看懂"><span>三、架构图：画到什么粒度让 PM 看懂</span></a></h2><h3 id="_3-1-给-pm-的架构图原则" tabindex="-1"><a class="header-anchor" href="#_3-1-给-pm-的架构图原则"><span>3.1 给 PM 的架构图原则</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>给 PM 看的架构图 vs 给 RD 看的架构图：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>PM 版本（业务架构图）：</span></span>
<span class="line"><span>  - 去掉所有技术组件（Redis、MQ、Nacos）</span></span>
<span class="line"><span>  - 用&quot;业务模块&quot;代替&quot;微服务&quot;</span></span>
<span class="line"><span>  - 标注数据和操作的流向</span></span>
<span class="line"><span>  - 用业务语言描述每一步</span></span>
<span class="line"><span></span></span>
<span class="line"><span>RD 版本（技术架构图）：</span></span>
<span class="line"><span>  - 画出所有技术组件</span></span>
<span class="line"><span>  - 标注协议和通信方式</span></span>
<span class="line"><span>  - 标注数据存储方案</span></span>
<span class="line"><span>  - 标注依赖关系</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-示例对比" tabindex="-1"><a class="header-anchor" href="#_3-2-示例对比"><span>3.2 示例对比</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术版架构图（RD 看懂，PM 看不懂）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>┌──────┐  HTTP  ┌─────────┐  RPC  ┌────────┐</span></span>
<span class="line"><span>│ NGINX├────────┤Gateway  ├───────┤Order   │</span></span>
<span class="line"><span>└──────┘        └────┬─────┘       │Service │</span></span>
<span class="line"><span>                     │              └───┬────┘</span></span>
<span class="line"><span>                ┌────▼─────┐           │</span></span>
<span class="line"><span>                │Nacos     │     ┌─────▼────┐</span></span>
<span class="line"><span>                │注册中心   │     │MySQL     │</span></span>
<span class="line"><span>                └──────────┘     │主从集群  │</span></span>
<span class="line"><span>                                 └──────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>产品版架构图（PM 能看懂）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>用户操作流程：</span></span>
<span class="line"><span>  用户打开 App</span></span>
<span class="line"><span>     │</span></span>
<span class="line"><span>     ▼</span></span>
<span class="line"><span>  下单页面</span></span>
<span class="line"><span>     │ 用户点&quot;提交订单&quot;</span></span>
<span class="line"><span>     ▼</span></span>
<span class="line"><span>  系统检查库存 ──── 有货 → 锁定库存 → 生成订单 → 显示&quot;下单成功&quot;</span></span>
<span class="line"><span>     │                                     │</span></span>
<span class="line"><span>     └──── 无货 → 显示&quot;库存不足&quot;            │</span></span>
<span class="line"><span>                                           │</span></span>
<span class="line"><span>                    用户收到推送通知：       │</span></span>
<span class="line"><span>                    &quot;您的订单已生成&quot; ◄───────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-用-场景流程-代替-技术流程" tabindex="-1"><a class="header-anchor" href="#_3-3-用-场景流程-代替-技术流程"><span>3.3 用&quot;场景流程&quot;代替&quot;技术流程&quot;</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术流程（PM 看不懂）：</span></span>
<span class="line"><span>  Client → BFF → OrderService.createOrder()</span></span>
<span class="line"><span>  → InventoryService.checkStock()</span></span>
<span class="line"><span>  → PaymentService.createPayment()</span></span>
<span class="line"><span>  → MQ.publish(OrderCreatedEvent)</span></span>
<span class="line"><span>  → NotificationService.sendPush()</span></span>
<span class="line"><span></span></span>
<span class="line"><span>产品流程（PM 能看懂）：</span></span>
<span class="line"><span>  用户点击&quot;下单&quot; →</span></span>
<span class="line"><span>  系统检查库存 →</span></span>
<span class="line"><span>  ├── 库存充足：进入支付页 →</span></span>
<span class="line"><span>  │   用户完成支付 →</span></span>
<span class="line"><span>  │   系统生成订单号 →</span></span>
<span class="line"><span>  │   用户收到推送&quot;订单已生成&quot; →</span></span>
<span class="line"><span>  │   商家后台显示新订单</span></span>
<span class="line"><span>  └── 库存不足：提示&quot;该商品已售罄&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="四、用业务语言翻译技术概念" tabindex="-1"><a class="header-anchor" href="#四、用业务语言翻译技术概念"><span>四、用业务语言翻译技术概念</span></a></h2><h3 id="_4-1-常见技术概念的业务翻译" tabindex="-1"><a class="header-anchor" href="#_4-1-常见技术概念的业务翻译"><span>4.1 常见技术概念的业务翻译</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>性能相关：</span></span>
<span class="line"><span>&quot;QPS 500&quot; → &quot;每秒能处理 500 个用户请求&quot;</span></span>
<span class="line"><span>&quot;P99 延迟 200ms&quot; → &quot;99% 的用户操作在 0.2 秒内得到响应&quot;</span></span>
<span class="line"><span>&quot;吞吐量 1000/s&quot; → &quot;每秒能处理 1000 笔订单&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>可靠性相关：</span></span>
<span class="line"><span>&quot;3 个 9 的可用性&quot; → &quot;一年内不可用时间不超过 8.8 小时&quot;</span></span>
<span class="line"><span>&quot;主从切换&quot; → &quot;一台服务器挂了，备用的自动顶上&quot;</span></span>
<span class="line"><span>&quot;异地多活&quot; → &quot;即使一个城市的数据中心出问题，服务也不受影响&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>扩展性相关：</span></span>
<span class="line"><span>&quot;水平扩展&quot; → &quot;用户量涨了，多加几台服务器就行&quot;</span></span>
<span class="line"><span>&quot;分库分表&quot; → &quot;数据量增长 10 倍，性能不降&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-技术决策的业务影响" tabindex="-1"><a class="header-anchor" href="#_4-2-技术决策的业务影响"><span>4.2 技术决策的业务影响</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>每个技术决策，都翻译成对 PM 有意义的语言：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>技术决策：使用异步处理代替同步处理</span></span>
<span class="line"><span>技术语言：引入 RocketMQ，订单创建成功后发送消息，异步扣减库存</span></span>
<span class="line"><span>产品语言：</span></span>
<span class="line"><span>  ✅ 用户体验：用户提交订单后立刻显示&quot;已提交&quot;，不需要等待库存扣减完成</span></span>
<span class="line"><span>  ⚠️ 需要注意：极少数情况下，库存扣减失败时用户会收到&quot;订单取消&quot;通知</span></span>
<span class="line"><span>  📊 数据：从点击提交到收到反馈，时间从 3 秒降到 0.3 秒</span></span>
<span class="line"><span></span></span>
<span class="line"><span>技术决策：引入缓存</span></span>
<span class="line"><span>技术语言：使用 Redis 缓存热门商品数据，TTL 10 分钟</span></span>
<span class="line"><span>产品语言：</span></span>
<span class="line"><span>  ✅ 用户体验：热门商品页面秒开（&lt; 100ms）</span></span>
<span class="line"><span>  ⚠️ 需要注意：商品信息修改后，最多 10 分钟才会在页面上更新</span></span>
<span class="line"><span>  📊 数据：列表页加载速度提升 10 倍</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="五、技术方案中的-业务影响分析" tabindex="-1"><a class="header-anchor" href="#五、技术方案中的-业务影响分析"><span>五、技术方案中的&quot;业务影响分析&quot;</span></a></h2><h3 id="_5-1-业务影响分析模板" tabindex="-1"><a class="header-anchor" href="#_5-1-业务影响分析模板"><span>5.1 业务影响分析模板</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 业务影响分析</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 用户体验变化</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 环节 | 改前 | 改后 | 变化 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">|------|------|------|------|</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 列表加载 | 3 秒 | 0.5 秒 | 提升 6 倍 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 提交订单 | 同步等待，5 秒 | 异步处理，立即反馈 | 感知延迟降低 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 搜索结果 | 仅精确匹配 | 支持模糊搜索 | 搜索成功率 +40% |</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 运营/业务影响</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 维度 | 影响 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">|------|------|</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 运营效率 | 导出时间从 30 分钟降到 1 分钟 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 数据准确率 | 从人工核算的 95% 提升到系统保障的 99.9% |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 业务灵活性 | 新增报表维度从&quot;需要开发排期&quot;变成&quot;配置即可&quot; |</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 数据指标预期</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 指标 | 预期变化 | 衡量方式 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">|------|---------|---------|</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 页面加载速度 | P99 &lt; 1s | 前端监控 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 订单提交成功率 | &gt; 99.5% | 服务端监控 |</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">| 用户投诉 | 下降 50% | 客服数据 |</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-风险评估的产品化" tabindex="-1"><a class="header-anchor" href="#_5-2-风险评估的产品化"><span>5.2 风险评估的产品化</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>技术版风险评估：</span></span>
<span class="line"><span>  &quot;Redis 缓存击穿风险：热点数据过期瞬间，大量请求同时访问数据库&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>产品版风险评估：</span></span>
<span class="line"><span>  &quot;在极端情况下（如大促活动时），部分热门页面的加载速度</span></span>
<span class="line"><span>   可能会暂时变慢（从 0.5 秒回到 3 秒左右），但不会完全打不开。</span></span>
<span class="line"><span>   我们会在活动前提前预热缓存来避免这个问题。&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="六、让-pm-参与技术决策的时机" tabindex="-1"><a class="header-anchor" href="#六、让-pm-参与技术决策的时机"><span>六、让 PM 参与技术决策的时机</span></a></h2><h3 id="_6-1-哪些决策需要-pm-参与" tabindex="-1"><a class="header-anchor" href="#_6-1-哪些决策需要-pm-参与"><span>6.1 哪些决策需要 PM 参与</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需要 PM 参与的 5 类技术决策：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 体验取舍型</span></span>
<span class="line"><span>   &quot;我们可以做到实时数据更新，但用户需要等待 5 秒。</span></span>
<span class="line"><span>    或者我们先展示 5 分钟前的数据，秒开。</span></span>
<span class="line"><span>    你觉得哪种体验更好？&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. 范围取舍型</span></span>
<span class="line"><span>   &quot;MVP 版本我们建议先支持 3 种导出格式，剩下 2 种放到 V2。</span></span>
<span class="line"><span>    业务上只有这 3 种够用吗？&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. 成本告知型</span></span>
<span class="line"><span>   &quot;这个功能要实现你要的效果，需要搭建一个推荐系统，</span></span>
<span class="line"><span>    开发周期 2 个月。如果用简易版（基于标签匹配），2 周就行。</span></span>
<span class="line"><span>    你觉得从业务角度，值得等 2 个月吗？&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. 风险告知型</span></span>
<span class="line"><span>   &quot;这个方案在用户量增长到 10 万时，需要再加机器扩容。</span></span>
<span class="line"><span>    按目前增长速度，预计明年 Q1 需要扩容。</span></span>
<span class="line"><span>    从预算角度，可以接受吗？&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5. 策略确认型</span></span>
<span class="line"><span>   &quot;缓存更新有两个策略：</span></span>
<span class="line"><span>    策略 A：实时更新，但系统复杂度增加 30%</span></span>
<span class="line"><span>    策略 B：5 分钟更新一次，实现简单</span></span>
<span class="line"><span>    从业务角度，5 分钟的延迟可以接受吗？&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-2-不打扰-pm-的决策" tabindex="-1"><a class="header-anchor" href="#_6-2-不打扰-pm-的决策"><span>6.2 不打扰 PM 的决策</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>以下决策不需要 PM 参与，RD 自己决定：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- 用 MySQL 还是 PostgreSQL</span></span>
<span class="line"><span>- 用 Redis 还是本地缓存</span></span>
<span class="line"><span>- 接口用 RESTful 还是 GraphQL</span></span>
<span class="line"><span>- 日志格式用什么</span></span>
<span class="line"><span>- 代码怎么组织</span></span>
<span class="line"><span>- 用什么设计模式</span></span>
<span class="line"><span>- 单元测试怎么写</span></span>
<span class="line"><span></span></span>
<span class="line"><span>原则：</span></span>
<span class="line"><span>  影响用户体验的 → 需要 PM 参与</span></span>
<span class="line"><span>  纯技术实现的   → RD 自己决定</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="七、实际案例对比-一份技术方案的两个版本" tabindex="-1"><a class="header-anchor" href="#七、实际案例对比-一份技术方案的两个版本"><span>七、实际案例对比：一份技术方案的两个版本</span></a></h2><h3 id="_7-1-案例背景" tabindex="-1"><a class="header-anchor" href="#_7-1-案例背景"><span>7.1 案例背景</span></a></h3><p>需求：运营后台的客户列表页，增加&quot;批量导出&quot;功能</p><h3 id="_7-2-技术版-给-rd-看" tabindex="-1"><a class="header-anchor" href="#_7-2-技术版-给-rd-看"><span>7.2 技术版（给 RD 看）</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"># 客户列表批量导出 - 技术方案</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 架构设计</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 前端触发导出请求 → BFF 层 → Export Service</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> Export Service 通过 MyBatis 分页查询 customer 表</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 使用 EasyExcel 流式写入，避免 OOM</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 上传至 OSS，返回下载链接</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 通过 RocketMQ 发送导出完成通知</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 数据模型</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">CREATE TABLE export_task (</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    id BIGINT PRIMARY KEY AUTO_INCREMENT,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    task_no VARCHAR(32) UNIQUE NOT NULL,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    user_id BIGINT NOT NULL,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    status VARCHAR(16) NOT NULL DEFAULT &#39;PENDING&#39;,</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    ...</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) ENGINE=InnoDB;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 接口设计</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">POST /api/v1/export/customers</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">Request: { queryParams, requestId }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">Response: { taskNo, status }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 性能评估</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 单次导出最大 10 万行，预计耗时 30-60 秒</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 并发限制：每用户每小时最多 5 次</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 使用 SXSSFWorkbook 控制内存占用 &lt; 512MB</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-3-产品版-给-pm-看" tabindex="-1"><a class="header-anchor" href="#_7-3-产品版-给-pm-看"><span>7.3 产品版（给 PM 看）</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"># 客户列表批量导出 - 给产品经理的说明</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 一句话总结</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">运营可以在后台一键导出客户数据到 Excel，以前需要 30 分钟手工操作，</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">现在点一下按钮，等 1 分钟就能下载。</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 用户体验</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">1.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 运营打开客户列表页，点击&quot;导出&quot;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">2.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 系统弹出提示：&quot;正在生成导出文件，完成后会通知你&quot;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">3.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 运营可以继续做其他事</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">4.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 1 分钟左右，系统通知&quot;导出完成&quot;，点击下载 Excel 文件</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 需要注意的地方</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 📊 单次最多导出 10 万条客户（覆盖 99% 的日常需求）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> ⏱️ 生成文件需要等待约 1 分钟（后台处理）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 🔄 每小时最多导出 5 次（避免服务器压力过大）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 💡 如果数据量特别大，建议用&quot;高级筛选&quot;缩小范围</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 上线计划</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 预计开发周期：5 个工作日</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 预计上线时间：6 月 25 日</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 分批上线：先给运营组的 10 个人开放，稳定后全量</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 需要你确认的事情</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">1.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 导出的 Excel 需要包含哪些字段？（我列了一个字段清单，你看看）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">2.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &quot;已完成&quot;的导出文件，需要保留多久？（建议 7 天自动删除）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">3.</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 是否需要支持&quot;定时自动导出&quot;？（建议 V2 再做）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_7-4-对比总结" tabindex="-1"><a class="header-anchor" href="#_7-4-对比总结"><span>7.4 对比总结</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>两个版本的区别：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>技术版                          产品版</span></span>
<span class="line"><span>────────────────────────────────────────────</span></span>
<span class="line"><span>假设读者懂技术                  假设读者不懂技术</span></span>
<span class="line"><span>用技术术语描述                  用业务场景描述</span></span>
<span class="line"><span>关注&quot;怎么实现&quot;                  关注&quot;有什么用&quot;</span></span>
<span class="line"><span>技术风险和降级方案              业务影响和体验变化</span></span>
<span class="line"><span>架构图、时序图、ER 图           用户操作流程图</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="八、总结" tabindex="-1"><a class="header-anchor" href="#八、总结"><span>八、总结</span></a></h2><h3 id="_8-1-给-rd-的-7-条建议" tabindex="-1"><a class="header-anchor" href="#_8-1-给-rd-的-7-条建议"><span>8.1 给 RD 的 7 条建议</span></a></h3><ol><li><strong>先写产品版，再写技术版</strong>：产品版帮你自己理清&quot;用户视角&quot;</li><li><strong>每个技术决策都加上&quot;这对用户意味着什么&quot;</strong>：一句就够了</li><li><strong>架构图给 PM 看之前，去掉所有技术组件</strong>：只保留业务模块和用户操作流</li><li><strong>技术方案不是越长越好</strong>：PM 需要的核心信息不超过一页纸</li><li><strong>主动标记&quot;需要 PM 决策&quot;的事项</strong>：不要让 PM 从 20 页里找</li><li><strong>用类比和比喻</strong>：&quot;就像你在淘宝下单一样，你点完就不用管了&quot;</li><li><strong>写完找 PM 反馈</strong>：&quot;你看得懂吗？哪里需要我解释？&quot;</li></ol><h3 id="_8-2-一句话总结" tabindex="-1"><a class="header-anchor" href="#_8-2-一句话总结"><span>8.2 一句话总结</span></a></h3><blockquote><p>一份好的技术方案，不仅要让 RD 同事点头，更要让 PM 看完后说&quot;原来如此，我理解了&quot;。技术方案的终极目标不是展示你的技术深度，而是让所有人对齐认知，让项目顺利推进。</p></blockquote>`,48)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};