<template><div><p>本文介绍了MYSQL安装</p>
<h1 id="一、卸载mariadb" tabindex="-1"><a class="header-anchor" href="#一、卸载mariadb" aria-hidden="true">#</a> 一、卸载mariadb</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 查看 mariadb 的安装包
rpm <span class="token operator">-</span>qa <span class="token operator">|</span> grep mariadb
# 卸载 mariadb 的安装包
rpm <span class="token operator">-</span>e mariadb<span class="token operator">-</span>libs<span class="token operator">-</span><span class="token number">5.5</span><span class="token number">.68</span><span class="token operator">-</span><span class="token number">1.</span>el7<span class="token punctuation">.</span>x86_64 <span class="token operator">--</span>nodeps
# 再次查看
rpm <span class="token operator">-</span>qa <span class="token operator">|</span> grep mariadb
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="二、添加mysql组和用户" tabindex="-1"><a class="header-anchor" href="#二、添加mysql组和用户" aria-hidden="true">#</a> 二、添加mysql组和用户</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>groupadd mysql
useradd <span class="token operator">-</span>r <span class="token operator">-</span>g mysql mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="三、安装mysql" tabindex="-1"><a class="header-anchor" href="#三、安装mysql" aria-hidden="true">#</a> 三、安装mysql</h1>
<h2 id="安装源" tabindex="-1"><a class="header-anchor" href="#安装源" aria-hidden="true">#</a> 安装源</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>更新yum
yum update –y
安装wget工具
创建安装目录
mkdir <span class="token operator">-</span>p <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>mysql
然后进入安装目录
cd <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>mysql
再执行
sudo yum install <span class="token operator">-</span>y wget
使用wget下载mysql yum源
wget https<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>dev<span class="token punctuation">.</span>mysql<span class="token punctuation">.</span>com<span class="token operator">/</span>get<span class="token operator">/</span>mysql80<span class="token operator">-</span>community<span class="token operator">-</span>release<span class="token operator">-</span>el7<span class="token operator">-</span><span class="token number">3.</span>noarch<span class="token punctuation">.</span>rpm
添加 mysql yum 源
sudo yum localinstall mysql80<span class="token operator">-</span>community<span class="token operator">-</span>release<span class="token operator">-</span>el7<span class="token operator">-</span><span class="token number">3.</span>noarch<span class="token punctuation">.</span>rpm –y
安装 yum 工具 yum<span class="token operator">-</span>utils
sudo yum install <span class="token operator">-</span>y yum<span class="token operator">-</span>utils
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="mysql安装版本选择" tabindex="-1"><a class="header-anchor" href="#mysql安装版本选择" aria-hidden="true">#</a> MySQL安装版本选择</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>查看可用的 mysql
yum repolist enabled <span class="token operator">|</span> grep <span class="token string">"mysql.*-community.*"</span>
查看所有的 mysql 版本
yum repolist all <span class="token operator">|</span> grep mysql
使用执行版本的mysql
目前是<span class="token number">8.0</span>的版本，假如系统要使用<span class="token class-name">MySQL5</span><span class="token number">.7</span>，那么需要先关闭<span class="token class-name">MySQL8</span><span class="token number">.0</span>
关闭<span class="token class-name">MySQL8</span><span class="token number">.0</span>
sudo yum<span class="token operator">-</span>config<span class="token operator">-</span>manager <span class="token operator">--</span>disable mysql80<span class="token operator">-</span>community
开启<span class="token class-name">MySQL5</span><span class="token number">.7</span>
sudo yum<span class="token operator">-</span>config<span class="token operator">-</span>manager <span class="token operator">--</span>enable mysql57<span class="token operator">-</span>community
查看当前启用的<span class="token class-name">MySQL</span>版本
yum repolist enabled <span class="token operator">|</span> grep mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="mysql安装" tabindex="-1"><a class="header-anchor" href="#mysql安装" aria-hidden="true">#</a> MySQL安装</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>安装<span class="token class-name">MySQL</span>
sudo yum install <span class="token operator">-</span>y mysql<span class="token operator">-</span>community<span class="token operator">-</span>server
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="/assets/images/bushu12.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>如果上面语句执行出现上图所示报错，就执行
yum install mysql<span class="token operator">-</span>community<span class="token operator">-</span>server <span class="token operator">--</span>nogpgcheck
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="四、配置文件" tabindex="-1"><a class="header-anchor" href="#四、配置文件" aria-hidden="true">#</a> 四、配置文件</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>my<span class="token punctuation">.</span>cnf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token punctuation">[</span>client<span class="token punctuation">]</span>
port<span class="token operator">=</span><span class="token number">3306</span>
socket<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>mysql<span class="token punctuation">.</span>sock
<span class="token keyword">default</span><span class="token operator">-</span>character<span class="token operator">-</span>set<span class="token operator">=</span>utf8mb4
<span class="token punctuation">[</span>mysqld<span class="token punctuation">]</span>
user<span class="token operator">=</span>mysql
# 注意<span class="token operator">!</span> 如果是mysql<span class="token operator">-</span>backup服务器，需要将server<span class="token operator">-</span>id的值修改为<span class="token number">2</span>
server<span class="token operator">-</span>id<span class="token operator">=</span><span class="token number">1</span>
port<span class="token operator">=</span><span class="token number">3306</span>
mysqlx_port<span class="token operator">=</span><span class="token number">33060</span>
mysqlx_socket<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>mysqlx<span class="token punctuation">.</span>sock
basedir<span class="token operator">=</span><span class="token operator">/</span>mysql
datadir<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>data
配置系统服务
socket<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>mysql<span class="token punctuation">.</span>sock
pid<span class="token operator">-</span>file<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>mysqld<span class="token punctuation">.</span>pid
log<span class="token operator">-</span>error<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>logs<span class="token operator">/</span>error<span class="token punctuation">.</span>log
log<span class="token operator">-</span>bin<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>logs<span class="token operator">/</span>bin<span class="token punctuation">.</span>log
relay<span class="token operator">-</span>log<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>logs<span class="token operator">/</span>relay<span class="token punctuation">.</span>log
binlog_format<span class="token operator">=</span><span class="token class-name">ROW</span>
relay_log_recovery<span class="token operator">=</span><span class="token number">1</span>
character<span class="token operator">-</span>set<span class="token operator">-</span>client<span class="token operator">-</span>handshake<span class="token operator">=</span><span class="token constant">FALSE</span>
character<span class="token operator">-</span>set<span class="token operator">-</span>server<span class="token operator">=</span>utf8mb4
collation<span class="token operator">-</span>server<span class="token operator">=</span>utf8mb4_unicode_ci
init_connect <span class="token operator">=</span>'<span class="token constant">SET</span> <span class="token constant">NAMES</span> utf8mb4'
innodb_buffer_pool_size<span class="token operator">=</span><span class="token number">1</span>G
join_buffer_size<span class="token operator">=</span><span class="token number">128</span>M
sort_buffer_size<span class="token operator">=</span><span class="token number">2</span>M
read_rnd_buffer_size<span class="token operator">=</span><span class="token number">2</span>M
log_timestamps <span class="token operator">=</span> <span class="token class-name">SYSTEM</span>
lower_case_table_names <span class="token operator">=</span> <span class="token number">1</span>
<span class="token keyword">default</span><span class="token operator">-</span>authentication<span class="token operator">-</span>plugin<span class="token operator">=</span>mysql_native_password
#skip<span class="token operator">-</span>grant<span class="token operator">-</span>tables
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="五、配置系统服务" tabindex="-1"><a class="header-anchor" href="#五、配置系统服务" aria-hidden="true">#</a> 五、配置系统服务</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>cd <span class="token operator">/</span>mysql<span class="token operator">/</span>
# 创建data和logs目录
mkdir data
mkdir logs
# 创建mysql运行目录
mkdir <span class="token operator">-</span>p <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>
# 修改文件夹用户归属
chown <span class="token operator">-</span><span class="token class-name">R</span> mysql<span class="token operator">:</span>mysql <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>
chown <span class="token operator">-</span><span class="token class-name">R</span> mysql<span class="token operator">:</span>mysql <span class="token operator">/</span>mysql
chmod <span class="token number">777</span> <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql
chmod <span class="token number">775</span> <span class="token operator">/</span>mysql <span class="token operator">-</span><span class="token class-name">R</span>
# link
ln <span class="token operator">-</span>s <span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysql <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>bin
ln <span class="token operator">-</span>s <span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysqld <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>bin
# 初始化
mysqld <span class="token operator">--</span>initialize <span class="token operator">--</span>console
# 获取密码
cat logs<span class="token operator">/</span>error<span class="token punctuation">.</span>log <span class="token operator">|</span>grep password
# 添加mysql到服务中
cp support<span class="token operator">-</span>files<span class="token operator">/</span>mysql<span class="token punctuation">.</span>server <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>mysql
# 设置安装目录和data目录
vim <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>mysql
# 修改如下内容，大概在<span class="token number">46</span>行左右位置
basedir<span class="token operator">=</span><span class="token operator">/</span>mysql
datadir<span class="token operator">=</span><span class="token operator">/</span>mysql<span class="token operator">/</span>data
<span class="token class-name">MySQL</span>配置
在mysql<span class="token operator">-</span>backup服务器上重复以上步骤，安装<span class="token class-name">MySQL</span>。
# 目录赋权
chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql
chown <span class="token operator">-</span><span class="token class-name">R</span> mysql<span class="token operator">:</span>mysql <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>
# 加载
systemctl daemon<span class="token operator">-</span>reload
# 启动
systemctl start mysql
# 查看运行状态
systemctl status mysql
# 开机启动
systemctl enable mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="默认路径的密码-未修改配置文件" tabindex="-1"><a class="header-anchor" href="#默认路径的密码-未修改配置文件" aria-hidden="true">#</a> 默认路径的密码（未修改配置文件）</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>查看初始化密码：
sudo grep 'temporary password' <span class="token operator">/</span><span class="token keyword">var</span><span class="token operator">/</span>log<span class="token operator">/</span>mysqld<span class="token punctuation">.</span>log
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="六、配置mysql服务" tabindex="-1"><a class="header-anchor" href="#六、配置mysql服务" aria-hidden="true">#</a> 六、配置MySQL服务</h1>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 登录mysql
mysql <span class="token operator">-</span>p <span class="token operator">-</span><span class="token class-name">S</span> <span class="token operator">/</span>mysql<span class="token operator">/</span>run<span class="token operator">/</span>mysql<span class="token operator">/</span>mysql<span class="token punctuation">.</span>sock
# 修改root账户密码
<span class="token constant">ALTER</span> <span class="token constant">USER</span> <span class="token char">'root'</span>@'localhost' <span class="token constant">IDENTIFIED</span> <span class="token constant">WITH</span> mysql_native_password <span class="token constant">BY</span>
<span class="token char">'******'</span><span class="token punctuation">;</span>
# 退出使用新密码登录
exit<span class="token punctuation">;</span>
# 重新登录
mysql <span class="token operator">-</span>u root <span class="token operator">-</span>p
# 创建远程操作账户，进行远程访问的授权
create user <span class="token char">'root'</span>@<span class="token char">'%'</span> identified <span class="token keyword">with</span> <span class="token namespace">mysql_native_password</span> by <span class="token char">'******'</span><span class="token punctuation">;</span>
grant all privileges on <span class="token operator">*</span><span class="token punctuation">.</span>* <span class="token keyword">to</span> <span class="token char">'root'</span>@<span class="token char">'%'</span> <span class="token keyword">with</span> <span class="token namespace">grant</span> option<span class="token punctuation">;</span>
flush privileges<span class="token punctuation">;</span>
# 退出登录
exit<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-backup服务器上重复以上步骤，安装MySQL。</p>
<h1 id="七、mysql主从同步配置" tabindex="-1"><a class="header-anchor" href="#七、mysql主从同步配置" aria-hidden="true">#</a> 七、MySQL主从同步配置</h1>
<h2 id="登录mysql-master服务器-主库修改配置文件-vim-etc-my-cnf-。" tabindex="-1"><a class="header-anchor" href="#登录mysql-master服务器-主库修改配置文件-vim-etc-my-cnf-。" aria-hidden="true">#</a> 登录mysql-master服务器，主库修改配置文件 vim /etc/my.cnf 。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>my<span class="token punctuation">.</span>cnf
# 在<span class="token punctuation">[</span>mysqld<span class="token punctuation">]</span>下面修改或增加配置：
server<span class="token operator">-</span>id<span class="token operator">=</span><span class="token number">1</span>
log<span class="token operator">-</span>bin<span class="token operator">=</span>master<span class="token operator">-</span>bin
log<span class="token operator">-</span>bin<span class="token operator">-</span>index<span class="token operator">=</span>master<span class="token operator">-</span>bin<span class="token punctuation">.</span>index
# 保存配置后，重启主库mysql服务
systemctl restart mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-master服务器-先进入主库-进行锁表-防止数据写入。" tabindex="-1"><a class="header-anchor" href="#登录mysql-master服务器-先进入主库-进行锁表-防止数据写入。" aria-hidden="true">#</a> 登录mysql-master服务器，先进入主库，进行锁表，防止数据写入。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mysql <span class="token operator">-</span>uroot <span class="token operator">-</span>p
mysql<span class="token operator">></span> flush tables <span class="token keyword">with</span> <span class="token namespace">read</span> lock<span class="token punctuation">;</span>
mysql<span class="token operator">></span> exit<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-backup服务器-修改从库数据库配置文件。" tabindex="-1"><a class="header-anchor" href="#登录mysql-backup服务器-修改从库数据库配置文件。" aria-hidden="true">#</a> 登录mysql-backup服务器，修改从库数据库配置文件。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>my<span class="token punctuation">.</span>cnf
# 在<span class="token punctuation">[</span>mysqld<span class="token punctuation">]</span>下面修改或增加配置：
server<span class="token operator">-</span>id<span class="token operator">=</span><span class="token number">2</span>
# 保存配置后，重启从库mysql服务
systemctl restart mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-master服务器-导出数据。" tabindex="-1"><a class="header-anchor" href="#登录mysql-master服务器-导出数据。" aria-hidden="true">#</a> 登录mysql-master服务器，导出数据。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 导出数据库
cd <span class="token operator">/</span>tmp
<span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysqldump <span class="token operator">-</span>uroot <span class="token operator">-</span>p <span class="token operator">--</span>master<span class="token operator">-</span>data<span class="token operator">=</span><span class="token number">1</span> <span class="token operator">--</span>single<span class="token operator">-</span>transaction <span class="token operator">--</span>routines <span class="token operator">--</span>triggers <span class="token operator">--</span>events <span class="token operator">--</span>all<span class="token operator">-</span>databases <span class="token operator">></span> all<span class="token punctuation">.</span>sql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-backup服务器-导入数据。" tabindex="-1"><a class="header-anchor" href="#登录mysql-backup服务器-导入数据。" aria-hidden="true">#</a> 登录mysql-backup服务器，导入数据。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 将导出的数据all<span class="token punctuation">.</span>sql，上传到从库服务器
cd <span class="token operator">/</span>tmp
# 在文件上传的位置，登录数据库进行数据导入
mysql <span class="token operator">-</span>uroot <span class="token operator">-</span>p
mysql<span class="token operator">></span> source all<span class="token punctuation">.</span>sql<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-master服务器-登录数据库查看主库同步信息。" tabindex="-1"><a class="header-anchor" href="#登录mysql-master服务器-登录数据库查看主库同步信息。" aria-hidden="true">#</a> 登录mysql-master服务器，登录数据库查看主库同步信息。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mysql<span class="token operator">></span> <span class="token constant">SHOW</span> <span class="token class-name">MASTER</span> <span class="token constant">STATUS</span><span class="token punctuation">;</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token operator">|</span> <span class="token class-name">File</span> <span class="token operator">|</span> <span class="token class-name">Position</span> <span class="token operator">|</span> <span class="token class-name">Binlog_Do_DB</span> <span class="token operator">|</span> <span class="token class-name">Binlog_Ignore_DB</span> <span class="token operator">|</span>
<span class="token class-name">Executed_Gtid_Set</span> <span class="token operator">|</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token operator">|</span> master<span class="token operator">-</span>bin<span class="token punctuation">.</span><span class="token number">000005</span> <span class="token operator">|</span> <span class="token number">155</span> <span class="token operator">|</span> <span class="token operator">|</span> <span class="token operator">|</span>
<span class="token operator">|</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token number">1</span> row in set <span class="token punctuation">(</span><span class="token number">0.00</span> sec<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-backup服务器-登录数据库配置同步信息。" tabindex="-1"><a class="header-anchor" href="#登录mysql-backup服务器-登录数据库配置同步信息。" aria-hidden="true">#</a> 登录mysql-backup服务器，登录数据库配置同步信息。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>stop slave<span class="token punctuation">;</span>
change master <span class="token keyword">to</span> <span class="token namespace">master_auto_position</span><span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">;</span>
# 将<span class="token constant">MASTER_HOST</span>、<span class="token constant">MASTER_LOG_FILE</span>和<span class="token constant">MASTER_LOG_POS</span>参数替换为实际的配置
<span class="token constant">CHANGE</span> <span class="token constant">MASTER</span> <span class="token class-name">TO</span> <span class="token constant">MASTER_HOST</span><span class="token operator">=</span>'主库<span class="token constant">IP</span>地
址'<span class="token punctuation">,</span><span class="token constant">MASTER_USER</span><span class="token operator">=</span><span class="token char">'root'</span><span class="token punctuation">,</span><span class="token constant">MASTER_PASSWORD</span><span class="token operator">=</span><span class="token char">'******'</span><span class="token punctuation">,</span><span class="token constant">MASTER_LOG_FILE</span><span class="token operator">=</span>'master<span class="token operator">-</span>bin<span class="token punctuation">.</span><span class="token number">000005</span>'<span class="token punctuation">,</span><span class="token constant">MASTER_LOG_POS</span><span class="token operator">=</span><span class="token number">155</span><span class="token punctuation">;</span>
start slave<span class="token punctuation">;</span>
show slave status \<span class="token class-name">G</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="登录mysql-master服务器-解除锁表。" tabindex="-1"><a class="header-anchor" href="#登录mysql-master服务器-解除锁表。" aria-hidden="true">#</a> 登录mysql-master服务器，解除锁表。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>unlock tables<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h1 id="八、mysql高可用配置-keepalived" tabindex="-1"><a class="header-anchor" href="#八、mysql高可用配置-keepalived" aria-hidden="true">#</a> 八、MySQL高可用配置(keepalived)</h1>
<h2 id="在mysql-master服务器上修改keepalived配置文件。" tabindex="-1"><a class="header-anchor" href="#在mysql-master服务器上修改keepalived配置文件。" aria-hidden="true">#</a> 在mysql-master服务器上修改keepalived配置文件。</h2>
<p>注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script check_mysql <span class="token punctuation">{</span>
  script <span class="token string">"/usr/local/keepalived/sbin/check_mysql.sh"</span>
  interval <span class="token number">3</span>
  weight <span class="token number">2</span>
<span class="token punctuation">}</span>
vrrp_instance mysql <span class="token punctuation">{</span>
  state <span class="token constant">BACKUP</span>
  nopreempt
  <span class="token keyword">interface</span> ens33
  virtual_router_id <span class="token number">88</span>
  priority <span class="token number">100</span>
  advert_int <span class="token number">1</span>
  authentication <span class="token punctuation">{</span>
    auth_type <span class="token constant">PASS</span>
    auth_pass <span class="token number">123456</span>
  <span class="token punctuation">}</span>
  track_script <span class="token punctuation">{</span>
    check_mysql
  <span class="token punctuation">}</span>
  virtual_ipaddress <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.95</span>
  <span class="token punctuation">}</span>
  unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.187</span>
  unicast_peer <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.188</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在mysql-master服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在mysql-master服务器上创建检测脚本。" aria-hidden="true">#</a> 在mysql-master服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_mysql<span class="token punctuation">.</span>sh
# 添加以下配置内容<span class="token punctuation">(</span>注意下面替换为实际<span class="token constant">IP</span><span class="token punctuation">)</span>↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>mysql<span class="token punctuation">.</span>sock<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #echo <span class="token number">1</span>
  <span class="token operator">/</span>bin<span class="token operator">/</span>systemctl restart mysql
  sleep <span class="token number">5</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>mysql<span class="token punctuation">.</span>sock<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
    #echo <span class="token number">2</span>
  fi
fi
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ip a|grep "</span><span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.187</span><span class="token string">")"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #ifconfig ens33 up
  sleep <span class="token number">5</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ip a|grep "</span><span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.187</span><span class="token string">")"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_mysql<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在mysql-master服务器上验证虚拟ip是否绑定。" tabindex="-1"><a class="header-anchor" href="#在mysql-master服务器上验证虚拟ip是否绑定。" aria-hidden="true">#</a> 在mysql-master服务器上验证虚拟IP是否绑定。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 查看虚拟<span class="token constant">IP</span>是否出现在了网卡上
ip a
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="mysql从库配置" tabindex="-1"><a class="header-anchor" href="#mysql从库配置" aria-hidden="true">#</a> MySQL从库配置</h2>
<h2 id="在mysql-backup服务器上修改keepalived配置文件。" tabindex="-1"><a class="header-anchor" href="#在mysql-backup服务器上修改keepalived配置文件。" aria-hidden="true">#</a> 在mysql-backup服务器上修改keepalived配置文件。</h2>
<p>注意配置中interface(指定网卡)、virtual_ipaddress(虚拟IP)、unicast_src_ip(本机IP)和unicast_peer(其它服务器IP)参数可根据实际环境进行配置。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
# 将原配置文件内容清空，添加以下配置内容↓：
<span class="token operator">!</span> <span class="token class-name">Configuration</span> <span class="token class-name">File</span> <span class="token keyword">for</span> keepalived
vrrp_script check_mysql <span class="token punctuation">{</span>
  script <span class="token string">"/usr/local/keepalived/sbin/check_mysql.sh"</span>
  interval <span class="token number">3</span>
  weight <span class="token number">2</span>
<span class="token punctuation">}</span>
vrrp_instance mysql <span class="token punctuation">{</span>
  state <span class="token constant">BACKUP</span>
  nopreempt
  <span class="token keyword">interface</span> ens33
  virtual_router_id <span class="token number">88</span>
  priority <span class="token number">99</span>
  advert_int <span class="token number">1</span>
  authentication <span class="token punctuation">{</span>
    auth_type <span class="token constant">PASS</span>
    auth_pass <span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span>
  <span class="token punctuation">}</span>
  track_script <span class="token punctuation">{</span>
    check_mysql
  <span class="token punctuation">}</span>
  virtual_ipaddress <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.95</span>
  <span class="token punctuation">}</span>
  unicast_src_ip <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.188</span>
  unicast_peer <span class="token punctuation">{</span>
    <span class="token number">192.168</span><span class="token number">.8</span><span class="token number">.187</span>
  <span class="token punctuation">}</span>
notify_master <span class="token string">"/usr/local/keepalived/sbin/become_master.sh"</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在mysql-backup服务器上创建检测脚本。" tabindex="-1"><a class="header-anchor" href="#在mysql-backup服务器上创建检测脚本。" aria-hidden="true">#</a> 在mysql-backup服务器上创建检测脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_mysql<span class="token punctuation">.</span>sh
# 添加以下配置内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>mysql<span class="token punctuation">.</span>sock<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
  #echo <span class="token number">1</span>
  <span class="token operator">/</span>bin<span class="token operator">/</span>systemctl restart mysql
  sleep <span class="token number">5</span>
  <span class="token keyword">if</span> <span class="token punctuation">[</span> <span class="token string">"$(ps -ef | grep "</span>mysql<span class="token punctuation">.</span>sock<span class="token string">"| grep -v grep )"</span> <span class="token operator">==</span> <span class="token string">""</span> <span class="token punctuation">]</span><span class="token punctuation">;</span>then
    <span class="token operator">/</span>etc<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived stop
    #echo <span class="token number">2</span>
  fi
fi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为检测脚本添加可执行权限。-1" tabindex="-1"><a class="header-anchor" href="#为检测脚本添加可执行权限。-1" aria-hidden="true">#</a> 为检测脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>check_mysql<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在mysql-backup服务器上创建处理脚本。" tabindex="-1"><a class="header-anchor" href="#在mysql-backup服务器上创建处理脚本。" aria-hidden="true">#</a> 在mysql-backup服务器上创建处理脚本。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>vim <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>become_master<span class="token punctuation">.</span>sh
# 添加以下配置内容↓：
#<span class="token operator">!</span><span class="token operator">/</span>bin<span class="token operator">/</span>bash
<span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysql <span class="token operator">-</span>uroot <span class="token operator">-</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span> <span class="token operator">-</span>e 'stop slave<span class="token punctuation">;</span>'
<span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysql <span class="token operator">-</span>uroot <span class="token operator">-</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span> <span class="token operator">-</span>e '<span class="token constant">SET</span> <span class="token class-name">GLOBAL</span> read_only<span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">;</span>'
<span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysql <span class="token operator">-</span>uroot <span class="token operator">-</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span><span class="token operator">*</span> <span class="token operator">-</span>e 'reset slave all<span class="token punctuation">;</span>'
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="为处理脚本添加可执行权限。" tabindex="-1"><a class="header-anchor" href="#为处理脚本添加可执行权限。" aria-hidden="true">#</a> 为处理脚本添加可执行权限。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">+</span>x <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>become_master<span class="token punctuation">.</span>sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="在mysql-backup服务器上验证虚拟ip是否绑定-从库是否升级为主库。" tabindex="-1"><a class="header-anchor" href="#在mysql-backup服务器上验证虚拟ip是否绑定-从库是否升级为主库。" aria-hidden="true">#</a> 在mysql-backup服务器上验证虚拟IP是否绑定，从库是否升级为主库。</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>chmod <span class="token operator">-</span><span class="token class-name">R</span> <span class="token number">777</span> <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived<span class="token operator">/</span>keepalived<span class="token punctuation">.</span>conf
service keepalived stop
service keepalived start
# 登录mysql<span class="token operator">-</span>master服务器，停止keepalived服务，查看虚拟<span class="token constant">IP</span>是否漂移到从库服务器上
service keepalived stop
# 登录mysql<span class="token operator">-</span>backup服务器，等待几秒，查看虚拟<span class="token constant">IP</span>是否出现在网卡上
ip a
# 登录mysql<span class="token operator">-</span>backup服务器，登录数据库，查看从库是否升级为主库
mysql<span class="token operator">></span> show slave status \<span class="token class-name">G</span><span class="token punctuation">;</span>
<span class="token class-name">Empty</span> set <span class="token punctuation">(</span><span class="token number">0.00</span> sec<span class="token punctuation">)</span>
<span class="token constant">ERROR</span><span class="token operator">:</span>
<span class="token class-name">No</span> query specified
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="恢复从库数据到主库" tabindex="-1"><a class="header-anchor" href="#恢复从库数据到主库" aria-hidden="true">#</a> 恢复从库数据到主库</h2>
<p>当从库升级为主库时，此时业务数据都会存储到从库，为了重新启用主库，并保证主从数据一致，此时需将从库数据同步到主库。<br>
在mysql-backup服务器上，登录数据库进行锁表，防止数据写入。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mysql<span class="token operator">></span> flush tables <span class="token keyword">with</span> <span class="token namespace">read</span> lock<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>在mysql-master服务器上，停止Keepalived服务和MySQL服务。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl stop keepalived
systemctl stop mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-backup服务器上，导出数据。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>cd <span class="token operator">/</span>tmp
<span class="token operator">/</span>mysql<span class="token operator">/</span>bin<span class="token operator">/</span>mysqldump <span class="token operator">-</span>uroot <span class="token operator">-</span>p <span class="token operator">--</span>master<span class="token operator">-</span>data<span class="token operator">=</span><span class="token number">1</span> <span class="token operator">--</span>single<span class="token operator">-</span>transaction <span class="token operator">--</span>routines <span class="token operator">--</span>triggers <span class="token operator">--</span>events <span class="token operator">--</span>all<span class="token operator">-</span>databases <span class="token operator">></span> allbackup<span class="token punctuation">.</span>sql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-backup服务器上，停止Keepalived服务和MySQL服务。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl stop keepalived
systemctl stop mysql
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-master服务器上，启动数据库，上传从库导出的sql文件到tmp目录，导入从库数据。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start mysql
cd <span class="token operator">/</span>tmp
# 在文件上传的位置，进行数据导入
mysql <span class="token operator">-</span>uroot <span class="token operator">-</span>p
mysql<span class="token operator">></span> source allbackup<span class="token punctuation">.</span>sql<span class="token punctuation">;</span>
mysql<span class="token operator">></span> exit<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-master服务器上，启动Keepalived服务，查看虚拟IP是否绑定。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start keepalived
# 查看虚拟<span class="token constant">IP</span>是否重新绑定，需要等待几秒才会出现
ip a
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>重新设置数据同步。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code># 登录主库<span class="token class-name">MySQL</span><span class="token punctuation">,</span>查看master的binlog的文件名和binlog偏移量
mysql <span class="token operator">-</span>uroot <span class="token operator">-</span>p
mysql<span class="token operator">></span> show master status<span class="token punctuation">;</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token operator">|</span> <span class="token class-name">File</span> <span class="token operator">|</span> <span class="token class-name">Position</span> <span class="token operator">|</span> <span class="token class-name">Binlog_Do_DB</span> <span class="token operator">|</span> <span class="token class-name">Binlog_Ignore_DB</span> <span class="token operator">|</span>
<span class="token class-name">Executed_Gtid_Set</span> <span class="token operator">|</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token operator">|</span> master<span class="token operator">-</span>bin<span class="token punctuation">.</span><span class="token number">000040</span> <span class="token operator">|</span> <span class="token number">1604195</span> <span class="token operator">|</span> <span class="token operator">|</span> <span class="token operator">|</span>
<span class="token operator">|</span>
<span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span>
<span class="token operator">--</span><span class="token operator">--</span><span class="token operator">-</span><span class="token operator">+</span>
<span class="token number">1</span> row in set <span class="token punctuation">(</span><span class="token number">0.02</span> sec<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在mysql-backup服务器上，启动Keepalived服务。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start keepalived
# 查看keepalived和mysql是否启动
systemctl status keepalived<span class="token punctuation">;</span>
systemctl status mysql<span class="token punctuation">;</span>
# 登录从库数据库，设置同步信息
mysql <span class="token operator">-</span>uroot <span class="token operator">-</span>p
unlock tables<span class="token punctuation">;</span>
stop slave<span class="token punctuation">;</span>
change master <span class="token keyword">to</span> <span class="token namespace">master_auto_position</span><span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">;</span>
# 将<span class="token constant">MASTER_HOST</span>、<span class="token constant">MASTER_LOG_FILE</span>和<span class="token constant">MASTER_LOG_POS</span>参数替换为实际的配置
<span class="token constant">CHANGE</span> <span class="token constant">MASTER</span> <span class="token class-name">TO</span> <span class="token constant">MASTER_HOST</span><span class="token operator">=</span>'主库<span class="token constant">IP</span>地
址'<span class="token punctuation">,</span><span class="token constant">MASTER_USER</span><span class="token operator">=</span><span class="token char">'root'</span><span class="token punctuation">,</span><span class="token constant">MASTER_PASSWORD</span><span class="token operator">=</span>'<span class="token number">2</span>wsx<span class="token annotation punctuation">@WSX</span>'<span class="token punctuation">,</span><span class="token constant">MASTER_LOG_FILE</span><span class="token operator">=</span>'master<span class="token operator">-</span>bin<span class="token punctuation">.</span><span class="token number">000005</span>'<span class="token punctuation">,</span><span class="token constant">MASTER_LOG_POS</span><span class="token operator">=</span><span class="token number">155</span><span class="token punctuation">;</span>
start slave<span class="token punctuation">;</span>
show slave status \<span class="token class-name">G</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


