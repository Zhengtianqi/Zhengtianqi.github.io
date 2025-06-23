---
title: Git梳理
tag:
  - git
category:
  - 软件管理
author: ztq
date: 2019-08-29 10:28:00
---
## 1、Git介绍：

 	Git是目前世界上最先进的分布式版本控制系统。gitlab是公司搭建的代码版本控制平台，使用方法与github类似，项目负责人在gitlab上新建一个项目，并分享URL给开发人员。开发人员在负责人的gitlab项目页面上点

 	击“fork”按钮，将此项目fork到自己的gitlab上，这相当于是从负责人那拷贝了一份项目副本，无论开发人员如何修改代码都不会影响负责人那master分支上的代码。然后开发人员可以根据自己的项目分工，像对待普通项

 	目一样做clone、add、commit、push等操作。如果开发人员人为一个小模块做好了，可以点击“pull request”按钮，向负责人发送代码合并请求，要合并的代码文件也会以列表的形式同时发送给负责人，此时负责人会看到

开发人员的请求，经审核如果代码没问题则会合并模块，并向开发人员发送确认合并的通知。

## 2、为什么用GitLab？

 	清晰的项目管理和责任明确
 	清晰的看到产品迭代，为产品研发提供参考
 	能够形成项目管理课程，为我们的后续产品做准备，同时课程设计过程完全公开，降低产品和运营不匹配的问题。

## 3、Git 工作区、暂存区和版本库

工作区：就是你在电脑里能看到的目录。

暂存区：英文叫stage, 或index。一般存放在 ".git目录下" 下的index文件（.git/index）中，所以我们把暂存区有时也叫作索引（index）。

版本库：工作区有一个隐藏目录.git，这个不算工作区，而是Git的版本库。

## 4、Git工作流程

###     1、一个分支

克隆 Git 资源作为工作目录。

在克隆的资源上添加或修改文件。

如果其他人修改了，你可以更新资源。

在提交前查看修改。

提交修改。

###     2、多个分支

fork项目，建立自己的分支[name]（直接git网页操作）

将master分支clone 下来（git clone）

修改当前分支为fork 的分支（git      checkoout [name]）

代码的修改(commit and push)

如果需要合并到主分支：pull request merge

![](/assets/\images/Git工作流程.png)

## 5、Git配置及使用：

###     1）配置用户信息

     配置个人的用户名称和电子邮件地址：

     右键打开git bash命令行（如果设置了git的系统环境变量，就可以直接使用cmd命令行进行git操作）

         a）设置Git端上的用户名和用户邮箱（公司邮箱）

```java
$ git config --global user.name "yourname"
$ git config --global user.email       "yourname@xxxx.com"
```

         b）生成ssh公钥和私钥

```java
$ ssh -keygen -t rsa -C       "yourname@xxxx.com"
一路回车
C:/Users/admin/.ssh会生成一个id_rsa.pub公钥文件
word打开id_rsa.pub将公钥添加进GitLab -> Profile Settings -> SSH Keys
添加成功钉邮中会收到SSH key was added to your account邮件
```



###     2）查看配置

```java
$ git config --list 
```

###     3）创建仓库

         a）$ git clone：这是一种较为简单的初始化方式，当你已经有一个远程的Git版本库，只需要在本地克隆一份。 

 例：$ git  clone  http://zzzzz.git   // 'http://zzzzzz.git'  这个URL地址的远程版本库，完全克隆到本地demo目录下 

 	注：git clone 时，可以所用不同的协议，包括 ssh, git, https 等，其中最常用的是 ssh，因为速度较快，还可以配置公钥免输入密码。 

         b）$ git init 和 $  git remote：这种方式稍微复杂一些，当你本地创建了一个工作目录，你可以进入这个目录，使用'git init'命令进行初始化；Git以后就会对该目录下的文件进行版本控制， 

 	这时候如果你需要将它放到远程服务器上，可以在远程服务器gitlab上创建一个目录，并把可访问的URL记录下来，此时你就可以利用'git remote add'命令来增加一个远程服务器端。 

```java
例：
$ git init   // 该命令执行完后会在当前目录生成一个 .git 目录。 
$ git add .   // 是将当前更改或者新增的文件加入到Git的索引中，加入到Git的索引中就表示记入了版本历史中，这也是提交之前所需要执行的一步 
$ touch README.md   // 初始化一个README.md文件 
$ git commit -m "初始化项目版本"   // 提交当前工作空间的修改内容 
$ git remote add origin  git@git.gag.cn:yourname/demo.git   // 关联远程仓库 
$ git push -u origin master   // 将操作提交到gitlab 
$ git log   // 查看历史日志 
```

###     4）基本操作

####         a）远程仓库相关命令 

检出仓库： 

```java
$ git clone http:/zzzzzzzz.git
```

查看远程仓库：

```java
$ git remote -v
```

添加远程仓库：

```java
$ git remote add [name] [url]
```

删除远程仓库：

```java
$ git remote rm [name]
```

修改远程仓库：

```java
$ git remote set-url --push [name] [newUrl]
```

拉取远程仓库：

```java
$ git pull [remoteName] [localBranchName]
```

从其他的版本库（既可以是远程的也可以是本地的）将代码更新到本地，例如：'git pull origin master'就是将origin这个版本库的代码更新到本地的master主枝

推送远程仓库：

```java
$ git push [remoteName] [localBranchName] 
```

将本地commit的代码更新到远程版本库中，例如'git push origin'就会将本地的代码更新到名为orgin的远程版本库中

如果想把本地的某个分支test提交到远程仓库，并作为远程仓库的master分支，或者作为另外一个名叫test的分支，如下：

```java
$git push origin test:master    // 提交本地test分支作为远程的master分支 

$git push origin test:test    // 提交本地test分支作为远程的test分支 
```

####         b）分支(branch)操作相关命令 

查看本地分支：

```java
$ git branch 
```

列出本地所有的分支 对分支的增、删、查等操作，例如'git branch       new_branch'会从当前的工作版本创建一个叫做new_branch的新分支

```java
$ git branch -D new_branch ----就会强制删除叫做new_branch的分支
```

查看远程分支：

```java
$ git branch -r
```

创建本地分支：

```java
$ git branch [name] ----注意新分支创建后不会自动切换为当前分支
```

切换分支：

```java
$ git checkout [name]    
```

Git的checkout有两个作用，其一是在不同的branch之间进行切换，例如'git checkout       new_branch'就会切换到new_branch的分支上去；另一个功能是还原代码的作用，例如'git checkout app/model/user.rb'就会将user.rb文件从上一个已提交的版本中更新回来，未提交的内容全部会回滚。

创建新分支并立即切换到新分支：

```java
$ git checkout -b [name]
```

删除分支：

```java
$ git branch -d [name] ---- -d选项只能删除已经参与了合并的分支，对于未有合并的分支是无法删除的。如果想强制删除一个分支，可以使用-D选项
```

合并分支：

```java
$ git merge [name] ----将名称为[name]的分支与当前分支合并
```

创建远程分支(本地分支push到远程)：

```java
$ git push origin [name]
```

删除远程分支：

```java
$ git push origin       :heads/[name] 或 $ gitpush origin :[name] 
```

创建空的分支：(执行命令之前记得先提交你当前分支的修改，否则会被强制删干净)

```java
$git symbolic-ref HEAD refs/heads/[name]
$rm .git/index
$git clean -fdx
```



####         c）版本(tag)操作相关命令

查看版本：

```java
$ git tag
```

创建版本：

```java
$ git tag [name]
```

可以将某个具体的版本打上一个标签，这样你就不需要记忆复杂的版本号哈希值了，例如你可以使用'git tag revert_version       bbaf6fb5060b4875b18ff9ff637ce118256d6f20'来标记这个被你还原的版本，那么以后你想查看该版本时，就可以使用 revert_version标签名，而不是哈希值了

删除版本：

```java
$ git tag -d [name]
```

查看远程版本：

```java
$ git tag -r
```

创建远程版本(本地版本push到远程)：

```java
$ git push origin [name]
```

删除远程版本：

```java
$ git push origin  :refs/tag/[name]
```

合并远程仓库的tag到本地：

```java
$ git pull origin --tag
```

上传本地tag到远程仓库：

```java
$ git push origin --tag
```

创建带注释的tag：

```java
$ git tag -a [name] -m 'yourMessage' 
```

####         d）子模块(submodule)相关操作命令

添加子模块：

```java
$ git submodule add [url]       [path]

 如：$git submodule add git://github.com/soberh/ui-libs.git src/main/webapp/ui-libs
```

初始化子模块：

```java
$ git submodule init ----只在首次检出仓库时运行一次就行
```

更新子模块：

```java
$ git submodule update ----每次更新或切换分支后都需要运行一下
```

删除子模块：（分4步走） 

```java
1)$ git rm --cached [path]
2)编辑“.gitmodules”文件，将子模块的相关配置节点删除掉
3)编辑“ .git/config”文件，将子模块的相关配置节点删除掉
4)手动删除子模块残留的目录
```

####         e）补充

更改或者新增的文件：

```java
$ git add       
```

是将当前更改或者新增的文件加入到Git的索引中，加入到Git的索引中就表示记入了版本历史中，这也是提交之前所需要执行的一步，

```java
例如: git add app/model/user.rb'就会增加app/model/user.rb文件到Git的索引中
```

删除文件：

```java
$ git rm   
```

从当前的工作空间中和索引中删除文件，

```java
例如: git rm app/model/user.rb
```

查看历史日志：

```java
$ git log
```

还原：

```java
$ git revert 
```

还原一个版本的修改，必须提供一个具体的Git版本号，例如'git revert bbaf6fb5060b4875b18ff9ff637ce118256d6f20'，Git的版本号都是生成的一个哈希值

提交：

```java
$ git commit  
```

当前工作空间的修改内容

强制pull 

```java
git fetch --all 
git reset --hard origin/master
git pull
```

强制push       

```java
push -u [url] 
```

####         f）忽略一些文件、文件夹不提交

在仓库根目录下创建名称为“.gitignore”的文件，写入不需要的文件夹名或文件，每个元素占一行即可，如

```java
target
bin
*.db
```

###     5)解决冲突

```java
IDEA  ->   VCS  -> git  ->  Branches  ->   选中需要合并的远程分支  - >  Rebase current onto selected
```

