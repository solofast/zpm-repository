# toast 轻提示（basecoat toaster 三态）

操作结果的轻量反馈：成功 / 失败 / 警告三态，底部（项目默认为顶部居中）浮出、自动消失。基准实现 = `pages/workbench.html` 复制 toast；`pages/category.html` 与 `templates/tpl-form.html` 同源。**新页面一律按本文契约开发，不得另行发明。**

## 1. 容器契约（本项目踩坑点）

容器是**静态标记**，写在 `<body>` 直接子级（`#pageContent` 之外，与 `<dialog>` 平级）：

```html
<div id="toaster" class="toaster" data-align="center"></div>
```

- **JS 认 id，CSS 认 class，缺一即坏**：vendor `all.min.js` 按 `#toaster:not([data-toaster-initialized])` 找到容器并挂 `toast()` 方法；而 basecoat CSS 的样式规则全部挂在 `.toaster` class 上（`.toaster .toast .toast-content …`）。只有 id 没有 class = toast 能弹出但**完全无样式**（2026-11-08 事故：页面动态创建 `<div id="toaster">` 缺 class，文字出来了皮肤全丢）。
- **禁止 JS 动态创建容器**。`all.min.js` 是 `defer` 加载，静态标记天然保证「初始化先于任何模块脚本调用」；动态插入的容器不保证被 `initAll` 扫到。
- `data-align` 只管横向：`start` / `center` / `end`（缺省 `end`）。项目约定统一 `center`。

## 2. JS API

```js
toaster.toast({ category, title, description })
```

- `category`：`'success' | 'warning' | 'error' | 'info'`（缺省 `info`）。basecoat JS 自带分类图标（svg 注入 `.toast-content` 顶部）。
- 自动消失：error 默认 5s、其余 3s；可传 `duration`（毫秒）覆盖。hover 暂停、移出续走。
- `title` / `description` 经 basecoat JS **内部 HTML 转义**，接口数据可安全传入；**禁 `html: true`** 选项（会跳过转义）。
- **堆叠上限 3 条**：连点时先 `close()` 最旧的——容器是 `column-reverse` + 页内样式 `overflow: hidden`，纯 CSS 裁剪会裁掉最新一条，必须 JS 关旧保新。

标准封装（逐字复制即可，三个基准页面同款）：

```js
function showToast(category, title, description) {
  const toaster = document.getElementById('toaster');
  if (!toaster || typeof toaster.toast !== 'function') return;
  const live = toaster.querySelectorAll('.toast:not([aria-hidden="true"])');
  for (let i = 0; i + 3 <= live.length; i++) {
    if (typeof live[i].close === 'function') live[i].close();
  }
  toaster.toast({ category, title, description });
}
```

## 3. 三态语义色（页面必须携带的 CSS）

basecoat 只有中性皮肤，语义色由页面 CSS 提供：左色条 3px + 图标同色。canonical 块（逐字复制）：

```css
/* 第一行把容器从底部提到 header（56px）下方视口顶部居中；不要顶部定位可删掉该行（默认 bottom:0） */
.toaster[data-align="center"] { top: 8px; bottom: auto; gap: 8px; max-height: 300px; overflow: hidden; }
.toast { border-left: 3px solid var(--border); }
.toast[data-category="success"] { border-left-color: oklch(0.696 0.17 162.48); }
.toast[data-category="success"] .toast-content > svg { color: oklch(0.696 0.17 162.48); }
.toast[data-category="warning"] { border-left-color: oklch(0.795 0.184 86.047); }
.toast[data-category="warning"] .toast-content > svg { color: oklch(0.795 0.184 86.047); }
.toast[data-category="error"] { border-left-color: var(--destructive); }
.toast[data-category="error"] .toast-content > svg { color: var(--destructive); }
```

- success（翡翠）/ warning（琥珀）是**跨主题语义常量**，oklch 字面量直写——它们不随主题变化是刻意行为（与 workbench 同源）；error 走 `var(--destructive)` 随主题。
- 圆角不另设：`.toast-content` 的圆角由主题包控制（Lyra 直角主题下为 0，是正确表现，勿「修复」）。

## 4. 反馈分工（toast / 错误条 / 表单内）

| 场景 | 用法 |
|---|---|
| 操作成功（创建 / 更新 / 删除 / 复制 / 导出） | `showToast('success', 标题, 可选详情)` |
| 操作失败（删除失败 / 导出失败 / 复制失败） | `showToast('error', 动词短语, 错误详情)` |
| 可预防的用户态（空结果集导出等） | `showToast('warning', 说明)` |
| 页面级数据加载失败（列表拉取挂了、需要常驻+重试） | `pages/app.js` 的 `mountErrorBar()` 错误条 |
| 弹窗表单校验 / 保存失败 | 表单内字段级 `.field-error` 与 `formError`（错误条会被 dialog 背板遮挡；校验错误必须紧贴字段） |

## 5. 禁忌

- 禁 `alert` / `confirm`（宪法硬性规则 5）。
- 禁自绘 toast（theme-studio 的 `.ts-toast` 为历史遗留，勿模仿；vendor 白名单外 UI 库照旧禁止）。
- 禁把 toast 当常驻提示（会自动消失；需要常驻/重试的用错误条）。
- i18n：`title` / `description` 一律经 `t(key, 中文缺省)` 取值，`zh_CN.json` / `en_US.json` 对称补 key。

## 6. 验证口径

涉及 toast 的改动必须 playwright 断言 + 截图肉眼核验（本项目「DOM 对、视觉错」事故教训）：

- `.toast[data-category="…"]` 的 computed `border-left-color` 命中语义色；
- 容器 computed `position: fixed` + 顶部/居中定位生效；
- 真实操作触发对应 category（创建→success、空导出→warning、删除失败→error）；
- 截图确认左色条、图标、位置。
