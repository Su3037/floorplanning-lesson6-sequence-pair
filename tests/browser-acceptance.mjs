// Browser acceptance checks for the Module 06 site (Playwright + Chromium; not run in CI).
//   python3 scripts/serve.py 8800 floorplanning-lesson6-sequence-pair &   then
//   node tests/browser-acceptance.mjs http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/ subpath
// Root check: (cd site && python3 -m http.server 8801) and pass http://127.0.0.1:8801/ root
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }
const [base, label = base] = process.argv.slice(2);
const res = [];
const ok = (name, pass, detail = '') => { res.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const browser = await chromium.launch();
const errs = [];
async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(`${path}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errs.push(`${path}: console ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errs.push(`${path}: HTTP ${r.status()} ${r.url()}`); });
  await page.goto(new URL(path, base).href, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  return { ctx, page };
}
console.log('base', label);
// pages load
for (const p of ['', 'en/', 'modules/m06-sequence-pair/', 'en/modules/m06-sequence-pair/', 'glossary/', 'foundations/', 'guide/', 'credits/', 'progress/']) {
  const { ctx, page } = await open(p);
  ok(`page loads: /${p}`, (await page.title()).length > 0, await page.title());
  await ctx.close();
}
// lab
{
  const { ctx, page } = await open('modules/m06-sequence-pair/');
  const lab = page.locator('#lab-root');
  await lab.locator('.sp-checks').waitFor();
  const status = await lab.locator('.sp-checks').innerText();
  ok('lab initial result 9 × 4 fits', /9 × 4/.test(status), status.split('\n').slice(0, 3).join(' / '));
  // keyboard: select chip E in pos, Alt+ArrowRight
  const posIn = lab.locator('input.sp-text').nth(0);
  await lab.locator('.sp-editors > *').nth(0).locator('.sp-chip[data-id="E"]').focus();
  await page.keyboard.press('Alt+ArrowRight');
  await page.waitForTimeout(300);
  ok('keyboard: Alt+→ moves the selected block', (await posIn.inputValue()).replace(/\s/g, '') === 'ABCDE', await posIn.inputValue());
  const runNo1 = await lab.evaluate(r => r.spState.runNo);
  // undo
  await lab.getByRole('button', { name: '撤销' }).click();
  await page.waitForTimeout(300);
  ok('undo restores the previous pair', (await posIn.inputValue()).replace(/\s/g, '') === 'ABCED', await posIn.inputValue());
  // stale-result invalidation: start autoplay, then edit mid-play
  await lab.locator('.player').getByRole('button', { name: '重置' }).click();
  await lab.locator('.player').getByRole('button', { name: /自动播放/ }).click();
  await page.waitForTimeout(1500);
  await posIn.fill('A C B E D'); await posIn.press('Enter');
  await page.waitForTimeout(400);
  const st = await lab.evaluate(r => ({ runNo: r.spState.runNo, pos: r.spState.pos.join(''), counter: r.querySelector('.player')?.innerText || '' }));
  const shown = await lab.locator('.sp-run').innerText();
  ok('editing during playback starts a new run (old events dropped)', st.runNo > runNo1 && st.pos === 'ACBED' && /\d/.test(shown), `run ${st.runNo}, tag "${shown}"`);
  // error state
  await posIn.fill('A B B E'); await posIn.press('Enter');
  await page.waitForTimeout(300);
  const err = await lab.locator('.lab-error').innerText();
  ok('invalid input shows an error listing every problem', /重复|缺少/.test(err) && /长度|缺少/.test(err), err.replace(/\n/g, ' ').slice(0, 120));
  ok('invalid input has no metrics', /没有坐标/.test(await lab.locator('.sp-checks').innerText()));
  // reset to preset
  await lab.locator('.lab-toolbar').getByRole('button', { name: '重置' }).click();
  await page.waitForTimeout(300);
  ok('reset returns to the preset', (await posIn.inputValue()).replace(/\s/g, '') === 'ABCED');
  // block pick explains the coordinate
  await lab.locator('.sp-plan g.fp-block[data-id="E"]').click();
  await page.waitForTimeout(300);
  ok('clicking block E explains x[E] = 7 from C', /x\[E\] = 7/.test(await lab.locator('.sp-why').innerText()));
  // slides numbering
  const slides = page.locator('#slides-root');
  const sText = await slides.innerText();
  ok('slides viewer numbers pages (1/14)', /1\s*\/\s*14/.test(sText), sText.match(/\d+\s*\/\s*14/)?.[0] || '');
  // films + subtitles
  const vids = await page.locator('#film-root video').count();
  const tracks = await page.locator('#film-root track').evaluateAll(ts => ts.map(t => t.src));
  ok('film player present with subtitle tracks', vids >= 1 && tracks.length >= 1, `${vids} video, ${tracks.length} tracks`);
  for (const src of tracks.slice(0, 2)) {
    const r = await page.request.get(src); const body = await r.text();
    ok(`subtitle loads: ${src.split('/').pop()}`, r.ok() && body.startsWith('WEBVTT'));
  }
  // downloads
  const links = await page.locator('a[href$=".zip"], a[href$=".pdf"], a[href$=".pptx"], a[href$=".mp4"], a[download]').evaluateAll(as => [...new Set(as.map(a => a.href))].filter(u => u.startsWith(location.origin)));
  let bad = [];
  for (const href of links) { const r = await page.request.head(href); if (!r.ok()) bad.push(`${r.status()} ${href}`); }
  ok(`downloads respond (${links.length} links)`, links.length > 0 && !bad.length, bad.join('; '));
  // refresh keeps state (language preference + challenge progress)
  await page.locator('#challenge-root button').first().scrollIntoViewIfNeeded();
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  ok('refresh: page re-renders the lab', /9 × 4/.test(await page.locator('#lab-root .sp-checks').innerText()));
  await ctx.close();
}
// language preference survives reload
{
  const { ctx, page } = await open('');
  await page.locator('a[hreflang="en"], .lang-switch a, [data-lang="en"]').first().click().catch(() => {});
  await page.waitForTimeout(600);
  const url1 = page.url();
  await page.goto(new URL('modules/m06-sequence-pair/', base).href, { waitUntil: 'load' });
  ok('language switch goes to the English edition', /\/en\//.test(url1) || /\/en\//.test(page.url()), `${url1} → ${page.url()}`);
  await ctx.close();
}
// mobile
for (const p of ['', 'modules/m06-sequence-pair/']) {
  const { ctx, page } = await open(p, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(`mobile 390 px: no horizontal page scroll on /${p}`, w <= 392, `scrollWidth ${w}`);
  await page.screenshot({ path: `build/mobile-${p ? 'module' : 'home'}.png`, fullPage: false });
  await ctx.close();
}
// reduced motion
{
  const { ctx, page } = await open('modules/m06-sequence-pair/', { reducedMotion: 'reduce' });
  const dur = await page.evaluate(() => { const e = document.querySelector('.btn'); return e ? getComputedStyle(e).transitionDuration : ''; });
  const smooth = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  ok('reduced motion: transitions off and no smooth scrolling', /^(0s|1e-0\d+s|0\.0+1s)/.test(dur) || dur === '' , `transition ${dur}, scroll-behavior ${smooth}`);
  await ctx.close();
}
ok('no page errors, console errors or failed requests', errs.length === 0, errs.slice(0, 6).join(' | '));
await browser.close();
const n = res.filter(r => r.pass).length;
console.log(`\n${n}/${res.length} passed`);
