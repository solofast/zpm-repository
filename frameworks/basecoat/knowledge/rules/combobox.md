# combobox 适配细则（basecoat 1.1.0，vendor 实测反推）

参考页面：`pages/mails.html` 顶条「负责人」筛选（本细则的验证载体）。

## 官方标记结构（vendor css/js 契约，勿凭记忆假设）

```html
<div class="combobox" id="xxxCombo">
  <input type="hidden" name="xxx" value="">              <!-- value 载体：js 读 :scope > input[type=hidden] -->
  <div class="input-group">                               <!-- 边框盒 + 行容器（input 与清除按钮同排） -->
    <input type="text" role="combobox" class="input" placeholder="…" autocomplete="off">
    <button type="button" data-clear aria-label="…">图标</button>  <!-- js 自动显隐，点击清空 hidden+input -->
  </div>
  <div data-popover aria-hidden="true">                   <!-- 浮层（popover 体系） -->
    <div role="listbox" aria-label="…">
      <div role="option" data-value="" data-label="全部…">全部…</div>
      <div role="separator"></div>
      <!-- option 由业务数据动态 DOM API 创建，禁止静态写死/innerHTML 拼业务数据 -->
      <div role="option" data-value="<id>" data-label="姓名">首字圆标+姓名</div>
    </div>
  </div>
</div>
```

## 行为契约（basecoat-js 已内建，不要重造）

- option 取值 `dataset.value ?? textContent`；选中回填显示 `dataset.label || textContent`
- 输入过滤：未设 `data-filter` 时默认按输入文本过滤 options
- 键盘：上下移动 / Enter 选中 / Escape 关闭，全部内建
- `[data-clear]` 显隐全自动管理；「全部」option（value=""）与 data-clear 等效

## 值同步（关键坑）

**给 hidden input 赋值不触发任何事件**。同步到页面状态的可行做法：在 combobox 根上捕获 `click` / `keydown`，`requestAnimationFrame` 后读 hidden 值与本地 state 比对，变了才 `applyFilters()`。

**动态创建 options 后**：`combo.refresh()`（已初始化则重新收集 options），否则 `basecoat.initAll()`；动态注入场景 `afterInject()` 已覆盖初始化。

## 样式约定（PM 约定 2026-10-31）

1. **边框盒归 `.input-group`**：`border: 1px solid var(--input); border-radius: var(--radius-md)`（与 `.input` 同公式）；内部 `input[role=combobox]` **border: none**（避免双线）
2. **聚焦不变色**：`.input-group:focus-within { border-color: var(--input); --tw-ring-shadow: 0 0 #0000; --tw-ring-color: transparent; }` —— basecoat 会在聚焦时给 group 注入 3px ring 阴影，必须中和（只测 input 会漏，**父级联动要连父级一起断言**）
3. **定宽**：combobox 设固定宽度（如 178px）——清除按钮出现/消失会引起 fit-content 宽度跳变，挤压同排元素
4. 高度对齐（**lyra 整包口径修订 2026-10-31**）：basecoat-lyra 编译整包把 `.input[type=text]` 与 `.input-group` 锁 `height: calc(var(--spacing)*8)`=32px（与通用版 36px 不同源，combobox.md 初版 36px 口径出自已移除的通用版 css）。需要统一高度时（如与同排搜索框对齐 36px）：页面样式显式锁 group 总高 36px、内部 input 34px 补差、清除按钮不撑高；改动后对同排**每个控件逐一读 computed 高度**核对，不能只测一个

## Dialog 内使用（编辑弹窗回填，2026-10-31 沉淀）

- 编辑场景回填已有值：options 动态创建后先 `combo.refresh()`，再 `combo.setValue(<id>)`（vendor 内建 API，同时回填 hidden 与显示文本）；选填语义用空值 option（data-value=""，如「不指定」）表达
- 弹窗 markup 常驻文档（`<dialog>` 不销毁），初始化一次即可；重复打开不重复 initAll
- 浮层定位在 dialog（top layer）内正常工作；若 dialog 有缩放/变换祖先链需复测浮层对齐

## 已验证边界

- option 键序/多余 data 属性不影响行为；`data-empty` 可配无结果文案（默认 "No results found"，中文页面应设中文）
- 浮层与输入框左对齐由 basecoat 维护；改动 group 尺寸后须复测浮层对齐
