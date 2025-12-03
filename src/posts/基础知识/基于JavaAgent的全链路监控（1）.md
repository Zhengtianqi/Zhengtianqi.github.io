---
title: 基于JavaAgent的全链路监控（1）
author: zheng
tag:

  - javaagent
category:
  - java基础
date: 2020-07-17 13:11:00

---

# 《手写一个最简单的javaagent》

# 1、javaagent介绍

		在使用skywalking时，使用到了Javaagent技术作为节点的探针，使用Javaagent做字节码植入，无侵入式的收集，并通过HTTP或者gRPC方式发送数据到Skywalking Collector。

		后来查阅资料发现javaagent用途还是很广的，有JRebel，各种线上诊断工具（Btrace, Greys），还有阿里开源的 Arthas，在此记录一下javaagent的学习历程。

		其实 Java Agent 一点都不神秘，也是一个 Jar 包，只是启动方式和普通 Jar 包有所不同，对于普通的Jar包，通过指定类的 main 函数进行启动，但是 Java Agent 并不能单独启动，必须依附在一个 Java 应用程序运行。

		我们可以使用 Agent 技术构建一个独立于应用程序的代理程序，用来协助监测、运行甚至替换其他 JVM 上的程序，使用它可以实现虚拟机级别的 AOP 功能。

# 2、手写一个javaagent

## （1）建立maven的空java项目

		修改pom为：包含一些常量的定义和一个插件

```java
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

    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>2.4.3</version>
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
                                        <Premain-Class>cn.edu.bjut.test.AgentTest</Premain-Class>
                                    </manifestEntries>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```

## （2）MANIFEST.MF 文件

		在 META-INF 目录下创建 MANIFEST.MF 文件：

![image-20200717132223819](/assets/images/javaagent1.png)

		内容为

```java
Manifest-Version: 1.0
Premain-Class: cn.edu.bjut.test.AgentTest
Can-Redefine-Classes: true
```

## （3）写一个main函数

		因为 Java Agent 的特殊性，需要一些特殊的配置，例如指定 Agent 的启动类等。这样才能在加载 Java Agent 之后，找到并运行对应的 agentmain 或者 premain 方法。配置方式主要有两种，一种是利用 maven-assembly-plugin 插件（推荐），一种是 MANIFEST.MF 文件。

```java
import java.lang.instrument.Instrumentation;

/**
 * 测试项目启动执行的agent
 *
 * @author zhengtianqi
 */
public class AgentTest {

    /**
     * JVM 首先尝试在代理类上调用以下方法
     */
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("执行了JavaAgent " + agentArgs);
    }

    /**
     * 如果代理类没有实现上面的方法，那么 JVM 将尝试调用该方法
     */
    public static void premain(String agentArgs) {
    }

}
```

## （4）打包

		mvn clean package

# 3、运行javaagent

		Javaagent 程序写好了，怎么运行它呢？上面看到 Agent 程序分为两种，一种是 premain 函数，在主程序运行之前执行；一种是 agentmain 函数，在主程序运行之后执行。Java 加载这两种 Agent 程序也有区别：

## （1）主程序运行前

		无侵入式，通过 JVM 参数 -javaagent:**.jar[=test] 启动，其中 test 为传入 premain 的 agentArgs 的参数，程序启动的时候，会优先加载 Java Agent，并执行其 premain 方法，这个时候，其实大部分的类都还没有被加载，这个时候可以实现对新加载的类进行字节码修改，但是如果 premain 方法执行失败或抛出异常，那么 JVM 会被中止，这是很致命的问题。

## （2）主程序运行后加载

		有侵入式，程序启动之后，通过某种特定的手段加载 Java Agent，这个特定的手段就是 VirtualMachine 的 attach api，这个 api 其实是 JVM 进程之间的的沟通桥梁，底层通过socket 进行通信，JVM A 可以发送一些指令给JVM B，B 收到指令之后，可以执行对应的逻辑，比如在命令行中经常使用的 jstack、jps 等，很多都是基于这种机制实现的。

		VirtualMachine 的实现位于 tools.jar 中

```java
<dependency>
            <groupId>com.sun</groupId>
            <artifactId>tools</artifactId>
            <version>1.8</version>
            <scope>system</scope>
            <systemPath>${java.home}/../lib/tools.jar</systemPath>
        </dependency>
```

因为是进程间通信，所以使用 attach api 的也是一个独立的Java进程，下面是一个简单的实现：

```java
 public static void main(String[] args) throws IOException, AttachNotSupportedException, AgentLoadException, AgentInitializationException {
        VirtualMachine virtualMachine = null;
        try {
            // 80000 是进程号
            virtualMachine = VirtualMachine.attach("80000");
            // 第一个参数是 agent jar包路径，第二个参数为传入 agentmain 的 args 参数
            virtualMachine.loadAgent("D:\git\credible\checkpoint-agent\target\checkpoint-agent-1.0-SNAPSHOT.jar", "test");
        } finally {
            if (virtualMachine != null) {
                virtualMachine.detach();
            }
        }

    }
```

