<template><div><h1 id="_1、引入依赖" tabindex="-1"><a class="header-anchor" href="#_1、引入依赖" aria-hidden="true">#</a> 1、引入依赖</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>openfeign<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>com<span class="token punctuation">.</span>alibaba<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_2、添加配置" tabindex="-1"><a class="header-anchor" href="#_2、添加配置" aria-hidden="true">#</a> 2、添加配置</h1>
<p>此处主要为nacos服务端地址配置</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>spring<span class="token operator">:</span>
  application<span class="token operator">:</span>
    name<span class="token operator">:</span> discovery<span class="token operator">-</span>consumer<span class="token operator">-</span>feign #修改此处为您的应用程序名称
    group<span class="token operator">:</span> test #部门
    developer<span class="token operator">:</span> developer #<span class="token operator">&lt;</span>负责人姓名<span class="token operator">></span>
  cloud<span class="token operator">:</span>
    nacos<span class="token operator">:</span>
      discovery<span class="token operator">:</span>
        server<span class="token operator">-</span>addr<span class="token operator">:</span> nacos<span class="token punctuation">.</span>goo<span class="token punctuation">.</span>com    #<span class="token class-name">Nacos</span>服务地址
management<span class="token operator">:</span>
  endpoints<span class="token operator">:</span>
    web<span class="token operator">:</span>
      exposure<span class="token operator">:</span>
        include<span class="token operator">:</span> <span class="token string">"*"</span>  #打开所有端点，默认是info<span class="token punctuation">,</span>health
  endpoint<span class="token operator">:</span>
    health<span class="token operator">:</span>
      show<span class="token operator">-</span>details<span class="token operator">:</span> always #显示health的明细内容，默认是never
server<span class="token operator">:</span>
  port<span class="token operator">:</span> <span class="token number">8081</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_3、主类添加相关注解" tabindex="-1"><a class="header-anchor" href="#_3、主类添加相关注解" aria-hidden="true">#</a> 3、主类添加相关注解</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@SpringBootApplication</span>
<span class="token annotation punctuation">@EnableDiscoveryClient</span>
<span class="token annotation punctuation">@EnableFeignClients</span>    <span class="token comment">//启用feign调用，该注解会扫描@FeignClient注解</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ConsumerFeignApplication</span> <span class="token punctuation">{</span>

    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">ConfigurableApplicationContext</span> context <span class="token operator">=</span> <span class="token class-name">SpringApplication</span><span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token class-name">ConsumerFeignApplication</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">,</span> args<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>context<span class="token punctuation">.</span><span class="token function">getEnvironment</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getProperty</span><span class="token punctuation">(</span><span class="token string">"spring.application.name"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_4、定义feignclient-用与服务调用" tabindex="-1"><a class="header-anchor" href="#_4、定义feignclient-用与服务调用" aria-hidden="true">#</a> 4、定义FeignClient,用与服务调用</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token comment">//定义接口，增加FeignClient注解，在注解中使用name属性指定调用的具体服务名</span>
<span class="token annotation punctuation">@FeignClient</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"discovery-provider"</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">RemoteClient</span> <span class="token punctuation">{</span>
    
    <span class="token comment">//此处的请求方式同服务端提供的访问方式相同</span>
    <span class="token annotation punctuation">@GetMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/echo/{name}"</span><span class="token punctuation">)</span>
    <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token annotation punctuation">@PathVariable</span><span class="token punctuation">(</span><span class="token string">"name"</span><span class="token punctuation">)</span> <span class="token class-name">String</span> name<span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_5-注入4中的feignclient" tabindex="-1"><a class="header-anchor" href="#_5-注入4中的feignclient" aria-hidden="true">#</a> 5.注入4中的FeignClient</h1>
<p>调用其hello方法 即可调用远程服务。</p>
<figure><img src="/assets/images/image-20201214124603810.png" alt="image-20201214124603810" tabindex="0" loading="lazy"><figcaption>image-20201214124603810</figcaption></figure>
</div></template>


