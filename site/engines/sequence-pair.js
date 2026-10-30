// Sequence-pair engine (Module 06). Pure functions, no DOM: the lab, the challenge validators, the film traces and the
// Node tests all call this one file.
//
// Convention (the instructor's common/pack.py): origin lower-left, x to the right, y upward.
//   i before j in pos AND before j in neg  →  i is LEFT of j   (H edge i→j:  x[j] ≥ x[i] + w[i])
//   i before j in pos AND after  j in neg  →  i is BELOW j     (V edge i→j:  y[j] ≥ y[i] + h[i])
// Coordinates are the smallest ones that satisfy every edge: longest paths, computed by dynamic programming in pos order
// (a topological order of both graphs, because every edge i→j has pos(i) < pos(j)). O(n²) pairs; O(n²) DP.
import { L } from '../assets/i18n.js';

export const ENGINE = { id: 'sequence-pair', version: 1 };
/** Pseudocode line numbers, shared with the lesson's ```pseudo sp``` block and the Python reference. */
export const LINES = { validate: 1, pairs: 2, left: 3, below: 4, order: 5, x: 6, y: 7, report: 8 };

const err = (code, zh, en, extra = {}) => ({ code, message: L(zh, en), zh, en, ...extra });
const finitePos = v => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * The input boundary. The instructor's JSON writes the outline as {W, H}; its helpers read {w, h}. Both are accepted
 * here, once, and the rest of the engine only sees {w, h}. Conflicting spellings are an error, never a silent pick.
 */
export function normalizeInput(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { errors: [err('input', '输入必须是一个对象。', 'The input must be an object.')] };
  const o = raw.outline ?? null;
  let outline = null;
  if (o === null || typeof o !== 'object') errors.push(err('outline-missing', '缺少 outline（固定边界）。', 'The outline is missing.'));
  else {
    const pick = (lo, up, name) => {
      const a = o[lo], b = o[up];
      if (a !== undefined && b !== undefined && a !== b) { errors.push(err('outline-conflict', `outline 同时写了 ${lo}=${a} 与 ${up}=${b}。`, `The outline gives both ${lo}=${a} and ${up}=${b}.`)); return NaN; }
      const v = a ?? b;
      if (v === undefined) { errors.push(err('outline-missing', `outline 缺少${name === 'w' ? '宽度 w/W' : '高度 h/H'}。`, `The outline has no ${name === 'w' ? 'width w/W' : 'height h/H'}.`)); return NaN; }
      if (!finitePos(v)) { errors.push(err('outline-bad', `outline 的${name === 'w' ? '宽度' : '高度'}必须是正的有限数，得到 ${JSON.stringify(v)}。`, `The outline ${name === 'w' ? 'width' : 'height'} must be a positive finite number; got ${JSON.stringify(v)}.`)); return NaN; }
      return v;
    };
    const w = pick('w', 'W', 'w'), h = pick('h', 'H', 'h');
    outline = { w, h };
  }
  const modules = [];
  if (!Array.isArray(raw.modules) || raw.modules.length === 0) errors.push(err('modules-missing', '缺少模块列表。', 'The module list is missing or empty.'));
  else {
    const seen = new Set();
    raw.modules.forEach((m, k) => {
      const id = m?.id;
      if (typeof id !== 'string' || !id) { errors.push(err('module-id', `第 ${k + 1} 个模块没有 id。`, `Module ${k + 1} has no id.`)); return; }
      if (seen.has(id)) errors.push(err('module-dup', `模块 ${id} 重复出现。`, `Module ${id} appears twice.`, { id }));
      seen.add(id);
      for (const d of ['w', 'h']) if (!finitePos(m[d])) errors.push(err('module-dim', `模块 ${id} 的 ${d} 必须是正的有限数，得到 ${JSON.stringify(m[d])}。`, `Module ${id}: ${d} must be a positive finite number; got ${JSON.stringify(m[d])}.`, { id }));
      modules.push({ id, w: m.w, h: m.h });
    });
  }
  return { outline, modules, errors };
}

/** pos and neg must each be a permutation of exactly the module ids. Every problem is listed, not just the first. */
export function validatePair(pos, neg, ids) {
  const errors = [];
  const idSet = new Set(ids);
  for (const [name, seq] of [['pos', pos], ['neg', neg]]) {
    if (!Array.isArray(seq)) { errors.push(err('seq-type', `${name} 必须是序列。`, `${name} must be a sequence.`, { seq: name })); continue; }
    const count = new Map();
    for (const id of seq) count.set(id, (count.get(id) || 0) + 1);
    for (const [id, c] of count) {
      if (!idSet.has(id)) errors.push(err('seq-unknown', `${name} 里有未知模块 ${id}。`, `${name} contains an unknown module ${id}.`, { seq: name, id }));
      else if (c > 1) errors.push(err('seq-repeat', `${name} 里 ${id} 出现了 ${c} 次。`, `${name} lists ${id} ${c} times.`, { seq: name, id }));
    }
    for (const id of ids) if (!count.has(id)) errors.push(err('seq-missing', `${name} 缺少模块 ${id}。`, `${name} is missing module ${id}.`, { seq: name, id }));
  }
  if (Array.isArray(pos) && Array.isArray(neg) && pos.length !== neg.length) errors.push(err('seq-length', `pos 有 ${pos.length} 项，neg 有 ${neg.length} 项。`, `pos has ${pos.length} entries but neg has ${neg.length}.`));
  return errors;
}

/** The relation of a to b: 'left' (a left of b), 'right', 'below' (a below b) or 'above'. */
export function relation(pos, neg, a, b) {
  const pa = pos.indexOf(a), pb = pos.indexOf(b), na = neg.indexOf(a), nb = neg.indexOf(b);
  if (pa < 0 || pb < 0 || na < 0 || nb < 0 || a === b) return null;
  if (pa < pb) return na < nb ? 'left' : 'below';
  return na > nb ? 'right' : 'above';
}
export const REL_TEXT = {
  left: L('在左', 'left of'), right: L('在右', 'right of'), below: L('在下', 'below'), above: L('在上', 'above')
};

/** Horizontal and vertical constraint graphs: one edge for every pair of blocks (implied edges included). */
export function buildGraphs(pos, neg) {
  const H = [], V = [];
  for (let s = 0; s < pos.length; s++) for (let t = s + 1; t < pos.length; t++) {
    const i = pos[s], j = pos[t];
    (neg.indexOf(i) < neg.indexOf(j) ? H : V).push({ from: i, to: j });
  }
  return { H, V };
}

/** Edges that are not implied by a longer path (for drawing; the DP uses every edge). */
export function reduceEdges(edges) {
  const succ = new Map();
  for (const e of edges) { if (!succ.has(e.from)) succ.set(e.from, new Set()); succ.get(e.from).add(e.to); }
  const reach = (a, b, skip) => { // is b reachable from a without using the direct edge `skip`?
    const stack = [...(succ.get(a) || [])].filter(x => !(a === skip.from && x === skip.to)), seen = new Set();
    while (stack.length) { const x = stack.pop(); if (x === b) return true; if (seen.has(x)) continue; seen.add(x); stack.push(...(succ.get(x) || [])); }
    return false;
  };
  return edges.map(e => ({ ...e, implied: reach(e.from, e.to, e) }));
}

/** Geometry checks on any placement: completeness, positive-area overlaps, outline fit, bounding box and areas. */
export function checkPlacement(modules, outline, rects) {
  const ids = modules.map(m => m.id);
  const placed = rects.map(r => r.id);
  const missing = ids.filter(id => !placed.includes(id));
  const extra = placed.filter(id => !ids.includes(id));
  const repeated = [...new Set(placed.filter((id, k) => placed.indexOf(id) !== k))];
  const complete = !missing.length && !extra.length && !repeated.length;
  const overlaps = [];
  for (let a = 0; a < rects.length; a++) for (let b = a + 1; b < rects.length; b++) {
    const p = rects[a], q = rects[b];
    const ox = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), oy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
    if (ox > 0 && oy > 0) overlaps.push({ a: p.id, b: q.id, area: ox * oy }); // touching edges (ox or oy = 0) are allowed
  }
  const outside = rects.filter(r => r.x < 0 || r.y < 0 || r.x + r.w > outline.w || r.y + r.h > outline.h).map(r => r.id);
  const bw = rects.length ? Math.max(...rects.map(r => r.x + r.w)) - Math.min(0, ...rects.map(r => r.x)) : 0;
  const bh = rects.length ? Math.max(...rects.map(r => r.y + r.h)) - Math.min(0, ...rects.map(r => r.y)) : 0;
  const blockArea = modules.reduce((s, m) => s + m.w * m.h, 0), outlineArea = outline.w * outline.h, bboxArea = bw * bh;
  const nonOverlap = overlaps.length === 0;
  const fits = complete && nonOverlap && outside.length === 0;
  return {
    complete, missing, extra, repeated, nonOverlap, overlaps, outside, fits,
    status: !complete ? 'incomplete' : !nonOverlap ? 'overlap' : fits ? 'fits' : 'overflow',
    bbox: { w: bw, h: bh }, overflow: { x: Math.max(0, bw - outline.w), y: Math.max(0, bh - outline.h) },
    // Constant for a fixed module set and a fixed outline, whatever the sequence pair:
    blockArea, outlineArea, outlineUnused: outlineArea - blockArea, outlineDensity: blockArea / outlineArea,
    // These change with the sequence pair:
    bboxArea, bboxUnused: bboxArea - blockArea, bboxUtil: bboxArea ? blockArea / bboxArea : 0
  };
}

/**
 * Pack a sequence pair. Returns { status, events, result, metadata }. status: 'ok' | 'invalid'.
 * events (the trace every view replays):
 *   validate  { ok, errors }                                  line 1
 *   relation  { a, b, rel, graph, edge }                      lines 2–4, one per pair (a before b in pos)
 *   graphs    { H, V }                                        line 5 (with the pos order)
 *   dp        { axis, block, candidates, chosen, value }      line 6 (x) or 7 (y), one per block per axis
 *   report    { metrics }                                     line 8
 * Each event carries `line` and a snapshot `x`, `y` of the coordinates fixed so far.
 */
export function run(rawInput, { pos, neg } = {}) {
  const input = normalizeInput(rawInput);
  const ids = input.modules?.map(m => m.id) || [];
  const errors = [...input.errors, ...(input.errors.length ? [] : validatePair(pos, neg, ids))];
  const events = [];
  const snap = (x, y) => ({ x: { ...x }, y: { ...y } });
  events.push({ kind: 'validate', line: LINES.validate, ok: !errors.length, errors, ...snap({}, {}) });
  if (errors.length) return { status: 'invalid', events, result: null, metadata: { engine: ENGINE, errors } };

  const dim = Object.fromEntries(input.modules.map(m => [m.id, m]));
  const { H, V } = buildGraphs(pos, neg);
  for (let s = 0; s < pos.length; s++) for (let t = s + 1; t < pos.length; t++) {
    const a = pos[s], b = pos[t], rel = relation(pos, neg, a, b);
    events.push({ kind: 'relation', line: rel === 'left' ? LINES.left : LINES.below, a, b, rel, graph: rel === 'left' ? 'H' : 'V', edge: { from: a, to: b },
      posIndex: [s, t], negIndex: [neg.indexOf(a), neg.indexOf(b)], ...snap({}, {}) });
  }
  const order = [...pos];
  events.push({ kind: 'graphs', line: LINES.order, H, V, order, ...snap({}, {}) });

  const x = {}, y = {};
  for (const [axis, edges, coord, size, line] of [['x', H, x, 'w', LINES.x], ['y', V, y, 'h', LINES.y]]) {
    for (const j of order) {
      const candidates = edges.filter(e => e.to === j).map(e => ({ from: e.from, coord: coord[e.from], size: dim[e.from][size], value: coord[e.from] + dim[e.from][size] }));
      let chosen = { from: null, value: 0 };
      for (const c of candidates) if (c.value > chosen.value) chosen = { from: c.from, value: c.value }; // maximum, not minimum: every edge must hold
      coord[j] = chosen.value;
      events.push({ kind: 'dp', line, axis, block: j, candidates, chosen, value: chosen.value, ...snap(x, y) });
    }
  }
  const rects = order.map(id => ({ id, x: x[id], y: y[id], w: dim[id].w, h: dim[id].h }));
  const metrics = checkPlacement(input.modules, input.outline, rects);
  events.push({ kind: 'report', line: LINES.report, metrics, ...snap(x, y) });
  return { status: 'ok', events, result: { pos: [...pos], neg: [...neg], x, y, rects, H, V, order, metrics, outline: input.outline, modules: input.modules },
    metadata: { engine: ENGINE, pairs: H.length + V.length } };
}

/** Coordinates only (for search, enumeration and challenges). Throws on invalid input. */
export function pack(rawInput, pos, neg) {
  const r = run(rawInput, { pos, neg });
  if (r.status !== 'ok') throw new Error(r.metadata.errors.map(e => e.message).join('; '));
  return r.result;
}

/** Same coordinates for every block? (two pairs can encode the same packing) */
export function samePacking(a, b) {
  return a.rects.length === b.rects.length && a.rects.every(r => a.x[r.id] === b.x[r.id] && a.y[r.id] === b.y[r.id]);
}

/** Neighbour moves used by annealing-style search (an extension): swap two blocks in pos, in neg, or in both. */
export function neighbour(pos, neg, move, i, j) {
  const p = [...pos], n = [...neg];
  const sw = (s, a, b) => { const u = s.indexOf(a), v = s.indexOf(b); [s[u], s[v]] = [s[v], s[u]]; };
  if (move === 'pos' || move === 'both') sw(p, i, j);
  if (move === 'neg' || move === 'both') sw(n, i, j);
  return { pos: p, neg: n };
}

/** All permutations (small n only: the five-block example has 120, so 14,400 pairs). */
export function permutations(items) {
  if (items.length <= 1) return [items.slice()];
  const out = [];
  items.forEach((it, k) => { for (const rest of permutations([...items.slice(0, k), ...items.slice(k + 1)])) out.push([it, ...rest]); });
  return out;
}
