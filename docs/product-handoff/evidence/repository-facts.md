# 仓库事实索引

## 主要源码证据

| 产品能力 | 主要实现入口 |
| --- | --- |
| Issue 创建、分配、状态和唤醒 | `server/src/routes/issues.ts`、`server/src/services/issues.ts`、`packages/db/src/schema/issues.ts` |
| Agent 心跳、运行、恢复 | `server/src/routes/agents.ts`、`server/src/services/heartbeat.ts`、`packages/db/src/schema/heartbeat_runs.ts` |
| Adapter 执行和 Workspace 上下文 | `packages/adapter-utils/src/acpx-engine/execute.ts`、`packages/adapters/` |
| Approval | `server/src/routes/approvals.ts`、`server/src/services/approvals.ts`、`packages/db/src/schema/approvals.ts` |
| Cost / Budget | `server/src/routes/costs.ts`、`server/src/services/costs.ts`、`server/src/services/budgets.ts`、`packages/db/src/schema/cost_events.ts` |
| Goals / Projects | `server/src/routes/goals.ts`、`server/src/routes/projects.ts`、`server/src/services/goals.ts`、`server/src/services/projects.ts` |
| Workspace / Environment | `server/src/routes/environments.ts`、`server/src/routes/execution-workspaces.ts`、对应 services 和 schemas |
| UI 工作入口 | `ui/src/pages/`、`ui/src/api/` 中的 Companies、Agents、Issues、Projects、Approvals、Costs、Artifacts、Workspaces 等模块 |

## Code Review Graph

- 当前图谱：约 6,866 个文件、97,831 个节点、1,657,198 条边。
- 高影响社区：`services-issue`、`src-tool`、`components-issue`。
- 高耦合边界：Issue 服务与工具/执行层、工具层与客户端配置、Issue 服务与脚本解析。
- 使用方式：图谱用于调用、依赖和影响范围导航；不替代测试，也不单独证明产品行为正确。

## Zread / 公开 Wiki

- 公开 Wiki 可用于快速理解目录和模块，但可能对应不同时间点。
- 本次 Zread CLI 生成未成功，原因是 LLM 返回空 choices，没有把未生成的 Wiki 当作证据。
- 后续若成功生成，应将其作为导航层，并用本文件中的源码入口复核关键行为。

## 证据等级

1. 代码和测试的实际行为；
2. 当前有效规范文档；
3. Code Review Graph 的结构关系；
4. Zread 或公开 Wiki 摘要；
5. 愿景、路线图和历史计划。

