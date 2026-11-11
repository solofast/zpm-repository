/* basecoat-pm 通用工具库（pages/app.js）
 *
 * cssColor + afterInject 为 basecoat-pm 新增，其余继承 proto-crm 实战。
 * 供新页面与骨架复用（`import { ... } from '/app.js'`）。
 *
 * 依赖：按需使用 /vendor 下的 dayjs / xlsx 全局（页面须先引对应 <script src>）；
 *       basecoat 组件初始化依赖 /vendor/basecoat/all.min.js（afterInject 用）。
 *       未引入时相关函数自动降级或抛出可读错误，不影响其他函数。
 *       多语言：语言状态 getLang 与 UI 文案 t() 在 pages/i18n.js（locales/<locale>.json），
 *       本文件负责数据库翻译列 i18nText（getLang 自 i18n.js 再导出，用法不变）。
 */

import { ensureI18n, t, getLang } from './i18n.js';

export { getLang };

/* ===== 请求封装（全部带失败处理，错误信息可直接进错误条） ===== */
export async function getJSON(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('网络请求失败：' + url);
  }
  if (!res.ok) throw new Error('请求失败（HTTP ' + res.status + '）：' + url);
  try {
    return await res.json();
  } catch {
    throw new Error('响应不是有效 JSON：' + url);
  }
}

// 分页拉全量：pageSize=100，翻页直到返回条数 < 100（与既有页面口径一致）
export async function fetchAll(table, query) {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 50; // 防御性上限，避免异常响应导致死循环
  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const qs = query ? query + '&' : '';
    const json = await getJSON('/api/' + table + '?' + qs + 'page=' + page + '&pageSize=' + PAGE_SIZE);
    const data = Array.isArray(json.data) ? json.data : [];
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
  return rows;
}

/* ===== 错误条（与外壳同款样式；mount 后返回 show/hide） ===== */
export function mountErrorBar(mountTo) {
  const host = mountTo || document.body;
  const bar = document.createElement('div');
  bar.setAttribute('role', 'alert');
  bar.style.cssText = 'display:none;position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:50;'
    + 'width:max-content;max-width:min(92vw,680px);align-items:flex-start;gap:12px;padding:10px 14px;'
    + 'border:1px solid var(--destructive);border-radius:var(--radius);background:color-mix(in oklab, var(--destructive) 10%, transparent);'
    + 'color:var(--destructive);box-shadow:0 8px 24px color-mix(in oklab, var(--foreground) 12%, transparent);';
  const msg = document.createElement('span');
  msg.style.cssText = 'font-size:13px;line-height:1.5;word-break:break-all;';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn';
  close.dataset.variant = 'secondary'; // basecoat 1.1 无 .btn-secondary 类，变体走 data-variant
  close.textContent = t('shell.close', '关闭');
  // locale 异步就绪后刷新文案（mount 时刻可能尚未加载完成）
  ensureI18n().then(() => { close.textContent = t('shell.close', '关闭'); });
  close.style.cssText = 'font-size:12px;padding:2px 10px;flex:none;';
  close.addEventListener('click', () => { bar.style.display = 'none'; });
  bar.append(msg, close);
  host.appendChild(bar);
  return {
    el: bar,
    show(text) { msg.textContent = text; bar.style.display = 'flex'; },
    hide() { bar.style.display = 'none'; },
  };
}

/* ===== 演示模式角标 =====
 * 仅供「未接入 pages/layout 外壳」的页面（骨架模板）使用；
 * 接入外壳的页面由 layout.js 统一负责，禁止重复实现。 */
export async function mountDemoBadge(host) {
  await ensureI18n();
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = t('shell.demoBadge', '演示模式：数据不会保存');
  badge.style.display = 'none';
  (host || document.body).appendChild(badge);
  try {
    const meta = await getJSON('/api/_meta');
    if (meta && meta.writeMode === 'simulated') badge.style.display = '';
  } catch (err) {
    console.warn('app.js: /api/_meta 读取失败，演示角标未更新：', err);
  }
  return badge;
}

/* ===== 格式化 ===== */

// 金额：amount_amount_micros ÷ 1e10 = 万元（与图表页口径一致）
export function formatWan(micros) {
  if (typeof micros !== 'number' || !isFinite(micros)) return '—';
  const wan = micros / 1e10;
  const v = Math.round(wan * 10) / 10;
  const s = Number.isInteger(v)
    ? v.toLocaleString('zh-CN')
    : v.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return '¥' + s + '万';
}

// 日期：dayjs 格式化；空值/非法值统一「—」；未引 dayjs 时降级截取前 10 位
export function formatDate(value, tpl) {
  if (value == null || value === '') return '—';
  if (typeof dayjs !== 'function') return String(value).slice(0, 10);
  const d = dayjs(value);
  return d.isValid() ? d.format(tpl || 'YYYY-MM-DD') : '—';
}

/* ===== Excel 导出（XLSX + dayjs 生成「前缀_YYYY-MM-DD.xlsx」文件名） ===== */
export function exportRowsToExcel(rows, sheetName, filePrefix) {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX 库未加载：请先在页面引入 /vendor/xlsx/xlsx.full.min.js');
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('没有可导出的数据');
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName || 'Sheet1').slice(0, 31));
  const date = (typeof dayjs === 'function')
    ? dayjs().format('YYYY-MM-DD')
    : new Date().toISOString().slice(0, 10);
  const filename = (filePrefix || sheetName || 'export') + '_' + date + '.xlsx';
  XLSX.writeFile(wb, filename);
  return filename;
}

let colorCtx = null
/** 读取 CSS 变量的计算值并规范化为 echarts 可用的颜色串（oklch/hsl 皆可） */
export function cssColor(varName, alpha = 1) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!v) return '#888'
  if (!colorCtx) colorCtx = document.createElement('canvas').getContext('2d')
  colorCtx.fillStyle = v // 赋值即规范化：oklch(...) → #rrggbb；非法值保持原样
  const c = colorCtx.fillStyle
  if (alpha >= 1) return c
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
  }
  return c
}

/** innerHTML 注入片段后调用：重建 basecoat 交互组件（下拉/弹窗等） */
export function afterInject(container) {
  if (window.basecoat?.initAll) window.basecoat.initAll()
  return container
}

/* ===== 翻译列（PROP-20261108-01） ===== */
// 语言状态 getLang 在文件头自 pages/i18n.js 再导出（唯一权威在 i18n.js，勿在本文件重声明）

// 翻译列取值：同步库的多语言字段为 JSON 串形态
// （如 {"en_US":"Large Cabinet","zh_CN":"大型橱柜"}），严禁原样渲染整串 JSON。
// 按当前语言取值，缺该语言时回退另一语言；非 JSON 串原样返回
export function i18nText(value, lang) {
  const cur = lang || getLang()
  if (typeof value !== 'string' || !value.startsWith('{')) return value
  try {
    const o = JSON.parse(value)
    if (typeof o !== 'object' || o === null) return value
    const primary = cur === 'en-US' ? 'en_US' : 'zh_CN'
    const fallback = cur === 'en-US' ? 'zh_CN' : 'en_US'
    return o[primary] || o[fallback]
      || Object.values(o).find((v) => typeof v === 'string' && v)
      || value
  } catch {
    return value
  }
}
