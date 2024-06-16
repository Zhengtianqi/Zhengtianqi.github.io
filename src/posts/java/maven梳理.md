---
title: maven梳理
tag:

  - maven
category:
  - 软件管理
author: 郑天祺
date: 2019-08-28 17:01:00
---
# Maven使用

## maven的命令：

```java
maven常用命令

创建maven项目：mvn archetype:create
指定 group： -DgroupId=packageName
指定 artifact：-DartifactId=projectName
创建web项目：-DarchetypeArtifactId=maven-archetype-webapp 
创建maven项目：mvn archetype:generate
验证项目是否正确：mvn validate
maven 打包：mvn package
只打jar包：mvn jar:jar
生成源码jar包：mvn source:jar
产生应用需要的任何额外的源代码：mvn generate-sources
编译源代码： mvn compile
编译测试代码：mvn test-compile
运行测试：mvn test
运行检查：mvn verify
清理maven项目：mvn clean  该操作会清空当前目录的target文件夹
生成eclipse项目：mvn eclipse:eclipse
清理eclipse配置：mvn eclipse:clean
生成idea项目：mvn idea:idea
安装项目到本地仓库：mvn install
发布项目到远程仓库：mvn:deploy
在集成测试可以运行的环境中处理和发布包：mvn integration-test
显示maven依赖树：mvn dependency:tree
显示maven依赖列表：mvn dependency:list
下载依赖包的源码：mvn dependency:sources
安装本地jar到本地仓库：mvn install:install-file -DgroupId=packageName -DartifactId=projectName -Dversion=version -Dpackaging=jar -Dfile=path
    WEB
启动tomcat：mvn tomcat:run
启动jetty：mvn jetty:run
运行打包部署：mvn tomcat:deploy
撤销部署：mvn tomcat:undeploy
启动web应用：mvn tomcat:start
停止web应用：mvn tomcat:stop
重新部署：mvn tomcat:redeploy
部署展开的war文件：mvn war:exploded tomcat:exploded
    maven 命令的格式为 mvn [plugin-name]:[goal-name]，可以接受的参数如下。
-D 指定参数，如 -Dmaven.test.skip=true 跳过单元测试；
-P 指定 Profile 配置，可以用于区分环境；
-e 显示maven运行出错的信息；
-o 离线执行命令,即不去远程仓库更新包；
-X 显示maven允许的debug信息；
-U 强制去远程更新snapshot的插件或依赖，默认每天只更新一次。
```

## 1、Maven的简介  

### 1.1 构建（build）

除了编写源代码，一部分时间花在了编译、运行单元测试、生成文档、打包和部署等烦琐且不起眼的工作上，这就是构建。于是有人使用使用软件只需简单的一条命令，就能自动完成。

### 1.2 Maven的用途

自动化构建过程、清理、编译、测试到生成报告，再到打包和部署。
依赖增加、版本不一致、版本冲突、依赖臃肿等问题：Maven通过一个坐标系统准确地定位每一个构件（artifact），也就是通过一组坐标Maven能够找到任何一个Java类库（如jar文件）。类似于经纬度定位。

## 2、Maven的安装和配置 

### 2.1 Maven怎么升级：

解压新的maven到一个目录，只需更新系统变量指向它。

### 2.2 Maven目录介绍：

（bin boot conf lib LINCENSE. txt NOTICE. txt README.txt）

1. Bin目录：mvn运行脚本（mvn是unix的shell脚本，mvn.bat是windows版），这些脚本是用来配置java命令的。

2. Boot目录： 里只有一个jar包，plexus-classworlds-2.5.2.jar是maven加载类库。

3. Conf目录：settings.xml可以在机器上定义全局的行为。

4. Lib类库

默认情况下：

大多数人需要把M2_HOME/conf/settings.xml复制到~/.m2/settings.xml

### 2.3 设置HTTP代理

有些公司为了安全无法访问公共的Maven中央仓库，需要设置代理，必须保证代理服务器的通畅。

### 2.4 设置MAVEN_OPTS环境变量

目的是让maven构建是速度增加。由于Mvn命令实际是使用java命令，默认无法满足maven运行的需要，容易产生java.lang.OutOfMemeoryError，需要设置系统环境变量MAVEN_OPTS的值为-Xms128m -Xmx512m。

###    2.5 参数设置：

      Linux：在~/.bash_profile文件中添加

```java
export MAVEN_OPTS="-Xms512m -Xmx1024m"
```

（此设置是为了maven执行java时分配给大点的内存，解决容易引起maven导包或插件时卡顿）
  Windows：如下图
 		<img src="/assets/images/maven配置.png">
         

### 	2.6 用户配置：

把MAVEN_HOME/conf/seettings.xml  cp 到 ~/.m2/下，在.m2下的settings.xml中所作的配置就是用户级别的配置，而直接编辑MAVEN_HOME/conf/seettings.xml所作的配置是全局的配置

```java
上传到私服的流程：
  a.  加入打包插件
  b. mvn clean package // 加上clean 会清空target，然后再生成新的包。。。
  c.mvn source:jar  // 生成源码包
  d.mvn deploy // 上传私服，别忘升级版本哦~~~
2.idea和eclipse导入时不同： 
idea是project下的module  eclipse是workspace下的project
  idea导入maven项目  https://blog.csdn.net/weixin_37909363/article/details/80915509  
```

## 3、使用入门

### 3.1 编写pom.xml

Maven的核心是pom.xml

![1618244002479](/assets/images/1618244002479.png)

第三方工具可以快速构建pom.xml的头

Project是所有的pom.xml的根元素，其中第一个子元素modelVersion指定了当前POM模型的版本，对于Maven2和Maven3来说，它只能是4.0.0。

最重要的是groupId、artifactId和version三行。这三行元素定义了一个项目的基本坐标，在Maven的世界，任何的jar、pom或者war都是以基于这些基本的坐标进行区分的。

GroupId定义了项目属于哪个组，这个组往往和项目所在的组织或公司存在关联。

ArtifactId定义了当前Maven项目在组中唯一的ID，子模块

Version指定了版本

### 3.2编写主代码，项目打包过程

此处介绍mvn clean complie、mvn clean test、mvn clean package、mvn clean install

#### 3.2.1使用maven编译项目

当我们编写一个main调用sayHello()打印helloworld字符串时。

该代码的（com.sy.sa.myapp.helloworld）与之前的POM中定义的groupId和artifactId相吻合。一般来说，项目中Java类的包都应该基于项目的group和artifactId，方便搜索。

当编码完毕，使用Maven进行编译，

在项目根目录下运行命令mvn clean compile，

mvn clean compile运行步骤：

![1618244073306](/assets/images/1618244073306.png)

（1）Clean告诉Maven清理输出目录target/，compile告诉Maven编译项目主代码，从输出中看到Maven首先执行了clean：Clean任务，删除target/目录；默认情况下，Maven构建的所有输出都在target/目录中；

（2）接着执行resources：resources任务（未定义项目资源，暂且略过）；

（3）最后执行compiler：compile任务，将项目主代码编译至targert/classes目录

####  3.2.2 使用maven编译测试类

编写完测试用例运行命令mvn clean test

需要maven-compiler-plugin插件

![1618244110010](/assets/images/1618244110010.png)

mvn clean test运行的步骤中会提示测试报告，显示一共运行了多少测试，失败了多少，出错了多少，跳过了多少  

![1618244137853](/assets/images/1618244137853.png)

#### 3.2.3 使用maven将项目打包和运行

mvn clean package进行打包，可以看到target下生成jar，

它是根据artifact-version.jar规则进行命名的，还可以使用finalName来自定义该文件的名称。

![1618244166891](/assets/images/1618244166891.png)

#### 3.2.4 使用maven运行带main方法的类

目前我们打成的jar不能识别main方法，需要指定main方法的位置。使用这个插件，来制定main方法的位置

          maven-shade-plug 

![1618244193984](/assets/images/1618244193984.png)

#### 3.2.5 将项目打包放到本地maven仓库

mvn clean install将此jar包放到maven指定的仓库，该仓库的地址是setting.xml的本地仓库的地址

![1618244251013](/assets/images/1618244251013.png)

## 4、坐标和依赖

### 4.1 坐标详解

Maven坐标为各种构件引入了秩序，任何一个构件都必须明确定义自己的坐标。它们是groupId、artifactId、version、packaging、classifier

![1618244289269](/assets/images/1618244289269.png)

#### 4.1.1 groupId定义到项目

与java包名类似，通常是反向的域名。GroupId为org.sonatype.nexus，（org.sonatype是非营利组织sonatype、nexus是实际项目）。该groupId与域名nexus. Sonatype.org反向对应

#### 4.1.2 artifactId定义到项目其中的一个模块

     为了方便区分，便于寻找实际构件，用nexus作为前缀

#### 4.1.3 version为版本

#### 4.1.4 packaging为该项目的打包方式，默认jar（可选）

#### 4.1.5 classifier为（可选，不能直接定义，由附加插件帮助生成）

## 5、依赖

### 5.1 依赖范围

例：Junit依赖的测试范围test， 测试范围用元素scope表示

Maven在编译项目主代码时候使用一套classpath

在编译和执行测试的时候回使用另一套classpath

依赖范围就是用来控制依赖于这三种classpath（编译classpath、测试classpath、运行classpath），Maven有以下几种依赖范围：

  Compile：编译依赖范围，三种classpath都有效(默认)

  Test：测试依赖范围

  Provided：已提供依赖范围（编译和测试）

  Runtime：运行时依赖规范 

  System：系统依赖范围（编译和测试，必须显示的依赖文件的路径）

![1618244361109](/assets/images/1618244361109.png)

### 5.2 传递性依赖

有了传递依赖机制，Maven会直接依赖POM，将那些必要的简介依赖，以传递性依赖的形式引入到当前的项目中。

A依赖B、B依赖C：A对于B是第一直接依赖，B对于C是第二直接依赖，A对于C是传递性依赖。传递依赖同样有生命周期

![1618244387386](/assets/images/1618244387386.png)

### 5.3 排除依赖

#### 5.3.1引入相同版本的依赖

像framework定义version

```java
<properties>
	 <springframework.version>5.2.2</springframework.version>
</properties>
```

#### 5.3.2 依赖优化

mvn dependency:list 查看当前项目已解析的依赖

mvn dependency:tree 查看当前项目的依赖树

mvn dependency:analyze 帮助分析当前项目的依赖

## 6、仓库

### 6.1概念

任何一个依赖，插件或者项目构建的输出，都可以称为构件

### 6.2 仓库的布局

仓库布局的源码，是基于简单的文件系统

### 6.3 仓库的分类  

仓库的配置，中央仓库、远程仓库

分类：

![1618244497271](/assets/images/1618244497271.png)

### 6.4 仓库的配置

#### 6.4.1设置仓库

（1) 在repositories元素下，可以使用repository子元素声明一个或者多个远程仓库。

![1618244522945](/assets/images/1618244522945.png)

（2）配置maven 更新频率和检查文件策略

![1618244544994](/assets/images/1618244544994.png)

（3）Maven的认证

![1618244566899](/assets/images/1618244566899.png)

#### 6.4.2 上传构件到私有仓库

（1）首先配置好distributionManagement配置

distributionManagement是项目分发信息，在执行mvn deploy后表示要发布的位置。有了这些信息就可以把网站部署到远程服务器或者把构件部署到远程仓库。

![1618244592782](/assets/images/1618244592782.png)

（2）配置成功后，可以用mvn clean deploy Maven就会将项目构建输出的构建部署到配置对应的远程仓库。如果项目当前是快照版本，则部署到快照仓库地址，否则就部署到发布版本仓库地址。

#### 6.4.3 Maven版本号机制  

![1618244623527](/assets/images/1618244623527.png)

版本号(version number)是版本的标识号。

1.版本命名规范

软件版本号有四部分组成，第一部分为主版本号，第二部分为次版本号，第三部分为修订版本号，第四部分为日期版本号

2.软件版本阶段说明

3.版本号修改规则

（1）主版本号：当整体框架结构发生变化时，此版本号增加。此版本号由项目决定是否修改。

（2）次版本号：相对于主版本号而言，次版本号的升级对应的只是局部的变动，当项目在原有的基础上增加了部分功能时，主版本号不变，子版本号加 1，修正版本号复位为 0。

（3）修订版本号：当项目在进行了局部修改或 bug 修正时，主版本号和子版本号都不变，修正版本号加 1。

（4）日期版本号：发版当天的日期，需要包括年份。如：20160617 