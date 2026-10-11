# REQ-003：分配 Issue 并触发 Agent 执行

> **读者契约**：这是 V1 的核心纵向闭环，定义任务从创建到执行开始的规则。

| 字段 | 内容 |
| --- | --- |
| 状态 | 推荐纳入 V1 |
| 用户 | Board、Manager Agent、Worker Agent |
| 前置条件 | 已存在 Company、Agent 和有效 Adapter |
| 结果 | Issue 被唯一领取，并产生可追踪 Run |
| 依赖 | REQ-001、REQ-002 |

## 用户结果

用户创建一个任务并指定 Agent，系统唤醒正确的 Agent，避免重复执行，并让用户看见任务和运行状态。

## 需求

1. Issue 必须属于一个 Company。
2. Issue 可以关联 Goal、Project、父任务和 Workspace。
3. 一个可执行 Issue 同一时刻只能有一个有效负责人。
4. Issue 进入 `in_progress` 前必须有有效负责人。
5. assignment、comment、manual、schedule 和 approval 等触发源必须能区分。
6. 触发请求需要幂等或去重，不能因重复点击产生多个相同执行。
7. Agent checkout 必须是原子操作。
8. assignment、负责人变化和执行开始必须产生 Activity / Audit。

## 交互

- Issue 创建页提供标题、描述、负责人、Project、Goal、优先级和可选 Workspace。
- Issue 详情显示当前状态、负责人、触发来源、最近 Run 和产物。
- 分配成功后显示“已排队 / 执行中”，不直接显示完成。
- 用户可从 Agent 详情查看分配给该 Agent 的 Issue。
- 重复提交时显示已有 Run 或排队请求，而不是创建第二个。

## 验收标准

- Given 有效 Agent，When 用户创建并分配 Issue，Then Issue 保存负责人并触发一次可追踪 wakeup。
- Given 两个 Agent 同时 checkout，Then 只有一个成功，另一个看到明确的已被领取结果。
- Given Issue 无负责人，When 用户设置 `in_progress`，Then 请求被拒绝。
- Given 重复 assignment 事件，Then 系统不会启动重复的有效 Run。
- Given Agent paused 或 budget-stopped，Then Issue 保留且用户看到不可执行原因。

## 实现接触点

- UI：`ui/src/api/issues.ts`、Issue Detail、Agent Detail。
- API：`server/src/routes/issues.ts`。
- 服务：`server/src/services/issues.ts`、issue assignment wakeup。
- 数据：`packages/db/src/schema/issues.ts`。
- 执行：`server/src/services/heartbeat.ts`、heartbeat run schema。

## 事实与待决策

- **事实**：源码对单一负责人、状态前置条件、assignment wakeup 和原子 checkout 有实际约束。
- **推断**：任务是 Paperclip 的主要通信和协作对象，通用聊天不应绕过 Issue。
- **待决策**：任务完成是否必须产生 Artifact，或允许某些纯状态/通知类任务无产物完成。

