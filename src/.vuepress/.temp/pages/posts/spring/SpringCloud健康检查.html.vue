<template><div><h1 id="服务健康检查" tabindex="-1"><a class="header-anchor" href="#服务健康检查" aria-hidden="true">#</a> 服务健康检查：</h1>
<p>基于Spring Cloud体系，可以使用spring cloud  actuator组件</p>
<h1 id="_1、pom依赖" tabindex="-1"><a class="header-anchor" href="#_1、pom依赖" aria-hidden="true">#</a> 1、POM依赖</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">></span></span>
     <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">></span></span>org<span class="token punctuation">.</span>springframework<span class="token punctuation">.</span>boot<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">></span>
     <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">></span></span>spring<span class="token operator">-</span>boot<span class="token operator">-</span>starter<span class="token operator">-</span>actuator<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">></span>
<span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_2、application-yml配置" tabindex="-1"><a class="header-anchor" href="#_2、application-yml配置" aria-hidden="true">#</a> 2、Application.yml配置</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>management<span class="token operator">:</span>
    port<span class="token operator">:</span> <span class="token number">8080</span>  #actuator端口，保持与tomcat端口一致
    endpoints<span class="token operator">:</span>
        web<span class="token operator">:</span>
          exposure<span class="token operator">:</span>
            include<span class="token operator">:</span> <span class="token string">"*"</span>  #打开所有端点，默认是never
    endpoint<span class="token operator">:</span>
        health<span class="token operator">:</span>
            show<span class="token operator">-</span>details<span class="token operator">:</span> always #显示health的明细内容，默认是never

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="_3、访问路径" tabindex="-1"><a class="header-anchor" href="#_3、访问路径" aria-hidden="true">#</a> 3、访问路径：</h1>
<p><a href="http://xn--zfry9hnb732h/actuator/health" target="_blank" rel="noopener noreferrer">http://服务地址/actuator/health<ExternalLinkIcon/></a></p>
<h1 id="_4、响应报文内容" tabindex="-1"><a class="header-anchor" href="#_4、响应报文内容" aria-hidden="true">#</a> 4、响应报文内容</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token punctuation">{</span>
    <span class="token string">"status"</span><span class="token operator">:</span> <span class="token string">"UP"</span><span class="token punctuation">,</span> 
    <span class="token string">"details"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
        <span class="token string">"diskSpace"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
            <span class="token string">"status"</span><span class="token operator">:</span> <span class="token string">"UP"</span><span class="token punctuation">,</span> 
            <span class="token string">"details"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
                <span class="token string">"total"</span><span class="token operator">:</span> <span class="token number">499963174912</span><span class="token punctuation">,</span> 
                <span class="token string">"free"</span><span class="token operator">:</span> <span class="token number">200715714560</span><span class="token punctuation">,</span> 
                <span class="token string">"threshold"</span><span class="token operator">:</span> <span class="token number">10485760</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>其中status状态含义如下</p>
<figure><img src="/assets/images/image-20201214114013294.png" alt="image-20201214114013294" tabindex="0" loading="lazy"><figcaption>image-20201214114013294</figcaption></figure>
<h1 id="_5、服务自检主动通知" tabindex="-1"><a class="header-anchor" href="#_5、服务自检主动通知" aria-hidden="true">#</a> 5、服务自检主动通知</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token punctuation">{</span>
	<span class="token string">"status"</span><span class="token operator">:</span> <span class="token string">"当前状态（以整数形式字符串表示）"</span>，
	<span class="token string">"msg"</span><span class="token operator">:</span> <span class="token string">"说明信息"</span>，
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>status状态值描述：</p>
<p>0：服务正常</p>
<p>1：处理能力紧张，需要扩容</p>
<p>2：服务内部错误 ，需要重启或版本回滚</p>
<p>3：服务获取依赖资源失败，需要人工干预</p>
</div></template>


