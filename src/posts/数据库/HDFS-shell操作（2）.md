---
title: HBASE shell操作（2）
author: zheng
tag:

  - hadoop
category:
  - 大数据
date: 2020-12-06 12:02:00

---



a.创建学生成绩表，结果如下。

Rowkey：id

列族：info和course，course包括3个版本数据

b.插入数据

数据包括

| 学生学号 | Info | course |      |              |         |      |         |
| -------- | ---- | ------ | ---- | ------------ | ------- | ---- | ------- |
|          | name | age    | sex  | address      | Chinese | math | english |
| 95001    | Jom  | 20     | 男   | 山东省济南市 | 80      | 85   | 89      |
| 95002    | Tom  | 19     | 男   | 山东省济南市 | 55，60  | 80   | 71      |
| 95003    | Lily | 20     | 女   | 北京市       |         | 65   |         |

c.查询数据

- 查找95001的相关数据
- 查找95002 行、course 列族中 math 列的值
- 查找成绩为80-90之间的相关数据
- 查找名字为Jom的相关数据
- 查找学生地址是山东省的相关数据

d.删除学生95003的相关数据

2、使用HBase Java API（选做）

a.查询所有表

b.创建表test，包括列族f1和f2

c.插入数据，rk001 ，f1中列name为zhangsan，f2中列number为135

d.插入数据，rk002 ，f1中列name为lisi

e.查看rk001的数据



创建学生成绩表 

create 'student','pratice','info',{NAME=>'course',VERSIONS=>3} 

插入数据 

put 'student','95001','info:name','Jom' 

put 'student','95001','info:age','20' 

put 'student','95001','info:sex','男' 

put 'student','95001','info:address','山东省济南市' 

put 'student','95001','course:chinese','80' 

put 'student','95001','course:math','85' 

put 'student','95001','course:english','89' 

 

put 'student','95002','info:name','Tom' 

put 'student','95002','info:age','19' 

put 'student','95002','info:sex','男' 

put 'student','95002','info:address','山东省济南市' 

put 'student','95002','course:chinese','55,60' 

put 'student','95002','course:math','80' 

put 'student','95002','course:english','71' 

 

put 'student','95003','info:name','Lily' 

put 'student','95003','info:age','20' 

put 'student','95003','info:sex','女' 

put 'student','95003','info:address','北京市' 

put 'student','95003','course:chinese','' 

put 'student','95003','course:math','65' 

put 'student','95003','course:english','' 



查找95001的相关数据

get 'student','95001' 



查找95002 行、course 列族中 math 列的值 

get 'student','95002',{COLUMN=>'course:math'} 



查找成绩为80-90之间的相关数据 

scan 'student',{COLUMN=>'course', FILTER=>"ValueFilter(>=,'binary:80') AND ValueFilter(<=,'binary:90')"}



查找名字为Jom的相关数据 

scan 'student',{FILTER=>"ValueFilter(=,'binary:Jom')"} 



查找学生地址是山东省的相关数据

scan 'student',{FILTER=>"ValueFilter(=,'substring:山东省')"} 



删除学生95003的相关数据

deleteall 'student','95003' 