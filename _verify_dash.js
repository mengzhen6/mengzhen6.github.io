const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox','--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  const logs = [];
  p.on('console', m => { if (m.type() === 'error') logs.push('console: ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  p.on('requestfailed', r => { if (!r.url().includes('favicon')) logs.push('reqfail: ' + r.url()); });
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1200);
  await p.evaluate(() => document.querySelector('#dashB').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await sleep(2600);                                  // 等数字滚动与柱条动画播完
  const data = await p.evaluate(() => {
    const t = s => (document.querySelector(s) || {}).textContent || '(missing)';
    return {
      kpi: [t('#dPlay'), t('#dAvg'), t('#dLike'), t('#dY26')],
      best_gone: !document.getElementById('dBest'),
      eng: t('#dEng'),
      top6: [...document.querySelectorAll('#dRank .r')].map(r => ({
        val: r.querySelector('.val').textContent,
        date: r.querySelector('.bar span').textContent,
        fill: r.querySelector('.bar i').style.transform
      })),
      years: [...document.querySelectorAll('#dYears .y')].map(y => ({
        yr: y.querySelector('.yr').textContent, v: y.querySelector('.v').textContent,
        h: y.querySelector('.bar').style.height
      })),
      note: t('.dash .note').slice(0, 80)
    };
  });
  console.log('KPI ' + JSON.stringify(data.kpi) + ' | dBest removed: ' + data.best_gone + ' | eng ' + data.eng);
  console.log('TOP6 ' + JSON.stringify(data.top6, null, 0));
  console.log('YEARS ' + JSON.stringify(data.years, null, 0));
  console.log('NOTE ' + data.note);
  await p.screenshot({ path: '_dash.png' });
  const box = await (await p.$('#dashB')).boundingBox();
  await p.screenshot({ path: '_dash_full.png', clip: { x: 0, y: Math.max(0, box.y - 60), width: 1440, height: Math.min(900, box.height + 120) } }).catch(async () => {
    await p.screenshot({ path: '_dash_full.png' });
  });
  console.log('ERRORS ' + JSON.stringify(logs));
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
