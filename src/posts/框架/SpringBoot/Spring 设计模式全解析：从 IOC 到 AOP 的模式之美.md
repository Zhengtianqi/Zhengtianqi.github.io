---
title: Spring 设计模式全解析：从 IOC 到 AOP 的模式之美
tag: ["Spring", "设计模式", "源码解析", "架构"]
category: 基础知识
date: 2026-06-27
---

# Spring 设计模式全解析：从 IOC 到 AOP 的模式之美

> Spring 设计模式全解析：从 IOC 到 AOP 的模式之美是软件工程中解决特定问题的经典方案，它提供了可复用的设计思路和代码结构。
> 本文深入分析了Spring 设计模式全解析：从 IOC 到 AOP 的模式之美的适用场景、优缺点和实现方式，是提升代码质量的重要参考。

Spring 的 Bean 默认就是单例的：

```java
@Service
public class UserService {
    // 整个容器中只有一个 UserService 实例
}
```

### 1.2 Spring 单例的实现原理

Spring 的单例不是通过 `private static` 实现的，而是通过 `ConcurrentHashMap` 管理的：

```java
public class DefaultSingletonBeanRegistry {
    // 一级缓存：存放完全初始化好的 Bean
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);
    // 二级缓存：存放早期 Bean 引用（解决循环依赖）
    private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);
    // 三级缓存：存放 Bean 工厂（用于生成早期引用）
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);

    protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        Object singletonObject = this.singletonObjects.get(beanName);
        if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
            singletonObject = this.earlySingletonObjects.get(beanName);
            if (singletonObject == null && allowEarlyReference) {
                synchronized (this.singletonObjects) {
                    singletonObject = this.singletonObjects.get(beanName);
                    if (singletonObject == null) {
                        singletonObject = this.earlySingletonObjects.get(beanName);
                        if (singletonObject == null) {
                            ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
                            if (singletonFactory != null) {
                                singletonObject = singletonFactory.getObject();
                                this.earlySingletonObjects.put(beanName, singletonObject);
                                this.singletonFactories.remove(beanName);
                            }
                        }
                    }
                }
            }
        }
        return singletonObject;
    }
}
```

### 1.3 Spring 单例 vs GoF 单例

| 维度 | GoF 单例 | Spring 单例 |
|---|---|---|
| 范围 | JVM 级别（类加载器） | 容器级别（ApplicationContext） |
| 实现 | static + 私有构造 | ConcurrentHashMap |
| 控制 | 类自己控制 | 容器统一管理 |
| 可测试性 | 差（全局状态） | 好（可替换 Bean） |

## 二、Spring 中的工厂模式

### 2.1 BeanFactory —— 最核心的工厂

`BeanFactory` 是 Spring 的核心接口，它就是一个超级工厂：

```java
public interface BeanFactory {
    Object getBean(String name) throws BeansException;
    <T> T getBean(String name, Class<T> requiredType) throws BeansException;
    <T> T getBean(Class<T> requiredType) throws BeansException;
    // ...
}
```

### 2.2 FactoryBean —— 定制化工厂

当 Bean 的创建逻辑比较复杂时，用 `FactoryBean`：

```java
public interface FactoryBean<T> {
    T getObject() throws Exception;    // 生产的对象
    Class<?> getObjectType();          // 对象类型
    boolean isSingleton();             // 是否单例
}
```

实际使用——创建动态代理的 Mapper：

```java
// MyBatis 的 MapperFactoryBean
public class MapperFactoryBean<T> extends SqlSessionDaoSupport implements FactoryBean<T> {
    private Class<T> mapperInterface;

    @Override
    public T getObject() throws Exception {
        // 通过动态代理生成 Mapper 实现
        return getSqlSession().getMapper(mapperInterface);
    }

    @Override
    public Class<T> getObjectType() {
        return mapperInterface;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }
}
```

### 2.3 静态工厂方法

XML 配置中的 `factory-method`：

```xml
<bean id="connection" class="java.sql.DriverManager"
      factory-method="getConnection">
    <constructor-arg value="jdbc:mysql://localhost:3306/test"/>
    <constructor-arg value="root"/>
    <constructor-arg value="123456"/>
</bean>
```

## 三、Spring 中的模板方法模式

Spring 提供了大量以 `Template` 结尾的类，全部基于模板方法模式。

### 3.1 JdbcTemplate

```java
public class JdbcTemplate {
    // 模板方法
    public <T> T execute(StatementCallback<T> action) {
        Connection con = DataSourceUtils.getConnection(getDataSource());
        Statement stmt = null;
        try {
            stmt = con.createStatement();
            T result = action.doInStatement(stmt);  // 扩展点
            return result;
        } catch (SQLException ex) {
            throw translateException("StatementCallback", getSql(action), ex);
        } finally {
            JdbcUtils.closeStatement(stmt);
            DataSourceUtils.releaseConnection(con, getDataSource());
        }
    }
}
```

使用——你只关心业务 SQL，连接管理、异常处理、资源释放全由模板搞定：

```java
jdbcTemplate.query("SELECT * FROM user WHERE id = ?",
    new RowMapper<User>() {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new User(rs.getLong("id"), rs.getString("name"));
        }
    }, 1L);
```

### 3.2 RestTemplate

```java
public class RestTemplate {
    protected <T> T doExecute(URI url, HttpMethod method, RequestCallback requestCallback,
                              ResponseExtractor<T> responseExtractor) {
        ClientHttpResponse response = null;
        try {
            ClientHttpRequest request = createRequest(url, method);
            if (requestCallback != null) {
                requestCallback.doWithRequest(request);  // 扩展点
            }
            response = request.execute();
            handleResponse(url, method, response);
            return (responseExtractor != null ? responseExtractor.extractData(response) : null);  // 扩展点
        } catch (IOException ex) {
            throw new ResourceAccessException("I/O error on " + method.name() + " request", ex);
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }
}
```

### 3.3 其他 Template

| 模板类 | 固定的流程 | 扩展点 |
|---|---|---|
| JdbcTemplate | 连接管理、异常处理 | StatementCallback / RowMapper |
| RestTemplate | HTTP 连接管理 | RequestCallback / ResponseExtractor |
| RedisTemplate | 连接管理、序列化 | RedisCallback |
| TransactionTemplate | 事务管理 | TransactionCallback |
| JmsTemplate | JMS 连接管理 | MessageCreator |

## 四、Spring 中的代理模式（AOP）

### 4.1 AOP 的核心——动态代理

Spring AOP 的本质就是代理模式：

```java
// 简化版 AOP 代理创建逻辑
public class JdkDynamicAopProxy implements InvocationHandler {
    private final AdvisedSupport advised;

    public JdkDynamicAopProxy(AdvisedSupport advised) {
        this.advised = advised;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 1. 获取拦截器链
        List<Object> chain = advised.getInterceptorsAndDynamicInterceptionAdvice(method, advised.getTargetClass());

        // 2. 如果有拦截器，创建 MethodInvocation 执行
        if (chain.isEmpty()) {
            return method.invoke(advised.getTarget(), args);
        } else {
            MethodInvocation invocation = new ReflectiveMethodInvocation(
                proxy, advised.getTarget(), method, args, advised.getTargetClass(), chain
            );
            return invocation.proceed();  // 责任链执行！
        }
    }
}
```

### 4.2 AOP 中的责任链

`ReflectiveMethodInvocation.proceed()` 就是责任链模式：

```java
public class ReflectiveMethodInvocation implements MethodInvocation {
    private int currentInterceptorIndex = -1;

    @Override
    public Object proceed() throws Throwable {
        // 拦截器链执行完毕，执行目标方法
        if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
            return invokeJoinpoint();
        }

        // 获取下一个拦截器
        Object interceptorOrInterceptionAdvice = 
            this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);

        // 执行拦截器
        if (interceptorOrInterceptionAdvice instanceof MethodInterceptor) {
            MethodInterceptor mi = (MethodInterceptor) interceptorOrInterceptionAdvice;
            return mi.invoke(this);  // 拦截器内部会再次调用 proceed()，形成链
        }
        
        return proceed();
    }
}
```

**一次 AOP 调用的执行流程**：

```
代理对象.method()
  → 拦截器1 (前置通知)
    → 拦截器2 (环绕通知-前半)
      → 拦截器3 (事务开启)
        → 目标方法
      → 拦截器3 (事务提交/回滚)
    → 拦截器2 (环绕通知-后半)
  → 拦截器1 (后置通知)
```

## 五、Spring 中的观察者模式

### 5.1 事件机制三要素

```java
// 1. 事件
public class UserRegisteredEvent extends ApplicationEvent {
    private final String userId;
    public UserRegisteredEvent(Object source, String userId) {
        super(source);
        this.userId = userId;
    }
    public String getUserId() { return userId; }
}

// 2. 发布者
@Service
public class UserService {
    @Autowired
    private ApplicationEventPublisher publisher;

    public void register(User user) {
        // 保存用户
        userRepo.save(user);
        // 发布事件
        publisher.publishEvent(new UserRegisteredEvent(this, user.getId()));
    }
}

// 3. 监听者
@Component
public class WelcomeEmailListener {
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        emailService.sendWelcomeEmail(event.getUserId());
    }
}

@Component
public class PointsListener {
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        pointsService.addPoints(event.getUserId(), 100);
    }
}
```

### 5.2 @TransactionalEventListener

```java
@Component
public class WelcomeEmailListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void onUserRegistered(UserRegisteredEvent event) {
        // 只有注册事务提交成功后才执行
        emailService.sendWelcomeEmail(event.getUserId());
    }
}
```

## 六、Spring 中的策略模式

### 6.1 Resource 接口

Spring 用 `Resource` 接口统一不同来源的资源访问：

```java
public interface Resource extends InputStreamSource {
    boolean exists();
    InputStream getInputStream() throws IOException;
    // ...
}

// 不同策略
ClassPathResource      // classpath 资源
FileSystemResource     // 文件系统资源
UrlResource            // URL 资源
ByteArrayResource      // 字节数组资源
ServletContextResource // Web 资源
```

使用——切换资源来源只改一行：

```java
Resource res1 = new ClassPathResource("application.yml");
Resource res2 = new FileSystemResource("/etc/app/application.yml");
Resource res3 = new UrlResource("https://example.com/config.yml");

// 使用方式完全一致
InputStream is = res.getInputStream();
```

### 6.2 Bean 实例化策略

```java
public interface InstantiationStrategy {
    Object instantiate(RootBeanDefinition bd, String beanName, BeanFactory owner);
}

// 策略1：反射
public class SimpleInstantiationStrategy implements InstantiationStrategy { ... }

// 策略2：CGLIB
public class CglibSubclassingInstantiationStrategy extends SimpleInstantiationStrategy { ... }
```

## 七、Spring 中的适配器模式

### 7.1 HandlerAdapter

Spring MVC 中不同类型的 Controller 接口不同，用 `HandlerAdapter` 统一：

```java
public interface HandlerAdapter {
    boolean supports(Object handler);
    ModelAndView handle(HttpServletRequest req, HttpServletResponse resp, Object handler);
}

// 适配 @RequestMapping 注解的 Controller
public class RequestMappingHandlerAdapter implements HandlerAdapter {
    @Override
    public boolean supports(Object handler) {
        return handler instanceof HandlerMethod;
    }
    @Override
    public ModelAndView handle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        // 解析参数、调用方法、处理返回值
        return invokeHandlerMethod(req, resp, (HandlerMethod) handler);
    }
}

// 适配 HttpRequestHandler
public class HttpRequestHandlerAdapter implements HandlerAdapter {
    @Override
    public boolean supports(Object handler) {
        return handler instanceof HttpRequestHandler;
    }
    @Override
    public ModelAndView handle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        ((HttpRequestHandler) handler).handleRequest(req, resp);
        return null;
    }
}
```

### 7.2 AdvisorAdapter

把不同类型的 Advice 适配成 MethodInterceptor：

```java
public interface AdvisorAdapter {
    boolean supportsAdvice(Advice advice);
    MethodInterceptor getInterceptor(Advisor advisor);
}

// MethodBeforeAdviceAdapter: 把 BeforeAdvice 适配成拦截器
// AfterReturningAdviceAdapter: 把 AfterAdvice 适配成拦截器
// ThrowsAdviceAdapter: 把 ThrowsAdvice 适配成拦截器
```

## 八、Spring 中的装饰器模式

### 8.1 BeanWrapper

```java
// BeanWrapper 对 Bean 进行包装，提供额外的功能（类型转换、属性访问）
BeanWrapper wrapper = new BeanWrapperImpl(new User());
wrapper.registerCustomEditor(Date.class, new CustomDateEditor(
    new SimpleDateFormat("yyyy-MM-dd"), true));
wrapper.setPropertyValue("birthday", "2024-01-01");
```

### 8.2 TransactionAwareCacheDecorator

```java
// 包装 Cache，使缓存操作参与事务
Cache cache = new TransactionAwareCacheDecorator(actualCache);
```

## 九、Spring 中的责任链模式

### 9.1 SecurityFilterChain

```java
// Spring Security 的过滤器链
http.csrf().disable()
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .requestMatchers("/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
    )
    .addFilterBefore(new JwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
```

每个请求依次通过：`SecurityContextFilter → UsernamePasswordAuthenticationFilter → JwtAuthFilter → AuthorizationFilter → ...`

### 9.2 Spring MVC Interceptor

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LogInterceptor()).order(1);
        registry.addInterceptor(new AuthInterceptor()).order(2);
        registry.addInterceptor(new RateLimitInterceptor()).order(3);
    }
}
```

## 十、Spring 中的外观模式

### 10.1 ApplicationContext

`ApplicationContext` 就是 Spring 的超级外观，它组合了多个子系统：

```java
public interface ApplicationContext extends EnvironmentCapable, ListableBeanFactory, 
    HierarchicalBeanFactory, MessageSource, ApplicationEventPublisher, ResourcePatternResolver {
    // 集成了：Bean 工厂、环境配置、国际化、事件发布、资源访问
}
```

### 10.2 JdbcTemplate

```java
// 对 JDBC 的外观封装
// 用户不需要关心 Connection、Statement、ResultSet 的管理
List<User> users = jdbcTemplate.query("SELECT * FROM user", 
    (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("name")));
```

## 十一、Spring 中的组合模式

### 11.1 CompositeCacheManager

```java
// 多个 CacheManager 组合
public class CompositeCacheManager implements CacheManager {
    private final List<CacheManager> cacheManagers;

    @Override
    public Cache getCache(String name) {
        for (CacheManager manager : cacheManagers) {
            Cache cache = manager.getCache(name);
            if (cache != null) return cache;
        }
        return null;
    }
}
```

### 11.2 MergedBeanDefinition

合并父子 BeanDefinition 时用到了组合思想。

## 十二、Spring 中的建造者模式

### 12.1 BeanDefinitionBuilder

```java
BeanDefinitionBuilder builder = BeanDefinitionBuilder
    .genericBeanDefinition(UserService.class)
    .addConstructorArgValue("admin")
    .addConstructorArgReference("userRepo")
    .addPropertyValue("maxRetry", 3)
    .setInitMethodName("init");

BeanDefinition bd = builder.getBeanDefinition();
```

### 12.2 UriComponentsBuilder

```java
String uri = UriComponentsBuilder
    .fromHttpUrl("https://api.example.com")
    .path("/users")
    .queryParam("page", 1)
    .queryParam("size", 10)
    .queryParam("sort", "name,asc")
    .build()
    .toUriString();
// https://api.example.com/users?page=1&size=10&sort=name,asc
```

## 十三、Spring 设计模式全景图

| 创建型 | Spring 应用 |
|---|---|
| 单例 | Bean 默认作用域 |
| 工厂方法 | BeanFactory、FactoryBean |
| 抽象工厂 | BeanFactory 的子接口 ListableBeanFactory |
| 建造者 | BeanDefinitionBuilder、UriComponentsBuilder |
| 原型 | @Scope("prototype") |

| 结构型 | Spring 应用 |
|---|---|
| 适配器 | HandlerAdapter、AdvisorAdapter |
| 装饰器 | BeanWrapper、TransactionAwareCacheDecorator |
| 代理 | AOP（JDK 动态代理、CGLIB） |
| 外观 | ApplicationContext、JdbcTemplate |
| 享元 | 单例 Bean 本身就是共享 |
| 组合 | CompositeCacheManager |
| 桥接 | BeanDefinition + BeanDefinitionReader |

| 行为型 | Spring 应用 |
|---|---|
| 策略 | Resource 接口、InstantiationStrategy |
| 观察者 | ApplicationEvent + @EventListener |
| 模板方法 | JdbcTemplate、RestTemplate、RedisTemplate |
| 责任链 | SecurityFilterChain、HandlerInterceptor |
| 命令 | JmsTemplate 的 MessageCreator |
| 状态 | Lifecycle 接口 |
| 迭代器 | CompositeIterator |
| 中介者 | DispatcherServlet |
| 备忘录 | 事务管理器（保存状态用于回滚） |
| 访问者 | BeanDefinitionVisitor |
| 解释器 | SpelExpressionParser |

## 十四、面试要点

**Q1：Spring 中用了哪些设计模式？**

答：Spring 几乎用到了全部 23 种设计模式。最核心的：IOC 容器用工厂模式管理 Bean，AOP 用代理模式实现切面，JdbcTemplate 等用模板方法封装样板代码，事件机制用观察者模式解耦通知，Security Filter Chain 用责任链处理安全检查。

**Q2：Spring AOP 用的是 JDK 代理还是 CGLIB？**

答：两者都用。目标类实现了接口时默认用 JDK 动态代理，没有接口时用 CGLIB。Spring Boot 2.x 之后默认使用 CGLIB（`spring.aop.proxy-target-class=true`）。也可以通过 `@EnableAspectJAutoProxy(proxyTargetClass = true)` 强制 CGLIB。

**Q3：Spring 的三级缓存怎么解决循环依赖？**

答：A 依赖 B，B 依赖 A 时：① 创建 A，将 A 的 ObjectFactory 放入三级缓存；② 注入 B 时发现 B 未创建，创建 B；③ B 注入 A 时从三级缓存获取 A 的 ObjectFactory，提前暴露 A 的早期引用（可能被代理），放入二级缓存；④ B 创建完成，A 注入 B；⑤ A 创建完成，从二级缓存移到一级缓存。

**Q4：@EventListener 的底层是怎么实现的？**

答：Spring 容器初始化时，`EventListenerMethodProcessor` 扫描所有 Bean，找出带 `@EventListener` 注解的方法，为每个方法创建 `ApplicationListenerMethodAdapter` 并注册到 `ApplicationEventMulticaster`。发布事件时，`SimpleApplicationEventMulticaster` 遍历所有匹配的 Listener 执行。

**Q5：JdbcTemplate 解决了什么问题？**

答：解决了 JDBC 的样板代码问题。传统 JDBC 需要手动管理 Connection、Statement、ResultSet 的开关和异常处理，JdbcTemplate 用模板方法模式固定了这些流程，开发者只需提供 SQL 和结果映射逻辑。

## 总结

Spring 框架的设计之美在于：

1. **工厂模式**是基石——BeanFactory 统一管理对象创建
2. **代理模式**是利器——AOP 实现横切关注点
3. **模板方法**是常态——消除样板代码
4. **观察者**是桥梁——事件驱动解耦
5. **责任链**是管道——Filter/Interceptor 逐层处理
6. **策略模式**是变化——不同实现可替换
7. **适配器**是粘合——统一不同接口

学习 Spring 设计模式不只是为了面试，更是为了写出更好的代码。当你理解了这些模式，你写出的代码也会更有弹性、更易扩展。正如 Rod Johnson 所说："Code should be simple, testable, and flexible." 设计模式就是实现这一目标的工具。
