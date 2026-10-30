// Static checks of the built site: scope, naming, links, media, slides, crosswalk, licences and the Pages subpath.
// Run after `scripts/build.sh` (and after rendering media/slides).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = path.join(ROOT, 'site');
const read = p => fs.readFileSync(path.join(SITE, p), 'utf8');
const exists = p => fs.existsSync(path.join(SITE, p));
const course = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/course.json'), 'utf8'));
const IDS = course.modules;

// GitHub Pages is case-sensitive while macOS usually is not: compare every path segment exactly.
function existsExact(p) {
  const rel = path.relative(SITE, p);
  if (rel.startsWith('..')) return fs.existsSync(p);
  let cur = SITE;
  for (const seg of rel.split(path.sep).filter(Boolean)) {
    if (!fs.existsSync(cur) || !fs.statSync(cur).isDirectory() || !fs.readdirSync(cur).includes(seg)) return false;
    cur = path.join(cur, seg);
  }
  return true;
}

function htmlFiles(dir = SITE, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) htmlFiles(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

test('every relative link and asset in the built pages resolves', () => {
  const bad = [];
  for (const f of htmlFiles()) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="([^"#:]+)(#[^"]*)?"/g)) {
      const url = m[1];
      if (!url || url.startsWith('data:') || url.startsWith('/')) continue;
      const target = path.resolve(path.dirname(f), url);
      if (!existsExact(target)) bad.push(`${path.relative(SITE, f)} → ${url}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('no external CDN or font service; no absolute root paths in pages', () => {
  for (const f of htmlFiles()) {
    const html = fs.readFileSync(f, 'utf8');
    const assets = [...html.matchAll(/<(?:script|link|img|video|source|track|iframe)\b[^>]*(?:src|href)="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(assets.filter(u => /^(https?:)?\/\//.test(u)), [], `external asset in ${path.relative(SITE, f)}`);
    if (!f.endsWith('404.html')) assert.ok(!/(href|src)="\/(?!\/)/.test(html), `root-absolute path in ${path.relative(SITE, f)}`);
  }
});

test('GitHub Pages: CSS url() targets exist with exact case; bundled font and its licence ship with the site', () => {
  const css = read('assets/course.css');
  const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]).filter(u => !u.startsWith('data:'));
  assert.ok(urls.length >= 2);
  for (const u of urls) assert.ok(existsExact(path.resolve(SITE, 'assets', u)), `css url ${u}`);
  assert.ok(/Noto Sans SC Course/.test(css.match(/--sans:[^;]+/)[0]));
  assert.ok(/Noto Serif SC Course/.test(css.match(/--display:[^;]+/)[0]));
  for (const face of ['noto-sans-sc', 'noto-serif-sc', 'newsreader', 'jetbrains-mono']) {
    const ofl = read(`assets/fonts/OFL-${face}.txt`);
    assert.ok(ofl.includes('SIL OPEN FONT LICENSE') && /Copyright/.test(ofl), face);
    assert.ok(!/Reserved Font Name/i.test(ofl.split('---')[0]), `${face}: subsetting is only allowed without a Reserved Font Name`);
  }
});

test('font subset covers the Chinese text of every page (the rest falls back to system fonts)', () => {
  const cov = JSON.parse(read('assets/fonts/coverage.json'));
  const kept = new Set(cov.kept), fallback = new Set(cov.fallback);
  const missing = new Set();
  for (const f of htmlFiles()) for (const ch of fs.readFileSync(f, 'utf8')) if (ch.codePointAt(0) > 0x7f && !kept.has(ch) && !fallback.has(ch) && /\S/.test(ch)) missing.add(ch);
  assert.deepEqual([...missing], [], 'run scripts/build-fonts.py after changing content');
  assert.ok([...'序列对布图规划约束最长路径'].every(c => kept.has(c)));
});

test('GitHub Pages: no Jekyll processing, and every module page is reachable from the home page', () => {
  assert.ok(exists('.nojekyll'));
  const home = read('index.html');
  for (const id of IDS) assert.ok(home.includes(`modules/${id}/index.html`) || home.includes(`modules/${id}/`), id);
});

test('inline module imports use relative or absolute specifiers', () => {
  for (const f of htmlFiles()) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/\bimport\b[^'"]*?from\s*['"]([^'"]+)['"]/g))
      assert.ok(/^(\.{1,2}\/|\/|https?:)/.test(m[1]), `bare module specifier "${m[1]}" in ${path.relative(SITE, f)}`);
  }
});

const ID = 'm06-sequence-pair';
const page = () => read(`modules/${ID}/index.html`);

test('scope: one lesson, Module 06 Sequence-Pair, mapped to the instructor ids without mixing them', () => {
  assert.deepEqual(IDS, [ID]);
  const html = page(), m = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/modules', ID, 'module.json'), 'utf8'));
  assert.equal(m.upstreamId, 'module02-05-sequence-pair'); assert.equal(m.labId, 'sequence-pair'); assert.equal(m.display, 'Module 06');
  assert.ok(html.includes('module02-05-sequence-pair') && html.includes('issues/22'));
  assert.ok(!/Module 02-05|Module 02·05/.test(html), 'the hierarchical id is metadata, never the displayed module number');
});

test('module page: sections, problem statement, pseudocode, terms, mistakes, quiz', () => {
  const html = page();
  for (const s of ['goals', 'film', 'lesson', 'slides', 'lab', 'challenges', 'quiz', 'python', 'mistakes', 'sources']) assert.ok(html.includes(`id="${s}"`), `section ${s}`);
  for (const k of ['输入', '输出', '目标', '约束', '假设', '停止']) assert.ok(html.includes(`<b>${k}`), `problem field ${k}`);
  assert.ok(html.includes('class="pseudo"'), 'pseudocode with line notes');
  assert.ok((html.match(/class="term"/g) || []).length >= 6, 'terms introduced');
  assert.ok((html.match(/class="mistake"/g) || []).length >= 4, 'common mistakes');
  assert.equal((html.match(/class="quiz-item"/g) || []).length, 6, 'six concept checks');
  for (const sec of ['m06-problem', 'm06-rule', 'm06-graphs', 'm06-dp', 'm06-metrics', 'm06-encoding', 'm06-pseudocode', 'm06-limits']) assert.ok(html.includes(`id="${sec}"`), sec);
  assert.ok(exists(`downloads/${ID}-python.zip`) && exists(`downloads/${ID}-outline.md`) && exists('downloads/sequence-pair-fixtures.json'));
});

test('taught numbers come from the engine: golden 9 × 4, constant 57 / 28.75 %, 13,680 of 14,400 fit, D at y = 3 (not GOLDEN_PACK y = 2)', async () => {
  const SP = await import('../site/engines/sequence-pair.js');
  const { DATA } = await import('../site/engines/fixtures.js');
  const r = SP.pack(DATA.fixture, ['A', 'B', 'C', 'E', 'D'], ['D', 'A', 'B', 'C', 'E']);
  assert.deepEqual([r.metrics.bbox.w, r.metrics.bbox.h, r.y.D], [9, 4, 3]);
  const lesson = fs.readFileSync(path.join(ROOT, 'content/modules', ID, 'lesson.md'), 'utf8');
  for (const s of ['9 × 4', '28.75', '57', '13,680', '14,400', '720', '9,056']) assert.ok(lesson.includes(s), `lesson states ${s}`);
  const traces = JSON.parse(read(`data/${ID}/traces.json`));
  assert.equal(traces.stats.fit, 13680); assert.equal(traces.stats.pairs, 14400); assert.equal(traces.stats.sameAsGolden, 3);
});

test('English edition: every page has an English twin and the module content is translated', () => {
  for (const p of ['index.html', `modules/${ID}/index.html`, 'foundations/index.html', 'glossary/index.html', 'guide/index.html', 'credits/index.html', 'progress/index.html']) {
    assert.ok(exists(`en/${p}`), `en/${p}`);
    const html = read(`en/${p}`);
    assert.ok(/<html lang="en"/.test(html), `${p} is marked English`);
    assert.ok(!/class="i18n-note"/.test(html), `${p}: no untranslated notice`);
  }
});

test('films: four (popular, concise, advanced, lab walkthrough), zh + en, captions within reading time; crosswalk scenes exist', () => {
  const film = JSON.parse(read(`media/${ID}/film.json`));
  const films = film.films || [film];
  assert.deepEqual(films.map(f => f.kind), ['popular', 'concise', 'advanced', 'lab']);
  for (const f of films) {
    assert.equal(f.status, 'ready');
    assert.deepEqual(Object.keys(f.versions).sort(), ['en', 'zh'], `${f.id}: zh and en versions`);
    for (const v of Object.values(f.versions)) {
      assert.ok(exists(`media/${ID}/${v.src}`) && exists(`media/${ID}/${v.vtt}`) && exists(`media/${ID}/${v.poster}`));
      assert.equal(v.readingViolations, 0, 'every caption stays at least its reading time');
      assert.ok(v.chapters.length >= 3 && v.chapters.every((c, i) => i === 0 || c.t > v.chapters[i - 1].t));
      const vtt = read(`media/${ID}/${v.vtt}`);
      assert.ok(vtt.startsWith('WEBVTT') && (vtt.match(/-->/g) || []).length === v.transcript.length);
    }
  }
  const cw = JSON.parse(read(`data/${ID}/crosswalk.json`));
  const sceneIds = new Set(films.flatMap(f => (f.scenes || []).map(s => s.sceneId)));
  for (const o of cw.objectives) for (const s of o.sceneIds) assert.ok(sceneIds.has(s), `${o.id}: scene ${s} exists in a rendered film`);
});

test('slides: numbered pages with notes, PDF and editable PPTX, crosswalk slide ids exist', () => {
  const deck = JSON.parse(read(`slides/${ID}/slides.json`));
  assert.equal(deck.status, 'ready');
  assert.ok(deck.slides.length >= 12 && deck.slides.length <= 16);
  deck.slides.forEach((s, i) => { assert.equal(s.pageNumber, i + 1); assert.equal(s.pageCount, deck.slides.length); assert.ok(s.transcript.length > 20); assert.ok(exists(`slides/${ID}/${s.image}`)); });
  assert.ok(exists(`slides/${ID}/${deck.pdf}`) && exists(`slides/${ID}/${deck.pptx}`));
  const cw = JSON.parse(read(`data/${ID}/crosswalk.json`)), ids = new Set(deck.slides.map(s => s.slideId));
  for (const o of cw.objectives) for (const s of o.slideIds) assert.ok(ids.has(s), `${o.id}: slide ${s} exists`);
});

test('licences and notices ship with the repository; no third-party audio file is committed', () => {
  for (const f of ['LICENSE', 'LICENSE-CONTENT.md', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md', 'README.md']) assert.ok(fs.existsSync(path.join(ROOT, f)), f);
  assert.ok(/MIT License/.test(fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8')));
  assert.ok(/CC BY 4\.0|Attribution 4\.0/.test(fs.readFileSync(path.join(ROOT, 'LICENSE-CONTENT.md'), 'utf8')));
  const audio = [];
  const walk = d => { for (const f of fs.readdirSync(d)) { if (['node_modules', '.git', 'ref-lc', 'build'].includes(f)) continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(mp3|m4a|wav|flac|ogg|aac)$/i.test(f) && audio.push(path.relative(ROOT, p)); } };
  walk(ROOT);
  assert.deepEqual(audio, [], 'no standalone audio tracks in the repository');
});
