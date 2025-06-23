---
title: 基于JavaAgent的全链路监控（2）
author: ztq
tag:
  - javaagent
category:
  - java基础
date: 2020-07-19 16:54:00

---

# 《利用javaagent进行方法耗时的监控》

## 1、介绍

		方法耗时利用前人轮子字节码操作工具ByteBuddy：Byte Buddy是一个代码生成和操作库，用于在Java应用程序运行时创建和修改Java类，而无需编译器的帮助。 除了Java类库附带的代码生成实用程序外，Byte Buddy还允许创建任意类，并且不限于实现用于创建运行时代理的接口。 此外，Byte Buddy提供了一个方便的API，可以使用Java代理或在构建过程中手动更改类。

## 2、pom.xml

 引入ByteBuddy并打入到Agent包中

```java
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>cn.edu.bjut</groupId>
    <artifactId>checkpoint-agent</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>

        <!-- Build args -->
        <argline>-Xms512m -Xmx512m</argline>
        <updateReleaseInfo>true</updateReleaseInfo>
        <maven.test.skip>true</maven.test.skip>
        <!-- 自定义MANIFEST.MF -->
        <maven.configuration.manifestFile>src/main/resources/META-INF/MANIFEST.MF</maven.configuration.manifestFile>

        <javassist.version>3.12.1.GA</javassist.version>
        <guava.version>15.0</guava.version>
        <byte-buddy.version>1.8.20</byte-buddy.version>
        <maven-shade-plugin.version>2.4.3</maven-shade-plugin.version>

        <maven-compiler-plugin.version>3.8.1</maven-compiler-plugin.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>javassist</groupId>
            <artifactId>javassist</artifactId>
            <version>${javassist.version}</version>
        </dependency>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>${guava.version}</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>net.bytebuddy</groupId>
            <artifactId>byte-buddy</artifactId>
            <version>${byte-buddy.version}</version>
        </dependency>
        <dependency>
            <groupId>net.bytebuddy</groupId>
            <artifactId>byte-buddy-agent</artifactId>
            <version>${byte-buddy.version}</version>
        </dependency>
    </dependencies>
    <!-- 将javassist包打包到Agent中 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>${maven-shade-plugin.version}</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <transformers>
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <manifestEntries>
                                        <!--指明包含 premain 方法的类名，否则打包出来的文件会找不到 MANIFEST.MF -->
                                        <Premain-Class>cn.edu.bjut.agent.MyAgent</Premain-Class>
                                    </manifestEntries>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>${maven-compiler-plugin.version}</version>
                <configuration>
                    <source>8</source>
                    <target>8</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## 3、MethodCostTime.java

```java
package cn.edu.bjut.monitor;

import net.bytebuddy.implementation.bind.annotation.Origin;
import net.bytebuddy.implementation.bind.annotation.RuntimeType;
import net.bytebuddy.implementation.bind.annotation.SuperCall;

import java.lang.reflect.Method;
import java.util.concurrent.Callable;

/**
 * @author zhengtianqi
 */
public class MethodCostTime {

    @RuntimeType
    public static Object intercept(@Origin Method method, @SuperCall Callable<?> callable) throws Exception {
        long start = System.currentTimeMillis();
        try {
            // 原有函数执行
            return callable.call();
        } finally {
            System.out.println(method + " 方法耗时：" + (System.currentTimeMillis() - start) + "ms");
        }
    }
}

```

## 4、MyAgent.java

```java
package cn.edu.bjut.agent;

import cn.edu.bjut.monitor.JvmStack;
import cn.edu.bjut.monitor.MethodCostTime;
import com.google.common.util.concurrent.ThreadFactoryBuilder;
import net.bytebuddy.agent.builder.AgentBuilder;
import net.bytebuddy.description.type.TypeDescription;
import net.bytebuddy.dynamic.DynamicType;
import net.bytebuddy.implementation.MethodDelegation;
import net.bytebuddy.matcher.ElementMatchers;
import net.bytebuddy.utility.JavaModule;

import java.lang.instrument.Instrumentation;
import java.util.concurrent.*;

/**
 * @author zhengtianqi
 */
public class MyAgent {

    /**
     * JVM 首先尝试在代理类上调用以下方法
     */
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("this is my agent：" + agentArgs);

        AgentBuilder.Transformer transformer = (builder, typeDescription, classLoader, javaModule) -> {
            return builder
                    // 拦截任意方法
                    .method(ElementMatchers.any())
                    // 委托
                    .intercept(MethodDelegation.to(MethodCostTime.class));
        };

        AgentBuilder.Listener listener = new AgentBuilder.Listener() {
            @Override
            public void onDiscovery(String s, ClassLoader classLoader, JavaModule javaModule, boolean b) {

            }

            @Override
            public void onTransformation(TypeDescription typeDescription, ClassLoader classLoader, JavaModule javaModule, boolean b, DynamicType dynamicType) {

            }

            @Override
            public void onIgnored(TypeDescription typeDescription, ClassLoader classLoader, JavaModule javaModule, boolean b) {

            }

            @Override
            public void onError(String s, ClassLoader classLoader, JavaModule javaModule, boolean b, Throwable throwable) {

            }

            @Override
            public void onComplete(String s, ClassLoader classLoader, JavaModule javaModule, boolean b) {

            }

        };

        new AgentBuilder
                .Default()
                // 指定需要拦截的类
                .type(ElementMatchers.nameStartsWith("cn.edu.bjut"))
                .transform(transformer)
                .with(listener)
                .installOn(inst);

    /**
     * 如果代理类没有实现上面的方法，那么 JVM 将尝试调用该方法
     */
    public static void premain(String agentArgs) {
    }
}

```

## 5、MANIFEST.MF

```java
Manifest-Version: 1.0
Premain-Class: cn.edu.bjut.agent.MyAgent
Can-Redefine-Classes: true
```

## 6、测试

```java
VM options: -javaagent:D:\git\credible\checkpoint-agent\target\checkpoint-agent-1.0-SNAPSHOT.jar=testargs
```

![image-20200719170509172](/assets/images/agent-costtime2.png)

结果：

![image-20200719170325930](/assets/images/agent-costtime.png)