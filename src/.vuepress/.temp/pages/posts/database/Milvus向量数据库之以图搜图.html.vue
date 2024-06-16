<template><div><h1 id="一、介绍" tabindex="-1"><a class="header-anchor" href="#一、介绍" aria-hidden="true">#</a> 一、介绍</h1>
<p>Milvus 创建于 2019 年，其目标只有一个：存储、索引和管理由深度神经网络和其他机器学习 （ML） 模型生成的大量嵌入向量。<br>
作为专门设计用于处理对输入向量的查询的数据库，它能够以万亿级对向量进行索引。与现有关系数据库主要按照预定义模式处理结构化数据不同，Milvus 是自下而上设计的，用于处理从非结构化数据转换的嵌入向量。</p>
<p>随着互联网的发展和发展，非结构化数据变得越来越普遍，包括电子邮件、论文、物联网传感器数据、Facebook 照片、蛋白质结构等等。为了使计算机理解和处理非结构化数据，使用嵌入技术将这些数据转换为向量。Milvus 存储并索引这些向量。Milvus 能够通过计算两个向量的相似距离来分析它们之间的相关性。如果两个嵌入向量非常相似，则意味着原始数据源也相似。<br>
<img src="/assets/images/milvus1.png" alt="img" loading="lazy"><br>
来源：<br>
<a href="https://milvus.io/docs/v2.1.x/overview.md" target="_blank" rel="noopener noreferrer">https://milvus.io/docs/v2.1.x/overview.md<ExternalLinkIcon/></a></p>
<h2 id="milvus支持的索引和指标" tabindex="-1"><a class="header-anchor" href="#milvus支持的索引和指标" aria-hidden="true">#</a> milvus支持的索引和指标</h2>
<h3 id="索引" tabindex="-1"><a class="header-anchor" href="#索引" aria-hidden="true">#</a> 索引：</h3>
<p>Milvus 支持的大多数向量指数类型都使用近似最近邻搜索 （ANNS），包括：<br>
FLAT：FLAT最适合在百万规模的小型数据集上寻求完全准确和准确的搜索结果的方案。<br>
IVF_FLAT：IVF_FLAT是基于量化的索引，最适合在准确性和查询速度之间寻求理想平衡的场景。<br>
IVF_SQ8：IVF_SQ8是基于量化的索引，最适合寻求显著减少磁盘、CPU 和 GPU 内存消耗的方案，因为这些资源非常有限。<br>
IVF_PQ：IVF_PQ是基于量化的索引，最适合以准确性为代价寻求高查询速度的方案。<br>
HNSW：HNSW 是基于图形的索引，最适合对搜索效率有较高要求的场景。<br>
ANNOY：ANNOY是基于树的索引，最适合寻求高召回率的方案。</p>
<h3 id="相似性指标" tabindex="-1"><a class="header-anchor" href="#相似性指标" aria-hidden="true">#</a> 相似性指标：</h3>
<p>欧几里得距离（Euclidean distance、L2）：该指标通常用于计算机视觉（CV）领域。<br>
内积（Inner product、IP）：该指标通常用于自然语言处理（NLP）领域。</p>
<h3 id="广泛用于二进制嵌入的指标包括" tabindex="-1"><a class="header-anchor" href="#广泛用于二进制嵌入的指标包括" aria-hidden="true">#</a> 广泛用于二进制嵌入的指标包括：</h3>
<p>Hamming：这个指标通常用于自然语言处理（NLP）领域。<br>
Jaccard：这个指标通常用于分子相似性搜索领域。<br>
Tanimoto：这个指标通常用于分子相似性搜索领域。<br>
Superstructure：此指标通常用于搜索分子的类似上层结构。<br>
Substructure：此指标通常用于搜索分子的类似子结构。</p>
<h2 id="用途" tabindex="-1"><a class="header-anchor" href="#用途" aria-hidden="true">#</a> 用途</h2>
<p>图像相似性搜索：图像可搜索并立即从海量数据库中返回最相似的图像。<br>
视频相似性搜索：通过将关键帧转换为矢量，然后将结果输入 Milvus，可以近乎实时地搜索和推荐数十亿个视频。<br>
音频相似性搜索：快速查询语音、音乐、音效等海量音频数据，并显示相似声音。<br>
分子相似性搜索：对指定分子进行超快速的相似性搜索、子结构搜索或上层结构搜索。<br>
推荐系统：根据用户行为和需求推荐信息或产品。<br>
问答系统：交互式数字QA聊天机器人，可自动回答用户问题。<br>
DNA序列分类：通过比较相似的DNA序列，在毫秒内准确梳理出基因的分类。<br>
文本搜索引擎：通过将关键字与文本数据库进行比较，帮助用户找到他们正在寻找的信息。<br>
<img src="/assets/images/milvus2.png" alt="img" loading="lazy"></p>
<h1 id="二、安装及简单使用" tabindex="-1"><a class="header-anchor" href="#二、安装及简单使用" aria-hidden="true">#</a> 二、安装及简单使用</h1>
<h2 id="_1、单机版下载安装" tabindex="-1"><a class="header-anchor" href="#_1、单机版下载安装" aria-hidden="true">#</a> 1、单机版下载安装</h2>
<p>手动或使用以下命令下载并保存。milvus-standalone-docker-compose.ymldocker-compose.yml</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>$ wget https：<span class="token comment">//github.com/milvus-io/milvus/releases/download/v2.1.4/milvus-standalone-docker-compose.yml -O docker-compose.yml</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>启动<br>
在与文件相同的目录中，通过运行以下命令启动 Milvus：docker-compose.yml</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>sudo docker<span class="token operator">-</span>compose up <span class="token operator">-</span>d
sudo docker<span class="token operator">-</span>compose ps
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>停止</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>sudo docker<span class="token operator">-</span>compuse down
sudo rm <span class="token operator">-</span>rf  volumes
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2、python版sdk" tabindex="-1"><a class="header-anchor" href="#_2、python版sdk" aria-hidden="true">#</a> 2、python版sdk</h2>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code>pip install pymilvus<span class="token operator">==</span><span class="token number">2.1</span><span class="token number">.3</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="_3、示例" tabindex="-1"><a class="header-anchor" href="#_3、示例" aria-hidden="true">#</a> 3、示例</h2>
<div class="language-python line-numbers-mode" data-ext="py"><pre v-pre class="language-python"><code><span class="token keyword">from</span> pymilvus <span class="token keyword">import</span> <span class="token punctuation">(</span>
    connections<span class="token punctuation">,</span>
    utility<span class="token punctuation">,</span>
    FieldSchema<span class="token punctuation">,</span>
    CollectionSchema<span class="token punctuation">,</span>
    DataType<span class="token punctuation">,</span>
    Collection<span class="token punctuation">,</span>
<span class="token punctuation">)</span>
<span class="token comment"># 建立连接</span>
connections<span class="token punctuation">.</span>connect<span class="token punctuation">(</span><span class="token string">"default"</span><span class="token punctuation">,</span> host<span class="token operator">=</span><span class="token string">"localhost"</span><span class="token punctuation">,</span> port<span class="token operator">=</span><span class="token string">"19530"</span><span class="token punctuation">)</span>
<span class="token comment"># 创建集合</span>
fields <span class="token operator">=</span> <span class="token punctuation">[</span>
    FieldSchema<span class="token punctuation">(</span>name<span class="token operator">=</span><span class="token string">"pk"</span><span class="token punctuation">,</span> dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>INT64<span class="token punctuation">,</span> is_primary<span class="token operator">=</span><span class="token boolean">True</span><span class="token punctuation">,</span> auto_id<span class="token operator">=</span><span class="token boolean">False</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    FieldSchema<span class="token punctuation">(</span>name<span class="token operator">=</span><span class="token string">"random"</span><span class="token punctuation">,</span> dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>DOUBLE<span class="token punctuation">)</span><span class="token punctuation">,</span>
    FieldSchema<span class="token punctuation">(</span>name<span class="token operator">=</span><span class="token string">"embeddings"</span><span class="token punctuation">,</span> dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>FLOAT_VECTOR<span class="token punctuation">,</span> dim<span class="token operator">=</span><span class="token number">8</span><span class="token punctuation">)</span>
<span class="token punctuation">]</span>
schema <span class="token operator">=</span> CollectionSchema<span class="token punctuation">(</span>fields<span class="token punctuation">,</span> <span class="token string">"hello_milvus is the simplest demo to introduce the APIs"</span><span class="token punctuation">)</span>
hello_milvus <span class="token operator">=</span> Collection<span class="token punctuation">(</span><span class="token string">"hello_milvus"</span><span class="token punctuation">,</span> schema<span class="token punctuation">)</span>
<span class="token comment"># 向集合中插入向量</span>
<span class="token keyword">import</span> random
entities <span class="token operator">=</span> <span class="token punctuation">[</span>
    <span class="token punctuation">[</span>i <span class="token keyword">for</span> i <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">]</span><span class="token punctuation">,</span>  <span class="token comment"># field pk</span>
    <span class="token punctuation">[</span><span class="token builtin">float</span><span class="token punctuation">(</span>random<span class="token punctuation">.</span>randrange<span class="token punctuation">(</span><span class="token operator">-</span><span class="token number">20</span><span class="token punctuation">,</span> <span class="token operator">-</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token keyword">for</span> _ <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">]</span><span class="token punctuation">,</span>  <span class="token comment"># field random</span>
    <span class="token punctuation">[</span><span class="token punctuation">[</span>random<span class="token punctuation">.</span>random<span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">for</span> _ <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">8</span><span class="token punctuation">)</span><span class="token punctuation">]</span> <span class="token keyword">for</span> _ <span class="token keyword">in</span> <span class="token builtin">range</span><span class="token punctuation">(</span><span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">]</span><span class="token punctuation">,</span>  <span class="token comment"># field embeddings</span>
<span class="token punctuation">]</span>
insert_result <span class="token operator">=</span> hello_milvus<span class="token punctuation">.</span>insert<span class="token punctuation">(</span>entities<span class="token punctuation">)</span>
<span class="token comment"># 在实体上构建索引</span>
index <span class="token operator">=</span> <span class="token punctuation">{</span>
    <span class="token string">"index_type"</span><span class="token punctuation">:</span> <span class="token string">"IVF_FLAT"</span><span class="token punctuation">,</span>
    <span class="token string">"metric_type"</span><span class="token punctuation">:</span> <span class="token string">"L2"</span><span class="token punctuation">,</span>
    <span class="token string">"params"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token string">"nlist"</span><span class="token punctuation">:</span> <span class="token number">128</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span>
hello_milvus<span class="token punctuation">.</span>create_index<span class="token punctuation">(</span><span class="token string">"embeddings"</span><span class="token punctuation">,</span> index<span class="token punctuation">)</span>
<span class="token comment"># 将集合加载到内存并执行向量相似性搜索</span>
hello_milvus<span class="token punctuation">.</span>load<span class="token punctuation">(</span><span class="token punctuation">)</span>
vectors_to_search <span class="token operator">=</span> entities<span class="token punctuation">[</span><span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token operator">-</span><span class="token number">2</span><span class="token punctuation">:</span><span class="token punctuation">]</span>
search_params <span class="token operator">=</span> <span class="token punctuation">{</span>
    <span class="token string">"metric_type"</span><span class="token punctuation">:</span> <span class="token string">"L2"</span><span class="token punctuation">,</span>
    <span class="token string">"params"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token string">"nprobe"</span><span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span>
result <span class="token operator">=</span> hello_milvus<span class="token punctuation">.</span>search<span class="token punctuation">(</span>vectors_to_search<span class="token punctuation">,</span> <span class="token string">"embeddings"</span><span class="token punctuation">,</span> search_params<span class="token punctuation">,</span> limit<span class="token operator">=</span><span class="token number">3</span><span class="token punctuation">,</span> output_fields<span class="token operator">=</span><span class="token punctuation">[</span><span class="token string">"random"</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token comment"># 执行矢量查询：</span>
result <span class="token operator">=</span> hello_milvus<span class="token punctuation">.</span>query<span class="token punctuation">(</span>expr<span class="token operator">=</span><span class="token string">"random > -14"</span><span class="token punctuation">,</span> output_fields<span class="token operator">=</span><span class="token punctuation">[</span><span class="token string">"random"</span><span class="token punctuation">,</span> <span class="token string">"embeddings"</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token comment"># 执行混合搜索：</span>
result <span class="token operator">=</span> hello_milvus<span class="token punctuation">.</span>search<span class="token punctuation">(</span>vectors_to_search<span class="token punctuation">,</span> <span class="token string">"embeddings"</span><span class="token punctuation">,</span> search_params<span class="token punctuation">,</span> limit<span class="token operator">=</span><span class="token number">3</span><span class="token punctuation">,</span> expr<span class="token operator">=</span><span class="token string">"random > -12"</span><span class="token punctuation">,</span> output_fields<span class="token operator">=</span><span class="token punctuation">[</span><span class="token string">"random"</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token comment"># 按主键删除实体：</span>
expr <span class="token operator">=</span> <span class="token string-interpolation"><span class="token string">f"pk in [</span><span class="token interpolation"><span class="token punctuation">{</span>ids<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">}</span></span><span class="token string">, </span><span class="token interpolation"><span class="token punctuation">{</span>ids<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">}</span></span><span class="token string">]"</span></span>
hello_milvus<span class="token punctuation">.</span>delete<span class="token punctuation">(</span>expr<span class="token punctuation">)</span>
<span class="token comment"># 删除集合：</span>
utility<span class="token punctuation">.</span>drop_collection<span class="token punctuation">(</span><span class="token string">"hello_milvus"</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="三、以图搜图的实现" tabindex="-1"><a class="header-anchor" href="#三、以图搜图的实现" aria-hidden="true">#</a> 三、以图搜图的实现：</h1>
<p>以图搜图的含义是用一张图片搜索与其相似的图片并进行展示，训练集用来训练，每一张图片用VGG16提取特征值并存入milvus数据库。存储VGG16对每张图进行模型建立，将每张图的数据进行存储模型数据，并存储当前图片的路径<br>
当使用web页面显示搜图网页，用户点击文件上传之后,走相同的VGG16模型建立，从数据库中搜索最相似的图片。当用户拿测试集图片进行比对，会走相同的VGG16模型提取特征值，并利用欧式距离计算相似度。</p>
<p>项目完整地址：<a href="https://gitee.com/zhengtianqi/learn-samples/tree/master/pic-search" target="_blank" rel="noopener noreferrer">https://gitee.com/zhengtianqi/learn-samples/tree/master/pic-search<ExternalLinkIcon/></a></p>
<h2 id="_1、建立图片模型-采用vgg16模型" tabindex="-1"><a class="header-anchor" href="#_1、建立图片模型-采用vgg16模型" aria-hidden="true">#</a> 1、建立图片模型，采用VGG16模型</h2>
<div class="language-python line-numbers-mode" data-ext="py"><pre v-pre class="language-python"><code><span class="token comment"># -*- coding: utf-8 -*-</span>
<span class="token keyword">import</span> keras
<span class="token keyword">import</span> numpy <span class="token keyword">as</span> np
<span class="token keyword">from</span> numpy <span class="token keyword">import</span> linalg <span class="token keyword">as</span> LA

<span class="token keyword">from</span> keras<span class="token punctuation">.</span>applications<span class="token punctuation">.</span>vgg16 <span class="token keyword">import</span> VGG16
<span class="token keyword">from</span> keras<span class="token punctuation">.</span>preprocessing <span class="token keyword">import</span> image
<span class="token keyword">from</span> keras<span class="token punctuation">.</span>applications<span class="token punctuation">.</span>vgg16 <span class="token keyword">import</span> preprocess_input


<span class="token keyword">class</span> <span class="token class-name">VGGNet</span><span class="token punctuation">:</span>
    <span class="token keyword">def</span> <span class="token function">__init__</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">:</span>
        keras<span class="token punctuation">.</span>backend<span class="token punctuation">.</span>clear_session<span class="token punctuation">(</span><span class="token punctuation">)</span>
        self<span class="token punctuation">.</span>input_shape <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token number">224</span><span class="token punctuation">,</span> <span class="token number">224</span><span class="token punctuation">,</span> <span class="token number">3</span><span class="token punctuation">)</span>
        self<span class="token punctuation">.</span>weight <span class="token operator">=</span> <span class="token string">'imagenet'</span>
        self<span class="token punctuation">.</span>pooling <span class="token operator">=</span> <span class="token string">'max'</span>
        self<span class="token punctuation">.</span>model <span class="token operator">=</span> VGG16<span class="token punctuation">(</span>weights<span class="token operator">=</span>self<span class="token punctuation">.</span>weight<span class="token punctuation">,</span>
                           input_shape<span class="token operator">=</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>input_shape<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">,</span> self<span class="token punctuation">.</span>input_shape<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">,</span> self<span class="token punctuation">.</span>input_shape<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                           pooling<span class="token operator">=</span>self<span class="token punctuation">.</span>pooling<span class="token punctuation">,</span> include_top<span class="token operator">=</span><span class="token boolean">False</span><span class="token punctuation">)</span>
        self<span class="token punctuation">.</span>model<span class="token punctuation">.</span>predict<span class="token punctuation">(</span>np<span class="token punctuation">.</span>zeros<span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">224</span><span class="token punctuation">,</span> <span class="token number">224</span><span class="token punctuation">,</span> <span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>

    <span class="token triple-quoted-string string">'''
    Use vgg16 model to extract features
    Output normalized feature vector
    '''</span>
    <span class="token keyword">def</span> <span class="token function">extract_feat</span><span class="token punctuation">(</span>self<span class="token punctuation">,</span> img_path<span class="token punctuation">)</span><span class="token punctuation">:</span>
        img <span class="token operator">=</span> image<span class="token punctuation">.</span>image_utils<span class="token punctuation">.</span>load_img<span class="token punctuation">(</span>img_path<span class="token punctuation">,</span> target_size<span class="token operator">=</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>input_shape<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">,</span> self<span class="token punctuation">.</span>input_shape<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
        img <span class="token operator">=</span> image<span class="token punctuation">.</span>image_utils<span class="token punctuation">.</span>img_to_array<span class="token punctuation">(</span>img<span class="token punctuation">)</span>

        img <span class="token operator">=</span> np<span class="token punctuation">.</span>expand_dims<span class="token punctuation">(</span>img<span class="token punctuation">,</span> axis<span class="token operator">=</span><span class="token number">0</span><span class="token punctuation">)</span>
        img <span class="token operator">=</span> preprocess_input<span class="token punctuation">(</span>img<span class="token punctuation">)</span>
        feat <span class="token operator">=</span> self<span class="token punctuation">.</span>model<span class="token punctuation">.</span>predict<span class="token punctuation">(</span>img<span class="token punctuation">)</span>
        norm_feat <span class="token operator">=</span> feat<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span> <span class="token operator">/</span> LA<span class="token punctuation">.</span>norm<span class="token punctuation">(</span>feat<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
        <span class="token keyword">return</span> norm_feat
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_2、建立集合实体" tabindex="-1"><a class="header-anchor" href="#_2、建立集合实体" aria-hidden="true">#</a> 2、建立集合实体</h2>
<div class="language-python line-numbers-mode" data-ext="py"><pre v-pre class="language-python"><code><span class="token keyword">from</span> pymilvus <span class="token keyword">import</span> CollectionSchema<span class="token punctuation">,</span> FieldSchema<span class="token punctuation">,</span> DataType
<span class="token keyword">from</span> pymilvus <span class="token keyword">import</span> Collection
<span class="token keyword">from</span> pymilvus <span class="token keyword">import</span> utility

<span class="token keyword">from</span> utils<span class="token punctuation">.</span>Connect <span class="token keyword">import</span> connect

pic_id <span class="token operator">=</span> FieldSchema<span class="token punctuation">(</span>
    name<span class="token operator">=</span><span class="token string">"pic_id"</span><span class="token punctuation">,</span>
    dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>INT64<span class="token punctuation">,</span>
    is_primary<span class="token operator">=</span><span class="token boolean">True</span><span class="token punctuation">,</span>
<span class="token punctuation">)</span>
pic_name <span class="token operator">=</span> FieldSchema<span class="token punctuation">(</span>
    name<span class="token operator">=</span><span class="token string">"pic_name"</span><span class="token punctuation">,</span>
    dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>VARCHAR<span class="token punctuation">,</span>
    max_length<span class="token operator">=</span><span class="token number">1200</span><span class="token punctuation">,</span>
<span class="token punctuation">)</span>
pic_url <span class="token operator">=</span> FieldSchema<span class="token punctuation">(</span>
    name<span class="token operator">=</span><span class="token string">"pic_url"</span><span class="token punctuation">,</span>
    dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>VARCHAR<span class="token punctuation">,</span>
    max_length<span class="token operator">=</span><span class="token number">1200</span><span class="token punctuation">,</span>
<span class="token punctuation">)</span>
pic_price <span class="token operator">=</span> FieldSchema<span class="token punctuation">(</span>
    name<span class="token operator">=</span><span class="token string">"pic_price"</span><span class="token punctuation">,</span>
    dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>VARCHAR<span class="token punctuation">,</span>
    max_length<span class="token operator">=</span><span class="token number">1200</span><span class="token punctuation">,</span>
<span class="token punctuation">)</span>
pic_vector <span class="token operator">=</span> FieldSchema<span class="token punctuation">(</span>
    name<span class="token operator">=</span><span class="token string">"pic_vector"</span><span class="token punctuation">,</span>
    dtype<span class="token operator">=</span>DataType<span class="token punctuation">.</span>FLOAT_VECTOR<span class="token punctuation">,</span>
    dim<span class="token operator">=</span><span class="token number">512</span>
<span class="token punctuation">)</span>
schema <span class="token operator">=</span> CollectionSchema<span class="token punctuation">(</span>
    fields<span class="token operator">=</span><span class="token punctuation">[</span>pic_id<span class="token punctuation">,</span> pic_name<span class="token punctuation">,</span> pic_url<span class="token punctuation">,</span> pic_price<span class="token punctuation">,</span> pic_vector<span class="token punctuation">]</span><span class="token punctuation">,</span>
    description<span class="token operator">=</span><span class="token string">"Test pic search"</span>
<span class="token punctuation">)</span>
collection_name <span class="token operator">=</span> <span class="token string">"pic"</span>


<span class="token keyword">def</span> <span class="token function">create_collection</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    connect<span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">if</span> utility<span class="token punctuation">.</span>has_collection<span class="token punctuation">(</span>collection_name<span class="token punctuation">)</span><span class="token punctuation">:</span>
        utility<span class="token punctuation">.</span>drop_collection<span class="token punctuation">(</span>collection_name<span class="token punctuation">)</span>
    collection <span class="token operator">=</span> Collection<span class="token punctuation">(</span>
        name<span class="token operator">=</span>collection_name<span class="token punctuation">,</span>
        schema<span class="token operator">=</span>schema<span class="token punctuation">,</span>
        using<span class="token operator">=</span><span class="token string">'default'</span><span class="token punctuation">,</span>
        shards_num<span class="token operator">=</span><span class="token number">2</span><span class="token punctuation">,</span>
    <span class="token punctuation">)</span>
    collection<span class="token punctuation">.</span>release<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_3、训练数据" tabindex="-1"><a class="header-anchor" href="#_3、训练数据" aria-hidden="true">#</a> 3、训练数据</h2>
<div class="language-python line-numbers-mode" data-ext="py"><pre v-pre class="language-python"><code><span class="token keyword">import</span> os
<span class="token keyword">from</span> time <span class="token keyword">import</span> <span class="token operator">*</span>
<span class="token keyword">from</span> PIL <span class="token keyword">import</span> Image <span class="token keyword">as</span> Im

<span class="token keyword">from</span> dao<span class="token punctuation">.</span>PicDao <span class="token keyword">import</span> insertBatch
<span class="token keyword">from</span> service<span class="token punctuation">.</span>create_collection <span class="token keyword">import</span> create_collection
<span class="token keyword">from</span> utils<span class="token punctuation">.</span>VggNet <span class="token keyword">import</span> VGGNet

<span class="token keyword">def</span> <span class="token function">IsValidImage</span><span class="token punctuation">(</span>pathfile<span class="token punctuation">)</span><span class="token punctuation">:</span>
    bValid <span class="token operator">=</span> <span class="token boolean">True</span>
    <span class="token keyword">try</span><span class="token punctuation">:</span>
        Im<span class="token punctuation">.</span><span class="token builtin">open</span><span class="token punctuation">(</span>pathfile<span class="token punctuation">)</span><span class="token punctuation">.</span>verify<span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">except</span><span class="token punctuation">:</span>
        bValid <span class="token operator">=</span> <span class="token boolean">False</span>
    <span class="token keyword">return</span> bValid

<span class="token keyword">def</span> <span class="token function">train</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">:</span>
    begin_time <span class="token operator">=</span> time<span class="token punctuation">(</span><span class="token punctuation">)</span>
    vgg <span class="token operator">=</span> VGGNet<span class="token punctuation">(</span><span class="token punctuation">)</span>
    create_collection<span class="token punctuation">(</span><span class="token punctuation">)</span>

    data <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    pic_id <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    pic_name <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    pic_url <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    pic_price <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    pic_vector <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>

    cnt <span class="token operator">=</span> <span class="token number">1</span>
    <span class="token keyword">for</span> root<span class="token punctuation">,</span> dirs<span class="token punctuation">,</span> files <span class="token keyword">in</span> os<span class="token punctuation">.</span>walk<span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">:</span>
        <span class="token keyword">for</span> <span class="token builtin">file</span> <span class="token keyword">in</span> files<span class="token punctuation">:</span>
            path <span class="token operator">=</span> os<span class="token punctuation">.</span>path<span class="token punctuation">.</span>join<span class="token punctuation">(</span>root<span class="token punctuation">,</span> <span class="token builtin">file</span><span class="token punctuation">)</span>
            <span class="token keyword">if</span> IsValidImage<span class="token punctuation">(</span>path<span class="token punctuation">)</span><span class="token punctuation">:</span>
                vector <span class="token operator">=</span> vgg<span class="token punctuation">.</span>extract_feat<span class="token punctuation">(</span>path<span class="token punctuation">)</span>
                pic_id<span class="token punctuation">.</span>append<span class="token punctuation">(</span>cnt<span class="token punctuation">)</span>
                pic_name<span class="token punctuation">.</span>append<span class="token punctuation">(</span><span class="token builtin">file</span><span class="token punctuation">)</span>
                pic_url<span class="token punctuation">.</span>append<span class="token punctuation">(</span>path<span class="token punctuation">)</span>
                pic_price<span class="token punctuation">.</span>append<span class="token punctuation">(</span><span class="token string">"100"</span><span class="token punctuation">)</span>
                pic_vector<span class="token punctuation">.</span>append<span class="token punctuation">(</span>vector<span class="token punctuation">)</span>
                cnt <span class="token operator">+=</span> <span class="token number">1</span>
    data<span class="token punctuation">.</span>insert<span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> pic_id<span class="token punctuation">)</span>
    data<span class="token punctuation">.</span>insert<span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> pic_name<span class="token punctuation">)</span>
    data<span class="token punctuation">.</span>insert<span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">,</span> pic_url<span class="token punctuation">)</span>
    data<span class="token punctuation">.</span>insert<span class="token punctuation">(</span><span class="token number">3</span><span class="token punctuation">,</span> pic_price<span class="token punctuation">)</span>
    data<span class="token punctuation">.</span>insert<span class="token punctuation">(</span><span class="token number">4</span><span class="token punctuation">,</span> pic_vector<span class="token punctuation">)</span>
    insertBatch<span class="token punctuation">(</span>data<span class="token punctuation">)</span>

    end_time <span class="token operator">=</span> time<span class="token punctuation">(</span><span class="token punctuation">)</span>
    run_time <span class="token operator">=</span> end_time <span class="token operator">-</span> begin_time
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">'该循环程序运行时间：'</span><span class="token punctuation">,</span> run_time<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="_4、搜索相似图片" tabindex="-1"><a class="header-anchor" href="#_4、搜索相似图片" aria-hidden="true">#</a> 4、搜索相似图片</h2>
<div class="language-python line-numbers-mode" data-ext="py"><pre v-pre class="language-python"><code><span class="token keyword">from</span> PreApp <span class="token keyword">import</span> base_dir
<span class="token keyword">from</span> dao<span class="token punctuation">.</span>PicDao <span class="token keyword">import</span> selectByIds
<span class="token keyword">from</span> service<span class="token punctuation">.</span>create_collection <span class="token keyword">import</span> collection_name<span class="token punctuation">,</span> schema
<span class="token keyword">from</span> utils<span class="token punctuation">.</span>Connect <span class="token keyword">import</span> connect
<span class="token keyword">from</span> utils<span class="token punctuation">.</span>VggNet <span class="token keyword">import</span> VGGNet
<span class="token keyword">from</span> pymilvus <span class="token keyword">import</span> Collection


<span class="token keyword">def</span> <span class="token function">search_pic</span><span class="token punctuation">(</span>path<span class="token punctuation">)</span><span class="token punctuation">:</span>
    vgg <span class="token operator">=</span> VGGNet<span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span>path<span class="token punctuation">)</span>
    test_vectors <span class="token operator">=</span> vgg<span class="token punctuation">.</span>extract_feat<span class="token punctuation">(</span>path<span class="token punctuation">)</span>
    <span class="token comment"># 涉及的向量6个数</span>
    search_params <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token string">"metric_type"</span><span class="token punctuation">:</span> <span class="token string">"L2"</span><span class="token punctuation">,</span> <span class="token string">"params"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token string">"nprobe"</span><span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
    connect<span class="token punctuation">(</span><span class="token punctuation">)</span>
    collection <span class="token operator">=</span> Collection<span class="token punctuation">(</span>collection_name<span class="token punctuation">)</span>
    collection<span class="token punctuation">.</span>load<span class="token punctuation">(</span><span class="token punctuation">)</span>
    results <span class="token operator">=</span> collection<span class="token punctuation">.</span>search<span class="token punctuation">(</span>
        data<span class="token operator">=</span><span class="token punctuation">[</span>test_vectors<span class="token punctuation">]</span><span class="token punctuation">,</span>
        anns_field<span class="token operator">=</span><span class="token string">"pic_vector"</span><span class="token punctuation">,</span>
        param<span class="token operator">=</span>search_params<span class="token punctuation">,</span>
        limit<span class="token operator">=</span><span class="token number">10</span><span class="token punctuation">,</span>
        expr<span class="token operator">=</span><span class="token boolean">None</span><span class="token punctuation">,</span>
        consistency_level<span class="token operator">=</span><span class="token string">"Strong"</span>
    <span class="token punctuation">)</span>

    collection<span class="token punctuation">.</span>release<span class="token punctuation">(</span><span class="token punctuation">)</span>
    result <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    ids <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    <span class="token keyword">for</span> t <span class="token keyword">in</span> results<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">:</span>
        <span class="token builtin">dict</span> <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span>
        <span class="token builtin">dict</span><span class="token punctuation">[</span><span class="token string">'id'</span><span class="token punctuation">]</span> <span class="token operator">=</span> t<span class="token punctuation">.</span><span class="token builtin">id</span>
        <span class="token builtin">dict</span><span class="token punctuation">[</span><span class="token string">'distance'</span><span class="token punctuation">]</span> <span class="token operator">=</span> t<span class="token punctuation">.</span>distance
        result<span class="token punctuation">.</span>append<span class="token punctuation">(</span><span class="token builtin">dict</span><span class="token punctuation">)</span>
        ids<span class="token punctuation">.</span>append<span class="token punctuation">(</span><span class="token builtin">str</span><span class="token punctuation">(</span>t<span class="token punctuation">.</span><span class="token builtin">id</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
    res <span class="token operator">=</span> selectByIds<span class="token punctuation">(</span>ids<span class="token punctuation">)</span>
    <span class="token keyword">for</span> t <span class="token keyword">in</span> result<span class="token punctuation">:</span>
        <span class="token keyword">for</span> s <span class="token keyword">in</span> res<span class="token punctuation">:</span>
            <span class="token keyword">if</span> s<span class="token punctuation">[</span><span class="token string">'pic_id'</span><span class="token punctuation">]</span> <span class="token operator">==</span> t<span class="token punctuation">[</span><span class="token string">'id'</span><span class="token punctuation">]</span><span class="token punctuation">:</span>
                t<span class="token punctuation">[</span><span class="token string">'name'</span><span class="token punctuation">]</span> <span class="token operator">=</span> s<span class="token punctuation">[</span><span class="token string">'pic_name'</span><span class="token punctuation">]</span>
                t<span class="token punctuation">[</span><span class="token string">'pic_price'</span><span class="token punctuation">]</span> <span class="token operator">=</span> s<span class="token punctuation">[</span><span class="token string">'pic_price'</span><span class="token punctuation">]</span>
                t<span class="token punctuation">[</span><span class="token string">'pic_url'</span><span class="token punctuation">]</span> <span class="token operator">=</span> s<span class="token punctuation">[</span><span class="token string">'pic_name'</span><span class="token punctuation">]</span>
    <span class="token keyword">return</span> result


<span class="token keyword">if</span> __name__ <span class="token operator">==</span> <span class="token string">'__main__'</span><span class="token punctuation">:</span>
    search_pic<span class="token punctuation">(</span><span class="token string">"E:\zhengtianqi\git\search-for-pictures\data2\ILSVRC2012_img_val\cat.91.jpg"</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>结果：<br>
<img src="/assets/images/ytst0.png" alt="img" loading="lazy"><br>
<img src="/assets/images/ytst.png" alt="img" loading="lazy"></p>
</div></template>


