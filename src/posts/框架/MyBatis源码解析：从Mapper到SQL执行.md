---
title: MyBatis源码解析：从Mapper到SQL执行
date: 2026-08-27
category: 框架
tag: ["MyBatis", "源码", "ORM", "SQL"]
---

# MyBatis源码解析：从Mapper到SQL执行

> MyBatis是Java生态最流行的ORM框架之一，理解其源码能帮助你更好地优化SQL和排查问题。
> 本文深入剖析MyBatis的核心流程、源码分析和实战技巧，帮助你掌握MyBatis的精髓。

## 一、MyBatis架构概览

### 1.1 核心组件

```
MyBatis架构：

┌─────────────────────────────────────────────────────────────┐
│                    接口层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ SqlSession   │  │ Mapper      │  │  Annotations        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    核心处理层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Configuration│  │ MappedStatement│ │ SqlSource          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    基础支撑层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ DataSource   │  │ Transaction │  │  Cache              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心类

| 类名 | 作用 |
|------|------|
| SqlSessionFactory | 创建SqlSession |
| SqlSession | 与数据库交互 |
| Executor | 执行SQL |
| StatementHandler | 处理Statement |
| ParameterHandler | 设置参数 |
| ResultSetHandler | 处理结果集 |

## 二、Mapper代理原理

### 2.1 Mapper接口注册

```java
// Mapper接口注册流程
// 1. 扫描Mapper接口
@MapperScan
public class MapperScannerConfigurer implements BeanDefinitionRegistryPostProcessor {
    
    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        // 扫描Mapper接口
        ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
        scanner.scan(basePackages);
    }
}

// 2. 创建MapperProxyFactory
// 3. 注册到Spring容器
```

### 2.2 MapperProxy源码

```java
public class MapperProxy<T> implements InvocationHandler, Serializable {
    
    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethodInvoker> methodCache;
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 如果是Object方法，直接调用
        if (Object.class.equals(method.getDeclaringClass())) {
            return method.invoke(this, args);
        }
        
        // 获取或创建MapperMethodInvoker
        return cachedInvoker(method).invoke(proxy, method, args, sqlSession);
    }
}

// MapperMethodInvoker
private class PlainMethodInvoker implements MapperMethodInvoker {
    @Override
    public Object invoke(Object proxy, Method method, Object[] args, SqlSession sqlSession) {
        // 创建MapperMethod
        MapperMethod mapperMethod = new MapperMethod(mapperInterface, method, sqlSession.getConfiguration());
        // 执行SQL
        return mapperMethod.execute(sqlSession, args);
    }
}
```

## 三、SQL执行流程

### 3.1 执行流程图

```
Mapper方法调用流程：

┌─────────────────────────────────────────────────────────────┐
│  1. MapperProxy.invoke()                                    │
│     └─ 创建MapperMethod                                     │
├─────────────────────────────────────────────────────────────┤
│  2. MapperMethod.execute()                                  │
│     ├─ SELECT → sqlSession.selectOne/selectList             │
│     ├─ INSERT → sqlSession.insert                           │
│     ├─ UPDATE → sqlSession.update                           │
│     └─ DELETE → sqlSession.delete                           │
├─────────────────────────────────────────────────────────────┤
│  3. DefaultSqlSession.selectList()                          │
│     └─ Executor.query()                                     │
├─────────────────────────────────────────────────────────────┤
│  4. BaseExecutor.query()                                    │
│     ├─ 一级缓存查询                                         │
│     └─ SimpleExecutor.doQuery()                             │
├─────────────────────────────────────────────────────────────┤
│  5. SimpleExecutor.doQuery()                                │
│     ├─ 创建StatementHandler                                 │
│     ├─ StatementHandler.prepare()                           │
│     ├─ ParameterHandler.setParameters()                     │
│     └─ ResultSetHandler.handleResultSets()                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 源码分析

```java
// Executor查询流程
public abstract class BaseExecutor implements Executor {
    
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter, 
                            RowBounds rowBounds, ResultHandler resultHandler) {
        // 创建BoundSql
        BoundSql boundSql = ms.getBoundSql(parameter);
        
        // 创建缓存Key
        CacheKey key = createCacheKey(ms, parameter, rowBounds, boundSql);
        
        return query(ms, parameter, rowBounds, resultHandler, key, boundSql);
    }
    
    @Override
    public <E> List<E> query(MappedStatement ms, Object parameter,
                            RowBounds rowBounds, ResultHandler resultHandler,
                            CacheKey key, BoundSql boundSql) {
        // 一级缓存查询
        List<E> list = (List<E>) localCache.getObject(key);
        if (list != null) {
            handleLocallyCachedOutputParameters(ms, parameter, boundSql, key, resultHandler);
        } else {
            // 查询数据库
            list = queryFromDatabase(ms, parameter, rowBounds, resultHandler, key, boundSql);
        }
        return list;
    }
}
```

## 四、缓存机制

### 4.1 一级缓存

```java
// 一级缓存：SqlSession级别
public class PerpetualCache implements Cache {
    private Map<Object, Object> cache = new HashMap<>();
    
    @Override
    public Object getObject(Object key) {
        return cache.get(key);
    }
    
    @Override
    public void putObject(Object key, Object value) {
        cache.put(key, value);
    }
}

// 一级缓存生命周期：
// 1. SqlSession创建时初始化
// 2. 同一个SqlSession内多次查询相同数据
// 3. 执行增删改操作会清空一级缓存
// 4. SqlSession关闭时销毁
```

### 4.2 二级缓存

```java
// 二级缓存：Mapper级别
// 配置：在Mapper.xml中添加<cache/>

// 二级缓存流程：
// 1. SqlSession提交或关闭时，将数据写入二级缓存
// 2. 下一个SqlSession查询时，从二级缓存获取
// 3. 二级缓存支持分布式(需要实现Cache接口)

// 注意：
// - 二级缓存默认关闭
// - 增删改操作会清空二级缓存
// - 多表关联查询会导致二级缓存失效
```

## 五、动态SQL

### 5.1 动态SQL标签

```xml
<!-- if标签 -->
<if test="name != null">
    AND name = #{name}
</if>

<!-- choose标签 -->
<choose>
    <when test="status != null">
        AND status = #{status}
    </when>
    <otherwise>
        AND status = 'ACTIVE'
    </otherwise>
</choose>

<!-- foreach标签 -->
<foreach collection="ids" item="id" open="(" separator="," close=")">
    #{id}
</foreach>

<!-- where标签 -->
<where>
    <if test="name != null">AND name = #{name}</if>
    <if test="status != null">AND status = #{status}</if>
</where>
```

### 5.2 动态SQL源码

```java
// SqlSource解析动态SQL
public class DynamicSqlSource implements SqlSource {
    
    private final List<SqlNode> sqlNodes;
    
    @Override
    public BoundSql getBoundSql(Object parameterObject) {
        DynamicContext context = new DynamicContext(configuration, parameterObject);
        
        // 应用所有SqlNode
        for (SqlNode sqlNode : sqlNodes) {
            sqlNode.apply(context);
        }
        
        // 处理动态SQL
        SqlSourceBuilder sqlSourceParser = new SqlSourceBuilder(configuration);
        StaticSqlSource sqlSource = sqlSourceParser.parse(
            context.getSql(), 
            parameterType, 
            context.getBindings()
        );
        
        return sqlSource.getBoundSql(parameterObject);
    }
}
```

## 六、插件机制

### 6.1 插件原理

```java
// Interceptor接口
public interface Interceptor {
    Object intercept(Invocation invocation) throws Throwable;
    
    default Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    default void setProperties(Properties properties) {}
}

// Plugin类
public class Plugin implements InvocationHandler {
    
    private final Object target;
    private final Interceptor interceptor;
    private final Map<Class<?>, Set<Method>> signatureMap;
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Set<Method> methods = signatureMap.get(method.getDeclaringClass());
        if (methods != null && methods.contains(method)) {
            return interceptor.intercept(new Invocation(target, method, args));
        }
        return method.invoke(target, args);
    }
}
```

### 6.2 自定义插件

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class QueryPlugin implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = invocation.proceed();
        long cost = System.currentTimeMillis() - start;
        
        if (cost > 1000) {
            log.warn("Slow query detected, cost: {}ms", cost);
        }
        
        return result;
    }
}

// 注册插件
@Configuration
public class MyBatisConfig {
    @Bean
    public Interceptor queryPlugin() {
        return new QueryPlugin();
    }
}
```

## 七、实战技巧

### 7.1 SQL优化

| 技巧 | 说明 |
|------|------|
| 使用索引 | 确保WHERE条件字段有索引 |
| 避免SELECT * | 只查询需要的字段 |
| 分页查询 | 使用LIMIT分页 |
| 批量操作 | 使用batch执行 |

### 7.2 性能监控

```java
// 配置慢SQL监控
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl

// 或使用插件
@Intercepts({
    @Signature(type = StatementHandler.class, method = "query",
               args = {Statement.class, ResultHandler.class})
})
public class SlowSqlPlugin implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Statement stmt = (Statement) invocation.getArgs()[0];
        String sql = stmt.toString();
        
        long start = System.currentTimeMillis();
        Object result = invocation.proceed();
        long cost = System.currentTimeMillis() - start;
        
        if (cost > 1000) {
            log.warn("Slow SQL detected, cost: {}ms, sql: {}", cost, sql);
        }
        
        return result;
    }
}
```

## 八、最佳实践

### 8.1 使用建议

| 建议 | 说明 |
|------|------|
| 使用@Mapper | 使用@Mapper注解代替XML配置 |
| 使用@Select | 简单SQL使用注解 |
| 使用XML | 复杂SQL使用XML |
| 使用ResultMap | 复杂映射使用ResultMap |

### 8.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| N+1问题 | 嵌套查询 | 使用JOIN或延迟加载 |
| 缓存不一致 | 二级缓存 | 关闭二级缓存或使用分布式缓存 |
| SQL注入 | 字符串拼接 | 使用#{}代替${} |

