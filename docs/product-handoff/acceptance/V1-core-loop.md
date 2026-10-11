# V1 核心闭环验收

## 验收目标

验证一个新用户可以从 Company 开始，完成一次有治理、有结果、可追溯的 Agent 工作。

## 主场景

1. 创建 Company 和首个 Goal。
2. 配置 CEO Agent 和一个 Worker Agent。
3. 创建 Project 和 Issue，并分配 Worker。
4. Issue 进入队列，Worker 成功 checkout。
5. Run 显示 running、日志和成本。
6. Agent 产生 Comment 或 Artifact。
7. Issue 进入 in_review 或 done。
8. Board 可以查看 Activity / Audit，并确认执行来源。

## 负向场景

- 无负责人不能进入 in_progress。
- Company A 不能访问 Company B 的 Issue、Run、Artifact 或成本。
- 同一 Issue 不能被两个 Agent 同时成功 checkout。
- paused Agent 不会产生新的有效 Run。
- hard stop 后新执行被阻止，并显示预算原因。
- pending Approval 重复提交不会产生重复副作用。
- Adapter 失败不会把 Issue 标记为 done。
- 超过重试上限后需要用户处理。

## 交付判定

只有同时满足以下条件，V1 才算完成：

- 主场景可从 UI 完成；
- 每个关键状态有用户可见反馈；
- 失败和拒绝路径不产生隐藏副作用；
- Issue、Run、Artifact、Cost、Approval 和 Audit 能互相追溯；
- 文档中的待决策项已由产品负责人确认，或明确排除在 V1 之外。

