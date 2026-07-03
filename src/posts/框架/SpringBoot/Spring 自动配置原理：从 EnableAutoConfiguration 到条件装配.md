---
title: Spring 自动配置原理：从 @EnableAutoConfiguration 到条件装配
tag: ["Spring", "自动配置", "SPI", "条件装配", "源码"]
category: 框架
date: 2026-07-03
---

# Spring 自动配置原理：从 @EnableAutoConfiguration 到条件装配

Spring Boot 魔法的本质是什么？加个 starter 就能用？自动配置背后是 SPI 机制 + 条件装配的组合拳。从源码层面彻底搞懂。

---

## 一、入口：@SpringBootApplication

```java
@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);
    }
}

// @SpringBootApplication = 三个注解组合
@SpringBootConfiguration    // = @Configuration（配置类）
@EnableAutoConfiguration    // 自动配置核心
@ComponentScan              // 组件扫描
public @interface SpringBootApplication { ... }
```

---

## 二、@EnableAutoConfiguration 原理

### 2.1 核心注解

```java
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration { ... }

// 两个核心动作：
// 1. @AutoConfigurationPackage → 扫描启动类所在包
// 2. @Import(AutoConfigurationImportSelector.class) → 加载自动配置类
```

### 2.2 AutoConfigurationImportSelector 源码

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector {
    
    @Override
    public String[] selectImports(AnnotationMetadata metadata) {
        // 获取所有候选自动配置类
        List<String> configurations = getCandidateConfigurations(metadata, attributes);
        // 去重
        configurations = removeDuplicates(configurations);
        // 过滤（根据 @Conditional 条件）
        configurations = filter(configurations, autoConfigurationMetadata);
        return configurations.toArray(new String[0]);
    }
    
    private List<String> getCandidateConfigurations(AnnotationMetadata metadata, 
                                                      AnnotationAttributes attributes) {
        // 通过 SpringFactoriesLoader 加载 META-INF/spring.factories
        List<String> configurations = SpringFactoriesLoader.loadFactoryNames(
            EnableAutoConfiguration.class, getClassLoader());
        return configurations;
    }
}
```

### 2.3 SPI 机制（Spring 2.x）

```
加载路径：META-INF/spring.factories

文件内容（spring-boot-autoconfigure 的 spring.factories）：
  
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
  org.springframework.boot.autoconfigure.redis.RedisAutoConfiguration,\
  org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,\
  ...（200+ 个自动配置类）

Spring Boot 2.7+ 也支持 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 文件
Spring Boot 3.x 完全用 .imports 文件，废弃 spring.factories
```

### 2.4 Spring Boot 3 的 imports 文件

```
文件路径：META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

文件内容：
  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
  org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
  ...

每行一个全限定类名，不再需要 key=value 格式
```

---

## 三、条件装配

### 3.1 @Conditional 系列注解

```java
// 自动配置类通过条件注解决定是否生效

@AutoConfiguration
@ConditionalOnClass(DataSource.class)           // classpath 有 DataSource 才生效
@ConditionalOnMissingBean(DataSource.class)     // 容器没有 DataSource 才生效
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}

// 常用条件注解：
@ConditionalOnClass          // classpath 存在指定类
@ConditionalOnMissingClass   // classpath 不存在指定类
@ConditionalOnBean           // 容器存在指定 Bean
@ConditionalOnMissingBean    // 容器不存在指定 Bean
@ConditionalOnProperty       // 配置属性满足条件
@ConditionalOnResource       // 存在指定资源文件
@ConditionalOnWebApplication // 是 Web 应用
@ConditionalOnNotWebApplication // 不是 Web 应用
@ConditionalOnExpression     // SpEL 表达式为 true
```

### 3.2 条件匹配流程

```
DataSourceAutoConfiguration 是否生效？

1. @ConditionalOnClass(DataSource.class)
   → classpath 有 mysql-connector-java → ✅ 通过

2. @ConditionalOnMissingBean(DataSource.class)
   → 用户没自定义 DataSource → ✅ 通过

3. @EnableConfigurationProperties
   → 加载 DataSourceProperties（绑定 spring.datasource.*）

4. @Bean dataSource()
   → @ConditionalOnMissingBean → 没有自定义 → 创建默认 DataSource

如果用户自定义了 DataSource：
  @Bean
  public DataSource dataSource() {
      return new HikariDataSource();  // 用户自定义
  }
  → @ConditionalOnMissingBean 检测到已有 DataSource
  → 自动配置的 dataSource() 不执行
  → 用用户的 DataSource

这就是"约定优于配置"的核心：
  你不配，我用默认的；你配了，我用你的。
```

### 3.3 @ConditionalOnProperty 详解

```java
@Bean
@ConditionalOnProperty(
    prefix = "spring.datasource",
    name = "type",
    havingValue = "com.zaxxer.hikari.HikariDataSource",
    matchIfMissing = true  // 属性不存在时也匹配
)
public HikariDataSource hikariDataSource() {
    return new HikariDataSource();
}

// application.yml
# 不配 → 用默认（matchIfMissing=true）
# spring.datasource.type=com.zaxxer.hikari.HikariDataSource → 匹配
# spring.datasource.type=org.apache.tomcat.jdbc.pool.DataSource → 不匹配，不创建
```

---

## 四、自动配置类示例

### 4.1 RedisAutoConfiguration

```java
@AutoConfiguration
@ConditionalOnClass({RedisOperations.class, RedisClient.class})
@EnableConfigurationProperties(RedisProperties.class)
@Import({LettuceConnectionConfiguration.class, JedisConnectionConfiguration.class})
public class RedisAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    public RedisTemplate<Object, Object> redisTemplate(
            RedisConnectionFactory factory) {
        RedisTemplate<Object, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        return template;
    }
    
    @Bean
    @ConditionalOnMissingBean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}

// 生效条件：
// 1. classpath 有 Redis 相关类（引入了 spring-boot-starter-data-redis）
// 2. 用户没自定义 redisTemplate → 创建默认的
// 3. 用户没自定义 stringRedisTemplate → 创建默认的

// 如果用户自定义：
@Bean
public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(factory);
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new Jackson2JsonRedisSerializer<>(Object.class));
    return template;
}
// → 自动配置的 redisTemplate 不会创建（@ConditionalOnMissingBean）
```

### 4.2 自动配置加载顺序

```java
// 自动配置类可以通过 @AutoConfigureOrder / @AutoConfigureBefore / @AutoConfigureAfter 控制顺序

@AutoConfiguration(after = DataSourceAutoConfiguration.class)
@ConditionalOnClass({SqlSessionFactory.class, SqlSessionFactoryBean.class})
public class MybatisAutoConfiguration { ... }
// 在 DataSourceAutoConfiguration 之后加载（保证 DataSource 先创建）

@AutoConfiguration(before = DataSourceAutoConfiguration.class)
public class SomeConfig { ... }
// 在 DataSourceAutoConfiguration 之前加载
```

---

## 五、自定义 Starter

### 5.1 创建自动配置类

```java
// 1. 自动配置类
@AutoConfiguration
@ConditionalOnClass(SmsClient.class)
@EnableConfigurationProperties(SmsProperties.class)
public class SmsAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(prefix = "sms", name = "enabled", havingValue = "true", 
                           matchIfMissing = true)
    public SmsClient smsClient(SmsProperties properties) {
        return new SmsClient(properties.getAccessKey(), properties.getSecretKey());
    }
}

// 2. 配置属性类
@ConfigurationProperties(prefix = "sms")
public class SmsProperties {
    private String accessKey;
    private String secretKey;
    private boolean enabled = true;
    // getter/setter
}

// 3. 注册自动配置类
// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// 内容：
// com.example.sms.SmsAutoConfiguration
```

### 5.2 使用

```xml
<!-- 其他项目引入 starter -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>sms-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
sms:
  access-key: AKxxx
  secret-key: SKxxx
  enabled: true
# 自动创建 SmsClient Bean
```

---

## 六、调试自动配置

### 6.1 查看生效的自动配置

```bash
# 启动时加 --debug
java -jar myapp.jar --debug

# 输出：
# ============================
# CONDITIONS EVALUATION REPORT
# ============================
# Positive matches:（生效的自动配置）
#   DataSourceAutoConfiguration matched:
#     - @ConditionalOnClass found required classes 'javax.sql.DataSource' (OnClassCondition)
#     - @ConditionalOnMissingBean (types: javax.sql.DataSource; SearchStrategy: all) 
#       did not find any beans (OnBeanCondition)
# 
# Negative matches:（未生效的自动配置）
#   RedisAutoConfiguration:
#     - @ConditionalOnClass did not find required class 'RedisClient' (OnClassCondition)
```

### 6.2 Actuator 查看

```bash
# 访问 /actuator/conditions
curl http://localhost:8080/actuator/conditions

# 返回 JSON，包含所有自动配置类的匹配情况
```

---

## 七、面试要点

### Q：Spring Boot 自动配置原理是什么？

通过 @EnableAutoConfiguration 导入 AutoConfigurationImportSelector，通过 SPI 机制加载 META-INF/spring.factories（Boot 3 用 .imports 文件）中配置的自动配置类。每个自动配置类通过 @Conditional 系列注解（@ConditionalOnClass、@ConditionalOnMissingBean、@ConditionalOnProperty 等）判断是否生效。核心思想是"约定优于配置"——你不配我用默认的，你配了用你的。

### Q：@ConditionalOnMissingBean 的作用？

确保自动配置的 Bean 不会覆盖用户自定义的 Bean。当用户定义了同类型的 Bean，自动配置的 Bean 就不会被创建。这是 Spring Boot "约定优于配置"的核心机制——自动配置是兜底方案，用户配置优先级更高。

### Q：Spring Boot 2.x 和 3.x 的自动配置有什么区别？

1. 配置文件：2.x 用 spring.factories，3.x 用 .imports 文件
2. 注解：3.x 用 @AutoConfiguration 替代 @Configuration
3. 包名：javax → jakarta
4. SPI 加载方式简化，不再需要 key-value 格式

---

## 八、总结

```
自动配置三步走：
  1. SPI 加载 → 从 spring.factories / .imports 文件读取自动配置类
  2. 条件过滤 → @Conditional 系列注解判断是否生效
  3. Bean 创建 → 满足条件则创建 Bean，@ConditionalOnMissingBean 保证用户优先

核心思想：约定优于配置
  你不配 → 用默认
  你配了 → 用你的
```
