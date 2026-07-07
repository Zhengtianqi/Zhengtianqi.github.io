import{n as e,o as t,r as n}from"./app-CAHnBWOD.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/redis/Redis%20%E9%AB%98%E5%8F%AF%E7%94%A8%E6%B7%B1%E5%BA%A6%E5%AF%B9%E6%AF%94%EF%BC%9A%E5%93%A8%E5%85%B5%20vs%20Cluster%20vs%20%E4%B8%BB%E4%BB%8E.html","title":"Redis 高可用深度对比：哨兵 vs Cluster vs 主从","lang":"zh-CN","frontmatter":{"title":"Redis 高可用深度对比：哨兵 vs Cluster vs 主从","tag":["Redis","高可用","Sentinel","Cluster","主从复制"],"category":"数据库","date":"2026-07-03T00:00:00.000Z","description":"Redis 高可用深度对比：哨兵 vs Cluster vs 主从 单机 Redis 挂了怎么办？主从复制只是开始。Sentinel 能自动故障转移，Cluster 能水平扩展。三种方案怎么选？脑裂怎么防？扩缩容怎么做？ 一、主从复制 1.1 架构 1.2 复制原理 二、哨兵（Sentinel） 2.1 架构 2.2 故障转移流程 2.3 Sentin...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Redis 高可用深度对比：哨兵 vs Cluster vs 主从\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E6%95%B0%E6%8D%AE%E5%BA%93/redis/Redis%20%E9%AB%98%E5%8F%AF%E7%94%A8%E6%B7%B1%E5%BA%A6%E5%AF%B9%E6%AF%94%EF%BC%9A%E5%93%A8%E5%85%B5%20vs%20Cluster%20vs%20%E4%B8%BB%E4%BB%8E.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"Redis 高可用深度对比：哨兵 vs Cluster vs 主从"}],["meta",{"property":"og:description","content":"Redis 高可用深度对比：哨兵 vs Cluster vs 主从 单机 Redis 挂了怎么办？主从复制只是开始。Sentinel 能自动故障转移，Cluster 能水平扩展。三种方案怎么选？脑裂怎么防？扩缩容怎么做？ 一、主从复制 1.1 架构 1.2 复制原理 二、哨兵（Sentinel） 2.1 架构 2.2 故障转移流程 2.3 Sentin..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"主从复制"}],["meta",{"property":"article:tag","content":"Cluster"}],["meta",{"property":"article:tag","content":"Sentinel"}],["meta",{"property":"article:tag","content":"高可用"}],["meta",{"property":"article:tag","content":"Redis"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":6.75,"words":2026},"filePathRelative":"posts/数据库/redis/Redis 高可用深度对比：哨兵 vs Cluster vs 主从.md","excerpt":"\\n<p>单机 Redis 挂了怎么办？主从复制只是开始。Sentinel 能自动故障转移，Cluster 能水平扩展。三种方案怎么选？脑裂怎么防？扩缩容怎么做？</p>\\n<hr>\\n<h2>一、主从复制</h2>\\n<h3>1.1 架构</h3>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>主从复制架构：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  ┌──────────┐    全量+增量     ┌──────────┐</span></span>\\n<span class=\\"line\\"><span>  │  Master   │ ──────────────→ │  Slave 1  │</span></span>\\n<span class=\\"line\\"><span>  │ (读写)    │                  │ (只读)    │</span></span>\\n<span class=\\"line\\"><span>  └──────────┘                  └──────────┘</span></span>\\n<span class=\\"line\\"><span>       │                             ↑</span></span>\\n<span class=\\"line\\"><span>       │    全量+增量                 │</span></span>\\n<span class=\\"line\\"><span>       ├────────────────────────────→│</span></span>\\n<span class=\\"line\\"><span>       │                             │</span></span>\\n<span class=\\"line\\"><span>       ▼                             ▼</span></span>\\n<span class=\\"line\\"><span>  ┌──────────┐                  ┌──────────┐</span></span>\\n<span class=\\"line\\"><span>  │  Slave 2  │                  │  Slave 3  │</span></span>\\n<span class=\\"line\\"><span>  │ (只读)    │                  │ (只读)    │</span></span>\\n<span class=\\"line\\"><span>  └──────────┘                  └──────────┘</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  读写分离：写 Master，读 Slave</span></span>\\n<span class=\\"line\\"><span>  故障恢复：Master 挂了 → 手动切换 Slave 为 Master（无自动故障转移）</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`Redis 高可用深度对比：哨兵 vs Cluster vs 主从.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="redis-高可用深度对比-哨兵-vs-cluster-vs-主从" tabindex="-1"><a class="header-anchor" href="#redis-高可用深度对比-哨兵-vs-cluster-vs-主从"><span>Redis 高可用深度对比：哨兵 vs Cluster vs 主从</span></a></h1><p>单机 Redis 挂了怎么办？主从复制只是开始。Sentinel 能自动故障转移，Cluster 能水平扩展。三种方案怎么选？脑裂怎么防？扩缩容怎么做？</p><hr><h2 id="一、主从复制" tabindex="-1"><a class="header-anchor" href="#一、主从复制"><span>一、主从复制</span></a></h2><h3 id="_1-1-架构" tabindex="-1"><a class="header-anchor" href="#_1-1-架构"><span>1.1 架构</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>主从复制架构：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────┐    全量+增量     ┌──────────┐</span></span>
<span class="line"><span>  │  Master   │ ──────────────→ │  Slave 1  │</span></span>
<span class="line"><span>  │ (读写)    │                  │ (只读)    │</span></span>
<span class="line"><span>  └──────────┘                  └──────────┘</span></span>
<span class="line"><span>       │                             ↑</span></span>
<span class="line"><span>       │    全量+增量                 │</span></span>
<span class="line"><span>       ├────────────────────────────→│</span></span>
<span class="line"><span>       │                             │</span></span>
<span class="line"><span>       ▼                             ▼</span></span>
<span class="line"><span>  ┌──────────┐                  ┌──────────┐</span></span>
<span class="line"><span>  │  Slave 2  │                  │  Slave 3  │</span></span>
<span class="line"><span>  │ (只读)    │                  │ (只读)    │</span></span>
<span class="line"><span>  └──────────┘                  └──────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  读写分离：写 Master，读 Slave</span></span>
<span class="line"><span>  故障恢复：Master 挂了 → 手动切换 Slave 为 Master（无自动故障转移）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_1-2-复制原理" tabindex="-1"><a class="header-anchor" href="#_1-2-复制原理"><span>1.2 复制原理</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>全量同步（首次连接 / 断线太久）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Slave                          Master</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 1. PSYNC ? -1（不知道Master）│</span></span>
<span class="line"><span>    │ ──────────────────────────→ │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 2. +FULLRESYNC runid offset  │</span></span>
<span class="line"><span>    │ ←──────────────────────────  │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 3. BGSAVE（生成 RDB）         │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 4. 发送 RDB 文件              │</span></span>
<span class="line"><span>    │ ←──────────────────────────  │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 5. 发送缓冲区积压命令          │</span></span>
<span class="line"><span>    │ ←──────────────────────────  │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 6. 加载 RDB + 执行积压命令     │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span></span></span>
<span class="line"><span>增量同步（短暂断线后重连）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Slave                          Master</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 1. PSYNC runid offset        │</span></span>
<span class="line"><span>    │ ──────────────────────────→ │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 2. +CONTINUE                 │</span></span>
<span class="line"><span>    │ ←──────────────────────────  │</span></span>
<span class="line"><span>    │                              │</span></span>
<span class="line"><span>    │ 3. 发送积压缓冲区命令          │</span></span>
<span class="line"><span>    │ ←──────────────────────────  │</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  条件：offset 在 repl_backlog 缓冲区内（默认 1MB）</span></span>
<span class="line"><span>  超出缓冲区 → 降级为全量同步</span></span>
<span class="line"><span></span></span>
<span class="line"><span>关键参数：</span></span>
<span class="line"><span>  repl-backlog-size 1mb     # 积压缓冲区大小（建议调大）</span></span>
<span class="line"><span>  repl-backlog-ttl 3600     # 缓冲区保留时间</span></span>
<span class="line"><span>  repl-timeout 60           # 复制超时（秒）</span></span>
<span class="line"><span>  min-slaves-to-write 1     # 至少 1 个 Slave 同步成功才允许写入</span></span>
<span class="line"><span>  min-slaves-max-lag 10     # Slave 延迟不超过 10s</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、哨兵-sentinel" tabindex="-1"><a class="header-anchor" href="#二、哨兵-sentinel"><span>二、哨兵（Sentinel）</span></a></h2><h3 id="_2-1-架构" tabindex="-1"><a class="header-anchor" href="#_2-1-架构"><span>2.1 架构</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Sentinel 架构：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌───────────┐  ┌───────────┐  ┌───────────┐</span></span>
<span class="line"><span>  │Sentinel 1 │  │Sentinel 2 │  │Sentinel 3 │   ← 奇数个 Sentinel</span></span>
<span class="line"><span>  │ (Monitor) │  │ (Monitor) │  │ (Monitor) │      至少 3 个</span></span>
<span class="line"><span>  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘</span></span>
<span class="line"><span>        │              │              │</span></span>
<span class="line"><span>        │    监控 + 通信  │              │</span></span>
<span class="line"><span>        ├──────────────┼──────────────┤</span></span>
<span class="line"><span>        │              │              │</span></span>
<span class="line"><span>        ▼              ▼              ▼</span></span>
<span class="line"><span>  ┌──────────┐  ┌──────────┐  ┌──────────┐</span></span>
<span class="line"><span>  │  Master   │←─│  Slave 1  │  │  Slave 2  │</span></span>
<span class="line"><span>  │          │  │          │  │          │</span></span>
<span class="line"><span>  └──────────┘  └──────────┘  └──────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Sentinel 职责：</span></span>
<span class="line"><span>    1. 监控 Master/Slave 存活状态</span></span>
<span class="line"><span>    2. 通知运维（API / 通知）</span></span>
<span class="line"><span>    3. 自动故障转移（Master 挂 → 选新 Master）</span></span>
<span class="line"><span>    4. 配置中心（客户端连 Sentinel 获取 Master 地址）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-故障转移流程" tabindex="-1"><a class="header-anchor" href="#_2-2-故障转移流程"><span>2.2 故障转移流程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>故障转移全流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 1：主观下线（SDOWN）</span></span>
<span class="line"><span>  Sentinel 每 1s 向 Master 发 PING</span></span>
<span class="line"><span>  超过 down-after-milliseconds（默认 30s）未响应</span></span>
<span class="line"><span>  → Sentinel 标记 Master 为 SDOWN（主观下线）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 2：客观下线（ODOWN）</span></span>
<span class="line"><span>  超过 quorum 个 Sentinel 都标记为 SDOWN</span></span>
<span class="line"><span>  → 标记为 ODOWN（客观下线）</span></span>
<span class="line"><span>  → 开始故障转移</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 3：选举 Leader Sentinel</span></span>
<span class="line"><span>  基于 Raft 协议选出一个 Sentinel 作为 Leader</span></span>
<span class="line"><span>  → 由 Leader 执行故障转移</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 4：选择新 Master</span></span>
<span class="line"><span>  Leader 从 Slave 中选一个晋升为 Master：</span></span>
<span class="line"><span>  筛选条件：</span></span>
<span class="line"><span>    1. 排除断线的 Slave</span></span>
<span class="line"><span>    2. 按 slave-priority（优先级）排序</span></span>
<span class="line"><span>    3. 优先级相同 → 按 replication offset（复制偏移量）排序</span></span>
<span class="line"><span>    4. 偏移量相同 → 按 runid 字典序排序</span></span>
<span class="line"><span>  → 最优 Slave 执行 SLAVEOF NO ONE（晋升为 Master）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 5：通知其他 Slave</span></span>
<span class="line"><span>  Leader 通知其他 Slave：SLAVEOF new_master_ip new_master_port</span></span>
<span class="line"><span>  → 其他 Slave 同步新 Master</span></span>
<span class="line"><span></span></span>
<span class="line"><span>阶段 6：通知客户端</span></span>
<span class="line"><span>  客户端通过订阅 Sentinel 的频道获取 Master 变更通知</span></span>
<span class="line"><span>  → 连接新 Master</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  旧 Master 恢复后 → 自动成为新 Master 的 Slave</span></span>
<span class="line"><span></span></span>
<span class="line"><span>总耗时：down-after-milliseconds + 选举 + 数据同步</span></span>
<span class="line"><span>  约 30-60s（取决于 down-after-milliseconds 配置）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-3-sentinel-配置" tabindex="-1"><a class="header-anchor" href="#_2-3-sentinel-配置"><span>2.3 Sentinel 配置</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># sentinel.conf</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">port</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 26379</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 监控 Master（名称 IP 端口 quorum）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sentinel</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> monitor</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> mymaster</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 192.168.1.10</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 6379</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 2</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 主观下线超时（ms）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sentinel</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> down-after-milliseconds</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> mymaster</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 30000</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 故障转移超时</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sentinel</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> failover-timeout</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> mymaster</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 180000</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 并行同步 Slave 数量</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">sentinel</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> parallel-syncs</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> mymaster</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 至少 3 个 Sentinel，quorum = 2</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 奇数个 Sentinel 防止脑裂</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、cluster" tabindex="-1"><a class="header-anchor" href="#三、cluster"><span>三、Cluster</span></a></h2><h3 id="_3-1-架构" tabindex="-1"><a class="header-anchor" href="#_3-1-架构"><span>3.1 架构</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Redis Cluster 架构（6 个节点：3主3从）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────────────────────────────────────────────┐</span></span>
<span class="line"><span>  │                Redis Cluster                      │</span></span>
<span class="line"><span>  │                                                  │</span></span>
<span class="line"><span>  │   槽位 0-5460          槽位 5461-10922           │</span></span>
<span class="line"><span>  │  ┌──────────┐        ┌──────────┐               │</span></span>
<span class="line"><span>  │  │ Master A  │        │ Master B  │               │</span></span>
<span class="line"><span>  │  │ (0-5460)  │        │(5461-10922)│              │</span></span>
<span class="line"><span>  │  └──────────┘        └──────────┘               │</span></span>
<span class="line"><span>  │       │                    │                     │</span></span>
<span class="line"><span>  │  ┌──────────┐        ┌──────────┐               │</span></span>
<span class="line"><span>  │  │ Slave A&#39;  │        │ Slave B&#39;  │               │</span></span>
<span class="line"><span>  │  └──────────┘        └──────────┘               │</span></span>
<span class="line"><span>  │                                                  │</span></span>
<span class="line"><span>  │           槽位 10923-16383                       │</span></span>
<span class="line"><span>  │        ┌──────────┐                             │</span></span>
<span class="line"><span>  │        │ Master C  │                             │</span></span>
<span class="line"><span>  │        │(10923-    │                             │</span></span>
<span class="line"><span>  │        │ 16383)    │                             │</span></span>
<span class="line"><span>  │        └──────────┘                             │</span></span>
<span class="line"><span>  │             │                                    │</span></span>
<span class="line"><span>  │        ┌──────────┐                             │</span></span>
<span class="line"><span>  │        │ Slave C&#39;  │                             │</span></span>
<span class="line"><span>  │        └──────────┘                             │</span></span>
<span class="line"><span>  │                                                  │</span></span>
<span class="line"><span>  │  共 16384 个槽位（0-16383）                       │</span></span>
<span class="line"><span>  │  每个节点负责一部分槽位                            │</span></span>
<span class="line"><span>  │  Key → CRC16(key) % 16384 → 槽位 → 节点          │</span></span>
<span class="line"><span>  └──────────────────────────────────────────────────┘</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  特点：</span></span>
<span class="line"><span>    - 去中心化（无 Sentinel）</span></span>
<span class="line"><span>    - 节点间 Gossip 协议通信</span></span>
<span class="line"><span>    - 自动故障转移</span></span>
<span class="line"><span>    - 水平扩展</span></span>
<span class="line"><span>    - 客户端直连任意节点</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-槽位与路由" tabindex="-1"><a class="header-anchor" href="#_3-2-槽位与路由"><span>3.2 槽位与路由</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Key 路由计算</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># redis-cli</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&gt; CLUSTER KEYSLOT mykey</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">integer</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">5798</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">   # CRC16(&quot;mykey&quot;) % 16384 = 5798</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 5798 在 Master A 的范围（0-5460）？否</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 5798 在 Master B 的范围（5461-10922）？是</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># → 路由到 Master B</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># MOVED 重定向</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&gt; SET mykey hello</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">error</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">MOVED</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 5798</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.12:6379</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 客户端收到 MOVED → 连接新节点 → 重新发送</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 客户端缓存槽位映射 → 后续请求直接路由</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># ASK 重定向（槽位迁移中）</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&gt; SET mykey hello</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">error</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">) </span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">ASK</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 5798</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.13:6379</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 槽位正在迁移 → 临时重定向</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 客户端不更新缓存 → 下次仍走原节点</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># Hash Tag（保证多 Key 在同一槽位）</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">SET</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> {user:123}:name</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &quot;Alice&quot;</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">SET</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> {user:123}:age</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 30</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># {user:123} 是 Hash Tag</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># CRC16(&quot;user:123&quot;) % 16384 → 同一槽位</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># → 可以在同一节点执行 MGET / 事务 / Pipeline</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-脑裂与处理" tabindex="-1"><a class="header-anchor" href="#_3-3-脑裂与处理"><span>3.3 脑裂与处理</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>脑裂场景：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  网络分区：</span></span>
<span class="line"><span>  ┌──────────────┐         ┌──────────────┐</span></span>
<span class="line"><span>  │  Master A     │  ╳╳╳   │  Slave A&#39;     │</span></span>
<span class="line"><span>  │  (分区1)      │  分区   │  (分区2)      │</span></span>
<span class="line"><span>  │  仍接受写入    │         │  被选为新Master│</span></span>
<span class="line"><span>  └──────────────┘         └──────────────┘</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>  分区1：Master A 还活着，继续接受写入</span></span>
<span class="line"><span>  分区2：Slave A&#39; 被选为新 Master，也接受写入</span></span>
<span class="line"><span>  → 两个 Master 同时写入 → 数据冲突</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Cluster 的处理：</span></span>
<span class="line"><span>  1. Master A 在 cluster-node-timeout（默认 15s）内无法联系多数节点</span></span>
<span class="line"><span>  2. Master A 自行进入错误状态 → 拒绝写入</span></span>
<span class="line"><span>  3. 只有拥有多数分区的节点才能成为 Master</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  但在 timeout 窗口期内仍可能脑裂！</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  额外防护（min-replicas）：</span></span>
<span class="line"><span>  # redis.conf</span></span>
<span class="line"><span>  min-replicas-to-write 1     # 至少 1 个 Slave 在线才允许写入</span></span>
<span class="line"><span>  min-replicas-max-lag 10     # Slave 延迟不超过 10s</span></span>
<span class="line"><span>  → Master A 分区后没有 Slave → 拒绝写入 → 防止脑裂</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-4-扩缩容" tabindex="-1"><a class="header-anchor" href="#_3-4-扩缩容"><span>3.4 扩缩容</span></a></h3><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-bash"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 扩容：添加新节点</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 1. 启动新 Redis 节点</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">redis-server</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --port</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 6380</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --cluster-enabled</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> yes</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 2. 加入集群</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">redis-cli</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --cluster</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> add-node</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.14:6380</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.10:6379</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 新节点作为 Master 加入，但没有槽位</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 3. 迁移槽位</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">redis-cli</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --cluster</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> reshard</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.10:6379</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 交互式：</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">#   迁移多少槽位？4096（让新节点负责 4096 个）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">#   接收节点ID？新节点的 ID</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">#   源节点？all（从所有节点迁移）</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 槽位迁移过程（逐个 Key 迁移）：</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 1. CLUSTER SETSLOT &lt;slot&gt; MIGRATING &lt;target_node&gt;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 2. CLUSTER SETSLOT &lt;slot&gt; IMPORTING &lt;source_node&gt;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 3. MIGRATE source_host source_port &quot;&quot; 0 0 KEYS key1 key2 ...</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 4. CLUSTER SETSLOT &lt;slot&gt; NODE &lt;target_node&gt;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 缩容：移除节点</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 1. 先迁移该节点的槽位到其他节点</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">redis-cli</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --cluster</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> reshard</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.10:6379</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">#   迁移该节点的所有槽位到其他节点</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 2. 移除节点</span></span>
<span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">redis-cli</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> --cluster</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> del-node</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> 192.168.1.10:6379</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &lt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">node_i</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">d&gt;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、三种方案对比" tabindex="-1"><a class="header-anchor" href="#四、三种方案对比"><span>四、三种方案对比</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>              主从          Sentinel        Cluster</span></span>
<span class="line"><span>─────────────────────────────────────────────────────</span></span>
<span class="line"><span>数据分片        ✗             ✗               ✓</span></span>
<span class="line"><span>自动故障转移    ✗（手动）      ✓               ✓</span></span>
<span class="line"><span>水平扩展        ✗             ✗               ✓</span></span>
<span class="line"><span>写入容量        单 Master     单 Master       多 Master</span></span>
<span class="line"><span>读扩展          ✓（Slave）    ✓（Slave）      ✓（Slave）</span></span>
<span class="line"><span>客户端复杂度    低            中              高（路由）</span></span>
<span class="line"><span>运维复杂度    低             中              高</span></span>
<span class="line"><span>脑裂风险        高             中              低</span></span>
<span class="line"><span>适用数据量     &lt;10GB         &lt;10GB           &gt;10GB</span></span>
<span class="line"><span>适用场景       小项目        中等项目          大规模</span></span>
<span class="line"><span></span></span>
<span class="line"><span>选型建议：</span></span>
<span class="line"><span>  &lt; 10GB + 高可用 → Sentinel</span></span>
<span class="line"><span>  &gt; 10GB 或高写入 → Cluster</span></span>
<span class="line"><span>  简单读写分离 → 主从</span></span>
<span class="line"><span>  云上托管 → 直接用云服务（AWS ElastiCache / 阿里云 Redis）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、面试要点" tabindex="-1"><a class="header-anchor" href="#五、面试要点"><span>五、面试要点</span></a></h2><h3 id="q-sentinel-和-cluster-的区别" tabindex="-1"><a class="header-anchor" href="#q-sentinel-和-cluster-的区别"><span>Q：Sentinel 和 Cluster 的区别？</span></a></h3><ol><li>Sentinel 是主从架构的增强，单 Master 写入，Sentinel 负责监控和故障转移，不支持水平扩展</li><li>Cluster 是多 Master 架构，数据按 16384 槽位分片，支持水平扩展，内置故障转移（无 Sentinel）</li><li>Sentinel 适合 &lt; 10GB 数据量，Cluster 适合大规模数据</li><li>Sentinel 客户端简单（连 Sentinel 获取 Master 地址），Cluster 客户端复杂（需要路由+重定向）</li></ol><h3 id="q-redis-cluster-怎么做数据分片" tabindex="-1"><a class="header-anchor" href="#q-redis-cluster-怎么做数据分片"><span>Q：Redis Cluster 怎么做数据分片？</span></a></h3><p>用 CRC16 算法对 Key 计算，取模 16384 得到槽位号。每个节点负责一部分槽位。客户端缓存槽位映射表，直接路由到对应节点。如果路由错误，节点返回 MOVED 重定向，客户端更新缓存后重试。Hash Tag（<code>{tag}</code>）可以强制多个 Key 到同一槽位，支持多 Key 操作。</p><h3 id="q-redis-脑裂怎么防" tabindex="-1"><a class="header-anchor" href="#q-redis-脑裂怎么防"><span>Q：Redis 脑裂怎么防？</span></a></h3><ol><li>Cluster：<code>cluster-node-timeout</code>（默认 15s）内无法联系多数节点 → Master 进入错误状态拒绝写入</li><li>配合 <code>min-replicas-to-write 1</code> + <code>min-replicas-max-lag 10</code> → 没有 Slave 同步时拒绝写入</li><li>Sentinel 用 quorum 机制确保只有一个 Master 被选出</li></ol><hr><h2 id="六、总结" tabindex="-1"><a class="header-anchor" href="#六、总结"><span>六、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>主从：读写分离，手动故障恢复</span></span>
<span class="line"><span>Sentinel：主从 + 自动故障转移 + 监控，适合中小规模</span></span>
<span class="line"><span>Cluster：分片 + 自动故障转移 + 水平扩展，适合大规模</span></span>
<span class="line"><span></span></span>
<span class="line"><span>核心机制：</span></span>
<span class="line"><span>  主从：RDB 全量 + backlog 增量</span></span>
<span class="line"><span>  Sentinel：SDOWN → ODOWN → Raft 选举 → 故障转移</span></span>
<span class="line"><span>  Cluster：CRC16 % 16384 → 槽位路由 → MOVED/ASK 重定向</span></span>
<span class="line"><span></span></span>
<span class="line"><span>生产建议：</span></span>
<span class="line"><span>  - 至少 3 Sentinel（奇数防脑裂）</span></span>
<span class="line"><span>  - Cluster 至少 6 节点（3主3从）</span></span>
<span class="line"><span>  - 开启 min-replicas 防脑裂</span></span>
<span class="line"><span>  - repl-backlog-size 调大（避免全量同步）</span></span>
<span class="line"><span>  - 监控 Master 延迟和 Slave 同步状态</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,40)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};