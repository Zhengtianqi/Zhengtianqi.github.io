<template><div><p>本文介绍了磁盘挂载、JDK安装、Keepalived安装</p>
<h1 id="一、硬盘挂载" tabindex="-1"><a class="header-anchor" href="#一、硬盘挂载" aria-hidden="true">#</a> 一、硬盘挂载</h1>
<h2 id="_1-查看设备的挂载情况" tabindex="-1"><a class="header-anchor" href="#_1-查看设备的挂载情况" aria-hidden="true">#</a> （1）查看设备的挂载情况</h2>
<p>lsblk或lsblk –f或者fdisk -l<br>
<img src="/assets/images/bushu1.png" alt="img" loading="lazy"><br>
<img src="/assets/images/bushu2.png" alt="img" loading="lazy"></p>
<h2 id="_2-分区" tabindex="-1"><a class="header-anchor" href="#_2-分区" aria-hidden="true">#</a> （2）分区</h2>
<p>fdisk /dev/vdb   其中/dev/vdb表示上图未挂载的硬盘<br>
分区步骤如下图，下图以/dev/sdb为例<br>
<img src="/assets/images/bushu3.png" alt="img" loading="lazy"><br>
<img src="/assets/images/bushu4.png" alt="img" loading="lazy"><br>
<img src="/assets/images/bushu5.png" alt="img" loading="lazy"></p>
<h2 id="_3-格式化" tabindex="-1"><a class="header-anchor" href="#_3-格式化" aria-hidden="true">#</a> （3）格式化</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mkfs <span class="token operator">-</span>t ext4 <span class="token operator">/</span>dev<span class="token operator">/</span>vdb1   其中<span class="token operator">/</span>dev<span class="token operator">/</span>vdb1是要格式化的分区名，下图以<span class="token operator">/</span>dev<span class="token operator">/</span>sdb1为例
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/bushu6.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<h2 id="_4-挂载" tabindex="-1"><a class="header-anchor" href="#_4-挂载" aria-hidden="true">#</a> （4）挂载</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>挂载到<span class="token operator">/</span>mnt目录下，具体操作步骤如下：
进入 mmt目录
cd <span class="token operator">/</span>mmt<span class="token operator">/</span>
挂载到 <span class="token operator">/</span>mnt
mount <span class="token operator">/</span>dev<span class="token operator">/</span>vdb1 <span class="token operator">/</span>mnt   其中<span class="token operator">/</span>dev<span class="token operator">/</span>vdb1是要挂载的分区名
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_5-设置可以自动挂载-永久挂载-当你重启-linux-之后-仍然可以挂载" tabindex="-1"><a class="header-anchor" href="#_5-设置可以自动挂载-永久挂载-当你重启-linux-之后-仍然可以挂载" aria-hidden="true">#</a> （5）设置可以自动挂载（永久挂载，当你重启 Linux 之后，仍然可以挂载）</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>永久挂载：通过修改 <span class="token operator">/</span>etc<span class="token operator">/</span>fstab 实现挂载
vim  <span class="token operator">/</span>etc<span class="token operator">/</span>fstab打开<span class="token operator">/</span>etc<span class="token operator">/</span>fstab文件，如下图所示，添加下一行内容，其中，<span class="token operator">/</span>dev<span class="token operator">/</span>vdb1  <span class="token operator">/</span>mnt是要挂载内容。
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="/assets/images/bushu7.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<h2 id="_6-查看" tabindex="-1"><a class="header-anchor" href="#_6-查看" aria-hidden="true">#</a> （6）查看</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>df –h
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/bushu8.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<h1 id="二、jdk-1-8安装" tabindex="-1"><a class="header-anchor" href="#二、jdk-1-8安装" aria-hidden="true">#</a> 二、JDK 1.8安装</h1>
<h2 id="_1-官网下载需要安装版本jdk-下载地址" tabindex="-1"><a class="header-anchor" href="#_1-官网下载需要安装版本jdk-下载地址" aria-hidden="true">#</a> （1）官网下载需要安装版本jdk，下载地址</h2>
<p><a href="https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html" target="_blank" rel="noopener noreferrer">https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html<ExternalLinkIcon/></a><br>
<img src="/assets/images/bushu9.png" alt="img" loading="lazy"></p>
<h2 id="_2-拷贝至linux安装目录" tabindex="-1"><a class="header-anchor" href="#_2-拷贝至linux安装目录" aria-hidden="true">#</a> （2）拷贝至linux安装目录</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>将下载好的jdk包拷贝至<span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>java 目录下
进入目录：
cd <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>java
解压：
tar zxvf jdk<span class="token operator">-</span><span class="token number">8</span>u351<span class="token operator">-</span>linux<span class="token operator">-</span>x64<span class="token punctuation">.</span>tar<span class="token punctuation">.</span>gz
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3-配置环境变量" tabindex="-1"><a class="header-anchor" href="#_3-配置环境变量" aria-hidden="true">#</a> （3）配置环境变量</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>编辑<span class="token operator">/</span>etc<span class="token operator">/</span>profile文件
vim <span class="token operator">/</span>etc<span class="token operator">/</span>profile

编辑模式在文档中增加如下行：
export <span class="token constant">JAVA_HOME</span><span class="token operator">=</span><span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>java<span class="token operator">/</span>jdk1<span class="token punctuation">.</span><span class="token number">8.0_351</span>
export <span class="token constant">CLASSPATH</span><span class="token operator">=</span><span class="token punctuation">.</span><span class="token punctuation">:</span>$<span class="token constant">JAVA_HOME</span><span class="token operator">/</span>jre<span class="token operator">/</span>lib<span class="token operator">/</span>rt<span class="token punctuation">.</span>jar<span class="token operator">:</span>$<span class="token constant">JAVA_HOME</span><span class="token operator">/</span>lib<span class="token operator">/</span>dt<span class="token punctuation">.</span>jar<span class="token operator">:</span>$<span class="token constant">JAVA_HOME</span><span class="token operator">/</span>lib<span class="token operator">/</span>tools<span class="token punctuation">.</span>jar
export <span class="token constant">PATH</span><span class="token operator">=</span>$<span class="token constant">PATH</span><span class="token operator">:</span>$<span class="token constant">JAVA_HOME</span><span class="token operator">/</span>bin

生效环境变量
source <span class="token operator">/</span>etc<span class="token operator">/</span>profile
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4-验证是否安装成功" tabindex="-1"><a class="header-anchor" href="#_4-验证是否安装成功" aria-hidden="true">#</a> （4）验证是否安装成功</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>java <span class="token operator">-</span>version
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/bushu11.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure>
<h1 id="三、keepalived安装" tabindex="-1"><a class="header-anchor" href="#三、keepalived安装" aria-hidden="true">#</a> 三、Keepalived安装</h1>
<h2 id="_1-安装" tabindex="-1"><a class="header-anchor" href="#_1-安装" aria-hidden="true">#</a> (1)安装</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>tar xzf keepalived<span class="token operator">-</span><span class="token number">1.2</span><span class="token number">.22</span><span class="token punctuation">.</span>tar<span class="token punctuation">.</span>gz
cd keepalived<span class="token operator">-</span><span class="token number">1.2</span><span class="token number">.22</span>
<span class="token punctuation">.</span>/configure <span class="token operator">--</span>prefix<span class="token operator">=</span><span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived
make <span class="token operator">&amp;&amp;</span> make install
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2-配置" tabindex="-1"><a class="header-anchor" href="#_2-配置" aria-hidden="true">#</a> (2)配置</h2>
<p>在所有服务器上配置keepalived软件。</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>ln <span class="token operator">-</span>s <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>etc<span class="token operator">/</span>keepalived <span class="token operator">/</span>etc<span class="token operator">/</span>keepalived
ln <span class="token operator">-</span>s <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>etc<span class="token operator">/</span>rc<span class="token punctuation">.</span>d<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived
<span class="token operator">/</span>etc<span class="token operator">/</span>rc<span class="token punctuation">.</span>d<span class="token operator">/</span>init<span class="token punctuation">.</span>d<span class="token operator">/</span>keepalived
ln <span class="token operator">-</span>s <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>etc<span class="token operator">/</span>sysconfig<span class="token operator">/</span>keepalived <span class="token operator">/</span>etc<span class="token operator">/</span>sysconfig<span class="token operator">/</span>keepalived
ln <span class="token operator">-</span>s <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>keepalived<span class="token operator">/</span>sbin<span class="token operator">/</span>keepalived <span class="token operator">/</span>usr<span class="token operator">/</span>bin<span class="token operator">/</span>keepalived
# 配置自启
chkconfig <span class="token operator">--</span>add keepalived
chkconfig keepalived on
# 重启查看
reboot
systemctl status keepalived
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


