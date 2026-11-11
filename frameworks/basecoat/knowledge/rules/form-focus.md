# 表单组件 focus 约定（全站已去除聚焦高亮）

PM 约定（2026-10-31）：input / combobox / select 等表单件**聚焦时外观零变化**——不变 ring 色、无外圈 ring、无 outline。

## 实现位置与内容

`pages/layout/layout.css`「组件 token 对齐」节（全站生效，本项目自有层、在 basecoat 之后加载、同特异性后者胜、无需 !important）：

```css
.input:focus-visible,
.combobox .input:focus-visible,
select.select:focus-visible,
.field > :is(input, select, textarea):focus-visible {
  outline: none;
  --tw-ring-shadow: 0 0 #0000;   /* Tailwind-4 ring 中和写法 */
  --tw-ring-color: transparent;
  border-color: var(--input);    /* 边框拉回静息值 */
}
.lx-search:focus { border-color: var(--border); }  /* 外壳快捷搜索框同约定（外壳自有规则覆写） */
```

## 为什么这样写（机制，来自 vendor 实测）

- basecoat 的 focus 高亮 = `:focus-visible` 规则向 `box-shadow` 变量链注入 `--tw-ring-shadow`（3px ring）+ `border-color: var(--color-ring)` 变色
- 只中和 ring 两个变量 + 拉回 border 色，**不要整条 `box-shadow: none`**——会误杀组件本身的普通阴影
- `.input-group` 这类"父级盒子"组件，basecoat 会在聚焦时给 **group** 注入 ring（`:focus-within` 路径），单测 input 的 computed style 会漏——**父级联动必须连父级一起断言**（见 combobox.md）

## 单页特例写法

页面内如需给某个表单件做"聚焦也不变"的补充（如 mails 页 combobox 的 group），写在**页面自有样式节**并注释 `/* PM 约定：... */`，选择器须同时覆盖 `:focus-within`（group）与 input 本体。

## 已知 tradeoff

focus 高亮去除后 **Tab 键盘导航无视觉焦点指示**（鼠标用户无感）。恢复方式：删除 layout.css 该小节；若将来要"更细/更淡的焦点线"，可升级为 token 进主题配置页调节（截至本细则撰写尚未做，YAGNI）。
