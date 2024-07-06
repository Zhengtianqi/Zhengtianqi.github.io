export const data = JSON.parse("{\"key\":\"v-059090ba\",\"path\":\"/posts/DevOps/k8s%E6%9E%84%E5%BB%BAELK%E6%97%A5%E5%BF%97%E5%B9%B3%E5%8F%B0.html\",\"title\":\"k8s构建ELK日志平台\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"k8s构建ELK日志平台\",\"author\":\"ztq\",\"tag\":[\"k8s\",\"elk\"],\"category\":[\"CICD\"],\"date\":\"2021-04-13T14:40:00.000Z\",\"description\":\"k8s构建ELK日志平台 Pod中附加专用日志收集的容器 一、概述 目前主流日志收集系统为：Filebeat + ELK，本文尝试使用该系统对k8s里部署的Pod进行日志收集并加以图形可视化展示； 日志收集方案设计图 img 二、优缺点 每个预应用程序的Pod中增加一个日志收集容器，使用emptyDir共享日志目录，让日志收集程序能够读取到。\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/DevOps/k8s%E6%9E%84%E5%BB%BAELK%E6%97%A5%E5%BF%97%E5%B9%B3%E5%8F%B0.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"k8s构建ELK日志平台\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"k8s构建ELK日志平台 Pod中附加专用日志收集的容器 一、概述 目前主流日志收集系统为：Filebeat + ELK，本文尝试使用该系统对k8s里部署的Pod进行日志收集并加以图形可视化展示； 日志收集方案设计图 img 二、优缺点 每个预应用程序的Pod中增加一个日志收集容器，使用emptyDir共享日志目录，让日志收集程序能够读取到。\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"ztq\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"k8s\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"elk\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2021-04-13T14:40:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"k8s构建ELK日志平台\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2021-04-13T14:40:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"ztq\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"Pod中附加专用日志收集的容器\",\"slug\":\"pod中附加专用日志收集的容器\",\"link\":\"#pod中附加专用日志收集的容器\",\"children\":[]},{\"level\":2,\"title\":\"3.1 安装JDK\",\"slug\":\"_3-1-安装jdk\",\"link\":\"#_3-1-安装jdk\",\"children\":[]},{\"level\":2,\"title\":\"3.2 配置yum源\",\"slug\":\"_3-2-配置yum源\",\"link\":\"#_3-2-配置yum源\",\"children\":[]},{\"level\":2,\"title\":\"3.3 安装ELK\",\"slug\":\"_3-3-安装elk\",\"link\":\"#_3-3-安装elk\",\"children\":[]},{\"level\":2,\"title\":\"3.4 ELK相关配置\",\"slug\":\"_3-4-elk相关配置\",\"link\":\"#_3-4-elk相关配置\",\"children\":[{\"level\":3,\"title\":\"配置ES：\",\"slug\":\"配置es\",\"link\":\"#配置es\",\"children\":[]},{\"level\":3,\"title\":\"运行：\",\"slug\":\"运行\",\"link\":\"#运行\",\"children\":[]},{\"level\":3,\"title\":\"配置kibana：\",\"slug\":\"配置kibana\",\"link\":\"#配置kibana\",\"children\":[]}]},{\"level\":2,\"title\":\"3.5 启动ES和Kibana\",\"slug\":\"_3-5-启动es和kibana\",\"link\":\"#_3-5-启动es和kibana\",\"children\":[]},{\"level\":2,\"title\":\"4.1 部署Filebeat日志收集客户端\",\"slug\":\"_4-1-部署filebeat日志收集客户端\",\"link\":\"#_4-1-部署filebeat日志收集客户端\",\"children\":[{\"level\":3,\"title\":\"4.1.1 编写Filebeat配置文件\",\"slug\":\"_4-1-1-编写filebeat配置文件\",\"link\":\"#_4-1-1-编写filebeat配置文件\",\"children\":[]},{\"level\":3,\"title\":\"4.1.2 上传Filebeat配置文件\",\"slug\":\"_4-1-2-上传filebeat配置文件\",\"link\":\"#_4-1-2-上传filebeat配置文件\",\"children\":[]},{\"level\":3,\"title\":\"4.1.3 上传Filebeat配置文件是否成功\",\"slug\":\"_4-1-3-上传filebeat配置文件是否成功\",\"link\":\"#_4-1-3-上传filebeat配置文件是否成功\",\"children\":[]},{\"level\":3,\"title\":\"4.1.4 创建/修改pod，更新项目配置文件\",\"slug\":\"_4-1-4-创建-修改pod-更新项目配置文件\",\"link\":\"#_4-1-4-创建-修改pod-更新项目配置文件\",\"children\":[]}]},{\"level\":2,\"title\":\"4.2 配置Logstash接收日志\",\"slug\":\"_4-2-配置logstash接收日志\",\"link\":\"#_4-2-配置logstash接收日志\",\"children\":[{\"level\":3,\"title\":\"4.2.1 配置logstash配置文件\",\"slug\":\"_4-2-1-配置logstash配置文件\",\"link\":\"#_4-2-1-配置logstash配置文件\",\"children\":[]},{\"level\":3,\"title\":\"4.2.2 启动/重启logstash\",\"slug\":\"_4-2-2-启动-重启logstash\",\"link\":\"#_4-2-2-启动-重启logstash\",\"children\":[]},{\"level\":3,\"title\":\"4.2.3 logstash部署是否成功\",\"slug\":\"_4-2-3-logstash部署是否成功\",\"link\":\"#_4-2-3-logstash部署是否成功\",\"children\":[]}]},{\"level\":2,\"title\":\"5.1 配置Kibana展示日志\",\"slug\":\"_5-1-配置kibana展示日志\",\"link\":\"#_5-1-配置kibana展示日志\",\"children\":[]},{\"level\":2,\"title\":\"5.2 查看kibana日志\",\"slug\":\"_5-2-查看kibana日志\",\"link\":\"#_5-2-查看kibana日志\",\"children\":[]},{\"level\":2,\"title\":\"5.3 绘制kibana图表\",\"slug\":\"_5-3-绘制kibana图表\",\"link\":\"#_5-3-绘制kibana图表\",\"children\":[]}],\"readingTime\":{\"minutes\":5.07,\"words\":1521},\"filePathRelative\":\"posts/DevOps/k8s构建ELK日志平台.md\",\"localizedDate\":\"2021年4月13日\",\"excerpt\":\"<h1> k8s构建ELK日志平台</h1>\\n<h2> Pod中附加专用日志收集的容器</h2>\\n<h1> 一、概述</h1>\\n<p>目前主流日志收集系统为：Filebeat + ELK，本文尝试使用该系统对k8s里部署的Pod进行日志收集并加以图形可视化展示；</p>\\n<p>日志收集方案设计图</p>\\n<figure><img src=\\\"/assets/images/70db7f87.jpg\\\" alt=\\\"img\\\" tabindex=\\\"0\\\" loading=\\\"lazy\\\"><figcaption>img</figcaption></figure>\\n<h1> 二、优缺点</h1>\\n<p>每个预应用程序的Pod中增加一个日志收集容器，使用emptyDir共享日志目录，让日志收集程序能够读取到。</p>\",\"autoDesc\":true}")

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
