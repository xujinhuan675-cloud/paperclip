# 证据与待决策

## 当前证据入口

| 主题 | 主要来源 | 用途 |
| --- | --- | --- |
| 产品定位和原则 | `doc/PRODUCT.md`、`docs/start/what-is-paperclip.md` | 产品边界 |
| 核心概念和快速开始 | `docs/start/core-concepts.md`、`docs/start/quickstart.md` | 用户心智模型 |
| 系统结构 | `docs/start/architecture.md`、`doc/SPEC-implementation.md` | 架构背景 |
| 目标、任务和领域规则 | `doc/SPEC.md`、`doc/TASKS.md` | 业务对象和约束 |
| 路线和能力状态 | `ROADMAP.md` | 当前与未来能力的区分 |
| 真实执行链路 | `server/src/routes/`、`server/src/services/`、`packages/db/src/schema/`、`ui/src/` | 实现证据 |
| 调用和依赖关系 | Code Review Graph | 影响范围和高耦合边界 |
| 结构化公开导航 | Zread Wiki / 公开 Wiki | 辅助理解，不作为唯一事实来源 |

## 待决策

1. Goal 与 Initiative 是否统一为一个用户概念，还是需要同时暴露。
2. V1 是否只支持单一 Board，还是同时支持多用户 Company membership。
3. 哪些 Agent 类型、Adapter 和连接器属于最终产品核心，哪些保持可选。
4. 哪些动作必须 Approval，哪些低风险动作默认自动执行。
5. Issue 完成的最小证据是否统一为 Artifact，或按工作类型配置。
6. Budget hard stop 对已经排队的 Run 是取消、保留还是转为 blocked。
7. Agent Chat、Cases、Pipelines、Routines 的核心级别和默认入口。
8. Cloud、多租户、外部连接和 Memory 的正式质量承诺。

## 事实、推断与来源冲突处理

- 源码直接实现的规则标为事实。
- 多个入口拼接出的产品主路径标为推断。
- 为了可复现而选择的路线标为决策。
- 不确定或冲突内容必须留在本文件，不能默认为实现者的隐含任务。

## Zread 状态

本次尝试使用 Zread CLI 生成本地 Wiki，但 2026 年 10 月 11 日运行时返回 `LLM returned empty choices`，未生成 `.zread/wiki`。因此本次文档没有把 Zread 摘要当作唯一证据。后续若成功生成，应把 Wiki 作为导航层补充，并重新检查与源码的差异。

