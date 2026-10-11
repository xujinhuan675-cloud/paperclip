# 01 产品定义

## 一句话定位

Paperclip 是一个面向自治 AI 公司的控制平面：它负责组织 AI 员工、拆解目标、分配工作、协调执行、治理风险，并沉淀可审查的产物和运行记录。

## 用户问题

当一个组织拥有多个 Agent 时，仅有单个聊天窗口或脚本无法解决以下问题：

- 谁负责什么，谁向谁汇报；
- 目标如何拆成可执行任务；
- 任务是否被正确领取，是否重复执行；
- 执行过程、成本、失败和阻塞是否可见；
- 哪些操作需要人批准；
- 最终结果是否形成可复查的文档、文件、链接或其他产物。

## 核心价值

Paperclip 把 Agent 从“单次调用”组织成“可治理的工作系统”：

1. 用 Company、Goal、Agent 和组织关系承载组织上下文。
2. 用 Issue、Project 和依赖关系承载工作上下文。
3. 用 Heartbeat、Run 和 Adapter 承载执行上下文。
4. 用 Approval、Budget、Secret、Tool policy 和 Audit 承载治理上下文。
5. 用 Artifact、Document、Work product 和 Activity 承载结果上下文。

## 主要角色

| 角色 | 主要责任 | 典型操作 |
| --- | --- | --- |
| Board / 人类监督者 | 设定目标、审批、预算和干预 | 创建公司、暂停 Agent、批准计划、查看审计 |
| Company 管理者 | 管理成员、连接、技能和组织配置 | 邀请成员、配置 Secret、管理应用 |
| CEO Agent | 把公司目标拆解成组织和工作 | 提出战略、创建项目、委派任务 |
| Manager Agent | 管理下属工作和执行结果 | 分解子任务、检查结果、请求审批 |
| Worker Agent | 执行具体 Issue 并提交结果 | 领取任务、调用工具、提交 Artifact |
| Runtime / Adapter | 提供实际执行能力 | 启动本地进程、远程运行时或外部 Agent |
| 外部连接系统 | 提供受治理的工具或数据 | GitHub、Slack、Email、MCP 等 |

## 产品边界

### 包含

- 公司和组织管理；
- Agent 注册、角色、汇报关系和执行配置；
- 目标、项目、任务和工作状态；
- 心跳、运行记录、日志、成本和恢复；
- 审批、预算、暂停、恢复、重派和审计；
- 工具、连接、Secret、Workspace 和产物治理；
- 任务关联的文档、对话和交付结果。

### 不包含

- 通用聊天产品；
- 直接替代 Jira、GitHub 或 Slack；
- 让 Paperclip 自身承担所有 Agent 的实际计算；
- 要求复现原项目的代码实现；
- 本规格范围内的生产部署和基础设施运维。

## 产品原则

1. **控制面优先**：Paperclip 负责协调、治理和记录，执行可由外部 Runtime 完成。
2. **任务是主要工作对象**：聊天和外部连接应回到 Issue、Run、Approval 或 Artifact。
3. **输出优先**：完成不只是状态变成 done，而是产生可审查结果。
4. **安全自治**：Agent 可以自动推进，但预算、工具、Secret 和高风险动作受治理。
5. **逐步交付**：先形成最小闭环，再扩展连接、插件、云运行时和自治能力。

## 证据与限制

> **事实**：仓库的 `doc/PRODUCT.md` 和 `docs/start/` 文档将 Paperclip 定位为 AI workforce control plane。

> **推断**：本目录把“Company → Goal → Issue → Run → Artifact → Approval/Audit”作为复现主骨架，是为了降低实现依赖和学习成本，不代表原作者的历史开发顺序。

> **待决策**：Goal 与 Initiative 的最终产品层级在现有文档和实现中存在差异，见 [证据与待决策](evidence/open-questions.md)。

