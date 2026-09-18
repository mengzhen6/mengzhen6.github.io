/* 目录页改造验证：文字已删 / 滑动变绿 / 形态不变 / 无报错 */
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:8123/';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new', executablePath: CHROME,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', m => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
  page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => { if (!r.url().includes('favicon')) logs.push('reqfail: ' + r.url()); });

  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2000);

  const tocInfo = await page.evaluate(() => {
    const sec = document.querySelector('#toc');
    sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    return {
      headGone: !sec.querySelector('.head'),
      h2Gone: !sec.querySelector('h2'),
      textGone: !sec.textContent.includes('每一页') && !sec.textContent.includes('一页一主题'),
      cards: sec.querySelectorAll('.dcard').length,
      sideBar: !!sec.querySelector('.dside')
    };
  });
  console.log('TOC ' + JSON.stringify(tocInfo));
  await sleep(1200);

  /* 形态基准：卡片 3 未悬停时的几何 */
  const base3 = await page.evaluate(() => {
    const c = document.querySelectorAll('#toc .dcard')[2];
    const r = c.getBoundingClientRect();
    const zh = c.querySelector('.dzh');
    return { w: r.width, h: r.height, ws: getComputedStyle(zh).whiteSpace,
             bg: getComputedStyle(c).backgroundImage.slice(0, 30) };
  });
  console.log('BEFORE ' + JSON.stringify(base3));

  /* 滑动到卡片 3：应变绿，且宽高不变 */
  const card3 = (await page.$$('#toc .dcard'))[2];
  const box = await card3.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(700);
  const on3 = await page.evaluate(() => {
    const c = document.querySelectorAll('#toc .dcard')[2];
    const r = c.getBoundingClientRect();
    const zh = c.querySelector('.dzh');
    const st = getComputedStyle(c);
    return { isOn: c.classList.contains('is-on'), w: r.width, h: r.height,
             ws: getComputedStyle(zh).whiteSpace,
             bgGreen: st.backgroundImage.includes('82, 255') || st.backgroundImage.includes('82,255'),
             zhDark: getComputedStyle(zh).color };
  });
  console.log('HOVER3 ' + JSON.stringify(on3));
  console.log('SIZE_UNCHANGED ' + (Math.abs(on3.w - base3.w) < 2 && Math.abs(on3.h - base3.h) < 2));
  await page.screenshot({ path: '_toc_hover.png' });

  /* 滑到卡片 7：绿色应转移 */
  const card7 = (await page.$$('#toc .dcard'))[6];
  const b7 = await card7.boundingBox();
  await page.mouse.move(b7.x + b7.width / 2, b7.y + b7.height / 2);
  await sleep(700);
  const moved = await page.evaluate(() => ({
    c3: document.querySelectorAll('#toc .dcard')[2].classList.contains('is-on'),
    c7: document.querySelectorAll('#toc .dcard')[6].classList.contains('is-on')
  }));
  console.log('MOVED ' + JSON.stringify(moved));
  await page.screenshot({ path: '_toc_hover7.png' });

  /* 鼠标移开 → 悬停绿消失（is-on 保留在最后一块） */
  await page.mouse.move(60, 60);
  await sleep(600);
  const after = await page.evaluate(() => {
    const c7 = document.querySelectorAll('#toc .dcard')[6];
    return { c7on: c7.classList.contains('is-on'), hoverBg: getComputedStyle(c7).backgroundImage.includes('52,255') };
  });
  console.log('AFTER_LEAVE ' + JSON.stringify(after));

  /* 点击卡片 1：锚点跳转正常 + 该块变绿 + 无翻页动画残留 */
  const card1 = (await page.$$('#toc .dcard'))[0];
  await card1.click();
  await sleep(900);
  const clickRes = await page.evaluate(() => ({
    hash: location.hash,
    c1on: document.querySelectorAll('#toc .dcard')[0].classList.contains('is-on'),
    unfoldAnim: [...document.querySelectorAll('#toc .dcols')].some(el => getComputedStyle(el).animationName !== 'none'),
    scrollY: Math.round(window.scrollY)
  }));
  console.log('CLICK1 ' + JSON.stringify(clickRes));
  console.log('LOGS ' + JSON.stringify(logs));

  /* 移动端 */
  const m = await browser.newPage();
  await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const mlogs = [];
  m.on('pageerror', e => mlogs.push('pageerror: ' + e.message));
  await m.goto(BASE + 'index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1800);
  await m.evaluate(() => document.querySelector('#toc').scrollIntoView({ behavior: 'instant' }));
  await sleep(900);
  await m.evaluate(() => document.querySelectorAll('#toc .dcard')[4].click());
  await sleep(600);
  console.log('MOBILE ' + JSON.stringify(await m.evaluate(() => ({
    textGone: !document.querySelector('#toc').textContent.includes('每一页'),
    c4on: document.querySelectorAll('#toc .dcard')[4].classList.contains('is-on')
  }))));
  await m.screenshot({ path: '_toc_mobile.png' });
  console.log('LOGS_M ' + JSON.stringify(mlogs));

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL ' + e.message); process.exit(1); });
