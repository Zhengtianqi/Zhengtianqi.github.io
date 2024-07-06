export const data = JSON.parse("{\"key\":\"v-66cd05be\",\"path\":\"/posts/java/JVM%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E6%95%B4%E7%90%86.html\",\"title\":\"JVM性能优化整理\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"JVM性能优化整理\",\"author\":\"郑天祺\",\"tag\":[],\"category\":[\"面试\"],\"date\":\"2020-11-17T15:14:00.000Z\",\"description\":\"1、类加载过程 ​\\t\\tJava语言是一种具有动态性的解释型语言，类(Class)只有被加载到JVM后才能运行。当运行指定程序时，JVM会将编译生成的.class文件按照需求和一定的规则加载到内存中，并组织成为一个完整的Java应用程序。 ​\\t\\t这个加载过程是由类加载器完成，具体来说，就是由ClassLoader和它的子类来实现的。类加载器本身也是一个类，其实质是把类文件从硬盘读取到内存中。 ​\\t\\t类的加载方式分为隐式加载和显示加载。隐式加载指的是程序在使用new等方式创建对象时，会隐式地调用类的加载器把对应的类加载到JVM中。显示加载指的是通过直接调用class.forName()方法来把所需的类加载到JVM中。\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/JVM%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E6%95%B4%E7%90%86.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"JVM性能优化整理\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"1、类加载过程 ​\\t\\tJava语言是一种具有动态性的解释型语言，类(Class)只有被加载到JVM后才能运行。当运行指定程序时，JVM会将编译生成的.class文件按照需求和一定的规则加载到内存中，并组织成为一个完整的Java应用程序。 ​\\t\\t这个加载过程是由类加载器完成，具体来说，就是由ClassLoader和它的子类来实现的。类加载器本身也是一个类，其实质是把类文件从硬盘读取到内存中。 ​\\t\\t类的加载方式分为隐式加载和显示加载。隐式加载指的是程序在使用new等方式创建对象时，会隐式地调用类的加载器把对应的类加载到JVM中。显示加载指的是通过直接调用class.forName()方法来把所需的类加载到JVM中。\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2020-11-17T15:14:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"JVM性能优化整理\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2020-11-17T15:14:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":6.03,\"words\":1810},\"filePathRelative\":\"posts/java/JVM性能优化整理.md\",\"localizedDate\":\"2020年11月17日\",\"excerpt\":\"<p>1、类加载过程</p>\\n<p>​\\t\\tJava语言是一种具有动态性的解释型语言，类(Class)只有被加载到JVM后才能运行。当运行指定程序时，JVM会将编译生成的.class文件按照需求和一定的规则加载到内存中，并组织成为一个完整的Java应用程序。</p>\\n<p>​\\t\\t这个加载过程是由类加载器完成，具体来说，就是由ClassLoader和它的子类来实现的。类加载器本身也是一个类，其实质是把类文件从硬盘读取到内存中。</p>\\n<p>​\\t\\t类的加载方式分为隐式加载和显示加载。隐式加载指的是程序在使用new等方式创建对象时，会隐式地调用类的加载器把对应的类加载到JVM中。显示加载指的是通过直接调用class.forName()方法来把所需的类加载到JVM中。</p>\",\"autoDesc\":true}")

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
