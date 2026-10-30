<p class="eyebrow">Foundations</p>

## Foundations: rectangles, coordinates, graphs, longest paths

The minimum background for this lesson. The lesson expands each idea the first time it is used; this page keeps the definitions in one place.

### Why chips are floorplanned first

A chip often holds dozens of large blocks: processor cores, memories, analogue circuits, interfaces. Their shapes are roughly fixed, and they must be arranged on a die of given size so that **nothing overlaps and everything fits the outline**, with heavily connected blocks close together. This step is **floorplanning**, and it bounds how good the later placement and routing can be.

### Rectangles and coordinates

- Each block is a rectangle of width w and height h; in this lesson it is neither rotated nor reshaped.
- The coordinate (x, y) is the **lower-left corner**. The origin is lower-left, x grows right and y grows up (the instructor’s convention).
- A block occupies [x, x + w] × [y, y + h]. Blocks that only share an edge or a corner are **touching**, not overlapping; overlap needs a positive-area intersection.

### Writing “left of” as an inequality

“A is left of B” does not mean the blocks touch. It means B’s left side does not cross A’s right side:

> x[B] ≥ x[A] + w[A]

“A is below B” likewise: y[B] ≥ y[A] + h[A]. A layout has many such lower bounds, and one block may be bound by several at once.

### Directed graphs and topological order

- **Directed graph**: nodes and directed edges. Here the nodes are blocks, and an edge i → j is one lower bound.
- **Directed acyclic graph (DAG)**: following edges never returns to the start.
- **Topological order**: a line-up of the nodes in which every edge points forward. Every DAG has one.

### Why the longest path gives the smallest coordinate

Use “the predecessor’s width” as the length of an edge. A block’s x must be at least every predecessor’s x plus that predecessor’s width, so the smallest it can be is the **largest** of those values; with no predecessor it is 0. Working through the blocks in topological order, looking at each incoming edge once, gives every coordinate. That is the longest path in a DAG.

| Algorithm | Work | Cost (n blocks) |
| --- | --- | --- |
| This lesson’s evaluator | pairwise graph + two DP passes | O(n²) |
| FAST-SP (further reading) | weighted longest common subsequence | O(n log n) |

### The five-block example

| Block | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| w × h | 3 × 2 | 2 × 3 | 2 × 2 | 3 × 1 | 2 × 2 |

Total block area 6 + 6 + 4 + 3 + 4 = 23; the fixed outline is 10 × 8 = 80.
