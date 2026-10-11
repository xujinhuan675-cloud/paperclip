# REQ-005：预算、审批与人类治理

> **读者契约**：本需求定义 Agent 自治的边界，确保用户可以批准、拒绝、暂停和控制成本。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1 基础，V1.1 完善 |
| 用户 | Board、Approver、Company 管理者 |
| 前置条件 | Company、Agent、Issue 和 Run 已存在 |
| 结果 | 高风险动作和超预算执行受到可解释的控制 |
| 依赖 | REQ-001 至 REQ-004 |

## 需求

1. Approval 必须说明被批准的动作、对象、风险、发起者和上下文。
2. 用户可以 approve、reject、request revision 或 resubmit。
3. 只有可处理状态的 Approval 才能被决策。
4. 每次决策必须写入 Audit，并能追溯到后续状态变化。
5. Budget 必须支持 Company、Agent、Project 等范围和时间窗。
6. 达到 hard stop 后，系统必须阻止新的受限执行并显示暂停原因。
7. 恢复预算后，只恢复因该预算原因暂停的对象。
8. 用户可以从 Dashboard、Inbox、Decision Queue 或 Issue 详情找到待处理事项。

## 交互

- Approval 卡片显示动作、风险、相关 Issue / Run / Artifact、预计成本和按钮。
- Reject 和 request revision 必须要求或鼓励填写原因。
- Budget 页面显示已用、阈值、预计消耗、受影响对象和处理入口。
- Pause、resume、reassign 和 override 需要确认，并显示副作用。

## 验收标准

- Given pending Approval，When approver approve，Then 只有对应动作被释放，决策被审计。
- Given Approval 已处理，When 再次 approve，Then 系统拒绝重复决策且不重复副作用。
- Given Agent 达到 hard stop，Then 新 Run 被拒绝，现有状态显示 budget pause。
- Given 用户修改预算，Then 规则范围、时间窗和生效时间清晰可见。
- Given 某对象因手动暂停，Then 预算恢复不能自动解除该暂停。

## 实现接触点

- UI：Approvals、Approval Detail、Decision Queue、Costs、Budgets、What Needs Me。
- API：`server/src/routes/approvals.ts`、`server/src/routes/costs.ts`。
- 服务：`server/src/services/approvals.ts`、`server/src/services/budgets.ts`、`server/src/services/costs.ts`。
- 数据：approvals、cost_events、budget policies/incidents。

## 事实与待决策

- **事实**：源码实现 Approval 状态转换、成本事件、范围预算和 hard-stop pause。
- **推断**：预算和审批必须与执行内核同期建设，而不是上线后补充。
- **待决策**：V1 哪些动作必须审批，哪些低风险动作允许自动执行。

