---
title: SimpleDateFormat引发的线程安全问题
author: 郑天祺
tag:
  - 并发
  - 线程安全
category:
  - java基础
date: 2019-10-12 18:42:00

---

# 	一、问题产生

​	在写java程序时，有时间戳转换的操作。

```java
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * @author zhengtianqi
 * @date 2019/10/12
 */
public class DateTrans {

    public static void main(String[] args) {

        // 将2019-10-12 18:50:30 改成 2019年10月12日
        String inDate = "2019-10-12 18:50:30";

        SimpleDateFormat inPut = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        SimpleDateFormat outPut = new SimpleDateFormat("yyyy年MM月dd日");

        try {
            Date temp = inPut.parse(inDate);
            String outDate = outPut.format(temp);

            System.out.println(outDate);

        } catch (ParseException e) {
            System.out.println("时间转换出错，出错信息为 ={}" + e);
        }

    }
}

```



涉及时间戳转换时，每次我们都new一个SimpleDateFormat对象，用起来很麻烦。

我们就把它们放到了一个常量类里，随时用随时取。

```java
/**
 * 枚举类 常量类
 *
 * @author zhengtianqi
 * @date 2019/8/16
 */
public enum ConstantUtils {
    
	public static final SimpleDateFormat IN_FORMAT = new SimpleDateFormat("yyyyMMddHHmmssSSS");
	public static final SimpleDateFormat OUT_FORMAT = new SimpleDateFormat("yyyy-MM-dd");
	public static final SimpleDateFormat VIEW_FORMAT = new SimpleDateFormat("yyyy年MM月");
	public static final SimpleDateFormat INNER_FORMAT = new SimpleDateFormat("yyyy-MM");
	public static final SimpleDateFormat RECALL_FORMAT = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
}
```

可是你想省事，麻烦就随之而来了！

先看看错误：

```java
[2019-10-12 17:45:35,468][locallog][ERROR][TID: N/A][../filters/GlobalExeption.exceptionHandler:18][10.7.5.22][] - 服务器内部错误!
java.lang.NumberFormatException: For input string: ".220188E.4220188"
        at sun.misc.FloatingDecimal.readJavaFormatString(FloatingDecimal.java:2043) ~[?:1.8.0_221]
        at sun.misc.FloatingDecimal.parseDouble(FloatingDecimal.java:110) ~[?:1.8.0_221]
        at java.lang.Double.parseDouble(Double.java:538) ~[?:1.8.0_221]
        at java.text.DigitList.getDouble(DigitList.java:169) ~[?:1.8.0_221]
        at java.text.DecimalFormat.parse(DecimalFormat.java:2089) ~[?:1.8.0_221]
        at java.text.SimpleDateFormat.subParse(SimpleDateFormat.java:1869) ~[?:1.8.0_221]
        at java.text.SimpleDateFormat.parse(SimpleDateFormat.java:1514) ~[?:1.8.0_221]
        at java.text.DateFormat.parse(DateFormat.java:364) ~[?:1.8.0_221]
```

# 二、问题查找

debug发现传出的参数不是自己想要的参数。可是为什么呢？

​	因为它是线程不安全的，当并发环境下，如果考虑不周使用SimpleDateFormat方法可以会出现线程安全方面的问题。原因当问我们使用parse方法时，使用CalendarBuilder日历创建者类创建日期，其中calendar实例因为cpu时间片切换时共享变量进行clear操作，导致数据不一致。

具体原因：https://blog.csdn.net/lululove19870526/article/details/83684568

# 三、解决方案

​	1、临时创建：对于每个转换都new一个实例，有背与我们代码简洁的初衷，放弃。

​	2、synchronized：阻塞，让线程不在并发，对效率影响很大，放弃。

​	3、ThreadLocal：线程隔离机制，代码量减少了，和1一样也牺牲了部分空间，还是个不错的解决方法。

​		https://www.jianshu.com/p/3c5d7f09dfbd

​	4、Apache的 DateFormatUtils 与 FastDateFormat：线程安全，但是木有parse()方法

​	5、Joda-Time：感觉不错，就是源码有点多没敢用，github目前2.4K star。

# 四、部分代码

​	用了ThreadLocal

```java
/**
 * 枚举类 常量类
 *
 * @author zhengtianqi
 * @date 2019/8/16
 */
public enum ConstantUtils {
    

    public static final ThreadLocal<SimpleDateFormat> IN_FORMAT = ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyyMMddHHmmssSSS"));
    public static final ThreadLocal<SimpleDateFormat> VIEW_FORMAT = ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
    public static final ThreadLocal<SimpleDateFormat> OUT_FORMAT = ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
}
```

```java
// 调用
ConstantUtils.IN_FORMAT.get().format(requestParams.getReleaseTime())
```

