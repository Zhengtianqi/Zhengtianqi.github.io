<template><div><p>本文介绍了redis安装</p>
<h1 id="一、下载" tabindex="-1"><a class="header-anchor" href="#一、下载" aria-hidden="true">#</a> 一、下载</h1>
<p>官网下载需要安装版本redis，下载地址<br>
<a href="https://redis.io/download" target="_blank" rel="noopener noreferrer">https://redis.io/download<ExternalLinkIcon/></a><br>
<a href="http://download.redis.io/releases/" target="_blank" rel="noopener noreferrer">http://download.redis.io/releases/<ExternalLinkIcon/></a>  (所有版本)</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>解压
tar <span class="token operator">-</span>zxvf redis<span class="token operator">-</span><span class="token number">7.0</span><span class="token number">.5</span><span class="token punctuation">.</span>tar<span class="token punctuation">.</span>gz
cd redis<span class="token operator">-</span><span class="token number">7.0</span><span class="token number">.5</span><span class="token operator">/</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="二、编译源码" tabindex="-1"><a class="header-anchor" href="#二、编译源码" aria-hidden="true">#</a> 二、编译源码</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>make
make <span class="token constant">PREFIX</span><span class="token operator">=</span><span class="token operator">/</span>redis install
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="三、复制配置文件" tabindex="-1"><a class="header-anchor" href="#三、复制配置文件" aria-hidden="true">#</a> 三、复制配置文件</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>cp <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>redis<span class="token operator">/</span>redis<span class="token operator">-</span><span class="token number">7.0</span><span class="token number">.5</span><span class="token operator">/</span>redis<span class="token punctuation">.</span>conf <span class="token operator">/</span>redis<span class="token operator">/</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h1 id="四、创建日志文件" tabindex="-1"><a class="header-anchor" href="#四、创建日志文件" aria-hidden="true">#</a> 四、创建日志文件</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mkdir <span class="token operator">/</span>redis<span class="token operator">/</span>logs
touch <span class="token operator">/</span>redis<span class="token operator">/</span>logs<span class="token operator">/</span>redis<span class="token punctuation">.</span>log
chmod <span class="token number">666</span> <span class="token operator">/</span>redis<span class="token operator">/</span>logs<span class="token operator">/</span>redis<span class="token punctuation">.</span>log
mkdir <span class="token operator">/</span>redis<span class="token operator">/</span>aof<span class="token operator">/</span>
chmod <span class="token number">777</span> <span class="token operator">/</span>redis<span class="token operator">/</span>aof<span class="token operator">/</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="五、修改配置文件" tabindex="-1"><a class="header-anchor" href="#五、修改配置文件" aria-hidden="true">#</a> 五、修改配置文件</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>redis<span class="token operator">/</span>redis<span class="token punctuation">.</span>conf
# 找到bind配置，添加注释（<span class="token number">69</span>行）
#bind <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span>
# 找到daemonize，将配置修改为yes（<span class="token number">136</span>行）
daemonize yes
# 取消保护模式（<span class="token number">88</span>行）
<span class="token keyword">protected</span><span class="token operator">-</span>mode no
# 增加密码
requirepass <span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span>
# 配置文件路径（<span class="token number">171</span>行）
logfile <span class="token string">"/redis/logs/redis.log"</span>
# 配置文件路径（<span class="token number">263</span>行）
dir <span class="token operator">/</span>redis<span class="token operator">/</span>aof<span class="token operator">/</span>
注册系统服务
重载系统服务
添加自启
防火墙配置
将防火墙服务停止并禁止开机自启。
在redis<span class="token operator">-</span>backup服务器上重复以上步骤，安装<span class="token class-name">Redis</span>。
# 配置文件路径（<span class="token number">699</span>行）
appendonly no
# 配置文件路径，取消注释（<span class="token number">216</span>行）
save <span class="token string">""</span>
# 配置文件路径，添加注释（<span class="token number">218</span><span class="token operator">-</span><span class="token number">220</span>行）
# save <span class="token number">900</span> <span class="token number">1</span>
# save <span class="token number">300</span> <span class="token number">10</span>
# save <span class="token number">60</span> <span class="token number">10000</span>
# 配置文件路径（<span class="token number">806</span>行）
aof<span class="token operator">-</span>use<span class="token operator">-</span>rdb<span class="token operator">-</span>preamble no
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="六、注册系统服务" tabindex="-1"><a class="header-anchor" href="#六、注册系统服务" aria-hidden="true">#</a> 六、注册系统服务</h1>
<h2 id="修改启动文件" tabindex="-1"><a class="header-anchor" href="#修改启动文件" aria-hidden="true">#</a> 修改启动文件</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>lib<span class="token operator">/</span>systemd<span class="token operator">/</span>system<span class="token operator">/</span>redis<span class="token punctuation">.</span>service
# 添加以下内容，保存退出
<span class="token punctuation">[</span><span class="token class-name">Unit</span><span class="token punctuation">]</span>
<span class="token class-name">Description</span><span class="token operator">=</span><span class="token class-name">Redis</span>
<span class="token class-name">After</span><span class="token operator">=</span>syslog<span class="token punctuation">.</span>target network<span class="token punctuation">.</span>target remote<span class="token operator">-</span>fs<span class="token punctuation">.</span>target nss<span class="token operator">-</span>lookup<span class="token punctuation">.</span>target
<span class="token punctuation">[</span><span class="token class-name">Service</span><span class="token punctuation">]</span>
<span class="token class-name">Type</span><span class="token operator">=</span>forking
<span class="token class-name">PIDFile</span><span class="token operator">=</span><span class="token operator">/</span><span class="token keyword">var</span><span class="token operator">/</span>run<span class="token operator">/</span>redis_6379<span class="token punctuation">.</span>pid
<span class="token class-name">ExecStart</span><span class="token operator">=</span><span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>redis<span class="token operator">-</span>server <span class="token operator">/</span>redis<span class="token operator">/</span>redis<span class="token punctuation">.</span>conf
<span class="token class-name">ExecReload</span><span class="token operator">=</span><span class="token operator">/</span>bin<span class="token operator">/</span>kill <span class="token operator">-</span>s <span class="token constant">HUP</span> $<span class="token constant">MAINPID</span>
<span class="token class-name">ExecStop</span><span class="token operator">=</span><span class="token operator">/</span>bin<span class="token operator">/</span>kill <span class="token operator">-</span>s <span class="token constant">QUIT</span> $<span class="token constant">MAINPID</span>
<span class="token class-name">PrivateTmp</span><span class="token operator">=</span><span class="token boolean">true</span>
<span class="token punctuation">[</span><span class="token class-name">Install</span><span class="token punctuation">]</span>
<span class="token class-name">WantedBy</span><span class="token operator">=</span>multi<span class="token operator">-</span>user<span class="token punctuation">.</span>target
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="重载系统服务" tabindex="-1"><a class="header-anchor" href="#重载系统服务" aria-hidden="true">#</a> 重载系统服务</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl daemon<span class="token operator">-</span>reload
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="添加自启" tabindex="-1"><a class="header-anchor" href="#添加自启" aria-hidden="true">#</a> 添加自启</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start redis
systemctl status redis
systemctl enable redis
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在redis-backup服务器上重复以上步骤，安装Redis。</p>
<h1 id="七、高可用配置-主从" tabindex="-1"><a class="header-anchor" href="#七、高可用配置-主从" aria-hidden="true">#</a> 七、高可用配置（主从）</h1>
<p>编辑redis-backup服务器上redis配置文件。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>redis<span class="token operator">/</span>redis<span class="token punctuation">.</span>conf
# 编辑从库的redis<span class="token punctuation">.</span>conf配置文件，搜索replicaof（<span class="token number">286</span>行），去掉注释，修改为：
replicaof 主库<span class="token constant">IP</span> <span class="token number">6379</span>
# 从库重启redis
systemctl restart redis
# 主库使用客户端：redis<span class="token operator">-</span>cli，添加键值
cd <span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>
<span class="token punctuation">.</span>/redis<span class="token operator">-</span>cli
<span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">6379</span><span class="token operator">></span> <span class="token constant">SET</span> runoobkey redis
# 从库使用客户端：redis<span class="token operator">-</span>cli，查看是否同步了主库的数据
cd <span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>
<span class="token punctuation">.</span>/redis<span class="token operator">-</span>cli
<span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">6379</span><span class="token operator">></span> keys <span class="token operator">*</span>
<span class="token number">1</span><span class="token punctuation">)</span> <span class="token string">"runoobkey"</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="八、高可用配置-keepalived" tabindex="-1"><a class="header-anchor" href="#八、高可用配置-keepalived" aria-hidden="true">#</a> 八、高可用配置（keepalived）</h1>
<h2 id="在redis-master服务器上修改keepalived配置文件。" tabindex="-1"><a class="header-anchor" href="#在redis-master服务器上修改keepalived配置文件。" aria-hidden="true">#</a> 在redis-master服务器上修改keepalived配置文件。</h2>
<p>注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
在redis<span class="token operator">-</span>master服务器上创建检测脚本。
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script chk_redis <span class="token punctuation">{</span>
  script <span class="token string">"/etc/keepalived/script/chk_redis.sh"</span>
  interval <span class="token number">3</span>
<span class="token punctuation">}</span>
vrrp_instance redis <span class="token punctuation">{</span>
  state <span class="token constant">BACKUP</span>
  nopreempt
  <span class="token keyword">interface</span> ens33
  virtual_router_id <span class="token number">66</span>
  priority <span class="token number">100</span>
  advert_int <span class="token number">1</span>
  authentication <span class="token punctuation">{</span>
    auth_type <span class="token constant">PASS</span>
    auth_pass redis
  <span class="token punctuation">}</span>
  track_script <span class="token punctuation">{</span>
    chk_redis
  <span class="token punctuation">}</span>
  virtual_ipaddress <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.96</span>
  <span class="token punctuation">}</span>
  unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.189</span>
  unicast_peer <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.190</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在redis-master服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在redis-master服务器上创建检测脚本。" aria-hidden="true">#</a> 在redis-master服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mkdir <span class="token operator">-</span>p <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script
vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>chk_redis<span class="token punctuation">.</span>sh
# 添加以下内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token class-name">A</span><span class="token operator">=</span>`<span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>redis<span class="token operator">-</span>cli <span class="token operator">-</span>h <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span> <span class="token operator">-</span>p <span class="token number">6379</span> <span class="token constant">PING</span>`
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$A"</span>x <span class="token operator">!=</span> <span class="token string">"PONG"</span>x <span class="token punctuation">]</span>
then
  <span class="token operator">/</span>bin<span class="token operator">/</span>systemctl restart redis
  sleep <span class="token number">2</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"`/redis/bin/redis-cli -h 127.0.0.1 -p 6379 PING`"</span>x <span class="token operator">!=</span> <span class="token string">"PONG"</span>x <span class="token punctuation">]</span>
    then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
  fi
fi
port<span class="token operator">=</span>`netstat <span class="token operator">-</span>anp<span class="token operator">|</span>grep <span class="token number">2049</span>`
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$port"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #echo <span class="token number">1</span>
  <span class="token operator">/</span>bin<span class="token operator">/</span>systemctl start nfs
  sleep <span class="token number">5</span>
  port<span class="token operator">=</span>`netstat <span class="token operator">-</span>anp<span class="token operator">|</span>grep <span class="token number">2049</span>`
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$port"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
    #echo <span class="token number">2</span>
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>chk_redis<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在redis-master服务器上验证虚拟ip是否绑定。" tabindex="-1"><a class="header-anchor" href="#在redis-master服务器上验证虚拟ip是否绑定。" aria-hidden="true">#</a> 在redis-master服务器上验证虚拟IP是否绑定。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="验证keepalived服务是否可用。" tabindex="-1"><a class="header-anchor" href="#验证keepalived服务是否可用。" aria-hidden="true">#</a> 验证keepalived服务是否可用。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 停止redis服务，查看keepalived是否会自动拉起服务
systemctl stop redis
systemctl status redis
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在redis-backup服务器上修改keepalived配置文件。" tabindex="-1"><a class="header-anchor" href="#在redis-backup服务器上修改keepalived配置文件。" aria-hidden="true">#</a> 在redis-backup服务器上修改keepalived配置文件。</h2>
<p>注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script chk_redis <span class="token punctuation">{</span>
  script <span class="token string">"/etc/keepalived/script/chk_redis.sh"</span>
  interval <span class="token number">3</span>
<span class="token punctuation">}</span>
vrrp_instance redis <span class="token punctuation">{</span>
  state <span class="token constant">BACKUP</span>
  nopreempt
  <span class="token keyword">interface</span> ens33
  virtual_router_id <span class="token number">66</span>
  priority <span class="token number">100</span>
  advert_int <span class="token number">1</span>
  authentication <span class="token punctuation">{</span>
  auth_type <span class="token constant">PASS</span>
    auth_pass redis
  <span class="token punctuation">}</span>
  track_script <span class="token punctuation">{</span>
    chk_redis
  <span class="token punctuation">}</span>
  virtual_ipaddress <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.96</span>
  <span class="token punctuation">}</span>
  unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.190</span>
  unicast_peer <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.189</span>
  <span class="token punctuation">}</span>
  notify_master <span class="token string">"/etc/keepalived/script/become_master.sh"</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在redis-backup服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在redis-backup服务器上创建检测脚本。" aria-hidden="true">#</a> 在redis-backup服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mkdir <span class="token operator">-</span>p <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script
vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>chk_redis<span class="token punctuation">.</span>sh
# 添加以下内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token class-name">A</span><span class="token operator">=</span>`<span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>redis<span class="token operator">-</span>cli <span class="token operator">-</span>h <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span> <span class="token operator">-</span>p <span class="token number">6379</span> <span class="token constant">PING</span>`
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$A"</span>x <span class="token operator">!=</span> <span class="token string">"PONG"</span>x <span class="token punctuation">]</span>
then
  <span class="token operator">/</span>bin<span class="token operator">/</span>systemctl restart redis
  sleep <span class="token number">2</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"`/redis/bin/redis-cli -h 127.0.0.1 -p 6379 PING`"</span>x <span class="token operator">!=</span> <span class="token string">"PONG"</span>x <span class="token punctuation">]</span>
  then
  <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。-1" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。-1" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>chk_redis<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在redis-backup服务器上创建处理脚本。" tabindex="-1"><a class="header-anchor" href="#在redis-backup服务器上创建处理脚本。" aria-hidden="true">#</a> 在redis-backup服务器上创建处理脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>become_master<span class="token punctuation">.</span>sh
# 添加以下配置内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token operator">/</span>redis<span class="token operator">/</span>bin<span class="token operator">/</span>redis<span class="token operator">-</span>cli <span class="token operator">-</span>h <span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span> <span class="token operator">-</span>p <span class="token number">6379</span> slaveof no one
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为处理脚本添加可执行权限。" tabindex="-1"><a class="header-anchor" href="#为处理脚本添加可执行权限。" aria-hidden="true">#</a> 为处理脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>script<span class="token operator">/</span>become_master<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在redis-backup服务器上-验证redis从库是否可以升级为主库。" tabindex="-1"><a class="header-anchor" href="#在redis-backup服务器上-验证redis从库是否可以升级为主库。" aria-hidden="true">#</a> 在redis-backup服务器上，验证redis从库是否可以升级为主库。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 在redis<span class="token operator">-</span>master服务器上，停止keepalived服务，查看虚拟<span class="token constant">IP</span>是否漂移，redis从库是否升级为主库
systemctl stop keepalived
# 在redis<span class="token operator">-</span>backup服务器上，查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
# 在redis<span class="token operator">-</span>backup服务器上，验证redis从库是否升级为主库
cd <span class="token operator">/</span>redis<span class="token operator">/</span>bin
<span class="token punctuation">.</span>/redis<span class="token operator">-</span>cli
<span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">:</span><span class="token number">6379</span><span class="token operator">></span> set cfit test
<span class="token constant">OK</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="恢复使用主库redis" tabindex="-1"><a class="header-anchor" href="#恢复使用主库redis" aria-hidden="true">#</a> 恢复使用主库Redis</h2>
<p>当redis-master服务器出现故障，虚拟IP自动漂移到redis-backup服务器上时，此时禅道相关的session<br>
信息会存储到redis-backup服务器上的redis中，上传的非结构数据也会存储到redis-backup服务器上<br>
的nfs共享目录中。<br>
因为上述步骤测试redis-backup服务器上的redis是否会升级为主库，虚拟IP已转移，所以此步骤可恢复<br>
虚拟IP绑定在redis-master服务器上。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 在redis<span class="token operator">-</span>backup服务器上，停止运行keepalived和redis服务
systemctl stop keepalived
systemctl stop redis
# 在redis<span class="token operator">-</span>master服务器上，挂载从库nfs共享目录，复制所有文件到redis<span class="token operator">-</span>master服务器的共享目录
中
mkdir <span class="token operator">/</span>cfit_pms_data_tmp
mount <span class="token operator">-</span>t nfs <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.190</span><span class="token operator">:</span><span class="token operator">/</span>redis<span class="token operator">/</span>cfit_pms_data <span class="token operator">/</span>cfit_pms_data_tmp
sudo cp <span class="token operator">-</span>rf <span class="token operator">/</span>cfit_pms_data_tmp<span class="token comment">/* /redis/cfit_pms_data/
# 在redis-master服务器上，卸载挂载目录
umount /cfit_pms_data_tmp
# 在redis-master服务器上，启动keepalived服务
systemctl start keepalived
# 在redis-master服务器上，查看虚拟IP是否已绑定
ip a
# 在redis-backup服务器上，启动keepalived服务
systemctl start keepalived
</span></code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


