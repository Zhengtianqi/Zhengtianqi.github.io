---
title: HTTPS 握手全流程详解：从证书到密钥交换
tag: ["HTTPS", "TLS", "证书", "密钥交换", "网络安全"]
category: 基础知识
date: 2026-07-03
---

# HTTPS 握手全流程详解：从证书到密钥交换

HTTPS 比 HTTP 多了什么？TLS 握手到底握了几次手？证书链怎么验证？ECDHE 为什么比 RSA 更安全？一张图看懂全流程，从原理到代码。

---

## 一、HTTPS = HTTP + TLS

```
HTTP（明文传输）：
  Client ←──────────── HTTP ────────────→ Server
  风险：窃听、篡改、伪造

HTTPS（加密传输）：
  Client ←── TLS 握手 ──→ Server（建立加密通道）
  Client ←── 加密 HTTP ──→ Server（密文传输）
  解决：加密（防窃听）、校验（防篡改）、证书（防伪造）

TLS 版本演进：
  SSL 3.0 (1996)    → 已废弃（POODLE 攻击）
  TLS 1.0 (1999)    → 已废弃
  TLS 1.1 (2006)    → 已废弃
  TLS 1.2 (2008)    → 主流（2-RTT 握手）
  TLS 1.3 (2018)    → 最新（1-RTT 握手，0-RTT 恢复）
```

---

## 二、TLS 1.2 握手全流程

### 2.1 完整流程图

```
Client                                          Server
  │                                               │
  │ ──── 1. ClientHello ────────────────────────→ │
  │      - TLS 版本（1.2）                         │
  │      - 客户端随机数（Client Random, 32 字节）    │
  │      - 支持的密码套件列表                        │
  │      - 支持的压缩方法                           │
  │      - SNI（Server Name Indication）           │
  │                                               │
  │ ←─── 2. ServerHello ────────────────────────  │
  │      - TLS 版本                                │
  │      - 服务器随机数（Server Random, 32 字节）    │
  │      - 选定的密码套件（如 TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256）│
  │                                               │
  │ ←─── 3. Certificate ────────────────────────  │
  │      - 服务器证书（含公钥）                      │
  │      - 证书链（中间 CA → 根 CA）                 │
  │                                               │
  │ ←─── 4. ServerKeyExchange ──────────────────  │
  │      - ECDHE 参数（曲线类型、公钥）               │
  │      - 签名（用服务器私钥对参数签名）              │
  │                                               │
  │ ←─── 5. ServerHelloDone ────────────────────  │
  │                                               │
  │ ──── 6. ClientKeyExchange ─────────────────→  │
  │      - ECDHE 参数（客户端公钥）                   │
  │                                               │
  │      [双方计算 Pre-Master Secret]              │
  │      [双方计算 Master Secret]                  │
  │      [双方生成会话密钥]                         │
  │                                               │
  │ ──── 7. ChangeCipherSpec ──────────────────→  │
  │      "从现在开始我用加密说话了"                    │
  │                                               │
  │ ──── 8. Finished ──────────────────────────→  │
  │      - 加密的握手摘要                           │
  │                                               │
  │ ←─── 9. ChangeCipherSpec ───────────────────  │
  │ ←─── 10. Finished ──────────────────────────  │
  │                                               │
  │ ══════ 加密通信开始 ══════                      │
  │ ←══→ Application Data（AES-GCM 加密）════→    │

握手耗时：2 个 RTT（步骤 1-2 是第 1 个 RTT，步骤 6-10 是第 2 个 RTT）
```

### 2.2 密钥推导过程

```
1. 两个随机数：
   Client Random = Rc（32 字节，客户端生成）
   Server Random = Rs（32 字节，服务器生成）

2. Pre-Master Secret（PMS）：
   ECDHE 方式：通过椭圆曲线 Diffie-Hellman 交换计算
   - 服务器生成私钥 d_s，公钥 Q_s = d_s × G
   - 客户端生成私钥 d_c，公钥 Q_c = d_c × G
   - 双方交换公钥
   - PMS = d_c × Q_s = d_s × Q_c（椭圆曲线乘法）

3. Master Secret（MS）：
   MS = PRF(PMS, "master secret", Rc || Rs)
   = HMAC-SHA256(PMS, "master secret" + Rc + Rs)
   长度：48 字节

4. 会话密钥（Key Material）：
   Key Block = PRF(MS, "key expansion", Rs || Rc)
   从 Key Block 中切分：
   - Client Write MAC Key  → 客户端 MAC 密钥
   - Server Write MAC Key  → 服务器 MAC 密钥
   - Client Write Key      → 客户端加密密钥
   - Server Write Key      → 服务器加密密钥
   - Client Write IV       → 客户端初始化向量
   - Server Write IV       → 服务器初始化向量

   AES-GCM 模式不需要单独的 MAC Key（AEAD 自带认证）
```

---

## 三、证书链验证

### 3.1 证书结构

```
X.509 证书结构：

  Version: v3
  Serial Number: 04:8c:a2:...
  Signature Algorithm: SHA256-RSA
  Issuer: CN=DigiCert TLS RSA SHA256 2020 CA1  ← 签发者
  Validity:
    Not Before: 2024-01-01
    Not After:  2025-01-01
  Subject: CN=www.example.com  ← 证书持有者
  Subject Public Key:
    Algorithm: RSA
    Key: 2048-bit public key
  Extensions:
    SAN: www.example.com, example.com  ← 域名
    Key Usage: Digital Signature, Key Encipherment
    Extended Key Usage: Server Auth
  Signature: <DigiCert 的私钥对本证书的签名>

证书链：
  Root CA (自签名)          → 预装在操作系统/浏览器中
    └── Intermediate CA     → 由 Root CA 签发
          └── Server Cert   → 由 Intermediate CA 签发
```

### 3.2 验证流程

```
客户端收到服务器证书链：[Server Cert, Intermediate CA Cert]

验证步骤：

1. 证书有效期检查
   当前时间在 Not Before ~ Not After 之间？

2. 证书吊销检查
   OCSP（在线证书状态协议）→ 实时查询
   CRL（证书吊销列表）→ 下载列表检查

3. 域名匹配
   证书的 SAN 或 CN 与访问的域名匹配？
   www.example.com → SAN 包含 www.example.com

4. 签名验证（从叶子到根）
   a. 用 Intermediate CA 的公钥验证 Server Cert 的签名
   b. 用 Root CA 的公钥验证 Intermediate CA 的签名
   c. Root CA 自签名 → 在信任库中 → 信任

   信任锚：Root CA 预装在操作系统/浏览器中
   信任传递：Root → Intermediate → Server（签名链）

  ┌──────────┐    验证签名    ┌──────────────┐    验证签名    ┌──────────┐
  │ Server   │ ←──────────── │ Intermediate  │ ←──────────── │ Root CA  │
  │ Cert     │               │ CA Cert       │               │ (信任锚)  │
  └──────────┘               └──────────────┘               └──────────┘
```

### 3.3 证书类型

```
DV（Domain Validation）：
  只验证域名所有权
  签发快（几分钟）
  便宜/免费（Let's Encrypt）
  → 个人网站、测试

OV（Organization Validation）：
  验证域名 + 组织信息
  签发慢（1-3 天）
  证书中包含公司名称
  → 企业网站

EV（Extended Validation）：
  严格验证（公司注册、电话验证等）
  签发慢（1-2 周）
  浏览器显示公司名（旧版地址栏绿色）
  → 金融、电商
```

---

## 四、密钥交换算法

### 4.1 RSA 密钥交换（已弃用）

```
RSA 密钥交换流程：
  1. 客户端生成 Pre-Master Secret（48 字节随机数）
  2. 用服务器公钥加密 PMS（RSA 加密）
  3. 发送加密后的 PMS 给服务器
  4. 服务器用私钥解密得到 PMS
  5. 双方用 PMS + Client Random + Server Random 计算 Master Secret

问题：
  ✗ 不具备前向安全（Forward Secrecy）
  ✗ 如果服务器私钥泄露 → 历史所有通信可解密
  ✗ TLS 1.3 已移除 RSA 密钥交换
```

### 4.2 ECDHE 密钥交换（推荐）

```
ECDHE（Elliptic Curve Diffie-Hellman Ephemeral）：

  服务器：
    生成临时私钥 d_s（每次握手重新生成）
    公钥 Q_s = d_s × G（G 是椭圆曲线基点）
    发送 Q_s 给客户端

  客户端：
    生成临时私钥 d_c（每次握手重新生成）
    公钥 Q_c = d_c × G
    发送 Q_c 给服务器

  双方计算：
    服务器：PMS = d_s × Q_c = d_s × d_c × G
    客户端：PMS = d_c × Q_s = d_c × d_s × G
    → 两者相等！这就是 Pre-Master Secret

  前向安全：
    d_s 和 d_c 是临时的，握手后销毁
    私钥泄露也无法解密历史通信（因为不知道临时的 d_s/d_c）

  常用曲线：
    X25519（推荐， fastest）
    P-256（NIST 标准曲线）
    P-384
```

### 4.3 RSA vs ECDHE 对比

```
                RSA 密钥交换        ECDHE
前向安全          ✗ 不支持            ✓ 支持
私钥用途          加密 + 签名          仅签名
性能              RSA 解密慢           ECDHE 快
TLS 1.3           ✗ 已移除            ✓ 支持
安全性            低（私钥泄露=全暴露）  高（临时密钥）

结论：TLS 1.2 应使用 ECDHE，TLS 1.3 强制使用 ECDHE
```

---

## 五、TLS 1.3 改进

### 5.1 1-RTT 握手

```
TLS 1.3 握手（1-RTT）：

Client                                          Server
  │                                               │
  │ ── ClientHello ────────────────────────────→ │
  │    - TLS 1.3                                 │
  │    - Client Random                            │
  │    - 密码套件                                  │
  │    - Key Share（ECDHE 公钥，提前发送！）         │
  │                                               │
  │ ←─ ServerHello ────────────────────────────  │
  │    - Server Random                            │
  │    - 选定密码套件                               │
  │    - Key Share（ECDHE 公钥）                   │
  │    [双方已有足够信息计算密钥]                     │
  │                                               │
  │ ←─ EncryptedExtensions ────────────────────  │ ← 后续全部加密！
  │ ←─ Certificate ────────────────────────────  │
  │ ←─ CertificateVerify ──────────────────────  │
  │ ←─ Finished ───────────────────────────────  │
  │                                               │
  │ ── Finished ───────────────────────────────→ │
  │                                               │
  │ ══════ 加密通信开始 ══════                     │

对比 TLS 1.2：
  TLS 1.2：2-RTT（握手 4 次往返）
  TLS 1.3：1-RTT（握手 2 次往返）
  
节省的关键：ClientHello 时就带上 Key Share，不需要等 ServerHello 后再交换
```

### 5.2 0-RTT 恢复

```
TLS 1.3 Session Resumption（0-RTT）：

首次连接：正常 1-RTT 握手 + 服务器下发 Session Ticket
后续连接（0-RTT）：
  Client                                        Server
    │                                               │
    │ ── ClientHello + 0-RTT 数据 ──────────────→ │
    │    (Application Data 同时发送！)               │
    │                                               │
    │ ←─ ServerHello + 加密数据 ─────────────────  │
    │                                               │

0-RTT 限制：
  ✗ 只能用于 GET 等幂等请求（有重放攻击风险）
  ✗ 0-RTT 数据可能被攻击者重放
  ✓ 适合 HTTP GET、CDN 静态资源等
```

---

## 六、Java 实现 HTTPS

### 6.1 HttpsURLConnection

```java
// 默认信任系统证书库
URL url = new URL("https://api.example.com/data");
HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();

// 自定义证书验证（用于自签名证书）
SSLContext sslContext = SSLContext.getInstance("TLS 1.3");
KeyStore trustStore = KeyStore.getInstance("JKS");
try (InputStream is = new FileInputStream("truststore.jks")) {
    trustStore.load(is, "changeit".toCharArray());
}

TrustManagerFactory tmf = TrustManagerFactory.getInstance("X.509");
tmf.init(trustStore);

sslContext.init(null, tmf.getTrustManagers(), new SecureRandom());
conn.setSSLSocketFactory(sslContext.getSocketFactory());

// 主机名验证
conn.setHostnameVerifier((hostname, session) -> {
    return "api.example.com".equals(hostname);
});

conn.setRequestMethod("GET");
conn.setRequestProperty("Authorization", "Bearer token");
```

### 6.2 OkHttp 配置

```java
// OkHttp HTTPS 配置
OkHttpClient client = new OkHttpClient.Builder()
    // .sslSocketFactory(ssf, trustManager)
    // .hostnameVerifier(verifier)
    // .protocols(Arrays.asList(Protocol.HTTP_2, Protocol.HTTP_1_1))
    // .connectionSpecs(Arrays.asList(
    //     ConnectionSpec.MODERN_TLS,   // 现代TLS配置
    //     ConnectionSpec.CLEARTEXT     // 允许HTTP（不推荐）
    // ))
    .build();

// OkHttp 默认使用系统证书库
// 默认支持 TLS 1.3 / HTTP/2
// 默认启用证书锁定（Certificate Pinning）
```

---

## 七、面试要点

### Q：HTTPS 握手过程？

TLS 1.2 握手（2-RTT）：
1. ClientHello：客户端发送 TLS 版本、随机数、支持的密码套件
2. ServerHello：服务器选定密码套件、发送随机数
3. Certificate：服务器发送证书链
4. ServerKeyExchange：ECDHE 参数和签名
5. ClientKeyExchange：客户端 ECDHE 参数
6. 双方计算 Master Secret → 会话密钥
7. ChangeCipherSpec + Finished：切换为加密通信

### Q：什么是前向安全？为什么 ECDHE 有前向安全？

前向安全：私钥泄露不会导致历史通信被解密。
RSA 密钥交换：PMS 用服务器公钥加密发送，私钥泄露 → 解密所有历史 PMS → 解密所有历史通信。
ECDHE 密钥交换：每次握手生成临时密钥对（d_s, d_c），握手后销毁。私钥只用于签名验证，不参与密钥计算。私钥泄露 → 只能伪造未来签名，不能解密历史通信。

### Q：TLS 1.2 和 1.3 的主要区别？

1. 握手：1.2 是 2-RTT，1.3 是 1-RTT（0-RTT 恢复）
2. 密钥交换：1.3 移除 RSA，只保留 ECDHE/DHE（强制前向安全）
3. 加密：1.3 移除 CBC 模式，只用 AEAD（AES-GCM/ChaCha20-Poly1305）
4. 压缩：1.3 移除压缩（防 CRIME/BREACH 攻击）
5. 证书：1.3 握手后半段全部加密（1.2 证书明文传输）

---

## 八、总结

```
HTTPS = HTTP + TLS
TLS 1.2：2-RTT 握手，支持 RSA/ECDHE 密钥交换
TLS 1.3：1-RTT 握手，强制 ECDHE，移除不安全算法

证书链：Root CA → Intermediate CA → Server Cert（签名传递信任）
密钥交换：ECDHE（临时密钥，前向安全）> RSA（已弃用）
会话密钥：Master Secret = PRF(PMS, "master secret", Client Random + Server Random)

安全配置建议：
  - 只用 TLS 1.2+（禁用 TLS 1.0/1.1）
  - 优先 ECDHE 密码套件（TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256）
  - HSTS 头部强制 HTTPS
  - 证书锁定（Certificate Pinning）防 MITM
```
