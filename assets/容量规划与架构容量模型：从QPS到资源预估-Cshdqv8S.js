import{n as e,o as t,r as n}from"./app-CH3eYcUw.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/%E5%AE%B9%E9%87%8F%E8%A7%84%E5%88%92%E4%B8%8E%E6%9E%B6%E6%9E%84%E5%AE%B9%E9%87%8F%E6%A8%A1%E5%9E%8B%EF%BC%9A%E4%BB%8EQPS%E5%88%B0%E8%B5%84%E6%BA%90%E9%A2%84%E4%BC%B0.html","title":"容量规划与架构容量模型：从QPS到资源预估","lang":"zh-CN","frontmatter":{"title":"容量规划与架构容量模型：从QPS到资源预估","tag":["容量规划","架构容量","QPS","资源预估"],"category":"架构设计","date":"2026-06-26T00:00:00.000Z","description":"容量规划与架构容量模型：从QPS到资源预估 容量规划与架构容量模型：从QPS到资源预估是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。 本文介绍了容量规划与架构容量模型：从QPS到资源预估的设计原则和实践经验，帮助你提升架构设计能力。 1.2 从DAU推导QPS 1.3 QPS to Latency 二、单机容量模型 2.1 CPU瓶颈分析...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"容量规划与架构容量模型：从QPS到资源预估\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-06-26T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/%E5%AE%B9%E9%87%8F%E8%A7%84%E5%88%92%E4%B8%8E%E6%9E%B6%E6%9E%84%E5%AE%B9%E9%87%8F%E6%A8%A1%E5%9E%8B%EF%BC%9A%E4%BB%8EQPS%E5%88%B0%E8%B5%84%E6%BA%90%E9%A2%84%E4%BC%B0.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"容量规划与架构容量模型：从QPS到资源预估"}],["meta",{"property":"og:description","content":"容量规划与架构容量模型：从QPS到资源预估 容量规划与架构容量模型：从QPS到资源预估是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。 本文介绍了容量规划与架构容量模型：从QPS到资源预估的设计原则和实践经验，帮助你提升架构设计能力。 1.2 从DAU推导QPS 1.3 QPS to Latency 二、单机容量模型 2.1 CPU瓶颈分析..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"资源预估"}],["meta",{"property":"article:tag","content":"QPS"}],["meta",{"property":"article:tag","content":"架构容量"}],["meta",{"property":"article:tag","content":"容量规划"}],["meta",{"property":"article:published_time","content":"2026-06-26T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1782439143000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"270490096@qq.com","commits":4,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":7.82,"words":2346},"filePathRelative":"posts/架构设计/容量规划与架构容量模型：从QPS到资源预估.md","excerpt":"\\n<blockquote>\\n<p>容量规划与架构容量模型：从QPS到资源预估是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。<br>\\n本文介绍了容量规划与架构容量模型：从QPS到资源预估的设计原则和实践经验，帮助你提升架构设计能力。</p>\\n</blockquote>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>DAU (Daily Active Users) ← 日活跃用户数</span></span>\\n<span class=\\"line\\"><span>  └─ 每天有多少用户使用系统</span></span>\\n<span class=\\"line\\"><span>  └─ 关键指标，用于长期规划</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>PCU (Peak Concurrent Users) ← 峰值并发用户数</span></span>\\n<span class=\\"line\\"><span>  └─ 某个时刻最多有多少用户在线</span></span>\\n<span class=\\"line\\"><span>  └─ 关键指标，用于短期容量规划</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>QPS (Queries Per Second) ← 每秒查询数</span></span>\\n<span class=\\"line\\"><span>  └─ 最关键的技术指标</span></span>\\n<span class=\\"line\\"><span>  └─ 直接决定硬件规模</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>TPS (Transactions Per Second) ← 每秒事务数</span></span>\\n<span class=\\"line\\"><span>  └─ QPS的子集（某些请求才算一个事务）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>Throughput ← 吞吐量</span></span>\\n<span class=\\"line\\"><span>  └─ 单位时间处理的数据量（MB/s）</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`容量规划与架构容量模型：从QPS到资源预估.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="容量规划与架构容量模型-从qps到资源预估" tabindex="-1"><a class="header-anchor" href="#容量规划与架构容量模型-从qps到资源预估"><span>容量规划与架构容量模型：从QPS到资源预估</span></a></h1><blockquote><p>容量规划与架构容量模型：从QPS到资源预估是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。<br> 本文介绍了容量规划与架构容量模型：从QPS到资源预估的设计原则和实践经验，帮助你提升架构设计能力。</p></blockquote><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>DAU (Daily Active Users) ← 日活跃用户数</span></span>
<span class="line"><span>  └─ 每天有多少用户使用系统</span></span>
<span class="line"><span>  └─ 关键指标，用于长期规划</span></span>
<span class="line"><span></span></span>
<span class="line"><span>PCU (Peak Concurrent Users) ← 峰值并发用户数</span></span>
<span class="line"><span>  └─ 某个时刻最多有多少用户在线</span></span>
<span class="line"><span>  └─ 关键指标，用于短期容量规划</span></span>
<span class="line"><span></span></span>
<span class="line"><span>QPS (Queries Per Second) ← 每秒查询数</span></span>
<span class="line"><span>  └─ 最关键的技术指标</span></span>
<span class="line"><span>  └─ 直接决定硬件规模</span></span>
<span class="line"><span></span></span>
<span class="line"><span>TPS (Transactions Per Second) ← 每秒事务数</span></span>
<span class="line"><span>  └─ QPS的子集（某些请求才算一个事务）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Throughput ← 吞吐量</span></span>
<span class="line"><span>  └─ 单位时间处理的数据量（MB/s）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-从dau推导qps" tabindex="-1"><a class="header-anchor" href="#_1-2-从dau推导qps"><span>1.2 从DAU推导QPS</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>假设：DAU = 100万</span></span>
<span class="line"><span></span></span>
<span class="line"><span>计算步骤：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 计算PCU（峰值并发用户）</span></span>
<span class="line"><span>   假设：日均活跃时间分布</span></span>
<span class="line"><span>   ├─ 08:00-12:00: 40% 活跃</span></span>
<span class="line"><span>   ├─ 12:00-18:00: 60% 活跃（午间高峰）</span></span>
<span class="line"><span>   ├─ 18:00-23:00: 30% 活跃</span></span>
<span class="line"><span>   └─ 其余时间: 5% 活跃</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   峰值时刻（18:00）：</span></span>
<span class="line"><span>     PCU = 100万 * 60% / (活跃时长 / 24小时)</span></span>
<span class="line"><span>        = 100万 * 60% / 6小时</span></span>
<span class="line"><span>        = 100万 * 0.1</span></span>
<span class="line"><span>        = 10万 PCU</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. 计算平均QPS</span></span>
<span class="line"><span>   假设：每个用户平均每秒发起 0.1 个请求</span></span>
<span class="line"><span>   平均QPS = PCU * 0.1 = 10万 * 0.1 = 1万 QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. 计算峰值QPS（突发流量）</span></span>
<span class="line"><span>   峰值因子 = 1.5 - 2.0（用户行为聚合导致突发）</span></span>
<span class="line"><span>   峰值QPS = 平均QPS * 峰值因子 </span></span>
<span class="line"><span>          = 1万 * 1.5 = 1.5万 QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. 考虑多个业务线的QPS</span></span>
<span class="line"><span>   总QPS = 订单QPS + 支付QPS + 库存QPS + ...</span></span>
<span class="line"><span>        = 5000 + 3000 + 2000 + ...</span></span>
<span class="line"><span>        = 15000 QPS</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-3-qps-to-latency" tabindex="-1"><a class="header-anchor" href="#_1-3-qps-to-latency"><span>1.3 QPS to Latency</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>系统性能指标：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>QPS: 1万 QPS</span></span>
<span class="line"><span>平均延迟：50ms</span></span>
<span class="line"><span>P99延迟：200ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>计算：</span></span>
<span class="line"><span>  一个请求需要 50ms 才能完成</span></span>
<span class="line"><span>  同时最多能处理 1000 / 50 * 1000 = 20 个并发请求</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  但如果QPS=10000，需要多少并发连接？</span></span>
<span class="line"><span>  并发连接数 = QPS * 平均延迟（秒）</span></span>
<span class="line"><span>             = 10000 * 0.05</span></span>
<span class="line"><span>             = 500 个并发连接</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="二、单机容量模型" tabindex="-1"><a class="header-anchor" href="#二、单机容量模型"><span>二、单机容量模型</span></a></h2><h3 id="_2-1-cpu瓶颈分析" tabindex="-1"><a class="header-anchor" href="#_2-1-cpu瓶颈分析"><span>2.1 CPU瓶颈分析</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>单核CPU可以处理的QPS = 10000 (取决于业务逻辑复杂度)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>常见应用的单核QPS：</span></span>
<span class="line"><span>├─ 静态文件服务（Nginx）: 50000 QPS</span></span>
<span class="line"><span>├─ 简单API（Hello World）: 10000 QPS</span></span>
<span class="line"><span>├─ 数据库查询（有缓存）: 5000 QPS</span></span>
<span class="line"><span>├─ 复杂业务逻辑: 1000 QPS</span></span>
<span class="line"><span>└─ 机器学习推荐: 100 QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>现代CPU配置：8核</span></span>
<span class="line"><span></span></span>
<span class="line"><span>单机QPS = 单核QPS * CPU核数 * 利用率</span></span>
<span class="line"><span>        = 10000 * 8 * 0.7</span></span>
<span class="line"><span>        = 56000 QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>（不能100%利用，通常70%左右，留余量应对突发）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-内存瓶颈分析" tabindex="-1"><a class="header-anchor" href="#_2-2-内存瓶颈分析"><span>2.2 内存瓶颈分析</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Java应用堆内存计算：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>基础JVM: 512MB</span></span>
<span class="line"><span>├─ 启动时自动分配</span></span>
<span class="line"><span></span></span>
<span class="line"><span>业务对象: 100MB</span></span>
<span class="line"><span>├─ 例如：缓存1000个用户对象</span></span>
<span class="line"><span>├─ 每个对象100KB</span></span>
<span class="line"><span>└─ 1000 * 100KB = 100MB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>连接池: 200MB</span></span>
<span class="line"><span>├─ 100个数据库连接</span></span>
<span class="line"><span>├─ 每个连接2MB （协议缓冲、事务日志等）</span></span>
<span class="line"><span>└─ 100 * 2MB = 200MB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>框架库: 300MB</span></span>
<span class="line"><span>├─ Spring、Hibernate等</span></span>
<span class="line"><span></span></span>
<span class="line"><span>总计: 512 + 100 + 200 + 300 = 1112MB ≈ 2GB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>推荐：</span></span>
<span class="line"><span>├─ 小型应用：2GB</span></span>
<span class="line"><span>├─ 中型应用：4-8GB</span></span>
<span class="line"><span>├─ 大型应用：16GB+</span></span>
<span class="line"><span></span></span>
<span class="line"><span>内存与QPS的关系：</span></span>
<span class="line"><span>  增加内存 → 缓存更多数据 → 减少数据库查询 → QPS提升</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  例如：</span></span>
<span class="line"><span>  2GB内存：缓存1000个对象，hit=70% → QPS=5000</span></span>
<span class="line"><span>  8GB内存：缓存10000个对象，hit=90% → QPS=8000</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-网络io瓶颈" tabindex="-1"><a class="header-anchor" href="#_2-3-网络io瓶颈"><span>2.3 网络IO瓶颈</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>网络带宽 = 1Gbps (1000Mbps)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>应用场景分析：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>场景1：API服务（JSON响应）</span></span>
<span class="line"><span>  平均响应大小：10KB</span></span>
<span class="line"><span>  最大吞吐：1000Mbps / (10KB * 8bits/byte)</span></span>
<span class="line"><span>         = 1000Mbps / 80Kbps</span></span>
<span class="line"><span>         = 12500 requests/sec = 12500 QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>场景2：大文件下载（视频/图片）</span></span>
<span class="line"><span>  平均文件大小：5MB</span></span>
<span class="line"><span>  最大吞吐：1000Mbps / (5MB * 8)</span></span>
<span class="line"><span>         = 1000Mbps / 40Mbps</span></span>
<span class="line"><span>         = 25 requests/sec = 25 QPS（网络极限）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>网络优化方案：</span></span>
<span class="line"><span>  ├─ CDN分发：减少跨域流量</span></span>
<span class="line"><span>  ├─ 压缩：gzip压缩减少60%数据量</span></span>
<span class="line"><span>  ├─ 升级带宽：10Gbps网卡</span></span>
<span class="line"><span>  └─ 多线路：多ISP链接负载均衡</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-4-磁盘io瓶颈" tabindex="-1"><a class="header-anchor" href="#_2-4-磁盘io瓶颈"><span>2.4 磁盘IO瓶颈</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>磁盘类型与IOPS（每秒操作次数）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>SSD: 100000 IOPS</span></span>
<span class="line"><span>HDD: 1000 IOPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>数据库写入分析：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>假设：每个写请求需要 3次磁盘操作</span></span>
<span class="line"><span>  ├─ 写入binlog（MySQL主从同步）</span></span>
<span class="line"><span>  ├─ 写入redo log（事务日志）</span></span>
<span class="line"><span>  └─ 写入数据文件</span></span>
<span class="line"><span></span></span>
<span class="line"><span>磁盘限制的QPS：</span></span>
<span class="line"><span>  SSD: 100000 / 3 ≈ 33000 write-QPS</span></span>
<span class="line"><span>  HDD: 1000 / 3 ≈ 333 write-QPS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>优化方案：</span></span>
<span class="line"><span>  ├─ 使用SSD: HDD → SSD, 提升100倍</span></span>
<span class="line"><span>  ├─ WAL优化: 批量写入 + 异步fsync</span></span>
<span class="line"><span>  ├─ 主从分离: 写向master, 读向slave</span></span>
<span class="line"><span>  └─ 分库分表: 多个数据库并行处理</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-单机容量总结" tabindex="-1"><a class="header-anchor" href="#_2-5-单机容量总结"><span>2.5 单机容量总结</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>假设应用：</span></span>
<span class="line"><span>  ├─ 平均QPS: 1000</span></span>
<span class="line"><span>  ├─ 峰值QPS: 2000</span></span>
<span class="line"><span>  ├─ 平均延迟: 50ms</span></span>
<span class="line"><span>  ├─ 需要持久化（数据库）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>计算单机配置：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>CPU:</span></span>
<span class="line"><span>  需要QPS 2000 (峰值) / 10000 (单核能力) = 0.2个CPU</span></span>
<span class="line"><span>  考虑突发和降级，选择 4核 CPU</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>内存:</span></span>
<span class="line"><span>  业务缓存 + 连接池 + JVM开销</span></span>
<span class="line"><span>  选择 8GB</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>磁盘:</span></span>
<span class="line"><span>  写QPS 200 (估算) / 100000 (SSD能力) = 0.002</span></span>
<span class="line"><span>  磁盘不是瓶颈，使用500GB SSD即可</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>网络:</span></span>
<span class="line"><span>  QPS 2000 * 平均响应10KB = 20MB/s</span></span>
<span class="line"><span>  千兆网卡 (125MB/s) 充足</span></span>
<span class="line"><span></span></span>
<span class="line"><span>单机成本：</span></span>
<span class="line"><span>  ├─ 服务器：￥3000-5000</span></span>
<span class="line"><span>  ├─ 带宽：￥500/月</span></span>
<span class="line"><span>  └─ 数据库：￥5000/月（云数据库）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="三、分布式容量模型" tabindex="-1"><a class="header-anchor" href="#三、分布式容量模型"><span>三、分布式容量模型</span></a></h2><h3 id="_3-1-水平扩容" tabindex="-1"><a class="header-anchor" href="#_3-1-水平扩容"><span>3.1 水平扩容</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>需求：QPS 100万</span></span>
<span class="line"><span></span></span>
<span class="line"><span>单机能力：</span></span>
<span class="line"><span>  ├─ QPS: 10000</span></span>
<span class="line"><span>  ├─ 成本: ￥10000/年</span></span>
<span class="line"><span></span></span>
<span class="line"><span>需要服务器数：</span></span>
<span class="line"><span>  100万 / 10000 = 100 台</span></span>
<span class="line"><span></span></span>
<span class="line"><span>关键问题：</span></span>
<span class="line"><span>  ├─ 如何分散流量？ → 负载均衡</span></span>
<span class="line"><span>  ├─ 如何避免单点？ → 冗余设计</span></span>
<span class="line"><span>  └─ 如何监控100台？ → 自动化运维</span></span>
<span class="line"><span></span></span>
<span class="line"><span>架构：</span></span>
<span class="line"><span>┌──────────────┐</span></span>
<span class="line"><span>│ Load Balancer│</span></span>
<span class="line"><span>└──────────────┘</span></span>
<span class="line"><span>        │</span></span>
<span class="line"><span>    ┌───┴───┬────┬────┬─────┐</span></span>
<span class="line"><span>    ▼       ▼    ▼    ▼     ▼</span></span>
<span class="line"><span>  Srv1    Srv2  Srv3 ...  Srv100</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  每个服务器 10000 QPS</span></span>
<span class="line"><span>  100个服务器 = 100万 QPS</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-数据库容量规划" tabindex="-1"><a class="header-anchor" href="#_3-2-数据库容量规划"><span>3.2 数据库容量规划</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>问题：100台应用服务器，但只能有1个数据库吗？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>数据库瓶颈分析：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>写QPS = 100万 * 10% = 10万 write/sec</span></span>
<span class="line"><span>读QPS = 100万 * 90% = 90万 read/sec</span></span>
<span class="line"><span></span></span>
<span class="line"><span>单台MySQL能力：</span></span>
<span class="line"><span>  ├─ 写：10000 write/sec</span></span>
<span class="line"><span>  └─ 读：50000 read/sec</span></span>
<span class="line"><span></span></span>
<span class="line"><span>需要的数据库：</span></span>
<span class="line"><span>  写：10万 / 10000 = 10台 master</span></span>
<span class="line"><span>  读：90万 / 50000 = 18台 slave</span></span>
<span class="line"><span></span></span>
<span class="line"><span>但生产方案（主从复制）：</span></span>
<span class="line"><span>  ├─ 1个Master（写）</span></span>
<span class="line"><span>  ├─ 3-5个Slave（读）</span></span>
<span class="line"><span>  └─ 可以分库分表来扩展</span></span>
<span class="line"><span></span></span>
<span class="line"><span>分库分表策略：</span></span>
<span class="line"><span>  ├─ 按用户ID分库：100个库，每库 100万用户/100 = 1万用户</span></span>
<span class="line"><span>  ├─ 每个库1个Master + 2个Slave</span></span>
<span class="line"><span>  └─ 总计：100个Master + 200个Slave = 300台数据库服务器</span></span>
<span class="line"><span></span></span>
<span class="line"><span>成本：太高！通常采用：</span></span>
<span class="line"><span>  ├─ 云数据库（RDS）：自动分片和备份</span></span>
<span class="line"><span>  └─ 年成本：100万 * ￥100/月 = ￥1.2亿</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-缓存容量规划" tabindex="-1"><a class="header-anchor" href="#_3-3-缓存容量规划"><span>3.3 缓存容量规划</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>使用缓存减轻数据库压力：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>假设：缓存hit rate = 90%</span></span>
<span class="line"><span></span></span>
<span class="line"><span>写QPS：10万 → 无法减少（必须写DB）</span></span>
<span class="line"><span>读QPS：90万 → 90% * 90万 = 81万 来自缓存</span></span>
<span class="line"><span>      剩余：9万 来自DB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>缓存需求：</span></span>
<span class="line"><span>  ├─ 缓存热数据（Top 20% 用户数据）</span></span>
<span class="line"><span>  ├─ 20% * 1000万用户 = 200万用户</span></span>
<span class="line"><span>  ├─ 每个用户对象 1KB</span></span>
<span class="line"><span>  └─ 总内存：200万 * 1KB = 2GB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Redis容量规划：</span></span>
<span class="line"><span>  ├─ 单台Redis：30GB内存，可处理100K QPS</span></span>
<span class="line"><span>  ├─ 需要：2GB / 30GB = 0.1台（只需1台）</span></span>
<span class="line"><span>  ├─ 考虑主从备份和高可用：3台 (主+从+sentinel)</span></span>
<span class="line"><span>  └─ 年成本：3 * ￥5000 = ￥15000</span></span>
<span class="line"><span></span></span>
<span class="line"><span>效果：</span></span>
<span class="line"><span>  ├─ 缓存前：DB 10万 write/sec + 90万 read/sec = 100万 QPS</span></span>
<span class="line"><span>  ├─ 缓存后：DB 10万 write/sec + 9万 read/sec = 19万 QPS</span></span>
<span class="line"><span>  ├─ 数据库需求从300台 → 20台（大幅节省）</span></span>
<span class="line"><span>  └─ ROI极高</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="四、容量规划检查清单" tabindex="-1"><a class="header-anchor" href="#四、容量规划检查清单"><span>四、容量规划检查清单</span></a></h2><h3 id="_4-1-计算方程式" tabindex="-1"><a class="header-anchor" href="#_4-1-计算方程式"><span>4.1 计算方程式</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>QPS计算：</span></span>
<span class="line"><span>  QPS = DAU * 日均活跃时长(小时) / 24 * 每用户请求数/秒 * 峰值因子</span></span>
<span class="line"><span></span></span>
<span class="line"><span>服务器数量：</span></span>
<span class="line"><span>  Server_Count = Peak_QPS / Single_Server_QPS * Safety_Factor</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  例：Peak_QPS = 10万, Single_Server_QPS = 10000, Safety = 1.5</span></span>
<span class="line"><span>      Server_Count = 100000 / 10000 * 1.5 = 15台</span></span>
<span class="line"><span></span></span>
<span class="line"><span>CPU核数：</span></span>
<span class="line"><span>  Cores = Peak_QPS / QPS_Per_Core / CPU_Utilization</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  例：Peak_QPS = 10000, QPS_Per_Core = 1000, Utilization = 70%</span></span>
<span class="line"><span>      Cores = 10000 / 1000 / 0.7 = 14核</span></span>
<span class="line"><span></span></span>
<span class="line"><span>内存大小：</span></span>
<span class="line"><span>  Memory = Base_JVM + Cache_Size + Connection_Pool + Libraries</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  例：512MB + 1GB + 500MB + 500MB = 2.5GB → 选4GB或8GB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>数据库：</span></span>
<span class="line"><span>  DB_Write_Capacity = Write_QPS / Per_DB_Write_QPS</span></span>
<span class="line"><span>  DB_Read_Capacity = Read_QPS / Per_DB_Read_QPS * (1 - Cache_Hit_Rate)</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-容量规划表" tabindex="-1"><a class="header-anchor" href="#_4-2-容量规划表"><span>4.2 容量规划表</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>┌────────────┬──────────┬──────────┬──────────┬──────────┐</span></span>
<span class="line"><span>│ 业务规模   │ DAU     │ Peak QPS │ 服务器数 │ 年成本   │</span></span>
<span class="line"><span>├────────────┼──────────┼──────────┼──────────┼──────────┤</span></span>
<span class="line"><span>│ 小型应用   │ 10万    │ 1000    │ 2        │ 10万     │</span></span>
<span class="line"><span>│ 中型应用   │ 100万   │ 10000   │ 20       │ 100万    │</span></span>
<span class="line"><span>│ 大型应用   │ 1000万  │ 100000  │ 200      │ 1000万   │</span></span>
<span class="line"><span>│ 超大规模   │ 1亿     │ 1000000 │ 2000     │ 1亿      │</span></span>
<span class="line"><span>└────────────┴──────────┴──────────┴──────────┴──────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>（仅计算应用层，不含数据库、缓存等）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="五、容量监控与告警" tabindex="-1"><a class="header-anchor" href="#五、容量监控与告警"><span>五、容量监控与告警</span></a></h2><h3 id="_5-1-关键指标监控" tabindex="-1"><a class="header-anchor" href="#_5-1-关键指标监控"><span>5.1 关键指标监控</span></a></h3><div class="language-python line-numbers-mode" data-highlighter="shiki" data-ext="python" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-python"><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">class</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;"> CapacityMonitoring</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">    &quot;&quot;&quot;容量监控&quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    </span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    def</span><span style="--shiki-light:#0184BC;--shiki-dark:#56B6C2;"> __init__</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">        self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.thresholds </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">            &#39;cpu_utilization&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">0.75</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># CPU &gt;75% 告警</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">            &#39;memory_utilization&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">0.80</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 内存 &gt;80% 告警</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">            &#39;disk_utilization&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">0.85</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 磁盘 &gt;85% 告警</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">            &#39;qps_growth&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">0.1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">,  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># QPS周环比增长 &gt;10% 告警</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">        }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    </span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    async</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> def</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> check_capacity</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-light-font-style:inherit;--shiki-dark:#E5C07B;--shiki-dark-font-style:italic;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">):</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">        &quot;&quot;&quot;定期检查容量&quot;&quot;&quot;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">        while</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> True</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            metrics </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                &#39;cpu&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_cpu_utilization</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(),  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 0-1</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                &#39;memory&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_memory_utilization</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(),</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                &#39;disk&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_disk_utilization</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(),</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                &#39;current_qps&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_current_qps</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(),</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">                &#39;peak_qps_week_ago&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">get_peak_qps_week_ago</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(),</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            }</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            </span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 容量规划与架构容量模型：从QPS到资源预估</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            qps_growth </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> (metrics[</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;current_qps&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">-</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metrics[</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;peak_qps_week_ago&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">]) </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">/</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metrics[</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;peak_qps_week_ago&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">]</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            if</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> qps_growth </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.thresholds[</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;qps_growth&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">]:</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">                await</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">alert</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;QPS周环比增长 </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">qps_growth</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.1%</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">, 需要评估是否扩容&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            </span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">            # CPU/内存/磁盘利用率告警</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            for</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metric_name, threshold </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">in</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.thresholds.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">items</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">():</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">                if</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metric_name </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">in</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metrics:</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">                    if</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> metrics[metric_name] </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">&gt;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> threshold:</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">                        await</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> self</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">alert</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">f</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">metric_name</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 已达 </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">{</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">metrics[metric_name]</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">:.1%</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">            </span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">            await</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> asyncio.</span><span style="--shiki-light:#383A42;--shiki-dark:#61AFEF;">sleep</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">300</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">)  </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 5分钟检查一次</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-扩容决策树" tabindex="-1"><a class="header-anchor" href="#_5-2-扩容决策树"><span>5.2 扩容决策树</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>当前QPS = 8000, 单机容量 = 10000</span></span>
<span class="line"><span></span></span>
<span class="line"><span>┌─────────────────────────┐</span></span>
<span class="line"><span>│ QPS增长到8000           │</span></span>
<span class="line"><span>└────────────┬────────────┘</span></span>
<span class="line"><span>             │</span></span>
<span class="line"><span>      CPU利用率 ?</span></span>
<span class="line"><span>    ┌─────────┴─────────┐</span></span>
<span class="line"><span>   &lt;70%               &gt;70%</span></span>
<span class="line"><span>    │                  │</span></span>
<span class="line"><span>   否                 是</span></span>
<span class="line"><span>    │                  │</span></span>
<span class="line"><span> 继续观察          立即规划扩容</span></span>
<span class="line"><span>    │                  │</span></span>
<span class="line"><span> 监控后续增速        评估：</span></span>
<span class="line"><span>    │                 ├─ 垂直扩容（升级硬件）</span></span>
<span class="line"><span>    │                 ├─ 水平扩容（加服务器）</span></span>
<span class="line"><span>    │                 └─ 优化（改代码、加缓存）</span></span>
<span class="line"><span>    │</span></span>
<span class="line"><span> 若周环比 &gt;15%        选择方案：</span></span>
<span class="line"><span>    │                 ├─ 加缓存最快（2-3天）</span></span>
<span class="line"><span>    │  └─────────┐    ├─ 垂直扩容（1周）</span></span>
<span class="line"><span>    │            │    └─ 水平扩容（2周）</span></span>
<span class="line"><span>    └────────────┘</span></span>
<span class="line"><span>         │</span></span>
<span class="line"><span>      扩容执行</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结"><span>总结</span></a></h2><p>容量规划是架构师的核心技能：</p><ol><li><strong>了解业务指标</strong>（DAU → QPS）</li><li><strong>分析单机瓶颈</strong>（CPU/内存/网络/磁盘）</li><li><strong>计算所需资源</strong>（服务器数、DB数、缓存大小）</li><li><strong>建立监控告警</strong>（及时发现容量问题）</li><li><strong>制定扩容方案</strong>（快速响应增长）</li></ol><p><strong>黄金法则</strong>：</p><ul><li>容量规划总是低估增长（数据往往比预期快）</li><li>留足余量（70% CPU利用率，不是100%）</li><li>定期压测验证（模型 ≠ 现实）</li></ul>`,40)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};