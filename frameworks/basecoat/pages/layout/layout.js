/* basecoat-pm 应用外壳：mountLayout({ active, title })
 *
 * 本文件是外壳契约唯一事实源；新页面用 zpm-new-page 生成以自动登记菜单。
 *
 * 契约：
 * 1. 页面在 <body> 内提供 <div id="pageContent">…（页面全部内容）…</div>；
 * 2. 页面 module 脚本调用 mountLayout({ active })；active 取 MENU key
 *    （'home' | 'workbench' | 'db-info' | 'theme-studio'，业务页在 MENU 数组登记自己的扩展 key），
 *    找不到时不高亮任何菜单项；
 *    MENU 默认四项：{ home: '首页', workbench: '工作台', 'db-info': '数据字典', 'theme-studio': '主题配置' }——
 *    /index.html 为欢迎页（恒开，无 feature）；其余三项各带 feature 开关；
 *    /db-info.html 由 zpm-db-info 生成后自动登记；业务页由 zpm-new-page* 登记；
 * 3. 可选 title：传入时 header 标题用它（非 MENU 页如 mountLayout({ active: 'db-info', title: '数据字典' })），
 *    否则按 active 从 MENU 推导；不传 title 的页面行为不变；
 * 4. 本模块构建固定外壳骨架：左列 sidebar 固定宽全高、上 header 常驻行，二者均不参与文档滚动；
 *    给 <html> 加 lx-html 类（配合 layout.css 收掉页面级滚动），外壳唯一滚动容器是内容区 main；
 *    并把 #pageContent 原样移入内容区 main
 *    （移动节点，页面已有的事件监听与元素引用不受影响）；DOMContentLoaded 前后调用均可靠；
 * 5. 页面标题显示在 header 左侧；内容区 h1 由页面自带。header 右侧含
 *    快捷搜索（回车跳 /workbench.html?q=）、数据字典入口、语言切换（globe 下拉，
 *    主题切换左侧，选项式切换 localStorage.langMode 后整页刷新；UI 文案经 i18n.js
 *    取 locales/<locale>.json，翻译列经 app.js i18nText，见 knowledge/rules/i18n.md）、
 *    主题切换、通知/帮助/用户下拉。
 * 6. 视觉与交互依赖 basecoat：下拉用 dropdown-menu 标记（vendor/basecoat/all.min.js
 *    自动初始化，点击外部 / Escape 关闭与 aria-expanded 由组件行为负责）；
 *    主题切换调 window.basecoat.theme.toggle()（切换 <html> 的 .dark 类，见 themes/<theme>.css）；
 *    外壳构建完成后调 window.basecoat.initAll() 重建组件（动态注入另见 app.js afterInject）。
 * 7. 页面功能开关：zpm.config.yaml 的 features 节（缺省全 true，fail-open）经 /api/_meta
 *    透出 { workbench, db_info, theme_studio }；显式 false 时外壳隐藏对应菜单入口（侧栏导航、
 *    header 数据字典按钮、帮助下拉）。本模块不依赖 app.js，用原生 fetch best-effort
 *    拉取一次并缓存（mountLayout 可能被多次调用），失败或 features 缺省 → 全部显示。
 * 8. 多语言：本模块依赖 pages/i18n.js（locale 加载器，不依赖 app.js）；mountLayout 先
 *    ensureI18n() 再 buildShell（locale 文件加载失败 fail-open 退回调用点中文缺省）；
 *    文案一律 t(key, 中文缺省) 取 locales/<locale>.json（宪法 PROP-20261108-01 / v1.5.0）。
 *
 * 菜单 / 演示身份 / 提示文案均为 UI 配置（locales/ 多语言），非业务数据。
 */

import { ensureI18n, t, getLang } from '/i18n.js';

// XML 命名空间标识符（createElementNS 必需的固定字符串，仅是标识符，不是网络请求，不会加载任何外部资源）
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ===== 菜单配置（默认项；zpm-db-info / zpm-new-page* 生成的页面会登记到这里） =====
 * feature：对应 zpm.config.yaml features 节的键；false 时该项菜单入口被隐藏（缺省 true） */
const MENU = [
  { key: 'home', href: '/index.html', label: '首页', icon: 'home' },
  { key: 'workbench', href: '/workbench.html', label: '工作台', icon: 'grid', feature: 'workbench' },
  { key: 'db-info', href: '/db-info.html', label: '数据字典', icon: 'database', feature: 'db_info' },
  { key: 'theme-studio', href: '/theme-studio.html', label: '主题配置', icon: 'palette', feature: 'theme_studio' },
];

/* ===== 内联 SVG 图标（24x24 线条路径，全部本地生成） ===== */
const ICON_PATHS = {
  home: ['M3 11l9-8 9 8', 'M5 10v11h5v-6h4v6h5V10'],
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  board: ['M4 4h4.5v11H4z', 'M9.75 4h4.5v7h-4.5z', 'M15.5 4H20v13h-4.5z'],
  chart: ['M3 3v18h18', 'M7 14l4-4 3 3 5-6'],
  building: ['M3 21h18', 'M5 21V3h9v18', 'M14 9h5v12', 'M8 7h3', 'M8 11h3', 'M8 15h3'],
  funnel: ['M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  orders: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3.5 6h.01', 'M3.5 12h.01', 'M3.5 18h.01'],
  database: ['M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z', 'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'],
  bell: ['M6 9a6 6 0 1 1 12 0c0 4.5 1.8 5.7 1.8 5.7H4.2S6 13.5 6 9', 'M10 19a2.2 2.2 0 0 0 4 0'],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.6 9.2a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.3 1-1.3 1.9v.2', 'M12 17h.01'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 21c.8-3.6 4-5.5 7.5-5.5s6.7 1.9 7.5 5.5'],
  globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a4.5 9 0 0 1 0 18', 'M12 3a4.5 9 0 0 0 0 18'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  logo: ['M4 5h16l-6.5 7.5V19l-3 1.5v-8L4 5z'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
  palette: ['M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 1.7-1.9-.4-1.3.5-2.1 1.8-2.1h1.1A4.9 4.9 0 0 0 21 12a9 9 0 0 0-9-9z', 'M7.5 10.5h.01', 'M10.2 7.2h.01', 'M14.2 7.2h.01', 'M16.8 10.5h.01'],
};

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function makeIcon(name, size) {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24',
    width: String(size || 18),
    height: String(size || 18),
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  });
  for (const d of ICON_PATHS[name] || []) svg.appendChild(svgEl('path', { d }));
  return svg;
}

/* ===== 工具 ===== */
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

const shell = { drawerOpen: false, toastTimer: null, toastEl: null };

/* toast 保留 lx 自实现（showToast 语义：2.5s 自动消失）；样式见 layout.css，全部走 token */
function toast(msg) {
  if (!shell.toastEl) return;
  shell.toastEl.textContent = msg;
  shell.toastEl.style.display = 'block';
  clearTimeout(shell.toastTimer);
  shell.toastTimer = setTimeout(() => { shell.toastEl.style.display = 'none'; }, 2500);
}

/* ===== 下拉（basecoat dropdown-menu 标记；vendor/basecoat/all.min.js 自动初始化，
   「点击外部 / Escape 关闭 + aria-expanded」由其组件行为负责，外壳不再自管 is-open） ===== */
function buildDropdown(iconName, label, buildMenu) {
  const dd = el('div', 'dropdown-menu');
  const btn = el('button', 'lx-icon-btn');
  btn.type = 'button';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', label);
  btn.appendChild(makeIcon(iconName));

  const popover = el('div', 'lx-dd-popover');
  popover.setAttribute('data-popover', '');
  popover.setAttribute('aria-hidden', 'true');
  const menu = el('div', 'lx-dd-menu');
  menu.setAttribute('role', 'menu');
  buildMenu(menu);
  popover.appendChild(menu);

  dd.append(btn, popover);
  return dd;
}

/* ===== 演示模式角标（外壳统一负责；失败仅 console 轻提示，不阻塞） ===== */
async function loadDemoBadge(badge) {
  try {
    const res = await fetch('/api/_meta');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const meta = await res.json();
    if (meta && meta.writeMode === 'simulated') badge.style.display = '';
    // writeMode 非 simulated（如 real）时保持隐藏，属预期行为
  } catch (err) {
    console.warn('layout: /api/_meta 读取失败，演示模式角标未更新：', err);
  }
}

/* ===== 页面功能开关（features） =====
 * zpm.config.yaml 的 features 节（缺省 true）经 /api/_meta 透出 { workbench, db_info, theme_studio }；
 * 显式 false 的项隐藏其全部菜单入口（带 data-feature 的节点：侧栏导航项、header
 * 数据字典按钮、帮助下拉链接）。本模块不依赖 app.js → 原生 fetch；mountLayout 可能
 * 被多次调用，故只发一次请求并缓存结果；失败或 features 缺省 → 全部显示（fail-open）。 */
let featuresCache = null; // null = 尚未拉取；{} = 拉取失败/无 features（全显示）
let featuresPromise = null;
function loadFeatures() {
  if (featuresPromise) return featuresPromise;
  featuresPromise = (async () => {
    try {
      const res = await fetch('/api/_meta');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const meta = await res.json();
      const f = meta && meta.features;
      featuresCache = f && typeof f === 'object' ? f : {};
    } catch (err) {
      console.warn('layout: /api/_meta 读取失败，页面功能开关按全开处理：', err);
      featuresCache = {};
    }
    return featuresCache;
  })();
  return featuresPromise;
}

function hideDisabledFeatures(features) {
  for (const node of document.querySelectorAll('[data-feature]')) {
    if (features[node.dataset.feature] === false) node.style.display = 'none';
  }
}

/* ===== 外壳构建 ===== */
function buildShell(options = {}) {
  const active = options.active;
  // title 覆盖：非 MENU 页（如数据字典）由页面显式传入；不传时保持 MENU 推导逻辑
  const titleOverride = typeof options.title === 'string' && options.title ? options.title : null;
  const body = document.body;
  body.classList.add('lx-body');
  // 固定外壳骨架：收掉文档级滚动，滚动条只出现在内容区 .lx-content（样式见 layout.css）
  document.documentElement.classList.add('lx-html');

  // 页面内容节点（契约：#pageContent）
  const content = document.getElementById('pageContent') || el('div');
  content.id = 'pageContent';

  /* --- 侧栏 --- */
  const sidebar = el('aside', 'lx-sidebar');
  const logo = el('div', 'lx-logo');
  const mark = el('span', 'lx-logo-mark');
  mark.appendChild(makeIcon('logo', 15));
  logo.append(mark, el('span', null, t('shell.logo', '原型开发')));

  const nav = el('nav', 'lx-nav');
  nav.setAttribute('aria-label', t('shell.navAria', '主导航'));
  for (const item of MENU) {
    const a = el('a', item.key === active ? 'is-active' : null, t('menu.' + item.key, item.label));
    a.href = item.href;
    if (item.feature) a.setAttribute('data-feature', item.feature);
    if (item.key === active) a.setAttribute('aria-current', 'page');
    a.insertBefore(makeIcon(item.icon), a.firstChild);
    nav.appendChild(a);
  }
  const foot = el('div', 'lx-sidebar-foot', t('shell.env', '原型 · 演示环境'));
  sidebar.append(logo, nav, foot);

  /* --- header --- */
  const header = el('header', 'lx-header');

  const burger = el('button', 'lx-icon-btn lx-hamburger');
  burger.type = 'button';
  burger.setAttribute('aria-label', t('shell.menuAria', '打开导航菜单'));
  burger.setAttribute('aria-expanded', 'false');
  burger.appendChild(makeIcon('menu'));

  const demoBadge = el('span', 'badge');
  demoBadge.textContent = t('shell.demoBadge', '演示模式：数据不会保存');
  demoBadge.style.display = 'none';

  const current = MENU.find((m) => m.key === active);
  const title = el('div', 'lx-title', titleOverride || (current ? t('menu.' + current.key, current.label) : t('shell.defaultTitle', '原型')));
  const spacer = el('span', 'lx-spacer');

  // 快捷搜索：回车跳 /workbench.html?q=关键词（页面可用 q 参数自行过滤）
  const search = el('input', 'lx-search');
  search.type = 'text';
  search.placeholder = t('shell.searchPlaceholder', '快捷搜索，回车跳转');
  search.setAttribute('aria-label', t('shell.searchLabel', '快捷搜索'));
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const kw = search.value.trim();
    if (!kw) return;
    window.location.href = '/workbench.html?q=' + encodeURIComponent(kw);
  });

  // 主题切换：basecoat 约定——两图标按 <html> 的 .dark 类互斥显示
  //（hidden/dark:block 等 utility 类由 layout.css 补充块提供，见该文件头注释）
  const themeBtn = el('button', 'lx-icon-btn');
  themeBtn.type = 'button';
  themeBtn.setAttribute('aria-label', t('shell.themeAria', '切换深浅色主题'));
  themeBtn.title = t('shell.themeTitle', '切换主题');
  const sunIcon = el('span', 'hidden dark:block');
  sunIcon.appendChild(makeIcon('sun'));
  const moonIcon = el('span', 'block dark:hidden');
  moonIcon.appendChild(makeIcon('moon'));
  themeBtn.append(sunIcon, moonIcon);
  themeBtn.addEventListener('click', () => {
    if (window.basecoat?.theme?.toggle) window.basecoat.theme.toggle();
    else console.warn('layout: basecoat 未加载，无法切换主题');
  });

  // 语言切换（globe 下拉，主题切换左侧）：basecoat dropdown-menu 标记（复用外壳 buildDropdown），
  // 选项式切换 localStorage.langMode（'zh-CN' 缺省 / 'en-US'，可扩展），切换后整页刷新——
  // UI 文案经 i18n.js t() 取 locales/<locale>.json；翻译列经 app.js i18nText（v1.5.0）
  const lang = getLang();
  document.documentElement.lang = lang;
  const langDd = buildDropdown('globe', t('shell.langAria', '语言'), (menu) => {
    const options = [
      { value: 'zh-CN', label: t('shell.langZh', '中文'), switched: t('shell.switchedZh', '已切换为中文') },
      { value: 'en-US', label: t('shell.langEn', 'English'), switched: t('shell.switchedEn', 'Switched to English') },
    ];
    for (const opt of options) {
      const item = el('button', 'lx-dd-item', (opt.value === lang ? '✓ ' : '') + opt.label);
      item.type = 'button';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', opt.value === lang ? 'true' : 'false');
      item.addEventListener('click', () => {
        if (opt.value === lang) return;
        try { localStorage.setItem('langMode', opt.value); } catch (_) { /* 写失败仍按内存态刷新一次 */ }
        toast(opt.switched);
        setTimeout(() => window.location.reload(), 350);
      });
      menu.appendChild(item);
    }
  });

  // 通知下拉
  const bellDd = buildDropdown('bell', t('shell.notifyAria', '通知'), (menu) => {
    const item = el('button', 'lx-dd-item is-muted', t('shell.notifyEmpty', '暂无新通知'));
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    menu.appendChild(item);
  });

  // 帮助下拉：本地页面入口（feature 与 MENU 对齐，便于功能开关统一隐藏）
  const helpDd = buildDropdown('help', t('shell.helpAria', '帮助'), (menu) => {
    const links = [
      ['/workbench.html', t('menu.workbench', '工作台'), 'workbench'],
      ['/db-info.html', t('menu.db-info', '数据字典'), 'db_info'],
    ];
    for (const [href, label, feature] of links) {
      const a = el('a', 'lx-dd-item', label);
      a.href = href;
      if (feature) a.setAttribute('data-feature', feature);
      a.setAttribute('role', 'menuitem');
      menu.appendChild(a);
    }
  });

  // 用户下拉：静态演示身份；菜单项置灰，点击轻提示「原型未实现」（菜单由 basecoat 组件点击后自动收起）
  const userDd = buildDropdown('user', t('shell.userAria', '用户菜单'), (menu) => {
    const head = el('div', 'lx-dd-header');
    head.appendChild(el('div', 'lx-dd-name', t('shell.userName', '演示用户')));
    head.appendChild(el('div', 'lx-dd-sub', t('shell.userSub', '演示身份（原型）')));
    menu.appendChild(head);
    for (const [key, zh] of [['shell.profile', '个人信息'], ['shell.settings', '设置'], ['shell.logout', '退出登录']]) {
      const item = el('button', 'lx-dd-item is-disabled', t(key, zh));
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.addEventListener('click', () => toast(t('shell.notImplemented', '原型未实现')));
      menu.appendChild(item);
    }
  });

  header.append(burger, demoBadge, title, spacer, search, langDd, themeBtn, bellDd, helpDd, userDd);

  // 数据字典入口：图标按钮样式的链接，置于快捷搜索左侧（已存在则跳过）
  const dbBtn = el('a', 'lx-icon-btn');
  dbBtn.href = '/db-info.html';
  dbBtn.title = t('menu.db-info', '数据字典');
  dbBtn.setAttribute('aria-label', t('menu.db-info', '数据字典'));
  dbBtn.setAttribute('data-lx-dbinfo', '');
  dbBtn.setAttribute('data-feature', 'db_info');
  dbBtn.appendChild(makeIcon('database'));
  if (!header.querySelector('[data-lx-dbinfo]')) {
    header.insertBefore(dbBtn, search);
  }

  /* --- 组装 --- */
  const wrap = el('div', 'lx-main-wrap');
  const main = el('main', 'lx-content');
  main.appendChild(content); // 移动（非克隆），页面监听器与引用全部保留
  wrap.append(header, main);

  const overlay = el('div', 'lx-overlay');
  shell.toastEl = el('div', 'lx-toast');
  shell.toastEl.setAttribute('role', 'status');

  body.prepend(sidebar);
  body.append(wrap, overlay, shell.toastEl);

  /* --- 窄屏抽屉 --- */
  const setDrawer = (open) => {
    shell.drawerOpen = open;
    sidebar.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  burger.addEventListener('click', () => setDrawer(!shell.drawerOpen));
  overlay.addEventListener('click', () => setDrawer(false));

  /* --- 全局关闭：Escape 收起抽屉（下拉的点击外部 / Escape 关闭由 basecoat 组件负责） --- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shell.drawerOpen) setDrawer(false);
  });

  loadDemoBadge(demoBadge);
  // 功能开关：拉取（首次）后隐藏被关闭的菜单入口；失败/缺省 fail-open 全显示
  loadFeatures().then(hideDisabledFeatures);

  // 外壳为动态构建，含 dropdown-menu 等 basecoat 组件，构建完成后（重新）初始化
  if (window.basecoat?.initAll) window.basecoat.initAll();
}

export function mountLayout(options = {}) {
  // locale 先行：外壳文案走 t()（ensureI18n 幂等；locale 加载失败 fail-open 退回调用点中文缺省）
  const run = () => ensureI18n().then(() => buildShell(options));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}
