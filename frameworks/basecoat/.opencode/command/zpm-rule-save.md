---
description: 把本次对话沉淀的组件级约定成文为规则（knowledge/rules/）
---
规则主题（组件名/主题）：$ARGUMENTS

分流判定（先做）：
- 约束**所有页面 / 全局机制**（样式依赖、外壳接入、安全底线）→ 这是宪法级，改用 `zpm-law-propose`
- 约束**某组件怎么用**（如 card 内距、table 滚动、badge 圆角）→ 本命令

执行步骤：
1. 读 `knowledge/rules/README.md` 索引，确认主题是否已有细则（有则更新，无则新建）
2. 写 `knowledge/rules/<主题>.md`，固定结构：`## 适用范围` / `## 约定` / `## 代码落位` / `## 验证口径`（约定为祈使句原文；代码落位指明文件与节；验证口径给可执行断言，如 playwright computed style）
3. 更新 `knowledge/rules/README.md` 索引表：追加或更新一行 `| [<主题>.md](./<主题>.md) | 组件/主题 | 一句话 |`
4. 红线：不得修改 AGENTS.md 生效规则区与修正案 changelog（组件规则不占版本号）；细则与宪法冲突时以宪法为准
