---
title: Nacos配置中心使用
author: zheng
tag:
  - SpringCloud
  - nacos-config
category:
  - spring
  
date: 2019-11-25 16:38:00
---

# 一、启动Nacos Server

1、启动方式可见 [Nacos 官网](https://nacos.io/zh-cn/docs/quick-start.html) 

2、在配置列表里配置自己的配置，按照规范填写各项。

```java
user.name=zhengtianqi
user.password=123456
```

配置后的图：

![image-20191125164448760](/assets/images/nacos1.png)

# 二、客户端编写

1）常量类

```java
public class Constants {
    /**
     * 配置中心url
     */
    public static final String URL_NACOS = "127.0.0.1";

    public static final String NACOS_DATAID = "test-nacos-config.yml";
    public static final String NACOS_Group = "DEFAULT_GROUP";
}

```

2）客户端工具

```java
import com.alibaba.nacos.api.NacosFactory;
import com.alibaba.nacos.api.PropertyKeyConst;
import com.alibaba.nacos.api.config.ConfigService;
import com.alibaba.nacos.api.config.listener.Listener;
import com.alibaba.nacos.api.exception.NacosException;
import com.sy.log.LocalLog;
import com.sy.sa.nacos.common.constant.Constants;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import java.util.concurrent.Executor;

public class NacosUtils {
    private static ConfigService configService;

    /**
     * 读取配置超时时间，单位 ms
     */
    private static final int TIMEOUT = 1000 * 3;
    /**
     * 获取配置文件内容
     */
    private static String content = "";

    static {
        try {
            Properties properties = new Properties();
            properties.put(PropertyKeyConst.SERVER_ADDR, Constants.URL_NACOS);
            configService = NacosFactory.createConfigService(properties);
        } catch (NacosException e) {
            LocalLog.error("连接配置中心失败!", e);
            System.exit(1);
        }
    }

    /**
     * 获取配置中心配置内容
     *
     * @param group  命名空间
     * @param dataId 数据库
     * @return Properties
     */
    public static Properties getConfig(String group, String dataId) {
        Properties properties = null;
        try {
            String config = configService.getConfig(dataId, group, 3000);
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(config.getBytes(StandardCharsets.UTF_8));
            properties = new Properties();
            properties.load(byteArrayInputStream);
        } catch (Exception e) {
            LocalLog.error("", "从配置中心获取配置失败，group={},dataId={}", group, dataId, e);
        }
        if (null == properties) {
            LocalLog.info("", "从配置中心获取配置失败，group={},dataId={}", group, dataId);
        }
        return properties;
    }

    /**
     * 动态读取nocas配置内容
     *
     * @param dataId 配置ID
     * @param group  分组
     * @return
     */
    public static Properties getConfigProperties(String dataId, String group) {
        Properties properties = null;
        try {
            content = configService.getConfig(dataId, group, TIMEOUT);
            configService.addListener(dataId, group, new Listener() {
                @Override
                public void receiveConfigInfo(String configInfo) {
                    content = configInfo;
                    LocalLog.info("修改后的配置ID是：[" + dataId + "]，配置分组是：[" + group + "]获取的配置信息是" + content);
                }

                @Override
                public Executor getExecutor() {
                    return null;
                }
            });
            ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
            properties = new Properties();
            properties.load(byteArrayInputStream);
        } catch (NacosException e) {
            LocalLog.error("Nacos读取配置超时或网络异常", e);
        } catch (IOException e) {
            LocalLog.error("加载到properties对象出现IO异常", e);
        }
        return properties;
    }

}

```

3）配置文件

```java
spring:
  application:
    name: nacos-config-example
    group: sa
    developer: zhengtianqi<zheng>
  cloud:
    nacos:
      config:
        server-addr: http://localhost:8848

server:
  port: 8080
```

4）启动类

```java
import com.sy.log.LocalLog;
import com.sy.sa.nacos.common.constant.Constants;
import com.sy.sa.nacos.common.utils.NacosUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

import java.util.Properties;
import java.util.concurrent.TimeUnit;

@SpringBootApplication
public class NacosConfigExampleApplication {

    public static void main(String[] args) {
        SpringApplication.run(NacosConfigExampleApplication.class, args);
        // 测试动态加载配置
        Properties properties = NacosUtils.getConfigProperties(Constants.NACOS_DATAID, Constants.NACOS_Group);
        System.out.println(properties.getProperty("user.name") + ":" + properties.getProperty("user.password"));
    }

}
```

# 三、引入的依赖

```java
    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>

        <spring-cloud-alibaba.version>2.1.1.RELEASE</spring-cloud-alibaba.version>
        <spring-cloud-greenwich.version>0.9.0.RELEASE</spring-cloud-greenwich.version>
    </properties>
        
    <dependencies>
		<!--nacos-->
        <dependency>
            <groupId>com.alibaba.nacos</groupId>
            <artifactId>nacos-client</artifactId>
            <version>1.1.0</version>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
    </dependencies>
        
<dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-greenwich.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
```



# 四、效果

```java
2019-11-25 16:48:12.276  INFO 444 --- [-127.0.0.1_8848] locallog                                 : [../utils/NacosUtils$1.receiveConfigInfo:81][192.168.116.1][] - 修改后的配置ID是：[test-nacos-config.yml]，配置分组是：[DEFAULT_GROUP]获取的配置信息是user.name=zhengtianqi
user.password=12345678
```

解释：

上述代码中没有用到SpringCloud，只用到了nacos的客户端。因为 如果使用SpringCloud读取多个配置文件（a.properties, b.properties），a中是user.name=123，b中是user.name=1234； 会有覆盖的情况

```java
  ConfigurableApplicationContext applicationContext = SpringApplication.run(ConfigApplication.class, args);
        String userName = applicationContext.getEnvironment().getProperty("user.name");
        String userPassword = applicationContext.getEnvironment().getProperty("user.password");
```

如果多人开发没有注意到这种情况，会引起配置文件的key冲突导致出现问题