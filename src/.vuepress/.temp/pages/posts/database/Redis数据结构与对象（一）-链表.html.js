export const data = JSON.parse("{\"key\":\"v-44ec5644\",\"path\":\"/posts/database/Redis%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E5%AF%B9%E8%B1%A1%EF%BC%88%E4%B8%80%EF%BC%89-%E9%93%BE%E8%A1%A8.html\",\"title\":\"Redis数据结构与对象（二）-链表\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"Redis数据结构与对象（二）-链表\",\"author\":\"ztq\",\"tag\":[\"redis\"],\"category\":[\"数据库\"],\"date\":\"2022-01-23T16:18:00.000Z\",\"description\":\"链表提供了高效的节点重排能力，以及顺序性的节点访问方式，并且可以通过增删节点来灵活地调整链表的长度。 作为一种常用数据结构，链表内置在很多高级的编程语言里面，因为 Redis 使用的 C 语言并没有内置这种数据结构，所以 Redis 构建了自己的链表实现。 链表在 Redis 中的应用非常广泛，比如列表键的底层实现之一就是链表：当一个列表键包含了数量比较多的元素，又或者列表中包含的元素都是比较长的字符串时，Redis 就会使用链表作为列表键的底层实现。 举个例子，以下展示的 integers 列表键包含了从 1 到 1024 共一千零二十四个整数：\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/database/Redis%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E5%AF%B9%E8%B1%A1%EF%BC%88%E4%B8%80%EF%BC%89-%E9%93%BE%E8%A1%A8.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"Redis数据结构与对象（二）-链表\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"链表提供了高效的节点重排能力，以及顺序性的节点访问方式，并且可以通过增删节点来灵活地调整链表的长度。 作为一种常用数据结构，链表内置在很多高级的编程语言里面，因为 Redis 使用的 C 语言并没有内置这种数据结构，所以 Redis 构建了自己的链表实现。 链表在 Redis 中的应用非常广泛，比如列表键的底层实现之一就是链表：当一个列表键包含了数量比较多的元素，又或者列表中包含的元素都是比较长的字符串时，Redis 就会使用链表作为列表键的底层实现。 举个例子，以下展示的 integers 列表键包含了从 1 到 1024 共一千零二十四个整数：\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"ztq\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"redis\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2022-01-23T16:18:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"Redis数据结构与对象（二）-链表\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2022-01-23T16:18:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"ztq\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"链表和链表节点的实现\",\"slug\":\"链表和链表节点的实现\",\"link\":\"#链表和链表节点的实现\",\"children\":[]},{\"level\":2,\"title\":\"链表和链表节点的 API\",\"slug\":\"链表和链表节点的-api\",\"link\":\"#链表和链表节点的-api\",\"children\":[]},{\"level\":2,\"title\":\"回顾\",\"slug\":\"回顾\",\"link\":\"#回顾\",\"children\":[]}],\"readingTime\":{\"minutes\":4.18,\"words\":1254},\"filePathRelative\":\"posts/database/Redis数据结构与对象（一）-链表.md\",\"localizedDate\":\"2022年1月24日\",\"excerpt\":\"<p>链表提供了高效的节点重排能力，以及顺序性的节点访问方式，并且可以通过增删节点来灵活地调整链表的长度。</p>\\n<p>作为一种常用数据结构，链表内置在很多高级的编程语言里面，因为 Redis 使用的 C 语言并没有内置这种数据结构，所以 Redis 构建了自己的链表实现。</p>\\n<p>链表在 Redis 中的应用非常广泛，比如列表键的底层实现之一就是链表：当一个列表键包含了数量比较多的元素，又或者列表中包含的元素都是比较长的字符串时，Redis 就会使用链表作为列表键的底层实现。</p>\\n<p>举个例子，以下展示的 <code>integers</code> 列表键包含了从 <code>1</code> 到 <code>1024</code> 共一千零二十四个整数：</p>\",\"autoDesc\":true}")

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
