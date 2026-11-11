# badge（徽章/标签）适配细则

## 圆角机制（basecoat 1.1.0 vendor 实测）

basecoat 的 `.badge` 圆角是**独立胶囊变量** `border-radius: var(--radius-4xl)`（实测 2rem），**不随 `--radius` 联动**——直角主题（如 Lyra `--radius: 0`）下 badge 仍是圆角。这不是 bug，是 basecoat 的设计，因此本项目引入专用 token 接管。

## 消费规则

`pages/layout/layout.css`「组件 token 对齐」节：

```css
.badge { border-radius: var(--tag-radius, var(--radius-4xl)); }
```

- 未声明 `--tag-radius` 的环境回退 basecoat 胶囊值（对其他工程零侵入）
- 本项目主题文件**必须显式声明**：圆角主题 `--tag-radius: 2rem`、直角主题 `--tag-radius: 0`（见 themes/*.css）

## 新增/修改主题时的同步义务

1. 主题文件加/改 `--tag-radius` 行
2. `theme-studio` 内置预设 diff 同步该 token（滑杆 0–2rem，胶囊观感≈2rem）
3. 内置预设与主题文件**逐键断言**必须通过（断言脚本在 theme-studio 验证流程内）
4. 导出 CSS 含 `--tag-radius` 行（恒导出，与 `--radius` 同为主题文件标配）

## 适用范围

仅 `.badge`（本项目数据字典/商机看板/邮件页的全部徽章类标记）。basecoat 中**天生圆形**的组件（avatar、switch、radio、range 滑钮、progress）走 `calc(infinity * 1px)`，不在本 token 管辖内，勿混淆。
