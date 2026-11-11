---
description: 新建原型页面（描述想要的效果即可，自动选模板并登记菜单）
---
为本项目新建原型页面。

需求描述：$ARGUMENTS

执行步骤：
1. 读 AGENTS.md（全部硬性规则）、/layout/layout.js（外壳契约与 MENU）、/app.js
2. 按需求判断页面类型并选模板：CRUD 列表→templates/tpl-list.html；新建/编辑表单→tpl-form.html；单记录详情→tpl-detail.html；KPI+图表→tpl-dashboard.html；看板拖拽→tpl-board.html；都不合适→空白外壳页起步
3. **组件细则闸门（必做，复制模板也要过）**：列出本页会用到的 basecoat 组件（card / table / badge / btn / input / dialog / combobox…，模板自带的同样计入），逐个查 knowledge/rules/README.md 索引；索引列出的组件必须先读对应细则并在改造时遵守，不得因「来自官方模板」而跳过；无细则的按官方文档 + token 纪律
4. 复制模板为 pages/<页面名>.html（kebab-case 英文名），按模板内「<!-- 适配：… -->」注释替换 TABLE/FIELDS/USE_DEMO；字段与枚举值以 /api/_meta 真实表为准；需展示的表不在 sync.tables 时提示先加配置并 zpm sync

5. **i18n 接入（必做）**：UI 文案接入多语言——module 脚本 `import { ensureI18n, t } from '/i18n.js'`，渲染 UI 文案前 `await ensureI18n()`；静态节点加 `data-i18n="<key>"` 并加填充循环；JS 动态文案用 `t(key, 中文缺省)`；新 key 同步补进 `pages/locales/zh_CN.json` 与 `en_US.json`；数据库翻译列（JSON 多语言字段）一律经 `/app.js` 的 `i18nText` 渲染；细则必读 `knowledge/rules/i18n.md`
6. 把页面登记进 /layout/layout.js 的 MENU（中文标题，内联 SVG 或 remixicon 图标）
7. 逐条自查 AGENTS.md 硬性规则与已读组件细则（转义、三态、演示角标、无 hsl( 包装、afterInject、卡片内距等）
8. 输出：改动文件清单 + 验证方式（刷新 http://localhost:<端口>/<页面名>.html）
