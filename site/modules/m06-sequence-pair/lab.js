// Module 06 lab: edit pos / neg, and every view replays the same engine run (site/engines/sequence-pair.js).
// One run = one immutable list of events. Any edit (reorder, preset, rotation, undo, random neighbour) starts a new run with a new
// run number; the old events are dropped, so a stale step can never be shown next to a new result.
import { h, $, $$, L, toast, reducedMotion, put } from '../../assets/core.js';
import { Player, TraceInspector, exportRun } from '../../assets/lab.js';
import { bootModule } from '../../assets/module-page.js';
import { floorplan, ribbon, graphs, colorOf } from '../../assets/fp-draw.js';
import * as SP from '../../engines/sequence-pair.js';
import { DATA } from '../../engines/fixtures.js';
import { challenges } from './challenges.js';
import { visualize } from './visualize.js';

const FX = DATA.fixture;
const PRESETS = Object.fromEntries(DATA.presets.map(p => [p.id, p]));
const SMALL = Object.fromEntries(DATA.small.map(p => [p.id, p]));
const presetName = p => L(p.zh, p.en);
const REL = { left: L('左边', 'is left of'), right: L('右边', 'is right of'), below: L('下边', 'is below'), above: L('上边', 'is above') };
const relSay = (a, rel, b) => L(`${a} 在 ${b} ${REL[rel]}`, `${a} ${REL[rel]} ${b}`);
const PSEUDO = [
  L('校验 pos、neg 是同一组块的排列', 'check pos, neg are permutations of the blocks'),
  L('对 pos 中每一对 (i, j)，i 在前：', 'for each pair (i, j) with i first in pos:'),
  L('  neg 中 i 也在前 → H 边 i→j（左）', '  i also first in neg → H edge i→j (left)'),
  L('  否则 → V 边 i→j（下）', '  otherwise → V edge i→j (below)'),
  L('order ← pos（两张图的拓扑序）', 'order ← pos (topological for both graphs)'),
  L('x[j] ← max(0, x[i] + w[i] over H 前驱)', 'x[j] ← max(0, x[i] + w[i] over H preds)'),
  L('y[j] ← max(0, y[i] + h[i] over V 前驱)', 'y[j] ← max(0, y[i] + h[i] over V preds)'),
  L('报告：完整 · 重叠 · 装得下 · 包围盒 · 面积', 'report: complete · overlap · fit · box · areas')
];
const pct = x => `${(x * 100).toFixed(2)} %`;
const f2 = v => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));

/* ------------------------------------------------------------------ permutation editor */
function seqEditor(name, { onChange, onCommitText }) {
  let seq = [], sel = null, dragId = null;
  const row = h('div.sp-seq', { role: 'listbox', 'aria-label': L(`${name} 排列：选中一块后用 Alt + ←/→（或下方按钮）移动`, `${name} permutation: select a block, then move it with Alt + ←/→ (or the buttons)`), 'aria-orientation': 'horizontal' });
  const input = h('input.sp-text', { type: 'text', spellcheck: 'false', autocomplete: 'off', 'aria-label': L(`直接输入 ${name}（用空格分隔）`, `Type ${name} directly (space-separated)`) });
  const leftBtn = h('button.btn.small', { type: 'button', onclick: () => move(-1), 'aria-label': L(`把选中的块在 ${name} 中左移`, `Move the selected block left in ${name}`) }, '←');
  const rightBtn = h('button.btn.small', { type: 'button', onclick: () => move(1), 'aria-label': L(`把选中的块在 ${name} 中右移`, `Move the selected block right in ${name}`) }, '→');
  input.addEventListener('change', () => onCommitText(input.value));
  input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); onCommitText(input.value); } });
  function move(d) {
    if (sel == null) { toast(L('先点一下要移动的块。', 'Click the block you want to move first.')); return; }
    const i = seq.indexOf(sel), j = i + d;
    if (i < 0 || j < 0 || j >= seq.length) return;
    const next = [...seq]; [next[i], next[j]] = [next[j], next[i]];
    onChange(next, L(`在 ${name} 中把 ${sel} ${d < 0 ? '左' : '右'}移一位`, `moved ${sel} one place ${d < 0 ? 'left' : 'right'} in ${name}`));
    requestAnimationFrame(() => row.querySelector(`[data-id="${CSS.escape(sel)}"]`)?.focus());
  }
  function paint(s, valid = true) {
    seq = [...s];
    input.value = seq.join(' ');
    input.classList.toggle('bad', !valid);
    put(row, ...seq.map((id, k) => h('button.sp-chip', {
      type: 'button', role: 'option', 'data-id': id, 'aria-selected': sel === id, draggable: 'true', style: `--chip:${colorOf(id, k)}`,
      'aria-label': L(`${name} 第 ${k + 1} 位：${id}`, `${name} position ${k + 1}: ${id}`),
      onclick: () => { sel = sel === id ? null : id; paint(seq, valid); row.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus(); },
      onkeydown: ev => {
        if (ev.altKey && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) { ev.preventDefault(); ev.stopPropagation(); sel = id; move(ev.key === 'ArrowLeft' ? -1 : 1); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); (ev.key === 'ArrowLeft' ? ev.target.previousElementSibling : ev.target.nextElementSibling)?.focus(); }
      },
      ondragstart: ev => { dragId = id; ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', id); },
      ondragover: ev => { ev.preventDefault(); },
      ondrop: ev => {
        ev.preventDefault(); const from = dragId || ev.dataTransfer.getData('text/plain'); dragId = null;
        if (!from || from === id) return;
        const next = seq.filter(x => x !== from); next.splice(next.indexOf(id) + (seq.indexOf(from) < seq.indexOf(id) ? 1 : 0), 0, from);
        onChange(next, L(`在 ${name} 中把 ${from} 拖到 ${id} ${seq.indexOf(from) < seq.indexOf(id) ? '后面' : '前面'}`, `dragged ${from} ${seq.indexOf(from) < seq.indexOf(id) ? 'after' : 'before'} ${id} in ${name}`));
      }
    }, id)));
  }
  return { element: h('div.sp-seq-row', {}, h('span.sp-seq-name', name), row, h('span.sp-seq-move', {}, leftBtn, rightBtn), input), paint, get seq() { return seq; } };
}

/* ------------------------------------------------------------------ the lab */
async function lab(root, { pseudo }) {
  const state = { preset: 'golden', pos: [...PRESETS.golden.pos], neg: [...PRESETS.golden.neg], rot: [], history: [], run: null, runNo: 0, inspect: null };
  const toolbar = h('div.lab-toolbar'), editors = h('div.sp-editors'), err = h('div.lab-error', { role: 'alert' });
  const ribbonBox = h('div.sp-view'), graphBox = h('div.sp-view'), planBox = h('div.sp-view.sp-plan');
  const metricBox = h('div.sp-checks'), statusBox = h('div.status', { 'aria-live': 'polite' }), detailBox = h('div.decision'), whyBox = h('div.sp-why', { 'aria-live': 'polite' });
  const pseudoList = h('ol.sp-pseudo', {}, PSEUDO.map((t, i) => h('li', { 'data-line': i + 1 }, t)));
  const playerBox = h('div'), speedSel = h('select', { 'aria-label': L('播放速度', 'Playback speed') }, [['1800', L('慢', 'slow')], ['1100', L('中', 'medium')], ['550', L('快', 'fast')]].map(([v, t]) => h('option', { value: v, selected: v === '1100' }, t)));
  const runTag = h('span.sp-run', { 'aria-live': 'polite' }), traceBox = h('div');
  const posEd = seqEditor('pos', { onChange: (s, why) => edit({ pos: s }, why), onCommitText: t => { const s = t.trim().split(/[\s,]+/).filter(Boolean); if (s.join(' ') !== state.pos.join(' ')) edit({ pos: s }, L('输入了 pos', 'typed pos')); } });
  const negEd = seqEditor('neg', { onChange: (s, why) => edit({ neg: s }, why), onCommitText: t => { const s = t.trim().split(/[\s,]+/).filter(Boolean); if (s.join(' ') !== state.neg.join(' ')) edit({ neg: s }, L('输入了 neg', 'typed neg')); } });
  editors.append(posEd.element, negEd.element);
  const stage = h('div.lab-stage', {},
    h('div.sp-stage-grid', {},
      h('section', { 'aria-label': L('两个排列', 'The two permutations') }, h('h4.sp-h', L('① 两个排列：连线交叉 = 上下，不交叉 = 左右', '① Two permutations: lines cross = above/below, parallel = left/right')), ribbonBox),
      h('section', { 'aria-label': L('约束图', 'Constraint graphs') }, h('h4.sp-h', L('③ 约束图（斜网格：块放在 (pos 位 + neg 位, pos 位 − neg 位)）', '③ Constraint graphs (oblique grid: a block sits at (pos index + neg index, pos index − neg index))')), graphBox)),
    h('section', { 'aria-label': L('布图', 'Floorplan') }, h('h4.sp-h', L('⑤ 布图（原始单位；点击块看坐标从哪来）', '⑤ Floorplan (original units; click a block to see where its coordinates come from)')), planBox));
  const side = h('div.lab-side', {}, h('h4', L('结果（分开判断）', 'Result (judged separately)')), metricBox, statusBox,
    h('h4', L('② ④ 当前这一步', '② ④ This step')), detailBox, h('h4', L('伪代码', 'Pseudocode')), pseudoList, whyBox,
    h('div.sp-speed', {}, h('label', {}, L('速度', 'Speed'), speedSel), runTag), playerBox);
  put(root, toolbar, editors, err, h('div.lab', {}, stage, side), traceBox);

  const player = new Player(playerBox, { onIndex: show, speed: 1100 });
  speedSel.addEventListener('change', () => { player.speed = +speedSel.value; });
  playerBox.querySelector('.player').append(h('button.btn.small', { type: 'button', onclick: () => { player.go(0); player.play(); } }, L('↻ 重播', '↻ Replay')));
  const trace = new TraceInspector(traceBox, {
    columns: [{ label: L('事件', 'Event'), get: e => kindText(e) }, { label: L('伪代码行', 'Line'), get: e => e.line },
      { label: L('内容', 'Detail'), get: e => e.kind === 'relation' ? `${relSay(e.a, e.rel, e.b)} → ${e.graph}: ${e.a}→${e.b}` : e.kind === 'dp' ? `${e.axis}[${e.block}] = ${f2(e.value)}` : e.kind === 'report' ? `${f2(e.metrics.bbox.w)} × ${f2(e.metrics.bbox.h)} · ${statusText(e.metrics)}` : e.kind === 'validate' ? (e.ok ? 'ok' : e.errors.map(x => x.message).join(' ')) : `order ${e.order.join(' ')}` }],
    onPick: i => player.go(i)
  });

  const modules = () => FX.modules.map(m => (state.rot.includes(m.id) ? { ...m, w: m.h, h: m.w } : m));
  const input = () => ({ outline: FX.outline, modules: modules() });

  function buildToolbar() {
    const presetSel = h('select', { 'aria-label': L('预设', 'Preset') }, DATA.presets.map(p => h('option', { value: p.id, selected: p.id === state.preset }, presetName(p))));
    presetSel.addEventListener('change', () => { const p = PRESETS[presetSel.value]; state.preset = p.id; edit({ pos: [...p.pos], neg: [...p.neg], rot: [] }, L(`载入预设：${presetName(p)}`, `loaded preset: ${presetName(p)}`)); });
    const rotSel = h('select', { 'aria-label': L('旋转哪一块', 'Which block to rotate') }, FX.modules.map(m => h('option', { value: m.id }, m.id)));
    put(toolbar, 
      h('label', {}, L('预设', 'Preset'), presetSel),
      h('button.btn.small', { type: 'button', onclick: () => { const p = PRESETS[state.preset]; edit({ pos: [...p.pos], neg: [...p.neg], rot: [] }, L('重置到预设', 'reset to the preset')); } }, L('⟲ 重置', '⟲ Reset')),
      h('button.btn.small', { type: 'button', id: 'sp-undo', onclick: undo }, L('↶ 撤销', '↶ Undo')),
      h('button.btn.small', { type: 'button', onclick: randomNeighbour, title: L('模拟退火的基本动作：随机交换两块（只在 pos、只在 neg、或两边一起）', 'The basic annealing move: swap two blocks at random (in pos, in neg, or in both)') }, L('🎲 随机邻居', '🎲 Random neighbour')),
      h('label', {}, L('拓展 · 旋转 90°', 'Extension · rotate 90°'), h('span.sp-inline', {}, rotSel, h('button.btn.small', { type: 'button', onclick: () => { const id = rotSel.value; const rot = state.rot.includes(id) ? state.rot.filter(x => x !== id) : [...state.rot, id]; edit({ rot }, L(`${state.rot.includes(id) ? '取消旋转' : '旋转'} ${id}（拓展，不是本课标准答案）`, `${state.rot.includes(id) ? 'un-rotated' : 'rotated'} ${id} (extension, not the lesson's reference answer)`)); } }, L('切换', 'Toggle')))),
      h('button.btn.small', { type: 'button', onclick: () => state.run && exportRun('m06-sequence-pair', { run: state.runNo, input: input(), pos: state.pos, neg: state.neg, rotated: state.rot, status: state.run.status, result: state.run.result, events: state.run.events }) }, L('导出运行记录', 'Export the run')));
  }
  function edit(patch, why) {
    state.history.push({ pos: state.pos, neg: state.neg, rot: state.rot });
    if (state.history.length > 200) state.history.shift();
    Object.assign(state, patch);
    recompute(why);
  }
  function undo() {
    const prev = state.history.pop();
    if (!prev) { toast(L('没有可以撤销的改动。', 'Nothing to undo.')); return; }
    Object.assign(state, prev); recompute(L('撤销了上一次改动', 'undid the last change'));
  }
  function randomNeighbour() {
    if (!state.run || state.run.status !== 'ok') { toast(L('先让两个排列合法，再做随机邻居。', 'Make both permutations valid before taking a random neighbour.')); return; }
    const ids = state.pos, i = ids[Math.floor(Math.random() * ids.length)];
    let j = i; while (j === i) j = ids[Math.floor(Math.random() * ids.length)];
    const move = ['pos', 'neg', 'both'][Math.floor(Math.random() * 3)];
    const n = SP.neighbour(state.pos, state.neg, move, i, j);
    const before = state.run.result.metrics.bboxArea;
    edit(n, L(`随机邻居：${move === 'both' ? '在两个序列中' : `在 ${move} 中`}交换 ${i}、${j}`, `random neighbour: swapped ${i} and ${j} ${move === 'both' ? 'in both sequences' : `in ${move}`}`));
    if (state.run.status === 'ok') toast(L(`包围盒面积 ${f2(before)} → ${f2(state.run.result.metrics.bboxArea)}`, `bounding-box area ${f2(before)} → ${f2(state.run.result.metrics.bboxArea)}`));
  }

  function recompute(why = '') {
    state.run = SP.run(input(), { pos: state.pos, neg: state.neg });
    state.runNo++;
    state.inspect = null;
    const ok = state.run.status === 'ok';
    posEd.paint(state.pos, ok || !state.run.metadata.errors.some(e => e.seq === 'pos'));
    negEd.paint(state.neg, ok || !state.run.metadata.errors.some(e => e.seq === 'neg'));
    put(err, ...(ok ? [] : [h('strong', L('序列对不合法：', 'The sequence pair is not valid: ')), h('ul', {}, state.run.metadata.errors.map(e => h('li', e.message)))]));
    $('#sp-undo', toolbar).disabled = !state.history.length;
    runTag.textContent = L(`第 ${state.runNo} 次运行${why ? ' · ' + why : ''}`, `Run ${state.runNo}${why ? ' · ' + why : ''}`);
    trace.load(state.run.events);
    player.load(state.run.events, ok ? state.run.events.length - 1 : 0);
    root.spState = { runNo: state.runNo, pos: [...state.pos], neg: [...state.neg], rot: [...state.rot], run: state.run };
    root.dispatchEvent(new CustomEvent('sp-run', { detail: root.spState }));
  }

  function kindText(e) {
    return { validate: L('校验', 'validate'), relation: L('关系', 'relation'), graphs: L('拓扑序', 'order'), dp: e.axis === 'x' ? L('算 x', 'compute x') : L('算 y', 'compute y'), report: L('报告', 'report') }[e.kind];
  }
  function statusText(m) {
    return m.status === 'fits' ? L('装得下', 'fits') : m.status === 'overflow' ? L(`溢出（宽 +${f2(m.overflow.x)}，高 +${f2(m.overflow.y)}）`, `overflow (width +${f2(m.overflow.x)}, height +${f2(m.overflow.y)})`) : m.status === 'overlap' ? L('有重叠', 'overlap') : L('不完整', 'incomplete');
  }

  function showMetrics(e, events) {
    const rep = events.at(-1).kind === 'report' ? events.at(-1).metrics : null;
    const done = e.kind === 'report';
    if (!rep) { put(metricBox, h('p.muted', L('输入不合法：没有坐标，也没有指标。', 'Invalid input: no coordinates and no metrics.'))); return; }
    const m = rep, mark = b => (b ? '✓' : '✗');
    const row = (label, value, cls = '', note = '') => h('div', { class: cls }, h('span', label), h('strong', value), note ? h('em', note) : null);
    put(metricBox, 
      row(L('完整', 'Complete'), done ? `${mark(m.complete)} ${m.complete ? L('5 块各一次', 'each block once').replace('5', String(state.pos.length)) : ''}` : '…', done ? (m.complete ? 'ok' : 'bad') : ''),
      row(L('不重叠', 'No overlap'), done ? `${mark(m.nonOverlap)}` : '…', done ? (m.nonOverlap ? 'ok' : 'bad') : '', done ? L('序列对保证', 'guaranteed by the pair') : ''),
      row(L('装得下', 'Fits the outline'), done ? `${mark(m.fits)} ${m.fits ? '' : statusText(m)}` : '…', done ? (m.fits ? 'ok' : 'bad') : ''),
      row(L('包围盒', 'Bounding box'), done ? `${f2(m.bbox.w)} × ${f2(m.bbox.h)} = ${f2(m.bboxArea)}` : '…', '', done ? L(`空余 ${f2(m.bboxUnused)} · 利用率 ${pct(m.bboxUtil)}（随排列变化）`, `unused ${f2(m.bboxUnused)} · utilisation ${pct(m.bboxUtil)} (varies)`) : ''),
      row(L('边界', 'Outline'), `${f2(m.outlineArea)} − ${f2(m.blockArea)} = ${f2(m.outlineUnused)}`, 'const', L(`密度 ${pct(m.outlineDensity)} · 常量：与排列无关`, `density ${pct(m.outlineDensity)} · constant: independent of the pair`)));
  }

  function show(i, e, events) {
    const r = state.run, res = r.result;
    showMetrics(e, events);
    pseudoList.querySelectorAll('li').forEach(li => li.classList.toggle('on', +li.dataset.line === e.line));
    pseudo?.sp?.show([e.line], kindText(e));
    put(whyBox);
    if (e.kind === 'validate' && !e.ok) {
      statusBox.className = 'status invalid'; statusBox.textContent = L(`第 1 行：发现 ${e.errors.length} 个问题，停止。改正后会自动重新计算。`, `Line 1: ${e.errors.length} problem(s) found, stopping. Fix them and it recomputes automatically.`);
      put(detailBox, h('ul', {}, e.errors.map(x => h('li', x.message))));
      put(ribbonBox, h('p.muted', L('两个排列不是同一组块，无法比较次序。', 'The two sequences are not the same set of blocks, so orders cannot be compared.')));
      put(graphBox); put(planBox, h('p.muted', L('没有坐标。', 'No coordinates.')));
      return;
    }
    const relEvents = events.slice(0, i + 1).filter(x => x.kind === 'relation');
    const graphsKnown = events.slice(0, i + 1).some(x => x.kind === 'graphs');
    const H = graphsKnown ? res.H : relEvents.filter(x => x.graph === 'H').map(x => x.edge);
    const V = graphsKnown ? res.V : relEvents.filter(x => x.graph === 'V').map(x => x.edge);
    const reduced = { H: SP.reduceEdges(res.H), V: SP.reduceEdges(res.V) };
    const pair = e.kind === 'relation' ? [e.a, e.b] : e.kind === 'dp' ? [e.block, ...(e.chosen.from ? [e.chosen.from] : [])] : state.inspect?.pair || null;
    put(ribbonBox, ribbon({ pos: state.pos, neg: state.neg, pair }));
    const active = e.kind === 'relation' ? e.edge : e.kind === 'dp' && e.chosen.from ? { from: e.chosen.from, to: e.block } : state.inspect?.edge || null;
    put(graphBox, graphs({ pos: state.pos, neg: state.neg, H, V, active, reduced, show: e.kind === 'dp' ? (e.axis === 'x' ? 'H' : 'V') : 'both', onPick: pickEdge }));
    // floorplan: blocks appear when their x is known (y pending, dashed) and rise to their y in the second pass
    const xs = e.x, ys = e.y, dims = Object.fromEntries(modules().map(m => [m.id, m]));
    const rects = state.pos.filter(id => id in xs).map(id => ({ id, x: xs[id], y: id in ys ? ys[id] : 0, w: dims[id].w, h: dims[id].h }));
    const pending = rects.filter(rr => !(rr.id in ys)).map(rr => rr.id);
    const focus = e.kind === 'dp' ? e.block : state.inspect?.block || null;
    put(planBox, rects.length ? floorplan({ rects, outline: FX.outline, focus, pending, onPick: pickBlock, ids: state.pos, overlaps: e.kind === 'report' ? e.metrics.overlaps : [],
      title: L(`布图：${rects.map(rr => `${rr.id}(${f2(rr.x)},${rr.id in ys ? f2(rr.y) : '?'})`).join(' ')}`, `Floorplan: ${rects.map(rr => `${rr.id}(${f2(rr.x)},${rr.id in ys ? f2(rr.y) : '?'})`).join(' ')}`) })
      : h('div.sp-empty', {}, floorplan({ rects: [], outline: FX.outline }), h('p.muted', L('坐标要等第 6 行才开始算；先看每一对块的关系。', 'Coordinates start at line 6; first read the relation of every pair.'))));
    planBox.classList.toggle('no-motion', reducedMotion());

    statusBox.className = 'status';
    if (e.kind === 'validate') { statusBox.textContent = L(`第 1 行：pos、neg 都是 ${state.pos.length} 块的排列，合法。接下来看 ${state.pos.length * (state.pos.length - 1) / 2} 对块。`, `Line 1: pos and neg are both permutations of the ${state.pos.length} blocks: valid. Next, the ${state.pos.length * (state.pos.length - 1) / 2} pairs.`); put(detailBox); }
    if (e.kind === 'relation') {
      const same = e.rel === 'left';
      statusBox.textContent = L(`第 ${e.line} 行：${relSay(e.a, e.rel, e.b)} → ${e.graph} 边 ${e.a} → ${e.b}`, `Line ${e.line}: ${e.a} ${REL[e.rel]} ${e.b} → ${e.graph} edge ${e.a} → ${e.b}`);
      put(detailBox, h('table', {}, h('tbody', {},
        h('tr', {}, h('th', 'pos'), h('td', L(`${e.a} 第 ${e.posIndex[0] + 1} 位，${e.b} 第 ${e.posIndex[1] + 1} 位 → ${e.a} 在前`, `${e.a} at ${e.posIndex[0] + 1}, ${e.b} at ${e.posIndex[1] + 1} → ${e.a} first`))),
        h('tr', {}, h('th', 'neg'), h('td', L(`${e.a} 第 ${e.negIndex[0] + 1} 位，${e.b} 第 ${e.negIndex[1] + 1} 位 → ${e.a} ${same ? '在前' : '在后'}`, `${e.a} at ${e.negIndex[0] + 1}, ${e.b} at ${e.negIndex[1] + 1} → ${e.a} ${same ? 'first' : 'second'}`))),
        h('tr.chosen', {}, h('th', L('结论', 'So')), h('td', same ? L(`次序相同 → 左右：${e.a} 在 ${e.b} 左边，x[${e.b}] ≥ x[${e.a}] + ${f2(dims[e.a].w)}`, `same order → left/right: ${e.a} left of ${e.b}, x[${e.b}] ≥ x[${e.a}] + ${f2(dims[e.a].w)}`)
          : L(`次序相反 → 上下：${e.a} 在 ${e.b} 下边，y[${e.b}] ≥ y[${e.a}] + ${f2(dims[e.a].h)}`, `opposite order → below/above: ${e.a} below ${e.b}, y[${e.b}] ≥ y[${e.a}] + ${f2(dims[e.a].h)}`))))));
    }
    if (e.kind === 'graphs') {
      statusBox.textContent = L(`第 5 行：H ${res.H.length} 条边、V ${res.V.length} 条边，共 ${res.H.length + res.V.length} 条（每对一条）。按 pos 顺序处理：${e.order.join(' ')}。`, `Line 5: ${res.H.length} H edges and ${res.V.length} V edges, ${res.H.length + res.V.length} in all (one per pair). Process in pos order: ${e.order.join(' ')}.`);
      put(detailBox, h('p', L('每条边都从 pos 中靠前的块指向靠后的块，所以按 pos 顺序算，前驱总是已经算好了。', 'Every edge runs from an earlier block in pos to a later one, so in pos order every predecessor is already done.')));
    }
    if (e.kind === 'dp') {
      const sz = e.axis === 'x' ? 'w' : 'h';
      statusBox.textContent = L(`第 ${e.line} 行：${e.axis}[${e.block}] = max(0${e.candidates.map(c => `, ${f2(c.value)}`).join('')}) = ${f2(e.value)}`, `Line ${e.line}: ${e.axis}[${e.block}] = max(0${e.candidates.map(c => `, ${f2(c.value)}`).join('')}) = ${f2(e.value)}`);
      put(detailBox, e.candidates.length ? h('table', {}, h('thead', {}, h('tr', {}, h('th', L('前驱', 'Pred')), h('th', L('不等式', 'Inequality')), h('th', L('下界', 'Bound')))),
        h('tbody', {}, h('tr', { class: e.chosen.from === null ? 'chosen' : '' }, h('td', '—'), h('td', `${e.axis}[${e.block}] ≥ 0`), h('td', '0')),
          e.candidates.map(c => h('tr', { class: c.from === e.chosen.from ? 'chosen' : '' }, h('td', c.from), h('td', `${e.axis}[${e.block}] ≥ ${e.axis}[${c.from}] + ${sz}[${c.from}] = ${f2(c.coord)} + ${f2(c.size)}`), h('td', f2(c.value))))))
        : h('p', L(`${e.block} 在 ${e.axis === 'x' ? 'H' : 'V'} 图里没有前驱：${e.axis}[${e.block}] = 0。`, `${e.block} has no predecessor in ${e.axis === 'x' ? 'H' : 'V'}: ${e.axis}[${e.block}] = 0.`)),
      e.candidates.length > 1 ? h('p.small', L(`取最大的 ${f2(e.value)}${e.chosen.from ? `（来自 ${e.chosen.from}）` : ''}：每条不等式都要成立。`, `Take the largest, ${f2(e.value)}${e.chosen.from ? ` (from ${e.chosen.from})` : ''}: every inequality must hold.`)) : null);
    }
    if (e.kind === 'report') {
      const m = e.metrics;
      statusBox.className = 'status' + (m.fits ? '' : ' limit');
      statusBox.textContent = m.fits ? L(`第 8 行：完整、不重叠、装得下。包围盒 ${f2(m.bbox.w)} × ${f2(m.bbox.h)}。`, `Line 8: complete, overlap-free, fits. Bounding box ${f2(m.bbox.w)} × ${f2(m.bbox.h)}.`)
        : L(`第 8 行：完整、不重叠，但装不下：包围盒 ${f2(m.bbox.w)} × ${f2(m.bbox.h)}，边界 ${f2(FX.outline.w)} × ${f2(FX.outline.h)}。合法 ≠ 装得下。`, `Line 8: complete and overlap-free, but it does not fit: box ${f2(m.bbox.w)} × ${f2(m.bbox.h)}, outline ${f2(FX.outline.w)} × ${f2(FX.outline.h)}. Valid ≠ fits.`);
      put(detailBox, h('p', L('点击布图里的任意一块，看它的 x、y 是由哪条约束决定的；点击约束图里的边，看它从哪两个次序来。', 'Click any block in the floorplan to see which constraint sets its x and y; click an edge to see which two orders it comes from.')),
        state.rot.length ? h('p.small.muted', L(`已旋转 ${state.rot.join('、')}（拓展）：尺寸与本课标准答案不同。`, `Rotated ${state.rot.join(', ')} (extension): sizes differ from the lesson's reference.`)) : null);
    }
  }

  function dpOf(axis, id) { return state.run.events.find(x => x.kind === 'dp' && x.axis === axis && x.block === id); }
  function pickBlock(id) {
    if (state.run?.status !== 'ok') return;
    const ex = dpOf('x', id), ey = dpOf('y', id);
    const line = (e, sz) => e.chosen.from ? L(`${e.axis}[${id}] = ${f2(e.value)}：由 ${e.chosen.from} 决定，${e.axis}[${e.chosen.from}] + ${sz}[${e.chosen.from}] = ${f2(e.candidates.find(c => c.from === e.chosen.from).coord)} + ${f2(e.candidates.find(c => c.from === e.chosen.from).size)}${e.candidates.length > 1 ? `（其他前驱：${e.candidates.filter(c => c.from !== e.chosen.from).map(c => `${c.from} ${f2(c.value)}`).join('，')}）` : ''}。`,
      `${e.axis}[${id}] = ${f2(e.value)}: set by ${e.chosen.from}, ${e.axis}[${e.chosen.from}] + ${sz}[${e.chosen.from}] = ${f2(e.candidates.find(c => c.from === e.chosen.from).coord)} + ${f2(e.candidates.find(c => c.from === e.chosen.from).size)}${e.candidates.length > 1 ? ` (other predecessors: ${e.candidates.filter(c => c.from !== e.chosen.from).map(c => `${c.from} ${f2(c.value)}`).join(', ')})` : ''}.`)
      : L(`${e.axis}[${id}] = 0：${e.candidates.length ? '所有前驱的下界都不超过 0' : `在 ${e.axis === 'x' ? 'H' : 'V'} 图里没有前驱`}。`, `${e.axis}[${id}] = 0: ${e.candidates.length ? 'no predecessor pushes it past 0' : `no predecessor in ${e.axis === 'x' ? 'H' : 'V'}`}.`);
    state.inspect = { block: id, pair: [id, ...(ex.chosen.from ? [ex.chosen.from] : [])], edge: ex.chosen.from ? { from: ex.chosen.from, to: id } : null };
    put(whyBox, h('b', L(`为什么 ${id} 在这里`, `Why ${id} is here`)), h('p', line(ex, 'w')), h('p', line(ey, 'h')));
    player.go(player.i);
    put(whyBox, h('b', L(`为什么 ${id} 在这里`, `Why ${id} is here`)), h('p', line(ex, 'w')), h('p', line(ey, 'h')));
  }
  function pickEdge(e) {
    const a = e.from, b = e.to, pa = state.pos.indexOf(a) + 1, pb = state.pos.indexOf(b) + 1, na = state.neg.indexOf(a) + 1, nb = state.neg.indexOf(b) + 1;
    const dims = Object.fromEntries(modules().map(m => [m.id, m]));
    state.inspect = { pair: [a, b], edge: { from: a, to: b } };
    player.go(player.i);
    put(whyBox, h('b', `${e.graph}: ${a} → ${b}`), h('p', e.graph === 'H'
      ? L(`pos 中 ${a} 第 ${pa}、${b} 第 ${pb}；neg 中 ${a} 第 ${na}、${b} 第 ${nb}：两个序列里 ${a} 都在前 → ${a} 在 ${b} 左边。不等式 x[${b}] ≥ x[${a}] + ${f2(dims[a].w)}。`, `pos: ${a} at ${pa}, ${b} at ${pb}; neg: ${a} at ${na}, ${b} at ${nb}. ${a} comes first in both → ${a} is left of ${b}. Inequality x[${b}] ≥ x[${a}] + ${f2(dims[a].w)}.`)
      : L(`pos 中 ${a} 第 ${pa}、${b} 第 ${pb}；neg 中 ${a} 第 ${na}、${b} 第 ${nb}：pos 中 ${a} 在前、neg 中 ${a} 在后 → ${a} 在 ${b} 下边。不等式 y[${b}] ≥ y[${a}] + ${f2(dims[a].h)}。`, `pos: ${a} at ${pa}, ${b} at ${pb}; neg: ${a} at ${na}, ${b} at ${nb}. ${a} is first in pos but second in neg → ${a} is below ${b}. Inequality y[${b}] ≥ y[${a}] + ${f2(dims[a].h)}.`)));
  }

  buildToolbar();
  recompute(L('教师示例', 'instructor example'));
  root.lab = { edit, undo, state, player };  // for the walkthrough recording and browser tests
}

/* ------------------------------------------------------------------ lesson figures (rendered from the same engine) */
function figures() {
  const pack = (s, pos, neg) => SP.pack(s, pos, neg);
  const fig = {
    rule2: () => h('div.fp-row', {}, ['two-left', 'two-below'].map(id => { const s = SMALL[id], r = pack(s, s.pos, s.neg);
      return floorplan({ rects: r.rects, outline: s.outline, theme: 'paper', unit: 30, caption: `pos ${s.pos.join(' ')} · neg ${s.neg.join(' ')} → ${L(s.zh, s.en)}` }); })),
    graphs: () => { const g = PRESETS.golden, r = pack(FX, g.pos, g.neg);
      return h('div.fp-row', {}, h('figure.fp-figure', {}, ribbon({ pos: g.pos, neg: g.neg, theme: 'paper' }), h('figcaption', L('连线交叉 = 次序相反 = 上下关系：D 的线与其他四条都交叉。', 'Crossing lines = opposite orders = above/below: D’s line crosses all four others.'))),
        h('figure.fp-figure', {}, graphs({ pos: g.pos, neg: g.neg, H: r.H, V: r.V, theme: 'paper', reduced: { H: SP.reduceEdges(r.H), V: SP.reduceEdges(r.V) } }), h('figcaption', L('水平边 6 条（向右），竖直边 4 条（向上，全部指向 D）。', '6 horizontal edges (pointing right), 4 vertical ones (pointing up, all into D).')))); },
    three: () => { const s = SMALL['three-max'], r = pack(s, s.pos, s.neg);
      const wrong = r.rects.map(x => (x.id === 'B' ? { ...x, x: s.expect.wrongMinX } : x));
      const m = SP.checkPlacement(s.modules, s.outline, wrong);
      return h('div.fp-row', {}, floorplan({ rects: r.rects, outline: s.outline, theme: 'paper', unit: 30, caption: L('取最大：x[B] = max(3, 2) = 3', 'Take the max: x[B] = max(3, 2) = 3') }),
        floorplan({ rects: wrong, outline: s.outline, theme: 'paper', unit: 30, overlaps: m.overlaps, caption: L(`取最小（错误）：x[B] = 2，与 A 重叠 ${m.overlaps[0].area}`, `Take the min (wrong): x[B] = 2, overlaps A by ${m.overlaps[0].area}`) })); },
    golden: () => { const g = PRESETS.golden, r = pack(FX, g.pos, g.neg), m = r.metrics;
      return floorplan({ rects: r.rects, outline: FX.outline, theme: 'paper', unit: 32, caption: L(`pos ${g.pos.join(' ')} · neg ${g.neg.join(' ')}：包围盒 ${m.bbox.w} × ${m.bbox.h}，在 10 × 8 之内`, `pos ${g.pos.join(' ')} · neg ${g.neg.join(' ')}: bounding box ${m.bbox.w} × ${m.bbox.h}, inside 10 × 8`) }); },
    row: () => h('div.fp-row', {}, ['row', 'stack'].map(id => { const p = PRESETS[id], r = pack(FX, p.pos, p.neg), m = r.metrics;
      return floorplan({ rects: r.rects, outline: FX.outline, theme: 'paper', unit: 24, caption: L(`pos ${p.pos.join(' ')} · neg ${p.neg.join(' ')}：${m.bbox.w} × ${m.bbox.h}，不重叠但装不下`, `pos ${p.pos.join(' ')} · neg ${p.neg.join(' ')}: ${m.bbox.w} × ${m.bbox.h}, no overlap but does not fit`) }); })),
    twin: () => { const g = PRESETS.golden, t = PRESETS.twin, n = SP.neighbour(g.pos, g.neg, 'neg', 'D', 'A');
      return h('div.fp-row', {}, [[g.pos, g.neg, L('教师示例', 'instructor pair')], [t.pos, t.neg, L('pos 中交换 E、D：坐标完全相同', 'swap E, D in pos: identical coordinates')], [n.pos, n.neg, L('neg 中交换 D、A：包围盒相同，坐标不同', 'swap D, A in neg: same box, different coordinates')]]
        .map(([p, q, c]) => { const r = pack(FX, p, q); return floorplan({ rects: r.rects, outline: FX.outline, theme: 'paper', unit: 20, showCoords: false, caption: `${c} · ${p.join('')} / ${q.join('')}` }); })); }
  };
  for (const el of $$('.fp-fig[data-fig]')) {
    try { put(el, fig[el.dataset.fig]()); } catch (e) { console.error(e); el.textContent = L('图示加载失败。', 'The figure failed to load.'); }
  }
}

figures();
bootModule({ moduleId: 'm06-sequence-pair', display: 'Module 06', challenges, lab, visualize });
