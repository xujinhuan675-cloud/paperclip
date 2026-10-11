# REQ-009：定时 Routine 与自动化工作

> **读者契约**：本需求定义定时唤醒，不等于允许无限自动执行；每个 Routine 仍需有范围、预算和审计。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1.2 |
| 用户 | Board、Company 管理者 |
| 前置条件 | Heartbeat、Budget、Audit 已稳定 |
| 结果 | 用户可以安全地重复执行报告、检查或维护任务 |
| 依赖 | REQ-003、REQ-004、REQ-005 |

## 需求

1. Routine 必须说明计划、时区、触发对象、负责人和预算范围。
2. 每次触发必须产生可追踪 Heartbeat / Run。
3. Routine 必须支持暂停、恢复和手动立即运行。
4. 重复触发不得绕过去重、预算和审批规则。
5. 用户必须能查看最近一次、下一次和失败历史。

## 验收标准

- Given 有效 Routine，When 到达计划时间，Then 创建一次带 `schedule` 来源的 Run。
- Given Routine 已暂停，Then 到期不会创建新的有效 Run。
- Given 同一时间重复触发，Then 只保留一条有效执行链。
- Given Routine 超过预算或需要审批，Then 使用统一的治理路径。
- Given Routine 连续失败，Then 用户可看到失败历史和停用入口。

## 实现接触点

- UI：Routines、Routine Detail、Dashboard、Costs。
- API / 服务：routine、scheduler、heartbeat、budget、approval services。

## 事实与待决策

- **事实**：源码和 UI 存在 Routines 与 schedule 触发入口。
- **推断**：Routine 必须复用 Heartbeat 和治理契约，不应建立第二套执行系统。
- **待决策**：Routine 的默认失败阈值和自动暂停策略。

