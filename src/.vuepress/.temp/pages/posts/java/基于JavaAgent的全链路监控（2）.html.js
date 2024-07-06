export const data = JSON.parse("{\"key\":\"v-7eb8f6d3\",\"path\":\"/posts/java/%E5%9F%BA%E4%BA%8EJavaAgent%E7%9A%84%E5%85%A8%E9%93%BE%E8%B7%AF%E7%9B%91%E6%8E%A7%EF%BC%882%EF%BC%89.html\",\"title\":\"基于JavaAgent的全链路监控（2）\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"基于JavaAgent的全链路监控（2）\",\"author\":\"郑天祺\",\"tag\":[\"javaagent\"],\"category\":[\"java基础\"],\"date\":\"2020-07-19T16:54:00.000Z\",\"description\":\"《利用javaagent进行方法耗时的监控》 1、介绍 ​\\t\\t方法耗时利用前人轮子字节码操作工具ByteBuddy：Byte Buddy是一个代码生成和操作库，用于在Java应用程序运行时创建和修改Java类，而无需编译器的帮助。 除了Java类库附带的代码生成实用程序外，Byte Buddy还允许创建任意类，并且不限于实现用于创建运行时代理的接口。 此外，Byte Buddy提供了一个方便的API，可以使用Java代理或在构建过程中手动更改类。 2、pom.xml 引入ByteBuddy并打入到Agent包中\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/%E5%9F%BA%E4%BA%8EJavaAgent%E7%9A%84%E5%85%A8%E9%93%BE%E8%B7%AF%E7%9B%91%E6%8E%A7%EF%BC%882%EF%BC%89.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"基于JavaAgent的全链路监控（2）\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"《利用javaagent进行方法耗时的监控》 1、介绍 ​\\t\\t方法耗时利用前人轮子字节码操作工具ByteBuddy：Byte Buddy是一个代码生成和操作库，用于在Java应用程序运行时创建和修改Java类，而无需编译器的帮助。 除了Java类库附带的代码生成实用程序外，Byte Buddy还允许创建任意类，并且不限于实现用于创建运行时代理的接口。 此外，Byte Buddy提供了一个方便的API，可以使用Java代理或在构建过程中手动更改类。 2、pom.xml 引入ByteBuddy并打入到Agent包中\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"javaagent\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2020-07-19T16:54:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"基于JavaAgent的全链路监控（2）\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2020-07-19T16:54:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"1、介绍\",\"slug\":\"_1、介绍\",\"link\":\"#_1、介绍\",\"children\":[]},{\"level\":2,\"title\":\"2、pom.xml\",\"slug\":\"_2、pom-xml\",\"link\":\"#_2、pom-xml\",\"children\":[]},{\"level\":2,\"title\":\"3、MethodCostTime.java\",\"slug\":\"_3、methodcosttime-java\",\"link\":\"#_3、methodcosttime-java\",\"children\":[]},{\"level\":2,\"title\":\"4、MyAgent.java\",\"slug\":\"_4、myagent-java\",\"link\":\"#_4、myagent-java\",\"children\":[]},{\"level\":2,\"title\":\"5、MANIFEST.MF\",\"slug\":\"_5、manifest-mf\",\"link\":\"#_5、manifest-mf\",\"children\":[]},{\"level\":2,\"title\":\"6、测试\",\"slug\":\"_6、测试\",\"link\":\"#_6、测试\",\"children\":[]}],\"readingTime\":{\"minutes\":2.51,\"words\":752},\"filePathRelative\":\"posts/java/基于JavaAgent的全链路监控（2）.md\",\"localizedDate\":\"2020年7月20日\",\"excerpt\":\"<h1> 《利用javaagent进行方法耗时的监控》</h1>\\n<h2> 1、介绍</h2>\\n<p>​\\t\\t方法耗时利用前人轮子字节码操作工具ByteBuddy：Byte Buddy是一个代码生成和操作库，用于在Java应用程序运行时创建和修改Java类，而无需编译器的帮助。 除了Java类库附带的代码生成实用程序外，Byte Buddy还允许创建任意类，并且不限于实现用于创建运行时代理的接口。 此外，Byte Buddy提供了一个方便的API，可以使用Java代理或在构建过程中手动更改类。</p>\\n<h2> 2、pom.xml</h2>\\n<p>引入ByteBuddy并打入到Agent包中</p>\",\"autoDesc\":true}")

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
