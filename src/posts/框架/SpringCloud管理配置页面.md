---
title: SpringCloud管理配置页面
author: zheng
tag:
  - SpringCloud
category:
  - spring
date: 2020-12-14 11:31:00
---

# 1、配置中心管理服务

1、配置 ID：Data ID

![image-20201214121332594](/assets/images/image-20201214121332594.png)

```java
在 Nacos Spring Cloud 中，dataId 的完整格式如下：${prefix}-${spring.profile.active}.${file-extension}
```

```java
${prefix} 为dataId的前缀，对应于Client端配置 spring.cloud.nacos.config.prefix 的值，如未配置，则默认对应Client端 spring.application.name 配置项的值。
${file-extension} 为配置内容的数据格式，可以通过配置项 spring.cloud.nacos.config.file-extension 来配置。目前只支持 properties 和 yaml 类型。
${spring.profile.active} 为为当前环境对应的 profile，如为空，则变为${prefix}-${spring.profile.active}.${file-extension}形式。
```

建议${prefix}采用类似 package.class的命名规则保证全局唯一性，class 部分建议是配置的业务含义。
全部字符小写。只允许英文字符和 4 种特殊字符（"."、":"、"-"、"_"），不超过 256 字节。



2、配置分组：group

一组相关配置的集合，建议以产品分组，ID建议填写产品名:项目/模块名（如：supervision:web-platform）保证唯一性，只允许英文字符和4种特殊字符（"."、":"、"-"、"_"），不超过128字节。

![image-20201214121613146](/assets/images/image-20201214121613146.png)

3、配置格式

可选配置格式，Nacos 会帮助您做格式校验。建议使用properties和yaml。

![image-20201214121645728](/assets/images/image-20201214121645728.png)

4、配置内容

配置的内容，建议不超过 10 KB，最大不超过 100 KB。内容格式应当与【配置格式】的设置一致。

![image-20201214121721100](/assets/images/image-20201214121721100.png)