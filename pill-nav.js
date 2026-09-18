/* ============================================================
 * PillNav 顶部导航条（原生复刻 React Bits PillNav，头部布局版）
 * 布局对标 React Bits 文档站头部：左 logo + 品牌名，右导航链接 + CTA
 * 复刻方式：零依赖原生 JS + CSS transition，动效 1:1 等价
 *   - 悬停时圆底光斑从胶囊底部放大（几何算法照搬原版 layout()）
 *   - 双层文字上滑换色（label 上移出、hover 层从下入）
 *   - 活动项底部小圆点、入场宽度展开、logo 悬停旋转、移动端汉堡菜单
 * 站点适配：容器背景透明（--base:transparent）、绿黑白配色、文案英文
 * 用法：在页尾引入前声明 window.__PILLNAV__ = { ... } 覆盖默认参数
 * ============================================================ */
(function () {
  'use strict';

  if (window.__pillnavInstance) { try { window.__pillnavInstance.destroy(); } catch (e) {} }

  var CFG = window.__PILLNAV__ || {};

  var DEFAULTS = {
    /* 导航项：[英文文案, 锚点] */
    items: [
      ['About', '#about'],
      ['Social Data', '#domestic'],
      ['Videos', '#works'],
      ['Web Design', '#web'],
      ['Visual Design', '#visual'],
      ['Exhibitions', '#expo']
    ],
    cta: ['Contact', '#contact'],   /* 右侧实心按钮（对标截图中的「注册」） */
    mobileItems: [                  /* 移动端弹层：全量章节（英文） */
      ['Home', '#cover'], ['About', '#about'], ['Contents', '#toc'],
      ['Social CN', '#domestic'], ['Social Global', '#overseas'], ['Videos', '#works'],
      ['Web Design', '#web'], ['Xiaohongshu', '#xhsB'], ['WeChat', '#wxSelf'],
      ['Visual Design', '#visual'], ['Exhibitions', '#expo'], ['Fans', '#fans'],
      ['Contact', '#contact']
    ],
    logoText: 'MZ',           /* 左侧圆形 logo 文字 */
    brandText: 'MENG ZHEN',   /* logo 右侧品牌名（英文） */
    top: 16,                  /* 距视口顶部距离 px */
    zIndex: 150,
    /* 配色（站点绿黑白） */
    green: '#3dff8f',
    greenDim: 'rgba(61,255,143,.10)',
    greenBorder: 'rgba(61,255,143,.30)',
    dark: '#04150c',
    textColor: '#e9fff2',
    mobileBreakpoint: 820    /* 与站点 #nav 的隐藏断点一致 */
  };

  function opt(key) {
    var v = CFG[key];
    return v === undefined ? DEFAULTS[key] : v;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CSS（结构类名带 pnav- 前缀，避免与站点冲突） ---------- */
  var CSS = [
    '/* 顶部导航替换站点旧 topbar（品牌名并入导航左侧） */',
    '#topbar{display:none}',
    '.pnav-wrap{position:fixed;left:50%;top:' + opt('top') + 'px;transform:translateX(-50%);',
    '  width:min(1160px,94vw);z-index:' + opt('zIndex') + ';user-select:none}',
    '',
    '.pnav{--nav-h:42px;--pill-pad-x:16px;--pill-gap:3px;',
    '  display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;width:100%}',
    '',
    '/* 左侧：logo + 品牌名 */',
    '.pnav-left{display:flex;align-items:center;gap:10px;min-width:0}',
    '.pnav-brand{font-family:Georgia,serif;font-weight:700;font-size:15px;letter-spacing:.22em;',
    '  color:' + opt('textColor') + ';text-decoration:none;white-space:nowrap;cursor:pointer}',
    '',
    '/* 右侧：透明底胶囊组 + CTA */',
    '.pnav-right{display:flex;align-items:center;gap:10px}',
    '.pnav-items{position:relative;display:flex;align-items:center;height:var(--nav-h);',
    '  background:transparent;border-radius:9999px;overflow:hidden}',
    '',
    '.pnav-logo{width:var(--nav-h);height:var(--nav-h);border-radius:50%;',
    '  background:' + opt('greenDim') + ';border:1px solid ' + opt('greenBorder') + ';',
    '  color:' + opt('green') + ';display:inline-flex;align-items:center;justify-content:center;',
    '  font-family:Georgia,serif;font-weight:700;font-size:13px;letter-spacing:.08em;',
    '  text-decoration:none;cursor:pointer;overflow:hidden;flex:none;',
    '  transform:scale(0);transition:transform .6s cubic-bezier(.22,1,.36,1)}',
    '.pnav-logo svg,.pnav-logo span{display:block;transition:transform .2s cubic-bezier(.22,1,.36,1)}',
    '.pnav-logo:hover svg,.pnav-logo:hover span{transform:rotate(360deg)}',
    '.pnav-logo.pnav-in{transform:scale(1)}',
    '',
    '.pnav-list{list-style:none;display:flex;align-items:stretch;gap:var(--pill-gap);',
    '  margin:0;padding:3px;height:100%}',
    '.pnav-list>li{display:flex;height:100%}',
    '',
    '.pnav-pill{display:inline-flex;align-items:center;justify-content:center;height:100%;',
    '  padding:0 var(--pill-pad-x);background:' + opt('greenDim') + ';',
    '  color:' + opt('textColor') + ';text-decoration:none;border-radius:9999px;',
    '  box-sizing:border-box;font-weight:600;font-size:13px;line-height:1;',
    '  letter-spacing:.06em;white-space:nowrap;cursor:pointer;position:relative;overflow:hidden;',
    '  border:1px solid ' + opt('greenBorder') + ';backdrop-filter:blur(6px)}',
    '',
    '/* 圆底光斑：从胶囊底部圆心放大，几何参数由 JS 按胶囊宽高计算（照搬原版算法） */',
    '.pnav-circle{position:absolute;left:50%;bottom:0;border-radius:50%;',
    '  background:' + opt('green') + ';z-index:1;display:block;pointer-events:none;',
    '  transform:translateX(-50%) scale(0);will-change:transform;',
    '  transition:transform .32s cubic-bezier(.215,.61,.355,1)}',
    '.pnav-pill:hover .pnav-circle,.pnav-pill:focus-visible .pnav-circle{transform:translateX(-50%) scale(1.2)}',
    '',
    '.pnav-stack{position:relative;display:inline-block;line-height:1;z-index:2}',
    '.pnav-label{position:relative;z-index:2;display:inline-block;line-height:1;will-change:transform;',
    '  transition:transform .3s cubic-bezier(.215,.61,.355,1)}',
    '.pnav-pill:hover .pnav-label,.pnav-pill:focus-visible .pnav-label{',
    '  transform:translateY(calc(-1*(var(--ph,42px) + 8px)))}',
    '.pnav-label2{position:absolute;left:0;top:0;color:' + opt('dark') + ';z-index:3;',
    '  display:inline-block;will-change:transform,opacity;',
    '  transform:translateY(calc(var(--ph,42px) + 12px));opacity:0;',
    '  transition:transform .32s cubic-bezier(.215,.61,.355,1),opacity .32s cubic-bezier(.215,.61,.355,1)}',
    '.pnav-pill:hover .pnav-label2,.pnav-pill:focus-visible .pnav-label2{transform:translateY(0);opacity:1}',
    '',
    '/* CTA 实心按钮（对标截图中的「注册」） */',
    '.pnav-cta{display:inline-flex;align-items:center;height:var(--nav-h);padding:0 22px;',
    '  background:' + opt('green') + ';color:' + opt('dark') + ';text-decoration:none;',
    '  border-radius:9999px;font-weight:700;font-size:13px;letter-spacing:.06em;',
    '  white-space:nowrap;cursor:pointer;box-shadow:0 0 18px rgba(61,255,143,.35);',
    '  transition:transform .25s cubic-bezier(.215,.61,.355,1),box-shadow .25s ease}',
    '.pnav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 24px rgba(61,255,143,.5)}',
    '',
    '/* 当前屏指示：胶囊下方小圆点（发光绿） */',
    '.pnav-pill.is-active::after{content:"";position:absolute;bottom:-6px;left:50%;',
    '  transform:translateX(-50%);width:10px;height:10px;background:' + opt('green') + ';',
    '  border-radius:50px;z-index:4;box-shadow:0 0 10px rgba(61,255,143,.8)}',
    '',
    '/* 移动端：胶囊列表隐藏，汉堡按钮出现（与站点断点一致） */',
    '.pnav-burger{width:var(--nav-h);height:var(--nav-h);border-radius:50%;',
    '  background:' + opt('greenDim') + ';border:1px solid ' + opt('greenBorder') + ';',
    '  backdrop-filter:blur(6px);border:none;display:none;flex-direction:column;',
    '  align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:0;position:relative;flex:none}',
    '.pnav-burger .burger-line{width:16px;height:2px;background:' + opt('green') + ';',
    '  border-radius:1px;transition:all .3s cubic-bezier(.215,.61,.355,1);transform-origin:center}',
    '.pnav-burger.open .burger-line:nth-child(1){transform:translateY(3px) rotate(45deg)}',
    '.pnav-burger.open .burger-line:nth-child(2){transform:translateY(-3px) rotate(-45deg)}',
    '',
    '.pnav-pop{position:fixed;top:' + (opt('top') + 54) + 'px;left:50%;',
    '  width:max-content;min-width:200px;max-width:86vw;background:rgba(8,10,9,.92);',
    '  border:1px solid ' + opt('greenBorder') + ';',
    '  border-radius:22px;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:998;',
    '  opacity:0;visibility:hidden;transform:translateX(-50%) translateY(-8px);',
    '  transition:opacity .25s ease,transform .25s ease,visibility .25s;',
    '  max-height:72vh;overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '.pnav-pop.show{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}',
    '.pnav-pop ul{list-style:none;margin:0;padding:6px;display:flex;flex-direction:column;gap:2px}',
    '.pnav-pop a{display:block;padding:10px 16px;color:' + opt('textColor') + ';',
    '  background-color:transparent;text-decoration:none;font-size:14px;font-weight:500;',
    '  border-radius:50px;transition:background-color .2s ease,color .2s ease}',
    '.pnav-pop a:hover,.pnav-pop a.is-active{cursor:pointer;background-color:' + opt('green') + ';color:' + opt('dark') + '}',
    '',
    '@media (max-width:' + opt('mobileBreakpoint') + 'px){',
    '  .pnav-items,.pnav-cta,.pnav-brand{display:none}',
    '  .pnav-burger{display:flex}',
    '  .pnav{justify-content:flex-end}',
    '  .pnav-left{position:absolute;left:0}',
    '}',
    '@media (min-width:' + (opt('mobileBreakpoint') + 1) + 'px){',
    '  .pnav-pop{display:none}',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-pillnav', '');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- DOM ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'pnav-wrap';

  var navHtml = ['<nav class="pnav" aria-label="Main navigation">'];
  navHtml.push('<div class="pnav-left">');
  navHtml.push('<a class="pnav-logo" href="#cover" aria-label="Back to top"><span>' + opt('logoText') + '</span></a>');
  navHtml.push('<a class="pnav-brand" href="#cover">' + opt('brandText') + '</a>');
  navHtml.push('</div>');
  navHtml.push('<div class="pnav-right">');
  navHtml.push('<div class="pnav-items"><ul class="pnav-list" role="menubar">');
  opt('items').forEach(function (it) {
    navHtml.push('<li role="none"><a class="pnav-pill" role="menuitem" href="' + it[1] + '">');
    navHtml.push('<span class="pnav-circle" aria-hidden="true"></span>');
    navHtml.push('<span class="pnav-stack"><span class="pnav-label">' + it[0] + '</span>');
    navHtml.push('<span class="pnav-label2" aria-hidden="true">' + it[0] + '</span></span></a></li>');
  });
  navHtml.push('</ul></div>');
  if (opt('cta') && opt('cta')[0]) {
    navHtml.push('<a class="pnav-cta" href="' + opt('cta')[1] + '">' + opt('cta')[0] + '</a>');
  }
  navHtml.push('<button class="pnav-burger" aria-label="Open menu"><span class="burger-line"></span><span class="burger-line"></span></button>');
  navHtml.push('</div>');
  navHtml.push('</nav>');

  var popHtml = ['<div class="pnav-pop" role="menu"><ul>'];
  opt('mobileItems').forEach(function (it) {
    popHtml.push('<li><a href="' + it[1] + '">' + it[0] + '</a></li>');
  });
  popHtml.push('</ul></div>');

  wrap.innerHTML = navHtml.join('') + popHtml;
  document.body.appendChild(wrap);

  var itemsEl = wrap.querySelector('.pnav-items');
  var logoEl = wrap.querySelector('.pnav-logo');
  var burgerEl = wrap.querySelector('.pnav-burger');
  var popEl = wrap.querySelector('.pnav-pop');
  var pills = [].slice.call(wrap.querySelectorAll('.pnav-pill'));

  /* ---------- 圆底光斑几何（照搬原版 layout()） ---------- */
  function layout() {
    pills.forEach(function (pill) {
      var circle = pill.querySelector('.pnav-circle');
      var rect = pill.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      if (w < 1) return;
      var R = ((w * w) / 4 + h * h) / (2 * h);
      var D = Math.ceil(2 * R) + 2;
      var delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      var originY = D - delta;
      circle.style.width = D + 'px';
      circle.style.height = D + 'px';
      circle.style.bottom = (-delta) + 'px';
      circle.style.transformOrigin = '50% ' + originY + 'px';
      pill.style.setProperty('--ph', h + 'px');
    });
  }

  /* ---------- 入场动画：items 宽度展开 + logo 缩放（等价原版 initialLoadAnimation） ---------- */
  function intro() {
    if (reduceMotion) { logoEl.classList.add('pnav-in'); return; }
    var natural = itemsEl.scrollWidth;
    itemsEl.style.width = '0px';
    itemsEl.style.transition = 'none';
    /* 下一帧再放开过渡，避免被浏览器合并 */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        itemsEl.style.transition = 'width .6s cubic-bezier(.22,1,.36,1)';
        itemsEl.style.width = natural + 'px';
        logoEl.classList.add('pnav-in');
        setTimeout(function () {
          itemsEl.style.width = '';
          itemsEl.style.transition = '';
        }, 700);
      });
    });
  }

  /* ---------- 滚动侦测：高亮当前屏 ---------- */
  var targets = pills.map(function (p) { return document.querySelector(p.getAttribute('href')); });

  function syncActive() {
    var probe = window.innerHeight * 0.5;
    var cur = -1;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].getBoundingClientRect().top <= probe) cur = i;
    }
    pills.forEach(function (p, i) { p.classList.toggle('is-active', cur > -1 && i === cur); });
    var popLinks = popEl.querySelectorAll('a');
    popLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      var idx = -1;
      for (var i = 0; i < pills.length; i++) if (pills[i].getAttribute('href') === href) idx = i;
      a.classList.toggle('is-active', idx > -1 && idx === cur);
    });
  }

  /* ---------- 移动端汉堡菜单 ---------- */
  function togglePop(force) {
    var open = force !== undefined ? force : !popEl.classList.contains('show');
    popEl.classList.toggle('show', open);
    burgerEl.classList.toggle('open', open);
  }
  burgerEl.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
  popEl.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') togglePop(false);
  });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) togglePop(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') togglePop(false); });

  /* ---------- 事件 ---------- */
  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 80);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', syncActive, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { layout(); }).catch(function () {});
  }

  /* ---------- 启动 ---------- */
  layout();
  intro();
  syncActive();

  window.__pillnavInstance = {
    get running() { return document.body.contains(wrap); },
    layout: layout,
    syncActive: syncActive,
    destroy: function () {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', syncActive);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    }
  };
})();
