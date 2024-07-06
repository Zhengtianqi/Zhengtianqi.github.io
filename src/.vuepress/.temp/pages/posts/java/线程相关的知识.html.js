export const data = JSON.parse("{\"key\":\"v-62a9a386\",\"path\":\"/posts/java/%E7%BA%BF%E7%A8%8B%E7%9B%B8%E5%85%B3%E7%9A%84%E7%9F%A5%E8%AF%86.html\",\"title\":\"线程相关的知识\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"线程相关的知识\",\"author\":\"郑天祺\",\"tag\":[\"线程\"],\"category\":[\"java基础\"],\"date\":\"2019-11-20T19:46:00.000Z\",\"description\":\"一、线程之间的通信机制 在命令式编程中：线程之间的通信机制有两种：共享内存和消息传递。 1）在共享内存的并发模型里，线程之间共享程序的公共状态，线程之间通过写-读内存中的公共状态来隐式进行通信。 2）在消息传递的并发模型里，线程之间没有公共状态，线程之间必须通过明确的发送消息来显示进行通信。 Java的并发采用的是共享内存模型，Java线程之间的通信总是隐式进行，整个通信过程对程序员完全透明。 简单例子： ​ 全局变量A，方法B和C都对A进行操作，B和C就可以利用A进行通讯。 二、JMM （JAVA 内存模型）\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/%E7%BA%BF%E7%A8%8B%E7%9B%B8%E5%85%B3%E7%9A%84%E7%9F%A5%E8%AF%86.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"线程相关的知识\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"一、线程之间的通信机制 在命令式编程中：线程之间的通信机制有两种：共享内存和消息传递。 1）在共享内存的并发模型里，线程之间共享程序的公共状态，线程之间通过写-读内存中的公共状态来隐式进行通信。 2）在消息传递的并发模型里，线程之间没有公共状态，线程之间必须通过明确的发送消息来显示进行通信。 Java的并发采用的是共享内存模型，Java线程之间的通信总是隐式进行，整个通信过程对程序员完全透明。 简单例子： ​ 全局变量A，方法B和C都对A进行操作，B和C就可以利用A进行通讯。 二、JMM （JAVA 内存模型）\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"线程\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2019-11-20T19:46:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"线程相关的知识\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2019-11-20T19:46:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":4.96,\"words\":1489},\"filePathRelative\":\"posts/java/线程相关的知识.md\",\"localizedDate\":\"2019年11月21日\",\"excerpt\":\"<h1> 一、线程之间的通信机制</h1>\\n<p>在命令式编程中：线程之间的通信机制有两种：共享内存和消息传递。</p>\\n<p>1）在共享内存的并发模型里，线程之间共享程序的公共状态，线程之间通过写-读内存中的公共状态来隐式进行通信。</p>\\n<p>2）在消息传递的并发模型里，线程之间没有公共状态，线程之间必须通过明确的发送消息来显示进行通信。</p>\\n<p>Java的并发采用的是共享内存模型，Java线程之间的通信总是隐式进行，整个通信过程对程序员完全透明。</p>\\n<p>简单例子：</p>\\n<p>​    全局变量A，方法B和C都对A进行操作，B和C就可以利用A进行通讯。</p>\\n<h1> 二、JMM （JAVA 内存模型）</h1>\",\"autoDesc\":true}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
