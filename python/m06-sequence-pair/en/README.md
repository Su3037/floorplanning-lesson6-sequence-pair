# Module 06 Sequence-Pair · Python exercise pack

Implement sequence-pair evaluation yourself. From Floorplanning · Lesson 6 (Module 06). You can also do this exercise in the browser on the module page, with nothing to install; this pack is for working offline.

## Requirements

Python 3.9 or newer, standard library only. Unzip into any empty folder; nothing else from the course repository is needed.

## Files

| File | Purpose |
| --- | --- |
| `starter.py` | Starter code with TODOs (`NotImplementedError`) |
| `check.py` | Checker: reports PASS / FAIL / INCOMPLETE / ERROR / SKIP for each check |
| `reference.py` | Reference solution, for when you are stuck |
| `fixtures/` | `sequence-pair.json` |

## Running

```
python3 check.py --lang en              # check starter.py (unfinished functions report INCOMPLETE, never PASS)
python3 check.py reference.py --lang en # the reference passes every check
python3 reference.py                    # the reference on this module's example
```

The exit code is 0 when everything passes, and 1 on any FAIL, ERROR or INCOMPLETE. SKIP means an optional dependency was missing and the check did not run; it is not a pass. Set `COURSE_LANG=en` to drop the `--lang en`.

**Tasks** (`starter.py`, five functions):

1. `validate_pair(pos, neg, ids)`: list every problem (missing, repeated, unknown, different lengths).
2. `relation(pos, neg, a, b)`: return `left` / `right` / `below` / `above`.
3. `build_graphs(pos, neg)`: return the horizontal and vertical edges, exactly one per pair.
4. `longest_path(nodes, edges, size, rank)`: DP in topological order; take the maximum, add the predecessor’s size.
5. `metrics(modules, outline, placement)`: complete, overlaps (touching is fine), overflow, bounding box, area metrics.

**Hint 1**: start with two blocks only: with pos = A B, neg = B A, where is A? Then generalise to every pair.

**Hint 2**: write each DP step as “candidate = predecessor’s coordinate + predecessor’s size; take the maximum; compare with 0”. The checker verifies on 300 random pairs that every edge holds and every block is compacted, and computes all 14,400 five-block pairs.

## Output of the reference (actually run for this pack)

```
golden A B C E D | D A B C E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (0, 3), 'E': (7, 0)} bbox (9, 4) fits True
row A B C D E | A B C D E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (7, 0), 'E': (10, 0)} bbox (12, 3) fits False
stack A B C D E | E D C B A → {'A': (0, 0), 'B': (0, 2), 'C': (0, 5), 'D': (0, 7), 'E': (0, 8)} bbox (3, 10) fits False
twin A B C D E | D A B C E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (0, 3), 'E': (7, 0)} bbox (9, 4) fits True
tight A C D E B | C E A B D → {'A': (0, 0), 'B': (4, 1), 'C': (0, 2), 'D': (3, 0), 'E': (2, 2)} bbox (6, 4) fits True
```

## Notes

- The checker tests the hand-worked examples, 300 random pairs and all 14,400 five-block pairs, so memorised answers will not pass.
- The example and convention come from the instructor’s learn_floorplanning course (Floorplanning - Lesson 6, CC BY 4.0). This pack is new; code under MIT.
