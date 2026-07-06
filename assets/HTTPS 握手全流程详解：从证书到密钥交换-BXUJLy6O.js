import{n as e,o as t,r as n}from"./app-CS-P9NMX.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E7%BD%91%E7%BB%9C/HTTPS%20%E6%8F%A1%E6%89%8B%E5%85%A8%E6%B5%81%E7%A8%8B%E8%AF%A6%E8%A7%A3%EF%BC%9A%E4%BB%8E%E8%AF%81%E4%B9%A6%E5%88%B0%E5%AF%86%E9%92%A5%E4%BA%A4%E6%8D%A2.html","title":"HTTPS 握手全流程详解：从证书到密钥交换","lang":"zh-CN","frontmatter":{"title":"HTTPS 握手全流程详解：从证书到密钥交换","tag":["HTTPS","TLS","证书","密钥交换","网络安全"],"category":"基础知识","date":"2026-07-03T00:00:00.000Z","description":"HTTPS 握手全流程详解：从证书到密钥交换 HTTPS 比 HTTP 多了什么？TLS 握手到底握了几次手？证书链怎么验证？ECDHE 为什么比 RSA 更安全？一张图看懂全流程，从原理到代码。 一、HTTPS = HTTP + TLS 二、TLS 1.2 握手全流程 2.1 完整流程图 2.2 密钥推导过程 三、证书链验证 3.1 证书结构 3.2...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"HTTPS 握手全流程详解：从证书到密钥交换\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-07-03T00:00:00.000Z\\",\\"dateModified\\":\\"2026-07-03T15:37:04.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/%E7%BD%91%E7%BB%9C/HTTPS%20%E6%8F%A1%E6%89%8B%E5%85%A8%E6%B5%81%E7%A8%8B%E8%AF%A6%E8%A7%A3%EF%BC%9A%E4%BB%8E%E8%AF%81%E4%B9%A6%E5%88%B0%E5%AF%86%E9%92%A5%E4%BA%A4%E6%8D%A2.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"HTTPS 握手全流程详解：从证书到密钥交换"}],["meta",{"property":"og:description","content":"HTTPS 握手全流程详解：从证书到密钥交换 HTTPS 比 HTTP 多了什么？TLS 握手到底握了几次手？证书链怎么验证？ECDHE 为什么比 RSA 更安全？一张图看懂全流程，从原理到代码。 一、HTTPS = HTTP + TLS 二、TLS 1.2 握手全流程 2.1 完整流程图 2.2 密钥推导过程 三、证书链验证 3.1 证书结构 3.2..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-07-03T15:37:04.000Z"}],["meta",{"property":"article:tag","content":"网络安全"}],["meta",{"property":"article:tag","content":"密钥交换"}],["meta",{"property":"article:tag","content":"证书"}],["meta",{"property":"article:tag","content":"TLS"}],["meta",{"property":"article:tag","content":"HTTPS"}],["meta",{"property":"article:published_time","content":"2026-07-03T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-07-03T15:37:04.000Z"}]]},"git":{"createdTime":1783093024000,"updatedTime":1783093024000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":1,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":7.67,"words":2301},"filePathRelative":"posts/基础知识/网络/HTTPS 握手全流程详解：从证书到密钥交换.md","excerpt":"\\n<p>HTTPS 比 HTTP 多了什么？TLS 握手到底握了几次手？证书链怎么验证？ECDHE 为什么比 RSA 更安全？一张图看懂全流程，从原理到代码。</p>\\n<hr>\\n<h2>一、HTTPS = HTTP + TLS</h2>\\n<div class=\\"language- line-numbers-mode\\" data-highlighter=\\"shiki\\" data-ext style=\\"--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34\\"><pre class=\\"shiki shiki-themes one-light one-dark-pro vp-code\\"><code class=\\"language-\\"><span class=\\"line\\"><span>HTTP（明文传输）：</span></span>\\n<span class=\\"line\\"><span>  Client ←──────────── HTTP ────────────→ Server</span></span>\\n<span class=\\"line\\"><span>  风险：窃听、篡改、伪造</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>HTTPS（加密传输）：</span></span>\\n<span class=\\"line\\"><span>  Client ←── TLS 握手 ──→ Server（建立加密通道）</span></span>\\n<span class=\\"line\\"><span>  Client ←── 加密 HTTP ──→ Server（密文传输）</span></span>\\n<span class=\\"line\\"><span>  解决：加密（防窃听）、校验（防篡改）、证书（防伪造）</span></span>\\n<span class=\\"line\\"><span></span></span>\\n<span class=\\"line\\"><span>TLS 版本演进：</span></span>\\n<span class=\\"line\\"><span>  SSL 3.0 (1996)    → 已废弃（POODLE 攻击）</span></span>\\n<span class=\\"line\\"><span>  TLS 1.0 (1999)    → 已废弃</span></span>\\n<span class=\\"line\\"><span>  TLS 1.1 (2006)    → 已废弃</span></span>\\n<span class=\\"line\\"><span>  TLS 1.2 (2008)    → 主流（2-RTT 握手）</span></span>\\n<span class=\\"line\\"><span>  TLS 1.3 (2018)    → 最新（1-RTT 握手，0-RTT 恢复）</span></span></code></pre>\\n<div class=\\"line-numbers\\" aria-hidden=\\"true\\" style=\\"counter-reset:line-number 0\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}`),a={name:`HTTPS 握手全流程详解：从证书到密钥交换.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="https-握手全流程详解-从证书到密钥交换" tabindex="-1"><a class="header-anchor" href="#https-握手全流程详解-从证书到密钥交换"><span>HTTPS 握手全流程详解：从证书到密钥交换</span></a></h1><p>HTTPS 比 HTTP 多了什么？TLS 握手到底握了几次手？证书链怎么验证？ECDHE 为什么比 RSA 更安全？一张图看懂全流程，从原理到代码。</p><hr><h2 id="一、https-http-tls" tabindex="-1"><a class="header-anchor" href="#一、https-http-tls"><span>一、HTTPS = HTTP + TLS</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>HTTP（明文传输）：</span></span>
<span class="line"><span>  Client ←──────────── HTTP ────────────→ Server</span></span>
<span class="line"><span>  风险：窃听、篡改、伪造</span></span>
<span class="line"><span></span></span>
<span class="line"><span>HTTPS（加密传输）：</span></span>
<span class="line"><span>  Client ←── TLS 握手 ──→ Server（建立加密通道）</span></span>
<span class="line"><span>  Client ←── 加密 HTTP ──→ Server（密文传输）</span></span>
<span class="line"><span>  解决：加密（防窃听）、校验（防篡改）、证书（防伪造）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>TLS 版本演进：</span></span>
<span class="line"><span>  SSL 3.0 (1996)    → 已废弃（POODLE 攻击）</span></span>
<span class="line"><span>  TLS 1.0 (1999)    → 已废弃</span></span>
<span class="line"><span>  TLS 1.1 (2006)    → 已废弃</span></span>
<span class="line"><span>  TLS 1.2 (2008)    → 主流（2-RTT 握手）</span></span>
<span class="line"><span>  TLS 1.3 (2018)    → 最新（1-RTT 握手，0-RTT 恢复）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="二、tls-1-2-握手全流程" tabindex="-1"><a class="header-anchor" href="#二、tls-1-2-握手全流程"><span>二、TLS 1.2 握手全流程</span></a></h2><h3 id="_2-1-完整流程图" tabindex="-1"><a class="header-anchor" href="#_2-1-完整流程图"><span>2.1 完整流程图</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>Client                                          Server</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ──── 1. ClientHello ────────────────────────→ │</span></span>
<span class="line"><span>  │      - TLS 版本（1.2）                         │</span></span>
<span class="line"><span>  │      - 客户端随机数（Client Random, 32 字节）    │</span></span>
<span class="line"><span>  │      - 支持的密码套件列表                        │</span></span>
<span class="line"><span>  │      - 支持的压缩方法                           │</span></span>
<span class="line"><span>  │      - SNI（Server Name Indication）           │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─── 2. ServerHello ────────────────────────  │</span></span>
<span class="line"><span>  │      - TLS 版本                                │</span></span>
<span class="line"><span>  │      - 服务器随机数（Server Random, 32 字节）    │</span></span>
<span class="line"><span>  │      - 选定的密码套件（如 TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256）│</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─── 3. Certificate ────────────────────────  │</span></span>
<span class="line"><span>  │      - 服务器证书（含公钥）                      │</span></span>
<span class="line"><span>  │      - 证书链（中间 CA → 根 CA）                 │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─── 4. ServerKeyExchange ──────────────────  │</span></span>
<span class="line"><span>  │      - ECDHE 参数（曲线类型、公钥）               │</span></span>
<span class="line"><span>  │      - 签名（用服务器私钥对参数签名）              │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─── 5. ServerHelloDone ────────────────────  │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ──── 6. ClientKeyExchange ─────────────────→  │</span></span>
<span class="line"><span>  │      - ECDHE 参数（客户端公钥）                   │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │      [双方计算 Pre-Master Secret]              │</span></span>
<span class="line"><span>  │      [双方计算 Master Secret]                  │</span></span>
<span class="line"><span>  │      [双方生成会话密钥]                         │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ──── 7. ChangeCipherSpec ──────────────────→  │</span></span>
<span class="line"><span>  │      &quot;从现在开始我用加密说话了&quot;                    │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ──── 8. Finished ──────────────────────────→  │</span></span>
<span class="line"><span>  │      - 加密的握手摘要                           │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─── 9. ChangeCipherSpec ───────────────────  │</span></span>
<span class="line"><span>  │ ←─── 10. Finished ──────────────────────────  │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ══════ 加密通信开始 ══════                      │</span></span>
<span class="line"><span>  │ ←══→ Application Data（AES-GCM 加密）════→    │</span></span>
<span class="line"><span></span></span>
<span class="line"><span>握手耗时：2 个 RTT（步骤 1-2 是第 1 个 RTT，步骤 6-10 是第 2 个 RTT）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-2-密钥推导过程" tabindex="-1"><a class="header-anchor" href="#_2-2-密钥推导过程"><span>2.2 密钥推导过程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>1. 两个随机数：</span></span>
<span class="line"><span>   Client Random = Rc（32 字节，客户端生成）</span></span>
<span class="line"><span>   Server Random = Rs（32 字节，服务器生成）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. Pre-Master Secret（PMS）：</span></span>
<span class="line"><span>   ECDHE 方式：通过椭圆曲线 Diffie-Hellman 交换计算</span></span>
<span class="line"><span>   - 服务器生成私钥 d_s，公钥 Q_s = d_s × G</span></span>
<span class="line"><span>   - 客户端生成私钥 d_c，公钥 Q_c = d_c × G</span></span>
<span class="line"><span>   - 双方交换公钥</span></span>
<span class="line"><span>   - PMS = d_c × Q_s = d_s × Q_c（椭圆曲线乘法）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. Master Secret（MS）：</span></span>
<span class="line"><span>   MS = PRF(PMS, &quot;master secret&quot;, Rc || Rs)</span></span>
<span class="line"><span>   = HMAC-SHA256(PMS, &quot;master secret&quot; + Rc + Rs)</span></span>
<span class="line"><span>   长度：48 字节</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. 会话密钥（Key Material）：</span></span>
<span class="line"><span>   Key Block = PRF(MS, &quot;key expansion&quot;, Rs || Rc)</span></span>
<span class="line"><span>   从 Key Block 中切分：</span></span>
<span class="line"><span>   - Client Write MAC Key  → 客户端 MAC 密钥</span></span>
<span class="line"><span>   - Server Write MAC Key  → 服务器 MAC 密钥</span></span>
<span class="line"><span>   - Client Write Key      → 客户端加密密钥</span></span>
<span class="line"><span>   - Server Write Key      → 服务器加密密钥</span></span>
<span class="line"><span>   - Client Write IV       → 客户端初始化向量</span></span>
<span class="line"><span>   - Server Write IV       → 服务器初始化向量</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   AES-GCM 模式不需要单独的 MAC Key（AEAD 自带认证）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="三、证书链验证" tabindex="-1"><a class="header-anchor" href="#三、证书链验证"><span>三、证书链验证</span></a></h2><h3 id="_3-1-证书结构" tabindex="-1"><a class="header-anchor" href="#_3-1-证书结构"><span>3.1 证书结构</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>X.509 证书结构：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  Version: v3</span></span>
<span class="line"><span>  Serial Number: 04:8c:a2:...</span></span>
<span class="line"><span>  Signature Algorithm: SHA256-RSA</span></span>
<span class="line"><span>  Issuer: CN=DigiCert TLS RSA SHA256 2020 CA1  ← 签发者</span></span>
<span class="line"><span>  Validity:</span></span>
<span class="line"><span>    Not Before: 2024-01-01</span></span>
<span class="line"><span>    Not After:  2025-01-01</span></span>
<span class="line"><span>  Subject: CN=www.example.com  ← 证书持有者</span></span>
<span class="line"><span>  Subject Public Key:</span></span>
<span class="line"><span>    Algorithm: RSA</span></span>
<span class="line"><span>    Key: 2048-bit public key</span></span>
<span class="line"><span>  Extensions:</span></span>
<span class="line"><span>    SAN: www.example.com, example.com  ← 域名</span></span>
<span class="line"><span>    Key Usage: Digital Signature, Key Encipherment</span></span>
<span class="line"><span>    Extended Key Usage: Server Auth</span></span>
<span class="line"><span>  Signature: &lt;DigiCert 的私钥对本证书的签名&gt;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>证书链：</span></span>
<span class="line"><span>  Root CA (自签名)          → 预装在操作系统/浏览器中</span></span>
<span class="line"><span>    └── Intermediate CA     → 由 Root CA 签发</span></span>
<span class="line"><span>          └── Server Cert   → 由 Intermediate CA 签发</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-2-验证流程" tabindex="-1"><a class="header-anchor" href="#_3-2-验证流程"><span>3.2 验证流程</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>客户端收到服务器证书链：[Server Cert, Intermediate CA Cert]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>验证步骤：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 证书有效期检查</span></span>
<span class="line"><span>   当前时间在 Not Before ~ Not After 之间？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. 证书吊销检查</span></span>
<span class="line"><span>   OCSP（在线证书状态协议）→ 实时查询</span></span>
<span class="line"><span>   CRL（证书吊销列表）→ 下载列表检查</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. 域名匹配</span></span>
<span class="line"><span>   证书的 SAN 或 CN 与访问的域名匹配？</span></span>
<span class="line"><span>   www.example.com → SAN 包含 www.example.com</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. 签名验证（从叶子到根）</span></span>
<span class="line"><span>   a. 用 Intermediate CA 的公钥验证 Server Cert 的签名</span></span>
<span class="line"><span>   b. 用 Root CA 的公钥验证 Intermediate CA 的签名</span></span>
<span class="line"><span>   c. Root CA 自签名 → 在信任库中 → 信任</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   信任锚：Root CA 预装在操作系统/浏览器中</span></span>
<span class="line"><span>   信任传递：Root → Intermediate → Server（签名链）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  ┌──────────┐    验证签名    ┌──────────────┐    验证签名    ┌──────────┐</span></span>
<span class="line"><span>  │ Server   │ ←──────────── │ Intermediate  │ ←──────────── │ Root CA  │</span></span>
<span class="line"><span>  │ Cert     │               │ CA Cert       │               │ (信任锚)  │</span></span>
<span class="line"><span>  └──────────┘               └──────────────┘               └──────────┘</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-3-证书类型" tabindex="-1"><a class="header-anchor" href="#_3-3-证书类型"><span>3.3 证书类型</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>DV（Domain Validation）：</span></span>
<span class="line"><span>  只验证域名所有权</span></span>
<span class="line"><span>  签发快（几分钟）</span></span>
<span class="line"><span>  便宜/免费（Let&#39;s Encrypt）</span></span>
<span class="line"><span>  → 个人网站、测试</span></span>
<span class="line"><span></span></span>
<span class="line"><span>OV（Organization Validation）：</span></span>
<span class="line"><span>  验证域名 + 组织信息</span></span>
<span class="line"><span>  签发慢（1-3 天）</span></span>
<span class="line"><span>  证书中包含公司名称</span></span>
<span class="line"><span>  → 企业网站</span></span>
<span class="line"><span></span></span>
<span class="line"><span>EV（Extended Validation）：</span></span>
<span class="line"><span>  严格验证（公司注册、电话验证等）</span></span>
<span class="line"><span>  签发慢（1-2 周）</span></span>
<span class="line"><span>  浏览器显示公司名（旧版地址栏绿色）</span></span>
<span class="line"><span>  → 金融、电商</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="四、密钥交换算法" tabindex="-1"><a class="header-anchor" href="#四、密钥交换算法"><span>四、密钥交换算法</span></a></h2><h3 id="_4-1-rsa-密钥交换-已弃用" tabindex="-1"><a class="header-anchor" href="#_4-1-rsa-密钥交换-已弃用"><span>4.1 RSA 密钥交换（已弃用）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>RSA 密钥交换流程：</span></span>
<span class="line"><span>  1. 客户端生成 Pre-Master Secret（48 字节随机数）</span></span>
<span class="line"><span>  2. 用服务器公钥加密 PMS（RSA 加密）</span></span>
<span class="line"><span>  3. 发送加密后的 PMS 给服务器</span></span>
<span class="line"><span>  4. 服务器用私钥解密得到 PMS</span></span>
<span class="line"><span>  5. 双方用 PMS + Client Random + Server Random 计算 Master Secret</span></span>
<span class="line"><span></span></span>
<span class="line"><span>问题：</span></span>
<span class="line"><span>  ✗ 不具备前向安全（Forward Secrecy）</span></span>
<span class="line"><span>  ✗ 如果服务器私钥泄露 → 历史所有通信可解密</span></span>
<span class="line"><span>  ✗ TLS 1.3 已移除 RSA 密钥交换</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-2-ecdhe-密钥交换-推荐" tabindex="-1"><a class="header-anchor" href="#_4-2-ecdhe-密钥交换-推荐"><span>4.2 ECDHE 密钥交换（推荐）</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>ECDHE（Elliptic Curve Diffie-Hellman Ephemeral）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  服务器：</span></span>
<span class="line"><span>    生成临时私钥 d_s（每次握手重新生成）</span></span>
<span class="line"><span>    公钥 Q_s = d_s × G（G 是椭圆曲线基点）</span></span>
<span class="line"><span>    发送 Q_s 给客户端</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  客户端：</span></span>
<span class="line"><span>    生成临时私钥 d_c（每次握手重新生成）</span></span>
<span class="line"><span>    公钥 Q_c = d_c × G</span></span>
<span class="line"><span>    发送 Q_c 给服务器</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  双方计算：</span></span>
<span class="line"><span>    服务器：PMS = d_s × Q_c = d_s × d_c × G</span></span>
<span class="line"><span>    客户端：PMS = d_c × Q_s = d_c × d_s × G</span></span>
<span class="line"><span>    → 两者相等！这就是 Pre-Master Secret</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  前向安全：</span></span>
<span class="line"><span>    d_s 和 d_c 是临时的，握手后销毁</span></span>
<span class="line"><span>    私钥泄露也无法解密历史通信（因为不知道临时的 d_s/d_c）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>  常用曲线：</span></span>
<span class="line"><span>    X25519（推荐， fastest）</span></span>
<span class="line"><span>    P-256（NIST 标准曲线）</span></span>
<span class="line"><span>    P-384</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_4-3-rsa-vs-ecdhe-对比" tabindex="-1"><a class="header-anchor" href="#_4-3-rsa-vs-ecdhe-对比"><span>4.3 RSA vs ECDHE 对比</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>                RSA 密钥交换        ECDHE</span></span>
<span class="line"><span>前向安全          ✗ 不支持            ✓ 支持</span></span>
<span class="line"><span>私钥用途          加密 + 签名          仅签名</span></span>
<span class="line"><span>性能              RSA 解密慢           ECDHE 快</span></span>
<span class="line"><span>TLS 1.3           ✗ 已移除            ✓ 支持</span></span>
<span class="line"><span>安全性            低（私钥泄露=全暴露）  高（临时密钥）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>结论：TLS 1.2 应使用 ECDHE，TLS 1.3 强制使用 ECDHE</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="五、tls-1-3-改进" tabindex="-1"><a class="header-anchor" href="#五、tls-1-3-改进"><span>五、TLS 1.3 改进</span></a></h2><h3 id="_5-1-1-rtt-握手" tabindex="-1"><a class="header-anchor" href="#_5-1-1-rtt-握手"><span>5.1 1-RTT 握手</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>TLS 1.3 握手（1-RTT）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Client                                          Server</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ── ClientHello ────────────────────────────→ │</span></span>
<span class="line"><span>  │    - TLS 1.3                                 │</span></span>
<span class="line"><span>  │    - Client Random                            │</span></span>
<span class="line"><span>  │    - 密码套件                                  │</span></span>
<span class="line"><span>  │    - Key Share（ECDHE 公钥，提前发送！）         │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─ ServerHello ────────────────────────────  │</span></span>
<span class="line"><span>  │    - Server Random                            │</span></span>
<span class="line"><span>  │    - 选定密码套件                               │</span></span>
<span class="line"><span>  │    - Key Share（ECDHE 公钥）                   │</span></span>
<span class="line"><span>  │    [双方已有足够信息计算密钥]                     │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ←─ EncryptedExtensions ────────────────────  │ ← 后续全部加密！</span></span>
<span class="line"><span>  │ ←─ Certificate ────────────────────────────  │</span></span>
<span class="line"><span>  │ ←─ CertificateVerify ──────────────────────  │</span></span>
<span class="line"><span>  │ ←─ Finished ───────────────────────────────  │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ── Finished ───────────────────────────────→ │</span></span>
<span class="line"><span>  │                                               │</span></span>
<span class="line"><span>  │ ══════ 加密通信开始 ══════                     │</span></span>
<span class="line"><span></span></span>
<span class="line"><span>对比 TLS 1.2：</span></span>
<span class="line"><span>  TLS 1.2：2-RTT（握手 4 次往返）</span></span>
<span class="line"><span>  TLS 1.3：1-RTT（握手 2 次往返）</span></span>
<span class="line"><span>  </span></span>
<span class="line"><span>节省的关键：ClientHello 时就带上 Key Share，不需要等 ServerHello 后再交换</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_5-2-0-rtt-恢复" tabindex="-1"><a class="header-anchor" href="#_5-2-0-rtt-恢复"><span>5.2 0-RTT 恢复</span></a></h3><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>TLS 1.3 Session Resumption（0-RTT）：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>首次连接：正常 1-RTT 握手 + 服务器下发 Session Ticket</span></span>
<span class="line"><span>后续连接（0-RTT）：</span></span>
<span class="line"><span>  Client                                        Server</span></span>
<span class="line"><span>    │                                               │</span></span>
<span class="line"><span>    │ ── ClientHello + 0-RTT 数据 ──────────────→ │</span></span>
<span class="line"><span>    │    (Application Data 同时发送！)               │</span></span>
<span class="line"><span>    │                                               │</span></span>
<span class="line"><span>    │ ←─ ServerHello + 加密数据 ─────────────────  │</span></span>
<span class="line"><span>    │                                               │</span></span>
<span class="line"><span></span></span>
<span class="line"><span>0-RTT 限制：</span></span>
<span class="line"><span>  ✗ 只能用于 GET 等幂等请求（有重放攻击风险）</span></span>
<span class="line"><span>  ✗ 0-RTT 数据可能被攻击者重放</span></span>
<span class="line"><span>  ✓ 适合 HTTP GET、CDN 静态资源等</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="六、java-实现-https" tabindex="-1"><a class="header-anchor" href="#六、java-实现-https"><span>六、Java 实现 HTTPS</span></a></h2><h3 id="_6-1-httpsurlconnection" tabindex="-1"><a class="header-anchor" href="#_6-1-httpsurlconnection"><span>6.1 HttpsURLConnection</span></a></h3><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-java"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 默认信任系统证书库</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">URL</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> url </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> new</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> URL</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;https://api.example.com/data&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">)</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">HttpsURLConnection</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> conn </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (HttpsURLConnection) </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">url</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">openConnection</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 自定义证书验证（用于自签名证书）</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">SSLContext</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> sslContext </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> SSLContext</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">getInstance</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;TLS 1.3&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">KeyStore</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> trustStore </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> KeyStore</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">getInstance</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;JKS&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">try</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> (</span><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">InputStream</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> is </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> new</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> FileInputStream</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;truststore.jks&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">)) {</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">    trustStore</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">load</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(is, </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;changeit&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">toCharArray</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">());</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;">}</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">TrustManagerFactory</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> tmf </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;"> TrustManagerFactory</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">getInstance</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;X.509&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">tmf</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">init</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(trustStore);</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">sslContext</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">init</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">null</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">tmf</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">getTrustManagers</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(), </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">new</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;"> SecureRandom</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">());</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">conn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setSSLSocketFactory</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">sslContext</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">getSocketFactory</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">());</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 主机名验证</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">conn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setHostnameVerifier</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">((hostname, session) </span><span style="--shiki-light:#C18401;--shiki-dark:#C678DD;">-&gt;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> {</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">    return</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &quot;api.example.com&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">equals</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(hostname);</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">});</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">conn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setRequestMethod</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;GET&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E5C07B;">conn</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">setRequestProperty</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">(</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Authorization&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&quot;Bearer token&quot;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">);</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-2-okhttp-配置" tabindex="-1"><a class="header-anchor" href="#_6-2-okhttp-配置"><span>6.2 OkHttp 配置</span></a></h3><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-java"><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// OkHttp HTTPS 配置</span></span>
<span class="line"><span style="--shiki-light:#C18401;--shiki-dark:#E5C07B;">OkHttpClient</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;"> client </span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> new</span><span style="--shiki-light:#383A42;--shiki-dark:#E06C75;"> OkHttpClient</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">Builder</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">()</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    // .sslSocketFactory(ssf, trustManager)</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    // .hostnameVerifier(verifier)</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    // .protocols(Arrays.asList(Protocol.HTTP_2, Protocol.HTTP_1_1))</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    // .connectionSpecs(Arrays.asList(</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    //     ConnectionSpec.MODERN_TLS,   // 现代TLS配置</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    //     ConnectionSpec.CLEARTEXT     // 允许HTTP（不推荐）</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    // ))</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">    .</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">build</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">();</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// OkHttp 默认使用系统证书库</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 默认支持 TLS 1.3 / HTTP/2</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">// 默认启用证书锁定（Certificate Pinning）</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr><h2 id="七、面试要点" tabindex="-1"><a class="header-anchor" href="#七、面试要点"><span>七、面试要点</span></a></h2><h3 id="q-https-握手过程" tabindex="-1"><a class="header-anchor" href="#q-https-握手过程"><span>Q：HTTPS 握手过程？</span></a></h3><p>TLS 1.2 握手（2-RTT）：</p><ol><li>ClientHello：客户端发送 TLS 版本、随机数、支持的密码套件</li><li>ServerHello：服务器选定密码套件、发送随机数</li><li>Certificate：服务器发送证书链</li><li>ServerKeyExchange：ECDHE 参数和签名</li><li>ClientKeyExchange：客户端 ECDHE 参数</li><li>双方计算 Master Secret → 会话密钥</li><li>ChangeCipherSpec + Finished：切换为加密通信</li></ol><h3 id="q-什么是前向安全-为什么-ecdhe-有前向安全" tabindex="-1"><a class="header-anchor" href="#q-什么是前向安全-为什么-ecdhe-有前向安全"><span>Q：什么是前向安全？为什么 ECDHE 有前向安全？</span></a></h3><p>前向安全：私钥泄露不会导致历史通信被解密。<br> RSA 密钥交换：PMS 用服务器公钥加密发送，私钥泄露 → 解密所有历史 PMS → 解密所有历史通信。<br> ECDHE 密钥交换：每次握手生成临时密钥对（d_s, d_c），握手后销毁。私钥只用于签名验证，不参与密钥计算。私钥泄露 → 只能伪造未来签名，不能解密历史通信。</p><h3 id="q-tls-1-2-和-1-3-的主要区别" tabindex="-1"><a class="header-anchor" href="#q-tls-1-2-和-1-3-的主要区别"><span>Q：TLS 1.2 和 1.3 的主要区别？</span></a></h3><ol><li>握手：1.2 是 2-RTT，1.3 是 1-RTT（0-RTT 恢复）</li><li>密钥交换：1.3 移除 RSA，只保留 ECDHE/DHE（强制前向安全）</li><li>加密：1.3 移除 CBC 模式，只用 AEAD（AES-GCM/ChaCha20-Poly1305）</li><li>压缩：1.3 移除压缩（防 CRIME/BREACH 攻击）</li><li>证书：1.3 握手后半段全部加密（1.2 证书明文传输）</li></ol><hr><h2 id="八、总结" tabindex="-1"><a class="header-anchor" href="#八、总结"><span>八、总结</span></a></h2><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span>HTTPS = HTTP + TLS</span></span>
<span class="line"><span>TLS 1.2：2-RTT 握手，支持 RSA/ECDHE 密钥交换</span></span>
<span class="line"><span>TLS 1.3：1-RTT 握手，强制 ECDHE，移除不安全算法</span></span>
<span class="line"><span></span></span>
<span class="line"><span>证书链：Root CA → Intermediate CA → Server Cert（签名传递信任）</span></span>
<span class="line"><span>密钥交换：ECDHE（临时密钥，前向安全）&gt; RSA（已弃用）</span></span>
<span class="line"><span>会话密钥：Master Secret = PRF(PMS, &quot;master secret&quot;, Client Random + Server Random)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>安全配置建议：</span></span>
<span class="line"><span>  - 只用 TLS 1.2+（禁用 TLS 1.0/1.1）</span></span>
<span class="line"><span>  - 优先 ECDHE 密码套件（TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256）</span></span>
<span class="line"><span>  - HSTS 头部强制 HTTPS</span></span>
<span class="line"><span>  - 证书锁定（Certificate Pinning）防 MITM</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,51)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};