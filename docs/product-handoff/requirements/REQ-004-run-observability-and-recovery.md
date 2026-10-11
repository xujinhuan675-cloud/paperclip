# REQ-004：显示 Run 状态并处理失败恢复

> **读者契约**：本需求把“Agent 正在工作”变成用户可观察、可恢复的产品行为。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1 基础，V1.1 完善 |
| 用户 | Board、Company 管理者、任务负责人 |
| 前置条件 | REQ-003 已能产生 Run |
| 结果 | 用户能判断执行进展、失败原因和下一步动作 |
| 依赖 | REQ-003 |

## 用户结果

用户可以查看 Run 的排队、运行、等待审批、成功、失败、取消和恢复状态，并能在可恢复时采取行动。

## 需求

1. Run 必须记录触发来源、Issue、Agent、创建时间和当前状态。
2. Running 状态必须有最后更新时间或进度信号。
3. 日志、事件、成本和 Workspace 信息必须能回到 Run。
4. 失败必须保存错误摘要和可定位的详细日志。
5. 可恢复失败必须有有界重试，不得无限重试。
6. 系统重启或执行器中断后，队列和锁不能造成静默丢失或重复副作用。
7. 用户取消必须反馈请求状态和最终停止状态。

## 交互

- Agent Detail、Issue Detail 和 Run Detail 都能进入同一 Run 记录。
- 状态区域显示状态、触发来源、最后更新时间、耗时、成本和下一步。
- 日志默认展示可读摘要，提供进入详细日志的入口。
- 失败页区分“重试”“重新分配”“修改配置”“查看日志”“放弃”。
- 恢复中的 Run 显示系统正在做什么，避免用户重复操作。

## 验收标准

- Given Run 已排队，Then 用户可以看到排队原因和触发来源。
- Given Run 运行超过预期，Then UI 显示最后更新时间和非阻塞的等待状态。
- Given Adapter 返回失败，Then Run 进入 failed，Issue 不得伪装为 done。
- Given 可恢复的中断，When watchdog 触发恢复，Then 只产生一次有效继续执行。
- Given 超过重试上限，Then Run 停止自动重试并要求用户处理。

## 实现接触点

- UI：`ui/src/api/heartbeats.ts`、Agent Detail、Run / Task surfaces。
- API：`server/src/routes/agents.ts` heartbeat invoke、events、logs、cancel。
- 服务：`server/src/services/heartbeat.ts`。
- 数据：`packages/db/src/schema/heartbeat_runs.ts`。
- 执行：`packages/adapter-utils/src/acpx-engine/execute.ts`。

## 事实与待决策

- **事实**：源码存在 durable wakeup、queued run、恢复、孤儿清理和有界重试路径。
- **推断**：运行可观察性是产品功能，不是后台运维附属能力。
- **待决策**：不同 Adapter 的默认超时、重试次数和用户可修改范围。

