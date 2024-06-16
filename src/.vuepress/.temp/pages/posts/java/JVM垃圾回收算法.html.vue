<template><div><h1 id="_1、标记-清除-算法" tabindex="-1"><a class="header-anchor" href="#_1、标记-清除-算法" aria-hidden="true">#</a> 1、标记 - 清除 算法</h1>
<p>​	标记无用对象，然后进行清除回收。</p>
<p>​	缺点：效率不高，无法清除垃圾碎片。</p>
<figure><img src="/assets/images/jvm1.png" alt="image-20200918092639589" tabindex="0" loading="lazy"><figcaption>image-20200918092639589</figcaption></figure>
<h1 id="_2、复制-清除-算法" tabindex="-1"><a class="header-anchor" href="#_2、复制-清除-算法" aria-hidden="true">#</a> 2、复制 - 清除 算法</h1>
<p>​	按照容量划分二个大小相等的内存区域，每次使用其中的一块。当这一块的内存使用完后，就将还存活的对象复制到另一块去，然后再把使用的空间一次清理掉。这样就使每次的内存回收都是对内存区间的一半进行回收。</p>
<p>​	缺点：内存使用率不高，只有原来的一半</p>
<figure><img src="/assets/images/jvm2.png" alt="image-20200918092729361" tabindex="0" loading="lazy"><figcaption>image-20200918092729361</figcaption></figure>
<h1 id="_3、标记-整理-清除-算法" tabindex="-1"><a class="header-anchor" href="#_3、标记-整理-清除-算法" aria-hidden="true">#</a> 3、标记 - 整理 - 清除 算法</h1>
<p>​	标记无用对象，让所有存活的对象都向一端移动，然后直接清除掉端边界以外的内存</p>
<figure><img src="/assets/images/jvm3.png" alt="image-20200918092801239" tabindex="0" loading="lazy"><figcaption>image-20200918092801239</figcaption></figure>
<h1 id="_4、分代-收集算法" tabindex="-1"><a class="header-anchor" href="#_4、分代-收集算法" aria-hidden="true">#</a> 4、分代 - 收集算法</h1>
<p>​		根据对象存活周期的不同将内存划分为几块，一般是新生代和老年代；</p>
<p>​		新生代基本采用复制算法;</p>
<p>​		老年代采用标记整理算法。</p>
<h1 id="_5、分代-收集算法详解" tabindex="-1"><a class="header-anchor" href="#_5、分代-收集算法详解" aria-hidden="true">#</a> 5、分代 - 收集算法详解</h1>
<p>​	新生代：朝生夕灭的对象（例如：方法的局部变量引用的对象等）。</p>
<p>​    老年代：存活得比较久，但还是要死的对象（例如：缓存对象、单例对象等）。</p>
<p>​    永久代：对象生成后几乎不灭的对象（例如：加载过的类信息）。</p>
<figure><img src="/assets/images/jvmHeapStructure.png" alt="image-20200918094003026" tabindex="0" loading="lazy"><figcaption>image-20200918094003026</figcaption></figure>
<p>·································································</p>
<p>堆大小 = 新生代 + 老年代</p>
<p>新生代与老年代的比例 = 1：2</p>
</div></template>


