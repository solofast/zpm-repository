---
description: 从指定模板创建页面（tpl-list|tpl-form|tpl-detail|tpl-dashboard|tpl-board）
---
用法：zpm-new-page-tpl <模板名> <需求描述>

参数：$ARGUMENTS

执行步骤：
1. 从 $ARGUMENTS 解析模板名与需求；模板名无效时列出五个合法模板并停止
2. 读 AGENTS.md、templates/<模板名>.html、/layout/layout.js
3. 复制模板为 pages/<页面名>.html，按「<!-- 适配：… -->」注释适配（字段以 /api/_meta 真实表为准）；USE_DEMO 开关保留

4. **i18n 接入（必做）**：模板已内置 i18n 骨架（ensureI18n / applyStaticI18n / data-i18n / t()），适配时原样保留该结构；本页新增的 UI 文案照用 `t(key, 中文缺省)`，新 key 同步补进 `pages/locales/zh_CN.json` 与 `en_US.json`；数据库翻译列经 `/app.js` 的 `i18nText`；细则必读 `knowledge/rules/i18n.md`
5. 登记 MENU；逐条自查 AGENTS.md
6. 输出：改动文件清单 + 验证方式
