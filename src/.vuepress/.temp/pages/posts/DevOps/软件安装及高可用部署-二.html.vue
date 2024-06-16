<template><div><p>本文介绍了Nginx安装</p>
<h1 id="一、修改主机名" tabindex="-1"><a class="header-anchor" href="#一、修改主机名" aria-hidden="true">#</a> 一、修改主机名</h1>
<p>以 nginx-master 为例，修改所有服务器的对应的主机名。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>hostname
# 删除所有的内容，修改为要修改的主机名
nginx01
vim <span class="token operator">/</span>etc<span class="token operator">/</span>hosts
#在第一行最后追加主机名，有<span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span>内容的这行
<span class="token number">127.0</span><span class="token number">.0</span><span class="token number">.1</span> localhost localhost<span class="token punctuation">.</span>localdomain localhost4 localhost4<span class="token punctuation">.</span>localdomain4
nginx01
# 重启服务器
reboot
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="二、安装nginx" tabindex="-1"><a class="header-anchor" href="#二、安装nginx" aria-hidden="true">#</a> 二、安装Nginx</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>tar <span class="token operator">-</span>zxvf nginx<span class="token operator">-</span><span class="token number">1.19</span><span class="token number">.10</span><span class="token punctuation">.</span>tar<span class="token punctuation">.</span>gz
# 在软件包源码目录
cd <span class="token operator">/</span>software<span class="token operator">/</span>nginx<span class="token operator">/</span>nginx<span class="token operator">-</span><span class="token number">1.19</span><span class="token number">.10</span>
<span class="token punctuation">.</span>/configure <span class="token operator">--</span>prefix<span class="token operator">=</span><span class="token operator">/</span>nginx <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_gunzip_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_ssl_module
# 执行编译
make <span class="token operator">&amp;&amp;</span> make install
# 指定配置文件启动
<span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>c <span class="token operator">/</span>nginx<span class="token operator">/</span>conf<span class="token operator">/</span>nginx<span class="token punctuation">.</span>conf
# 查看进程是否启动
ps <span class="token operator">-</span>ef <span class="token operator">|</span> grep nginx
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="三、修改环境变量" tabindex="-1"><a class="header-anchor" href="#三、修改环境变量" aria-hidden="true">#</a> 三、修改环境变量</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>root<span class="token operator">/</span><span class="token punctuation">.</span>bash_profile
# 找到 <span class="token constant">PATH</span><span class="token operator">=</span>$<span class="token constant">PATH</span><span class="token operator">:</span>$<span class="token constant">HOME</span><span class="token operator">/</span>bin
# 后面添加括号中的内容<span class="token punctuation">(</span><span class="token operator">:</span><span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token punctuation">)</span>
# 刷新环境变量
source <span class="token operator">/</span>root<span class="token operator">/</span><span class="token punctuation">.</span>bash_profile
# <span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
vim <span class="token operator">/</span>root<span class="token operator">/</span><span class="token punctuation">.</span>bashrc
# 在最后加入
<span class="token constant">PATH</span><span class="token operator">=</span>$<span class="token constant">PATH</span><span class="token operator">:</span>$<span class="token constant">HOME</span><span class="token operator">/</span>bin<span class="token operator">:</span><span class="token operator">/</span>nginx<span class="token operator">/</span>sbin
export <span class="token constant">PATH</span>
# 刷新环境变量
source <span class="token operator">/</span>root<span class="token operator">/</span><span class="token punctuation">.</span>bashrc
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="四、验证可用" tabindex="-1"><a class="header-anchor" href="#四、验证可用" aria-hidden="true">#</a> 四、验证可用</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 在任意位置输入，先停止<span class="token class-name">Nginx</span>
nginx <span class="token operator">-</span>s stop
# 启动nginx
nginx
# 浏览器访问服务器外网<span class="token constant">IP</span>地址，查看<span class="token class-name">Nginx</span>欢迎页
http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>外网<span class="token constant">IP</span>地址
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="五、在nginx-backup服务器上重复以上步骤-安装nginx。" tabindex="-1"><a class="header-anchor" href="#五、在nginx-backup服务器上重复以上步骤-安装nginx。" aria-hidden="true">#</a> 五、在nginx-backup服务器上重复以上步骤，安装Nginx。</h1>
<h1 id="六、nginx高可用配置" tabindex="-1"><a class="header-anchor" href="#六、nginx高可用配置" aria-hidden="true">#</a> 六、Nginx高可用配置</h1>
<h2 id="nginx-master配置" tabindex="-1"><a class="header-anchor" href="#nginx-master配置" aria-hidden="true">#</a> nginx-master配置</h2>
<p>在nginx-master服务器上修改keepalived配置文件。注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script check_nginx <span class="token punctuation">{</span>
    script <span class="token string">"/usr/local/keepalived/sbin/check_nginx.sh"</span>
    interval <span class="token number">3</span>
    weight <span class="token number">2</span>
<span class="token punctuation">}</span>
vrrp_instance nginx <span class="token punctuation">{</span>
    state <span class="token constant">MASTER</span>
    <span class="token keyword">interface</span> ens33
    virtual_router_id <span class="token number">11</span>
    priority <span class="token number">100</span>
    advert_int <span class="token number">1</span>
    authentication <span class="token punctuation">{</span>
        auth_type <span class="token constant">PASS</span>
        auth_pass <span class="token number">123456</span>
    <span class="token punctuation">}</span>
    track_script <span class="token punctuation">{</span>
        check_nginx
    <span class="token punctuation">}</span>
    virtual_ipaddress <span class="token punctuation">{</span>
        <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.93</span>
    <span class="token punctuation">}</span>
    unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.183</span>
    unicast_peer <span class="token punctuation">{</span>
        <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.184</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在nginx-master服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在nginx-master服务器上创建检测脚本。" aria-hidden="true">#</a> 在nginx-master服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_nginx<span class="token punctuation">.</span>sh
# 添加以下配置内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>nginx<span class="token operator">:</span> master process<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #echo <span class="token number">1</span>
  <span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>s reload
  <span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>c <span class="token operator">/</span>nginx<span class="token operator">/</span>conf<span class="token operator">/</span>nginx<span class="token punctuation">.</span>conf
  sleep <span class="token number">5</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>nginx<span class="token operator">:</span> master process<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
    #echo <span class="token number">2</span>
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_nginx<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在nginx-master服务器上验证虚拟ip是否绑定。" tabindex="-1"><a class="header-anchor" href="#在nginx-master服务器上验证虚拟ip是否绑定。" aria-hidden="true">#</a> 在nginx-master服务器上验证虚拟IP是否绑定。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="nginx-backup配置" tabindex="-1"><a class="header-anchor" href="#nginx-backup配置" aria-hidden="true">#</a> nginx-backup配置</h2>
<p>在nginx-backup服务器上修改keepalived配置文件。注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script check_nginx <span class="token punctuation">{</span>
  script <span class="token string">"/usr/local/keepalived/sbin/check_nginx.sh"</span>
  interval <span class="token number">3</span>
  weight <span class="token number">2</span>
<span class="token punctuation">}</span>
vrrp_instance nginx <span class="token punctuation">{</span>
  state <span class="token constant">BACKUP</span>
  nopreempt
  <span class="token keyword">interface</span> ens33
  virtual_router_id <span class="token number">11</span>
  priority <span class="token number">50</span>
  advert_int <span class="token number">1</span>
  authentication <span class="token punctuation">{</span>
    auth_type <span class="token constant">PASS</span>
    auth_pass <span class="token number">123456</span>
  <span class="token punctuation">}</span>
  track_script <span class="token punctuation">{</span>
    check_nginx
  <span class="token punctuation">}</span>
  virtual_ipaddress <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.93</span>
  <span class="token punctuation">}</span>
  unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.184</span>
  unicast_peer <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.183</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在nginx-backup服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在nginx-backup服务器上创建检测脚本。" aria-hidden="true">#</a> 在nginx-backup服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_nginx<span class="token punctuation">.</span>sh
# 添加以下配置内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>nginx<span class="token operator">:</span> master process<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #echo <span class="token number">1</span>
  <span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>s reload
  <span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>c <span class="token operator">/</span>nginx<span class="token operator">/</span>conf<span class="token operator">/</span>nginx<span class="token punctuation">.</span>conf
  sleep <span class="token number">5</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>nginx<span class="token operator">:</span> master process<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
    #echo <span class="token number">2</span>
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。-1" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。-1" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_nginx<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在nginx-backup服务器上验证虚拟ip是否绑定。" tabindex="-1"><a class="header-anchor" href="#在nginx-backup服务器上验证虚拟ip是否绑定。" aria-hidden="true">#</a> 在nginx-backup服务器上验证虚拟IP是否绑定。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 登录nginx<span class="token operator">-</span>master服务器
service keepalived stop
# 登录nginx<span class="token operator">-</span>backup服务器，查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
# 登录nginx<span class="token operator">-</span>master服务器
service keepalived start
# 登录nginx<span class="token operator">-</span>master服务器，查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


