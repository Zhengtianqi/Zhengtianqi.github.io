---
title: java操作txt文件总结
author: ztq
tag:
  - java
  - 文件
category:
  - java基础
date: 2022-09-14 09:53:00
---
# 1、介绍
## （1）Java.io包
### File类
这是Java中一个内置的包，专门用于文件读写的一个操作的类
在程序中使用 文件或者流的操作就要导入import java.io.*;

File类可以表示一个文件，还可以表示一个目录（Directory），所以我们可以在程序中用File 类的对象可以表示一个文件 或者 目录
当创建了 File 对象之后，我们可以利用该对象来对文件或者目录进行书属性修改：例如：文件的名称，修改日期的日期等等
File 类的对象 还不能直接对文件进行读写操作，只能修改文件的属性

示例：
1、本地文件读取
```java
import java.io.*;

public class FileDemo {
	public static void main(String[] args) {
		File f1=new File("src\\aa.txt");//相对路径，如果没有前面的src，就在当前目录创建文件
		if(f1.exists()) {
			System.out.println("文件已经存在");
		}else {
			try {
				f1.createNewFile();
				System.out.println("文件创建成功");
			} catch (Exception e) {
				// TODO: handle exception
			}
		}
		System.out.println("文件已经存在:"+f1.exists());
		System.out.println("文件的名字:"+f1.getName());
		System.out.println("文件的路径:"+f1.getPath());
		System.out.println("文件的绝对路径:"+f1.getAbsolutePath());
		System.out.println("是目录吗:"+f1.isDirectory());
		System.out.println("文件大小:"+f1.length());
	}
}
```
2、网络文件读取
```java
import java.io.File;
import java.net.*;
public class Main {
    public static void main(String[] args) throws Exception {
        File file = new File(new URI("https://test.com/test.txt"));
    }
}
```
## （2）Stream流（字节流）

流是指一连串流动的数据信号，通过FiFO(先进先出) 的方式接收和发送数据

数据流又分为输入流和输出流
输入输出流又分为字节流和字符流
字节流：以字节为基本单位 , 在 java.io包中，大部分操作继承InputStream（输入字节流）类和OutputStream（输出字节流）类
字符流：两个字节为基本单位，专门处理字符串和文本，对于字符流进行操作的类主要是Reader（读取流）类和 Writer（写入流）类。
### 使用FileInputStream和FileOutputStream类
继承于InputStream类，这是一个文件输入流，进行文件读操作的最基本的类
作用是将文件中的数据输入到内存中，我们可以用它来读文件操作
由于字节流的缘故，因此无法读取中文字符
示例如下：
```java
import java.io.*;

public class FileStreamDemo {
	public static void main(String[] args) {
		try {
			File file=new File("src\\aa.txt");
			FileInputStream f1=new FileInputStream(file);//这里需要进行抛出异常处理
			for (int i = 0; i < file.length(); i++) {
				char ch=(char)(f1.read());//循环读取字符
				System.out.print(ch+" ");
			}
			System.out.println();//换行操作
			f1.close();//关闭文件
		} catch (Exception e) {
			// TODO: handle exception
			System.out.println("文件打开失败");
		}

	}
}
```
FileOutputStream类称为文件输出流，继承于OutputStream类，是文件的基本读写的一个类
它的作用和上面读文件恰恰相反，将内存中的数据输出到文件中，所以我们可以用这个类来进行写文件的操作
我们先按aa,txt文件的内容清空，然后实现下边的代码进行写操作
示例如下：
```java
import java.io.*;

public class FileOuputDemo {
	public static void main(String[] args) throws FileNotFoundException {
		File file=new File("src\\aa.txt");
		FileOutputStream f1=new FileOutputStream(file);//(file,true)，这里有true的话，代表可以在文件后面追加内容
		String str="I love coding";
		byte[] buff=str.getBytes();//将字符串转换为字节数组
		try {
			f1.write(buff);//把字节数组的内容写进去文件
		} catch (Exception e) {
			// TODO: handle exception
		}finally {
			try {
				f1.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
}
```
FileInputStream类 和 FileOutputStream类总是成对出现的，一个用作输入流，另一个自然是输出流
我们在输入流中使用 byte（字节）数组 来存储我们的数据，因此我们不必考虑数据格式，所以说这两种操作的效率会比较高

## （3）Stream流（字符流）
### FileWriter类 与 BufferedWriter类使用
前面我们FileInputStream时，使用的是字节流，但是有个问题无法解决，它只能读取英文字符，而中文字符是无法读取的，会出现奇怪的东西。
```java
import java.io.*;

public class FileWriterDemo {
	public static void main(String[] args) {
		String[] str= {"春眠不觉晓,","处处闻啼鸟,","夜来风雨声,","花落知多少,"};
		File file=new File("src\\cc.txt");//我们在该类的位置创建一个新文件
		FileWriter f=null;//创建文件写入对象
		BufferedWriter f1=null;//创建字符流写入对象
	
		try {
			//这里把文件写入对象和字符流写入对象分开写了
			f=new FileWriter("src\\cc.txt");//创建一个名为cc.txt的文件
			f1=new BufferedWriter(f);
			//通过循环遍历上面的String 数组中的元素
			for (int i = 0; i < str.length; i++) {
				f1.write(str[i]);//把String中的字符写入文件
				f1.newLine();//换行操作
				}
		} catch (Exception e) {
			// TODO: handle exception
		}finally {//如果没有catch 异常，程序最终会执行到这里
			try {
				f1.close();
				f.close();//关闭文件
			} catch (Exception e2) {
				// TODO: handle exception
			}
		}
	}
}
```
### FileReader和BufferedReader类使用
读取上面写入文件的数据
```java
import java.io.*;

public class FileReaderDemo {
	public static void main(String[] args) {
		File file=new File("src\\cc.txt");
		FileReader f=null;//文件读取对象
		BufferedReader f1=null;//字符流对象
		try {
			f=new FileReader(file);
			f1=new BufferedReader(f);
			//循环打印cc文件中的每行数据
			String str=null;
			while((str=f1.readLine())!=null) {
				System.out.println(str);
			}
				
		} catch (Exception e) {
			// TODO: handle exception
		}finally {
			try {
				f1.close();
				f.close();
			} catch (Exception e2) {
				// TODO: handle exception
			}
		}
	}
}
```
## （4）序列化与反序列化
简化成一句话、序列化是把Java对象存在一个硬盘，网络，以便传输
也就是把我们的数据永久的存放到计算机当中

### 序列化利用FileOutputStream和ObjectOutputStream类
```java
import java.io.*;
import java.util.*;

/**
 * 序列化操作
 * */
public class Xl {
	public static void main(String[] args) {
		//数据完成持久化的操作
		List<String> list=new ArrayList<String>();
		list.add("aaa");
		list.add("bbb");
		list.add("ccc");
		FileOutputStream f1=null;
		ObjectOutputStream f2=null;
		try {
			//第一行省略了前面的 File file = new File(~)的操作，直接创建一个文件
			f1=new FileOutputStream(new File("src\\dd.txt"));
			f2=new ObjectOutputStream(f1);
			f2.writeObject(list);
		} catch (Exception e) {
			// TODO: handle exception
		}finally {
			try {
				f2.close();
				f1.close();
			} catch (Exception e2) {
				// TODO: handle exception
			}
		}
	}
```
### 反序列化利用FileInputStream和ObjectInputStream类
如果我们读入的是字符流数据，在反序列化的操作，我们需要实现Serializable接口
```java
import java.io.*;
import java.util.*;

//反序列化操作
public class FXL {
	public static void main(String[] args) {
		FileInputStream f=null;
		ObjectInputStream f1=null;
		List list=null;
		try {
			f=new FileInputStream("src\\dd.txt");//对应我们前面往输入dd.txt 文件的内容
			f1=new ObjectInputStream(f);
			list=(List<String>)f1.readObject();
		} catch (Exception e) {
			// TODO: handle exception
		}finally {
			try {
				f1.close();
				f.close();
			} catch (Exception e2) {
				// TODO: handle exception
			}
		}
		//这种方法就不必循环打印数据了，可以一步到位
		System.out.println(list);
	}
}
```

# 2、示例
## （1）读取文件为流
```java
byte[] fileBytes = org.apache.commons.io.FileUtils.readFileToByteArray(new File("fileName"));
```
## （2）写入字节流到文件
```java
org.apache.commons.io.FileUtils.writeByteArrayToFile(new File("fileName"), fileBytes);
```
## （3）commons-io中用一行代码实现文件读写操作：
```java
private static void readFile() {
    try {
            List<String> lines = org.apache.commons.io.FileUtils.readLines(new File("D:\\rowkey.txt"));
            for (String line : lines) {
                    System.out.println(line);
            }
        } catch (IOException e) {
        e.printStackTrace();
    }
}

private static void writeFile()  { 
      List<String> list = new ArrayList<>();
      list.add("123");
      list.add("456");
      list.add("789");
     try {
           org.apache.commons.io.FileUtils.writeLines(new File("D:\\id.txt"), list, true);
      } catch (IOException e) {
            e.printStackTrace();
      }
}
```
