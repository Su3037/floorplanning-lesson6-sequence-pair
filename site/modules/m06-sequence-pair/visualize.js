// Code-lab visualiser: runs the learner's own Python (impl.py) on the course cases and compares every coordinate and every
// "chosen predecessor" with the course engine. Nothing here is precomputed: both sides run when the button is pressed.
import { h, L, put } from '../../assets/core.js';
import { floorplan } from '../../assets/fp-draw.js';
import * as SP from '../../engines/sequence-pair.js';
import { DATA } from '../../engines/fixtures.js';

const FX = DATA.fixture;
const CASES = [
  ...DATA.presets.map(p => ({ name: L(p.zh, p.en), outline: FX.outline, modules: FX.modules, pos: p.pos, neg: p.neg })),
  ...DATA.small.map(s => ({ name: L(s.zh, s.en), outline: s.outline, modules: s.modules, pos: s.pos, neg: s.neg }))
];

export function visualize(root, api) {
  const go = h('button.btn.primary', { type: 'button', onclick: runMine }, L('▶ 用我的代码运行', '▶ Run my code'));
  const tableBox = h('div.table-scroll'), stage = h('div.fp-row'), msg = h('p.status', { 'aria-live': 'polite' }, L('五个函数都写好后，按“用我的代码运行”。', 'Once all five functions are written, press “Run my code”.'));
  root.append(h('h3', L('用你的代码跑一遍', 'Watch your own code run')),
    h('p.muted', L(`这里调用你写的 validate_pair()、build_graphs()、longest_path() 与 metrics()（经由已提供的 trace() 和 pack()），在 ${CASES.length} 个例子上逐块对照课程引擎：每块的 x、y，以及取到最大值的前驱。点表格的一行，下面并排画出你的结果和引擎的结果。`,
      `This calls the validate_pair(), build_graphs(), longest_path() and metrics() you wrote (through the provided trace() and pack()) and compares them block by block with the course engine on ${CASES.length} cases: each x and y, and the predecessor that set it. Click a row to draw your result next to the engine’s.`)),
    h('div.lab-toolbar', {}, go), msg, tableBox, stage);

  async function runMine() {
    if (api.busy) return;
    const payload = CASES.map(c => ({ outline: c.outline, modules: c.modules, pos: c.pos, neg: c.neg }));
    const code = `import json, importlib.util
spec = importlib.util.spec_from_file_location('impl_v', 'impl.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
out = []
for c in json.loads(${JSON.stringify(JSON.stringify(payload))}):
    try:
        ids = [b["id"] for b in c["modules"]]
        probs = m.validate_pair(c["pos"], c["neg"], ids)
        t = m.trace(c["pos"], c["neg"], c["modules"])
        pl = {b: [t["x"][b], t["y"][b]] for b in ids}
        mt = m.metrics(c["modules"], c["outline"], {b: tuple(v) for b, v in pl.items()})
        out.append({"ok": True, "problems": [list(p) for p in probs], "pl": pl, "cx": t["chosen_x"], "cy": t["chosen_y"], "fits": mt["fits"], "bbox": list(mt["bbox"])})
    except Exception as e:
        out.append({"ok": False, "error": type(e).__name__ + ": " + str(e)})
print("@@VIZ@@" + json.dumps(out))`;
    api.setBusy(true); msg.textContent = L('运行中…', 'Running…');
    try {
      const { out } = await api.run(code, {});
      const line = out.split('\n').find(l => l.startsWith('@@VIZ@@'));
      if (!line) throw new Error(L('没有得到结果（代码在导入时出错？看上方输出）', 'No result (did your code fail on import? See the output above).'));
      const mine = JSON.parse(line.slice(7));
      const rows = CASES.map((c, i) => {
        const ref = SP.run({ outline: c.outline, modules: c.modules }, { pos: c.pos, neg: c.neg }).result, my = mine[i];
        if (!my.ok) return { c, ref, my, ok: false, note: my.error };
        const bad = ref.rects.filter(r => my.pl[r.id]?.[0] !== ref.x[r.id] || my.pl[r.id]?.[1] !== ref.y[r.id]).map(r => r.id);
        const dp = ref.rects.filter(r => { const ex = SP.run({ outline: c.outline, modules: c.modules }, { pos: c.pos, neg: c.neg }).events.filter(e => e.kind === 'dp' && e.block === r.id);
          return ex.some(e => (e.chosen.from ?? null) !== ((e.axis === 'x' ? my.cx : my.cy)[r.id] ?? null)); }).map(r => r.id);
        const fitsOk = my.fits === ref.metrics.fits && my.bbox[0] === ref.metrics.bbox.w && my.bbox[1] === ref.metrics.bbox.h;
        const ok = !bad.length && !dp.length && fitsOk && my.problems.length === 0;
        const note = ok ? L('全部一致', 'all match') : [bad.length ? L(`坐标不同：${bad.join('、')}`, `coordinates differ: ${bad.join(', ')}`) : '', dp.length ? L(`取最大的前驱不同：${dp.join('、')}`, `chosen predecessor differs: ${dp.join(', ')}`) : '',
          !fitsOk ? L('装得下 / 包围盒不同', 'fit / bounding box differs') : '', my.problems.length ? L('把合法的序列对判成了不合法', 'a valid pair was reported invalid') : ''].filter(Boolean).join(L('；', '; '));
        return { c, ref, my, ok, note };
      });
      const draw = r => put(stage, 
        r.my.ok ? floorplan({ rects: r.ref.rects.map(x => ({ ...x, x: r.my.pl[x.id][0], y: r.my.pl[x.id][1] })), outline: r.c.outline, theme: 'paper', unit: 22, overlaps: SP.checkPlacement(r.c.modules, r.c.outline, r.ref.rects.map(x => ({ ...x, x: r.my.pl[x.id][0], y: r.my.pl[x.id][1] }))).overlaps, caption: L('你的代码', 'Your code') }) : h('p.lab-error', r.note),
        floorplan({ rects: r.ref.rects, outline: r.c.outline, theme: 'paper', unit: 22, caption: L('课程引擎', 'Course engine') }));
      put(tableBox, h('table', {}, h('thead', {}, h('tr', {}, h('th', L('例子', 'Case')), h('th', 'pos / neg'), h('th', L('结果', 'Result')))),
        h('tbody', {}, rows.map(r => h('tr', { tabindex: 0, class: r.ok ? 'ok' : 'bad', onclick: () => draw(r), onkeydown: ev => { if (ev.key === 'Enter') draw(r); } },
          h('td', r.c.name), h('td', h('code', `${r.c.pos.join('')} / ${r.c.neg.join('')}`)), h('td', `${r.ok ? '✓' : '✗'} ${r.note}`))))));
      const n = rows.filter(r => r.ok).length;
      msg.textContent = L(`${n} / ${rows.length} 个例子与课程引擎完全一致。`, `${n} of ${rows.length} cases match the course engine exactly.`);
      draw(rows.find(r => !r.ok) || rows[0]);
    } catch (e) { msg.textContent = String(e.message || e); }
    finally { api.setBusy(false); }
  }
}
