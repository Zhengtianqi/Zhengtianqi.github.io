import{_ as a}from"./plugin-vue_export-helper-c27b6911.js";import{o as n,c as s,a as e}from"./app-26f2803c.js";const t="/assets/images/image-20201214122255720.png",o={},i=e(`<h1 id="_1、pom-xml添加starter依赖" tabindex="-1"><a class="header-anchor" href="#_1、pom-xml添加starter依赖" aria-hidden="true">#</a> 1、pom.xml添加starter依赖</h1><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> https<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>mvnrepository<span class="token punctuation">.</span>com<span class="token operator">/</span>artifact<span class="token operator">/</span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">/</span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery <span class="token operator">--</span><span class="token operator">&gt;</span>
		<span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">&gt;</span></span>	
            <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">&gt;</span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>cloud<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">&gt;</span>
			<span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">&gt;</span></span>spring<span class="token operator">-</span>cloud<span class="token operator">-</span>starter<span class="token operator">-</span>alibaba<span class="token operator">-</span>nacos<span class="token operator">-</span>discovery<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">&gt;</span>
		<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">&gt;</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_2、配置文件添加注册服务器地址" tabindex="-1"><a class="header-anchor" href="#_2、配置文件添加注册服务器地址" aria-hidden="true">#</a> 2、配置文件添加注册服务器地址</h1><p>在application.yaml配置文件内添加Nacos Server的地址：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>#应用基本信息配置
spring:
    application:
        name: nacos-provider-demo  #修改此处为您的应用程序名称
        group: test #部门
        developer:  developer #&lt;负责人姓名&gt;
    cloud:
        nacos:
            discovery:
                server-addr: nacos.xt.com    #Nacos服务地址

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_3、开启服务发现功能" tabindex="-1"><a class="header-anchor" href="#_3、开启服务发现功能" aria-hidden="true">#</a> 3、开启服务发现功能</h1><p>在启动类添加 Spring Cloud 原生注解 @EnableDiscoveryClient ，开启服务注册发现功能：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>@SpringBootApplication
@EnableDiscoveryClient
public class NacosProviderDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(NacosProviderDemoApplication.class, args);
    }

}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_4、配置服务接口" tabindex="-1"><a class="header-anchor" href="#_4、配置服务接口" aria-hidden="true">#</a> 4、配置服务接口</h1><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@RestController</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">EchoController</span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@RequestMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">&quot;/echo/{string}&quot;</span><span class="token punctuation">,</span> method <span class="token operator">=</span> <span class="token class-name">RequestMethod</span><span class="token punctuation">.</span><span class="token constant">GET</span><span class="token punctuation">)</span>
    <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">echo</span><span class="token punctuation">(</span><span class="token annotation punctuation">@PathVariable</span> <span class="token class-name">String</span> string<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token string">&quot;Hello Nacos Discovery &quot;</span> <span class="token operator">+</span> string<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_5、确认服务注册结果" tabindex="-1"><a class="header-anchor" href="#_5、确认服务注册结果" aria-hidden="true">#</a> 5、确认服务注册结果</h1><p>运行Nacos-provider-demo，打开Nacos管理服务，可以看到nacos-prodiver-demo已经成功注册。</p><figure><img src="`+t+'" alt="image-20201214122255720" tabindex="0" loading="lazy"><figcaption>image-20201214122255720</figcaption></figure>',13),p=[i];function r(c,l){return n(),s("div",null,p)}const v=a(o,[["render",r],["__file","SpringCloud服务注册.html.vue"]]);export{v as default};
