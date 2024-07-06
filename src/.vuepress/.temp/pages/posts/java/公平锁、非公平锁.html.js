export const data = JSON.parse("{\"key\":\"v-4ae6cd47\",\"path\":\"/posts/java/%E5%85%AC%E5%B9%B3%E9%94%81%E3%80%81%E9%9D%9E%E5%85%AC%E5%B9%B3%E9%94%81.html\",\"title\":\"公平锁、非公平锁\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"公平锁、非公平锁\",\"author\":\"郑天祺\",\"tag\":[\"锁\"],\"category\":[\"java基础\"],\"date\":\"2019-08-31T13:21:00.000Z\",\"description\":\"1、概念： ​ 公平锁：加锁前先查看是否有排队等待的线程，有的话优先处理排在前面的线程，先来先得。 ​ 公平所：线程加锁时直接尝试获取锁，获取不到就自动到队尾等待。 ​ 更多的是直接使用非公平锁：非公平锁比公平锁性能高5-10倍，因为公平锁需要在多核情况下维护一个队列，如果当前线程不是队列的第一个无法获取锁，增加了线程切换次数。 ​ 原理 ： https://www.cnblogs.com/little-fly/p/10365109.html\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/java/%E5%85%AC%E5%B9%B3%E9%94%81%E3%80%81%E9%9D%9E%E5%85%AC%E5%B9%B3%E9%94%81.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"公平锁、非公平锁\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"1、概念： ​ 公平锁：加锁前先查看是否有排队等待的线程，有的话优先处理排在前面的线程，先来先得。 ​ 公平所：线程加锁时直接尝试获取锁，获取不到就自动到队尾等待。 ​ 更多的是直接使用非公平锁：非公平锁比公平锁性能高5-10倍，因为公平锁需要在多核情况下维护一个队列，如果当前线程不是队列的第一个无法获取锁，增加了线程切换次数。 ​ 原理 ： https://www.cnblogs.com/little-fly/p/10365109.html\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"锁\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2019-08-31T13:21:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"公平锁、非公平锁\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2019-08-31T13:21:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":0.76,\"words\":228},\"filePathRelative\":\"posts/java/公平锁、非公平锁.md\",\"localizedDate\":\"2019年8月31日\",\"excerpt\":\"<p>1、概念：</p>\\n<p>​        公平锁：加锁前先查看是否有排队等待的线程，有的话优先处理排在前面的线程，先来先得。<br>\\n​        公平所：线程加锁时直接尝试获取锁，获取不到就自动到队尾等待。</p>\\n<p>​        更多的是直接使用非公平锁：非公平锁比公平锁性能高5-10倍，因为公平锁需要在多核情况下维护一个队列，如果当前线程不是队列的第一个无法获取锁，增加了线程切换次数。</p>\\n<p>​        原理 ： <a href=\\\"https://www.cnblogs.com/little-fly/p/10365109.html\\\" target=\\\"_blank\\\" rel=\\\"noopener noreferrer\\\">https://www.cnblogs.com/little-fly/p/10365109.html</a></p>\",\"autoDesc\":true}")

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
