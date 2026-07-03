---
title: Spring Boot 应用启动失败排查实战：Bean 循环依赖与自动配置
tag: ["Spring Boot", "循环依赖", "自动配置", "启动失败", "排查"]
category: 运维
date: 2026-07-03
---

# Spring Boot 应用启动失败排查实战：Bean 循环依赖与自动配置

> Spring Boot 应用启动失败是开发与运维的高频痛点。本文从 Bean 创建失败、循环依赖、自动配置冲突等典型场景出发，系统梳理排查方法论，涵盖报错解读、条件注解调试、自动配置排除等核心技巧，帮助你在 5 分钟内定位 90% 的启动失败问题。

## 一、问题背景

某次发版部署后，Spring Boot 应用启动失败，日志输出：

```
***************************
APPLICATION FAILED TO START
***************************

Description:
The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  orderService (com.example.service.OrderService)
↑     ↓
|  userService (com.example.service.UserService)
└─────┘

Action:
Relying upon circular references is discouraged and they are prohibited by default.
```

同时在另一次部署中遇到：

```
Description:
Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.

Reason: Failed to determine a suitable driver class

Action:
Consider the following:
    If you want an embedded database (H2, HSQL or Derby), please put it on the classpath.
    If you have database settings to be loaded from a particular profile you may need to activate it.
```

## 二、启动失败分类

### 2.1 启动失败全景图

```
┌──────────────────────────────────────────────────────────────────┐
│               Spring Boot 启动失败分类                             │
├───────────────┬──────────────────────────────────────────────────┤
│   失败类型     │   典型表现                                       │
├───────────────┼──────────────────────────────────────────────────┤
│ Bean 创建失败  │ BeanCreationException / NoSuchBeanDefinition    │
│ 循环依赖      │ BeanCurrentlyInCreationException                │
│ 配置缺失      │ NoUniqueBeanDefinitionException / 属性绑定失败   │
│ 端口冲突      │ PortInUseException / BindException              │
│ 自动配置冲突   │ 多个自动配置类争用同一 Bean                      │
│ 类加载冲突     │ ClassNotFoundException / NoSuchMethodError      │
│ 数据源配置     │ DataSource 配置缺失或冲突                        │
│ 序列化/反序列化│ SerializationException / JSON 解析失败          │
└───────────────┴──────────────────────────────────────────────────┘
```

### 2.2 启动失败排查流程

```
                    应用启动失败
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         有异常栈     无异常栈     启动后退出
              │          │          │
         读取异常    开启 DEBUG    检查日志
         定位类      日志分析      前面的
              │          │      WARN/ERROR
              ▼          ▼
         ┌────┴────┐    搜索
         ▼         ▼    "Failed to"
      代码问题  配置问题
         │         │
    ┌────┤    ┌────┤
    ▼    ▼    ▼    ▼
  循环  Bean  缺失  类型
  依赖  冲突  配置  不匹配
```

## 三、Bean 循环依赖排查

### 3.1 循环依赖报错解读

```
┌─────────────────────────────────────────────────────────────┐
│                    循环依赖报错示例                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────┐                                                    │
│  │  A  │ ──── depends on ───▶ B                             │
│  └─────┘ ◀── depends on ──── ┌─────┐                        │
│                              │  B  │                        │
│                              └─────┘                        │
│                                                             │
│  报错信息解读:                                               │
│  1. "form a cycle" → 存在循环依赖                            │
│  2. 列出的 Bean 链路 → A → B → A                            │
│  3. "prohibited by default" → Spring Boot 2.6+ 默认禁止      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 循环依赖的三种形式

```java
// ========== 形式一：构造器循环依赖（无法解决，必须重构） ==========
@Service
public class OrderService {
    private final UserService userService;

    // 构造器注入，循环依赖无解
    public OrderService(UserService userService) {
        this.userService = userService;
    }
}

@Service
public class UserService {
    private final OrderService orderService;

    public UserService(OrderService orderService) {
        this.orderService = orderService;
    }
}

// 启动报错:
// Requested bean is currently in creation:
// Is there an unresolvable circular reference?
```

```java
// ========== 形式二：setter/字段循环依赖（Spring 可以通过三级缓存解决） ==========
@Service
public class OrderService {
    @Autowired
    private UserService userService;  // 字段注入
}

@Service
public class UserService {
    @Autowired
    private OrderService orderService;  // 字段注入
}

// Spring Boot 2.6 之前: 可以启动（通过三级缓存）
// Spring Boot 2.6 之后: 默认禁止，需要手动开启
```

```java
// ========== 形式三：@Bean 方法循环依赖 ==========
@Configuration
public class ConfigA {
    @Bean
    public A a(B b) {
        return new A(b);
    }
}

@Configuration
public class ConfigB {
    @Bean
    public B b(A a) {
        return new B(a);
    }
}
// 同样报循环依赖错误
```

### 3.3 Spring 三级缓存原理

```
┌──────────────────────────────────────────────────────────────────┐
│              Spring Bean 创建三级缓存机制                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: singletonObjects        (单例池，完全初始化的 Bean)     │
│  Level 2: earlySingletonObjects   (早期引用，半初始化的 Bean)     │
│  Level 3: singletonFactories      (ObjectFactory，能产生代理)     │
│                                                                  │
│  循环依赖解决流程 (setter 注入 A ↔ B):                            │
│                                                                  │
│  Step 1: 创建 A 实例（构造器）                                     │
│          → A 的 ObjectFactory 放入 Level 3                       │
│                                                                  │
│  Step 2: A 注入 B → 去 Level 1/2/3 找 B → 没有                   │
│          → 开始创建 B                                             │
│                                                                  │
│  Step 3: 创建 B 实例（构造器）                                     │
│          → B 的 ObjectFactory 放入 Level 3                       │
│                                                                  │
│  Step 4: B 注入 A → 去 Level 1 找 A → 没有                        │
│          → 去 Level 2 找 A → 没有                                 │
│          → 去 Level 3 找 A → 找到 ObjectFactory!                 │
│          → 调用 getObject() 获取 A 的早期引用                      │
│          → A 的早期引用放入 Level 2                               │
│          → B 成功注入 A                                           │
│                                                                  │
│  Step 5: B 创建完成 → 放入 Level 1                                │
│          → A 成功注入 B                                           │
│          → A 创建完成 → 放入 Level 1                              │
│                                                                  │
│  ⚠ 构造器循环依赖无法解决：                                       │
│    因为实例化 A 时就需要 B，而 B 还未创建                          │
│    三级缓存的前提是实例已经创建出来（只是还没注入属性）             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 循环依赖解决方案

#### 方案一：使用 @Lazy 延迟初始化

```java
@Service
public class OrderService {
    private final UserService userService;

    // @Lazy 让 Spring 注入代理对象，首次调用时才真正初始化
    public OrderService(@Lazy UserService userService) {
        this.userService = userService;
    }
}

@Service
public class UserService {
    private final OrderService orderService;

    public UserService(OrderService orderService) {
        this.orderService = orderService;
    }
}
```

```java
// @Lazy 的原理：注入的是代理对象
// 真正的 UserService 在第一次被调用时才创建

// 反编译后等效于:
public class OrderService {
    private UserServiceProxy userServiceProxy;  // 代理对象

    public OrderService(UserServiceProxy proxy) {
        this.userServiceProxy = proxy;
    }

    public void doSomething() {
        // 首次调用时，代理对象触发真实 Bean 的初始化
        userServiceProxy.getTarget().doWork();
    }
}
```

#### 方案二：setter 注入替代构造器注入

```java
@Service
public class OrderService {
    private UserService userService;

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }
}

// 配合 spring.main.allow-circular-references=true（Spring Boot 2.6+）
```

```yaml
# application.yml
spring:
  main:
    allow-circular-references: true  # 允许循环依赖（不推荐，治标不治本）
```

#### 方案三：事件解耦（推荐）

```java
/**
 * 使用 Spring 事件机制解耦
 * 彻底消除循环依赖
 */

// 事件定义
public class OrderCreatedEvent extends ApplicationEvent {
    private final Long orderId;
    private final Long userId;

    public OrderCreatedEvent(Object source, Long orderId, Long userId) {
        super(source);
        this.orderId = orderId;
        this.userId = userId;
    }
    // getters...
}

// OrderService 只发事件，不依赖 UserService
@Service
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void createOrder(Long userId, List<Item> items) {
        Long orderId = persistOrder(userId, items);
        // 发布事件，不直接调用 UserService
        eventPublisher.publishEvent(new OrderCreatedEvent(this, orderId, userId));
    }
}

// UserService 监听事件
@Service
public class UserService {
    @EventListener
    @Async  // 异步处理，不阻塞主流程
    public void onOrderCreated(OrderCreatedEvent event) {
        updateUserOrderCount(event.getUserId());
    }
}
```

#### 方案四：引入中间层

```java
/**
 * 引入第三方服务消除循环
 * OrderService → OrderRelationService → UserService
 * UserService → OrderRelationService → OrderService（不再直接依赖）
 */

// 中间服务
@Service
public class OrderRelationService {
    private final OrderService orderService;
    private final UserService userService;

    public OrderRelationService(OrderService orderService,
                                 UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    // 提供需要跨服务调用的方法
    public void processOrderWithUser(Long orderId) {
        Order order = orderService.getById(orderId);
        User user = userService.getById(order.getUserId());
        // 处理逻辑
    }
}

// OrderService 不再依赖 UserService
@Service
public class OrderService {
    // 不再注入 UserService
    // 需要用户信息时通过 OrderRelationService 协调
}
```

### 3.5 循环依赖调试技巧

```java
// 开启循环依赖调试日志
// application.yml
/*
logging:
  level:
    org.springframework.beans.factory.support.DefaultListableBeanFactory: DEBUG
    org.springframework.beans.factory.support.DefaultSingletonBeanRegistry: TRACE
*/

// 启动时会输出详细的 Bean 创建过程
// 可以看到三级缓存的存取过程

/*
DEBUG DefaultSingletonBeanRegistry - Creating shared instance of singleton bean 'orderService'
DEBUG DefaultSingletonBeanRegistry - Creating shared instance of singleton bean 'userService'
TRACE DefaultSingletonBeanRegistry - Creating eagerly cached singleton of bean 'orderService'
DEBUG DefaultSingletonBeanRegistry - Returning eagerly cached instance of singleton bean 'orderService'
*/
```

```java
// 使用 BeanPostProcessor 检测循环依赖
@Component
public class CircularDependencyDetector implements BeanPostProcessor {

    private final Map<String, String> creatingBeans = new ConcurrentHashMap<>();

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName)
            throws BeansException {
        creatingBeans.put(beanName, Thread.currentThread().getName());
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName)
            throws BeansException {
        creatingBeans.remove(beanName);
        return bean;
    }
}
```

## 四、自动配置冲突排查

### 4.1 自动配置机制回顾

```
┌──────────────────────────────────────────────────────────────────┐
│               Spring Boot 自动配置流程                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. @SpringBootApplication                                       │
│     └─ @EnableAutoConfiguration                                  │
│         └─ AutoConfigurationImportSelector                       │
│             │                                                    │
│  2. 加载 META-INF/spring/org.springframework.boot.autoconfigure. │
│     AutoConfiguration.imports 文件                                │
│             │                                                    │
│  3. 读取所有自动配置类（如 DataSourceAutoConfiguration）          │
│             │                                                    │
│  4. 逐个评估 @Conditional 条件                                   │
│     ├─ @ConditionalOnClass       → classpath 有对应类？           │
│     ├─ @ConditionalOnBean        → 容器有对应 Bean？              │
│     ├─ @ConditionalOnProperty    → 配置有对应属性？               │
│     ├─ @ConditionalOnMissingBean → 容器没有对应 Bean？            │
│     └─ @ConditionalOnWebApplication → 是 Web 应用？              │
│             │                                                    │
│  5. 条件满足 → 自动配置类生效 → 注册 Bean                         │
│     条件不满足 → 跳过                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 自动配置冲突场景

#### 场景一：多数据源冲突

```java
// 问题：同时引入了两个数据库的 Starter
// pom.xml
/*
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
</dependency>
*/

// 启动报错：
// Description:
// Field mapper in com.example.service.UserService required a single bean, but 2 were found:
//   - sqlSessionFactoryBean: defined by method 'sqlSessionFactoryBean' in class path resource
//   - sqlSessionFactory: defined by method 'sqlSessionFactory' in class path resource

// 解决：排除其中一个自动配置
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,        // 排除默认数据源
    HibernateJpaAutoConfiguration.class       // 排除 JPA
})
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

#### 场景二：Jackson 与 Gson 冲突

```java
// 同时引入 Jackson 和 Gson，Spring Boot 不知道用哪个序列化
// Description:
// No qualifying bean of type 'org.springframework.http.converter.json.GsonHttpMessageConverter'

// 方案1：排除 Gson 的自动配置
@SpringBootApplication(exclude = {GsonAutoConfiguration.class})
public class Application { ... }

// 方案2：在配置中指定
// application.yml
/*
spring:
  http:
    converters:
      preferred-json-mapper: jackson
*/
```

#### 场景三：嵌入式容器冲突

```java
// 同时引入 Tomcat 和 Undertow
// Description:
// Multiple ServletWebServerFactory beans found

// 解决：排除 Tomcat
@SpringBootApplication(exclude = {TomcatAutoConfiguration.class})
public class Application { ... }

// 或者在 Maven 中排除 Tomcat 依赖
/*
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
*/
```

### 4.3 spring.autoconfigure.exclude 使用

```yaml
# application.yml - 排除自动配置
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration
      - org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
      - org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration
```

```java
// 注解方式排除
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    RedisAutoConfiguration.class
})
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 4.4 条件注解调试

```yaml
# 开启自动配置调试报告
# application.yml
debug: true

# 或指定日志级别
logging:
  level:
    org.springframework.boot.autoconfigure: DEBUG
```

启动时会输出条件评估报告：

```
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass found required classes 'javax.sql.DataSource' (OnClassCondition)
      - @ConditionalOnMissingBean did not find any beans (OnBeanCondition)

Negative matches:
-----------------
   RedisAutoConfiguration:
      - @ConditionalOnClass did not find required class 'org.springframework.data.redis.core.RedisOperations' (OnClassCondition)

   MongoAutoConfiguration:
      - @ConditionalOnClass did not find required class 'com.mongodb.MongoClient' (OnClassCondition)
```

### 4.5 自定义条件注解排查

```java
// 当条件注解不满足时，排查方法：

// 1. 使用 ConditionEvaluationReport
@Component
public class AutoConfigDebugRunner implements ApplicationRunner {

    @Autowired
    private ConfigurableApplicationContext context;

    @Override
    public void run(ApplicationArguments args) {
        ConditionEvaluationReport report =
            ConditionEvaluationReport.get(context.getBeanFactory());

        // 打印所有条件评估结果
        report.getConditionAndOutcomesBySource().forEach((source, outcomes) -> {
            System.out.println("Source: " + source);
            outcomes.forEach(outcome -> {
                System.out.println("  " + outcome.getOutcome() +
                    " (" + outcome.getCondition().getClass().getSimpleName() + ")");
            });
        });
    }
}

// 2. 查看具体的条件类
public class MyCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        boolean result = checkCondition(context);
        // 添加日志
        System.out.println("[Condition] MyCondition.matches() = " + result);
        return result;
    }
}
```

## 五、其他常见启动失败场景

### 5.1 端口冲突

```java
// 报错信息
// Description: Web server failed to start. Port 8080 was already in use.

// 排查步骤
// 1. 查看端口占用
// Linux: lsof -i:8080 或 netstat -tlnp | grep 8080
// Windows: netstat -ano | findstr :8080

// 2. 解决方案
// 方案A：换端口
// server.port=8081

// 方案B：自动寻找可用端口
// server.port=0  (随机可用端口)

// 方案C：杀掉占用进程
// kill -9 <PID>
```

### 5.2 配置文件不生效

```java
// 常见原因：profile 未激活
// application.yml 中配置了 spring.profiles.active=prod
// 但实际环境变量覆盖了

// 排查技巧：启动时打印配置来源
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class)
            .properties("spring.config.show-actual-location=true")
            .run(args);
    }
}

// 或使用 actuator 访问 /actuator/env 查看所有配置来源
```

### 5.3 Bean 定义冲突

```java
// 报错：NoUniqueBeanDefinitionException
// Description: Field userService required a single bean, but 2 were found:
//   - userServiceImpl1
//   - userServiceImpl2

// 方案1：@Primary 标记优先
@Primary
@Service
public class UserServiceImpl1 implements UserService { ... }

// 方案2：@Qualifier 指定名称
@Autowired
@Qualifier("userServiceImpl1")
private UserService userService;

// 方案3：@Bean 指定名称避免冲突
@Configuration
public class Config {
    @Bean("primaryUserService")
    public UserService userService() {
        return new UserServiceImpl1();
    }
}
```

### 5.4 类加载冲突

```bash
# 报错：NoSuchMethodError / ClassNotFoundException
# 典型原因：依赖版本冲突

# 排查步骤：
# 1. 查看依赖树
mvn dependency:tree | grep conflicting-artifact

# 2. 排查冲突依赖
# 在 pom.xml 中排除冲突的传递依赖

# 3. 统一版本管理
# 使用 <dependencyManagement> 统一版本
```

### 5.5 数据源配置失败

```java
// 报错：Failed to configure a DataSource: 'url' attribute is not specified

// 原因分析：
// 1. 引入了数据库相关的 Starter 但没有配置数据源
// 2. 确实不需要数据库但自动配置了

// 方案1：排除数据源自动配置
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class
})
public class Application { ... }

// 方案2：配置数据源
// spring.datasource.url=jdbc:mysql://localhost:3306/mydb
// spring.datasource.username=root
// spring.datasource.password=root
// spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

// 方案3：使用嵌入式数据库（开发环境）
// 引入 H2 依赖
```

## 六、启动加速与优化

### 6.1 启动耗时分析

```java
// 使用 Spring Boot 的启动耗时分析
// Spring Boot 2.4+ 内置 Startup 启动报告

// 通过 actuator 访问 /actuator/startup
// 输出示例：
/*
=========================================
Spring Boot startup report (1287ms)
=========================================
  step 1: Initialization (120ms)
  step 2: Environment preparation (45ms)
  step 3: ApplicationContext preparation (23ms)
  step 4: ApplicationContext refresh (1050ms)
    - Bean definition scanning (180ms)
    - Bean instantiation (750ms)
      - DataSource creation (320ms)  ← 最耗时
      - Redis connection (120ms)
      - MyBatis mapping scan (95ms)
      - Other beans (215ms)
    - Auto-configuration (120ms)
  step 5: Application runner (49ms)
*/
```

### 6.2 懒加载

```yaml
# application.yml
spring:
  main:
    lazy-initialization: true  # 所有 Bean 懒加载
    # 注意：Web 相关 Bean 不受影响（Tomcat 等仍需提前初始化）

# 也可以针对单个 Bean
# @Component @Lazy // 该 Bean 在首次使用时才初始化
```

### 6.3 排除不必要的自动配置

```java
@SpringBootApplication(exclude = {
    MongoAutoConfiguration.class,
    RedisAutoConfiguration.class,
    RabbitAutoConfiguration.class,
    JerseyAutoConfiguration.class,
    WebSocketAutoConfiguration.class,
})
public class Application { ... }
```

## 七、排查工具箱

### 7.1 命令行工具

```bash
# 1. 查看自动配置报告
java -jar app.jar --debug

# 2. 查看已注册的 Bean（通过 actuator）
curl http://localhost:8080/actuator/beans
curl http://localhost:8080/actuator/env
curl http://localhost:8080/actuator/configprops
curl http://localhost:8080/actuator/conditions
```

### 7.2 代码诊断工具

```java
// 启动后检查 Bean 依赖关系
@Component
public class BeanDependencyPrinter implements ApplicationRunner {

    @Autowired
    private ConfigurableApplicationContext context;

    @Override
    public void run(ApplicationArguments args) {
        DefaultListableBeanFactory factory =
            (DefaultListableBeanFactory) context.getBeanFactory();

        // 打印所有 Bean 及其依赖
        for (String beanName : factory.getBeanDefinitionNames()) {
            BeanDefinition def = factory.getBeanDefinition(beanName);
            String[] dependsOn = def.getDependsOn();
            if (dependsOn != null && dependsOn.length > 0) {
                System.out.println(beanName + " depends on: " +
                    Arrays.toString(dependsOn));
            }
        }

        System.out.println("\n=== Bean count: " +
            factory.getBeanDefinitionCount() + " ===");
    }
}
```

### 7.3 Spring Boot FailureAnalyzer

```java
// 自定义失败分析器，提供更友好的错误提示
public class CircularDependencyFailureAnalyzer
        extends AbstractFailureAnalyzer<BeanCurrentlyInCreationException> {

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure,
                                      BeanCurrentlyInCreationException cause) {
        return new FailureAnalysis(
            "检测到循环依赖: " + cause.getMessage(),
            "解决方案:\n" +
            "1. 使用 @Lazy 注解\n" +
            "2. 改用 setter 注入\n" +
            "3. 使用事件解耦\n" +
            "4. 引入中间层\n" +
            "5. 检查设计是否合理",
            cause
        );
    }
}

// 注册：META-INF/spring.factories
// org.springframework.boot.diagnostics.FailureAnalyzer=\
// com.example.CircularDependencyFailureAnalyzer
```

## 八、避坑指南

### 8.1 循环依赖避坑清单

| 序号 | 坑点 | 影响 | 建议 |
|-----|------|------|------|
| 1 | 构造器注入形成环 | 无法启动 | 必须重构，使用 @Lazy 或事件解耦 |
| 2 | 2.6+ 默认禁循环依赖 | 升级后启动失败 | 排查并消除循环，不要开 allow-circular-references |
| 3 | @Bean 方法循环 | 配置类循环依赖 | 提取公共配置类或使用 @Lazy |
| 4 | @Async 导致循环依赖 | 代理对象提前暴露问题 | @Async 方法所在 Bean 不参与循环 |
| 5 | 构造器 + @Lazy 的陷阱 | 启动通过但运行时 NPE | 确保被 @Lazy 的 Bean 不是构造器中直接调用 |

### 8.2 自动配置避坑清单

| 序号 | 坑点 | 影响 | 建议 |
|-----|------|------|------|
| 1 | 多 DataSource Starter 共存 | Bean 冲突 | 只保留一个，排除其他 |
| 2 | 引入 Starter 不用 | 启动慢、配置报错 | exclude 不需要的自动配置 |
| 3 | 条件注解不生效 | Bean 未注册 | 用 debug=true 查看条件报告 |
| 4 | 自定义 Bean 被覆盖 | 行为异常 | @ConditionalOnMissingBean 防覆盖 |
| 5 | 版本升级自动配置变化 | 新增意外 Bean | 升级后用 --debug 对比变化 |

### 8.3 通用启动避坑

```
坑1: 日志级别过高，看不到关键信息
  解决: 启动时加 --debug 参数

坑2: 配置文件优先级搞混
  优先级: 命令行 > 环境变量 > application-{profile}.yml > application.yml
  解决: 用 /actuator/env 确认生效来源

坑3: @ComponentScan 范围不当
  解决: 默认扫描启动类所在包及子包，不要随意改 basePackages

坑4: 外部配置文件路径错误
  解决: spring.config.additional-location 指定外部配置
```

## 九、面试要点

### Q1: Spring 循环依赖怎么解决？

**回答框架：**
1. **三级缓存机制**：singletonObjects、earlySingletonObjects、singletonFactories
2. **setter 注入可解**：通过提前暴露半成品 Bean 引用
3. **构造器注入无解**：实例化阶段就需要依赖，无法提前暴露
4. **Spring Boot 2.6+ 默认禁用**：需要显式开启 `allow-circular-references`
5. **最佳实践**：用 @Lazy、事件解耦、中间层消除循环

### Q2: Spring Boot 自动配置原理是什么？

**回答框架：**
1. `@EnableAutoConfiguration` 触发 `AutoConfigurationImportSelector`
2. 加载 `META-INF/spring/...AutoConfiguration.imports` 文件
3. 通过 `@Conditional` 系列注解判断是否生效
4. 核心注解：`@ConditionalOnClass`、`@ConditionalOnBean`、`@ConditionalOnMissingBean`
5. 可以通过 `exclude` 排除不需要的自动配置

### Q3: 如何排查 Spring Bean 创建失败？

**回答要点：**
1. 看异常类型：`BeanCreationException`、`NoSuchBeanDefinitionException`、`NoUniqueBeanDefinitionException`
2. 开启 `debug=true` 查看条件评估报告
3. 用 `/actuator/beans` 查看已注册的 Bean
4. 用 `/actuator/conditions` 查看条件匹配详情
5. Arthas 或 IDE 调试定位具体创建链路

### Q4: @Lazy 解决循环依赖的原理是什么？

**回答要点：**
1. @Lazy 注入的是代理对象，不是真实 Bean
2. 代理对象在首次调用方法时才触发真实 Bean 的初始化
3. 相当于打断了"创建时立即注入"的链路
4. 注意：如果构造器中直接使用 @Lazy Bean，仍会触发初始化

### Q5: Spring Boot 2.6 为什么默认禁止循环依赖？

**回答要点：**
1. 循环依赖本身就是设计问题，应该避免
2. 三级缓存机制有边界情况（与 AOP 代理冲突）
3. 强制开发者正面解决循环依赖，提高代码质量
4. 可以通过 `spring.main.allow-circular-references=true` 临时开启
5. 建议通过重构彻底消除循环依赖

## 十、总结

Spring Boot 启动失败排查的核心方法论：

1. **先看异常类型** — 不同异常对应不同排查方向
2. **开启 debug 模式** — `--debug` 参数输出条件评估报告
3. **善用 actuator** — `/beans`、`/env`、`/conditions` 三个端点覆盖 90% 场景
4. **循环依赖首选事件解耦** — @Lazy 只是临时方案，事件机制才是治本之策
5. **自动配置排除要显式** — 用 `exclude` 而不是删依赖，保持可追溯性