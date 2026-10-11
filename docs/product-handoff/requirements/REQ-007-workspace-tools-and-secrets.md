# REQ-007：执行 Workspace、工具和 Secret 授权

> **读者契约**：本需求定义 Agent 在哪里工作、可以使用什么，以及用户如何控制外部副作用。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1.1 |
| 用户 | Company 管理者、Board、Agent |
| 前置条件 | 已存在可执行 Agent、Issue 和 Run |
| 结果 | Agent 在可解释、可授权的执行环境中工作 |
| 依赖 | REQ-002、REQ-003、REQ-005 |

## 需求

1. Issue 或 Project 可以指定执行 Workspace 策略。
2. Run 启动前必须确认 Workspace 可用、租约有效且与 Company 隔离。
3. Tool、MCP、App 和 Secret 授权必须带有范围、来源和有效期。
4. 未授权、过期或撤销的 Secret 不得注入执行上下文。
5. Workspace、工具和 Secret 的调用必须归因到 Agent、Issue 和 Run。
6. 环境失败、租约冲突和授权失败必须成为用户可理解的状态。

## 验收标准

- Given Run 需要 Workspace，When Workspace 不可用，Then Run 不进入假运行状态并显示阻塞原因。
- Given Agent 没有 Secret 权限，Then 工具调用被拒绝，Secret 内容不出现在日志中。
- Given 一个 Workspace 已被占用，Then 系统不允许产生冲突的并发副作用。
- Given 用户撤销连接，Then 后续 Run 不能继续使用旧授权。
- Given 工具调用成功，Then Activity / Audit 能回到具体 Agent、Issue、Run 和工具。

## 实现接触点

- UI：Environments、Execution Workspaces、Secrets、Apps、Tools。
- API：`server/src/routes/environments.ts`、`server/src/routes/execution-workspaces.ts`、工具和 Secret routes。
- 服务：environment、workspace-realization、workspace-runtime、secret、tool gateway services。
- 执行：`packages/adapter-utils/src/acpx-engine/execute.ts`。

## 事实与待决策

- **事实**：源码存在 Workspace、环境、租约、Secret、MCP 和工具网关相关对象与入口。
- **推断**：Workspace 和授权应在外部连接大规模扩展前稳定。
- **待决策**：V1.1 默认采用本地 Workspace 还是同时提供远程沙箱。

