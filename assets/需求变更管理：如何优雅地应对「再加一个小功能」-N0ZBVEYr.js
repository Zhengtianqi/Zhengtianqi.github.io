import{n as e,o as t,r as n}from"./app-CAHnBWOD.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E9%9C%80%E6%B1%82%E5%8F%98%E6%9B%B4%E7%AE%A1%E7%90%86%EF%BC%9A%E5%A6%82%E4%BD%95%E4%BC%98%E9%9B%85%E5%9C%B0%E5%BA%94%E5%AF%B9%E3%80%8C%E5%86%8D%E5%8A%A0%E4%B8%80%E4%B8%AA%E5%B0%8F%E5%8A%9F%E8%83%BD%E3%80%8D.html","title":"需求变更管理：如何优雅地应对「再加一个小功能」","lang":"zh-CN","frontmatter":{"title":"需求变更管理：如何优雅地应对「再加一个小功能」","tag":["需求变更","项目管理","产品协作"],"category":"产品与协作","date":"2026-07-03T00:00:00.000Z","description":"需求变更管理：如何优雅地应对「再加一个小功能」 「这个功能很小，就加一下」——这句话可能是技术团队听到的最贵的五个字。需求变更不可怕，可怕的是没有管理变更的机制。本文从成本模型到应对策略，建立完整的需求变更管理体系。 一、需求变更的成本模型 1.1 变更不是免费的 1.2 变更分类 二、变更影响评估模板 2.1 标准化评估流程 2.2 影响评估的关键维...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"需求变更管理：如何优雅地应对「再加一个小功能」\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E4%BA%A7%E5%93%81%E4%B8%8E%E5%8D%8F%E4%BD%9C/%E9%9C%80%E6%B1%82%E5%8F%98%E6%9B%B4%E7%AE%A1%E7%90%86%EF%BC%9A%E5%A6%82%E4%BD%95%E4%BC%98%E9%9B%85%E5%9C%B0%E5%BA%94%E5%AF%B9%E3%80%8C%E5%86%8D%E5%8A%A0%E4%B8%80%E4%B8%AA%E5%B0%8F%E5%8A%9F%E8%83%BD%E3%80%8D.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"需求变更管理：如何优雅地应对「再加一个小功能」"}],["meta",{"property":"og:description","content":"需求变更管理：如何优雅地应对「再加一个小功能」 「这个功能很小，就加一下」——这句话可能是技术团队听到的最贵的五个字。需求变更不可怕，可怕的是没有管理变更的机制。本文从成本模型到应对策略，建立完整的需求变更管理体系。 一、需求变更的成本模型 1.1 变更不是免费的 1.2 变更分类 二、变更影响评估模板 2.1 标准化评估流程 2.2 影响评估的关键维..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"产品协作"}],["meta",{"property":"article:tag","content":"项目管理"}],["meta",{"property":"article:tag","content":"需求变更"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":9.86,"words":2957},"filePathRelative":"posts/产品与协作/需求变更管理：如何优雅地应对「再加一个小功能」.md","excerpt":"\\n<p>「这个功能很小，就加一下」——这句话可能是技术团队听到的最贵的五个字。需求变更不可怕，可怕的是没有管理变更的机制。本文从成本模型到应对策略，建立完整的需求变更管理体系。</p>\\n<hr>\\n<h2>一、需求变更的成本模型</h2>\\n<h3>1.1 变更不是免费的</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>需求变更的隐性成本：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  直接成本：</span></span>\\n<span class=\\"line\\"><span>    ┌──────────────────────────────────────┐</span></span>\\n<span class=\\"line\\"><span>    │  需求分析    0.5-1 天                  │</span></span>\\n<span class=\\"line\\"><span>    │  技术方案    0.5-1 天                  │</span></span>\\n<span class=\\"line\\"><span>    │  开发编码    2-5 天                    │</span></span>\\n<span class=\\"line\\"><span>    │  测试验证    1-2 天                    │</span></span>\\n<span class=\\"line\\"><span>    │  部署上线    0.5 天                    │</span></span>\\n<span class=\\"line\\"><span>    │  总计        4.5-9.5 天                │</span></span>\\n<span class=\\"line\\"><span>    └──────────────────────────────────────┘</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  间接成本（往往被忽略）：</span></span>\\n<span class=\\"line\\"><span>    ┌──────────────────────────────────────┐</span></span>\\n<span class=\\"line\\"><span>    │  上下文切换    开发者被打断，恢复成本 30min │</span></span>\\n<span class=\\"line\\"><span>    │  架构腐蚀      临时方案累积成技术债       │</span></span>\\n<span class=\\"line\\"><span>    │  回归风险      新功能可能影响已有功能      │</span></span>\\n<span class=\\"line\\"><span>    │  文档过时      文档与代码不一致           │</span></span>\\n<span class=\\"line\\"><span>    │  团队士气      频繁变更 → 疲劳 → 离职     │</span></span>\\n<span class=\\"line\\"><span>    └──────────────────────────────────────┘</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  变更成本与阶段的关系：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  成本</span></span>\\n<span class=\\"line\\"><span>   ▲</span></span>\\n<span class=\\"line\\"><span>   │                    ╱ 部署后变更</span></span>\\n<span class=\\"line\\"><span>   │                  ╱</span></span>\\n<span class=\\"line\\"><span>   │               ╱ 测试阶段变更</span></span>\\n<span class=\\"line\\"><span>   │            ╱</span></span>\\n<span class=\\"line\\"><span>   │        ╱ 开发阶段变更</span></span>\\n<span class=\\"line\\"><span>   │    ╱</span></span>\\n<span class=\\"line\\"><span>   │  ╱ 需求阶段变更</span></span>\\n<span class=\\"line\\"><span>   └──────────────────────→ 时间</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  规律：越晚变更，成本越高（指数级）</span></span>\\n<span class=\\"line\\"><span>    需求阶段变更成本 = 1x</span></span>\\n<span class=\\"line\\"><span>    开发阶段变更成本 = 5-10x</span></span>\\n<span class=\\"line\\"><span>    测试阶段变更成本 = 10-20x</span></span>\\n<span class=\\"line\\"><span>    上线后变更成本   = 50-200x</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`需求变更管理：如何优雅地应对「再加一个小功能」.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="需求变更管理-如何优雅地应对「再加一个小功能」" tabindex="-1"><a class="header-anchor" href="#需求变更管理-如何优雅地应对「再加一个小功能」"><span>需求变更管理：如何优雅地应对「再加一个小功能」</span></a></h1><p>「这个功能很小，就加一下」——这句话可能是技术团队听到的最贵的五个字。需求变更不可怕，可怕的是没有管理变更的机制。本文从成本模型到应对策略，建立完整的需求变更管理体系。</p><hr><h2 id="一、需求变更的成本模型" tabindex="-1"><a class="header-anchor" href="#一、需求变更的成本模型"><span>一、需求变更的成本模型</span></a></h2><h3 id="_1-1-变更不是免费的" tabindex="-1"><a class="header-anchor" href="#_1-1-变更不是免费的"><span>1.1 变更不是免费的</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需求变更的隐性成本：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  直接成本：</span></span>
<span class="line"><span>    ┌──────────────────────────────────────┐</span></span>
<span class="line"><span>    │  需求分析    0.5-1 天                  │</span></span>
<span class="line"><span>    │  技术方案    0.5-1 天                  │</span></span>
<span class="line"><span>    │  开发编码    2-5 天                    │</span></span>
<span class="line"><span>    │  测试验证    1-2 天                    │</span></span>
<span class="line"><span>    │  部署上线    0.5 天                    │</span></span>
<span class="line"><span>    │  总计        4.5-9.5 天                │</span></span>
<span class="line"><span>    └──────────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  间接成本（往往被忽略）：</span></span>
<span class="line"><span>    ┌──────────────────────────────────────┐</span></span>
<span class="line"><span>    │  上下文切换    开发者被打断，恢复成本 30min │</span></span>
<span class="line"><span>    │  架构腐蚀      临时方案累积成技术债       │</span></span>
<span class="line"><span>    │  回归风险      新功能可能影响已有功能      │</span></span>
<span class="line"><span>    │  文档过时      文档与代码不一致           │</span></span>
<span class="line"><span>    │  团队士气      频繁变更 → 疲劳 → 离职     │</span></span>
<span class="line"><span>    └──────────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  变更成本与阶段的关系：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  成本</span></span>
<span class="line"><span>   ▲</span></span>
<span class="line"><span>   │                    ╱ 部署后变更</span></span>
<span class="line"><span>   │                  ╱</span></span>
<span class="line"><span>   │               ╱ 测试阶段变更</span></span>
<span class="line"><span>   │            ╱</span></span>
<span class="line"><span>   │        ╱ 开发阶段变更</span></span>
<span class="line"><span>   │    ╱</span></span>
<span class="line"><span>   │  ╱ 需求阶段变更</span></span>
<span class="line"><span>   └──────────────────────→ 时间</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  规律：越晚变更，成本越高（指数级）</span></span>
<span class="line"><span>    需求阶段变更成本 = 1x</span></span>
<span class="line"><span>    开发阶段变更成本 = 5-10x</span></span>
<span class="line"><span>    测试阶段变更成本 = 10-20x</span></span>
<span class="line"><span>    上线后变更成本   = 50-200x</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-变更分类" tabindex="-1"><a class="header-anchor" href="#_1-2-变更分类"><span>1.2 变更分类</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>变更类型矩阵：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>              紧急            不紧急</span></span>
<span class="line"><span>           ┌──────────────┬──────────────┐</span></span>
<span class="line"><span>  高影响   │  紧急修复      │  方向调整      │</span></span>
<span class="line"><span>           │  (线上Bug/    │  (战略变更/   │</span></span>
<span class="line"><span>           │   安全漏洞)    │   竞品响应)   │</span></span>
<span class="line"><span>           │  立即处理      │  专项评审      │</span></span>
<span class="line"><span>           ├──────────────┼──────────────┤</span></span>
<span class="line"><span>  低影响   │  范围蔓延      │  优化建议      │</span></span>
<span class="line"><span>           │  (加字段/     │  (体验优化/   │</span></span>
<span class="line"><span>           │   改文案)     │   性能提升)   │</span></span>
<span class="line"><span>           │  下个迭代      │  排入Backlog  │</span></span>
<span class="line"><span>           └──────────────┴──────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>处理原则：</span></span>
<span class="line"><span>  紧急修复  → 走 Hotfix 流程，不走变更评审</span></span>
<span class="line"><span>  方向调整  → PM + 技术负责人 + 业务方专项评审</span></span>
<span class="line"><span>  范围蔓延  → 默认拒绝，排入下个迭代</span></span>
<span class="line"><span>  优化建议  → 放入 Backlog，正常排期</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、变更影响评估模板" tabindex="-1"><a class="header-anchor" href="#二、变更影响评估模板"><span>二、变更影响评估模板</span></a></h2><h3 id="_2-1-标准化评估流程" tabindex="-1"><a class="header-anchor" href="#_2-1-标准化评估流程"><span>2.1 标准化评估流程</span></a></h3><div class="language-markdown line-numbers-mode" data-highlighter="shiki" data-ext="markdown" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-markdown"><span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">## 需求变更评估单</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 基本信息</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 变更编号：CR-2024-06-001</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 提出人：张三（产品）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 提出日期：2024-06-15</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 优先级：P0/P1/P2/P3</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 变更描述</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 原需求：用户下单后直接跳转支付页</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 变更后：用户下单后弹出优惠券选择页，选择后再跳转支付</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 变更原因：运营需要提高优惠券使用率</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 影响评估</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 影响模块：订单服务、支付服务、前端页面</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 影响接口：/api/order/create（新增返回优惠券列表）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 数据库变更：无</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 前端变更：新增优惠券选择组件</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 预估工作量：</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 后端：1人天（接口修改 + 优惠券查询逻辑）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 前端：2人天（优惠券选择页 + 交互）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">  -</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 测试：1人天（功能测试 + 回归测试）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 总工作量：4人天</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 风险评估</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 对已有功能的影响：下单流程改动，需回归支付流程</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 性能影响：新增优惠券查询，预计增加 50ms 响应时间</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 兼容性：老版本 APP 不显示优惠券页，需做版本判断</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">### 决策</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> [ ] 批准（本迭代完成）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> [ ] 批准（排入下个迭代）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> [ ] 驳回（原因：</span><span style="--shiki-light:#A626A4;--shiki-light-font-style:italic;--shiki-dark:#C678DD;--shiki-dark-font-style:italic;">__</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">__）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 决策人：李四（技术负责人）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E5C07B;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> 决策日期：2024-06-15</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-影响评估的关键维度" tabindex="-1"><a class="header-anchor" href="#_2-2-影响评估的关键维度"><span>2.2 影响评估的关键维度</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>评估维度清单：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 技术影响</span></span>
<span class="line"><span>     □ 需要修改哪些模块？</span></span>
<span class="line"><span>     □ 需要修改哪些接口？是否向后兼容？</span></span>
<span class="line"><span>     □ 是否需要数据库变更？</span></span>
<span class="line"><span>     □ 是否需要数据迁移？</span></span>
<span class="line"><span>     □ 是否影响现有架构？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. 测试影响</span></span>
<span class="line"><span>     □ 需要新增哪些测试用例？</span></span>
<span class="line"><span>     □ 哪些已有功能需要回归测试？</span></span>
<span class="line"><span>     □ 是否需要端到端测试？</span></span>
<span class="line"><span>     □ 是否需要性能测试？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. 发布影响</span></span>
<span class="line"><span>     □ 是否需要灰度发布？</span></span>
<span class="line"><span>     □ 是否需要数据迁移脚本？</span></span>
<span class="line"><span>     □ 是否需要配置变更？</span></span>
<span class="line"><span>     □ 是否需要通知其他团队？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. 业务影响</span></span>
<span class="line"><span>     □ 对用户体验的影响？</span></span>
<span class="line"><span>     □ 对业务指标的影响？</span></span>
<span class="line"><span>     □ 是否需要运营配合？</span></span>
<span class="line"><span>     □ 是否需要客服培训？</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、应对策略" tabindex="-1"><a class="header-anchor" href="#三、应对策略"><span>三、应对策略</span></a></h2><h3 id="_3-1-mvp-裁剪法" tabindex="-1"><a class="header-anchor" href="#_3-1-mvp-裁剪法"><span>3.1 MVP 裁剪法</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>当变更工作量超出迭代容量时，用 MVP 裁剪：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>变更需求：完整的优惠券系统（选券→计算折扣→叠加规则→退款退券）</span></span>
<span class="line"><span>预估工作量：15人天</span></span>
<span class="line"><span>迭代剩余容量：5人天</span></span>
<span class="line"><span></span></span>
<span class="line"><span>MVP 裁剪：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌────────────────────────────────────────┐</span></span>
<span class="line"><span>  │  V1.0 (本迭代, 5人天)                   │</span></span>
<span class="line"><span>  │  ✅ 显示可用优惠券列表                    │</span></span>
<span class="line"><span>  │  ✅ 选择优惠券抵扣                       │</span></span>
<span class="line"><span>  │  ✅ 不支持叠加，单张使用                   │</span></span>
<span class="line"><span>  │  ❌ 叠加规则（下迭代）                    │</span></span>
<span class="line"><span>  │  ❌ 退款退券（下迭代）                    │</span></span>
<span class="line"><span>  │  ❌ 优惠券过期提醒（下迭代）               │</span></span>
<span class="line"><span>  └────────────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>裁剪原则：</span></span>
<span class="line"><span>  1. 核心价值优先（能用 &gt; 好用 &gt; 完善）</span></span>
<span class="line"><span>  2. 不可逆的先做（数据库变更、接口设计）</span></span>
<span class="line"><span>  3. 可逆的后做（UI 调整、文案修改）</span></span>
<span class="line"><span>  4. 明确告诉 PM「什么先做什么后做」</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-变更沟通话术" tabindex="-1"><a class="header-anchor" href="#_3-2-变更沟通话术"><span>3.2 变更沟通话术</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>场景 1：PM 要求加一个「小功能」</span></span>
<span class="line"><span></span></span>
<span class="line"><span>PM：「这个功能很简单，就在列表页加个搜索框」</span></span>
<span class="line"><span>RD（错误回答）：「好的我看看」（然后发现要改 5 个接口）</span></span>
<span class="line"><span>RD（正确回答）：「我先评估一下影响范围。搜索框本身 0.5 天，</span></span>
<span class="line"><span>  但需要后端加搜索接口、加索引、前端加防抖、还要处理空状态。</span></span>
<span class="line"><span>  总共约 3 人天。本迭代还剩 2 人天容量，要么砍掉 X 功能，</span></span>
<span class="line"><span>  要么排到下个迭代。你选哪个？」</span></span>
<span class="line"><span></span></span>
<span class="line"><span>话术要点：</span></span>
<span class="line"><span>  1. 不立即答应也不立即拒绝</span></span>
<span class="line"><span>  2. 先评估再回复</span></span>
<span class="line"><span>  3. 给出选择而不是拒绝</span></span>
<span class="line"><span>  4. 让 PM 做优先级决策</span></span>
<span class="line"><span></span></span>
<span class="line"><span>场景 2：紧急变更插队</span></span>
<span class="line"><span></span></span>
<span class="line"><span>PM：「老板要求明天上线这个功能」</span></span>
<span class="line"><span>RD：「这个功能正常需要 5 天。如果明天必须上线，</span></span>
<span class="line"><span>  我可以做一个最简版本：只支持手动导入，没有自动同步。</span></span>
<span class="line"><span>  完整版排到下迭代。可以吗？」</span></span>
<span class="line"><span></span></span>
<span class="line"><span>话术要点：</span></span>
<span class="line"><span>  1. 承认紧迫性</span></span>
<span class="line"><span>  2. 提供降级方案</span></span>
<span class="line"><span>  3. 明确「最简版」的边界</span></span>
<span class="line"><span>  4. 完整版排期确认</span></span>
<span class="line"><span></span></span>
<span class="line"><span>场景 3：频繁变更导致延期</span></span>
<span class="line"><span></span></span>
<span class="line"><span>PM：「这个迭代又加了 3 个需求，能不能按时上线？」</span></span>
<span class="line"><span>RD：「当前迭代原定 5 个需求，已加 3 个，共 8 个。</span></span>
<span class="line"><span>  按当前进度，预计延期 3 天。有两个选择：</span></span>
<span class="line"><span>  1. 砍掉 2 个低优先级需求，按时上线</span></span>
<span class="line"><span>  2. 全部做完，延期 3 天</span></span>
<span class="line"><span>  请和业务方确认哪个方案。」</span></span>
<span class="line"><span></span></span>
<span class="line"><span>话术要点：</span></span>
<span class="line"><span>  1. 用数据说话（原计划 vs 当前）</span></span>
<span class="line"><span>  2. 不说「不行」，说「可以这样也可以那样」</span></span>
<span class="line"><span>  3. 让业务方做取舍</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-变更审批流程" tabindex="-1"><a class="header-anchor" href="#_3-3-变更审批流程"><span>3.3 变更审批流程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>变更审批流程（根据影响分级）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  P0 变更（影响线上/数据迁移）：</span></span>
<span class="line"><span>    提出人 → 技术负责人评估 → 架构师评审 → CTO 批准</span></span>
<span class="line"><span>    必须有回滚方案 + 灰度计划</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  P1 变更（影响多个模块）：</span></span>
<span class="line"><span>    提出人 → 技术负责人评估 → PM + RD 联合评审</span></span>
<span class="line"><span>    需要影响评估单 + 测试方案</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  P2 变更（单模块改动）：</span></span>
<span class="line"><span>    提出人 → 开发负责人评估</span></span>
<span class="line"><span>    在站会上同步即可</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  P3 变更（文案/样式调整）：</span></span>
<span class="line"><span>    提出人 → 直接排入 Backlog</span></span>
<span class="line"><span>    不需要评审</span></span>
<span class="line"><span></span></span>
<span class="line"><span>审批原则：</span></span>
<span class="line"><span>  - 流程重量级与变更影响成正比</span></span>
<span class="line"><span>  - 不搞「一刀切」审批</span></span>
<span class="line"><span>  - 小变更快速通过，大变更严格评审</span></span>
<span class="line"><span>  - 审批 ≤ 24 小时（不能拖一周）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、变更预防机制" tabindex="-1"><a class="header-anchor" href="#四、变更预防机制"><span>四、变更预防机制</span></a></h2><h3 id="_4-1-需求评审阶段" tabindex="-1"><a class="header-anchor" href="#_4-1-需求评审阶段"><span>4.1 需求评审阶段</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需求评审的「防变更」检查清单：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否有明确的用户场景？</span></span>
<span class="line"><span>    → 没有场景的需求容易在开发中被反复修改</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否考虑了边界条件？</span></span>
<span class="line"><span>    → 边界条件不清晰 → 开发到一半才发现遗漏</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否与已有功能冲突？</span></span>
<span class="line"><span>    → 冲突在评审阶段发现 = 1x 成本</span></span>
<span class="line"><span>    → 开发阶段发现 = 10x 成本</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否有数据支持？</span></span>
<span class="line"><span>    → 「我觉得用户需要」≠ 用户真的需要</span></span>
<span class="line"><span>    → 至少有调研数据或用户反馈</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否定义了「不做」的范围？</span></span>
<span class="line"><span>    → 明确「这次不做什么」比「要做什么」更重要</span></span>
<span class="line"><span>    → 防止范围蔓延</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  □ 是否有验收标准？</span></span>
<span class="line"><span>    → 没有验收标准 = 无限修改</span></span>
<span class="line"><span>    → 「做好了」的标准必须量化</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-迭代管理阶段" tabindex="-1"><a class="header-anchor" href="#_4-2-迭代管理阶段"><span>4.2 迭代管理阶段</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>迭代中的变更管控：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  迭代冻结期（Sprint Freeze）：</span></span>
<span class="line"><span>    迭代开始后 2 天 → 需求冻结</span></span>
<span class="line"><span>    冻结期内不接受新需求（P0 除外）</span></span>
<span class="line"><span>    冻结期的变更必须走变更评审</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  每日站会同步：</span></span>
<span class="line"><span>    「昨天 PM 又找我说要改 X」</span></span>
<span class="line"><span>    → 及时暴露，不要默默接受</span></span>
<span class="line"><span>    → 让团队知道变更情况</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  迭代 Burndown 监控：</span></span>
<span class="line"><span>    如果 Burndown 偏离 → 排查是否有隐性变更</span></span>
<span class="line"><span>    → 主动预警而不是等到迭代结束才发现延期</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  变更日志：</span></span>
<span class="line"><span>    每个变更都记录在迭代日志中</span></span>
<span class="line"><span>    → 迭代复盘时分析变更原因</span></span>
<span class="line"><span>    → 找出变更源头，从源头减少变更</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、变更度量" tabindex="-1"><a class="header-anchor" href="#五、变更度量"><span>五、变更度量</span></a></h2><h3 id="_5-1-关键指标" tabindex="-1"><a class="header-anchor" href="#_5-1-关键指标"><span>5.1 关键指标</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需求变更度量指标：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1. 需求变更率</span></span>
<span class="line"><span>     变更需求数 / 总需求数 × 100%</span></span>
<span class="line"><span>     健康值：&lt; 20%</span></span>
<span class="line"><span>     警戒值：&gt; 30%（需要分析原因）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  2. 变更成本比</span></span>
<span class="line"><span>     变更消耗的工时 / 迭代总工时 × 100%</span></span>
<span class="line"><span>     健康值：&lt; 15%</span></span>
<span class="line"><span>     警戒值：&gt; 25%</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  3. 变更来源分布</span></span>
<span class="line"><span>     业务方变更：40%</span></span>
<span class="line"><span>     产品方变更：30%</span></span>
<span class="line"><span>     技术方变更：20%</span></span>
<span class="line"><span>     测试方变更：10%</span></span>
<span class="line"><span>     → 某一方占比过高 → 针对性改进</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  4. 变更阶段分布</span></span>
<span class="line"><span>     需求阶段：60%（最好，成本低）</span></span>
<span class="line"><span>     开发阶段：30%（中等）</span></span>
<span class="line"><span>     测试阶段：8%（较高）</span></span>
<span class="line"><span>     上线后：2%（最高）</span></span>
<span class="line"><span>     → 测试/上线后变更占比高 → 需求评审质量差</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  5. 重复变更率</span></span>
<span class="line"><span>     同一需求被变更多次的比例</span></span>
<span class="line"><span>     → 高重复变更率 → 需求理解不充分</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、面试要点" tabindex="-1"><a class="header-anchor" href="#六、面试要点"><span>六、面试要点</span></a></h2><h3 id="q-如何管理频繁的需求变更" tabindex="-1"><a class="header-anchor" href="#q-如何管理频繁的需求变更"><span>Q：如何管理频繁的需求变更？</span></a></h3><ol><li>分类处理：紧急修复走 Hotfix，方向调整走专项评审，范围蔓延默认拒绝排入下迭代</li><li>变更评估：标准化影响评估模板，从技术/测试/发布/业务四维度评估</li><li>MVP 裁剪：超出容量时裁剪非核心功能，明确「先做什么后做什么」</li><li>变更审批：按影响分级，P0 需 CTO 批准，P3 直接排 Backlog</li><li>预防机制：需求评审阶段做防变更检查，迭代冻结期不接受非 P0 变更</li><li>度量改进：跟踪变更率/变更成本比/变更来源，从源头减少变更</li></ol><h3 id="q-pm-临时加需求怎么办" tabindex="-1"><a class="header-anchor" href="#q-pm-临时加需求怎么办"><span>Q：PM 临时加需求怎么办？</span></a></h3><ol><li>不立即答应也不拒绝，先评估影响范围</li><li>给出工作量预估和可选方案（砍其他需求 or 排下迭代）</li><li>让 PM 做优先级决策（而不是 RD 单方面拒绝）</li><li>如果接受变更，更新迭代计划和交付时间</li><li>记录变更日志，迭代复盘时分析</li></ol><h3 id="q-怎样减少需求变更" tabindex="-1"><a class="header-anchor" href="#q-怎样减少需求变更"><span>Q：怎样减少需求变更？</span></a></h3><ol><li>需求评审阶段做充分（边界条件、验收标准、不做范围）</li><li>需求评审要有技术参与（发现技术风险）</li><li>定义迭代冻结期（开始后 2 天冻结需求）</li><li>数据驱动决策（减少「我觉得」式需求）</li><li>原型验证（复杂需求先做原型再开发）</li><li>定期复盘变更原因，从源头改进</li></ol><hr><h2 id="七、总结" tabindex="-1"><a class="header-anchor" href="#七、总结"><span>七、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需求变更管理 = 分类处理 + 影响评估 + MVP裁剪 + 审批流程 + 预防机制 + 度量改进</span></span>
<span class="line"><span></span></span>
<span class="line"><span>变更分类：</span></span>
<span class="line"><span>  紧急修复 → Hotfix 流程</span></span>
<span class="line"><span>  方向调整 → 专项评审</span></span>
<span class="line"><span>  范围蔓延 → 默认拒绝，排下迭代</span></span>
<span class="line"><span>  优化建议 → 排入 Backlog</span></span>
<span class="line"><span></span></span>
<span class="line"><span>核心原则：</span></span>
<span class="line"><span>  - 不拒绝变更，但管理变更</span></span>
<span class="line"><span>  - 每个变更有评估、有审批、有记录</span></span>
<span class="line"><span>  - 让 PM 做优先级决策，而不是 RD 单方面承担</span></span>
<span class="line"><span>  - 从源头减少变更（需求评审 + 迭代冻结）</span></span>
<span class="line"><span>  - 度量变更率，持续改进</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,43)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};