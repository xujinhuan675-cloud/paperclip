# 需求索引

| 编号 | 需求 | 版本 | 依赖 |
| --- | --- | --- | --- |
| REQ-001 | [创建 Company 与首个目标](REQ-001-company-and-first-goal.md) | V1 | 身份、Company |
| REQ-002 | [配置 Agent 与组织关系](REQ-002-agent-and-organization.md) | V1 | REQ-001 |
| REQ-003 | [分配 Issue 并触发 Agent 执行](REQ-003-issue-assignment-and-execution.md) | V1 | REQ-001、REQ-002 |
| REQ-004 | [显示 Run 状态并处理失败恢复](REQ-004-run-observability-and-recovery.md) | V1/V1.1 | REQ-003 |
| REQ-005 | [预算、审批与人类治理](REQ-005-governance-budget-and-approval.md) | V1/V1.1 | REQ-001 至 REQ-004 |
| REQ-006 | [形成可审查产物与审计记录](REQ-006-artifacts-and-audit.md) | V1/V1.2 | REQ-003 至 REQ-005 |
| REQ-007 | [执行 Workspace、工具和 Secret 授权](REQ-007-workspace-tools-and-secrets.md) | V1.1 | REQ-002、REQ-003、REQ-005 |
| REQ-008 | [复杂任务的计划、审查与交付](REQ-008-planning-review-and-delivery.md) | V1.2 | REQ-003、REQ-005 至 REQ-007 |
| REQ-009 | [定时 Routine 与自动化工作](REQ-009-routines-and-scheduled-work.md) | V1.2 | REQ-003 至 REQ-005 |
| REQ-010 | [插件、Skills 与外部连接扩展](REQ-010-plugins-skills-and-connections.md) | V2 | REQ-005、REQ-007、REQ-009 |

## 使用规则

- 先读对应版本路线，再读本索引和单个需求。
- 需求文件中的“事实”来自证据，“推断”是推荐复现方式，“待决策”不能默认为实现任务。
- 一个需求完成后，必须同时更新相关流程、状态、验收和实现接触点。
- 不把需求文件直接当成代码任务列表；先确认对象、依赖和用户结果，再拆实施任务。

