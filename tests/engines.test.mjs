// Engine regression, properties and malformed-input tests for site/engines/sequence-pair.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as SP from '../site/engines/sequence-pair.js';

const DATA = JSON.parse(fs.readFileSync(new URL('../fixtures/sequence-pair.json', import.meta.url)));
const FX = { outline: DATA.fixture.outline, modules: DATA.fixture.modules };
const P = Object.fromEntries(DATA.presets.map(p => [p.id, p]));
const S = Object.fromEntries(DATA.small.map(p => [p.id, p]));
const IDS = FX.modules.map(m => m.id);
const codes = r => r.metadata.errors.map(e => e.code).sort();

test('the four relations under the declared convention', () => {
  assert.equal(SP.relation(['A', 'B'], ['A', 'B'], 'A', 'B'), 'left');
  assert.equal(SP.relation(['A', 'B'], ['A', 'B'], 'B', 'A'), 'right');
  assert.equal(SP.relation(['A', 'B'], ['B', 'A'], 'A', 'B'), 'below');
  assert.equal(SP.relation(['A', 'B'], ['B', 'A'], 'B', 'A'), 'above');
  for (const id of ['two-left', 'two-below', 'three-max']) {
    const s = S[id], r = SP.pack(s, s.pos, s.neg);
    assert.deepEqual(r.x, s.expect.x, id); assert.deepEqual(r.y, s.expect.y, id);
  }
});

test('golden: instructor pair gives the verified coordinates and metrics', () => {
  const g = P.golden, r = SP.pack(FX, g.pos, g.neg), m = r.metrics, e = g.expect;
  assert.deepEqual(r.x, e.x); assert.deepEqual(r.y, e.y);
  assert.deepEqual([m.bbox.w, m.bbox.h], e.bbox);
  assert.equal(m.blockArea, 23); assert.equal(m.outlineArea, 80); assert.equal(m.outlineUnused, 57); assert.equal(m.outlineDensity, 0.2875);
  assert.equal(m.bboxArea, 36); assert.equal(m.bboxUnused, 13); assert.ok(Math.abs(m.bboxUtil - 23 / 36) < 1e-12);
  assert.ok(m.complete && m.nonOverlap && m.fits); assert.equal(m.status, 'fits');
  // upstream GOLDEN_PACK puts D at y=2: a different, illustrative placement, not this pair's output
  assert.notEqual(r.y.D, 2);
});

test('graphs: one edge per pair, implied edges kept, V = {A,B,C,E}→D for the golden pair', () => {
  const g = P.golden, { H, V } = SP.buildGraphs(g.pos, g.neg);
  assert.equal(H.length + V.length, 10);
  assert.deepEqual(V.map(e => e.from + e.to).sort(), ['AD', 'BD', 'CD', 'ED']);
  const red = SP.reduceEdges(H);
  assert.ok(red.find(e => e.from === 'A' && e.to === 'E').implied);
  assert.ok(!red.find(e => e.from === 'A' && e.to === 'B').implied);
});

test('DP takes the maximum over predecessors and adds the predecessor size', () => {
  const s = S['three-max'], r = SP.run(s, { pos: s.pos, neg: s.neg });
  const dpB = r.events.find(e => e.kind === 'dp' && e.axis === 'x' && e.block === 'B');
  assert.deepEqual(dpB.candidates.map(c => [c.from, c.value]), [['A', 3], ['C', 2]]);
  assert.equal(dpB.value, 3); assert.equal(dpB.chosen.from, 'A');
  assert.equal(s.expect.wrongMinX, Math.min(...dpB.candidates.map(c => c.value)));
  // the wrong (minimum) answer overlaps A
  const bad = SP.checkPlacement(s.modules, s.outline, [{ id: 'A', x: 0, y: 0, w: 3, h: 2 }, { id: 'C', x: 0, y: 2, w: 2, h: 2 }, { id: 'B', x: 2, y: 0, w: 2, h: 3 }]);
  assert.equal(bad.status, 'overlap');
});

test('trace shape: validate, n(n-1)/2 relations, graphs, 2n dp, report; snapshots grow monotonically', () => {
  const g = P.golden, r = SP.run(FX, { pos: g.pos, neg: g.neg });
  const kinds = r.events.map(e => e.kind);
  assert.equal(kinds[0], 'validate'); assert.equal(kinds.at(-1), 'report');
  assert.equal(kinds.filter(k => k === 'relation').length, 10);
  assert.equal(kinds.filter(k => k === 'dp').length, 10);
  for (const e of r.events.filter(e => e.kind === 'dp')) {
    assert.equal(e[e.axis][e.block], e.value);
    assert.equal(e.line, e.axis === 'x' ? SP.LINES.x : SP.LINES.y);
    for (const c of e.candidates) assert.ok(c.value <= e.value);
  }
  for (const e of r.events.filter(e => e.kind === 'relation')) assert.equal(e.rel, SP.relation(g.pos, g.neg, e.a, e.b));
});

test('touching edges are allowed; positive-area intersection is overlap; empty is incomplete', () => {
  const s = S['two-left'];
  assert.equal(SP.checkPlacement(s.modules, s.outline, [{ id: 'A', x: 0, y: 0, w: 3, h: 2 }, { id: 'B', x: 3, y: 0, w: 2, h: 3 }]).status, 'fits');
  assert.equal(SP.checkPlacement(s.modules, s.outline, [{ id: 'A', x: 0, y: 0, w: 3, h: 2 }, { id: 'B', x: 2.5, y: 0, w: 2, h: 3 }]).status, 'overlap');
  const empty = SP.checkPlacement(FX.modules, FX.outline, []);
  assert.equal(empty.status, 'incomplete'); assert.ok(!empty.fits); assert.ok(empty.nonOverlap);
  const partial = SP.checkPlacement(FX.modules, FX.outline, [{ id: 'A', x: 0, y: 0, w: 3, h: 2 }]);
  assert.deepEqual(partial.missing, ['B', 'C', 'D', 'E']); assert.ok(!partial.fits);
});

test('valid but overflowing pairs', () => {
  for (const id of ['row', 'stack']) {
    const p = P[id], m = SP.pack(FX, p.pos, p.neg).metrics;
    assert.ok(m.complete && m.nonOverlap && !m.fits, id); assert.equal(m.status, 'overflow');
    assert.deepEqual([m.bbox.w, m.bbox.h], p.expect.bbox); assert.deepEqual([m.overflow.x, m.overflow.y], p.expect.overflow);
  }
});

test('two different pairs can encode the same packing (exactly three for the golden one)', () => {
  const g = SP.pack(FX, P.golden.pos, P.golden.neg), t = SP.pack(FX, P.twin.pos, P.twin.neg);
  assert.ok(SP.samePacking(g, t));
  const perms = SP.permutations(IDS);
  let same = 0;
  for (const a of perms) for (const b of perms) if (SP.samePacking(g, SP.pack(FX, a, b))) same++;
  assert.equal(same, 3);
});

test('exhaustive: 14,400 pairs, all overlap-free, 13,680 fit; outline metrics constant, bbox varies', () => {
  const perms = SP.permutations(IDS);
  let n = 0, fit = 0, minArea = Infinity;
  const unused = new Set(), dens = new Set(), boxes = new Set();
  for (const a of perms) for (const b of perms) {
    const m = SP.pack(FX, a, b).metrics; n++;
    assert.ok(m.complete && m.nonOverlap);
    fit += m.fits; unused.add(m.outlineUnused); dens.add(m.outlineDensity); boxes.add(m.bboxArea); minArea = Math.min(minArea, m.bboxArea);
  }
  assert.equal(n, 14400); assert.equal(fit, 13680);
  assert.deepEqual([...unused], [57]); assert.deepEqual([...dens], [0.2875]);
  assert.ok(boxes.size > 5); assert.equal(minArea, 24);
  const t = SP.pack(FX, P.tight.pos, P.tight.neg).metrics; assert.equal(t.bboxArea, 24);
});

test('mirrored textbook convention ("before in pos, after in neg → above") equals this convention with pos and neg swapped', () => {
  const mirrored = (pos, neg, mods) => { // independent implementation of the other convention
    const d = Object.fromEntries(mods.map(m => [m.id, m])), x = {}, y = {};
    const order = [...neg]; // a topological order for both graphs in the mirrored convention
    for (const j of order) {
      x[j] = Math.max(0, ...pos.filter(i => i !== j && pos.indexOf(i) < pos.indexOf(j) && neg.indexOf(i) < neg.indexOf(j)).map(i => x[i] + d[i].w));
      y[j] = Math.max(0, ...pos.filter(i => i !== j && pos.indexOf(i) > pos.indexOf(j) && neg.indexOf(i) < neg.indexOf(j)).map(i => y[i] + d[i].h));
    }
    return { x, y };
  };
  const perms = SP.permutations(IDS);
  for (let k = 0; k < 400; k++) {
    const a = perms[(k * 37) % 120], b = perms[(k * 53 + 11) % 120];
    const m = mirrored(a, b, FX.modules), r = SP.pack(FX, b, a);
    assert.deepEqual(r.x, m.x); assert.deepEqual(r.y, m.y);
  }
});

test('malformed inputs are rejected with specific codes', () => {
  const g = P.golden;
  assert.deepEqual(codes(SP.run(FX, { pos: ['A', 'B', 'C', 'E'], neg: g.neg })), ['seq-length', 'seq-missing']);
  assert.deepEqual(codes(SP.run(FX, { pos: g.pos, neg: ['D', 'A', 'B', 'C', 'A'] })), ['seq-missing', 'seq-repeat']);
  assert.deepEqual(codes(SP.run(FX, { pos: ['A', 'B', 'C', 'E', 'Z'], neg: g.neg })), ['seq-missing', 'seq-unknown']);
  assert.deepEqual(codes(SP.run(FX, { pos: 'ABCED', neg: g.neg })), ['seq-type']);
  const bad = dims => ({ outline: FX.outline, modules: FX.modules.map(m => (m.id === 'B' ? { ...m, ...dims } : m)) });
  for (const d of [{ w: 0 }, { w: -2 }, { h: NaN }, { h: Infinity }, { w: '2' }]) assert.deepEqual(codes(SP.run(bad(d), g)), ['module-dim'], JSON.stringify(d));
  assert.deepEqual(codes(SP.run({ outline: FX.outline, modules: [...FX.modules, { id: 'A', w: 1, h: 1 }] }, g)), ['module-dup']);
  assert.deepEqual(codes(SP.run({ modules: FX.modules }, g)), ['outline-missing']);
  assert.deepEqual(codes(SP.run({ outline: { W: 10 }, modules: FX.modules }, g)), ['outline-missing']);
  assert.deepEqual(codes(SP.run({ outline: { w: 10, W: 12, h: 8 }, modules: FX.modules }, g)), ['outline-conflict']);
  assert.deepEqual(codes(SP.run({ outline: { w: 0, h: 8 }, modules: FX.modules }, g)), ['outline-bad']);
  // the instructor's uppercase {W, H} is accepted at the boundary and normalised
  const up = SP.run({ outline: { W: 10, H: 8 }, modules: FX.modules }, g);
  assert.equal(up.status, 'ok'); assert.deepEqual(up.result.outline, { w: 10, h: 8 });
  assert.equal(SP.run(FX, { pos: [], neg: [] }).status, 'invalid');
});

test('neighbour moves keep a valid pair', () => {
  const g = P.golden;
  for (const mv of ['pos', 'neg', 'both']) {
    const n = SP.neighbour(g.pos, g.neg, mv, 'A', 'D');
    assert.deepEqual(SP.validatePair(n.pos, n.neg, IDS), []);
  }
  assert.deepEqual(SP.neighbour(g.pos, g.neg, 'pos', 'E', 'D'), { pos: ['A', 'B', 'C', 'D', 'E'], neg: g.neg });
});
