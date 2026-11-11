# table-scroll 表格滚动模式（表头钉死 + 内容区独立滚）

适用：数据表格需要「表头稳定固定、滚动条只在表头下方内容区域」的场景。
参考实现：`pages/companies.html`（2026-10-31，三轮迭代定稿）。

## 最终架构：表头带脱离滚动容器（双表模式）

```
卡片（纵向 flex，flex:1 + min-height:0）
└ .pg-hscroll   横向滚动壳：display:flex; flex-direction:column;
                overflow-x:auto; overflow-y:hidden（必须显式！见陷阱②）
  ├ .pg-head-row  静态表头带：flex:none；不在任何滚动容器内（物理上不可能位移）
  │   └ .pg-head-table  table-layout:fixed + <colgroup>
  └ .pg-vscroll   唯一纵向滚动者：flex:1 1 auto; min-height:0;
                  overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable
      └ .pg-body-table  table-layout:fixed + 同一份 <colgroup>；tbody 由 mustache 渲染
```

- **两表列对齐**：`table-layout:fixed` + 由**同一份 JS 列配置数组**生成两张表的 `<colgroup>`（一次定义两处渲染，禁止手写两份宽度）；`scrollbar-gutter:stable` 两表成对出现（Windows 经典滚动条占宽时同让 gutter 列不错位；macOS overlay 为 0 无感）
- **横向滚动**：窄屏列总宽超容器时由 `.pg-hscroll` 承担，表头带与内容区同容器自然同步横移
- **行线**：`border-collapse:separate; border-spacing:0` 下 tr 边框不渲染，行线挂 td（`border-bottom:1px solid var(--border)`），`tbody tr:last-child td` 去线
- **改行数/翻页后**：只重渲染 tbody，表头带不动；动态注入后走 `afterInject()`

## 陷阱（各踩过一次，2026-10-31）

① **sticky 表头方案整体弃用**：`border-collapse:collapse`（lyra 整包 preflight 默认）+ `thead th{position:sticky}` 有重绘错位缺陷，表头「先随滚再弹回」；改 separate 后真机断言 top 恒定，但 sticky 方案滚动条天然贯穿表头高度，与「滚动条只在表头下方」的产品预期不符——直接用双表模式，sticky 相关规则一律不写。

② **单轴 overflow 升格陷阱**：只写 `overflow-x:auto` 时，另一轴 `visible` 会被 CSS 规范**强制升格为 auto**——容器意外成为纵向滚动者，滚动条贯穿表头高度（表头带「随滚震动」的第二真因）。纵向分层壳必须显式 `overflow-y:hidden`。

③ **高度链断点排查法**：表头「跟着滚」先逐层量 `offsetHeight`（html→.lx-content→#pageContent→.pg-main→卡→.pg-hscroll→.pg-vscroll），哪层子元素高于父层且父层 overflowY 非 hidden，断点就在那。中间任何一层缺 `min-height:0` 都会让 flex 高度约束失效。

## 验证口径（agent-browser 真机）

1. 程序化滚动 `.pg-vscroll` 全程采样：表头带任一单元格 `getBoundingClientRect().top` 恒定（物理静止，<1px 达标；双表模式下应为**精确恒定**）
2. `.lx-content` scrollTop 恒 0 且 `scrollHeight === clientHeight`
3. 纵向滚动条归属：`.pg-vscroll.scrollHeight > clientHeight` 且 computed `overflow-y:auto`；`.pg-hscroll` 纵向不可滚
4. 列对齐：两表逐列 `getBoundingClientRect().width` 数组相等
5. 滚动中与滚动到底各截图一张肉眼核验（本项目有「DOM 对、视觉错」前科，DOM 断言不能单独作数）
