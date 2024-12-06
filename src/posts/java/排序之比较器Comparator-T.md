---
title: 排序之比较器Comparator<T>
author: ztq
tag:
  - java
category:
  - java基础
date: 2020-01-02 11:34:00

---

# 一、Comparator和Comparable区别

		Comparator，又名比较器，是为了比较两个对象的大小而抽象出的一个接口，使用比较多。在java.util下。比较功能，对一些对象的集合施加了一个整体排序 。 可以将比较器传递给排序方法（如Collections.sort或Arrays.sort ），以便对排序顺序进行精确控制。

		Comparable，这个接口往往是可比较类实现的。在 java.lang 包下。Comparable接口对实现它的每个类的对象强加一个整体排序。 这个排序被称为类的自然排序。该接口有且只有一个方法int compareTo(T o)所以继承此接口需要实现该方法。compareTo返回值-1、0、1。  Collections.sort （和Arrays.sort ）可以自动对实现此接口的对象进行列表（和数组）排序。

		上篇已经介绍Comparable的用法，此处只介绍Compatator：

# 二、Compatator用法

```java
public static void main(String[] args) {
        Student stu1 = new Student("zhangsan", 10);
        Student stu2 = new Student("zhangsan", 21);
        Student stu3 = new Student("zhangsan", 19);
        Student stu4 = new Student("zhangsan", 26);

        List<Student> students = new ArrayList<>(4);
        students.add(stu1);
        students.add(stu2);
        students.add(stu3);
        students.add(stu4);
        Collections.sort(students, new Comparator<Student>() {
            @Override
            public int compare(Student o1, Student o2) {
                return o1.getAge() - o2.getAge();
            }
        });
    }
```

# 三、拓展

JDK1.8引入Lambda表达式：可以替换为：

```java
// 1 
Collections.sort(students, (o1, o2) -> o1.getAge() - o2.getAge());
// 若1为正常由小到大顺序，可以改成2的写法
Collections.sort(students, Comparator.comparingInt(Student::getAge));

// 也可以采用stream进行处理（分组，排序，求最大最小等sql几乎操作都可以）
List<Student> studentStream = students.stream().sorted(Comparator.comparingInt(Student::getAge)).collect(Collectors.toList());
```

