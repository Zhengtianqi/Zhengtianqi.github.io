---
title: JVM 类加载机制深度剖析：双亲委派、打破与热部署实战
tag: ["JVM", "类加载", "双亲委派", "热部署", "SPI"]
category: 基础知识
date: 2026-07-02
---

# JVM 类加载机制深度剖析：双亲委派、打破与热部署实战

Tomcat 为什么能部署多个应用？SPI 机制怎么打破双亲委派？热更新怎么实现？类加载是 JVM 的核心机制，也是 Spring、Tomcat、SPI 的底层基础。

---

## 一、类加载过程

### 1.1 七个阶段

```
加载 → 验证 → 准备 → 解析 → 初始化 → 使用 → 卸载
 ├─────── 连接 ──────────┤
 
1. 加载（Loading）：
   通过类全限定名获取字节流（从 jar/class 文件/网络/动态生成）
   将字节流转换为方法区的运行时数据结构
   在堆中生成 Class 对象，作为方法区数据的入口

2. 验证（Verification）：
   文件格式验证：魔数 0xCAFEBABE、版本号
   元数据验证：语义分析（是否有父类、是否继承 final 类）
   字节码验证：方法体逻辑验证（操作数栈、类型转换）
   符号引用验证：引用的类/方法/字段是否存在

3. 准备（Preparation）：
   为类变量（static）分配内存并赋默认值
   int → 0, boolean → false, 引用 → null
   注意：不是代码中赋的值！
   static int x = 123; → 准备阶段 x = 0，初始化阶段 x = 123
   特殊：static final（常量）在准备阶段就赋值
   static final int x = 123; → 准备阶段 x = 123

4. 解析（Resolution）：
   将常量池中的符号引用替换为直接引用
   符号引用：字符串表示的引用（"java/lang/String"）
   直接引用：内存地址/偏移量

5. 初始化（Initialization）：
   执行类构造器 <clinit>() 方法
   <clinit> = 所有 static 变量赋值 + static 代码块
   按代码顺序执行
   JVM 保证 <clinit> 线程安全（多线程同时触发初始化时同步）

6. 使用（Using）：正常使用

7. 卸载（Unloading）：
   Class 对象被 GC 回收
   条件：该类所有实例被回收 + 加载该类的 ClassLoader 被回收 + Class 对象无引用
```

### 1.2 初始化时机

```java
// 主动引用（触发初始化）
1. new 对象
   new Order();  // 触发 Order 类初始化

2. 访问静态字段（非 final）
   System.out.println(Order.count);  // 触发初始化

3. 访问静态方法
   Order.doSomething();  // 触发初始化

4. 反射
   Class.forName("com.Order");  // 触发初始化

5. 初始化子类时，父类先初始化
   class Child extends Parent {}
   new Child();  // 先初始化 Parent，再初始化 Child

6. 主类（含 main() 的类）首次运行

// 被动引用（不触发初始化）
1. 通过子类访问父类静态字段
   class Parent { static int count = 1; }
   class Child extends Parent {}
   System.out.println(Child.count);  // 只初始化 Parent，不初始化 Child

2. 创建数组
   Order[] orders = new Order[10];  // 不触发 Order 初始化

3. 访问 static final 常量
   class Config { static final String NAME = "app"; }
   System.out.println(Config.NAME);  // 不触发初始化（常量在准备阶段就赋值）
```

---

## 二、类加载器

### 2.1 三层类加载器

```
Bootstrap ClassLoader（启动类加载器）：
  C++ 实现，加载 <JAVA_HOME>/lib 目录（rt.jar 等）
  加载 java.lang.String, java.lang.Object 等核心类
  无法在 Java 代码中直接引用
  
  ↓ 父加载器

Extension ClassLoader（扩展类加载器）→ Java 9+ 改名 Platform ClassLoader：
  加载 <JAVA_HOME>/lib/ext 目录
  Java 9+ 加载 JDK 模块
  
  ↓ 父加载器

Application ClassLoader（应用类加载器）：
  加载 classpath 下的类
  用户编写的类由它加载
  
  ↓ 父加载器

Custom ClassLoader（自定义类加载器）：
  继承 URLClassLoader 或 ClassLoader
  实现 findClass()
```

### 2.2 验证

```java
// 查看类的加载器
System.out.println(String.class.getClassLoader());
// null → Bootstrap ClassLoader

System.out.println(Order.class.getClassLoader());
// sun.misc.Launcher$AppClassLoader@18b4aac2

System.out.println(Order.class.getClassLoader().getParent());
// sun.misc.Launcher$ExtClassLoader@76ed5528

System.out.println(Order.class.getClassLoader().getParent().getParent());
// null → Bootstrap ClassLoader
```

---

## 三、双亲委派模型

### 3.1 原理

```
双亲委派（Parent Delegation）：

  Custom ClassLoader
       ↓ 先问父加载器
  Application ClassLoader
       ↓ 先问父加载器
  Extension ClassLoader
       ↓ 先问父加载器
  Bootstrap ClassLoader
       ↓ 能加载吗？
  Bootstrap 加载成功 → 返回
  Bootstrap 加载失败 → 回退给 Extension
  Extension 加载成功 → 返回
  Extension 加载失败 → 回退给 Application
  Application 加载成功 → 返回
  Application 加载失败 → 回退给 Custom
  Custom 加载成功 → 返回
  Custom 加载失败 → ClassNotFoundException

核心逻辑（ClassLoader.loadClass）：
  1. 检查是否已加载（findLoadedClass）
  2. 委托父加载器加载（parent.loadClass）
  3. 父加载器加载失败，自己加载（findClass）
```

### 3.2 为什么要双亲委派

```
1. 安全性：防止核心类被篡改
   用户写一个 java.lang.String → 会被 Bootstrap 加载真正的 String
   用户写的假 String 永远不会被加载

2. 唯一性：同一个类只被加载一次
   java.lang.Object 永远由 Bootstrap 加载
   所有代码看到的 Object 是同一个

3. 层次清晰：核心类由高层加载器加载
  应用类由低层加载器加载
```

### 3.3 源码

```java
// ClassLoader.loadClass() 源码（简化）
protected Class<?> loadClass(String name, boolean resolve) {
    // 1. 检查是否已加载
    Class<?> c = findLoadedClass(name);
    
    if (c == null) {
        try {
            // 2. 委托父加载器
            if (parent != null) {
                c = parent.loadClass(name, false);
            } else {
                c = findBootstrapClassOrNull(name);
            }
        } catch (ClassNotFoundException e) {
            // 父加载器加载失败
        }
        
        if (c == null) {
            // 3. 自己加载
            c = findClass(name);
        }
    }
    
    if (resolve) {
        resolveClass(c);
    }
    return c;
}
```

---

## 四、打破双亲委派

### 4.1 什么时候需要打破

```
场景 1：Tomcat（Web 容器）
  需求：多个 Web 应用可能依赖不同版本的 jar
  问题：双亲委派下，先加载的版本会屏蔽后加载的
  方案：每个 Web 应用一个 ClassLoader，优先自己加载

场景 2：SPI 机制（Service Provider Interface）
  需求：核心接口在 Bootstrap 加载，实现类在 classpath
  问题：Bootstrap 加载不了 classpath 的类
  方案：线程上下文 ClassLoader

场景 3：热部署
  需求：不重启应用更新代码
  问题：已加载的类不会被重新加载
  方案：创建新 ClassLoader 加载新版本

场景 4：OSGi
  需求：模块化，每个模块独立类加载
  方案：网状类加载器结构
```

### 4.2 Tomcat 打破双亲委派

```
Tomcat 类加载器结构：

  Bootstrap
    ↓
  Extension
    ↓
  Application
    ↓
  ┌──────────────────────────┐
  │   Shared ClassLoader      │  共享类（多个 Web 应用共用）
  │       ↓                   │
  │   ┌──────────────────┐    │
  │   │ WebApp ClassLoader│    │  每个 Web 应用独立
  │   │   (WebApp1)       │    │  优先自己加载 → 打破双亲委派
  │   └──────────────────┘    │
  │   ┌──────────────────┐    │
  │   │ WebApp ClassLoader│    │
  │   │   (WebApp2)       │    │
  │   └──────────────────┘    │
  └──────────────────────────┘

Tomcat WebAppClassLoader 的 loadClass 逻辑：
  1. 检查本地缓存
  2. 检查 JVM 缓存（findLoadedClass）
  3. 加载 JVM 系统类（用 Bootstrap，防止覆盖核心类）
  4. 先自己加载（Web-INF/classes, Web-INF/lib）← 打破双亲委派
  5. 最后委托父加载器
```

### 4.3 SPI 机制与线程上下文 ClassLoader

```java
// JDBC SPI 机制
// 接口：java.sql.Driver（Bootstrap 加载）
// 实现：com.mysql.cj.jdbc.Driver（classpath，Application 加载）

// 问题：Bootstrap 加载 java.sql.DriverManager
//       但 DriverManager 需要加载 classpath 下的 Driver 实现
//       Bootstrap 无法加载 classpath 的类！

// 解决：线程上下文 ClassLoader
//       Application 设置 TCCL，Bootstrap 通过 TCCL 加载实现类

// DriverManager 加载 Driver 实现的源码（简化）
public class DriverManager {
    static {
        // 用线程上下文 ClassLoader 加载 SPI 实现
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        ServiceLoader<Driver> loaders = ServiceLoader.load(Driver.class, cl);
        for (Driver driver : loaders) {
            registerDriver(driver);
        }
    }
}

// 线程上下文 ClassLoader 默认是 Application ClassLoader
// 应用可以通过 setContextClassLoader() 自定义
Thread.currentThread().setContextClassLoader(customLoader);
```

### 4.4 自定义 ClassLoader 实现热部署

```java
public class HotReloadClassLoader extends ClassLoader {
    
    private final String classPath;
    
    public HotReloadClassLoader(String classPath, ClassLoader parent) {
        super(parent);
        this.classPath = classPath;
    }
    
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // 打破双亲委派：自己先加载，不走 parent
        String fileName = classPath + "/" + name.replace('.', '/') + ".class";
        
        try {
            byte[] bytes = Files.readAllBytes(Paths.get(fileName));
            // defineClass 将字节码转为 Class 对象
            return defineClass(name, bytes, 0, bytes.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }
    
    // 热部署：创建新的 ClassLoader 加载新版本
    public static void hotReload() {
        // 新 ClassLoader 加载新版本类
        HotReloadClassLoader newLoader = new HotReloadClassLoader(
            "/data/classes", 
            ClassLoader.getSystemClassLoader()
        );
        
        try {
            Class<?> clazz = newLoader.loadClass("com.order.Service");
            Object instance = clazz.getDeclaredConstructor().newInstance();
            // 使用新实例
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // 旧 ClassLoader 失去引用 → GC 回收旧类
    }
}
```

---

## 五、类初始化面试陷阱

### 5.1 经典题

```java
// 题目：输出什么？
class Parent {
    static int a = 1;
    static {
        a = 2;
        b = 2;  // 可以给后面的 static 变量赋值
    }
    static int b = 3;
}

class Child extends Parent {
    static int c = a + b;
}

System.out.println(Child.c);
// 答案：5
// 解析：
// 1. 访问 Child.c → 触发 Child 初始化 → 先触发 Parent 初始化
// 2. Parent 初始化（按代码顺序）：
//    a = 1（准备阶段默认 0，初始化阶段 = 1）
//    static 块：a = 2, b = 2
//    b = 3
// 3. 此时 Parent.a = 2, Parent.b = 3
// 4. Child 初始化：c = a + b = 2 + 3 = 5
```

### 5.2 单例陷阱

```java
// 题目：输出什么？
class Singleton {
    private static Singleton instance = new Singleton();
    private static int a = 0;
    private static int b;
    
    private Singleton() {
        a++;
        b++;
    }
    
    public static Singleton getInstance() {
        return instance;
    }
    
    public static void main(String[] args) {
        Singleton s = Singleton.getInstance();
        System.out.println("a=" + s.a);  // a=0
        System.out.println("b=" + s.b);  // b=1
    }
}

// 解析：
// 初始化顺序：
// 1. instance = new Singleton() → 构造函数执行：a++ (0→1), b++ (0→1)
// 2. a = 0  ← 覆盖了构造函数的 a=1
// 3. b 没有显式赋值，保持 1
// 结果：a=0, b=1
// 教训：初始化顺序按代码位置执行，static 变量赋值会覆盖构造函数的修改
```

---

## 六、面试要点

### Q：什么是双亲委派？为什么要打破？

双亲委派：类加载时先委托父加载器加载，父加载器加载不了才自己加载。保证核心类安全且唯一。

打破场景：
- Tomcat：每个 Web 应用独立 ClassLoader，优先自己加载，实现应用间 jar 版本隔离
- SPI：核心接口由 Bootstrap 加载，实现类在 classpath，用线程上下文 ClassLoader 打破
- 热部署：创建新 ClassLoader 加载新版本类，旧 ClassLoader 被 GC 回收

### Q：Tomcat 的类加载器为什么打破双亲委派？

Tomcat 支持多个 Web 应用部署在同一个 JVM 中，不同应用可能依赖同一个 jar 的不同版本。双亲委派下，先加载的版本会屏蔽后加载的。Tomcat 的 WebAppClassLoader 优先加载 Web-INF/classes 和 Web-INF/lib，实现应用间类隔离。但核心类（java.lang.*）仍走双亲委派，防止被篡改。

### Q：类加载的初始化阶段做什么？

执行 `<clinit>()` 方法，包含所有 static 变量赋值和 static 代码块，按代码顺序执行。JVM 保证 `<clinit>` 线程安全。注意：static 变量在准备阶段赋默认值（0/null/false），在初始化阶段才赋代码值。static final 常量在准备阶段直接赋值。

---

## 七、总结

类加载核心知识：

```
加载过程：加载 → 验证 → 准备 → 解析 → 初始化
类加载器：Bootstrap → Extension → Application → Custom
双亲委派：先委托父加载器，父加载不了自己加载
打破场景：Tomcat 隔离 / SPI / 热部署 / OSGi
初始化陷阱：按代码顺序执行，后面的覆盖前面的
```

记住：**双亲委派保安全，打破它做隔离，SPI 用 TCCL，热部署用新 ClassLoader**。
