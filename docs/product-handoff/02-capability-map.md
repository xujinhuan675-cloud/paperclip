# 02 能力地图

## 总体结构

```text
公司与身份
└── 组织与 Agent
    └── 目标与项目
        └── Issue 与工作流
            └── Heartbeat 与 Run
                └── Workspace、Tools、Secrets
                    └── Artifact、Review、Approval
                        └── Cost、Audit、Recovery
```

## 能力域

### A. 公司与身份

- Instance 可承载多个 Company。
- Company 是权限、目标、预算、Agent、任务和审计的隔离边界。
- 人类用户通过 Board 或 Company membership 参与治理。
- 支持本地可信模式和需要认证的模式。

### B. Agent 与组织

- Agent 是组织中的 AI 员工，而不是孤立的聊天机器人。
- Agent 有角色、能力、汇报关系、状态、预算和 Adapter 配置。
- 组织树约束任务委派和上下文继承。
- Agent 可绑定工具、技能、Secret 和执行环境。

### C. 目标、项目与任务

- Goal / Initiative 表达组织方向。
- Project、Milestone、Team 组织交付范围。
- Issue 支持父子层级、单一负责人、依赖、阻塞、评论、文档和产物。
- Issue 状态至少需要支持 backlog、todo、in_progress、in_review、done，并处理 blocked、cancelled 等终态或旁路状态。

### D. 执行与运行

- Heartbeat 可由手动、任务分配、评论、审批、定时或自动化触发。
- Run 是一次可追踪的执行实例，包含状态、日志、会话、成本和结果。
- Adapter 把控制面任务交给本地进程、HTTP 服务或外部 Agent Runtime。
- 系统需要处理队列、去重、锁、超时、重试、恢复和孤儿运行。

### E. 治理与安全

- Approval 和 Decision Queue 承载需要人确认的动作。
- Budget 和 Cost ledger 记录消费，并支持告警与 hard stop。
- Secret 按 Company、Agent、连接或工具范围授权。
- Tool、MCP、App 和连接调用必须可审计、可限制、可撤销。
- Activity 和 Audit 记录谁在什么时候通过什么路径改变了什么。

### F. 工作空间与工具

- Project、Repository、Workspace 和 Execution Workspace 提供执行上下文。
- Workspace 可能是本地目录、受管理环境或远程沙箱。
- 工具调用需要带上 Company、Agent、Issue、Run 和授权上下文。
- 工作空间状态、租约、分支、会话和恢复信息需要对用户可见到足以排障的程度。

### G. 结果与运营

- Artifact、Document、Attachment、Work product、PR 和 Preview 是结果载体。
- Dashboard、Inbox、Timeline、Costs、Audit 和 Search 是监督入口。
- 用户能够看到运行中、等待批准、失败、暂停、恢复和完成等状态。
- 纯内部基础设施指标不属于产品功能，除非它们影响用户判断或操作。

### H. 扩展生态

- Adapter 和 Plugin 扩展执行能力。
- Skills、Skill Studio 和 Skill policy 扩展 Agent 能力。
- MCP Gateway、Apps 和外部 connectors 扩展数据与工具。
- Chat、GitHub、Slack、Email 等外部渠道必须回到任务、审批或产物上下文。

## 默认核心与后续扩展

| 层级 | 必须进入核心路线 | 可在核心稳定后扩展 |
| --- | --- | --- |
| 控制平面 | Company、Goal、Agent、Issue、Run、Artifact、Approval、Audit | Memory、自动组织学习 |
| 执行平面 | 至少一种可靠 Adapter、Heartbeat、状态和恢复 | 云沙箱、多 Runtime 编排 |
| 治理 | 预算、成本、暂停、审批、Secret、工具授权 | 更细的 RBAC、复杂策略市场 |
| 连接 | 基础工具授权和审计 | 大量 SaaS、外部聊天和一键连接 |
| 协作 | Board 监督和单一治理主路径 | 多人协作、复杂角色矩阵 |

