import{_ as e}from"./plugin-vue_export-helper-c27b6911.js";import{r as t,o,c as p,b as n,d as s,e as c,a as l}from"./app-26f2803c.js";const i={},r={href:"http://xn--zfry9hnb732h/actuator/info",target:"_blank",rel:"noopener noreferrer"},u=l(`<div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token class-name">Endpoint</span> <span class="token constant">ID</span>	<span class="token class-name">Description</span>
auditevents	显示应用暴露的审计事件 <span class="token punctuation">(</span>比如认证进入、订单失败<span class="token punctuation">)</span>
info	显示应用的基本信息
health	显示应用的健康状态
metrics	显示应用的度量信息
metrics<span class="token operator">/</span><span class="token punctuation">{</span>name<span class="token punctuation">}</span>	显示应用指定名称的度量信息，例如：http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>localhost<span class="token operator">:</span><span class="token number">8080</span><span class="token operator">/</span>actuator<span class="token operator">/</span>metrics<span class="token operator">/</span>system<span class="token punctuation">.</span>cpu<span class="token punctuation">.</span>count
loggers	显示和修改配置的loggers
logfile	返回log file中的内容<span class="token punctuation">(</span>如果logging<span class="token punctuation">.</span>file或者logging<span class="token punctuation">.</span>path被设置<span class="token punctuation">)</span>
httptrace	显示<span class="token constant">HTTP</span>足迹，最近<span class="token number">100</span>个<span class="token constant">HTTP</span> request<span class="token operator">/</span>repsponse
env	显示当前的环境特性
env<span class="token operator">/</span><span class="token punctuation">{</span>name<span class="token punctuation">}</span>	显示指定名称的环境信息，例如：http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>localhost<span class="token operator">:</span><span class="token number">8080</span><span class="token operator">/</span>actuator<span class="token operator">/</span>spring<span class="token punctuation">.</span>application<span class="token punctuation">.</span>name
flyway	显示数据库迁移路径的详细信息
liquidbase	显示<span class="token class-name">Liquibase</span> 数据库迁移的纤细信息
shutdown	让你逐步关闭应用
mappings	显示所有的<span class="token annotation punctuation">@RequestMapping</span>路径
scheduledtasks	显示应用中的调度任务
threaddump	执行一个线程dump
heapdump	返回一个<span class="token class-name">GZip</span>压缩的<span class="token constant">JVM</span>堆dump
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,1);function d(m,v){const a=t("ExternalLinkIcon");return o(),p("div",null,[n("p",null,[s("注意：默认端点 path 前面有一级 /actuator ，例如："),n("a",r,[s("http://服务地址/actuator/info"),c(a)])]),u])}const h=e(i,[["render",d],["__file","SpringCloud运维接口.html.vue"]]);export{h as default};
