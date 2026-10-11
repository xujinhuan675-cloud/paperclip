# 05 核心流程

## 流程一：首次建立可运行的 AI 公司

### 用户目标

Board 在较短时间内创建 Company、配置 CEO Agent，并看到第一个可审查的执行结果。

### 主路径

1. 用户启动产品并选择登录模式。
2. 创建 Company，填写公司名称和目标。
3. 创建 CEO Agent，选择 Adapter，填写角色和执行配置。
4. 系统检查 Agent 配置、预算和可用运行环境。
5. Board 批准初始计划或允许 CEO 生成第一批 Issue。
6. CEO Heartbeat 读取 Company、Goal 和组织上下文。
7. CEO 创建 Project、Issue 或子任务，并分派给可用 Agent。
8. Worker Agent 领取 Issue，执行并回写进度。
9. 系统记录 Run、日志、成本和结果 Artifact。
10. Board 在 Dashboard 或 Issue 详情中查看并确认结果。

### 完成标准

- Company、Goal、CEO、Issue、Run 和 Artifact 均可追溯。
- 用户能够看到执行中、成功、失败或等待审批，而不是只看到静态的 done。
- 首次失败时，用户知道失败原因和下一步操作。

## 流程二：创建、分配和执行 Issue

### 触发

- 用户创建或更新 Issue；
- 用户指定 Agent；
- 用户发表评论或 mention Agent；
- 定时 Routine 到期；
- Approval 通过后释放下一步工作；
- 用户手动唤醒 Agent。

### 主路径

1. UI 提交 Issue 或 assignment 请求。
2. 服务检查 Company 隔离、负责人类型、Issue 状态和权限。
3. 系统保存 Issue 及变更审计。
4. assignment 事件进入 durable wakeup queue。
5. Heartbeat 合并重复唤醒并创建 Run。
6. Run 检查预算、Agent 状态、Workspace 和工具授权。
7. Agent 原子 checkout Issue，避免多个 Agent 重复执行。
8. Adapter 执行任务并持续发送状态、日志和成本事件。
9. Agent 写入评论、文档、Artifact 或请求审批。
10. 系统根据结果更新 Run 和 Issue 状态。

### 必须处理的旁路

| 情况 | 用户可见结果 | 系统动作 |
| --- | --- | --- |
| Agent 不可用 | 显示未执行及原因 | 不创建不可运行的 Run |
| Issue 无负责人 | 保持待分配 | 不进入 in_progress |
| 重复分配 | 只保留一个有效执行 | 合并或拒绝重复 wakeup |
| 预算不足 | 显示预算暂停 | 拒绝新的受限执行并记录事件 |
| 运行超时 | 显示超时和恢复选项 | 结束或回收租约，允许重试 |
| Agent 被暂停 | 显示暂停状态 | 保留 Issue，等待恢复或改派 |
| 执行产生需批准动作 | 显示等待审批 | 暂停危险副作用，创建 Approval |

## 流程三：审批与人类干预

1. Agent 或系统创建 Approval，写明动作、对象、风险和所需权限。
2. Approval 出现在 Board 的 Inbox、Decision Queue 或 Issue 详情。
3. 用户查看上下文、预期影响、预算和相关 Artifact。
4. 用户选择 approve、reject 或 request revision。
5. 系统记录决策人、时间、理由和来源。
6. 通过后释放后续 Run 或改变 Agent / Budget 状态。
7. 拒绝或要求修改时，Agent 收到可解释的反馈。

## 流程四：预算与成本控制

1. 执行前读取 Company、Agent、Project 和时间窗预算。
2. 执行过程中接收 provider、model、run、issue 关联的 cost event。
3. UI 显示当前消费、预计消费、阈值和剩余额度。
4. 达到告警阈值时通知 Board。
5. 达到 hard stop 时暂停对应范围的新执行。
6. 用户解决预算问题后，系统只恢复由预算原因暂停的对象。
7. 所有暂停、恢复和覆盖操作写入 Audit。

## 流程五：失败、重试与恢复

1. Run 进入失败、超时、中断或孤儿状态。
2. 系统保留最后状态、错误摘要、日志位置、成本和 Workspace 信息。
3. Watchdog 或恢复机制识别可恢复与不可恢复失败。
4. 可恢复失败进入有界重试，避免无限循环。
5. 需要用户处理的失败显示原因、影响和操作按钮。
6. 重试时明确是继续原 Session、重新执行还是重新领取 Issue。
7. 恢复完成后更新 Run、Issue、Artifact 和 Audit。

## 流程六：工具、Secret 和连接

1. Agent 请求使用 Tool、App、MCP 或 Secret。
2. 系统判断 Agent、Company、Issue、Run 是否拥有对应授权。
3. 需要人工确认时创建 connection intent 或 Approval。
4. 通过后以最小范围注入执行上下文。
5. 调用结果和副作用写入 Activity / Audit。
6. 失败、撤销、过期或权限不足时，用户能看到下一步处理方式。

