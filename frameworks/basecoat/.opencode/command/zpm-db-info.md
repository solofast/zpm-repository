---
description: 生成/更新数据字典页（运行时结构 + 静态含义文档）
---
范围（可选，默认全部 sync 表）：$ARGUMENTS

执行步骤：
1. 读 zpm.config.yaml 确认 datasource 与 sync.tables；用 dbx mcp 连接数据源，逐表确认结构（字段名/类型 + 样本数据），基于 *_id 外键列推断表间关系
2. 生成 pages/db-info.html 并登记 MENU：表清单/主键/字段列表运行时来自 GET /api/_meta（禁止写死）；表作用与字段含义的文档性注释静态写在页面顶部 DB_DOC 配置（宪法豁免条款；框架模板的 DB_DOC/RELATIONS 等配置默认为空、页面自带「未同步表」空态与「/zpm-db-info 引导」提示条；生成时把真实 schema 按既有结构填入配置区（DB_DOC/COMMON_DOC/RELATIONS/FK_MAP/TYPE_OVERRIDE/GROUPS/ER_AXIS），DOC 与 RELATIONS 非空后空态与提示条自动消失）
3. 表间关系：先给关系清单（A.列 → B 表）；关系图（简易 ER）**必读 `knowledge/rules/db-info.md`** 并按其模式实现——泳道=业务域的 HTML/CSS 节点 + 内联 SVG 贝塞尔连线（悬停高亮相关连线、连线 title 列全部外键字段、自引用右侧小环、通用外键不画线），禁 mermaid / echarts 画 ER

4. **i18n 接入（必做）**：页面 UI 文案（标题/搜索/状态/计数单位/表头/徽章/分组与泳道标题/空态失败提示等）接入多语言——`import { ensureI18n, t } from '/i18n.js'`，启动先 `await ensureI18n()`，静态节点 data-i18n + 填充循环，动态拼接文案 `t(key, 中文缺省)`（代码缺省含空格的，locale 值逐字保留空格）；新 key 同步补进 `pages/locales/` 两份文件；文档性内容（DB_DOC/COMMON_DOC/关系 note/枚举说明）不翻译不造 key；细则必读 `knowledge/rules/i18n.md`
5. 遵守 AGENTS.md 全部规则；输出改动文件清单 + 验证方式
