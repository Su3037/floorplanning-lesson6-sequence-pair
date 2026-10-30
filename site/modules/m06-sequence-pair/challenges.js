// Module 06 challenges. Every expected value is computed by site/engines/sequence-pair.js at check time; the two Stretch
// challenges judge the sequence pair the learner actually built in the challenge (not a button press or a copied string).
import { h, put } from '../../assets/core.js';
import { choice, fields, combine, orderList } from '../../assets/challenges.js';
import { L } from '../../assets/i18n.js';
import { floorplan } from '../../assets/fp-draw.js';
import * as SP from '../../engines/sequence-pair.js';
import { DATA } from '../../engines/fixtures.js';

const FX = { outline: DATA.fixture.outline, modules: DATA.fixture.modules };
const P = Object.fromEntries(DATA.presets.map(p => [p.id, p]));
const IDS = FX.modules.map(m => m.id);
const G = P.golden;
const golden = () => SP.pack(FX, G.pos, G.neg);
const REL = { left: L('在左边', 'left of'), right: L('在右边', 'right of'), below: L('在下边', 'below'), above: L('在上边', 'above') };
const relChoice = () => choice(['left', 'right', 'below', 'above'].map(r => [r, REL[r]]));
const dpEvent = (r, axis, id) => r.events.find(e => e.kind === 'dp' && e.axis === axis && e.block === id);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Two permutation lists plus a live preview drawn from the engine, so the learner sees what they built. */
function pairBuilder(start) {
  const pos = orderList(start.pos), neg = orderList(start.neg);
  const preview = h('div.ch-preview'), note = h('p.small');
  const draw = () => {
    try {
      const r = SP.run(FX, { pos: pos.getAnswer(), neg: neg.getAnswer() });
      if (r.status !== 'ok') { put(preview); note.textContent = r.metadata.errors.map(e => e.message).join(' '); return; }
      const m = r.result.metrics;
      put(preview, floorplan({ rects: r.result.rects, outline: FX.outline, theme: 'paper', unit: 18, showCoords: false }));
      note.textContent = L(`预览：包围盒 ${m.bbox.w} × ${m.bbox.h}`, `Preview: bounding box ${m.bbox.w} × ${m.bbox.h}`);
    } catch (e) { note.textContent = e.message; }
  };
  const wrap = h('div.ch-pair', {}, h('div', {}, h('b', 'pos'), pos.element), h('div', {}, h('b', 'neg'), neg.element), h('div', {}, preview, note));
  wrap.addEventListener('click', () => requestAnimationFrame(draw));
  draw();
  return { element: wrap, getAnswer: () => ({ pos: pos.getAnswer(), neg: neg.getAnswer() }), reset() { pos.reset(); neg.reset(); draw(); } };
}

export const challenges = [
  {
    id: 'c1', type: L('推演', 'Trace'), difficulty: 'Intro', objectiveId: 'o2', title: L('读出相对位置', 'Read off a relation'),
    why: L('检查四种情况的判断，尤其是“次序相反 → 上下”时哪一块在下面。', 'Checks the four cases, especially which block is below when the orders are opposite.'),
    task: L(`教师示例 pos = ${G.pos.join(' ')}，neg = ${G.neg.join(' ')}。B 相对 E 在哪里？A 相对 D 在哪里？`, `The instructor's pair: pos = ${G.pos.join(' ')}, neg = ${G.neg.join(' ')}. Where is B relative to E? Where is A relative to D?`),
    build: () => combine(h2(L('B 相对 E', 'B relative to E')), relChoice(), h2(L('A 相对 D', 'A relative to D')), relChoice()),
    check: ([, be, , ad]) => {
      const want1 = SP.relation(G.pos, G.neg, 'B', 'E'), want2 = SP.relation(G.pos, G.neg, 'A', 'D');
      if (be !== want1) return { ok: false, message: be === 'right' ? L('方向反了：两个序列里都是 B 在 E 前面，在前的那块在左边。', 'Reversed: B comes before E in both sequences, and the one in front is on the left.') : L('B 与 E 在两个序列里次序相同，这是左右关系，不是上下。', 'B and E have the same order in both sequences: that is left/right, not above/below.') };
      if (ad !== want2) return { ok: false, message: ad === 'above' ? L('约定颠倒了：本课规定 pos 中在前、neg 中在后的那块在下面。', 'The convention is flipped: in this course the block first in pos and second in neg is below.') : L('A、D 在 pos 与 neg 中的次序相反（A 在 pos 第 1、neg 第 2；D 在 pos 第 5、neg 第 1），这是上下关系。', 'A and D have opposite orders (A is 1st in pos and 2nd in neg; D is 5th in pos and 1st in neg): that is above/below.') };
      return { ok: true, message: L(`B ${REL[want1]} E；A ${REL[want2]} D——所以 D 的 y 至少是 A 的高 2（实际被 B 顶到 3）。`, `B is ${REL[want1]} E; A is ${REL[want2]} D, so D's y is at least A's height 2 (B actually pushes it to 3).`) };
    },
    hints: [L('先看两个序列里的次序是相同还是相反。', 'First decide whether the two orders agree or disagree.'), L('次序相反时，看 pos：pos 中在前的那块在下面。', 'If they disagree, look at pos: the block that comes first in pos is below.')],
    answer: L('B 在 E 左边；A 在 D 下边。', 'B is left of E; A is below D.'),
    explanation: L('次序相同 → 左右（两边都在前的在左）；次序相反 → 上下（pos 中在前的在下）。', 'Same order → left/right (first in both is on the left); opposite → below/above (first in pos is below).')
  },
  {
    id: 'c2', type: L('纠错', 'Debug'), difficulty: 'Intro', objectiveId: 'o2', title: L('诊断不合法的序列对', 'Diagnose an invalid pair'),
    why: L('检查你能否找出全部问题，而不是看到第一个错误就停。', 'Checks that you find every problem, not just the first one.'),
    task: L('有人写下 pos = A B C E E，neg = D A B C。它有哪些问题？选出全部。', 'Someone wrote pos = A B C E E, neg = D A B C. Which problems does it have? Select all of them.'),
    build: () => choice([['pos-repeat-E', L('pos 里 E 重复', 'pos repeats E')], ['pos-missing-D', L('pos 缺少 D', 'pos is missing D')], ['neg-missing-E', L('neg 缺少 E', 'neg is missing E')],
      ['length', L('两个序列长度不同', 'the two sequences have different lengths')], ['neg-unknown', L('neg 里有未知模块', 'neg contains an unknown module')], ['pos-repeat-A', L('pos 里 A 重复', 'pos repeats A')]], { multi: true }),
    check: picked => {
      const errs = SP.validatePair(['A', 'B', 'C', 'E', 'E'], ['D', 'A', 'B', 'C'], IDS);
      const want = new Set(errs.map(e => e.code === 'seq-length' ? 'length' : `${e.seq}-${e.code.replace('seq-', '')}-${e.id}`));
      const got = new Set(picked), missed = [...want].filter(x => !got.has(x)), extra = [...got].filter(x => !want.has(x));
      if (extra.length) return { ok: false, message: L(`多选了不存在的问题：${extra.length} 项。逐个数一数每个 id 出现几次。`, `You picked ${extra.length} problem(s) that are not there. Count how often each id appears.`) };
      if (missed.length) return { ok: false, message: L(`还漏了 ${missed.length} 个问题。把 pos、neg 分别和 {A, B, C, D, E} 对照，再比较长度。`, `${missed.length} problem(s) still missing. Compare pos and neg with {A, B, C, D, E} one at a time, then compare the lengths.`) };
      return { ok: true, message: L(`共 ${errs.length} 个问题：${errs.map(e => e.message).join(' ')}`, `${errs.length} problems: ${errs.map(e => e.message).join(' ')}`) };
    },
    hints: [L('合法的条件是：两个序列都恰好是 {A, B, C, D, E} 的一个排列。', 'The rule: each sequence is exactly one arrangement of {A, B, C, D, E}.'), L('pos 有 5 项、neg 有 4 项；pos 里 E 出现了两次。', 'pos has 5 entries and neg has 4; E appears twice in pos.')],
    answer: L('pos 里 E 重复；pos 缺少 D；neg 缺少 E；长度不同。', 'pos repeats E; pos is missing D; neg is missing E; the lengths differ.'),
    explanation: L('一个错误常常带出另一个：重复一个就会缺一个。引擎会把所有问题一起报出来，便于一次改对。', 'One mistake usually brings another: a repeated id means a missing one. The engine lists every problem at once so you can fix them in one go.')
  },
  {
    id: 'c3', type: L('构图', 'Build'), difficulty: 'Practice', objectiveId: 'o3', title: L('谁指向 E，谁指向 D', 'What points into E, and into D'),
    why: L('检查关系到约束边的转换，包括可以由更长路径推出的边。', 'Checks turning relations into constraint edges, including edges implied by longer paths.'),
    task: L('在教师示例的约束图里，选出所有指向 E 的边和所有指向 D 的边（H = 水平，V = 竖直）。', 'In the constraint graphs of the instructor’s pair, select every edge into E and every edge into D (H = horizontal, V = vertical).'),
    build: () => choice(['H:A→E', 'H:B→E', 'H:C→E', 'H:D→E', 'V:D→E', 'V:A→D', 'V:B→D', 'V:C→D', 'V:E→D', 'H:E→D'].map(x => [x, x]), { multi: true }),
    check: picked => {
      const { H, V } = SP.buildGraphs(G.pos, G.neg);
      const want = new Set([...H.map(e => `H:${e.from}→${e.to}`), ...V.map(e => `V:${e.from}→${e.to}`)].filter(x => x.endsWith('→E') || x.endsWith('→D')));
      const got = new Set(picked), missed = [...want].filter(x => !got.has(x)), extra = [...got].filter(x => !want.has(x));
      if (extra.some(x => x.includes('D→E') || x.includes('E→D') && x.startsWith('H'))) return { ok: false, message: L('D 与 E：pos 中 E 在前、neg 中 E 在后 → E 在 D 下边，只有一条 V 边 E → D。', 'D and E: E is first in pos and second in neg → E is below D, so the only edge is V: E → D.') };
      if (missed.includes('H:A→E')) return { ok: false, message: L('A → E 也是一条边：A、E 在两个序列里都是 A 在前。它能由 A → B → C → E 推出，但仍然存在。', 'A → E is an edge too: A comes before E in both sequences. It is implied by A → B → C → E, but it is still there.') };
      if (missed.length || extra.length) return { ok: false, message: L(`还差 ${missed.length} 条、多了 ${extra.length} 条。每一对块恰好一条边；逐对检查和 E、D 有关的 8 对。`, `${missed.length} missing and ${extra.length} extra. Every pair gives exactly one edge; check the 8 pairs that involve E or D.`) };
      return { ok: true, message: L(`指向 E：H 的 A、B、C 三条；指向 D：V 的 A、B、C、E 四条。D 在所有块上面。`, `Into E: three H edges from A, B, C. Into D: four V edges from A, B, C, E. D sits above everything.`) };
    },
    hints: [L('和 E 有关的 4 对是 (A,E)、(B,E)、(C,E)、(E,D)；和 D 有关的 4 对是 (A,D)、(B,D)、(C,D)、(E,D)。', 'The pairs with E: (A,E), (B,E), (C,E), (E,D); with D: (A,D), (B,D), (C,D), (E,D).'), L('D 在 neg 中排第一，在 pos 中排最后：它和任何块的次序都相反。', 'D is first in neg and last in pos: its order is opposite to every other block.')],
    answer: 'H: A→E, B→E, C→E · V: A→D, B→D, C→D, E→D',
    explanation: L('约束图保留每一对的边（共 10 条）；画图时可以把 A → E 这类推得出的边画虚线，计算时照样用。', 'The constraint graphs keep one edge per pair (10 in all); a drawing may dash implied edges such as A → E, but the computation still uses them.')
  },
  {
    id: 'c4', type: L('推演', 'Trace'), difficulty: 'Practice', objectiveId: 'o4', title: L('算一个坐标', 'Compute one coordinate'),
    why: L('检查最长路径的两个要点：加前驱的尺寸、取最大。', 'Checks the two points of the longest path: add the predecessor’s size, take the maximum.'),
    task: L('教师示例中，x[E] 和 y[D] 各是多少？（A 3×2、B 2×3、C 2×2、D 3×1、E 2×2）', 'In the instructor’s pair, what are x[E] and y[D]? (A 3×2, B 2×3, C 2×2, D 3×1, E 2×2)'),
    build: () => fields([{ key: 'xE', label: 'x[E]' }, { key: 'yD', label: 'y[D]' }]),
    check: a => {
      const r = SP.run(FX, { pos: G.pos, neg: G.neg }), ex = dpEvent(r, 'x', 'E'), ey = dpEvent(r, 'y', 'D');
      const minX = Math.min(...ex.candidates.map(c => c.value)), minY = Math.min(...ey.candidates.map(c => c.value));
      if (a.xE !== ex.value) {
        if (a.xE === minX) return { ok: false, message: L(`${minX} 是最小的候选（来自 A）。E 必须同时让开 A、B、C，取最大。`, `${minX} is the smallest candidate (from A). E must clear A, B and C at once: take the maximum.`) };
        if (a.xE === r.result.x.C) return { ok: false, message: L('5 是 C 的左边缘；E 要从 C 的右边缘开始：x[C] + w[C]。', '5 is C’s left edge; E starts at C’s right edge: x[C] + w[C].') };
        if (a.xE === ex.value + 2) return { ok: false, message: L('多加了 E 自己的宽。候选值是“前驱的坐标 + 前驱的宽”。', 'You added E’s own width. A candidate is the predecessor’s coordinate plus the predecessor’s width.') };
        return { ok: false, message: L('列出 E 的水平前驱 A、B、C，各算 x[i] + w[i]。', 'List E’s horizontal predecessors A, B, C and work out x[i] + w[i] for each.') };
      }
      if (a.yD !== ey.value) {
        if (a.yD === minY) return { ok: false, message: L(`${minY} 只让开了较矮的块；B 高 3，D 必须在它上面。`, `${minY} clears only the shorter blocks; B is 3 tall and D must sit above it.`) };
        if (a.yD === ey.value + 1) return { ok: false, message: L('多加了 D 自己的高。', 'You added D’s own height.') };
        return { ok: false, message: L('D 的竖直前驱是 A、B、C、E，都在 y = 0；候选是它们各自的高。', 'D’s vertical predecessors are A, B, C, E, all at y = 0; the candidates are their heights.') };
      }
      return { ok: true, message: L(`x[E] = max(${ex.candidates.map(c => `${c.coord}+${c.size}`).join(', ')}) = ${ex.value}；y[D] = max(${ey.candidates.map(c => `${c.coord}+${c.size}`).join(', ')}) = ${ey.value}。`, `x[E] = max(${ex.candidates.map(c => `${c.coord}+${c.size}`).join(', ')}) = ${ex.value}; y[D] = max(${ey.candidates.map(c => `${c.coord}+${c.size}`).join(', ')}) = ${ey.value}.`) };
    },
    hints: [L('E 的水平前驱是 A、B、C；它们的 x 是 0、3、5。', 'E’s horizontal predecessors are A, B, C, at x = 0, 3, 5.'), L('候选 = x[i] + w[i]：0 + 3、3 + 2、5 + 2。y[D] 同理用高。', 'Candidate = x[i] + w[i]: 0 + 3, 3 + 2, 5 + 2. For y[D], use the heights.')],
    answer: 'x[E] = 7, y[D] = 3',
    explanation: L('每条边是一条下界；满足全部下界的最小值是最大的那个下界。加的是前驱的尺寸，因为边说的是“从前驱的另一端开始”。', 'Each edge is a lower bound; the smallest value meeting all of them is the largest bound. The predecessor’s size is added because the edge says “start where the predecessor ends”.')
  },
  {
    id: 'c5', type: L('实现', 'Implement'), difficulty: 'Practice', objectiveId: 'o4', title: L('写出整张布局', 'Write out the whole packing'),
    why: L('检查你能独立地把一个新的序列对从头算到坐标。', 'Checks that you can take a new pair all the way to coordinates on your own.'),
    task: L(`换一个序列对：pos = ${P.tight.pos.join(' ')}，neg = ${P.tight.neg.join(' ')}。写出每块的 (x, y)。`, `A new pair: pos = ${P.tight.pos.join(' ')}, neg = ${P.tight.neg.join(' ')}. Write down (x, y) for every block.`),
    build: () => fields(IDS.flatMap(id => [{ key: `x${id}`, label: `x[${id}]` }, { key: `y${id}`, label: `y[${id}]` }])),
    check: a => {
      const r = SP.pack(FX, P.tight.pos, P.tight.neg);
      const wrong = IDS.filter(id => a[`x${id}`] !== r.x[id] || a[`y${id}`] !== r.y[id]);
      if (wrong.length) {
        const id = wrong[0], axis = a[`x${id}`] !== r.x[id] ? 'x' : 'y';
        const preds = (axis === 'x' ? r.H : r.V).filter(e => e.to === id).map(e => e.from);
        return { ok: false, message: L(`${wrong.join('、')} 不对。先看 ${id} 的 ${axis}：它的${axis === 'x' ? '水平' : '竖直'}前驱是 ${preds.join('、') || '（没有，应为 0）'}。`, `${wrong.join(', ')} ${wrong.length > 1 ? 'are' : 'is'} wrong. Start with ${id}'s ${axis}: its ${axis === 'x' ? 'horizontal' : 'vertical'} predecessors are ${preds.join(', ') || '(none, so 0)'}.`) };
      }
      return { ok: true, message: L(`全对：包围盒 ${r.metrics.bbox.w} × ${r.metrics.bbox.h} = ${r.metrics.bboxArea}，只比块面积 23 多 1——这是五块能达到的最小包围盒之一。`, `All correct: bounding box ${r.metrics.bbox.w} × ${r.metrics.bbox.h} = ${r.metrics.bboxArea}, only 1 more than the block area 23: one of the tightest boxes five blocks can reach.`) };
    },
    hints: [L('先把 10 对块的关系列成表，再按 pos 顺序 A、C、D、E、B 算 x，然后算 y。', 'First tabulate the 10 relations, then compute x in pos order A, C, D, E, B, then y.'), L('A 在 C 下边、C 在 E 左边……B 在 pos 中最后、在 neg 中第 4：B 在 A 右边、在 D 上边。', 'A is below C, C is left of E… B is last in pos and 4th in neg: right of A and above D.')],
    answer: (() => { const r = SP.pack(FX, P.tight.pos, P.tight.neg); return IDS.map(id => `${id}(${r.x[id]}, ${r.y[id]})`).join(' '); })(),
    explanation: L('和教师示例一样：关系 → 两张图 → 按拓扑序取最大。练习里的 longest_path() 就是这一步。', 'Same as the instructor’s pair: relations → two graphs → maximum in topological order. The code lab’s longest_path() is exactly this step.')
  },
  {
    id: 'c6', type: L('约束', 'Constraint'), difficulty: 'Stretch', objectiveId: 'o5', title: L('造一个合法却装不下的序列对', 'Build a valid pair that does not fit'),
    why: L('检查你区分“不重叠”和“装得下”，并能预测哪个方向会溢出。', 'Checks that you separate “no overlap” from “fits”, and can predict which way it overflows.'),
    task: L('从教师示例出发，用 ↑↓ 改排列，得到一个合法、不重叠、但装不进 10 × 8 的序列对；再说出它在哪个方向溢出。判定看你排出的序列对本身。', 'Starting from the instructor’s pair, reorder with ↑↓ to get a valid, overlap-free pair that does not fit 10 × 8; then say which way it overflows. The judge recomputes the pair you built.'),
    build: () => combine(pairBuilder(G), h2(L('溢出方向', 'Overflow direction')), choice([['x', L('只是太宽', 'too wide only')], ['y', L('只是太高', 'too tall only')], ['xy', L('又宽又高', 'both')]])),
    check: ([pair, , dir]) => {
      const r = SP.run(FX, pair);
      if (r.status !== 'ok') return { ok: false, message: r.metadata.errors.map(e => e.message).join(' ') };
      const m = r.result.metrics;
      if (m.fits) return { ok: false, message: L(`还装得下：包围盒 ${m.bbox.w} × ${m.bbox.h}。要更宽，就让更多块对在两个序列里次序相同；要更高，就让次序相反。`, `It still fits: box ${m.bbox.w} × ${m.bbox.h}. For more width, make more pairs agree in order; for more height, make them disagree.`) };
      const actual = m.overflow.x > 0 && m.overflow.y > 0 ? 'xy' : m.overflow.x > 0 ? 'x' : 'y';
      if (dir !== actual) return { ok: false, message: L(`你的序列对确实装不下（${m.bbox.w} × ${m.bbox.h}），但溢出方向不对：看包围盒的宽和高分别与 10、8 比。`, `Your pair indeed does not fit (${m.bbox.w} × ${m.bbox.h}), but the direction is wrong: compare the box width with 10 and its height with 8.`) };
      return { ok: true, message: L(`合法、不重叠，但包围盒 ${m.bbox.w} × ${m.bbox.h}：${actual.includes('x') ? `宽超出 ${m.overflow.x}` : ''}${actual === 'xy' ? '，' : ''}${actual.includes('y') ? `高超出 ${m.overflow.y}` : ''}。块面积 23 远小于 80，照样装不下。`, `Valid and overlap-free, but the box is ${m.bbox.w} × ${m.bbox.h}: ${actual.includes('x') ? `${m.overflow.x} too wide` : ''}${actual === 'xy' ? ', ' : ''}${actual.includes('y') ? `${m.overflow.y} too tall` : ''}. The block area 23 is far below 80, and it still does not fit.`) };
    },
    hints: [L('次序相同的块对排成一行（左右），次序相反的叠成一列（上下）。', 'Pairs with the same order line up side by side; pairs with opposite orders stack up.'), L('试着把 neg 排成和 pos 完全一样：五块全部左右排开，宽是多少？', 'Try making neg exactly the same as pos: all five side by side. How wide is that?')],
    answer: L('例如 pos = neg = A B C D E（宽 12，只是太宽）；或 neg 反过来 E D C B A（高 10，只是太高）。', 'For example pos = neg = A B C D E (12 wide, too wide only); or neg reversed, E D C B A (10 tall, too tall only).'),
    explanation: L('序列对只保证不重叠。装得下取决于包围盒的宽和高，而它们由两张图上的最长路径决定。14,400 个序列对中有 720 个装不进 10 × 8。', 'A sequence pair only guarantees no overlap. Fitting depends on the bounding box’s width and height, which are the longest paths in the two graphs. 720 of the 14,400 pairs do not fit 10 × 8.')
  },
  {
    id: 'c7', type: L('比较', 'Compare'), difficulty: 'Stretch', objectiveId: 'o6', title: L('换一种写法，同一张布局', 'A different pair, the same packing'),
    why: L('检查你理解“关系变了，坐标不一定变”：多个序列对可以编码同一个布局。', 'Checks that you understand that a changed relation need not move anything: several pairs can encode one packing.'),
    task: L('排出一个与教师示例不同的序列对，但算出的每块坐标与教师示例完全相同。', 'Build a sequence pair that is different from the instructor’s, yet gives exactly the same coordinates for every block.'),
    build: () => pairBuilder(G),
    check: pair => {
      const r = SP.run(FX, pair);
      if (r.status !== 'ok') return { ok: false, message: r.metadata.errors.map(e => e.message).join(' ') };
      if (same(pair.pos, G.pos) && same(pair.neg, G.neg)) return { ok: false, message: L('这就是教师示例本身。至少改动一个序列。', 'That is the instructor’s pair itself. Change at least one sequence.') };
      const g = golden(), moved = IDS.filter(id => r.result.x[id] !== g.x[id] || r.result.y[id] !== g.y[id]);
      if (moved.length) return { ok: false, message: L(`${moved.join('、')} 的位置变了。哪一对块的关系改变后，两种关系都仍然成立？`, `${moved.join(', ')} moved. Which pair could change its relation while both relations still hold?`) };
      const changed = [];
      for (let s = 0; s < IDS.length; s++) for (let t = s + 1; t < IDS.length; t++) { const a = IDS[s], b = IDS[t]; const r0 = SP.relation(G.pos, G.neg, a, b), r1 = SP.relation(pair.pos, pair.neg, a, b); if (r0 !== r1) changed.push(`${a}–${b}`); }
      return { ok: true, message: L(`坐标完全相同，但这些块对的关系变了：${changed.join('、')}。在这个布局里，两种关系都成立。`, `Identical coordinates, yet these pairs changed relation: ${changed.join(', ')}. In this packing both relations hold.`) };
    },
    hints: [L('D 在左上角（x 0–3），E 在右下角（x 7–9）：E 在 D 下边，同时 D 也在 E 左边。', 'D is top-left (x 0–3) and E is bottom-right (x 7–9): E is below D, and D is also left of E.'), L('只动 pos 中 D 的位置，不动 neg。', 'Move only D within pos; leave neg alone.')],
    answer: L('例如 pos = A B C D E（或 A B D C E），neg 不变。', 'For example pos = A B C D E (or A B D C E), neg unchanged.'),
    explanation: L('序列对规定的是关系；当某一对块在几何上同时满足两种关系时，换一种关系不会移动任何块。五块共 14,400 个序列对，只有 9,056 种不同的布局；教师示例的布局恰好有 3 种写法。', 'A sequence pair fixes relations; when two blocks satisfy both relations geometrically, switching relation moves nothing. Five blocks have 14,400 pairs but only 9,056 distinct packings; the instructor’s packing has exactly 3.')
  }
];

function h2(text) { return { element: h('p.small', { style: 'margin:4px 0 0' }, h('b', text)), getAnswer: () => null }; }
