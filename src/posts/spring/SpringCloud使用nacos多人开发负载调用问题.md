---
title: SpringCloud使用nacos多人开发负载调用问题实践
author: 郑天祺
tag:
  - SpringCloud
category:
  - spring
  
date: 2023-10-12 10:17:00
---

# 1、问题描述
当我们使用springcloud+nacos架构时,由于使用nacos进行负载的原因,组内小伙伴经常调用到其他人的电脑。

针对此问题我们可以采用的方案：

- （方案1）利用nacos的特性,进行区分namespace或者group,每个人用不同的namespace或者group。该方式需要每个开发人员改yml文件且不能提交,比较麻烦。
- （方案2）不使用openfeign不使用gateway,使用restTemplate,调用前进行判断是否为开发环境,开发环境使用localhost。
- （方案3）该方案我目前采用的,无需每个人进行特别的配置。首先我们使用openfeign且使用gateway；其中nacos的namespace区分dev、test、hotfix、prod；group大家都是用的默认的DEFAULT_GROUP。需要修改的是gateway配置和增加openfeign参数
若有更好的方法,也请分享我,万分感谢~
下面详细介绍方案2和方案3：
# 2、方案2
使用RestTemplate进行服务调用
```java
// nacos 服务注册与发现
@Autowired
private NamingService namingService;

@Autowired
private RestTemplate restTemplate;
// 当前环境
@Value("${spring.profiles.active:#{prod}}")
private String env;
/**
 * 在不使用feign组件时,使用nacos的NamingService配合RestTemplate的实现服务的发现及调用
 */
@RequestMapping(value = "/hello/{name}", method = RequestMethod.GET)
public String echo(@PathVariable String name) {
    try {
        // 获取服务实例列表 参数分别为实例名、是否为健康实例
        String sendUrl = "";
        Instance instance = namingService.selectOneHealthyInstance("server-provider", true);
        // 如果是dev环境则调用localhost
        if ("dev".equals(env)) {
            sendUrl = "http://localhost:" + instance.getPort() + "/echo/" + name;
        } else {
            sendUrl = "http://" + instance.getIp() + ":" + instance.getPort() + "/echo/" + name;
        }
        String result = restTemplate.getForObject(sendUrl, String.class);
        //打印log
        return result;
    } catch (NacosException e) {
        e.printStackTrace();
    }
    return null;
}
```
# 2、方案3
step1：配置dev的gateway,将动态获得服务地址改为固定的地址,配置如下
```java
spring:
  cloud:
    gateway:
      discovery:
        locator:
          lowerCaseServiceId: true
          enabled: true
      routes:
        # 认证中心
        - id: auth
          # 该处写死,则只调用本地的程序
          # uri: lb://auth
          uri: http://localhost:9200
          predicates:
            - Path=/auth/**
          filters:
            # 验证码处理
            - CacheRequestFilter
            - ValidateCodeFilter
            - StripPrefix=1
        # 文件服务
        - id: file
          # 该处写死,则只调用本地的程序
          # uri: lb://file
          uri: http://localhost:9300
          predicates:
            - Path=/file/**
          filters:
            - StripPrefix=1
```
step2：配置openfeign接口,增加url参数
```java
@FeignClient(contextId = "remoteFileService", value = ServiceNameConstants.FILE_SERVICE, fallbackFactory = RemoteFileFallbackFactory.class, url = "${servicename.file}")
public interface RemoteFileService {
    @PostMapping(value = "/inner/file/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public R<SysFile> upload(@RequestBody LoginUser loginUser,
                             @RequestPart(value = "file") MultipartFile file,
                             @RequestParam(value = "filePath") String filePath);
}
```
上述一般@FeignClient中参数的url若不指定,则会根据value去找nacos中对应的ip和端口。
所以我们需要配置url为${servicename.file},${servicename.file}会读取yaml文件中的配置,而我们只需要增加namespace为dev的yaml文件,如下：
```java
servicename:
        file: http://localhost:9300
```
发布到其他环境的yaml则需要配置为
```java
servicename:
        file: ''
```
经过上述配置,我们可以保证进入gateway的请求,只会代理到localhost。使用openfeign的请求,则会调用配置好的url。生产环境则会因为url为空,会去根据value进行负载
