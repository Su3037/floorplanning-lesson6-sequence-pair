"""Module 06 · 序列对（Sequence-Pair）—— 练习起始代码（Python 3.9+，仅标准库）。

补全标着 NotImplementedError 的五个函数（任务 1–5）。_topological()、pack() 与 trace() 已经写好。
卡住时先看两级提示（README.md），最后再看 reference.py。

坐标约定（与教师 common/pack.py 相同）：原点在左下角，x 向右，y 向上。
    i 在 pos 中先于 j，且在 neg 中也先于 j     →  i 在 j 左边   水平边 i→j：x[j] ≥ x[i] + w[i]
    i 在 pos 中先于 j，但在 neg 中晚于 j       →  i 在 j 下边   竖直边 i→j：y[j] ≥ y[i] + h[i]
坐标取满足所有边的最小值：约束图上的最长路径。平票：取 pos 中最靠前的前驱。
"""


def validate_pair(pos, neg, ids):
    """任务 1：检查 pos 与 neg 是否都恰好是 ids 的一个排列。

    返回问题列表，每项是 (code, seq, id)：
      ("seq-missing", "pos", "E")  缺少       ("seq-repeat", "neg", "A")  重复
      ("seq-unknown", "pos", "Z")  未知 id    ("seq-length", None, None)  两个序列长度不同
    没有问题时返回 []。把所有问题都列出来，而不是遇到第一个就停。
    """
    raise NotImplementedError("validate_pair")


def relation(pos, neg, a, b):
    """任务 2：a 相对 b 的位置："left"、"right"、"below" 或 "above"。"""
    raise NotImplementedError("relation")


def build_graphs(pos, neg):
    """任务 3：返回 (H, V)。H 是水平约束边 (i, j)（i 在 j 左边），V 是竖直约束边（i 在 j 下边）。
    每一对块恰好产生一条边（包括可以由更长路径推出的边）。边按 i、j 在 pos 中的位置排序。"""
    raise NotImplementedError("build_graphs")


def _topological(nodes, edges, rank):
    """Kahn 算法：入度为 0 的点按 rank 先出队。有环时抛出 ValueError（合法序列对的约束图不会有环）。"""
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
    """任务 4：按拓扑序做 DP：coord[j] = max(0, max_{i→j} coord[i] + size[i])。

    返回 (coord, chosen)，chosen[j] 是取到最大值的前驱，没有前驱（或都不超过 0）时为 None。
    为什么加的是前驱 i 的尺寸 size[i]？边 i→j 的意思是“j 必须从 i 的右端（或上端）开始”。
    为什么取最大而不是最小？j 的每一个前驱都要让开，最远的那个说了算。平票取 rank 较小的前驱。
    拓扑序可以用 _topological(nodes, edges, rank)。
    """
    raise NotImplementedError("longest_path")


def pack(pos, neg, modules):
    """返回 {id: (x, y)}（已写好：先建图，再对两张图各做一次 longest_path）。modules 是 [{"id", "w", "h"}, ...]。输入不合法时抛出 ValueError。"""
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
    """任务 5：检查任意摆放。placement 是 {id: (x, y)}（可以缺块、多块）。outline 是 {"w", "h"}。

    返回 dict：complete（每块恰好一次）、overlaps（正面积相交的块对，贴边不算）、outside（出界的块）、
    fits（complete 且无重叠且全在边界内）、bbox (宽, 高)、block_area、outline_area、outline_unused、
    outline_density、bbox_area、bbox_unused、bbox_util。
    """
    raise NotImplementedError("metrics")


def trace(pos, neg, modules):
    """供交叉测试与影片使用：每块每轴的 DP 值与取到最大值的前驱。"""
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
