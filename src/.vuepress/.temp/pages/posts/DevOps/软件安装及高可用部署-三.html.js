export const data = JSON.parse("{\"key\":\"v-ae9e19a4\",\"path\":\"/posts/DevOps/%E8%BD%AF%E4%BB%B6%E5%AE%89%E8%A3%85%E5%8F%8A%E9%AB%98%E5%8F%AF%E7%94%A8%E9%83%A8%E7%BD%B2-%E4%B8%89.html\",\"title\":\"软件安装及高可用部署(三)\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"软件安装及高可用部署(三)\",\"author\":\"ztq\",\"tag\":[\"运维\"],\"category\":[\"CICD\"],\"date\":\"2022-11-16T10:36:00.000Z\",\"description\":\"本文介绍了MYSQL安装 一、卸载mariadb # 查看 mariadb 的安装包 rpm -qa | grep mariadb # 卸载 mariadb 的安装包 rpm -e mariadb-libs-5.5.68-1.el7.x86_64 --nodeps # 再次查看 rpm -qa | grep mariadb\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://zhengtianqi.gitee.io/posts/DevOps/%E8%BD%AF%E4%BB%B6%E5%AE%89%E8%A3%85%E5%8F%8A%E9%AB%98%E5%8F%AF%E7%94%A8%E9%83%A8%E7%BD%B2-%E4%B8%89.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"郑天祺的博客\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"软件安装及高可用部署(三)\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"本文介绍了MYSQL安装 一、卸载mariadb # 查看 mariadb 的安装包 rpm -qa | grep mariadb # 卸载 mariadb 的安装包 rpm -e mariadb-libs-5.5.68-1.el7.x86_64 --nodeps # 再次查看 rpm -qa | grep mariadb\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"ztq\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"运维\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2022-11-16T10:36:00.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"软件安装及高可用部署(三)\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2022-11-16T10:36:00.000Z\\\",\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"ztq\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"安装源\",\"slug\":\"安装源\",\"link\":\"#安装源\",\"children\":[]},{\"level\":2,\"title\":\"MySQL安装版本选择\",\"slug\":\"mysql安装版本选择\",\"link\":\"#mysql安装版本选择\",\"children\":[]},{\"level\":2,\"title\":\"MySQL安装\",\"slug\":\"mysql安装\",\"link\":\"#mysql安装\",\"children\":[]},{\"level\":2,\"title\":\"默认路径的密码（未修改配置文件）\",\"slug\":\"默认路径的密码-未修改配置文件\",\"link\":\"#默认路径的密码-未修改配置文件\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-master服务器，主库修改配置文件 vim /etc/my.cnf 。\",\"slug\":\"登录mysql-master服务器-主库修改配置文件-vim-etc-my-cnf-。\",\"link\":\"#登录mysql-master服务器-主库修改配置文件-vim-etc-my-cnf-。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-master服务器，先进入主库，进行锁表，防止数据写入。\",\"slug\":\"登录mysql-master服务器-先进入主库-进行锁表-防止数据写入。\",\"link\":\"#登录mysql-master服务器-先进入主库-进行锁表-防止数据写入。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-backup服务器，修改从库数据库配置文件。\",\"slug\":\"登录mysql-backup服务器-修改从库数据库配置文件。\",\"link\":\"#登录mysql-backup服务器-修改从库数据库配置文件。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-master服务器，导出数据。\",\"slug\":\"登录mysql-master服务器-导出数据。\",\"link\":\"#登录mysql-master服务器-导出数据。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-backup服务器，导入数据。\",\"slug\":\"登录mysql-backup服务器-导入数据。\",\"link\":\"#登录mysql-backup服务器-导入数据。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-master服务器，登录数据库查看主库同步信息。\",\"slug\":\"登录mysql-master服务器-登录数据库查看主库同步信息。\",\"link\":\"#登录mysql-master服务器-登录数据库查看主库同步信息。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-backup服务器，登录数据库配置同步信息。\",\"slug\":\"登录mysql-backup服务器-登录数据库配置同步信息。\",\"link\":\"#登录mysql-backup服务器-登录数据库配置同步信息。\",\"children\":[]},{\"level\":2,\"title\":\"登录mysql-master服务器，解除锁表。\",\"slug\":\"登录mysql-master服务器-解除锁表。\",\"link\":\"#登录mysql-master服务器-解除锁表。\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-master服务器上修改keepalived配置文件。\",\"slug\":\"在mysql-master服务器上修改keepalived配置文件。\",\"link\":\"#在mysql-master服务器上修改keepalived配置文件。\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-master服务器上创建检测脚本。\",\"slug\":\"在mysql-master服务器上创建检测脚本。\",\"link\":\"#在mysql-master服务器上创建检测脚本。\",\"children\":[]},{\"level\":2,\"title\":\"为检测脚本添加可执行权限。\",\"slug\":\"为检测脚本添加可执行权限。\",\"link\":\"#为检测脚本添加可执行权限。\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-master服务器上验证虚拟IP是否绑定。\",\"slug\":\"在mysql-master服务器上验证虚拟ip是否绑定。\",\"link\":\"#在mysql-master服务器上验证虚拟ip是否绑定。\",\"children\":[]},{\"level\":2,\"title\":\"MySQL从库配置\",\"slug\":\"mysql从库配置\",\"link\":\"#mysql从库配置\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-backup服务器上修改keepalived配置文件。\",\"slug\":\"在mysql-backup服务器上修改keepalived配置文件。\",\"link\":\"#在mysql-backup服务器上修改keepalived配置文件。\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-backup服务器上创建检测脚本。\",\"slug\":\"在mysql-backup服务器上创建检测脚本。\",\"link\":\"#在mysql-backup服务器上创建检测脚本。\",\"children\":[]},{\"level\":2,\"title\":\"为检测脚本添加可执行权限。\",\"slug\":\"为检测脚本添加可执行权限。-1\",\"link\":\"#为检测脚本添加可执行权限。-1\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-backup服务器上创建处理脚本。\",\"slug\":\"在mysql-backup服务器上创建处理脚本。\",\"link\":\"#在mysql-backup服务器上创建处理脚本。\",\"children\":[]},{\"level\":2,\"title\":\"为处理脚本添加可执行权限。\",\"slug\":\"为处理脚本添加可执行权限。\",\"link\":\"#为处理脚本添加可执行权限。\",\"children\":[]},{\"level\":2,\"title\":\"在mysql-backup服务器上验证虚拟IP是否绑定，从库是否升级为主库。\",\"slug\":\"在mysql-backup服务器上验证虚拟ip是否绑定-从库是否升级为主库。\",\"link\":\"#在mysql-backup服务器上验证虚拟ip是否绑定-从库是否升级为主库。\",\"children\":[]},{\"level\":2,\"title\":\"恢复从库数据到主库\",\"slug\":\"恢复从库数据到主库\",\"link\":\"#恢复从库数据到主库\",\"children\":[]}],\"readingTime\":{\"minutes\":7.25,\"words\":2176},\"filePathRelative\":\"posts/DevOps/软件安装及高可用部署-三.md\",\"localizedDate\":\"2022年11月16日\",\"excerpt\":\"<p>本文介绍了MYSQL安装</p>\\n<h1> 一、卸载mariadb</h1>\\n<div class=\\\"language-java line-numbers-mode\\\" data-ext=\\\"java\\\"><pre class=\\\"language-java\\\"><code># 查看 mariadb 的安装包\\nrpm <span class=\\\"token operator\\\">-</span>qa <span class=\\\"token operator\\\">|</span> grep mariadb\\n# 卸载 mariadb 的安装包\\nrpm <span class=\\\"token operator\\\">-</span>e mariadb<span class=\\\"token operator\\\">-</span>libs<span class=\\\"token operator\\\">-</span><span class=\\\"token number\\\">5.5</span><span class=\\\"token number\\\">.68</span><span class=\\\"token operator\\\">-</span><span class=\\\"token number\\\">1.</span>el7<span class=\\\"token punctuation\\\">.</span>x86_64 <span class=\\\"token operator\\\">--</span>nodeps\\n# 再次查看\\nrpm <span class=\\\"token operator\\\">-</span>qa <span class=\\\"token operator\\\">|</span> grep mariadb\\n</code></pre><div class=\\\"line-numbers\\\" aria-hidden=\\\"true\\\"><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div></div></div>\",\"autoDesc\":true}")

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
