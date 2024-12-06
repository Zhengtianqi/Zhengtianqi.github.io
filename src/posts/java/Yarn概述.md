---
title: Yarn概述
author: ztq
tag:

  - HADOOP
category:
  - 大数据
date: 2019-12-18 09:12:00

---

# 一、组件介绍	

	Yarn的基本思想是将 JobTracker 的资源管理和作业的调度/监控两大主要职能拆分为两个独立的进程：

		a. 一个全局的 Resource Manager 

		b. 每个应用对应的 Application Master（AM）

	Resource Manager 和每个节点上的 Node Manager（NM）组成了全新的通用操作系统，以分布式的方式管理应用程序。

	Resource Manager拥有为系统中所有应用分配资源的决定权。与之相关的是应用程序的Application Master，负责与Resource Manager协商资源，并与Node Manager协同工作来执行和监控任务。

![image-20191218091838954](/assets/images/Yarn.png)

## （1）Resource Manager

		Yarn Resource Manager是一个纯粹的调度器，它负责整个系统的资源管理和分配。它本身主要由两个组件构成：调度器（Scheduler）和应用程序管理器（Applications Manager，AM）。

		调度器根据容量、队列等限制条件，将系统中的资源分配给各个正在运行的应用程序。

注意：该调度器是一个“纯调度器”，他不再从事任何与具体应用程序相关的工作

## （2）Application Master

		Application Master实际上是特定框架库的一个实例，负责与 Resource Manager协商资源，并和Resource Manager协同工作来   执行和监控Container，以及它们的资源消耗。

## （3）Node Manager

		Node Manager 是每个节点的框架代理。她负责启动应用的Container，监控Container的资源使用（包括CPU、内存、硬盘和网络带宽等），并把这些信息汇报给调度器。

## （4）Resource Request 和 Container

		Yarn 被设计成可以允许应用程序（通过 Application Master） 以共享的、安全的，以及多用租户的方式使用集群的资源。它也会感知集群的网络拓扑，一边可以有效地调度，以及优化数据访问。

# 二、Yarn工作流程

	（1）客户端提交 MapReduce作业

	（2）Yarn 资源管理器负责协调集群上计算资源的分配

	（3）Yarn 节点管理器（Node Manager）负责启动和监视集群中机器上的计算容器（Container）

	（4）应用程序的 Master 负责协调运行 MapReduce 作业的任务，它和MapReduce 任务在容器中运行，这些同期由资源管理器分配对节点管理器进行管理

	（5）分布式文件系统（HDFS）用来与其他实体间共享作业文件