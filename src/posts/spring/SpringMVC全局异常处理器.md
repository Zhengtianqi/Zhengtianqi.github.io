---
title: SpringMVC全局异常处理器
author: ztq
tag:
  - SpringMVC
category:
  - spring
date: 2023-04-17 13:47:00
---
# 一、引言
SpringBoot工程中对Controller配置全局异常处理。有些接口在发生异常时，如何对不同类型的接口使用不同的全局异常进行处理呢？
Spring提供了对@ControllerAdvice注解的配置，我们可以通过配置@ControllerAdvice对指定的Exception拦截。
# 二、@ControllerAdvice注解使用方法
```java
// 第一种
@RestControllerAdvice
public class GlobalExceptionHandler
{}

// 第二种
// basePackages 指定一个或多个包，这些包及其子包下的所有 Controller 都被该 @ControllerAdvice 管理。其中上面两种等价于 basePackages。
// basePackages
// @ControllerAdvice("cn.demo.controller")
// @ControllerAdvice(value = "cn.demo.controller")
@ControllerAdvice(basePackages = {"cn.demo.controller"})
public class GlobalExceptionHandler 
{}

// 第三种
// basePackageClasses 指定一个或多个 Controller 类，这些类所属的包及其子包下的所有 Controller 都被该 @ControllerAdvice 管理。
@ControllerAdvice(basePackageClasses = {MyController.class})
public class GlobalExceptionHandler {}

// 第四种
// assignableTypes：指定一个或多个 Controller 类，这些类被该 @ControllerAdvice 管理。
@ControllerAdvice(assignableTypes = {MyController.class})
public class GlobalExceptionHandler {}

// 第五种
// annotations：指定一个或多个注解，被这些注解所标记的 Controller 会被该 @ControllerAdvice 管理。
@ControllerAdvice(annotations = {RestController.class})
public class GlobalExceptionHandler {}
```
# 三、示例
```java
@RestControllerAdvice
public class GlobalExceptionHandler
{
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    /**
     * 权限校验异常
     */
    @ExceptionHandler(AccessDeniedException.class)
    public AjaxResult handleAccessDeniedException(AccessDeniedException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',权限校验失败'{}'", requestURI, e.getMessage());
        return AjaxResult.error(HttpStatus.FORBIDDEN, "没有权限，请联系管理员授权");
    }
    /**
     * 请求方式不支持
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public AjaxResult handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException e,
            HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',不支持'{}'请求", requestURI, e.getMethod());
        return AjaxResult.error(e.getMessage());
    }
    /**
     * 业务异常
     */
    @ExceptionHandler(ServiceException.class)
    public AjaxResult handleServiceException(ServiceException e, HttpServletRequest request)
    {
        log.error(e.getMessage(), e);
        Integer code = e.getCode();
        return StringUtils.isNotNull(code) ? AjaxResult.error(code, e.getMessage()) : AjaxResult.error(e.getMessage());
    }
    /**
     * 拦截未知的运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public AjaxResult handleRuntimeException(RuntimeException e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',发生未知异常.", requestURI, e);
        return AjaxResult.error(e.getMessage());
    }
    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public AjaxResult handleException(Exception e, HttpServletRequest request)
    {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',发生系统异常.", requestURI, e);
        return AjaxResult.error(e.getMessage());
    }
    /**
     * 自定义验证异常
     */
    @ExceptionHandler(BindException.class)
    public AjaxResult handleBindException(BindException e)
    {
        log.error(e.getMessage(), e);
        String message = e.getAllErrors().get(0).getDefaultMessage();
        return AjaxResult.error(message);
    }
    /**
     * 自定义验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Object handleMethodArgumentNotValidException(MethodArgumentNotValidException e)
    {
        log.error(e.getMessage(), e);
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return AjaxResult.error(message);
    }
}
```
