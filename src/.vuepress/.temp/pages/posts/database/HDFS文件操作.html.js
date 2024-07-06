export const data = JSON.parse("{\"key\":\"v-6129c42d\",\"path\":\"/posts/database/HDFS%E6%96%87%E4%BB%B6%E6%93%8D%E4%BD%9C.html\",\"title\":\"HDFS文件操作\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"HDFS文件操作\",\"author\":\"郑天祺\",\"tag\":[\"HDFS\",\"HADOOP\"],\"category\":[\"大数据\"],\"date\":\"2019-12-16T15:47:00.000Z\",\"description\":\"一、读文件 ​\\tHDFS有一个文件系统实例，客户端通过调用这个实例的open()方法就可以打开系统中希望读取的文件。 ​\\tHDFS通过RPC调用NameNode获取文件块的位置信息，对于文件的每一个块，NameNode会返回该块副本DataNode的节点地址。 ​\\t另外，客户端还会根据网络拓扑来确定它与每一个DataNode的位置信息，从离它最近的那个DataNode获取数据块的副本，最理想的情况是数据块就储存在客户端所在的节点上。 ​\\t具体过程： ​\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/database/HDFS%E6%96%87%E4%BB%B6%E6%93%8D%E4%BD%9C.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"HDFS文件操作\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"一、读文件 ​\\tHDFS有一个文件系统实例，客户端通过调用这个实例的open()方法就可以打开系统中希望读取的文件。 ​\\tHDFS通过RPC调用NameNode获取文件块的位置信息，对于文件的每一个块，NameNode会返回该块副本DataNode的节点地址。 ​\\t另外，客户端还会根据网络拓扑来确定它与每一个DataNode的位置信息，从离它最近的那个DataNode获取数据块的副本，最理想的情况是数据块就储存在客户端所在的节点上。 ​\\t具体过程： ​\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"HDFS\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"HADOOP\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2019-12-16T15:47:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"HDFS文件操作\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2019-12-16T15:47:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":4.13,\"words\":1239},\"filePathRelative\":\"posts/database/HDFS文件操作.md\",\"localizedDate\":\"2019年12月16日\",\"excerpt\":\"<h1> 一、读文件</h1>\\n<p>​\\tHDFS有一个文件系统实例，客户端通过调用这个实例的open()方法就可以打开系统中希望读取的文件。</p>\\n<p>​\\tHDFS通过RPC调用NameNode获取文件块的位置信息，对于文件的每一个块，NameNode会返回该块副本DataNode的节点地址。</p>\\n<p>​\\t另外，客户端还会根据网络拓扑来确定它与每一个DataNode的位置信息，从离它最近的那个DataNode获取数据块的副本，最理想的情况是数据块就储存在客户端所在的节点上。</p>\\n<p>​\\t具体过程：</p>\\n<p>​\\t<img src=\\\"/assets/images/hdfs-read-file.png\\\" alt=\\\"image-20191216155358635\\\" loading=\\\"lazy\\\"></p>\",\"autoDesc\":true}")

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
