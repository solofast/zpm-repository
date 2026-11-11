---
description: 生成 basecoat 组件试验页，浏览器预览全部变体
---
组件名（如 button / dialog / table / field / toast）：$ARGUMENTS

执行步骤：
1. 读 AGENTS.md；vendored 库已含 basecoat 全部 CSS/JS（/vendor/basecoat/）
2. 生成 pages/sandbox-<组件名>.html：按 basecoat 官方文档渲染该组件完整变体矩阵（各 data-variant × data-size 组合），每个变体上方配 <h2> 小标题说明
3. 全部用 basecoat 语义 class + data-* 属性，无 utility soup；含交互的组件在动态演示区调 afterInject()
4. 登记 MENU（名称：试验-<组件名>）；回复中注明：确认效果后可让我删除本页并把选中变体代码吸收进目标页面
