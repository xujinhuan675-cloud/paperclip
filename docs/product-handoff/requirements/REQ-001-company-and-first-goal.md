# REQ-001：创建 Company 与首个目标

> **读者契约**：本需求定义第一步用户结果。它不包含复杂成员管理和云租户。

| 字段 | 内容 |
| --- | --- |
| 状态 | 推荐纳入 V1 |
| 用户 | Board / 人类监督者 |
| 前置条件 | 产品已启动，用户拥有创建 Company 的权限 |
| 结果 | Company 和首个目标可被后续 Agent、Project、Issue 使用 |
| 依赖 | 基础身份与 Company 隔离 |

## 用户结果

用户可以创建一个 Company，填写它要完成的目标，并进入一个能继续配置 Agent 的工作空间。

## 需求

1. 系统必须要求 Company 名称。
2. 系统必须支持填写一个可读的初始目标。
3. Company 创建后必须建立独立的数据范围。
4. 用户必须能回看 Company 名称、目标、创建人和创建时间。
5. 创建失败时不能产生半成品 Company，或必须明确显示可恢复状态。

## 交互

1. 入口：首次启动向导或 Companies 页面。
2. 表单：Company 名称、目标描述、可选预算和工作偏好。
3. 提交后显示创建中状态，禁止重复提交。
4. 成功后进入 Company Dashboard，并提供“配置 CEO Agent”下一步。
5. 失败后显示原因和重试方式，不清空用户已填写内容。

## 验收标准

- Given 用户有创建权限，When 填写有效名称和目标并提交，Then Company 和目标可查询。
- Given 用户连续点击提交，Then 只创建一个 Company。
- Given 名称为空或超出规则，Then 阻止提交并给出字段级提示。
- Given 数据持久化失败，Then 用户看到失败原因，不进入虚假的成功页面。
- Given Company A 的用户访问 Company B 的资源，Then 请求被拒绝且产生安全日志。

## 实现接触点

- UI：Companies、Company settings、onboarding。
- 服务：Company、auth、access、goal services。
- 数据：Company、membership、goal / initiative schema。
- 相关文档：`doc/PRODUCT.md`、`docs/start/core-concepts.md`、`docs/start/quickstart.md`。

## 事实与待决策

- **事实**：Company 是 Paperclip 的一等对象和主要隔离边界。
- **推断**：V1 采用单一 Board 主路径，后续再扩展复杂成员角色。
- **待决策**：Goal 与 Initiative 是否在用户界面中显示为两个概念。

