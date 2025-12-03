---
title: ThreadLocal
author: zheng
tag:

  - java
category:
  - java基础
date: 2020-03-28 09:59:00

---

引言：本博客《SimpleDateFormat引发的线程安全问题》中提到，可以利用 ThreadLocal 来解决SimpleDateFormat的线程安全问题。之后看到阿里巴巴开发规范中也有提到，SimpleDateFormat禁止使用static进行修饰。

![image-20200331153816952](/assets/images/simpleDateFormat-alibaba.png)

# 一、ThreadLocal用在什么地方？

ThreadLocal归纳下来就2类用途：

（1）保存线程上下文信息，在任意需要的地方可以获取
（2）线程安全的，避免某些情况需要考虑线程安全必须同步带来的性能损失

		由于ThreadLocal的特性，同一线程在某地方进行设置，在随后的任意地方都可以获取到。从而可以用来保存线程上下文信息。

		常用的比如每个请求怎么把一串后续关联起来，就可以用ThreadLocal进行set，在后续的任意需要记录日志的方法里面进行get获取到请求id，从而把整个请求串起来。还有比如Spring的事务管理，用ThreadLocal存储Connection，从而各个DAO可以获取同一Connection，可以进行事务回滚，提交等操作。

# 二、用一下才知道它能干什么！

```java
package cn.edu.bjut;

public class ThreadLocalTest {
    private static ThreadLocal<Integer> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) {
        // 一个线程向ThreadLocal里面写值并打印，另一个线程向ThreadLocal里取值并打印
        new Thread(() -> {
            try {
                for (int i = 0; i < 100; i++) {
                    threadLocal.set(i);
                    System.out.println(Thread.currentThread().getName() + "=" + threadLocal.get());
                    try {
                        Thread.sleep(200);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            } finally {
                threadLocal.remove();
            }
        }, "threadlocal1").start();
		// 
        new Thread(() -> {
            try {
                for (int i = 0; i < 100; i++) {
                    System.out.println(Thread.currentThread().getName() + "=" + threadLocal.get());
                    try {
                        Thread.sleep(200);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            } finally {
                threadLocal.remove();
            }
        }, "threadlocal2").start();
    }
}
```

代码的执行结果：

```java
threadlocal1=0
threadlocal2=null
threadlocal2=null
threadlocal1=1
threadlocal2=null
threadlocal1=2
.......
```

结果可以看到 ：

（1）第二个线程 是访问不到 第一个线程 所存的值的。它们存在线程的隔离。

（2）也就是说每个线程有一个自己的 ThreadLocalMap ，所以每个线程往这个 ThreadLocal 中读写隔离的，并且是互相不会影响的。

# 三、看一下它的存储

![img](/assets/images/ThreadLocal内部存储.png)

一个ThreadLocal只能存储一个Object对象，如果需要存储多个 Object 对象那么就需要多个 ThreadLocal

# 四、内存泄露？

ThreadLocal 会产生内存泄露吗？

内存泄露：我的理解就是当我们不实用 ThreadLocal 实例的时候，它没有办法 GC 掉，或者等内存将要满的时候才会发生GC。所以如果多个线程使用 ThreadLocal 的话，就会导致大量内存被占据。

Why？

为什么会这样？这就要学习一下 java 对象的引用包括 ： 强引用，软引用，弱引用，虚引用 。

弱引用也是用来描述非必需对象的，当 JVM 进行垃圾回收时，无论内存是否充足，该对象仅仅被弱引用关联，那么就会被回收。

当仅仅只有 ThreadLocalMap 中的 Entry 的 key 指向 ThreadLocal 的时候，ThreadLocal 会进行回收的！！！

ThreadLocal被垃圾回收后，在 ThreadLocalMap 里对应的 Entry 的键值会变成null，但是Entry是强引用，那么Entry里面存储的Object，并没有办法进行回收，所以 ThreadLocalMap 做了一些额外的回收工作。

》》》》》》

但是很多时候，我们都是用在线程池的场景，程序不停止，线程基本不会销毁！！！

如果使用线程池，使用不当会导致内存泄露，编码时候要养成良好的习惯，线程中使用完 ThreadLocal 变量后，要记得及时 remove 掉。

# 五、示例：线程池-线程复用带来的问题
在某些项目中，ThreadLocal用来存储用户信息，进行父子线程中的数据传递，比如下拦截器中的使用：

如果不remove掉，后面每次新请求过来，线程ThreadLocal中似乎已经有值了。

原因大概大家已经知道了，程序运行在tomcat中，执行程序的线程是tomcat的工作线程，而tomcat的工作线程是基于线程池的。

线程池会重用固定的几个线程，我们将 server.tomcat.threads.max 设置为1，把工作线程池最大线程数设置为1，这样始终是同一个线程在处理请求，因此下一个请求的线程中会遗留上一次请求的信息。

解决方案只需要在每次请求结束之后将ThreadLocal清空或者在请求之前将其清空即可。

如下代码：
```java
public class HeaderInterceptor implements AsyncHandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        SecurityContextHolder.setUserId(ServletUtils.getHeader(request, SecurityConstants.DETAILS_USER_ID));
        SecurityContextHolder.setUserName(ServletUtils.getHeader(request, SecurityConstants.DETAILS_USERNAME));
        SecurityContextHolder.setUserKey(ServletUtils.getHeader(request, SecurityConstants.USER_KEY));

        String token = SecurityUtils.getToken();
        if (StringUtils.isNotEmpty(token)) {
            LoginUser loginUser = AuthUtil.getLoginUser(token);
            if (StringUtils.isNotNull(loginUser)) {
                AuthUtil.verifyLoginUserExpire(loginUser);
                SecurityContextHolder.set(SecurityConstants.LOGIN_USER, loginUser);
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
            throws Exception {
        SecurityContextHolder.remove();
    }
}

```

```java
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.alibaba.ttl.TransmittableThreadLocal;

public class SecurityContextHolder {
    private static final TransmittableThreadLocal<Map<String, Object>> THREAD_LOCAL = new TransmittableThreadLocal<>();

    public static void set(String key, Object value) {
        Map<String, Object> map = getLocalMap();
        map.put(key, value == null ? StringUtils.EMPTY : value);
    }

    public static String get(String key) {
        Map<String, Object> map = getLocalMap();
        return Convert.toStr(map.getOrDefault(key, StringUtils.EMPTY));
    }

    public static <T> T get(String key, Class<T> clazz) {
        Map<String, Object> map = getLocalMap();
        return StringUtils.cast(map.getOrDefault(key, null));
    }

    public static Map<String, Object> getLocalMap() {
        Map<String, Object> map = THREAD_LOCAL.get();
        if (map == null) {
            map = new ConcurrentHashMap<String, Object>();
            THREAD_LOCAL.set(map);
        }
        return map;
    }

    public static void setLocalMap(Map<String, Object> threadLocalMap) {
        THREAD_LOCAL.set(threadLocalMap);
    }

    public static Long getUserId() {
        return Convert.toLong(get(SecurityConstants.DETAILS_USER_ID), 0L);
    }

    public static void setUserId(String account) {
        set(SecurityConstants.DETAILS_USER_ID, account);
    }

    public static String getUserName() {
        return get(SecurityConstants.DETAILS_USERNAME);
    }

    public static void setUserName(String username) {
        set(SecurityConstants.DETAILS_USERNAME, username);
    }

    public static String getUserKey() {
        return get(SecurityConstants.USER_KEY);
    }

    public static void setUserKey(String userKey) {
        set(SecurityConstants.USER_KEY, userKey);
    }

    public static String getPermission() {
        return get(SecurityConstants.ROLE_PERMISSION);
    }

    public static void setPermission(String permissions) {
        set(SecurityConstants.ROLE_PERMISSION, permissions);
    }

    public static void remove() {
        THREAD_LOCAL.remove();
    }
}
```

学习资源来自于： http://www.jiangxinlingdu.com/ 「公众号：匠心零度 」中的《手撕面试题threadlocal》
参考：https://blog.csdn.net/jisuanji12306/article/details/127038874
