---
title: "实时消息推送系统：WebSocket、SSE 与长轮询对比"
tag: ["实时推送", "WebSocket", "SSE", "Netty", "消息推送"]
category: 架构设计
date: 2026-06-27
---

# 实时消息推送系统：WebSocket、SSE 与长轮询对比

> 实时消息推送系统：WebSocket、SSE 与长轮询对比是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。
> 本文介绍了实时消息推送系统：WebSocket、SSE 与长轮询对比的设计原则和实践经验，帮助你提升架构设计能力。

HTTP 是请求-响应模型，客户端发请求，服务端给响应。但很多场景需要服务端**主动推送**：

- 即时消息：微信/钉钉消息
- 实时行情：股票价格波动
- 协同编辑：多人在线文档
- 实时监控：服务器指标
- 直播互动：弹幕、点赞

### 1.2 传统方案的痛苦

```java
// 轮询：每隔 3 秒问一次
setInterval(function() {
    fetch('/api/messages').then(res => res.json()).then(data => {
        if (data.length > 0) {
            renderMessages(data);
        }
    });
}, 3000);
```

**轮询的问题：**
- 大部分请求返回空（无效请求）
- 实时性差（延迟最多 3 秒）
- 浪费带宽和服务器资源

## 二、四种实时推送方案对比

### 2.1 方案总览

| 特性 | 短轮询 | 长轮询 | SSE | WebSocket | MQTT |
|------|--------|--------|-----|-----------|------|
| 通信方式 | 请求-响应 | 请求-响应 | 服务端→客户端 | 双向 | 双向 |
| 连接复用 | 否 | 否 | 是(单HTTP) | 是(TCP升级) | 是(TCP) |
| 实时性 | 差(秒级) | 较好(亚秒级) | 好(毫秒级) | 好(毫秒级) | 好(毫秒级) |
| 浏览器支持 | 全部 | 全部 | 现代浏览器 | 现代浏览器 | 需客户端 |
| 协议 | HTTP | HTTP | HTTP | WS/WSS | MQTT |
| 复杂度 | 最低 | 低 | 低 | 中 | 中高 |
| 适用场景 | 低频 | 一般实时 | 服务端推送 | 双向通信 | IoT |

### 2.2 短轮询 vs 长轮询

**短轮询：** 客户端定时请求服务端，不管有没有数据。

**长轮询：** 客户端发请求，服务端 hold 住直到有数据才返回，客户端收到后再发下一个请求。

```java
// 长轮询服务端实现 (Spring Boot)
@GetMapping("/poll")
public DeferredResult<Message> longPoll() {
    DeferredResult<Message> result = new DeferredResult<>(30000L); // 30秒超时
    result.onTimeout(() -> result.setErrorResult("timeout"));
    
    // 注册到消息等待队列
    messageWaiterRegistry.register(userId, message -> {
        result.setResult(message);
    });
    
    return result;
}
```

## 三、WebSocket 深入

### 3.1 WebSocket 握手过程

WebSocket 建立在 HTTP 之上的协议升级：

```
客户端请求：
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

服务端响应：
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

握手成功后，TCP 连接从 HTTP 协议升级为 WebSocket 协议，后续通信走 WebSocket 帧。

### 3.2 WebSocket 帧格式

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+ - - - - - - - - - - - - - - - + - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
```

关键字段：
- **FIN**：是否最后一帧（消息分片）
- **opcode**：帧类型（0x1 文本、0x2 二进制、0x8 关闭、0x9 Ping、0xA Pong）
- **MASK**：客户端发送的帧必须掩码
- **Payload len**：负载数据长度

## 四、SSE（Server-Sent Events）

### 4.1 SSE 原理

SSE 基于 HTTP 长连接，服务端以 `text/event-stream` 格式持续推送数据：

```java
// Spring Boot SSE 实现
@GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter sse() {
    SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
    
    // 模拟实时推送
    new Thread(() -> {
        try {
            for (int i = 0; i < 100; i++) {
                emitter.send(SseEmitter.event()
                    .name("message")
                    .id(String.valueOf(i))
                    .data("第 " + i + " 条消息")
                    .reconnectTime(3000)); // 断线重连等待时间
                Thread.sleep(1000);
            }
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }).start();
    
    return emitter;
}
```

**客户端：**
```javascript
const eventSource = new EventSource('/sse');

eventSource.onmessage = function(event) {
    console.log('收到消息:', event.data);
};

eventSource.onerror = function() {
    console.log('连接断开，浏览器会自动重连');
};
```

### 4.2 SSE vs WebSocket

| 对比项 | SSE | WebSocket |
|--------|-----|-----------|
| 方向 | 单向(服务端→客户端) | 双向 |
| 协议 | HTTP | 独立协议 |
| 断线重连 | 浏览器自动 | 需手动实现 |
| 浏览器兼容 | 现代浏览器 | 现代浏览器 |
| 跨域 | 遵循CORS | 需处理 |
| 最大连接数 | 浏览器限制6个 | 无限制 |
| 适合场景 | 通知、行情、日志 | 聊天、协同 |

> **选型建议：** 如果只需要服务端推送（不需要客户端发消息），优先用 SSE。更简单，自动重连，调试方便。

## 五、基于 Netty 实现高性能 WebSocket 服务

### 5.1 为什么用 Netty？

Spring 内置的 WebSocket 适合中小规模，当连接数达到十万甚至百万级时，需要 Netty 这样的高性能 NIO 框架。

### 5.2 完整实现

**依赖引入：**

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.108.Final</version>
</dependency>
```

**Netty WebSocket 服务端：**

```java
public class WebSocketServer {

    private final int port;

    public WebSocketServer(int port) {
        this.port = port;
    }

    public void start() throws InterruptedException {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();
                            // HTTP 编解码器
                            pipeline.addLast(new HttpServerCodec());
                            pipeline.addLast(new HttpObjectAggregator(65536));
                            // 支持大数据流
                            pipeline.addLast(new ChunkedWriteHandler());
                            // WebSocket 路径配置
                            pipeline.addLast(new WebSocketServerProtocolHandler("/ws"));
                            // 自定义处理器
                            pipeline.addLast(new WebSocketServerHandler());
                        }
                    });

            ChannelFuture future = bootstrap.bind(port).sync();
            System.out.println("WebSocket 服务启动，端口: " + port);
            future.channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        new WebSocketServer(8080).start();
    }
}
```

**WebSocket 消息处理器：**

```java
public class WebSocketServerHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {

    // 存储所有在线连接
    private static final ChannelGroup channels = 
        new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        Channel incoming = ctx.channel();
        channels.add(incoming);
        // 广播上线通知
        channels.writeAndFlush(new TextWebSocketFrame(
            "[系统] 新用户上线，当前在线: " + channels.size()));
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame frame) {
        String message = frame.text();
        System.out.println("收到消息: " + message);
        
        // 广播消息给所有在线用户
        for (Channel channel : channels) {
            if (channel != ctx.channel()) {
                channel.writeAndFlush(new TextWebSocketFrame(
                    "[" + ctx.channel().remoteAddress() + "] " + message));
            } else {
                channel.writeAndFlush(new TextWebSocketFrame("[我] " + message));
            }
        }
    }

    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) {
        channels.remove(ctx.channel());
        channels.writeAndFlush(new TextWebSocketFrame(
            "[系统] 用户下线，当前在线: " + channels.size()));
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 5.3 前端客户端

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>WebSocket 聊天室</title></head>
<body>
    <div id="messages"></div>
    <input type="text" id="input" placeholder="输入消息...">
    <button onclick="send()">发送</button>

    <script>
        const ws = new WebSocket('ws://localhost:8080/ws');
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('input');

        ws.onopen = function() {
            messagesDiv.innerHTML += '<p>已连接</p>';
        };

        ws.onmessage = function(event) {
            messagesDiv.innerHTML += '<p>' + event.data + '</p>';
        };

        ws.onclose = function() {
            messagesDiv.innerHTML += '<p>已断开</p>';
        };

        function send() {
            ws.send(input.value);
            input.value = '';
        }

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') send();
        });
    </script>
</body>
</html>
```

## 六、MQTT 协议

### 6.1 MQTT 简介

MQTT（Message Queuing Telemetry Transport）是 IBM 开发的轻量级消息协议，专为物联网设计。

```
┌──────────┐         ┌──────────┐
│ 传感器 A  │── publish──→│          │
└──────────┘         │  MQTT    │         ┌──────────┐
                     │  Broker  │── push──→│ 手机 App  │
┌──────────┐         │          │         └──────────┘
│ 传感器 B  │── publish──→│          │
└──────────┘         └──────────┘
```

核心概念：
- **Topic**：消息主题，支持通配符（`home/+/temperature`）
- **QoS**：服务质量等级（0=最多一次，1=最少一次，2=恰好一次）
- **Retain**：保留消息，新订阅者也能收到
- **Last Will**：遗嘱消息，客户端异常断开时自动发布

### 6.2 Java 客户端

```java
// Eclipse Paho MQTT 客户端
import org.eclipse.paho.client.mqttv3.*;

public class MqttDemo {
    public static void main(String[] args) throws MqttException {
        String broker = "tcp://localhost:1883";
        String clientId = "java-client-1";

        MqttClient client = new MqttClient(broker, clientId);
        MqttConnectOptions options = new MqttConnectOptions();
        options.setCleanSession(true);
        options.setKeepAliveInterval(60);
        // 遗嘱消息
        options.setWill("status/java-client-1", 
            "offline".getBytes(), 1, true);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                System.out.println("连接断开");
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                System.out.println("收到 [" + topic + "]: " + new String(message.getPayload()));
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {
                System.out.println("消息发送完成");
            }
        });

        client.connect(options);
        
        // 订阅主题
        client.subscribe("home/+/temperature", 1);
        
        // 发布消息
        MqttMessage msg = new MqttMessage("25.5".getBytes());
        msg.setQos(1);
        client.publish("home/livingroom/temperature", msg);
    }
}
```

## 七、百万连接架构设计

### 7.1 单机百万连接的挑战

Linux 默认配置无法支撑百万连接，需要调优：

```bash
# 文件描述符限制
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p

# ulimit
ulimit -n 1100000

# Netty 参数调优
bootstrap.option(ChannelOption.SO_BACKLOG, 65535)
    .childOption(ChannelOption.TCP_NODELAY, true)
    .childOption(ChannelOption.SO_RCVBUF, 32 * 1024)
    .childOption(ChannelOption.SO_SNDBUF, 32 * 1024);
```

### 7.2 集群推送架构

```
                    ┌─────────────┐
                    │  负载均衡器  │
                    │  (HAProxy)  │
                    └──────┬──────┘
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
       ┌─────────┐   ┌─────────┐   ┌─────────┐
       │ Push-1  │   │ Push-2  │   │ Push-3  │
       │ Netty   │   │ Netty   │   │ Netty   │
       └────┬────┘   └────┬────┘   └────┬────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────↓──────┐
                    │    Redis    │
                    │  (Pub/Sub)  │
                    └─────────────┘
                           │
                    ┌──────↓──────┐
                    │  消息队列    │
                    │ (Kafka)     │
                    └─────────────┘
```

**推送流程：**
1. 业务系统发消息到 Kafka
2. Push 服务消费 Kafka 消息
3. 通过 Redis Pub/Sub 广播到所有 Push 节点
4. 每个节点检查本地连接，推送给目标用户

### 7.3 连接管理

```java
// 用户连接路由表
public class UserChannelManager {
    // userId -> Channel 映射
    private static final ConcurrentHashMap<String, Channel> userChannels = 
        new ConcurrentHashMap<>();
    
    // channel -> userId 映射（反向查找）
    private static final ConcurrentHashMap<ChannelId, String> channelUsers = 
        new ConcurrentHashMap<>();

    public static void register(String userId, Channel channel) {
        userChannels.put(userId, channel);
        channelUsers.put(channel.id(), userId);
    }

    public static Channel getChannel(String userId) {
        return userChannels.get(userId);
    }

    public static void unregister(Channel channel) {
        String userId = channelUsers.remove(channel.id());
        if (userId != null) {
            userChannels.remove(userId);
        }
    }
}
```

### 7.4 心跳机制

```java
// 心跳检测处理器
public class HeartbeatHandler extends ChannelInboundHandlerAdapter {
    
    private static final int READ_IDLE_TIMEOUT = 90; // 90秒没收到数据则断开

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent event = (IdleStateEvent) evt;
            if (event.state() == IdleState.READER_IDLE) {
                System.out.println("读空闲，关闭连接: " + ctx.channel().remoteAddress());
                ctx.channel().close();
            }
        }
    }
}

// 在 pipeline 中加入
pipeline.addLast(new IdleStateHandler(READ_IDLE_TIMEOUT, 0, 0, TimeUnit.SECONDS));
pipeline.addLast(new HeartbeatHandler());
```

## 八、避坑指南

### 8.1 WebSocket 常见坑

1. **连接泄漏**：务必在 `handlerRemoved` 中清理用户连接映射
2. **消息过大**：设置 `WebSocketServerProtocolHandler` 的最大帧大小
3. **跨域问题**：WebSocket 不受同源策略限制，但建议做 Origin 校验
4. **代理穿透**：Nginx 需要配置 `proxy_set_header Upgrade $http_upgrade`

**Nginx WebSocket 代理配置：**
```nginx
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;  # 长连接超时
}
```

### 8.2 SSE 常见坑

1. **连接数限制**：浏览器对同域 HTTP 连接数有限制（通常 6 个）
2. **断线检测**：SSE 断线后浏览器会自动重连，但需要处理消息 ID 去重
3. **Nginx 缓冲**：必须关闭缓冲，否则消息会被攒到一起发送

```nginx
location /sse {
    proxy_pass http://backend;
    proxy_buffering off;  # 关闭缓冲！
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
}
```

## 九、面试要点与总结

### 高频面试题

**Q1：WebSocket 和 HTTP 的区别？**
> 答：(1) 通信模式：HTTP 是请求-响应，WebSocket 是全双工；(2) 协议：WebSocket 通过 HTTP 升级握手后切换到 WS 协议；(3) 数据格式：HTTP 是文本为主，WebSocket 支持文本和二进制帧；(4) 开销：WebSocket 建连后通信头部开销仅 2-10 字节，远小于 HTTP。

**Q2：百万连接推送系统怎么设计？**
> 答：分三层：(1) 接入层用 Netty 集群，每台机器 10 万连接，10 台就是百万；(2) 路由层用 Redis 存储用户→连接节点的映射；(3) 消息层用 Kafka 削峰。推送时先从 Redis 查用户在哪个节点，再通过 Redis Pub/Sub 通知该节点推送。

**Q3：SSE 的浏览器连接数限制怎么绕过？**
> 答：两种方式：(1) 用不同域名/子域名建立多个 SSE 连接；(2) 用 WebSocket 替代（无连接数限制）。

**Q4：长轮询和 WebSocket 怎么选？**
> 答：如果需要双向通信且客户端是现代浏览器，选 WebSocket。如果只是服务端推送且兼容老浏览器（IE），选长轮询或 SSE。长轮询的缺点是每次都要重建 HTTP 连接，开销大。

**Q5：Netty 中如何处理粘包/拆包？**
> 答：WebSocket 协议自带帧边界，不需要额外处理。对于自定义 TCP 协议，Netty 提供了 `LengthFieldBasedFrameDecoder`（长度字段）、`LineBasedFrameDecoder`（换行符）、`DelimiterBasedFrameDecoder`（分隔符）等拆包器。

### 总结

实时推送技术选型总结：

```
单向推送（通知/行情/日志）→ SSE（简单、自动重连）
双向通信（聊天/协同编辑）→ WebSocket（全双工、高性能）
IoT 场景 → MQTT（轻量、QoS 保证）
兼容老浏览器 → 长轮询（降级方案）
百万级连接 → Netty + 集群架构
```

技术选型没有绝对的好坏，关键看场景。一个通知系统用 SSE 就够了，没必要上 WebSocket；一个 IoT 平台用 MQTT 远比 WebSocket 合适。理解每种技术的原理和适用边界，才能做出正确的选型。
