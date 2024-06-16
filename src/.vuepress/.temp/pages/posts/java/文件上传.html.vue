<template><div><h2 id="_1、content-type介绍" tabindex="-1"><a class="header-anchor" href="#_1、content-type介绍" aria-hidden="true">#</a> 1、Content-Type介绍</h2>
<p><strong>Content-Type</strong>是指http/https发送信息至服务器时的内容编码类型，contentType用于表明发送数据流的类型，服务器根据编码类型使用特定的解析方式，获取数据流中的数据。</p>
<p>在网络请求中，常见的Content-Type有：</p>
<h3 id="_1-1、常见的页面资源类型" tabindex="-1"><a class="header-anchor" href="#_1-1、常见的页面资源类型" aria-hidden="true">#</a> 1.1、常见的页面资源类型</h3>
<p>​	text/html，text/plain，text/css，text/javascript，image/jpeg，image/png，image/gif等；</p>
<p>​	常见的页面提交或上传文件类型</p>
<p>​	application/x-www-form-urlencoded，multipart/form-data，application/json，application/xml等。</p>
<h3 id="_1-2、form表单可以定义enctype属性-该属性是发送到服务器之前应该如何对表单数据进行编码" tabindex="-1"><a class="header-anchor" href="#_1-2、form表单可以定义enctype属性-该属性是发送到服务器之前应该如何对表单数据进行编码" aria-hidden="true">#</a> 1.2、form表单可以定义enctype属性，该属性是发送到服务器之前应该如何对表单数据进行编码</h3>
<p>（1）默认为application/x-www-form-urlencoded编码（包含POST和GET）</p>
<p>​			其中：数据会变成key1=value1&amp;key2=value2的形式；</p>
<p>​						有特殊字符需要utf-8；</p>
<p>​						请求类型为GET时，格式化后的字符串直接拼接到url的后面；</p>
<p>​						请求类型为POST时，格式化后的字符串会放在http body的Form Data中发送。</p>
<p>（2）multipart/form-data</p>
<p>​			其中：使用表单上传文件时必须指定enctype属性值为multipart/form-data；</p>
<p>​						请求体被分割成多部分，每部分使用 --boundary分割（分成小部分？查其他资料）</p>
<p>此处为form方式文件上传后端接收demo：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@PostMapping</span><span class="token punctuation">(</span>value<span class="token operator">=</span><span class="token string">"/publish"</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">formUpload</span><span class="token punctuation">(</span><span class="token annotation punctuation">@RequestParam</span><span class="token punctuation">(</span><span class="token string">"programImg"</span><span class="token punctuation">)</span> <span class="token class-name">CommonsMultipartFile</span> file<span class="token punctuation">)</span><span class="token punctuation">{</span>

		<span class="token class-name">String</span> programImgName <span class="token operator">=</span>  file<span class="token punctuation">.</span><span class="token function">getOriginalFilename</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>		
        <span class="token keyword">byte</span><span class="token punctuation">[</span><span class="token punctuation">]</span> fileData <span class="token operator">=</span>  file<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>​	（3）application/json</p>
<p>​			和form类似，json可以比formData的数据结构更加复杂</p>
<p>​			文件上传可以把文件编码成Base64，使用键值方式上传</p>
<p>此处为json方式文件上传后端接收demo：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@PostMapping</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token string">"/upload"</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">jsonUpload</span><span class="token punctuation">(</span><span class="token annotation punctuation">@RequestBody</span> <span class="token class-name">HashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">></span></span> requestMap<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    
        <span class="token class-name">String</span> fileData <span class="token operator">=</span> requestMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">"fileData"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">String</span> fileName <span class="token operator">=</span> requestMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">"fileName"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 此处前端上传的Base64后端无法直接解开，因为它的串包含一个头，需要把头去掉。</span>
		fileData <span class="token operator">=</span> <span class="token class-name">StringUtils</span><span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span>fileData<span class="token punctuation">,</span> <span class="token string">","</span><span class="token punctuation">)</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
        <span class="token keyword">byte</span><span class="token punctuation">[</span><span class="token punctuation">]</span> buffer <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BASE64Decoder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">decodeBuffer</span><span class="token punctuation">(</span>fileData<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>​</p>
</div></template>


