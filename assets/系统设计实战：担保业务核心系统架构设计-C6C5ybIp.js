import{n as e,o as t,r as n}from"./app-CH3eYcUw.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/posts/%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E5%AE%9E%E6%88%98%EF%BC%9A%E6%8B%85%E4%BF%9D%E4%B8%9A%E5%8A%A1%E6%A0%B8%E5%BF%83%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1.html","title":"系统设计实战：担保业务核心系统架构设计","lang":"zh-CN","frontmatter":{"title":"系统设计实战：担保业务核心系统架构设计","date":"2026-06-11T00:00:00.000Z","category":"架构设计","tag":["架构设计","担保业务","微服务","高可用","分布式事务"],"description":"系统设计实战：担保业务核心系统架构设计 系统设计实战：担保业务核心系统架构设计是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。 本文介绍了系统设计实战：担保业务核心系统架构设计的设计原则和实践经验，帮助你提升架构设计能力。 spring: datasource: master: url: jdbc:mysql:replication://m...","head":[["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"系统设计实战：担保业务核心系统架构设计\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2026-06-11T00:00:00.000Z\\",\\"dateModified\\":\\"2026-06-29T08:25:12.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"郑天祺\\",\\"url\\":\\"https://zhengtianqi.github.io\\"}]}"],["meta",{"property":"og:url","content":"https://zhengtianqi.github.io/posts/%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E5%AE%9E%E6%88%98%EF%BC%9A%E6%8B%85%E4%BF%9D%E4%B8%9A%E5%8A%A1%E6%A0%B8%E5%BF%83%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1.html"}],["meta",{"property":"og:site_name","content":"郑天祺的博客"}],["meta",{"property":"og:title","content":"系统设计实战：担保业务核心系统架构设计"}],["meta",{"property":"og:description","content":"系统设计实战：担保业务核心系统架构设计 系统设计实战：担保业务核心系统架构设计是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。 本文介绍了系统设计实战：担保业务核心系统架构设计的设计原则和实践经验，帮助你提升架构设计能力。 spring: datasource: master: url: jdbc:mysql:replication://m..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2026-06-29T08:25:12.000Z"}],["meta",{"property":"article:tag","content":"分布式事务"}],["meta",{"property":"article:tag","content":"高可用"}],["meta",{"property":"article:tag","content":"微服务"}],["meta",{"property":"article:tag","content":"担保业务"}],["meta",{"property":"article:tag","content":"架构设计"}],["meta",{"property":"article:published_time","content":"2026-06-11T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2026-06-29T08:25:12.000Z"}]]},"git":{"createdTime":1781224443000,"updatedTime":1782721512000,"contributors":[{"name":"zhengtianqi","username":"zhengtianqi","email":"zhengtq@bjcrg.com","commits":3,"url":"https://github.com/zhengtianqi"}]},"readingTime":{"minutes":4.22,"words":1265},"filePathRelative":"posts/架构设计/系统设计实战：担保业务核心系统架构设计.md","excerpt":"\\n<blockquote>\\n<p>系统设计实战：担保业务核心系统架构设计是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。<br>\\n本文介绍了系统设计实战：担保业务核心系统架构设计的设计原则和实践经验，帮助你提升架构设计能力。</p>\\n</blockquote>\\n<p>spring:<br>\\ndatasource:<br>\\nmaster:<br>\\nurl: jdbc:mysql:replication://master1:3306,master2:3306/guarantee_db<br>\\nslave:<br>\\nurl: jdbc:mysql:loadbalance://slave1:3306,slave2:3306/guarantee_db</p>","autoDesc":true}`),a={name:`系统设计实战：担保业务核心系统架构设计.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="系统设计实战-担保业务核心系统架构设计" tabindex="-1"><a class="header-anchor" href="#系统设计实战-担保业务核心系统架构设计"><span>系统设计实战：担保业务核心系统架构设计</span></a></h1><blockquote><p>系统设计实战：担保业务核心系统架构设计是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。<br> 本文介绍了系统设计实战：担保业务核心系统架构设计的设计原则和实践经验，帮助你提升架构设计能力。</p></blockquote><p>spring:<br> datasource:<br> master:<br> url: jdbc:mysql:replication://master1:3306,master2:3306/guarantee_db<br> slave:<br> url: jdbc:mysql:loadbalance://slave1:3306,slave2:3306/guarantee_db</p><div class="language- line-numbers-mode" data-highlighter="shiki" data-ext="" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code class="language-"><span class="line"><span></span></span>
<span class="line"><span>## 第七部分：关键技术选型说明</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 7.1 技术选型全景</span></span>
<span class="line"><span></span></span>
<span class="line"><span>| 类别 | 选型 | 版本 | 说明 |</span></span>
<span class="line"><span>|------|------|------|------|</span></span>
<span class="line"><span>| 基础框架 | Spring Boot | 3.x | 主流企业框架 |</span></span>
<span class="line"><span>| 微服务框架 | Spring Cloud Alibaba | 2023.x | 与阿里云生态集成 |</span></span>
<span class="line"><span>| 注册/配置 | Nacos | 2.x | 统一注册与配置中心 |</span></span>
<span class="line"><span>| 服务调用 | OpenFeign + LoadBalancer | - | 声明式 HTTP 调用 |</span></span>
<span class="line"><span>| 限流熔断 | Sentinel | 1.8.x | 阿里开源，控制台强大 |</span></span>
<span class="line"><span>| API 网关 | Spring Cloud Gateway | 4.x | 响应式网关 |</span></span>
<span class="line"><span>| 消息队列 | RocketMQ | 5.x | 金融级事务消息 |</span></span>
<span class="line"><span>| 分布式事务 | Seata | 1.7.x | AT 模式轻量接入 |</span></span>
<span class="line"><span>| ORM | MyBatis-Plus | 3.5.x | 简化 CRUD |</span></span>
<span class="line"><span>| 缓存 | Redis (Lettuce) | 7.x | 高性能缓存 |</span></span>
<span class="line"><span>| 搜索引擎 | Elasticsearch | 8.x | 日志检索 |</span></span>
<span class="line"><span>| 规则引擎 | Drools | 8.x | 风控规则 |</span></span>
<span class="line"><span>| 流程引擎 | Flowable | 7.x | 审批流程 |</span></span>
<span class="line"><span>| 监控 | Prometheus + Grafana | - | 指标监控 |</span></span>
<span class="line"><span>| 链路追踪 | OpenTelemetry + Jaeger | - | 分布式追踪 |</span></span>
<span class="line"><span>| 日志收集 | Filebeat + ELK | 8.x | 日志平台 |</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 7.2 关键选型理由</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**为什么选 RocketMQ 而不是 Kafka？**</span></span>
<span class="line"><span></span></span>
<span class="line"><span>| 考量 | RocketMQ | Kafka |</span></span>
<span class="line"><span>|------|----------|-------|</span></span>
<span class="line"><span>| 事务消息 | 原生支持，简单可靠 | 需要额外配置 |</span></span>
<span class="line"><span>| 顺序消息 | 支持消费端顺序 | 分区内有序，消费者端复杂 |</span></span>
<span class="line"><span>| 消息回溯 | 支持时间维度回溯 | 支持，但运维成本高 |</span></span>
<span class="line"><span>| 延迟消息 | 内置 18 个延迟级别 | 不原生支持 |</span></span>
<span class="line"><span>| 金融合规 | 阿里/蚂蚁背书 | 需自行保证 |</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**为什么选 Seata AT 而不是 XA？**</span></span>
<span class="line"><span>- XA 协议性能极差（两阶段提交的长锁）</span></span>
<span class="line"><span>- Seata AT 只需一个小型 undo_log 表</span></span>
<span class="line"><span>- 对业务代码侵入性低（注解即可）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## 第八部分：架构评审常见问题预设</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 问题 1：为什么有这么多微服务？会不会拆太细了？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**答**：担保业务本身流程复杂，每个环节有独立的团队、独立的变更频率和独立的扩展需求。16 个微服务不是一蹴而就的，是随着业务发展逐步拆分出来的。如果从零开始，可从 5-6 个核心服务做起。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 问题 2：分布式事务性能如何？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**答**：根据实测，Seata AT 模式的额外开销约为单机事务的 15-30%。对于日均十万级的担保业务来说，这个开销完全可以接受。对于极致性能要求的场景（如秒杀），会采用 RocketMQ 事务消息 + 异步处理。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 问题 3：数据库如何扩容？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**答**：MySQL 主主复制 + 读写分离处理常规流量。当单库容量达到瓶颈时，使用 ShardingSphere 按客户维度分库分表（如按 customer_id % 16 分 16 个库）。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### 问题 4：风控引擎如何热更新规则？</span></span>
<span class="line"><span></span></span>
<span class="line"><span>**答**：使用 Drools 的 KieScanner 自动监听规则文件变化，无需重启服务。规则文件存储在 Nacos 配置中心，修改后自动推送生效。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`java</span></span>
<span class="line"><span>@Configuration</span></span>
<span class="line"><span>public class DroolsConfig {</span></span>
<span class="line"><span>    @Bean</span></span>
<span class="line"><span>    public KieContainer kieContainer() {</span></span>
<span class="line"><span>        KieServices ks = KieServices.Factory.get();</span></span>
<span class="line"><span>        KieFileSystem kfs = ks.newKieFileSystem();</span></span>
<span class="line"><span>        // 从 Nacos 读取规则文件</span></span>
<span class="line"><span>        String rules = nacosConfigService.getConfig(&quot;risk-rules.drl&quot;, &quot;RISK_GROUP&quot;, 5000);</span></span>
<span class="line"><span>        kfs.write(&quot;src/main/resources/rules/risk-rules.drl&quot;, rules);</span></span>
<span class="line"><span>        ks.newKieBuilder(kfs).buildAll();</span></span>
<span class="line"><span>        KieContainer container = ks.newKieContainer(</span></span>
<span class="line"><span>            ks.getRepository().getDefaultReleaseId());</span></span>
<span class="line"><span>        // 自动扫描更新</span></span>
<span class="line"><span>        KieScanner scanner = ks.newKieScanner(container);</span></span>
<span class="line"><span>        scanner.start(10000L); // 每 10 秒检查一次</span></span>
<span class="line"><span>        return container;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="问题-5-系统如何保证-99-99-的可用性" tabindex="-1"><a class="header-anchor" href="#问题-5-系统如何保证-99-99-的可用性"><span>问题 5：系统如何保证 99.99% 的可用性？</span></a></h3><p><strong>答</strong>：</p><ul><li>同城双机房 + 异地灾备，任意单机房故障不影响业务</li><li>核心服务最小 3 副本部署（每个机房至少 1 个）</li><li>自动故障转移（Nacos 心跳检测 + 自动摘除）</li><li>限流熔断保护雪崩</li><li>完善的监控告警体系</li><li>定期容灾演练（每季度一次）</li></ul><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结"><span>总结</span></a></h2><p>担保核心系统架构设计的核心要点：</p><ol><li><strong>业务流程驱动架构</strong>：先理解业务全生命周期，再设计服务边界</li><li><strong>分层解耦</strong>：网关层 → 业务服务层 → 领域支撑层 → 基础设施层，层层解耦</li><li><strong>分布式事务分场景选型</strong>：资金类用 TCC/Seata，流程类用 RocketMQ 事务消息，数据同步用本地消息表</li><li><strong>高可用三层防护</strong>：同城双活 + 异地灾备 + 限流熔断</li><li><strong>风控独立为引擎</strong>：规则引擎热更新，不耦合业务代码</li></ol><blockquote><p>架构的本质是取舍。好的架构师不是把所有&quot;最好&quot;的技术堆在一起，而是在约束条件下做出最合适的决策。</p></blockquote><h2 id="参考资料" tabindex="-1"><a class="header-anchor" href="#参考资料"><span>参考资料</span></a></h2><ol><li>Alibaba, 《企业级互联网架构白皮书》</li><li>凤凰架构, 《构建可靠的大型分布式系统》</li><li>Seata 官方文档</li><li>Spring Cloud Alibaba 官方文档</li></ol>`,13)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};