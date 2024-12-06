---
title: 手写一个简单Autowired
author: ztq
tag:
  - spring
category:
  - spring
date: 2020-09-11 10:49:00

---

# 1、按照惯例

首先写一个controller和service

```java
package cn.edu.bjut.spring.controller;

import cn.edu.bjut.spring.Autowired;
import cn.edu.bjut.spring.service.UserService;

public class UserController {
    @Autowired
    private UserService userService;
    
}

```

```java
package cn.edu.bjut.spring.service;

public class UserService {
    public String findUserById(String id) {
        return null;
    }
}

```

# 2、Autowired注解的定义

```java
package cn.edu.bjut.spring;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Autowired {

}

```

# 3、注入的方法

利用反射

```java
package cn.edu.bjut.spring;

import cn.edu.bjut.spring.controller.UserController;
import java.util.stream.Stream;

public class TestAutowired {
    public static void main(String[] args) {
        UserController userController = new UserController();
        Class<? extends UserController> clazz = userController.getClass();
        // 获取所有的属性值
        Stream.of(clazz.getDeclaredFields()).forEach(field -> {
            // 只有通过方法才能够设置具体的属性值
            String name = field.getName();

            Autowired annotation = field.getAnnotation(Autowired.class);
            if (annotation != null) {
                field.setAccessible(true);
                // 获取属性的类型
                Class<?> type = field.getType();
                try {
                    // new一个新实例
                    Object o = type.newInstance();
                    field.set(userController, o);
                } catch (InstantiationException e) {
                    e.printStackTrace();
                } catch (IllegalAccessException e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
```

