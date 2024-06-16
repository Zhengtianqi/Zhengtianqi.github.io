<template><div><h1 id="ribbon策略类型" tabindex="-1"><a class="header-anchor" href="#ribbon策略类型" aria-hidden="true">#</a> Ribbon策略类型</h1>
<figure><img src="/assets/images/image-20201214123508379.png" alt="image-20201214123508379" tabindex="0" loading="lazy"><figcaption>image-20201214123508379</figcaption></figure>
<p>Ribbon负载均衡策略为轮询，如果要修改默认策略 ，有两种方法，分别是创建配置类，和配置application.yml。</p>
<h1 id="方法一-创建配置类" tabindex="-1"><a class="header-anchor" href="#方法一-创建配置类" aria-hidden="true">#</a> 方法一：创建配置类</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code> <span class="token annotation punctuation">@Configuration</span>  
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyRibbonConfig</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@Bean</span>
    <span class="token keyword">public</span> <span class="token class-name">IRule</span> <span class="token function">ribbonRule</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">//随机策略</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">RandomRule</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
然后在启动类上加注解：
<span class="token annotation punctuation">@RibbonClient</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"nacos.provider.demo"</span><span class="token punctuation">,</span> configuration <span class="token operator">=</span> <span class="token class-name">MyRibbonConfig</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>  <span class="token comment">//name为服务提供者名称</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="方法二-配置文件" tabindex="-1"><a class="header-anchor" href="#方法二-配置文件" aria-hidden="true">#</a> 方法二：配置文件</h1>
<p>无须任何配置类和代码，只需要在在application.yml中添加配置：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#针对单个服务配置路由规则，注意 配置的值 需要类全名（包名<span class="token operator">+</span>类名）；
nacos<span class="token punctuation">.</span>config<span class="token punctuation">.</span>demo<span class="token operator">:</span> #目标服务提供名称
    ribbon<span class="token operator">:</span>
        <span class="token class-name">ConnectionTimeout</span><span class="token operator">:</span> <span class="token number">400</span> #链接超时
        <span class="token class-name">ReadTimeout</span><span class="token operator">:</span> <span class="token number">400</span> #读取超时
        <span class="token class-name">MaxAutoRetries</span><span class="token operator">:</span> <span class="token number">1</span> #重试当前实例的次数
        <span class="token class-name">MaxAutoRetriesNextServer</span><span class="token operator">:</span> <span class="token number">1</span> #服务实例切换重试次数
        <span class="token class-name">ServerListRefreshInterval</span><span class="token operator">:</span> <span class="token number">30000</span> #刷新所服务列表间隔时间
        <span class="token class-name">NFLoadBalancerRuleClassName</span><span class="token operator">:</span> <span class="token class-name"><span class="token namespace">com<span class="token punctuation">.</span>netflix<span class="token punctuation">.</span>loadbalancer<span class="token punctuation">.</span></span>RandomRule</span> #配置对应的规则，其他ribbon自带的规则 可查看<span class="token class-name">IRule</span>接口的实现类
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


