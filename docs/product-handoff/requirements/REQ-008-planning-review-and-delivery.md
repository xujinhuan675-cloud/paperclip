# REQ-008：复杂任务的计划、审查与交付

> **读者契约**：本需求把多个 Issue 组织成可审查的交付，不要求一开始实现所有外部代码托管集成。

| 字段 | 内容 |
| --- | --- |
| 状态 | V1.2 |
| 用户 | Board、Manager Agent、Reviewer |
| 前置条件 | Issue、Run、Artifact 和 Approval 已稳定 |
| 结果 | 复杂工作能拆解、审查、修订并交付 |
| 依赖 | REQ-003、REQ-005、REQ-006、REQ-007 |

## 需求

1. 一个复杂目标可以形成 Project、父 Issue、子 Issue 和依赖关系。
2. 计划必须有版本或修订关系，用户能看出当前生效版本。
3. 计划批准后才能释放受治理的后续工作。
4. Review 必须能关联 Issue、Run、Artifact 和修订意见。
5. 交付结果必须标记草稿、待审查、已批准、已完成或已发布状态。
6. 阻塞、失败和部分完成必须在 Project 级别可见。

## 验收标准

- Given 一个复杂 Goal，When CEO 或 Board 创建计划，Then 用户可看到计划版本、Issue 层级和依赖。
- Given 计划未批准，Then 受治理的后续执行不会静默释放。
- Given Reviewer 要求修改，Then Agent 得到具体反馈，原版本仍可回看。
- Given 一个子任务失败，Then Project 显示影响范围，不得显示为无条件完成。
- Given 所有必要结果已批准，Then Project 可生成最终交付摘要和 Artifact 索引。

## 实现接触点

- UI：Goals、Projects、Issue Detail、Planning、Approvals、Artifacts。
- API / 服务：projects、goals、plans、reviews、approvals、artifacts。
- 数据：project、goal、issue hierarchy、plan revision、review、artifact provenance。

## 事实与待决策

- **事实**：源码已存在 Project、Goal、Issue 层级、Planning、Review、Approval 和 Artifact 入口。
- **推断**：复杂交付应以 Issue 与 Artifact 为主线，而不是独立聊天记录。
- **待决策**：第一版交付是否需要真实 PR / Preview，还是先用通用 Artifact 表达。

