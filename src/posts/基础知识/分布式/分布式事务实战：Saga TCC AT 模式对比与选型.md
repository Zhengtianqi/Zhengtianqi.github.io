---
title: 分布式事务实战：Saga、TCC、AT 模式对比与选型
tag: ["分布式事务", "Saga", "TCC", "AT模式", "Seata"]
category: 分布式
date: 2026-06-26
---

# 分布式事务实战：Saga、TCC、AT 模式对比与选型

> 分布式事务实战：Saga、TCC、AT 模式对比与选型是分布式系统中的核心话题，它涉及数据一致性、可用性和分区容错等关键挑战。
> 本文深入分析了分布式事务实战：Saga、TCC、AT 模式对比与选型的原理和解决方案，帮助你构建可靠的分布式系统。

在单体应用中，事务管理依赖数据库的 ACID 特性：

```java
@Service
public class CreditService {
    @Autowired
    private CustomerMapper customerMapper;
    @Autowired
    private ContractMapper contractMapper;

    @Transactional
    public void applyCredit(CreditApplyRequest request) {
        customerMapper.insert(request.getCustomer());
        contractMapper.insert(request.getContract());
        // 要么都成功，要么都失败
    }
}
```

两个表在同一数据库内，通过 InnoDB 的 redolog + binlog 天然保证一致性。

### 1.2 微服务架构的问题

当 Customer 服务和 Contract 服务分别有自己的数据库时：

```
Customer 服务 (DB: customer_db)  ──RPC──>  Contract 服务 (DB: contract_db)
     insert customer                       insert contract
```

此时本地事务无法跨数据库工作。如果 customer 插入成功、contract 插入失败，数据就分裂了。

**分布式事务的核心矛盾**：如何在多个独立数据库之间保证数据一致性，同时不牺牲系统可用性和性能？

### 1.3 CAP 视角下的选择

| 方案 | 一致性 | 可用性 | 复杂度 |
|------|--------|--------|--------|
| Saga | 最终一致性 | 高 | 低 |
| TCC | 强一致性（阶段内） | 中 | 高 |
| AT | 最终一致性 | 中 | 中 |

## 二、Saga 模式：最简单但最受限

### 2.1 原理

Saga 将长事务拆分为一系列本地短事务，每个步骤都有对应的**补偿操作**：

```
步骤1: 创建申请 → 成功
步骤2: 风控审批 → 成功  
步骤3: 签订担保合同 → 失败 ❌
          ↓
补偿: 撤销风控审批 → 撤销申请创建 → 回滚
```

### 2.2 担保业务中的 Saga 实现

```java
@Service
public class CreditSagaService {
    
    @Autowired
    private CreditApplyService applyService;
    @Autowired
    private RiskService riskService;
    @Autowired
    private ContractService contractService;

    public void executeCreditApply(CreditApplyRequest request) {
        SagaRuntime saga = new SagaRuntime();
        
        // 正向操作
        saga.addStep("createApply", 
            () -> applyService.create(request),
            (result) -> applyService.cancel(result.getId())  // 补偿操作
        );
        
        saga.addStep("riskReview",
            (apply) -> riskService.review(apply.getId()),
            (result) -> riskService.reject(result.getId())  // 补偿操作
        );
        
        saga.addStep("createContract",
            (riskResult) -> contractService.create(riskResult.getApplyId()),
            (result) -> contractService.cancel(result.getContractNo())  // 补偿操作
        );
        
        try {
            saga.execute();
        } catch (SagaException e) {
            saga.compensate();  // 自动回滚已执行的步骤
            log.error("信贷申请 Saga 失败，已自动补偿", e);
        }
    }
}
```

### 2.3 Saga 的优缺点

**优点**：
- 实现简单，每个服务只需要写正向和补偿逻辑
- 性能好，没有两阶段锁
- 系统可用性高，各服务独立运行

**缺点**：
- 必须是最终一致性，不能保证强一致性
- 补偿操作必须幂等，且业务上可逆
- 无法处理复杂依赖（如步骤3依赖步骤1和步骤2的结果）

### 2.4 担保业务适用性分析

| 业务场景 | 是否适合 Saga | 原因 |
|---------|-------------|------|
| 担保申请流程 | ✅ 非常适合 | 申请可以撤销，补偿逻辑清晰 |
| 放款操作 | ❌ 不适合 | 放款回滚极其复杂，涉及资金流向 |
| 合同签署 | ⚠️ 部分适合 | 合同可作废但需要法务流程 |
| 保证金扣划 | ❌ 不适合 | 资金操作需要强一致性 |

## 三、TCC 模式：最强一致性但最复杂

### 3.1 原理

TCC 要求每个接口实现三个方法：

| 阶段 | 方法 | 作用 |
|------|------|------|
| Try | 预留资源 | 锁定业务资源，不做实际业务操作 |
| Confirm | 确认提交 | 使用预留资源，完成实际业务 |
| Cancel | 确认撤销 | 释放预留资源 |

```
服务 A                    服务 B
  |                         |
  |-- Try: 冻结账户 1000  --->|
  |<--- Try 成功: 预留成功 ---|
  |-- Try: 扣减账户 ----->   |
  |<--- Try 成功 ----------- |
  |-- Confirm: 执行扣减 ---->|
  |<--- Confirm 成功 --------|
```

### 3.2 担保业务中的 TCC 实现

以担保费收取为例：

```java
// Try 阶段：冻结担保费
@Component
public class GuaranteeFeeTryService implements TryExecutor {
    @Override
    public void tryAction(String bizId, String params) {
        JSONObject data = JSON.parseObject(params);
        String contractNo = data.getString("contractNo");
        BigDecimal amount = data.getBigDecimal("amount");
        
        // 冻结金额（不真正扣款）
        guaranteeMapper.freezeAmount(contractNo, amount);
        
        // 记录 TCC 事务日志
        tccLogMapper.insert(new TccLog(bizId, contractNo, "TRY", amount));
    }
}

// Confirm 阶段：真正扣款
@Component
public class GuaranteeFeeConfirmService implements ConfirmExecutor {
    @Override
    public void confirmAction(String bizId, String params) {
        // 检查是否已被 Cancel
        TccLog cancelLog = tccLogMapper.selectByBizId(bizId, "CANCEL");
        if (cancelLog != null) {
            throw new RuntimeException("已被取消，不可确认");
        }
        
        // 真正扣款
        guaranteeMapper.deductAmount(params);
        tccLogMapper.updateStatus(bizId, "CONFIRM");
    }
}

// Cancel 阶段：释放冻结
@Component
public class GuaranteeFeeCancelService implements CancelExecutor {
    @Override
    public void cancelAction(String bizId, String params) {
        // 幂等检查
        TccLog log = tccLogMapper.selectByBizId(bizId, "CONFIRM");
        if (log != null) {
            throw new RuntimeException("已确认，不可取消");
        }
        
        guaranteeMapper.unfreezeAmount(params);
        tccLogMapper.updateStatus(bizId, "CANCEL");
    }
}
```

### 3.3 TCC 的核心挑战

**挑战一：空回滚**

```
场景：Try 请求未到达服务 B，Cancel 请求先到

如果直接释放资源，后续 Try 到达时资源已被释放
解决：Cancel 检查是否存在 Try 记录，不存在则直接返回成功
```

```java
public void cancelAction(String bizId) {
    // 检查是否存在 Try 记录
    TccLog tryLog = tccLogMapper.selectByBizId(bizId, "TRY");
    if (tryLog == null) {
        // 空回滚：Try 还没来，Cancel 先到，直接返回成功
        log.warn("空回滚：Try 未到达，bizId={}", bizId);
        return;
    }
    
    // 正常回滚逻辑
    releaseResources(bizId);
}
```

**挑战二：悬挂（空悬）**

```
场景：Cancel 先完成，然后 Try 才到达

如果 Try 正常执行，Cancel 已经释放了资源
解决：Try 检查是否存在 Cancel 记录，存在则拒绝执行
```

```java
public void tryAction(String bizId) {
    // 检查是否存在 Cancel 记录
    TccLog cancelLog = tccLogMapper.selectByBizId(bizId, "CANCEL");
    if (cancelLog != null) {
        // 悬挂：Cancel 已完成，Try 不应再执行
        throw new RuntimeException("事务已取消，拒绝 Try");
    }
    
    // 正常 Try 逻辑
    reserveResources(bizId);
}
```

**挑战三：幂等性**

网络抖动导致 Confirm 或 Cancel 重试，必须保证幂等：

```java
public void confirmAction(String bizId) {
    // 幂等检查
    int count = tccLogMapper.countByBizIdAndStatus(bizId, "CONFIRM");
    if (count > 0) {
        log.info("重复 Confirm 请求，已处理过：bizId={}", bizId);
        return;  // 幂等返回
    }
    
    // 真正执行业务
    executeBusiness(bizId);
    tccLogMapper.insert(new TccLog(bizId, "CONFIRM"));
}
```

### 3.4 TCC 的优缺点

**优点**：
- 一致性最强，Try 阶段就锁定了资源
- 性能优于两阶段提交（2PC）
- 适用于资金类等强一致性场景

**缺点**：
- 开发成本极高，每个接口要写 Try/Confirm/Cancel 三个方法
- 业务侵入性强，需要改造原有业务逻辑
- 异常处理复杂（空回滚、悬挂、幂等都需处理）

## 四、AT 模式：Seata 的折中方案

### 4.1 原理

AT 模式（Automatic Transaction）是 Seata 框架提出的模式，核心思想：

```
一阶段：执行 SQL 并解析 undo_log → 释放锁
二阶段提交：删除 undo_log
二阶段回滚：根据 undo_log 恢复数据
```

```
步骤        操作                        undo_log
─────────────────────────────────────────────────────
1PC-查询    SELECT * FROM account     -
1PC-更新    UPDATE account SET        记录变更前余额 2000,
            balance=1000 WHERE id=1   变更后余额 1000
1PC-提交    提交事务                   undo_log 标记为已完成

如果二阶段需要回滚:
2PC-回滚    根据 undo_log 恢复:       undo_log 被删除
            UPDATE account SET 
            balance=2000 WHERE id=1
```

### 4.2 Seata AT 模式实战

**依赖引入**：

```xml
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot-starter</artifactId>
    <version>1.7.0</version>
</dependency>
```

**配置文件**：

```yaml
seata:
  enabled: true
  tx-service-group: my_test_tx_group
  service:
    vgroup-mapping:
      my_test_tx_group: default
    grouplist:
      default: 192.168.1.100:8091
  data-source-proxy-mode: AT
```

**业务代码**（与普通 Spring Boot 无异）：

```java
@Service
public class GuaranteeService {
    
    @Autowired
    private GuaranteeMapper guaranteeMapper;
    @Autowired
    private CustomerMapper customerMapper;

    // 全局事务发起方
    @GlobalTransactional  // Seata 全局事务注解
    public void createGuarantee(CreateGuaranteeRequest request) {
        // 1. 创建担保记录（本服务数据库）
        guaranteeMapper.insert(request.getGuarantee());
        
        // 2. 冻结客户保证金（跨服务 RPC 调用，自动加入全局事务）
        balanceService.freezeBalance(request.getCustomerId(), 
            request.getGuaranteeAmount());
        
        // 3. 记录担保合同（另一个服务）
        contractService.createContract(request);
        
        // 任何一步失败，Seata 自动回滚所有分支事务
    }
}
```

**被调服务**（无需额外代码）：

```java
@Service
public class BalanceService {
    
    @Autowired
    private BalanceMapper balanceMapper;

    // RPC 调用，自动加入全局事务
    public void freezeBalance(Long customerId, BigDecimal amount) {
        Balance balance = balanceMapper.selectById(customerId);
        balanceMapper.freeze(customerId, amount);
        // Seata 自动拦截 SQL，生成 undo_log
    }
}
```

### 4.3 AT 模式的核心机制

**undo_log 表结构**：

```sql
CREATE TABLE `undo_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) NOT NULL,       -- 分支事务 ID
  `xid` varchar(100) NOT NULL,            -- 全局事务 ID
  `context` varchar(128) NOT NULL,        -- 上下文信息
  `rollback_info` longblob NOT NULL,      -- 回滚数据（序列化）
  `log_status` varchar(32) NOT NULL,      -- 状态：0=新增, 1=已提交, 2=已删除
  `log_created` datetime NOT NULL,
  `log_modified` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE=InnoDB;
```

**提交路径**（无异常）：
```
1PC 提交 → 全局提交 → TC 通知 RM → RM 删除 undo_log（异步）
```

**回滚路径**（有异常）：
```
1PC 回滚 → 全局回滚 → TC 通知 RM → RM 用 undo_log 恢复数据
```

### 4.4 AT 模式的优缺点

**优点**：
- 对业务代码侵入小，只需加 `@GlobalTransactional` 注解
- 自动识别 SQL，无需手动写补偿逻辑
- 开发体验接近本地事务

**缺点**：
- 需要 Seata Server 集群，运维复杂度增加
- 一阶段需要全局锁（直到二阶段完成），影响并发性能
- 大事务问题：长时间持有全局锁会影响吞吐量
- 不支持跨资源的补偿（如消息队列、文件操作）

## 五、三种模式对比决策树

### 5.1 横向对比

| 维度 | Saga | TCC | AT |
|------|------|-----|----|
| 一致性强度 | 最终一致性 | 强一致性（阶段内） | 最终一致性 |
| 开发成本 | 低（写补偿即可） | 高（Try/Confirm/Cancel） | 低（加注解即可） |
| 性能 | 高（无锁） | 中（预占资源） | 中（全局锁） |
| 事务并发度 | 高 | 中 | 中低 |
| 适用场景 | 补偿逻辑简单 | 资金类、强一致 | 一般微服务 |
| 运维复杂度 | 低 | 中 | 高（需要 Seata 集群） |
| 框架支持 | 自实现 / Camunda | Seata / 自实现 | Seata |
| 回滚确定性 | 依赖补偿逻辑正确性 | 确定性 | 确定性（undo_log） |

### 5.2 选型决策树

```
需要分布式事务？
  ├── 否 → 不需要分布式事务
  └── 是
      ├── 是资金操作/强一致性要求？
      │   ├── 是 → TCC（资金类场景）
      │   └── 否 ↓
      ├── 补偿逻辑是否简单可逆？
      │   ├── 是 → Saga（担保申请、审批流程）
      │   └── 否 ↓
      ├── 是否已有 Seata 基础设施？
      │   ├── 是 → AT 模式（最简单）
      │   └── 否 → 自建 AT 引擎 / 选 TCC
      └── 是否有大量并发访问？
          ├── 是 → Saga（性能最好）
          └── 否 → AT 或 TCC
```

### 5.3 担保业务的混合方案

在实际担保系统中，不同场景适用不同模式：

```java
// 担保申请流程 → Saga
@Service
public class GuaranteeApplySaga {
    // 申请 → 审批 → 签约
    // 任一环节失败 → 回滚所有步骤
    // 补偿逻辑简单：撤销、作废
}

// 担保费扣款 → TCC
@Service
public class GuaranteeFeeTCC {
    // Try: 冻结费用
    // Confirm: 扣款
    // Cancel: 解冻
    // 资金类操作，必须强一致
}

// 客户信息更新 → AT
@GlobalTransactional
public void updateCustomerInfo(CustomerInfo info) {
    customerMapper.update(info);
    creditRecordMapper.update(info.getCustomerId());
    // 普通微服务调用，AT 足够
}
```

## 六、Seata 架构深度解析

### 6.1 三大角色

| 角色 | 全称 | 职责 |
|------|------|------|
| TC | Transaction Coordinator | 事务协调器，维护全局事务状态 |
| TM | Transaction Manager | 事务管理器，定义全局事务边界 |
| RM | Resource Manager | 资源管理器，管理分支事务资源 |

```
  TM                           TC (Seata Server)
  |                               |
  |-- Begin Global TX ---------> |
  |-- Register RM -------------> |
  |                               |
  |<-- Global TX ID: 12345 ---- |
  |                               |
  |--- Branch 1 (RM1) ----------> RM1
  |<-- Branch 1 ACK -------------|
  |                               |
  |--- Branch 2 (RM2) ----------> RM2  
  |<-- Branch 2 ACK -------------|
  |                               |
  |-- Commit / Rollback ------> |
  |                               |
  |--- Commit/Branch 1 --------> RM1
  |--- Commit/Branch 2 --------> RM2
```

### 6.2 部署模式

| 模式 | 事务日志存储 | 适用场景 |
|------|------------|----------|
| file | 本地文件 | 开发测试 |
| db | 数据库（MySQL） | 中小规模生产 |
| redis | Redis | 大规模生产，高性能 |

```yaml
seata:
  store:
    mode: db  # 或 redis
    db:
      datasource: druid
      db-type: mysql
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://192.168.1.100:3306/seata
      user: seata
      password: seata
```

## 七、总结

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 担保申请流程 | Saga | 补偿逻辑简单，最终一致性可接受 |
| 资金类操作 | TCC | 需要强一致性，防超扣 |
| 普通业务关联 | AT / Seata | 侵入小，开发快 |
| 消息通知 | 本地消息表 / MQ 事务 | 不需要分布式事务 |

**核心原则**：

1. **能不用就不用**：优先考虑异步解耦、最终一致性
2. **能用 Saga 不用 TCC**：TCC 的开发和维护成本很高
3. **AT 是入门首选**：Seata AT 模式侵入小，适合快速落地
4. **资金类必须 TCC**：一分钱都不能错，必须强一致

分布式事务没有银弹，只有适合场景的选择。理解每种模式的代价，才能在架构设计时做出正确决策。
