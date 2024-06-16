<template><div><h1 id="一、mysql集群介绍" tabindex="-1"><a class="header-anchor" href="#一、mysql集群介绍" aria-hidden="true">#</a> 一、mysql集群介绍</h1>
<p><a href="https://juejin.cn/post/6985187754493607966" target="_blank" rel="noopener noreferrer">MySql集群简介-告诉你为什么要用集群部署 - 掘金 (juejin.cn)<ExternalLinkIcon/></a></p>
<p><a href="https://zhuanlan.zhihu.com/p/102798762" target="_blank" rel="noopener noreferrer">MySQL高可用集群方案 - 知乎 (zhihu.com)<ExternalLinkIcon/></a></p>
<p><a href="https://juejin.cn/post/7027910561459503141" target="_blank" rel="noopener noreferrer">MYSQL集群简介及对比 - 掘金 (juejin.cn)<ExternalLinkIcon/></a></p>
<p><a href="https://www.yisu.com/zixun/527196.html" target="_blank" rel="noopener noreferrer">MySQL八大集群架构的优点和缺点总结<ExternalLinkIcon/></a></p>
<h1 id="二、mysql安装-一主一从" tabindex="-1"><a class="header-anchor" href="#二、mysql安装-一主一从" aria-hidden="true">#</a> 二、MySQL安装（一主一从）</h1>
<p>一台作为主服务器，一台作为从服务器，主服务器进行写操作，从服务器进行读操作。</p>
<p>所有机器</p>
<h2 id="step1、删除自带mariadb" tabindex="-1"><a class="header-anchor" href="#step1、删除自带mariadb" aria-hidden="true">#</a> step1、删除自带mariadb</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>rpm <span class="token operator">-</span>qa <span class="token operator">|</span> grep mariadb
rpm <span class="token operator">-</span>e <span class="token operator">--</span>nodeps mariadb<span class="token operator">-</span>libs<span class="token operator">-</span><span class="token number">5.5</span><span class="token number">.60</span><span class="token operator">-</span><span class="token number">1.</span>el7_5<span class="token punctuation">.</span>x86_64
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="step2、安装mysql" tabindex="-1"><a class="header-anchor" href="#step2、安装mysql" aria-hidden="true">#</a> step2、安装mysql</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>cd <span class="token operator">/</span>data<span class="token operator">/</span>environment
tar <span class="token operator">-</span>xvf mysql<span class="token operator">-</span><span class="token number">5.7</span><span class="token number">.37</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64<span class="token punctuation">.</span>rpm<span class="token operator">-</span>bundle<span class="token punctuation">.</span>tar
rpm <span class="token operator">-</span>ivh mysql<span class="token operator">-</span>community<span class="token operator">-</span>common<span class="token operator">-</span><span class="token number">5.7</span><span class="token number">.37</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64<span class="token punctuation">.</span>rpm
rpm <span class="token operator">-</span>ivh mysql<span class="token operator">-</span>community<span class="token operator">-</span>libs<span class="token operator">-</span><span class="token number">5.7</span><span class="token number">.37</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64<span class="token punctuation">.</span>rpm
rpm <span class="token operator">-</span>ivh mysql<span class="token operator">-</span>community<span class="token operator">-</span>client<span class="token operator">-</span><span class="token number">5.7</span><span class="token number">.37</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64<span class="token punctuation">.</span>rpm
rpm <span class="token operator">-</span>ivh mysql<span class="token operator">-</span>community<span class="token operator">-</span>server<span class="token operator">-</span><span class="token number">5.7</span><span class="token number">.37</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64<span class="token punctuation">.</span>rpm
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="step3、启动并创建用户" tabindex="-1"><a class="header-anchor" href="#step3、启动并创建用户" aria-hidden="true">#</a> step3、启动并创建用户</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start mysqld
systemctl enable mysqld

cat <span class="token operator">/</span><span class="token keyword">var</span><span class="token operator">/</span>log<span class="token operator">/</span>mysqld<span class="token punctuation">.</span>log <span class="token operator">|</span> grep password
mysql <span class="token operator">-</span>u root <span class="token operator">-</span>p
use mysql<span class="token punctuation">;</span>
alter user <span class="token char">'root'</span>@'localhost' identified by 'zheng<span class="token operator">&amp;</span>test123'<span class="token punctuation">;</span>
select host from user where user<span class="token operator">=</span><span class="token char">'root'</span><span class="token punctuation">;</span>
update user set host <span class="token operator">=</span> <span class="token char">'%'</span> where user <span class="token operator">=</span><span class="token char">'root'</span><span class="token punctuation">;</span>
flush privileges<span class="token punctuation">;</span>
exit<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="step4、my-cnf配置" tabindex="-1"><a class="header-anchor" href="#step4、my-cnf配置" aria-hidden="true">#</a> step4、my.cnf配置</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>my<span class="token punctuation">.</span>cnf
主配置
server<span class="token operator">-</span>id<span class="token operator">=</span><span class="token number">1</span>
log<span class="token operator">-</span>bin<span class="token operator">=</span>mysql<span class="token operator">-</span>bin
log<span class="token operator">-</span>slave<span class="token operator">-</span>updates<span class="token operator">=</span><span class="token number">1</span>
binlog<span class="token operator">-</span><span class="token keyword">do</span><span class="token operator">-</span>db<span class="token operator">=</span>repl  #需要同步的数据库<span class="token punctuation">,</span>如果没有本行表示同步所有的数据库
binlog<span class="token operator">-</span>ignore<span class="token operator">-</span>db<span class="token operator">=</span>mysql  #被忽略的数据

从配置
server<span class="token operator">-</span>id<span class="token operator">=</span><span class="token number">2</span>
log<span class="token operator">-</span>bin<span class="token operator">=</span> mysql<span class="token operator">-</span>bin
relay<span class="token operator">-</span>log<span class="token operator">=</span> mysql<span class="token operator">-</span>relay<span class="token operator">-</span>bin
read<span class="token operator">-</span>only<span class="token operator">=</span><span class="token number">1</span> #设置为只读
log<span class="token operator">-</span>slave<span class="token operator">-</span>updates<span class="token operator">=</span><span class="token number">1</span> #实现级联复制需要，即把relay<span class="token operator">-</span>log中的同步到bin<span class="token operator">-</span>log中
replicate<span class="token operator">-</span><span class="token keyword">do</span><span class="token operator">-</span>db<span class="token operator">=</span>repl #要同步的数据库<span class="token punctuation">,</span>不写本行表示同步所有数据库
    
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="step5、slave启动" tabindex="-1"><a class="header-anchor" href="#step5、slave启动" aria-hidden="true">#</a> step5、slave启动</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mysql <span class="token operator">-</span>u root <span class="token operator">-</span>p

<span class="token constant">CHANGE</span> <span class="token constant">MASTER</span> <span class="token class-name">TO</span>
<span class="token constant">MASTER_HOST</span><span class="token operator">=</span>'<span class="token number">192.168</span><span class="token number">.2</span><span class="token number">.145</span>'<span class="token punctuation">,</span>
<span class="token constant">MASTER_USER</span><span class="token operator">=</span><span class="token char">'master'</span><span class="token punctuation">,</span>
<span class="token constant">MASTER_PASSWORD</span><span class="token operator">=</span>'zheng<span class="token operator">&amp;</span>test123'<span class="token punctuation">,</span>
<span class="token constant">MASTER_PORT</span><span class="token operator">=</span><span class="token number">3306</span><span class="token punctuation">,</span>
<span class="token constant">MASTER_LOG_FILE</span><span class="token operator">=</span>'mysql<span class="token operator">-</span>bin<span class="token punctuation">.</span><span class="token number">000001</span>'<span class="token punctuation">,</span>
<span class="token constant">MASTER_LOG_POS</span><span class="token operator">=</span><span class="token number">120</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>step6、启动是否成功</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mysql <span class="token operator">-</span>u root <span class="token operator">-</span>p

show slave status \<span class="token class-name">G</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


