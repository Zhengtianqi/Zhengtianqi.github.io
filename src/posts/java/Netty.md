---
title: Netty介绍及简单示例
author: ztq
tag:
  - Netty
category:
  - java基础
date: 2022-09-07 14:12:00
---
# 一、介绍
## 简介
netty是一个异步、基于事件驱动的网络应用框架，用以快速开发高性能、高可用的网络IO程序
netty主要针对在TCP协议下，面向Clients端的高并发应用，或者peer-to-peer场景下的大量数据持续性传输的应用
netty本质是一个NIO框架，适用于服务器通讯相关的多种场景。
Netty是一个提供异步事件驱动的网络应用框架，用以快速开发高性能、高可靠性的网络服务器和客户端程序。
Netty是一个NIO框架，使用它可以简单快速地开发网络应用程序，比如客户端和服务端的协议。Netty大大简化了网络程序的开发过程比如TCP和UDP的 Socket的开发。
## 互联网行业
在分布式系统中，各个节点之间需要远程服务调用，高性能的 RPC 框架必不可少，Netty 作为 异步高性能的通信框架，往往作为基础通信组件被这些 RPC 框架使用
典型的应用有:阿里分布式服务框架 Dubbo 的 RPC 框架使用 Dubbo 协议进行节点间通信，Dubbo 协议默 认使用 Netty 作为基础通信组件，用于实现各进程节点之间的内部通信
## 游戏行业
Netty 作为高性能的基础通信组件，提供了 TCP/UDP 和 HTTP 协议栈，方便定制和开发私有协议栈，账号登录服务器
地图服务器之间可以方便的通过 Netty 进行高性能的通信
## 大数据领域
经典的 Hadoop 的高性能通信和序列化组件 Avro 的 RPC 框架，默认采用 Netty 进行跨界点通信，它的 Netty Service 基于 Netty 框架二次封装实现
# 二、ECHO服务端
一个服务端通常会对一个请求作出响应
## （1）引入依赖
目前5停止维护，建议4：https://netty.io/wiki/user-guide.html
```java
    <dependency>
        <groupId>io.netty</groupId>
        <artifactId>netty-all</artifactId>
        <version>4.1.70.Final</version>
        <scope>compile</scope>
    </dependency>
```
## （2）服务端
NioEventLoopGroup 是用来处理I/O操作的多线程事件循环器，Netty提供了许多不同的EventLoopGroup的实现用来处理不同传输协议。
在这个例子中我们实现了一个服务端的应用，因此会有2个NioEventLoopGroup会被使用。第一个经常被叫做‘boss’，用来接收进来的连接。第二个经常被叫做‘worker’，用来处理已经被接收的连接，一旦‘boss’接收到连接，就会把连接信息注册到‘worker’上。
如何知道多少个线程已经被使用，如何映射到已经创建的Channels上都需要依赖于EventLoopGroup的实现，并且可以通过构造函数来配置他们的关系。
ServerBootstrap 是一个启动NIO服务的辅助启动类。
```java
package com.example.echo;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;

public class EchoServer {
private int port;

    public EchoServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        // 接收连接
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        // 处理信息
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            // 定义server
            ServerBootstrap b = new ServerBootstrap();
            // 添加分组
            b.group(bossGroup, workerGroup)
                    // 添加通道设置非阻塞
                    .channel(NioServerSocketChannel.class)
                    // 服务端可连接队列数量
                    .option(ChannelOption.SO_BACKLOG, 128)
                    // 开启长连接
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    // 流程处理
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel channel) {
                            channel.pipeline().addLast(new EchoServerHandler());
                        }
                    });
            // 在机器上绑定了机器所有网卡上的8080端口。当然现在你可以多次调用bind()方法(基于不同绑定地址)。
            ChannelFuture cf = b.bind(port).sync();
            // Wait until the server socket is closed.
            // In this example, this does not happen, but you can do that to gracefully
            // shut down your server.
            cf.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        int port;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        } else {
            port = 9098;
        }
        new EchoServer(port).run();
    }
}
```
## （3）处理函数
channelRead()方法是在数据被接收的时候调用。让我们放一些代码到DiscardServerHandler类的channelRead()方法。
super.channelRead()，会走一个判断，若与channelRead0()中参数相同则走channelRead0()，走完channelRead0()之后就会释放ctx和msg，即SimpleChannelInboundHandler中的release()。
这个例子中，收到的消息的类型是ByteBuf
exceptionCaught()事件处理方法是当出现Throwable对象才会被调用，即当Netty由于IO错误或者处理器在处理事件时抛出的异常时。在大部分情况下，捕获的异常应该被记录下来并且把关联的channel给关闭掉。然而这个方法的处理方式会在遇到不同异常的情况下有不同的实现，比如你可能想在关闭连接之前发送一个错误码的响应消息。
```java
package com.example.echo;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufUtil;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.util.CharsetUtil;

public class EchoServerHandler extends SimpleChannelInboundHandler {

    /**
     * 这里我们覆盖了chanelRead()事件处理方法。每当从客户端收到新的数据时，这个方法会在收到消息时被调用，这个例子中，收到的消息的类型是ByteBuf
     *
     * @param ctx
     * @param msg
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        super.channelRead(ctx, msg);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf in = (ByteBuf) msg;
        // 转换成UFT-8
        System.out.println("Server get:" + in.toString(CharsetUtil.UTF_8));
        // 转换成ASCII
        System.out.println("Server get:" + in.toString(CharsetUtil.US_ASCII));
        // 转换16进制
        System.out.printf("Server get: ");
        System.out.println(ByteBufUtil.hexDump(in));
        // 逐个字节读取
        System.out.printf("Server get: ");
        while (in.isReadable()) {
            // 读取1个字节转成10进制int表示
            int b = in.readByte() & 0xFF;
            // 再转成2个16进制字符串
            System.out.printf(Integer.toHexString(b) + " ");
        }
        // 返回数据 响应式协议 (与Discard唯一区别：DISCARD服务(丢弃服务，指的是会忽略所有接收的数据的一种协议))
        ctx.write(msg);
        // 不需要释放msg，因为super.channelRead(ctx, msg);有释放资源的方法。
    }

    /**
     * exceptionCaught()事件处理方法是当出现Throwable对象才会被调用，即当Netty由于IO错误或者处理器在处理事件时抛出的异常时。
     * 在大部分情况下，捕获的异常应该被记录下来并且把关联的channel给关闭掉。
     * 然而这个方法的处理方式会在遇到不同异常的情况下有不同的实现，比如你可能想在关闭连接之前发送一个错误码的响应消息。
     *
     * @param ctx
     * @param cause
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
```

# 参考：
https://www.bookstack.cn/read/essential-netty-in-action/SUMMARY.md
http://ifeve.com/netty5-user-guide/
