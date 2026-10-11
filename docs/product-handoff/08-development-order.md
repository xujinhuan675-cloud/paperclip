# 08 开发顺序

## 总原则

按纵向用户闭环开发，不按“先做完所有前端，再做完所有后端”开发。每个阶段都应该让一个用户结果可运行、可观察、可验收。

## 推荐顺序

| 顺序 | 开发包 | 依赖 | 可见结果 |
| --- | --- | --- | --- |
| 1 | Company、身份、Board、基础访问 | 无 | 用户能进入自己的 Company |
| 2 | Agent、角色、组织关系、Adapter 配置 | 1 | 用户能创建可执行 Agent |
| 3 | Goal、Project、Issue、负责人和状态 | 1、2 | 用户能把目标变成工作 |
| 4 | Heartbeat、Run、基础执行和状态 | 2、3 | Agent 能真正领取并执行 Issue |
| 5 | Artifact、Comment、Activity、审计 | 3、4 | 用户能看到结果和证据 |
| 6 | Approval、Board 干预、暂停、恢复、改派 | 1、3、4 | 用户能治理执行过程 |
| 7 | Cost、Budget、hard stop | 4、6 | 用户能控制执行成本 |
| 8 | Recovery、Watchdog、Workspace | 4、7 | 系统能解释并恢复异常执行 |
| 9 | Secret、Tool、MCP、Connection | 4、6、7、8 | Agent 能安全使用外部能力 |
| 10 | Planning、Review、Projects、PR/Preview | 3、5、6、8 | 复杂工作可以交付和审查 |
| 11 | Plugin、Skills、Apps、外部连接 | 6、7、9、10 | 平台可以扩展 |
| 12 | Cloud、多用户、Import / Export、Memory | 前面全部 | 产品可以规模化运营 |

## 每个开发包的固定输出

1. 用户目标和不包含范围；
2. 页面或入口；
3. 对象、状态和规则；
4. API 或服务边界；
5. 成功、失败、超时和权限路径；
6. 产品可见的运行状态、成本或审计；
7. 验收场景；
8. 对下一开发包的稳定契约。

## 不应提前做的事情

- 在没有 Run、Budget、Approval 和 Audit 契约前扩展大量连接器；
- 在没有稳定 Issue 和 Artifact 模型前做复杂 Chat；
- 在没有 Workspace 和失败恢复前承诺代码生产体验；
- 在没有 Company 隔离和授权模型前开放多租户；
- 在没有真实反馈闭环前实现自组织、Memory 或 Maximizer。

