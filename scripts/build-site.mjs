#!/usr/bin/env node
// Builds every static page of the course from content/ into site/, once per language. No dependencies.
// Chinese pages keep their original paths (site/…); English pages mirror them under site/en/….
// English text comes from *.en.json overlays and *.en.md files next to the Chinese sources; where a translation
// does not exist yet, the English page shows the Chinese text under a visible "not translated yet" note.
// Pages use relative links only, so the site works under any GitHub Pages project subpath.
import fs from 'node:fs';
import path from 'node:path';
import { render, sections, esc, inline, setLang } from './lib/md.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = path.join(ROOT, 'site'), CONTENT = path.join(ROOT, 'content');
const LANGS = ['zh', 'en'];
const read = p => fs.readFileSync(p, 'utf8');
const readJSON = p => JSON.parse(read(p));
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const exists = p => fs.existsSync(p);

/** Overlay translated fields onto the Chinese source. Arrays of objects merge by index, so ids and links stay shared. */
function overlay(base, over) {
  if (over === undefined) return base;
  if (Array.isArray(base) && Array.isArray(over)) return base.map((b, i) => (i < over.length ? overlay(b, over[i]) : b));
  if (base && typeof base === 'object' && over && typeof over === 'object' && !Array.isArray(base)) {
    const out = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = overlay(base[k], v);
    return out;
  }
  return over;
}
/** Read <name>.json (zh) and, for English, overlay <name>.en.json. Returns [data, translated?]. */
function readLocalized(file, lang) {
  const base = readJSON(file);
  if (lang === 'zh') return [base, true];
  const en = file.replace(/\.json$/, '.en.json');
  return exists(en) ? [overlay(base, readJSON(en)), true] : [base, false];
}
/** Read <name>.md (zh) or <name>.en.md. Returns [text, translated?]. */
function readLocalizedMd(file, lang) {
  const en = file.replace(/\.md$/, '.en.md');
  if (lang === 'en' && exists(en)) return [read(en), true];
  return [read(file), lang === 'zh'];
}

const course0 = readJSON(path.join(CONTENT, 'course.json'));
const BRAND = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="2" fill="none" stroke="#946a17" stroke-width="1.3" stroke-dasharray="2.4 2"/><rect x="5" y="17" width="9" height="10" fill="#0f6b5c"/><rect x="15" y="20" width="7" height="7" fill="#2f5e9e"/><rect x="5" y="11" width="11" height="5" fill="#946a17"/><rect x="23" y="21" width="5" height="6" fill="#6b4c9a"/></svg>`;
const BRAND_NAME = 'Floorplanning · Lesson 6';
const REPO = 'https://github.com/Su3037/floorplanning-lesson6-sequence-pair';
const PLAYBOOK = 'https://github.com/Su3037/learning-clustering/tree/main/course-playbook';
const MID = 'm06-sequence-pair';

for (const lang of LANGS) buildLanguage(lang);
console.log('built zh + en');

function buildLanguage(lang) {
  setLang(lang);
  const EN = lang === 'en';
  const T = (zh, en) => (EN ? en : zh);
  const [course] = readLocalized(path.join(CONTENT, 'course.json'), lang);
  const out = p => path.join(SITE, EN ? 'en' : '', p);       // where a page is written
  const depth = p => p.split('/').length - 1 + (EN ? 1 : 0);  // directories between the page and site/
  const relOf = p => '../'.repeat(p.split('/').length - 1);   // from the page to its own language root
  const rootOf = p => '../'.repeat(depth(p));                 // from the page to site/ (shared assets, media, data)

  const modules = course.modules.filter(id => exists(path.join(CONTENT, 'modules', id, 'module.json'))).map(id => {
    const dir = path.join(CONTENT, 'modules', id);
    const [m, mt] = readLocalized(path.join(dir, 'module.json'), lang);
    let lt = true;
    if (exists(path.join(dir, 'lesson.md'))) { const [src, ok] = readLocalizedMd(path.join(dir, 'lesson.md'), lang); m.lesson = sections(src); lt = ok; } else m.lesson = [];
    m.translated = mt && lt;
    m.outlineMd = exists(path.join(dir, 'module.md'));
    const film = path.join(SITE, 'media', id, 'film.json');
    m.film = exists(film) ? readJSON(film) : { status: 'planned' };
    const deck = path.join(SITE, 'slides', id, 'slides.json');
    m.deck = exists(deck) ? readJSON(deck) : { status: 'planned' };
    m.challengeMeta = exists(path.join(dir, 'challenges.json')) ? readLocalized(path.join(dir, 'challenges.json'), lang)[0] : [];
    return m;
  });
  const [glossary, glossaryTranslated] = readLocalized(path.join(CONTENT, 'glossary.json'), lang);

  // Registry consumed by the shell (home progress bars, import validation). Language-neutral ids; titles per language.
  if (!EN) write(path.join(SITE, 'data', 'registry.json'), JSON.stringify({
    schemaVersion: 1, contentVersion: course.contentVersion, generated: new Date().toISOString().slice(0, 10),
    modules: modules.map(m => ({ moduleId: m.moduleId, displayOrder: m.displayOrder, display: m.display, title: m.title, topic: m.topic,
      upstreamId: m.upstreamId, sourceIssue: m.sourceIssue, teacherMappingStatus: m.teacherMappingStatus, challenges: m.challengeMeta.map(c => c.id) }))
  }, null, 2));
  else { // English titles for the shared registry (progress page, home cards)
    const reg = readJSON(path.join(SITE, 'data', 'registry.json'));
    for (const r of reg.modules) r.titleEn = modules.find(m => m.moduleId === r.moduleId)?.title;
    write(path.join(SITE, 'data', 'registry.json'), JSON.stringify(reg, null, 2));
  }

  const NAV = [['index.html', '概览', 'Overview', 'home'], [`modules/${MID}/index.html`, 'Module 06', 'Module 06', 'module'], ['foundations/index.html', '基础速查', 'Foundations', 'foundations'], ['glossary/index.html', '术语表', 'Glossary', 'glossary'],
    ['guide/index.html', '如何挑战', 'Challenges', 'guide'], ['credits/index.html', '资源与贡献', 'Credits', 'credits'], ['progress/index.html', '学习记录', 'Progress', 'progress']];

  /** Notice shown on an English page whose text is still the Chinese original. */
  const untranslated = (p, what) => EN ? `<div class="wrap"><p class="i18n-note" lang="en"><b>Translation in progress.</b> ${what} is still shown in the original Chinese. The English edition is being written chapter by chapter. <a href="${rootOf(p)}${p}" hreflang="zh-CN" data-lang-link="zh">Open the Chinese page</a></p></div>` : '';

  function shell({ page, title, active = '', body, scripts = '', description = '' }) {
    const rel = relOf(page), root = rootOf(page);
    const zhHref = root + page, enHref = root + 'en/' + page;
    return `<!doctype html>
<html lang="${EN ? 'en' : 'zh-CN'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || course.description)}">
<link rel="alternate" hreflang="zh-CN" href="${zhHref}">
<link rel="alternate" hreflang="en" href="${enHref}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(BRAND.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"'))}">
<link rel="preload" href="${root}assets/fonts/${EN ? 'newsreader-400' : 'noto-serif-sc-400'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/course.css">
</head>
<body>
<a class="skip" href="#main">${T('跳到正文', 'Skip to content')}</a>
<header class="topbar"><div class="wrap">
<a class="brand" href="${rel}index.html">${BRAND}<span class="brand-name">${BRAND_NAME}</span><span class="brand-sub">${T('序列对工作室', 'Sequence-Pair Studio')}</span></a>
<nav class="topnav" aria-label="${T('课程', 'Course')}">${NAV.map(([href, zh, en, k]) => `<a href="${rel}${href}"${k === active ? ' aria-current="page"' : ''}>${T(zh, en)}</a>`).join('')}</nav>
<div class="lang-switch" role="group" aria-label="${T('语言', 'Language')}">${EN
    ? `<a href="${zhHref}" hreflang="zh-CN" lang="zh-CN" data-lang-link="zh">中文</a><span aria-current="true">EN</span>`
    : `<span aria-current="true">中文</span><a href="${enHref}" hreflang="en" lang="en" data-lang-link="en">EN</a>`}</div>
</div></header>
${body}
<footer class="footer"><div class="wrap">
<p>${T(`Floorplanning · Lesson 6 · 序列对（Sequence-Pair）。教学小例子，不是生产级布图工具。例子与约定来自教师课程 learn_floorplanning（CC BY 4.0），署名见<a href="${rel}credits/index.html">资源与贡献</a>；<a href="${REPO}">源代码</a>：代码 MIT，内容 CC BY 4.0。`,
    `Floorplanning · Lesson 6 · Sequence-Pair. A teaching example, not a production floorplanner. The examples and convention come from the instructor’s learn_floorplanning course (CC BY 4.0), credited on the <a href="${rel}credits/index.html">Credits</a> page; <a href="${REPO}">source code</a>: code MIT, content CC BY 4.0.`)}</p>
<p>${T(`做法沿用 Learning Clustering 的<a href="${PLAYBOOK}">课程制作手册</a>。`, `Built with the Learning Clustering <a href="${PLAYBOOK}">course playbook</a>.`)}</p>
<p><button class="btn quiet small" type="button" data-pref="reduceMotion">${T('减少动态', 'Reduce motion')}</button> <button class="btn quiet small" type="button" data-pref="sound">${T('声音', 'Sound')}</button> · ${T('内容版本', 'Content version')} ${course.contentVersion}</p>
</div></footer>
<script type="module">import { initShell } from '${root || './'}assets/core.js'; initShell();</script>
${scripts}
</body>
</html>
`;
  }

  const mmss = t => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
  const filmVersion = f => f.versions ? (f.versions[lang] || f.versions.zh) : f;
  const filmDuration = m => m.film.status === 'ready' ? (m.film.films ? m.film.films.map(f => mmss(filmVersion(f).duration)).join(' + ') : mmss(m.film.duration)) : T('计划中', 'planned');
  const eyebrow = (n, zh, en) => `<p class="eyebrow"><span class="eyebrow-no">${String(n).padStart(2, '0')}</span> / ${T(zh, en)}</p>`;
  // Course-authored links inside content point at Chinese pages (../../foundations/…); they resolve the same way on English pages.

  /* ---------------- module pages ---------------- */
  function modulePage(m, idx) {
    const page = `modules/${m.moduleId}/index.html`, rel = relOf(page), root = rootOf(page);
    const prev = modules[idx - 1], next = modules[idx + 1];
    const navItems = [['goals', '目标与问题', 'Goals'], ['film', '影片', 'Films'], ['lesson', '讲解', 'Lesson'], ['slides', '课件', 'Slides'], ['lab', '实验', 'Lab'],
      ['challenges', '挑战', 'Challenges'], ['python', 'Python', 'Python'], ['mistakes', '易错与局限', 'Pitfalls'], ['sources', '来源', 'Sources']];
    const objectives = m.objectives.map(o => `<li id="obj-${o.id}">${inline(o.text)}<span class="links">${(o.where || []).map(w => `<a href="#${w}">${esc(sectionTitle(m, w))}</a>`).join(' · ')}</span></li>`).join('');
    const p = m.problem;
    const problem = [['输入', 'Input', p.input], ['输出', 'Output', p.output], ['目标', 'Objective', p.objective], ['约束', 'Constraints', p.constraints], ['假设', 'Assumptions', p.assumptions], ['停止 / 完成', 'Stopping', p.stop]]
      .map(([zh, en, v]) => `<div><b>${T(zh, en)}</b><p>${inline(v)}</p></div>`).join('');
    const lessonToc = m.lesson.map((s, i) => `<a href="#${s.id}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.title)}</a>`).join('');
    const lesson = m.lesson.map((s, i) => `<section class="lesson-part" aria-labelledby="${s.id}"><h3 id="${s.id}"><span class="part-no">§ ${i + 1}</span>${esc(s.title)}</h3>${s.html}</section>`).join('\n');
    const mistakes = m.mistakes.map(x => `<article class="mistake"><h4>${inline(x.title)}</h4><dl><dt>${T('错误结果', 'Wrong result')}</dt><dd>${inline(x.wrong)}</dd><dt>${T('错因', 'Why')}</dt><dd>${inline(x.why)}</dd><dt>${T('反例 / 证据', 'Counterexample')}</dt><dd>${inline(x.counter)}</dd><dt>${T('修正', 'Fix')}</dt><dd>${inline(x.fix)}</dd></dl></article>`).join('');
    const py = m.pythonPackage;
    const status = '';
    const c = m.credits;
    const quiz = (m.quiz || []).map((q, i) => `<article class="quiz-item" id="quiz-${q.id}" data-answer="${q.answer}"><h4><span class="cat">${T('概念', 'Concept')} ${i + 1}</span> ${inline(q.prompt)}</h4><div class="choice-row" role="radiogroup">${q.choices.map((ch, k) => `<button type="button" aria-pressed="false" data-k="${k}">${inline(ch)}</button>`).join('')}</div><p class="fb" role="status" aria-live="polite"></p><p class="quiz-explain" hidden>${inline(q.explain)}</p></article>`).join('');
    const body = `
<nav class="module-nav" aria-label="${T('本模块', 'This module')}"><div class="wrap">${navItems.map(([id, zh, en], i) => `<a href="#${id}"><span>${String(i + 1).padStart(2, '0')}</span>${T(zh, en)}</a>`).join('')}</div></nav>
<main id="main">
${m.translated ? '' : untranslated(page, 'This chapter')}
<section class="mod-hero"><div class="wrap">
<div class="mod-hero-text">
<p class="eyebrow">${esc(m.display)} / ${esc(m.topic)}</p>
<h1>${esc(m.title)}</h1>
<p class="sub">${inline(m.hook)}</p>
<p class="byline">${T('教师课程', 'Instructor course')} learn_floorplanning · <code>${esc(m.upstreamId)}</code> · Issue #${m.sourceIssue.number}（${esc(m.sourceIssue.title)}） · ${T('教学小例子，不是生产级工具', 'a teaching example, not a production tool')}</p>
${status}
<nav class="pager" aria-label="${T('概览与实验', 'Overview and lab')}"><a href="../../index.html">← ${T('概览', 'Overview')}</a><a href="#lab">${T('直接进入实验', 'Straight to the lab')} →</a></nav>
</div>
<aside class="factbox" aria-label="${T('本模块概况', 'At a glance')}"><dl>
<dt>${T('前置', 'Before')}</dt><dd>${inline(m.prerequisitesText)}</dd>
<dt>${T('用时', 'Time')}</dt><dd>${inline(m.studyTime)}</dd>
<dt>${T('接下来', 'Next')}</dt><dd>${inline(m.nextText)}</dd>
<dt>${T('影片', 'Films')}</dt><dd>${filmDuration(m)}</dd>
<dt>${T('课件', 'Slides')}</dt><dd>${m.deck.status === 'ready' ? T(`${m.deck.slides.length} 页，16:9，含页码`, `${m.deck.slides.length} pages, 16:9, numbered`) : T('计划中', 'planned')}</dd>
<dt>${T('挑战', 'Challenges')}</dt><dd>${T(`${m.challengeMeta.length} 题`, `${m.challengeMeta.length}`)} · ${[...new Set(m.challengeMeta.map(x => x.type))].map(t => `[${esc(t)}]`).join(' ')}</dd>
<dt>Python</dt><dd>${m.codelab ? T('在浏览器里直接写、直接运行', 'Write and run it right in the browser') : T('下载练习包，本地运行', 'Download the exercise pack and run it locally')}</dd>
</dl></aside>
</div></section>

<section class="section" id="goals"><div class="wrap">
<div class="section-head"><div>${eyebrow(1, '目标与问题', 'Goals and problem')}<h2>${T('这一模块要解决什么', 'What this module solves')}</h2></div><p>${T('先看问题和成功标准，再看算法。每个目标后面的链接指向讲它的地方。', 'Start with the problem and what counts as success, then the algorithm. Each goal links to where it is taught.')}</p></div>
${m.review ? `<p class="review"><b>${T('复习', 'Recap')}</b>${inline(m.review)}</p>` : ''}
<div class="grid-2 goals"><div><h3>${T('学习目标', 'Learning goals')}</h3><ol class="objectives">${objectives}</ol></div>
<div><h3>${T('问题定义', 'Problem statement')}</h3><div class="problem">${problem}</div></div></div>
</div></section>

<section class="section dark" id="film"><div class="wrap">
<div class="section-head"><div>${eyebrow(2, '影片', 'Films')}<h2>${esc(m.filmTitle || T('核心短片', 'The film'))}</h2></div><p>${inline(m.filmNote || T('画面中的每个数字都来自本页同一个引擎的运行记录。', 'Every number on screen comes from a run of the same engine this page uses.'))}</p></div>
<div id="film-root"><p class="muted">${T('正在载入影片…', 'Loading the film…')}</p></div>
</div></section>

<section class="section" id="lesson"><div class="wrap">
<div class="section-head"><div>${eyebrow(3, '讲解 · 由浅入深', 'Lesson · from intuition to pseudocode')}<h2>${T('从例子到伪代码', 'From an example to pseudocode')}</h2></div><p>${T('章节编号与影片章节、课件页对应；完整对应表见本页末尾的 crosswalk。', 'Section numbers match the film chapters and slide pages; the full map is in the crosswalk at the end of this page.')}</p></div>
<div class="lesson-layout"><nav class="lesson-toc" aria-label="${T('讲解小节', 'Lesson sections')}">${lessonToc}</nav>
<div class="prose">${lesson}</div></div>
</div></section>

<section class="section" id="slides"><div class="wrap">
<div class="section-head"><div>${eyebrow(4, '课件 · 带页码与讲稿', 'Slides · numbered, with notes')}<h2>${T('课堂课件', 'Classroom slides')}</h2></div><p>${T('页码与 PDF 完全一致；当前页的讲稿在幻灯片下方，不遮挡图。', 'Page numbers match the PDF exactly; the notes for each page sit below the slide.')}</p></div>
<div id="slides-root"><p class="muted">${T('正在载入课件…', 'Loading the slides…')}</p></div>
</div></section>

<section class="section dark" id="lab"><div class="wrap">
<div class="section-head"><div>${eyebrow(5, '实验 · 浏览器内实时计算', 'Lab · computed live in your browser')}<h2>${esc(m.labTitle || T('动手实验', 'Hands-on lab'))}</h2></div><p>${inline(m.labNote || T('自由实验不判分。单步、自动播放、改参数都由真实引擎重新计算；可以导出本次运行记录。', 'Nothing here is graded. Every step, replay and parameter change is recomputed by the real engine; you can export the run.'))}</p></div>
<div id="lab-root" tabindex="-1"><p class="muted">${T('正在载入实验…（需要通过 HTTP 打开页面；直接双击 HTML 时浏览器会阻止模块脚本。）', 'Loading the lab… (open the page over HTTP; browsers block module scripts in files opened directly.)')}</p></div>
</div></section>

<section class="section" id="challenges"><div class="wrap">
<div class="section-head"><div>${eyebrow(6, '挑战 · 由易到难', 'Challenges · easy to hard')}<h2>${T('挑战与概念自测', 'Challenges and concept checks')}</h2></div><p>${T('类别写在方括号里，难度单独标注。答案由引擎或明确规则判定；看答案不扣分，记录会如实区分。', 'The category is in brackets and the difficulty is marked separately. Answers are checked by the engine or an explicit rule; looking at an answer costs nothing, and your record says so honestly.')}</p></div>
<p class="ch-guide">${T(`第一次用？先读<a href="${rel}guide/index.html">如何挑战</a>：读任务 → 预测 → 操作 → 提交 → 看解释 → 再试。`, `First time? Read <a href="${rel}guide/index.html">how challenges work</a>: read the task, predict, act, submit, read the explanation, try again.`)}${m.challengeTip ? ' ' + inline(m.challengeTip) : ''}</p>
<div class="ch-list" id="challenge-root"><p class="muted">${T('正在载入挑战…', 'Loading the challenges…')}</p></div>
<div class="quiz" id="quiz"><h3>${T('概念自测', 'Concept checks')}</h3><p class="muted">${T('六道选择题，考的是理解而不是记住例子的字母。点选即判，可以反复改。', 'Six questions that test understanding, not the letters of the example. Pick an answer to check it; change it as often as you like.')}</p>${quiz}</div>
</div></section>

<section class="section" id="python"><div class="wrap">
${m.codelab ? `<div class="section-head"><div>${eyebrow(7, '在线编程 · 在浏览器里运行 Python', 'Code it · Python in your browser')}<h2>${esc(py.title)}</h2></div><p>${T('不用安装任何东西：Python 在你的浏览器里运行（Pyodide），代码只保存在本机。检查器与下载包里的 check.py 完全相同。', 'Nothing to install: Python runs in your browser (Pyodide) and your code stays on this device. The checker is the same check.py as in the download.')}</p></div>
<div class="grid-2 cl-intro"><div class="prose">${render(py.md)}</div>
<div class="cl-howto"><h3>${T('怎么用', 'How it works')}</h3><ol><li>${T('在编辑器里补全标着 TODO 的函数。', 'Fill in the functions marked TODO in the editor.')}</li><li>${T('按 <b>运行检查</b>（Ctrl/⌘ + Enter）：每一项给出 PASS、FAIL 或 INCOMPLETE。', 'Press <b>Run checks</b> (Ctrl/⌘ + Enter): each check reports PASS, FAIL or INCOMPLETE.')}</li><li>${T('全部通过后，在下方用<b>你自己的</b>函数跑一遍例子，逐步对照课程引擎。', 'Once everything passes, run the examples below with <b>your own</b> functions and compare them step by step with the course engine.')}</li></ol>
<p class="small muted">${T('第一次运行会下载约 12 MB 的 Python 运行环境，之后由浏览器缓存。想离线做？', 'The first run downloads about 12 MB of Python runtime; the browser caches it afterwards. Prefer working offline?')} <a href="${root}downloads/${m.moduleId}-python${EN ? '-en' : ''}.zip" download>${T('下载练习包（.zip）', 'Download the pack (.zip)')}</a></p></div></div>
<div id="codelab-root" class="cl-root"><p class="muted">${T('正在载入在线编程…', 'Loading the code lab…')}</p></div>` : `<div class="section-head"><div>${eyebrow(7, 'Python 实现轨道 · 可选', 'Python track · optional')}<h2>${esc(py.title)}</h2></div><p>${T(`网页基础轨道不需要 Python。下载后在任意空目录运行；只用标准库${py.optional ? `（${esc(py.optional)}）` : ''}。`, `The web track needs no Python. Unzip anywhere and run it; it uses only the standard library${py.optional ? ` (${esc(py.optional)})` : ''}.`)}</p></div>
<div class="grid-2"><div class="prose">${render(py.md)}</div>
<div><div class="py-files"><div><code>starter.py</code>${T('起始代码：留有 TODO', 'Starter code with TODOs')}</div><div><code>check.py</code>${T('检查器：未完成报 INCOMPLETE，不算 PASS', 'Checker: unfinished work reports INCOMPLETE, never PASS')}</div><div><code>reference.py</code>${T('参考实现：卡住时再看', 'Reference solution, for when you are stuck')}</div><div><code>fixtures/</code>${T('本章例子的 JSON', 'The chapter’s examples as JSON')}</div><div><code>README.md</code>${T('任务、两级提示与样例', 'Task, two hints and samples')}</div></div>
<p><a class="btn primary" href="${root}downloads/${m.moduleId}-python.zip" download>${T('下载练习包（.zip）', 'Download the pack (.zip)')}</a></p>
<pre><code>python3 check.py              ${T('# 检查你的 starter.py', '# check your starter.py')}
python3 check.py reference.py ${T('# 看参考实现全部通过', '# the reference passes every check')}</code></pre></div></div>`}
</div></section>

<section class="section" id="mistakes"><div class="wrap">
<div class="section-head"><div>${eyebrow(8, '常见错误与局限', 'Common mistakes and limits')}<h2>${T('容易错在哪里', 'Where it goes wrong')}</h2></div><p>${T('每条都给错误结果、错因、反例和修正；反例的数值都由测试复算。', 'Each entry gives the wrong result, the cause, a counterexample and the fix; every number in the counterexamples is recomputed by the tests.')}</p></div>
<div class="mistakes">${mistakes}</div>
<div class="prose limits"><h3>${T('适用范围与局限', 'Scope and limits')}</h3>${render(m.limits)}</div>
</div></section>

<section class="section" id="sources"><div class="wrap">
<div class="section-head"><div>${eyebrow(9, '资料与原作者', 'References and original author')}<h2>${T('来源', 'Sources')}</h2></div><p>${T('讲解、引擎、实验、影片与课件都是新写的；教师课程的例子、约定与伪代码思路在此署名。第三方音乐若出现，只在作者指定的影片里，并单独注明不在本课程许可范围内。', 'The lesson, engine, lab, films and slides are new; the instructor’s examples, convention and pseudocode outline are credited here. Third-party music, where used, appears only in the film the author chose it for, and is marked as outside this course’s licences.')}</p></div>
<div class="grid-2"><div class="prose">
<h3>${T('教师课程与保留的内容', 'Instructor material and what was kept')}</h3>
<p><strong>${esc(c.instructor.name)}</strong> · <a href="${c.instructor.repository}">${T('模块源文件', 'module source')}</a>${T(`（固定 <code>${c.instructor.commit.slice(0, 7)}</code>，CC BY 4.0）`, ` (pinned at <code>${c.instructor.commit.slice(0, 7)}</code>, CC BY 4.0)`)}</p>
<ul>${c.kept.map(k => `<li>${inline(k)}</li>`).join('')}</ul>
<p class="small muted">${inline(c.licenseNote)}</p>
</div><div class="prose">
<h3>${T('来源映射', 'Source mapping')}</h3>
<table><tbody><tr><th>${T('本课', 'This lesson')}</th><td>${esc(m.display)} · <code>${m.moduleId}</code></td></tr><tr><th>${T('教师模块', 'Upstream module')}</th><td><code>${esc(m.upstreamId)}</code> · ${T('实验', 'lab')} <code>${esc(m.labId)}</code></td></tr><tr><th>${T('任务', 'Assignment')}</th><td><a href="${m.sourceIssue.url}">Issue #${m.sourceIssue.number}</a> (${esc(m.sourceIssue.title)})</td></tr><tr><th>${T('教师目录', 'Teacher’s catalogue')}</th><td>${esc(m.teacherFolder)}</td></tr><tr><th>${T('编号', 'Numbering')}</th><td>${T('课程位置 6（Lab 06）与层级编号 02-05 是两套编号，本课只用前者作标题。', 'Course position 6 (Lab 06) and the hierarchical number 02-05 are two numbering systems; the title uses the former.')}</td></tr></tbody></table>
<h3>${T('参考文献', 'References')}</h3><ul>${c.references.map(r => `<li>${inline(r)}</li>`).join('')}</ul>
<p><a href="${root}data/${m.moduleId}/crosswalk.json">${T('本模块 crosswalk（目标 → 讲解 → 影片 → 课件 → 实验 → 挑战 → Python）', 'Crosswalk for this module (goal → lesson → film → slide → lab → challenge → Python)')}</a> · <a href="${root}downloads/${m.moduleId}-outline.md">${T('Markdown 大纲', 'Markdown outline')}</a> · <a href="${root}downloads/sequence-pair-fixtures.json" download>${T('共享例子 JSON', 'shared fixtures JSON')}</a></p>
</div></div>
</div></section>
</main>`;
    return shell({ page, title: `${m.display} ${m.title} · ${BRAND_NAME}`, body, description: m.description, active: 'module',
      scripts: `<script type="module" src="${root}modules/${m.moduleId}/lab.js"></script>` });
  }
  function sectionTitle(m, id) {
    const top = { goals: T('目标与问题', 'Goals'), film: T('影片', 'Film'), lesson: T('讲解', 'Lesson'), slides: T('课件', 'Slides'), lab: T('实验', 'Lab'), challenges: T('挑战', 'Challenges'), python: 'Python', mistakes: T('易错', 'Pitfalls') };
    if (top[id]) return top[id];
    const s = m.lesson.find(x => x.id === id); if (s) return s.title;
    const c = m.challengeMeta.find(x => `challenge-${x.id}` === id); if (c) return `[${c.type}] ${c.title}`;
    return id;
  }

  /* ---------------- home: the lesson overview ---------------- */
  function home() {
    const page = 'index.html', root = rootOf(page), m = modules[0], mod = `modules/${m.moduleId}/index.html`;
    const stepsZh = [['概念', '布图规划、固定边界、为什么不直接搜坐标', 'm06-problem'], ['规则', '两个排列，四种关系', 'm06-rule'], ['图', '水平 / 竖直约束图', 'm06-graphs'], ['DP', '最长路径：加前驱尺寸，取最大', 'm06-dp'],
      ['指标', '完整、不重叠、装得下、紧凑', 'm06-metrics'], ['编码', '改排列、同一布局的多种写法', 'm06-encoding'], ['实验', '自己改排列，单步看每条约束', 'lab'], ['Python', '五个函数，浏览器里直接运行', 'python']];
    const stepsEn = [['Idea', 'Floorplanning, the fixed outline, why not search coordinates', 'm06-problem'], ['Rule', 'Two permutations, four relations', 'm06-rule'], ['Graphs', 'Horizontal and vertical constraint graphs', 'm06-graphs'], ['DP', 'Longest path: add the predecessor’s size, take the max', 'm06-dp'],
      ['Metrics', 'Complete, overlap-free, fits, compact', 'm06-metrics'], ['Encoding', 'Changing a permutation; many pairs, one packing', 'm06-encoding'], ['Lab', 'Edit the pairs, step through every constraint', 'lab'], ['Python', 'Five functions, run in your browser', 'python']];
    const steps = (EN ? stepsEn : stepsZh).map(([k, t, a], i) => `<a class="mod-card" href="${mod}#${a}"><span class="num">${String(i + 1).padStart(2, '0')} · ${esc(k)}</span><h3>${esc(t)}</h3></a>`).join('');
    const objectives = m.objectives.map(o => `<li>${inline(o.text)}</li>`).join('');
    const body = `<main id="main">
<section class="wrap hero"><div class="hero-text">
<p class="eyebrow">${esc(BRAND_NAME)} / Module 06 / ${T('序列对', 'Sequence-Pair')}</p>
<h1>${T('两行字母<br>摆好一块芯片', 'Two lines of letters<br>lay out a chip')}</h1>
<p class="hero-sub">${inline(m.hook)}</p>
<p class="lead">${T('布图规划要把处理器核、缓存、接口这些矩形模块摆进芯片的固定边界里，不重叠、尽量紧凑。序列对用<b>两个排列</b>记录每一对模块的上下左右，再用约束图上的最长路径算出坐标。这一课从五个小模块出发，一步步看清这个过程：哪些是它保证的，哪些不是。',
      'Floorplanning places rectangular blocks (cores, caches, interfaces) inside a chip’s fixed outline, without overlap and as compactly as possible. A sequence pair records the relative position of every pair of blocks with <b>two permutations</b>, then computes coordinates as longest paths in two constraint graphs. This lesson follows five small blocks step by step: what the method guarantees, and what it does not.')}</p>
<div class="btn-row"><a class="btn primary" href="${mod}#lab">${T('进入实验', 'Open the lab')} <span aria-hidden="true">→</span></a><a class="btn quiet" href="${mod}">${T('从头学', 'Start the lesson')}</a><a class="btn quiet" href="${mod}#film">${T('先看影片', 'Watch the films')}</a></div>
<p class="byline">${T('浏览器本地计算 · 不需要登录或安装 · 代码 MIT，内容 CC BY 4.0', 'Computed in your browser · no login, nothing to install · code MIT, content CC BY 4.0')}</p>
</div>
<figure class="hero-art"><div class="fp-fig" data-fig="hero"></div><figcaption>${T('教师示例：pos = A B C E D，neg = D A B C E → 包围盒 9 × 4，装进 10 × 8。', 'The instructor’s pair: pos = A B C E D, neg = D A B C E → a 9 × 4 box inside 10 × 8.')}</figcaption></figure>
</section>
<section class="section"><div class="wrap">
<div class="section-head"><div>${eyebrow(1, '这一课', 'This lesson')}<h2>${T('学完你能做什么', 'What you will be able to do')}</h2></div><p>${inline(m.studyTime)}</p></div>
<div class="grid-2"><div><ol class="objectives">${objectives}</ol></div>
<div class="prose"><h3>${T('需要的准备', 'Before you start')}</h3><p>${inline(m.prerequisitesText).replaceAll('../../', '')}</p>
<h3>${T('它不是什么', 'What it is not')}</h3><p>${T('这是只有几块矩形的教学例子，用来看清表示法与约束推导。真实芯片的布图还要考虑线长、时序、电源与引脚，详细布局、布线与签核由专门的 EDA 工具完成。', 'This is a teaching example with a handful of rectangles, made to show the representation and the constraint reasoning. Real floorplanning also weighs wirelength, timing, power and pins; detailed placement, routing and sign-off are done by dedicated EDA tools.')}</p>
<h3>${T('在课程里的位置', 'Where it sits in the course')}</h3><p>${T('教师课程 learn_floorplanning 的 Lab 06（目录编号 <code>module02-05-sequence-pair</code>）。前一课是 B*-tree，后一课是模拟退火：在序列对上做随机搜索。', 'Lab 06 of the instructor’s learn_floorplanning course (catalogue id <code>module02-05-sequence-pair</code>). The lesson before is B*-tree; the one after is simulated annealing, a random search over sequence pairs.')}</p></div></div>
</div></section>
<section class="section dark" id="intro"><div class="wrap">
<div class="section-head"><div>${eyebrow(2, '影片', 'Films')}<h2>${T('先看一遍', 'Watch it first')}</h2></div><p>${T('四部影片：科普、精讲、进阶、实验演示。中文字幕，不配旁白；画面里的每个数都来自本课同一个引擎。', 'Four films: popular science, concise, advanced and a lab walkthrough. Captions, no narration; every number on screen comes from the same engine as the lab.')}</p></div>
<div id="intro-film-root"><p class="muted">${T('正在载入影片…', 'Loading the films…')}</p></div>
</div></section>
<section class="section"><div class="wrap">
<div class="section-head"><div>${eyebrow(3, '学习路线', 'The route')}<h2>${T('八步，从问题到代码', 'Eight steps, from the problem to code')}</h2></div><p>${T('每一步都链接到模块页的对应位置；可以按顺序学，也可以直接跳到实验。', 'Each step links into the module page; follow them in order or jump straight to the lab.')}</p></div>
<div class="route">${steps}</div>
</div></section>
</main>`;
    return shell({ page, title: T(`序列对 · ${BRAND_NAME}`, `Sequence-Pair · ${BRAND_NAME}`), active: 'home', body, scripts: `<script type="module" src="${root}assets/home.js"></script>` });
  }

  /* ---------------- simple pages ---------------- */
  function simplePage(dir, active, title, mdFile, extraScript = '') {
    const page = `${dir}/index.html`;
    const [md, ok] = readLocalizedMd(path.join(CONTENT, mdFile), lang);
    const body = `<main id="main">${ok ? '' : untranslated(page, 'This page')}<section class="section page"><div class="wrap"><div class="prose">${render(md)}</div></div></section></main>`;
    write(out(page), shell({ page, title: `${title} · ${BRAND_NAME}`, active, body, scripts: extraScript.replaceAll('{root}', rootOf(page)) }));
  }
  function glossaryPage() {
    const page = 'glossary/index.html', rel = relOf(page);
    const rows = glossary.terms.map(t => `<tr id="g-${t.id}"><td>${EN ? `${esc(t.en)}<br><span class="small muted" lang="zh-CN">${esc(t.zh)}</span>` : `${esc(t.zh)}<br><span class="small muted">${esc(t.en)}</span>`}</td><td>${inline(t.meaning)}</td><td>${inline(t.notConfuse)}</td><td>${t.anchor ? `<a href="${rel}modules/${MID}/index.html#${t.anchor}">§ ${esc(t.anchor.replace('m06-', ''))}</a>` : ''}</td></tr>`).join('');
    const body = `<main id="main">${glossaryTranslated ? '' : untranslated(page, 'The glossary')}<section class="section page"><div class="wrap">
<p class="eyebrow">${T('术语表', 'Glossary')}</p><h1>${T('统一术语与符号', 'Terms and symbols')}</h1>
<p class="lead">${T('每个术语在讲解里第一次用到之前定义；这里汇总中文名、英文名和“不能混淆”的提醒。注意：块 D 是例子里的一个模块，和“DAG”“DP”里的 D 无关。',
      'Every term is defined in the lesson before it is first used; this page collects the Chinese and English names and what not to confuse each with. Note: block D is one of the example’s modules and has nothing to do with the D in “DAG” or “DP”.')}</p>
<div class="table-scroll"><table class="glossary-table"><thead><tr><th>${T('术语', 'Term')}</th><th>${T('含义', 'Meaning')}</th><th>${T('不能混淆', 'Do not confuse with')}</th><th>${T('首次展开', 'First explained')}</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="prose">${render(glossary.pronunciationMd)}</div>
</div></section></main>`;
    write(out(page), shell({ page, title: `${T('术语表', 'Glossary')} · ${BRAND_NAME}`, active: 'glossary', body }));
  }

  modules.forEach((m, i) => { write(out(`modules/${m.moduleId}/index.html`), modulePage(m, i)); if (!EN) crosswalk(m); });
  write(out('index.html'), home());
  simplePage('foundations', 'foundations', T('基础速查', 'Foundations'), 'foundations.md');
  if (!EN) write(path.join(SITE, '.nojekyll'), '');
  simplePage('guide', 'guide', T('如何挑战', 'How challenges work'), 'guide.md');
  simplePage('credits', 'credits', T('资源与贡献', 'Credits'), 'credits.md');
  simplePage('progress', 'progress', T('学习记录', 'My progress'), 'progress.md', '<script type="module" src="{root}assets/progress.js"></script>');
  glossaryPage();
  if (!EN) notFound();
}

/* ---------------- crosswalk (language-neutral ids) ---------------- */
function crosswalk(m) {
  const cw = readJSON(path.join(CONTENT, 'modules', m.moduleId, 'crosswalk.json'));
  // Fill in actual video chapter times and slide numbers from the rendered assets (never typed by hand).
  // Schema 2 films list their scenes once (shared by both language versions); older films carry chapters only.
  const films = m.film.status === 'ready' ? (m.film.films || [m.film]) : [];
  const scenes = films.flatMap((f, fi) => [...(f.scenes || []).map(s => ({ sceneId: s.sceneId, t: s.start, film: f.id || fi })),
    ...((f.versions ? (f.versions.zh || Object.values(f.versions)[0]).chapters : f.chapters) || []).map(c => ({ ...c, film: f.id || fi }))]);
  for (const o of cw.objectives) {
    o.video = (o.sceneIds || []).map(sid => { const c = scenes.find(x => x.sceneId === sid); return c ? { sceneId: sid, film: c.film, start: c.t } : { sceneId: sid, status: m.film.status === 'ready' ? 'scene-not-found' : 'planned' }; });
    o.slides = (o.slideIds || []).map(sid => { const s = m.deck.slides?.find(x => x.slideId === sid); return s ? { slideId: sid, page: s.pageNumber } : { slideId: sid, status: 'planned' }; });
  }
  cw.contentVersion = course0.contentVersion; cw.generated = new Date().toISOString().slice(0, 10);
  write(path.join(SITE, 'data', m.moduleId, 'crosswalk.json'), JSON.stringify(cw, null, 2));
  // Markdown outline as a download (T09)
  write(path.join(SITE, 'downloads', `${m.moduleId}-outline.md`), read(path.join(ROOT, 'docs', 'outline.md')));
  write(path.join(SITE, 'downloads', 'sequence-pair-fixtures.json'), read(path.join(ROOT, 'fixtures', 'sequence-pair.json')));
}

// 404 is served for any missing path, at any depth, so it must not rely on relative links. Bilingual on one page.
function notFound() {
  write(path.join(SITE, '404.html'), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>页面不存在 · Page not found · ${BRAND_NAME}</title>
<style>body{margin:0;font:17px/1.75 -apple-system,"PingFang SC","Hiragino Sans GB","Segoe UI",sans-serif;background:#f4f0e7;color:#1b2320}main{max-width:720px;margin:12vh auto;padding:0 20px}h1{font:400 40px/1.3 "Songti SC",Georgia,serif;margin:0 0 18px}a{color:#0f6b5c}.en{color:#5b665f;border-top:1px solid #d9d1c3;margin-top:28px;padding-top:20px}</style></head>
<body><main><h1>找不到这个页面</h1><p>地址可能已变更。回到 <a class="home" href="/">序列对课程首页</a>，或直接打开 <a class="lab" href="/">实验</a>。</p>
<div class="en" lang="en"><p><strong>Page not found.</strong> The address may have changed. Go back to the <a class="home-en" href="/">lesson overview</a>.</p></div></main>
<script>/* GitHub Pages project sites live under /<repo>/ */var p=location.pathname.split('/').filter(Boolean);var b=location.hostname.endsWith('github.io')&&p.length?'/'+p[0]+'/':'/';document.querySelector('.home').href=b;document.querySelector('.lab').href=b+'modules/${MID}/index.html#lab';document.querySelector('.home-en').href=b+'en/';</script></body></html>
`);
}
