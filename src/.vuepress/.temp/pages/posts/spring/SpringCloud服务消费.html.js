export const data = JSON.parse("{\"key\":\"v-9f58c1c2\",\"path\":\"/posts/spring/SpringCloud%E6%9C%8D%E5%8A%A1%E6%B6%88%E8%B4%B9.html\",\"title\":\"SpringCloud服务消费\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"SpringCloud服务消费\",\"author\":\"郑天祺\",\"tag\":[\"SpringCloud\"],\"category\":[],\"date\":\"2020-12-14T11:32:00.000Z\",\"description\":\"基于Alibaba Nacos Spring Cloud（服务发现）、Spring Cloud OpenFeign（声明式调用，同时整合了熔断器、负载均衡） 1、pom.xml添加starter依赖 \\t\\t&lt;!-- Nacos服务发现 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-alibaba-nacos-discovery&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt; &lt;!-- 声明式调用 --&gt; &lt;dependency&gt; &lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; &lt;artifactId&gt;spring-cloud-starter-openfeign&lt;/artifactId&gt; &lt;/dependency&gt; \\t\\t&lt;!-- 负载均衡 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-netflix-ribbon&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt; \\t\\t&lt;!-- 熔断器 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-netflix-hystrix&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt;\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/spring/SpringCloud%E6%9C%8D%E5%8A%A1%E6%B6%88%E8%B4%B9.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"SpringCloud服务消费\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"基于Alibaba Nacos Spring Cloud（服务发现）、Spring Cloud OpenFeign（声明式调用，同时整合了熔断器、负载均衡） 1、pom.xml添加starter依赖 \\t\\t&lt;!-- Nacos服务发现 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-alibaba-nacos-discovery&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt; &lt;!-- 声明式调用 --&gt; &lt;dependency&gt; &lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; &lt;artifactId&gt;spring-cloud-starter-openfeign&lt;/artifactId&gt; &lt;/dependency&gt; \\t\\t&lt;!-- 负载均衡 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-netflix-ribbon&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt; \\t\\t&lt;!-- 熔断器 --&gt; \\t\\t&lt;dependency&gt; \\t\\t\\t&lt;groupId&gt;org.springframework.cloud&lt;/groupId&gt; \\t\\t\\t&lt;artifactId&gt;spring-cloud-starter-netflix-hystrix&lt;/artifactId&gt; \\t\\t&lt;/dependency&gt;\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"郑天祺\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"SpringCloud\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2020-12-14T11:32:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"SpringCloud服务消费\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2020-12-14T11:32:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"郑天祺\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":1.56,\"words\":468},\"filePathRelative\":\"posts/spring/SpringCloud服务消费.md\",\"localizedDate\":\"2020年12月14日\",\"excerpt\":\"<p>基于Alibaba Nacos Spring Cloud（服务发现）、Spring Cloud OpenFeign（声明式调用，同时整合了熔断器、负载均衡）</p>\\n<h1> 1、pom.xml添加starter依赖</h1>\\n<div class=\\\"language-java line-numbers-mode\\\" data-ext=\\\"java\\\"><pre class=\\\"language-java\\\"><code>\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">!</span><span class=\\\"token operator\\\">--</span> <span class=\\\"token class-name\\\">Nacos</span>服务发现 <span class=\\\"token operator\\\">--</span><span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>dependency<span class=\\\"token punctuation\\\">&gt;</span></span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>groupId<span class=\\\"token punctuation\\\">&gt;</span></span>org<span class=\\\"token punctuation\\\">.</span>springframework<span class=\\\"token punctuation\\\">.</span>cloud<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>groupId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>artifactId<span class=\\\"token punctuation\\\">&gt;</span></span>spring<span class=\\\"token operator\\\">-</span>cloud<span class=\\\"token operator\\\">-</span>starter<span class=\\\"token operator\\\">-</span>alibaba<span class=\\\"token operator\\\">-</span>nacos<span class=\\\"token operator\\\">-</span>discovery<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>artifactId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>dependency<span class=\\\"token operator\\\">&gt;</span>\\n        <span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">!</span><span class=\\\"token operator\\\">--</span> 声明式调用 <span class=\\\"token operator\\\">--</span><span class=\\\"token operator\\\">&gt;</span>\\n        <span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>dependency<span class=\\\"token punctuation\\\">&gt;</span></span>\\n            <span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>groupId<span class=\\\"token punctuation\\\">&gt;</span></span>org<span class=\\\"token punctuation\\\">.</span>springframework<span class=\\\"token punctuation\\\">.</span>cloud<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>groupId<span class=\\\"token operator\\\">&gt;</span>\\n            <span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>artifactId<span class=\\\"token punctuation\\\">&gt;</span></span>spring<span class=\\\"token operator\\\">-</span>cloud<span class=\\\"token operator\\\">-</span>starter<span class=\\\"token operator\\\">-</span>openfeign<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>artifactId<span class=\\\"token operator\\\">&gt;</span>\\n        <span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>dependency<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">!</span><span class=\\\"token operator\\\">--</span> 负载均衡 <span class=\\\"token operator\\\">--</span><span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>dependency<span class=\\\"token punctuation\\\">&gt;</span></span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>groupId<span class=\\\"token punctuation\\\">&gt;</span></span>org<span class=\\\"token punctuation\\\">.</span>springframework<span class=\\\"token punctuation\\\">.</span>cloud<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>groupId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>artifactId<span class=\\\"token punctuation\\\">&gt;</span></span>spring<span class=\\\"token operator\\\">-</span>cloud<span class=\\\"token operator\\\">-</span>starter<span class=\\\"token operator\\\">-</span>netflix<span class=\\\"token operator\\\">-</span>ribbon<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>artifactId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>dependency<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">!</span><span class=\\\"token operator\\\">--</span> 熔断器 <span class=\\\"token operator\\\">--</span><span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>dependency<span class=\\\"token punctuation\\\">&gt;</span></span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>groupId<span class=\\\"token punctuation\\\">&gt;</span></span>org<span class=\\\"token punctuation\\\">.</span>springframework<span class=\\\"token punctuation\\\">.</span>cloud<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>groupId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t\\t<span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span>artifactId<span class=\\\"token punctuation\\\">&gt;</span></span>spring<span class=\\\"token operator\\\">-</span>cloud<span class=\\\"token operator\\\">-</span>starter<span class=\\\"token operator\\\">-</span>netflix<span class=\\\"token operator\\\">-</span>hystrix<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>artifactId<span class=\\\"token operator\\\">&gt;</span>\\n\\t\\t<span class=\\\"token operator\\\">&lt;</span><span class=\\\"token operator\\\">/</span>dependency<span class=\\\"token operator\\\">&gt;</span>\\n</code></pre><div class=\\\"line-numbers\\\" aria-hidden=\\\"true\\\"><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div></div></div>\",\"autoDesc\":true}")

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
