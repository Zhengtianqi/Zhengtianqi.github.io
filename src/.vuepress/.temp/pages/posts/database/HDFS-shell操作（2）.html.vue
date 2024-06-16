<template><div><p>a.创建学生成绩表，结果如下。</p>
<p>Rowkey：id</p>
<p>列族：info和course，course包括3个版本数据</p>
<p>b.插入数据</p>
<p>数据包括</p>
<table>
<thead>
<tr>
<th>学生学号</th>
<th>Info</th>
<th>course</th>
<th></th>
<th></th>
<th></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td></td>
<td>name</td>
<td>age</td>
<td>sex</td>
<td>address</td>
<td>Chinese</td>
<td>math</td>
<td>english</td>
</tr>
<tr>
<td>95001</td>
<td>Jom</td>
<td>20</td>
<td>男</td>
<td>山东省济南市</td>
<td>80</td>
<td>85</td>
<td>89</td>
</tr>
<tr>
<td>95002</td>
<td>Tom</td>
<td>19</td>
<td>男</td>
<td>山东省济南市</td>
<td>55，60</td>
<td>80</td>
<td>71</td>
</tr>
<tr>
<td>95003</td>
<td>Lily</td>
<td>20</td>
<td>女</td>
<td>北京市</td>
<td></td>
<td>65</td>
<td></td>
</tr>
</tbody>
</table>
<p>c.查询数据</p>
<ul>
<li>查找95001的相关数据</li>
<li>查找95002 行、course 列族中 math 列的值</li>
<li>查找成绩为80-90之间的相关数据</li>
<li>查找名字为Jom的相关数据</li>
<li>查找学生地址是山东省的相关数据</li>
</ul>
<p>d.删除学生95003的相关数据</p>
<p>2、使用HBase Java API（选做）</p>
<p>a.查询所有表</p>
<p>b.创建表test，包括列族f1和f2</p>
<p>c.插入数据，rk001 ，f1中列name为zhangsan，f2中列number为135</p>
<p>d.插入数据，rk002 ，f1中列name为lisi</p>
<p>e.查看rk001的数据</p>
<p>创建学生成绩表</p>
<p NAME="&gt;'course',VERSIONS=&gt;3">create 'student','pratice','info',</p>
<p>插入数据</p>
<p>put 'student','95001','info:name','Jom'</p>
<p>put 'student','95001','info:age','20'</p>
<p>put 'student','95001','info:sex','男'</p>
<p>put 'student','95001','info:address','山东省济南市'</p>
<p>put 'student','95001','course:chinese','80'</p>
<p>put 'student','95001','course:math','85'</p>
<p>put 'student','95001','course:english','89'</p>
<p>put 'student','95002','info:name','Tom'</p>
<p>put 'student','95002','info:age','19'</p>
<p>put 'student','95002','info:sex','男'</p>
<p>put 'student','95002','info:address','山东省济南市'</p>
<p>put 'student','95002','course:chinese','55,60'</p>
<p>put 'student','95002','course:math','80'</p>
<p>put 'student','95002','course:english','71'</p>
<p>put 'student','95003','info:name','Lily'</p>
<p>put 'student','95003','info:age','20'</p>
<p>put 'student','95003','info:sex','女'</p>
<p>put 'student','95003','info:address','北京市'</p>
<p>put 'student','95003','course:chinese',''</p>
<p>put 'student','95003','course:math','65'</p>
<p>put 'student','95003','course:english',''</p>
<p>查找95001的相关数据</p>
<p>get 'student','95001'</p>
<p>查找95002 行、course 列族中 math 列的值</p>
<p COLUMN="&gt;'course:math'">get 'student','95002',</p>
<p>查找成绩为80-90之间的相关数据</p>
<p COLUMN="&gt;'course'," FILTER="&gt;&quot;ValueFilter(&gt;=,'binary:80')" AND="" ValueFilter(&lt;=",'binary:90')&quot;">scan 'student',</p>
<p>查找名字为Jom的相关数据</p>
<p FILTER="&gt;&quot;ValueFilter(=,'binary:Jom')&quot;">scan 'student',</p>
<p>查找学生地址是山东省的相关数据</p>
<p FILTER="&gt;&quot;ValueFilter(=,'substring:山东省')&quot;">scan 'student',</p>
<p>删除学生95003的相关数据</p>
<p>deleteall 'student','95003'</p>
</div></template>


