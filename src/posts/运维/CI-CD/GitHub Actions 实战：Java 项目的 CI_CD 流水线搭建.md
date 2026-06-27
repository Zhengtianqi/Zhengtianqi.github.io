---
title: GitHub Actions 实战：Java 项目的 CI/CD 流水线搭建
tag: ["CICD"]
date: 2026-06-12
category: CICD
---

# GitHub Actions 实战：Java 项目的 CI/CD 流水线搭建

> 从零搭建一条完整的 Java 项目 CI/CD 流水线，包含编译、测试、代码扫描、Docker 镜像构建和多环境自动部署。

## 1. CI/CD 核心概念与价值

### 1.1 什么是 CI/CD

```
传统开发流程（无 CI/CD）：

开发 → 本地测试 → 提交代码 → [等待] → 集成 → [发现冲突] → 排查 → 修复 →
手动构建 → 手动测试 → 手动部署 → [部署失败!] → 排查 → 重新部署
时间：数小时到数天


现代 CI/CD 流程：

开发 → 本地测试 → 提交代码 →
  ┌───────────────────────────────────────────────┐
  │              CI（持续集成）                      │
  │  自动检出 → 编译 → 单元测试 → 代码扫描 → 构建镜像  │
  │  时间：5-10 分钟                                │
  └───────────────┬───────────────────────────────┘
                  │ 全部通过
                  ▼
  ┌───────────────────────────────────────────────┐
  │              CD（持续交付/部署）                  │
  │  自动部署到 dev → 集成测试 → 部署到 staging →     │
  │  部署到 production（手动审批或自动）               │
  └───────────────────────────────────────────────┘
```

### 1.2 为什么选 GitHub Actions

| 对比维度 | GitHub Actions | Jenkins | GitLab CI |
|---------|---------------|---------|-----------|
| 托管方式 | SaaS（免费额度） | 自建 | SaaS/自建 |
| 配置方式 | YAML 文件 | Jenkinsfile / UI | YAML |
| 与代码仓库集成 | 原生（同平台） | 需要插件 | 原生 |
| 市场生态 | GitHub Marketplace | Jenkins 插件生态 | 较少 |
| 上手难度 | 低 | 中高 | 中 |
| 免费额度 | 2000 min/月（公开仓库无限） | 自建无限制 | 400 min/月 |

---

## 2. GitHub Actions 工作流语法详解

### 2.1 核心概念

```
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions 核心概念                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Workflow（工作流）                                       │
│  └── .github/workflows/ 目录下的 YAML 文件                │
│  └── 由事件触发（push、PR、定时、手动）                      │
│                                                         │
│  Job（作业）                                             │
│  └── Workflow 中的一组 Steps，在同一个 Runner 上运行        │
│  └── 默认并行执行，可用 needs 指定依赖                      │
│                                                         │
│  Step（步骤）                                            │
│  └── Job 中的单个任务                                     │
│  └── 可以是 Action 或 Shell 命令                          │
│                                                         │
│  Action（动作）                                          │
│  └── 可复用的步骤单元                                      │
│  └── 来源：GitHub Marketplace / 本地 / Docker             │
│                                                         │
│  Runner（运行器）                                        │
│  └── 执行 Job 的虚拟机                                    │
│  └── ubuntu-latest / windows-latest / macos-latest      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 完整的 YAML 结构

```yaml
# 工作流名称（显示在 GitHub Actions 页面）
name: Java CI with Maven

# ─── 触发事件 ───
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'pom.xml'
      - '.github/workflows/**'
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
  # 定时执行（UTC 时间）
  schedule:
    - cron: '0 2 * * 1'  # 每周一凌晨 2 点
  # 手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        type: choice
        options:
          - dev
          - staging
          - production

# ─── 环境变量 ───
env:
  JAVA_VERSION: '17'
  MAVEN_OPTS: '-Xmx2048m'

# ─── 并发控制：同一分支同时只有一个运行 ───
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# ─── Jobs ───
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: maven

      - name: Build & Test
        run: mvn verify -B
```

---

## 3. 实战：Java Maven 项目的 CI 流水线

### 3.1 完整 CI 流水线

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:

  # ═══ Job 1: 编译 + 单元测试 + 代码扫描 ═══
  build-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      # CI 中需要的服务（集成测试用）
      mysql:
        image: mysql:8.0.36
        env:
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_DATABASE: testdb
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

      redis:
        image: redis:7.2-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      # ─── Step 1: 检出代码 ───
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 获取完整历史（SonarQube 需要）

      # ─── Step 2: 设置 JDK + Maven 缓存 ───
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'

      # ─── Step 3: Maven 缓存（actions/setup-java 自带的缓存不够精细时） ───
      - name: Cache Maven packages
        uses: actions/cache@v4
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
          restore-keys: |
            ${{ runner.os }}-maven-

      # ─── Step 4: 编译 ───
      - name: Compile
        run: mvn compile -B -q

      # ─── Step 5: 单元测试 ───
      - name: Unit Tests
        run: mvn test -B
        env:
          SPRING_DATASOURCE_URL: jdbc:mysql://localhost:3306/testdb
          SPRING_DATASOURCE_USERNAME: root
          SPRING_DATASOURCE_PASSWORD: testpass

      # ─── Step 6: 上传测试报告 ───
      - name: Upload Test Report
        if: always()  # 即使测试失败也上传报告
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: target/surefire-reports/

      # ─── Step 7: SonarQube 代码扫描 ───
      - name: SonarQube Scan
        if: github.event_name == 'pull_request'
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        run: |
          mvn sonar:sonar -B \
            -Dsonar.host.url=$SONAR_HOST_URL \
            -Dsonar.login=$SONAR_TOKEN \
            -Dsonar.java.binaries=target/classes \
            -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml

      # ─── Step 8: 发布 JaCoCo 覆盖率到 PR ───
      - name: Jacoco Report
        if: github.event_name == 'pull_request'
        uses: madrapps/jacoco-report@v1.6.1
        with:
          paths: target/site/jacoco/jacoco.xml
          token: ${{ secrets.GITHUB_TOKEN }}
          min-coverage-overall: 60
          min-coverage-changed-files: 80
          title: '## :bar_chart: Code Coverage Report'
```

### 3.2 代码扫描集成（SonarQube + SpotBugs）

```yaml
  # ═══ Job 2: 静态代码分析 ═══
  static-analysis:
    runs-on: ubuntu-latest
    needs: build-and-test  # 依赖编译完成

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'maven'

      # ─── SpotBugs（FindBugs 的继承者） ───
      - name: SpotBugs Analysis
        run: mvn spotbugs:check -B || true
        continue-on-error: true

      - name: Upload SpotBugs Report
        uses: actions/upload-artifact@v4
        with:
          name: spotbugs-report
          path: target/spotbugsXml.xml

      # ─── OWASP Dependency Check（依赖漏洞扫描） ───
      - name: Dependency Vulnerability Scan
        run: mvn org.owasp:dependency-check-maven:check -B || true
        continue-on-error: true
```

---

## 4. Docker 镜像构建与推送

### 4.1 多阶段 Dockerfile

```dockerfile
# Dockerfile（项目根目录）
# ─── Stage 1: 构建 ───
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
# 先单独复制 pom.xml 并下载依赖（利用 Docker 缓存层）
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# ─── Stage 2: 运行镜像（只包含 JRE） ───
FROM eclipse-temurin:17-jre-alpine AS runtime

# 安全：不使用 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 从构建阶段复制 JAR
COPY --from=builder /app/target/*.jar app.jar

# 安全：修改文件所有者
RUN chown -R appuser:appgroup /app

USER appuser

# JVM 参数
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 4.2 构建和推送 Pipeline

```yaml
  # ═══ Job 3: Docker 构建与推送 ═══
  docker-build:
    needs: build-and-test
    runs-on: ubuntu-latest
    # 仅 main 分支推送时构建
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      # ─── 提取版本号 ───
      - name: Extract version
        id: version
        run: |
          VERSION=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout)
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "version=$VERSION"

      # ─── 设置 Docker Buildx（支持多架构） ───
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # ─── 登录 Docker Registry ───
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      # 也登录 GitHub Container Registry（多注册表推送）
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # ─── 构建并推送 ───
      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          # 打多个标签：版本号 + latest + commit SHA
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/myapp:${{ steps.version.outputs.version }}
            ${{ secrets.DOCKER_USERNAME }}/myapp:latest
            ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }}
            ghcr.io/${{ github.repository }}:latest
          # 缓存：加速后续构建
          cache-from: type=gha
          cache-to: type=gha,mode=max
          # 多架构支持
          platforms: linux/amd64,linux/arm64
          # 构建时参数
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}

      # ─── 镜像安全扫描（Trivy） ───
      - name: Scan image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ secrets.DOCKER_USERNAME }}/myapp:${{ steps.version.outputs.version }}
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
```

---

## 5. 多环境自动部署

### 5.1 环境 Promotion 流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [dev, staging, production]
      version:
        description: 'Version to deploy'
        required: true

jobs:

  # ═══ dev 环境：自动部署 ═══
  deploy-dev:
    if: github.event.inputs.environment == 'dev'
    runs-on: ubuntu-latest
    environment: dev  # ← GitHub Environments（需要审批规则）

    steps:
      - name: Deploy to Dev
        run: |
          echo "Deploying version ${{ github.event.inputs.version }} to DEV"
          # 使用 kubectl / helm / ssh 部署
          kubectl set image deployment/myapp \
            myapp=${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.event.inputs.version }} \
            -n dev

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/myapp -n dev --timeout=5m

      - name: Smoke test
        run: |
          curl -f https://dev-api.example.com/actuator/health || exit 1

  # ═══ staging 环境：需要审批 ═══
  deploy-staging:
    if: github.event.inputs.environment == 'staging'
    needs: deploy-dev  # 先部署 dev
    runs-on: ubuntu-latest
    environment:
      name: staging
      # 要求指定评审者审批（在 GitHub Settings → Environments 中配置）
      # reviewers: [team-lead]

    steps:
      - name: Deploy to Staging
        run: |
          kubectl set image deployment/myapp \
            myapp=${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.event.inputs.version }} \
            -n staging

      - name: Integration tests
        run: |
          mvn verify -Pintegration-test \
            -Dtest.url=https://staging-api.example.com

  # ═══ production 环境：严格审批 ═══
  deploy-production:
    if: github.event.inputs.environment == 'production'
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      # 生产环境必须手动审批
      # 还可以配置：wait timer（等待 N 分钟后自动部署）

    steps:
      - name: Deploy to Production (Canary)
        run: |
          # 金丝雀部署：先部署 10% 流量
          kubectl set image deployment/myapp-canary \
            myapp=${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.event.inputs.version }} \
            -n production

      - name: Monitor canary
        run: |
          # 监控错误率、延迟等指标
          sleep 300  # 观察 5 分钟
          # 如果指标正常，继续全量部署

      - name: Deploy to Production (Full)
        run: |
          kubectl set image deployment/myapp \
            myapp=${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.event.inputs.version }} \
            -n production
```

### 5.2 自动触发部署（Push to Main）

```yaml
# .github/workflows/deploy-on-push.yml
name: Deploy on Push to Main

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'pom.xml'

jobs:
  # ... 前面的 build、test、docker 步骤省略 ...

  # 自动部署到 Dev
  deploy-to-dev:
    needs: docker-build
    runs-on: ubuntu-latest
    environment: dev

    steps:
      - name: Deploy to Dev
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USER }}
          key: ${{ secrets.DEV_SSH_KEY }}
          script: |
            cd /opt/myapp
            docker compose pull
            docker compose up -d --force-recreate
            docker system prune -f

  # 部署到 Staging（可选：需要手动触发或审批）
  deploy-to-staging:
    needs: deploy-to-dev
    runs-on: ubuntu-latest
    environment:
      name: staging
    # 等待 dev 环境运行一段时间后再部署（可选）
    # 或改为手动审批

    steps:
      - name: Deploy to Staging
        # ... 类似 dev 的部署步骤
```

---

## 6. Matrix Build 并行构建

### 6.1 多 JDK 版本测试

```yaml
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # 某个组合失败不影响其他组合
      matrix:
        java-version: ['11', '17', '21']
        spring-boot-version: ['2.7.x', '3.2.x']
        # 排除不兼容的组合
        exclude:
          - java-version: '11'
            spring-boot-version: '3.2.x'  # Spring Boot 3.x 需要 Java 17+

    name: "JDK ${{ matrix.java-version }} + Spring Boot ${{ matrix.spring-boot-version }}"

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK ${{ matrix.java-version }}
        uses: actions/setup-java@v4
        with:
          java-version: ${{ matrix.java-version }}
          distribution: 'temurin'

      - name: Test with Maven
        run: mvn test -B -Dspring-boot.version=${{ matrix.spring-boot-version }}
```

### 6.2 多环境并行部署

```yaml
  deploy-multi-region:
    needs: docker-build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [us-east, us-west, eu-west, ap-northeast]
        # 生产环境可以限制并行数
        max-parallel: 2

    steps:
      - name: Deploy to ${{ matrix.region }}
        run: |
          echo "Deploying to ${{ matrix.region }}"
          # kubectl config use-context ${{ matrix.region }}
          # kubectl set image deployment/myapp myapp=$IMAGE:$VERSION
```

---

## 7. Secrets 管理与环境变量

### 7.1 Secrets 使用规范

```
┌─────────────────────────────────────────────────────────┐
│              GitHub Secrets 分类管理                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Repository Secrets（仓库级别）                            │
│  ├── DOCKER_USERNAME                                    │
│  ├── DOCKER_TOKEN                                       │
│  ├── SONAR_TOKEN                                        │
│  └── SLACK_WEBHOOK                                      │
│                                                         │
│  Environment Secrets（环境级别）                           │
│  ├── dev：                                              │
│  │   ├── DEV_DB_PASSWORD                                │
│  │   ├── DEV_REDIS_PASSWORD                             │
│  │   └── DEV_SSH_KEY                                    │
│  ├── staging：                                          │
│  │   ├── STAGING_DB_PASSWORD                            │
│  │   └── STAGING_API_KEY                                │
│  └── production：                                       │
│      ├── PROD_DB_PASSWORD                               │
│      ├── PROD_K8S_CONFIG                                │
│      └── PROD_SLACK_ALERT_CHANNEL                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Secrets 在 Workflow 中使用

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # ← 指定环境，自动使用该环境的 Secrets

    env:
      # 从 Secrets 加载环境变量（推荐方式）
      DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      API_KEY: ${{ secrets.API_KEY }}

    steps:
      - name: Deploy
        env:
          # Step 级别的环境变量（更安全的作用域）
          K8S_TOKEN: ${{ secrets.K8S_TOKEN }}
        run: |
          # ⚠️ 不要在日志中打印 Secrets！
          echo "DB_PASSWORD length: ${#DB_PASSWORD}"  # 只打印长度

          # 将 Secret 写入文件而非命令行参数（避免 ps aux 泄露）
          echo "$K8S_TOKEN" > /tmp/k8s-token
          kubectl --token=$(cat /tmp/k8s-token) apply -f deployment.yaml
```

### 7.3 环境变量层级

```yaml
# 环境变量优先级（由低到高）：
# 1. workflow 级别 env
# 2. job 级别 env
# 3. step 级别 env
# 4. 命令行直接设置

name: Env Demo

env:
  APP_ENV: 'development'  # 全局默认值

jobs:
  demo:
    runs-on: ubuntu-latest
    env:
      APP_ENV: 'staging'  # Job 级别覆盖

    steps:
      - name: Show Env
        env:
          APP_ENV: 'production'  # Step 级别覆盖（最高优先级）
        run: echo "APP_ENV=$APP_ENV"  # 输出：production
```

---

## 8. 常见问题排查

### 8.1 问题速查表

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `Permission denied` 推送镜像 | 未登录 Registry | 添加 `docker/login-action` 步骤 |
| `Cannot find module` Maven 编译失败 | 依赖下载失败 | 配置 Maven Cache，检查网络 |
| Tests pass locally but fail in CI | 环境差异（时区、locale、文件编码） | 设置 `TZ`、`LANG` 环境变量 |
| Workflow 一直 waiting | 并发限制或 Runner 不可用 | 检查 `concurrency` 配置，升级 GitHub 套餐 |
| Secret 为空 | Secret 在 fork 的 PR 中不可用 | 使用 `pull_request_target` 事件或环境检查 |
| 磁盘空间不足 | Runner 磁盘满 | 清理不需要的工具：`sudo rm -rf /usr/share/dotnet` |
| 构建超时 | 测试运行太慢 | 增加 `timeout-minutes`，优化测试速度 |

### 8.2 DEBUG 技巧

```yaml
  debug:
    runs-on: ubuntu-latest
    steps:
      # ─── 1. 启用 Debug 日志 ───
      - name: Enable debug logging
        run: |
          echo "ACTIONS_RUNNER_DEBUG=true" >> $GITHUB_ENV
          echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV

      # ─── 2. 查看 Runner 环境 ───
      - name: Dump runner context
        run: |
          echo "=== System Info ==="
          uname -a
          echo "=== Environment ==="
          env | sort
          echo "=== Disk Space ==="
          df -h
          echo "=== Memory ==="
          free -h

      # ─── 3. 查看 GitHub Context ───
      - name: Dump GitHub context
        env:
          GITHUB_CONTEXT: ${{ toJson(github) }}
        run: echo "$GITHUB_CONTEXT"

      # ─── 4. SSH 到 Runner 调试（tmate） ───
      - name: Setup tmate session
        if: failure()  # 仅在失败时启动
        uses: mxschmitt/action-tmate@v3
        timeout-minutes: 15  # 15 分钟后自动断开
```

### 8.3 在本地调试

```bash
# 使用 act 工具在本地运行 GitHub Actions
# 安装：https://github.com/nektos/act

# 运行特定 workflow
act push

# 运行特定 job
act -j build-and-test

# 查看所有 job
act -l

# 使用 Secrets
act -s DOCKER_USERNAME=myuser -s DOCKER_TOKEN=mytoken

# 指定事件
act pull_request
```

---

## 总结

一条完整的 CI/CD 流水线带来的价值远超"自动化部署"四个字。回顾本文涵盖的内容：

```
┌─────────────────────────────────────────────────────────┐
│             CI/CD 流水线的六大能力                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ① 自动编译 + 测试：每次提交都能知道代码有没有问题              │
│  ② 代码质量门禁：SonarQube + 覆盖率报告                     │
│  ③ 安全漏洞扫描：依赖检查 + 镜像扫描                        │
│  ④ Docker 镜像构建：标准化交付物，多架构支持                 │
│  ⑤ 多环境部署：dev → staging → production，带审批流程       │
│  ⑥ Matrix 构建：多 JDK/环境并行测试                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**关键原则**：

1. **Pipeline as Code**：流水线和代码一起管理，版本化，可审查
2. **快速反馈**：CI 阶段 10 分钟内出结果，不要等到第二天
3. **不可变交付**：Docker 镜像一次构建，多环境部署同一个镜像
4. **环境隔离**：dev/staging/production 严格隔离，Secrets 按环境管理
5. **渐进式部署**：不要一次性全量，用金丝雀/蓝绿减少风险
6. **安全左移**：代码扫描、漏洞检查在 CI 阶段完成，不要等上线后发现

> **立即行动**：从最简单的流水线开始——编译 + 测试。运行起来后，再逐步加入代码扫描、Docker 构建和自动部署。CI/CD 是一个持续改进的过程，不要追求一步到位。