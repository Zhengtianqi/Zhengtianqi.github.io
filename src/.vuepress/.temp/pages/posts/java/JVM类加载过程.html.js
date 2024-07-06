export const data = JSON.parse("{\"key\":\"v-2409ceb4\",\"path\":\"/posts/java/JVM%E7%B1%BB%E5%8A%A0%E8%BD%BD%E8%BF%87%E7%A8%8B.html\",\"title\":\"JVM类加载过程\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"JVM类加载过程\",\"author\":\"郑天祺\",\"tag\":[\"JVM\"],\"category\":[\"面试\"],\"date\":\"2020-09-27T11:08:00.000Z\",\"description\":\"0、图解 image-20200927113941669 image-20210807123832574\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/JVM%E7%B1%BB%E5%8A%A0%E8%BD%BD%E8%BF%87%E7%A8%8B.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"JVM类加载过程\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"0、图解 image-20200927113941669 image-20210807123832574\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"JVM\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2020-09-27T11:08:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"JVM类加载过程\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2020-09-27T11:08:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"（1）文件格式验证：\",\"slug\":\"_1-文件格式验证\",\"link\":\"#_1-文件格式验证\",\"children\":[]},{\"level\":2,\"title\":\"（2）元数据验证：\",\"slug\":\"_2-元数据验证\",\"link\":\"#_2-元数据验证\",\"children\":[]},{\"level\":2,\"title\":\"（3）字节码验证：\",\"slug\":\"_3-字节码验证\",\"link\":\"#_3-字节码验证\",\"children\":[]},{\"level\":2,\"title\":\"（4）符号引用验证：\",\"slug\":\"_4-符号引用验证\",\"link\":\"#_4-符号引用验证\",\"children\":[]}],\"readingTime\":{\"minutes\":3.8,\"words\":1141},\"filePathRelative\":\"posts/java/JVM类加载过程.md\",\"localizedDate\":\"2020年9月27日\",\"excerpt\":\"<h1> 0、图解</h1>\\n<figure><img src=\\\"/assets/images/JVM类加载过程.png\\\" alt=\\\"image-20200927113941669\\\" tabindex=\\\"0\\\" loading=\\\"lazy\\\"><figcaption>image-20200927113941669</figcaption></figure>\\n<figure><img src=\\\"/assets/images/image-20210807123832574.png\\\" alt=\\\"image-20210807123832574\\\" tabindex=\\\"0\\\" loading=\\\"lazy\\\"><figcaption>image-20210807123832574</figcaption></figure>\",\"autoDesc\":true}")

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
