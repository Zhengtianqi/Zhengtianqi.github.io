---
title: Java 单元测试实战：JUnit 5 + Mockito 从入门到自信
tag: ["JUnit", "测试", "ROI"]
category: 测试
date: 2020-07-21
---

# Java 单元测试实战：JUnit 5 + Mockito 从入门到自信

> 写好单元测试不光需要工具，更需要思维。本文从 ROI 分析到实战案例，带你全面掌握 Java 单元测试。

## 1. 为什么要写单元测试——ROI 分析

### 1.1 不写测试的真实代价

很多团队觉得写测试"浪费时间"。但让我们算一笔账：

```
场景：一个电商系统的订单金额计算逻辑有 Bug

没有测试：
  开发 → 写代码(2h) → 提交 → 测试发现Bug → 修Bug(30min) → 重新提测(1h) → 通过
  上线 → 用户投诉 → 排查(1h) → 改Bug(1h) → 加急上线(2h)
  总时间：7.5 小时 + 线上事故风险

有测试：
  开发 → 写测试(1h) → 写代码(1h) → 测试通过 → 提交
  上线 → OK
  总时间：2 小时，零线上风险
```

**单元测试的实际 ROI**：

| 影响维度 | 无测试 | 有测试 | 差异 |
|---------|--------|--------|------|
| Bug 发现时间 | 上线后 | 编写阶段 | **提前发现 85% 的 Bug** |
| 修 Bug 成本 | 10-100x | 1x | **节省 90%** |
| 重构信心 | 提心吊胆 | 大胆重构 | **重构速度 ×3** |
| 新人上手 | 靠问人和猜 | 看测试即文档 | **上手速度 ×2** |
| 文档维护 | 容易过期 | 测试即文档，永不过期 | **零维护成本** |

### 1.2 什么应该测试

```
必须测试（高优先级）：
├── 业务逻辑层（Service）：核心计算、状态流转
├── 工具类（Utils）：无副作用的纯函数
├── 领域模型（Domain）：实体之间的关联和约束
└── 算法逻辑：排序、计算、验证

建议测试（中优先级）：
├── Controller：请求参数校验、响应格式
├── Repository：自定义查询方法
└── 配置类：条件装配逻辑

可以不做（低优先级）：
├── POJO 的 getter/setter
├── 纯配置类（无逻辑）
├── 框架生成的代码
└── 一行简单的委托代码
```

---

## 2. JUnit 5 核心注解

### 2.1 基础注解速查

| 注解 | 说明 | 作用域 |
|------|------|--------|
| `@Test` | 标记测试方法 | 方法 |
| `@BeforeAll` | 所有测试前执行一次（必须 static） | 类 |
| `@AfterAll` | 所有测试后执行一次（必须 static） | 类 |
| `@BeforeEach` | 每个测试前执行 | 方法 |
| `@AfterEach` | 每个测试后执行 | 方法 |
| `@DisplayName` | 测试方法的可读名称 | 方法/类 |
| `@Disabled` | 跳过测试 | 方法/类 |
| `@Tag` | 给测试打标签（分类） | 方法/类 |
| `@Nested` | 内嵌测试类（分组） | 类 |
| `@ParameterizedTest` | 参数化测试 | 方法 |
| `@RepeatedTest` | 重复执行测试 | 方法 |
| `@Timeout` | 测试超时限制 | 方法/类 |
| `@TestMethodOrder` | 指定测试执行顺序 | 类 |

### 2.2 生命周期演示

```java
@DisplayName("订单服务测试")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderService orderService;

    // ═══ 生命周期方法 ═══

    @BeforeAll
    static void beforeAll() {
        // 整个测试类运行前执行一次
        // 适合：初始化数据库连接池、启动嵌入式服务等重量级操作
        System.out.println("【BeforeAll】初始化共享资源");
    }

    @AfterAll
    static void afterAll() {
        // 整个测试类运行完后执行一次
        // 适合：关闭连接池、清理共享资源
        System.out.println("【AfterAll】清理共享资源");
    }

    @BeforeEach
    void setUp() {
        // 每个 @Test 方法执行前运行
        // 适合：初始化 Mock、准备测试数据
        System.out.println("  【BeforeEach】准备测试数据");
    }

    @AfterEach
    void tearDown() {
        // 每个 @Test 方法执行后运行
        // 适合：清理测试数据、重置 Mock
        System.out.println("  【AfterEach】清理测试数据");
    }

    // ═══ 测试方法 ═══

    @Test
    @DisplayName("创建订单成功 → 库存充足、支付成功")
    void shouldCreateOrderSuccessfully() {
        System.out.println("    【测试】创建订单成功");
        // ...
    }

    @Test
    @DisplayName("创建订单失败 → 库存不足")
    void shouldFailWhenStockInsufficient() {
        System.out.println("    【测试】库存不足");
        // ...
    }

    // 执行顺序：
    // BeforeAll → [BeforeEach → 测试1 → AfterEach] → [BeforeEach → 测试2 → AfterEach] → AfterAll
}
```

### 2.3 参数化测试

```java
class CalculatorTest {

    private final Calculator calculator = new Calculator();

    // ─── @ValueSource：简单值 ───
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5, 100, Integer.MAX_VALUE})
    @DisplayName("加法运算 → 正数相加")
    void addition(int input) {
        assertTrue(calculator.add(input, 0) == input);
    }

    // ─── @CsvSource：多参数 ───
    @ParameterizedTest
    @CsvSource({
        "1, 1, 2",
        "2, 3, 5",
        "100, 200, 300",
        "-1, 1, 0",
        "0, 0, 0"
    })
    @DisplayName("加法运算 → 验证多种情况")
    void additionWithMultipleParams(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    // ─── @CsvFileSource：从文件读取测试数据 ───
    @ParameterizedTest
    @CsvFileSource(resources = "/test-data/addition.csv", numLinesToSkip = 1)
    @DisplayName("加法运算 → 批量数据")
    void additionFromFile(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    // ─── @MethodSource：从方法获取数据 ───
    @ParameterizedTest
    @MethodSource("provideDivisionTestData")
    @DisplayName("除法运算 → 复杂场景")
    void division(int dividend, int divisor, Integer expected,
                  Class<? extends Exception> expectedException) {
        if (expectedException != null) {
            assertThrows(expectedException,
                () -> calculator.divide(dividend, divisor));
        } else {
            assertEquals(expected, calculator.divide(dividend, divisor));
        }
    }

    static Stream<Arguments> provideDivisionTestData() {
        return Stream.of(
            Arguments.of(10, 2, 5, null),
            Arguments.of(7, 2, 3, null),     // 整数除法
            Arguments.of(0, 5, 0, null),
            Arguments.of(10, 0, null, ArithmeticException.class)
        );
    }

    // ─── @EnumSource：枚举值 ───
    @ParameterizedTest
    @EnumSource(value = OrderStatus.class,
                names = {"PENDING", "CONFIRMED"})
    @DisplayName("可取消的状态")
    void canCancel(OrderStatus status) {
        assertTrue(status.canCancel());
    }
}
```

### 2.4 @Nested：组织复杂测试

```java
@DisplayName("订单服务")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderService orderService;

    @Nested
    @DisplayName("创建订单")
    class CreateOrder {

        @Test
        @DisplayName("成功 → 库存充足")
        void successWhenStockSufficient() { /* ... */ }

        @Test
        @DisplayName("失败 → 库存不足")
        void failWhenStockInsufficient() { /* ... */ }

        @Test
        @DisplayName("失败 → 用户已禁用")
        void failWhenUserDisabled() { /* ... */ }
    }

    @Nested
    @DisplayName("取消订单")
    class CancelOrder {

        @Test
        @DisplayName("成功 → 待支付状态")
        void successWhenPending() { /* ... */ }

        @Test
        @DisplayName("失败 → 已发货状态不可取消")
        void failWhenAlreadyShipped() { /* ... */ }

        @Test
        @DisplayName("失败 → 非本人订单")
        void failWhenNotOwner() { /* ... */ }
    }

    @Nested
    @DisplayName("退款")
    class Refund {

        @Test
        @DisplayName("全额退款")
        void fullRefund() { /* ... */ }

        @Test
        @DisplayName("部分退款")
        void partialRefund() { /* ... */ }
    }
}

// 运行后的测试报告结构：
// 订单服务
//  ├── 创建订单
//  │    ├── 成功 → 库存充足          ✓
//  │    ├── 失败 → 库存不足          ✓
//  │    └── 失败 → 用户已禁用        ✓
//  ├── 取消订单
//  │    ├── 成功 → 待支付状态        ✓
//  │    ├── 失败 → 已发货状态不可取消   ✓
//  │    └── 失败 → 非本人订单        ✓
//  └── 退款
//       ├── 全额退款                ✓
//       └── 部分退款                ✓
```

---

## 3. 断言体系

### 3.1 基础断言

```java
class AssertionShowcase {

    @Test
    @DisplayName("JUnit 5 断言大全")
    void showcase() {

        // ─── 相等性 ───
        assertEquals(42, answer());
        assertEquals(3.14, pi(), 0.001);              // 带容差的浮点数
        assertNotEquals(42, 24);

        // ─── 布尔判断 ───
        assertTrue(isValid());
        assertFalse(isExpired());

        // ─── Null 判断 ───
        assertNull(findById(999L));
        assertNotNull(findById(1L));

        // ─── 同一性（引用相等） ───
        assertSame(expectedObject, actualObject);
        assertNotSame(differentObject, actualObject);

        // ─── 数组比较 ───
        assertArrayEquals(new int[]{1, 2, 3}, getNumbers());

        // ─── 可迭代对象 ───
        assertIterableEquals(List.of("a", "b"), getList());

        // ─── 行匹配（字符串） ───
        assertLinesMatch(
            List.of("Hello", ">> skip any line >>", "World"),
            List.of("Hello", "something", "World")
        );

        // ─── 异常断言 ───
        assertThrows(IllegalArgumentException.class, () -> {
            service.validate(null);
        });

        // ─── 超时断言 ───
        assertTimeout(Duration.ofSeconds(1), () -> {
            // 必须在 1 秒内执行完成
            service.process();
        });

        // ─── assertAll：批量断言（所有断言都会执行，不会短路） ───
        User user = userService.findById(1L);
        assertAll("User properties",
            () -> assertEquals("John", user.getName()),
            () -> assertEquals(25, user.getAge()),
            () -> assertTrue(user.isActive()),
            () -> assertNotNull(user.getEmail())
        );
    }
}
```

### 3.2 assertThrows 详解

```java
@Test
@DisplayName("assertThrows 的各种用法")
void testExceptionHandling() {

    // ─── 1. 基本用法 ───
    IllegalArgumentException ex = assertThrows(
        IllegalArgumentException.class,
        () -> service.transfer(null, 100)
    );
    assertEquals("账户不能为空", ex.getMessage());

    // ─── 2. 验证异常的 detail message ───
    BusinessException ex2 = assertThrows(
        BusinessException.class,
        () -> orderService.cancel(999L)
    );
    assertEquals("ORDER_NOT_FOUND", ex2.getErrorCode());
    assertEquals(404, ex2.getHttpStatus());

    // ─── 3. 验证异常不抛出 ───
    assertDoesNotThrow(() -> service.validate(validInput));

    // ─── 4. 检查异常中的嵌套原因 ───
    RuntimeException ex3 = assertThrows(RuntimeException.class,
        () -> service.doSomething()
    );
    assertTrue(ex3.getCause() instanceof IOException);
}
```

### 3.3 自定义断言（提高可读性）

```java
// 自定义断言方法：让测试读起来像自然语言
public class OrderAssertions {

    public static void assertOrder(Order order) {
        assertNotNull(order, "订单不应为空");
        assertNotNull(order.getId(), "订单 ID 不应为空");
        assertNotNull(order.getStatus(), "订单状态不应为空");
        assertTrue(order.getTotalAmount().compareTo(BigDecimal.ZERO) > 0,
                "订单金额应大于 0");
    }

    public static void assertOrderStatus(Order order, OrderStatus expected) {
        assertEquals(expected, order.getStatus(),
                () -> String.format("期望订单 %d 状态为 %s，实际为 %s",
                        order.getId(), expected, order.getStatus()));
    }

    public static void assertRefunded(Order order, BigDecimal refundAmount) {
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
        assertEquals(refundAmount, order.getRefundAmount());
    }
}

// 在测试中使用
@Test
@DisplayName("退款成功 → 订单状态变为已退款")
void refundSuccess() {
    Order order = orderService.refund(1L, new BigDecimal("100.00"));

    assertOrder(order);                         // 基础断言
    assertOrderStatus(order, OrderStatus.REFUNDED); // 状态断言
    assertRefunded(order, new BigDecimal("100.00")); // 退款断言
}
```

---

## 4. Mockito 核心用法

### 4.1 创建 Mock

```java
// ─── 方式一：注解（推荐） ───
@ExtendWith(MockitoExtension.class)  // ← 必须加这个
class UserServiceTest {

    @Mock
    private UserRepository userRepository;  // 自动创建 Mock

    @Mock
    private EmailService emailService;

    @InjectMocks  // 自动将上述 @Mock 注入到被测试对象中
    private UserService userService;

    @BeforeEach
    void setUp() {
        // 如果不用 @ExtendWith(MockitoExtension.class)，可以手动初始化：
        // MockitoAnnotations.openMocks(this);
    }
}

// ─── 方式二：手动创建 ───
UserRepository mockRepo = Mockito.mock(UserRepository.class);
EmailService mockEmail = Mockito.mock(EmailService.class);
UserService userService = new UserService(mockRepo, mockEmail);
```

### 4.2 Stubbing（打桩）：定义行为

```java
@Test
@DisplayName("Mockito Stubbing 示例")
void stubbingExamples() {

    // ─── 1. 返回固定值 ───
    when(userRepository.findById(1L))
        .thenReturn(Optional.of(new User(1L, "张三")));

    // ─── 2. 返回不同的值（连续调用） ───
    when(userRepository.count())
        .thenReturn(0L, 1L, 2L);  // 第1次返回0, 第2次返回1, 第3次返回2

    // ─── 3. 根据参数返回不同的值 ───
    when(userRepository.findById(anyLong())).thenAnswer(invocation -> {
        Long id = invocation.getArgument(0);
        return Optional.of(new User(id, "user-" + id));
    });

    // ─── 4. 抛出异常 ───
    when(userRepository.save(null))
        .thenThrow(new IllegalArgumentException("用户不能为空"));

    // ─── 5. 无返回值的方法（void） ───
    doNothing().when(emailService).sendWelcomeEmail(any(User.class));

    // 或者抛出异常
    doThrow(new RuntimeException("邮件服务不可用"))
        .when(emailService).sendWelcomeEmail(any(User.class));

    // ─── 6. 调用真实方法 ───
    when(userService.realMethod())
        .thenCallRealMethod();

    // ─── 7. 多次调用（第一种返回，后两种抛异常） ───
    when(paymentGateway.pay(any()))
        .thenReturn(new PaymentResult(true))       // 第1次
        .thenThrow(new PaymentFailedException())   // 第2次
        .thenThrow(new PaymentFailedException());  // 第3次
}
```

### 4.3 参数匹配器（Argument Matcher）

```java
@Test
@DisplayName("参数匹配器示例")
void argumentMatchers() {

    // ─── 基本匹配器 ───
    when(repository.findByName(anyString())).thenReturn(user);
    when(repository.findById(anyLong())).thenReturn(Optional.of(user));
    when(repository.save(any(User.class))).thenReturn(user);

    // ─── 精确匹配 ───
    when(repository.findByName(eq("张三"))).thenReturn(user);

    // ─── 集合匹配 ───
    when(repository.saveAll(anyList())).thenReturn(users);

    // ─── 字符串匹配 ───
    when(repository.findByName(startsWith("张"))).thenReturn(users);
    when(repository.findByName(contains("test"))).thenReturn(users);
    when(repository.findByEmail(matches(".*@example\\.com"))).thenReturn(user);

    // ─── Null / NotNull ───
    when(repository.findByName(isNull())).thenThrow(IllegalArgumentException.class);
    when(repository.findByName(notNull())).thenReturn(user);

    // ─── 自定义匹配器 ───
    when(repository.save(argThat(u -> u.getAge() >= 18 && u.getAge() <= 65)))
        .thenReturn(user);

    // ─── ⚠️ 注意事项：一旦使用 anyXxx()，所有参数都必须使用匹配器 ───
    // ❌ 错误：混合使用
    // when(service.transfer(1L, any(BigDecimal.class)));  // 编译不报错，运行时报错

    // ✅ 正确：全部使用匹配器
    // when(service.transfer(eq(1L), any(BigDecimal.class)));
}
```

---

## 5. 行为验证

### 5.1 verify：验证方法是否被调用

```java
@Test
@DisplayName("行为验证示例")
void verifyExamples() {

    // ─── 1. 验证调用了 1 次（默认） ───
    orderService.cancel(1L);
    verify(orderRepository).findById(1L);

    // ─── 2. 验证调用次数 ───
    verify(userRepository, times(1)).save(any(User.class));  // 精确 1 次
    verify(emailService, atLeastOnce()).sendEmail(any());    // 至少 1 次
    verify(emailService, atLeast(2)).sendEmail(any());       // 至少 2 次
    verify(emailService, atMostOnce()).sendEmail(any());     // 最多 1 次
    verify(emailService, atMost(5)).sendEmail(any());        // 最多 5 次
    verify(smsService, never()).sendSms(any());              // 从未调用

    // ─── 3. 验证调用顺序 ───
    InOrder inOrder = inOrder(orderRepository, emailService);
    inOrder.verify(orderRepository).findById(1L);    // 先查
    inOrder.verify(orderRepository).save(any());     // 再存
    inOrder.verify(emailService).sendEmail(any());   // 最后发邮件

    // ─── 4. 验证无其他交互 ───
    verify(orderRepository).findById(1L);
    verifyNoMoreInteractions(orderRepository);  // 确认除了 findById 没有其他调用

    // ─── 5. 超时验证（异步操作） ───
    verify(emailService, timeout(3000).atLeastOnce())
        .sendEmail(any(User.class));  // 等待 3 秒，验证至少被调用了 1 次
}
```

### 5.2 ArgumentCaptor：捕获参数

```java
@Test
@DisplayName("ArgumentCaptor：验证传入方法的参数")
void captureArguments() {

    // ─── 1. 基本用法 ───
    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

    userService.createUser("张三", "zhangsan@example.com", 25);

    // 捕获 save 方法被调用时传入的 User 对象
    verify(userRepository).save(userCaptor.capture());

    User capturedUser = userCaptor.getValue();
    assertEquals("张三", capturedUser.getName());
    assertEquals("zhangsan@example.com", capturedUser.getEmail());
    assertEquals(25, capturedUser.getAge());

    // ─── 2. 捕获多次调用的所有参数 ───
    ArgumentCaptor<Long> idCaptor = ArgumentCaptor.forClass(Long.class);

    userService.deleteUsers(List.of(1L, 2L, 3L));

    verify(userRepository, times(3)).deleteById(idCaptor.capture());

    List<Long> deletedIds = idCaptor.getAllValues();
    assertEquals(List.of(1L, 2L, 3L), deletedIds);

    // ─── 3. @Captor 注解（推荐） ───
    @Captor
    ArgumentCaptor<Order> orderCaptor;

    @Test
    void testWithCaptorAnnotation() {
        orderService.placeOrder(request);
        verify(orderRepository).save(orderCaptor.capture());

        Order order = orderCaptor.getValue();
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(request.getUserId(), order.getUserId());
    }
}
```

---

## 6. 常见测试场景

### 6.1 Service 层测试

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("用户服务测试")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Nested
    @DisplayName("创建用户")
    class CreateUser {

        @Test
        @DisplayName("成功 → 用户名和邮箱不重复")
        void shouldCreateUserSuccessfully() {
            // Given（准备）
            CreateUserRequest request = CreateUserRequest.builder()
                    .username("zhangsan")
                    .password("P@ssw0rd!")
                    .email("zhangsan@example.com")
                    .build();

            when(userRepository.existsByUsername("zhangsan")).thenReturn(false);
            when(userRepository.existsByEmail("zhangsan@example.com")).thenReturn(false);
            when(passwordEncoder.encode("P@ssw0rd!")).thenReturn("$2a$10$encrypted...");
            when(userRepository.save(any(User.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When（执行）
            User user = userService.createUser(request);

            // Then（验证）
            assertAll("创建的用户属性",
                () -> assertEquals("zhangsan", user.getUsername()),
                () -> assertEquals("zhangsan@example.com", user.getEmail()),
                () -> assertEquals("$2a$10$encrypted...", user.getPassword()),
                () -> assertTrue(user.isEnabled())
            );

            // 验证行为
            verify(passwordEncoder).encode("P@ssw0rd!");
            verify(userRepository).save(any(User.class));
            verify(emailService).sendWelcomeEmail(any(User.class));
        }

        @Test
        @DisplayName("失败 → 用户名已存在")
        void shouldFailWhenUsernameExists() {
            CreateUserRequest request = CreateUserRequest.builder()
                    .username("existing_user")
                    .password("password123")
                    .email("new@example.com")
                    .build();

            when(userRepository.existsByUsername("existing_user")).thenReturn(true);

            BusinessException ex = assertThrows(
                BusinessException.class,
                () -> userService.createUser(request)
            );

            assertEquals("用户名已存在", ex.getMessage());
            assertEquals("USERNAME_DUPLICATE", ex.getErrorCode());

            // 验证 save 从未被调用（因为前面就抛异常了）
            verify(userRepository, never()).save(any(User.class));
            verify(emailService, never()).sendWelcomeEmail(any(User.class));
        }

        @Test
        @DisplayName("失败 → 密码强度不够")
        void shouldFailWhenPasswordTooWeak() {
            CreateUserRequest request = CreateUserRequest.builder()
                    .username("newuser")
                    .password("123")  // 太短
                    .build();

            assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(request)
            );
        }
    }
}
```

### 6.2 Controller 层测试

```java
@WebMvcTest(UserController.class)
@DisplayName("用户控制器测试")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean  // Spring Boot 的 Mock Bean（不同于 Mockito 的 @Mock）
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/users/1 → 返回用户信息")
    void shouldReturnUser() throws Exception {
        User user = User.builder()
                .id(1L)
                .username("zhangsan")
                .email("zhangsan@example.com")
                .build();

        when(userService.findById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/{id}", 1L)
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.username").value("zhangsan"))
            .andExpect(jsonPath("$.data.email").value("zhangsan@example.com"));
    }

    @Test
    @DisplayName("POST /api/users → 创建用户成功")
    void shouldCreateUser() throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .username("newuser")
                .password("Password@123")
                .email("new@example.com")
                .build();

        User user = User.builder().id(1L).username("newuser").build();
        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(user);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    @DisplayName("POST /api/users → 参数校验失败")
    void shouldFailValidation() throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .username("")      // 空白 → @NotBlank 校验
                .password("123")   // 太短 → @Size(min=8) 校验
                .build();

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isArray())
            .andExpect(jsonPath("$.errors.length()").value(2));
    }
}
```

---

## 7. 可测试代码的设计原则

### 7.1 原则一：依赖注入

```java
// ❌ 难以测试：硬编码依赖
public class OrderService {
    public void placeOrder(OrderRequest request) {
        // 直接 new → 无法 Mock
        PaymentGateway gateway = new PayPalGateway(config);
        NotificationSender sender = new EmailSender(config);

        gateway.pay(request.getAmount());
        sender.send("订单已创建");
    }
}

// ✅ 易于测试：依赖注入
public class OrderService {
    private final PaymentGateway paymentGateway;
    private final NotificationSender notificationSender;

    // 构造器注入 → Mock 可以轻松替换
    public OrderService(PaymentGateway paymentGateway,
                        NotificationSender notificationSender) {
        this.paymentGateway = paymentGateway;
        this.notificationSender = notificationSender;
    }

    public void placeOrder(OrderRequest request) {
        paymentGateway.pay(request.getAmount());
        notificationSender.send("订单已创建");
    }
}
```

### 7.2 原则二：避免静态方法

```java
// ❌ 难以测试：静态方法无法 Mock（除非用 PowerMock/Mockito 5+）
public class PriceCalculator {
    public BigDecimal calculate(Order order) {
        // 静态方法调用 → 无法控制返回值
        BigDecimal exchangeRate = CurrencyUtil.getExchangeRate("USD", "CNY");
        return order.getAmount().multiply(exchangeRate);
    }
}

// ✅ 易于测试：将外部依赖注入
public class PriceCalculator {
    private final ExchangeRateService exchangeRateService;

    public PriceCalculator(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    public BigDecimal calculate(Order order) {
        // 实例方法调用 → 可以 Mock
        BigDecimal exchangeRate = exchangeRateService.getRate("USD", "CNY");
        return order.getAmount().multiply(exchangeRate);
    }
}
```

### 7.3 原则三：避免直接操作时间

```java
// ❌ 难以测试：时间依赖导致测试不稳定
public class CouponService {
    public boolean isValid(Coupon coupon) {
        return coupon.getExpireTime().isAfter(LocalDateTime.now());
        // ↑ 测试结果依赖当前时间，每天可能不同！
    }
}

// ✅ 易于测试：时间源可注入
public class CouponService {
    private final Clock clock;

    public CouponService(Clock clock) {
        this.clock = clock;
    }

    public boolean isValid(Coupon coupon) {
        return coupon.getExpireTime().isAfter(LocalDateTime.now(clock));
    }
}

// 测试中：
@Test
void testExpiredCoupon() {
    // 固定时间为 2024-12-25
    Clock fixedClock = Clock.fixed(
        Instant.parse("2024-12-25T10:00:00Z"), ZoneId.systemDefault());

    CouponService service = new CouponService(fixedClock);
    Coupon coupon = new Coupon();
    coupon.setExpireTime(LocalDateTime.of(2024, 12, 24, 0, 0));  // 昨天

    assertFalse(service.isValid(coupon));  // ← 结果稳定、可预测
}
```

### 7.4 原则四：小而专注的方法

```java
// ❌ 难以测试：大方法包含多种职责
public Order processOrder(OrderRequest request) {
    // 100 行代码：验证、计算价格、检查库存、创建订单、扣款、发通知...
}

// ✅ 易于测试：拆分为小方法
public Order processOrder(OrderRequest request) {
    validateOrder(request);
    BigDecimal totalPrice = calculateTotalPrice(request);
    checkInventory(request.getItems());
    Order order = createOrder(request, totalPrice);
    paymentService.charge(order.getId(), totalPrice);
    notificationService.notify(order);
    return order;
}
// 每个小方法可以独立测试
```

---

## 8. 代码覆盖率：JaCoCo 配置与解读

### 8.1 Maven 配置

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <!-- 准备 JaCoCo Agent -->
        <execution>
            <id>prepare-agent</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <!-- 生成报告 -->
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- 覆盖率检查 -->
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <!-- 行覆盖率 ≥ 80% -->
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <!-- 分支覆盖率 ≥ 70% -->
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.70</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
                <!-- 排除不需要检查的类 -->
                <excludes>
                    <exclude>**/config/**</exclude>
                    <exclude>**/dto/**</exclude>
                    <exclude>**/entity/**</exclude>
                </excludes>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 8.2 JaCoCo 报告解读

```
┌─────────────────────────────────────────────────────────────┐
│  JaCoCo 覆盖率报告解读                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  指令覆盖率（Instructions）：最细粒度，衡量字节码级别              │
│  分支覆盖率（Branches）：if/else、switch 等分支覆盖率             │
│  行覆盖率（Lines）：源代码行级别覆盖（最常用）                     │
│  方法覆盖率（Methods）：方法级别覆盖                             │
│  类覆盖率（Classes）：类级别覆盖                                │
│                                                             │
│  一般关注：行覆盖率 + 分支覆盖率                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 覆盖率陷阱

```
⚠️ 高覆盖率 ≠ 高质量测试！

反例：
@Test
void testEverything() {
    User user = new User();
    user.setName("test");
    assertEquals("test", user.getName());

    Order order = orderService.createOrder(request);
    assertNotNull(order);

    // 这个测试拿到了 90% 的行覆盖率，但：
    // - 没有验证边界情况
    // - 没有验证异常路径
    // - 没有验证业务逻辑的正确性
    // → 纯粹为了覆盖率而写的"僵尸测试"
}

✅ 正确的思路：
  1. 先关注核心业务逻辑的测试质量
  2. 再关注覆盖率数值
  3. 对未覆盖的分支逐一分析（是真的不需要测，还是遗漏了？）
  4. 不要把覆盖率作为 KPI
```

---

## 总结

### 从一个测试新手到写出好测试的关键转变

```
┌────────────────────────────────────────────────────────────┐
│              测试能力成长路径                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  阶段 1：知道工具怎么用                                       │
│      JUnit 5 注解、Mockito Mock、断言方法                      │
│                                                            │
│  阶段 2：知道写什么测试                                       │
│      正常路径、异常路径、边界条件、并发场景                        │
│                                                            │
│  阶段 3：知道怎么写可测试的代码                                 │
│      依赖注入、小而专注的方法、时间源可注入                         │
│                                                            │
│  阶段 4：把测试当作设计工具                                    │
│      先写测试 → 驱动设计 → 更好的代码结构（TDD）                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 核心建议

1. **不要追求 100% 覆盖率**，追求 80% 有意义覆盖 + 核心逻辑 100% 覆盖
2. **测试要读起来像文档**，用 `@DisplayName` 描述业务场景
3. **测试要快**，单测应该在毫秒级完成（这样开发者才愿意频繁运行）
4. **测试要稳定**，不依赖外部服务、不依赖当前时间、不依赖执行顺序
5. **先写最重要的测试**，从你"最担心出 Bug 的地方"开始