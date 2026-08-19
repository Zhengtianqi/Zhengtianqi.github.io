---
title: 分布式事务TCC与Saga模式详解
date: 2026-09-02
category: 架构设计
tag: ["分布式事务", "TCC", "Saga", "微服务"]
---

# 分布式事务TCC与Saga模式详解

> 分布式事务是微服务架构的核心挑战，TCC和Saga是两种主流的补偿型事务方案。
> 本文深入剖析TCC和Saga的实现原理、适用场景和实战案例，帮助你解决跨服务事务一致性问题。

## 一、分布式事务概述

### 1.1 CAP定理

```
CAP定理：

一致性 (Consistency)
├─ 所有节点在同一时间看到相同数据
└─ 强一致性

可用性 (Availability)
├─ 每个请求都能得到响应
└─ 不保证是最新数据

分区容错性 (Partition Tolerance)
├─ 网络分区时系统仍能运行
└─ 分布式系统必须满足

结论：P是必须的，只能在C和A之间选择
```

### 1.2 BASE理论

| 概念 | 说明 |
|------|------|
| 基本可用 (Basically Available) | 系统允许损失部分可用性 |
| 软状态 (Soft State) | 允许中间状态存在 |
| 最终一致性 (Eventually Consistent) | 最终数据达到一致 |

## 二、TCC模式

### 2.1 TCC概念

```
TCC (Try-Confirm-Cancel)：

Try阶段：
├─ 预留资源
├─ 检查业务约束
└─ 不真正执行业务

Confirm阶段：
├─ 确认执行
├─ 使用Try阶段预留的资源
└─ 业务逻辑真正执行

Cancel阶段：
├─ 取消执行
├─ 释放Try阶段预留的资源
└─ 回滚到初始状态
```

### 2.2 TCC流程

```
TCC事务流程：

┌─────────────────────────────────────────────────────────────┐
│  1. Try阶段                                                 │
│  ├─ 服务A: 冻结100元                                        │
│  ├─ 服务B: 冻扣库存1件                                       │
│  └─ 服务C: 冻结积分100分                                    │
├─────────────────────────────────────────────────────────────┤
│  2. Confirm阶段                                             │
│  ├─ 服务A: 扣减100元(使用冻结金额)                           │
│  ├─ 服务B: 扣减库存(使用冻结库存)                            │
│  └─ 服务C: 扣减积分(使用冻结积分)                            │
├─────────────────────────────────────────────────────────────┤
│  3. Cancel阶段(任一Try失败时)                                │
│  ├─ 服务A: 解冻100元                                        │
│  ├─ 服务B: 解冻库存1件                                       │
│  └─ 服务C: 解冻积分100分                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 TCC实现示例

```java
// TCC接口定义
@LocalTCC
public interface AccountTccService {
    
    @TwoPhaseBusinessAction(name = "deduct", commitMethod = "confirm", rollbackMethod = "cancel")
    boolean tryDeduct(@BusinessActionContextParameter(paramName = "userId") String userId,
                      @BusinessActionContextParameter(paramName = "amount") BigDecimal amount);
    
    boolean confirm(BusinessActionContext context);
    
    boolean cancel(BusinessActionContext context);
}

// TCC实现
@Service
public class AccountTccServiceImpl implements AccountTccService {
    
    @Autowired
    private AccountMapper accountMapper;
    
    @Override
    @Transactional
    public boolean tryDeduct(String userId, BigDecimal amount) {
        // Try: 冻结金额
        Account account = accountMapper.selectByUserId(userId);
        if (account.getBalance().compareTo(amount) < 0) {
            return false;
        }
        
        // 冻结金额
        account.setFrozenAmount(account.getFrozenAmount().add(amount));
        accountMapper.updateFrozenAmount(userId, account.getFrozenAmount());
        
        return true;
    }
    
    @Override
    @Transactional
    public boolean confirm(BusinessActionContext context) {
        // Confirm: 扣减金额
        String userId = context.getActionContext("userId").toString();
        BigDecimal amount = (BigDecimal) context.getActionContext("amount");
        
        Account account = accountMapper.selectByUserId(userId);
        account.setBalance(account.getBalance().subtract(amount));
        account.setFrozenAmount(account.getFrozenAmount().subtract(amount));
        accountMapper.updateBalance(userId, account.getBalance(), account.getFrozenAmount());
        
        return true;
    }
    
    @Override
    @Transactional
    public boolean cancel(BusinessActionContext context) {
        // Cancel: 解冻金额
        String userId = context.getActionContext("userId").toString();
        BigDecimal amount = (BigDecimal) context.getActionContext("amount");
        
        Account account = accountMapper.selectByUserId(userId);
        account.setFrozenAmount(account.getFrozenAmount().subtract(amount));
        accountMapper.updateFrozenAmount(userId, account.getFrozenAmount());
        
        return true;
    }
}
```

## 三、Saga模式

### 3.1 Saga概念

```
Saga模式：

每个参与者都有：
├─ 正向操作 (Forward Transaction)
└─ 补偿操作 (Compensating Transaction)

执行流程：
├─ T1 → T2 → T3 → ... → Tn (成功)
└─ C1 ← C2 ← C3 ← ... ← Ci (失败，从失败点回滚)

特点：
├─ 最终一致性
├─ 补偿操作
└─ 无锁
```

### 3.2 Saga编排方式

| 方式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| 协调器 | 中央协调器编排 | 简单清晰 | 协调器单点 |
| 事件驱动 | 事件驱动编排 | 去中心化 | 复杂度高 |

### 3.3 Saga实现示例

```java
// Saga协调器
@Component
public class OrderSaga {
    
    @Autowired
    private OrderService orderService;
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private InventoryService inventoryService;
    @Autowired
    private ShippingService shippingService;
    
    // 执行Saga
    @SagaStep compensations = @CompensationStep(method = "cancelOrder")
    public Order createOrder(OrderRequest request) {
        // 1. 创建订单
        Order order = orderService.createOrder(request);
        
        // 2. 扣减库存
        inventoryService.deductStock(request.getProductId(), request.getQuantity());
        
        // 3. 扣减支付
        paymentService.deductPayment(order.getId(), request.getAmount());
        
        // 4. 创建发货单
        shippingService.createShipping(order.getId(), request.getAddress());
        
        return order;
    }
    
    // 补偿操作
    public void cancelOrder(OrderRequest request, Order order) {
        // 逆序补偿
        if (order != null) {
            shippingService.cancelShipping(order.getId());
            paymentService.refundPayment(order.getId());
            inventoryService.restoreStock(request.getProductId(), request.getQuantity());
            orderService.cancelOrder(order.getId());
        }
    }
}
```

## 四、TCC vs Saga对比

### 4.1 特性对比

| 特性 | TCC | Saga |
|------|-----|------|
| 一致性 | 强一致性 | 最终一致性 |
| 实现复杂度 | 高 | 中 |
| 性能 | 中 | 高 |
| 业务侵入 | 高 | 中 |
| 锁机制 | 有锁(资源预留) | 无锁 |
| 适用场景 | 资金、库存 | 长流程业务 |

### 4.2 选择建议

```
选择策略：

1. 是否需要强一致性？
   ├─ 是 → TCC
   └─ 否 → Saga

2. 业务流程是否很长？
   ├─ 是 → Saga
   └─ 否 → TCC

3. 是否有资源预留需求？
   ├─ 是 → TCC
   └─ 否 → Saga

4. 团队实现能力？
   ├─ 强 → TCC
   └─ 中 → Saga
```

## 五、Seata框架

### 5.1 Seata架构

```
Seata架构：

┌─────────────────────────────────────────────────────────────┐
│  事务管理器 (TM)                                            │
│  ├─ 开启全局事务                                            │
│  ├─ 提交/回滚全局事务                                       │
│  └─ 注册分支事务                                            │
├─────────────────────────────────────────────────────────────┤
│  资源管理器 (RM)                                            │
│  ├─ 注册分支事务                                            │
│  ├─ 报告分支事务状态                                        │
│  └─ 执行分支事务                                            │
├─────────────────────────────────────────────────────────────┤
│  事务协调器 (TC)                                            │
│  ├─ 管理全局事务                                            │
│  ├─ 管理分支事务                                            │
│  └─ 驱动全局提交/回滚                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Seata TCC模式

```java
// 定义TCC接口
@LocalTCC
public interface StockTccService {
    
    @TwoPhaseBusinessAction(name = "deduct", commitMethod = "confirm", rollbackMethod = "cancel")
    boolean tryDeduct(@BusinessActionContextParameter(paramName = "productId") String productId,
                      @BusinessActionContextParameter(paramName = "quantity") int quantity);
    
    boolean confirm(BusinessActionContext context);
    
    boolean cancel(BusinessActionContext context);
}

// 使用Seata TCC
@GlobalTransactional
public void createOrder(OrderRequest request) {
    // 1. 扣减库存
    stockTccService.tryDeduct(request.getProductId(), request.getQuantity());
    
    // 2. 扣减账户
    accountTccService.tryDeduct(request.getUserId(), request.getAmount());
    
    // 3. 创建订单
    orderService.createOrder(request);
}
```

## 六、实战案例

### 6.1 电商下单流程

```java
// TCC实现
@Component
public class OrderTccService {
    
    @SagaStep(compensation = "cancelOrder")
    @GlobalTransactional
    public Order createOrder(OrderRequest request) {
        // Try: 预留资源
        inventoryTccService.tryDeduct(request.getProductId(), request.getQuantity());
        accountTccService.tryDeduct(request.getUserId(), request.getAmount());
        
        // Confirm: 创建订单
        Order order = orderService.createOrder(request);
        
        return order;
    }
    
    public void cancelOrder(OrderRequest request, Order order) {
        // Cancel: 释放资源
        inventoryTccService.cancel(request.getProductId(), request.getQuantity());
        accountTccService.cancel(request.getUserId(), request.getAmount());
    }
}
```

### 6.2 转账流程

```java
// Saga实现
@Component
public class TransferSaga {
    
    @SagaStep(compensation = "compensateTransfer")
    public void transfer(String from, String to, BigDecimal amount) {
        // 1. 扣减转出账户
        accountService.deduct(from, amount);
        
        // 2. 增加转入账户
        accountService.add(to, amount);
    }
    
    public void compensateTransfer(String from, String to, BigDecimal amount) {
        // 补偿: 逆序操作
        accountService.deduct(to, amount);
        accountService.add(from, amount);
    }
}
```

## 七、最佳实践

### 7.1 设计原则

| 原则 | 说明 |
|------|------|
| 补偿幂等 | 补偿操作必须幂等 |
| 业务幂等 | 正向操作尽量幂等 |
| 超时处理 | 设置合理的超时时间 |
| 日志记录 | 记录事务执行日志 |

### 7.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 补偿失败 | 网络异常 | 重试机制 |
| 数据不一致 | 补偿未执行 | 定时对账 |
| 性能问题 | 锁竞争 | 优化锁粒度 |

