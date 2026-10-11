# REQ-010：插件、Skills 与外部连接扩展

> **读者契约**：本需求定义平台如何扩展，不把每个连接器都列入核心产品承诺。

| 字段 | 内容 |
| --- | --- |
| 状态 | V2 |
| 用户 | Company 管理者、插件作者、Board |
| 前置条件 | Company 隔离、Adapter、Tool、Secret、Audit 契约已稳定 |
| 结果 | 第三方能力可以接入，同时不绕过治理边界 |
| 依赖 | REQ-005、REQ-007、REQ-009 |

## 需求

1. Plugin、Adapter、Skill 和 Connection 必须声明能力、版本和所需权限。
2. 安装或启用前必须显示来源、版本、风险和授权范围。
3. 插件产生的调用和副作用必须进入统一 Activity / Audit。
4. 卸载、禁用、升级或撤销授权后，后续执行不能继续使用旧能力。
5. 外部渠道产生的任务、消息和结果必须映射回 Company、Issue、Run 或 Approval。

## 验收标准

- Given 插件声明了 Secret 权限，Then 安装或启用时用户能看到并确认该权限。
- Given 插件版本升级，Then 系统保留版本来源和变更记录。
- Given 连接授权被撤销，Then 后续调用失败并给出可处理原因。
- Given 外部消息创建任务，Then 任务具备 Company、来源和审计信息。
- Given 插件被禁用，Then 现有历史产物可读，新的调用被阻止。

## 实现接触点

- UI：Plugin Manager、Skill Studio、Apps、Connections、MCP Gateways。
- API / 服务：plugin、adapter registry、skills、tool gateway、connections、audit。
- 数据：plugin / skill versions、capability declarations、connection intents、secret bindings。

## 事实与待决策

- **事实**：源码包含插件、Skills、MCP、Apps、Connections 和外部渠道入口。
- **推断**：扩展能力必须依赖稳定的权限、审计和产物合同。
- **待决策**：哪些连接器在最终产品中保证可用，哪些仅作为插件示例。

