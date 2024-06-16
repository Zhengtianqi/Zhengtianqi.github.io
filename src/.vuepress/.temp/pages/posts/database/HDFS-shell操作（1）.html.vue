<template><div><h2 id="_1、创建一个hdfs目录" tabindex="-1"><a class="header-anchor" href="#_1、创建一个hdfs目录" aria-hidden="true">#</a> 1、创建一个HDFS目录</h2>
<p>命令：hdfs dfs -mkdir -p /usr/local/hadoop/data/txtdir</p>
<p>截图：<img src="/assets/images/hdfs创建文件夹.png" alt="image-20201206115218466" loading="lazy"></p>
<h2 id="_2、本地文件上传到hdfs" tabindex="-1"><a class="header-anchor" href="#_2、本地文件上传到hdfs" aria-hidden="true">#</a> 2、本地文件上传到HDFS</h2>
<p>本地创建文件a.txt,b.txt,c.txt上传到HDFS /usr/local/hadoop/data/txtdir</p>
<p>命令：echo “I am student” &gt; a.txt</p>
<p>​       echo “I am teacher” &gt; c.txt</p>
<p>​       echo “I like hadoop” &gt; b.txt</p>
<p>​       hdfs dfs -put a.txt /usr/local/hadoop/data/txtdir</p>
<p>​       hdfs dfs -copyFromLocal b.txt /usr/local/hadoop/data/txtdir</p>
<p>​       hdfs dfs -moveFromLocal c.txt /usr/local/hadoop/data/txtdir</p>
<p>截图：<img src="/assets/images/HDFS上传.png" alt="image-20201206115351845" loading="lazy"></p>
<h2 id="_3、查看-usr-local-hadoop-data-txtdir目录结构" tabindex="-1"><a class="header-anchor" href="#_3、查看-usr-local-hadoop-data-txtdir目录结构" aria-hidden="true">#</a> 3、查看/usr/local/hadoop/data/txtdir目录结构</h2>
<p>命令：hdfs dfs -ls -R /usr/local/hadoop/data/txtdir</p>
<p>截图：</p>
<figure><img src="/assets/images/image-20201206115459406.png" alt="image-20201206115459406" tabindex="0" loading="lazy"><figcaption>image-20201206115459406</figcaption></figure>
<h2 id="_4、查看hdfs上-usr-local-hadoop-data-txtdir下的文件内容" tabindex="-1"><a class="header-anchor" href="#_4、查看hdfs上-usr-local-hadoop-data-txtdir下的文件内容" aria-hidden="true">#</a> 4、查看HDFS上/usr/local/hadoop/data/txtdir下的文件内容</h2>
<p>命令：hdfs dfs -cat /usr/local/hadoop/data/txtdir/a.txt</p>
<p>​       hdfs dfs -cat /usr/local/hadoop/data/txtdir/b.txt</p>
<p>​       hdfs dfs -cat /usr/local/hadoop/data/txtdir/c.txt</p>
<p>截图：<img src="/assets/images/image-20201206115600801.png" alt="image-20201206115600801" loading="lazy"></p>
<h2 id="_5、合并本地多个小文件上传到hdfs" tabindex="-1"><a class="header-anchor" href="#_5、合并本地多个小文件上传到hdfs" aria-hidden="true">#</a> 5、合并本地多个小文件上传到HDFS</h2>
<p>命令：hdfs dfs -appendToFile a.txt b.txt /usr/local/hadoop/data/txtdir/merges.txt</p>
<p>截图：<img src="/assets/images/image-20201206115653987.png" alt="image-20201206115653987" loading="lazy"></p>
<h2 id="_6、-下载a-txt到本地文件系统" tabindex="-1"><a class="header-anchor" href="#_6、-下载a-txt到本地文件系统" aria-hidden="true">#</a> 6、 下载a.txt到本地文件系统</h2>
<p>命令：hdfs dfs -get /usr/local/hadoop/data/txtdir/a.txt</p>
<p>截图：<img src="/assets/images/image-20201206115738831.png" alt="image-20201206115738831" loading="lazy"></p>
<h2 id="_7、删除hdfs上的-usr-local-hadoop-data-txtdir" tabindex="-1"><a class="header-anchor" href="#_7、删除hdfs上的-usr-local-hadoop-data-txtdir" aria-hidden="true">#</a> 7、删除HDFS上的/usr/local/hadoop/data/txtdir</h2>
<p>命令：hdfs dfs -rm -r /usr/local/hadoop/data/txtdir/</p>
<p>截图：<img src="/assets/images/image-20201206115832025.png" alt="image-20201206115832025" loading="lazy"></p>
</div></template>


