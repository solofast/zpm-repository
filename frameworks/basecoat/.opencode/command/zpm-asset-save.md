---
description: 把页面/组件/交互模式沉淀到全局资产库（knowledge/assets）
---
要沉淀的内容：$ARGUMENTS

执行步骤：
1. 确认沉淀源（pages/ 下的页面或某段组件代码），读取完整代码
2. 创建 knowledge/assets/<YYYY-MM-DD>-<名称>/：写 asset.md（frontmatter：type: page|component|pattern、source、tags、依赖的表与 basecoat 组件、适配要点）+ files/ 放代码原件
3. 目录创建失败时输出手动 mkdir 命令并停止
4. 输出：资产 id 与日后复用方式（zpm-asset-use）
