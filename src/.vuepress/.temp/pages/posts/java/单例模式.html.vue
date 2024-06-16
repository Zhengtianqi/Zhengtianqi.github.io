<template><div><p>继之前的单例模式（<a href="https://blog.csdn.net/qq_23034755/article/details/90547215%EF%BC%89%E6%B7%B1%E5%85%A5%E5%AD%A6%E4%B9%A0%EF%BC%8C%E8%B6%8A%E7%9C%8B%E8%B6%8A%E5%AE%B9%E6%98%93%E4%B8%8D%E6%98%8E%E7%99%BD%E4%BA%86%5B%E5%93%AD%E5%93%AD%5D%EF%BC%9A" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/qq_23034755/article/details/90547215）深入学习，越看越容易不明白了[哭哭]：<ExternalLinkIcon/></a></p>
<p>一、单例优势与劣势</p>
<p>优点：</p>
<p>​		（1）可以节约内存，因为它限制了实例的个数，有利于Java垃圾回收。</p>
<p>​		（2）数据库或者Socket连接要收到一定的限制，必须保持同一时间只能有一个连接的存在等这种单线程操作。</p>
<p>​		（3）提供了对唯一实例的受控访问。</p>
<p>缺点：</p>
<p>​		（1）没有抽象层，不能继承扩展很难。<br>
​		（2）违背了“单一职责原则”，一个类只重视内部关系，而忽略外部关系。</p>
<p>​		（3）不适用于变化对象。</p>
<p>​		（4）滥用单例会出现一些负面问题：</p>
<p>a. 如为节省资源将数据库连接池对象设计为单例</p>
<p>可能会导致共享连接池对象对程序过多而出现连接池溢出。</p>
<p>b. 如果实例化的对象长时间不被利用</p>
<p>系统会认为是垃圾而被回收，这样将导致对象状态丢失。</p>
<p>二、单例模式与数据库连接（mysql为例，自己的理解）</p>
<p>​		（1）mysql是有最大连接数的，连接数超过最大会出现错误</p>
<p>​		（2）如果利用单例模式对connection对象封装，那么系统中只存在一个mysql连接实例，大家共用。所以没有办法并发，就存在了排队。</p>
<p>​		（3）排队希望教给mysql引擎去解决。</p>
<p>​		（4）后来为了获取更高的效率，利用数据库连接池（connection pool），连接池概念（<a href="https://zhengtianqi.github.io/2019/09/01/%E6%B1%A0%E5%8C%96%E4%B9%8B%E7%BA%BF%E7%A8%8B%E6%B1%A0/%EF%BC%89%E3%80%82" target="_blank" rel="noopener noreferrer">https://zhengtianqi.github.io/2019/09/01/池化之线程池/）。<ExternalLinkIcon/></a></p>
<p>​		（5）利用单例模式来管理connection pool，如：在初始化时创建100个connection对象（小于mysql最大连接数），然后需要的时候提供一个，用完之后返回到pool中。</p>
<p>​		（6）这个pool存在哪里呢？若为全局变量，又违背了单例模式的用意（单例模式只有真正的单一实例的需求时才可以使用。一个设计得当的系统不应该有所谓的全局变量的，这些变量应该放到它们所描述的实体所对应的类中去）</p>
</div></template>


