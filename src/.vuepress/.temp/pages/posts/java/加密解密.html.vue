<template><div><h1 id="_1、组成" tabindex="-1"><a class="header-anchor" href="#_1、组成" aria-hidden="true">#</a> 1、组成</h1>
<p>（1）明文：未加密的消息m；</p>
<p>（2）密文：加密后的消息ct；</p>
<p>（3）加解密算法：把明文变成密文，密文变成明文的转换函数；</p>
<p>（4）加密密钥：明文 加密成 密文 需要的参数；</p>
<p>（5）解密密钥：密文变成 明文 需要的参数</p>
<h1 id="_2、分类" tabindex="-1"><a class="header-anchor" href="#_2、分类" aria-hidden="true">#</a> 2、分类</h1>
<h2 id="_1-对称加密算法" tabindex="-1"><a class="header-anchor" href="#_1-对称加密算法" aria-hidden="true">#</a> （1）对称加密算法</h2>
<p>对称加密算法 ： 加密密钥 = 解密密钥</p>
<figure><img src="/assets/images/对称加密算法.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_2-非对称加密算法" tabindex="-1"><a class="header-anchor" href="#_2-非对称加密算法" aria-hidden="true">#</a> （2）非对称加密算法</h2>
<p>对称加密算法 ： 加密密钥 != 解密密钥</p>
<figure><img src="/assets/images/非对称加密算法.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h2 id="_3-混合加密机制" tabindex="-1"><a class="header-anchor" href="#_3-混合加密机制" aria-hidden="true">#</a> （3）混合加密机制</h2>
<p>混合加密算法：对称加密 + 非对称加密</p>
<figure><img src="/assets/images/混合加密的方式.png" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure>
<h3 id="加密过程" tabindex="-1"><a class="header-anchor" href="#加密过程" aria-hidden="true">#</a> 加密过程</h3>
<p>（a）首先利用对称加密技术加密索要安全传输的消息</p>
<p>（b）然后将对称密钥通过非对称加密的方式用公钥进行加密，附在（a）所述消息中</p>
<h3 id="解密过程" tabindex="-1"><a class="header-anchor" href="#解密过程" aria-hidden="true">#</a> 解密过程</h3>
<p>（a）首先使用私钥解密密钥</p>
<p>（b）然后再用此密钥解密消息</p>
<h2 id="_4-为什么需要混合加密机制" tabindex="-1"><a class="header-anchor" href="#_4-为什么需要混合加密机制" aria-hidden="true">#</a> （4）为什么需要混合加密机制？</h2>
<h3 id="安全-速度快" tabindex="-1"><a class="header-anchor" href="#安全-速度快" aria-hidden="true">#</a> 安全？速度快？</h3>
<p>​	先拿对称加密和非对称加密算法，做一个对比</p>
<p>​	本文中的私钥、公钥是非对称加密的说法；密钥是对称加密的说法。</p>
<figure><img src="/assets/images/加密算法.png" alt="1571142451345" tabindex="0" loading="lazy"><figcaption>1571142451345</figcaption></figure>
<p>谈一下混合的好处：</p>
<p>（a）利用对称加密的速度快：进行网络消息传输时响应及时；</p>
<p>（b）非对称加密的安全优势：给你一个通过公钥加密的密钥，你先拿私钥解开加密的密钥，然后才能解开消息，保证密钥不被泄露。（注：有点绕；此处私钥、公钥是非对称加密的说法；密钥是对称加密的说法。）</p>
</div></template>


