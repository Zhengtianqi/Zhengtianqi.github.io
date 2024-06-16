<template><div><h1 id="_1、引入依赖" tabindex="-1"><a class="header-anchor" href="#_1、引入依赖" aria-hidden="true">#</a> 1、引入依赖</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>boot<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>boot<span class="token operator">-</span>starter<span class="token operator">-</span>actuator<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>openfeign<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>com<span class="token punctuation">.</span>alibaba<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>netflix<span class="token operator">-</span>hystrix<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_2、增加相关配置" tabindex="-1"><a class="header-anchor" href="#_2、增加相关配置" aria-hidden="true">#</a> 2、增加相关配置</h1>
<div class="language-text line-numbers-mode" data-ext="text"><pre v-pre class="language-text"><code>spring:
  application:
    name: server-consumer-feign-hystrix #修改此处为您的应用程序名称
    group: test #部门
    developer: developer  #&lt;负责人姓名>
  cloud:
    nacos:
      discovery:
        server-addr: nacos.com    #Nacos服务地址
  main:
    allow-bean-definition-overriding: true
#允许feign开启熔断器，默认未开启
feign:
  hystrix:
    enabled: true
management:
  endpoints:
    web:
      exposure:
        include: "*"  #打开所有端点，默认是info,health
  endpoint:
    health:
      show-details: always #显示health的明细内容，默认是never
server:
  port: 8086
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_3、增加feignclient" tabindex="-1"><a class="header-anchor" href="#_3、增加feignclient" aria-hidden="true">#</a> 3、增加FeignClient</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@FeignClient</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"discovery-provider"</span><span class="token punctuation">,</span> fallbackFactory <span class="token operator">=</span> <span class="token class-name">HystrixClientFallbackFactory</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">RemoteClient</span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@LoadBalanced</span>
    <span class="token annotation punctuation">@GetMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/echo/{name}"</span><span class="token punctuation">)</span>
    <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token annotation punctuation">@PathVariable</span><span class="token punctuation">(</span><span class="token string">"name"</span><span class="token punctuation">)</span> <span class="token class-name">String</span> name<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_4、修改默认的负载均衡规则" tabindex="-1"><a class="header-anchor" href="#_4、修改默认的负载均衡规则" aria-hidden="true">#</a> 4、修改默认的负载均衡规则</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Configuration</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">AppointRibbonMetric</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@Bean</span>
    <span class="token keyword">public</span> <span class="token class-name">IRule</span> <span class="token function">ribbonRule</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">{</span>
       <span class="token comment">//此处的RoundRobinRule()为轮询方式的负载均衡</span>
       <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">RoundRobinRule</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_5、增加对应方法的hystrix配置" tabindex="-1"><a class="header-anchor" href="#_5、增加对应方法的hystrix配置" aria-hidden="true">#</a> 5、增加对应方法的Hystrix配置</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HystrixClientFallbackFactory</span> <span class="token keyword">implements</span> <span class="token class-name">FallbackFactory</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">RemoteClient</span><span class="token punctuation">></span></span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">RemoteClient</span> <span class="token function">create</span><span class="token punctuation">(</span><span class="token class-name">Throwable</span> throwable<span class="token punctuation">)</span> <span class="token punctuation">{</span>
       <span class="token keyword">return</span> <span class="token punctuation">(</span>name<span class="token punctuation">)</span><span class="token operator">-></span> <span class="token string">"请求失败. name="</span> <span class="token operator">+</span> name<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_6、使用效果如下" tabindex="-1"><a class="header-anchor" href="#_6、使用效果如下" aria-hidden="true">#</a> 6、使用效果如下</h1>
<h2 id="_1-启动两个服务端-端口分别为8080-8090" tabindex="-1"><a class="header-anchor" href="#_1-启动两个服务端-端口分别为8080-8090" aria-hidden="true">#</a> 1）.启动两个服务端，端口分别为8080，8090</h2>
<figure><img src="/assets/images/image-20201214125402694.png" alt="image-20201214125402694" tabindex="0" loading="lazy"><figcaption>image-20201214125402694</figcaption></figure>
<h2 id="_2-启动服务消费端-多次调用对应的服务" tabindex="-1"><a class="header-anchor" href="#_2-启动服务消费端-多次调用对应的服务" aria-hidden="true">#</a> 2）.启动服务消费端，多次调用对应的服务</h2>
<figure><img src="/assets/images/image-20201214125453643.png" alt="image-20201214125453643" tabindex="0" loading="lazy"><figcaption>image-20201214125453643</figcaption></figure>
<figure><img src="/assets/images/image-20201214125504552.png" alt="image-20201214125504552" tabindex="0" loading="lazy"><figcaption>image-20201214125504552</figcaption></figure>
<p>由上方两张图可见，在每次调用时，均会路由到不同端口的实例上。</p>
<h2 id="_3-关掉两个服务端实例" tabindex="-1"><a class="header-anchor" href="#_3-关掉两个服务端实例" aria-hidden="true">#</a> 3）. 关掉两个服务端实例</h2>
<figure><img src="/assets/images/image-20201214125529023.png" alt="image-20201214125529023" tabindex="0" loading="lazy"><figcaption>image-20201214125529023</figcaption></figure>
<p>再次访问时返回了对应fallback中的返回值。</p>
</div></template>


