<template><div><h2 id="docker概念" tabindex="-1"><a class="header-anchor" href="#docker概念" aria-hidden="true">#</a> docker概念</h2>
<p>​		docker和虚拟机VM结构非常相似，但是docker并非虚拟机技术，容器除了运行其中的应用之外，基本不消耗额外的系统资源，虚拟机需要单独分配 独占内存、磁盘等资源；<br>
​		docker最初的设计优势，正是它比虚拟机更节省内存，启动更快。Docker不停地给大家宣传，”虚拟机需要数分钟启动，而Docker容器只需要50毫秒”。</p>
<figure><img src="/assets/images/image-20201214131527522.png" alt="image-20201214131527522" tabindex="0" loading="lazy"><figcaption>image-20201214131527522</figcaption></figure>
<h2 id="docker架构" tabindex="-1"><a class="header-anchor" href="#docker架构" aria-hidden="true">#</a> docker架构</h2>
<figure><img src="/assets/images/image-20201214131543066.png" alt="image-20201214131543066" tabindex="0" loading="lazy"><figcaption>image-20201214131543066</figcaption></figure>
<h2 id="docker的组成元素" tabindex="-1"><a class="header-anchor" href="#docker的组成元素" aria-hidden="true">#</a> docker的组成元素</h2>
<p>•	Docker Client : Docker提供给用户的客户端。Docker Client提供给用户一个终端，用户输入Docker提供的命令来管理本地或者远程的服务器。<br>
•	Docker Daemon : Docker服务的守护进程。每台服务器（物理机或虚机）上只要安装了Docker的环境，基本上就跑了一个后台程序Docker Daemon，Docker Daemon会接收Docker Client发过来的指令,并对服务器的进行具体操作。<br>
•	Docker Images : 俗称Docker的镜像，这个可难懂了。你暂时可以认为这个就像我们要给电脑装系统用的系统CD盘，里面有操作系统的程序，并且还有一些CD盘在系统的基础上安装了必要的软件，做成的一张 “只读” 的CD。<br>
•	Docker Registry : 这个可认为是Docker Images的仓库，就像git的仓库一样，用来管理Docker镜像的，提供了Docker镜像的上传、下载和浏览等功能，并且提供安全的账号管理可以管理只有自己可见的私人image。就像git的仓库一样，docker也提供了官方的Registry，叫做Dock Hub(<a href="http://hub.Docker.com" target="_blank" rel="noopener noreferrer">http://hub.Docker.com<ExternalLinkIcon/></a>)<br>
•	Docker Container : 俗称Docker的容器，这个是最关键的东西了。Docker Container是真正跑项目程序、消耗机器资源、提供服务的地方，Docker Container通过Docker Images启动，在Docker Images的基础上运行你需要的代码。你可以认为Docker Container提供了系统硬件环境，然后使用了Docker Images这些制作好的系统盘，再加上你的项目代码，跑起来就可以提供服务了。 听到这里，可能你会觉得是不是有点像一个VM利用保存的备份或者快照跑起来环境一样，其实是挺像的，但是实际上是有本质的区别，后面我会细说。</p>
<p>​       (C/S) 架构模式， 使用远程API来管理和创建 Docker容器。Docker容器通过镜像来创建，容器与镜像的关系类 似于面向对象编程中的对象与类；</p>
<h2 id="docker安装" tabindex="-1"><a class="header-anchor" href="#docker安装" aria-hidden="true">#</a> docker安装</h2>
<p>安装 参考<a href="http://www.docker.com/products/docker" target="_blank" rel="noopener noreferrer">docker官网<ExternalLinkIcon/></a></p>
<p>查看安装版本</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker version
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214131734289.png" alt="image-20201214131734289" tabindex="0" loading="lazy"><figcaption>image-20201214131734289</figcaption></figure>
<h2 id="测试镜像库" tabindex="-1"><a class="header-anchor" href="#测试镜像库" aria-hidden="true">#</a> 测试镜像库</h2>
<p>为docker 添加国内镜像</p>
<p>/etc/docker/daemon.json将:</p>
<p>{ &quot;registry-mirrors&quot;: [&quot; <a href="https://obou6wyb.mirror.aliyuncs.com" target="_blank" rel="noopener noreferrer">https://obou6wyb.mirror.aliyuncs.com<ExternalLinkIcon/></a>&quot;]}</p>
<p>替换为 { &quot;dns&quot; : [ &quot;192.168.101.2&quot; , &quot;8.8.8.8&quot; ], &quot;registry-mirrors&quot; : [ &quot;<a href="https://docker.mirrors.ustc.edu.cn" target="_blank" rel="noopener noreferrer">https://docker.mirrors.ustc.edu.cn<ExternalLinkIcon/></a>&quot; ] }</p>
<h2 id="重启docker" tabindex="-1"><a class="header-anchor" href="#重启docker" aria-hidden="true">#</a> 重启docker</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>systemctl start docker
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="查看资源库有tomcat镜像" tabindex="-1"><a class="header-anchor" href="#查看资源库有tomcat镜像" aria-hidden="true">#</a> 查看资源库有tomcat镜像</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker search tomcat
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214131814678.png" alt="image-20201214131814678" tabindex="0" loading="lazy"><figcaption>image-20201214131814678</figcaption></figure>
<h2 id="从国内docker镜像库下载tomcat、centos" tabindex="-1"><a class="header-anchor" href="#从国内docker镜像库下载tomcat、centos" aria-hidden="true">#</a> 从国内docker镜像库下载tomcat、centos</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker pull tomcat<span class="token operator">/</span>centos<span class="token operator">/</span>nginx
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="查看有哪些镜像" tabindex="-1"><a class="header-anchor" href="#查看有哪些镜像" aria-hidden="true">#</a> 查看有哪些镜像</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker images
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214131847691.png" alt="image-20201214131847691" tabindex="0" loading="lazy"><figcaption>image-20201214131847691</figcaption></figure>
<h2 id="启动基于tomcat-centos镜像启动容器" tabindex="-1"><a class="header-anchor" href="#启动基于tomcat-centos镜像启动容器" aria-hidden="true">#</a> 启动基于tomcat,centos镜像启动容器</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>  docker run <span class="token operator">-</span>p <span class="token number">8081</span><span class="token operator">:</span><span class="token number">8080</span> tomcat 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>​	若端口被占用，可以指定容器和主机的映射端口 前者是外围访问端口：后者是容器内部端口</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker run <span class="token operator">-</span>dit <span class="token operator">-</span>p <span class="token number">4000</span><span class="token operator">:</span><span class="token number">4000</span> centos 

<span class="token operator">-</span>d 以守护态运行 
<span class="token operator">-</span>p 宿主机端口映射容器端口 
<span class="token operator">-</span>i 允许容器内标准输入 
<span class="token operator">-</span>t 新容器内指定一个伪终端 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>浏览器查看访问容器tomcat实例<a href="http://192.168.6.71:8081/" target="_blank" rel="noopener noreferrer">http://192.168.6.71:8081/<ExternalLinkIcon/></a></p>
<figure><img src="/assets/images/image-20201214131948506.png" alt="image-20201214131948506" tabindex="0" loading="lazy"><figcaption>image-20201214131948506</figcaption></figure>
<p>第一个容器服务部署成功了！</p>
<h2 id="进去伪终端查看" tabindex="-1"><a class="header-anchor" href="#进去伪终端查看" aria-hidden="true">#</a> 进去伪终端查看</h2>
<p>docker登录容器</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker exec <span class="token operator">-</span>it hardcore_edison  <span class="token string">"/bin/bash"</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214132014480.png" alt="image-20201214132014480" tabindex="0" loading="lazy"><figcaption>image-20201214132014480</figcaption></figure>
<h2 id="本地文件复制容器中" tabindex="-1"><a class="header-anchor" href="#本地文件复制容器中" aria-hidden="true">#</a> 本地文件复制容器中</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker cp localFile containerID<span class="token operator">:</span>targetAddress
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>命令：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker cp gag<span class="token operator">-</span>material<span class="token punctuation">.</span>war <span class="token punctuation">[</span>b5e1e6975083<span class="token operator">:</span><span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>tomcat<span class="token operator">/</span>webapps<span class="token punctuation">]</span><span class="token punctuation">(</span>http<span class="token operator">:</span><span class="token operator">/</span><span class="token operator">/</span>b5e1e6975083<span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>tomcat<span class="token operator">/</span>webapps<span class="token punctuation">)</span> 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>将本地应用war包上传到tomcat容器的webapps下面，加载应用成功，浏览器显示：</p>
<figure><img src="/assets/images/image-20201214132059091.png" alt="image-20201214132059091" tabindex="0" loading="lazy"><figcaption>image-20201214132059091</figcaption></figure>
<p>以上就是docker的简单入门操作；</p>
<p>构建一个docker镜像需要写一个叫做Dockerfile的文件<br>
先查看下本地镜像有哪些？</p>
<figure><img src="/assets/images/image-20201214132127621.png" alt="image-20201214132127621" tabindex="0" loading="lazy"><figcaption>image-20201214132127621</figcaption></figure>
<p>在某一个目录下面创建一个专门存放此demo的目录，也就是Dockerfile所在的context：</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>mkdir dockerDemo <span class="token operator">&amp;&amp;</span> cd dockerDemo <span class="token operator">&amp;&amp;</span> touch <span class="token class-name">Dockerfile</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>接下来就开始编写Dockerfile文件了（注意Dockerfile的D需要大写）</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code> vim <span class="token class-name">Dockerfile</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>#############################################################  
#base image
<span class="token constant">FROM</span> centos
#<span class="token constant">MAINTAINER</span>
<span class="token constant">MAINTAINER</span> <span class="token punctuation">[</span>test<span class="token annotation punctuation">@qq.com</span><span class="token punctuation">]</span><span class="token punctuation">(</span>mailto<span class="token operator">:</span>test<span class="token annotation punctuation">@qq.com</span><span class="token punctuation">)</span>

 

#put nginx into <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>src and unpack nginx
   <span class="token constant">ADD</span> nginx<span class="token operator">-</span><span class="token number">1.12</span><span class="token number">.2</span><span class="token punctuation">.</span>tar<span class="token punctuation">.</span>gz <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>src

#running required command

  <span class="token constant">RUN</span> yum install <span class="token operator">-</span>y gcc gcc<span class="token operator">-</span>c<span class="token operator">++</span> glibc make autoconf openssl openssl<span class="token operator">-</span>devel 
   <span class="token constant">RUN</span> yum install <span class="token operator">-</span>y libxslt<span class="token operator">-</span>devel <span class="token operator">-</span>y gd gd<span class="token operator">-</span>devel <span class="token class-name">GeoIP</span> <span class="token class-name">GeoIP</span><span class="token operator">-</span>devel pcre pcre<span class="token operator">-</span>devel
   <span class="token constant">RUN</span> useradd <span class="token operator">-</span><span class="token class-name">M</span> <span class="token operator">-</span>s <span class="token operator">/</span>sbin<span class="token operator">/</span>nologin nginx

#change dir <span class="token keyword">to</span> <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>src<span class="token operator">/</span>nginx<span class="token operator">-</span><span class="token number">1.12</span><span class="token number">.2</span>
   <span class="token constant">WORKDIR</span> <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>src<span class="token operator">/</span>nginx<span class="token operator">-</span><span class="token number">1.12</span><span class="token number">.2</span>
# execute command <span class="token keyword">to</span> <span class="token namespace">compile</span> nginx
    <span class="token constant">RUN</span> <span class="token punctuation">.</span>/configure <span class="token operator">--</span>user<span class="token operator">=</span>nginx <span class="token operator">--</span>group<span class="token operator">=</span>nginx <span class="token operator">--</span>prefix<span class="token operator">=</span><span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>nginx <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>file<span class="token operator">-</span>aio <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_ssl_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_realip_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_addition_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_xslt_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_image_filter_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_geoip_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_sub_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_dav_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>    http_flv_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_mp4_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_gunzip_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_gzip_static_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_auth_request_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_random_index_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_secure_link_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_degradation_module <span class="token operator">--</span><span class="token keyword">with</span><span class="token operator">-</span>http_stub_status_module <span class="token operator">&amp;&amp;</span> make <span class="token operator">&amp;&amp;</span> make install
#对外暴露端口
<span class="token constant">EXPOSE</span> <span class="token number">80</span>
#############################################################  
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里以编译nginx提供web服务来构建新的镜像</p>
<p>下载nginx源码包到docker_demo这个目录下</p>
<p>wget -c <a href="https://nginx.org/download/nginx-1.12.2.tar.gz" target="_blank" rel="noopener noreferrer">https://nginx.org/download/nginx-1.12.2.tar.gz<ExternalLinkIcon/></a></p>
<figure><img src="/assets/images/image-20201214132215125.png" alt="image-20201214132215125" tabindex="0" loading="lazy"><figcaption>image-20201214132215125</figcaption></figure>
<h2 id="构建nginx-v1版本镜像" tabindex="-1"><a class="header-anchor" href="#构建nginx-v1版本镜像" aria-hidden="true">#</a> 构建nginx:v1版本镜像</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker build <span class="token operator">-</span>t centos_nginx<span class="token operator">:</span>v1 <span class="token punctuation">.</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="观察日志" tabindex="-1"><a class="header-anchor" href="#观察日志" aria-hidden="true">#</a> 观察日志</h2>
<p>每一个步骤都成功</p>
<figure><img src="/assets/images/image-20201214132254636.png" alt="image-20201214132254636" tabindex="0" loading="lazy"><figcaption>image-20201214132254636</figcaption></figure>
<h2 id="构建步骤" tabindex="-1"><a class="header-anchor" href="#构建步骤" aria-hidden="true">#</a> 构建步骤</h2>
<p>成功构建centos_nginx:v1</p>
<figure><img src="/assets/images/image-20201214132309723.png" alt="image-20201214132309723" tabindex="0" loading="lazy"><figcaption>image-20201214132309723</figcaption></figure>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker images
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214132326043.png" alt="image-20201214132326043" tabindex="0" loading="lazy"><figcaption>image-20201214132326043</figcaption></figure>
<h2 id="启动容器" tabindex="-1"><a class="header-anchor" href="#启动容器" aria-hidden="true">#</a> 启动容器</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker run <span class="token operator">-</span>d <span class="token operator">-</span>p80<span class="token operator">:</span><span class="token number">80</span> centos_nginx<span class="token operator">:</span>v1 <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>nginx<span class="token operator">/</span>sbin<span class="token operator">/</span>nginx <span class="token operator">-</span>g <span class="token string">"daemon off;"</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214132343909.png" alt="image-20201214132343909" tabindex="0" loading="lazy"><figcaption>image-20201214132343909</figcaption></figure>
<h2 id="查看镜像对外暴露端口号" tabindex="-1"><a class="header-anchor" href="#查看镜像对外暴露端口号" aria-hidden="true">#</a> 查看镜像对外暴露端口号</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>docker port containerID
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><figure><img src="/assets/images/image-20201214132401207.png" alt="image-20201214132401207" tabindex="0" loading="lazy"><figcaption>image-20201214132401207</figcaption></figure>
<h2 id="浏览器查看nginx启动状态" tabindex="-1"><a class="header-anchor" href="#浏览器查看nginx启动状态" aria-hidden="true">#</a> 浏览器查看nginx启动状态</h2>
<figure><img src="/assets/images/image-20201214132416329.png" alt="image-20201214132416329" tabindex="0" loading="lazy"><figcaption>image-20201214132416329</figcaption></figure>
<p>已经完成第一个nginx的镜像构建以及容器启动；</p>
</div></template>


