# 07 版本路线

> 这是面向复现的推荐路线，不是 Paperclip 原作者的历史开发顺序。

## V1：最小可运行自治公司

### 目标

让 Board 能创建一个 Company，配置一个 CEO 和至少一个可用 Worker，通过 Issue 触发一次执行，并看到可审查结果。

### 范围

- 本地可信启动和基础身份；
- Company、Board、Goal / Initiative；
- Agent 注册、角色、汇报关系和一个可靠 Adapter；
- Issue、Project、负责人、状态和评论；
- Heartbeat、Run、基本日志和执行结果；
- 基础 Approval、Cost、Activity / Audit；
- Artifact 或 Document 形式的首个结果。

### 版本出口

用户可以在一个连贯流程中完成：

`创建 Company → 创建目标 → 配置 CEO → 创建任务 → Agent 执行 → 查看结果`

## V1.1：安全可运营

- 预算告警和 hard stop；
- 失败、超时、重试、Watchdog 和恢复；
- 执行 Workspace、环境状态和租约；
- Secret 管理和 Agent 级绑定；
- Tool / MCP 基础授权；
- 成本明细、运行日志和审计查询；
- 基础多用户协作和 Company 权限。

### 版本出口

用户可以解释一次失败、阻止一次超预算执行、批准或拒绝一次高风险操作，并恢复一次可恢复运行。

## V1.2：计划、协作与交付质量

- 子任务、依赖、阻塞和 Project 视图；
- Planning mode、版本化计划和计划审批；
- Review gate、Decision Queue 和 What Needs Me；
- Artifact、PR、Preview、文档和结果来源；
- Repository / Workspace 关联；
- 端到端验收场景和执行质量指标。

### 版本出口

复杂任务可以拆解、审查、修改并交付可验证的结果，而不是只在聊天中完成。

## V2：平台化扩展

- Plugin / Adapter SDK；
- Skills Manager、Studio、Store 和版本策略；
- MCP Gateway、Apps、OAuth 和 Connection Intent；
- 更多 Runtime、远程沙箱和云运行时；
- Company Import / Export 和模板；
- 少量优先级最高的外部连接器。

### 版本出口

第三方能力可以在不破坏 Company 隔离、预算、审批和审计的情况下接入。

## V2.1+：规模化自治

- Memory / Knowledge；
- Work queues；
- 自组织和组织学习；
- Maximizer mode；
- CEO Chat，但必须回到 Issue、Plan、Approval 或 Artifact；
- 更多外部系统接入、桌面端和一键连接。

这些能力不能先于可审计运行、预算、治理和恢复能力进入核心路线。

## 不同版本的共同出口

每个版本必须满足：

- 有清晰的用户结果；
- 有可执行的主流程和失败路径；
- 有依赖和不包含范围；
- 有结构化状态和审计；
- 有验收场景；
- 不需要读下一版本文档才能使用当前版本。

