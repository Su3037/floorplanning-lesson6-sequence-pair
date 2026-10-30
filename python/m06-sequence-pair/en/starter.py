"""Module 06 · Sequence-Pair: starter code (Python 3.9+, standard library only).

Complete the five functions marked NotImplementedError (tasks 1–5). _topological(), pack() and trace() are provided.
When stuck, read the two hints in README.md first, and reference.py last.

Convention (same as the instructor's common/pack.py): origin lower-left, x to the right, y up.
    i before j in pos and before j in neg  →  i left of j   H edge i→j: x[j] ≥ x[i] + w[i]
    i before j in pos but after j in neg   →  i below j     V edge i→j: y[j] ≥ y[i] + h[i]
Coordinates are the smallest values satisfying every edge: longest paths in the constraint graphs.
Ties: the predecessor earliest in pos.
"""


def validate_pair(pos, neg, ids):
    """Task 1: check that pos and neg are each exactly a permutation of ids.

    Return a list of problems, each (code, seq, id):
      ("seq-missing", "pos", "E")  missing    ("seq-repeat", "neg", "A")  repeated
      ("seq-unknown", "pos", "Z")  unknown id ("seq-length", None, None)  the two lengths differ
    Return [] when there is none. List every problem; do not stop at the first.
    """
    raise NotImplementedError("validate_pair")


def relation(pos, neg, a, b):
    """Task 2: where a is relative to b: "left", "right", "below" or "above"."""
    raise NotImplementedError("relation")


def build_graphs(pos, neg):
    """Task 3: return (H, V). H holds horizontal edges (i, j) (i left of j), V vertical edges (i below j).
    Every pair of blocks gives exactly one edge (implied edges included). Sort edges by the pos positions of i, then j."""
    raise NotImplementedError("build_graphs")


def _topological(nodes, edges, rank):
    """Kahn's algorithm: nodes with in-degree 0 leave the queue in rank order. Raises ValueError on a cycle (a valid pair never has one)."""
    indeg = {n: 0 for n in nodes}
    succ = {n: [] for n in nodes}
    for i, j in edges:
        indeg[j] += 1
        succ[i].append(j)
    ready = sorted((n for n in nodes if indeg[n] == 0), key=rank)
    out = []
    while ready:
        n = ready.pop(0)
        out.append(n)
        for m in succ[n]:
            indeg[m] -= 1
            if indeg[m] == 0:
                ready.append(m)
                ready.sort(key=rank)
    if len(out) != len(nodes):
        raise ValueError("constraint graph has a cycle")
    return out


def longest_path(nodes, edges, size, rank):
    """Task 4: DP in topological order: coord[j] = max(0, max_{i→j} coord[i] + size[i]).

    Return (coord, chosen); chosen[j] is the predecessor that gave the maximum, or None if there is none (or none beats 0).
    Why add the predecessor's size[i]? Edge i→j means “j starts at or after i's right (or top) side”.
    Why the maximum, not the minimum? j must clear every predecessor, so the farthest one decides. Ties go to the smaller rank.
    For the topological order you can use _topological(nodes, edges, rank).
    """
    raise NotImplementedError("longest_path")


def pack(pos, neg, modules):
    """Return {id: (x, y)} (provided: build the graphs, then one longest_path per graph). modules is [{"id", "w", "h"}, ...]. Raises ValueError on invalid input."""
    ids = [m["id"] for m in modules]
    problems = validate_pair(pos, neg, ids)
    if problems:
        raise ValueError(f"invalid sequence pair: {problems}")
    w = {m["id"]: m["w"] for m in modules}
    h = {m["id"]: m["h"] for m in modules}
    H, V = build_graphs(pos, neg)
    rank = {b: k for k, b in enumerate(pos)}.get
    x, _ = longest_path(ids, H, w, rank)
    y, _ = longest_path(ids, V, h, rank)
    return {b: (x[b], y[b]) for b in ids}


def metrics(modules, outline, placement):
    """Task 5: check any placement. placement is {id: (x, y)} (blocks may be missing or extra). outline is {"w", "h"}.

    Return a dict: complete (each block exactly once), overlaps (pairs with positive-area intersection; touching is fine),
    outside (blocks outside the outline), fits (complete, no overlap, all inside), bbox (w, h), block_area, outline_area, outline_unused,
    outline_density、bbox_area、bbox_unused、bbox_util。
    """
    raise NotImplementedError("metrics")


def trace(pos, neg, modules):
    """For the cross-check and the films: the DP value of each block on each axis and the predecessor that set it."""
    ids = [m["id"] for m in modules]
    w = {m["id"]: m["w"] for m in modules}
    h = {m["id"]: m["h"] for m in modules}
    H, V = build_graphs(pos, neg)
    rank = {b: k for k, b in enumerate(pos)}.get
    x, cx = longest_path(ids, H, w, rank)
    y, cy = longest_path(ids, V, h, rank)
    return {"H": H, "V": V, "x": x, "y": y, "chosen_x": cx, "chosen_y": cy}


if __name__ == "__main__":
    import json
    from pathlib import Path
    data = json.loads((Path(__file__).resolve().parent / "fixtures" / "sequence-pair.json").read_text(encoding="utf-8"))
    fx = data["fixture"]
    for p in data["presets"]:
        pl = pack(p["pos"], p["neg"], fx["modules"])
        m = metrics(fx["modules"], fx["outline"], pl)
        print(p["id"], " ".join(p["pos"]), "|", " ".join(p["neg"]), "→", pl, "bbox", m["bbox"], "fits", m["fits"])
