# basecoat 组件适配细则（knowledge/rules/）

宪法「basecoat 写法规约」引用的组件级适配细则目录。**使用任何 basecoat 组件前，先查本目录有无对应 `<组件名>.md`**；有则按细则开发适配，无则按 basecoat 官方文档 + token 纪律开发，并把新沉淀的约定补录到本目录。

## 索引

| 文件 | 组件/主题 | 一句话 |
|---|---|---|
| [combobox.md](./combobox.md) | combobox 下拉选择 | 官方标记结构、value 同步机制、边框盒与聚焦约定、定宽防跳、lyra 32px 高度口径、dialog 回填 |
| [form-focus.md](./form-focus.md) | 全部表单件（input/select/combobox） | 全站已去除 focus 高亮：聚焦不变色、无 ring；恢复方式 |
| [badge.md](./badge.md) | badge 徽章/标签 | 圆角走 `--tag-radius` token（不随 --radius 联动的原因与消费规则） |
| [i18n.md](./i18n.md) | i18n 国际化 | UI 文案走 locales/（t()）+ 翻译列走 app.js i18nText；外壳语言下拉（dropdown-menu 选项式）与新增语言步骤 |
| [table-scroll.md](./table-scroll.md) | 表格滚动/表头钉死 | 双表模式（表头带脱离滚动容器物理钉死）、单轴 overflow 升格陷阱、sticky 弃用原因、高度链断点排查 |
| [pagination.md](./pagination.md) | 分页 | basecoat 无独立分页 CSS：官方 btn 拼装结构、aria-current、页码省略算法、动态重建 |
| [card.md](./card.md) | card 卡片 | 内距显式 18px 26px，禁依赖包内置 padding-block 默认值 |
| [db-info.md](./db-info.md) | db-info 数据字典页 | 关系图用泳道+SVG 贝塞尔模式（零图表库，任何规模禁 mermaid/echarts，不做方案切换） |
| [toast.md](./toast.md) | toast 轻提示 | 容器 id+class 双契约（缺 class 即无样式裸奔）、`toast({category,title,description})` 三态语义色、堆叠上限 3 关旧保新、反馈分工 toast/错误条/表单内 |
| [table.md](./table.md) | table 表格（显示/UI/交互硬约束） | 满高弹性布局、双表 colgroup 单一事实源（PG_COLUMNS 三处同步）、12px 字阶 + tabular-nums、成对对齐（数值/时间右、操作左）、骨架三态、富分页、导出全量语义 |
| [crud.md](./crud.md) | crud 实体管理页 | 单实体增删改查模式：用 crud.html 模板生成（WHEN/WHAT 见模板头）、工具栏/筛选/编辑弹窗表单网格/删除确认、保存失败走表单内、USE_DEMO 演示闭环、完整 CRUD 闭环验证 |

## 通用原则（细则的细则）

1. **官方组件优先**：能用量产组件绝不自绘；标记结构以 vendor 内 basecoat css/js 的实际类名与 data 属性契约为准（可从 `vendor/basecoat/basecoat-lyra.cdn.min.css` / `all.min.js` 反推核对，禁止凭记忆假设；注意 lyra 变体与通用版的尺寸锁定可能不同源，见 combobox.md 约定 4）
2. **token 纪律**：颜色一律 `var(--token)` 直接引用（oklch，禁 hsl() 包装）；派生色用 `color-mix(in oklab, ...)` 现场算
3. **改动落位**：组件行为的全局约定写 `pages/layout/layout.css`「组件 token 对齐」节（项目自有层、全站加载、在 basecoat 之后）；单页特例写页面自有样式节并加 `/* PM 约定：... */` 注释
4. **验证口径**：涉及交互状态的改动必须 playwright 读 computed style 断言 + 截图肉眼核验（本项目有过「DOM 对、视觉错」事故）；`:focus-within`/`:has` 等"父级联动"样式要连父级一起测
