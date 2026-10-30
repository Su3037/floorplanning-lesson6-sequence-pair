// SVG views of the sequence-pair state: floorplan, permutation ribbon, oblique-grid constraint graphs.
// Geometry stays in the original units: the drawing scales to the screen, the coordinates never shrink to hide an overflow.
// Mathematical y points up; SVG y points down, so every view converts with sy() and nothing else.
import { h, L } from './core.js';

export const BLOCK_COLORS = { A: '#77cdbb', B: '#8fb1e6', C: '#d8bb78', D: '#e39fb8', E: '#c2a6e6' };
const EXTRA = ['#9fd27f', '#7fd0e0', '#d58f62', '#a3b26f', '#ddbd78'];
export const colorOf = (id, k = 0) => BLOCK_COLORS[id] || EXTRA[k % EXTRA.length];
export const H_COLOR = '#76cbb5', V_COLOR = '#ddbd78';

const fmt = v => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));

/**
 * Floorplan in units. opts: rects [{id,x,y,w,h}], outline {w,h}, focus id, faint ids, overlaps [{a,b}], pending (ids whose y is not known yet),
 * onPick(id), theme 'dark' | 'paper', title, unit px, showCoords.
 */
export function floorplan({ rects, outline, focus = null, faint = [], overlaps = [], pending = [], onPick = null, theme = 'dark', title = '', unit = 34, showCoords = true, ids = null, caption = null }) {
  const maxX = Math.max(outline.w, ...rects.map(r => r.x + r.w)), maxY = Math.max(outline.h, ...rects.map(r => r.y + r.h));
  const left = 30, bottom = 26, top = 14, right = 14;
  const W = left + maxX * unit + right, Hh = top + maxY * unit + bottom;
  const sx = x => left + x * unit, sy = y => top + (maxY - y) * unit;
  const ink = theme === 'dark' ? '#ece8dc' : '#1b2320', grid = theme === 'dark' ? '#1f3a40' : '#e3dccd', muted = theme === 'dark' ? '#8fa3a3' : '#5b665f';
  const svg = h('svg', { viewBox: `0 0 ${W} ${Hh}`, class: `fp fp-${theme}`, role: 'img', 'aria-label': title || L('布图', 'Floorplan') });
  if (title) svg.append(h('title', title));
  const g = h('g');
  for (let i = 0; i <= maxX; i++) g.append(h('line', { x1: sx(i), y1: sy(0), x2: sx(i), y2: sy(maxY), stroke: grid, 'stroke-width': i % 5 ? 0.6 : 1 }));
  for (let j = 0; j <= maxY; j++) g.append(h('line', { x1: sx(0), y1: sy(j), x2: sx(maxX), y2: sy(j), stroke: grid, 'stroke-width': j % 5 ? 0.6 : 1 }));
  for (let i = 0; i <= maxX; i += (maxX > 12 ? 2 : 1)) g.append(h('text', { x: sx(i), y: sy(0) + 17, 'text-anchor': 'middle', fill: muted, class: 'fp-axis' }, String(i)));
  for (let j = 0; j <= maxY; j += (maxY > 12 ? 2 : 1)) g.append(h('text', { x: sx(0) - 8, y: sy(j) + 4, 'text-anchor': 'end', fill: muted, class: 'fp-axis' }, String(j)));
  // fixed outline; the area beyond it is shaded when a block crosses it
  if (maxX > outline.w) g.append(h('rect', { x: sx(outline.w), y: sy(maxY), width: (maxX - outline.w) * unit, height: maxY * unit, fill: '#db7b72', 'fill-opacity': 0.09 }));
  if (maxY > outline.h) g.append(h('rect', { x: sx(0), y: sy(maxY), width: outline.w * unit, height: (maxY - outline.h) * unit, fill: '#db7b72', 'fill-opacity': 0.09 }));
  g.append(h('rect', { x: sx(0), y: sy(outline.h), width: outline.w * unit, height: outline.h * unit, fill: 'none', stroke: theme === 'dark' ? '#e2d2aa' : '#946a17', 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }));
  g.append(h('text', { x: sx(outline.w) - 4, y: sy(outline.h) - 5, 'text-anchor': 'end', fill: theme === 'dark' ? '#e2d2aa' : '#946a17', class: 'fp-axis' }, L(`边界 ${fmt(outline.w)} × ${fmt(outline.h)}`, `outline ${fmt(outline.w)} × ${fmt(outline.h)}`)));
  const order = ids || rects.map(r => r.id);
  for (const r of rects) {
    const k = order.indexOf(r.id), col = colorOf(r.id, k), isFaint = faint.includes(r.id), isPending = pending.includes(r.id);
    const out = r.x + r.w > outline.w || r.y + r.h > outline.h || r.x < 0 || r.y < 0;
    const grp = h('g', { class: 'fp-block' + (onPick ? ' pick' : '') + (focus === r.id ? ' on' : ''), 'data-id': r.id, tabindex: onPick ? 0 : null, role: onPick ? 'button' : null,
      'aria-label': onPick ? L(`${r.id}：x ${fmt(r.x)}，y ${isPending ? '待定' : fmt(r.y)}，${fmt(r.w)} × ${fmt(r.h)}`, `${r.id}: x ${fmt(r.x)}, y ${isPending ? 'pending' : fmt(r.y)}, ${fmt(r.w)} × ${fmt(r.h)}`) : null,
      onclick: onPick ? () => onPick(r.id) : null, onkeydown: onPick ? ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onPick(r.id); } } : null,
      style: `transform:translate(${sx(r.x)}px,${sy(r.y + r.h)}px)` },
    h('rect', { x: 0, y: 0, width: r.w * unit, height: r.h * unit, rx: 3, fill: col, 'fill-opacity': isFaint ? 0.08 : isPending ? 0.18 : 0.34, stroke: out ? '#db7b72' : col, 'stroke-width': focus === r.id ? 3 : 1.6, 'stroke-dasharray': isPending ? '5 4' : null }),
    h('text', { x: r.w * unit / 2, y: r.h * unit / 2 + (showCoords && r.h * unit > 40 ? -2 : 6), 'text-anchor': 'middle', fill: ink, class: 'fp-id' }, r.id),
    showCoords && r.h * unit > 40 ? h('text', { x: r.w * unit / 2, y: r.h * unit / 2 + 15, 'text-anchor': 'middle', fill: muted, class: 'fp-xy' }, isPending ? `(${fmt(r.x)}, ?)` : `(${fmt(r.x)}, ${fmt(r.y)})`) : null);
    g.append(grp);
  }
  for (const o of overlaps) {
    const p = rects.find(r => r.id === o.a), q = rects.find(r => r.id === o.b);
    if (!p || !q) continue;
    const x0 = Math.max(p.x, q.x), x1 = Math.min(p.x + p.w, q.x + q.w), y0 = Math.max(p.y, q.y), y1 = Math.min(p.y + p.h, q.y + q.h);
    g.append(h('rect', { x: sx(x0), y: sy(y1), width: (x1 - x0) * unit, height: (y1 - y0) * unit, fill: '#db7b72', 'fill-opacity': 0.75, stroke: '#a33b3b', 'stroke-width': 1.5 }));
  }
  svg.append(g);
  return caption ? h('figure.fp-figure', {}, svg, h('figcaption', caption)) : svg;
}

/** Two rows (pos on top, neg below) with one line per block; two blocks' lines cross exactly when their orders differ (above / below). */
export function ribbon({ pos, neg, pair = null, onPick = null, theme = 'dark', title = '' }) {
  const n = pos.length, gap = 64, W = Math.max(320, 70 + (n - 1) * gap + 40), top = 34, bottom = 132;
  const xp = i => 60 + i * gap;
  const ink = theme === 'dark' ? '#ece8dc' : '#1b2320', muted = theme === 'dark' ? '#8fa3a3' : '#5b665f';
  const svg = h('svg', { viewBox: `0 0 ${W} 168`, class: `fp fp-${theme}`, role: 'img', 'aria-label': title || L(`pos ${pos.join(' ')}；neg ${neg.join(' ')}`, `pos ${pos.join(' ')}; neg ${neg.join(' ')}`) });
  svg.append(h('text', { x: 8, y: top + 5, fill: muted, class: 'fp-axis' }, 'pos'), h('text', { x: 8, y: bottom + 5, fill: muted, class: 'fp-axis' }, 'neg'));
  pos.forEach((id, i) => {
    const j = neg.indexOf(id); if (j < 0) return;
    const on = pair && pair.includes(id);
    svg.append(h('path', { d: `M${xp(i)} ${top + 14} C ${xp(i)} ${(top + bottom) / 2}, ${xp(j)} ${(top + bottom) / 2}, ${xp(j)} ${bottom - 14}`, fill: 'none', stroke: colorOf(id, i), 'stroke-width': on ? 4 : 1.8, 'stroke-opacity': pair && !on ? 0.25 : 0.9 }));
  });
  const chip = (id, x, y, k) => {
    const on = pair && pair.includes(id);
    return h('g', { class: 'fp-chip' + (onPick ? ' pick' : ''), onclick: onPick ? () => onPick(id) : null },
      h('rect', { x: x - 17, y: y - 15, width: 34, height: 28, rx: 5, fill: theme === 'dark' ? '#0b2029' : '#fffdf8', stroke: colorOf(id, k), 'stroke-width': on ? 3 : 1.4 }),
      h('text', { x, y: y + 5, 'text-anchor': 'middle', fill: ink, class: 'fp-id' }, id));
  };
  pos.forEach((id, i) => svg.append(chip(id, xp(i), top, i)));
  neg.forEach((id, i) => svg.append(chip(id, xp(i), bottom, pos.indexOf(id))));
  return svg;
}

/**
 * Constraint graphs on the oblique grid: block b sits at (p + n, p − n) where p, n are its indices in pos and neg. With this
 * course's convention every H edge then points right (teal) and every V edge points up (gold): the sequence pair *is* a picture.
 */
export function graphs({ pos, neg, H, V, active = null, show = 'both', onPick = null, theme = 'dark', title = '', reduced = null }) {
  const n = pos.length, cell = 46, pad = 40;
  const P = id => [pos.indexOf(id) + neg.indexOf(id), pos.indexOf(id) - neg.indexOf(id)];
  const xs = pos.map(id => P(id)[0]), ys = pos.map(id => P(id)[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = pad * 2 + (maxX - minX) * cell, Hh = pad * 2 + (maxY - minY) * cell + 18;
  const sx = id => pad + (P(id)[0] - minX) * cell, sy = id => pad + (maxY - P(id)[1]) * cell;
  const ink = theme === 'dark' ? '#ece8dc' : '#1b2320', muted = theme === 'dark' ? '#8fa3a3' : '#5b665f';
  const svg = h('svg', { viewBox: `0 0 ${Math.max(W, 220)} ${Hh}`, class: `fp fp-${theme}`, role: 'img', 'aria-label': title || L(`约束图：水平 ${H.length} 条边，竖直 ${V.length} 条边`, `Constraint graphs: ${H.length} horizontal and ${V.length} vertical edges`) });
  const defs = h('defs');
  for (const [k, c] of [['h', H_COLOR], ['v', V_COLOR], ['a', '#ffffff']]) defs.append(h('marker', { id: `fp-arrow-${k}-${theme}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, h('path', { d: 'M0 0 L10 5 L0 10 z', fill: c })));
  svg.append(defs);
  const isImplied = (e, kind) => reduced?.[kind]?.find(r => r.from === e.from && r.to === e.to)?.implied;
  const edge = (e, kind) => {
    const on = active && active.from === e.from && active.to === e.to;
    const x1 = sx(e.from), y1 = sy(e.from), x2 = sx(e.to), y2 = sy(e.to), d = Math.hypot(x2 - x1, y2 - y1) || 1, r = 17;
    const col = kind === 'H' ? H_COLOR : V_COLOR;
    return h('line', { x1: x1 + (x2 - x1) * r / d, y1: y1 + (y2 - y1) * r / d, x2: x2 - (x2 - x1) * (r + 3) / d, y2: y2 - (y2 - y1) * (r + 3) / d,
      stroke: on ? '#ffffff' : col, 'stroke-width': on ? 3 : 1.6, 'stroke-opacity': active && !on ? 0.35 : 0.9, 'stroke-dasharray': isImplied(e, kind) ? '4 4' : null,
      'marker-end': `url(#fp-arrow-${on ? 'a' : kind.toLowerCase()}-${theme})`, class: onPick ? 'pick' : null, onclick: onPick ? () => onPick({ ...e, graph: kind }) : null },
    h('title', `${kind}: ${e.from} → ${e.to}`));
  };
  if (show !== 'V') H.forEach(e => svg.append(edge(e, 'H')));
  if (show !== 'H') V.forEach(e => svg.append(edge(e, 'V')));
  pos.forEach((id, k) => {
    const on = active && (active.from === id || active.to === id);
    svg.append(h('g', {}, h('circle', { cx: sx(id), cy: sy(id), r: 16, fill: theme === 'dark' ? '#0b2029' : '#fffdf8', stroke: colorOf(id, k), 'stroke-width': on ? 3.2 : 1.8 }),
      h('text', { x: sx(id), y: sy(id) + 5, 'text-anchor': 'middle', fill: ink, class: 'fp-id' }, id)));
  });
  svg.append(h('text', { x: 10, y: Hh - 8, fill: muted, class: 'fp-axis' }, L('青 → 水平边 H（在左）· 金 ↑ 竖直边 V（在下）· 虚线：可由更长路径推出', 'teal → horizontal H (left of) · gold ↑ vertical V (below) · dashed: implied by a longer path')));
  return svg;
}
