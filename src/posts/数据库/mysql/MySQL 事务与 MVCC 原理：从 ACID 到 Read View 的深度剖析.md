---
title: MySQL 事务与 MVCC 原理：从 ACID 到 Read View 的深度剖析
tag: ["MySQL", "事务", "MVCC", "ACID", "隔离级别"]
category: 数据库
date: 2026-06-27
---

# MySQL 事务与 MVCC 原理：从 ACID 到 Read View 的深度剖析

事务是数据库的基石。面试被问"MVCC 怎么实现的"答不上来？线上遇到"快照读和当前读结果不一致"排查不了？从 ACID 到底层实现，一篇讲透。

---

## 一、ACID 四大特性

```
A（Atomicity）原子性：事务要么全部成功，要么全部回滚
  → 实现：undo log（回滚日志）

C（Consistency）一致性：事务前后数据保持一致
  → 实现：A + I + D 共同保证

I（Isolation）隔离性：并发事务互不干扰
  → 实现：MVCC + 锁

D（Durability）持久性：事务提交后永久保存
  → 实现：redo log（重做日志）
```

---

## 二、事务隔离级别

### 2.1 并发事务问题

```
脏读（Dirty Read）：
  事务 A 读到了事务 B 未提交的修改，B 回滚后 A 读到的是脏数据

不可重复读（Non-Repeatable Read）：
  事务 A 两次读同一行，结果不同（事务 B 在中间修改并提交了）
  → 关注的是"修改"

幻读（Phantom Read）：
  事务 A 两次范围查询，结果集行数不同（事务 B 在中间插入/删除了）
  → 关注的是"新增/删除"
```

### 2.2 四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|---------|------|----------|------|------|
| READ UNCOMMITTED | ❌ | ❌ | ❌ | 最高 |
| READ COMMITTED (RC) | ✅ | ❌ | ❌ | 高 |
| REPEATABLE READ (RR) | ✅ | ✅ | ❌（InnoDB） | 中 |
| SERIALIZABLE | ✅ | ✅ | ✅ | 最低 |

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- MySQL 默认：REPEATABLE READ（RR）
-- Oracle / PostgreSQL 默认：READ COMMITTED（RC）
-- InnoDB 的 RR 级别通过 MVCC + Next-Key Lock 解决了幻读
```

---

## 三、MVCC 原理

### 3.1 MVCC 是什么

MVCC（Multi-Version Concurrency Control）多版本并发控制：一行数据同时存在多个版本，读操作读取历史快照，写操作创建新版本。读写不阻塞，大幅提升并发性能。

```
不用 MVCC（加锁）：
  事务 A 读 → 加读锁
  事务 B 写 → 等待 A 释放读锁
  → 读写互相阻塞

用 MVCC（快照）：
  事务 A 读 → 读旧版本快照（不加锁）
  事务 B 写 → 创建新版本（不影响 A 读）
  → 读写不互相阻塞
```

### 3.2 MVCC 三要素

#### 1. 隐藏字段

每行数据都有两个隐藏字段：

```
DB_TRX_ID（6字节）：最后修改该行的事务 ID
DB_ROLL_PTR（7字节）：回滚指针，指向 undo log 中的上一版本
DB_ROW_ID（6字节）：没有主键时自动生成（聚簇索引用）
```

```
当前行：
┌──────────────────────────────────────────┐
│ id=1 | name='张三' | trx_id=200 | roll_ptr→undo_log_2 │
└──────────────────────────────────────────┘

Undo Log（旧版本链表）：
  ┌──────────────────────────────────────┐
  │ name='李四' | trx_id=150 | roll_ptr→undo_log_1 │  ← 上一版本
  └──────────────────────────────────────┘
  ┌──────────────────────────────────────┐
  │ name='王五' | trx_id=100 | roll_ptr=NULL │  ← 最初版本
  └──────────────────────────────────────┘
```

#### 2. undo log 版本链

每次修改都会在 undo log 中保存旧版本，通过 roll_ptr 串成链表。事务回滚时沿着链表恢复；MVCC 快照读时沿着链表找到可见版本。

#### 3. Read View（读视图）

事务执行快照读时生成 Read View，决定能看到哪些版本。

```
Read View 包含：
  m_ids：生成 Read View 时，所有未提交事务的 ID 列表
  min_trx_id：m_ids 中的最小值
  max_trx_id：下一个将分配的事务 ID（当前最大事务 ID + 1）
  creator_trx_id：创建该 Read View 的事务 ID
```

### 3.3 可见性判断规则

```
对于某个版本的 trx_id，判断是否可见：

1. trx_id == creator_trx_id → 可见（自己修改的）
2. trx_id < min_trx_id → 可见（该事务在 Read View 创建前已提交）
3. trx_id >= max_trx_id → 不可见（该事务在 Read View 创建后才开始）
4. min_trx_id <= trx_id < max_trx_id：
   - trx_id 在 m_ids 中 → 不可见（该事务未提交）
   - trx_id 不在 m_ids 中 → 可见（该事务已提交）
   
不可见 → 沿 roll_ptr 找上一版本，重复判断
```

### 3.4 RC vs RR 的 MVCC 差异

```
RC（READ COMMITTED）：
  每次 SELECT 都生成新的 Read View
  → 能看到其他事务已提交的最新数据
  → 不可重复读

RR（REPEATABLE READ）：
  只在事务第一次 SELECT 时生成 Read View，之后复用
  → 整个事务看到的是同一快照
  → 可重复读
```

### 3.5 实战图解

```
时间线：
  t1: 事务A(trx_id=100) 开始
  t2: 事务B(trx_id=200) 开始
  t3: 事务A: SELECT name FROM user WHERE id=1  -- 第一次快照读
      → 生成 Read View: m_ids=[100,200], min=100, max=201
      → 当前行 trx_id=50 < min=100 → 可见 → 读到 name='张三'
      
  t4: 事务B: UPDATE user SET name='李四' WHERE id=1
      → 新版本 trx_id=200, 旧版本在 undo log
      
  t5: 事务B: COMMIT
  
  t6: 事务A: SELECT name FROM user WHERE id=1  -- RR 复用 t3 的 Read View
      → Read View: m_ids=[100,200], min=100, max=201
      → 当前行 trx_id=200, 在 m_ids 中 → 不可见
      → 沿 undo log 找上一版本 trx_id=50 < min=100 → 可见
      → 读到 name='张三'（可重复读 ✓）
      
  如果是 RC 级别，t6 会生成新 Read View: m_ids=[100], min=100, max=201
      → 当前行 trx_id=200, 不在 m_ids 中 → 可见
      → 读到 name='李四'（不可重复读）
```

---

## 四、锁机制

### 4.1 锁类型

```
全局锁：FLUSH TABLES WITH READ LOCK（全库只读，备份用）
表级锁：
  表锁：LOCK TABLES t READ/WRITE
  元数据锁（MDL）：防止 DDL 和 DML 冲突
  意向锁（IS/IX）：行锁前先加表级意向锁，快速判断是否有冲突
行级锁：
  Record Lock：锁定单行记录
  Gap Lock：锁定间隙（防止插入）
  Next-Key Lock：Record + Gap（解决幻读）
```

### 4.2 共享锁 vs 排他锁

```sql
-- 共享锁（S锁，读锁）
SELECT * FROM `order` WHERE id = 1 LOCK IN SHARE MODE;  -- 5.7
SELECT * FROM `order` WHERE id = 1 FOR SHARE;            -- 8.0

-- 排他锁（X锁，写锁）
SELECT * FROM `order` WHERE id = 1 FOR UPDATE;
UPDATE `order` SET amount = 100 WHERE id = 1;  -- 自动加 X 锁

-- 兼容性矩阵：
--      S    X
-- S    ✓    ✗
-- X    ✗    ✗
```

### 4.3 Next-Key Lock（解决幻读）

```
-- 表数据：id = 1, 5, 10, 15
-- 索引上的 Next-Key Lock（RR 级别）：

事务 A: SELECT * FROM `order` WHERE id BETWEEN 5 AND 10 FOR UPDATE;

加锁情况：
  Record Lock：id=5, id=10
  Gap Lock：(1,5), (5,10), (10,15)
  Next-Key Lock：(1,5], (5,10], (10,15]

事务 B 尝试：
  INSERT id=3   → ❌ 阻塞（在 (1,5) 间隙内）
  INSERT id=7   → ❌ 阻塞（在 (5,10) 间隙内）
  INSERT id=12  → ❌ 阻塞（在 (10,15) 间隙内）
  INSERT id=20  → ✅ 成功（在锁范围外）
  SELECT id=5   → ✅ 成功（快照读不加锁）
```

### 4.4 当前读 vs 快照读

```
快照读（普通 SELECT）：读 MVCC 快照，不加锁
  SELECT * FROM `order` WHERE id = 1;

当前读（加锁读 / DML）：读最新数据，加锁
  SELECT ... FOR UPDATE
  SELECT ... LOCK IN SHARE MODE
  UPDATE / DELETE / INSERT

→ 快照读用 MVCC，当前读用锁
→ 幻读问题：快照读不会幻读（MVCC），当前读用 Next-Key Lock 防幻读
```

---

## 五、redo log 与崩溃恢复

### 5.1 redo log 作用

```
问题：数据页在 Buffer Pool（内存）中修改，还没刷盘就宕机？
解决：redo log 先写到磁盘（WAL），崩溃后用 redo log 恢复

WAL（Write-Ahead Logging）：
  1. 修改数据页 → 在 Buffer Pool 中修改
  2. 写 redo log（顺序写，很快）→ 刷盘
  3. 异步刷脏页到磁盘
  4. 崩溃恢复：重放 redo log
```

### 5.2 redo log 刷盘策略

```sql
-- innodb_flush_log_at_trx_commit：
0 → 每秒刷盘（性能高，可能丢 1 秒数据）
1 → 每次提交刷盘（默认，最安全）
2 → 每次提交写 OS Cache，每秒刷盘（折中）

-- 生产环境建议：主库用 1（安全），从库用 2（性能）
SET GLOBAL innodb_flush_log_at_trx_commit = 1;
```

---

## 六、undo log 与事务回滚

```
事务执行过程：
  1. 修改数据前，先把旧值写入 undo log
  2. 修改 Buffer Pool 中的数据页
  3. 写 redo log
  4. 提交

回滚过程：
  1. 从 undo log 读取旧值
  2. 恢复数据页
  3. 标记 undo log 为已清理

MVCC 用 undo log 的版本链实现快照读：
  purge 线程定期清理不再被任何 Read View 需要的 undo log
```

---

## 七、两阶段提交

```
redo log 和 binlog 的一致性保证：

  1. 写 redo log（prepare 状态）
  2. 写 binlog
  3. 写 redo log（commit 状态）

崩溃恢复：
  - redo log 是 commit → 事务已提交，恢复
  - redo log 是 prepare：
    - binlog 完整 → 事务已提交，恢复
    - binlog 不完整 → 事务未提交，回滚

为什么需要两阶段？
  redo log 用于 InnoDB 崩溃恢复
  binlog 用于主从复制
  两者必须一致，否则主从数据不一致
```

---

## 八、死锁分析

### 8.1 死锁案例

```sql
-- 事务 A
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;  -- 锁 id=1
UPDATE account SET balance = balance + 100 WHERE id = 2;  -- 等待 id=2 的锁

-- 事务 B
BEGIN;
UPDATE account SET balance = balance - 50 WHERE id = 2;   -- 锁 id=2
UPDATE account SET balance = balance + 50 WHERE id = 1;   -- 等待 id=1 的锁

-- 死锁！A 等 B 释放 id=2，B 等 A 释放 id=1
-- InnoDB 检测到死锁后，回滚代价较小的事务
```

### 8.2 查看死锁日志

```sql
SHOW ENGINE INNODB STATUS\G

-- 重点关注 LATEST DETECTED DEADLOCK 部分：
-- *** (1) TRANSACTION: 事务 A 信息
-- *** (1) WAITING FOR THIS LOCK TO BE GRANTED: 等待的锁
-- *** (2) TRANSACTION: 事务 B 信息
-- *** (2) HOLDS THE LOCK(S): 持有的锁
-- *** (2) WAITING FOR THIS LOCK TO BE GRANTED: 等待的锁
-- *** WE ROLL BACK TRANSACTION (2): 回滚了哪个事务
```

### 8.3 死锁预防

```
1. 统一加锁顺序（按主键升序操作）
2. 大事务拆小事务（缩短锁持有时间）
3. 快照读代替当前读（减少加锁）
4. 合理使用索引（避免行锁升级为表锁）
5. 设置锁超时：SET GLOBAL innodb_lock_wait_timeout = 30
```

---

## 九、面试要点

### Q：MVCC 怎么实现的？Read View 的可见性判断规则？

MVCC 通过隐藏字段（trx_id, roll_ptr）+ undo log 版本链 + Read View 实现。事务快照读时生成 Read View，包含当前未提交事务列表 m_ids。对每条记录的 trx_id 判断：小于 min_trx_id 可见，大于等于 max_trx_id 不可见，在 m_ids 中不可见，不在 m_ids 中可见。不可见则沿 undo log 找上一版本继续判断。

### Q：RR 级别如何解决幻读？

- 快照读：通过 MVCC，整个事务复用同一个 Read View，不会看到新插入的数据
- 当前读：通过 Next-Key Lock（Record Lock + Gap Lock），锁定范围间隙，阻止其他事务在范围内插入

### Q：RC 和 RR 的 MVCC 区别？

RC 每次 SELECT 生成新 Read View，能看到已提交的最新数据（不可重复读）。RR 只在第一次 SELECT 生成 Read View，之后复用（可重复读）。

### Q：redo log 和 binlog 有什么区别？

| 维度 | redo log | binlog |
|------|---------|--------|
| 归属 | InnoDB 引擎 | MySQL Server 层 |
| 内容 | 物理日志（页修改） | 逻辑日志（SQL/行变更） |
| 写入 | 循环写（固定大小） | 追加写（文件切换） |
| 用途 | 崩溃恢复 | 主从复制、数据恢复 |

---

## 十、总结

事务核心三件套：

1. **MVCC**：读写不阻塞，RR 复用 Read View 实现可重复读
2. **锁**：当前读加锁，Next-Key Lock 解决幻读
3. **日志**：redo log 保证持久性，undo log 保证原子性 + MVCC，两阶段提交保证一致性

记住：**快照读用 MVCC，当前读用锁，redo log 先写，undo log 串版本链**。
