---
title: mybatis-plus插件统一处理createTime，createBy，updateBy
author: zheng
tag:
  - mybatis
category:
  - 数据库
date: 2023-04-17 09:28:00
---
一、添加注解
先添加注解，有四种方式：
```java
public enum FieldFill {
    DEFAULT,
    INSERT,
    UPDATE,
    INSERT_UPDATE;
}
```
示例：
```java
public class Demo {
    @ApiModelProperty(value = "创建者", required = false)
    @TableField(value = "create_by", fill = FieldFill.INSERT)
    private String createBy;
    @ApiModelProperty(value = "创建时间", required = false)
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private Date createTime;
    @ApiModelProperty(value = "更新者", required = false)
    @TableField(value = "update_by", fill = FieldFill.INSERT_UPDATE)
    private String updateBy;
    @ApiModelProperty(value = "更新时间", required = false)
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```
二、配置mybatis-plus
```java
@EnableTransactionManagement(proxyTargetClass = true)
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        interceptor.addInnerInterceptor(paginationInnerInterceptor());
        // 乐观锁插件
        interceptor.addInnerInterceptor(optimisticLockerInnerInterceptor());
        // 阻断插件
        interceptor.addInnerInterceptor(blockAttackInnerInterceptor());
        return interceptor;
    }
    
    // -------------------- start --------------------------
    // 该处配置自动填充createTime，createBy，updateBy
    @Bean
    public MetaObjectHandler metaObjectHandler(){
        return new MetaObjectHandlerImpl();
    }
    // -------------------- end -----------------------------
    /**
     * 分页插件，自动识别数据库类型 https://baomidou.com/guide/interceptor-pagination.html
     */
    public PaginationInnerInterceptor paginationInnerInterceptor() {
        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor();
        // 设置数据库类型为mysql
        paginationInnerInterceptor.setDbType(DbType.MYSQL);
        // 设置最大单页限制数量，默认 500 条，-1 不受限制
        paginationInnerInterceptor.setMaxLimit(-1L);
        return paginationInnerInterceptor;
    }

    /**
     * 乐观锁插件 https://baomidou.com/guide/interceptor-optimistic-locker.html
     */
    public OptimisticLockerInnerInterceptor optimisticLockerInnerInterceptor() {
        return new OptimisticLockerInnerInterceptor();
    }

    /**
     * 如果是对全表的删除或更新操作，就会终止该操作 https://baomidou.com/guide/interceptor-block-attack.html
     */
    public BlockAttackInnerInterceptor blockAttackInnerInterceptor() {
        return new BlockAttackInnerInterceptor();
    }
}

```

三、处理的实现
```java
public class MetaObjectHandlerImpl implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {

        // 根据名称设置属性值
        this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
        this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());

        // 获取当前的用户
        LoginUser loginUser = SecurityUtils.getLoginUser();
        this.strictInsertFill(metaObject, "createBy", String.class, loginUser.getUsername());
        this.strictInsertFill(metaObject, "updateBy", String.class, loginUser.getUsername());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());
        // 获取当前的用户
        LoginUser loginUser = SecurityUtils.getLoginUser();
        this.strictInsertFill(metaObject, "updateBy", String.class, loginUser.getUsername());
    }
}
```
