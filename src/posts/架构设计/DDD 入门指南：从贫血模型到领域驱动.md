---
title: DDD 入门指南：从贫血模型到领域驱动
date: 2026-06-11
category: 架构设计
tag: ["DDD", "领域驱动设计", "架构", "Spring Boot"]
---

# DDD 入门指南：从贫血模型到领域驱动

> DDD 入门指南：从贫血模型到领域驱动是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。
> 本文介绍了DDD 入门指南：从贫血模型到领域驱动的设计原则和实践经验，帮助你提升架构设计能力。

假设我们正在开发一个担保业务系统，有一个"客户申请授信额度"的功能。按照传统的三层架构，代码大致是这样的：

```java
// Controller 层
@RestController
@RequestMapping("/api/credit")
public class CreditController {

    @Autowired
    private CreditService creditService;

    @PostMapping("/apply")
    public Result<CreditApplyResponse> apply(@RequestBody CreditApplyRequest request) {
        return Result.success(creditService.apply(request));
    }
}

// Service 层
@Service
public class CreditService {

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private CreditRecordMapper creditRecordMapper;

    @Autowired
    private RiskEngineClient riskEngineClient;

    @Transactional
    public CreditApplyResponse apply(CreditApplyRequest request) {
        // 1. 查询客户信息
        CustomerDO customer = customerMapper.selectById(request.getCustomerId());
        if (customer == null) {
            throw new BusinessException("客户不存在");
        }

        // 2. 校验客户状态
        if (!"ACTIVE".equals(customer.getStatus())) {
            throw new BusinessException("客户状态异常，无法申请授信");
        }

        // 3. 校验是否已有有效授信
        CreditRecordDO existingCredit = creditRecordMapper
            .selectByCustomerId(request.getCustomerId());
        if (existingCredit != null && "VALID".equals(existingCredit.getStatus())) {
            throw new BusinessException("已存在有效授信，无需重复申请");
        }

        // 4. 调用风控引擎
        RiskResult riskResult = riskEngineClient.evaluate(buildRiskRequest(customer));
        if (!riskResult.isPassed()) {
            CreditRecordDO failedRecord = new CreditRecordDO();
            failedRecord.setCustomerId(request.getCustomerId());
            failedRecord.setStatus("REJECTED");
            failedRecord.setRejectReason(riskResult.getReason());
            failedRecord.setCreateTime(new Date());
            creditRecordMapper.insert(failedRecord);
            return CreditApplyResponse.rejected(riskResult.getReason());
        }

        // 5. 计算授信额度
        BigDecimal creditAmount = calculateCreditAmount(customer, riskResult);

        // 6. 保存授信记录
        CreditRecordDO record = new CreditRecordDO();
        record.setCustomerId(request.getCustomerId());
        record.setCreditAmount(creditAmount);
        record.setStatus("VALID");
        record.setEffectiveDate(new Date());
        record.setExpireDate(calculateExpireDate());
        record.setCreateTime(new Date());
        creditRecordMapper.insert(record);

        return CreditApplyResponse.success(creditAmount);
    }

    private BigDecimal calculateCreditAmount(CustomerDO customer, RiskResult riskResult) {
        BigDecimal baseAmount = customer.getAnnualIncome()
            .multiply(new BigDecimal("0.5"));
        BigDecimal adjustedAmount = baseAmount
            .multiply(riskResult.getCreditMultiplier());
        return adjustedAmount.min(new BigDecimal("500000"));
    }
}

// 数据对象（贫血模型）
@Data
@TableName("t_customer")
public class CustomerDO {
    private Long id;
    private String name;
    private String idCard;
    private String phone;
    private String status;
    private BigDecimal annualIncome;
    private String companyName;
    private Date createTime;
    private Date updateTime;
}

@Data
@TableName("t_credit_record")
public class CreditRecordDO {
    private Long id;
    private Long customerId;
    private BigDecimal creditAmount;
    private String status;
    private String rejectReason;
    private Date effectiveDate;
    private Date expireDate;
    private Date createTime;
}
```

### 1.2 贫血模型的定义与特征

"贫血模型"（Anemic Domain Model）这个术语最早由 Martin Fowler 提出，指的是**数据对象只包含数据字段和 getter/setter 方法，而没有任何业务行为**。所有的业务逻辑都存在于 Service 层（或叫 Manager/Handler 层）。

贫血模型的特征：

- **数据与行为分离**：数据对象（DO/DTO/VO）只有 getter/setter，业务逻辑在 Service 中
- **Service 层臃肿**：随着功能增加，Service 类越来越大，动辄上千行
- **业务规则散落**：相同的校验逻辑可能在多个 Service 中重复出现
- **难以测试**：Service 测试需要 Mock 大量依赖（Mapper、RPC Client、Redis 等）

### 1.3 贫血模型在真实项目中的痛点

#### 痛点一：业务规则重复

以"客户状态校验"为例，在担保系统中，"客户必须处于 ACTIVE 状态"这个规则可能出现在：

- 授信申请（CreditService）
- 担保申请（GuaranteeService）
- 签约流程（ContractService）
- 放款审批（LoanService）

如果未来业务规则变成"客户状态为 ACTIVE 或 FROZEN_TEMP"，你需要修改所有分散在各处的校验代码——**遗漏任何一处都可能导致线上 BUG**。

```java
// CreditService.java
if (!"ACTIVE".equals(customer.getStatus()) && !"FROZEN_TEMP".equals(customer.getStatus())) {
    throw new BusinessException("客户状态异常");
}

// GuaranteeService.java  
if (!"ACTIVE".equals(customer.getStatus())) {
    // 啊！这里忘记加 FROZEN_TEMP 的判定了！
    throw new BusinessException("客户状态异常");
}
// 线上 BUG：FROZEN_TEMP 状态客户无法在担保服务中操作
```

#### 痛点二：Service 层臃肿

一个典型的 Spring Boot 项目，运行半年后，核心 Service 类很容易膨胀到 500-1000 行：

```java
@Service
public class GuaranteeService {
    // 申请担保
    public GuaranteeResponse apply(GuaranteeApplyRequest req) { /* 200 行 */ }
    // 审批
    public void approve(Long guaranteeId, ApproveRequest req) { /* 150 行 */ }
    // 签约
    public ContractInfo sign(Long guaranteeId) { /* 100 行 */ }
    // 放款
    public void disburse(Long guaranteeId) { /* 180 行 */ }
    // 还款跟踪
    public void trackRepayment(Long guaranteeId) { /* 120 行 */ }
    // 逾期处理
    public void handleOverdue(Long guaranteeId) { /* 150 行 */ }
    // ... 还有更多方法
}
```

#### 痛点三：数据库驱动的开发思维

贫血模型最大的问题是**开发者从数据库表结构出发来设计代码**，而不是从业务领域出发：

```
开发流程: 需求分析 → 设计数据库表 → 生成 DO 类 → 写 Mapper → 写 Service
```

这种思维模式导致：
- 代码结构与业务概念脱节，新成员难以理解业务
- 表结构的微小调整引发大面积的代码修改
- 业务逻辑被数据库模型绑架，难以表达复杂领域概念

## 第二部分：DDD 核心概念

### 2.1 DDD 的战略设计与战术设计

DDD 分为两个层面：

**战略设计**（Strategic Design）关注宏观层面：
- **限界上下文**（Bounded Context）：划分领域边界
- **上下文映射**（Context Map）：描述限界上下文之间的关系
- **通用语言**（Ubiquitous Language）：团队统一的业务语言

**战术设计**（Tactical Design）关注微观层面：
- **实体**（Entity）
- **值对象**（Value Object）
- **聚合**（Aggregate）
- **领域服务**（Domain Service）
- **仓储**（Repository）
- **领域事件**（Domain Event）
- **工厂**（Factory）

### 2.2 实体（Entity）—— 有身份的对象

实体是领域中具有唯一标识的对象。它的标识在其整个生命周期中保持不变，即使其他属性发生了变化。

**判断一个对象是不是实体**：问自己——"这个对象的属性变了，它还是不是它自己？"

- 一个客户改了手机号，他还是那个客户 → **客户是实体**
- 一个订单改了收件地址，它还是那个订单 → **订单是实体**
- 一个担保合同改了担保金额，它还是那个合同 → **担保合同是实体**

```java
/**
 * 客户实体 - 具有唯一标识（customerId），属性可变但标识不变
 */
public class Customer {
    // 标识 - 唯一不变
    private CustomerId id;

    // 可变属性
    private String name;
    private PhoneNumber phone;
    private CustomerStatus status;
    private AnnualIncome annualIncome;
    private CompanyInfo company;

    // 构造方法
    public Customer(CustomerId id, String name, PhoneNumber phone,
                    AnnualIncome annualIncome) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.status = CustomerStatus.ACTIVE;
        this.annualIncome = annualIncome;
    }

    // 业务行为 - 实体包含业务方法，而非仅 getter/setter
    public void freeze() {
        if (this.status == CustomerStatus.BLACKLISTED) {
            throw new DomainException("黑名单客户不允许冻结");
        }
        this.status = CustomerStatus.FROZEN;
    }

    public void unfreeze() {
        if (this.status != CustomerStatus.FROZEN) {
            throw new DomainException("只有冻结状态的客户才能解冻");
        }
        this.status = CustomerStatus.ACTIVE;
    }

    public void updatePhone(PhoneNumber newPhone) {
        // 业务规则：修改手机号需要验证
        if (this.phone.equals(newPhone)) {
            throw new DomainException("新手机号不能与当前手机号相同");
        }
        this.phone = newPhone;
    }

    // 标识比较 - 实体通过标识来判断是否相等
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Customer)) return false;
        Customer customer = (Customer) o;
        return id.equals(customer.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
```

### 2.3 值对象（Value Object）—— 无身份、不可变

值对象是没有唯一标识，通过属性值来定义的对象。值对象通常是**不可变的**（Immutable）。

**判断一个对象是不是值对象**：问自己——"我在乎它'是哪一个'，还是在乎它'是什么'？"

- 你在乎的是"100 元"这个金额本身，而不是"编号 12345 的那张 100 元钞票" → **金额是值对象**
- 你在乎的是"13800138000"这个号码本身，不关心它是谁的号码 → **电话号码是值对象**
- 你在乎的是"北京市朝阳区"这个地址，不关心哪一次填写的 → **地址是值对象**

```java
/**
 * 金额值对象 - 不可变，无标识
 */
public class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        if (amount == null) {
            throw new IllegalArgumentException("金额不能为空");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负数");
        }
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        this.currency = currency;
    }

    // 工厂方法
    public static Money rmb(String amount) {
        return new Money(new BigDecimal(amount), Currency.RMB);
    }

    public static Money rmb(BigDecimal amount) {
        return new Money(amount, Currency.RMB);
    }

    // 业务操作 - 返回新的值对象，保持不可变性
    public Money add(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.subtract(other.amount), this.currency);
    }

    public Money multiply(BigDecimal factor) {
        return new Money(this.amount.multiply(factor), this.currency);
    }

    public boolean greaterThan(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) > 0;
    }

    // 值对象通过属性值来比较相等性
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0
            && currency == money.currency;
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }

    private void assertSameCurrency(Money other) {
        if (this.currency != other.currency) {
            throw new DomainException("币种不一致");
        }
    }

    // Getters ...
}

// 币种枚举值对象
public enum Currency {
    RMB("CNY", "人民币"),
    USD("USD", "美元");
    // ...
}

/**
 * 客户状态值对象
 */
public enum CustomerStatus {
    ACTIVE("正常"),
    FROZEN("冻结"),
    BLACKLISTED("黑名单"),
    CANCELLED("已注销");
    // ...
}
```

**值对象 vs 实体的区别总结**：

| 特性 | 实体 (Entity) | 值对象 (Value Object) |
|------|--------------|---------------------|
| 唯一标识 | 有（如 ID） | 无 |
| 可变性 | 可变 | 不可变 |
| 相等性 | 基于标识判断 | 基于所有属性值判断 |
| 生命周期 | 有独立生命周期 | 依附于实体存在 |
| 持久化 | 独立表存储 | 通常嵌入实体表中 |

### 2.4 聚合（Aggregate）—— 一致性边界

聚合是一组相关对象的集合，它定义了**数据修改的原子单元**。每个聚合有一个**聚合根**（Aggregate Root），外部只能通过聚合根来访问聚合内部的对象。

**聚合的核心价值**：确保业务规则的一致性，让不变量（Invariants）得到保护。

**识别聚合的原则**：
1. **真正的不变量**：哪些业务规则必须在任何时候都成立？
2. **尽量设计小聚合**：能小则小，不要"大聚合"
3. **通过 ID 引用其他聚合**：不要直接持有其他聚合根的引用

```java
/**
 * 授信额度聚合
 * 聚合根：CreditLine
 * 
 * 不变量：
 *   1. 一个客户在同一时刻只能有一条有效的授信
 *   2. 已使用额度不能超过总额度
 *   3. 额度变更必须有审批记录
 */
public class CreditLine {

    // 聚合根标识
    private CreditLineId id;

    // 通过 ID 引用其他聚合
    private CustomerId customerId;

    // 聚合内部属性
    private Money totalAmount;         // 总额度
    private Money usedAmount;          // 已使用额度
    private CreditLineStatus status;
    private DateRange effectivePeriod;

    // 聚合内部实体：额度变更记录（从属于聚合，无全局标识）
    private List<CreditChangeLog> changeLogs;

    /**
     * 占用额度 - 聚合根保证业务不变量
     */
    public void reserveAmount(Money amount) {
        assertActive();
        assertWithinPeriod();

        Money newUsed = this.usedAmount.add(amount);
        if (newUsed.greaterThan(this.totalAmount)) {
            throw new DomainException(
                String.format("额度不足：需要 %s，可用 %s",
                    amount, this.getAvailableAmount()));
        }

        this.usedAmount = newUsed;
        addChangeLog("RESERVE", amount, "额度占用");
    }

    /**
     * 释放额度
     */
    public void releaseAmount(Money amount) {
        assertActive();

        if (amount.greaterThan(this.usedAmount)) {
            throw new DomainException("释放额度不能超过已使用额度");
        }

        this.usedAmount = this.usedAmount.subtract(amount);
        addChangeLog("RELEASE", amount, "额度释放");
    }

    /**
     * 调整总额度
     */
    public void adjustTotalAmount(Money newAmount, String reason) {
        assertActive();

        Money oldAmount = this.totalAmount;
        this.totalAmount = newAmount;
        addChangeLog("ADJUST", newAmount.subtract(oldAmount), reason);
    }

    public Money getAvailableAmount() {
        return this.totalAmount.subtract(this.usedAmount);
    }

    private void assertActive() {
        if (this.status != CreditLineStatus.ACTIVE) {
            throw new DomainException("授信已失效，当前状态：" + this.status);
        }
    }

    private void assertWithinPeriod() {
        if (!this.effectivePeriod.contains(LocalDate.now())) {
            throw new DomainException("授信不在有效期内");
        }
    }

    private void addChangeLog(String operationType, Money amount, String reason) {
        CreditChangeLog log = new CreditChangeLog(
            this.id, operationType, amount, reason, LocalDateTime.now());
        this.changeLogs.add(log);
    }
}
```

**聚合设计的重要原则**：

1. **小聚合优于大聚合**：一个聚合通常包含1个聚合根和少量内部实体

2. **通过 ID 引用，而不是对象引用**（避免聚合过大）：

```java
// ✅ 正确：通过 ID 引用
public class GuaranteeApplication {
    private GuaranteeId id;
    private CustomerId customerId;      // ID 引用
    private CreditLineId creditLineId;  // ID 引用
}

// ❌ 错误：直接持有其他聚合的对象引用
public class GuaranteeApplication {
    private GuaranteeId id;
    private Customer customer;           // 对象引用 - 会导致聚合过大
    private CreditLine creditLine;       // 对象引用
}
```

3. **最终一致性**：聚合之间使用最终一致性，通过领域事件实现。同一个聚合内部保证强一致性。

### 2.5 限界上下文（Bounded Context）—— 语义边界

限界上下文是 DDD 战略设计的核心概念。它定义了**一个特定的模型在什么样的上下文中适用**。

**同一个"客户"在不同上下文中含义不同**：

```java
// 认证上下文中，客户的核心是"身份验证"
// 包：com.company.auth.domain
public class Customer {
    private CustomerId id;
    private String username;
    private String passwordHash;
    private List<Role> roles;
    private LoginAttempt loginAttempt;
}

// 担保业务上下文中，客户的核心是"风险评估"
// 包：com.company.guarantee.domain
public class Customer {
    private CustomerId id;
    private CreditRating creditRating;
    private AnnualIncome annualIncome;
    private List<GuaranteeRecord> guaranteeHistory;
}

// 营销上下文中，客户的核心是"行为偏好"
// 包：com.company.marketing.domain
public class Customer {
    private CustomerId id;
    private List<ProductPreference> preferences;
    private ChannelPreference channelPreference;
    private MarketingSegment segment;
}
```

**如何识别限界上下文**：
1. **业务能力分析**：识别企业有哪些核心业务能力
2. **语言边界**：同一个词在不同场景下有不同含义的地方，就是边界
3. **组织架构**：不同的团队通常对应不同的限界上下文
4. **数据主权**：谁负责维护数据的一致性，谁就是该数据的"主权上下文"

## 第三部分：领域服务 vs 应用服务 vs 基础设施

### 3.1 三层服务的职责定义

DDD 中对"服务"做了明确的分类：

```
┌──────────────────────────────────────────────┐
│              用户界面层 (UI)                    │
│              Controller / API                  │
├──────────────────────────────────────────────┤
│              应用服务层 (Application)            │
│    - 协调领域对象完成用例                        │
│    - 事务管理                                   │
│    - 权限校验                                   │
│    - 不包含业务逻辑！                            │
├────────────┬─────────────────────────────────┤
│ 领域服务层  │         领域模型层                │
│(Domain    │   - 实体 (Entity)                │
│ Service)  │   - 值对象 (Value Object)        │
│           │   - 聚合 (Aggregate)              │
│           │   - 领域事件 (Domain Event)       │
├────────────┴─────────────────────────────────┤
│              基础设施层 (Infrastructure)         │
│    - 仓储实现 (MyBatis/JPA Repository)         │
│    - 消息发送                                  │
│    - 外部服务调用                              │
└──────────────────────────────────────────────┘
```

### 3.2 领域服务（Domain Service）

当某个业务操作**不属于任何一个实体或值对象时**，放入领域服务。

领域服务的特征：
- **无状态**（通常）
- **表达领域概念**
- **可以操作多个聚合**
- **不包含技术细节**

```java
/**
 * 领域服务：授信评估
 * 这个操作涉及多个领域概念（客户、风控规则、额度计算），
 * 不属于任何一个实体，所以放在领域服务中
 */
@DomainService
public class CreditEvaluationService {

    public CreditEvaluationResult evaluate(
            Customer customer,
            List<CreditRule> rules,
            CreditPolicy policy) {

        // 1. 基础额度计算
        Money baseAmount = calculateBaseAmount(customer);

        // 2. 应用风控规则进行调整
        Money adjustedAmount = baseAmount;
        for (CreditRule rule : rules) {
            if (rule.isApplicable(customer)) {
                adjustedAmount = rule.apply(adjustedAmount, customer);
            }
        }

        // 3. 应用策略限制
        Money finalAmount = policy.cap(adjustedAmount);

        // 4. 评估风险等级
        RiskLevel riskLevel = evaluateRiskLevel(customer, rules);

        return new CreditEvaluationResult(finalAmount, riskLevel);
    }

    private Money calculateBaseAmount(Customer customer) {
        return customer.getAnnualIncome()
            .multiply(new BigDecimal("0.5"))
            .toMoney();
    }

    private RiskLevel evaluateRiskLevel(
            Customer customer, List<CreditRule> rules) {
        int riskScore = rules.stream()
            .mapToInt(rule -> rule.calculateRiskScore(customer))
            .sum();
        return RiskLevel.fromScore(riskScore);
    }
}
```

**什么时候用领域服务？**

| 场景 | 放在哪里？ |
|------|----------|
| 客户修改手机号 | 客户实体的方法 |
| 订单添加商品项 | 订单聚合的方法 |
| 计算授信额度（涉及客户+规则+策略） | **领域服务** |
| 判断两个客户是否有关联关系 | **领域服务** |
| 风控评分计算（多维度规则） | **领域服务** |

### 3.3 应用服务（Application Service）

应用服务是领域层的"大门"。它协调领域对象来完成具体的用例，但**不包含任何业务逻辑**。

```java
/**
 * 应用服务：授信申请用例
 * 职责：协调领域对象，管理事务，不包含业务逻辑
 */
@Service
public class CreditApplicationService {

    private final CustomerRepository customerRepository;
    private final CreditLineRepository creditLineRepository;
    private final CreditEvaluationService evaluationService;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public CreditApplyResult applyForCredit(CreditApplyCommand command) {
        // 1. 加载领域对象（通过仓储）
        Customer customer = customerRepository.findById(
            new CustomerId(command.getCustomerId()))
            .orElseThrow(() -> new DomainException("客户不存在"));

        // 2. 检查是否已有有效授信
        creditLineRepository.findActiveByCustomerId(customer.getId())
            .ifPresent(cl -> {
                throw new DomainException(
                    "已存在有效授信，授信编号：" + cl.getId());
            });

        // 3. 调用领域服务进行额度评估
        CreditPolicy policy = CreditPolicy.current();
        List<CreditRule> rules = loadApplicableRules(customer);
        CreditEvaluationResult evalResult =
            evaluationService.evaluate(customer, rules, policy);

        // 4. 创建授信聚合（业务不变量在构造方法中保证）
        CreditLine creditLine = new CreditLine(
            customer.getId(),
            evalResult.getAmount(),
            DateRange.oneYearFromNow()
        );

        // 5. 持久化
        creditLineRepository.save(creditLine);

        // 6. 发布领域事件
        eventPublisher.publish(new CreditLineCreatedEvent(
            creditLine.getId(), customer.getId(),
            evalResult.getAmount(), evalResult.getRiskLevel()
        ));

        return CreditApplyResult.success(
            creditLine.getId(), evalResult.getAmount());
    }
}
```

**应用服务 vs 领域服务的快速判断**：

```java
// ❌ 错误：应用服务里包含业务逻辑
@Service
public class OrderApplicationService {
    public void cancel(Long orderId) {
        Order order = orderRepo.findById(orderId).get();
        // 这是业务逻辑！应该放在 Order 聚合中
        if (order.getStatus() == OrderStatus.SHIPPED) {
            throw new BusinessException("已发货，不可取消");
        }
        order.setStatus(OrderStatus.CANCELLED);
        orderRepo.save(order);
    }
}

// ✅ 正确：业务逻辑在聚合中
public class Order {
    public void cancel() {
        if (this.status == OrderStatus.SHIPPED) {
            throw new DomainException("已发货，不可取消");
        }
        if (this.status == OrderStatus.CANCELLED) {
            throw new DomainException("订单已取消");
        }
        this.status = OrderStatus.CANCELLED;
        registerEvent(new OrderCancelledEvent(this.id));
    }
}

// ✅ 应用服务只做协调
@Service
public class OrderApplicationService {
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepo.findById(new OrderId(orderId))
            .orElseThrow(() -> new OrderNotFoundException(orderId));
        order.cancel();  // 业务逻辑在聚合中
        orderRepo.save(order);
        eventPublisher.publishAll(order.getDomainEvents());
    }
}
```

### 3.4 基础设施层（Infrastructure）

基础设施层为上层提供技术支撑：

```java
// 仓储接口 - 定义在领域层
public interface CustomerRepository {
    Optional<Customer> findById(CustomerId id);
    List<Customer> findByStatus(CustomerStatus status);
    void save(Customer customer);
}

// 仓储实现 - 在基础设施层，使用 MyBatis-Plus
@Repository
public class MyBatisCustomerRepository implements CustomerRepository {

    private final CustomerMapper customerMapper;
    private final CustomerConverter converter;

    @Override
    public Optional<Customer> findById(CustomerId id) {
        CustomerDO customerDO = customerMapper.selectById(id.getValue());
        if (customerDO == null) return Optional.empty();
        return Optional.of(converter.toDomain(customerDO));
    }

    @Override
    public void save(Customer customer) {
        CustomerDO customerDO = converter.toDataObject(customer);
        if (customerMapper.selectById(customerDO.getId()) != null) {
            customerMapper.updateById(customerDO);
        } else {
            customerMapper.insert(customerDO);
        }
    }
}
```

**依赖倒置**：领域层定义接口，基础设施层提供实现。领域层不依赖任何技术框架。

## 第四部分：仓储（Repository）模式

### 4.1 仓储的本质

仓储是领域模型与持久化机制之间的"中介"。它**模拟了一个内存中的集合**：

```
领域代码视角：
  repository.save(aggregate)     ← 像往 List 里 add
  repository.findById(id)         ← 像从 Map 里 get
  repository.delete(id)           ← 像从 List 里 remove

实际执行：
  转换为 SQL INSERT/UPDATE/SELECT/DELETE
```

### 4.2 仓储的设计原则

**原则 1：每个聚合根一个仓储**

```java
// ✅ 正确：为每个聚合根定义仓储
public interface CustomerRepository { ... }
public interface CreditLineRepository { ... }
public interface GuaranteeRepository { ... }

// ❌ 错误：为聚合内部的实体定义仓储
public interface CreditChangeLogRepository { ... } // 它从属于 CreditLine
```

**原则 2：仓储只处理聚合的完整加载和保存**

```java
public interface GuaranteeRepository {
    Optional<GuaranteeApplication> findById(GuaranteeId id);      // ✅ 完整聚合
    void save(GuaranteeApplication application);                  // ✅ 完整聚合
    List<GuaranteeApplication> findByCustomerId(CustomerId cid); // ✅ 返回聚合

    // ❌ 错误：只更新部分字段 - 破坏了聚合的完整性
    void updateStatus(GuaranteeId id, String status);
}
```

**原则 3：仓储接口定义在领域层，实现在基础设施层**

```java
// 领域层：com.company.guarantee.domain.repository
public interface GuaranteeRepository {
    Optional<GuaranteeApplication> findById(GuaranteeId id);
    void save(GuaranteeApplication application);
    GuaranteeId nextId();
}

// 基础设施层：com.company.guarantee.infrastructure.persistence
@Repository
public class GuaranteeRepositoryImpl implements GuaranteeRepository {
    // 使用 MyBatis 实现，内部处理 DO ↔ Domain 转换
}
```

### 4.3 避免泄漏技术细节

```java
// ❌ 错误：暴露了 MyBatis-Plus 的 QueryWrapper
public interface CustomerRepository {
    List<Customer> findList(QueryWrapper<CustomerDO> wrapper);
}

// ✅ 正确：使用领域语言定义查询
public interface CustomerRepository {
    List<Customer> findByStatus(CustomerStatus status);
    List<Customer> findByNameLike(String keyword);
    PageResult<Customer> findByCondition(CustomerQueryCondition cond, Pageable pageable);
}
```

## 第五部分：实战——用 DDD 重构订单系统

### 5.1 项目背景

担保业务中的订单系统，管理担保申请单的全生命周期：

**业务流程**：提交申请 → 风控审核 → 审批通过 → 签署合同 → 生效管理 → 到期关闭

### 5.2 重构前：贫血模型代码

```java
@Data
@TableName("t_guarantee_order")
public class GuaranteeOrderDO {
    private Long id;
    private Long customerId;
    private String orderNo;
    private BigDecimal guaranteeAmount;
    private String currency;
    private Integer durationMonths;
    private String status;  // DRAFT, RISK_REVIEW, APPROVED, SIGNED, ACTIVE, CLOSED
    // ... 一堆 Date 字段
}

@Service
public class GuaranteeOrderService {
    @Autowired private GuaranteeOrderMapper orderMapper;
    @Autowired private RiskEngineClient riskEngineClient;

    @Transactional
    public void submitRiskReview(Long orderId) {
        GuaranteeOrderDO order = orderMapper.selectById(orderId);
        if (!"DRAFT".equals(order.getStatus())) {
            throw new BusinessException("只有草稿状态才能提交");
        }
        order.setStatus("RISK_REVIEW");
        order.setApplyDate(new Date());
        orderMapper.updateById(order);
    }

    @Transactional
    public void approve(Long orderId, String riskLevel) {
        GuaranteeOrderDO order = orderMapper.selectById(orderId);
        if (!"RISK_REVIEW".equals(order.getStatus())) {
            throw new BusinessException("只有风控审核中状态才能审批");
        }
        order.setStatus("APPROVED");
        order.setRiskLevel(riskLevel);
        orderMapper.updateById(order);
    }

    @Transactional
    public void reject(Long orderId, String reason) {
        GuaranteeOrderDO order = orderMapper.selectById(orderId);
        if (!"RISK_REVIEW".equals(order.getStatus())) {
            throw new BusinessException("只有风控审核中状态才能驳回");
        }
        order.setStatus("DRAFT");
        order.setRejectReason(reason);
        orderMapper.updateById(order);
    }
    // sign(), activate(), close() ... 同样模式的代码
}
```

### 5.3 重构后：DDD 领域模型

**步骤一：定义值对象**

```java
// 订单编号值对象
public class OrderNo {
    private final String value;

    public OrderNo(String value) {
        if (value == null || !value.matches("GO\\d{14}\\d{4}")) {
            throw new IllegalArgumentException("订单编号格式无效");
        }
        this.value = value;
    }

    public static OrderNo generate() {
        String datePart = LocalDate.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seqPart = String.format("%04d", SeqGenerator.next());
        return new OrderNo("GO" + datePart + seqPart);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderNo)) return false;
        return value.equals(((OrderNo) o).value);
    }

    @Override
    public int hashCode() { return value.hashCode(); }
    @Override
    public String toString() { return value; }
}

// 担保期限值对象
public class GuaranteePeriod {
    private final int durationMonths;
    private final LocalDate startDate;
    private final LocalDate endDate;

    public GuaranteePeriod(int durationMonths, LocalDate startDate) {
        if (durationMonths < 1 || durationMonths > 36) {
            throw new DomainException("担保期限必须在 1-36 个月之间");
        }
        this.durationMonths = durationMonths;
        this.startDate = startDate;
        this.endDate = startDate.plusMonths(durationMonths);
    }

    public boolean isExpired() {
        return LocalDate.now().isAfter(endDate);
    }

    public boolean covers(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    public int getDurationMonths() { return durationMonths; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
}
```

**步骤二：定义聚合根（核心）**

```java
/**
 * 担保订单聚合根
 *
 * 生命周期状态机：
 *   DRAFT → RISK_REVIEW → APPROVED → SIGNED → ACTIVE
 *                    ↓
 *                  DRAFT (驳回)
 *   ACTIVE → CLOSED (到期/提前终止)
 *
 * 不变量：
 *   1. 担保金额必须大于 0
 *   2. 客户不能同时有两个 ACTIVE 状态的担保
 *   3. 状态变更必须遵循状态机
 */
public class GuaranteeOrder {

    private GuaranteeOrderId id;
    private OrderNo orderNo;
    private CustomerId customerId;
    private CreditLineId creditLineId;
    private Money guaranteeAmount;
    private GuaranteePeriod period;
    private OrderStatus status;
    private RiskAssessment riskAssessment;

    private LocalDateTime appliedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime signedAt;
    private LocalDateTime activatedAt;
    private LocalDateTime closedAt;

    private List<DomainEvent> events = new ArrayList<>();

    public GuaranteeOrder(CustomerId customerId, CreditLineId creditLineId,
                          Money guaranteeAmount, GuaranteePeriod period) {
        if (guaranteeAmount == null || guaranteeAmount.lessThanOrEqual(Money.ZERO)) {
            throw new DomainException("担保金额必须大于 0");
        }
        this.id = new GuaranteeOrderId(IDGenerator.next());
        this.orderNo = OrderNo.generate();
        this.customerId = customerId;
        this.creditLineId = creditLineId;
        this.guaranteeAmount = guaranteeAmount;
        this.period = period;
        this.status = OrderStatus.DRAFT;
        events.add(new GuaranteeOrderCreatedEvent(this.id, this.orderNo, customerId));
    }

    public void submitRiskReview() {
        assertStatus(OrderStatus.DRAFT);
        this.status = OrderStatus.RISK_REVIEW;
        this.appliedAt = LocalDateTime.now();
        events.add(new GuaranteeOrderSubmittedEvent(this.id, this.orderNo));
    }

    public void approve(RiskAssessment assessment) {
        assertStatus(OrderStatus.RISK_REVIEW);
        if (assessment == null || assessment.isRejected()) {
            throw new DomainException("风控未通过，不能审批");
        }
        this.riskAssessment = assessment;
        this.status = OrderStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
        events.add(new GuaranteeOrderApprovedEvent(
            this.id, this.orderNo, this.customerId,
            this.guaranteeAmount, assessment.getRiskLevel()));
    }

    public void reject(String reason) {
        assertStatus(OrderStatus.RISK_REVIEW);
        if (reason == null || reason.trim().isEmpty()) {
            throw new DomainException("驳回原因不能为空");
        }
        this.riskAssessment = RiskAssessment.rejected(reason);
        this.status = OrderStatus.DRAFT;
        events.add(new GuaranteeOrderRejectedEvent(this.id, this.orderNo, reason));
    }

    public void sign() {
        assertStatus(OrderStatus.APPROVED);
        this.status = OrderStatus.SIGNED;
        this.signedAt = LocalDateTime.now();
        events.add(new GuaranteeOrderSignedEvent(this.id, this.orderNo, this.customerId));
    }

    public void activate() {
        assertStatus(OrderStatus.SIGNED);
        this.status = OrderStatus.ACTIVE;
        this.activatedAt = LocalDateTime.now();
        events.add(new GuaranteeOrderActivatedEvent(
            this.id, this.orderNo, this.customerId,
            this.guaranteeAmount, this.period));
    }

    public void close(String reason) {
        if (this.status != OrderStatus.ACTIVE) {
            throw new DomainException("只有生效中的担保才能关闭");
        }
        this.status = OrderStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
        events.add(new GuaranteeOrderClosedEvent(this.id, this.orderNo, reason));
    }

    public boolean canBeModified() {
        return this.status == OrderStatus.DRAFT;
    }

    public List<DomainEvent> getEvents() {
        List<DomainEvent> result = new ArrayList<>(this.events);
        this.events.clear();
        return result;
    }

    private void assertStatus(OrderStatus expected) {
        if (this.status != expected) {
            throw new DomainException(
                String.format("订单状态不正确，当前：%s，期望：%s", this.status, expected));
        }
    }

    // Getters（只读访问）...
}
```

**步骤三：应用服务（协调者）**

```java
@Service
public class GuaranteeOrderApplicationService {

    private final GuaranteeOrderRepository orderRepository;
    private final CreditLineRepository creditLineRepository;
    private final CustomerRepository customerRepository;
    private final DomainEventPublisher eventPublisher;
    private final RiskEvaluationService riskEvaluationService;

    @Transactional
    public SubmitResult submitOrder(SubmitOrderCommand command) {
        CustomerId customerId = new CustomerId(command.getCustomerId());
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new DomainException("客户不存在"));

        orderRepository.findActiveByCustomerId(customerId)
            .ifPresent(o -> {
                throw new DomainException("已存在生效中的担保，订单号：" + o.getOrderNo());
            });

        Money guaranteeAmount = Money.rmb(command.getGuaranteeAmount());
        creditLineRepository.findActiveByCustomerId(customerId)
            .ifPresent(cl -> {
                if (cl.getAvailableAmount().lessThan(guaranteeAmount)) {
                    throw new DomainException("授信额度不足");
                }
            });

        GuaranteeOrder order = new GuaranteeOrder(
            customerId, new CreditLineId(command.getCreditLineId()),
            guaranteeAmount, new GuaranteePeriod(
                command.getDurationMonths(), LocalDate.now()));

        orderRepository.save(order);
        order.getEvents().forEach(eventPublisher::publish);

        return SubmitResult.success(order.getOrderNo().toString());
    }

    @Transactional
    public void approve(ApproveOrderCommand command) {
        GuaranteeOrder order = orderRepository.findById(
            new GuaranteeOrderId(command.getOrderId()))
            .orElseThrow(() -> new DomainException("订单不存在"));

        Customer customer = customerRepository.findById(order.getCustomerId())
            .orElseThrow(() -> new DomainException("客户不存在"));

        RiskAssessment assessment = riskEvaluationService.evaluate(order, customer);
        order.approve(assessment);  // 业务逻辑在聚合中

        orderRepository.save(order);
        order.getEvents().forEach(eventPublisher::publish);
    }

    @Transactional
    public void sign(SignOrderCommand command) {
        GuaranteeOrder order = orderRepository.findById(
            new GuaranteeOrderId(command.getOrderId()))
            .orElseThrow(() -> new DomainException("订单不存在"));

        order.sign();  // 业务逻辑在聚合中
        orderRepository.save(order);
        order.getEvents().forEach(eventPublisher::publish);
    }
}
```

### 5.4 重构前后对比

| 维度 | 重构前（贫血模型） | 重构后（DDD） |
|------|------------------|--------------|
| 业务逻辑位置 | Service 层，散落在各处 | 聚合内，集中且自包含 |
| 状态变更 | 直接 setStatus("xxx") | 语义化方法 submitRiskReview() → approve() → sign() |
| 业务规则 | 散落在各个 if-else 中 | 聚合构造方法和业务方法中集中保护 |
| 不变量保护 | 靠开发者自觉，容易遗漏 | 编译时+运行时强制执行 |
| 代码复用 | 复制粘贴或抽取静态方法 | 聚合方法天然复用 |
| 测试难度 | 需 Mock 大量依赖 | 领域对象可独立单元测试 |
| 可读性 | 需要读懂所有 if-else 逻辑 | 方法名即语义 |
| 新人理解 | 需要梳理全局代码 | 看聚合代码即理解业务流程 |

## 第六部分：DDD 的适用场景与不适用场景

### 6.1 适用场景

**适合使用 DDD 的项目特征**：

1. **业务复杂度高**：业务规则多且频繁变化，涉及复杂的流程和状态机。示例：担保业务、保险理赔、金融风控

2. **长生命周期项目**：需要长期维护和迭代，团队成员可能轮换，清晰的领域模型有利于知识传递

3. **领域专家深度参与**：业务人员和开发人员可使用统一语言沟通，有明确的领域逻辑需要建模

4. **核心业务系统**：对企业有战略意义的系统，如交易系统、风控系统、核心账务系统

**具体例子**：✅ 担保/保险核心业务系统、✅ 金融交易引擎、✅ 电商订单和库存管理、✅ 物流调度系统

### 6.2 不适用场景

**不适合使用 DDD 的项目特征**：

1. **纯 CRUD 系统**：没有复杂业务逻辑，主要是数据的增删改查。示例：后台管理系统、简单的数据录入

2. **技术复杂度高、业务复杂度低**：主要挑战在于技术层面（高并发、大数据处理），业务规则简单。示例：API 网关、消息中间件、日志收集

3. **短平快项目**：生命周期短，不需要长期维护，DDD 的前期投入不划算

4. **团队对 DDD 不熟悉**：项目时间紧迫，强行使用反而增加复杂度

**决策矩阵**：

```
                    业务复杂度
                低          高
           ┌─────────┬─────────┐
    低     │ 不需要  │ 可考虑  │
技术       │ DDD     │ 使用DDD  │
复杂度     ├─────────┼─────────┤
    高     │ 不需要  │ ★★★   │
           │ DDD     │ 强烈推荐 │
           └─────────┴─────────┘
```

## 第七部分：常见误区

### 误区一：DDD = 微服务

**错误认知**：用了 DDD 就必须拆微服务。

**事实**：DDD 是**建模方法论**，微服务是**架构风格**。限界上下文可以是模块、包，不一定是独立的微服务。你可以在一个单体应用中应用 DDD：

```java
com.company.guarantee
├── customer           // 客户上下文（模块）
│   ├── domain         //   领域层
│   ├── application    //   应用层
│   └── infrastructure //   基础设施层
├── credit             // 授信上下文（模块）
│   ├── domain
│   ├── application
│   └── infrastructure
└── risk               // 风控上下文（模块）
    ├── domain
    ├── application
    └── infrastructure
```

每个模块内部使用 DDD，模块之间通过接口通信。**这是 DDD 在单体架构中的最佳实践**。

### 误区二：充血模型就是好的，贫血模型就是坏的

**错误认知**：只要把逻辑从 Service 搬到 Entity 里，就完成了 DDD 转型。

**事实**：
- DDD 不是简单的"充血 vs 贫血"二选一
- 不恰当的"充血"可能比贫血更糟糕——一个 500 行的实体类
- 关键在于**领域逻辑的合理分配**，不是所有逻辑都适合放在实体里
- 有些逻辑天然属于领域服务（如跨多个聚合的操作）

```java
// ❌ 错误的"充血"：把所有逻辑塞进实体
public class Order {
    public void sendEmailNotification() { ... }   // 这是应用层的事
    public List<Recommendation> generateRecs() { ... }  // 这是领域服务
    public void syncToElasticsearch() { ... }     // 这是基础设施的事
}

// ✅ 正确的充血：实体只包含自己的行为
public class Order {
    public void addItem(Product product, Quantity qty) { ... }
    public void removeItem(OrderItemId itemId) { ... }
    public Money calculateTotal() { ... }
    public void submit() { ... }
    public void cancel(String reason) { ... }
}
```

### 误区三：所有模块都必须严格分层

**错误认知**：所有模块都必须有 domain/application/infrastructure 分层。

**事实**：DDD 是战术工具集，可以按需选用。核心领域使用完整 DDD，支撑域和通用域可以简化：

```
核心域（Core Domain）→ 完整 DDD，投入最大的精力
  ├── 担保申请流程
  ├── 风控评估引擎
  └── 保后管理

支撑域（Supporting Domain）→ 简化 DDD 或事务脚本
  ├── 客户管理
  └── 产品配置

通用域（Generic Domain）→ 直接使用现成方案或外包
  ├── 认证授权
  ├── 通知服务
  └── 文件管理
```

### 误区四：数据对象（DO）就是领域对象

**错误认知**：把数据库表映射的 DO 类当作领域实体。

**事实**：DO 反映的是**数据库结构**，领域对象反映的是**业务概念**，它们需要明确的转换层：

```java
// Converter：DO ↔ Domain 转换
@Component
public class GuaranteeOrderConverter {
    public GuaranteeOrder toDomain(GuaranteeOrderDO dataObject) {
        // 将数据库字段转换为业务概念
        return new GuaranteeOrder(
            new GuaranteeOrderId(dataObject.getId()),
            new OrderNo(dataObject.getOrderNo()),
            new CustomerId(dataObject.getCustomerId()),
            new Money(dataObject.getGuaranteeAmount(),
                Currency.fromCode(dataObject.getCurrency())),
            new GuaranteePeriod(
                toLocalDate(dataObject.getEffectiveDate()),
                toLocalDate(dataObject.getExpireDate()))
            // ... 状态恢复
        );
    }
}
```

### 误区五：DDD 太重，不适合小型项目

**错误认知**：DDD 需要大量基础设施代码。

**事实**：
- DDD 的核心不是代码量，而是**思维方式**——把关注点从"数据库表"转移到"业务领域"
- 值对象（如 Money）即使在小型项目中也能带来价值

```java
// 轻量 DDD：只引入值对象，不需要完整的分层架构
@Service
public class PaymentService {
    public PaymentResult process(PaymentRequest request) {
        Money amount = Money.rmb(request.getAmount());  // 一次性封装
        Money fee = amount.multiply(FEE_RATE);           // 精度不会错
        Money total = amount.add(fee);                    // 计算不会错
        // 不需要担心 BigDecimal 的 scale、rounding 等问题
    }
}
```

### 误区六：必须先看完 500 页蓝皮书才能开始

**事实**：实践优先于理论！入门推荐路径：
1. 先理解实体和值对象的区别（当场就能用）
2. 尝试把 Service 中的校验逻辑移到实体里
3. 在模块中定义明确的领域接口（Repository）
4. 当模块变复杂时，引入聚合和领域事件
5. 多模块协作时，关注限界上下文

## 第八部分：DDD 推荐项目结构

```
com.company.guarantee
├── GuaranteeApplication.java              // Spring Boot 启动类
├── customer                               // 客户限界上下文
│   ├── api                                //   用户接口层
│   │   ├── CustomerController.java
│   │   ├── dto/
│   │   │   ├── CustomerCreateRequest.java
│   │   │   └── CustomerResponse.java
│   │   └── assembler/
│   │       └── CustomerAssembler.java
│   ├── application                        //   应用服务层
│   │   ├── CustomerApplicationService.java
│   │   └── command/
│   │       ├── CreateCustomerCommand.java
│   │       └── UpdateCustomerCommand.java
│   ├── domain                             //   领域层（核心）
│   │   ├── model/
│   │   │   ├── Customer.java              //   聚合根
│   │   │   ├── CustomerId.java            //   实体标识
│   │   │   ├── PhoneNumber.java           //   值对象
│   │   │   ├── AnnualIncome.java          //   值对象
│   │   │   ├── CustomerStatus.java        //   枚举值对象
│   │   │   └── CreditRating.java
│   │   ├── service/
│   │   │   └── CustomerValidationService.java
│   │   ├── event/
│   │   │   ├── CustomerCreatedEvent.java
│   │   │   └── CustomerStatusChangedEvent.java
│   │   ├── repository/
│   │   │   └── CustomerRepository.java    //   仓储接口
│   │   └── exception/
│   │       └── CustomerNotFoundException.java
│   └── infrastructure                     //   基础设施层
│       ├── persistence/
│       │   ├── CustomerDO.java
│       │   ├── CustomerMapper.java
│       │   ├── CustomerRepositoryImpl.java
│       │   └── converter/
│       │       └── CustomerConverter.java
│       ├── messaging/
│       │   └── CustomerEventPublisher.java
│       └── external/
│           └── CreditBureauClient.java
├── credit                                 // 授信限界上下文
│   └── ... (同 customer 结构)
├── guarantee                              // 担保限界上下文
│   └── ... (同 customer 结构)
└── shared                                 // 共享内核
    ├── domain/
    │   ├── Money.java
    │   ├── Currency.java
    │   └── DateRange.java
    └── infrastructure/
        ├── DomainEventPublisher.java
        └── IDGenerator.java
```

### 核心依赖（pom.xml）

```xml
<!-- Spring Boot Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- MyBatis-Plus（仓储实现） -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
</dependency>

<!-- MapStruct（DO ↔ Domain 转换，可选） -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
</dependency>
```

## 总结

DDD 不是银弹，但对于复杂业务系统来说是一把非常有效的武器。

### 关键概念速查

| 概念 | 一句话解释 | 关键特征 |
|------|-----------|---------|
| **实体** | 有身份的对象 | 有唯一标识，可变，基于 ID 判断相等 |
| **值对象** | 描述特征的对象 | 无标识，不可变，基于属性值判断相等 |
| **聚合** | 一致性边界 | 聚合根是入口，内部保证强一致 |
| **限界上下文** | 语义边界 | 同一个词在不同上下文有不同含义 |
| **领域服务** | 不属于实体的业务逻辑 | 无状态，跨聚合操作 |
| **应用服务** | 用例协调者 | 不包含业务逻辑，只做协调和事务管理 |
| **仓储** | 聚合的持久化中介 | 模拟内存集合，一个聚合一个仓储 |
| **领域事件** | 已发生的业务事实 | 用于聚合间的最终一致性 |

### 行动建议

| 阶段 | 建议 |
|------|------|
| **刚开始** | 在一个模块引入值对象（如 Money），体验无 bug 的金额运算 |
| **1-2年经验** | 在一个中等复杂度的模块中实践完整的 DDD 分层 |
| **团队 Leader** | 选择核心域使用 DDD，支撑域保持简化，渐进式推进 |

记住：**DDD 的核心不是代码结构，而是用业务语言思考和建模**。当你和业务人员说同一种语言时，你就已经站在 DDD 的门内了。

## 参考资料

1. Eric Evans, 《领域驱动设计：软件核心复杂性应对之道》
2. Vaughn Vernon, 《实现领域驱动设计》
3. Martin Fowler, "Anemic Domain Model"
4. Alberto Brandolini, "Introducing EventStorming"
5. Spring 官方 DDD 示例项目 (https://github.com/spring-projects/spring-modulith)
