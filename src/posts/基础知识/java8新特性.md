---
title: java8新特性
author: ztq
tag:

  - JDK1.8新特性
category:
  - java基础
date: 2019-11-14 14:18:00
---
	都9102年了，JAVA出到了13.0.1。现在预习一下JAVA8新特性应该还来得及；用代码说话：

# 一、Stream（流）

Stream（流）是一个来自数据源的元素队列并支持聚合操作

数据源是流的来源。 数据源可以是集合，数组，I/O channel等

优点：
 * 内部迭代：通过访问者模式(Visitor)实现
 * Pipelining：中间操作都会返回流对象本身
 * 聚合操作：类似SQL语句一样的操作， 比如 filter, map, reduce, find, match, sorted 等

```java
package com.bjut.java8test;

import org.junit.Test;

import java.util.Arrays;
import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

public class Java8StreamTest {
    final List<String> strings = Arrays.asList("abc", "", "bc", "efg", "abcd", "", "jkl");
    final List<Integer> numbers = Arrays.asList(3, 2, 2, 3, 7, 3, 5);
    final Random random = new Random();

    @Test
    public void filter() {
        // filter 方法过滤出空字符串
        List<String> filtered = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.toList());
        System.out.println(filtered);
    }

    @Test
    public void forEach() {
        // Stream 提供了新的方法 'forEach' 来迭代流中的每个数据;limit 方法用于获取指定数量的流
        random.ints().limit(10).forEach(System.out::println);
    }

    @Test
    public void map() {
        // map 方法用于映射每个元素到对应的结果
        // 获取对应的平方数, distinct为去重
        List<Integer> squaresList = numbers.stream().map(i -> i * i).distinct().collect(Collectors.toList());
        System.out.println(squaresList);
    }

    @Test
    public void sorted() {
        // sorted 方法用于对流进行排序
        random.ints().limit(10).sorted().forEach(System.out::println);
    }

    @Test
    public void parallel() {
        // 获取空字符串的数量
        long count = strings.parallelStream().filter(string -> string.isEmpty()).count();
        System.out.println(count);
    }

    @Test
    public void join() {
        // 类似于
        // jdk：String mergedString = String.join(",", strings);
        // common.lang3：String mergedString = StringUtils.join(strings);

        String mergedString = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.joining(","));
        System.out.println(mergedString);
    }

    @Test
    public void statistics(){
        // 一些产生统计结果的收集器也非常有用。它们主要用于int、double、long等基本类型上
        List<Integer> numbers = Arrays.asList(3, 2, 2, 3, 7, 3, 5);
        IntSummaryStatistics stats = numbers.stream().mapToInt((x) -> x).summaryStatistics();

        System.out.println("列表中最大的数 : " + stats.getMax());
        System.out.println("列表中最小的数 : " + stats.getMin());
        System.out.println("所有数之和 : " + stats.getSum());
        System.out.println("平均数 : " + stats.getAverage());
    }

}


```

# 二、方法引用

方法引用

方法引用提供了非常有用的语法，可以直接引用已有Java类或对象（实例）的方法或构造器。

```java
package com.bjut.java8test;

@FunctionalInterface
public interface Supplier<T>{
    T get();
}

```

```java
package com.bjut.java8test;

public class Car {
    // Supplier是jdk1.8的接口，这里和lamda一起使用了
    public static Car create(final Supplier<Car> supplier) {
        return supplier.get();
    }

    public static void collide(final Car car) {
        System.out.println("Colloded" + car.toString());
    }

    public void follow(final Car another) {
        System.out.println("Following the" + another.toString());
    }

    public void repair() {
        System.out.println("Repaired" + this.toString());
    }
}
```

```java
package com.bjut.java8test;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Java8QuoteTest {
    final Car car = Car.create(Car::new);
    final List<Car> cars = Arrays.asList(car);
    final Car police = Car.create(Car::new);

    @Test
    public void quoteType() {
        // 静态方法引用：它的语法是Class::static_method，实例如下：
        cars.forEach(Car::collide);
        // 特定类的任意对象的方法引用：它的语法是Class::method实例如下：
        cars.forEach(Car::repair);
        // 特定对象的方法引用：它的语法是instance::method实例如下：
        cars.forEach(police::follow);
    }

    @Test
    public void quoteExample(){
        List<String> names = new ArrayList<>(50);
        names.add("hello");
        names.add("world");
        names.add("ni");
        names.add("hao");
        names.forEach(System.out::println);
    }
}

```

# 三、默认方法

 默认方法 − 默认方法就是一个在接口里面有了一个实现的方法。 

```java
package com.bjut.java8test;

public interface Java8DefaultInterface {
    default void print(){
        System.out.println("默认方法");
    }
}

```

```java
package com.bjut.java8test;

import org.junit.Test;

/**
 * 测试接口默认方法
 */
public class Java8DefaultInterfaceTest implements Java8DefaultInterface{

    @Test
    public void test(){
        Java8DefaultInterface defaultInterface = new Java8DefaultInterfaceTest();
        defaultInterface.print();
    }
}

```

# 四、 Date Time API 

加强对日期与时间的处理。 

```java
package com.bjut.java8test;

import org.junit.Test;
import java.time.*;

public class Java8DateTest {
    LocalDateTime currentTime = LocalDateTime.now();

    @Test
    public void testLocalDateTime() {
        // 获取服务器当前的日期时间
        System.out.println("时间" + currentTime);

        // 获取服务器当前日期
        LocalDate date1 = currentTime.toLocalDate();
        System.out.println("date1: " + date1);

        // 获取服务器某月某天
        Month month = currentTime.getMonth();
        int day = currentTime.getDayOfMonth();
        int seconds = currentTime.getSecond();
        System.out.println("月: " + month + ", 日: " + day + ", 秒: " + seconds);
    }

    @Test
    public void testStructDateTime() {
        LocalDateTime date2 = currentTime.withDayOfMonth(12).withYear(2012);
        System.out.println("date2" + date2);

        // 23 december 2014
        LocalDate date3 = LocalDate.of(2014, Month.DECEMBER, 23);
        System.out.println("date3" + date3);

        // 22 小时 15 分钟
        LocalTime date4 = LocalTime.of(22, 15);
        System.out.println("date4: " + date4);

        // 解析字符串
        LocalTime date5 = LocalTime.parse("20:15:30");
        System.out.println("date5: " + date5);
    }

    @Test
    public void testZonedDateTime() {
        // 获取当前时间日期
        ZonedDateTime date1 = ZonedDateTime.parse("2015-12-03T10:15:30+05:30[Asia/Shanghai]");
        System.out.println("date1: " + date1);

        ZoneId id = ZoneId.of("Europe/Paris");
        System.out.println("ZoneId: " + id);

        ZoneId currentZone = ZoneId.systemDefault();
        System.out.println("当期时区: " + currentZone);
    }
}

```

# 五、 Optional 类 

Optional 类是一个可以为null的容器对象。优雅的解决null问题：我平时好像都是类似于 StringUtils.isBlank()

JAVA9在它的基础上又增加了3个方法

```java
package com.bjut.java8test;

import org.junit.Test;
import java.util.Optional;

public class java8OptionalTest {

    @Test
    public void testOptional() {
        Integer value1 = null;
        Integer value2 = new Integer(10);

        // Optional.ofNullable -允许传递null参数
        Optional<Integer> a = Optional.ofNullable(value1);
        // Optional.of - 如果传递的参数是null ， 抛出异常NullPointerException
        Optional<Integer> b = Optional.of(value2);

        System.out.println(sum(a, b));
    }


    private Integer sum(Optional<Integer> a, Optional<Integer> b) {
        // Optional.isPresent - 判断值是否存在
        System.out.println("第一个参数值存在" + a.isPresent());
        System.out.println("第二个参数值存在" + b.isPresent());

        // Option.orElse - 如果值存在，返回它，否则返回默认值
        Integer value1 = a.orElse(new Integer(0));

        // Optional.get - 获取值，值需要存在
        Integer value2 = b.get();
        return value1 + value2;
    }
}

```



参考文献：https://www.runoob.com/java/java8-new-features.html