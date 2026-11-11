# 应用外壳固定布局规范（sidebar / header 固定，内容区独立滚动）

适用范围：`pages/` 下所有接入应用外壳的页面（对应 AGENTS.md 硬性规则 8），以及任何对 `pages/layout/layout.js` / `pages/layout/layout.css` 的修改。生成或修改页面、调整外壳时必须遵守本规范。

## 布局不变量（用户已确认的产品行为）

1. 外壳是固定骨架：左侧菜单固定、顶部 header 固定，二者**永不随内容滚动**。
2. **唯一滚动容器是内容区 `.lx-content`**（`overflow-y: auto` + `overscroll-behavior: contain`）。页面内容超高时只在这个区域出现滚动条。
3. 页面级不允许出现滚动条：`html.lx-html`（`height: 100dvh`/`100%` + `overflow: hidden`，由 layout.js 挂载外壳时加类）与 `.lx-body`（`height: 100%` + `overflow: hidden`）已收掉文档级滚动，任何页面不得破坏。
4. 菜单点击 = 页面跳转，每页重新 `mountLayout()` 挂载外壳。不要改造成 SPA 路由。

## 实现锚点（改外壳前先读这两处）

- `pages/layout/layout.css`：文件头「固定外壳骨架」注释段 + `.lx-content` 上方注释（含 fixed 元素防护警告）。
- `pages/layout/layout.js`：`buildShell()` 中给 `<html>` 加 `lx-html` 类的逻辑（与 layout.css 规则成对出现，未挂外壳的裸页面不受影响）。

## 页面开发红线（新增/修改页面必须遵守）

- 页面内容全部包在 `<div id="pageContent">` 内，由 mountLayout 移入内容区。页面自身**禁止**用 `position: sticky` / `fixed` 模拟固定头或侧栏，**禁止**设置 body/html 的 height/overflow（外壳统一负责）。
- **禁止**在 `.lx-content` 的祖先链上加 `transform` / `filter` / `will-change` / `contain`——那会改变 `position: fixed` 后代的 containing block，导致错误条、toast 被裁剪或错位。
- 页面内弹层一律用 `<dialog>`（浏览器 top layer，不受外壳布局影响）；页面级错误提示一律用 `pages/app.js` 的 `mountErrorBar()`（fixed 定位，位于 56px header 下方）。
- 新页面在 `layout.js` 的 `MENU` 登记菜单项（含头注释 active 枚举同步）；业务页由 `zpm-new-page` 生成、数据字典页由 `zpm-db-info` 生成时会自动登记；图标不够时按现有 24x24 线条风格（`fill:none`、`stroke:currentColor`、`stroke-width:1.8`、圆角端点）在 `ICON_PATHS` 新增，不引外部图标。

## 修改外壳时的红线

- 窄屏（≤1023.98px）侧栏折叠为抽屉的机制必须保留：`.lx-sidebar` 变 `position: fixed` 全高抽屉 + `.lx-overlay` 遮罩，汉堡按钮/Esc/点遮罩关闭逻辑不动；内容区独立滚动不受断点影响。
- 样式只用 theme.css tokens（颜色一律 `var(--token)` 直接引用，token 为 oklch，`hsl()` 包装会失效；`--radius` 等）+ layout.css 自身，零外部资源（`layout.js` 中 `w3.org/2000/svg` 命名空间常量是唯一允许的 URL 字面量）。

## 改动后验证（浏览器实测口径）

1. 宽屏：`document.documentElement.scrollHeight === clientHeight`（页面级无滚动）；`.lx-content` 可滚；滚动到中/底部后 `.lx-sidebar` 与 `.lx-header` 的 `getBoundingClientRect().top` 仍为 0，`window.scrollY` 恒为 0。
2. 窄屏（<1024px）：汉堡按钮出现、抽屉可开合、抽屉开着时滚动内容区背景不动。
3. 错误条（触发一次 fetch 失败）横跨 header 下方居中、不被内容区裁剪、滚动内容时位置不变；`dialog.showModal()` 居中与背板正常。
4. 页面清单按项目实际页面逐页抽查：长表格页与图表页各至少一次（清单以 `layout.js` 的 `MENU` 登记为准）。
