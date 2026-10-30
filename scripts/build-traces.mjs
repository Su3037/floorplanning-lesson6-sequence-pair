#!/usr/bin/env node
// Runs the engine on every shared example and writes site/data/m06-sequence-pair/traces.json.
// The films and the slides read these traces (and assert the numbers they show), so they cannot drift from the lab.
import fs from 'node:fs';
import path from 'node:path';
import * as SP from '../site/engines/sequence-pair.js';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures/sequence-pair.json'), 'utf8'));
const FX = DATA.fixture;
const out = { engine: SP.ENGINE, generated: new Date().toISOString().slice(0, 10), fixture: FX, runs: {}, small: {}, stats: {} };
for (const p of DATA.presets) out.runs[p.id] = SP.run(FX, { pos: p.pos, neg: p.neg });
for (const s of DATA.small) out.small[s.id] = SP.run(s, { pos: s.pos, neg: s.neg });
// exhaustive statistics over all (5!)² pairs
const ids = FX.modules.map(m => m.id), perms = SP.permutations(ids), g = out.runs.golden.result;
let fit = 0, same = 0; const areas = {}, distinct = new Set(); let best = null;
for (const a of perms) for (const b of perms) {
  const r = SP.pack(FX, a, b), m = r.metrics;
  fit += m.fits; areas[m.bboxArea] = (areas[m.bboxArea] || 0) + 1;
  distinct.add(ids.map(id => `${r.x[id]},${r.y[id]}`).join(';'));
  if (SP.samePacking(r, g)) same++;
  if (!best || m.bboxArea < best.area) best = { area: m.bboxArea, w: m.bbox.w, h: m.bbox.h, pos: a, neg: b };
}
out.stats = { pairs: perms.length ** 2, fit, overflow: perms.length ** 2 - fit, distinctPackings: distinct.size, sameAsGolden: same, bboxAreas: areas, tightest: best };
// adjacent swaps from the golden pair (lesson table, advanced film)
out.adjacent = [];
for (const seq of ['pos', 'neg']) for (let k = 0; k < ids.length - 1; k++) {
  const p = [...DATA.presets[0].pos], n = [...DATA.presets[0].neg], s = seq === 'pos' ? p : n;
  [s[k], s[k + 1]] = [s[k + 1], s[k]];
  const r = SP.pack(FX, p, n);
  out.adjacent.push({ seq, swap: [s[k + 1], s[k]], pos: p, neg: n, bbox: [r.metrics.bbox.w, r.metrics.bbox.h], same: SP.samePacking(r, g) });
}
fs.mkdirSync(path.join(ROOT, 'site/data/m06-sequence-pair'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'site/data/m06-sequence-pair/traces.json'), JSON.stringify(out));
console.log('traces:', Object.keys(out.runs).join(', '), '| stats', JSON.stringify({ ...out.stats, bboxAreas: undefined, tightest: undefined }));
