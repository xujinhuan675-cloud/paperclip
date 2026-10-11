# REQ-006：形成可审查产物与审计记录

> **读者契约**：本需求定义“完成”如何被证明，以及用户如何回看发生过什么。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1 基础，V1.2 完善 |
| 用户 | Board、Reviewer、任务参与者 |
| 前置条件 | Issue 和 Run 已存在 |
| 结果 | 用户能查看结果、来源、审查状态和完整变更轨迹 |
| 依赖 | REQ-003、REQ-004、REQ-005 |

## 需求

1. Artifact、Document、Comment、Attachment 和 Work product 必须有明确类型。
2. 产物必须关联 Company、Issue、Run、Agent 和创建时间。
3. 用户必须能区分草稿、待审查、已批准、已完成和已归档。
4. Activity / Audit 必须记录关键状态、负责人、审批、预算和连接变化。
5. 产物或审计内容不能跨 Company 泄漏。
6. 部分失败或部分结果必须明确标记，不能显示为完整成功。

## 交互

- Issue 详情提供结果摘要和产物列表。
- Artifact 详情显示来源 Run、生成 Agent、相关审批和版本变化。
- Timeline / Audit 提供按对象、操作人、时间和事件类型筛选。
- 用户可以从失败 Run 进入部分产物，但必须看到其未完成状态。

## 验收标准

- Given Run 成功且产生文件或文档，Then Issue 详情显示可访问 Artifact。
- Given Artifact 来自 Company A，Then Company B 无法查询或下载。
- Given Issue 被改派或预算暂停，Then Audit 记录操作者、时间、旧值和新值。
- Given Run 失败但产生部分结果，Then 结果标记为 partial，不得被当成完成交付。
- Given 用户查看 Artifact，Then 可以回到产生它的 Issue 和 Run。

## 实现接触点

- UI：Artifacts、Issue Detail、Timeline、Audit、Search。
- API：artifact、documents、activity、audit routes。
- 服务：artifact / document / activity services。
- 数据：artifact、document、activity / audit schemas。

## 事实与待决策

- **事实**：源码存在 Artifacts、Documents、Work products、Activity 和 Audit 相关入口。
- **推断**：产物是输出优先产品原则的验收核心。
- **待决策**：不同类型任务的最小完成证据是否需要按 Project 或 Workflow 配置。

