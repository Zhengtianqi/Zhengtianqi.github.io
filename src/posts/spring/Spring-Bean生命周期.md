---
title: Spring Bean作用域与生命周期
author: ztq
tag:

  - spring
category:
  - java基础
date: 2019-11-14 16:52:00

---

# 一、Spring Bean生命周期

![img](/assets/images/clip_image002.png)

解释：

- Spring 通过我们的配置，如 @ComponentScan 定义的扫描路径去找到带有 @Component     的类，这个过程就是一个资源定位的过程。
- 一旦找到了资源，那么它就开始解析，并且将定义的信息保存起来。注意，此时还没有初始化 Bean ，也就没有 Bean 实例，它有的仅仅是 Bean 的定义。
- 然后就会把 Bean 定义发布到 Spring IoC 容器中，此时，IoC容器也只有 Bean 的定义，还是没有 Bean 的实例生成。

  在默认的情况下，Spring会继续去完成Bean的实例化和依赖注入， 这样从IoC容器中就可以得到一个依赖注入完成的Bean。但是，有些Bean会在取的时候才初始化和依赖注入。如下图：

 ![img](/assets/images/clip_image004.png)

解释：

- 其中流程节点针对于单个Bean，BeanPostProcessor是针对所有Bean而言。
- 即使你定义了ApplicationContextAware接口，但是有时候并不会调用，这要根据你的IoC容器来决定。
- Spring IoC     容器的最低要求是实现 BeanFactory 接口，而不是实现 ApplicationContext 接口。对于那些没有实现     ApplicationContext 接口的容器，对生命周期对应的 ApplicationContextAware     定义的方法也是不会被调用的，只有实现了 ApplicationContext 接口的容器，才会在生命周期调用 ApplicationContextAware 所定义的     setApplicationContext 方法。



# 二、Spring Bean作用域

## 1、使用@Profile

#### 1）假设存在dev_spring_boot 和 test_spring_boot两个数据库，使用注解@Profile定义两个Bean

    ![img](/assets/images/SpringBean3.png)

#### 2）在 Java 启动项目中，我们只需要如下配置就能启动Profile机制：

	-Dspring.profiles.active=dev

	注：Spring 会先判定是否存在 spring.profiles.active 配置后，再去查找 spring.profiles.default 配置的，所以 spring.profiles.active 的优先级要大于 spring.profiles.default

#### 3）按照 springboot 的规则

	-Dspring.profiles.active 配置的值记为 {profile} ，则它会用 application-{profiles}.properties 文件去代替原来默认的 application.properties文件

## 2、使用 Spring EL

####   1）读取属性文件的值，如：

```java
// ${......} 代表占位符
@Value("${database.driverName}")   
String driver
```

 

####   2）记录一个Bean初始化事件，如：

```java
// #{......} 代表启用 Spring表达式，它将具有运算功能；T(......)代表的是引入类
@Value("#{T(System).currentTimeMillis()}")  
private Long initTime = null;
//直接赋值： 赋值字符串
@Value("#{‘使用 Spring EL 赋值字符串’}")
private String str = null;
// 科学计数法赋值
@Value("#{9.3E3}")
private double d;
// 其他Spring Bean属性赋值当前的Bean
@Value("#{beanName.str}")
private String otherBeanProp = null;
```

还可以进行计算、三元运算、比较等。

 

 