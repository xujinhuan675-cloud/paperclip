# 03 领域模型

## 关系主线

```text
Company
├── Human memberships / Board
├── Goals / Initiatives
├── Agents ── reports to ── Agents
├── Projects ── link to ── Goals
├── Issues ── belong to ── Company
│   ├── parent / sub-issues
│   ├── assignee Agent or User
│   ├── Project / Goal / Workspace
│   ├── Comments / Documents / Attachments
│   └── Reviews / Approvals / Artifacts
├── Heartbeat Runs ── execute ── Issues
├── Budgets / Cost Events
├── Secrets / Tool Grants / Connections
├── Skills / Plugins / Adapters
└── Activity / Audit Events
```

## 对象职责

| 对象 | 解决的问题 | 必须稳定的规则 |
| --- | --- | --- |
| Company | 隔离一个 AI 组织 | 所有核心资源必须能追溯到 Company |
| Goal / Initiative | 说明为什么做 | 目标应能向下关联 Project 或 Issue |
| Agent | 谁来做 | 角色、能力、汇报关系、状态和运行配置可查询 |
| Project | 一组有边界的交付工作 | 可关联 Goal、Workspace、预算和 Issue |
| Issue | 可执行的工作单元 | 单一负责人、明确状态、可追溯变更 |
| Heartbeat | 为什么现在唤醒 Agent | 记录触发来源和去重关系 |
| Run | 一次实际执行 | 有生命周期、日志、成本、错误和结果 |
| Artifact | 交付了什么 | 能指向产生它的 Issue 和 Run |
| Approval | 谁批准了高风险动作 | 状态、决策人、理由和后续动作可审计 |
| Budget / Cost Event | 花了多少、是否允许继续 | 范围、时间窗、阈值和 hard stop 可解释 |
| Secret / Tool Grant | Agent 能访问什么 | 授权范围、来源、过期和撤销可追踪 |
| Audit Event | 谁改变了什么 | 记录主体、动作、对象、来源和时间 |

## 关键不变量

1. **Company 隔离**：一个请求不能读写另一个 Company 的对象。
2. **单一负责人**：一个可执行 Issue 在同一时刻只有一个有效负责人。
3. **原子领取**：多个 Agent 同时竞争时，只能有一个成功 checkout。
4. **状态有前置条件**：例如没有负责人时不能进入执行中。
5. **执行可追溯**：Issue、Heartbeat、Run、Artifact 和 Audit 能互相追溯。
6. **预算先于执行**：达到 hard stop 后，不应继续接受新的受限执行。
7. **授权随调用传递**：工具、Secret 和 Workspace 调用都要保留 Company、Agent、Issue 和 Run 上下文。
8. **暂停可解释**：用户能区分手动暂停、预算暂停、错误暂停和系统恢复中。

## Goal 与 Initiative 的处理决策

> **事实**：不同仓库文档对 Company goal 和 Initiative 的层级表述并不完全一致。

> **决策（复现路线）**：第一阶段把它们统一抽象为“目标层对象”，对外只保留一个清晰的用户心智模型。实现时可以保留内部两种类型，但需求文档不能要求用户理解实现差异。

> **待决策**：若产品需要同时展示 Goal 和 Initiative，必须补充两者的创建入口、父子关系、状态和验收标准。

