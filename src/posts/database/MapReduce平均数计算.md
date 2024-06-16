---
title: MapReduce平均数计算
author: 郑天祺
tag:

  - hadoop
category:
  - 大数据
date: 2020-12-06 12:14:00

---

## 1、建立三个文档

![image-20201206121627187](/assets/images/image-20201206121627187.png)

![image-20201206121650739](/assets/images/image-20201206121650739.png)

![image-20201206121711716](/assets/images/image-20201206121711716.png)

上传 到hdfs

![image-20201206121829515](/assets/images/image-20201206121829515.png)



## 2、代码

```java
package cn.edu.bjut;  

import org.apache.hadoop.io.LongWritable;  
import org.apache.hadoop.io.Text;  
import org.apache.hadoop.mapreduce.lib.input.*;  
import org.apache.hadoop.mapreduce.lib.output.*;  
import org.apache.hadoop.mapreduce.Job;  
import org.apache.hadoop.mapreduce.Mapper;  
import org.apache.hadoop.mapreduce.Reducer;
import java.io.IOException;  
import java.util.ArrayList;  
import java.util.List;  
import org.apache.hadoop.conf.Configuration;  
import org.apache.hadoop.fs.Path;  
import org.apache.hadoop.io.IntWritable;  

public class AvgScore {  
    public static class Map extends Mapper<LongWritable, Text, Text, IntWritable> {  
        @Override  
        protected void map(LongWritable key, Text value, Mapper<LongWritable, Text, Text, IntWritable>.Context context)  
                throws IOException, InterruptedException {  
            String line = value.toString();  
            String[] nameAndScore = line.split(" ");  
            List<String> list = new ArrayList<String>(2);  
            for (String nameOrScore : nameAndScore) {  
                if (!"".equals(nameOrScore)) {  
                    list.add(nameOrScore);  
                }  
            }  
            context.write(new Text(list.get(0)), new IntWritable(Integer.parseInt(list.get(1))));  
        }  
    }  
    public static class Reduce extends Reducer<Text, IntWritable, Text, IntWritable> {  
        @Override  
        protected void reduce(Text key, Iterable<IntWritable> values,  
                Reducer<Text, IntWritable, Text, IntWritable>.Context context)  
                throws IOException, InterruptedException {  
            int sum = 0;  
            int count = 0;  
            for (IntWritable value : values) {  
                sum += Integer.parseInt(value.toString());  
                count++;  
            }  
            int average = sum / count;  
            context.write(key, new IntWritable(average));  
        }  
    }  

    public static void main(String[] args) throws IOException, ClassNotFoundException, InterruptedException {  
        Configuration conf = new Configuration();  
        conf.set("fs.defaultFS", "hdfs://localhost:9000");  
        String[] othersArgs = new String[] {"/mapreduce/inputavg","/mapreduce/outputavg"};  
        if(othersArgs.length != 2) {  
            System.err.println("Usage:Avgscore<int><out>");  
            System.exit(2);  
        }  
        Job job = Job.getInstance(conf, "Avgscore");  
        job.setJarByClass(AvgScore.class);  
        job.setMapperClass(Map.class);  
        job.setReducerClass(Reduce.class);  
        job.setOutputKeyClass(Text.class);  
        job.setOutputValueClass(IntWritable.class);  
        job.setInputFormatClass(TextInputFormat.class);  
        job.setOutputFormatClass(TextOutputFormat.class);  
        FileInputFormat.addInputPath(job, new Path(othersArgs[0]));  
        FileOutputFormat.setOutputPath(job, new Path(othersArgs[1]));  
        System.exit(job.waitForCompletion(true) ? 0 : 1);  
    }  
}  
```

3、查看结果

![image-20201206122126739](/assets/images/image-20201206122126739.png)