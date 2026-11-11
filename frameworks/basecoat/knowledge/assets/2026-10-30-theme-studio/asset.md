---
type: page
source: zpm-new-crm/pages/theme-studio.html + themes/*.css（2026-10-30 主题配置工作台）
tags: [主题, 换肤, css-tokens, oklch, shadcn, basecoat, 颜色编辑器, hex转oklch, 预设主题, 持久化, 导出CSS, theme-studio]
tables: []   # 无业务数据，纯前端工具页（唯一 fetch 是 /theme.css 结构性资源）
basecoat: [card, btn, input, select, badge, skeleton]
---

# 主题配置工作台（预设切换 + token 自定义编辑器）

整站换肤工具页：5 个内置预设主题（蔚蓝/翡翠/暮紫/暖阳/Lyra）一键切换 + 自定义编辑器（圆角/基础字号/字体栈滑杆与下拉 + 6 组 31 项颜色 token，取色器与 oklch 原文双通道）+ 浅色/深色分段编辑 + localStorage 持久化 + 「复制 CSS」导出为 themes/*.css 同构文本（存盘并指向 server.theme 即正式生效，运行时覆盖仅预览）。内置原生 JS 实现的 hex↔oklch 转换（OKLab 参考矩阵，域外色保 L/H 二分降 C 裁剪）。

## files/

| 文件 | 角色 |
|---|---|
| `files/theme-studio.html` | 工具页本体：预设卡 + 编辑器 + 单覆盖点生效 + 持久化 + 导出（960 行，接入应用外壳） |
| `files/themes/default.css` | 预设① 蔚蓝（shadcn 默认系） |
| `files/themes/emerald.css` | 预设② 翡翠 |
| `files/themes/violet.css` | 预设③ 暮紫 |
| `files/themes/orange.css` | 预设④ 暖阳 |
| `files/themes/lyra.css` | 预设⑤ Lyra（Zinc×Teal，radius 0，暗色含 alpha 边框——TweakCN 导出样例） |

## 适配要点（复用时必改）

1. **预设数据与文件同步**：token 以 `PRESET_DIFFS` 内置（共享基座不含 --radius，每预设 diff 首项即 --radius；lyra 为 `0`）；改预设必须同步改 themes/*.css 并重跑「5 预设 × 文件逐键断言」
2. **服务端探测**：加载时解析 `/theme.css` 与内置预设比对定「当前」；zpm serve **只真服务 `/theme.css`**，`/themes/*.css` 返回的是兜底 HTML（Content-Type: text/html）——不能走 link 换 href 机制，切换靠唯一覆盖点 `<style id="tokenOverride">` 注入 diff
3. **豁免边界**：运行时覆盖 token 是「工具页」例外（PM 授权），页面自身颜色仍只准 `var(--token)`；正式生效路径 = 导出 CSS → 存 `themes/xxx.css` → `zpm.config.yaml` 的 `server.theme` 指向 → 重启 serve（配置不热加载）
4. **转换精度**：域内色 hex↔oklch 逐像素 Δ=0；域外色（高饱和 destructive 等）Δ≤11/255——真实渲染始终由浏览器按 oklch 原文执行，取色器色块仅预览；alpha token（`oklch(1 0 0 / 10%)`）用 oklch 文本框无损编辑，取色器改色会 flatten α=1（有 α 标记）
5. **字体控件**：basecoat 消费 `--font-sans`（css 内 3 处引用），下拉写入该 token 即真生效；不引外部字体文件（零 CDN），本机无该字体按栈回退
6. **外壳接入**：`MENU` 登记 key/href/label/icon（palette 图标在 `ICON_PATHS`），头注释 active 枚举同步；`mountLayout({ active: 'theme-studio' })`
7. **持久化**：`localStorage['zpm.themeStudio.v1']` = `{ preset, scale:{radius,fontSize,sans}, light, dark }`；preset 枚举扩新预设时旧数据天然兼容（diff 键校验放行）

## 已知取舍

- 预设切换是「diff 注入」而非 link 换 href：受限于 zpm serve 路由（见适配 2）；若服务端未来真服务 /themes/*.css，可改为换 link 并清空覆盖点
- 导出把 `--radius` 放段首、可附 `--font-sans` 行，与手写主题文件段序不同但语义等价（已实测被服务端正常消费）
- `--spacing` 未做控件：basecoat 裁剪版仅一处引用，改动无感知（不臆造尺度变量）

## 复用

```
zpm-asset-use   # 浏览并复用：把 files/theme-studio.html 拷入新工程 pages/、themes/ 按需挑选，
                # 在 layout.js 登记「主题配置」菜单，按上面 7 条适配点改
```
