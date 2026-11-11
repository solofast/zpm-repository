# db-info 数据字典页（关系图 / ER）

## 适用范围
`pages/db-info.html` 的「关系图（简易 ER）」区块。凡生成或重做数据字典页的关系可视化，必读本细则；**一律用本模式（泳道 HTML/CSS 节点 + 内联 SVG 贝塞尔连线，零图表库、零外部依赖、无失败态），任何规模都禁用 mermaid/echarts 画 ER——不做两套方案切换**。

## 约定
1. **泳道 = 业务域**：泳道复用 `GROUPS` 表分组配置（单一事实源，分组与泳道不两处维护）；节点 = 运行时 `_dict` 表 ∩ 泳道清单的交集，缺失表自动跳过、未知表不画（与表卡片同口径）。节点显示表名，`title` 取完整表作用。
2. **零图表库**：节点用 HTML/CSS（`.dg-lane` 列宽 168px flex column + `.dg-node` 表框），连线用绝对定位 SVG 覆盖层（`pointer-events:none`），容器横向滚动。**禁 mermaid/echarts 画 ER**（外部依赖 + 大 schema 布局不可控）。颜色一律 `var(--token)`，半透明用 `color-mix(in oklab, ...)` 现场派生。
3. **连线方向与形状**：箭头由**子表外键字段指向父表**（`marker-end` 箭头，填充色走 CSS class 随主题 token 联动）。节点矩形取 `offsetLeft/offsetTop/offsetWidth/offsetHeight`（相对画布容器）：
   - 跨泳道：源出右/左、目标进左/右，水平贝塞尔 `C ±k`，`k = clamp(30, 120, 水平距离 × 0.4)`
   - 同泳道：上出下进，竖向贝塞尔，`k = max(26, 高度差 / 2)`
   - 自引用：表框**右侧小环**（右侧 36px 处两个控制点，30%/70% 高度进出）
4. **提示与高亮**：每条连线挂原生 SVG `<title>`（零 JS）：`子表 → 父表：全部外键字段, ...`；悬停表名/表框高亮相关连线与邻接表、其余淡出（`.is-hot`），移出恢复。**已知取舍：不做缩放/拖拽**（静态 SVG），容器横向滚动兜底；若未来确需缩放再加 viewBox 方案，不在本细则范围。
5. **排除规则**：`company_id` / `create_uid` / `write_uid` 等 通用外键、指向「未同步」表的字段——只进上方关系清单，**不画线**（否则连线噪音淹没主结构）。
6. **单一事实源**：关系清单与关系图共用同一结构化 `RELATIONS` 常量（`fromTable.fromField → toTable`），禁止两处各写一份。
7. **重绘时机**：首帧 `requestAnimationFrame`、`document.fonts.ready`、`window resize`（rAF 节流）三处重绘，防字体加载/窗口变化后连线错位。

## 代码落位
`pages/db-info.html` 内（框架模板自带基准实现，开箱即用）：`.dg-*` 样式节 + `buildDiagram / dgEdges / drawDiagram / dgSetHot / dgBindHover / dgInit` 函数群；新项目由 `/zpm-db-info` 只填 `GROUPS / DB_DOC / COMMON_DOC / RELATIONS / FK_MAP / TYPE_OVERRIDE` 文档性配置，不改图引擎代码。

## 验证口径
`zpm serve` 后 playwright 断言：① 关系图节点数 = 泳道清单 ∩ `_dict` 表交集；② 悬停任一表框，相关连线 `.dg-edge` 命中高亮类、邻接节点 `is-hot`；③ 任一连线 `<title>` 含其全部外键字段名；④ 自引用表框右侧出现小环路径；⑤ 窗口 resize 后连线端点仍贴合节点矩形（无悬空）；⑥ 切暗色主题后箭头/连线颜色随 token 变化。
