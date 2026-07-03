---
title: Linux 进程管理深度解析：fork、exec、信号与进程状态
tag: ["Linux", "进程管理", "fork", "信号", "操作系统"]
category: 基础知识
date: 2026-07-03
---

# Linux 进程管理深度解析：fork、exec、信号与进程状态

Java 里的 ProcessBuilder 底层是什么？fork 和 vfork 有什么区别？僵尸进程怎么产生又怎么清理？信号机制怎么用？一篇搞懂 Linux 进程管理的核心知识。

---

## 一、进程基础

### 1.1 进程 vs 线程 vs 协程

```
进程（Process）：
  独立的内存空间（虚拟地址空间）
  独立的文件描述符表
  独立的用户/权限
  创建开销大（复制页表、文件描述符等）
  通信需要 IPC（管道、共享内存、Socket 等）

线程（Thread）：
  共享进程的地址空间
  共享文件描述符、信号处理
  独立的栈、寄存器、PC
  创建开销小
  通信简单（共享内存）

协程（Coroutine）：
  用户态调度（不需要内核参与）
  共享线程的栈（或独立的小栈）
  创建开销极小（KB 级）
  不能利用多核（需要多线程+多协程）

  ┌─────────────────────────────┐
  │         进程 (Process)        │
  │  ┌─────────┐  ┌─────────┐  │
  │  │ 线程 1   │  │ 线程 2   │  │
  │  │ ┌──┐┌──┐│  │ ┌──┐    │  │
  │  │ │协││协││  │ │协│    │  │
  │  │ │程││程││  │ │程│    │  │
  │  │ └──┘└──┘│  │ └──┘    │  │
  │  └─────────┘  └─────────┘  │
  │  独立的地址空间               │
  └─────────────────────────────┘
```

### 1.2 进程标识

```c
// 进程标识符
pid_t pid = getpid();        // 当前进程 ID
pid_t ppid = getppid();      // 父进程 ID
pid_t pgid = getpgrp();      // 进程组 ID
uid_t uid = getuid();         // 用户 ID
gid_t gid = getgid();         // 组 ID

// 进程 ID 分配规则：
// PID 1: init/systemd（所有进程的祖先）
// PID 2: kthreadd（内核线程）
// PID 分配递增，达到上限后回绕

// Linux 查看
ps aux         // 所有进程
ps -ef | grep java
top / htop     // 实时监控
/proc/[pid]/   // 进程信息（status, cmdline, fd 等）
```

---

## 二、进程创建

### 2.1 fork()

```c
// fork：创建子进程（父进程的副本）
#include <unistd.h>

pid_t pid = fork();
if (pid < 0) {
    // fork 失败
    perror("fork failed");
} else if (pid == 0) {
    // 子进程
    printf("Child: pid=%d, ppid=%d\n", getpid(), getppid());
} else {
    // 父进程（pid 是子进程 ID）
    printf("Parent: pid=%d, child=%d\n", getpid(), pid);
}

// fork 的行为：
// 1. 创建新进程（子进程）
// 2. 子进程是父进程的几乎完全副本
//    - 独立的地址空间（COW，Copy-On-Write）
//    - 独立的文件描述符表（副本，指向同一文件）
//    - 独立的信号处理表
// 3. fork 返回两次：
//    - 父进程返回子进程 PID
//    - 子进程返回 0
```

```
COW（Copy-On-Write）机制：

  fork() 时：
    不立即复制父进程的整个地址空间
    而是让子进程共享父进程的物理页
    页表标记为只读

  当子进程或父进程写某个页时：
    → 触发缺页异常
    → 内核复制该页（真正的物理拷贝）
    → 修改页表为可写

  优势：fork 极快（只复制页表，不复制物理页）
        如果子进程立即 exec → 完全不需要复制

  ┌─────── 父进程 ───────┐
  │ 虚拟地址空间          │
  │  页表 (标记COW只读)   │
  └──────────┬───────────┘
             │ 映射
             ▼
  ┌───────────────────────┐
  │   物理内存页 (共享)    │
  └──────────┬───────────┘
             │ 映射
             ▼
  ┌─────── 子进程 ───────┐
  │ 虚拟地址空间          │
  │  页表 (标记COW只读)   │
  └──────────────────────┘
  
  写入时 → 复制该页 → 父子各自独立页
```

### 2.2 vfork() 和 clone()

```c
// vfork：创建子进程但不复制地址空间
// 子进程共享父进程的地址空间
// 子进程必须立即 exec 或 _exit
pid_t pid = vfork();
if (pid == 0) {
    // 子进程：不能 return，不能修改变量
    // 必须调用 exec 或 _exit
    _exit(0);
}

// vfork 的历史：
//   早期 fork 没有 COW → fork 很慢
//   vfork 不复制页表 → 快
//   现代 fork 有 COW → vfork 优势不大
//   POSIX 已废弃 vfork

// clone：Linux 特有，更灵活的进程创建
// 可以选择共享哪些资源
int flags = CLONE_VM | CLONE_FILES | CLONE_SIGHAND;
// CLONE_VM:     共享虚拟地址空间（= 线程）
// CLONE_FILES:  共享文件描述符表
// CLONE_SIGHAND: 共享信号处理表
// 不设 CLONE_VM:  独立地址空间（= 进程）

// clone 是 fork 和 pthread_create 的底层实现
// fork = clone(不共享)
// pthread_create = clone(共享 VM + FILES + SIGHAND)
```

### 2.3 exec()

```c
// exec：替换当前进程的代码和数据
// PID 不变，但程序完全变了

if (pid == 0) {
    // 子进程：执行新程序
    execlp("ls", "ls", "-l", "-a", NULL);
    // 如果 exec 成功，下面的代码不会执行
    perror("exec failed");
    _exit(1);
}

// exec 系列：
// execl:  参数列表 (execl("/bin/ls", "ls", "-l", NULL))
// execlp: 在 PATH 中查找 (execlp("ls", "ls", "-l", NULL))
// execv:  参数数组 (execv("/bin/ls", argv))
// execvp: PATH 查找 + 数组
// execve: 最底层系统调用

// fork + exec 标准模式：
pid_t pid = fork();
if (pid == 0) {
    // 重定向标准输入/输出
    dup2(pipe_fd[1], STDOUT_FILENO);
    close(pipe_fd[0]);
    close(pipe_fd[1]);
    
    execvp("grep", (char*[]){"grep", "error", NULL});
    _exit(1);  // exec 失败才到这里
}
```

---

## 三、进程状态

### 3.1 七种状态

```
Linux 进程状态：

  R (Running)       运行中 / 就绪
  S (Sleeping)      可中断睡眠（等待事件）
  D (Disk sleep)    不可中断睡眠（等待 IO）
  T (Stopped)       暂停（SIGSTOP/SIGTSTP）
  t (Tracing stop)  被调试器暂停
  Z (Zombie)        僵尸进程（已终止，等待父进程回收）
  X (Dead)          已死亡（瞬间状态，看不到）

  状态转换：

       fork()                  exit()
  ┌──────────┐  ┌─────┐  ┌─────────┐  ┌─────┐
  │  R(运行)  │←─│ R(就绪)│←─│ S(睡眠)  │  │ Z(僵尸)│
  │          │  │      │  │         │  │      │
  └──────────┘  └─────┘  └─────────┘  └─────┘
       │           ↑           │           │
       │ SIGSTOP   │ SIGCONT   │ IO完成     │ wait()
       ▼           │           │           ▼
  ┌──────────┐    │    ┌─────────┐  ┌─────────┐
  │ T(暂停)   │────┘    │ D(不可中断)│  │ X(死亡)  │
  └──────────┘         └─────────┘  └─────────┘
```

### 3.2 查看进程状态

```bash
# ps 查看状态
ps aux | head -5
# USER PID %CPU %MEM  VSZ  RSS TTY STAT START TIME COMMAND
# root   1  0.0  0.0  194  68  ?    Ss   Jun01 0:30 /sbin/init
# root   2  0.0  0.0    0   0  ?    S    Jun01 0:00 [kthreadd]

# STAT 列：
# Ss = 会话首领导 + 可中断睡眠
# S  = 可中断睡眠
# R  = 运行中
# D  = 不可中断睡眠
# Z  = 僵尸
# T  = 暂停
# +  = 前台进程组
# l  = 多线程

# /proc 查看状态
cat /proc/1234/status
# State:  S (sleeping)
# Tgid:   1234 (线程组 ID)
# Pid:    1234 (进程 ID)
# PPid:   1    (父进程 ID)

# top 实时查看
top -p 1234
```

---

## 四、僵尸进程与孤儿进程

### 4.1 僵尸进程

```
僵尸进程（Zombie）：

  子进程已 exit()，但父进程尚未 wait()
  → 子进程的 PCB（进程控制块）仍保留
  → 占用 PID 资源
  → 大量僵尸 → PID 耗尽 → 无法创建新进程

  产生过程：
  父进程                  子进程
     │                       │
     │ ──── fork() ────────→ │
     │                       │
     │ (做其他事)              │
     │                       │
     │ ←──── exit(0) ──────  │ (子进程终止，变为 Z 状态)
     │                       │
     │ (未调用 wait())         │ ← PCB 仍保留！
     │                       │
     │ ──── wait() ────────→ │ (父进程回收 → PCB 释放)
```

```c
// 避免僵尸进程

// 方法 1：父进程调用 wait()
pid_t pid = fork();
if (pid == 0) {
    // 子进程
    _exit(0);
} else {
    // 父进程
    int status;
    wait(&status);  // 阻塞等待子进程退出
    // 或 waitpid(pid, &status, 0);
}

// 方法 2：SIGCHLD 信号处理
void sigchld_handler(int sig) {
    int status;
    while (waitpid(-1, &status, WNOHANG) > 0) {
        // 回收所有已退出的子进程
    }
}

signal(SIGCHLD, sigchld_handler);
// 子进程退出时自动收到 SIGCHLD → 回收

// 方法 3：忽略 SIGCHLD（内核自动回收）
signal(SIGCHLD, SIG_IGN);
// 子进程退出后内核自动回收，不产生僵尸

// 方法 4：两次 fork（孙子进程）
pid_t pid = fork();
if (pid == 0) {
    // 子进程
    pid_t grandchild = fork();
    if (grandchild == 0) {
        // 孙子进程：实际工作
        execlp("ls", "ls", NULL);
    }
    // 子进程立即退出 → 孙子变成孤儿 → init 收养
    _exit(0);
}
// 父进程只需 wait 子进程（立即退出）
wait(NULL);
// 孙子进程由 init 回收，不会产生僵尸
```

### 4.2 清理已有的僵尸进程

```bash
# 查找僵尸进程
ps aux | grep 'Z'

# 找到僵尸进程的父进程
ps -o ppid= -p <zombie_pid>

# 方法 1：让父进程回收
kill -SIGCHLD <parent_pid>

# 方法 2：杀死父进程（僵尸被 init 收养并回收）
kill <parent_pid>

# 方法 3：如果父进程是 init/systemd → 重启服务
```

---

## 五、信号机制

### 5.1 常用信号

```
信号         编号   默认行为    含义
──────────────────────────────────────────
SIGHUP       1      终止       挂起（终端断开）
SIGINT       2      终止       中断（Ctrl+C）
SIGQUIT      3      核心       退出（Ctrl+\）
SIGILL       4      核心       非法指令
SIGABRT      6      核心       abort() 调用
SIGFPE       8      核心       浮点异常（除零）
SIGKILL      9      终止       强制杀死（不可捕获/忽略）
SIGSEGV     11      核心       段错误（非法内存访问）
SIGPIPE     13      终止       管道破裂
SIGALRM     14      终止       alarm 定时器
SIGTERM     15      终止       优雅终止（kill 默认信号）
SIGCHLD     17      忽略       子进程状态变化
SIGCONT     18      继续       继续（恢复暂停的进程）
SIGSTOP     19      暂停       暂停（不可捕获/忽略）
SIGTSTP     20      暂停       终端暂停（Ctrl+Z）
SIGUSR1     10      终止       用户自定义 1
SIGUSR2     12      终止       用户自定义 2

不可捕获/忽略的信号：SIGKILL(9) 和 SIGSTOP(19)
→ 保证 root 总能杀死/暂停任何进程
```

### 5.2 信号处理

```c
// C 语言信号处理
#include <signal.h>

// 自定义信号处理函数
void handler(int sig) {
    printf("Received signal %d\n", sig);
}

// 注册信号处理
signal(SIGINT, handler);     // Ctrl+C
signal(SIGTERM, handler);    // kill 命令

// sigaction（更推荐，更精确）
struct sigaction sa;
sa.sa_handler = handler;
sigemptyset(&sa.sa_mask);   // 处理期间不阻塞其他信号
sa.sa_flags = 0;
sigaction(SIGINT, &sa, NULL);

// 发送信号
kill(pid, SIGTERM);     // 发送 SIGTERM 给指定进程
raise(SIGINT);          // 给自己发信号
kill(0, SIGTERM);       // 发给当前进程组所有进程

// alarm 定时
alarm(5);  // 5 秒后收到 SIGALRM
```

```java
// Java 信号处理
import sun.misc.Signal;

Signal.handle(new Signal("TERM"), signal -> {
    System.out.println("Received SIGTERM, graceful shutdown...");
    // 优雅关闭逻辑
    System.exit(0);
});

// Java 应用优雅关闭
// 1. 注册 shutdown hook
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    System.out.println("Shutting down gracefully...");
    // 关闭资源、保存状态
}));

// 2. Docker / systemd 发送 SIGTERM
//    JVM 收到 SIGTERM → 调用 shutdown hook → 退出
//    如果 10 秒内没退出 → 发 SIGKILL 强制杀死

// 3. Spring Boot 优雅关闭
// server.shutdown=graceful
// spring.lifecycle.timeout-per-shutdown-phase=30s
```

---

## 六、Java 中的进程管理

```java
// Java 创建子进程
ProcessBuilder pb = new ProcessBuilder("ls", "-l", "-a");
pb.directory(new File("/tmp"));
pb.redirectOutput(new File("output.txt"));
pb.redirectError(new File("error.txt"));

Process process = pb.start();

// 等待完成
int exitCode = process.waitFor();
System.out.println("Exit code: " + exitCode);

// 读取输出
try (BufferedReader reader = 
        new BufferedReader(new InputStreamReader(process.getInputStream()))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}

// 超时等待
boolean finished = process.waitFor(5, TimeUnit.SECONDS);
if (!finished) {
    process.destroyForcibly();  // SIGKILL
}

// ProcessBuilder 底层：
//   Java → JVM → fork + exec → 子进程
//   在 Linux 上：clone + exec

// Spring Boot 优雅关闭
// application.yml
// server:
//   shutdown: graceful
// spring:
//   lifecycle:
//     timeout-per-shutdown-phase: 30s

// @PreDestroy
@PreDestroy
public void cleanup() {
    // 关闭线程池
    executor.shutdown();
    try {
        if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
            executor.shutdownNow();
        }
    } catch (InterruptedException e) {
        executor.shutdownNow();
    }
}
```

---

## 七、面试要点

### Q：fork 和 vfork 的区别？

fork 创建子进程时使用 COW（Copy-On-Write）机制，父子进程有独立的地址空间，写时才复制物理页。vfork 创建的子进程直接共享父进程地址空间，子进程必须立即 exec 或 _exit，不能修改变量。现代 Linux 的 fork 已有 COW 优化，性能接近 vfork，vfork 已被 POSIX 废弃。

### Q：僵尸进程怎么产生？怎么解决？

产生：子进程已 exit() 但父进程未调用 wait()/waitpid()，子进程的 PCB 残留占用 PID 资源。
解决：
1. 父进程调用 wait() 或 waitpid() 回收
2. 注册 SIGCHLD 信号处理器，在回调中 waitpid 回收
3. 忽略 SIGCHLD（signal(SIGCHLD, SIG_IGN)），内核自动回收
4. 两次 fork：子进程立即退出，孙子进程由 init 收养

### Q：SIGKILL 和 SIGTERM 的区别？

SIGKILL(9)：强制杀死，进程无法捕获/忽略/阻塞，立即终止。不能做清理工作。
SIGTERM(15)：优雅终止，进程可以捕获并处理（保存数据、关闭连接、清理资源）。kill 命令默认发送 SIGTERM。
生产实践：先发 SIGTERM 等待优雅关闭（如 30 秒），超时再发 SIGKILL 强制杀死。Docker 停容器就是这个流程。

---

## 八、总结

```
进程创建：
  fork：COW 副本（独立地址空间）
  vfork：共享地址空间（已废弃）
  clone：灵活选择共享资源（fork 和 pthread 的底层）

进程状态：
  R(运行) S(睡眠) D(不可中断睡眠) T(暂停) Z(僵尸) X(死亡)

僵尸进程：子进程已退出 + 父进程未 wait
  → wait/waitpid / SIGCHLD 处理 / 忽略 SIGCHLD / 两次 fork

信号：
  SIGKILL(9) 不可捕获，强制杀死
  SIGTERM(15) 可捕获，优雅关闭
  SIGCHLD(17) 子进程状态变化
  SIGSTOP(19) 不可捕获，暂停

Java 进程管理：
  ProcessBuilder → fork + exec
  ShutdownHook → SIGTERM 优雅关闭
  Spring Boot: server.shutdown=graceful
```
