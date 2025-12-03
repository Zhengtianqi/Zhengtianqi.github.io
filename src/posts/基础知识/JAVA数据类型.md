---
title: JAVA数据类型易混概念
author: zheng
tag:

  - java
category:
  - java基础
date: 2020-01-06 14:30:00

---

1、整型

		在 Java 中 ， 整型的范围与运行 Java 代码的机器无关 。	

	![image-20200106143552647](/assets/images/inttype.png)

		在通常情况下， int类型最常用。 但如果表示星球上的居住人数 ，就需要使用 long 类型了。byte 和 short 类型主要用于特定的应用场合 ，例如 ，底层的文件处理或者需要控制占用存储空间量的大数组 。

		长整型数值有一个后缀 L 或 1 ( 如 4000000000 L ) 。

		十六进制数值有一个前缀 0x 或 0X ( 如0xCAFE）。

		八进制有一个前缀 0 ,例如 ， 010 对应八进制中的 8。（很容易混淆，不建议使用）

		从 Java 7 开始 ， 加上前缀 0b 或 0B 就可以写二进制数 。 例如 ，0b1001就是 9 。

		从 Java 7 开始， 还可以为数字字面量加下划线 ， 如用1_000_000这些下划线只是为丫让人更易读 。Java编译器会去除这些下划线。 ( 或0b1111_0100_0010_0100_0000表示一百万）

2、浮点型

![image-20200106150945185](/assets/images/floattype.png)

		double 表示这种类型的数值精度是 float 类型的两倍 （ 有人称之为双精度数值 )

很多情况下，不使用float。

		float 类型的数值有一个后缀 F 或 f ( 例如，3.14 F ) 。没有后缀 F的浮点数值 （ 如 3.14 ) 默认为 double 类型。当然 ， 也可以在浮点数值后面添加后缀 D 或 d（例如，3.14D）

三个常量值：Double _ POSITIVE _ INFINITY 、 Double . NEGATIVEJNFINITY 和 Double . NaN

```java
public class ConstantTest {
    public static void main(String[] args) {
        System.out.println("Double.POSITIVE_INFINITY = " + 1.0 / 0.0);
        System.out.println("Double.NEGATIVE_INFINITY = " + -1.0 / 0.0);
        System.out.println("Double.NaN = " + 0.0d / 0.0);
        System.out.println(Double.class);
        // 如果得到一个完全可预测的结果比运行速度更重要的话， 那么就应该使用StrictMath类 遵循IEEE 754
        System.out.println(StrictMath.max(1, 2));
    }
}

```

		Warning：浮点数值不适用于无法接受舍入误差的金融计算中。如果在数值计算中不允许有任何舍入误差 ， 就应该使用 BigDecimal类。

3、char类型

		char 类型原本用于表示单个字符。不过 ，现在情况已经有所变化 。如今，有些 Unicode字符可以用一个 char 值描述， 另外一些 Unicode 字符则需要两个char 值。

![image-20200106152036190](/assets/images/chartype.png)

		Unicode 打破了传统字符编码机制的限制，解决世界上文字编码不一致的问题。在设计 Java 时决定采用16 位的 Unicode 字符集， 这样会比使用 8 位字符集的程序设计语言有很大的改进。现在 ， 16 位的 char 类型已经不能满足描述所有 Unicode 字符的需要了，利用码点解决。

		最好不使用char类型，除非确定需要处理UTF-16代码单元。

4、boolean 类型

		boolean（布尔）有两个值：true 或 false，与整型不能进行相互转换。

5、数值类型之间的转换

		在图3-1中有 6 个实心箭头 ，表示无信息丢失的转换 ； 

		有 3 个虚箭头 ， 表示可能有精度损失的转换。

![image-20200106160423586](/assets/images/typetrans.png)

		如果两个操作数中有一个是 double类型 ， 另一个操作数就会转换为 double 类型。
		否则 ， 如果其中一个操作数是 float 类型 ， 另一个操作数将会转换为 float 类型 。
		否则 ，如果其中一个操作数是 long 类型， 另一个操作数将会转换为 long 类型 。
		否则 ， 两个操作数都将被转换为 int 类型 。

		强制转换也会造成精度丢失。

		例如 ：
			double x * 9.997 ;
			int nx = ( int ) x ;
			这样 ， 变量 nx 的值为 9

6、java.math下有两个很有用的类

		BigInteger 和 BigDecimal：

		Biglnteger 类实现了任意精度的整数运算 ， BigDecimal 实现了任意精度的浮点数运

		使用静态的valueOf 方法可以将普通的数值转换为大数值：		

				Biglnteger a = Biglnteger . valueOf ( 100 ) ;

		大数值类中的 add 和 multiply 方法 。
				Biglnteger c = a.add ( b ) ;  / / c = a + b
				Biglnteger d = c.multiply(b.add(Biglnteger.valueOf (2))) ;  // d = c * ( b + 2 )