/* basecoat-pm UI 文案多语言加载器（pages/i18n.js）
 *
 * 职责边界（与 app.js 的 i18nText 分工，见 knowledge/rules/i18n.md）：
 *  - t()        → UI 文案（外壳/页面自有文字），来源 locales/<locale>.json
 *  - i18nText() → 数据库翻译列（JSON 多语言字段）取值，在 pages/app.js
 *
 * 语言状态：localStorage.langMode（'zh-CN' 缺省 / 'en-US'，可扩展），
 * 由外壳 header 语言切换下拉（basecoat dropdown-menu）写入，切换后整页刷新；
 * <html lang> 由外壳同步。本模块不依赖 app.js，layout.js 可直接 import。
 *
 * locale 文件约定：
 *  - 目录 pages/locales/（serve 映射为 /locales/），文件名 <locale>.json
 *    （zh_CN.json / en_US.json），扁平 key；不要放项目根 locales/（不被托管）
 *  - zh_CN.json 恒为基础表（总是加载）；当前语言表覆盖基础表，
 *    en_US.json 缺 key 时自动回退中文，页面无需自行回退
 *  - 新增语言：locales/ 加 <locale>.json + LOCALE_FILES 登记 + 外壳语言菜单加选项
 *
 * 失败兜底（fail-open）：locale 加载失败时 t(key, fallback) 返回调用点内置中文缺省，
 * 外壳仍完整可用；key 与 fallback 都缺省时返回 key 本身。
 *
 * 用法：
 *   import { ensureI18n, t, getLang } from '/i18n.js';
 *   await ensureI18n();            // 幂等；mountLayout 内部也会调用，页面可不显式调
 *   t('menu.home', '首页')          // 第二参数为调用点中文缺省（推荐显式传入）
 */

/* locale 标识 → 文件名（新增语言在此登记 + 外壳语言菜单加选项） */
const LOCALE_FILES = {
  'zh-CN': 'zh_CN',
  'en-US': 'en_US',
};

const table = new Map(); // 扁平 key → 文案（基础表 + 当前语言覆盖合并结果）
let promise = null;      // ensureI18n 幂等缓存

/** 当前界面语言（直读 localStorage.langMode，缺省 zh-CN） */
export function getLang() {
  try {
    const stored = localStorage.getItem('langMode');
    return LOCALE_FILES[stored] ? stored : 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

async function fetchLocale(name) {
  const res = await fetch('/locales/' + name + '.json');
  if (!res.ok) throw new Error('HTTP ' + res.status + ': /locales/' + name + '.json');
  const json = await res.json();
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('locale 文件不是 JSON 对象');
  return json;
}

function mergeLocale(json) {
  for (const [k, v] of Object.entries(json)) {
    if (typeof v === 'string') table.set(k, v);
  }
}

/**
 * 加载 locale 文件（幂等，首次调用后缓存 promise）。
 * zh_CN 基础表失败仅 console 轻提示（文案退回调用点缺省）；当前语言表失败回退中文。
 */
export function ensureI18n() {
  if (!promise) {
    promise = (async () => {
      try {
        mergeLocale(await fetchLocale(LOCALE_FILES['zh-CN']));
      } catch (err) {
        console.warn('i18n: zh_CN.json 加载失败，UI 文案退回调用点缺省：', err);
      }
      const lang = getLang();
      if (lang !== 'zh-CN') {
        try {
          mergeLocale(await fetchLocale(LOCALE_FILES[lang]));
        } catch (err) {
          console.warn('i18n: ' + lang + ' locale 加载失败，回退中文：', err);
        }
      }
    })();
  }
  return promise;
}

/** 取 UI 文案：locale 表 → 调用点中文缺省（fallback）→ key 本身 */
export function t(key, fallback) {
  return table.get(key) ?? fallback ?? key;
}
