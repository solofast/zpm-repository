# card 卡片

## 适用范围
全站所有使用 basecoat `.card` 语义类的卡片（KPI 卡、信息卡、图表容器等）。

## 约定
- 所有 `.card` 一律显式声明 `padding: 18px 26px`，禁止依赖 basecoat 包内置 `padding-block` 默认值直接填充内容（内置默认值导致左右贴边）。
- 覆盖统一写在全局层，禁止单页散写。

## 代码落位
`pages/layout/layout.css`「组件 token 对齐」节：`.card { padding: 18px 26px; }`

## 验证口径
playwright 读任一含 `.card` 页面的 computed style，断言 `padding` 为 `18px 26px`；截图肉眼核验四边留白。
