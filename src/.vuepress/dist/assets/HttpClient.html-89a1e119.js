import{_ as n}from"./plugin-vue_export-helper-c27b6911.js";import{o as s,c as a,a as t}from"./app-26f2803c.js";const p={},e=t(`<h1 id="_1、httpclient介绍" tabindex="-1"><a class="header-anchor" href="#_1、httpclient介绍" aria-hidden="true">#</a> 1、HttpClient介绍</h1><p>​ HTTP 协议可能是现在 Internet 上使用得最多、最重要的协议了，越来越多的 Java 应用程序需要直接通过 HTTP 协议来访问网络资源。</p><p>​ 虽然在 JDK 的 java net包中已经提供了访问 HTTP 协议的基本功能，但是对于大部分应用程序来说，JDK 库本身提供的功能还不够丰富和灵活。</p><p>​ HttpClient 是Apache HttpComponents 下的子项目，用来提供高效的、最新的、功能丰富的支持 HTTP 协议的客户端编程工具包，并且它支持 HTTP 协议最新的版本和建议。HttpClient已经应用在很多的项目中，并支持HTTPS协议。</p><p>​ HttpClient 不是浏览器，它是一个客户端 HTTP 协议传输类库。HttpClient 被用来发送和接受 HTTP 消息。HttpClient 不会处理 HTTP 消息的内容，不会进行 javascript 解析，不会关心 content type，如果没有明确设置，HttpClient 也不会对请求进行格式化、重定向 url，或者其他任何和 HTTP 消息传输相关的功能。</p><h1 id="_2、httpclientutils" tabindex="-1"><a class="header-anchor" href="#_2、httpclientutils" aria-hidden="true">#</a> 2、HttpClientUtils</h1><h2 id="_1-引入依赖" tabindex="-1"><a class="header-anchor" href="#_1-引入依赖" aria-hidden="true">#</a> （1）引入依赖</h2><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code>        <span class="token generics"><span class="token punctuation">&lt;</span>httpclient<span class="token punctuation">.</span>version<span class="token punctuation">&gt;</span></span><span class="token number">4.5</span><span class="token number">.12</span><span class="token operator">&lt;</span><span class="token operator">/</span>httpclient<span class="token punctuation">.</span>version<span class="token operator">&gt;</span>
                <span class="token operator">&lt;</span><span class="token operator">!</span><span class="token operator">--</span> apache httpclient组件 <span class="token operator">--</span><span class="token operator">&gt;</span>
        <span class="token generics"><span class="token punctuation">&lt;</span>dependency<span class="token punctuation">&gt;</span></span>
            <span class="token generics"><span class="token punctuation">&lt;</span>groupId<span class="token punctuation">&gt;</span></span>org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>httpcomponents<span class="token operator">&lt;</span><span class="token operator">/</span>groupId<span class="token operator">&gt;</span>
            <span class="token generics"><span class="token punctuation">&lt;</span>artifactId<span class="token punctuation">&gt;</span></span>httpclient<span class="token operator">&lt;</span><span class="token operator">/</span>artifactId<span class="token operator">&gt;</span>
            <span class="token generics"><span class="token punctuation">&lt;</span>version<span class="token punctuation">&gt;</span></span>$<span class="token punctuation">{</span>httpclient<span class="token punctuation">.</span>version<span class="token punctuation">}</span><span class="token operator">&lt;</span><span class="token operator">/</span>version<span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>dependency<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2-返回实体" tabindex="-1"><a class="header-anchor" href="#_2-返回实体" aria-hidden="true">#</a> （2）返回实体</h2><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">cn<span class="token punctuation">.</span>edu<span class="token punctuation">.</span>bjut<span class="token punctuation">.</span>entity</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>io<span class="token punctuation">.</span></span><span class="token class-name">Serializable</span></span><span class="token punctuation">;</span>

<span class="token doc-comment comment">/**
 * <span class="token keyword">@author</span> ztq
 */</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HttpClientResult</span> <span class="token keyword">implements</span> <span class="token class-name">Serializable</span> <span class="token punctuation">{</span>
    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token keyword">long</span> serialVersionUID <span class="token operator">=</span> <span class="token number">1L</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 响应状态码
     */</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> code<span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 响应数据
     */</span>
    <span class="token keyword">private</span> <span class="token class-name">String</span> content<span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token class-name">HttpClientResult</span><span class="token punctuation">(</span><span class="token keyword">int</span> code<span class="token punctuation">,</span> <span class="token class-name">String</span> content<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>code <span class="token operator">=</span> code<span class="token punctuation">;</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>content <span class="token operator">=</span> content<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token class-name">HttpClientResult</span><span class="token punctuation">(</span><span class="token keyword">int</span> code<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>code <span class="token operator">=</span> code<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">int</span> <span class="token function">getCode</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> code<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">setCode</span><span class="token punctuation">(</span><span class="token keyword">int</span> code<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>code <span class="token operator">=</span> code<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">getContent</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> content<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">setContent</span><span class="token punctuation">(</span><span class="token class-name">String</span> content<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>content <span class="token operator">=</span> content<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token string">&quot;HttpClientResult{&quot;</span> <span class="token operator">+</span>
                <span class="token string">&quot;code=&quot;</span> <span class="token operator">+</span> code <span class="token operator">+</span>
                <span class="token string">&quot;, content=&#39;&quot;</span> <span class="token operator">+</span> content <span class="token operator">+</span> <span class="token char">&#39;\\&#39;&#39;</span> <span class="token operator">+</span>
                <span class="token char">&#39;}&#39;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3-工具类" tabindex="-1"><a class="header-anchor" href="#_3-工具类" aria-hidden="true">#</a> （3）工具类</h2><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">package</span> <span class="token namespace">cn<span class="token punctuation">.</span>edu<span class="token punctuation">.</span>bjut<span class="token punctuation">.</span>utils</span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">cn<span class="token punctuation">.</span>edu<span class="token punctuation">.</span>bjut<span class="token punctuation">.</span>entity<span class="token punctuation">.</span></span><span class="token class-name">HttpClientResult</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span></span><span class="token class-name">HttpStatus</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span></span><span class="token class-name">NameValuePair</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>client<span class="token punctuation">.</span>config<span class="token punctuation">.</span></span><span class="token class-name">RequestConfig</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>client<span class="token punctuation">.</span>entity<span class="token punctuation">.</span></span><span class="token class-name">UrlEncodedFormEntity</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>client<span class="token punctuation">.</span>methods<span class="token punctuation">.</span></span><span class="token operator">*</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>client<span class="token punctuation">.</span>utils<span class="token punctuation">.</span></span><span class="token class-name">URIBuilder</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>impl<span class="token punctuation">.</span>client<span class="token punctuation">.</span></span><span class="token class-name">CloseableHttpClient</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>impl<span class="token punctuation">.</span>client<span class="token punctuation">.</span></span><span class="token class-name">HttpClients</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>message<span class="token punctuation">.</span></span><span class="token class-name">BasicNameValuePair</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">org<span class="token punctuation">.</span>apache<span class="token punctuation">.</span>http<span class="token punctuation">.</span>util<span class="token punctuation">.</span></span><span class="token class-name">EntityUtils</span></span><span class="token punctuation">;</span>

<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>io<span class="token punctuation">.</span></span><span class="token class-name">IOException</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>io<span class="token punctuation">.</span></span><span class="token class-name">UnsupportedEncodingException</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>util<span class="token punctuation">.</span></span><span class="token operator">*</span></span><span class="token punctuation">;</span>

<span class="token doc-comment comment">/**
 * <span class="token keyword">@author</span> ztq
 */</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HttpClientUtils</span> <span class="token punctuation">{</span>

    <span class="token doc-comment comment">/**
     * 编码格式。发送编码格式统一用UTF-8
     */</span>
    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">String</span> <span class="token constant">ENCODING</span> <span class="token operator">=</span> <span class="token string">&quot;UTF-8&quot;</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 设置连接超时时间，单位毫秒。
     */</span>
    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token keyword">int</span> <span class="token constant">CONNECT_TIMEOUT</span> <span class="token operator">=</span> <span class="token number">6000</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 请求获取数据的超时时间(即响应时间)，单位毫秒。
     */</span>
    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token keyword">int</span> <span class="token constant">SOCKET_TIMEOUT</span> <span class="token operator">=</span> <span class="token number">6000</span><span class="token punctuation">;</span>

    <span class="token doc-comment comment">/**
     * 发送get请求；不带请求头和请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span> 请求地址
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doGet</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">doGet</span><span class="token punctuation">(</span>url<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送get请求；带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>    请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">params</span> 请求参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doGet</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">doGet</span><span class="token punctuation">(</span>url<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送get请求；带请求头和请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>     请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">headers</span> 请求头集合
     * <span class="token keyword">@param</span> <span class="token parameter">params</span>  请求参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doGet</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> headers<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token comment">// 创建httpClient对象</span>
        <span class="token class-name">CloseableHttpClient</span> httpClient <span class="token operator">=</span> <span class="token class-name">HttpClients</span><span class="token punctuation">.</span><span class="token function">createDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 创建访问的地址</span>
        <span class="token class-name">URIBuilder</span> uriBuilder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">URIBuilder</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>params <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">Set</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span><span class="token punctuation">&gt;</span></span> entrySet <span class="token operator">=</span> params<span class="token punctuation">.</span><span class="token function">entrySet</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> entry <span class="token operator">:</span> entrySet<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                uriBuilder<span class="token punctuation">.</span><span class="token function">setParameter</span><span class="token punctuation">(</span>entry<span class="token punctuation">.</span><span class="token function">getKey</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> entry<span class="token punctuation">.</span><span class="token function">getValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>

        <span class="token comment">// 创建http对象</span>
        <span class="token class-name">HttpGet</span> httpGet <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpGet</span><span class="token punctuation">(</span>uriBuilder<span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token doc-comment comment">/**
         * setConnectTimeout：设置连接超时时间，单位毫秒
         * setConnectionRequestTimeout：设置从connect Manager(连接池)获取Connection
         * setSocketTimeout：请求获取数据的超时时间(即响应时间)，单位毫秒
         */</span>
        <span class="token class-name">RequestConfig</span> requestConfig <span class="token operator">=</span> <span class="token class-name">RequestConfig</span><span class="token punctuation">.</span><span class="token function">custom</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setConnectTimeout</span><span class="token punctuation">(</span><span class="token constant">CONNECT_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setSocketTimeout</span><span class="token punctuation">(</span><span class="token constant">SOCKET_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        httpGet<span class="token punctuation">.</span><span class="token function">setConfig</span><span class="token punctuation">(</span>requestConfig<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 设置请求头</span>
        <span class="token function">packageHeader</span><span class="token punctuation">(</span>headers<span class="token punctuation">,</span> httpGet<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 创建httpResponse对象</span>
        <span class="token class-name">CloseableHttpResponse</span> httpResponse <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token comment">// 执行请求并获得响应结果</span>
            <span class="token keyword">return</span> <span class="token function">getHttpClientResult</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">,</span> httpGet<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
            <span class="token comment">// 释放资源</span>
            <span class="token function">release</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送post请求；不带请求头和请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span> 请求地址
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doPost</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">doPost</span><span class="token punctuation">(</span>url<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送post请求；带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>    请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">params</span> 参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doPost</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">doPost</span><span class="token punctuation">(</span>url<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送post请求；带请求头和请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>     请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">headers</span> 请求头集合
     * <span class="token keyword">@param</span> <span class="token parameter">params</span>  请求参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doPost</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> headers<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token comment">// 创建httpClient对象</span>
        <span class="token class-name">CloseableHttpClient</span> httpClient <span class="token operator">=</span> <span class="token class-name">HttpClients</span><span class="token punctuation">.</span><span class="token function">createDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 创建http对象</span>
        <span class="token class-name">HttpPost</span> httpPost <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpPost</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token doc-comment comment">/**
         * setConnectTimeout：设置连接超时时间，单位毫秒
         * setConnectionRequestTimeout：设置从connect Manager(连接池)获取Connection
         * setSocketTimeout：请求获取数据的超时时间(即响应时间)，单位毫秒
         */</span>
        <span class="token class-name">RequestConfig</span> requestConfig <span class="token operator">=</span> <span class="token class-name">RequestConfig</span><span class="token punctuation">.</span><span class="token function">custom</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setConnectTimeout</span><span class="token punctuation">(</span><span class="token constant">CONNECT_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setSocketTimeout</span><span class="token punctuation">(</span><span class="token constant">SOCKET_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        httpPost<span class="token punctuation">.</span><span class="token function">setConfig</span><span class="token punctuation">(</span>requestConfig<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 设置请求头</span>
        <span class="token function">packageHeader</span><span class="token punctuation">(</span>headers<span class="token punctuation">,</span> httpPost<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 封装请求参数</span>
        <span class="token function">packageParam</span><span class="token punctuation">(</span>params<span class="token punctuation">,</span> httpPost<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 创建httpResponse对象</span>
        <span class="token class-name">CloseableHttpResponse</span> httpResponse <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token comment">// 执行请求并获得响应结果</span>
            <span class="token keyword">return</span> <span class="token function">getHttpClientResult</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">,</span> httpPost<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
            <span class="token comment">// 释放资源</span>
            <span class="token function">release</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送put请求；不带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span> 请求地址
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doPut</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">doPut</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送put请求；带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>    请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">params</span> 参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doPut</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token class-name">CloseableHttpClient</span> httpClient <span class="token operator">=</span> <span class="token class-name">HttpClients</span><span class="token punctuation">.</span><span class="token function">createDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">HttpPut</span> httpPut <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpPut</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">RequestConfig</span> requestConfig <span class="token operator">=</span> <span class="token class-name">RequestConfig</span><span class="token punctuation">.</span><span class="token function">custom</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setConnectTimeout</span><span class="token punctuation">(</span><span class="token constant">CONNECT_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setSocketTimeout</span><span class="token punctuation">(</span><span class="token constant">SOCKET_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        httpPut<span class="token punctuation">.</span><span class="token function">setConfig</span><span class="token punctuation">(</span>requestConfig<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token function">packageParam</span><span class="token punctuation">(</span>params<span class="token punctuation">,</span> httpPut<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token class-name">CloseableHttpResponse</span> httpResponse <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token function">getHttpClientResult</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">,</span> httpPut<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
            <span class="token function">release</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送delete请求；不带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span> 请求地址
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doDelete</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token class-name">CloseableHttpClient</span> httpClient <span class="token operator">=</span> <span class="token class-name">HttpClients</span><span class="token punctuation">.</span><span class="token function">createDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">HttpDelete</span> httpDelete <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpDelete</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">RequestConfig</span> requestConfig <span class="token operator">=</span> <span class="token class-name">RequestConfig</span><span class="token punctuation">.</span><span class="token function">custom</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setConnectTimeout</span><span class="token punctuation">(</span><span class="token constant">CONNECT_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setSocketTimeout</span><span class="token punctuation">(</span><span class="token constant">SOCKET_TIMEOUT</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        httpDelete<span class="token punctuation">.</span><span class="token function">setConfig</span><span class="token punctuation">(</span>requestConfig<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token class-name">CloseableHttpResponse</span> httpResponse <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token function">getHttpClientResult</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">,</span> httpDelete<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
            <span class="token function">release</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">,</span> httpClient<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 发送delete请求；带请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">url</span>    请求地址
     * <span class="token keyword">@param</span> <span class="token parameter">params</span> 参数集合
     * <span class="token keyword">@return</span> 返回结果
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">doDelete</span><span class="token punctuation">(</span><span class="token class-name">String</span> url<span class="token punctuation">,</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>params <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            params <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        params<span class="token punctuation">.</span><span class="token function">put</span><span class="token punctuation">(</span><span class="token string">&quot;_method&quot;</span><span class="token punctuation">,</span> <span class="token string">&quot;delete&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token function">doPost</span><span class="token punctuation">(</span>url<span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 封装请求头
     *
     * <span class="token keyword">@param</span> <span class="token parameter">params</span>     参数
     * <span class="token keyword">@param</span> <span class="token parameter">httpMethod</span> 请求方式
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">packageHeader</span><span class="token punctuation">(</span><span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">,</span> <span class="token class-name">HttpRequestBase</span> httpMethod<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 封装请求头</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>params <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">Set</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span><span class="token punctuation">&gt;</span></span> entrySet <span class="token operator">=</span> params<span class="token punctuation">.</span><span class="token function">entrySet</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> entry <span class="token operator">:</span> entrySet<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                <span class="token comment">// 设置到请求头到HttpRequestBase对象中</span>
                httpMethod<span class="token punctuation">.</span><span class="token function">setHeader</span><span class="token punctuation">(</span>entry<span class="token punctuation">.</span><span class="token function">getKey</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> entry<span class="token punctuation">.</span><span class="token function">getValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 封装请求参数
     *
     * <span class="token keyword">@param</span> <span class="token parameter">params</span>     返回结果
     * <span class="token keyword">@param</span> <span class="token parameter">httpMethod</span> 请求方式
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">UnsupportedEncodingException</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">packageParam</span><span class="token punctuation">(</span><span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> params<span class="token punctuation">,</span> <span class="token class-name">HttpEntityEnclosingRequestBase</span> httpMethod<span class="token punctuation">)</span>
            <span class="token keyword">throws</span> <span class="token class-name">UnsupportedEncodingException</span> <span class="token punctuation">{</span>
        <span class="token comment">// 封装请求参数</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>params <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">List</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">NameValuePair</span><span class="token punctuation">&gt;</span></span> nvps <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ArrayList</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">NameValuePair</span><span class="token punctuation">&gt;</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">Set</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span><span class="token punctuation">&gt;</span></span> entrySet <span class="token operator">=</span> params<span class="token punctuation">.</span><span class="token function">entrySet</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">Map<span class="token punctuation">.</span>Entry</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">&gt;</span></span> entry <span class="token operator">:</span> entrySet<span class="token punctuation">)</span> <span class="token punctuation">{</span>
                nvps<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">BasicNameValuePair</span><span class="token punctuation">(</span>entry<span class="token punctuation">.</span><span class="token function">getKey</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> entry<span class="token punctuation">.</span><span class="token function">getValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>

            <span class="token comment">// 设置到请求的http对象中</span>
            httpMethod<span class="token punctuation">.</span><span class="token function">setEntity</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">UrlEncodedFormEntity</span><span class="token punctuation">(</span>nvps<span class="token punctuation">,</span> <span class="token constant">ENCODING</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 获得响应结果
     *
     * <span class="token keyword">@param</span> <span class="token parameter">httpResponse</span> 响应
     * <span class="token keyword">@param</span> <span class="token parameter">httpClient</span>   http客户端
     * <span class="token keyword">@param</span> <span class="token parameter">httpMethod</span>   请求方式
     * <span class="token keyword">@return</span> 返回结果集
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">Exception</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">HttpClientResult</span> <span class="token function">getHttpClientResult</span><span class="token punctuation">(</span><span class="token class-name">CloseableHttpResponse</span> httpResponse<span class="token punctuation">,</span>
                                                       <span class="token class-name">CloseableHttpClient</span> httpClient<span class="token punctuation">,</span> <span class="token class-name">HttpRequestBase</span> httpMethod<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span>
        <span class="token comment">// 执行请求</span>
        httpResponse <span class="token operator">=</span> httpClient<span class="token punctuation">.</span><span class="token function">execute</span><span class="token punctuation">(</span>httpMethod<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 获取返回结果</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>httpResponse <span class="token operator">!=</span> <span class="token keyword">null</span> <span class="token operator">&amp;&amp;</span> httpResponse<span class="token punctuation">.</span><span class="token function">getStatusLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">String</span> content <span class="token operator">=</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>httpResponse<span class="token punctuation">.</span><span class="token function">getEntity</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                content <span class="token operator">=</span> <span class="token class-name">EntityUtils</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">.</span><span class="token function">getEntity</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token constant">ENCODING</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
            <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">HttpClientResult</span><span class="token punctuation">(</span>httpResponse<span class="token punctuation">.</span><span class="token function">getStatusLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getStatusCode</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> content<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">HttpClientResult</span><span class="token punctuation">(</span><span class="token class-name">HttpStatus</span><span class="token punctuation">.</span><span class="token constant">SC_INTERNAL_SERVER_ERROR</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 释放资源
     *
     * <span class="token keyword">@param</span> <span class="token parameter">httpResponse</span> 响应
     * <span class="token keyword">@param</span> <span class="token parameter">httpClient</span>   http客户端
     * <span class="token keyword">@throws</span> <span class="token reference"><span class="token class-name">IOException</span></span> 异常抛出 未处理
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">release</span><span class="token punctuation">(</span><span class="token class-name">CloseableHttpResponse</span> httpResponse<span class="token punctuation">,</span> <span class="token class-name">CloseableHttpClient</span> httpClient<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">IOException</span> <span class="token punctuation">{</span>
        <span class="token comment">// 释放资源</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>httpResponse <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            httpResponse<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>httpClient <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            httpClient<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,12),c=[e];function o(l,i){return s(),a("div",null,c)}const r=n(p,[["render",o],["__file","HttpClient.html.vue"]]);export{r as default};
