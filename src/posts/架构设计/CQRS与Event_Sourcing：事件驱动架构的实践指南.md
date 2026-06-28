---
title: CQRS与Event_Sourcing：事件驱动架构的实践指南
tag: ["CQRS", "Event_Sourcing", "事件驱动架构"]
category: 架构设计
date: 2026-06-26
---

# CQRS与Event_Sourcing：事件驱动架构的实践指南

> CQRS与Event_Sourcing：事件驱动架构的实践指南是系统设计的核心，它决定了系统的可扩展性、可靠性和可维护性。
> 本文介绍了CQRS与Event_Sourcing：事件驱动架构的实践指南的设计原则和实践经验，帮助你提升架构设计能力。

```
┌──────────────┐
│   User表     │
│  id|name|... │
└──────────────┘
    ↑      ↑
  写操作  读操作
    │      │
┌───┴──┬───┴──┐
│写入  │读取   │
│      │      │
UPDATE SELECT
```

#### **CQRS：分离的命令和查询模型**

```
写端：
┌────────────────┐
│  User Command  │ ← 优化写入
│  (Minimal Data)│
└────────────────┘
    │ 发布事件
    ▼
┌────────────────┐
│  Event Log     │ ← 永久记录
│ (History)      │
└────────────────┘

读端：
┌────────────────┐
│  User Query    │ ← 优化读取
│  (Denormalized)│
│  id|name|...   │
└────────────────┘
    ↑ 异步更新
    │ 消费事件
```

### 1.2 CQRS的核心思想

```python
# CQRS与Event_Sourcing：事件驱动架构的实践指南


class UserService:
    def create_user(self, name, email):  # 写
        user = User(name=name, email=email)
        db.save(user)
        return user.id
    
    def get_user(self, user_id):  # 读
        return db.query(user_id)
    
    def list_users(self, page=1):  # 读
        return db.list_with_pagination(page)

# CQRS方式：分离命令和查询
class UserCommandService:
    """只处理写操作"""
    
    def create_user(self, name, email):
        user = User(name=name, email=email)
        event = UserCreatedEvent(user_id=user.id, name=name, email=email)
        
        # 发布事件（不保存到数据库，只记录历史）
        self.event_store.append(event)
        self.event_bus.publish(event)

class UserQueryService:
    """只处理读操作，使用优化的查询模型"""
    
    def get_user(self, user_id):
        # 从专门的查询表读取（已反规范化）
        return self.query_db.user_projection.get(user_id)
    
    def list_users(self, page=1):
        return self.query_db.user_list_projection.paginate(page)
```

## 二、Event Sourcing（事件溯源）

### 2.1 核心概念

**不保存对象的当前状态，而是保存所有改变该对象的事件**

```
传统方式：
┌─────────────────┐
│  User表         │
│ id: 1           │
│ name: "Alice"   │
│ email: "a@x.com"│
│ age: 30         │
└─────────────────┘

Event Sourcing方式：
┌──────────────────────────────────────┐
│  Event Log                           │
├──────────────────────────────────────┤
│ 1. UserCreatedEvent:                 │
│    user_id=1, name="Alice"           │
│                                      │
│ 2. UserEmailUpdatedEvent:            │
│    user_id=1, old_email="old@x.com"  │
│    new_email="a@x.com"               │
│                                      │
│ 3. UserAgeUpdatedEvent:              │
│    user_id=1, age=30                 │
│                                      │
│ 4. UserNameUpdatedEvent:             │
│    user_id=1, old_name="Alicia"      │
│    new_name="Alice"                  │
└──────────────────────────────────────┘

当前状态 = 重放所有事件
```

### 2.2 优势

#### **1. 完整的审计日志**

```
问题：用户投诉"我从未改过邮箱"
      但系统显示邮箱是abc@example.com

Event Sourcing方案：
  查询Event Log → 找到UserEmailUpdatedEvent
               → 看到修改时间、修改者、IP地址
               → 可以证明是谁在什么时候改的
```

#### **2. 时间旅行（Time Travel）**

```python
# 可以重建任何时刻的对象状态

def get_user_state_at(user_id: str, timestamp: datetime) -> User:
    """
    获取用户在某个时刻的状态
    """
    events = self.event_store.get_events(
        aggregate_id=user_id,
        until=timestamp
    )
    
    user = User()
    for event in events:
        user.apply_event(event)
    
    return user

# 用途：
# 1. 审计："昨天这个时刻用户的订单是什么状态？"
# 2. 回溯："2周前用户删除了什么文件？"
# 3. 调试："在哪个操作之后才出现这个bug？"
```

#### **3. 自然支持并发**

```
传统方式（乐观锁问题）：
  T1: 读User v1 (version=1)
  T2: 读User v1 (version=1)
  
  T1: 修改age，保存 (version=2)
  T2: 修改email，保存 → 冲突！version=1 != 2

Event Sourcing方式：
  T1: 发布UserAgeUpdatedEvent
  T2: 发布UserEmailUpdatedEvent
  
  两个事件都成功追加到Log
  最终状态 = apply(AgeUpdated) + apply(EmailUpdated)
  无冲突！
```

### 2.3 实现示例

```python
# domain/event/user_events.py

from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class DomainEvent:
    """所有事件的基类"""
    event_id: str
    aggregate_id: str  # 聚合根ID（如user_id）
    event_type: str
    timestamp: datetime
    data: dict
    
    def to_json(self) -> str:
        return json.dumps({
            'event_id': self.event_id,
            'aggregate_id': self.aggregate_id,
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat(),
            'data': self.data
        })

@dataclass
class UserCreatedEvent(DomainEvent):
    """用户创建事件"""
    pass

@dataclass
class UserEmailUpdatedEvent(DomainEvent):
    """用户邮箱更新事件"""
    pass

@dataclass
class UserAgeUpdatedEvent(DomainEvent):
    """用户年龄更新事件"""
    pass

# domain/aggregate/user.py

class User:
    """用户聚合根"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.name = None
        self.email = None
        self.age = None
        self.version = 0  # 聚合根版本
        self.uncommitted_events = []
    
    def create(self, name: str, email: str):
        """创建用户"""
        event = UserCreatedEvent(
            event_id=self.generate_event_id(),
            aggregate_id=self.user_id,
            event_type='UserCreated',
            timestamp=datetime.now(),
            data={
                'user_id': self.user_id,
                'name': name,
                'email': email
            }
        )
        
        self.apply_event(event)
        self.uncommitted_events.append(event)
    
    def update_email(self, new_email: str):
        """更新邮箱"""
        event = UserEmailUpdatedEvent(
            event_id=self.generate_event_id(),
            aggregate_id=self.user_id,
            event_type='UserEmailUpdated',
            timestamp=datetime.now(),
            data={
                'user_id': self.user_id,
                'old_email': self.email,
                'new_email': new_email
            }
        )
        
        self.apply_event(event)
        self.uncommitted_events.append(event)
    
    def update_age(self, new_age: int):
        """更新年龄"""
        event = UserAgeUpdatedEvent(
            event_id=self.generate_event_id(),
            aggregate_id=self.user_id,
            event_type='UserAgeUpdated',
            timestamp=datetime.now(),
            data={
                'user_id': self.user_id,
                'age': new_age
            }
        )
        
        self.apply_event(event)
        self.uncommitted_events.append(event)
    
    def apply_event(self, event: DomainEvent):
        """应用事件，更新状态"""
        if event.event_type == 'UserCreated':
            self.name = event.data['name']
            self.email = event.data['email']
        
        elif event.event_type == 'UserEmailUpdated':
            self.email = event.data['new_email']
        
        elif event.event_type == 'UserAgeUpdated':
            self.age = event.data['age']
        
        self.version += 1
    
    def get_uncommitted_events(self) -> list:
        """获取未持久化的事件"""
        return self.uncommitted_events
    
    def mark_events_as_committed(self):
        """标记事件为已持久化"""
        self.uncommitted_events = []
    
    @staticmethod
    def generate_event_id() -> str:
        import uuid
        return str(uuid.uuid4())

# infrastructure/event_store.py

class EventStore:
    """事件存储"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def save_events(self, events: list) -> None:
        """
        保存事件
        """
        for event in events:
            await self.db.execute(
                """
                INSERT INTO events (event_id, aggregate_id, event_type, data, timestamp)
                VALUES (%s, %s, %s, %s, %s)
                """,
                event.event_id,
                event.aggregate_id,
                event.event_type,
                event.to_json(),
                event.timestamp
            )
    
    async def get_events(self, aggregate_id: str) -> list:
        """
        获取某个聚合根的所有事件
        """
        rows = await self.db.fetch(
            "SELECT data FROM events WHERE aggregate_id = %s ORDER BY timestamp",
            aggregate_id
        )
        
        events = []
        for row in rows:
            event_data = json.loads(row['data'])
            event_type = event_data['event_type']
            
            if event_type == 'UserCreated':
                event = UserCreatedEvent(**event_data)
            elif event_type == 'UserEmailUpdated':
                event = UserEmailUpdatedEvent(**event_data)
            elif event_type == 'UserAgeUpdated':
                event = UserAgeUpdatedEvent(**event_data)
            
            events.append(event)
        
        return events
    
    async def rebuild_aggregate(self, aggregate_id: str) -> User:
        """
        重建聚合根（重放所有事件）
        """
        user = User(aggregate_id)
        events = await self.get_events(aggregate_id)
        
        for event in events:
            user.apply_event(event)
        
        return user

# application/service/user_command_service.py

class UserCommandService:
    """用户命令服务（写操作）"""
    
    def __init__(self, event_store: EventStore, event_bus):
        self.event_store = event_store
        self.event_bus = event_bus
    
    async def create_user(self, user_id: str, name: str, email: str):
        """创建用户"""
        user = User(user_id)
        user.create(name, email)
        
        # 保存事件
        await self.event_store.save_events(user.get_uncommitted_events())
        
        # 发布事件（触发事件处理器，更新读模型）
        for event in user.get_uncommitted_events():
            await self.event_bus.publish(event)
        
        user.mark_events_as_committed()
    
    async def update_email(self, user_id: str, new_email: str):
        """更新邮箱"""
        # 重建用户状态
        user = await self.event_store.rebuild_aggregate(user_id)
        
        # 执行命令
        user.update_email(new_email)
        
        # 保存新事件
        await self.event_store.save_events(user.get_uncommitted_events())
        
        # 发布事件
        for event in user.get_uncommitted_events():
            await self.event_bus.publish(event)
        
        user.mark_events_as_committed()

# projection/user_query_projection.py

class UserQueryProjection:
    """用户查询投影（读模型）"""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def handle_user_created(self, event: UserCreatedEvent):
        """处理UserCreated事件，更新读模型"""
        await self.db.execute(
            """
            INSERT INTO user_query (user_id, name, email, created_at)
            VALUES (%s, %s, %s, %s)
            """,
            event.data['user_id'],
            event.data['name'],
            event.data['email'],
            event.timestamp
        )
    
    async def handle_user_email_updated(self, event: UserEmailUpdatedEvent):
        """处理UserEmailUpdated事件"""
        await self.db.execute(
            "UPDATE user_query SET email = %s WHERE user_id = %s",
            event.data['new_email'],
            event.data['user_id']
        )
    
    async def handle_user_age_updated(self, event: UserAgeUpdatedEvent):
        """处理UserAgeUpdated事件"""
        await self.db.execute(
            "UPDATE user_query SET age = %s WHERE user_id = %s",
            event.data['age'],
            event.data['user_id']
        )
    
    async def get_user(self, user_id: str):
        """查询用户（从读模型）"""
        return await self.db.fetchrow(
            "SELECT * FROM user_query WHERE user_id = %s",
            user_id
        )
```

## 三、CQRS+Event Sourcing架构

### 3.1 完整架构

```
写端：
┌─────────────────┐
│  User Command   │
│  (HTTP POST)    │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │ Command Handler│
    │                │
    │ 1. 重建聚合根  │
    │ 2. 执行命令    │
    │ 3. 发布事件    │
    └────┬──────────┘
         │
    ┌────▼────────────┐
    │  Event Store    │
    │  (数据库Log表)   │
    └────┬────────────┘
         │
    ┌────▼────────────┐
    │  Event Bus      │
    │  (异步消费)     │
    └────┬────────────┘
         │
读端：   │
    ┌────▼────────────────┐
    │ Event Handlers      │
    │ (投影更新器)        │
    └────┬─────────────────┘
         │
    ┌────▼────────────┐
    │ Query Models    │
    │ (优化的读表)    │
    └────┬────────────┘
         │
    ┌────▼───────────┐
    │ Query Service   │
    │ (HTTP GET)     │
    └────────────────┘
```

### 3.2 Event Handlers（投影更新器）

```python
class EventHandlers:
    """订阅事件，更新读模型"""
    
    def __init__(self, user_projection: UserQueryProjection):
        self.user_projection = user_projection
    
    async def on_user_created(self, event: UserCreatedEvent):
        """当UserCreated事件发布时调用"""
        await self.user_projection.handle_user_created(event)
    
    async def on_user_email_updated(self, event: UserEmailUpdatedEvent):
        """当UserEmailUpdated事件发布时调用"""
        await self.user_projection.handle_user_email_updated(event)

# 注册Event Handler
event_bus.subscribe('UserCreated', handler.on_user_created)
event_bus.subscribe('UserEmailUpdated', handler.on_user_email_updated)
```

## 四、CQRS vs Event Sourcing

两者经常一起用，但不必非要配对：

```
┌────────────────────────────────────────┐
│  独立使用CQRS（不使用ES）              │
│  ├─ 写：直接修改Command模型            │
│  └─ 读：从Query模型读取                │
│  优点：简单，性能好                    │
│  缺点：无法审计、难以时间旅行          │
│                                       │
├────────────────────────────────────────┤
│  独立使用Event Sourcing（不使用CQRS）  │
│  ├─ 保存所有事件                       │
│  └─ 重放事件获取当前状态               │
│  优点：完整审计、时间旅行              │
│  缺点：重放性能低                      │
│                                       │
├────────────────────────────────────────┤
│  同时使用CQRS + Event Sourcing        │
│  ├─ 写端：Event Sourcing（可靠记录）  │
│  └─ 读端：Query模型（性能优化）       │
│  优点：两者优点结合                    │
│  缺点：复杂度高，运维难度大            │
└────────────────────────────────────────┘
```

## 五、常见问题与解决方案

### 5.1 问题1：最终一致性延迟

```
用户发起转账：
T1: 发布TransferInitiated事件
T2: 读模型还未更新，查询余额仍是旧值
T3: 用户看到：转账成功，但余额未扣减

解决：
1. 在写端返回，同时返回新状态（不查读模型）
2. 轮询重试，确保读模型已更新
3. WebSocket推送最新状态
```

### 5.2 问题2：Event Store膨胀

```
情景：同一个聚合根有10000个事件
      每次都要重放10000个事件？性能极低！

解决方案：快照（Snapshot）

每隔N个事件创建快照：
  Event 1-1000 → Snapshot v1
  Event 1001-2000 → Snapshot v2
  ...
  Event 9001-10000 → Snapshot v10

重建时：
  加载最新快照（版本v9）
  只重放最后1000个事件
  大大加速！
```

### 5.3 问题3：读写强一致性需求

```
某些场景不能接受最终一致性：
  └─ 转账：必须立即扣款和加款（强一致）

解决方案：混合方案
  转账这类关键操作：使用传统ACID事务
  其他操作：使用CQRS+Event Sourcing
```

## 总结

| 特性 | 传统CRUD | CQRS | ES | CQRS+ES |
|-----|---------|------|----|---------| 
| **实现复杂度** | 低 | 中 | 中 | 高 |
| **性能** | 中 | 高 | 低 | 高 |
| **审计** | ✗ | ✗ | ✓ | ✓ |
| **时间旅行** | ✗ | ✗ | ✓ | ✓ |
| **最终一致** | N/A | ✓ | ✓ | ✓ |

**何时使用**：
- ✓ CQRS: 读写负载差异大（如报表系统）
- ✓ Event Sourcing: 需要完整审计、法规要求
- ✓ CQRS+ES: 复杂业务、超大规模系统（如金融）
