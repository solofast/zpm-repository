---
description: 按宪法规则走查页面，输出问题清单（只查不改）
---
目标页面（空 = 近期改动页面）：$ARGUMENTS

执行步骤：
1. 读 AGENTS.md（唯一评审基线）与 /layout/layout.js（外壳契约参照）
2. 对每个页面逐项检查：
   - 外壳接入：#pageContent 存在、mountLayout 调用、MENU 已登记
   - 数据：/api 取数、textContent 或 mustache {{}} 转义、无 {{{ }}} 滥用、加载/空/失败三态齐全
   - 交互：无 alert/confirm、弹窗用原生 dialog.showModal、动态注入后 afterInject/initAll
   - 样式：无 hsl(var( 包装、颜色全走 var(--token)、basecoat 语义 class、无 utility class soup
   - 滚动架构不变量：参照 .opencode/instructions/layout-shell.md
3. 输出问题清单（阻塞 / 建议 两级），每条附 文件:行号 与修复建议
4. 未经用户确认不修改任何文件
