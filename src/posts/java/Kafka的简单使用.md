---
title: Kafka的简单使用
author: 郑天祺
tag:
  - SpringCloud
category:
  - spring
  
date: 2020-12-14 12:59:00
---

# 1、安装kafka

http://kafka.apache.org/quickstart  （linux版）

windows版：
首先cmd到kafka的bin下
其中启动内置的zk用：zookeeper-server-start.bat D:\environment\kafka_2.12-2.3.0\config\zookeeper.properties 
启动Kafka用：kafka-server-start.bat D:\environment\kafka_2.12-2.3.0\config\server.properties 

集群的设置: http://kafka.apache.org/quickstart#quickstart_multibroker

# 2、参数

建立KafkaProperties 类，编写连接kafka所需要的参数

```java
public class KafkaProperties {
    private static final String IP = "127.0.0.1:9092";
    public static final String TOPIC = "topic_test";
    public static Properties initConfig() {
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", IP);
        properties.put("group.id", "group-1");
        // session.timeout.ms：消费者在被认为死亡之前可以与服务器断开连接的时间，默认是3s 。
        properties.put("session.timeout.ms", "30000");
        // 消费者是否自动提交偏移量，默认值是true,避免出现重复数据和数据丢失，可以把它设为 false。
        properties.put("enable.auto.commit", "false");
        properties.put("auto.commit.interval.ms", "1000");
        // auto.offset.reset:消费者在读取一个没有偏移量的分区或者偏移量无效的情况下的处理
        properties.put("auto.offset.reset", "earliest");
        properties.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        properties.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        // earliest：在偏移量无效的情况下，消费者将从起始位置读取分区的记录。
        properties.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        // latest：在偏移量无效的情况下，消费者将从最新位置读取分区的记录
        properties.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        // max.partition.fetch.bytes：服务器从每个分区里返回给消费者的最大字节数
        // fetch.max.wait.ms:消费者等待时间，默认是500。
        // fetch.min.bytes:消费者从服务器获取记录的最小字节数。
        // client.id：该参数可以是任意的字符串，服务器会用它来识别消息的来源。
        // max.poll.records:用于控制单次调用 call() 方住能够返回的记录数量
        // receive.buffer.bytes和send.buffer.bytes：指定了 TCP socket 接收和发送数据包的缓冲区大小，默认值为-1
        return properties;
    }
}
```

# 3、消费者

```java
public class KafkaConsumerConnection {
    private static KafkaConsumer<String, String> consumer = null;
    private KafkaConsumerConnection() {
    }
    public static KafkaConsumer<String, String> getConsumer() {
        if (consumer == null) {
            consumer = new KafkaConsumer<>(KafkaProperties.initConfig());
        }
        return consumer;
    }
}

```

# 4、生产者

```java
public class KafkaProducerConnection {
    private static KafkaProducer<String, String> producer = null;
    private KafkaProducerConnection() {
    }
    public static KafkaProducer<String, String> getProducer(){
        if(producer == null){
            producer = new KafkaProducer<>(KafkaProperties.initConfig());
        }
        return producer;
    }
}
```

# 5、编写生产者main函数

```java
public class ProducerTest {
    public static void main(String[] args) {
        Producer<String, String> producer = KafkaProducerConnection.getProducer();
        try {
            while (true) {
                String msg = "Hello," + new Random().nextInt(100);
                ProducerRecord<String, String> record = new ProducerRecord<>(KafkaProperties.TOPIC, msg);
                producer.send(record);
                System.out.println("消息发送成功:" + msg);
                Thread.sleep(500);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            producer.close();
        }
    }
}
```

# 6、编写消费者main函数

```java
public class ConsumerTest {
    public static void main(String[] args) {
        Consumer<String, String> consumer = KafkaConsumerConnection.getConsumer();
        consumer.subscribe(Collections.singletonList(KafkaProperties.TOPIC));
        Duration duration = Duration.ofMillis(100);
        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(duration);
            for (ConsumerRecord<String, String> record : records) {
                System.out.println(String.format("topic:%s,offset:%d,消息:%s", record.topic(), record.offset(), record.value()));
            }
        }
    }
}
```

# 7、先执行消费者后执行生产者。