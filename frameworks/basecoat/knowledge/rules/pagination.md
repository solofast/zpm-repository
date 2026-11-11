# pagination 分页（basecoat 无独立分页组件 CSS）

适用：列表页分页。参考实现：`pages/companies.html`（2026-10-31 沉淀）。

## 官方形态

basecoat **没有**独立 pagination 组件 CSS——官方做法是用 `btn` 类拼装：

```html
<nav class="pg-pager" role="navigation" aria-label="表格分页">
  <ul class="pg-pager-list">
    <li><button class="btn" data-variant="ghost" data-size="sm">‹ 上一页</button></li>
    <li><button class="btn" data-size="icon-sm" data-variant="ghost" aria-label="第 1 页">1</button></li>
    <li><button class="btn" data-size="icon-sm" data-variant="outline" aria-current="page" disabled>2</button></li>
    <li><button class="btn" data-variant="ghost" data-size="sm">下一页 ›</button></li>
  </ul>
</nav>
```

## 项目约定

1. **用 `<button>` 不用 `<a href="#">`**：分页是页内状态切换非导航，按钮语义正确且避免 hash 跳动
2. **当前页**：`aria-current="page"` + `data-variant="outline"` 且 `disabled`（不可点、视觉突出）；其余页 `ghost` 可点；上一页/下一页在边界 `disabled`
3. **页码省略算法**：≤5 页全显；>5 页恒含 1/末页 + 当前 ±1 窗口，断档处插 `…`（纯文本 li，不是按钮）——实现见 companies.html `pagerPages()`
4. **动态重建**：页码是分页 UI 状态（非业务数据），由渲染函数用 **DOM API** 重建（createElement，非 innerHTML 拼字符串也可，但值全为程序生成非接口数据）；重建后走 `afterInject()` 约定
5. **版式**：信息文案（共 N 家 · 第 x/y 页，11px muted）与页码列表分居两端，随 12px 字阶
6. **箭头图标**：外壳同款 24x24 线条内联 SVG（`fill:none`、`stroke:currentColor`、`stroke-width:1.8`、圆角端点），禁外链图标库
7. 官方示例中的 Tailwind utility（`mx-auto flex w-full justify-center` 等）一律翻译成页面级 CSS，禁 utility class soup
