---
title: Linux IO 模型深度解析：select、poll、epoll 与 Java NIO
tag: ["Linux", "IO模型", "epoll", "Java NIO", "Reactor"]
category: 基础知识
date: 2026-07-03
---

# Linux IO 模型深度解析：select、poll、epoll 与 Java NIO

Redis、Nginx、Netty 为什么快？因为它们底层都用 epoll。select、poll、epoll 到底什么区别？Java NIO 怎么映射到 Linux IO 模型？Reactor 模式怎么实现？一篇讲透。

---

## 一、五种 IO 模型

### 1.1 全景图

```
应用程序调用 recvfrom() 读数据的过程：

模型1：阻塞 IO（Blocking IO）
  用户线程：调用 recvfrom() → 阻塞 → 阻塞 → 阻塞 → 数据返回
  特点：整个等待 + 复制过程都阻塞

模型2：非阻塞 IO（Non-blocking IO）
  用户线程：调用 recvfrom() → 立即返回 EWOULDBLOCK
           再次调用 → EWOULDBLOCK → ... → 数据就绪 → 复制 → 返回
  特点：等待不阻塞但需要轮询（CPU 浪费）

模型3：IO 多路复用（IO Multiplexing）
  用户线程：调用 select/poll/epoll → 阻塞等待（可同时监控多个 FD）
           数据就绪 → 返回 → 调用 recvfrom() 复制数据
  特点：一个线程监控多个连接

模型4：信号驱动 IO（Signal-driven IO）
  用户线程：注册 SIGIO 信号 → 做其他事 → 数据就绪 → 收到信号
           → 调用 recvfrom() 复制数据
  特点：等待不阻塞，复制时阻塞

模型5：异步 IO（Asynchronous IO）
  用户线程：调用 aio_read() → 立即返回 → 做其他事
           → 数据复制完成 → 回调通知
  特点：全过程不阻塞（等待 + 复制都不阻塞）
  Linux: io_uring（5.1+）/ AIO
  Windows: IOCP

┌─────────────────────────────────────────────────────┐
│                                                     │
│   阻塞      等待数据        复制数据                  │
│   IO        ████████        ████                    │
│                                                     │
│   非阻塞    轮询（不阻塞）    ████                    │
│   IO        poll poll poll   ████                   │
│                                                     │
│   IO多路复用 select阻塞      ████                    │
│   (epoll)    （可监控多FD）   ████                   │
│                                                     │
│   信号驱动   信号通知          ████                   │
│   IO        （不阻塞）        ████                   │
│                                                     │
│   异步IO     不阻塞            不阻塞                  │
│   (AIO)     （回调通知）      （内核完成）              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 二、select

### 2.1 原理

```c
// select 系统调用
int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);

// fd_set：位图（bitmap），每位代表一个文件描述符
// FD_SETSIZE = 1024（默认最大 1024 个 FD）

// 使用流程
fd_set readfds;
FD_ZERO(&readfds);
FD_SET(fd1, &readfds);  // 设置 fd1
FD_SET(fd2, &readfds);  // 设置 fd2
FD_SET(fd3, &readfds);  // 设置 fd3

int ready = select(maxfd + 1, &readfds, NULL, NULL, &timeout);
// select 遍历所有 FD，检查是否有数据就绪
// 返回就绪 FD 数量

if (ready > 0) {
    // 检查哪些 FD 就绪（需要遍历所有 FD）
    if (FD_ISSET(fd1, &readfds)) {
        // fd1 有数据可读
        read(fd1, buf, sizeof(buf));
    }
    if (FD_ISSET(fd2, &readfds)) {
        read(fd2, buf, sizeof(buf));
    }
    // ... 遍历所有 FD
}
```

### 2.2 局限

```
select 的三大缺陷：

1. FD 数量限制
   FD_SETSIZE = 1024（编译时确定，不可动态扩展）
   → 一个线程最多监控 1024 个连接

2. 全量扫描
   每次 select 返回后，需要遍历所有 FD 检查 FD_ISSET
   假设监控 1000 个 FD，只有 1 个就绪 → 也要遍历 1000 个
   → O(n) 复杂度

3. 数据拷贝
   每次调用 select 需要将 fd_set 从用户空间拷贝到内核空间
   返回时再拷贝回来
   → 大量 FD 时拷贝开销大

4. fd_set 不可重用
   select 会修改 fd_set（清除未就绪的位）
   → 每次调用前需要重新设置 fd_set
```

---

## 三、poll

### 3.1 改进

```c
// poll 系统调用
struct pollfd {
    int fd;         // 文件描述符
    short events;   // 关注的事件（POLLIN/POLLOUT）
    short revents;  // 返回的事件
};

int poll(struct pollfd *fds, nfds_t nfds, int timeout);

// 使用
struct pollfd fds[3];
fds[0].fd = fd1;  fds[0].events = POLLIN;
fds[1].fd = fd2;  fds[1].events = POLLIN;
fds[2].fd = fd3;  fds[2].events = POLLIN;

int ready = poll(fds, 3, -1);  // -1 = 无限等待

if (fds[0].revents & POLLIN) {
    read(fd1, buf, sizeof(buf));
}
```

### 3.2 poll vs select

```
                select              poll
FD 数量限制      1024                无限制（用链表/数组）
数据结构         位图（fd_set）       struct pollfd 数组
fd_set 重用     不可重用（被修改）    可重用（events 和 revents 分离）
全量扫描         是 O(n)              是 O(n)
拷贝            每次全量拷贝           每次全量拷贝

结论：poll 解决了 FD 数量限制，但仍然是 O(n) 全量扫描
```

---

## 四、epoll

### 4.1 核心设计

```
epoll 三个核心系统调用：

1. epoll_create：创建 epoll 实例
   int epfd = epoll_create(1);
   // 内核创建：
   //   - 红黑树（管理所有注册的 FD）
   //   - 就绪链表（存放就绪的 FD）

2. epoll_ctl：注册/修改/删除 FD
   epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);
   // 将 FD 插入红黑树
   // 注册回调函数（当 FD 就绪时由内核调用）
   
3. epoll_wait：等待就绪事件
   epoll_wait(epfd, events, maxevents, timeout);
   // 只返回就绪的 FD
   // 从就绪链表中取数据

epoll 核心优势：
  1. 红黑树管理 FD → 插入/删除 O(log n)
  2. 就绪链表 → epoll_wait 只返回就绪的 FD → O(1)（就绪数量）
  3. 内核回调机制 → FD 就绪时内核自动加入就绪链表
  4. 不需要全量扫描
```

### 4.2 数据结构

```
epoll 内部数据结构：

  ┌─────────────────────────────┐
  │       epoll 实例             │
  │                             │
  │   红黑树（管理所有 FD）       │
  │     ┌───┐                   │
  │     │fd5│                   │
  │    ╱     ╲                  │
  │  ┌─┐       ┌─┐              │
  │  │3│       │7│   每个节点：  │
  │   ╲       ╱     {fd, event, │
  │   ┌─┐   ┌─┐     callback}   │
  │   │1│   │6│                 │
  │   └─┘   └─┘                 │
  │                             │
  │   就绪链表（仅就绪 FD）       │
  │   [fd3] → [fd7]             │
  │                             │
  └─────────────────────────────┘

工作流程：
  1. epoll_ctl(ADD, fd3) → fd3 插入红黑树
  2. fd3 有数据到达 → 网卡中断 → 内核回调 → fd3 加入就绪链表
  3. epoll_wait → 从就绪链表取出 fd3 → 返回给用户
  4. 用户只需处理 fd3（不需要遍历所有 FD）
```

### 4.3 LT vs ET 模式

```
LT（Level Triggered，水平触发，默认）：
  只要 FD 上有可读数据 → epoll_wait 就会返回
  → 如果不读完，下次 epoll_wait 还会返回
  → 编程简单，但可能多次通知

ET（Edge Triggered，边缘触发）：
  FD 从不可读变为可读 → epoll_wait 返回一次
  → 必须一次性读完所有数据（循环 read 直到 EAGAIN）
  → 否则下次 epoll_wait 不会通知（数据"丢失"）
  → 编程复杂但效率更高

// ET 模式读取
while (true) {
    int n = read(fd, buf, sizeof(buf));
    if (n == -1 && errno == EAGAIN) {
        break;  // 数据读完
    }
    if (n <= 0) {
        break;  // 异常或 EOF
    }
    // 处理 buf
}

// LT vs ET
              LT                    ET
通知次数       多次（直到读完）        一次
读取方式       可只读一部分           必须循环读完
编程复杂度     低                    高
效率           略低（多次通知）        高（减少 epoll_wait 调用）
适用           通用                   高性能（Nginx/Redis）

Redis：LT 模式
Nginx：ET 模式
Netty：LT 模式（默认）
```

### 4.4 epoll 代码示例

```c
// epoll 使用示例
#define MAX_EVENTS 10

int main() {
    int epfd = epoll_create1(0);
    
    // 添加监听 socket
    struct epoll_event ev;
    ev.events = EPOLLIN;  // 默认 LT
    ev.data.fd = listen_fd;
    epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);
    
    struct epoll_event events[MAX_EVENTS];
    
    while (1) {
        int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
        // n = 就绪 FD 数量，只返回就绪的
        
        for (int i = 0; i < n; i++) {
            int fd = events[i].data.fd;
            
            if (fd == listen_fd) {
                // 新连接
                int conn_fd = accept(listen_fd, NULL, NULL);
                ev.events = EPOLLIN | EPOLLET;  // ET 模式
                ev.data.fd = conn_fd;
                epoll_ctl(epfd, EPOLL_CTL_ADD, conn_fd, &ev);
            } else {
                // 数据可读
                handle_read(fd);
            }
        }
        // 只处理 n 个就绪 FD，不需要遍历所有 FD
    }
}
```

---

## 五、Java NIO 与 epoll

### 5.1 Java NIO 三大组件

```java
// 1. Channel（通道）：双向数据传输
SocketChannel channel = SocketChannel.open();
channel.configureBlocking(false);  // 非阻塞模式
channel.connect(new InetSocketAddress("localhost", 8080));

// 2. Buffer（缓冲区）：数据容器
ByteBuffer buffer = ByteBuffer.allocate(1024);
// position, limit, capacity
// flip(): 写→读切换
// clear(): 读→写切换
// compact(): 读→写切换（保留未读数据）

// 3. Selector（选择器）：IO 多路复用
Selector selector = Selector.open();
channel.register(selector, SelectionKey.OP_READ);
// 底层在 Linux 上就是 epoll
```

### 5.2 Selector 源码映射

```
Java NIO Selector → Linux epoll 映射：

Selector.open()         → epoll_create()
channel.register()      → epoll_ctl(EPOLL_CTL_ADD)
selector.select()       → epoll_wait()
selectionKey.interestOps() → epoll_ctl(EPOLL_CTL_MOD)
selectionKey.cancel()   → epoll_ctl(EPOLL_CTL_DEL)

Java NIO 始终用 LT 模式
```

### 5.3 NIO 完整示例

```java
public class NioServer {
    
    public static void main(String[] args) throws IOException {
        Selector selector = Selector.open();
        
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false);
        serverChannel.bind(new InetSocketAddress(8080));
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);
        
        while (true) {
            selector.select();  // 阻塞直到有事件
            
            Iterator<SelectionKey> keys = selector.selectedKeys().iterator();
            while (keys.hasNext()) {
                SelectionKey key = keys.next();
                keys.remove();  // 必须手动移除！否则下次还在
                
                if (key.isAcceptable()) {
                    // 新连接
                    ServerSocketChannel server = (ServerSocketChannel) key.channel();
                    SocketChannel client = server.accept();
                    client.configureBlocking(false);
                    client.register(selector, SelectionKey.OP_READ);
                    
                } else if (key.isReadable()) {
                    // 数据可读
                    SocketChannel client = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    int n = client.read(buffer);
                    if (n == -1) {
                        client.close();
                    } else {
                        buffer.flip();
                        // 处理数据
                    }
                }
            }
        }
    }
}
```

---

## 六、Reactor 模式

### 6.1 单 Reactor 单线程

```
Redis 6.0 之前就是这个模型：

  ┌───────────────────────────┐
  │        Reactor            │
  │  (epoll_wait + dispatch)  │
  │                           │
  │  ┌─────┐  ┌─────┐        │
  │  │Acceptor│ │Handler│     │
  │  │(accept)│ │(read/ │     │
  │  │       │ │ write)│     │
  │  └─────┘  └─────┘        │
  │                           │
  │  单线程：接受连接 + IO + 业务  │
  └───────────────────────────┘

优点：简单，无并发问题
缺点：一个慢操作阻塞全部
适用：Redis（内存操作快）
```

### 6.2 单 Reactor 多线程

```
  ┌───────────────────────────┐
  │        Reactor            │ ← 单线程
  │  (epoll_wait + dispatch)  │
  │                           │
  │  ┌─────┐                  │
  │  │Acceptor│ ← accept       │
  │  └─────┘                  │
  │  ┌─────┐                  │
  │  │Handler│ ← read/write    │
  │  └─────┘                  │
  └───────┬───────────────────┘
          │
          ▼
  ┌───────────────────────────┐
  │     Worker 线程池          │
  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │
  │  │W1│ │W2│ │W3│ │W4│    │ ← 业务处理
  │  └──┘ └──┘ └──┘ └──┘    │
  └───────────────────────────┘

优点：IO 和业务分离
缺点：Reactor 单线程仍是瓶颈
```

### 6.3 主从 Reactor（Netty 模型）

```
  ┌───────────────────────────┐
  │     Main Reactor          │ ← 主 Reactor（1 个线程）
  │  (epoll_wait + dispatch)  │
  │  ┌─────┐                  │
  │  │Acceptor│ ← 只处理 accept │
  │  └─────┘                  │
  └───────┬───────────────────┘
          │ 分配连接
          ▼
  ┌───────────────────────────┐
  │    Sub Reactor Pool       │ ← 从 Reactor（N 个线程）
  │  ┌──────────┐ ┌──────────┐│
  │  │Reactor 1 │ │Reactor 2 ││
  │  │epoll_wait│ │epoll_wait││ ← 每个从 Reactor 独立 epoll
  │  │Handler   │ │Handler   ││
  │  └──────────┘ └──────────┘│
  │  ┌──────────┐ ┌──────────┐│
  │  │Reactor 3 │ │Reactor 4 ││
  │  │epoll_wait│ │epoll_wait││
  │  │Handler   │ │Handler   ││
  │  └──────────┘ └──────────┘│
  └───────────────────────────┘

Netty 对应：
  Main Reactor → BossGroup（1 个 NioEventLoop）
  Sub Reactor  → WorkerGroup（N 个 NioEventLoop）
  NioEventLoop = Selector + Thread + TaskQueue

优点：充分利用多核，无单点瓶颈
适用：Netty、Nginx Worker
```

---

## 七、面试要点

### Q：select、poll、epoll 的区别？

1. FD 数量：select 限制 1024，poll 和 epoll 无限制
2. 性能：select/poll 是 O(n) 全量扫描，epoll 是 O(1) 只返回就绪的
3. 数据结构：select 用位图，poll 用数组，epoll 用红黑树+就绪链表
4. 拷贝：select/poll 每次全量拷贝 FD 集合，epoll 只在 epoll_ctl 时拷贝一次
5. 触发模式：select/poll 只有 LT，epoll 支持 LT 和 ET

### Q：epoll 为什么高效？

1. 红黑树管理 FD：插入/删除 O(log n)，不需要每次拷贝全部 FD
2. 就绪链表：epoll_wait 只返回就绪的 FD，不需要遍历所有 FD
3. 内核回调：FD 就绪时内核通过回调自动加入就绪链表，不需要轮询
4. ET 模式：减少 epoll_wait 调用次数（只通知一次）

### Q：Java NIO 的 Selector 底层是什么？

在 Linux 上是 epoll，在 Windows 上是 select（Windows 没有 epoll），在 macOS 上是 kqueue。JDK 通过 `sun.nio.ch` 包适配不同平台。Java NIO 默认使用 LT 模式。Netty 在 NIO 之上封装了主从 Reactor 模式（BossGroup + WorkerGroup）。

---

## 八、总结

```
IO 模型演进：阻塞 → 非阻塞 → IO多路复用 → 信号驱动 → 异步IO

select：位图，FD≤1024，O(n) 全量扫描
poll：  数组，无限制，O(n) 全量扫描
epoll： 红黑树+就绪链表，O(1)，内核回调

LT vs ET：
  LT：有数据就通知（可只读部分）→ 简单
  ET：状态变化才通知（必须读完）→ 高效

Java NIO → Linux epoll（LT 模式）
Reactor 模式：
  单 Reactor 单线程（Redis）
  单 Reactor 多线程
  主从 Reactor（Netty）
```
