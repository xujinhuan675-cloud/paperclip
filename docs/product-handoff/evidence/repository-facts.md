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

- 2026 年 10 月 11 日图谱快照：6,874 个文件、97,859 个节点、1,657,432 条边；构建 SHA 与本次 Wiki 对应 HEAD 一致。
- 高影响社区：`services-issue`、`src-tool`、`components-issue`。
- 高耦合边界：Issue 服务与工具/执行层、工具层与客户端配置、Issue 服务与脚本解析。
- 使用方式：图谱用于调用、依赖和影响范围导航；不替代测试，也不单独证明产品行为正确。

## Zread / 公开 Wiki

- 公开 Wiki 可用于快速理解目录和模块，但可能对应不同时间点。
- 初次生成在 2026 年 10 月 11 日因空 choices 失败；临时配置补齐 API 基础路径 `/v1` 后，于 2026 年 10 月 12 日完成本地 30 页中文 Wiki，全局配置未改动。
- 版本：`2026-10-11-202459`；Git HEAD：`da2f6e08facc9d8d32688c14e95331a941d92453`。原始结果保留在 `.zread/wiki/versions/2026-10-11-202459/`。
- 可阅读副本入口：`C:/Users/20843/Documents/Codex/2026-10-10/step-1-add-the-marketplace-codex/outputs/paperclip-zread-wiki/README.md`。
- 副本已检查 1,883 条源码引用的存在性及行号范围，并修正 11 处错误引用；页间链接按唯一页面编号规范化。该结果属于结构完整性检查，不能证明所有业务解释正确。
- Wiki 仅作为源码导航层，关键行为仍需用本文件中的源码入口和测试复核。未进行公开发布。

## 证据等级

1. 代码和测试的实际行为；
2. 当前有效规范文档；
3. Code Review Graph 的结构关系；
4. Zread 或公开 Wiki 摘要；
5. 愿景、路线图和历史计划。

