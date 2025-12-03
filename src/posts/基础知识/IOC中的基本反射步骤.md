---
title: IOC中的基本反射步骤
author: zheng
tag:

  - spring
category:
  - spring
date: 2020-09-13 09:22:00

---

# 1、controller

```java
package cn.edu.bjut.base.spring.controller;

import cn.edu.bjut.base.spring.Autowired;
import cn.edu.bjut.base.spring.service.UserService;

public class UserController {
    
    private UserService userService;

    public UserService getUserService() {
        return userService;
    }

    public void setUserService(UserService userService) {
        this.userService = userService;
    }
}
```

# 2、service

```java
package cn.edu.bjut.base.spring.service;

public class UserService {
    public String findUserById(String id) {
        return null;
    }
}
```

# 3、TestReflect

```java
package cn.edu.bjut.base.spring;

import cn.edu.bjut.base.spring.controller.UserController;
import cn.edu.bjut.base.spring.service.UserService;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class TestReflect {
    public static void main(String[] args) throws Exception {
        UserController userController = new UserController();
        Class<? extends UserController> clazz = userController.getClass();
        // 创建对象
        UserService userService = new UserService();
        System.out.println(userService);
        // 获取所有的属性
        Field serviceField = clazz.getDeclaredField("userService");
        serviceField.setAccessible(true);
        // 只有通过方法才能够设置具体的属性值
        String name = serviceField.getName();
        // 拼接方法的名称
        name = name.substring(0, 1).toUpperCase() + name.substring(1);
        String setMethodName = "set" + name;
        // 通过方法注入属性的对象
        Method method = clazz.getMethod(setMethodName, UserService.class);
        // 反射
        method.invoke(userController, userService);
        System.out.println(userController.getUserService());
    }
}
```

