# crud 实体管理页（主页表格 + 弹窗写操作）

**单实体增删改查管理页的统一模式。基准实现：`templates/crud.html`**（模式蓝本 zpm-new-crm companies.html，经 demo20 规则适配）。新页面用 `zpm-new-page-tpl crud <需求>` 生成，不要从零手写。表格本体约束见 `table.md`，滚动见 `table-scroll.md`，反馈分工见 `toast.md`。

## 1. 什么时候用 crud.html 模板（WHEN）

- 对**单个实体**做增删改查的管理页：主页即表格，写操作（新增/编辑/删除）走弹窗。
- 目标表在 `zpm.config.yaml` 的 `write.tables` 白名单内，需要真实写入。
- 需要关键字搜索 / 枚举或关联字段筛选 / 分页 / 导出 Excel。
- 不适用：看板/仪表盘（tpl-dashboard）、纯详情（tpl-detail）、只读轻列表（tpl-list）。

## 2. 页面骨架

工具栏（`h1.pg-h1` + spacer + 「新增」primary sm + 「导出」outline sm）→ 筛选区 → 表格卡（table.md 契约）→ 分页。满高弹性布局、分页常驻卡底。

**筛选区约定**：

- 关键字搜索：`SEARCH_FIELD:like`，250ms 防抖 + 回车立即查，**改筛选回第 1 页**。
- 枚举/关联字段筛选用 basecoat combobox（标记结构逐项对齐 `combobox.md`）；筛选高度统一 36px、定宽 170px 防清除按钮显隐跳动。
- **关键坑（combobox 值同步）**：给 hidden input 赋值不触发任何事件——用捕获态 click/keydown + `requestAnimationFrame` 读 hidden 值与 state 比对（`bindComboSync`，crud.html 有现成实现）。
- 业务 option 用 DOM API 动态创建（`fillComboOptions`，保留静态空值 option），**禁 innerHTML 拼业务数据**；建好后 `combo.refresh()` 或 `initAll` 兜底。
- 无枚举/关联字段时删掉 combobox 块只留搜索框——**禁止发明无数据来源的筛选项**。

## 3. 新增/编辑 dialog（共用一个）

- `dialog.dialog > .pg-dialog`（`width:min(560px,92vw)`），header/section/footer 官方标记；`showModal()`（top layer 不受外壳布局影响）。
- 表单：`.pg-form-grid` 双列网格（`gap:12px 14px`），整行字段 `.pg-span2`；必填字段 label 带 `.pg-req` 红星（`aria-hidden`）；每个可错字段配 `<p role="alert" class="pg-field-error">`。
- 交互：打开时 `focus()` 首字段；编辑态**隐藏主键输入**（主键不可改）并预填原始值（不经 i18nText，无损写回）；提交期间 `btnSave.disabled = true` 防重复；校验失败聚焦首个错误字段。
- **保存失败走表单内提示**（`.pg-field-error`）——toast/错误条会被 dialog 背板遮挡（toast.md 分工表）；成功才关弹窗 + success toast + 刷新列表。

## 4. 删除 dialog

- 独立确认 dialog：文案带实体名，确认按钮 `data-variant="destructive"` + 提交期间 disabled。
- 软删表（有 `deleted_at`）：`PATCH { deleted_at }` + 列表侧 `aliveOnly()` 防御性过滤；物理删表且服务端支持时用 `DELETE`。
- 成功后：关弹窗 → success toast → 刷新列表（删空当前页回退一页）；失败：**先关弹层再 error toast**（toast 在 top layer 不受背板影响，错误条会被遮）。

## 5. 反馈与数据约定

- 反馈分工严格按 `toast.md` 第 4 节：操作成功/失败/可预防空态 → toast 三态；页面级加载失败 → 错误条；弹窗内校验/保存失败 → 表单内。
- 主键约定：服务端不自动生成主键时（如 Halo `category.name`），新建表单显式收集唯一 ID，提交前 `GET /api/<表>/<id>` 预检（200=已存在报错，404=放行，POST 为最终裁决）。
- i18n：全部 UI 文案 `t(key, 中文缺省)`，新 key 补进 `pages/locales/` 两份 locale（对称）；数据翻译列经 `i18nText()`。

## 6. USE_DEMO 演示模式（模板内置）

- 模板 `USE_DEMO=true` 时走内存 `demoRows`：`demoQuery()` 按 where/sort/page 仿真（与真实 API 行为一致），增删改在内存数组完成，可演示完整闭环。
- 接真实表：`USE_DEMO=false` + 删除 demo_rows（**正式页严禁保留假数据**，宪法硬性规则 2）。

## 7. 验证口径

- 完整 CRUD 闭环实测：新增（success toast + 列表出现）→ 编辑（预填正确、主键隐藏、PATCH 生效）→ 删除（确认弹窗 + destructive toast 流程）→ 搜索/筛选/翻页联动。
- 布局不变量按 `table-scroll.md` + layout-shell.md（页面级无滚动、表头钉死、弹窗 showModal 正常）。
- 对齐断言脚本见 `table.md` 第 10 节。
