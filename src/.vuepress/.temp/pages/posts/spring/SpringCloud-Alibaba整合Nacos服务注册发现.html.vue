<template><div><h1 id="一、服务注册" tabindex="-1"><a class="header-anchor" href="#一、服务注册" aria-hidden="true">#</a> 一、服务注册</h1>
<h2 id="_1、引入依赖" tabindex="-1"><a class="header-anchor" href="#_1、引入依赖" aria-hidden="true">#</a> 1、引入依赖</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2、配置application-yml" tabindex="-1"><a class="header-anchor" href="#_2、配置application-yml" aria-hidden="true">#</a> 2、配置application.yml</h2>
<p>在application.yaml配置文件内添加Nacos Server的地址：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>server<span class="token operator">:</span>
  port<span class="token operator">:</span> <span class="token number">8081</span>
spring<span class="token operator">:</span>
  application<span class="token operator">:</span>
    name<span class="token operator">:</span> nacos<span class="token operator">-</span>producer # 注册到nacos的服务名称
  cloud<span class="token operator">:</span>
    nacos<span class="token operator">:</span>
      discovery<span class="token operator">:</span>
        server<span class="token operator">-</span>addr<span class="token operator">:</span> <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">8848</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3、springboot启动类" tabindex="-1"><a class="header-anchor" href="#_3、springboot启动类" aria-hidden="true">#</a> 3、springboot启动类</h2>
<p>在启动类添加 Spring Cloud 原生注解 @EnableDiscoveryClient ，开启服务注册发现功能</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@SpringBootApplication</span>
<span class="token annotation punctuation">@EnableDiscoveryClient</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">NacosProviderDemoApplication</span> <span class="token punctuation">{</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">SpringApplication</span><span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token class-name">NacosProviderDemoApplication</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">,</span> args<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4、确认注册成功" tabindex="-1"><a class="header-anchor" href="#_4、确认注册成功" aria-hidden="true">#</a> 4、确认注册成功</h2>
<p>运行程序，打开Nacos管理服务，可以看到nacos-producer已经成功注册。</p>
<figure><img src="/assets/images/nacos-producer.png" alt="image-20191203152720691" tabindex="0" loading="lazy"><figcaption>image-20191203152720691</figcaption></figure>
<h1 id="二、服务发现" tabindex="-1"><a class="header-anchor" href="#二、服务发现" aria-hidden="true">#</a> 二、服务发现</h1>
<p>基于Alibaba Nacos Spring Cloud（服务发现）、Spring Cloud OpenFeign（声明式调用，同时整合了熔断器、负载均衡），推荐使用此方法。</p>
<h2 id="_1、引入依赖-1" tabindex="-1"><a class="header-anchor" href="#_1、引入依赖-1" aria-hidden="true">#</a> 1、引入依赖</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> <span class="token class-name">Nacos</span>服务发现 <span class="token operator">--</span><span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>

<span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> 声明式调用 <span class="token operator">--</span><span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>openfeign<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>

<span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> 负载均衡 <span class="token operator">--</span><span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>netflix<span class="token operator">-</span>ribbon<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>

<span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> 熔断器 <span class="token operator">--</span><span class="token operator">></span>
<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
    <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>netflix<span class="token operator">-</span>hystrix<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2、配置文件配置" tabindex="-1"><a class="header-anchor" href="#_2、配置文件配置" aria-hidden="true">#</a> 2、配置文件配置</h2>
<p>在application.yaml配置文件内添加Nacos Server的地址，并开启feign的熔断器功能：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>server<span class="token operator">:</span>
  port<span class="token operator">:</span> <span class="token number">8081</span>
  
spring<span class="token operator">:</span>
  application<span class="token operator">:</span>
    name<span class="token operator">:</span> nacos<span class="token operator">-</span>producer
  cloud<span class="token operator">:</span>
    nacos<span class="token operator">:</span>
      discovery<span class="token operator">:</span>
        server<span class="token operator">-</span>addr<span class="token operator">:</span> <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">8848</span>

#允许feign开启熔断器，默认未开启
feign<span class="token operator">:</span>
  hystrix<span class="token operator">:</span>
    enabled<span class="token operator">:</span> <span class="token boolean">true</span>

hystrix<span class="token operator">:</span>
  command<span class="token operator">:</span>
    <span class="token keyword">default</span><span class="token operator">:</span>
      execution<span class="token operator">:</span>
        timeout<span class="token operator">:</span>
          enabled<span class="token operator">:</span> <span class="token boolean">true</span>
      isolation<span class="token operator">:</span>
        thread<span class="token operator">:</span>
          #目前有两个容器实例，单个请求超时<span class="token number">5</span>s<span class="token punctuation">,</span><span class="token operator">+</span>重试<span class="token operator">></span><span class="token number">10</span>s，超<span class="token number">15</span>s则熔断
          timeoutInMilliseconds<span class="token operator">:</span> <span class="token number">15000</span>

ribbon<span class="token operator">:</span>
  #ribbon请求连接的超时时间<span class="token operator">-</span> 限制<span class="token number">3</span>秒内必须请求到服务，并不限制服务处理的返回时间
  connectTimeout<span class="token operator">:</span> <span class="token number">3000</span>
  #请求处理的超时时间 下级服务响应最大时间<span class="token punctuation">,</span>超出时间消费方（路由也是消费方）返回timeout<span class="token punctuation">,</span>超时时间不可大于断路器的超时时间
  readTimeout<span class="token operator">:</span> <span class="token number">5000</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3、开启服务发现、负载均衡、熔断器功能" tabindex="-1"><a class="header-anchor" href="#_3、开启服务发现、负载均衡、熔断器功能" aria-hidden="true">#</a> 3、开启服务发现、负载均衡、熔断器功能</h2>
<p>在启动类添加 Spring Cloud 原生注解 @EnableDiscoveryClient ，开启服务注册发现功能，添加 @EnableCircuitBreaker 开始熔断器功能：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@SpringBootApplication</span>
<span class="token annotation punctuation">@EnableDiscoveryClient</span>   <span class="token comment">//开启服务发现</span>
<span class="token annotation punctuation">@EnableCircuitBreaker</span>    <span class="token comment">//开始熔断功能</span>
<span class="token annotation punctuation">@EnableFeignClients</span><span class="token punctuation">(</span>basePackages <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token string">"com.sy"</span><span class="token punctuation">}</span><span class="token punctuation">)</span>   <span class="token comment">//开启Feign客户端，并指定扫描范围</span>
<span class="token annotation punctuation">@ComponentScan</span><span class="token punctuation">(</span>basePackages <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token string">"com.sy"</span><span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">NacosDiscoveryExampleApplication</span> <span class="token punctuation">{</span>

    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">SpringApplication</span><span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token class-name">NacosDiscoveryExampleApplication</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">,</span> args<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4、创建服务代理类" tabindex="-1"><a class="header-anchor" href="#_4、创建服务代理类" aria-hidden="true">#</a> 4、创建服务代理类</h2>
<p>使用@FeignClient注解声明服务调用的代理类，其中参数含义为：<br>
<a href="http://1.name" target="_blank" rel="noopener noreferrer">1.name<ExternalLinkIcon/></a>：服务提供者注册在服务注册中心的名称；<br>
2.fallback：使用者提供的断路器实现，必须是当前代理类的实现类；<br>
3.fallbackFactory：使用者提供的Hystrix的断路器工厂类实现。</p>
<p>注：fallback 与 fallbackFactory 只需要配置一个，建议使用fallbackFactory。 示例如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token annotation punctuation">@FeignClient</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"nacos-producer"</span><span class="token punctuation">,</span> fallbackFactory <span class="token operator">=</span> <span class="token class-name">HystrixClientFallbackFactory</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">ConsumerService</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@LoadBalanced</span>
    <span class="token annotation punctuation">@GetMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/hello"</span><span class="token punctuation">)</span>
    <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token annotation punctuation">@LoadBalanced</span>
    <span class="token annotation punctuation">@GetMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/hello/{string}"</span><span class="token punctuation">)</span>
    <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token annotation punctuation">@PathVariable</span><span class="token punctuation">(</span><span class="token string">"string"</span><span class="token punctuation">)</span> <span class="token class-name">String</span> string<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5、创建hystrix的断路器工厂类" tabindex="-1"><a class="header-anchor" href="#_5、创建hystrix的断路器工厂类" aria-hidden="true">#</a> 5、创建Hystrix的断路器工厂类</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HystrixClientFallbackFactory</span> <span class="token keyword">implements</span> <span class="token class-name">FallbackFactory</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">ConsumerService</span><span class="token punctuation">></span></span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">ConsumerService</span> <span class="token function">create</span><span class="token punctuation">(</span><span class="token class-name">Throwable</span> cause<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 打印日志</span>
        <span class="token class-name">LocalLog</span><span class="token punctuation">.</span><span class="token function">info</span><span class="token punctuation">(</span><span class="token string">"fallback; reason was: "</span> <span class="token operator">+</span> cause<span class="token punctuation">.</span><span class="token function">getMessage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">ConsumerService</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token annotation punctuation">@Override</span>
            <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token keyword">return</span> <span class="token string">"请求失败"</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>

            <span class="token annotation punctuation">@Override</span>
            <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">hello</span><span class="token punctuation">(</span><span class="token class-name">String</span> string<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token keyword">return</span> <span class="token string">"请求失败. string="</span> <span class="token operator">+</span> string<span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_6、通用代理类的实例进行服务调用-与本地调用无异。如下" tabindex="-1"><a class="header-anchor" href="#_6、通用代理类的实例进行服务调用-与本地调用无异。如下" aria-hidden="true">#</a> 6、通用代理类的实例进行服务调用，与本地调用无异。如下：</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@RestController</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ConsumerController</span> <span class="token punctuation">{</span>
    <span class="token annotation punctuation">@Autowired</span>
    <span class="token keyword">private</span> <span class="token class-name">ConsumerService</span> consumerService<span class="token punctuation">;</span>

    <span class="token annotation punctuation">@RequestMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/feign/{string}"</span><span class="token punctuation">,</span> method <span class="token operator">=</span> <span class="token class-name">RequestMethod</span><span class="token punctuation">.</span><span class="token constant">GET</span><span class="token punctuation">)</span>
    <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">echo</span><span class="token punctuation">(</span><span class="token annotation punctuation">@PathVariable</span> <span class="token class-name">String</span> string<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> consumerService<span class="token punctuation">.</span><span class="token function">hello</span><span class="token punctuation">(</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


