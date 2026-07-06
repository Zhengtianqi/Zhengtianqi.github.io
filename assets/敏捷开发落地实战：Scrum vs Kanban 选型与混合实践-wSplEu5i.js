import{n as e,o as t,r as n}from"./app---rYyY5a.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%95%8F%E6%8D%B7%E5%BC%80%E5%8F%91%E8%90%BD%E5%9C%B0%E5%AE%9E%E6%88%98%EF%BC%9AScrum%20vs%20Kanban%20%E9%80%89%E5%9E%8B%E4%B8%8E%E6%B7%B7%E5%90%88%E5%AE%9E%E8%B7%B5.html","title":"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践","lang":"zh-CN","frontmatter":{"title":"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践","tag":["敏捷开发","Scrum","Kanban","项目管理"],"category":"产品与协作","date":"2026-07-03T00:00:00.000Z","description":"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践 Scrum 和 Kanban 都是敏捷方法，但适用场景截然不同。强行套用只会水土不服。本文从核心差异到选型决策，从落地实践到混合模式，帮你找到适合团队的敏捷之路。 一、Scrum 与 Kanban 核心差异 1.1 对比矩阵 1.2 流程对比 二、Scrum 落地 2.1 Sprint ...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E6%95%8F%E6%8D%B7%E5%BC%80%E5%8F%91%E8%90%BD%E5%9C%B0%E5%AE%9E%E6%88%98%EF%BC%9AScrum%20vs%20Kanban%20%E9%80%89%E5%9E%8B%E4%B8%8E%E6%B7%B7%E5%90%88%E5%AE%9E%E8%B7%B5.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践"}],["meta",{"property":"og:description","content":"敏捷开发落地实战：Scrum vs Kanban 选型与混合实践 Scrum 和 Kanban 都是敏捷方法，但适用场景截然不同。强行套用只会水土不服。本文从核心差异到选型决策，从落地实践到混合模式，帮你找到适合团队的敏捷之路。 一、Scrum 与 Kanban 核心差异 1.1 对比矩阵 1.2 流程对比 二、Scrum 落地 2.1 Sprint ..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"项目管理"}],["meta",{"property":"article:tag","content":"Kanban"}],["meta",{"property":"article:tag","content":"Scrum"}],["meta",{"property":"article:tag","content":"敏捷开发"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":5.89,"words":1768},"filePathRelative":"posts/产品与协作/敏捷开发落地实战：Scrum vs Kanban 选型与混合实践.md","excerpt":"\\n<p>Scrum 和 Kanban 都是敏捷方法，但适用场景截然不同。强行套用只会水土不服。本文从核心差异到选型决策，从落地实践到混合模式，帮你找到适合团队的敏捷之路。</p>\\n<hr>\\n<h2>一、Scrum 与 Kanban 核心差异</h2>\\n<h3>1.1 对比矩阵</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>              Scrum                    Kanban</span></span>\\n<span class=\\"line\\"><span>──────────────────────────────────────────────────────</span></span>\\n<span class=\\"line\\"><span>节奏          固定 Sprint（1-4周）       持续流动（无固定迭代）</span></span>\\n<span class=\\"line\\"><span>计划          Sprint Planning            按需拉取</span></span>\\n<span class=\\"line\\"><span>承诺          Sprint 承诺范围             无承诺，持续交付</span></span>\\n<span class=\\"line\\"><span>角色          SM / PO / Dev Team         无强制角色</span></span>\\n<span class=\\"line\\"><span>仪式          站会/评审/回顾              站会（可选）</span></span>\\n<span class=\\"line\\"><span>变更          Sprint 内不变              随时可变</span></span>\\n<span class=\\"line\\"><span>限制          限制范围（Sprint 容量）      限制 WIP（在制品数）</span></span>\\n<span class=\\"line\\"><span>度量          Velocity（故事点/迭代）     Lead Time（端到端时间）</span></span>\\n<span class=\\"line\\"><span>适用          需求相对明确                需求随机到达</span></span>\\n<span class=\\"line\\"><span>              产品开发                    运维/支持/持续交付</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`敏捷开发落地实战：Scrum vs Kanban 选型与混合实践.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="敏捷开发落地实战-scrum-vs-kanban-选型与混合实践" tabindex="-1"><a class="header-anchor" href="#敏捷开发落地实战-scrum-vs-kanban-选型与混合实践"><span>敏捷开发落地实战：Scrum vs Kanban 选型与混合实践</span></a></h1><p>Scrum 和 Kanban 都是敏捷方法，但适用场景截然不同。强行套用只会水土不服。本文从核心差异到选型决策，从落地实践到混合模式，帮你找到适合团队的敏捷之路。</p><hr><h2 id="一、scrum-与-kanban-核心差异" tabindex="-1"><a class="header-anchor" href="#一、scrum-与-kanban-核心差异"><span>一、Scrum 与 Kanban 核心差异</span></a></h2><h3 id="_1-1-对比矩阵" tabindex="-1"><a class="header-anchor" href="#_1-1-对比矩阵"><span>1.1 对比矩阵</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>              Scrum                    Kanban</span></span>
<span class="line"><span>──────────────────────────────────────────────────────</span></span>
<span class="line"><span>节奏          固定 Sprint（1-4周）       持续流动（无固定迭代）</span></span>
<span class="line"><span>计划          Sprint Planning            按需拉取</span></span>
<span class="line"><span>承诺          Sprint 承诺范围             无承诺，持续交付</span></span>
<span class="line"><span>角色          SM / PO / Dev Team         无强制角色</span></span>
<span class="line"><span>仪式          站会/评审/回顾              站会（可选）</span></span>
<span class="line"><span>变更          Sprint 内不变              随时可变</span></span>
<span class="line"><span>限制          限制范围（Sprint 容量）      限制 WIP（在制品数）</span></span>
<span class="line"><span>度量          Velocity（故事点/迭代）     Lead Time（端到端时间）</span></span>
<span class="line"><span>适用          需求相对明确                需求随机到达</span></span>
<span class="line"><span>              产品开发                    运维/支持/持续交付</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-流程对比" tabindex="-1"><a class="header-anchor" href="#_1-2-流程对比"><span>1.2 流程对比</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Scrum 流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌─────┐   ┌──────────┐   ┌─────────┐   ┌──────┐</span></span>
<span class="line"><span>  │Backlog│→│Sprint Plan│→│ Sprint  │→│ 评审  │→ 回顾 → 下一个Sprint</span></span>
<span class="line"><span>  │      │   │           │ │ (2周)   │ │      │</span></span>
<span class="line"><span>  └─────┘   └──────────┘   └─────────┘ └──────┘</span></span>
<span class="line"><span>                              │</span></span>
<span class="line"><span>                          每日站会</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Kanban 流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐</span></span>
<span class="line"><span>  │ Backlog │→│ To Do │→│Doing │→│ Done │→│ Live │</span></span>
<span class="line"><span>  │         │ │ (3)   ││ (2)  ││ (2) ││      │</span></span>
<span class="line"><span>  └─────────┘ └───────┘└──────┘└──────┘ └──────┘</span></span>
<span class="line"><span>              ↑ WIP=3  ↑ WIP=2 ↑ WIP=2</span></span>
<span class="line"><span>              </span></span>
<span class="line"><span>  持续流动，拉取制，WIP 限制</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、scrum-落地" tabindex="-1"><a class="header-anchor" href="#二、scrum-落地"><span>二、Scrum 落地</span></a></h2><h3 id="_2-1-sprint-规划" tabindex="-1"><a class="header-anchor" href="#_2-1-sprint-规划"><span>2.1 Sprint 规划</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Sprint Planning 流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 确认 Sprint 容量</span></span>
<span class="line"><span>     - 团队 5 人，Sprint 2 周 = 10 人天/人</span></span>
<span class="line"><span>     - 扣除会议/休假/支持 = 7 人天/人</span></span>
<span class="line"><span>     - 可用容量 = 5 × 7 = 35 人天</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. 从 Backlog 拉取故事</span></span>
<span class="line"><span>     按优先级从高到低拉取，直到填满容量</span></span>
<span class="line"><span></span></span>
<span class="line"><span>     故事          故事点    累计</span></span>
<span class="line"><span>     US-001 登录    5        5</span></span>
<span class="line"><span>     US-002 注册    3        8</span></span>
<span class="line"><span>     US-003 商品列表 8       16</span></span>
<span class="line"><span>     US-004 搜索    5        21</span></span>
<span class="line"><span>     US-005 购物车  8        29</span></span>
<span class="line"><span>     US-006 订单    5        34  ← 接近容量，停止</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. 确认 Sprint Goal</span></span>
<span class="line"><span>     &quot;本 Sprint 完成用户从注册到下单的完整流程&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. 任务拆分</span></span>
<span class="line"><span>     每个 US 拆成子任务（≤ 1 人天）</span></span>
<span class="line"><span>     US-001 登录：</span></span>
<span class="line"><span>       - 设计登录接口 (0.5d)</span></span>
<span class="line"><span>       - 实现后端逻辑 (1d)</span></span>
<span class="line"><span>       - 前端页面 (1d)</span></span>
<span class="line"><span>       - 单元测试 (0.5d)</span></span>
<span class="line"><span>       - 联调 (0.5d)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-故事点估算" tabindex="-1"><a class="header-anchor" href="#_2-2-故事点估算"><span>2.2 故事点估算</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>故事点估算方法：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Planning Poker（计划扑克）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  规则：</span></span>
<span class="line"><span>    1. 每人一副扑克牌：1, 2, 3, 5, 8, 13, 21, ?</span></span>
<span class="line"><span>    2. 主持人读出故事</span></span>
<span class="line"><span>    3. 每人选择一张牌（不展示）</span></span>
<span class="line"><span>    4. 同时翻牌</span></span>
<span class="line"><span>    5. 最高和最低解释理由</span></span>
<span class="line"><span>    6. 再投一轮</span></span>
<span class="line"><span>    7. 收敛后取众数</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  斐波那契数列的含义：</span></span>
<span class="line"><span>    1  = 非常简单（改文案）</span></span>
<span class="line"><span>    2  = 简单（加字段）</span></span>
<span class="line"><span>    3  = 适中（新接口）</span></span>
<span class="line"><span>    5  = 中等（新功能模块）</span></span>
<span class="line"><span>    8  = 复杂（涉及多个系统）</span></span>
<span class="line"><span>    13 = 很复杂（架构调整）</span></span>
<span class="line"><span>    21 = 拆分！不要做这么大的故事</span></span>
<span class="line"><span>    ?  = 不确定，需要讨论</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Velocity 计算：</span></span>
<span class="line"><span>    Sprint 1: 28 点</span></span>
<span class="line"><span>    Sprint 2: 32 点</span></span>
<span class="line"><span>    Sprint 3: 30 点</span></span>
<span class="line"><span>    Sprint 4: 35 点</span></span>
<span class="line"><span>    平均 Velocity: 31 点 → 下个 Sprint 计划约 31 点</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-scrum-仪式" tabindex="-1"><a class="header-anchor" href="#_2-3-scrum-仪式"><span>2.3 Scrum 仪式</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>四大仪式：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. Sprint Planning（2-4h）</span></span>
<span class="line"><span>     目标：确定本 Sprint 做什么和怎么做</span></span>
<span class="line"><span>     参与：PO + Dev Team + SM</span></span>
<span class="line"><span>     产出：Sprint Backlog + Sprint Goal</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. Daily Standup（15min）</span></span>
<span class="line"><span>     目标：同步进度，暴露风险</span></span>
<span class="line"><span>     每人回答三个问题：</span></span>
<span class="line"><span>       - 昨天做了什么？</span></span>
<span class="line"><span>       - 今天计划做什么？</span></span>
<span class="line"><span>       - 有什么阻碍？</span></span>
<span class="line"><span>     ⚠️ 不是汇报会！不讨论解决方案（线下讨论）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. Sprint Review（1-2h）</span></span>
<span class="line"><span>     目标：展示成果，获取反馈</span></span>
<span class="line"><span>     参与：PO + Dev Team + 利益相关者</span></span>
<span class="line"><span>     产出：已完成的故事 Demo + 反馈记录</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. Sprint Retrospective（1h）</span></span>
<span class="line"><span>     目标：持续改进</span></span>
<span class="line"><span>     三问题：</span></span>
<span class="line"><span>       - 做得好的（继续做）</span></span>
<span class="line"><span>       - 做得不好的（停止做）</span></span>
<span class="line"><span>       - 可以改进的（开始做）</span></span>
<span class="line"><span>     产出：1-3 个改进 Action Items</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、kanban-落地" tabindex="-1"><a class="header-anchor" href="#三、kanban-落地"><span>三、Kanban 落地</span></a></h2><h3 id="_3-1-看板设计" tabindex="-1"><a class="header-anchor" href="#_3-1-看板设计"><span>3.1 看板设计</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Kanban 看板示例：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌─────────┬─────────┬─────────┬─────────┬─────────┐</span></span>
<span class="line"><span>  │ Backlog │ To Do   │ In      │ Review  │ Done    │</span></span>
<span class="line"><span>  │         │         │Progress │         │         │</span></span>
<span class="line"><span>  │  (无限)  │ (WIP=3) │ (WIP=2) │ (WIP=2) │ (无限)   │</span></span>
<span class="line"><span>  ├─────────┼─────────┼─────────┼─────────┼─────────┤</span></span>
<span class="line"><span>  │ BUG-045 │ TASK-12 │ TASK-08 │ TASK-05 │ TASK-01 │</span></span>
<span class="line"><span>  │ BUG-046 │ TASK-13 │ TASK-09 │ TASK-06 │ TASK-02 │</span></span>
<span class="line"><span>  │ TASK-15 │ TASK-14 │         │         │ TASK-03 │</span></span>
<span class="line"><span>  │ TASK-16 │         │         │         │ TASK-04 │</span></span>
<span class="line"><span>  │         │         │         │         │ TASK-07 │</span></span>
<span class="line"><span>  └─────────┴─────────┴─────────┴─────────┴─────────┘</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  规则：</span></span>
<span class="line"><span>    1. WIP 超限时不能拉新任务（必须先完成现有的）</span></span>
<span class="line"><span>    2. 从右向左拉取（Done ← Review ← Progress ← To Do ← Backlog）</span></span>
<span class="line"><span>    3. 阻塞的任务标注红色旗帜</span></span>
<span class="line"><span>    4. 每天更新看板</span></span>
<span class="line"><span></span></span>
<span class="line"><span>WIP 限制设定原则：</span></span>
<span class="line"><span>    - 太低：团队空闲，产能浪费</span></span>
<span class="line"><span>    - 太高：并行太多，上下文切换成本高</span></span>
<span class="line"><span>    - 经验值：每人 1-2 个并行任务</span></span>
<span class="line"><span>    - 5 人团队：WIP = 5-10</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-度量指标" tabindex="-1"><a class="header-anchor" href="#_3-2-度量指标"><span>3.2 度量指标</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Kanban 核心指标：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. Lead Time（端到端时间）</span></span>
<span class="line"><span>     从进入 Backlog 到 Done 的总时间</span></span>
<span class="line"><span>     目标：越短越好</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. Cycle Time（开发周期）</span></span>
<span class="line"><span>     从进入 In Progress 到 Done 的时间</span></span>
<span class="line"><span>     目标：越短越好</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. Throughput（吞吐量）</span></span>
<span class="line"><span>     单位时间完成的任务数</span></span>
<span class="line"><span>     如：每周完成 15 个任务</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. WIP（在制品数）</span></span>
<span class="line"><span>     当前正在进行中的任务数</span></span>
<span class="line"><span>     控制 WIP → 缩短 Lead Time</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Lead Time 分布图（累计流图）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  天数</span></span>
<span class="line"><span>  20 │              ╱─────</span></span>
<span class="line"><span>  15 │          ╱───╱</span></span>
<span class="line"><span>  10 │      ╱──╱</span></span>
<span class="line"><span>   5 │  ╱──╱</span></span>
<span class="line"><span>   1 ──╱</span></span>
<span class="line"><span>     └───────────→ 任务数</span></span>
<span class="line"><span>     1  10  20  30  40</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  85% 的任务在 10 天内完成</span></span>
<span class="line"><span>  P50（中位数）= 5 天</span></span>
<span class="line"><span>  P85 = 10 天</span></span>
<span class="line"><span>  → 用 P85 做交付承诺（85% 概率按时）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、scrumban-混合模式" tabindex="-1"><a class="header-anchor" href="#四、scrumban-混合模式"><span>四、Scrumban 混合模式</span></a></h2><h3 id="_4-1-适用场景" tabindex="-1"><a class="header-anchor" href="#_4-1-适用场景"><span>4.1 适用场景</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Scrumban 适用场景：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 产品开发 + 运维支持混合团队</span></span>
<span class="line"><span>     Scrum 管 Sprint 计划</span></span>
<span class="line"><span>     Kanban 管 Bug 和紧急任务</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. 需求半明确的项目</span></span>
<span class="line"><span>     大方向用 Scrum 规划</span></span>
<span class="line"><span>     日常用 Kanban 拉取</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. 从 Scrum 向 Kanban 过渡</span></span>
<span class="line"><span>     保留 Scrum 的回顾和改进</span></span>
<span class="line"><span>     去掉 Sprint 时间盒</span></span>
<span class="line"><span></span></span>
<span class="line"><span>实践方式：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────────────────────────────┐</span></span>
<span class="line"><span>  │  Sprint 容量（70%）                │</span></span>
<span class="line"><span>  │  - 计划的功能开发                  │</span></span>
<span class="line"><span>  │  - Sprint Planning + 回顾          │</span></span>
<span class="line"><span>  ├──────────────────────────────────┤</span></span>
<span class="line"><span>  │  Kanban 缓冲（30%）                │</span></span>
<span class="line"><span>  │  - Bug 修复                        │</span></span>
<span class="line"><span>  │  - 紧急需求                        │</span></span>
<span class="line"><span>  │  - 技术债                          │</span></span>
<span class="line"><span>  │  - WIP 限制                        │</span></span>
<span class="line"><span>  └──────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  紧急任务处理：</span></span>
<span class="line"><span>    正常 Sprint 任务不动</span></span>
<span class="line"><span>    从 Kanban 缓冲区处理</span></span>
<span class="line"><span>    如果缓冲区满了 → 暂停 1 个 Sprint 任务</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、面试要点" tabindex="-1"><a class="header-anchor" href="#五、面试要点"><span>五、面试要点</span></a></h2><h3 id="q-scrum-和-kanban-怎么选" tabindex="-1"><a class="header-anchor" href="#q-scrum-和-kanban-怎么选"><span>Q：Scrum 和 Kanban 怎么选？</span></a></h3><p>选 Scrum：需求相对明确、产品开发类、团队可以承诺 2 周迭代、有 PO 角色配合<br> 选 Kanban：需求随机到达（运维/支持）、任务大小不一、无法固定迭代周期、持续交付<br> 选 Scrumban：既有计划性功能开发又有随机任务（Bug/支持）的团队</p><h3 id="q-故事点和人天有什么区别" tabindex="-1"><a class="header-anchor" href="#q-故事点和人天有什么区别"><span>Q：故事点和人天有什么区别？</span></a></h3><p>故事点：相对复杂度估算（斐波那契数列），包含工作量+复杂度+不确定性，团队统一标准。人天：绝对时间估算。故事点更好：不与具体人绑定（5 人团队 5 点 = 1 人 1 天但可能 1 人 3 天），Velocity 自动校准（团队效率变化会反映在 Velocity 上），避免「为什么估 3 天实际用了 5 天」的追责。</p><h3 id="q-站会变成汇报会怎么办" tabindex="-1"><a class="header-anchor" href="#q-站会变成汇报会怎么办"><span>Q：站会变成汇报会怎么办？</span></a></h3><ol><li>严格控制 15 分钟</li><li>只回答三个问题（做了什么/计划什么/有什么阻碍）</li><li>讨论问题标记后线下沟通</li><li>SM 负责引导，防止发散</li><li>站着开（物理提示：这是简短同步）</li></ol><hr><h2 id="六、总结" tabindex="-1"><a class="header-anchor" href="#六、总结"><span>六、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Scrum：固定迭代 + 承诺 + 仪式 → 产品开发</span></span>
<span class="line"><span>Kanban：持续流动 + WIP 限制 + Lead Time → 运维/支持</span></span>
<span class="line"><span>Scrumban：Sprint 容量 70% + Kanban 缓冲 30% → 混合团队</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Scrum 核心：Sprint Planning / 站会 / 评审 / 回顾 / Velocity</span></span>
<span class="line"><span>Kanban 核心：看板 / WIP 限制 / Lead Time / Throughput</span></span>
<span class="line"><span></span></span>
<span class="line"><span>选型原则：</span></span>
<span class="line"><span>  需求明确 → Scrum</span></span>
<span class="line"><span>  需求随机 → Kanban</span></span>
<span class="line"><span>  混合场景 → Scrumban</span></span>
<span class="line"><span>  不用纠结「纯不纯」，适合团队最重要</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,37)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};