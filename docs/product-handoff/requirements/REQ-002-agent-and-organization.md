# REQ-002：配置 Agent 与组织关系

> **读者契约**：本需求定义“谁来做”的产品能力。它不要求第一版实现所有 Adapter 和插件。

| 字段 | 内容 |
| --- | --- |
| 状态 | 推荐纳入 V1 |
| 用户 | Board、Company 管理者 |
| 前置条件 | 已存在 Company |
| 结果 | 至少有一个可用 CEO 或 Worker Agent |
| 依赖 | REQ-001 |

## 用户结果

用户可以创建 Agent，定义其角色、汇报对象和执行方式，并判断它是否可以接收任务。

## 需求

1. Agent 必须属于一个 Company。
2. Agent 必须有可识别的名称、角色和状态。
3. Agent 可以配置 manager / reporting relationship。
4. Agent 必须声明 Adapter 或执行方式。
5. Agent 状态必须区分 active、idle、running、error、paused、terminated 等产品状态。
6. 创建或激活 Agent 时，系统必须检查配置完整性和预算边界。

## 交互

- Agents 页面显示组织树、状态、当前任务和预算摘要。
- 新建 Agent 至少包含身份、角色、负责人、Adapter 和初始预算。
- Agent 详情页提供配置、运行、任务、工具、技能和成本入口。
- 不能把 `running` 误解为“任务成功”；详情页应同时显示当前 Run。
- paused、error、terminated 必须显示原因或处理入口。

## 验收标准

- Given 有效 Adapter 配置，When 创建 Agent，Then Agent 出现在组织树并可被分配。
- Given Adapter 缺失，Then Agent 可以保存为草稿，但不能接收执行任务。
- Given Agent 属于 Company A，Then Company B 的用户不能将 Issue 分配给它。
- Given Agent paused，Then 新的执行不会开始，已有结果仍可查询。
- Given Agent manager 被修改，Then 组织树和后续上下文使用新关系，变更被审计。

## 实现接触点

- UI：Agents、New Agent、Agent Detail、Org / OrgChart。
- 服务：agents、organization、adapter registry、budget services。
- 数据：agents、organization relations、adapter config、budget policy。
- 执行：`packages/adapters/`、adapter-utils 和 heartbeat 服务。

## 事实与待决策

- **事实**：当前源码包含多个 Adapter 形态，包括本地进程、HTTP 以及 Claude/Codex 相关运行方式。
- **推断**：V1 先选一个稳定 Adapter，其他 Adapter 作为同一契约的后续实现。
- **待决策**：CEO 是否必须通过 Approval 才能激活，还是仅特定类型的 Agent 需要审批。

