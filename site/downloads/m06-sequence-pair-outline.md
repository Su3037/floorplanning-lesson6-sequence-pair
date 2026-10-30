# Module 06 · 序列对 Sequence-Pair · 大纲 / Outline

> Written before the page, slides and films (playbook phase 2). Every number below is produced by
> `site/engines/sequence-pair.js` and re-checked by `tests/engines.test.mjs`, `tests/crosscheck.py` and the Python checker.
> Course position: **Module 06** (the instructor's Lab 06). Upstream stable id: `module02-05-sequence-pair`; browser activity id
> `sequence-pair`. The two numbers are different numbering systems and are never mixed.

## 1. 问题定义 · Problem statement

| Field | 中文 | English |
| --- | --- | --- |
| Input | 若干矩形模块（固定宽高）、固定边界 W × H、两个排列 pos 与 neg | rectangular blocks with fixed width and height, a fixed outline W × H, two permutations pos and neg |
| Output | 每块左下角坐标 (x, y)；约束图 H、V；包围盒；合法性与装得下与否；面积指标 | lower-left (x, y) of every block; constraint graphs H and V; bounding box; validity and fit; area metrics |
| Objective | 用两个排列表示一种布局，并算出满足全部相对位置的最紧凑坐标 | represent a layout by two permutations and compute the most compact coordinates that satisfy every relative position |
| Constraints | pos、neg 都是同一组 id 的排列；每对块恰好一种关系；水平边 x[j] ≥ x[i] + w[i]，竖直边 y[j] ≥ y[i] + h[i] | pos and neg are permutations of the same ids; exactly one relation per pair; H edge x[j] ≥ x[i] + w[i], V edge y[j] ≥ y[i] + h[i] |
| Assumptions | 原点左下、y 向上（教师约定）；尺寸固定、不旋转（旋转与软模块是标明的拓展）；贴边允许，正面积相交才是重叠 | origin lower-left, y up (instructor's convention); fixed sizes, no rotation (rotation and soft blocks are labelled extensions); touching allowed, only positive-area intersection is overlap |
| Stop | 所有块坐标确定（两遍 DP 各 n 步）后报告；不合法的输入在第一步报告全部问题并停止 | report once every coordinate is fixed (two DP passes of n steps); invalid input stops at step 1 with every problem listed |

## 2. 目标 · Objectives (6)

- **o1** 说明布图规划要解决什么、为什么直接搜坐标很麻烦 → `m06-problem`
- **o2** 由 pos / neg 读出任意两块的相对位置（四种情况），并识别不合法的序列对 → `m06-rule`, c1, c2
- **o3** 把关系变成水平 / 竖直约束图（DAG），写出每条边的不等式 → `m06-graphs`, c3
- **o4** 用最长路径 DP 算坐标，解释为什么加前驱的尺寸、为什么取最大 → `m06-dp`, c4, c5
- **o5** 把完整性、不重叠、装得下、紧凑程度分开判断；分清不变量与可变量 → `m06-metrics`, c6
- **o6** 推理排列的改动如何改变几何（包括“不同编码、同一布局”），并在 Python 中实现 → `m06-encoding`, `m06-pseudocode`, c7, python

## 3. 讲解顺序 · Lesson order

`m06-problem` → `m06-rule` → `m06-graphs` → `m06-dp` → `m06-metrics` → `m06-encoding` → `m06-pseudocode` → `m06-limits`

Graduated examples: two blocks (the rule) → three blocks (maximum over predecessors) → the instructor's five blocks → a valid
pair that overflows → two pairs with the same packing.

## 4. 验收数值 · Acceptance numbers (engine)

- Fixture tiny5: A 3×2, B 2×3, C 2×2, D 3×1, E 2×2; outline 10 × 8 (instructor JSON `{W, H}` normalised to `{w, h}`).
- Golden pair pos = A B C E D, neg = D A B C E:
  - relations: H edges A→B, A→C, A→E, B→C, B→E, C→E; V edges A→D, B→D, C→D, E→D (10 pairs, implied edges kept).
  - x: A 0, B 3, C 5, E 7 (= max(0+3, 3+2, 5+2)), D 0. y: A B C E 0, D 3 (= max(0+2, 0+3, 0+2, 0+2)).
  - bounding box 9 × 4 = 36; block area 23; bbox unused 13; bbox utilisation 63.89 %.
  - outline area 80; outline unused 57; outline density 28.75 % — **constant for every pair**.
- Upstream `GOLDEN_PACK` (D at y = 2) is a separate illustrative placement, not this pair's output (D at y = 3).
- Two blocks: pos AB / neg AB → B at x 3; pos AB / neg BA → B at y 2.
- Three blocks A 3×2, C 2×2, B 2×3, pos A C B, neg C A B: x[B] = max(0+3, 0+2) = 3; the minimum 2 would overlap A.
- Overflow: pos = neg = A B C D E → 12 × 3 (2 too wide); pos A B C D E, neg E D C B A → 3 × 10 (2 too tall). Both non-overlapping.
- Same packing, different pair: pos A B C D E / neg D A B C E (swap E, D in pos). Exactly 3 pairs give the golden packing.
- Exhaustive: 14,400 pairs, all non-overlapping, 13,680 fit 10 × 8, 720 do not; 9,056 distinct packings; smallest bbox 24 (6 × 4,
  e.g. pos A C D E B / neg C E A B D).
- Mirrored textbook convention ("before in pos, after in neg → above") equals this convention with pos and neg swapped (tested on 400 pairs).

## 5. 影片 · Films (four)

- 科普 *Two lines of letters* (cut to the author's chosen track, pending the music decision): five blocks land on a die → the coordinates
  dissolve into two words → why coordinates are a bad search space → title → the rule → ten pairs → two graphs → E's DP (3, 5, 7 → 7)
  → why max (three blocks, the min overlaps) → the packing 9 × 4 → breath → a valid pair that overflows → constant vs variable metrics
  → where it is used (annealing over sequence pairs) → twin encodings, open question → invitation to the lab.
- 精讲 (≈ 2:10): problem and convention; the rule; ten pairs → H and V; DP for x; DP for y; packing and metrics; overflow; summary.
- 进阶 (≈ 3 min): I why longest path = smallest feasible coordinates; II why max (three blocks); III why there is no cycle (pos order is
  topological); IV non-overlap ≠ fit, constant metrics (14,400 / 13,680); V many pairs, one packing (3 for golden; 9,056 distinct);
  VI the mirrored convention; VII cost O(n²) and search moves; summary.
- 实验演示: recorded from the real page (Playwright): load presets, step the trace, edit a permutation, see stale results replaced,
  overflow preset, code lab.

## 6. 课件 · Slides (14)

1 title · 2 problem · 3 convention and rule · 4 two blocks · 5 ten relations · 6 two graphs · 7 longest path and why max · 8 DP x ·
9 DP y · 10 packing and separate metrics · 11 overflow and constants · 12 encodings and moves · 13 pseudocode · 14 limits and next.

## 7. 挑战 · Challenges (7) and concept checks (6)

c1 [推演] 读出相对位置 (Intro) · c2 [纠错] 诊断不合法的序列对 (Intro) · c3 [构图] 谁指向 E、谁指向 D (Practice) ·
c4 [推演] 算一个坐标 (Practice) · c5 [实现] 写出整张布局 (Practice) · c6 [约束] 造一个合法却装不下的序列对 (Stretch) ·
c7 [比较] 换一种写法、同一张布局 (Stretch).

Concept checks: left-of in both sequences; area ≥ total area does not mean fit; density is constant; max vs min; same coordinates
from different pairs; why pos order is a topological order.

## 8. 范围 · Scope

In: sequence-pair representation, constraint graphs, longest-path packing, metrics, neighbour moves as a preview. Out (background only):
the rest of the floorplanning syllabus (slicing / Polish expressions, B*-trees, full simulated annealing, soft-block sizing, routing).
