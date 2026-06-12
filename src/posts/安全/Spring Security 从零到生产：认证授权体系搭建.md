---
title: Spring Security 从零到生产：认证授权体系搭建
tag: ["Spring Security", "令牌", "Authentication"]
date: 2026-06-12
category: 安全
---

# Spring Security 从零到生产：认证授权体系搭建

> 从概念到实战，手把手带你搭建生产级认证授权体系

## 1. 认证与授权的核心概念

### 1.1 什么是认证（Authentication）

**认证**回答的问题是：**"你是谁？"**

它是确认用户身份的过程。就好比你去银行办业务，柜台工作人员首先要看你出示身份证，确认你的身份。在计算机系统中，认证通常通过以下方式完成：

- **知识因素**（你知道什么）：密码、PIN 码、安全问题答案
- **持有因素**（你拥有什么）：手机验证码、硬件 Token、数字证书
- **固有因素**（你是什么）：指纹、面部识别、虹膜扫描

在 Spring Security 中，认证的核心接口是 `Authentication`：

```java
public interface Authentication extends Principal, Serializable {
    // 获取用户权限集合
    Collection<? extends GrantedAuthority> getAuthorities();

    // 获取用户凭证（通常是密码）
    Object getCredentials();

    // 获取用户详细信息
    Object getDetails();

    // 获取用户主体（通常是用户名）
    Object getPrincipal();

    // 是否已认证
    boolean isAuthenticated();

    // 设置认证状态
    void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException;
}
```

Spring Security 的认证流程可以概括为：

1. 用户提交凭证（用户名 + 密码）
2. `AuthenticationFilter` 拦截请求，提取凭证
3. 将凭证封装成 `Authentication` 对象（通常是 `UsernamePasswordAuthenticationToken`）
4. 调用 `AuthenticationManager` 进行认证
5. `AuthenticationManager` 委托给 `AuthenticationProvider`
6. `AuthenticationProvider` 调用 `UserDetailsService.loadUserByUsername()`
7. 验证密码是否匹配
8. 认证成功，将 `Authentication` 存入 `SecurityContext`

### 1.2 什么是授权（Authorization）

**授权**回答的问题是：**"你能做什么？"**

认证确认身份后，授权决定了这个身份在系统中有哪些权限。银行确认了你的身份，但你能取多少钱、能否办理贷款、能否查看某些账户——这些都需要授权决定。

Spring Security 中授权的核心概念：

```java
// 【权限（Authority）】 —— 最小的授权单元
// 例如：ROLE_USER, ROLE_ADMIN, READ_PRIVILEGE, WRITE_PRIVILEGE

// 【角色（Role）】 —— 权限的集合
// 通常以 ROLE_ 为前缀
// 例如：ROLE_ADMIN = {READ_PRIVILEGE, WRITE_PRIVILEGE, DELETE_PRIVILEGE}

// 授权的四种方式：

// 1. 方法级别注解
@PreAuthorize("hasRole('ADMIN')")
public void deleteUser(Long userId) { ... }

// 2. URL 级别配置
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/**").authenticated()
    .anyRequest().permitAll()
);

// 3. Spring Security 表达式
@PreAuthorize("hasAuthority('USER_DELETE') and #userId != authentication.principal.id")
public void deleteUser(Long userId) { ... }

// 4. 编程式授权
SecurityContextHolder.getContext().getAuthentication().getAuthorities();
```

### 1.3 认证与授权的关系

用一个生活类比来说明：

```
┌─────────────────────────────────────────────────────────┐
│                    进入一个高端会所                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ① 认证（你是谁？）                                        │
│     门口保安检查你的会员卡 → 确认你是"李四"                     │
│                                                         │
│  ② 授权（你能去哪？）                                       │
│     普通会员 → 只能去大厅                                    │
│     金牌会员 → 可以去 VIP 区                                │
│     钻石会员 → 可以去顶层包间                                │
│                                                         │
│  如果认证失败（你没有会员卡）→ 直接拒绝进入                      │
│  如果认证通过但权限不够 → 进入大厅但不能去 VIP 区                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**关键区别**：

| 维度 | 认证（Authentication） | 授权（Authorization） |
|------|----------------------|---------------------|
| 问题 | 你是谁？ | 你能做什么？ |
| 时机 | 授权之前 | 认证之后 |
| 失败响应 | HTTP 401 Unauthorized | HTTP 403 Forbidden |
| Spring 核心接口 | Authentication | GrantedAuthority |
| 核心管理者 | AuthenticationManager | AccessDecisionManager |

---

## 2. Spring Security 过滤器链原理

### 2.1 为什么是过滤器链

Spring Security 基于 Servlet 过滤器（Filter）实现。当一个 HTTP 请求到达时，它会经过一条**过滤器链**（Filter Chain），链上的每个过滤器各司其职：

```
HTTP 请求
   │
   ▼
┌──────────────────────────────────────────────────────┐
│                  Servlet 过滤器链                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────┐                             │
│  │ DelegatingFilterProxy│  ← 将请求委托给 Spring Bean  │
│  └─────────┬───────────┘                             │
│            ▼                                         │
│  ┌─────────────────────┐                             │
│  │  FilterChainProxy   │  ← Spring Security 入口      │
│  └─────────┬───────────┘                             │
│            ▼                                         │
│  ┌─────────────────────────────────────────────┐     │
│  │         SecurityFilterChain                  │     │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │     │
│  │  │Channel │→│Security│→│ 认证   │→│ 授权   │...│     │
│  │  │Processing│Context ││过滤器  ││过滤器  │   │     │
│  │  │Filter ││Holder  ││       ││       │   │     │
│  │  │       ││Filter  ││       ││       │   │     │
│  │  └───────┘ └───────┘ └───────┘ └───────┘   │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
└──────────────────────────────────────────────────────┘
   │
   ▼
  DispatcherServlet → Controller
```

### 2.2 核心过滤器详解

Spring Security 默认的过滤器链包含以下过滤器（按顺序）：

| 序号 | 过滤器 | 职责 |
|------|-------|------|
| 1 | `ChannelProcessingFilter` | 检查请求是否需要 HTTPS 重定向 |
| 2 | `WebAsyncManagerIntegrationFilter` | 集成 Spring WebAsyncManager |
| 3 | `SecurityContextPersistenceFilter` | 请求前加载 SecurityContext，请求后清除 |
| 4 | `HeaderWriterFilter` | 添加安全响应头（X-Frame-Options 等） |
| 5 | `CorsFilter` | 处理跨域请求 |
| 6 | `CsrfFilter` | 防范 CSRF 攻击 |
| 7 | `LogoutFilter` | 处理登出请求 |
| 8 | `UsernamePasswordAuthenticationFilter` | 处理表单登录认证 |
| 9 | `DefaultLoginPageGeneratingFilter` | 生成默认登录页面 |
| 10 | `DefaultLogoutPageGeneratingFilter` | 生成默认登出页面 |
| 11 | `BasicAuthenticationFilter` | 处理 HTTP Basic 认证 |
| 12 | `RequestCacheAwareFilter` | 恢复被中断的请求 |
| 13 | `SecurityContextHolderAwareRequestFilter` | 包装 HttpServletRequest |
| 14 | `AnonymousAuthenticationFilter` | 为未认证用户设置匿名身份 |
| 15 | `SessionManagementFilter` | 会话管理（防止会话固定攻击等） |
| 16 | `ExceptionTranslationFilter` | 将 AccessDeniedException 和 AuthenticationException 转为 HTTP 响应 |
| 17 | `FilterSecurityInterceptor` | 执行最终的访问控制决策 |
| 18 | `AuthorizationFilter` | （Spring Security 5.7+）替代 FilterSecurityInterceptor |

### 2.3 SecurityFilterChain 演进

**Spring Security 5.7 之前（旧方式）**：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .antMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/login")
                .permitAll()
            .and()
            .logout()
                .logoutSuccessUrl("/");
    }
}
```

**Spring Security 5.7+ / Spring Boot 3.x（新方式）**：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 基于 lambda 的 DSL 风格
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
            );

        return http.build();
    }
}
```

> **重要提示**：`WebSecurityConfigurerAdapter` 在 Spring Security 5.7 中被标记为 `@Deprecated`，在 Spring Boot 3.x 中已完全移除。所有新项目应使用 Bean 方式配置。

### 2.4 自定义过滤器的正确插入位置

Spring Security 提供了多种方式插入自定义过滤器：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 方式一：在指定过滤器之前插入
            .addFilterBefore(
                new CustomFilter(),
                UsernamePasswordAuthenticationFilter.class
            )

            // 方式二：在指定过滤器之后插入
            .addFilterAfter(
                new AnotherFilter(),
                CsrfFilter.class
            )

            // 方式三：在指定过滤器位置插入（会替换掉该位置的原有过滤器）
            .addFilterAt(
                new JwtAuthenticationFilter(),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
```

**关键原则**：

- JWT 认证过滤器应放在 `UsernamePasswordAuthenticationFilter` **之前**，因为我们不需要表单登录
- 日志/追踪过滤器应放在链的**最前面**
- 限流过滤器应放在业务过滤器**之前**

---

## 3. RBAC 模型设计与实现

### 3.1 RBAC 核心概念

**RBAC（Role-Based Access Control）** 是目前最主流的权限控制模型。核心理念：**用户 → 角色 → 权限**。

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────→│   Role   │────→│Permission│
│  (用户)   │ N:M │  (角色)   │ N:M │ (权限)   │
└──────────┘     └──────────┘     └──────────┘
     │                                 │
     │                                 ▼
     │                          ┌──────────┐
     │                          │ Resource │
     │                          │ (资源)   │
     │                          └──────────┘
     │
     ▼
  用户张三 ──→ 财务角色 ──→ 查看报表权限
            ──→ 编辑角色 ──→ 编辑文章权限
```

**RBAC 的三种模型层次**：

| 层次 | 名称 | 说明 |
|------|------|------|
| RBAC0 | 基础模型 | 用户-角色-权限，最基本的分配 |
| RBAC1 | 角色继承 | 角色可以继承其他角色的权限（如"部门主管"继承"普通员工"的所有权限）|
| RBAC2 | 角色约束 | 互斥角色（不能同时拥有出纳和审计角色）、基数约束（CEO 只能有一个人）|
| RBAC3 | 统一模型 | RBAC1 + RBAC2 的组合 |

### 3.2 数据库表设计

```sql
-- 用户表
CREATE TABLE sys_user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    nickname    VARCHAR(50)  COMMENT '昵称',
    email       VARCHAR(100) COMMENT '邮箱',
    phone       VARCHAR(20)  COMMENT '手机号',
    status      TINYINT      DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '系统用户表';

-- 角色表
CREATE TABLE sys_role (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50)  NOT NULL UNIQUE COMMENT '角色名称（如 ADMIN、USER）',
    role_desc   VARCHAR(200) COMMENT '角色描述',
    status      TINYINT      DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '系统角色表';

-- 权限表
CREATE TABLE sys_permission (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限标识（如 user:list、user:delete）',
    permission_desc VARCHAR(200) COMMENT '权限描述',
    resource_url    VARCHAR(200) COMMENT '资源路径（如 /api/users/**）',
    method          VARCHAR(10)  COMMENT '请求方法（GET、POST、DELETE 等）',
    parent_id       BIGINT       DEFAULT 0 COMMENT '父权限ID，0 表示顶级',
    status          TINYINT      DEFAULT 1,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '系统权限表';

-- 用户-角色关联表
CREATE TABLE sys_user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id)
) COMMENT '用户角色关联表';

-- 角色-权限关联表
CREATE TABLE sys_role_permission (
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
) COMMENT '角色权限关联表';
```

### 3.3 实体类设计（JPA）

```java
@Entity
@Table(name = "sys_user")
public class SysUser implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String nickname;
    private String email;
    private String phone;

    @Column(nullable = false)
    private Integer status = 1; // 0-禁用, 1-正常

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "sys_user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<SysRole> roles = new HashSet<>();

    // ─── UserDetails 接口实现 ───
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 将角色和权限都作为 GrantedAuthority
        Set<GrantedAuthority> authorities = new HashSet<>();

        for (SysRole role : roles) {
            // 角色以 ROLE_ 开头（Spring Security 约定）
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleName()));

            // 收集该角色下的所有权限
            for (SysPermission permission : role.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(permission.getPermissionName()));
            }
        }

        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return status == 1; }

    // getters/setters 省略
}

@Entity
@Table(name = "sys_role")
public class SysRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String roleName;

    private String roleDesc;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "sys_role_permission",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<SysPermission> permissions = new HashSet<>();

    // getters/setters 省略
}

@Entity
@Table(name = "sys_permission")
public class SysPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String permissionName; // 如 "user:create", "user:delete"

    private String permissionDesc;
    private String resourceUrl;     // 如 "/api/users/**"
    private String method;          // GET/POST/PUT/DELETE

    private Long parentId;

    // getters/setters 省略
}
```

### 3.4 动态权限校验

基于 RBAC 的数据库模型，我们需要在 Spring Security 中实现**动态权限校验**。这意味着权限配置不应该硬编码在代码中，而是从数据库实时加载。

```java
@Component
public class DynamicAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    @Autowired
    private SysPermissionRepository permissionRepository;

    // 使用缓存避免每次请求都查询数据库
    private final Map<String, Set<String>> urlPermissionCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadPermissions() {
        List<SysPermission> permissions = permissionRepository.findAllByStatus(1);
        urlPermissionCache.clear();

        for (SysPermission perm : permissions) {
            if (perm.getResourceUrl() != null && perm.getMethod() != null) {
                String key = perm.getMethod() + ":" + perm.getResourceUrl();
                urlPermissionCache
                    .computeIfAbsent(key, k -> new HashSet<>())
                    .add(perm.getPermissionName());
            }
        }

        log.info("已加载 {} 条 URL 权限规则", permissions.size());
    }

    // 提供刷新接口，权限变更时调用
    public void refresh() {
        loadPermissions();
    }

    @Override
    public AuthorizationDecision check(
            Supplier<Authentication> authentication,
            RequestAuthorizationContext context) {

        // 获取当前请求的方法和路径
        String method = context.getRequest().getMethod();
        String uri = context.getRequest().getRequestURI();

        // 匹配权限规则
        Set<String> requiredPermissions = matchPermission(method, uri);

        if (requiredPermissions == null || requiredPermissions.isEmpty()) {
            // 没有配置权限要求 → 允许访问（也可以根据业务要求改为拒绝）
            return new AuthorizationDecision(true);
        }

        // 检查当前用户是否拥有所需权限
        Collection<? extends GrantedAuthority> authorities =
            authentication.get().getAuthorities();

        boolean granted = requiredPermissions.stream().anyMatch(perm ->
            authorities.stream().anyMatch(auth -> auth.getAuthority().equals(perm))
        );

        return new AuthorizationDecision(granted);
    }

    private Set<String> matchPermission(String method, String uri) {
        // 使用 AntPathMatcher 匹配 URL 模式
        AntPathMatcher matcher = new AntPathMatcher();

        for (Map.Entry<String, Set<String>> entry : urlPermissionCache.entrySet()) {
            String[] parts = entry.getKey().split(":", 2);
            String permMethod = parts[0];
            String permPattern = parts[1];

            if (method.equalsIgnoreCase(permMethod) && matcher.match(permPattern, uri)) {
                return entry.getValue();
            }
        }

        return null;
    }
}
```

---

## 4. 实战：搭建完整的认证授权体系

### 4.1 项目结构

```
src/main/java/com/example/security/
├── config/
│   ├── SecurityConfig.java          # Spring Security 主配置
│   ├── JwtConfig.java               # JWT 配置属性
│   └── CorsConfig.java              # 跨域配置
├── security/
│   ├── JwtTokenProvider.java        # JWT 令牌生成/验证
│   ├── JwtAuthenticationFilter.java # JWT 认证过滤器
│   ├── CustomUserDetailsService.java # 用户详情服务
│   └── CustomAuthenticationEntryPoint.java # 认证异常处理
├── authorization/
│   ├── DynamicAuthorizationManager.java # 动态权限管理器
│   └── PermissionValidator.java      # 权限校验工具
├── controller/
│   ├── AuthController.java          # 登录/注册/刷新令牌
│   └── UserController.java          # 用户管理
├── service/
│   ├── AuthService.java
│   └── UserService.java
├── repository/
│   ├── SysUserRepository.java
│   ├── SysRoleRepository.java
│   └── SysPermissionRepository.java
├── entity/
│   ├── SysUser.java
│   ├── SysRole.java
│   └── SysPermission.java
├── dto/
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   └── RefreshTokenRequest.java
└── exception/
    ├── BusinessException.java
    └── GlobalExceptionHandler.java
```

### 4.2 主安全配置

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // 启用方法级别安全注解
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final DynamicAuthorizationManager dynamicAuthorizationManager;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ─── 禁用 CSRF（使用 JWT 时一般不需要 CSRF 保护） ───
            .csrf(AbstractHttpConfigurer::disable)

            // ─── 会话管理：无状态 ───
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ─── 异常处理 ───
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler((request, response, ex) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write(
                        "{\"code\":403,\"message\":\"权限不足，无法访问该资源\"}"
                    );
                })
            )

            // ─── 跨域配置 ───
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ─── 权限配置 ───
            .authorizeHttpRequests(auth -> auth
                // 公开接口
                .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                // Swagger/Knife4j
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Actuator（生产环境应限制访问）
                .requestMatchers("/actuator/health").permitAll()
                // 静态资源
                .requestMatchers("/static/**", "/favicon.ico").permitAll()
                // 其他所有请求使用动态权限校验
                .anyRequest().access(dynamicAuthorizationManager)
            )

            // ─── 添加 JWT 过滤器 ───
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 跨域配置源
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://yourdomain.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### 4.3 JWT 令牌提供器

```java
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration; // 访问令牌有效期（毫秒）

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration; // 刷新令牌有效期（毫秒）

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        // 确保密钥长度足够（HMAC-SHA256 需要至少 256 位 = 32 字节）
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // 不够 32 字节则填充
            keyBytes = Arrays.copyOf(keyBytes, 32);
        }
        this.signingKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    /**
     * 生成 Access Token
     */
    public String generateAccessToken(Authentication authentication) {
        SysUser userPrincipal = (SysUser) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(userPrincipal.getId().toString())
                .claim("username", userPrincipal.getUsername())
                .claim("nickname", userPrincipal.getNickname())
                .claim("authorities", authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()))
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * 生成 Refresh Token
     */
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * 从 Token 中解析用户 ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    /**
     * 验证 Token 是否有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT Token 验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 解析 Token
     */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
```

### 4.4 JWT 认证过滤器

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // 从请求头中提取 Token
        String token = extractToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 从 Token 中获取用户 ID
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            // 加载用户信息
            UserDetails userDetails = userDetailsService.loadUserById(userId);

            // 创建认证对象
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,  // JWT 不需要密码
                        userDetails.getAuthorities()
                    );

            // 将认证信息存入 SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取 Token
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}
```

### 4.5 登录接口实现

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthService authService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        // 执行认证
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        // 设置 SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 生成 Token
        SysUser user = (SysUser) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // 保存 Refresh Token 到 Redis
        authService.saveRefreshToken(user.getId(), refreshToken);

        // 构建响应
        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(7200L)
                .userInfo(UserInfo.from(user, authentication.getAuthorities()))
                .build();

        return ResponseEntity.ok(ApiResponse.success("登录成功", response));
    }

    /**
     * 刷新令牌
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        // 验证 Refresh Token
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Refresh Token 无效或已过期"));
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(request.getRefreshToken());

        // 检查 Refresh Token 是否在白名单中
        if (!authService.isRefreshTokenValid(userId, request.getRefreshToken())) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Refresh Token 已被撤销"));
        }

        // 重新加载用户信息
        UserDetails userDetails = authService.loadUserById(userId);

        // 生成新的 Authentication
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities()
        );

        // 生成新 Token
        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId);

        // 替换旧的 Refresh Token（防止重放攻击）
        authService.saveRefreshToken(userId, newRefreshToken);

        LoginResponse response = LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(7200L)
                .build();

        return ResponseEntity.ok(ApiResponse.success("令牌刷新成功", response));
    }

    /**
     * 用户注销
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout() {
        Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            SysUser user = (SysUser) authentication.getPrincipal();
            // 从 Redis 中删除 Refresh Token
            authService.revokeAllTokens(user.getId());
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success("注销成功", null));
    }
}
```

### 4.6 方法级权限控制

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 查看所有用户 → 需要 "user:list" 权限
    @GetMapping
    @PreAuthorize("hasAuthority('user:list')")
    public ResponseEntity<PageResult<UserVO>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.listUsers(page, size));
    }

    // 查看单个用户详情
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('user:view') or #id == authentication.principal.id")
    public ResponseEntity<UserVO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // 创建用户 → 需要 "user:create" 权限
    @PostMapping
    @PreAuthorize("hasAuthority('user:create')")
    public ResponseEntity<UserVO> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    // 删除用户 → 需要 "user:delete" 权限，且不能删除自己
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user:delete') and #id != authentication.principal.id")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // 使用自定义权限校验
    @PostMapping("/{id}/roles")
    @PreAuthorize("@permissionValidator.canAssignRole(authentication, #id)")
    public ResponseEntity<Void> assignRoles(
            @PathVariable Long id,
            @RequestBody List<Long> roleIds) {
        userService.assignRoles(id, roleIds);
        return ResponseEntity.ok().build();
    }
}
```

---

## 5. JWT + Spring Security 集成

### 5.1 application.yml 配置

```yaml
# JWT 配置
jwt:
  # 密钥（生产环境应从环境变量或配置中心读取）
  secret: ${JWT_SECRET:YourSuperSecretKeyThatIsAtLeast256BitsLong}
  # Access Token 有效期：2 小时
  access-token-expiration: 7200000
  # Refresh Token 有效期：7 天
  refresh-token-expiration: 604800000

# Spring 配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/security_demo?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  redis:
    host: localhost
    port: 6379

# 日志配置
logging:
  level:
    com.example.security: DEBUG
    org.springframework.security: DEBUG
```

### 5.2 Refresh Token 的 Redis 存储

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final StringRedisTemplate redisTemplate;
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final String TOKEN_BLACKLIST_PREFIX = "token_blacklist:";

    /**
     * 保存 Refresh Token
     */
    public void saveRefreshToken(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        // 使用 SET 结构，支持一个用户多设备登录
        redisTemplate.opsForSet().add(key, refreshToken);
        // 设置过期时间与 Refresh Token 一致
        redisTemplate.expire(key, 7, TimeUnit.DAYS);
    }

    /**
     * 验证 Refresh Token 是否有效
     */
    public boolean isRefreshTokenValid(Long userId, String refreshToken) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        return Boolean.TRUE.equals(
            redisTemplate.opsForSet().isMember(key, refreshToken)
        );
    }

    /**
     * 撤销所有 Token（注销时调用）
     */
    public void revokeAllTokens(Long userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        // 可以将旧 Token 加入黑名单（如果需要）
        Set<String> tokens = redisTemplate.opsForSet().members(key);
        if (tokens != null) {
            for (String token : tokens) {
                String blackKey = TOKEN_BLACKLIST_PREFIX + token;
                redisTemplate.opsForValue().set(blackKey, "1", 7, TimeUnit.DAYS);
            }
        }
        // 删除刷新令牌
        redisTemplate.delete(key);
    }

    /**
     * 加载用户
     */
    public UserDetails loadUserById(Long userId) {
        // 从数据库加载，加入缓存
        // ...
        return null;
    }
}
```

---

## 6. 常见配置误区

### 误区 1：忘记配置 PasswordEncoder

```java
// ❌ 错误：没有定义 PasswordEncoder Bean
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.formLogin(form -> form
        // 这会导致启动时报错：
        // "There is no PasswordEncoder mapped for the id 'null'"
    );
    return http.build();
}

// ✅ 正确：必须定义 PasswordEncoder
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### 误区 2：在 SecurityConfig 的 Bean 方法中使用 @Autowired 字段注入

```java
// ❌ 错误：可能引发循环依赖
@Configuration
public class SecurityConfig {
    @Autowired
    private UserDetailsService userDetailsService;  // 字段注入可能失败

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        // ...
    }

    @Bean
    public AuthenticationManager authenticationManager(...) {
        // 使用到了 userDetailsService
    }
}

// ✅ 正确：使用构造器注入或方法参数注入
@Configuration
@RequiredArgsConstructor  // Lombok 生成构造器
public class SecurityConfig {
    private final UserDetailsService userDetailsService;
    // ...
}
```

### 误区 3：CSRF 保护与 REST API

```java
// ❌ 错误：REST API + JWT 还启用 CSRF
http.csrf(CsrfConfigurer::disable);  // 忘写了
// CSRF 主要针对基于 Session 的表单提交，REST API 一般不需要

// ✅ 正确：使用 JWT 的无状态 API 应禁用 CSRF
http.csrf(AbstractHttpConfigurer::disable);
```

### 误区 4：放行顺序不当

```java
// ❌ 错误：更具体的规则放在了后面
http.authorizeHttpRequests(auth -> auth
    .anyRequest().authenticated()        // 这个先匹配！后面的规则不会生效
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api/auth/login").permitAll()
);

// ✅ 正确：具体规则在前，通用规则在后
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api/auth/login").permitAll()
    .requestMatchers("/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated()
);
```

### 误区 5：JWT 密钥硬编码

```java
// ❌ 危险：密钥硬编码在代码中
private static final String SECRET = "my-secret-key-12345";

// ✅ 安全：从环境变量或配置中心读取
@Value("${jwt.secret}")
private String jwtSecret;
```

### 误区 6：忽略 JWT 过期检查后的续期

```java
// ❌ 简单的做法（有安全风险）：
// 如果 Token 过期就返回 401，前端自己处理

// ✅ 更好的做法：区分过期类型
try {
    Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
} catch (ExpiredJwtException e) {
    // Token 已过期，但签名有效 → 返回特定错误码
    // 前端收到后自动用 Refresh Token 换取新 Token
    throw new TokenExpiredException("Token 已过期，请刷新");
} catch (JwtException e) {
    // Token 无效或签名错误 → 真正的 401
    throw new InvalidTokenException("Token 无效");
}
```

---

## 7. 总结与最佳实践

### 7.1 核心要点回顾

```
┌──────────────────────────────────────────────────────────────┐
│                Spring Security 认证授权体系总结                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 认证（Authentication）                                    │
│     └── 确认"你是谁" → AuthenticationManager → Provider      │
│                                                              │
│  2. 授权（Authorization）                                     │
│     └── 确认"你能做什么" → AccessDecisionManager → Voter     │
│                                                              │
│  3. 过滤器链（SecurityFilterChain）                             │
│     └── 按序执行的过滤器集合，每个处理一种安全关注点               │
│                                                              │
│  4. RBAC 模型                                                 │
│     └── User → Role → Permission，灵活且可扩展                 │
│                                                              │
│  5. JWT 集成                                                  │
│     └── 无状态、自包含、适合分布式系统                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 最佳实践 Checklist

**认证层面**：

- [ ] 密码使用 BCrypt 加密存储（salt rounds ≥ 10）
- [ ] 使用 JWT + Refresh Token 双令牌方案
- [ ] Refresh Token 存储在服务端（Redis），支持撤销
- [ ] 登录失败次数限制（防暴力破解）
- [ ] 敏感操作需要二次认证（如修改密码、绑定手机）

**授权层面**：

- [ ] 采用 RBAC 模型，权限配置存储在数据库
- [ ] URL 级别 + 方法级别双重权限控制
- [ ] 使用 `@PreAuthorize` 和 `@PostAuthorize` 进行细粒度控制
- [ ] 前端仅作为 UI 控制，真正的权限在后端校验
- [ ] 权限变更后提供刷新机制（无需重启服务）

**安全配置**：

- [ ] HTTPS 强制（生产环境）
- [ ] 安全响应头（X-Content-Type-Options, X-Frame-Options 等）
- [ ] CORS 白名单（不使用 `*`）
- [ ] CSRF 保护（基于 Session 的应用）或禁用（JWT 无状态应用）
- [ ] 会话固定攻击防护

**代码层面**：

- [ ] 不要在日志中打印完整的 Token 或密码
- [ ] 不要在 URL 中传递 Token
- [ ] 不要将 JWT 密钥硬编码或提交到 Git
- [ ] 使用 `@Valid` 校验请求参数
- [ ] 自定义异常处理，返回统一的错误格式

**运维层面**：

- [ ] 定期轮换 JWT 签名密钥
- [ ] 监控异常登录行为
- [ ] 记录审计日志（谁在什么时候做了什么）
- [ ] Token 黑名单机制（用户注销/密码修改后立即失效）
- [ ] 定期安全审计和渗透测试

> **最后的话**：安全不是一次性工作，而是一个持续的过程。本文搭建的认证授权体系是一个很好的起点，但真正的安全需要根据业务场景不断迭代和完善。记住：安全是没有"银弹"的，理解你的威胁模型，然后针对性地构建防御体系。