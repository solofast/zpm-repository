# basecoat — zpm 原型工程

基于 zpm 工具链的原型项目：`pages/` 下的纯静态页面由 zpm 常驻服务托管，业务数据全部通过 `/api` 实时获取，页面中禁止内嵌任何业务数据。

- 数据源：zpm.config.yaml 配置的真实库（PostgreSQL 源库 → 部署库 `data/app.db`，SQLite，由 `zpm sync` 全量同步生成）
- 视觉系统：basecoat-css 语义组件类 + shadcn 风格 oklch tokens（`server.theme` 指向 themes/ 四选一，或任意 shadcn/TweakCN 导出文件）
- 预览地址：`http://localhost:<port>`（zpm.config.yaml 的 `server.port`）
- 数据变化后执行 `zpm sync`；页面文件保存后刷新浏览器即生效

## 页面硬性规则（每次生成/修改页面都必须遵守）

1. 纯静态 HTML + 原生 JS（`<script type="module">`），零框架、零 CDN、零构建步骤
2. 数据一律走 zpm 接口，严禁写死在页面里：
   - 列表：`GET /api/<表名>?where=字段:eq:值&sort=-字段&page=1&pageSize=20` → `{ data, total }`
   - 详情：`GET /api/<表名>/<id>`
   - 写入：`POST /api/<表名>`、`PATCH /api/<表名>/<id>`（仅 zpm.config.yaml `write.tables` 白名单内的表）
   - 筛选操作符：`eq / ne / gt / lt / like / in`（in 的值用英文逗号分隔）
   - 数据字典页（db-info.html）的表作用/字段含义/表关系说明属文档性配置，允许静态写；表与字段清单仍须运行时来自 `/api/_meta`
3. 字段名、枚举值必须先用 dbx mcp 查询 zpm.config.yaml 配置的真实库确认，不得虚构
4. 样式只依赖 `<link rel="stylesheet" href="/vendor/basecoat/basecoat-lyra.cdn.min.css">`（官方编译整包，Lyra 风格内置；**禁止换用 basecoat-base 等无风格包变体——组件皮肤规则在风格包内，缺包即全站裸奔**）+ `/theme.css`（shadcn 风格 oklch tokens：颜色/圆角变量，token 覆盖优先级高于包内置风格；**颜色一律 `var(--token)` 直接引用，token 为 oklch，`hsl()` 包装会失效**）；组件只用 basecoat 语义 class（`btn` / `card` / `field` / `table` / `badge` 等）+ `data-variant` / `data-size` 变体，禁 Tailwind utility class soup（basecoat CSS 内置的 `hidden dark:block` 等除外，详见「basecoat 写法规约」）；布局微调用少量内联 style；接入应用外壳的页面可额外引用 `/layout/layout.css`（这是本规则唯一例外）；remixicon 样式（`/vendor/remixicon/remixicon.css`）按「黑名单与图标」章节方式引用，同样不受此限
5. 数据渲染用 `textContent` 或先 HTML 转义再插入（禁止 innerHTML 直接拼数据值）；升级约定：动态列表/卡片默认用 mustache 模板渲染（`{{var}}` 内置 HTML 转义，正好满足本条），见下方「可用库」章节；列表页须提供加载 / 空 / 失败三态；每个 `fetch` 必须有失败提示（`pages/app.js` 的 `mountErrorBar()` 错误条）；禁 `alert` / `confirm`
6. 演示模式角标由应用外壳统一负责（layout.js 读 `/api/_meta`，`writeMode` 为 `simulated` 时显示「演示模式：数据不会保存」）；接入外壳的页面不得重复实现
7. 界面默认中文，支持经外壳语言切换切换界面语言（见「主题、暗色与语言」节）；`type="module"` 脚本；页面间用站内链接（如 `detail.html?id=xxx`），保证 `/xxx.html` 与 `/pages/xxx.html` 两种路径都可用
8. 页面统一接入应用外壳 `pages/layout/`（左侧 LOGO+菜单、顶栏快捷搜索/语言切换/主题切换/通知/帮助/用户下拉、右侧内容区）：`head` 引入 basecoat css、`/theme.css`、`/layout/layout.css` 与 `defer` 的 `/vendor/basecoat/all.min.js`，页面内容包在 `<div id="pageContent">`，脚本调用 `mountLayout({ active: '<菜单key>' })`；接入契约的唯一事实源是 `pages/layout/layout.js` 头注释，新页面用 `zpm-new-page` 生成会自动登记菜单，手动新增则必须在 `layout.js` 的 `MENU` 登记菜单项。layout 代码中 `w3.org/2000/svg` 是 XML 命名空间常量（非网络请求），为唯一允许的 URL 字面量

## 可用库（vendor/，UMD 全局构建，`<script src="/vendor/...">` 直接引）

vendor/ 已就位 7 个可用库（完整清单以 `vendor/manifest.json` 为准）：basecoat-css（含 basecoat-js 行为脚本）、mustache、echarts、dayjs、xlsx、sortablejs、remixicon。引用方式原文（按需取用，不要全引）：

```html
<!-- basecoat 1.1 语义组件样式 + 行为脚本（下拉/主题切换等；行为脚本必须 defer） -->
<link rel="stylesheet" href="/vendor/basecoat/basecoat.cdn.min.css">
<script src="/vendor/basecoat/all.min.js" defer></script>
<!-- mustache 4.2 模板渲染：全局 Mustache，{{var}} 默认 HTML 转义 -->
<script src="/vendor/mustache/mustache.min.js"></script>
<!-- echarts 5.5 图表：全局 echarts -->
<script src="/vendor/echarts/echarts.min.js"></script>
<!-- dayjs 1.11 日期：全局 dayjs -->
<script src="/vendor/dayjs/dayjs.min.js"></script>
<!-- xlsx 0.18 Excel 导出：全局 XLSX -->
<script src="/vendor/xlsx/xlsx.full.min.js"></script>
<!-- sortable 1.15 拖拽排序：全局 Sortable -->
<script src="/vendor/sortable/Sortable.min.js"></script>
<!-- remixicon 4.5 图标：<i class="ri-xxx-line"></i>；css 已内含 woff2 字体引用（同目录），无网络请求 -->
<link rel="stylesheet" href="/vendor/remixicon/remixicon.css">
```

渲染规则（升级）：

- 动态列表 / 卡片默认用 mustache 渲染：页面放 `<script type="text/template">` 模板块，`Mustache.render(tplEl.textContent, data)` 后一次性注入容器；`{{var}}` 内置 HTML 转义，满足硬性规则 5；确需不转义用 `{{{var}}}`，**仅限可信静态内容**（如自建图标 markup），严禁把接口数据塞进三括号
- 纯文本单值（KPI 数字、状态文案等）仍可 `textContent`
- 日期展示用 dayjs 格式化（如 `dayjs(v).format('YYYY-MM-DD HH:mm')`），空值统一显示「—」
- **动态注入 DOM（innerHTML 插入片段）后必须调 `pages/app.js` 的 `afterInject(container)`**，重建 basecoat 交互组件（下拉/弹窗等），否则组件不响应该批新节点
- 翻译列渲染：同步库的多语言字段以 JSON 串形态存储（如 `{"en_US":"Large Cabinet","zh_CN":"大型橱柜"}`），**严禁原样渲染整串 JSON**；一律用 `pages/app.js` 的 `i18nText(value)` 按当前界面语言取值（优先当前语言，缺该语言回退另一语言），页面不得各自实现解析；接口返回的字符串字段在渲染前默认过一遍 `i18nText`（非 JSON 串原样返回，无损）（PROP-20261108-01）
- UI 文案多语言：外壳与页面自有文字（菜单/标签/空态提示/图表图例等）一律走 `locales/<locale>.json`（`pages/locales/` 目录，`zh_CN.json` / `en_US.json`，扁平 key，可扩展；经 zpm serve 映射为 `/locales/<locale>.json`），经 `pages/i18n.js` 的 `t(key, 中文缺省)` 取值，静态标记用 `data-i18n="<key>"`；`zh_CN.json` 恒为基础表，当前语言缺 key 自动回退中文；细则见 `knowledge/rules/i18n.md`（PROP-20261108-01 / v1.5.0）
- 库渲染不豁免硬性规则：每个 `fetch` 仍必须有失败提示（错误条）

echarts 用法约定：

- `const chart = echarts.init(el)`；数据经 /api 拉取、客户端聚合后 `chart.setOption(option)`
- 必须挂 `window.addEventListener('resize', () => chart.resize())`（多图合并成一个监听即可）
- 图表配色读 theme tokens（`--primary` / `--border` / `--muted-foreground` / `--destructive`），不要硬编码与主题无关的颜色；注意 token 值是 oklch，zrender 无法解析 `var(--x)` 字符串——用 `pages/app.js` 的 `cssColor('--primary')` 取值（返回 echarts 可用的颜色串，第二参数为 alpha 透明度）

xlsx 导出约定：

- `const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 表名); XLSX.writeFile(wb, 文件名)`
- 导出文件名含表名与日期，日期用 dayjs：如 `商机列表_2026-10-28.xlsx`
- 导出「当前结果集」（与页面当前筛选/分页一致）；失败走错误条提示，不用 alert

## basecoat 写法规约

- 只用语义 class + 变体：`btn` / `card` / `field` / `table` / `badge` / `input` 等语义 class，配 `data-variant`（如 `data-variant="outline"`）、`data-size` 切换外观；**禁 Tailwind utility class soup**（basecoat CSS 内置的 `hidden dark:block` / `dark:hidden` 等主题互斥类除外）
- 动态注入 DOM 后必须调 `afterInject()`（见「可用库」渲染规则）
- 组件优先级：任何 UI 组件一律优先使用 basecoat 官方组件（https://basecoatui.com/components/）：交互组件用 basecoat 标记（`select` / `dropdown-menu` 等），弹层用原生 `<dialog>.showModal()`（浏览器 top layer，不受外壳布局影响），按钮/徽章/表格/输入等用对应语义 class + `data-variant`/`data-size`；确无对应官方组件才允许自建，自建部分仍须遵守 token 纪律（颜色一律 `var(--token)`）；不用自绘浮层，vendor 白名单之外的第三方 UI 库照旧禁止（PROP-20261030-01）
- 徽章/标签圆角：`.badge` 圆角由 `--tag-radius` token 控制（消费规则在 `pages/layout/layout.css`「组件 token 对齐」节：`border-radius: var(--tag-radius, var(--radius-4xl))`）；主题文件必须显式声明该 token（圆角主题 `2rem`、直角主题 `0`），主题文件新增 token 时同步更新 `theme-studio` 内置预设并保持逐键断言（PROP-20261030-01）
- 组件适配细则：使用 basecoat 组件前，先查阅 `knowledge/rules/` 目录下对应组件的适配细则（README 为索引，随会话上下文自动注入；现有 combobox / 表单 focus 约定 / badge 圆角等，以索引为准）；无细则的组件按 basecoat 官方文档 + token 纪律开发适配。开发中产出台账外的新组件约定时，用 `zpm-rule-save` 沉淀为该目录下 `<组件名>.md` 并更新 README 索引（页面代码注释同步 `knowledge/rules/<组件名>.md` 指引）；细则与宪法冲突时以宪法为准，目录内规则的修改不占用宪法 changelog 版本号（PROP-20261031-01）

## 黑名单与图标

- **禁 `jquery`、禁 `tailwindcss-browser`**：任何页面不得引用；vendor 白名单之外的前端库同样不得自行往页面里加
- 图标：remixicon（vendored，`<link rel="stylesheet" href="/vendor/remixicon/remixicon.css">` + `<i class="ri-xxx-line"></i>`）或外壳同款内联 SVG（24x24 线条风格：`fill:none`、`stroke:currentColor`、`stroke-width:1.8`、圆角端点），**禁外链图标**

## 主题、暗色与语言

- 换肤只改 zpm.config.yaml 的 `server.theme`（themes/ 四选一：default / emerald / violet / orange，或任意 shadcn/TweakCN 导出的 token 文件），不改页面代码；页面不得自带配色覆盖 tokens
- 暗色切换走外壳按钮（header 右侧，`window.basecoat.theme.toggle()` 切换 `<html>` 的 `.dark` 类）；页面不得自实现主题开关
- 语言切换走外壳下拉（header 右侧、主题切换左侧，globe 图标，**basecoat dropdown-menu 选项式**，当前语言带 ✓ 标记）：选项写入 localStorage `langMode`（`zh-CN` 缺省 / `en-US`，可扩展）并整页刷新生效，`<html>` 的 `lang` 属性由外壳同步；UI 文案经 `pages/i18n.js` 的 `t()` 取 `locales/`，翻译列按当前语言渲染（见「渲染规则」的翻译列条目）；页面不得自实现语言切换入口、另存语言状态或自写 locale 解析；新增语言三步：`locales/` 加文件 + `i18n.js` 的 `LOCALE_FILES` 登记 + 外壳下拉加选项（PROP-20261108-01 / v1.5.0）

## 经验库（软规则）

开发新页面前先浏览 `knowledge/lessons/` 是否有相关经验（opencode 里说 `zpm-lesson-list`）。

## 规则库（knowledge/rules/，组件级硬规则）

使用任何组件前，先查 `knowledge/rules/`（索引已注入会话上下文）：索引列出的组件必须按对应细则开发；细则与宪法冲突时以宪法为准。开发中沉淀新组件约定时，用 `zpm-rule-save` 成文（不占宪法 changelog 版本号）；与框架基线同步用 `zpm-rule-sync`。

## 模板库（templates/，复制到 pages/ 改表名字段即成页）

templates/ 下 5 个骨架，每个都是完整可运行的 HTML：引用 basecoat css + `/theme.css` + `/layout/layout.css` + `/app.js`（错误条 / cssColor / afterInject 复用），接入应用外壳；业务数据用 `demo_rows` 假表占位（`USE_DEMO` 开关），按文件内显眼的 `<!-- 适配：... -->` 注释替换表名/字段后接入真实 /api。

| 文件 | 用途 | 用到的库 |
|------|------|----------|
| `tpl-list.html` | 列表页：筛选标签组 + 关键字搜索 + 分页 + mustache 渲染表格 + 「导出 Excel」 | mustache / dayjs / xlsx |
| `tpl-form.html` | 新建/编辑表单：字段配置驱动渲染 + 必填校验 + 提交反馈 toast | basecoat field/btn |
| `tpl-detail.html` | 详情页：信息卡 + 关联明细表 + 状态操作 | mustache / dayjs |
| `tpl-dashboard.html` | 仪表盘：KPI 卡 + echarts 图表，数据客户端聚合 | echarts / dayjs |
| `tpl-board.html` | 看板：sortable 拖拽，拖拽落组后更新状态字段 | mustache / sortable / dayjs |
| `templates/crud.html` | 实体增删改查：主页表格 + 弹窗写操作（USE_DEMO 演示闭环） | 双表表格 / combobox / dialog / toast / xlsx |

用法：用 `zpm-new-page-tpl` 从指定模板创建（或手动复制到 `pages/` 并改文件名）→ 替换 `TABLE` / 字段 / 列配置（跟着注释走）→ `USE_DEMO` 改为 `false`（或删除 `demo_rows`）。注意两点：① 接入外壳的正式页面沿用模板的外壳接入（硬性规则 8），新菜单项在 `layout.js` 的 `MENU` 登记（`zpm-new-page` / `zpm-new-page-tpl` 自动登记）；② 模板内置假数据仅作占位示范，正式页面严禁保留（硬性规则 2）。

## zpm-* 命令速查

| 命令 | 用途 |
|------|------|
| `zpm-brainstorming` | 头脑风暴：逐项确认页面效果后进入实现 |
| `zpm-new-page` | 新建页面（描述你想要的效果即可） |
| `zpm-new-page-tpl` | 从指定模板创建页面（list/form/detail/dashboard/board） |
| `zpm-page-review` | 按宪法规则走查页面 |
| `zpm-try-component` | 试验 basecoat 组件效果 |
| `zpm-asset-save` / `zpm-asset-list` / `zpm-asset-use` | 资产库：沉淀 / 浏览 / 复用（项目 knowledge/assets） |
| `zpm-lesson-save` / `zpm-lesson-list` | 经验库：沉淀 / 浏览踩坑教训（项目 knowledge/lessons） |
| `zpm-law-propose` / `zpm-law-adopt` | 宪法修正提案 / 采纳 |
| `zpm-rule-save` / `zpm-rule-list` / `zpm-rule-sync` | 规则库：沉淀 / 浏览 / 回推基线（项目 knowledge/rules） |
| `zpm-db-info` | 生成数据字典页 |

## 日常工作流

```bash
zpm sync     # 源库数据变化后执行，页面刷新即见
zpm serve    # 本地起服务（端口见 zpm.config.yaml 的 server.port）
zpm pack     # 打包自包含 zip 发给用户部门
```

coding agent 开发循环：改 `pages/*.html` → 保存 → 浏览器刷新。无需重启服务。

## 修正案 changelog

<!-- 版本 | 日期 | 提案 ID | 一行摘要。由 zpm-law-adopt 追加；禁止改生效规则区而不留记录。组件级规则禁入生效规则区与本表：走 zpm-rule-save 成文于 knowledge/rules/ -->

v1.0.0 | 初始化 | basecoat 随框架分发
v1.1.0 | 2026-10-30 | PROP-20261030-01 | 组件优先用 basecoat 官方组件成文；新增 --tag-radius 徽章/标签圆角 token（Lyra 直角主题下徽章随主题方角）
v1.2.0 | 2026-10-31 | PROP-20261031-01 | 组件适配细则目录 docs/basecoat-rules/ 成文并在写法规约中引用（combobox/表单 focus/badge 三篇首发）
v1.3.0 | 2026-10-31 | PROP-20261031-02 | 样式依赖切至官方 basecoat-lyra 编译整包（Lyra 风格内置）+ /theme.css；禁止无风格包变体（组件皮肤在风格包内，缺包即裸奔）
v1.4.0 | 2026-11-08 | PROP-20261108-01 | 国际化成文：翻译列（JSON 多语言字段）严禁原样渲染，必须经 app.js `i18nText` 按当前语言取值；外壳 header 新增语言切换（主题切换左侧，localStorage `langMode`，切换整页刷新生效，`<html lang>` 由外壳同步）；硬性规则 7 调整为「默认中文，可经外壳切换」
v1.5.0 | 2026-11-08 | PROP-20261108-02 | 语言切换改为 dropdown-menu 选项式（当前语言 ✓ 标记，可扩展多语言）；框架级 UI 文案多语言机制成文（`locales/<locale>.json` + `pages/i18n.js` `t()`，zh_CN 基础表自动回退，locale 加载失败 fail-open）；细则成文 knowledge/rules/i18n.md
