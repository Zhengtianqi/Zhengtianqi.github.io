---
title: BigDecimal
author: zheng
tag:
  - BigDecimal
category:
  - java基础
date: 2022-12-07 15:19:00
---
# 1、介绍
Java在java.math包中提供的API类BigDecimal，用来对超过16位有效位的数进行精确的运算。双精度浮点型变量double可以处理16位有效数，但在实际应用中，可能需要对更大或者更小的数进行运算和处理。
一般情况下，对于那些不需要准确计算精度的数字，我们可以直接使用Float和Double处理，但是Double.valueOf(String) 和Float.valueOf(String)会丢失精度。所以开发中，如果我们需要精确计算的结果，则必须使用BigDecimal类来操作。
BigDecimal所创建的是对象，故我们不能使用传统的+、-、*、/等算术运算符直接对其对象进行数学运算，而必须调用其相对应的方法。方法中的参数也必须是BigDecimal的对象。构造器是类的特殊方法，专门用来创建对象，特别是带有参数的对象。
# 2、常用构造函数
```java
BigDecimal(int)
创建一个具有参数所指定整数值的对象
BigDecimal(double)
创建一个具有参数所指定双精度值的对象
BigDecimal(long)
创建一个具有参数所指定长整数值的对象
BigDecimal(String)
创建一个具有参数所指定以字符串表示的数值的对象
```
使用问题分析：
```java
public class Main {
    public static void main(String[] args) {
        BigDecimal a =new BigDecimal(0.1);
        System.out.println("a values is:"+a);
        BigDecimal b =new BigDecimal("0.1");
        System.out.println("b values is:"+b);
    }
}
Output:
a values is:0.1000000000000000055511151231257827021181583404541015625
b values is:0.1
```
原因分析：
1）参数类型为double的构造方法的结果有一定的不可预知性。有人可能认为在Java中写入newBigDecimal(0.1)所创建的BigDecimal正好等于 0.1（非标度值 1，其标度为 1），但是它实际上等于0.1000000000000000055511151231257827021181583404541015625。这是因为0.1无法准确地表示为 double（或者说对于该情况，不能表示为任何有限长度的二进制小数）。这样，传入到构造方法的值不会正好等于 0.1（虽然表面上等于该值）。
2）String 构造方法是完全可预知的：写入 newBigDecimal(“0.1”) 将创建一个 BigDecimal，它正好等于预期的 0.1。因此，比较而言， 通常建议优先使用String构造方法。
3）当double必须用作BigDecimal的源时，请注意，此构造方法提供了一个准确转换；它不提供与以下操作相同的结果：先使用Double.toString(double)方法，然后使用BigDecimal(String)构造方法，将double转换为String。要获取该结果，请使用static valueOf(double)方法。
# 3、BigDecimal常用方法详解
常用方法
```java
add(BigDecimal)
BigDecimal对象中的值相加，返回BigDecimal对象
subtract(BigDecimal)
BigDecimal对象中的值相减，返回BigDecimal对象
multiply(BigDecimal)
BigDecimal对象中的值相乘，返回BigDecimal对象
divide(BigDecimal)
BigDecimal对象中的值相除，返回BigDecimal对象

toString()
将BigDecimal对象中的值转换成字符串
doubleValue()
将BigDecimal对象中的值转换成双精度数
floatValue()
将BigDecimal对象中的值转换成单精度数
longValue()
将BigDecimal对象中的值转换成长整数
intValue()
将BigDecimal对象中的值转换成整数

compareTo()
比较大小
```
```java
java中对BigDecimal比较大小一般用的是bigdemical的compareTo方法
int a = A.compareTo(B);
返回结果分析：
a = -1,表示A小于B；
a = 0,表示A等于B；
a = 1,表示A大于B；
```
# 4、BigDecimal格式化
由于NumberFormat类的format()方法可以使用BigDecimal对象作为其参数，可以利用BigDecimal对超出16位有效数字的货币值，百分值，以及一般数值进行格式化控制。
以利用BigDecimal对货币和百分比格式化为例。首先，创建BigDecimal对象，进行BigDecimal的算术运算后，分别建立对货币和百分比格式化的引用，最后利用BigDecimal对象作为format()方法的参数，输出其格式化的货币值和百分比。
```java
public static void main(String[] args) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(); //建立货币格式化引用
        NumberFormat percent = NumberFormat.getPercentInstance();  //建立百分比格式化引用
        percent.setMaximumFractionDigits(3); //百分比小数点最多3位

        BigDecimal loanAmount = new BigDecimal("1000.48"); //贷款金额
        BigDecimal interestRate = new BigDecimal("0.008"); //利率
        BigDecimal interest = loanAmount.multiply(interestRate); //相乘

        System.out.println("贷款金额:\t" + currency.format(loanAmount));
        System.out.println("利率:\t" + percent.format(interestRate));
        System.out.println("利息:\t" + currency.format(interest));

    }

Output:
贷款金额:	￥1,000.48
利率:	0.8%
利息:	￥8.00
```

BigDecimal格式化保留2为小数，不足则补0：
```java
public class NumberFormat {
  
  public static void main(String[] s){
    System.out.println(formatToNumber(new BigDecimal("3.435")));
    System.out.println(formatToNumber(new BigDecimal(0)));
    System.out.println(formatToNumber(new BigDecimal("0.00")));
    System.out.println(formatToNumber(new BigDecimal("0.001")));
    System.out.println(formatToNumber(new BigDecimal("0.006")));
    System.out.println(formatToNumber(new BigDecimal("0.206")));
    }
  /**
   * @desc 1.0~1之间的BigDecimal小数，格式化后失去前面的0,则前面直接加上0。
   * 2.传入的参数等于0，则直接返回字符串"0.00"
   * 3.大于1的小数，直接格式化返回字符串
   * @param obj传入的小数
   * @return
   */
  public static String formatToNumber(BigDecimal obj) {
    DecimalFormat df = new DecimalFormat("#.00");
    if(obj.compareTo(BigDecimal.ZERO)==0) {
      return "0.00";
    }else if(obj.compareTo(BigDecimal.ZERO)>0&&obj.compareTo(new BigDecimal(1))<0){
      return "0"+df.format(obj).toString();
    }else {
      return df.format(obj).toString();
    }
  }
}

Output:
3.44
0.00
0.00
0.00
0.01
0.21
```
# 5、BigDecimal常见异常
除法的时候出现异常
```java
java.lang.ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result
```
原因分析:
通过BigDecimal的divide方法进行除法时当不整除，出现无限循环小数时，就会抛异常：java.lang.ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result.
解决方法：
divide方法设置精确的小数点，如：divide(xxxxx,2)

# 6、BigDecimal总结
在需要精确的小数计算时再使用BigDecimal，BigDecimal的性能比double和float差，在处理庞大，复杂的运算时尤为明显。故一般精度的计算没必要使用BigDecimal。
尽量使用参数类型为String的构造函数。
BigDecimal都是不可变的（immutable）的， 在进行每一次四则运算时，都会产生一个新的对象 ，所以在做加减乘除运算时要记得要保存操作后的值。