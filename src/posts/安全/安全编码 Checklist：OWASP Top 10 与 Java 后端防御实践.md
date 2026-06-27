---
title: 安全编码 Checklist：OWASP Top 10 与 Java 后端防御实践
tag: ["安全", "OWASP", "安全编码", "Java"]
category: 安全
date: 2026-06-27
---

# 安全编码 Checklist：OWASP Top 10 与 Java 后端防御实践

安全不是出事后补洞，而是编码时就做好防御。本文按 OWASP Top 10 整理一份可直接落地的安全编码 Checklist。

---

## 一、OWASP Top 10（2025）速览

| 排名 | 威胁 | 一句话描述 |
|------|------|-----------|
| A01 | 访问控制失效 | 越权访问 |
| A02 | 加密机制失效 | 明文存储/传输 |
| A03 | 注入 | SQL/命令/LDAP 注入 |
| A04 | 不安全设计 | 架构层面安全缺陷 |
| A05 | 安全配置错误 | 默认密码/开放端口 |
| A06 | 易受攻击的组件 | 依赖漏洞 |
| A07 | 认证与身份验证失效 | 弱密码/会话固定 |
| A08 | 软件与数据完整性失效 | 未验证的更新/反序列化 |
| A09 | 日志与监控失效 | 安全事件无感知 |
| A10 | 服务端请求伪造（SSRF） | 内网探测 |

---

## 二、A01 访问控制失效

### Checklist

```java
// ✅ 水平越权：每个数据查询必须校验归属
@GetMapping("/order/{id}")
public Result getOrder(@PathVariable Long id, @AuthenticationPrincipal User user) {
    Order order = orderMapper.selectById(id);
    if (!order.getUserId().equals(user.getId())) {
        throw new AccessDeniedException("无权访问");
    }
    return Result.success(order);
}

// ✅ 垂直越权：接口必须配置角色权限
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/user/{id}")
public Result deleteUser(@PathVariable Long id) { ... }

// ✅ 垂直越权：菜单/按钮权限校验
// 前端隐藏菜单 ≠ 后端不校验，后端必须独立校验权限

// ✅ 防止路径遍历
@GetMapping("/file")
public Result getFile(@RequestParam String filename) {
    // 白名单校验文件名
    if (!filename.matches("^[a-zA-Z0-9_\\-\\.]+$")) {
        throw new SecurityException("非法文件名");
    }
    Path path = Paths.get("/app/uploads").resolve(filename).normalize();
    // 确保最终路径在允许的目录内
    if (!path.startsWith("/app/uploads")) {
        throw new SecurityException("路径越界");
    }
    return Result.success(Files.readAllBytes(path));
}
```

---

## 三、A02 加密机制失效

### Checklist

```java
// ✅ 密码存储：BCrypt（不要用 MD5/SHA）
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);  // strength=12
}
// 存储时：passwordEncoder.encode(rawPassword)
// 验证时：passwordEncoder.matches(rawPassword, encodedPassword)

// ✅ 敏感数据加密存储（手机号、身份证号）
public class CryptoUtil {
    private static final String KEY = "从环境变量读取的密钥";
    private static final Cipher CIPHER = Cipher.getInstance("AES/GCM/NoPadding");
    
    public static String encrypt(String plain) {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        CIPHER.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(128, iv));
        byte[] encrypted = CIPHER.doFinal(plain.getBytes());
        return Base64.encode(iv) + ":" + Base64.encode(encrypted);
    }
    
    public static String decrypt(String cipherText) {
        String[] parts = cipherText.split(":");
        CIPHER.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128, Base64.decode(parts[0])));
        return new String(CIPHER.doFinal(Base64.decode(parts[1])));
    }
}

// ✅ HTTPS 强制
// application.yml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
// HTTP 自动跳转 HTTPS
server:
  port: 80
  redirect:
    to-https: true

// ✅ API 密钥不硬编码
// 错误：private static final String API_KEY = "sk-xxxxx";
// 正确：从环境变量或配置中心读取
@Value("${api.key}")
private String apiKey;
```

---

## 四、A03 注入

### Checklist

```java
// ✅ SQL 注入：MyBatis 一律用 #{} 不用 ${}
// ✅ 命令注入：避免 Runtime.exec()，必须用时做白名单
public String execCommand(String input) {
    // 白名单
    if (!input.matches("^[a-zA-Z0-9_\\-]+$")) {
        throw new SecurityException("非法输入");
    }
    ProcessBuilder pb = new ProcessBuilder("ls", "-l", input);
    // 不要用 Runtime.exec("ls -l " + input)
}

// ✅ LDAP 注入：参数化查询
// ✅ XML 注入：禁用外部实体（XXE）
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

// ✅ 反序列化注入：禁用原生 Java 序列化
// 用 JSON 替代 Java 序列化
// 如果必须反序列化，用 ObjectInputFilter
ObjectInputStream ois = new ObjectInputStream(inputStream);
ois.setObjectInputFilter(filterInfo -> 
    filterInfo.serialClass() != null && 
    filterInfo.serialClass().getName().startsWith("com.example.")
    ? ObjectInputFilter.Status.ALLOWED 
    : ObjectInputFilter.Status.REJECTED
);
```

---

## 五、A05 安全配置错误

### Checklist

```yaml
# ✅ 关闭 Actuator 敏感端点
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics  # 不要用 *
  endpoint:
    env:
      enabled: false      # 禁止环境变量暴露
    configprops:
      enabled: false      # 禁止配置属性暴露

# ✅ 数据库连接密码不明文
spring:
  datasource:
    password: ${DB_PASSWORD}  # 从环境变量或 Vault 读取

# ✅ 关闭 Swagger 生产环境
springdoc:
  swagger-ui:
    enabled: false  # 生产环境关闭
  api-docs:
    enabled: false

# ✅ Spring Boot 错误页面不暴露堆栈
server:
  error:
    include-stacktrace: never
    include-message: never
    include-binding-errors: never
```

---

## 六、A07 认证与身份验证

### Checklist

```java
// ✅ 密码强度校验
public void validatePassword(String password) {
    if (password.length() < 8) throw new IllegalArgumentException("密码至少8位");
    if (!password.matches(".*[A-Z].*")) throw new IllegalArgumentException("必须包含大写字母");
    if (!password.matches(".*[a-z].*")) throw new IllegalArgumentException("必须包含小写字母");
    if (!password.matches(".*[0-9].*")) throw new IllegalArgumentException("必须包含数字");
    if (!password.matches(".*[!@#$%^&*].*")) throw new IllegalArgumentException("必须包含特殊字符");
}

// ✅ 登录失败锁定
private final Map<String, AtomicInteger> loginFailCount = new ConcurrentHashMap<>();
private static final int MAX_FAIL = 5;

public void login(String username, String password) {
    AtomicInteger count = loginFailCount.computeIfAbsent(username, k -> new AtomicInteger(0));
    if (count.get() >= MAX_FAIL) {
        throw new SecurityException("账号已锁定，请30分钟后重试");
    }
    if (!authenticate(username, password)) {
        count.incrementAndGet();
        throw new SecurityException("密码错误，剩余" + (MAX_FAIL - count.get()) + "次机会");
    }
    count.set(0);  // 登录成功清零
}

// ✅ Session 固定攻击防御
// 登录后必须更换 Session ID
@PostMapping("/login")
public Result login(HttpServletRequest request) {
    // 认证成功后
    HttpSession oldSession = request.getSession(false);
    if (oldSession != null) oldSession.invalidate();
    HttpSession newSession = request.getSession(true);  // 新 Session
    newSession.setAttribute("user", authenticatedUser);
}

// ✅ JWT 安全配置
// 1. 算法用 RS256（非对称），不用 HS256
// 2. 设置过期时间（access 15min + refresh 7day）
// 3. 设置 issuer 和 audience
// 4. 不在 JWT 中放敏感信息（Base64 可解码）
```

---

## 七、A08 软件与数据完整性

### Checklist

```xml
<!-- ✅ 依赖版本锁定 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>6.1.5</version>  <!-- 明确版本，不用 SNAPSHOT -->
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- ✅ 排除有漏洞的传递依赖 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>lib</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>  <!-- 排除有漏洞的版本 -->
        </exclusion>
    </exclusions>
</dependency>
```

```bash
# ✅ 定期扫描依赖漏洞
# 使用 OWASP Dependency Check
mvn org.owasp:dependency-check-maven:check

# 或使用 Snyk
snyk test
```

---

## 八、A09 日志与监控

### Checklist

```java
// ✅ 记录安全事件日志
@Aspect
@Component
public class SecurityLogAspect {
    
    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT_LOG");
    
    @AfterReturning("execution(* com.example.controller.*.*(..)) && @annotation(org.springframework.web.bind.annotation.PostMapping)")
    public void logPostRequest(JoinPoint jp) {
        auditLog.info("API调用 | method={} | user={} | ip={} | params={}",
            jp.getSignature().getName(),
            SecurityContextHolder.getContext().getAuthentication().getName(),
            RequestContextHolder.currentRequestAttributes(),
            Arrays.toString(jp.getArgs())
        );
    }
}

// ✅ 登录日志
public void loginSuccess(String username, String ip) {
    log.info("[LOGIN_SUCCESS] user={} ip={} time={}", username, ip, LocalDateTime.now());
}

public void loginFailed(String username, String ip, String reason) {
    log.warn("[LOGIN_FAILED] user={} ip={} reason={} time={}", username, ip, reason, LocalDateTime.now());
}

// ✅ 敏感操作日志
public void transfer(TransferRequest req, User user) {
    log.info("[TRANSFER] user={} from={} to={} amount={} time={}",
        user.getUsername(), req.getFromAccount(), req.getToAccount(), 
        req.getAmount(), LocalDateTime.now());
    // 执行转账
}

// ✅ 日志中不记录敏感信息
// 错误：log.info("user password: {}", password);
// 正确：log.info("user login: {}", username);

// ✅ 日志防篡改：接入 ELK + 日志签名
```

---

## 九、A10 SSRF（服务端请求伪造）

### Checklist

```java
// 漏洞代码：用户传入 URL，服务器直接请求
@GetMapping("/fetch")
public String fetchUrl(@RequestParam String url) {
    // 攻击者传入 http://169.254.169.254/latest/meta-data/  → 获取云服务器元数据
    // 攻击者传入 http://192.168.1.1/admin  → 访问内网管理后台
    return restTemplate.getForObject(url, String.class);
}

// 防御
@GetMapping("/fetch")
public String fetchUrl(@RequestParam String url) {
    // 1. 白名单校验域名
    Set<String> allowedDomains = Set.of("api.example.com", "cdn.example.com");
    try {
        URI uri = URI.create(url);
        if (!allowedDomains.contains(uri.getHost())) {
            throw new SecurityException("非法域名");
        }
        // 2. 禁止访问内网 IP
        InetAddress address = InetAddress.getByName(uri.getHost());
        if (address.isSiteLocalAddress() || address.isLoopbackAddress() 
            || address.isLinkLocalAddress()) {
            throw new SecurityException("禁止访问内网地址");
        }
        // 3. 禁止非常规协议
        if (!Set.of("http", "https").contains(uri.getScheme())) {
            throw new SecurityException("非法协议");
        }
    } catch (Exception e) {
        throw new SecurityException("URL 校验失败");
    }
    
    // 4. 设置超时和重定向限制
    RestTemplate restTemplate = new RestTemplateBuilder()
        .setConnectTimeout(Duration.ofSeconds(3))
        .setReadTimeout(Duration.ofSeconds(5))
        .build();
    // 禁止重定向到内网
    restTemplate.setRequestFactory(new SimpleClientHttpRequestFactory() {
        @Override
        protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
            super.prepareConnection(connection, httpMethod);
            connection.setInstanceFollowRedirects(false);  // 不自动重定向
        }
    });
    
    return restTemplate.getForObject(url, String.class);
}
```

---

## 十、完整安全 Checklist 汇总

### 编码阶段

- [ ] 所有用户输入都经过校验（长度、格式、范围）
- [ ] SQL 查询全部使用参数化（#{} 或 PreparedStatement）
- [ ] 密码使用 BCrypt 存储，不明文
- [ ] 敏感数据（手机号、身份证）加密存储
- [ ] 所有接口配置权限校验（@PreAuthorize）
- [ ] 数据查询校验归属（防水平越权）
- [ ] 文件上传校验类型和内容
- [ ] 日志不记录敏感信息
- [ ] 错误信息不暴露系统细节
- [ ] 依赖版本锁定，无 SNAPSHOT

### 配置阶段

- [ ] HTTPS 强制开启
- [ ] Cookie 设置 HttpOnly + Secure + SameSite
- [ ] Actuator 敏感端点关闭
- [ ] Swagger 生产环境关闭
- [ ] 数据库密码不明文配置
- [ ] CORS 配置白名单（不用 *）
- [ ] CSP 头配置

### 运维阶段

- [ ] 定期依赖漏洞扫描
- [ ] 安全日志接入告警
- [ ] WAF 防护（如阿里云 WAF）
- [ ] 限流防暴力破解
- [ ] 定期安全渗透测试

---

## 十一、面试要点

### Q：你的项目做了哪些安全防护？

按 OWASP Top 10 回答：
1. **注入**：MyBatis 全部用 #{}，代码审查禁止 ${}
2. **认证**：BCrypt 存密码 + JWT 非对称签名 + 登录失败锁定
3. **访问控制**：Spring Security @PreAuthorize + 数据归属校验
4. **加密**：HTTPS + 敏感字段 AES 加密 + Cookie HttpOnly
5. **配置安全**：Actuator 端点收敛 + 依赖漏洞定期扫描

### Q：如何防止密码被破解？

1. BCrypt 存储（自带盐值，抗彩虹表）
2. 密码强度校验（8位+大小写+数字+特殊字符）
3. 登录失败 5 次锁定
4. 限流防暴力枚举
5. 验证码防自动化

---

## 十二、总结

安全编码的核心原则：**不信任任何输入，校验一切边界，最小化暴露面**。

这份 Checklist 不是写完就完的，要落实到 Code Review 流程中——每次 PR 都对照检查，安全才能真正落地。
