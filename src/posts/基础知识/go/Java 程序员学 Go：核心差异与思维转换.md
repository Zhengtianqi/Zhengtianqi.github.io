---
title: Java 程序员学 Go：核心差异与思维转换
tag: ["Go"]
date: 2026-06-12
category: Go 语言
---

# Java 程序员学 Go：核心差异与思维转换

## 前言

作为一个写了多年 Java 的程序员，切换到 Go 的过程就像从开自动挡汽车换成手动挡——一开始各种不习惯，但习惯后会发现一种朴素而直接的美。

Go 的设计哲学是"少即是多"：语法极简、标准库强大、编译飞快。它刻意抛弃了 Java 的很多"高级特性"（泛型直到 1.18 才有，没有继承、没有注解），换来的是**极低的学习曲线**和**一致的编码风格**。

这篇文章从一个 Java 程序员的视角，帮你快速完成从 Java 到 Go 的思维转换。

---

## 一、Go 语言设计哲学

### 1.1 Go 是什么

Go（Golang）由 Google 于 2009 年发布。三位创始人：
- **Ken Thompson**：UNIX 之父，B 语言设计者
- **Rob Pike**：UTF-8 共同设计者
- **Robert Griesemer**：V8 JavaScript 引擎贡献者

它的设计目标简单直接：
1. **编译快**：大型项目秒级编译
2. **执行快**：接近 C/C++ 的性能
3. **开发快**：语言简单、易上手、工具链完善
4. **天生并发**：goroutine + channel 简洁强大

### 1.2 与 Java 的设计哲学对比

| 维度 | Java | Go |
|------|------|-----|
| 目标 | "Write once, run anywhere" | "Simple, fast, productive" |
| 复杂度 | 持续增加（泛型、模块、Record、Pattern Matching……） | 刻意保持简单（1.0 到 1.22 核心语法几乎没变） |
| 面向对象 | 纯 OOP（类、继承、多态） | 组合优于继承，没有 class |
| 异常处理 | try-catch Exception | 显式 error 返回值 |
| 依赖管理 | Maven/Gradle + 中央仓库 | Go Modules + GitHub |
| 运行时 | JVM（解释/JIT） | 编译为原生二进制 |
| 并发 | 线程 + Executor + CompletableFuture | goroutine + channel |
| 泛型 | 2004 年就有（Java 5） | 2022 年才有（Go 1.18） |
| 注解 | 广泛使用（Spring） | 没有注解 |

### 1.3 没有的东西（Go 刻意去除的）

```
❌ 没有 class          → 用 struct + interface
❌ 没有继承            → 用组合（embedding）
❌ 没有异常            → 用多返回值 error
❌ 没有泛型（1.18 之前）→ interface{} / 代码生成
❌ 没有注解            → 代码生成 + 命名约定
❌ 没有构造函数         → 用工厂函数
❌ 没有方法重载         → 用不同函数名
❌ 没有 try-catch-finally → 用 defer
❌ 没有线程            → 用 goroutine
❌ 没有 public/private 关键字 → 用首字母大小写
❌ 没有 implements 关键字 → 隐式接口实现
```

---

## 二、语法对比速览

### 2.1 类型声明：后置 vs 前置

Go 的类型声明在变量名**之后**，这是最先"不适"的地方：

```go
// Java：类型在前
int age = 25;
String name = "Alice";
List<String> names = new ArrayList<>();
Map<String, User> userMap = new HashMap<>();

// Go：类型在后
var age int = 25
name := "Alice"              // 短声明，类型自动推断
names := []string{"Alice", "Bob"}
userMap := map[string]User{}
```

为什么类型后置？Go 的设计者认为这样更自然（从左到右阅读），特别是在复杂声明中：

```go
// 函数类型：参数类型和返回值都在后面
var handler func(int, string) (bool, error)

// Java 等价：Function 类型声明很冗长
BiFunction<Integer, String, Pair<Boolean, Exception>> handler;
```

### 2.2 多返回值

这是 Go 最实用的特性之一：

```go
// Java：只能返回一个值，要用异常或包装类
public User findUser(Long id) throws NotFoundException {
    User user = repository.findById(id);
    if (user == null) {
        throw new NotFoundException("用户不存在");
    }
    return user;
}

// Go：直接返回 (结果, 错误)
func findUser(id int64) (*User, error) {
    user, err := repository.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("查询用户失败: %w", err)
    }
    if user == nil {
        return nil, fmt.Errorf("用户不存在: id=%d", id)
    }
    return user, nil
}

// 调用方
user, err := findUser(123)
if err != nil {
    log.Printf("错误: %v", err)
    return
}
// 使用 user
```

### 2.3 defer：优雅的资源清理

```go
// Java try-with-resources
try (FileInputStream fis = new FileInputStream("data.txt");
     BufferedReader reader = new BufferedReader(new InputStreamReader(fis))) {
    String line = reader.readLine();
    // ...
} // 自动关闭

// Go defer：延迟执行，函数返回时按 LIFO 次序执行
func readFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()  // 函数返回前一定执行

    reader := bufio.NewReader(f)
    line, err := reader.ReadString('\n')
    // ...

    // 可以多个 defer，后进先出
    defer fmt.Println("第三个 defer")
    defer fmt.Println("第二个 defer")
    defer fmt.Println("第一个 defer")
    // 输出：第一个 → 第二个 → 第三个

    return nil
}
```

### 2.4 包管理

```go
// Java: package 声明，public class
package com.example.service;

public class UserService { }

// Go: package 声明在文件顶部，一个目录一个 package
package service

// 大写开头 = public（导出）
func GetUser(id int) *User { ... }

// 小写开头 = private（包内可见）
func validateEmail(email string) bool { ... }
```

```bash
# Go Modules（类似 Maven/Gradle）
# 初始化项目
go mod init github.com/yourname/project

# 添加依赖
go get github.com/gin-gonic/gin

# 依赖保存在 go.mod 和 go.sum 中
# go.mod 类似 pom.xml
# go.sum 类似 pom.xml 的 checksum
```

---

## 三、面向对象差异

### 3.1 struct 替代 class

```go
// Java class
public class User {
    private Long id;          // private
    private String name;
    private int age;

    public User(Long id, String name, int age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String greet() {
        return "Hello, I'm " + name;
    }
}

// Go struct
type User struct {
    ID   int64  // 大写 = 公开字段
    Name string
    age  int    // 小写 = 包内私有
}

// 构造函数（约定俗成用 NewXxx）
func NewUser(id int64, name string, age int) *User {
    return &User{
        ID:   id,
        Name: name,
        age:  age,
    }
}

// 方法（在 struct 外部定义）
func (u *User) Greet() string {
    return "Hello, I'm " + u.Name
}

// Getter/Setter（Go 不强制，需要时自己写）
func (u *User) Age() int { return u.age }

func (u *User) SetAge(age int) {
    if age < 0 {
        age = 0
    }
    u.age = age
}
```

### 3.2 接口：隐式实现

这是 Go 最颠覆 Java 程序员认知的设计：

```go
// Java：显式实现
public class Dog implements Animal {
    @Override
    public String speak() { return "Woof"; }
}

// Go：隐式实现 — 只要你有这个方法，你就实现了这个接口
type Animal interface {
    Speak() string
}

type Dog struct{}

func (d Dog) Speak() string {
    return "Woof"
}

// Dog 不需要声明 "implements Animal"
// 只要有 Speak() 方法，它就自动实现了 Animal 接口
var a Animal = Dog{}  // 编译通过

// 空接口 interface{} 类似 Java 的 Object
var anything interface{} = "hello"
anything = 42
anything = Dog{}
```

**隐式接口的好处**：
- 你可以为别人写的 struct 在你自己的包里定义接口
- 依赖反转天然实现：调用方定义接口，实现方只需提供方法
- 类似于 Java 的"面向接口编程"，但更灵活

```go
// 标准库的小接口哲学：接口越小越通用
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type ReadWriter interface {
    Reader
    Writer
}
```

### 3.3 组合替代继承

```go
// Java：继承
public class Animal {
    public void eat() { System.out.println("Eating..."); }
}

public class Dog extends Animal {
    public void bark() { System.out.println("Woof!"); }
}

// Go：组合（embedding）
type Animal struct{}

func (a Animal) Eat() { fmt.Println("Eating...") }

type Dog struct {
    Animal  // 嵌入（不是继承！）
}

func (d Dog) Bark() { fmt.Println("Woof!") }

// 使用
dog := Dog{}
dog.Eat()   // 可以直接调用嵌入类型的方法
dog.Bark()

// 但 Dog 不是 Animal！这是组合不是继承
// 你不能把 Dog 传给需要 Animal 参数的地方
// 但你可以通过接口达到多态效果
```

---

## 四、错误处理：最大的思维转换

### 4.1 Go 的错误处理哲学

Java 程序员最不适应的可能是 Go 的错误处理方式：

```go
// Go 的方式：每个可能失败的调用都返回 error
func processUser(id int64) (*User, error) {
    // 校验输入
    if id <= 0 {
        return nil, fmt.Errorf("invalid user id: %d", id)
    }

    // 查询数据库
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("find user %d: %w", id, err)
    }

    // 校验状态
    if user.Status != "active" {
        return nil, fmt.Errorf("user %d is not active", id)
    }

    // 更新用户
    user.LastLogin = time.Now()
    if err := db.UpdateUser(user); err != nil {
        return nil, fmt.Errorf("update user %d: %w", id, err)
    }

    return user, nil
}
```

```java
// Java 对比：异常链
public User processUser(Long id) {
    if (id <= 0) {
        throw new IllegalArgumentException("invalid user id: " + id);
    }

    User user = db.findUser(id)
        .orElseThrow(() -> new NotFoundException("user not found: " + id));

    if (!"active".equals(user.getStatus())) {
        throw new BusinessException("user " + id + " is not active");
    }

    user.setLastLogin(LocalDateTime.now());
    db.updateUser(user);

    return user;
}
```

### 4.2 错误包装与判断

```go
import "errors"

// 定义哨兵错误
var ErrNotFound = errors.New("not found")
var ErrUnauthorized = errors.New("unauthorized")

// 包装错误
func getUser(id int64) (*User, error) {
    user, err := db.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("getUser(%d): %w", id, err)
    }
    return user, nil
}

// 错误判断
user, err := getUser(123)
if errors.Is(err, ErrNotFound) {           // errors.Is：判断是否是某个错误
    // 处理未找到
}
if errors.As(err, &dbError) {              // errors.As：类型断言
    // 数据库相关错误
}
```

### 4.3 panic 和 recover

```go
// panic 类似于 Java 的 RuntimeException（未检查异常）
// 但 Go 建议：不要用 panic 做常规错误处理！

// panic 的使用场景：
// 1. 程序无法继续运行的严重错误
// 2. 编程错误（如越界访问）
func mustConnect(dsn string) *sql.DB {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        panic(fmt.Sprintf("无法连接数据库: %v", err))
    }
    return db
}

// recover：捕获 panic（类似 catch，但很少用）
func safeCall() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("Recovered from panic: %v", r)
        }
    }()
    mightPanic()
}
```

---

## 五、并发模型对比

### 5.1 goroutine vs Thread

```go
// Java：创建线程
new Thread(() -> {
    System.out.println("Hello from thread");
}).start();

// 使用线程池
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> {
    System.out.println("Hello from thread pool");
});

// Go：创建 goroutine（轻量级，一个关键字）
go func() {
    fmt.Println("Hello from goroutine")
}()

// 一个 goroutine 初始栈只有 2KB（Java 线程约 1MB）
// 你可以轻松启动数十万个 goroutine
for i := 0; i < 100000; i++ {
    go func(id int) {
        fmt.Println("goroutine", id)
    }(i)
}
```

### 5.2 goroutine 原理

```
Java Thread：
  OS 线程，内核调度
  栈大小：~1MB（固定）
  创建/切换：系统调用（微秒级）
  数量上限：几千

Go goroutine：
  用户态"协程"，Go 运行时调度
  栈大小：2KB 起步，动态增长/收缩
  创建/切换：函数调用（纳秒级）
  数量上限：数十万
  GMP 模型：G(goroutine) → M(OS thread) → P(processor/逻辑核)
```

### 5.3 CompletableFuture vs goroutine+channel

```java
// Java：异步编排
CompletableFuture<User> userFuture =
    CompletableFuture.supplyAsync(() -> userService.getUser(id));

CompletableFuture<List<Order>> ordersFuture =
    CompletableFuture.supplyAsync(() -> orderService.getOrders(id));

CompletableFuture<Dashboard> dashboardFuture = userFuture
    .thenCombine(ordersFuture, (user, orders) -> {
        return new Dashboard(user, orders);
    });

Dashboard dashboard = dashboardFuture.join();
```

```go
// Go：goroutine + channel
type result struct {
    user   *User
    orders []Order
}

func getDashboard(userID int64) (*Dashboard, error) {
    userCh := make(chan *User, 1)
    errCh := make(chan error, 1)

    // 并发获取用户
    go func() {
        user, err := userService.GetUser(userID)
        if err != nil {
            errCh <- err
            return
        }
        userCh <- user
    }()

    // 并发获取订单
    orders, ordersErr := orderService.GetOrders(userID)
    if ordersErr != nil {
        return nil, ordersErr
    }

    // 等待用户结果
    select {
    case user := <-userCh:
        return &Dashboard{User: user, Orders: orders}, nil
    case err := <-errCh:
        return nil, err
    }
}
```

---

## 六、实战：用 Go 重写 Spring Boot CRUD

### 6.1 项目结构

```
Java Spring Boot:                    Go (Gin):
src/main/java/com/example/           .
├── Application.java                 ├── main.go
├── controller/                      ├── handler/
│   └── UserController.java          │   └── user.go
├── service/                         ├── service/
│   ├── UserService.java             │   └── user.go
│   └── impl/UserServiceImpl.java    ├── repository/
├── repository/                      │   └── user.go
│   └── UserRepository.java          ├── model/
├── model/                           │   └── user.go
│   ├── User.java                    ├── middleware/
│   └── UserDTO.java                 │   └── auth.go
└── config/                          ├── go.mod
    └── SecurityConfig.java          └── go.sum
```

### 6.2 Go 实现

```go
// main.go
package main

import (
    "github.com/gin-gonic/gin"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func main() {
    // 数据库连接
    db, err := gorm.Open(postgres.Open(
        "host=localhost user=postgres dbname=mydb port=5432 sslmode=disable",
    ), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }

    // 自动迁移
    db.AutoMigrate(&User{})

    // 依赖注入（手动，类似 @Autowired）
    userRepo := NewUserRepository(db)
    userService := NewUserService(userRepo)
    userHandler := NewUserHandler(userService)

    // 路由（类似 @RequestMapping）
    r := gin.Default()

    api := r.Group("/api/v1")
    {
        // 用户路由
        users := api.Group("/users")
        {
            users.GET("", userHandler.List)
            users.GET("/:id", userHandler.GetByID)
            users.POST("", userHandler.Create)
            users.PUT("/:id", userHandler.Update)
            users.DELETE("/:id", userHandler.Delete)
        }
    }

    r.Run(":8080") // 启动服务
}
```

```go
// model/user.go
package main

import "time"

type User struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Name      string    `json:"name" gorm:"size:100;not null"`
    Email     string    `json:"email" gorm:"size:200;uniqueIndex;not null"`
    Age       int       `json:"age"`
    Status    string    `json:"status" gorm:"default:'active'"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}

// 请求 DTO
type CreateUserRequest struct {
    Name  string `json:"name" binding:"required,min=2,max=100"`
    Email string `json:"email" binding:"required,email"`
    Age   int    `json:"age" binding:"min=0,max=150"`
}

type UpdateUserRequest struct {
    Name  *string `json:"name"`   // 指针类型：nil = 不更新
    Email *string `json:"email"`
    Age   *int    `json:"age"`
}
```

```go
// repository/user.go
package main

import "gorm.io/gorm"

type UserRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
    return &UserRepository{db: db}
}

func (r *UserRepository) FindAll(page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64

    r.db.Model(&User{}).Count(&total)

    offset := (page - 1) * pageSize
    result := r.db.Limit(pageSize).Offset(offset).Find(&users)
    return users, total, result.Error
}

func (r *UserRepository) FindByID(id uint) (*User, error) {
    var user User
    result := r.db.First(&user, id)
    if result.Error != nil {
        return nil, result.Error
    }
    return &user, nil
}

func (r *UserRepository) Create(user *User) error {
    return r.db.Create(user).Error
}

func (r *UserRepository) Update(user *User) error {
    return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
    return r.db.Delete(&User{}, id).Error
}
```

```go
// service/user.go
package main

import (
    "fmt"
    "gorm.io/gorm"
)

type UserService struct {
    repo *UserRepository
}

func NewUserService(repo *UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) List(page, pageSize int) ([]User, int64, error) {
    if page < 1 {
        page = 1
    }
    if pageSize < 1 || pageSize > 100 {
        pageSize = 20
    }
    return s.repo.FindAll(page, pageSize)
}

func (s *UserService) GetByID(id uint) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, fmt.Errorf("用户不存在: id=%d", id)
        }
        return nil, err
    }
    return user, nil
}

func (s *UserService) Create(req CreateUserRequest) (*User, error) {
    user := &User{
        Name:   req.Name,
        Email:  req.Email,
        Age:    req.Age,
        Status: "active",
    }
    if err := s.repo.Create(user); err != nil {
        return nil, err
    }
    return user, nil
}
```

```go
// handler/user.go
package main

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
)

type UserHandler struct {
    service *UserService
}

func NewUserHandler(service *UserService) *UserHandler {
    return &UserHandler{service: service}
}

// 统一返回格式
func success(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, gin.H{
        "code": 0,
        "message": "success",
        "data": data,
    })
}

func errorResponse(c *gin.Context, status int, message string) {
    c.JSON(status, gin.H{
        "code": status,
        "message": message,
        "data": nil,
    })
}

func (h *UserHandler) List(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

    users, total, err := h.service.List(page, pageSize)
    if err != nil {
        errorResponse(c, http.StatusInternalServerError, "查询失败")
        return
    }

    success(c, gin.H{
        "records": users,
        "total": total,
        "page": page,
        "pageSize": pageSize,
    })
}

func (h *UserHandler) GetByID(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 64)
    if err != nil {
        errorResponse(c, http.StatusBadRequest, "无效的 ID")
        return
    }

    user, err := h.service.GetByID(uint(id))
    if err != nil {
        errorResponse(c, http.StatusNotFound, err.Error())
        return
    }

    success(c, user)
}

func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        errorResponse(c, http.StatusBadRequest, "参数错误: "+err.Error())
        return
    }

    user, err := h.service.Create(req)
    if err != nil {
        errorResponse(c, http.StatusInternalServerError, "创建失败")
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "code": 0,
        "message": "success",
        "data": user,
    })
}

func (h *UserHandler) Update(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 64)
    if err != nil {
        errorResponse(c, http.StatusBadRequest, "无效的 ID")
        return
    }

    user, err := h.service.GetByID(uint(id))
    if err != nil {
        errorResponse(c, http.StatusNotFound, err.Error())
        return
    }

    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        errorResponse(c, http.StatusBadRequest, "参数错误")
        return
    }

    // 部分更新
    if req.Name != nil {
        user.Name = *req.Name
    }
    if req.Email != nil {
        user.Email = *req.Email
    }
    if req.Age != nil {
        user.Age = *req.Age
    }

    if err := h.service.repo.Update(user); err != nil {
        errorResponse(c, http.StatusInternalServerError, "更新失败")
        return
    }

    success(c, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 64)
    if err != nil {
        errorResponse(c, http.StatusBadRequest, "无效的 ID")
        return
    }

    if _, err := h.service.GetByID(uint(id)); err != nil {
        errorResponse(c, http.StatusNotFound, err.Error())
        return
    }

    if err := h.service.repo.Delete(uint(id)); err != nil {
        errorResponse(c, http.StatusInternalServerError, "删除失败")
        return
    }

    c.JSON(http.StatusNoContent, nil)
}
```

---

## 七、选型场景：什么时候用 Go

### Go 的优势场景

| 场景 | 为什么 Go 合适 |
|------|---------------|
| 微服务/API 后端 | 编译块、部署简单、内存占用小 |
| 云原生基础设施 | Docker/K8s 都是 Go 写的 |
| CLI 工具 | 编译为单个二进制，无需安装运行时 |
| 高并发服务 | goroutine 轻量，适合大量连接 |
| 网络代理/网关 | 原生并发支持，coraza 等 |
| DevOps 工具 | 跨平台编译，单文件分发 |

### Java 的优势场景

| 场景 | 为什么 Java 合适 |
|------|-----------------|
| 大型企业应用 | Spring 生态完善 |
| 复杂业务逻辑 | 成熟的 ORM、事务管理 |
| 大数据处理 | Hadoop/Spark/Flink 生态 |
| 需要大量第三方集成 | SDK 几乎都有 Java 版 |
| 团队规模大 | 人才池大，代码规范成熟 |

### 我的建议

```
新项目选择 Go 如果：
  ✅ 简单的微服务/API（不需要 Spring 的全套能力）
  ✅ 高并发要求（WebSocket、长连接）
  ✅ 容器化部署（镜像小、启动快）
  ✅ 团队小（语言简单，容易达成统一风格）

继续用 Java 如果：
  ✅ 复杂业务逻辑（需要 AOP、事务传播、声明式缓存）
  ✅ 现有 Java 基础设施（团队、工具链、CI/CD）
  ✅ 需要大量第三方集成（Spring 生态的 SDK）
  ✅ 团队 Java 经验丰富
```

---

## 八、总结

### Java → Go 思维转换清单

| Java 习惯 | Go 对应 |
|-----------|---------|
| `class` | `struct` + methods |
| `interface` + `implements` | `interface`（隐式实现） |
| `extends` | `struct embedding`（组合） |
| `try-catch-finally` | 多返回值 `error` + `defer` |
| `throw new Exception()` | `return fmt.Errorf(...)` |
| `@Autowired` | 手动构造函数注入 |
| `@Transactional` | 手动 transaction |
| `public/private` | 首字母大写/小写 |
| `List<Foo>` | `[]Foo` |
| `Map<A, B>` | `map[A]B` |
| `Stream API` | `for` 循环 + `slice` 操作 |
| `Thread` / `ExecutorService` | `goroutine` / `channel` |
| `CompletableFuture` | `goroutine` + `channel` + `sync.WaitGroup` |
| `synchronized` / `Lock` | `sync.Mutex` / `sync.RWMutex` |
| JAR 包 | 单二进制可执行文件 |
| JVM 参数调优 | 编译时决定（无 JVM） |

### 学习路线建议

1. **Day 1-3**：基础语法（变量、控制流、函数、struct）
2. **Day 4-6**：slice、map、interface、error handling
3. **Day 7-10**：goroutine、channel、sync 包
4. **Day 11-14**：标准库（net/http、encoding/json、database/sql）
5. **Day 15-21**：做一个完整的 Web 项目

### 最后的话

从 Java 到 Go，不是"学一门新语言"，而是**换一种编程思维**。当你习惯了 Go 的简洁、习惯了显式的错误处理、习惯了隐式接口带来的灵活性，你会发现：

> Go 不是删减版的 Java——它是另一种编程哲学。

少即是多。简即是美。

---

*本文基于 Go 1.22 + Gin + GORM 编写。*
