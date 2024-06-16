---
title: 分布式事务-springcloud-nacos-seata
author: ztq
tag:
  - mysql
  - 分布式事务
category:
  - 分布式
date: 2022-08-31 11:35:00
---

# 一、Seata 是什么

Seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Seata 将为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。
https://seata.io/zh-cn/docs/overview/what-is-seata.html

# 二、事务模式
## AT 模式
基于 支持本地 ACID 事务 的 关系型数据库：
一阶段 prepare 行为：在本地事务中，一并提交业务数据更新和相应回滚日志记录。
二阶段 commit 行为：马上成功结束，自动 异步批量清理回滚日志。
二阶段 rollback 行为：通过回滚日志，自动 生成补偿操作，完成数据回滚。
## TCC 模式
不依赖于底层数据资源的事务支持：
一阶段 prepare 行为：调用 自定义 的 prepare 逻辑。
二阶段 commit 行为：调用 自定义 的 commit 逻辑。
二阶段 rollback 行为：调用 自定义 的 rollback 逻辑。
所谓 TCC 模式，是指支持把 自定义 的分支事务纳入到全局事务的管理中。
## Saga 模式
Saga模式是SEATA提供的长事务解决方案，在Saga模式中，业务流程中每个参与者都提交本地事务，当出现某一个参与者失败则补偿前面已经成功的参与者，一阶段正向服务和二阶段补偿服务都由业务开发实现。
# 三、简单使用
springcloud-nacos-seata

## step1、registry.conf
每个应用的resource里需要配置一个registry.conf,与seata-server里的配置类似

## step2、pom.xml
```java
        <!-- Seata -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
            <version>${spring-cloud-alibaba.version}</version>
        </dependency>
```
## step3 application.property
其中：seata.tx-service-group=服务组名称，与nacos-config.txt配置的service.vgroup_mapping.${your-service-gruop}具有对应关系

## step4 code
```java
import io.seata.spring.annotation.GlobalTransactional;

    @Resource
    private StockFeignClient stockFeignClient;
    @Resource
    private OrderDAO orderDAO;

    @GlobalTransactional
    @Transactional(rollbackFor = Exception.class)
    public void placeOrder(String userId, String commodityCode, Integer count) {
        BigDecimal orderMoney = new BigDecimal(count).multiply(new BigDecimal(5));
        Order order = new Order().setUserId(userId).setCommodityCode(commodityCode).setCount(count).setMoney(
            orderMoney);
        // 订单表插入一个订单（当前服务，当前数据源，该方法相当于tx1）
        orderDAO.insert(order);
        // 进行减库存操作（利用feign调用其他服务，其他数据源，该方法相当于tx2）
        stockFeignClient.deduct(commodityCode, count);
    }
```
# 总结
1、全局锁使用数据库表实现，lock_table。

2、全局锁用于读写隔离，如果有多个分布式事务同时操作同一行数据库记录，那么可以保证数据的正确性

3、注册分支事务的时候会插入lock_table记录(正常情况)，全局事务提交的时候会删除lock_table。

4、写隔离，如果要用分布式事务，那么对于同一张表更新时建议全使用@GlobalTransaction.
读隔离，使用@GlobalTransactional+select for update 或者 @GlobalLock+@Transactional+select for update
# 参考文献

github：https://github.com/seata/seata-samples/tree/master/springcloud-nacos-seata

nacos：https://nacos.io/zh-cn/docs/quick-start.html

seata：https://seata.io/

源码分析：

https://blog.csdn.net/qq_43437874/article/details/123131592

https://blog.51cto.com/u_12856278/3631071

