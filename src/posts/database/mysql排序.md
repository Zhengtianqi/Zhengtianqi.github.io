---
title: mysql排序
tag:

  - mysql
category:
  - 数据库
author: 郑天祺
date: 2019-11-20 20:35:00
---



# 1、正常的数字排序

![image-20191120204232822](/assets/images/mysql排序1.png)

# 2、排序中文时

，就是出现问题

![image-20191120204352223](/assets/images/mysql排序2.png)

​	这是因为我们在选取排序规则时，选择的不是gbk。所以想要正确的排序，需要我们了解我们选取字段的排序规则。

# 3、现在改成gbk_chinese_ci

，ci是不区分大小写

![image-20191120204623652](/assets/images/mysql排序3.png)

这样的话，结果：

![image-20191120204719806](/assets/images/mysql排序4.png)

# 4、英中排序

![image-20191120205015864](/assets/images/mysql排序5.png)

​	这个也是gbk的排序效果，但是我们想做到中英混搭的效果，我认为可以自已在mysql编译前放进自己的排序规则，

# 5、中文混搭

先看一下效果：

![image-20191120205433980](/assets/images/mysql排序6.png)

我们sql用引入了一个函数GET_FIRST_PINYIN_CHAR

```java
SELECT
	a.id,
	a.username 
FROM
	test AS a 
ORDER BY
	GET_FIRST_PINYIN_CHAR(a.username)
```

这个函数需要在创建表之后定义，如下：

```java
DROP FUNCTION IF EXISTS `GET_FIRST_PINYIN_CHAR`;
CREATE FUNCTION `GET_FIRST_PINYIN_CHAR`(PARAM VARCHAR(255)) RETURNS VARCHAR(2) CHARSET utf8
BEGIN
    DECLARE V_RETURN VARCHAR(255);
    DECLARE V_FIRST_CHAR VARCHAR(2);
    SET V_FIRST_CHAR = UPPER(LEFT(PARAM,1));
  SET V_RETURN = V_FIRST_CHAR;
    IF LENGTH( V_FIRST_CHAR)<>CHARACTER_LENGTH(V_FIRST_CHAR) THEN
    SET V_RETURN = ELT(INTERVAL(CONV(HEX(LEFT(CONVERT(PARAM USING gbk),1)),16,10),
        0xB0A1,0xB0C5,0xB2C1,0xB4EE,0xB6EA,0xB7A2,0xB8C1,0xB9FE,0xBBF7,
        0xBFA6,0xC0AC,0xC2E8,0xC4C3,0xC5B6,0xC5BE,0xC6DA,0xC8BB,
        0xC8F6,0xCBFA,0xCDDA,0xCEF4,0xD1B9,0xD4D1),
    'A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T','W','X','Y','Z');
    END IF;
    RETURN V_RETURN;
END
```

这个函数创建成功后，会显示ok。有些时候不成功，可能是没有打开创建函数的权限。

需要在mysql配置文件中打开 log_bin_trust_function_creators 