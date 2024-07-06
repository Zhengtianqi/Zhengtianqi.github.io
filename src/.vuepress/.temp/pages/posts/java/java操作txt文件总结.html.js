export const data = JSON.parse("{\"key\":\"v-6039ae94\",\"path\":\"/posts/java/java%E6%93%8D%E4%BD%9Ctxt%E6%96%87%E4%BB%B6%E6%80%BB%E7%BB%93.html\",\"title\":\"java操作txt文件总结\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"java操作txt文件总结\",\"author\":\"ztq\",\"tag\":[\"java\",\"文件\"],\"category\":[\"java基础\"],\"date\":\"2022-09-14T09:53:00.000Z\",\"description\":\"1、介绍 （1）Java.io包 File类 这是Java中一个内置的包，专门用于文件读写的一个操作的类 在程序中使用 文件或者流的操作就要导入import java.io.*; File类可以表示一个文件，还可以表示一个目录（Directory），所以我们可以在程序中用File 类的对象可以表示一个文件 或者 目录 当创建了 File 对象之后，我们可以利用该对象来对文件或者目录进行书属性修改：例如：文件的名称，修改日期的日期等等 File 类的对象 还不能直接对文件进行读写操作，只能修改文件的属性\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/java%E6%93%8D%E4%BD%9Ctxt%E6%96%87%E4%BB%B6%E6%80%BB%E7%BB%93.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"java操作txt文件总结\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"1、介绍 （1）Java.io包 File类 这是Java中一个内置的包，专门用于文件读写的一个操作的类 在程序中使用 文件或者流的操作就要导入import java.io.*; File类可以表示一个文件，还可以表示一个目录（Directory），所以我们可以在程序中用File 类的对象可以表示一个文件 或者 目录 当创建了 File 对象之后，我们可以利用该对象来对文件或者目录进行书属性修改：例如：文件的名称，修改日期的日期等等 File 类的对象 还不能直接对文件进行读写操作，只能修改文件的属性\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"ztq\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"java\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"文件\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2022-09-14T09:53:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"java操作txt文件总结\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2022-09-14T09:53:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"ztq\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"（1）Java.io包\",\"slug\":\"_1-java-io包\",\"link\":\"#_1-java-io包\",\"children\":[{\"level\":3,\"title\":\"File类\",\"slug\":\"file类\",\"link\":\"#file类\",\"children\":[]}]},{\"level\":2,\"title\":\"（2）Stream流（字节流）\",\"slug\":\"_2-stream流-字节流\",\"link\":\"#_2-stream流-字节流\",\"children\":[{\"level\":3,\"title\":\"使用FileInputStream和FileOutputStream类\",\"slug\":\"使用fileinputstream和fileoutputstream类\",\"link\":\"#使用fileinputstream和fileoutputstream类\",\"children\":[]}]},{\"level\":2,\"title\":\"（3）Stream流（字符流）\",\"slug\":\"_3-stream流-字符流\",\"link\":\"#_3-stream流-字符流\",\"children\":[{\"level\":3,\"title\":\"FileWriter类 与 BufferedWriter类使用\",\"slug\":\"filewriter类-与-bufferedwriter类使用\",\"link\":\"#filewriter类-与-bufferedwriter类使用\",\"children\":[]},{\"level\":3,\"title\":\"FileReader和BufferedReader类使用\",\"slug\":\"filereader和bufferedreader类使用\",\"link\":\"#filereader和bufferedreader类使用\",\"children\":[]}]},{\"level\":2,\"title\":\"（4）序列化与反序列化\",\"slug\":\"_4-序列化与反序列化\",\"link\":\"#_4-序列化与反序列化\",\"children\":[{\"level\":3,\"title\":\"序列化利用FileOutputStream和ObjectOutputStream类\",\"slug\":\"序列化利用fileoutputstream和objectoutputstream类\",\"link\":\"#序列化利用fileoutputstream和objectoutputstream类\",\"children\":[]},{\"level\":3,\"title\":\"反序列化利用FileInputStream和ObjectInputStream类\",\"slug\":\"反序列化利用fileinputstream和objectinputstream类\",\"link\":\"#反序列化利用fileinputstream和objectinputstream类\",\"children\":[]}]},{\"level\":2,\"title\":\"（1）读取文件为流\",\"slug\":\"_1-读取文件为流\",\"link\":\"#_1-读取文件为流\",\"children\":[]},{\"level\":2,\"title\":\"（2）写入字节流到文件\",\"slug\":\"_2-写入字节流到文件\",\"link\":\"#_2-写入字节流到文件\",\"children\":[]},{\"level\":2,\"title\":\"（3）commons-io中用一行代码实现文件读写操作：\",\"slug\":\"_3-commons-io中用一行代码实现文件读写操作\",\"link\":\"#_3-commons-io中用一行代码实现文件读写操作\",\"children\":[]}],\"readingTime\":{\"minutes\":5.8,\"words\":1741},\"filePathRelative\":\"posts/java/java操作txt文件总结.md\",\"localizedDate\":\"2022年9月14日\",\"excerpt\":\"<h1> 1、介绍</h1>\\n<h2> （1）Java.io包</h2>\\n<h3> File类</h3>\\n<p>这是Java中一个内置的包，专门用于文件读写的一个操作的类<br>\\n在程序中使用 文件或者流的操作就要导入import <a href=\\\"http://java.io\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">java.io</a>.*;</p>\\n<p>File类可以表示一个文件，还可以表示一个目录（Directory），所以我们可以在程序中用File 类的对象可以表示一个文件 或者 目录<br>\\n当创建了 File 对象之后，我们可以利用该对象来对文件或者目录进行书属性修改：例如：文件的名称，修改日期的日期等等<br>\\nFile 类的对象 还不能直接对文件进行读写操作，只能修改文件的属性</p>\",\"autoDesc\":true}")

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
