---
title: 基于Spring AOP和Redis的分布式限流实践
author: zheng
tag:

  - 分布式锁
category: 分布式
date: 2026-01-26 10:00:00

---

## 概述

在高并发系统中，限流是一种重要的保护机制，用于控制请求流量，防止系统被过多请求冲击导致服务不可用。本文将基于提供的代码实现，详细介绍如何使用Spring AOP和Redis实现一个灵活的分布式限流组件。
该例子利用mysql进行黑名单的自动登记。
## 限流组件架构

### 1. 自定义限流注解 - RateLimiter

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimiter {
    String key() default "rate_limit:";
    int time() default 60;
    int count() default 5;
    LimitType limitType() default LimitType.DEFAULT;
    boolean joinBlackList() default false;
}
```


**关键特性：**
- **key**: 限流标识，用于区分不同的限流规则
- **time**: 限流时间窗口，单位秒
- **count**: 时间窗口内的最大请求数
- **limitType**: 限流类型，支持多种限流策略
- **joinBlackList**: 是否加入黑名单功能

### 2. 限流切面 - RateLimiterAspect

这是限流的核心实现，通过AOP在方法执行前进行拦截：

```java
@Aspect
@Component
public class RateLimiterAspect {
    // 实现限流逻辑
}
```


## 限流实现原理

### 1. 黑名单检查机制

```java
@Before("@annotation(rateLimiter)")
public void doBefore(JoinPoint point, RateLimiter rateLimiter) throws Throwable {
    LoginMember loginMember = apiTokenService.getLoginMember(ServletUtils.getRequest());
    Map<String,Object> map = new HashMap<>();
    map.put("phone", loginMember.getPhone());
    map.put("isValid", "1");
    List<BlackListDto> blackLists= blackListService.getList(map);
    if (!blackLists.isEmpty()){
        throw new RateLimiterException("访问已达上线，请与我司联系！");
    }
    // 继续后续限流逻辑
}
```


**流程说明：**
- 获取当前登录用户信息
- 查询该用户是否在黑名单中
- 如果在黑名单，则直接抛出异常阻止访问

### 2. Redis + Lua脚本限流

```java
Long number = redisTemplate.execute(limitScript, keys, count, time);
if (null == number || number.intValue() > count) {
    if (rateLimiter.joinBlackList()){
        // 加入黑名单逻辑
    }
    throw new RateLimiterException("访问已达上限，请稍后重试！");
}
```


**核心优势：**
- 使用Lua脚本保证原子性操作
- Redis高性能存储，适合高频访问场景
- 分布式环境下数据一致性保障

### 3. 多维度限流键值生成

```java
public String getCombineKey(RateLimiter rateLimiter, JoinPoint point) {
    StringBuffer stringBuffer = new StringBuffer(rateLimiter.key());
    if (rateLimiter.limitType() == LimitType.LOGIN_PHONE) {
        LoginMember loginMember = apiTokenService.getLoginMember(ServletUtils.getRequest());
        stringBuffer.append(loginMember.getPhone()).append("-");
    }
    MethodSignature signature = (MethodSignature) point.getSignature();
    Method method = signature.getMethod();
    Class<?> targetClass = method.getDeclaringClass();
    stringBuffer.append(targetClass.getName()).append("-").append(method.getName());
    return stringBuffer.toString();
}
```


**支持的限流维度：**
- 全局限流：基于方法级别
- 用户限流：基于登录手机号
- 接口限流：基于类名+方法名组合

## 业务特性

### 1. 智能黑名单管理

当用户触发限流阈值时，系统可选择将其加入黑名单：
- 配置 `joinBlackList = true` 启用此功能
- 自动记录用户手机号到黑名单表
- 后续访问将被永久拒绝

### 2. 灵活的限流策略

通过 [LimitType] 枚举支持不同限流粒度：
```java
public enum LimitType
{
    /**
     * 默认策略全局限流
     */
    DEFAULT,

    /**
     * 根据请求者IP进行限流
     */
    LOGIN_PHONE
}
```
- **DEFAULT**: 默认限流策略
- **LOGIN_PHONE**: 基于登录用户的个性化限流

## 最佳实践建议

### 1. 参数配置原则

```java
// 合理设置限流参数
@RateLimiter(
    key = "api:login",      // 具有业务意义的键名
    time = 60,              // 合适的时间窗口
    count = 10,             // 符合业务需求的阈值
    limitType = LimitType.LOGIN_PHONE,
    joinBlackList = false   // 谨慎开启黑名单功能
)
```


### 2. 监控与告警

- 记录限流触发日志，便于分析业务趋势
- 设置限流异常监控指标
- 定期清理过期的黑名单记录

### 3. 性能优化考虑

- Redis连接池合理配置
- Lua脚本性能调优
- 缓存键值的设计避免热点Key问题

### 4. 整体代码
```java
/**
 * 限流注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimiter {
    /**
     * 限流key
     */
    String key() default "rate_limit:";

    /**
     * 限流时间,单位秒
     */
    int time() default 60;

    /**
     * 限流次数
     */
    int count() default 5;

    /**
     * 限流类型
     */
    LimitType limitType() default LimitType.DEFAULT;

    /**
     * 是否黑名单
     */
    boolean joinBlackList() default false;
}


/**
 * 限流处理
 */
@Aspect
@Component
public class RateLimiterAspect {
    private static final Logger log = LoggerFactory.getLogger(RateLimiterAspect.class);

    private RedisTemplate<Object, Object> redisTemplate;

    private RedisScript<Long> limitScript;
    @Autowired
    private ApiTokenService apiTokenService;

    @Autowired
    private BlackListService blackListService;

    @Autowired
    public void setRedisTemplate1(RedisTemplate<Object, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Autowired
    public void setLimitScript(RedisScript<Long> limitScript) {
        this.limitScript = limitScript;
    }

    @Before("@annotation(rateLimiter)")
    public void doBefore(JoinPoint point, RateLimiter rateLimiter) throws Throwable {
        LoginMember loginMember = apiTokenService.getLoginMember(ServletUtils.getRequest());
        Map<String,Object> map = new HashMap<>();
        map.put("phone", loginMember.getPhone());
        map.put("isValid", "1");
        List<BlackListDto> blackLists= blackListService.getList(map);
        if (!blackLists.isEmpty()){
            throw new RateLimiterException("访问已达上线，请与我司联系！");
        }
        String key = rateLimiter.key();
        int time = rateLimiter.time();
        int count = rateLimiter.count();
        String combineKey = getCombineKey(rateLimiter, point);
        List<Object> keys = Collections.singletonList(combineKey);
        try {
            Long number = redisTemplate.execute(limitScript, keys, count, time);
            if (null == number || number.intValue() > count) {
                if (rateLimiter.joinBlackList()){
                    BlackList blackList = new BlackList();
                    blackList.setPhone(loginMember.getPhone());
                    blackList.setIsValid("1");
                    blackList.setOperTime(DateUtil.getToday());
                    blackListService.insert(blackList);
                }
                throw new RateLimiterException("访问已达上线，请稍后重试！");
            }
            log.info("限制请求'{}',当前请求'{}',缓存key'{}'", count, number.intValue(), key);
        } catch (Exception e) {
            throw new RateLimiterException("访问已达上线，请与我司联系！");
        }
    }

    public String getCombineKey(RateLimiter rateLimiter, JoinPoint point) {
        StringBuffer stringBuffer = new StringBuffer(rateLimiter.key());
        if (rateLimiter.limitType() == LimitType.LOGIN_PHONE) {
            LoginMember loginMember = apiTokenService.getLoginMember(ServletUtils.getRequest());
            stringBuffer.append(loginMember.getPhone()).append("-");
        }
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        Class<?> targetClass = method.getDeclaringClass();
        stringBuffer.append(targetClass.getName()).append("-").append(method.getName());
        return stringBuffer.toString();
    }
}
```


## 总结

这套限流方案具有以下优点：
- **灵活性**: 通过注解配置，轻松应用到任意方法
- **扩展性**: 支持多种限流维度和策略
- **可靠性**: 基于Redis的分布式锁保证数据一致性
- **安全性**: 内置黑名单机制增强安全防护

通过合理的限流策略设计，可以在保证用户体验的同时，有效保护系统稳定性，是高并发场景下的重要技术手段。