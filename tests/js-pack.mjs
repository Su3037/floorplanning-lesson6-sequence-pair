// Helper for tests/crosscheck.py: reads cases as JSON on stdin, runs the JS engine, prints the DP per block per axis.
import * as SP from '../site/engines/sequence-pair.js';
let raw = '';
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  const out = JSON.parse(raw).map(c => {
    const r = SP.run({ outline: c.outline, modules: c.modules }, { pos: c.pos, neg: c.neg });
    if (r.status !== 'ok') return { status: r.status, codes: r.metadata.errors.map(e => e.code).sort() };
    const dp = r.events.filter(e => e.kind === 'dp').map(e => [e.axis, e.block, e.value, e.chosen.from]);
    const m = r.result.metrics;
    return { status: 'ok', H: r.result.H.map(e => [e.from, e.to]), V: r.result.V.map(e => [e.from, e.to]), dp, fits: m.fits, bbox: [m.bbox.w, m.bbox.h] };
  });
  process.stdout.write(JSON.stringify(out));
});
