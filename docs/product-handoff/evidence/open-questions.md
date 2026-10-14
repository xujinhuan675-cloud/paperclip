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
| 结构化源码导航 | 本地 Zread Wiki / 公开 Wiki | 辅助理解；本地版绑定当前源码，公开版可能对应不同时间点 |

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

初次生成在 2026 年 10 月 11 日返回 `LLM returned empty choices`。诊断确认原 API 基础路径缺少 `/v1`，请求得到 HTML 而非模型响应。仅在隔离的临时 Zread 配置中修正路径，保持全局配置不变，并复用草稿续跑；于 2026 年 10 月 12 日完成全部 30 页。

- 正式版本：`2026-10-11-202459`；对应 Git HEAD：`da2f6e08facc9d8d32688c14e95331a941d92453`。
- 原始结果：`.zread/wiki/versions/2026-10-11-202459/`；`current` 指向 `versions/2026-10-11-202459`。
- Markdown 入口：`C:/Users/20843/Documents/Codex/2026-10-10/step-1-add-the-marketplace-codex/outputs/paperclip-zread-wiki/README.md`。
- 已检查：30 页中文文件、1,883 条源码引用路径与行号；交付副本修正 11 处引用错误、规范化 13 处页间 slug 拼写偏差，原始生成结果未覆盖。
- 未验证：所有业务结论、完整产品交互和端到端执行。Wiki 不解决上面的产品待决策项，也不自动升级为可执行需求契约。
- 仅生成本地文件，未上传或公开发布到 zread.ai；临时凭据配置已移除。

