import type { DefaultTheme } from 'vitepress'

export const sidebar: DefaultTheme.Sidebar = {
  '/posts/': [
    {
      text: '产品与协作',
      collapsed: false,
      items: [
        { text: 'AI产品经理转型与实战指南', link: '/posts/产品与协作/AI产品经理转型与实战指南' },
        { text: '互联网大厂黑话大全', link: '/posts/产品与协作/互联网大厂黑话大全' },
        { text: '产品经理岗位全景解析', link: '/posts/产品与协作/产品经理岗位全景解析' },
        { text: '人天与工时计算方法论', link: '/posts/产品与协作/人天与工时计算方法论' },
        { text: '企业私有化大模型方法论', link: '/posts/产品与协作/企业私有化大模型方法论' },
        { text: '内容同质化时代平台靠什么活下来', link: '/posts/产品与协作/内容同质化时代平台靠什么活下来' },
        { text: '团队服务器资源分配方法论', link: '/posts/产品与协作/团队服务器资源分配方法论' },
        { text: '大模型收费政策分析', link: '/posts/产品与协作/大模型收费政策分析' },
        { text: '如何用数据驱动技术重构决策', link: '/posts/产品与协作/如何用数据驱动技术重构决策' },
        { text: '技术选型方法论', link: '/posts/产品与协作/技术选型方法论' },
        { text: '职场PUA话术与套路大全', link: '/posts/产品与协作/职场PUA话术与套路大全' },
        { text: '非暴力沟通', link: '/posts/产品与协作/非暴力沟通' }
      ]
    },
    {
      text: '刷题',
      collapsed: false,
      items: [
        { text: 'add-two-numbers', link: '/posts/刷题/add-two-numbers' },
        { text: 'longest-substring', link: '/posts/刷题/longest-substring' },
        { text: 'two-sum', link: '/posts/刷题/two-sum' },
        { text: '高频算法题型：二叉树遍历与重构', link: '/posts/刷题/高频算法题型：二叉树遍历与重构' },
        { text: '高频算法题型：动态规划三步法', link: '/posts/刷题/高频算法题型：动态规划三步法' },
        { text: '高频算法题型：双指针与滑动窗口', link: '/posts/刷题/高频算法题型：双指针与滑动窗口' },
        { text: '高频算法题型：排序与二分查找', link: '/posts/刷题/高频算法题型：排序与二分查找' }
      ]
    },
    {
      text: '基础知识',
      collapsed: false,
      items: [
        {
          text: 'Java',
          collapsed: true,
          items: [
            { text: 'BigDecimal', link: '/posts/基础知识/java/BigDecimal' },
            { text: 'Disruptor', link: '/posts/基础知识/java/Disruptor' },
            { text: 'IOC中的基本反射步骤', link: '/posts/基础知识/java/IOC中的基本反射步骤' },
            { text: 'JAVA数据类型', link: '/posts/基础知识/java/JAVA数据类型' },
            { text: 'JDK并发包常用类', link: '/posts/基础知识/java/JDK并发包常用类' },
            { text: 'JDK虚拟线程完全指南', link: '/posts/基础知识/java/JDK虚拟线程完全指南' },
            { text: 'Netty', link: '/posts/基础知识/java/Netty' },
            { text: 'ThreadLocal', link: '/posts/基础知识/java/ThreadLocal' },
            { text: 'java8新特性', link: '/posts/基础知识/java/java8新特性' },
            { text: 'java线程池队列问题', link: '/posts/基础知识/java/java线程池队列问题' },
            {
              text: 'JVM',
              collapsed: true,
              items: [
                { text: 'JVM内存结构', link: '/posts/基础知识/java/jvm/JVM内存结构' }
              ]
            },
            {
              text: '锁',
              collapsed: true,
              items: [
                { text: '互斥锁', link: '/posts/基础知识/java/锁/互斥锁' },
                { text: '偏向锁', link: '/posts/基础知识/java/锁/偏向锁' },
                { text: '可重入锁', link: '/posts/基础知识/java/锁/可重入锁' },
                { text: '悲观锁、乐观锁', link: '/posts/基础知识/java/锁/悲观锁、乐观锁' },
                { text: '自旋锁', link: '/posts/基础知识/java/锁/自旋锁' },
                { text: '读写锁', link: '/posts/基础知识/java/锁/读写锁' },
                { text: '轻量级锁', link: '/posts/基础知识/java/锁/轻量级锁' },
                { text: '锁粗化', link: '/posts/基础知识/java/锁/锁粗化' },
                { text: '阻塞锁', link: '/posts/基础知识/java/锁/阻塞锁' }
              ]
            }
          ]
        },
        {
          text: '分布式',
          collapsed: true,
          items: [
            { text: '分布式CAP概念', link: '/posts/基础知识/分布式/分布式CAP概念' },
            { text: '分布式锁', link: '/posts/基础知识/分布式/分布式锁' }
          ]
        },
        {
          text: '网络',
          collapsed: true,
          items: [
            { text: 'GET与POST区别', link: '/posts/基础知识/网络/GET与POST区别' },
            { text: 'HttpClient', link: '/posts/基础知识/网络/HttpClient' },
            { text: 'Http和Https的区别', link: '/posts/基础知识/网络/Http和Https的区别' },
            { text: 'TCP-IP四层网络模型', link: '/posts/基础知识/网络/TCP-IP四层网络模型' },
            { text: 'TCP与UDP的区别', link: '/posts/基础知识/网络/TCP与UDP的区别' },
            { text: 'TCP握手、挥手协议', link: '/posts/基础知识/网络/TCP握手、挥手协议' }
          ]
        },
        { text: 'Git梳理', link: '/posts/基础知识/Git梳理' },
        { text: 'Hash解决冲突的方法', link: '/posts/基础知识/Hash解决冲突的方法' },
        { text: 'Kafka的简单使用', link: '/posts/基础知识/Kafka的简单使用' },
        { text: 'Spark相关概述', link: '/posts/基础知识/Spark相关概述' },
        { text: 'Tomcat性能优化整理', link: '/posts/基础知识/Tomcat性能优化整理' },
        { text: 'WordCount简析', link: '/posts/基础知识/WordCount简析' },
        { text: 'Yarn概述', link: '/posts/基础知识/Yarn概述' },
        { text: 'maven梳理', link: '/posts/基础知识/maven梳理' },
        { text: '伪共享', link: '/posts/基础知识/伪共享' },
        { text: '公平锁、非公平锁', link: '/posts/基础知识/公平锁、非公平锁' },
        { text: '加密解密', link: '/posts/基础知识/加密解密' },
        { text: '单例模式', link: '/posts/基础知识/单例模式' },
        { text: '可信与可信计算', link: '/posts/基础知识/可信与可信计算' },
        { text: '可信基本概念', link: '/posts/基础知识/可信基本概念' },
        { text: '可靠性和容错技术', link: '/posts/基础知识/可靠性和容错技术' },
        { text: '图解公钥与私钥', link: '/posts/基础知识/图解公钥与私钥' },
        { text: '对象存储与指针压缩', link: '/posts/基础知识/对象存储与指针压缩' },
        { text: '并发编程总结', link: '/posts/基础知识/并发编程总结' },
        { text: '排序之比较器', link: '/posts/基础知识/排序之比较器' },
        { text: '数字签名', link: '/posts/基础知识/数字签名' },
        { text: '文件上传', link: '/posts/基础知识/文件上传' },
        { text: '池化之线程池', link: '/posts/基础知识/池化之线程池' },
        { text: '特征提取-简单流程', link: '/posts/基础知识/特征提取-简单流程' },
        { text: '理解IO阻塞与非阻塞', link: '/posts/基础知识/理解IO阻塞与非阻塞' },
        { text: '线程相关的知识', link: '/posts/基础知识/线程相关的知识' },
        { text: '责任链模式', link: '/posts/基础知识/责任链模式' },
        { text: '运算符', link: '/posts/基础知识/运算符' },
        { text: '重放攻击', link: '/posts/基础知识/重放攻击' },
        { text: '重构', link: '/posts/基础知识/重构' }
      ]
    },
    {
      text: '大模型',
      collapsed: false,
      items: [
        { text: 'RAG_大厂面试题深度解析', link: '/posts/大模型/RAG_大厂面试题深度解析' },
        { text: '大模型 Agent 实战全流程详解', link: '/posts/大模型/大模型 Agent 实战全流程详解' },
        { text: '大模型 Agent 实际应用案例', link: '/posts/大模型/大模型 Agent 实际应用案例' },
        { text: '大模型 RAG 实战全流程详解', link: '/posts/大模型/大模型 RAG 实战全流程详解' }
      ]
    },
    {
      text: '担保',
      collapsed: false,
      items: [
        { text: '再担保', link: '/posts/担保/再担保' },
        { text: '再担保机构的作用和价值', link: '/posts/担保/再担保机构的作用和价值' },
        { text: '国家融资担保基金', link: '/posts/担保/国家融资担保基金' },
        { text: '融资担保和非融资担保', link: '/posts/担保/融资担保和非融资担保' },
        { text: '银担"总对总"批量担保业务', link: '/posts/担保/银担"总对总"批量担保业务' }
      ]
    },
    {
      text: '数据库',
      collapsed: false,
      items: [
        { text: 'BigKey问题', link: '/posts/数据库/BigKey问题' },
        { text: 'Milvus向量数据库之以图搜图', link: '/posts/数据库/Milvus向量数据库之以图搜图' },
        { text: 'MinIO单机安装以及使用', link: '/posts/数据库/MinIO单机安装以及使用' },
        { text: '分库分表概念篇', link: '/posts/数据库/分库分表概念篇' },
        { text: '多级缓存如何保证数据一致', link: '/posts/数据库/多级缓存如何保证数据一致' },
        { text: '联合索引问题', link: '/posts/数据库/联合索引问题' },
        { text: '跳表', link: '/posts/数据库/跳表' },
        { text: '达梦数据库', link: '/posts/数据库/达梦数据库' },
        {
          text: 'HDFS',
          collapsed: true,
          items: [
            { text: 'HDFS文件操作', link: '/posts/数据库/hdfs/HDFS文件操作' },
            { text: 'HDFS概述', link: '/posts/数据库/hdfs/HDFS概述' },
            { text: 'MapReduce概述', link: '/posts/数据库/hdfs/MapReduce概述' }
          ]
        },
        {
          text: 'Hive',
          collapsed: true,
          items: [
            { text: 'HiveQL视图', link: '/posts/数据库/hive/HiveQL视图' },
            { text: 'Hive数据定义', link: '/posts/数据库/hive/Hive数据定义' },
            { text: 'Hive数据操作', link: '/posts/数据库/hive/Hive数据操作' },
            { text: 'Hive数据操作（2）', link: '/posts/数据库/hive/Hive数据操作（2）' },
            { text: 'Hive数据操作（3）', link: '/posts/数据库/hive/Hive数据操作（3）' },
            { text: 'Hive模式设计', link: '/posts/数据库/hive/Hive模式设计' },
            { text: 'Hive索引', link: '/posts/数据库/hive/Hive索引' },
            { text: 'Hive调优', link: '/posts/数据库/hive/Hive调优' }
          ]
        },
        {
          text: 'MySQL',
          collapsed: true,
          items: [
            { text: 'mysql事务', link: '/posts/数据库/mysql/mysql事务' },
            { text: 'mysql排序', link: '/posts/数据库/mysql/mysql排序' },
            { text: 'mysql的死锁', link: '/posts/数据库/mysql/mysql的死锁' },
            { text: 'mysql突然变慢排查', link: '/posts/数据库/mysql/mysql突然变慢排查' },
            { text: 'mysql表设计及优化', link: '/posts/数据库/mysql/mysql表设计及优化' }
          ]
        },
        {
          text: 'Redis',
          collapsed: true,
          items: [
            { text: 'Redis设计与实现', link: '/posts/数据库/redis/Redis设计与实现' },
            { text: '初识redis（1）', link: '/posts/数据库/redis/初识redis（1）' },
            { text: '初识redis（2）', link: '/posts/数据库/redis/初识redis（2）' }
          ]
        }
      ]
    },
    {
      text: '架构设计',
      collapsed: false,
      items: [
        { text: '事件驱动架构：从理念到落地', link: '/posts/架构设计/事件驱动架构：从理念到落地' },
        { text: '微服务拆分实操：用什么原则划边界', link: '/posts/架构设计/微服务拆分实操：用什么原则划边界' }
      ]
    },
    {
      text: '框架',
      collapsed: false,
      items: [
        { text: '中大型网站站内信_消息功能解决方案', link: '/posts/框架/中大型网站站内信_消息功能解决方案' }
      ]
    },
    {
      text: '测试',
      collapsed: false,
      items: [
        { text: '测试金字塔：如何制定团队的测试策略', link: '/posts/测试/测试金字塔：如何制定团队的测试策略' }
      ]
    },
    {
      text: '运维',
      collapsed: false,
      items: [
        {
          text: 'Docker',
          collapsed: true,
          items: [
            { text: 'docker入门', link: '/posts/运维/docker/docker入门' },
            { text: 'docker本机打镜像', link: '/posts/运维/docker/docker本机打镜像' },
            { text: 'docker网络模型', link: '/posts/运维/docker/docker网络模型' }
          ]
        },
        {
          text: 'K8S',
          collapsed: true,
          items: [
            { text: 'k8s构建ELK日志平台', link: '/posts/运维/k8s/k8s构建ELK日志平台' },
            { text: 'k8s集群搭建', link: '/posts/运维/k8s/k8s集群搭建' }
          ]
        },
        {
          text: '安装',
          collapsed: true,
          items: [
            { text: '软件安装及高可用部署', link: '/posts/运维/安装/软件安装及高可用部署' },
            { text: '软件安装及高可用部署-二', link: '/posts/运维/安装/软件安装及高可用部署-二' },
            { text: '软件安装及高可用部署-三', link: '/posts/运维/安装/软件安装及高可用部署-三' },
            { text: '软件安装及高可用部署-四', link: '/posts/运维/安装/软件安装及高可用部署-四' }
          ]
        },
        {
          text: '配置',
          collapsed: true,
          items: [
            { text: 'DNS', link: '/posts/运维/配置/DNS' },
            { text: 'Nacos配置中心使用', link: '/posts/运维/配置/Nacos配置中心使用' },
            { text: 'nginx配置', link: '/posts/运维/配置/nginx配置' }
          ]
        }
      ]
    }
  ],
  '/': [
    {
      text: '导航',
      items: [
        { text: '首页', link: '/' },
        { text: '文章', link: '/posts/' },
        { text: '关于我', link: '/intro' }
      ]
    }
  ]
}