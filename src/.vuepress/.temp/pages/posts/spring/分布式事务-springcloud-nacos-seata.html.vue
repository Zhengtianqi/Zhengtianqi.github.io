<template><div><h1 id="一、seata-是什么" tabindex="-1"><a class="header-anchor" href="#一、seata-是什么" aria-hidden="true">#</a> 一、Seata 是什么</h1>
<p>Seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Seata 将为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。<br>
<a href="https://seata.io/zh-cn/docs/overview/what-is-seata.html" target="_blank" rel="noopener noreferrer">https://seata.io/zh-cn/docs/overview/what-is-seata.html<ExternalLinkIcon/></a></p>
<h1 id="二、事务模式" tabindex="-1"><a class="header-anchor" href="#二、事务模式" aria-hidden="true">#</a> 二、事务模式</h1>
<h2 id="at-模式" tabindex="-1"><a class="header-anchor" href="#at-模式" aria-hidden="true">#</a> AT 模式</h2>
<p>基于 支持本地 ACID 事务 的 关系型数据库：<br>
一阶段 prepare 行为：在本地事务中，一并提交业务数据更新和相应回滚日志记录。<br>
二阶段 commit 行为：马上成功结束，自动 异步批量清理回滚日志。<br>
二阶段 rollback 行为：通过回滚日志，自动 生成补偿操作，完成数据回滚。</p>
<h2 id="tcc-模式" tabindex="-1"><a class="header-anchor" href="#tcc-模式" aria-hidden="true">#</a> TCC 模式</h2>
<p>不依赖于底层数据资源的事务支持：<br>
一阶段 prepare 行为：调用 自定义 的 prepare 逻辑。<br>
二阶段 commit 行为：调用 自定义 的 commit 逻辑。<br>
二阶段 rollback 行为：调用 自定义 的 rollback 逻辑。<br>
所谓 TCC 模式，是指支持把 自定义 的分支事务纳入到全局事务的管理中。</p>
<h2 id="saga-模式" tabindex="-1"><a class="header-anchor" href="#saga-模式" aria-hidden="true">#</a> Saga 模式</h2>
<p>Saga模式是SEATA提供的长事务解决方案，在Saga模式中，业务流程中每个参与者都提交本地事务，当出现某一个参与者失败则补偿前面已经成功的参与者，一阶段正向服务和二阶段补偿服务都由业务开发实现。</p>
<h1 id="三、简单使用" tabindex="-1"><a class="header-anchor" href="#三、简单使用" aria-hidden="true">#</a> 三、简单使用</h1>
<p>springcloud-nacos-seata</p>
<h2 id="step1、registry-conf" tabindex="-1"><a class="header-anchor" href="#step1、registry-conf" aria-hidden="true">#</a> step1、registry.conf</h2>
<p>每个应用的resource里需要配置一个registry.conf,与seata-server里的配置类似</p>
<h2 id="step2、pom-xml" tabindex="-1"><a class="header-anchor" href="#step2、pom-xml" aria-hidden="true">#</a> step2、pom.xml</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>        <span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> <span class="token class-name">Seata</span> <span class="token operator">--</span><span class="token operator">></span>
        <span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>com<span class="token punctuation">.</span>alibaba<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>seata<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>version<span class="token punctuation">></span></span>$<span class="token punctuation">{</span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>alibaba<span class="token punctuation">.</span>version<span class="token punctuation">}</span><span class="token operator">&lt;</span><span class="token operator">/</span>version<span class="token operator">></span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="step3-application-property" tabindex="-1"><a class="header-anchor" href="#step3-application-property" aria-hidden="true">#</a> step3 application.property</h2>
<p>其中：seata.tx-service-group=服务组名称，与nacos-config.txt配置的service.vgroup_mapping.${your-service-gruop}具有对应关系</p>
<h2 id="step4-code" tabindex="-1"><a class="header-anchor" href="#step4-code" aria-hidden="true">#</a> step4 code</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">import</span> <span class="token import"><span class="token namespace">io<span class="token punctuation">.</span>seata<span class="token punctuation">.</span>spring<span class="token punctuation">.</span>annotation<span class="token punctuation">.</span></span><span class="token class-name">GlobalTransactional</span></span><span class="token punctuation">;</span>

    <span class="token annotation punctuation">@Resource</span>
    <span class="token keyword">private</span> <span class="token class-name">StockFeignClient</span> stockFeignClient<span class="token punctuation">;</span>
    <span class="token annotation punctuation">@Resource</span>
    <span class="token keyword">private</span> <span class="token class-name">OrderDAO</span> orderDAO<span class="token punctuation">;</span>

    <span class="token annotation punctuation">@GlobalTransactional</span>
    <span class="token annotation punctuation">@Transactional</span><span class="token punctuation">(</span>rollbackFor <span class="token operator">=</span> <span class="token class-name">Exception</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">placeOrder</span><span class="token punctuation">(</span><span class="token class-name">String</span> userId<span class="token punctuation">,</span> <span class="token class-name">String</span> commodityCode<span class="token punctuation">,</span> <span class="token class-name">Integer</span> count<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> orderMoney <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>count<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">multiply</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span><span class="token number">5</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">Order</span> order <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Order</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setUserId</span><span class="token punctuation">(</span>userId<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setCommodityCode</span><span class="token punctuation">(</span>commodityCode<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setCount</span><span class="token punctuation">(</span>count<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setMoney</span><span class="token punctuation">(</span>
            orderMoney<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 订单表插入一个订单（当前服务，当前数据源，该方法相当于tx1）</span>
        orderDAO<span class="token punctuation">.</span><span class="token function">insert</span><span class="token punctuation">(</span>order<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 进行减库存操作（利用feign调用其他服务，其他数据源，该方法相当于tx2）</span>
        stockFeignClient<span class="token punctuation">.</span><span class="token function">deduct</span><span class="token punctuation">(</span>commodityCode<span class="token punctuation">,</span> count<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h1>
<p>1、全局锁使用数据库表实现，lock_table。</p>
<p>2、全局锁用于读写隔离，如果有多个分布式事务同时操作同一行数据库记录，那么可以保证数据的正确性</p>
<p>3、注册分支事务的时候会插入lock_table记录(正常情况)，全局事务提交的时候会删除lock_table。</p>
<p>4、写隔离，如果要用分布式事务，那么对于同一张表更新时建议全使用@GlobalTransaction.<br>
读隔离，使用@GlobalTransactional+select for update 或者 @GlobalLock+@Transactional+select for update</p>
<h1 id="参考文献" tabindex="-1"><a class="header-anchor" href="#参考文献" aria-hidden="true">#</a> 参考文献</h1>
<p>github：<a href="https://github.com/seata/seata-samples/tree/master/springcloud-nacos-seata" target="_blank" rel="noopener noreferrer">https://github.com/seata/seata-samples/tree/master/springcloud-nacos-seata<ExternalLinkIcon/></a></p>
<p>nacos：<a href="https://nacos.io/zh-cn/docs/quick-start.html" target="_blank" rel="noopener noreferrer">https://nacos.io/zh-cn/docs/quick-start.html<ExternalLinkIcon/></a></p>
<p>seata：<a href="https://seata.io/" target="_blank" rel="noopener noreferrer">https://seata.io/<ExternalLinkIcon/></a></p>
<p>源码分析：</p>
<p><a href="https://blog.csdn.net/qq_43437874/article/details/123131592" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/qq_43437874/article/details/123131592<ExternalLinkIcon/></a></p>
<p><a href="https://blog.51cto.com/u_12856278/3631071" target="_blank" rel="noopener noreferrer">https://blog.51cto.com/u_12856278/3631071<ExternalLinkIcon/></a></p>
</div></template>


