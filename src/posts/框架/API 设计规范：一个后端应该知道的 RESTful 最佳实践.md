---
title: API 设计规范：一个后端应该知道的 RESTful 最佳实践
date: 2026-06-11
category: 架构设计
tag: ["API", "RESTful"]
---

# API 设计规范：一个后端应该知道的 RESTful 最佳实践

> API 设计规范：一个后端应该知道的 RESTful 最佳实践是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。
> 本文介绍了API 设计规范：一个后端应该知道的 RESTful 最佳实践的设计原则和实践经验，帮助你提升架构设计能力。

REST（Representational State Transfer，表述性状态转移）由 Roy Fielding 在 2000 年博士论文中提出。它不是协议，而是一种**架构风格**，核心思想是：

1. **资源导向（Resource-Oriented）**：一切皆资源，每个资源有唯一 URL
2. **无状态（Stateless）**：每个请求包含所有必要信息，服务器不保存客户端状态
3. **统一接口（Uniform Interface）**：使用标准 HTTP 方法操作资源
4. **表述（Representation）**：资源可以有多种表述（JSON、XML、HTML）
5. **HATEOAS**：超媒体驱动（理想化，实践中很少完全实现）

### 1.2 Richardson 成熟度模型

```
Level 0: 一个 URL，一个 HTTP 方法（SOAP 风格）
Level 1: 多个 URL，区分资源
Level 2: 使用 HTTP 动词（GET/POST/PUT/DELETE） ← 大多数 API 的目标
Level 3: HATEOAS（超媒体控制）
```

大多数企业级 API 做到 Level 2 就足够了。

## 二、URL 设计规范

### 2.1 基本规则

```
✅ 正确示范
GET    /users           # 获取用户列表
GET    /users/123       # 获取单个用户
POST   /users           # 创建用户
PUT    /users/123       # 完整更新用户
PATCH  /users/123       # 部分更新用户
DELETE /users/123       # 删除用户
GET    /users/123/orders # 获取用户的订单列表

❌ 错误示范
GET    /getUserList     # URL 中不要动词
POST   /createUser      # 动词应通过 HTTP 方法表达
GET    /user/123        # 不用单数
DELETE /deleteUser?id=123 # 不要在查询参数中传资源 ID
```

### 2.2 命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| 使用名词复数 | 资源集合用复数 | `/users`, `/orders` |
| 小写字母 | 全部小写 | `/user-profiles` |
| 连字符分隔 | 不用下划线 | `/order-items` 非 `/order_items` |
| 避免文件扩展名 | 不暴露实现 | `/users` 非 `/users.json` |
| 层级不超过 3 层 | 避免过深嵌套 | `/users/123/orders` ✅ |

### 2.3 资源层级关系

```yaml
# 资源嵌套设计
/users                          # 用户集合
/users/{userId}                 # 单个用户
/users/{userId}/orders          # 用户的订单
/users/{userId}/orders/{orderId} # 订单详情
/orders/{orderId}/items         # 订单的商品项
/orders/{orderId}/items/{itemId} # 订单商品项

# 避免过深的嵌套
❌ /users/1/orders/100/items/20/comments/5
# 应该平铺
✅ /comments/5  （在返回体中关联上下文）
```

### 2.4 处理非 CRUD 操作

某些操作确实难以映射到 CRUD，处理方式：

```yaml
# 方案1：将动作建模为子资源
POST /users/{userId}/activation    # 激活用户
DELETE /users/{userId}/activation  # 停用用户

# 方案2：使用动词作为资源名（最后手段）
POST /password-resets              # 发起密码重置

# 方案3：在资源上执行动作
POST /orders/{orderId}/cancel      # 取消订单
POST /orders/{orderId}/refund      # 退款
```

**原则**：优先尝试建模为资源，实在不行再用动词。

## 三、HTTP 方法的正确使用

### 3.1 方法语义

| 方法 | 语义 | 幂等性 | 安全性 | 请求体 |
|------|------|--------|--------|--------|
| GET | 获取资源 | ✅ 幂等 | ✅ 安全 | 无 |
| POST | 创建资源 | ❌ 非幂等 | ❌ | 有 |
| PUT | 完整替换 | ✅ 幂等 | ❌ | 有 |
| PATCH | 部分更新 | ❌ 非幂等* | ❌ | 有 |
| DELETE | 删除资源 | ✅ 幂等 | ❌ | 通常无 |
| HEAD | 获取元信息 | ✅ 幂等 | ✅ 安全 | 无 |
| OPTIONS | 获取支持的方法 | ✅ 幂等 | ✅ 安全 | 无 |

*注：PATCH 在 JSON Merge Patch（RFC 7396）下实际上是幂等的。

### 3.2 PUT vs PATCH 的区别

```json
// 现有资源
{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000"
}

// PUT /users/1 —— 完整替换，缺失字段会被删除
{
  "name": "张三三",
  "email": "newemail@example.com"
  // phone 会变成 null！
}

// PATCH /users/1 —— 仅更新指定字段
{
  "name": "张三三"
  // email 和 phone 保持不变
}
```

### 3.3 方法在 Java 中的映射

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    public Result<Page<UserVO>> list(@Valid PageRequest page) { }

    @GetMapping("/{id}")
    public Result<UserVO> getById(@PathVariable Long id) { }

    @PostMapping
    public Result<UserVO> create(@Valid @RequestBody UserCreateRequest req) { }

    @PutMapping("/{id}")
    public Result<UserVO> update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest req) { }

    @PatchMapping("/{id}")
    public Result<UserVO> patch(@PathVariable Long id, @Valid @RequestBody UserPatchRequest req) { }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) { }
}
```

## 四、HTTP 状态码的正确选择

### 4.1 常用状态码速查

**2xx 成功**

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 OK | 请求成功 | GET、PUT、PATCH 成功 |
| 201 Created | 资源已创建 | POST 成功后返回 |
| 202 Accepted | 请求已接受，待处理 | 异步任务 |
| 204 No Content | 成功但无响应体 | DELETE 成功 |

**3xx 重定向**

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 301 Moved Permanently | 永久重定向 | API 迁移 |
| 304 Not Modified | 未修改 | 缓存验证（ETag/If-None-Match） |

**4xx 客户端错误**

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 400 Bad Request | 请求参数错误 | 参数校验失败 |
| 401 Unauthorized | 未认证 | Token 缺失或过期 |
| 403 Forbidden | 无权限 | 已认证但权限不足 |
| 404 Not Found | 资源不存在 | 查询/操作不存在的资源 |
| 405 Method Not Allowed | 方法不允许 | GET 走了 POST 等 |
| 409 Conflict | 资源冲突 | 并发更新冲突、唯一约束冲突 |
| 422 Unprocessable Entity | 参数语义错误 | 参数格式正确但业务逻辑不通过 |
| 429 Too Many Requests | 请求频率超限 | 触发限流 |

**5xx 服务端错误**

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 500 Internal Server Error | 服务器内部错误 | 未预期的异常 |
| 502 Bad Gateway | 网关错误 | 上游服务不可用 |
| 503 Service Unavailable | 服务暂不可用 | 维护中、过载 |
| 504 Gateway Timeout | 网关超时 | 上游服务响应超时 |

### 4.2 常见错误用法

```java
// ❌ 永远返回 200，在 body 中用 code 区分
@PostMapping("/users")
public ApiResponse create(@RequestBody UserRequest req) {
    try {
        userService.create(req);
        return ApiResponse.success(); // 永远是 200
    } catch (Exception e) {
        return ApiResponse.error("USER_EXISTS", "用户已存在");
        // 状态码还是 200！！！完全滥用 HTTP 协议
    }
}

// ✅ 正确做法：让 HTTP 状态码做它该做的事
@PostMapping("/users")
public ResponseEntity<?> create(@RequestBody @Valid UserRequest req) {
    try {
        User user = userService.create(req);
        return ResponseEntity
            .status(HttpStatus.CREATED) // 201
            .body(Result.success(user));
    } catch (DuplicateUserException e) {
        return ResponseEntity
            .status(HttpStatus.CONFLICT) // 409
            .body(Result.error("USER_EXISTS", "用户已存在"));
    }
}
```

### 4.3 401 vs 403 的区分

这是最常被混淆的两个状态码：

```
401 Unauthorized（未认证）：
"我不知道你是谁"
- Token 缺失
- Token 过期
- Token 无效
→ 需要重新登录

403 Forbidden（无权限）：
"我知道你是谁，但你不配"
- 普通用户访问管理员接口
- IP 黑名单
- 账号被禁用
→ 需要提升权限，但不是重新登录的问题
```

## 五、统一返回体设计

### 5.1 标准返回格式

```json
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "timestamp": 1715616000000,
  "requestId": "req-abc-123"
}

// 分页响应
{
  "code": 0,
  "message": "success",
  "data": {
    "records": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": 1715616000000,
  "requestId": "req-abc-123"
}

// 错误响应
{
  "code": 10001,
  "message": "用户已存在",
  "data": null,
  "timestamp": 1715616000000,
  "requestId": "req-abc-123",
  "details": [
    {
      "field": "email",
      "message": "该邮箱已被注册"
    }
  ]
}
```

### 5.2 Java 实现

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private int code;
    private String message;
    private T data;
    private long timestamp;
    private String requestId;

    public static <T> Result<T> success(T data) {
        return new Result<>(0, "success", data,
                System.currentTimeMillis(), MDC.get("requestId"));
    }

    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null,
                System.currentTimeMillis(), MDC.get("requestId"));
    }

    public static <T> Result<T> error(ErrorCode errorCode) {
        return new Result<>(errorCode.getCode(), errorCode.getMessage(), null,
                System.currentTimeMillis(), MDC.get("requestId"));
    }
}

// 分页结果
@Data
public class PageResult<T> {
    private List<T> records;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;

    public PageResult(List<T> records, long total, int page, int pageSize) {
        this.records = records;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) total / pageSize);
    }
}
```

### 5.3 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<Void>> handleValidation(MethodArgumentNotValidException e) {
        List<FieldError> details = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldError(fe.getField(), fe.getDefaultMessage()))
            .collect(Collectors.toList());

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST) // 400
            .body(Result.error(ErrorCode.PARAM_ERROR, details));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusiness(BusinessException e) {
        return ResponseEntity
            .status(e.getHttpStatus())
            .body(Result.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleUnknown(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR) // 500
            .body(Result.error(ErrorCode.INTERNAL_ERROR));
    }
}
```

## 六、错误码体系设计

### 6.1 错误码分段设计

```
错误码格式：模块前缀(2位) + 分类(1位) + 具体错误(2位)

示例：
USER_AUTH_001 → 用户模块 - 认证类 - 第1个错误

模块前缀：
  USER  - 用户模块
  ORDER - 订单模块
  PAY   - 支付模块
  SYS   - 系统级

错误分类：
  AUTH  - 认证授权
  PARAM - 参数校验
  BIZ   - 业务逻辑
  THIRD - 第三方调用
  SYS   - 系统内部
```

### 6.2 Java 枚举实现

```java
public enum ErrorCode {

    // 系统级
    SUCCESS(0, "success"),
    SYS_INTERNAL_ERROR(99999, "系统内部错误"),
    SYS_SERVICE_UNAVAILABLE(99998, "服务暂不可用"),

    // 认证授权
    USER_AUTH_001(10001, "未登录或 Token 已过期"),
    USER_AUTH_002(10002, "用户名或密码错误"),
    USER_AUTH_003(10003, "权限不足"),

    // 用户模块 - 参数
    USER_PARAM_001(10101, "用户名不能为空"),
    USER_PARAM_002(10102, "邮箱格式不正确"),

    // 用户模块 - 业务
    USER_BIZ_001(10201, "用户已存在"),
    USER_BIZ_002(10202, "用户不存在"),
    USER_BIZ_003(10203, "手机号已被绑定"),

    // 订单模块
    ORDER_PARAM_001(20101, "订单金额不能为空"),
    ORDER_BIZ_001(20201, "订单不存在"),
    ORDER_BIZ_002(20202, "订单状态不允许此操作"),
    ORDER_BIZ_003(20203, "库存不足"),

    // 支付模块
    PAY_BIZ_001(30201, "支付金额与订单不匹配"),
    PAY_THIRD_001(30301, "支付网关调用失败");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
```

```java
// 使用示例
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;

    public BusinessException(ErrorCode errorCode, HttpStatus httpStatus) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public int getCode() { return errorCode.getCode(); }
    public HttpStatus getHttpStatus() { return httpStatus; }
}

// 抛出
throw new BusinessException(ErrorCode.ORDER_BIZ_002, HttpStatus.CONFLICT);
```

## 七、API 版本控制

### 7.1 三种版本策略对比

| 策略 | 示例 | 优点 | 缺点 |
|------|------|------|------|
| URL 版本 | `/api/v1/users` | 直观、易调试 | URL 不够简洁 |
| Header 版本 | `Accept: application/vnd.api.v2+json` | URL 干净 | 不易调试、缓存问题 |
| 查询参数版本 | `/api/users?version=2` | 简单 | 污染查询参数、语义不清 |

### 7.2 推荐：URL 版本

```java
// URL 版本是最务实的选择
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    // v1 版本
}

@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    // v2 版本：breaking changes
}
```

### 7.3 Spring Boot 版本控制实现

```java
// 方案：自定义注解
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@RequestMapping
public @interface ApiVersion {
    int value();
}

// 自定义 RequestMappingHandlerMapping
public class ApiVersionHandlerMapping extends RequestMappingHandlerMapping {
    @Override
    protected RequestCondition<?> getCustomTypeCondition(Class<?> handlerType) {
        ApiVersion apiVersion = AnnotationUtils.findAnnotation(handlerType, ApiVersion.class);
        return apiVersion != null ? new ApiVersionCondition(apiVersion.value()) : null;
    }
}

// 使用
@RestController
@ApiVersion(1)
@RequestMapping("/users")  // 自动映射为 /api/v1/users
public class UserController { }
```

### 7.4 何时升级版本

```
需要升级版本的 Breaking Changes：
- 删除字段
- 修改字段类型（String → Integer）
- 修改字段含义（cents → yuan）
- 删除整个接口
- 修改认证方式

不需要升级版本的兼容变更：
- 新增接口
- 新增可选字段
- 新增错误码
- 修改限流值
```

## 八、分页、排序、过滤设计

### 8.1 分页参数规范

```
GET /api/users?page=1&pageSize=20

请求参数：
  page     - 页码，从 1 开始，默认 1
  pageSize - 每页条数，默认 20，最大 100

响应头：
  X-Total-Count: 100
  X-Total-Pages: 5
  Link: </api/users?page=2>; rel="next", </api/users?page=5>; rel="last"
```

```java
// 统一分页请求
@Data
public class PageRequest {
    @Min(1)
    private Integer page = 1;

    @Min(1)
    @Max(100)
    private Integer pageSize = 20;

    // 游标分页（适合大数据量）
    private String cursor;  // 上一页最后一条的游标值
}
```

### 8.2 游标分页 vs 偏移分页

```
偏移分页（OFFSET）：
✅ 简单，支持跳页
❌ 大页码性能差（OFFSET 1000000 LIMIT 20 需要扫描 1000020 行）
适用：管理后台、数据量可控的场景

游标分页（Cursor）：
✅ 性能恒定，不受页码影响
✅ 基于索引，扫描行数最少
❌ 不支持跳页
❌ 只能"上一页/下一页"
适用：Feed 流、大数据量列表、移动端
```

```json
// 游标分页请求
GET /api/users?cursor=eyJpZCI6MTIzfQ==&limit=20

// 游标分页响应
{
  "code": 0,
  "data": {
    "records": [...],
    "nextCursor": "eyJpZCI6MTQzfQ==",
    "hasMore": true
  }
}
```

### 8.3 排序

```
GET /api/users?sort=-createdAt,+name
  - 表示降序，+ 表示升序

GET /api/users?sortBy=createdAt&sortOrder=desc
  更简单的方案
```

```java
// 排序参数解析
@Component
public class SortParser {
    public Sort parse(String sort) {
        List<Sort.Order> orders = new ArrayList<>();
        for (String field : sort.split(",")) {
            field = field.trim();
            if (field.startsWith("-")) {
                orders.add(Sort.Order.desc(field.substring(1)));
            } else {
                String name = field.startsWith("+") ? field.substring(1) : field;
                orders.add(Sort.Order.asc(name));
            }
        }
        return Sort.by(orders);
    }
}
```

### 8.4 过滤

```
GET /api/users?status=active&role=admin
GET /api/users?createdAt=gte:2024-01-01&createdAt=lte:2024-06-30
GET /api/users?name=like:张
```

过滤操作符约定：

| 操作符 | 示例 | 说明 |
|--------|------|------|
| `eq:` | `status=eq:active` | 等于（默认，可省略） |
| `ne:` | `status=ne:deleted` | 不等于 |
| `gt:` | `price=gt:100` | 大于 |
| `gte:` | `price=gte:100` | 大于等于 |
| `lt:` | `price=lt:1000` | 小于 |
| `lte:` | `price=lte:1000` | 小于等于 |
| `like:` | `name=like:张` | 模糊匹配 |
| `in:` | `status=in:active,pending` | 在列表中 |
| `null:` | `deletedAt=null:true` | 是否为空 |

## 九、安全最佳实践

### 9.1 认证与授权

```java
// JWT Token 放在 Authorization 头
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

// Spring Security 配置
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 9.2 输入校验

```java
// 永远不要信任前端传来的数据
@Data
public class UserCreateRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50, message = "用户名长度 2-50 字符")
    @Pattern(regexp = "^[a-zA-Z0-9_\\u4e00-\\u9fa5]+$", message = "用户名只能包含中英文、数字和下划线")
    private String username;

    @NotBlank
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank
    @Size(min = 8, max = 128, message = "密码长度 8-128 字符")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
             message = "密码必须包含大小写字母、数字和特殊字符")
    private String password;

    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "年龄不能超过 150")
    private Integer age;
}
```

### 9.3 敏感信息保护

```java
// 密码等敏感字段不返回
@Data
public class UserVO {
    private Long id;
    private String username;
    private String email;
    @JsonIgnore  // 绝不返回密码
    private String password;
    private LocalDateTime createdAt;
}

// 日志脱敏
@ToString.Exclude
private String password;

// 或者自定义序列化
@JsonSerialize(using = SensitiveSerializer.class)
private String phone;
```

### 9.4 限流

```java
// 登录接口限流
@PostMapping("/login")
@RateLimiter(key = "login", permitsPerSecond = 5, timeout = 10)
public Result<LoginVO> login(@RequestBody LoginRequest req) {
    // 防止暴力破解
}
```

## 十、OpenAPI / Swagger 文档化

### 10.1 SpringDoc 整合

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("电商平台 API")
                .version("1.0.0")
                .description("电商平台后端接口文档")
                .contact(new Contact()
                    .name("开发团队")
                    .email("dev@example.com")))
            .addSecurityItem(new SecurityRequirement().addList("JWT"))
            .components(new Components()
                .addSecuritySchemes("JWT", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
```

```java
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户管理", description = "用户 CRUD 相关接口")
public class UserController {

    @Operation(summary = "获取用户列表", description = "支持分页、排序、过滤")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "成功"),
        @ApiResponse(responseCode = "401", description = "未认证")
    })
    @GetMapping
    public Result<PageResult<UserVO>> list(
            @Parameter(description = "页码", example = "1") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(defaultValue = "20") int pageSize) {
        // ...
    }
}
```

### 10.2 文档即契约

```
API 设计流程：
  1. 前后端根据需求讨论接口
  2. 后端编写 OpenAPI 文档（或使用工具设计）
  3. 前端根据文档并行开发 Mock
  4. 后端实现接口
  5. 联调对接
```

## 十一、总结

### 核心准则清单

- [ ] URL 使用名词复数，小写 + 连字符
- [ ] HTTP 方法语义正确（GET/POST/PUT/PATCH/DELETE）
- [ ] 状态码返回正确（不是永远 200）
- [ ] 统一返回体格式（code + message + data）
- [ ] 错误码体系完整，有模块前缀
- [ ] 版本控制策略明确
- [ ] 分页、排序、过滤参数标准化
- [ ] 参数校验在后端，不信任前端
- [ ] 敏感信息不返回、不泄漏到日志
- [ ] API 文档完善（OpenAPI/Swagger）

### 最后的话

好的 API 设计是一个团队的"软实力"。它不需要高深的技术，但需要自律和共识。当你的 API 被前端、移动端、第三方顺畅调用时，那种"设计得好"的感觉，是对专业素养的最好褒奖。

记住两个原则：
1. **为调用方设计**：站在前端/第三方的角度思考接口好不好用
2. **一致性大于完美**：不完美的统一规范好过各自为政的"最佳实践"

*本文规范适用于 Spring Boot 3.x + Java 17+。*
