<template><div><p>​		熟练的掌握ip地址可以减少项目中出错的概率与提升工作的效率</p>
<h1 id="一、首先要明确一些概念" tabindex="-1"><a class="header-anchor" href="#一、首先要明确一些概念" aria-hidden="true">#</a> 一、首先要明确一些概念</h1>
<h2 id="类范围" tabindex="-1"><a class="header-anchor" href="#类范围" aria-hidden="true">#</a> 类范围</h2>
<p>IP地址常采用点分十进制表示方法X.Y.Y.Y，在这里</p>
<p>X=1~126时称为A类地址，</p>
<p>X=128~191时称为B类地址，</p>
<p>X=192~223时称为C类地址。</p>
<p>如10.202.52.130 因为X=10在1~126范围内所以称为A类地址</p>
<h2 id="类默认子网掩" tabindex="-1"><a class="header-anchor" href="#类默认子网掩" aria-hidden="true">#</a> 类默认子网掩</h2>
<p>A类为255.0.0.0</p>
<p>B类为255.255.0.0</p>
<p>C类为255.255.255.0</p>
<p>当我们要划分子网用到子网掩码M时，类子网掩码的格式应为</p>
<p>A类为255.M.0.0</p>
<p>B类为255.255.M.0</p>
<p>C类为255.255.255.M</p>
<p>M是相应的子网掩码如:255.255.255.240</p>
<p>十进制计算基数：256，等一下我们所有的十进制计算都要用256来进行。</p>
<p>Subnet_block：可分配子网块大小，指在某一子网掩码下的子网的块数。</p>
<p>Subnet_num：实际可分配子网数，指可分配子网块中要剔除首、尾两块，这是某一子网掩码下可分配的实际子网数量,它等于Subnet_block-2。</p>
<p>IP_block：每个子网可分配的IP地址块大小。</p>
<p>IP_num：每个子网实际可分配的IP地址数，因为每个子网的首、尾IP地址必须保留(一个为网络地址，一个为广播地址)，所以它等于IP_block-2，IP_num也用于计算主机段</p>
<p>M:子网掩码(net mask)。它们之间的公式如下:M=256-IP_block</p>
<p>IP_block=256/Subnet_block，反之Subnet_block=256/IP_block</p>
<p>IP_num=IP_block-2</p>
<p>Subnet_num=Subnet_block-2</p>
<p>参考于：<a href="https://wenku.baidu.com/view/066d24d4b42acfc789eb172ded630b1c58ee9b2e.html" target="_blank" rel="noopener noreferrer">子网掩码及主机段的十进制算法.doc - 百度文库 (baidu.com)<ExternalLinkIcon/></a></p>
<h1 id="二、根据子网掩码算网络地址" tabindex="-1"><a class="header-anchor" href="#二、根据子网掩码算网络地址" aria-hidden="true">#</a> 二、根据子网掩码算网络地址</h1>
<p>已知一个ip地址是192.168.1.1，子网掩码是255.255.255.0，那么它的网络地址是多少？</p>
<p>在了解这个问题之前，我们先需要了解下，什么是网络地址？</p>
<p>ip地址是由两部分组成：网络地址+主机地址。</p>
<p>网络地址可以确定ip地址的范围，ip地址其实跟身份证号比较像。</p>
<p>那么如何来算出网络地址呢？</p>
<p><strong>详细计算</strong></p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>将ip地址<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.1</span>转换为二进制
<span class="token number">11000000.10101000</span><span class="token number">.00000001</span><span class="token number">.00000001</span>
将子网掩码<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.0</span>转换成二进制
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.00000000</span>
然后将两者相“与（and）"运算：
<span class="token number">11000000.10101000</span><span class="token number">.00000001</span><span class="token number">.00000001</span>
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.00000000</span>
然后得到：
<span class="token number">11000000.10101000</span><span class="token number">.00000001</span><span class="token number">.00000000</span>
转换成网络地址就是：<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.0</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="三、根据子网掩码计算可用ip地址数" tabindex="-1"><a class="header-anchor" href="#三、根据子网掩码计算可用ip地址数" aria-hidden="true">#</a> 三、根据子网掩码计算可用ip地址数</h1>
<p>已知某主机的ip地址是192.168.100.200，子网掩码为255.255.255.192，其网络内可用的ip地址个数为多少？</p>
<p><strong>详细计算</strong></p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>将子网掩码<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.192</span>转换为二进制
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11000000</span>
子网掩码共有<span class="token number">26</span>位，还有<span class="token number">6</span>位可用。
即<span class="token number">2</span>的<span class="token number">6</span>次方减去<span class="token number">2</span>，等于<span class="token number">62</span>，即有<span class="token number">62</span>个ip地址可用。
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>上述计算过程-2是除去一个网络地址，一个组播地址</p>
<h1 id="四、设置子网掩码" tabindex="-1"><a class="header-anchor" href="#四、设置子网掩码" aria-hidden="true">#</a> 四、设置子网掩码</h1>
<p>某公司申请到一个C类IP地址，只连接6个子公司，最大的一个子公司有26台计算机，每个子公司都分配在同一个网段，则子网掩码应设为多少合适？</p>
<p>首先一个C类的子网掩码为255.255.255.0，这个是最原始。</p>
<p>但现在我们是有要求：</p>
<p>1、连接6个子网</p>
<p>2、且最大一个子网的ip地址为26个。</p>
<p>如何来设置这个子网掩码呢？</p>
<p>详细计算</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>网络中的原则是ip地址与子网掩码越越精准，网络越易管理，故障越低。
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.0</span>是一个<span class="token class-name">C</span>类地址，子网掩码应该为<span class="token number">255.255</span><span class="token number">.255</span><span class="token punctuation">.</span>M，而<span class="token number">26</span>主机在<span class="token function">16</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token operator">^</span><span class="token number">4</span><span class="token punctuation">)</span>与<span class="token function">32</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token operator">^</span><span class="token number">5</span><span class="token punctuation">)</span>之间，故<span class="token class-name">M</span>取后五位为主机段，前三位为子网段<span class="token punctuation">,</span><span class="token class-name">M</span><span class="token operator">=</span><span class="token number">11100000</span><span class="token operator">=</span><span class="token number">128</span><span class="token operator">+</span><span class="token number">64</span><span class="token operator">+</span><span class="token number">32</span><span class="token operator">=</span><span class="token number">224</span>
    
我们再来验证下，每个子网的主机数量。
子网掩码<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.224</span>转化为二进制为：
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11100000</span>
子网掩码为<span class="token number">27</span>位，那么主机位数为<span class="token number">5</span>位。
即可容纳的主机数为<span class="token number">2</span>的<span class="token number">5</span>次方减<span class="token number">2</span>，等于<span class="token number">30</span>。
完全符合一个子网内容纳<span class="token number">26</span>个ip地址。
所以最终的子网掩码为<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.224</span>

即：
子网掩码为<span class="token operator">:</span><span class="token number">255</span><span class="token punctuation">,</span><span class="token number">255</span><span class="token punctuation">,</span><span class="token number">255</span><span class="token punctuation">,</span><span class="token number">224</span><span class="token punctuation">,</span>掩码长为<span class="token number">24</span><span class="token operator">+</span><span class="token number">3</span><span class="token operator">=</span><span class="token number">27</span>位<span class="token punctuation">.</span>
<span class="token number">8</span>个子网的主机块地址分别为<span class="token operator">:</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.0</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.31</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.32</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.63</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.64</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.95</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.96</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.127</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.128</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.159</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.160</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.191</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.192</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.223</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.224</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.31</span><span class="token number">.255</span>
又因为每个子网块中可分配的主机块又有首<span class="token operator">|</span>尾两个不能用<span class="token punctuation">(</span>一个是子网网络地址<span class="token punctuation">,</span>一个是子网广播地址<span class="token punctuation">)</span><span class="token punctuation">,</span>所以<span class="token number">8</span>个子网的主机块地址分别除去首尾两个<span class="token punctuation">,</span>可用地址范围是<span class="token operator">:</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.1</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.30</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.33</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.62</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.65</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.94</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.97</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.126</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.129</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.158</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.161</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.190</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.193</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.222</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.225</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.31</span><span class="token number">.254</span>
<span class="token constant">IP</span>地址：<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.0</span>二进制为： <span class="token number">11000000.10101000</span><span class="token number">.00000001</span><span class="token number">.00000000</span>
掩码：<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.224</span>二进制为：<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11100000</span>
两者相与得网络地址<span class="token punctuation">(</span>全<span class="token number">1</span>为<span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token number">11000000.10101000</span><span class="token number">.00000001</span><span class="token number">.00000000</span>
网络地址为<span class="token operator">:</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.0</span>
广播地址为<span class="token operator">:</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.255</span>
不过<span class="token number">8</span>个子网块中首尾两块不能用<span class="token punctuation">,</span>如果你是在实际中用的话<span class="token punctuation">,</span>总的主机有<span class="token number">8</span><span class="token operator">*</span><span class="token number">20</span><span class="token operator">=</span><span class="token number">160</span>台<span class="token punctuation">,</span><span class="token number">160</span>可以分成<span class="token number">5</span><span class="token operator">*</span><span class="token number">32</span>台<span class="token punctuation">,</span>即<span class="token number">5</span>个子网<span class="token punctuation">,</span>每个子网<span class="token number">32</span>台<span class="token punctuation">,</span>主机地址可取下面的任意五个<span class="token operator">:</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.33</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.62</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.65</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.94</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.97</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.126</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.129</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.158</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.161</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.190</span>
<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.193</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.222</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>如何计算ip地址和子网掩码是否匹配</p>
<p>子网掩码是用来判断任意两台计算机的IP地址是否属于同一子网络的根据。</p>
<p>最为简单的理解就是两台计算机各自的IP地址与子网掩码进行AND运算后，如果得出的结果是相同的，则说明这两台计算机是处于同一个子网络上的，可以进行直接的通讯。就这么简单。</p>
<p>参考于：<a href="https://blog.csdn.net/weixin_32479897/article/details/118291385" target="_blank" rel="noopener noreferrer">计算机网络如何计算有效ip地址个数,知道IP和子网掩码,如何计算可用IP数量和可用的IP地址?..._Runhua Zhao的博客-CSDN博客<ExternalLinkIcon/></a></p>
<h1 id="五、计算广播地址" tabindex="-1"><a class="header-anchor" href="#五、计算广播地址" aria-hidden="true">#</a> 五、计算广播地址</h1>
<p>10.135.255.19/255.255.255.248的广播地址是什么？</p>
<p>计算思路，要得到广播，先得出网络地址，然后把网络地址的主机位全换成1，便就是广播地址。</p>
<p>详细计算</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>将ip地址<span class="token number">10.135</span><span class="token number">.255</span><span class="token number">.19</span>转换为二进制
<span class="token number">00001010.10000111</span><span class="token number">.11111111</span><span class="token number">.00010011</span>
将子网掩码<span class="token number">255.255</span><span class="token number">.255</span><span class="token number">.248</span>转换成二进制
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11111000</span>
然后将两者相“与（and）"运算：
<span class="token number">00001010.10000111</span><span class="token number">.11111111</span><span class="token number">.00010011</span>
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11111000</span>
然后得到：
<span class="token number">00001010.10000111</span><span class="token number">.11111111</span><span class="token number">.00010000</span>
转换成网络地址就是：<span class="token number">10.135</span><span class="token number">.255</span><span class="token number">.16</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>那么广播地址是多少呢<span class="token operator">?</span>
从子网掩码可以看出，这个子网掩码是<span class="token number">29</span>位。
<span class="token number">11111111.11111111</span><span class="token number">.11111111</span><span class="token number">.11111000</span>
也就是主机数还有<span class="token number">3</span>位可用。
<span class="token number">00001010.10000111</span><span class="token number">.11111111</span><span class="token number">.00010000</span>
把网络地址的后面三个零全换成<span class="token number">1</span>。
即可得出广播地址为：<span class="token number">10.135</span><span class="token number">.255</span><span class="token number">.23</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="六、根据ip地址计算子网掩码" tabindex="-1"><a class="header-anchor" href="#六、根据ip地址计算子网掩码" aria-hidden="true">#</a> 六、根据ip地址计算子网掩码</h1>
<p>大部分的情况下，我们网络中只要不超过254台主机的的话，子网掩码都可以设置成255.255.255.0。那么超过了254台主机的话怎么办呢？</p>
<p>可以划分vlan（<a href="https://blog.csdn.net/phunxm/article/details/9498829" target="_blank" rel="noopener noreferrer">VLAN原理详解_弦苦的博客-CSDN博客_vlan<ExternalLinkIcon/></a>），也可以设置成一个大网段。</p>
<p>设置成一个大网段就有一个难点，如何确定这个大网段里面的子网掩码呢？</p>
<p>示例：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>假设监控网络中有<span class="token number">600</span>个点位，我们现在也不想把它划分vlan（实际项目中大部分是会划分vlan的），假设只想用一个大网段把这<span class="token number">600</span>个点位分配ip地址，如何设置ip地址，如何确实子网掩码？
分析：首先我们知道<span class="token number">600</span>个点位，可以使用<span class="token number">3</span>个<span class="token number">254</span>个ip地址段来分配。
可以使用
ip段一：<span class="token number">192.168</span><span class="token number">.0</span><span class="token number">.1</span>——<span class="token number">192.168</span><span class="token number">.0</span><span class="token number">.254</span>
ip段二：<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.1</span>——<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.254</span>
ip段三：<span class="token number">192.168</span><span class="token number">.2</span><span class="token number">.1</span>——<span class="token number">192.168</span><span class="token number">.2</span><span class="token number">.254</span>
每个网段有<span class="token number">254</span>个ip地址，完全够<span class="token number">600</span>个点位用的。
那么问题来了，如果要使这三个ip段在同一个网段内，那么这个大网段共同的子网掩码是多少呢？
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>我们来分析下：
将ip地址<span class="token number">192.168</span><span class="token number">.0</span><span class="token number">.1</span>转换为二进制
<span class="token number">11000000</span> <span class="token number">10101000</span> <span class="token number">00000000</span> <span class="token number">00000001</span>
将ip地址<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.1</span>转换为二进制
<span class="token number">11000000</span> <span class="token number">10101000</span> <span class="token number">00000001</span> <span class="token number">00000001</span>
将ip地址<span class="token number">192.168</span><span class="token number">.2</span><span class="token number">.1</span>转换为二进制
<span class="token number">11000000</span> <span class="token number">10101000</span> <span class="token number">00000010</span> <span class="token number">00000001</span>
转换成了二进制，可以看得出，三个ip段的二进制前面<span class="token number">22</span>位的是不变的，那么可以将他们表示成：
ip段一：<span class="token number">192.168</span><span class="token number">.0</span><span class="token number">.1</span><span class="token operator">/</span><span class="token number">22</span>
ip段二：<span class="token number">192.168</span><span class="token number">.1</span><span class="token number">.1</span><span class="token operator">/</span><span class="token number">22</span>
ip段三：<span class="token number">192.168</span><span class="token number">.2</span><span class="token number">.1</span><span class="token operator">/</span><span class="token number">22</span>
这种<span class="token number">192.168</span><span class="token number">.2</span><span class="token punctuation">.</span>x<span class="token operator">/</span><span class="token number">22</span>形式的ip地址相信大家平时都见过，就是已经告诉了子网掩码了。
也就是说他们共同的子网掩码二进制前面<span class="token number">22</span>个都是<span class="token number">1</span>。
<span class="token number">11111111</span> <span class="token number">11111111</span> <span class="token number">11111100</span> <span class="token number">00000000</span>
转换成十进制，那就是<span class="token number">255.255</span><span class="token number">.252</span><span class="token number">.0</span>，所以他们共同的子网掩码就是<span class="token number">255.255</span><span class="token number">.252</span><span class="token number">.0</span>。
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


