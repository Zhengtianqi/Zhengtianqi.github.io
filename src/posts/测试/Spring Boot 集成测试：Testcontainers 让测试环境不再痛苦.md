---
title: Spring Boot 集成测试：Testcontainers 让测试环境不再痛苦
tag: ["测试", "Testcontainers", "Unit Test"]
category: 测试
date: 2026-06-12
---

# Spring Boot 集成测试：Testcontainers 让测试环境不再痛苦

> Spring是Java生态中最流行的企业级框架，它为企业应用提供了全面的解决方案。
> 本文介绍了Spring框架的核心特性和使用方式，帮助你快速上手企业级开发。

```
单元测试（Unit Test）
├── 测试范围：单个类/方法
├── 依赖处理：Mock 所有外部依赖
├── 执行速度：毫秒级
├── 目的：验证代码逻辑正确性
└── 类比：测试一个齿轮是否能正常运转

集成测试（Integration Test）
├── 测试范围：多个组件协作
├── 依赖处理：使用真实的数据库、消息队列等
├── 执行速度：秒级
├── 目的：验证组件间交互正确性
└── 类比：测试齿轮组装后整台机器能否运转
```

### 1.2 什么时候该写集成测试

```
必须写集成测试的场景：
├── Repository 层 → 验证 SQL/JPQL 查询是否正确
├── 数据库迁移脚本 → 验证 Flyway/Liquibase 脚本
├── 消息队列 → 验证消息发送和消费
├── 外部 API 调用 → 验证请求/响应序列化
├── 事务边界 → 验证事务回滚和隔离级别
└── 安全配置 → 验证认证授权过滤器链

可以不写的场景：
├── 纯业务逻辑（单元测试更合适）
└── 简单 CRUD（Repository 层的集成测试已经覆盖）
```

## 2. Spring Boot Test 核心注解

### 2.1 关键注解速查

| 注解 | 作用 | 性能 |
|------|------|------|
| `@SpringBootTest` | 启动完整 Spring 上下文 | 最慢 |
| `@WebMvcTest` | 仅加载 Web 层（Controller） | 快 |
| `@DataJpaTest` | 仅加载 JPA 层（Repository） | 较快 |
| `@DataMongoTest` | 仅加载 MongoDB 层 | 较快 |
| `@RestClientTest` | 仅加载 RestTemplate 相关 Bean | 快 |
| `@JsonTest` | 仅加载 JSON 序列化相关 Bean | 最快 |
| `@AutoConfigureMockMvc` | 配置 MockMvc（配合 @SpringBootTest） | - |
| `@TestConfiguration` | 仅在测试中使用的额外配置 | - |
| `@MockBean` | 在容器中替换 Bean 为 Mock | - |
| `@SpyBean` | 在容器中包装 Bean 为 Spy | - |

### 2.2 分层的测试策略

```java
// ═══ Layer 1: Repository 层（@DataJpaTest） ═══
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// ↑ 关键：不替换数据源（使用 Testcontainers 提供的真实数据库）
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("根据用户名查询 → 存在")
    void findByUsername() {
        // Given
        User user = new User();
        user.setUsername("zhangsan");
        user.setEmail("zhangsan@example.com");
        entityManager.persistAndFlush(user);  // 直接写入数据库

        // When
        Optional<User> result = userRepository.findByUsername("zhangsan");

        // Then
        assertTrue(result.isPresent());
        assertEquals("zhangsan@example.com", result.get().getEmail());
    }

    @Test
    @DisplayName("自定义查询 → 分页查询活跃用户")
    void findActiveUsersWithPagination() {
        // Given
        for (int i = 0; i < 10; i++) {
            User u = new User();
            u.setUsername("user" + i);
            u.setStatus(i % 2 == 0 ? 1 : 0);
            entityManager.persist(u);
        }
        entityManager.flush();

        // When
        Page<User> page = userRepository.findByStatus(1, PageRequest.of(0, 5));

        // Then
        assertEquals(5, page.getContent().size());
        assertEquals(10, page.getTotalElements());
    }
}

// ═══ Layer 2: Controller 层（@WebMvcTest） ═══
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("GET /api/users → 返回分页用户列表")
    void listUsers() throws Exception {
        Page<User> page = new PageImpl<>(List.of(
            User.builder().id(1L).username("用户A").build(),
            User.builder().id(2L).username("用户B").build()
        ));

        when(userService.listUsers(anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/users")
                .param("page", "1")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content.length()").value(2))
            .andExpect(jsonPath("$.data.content[0].username").value("用户A"));
    }
}

// ═══ Layer 3: 全链路（@SpringBootTest + Testcontainers） ═══
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class UserApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("完整流程：注册 → 登录 → 查询个人信息")
    void fullUserJourney() throws Exception {
        // 1. 注册
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"testuser","password":"P@ssw0rd123!","email":"test@test.com"}
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        // 2. 登录
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"testuser","password":"P@ssw0rd123!"}
                    """))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(loginResponse)
                .get("data").get("accessToken").asText();

        // 3. 查询个人信息
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("testuser"));
    }
}
```

## 3. Testcontainers 简介：为什么比 H2 更好

### 3.1 H2 的问题

很多团队在测试中使用 H2 内存数据库来替代真实数据库。看似方便，实际隐患重重：

```
┌─────────────────────────────────────────────────────────┐
│              为什么 H2 ≠ MySQL/PostgreSQL                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  H2 做不到的事情：                                        │
│  ├── 不支持的函数：GROUP_CONCAT、JSON_EXTRACT、窗口函数     │
│  ├── 语法差异：LIMIT vs FETCH FIRST、自增主键策略          │
│  ├── 类型差异：TINYINT → Boolean 自动转换                  │
│  ├── 锁行为：InnoDB 行锁 vs H2 表锁完全不同                │
│  └── 字符集：MySQL utf8mb4 表情符号 vs H2 不兼容           │
│                                                         │
│  结果：测试通过，生产炸掉 → "假绿灯"                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**真实案例**：

```java
// 这段代码在 H2 上测试通过，但在 MySQL 生产环境抛出异常
@Query("SELECT u FROM User u WHERE u.name IN :names ORDER BY FIELD(u.name, :names)")
// FIELD() 是 MySQL 特有函数 → H2 不支持 → 测试通过不了（如果你用 H2）
// 但如果你用 H2 并且这个查询在别处 → 测试就骗了你
```

### 3.2 Testcontainers 的优势

```
┌─────────────────────────────────────────────────────────┐
│            Testcontainers = 真实数据库 + Docker            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  一次配置，永久受益：                                      │
│  ├── 与生产环境相同的数据库版本                             │
│  ├── 支持 MySQL、PostgreSQL、Redis、Kafka、Elasticsearch  │
│  ├── 容器自动启停，测试结束自动销毁                          │
│  ├── 支持 CI/CD（GitHub Actions、Jenkins）                 │
│  └── 代码即文档：看测试就知道依赖了哪些中间件                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 依赖配置

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers</artifactId>
    <version>1.20.1</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mysql</artifactId>
    <version>1.20.1</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.20.1</version>
    <scope>test</scope>
</dependency>
```

## 4. MySQL/Redis/Kafka 容器配置

### 4.1 MySQL 容器

```java
// ─── 方式一：编程式启动（推荐，灵活） ───
@Testcontainers  // ← 自动管理容器生命周期
@SpringBootTest
abstract class BaseMySqlTest {

    @Container  // ← 单例容器（所有测试类共享）
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);  // ← 开启容器复用（加速）

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name",
                () -> "com.mysql.cj.jdbc.Driver");
    }
}

// ─── 方式二：自定义 MySQL 镜像（含初始化脚本） ───
static final MySQLContainer<?> CUSTOM_MYSQL = new MySQLContainer<>(
        DockerImageName.parse("mysql:8.0.36")
                .asCompatibleSubstituteFor("mysql"))
        .withDatabaseName("appdb")
        .withUsername("appuser")
        .withPassword("apppass")
        .withInitScript("sql/init-test-data.sql")  // ← 容器启动后执行
        .withConfigurationOverride("mysql-conf");  // ← 自定义 MySQL 配置
```

**testcontainers.properties**（`~/.testcontainers.properties` 或项目 `src/test/resources`）：

```properties
# 开启容器复用（加速 CI 和本地测试）
testcontainers.reuse.enable=true

# 如果 Docker 不在默认位置
# docker.host=tcp://localhost:2375

# 使用 Ryuk 自动清理（默认开启，CI 中可能需要关闭）
# ryuk.disabled=true
```

### 4.2 Redis 容器

```java
@Testcontainers
@SpringBootTest
abstract class BaseRedisTest {

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(
            DockerImageName.parse("redis:7.2-alpine"))
            .withExposedPorts(6379)
            .withReuse(true)
            .withCommand("redis-server", "--requirepass", "testpass");

    @DynamicPropertySource
    static void configureRedis(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("spring.data.redis.password", () -> "testpass");
    }
}
```

### 4.3 Kafka 容器

```java
@Testcontainers
@SpringBootTest
abstract class BaseKafkaTest {

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.6.1"))
            .withReuse(true)
            .withKraft();  // ← 使用 KRaft 模式（不需要 ZooKeeper）

    @DynamicPropertySource
    static void configureKafka(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }
}
```

### 4.4 组合容器（ComposeContainer）

```java
@Testcontainers
@SpringBootTest
abstract class BaseFullStackTest {

    @Container
    static final DockerComposeContainer<?> COMPOSE =
            new DockerComposeContainer<>(
                    new File("src/test/resources/docker-compose-test.yml"))
                .withExposedService("mysql", 3306)
                .withExposedService("redis", 6379)
                .withExposedService("kafka", 9092)
                .withLocalCompose(true)
                .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",
            () -> "jdbc:mysql://" + COMPOSE.getServiceHost("mysql", 3306)
                    + ":" + COMPOSE.getServicePort("mysql", 3306) + "/testdb");
        registry.add("spring.data.redis.host",
            () -> COMPOSE.getServiceHost("redis", 6379));
        registry.add("spring.data.redis.port",
            () -> COMPOSE.getServicePort("redis", 6379));
    }
}
```

## 5. 实战：完整的 API 集成测试

### 5.1 测试基类

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@Slf4j
public abstract class BaseIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("order_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    /**
     * 发送 POST 请求
     */
    protected ResultActions post(String url, Object body) throws Exception {
        return mockMvc.perform(
            MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    /**
     * 发送带 Token 的请求
     */
    protected ResultActions postWithToken(String url, Object body,
                                           String token) throws Exception {
        return mockMvc.perform(
            MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    protected ResultActions getWithToken(String url, String token) throws Exception {
        return mockMvc.perform(
            MockMvcRequestBuilders.get(url)
                .header("Authorization", "Bearer " + token)
        );
    }

    /**
     * 辅助：登录获取 Token
     */
    protected String login(String username, String password) throws Exception {
        String response = post("/api/auth/login",
                new LoginRequest(username, password))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response)
                .get("data").get("accessToken").asText();
    }

    /**
     * 辅助：从 JSON 响应提取数据
     */
    protected <T> T extractData(String jsonResponse, Class<T> clazz) throws Exception {
        String dataJson = objectMapper.readTree(jsonResponse)
                .get("data").toString();
        return objectMapper.readValue(dataJson, clazz);
    }
}
```

### 5.2 订单服务集成测试

```java
@DisplayName("订单服务集成测试")
class OrderIntegrationTest extends BaseIntegrationTest {

    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // 创建测试用户并登录
        post("/api/auth/register",
            new RegisterRequest("testuser", "P@ssw0rd!", "test@test.com"))
            .andExpect(status().isCreated());

        userToken = login("testuser", "P@ssw0rd!");
        adminToken = login("admin", "Admin@123!");
    }

    @Test
    @DisplayName("完整订单流程：创建 → 支付 → 发货 → 确认收货")
    void completeOrderFlow() throws Exception {
        // ─── Step 1: 创建订单 ───
        CreateOrderRequest createRequest = CreateOrderRequest.builder()
                .items(List.of(
                    OrderItem.of(1L, 2),  // 商品1, 数量2
                    OrderItem.of(2L, 1)   // 商品2, 数量1
                ))
                .addressId(1L)
                .couponCode("SAVE10")
                .build();

        String createResponse = postWithToken("/api/orders", createRequest, userToken)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING_PAYMENT"))
                .andReturn().getResponse().getContentAsString();

        OrderVO order = extractData(createResponse, OrderVO.class);
        Long orderId = order.getId();

        // ─── Step 2: 支付订单 ───
        postWithToken("/api/orders/" + orderId + "/pay",
                new PayRequest("ALIPAY"), userToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"));

        // ─── Step 3: 管理员发货 ───
        postWithToken("/api/orders/" + orderId + "/ship",
                new ShipRequest("SF1234567890"), adminToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SHIPPED"));

        // ─── Step 4: 确认收货 ───
        postWithToken("/api/orders/" + orderId + "/confirm",
                null, userToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("取消订单 → 只有待支付状态可以取消")
    void cancelOrderOnlyWhenPending() throws Exception {
        // 创建订单
        String response = postWithToken("/api/orders",
                buildCreateRequest(), userToken)
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        Long orderId = extractData(response, OrderVO.class).getId();

        // 可以取消（待支付状态）
        postWithToken("/api/orders/" + orderId + "/cancel", null, userToken)
                .andExpect(status().isOk());

        // 不能再取消（已取消状态）
        postWithToken("/api/orders/" + orderId + "/cancel", null, userToken)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("只有待支付状态的订单可以取消"));
    }

    @Test
    @DisplayName("权限控制 → 普通用户不能发货")
    void normalUserCannotShip() throws Exception {
        String response = postWithToken("/api/orders",
                buildCreateRequest(), userToken)
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        Long orderId = extractData(response, OrderVO.class).getId();

        // 先支付
        postWithToken("/api/orders/" + orderId + "/pay",
                new PayRequest("ALIPAY"), userToken);

        // 普通用户尝试发货 → 应被拒绝
        postWithToken("/api/orders/" + orderId + "/ship",
                new ShipRequest("SF123"), userToken)
                .andExpect(status().isForbidden());
    }
}
```

## 6. 测试数据管理：@Sql 与 Flyway

### 6.1 使用 @Sql 注解

```java
@SpringBootTest
@Sql(scripts = ["/sql/cleanup.sql", "/sql/test-data.sql"],
     executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
@Sql(scripts = "/sql/cleanup.sql",
     executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class OrderServiceWithSqlTest {

    @Autowired
    private OrderService orderService;

    @Test
    @DisplayName("已有测试数据的场景")
    void withPreloadedData() {
        // sql/test-data.sql 中已插入：
        // INSERT INTO users VALUES (1, 'existing_user', ...);
        // INSERT INTO products VALUES (1, '商品A', 100.00, 50);

        Order order = orderService.createOrder(1L, List.of(
            new OrderItem(1L, 2)  // 商品A × 2
        ));

        assertEquals(new BigDecimal("200.00"), order.getTotalAmount());
    }
}
```

**sql/cleanup.sql**：

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

**sql/test-data.sql**：

```sql
INSERT INTO users (id, username, password, email, status)
VALUES (1, 'existing_user', '$2a$10$...', 'user@test.com', 1);

INSERT INTO products (id, name, price, stock)
VALUES
    (1, '商品A', 100.00, 50),
    (2, '商品B', 200.00, 30),
    (3, '商品C', 50.00, 0);  -- 库存为 0 的用于测试库存不足
```

### 6.2 Flyway 与测试

```yaml
# application-test.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration,classpath:db/testdata
    # db/migration → 生产迁移脚本
    # db/testdata → 仅测试用的数据脚本
```

```
src/test/resources/
├── db/
│   └── testdata/
│       └── R__test_data.sql    # R__ 前缀 = 可重复执行的迁移
```

```sql
-- R__test_data.sql（可重复执行，Flyway 会在内容变化时重新执行）
INSERT IGNORE INTO users (id, username, password, email, status)
VALUES
    (100, 'test_user',  '$2a$10$...', 'test@test.com',  1),
    (101, 'test_admin', '$2a$10$...', 'admin@test.com', 1);

INSERT IGNORE INTO user_roles (user_id, role_id)
VALUES (100, 1), (101, 2);
```

## 7. CI 中的集成测试：如何加速

### 7.1 完整的 CI 配置（GitHub Actions）

```yaml
# .github/workflows/ci.yml
name: CI with Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    services:
      # 方式一：GitHub Actions Service Container（无需 Testcontainers）
      mysql:
        image: mysql:8.0.36
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: testdb
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

      redis:
        image: redis:7.2-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Run tests
        run: mvn verify -Pintegration-test
        env:
          SPRING_DATASOURCE_URL: jdbc:mysql://localhost:3306/testdb
          SPRING_DATASOURCE_USERNAME: root
          SPRING_DATASOURCE_PASSWORD: root
          SPRING_DATA_REDIS_HOST: localhost
```

### 7.2 加速策略

```java
// ─── 策略 1: 容器复用 ───
// testcontainers.properties
// testcontainers.reuse.enable=true
// 注意：CI 中需要确保容器在构建间不会残留，加一个清理步骤

// ─── 策略 2: Singleton Container Pattern ───
// 在抽象基类中定义 @Container static，所有测试类共享一个容器
public abstract class BaseIntegrationTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36");

    // 所有集成测试继承此类 → 只启动一次 MySQL 容器
}

// ─── 策略 3: 按模块分组执行 ───
// 不需要每个测试都启动完整的 Spring Context
@DataJpaTest  // 只启动 JPA 相关 Bean
class OrderRepositoryTest { }

@WebMvcTest  // 只启动 Web 相关 Bean
class OrderControllerTest { }

@SpringBootTest  // 仅在必要时启动完整 Context
class OrderFullIntegrationTest { }

// ─── 策略 4: Maven 并行执行 ───
// pom.xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <parallel>classes</parallel>
        <threadCount>4</threadCount>
    </configuration>
</plugin>
```

### 7.3 测试加速汇总

```
┌─────────────────────────────────────────────────────────────┐
│              加速集成测试的 5 个策略                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ① 容器复用（testcontainers.reuse.enable=true）                │
│     本地开发：容器不销毁，重启测试秒级完成                        │
│     CI：容器在构建步骤间复用（需要 Docker-in-Docker 支持）        │
│                                                             │
│  ② Singleton Container（单例容器）                             │
│     所有测试类共享一个容器实例，启动一次                          │
│                                                             │
│  ③ 分层测试                                               │
│     @DataJpaTest / @WebMvcTest / @SpringBootTest             │
│     按需加载，80% 的测试用更轻量的注解                           │
│                                                             │
│  ④ 数据库初始化优化                                         │
│     用 INIT SCRIPT 一次性初始化 vs 每个测试类 @Sql               │
│     Flyway R__ 前缀脚本 + 内置测试数据                          │
│                                                             │
│  ⑤ CI 缓存                                              │
│     缓存 Docker 镜像层                                        │
│     缓存 Maven 本地仓库                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 总结

集成测试是保证软件质量的关键环节，Testcontainers 让它从"痛苦"变成了"愉悦"：

1. **用真实数据库**，告别 H2 的"假绿灯"
2. **容器化一切依赖**，让测试环境与生产一致
3. **分层测试**，不同层次用不同粒度的测试注解
4. **合理管理测试数据**，@Sql 做简单场景，Flyway 做复杂数据
5. **持续优化速度**，容器复用 + 并行执行 + CI 缓存

> **最后提醒**：集成测试不是越多越好，在关键路径上写集成测试（数据库查询、消息传递、外部 API），在业务逻辑上写单元测试 —— 两者配合，才是最高效的质量策略。
