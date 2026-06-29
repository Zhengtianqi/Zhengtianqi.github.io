---
title: 数据仓库分层：从 ODS 到 ADS 的完整链路
tag: ["ODS", "DWD", "DWS", "ADS"]
category: 数据治理
date: 2026-06-12
---

# 数据仓库分层：从 ODS 到 ADS 的完整链路

> 数据仓库是企业级数据分析的核心，它为决策支持提供了统一、可靠的数据视图。
> 本文介绍了数据仓库的分层架构和设计原则，帮助你构建高质量的数据仓库。

假设你接到一个需求："给业务方出一张用户交易日报"。你写了如下 SQL：

```sql
-- 直接从业务库的订单表关联用户表，加上一堆 CASE WHEN
SELECT
    u.id,
    u.name,
    o.amount,
    CASE WHEN o.status = 1 THEN '已支付'
         WHEN o.status = 2 THEN '已退款'
         WHEN o.status = 0 THEN '待支付'
         ELSE '未知'
    END AS status_desc,
    DATE(o.created_at) AS order_date
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at >= '2026-06-01'
```

一开始还好。但随着需求增多，问题来了：

- **需求2**："再出一张商户维度的交易日报"——同样的 JOIN 逻辑再写一遍
- **需求3**："把订单状态改成从配置表读取"——每张报表都要改
- **需求4**："订单金额要按汇率换算成人民币"——又是一个全局改动
- **需求5**："数据源要切换到从 Kafka 消费的实时流"——所有 SQL 都要重写

最终，你拥有了 50 多个互相复制粘贴的 SQL 查询，任何底层逻辑的变更都是一场灾难。

### 1.2 分层的核心价值

数据仓库分层的本质是**职责分离**（Separation of Concerns）。它解决的是以下问题：

| 问题 | 分层如何解决 |
|------|-------------|
| 重复计算 | 公共逻辑下沉到 DWD/DWS，ADS 层只做组合，不再重复编写清洗逻辑 |
| 变更爆炸 | 底层逻辑变更只需修改 DWD 层的清洗规则，下游自动生效 |
| 口径不一致 | 统一指标定义放在 DWS 层，所有报表引用同一个口径 |
| 依赖混乱 | 严格的分层引用规则（只能上层引用下层）避免循环依赖 |
| 源系统耦合 | ODS 层隔离源系统的变化，下游不受源系统迁移影响 |
| 可维护性差 | 每层职责明确，新人能快速定位应该在哪层修改 |

用一句话概括：**分层是用"一次性"的架构设计成本，换取数据仓库全生命周期的可维护性。**

### 1.3 分层在数据架构中的位置

```
┌──────────────────────────────────────────────────┐
│                   数据应用层                       │
│         报表 / BI看板 / 数据产品 / API             │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│              ADS（应用数据服务层）                  │
│        面向具体应用场景的宽表 / 汇总表              │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│              DWS（数据汇总层）                      │
│        轻度聚合 / 公共指标计算 / 主题宽表           │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│              DWD（数据明细层）                      │
│        数据清洗 / 标准化 / 维度退化 / 事实明细      │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│              ODS（操作数据存储层）                  │
│        原始数据快照 / 不做加工 / 保留历史           │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────┐
│            业务系统 / 日志 / 外部数据源              │
└──────────────────────────────────────────────────┘
```

## 二、ODS（操作数据层）——数据的原始镜像

### 2.1 ODS 的定义

ODS（Operational Data Store，操作数据存储层）是数据仓库的**第一层**，也是离业务系统最近的一层。它的核心原则只有一条：

> **保持数据原样，不做任何加工。**

### 2.2 ODS 的职责

1. **数据接入**：从各种源系统（MySQL、Oracle、MongoDB、Kafka、文件系统）把数据拉进来
2. **格式统一**：不管源是 JSON 还是 CSV，ODS 统一存储为 Hive 表或 Iceberg 表
3. **历史快照**：ODS 通常保留全量历史数据，方便回溯和增量处理
4. **结构保持**：ODS 表的字段名称、类型、顺序尽量与源系统一致

### 2.3 ODS 的数据同步策略

```
同步策略对比：

全量同步（Full Load）：
  - 适用：数据量小（<100万行）、无增量标识的表
  - 方式：每天全量覆盖或全量追加
  - 优点：简单，不依赖源系统改造
  - 缺点：大数据量下资源消耗大

增量同步（Incremental Load）：
  - 适用：有 update_time 字段的表
  - 方式：只同步上次同步后的变更数据
  - 优点：节省资源，同步速度快
  - 缺点：需要处理 UPDATE 和 DELETE

CDC 同步（Change Data Capture）：
  - 适用：对实时性要求高的场景
  - 方式：监听 MySQL Binlog / Oracle Redo Log
  - 优点：准实时，不遗漏变更
  - 缺点：技术复杂度高，需要额外的组件（Canal、Debezium）
```

### 2.4 ODS 表设计示例

```sql
-- ODS 层订单表（全量快照，每日分区）
CREATE TABLE ods_order_info_df (
    id                BIGINT    COMMENT '订单ID',
    order_no          STRING    COMMENT '订单编号',
    user_id           BIGINT    COMMENT '用户ID',
    product_id        BIGINT    COMMENT '产品ID',
    amount            DECIMAL(18,2) COMMENT '订单金额',
    status            INT       COMMENT '订单状态',
    payment_time      STRING    COMMENT '支付时间',
    created_at        STRING    COMMENT '创建时间',
    updated_at        STRING    COMMENT '修改时间',
    etl_time          STRING    COMMENT 'ETL处理时间'
) COMMENT '订单信息全量表'
PARTITIONED BY (dt STRING COMMENT '日期分区，格式 yyyy-MM-dd')
STORED AS PARQUET;

-- ODS 层订单增量表（每日增量）
CREATE TABLE ods_order_info_di (
    id                BIGINT    COMMENT '订单ID',
    order_no          STRING    COMMENT '订单编号',
    -- ... 字段与全量表一致
    type              STRING    COMMENT '操作类型: INSERT/UPDATE/DELETE',
    etl_time          STRING    COMMENT 'ETL处理时间'
) COMMENT '订单信息增量表'
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;
```

### 2.5 ODS 命名的命名规范

```
命名格式：ods_{源系统}_{表名}_{加载方式}

加载方式后缀：
  df = daily full（每日全量）
  di = daily incremental（每日增量）
  rf = real-time full（实时全量）
  ri = real-time incremental（实时增量）

示例：
  ods_mysql_order_info_df     -- MySQL 订单表，每日全量
  ods_mongo_user_profile_df   -- MongoDB 用户画像表，每日全量
  ods_kafka_event_log_ri      -- Kafka 事件日志，实时增量
```

### 2.6 ODS 层的设计原则

1. **不做 JOIN**：ODS 层绝对不做表关联，每个表独立同步
2. **不做类型转换**：保持源系统的字段类型，即使类型不合理（如时间用 STRING 存）
3. **不做过滤**：全量接入，不丢弃任何源数据
4. **要做的是**：加一个 `etl_time` 字段标记入仓时间，加分区字段便于管理
5. **保留原始结构**：如果源表有 50 个字段，ODS 表就有 50 个字段，不多不少

## 三、DWD（明细数据层）——数据的标准化车间

### 3.1 DWD 的定义

DWD（Data Warehouse Detail，数据明细层）是数据仓库的**第二层**，也是工作量最大、最关键的一层。它的任务是把 ODS 的"生数据"加工成"干净、标准、可理解"的明细数据。

DWD 层是数据质量的第一道防线。这一层做不好的后果是：所有上层报表的数据都不准确。

### 3.2 DWD 的职责

```
ODS → DWD 的加工过程：

1. 数据清洗（Data Cleansing）
   ├── 空值处理：把 NULL、空字符串、'N/A' 统一为标准空值
   ├── 脏数据过滤：过滤掉明显的错误数据（如金额为负数、日期为未来）
   ├── 格式标准化：手机号统一为 11 位、日期统一为 yyyy-MM-dd
   └── 重复数据去重：按业务主键去重

2. 数据标准化（Data Standardization）
   ├── 类型转换：STRING → BIGINT/DECIMAL/DATE
   ├── 字典翻译：status=1 → '已支付', type='A' → '普通用户'
   ├── 单位统一：元、万元、美元 → 统一为元
   └── 时区统一：UTC → Asia/Shanghai

3. 维度退化（Dimension Degradation）
   ├── 把常用的维度属性直接 Join 到事实表
   ├── 减少下游 JOIN 操作
   └── 牺牲存储换查询效率
```

### 3.3 DWD 数据清洗实战

```sql
-- DWD 层订单明细表：对 ODS 数据进行清洗加工
INSERT OVERWRITE TABLE dwd_order_detail PARTITION (dt = '${dt}')
SELECT
    -- 1. ID 类字段：BIGINT 转换 + 异常值处理
    CAST(COALESCE(id, -1) AS BIGINT)              AS order_id,

    -- 2. 字符串字段：去除前后空格、统一空字符串为 NULL
    CASE WHEN TRIM(order_no) = '' THEN NULL
         ELSE TRIM(order_no)
    END                                            AS order_no,

    CAST(COALESCE(user_id, -1) AS BIGINT)         AS user_id,
    CAST(COALESCE(product_id, -1) AS BIGINT)      AS product_id,

    -- 3. 金额字段：异常值检查 + 类型转换
    CASE WHEN amount IS NULL OR amount < 0 OR amount > 100000000
         THEN NULL
         ELSE CAST(amount AS DECIMAL(18,2))
    END                                            AS order_amount,

    -- 4. 状态字段：字典翻译
    CASE COALESCE(CAST(ods.status AS INT), -1)
        WHEN 0 THEN '待支付'
        WHEN 1 THEN '已支付'
        WHEN 2 THEN '已取消'
        WHEN 3 THEN '已退款'
        WHEN 4 THEN '已完成'
        ELSE '未知状态'
    END                                            AS order_status,

    -- 5. 时间字段：格式标准化 + NULL 处理
    CASE WHEN ods.payment_time IS NOT NULL
         THEN FROM_UNIXTIME(UNIX_TIMESTAMP(ods.payment_time, 'yyyy-MM-dd HH:mm:ss'))
         ELSE NULL
    END                                            AS payment_time,

    -- 6. 时间字段：字符串转标准时间戳
    COALESCE(
        FROM_UNIXTIME(UNIX_TIMESTAMP(ods.created_at, 'yyyy-MM-dd HH:mm:ss')),
        CAST('1970-01-01 00:00:00' AS TIMESTAMP)
    )                                              AS created_time,

    COALESCE(
        FROM_UNIXTIME(UNIX_TIMESTAMP(ods.updated_at, 'yyyy-MM-dd HH:mm:ss')),
        CAST('1970-01-01 00:00:00' AS TIMESTAMP)
    )                                              AS updated_time

FROM ods_order_info_df ods
WHERE ods.dt = '${dt}';
```

### 3.4 DWD 维度退化示例

维度退化是 DWD 层最常用的优化手段。它把后续分析中几乎必定会用到的维度属性提前关联，避免下游每一张 ADS 表都做同样的 JOIN。

```sql
-- 维度退化后的 DWD 订单明细表
CREATE TABLE dwd_order_detail_denorm (
    -- 事实部分
    order_id        BIGINT        COMMENT '订单ID',
    order_no        STRING        COMMENT '订单编号',
    order_amount    DECIMAL(18,2) COMMENT '订单金额',
    order_status    STRING        COMMENT '订单状态',
    payment_time    TIMESTAMP     COMMENT '支付时间',
    created_time    TIMESTAMP     COMMENT '创建时间',

    -- 退化维度：用户信息
    user_id         BIGINT        COMMENT '用户ID',
    user_name       STRING        COMMENT '用户名',
    user_phone      STRING        COMMENT '用户手机号（脱敏）',
    user_city       STRING        COMMENT '用户所在城市',
    user_level      STRING        COMMENT '用户等级',

    -- 退化维度：产品信息
    product_id      BIGINT        COMMENT '产品ID',
    product_name    STRING        COMMENT '产品名称',
    product_cat     STRING        COMMENT '产品类目',
    product_price   DECIMAL(18,2) COMMENT '产品单价',

    -- 退化维度：商户信息
    merchant_id     BIGINT        COMMENT '商户ID',
    merchant_name   STRING        COMMENT '商户名称'

) COMMENT '订单明细表（维度退化）'
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;
```

### 3.5 DWD 层的命名规范

```
命名格式：dwd_{主题域}_{表名}

主题域建议：
  ord  = 订单域（Order）
  usr  = 用户域（User）
  prd  = 产品域（Product）
  pay  = 支付域（Payment）
  mkt  = 营销域（Marketing）
  log  = 日志域（Log）
  fin  = 财务域（Finance）

示例：
  dwd_ord_order_detail      -- 订单明细表
  dwd_usr_user_info          -- 用户信息表
  dwd_pay_payment_flow       -- 支付流水明细表
  dwd_fin_account_journal    -- 账户流水明细表
```

## 四、DWS（汇总数据层）——公共指标的计算引擎

### 4.1 DWS 的定义

DWS（Data Warehouse Summary，数据汇总层）是数据仓库的**第三层**，负责轻度汇总和公共指标的计算。

如果说 DWD 层是"明细的标准化"，那 DWS 层就是"指标的标准化"。它的目标很明确：**同一份指标，全公司只算一次。**

### 4.2 DWS 的职责

```
DWD → DWS 的加工过程：

1. 轻度聚合
   ├── 按天/周/月汇总用户行为
   ├── 按维度聚合交易金额
   └── 生成中间粒度的统计表

2. 公共指标计算
   ├── 用户留存率
   ├── 客单价（ARPU）
   ├── 复购率
   ├── GMV（成交总额）
   └── 转化率

3. 主题宽表建设
   ├── 用户主题宽表
   ├── 商户主题宽表
   └── 产品主题宽表
```

### 4.3 DWS 用户主题宽表示例

```sql
-- DWS 用户日聚合表
CREATE TABLE dws_usr_user_agg_1d (
    user_id                BIGINT    COMMENT '用户ID',
    user_name              STRING    COMMENT '用户名',
    user_city              STRING    COMMENT '用户所在城市',
    user_level             STRING    COMMENT '用户等级',

    -- 交易指标
    order_cnt              BIGINT    COMMENT '当日下单数',
    order_amount           DECIMAL(18,2) COMMENT '当日下单金额',
    pay_cnt                BIGINT    COMMENT '当日支付笔数',
    pay_amount             DECIMAL(18,2) COMMENT '当日支付金额',
    refund_cnt             BIGINT    COMMENT '当日退款笔数',
    refund_amount          DECIMAL(18,2) COMMENT '当日退款金额',

    -- 活跃指标
    login_cnt              BIGINT    COMMENT '当日登录次数',
    browse_cnt             BIGINT    COMMENT '当日浏览商品数',
    cart_add_cnt           BIGINT    COMMENT '当日加购次数',

    -- 首次/末次
    first_order_date       STRING    COMMENT '首单日期',
    last_order_date        STRING    COMMENT '末单日期',

    -- 累计指标
    total_order_cnt        BIGINT    COMMENT '累计下单数',
    total_order_amount     DECIMAL(18,2) COMMENT '累计下单金额'

) COMMENT '用户日聚合表'
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;
```

```sql
-- DWS 用户日聚合表 ETL 逻辑
INSERT OVERWRITE TABLE dws_usr_user_agg_1d PARTITION (dt = '${dt}')
SELECT
    u.user_id,
    u.user_name,
    u.user_city,
    u.user_level,

    -- 当天订单统计
    COUNT(DISTINCT o.order_id)                         AS order_cnt,
    COALESCE(SUM(o.order_amount), 0)                    AS order_amount,
    COUNT(DISTINCT CASE WHEN o.order_status = '已支付'
                        THEN o.order_id END)           AS pay_cnt,
    COALESCE(SUM(CASE WHEN o.order_status = '已支付'
                      THEN o.order_amount END), 0)     AS pay_amount,
    COUNT(DISTINCT CASE WHEN o.order_status = '已退款'
                        THEN o.order_id END)           AS refund_cnt,
    COALESCE(SUM(CASE WHEN o.order_status = '已退款'
                      THEN o.order_amount END), 0)     AS refund_amount,

    -- 当天行为统计
    COUNT(DISTINCT CASE WHEN b.event_type = 'login'
                        THEN b.event_id END)           AS login_cnt,
    COUNT(DISTINCT CASE WHEN b.event_type = 'browse'
                        THEN b.event_id END)           AS browse_cnt,
    COUNT(DISTINCT CASE WHEN b.event_type = 'add_cart'
                        THEN b.event_id END)           AS cart_add_cnt,

    -- 累计指标（从 T-1 继承）
    COALESCE(hist.total_order_cnt, 0) + COUNT(DISTINCT o.order_id) AS total_order_cnt,
    COALESCE(hist.total_order_amount, 0) + COALESCE(SUM(o.order_amount), 0) AS total_order_amount

FROM dwd_user_info u
LEFT JOIN dwd_order_detail_denorm o
    ON u.user_id = o.user_id AND o.dt = '${dt}'
LEFT JOIN dwd_user_behavior b
    ON u.user_id = b.user_id AND b.dt = '${dt}'
LEFT JOIN (
    SELECT user_id,
           total_order_cnt,
           total_order_amount
    FROM dws_usr_user_agg_1d
    WHERE dt = DATE_SUB('${dt}', 1)
) hist ON u.user_id = hist.user_id
GROUP BY u.user_id, u.user_name, u.user_city, u.user_level,
         hist.total_order_cnt, hist.total_order_amount;
```

### 4.4 DWS 层的命名规范

```
命名格式：dws_{主题域}_{表名}_{时间粒度}

时间粒度：
  1d  = 天粒度
  1w  = 周粒度
  1m  = 月粒度
  nd  = N天粒度（如 7d, 30d）

示例：
  dws_usr_user_agg_1d       -- 用户日聚合
  dws_ord_merchant_agg_1d   -- 商户日聚合
  dws_trade_gmv_agg_1m      -- 月GMV汇总
```

### 4.5 DWS 层的设计原则

1. **公共性**：只放全公司共用的指标，不要放某个报表专用的
2. **可复用**：DWS 表设计时考虑多场景复用，不为一时的方便而添加特殊逻辑
3. **指标一致**：每个指标有且仅有一个计算口径，所有下游引用都来源于 DWS
4. **适度冗余**：允许一定的数据冗余来换取查询效率（如同时存日/周/月聚合）
5. **不存明细**：DWS 层没有明细数据，如果需要明细请去 DWD 层

## 五、ADS（应用数据层）——业务价值的最后一公里

### 5.1 ADS 的定义

ADS（Application Data Service，应用数据层）是数据仓库的**最上层**，直接面向具体的数据产品和业务应用。

ADS 的核心定位是：**根据具体的应用场景，从下层（DWD、DWS）组合数据，输出"应用就绪"的数据。**

### 5.2 ADS 与其他层的区别

```
DWS 层的 GMV 计算：
  SELECT SUM(order_amount) FROM dws_trade_gmv_agg_1d
  → 所有人查都是同一个结果

ADS 层的 GMV 报表：
  SELECT
      merchant_name,
      SUM(order_amount) AS gmv,
      SUM(order_amount) / COUNT(DISTINCT user_id) AS arpu,
      (SUM(CASE WHEN dt >= '${wow_start}' THEN order_amount END)
      / NULLIF(SUM(CASE WHEN dt >= '${wow_base_start}'
                        AND dt < '${wow_start}' THEN order_amount END), 0) - 1)
      AS wow_growth_rate  -- 环比增长率
  FROM ...
  → 这张报表可能只是某次周会用的
```

简单理解：**DWS 是"被调用的函数库"，ADS 是"函数被调用的结果"。**

### 5.3 ADS 的典型形态

```
ADS 常见形态：

1. 报表宽表
   - 运营日报：GMV、订单量、转化率、新增用户
   - 风控报表：异常交易、高风险用户、规则命中率
   - 财务对账表：收入汇总、退款汇总、手续费

2. 数据接口
   - 用户画像接口：标签 + 分群
   - 推荐特征：用户-商品交互矩阵
   - 实时大屏：核心指标 + 地图 + 趋势图

3. 数据推送
   - 邮件报表：每日经营数据
   - 钉钉/企微机器人推送
   - 文件导出：CSV 给运营、Excel 给财务

4. 分析宽表
   - 留存分析宽表：用户 N 日留存
   - 漏斗分析宽表：各环节转化率
   - 归因分析宽表：渠道归因明细
```

### 5.4 ADS 日报表示例

```sql
-- ADS 运营日报
CREATE TABLE ads_report_operation_daily (
    report_date              STRING    COMMENT '报表日期',

    -- 核心指标
    gmv                      DECIMAL(18,2) COMMENT '成交总额',
    order_cnt                BIGINT    COMMENT '订单数',
    pay_rate                 DECIMAL(5,4) COMMENT '支付转化率',
    avg_order_amount         DECIMAL(18,2) COMMENT '客单价',

    -- 用户指标
    new_user_cnt             BIGINT    COMMENT '新增用户数',
    active_user_cnt          BIGINT    COMMENT '活跃用户数',
    pay_user_cnt             BIGINT    COMMENT '支付用户数',
    arpu                     DECIMAL(18,2) COMMENT 'ARPU',
    arppu                    DECIMAL(18,2) COMMENT 'ARPPU',

    -- 同比/环比
    gmv_dod                  DECIMAL(18,4) COMMENT 'GMV日环比',
    gmv_wow                  DECIMAL(18,4) COMMENT 'GMV周同比',
    order_cnt_dod            DECIMAL(18,4) COMMENT '订单量日环比',

    -- 渠道拆解
    channel_name             STRING    COMMENT '渠道名称',
    channel_gmv              DECIMAL(18,2) COMMENT '渠道GMV',
    channel_order_cnt        BIGINT    COMMENT '渠道订单数',

    -- 商户维度
    top_merchant_name        STRING    COMMENT 'GMV最高商户',
    top_merchant_gmv         DECIMAL(18,2) COMMENT '最高商户GMV'

) COMMENT '运营日报'
PARTITIONED BY (dt STRING COMMENT '日期分区')
STORED AS PARQUET;
```

### 5.5 ADS 命名规范

```
命名格式：ads_{应用场景}_{表名}

应用场景前缀：
  report = 报表
  api    = 数据接口
  push   = 数据推送
  screen = 大屏
  ml     = 机器学习

示例：
  ads_report_operation_daily        -- 运营日报
  ads_api_user_portrait             -- 用户画像接口表
  ads_screen_realtime_monitor       -- 实时监控大屏
  ads_ml_user_behavior_feature     -- 机器学习特征宽表
```

### 5.6 层级引用规则（铁律）

```
┌──────────────────────────────────────────────┐
│              引用规则                          │
│                                              │
│  ADS  ← 可以引用 → DWS, DWD, ODS             │
│  DWS  ← 可以引用 → DWD, ODS                  │
│  DWD  ← 可以引用 → ODS                       │
│  ODS  ← 禁止引用 → 任何数据仓库表             │
│                                              │
│  绝对禁止：                                   │
│  ✗ ADS 引用 ADS（平级引用）                   │
│  ✗ DWS 引用 ADS（反向引用）                   │
│  ✗ DWD 引用 DWS（跨层反向引用）               │
│  ✗ 任何层引用未在本层定义的临时表              │
└──────────────────────────────────────────────┘
```

## 六、实战案例：担保业务的数据分层设计

### 6.1 业务背景

某担保公司的核心业务是为中小企业的银行贷款提供担保服务。主要业务流程：

```
企业申请 → 风控审批 → 签订担保合同 → 银行放款 → 企业还款 → 担保终结
```

涉及的核心实体：企业、担保合同、反担保措施、保后检查记录。

### 6.2 ODS 层设计

```sql
-- ODS 层：直接从业务系统同步

-- 企业信息表（从核心系统 MySQL 全量同步）
CREATE TABLE ods_core_corp_info_df (
    corp_id           STRING  COMMENT '企业ID',
    corp_name         STRING  COMMENT '企业名称',
    credit_code       STRING  COMMENT '统一社会信用代码',
    legal_person      STRING  COMMENT '法定代表人',
    registered_capital DECIMAL(18,2) COMMENT '注册资本',
    corp_status       STRING  COMMENT '企业状态',
    created_at        STRING  COMMENT '创建时间',
    updated_at        STRING  COMMENT '更新时间',
    etl_time          STRING  COMMENT '入仓时间'
) PARTITIONED BY (dt STRING) STORED AS PARQUET;

-- 担保合同表
CREATE TABLE ods_core_guarantee_contract_df (
    contract_id       STRING  COMMENT '合同ID',
    contract_no       STRING  COMMENT '合同编号',
    corp_id           STRING  COMMENT '企业ID',
    bank_id           STRING  COMMENT '银行ID',
    guarantee_amount  DECIMAL(18,2) COMMENT '担保金额',
    guarantee_rate    DECIMAL(5,4) COMMENT '担保费率',
    sign_date         STRING  COMMENT '签订日期',
    expire_date       STRING  COMMENT '到期日期',
    contract_status   STRING  COMMENT '合同状态',
    etl_time          STRING  COMMENT '入仓时间'
) PARTITIONED BY (dt STRING) STORED AS PARQUET;

-- 还款记录表（增量同步）
CREATE TABLE ods_core_repayment_flow_di (
    flow_id           STRING  COMMENT '流水ID',
    contract_id       STRING  COMMENT '合同ID',
    repayment_amount  DECIMAL(18,2) COMMENT '还款金额',
    repayment_date    STRING  COMMENT '还款日期',
    repayment_type    STRING  COMMENT '还款类型：本金/利息/罚息',
    created_at        STRING  COMMENT '创建时间',
    type              STRING  COMMENT 'INSERT/UPDATE/DELETE',
    etl_time          STRING  COMMENT '入仓时间'
) PARTITIONED BY (dt STRING) STORED AS PARQUET;
```

### 6.3 DWD 层设计

```sql
-- DWD 层：数据清洗 + 维度退化

-- 担保合同明细表（维度退化）
CREATE TABLE dwd_guarantee_contract_detail (
    -- 合同信息
    contract_id         STRING      COMMENT '合同ID',
    contract_no         STRING      COMMENT '合同编号',
    guarantee_amount    DECIMAL(18,2) COMMENT '担保金额（万元）',
    guarantee_rate      DECIMAL(5,4) COMMENT '担保费率',
    sign_date           DATE        COMMENT '签订日期',
    expire_date         DATE        COMMENT '到期日期',
    contract_status     STRING      COMMENT '合同状态：在保/到期/追偿',

    -- 退化维度：企业信息
    corp_id             STRING      COMMENT '企业ID',
    corp_name           STRING      COMMENT '企业名称',
    credit_code         STRING      COMMENT '统一社会信用代码',
    legal_person        STRING      COMMENT '法定代表人',
    registered_capital  DECIMAL(18,2) COMMENT '注册资本（万元）',
    corp_scale          STRING      COMMENT '企业规模：大型/中型/小型/微型',

    -- 退化维度：银行信息
    bank_id             STRING      COMMENT '银行ID',
    bank_name           STRING      COMMENT '银行名称',

    -- 退化维度：担保期限
    guarantee_days      INT         COMMENT '担保天数',
    is_expired          STRING      COMMENT '是否到期：是/否'
) PARTITIONED BY (dt STRING) STORED AS PARQUET;
```

### 6.4 DWS 层设计

```sql
-- DWS 担保业务日聚合表
CREATE TABLE dws_guarantee_biz_agg_1d (
    dt                      STRING      COMMENT '统计日期',

    -- 在保情况
    active_contract_cnt     BIGINT      COMMENT '在保合同数',
    active_guarantee_amount DECIMAL(18,2) COMMENT '在保余额（万元）',
    active_corp_cnt         BIGINT      COMMENT '在保企业数',

    -- 新增情况
    new_contract_cnt        BIGINT      COMMENT '新增合同数',
    new_guarantee_amount    DECIMAL(18,2) COMMENT '新增担保额（万元）',

    -- 到期情况
    expired_contract_cnt    BIGINT      COMMENT '到期合同数',
    expired_guarantee_amount DECIMAL(18,2) COMMENT '到期担保额（万元）',

    -- 风险指标
    overdue_contract_cnt    BIGINT      COMMENT '逾期合同数',
    overdue_amount          DECIMAL(18,2) COMMENT '逾期金额（万元）',
    overdue_rate            DECIMAL(5,4) COMMENT '逾期率',

    -- 收入指标
    guarantee_fee_income    DECIMAL(18,2) COMMENT '担保费收入（万元）',
    penalty_income          DECIMAL(18,2) COMMENT '罚息收入（万元）'

) COMMENT '担保业务日聚合'
PARTITIONED BY (dt STRING) STORED AS PARQUET;
```

### 6.5 ADS 层设计

```sql
-- ADS 风控日报
CREATE TABLE ads_report_risk_daily (
    report_date               STRING      COMMENT '报表日期',

    -- 整体风险
    total_guarantee_amount    DECIMAL(18,2) COMMENT '担保总额',
    overdue_amount            DECIMAL(18,2) COMMENT '逾期总额',
    overdue_rate              DECIMAL(5,4) COMMENT '逾期率',
    claim_amount              DECIMAL(18,2) COMMENT '代偿金额',
    claim_rate                DECIMAL(5,4) COMMENT '代偿率',

    -- 按企业规模拆分
    large_corp_overdue_rate   DECIMAL(5,4) COMMENT '大型企业逾期率',
    mid_corp_overdue_rate     DECIMAL(5,4) COMMENT '中型企业逾期率',
    small_corp_overdue_rate   DECIMAL(5,4) COMMENT '小型企业逾期率',

    -- 按银行拆分
    bank_name                 STRING      COMMENT '银行名称',
    bank_overdue_amount       DECIMAL(18,2) COMMENT '该银行逾期金额',
    bank_overdue_rate         DECIMAL(5,4) COMMENT '该银行逾期率',

    -- 集中度风险
    top5_corp_guarantee_ratio DECIMAL(5,4) COMMENT '前5大企业担保集中度',
    single_max_guarantee      DECIMAL(18,2) COMMENT '单户最大担保额',
    single_max_ratio          DECIMAL(5,4) COMMENT '单户集中度'

) COMMENT '风控日报'
PARTITIONED BY (dt STRING) STORED AS PARQUET;
```

### 6.6 数据流向总览

```
担保业务数据分层流向：

  核心业务系统 (MySQL)
       │
       ▼
  ODS: ods_core_corp_info_df         ── 全量快照
       ods_core_guarantee_contract_df ── 全量快照
       ods_core_repayment_flow_di     ── 增量同步
       │
       ▼ 清洗 + 维度退化
  DWD: dwd_guarantee_contract_detail ── 担保合同明细宽表
       │
       ▼ 聚合计算
  DWS: dws_guarantee_biz_agg_1d      ── 担保业务日聚合
       │
       ▼ 场景加工
  ADS: ads_report_risk_daily          ── 风控日报
       ads_report_operation_daily     ── 运营日报
       ads_screen_guarantee_monitor   ── 担保监控大屏
```

## 七、ETL vs ELT：数据分层视角下的技术选型

### 7.1 ETL 和 ELT 的区别

```
ETL (Extract → Transform → Load)：
  源系统 → 抽取 → 在 ETL 工具中转换 → 加载到数据仓库

ELT (Extract → Load → Transform)：
  源系统 → 抽取 → 直接加载到数据仓库 → 在数据仓库中用 SQL 转换
```

### 7.2 从分层角度看选择

```
层 → 更适合的方式 → 原因

ODS: ETL/ELT 均可
  → 如果使用 DataX/Sqoop 直接从 MySQL 抽数，ETL
  → 如果使用 Flink CDC 直接消费 Binlog，ELT

DWD: 偏 ELT
  → 清洗逻辑用 SQL 在数仓中完成，比 ETL 工具更灵活
  → 复杂清洗（JSON 解析、非结构化处理）建议在 ETL 环节完成

DWS: 纯 ELT
  → 聚合计算、窗口函数在数仓中效率更高
  → MPP 引擎（Doris/ClickHouse）可以直接加速

ADS: 混合
  → 简单宽表加工：ELT
  → 复杂特征工程：在 ETL 环节用 Python/Spark 完成
```

### 7.3 实践建议

```
推荐策略：ETL 做"脏活累活"，ELT 做"精细加工"

ETL 环节处理：
  - JSON 解析、正则表达式提取
  - 非结构化数据解析（日志、埋点）
  - 复杂加密/解密
  - 多源异构数据合并
  - 实时流处理

ELT 环节处理：
  - 维度退化、JOIN 操作
  - 聚合计算、窗口函数
  - 字典映射、标准化
  - 数据质量检查
```

## 八、常见反模式

### 8.1 反模式一：层数过多

```
反面案例：
  ODS → STG → DWD → DWB → MID → DWS → DIM → ADS
  （7 层，每层都要维护，每次加字段都要改 7 个表的 DDL）

正确做法：
  ODS → DWD → DWS → ADS
  （4 层足够覆盖 90% 的场景）

原则：
  每增加一层，都要回答一个问题：
  "这一层解决了什么问题？没有它行不行？"
```

### 8.2 反模式二：跨层引用

```sql
-- ❌ 反面案例：ADS 直接引用 ODS 层
CREATE TABLE ads_xxx AS
SELECT ...
FROM ods_core_order_info_df a        -- 直接引用 ODS
JOIN dwd_order_detail b ON ...        -- 又引用 DWD
JOIN dws_user_agg_1d c ON ...         -- 还引用 DWS
```

**问题**：
1. ODS 的脏数据直接进入 ADS，数据质量无人把关
2. ODS 字段变更（如 `amount` 改成 `order_amount`），ADS 报表直接报错
3. 如果有 10 张 ADS 表都直接引用 ODS，字段变更要改 10 处

**正确做法**：一切数据必须经过 DWD 清洗后使用。

### 8.3 反模式三：ODS 层做加工

```
反面案例：
  ODS 同学觉得反正要同步，顺手做了数据清洗：
  "我把 NULL 转成 0 了，方便下游使用"

问题：
  - 源系统数据的 NULL 是有业务含义的
  - 下游不同场景对 NULL 的处理方式不同
  - 数据回溯时，NULL vs 0 的区别无法还原
  - 破坏了分层隔离原则
```

### 8.4 反模式四：DWS 过于明细

```
反面案例：
  DWS 表包含了每条订单的明细数据
  → DWS 表行数 = DWD 表行数
  → 失去了"汇总"的意义

判别标准：
  DWS 表的数据量应该远小于同期的 DWD 表
  如果两者行数接近，说明 DWS 设计有问题
```

### 8.5 反模式五：DWD 直接面向报表

```
反面案例：
  开发人员为了省事，直接让 BI 工具查询 DWD 明细表
  SELECT SUM(amount) FROM dwd_order_detail WHERE dt = '2026-06-01'

短期看：开发量小
长期看：
  - 每个 BI 报表都在重复计算 SUM
  - 如果有 20 个报表，SUM 算了 20 次
  - 口径不统一（有的加了退款过滤，有的没加）
```

## 九、与 Hive/Spark 的结合实践

### 9.1 ODS 层的数据装载（Spark）

```scala
// Spark 作业：从 MySQL 同步到 Hive ODS
import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder()
  .appName("ODS_Sync_Order_Info")
  .enableHiveSupport()
  .getOrCreate()

// 读取 MySQL 数据
val df = spark.read
  .format("jdbc")
  .option("url", "jdbc:mysql://10.0.1.100:3306/trade_db")
  .option("dbtable", "order_info")
  .option("user", "data_sync")
  .option("password", "xxx")
  .option("fetchsize", "10000")
  .load()

// 添加 ETL 时间戳
val result = df.withColumn("etl_time", current_timestamp())

// 写入 ODS 表
result.write
  .mode("overwrite")
  .partitionBy("dt")
  .format("parquet")
  .saveAsTable("ods_mysql_order_info_df")

spark.stop()
```

### 9.2 DWD 层的 SQL 调度（Hive + Airflow）

```sql
-- DWD 层 ETL，在 Airflow 中作为 HiveOperator 调度
-- 文件名：dwd_order_detail.sql

-- 设置参数
SET hive.exec.dynamic.partition=true;
SET hive.exec.dynamic.partition.mode=nonstrict;
SET hive.exec.parallel=true;

-- 执行 DWD 加工
INSERT OVERWRITE TABLE dwd_order_detail_denorm
PARTITION (dt = '${dt}')
SELECT
    o.order_id,
    o.order_no,
    o.order_amount,
    o.order_status,
    o.payment_time,
    -- 用户维度退化
    u.user_name,
    u.user_city,
    u.user_level,
    -- 产品维度退化
    p.product_name,
    p.product_cat,
    -- 商户维度退化
    m.merchant_name
FROM ods_mysql_order_info_df o
LEFT JOIN ods_mysql_user_info_df u
    ON o.user_id = u.user_id AND u.dt = '${dt}'
LEFT JOIN ods_mysql_product_info_df p
    ON o.product_id = p.product_id AND p.dt = '${dt}'
LEFT JOIN ods_mysql_merchant_info_df m
    ON o.merchant_id = m.merchant_id AND m.dt = '${dt}'
WHERE o.dt = '${dt}';
```

### 9.3 数据质量监控（Spark SQL）

```scala
// DWD 层数据质量检查
def checkDWDQuality(spark: SparkSession, dt: String): Unit = {
  import spark.implicits._

  // 检查空值率
  val nullCheck = spark.sql(s"""
    SELECT
      SUM(CASE WHEN order_id IS NULL THEN 1 ELSE 0 END) / COUNT(1) AS order_id_null_rate,
      SUM(CASE WHEN user_name IS NULL THEN 1 ELSE 0 END) / COUNT(1) AS user_name_null_rate,
      SUM(CASE WHEN order_amount IS NULL THEN 1 ELSE 0 END) / COUNT(1) AS amount_null_rate
    FROM dwd_order_detail_denorm
    WHERE dt = '$dt'
  """).collect()(0)

  // 告警阈值
  val orderIdNullRate = nullCheck.getDouble(0)
  val amountNullRate = nullCheck.getDouble(2)

  if (orderIdNullRate > 0.01) {
    throw new RuntimeException(s"DWD 数据质量异常: order_id 空值率 $orderIdNullRate")
  }

  if (amountNullRate > 0.05) {
    throw new RuntimeException(s"DWD 数据质量异常: amount 空值率 $amountNullRate")
  }

  // 检查数据量波动
  val todayCnt = spark.sql(
    s"SELECT COUNT(1) FROM dwd_order_detail_denorm WHERE dt = '$dt'"
  ).collect()(0).getLong(0)

  val yesterdayDt = java.time.LocalDate.parse(dt).minusDays(1).toString
  val yesterdayCnt = spark.sql(
    s"SELECT COUNT(1) FROM dwd_order_detail_denorm WHERE dt = '$yesterdayDt'"
  ).collect()(0).getLong(0)

  if (yesterdayCnt > 0) {
    val ratio = todayCnt.toDouble / yesterdayCnt.toDouble
    if (ratio < 0.5 || ratio > 2.0) {
      throw new RuntimeException(
        s"DWD 数据量波动异常: 今日${todayCnt} / 昨日${yesterdayCnt} = $ratio"
      )
    }
  }
}
```

### 9.4 分层架构下的性能优化

```sql
-- Hive 表存储格式建议

-- ODS 层：列式存储 + ZSTD 压缩（平衡读写）
CREATE TABLE ods_xxx (...) STORED AS PARQUET
TBLPROPERTIES ('parquet.compression'='ZSTD');

-- DWD 层：ORC 格式 + 按高频过滤字段排序（加速查询）
CREATE TABLE dwd_xxx (...) STORED AS ORC
TBLPROPERTIES ('orc.compress'='ZSTD', 'orc.bloom.filter.columns'='user_id,order_status');

-- DWS 层：小表用 ORC，大表考虑使用 Iceberg（支持 upsert）
CREATE TABLE dws_xxx (...) STORED AS ORC
TBLPROPERTIES ('orc.compress'='ZSTD');

-- ADS 层：考虑使用物化视图或 ClickHouse/Doris 加速
-- 高频查询的 ADS 表可以同步到 OLAP 引擎
```

### 9.5 增量处理与全量回溯

```scala
// Spark 增量处理示例：DWD 层只处理当日增量
def incrementalProcess(spark: SparkSession, dt: String): Unit = {
  import spark.implicits._

  // 1. 读取 ODS 当日增量
  val odsIncr = spark.table("ods_order_info_di").where($"dt" === dt)

  // 2. 读取 T-1 日 DWD 快照
  val yesterdayDt = java.time.LocalDate.parse(dt).minusDays(1).toString
  val dwdPrev = spark.table("dwd_order_detail")
    .where($"dt" === yesterdayDt)

  // 3. 分离增删改
  val inserts = odsIncr.where($"type" === "INSERT")
  val updates = odsIncr.where($"type" === "UPDATE")
  val deletes = odsIncr.where($"type" === "DELETE")

  // 4. 合并生成新快照
  val dwdCurrent = dwdPrev
    .join(deletes.select("id"), Seq("id"), "left_anti")   // 删除
    .unionByName(updates.select(dwdPrev.columns.map(col): _*)) // 更新
    .unionByName(inserts.select(dwdPrev.columns.map(col): _*)) // 新增

  dwdCurrent.write
    .mode("overwrite")
    .partitionBy("dt")
    .format("orc")
    .saveAsTable("dwd_order_detail")
}
```

## 十、总结

### 10.1 四层架构速查表

| 层级 | 中文名 | 核心职责 | 关键原则 | 常见错误 |
|------|--------|---------|---------|----------|
| ODS | 操作数据层 | 存储源系统原始数据 | 不做任何加工，保持原样 | 顺手做数据清洗 |
| DWD | 明细数据层 | 数据清洗、标准化、维度退化 | 确保数据质量，统一口径 | 质量检查缺失 |
| DWS | 汇总数据层 | 公共指标计算、轻度聚合 | 一份指标只算一次 | 过于明细或过于定制 |
| ADS | 应用数据层 | 面向具体业务场景 | 基于下层组合，不重复加工 | 直接引 ODS/DWD 计算 |

### 10.2 实施建议

1. **从 ODS 开始**：先搭 ODS 层，把数据接入就成功了一半
2. **DWD 要重视**：这是数据质量的生命线，投入再多时间都值得
3. **DWS 是分水岭**：DWS 建设的质量决定了数据团队是"取数工"还是"分析师"
4. **ADS 要克制**：ADS 表会不断膨胀，定期清理不再使用的表
5. **分层不是教条**：小团队可以从 3 层开始（ODS → DWD → ADS），随规模增长再引入 DWS
6. **命名规范强制执行**：在代码审查中作为硬性要求

### 10.3 一句话总结

> 数据仓库分层，本质上是在**用空间换时间、用存储换可维护性、用前期设计换后期省心**。这不是银弹，但它是业界验证过的最佳实践。别等到被 50 个互相复制的 SQL 困住的时候，才开始思考分层的问题。

*本文是数据仓库分层系列的入门篇，后续我们将深入探讨维度建模、数据质量、元数据管理等主题。*
