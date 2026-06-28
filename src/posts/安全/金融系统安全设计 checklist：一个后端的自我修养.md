---
title: 金融系统安全设计 Checklist：一个后端的自我修养
tag: ["金融系统", "安全"]
date: 2026-06-12
category: 安全
---

# 金融系统安全设计 Checklist：一个后端的自我修养

> 金融系统安全设计 Checklist：一个后端的自我修养是系统设计的重要考量，它关系到用户数据和系统资源的保护。
> 本文介绍了金融系统安全设计 Checklist：一个后端的自我修养的原理和最佳实践，帮助你构建安全可靠的系统。

金融系统面临的安全威胁远超普通应用：

```
┌────────────────────────────────────────────────────────────┐
│              金融系统安全威胁全景                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  【外部威胁】                                                │
│  ├── 黑客攻击（SQL 注入、XSS、DDoS）                         │
│  ├── 欺诈交易（伪造请求、金额篡改）                             │
│  ├── 数据窃取（拖库、中间人攻击）                              │
│  └── API 滥用（爬取、撞库）                                  │
│                                                            │
│  【内部威胁】                                                │
│  ├── 内部人员滥用权限                                        │
│  ├── 运维人员误操作                                          │
│  ├── 开发人员硬编码敏感信息                                    │
│  └── 离职员工未回收权限                                       │
│                                                            │
│  【合规要求】                                                │
│  ├── PCI DSS（支付卡行业数据安全标准）                          │
│  ├── 等保 2.0（网络安全等级保护）                              │
│  ├── GDPR（通用数据保护条例）                                 │
│  └── 《个人信息保护法》                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 1.2 安全设计的核心原则

```
零信任（Zero Trust）
  └── 不信任任何来源，即使是内网请求也要验证

最小权限（Least Privilege）
  └── 每个组件只拥有完成职责所需的最小权限

纵深防御（Defense in Depth）
  └── 多层防御，单层被突破也不会导致整体沦陷

安全默认（Secure by Default）
  └── 默认配置就是安全的，需要显式放开才降低安全性

默认拒绝（Default Deny）
  └── 未明确允许的访问一律拒绝
```

## 2. 传输安全：HTTPS 强制与证书管理

### 2.1 HTTPS 强制配置

```yaml
# Spring Boot - application.yml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEY_STORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: tomcat
  # 强制 HTTPS
  http2:
    enabled: true

# 同时开启 HTTP 自动跳转 HTTPS
```

```java
// 方式一：Spring Security 强制 HTTPS
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // 所有请求必须走 HTTPS
        .requiresChannel(channel -> channel
            .anyRequest().requiresSecure()
        )
        // ... 其他配置
    ;
    return http.build();
}

// 方式二：Tomcat 级别重定向
@Bean
public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpsRedirect() {
    return factory -> factory.addAdditionalTomcatConnectors(
        createHttpConnector()
    );
}

private Connector createHttpConnector() {
    Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
    connector.setScheme("http");
    connector.setPort(8080);
    connector.setSecure(false);
    connector.setRedirectPort(8443);
    return connector;
}
```

### 2.2 HSTS（HTTP Strict Transport Security）

HSTS 告诉浏览器"永远不要用 HTTP 访问我"：

```java
// Spring Security HSTS 配置
http.headers(headers -> headers
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)    // 包含子域名
        .maxAgeInSeconds(31536000)  // 1 年
        .preload(true)              // 允许加入浏览器预加载列表
    )
);

// 对应的响应头：
// Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2.3 证书管理最佳实践

```bash
# 1. 使用 Let's Encrypt 自动获取和续期（推荐）
certbot certonly --standalone -d api.example.com

# 2. 证书监控：过期预警
# 在过期前 30 天发送告警

# 3. 私钥保护
# - 私钥文件权限 600
# - 不同环境使用不同证书
# - 私钥永远不入代码仓库
# - 使用 HSM（硬件安全模块）存储生产私钥

# 4. 证书钉扎（Certificate Pinning） - 移动端 App
# 防止中间人攻击，App 只信任特定的证书
```

### 2.4 TLS 配置加固

```java
// 禁用不安全的 TLS 协议和加密套件
@Bean
public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
    return factory -> factory.addConnectorCustomizers(connector -> {
        if (connector.getProtocolHandler() instanceof AbstractHttp11Protocol<?> protocol) {
            // 只启用 TLS 1.2 和 1.3（禁用 TLS 1.0/1.1）
            protocol.setSslEnabledProtocols(new String[]{"TLSv1.2", "TLSv1.3"});
            
            // 指定安全的加密套件
            protocol.setCiphers("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,"
                    + "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,"
                    + "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256");
        }
    });
}
```

## 3. 认证安全：多因素认证与会话管理

### 3.1 多因素认证（MFA）设计

```
认证强度分级：

Level 1: 密码（知识因素）
  └── 适合：低敏感操作（查看公开信息）

Level 2: 密码 + 短信/邮箱验证码（知识 + 持有）
  └── 适合：中等敏感操作（登录、修改个人信息）

Level 3: 密码 + TOTP（知识 + 持有）
  └── 适合：高敏感操作（转账、修改安全设置）

Level 4: 密码 + 生物识别（知识 + 固有）
  └── 适合：最高敏感操作（大额交易、管理员操作）
```

**TOTP（基于时间的一次性密码）实现**：

```java
@Service
public class TotpService {

    private static final int CODE_LENGTH = 6;
    private static final int TIME_STEP_SECONDS = 30;

    /**
     * 生成 TOTP 密钥（用户绑定 Google Authenticator 时使用）
     */
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20]; // 160 bits
        random.nextBytes(bytes);
        return Base32.encode(bytes); // Base32 编码，方便用户手动输入
    }

    /**
     * 生成 Google Authenticator 绑定二维码的 URI
     */
    public String generateQrCodeUri(String secret, String username, String issuer) {
        return String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
            URLEncoder.encode(issuer, StandardCharsets.UTF_8),
            URLEncoder.encode(username, StandardCharsets.UTF_8),
            secret,
            URLEncoder.encode(issuer, StandardCharsets.UTF_8),
            CODE_LENGTH,
            TIME_STEP_SECONDS
        );
    }

    /**
     * 验证 TOTP 验证码
     */
    public boolean verifyCode(String secret, String code) {
        long currentTimeStep = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;

        // 允许前后一个时间窗口（共 90 秒），避免时钟偏差
        for (long i = -1; i <= 1; i++) {
            String expectedCode = generateTotp(secret, currentTimeStep + i);
            if (expectedCode.equals(code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 核心算法：TOTP = HOTP(K, T)
     * 其中 T = (当前Unix时间 - T0) / X，X 是时间步长
     */
    private String generateTotp(String secret, long timeStep) {
        byte[] key = Base32.decode(secret);

        // 将 timeStep 转为 8 字节大端序
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.putLong(timeStep);

        // HMAC-SHA1(key, timeStep)
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(buffer.array());

        // 动态截断（Dynamic Truncation）
        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                   | ((hash[offset + 1] & 0xFF) << 16)
                   | ((hash[offset + 2] & 0xFF) << 8)
                   | (hash[offset + 3] & 0xFF);

        // 取模得到 6 位数字
        int otp = binary % (int) Math.pow(10, CODE_LENGTH);
        return String.format("%0" + CODE_LENGTH + "d", otp);
    }
}
```

### 3.2 登录安全防护

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class LoginSecurityService {

    private final StringRedisTemplate redisTemplate;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MINUTES = 30;

    /**
     * 登录失败处理：记录失败次数，超过阈值锁定账户
     */
    public void handleLoginFailure(String username, String ip) {
        // ─── 1. 账户级别锁定 ───
        String accountKey = "login:fail:account:" + username;
        Long attempts = redisTemplate.opsForValue().increment(accountKey);
        redisTemplate.expire(accountKey, Duration.ofMinutes(LOCKOUT_DURATION_MINUTES));

        if (attempts != null && attempts >= MAX_LOGIN_ATTEMPTS) {
            log.warn("账户 {} 因连续 {} 次登录失败被锁定", username, MAX_LOGIN_ATTEMPTS);
            // 可以发送告警通知用户
        }

        // ─── 2. IP 级别限制 ───
        String ipKey = "login:fail:ip:" + ip;
        redisTemplate.opsForValue().increment(ipKey);
        redisTemplate.expire(ipKey, Duration.ofMinutes(15));

        // ─── 3. 记录审计日志 ───
        log.info("登录失败: username={}, ip={}, 累计失败={}", username, ip, attempts);
    }

    /**
     * 检查账户是否被锁定
     */
    public boolean isAccountLocked(String username) {
        String key = "login:fail:account:" + username;
        String value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            int attempts = Integer.parseInt(value);
            return attempts >= MAX_LOGIN_ATTEMPTS;
        }
        return false;
    }

    /**
     * 登录成功后清除失败记录
     */
    public void handleLoginSuccess(String username) {
        String key = "login:fail:account:" + username;
        redisTemplate.delete(key);
    }
}
```

### 3.3 会话管理

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session
                // 限制同一账号的并发会话数（防止账号共享）
                .maximumSessions(3)
                // 超过限制时的行为：
                // true  → 阻止新会话（推荐：阻止新的登录）
                // false → 踢掉最旧的会话
                .maxSessionsPreventsLogin(true)
                // 会话过期跳转
                .expiredUrl("/login?expired")
            )
            // 防止会话固定攻击：登录成功后创建新 Session
            .sessionManagement(session -> session
                .sessionFixation().migrateSession()
            );
        return http.build();
    }
}

// 自定义 Session 并发控制
@Component
public class CustomSessionRegistry {

    // 用户名 → Session ID 集合
    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();

    public void registerSession(String username, String sessionId) {
        userSessions.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet())
                .add(sessionId);
    }

    public void removeSession(String username, String sessionId) {
        Set<String> sessions = userSessions.get(username);
        if (sessions != null) {
            sessions.remove(sessionId);
        }
    }

    /**
     * 强制下线指定用户的所有会话
     */
    public void expireAllSessions(String username) {
        Set<String> sessions = userSessions.remove(username);
        if (sessions != null) {
            for (String sessionId : sessions) {
                // 调用 SessionRegistry 使会话失效
                // sessionRegistry.getSessionInformation(sessionId).expireNow();
            }
        }
    }
}
```

## 4. 数据安全：加密存储与脱敏展示

### 4.1 敏感数据加密存储

**分层的加密策略**：

```
┌──────────────────────────────────────────────────────┐
│              敏感数据加密层级                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Level 1: 密码类（不可逆）                              │
│  ├── 用户登录密码 → BCrypt / Argon2                    │
│  └── 支付密码 → BCrypt / Argon2                       │
│                                                      │
│  Level 2: 高敏感数据（可逆，需解密查看）                   │
│  ├── 身份证号 → AES-256-GCM                           │
│  ├── 银行卡号 → AES-256-GCM                           │
│  └── 手机号 → AES-256-GCM（可选，视合规要求）              │
│                                                      │
│  Level 3: 中等敏感（可逆，用于数据关联）                   │
│  ├── 姓名 → AES-256-GCM 或 确定性加密                   │
│  └── 地址 → AES-256-GCM                               │
│                                                      │
│  Level 4: 一般数据（可逆，用于展示）                       │
│  ├── 邮箱 → AES-256-GCM（可用于发送通知）                 │
│  └── 昵称 → 明文或加密                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**AES-256-GCM 加密实现**（推荐，自带认证）：

```java
@Component
public class AesEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;  // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // bits

    private final SecretKey secretKey;

    public AesEncryptionService(@Value("${encryption.aes-key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("AES-256 需要 32 字节密钥");
        }
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * 加密
     * @return Base64(IV + 密文)
     */
    public String encrypt(String plaintext) {
        try {
            // 生成随机 IV（每次加密使用不同 IV）
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // 将 IV 和密文拼接在一起
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(byteBuffer.array());

        } catch (Exception e) {
            throw new RuntimeException("加密失败", e);
        }
    }

    /**
     * 解密
     */
    public String decrypt(String encryptedBase64) {
        try {
            byte[] data = Base64.getDecoder().decode(encryptedBase64);

            // 分离 IV 和密文
            ByteBuffer byteBuffer = ByteBuffer.wrap(data);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (AEADBadTagException e) {
            throw new SecurityException("数据被篡改或密钥不匹配", e);
        } catch (Exception e) {
            throw new RuntimeException("解密失败", e);
        }
    }
}
```

**数据库层面：使用 JPA AttributeConverter 自动加密**：

```java
@Converter
public class SensitiveDataConverter implements AttributeConverter<String, String> {

    private static AesEncryptionService encryptionService;

    // 通过 Spring 注入（需要特殊处理，因为 Converter 不是 Spring Bean）
    public static void setEncryptionService(AesEncryptionService service) {
        encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute);  // 存到数据库前加密
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return encryptionService.decrypt(dbData);  // 从数据库读取后解密
    }
}

// 使用
@Entity
public class User {
    @Convert(converter = SensitiveDataConverter.class)
    @Column(columnDefinition = "TEXT")
    private String idCard;  // 身份证号：自动加密存储

    @Convert(converter = SensitiveDataConverter.class)
    private String bankCard; // 银行卡号：自动加密存储
}
```

### 4.2 数据脱敏展示

```java
@Component
public class DataMaskingUtil {

    /**
     * 手机号脱敏：138****1234
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() != 11) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /**
     * 身份证号脱敏：320***********1234
     */
    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 8) return idCard;
        return idCard.substring(0, 3) + "***********" + idCard.substring(idCard.length() - 4);
    }

    /**
     * 银行卡号脱敏：6222 **** **** 0123
     */
    public static String maskBankCard(String cardNo) {
        if (cardNo == null || cardNo.length() < 8) return cardNo;
        return cardNo.substring(0, 4) + " **** **** " + cardNo.substring(cardNo.length() - 4);
    }

    /**
     * 姓名脱敏：张**
     */
    public static String maskName(String name) {
        if (name == null || name.length() <= 1) return name;
        return name.charAt(0) + "*".repeat(name.length() - 1);
    }

    /**
     * 邮箱脱敏：j***@example.com
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String name = parts[0];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + parts[1];
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + parts[1];
    }
}
```

**Jackson 序列化时自动脱敏**：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@JacksonAnnotationsInside
@JsonSerialize(using = MaskingSerializer.class)
public @interface MaskData {
    MaskType value();
}

public enum MaskType {
    PHONE, ID_CARD, BANK_CARD, NAME, EMAIL
}

public class MaskingSerializer extends JsonSerializer<String> {
    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider provider)
            throws IOException {
        // 根据注解类型进行脱敏
        MaskData annotation = (MaskData) gen.getOutputContext().getCurrentValue()
                .getClass()
                .getDeclaredField(gen.getOutputContext().getCurrentName())
                .getAnnotation(MaskData.class);

        String maskedValue = value;
        if (annotation != null && value != null) {
            switch (annotation.value()) {
                case PHONE: maskedValue = DataMaskingUtil.maskPhone(value); break;
                case ID_CARD: maskedValue = DataMaskingUtil.maskIdCard(value); break;
                case BANK_CARD: maskedValue = DataMaskingUtil.maskBankCard(value); break;
                case NAME: maskedValue = DataMaskingUtil.maskName(value); break;
                case EMAIL: maskedValue = DataMaskingUtil.maskEmail(value); break;
            }
        }
        gen.writeString(maskedValue);
    }
}

// 使用
public class UserVO {
    private Long id;
    private String username;

    @MaskData(MaskType.PHONE)
    private String phone;   // 自动脱敏为 138****1234

    @MaskData(MaskType.ID_CARD)
    private String idCard;  // 自动脱敏
}
```

## 5. 接口安全：防重放、防暴力破解与限流

### 5.1 防重放攻击

重放攻击：攻击者截获合法的 API 请求，然后原样重新发送。

```java
@Component
public class ReplayAttackDefender {

    private final StringRedisTemplate redisTemplate;

    /**
     * 基于 Nonce（一次性随机数） + Timestamp 的防重放
     */
    public boolean isReplay(HttpServletRequest request) {
        String nonce = request.getHeader("X-Nonce");
        String timestamp = request.getHeader("X-Timestamp");

        // ─── 1. 基础校验 ───
        if (nonce == null || timestamp == null) {
            return true; // 缺少必要参数，视为可疑
        }

        // ─── 2. 时间戳校验：超过 5 分钟的请求视为无效 ───
        long requestTime = Long.parseLong(timestamp);
        long currentTime = System.currentTimeMillis();
        if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
            return true; // 请求时间戳偏离过大
        }

        // ─── 3. Nonce 唯一性校验 ───
        // 将 nonce 存入 Redis，设置过期时间为 5 分钟
        String key = "nonce:" + nonce;
        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(key, "1", Duration.ofMinutes(5));

        if (Boolean.FALSE.equals(success)) {
            return true; // nonce 已被使用，判定为重放
        }

        return false; // 非重放请求
    }
}
```

### 5.2 防暴力破解

```java
@Component
public class BruteForceProtector {

    private final StringRedisTemplate redisTemplate;

    /**
     * 滑动窗口限流：每分钟最多 10 次登录尝试
     */
    public boolean isBlocked(String key, int maxAttempts, int windowSeconds) {
        String redisKey = "brute:" + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);

        if (count == 1) {
            redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds));
        }

        return count != null && count > maxAttempts;
    }

    /**
     * 渐进式锁定：失败次数越多，锁定时间越长
     */
    public long getLockoutDuration(int failureCount) {
        if (failureCount <= 3) return 0;           // 无锁定
        if (failureCount == 4) return 1;            // 1 分钟
        if (failureCount == 5) return 5;            // 5 分钟
        if (failureCount == 6) return 15;           // 15 分钟
        if (failureCount <= 10) return 30;          // 30 分钟
        return 24 * 60;                             // 24 小时
    }
}

// 在过滤器中拦截
@Component
public class BruteForceFilter extends OncePerRequestFilter {

    private final BruteForceProtector protector;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // 仅对登录接口生效
        if (request.getRequestURI().equals("/api/auth/login")) {
            String identifier = request.getRemoteAddr(); // 或用户名

            if (protector.isBlocked(identifier, 10, 60)) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
```

### 5.3 API 限流

```java
// 使用 Bucket4j + Redis 实现分布式限流

@Service
public class RateLimitService {

    private final RedissonClient redissonClient;

    /**
     * 基于令牌桶算法的分布式限流
     *
     * @param key        限流标识（如 userId 或 IP）
     * @param capacity   桶容量（突发允许的最大请求数）
     * @param refillRate 填充速率（每秒填充的令牌数）
     * @return true = 允许，false = 限流
     */
    public boolean tryAcquire(String key, long capacity, long refillRate) {
        RRateLimiter limiter = redissonClient.getRateLimiter("ratelimit:" + key);

        // 初始化（仅首次执行）
        limiter.trySetRate(RateType.OVERALL, capacity, Duration.ofSeconds(1));

        return limiter.tryAcquire();
    }
}

// 声明式限流注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RateLimit {
    String key() default "";       // 限流 Key，支持 SpEL
    long capacity() default 10;    // 每秒容量
    long refillRate() default 10;  // 每秒填充
    String message() default "请求过于频繁";
}

@Aspect
@Component
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        // 解析 SpEL 表达式获取 Key
        String key = parseKey(rateLimit.key(), joinPoint);

        if (!rateLimitService.tryAcquire(key, rateLimit.capacity(), rateLimit.refillRate())) {
            throw new TooManyRequestsException(rateLimit.message());
        }

        return joinPoint.proceed();
    }

    private String parseKey(String keyExpression, ProceedingJoinPoint joinPoint) {
        // 使用 Spring ExpressionParser 解析 SpEL
        // 例如: "#userId" → 从方法参数中提取
        if (StringUtils.isEmpty(keyExpression)) {
            // 默认用方法签名 + IP
            return joinPoint.getSignature().toShortString();
        }
        // ... SpEL 解析逻辑
        return keyExpression;
    }
}

// 使用
@RestController
public class TransferController {

    @PostMapping("/api/transfer")
    @RateLimit(key = "#request.userId", capacity = 1, refillRate = 1,
               message = "请勿重复提交转账请求")
    public ApiResponse transfer(@RequestBody TransferRequest request) {
        // 同一个用户每秒最多 1 次转账
    }
}
```

## 6. 日志安全：审计日志与信息遮蔽

### 6.1 审计日志

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface AuditLog {
    String operation();      // 操作类型：LOGIN、TRANSFER、UPDATE_USER
    String description();    // 操作描述
    boolean recordParams() default true;   // 是否记录参数
    boolean recordResult() default false;  // 是否记录结果
}

@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        long startTime = System.currentTimeMillis();

        // 获取当前用户
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";

        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes)
                RequestContextHolder.getRequestAttributes();
        String ip = attributes != null ? attributes.getRequest().getRemoteAddr() : "unknown";

        String params = auditLog.recordParams()
                ? sanitizeParams(joinPoint.getArgs())  // ← 脱敏
                : "[HIDDEN]";

        Object result = null;
        String status = "SUCCESS";
        String errorMessage = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            status = "FAILURE";
            errorMessage = e.getMessage();
            throw e;
        } finally {
            long elapsed = System.currentTimeMillis() - startTime;

            // 异步写入审计日志（不阻塞业务）
            auditLogService.logAsync(AuditLogEntry.builder()
                    .username(username)
                    .ip(ip)
                    .operation(auditLog.operation())
                    .description(auditLog.description())
                    .params(params)
                    .status(status)
                    .errorMessage(errorMessage)
                    .elapsedMs(elapsed)
                    .timestamp(LocalDateTime.now())
                    .build());
        }
    }

    /**
     * 敏感参数脱敏：自动识别含有敏感信息的参数并脱敏
     */
    private String sanitizeParams(Object[] args) {
        if (args == null || args.length == 0) return "";

        try {
            ObjectMapper mapper = new ObjectMapper();
            // 序列化时对 password、token、secret 等字段替换为 ***
            String json = mapper.writeValueAsString(args);
            return json
                    .replaceAll("\"password\"\\s*:\\s*\"[^\"]*\"", "\"password\":\"***\"")
                    .replaceAll("\"token\"\\s*:\\s*\"[^\"]*\"", "\"token\":\"***\"")
                    .replaceAll("\"secret\"\\s*:\\s*\"[^\"]*\"", "\"secret\":\"***\"");
        } catch (Exception e) {
            return "[SERIALIZATION_ERROR]";
        }
    }
}
```

### 6.2 Logback 日志脱敏

```xml
<!-- logback-spring.xml -->
<configuration>
    <!-- 自定义脱敏转换器 -->
    <conversionRule conversionWord="mask"
                    converterClass="com.example.config.SensitiveDataConverter" />

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <!-- 使用自定义 pattern，%mask 会自动脱敏 -->
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger - %mask%n</pattern>
        </encoder>
    </appender>
</configuration>
```

```java
// 自定义 Logback MessageConverter
public class SensitiveDataConverter extends MessageConverter {

    // 需要脱敏的正则模式
    private static final Pattern[] SENSITIVE_PATTERNS = {
        // 手机号
        Pattern.compile("(1[3-9]\\d)\\d{4}(\\d{4})"),
        // 身份证号
        Pattern.compile("(\\d{6})\\d{8}(\\d{4}[\\dXx])"),
        // 银行卡号
        Pattern.compile("(\\d{4})\\d{8,12}(\\d{4})"),
        // 密码字段
        Pattern.compile("(\"password\"\\s*[:=]\\s*\"?)[^\"&,\\s}]+"),
        // Token
        Pattern.compile("(eyJ[A-Za-z0-9_-]+)\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+"),
    };

    @Override
    public String convert(ILoggingEvent event) {
        String message = event.getFormattedMessage();

        message = message
                .replaceAll(SENSITIVE_PATTERNS[0].pattern(), "$1****$2")            // 手机号
                .replaceAll(SENSITIVE_PATTERNS[1].pattern(), "$1********$2")         // 身份证
                .replaceAll(SENSITIVE_PATTERNS[2].pattern(), "$1 **** **** $2")      // 银行卡
                .replaceAll(SENSITIVE_PATTERNS[3].pattern(), "$1***")                // 密码
                .replaceAll(SENSITIVE_PATTERNS[4].pattern(), "$1.***.***");          // JWT

        return message;
    }
}
```

### 6.3 日志安全规则

```
✅ 应该记录：
  - 所有认证事件（登录、登出、刷新 Token）
  - 所有敏感操作（转账、修改密码、权限变更）
  - 所有异常的访问（403、401）
  - 系统启动/关闭事件
  - 配置变更

❌ 不应该记录：
  - 密码明文
  - 完整的银行卡号、身份证号
  - 完整的 JWT Token
  - 安全问题的答案
  - 支付密码/PIN码
  - 短信验证码

⚠️ 日志安全：
  - 日志文件权限 640
  - 定期轮转和归档
  - 日志中敏感信息自动脱敏
  - 审计日志不可删除（防止内鬼销毁证据）
  - 日志输出到独立的安全服务器
```

## 7. SQL 注入、XSS、CSRF 防御

### 7.1 SQL 注入防御

```java
// ❌ 危险：字符串拼接
String sql = "SELECT * FROM users WHERE username = '" + username + "'";
// 输入: ' OR '1'='1' --
// 结果: SELECT * FROM users WHERE username = '' OR '1'='1' --'

// ✅ 方式一：PreparedStatement（参数化查询）
String sql = "SELECT * FROM users WHERE username = ?";
PreparedStatement ps = connection.prepareStatement(sql);
ps.setString(1, username);

// ✅ 方式二：MyBatis 中使用 #{}（不是 ${}）
// #{} → 参数化查询，安全
@Select("SELECT * FROM users WHERE username = #{username}")
User findByUsername(String username);

// ❌ ${} → 直接拼接，危险！
@Select("SELECT * FROM users WHERE username = '${username}'")  // 危险！

// ✅ 方式三：JPA Criteria API
Specification<User> spec = (root, query, cb) ->
    cb.equal(root.get("username"), username);

// ✅ 方式四：动态排序/表名时，使用白名单
private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "username", "createTime");
private static final Set<String> ALLOWED_DIRECTIONS = Set.of("ASC", "DESC");

public List<User> findWithOrder(String orderBy, String direction) {
    if (orderBy == null || !ALLOWED_COLUMNS.contains(orderBy)) {
        throw new IllegalArgumentException("无效的排序字段: " + orderBy);
    }
    if (direction == null || !ALLOWED_DIRECTIONS.contains(direction.toUpperCase())) {
        throw new IllegalArgumentException("无效的排序方向: " + direction);
    }
    // 此时可以安全拼接
    return mapper.findWithOrder(orderBy, direction.toUpperCase());
}
```

### 7.2 XSS 防御

```java
// ─── 输入过滤 ───
@Component
public class XssFilter {

    public String sanitize(String input) {
        if (input == null) return null;

        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .replace("/", "&#x2F;");
    }
}

// ─── JSON 反序列化时过滤 ───
@Component
public class XssStringDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt)
            throws IOException {
        String value = p.getValueAsString();
        if (value == null) return null;

        // 使用 OWASP Java HTML Sanitizer
        return PolicyFactoryInstance.POLICY.sanitize(value);
    }
}

// 在字段上使用
public class CreateUserRequest {
    @JsonDeserialize(using = XssStringDeserializer.class)
    private String username;  // 自动过滤 XSS

    @JsonDeserialize(using = XssStringDeserializer.class)
    private String nickname;
}

// ─── 响应头设置 ───
http.headers(headers -> headers
    .xssProtection(xss -> xss
        .headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK)
    )
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; script-src 'self'")
    )
);
```

### 7.3 CSRF 防御

```java
// ─── 场景一：传统 Web 应用（使用 Session） ───
// Spring Security 默认启用 CSRF 保护
http.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
);

// 前端需要在请求头中携带 CSRF Token
// 方式 1: 在 <form> 中隐藏字段（Thymeleaf 自动处理）
// 方式 2: AJAX 请求中设置 X-CSRF-TOKEN 头
fetch('/api/users', {
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="_csrf"]').content,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});

// ─── 场景二：前后端分离（JWT） ───
// JWT 本身不是 CSRF 漏洞的自动解药！
// 仍然需要防范 CSRF

// 方案 A: 自定义请求头验证（最简单）
http.csrf(csrf -> csrf
    .requireCsrfProtectionMatcher(request -> {
        // 如果有自定义头 X-Requested-With，不做 CSRF 检查
        // 因为跨域请求无法设置自定义头（浏览器同源策略）
        String header = request.getHeader("X-Requested-With");
        return !"XMLHttpRequest".equals(header);
    })
);

// 方案 B: SameSite Cookie（最推荐）
// 结合 Refresh Token 存储在 HttpOnly + SameSite=Strict Cookie
ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
    .sameSite("Strict")  // ← 阻止跨站请求携带 Cookie
    .httpOnly(true)
    .secure(true)
    .build();

// 方案 C: Double Submit Cookie Pattern
// 服务端设置一个随机 Token 在 Cookie 和非 HttpOnly Cookie 中
// 前端读取非 HttpOnly Cookie 的值，放到请求头
// 服务端比较两个值是否一致
```

## 8. 安全检查清单（可直接使用）

### 8.1 传输层安全

- [ ] 全站 HTTPS，HTTP 自动跳转 HTTPS
- [ ] HSTS 头已配置（max-age ≥ 1年，preload）
- [ ] TLS 1.2+ 启用，禁用 TLS 1.0/1.1，禁用 SSLv3
- [ ] 加密套件仅保留安全的（AES-GCM、ECDHE 等）
- [ ] 证书有效期监控，过期前 30 天告警
- [ ] 私钥保护：600 权限，不入代码库，使用 HSM

### 8.2 认证安全

- [ ] 密码强度要求：≥ 8 位，包含大小写字母、数字、特殊字符至少 3 种
- [ ] 密码使用 BCrypt/Argon2 加密，不可逆
- [ ] 登录失败 ≥ 5 次锁定账户 30 分钟
- [ ] 敏感操作需要二次认证（TOTP / 短信验证码）
- [ ] 验证码有效期 ≤ 5 分钟，使用后立即失效
- [ ] 防止会话固定攻击（登录后更换 Session ID）
- [ ] 会话超时设置（无操作 30 分钟过期）
- [ ] 并发会话控制（同一账号最多 3 个设备）
- [ ] Remember Me Token 安全（随机 Token，服务端验证）

### 8.3 授权安全

- [ ] 采用 RBAC 模型，权限最小化
- [ ] 所有接口默认拒绝，显式授权
- [ ] URL 级别 + 方法级别双重权限控制
- [ ] 前后端权限校验（后端为主，前端为辅）
- [ ] 定期审查权限配置，清理冗余权限
- [ ] 离职员工立即回收所有权限

### 8.4 数据安全

- [ ] 敏感字段（身份证、银行卡、密码）加密存储
- [ ] 使用 AES-256-GCM（推荐，带完整性验证）
- [ ] 加密密钥与数据分离存储（KMS / Vault）
- [ ] 展示时敏感数据自动脱敏
- [ ] 数据库连接使用 SSL/TLS
- [ ] 数据库账号最小权限（应用账号不能 DROP TABLE）
- [ ] 生产数据库访问需要审批 + 临时授权
- [ ] 数据备份加密存储

### 8.5 接口安全

- [ ] 所有接口参数校验（@Valid / 白名单）
- [ ] 敏感接口实现防重放（Nonce + Timestamp）
- [ ] API 限流（令牌桶 / 滑动窗口）
- [ ] 接口超时设置（≤ 30 秒）
- [ ] 文件上传限制（大小、类型、病毒扫描）
- [ ] 批量操作限制（单次最多处理数量）
- [ ] 金额类操作强制幂等性校验
- [ ] API 版本管理

### 8.6 代码安全

- [ ] 使用 PreparedStatement（禁止字符串拼接 SQL）
- [ ] 动态排序/分组字段使用白名单
- [ ] 用户输入做 XSS 过滤
- [ ] 文件路径防遍历（禁止 ../ 等特殊字符）
- [ ] 敏感配置不入代码库（使用环境变量/配置中心）
- [ ] 依赖安全扫描（OWASP Dependency-Check / Snyk）
- [ ] 不使用已知有漏洞的依赖版本

### 8.7 日志与监控

- [ ] 所有敏感操作记录审计日志
- [ ] 日志中敏感信息自动脱敏
- [ ] 审计日志不可删除
- [ ] 集中日志采集与分析（ELK / Splunk）
- [ ] 异常登录/操作实时告警
- [ ] 关键接口成功率/耗时监控
- [ ] 安全事件响应预案（24小时内可启动）

### 8.8 基础设施

- [ ] 服务器最小化安装（只安装必要软件）
- [ ] 防火墙规则最小化（默认 DROP，按需 ALLOW）
- [ ] 应用以非 root 用户运行
- [ ] 文件系统权限最小化
- [ ] Docker 镜像安全扫描
- [ ] K8s Pod Security Policy / SecurityContext
- [ ] 定期漏洞扫描和渗透测试
- [ ] 灾备与应急响应计划

## 总结

金融系统安全是一个**系统工程**，不是加几个注解就能解决的。作为后端开发者，心中要时刻有这根弦：

> **你的每个疏忽，都可能导致用户的财产损失。**

记住以下核心原则：

1. **零信任**——不信任任何输入，即使是"内部"的
2. **最小权限**——每个模块、每个用户只拥有最小必要权限
3. **纵深防御**——多层防护，即使一层被突破也不致命
4. **安全默认**——默认配置就是安全的配置
5. **持续改进**——安全是过程，不是结果

**建议将本文的 Checklist 打印出来贴在你的工位上，每次代码 Review 时逐条对照。**
