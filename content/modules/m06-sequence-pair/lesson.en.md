## {#m06-problem} What floorplanning has to solve

Before anyone draws a transistor, a chip has to decide **where the big things go**: processor cores, caches, interfaces, analogue circuits. Each is a rectangle whose width and height are roughly known. Arranging these rectangles inside the chip’s given outline, without overlap, as compactly as possible and with related blocks close together, is **floorplanning**. It comes before detailed placement and routing, and it fixes the skeleton of the layout.

```terms
module / block | 模块 / 块 | One rectangle in the floorplan, with a fixed width w and height h. This lesson’s example has five, A–E.
floorplan | 布图 | The arrangement you get once every block has a position (here, its lower-left corner x, y).
fixed outline | 固定边界 | The rectangular area the chip leaves for these blocks, width W and height H. Here 10 × 8.
```

The whole lesson uses the instructor’s five-block example (`examples/tiny_modules.json`):

| Block | width w | height h | area |
| --- | --- | --- | --- |
| A | 3 | 2 | 6 |
| B | 2 | 3 | 6 |
| C | 2 | 2 | 4 |
| D | 3 | 1 | 3 |
| E | 2 | 2 | 4 |
| Total | | | **23** |

The fixed outline is 10 × 8, area 80. The blocks take only 23, so there seems to be room to spare. We will see that “enough area” is not the same as “fits”.

**Why not search coordinates directly?** The most direct description writes down (x, y) for each block: ten numbers for five blocks. But when a computer has to **search** for a good floorplan, coordinates are an awkward representation:

1. Change one number at random and a block may land on another. Almost every combination of coordinates **overlaps**, so a search spends most of its time in illegal states.
2. Coordinates are continuous, so one arrangement of “who is left of whom” has infinitely many coordinate versions, most of them shifted by a hair.
3. What really matters is usually the **relative order** (who is next to whom, who is on top), and coordinates hide it.

Floorplanning algorithms therefore use a **representation**: a discrete structure that records relative positions, plus a fixed procedure that turns it into coordinates. Earlier lessons used slicing trees (Polish expressions) and the B\*-tree. This lesson’s **sequence pair**, introduced by Murata, Fujiyoshi, Nakatake and Kajitani in 1995–1996, uses only **two permutations** to describe the left/right/above/below relation of every pair of blocks, and every pair of permutations gives an overlap-free arrangement.

```callout warn A teaching example
This lesson’s program handles a few to a dozen or so rectangles, to make the representation and its constraints visible. Real chip floorplanning also deals with wire length, timing, power, pins, blocks of variable shape and blockages on different layers; detailed placement, routing and sign-off belong to dedicated EDA tools. What is taught here is one core idea, not a production flow.
```

## {#m06-rule} Two permutations, four relations

```terms
permutation | 排列 | The same set of blocks, each written once, in a row. Five blocks have 5! = 120 permutations.
relative order | 相对次序 | Whether a comes before or after b in one permutation. Only the order counts, not how far apart they are.
sequence pair | 序列对 | Two permutations (pos, neg), also written Γ+, Γ−. Both must contain the same blocks.
```

Every pair of blocks (a, b) has two orders in a sequence pair: which comes first in pos, and which comes first in neg. Together they give exactly four cases, one for each relative position:

| in pos | in neg | relation | constraint |
| --- | --- | --- | --- |
| a before b | a before b | **a left of b** | x[b] ≥ x[a] + w[a] |
| a after b | a after b | a right of b | x[a] ≥ x[b] + w[b] |
| a before b | a after b | **a below b** | y[b] ≥ y[a] + h[a] |
| a after b | a before b | a above b | y[a] ≥ y[b] + h[b] |

In one line: **same order in both → left/right; opposite orders → below/above**. The block on the left is the one that comes first in both; the block below is the one that comes first in pos.

**This lesson’s coordinate convention** (the same as the instructor’s `common/pack.py`): the origin is at the lower left, x grows to the right and y grows **upwards**. Screen SVG and canvas coordinates grow downwards; the figures here flip y when drawing, but every rule and coordinate is computed with y up, and the rule is never quietly changed.

```callout warn Another convention
Some textbooks and papers write the third row as “before in pos, after in neg → **above**”. Both conventions are consistent; they are vertical mirror images. The tests prove that (pos, neg) under that convention gives exactly the same coordinates as (neg, pos) under this one. When reading other material, check which one it uses before deciding whether to swap the two sequences.
```

The smallest example has two blocks, A 3 × 2 and B 2 × 3:

```html
<div class="fp-fig" data-fig="rule2"></div>
```

- pos = A B, neg = A B: A comes first in both → A is left of B, and B starts at x = 3.
- pos = A B, neg = B A: the orders disagree and A is first in pos → A is below B, and B starts at y = 2.

With n blocks there are n(n − 1)/2 pairs, and each pair falls into **exactly one** of the four cases. A sequence pair can never leave a pair unspecified, or put it both left of and above another. That is one of the basic reasons it is easier to work with than coordinates.

**A valid sequence pair**: pos and neg must both be permutations of the same blocks. There are four common mistakes, and the engine lists all of them rather than stopping at the first:

| Mistake | Example | Report |
| --- | --- | --- |
| missing block | pos = A B C E | pos is missing D; the lengths differ |
| repeated block | neg = D A B C A | A appears twice in neg; neg is missing E |
| unknown block | pos = A B C E Z | pos has an unknown module Z; pos is missing D |
| different lengths | pos has 4 entries, neg 5 | the lengths differ |

## {#m06-graphs} From relations to constraint graphs

```terms
constraint graph | 约束图 | Nodes are blocks; a directed edge i → j is one inequality saying “j must clear i”.
horizontal graph H | 水平约束图 | An edge i → j when i is left of j; its inequality is x[j] ≥ x[i] + w[i].
vertical graph V | 竖直约束图 | An edge i → j when i is below j; its inequality is y[j] ≥ y[i] + h[i].
DAG | 有向无环图 | A directed graph in which following the arrows never returns to the start. A constraint graph must be a DAG, or the inequalities have no solution.
```

Writing each pair’s relation as an edge gives two graphs: left/right relations go into H, below/above relations into V. **Each pair goes into exactly one of the two graphs**, so together they have exactly n(n − 1)/2 edges.

Take the instructor’s pair **pos = A B C E D, neg = D A B C E**. The ten relations are (a and b listed in pos order):

| Pair | in pos | in neg | relation | edge |
| --- | --- | --- | --- | --- |
| A, B | A first | A first | A left of B | H: A → B |
| A, C | A first | A first | A left of C | H: A → C |
| A, E | A first | A first | A left of E | H: A → E |
| A, D | A first | A second | A below D | V: A → D |
| B, C | B first | B first | B left of C | H: B → C |
| B, E | B first | B first | B left of E | H: B → E |
| B, D | B first | B second | B below D | V: B → D |
| C, E | C first | C first | C left of E | H: C → E |
| C, D | C first | C second | C below D | V: C → D |
| E, D | E first | E second | E below D | V: E → D |

H has 6 edges and V has 4: A, B, C, E stand in a row from left to right, and D sits above all of them.

```html
<div class="fp-fig" data-fig="graphs"></div>
```

**Some edges are implied.** The edge A → E follows from A → B → C → E: if B clears A, C clears B and E clears C, then E clears A. The figure dashes such edges. They are not so redundant that they should be deleted; including every edge when computing coordinates is simplest and never wrong. Dashing them just keeps the picture readable.

**Why can a constraint graph never have a cycle?** Every edge i → j, in H or in V, requires **i to come before j in pos**: “left of” needs “first in both sequences”, and “below” needs “first in pos”. Following the arrows, the position in pos only increases, so you can never get back to the start. This also hands us a processing order: **handle the blocks in pos order**. When we reach j, all of its predecessors are already done. Such an order is called a **topological order**.

## {#m06-dp} Longest paths: why add the predecessor’s width, why take the maximum

```terms
longest path | 最长路径 | In a DAG, the largest total edge weight over all paths from any source into j.
compaction | 压紧 | Every block sits at the smallest coordinates that satisfy all constraints: it slides left (or down) until something stops it.
```

Each block now has a set of inequalities to satisfy. E’s horizontal predecessors, for example, are A, B and C:

- x[E] ≥ x[A] + w[A]
- x[E] ≥ x[B] + w[B]
- x[E] ≥ x[C] + w[C]
- and x[E] ≥ 0 (it cannot leave the left edge)

**Why add the predecessor’s width, not E’s own?** The edge i → j says “j’s left side must not cross i’s right side”. i’s right side is at x[i] + w[i], so the width added is **i’s**. E’s own width decides where E’s right side is, which has nothing to do with this inequality.

**Why take the maximum?** Every inequality must hold, so x[E] must be at least every right-hand value. The **smallest** value that satisfies all of them is their **maximum**. The minimum satisfies only one.

Start with three blocks: A 3 × 2, C 2 × 2, B 2 × 3, pos = A C B, neg = C A B. A is below C, and both A and C are left of B.

```html
<div class="fp-fig" data-fig="three"></div>
```

| Block | horizontal predecessors | candidates | x |
| --- | --- | --- | --- |
| A | none | 0 | 0 |
| C | none | 0 | 0 |
| B | A, C | A: 0 + 3 = **3**; C: 0 + 2 = 2 | **3** |

With the minimum, 2, B would start at x = 2 and sit on A’s upper-right corner (A covers x 0–3, y 0–2). That is the red overlap in the right-hand figure.

Doing this for every block is **dynamic programming in topological order**:

- `x[j] = max(0, over all H edges i→j of x[i] + w[i])`
- `y[j] = max(0, over all V edges i→j of y[i] + h[i])`

The value is the **length of the longest path into j** in H (or V), where edge i → j weighs w[i] (or h[i]). It is the smallest coordinate satisfying every constraint, so the floorplan is **compacted**: no block can move further left or down.

For the instructor’s pair, compute x in pos order A, B, C, E, D:

| Step | Block | H predecessors → candidates | max | x |
| --- | --- | --- | --- | --- |
| 1 | A | none | 0 | 0 |
| 2 | B | A: 0 + 3 = 3 | 3 | 3 |
| 3 | C | A: 0 + 3 = 3; B: 3 + 2 = 5 | 5 | 5 |
| 4 | E | A: 3; B: 5; C: 5 + 2 = 7 | 7 | 7 |
| 5 | D | none (D is above or below everything) | 0 | 0 |

Then y:

| Step | Block | V predecessors → candidates | max | y |
| --- | --- | --- | --- | --- |
| 1–4 | A, B, C, E | none | 0 | 0 |
| 5 | D | A: 0 + 2 = 2; B: 0 + 3 = **3**; C: 0 + 2 = 2; E: 0 + 2 = 2 | 3 | 3 |

D is pushed up to y = 3 by the tallest block, B (height 3). The result:

| Block | x | y | w × h |
| --- | --- | --- | --- |
| A | 0 | 0 | 3 × 2 |
| B | 3 | 0 | 2 × 3 |
| C | 5 | 0 | 2 × 2 |
| E | 7 | 0 | 2 × 2 |
| D | 0 | 3 | 3 × 1 |

```html
<div class="fp-fig" data-fig="golden"></div>
```

```callout warn Do not mix two “reference answers”
The instructor’s `common/goldens.py` also contains a `GOLDEN_PACK` with D at (0, 2). That is a separately drawn illustration, **not** what this sequence pair computes. By the sequence-pair rules D is above B, and B is 3 tall, so D can only start at y = 3.
```

**Cost.** Listing every pair takes n(n − 1)/2 steps; the DP looks at every predecessor of every block, also O(n²) in total. This lesson implements exactly that O(n²) version. Faster algorithms exist (Tang and Wong reach O(n log n) with a longest-common-subsequence formulation); this lesson does not implement them and does not claim its program has that complexity.

## {#m06-metrics} Valid, fits, compact: three separate questions

```terms
overlap | 重叠 | Two blocks whose interiors share positive area. Sharing only an edge (zero-area intersection) is not overlap.
overflow | 溢出 | A block outside the fixed outline. Width overflow is max(0, box width − W); height likewise.
bounding box | 包围盒 | The smallest rectangle containing every block (from the origin to the rightmost and topmost edges).
density | 密度 | Total block area divided by the area of some region. Say whether the region is the outline or the bounding box.
dead space | 空余面积 | Area of a region not covered by blocks; again, say whether you mean the outline or the bounding box.
```

Once the instructor’s pair is computed, there are really four different questions, and the answers are reported separately:

| Question | How to decide | Instructor’s pair |
| --- | --- | --- |
| Complete? | every block placed exactly once, none missing, none extra | yes (5 blocks) |
| Overlap? | does any pair share positive area | no (guaranteed by the pair) |
| Fits? | every block within 0 ≤ x, x + w ≤ W, 0 ≤ y, y + h ≤ H | yes: the 9 × 4 box is inside 10 × 8 |
| Compact? | bounding-box area, bounding-box utilisation | 9 × 4 = 36, 13 unused, utilisation 23 / 36 ≈ 63.89 % |

Two more numbers are often reported alongside: **outline area 80, block area 23, outline unused 57, outline density 23 / 80 = 28.75 %**. Note carefully that these **do not depend on the sequence pair**: the block areas are fixed and so is the outline, so however you arrange the blocks they never change. The tests compute all 14,400 sequence pairs; outline unused is always 57 and density always 28.75 %. So:

- do not animate them as “improving as the blocks move”;
- do not treat “outline area − block area ≥ 0” as proof that it fits; nor does a negative difference mean any kind of “usable space”.

What does change with the pair is **the bounding box’s width and height, its area and utilisation, whether it overflows, and by how much**.

**Valid ≠ fits.** Look at pos = A B C D E, neg = A B C D E. The two sequences are identical, so every pair is left/right and the five blocks stand in one row:

```html
<div class="fp-fig" data-fig="row"></div>
```

Width 3 + 2 + 2 + 3 + 2 = 12, 2 more than the outline; height only 3. Nothing overlaps; it is a perfectly valid sequence pair, and it does not fit. Reverse neg (E D C B A) and every pair becomes below/above: the five blocks stack into a column 2 + 3 + 2 + 1 + 2 = 10 tall, 2 more than the outline.

```callout warn What a sequence pair guarantees, and what it does not
It guarantees that every pair of blocks has a definite relative position, and that the longest-path coordinates are **overlap-free** and compacted. It does not guarantee fitting any given outline, minimum area, or that each geometric arrangement has only one encoding. Of the 14,400 five-block pairs, 13,680 fit 10 × 8 and 720 do not.
```

## {#m06-encoding} What happens when you change a permutation

The basic move of a floorplan search is: make a small change to the sequence pair, recompute the coordinates, and see whether the metrics got better or worse. The three most common changes are swapping two blocks in pos only, in neg only, or in both.

Starting from the instructor’s pair and swapping only **adjacent** blocks, the outcomes differ:

| Change | pos | neg | bounding box | coordinates changed? |
| --- | --- | --- | --- | --- |
| none | A B C E D | D A B C E | 9 × 4 | — |
| swap A, B in pos | B A C E D | D A B C E | 7 × 6 | yes |
| swap C, E in pos | A B E C D | D A B C E | 7 × 5 | yes |
| swap E, D in pos | A B C D E | D A B C E | 9 × 4 | **no** |
| swap D, A in neg | A B C E D | A D B C E | 9 × 4 | yes |
| swap C, E in neg | A B C E D | D A B E C | 7 × 5 | yes |

Two things stand out:

1. **Different sequence pairs can give exactly the same floorplan.** After swapping E and D in pos, the relation between E and D changes from “E below D” to “D left of E”. The relation changed, but D sits top-left (x 0–3) and E bottom-right (x 7–9), so both relations hold and the coordinates are identical. Exhaustive enumeration shows that the 14,400 five-block pairs give only 9,056 distinct floorplans; the instructor’s floorplan has exactly 3 encodings (neg unchanged, D in any of the three places after B in pos).
2. **The same bounding box does not mean the same floorplan.** After swapping D and A in neg the box is still 9 × 4, but A has moved to the left of D and the coordinates changed.

```html
<div class="fp-fig" data-fig="twin"></div>
```

```callout warn Same conclusion, without overstating it
“Changing a permutation” need not move every block, and need not move any block; what it changes is the **relation** of some pairs. The only way to know whether the geometry changed is to recompute.
```

**From representation to search.** With five blocks all 14,400 pairs can be computed; the tightest bounding box is 6 × 4 = 24 (for example pos = A C D E B, neg = C E A B D), just 1 more than the block area. With more blocks the (n!)² pairs can no longer be enumerated, and real floorplanners use random search such as **simulated annealing**: repeat the three small changes above and accept or reject each by a cost (bounding-box area, overflow, wire length and so on). The next lesson covers that step; the lab here has a “random neighbour” button to get a feel for “change one thing, recompute”.

## {#m06-pseudocode} Reading the pseudocode line by line

```pseudo sp
check that pos and neg are both permutations of the blocks; list every problem   || Line 1: report missing, repeated and unknown blocks and different lengths. Stop here if invalid.
for each pair (i, j) with i before j in pos:                                   || Line 2: n(n − 1)/2 pairs, each looked at once.
    if i is also before j in neg: add H edge i → j (i left of j)                || Line 3: same order → left/right. The edge means x[j] ≥ x[i] + w[i].
    else: add V edge i → j (i below j)                                         || Line 4: opposite orders → below/above. The edge means y[j] ≥ y[i] + h[i].
order ← pos (a topological order of both graphs)                               || Line 5: every edge runs from an earlier block in pos to a later one, so pos order never meets an unfinished predecessor.
for each j in order: x[j] ← max(0, max over H edges i→j of x[i] + w[i])        || Line 6: add predecessor i’s width; take the maximum because every edge must hold. 0 with no predecessor.
for each j in order: y[j] ← max(0, max over V edges i→j of y[i] + h[i])        || Line 7: likewise, add predecessor i’s height.
report: complete, overlap, fits, bounding box, area metrics                    || Line 8: answer the four questions separately; outline unused and density are constants, the box metrics change.
```

**Matching the Python exercise**: line 1 → `validate_pair()`; lines 2–4 → `relation()` and `build_graphs()`; lines 5–7 → `longest_path()` (the exercise finds a topological order with Kahn’s algorithm, an independent route from the web engine’s pos order, and the tests compare them block by block); line 8 → `metrics()`.

**Matching the lab**: each “event” in the lab is one line of the pseudocode executed for one pair or one block: 1 validation event, 10 relation events (line 3 or 4), 1 order event, 10 coordinate events (5 for x, 5 for y) and finally 1 report event. When stepping, the pseudocode on the right highlights the current line, and a coordinate event lists every candidate and marks the one that gave the maximum.

## {#m06-limits} Background, applications and limits

**Origin.** The sequence pair was introduced by H. Murata, K. Fujiyoshi, S. Nakatake and Y. Kajitani (ICCAD 1995; full paper *VLSI Module Placement Based on Rectangle-Packing by the Sequence-Pair*, IEEE TCAD 15(12), 1996). The paper proves that every overlap-free arrangement of rectangles can be represented by some sequence pair, and conversely that the arrangement computed from any sequence pair through its constraint graphs is overlap-free. This turns “search all legal arrangements” into “search (n!)² pairs of permutations”. The paper’s figures are outside this lesson’s licences; it is cited, not reproduced.

**Applications.** Like the B\*-tree, the sequence pair is a common representation in annealing-based floorplanners: the state is a sequence pair, neighbours are swaps or rotations, and the cost usually combines area, fixed-outline overflow and wire length. Fixed-outline research (for example Adya and Markov’s Parquet, 2003) also uses the sequence pair as a core representation.

**Limits.**

- Block sizes here are fixed and unrotated; soft blocks (fixed area, variable aspect ratio) and rotation both let one sequence pair map to different coordinates. The lab’s “rotate” control is a labelled extension and does not change the lesson’s reference answers.
- This lesson only turns a sequence pair into coordinates; it does not find a good pair. That is the job of a search algorithm (next lesson: simulated annealing).
- Coordinates are pushed to the lower left; when a pair does not fit, the program reports the overflow and does not reorder anything.
- There is no model of wires, pins, timing or power; the bounding box and overflow are purely geometric. Adding a wire length such as HPWL would still give only a **proxy**, not the wire length after routing.
- The O(n²) teaching implementation suits a few dozen blocks; larger instances need faster evaluation and incremental updates.
