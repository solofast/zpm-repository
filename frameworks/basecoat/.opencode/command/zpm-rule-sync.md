---
description: 把项目规则/经验推回框架基线（冲突对话编排，选择性合并）
---
基线目录（可选，默认全局 assets_dir）：$ARGUMENTS

执行步骤：
1. 运行 `zpm knowledge rule push --dry-run [--from <基线>]`，读输出：新增 / 更新 / 冲突 / 跳过
2. 无冲突：去掉 `--dry-run` 重跑正式推送，报告结果，结束
3. 逐个冲突文件：读项目版与基线版（基线路径 `<基线>/knowledge/rules/<文件>`），向用户展示差异摘要，三选一：
   - **用我的**：单独推送该文件 `zpm knowledge rule push knowledge/rules/<文件> [--from <基线>]`
   - **用基线的**：项目文件不动（下次 pull 自然更新）；用户要立即对齐时，用基线内容覆盖项目文件
   - **手工合并**：生成合并稿 → 用户确认 → 写回项目文件 → 单独推送
4. 全部解决后重跑 `zpm knowledge rule push --dry-run` 确认无冲突，再正式推送
5. 输出最终报告：新增 / 更新 / 已解决冲突 / 跳过 清单；教训同理用 `zpm knowledge lesson push`
