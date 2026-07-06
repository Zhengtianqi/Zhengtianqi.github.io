import{n as e,o as t,r as n}from"./app-CS-P9NMX.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E7%BD%91%E7%BB%9C/TCP%20%E6%8B%A5%E5%A1%9E%E6%8E%A7%E5%88%B6%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90%EF%BC%9A%E6%85%A2%E5%90%AF%E5%8A%A8%E3%80%81%E6%8B%A5%E5%A1%9E%E9%81%BF%E5%85%8D%E3%80%81%E5%BF%AB%E9%87%8D%E4%BC%A0%E3%80%81%E5%BF%AB%E6%81%A2%E5%A4%8D.html","title":"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复","lang":"zh-CN","frontmatter":{"title":"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复","tag":["TCP","拥塞控制","慢启动","网络","拥塞避免"],"category":"基础知识","date":"2026-07-03T00:00:00.000Z","description":"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复 TCP 怎么判断网络拥塞？为什么不是一上来就全速发？慢启动到底有多&quot;慢&quot;？四个算法如何协作？从原理到代码，一篇搞懂 TCP 拥塞控制。 一、为什么需要拥塞控制 二、核心概念 三、四大算法 3.1 慢启动（Slow Start） 3.2 拥塞避免（Congestion Avo...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E7%BD%91%E7%BB%9C/TCP%20%E6%8B%A5%E5%A1%9E%E6%8E%A7%E5%88%B6%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90%EF%BC%9A%E6%85%A2%E5%90%AF%E5%8A%A8%E3%80%81%E6%8B%A5%E5%A1%9E%E9%81%BF%E5%85%8D%E3%80%81%E5%BF%AB%E9%87%8D%E4%BC%A0%E3%80%81%E5%BF%AB%E6%81%A2%E5%A4%8D.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复"}],["meta",{"property":"og:description","content":"TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复 TCP 怎么判断网络拥塞？为什么不是一上来就全速发？慢启动到底有多&quot;慢&quot;？四个算法如何协作？从原理到代码，一篇搞懂 TCP 拥塞控制。 一、为什么需要拥塞控制 二、核心概念 三、四大算法 3.1 慢启动（Slow Start） 3.2 拥塞避免（Congestion Avo..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"拥塞避免"}],["meta",{"property":"article:tag","content":"网络"}],["meta",{"property":"article:tag","content":"慢启动"}],["meta",{"property":"article:tag","content":"拥塞控制"}],["meta",{"property":"article:tag","content":"TCP"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":7.84,"words":2352},"filePathRelative":"posts/基础知识/网络/TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复.md","excerpt":"\\n<p>TCP 怎么判断网络拥塞？为什么不是一上来就全速发？慢启动到底有多&quot;慢&quot;？四个算法如何协作？从原理到代码，一篇搞懂 TCP 拥塞控制。</p>\\n<hr>\\n<h2>一、为什么需要拥塞控制</h2>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>没有拥塞控制的后果：</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  场景：100 个发送方同时向同一个路由器发数据</span></span>\\n<span class=\\"line\\"><span>  路由器缓冲区有限 → 缓冲区满 → 丢包</span></span>\\n<span class=\\"line\\"><span>  发送方发现丢包 → 重传 → 更多数据 → 更多丢包</span></span>\\n<span class=\\"line\\"><span>  → 拥塞崩溃（Congestion Collapse）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  1986 年 10 月，互联网拥塞崩溃：</span></span>\\n<span class=\\"line\\"><span>    某链路容量 32 kbps → 实际吞吐降到 40 bps</span></span>\\n<span class=\\"line\\"><span>    → 下降 800 倍！</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  TCP 拥塞控制目标：</span></span>\\n<span class=\\"line\\"><span>    1. 避免网络拥塞（不发包太多）</span></span>\\n<span class=\\"line\\"><span>    2. 公平分享带宽（不发包太少）</span></span>\\n<span class=\\"line\\"><span>    3. 快速利用带宽（尽快达到最优速率）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>  核心思想：探测网络容量，逐步增加发送速率</span></span>\\n<span class=\\"line\\"><span>            发现拥塞 → 立即降低速率</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="tcp-拥塞控制深度解析-慢启动、拥塞避免、快重传、快恢复" tabindex="-1"><a class="header-anchor" href="#tcp-拥塞控制深度解析-慢启动、拥塞避免、快重传、快恢复"><span>TCP 拥塞控制深度解析：慢启动、拥塞避免、快重传、快恢复</span></a></h1><p>TCP 怎么判断网络拥塞？为什么不是一上来就全速发？慢启动到底有多&quot;慢&quot;？四个算法如何协作？从原理到代码，一篇搞懂 TCP 拥塞控制。</p><hr><h2 id="一、为什么需要拥塞控制" tabindex="-1"><a class="header-anchor" href="#一、为什么需要拥塞控制"><span>一、为什么需要拥塞控制</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>没有拥塞控制的后果：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  场景：100 个发送方同时向同一个路由器发数据</span></span>
<span class="line"><span>  路由器缓冲区有限 → 缓冲区满 → 丢包</span></span>
<span class="line"><span>  发送方发现丢包 → 重传 → 更多数据 → 更多丢包</span></span>
<span class="line"><span>  → 拥塞崩溃（Congestion Collapse）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  1986 年 10 月，互联网拥塞崩溃：</span></span>
<span class="line"><span>    某链路容量 32 kbps → 实际吞吐降到 40 bps</span></span>
<span class="line"><span>    → 下降 800 倍！</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  TCP 拥塞控制目标：</span></span>
<span class="line"><span>    1. 避免网络拥塞（不发包太多）</span></span>
<span class="line"><span>    2. 公平分享带宽（不发包太少）</span></span>
<span class="line"><span>    3. 快速利用带宽（尽快达到最优速率）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  核心思想：探测网络容量，逐步增加发送速率</span></span>
<span class="line"><span>            发现拥塞 → 立即降低速率</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、核心概念" tabindex="-1"><a class="header-anchor" href="#二、核心概念"><span>二、核心概念</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>cwnd（Congestion Window，拥塞窗口）：</span></span>
<span class="line"><span>  发送方维护的窗口，限制已发送未确认的数据量</span></span>
<span class="line"><span>  实际发送窗口 = min(cwnd, rwnd)</span></span>
<span class="line"><span>  rwnd = 接收方 advertised window（流量控制）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>rwnd（Receiver Window）：</span></span>
<span class="line"><span>  接收方通告的窗口大小（流量控制）</span></span>
<span class="line"><span>  接收方处理不过来时减小 rwnd</span></span>
<span class="line"><span></span></span>
<span class="line"><span>ssthresh（Slow Start Threshold，慢启动阈值）：</span></span>
<span class="line"><span>  慢启动和拥塞避免的分界线</span></span>
<span class="line"><span>  cwnd &lt; ssthresh → 慢启动（指数增长）</span></span>
<span class="line"><span>  cwnd ≥ ssthresh → 拥塞避免（线性增长）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  初始值：ssthresh = 任意大（如 65535 字节）</span></span>
<span class="line"><span>  拥塞时：ssthresh = cwnd / 2</span></span>
<span class="line"><span></span></span>
<span class="line"><span>RTT（Round Trip Time，往返时间）：</span></span>
<span class="line"><span>  发送数据到收到 ACK 的时间</span></span>
<span class="line"><span>  用于计算超时时间 RTO（Retransmission Timeout）</span></span>
<span class="line"><span>  RTO = SRTT + 4 × RTTVAR（平滑 RTT + 4 倍 RTT 偏差）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、四大算法" tabindex="-1"><a class="header-anchor" href="#三、四大算法"><span>三、四大算法</span></a></h2><h3 id="_3-1-慢启动-slow-start" tabindex="-1"><a class="header-anchor" href="#_3-1-慢启动-slow-start"><span>3.1 慢启动（Slow Start）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>慢启动：cwnd 指数增长</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  初始 cwnd = 1 MSS（通常 1460 字节）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  RTT 1: 发送 1 MSS → 收到 ACK → cwnd = 2</span></span>
<span class="line"><span>  RTT 2: 发送 2 MSS → 收到 2 ACK → cwnd = 4</span></span>
<span class="line"><span>  RTT 3: 发送 4 MSS → 收到 4 ACK → cwnd = 8</span></span>
<span class="line"><span>  RTT 4: 发送 8 MSS → 收到 8 ACK → cwnd = 16</span></span>
<span class="line"><span>  RTT 5: 发送 16 MSS → 收到 16 ACK → cwnd = 32</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  时间轴：</span></span>
<span class="line"><span>  cwnd</span></span>
<span class="line"><span>   32 │                    ┌───┐</span></span>
<span class="line"><span>   16 │              ┌─────┘   │</span></span>
<span class="line"><span>    8 │        ┌─────┘         │</span></span>
<span class="line"><span>    4 │   ┌────┘               │</span></span>
<span class="line"><span>    2 │───┘                    │</span></span>
<span class="line"><span>    1 ─┘                       │</span></span>
<span class="line"><span>      └────────────────────────┴──→ RTT</span></span>
<span class="line"><span>       1  2  3  4  5  6</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  特点：</span></span>
<span class="line"><span>    - 每收到一个 ACK，cwnd + 1 MSS</span></span>
<span class="line"><span>    - 每个 RTT 翻倍（指数增长）</span></span>
<span class="line"><span>    - 名字叫&quot;慢&quot;启动，但增长很快</span></span>
<span class="line"><span>    - &quot;慢&quot;是相对于&quot;一开始就全速发&quot;而言的</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  停止条件：</span></span>
<span class="line"><span>    cwnd ≥ ssthresh → 切换到拥塞避免</span></span>
<span class="line"><span>    或检测到丢包 → 降低 cwnd</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-拥塞避免-congestion-avoidance" tabindex="-1"><a class="header-anchor" href="#_3-2-拥塞避免-congestion-avoidance"><span>3.2 拥塞避免（Congestion Avoidance）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>拥塞避免：cwnd 线性增长</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  cwnd ≥ ssthresh 后，每个 RTT cwnd + 1 MSS</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  RTT 6: cwnd = 32 → 发送 32 MSS → 收到 32 ACK → cwnd = 33</span></span>
<span class="line"><span>  RTT 7: cwnd = 33 → 发送 33 MSS → 收到 33 ACK → cwnd = 34</span></span>
<span class="line"><span>  RTT 8: cwnd = 34 → ...</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  时间轴（续慢启动后）：</span></span>
<span class="line"><span>  cwnd</span></span>
<span class="line"><span>   40 │                         ┌──/</span></span>
<span class="line"><span>   35 │                    ┌───/</span></span>
<span class="line"><span>   32 │ ssthresh ──────────┘</span></span>
<span class="line"><span>   16 │              ┌─────</span></span>
<span class="line"><span>    8 │        ┌─────┘</span></span>
<span class="line"><span>    4 │   ┌────┘</span></span>
<span class="line"><span>    2 │───┘</span></span>
<span class="line"><span>    1 ─┘</span></span>
<span class="line"><span>      └──────────────────────────→ RTT</span></span>
<span class="line"><span>       1  2  3  4  5  6  7  8  9</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  特点：</span></span>
<span class="line"><span>    - 每收到一个 ACK，cwnd += 1/cwnd MSS</span></span>
<span class="line"><span>    - 每个 RTT cwnd + 1（线性增长）</span></span>
<span class="line"><span>    - 增长速度远慢于慢启动</span></span>
<span class="line"><span>    - 目的是缓慢探测网络极限</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-快重传-fast-retransmit" tabindex="-1"><a class="header-anchor" href="#_3-3-快重传-fast-retransmit"><span>3.3 快重传（Fast Retransmit）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>快重传：不等超时，收到 3 个重复 ACK 立即重传</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  正常情况：</span></span>
<span class="line"><span>  发送 seq=1 → ACK 2</span></span>
<span class="line"><span>  发送 seq=2 → ACK 3</span></span>
<span class="line"><span>  发送 seq=3 → ACK 4</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  丢包场景（seq=2 丢失）：</span></span>
<span class="line"><span>  发送 seq=1 → ACK 2</span></span>
<span class="line"><span>  发送 seq=2 → 丢失！</span></span>
<span class="line"><span>  发送 seq=3 → ACK 2（重复 ACK #1，期望 2 但收到 3）</span></span>
<span class="line"><span>  发送 seq=4 → ACK 2（重复 ACK #2）</span></span>
<span class="line"><span>  发送 seq=5 → ACK 2（重复 ACK #3）</span></span>
<span class="line"><span>  → 收到 3 个重复 ACK → 立即重传 seq=2（不等超时）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  为什么 3 个重复 ACK？</span></span>
<span class="line"><span>    1 个重复 ACK 可能是乱序（包重新排序）</span></span>
<span class="line"><span>    2 个重复 ACK 可能是乱序</span></span>
<span class="line"><span>    3 个重复 ACK → 很可能是丢包</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  优势：</span></span>
<span class="line"><span>    不需要等 RTO 超时（可能几百毫秒）</span></span>
<span class="line"><span>    收到 3 个重复 ACK 立即重传（通常 1 个 RTT 内）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-4-快恢复-fast-recovery" tabindex="-1"><a class="header-anchor" href="#_3-4-快恢复-fast-recovery"><span>3.4 快恢复（Fast Recovery）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>快恢复：快重传后不回到慢启动，而是减半继续</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  收到 3 个重复 ACK 后：</span></span>
<span class="line"><span>    1. ssthresh = cwnd / 2</span></span>
<span class="line"><span>    2. cwnd = ssthresh（不回到 1）</span></span>
<span class="line"><span>    3. 进入拥塞避免（线性增长）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  对比超时丢包（RTO 超时）：</span></span>
<span class="line"><span>    1. ssthresh = cwnd / 2</span></span>
<span class="line"><span>    2. cwnd = 1（回到慢启动）</span></span>
<span class="line"><span>    3. 进入慢启动（指数增长）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  为什么快恢复不回到 cwnd=1？</span></span>
<span class="line"><span>    3 个重复 ACK 说明：</span></span>
<span class="line"><span>      - 数据包确实丢失了</span></span>
<span class="line"><span>      - 但后续数据包到达了接收方（否则不会有重复 ACK）</span></span>
<span class="line"><span>      → 网络只是轻度拥塞，不需要大幅降低速率</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  状态转换图：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────┐  cwnd ≥ ssthresh  ┌──────────┐</span></span>
<span class="line"><span>  │ 慢启动    │ ────────────────→ │ 拥塞避免   │</span></span>
<span class="line"><span>  │ (指数)    │ ←──────────────── │ (线性)    │</span></span>
<span class="line"><span>  └──────────┘                   └──────────┘</span></span>
<span class="line"><span>       │                              │</span></span>
<span class="line"><span>       │ RTO 超时                      │ 3次重复ACK</span></span>
<span class="line"><span>       │ cwnd=1, ssthresh=cwnd/2      │ ssthresh=cwnd/2, cwnd=ssthresh</span></span>
<span class="line"><span>       │                              ▼</span></span>
<span class="line"><span>       │                        ┌──────────┐</span></span>
<span class="line"><span>       └────────────────────────│ 快恢复    │</span></span>
<span class="line"><span>                                │ (线性)    │</span></span>
<span class="line"><span>                                └──────────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、完整流程示例" tabindex="-1"><a class="header-anchor" href="#四、完整流程示例"><span>四、完整流程示例</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>完整拥塞控制流程：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>cwnd</span></span>
<span class="line"><span> 64 │          ┌──┐         ┌──/</span></span>
<span class="line"><span> 32 │     ┌────┘  │    ┌────┘  ──── 拥塞避免</span></span>
<span class="line"><span> 16 │   ┌─┘       │  ┌─┘</span></span>
<span class="line"><span>  8 │ ┌─┘         │ ┌┘         ssthresh = 32 → 16</span></span>
<span class="line"><span>  4 │─┘           │└┘           cwnd = 16</span></span>
<span class="line"><span>  2 │             │</span></span>
<span class="line"><span>  1 │             │</span></span>
<span class="line"><span>    └─────────────┴──────────────→ RTT</span></span>
<span class="line"><span>     1 2 3 4 5  6 7 8 9 10 11</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  RTT 1-5: 慢启动（cwnd: 1→2→4→8→16→32）</span></span>
<span class="line"><span>  RTT 5: cwnd=32 ≥ ssthresh=32 → 切换拥塞避免</span></span>
<span class="line"><span>  RTT 6: 拥塞避免 cwnd=33（收到 3 个重复 ACK）</span></span>
<span class="line"><span>  RTT 6: 快重传 + 快恢复</span></span>
<span class="line"><span>    ssthresh = 33/2 = 16</span></span>
<span class="line"><span>    cwnd = 16 → 进入拥塞避免</span></span>
<span class="line"><span>  RTT 7-11: 拥塞避免（cwnd: 16→17→18→19→20）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  如果 RTT 10 发生 RTO 超时：</span></span>
<span class="line"><span>    ssthresh = 20/2 = 10</span></span>
<span class="line"><span>    cwnd = 1 → 回到慢启动</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、现代拥塞控制算法" tabindex="-1"><a class="header-anchor" href="#五、现代拥塞控制算法"><span>五、现代拥塞控制算法</span></a></h2><h3 id="_5-1-reno-newreno" tabindex="-1"><a class="header-anchor" href="#_5-1-reno-newreno"><span>5.1 Reno / NewReno</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Reno（1988）：</span></span>
<span class="line"><span>  四大算法的经典实现</span></span>
<span class="line"><span>  慢启动 + 拥塞避免 + 快重传 + 快恢复</span></span>
<span class="line"><span>  → 互联网标准，TCP 默认</span></span>
<span class="line"><span></span></span>
<span class="line"><span>NewReno（1999）：</span></span>
<span class="line"><span>  Reno 的改进版</span></span>
<span class="line"><span>  处理一个窗口内多个丢包</span></span>
<span class="line"><span>  → 避免 Reno 的多次快重传降低 cwnd 过多</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-cubic" tabindex="-1"><a class="header-anchor" href="#_5-2-cubic"><span>5.2 Cubic</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Cubic（Linux 默认，2008-2024）：</span></span>
<span class="line"><span>  cwnd 增长不是线性，而是三次函数（cubic curve）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  cwnd(t) = C × (t - K)³ + W_max</span></span>
<span class="line"><span>  C = 0.4（常数）</span></span>
<span class="line"><span>  K = (W_max × β / C)^(1/3)</span></span>
<span class="line"><span>  β = 0.7（乘性减少因子）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  特点：</span></span>
<span class="line"><span>    - 拥塞后快速恢复到之前的水位</span></span>
<span class="line"><span>    - 在高 RTT 链路上表现更好</span></span>
<span class="line"><span>    - 比 Reno 更激进</span></span>
<span class="line"><span>    - Linux 2.6.19 起默认</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  曲线：</span></span>
<span class="line"><span>  cwnd</span></span>
<span class="line"><span>       │        ┌───┐</span></span>
<span class="line"><span>       │      ┌─┘   └─┐</span></span>
<span class="line"><span>       │    ┌─┘       └─┐</span></span>
<span class="line"><span>       │  ┌─┘           └─→</span></span>
<span class="line"><span>       │┌─┘</span></span>
<span class="line"><span>       └──────────────────→ time</span></span>
<span class="line"><span>         超时后快速爬升 → 然后放缓 → 再加速</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-3-bbr" tabindex="-1"><a class="header-anchor" href="#_5-3-bbr"><span>5.3 BBR</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>BBR（Bottleneck Bandwidth and RTT，Google 2016）：</span></span>
<span class="line"><span>  不基于丢包的拥塞控制</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  传统算法（Reno/Cubic）：</span></span>
<span class="line"><span>    把丢包当作拥塞信号</span></span>
<span class="line"><span>    问题：现代网络交换机有大缓冲区 → 丢包前缓冲区已满 → 延迟暴增</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  BBR 理念：</span></span>
<span class="line"><span>    探测瓶颈带宽和最小 RTT</span></span>
<span class="line"><span>    cwnd = BtlBw × minRTT</span></span>
<span class="line"><span>    不依赖丢包判断拥塞</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  四个阶段：</span></span>
<span class="line"><span>    1. Startup：指数增长，探测 BtlBw</span></span>
<span class="line"><span>    2. Drain：排空缓冲区队列</span></span>
<span class="line"><span>    3. ProbeBW：稳态，周期性探测带宽</span></span>
<span class="line"><span>    4. ProbeRTT：周期性探测最小 RTT</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  优势：</span></span>
<span class="line"><span>    - 高带宽长 RTT 链路性能更好</span></span>
<span class="line"><span>    - 不填满缓冲区 → 延迟更低</span></span>
<span class="line"><span>    - 公平性好</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Linux 启用 BBR：</span></span>
<span class="line"><span>    sysctl net.ipv4.tcp_congestion_control=bbr</span></span>
<span class="line"><span>    # 内核 4.9+ 支持</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-4-算法对比" tabindex="-1"><a class="header-anchor" href="#_5-4-算法对比"><span>5.4 算法对比</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>              Reno        Cubic       BBR</span></span>
<span class="line"><span>──────────────────────────────────────────────</span></span>
<span class="line"><span>判断拥塞      丢包         丢包         延迟+带宽</span></span>
<span class="line"><span>cwnd 增长     线性         三次函数     基于模型</span></span>
<span class="line"><span>缓冲区利用    高           高           低</span></span>
<span class="line"><span>高 RTT 性能   差           好           好</span></span>
<span class="line"><span>公平性        好           一般         一般</span></span>
<span class="line"><span>Linux 默认    &lt; 2.6.19    2.6.19+     需手动开启</span></span>
<span class="line"><span>适用          通用         通用         高带宽/长 RTT</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、java-网络编程中的-tcp-调优" tabindex="-1"><a class="header-anchor" href="#六、java-网络编程中的-tcp-调优"><span>六、Java 网络编程中的 TCP 调优</span></a></h2><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-java"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// Java Socket TCP 参数设置</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">Socket</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> socket </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> new</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> Socket</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">()</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 连接前设置参数</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// TCP_NODELAY：禁用 Nagle 算法</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// Nagle 算法：小包合并，减少网络包数量</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 禁用后：小包立即发送（低延迟场景如游戏/SSH）</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">socket</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setTcpNoDelay</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// SO_SNDBUF / SO_RCVBUF：发送/接收缓冲区大小</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">socket</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setSendBufferSize</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">64</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> *</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1024</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">   // 64 KB</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">socket</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setReceiveBufferSize</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">64</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> *</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1024</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"> // 64 KB</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// SO_TIMEOUT：读超时</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">socket</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setSoTimeout</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">5000</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  // 5 秒</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// KeepAlive：TCP 保活</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">socket</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setKeepAlive</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// Linux 系统级 TCP 调优</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// /etc/sysctl.conf</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.ipv4.tcp_congestion_control = bbr  # 使用 BBR</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.core.rmem_max = 16777216           # 最大接收缓冲区</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.core.wmem_max = 16777216           # 最大发送缓冲区</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.ipv4.tcp_rmem = 4096 87380 16777216  # 接收缓冲区 min/default/max</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.ipv4.tcp_wmem = 4096 65536 16777216  # 发送缓冲区 min/default/max</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// net.ipv4.tcp_slow_start_after_idle = 0    # 禁用空闲后慢启动</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="七、面试要点" tabindex="-1"><a class="header-anchor" href="#七、面试要点"><span>七、面试要点</span></a></h2><h3 id="q-tcp-拥塞控制四个算法" tabindex="-1"><a class="header-anchor" href="#q-tcp-拥塞控制四个算法"><span>Q：TCP 拥塞控制四个算法？</span></a></h3><ol><li>慢启动：cwnd 从 1 开始，每个 RTT 翻倍（指数增长），直到 ssthresh</li><li>拥塞避免：cwnd ≥ ssthresh 后，每个 RTT +1 MSS（线性增长）</li><li>快重传：收到 3 个重复 ACK → 立即重传丢失包（不等超时）</li><li>快恢复：快重传后 ssthresh = cwnd/2，cwnd = ssthresh（不回到 1，继续拥塞避免）</li></ol><h3 id="q-快恢复和超时处理的区别" tabindex="-1"><a class="header-anchor" href="#q-快恢复和超时处理的区别"><span>Q：快恢复和超时处理的区别？</span></a></h3><p>3 个重复 ACK（快重传）：说明只有个别包丢失，后续包仍能到达，网络只是轻度拥塞。ssthresh = cwnd/2，cwnd = ssthresh，继续拥塞避免（不回到慢启动）。</p><p>RTO 超时：说明网络严重拥塞，可能多个包丢失。ssthresh = cwnd/2，cwnd = 1，回到慢启动重新探测。</p><h3 id="q-bbr-算法的优势" tabindex="-1"><a class="header-anchor" href="#q-bbr-算法的优势"><span>Q：BBR 算法的优势？</span></a></h3><p>传统算法（Reno/Cubic）基于丢包判断拥塞：有丢包就降速。但现代网络交换机有大缓冲区，丢包前缓冲区已满导致延迟暴增（Bufferbloat）。BBR 通过探测瓶颈带宽（BtlBw）和最小 RTT 来计算最优 cwnd，不依赖丢包信号。优势：高带宽长 RTT 链路性能更好、延迟更低、不完全填满缓冲区。</p><hr><h2 id="八、总结" tabindex="-1"><a class="header-anchor" href="#八、总结"><span>八、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>TCP 拥塞控制 = 慢启动 + 拥塞避免 + 快重传 + 快恢复</span></span>
<span class="line"><span></span></span>
<span class="line"><span>慢启动：cwnd 指数增长（每 RTT 翻倍），cwnd &lt; ssthresh</span></span>
<span class="line"><span>拥塞避免：cwnd 线性增长（每 RTT +1），cwnd ≥ ssthresh</span></span>
<span class="line"><span>快重传：3 个重复 ACK → 立即重传</span></span>
<span class="line"><span>快恢复：ssthresh=cwnd/2, cwnd=ssthresh（不回到 1）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>两个降低 cwnd 的场景：</span></span>
<span class="line"><span>  3 次重复 ACK → 快恢复（cwnd 减半）</span></span>
<span class="line"><span>  RTO 超时 → 慢启动（cwnd=1）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>算法演进：Reno → Cubic（Linux 默认）→ BBR（Google）</span></span>
<span class="line"><span>  Reno：基于丢包，线性增长</span></span>
<span class="line"><span>  Cubic：三次函数增长，更快恢复</span></span>
<span class="line"><span>  BBR：基于带宽+RTT，不依赖丢包，低延迟</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,46)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};