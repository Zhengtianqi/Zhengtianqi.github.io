---
title: Jenkins 完全指南：从"又老又丑"到"CI/CD 常青树"
tag: ["CICD"]
date: 2026-06-12
category: CICD
---

# Jenkins 完全指南：从"又老又丑"到"CI/CD 常青树"

> CI/CD是现代软件开发的核心实践，它通过自动化构建和部署实现了快速迭代和持续交付。
> 本文介绍了CI/CD的原理和工具链，帮助你构建高效的持续集成和持续部署流程。

想象一个场景：

凌晨 2 点，你刚写完最后一个功能。测试说 OK，前端说联调通过。现在你要——

1. 拉最新代码
2. 跑一遍测试
3. 打个 war/jar 包
4. 上传到服务器
5. 停掉旧服务
6. 启动新服务
7. 确认部署成功
8. 给群里发个通知

这一套搞下来，少说 20 分钟。如果你每天部署 3 次，一年就是 **365 小时**——相当于整整 **15 天** 在做重复劳动。

这时候你需要的是一台"机器人工人"：你 push 代码，它自动完成后面所有事。这台机器人工人，就是 **CI/CD 服务器**。

而在 CI/CD 服务器这个品类里，**Jenkins 就是那个从 2011 年干到现在的老大哥**。

## 二、Jenkins 是怎么工作的？——核心架构

### 2.1 Master-Agent 模式

Jenkins 采用经典的 **主从架构**：

```
┌─────────────────────────────────────────────┐
│              Jenkins Master                   │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ 任务调度 │  │ 插件管理  │  │ 用户界面    │ │
│  │ Scheduler│  │ Plugins  │  │ Web UI      │ │
│  └─────────┘  └──────────┘  └─────────────┘ │
│           │  分配任务              ▲          │
└───────────│───────────────────────│──────────┘
            ▼                       │ 回报结果
┌───────────────────────┐  ┌────────┴──────────────┐
│    Agent (Linux)       │  │   Agent (Windows)      │
│  ┌─────────────────┐   │  │  ┌─────────────────┐   │
│  │ 执行 Maven 构建  │   │  │  │ 执行 .NET 编译   │   │
│  │ 运行 Docker 容器  │   │  │  │ 运行 PowerShell  │   │
│  └─────────────────┘   │  │  └─────────────────┘   │
└───────────────────────┘  └──────────────────────────┘
```

**Master 负责：** 调度任务、管理插件、提供 Web 界面、记录日志
**Agent 负责：** 真正干活——拉代码、编译、测试、打包、部署

这就好比一个**包工头带一群工人**。包工头（Master）接了活，分配给不同专长的工人（Agent）去干，工人干完回来报告。

### 2.2 Pipeline as Code

Jenkins 的灵魂是 **Pipeline（流水线）**。你把整个构建流程写成代码，存在项目根目录的 `Jenkinsfile` 里：

```groovy
pipeline {
    agent any
    
    // 环境变量
    environment {
        JAVA_HOME = '/usr/lib/jvm/java-17'
        APP_NAME = 'guarantee-service'
    }
    
    // 触发条件
    triggers {
        // 每天凌晨 2 点构建
        cron('0 2 * * *')
    }
    
    stages {
        stage('拉代码') {
            steps {
                git branch: 'main', url: 'https://github.com/xxx/guarantee.git'
            }
        }
        
        stage('编译打包') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'target/*.jar'
                }
            }
        }
        
        stage('单元测试') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('代码扫描') {
            parallel {
                stage('SonarQube') {
                    steps {
                        sh 'mvn sonar:sonar'
                    }
                }
                stage('依赖检查') {
                    steps {
                        sh 'mvn dependency-check:check'
                    }
                }
            }
        }
        
        stage('部署到测试环境') {
            when {
                branch 'develop'
            }
            steps {
                sh 'scp target/*.jar deploy@test-server:/app/'
                sh 'ssh deploy@test-server "systemctl restart guarantee"'
            }
        }
        
        stage('部署到生产环境') {
            when {
                branch 'main'
            }
            input {
                message '确认部署到生产环境？'
                ok '确认发布'
            }
            steps {
                sh 'ansible-playbook -i production deploy.yml'
            }
        }
    }
    
    post {
        success {
            // 钉钉通知
            dingtalk(
                robot: 'prod',
                type: 'TEXT',
                text: ['✅ ${APP_NAME} 构建成功！']
            )
        }
        failure {
            dingtalk(
                robot: 'prod',
                type: 'TEXT',
                text: ['❌ ${APP_NAME} 构建失败！请检查：${BUILD_URL}']
            )
        }
    }
}
```

上面这个流水线干了什么？代码 push 后自动：拉代码 → 编译 → 测试 → 代码扫描 → 部署 → 通知。全程不用人碰一下鼠标。

## 三、Jenkins vs GitHub Actions：正面 PK

好了，现在你知道了 Jenkins 是干嘛的。但最近几年 GitHub Actions 火得不行，很多人问：**有了 GitHub Actions，还要 Jenkins 干嘛？**

让我用一个比喻来回答这个问题：

> Jenkins 像你自己买的一整套 **家庭健身器材**——想怎么装怎么装，坏了你自己修，空间你自己出。
> GitHub Actions 像**健身房会员卡**——设施现成的，拎包入场，但不能改格局，到期续费。

下面是用餐对比：

| 维度 | Jenkins 😎 | GitHub Actions 🚀 |
|------|-----------|-------------------|
| **出身** | 2011 年诞生，Java 生态嫡系 | 2019 年诞生，GitHub 亲儿子 |
| **安装方式** | 自己搭服务器，装 Java，部署 war | 零安装，`.github/workflows/` 下写 YAML |
| **配置语言** | Groovy (Jenkinsfile) | YAML |
| **插件生态** | 1800+ 插件，只有你想不到 | 8000+ Actions 市场 |
| **免费额度** | 全部免费（自己出机器） | 公开仓库免费，私有 2000 分钟/月 |
| **私有化部署** | ✅ 天然支持 | ❌ 需要 GitHub Enterprise |
| **构建环境** | 自定义，可以是物理机/虚拟机/Docker | GitHub 托管 Runner 或自托管 Runner |
| **UI 体验** | 经典 Java UI（说实话，有点丑） | 现代 Web UI，集成在 GitHub 里 |
| **学习曲线** | 陡峭，尤其是 Groovy 语法 | 平缓，YAML + 社区模板 |
| **多仓库编排** | ✅ 强，可以跨仓库编排流水线 | ⚠️ 弱，主要面向单仓库 |
| **复杂审批流** | ✅ 支持人工审批/输入 | ⚠️ 需用 Environment Protection |
| **自建 Agent** | ✅ 核心功能，随处部署 | ⚠️ Self-hosted Runner，能力有限 |

### 选型决策树

```
你的代码托管在 GitHub 上吗？
├── 是 → 项目公开吗？
│   ├── 是 → 先试试 GitHub Actions，不花钱
│   └── 否 → 团队有自建服务器吗？
│       ├── 有 → 两个都可以，看下面
│       └── 没有 → GitHub Actions（省运维）
└── 否 → 用 Jenkins（Actions 用不了）

你要做的流水线复杂吗？
├── 简单 CI/CD（编译-测试-部署）→ GitHub Actions 够用
├── 需要跨多个代码仓库编排 → Jenkins 更强
├── 需要复杂的审批流程（比如生产发布要老板点确认）→ Jenkins
├── 需要在物理机/特殊环境上构建（比如信创环境、离线环境）→ Jenkins
└── 团队有 Java 基因，喜欢自己掌控一切 → Jenkins
```

### 一个真实例子

假设你维护一个担保系统，包含 8 个微服务，分别放在 8 个仓库里。每次发版需要按顺序部署：先停前端 → 更新网关 → 更新核心服务 → 更新风控 → 跑冒烟测试 → 启动前端。

**用 GitHub Actions：** 每个仓库各配各的 workflow，你很难保证"先停前端再更新"的全局顺序。需要靠 dispatch event 串联，维护成本高。

**用 Jenkins：** 一个 Pipeline 搞定。可以用 `build job` 步骤按顺序调起各仓库的构建，中间加 `input` 等人工确认。

这就是 Jenkins 在**复杂编排**上的优势。

## 四、Jenkins 不止于发布：功能拓展全景

很多人以为 Jenkins 就是个"自动化部署工具"，这是严重的低估。Jenkins 本质上是**一个带 UI 的任务编排引擎**。既然能编排构建部署，就能编排任何自动化任务。

### 4.1 定时任务调度器（Cron on Steroids）

```groovy
pipeline {
    agent any
    triggers { cron('0 3 * * *') }  // 每天凌晨 3 点
    stages {
        stage('数据库备份') {
            steps {
                sh 'mysqldump -u root guarantee_db | gzip > /backup/db_$(date +%Y%m%d).sql.gz'
            }
        }
        stage('日志归档') {
            steps {
                sh 'find /var/log/app -name "*.log" -mtime +30 -exec gzip {} \\;'
            }
        }
        stage('数据报表生成') {
            steps {
                sh 'spark-submit daily_report.py'
            }
        }
    }
}
```

> Jenkins 的 cron 比 Linux crontab 强在哪？有 Web UI 可以看到执行历史和日志，失败了能重试，还能发钉钉通知。

### 4.2 数据管道编排（ETL Pipeline）

担保业务经常需要跑批处理：每晚把当天的业务数据汇总、清洗、写入报表库。

```groovy
pipeline {
    agent any
    stages {
        stage('从业务库抽取数据') {
            steps { sh 'sqoop import --connect jdbc:mysql://... --table guarantee_order ...' }
        }
        stage('Hive 数据清洗') {
            steps { sh 'hive -f etl/dwd_order_clean.sql' }
        }
        stage('Spark 指标计算') {
            steps { sh 'spark-submit etl/calculate_risk_metrics.py' }
        }
        stage('写入报表库') {
            steps { sh 'sqoop export --connect jdbc:mysql://... --table report_daily ...' }
        }
    }
    post {
        success { sh 'python3 send_report.py "日报生成成功"' }
        failure { sh 'python3 send_alert.py "日报生成失败！请检查！"' }
    }
}
```

### 4.3 自动化运维（代替手动运维脚本）

```groovy
pipeline {
    parameters {
        choice(name: 'ACTION', choices: ['restart', 'health_check', 'scale_up', 'rollback'])
        string(name: 'TARGET', defaultValue: 'guarantee-service')
    }
    stages {
        stage('执行运维操作') {
            steps {
                script {
                    switch(params.ACTION) {
                        case 'restart':
                            sh "kubectl rollout restart deployment/${params.TARGET}"
                            break
                        case 'health_check':
                            sh "kubectl exec deployment/${params.TARGET} -- curl -s localhost:8080/actuator/health"
                            break
                        case 'scale_up':
                            sh "kubectl scale deployment/${params.TARGET} --replicas=3"
                            break
                        case 'rollback':
                            sh "kubectl rollout undo deployment/${params.TARGET}"
                            break
                    }
                }
            }
        }
    }
}
```

这样运维同事不用记 kubectl 命令，Jenkins 界面点一下就行。**降低了运维门槛，同时留下了操作审计日志**。

### 4.4 自动化测试平台

```groovy
pipeline {
    parameters {
        choice(name: 'TEST_SUITE', choices: ['smoke', 'regression', 'performance', 'all'])
    }
    stages {
        stage('执行测试') {
            steps {
                script {
                    if (params.TEST_SUITE == 'performance') {
                        sh 'jmeter -n -t performance/guarantee_load_test.jmx -l result.jtl'
                        // 生成 HTML 报告
                        perfReport filterRegex: '', sourceDataFiles: 'result.jtl'
                    } else {
                        sh "mvn test -Dgroups=${params.TEST_SUITE}"
                    }
                }
            }
        }
    }
}
```

QA 同学需要跑回归测试？Jenkins 上点一下，选 "regression"，半小时后出结果，还带详细报告。

### 4.6 更多妙用

| 场景 | 说明 |
|------|------|
| **文档自动生成** | push Markdown → Jenkins 自动生成 HTML/PDF → 发布到文档站 |
| **SSL 证书自动续期** | 每月检查证书到期时间，到期前 30 天自动申请续期 |
| **安全漏洞扫描** | 每天自动跑 Trivy/Clair 扫描 Docker 镜像 |
| **环境搭建** | 一键创建完整开发环境（数据库+Redis+应用+Mock服务） |
| **合规审计跑批** | 每月自动导出生产操作日志，生成合规报告 |
| **多仓库同步** | 监控 GitHub 仓库 → 自动同步到 Gitee/GitLab（国企双仓库场景） |

> **核心思想：** 凡是"需要手动点来点去、容易出错、需要记录日志"的操作，都值得用 Jenkins 自动化。

## 五、Jenkins 的难点与坑：老司机的血泪经验

### 5.1 插件管理地狱

Jenkins 有 1800+ 插件，这是优势也是诅咒。

**典型灾难现场：** 你装了一个 "Blue Ocean" 插件美化 UI，它依赖了 50 个其他插件。某天你更新了其中一个，整条依赖链断裂，Jenkins 启动失败，日志里一串 `NoClassDefFoundError`。

```bash
# 经典解决方案——但要到服务器上搞
java -jar jenkins-cli.jar -s http://jenkins:8080 safe-restart
# 还是不行？禁掉所有插件重新来
mv plugins plugins.bak && jenkins restart
```

**最佳实践：** 
- 不要在 Jenkins 界面上乱装插件，用 `plugins.txt` 管理版本
- 使用 Docker 部署，坏了大不了重新拉镜像
- 定期备份 `$JENKINS_HOME`

### 5.2 Groovy Pipeline 调试困难

```groovy
// 这行代码可能在你本地 Groovy 脚本里跑得好好的
// 但在 Jenkins 的沙箱里会直接爆炸
def result = httpRequest(url: 'http://user-service/api/users')

// 错误信息可能是：
// org.jenkinsci.plugins.scriptsecurity.sandbox.RejectedAccessException:
// Scripts not permitted to use method groovy.json.JsonSlurper parseText
```

Jenkins Pipeline 有一种叫"沙箱"的安全机制，会禁止很多你习以为常的操作。每次踩坑都要去 Manage Jenkins → In-process Script Approval 里手动放行。

**最佳实践：**
- Pipeline 尽量简单，复杂逻辑写成独立脚本（Shell/Python），Pipeline 只负责调脚本
- 用 Jenkins 自带的 `replay` 功能调试
- 写 Pipeline 时多用 `echo` 输出变量

### 5.3 性能问题

Jenkins 是 Java 应用，内存开销不小。当你同时跑 50 个构建任务，Master 的 GC 可能把你搞疯。

```bash
# Jenkins 的经典配置——给足够的内存
JAVA_OPTS="-Xms4g -Xmx4g -XX:+UseG1GC"
```

**最佳实践：**
- Master 只做调度，不要在上面跑构建
- Agent 按需创建（Kubernetes 动态 Agent）
- 定期清理历史构建：`buildDiscarder(logRotator(numToKeepStr: '30'))`

### 5.4 配置即代码（JCasC）——解决 Jenkins 最大的痛点

传统 Jenkins 最大的问题是：**所有配置都在 Web UI 上点出来的，没法版本管理**。你勤勤恳恳配了 200 个 Job，某天服务器挂了，怎么办？凭记忆重新点一遍？

**JCasC (Jenkins Configuration as Code)** 解决了这个问题：

```yaml
# jenkins.yaml —— Jenkins 的全部配置，一份文件搞定
jenkins:
  systemMessage: "担保系统 CI/CD 平台 - 生产环境请勿随意操作"
  numExecutors: 0  # Master 不执行构建
  scmCheckoutRetryCount: 2
  
  securityRealm:
    ldap:
      server: ldap://ldap.company.com
      rootDN: dc=company,dc=com
      userSearchBase: ou=people
      
  authorizationStrategy:
    roleBased:
      roles:
        global:
          - name: "admin"
            permissions: ["Overall/Administer"]
          - name: "developer"
            permissions: ["Job/Build", "Job/Read", "Job/Workspace"]
              
tool:
  jdk:
    installations:
      - name: "JDK17"
        home: "/usr/lib/jvm/java-17"
  maven:
    installations:
      - name: "Maven3"
        home: "/usr/share/maven"

# 插件列表——装了哪些插件一目了然
pluginManager:
  plugins:
    - artifactId: workflow-aggregator
    - artifactId: git
    - artifactId: blueocean
    - artifactId: dingding-notifications

jobs:
  - script: >
      pipelineJob('guarantee-service') {
        definition {
          cpsScm {
            scm {
              git { remote { url('https://github.com/xxx/guarantee.git') } }
            }
            scriptPath('Jenkinsfile')  // Pipeline 定义在代码仓库里
          }
        }
      }
```

有了这个文件，Jenkins 配置可以像代码一样：存 Git、做 Code Review、版本追溯。**新搭建一台 Jenkins 只需要 docker run + 加载这个 YAML 文件**。

## 六、快速上手：Docker 一键启动

```bash
# 1. 拉镜像并启动
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17

# 2. 获取初始密码
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 3. 浏览器打开 http://localhost:8080 完成初始化

# 4. 创建你的第一个 Pipeline
# 在项目根目录新建 Jenkinsfile，内容参考上文
```

## 七、总结：什么时候该用 Jenkins？

| 你的情况 | 建议 |
|----------|------|
| 个人项目 / 开源项目 / 创业早期 | **GitHub Actions**。零运维，够用 |
| 团队 < 10 人，多微服务复杂编排 | **Jenkins**。流程编排能力强 |
| 需要私有化部署 / 内网 / 信创环境 | **Jenkins**。唯一选择 |
| 需要复杂审批流（合规要求） | **Jenkins**。input 步骤天然支持 |
| 除了 CI/CD 还需要各种自动化 | **Jenkins**。超级任务编排引擎 |
| 团队有 Java 背景，愿意折腾 | **Jenkins**。用得好是利器 |
| 团队没专人维护，追求开箱即用 | **GitHub Actions**。别给自己找麻烦 |

**最后一句话总结：**

> GitHub Actions 让你"不用想太多，快速搞定 CI/CD"；Jenkins 让你"想做什么就能做什么，但要承担复杂度"。
> 选哪个，取决于你的团队是在"快速奔跑"还是在"追求掌控感"。
