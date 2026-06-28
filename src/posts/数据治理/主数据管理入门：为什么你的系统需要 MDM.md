---
title: 主数据管理入门：为什么你的系统需要 MDM
tag: ["数据治理", "主数据", "交易数据", "元数据"]
category: 数据治理
date: 2026-06-12
---

# 主数据管理入门：为什么你的系统需要 MDM

> 主数据管理入门：为什么你的系统需要 MDM是一个重要的技术主题，它在现代软件开发中扮演着关键角色。
> 本文系统介绍了主数据管理入门：为什么你的系统需要 MDM的核心概念和实践经验，帮助你深入理解这一技术领域。

**主数据（Master Data）** 是企业中描述核心业务实体的数据，是跨业务系统共享的、相对稳定的基础数据。

简单说：主数据是企业的"名词"——客户是谁、产品是什么、供应商有哪些、组织架构如何。

```
企业数据全景图：

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   主数据      │  │  交易数据     │  │   元数据      │
│ (Master Data)│  │(Transaction)  │  │ (Metadata)   │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ 客户信息      │  │ 订单记录      │  │ 表结构定义    │
│ 产品信息      │  │ 支付流水      │  │ 字段说明      │
│ 供应商信息    │  │ 物流轨迹      │  │ 数据字典      │
│ 组织架构      │  │ 库存变动      │  │ 血缘关系      │
│ 员工信息      │  │ 登录日志      │  │ 质量规则      │
│ 会计科目      │  │ 审批记录      │  │ 指标口径      │
│ 地址/区域     │  │ 积分明细      │  │ 标签体系      │
└──────────────┘  └──────────────┘  └──────────────┘
  相对稳定         高频变化           描述数据的数据
  低频更新         不可修改           相对稳定
```

### 1.2 三类数据的区别

| 维度 | 主数据 | 交易数据 | 元数据 |
|------|--------|----------|--------|
| 本质 | 业务实体 | 业务活动 | 数据描述 |
| 变化频率 | 低（月/年） | 高（秒/分） | 低 |
| 生命周期 | 长期存在 | 创建后不变 | 随模型变化 |
| 举例 | 客户名称、产品规格 | 订单金额、支付时间 | 字段类型、表注释 |
| 共享范围 | 全企业 | 业务域内 | 数据团队 |
| 管理重点 | 一致性、唯一性 | 准确性、完整性 | 标准化、文档化 |

### 1.3 主数据的核心领域

```
企业主数据通常涵盖以下领域：

1. 客户主数据（Customer Master）
   - 企业客户：公司名称、统一社会信用代码、注册地址
   - 个人客户：姓名、身份证号、手机号

2. 产品主数据（Product Master）
   - SKU、规格、型号、品牌、类目

3. 供应商主数据（Supplier Master）
   - 供应商名称、资质、银行账户、联系人

4. 组织主数据（Organization Master）
   - 公司、部门、岗位、成本中心

5. 员工主数据（Employee Master）
   - 工号、姓名、职级、入职日期

6. 财务主数据（Finance Master）
   - 会计科目、币种、汇率、利润中心

7. 位置主数据（Location Master）
   - 国家、省份、城市、仓库、门店
```

## 二、主数据管理的核心问题

### 2.1 数据孤岛问题

在大型企业中，一个业务实体往往存在于多个系统中：

```
同一个客户"张三科技有限公司"在不同系统中的样子：

CRM 系统:               ERP 系统:
  客户ID: C001            客户ID: 1000234
  名称: 张三科技           名称: 张三科技有限公司
  等级: VIP              信用额度: 500万
  销售: 王经理            结算方式: 月结30天

合同系统:               售后系统:
  客户ID: ZS-2024-001    客户ID: AFT-100234
  名称: 张三科技有限      名称: 张三科技(深圳)
  签约金额: 200万         服务等级: SLA-1
  到期日: 2026-12-31      工单数: 156
```

**问题清单**：
- 一个实体有 4 个不同的 ID，无法关联
- 同样的客户有 4 个不同的名称
- 没有一个系统拥有客户的完整视图
- 统计"全公司的前十大客户"，需要人工整合 4 个系统的数据
- 客户信息变更时（如更名、迁址），需要在 4 个系统中分别更新

### 2.2 标准不统一问题

```
数据标准不统一的表现：

1. 编码不一致
   - 系统A: 使用自增ID作为客户编号
   - 系统B: 使用"地区+序列号"规则
   - 系统C: 使用统一社会信用代码

2. 分类不一致
   - 系统A: 客户分为"企业客户/个人客户"
   - 系统B: 客户分为"大客户/中小客户/个人"
   - 系统C: 客户分为"VIP/普通/潜在"

3. 粒度不一致
   - 系统A: 一个客户一条记录
   - 系统B: 一个客户按分公司拆分多条记录

4. 命名不一致
   - 同一字段叫 customer_name / custName / CUSTOMER_NAME
   - 同一状态叫 "已激活" / "ACTIVE" / 1
```

### 2.3 主数据管理要解决的三个核心问题

```
问题一：身份识别（Identity Resolution）
  → 同一个实体在不同系统中如何识别为同一个？
  → 解决方案：主数据唯一标识 + 匹配规则 + 人工确认

问题二：数据同步（Data Synchronization）
  → 主数据变更后如何同步到所有消费系统？
  → 解决方案：发布-订阅模式，推拉结合

问题三：数据治理（Data Governance）
  → 谁负责维护主数据？变更流程是什么？
  → 解决方案：数据所有权、数据管家、审批流程
```

## 三、MDM 四种架构模式

### 3.1 注册式（Registry Style）

```
┌─────────────────────────────────────┐
│            MDM 注册中心              │
│     只存储关联关系，不存储属性       │
├─────────────────────────────────────┤
│ 全局ID  │ 系统A_ID │ 系统B_ID │系统C_ID │
│ MD001   │ C001     │ 1000234  │ ZS-001  │
└────┬────┴────┬─────┴────┬─────┴────┬────┘
     │         │          │          │
┌────▼──┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ CRM   │ │ ERP   │ │ 合同  │ │ 售后  │
│ C001  │ │1000234│ │ZS-001 │ │AFT-.. │
└───────┘ └───────┘ └───────┘ └───────┘
```

**特点**：
- MDM 系统只维护全局标识符与各系统本地 ID 的映射关系
- 数据属性仍然分散在各源系统中
- 查询时通过全局 ID 从各系统实时拉取属性拼装

**适用场景**：系统数量少、对实时性要求不高、不想改变现有系统

**优点**：实施成本最低，侵入性最小
**缺点**：性能差（每次查询要跨系统调用），数据质量无改善

### 3.2 共存式（Coexistence Style）

```
┌─────────────────────────────────────┐
│            MDM 中心                  │
│   存储全局ID + 核心属性（黄金记录）   │
├─────────────────────────────────────┤
│ 全局ID: MD001                       │
│ 名称: 张三科技有限公司（标准名）      │
│ 信用代码: 91440300MA5XXXXXX         │
│ 状态: 正常                          │
│ 等级: VIP                           │
└────┬─────┬─────┬─────┬──────────────┘
     │     │     │     │  核心属性同步到MDM
┌────▼──┐ ┌▼────┐ ┌▼────┐ ┌▼────┐
│ CRM   │ │ ERP │ │合同 │ │售后  │
│ C001  │ │1000 │ │ZS.. │ │AFT..│
│(属性) │ │(属性│ │(属性│ │(属性│
└───────┘ └─────┘ └─────┘ └──────┘
```

**特点**：
- MDM 存储核心属性的"黄金记录"（经治理的最权威版本）
- 各源系统仍然保留自己的副本
- 源系统与 MDM 之间双向同步核心属性

**适用场景**：希望逐步改善数据质量的企业

**优点**：部分改善数据质量，比集中式灵活
**缺点**：数据仍存在多份副本，同步冲突较难处理

### 3.3 集中式（Centralized Style）

```
┌─────────────────────────────────────┐
│            MDM 中心                  │
│   存储所有主数据（唯一权威数据源）    │
├─────────────────────────────────────┤
│ 全局ID   │ 名称    │ 信用代码 │ ...  │
│ MD001    │ 张三科技│ 9144... │ ...  │
│ MD002    │ 李四集团│ 9155... │ ...  │
└────┬─────┬─────┬─────┬──────────────┘
     │     │     │     │  所有系统从 MDM 获取数据
┌────▼──┐ ┌▼────┐ ┌▼────┐ ┌▼────┐
│ CRM   │ │ ERP │ │合同 │ │售后  │
│只存ID │ │只存ID│ │只存ID│ │只存ID│
└───────┘ └─────┘ └─────┘ └───────┘
```

**特点**：
- MDM 是唯一的主数据权威来源
- 各业务系统不再维护主数据属性，只存储 MDM 返回的全局 ID
- 所有主数据变更都必须在 MDM 中发起

**适用场景**：新建系统、对数据质量要求极高的企业

**优点**：数据质量最高，一致性最好
**缺点**：实施成本最高，对现有系统改造量大，单点性能瓶颈

### 3.4 融合式（Consolidated Style）

```
┌────────────────────────────────────────────────┐
│                MDM 中心                         │
│   存储全局ID + 全量属性（从各系统融合而来）      │
├────────────────────────────────────────────────┤
│ 全局ID: MD001                                  │
│ 名称: 张三科技有限公司                          │
│ 信用代码: 91440300MA5XXXXXX (来源: 合同系统)    │
│ 注册地址: 深圳南山区(来源: CRM)                 │
│ 信用额度: 500万(来源: ERP)                      │
│ 联系电话: 0755-88888888(来源: 售后系统)         │
└────────────────────────────────────────────────┘
         ▲           ▲           ▲
         │ 只读      │ 只读      │ 只读
    ┌────┴──┐   ┌───┴───┐   ┌───┴───┐
    │ CRM   │   │ ERP   │   │ 合同  │
    │ C001  │   │1000234│   │ZS-001 │
    └───────┘   └───────┘   └───────┘
```

**特点**：
- MDM 从各源系统采集数据，融合生成全量视图
- 主要用于分析和报表场景，不回流到源系统
- 各源系统仍然是自己的数据的权威来源

**适用场景**：主要用于 BI 分析和客户 360 视图

**优点**：不对源系统做改造，快速获得统一视图
**缺点**：不同步回源系统，数据闭环不完整

### 3.5 四种架构对比

| 维度 | 注册式 | 共存式 | 集中式 | 融合式 |
|------|--------|--------|--------|--------|
| 数据存储 | 仅 ID 映射 | 核心属性 | 全量属性 | 全量属性 |
| 权威来源 | 源系统 | MDM + 源系统 | MDM 唯一 | 源系统 |
| 数据质量 | 无改善 | 部分改善 | 彻底改善 | 部分改善 |
| 实施难度 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 系统改造成本 | 低 | 中 | 高 | 低 |
| 实时性 | 低 | 中 | 高 | 低 |
| 适合阶段 | 初期 | 中期 | 成熟期 | 分析场景 |

## 四、黄金记录（Golden Record）

### 4.1 什么是黄金记录

**黄金记录（Golden Record）** 是从多个源系统中通过清洗、去重、合并生成的关于某个实体的"最佳版本"。

```
黄金记录的生成过程：

源系统1:                   源系统2:                   源系统3:
  名称: 张三科技             名称: 张三科技有限公司      名称: 张三科技(深圳)
  地址: 深圳南山区           地址: 深圳市南山区          地址: NULL
  电话: 0755-88888888       电话: 0755-88888888         电话: 13800138000
  等级: VIP                 等级: NULL                  等级: 黄金客户
  
     │                          │                          │
     └──────────────────────────┬──────────────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │    匹配 & 去重       │
                     │ 确认是同一个实体     │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │    生存规则合并      │
                     │ 选择最优属性值       │
                     └──────────┬──────────┘
                                │
                         黄金记录:
                          名称: 张三科技有限公司 (最长匹配)
                          地址: 深圳市南山区科技园 (最完整)
                          电话: 0755-88888888 (来源最多)
                          等级: VIP (优先级最高)
```

### 4.2 黄金记录的生成规则

```sql
-- 黄金记录生成规则示例：选择最优属性值
-- 原则：可信度高的系统 > 最新更新的 > 最完整的

SELECT
    -- 全局 ID
    global_id,

    -- 名称：取频率最高的版本
    FIRST_VALUE(name) OVER (
        PARTITION BY global_id
        ORDER BY COUNT(*) OVER (PARTITION BY global_id, name) DESC, update_time DESC
    ) AS golden_name,

    -- 信用代码：必须完全一致才合并
    CASE WHEN COUNT(DISTINCT credit_code) = 1
         THEN MAX(credit_code)
         ELSE 'MISMATCH'  -- 标记异常，需要人工处理
    END AS golden_credit_code,

    -- 地址：取来源系统可信度最高的
    FIRST_VALUE(address) OVER (
        PARTITION BY global_id
        ORDER BY
            CASE source_system
                WHEN 'CRM' THEN 1      -- CRM 地址最可信
                WHEN 'ERP' THEN 2
                WHEN '合同系统' THEN 3
                ELSE 4
            END,
            update_time DESC
    ) AS golden_address,

    -- 等级：取最高的
    FIRST_VALUE(level) OVER (
        PARTITION BY global_id
        ORDER BY
            CASE level
                WHEN 'VIP' THEN 1
                WHEN '黄金客户' THEN 2
                WHEN '普通客户' THEN 3
                ELSE 4
            END
    ) AS golden_level

FROM entity_records
WHERE match_status = 'MATCHED';
```

### 4.3 处理冲突的策略

```
属性冲突处理策略：

1. 信任来源（Trust-based）
   → 定义数据源的信任等级
   → 冲突时取信任度最高的来源
   → 适合：来源质量差异较大的场景

2. 多数投票（Majority Voting）
   → 取出现频率最高的值
   → 适合：来源数量较多的场景

3. 最新优先（Most Recent）
   → 取最后更新的值
   → 适合：属性经常变更的场景

4. 最完整优先（Most Complete）
   → 取最完整、最详细的值
   → 适合：信息粒度不一致的场景

5. 人工裁决（Manual）
   → 自动规则无法决定时，由数据管家确认
   → 适合：关键属性的冲突
```

## 五、实战案例：企业客户主数据的统一管理

### 5.1 业务背景

某科技公司有 6 个核心系统涉及客户数据：CRM（Salesforce）、ERP（SAP）、合同管理、工单系统、数据分析平台、营销平台。每天有 200+ 新客户创建，500+ 客户信息变更。

**核心痛点**：
- 同一客户在 6 个系统中出现，无法做 360 度客户画像
- 销售人员不知道客户是否已签约（信息在合同系统）
- 财务无法准确统计客户应收账款（信息在 ERP）
- 数据分析需要 3 天做一次客户数据的跨系统整合

### 5.2 方案选择：共存式 MDM

选择共存式架构的原因：
- 各系统历史数据量大，集中式改造成本太高
- 核心属性（名称、信用代码）需要统一管理
- 各系统的特有属性（CRM 的销售阶段、ERP 的信用额度）可保留在原系统

### 5.3 主数据模型设计

```sql
-- MDM 客户主数据表
CREATE TABLE mdm_customer (
    -- 全局唯一标识
    global_id           VARCHAR(32)  PRIMARY KEY COMMENT '全局客户ID，MDM系统生成',

    -- 核心属性（黄金记录）
    customer_name       VARCHAR(200) NOT NULL COMMENT '客户标准名称',
    unified_credit_code VARCHAR(18)  COMMENT '统一社会信用代码',
    legal_person        VARCHAR(100) COMMENT '法定代表人',
    registered_address  VARCHAR(500) COMMENT '注册地址',
    registered_capital  DECIMAL(18,2) COMMENT '注册资本（万元）',
    business_scope      VARCHAR(1000) COMMENT '经营范围',
    industry_category   VARCHAR(50)  COMMENT '行业分类',

    -- 管理属性
    data_status         VARCHAR(20)  DEFAULT 'ACTIVE' COMMENT '数据状态: ACTIVE/INACTIVE/MERGED',
    data_quality_score  DECIMAL(3,2) COMMENT '数据质量评分（0-100）',
    golden_record_flag  TINYINT      DEFAULT 1 COMMENT '是否为黄金记录: 1-是/0-否',

    -- 审计字段
    created_by          VARCHAR(50)  COMMENT '创建人',
    created_time        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_by          VARCHAR(50)  COMMENT '更新人',
    updated_time        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_steward        VARCHAR(50)  COMMENT '数据管家'
);

-- 源系统映射表（注册式核心表）
CREATE TABLE mdm_customer_cross_reference (
    id                  BIGINT       PRIMARY KEY AUTO_INCREMENT,
    global_id           VARCHAR(32)  NOT NULL COMMENT '全局客户ID',
    source_system       VARCHAR(50)  NOT NULL COMMENT '源系统标识: CRM/ERP/CONTRACT/...',
    source_id           VARCHAR(100) NOT NULL COMMENT '源系统中的客户ID',
    match_confidence    DECIMAL(3,2) COMMENT '匹配置信度: 0-100',
    match_status        VARCHAR(20)  COMMENT '匹配状态: MATCHED/UNMATCHED/PENDING_REVIEW',
    created_time        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_time        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_source (source_system, source_id),
    INDEX idx_global_id (global_id)
);

-- 变更历史表
CREATE TABLE mdm_customer_change_log (
    id                  BIGINT       PRIMARY KEY AUTO_INCREMENT,
    global_id           VARCHAR(32)  NOT NULL,
    field_name          VARCHAR(100) NOT NULL COMMENT '变更字段',
    old_value           TEXT         COMMENT '变更前值',
    new_value           TEXT         COMMENT '变更后值',
    change_source       VARCHAR(50)  COMMENT '变更来源系统',
    changed_by          VARCHAR(50)  COMMENT '变更人',
    changed_time        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    approval_status     VARCHAR(20)  COMMENT '审批状态: PENDING/APPROVED/REJECTED',

    INDEX idx_global_id (global_id),
    INDEX idx_changed_time (changed_time)
);
```

### 5.4 匹配引擎设计

```java
/**
 * 客户主数据匹配引擎
 * 核心功能：判断两个来自不同系统的客户记录是否为同一实体
 */
public class CustomerMatchEngine {

    /**
     * 匹配策略：分级匹配
     * 精确匹配 → 模糊匹配 → 人工确认
     */
    public MatchResult match(CustomerRecord recordA, CustomerRecord recordB) {
        // 第一级：精确匹配（强标识符）
        // 统一社会信用代码一致 → 100% 同一实体
        if (isNotEmpty(recordA.getUnifiedCreditCode())
            && recordA.getUnifiedCreditCode().equals(recordB.getUnifiedCreditCode())) {
            return MatchResult.matched(100.0, "统一社会信用代码完全匹配");
        }

        // 第二级：高置信度匹配
        // 公司名称完全一致 + （税号一致 或 法人代表一致）
        double score = 0.0;
        StringBuilder reason = new StringBuilder();

        if (recordA.getCustomerName().equals(recordB.getCustomerName())) {
            score += 60.0;
            reason.append("名称完全一致; ");
        }

        if (isNotEmpty(recordA.getTaxId())
            && recordA.getTaxId().equals(recordB.getTaxId())) {
            score += 30.0;
            reason.append("税号一致; ");
        }

        if (isNotEmpty(recordA.getLegalPerson())
            && recordA.getLegalPerson().equals(recordB.getLegalPerson())) {
            score += 20.0;
            reason.append("法人一致; ");
        }

        // 第三级：模糊匹配
        // 名称相似度 > 85% 且 地址相似度 > 70%
        double nameSim = calculateSimilarity(
            recordA.getCustomerName(), recordB.getCustomerName());
        double addrSim = calculateSimilarity(
            recordA.getRegisteredAddress(), recordB.getRegisteredAddress());

        if (nameSim > 0.85) {
            score += 50.0 * nameSim;
            reason.append(String.format("名称相似度%.0f%%; ", nameSim * 100));
        }
        if (addrSim > 0.70) {
            score += 20.0 * addrSim;
            reason.append(String.format("地址相似度%.0f%%; ", addrSim * 100));
        }

        if (score >= 80.0) {
            return MatchResult.matched(score, reason.toString());
        } else if (score >= 50.0) {
            return MatchResult.pendingReview(score, reason.toString());
        } else {
            return MatchResult.unmatched(score, reason.toString());
        }
    }

    /**
     * 名称相似度计算（考虑公司后缀差异）
     * "张三科技" vs "张三科技有限公司" → 相似度 85%
     */
    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;

        // 去除公司后缀后再比较
        String clean1 = removeCompanySuffix(s1);
        String clean2 = removeCompanySuffix(s2);

        // 使用 Levenshtein 距离计算相似度
        int distance = levenshteinDistance(clean1, clean2);
        int maxLen = Math.max(clean1.length(), clean2.length());
        return maxLen == 0 ? 1.0 : 1.0 - (double) distance / maxLen;
    }

    private String removeCompanySuffix(String name) {
        return name.replaceAll(
            "(有限公司|有限责任公司|股份有限公司|集团有限公司|（|）|\\(|\\)|深圳|广东|北京|上海)",
            "");
    }

    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                    dp[i - 1][j] + 1,    // 删除
                    dp[i][j - 1] + 1),   // 插入
                    dp[i - 1][j - 1] + cost); // 替换
            }
        }
        return dp[s1.length()][s2.length()];
    }
}
```

### 5.5 数据同步机制

```
主数据变更同步流程：

1. 变更发起
   ├── 源系统变更 → 调用 MDM API
   └── MDM 直接变更 → 数据管家操作

2. 变更审批（关键属性变更需要审批）
   ├── 自动审批：非关键属性、低风险变更
   └── 人工审批：名称、信用代码等关键属性

3. 变更发布
   ├── 推送模式：MDM 主动推送给订阅了该数据的系统
   └── 拉取模式：各系统定时轮询 MDM 变更接口

4. 变更确认
   └── 各系统收到变更后回执确认
```

```java
// MDM 数据同步服务（简化版）
@Service
public class MasterDataSyncService {

    @Autowired
    private KafkaTemplate<String, MasterDataEvent> kafkaTemplate;

    /**
     * 发布主数据变更事件
     */
    public void publishChange(MasterDataChange change) {
        MasterDataEvent event = MasterDataEvent.builder()
            .globalId(change.getGlobalId())
            .entityType("CUSTOMER")
            .changeType(change.getChangeType()) // CREATE/UPDATE/MERGE/DELETE
            .changedFields(change.getChangedFields())
            .changedTime(Instant.now())
            .build();

        // 发送到 Kafka，各业务系统消费
        kafkaTemplate.send("mdm.customer.change", event);

        // 记录变更日志
        saveChangeLog(change);
    }

    /**
     * 业务系统通过 API 拉取批量变更
     */
    public List<MasterDataChange> pullChanges(
            String sourceSystem, Instant since) {
        return changeLogRepository.findBySourceSystemAndSince(
            sourceSystem, since);
    }
}
```

## 六、主数据治理流程

### 6.1 主数据全生命周期

```
主数据生命周期管理：

┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  创建     │ → │  审核     │ → │  使用     │ → │  变更     │ → │  归档     │
│ (Create)  │   │(Approve)  │   │ (Use)    │   │(Change)  │   │(Archive) │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
 数据录入       质量校验       业务使用       变更审批       自动归档
 自动采集       去重检查       API调用        版本管理       保留历史
 人工创建       完整性检查     报表引用        数据血缘       合规清理
```

### 6.2 数据所有权模型

```
主数据所有权矩阵：

           │  创建权  │  修改权  │  审批权  │  查看权  │
───────────┼─────────┼─────────│─────────│─────────│
数据管家    │    ✓    │    ✓    │    ✓    │    ✓    │  → 对数据质量负责
业务部门    │    ✓    │    ✓    │         │    ✓    │  → 提出变更需求
数据团队    │    ✓    │    ✓    │         │    ✓    │  → 技术支持
下游系统    │         │         │         │    ✓    │  → 消费者
```

### 6.3 质量度量指标

```sql
-- 主数据质量度量 SQL
SELECT
    -- 完整性：非空率
    SUM(CASE WHEN customer_name IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(1)
        AS completeness_name_pct,

    SUM(CASE WHEN unified_credit_code IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(1)
        AS completeness_credit_code_pct,

    -- 唯一性：重复率
    SUM(CASE WHEN dup_cnt > 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(1)
        AS duplication_rate_pct

FROM (
    SELECT
        customer_name,
        unified_credit_code,
        COUNT(1) OVER (PARTITION BY unified_credit_code) AS dup_cnt
    FROM mdm_customer
    WHERE data_status = 'ACTIVE'
) t;
```

## 七、技术选型：自研 vs 商业产品 vs 开源方案

### 7.1 三种方案对比

```
┌──────────────┬────────────────┬──────────────────┬─────────────────┐
│   维度        │    自研         │   商业产品         │   开源方案       │
├──────────────┼────────────────┼──────────────────┼─────────────────┤
│ 代表方案      │ 基于Spring Boot │ Informatica MDM   │ Apache Atlas    │
│              │ + Kafka + ES   │ SAP MDG           │ Talend MDM      │
│              │                │ Semarchy xDM      │ Ataccama ONE    │
├──────────────┼────────────────┼──────────────────┼─────────────────┤
│ 实施周期      │ 6-12个月       │ 3-6个月           │ 6-9个月         │
│ 许可费用      │ 人力成本        │ 50-500万/年       │ 免费            │
│ 定制化能力    │ ⭐⭐⭐⭐⭐      │ ⭐⭐⭐            │ ⭐⭐⭐⭐         │
│ 开箱即用      │ ⭐            │ ⭐⭐⭐⭐⭐         │ ⭐⭐            │
│ 社区支持      │ 无             │ 官方支持           │ 社区            │
│ 匹配引擎      │ 需自建         │ 内置成熟引擎       │ 基础引擎        │
│ 数据质量       │ 需自建         │ 内置               │ 基础功能        │
│ 工作流        │ 需自建          │ 内置               │ 需定制          │
│ 适用规模      │ 中大型         │ 大型               │ 中小型          │
└──────────────┴────────────────┴──────────────────┴─────────────────┘
```

### 7.2 选型决策树

```
你需要 MDM 吗？
  │
  ├── 你的企业有多少个系统用到客户/产品数据？
  │   ├── ≤2 个 → 暂时不需要 MDM，先建立数据标准
  │   └── ≥3 个 → 继续评估
  │
  ├── 你的企业每年因数据不一致导致的问题成本是多少？
  │   ├── 不计其数 → 高优先级
  │   └── 不算太多 → 中低优先级
  │
  └── 你的团队的工程能力？
      ├── 有成熟数据平台团队 → 考虑自研或开源 + 定制
      ├── 有基础开发能力 → 推荐开源方案
      └── 以业务人员为主 → 推荐商业产品
```

### 7.3 实施路径建议

```
第一阶段：打基础（1-3个月）
  - 梳理主数据范围和标准
  - 选型评估和 POC
  - 搭建注册式 MDM（最低成本启动）

第二阶段：核心覆盖（3-6个月）
  - 接入核心业务系统（CRM、ERP）
  - 建立匹配规则和黄金记录
  - 上线数据质量监控

第三阶段：深化治理（6-12个月）
  - 逐步切换到共存式或集中式
  - 建立完整的数据治理流程
  - 覆盖全量主数据领域

第四阶段：持续运营
  - 数据质量持续监控
  - 匹配规则持续优化
  - 新增系统接入
```

## 八、总结

### 8.1 核心要点回顾

1. **主数据是企业的"黄金资产"**：比交易数据更有战略价值
2. **MDM 不是技术项目，是治理项目**：80% 的工作是梳理标准、建立流程、推动协作
3. **从注册式开始，逐步演进**：不要企图一步到位上集中式
4. **黄金记录是 MDM 的灵魂**：匹配规则和数据生存策略的设计决定了成败
5. **度量是改进的前提**：数据的完整性、唯一性、准确性必须量化

### 8.2 常见误区

| 误区 | 真相 |
|------|------|
| MDM 是 IT 的事 | MDM 是业务的事，IT 是执行者 |
| 买了工具就解决问题了 | 工具只解决 20% 的问题，80% 是流程和人 |
| 一次性做完 | MDM 是持续运营，不是一次性项目 |
| 所有数据都要进 MDM | 只管理跨系统共享的核心实体 |
| 数据必须 100% 准确 | 80% 准确就比 0% 准确好，先解决有无 |

### 8.3 一句话总结

> 主数据管理不是把数据放进一个系统就完事了，而是一场需要持续投入的"数据治理运动"。技术工具只是载体，真正起作用的是你花在梳理标准、理解业务、推动协作上的时间和精力。
