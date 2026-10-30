// Module 06 experiment walkthrough: records the real lab and code lab, one pass per language.
//   node video/m06-sequence-pair/walkthrough.mjs http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/ zh build/m06-sequence-pair/walk-zh
// then: python3 scripts/film/walkthrough.py m06-sequence-pair
import fs from 'node:fs';
import { Recorder } from '../../scripts/film/recorder.mjs';

const [base, lang = 'zh', out = `build/m06-sequence-pair/walk-${lang}`] = process.argv.slice(2);
const url = new URL(`${lang === 'en' ? 'en/' : ''}modules/m06-sequence-pair/index.html`, base).href;
const rec = await Recorder.start({ url, lang, out });
const p = rec.page, t = (zh, en) => rec.t(zh, en);
const lab = p.locator('#lab-root');
const btn = (root, zh, en) => root.getByRole('button', { name: t(zh, en), exact: false }).first();
const CH = {
  lab: { zh: '实验台', en: 'THE LAB' }, edit: { zh: '改排列', en: 'CHANGE THE PAIR' }, code: { zh: '在线编程', en: 'CODE LAB' },
  viz: { zh: '用你的代码跑', en: 'YOUR CODE, VISUALISED' }, end: { zh: '挑战', en: 'CHALLENGES' }
};
const player = () => lab.locator('.player');
// The player sits at the foot of the side column; pressing it with a script keeps the view on the diagrams.
const press = loc => loc.evaluate(e => e.click());
const step = () => press(btn(player(), '下一步', 'Next step'));
const toEnd = () => press(btn(player(), '跳到结束', 'To the end'));
const posChip = id => lab.locator('.sp-editors > *').nth(0).locator(`.sp-chip[data-id="${id}"]`);
const preset = () => lab.locator('.lab-toolbar select').first();
const block = id => lab.locator(`.sp-plan g.fp-block[data-id="${id}"]`).first();
const ZOOM = '#lab-root .lab';
const top = () => rec.scrollTo('#lab-root .lab-toolbar', { offset: 100, duration: 700 });

await rec.scrollTo('#lab', { duration: 10 });
await rec.scrollTo('#lab-root', { offset: 110, duration: 900 });
await rec.shot({ chapter: CH.lab, zh: '这是本课的实验台：上面两行是 pos 和 neg，默认是教师示例 ABCED / DABCE。', en: 'This is the lesson\'s lab: the two rows are pos and neg, starting from the instructor\'s example ABCED / DABCE.' },
  async r => { await r.moveTo(lab.locator('.sp-editors > *').nth(0)); await r.moveTo(lab.locator('.sp-editors > *').nth(1)); await r.wait(600); }, { hold: 1 });
await rec.shot({ zh: '结果分开判断：完整、不重叠、装得下各是一项。这一对得到 9 × 4，装得下。', en: 'The result is judged item by item: complete, no overlap and fits are separate. This pair gives 9 × 4, and it fits.', zoom: ZOOM },
  async r => { await r.moveTo(lab.locator('.sp-checks').first()); await r.wait(1600); });
await rec.shot({ zh: '回到第一步再单步：A、B 在两个序列里都是 A 在前，所以 A 在 B 左边，得到 H 边 A→B。', en: 'Back to the start and step: A comes before B in both sequences, so A is left of B, giving the H edge A→B.', zoom: ZOOM },
  async r => { await press(btn(player(), '重置', 'Reset')); await r.wait(700); await step(); await r.wait(2000); }, { before: top });
await rec.shot({ zh: '再走三步到 A、D：pos 里 A 在前，neg 里 D 在前，连线交叉，A 在 D 下边，是 V 边。', en: 'Three more steps to A and D: A is first in pos but D is first in neg; the lines cross, A is below D, a V edge.', zoom: ZOOM },
  async r => { for (let k = 0; k < 3; k++) { await step(); await r.wait(700); } await r.wait(1600); });
await rec.shot({ zh: '跳到结束，点块 E：x[E] = 7，由 C 决定。三个水平前驱里取最大的那个。', en: 'Jump to the end and click block E: x[E] = 7, set by C. Of its three horizontal predecessors, the largest bound wins.', zoom: ZOOM },
  async r => { await toEnd(); await r.wait(500); await r.click(block('E')); await r.wait(2400); }, { before: () => rec.scrollTo('#lab-root .sp-plan', { offset: 150, duration: 800 }) });

await rec.shot({ chapter: CH.edit, zh: '换预设“合法但纵向溢出”：ABCDE / EDCBA，每对都是上下，叠成 3 × 10。不重叠，但装不下。', en: 'Switch to the preset “valid but overflows vertically”: ABCDE / EDCBA, every pair is above/below, a 3 × 10 stack. No overlap, but it does not fit.', zoom: ZOOM },
  async r => { await r.choose(preset(), 'stack'); await r.wait(1800); await r.moveTo(lab.locator('.sp-checks').first(), { dy: 0.3 }); await r.wait(1000); }, { before: top });
await rec.shot({ zh: '回到教师示例，在 pos 里选中 D，往左移一格：ABCDE / DABCE。关系变了，布局却一点没变。', en: 'Back to the instructor\'s example: select D in pos and move it one place left, ABCDE / DABCE. The relation changed, the packing did not.', zoom: ZOOM },
  async r => {
    await r.choose(preset(), 'golden'); await r.wait(500);
    await r.click(posChip('D'), { after: 300 });
    await r.click(lab.locator('.sp-editors > *').nth(0).getByRole('button', { name: t('左移', 'left'), exact: false }).first());
    await r.wait(2400);
  });
await rec.shot({ zh: '“随机邻居”就是模拟退火的基本动作：随机交换两块。不满意可以撤销。', en: '“Random neighbour” is the basic annealing move: swap two blocks at random. Undo if you do not like it.', zoom: ZOOM },
  async r => { await r.click(btn(lab, '随机邻居', 'Random neighbour')); await r.wait(1800); await r.click(btn(lab, '撤销', 'Undo')); await r.wait(1400); });

// ---- code lab
const cl = p.locator('#codelab-root');
const idle = () => p.waitForTimeout(300).then(() => p.waitForFunction(() => !document.querySelector('#codelab-root .cl-bar button').disabled, null, { timeout: 120000 }));
await rec.scrollTo('#codelab-root', { duration: 10 });
await cl.locator('.cm-editor').waitFor({ timeout: 30000 });
await rec.scrollTo('#lab', { duration: 10 });
await rec.scrollTo('#codelab-root .cl-bar', { offset: 130, duration: 1200 });
await rec.shot({ chapter: CH.code, zh: '在线编程：代码在浏览器里运行，不用安装 Python。pack() 和 trace() 已经写好，留了五个任务。', en: 'The code lab: your code runs in the browser, with no Python to install. pack() and trace() are written; five tasks are left.' },
  async r => { await r.moveTo(cl.locator('.cl-editor')); await r.wait(900); }, { hold: 1 });
await rec.shot({ zh: '先运行检查：任务都还没写，结果是 INCOMPLETE。', en: 'Run the checks first: nothing is written yet, so the result is INCOMPLETE.', zoom: '#codelab-root .cl-side' },
  async r => { await r.click(btn(cl, '运行检查', 'Run checks'), { after: 100 }); await r.offscreen(idle); await r.wait(1600); });

async function selectLine(needle) {
  await p.evaluate(n => {
    const view = document.querySelector('#codelab-root .cl-editor').editorView;
    const text = view.state.doc.toString(), at = text.indexOf(n);
    const line = view.state.doc.lineAt(at), indent = line.text.match(/^\s*/)[0].length;
    view.dispatch({ selection: { anchor: line.from + indent, head: line.to }, scrollIntoView: true });
    view.focus();
  }, needle);
}
async function replaceLine(r, needle, code) {
  await selectLine(needle);
  await r.wait(300);
  await r.moveTo(cl.locator('.cm-line', { hasText: needle }).first(), { dx: 0.6 });
  await r.wait(250);
  await r.type(code, { delay: 30 });
}
// Tasks 1, 3 and 5 are pasted from the reference file (the caption says so); tasks 2 and 4 are typed.
const refSrc = fs.readFileSync(new URL(`../../python/m06-sequence-pair/${lang === 'en' ? 'en/' : ''}reference.py`, import.meta.url), 'utf8');
function refBody(name) {
  const at = refSrc.indexOf(`def ${name}(`), doc = refSrc.indexOf('"""', refSrc.indexOf('"""', at) + 3) + 3;
  const end = refSrc.indexOf('\n\n\n', doc);
  return refSrc.slice(refSrc.indexOf('\n', doc) + 1, end === -1 ? undefined : end).replace(/^ {4}/, '');
}
async function paste(name) {
  await p.evaluate(([n, body]) => {
    const view = document.querySelector('#codelab-root .cl-editor').editorView;
    const text = view.state.doc.toString(), at = text.indexOf(`NotImplementedError("${n}")`);
    const line = view.state.doc.lineAt(at), indent = line.text.match(/^\s*/)[0].length;
    view.dispatch({ changes: { from: line.from + indent, to: line.to, insert: body }, scrollIntoView: true });
  }, [name, refBody(name)]);
}
await rec.shot({ zh: '任务二：a 相对 b 的位置。两个序列里先后相同就是左右，相反就是上下。', en: 'Task 2: where a sits relative to b. The same order in both sequences means left/right; opposite orders mean below/above.', zoom: '#codelab-root .cl-editor' },
  async r => {
    await replaceLine(r, 'NotImplementedError("relation")',
      'p = pos.index(a) < pos.index(b)\nn = neg.index(a) < neg.index(b)\nif p == n:\nreturn "left" if p else "right"\n<return "below" if p else "above"');
    await r.wait(900);
  });
await rec.shot({ zh: '任务四：最长路径。按拓扑序，坐标取“前驱坐标 + 前驱尺寸”的最大值，并记下是谁定的。', en: 'Task 4: the longest path. In topological order, take the largest “predecessor coordinate + predecessor size”, and record who set it.', zoom: '#codelab-root .cl-editor' },
  async r => {
    await replaceLine(r, 'NotImplementedError("longest_path")',
      'pred = {n: [] for n in nodes}\nfor i, j in edges:\npred[j].append(i)\n<coord, chosen = {}, {}\nfor j in _topological(nodes, edges, rank):\nbest, arg = 0, None\nfor i in sorted(pred[j], key=rank):\nif coord[i] + size[i] > best:\nbest, arg = coord[i] + size[i], i\n<<coord[j], chosen[j] = best, arg\n<return coord, chosen');
    await r.wait(900);
  });
await rec.shot({ zh: '任务一、三、五（校验、建图、指标）在这段演示里直接从参考答案填入，然后运行检查：全部通过。', en: 'For this demo, tasks 1, 3 and 5 (validate, build the graphs, metrics) are filled in from the reference; then run the checks: everything passes.', zoom: '#codelab-root .cl-side' },
  async r => {
    for (const n of ['validate_pair', 'build_graphs', 'metrics']) await paste(n);
    await r.wait(400);
    await r.click(btn(cl, '运行检查', 'Run checks'), { after: 100 }); await r.offscreen(idle); await r.wait(2400);
  });

const viz = p.locator('#codelab-root .cl-viz');
await rec.scrollTo('#codelab-root .cl-viz', { offset: 140, duration: 900 });
await rec.shot({ chapter: CH.viz, zh: '下面用你写的函数跑 8 个例子，逐块对照课程引擎：坐标、取最大的前驱、装得下与包围盒。', en: 'Below, your functions run on eight cases, compared block by block with the course engine: coordinates, the chosen predecessor, fit and bounding box.' },
  async r => {
    await r.click(btn(viz, '用我的代码运行', 'Run my code'), { after: 100 });
    await r.offscreen(() => p.waitForFunction(() => document.querySelectorAll('#codelab-root .cl-viz tbody tr').length > 0, null, { timeout: 90000 }));
    await r.wait(1600);
  });
await rec.shot({ zh: '点“三块：取最大”那一行：B 从 x = 3 开始，左边是你的代码，右边是课程引擎。', en: 'Click the “three blocks” row: B starts at x = 3; your code on the left, the course engine on the right.' },
  async r => { await r.click(viz.locator('tbody tr').nth(7)); await r.wait(2600); }, { before: () => rec.scrollTo('#codelab-root .cl-viz tbody tr:last-child', { offset: 150, duration: 800 }) });

await rec.scrollTo('#challenges', { duration: 900 });
await rec.shot({ chapter: CH.end, zh: '最后做挑战题，确认自己真的懂了。结果只保存在你的浏览器里。', en: 'Finally, try the challenges to check you really understand. Results stay in your browser.' },
  async r => { await r.moveTo(p.locator('#challenge-root').first(), { dy: 0.2 }); await r.wait(1500); }, { hold: 1.5 });
await rec.finish({ module: 'm06-sequence-pair', url });
