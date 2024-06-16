<template><div><h1 id="一、负载均衡策略" tabindex="-1"><a class="header-anchor" href="#一、负载均衡策略" aria-hidden="true">#</a> 一、负载均衡策略</h1>
<p>负载均衡用于从“upstream”模块定义的后端服务器列表中选取一台服务器接受用户的请求。一个最基本的upstream模块是这样的，模块内的server是服务器列表：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#动态服务器组
upstream dynamic_zuoyu <span class="token punctuation">{</span>
    server localhost<span class="token operator">:</span><span class="token number">8080</span><span class="token punctuation">;</span>  #tomcat1
    server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat2
    server localhost<span class="token operator">:</span><span class="token number">8082</span><span class="token punctuation">;</span>  #tomcat3
    server localhost<span class="token operator">:</span><span class="token number">8083</span><span class="token punctuation">;</span>  #tomcat4
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在upstream模块配置完成后，要让指定的访问反向代理到服务器列表：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#其他页面反向代理到tomcat容器
location <span class="token operator">~</span> <span class="token punctuation">.</span>*$ <span class="token punctuation">{</span>
    index index<span class="token punctuation">.</span>jsp index<span class="token punctuation">.</span>html<span class="token punctuation">;</span>
    proxy_pass http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>dynamic_zuoyu<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这就是最基本的负载均衡实例，但这不足以满足实际需求；目前Nginx服务器的upstream模块支持6种方式的分配：<br>
负载均衡策略<br>
<img src="/assets/images/img_nginx.png" alt="img_1.png" loading="lazy"><br>
在这里，只详细说明Nginx自带的负载均衡策略，第三方不多描述。</p>
<h2 id="_1、轮询" tabindex="-1"><a class="header-anchor" href="#_1、轮询" aria-hidden="true">#</a> 1、轮询</h2>
<p>最基本的配置方法，上面的例子就是轮询的方式，它是upstream模块默认的负载均衡默认策略。每个请求会按时间顺序逐一分配到不同的后端服务器。<br>
　有如下参数：<br>
<img src="/assets/images/img_nginx2.png" alt="img.png" loading="lazy"><br>
注意：</p>
<ul>
<li>在轮询中，如果服务器down掉了，会自动剔除该服务器。</li>
<li>缺省配置就是轮询策略。</li>
<li>此策略适合服务器配置相当，无状态且短平快的服务使用。</li>
</ul>
<h2 id="_2、weight" tabindex="-1"><a class="header-anchor" href="#_2、weight" aria-hidden="true">#</a> 2、weight</h2>
<p>权重方式，在轮询策略的基础上指定轮询的几率。例子如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code> upstream dynamic_zuoyu <span class="token punctuation">{</span>
        server localhost<span class="token operator">:</span><span class="token number">8080</span>   weight<span class="token operator">=</span><span class="token number">2</span><span class="token punctuation">;</span>  #tomcat <span class="token number">1</span>
        server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat <span class="token number">2</span>
        server localhost<span class="token operator">:</span><span class="token number">8082</span>   backup<span class="token punctuation">;</span>  #tomcat <span class="token number">3</span>
        server localhost<span class="token operator">:</span><span class="token number">8083</span>   max_fails<span class="token operator">=</span><span class="token number">3</span> fail_timeout<span class="token operator">=</span><span class="token number">20</span>s<span class="token punctuation">;</span>  #tomcat <span class="token number">4</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在该例子中，weight参数用于指定轮询几率，weight的默认值为1,；weight的数值与访问比率成正比，比如Tomcat 7.0被访问的几率为其他服务器的两倍。<br>
注意：</p>
<ul>
<li>权重越高分配到需要处理的请求越多。</li>
<li>此策略可以与least_conn和ip_hash结合使用。</li>
<li>此策略比较适合服务器的硬件配置差别比较大的情况。</li>
</ul>
<h2 id="_3、ip-hash" tabindex="-1"><a class="header-anchor" href="#_3、ip-hash" aria-hidden="true">#</a> 3、ip_hash</h2>
<p>指定负载均衡器按照基于客户端IP的分配方式，这个方法确保了相同的客户端的请求一直发送到相同的服务器，以保证session会话。这样每个访客都固定访问一个后端服务器，可以解决session不能跨服务器的问题。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#动态服务器组
    upstream dynamic_zuoyu <span class="token punctuation">{</span>
        ip_hash<span class="token punctuation">;</span>    #保证每个访客固定访问一个后端服务器
        server localhost<span class="token operator">:</span><span class="token number">8080</span>   weight<span class="token operator">=</span><span class="token number">2</span><span class="token punctuation">;</span>  #tomcat <span class="token number">1</span>
        server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat <span class="token number">2</span>
        server localhost<span class="token operator">:</span><span class="token number">8082</span><span class="token punctuation">;</span>  #tomcat <span class="token number">3</span>
        server localhost<span class="token operator">:</span><span class="token number">8083</span>   max_fails<span class="token operator">=</span><span class="token number">3</span> fail_timeout<span class="token operator">=</span><span class="token number">20</span>s<span class="token punctuation">;</span>  #tomcat <span class="token number">4</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>注意：</p>
<ul>
<li>在nginx版本1.3.1之前，不能在ip_hash中使用权重（weight）。</li>
<li>ip_hash不能与backup同时使用。</li>
<li>此策略适合有状态服务，比如session。</li>
<li>当有服务器需要剔除，必须手动down掉。</li>
</ul>
<h2 id="_4、least-conn" tabindex="-1"><a class="header-anchor" href="#_4、least-conn" aria-hidden="true">#</a> 4、least_conn</h2>
<p>把请求转发给连接数较少的后端服务器。轮询算法是把请求平均的转发给各个后端，使它们的负载大致相同；但是，有些请求占用的时间很长，会导致其所在的后端负载较高。这种情况下，least_conn这种方式就可以达到更好的负载均衡效果。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#动态服务器组
upstream dynamic_zuoyu <span class="token punctuation">{</span>
    least_conn<span class="token punctuation">;</span>    #把请求转发给连接数较少的后端服务器
    server localhost<span class="token operator">:</span><span class="token number">8080</span>   weight<span class="token operator">=</span><span class="token number">2</span><span class="token punctuation">;</span>  #tomcat <span class="token number">1</span>
    server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat <span class="token number">2</span>
    server localhost<span class="token operator">:</span><span class="token number">8082</span> backup<span class="token punctuation">;</span>  #tomcat <span class="token number">3</span>
    server localhost<span class="token operator">:</span><span class="token number">8083</span>   max_fails<span class="token operator">=</span><span class="token number">3</span> fail_timeout<span class="token operator">=</span><span class="token number">20</span>s<span class="token punctuation">;</span>  #tomcat <span class="token number">4</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5、第三方策略" tabindex="-1"><a class="header-anchor" href="#_5、第三方策略" aria-hidden="true">#</a> 5、第三方策略</h2>
<h3 id="_1-fair" tabindex="-1"><a class="header-anchor" href="#_1-fair" aria-hidden="true">#</a> （1）fair</h3>
<p>按照服务器端的响应时间来分配请求，响应时间短的优先分配。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 动态服务器组
upstream dynamic_zuoyu <span class="token punctuation">{</span>
        server localhost<span class="token operator">:</span><span class="token number">8080</span><span class="token punctuation">;</span>  #tomcat <span class="token number">1</span>
        server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat <span class="token number">2</span>
        server localhost<span class="token operator">:</span><span class="token number">8082</span><span class="token punctuation">;</span>  #tomcat <span class="token number">3</span>
        server localhost<span class="token operator">:</span><span class="token number">8083</span><span class="token punctuation">;</span>  #tomcat <span class="token number">4</span>
        fair<span class="token punctuation">;</span>    #实现响应时间短的优先分配
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-url-hash" tabindex="-1"><a class="header-anchor" href="#_2-url-hash" aria-hidden="true">#</a> （2）url_hash</h3>
<p>按访问url的hash结果来分配请求，使每个url定向到同一个后端服务器，要配合缓存命中来使用。<br>
同一个资源多次请求，可能会到达不同的服务器上，导致不必要的多次下载，缓存命中率不高，以及一些资源时间的浪费。<br>
而使用url_hash，可以使得同一个url（也就是同一个资源请求）会到达同一台服务器，一旦缓存住了资源，再此收到请求，就可以从缓存中读取。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#动态服务器组
upstream dynamic_zuoyu <span class="token punctuation">{</span>
    hash $request_uri<span class="token punctuation">;</span>    #实现每个url定向到同一个后端服务器
    server localhost<span class="token operator">:</span><span class="token number">8080</span><span class="token punctuation">;</span>  #tomcat <span class="token number">1</span>
    server localhost<span class="token operator">:</span><span class="token number">8081</span><span class="token punctuation">;</span>  #tomcat <span class="token number">2</span>
    server localhost<span class="token operator">:</span><span class="token number">8082</span><span class="token punctuation">;</span>  #tomcat <span class="token number">3</span>
    server localhost<span class="token operator">:</span><span class="token number">8083</span><span class="token punctuation">;</span>  #tomcat <span class="token number">4</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="二、nginx匹配规则" tabindex="-1"><a class="header-anchor" href="#二、nginx匹配规则" aria-hidden="true">#</a> 二、nginx匹配规则</h1>
<p>nginx.conf主要由三部分组成：全局块， events块， http块，详细如下：</p>
<ul>
<li>1、全局块：配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，允许生成worker process数等。</li>
<li>2、events块：配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。</li>
<li>3、http块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件，连接超时时间，单连接请求数等。</li>
<li>4、server块：配置虚拟主机的相关参数，一个http中可以有多个server。</li>
<li>5、location块：配置请求的路由，以及各种页面的处理情况。</li>
</ul>
<h2 id="_1-语法" tabindex="-1"><a class="header-anchor" href="#_1-语法" aria-hidden="true">#</a> （1）语法</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token punctuation">[</span><span class="token operator">=</span><span class="token operator">|</span><span class="token operator">~</span><span class="token operator">|</span><span class="token operator">~</span><span class="token operator">*</span><span class="token operator">|</span><span class="token operator">^</span><span class="token operator">~</span><span class="token punctuation">]</span> <span class="token operator">/</span>uri<span class="token operator">/</span> <span class="token punctuation">{</span> … <span class="token punctuation">}</span>
location <span class="token operator">=</span> <span class="token operator">/</span>uri    <span class="token operator">=</span> 表示精确匹配，只有完全匹配上才能生效
location <span class="token operator">^</span><span class="token operator">~</span> <span class="token operator">/</span>uri    <span class="token operator">^</span><span class="token operator">~</span> 开头对<span class="token constant">URL</span>路径进行前缀匹配，并且在正则之前。
location <span class="token operator">~</span> pattern    开头表示区分大小写的正则匹配
location <span class="token operator">~</span><span class="token operator">*</span> pattern    开头表示不区分大小写的正则匹配
location <span class="token operator">/</span>uri    不带任何修饰符，也表示前缀匹配，但是在正则匹配之后
location <span class="token operator">/</span>    通用匹配，任何未匹配到其它location的请求都会匹配到，相当于<span class="token keyword">switch</span>中的<span class="token keyword">default</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>优先级：(location =) &gt; (location 完整路径) &gt; (location ^~ 路径) &gt; (location <sub>,</sub>* 正则顺序) &gt; (location 部分起始路径) &gt; (/)<br>
前缀匹配时，Nginx 不对 url 做编码，因此请求为 /static/20%/aa，可以被规则 ^~ /static/ /aa 匹配到（注意是空格）</p>
<h2 id="_2-规则" tabindex="-1"><a class="header-anchor" href="#_2-规则" aria-hidden="true">#</a> （2）规则</h2>
<p>一个请求过来后，Nginx匹配这个请求的流程如下：</p>
<ul>
<li>1&gt; 先查找是否有=开头的精确匹配，</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>如：location <span class="token operator">=</span> <span class="token operator">/</span>test<span class="token operator">/</span>abc<span class="token operator">/</span>user<span class="token punctuation">.</span><span class="token keyword">do</span> <span class="token punctuation">{</span> … <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ul>
<li>2&gt; 再查找普通匹配，以 最大前缀 为原则，如有以下两个location，则会匹配后一项</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>  location <span class="token operator">/</span>test<span class="token operator">/</span> <span class="token punctuation">{</span> … <span class="token punctuation">}</span>
  location <span class="token operator">/</span>test<span class="token operator">/</span>abc <span class="token punctuation">{</span> … <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>3&gt; 匹配到一个普通格式后，搜索并未结束，而是暂存当前匹配的结果，并继续搜索正则匹配模式</li>
<li>4&gt; 所有正则匹配模式location中找到第一个匹配项后，就以此项为最终匹配结果<br>
所以正则匹配项匹配规则，受定义的前后顺序影响，但普通匹配模式不会</li>
<li>5&gt; 如果未找到正则匹配项，则以3中缓存的结果为最终匹配结果</li>
<li>6&gt; 如果一个匹配都没搜索到，则返回404<br>
注：精确匹配与模糊匹配差别：</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>  location <span class="token operator">=</span><span class="token operator">/</span> <span class="token punctuation">{</span> … <span class="token punctuation">}</span> 与 location <span class="token operator">/</span> <span class="token punctuation">{</span> … <span class="token punctuation">}</span> 的差别：
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ul>
<li>前一个是精确匹配，只响应/请求，所有/xxx或/xxx/xxxx类的请求都不会以前缀的形式匹配到它</li>
<li>后一个是只要以 / 为前缀的请求都会被匹配到。如：/abc ， /test/abc， /test/abc/aaaa<br>
示例1</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>server <span class="token punctuation">{</span>
	listen <span class="token number">80</span><span class="token punctuation">;</span>
	server_name x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">;</span>
	<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
	location <span class="token operator">/</span>subdir <span class="token punctuation">{</span>
		proxy_pass http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token punctuation">;</span>   ###注意这里没有以<span class="token operator">/</span>结尾
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
# 那么用户请求http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token operator">/</span>subdir<span class="token operator">/</span>other时，匹配到该区块，nginx反代会保留虚拟路径
# nginx实际转发后端的请求<span class="token constant">URL</span>为http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token operator">/</span>subdir<span class="token operator">/</span>other
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>示例2</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>server <span class="token punctuation">{</span>
	listen <span class="token number">80</span><span class="token punctuation">;</span>
	server_name x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">;</span>
	<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
	location <span class="token operator">/</span>subdir <span class="token punctuation">{</span>
		proxy_pass http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token operator">/</span><span class="token punctuation">;</span>   ##注意这里以<span class="token operator">/</span>结尾
	<span class="token punctuation">}</span>
<span class="token punctuation">}</span>
# 那么用户请求http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token punctuation">.</span>x<span class="token operator">/</span>subdir<span class="token operator">/</span>other时，匹配到该区块，nginx反代不会保留虚拟路径，
# nginx实际转发后端的请求<span class="token constant">URL</span>为http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token punctuation">.</span>y<span class="token comment">//other</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="二、rewrite重写" tabindex="-1"><a class="header-anchor" href="#二、rewrite重写" aria-hidden="true">#</a> 二、rewrite重写</h1>
<h2 id="rewrite使用场景" tabindex="-1"><a class="header-anchor" href="#rewrite使用场景" aria-hidden="true">#</a> rewrite使用场景：</h2>
<ul>
<li>地址跳转，用户访问www.nginx01.com这个URL时，<a href="http://xn--www-p18dohn1qxmf3a288f0uj57an88eez9byp7a.nginx02.com" target="_blank" rel="noopener noreferrer">将其定向至一个新的域名www.nginx02.com<ExternalLinkIcon/></a></li>
<li>协议跳转，将用户通过http的请求协议重新跳转至https协议(实现https主要手段)。</li>
<li>URL静态化，将动态URL地址显示为静态URL的一种技术，能提高搜索引擎抓取 并且能减少动态URL对外暴露过多的参数。PS:Rewrite会轻微增加服务器负担。</li>
</ul>
<h2 id="四种方案" tabindex="-1"><a class="header-anchor" href="#四种方案" aria-hidden="true">#</a> 四种方案</h2>
<ul>
<li>last 停止处理后续rewrite指令集，跳出location作用域，并开始搜索与更改后的URI相匹配的location，URL地址不变</li>
<li>break 停止处理后续rewrite指令集，不会跳出location作用域，不再进行重新查找，终止匹配，URL地址不变</li>
<li>redirect 返回302临时重定向，浏览器地址栏会显示跳转后的URL地址，爬虫不会更新自己的URL数据库</li>
<li>permanent 返回301永久重定向，浏览器地址栏会显示跳转后的URL地址，爬虫会更新自己的URL数据库<br>
注：使用last和break时浏览器中的地址不会改变，使用redirect和permanent则会改变</li>
</ul>
<h1 id="三、return" tabindex="-1"><a class="header-anchor" href="#三、return" aria-hidden="true">#</a> 三、return</h1>
<h2 id="返回状态码" tabindex="-1"><a class="header-anchor" href="#返回状态码" aria-hidden="true">#</a> 返回状态码</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token operator">/</span>test <span class="token punctuation">{</span>    
    set $name 'user123'<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token number">404</span>  $name<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="返回字符串" tabindex="-1"><a class="header-anchor" href="#返回字符串" aria-hidden="true">#</a> 返回字符串</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token operator">/</span>test <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token number">200</span> <span class="token char">'hello'</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="地址跳转" tabindex="-1"><a class="header-anchor" href="#地址跳转" aria-hidden="true">#</a> 地址跳转</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token operator">/</span>test <span class="token punctuation">{</span>    
    <span class="token keyword">return</span> http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>www<span class="token punctuation">.</span>baidu<span class="token punctuation">.</span>com<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="返回自定义变量" tabindex="-1"><a class="header-anchor" href="#返回自定义变量" aria-hidden="true">#</a> 返回自定义变量</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>set $name 'user123'<span class="token punctuation">;</span>
<span class="token keyword">return</span> <span class="token number">200</span> $name<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="返回内置变量" tabindex="-1"><a class="header-anchor" href="#返回内置变量" aria-hidden="true">#</a> 返回内置变量</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">return</span> $uri<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="返回日志信息实例" tabindex="-1"><a class="header-anchor" href="#返回日志信息实例" aria-hidden="true">#</a> 返回日志信息实例</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">return</span>  <span class="token number">200</span> '$remote_addr <span class="token operator">-</span> $remote_user <span class="token punctuation">[</span>$time_local<span class="token punctuation">]</span> <span class="token string">"$request"</span> $status $body_bytes_sent <span class="token string">"$http_referer"</span> <span class="token string">"$http_user_agent"</span> <span class="token string">"$http_x_forwarded_for"</span>'<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h1 id="四-、常用的全局变量" tabindex="-1"><a class="header-anchor" href="#四-、常用的全局变量" aria-hidden="true">#</a> 四 、常用的全局变量</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>例：http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>www<span class="token punctuation">.</span>abc<span class="token punctuation">.</span>com<span class="token operator">:</span><span class="token number">99</span><span class="token operator">/</span>aa<span class="token operator">/</span>bb<span class="token operator">/</span>test<span class="token punctuation">.</span>jsp
$host　　　　　　　　www<span class="token punctuation">.</span>abc<span class="token punctuation">.</span>com
$server_port　　　　　<span class="token number">8080</span>
$request_uri　　　　 <span class="token operator">/</span>aa<span class="token operator">/</span>bb<span class="token operator">/</span>test<span class="token punctuation">.</span>jsp
$document_root　　 <span class="token operator">/</span>pm_code
$request_filename　　<span class="token operator">/</span>pm_code<span class="token operator">/</span>aa<span class="token operator">/</span>bb<span class="token operator">/</span>test<span class="token punctuation">.</span>jsp
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="五、root和alias指令" tabindex="-1"><a class="header-anchor" href="#五、root和alias指令" aria-hidden="true">#</a> 五、root和alias指令</h1>
<h2 id="root" tabindex="-1"><a class="header-anchor" href="#root" aria-hidden="true">#</a> root</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token operator">/</span>i<span class="token operator">/</span> <span class="token punctuation">{</span>  
    root <span class="token operator">/</span>data<span class="token operator">/</span>w3<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
# 请求 http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>test<span class="token punctuation">.</span>net<span class="token operator">/</span>i<span class="token operator">/</span>picture<span class="token punctuation">.</span>jpg 这个地址时，那么在服务器里面对应的真正的资源
# 注意：真实的路径是root指定的值加上location指定的值 。
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="alias" tabindex="-1"><a class="header-anchor" href="#alias" aria-hidden="true">#</a> alias</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>location <span class="token operator">/</span>i<span class="token operator">/</span> <span class="token punctuation">{</span>  
    alias <span class="token operator">/</span>data<span class="token operator">/</span>w3<span class="token operator">/</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
# 同样请求 http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>test<span class="token punctuation">.</span>net<span class="token operator">/</span>i<span class="token operator">/</span>picture<span class="token punctuation">.</span>jpg 时，在服务器查找的资源路径是： <span class="token operator">/</span>data<span class="token operator">/</span>w3<span class="token operator">/</span>picture<span class="token punctuation">.</span>jpg
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>区别：</p>
<ul>
<li>alias 只能作用在location中，而root可以存在server、http和location中。</li>
<li>alias 后面必须要用 “/” 结束，否则会找不到文件，而 root 则对 ”/” 可有可无。</li>
</ul>
<h1 id="六、gzip" tabindex="-1"><a class="header-anchor" href="#六、gzip" aria-hidden="true">#</a> 六、Gzip</h1>
<p>将响应报⽂发送⾄客户端之前可以启⽤压缩功能，这能够有效地节约带宽，并提⾼响应⾄客户端的速度。Gzip压缩可以配置http,server和location模块下。<br>
配置如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>gzip on<span class="token punctuation">;</span>                 #决定是否开启gzip模块，on表示开启，off表示关闭；
gzip_min_length <span class="token number">1</span>k<span class="token punctuation">;</span>      #设置允许压缩的页面最小字节<span class="token punctuation">(</span>从header头的<span class="token class-name">Content</span><span class="token operator">-</span><span class="token class-name">Length</span>中获取<span class="token punctuation">)</span> ，当返回内容大于此值时才会使用gzip进行压缩<span class="token punctuation">,</span>以<span class="token class-name">K</span>为单位<span class="token punctuation">,</span>当值为<span class="token number">0</span>时，所有页面都进行压缩。建议大于<span class="token number">1</span>k
gzip_buffers <span class="token number">4</span> <span class="token number">16</span>k<span class="token punctuation">;</span>      #设置gzip申请内存的大小<span class="token punctuation">,</span>其作用是按块大小的倍数申请内存空间<span class="token punctuation">,</span>param2<span class="token operator">:</span><span class="token keyword">int</span><span class="token punctuation">(</span>k<span class="token punctuation">)</span> 后面单位是k。这里设置以<span class="token number">16</span>k为单位<span class="token punctuation">,</span>按照原始数据大小以<span class="token number">16</span>k为单位的<span class="token number">4</span>倍申请内存
gzip_http_version <span class="token number">1.1</span><span class="token punctuation">;</span>   #识别http协议的版本<span class="token punctuation">,</span>早起浏览器可能不支持gzip自解压<span class="token punctuation">,</span>用户会看到乱码
gzip_comp_level <span class="token number">2</span><span class="token punctuation">;</span>       #设置gzip压缩等级，等级越底压缩速度越快文件压缩比越小，反之速度越慢文件压缩比越大；等级<span class="token number">1</span><span class="token operator">-</span><span class="token number">9</span>，最小的压缩最快 但是消耗cpu
gzip_types text<span class="token operator">/</span>plain application<span class="token operator">/</span>x<span class="token operator">-</span>javascript text<span class="token operator">/</span>css application<span class="token operator">/</span>xml<span class="token punctuation">;</span>    #设置需要压缩的<span class="token constant">MIME</span>类型<span class="token punctuation">,</span>非设置值不进行压缩，即匹配压缩类型
gzip_vary on<span class="token punctuation">;</span>            #启用应答头<span class="token string">"Vary: Accept-Encoding"</span>
gzip_proxied off<span class="token punctuation">;</span>
nginx做为反向代理时启用<span class="token punctuation">,</span><span class="token function">off</span><span class="token punctuation">(</span>关闭所有代理结果的数据的压缩<span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token function">expired</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>如果header头中包括<span class="token string">"Expires"</span>头信息<span class="token punctuation">)</span><span class="token punctuation">,</span>no<span class="token operator">-</span><span class="token function">cache</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>header头中包含<span class="token string">"Cache-Control:no-cache"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
no<span class="token operator">-</span><span class="token function">store</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>header头中包含<span class="token string">"Cache-Control:no-store"</span><span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token keyword">private</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>header头中包含<span class="token string">"Cache-Control:private"</span><span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token function">no_last_modefied</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>header头中不包含
<span class="token string">"Last-Modified"</span><span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token function">no_etag</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>如果header头中不包含<span class="token string">"Etag"</span>头信息<span class="token punctuation">)</span><span class="token punctuation">,</span><span class="token function">auth</span><span class="token punctuation">(</span>启用压缩<span class="token punctuation">,</span>如果header头中包含<span class="token string">"Authorization"</span>头信息<span class="token punctuation">)</span>
gzip_disable msie6<span class="token punctuation">;</span>
<span class="token punctuation">(</span><span class="token constant">IE5</span><span class="token punctuation">.</span><span class="token number">5</span>和<span class="token constant">IE6</span> <span class="token constant">SP1</span>使用msie6参数来禁止gzip压缩 <span class="token punctuation">)</span>指定哪些不需要gzip压缩的浏览器<span class="token punctuation">(</span>将和<span class="token class-name">User</span><span class="token operator">-</span><span class="token class-name">Agents</span>进行匹配<span class="token punctuation">)</span><span class="token punctuation">,</span>依赖于<span class="token constant">PCRE</span>库
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>推荐配置如下：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>gzip on<span class="token punctuation">;</span>						#开启gzip压缩功能
gzip_min_length <span class="token number">10</span>k<span class="token punctuation">;</span>			#设置允许压缩的页面最小字节数<span class="token punctuation">;</span> 这里表示如果文件小于<span class="token number">10</span>个字节，就不用压缩，因为没有意义，本来就很小<span class="token punctuation">.</span>
gzip_buffers <span class="token number">4</span> <span class="token number">16</span>k<span class="token punctuation">;</span>			#设置压缩缓冲区大小，此处设置为<span class="token number">4</span>个<span class="token number">16</span>K内存作为压缩结果流缓存
gzip_http_version <span class="token number">1.1</span><span class="token punctuation">;</span>			#压缩版本
gzip_comp_level <span class="token number">6</span><span class="token punctuation">;</span>			#设置压缩比率，最小为<span class="token number">1</span>，处理速度快，传输速度慢；<span class="token number">9</span>为最大压缩比，处理速度慢，传输速度快<span class="token punctuation">;</span> 这里表示压缩级别，可以是<span class="token number">0</span>到<span class="token number">9</span>中的任一个，级别越高，压缩就越小，节省了带宽资源，但同时也消耗<span class="token constant">CPU</span>资源，所以一般折中为<span class="token number">6</span>
gzip types text<span class="token operator">/</span>css text<span class="token operator">/</span>xml application<span class="token operator">/</span>javascript<span class="token punctuation">;</span>		#制定压缩的类型<span class="token punctuation">,</span>线上配置时尽可能配置多的压缩类型<span class="token operator">!</span>
gzip_disable <span class="token string">"MSIE [1-6]\."</span><span class="token punctuation">;</span>		#配置禁用gzip条件，支持正则。此处表示ie6及以下不启用gzip（因为ie低版本不支持）
gzip vary on<span class="token punctuation">;</span>					#选择支持vary header；改选项可以让前端的缓存服务器缓存经过gzip压缩的页面<span class="token punctuation">;</span> 这个可以不写，表示在传送数据时，给客户端说明我使用了gzip压缩
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="七、配置https示例" tabindex="-1"><a class="header-anchor" href="#七、配置https示例" aria-hidden="true">#</a> 七、配置https示例</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>http <span class="token punctuation">{</span>
        include mime<span class="token punctuation">.</span>types<span class="token punctuation">;</span>
	    #include luawaf<span class="token punctuation">.</span>conf<span class="token punctuation">;</span>
	    #include proxy<span class="token punctuation">.</span>conf<span class="token punctuation">;</span>
        default_type  application<span class="token operator">/</span>octet<span class="token operator">-</span>stream<span class="token punctuation">;</span>
        server_names_hash_bucket_size <span class="token number">512</span><span class="token punctuation">;</span>
        client_header_buffer_size <span class="token number">32</span>k<span class="token punctuation">;</span>
        large_client_header_buffers <span class="token number">4</span> <span class="token number">32</span>k<span class="token punctuation">;</span>
        client_max_body_size <span class="token number">50</span>m<span class="token punctuation">;</span>
        sendfile   on<span class="token punctuation">;</span>
        tcp_nopush on<span class="token punctuation">;</span>
        keepalive_timeout <span class="token number">60</span><span class="token punctuation">;</span>
        tcp_nodelay on<span class="token punctuation">;</span>
        fastcgi_connect_timeout <span class="token number">300</span><span class="token punctuation">;</span>
        fastcgi_send_timeout <span class="token number">300</span><span class="token punctuation">;</span>
        fastcgi_read_timeout <span class="token number">300</span><span class="token punctuation">;</span>
        fastcgi_buffer_size <span class="token number">64</span>k<span class="token punctuation">;</span>
        fastcgi_buffers <span class="token number">4</span> <span class="token number">64</span>k<span class="token punctuation">;</span>
        fastcgi_busy_buffers_size <span class="token number">128</span>k<span class="token punctuation">;</span>
        fastcgi_temp_file_write_size <span class="token number">256</span>k<span class="token punctuation">;</span>
		fastcgi_intercept_errors on<span class="token punctuation">;</span>

        gzip on<span class="token punctuation">;</span>
        gzip_min_length  <span class="token number">1</span>k<span class="token punctuation">;</span>
        gzip_buffers     <span class="token number">4</span> <span class="token number">16</span>k<span class="token punctuation">;</span>
        gzip_http_version <span class="token number">1.1</span><span class="token punctuation">;</span>
        gzip_comp_level <span class="token number">2</span><span class="token punctuation">;</span>
        gzip_types     text<span class="token operator">/</span>plain application<span class="token operator">/</span>javascript application<span class="token operator">/</span>x<span class="token operator">-</span>javascript text<span class="token operator">/</span>javascript text<span class="token operator">/</span>css application<span class="token operator">/</span>xml<span class="token punctuation">;</span>
        gzip_vary on<span class="token punctuation">;</span>
        gzip_proxied   expired no<span class="token operator">-</span>cache no<span class="token operator">-</span>store <span class="token keyword">private</span> auth<span class="token punctuation">;</span>
        gzip_disable   <span class="token string">"MSIE [1-6]\."</span><span class="token punctuation">;</span>

        limit_conn_zone $binary_remote_addr zone<span class="token operator">=</span>perip<span class="token operator">:</span><span class="token number">10</span>m<span class="token punctuation">;</span>
		limit_conn_zone $server_name zone<span class="token operator">=</span>perserver<span class="token operator">:</span><span class="token number">10</span>m<span class="token punctuation">;</span>

        server_tokens off<span class="token punctuation">;</span>
        access_log off<span class="token punctuation">;</span>
	upstream webservers<span class="token punctuation">{</span>
            server  <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">8082</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        server <span class="token punctuation">{</span>
            #<span class="token constant">SSL</span> 默认访问端口号为 <span class="token number">443</span>
            listen <span class="token number">443</span> ssl<span class="token punctuation">;</span>
            #请填写绑定证书的域名
            server_name www<span class="token punctuation">.</span>tianqi<span class="token punctuation">.</span>icu<span class="token punctuation">;</span> 
            #请填写证书文件的相对路径或绝对路径
            ssl_certificate  <span class="token operator">/</span>etc<span class="token operator">/</span>nginx<span class="token operator">/</span>tianqi<span class="token punctuation">.</span>icu_bundle<span class="token punctuation">.</span>crt<span class="token punctuation">;</span> 
            #请填写私钥文件的相对路径或绝对路径
            ssl_certificate_key <span class="token operator">/</span>etc<span class="token operator">/</span>nginx<span class="token operator">/</span>tianqi<span class="token punctuation">.</span>icu<span class="token punctuation">.</span>key<span class="token punctuation">;</span> 
            ssl_session_timeout <span class="token number">5</span>m<span class="token punctuation">;</span>
            #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
            ssl_ciphers <span class="token constant">ECDHE</span><span class="token operator">-</span><span class="token constant">RSA</span><span class="token operator">-</span><span class="token constant">AES128</span><span class="token operator">-</span><span class="token constant">GCM</span><span class="token operator">-</span><span class="token constant">SHA256</span><span class="token operator">:</span><span class="token constant">ECDHE</span><span class="token operator">:</span><span class="token constant">ECDH</span><span class="token operator">:</span><span class="token constant">AES</span><span class="token operator">:</span><span class="token constant">HIGH</span><span class="token operator">:</span><span class="token operator">!</span><span class="token constant">NULL</span><span class="token operator">:</span><span class="token operator">!</span>aNULL<span class="token operator">:</span><span class="token operator">!</span><span class="token constant">MD5</span><span class="token operator">:</span><span class="token operator">!</span><span class="token constant">ADH</span><span class="token operator">:</span><span class="token operator">!</span><span class="token constant">RC4</span><span class="token punctuation">;</span>
            #请按照以下协议配置
            ssl_protocols <span class="token class-name">TLSv1</span><span class="token number">.2</span> <span class="token class-name">TLSv1</span><span class="token number">.3</span><span class="token punctuation">;</span>
            ssl_prefer_server_ciphers on<span class="token punctuation">;</span>
            location <span class="token operator">/</span> <span class="token punctuation">{</span>
                #<span class="token keyword">if</span> <span class="token punctuation">(</span> $host <span class="token operator">=</span> '<span class="token number">152.136</span><span class="token number">.121</span><span class="token number">.33</span>' <span class="token punctuation">)</span> <span class="token punctuation">{</span>
		#    <span class="token keyword">return</span> <span class="token number">301</span> https<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>zhengtianqi<span class="token punctuation">.</span>asia$request_uri<span class="token punctuation">;</span>
		#<span class="token punctuation">}</span>
                proxy_pass http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>webservers<span class="token punctuation">;</span>
                proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header<span class="token punctuation">;</span>
                # 启用keep alive
                proxy_http_version <span class="token number">1.1</span><span class="token punctuation">;</span>
                proxy_set_header <span class="token class-name">Connection</span> <span class="token string">""</span><span class="token punctuation">;</span>
                # 获取 xforward和真实<span class="token constant">IP</span>
                proxy_set_header  <span class="token class-name">X</span><span class="token operator">-</span><span class="token class-name">Forwarded</span><span class="token operator">-</span><span class="token class-name">For</span>  $proxy_add_x_forwarded_for<span class="token punctuation">;</span>
                proxy_set_header  <span class="token class-name">X</span><span class="token operator">-</span><span class="token class-name">Real</span><span class="token operator">-</span><span class="token constant">IP</span>  $remote_addr<span class="token punctuation">;</span>
                proxy_set_header  <span class="token class-name">Host</span> $host<span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
        server <span class="token punctuation">{</span>
                listen <span class="token number">80</span><span class="token punctuation">;</span>
                server_name www<span class="token punctuation">.</span>tianqi<span class="token punctuation">.</span>icu<span class="token punctuation">;</span>
                proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header<span class="token punctuation">;</span>
                # 启用keep alive
                proxy_http_version <span class="token number">1.1</span><span class="token punctuation">;</span>
                proxy_set_header <span class="token class-name">Connection</span> <span class="token string">""</span><span class="token punctuation">;</span>
                # 获取 xforward和真实<span class="token constant">IP</span>
                proxy_set_header  <span class="token class-name">X</span><span class="token operator">-</span><span class="token class-name">Forwarded</span><span class="token operator">-</span><span class="token class-name">For</span>  $proxy_add_x_forwarded_for<span class="token punctuation">;</span>
                proxy_set_header  <span class="token class-name">X</span><span class="token operator">-</span><span class="token class-name">Real</span><span class="token operator">-</span><span class="token constant">IP</span>  $remote_addr<span class="token punctuation">;</span>
                proxy_set_header  <span class="token class-name">Host</span> $host<span class="token punctuation">;</span>
                #把http的域名请求转成https
                #<span class="token keyword">return</span> <span class="token number">301</span> https<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>zhengtianqi<span class="token punctuation">.</span>asia$request_uri<span class="token punctuation">;</span> 
		<span class="token keyword">return</span> <span class="token number">301</span> https<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>www<span class="token punctuation">.</span>tianqi<span class="token punctuation">.</span>icu$request_uri<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        #include <span class="token operator">/</span>www<span class="token operator">/</span>server<span class="token operator">/</span>panel<span class="token operator">/</span>vhost<span class="token operator">/</span>nginx<span class="token comment">/*.conf;
}
</span></code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


