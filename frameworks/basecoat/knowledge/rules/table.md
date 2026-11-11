# table 表格（显示 / UI / 交互严格规范）

数据表格页的硬性约束。**基准实现：`pages/category.html` 与 `templates/crud.html`**（模式蓝本 zpm-new-crm companies.html）——新表格页从 crud.html 模板生成，不要从零手写。滚动/表头钉死的架构细节见 `table-scroll.md`，分页拼装见 `pagination.md`，反馈分工见 `toast.md`。

## 1. 页面布局契约（满高弹性，分页常驻可见）

- 外壳把 `#pageContent` 移入 `.lx-content`（唯一滚动容器）；页面接管为**满高弹性列**：
  `#pageContent{height:100%}` + `.pg-main{height:100%;display:flex;flex-direction:column;padding:20px 24px}`；
  工具条/筛选区固定高，**表格卡 `flex:1` 吸收剩余空间，表格在卡内滚动**，分页行以正常文档流固定卡片底部。
- 页面层级**零 sticky/fixed**（错误条/toast 由外壳与规则组件负责）；body/html 的 height/overflow 不许碰（layout-shell.md 红线）。

## 2. 双表模式（表头物理钉死，细节以 table-scroll.md 为准）

- 结构：`.pg-hscroll`（横滚壳，`overflow-x:auto; overflow-y:hidden` 显式）→ `.pg-head-row`（静态表头带，不在任何滚动容器内）+ `.pg-vscroll`（唯一纵向滚动容器，`scrollbar-gutter:stable` 两侧成对）。
- 行线挂 `td`（separate 模式），tbody 最后一行无线（复刻 vendor「tr border-bottom + last-child 无线」观感）。

## 3. 列配置单一事实源（PG_COLUMNS）

- 列宽 / 表头文案 key / 对齐**一次定义**于 JS 常量 `PG_COLUMNS = [{ labelKey, label, w, align? }]`；
  `buildTableHead()` 同源生成两张表的 `<colgroup>` 与表头行（`th.style.textAlign = 'right'` 按 align），
  列宽总和写入 `--pg-cols-min` 作为表头带/内容区 `min-width`（横滚阈值）。
- **禁止手写两份 colgroup/两份表头**（宽度漂移 = 表头错位）。
- **改列三处同步**：`PG_COLUMNS` ↔ 行模板（tplRow）↔ `toExportRow`。表格 `table-layout:fixed`。

## 4. 12px 字阶与单元格规范

| 元素 | 规格 |
|---|---|
| 表格正文 | `font-size:12px` |
| 表头 th | `11px / weight 500 / var(--muted-foreground)`（vendor 自带 nowrap/middle 勿覆盖） |
| 单元格 td | `padding-block:10px; line-height:1.5` |
| 数值/时间列 | `.pg-num`＝`text-align:right + font-variant-numeric:tabular-nums`（位数对齐 + 等宽数字） |
| 弱化文本 | `.pg-cell-muted`＝`var(--muted-foreground)`（时间戳等） |
| 操作列 | `.pg-actions`＝`white-space:nowrap`，按钮间距 `.btn + .btn { margin-left:6px }` |
| 页面标题 | `18px`（.pg-h1，带 .pg-main 提特异性压过外壳 h1 外边距） |
| 辅助信息 | `11px`（分页信息/表头/时间戳） |

## 5. 对齐契约（成对同向，事故教训）

- **th 与 td 必须成对同向**：basecoat 不设默认 text-align（UA 默认 start/左），单边右对齐必然表头错位（2026-11-08 事故）。
- 实现：th 对齐由 `PG_COLUMNS.align` 驱动；td 对齐由行模板 class 成对（`.pg-num`=右）；**列配置改 align 时必须同步行模板 class**。
- 列类型 → 对齐：文本列左｜badge/状态列左｜**数值列右（.pg-num）**｜**时间列右（.pg-num .pg-cell-muted）**｜**操作列左（2026-11-08 PM 定稿：按钮组随「操作」表头行首对齐）**。

## 6. 三态渲染（骨架 / 空 / 失败）

- **加载态用骨架行**（不是文字）：`renderSkeleton()` 生成 5 行 × 列数，每格 `.skeleton` div（height 12px、伪随机宽度），`aria-hidden="true"`；`buildTableHead()` 先于骨架执行（表头带先就位）。
- 空态 / 失败态：`placeholderRow()` 占位行——`colSpan` 跨全列、居中、空态 `var(--muted-foreground)`、失败 `var(--destructive)` 且同时 `mountErrorBar()` 常驻错误条。
- 空值单元格统一「—」。

## 7. 富分页（basecoat 官方形态，算法见 pagination.md）

- 结构：`nav.pg-pager > span#pageInfo + spacer + ul.pg-pager-list`；信息居左（「共 N 条 · 第 x / y 页」），页码居右。
- prev/next：`btn data-variant="ghost" data-size="sm"` + 线条 SVG 箭头，包在 `li[data-fixed]`（重建时保留）。
- 页码按钮由 `updatePager()` DOM API 重建：当前页 `aria-current="page"` + `outline` 且 disabled，其余 `ghost`（`data-page` 供委托）；省略页 `li.pg-pager-ellipsis`。
- 页码序列 `pagerPages(cur,total)`：≤5 页全显；否则 `[1, 末页, cur±1]` 去重升序、间断插 `'…'`。
- 重建后 `afterInject(list)`；页码点击走 `pagerList` **事件委托**；改筛选/增删后回第 1 页（删空当前页回退一页）。

## 8. 行内操作与危险操作

- 行内按钮：`btn data-variant="outline" data-size="sm"`，删除按钮叠 `.btn-danger`（outline 上 destructive 前景色）；事件**委托挂 tbody**（`data-edit` / `data-del` 定位行），注入后 `afterInject(tbody)`。
- 删除必须经确认 `<dialog>.showModal()`，确认按钮 `data-variant="destructive"`；**提交期间按钮 disabled**（防重复），完成后恢复。
- 禁裸删、禁 alert/confirm（宪法）。

## 9. 导出语义

- 导出 = **当前筛选命中的全量结果**（同 where 条件单次 GET `pageSize=500`），不是当前页。
- 空结果集 → **warning toast**（「当前筛选没有可导出的数据」），不产出空文件；成功 → success toast（附文件名）；失败 → error toast。
- 文件名 `前缀_YYYY-MM-DD.xlsx`（dayjs）；导出列与表格列一致（`toExportRow` 与 PG_COLUMNS 同步）。

## 10. 验证口径（涉及表格改动必做）

playwright 逐列断言 + 截图肉眼核验（「DOM 对、视觉错」教训）：

```js
const headTable = document.querySelector('.pg-head-table');
const firstRow = document.querySelector('.pg-body-table tbody tr');
const th = headTable.querySelectorAll('th');
[...th].map((c, i) => ({ col: c.textContent.trim(),
  th: getComputedStyle(c).textAlign, td: getComputedStyle(firstRow.cells[i]).textAlign }))
// 断言：每列 th === td；右对齐列均为 right；操作列为 start
```

外加：`--pg-cols-min` 两表 colgroup 数一致、骨架 → 数据切换正常、页码重建后 `aria-current` 正确、双表滚动不变量按 `table-scroll.md` 口径复测。
