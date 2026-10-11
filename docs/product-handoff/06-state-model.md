# 06 状态模型

## Issue 状态

| 状态 | 含义 | 允许的主要动作 |
| --- | --- | --- |
| backlog | 已记录但未准备执行 | 编辑、补充上下文、分配 |
| todo | 已准备执行 | 分配、唤醒、开始 |
| in_progress | 有负责人且正在执行 | 查看 Run、暂停、取消、提交结果 |
| in_review | 已有结果，等待检查或批准 | 评论、批准、要求修改、完成 |
| done | 已满足完成标准 | 查看结果、重新打开 |
| blocked | 被依赖、权限、预算或外部条件阻塞 | 查看原因、解除阻塞、改派 |
| cancelled | 明确取消，不再继续 | 查看原因、必要时复制为新 Issue |

### Issue 规则

- 进入 `in_progress` 必须有有效负责人。
- 负责人变更必须产生审计，并根据规则触发唤醒或停止旧执行。
- `done` 必须关联完成证据，至少包括可读结果或明确的无产物理由。
- `blocked` 必须有阻塞原因和解除条件。

## Run 状态

| 状态 | 用户看到什么 | 系统必须保留什么 |
| --- | --- | --- |
| queued | 排队中及触发来源 | wakeup、Issue、Agent、创建时间 |
| running | 执行中、最近进度和日志 | Session、Workspace、成本和心跳 |
| waiting_approval | 等待人类决策 | Approval、动作、风险、上下文 |
| retrying | 将在何时重试以及原因 | 重试次数、上次错误、退避信息 |
| succeeded | 结果、产物和成本 | Artifact、输出、审计 |
| failed | 错误摘要和恢复选项 | 错误、日志、Workspace、成本 |
| cancelled | 取消者、原因和已产生结果 | 取消事件、部分产物 |
| orphaned/recovering | 系统正在回收或恢复 | 租约、锁、恢复阶段 |

## Agent 状态

`active`、`idle`、`running`、`error`、`paused`、`terminated`。

- `paused` 必须显示来源，例如 manual、budget、approval 或 error。
- `running` 不代表一定存在成功的 Run，UI 必须同时显示当前 Run。
- `terminated` 后不能接受新的 Issue，历史运行和产物仍可查询。

## Approval 状态

`pending → approved | rejected | revision_requested → resubmitted`。

- 只有 pending 或 revision_requested 可以被处理。
- 每次决策都保留决策人、理由、时间和来源。
- Approval 的通过可能改变 Agent、Budget、Connection 或 Run 状态，必须显示这些后果。

## Budget 状态

预算本身不替代 Agent 或 Run 状态。达到 hard stop 时：

1. 创建预算事件；
2. 暂停受影响的 Agent、Project 或 Company；
3. 阻止新的受限执行；
4. 取消或保留排队任务必须有明确产品规则；
5. 解决预算后只恢复因该预算原因暂停的对象。

## 状态展示要求

- 所有状态都应有名称、解释和下一步操作。
- 不用颜色作为唯一状态表达。
- 对长时间没有变化的 Run 显示“最后更新时间”和可能原因。
- 对失败、暂停、等待审批使用可搜索、可审计的结构化原因。

