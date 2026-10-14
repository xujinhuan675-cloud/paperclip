# 04 产品架构

## 架构分层

```text
用户界面层
├── Dashboard / Inbox / What Needs Me
├── Companies / Org / Agents
├── Goals / Projects / Issues
├── Runs / Logs / Costs / Approvals
└── Artifacts / Audit / Settings / Connections

应用服务层
├── Company and access service
├── Goal / project / issue service
├── Agent and organization service
├── Heartbeat and run orchestration
├── Approval / budget / cost governance
├── Artifact / document / activity service
└── Tool / secret / workspace service

持久化与事件层
├── Domain records and relationships
├── Durable wakeup and run queue
├── Cost and audit events
├── Approval and decision states
└── Workspace and environment leases

执行适配层
├── Local process / Claude / Codex / HTTP adapters
├── Workspace and environment realization
├── Tool and MCP gateway
└── External apps and connectors
```

## 一次执行的方向

1. 用户或系统产生一个触发源。
2. 应用服务检查 Company、Agent、Issue、权限、预算和当前状态。
3. 系统创建或合并 Heartbeat / Run 请求。
4. 执行层领取任务并准备 Workspace、Session、Secret 和工具上下文。
5. Adapter 启动外部 Agent 或进程。
6. 系统持续记录状态、日志、成本和审计事件。
7. 结果写入 Comment、Document、Artifact 或 Work product。
8. 需要人工确认时进入 Approval 或 Decision Queue。
9. Issue、Project 和 Dashboard 显示最终状态。

## 边界规则

### UI 到 API

- UI 只能通过受约束的 API 发起状态变化。
- UI 显示的按钮必须与当前角色、Issue 状态、预算状态和审批状态一致。
- 轮询或事件订阅只负责更新展示，不能替代服务端状态机。

### API 到服务

- Route 层负责身份、参数和请求上下文；业务规则集中在 Service 层。
- Service 层负责 Company 隔离、状态迁移、原子领取、审计和后置唤醒。
- 对外返回的错误应能让用户知道下一步如何处理。

### 服务到执行层

- 执行层不能绕过 Company、Budget、Secret、Approval 和 Audit 约束。
- Adapter 只负责执行协议，不拥有 Paperclip 的最终业务状态。
- 运行结束、失败、取消和恢复都必须回写 Run 与 Issue。

## Code Review Graph 重点

Code Review Graph 显示 `services-issue`、`src-tool` 和 `components-issue` 是高影响区域，Issue、Heartbeat、Tool Gateway 和执行适配器之间存在跨模块耦合。产品交接时应把这些边界写成稳定契约，并为跨边界变更补充集成验收，而不是把它们视为互不相关的页面功能。

## 当前证据限制

2026 年 10 月 11 日的初次生成因 `LLM returned empty choices` 失败；修正临时配置中的 API 基础路径后，Zread CLI 已于 2026 年 10 月 12 日完成 30 页中文本地 Wiki。版本为 `2026-10-11-202459`，原始结果位于 `.zread/wiki/versions/2026-10-11-202459/`，当前版本指针为 `.zread/wiki/current`。

可阅读的 Markdown 交付副本位于 `C:/Users/20843/Documents/Codex/2026-10-10/step-1-add-the-marketplace-codex/outputs/paperclip-zread-wiki/README.md`。副本已核对 1,883 条源码引用的路径和行号，修正 11 处引用错误并规范化 13 处页间 slug 拼写偏差。该检查不证明全部业务结论正确；本目录仍以本地源码、测试和有效规范为依据，Wiki 与 Code Review Graph 用作导航，不替代产品交接规格。

