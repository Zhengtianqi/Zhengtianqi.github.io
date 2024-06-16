<template><div><h1 id="《利用javaagent进行-jvm内存与gc信息的采集》" tabindex="-1"><a class="header-anchor" href="#《利用javaagent进行-jvm内存与gc信息的采集》" aria-hidden="true">#</a> 《利用javaagent进行 JVM内存与GC信息的采集》</h1>
<h1 id="_1、介绍" tabindex="-1"><a class="header-anchor" href="#_1、介绍" aria-hidden="true">#</a> 1、介绍</h1>
<p>​		除了监控java方法的执行耗时，我们还需要获取应用实例的jvm内存与gc信息，以实时把控我们的服务器性能是否在安全范围。监控jvm内存与gc信息是非常重要的，尤其是在大促以及微博火热爆点的时候，我们需要根据监控信息进行扩容，以保证系统稳定。</p>
<h1 id="_2、编码" tabindex="-1"><a class="header-anchor" href="#_2、编码" aria-hidden="true">#</a> 2、编码</h1>
<p>在---<br>
title: 基于JavaAgent的全链路监控（2）的基础上增加</p>
<h2 id="_1-myagent-java" tabindex="-1"><a class="header-anchor" href="#_1-myagent-java" aria-hidden="true">#</a> （1）MyAgent.java</h2>
<p>​</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">cn<span class="token punctuation">.</span>edu<span class="token punctuation">.</span>bjut<span class="token punctuation">.</span>agent</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">com<span class="token punctuation">.</span>google<span class="token punctuation">.</span>common<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token class-name">ThreadFactoryBuilder</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span>concurrent<span class="token punctuation">.</span></span><span class="token operator">*</span></span><span class="token punctuation">;</span>

<span class="token doc-comment comment">/**
 * <span class="token keyword">@author</span> zhengtianqi
 */</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">MyAgent</span> <span class="token punctuation">{</span>

    <span class="token doc-comment comment">/**
     * JVM 首先尝试在代理类上调用以下方法
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">premain</span><span class="token punctuation">(</span><span class="token class-name">String</span> agentArgs<span class="token punctuation">,</span> <span class="token class-name">Instrumentation</span> inst<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token comment">// 使用ScheduledExecutorService创建定时任务</span>
        <span class="token class-name">ScheduledExecutorService</span> schedule <span class="token operator">=</span>
                <span class="token keyword">new</span> <span class="token class-name">ScheduledThreadPoolExecutor</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">ThreadFactoryBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setNameFormat</span><span class="token punctuation">(</span><span class="token string">"scheduled-%d"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 创建并执行在给定延迟后启用的一次性操作</span>
        schedule<span class="token punctuation">.</span><span class="token function">scheduleAtFixedRate</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-></span>

        <span class="token punctuation">{</span>
            <span class="token comment">// 此方法为打印jvm信息喝gc信息</span>
            <span class="token class-name">JvmStack</span><span class="token punctuation">.</span><span class="token function">printMemoryMetric</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">JvmStack</span><span class="token punctuation">.</span><span class="token function">printGcMetric</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">0L</span><span class="token punctuation">,</span> <span class="token number">1000L</span><span class="token punctuation">,</span> <span class="token class-name">TimeUnit</span><span class="token punctuation">.</span><span class="token constant">MILLISECONDS</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
     <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 如果代理类没有实现上面的方法，那么 JVM 将尝试调用该方法
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">premain</span><span class="token punctuation">(</span><span class="token class-name">String</span> agentArgs<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


