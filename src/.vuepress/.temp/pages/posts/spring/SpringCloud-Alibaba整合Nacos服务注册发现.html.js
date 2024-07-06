export const data = JSON.parse("{\"key\":\"v-333dedde\",\"path\":\"/posts/spring/SpringCloud-Alibaba%E6%95%B4%E5%90%88Nacos%E6%9C%8D%E5%8A%A1%E6%B3%A8%E5%86%8C%E5%8F%91%E7%8E%B0.html\",\"title\":\"SpringCloud-Alibaba整合Nacos服务注册发现\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"SpringCloud-Alibaba整合Nacos服务注册发现\",\"author\":\"郑天祺\",\"tag\":[\"SpringCloud\"],\"category\":[\"spring\"],\"date\":\"2019-12-03T15:18:00.000Z\",\"description\":\"一、服务注册 1、引入依赖 &lt;dependency&gt; &lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; &lt;artifactId&gt;spring-cloud-starter-alibaba-nacos-discovery&lt;/artifactId&gt; &lt;/dependency&gt;\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/spring/SpringCloud-Alibaba%E6%95%B4%E5%90%88Nacos%E6%9C%8D%E5%8A%A1%E6%B3%A8%E5%86%8C%E5%8F%91%E7%8E%B0.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"SpringCloud-Alibaba整合Nacos服务注册发现\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"一、服务注册 1、引入依赖 &lt;dependency&gt; &lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; &lt;artifactId&gt;spring-cloud-starter-alibaba-nacos-discovery&lt;/artifactId&gt; &lt;/dependency&gt;\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"SpringCloud\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2019-12-03T15:18:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"SpringCloud-Alibaba整合Nacos服务注册发现\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2019-12-03T15:18:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"1、引入依赖\",\"slug\":\"_1、引入依赖\",\"link\":\"#_1、引入依赖\",\"children\":[]},{\"level\":2,\"title\":\"2、配置application.yml\",\"slug\":\"_2、配置application-yml\",\"link\":\"#_2、配置application-yml\",\"children\":[]},{\"level\":2,\"title\":\"3、springboot启动类\",\"slug\":\"_3、springboot启动类\",\"link\":\"#_3、springboot启动类\",\"children\":[]},{\"level\":2,\"title\":\"4、确认注册成功\",\"slug\":\"_4、确认注册成功\",\"link\":\"#_4、确认注册成功\",\"children\":[]},{\"level\":2,\"title\":\"1、引入依赖\",\"slug\":\"_1、引入依赖-1\",\"link\":\"#_1、引入依赖-1\",\"children\":[]},{\"level\":2,\"title\":\"2、配置文件配置\",\"slug\":\"_2、配置文件配置\",\"link\":\"#_2、配置文件配置\",\"children\":[]},{\"level\":2,\"title\":\"3、开启服务发现、负载均衡、熔断器功能\",\"slug\":\"_3、开启服务发现、负载均衡、熔断器功能\",\"link\":\"#_3、开启服务发现、负载均衡、熔断器功能\",\"children\":[]},{\"level\":2,\"title\":\"4、创建服务代理类\",\"slug\":\"_4、创建服务代理类\",\"link\":\"#_4、创建服务代理类\",\"children\":[]},{\"level\":2,\"title\":\"5、创建Hystrix的断路器工厂类\",\"slug\":\"_5、创建hystrix的断路器工厂类\",\"link\":\"#_5、创建hystrix的断路器工厂类\",\"children\":[]},{\"level\":2,\"title\":\"6、通用代理类的实例进行服务调用，与本地调用无异。如下：\",\"slug\":\"_6、通用代理类的实例进行服务调用-与本地调用无异。如下\",\"link\":\"#_6、通用代理类的实例进行服务调用-与本地调用无异。如下\",\"children\":[]}],\"readingTime\":{\"minutes\":2.73,\"words\":820},\"filePathRelative\":\"posts/spring/SpringCloud-Alibaba整合Nacos服务注册发现.md\",\"localizedDate\":\"2019年12月3日\",\"excerpt\":\"<h1> 一、服务注册</h1>\\n<h2> 1、引入依赖</h2>\\n<div class=\\\"language-java line-numbers-mode\\\" data-ext=\\\"java\\\"><pre class=\\\"language-java\\\"><code><span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>dependency<span class=\\\"token punctuation\\\">&gt;</span></span>\\n    <span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>groupId<span class=\\\"token punctuation\\\">&gt;</span></span>org<span class=\\\"token punctuation\\\">.</span>springframework<span class=\\\"token punctuation\\\">.</span>cloud<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>groupId<span class=\\\"token operator\\\">&gt;</span>\\n    <span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>artifactId<span class=\\\"token punctuation\\\">&gt;</span></span>spring<span class=\\\"token operator\\\">-</span>cloud<span class=\\\"token operator\\\">-</span>starter<span class=\\\"token operator\\\">-</span>alibaba<span class=\\\"token operator\\\">-</span>nacos<span class=\\\"token operator\\\">-</span>discovery<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>artifactId<span class=\\\"token operator\\\">&gt;</span>\\n<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>dependency<span class=\\\"token operator\\\">&gt;</span>\\n</code></pre><div class=\\\"line-numbers\\\" aria-hidden=\\\"true\\\"><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div></div></div>\",\"autoDesc\":true}")

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
