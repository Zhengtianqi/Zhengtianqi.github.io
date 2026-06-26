---
title: 分布式事务实战：Saga、TCC、AT 模式原理与选型
tag: ["Saga", "TCC"]
category: 分布式
date: 2026-06-25
---

# 分布式事务实战：Saga、TCC、AT 模式原理与选型

## 前言

传统单体应用中，数据库事务通过 **ACID 保证一致性**。但在微服务架构下，一个业务操作涉及多个服务、多个数据库，**本地事务已无能为力**。

以电商订单为例：

```
用户下单 → 订单服务（创建订单）
        → 库存服务（扣减库存）
        → 支付服务（扣款）
        → 积分服务（加积分）

任何一个环节失败，都需要回滚整个流程，但这四个服务各自管理数据库！
```

本文深入剖析分布式事务的三大解决方案：**Saga、TCC、AT** 各自的原理、优缺点与生产落地。

---

## 一、分布式事务的挑战

### 1.1 CAP定理下的妥协

分布式系统无法同时满足：
- **C** (Consistency) 一致性
- **A** (Availability) 可用性  
- **P** (Partition Tolerance) 分区容错

在 **P（网络分区）必然存在** 的前提下，需在 C 和 A 之间选择：

```
传统事务系统：CP选择
├─ 强一致性（ACID）
├─ 可能不可用（等待锁）
└─ 适用于：金融转账、库存精确扣减

微服务系统：AP选择  
├─ 最终一致性（BASE）
├─ 高可用（无锁，异步）
└─ 适用于：订单、积分、日志
```

### 1.2 BASE理论

**基本可用 + 软状态 + 最终一致**

```
T0: 订单创建成功 ✓
    库存扣减 中间态 (处理中)
T1: 网络抖动，扣减失败
    触发补偿 → 库存加回
T2: 状态同步完成
    最终一致 ✓
```

---

## 二、Saga 模式：编程式事务

### 2.1 原理

**Saga = 一系列本地事务 + 补偿动作**

不要求跨服务的强一致性，而是通过 **顺序执行 + 失败补偿** 达到最终一致。

```
正向流程：
Order Service → (创建订单) ✓
             → Inventory Service → (扣库存) ✓
                                → Payment Service → (扣款) ✓
                                                  → Point Service → (加积分) ✓

反向流程（失败时）：
Point Service → (积分回滚)
             ← Payment Service (款项退回)
                            ← Inventory Service (库存加回)
                                               ← Order Service (订单取消)
```

### 2.2 两种实现方式

#### **方式1：编排型Saga（Orchestration）**

由 **中央协调器** 指挥各服务执行顺序

```
┌─────────────────┐
│  Saga Orchestrator
│  (状态机)       │
└────────┬────────┘
         │
    ┌────┼────┬────────┬─────────┐
    ▼    ▼    ▼        ▼         ▼
Order Invent Payment Point    Notify
Service ory   Service Service  Service
```

**实现示例**（使用Temporal框架）：

```python
from temporalio import workflow
from temporalio.client import Client
import asyncio

@workflow.defn
class OrderSaga:
    @workflow.run
    async def execute(self, order_id, items):
        # 第一步：创建订单
        order = await workflow.execute_activity(
            create_order_activity,
            order_id, items
        )
        
        try:
            # 第二步：扣库存
            await workflow.execute_activity(
                deduct_inventory_activity,
                order_id, items
            )
            
            # 第三步：扣款
            payment = await workflow.execute_activity(
                process_payment_activity,
                order_id, order.total_price
            )
            
            # 第四步：加积分
            await workflow.execute_activity(
                add_points_activity,
                order_id, order.user_id, order.total_price
            )
            
            # 全部成功
            return {"status": "SUCCESS", "order": order, "payment": payment}
        
        except Exception as e:
            # 失败，执行补偿
            await workflow.execute_activity(
                refund_payment_activity,
                order_id, payment.id
            )
            
            await workflow.execute_activity(
                return_inventory_activity,
                order_id, items
            )
            
            await workflow.execute_activity(
                cancel_order_activity,
                order_id
            )
            
            raise

# 服务实现
@activity.defn
async def create_order_activity(order_id, items):
    return await order_service.create(order_id, items)

@activity.defn
async def deduct_inventory_activity(order_id, items):
    return await inventory_service.deduct(items)

@activity.defn
async def process_payment_activity(order_id, amount):
    return await payment_service.pay(order_id, amount)

@activity.defn
async def add_points_activity(order_id, user_id, amount):
    return await point_service.add(user_id, int(amount * 0.01))

# 补偿活动
@activity.defn
async def refund_payment_activity(order_id, payment_id):
    return await payment_service.refund(payment_id)

@activity.defn
async def return_inventory_activity(order_id, items):
    return await inventory_service.return_items(items)

@activity.defn
async def cancel_order_activity(order_id):
    return await order_service.cancel(order_id)
```

**流程图**：

```
创建订单 ✓
   │
   ├→ [扣库存] ✓
   │      │
   │      ├→ [扣款] ✓
   │      │      │
   │      │      ├→ [加积分] ✓
   │      │      │      │
   │      │      │      └→ 返回成功
   │      │      │
   │      │      └→ [扣款失败] ✗
   │      │             │
   │      │             └→ 退款 ← [扣款补偿]
   │      │                │
   │      │                └→ 库存加回 ← [库存补偿]
   │      │                   │
   │      │                   └→ 订单取消 ← [订单补偿]
   │      │
   │      └→ [扣库存失败] ✗
   │             │
   │             └→ 订单取消 ← [订单补偿]
```

**优点**：
- 流程清晰可控
- 中央协调器维护状态，便于监控
- 支持复杂业务逻辑（分支、循环）

**缺点**：
- 中央协调器成为性能瓶颈
- 强依赖协调器可用性
- 服务间耦合度高（都要知道协调器）

---

#### **方式2：编程式Saga（Choreography）**

服务间通过 **消息驱动** 自主协调，无中央协调器

```
Order Service (发布事件)
    │
    └→ OrderCreated
       └─→ Inventory Service (订阅，执行动作)
           │
           └→ InventoryDeducted
              └─→ Payment Service
                  │
                  └→ PaymentProcessed
                     └─→ Point Service
                         │
                         └→ PointAdded (完成)
                         
           或 InventoryDeductFailed
              └─→ Order Service (补偿)
                  └→ OrderCancelled
```

**实现示例**（使用Spring Cloud Stream + RabbitMQ）：

```python
from fastapi import FastAPI
import aio_pika
import json

app = FastAPI()

# Order Service
class OrderService:
    def __init__(self, mq_connection):
        self.mq = mq_connection
    
    async def create_order(self, order_data):
        # 1. 创建订单
        order = await db.orders.insert(order_data)
        
        # 2. 发布事件
        await self.publish_event("order.created", {
            "order_id": order.id,
            "items": order_data["items"],
            "user_id": order_data["user_id"]
        })
        
        return order
    
    async def cancel_order(self, order_id):
        # 补偿：取消订单
        await db.orders.update(order_id, status="CANCELLED")
    
    async def publish_event(self, event_type, data):
        channel = await self.mq.get_channel()
        exchange = await channel.declare_exchange(
            'order.events', 
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )
        
        message = aio_pika.Message(
            body=json.dumps({
                "event_type": event_type,
                "data": data
            }).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )
        
        await exchange.publish(message, event_type)

# Inventory Service
class InventoryService:
    def __init__(self, mq_connection):
        self.mq = mq_connection
    
    async def listen_order_events(self):
        channel = await self.mq.get_channel()
        exchange = await channel.declare_exchange(
            'order.events',
            aio_pika.ExchangeType.TOPIC,
            durable=True
        )
        
        queue = await channel.declare_queue('inventory.queue', durable=True)
        await queue.bind(exchange, 'order.created')
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process():
                    event = json.loads(message.body.decode())
                    
                    if event['event_type'] == 'order.created':
                        try:
                            # 扣库存
                            await self.deduct_inventory(event['data'])
                            
                            # 发布成功事件
                            await self.publish_event('inventory.deducted', {
                                "order_id": event['data']['order_id']
                            })
                        except Exception as e:
                            # 发布失败事件
                            await self.publish_event('inventory.deduct_failed', {
                                "order_id": event['data']['order_id'],
                                "reason": str(e)
                            })
    
    async def deduct_inventory(self, order_data):
        for item in order_data['items']:
            await db.inventory.update(
                item['product_id'],
                decrement_qty=item['qty']
            )
    
    async def publish_event(self, event_type, data):
        # 与OrderService类似的逻辑
        pass

# Payment Service
class PaymentService:
    async def listen_inventory_events(self):
        # 监听 inventory.deducted 事件
        # 执行扣款
        # 发布 payment.processed 或 payment.failed
        pass

# Point Service
class PointService:
    async def listen_payment_events(self):
        # 监听 payment.processed 事件
        # 加积分
        pass
    
    async def listen_refund_events(self):
        # 监听 payment.refunded 事件
        # 积分回滚
        pass
```

**流程示意**：

```
User → Order Service
         │
         ├→ DB: 创建订单 ✓
         │
         └→ MQ: 发布 OrderCreated
            │
            ├→ Inventory Service 收到
            │  ├→ DB: 扣库存 ✓
            │  └→ MQ: 发布 InventoryDeducted
            │     │
            │     ├→ Payment Service 收到
            │     │  ├→ API: 调用支付网关 ✓
            │     │  └→ MQ: 发布 PaymentProcessed
            │     │     │
            │     │     └→ Point Service 收到
            │     │        ├→ DB: 加积分 ✓
            │     │        └→ MQ: 发布 PointAdded (完成)
            │     │
            │     └→ (如果失败) MQ: 发布 InventoryDeductFailed
            │        │
            │        └→ Order Service 收到
            │           ├→ DB: 取消订单
            │           └→ 通知用户
```

**优点**：
- 服务解耦，松散耦合
- 可扩展性强（新服务只需订阅相关事件）
- 高可用（无中央协调器）

**缺点**：
- 流程难以追踪（事件链复杂）
- 调试困难（需要追踪消息轨迹）
- 消息丢失风险（需保证消息可靠性）

---

### 2.3 Saga的局限性

**问题1：脏读**

```
T0: Order Service 创建订单 (status=PENDING)
T1: Inventory Service 扣库存
T2: 用户查询订单 → 看到 PENDING (实际上库存可能扣不了！)
T3: Payment Service 扣款失败，触发补偿
T4: 订单取消，但用户已看到PENDING → 心理不适
```

**解决**：订单状态机更精细化

```
订单状态：
PENDING_PAYMENT (支付中)
    ↓
PAID (已支付，可见给用户)
    ↓
FULFILLED (已履约)
或
CANCELLED (已取消，显示理由)
```

**问题2：补偿失败**

```
支付扣款成功
Payment Service → 发起退款 ✓
Inventory Service → 库存加回失败 ✗
                   重试仍失败（例如库存服务宕机）
                   
结果：款已退，库存未加，业务数据不一致！
```

**解决**：
1. **最终一致性保证**：后台定时任务扫描异常状态，重试补偿
2. **人工介入**：告警+人工处理
3. **上层补偿**：库存加回失败 → 直接赔偿用户积分/优惠券

---

## 三、TCC 模式：强一致性

### 3.1 原理

**Try-Confirm-Cancel**，比Saga提供更强的一致性保证

```
Try阶段：预留资源
├─ Order Service: 锁定订单
├─ Inventory Service: 锁定库存
├─ Payment Service: 冻结账户余额
└─ Point Service: 预留积分额度

Confirm阶段：真正执行
├─ Order Service: 确认订单
├─ Inventory Service: 扣减库存
├─ Payment Service: 扣款
└─ Point Service: 加积分

Cancel阶段：释放资源（仅当任何一个Try或Confirm失败）
├─ Order Service: 释放订单锁
├─ Inventory Service: 释放库存锁
├─ Payment Service: 释放冻结余额
└─ Point Service: 释放积分额度
```

**特点**：
- 强一致性：所有服务要么全部成功，要么全部失败
- 无脏读：Try阶段只锁定资源，不给用户可见
- 业务逻辑清晰

### 3.2 实现示例

#### **服务接口定义**

```python
from abc import ABC, abstractmethod
from enum import Enum

class TransactionStatus(Enum):
    INITIAL = "INITIAL"
    TRYING = "TRYING"
    TRIED = "TRIED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class TccService(ABC):
    """TCC服务接口"""
    
    @abstractmethod
    async def try_operation(self, transaction_id: str, data: dict) -> bool:
        """
        Try阶段：预留资源，但不实际修改数据
        返回True表示可以继续，False表示无法进行
        """
        pass
    
    @abstractmethod
    async def confirm_operation(self, transaction_id: str) -> bool:
        """Confirm阶段：真正执行业务逻辑"""
        pass
    
    @abstractmethod
    async def cancel_operation(self, transaction_id: str) -> bool:
        """Cancel阶段：释放Try阶段预留的资源"""
        pass
```

#### **订单服务实现**

```python
class OrderServiceImpl(TccService):
    async def try_operation(self, transaction_id: str, data: dict) -> bool:
        """
        Try: 创建订单，但status=PENDING（锁定状态）
        """
        # 检查用户、商品有效性
        user = await db.users.find(data['user_id'])
        if not user:
            return False
        
        # 创建待支付订单
        order = await db.orders.insert({
            "transaction_id": transaction_id,
            "user_id": data['user_id'],
            "items": data['items'],
            "status": "PENDING",  # 尚未确认
            "total_price": sum(item['price'] * item['qty'] for item in data['items']),
            "created_at": datetime.now()
        })
        
        # 存储Try阶段的临时状态（便于Cancel回滚）
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "OrderService",
            "phase": "TRIED",
            "resource_id": order.id,
            "data": order.to_dict()
        })
        
        return True
    
    async def confirm_operation(self, transaction_id: str) -> bool:
        """
        Confirm: 确认订单，status=CONFIRMED
        """
        order = await db.orders.find_one({"transaction_id": transaction_id})
        
        if not order:
            return False
        
        # 更新订单状态
        await db.orders.update(order.id, status="CONFIRMED")
        
        # 记录Confirm日志
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "OrderService",
            "phase": "CONFIRMED",
            "resource_id": order.id
        })
        
        return True
    
    async def cancel_operation(self, transaction_id: str) -> bool:
        """
        Cancel: 取消订单，回到INITIAL
        """
        order = await db.orders.find_one({"transaction_id": transaction_id})
        
        if not order:
            return True  # 订单本不存在，视为成功
        
        # 软删除或更新状态
        await db.orders.update(order.id, status="CANCELLED")
        
        # 记录Cancel日志
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "OrderService",
            "phase": "CANCELLED",
            "resource_id": order.id
        })
        
        return True
```

#### **库存服务实现**

```python
class InventoryServiceImpl(TccService):
    async def try_operation(self, transaction_id: str, data: dict) -> bool:
        """
        Try: 锁定库存（创建锁定记录，但不实际扣减）
        """
        lock_records = []
        
        for item in data['items']:
            product = await db.products.find(item['product_id'])
            
            if not product or product.stock < item['qty']:
                # Try失败，无法预留库存
                return False
            
            # 创建库存锁定记录
            lock = await db.inventory_locks.insert({
                "transaction_id": transaction_id,
                "product_id": item['product_id'],
                "locked_qty": item['qty'],
                "created_at": datetime.now()
            })
            lock_records.append(lock.id)
        
        # 记录Try日志
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "InventoryService",
            "phase": "TRIED",
            "resource_ids": lock_records,
            "data": data['items']
        })
        
        return True
    
    async def confirm_operation(self, transaction_id: str) -> bool:
        """
        Confirm: 真正扣减库存
        """
        locks = await db.inventory_locks.find({"transaction_id": transaction_id})
        
        if not locks:
            return False
        
        for lock in locks:
            # 扣减实际库存
            await db.products.update(
                lock.product_id,
                decrement_stock=lock.locked_qty
            )
            
            # 删除锁定记录
            await db.inventory_locks.delete(lock.id)
        
        # 记录Confirm日志
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "InventoryService",
            "phase": "CONFIRMED"
        })
        
        return True
    
    async def cancel_operation(self, transaction_id: str) -> bool:
        """
        Cancel: 释放库存锁定
        """
        locks = await db.inventory_locks.find({"transaction_id": transaction_id})
        
        for lock in locks:
            await db.inventory_locks.delete(lock.id)
        
        # 记录Cancel日志
        await db.tcc_logs.insert({
            "transaction_id": transaction_id,
            "service": "InventoryService",
            "phase": "CANCELLED"
        })
        
        return True
```

#### **TCC协调器**

```python
import uuid
from typing import List

class TccCoordinator:
    def __init__(self, services: List[TccService]):
        self.services = {svc.__class__.__name__: svc for svc in services}
    
    async def execute_transaction(self, transaction_data: dict) -> bool:
        """
        执行分布式事务
        返回True: 全部成功
        返回False: 某个环节失败，已自动回滚
        """
        transaction_id = str(uuid.uuid4())
        tried_services = []
        
        try:
            # Try阶段：所有服务都成功才继续
            for service_name, service in self.services.items():
                try:
                    success = await service.try_operation(transaction_id, transaction_data)
                    if not success:
                        raise Exception(f"{service_name} try_operation failed")
                    tried_services.append(service_name)
                except Exception as e:
                    print(f"Try phase failed for {service_name}: {e}")
                    raise
            
            # Confirm阶段：依次确认
            for service_name, service in self.services.items():
                try:
                    success = await service.confirm_operation(transaction_id)
                    if not success:
                        raise Exception(f"{service_name} confirm_operation failed")
                except Exception as e:
                    print(f"Confirm phase failed for {service_name}: {e}")
                    raise
            
            print(f"Transaction {transaction_id} completed successfully")
            return True
        
        except Exception as e:
            print(f"Transaction {transaction_id} failed, initiating cancel phase")
            
            # Cancel阶段：回滚已Try成功的服务
            for service_name in tried_services:
                try:
                    service = self.services[service_name]
                    await service.cancel_operation(transaction_id)
                except Exception as cancel_error:
                    print(f"Cancel failed for {service_name}: {cancel_error}")
                    # 继续尝试其他服务的Cancel（不因一个失败而中止）
            
            return False
```

#### **使用示例**

```python
# 初始化
order_service = OrderServiceImpl()
inventory_service = InventoryServiceImpl()
payment_service = PaymentServiceImpl()
point_service = PointServiceImpl()

coordinator = TccCoordinator([
    order_service,
    inventory_service,
    payment_service,
    point_service
])

# 执行事务
success = await coordinator.execute_transaction({
    "user_id": "user123",
    "items": [
        {"product_id": "prod1", "qty": 2, "price": 100},
        {"product_id": "prod2", "qty": 1, "price": 50}
    ]
})

if success:
    print("订单创建成功")
else:
    print("订单创建失败，已自动回滚")
```

### 3.3 TCC的局限性

**问题1：业务复杂性**

每个操作都需实现Try、Confirm、Cancel三个方法，编码量大

**问题2：资源锁定时间**

```
T0: Try阶段开始，锁定资源
T1: Try阶段完成
T2: Confirm/Cancel阶段执行（可能很慢）
    ↑ 资源被锁定，其他请求等待
    
如果Confirm阶段需要5秒，则资源被锁5秒
高并发下 → 锁竞争激烈 → QPS下降
```

**问题3：Confirm失败无补偿**

```
Try成功 → Confirm阶段 → 数据库宕机
         → Confirm失败
         → Cancel阶段 → 但此时资源已部分修改
         
需要人工介入恢复数据
```

---

## 四、AT模式：自动补偿

### 4.1 原理

**Automatic Compensation Transaction**，由Seata框架推行

```
核心思想：代理本地事务，记录操作前后的数据快照，
实现自动补偿（无需编写补偿代码）
```

**架构**：

```
┌──────────────────────────────────────────────────┐
│  应用层（业务逻辑）                               │
│  @Transactional @GlobalTransactional            │
└───────────────────┬────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│  Seata代理层（拦截本地事务）                     │
│  1. 记录Before Image (修改前数据)                │
│  2. 执行本地SQL操作                              │
│  3. 记录After Image (修改后数据)                 │
│  4. 上报Undo Log                                │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│  事务协调器（TC）                                 │
│  - 全局事务编号生成                              │
│  - 全局锁管理                                    │
│  - 补偿恢复                                      │
└──────────────────────────────────────────────────┘
```

### 4.2 实现示例（Seata框架）

#### **Seata配置**

```yaml
# seata-server 配置
server:
  port: 8091
  servlet:
    context-path: /seata

spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/seata?serverTimezone=UTC
    username: root
    password: password

seata:
  registry:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      namespace: public
  config:
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      namespace: public
  store:
    mode: db  # 使用数据库存储事务信息
    db:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/seata?serverTimezone=UTC
      username: root
      password: password
```

#### **创建Undo Log表**

```sql
CREATE TABLE IF NOT EXISTS `undo_log` (
  `branch_id` bigint(20) NOT NULL COMMENT 'branch transaction id',
  `xid` varchar(128) NOT NULL COMMENT 'global transaction id',
  `context` varchar(8000) COMMENT 'undo_log context',
  `rollback_info` longblob NOT NULL COMMENT 'serialized rollback info',
  `log_status` int(11) NOT NULL COMMENT '0:normal,1:defense',
  `log_created` datetime NOT NULL COMMENT 'create datetime',
  `log_modified` datetime NOT NULL COMMENT 'modify datetime',
  UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='AT transaction mode undo table';
```

#### **订单服务**

```python
from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker
import seata_python_client
import uuid
from datetime import datetime

app = FastAPI()

# 初始化Seata客户端
seata_client = seata_python_client.SeataClient(
    registry_type="nacos",
    registry_address="127.0.0.1:8848",
    application_name="order-service"
)

# 数据库
engine = create_engine("mysql+pymysql://root:password@localhost/order_db")
Session = sessionmaker(bind=engine)

class Order:
    def __init__(self, user_id, total_price, status="PENDING"):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.total_price = total_price
        self.status = status
        self.created_at = datetime.now()

@app.post("/order/create")
async def create_order(order_data: dict):
    """
    创建订单 - 全局事务方法
    使用@GlobalTransactional标注，Seata自动处理
    """
    # 获取全局事务ID
    xid = seata_client.get_global_tx_id()
    
    session = Session()
    
    try:
        # 1. 创建订单（本地事务）
        order = Order(
            user_id=order_data['user_id'],
            total_price=order_data['total_price']
        )
        session.add(order)
        session.commit()
        
        # Seata自动记录了Before Image和After Image
        # Before Image: 无此记录
        # After Image: 新插入的记录
        
        # 2. 调用库存服务
        inventory_result = await deduct_inventory_rpc(
            xid=xid,
            items=order_data['items']
        )
        
        if not inventory_result['success']:
            raise Exception("库存不足")
        
        # 3. 调用支付服务
        payment_result = await process_payment_rpc(
            xid=xid,
            order_id=order.id,
            amount=order.total_price
        )
        
        if not payment_result['success']:
            raise Exception("支付失败")
        
        # 4. 更新订单状态
        order.status = "PAID"
        session.commit()  # Seata继续记录修改
        
        # 5. 调用积分服务
        await add_points_rpc(
            xid=xid,
            user_id=order_data['user_id'],
            points=int(order.total_price * 0.01)
        )
        
        return {"success": True, "order_id": order.id}
    
    except Exception as e:
        # Seata自动触发全局回滚
        # 所有服务的操作都会使用Undo Log恢复
        session.rollback()
        seata_client.report_transaction_status(xid, False)
        return {"success": False, "error": str(e)}
    
    finally:
        session.close()

async def deduct_inventory_rpc(xid: str, items: list):
    """
    远程调用库存服务
    """
    headers = {
        "X-SEATA-XID": xid  # 传递全局事务ID
    }
    # 实际HTTP/RPC调用
    response = await http_client.post(
        "http://inventory-service/inventory/deduct",
        json={"items": items},
        headers=headers
    )
    return response.json()

async def process_payment_rpc(xid: str, order_id: str, amount: float):
    """
    远程调用支付服务
    """
    headers = {"X-SEATA-XID": xid}
    response = await http_client.post(
        "http://payment-service/payment/process",
        json={"order_id": order_id, "amount": amount},
        headers=headers
    )
    return response.json()

async def add_points_rpc(xid: str, user_id: str, points: int):
    """
    远程调用积分服务
    """
    headers = {"X-SEATA-XID": xid}
    response = await http_client.post(
        "http://point-service/point/add",
        json={"user_id": user_id, "points": points},
        headers=headers
    )
    return response.json()
```

#### **库存服务（参与者）**

```python
@app.post("/inventory/deduct")
async def deduct_inventory(items: list):
    """
    库存服务 - 分支事务方法
    需要@Transactional注解，Seata自动代理
    """
    xid = request.headers.get("X-SEATA-XID")
    
    session = Session()
    
    try:
        for item in items:
            # 查询前快照
            product = session.query(Product).filter(
                Product.id == item['product_id']
            ).first()
            
            if not product or product.stock < item['qty']:
                raise Exception("库存不足")
            
            # Before Image记录
            before_image = {
                "id": product.id,
                "stock": product.stock
            }
            
            # 扣库存
            product.stock -= item['qty']
            session.commit()
            
            # After Image记录（Seata自动）
            # 当事务回滚时，使用Before Image恢复
            
        return {"success": True}
    
    except Exception as e:
        session.rollback()
        # Seata会自动调用此服务的Undo Log恢复
        return {"success": False, "error": str(e)}
    
    finally:
        session.close()
```

### 4.3 AT模式的优势

| 特性 | AT | TCC | Saga |
|-----|----|----|------|
| 一致性 | 强一致 | 强一致 | 最终一致 |
| 编码复杂度 | 低（无需补偿代码） | 高（3个方法） | 中（需事件链） |
| 资源锁定时间 | 短（仅本地事务） | 长（Try-Confirm） | 无（异步） |
| 业务侵入度 | 低（代理模式） | 高（需改业务逻辑） | 中（需事件驱动） |
| 性能 | 中 | 低（锁竞争） | 高（无同步锁） |

---

## 五、三大模式对比与选型

### 5.1 决策矩阵

```
┌────────────────────────────────────────────────┐
│        需要强一致性吗？                         │
└─────────┬──────────────────────────┬──────────┘
         否                          是
         │                           │
         │                    ┌──────▼────────┐
         │                    │ 数据修改频繁  │
         │                    │ 还是偶发？    │
         │                    └──┬──────┬─────┘
         │                    频繁 偶发
         │                      │    │
         │                    ┌─▼─┐┌─▼──┐
         │                    │AT ││TCC │
         │                    └───┘└────┘
         │
    ┌────▼─────────┐
    │实时性要求高  │
    │还是可异步？  │
    └┬──────────┬─┘
  实时│          │异步
    ┌▼┐        ┌▼──┐
    │?│        │Saga│
    └─┘        └────┘
```

### 5.2 具体建议

| 场景 | 推荐方案 | 原因 |
|-----|---------|------|
| 电商订单 | AT | 数据修改频繁，需强一致，但不涉及跨库关联 |
| 转账/扣费 | TCC | 金融级强一致，接受短期资源锁定 |
| 物流追踪 | Saga | 最终一致即可，不需要立即同步 |
| 数据分析 | Saga | 异步处理，高吞吐量 |
| 库存扣减 | AT | 频繁操作，需精确性 |
| 用户积分 | Saga | 可异步加积分，失败可补偿 |

---

## 总结

分布式事务没有银弹，需根据业务特性选择：

1. **Saga**：最终一致，高性能，适合大多数互联网业务
2. **TCC**：强一致，低吞吐，适合金融转账等核心链路
3. **AT**：强一致+低编码，适合使用Seata框架的云原生应用

**黄金法则**：
- 优先考虑业务流程优化，减少分布式事务需求
- 能用本地事务解决，就不用分布式事务
- 优先选Saga（最终一致），实在不行再上TCC/AT
