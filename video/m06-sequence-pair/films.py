"""Module 06 · Sequence-Pair: the three rendered films (the lab walkthrough is recorded from the page).

  story     popular science, pinned to the section times of the author's chosen track (scripts/film/story.py):
            five blocks land on a die, their ten coordinates dissolve into two rows of letters, why coordinates make a
            bad search space, the rule, ten pairs, two graphs, E's maximum (3, 5, 7 → 7), D pushed to 3, the 9 × 4 box,
            why the maximum (three blocks), a valid pair that does not fit, constant versus variable metrics, search over
            pairs, and twin encodings.
  concise   the essentials, from problem and convention to the two DP passes, the metrics and an overflowing pair.
  advanced  the whys: longest path = smallest feasible coordinate, why max, why no cycle, fit versus overlap
            (14,400 / 13,680), many pairs one packing (3; 9,056), the mirrored convention, cost and search moves.

Every value on screen is read from site/data/m06-sequence-pair/traces.json (scripts/build-traces.mjs runs
site/engines/sequence-pair.js) or computed by python/m06-sequence-pair/reference.py, which tests/crosscheck.py checks
against the engine on all 14,400 five-block pairs. The asserts below stop the render if a caption and the engine disagree.
"""
import importlib.util
import json
from pathlib import Path

from cine import (W, H, L, tr, Film, Scene, Beat, GOLD, TEAL, BLUE, ROSE, AMBER, LILAC, IVORY, MUTED, FAINT, DIM,
                  PANEL_BG, NODE_BG, clamp, ease, lerp, lerp2, title_card, panel, badge, code_panel, table, pulse,
                  count_hits, substrate, note)
import cine
from story import S, TRACK, INTRO_HITS, FILL1, FILL2, PHRASE, FILL3, FILL4, title_assemble, credits, MUSIC_LINE, landed

ROOT = Path(__file__).resolve().parents[2]
T = json.loads((ROOT / "site/data/m06-sequence-pair/traces.json").read_text())
BRAND = L("Floorplanning · Lesson 6 · 序列对", "Floorplanning · Lesson 6 · Sequence-Pair")

_spec = importlib.util.spec_from_file_location("m06ref", ROOT / "python/m06-sequence-pair/reference.py")
REF = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(REF)

FX = T["fixture"]
MODS = FX["modules"]
OUT = (FX["outline"]["w"], FX["outline"]["h"])
DIMS = {m["id"]: (m["w"], m["h"]) for m in MODS}
IDS = [m["id"] for m in MODS]
COL = {"A": "#77cdbb", "B": "#8fb1e6", "C": "#d8bb78", "D": "#e39fb8", "E": "#c2a6e6"}

RUN = T["runs"]
G = RUN["golden"]["result"]
GEV = RUN["golden"]["events"]
POS, NEG = G["pos"], G["neg"]
GX, GY = G["x"], G["y"]
REL = [e for e in GEV if e["kind"] == "relation"]
DPX = {e["block"]: e for e in GEV if e["kind"] == "dp" and e["axis"] == "x"}
DPY = {e["block"]: e for e in GEV if e["kind"] == "dp" and e["axis"] == "y"}
M = G["metrics"]
ROW, STACK, TWIN, TIGHT = (RUN[k]["result"] for k in ("row", "stack", "twin", "tight"))
THREE = T["small"]["three-max"]
THREE_R = THREE["result"]
THREE_B = [e for e in THREE["events"] if e["kind"] == "dp" and e["axis"] == "x" and e["block"] == "B"][0]
ST = T["stats"]

# ---- facts the captions state, checked against the engine before a single frame is drawn
assert POS == list("ABCED") and NEG == list("DABCE")
assert (GX, GY) == ({"A": 0, "B": 3, "C": 5, "E": 7, "D": 0}, {"A": 0, "B": 0, "C": 0, "E": 0, "D": 3})
assert [(c["from"], c["value"]) for c in DPX["E"]["candidates"]] == [("A", 3), ("B", 5), ("C", 7)] and DPX["E"]["chosen"]["from"] == "C"
assert [(c["from"], c["value"]) for c in DPY["D"]["candidates"]] == [("A", 2), ("B", 3), ("C", 2), ("E", 2)] and DPY["D"]["value"] == 3
assert len(G["H"]) == 6 and len(G["V"]) == 4 and len(REL) == 10
assert (M["bbox"]["w"], M["bbox"]["h"], M["bboxArea"], M["blockArea"], M["outlineUnused"]) == (9, 4, 36, 23, 57)
assert abs(M["outlineDensity"] - 0.2875) < 1e-9 and abs(M["bboxUtil"] - 23 / 36) < 1e-9
assert (ROW["metrics"]["bbox"]["w"], ROW["metrics"]["bbox"]["h"], ROW["metrics"]["fits"]) == (12, 3, False)
assert (STACK["metrics"]["bbox"]["w"], STACK["metrics"]["bbox"]["h"], STACK["metrics"]["fits"]) == (3, 10, False)
assert ROW["metrics"]["nonOverlap"] and STACK["metrics"]["nonOverlap"]
assert TWIN["pos"] == list("ABCDE") and TWIN["neg"] == NEG and TWIN["x"] == GX and TWIN["y"] == GY
assert THREE_R["pos"] == list("ACB") and THREE_R["neg"] == list("CAB")
assert [(c["from"], c["value"]) for c in THREE_B["candidates"]] == [("A", 3), ("C", 2)] and THREE_B["value"] == 3
assert (ST["pairs"], ST["fit"], ST["overflow"], ST["distinctPackings"], ST["sameAsGolden"]) == (14400, 13680, 720, 9056, 3)
assert (ST["tightest"]["w"], ST["tightest"]["h"]) == (6, 4)
assert (TIGHT["metrics"]["bbox"]["w"], TIGHT["metrics"]["bbox"]["h"]) == (6, 4)
# the minimum would overlap: B at x = 2 intersects A (x 0–3, y 0–2)
assert REF.metrics([{"id": "A", "w": 3, "h": 2}, {"id": "C", "w": 2, "h": 2}, {"id": "B", "w": 2, "h": 3}], {"w": 6, "h": 5},
                   {"A": (0, 0), "C": (0, 2), "B": (2, 0)})["overlaps"] == [("A", "B")]
# the adjacent swaps the advanced film shows
ADJ = {(a["seq"], tuple(a["swap"])): a for a in T["adjacent"]}
assert ADJ[("pos", ("E", "D"))]["same"] and tuple(ADJ[("pos", ("E", "D"))]["bbox"]) == (9, 4)
assert not ADJ[("neg", ("D", "A"))]["same"] and tuple(ADJ[("neg", ("D", "A"))]["bbox"]) == (9, 4)
assert tuple(ADJ[("pos", ("A", "B"))]["bbox"]) == (7, 6)


def rects_of(res):
    return [(r["id"], r["x"], r["y"], r["w"], r["h"]) for r in res["rects"]]


GOLD_R = rects_of(G)


# ====================================================================== drawing helpers
def plan(fr, rects, ox, oy, u, alpha=1.0, outline=OUT, extent=None, focus=None, pending=(), coords=True, grid=True,
         labels=True, red=(), ghost=None, axes=True, outline_alpha=1.0, size=None):
    """A floorplan in original units: origin lower-left at screen (ox, oy), y up. rects: (id, x, y, w, h)."""
    if alpha <= 0:
        return
    ew, eh = extent or (max([outline[0]] + [x + w for _, x, _, w, _ in rects]), max([outline[1]] + [y + h for _, _, y, _, h in rects]))
    if grid:
        for i in range(int(ew) + 1):
            fr.line((ox + i * u, oy), (ox + i * u, oy - eh * u), "#14313a", 1, alpha)
        for j in range(int(eh) + 1):
            fr.line((ox, oy - j * u), (ox + ew * u, oy - j * u), "#14313a", 1, alpha)
    if axes:
        step = 1 if ew <= 12 else 2
        for i in range(0, int(ew) + 1, step):
            fr.text(str(i), ox + i * u, oy + 26, 16, MUTED, 0.8 * alpha, anchor="c", role="mono")
        for j in range(0, int(eh) + 1, 1 if eh <= 10 else 2):
            fr.text(str(j), ox - 14, oy - j * u + 6, 16, MUTED, 0.8 * alpha, anchor="r", role="mono")
    if outline:
        fr.rect(ox, oy - outline[1] * u, outline[0] * u, outline[1] * u, stroke=GOLD, width=2, alpha=0.85 * alpha * outline_alpha, r=0, dash=[9, 7])
    if ghost:
        for bid, x, y, w, h in ghost:
            fr.rect(ox + x * u, oy - (y + h) * u, w * u, h * u, stroke=COL[bid], width=1.2, alpha=0.35 * alpha, r=3, dash=[5, 5])
    sz = size or max(18, min(40, u * 0.7))
    for bid, x, y, w, h in rects:
        c = COL.get(bid, IVORY)
        hot = bid == focus
        pend = bid in pending
        fr.rect(ox + x * u, oy - (y + h) * u, w * u, h * u, fill=c, alpha=(0.16 if pend else 0.26) * alpha, r=3)
        fr.rect(ox + x * u, oy - (y + h) * u, w * u, h * u, stroke=GOLD if hot else c, width=3.2 if hot else 2.2, alpha=alpha, r=3,
                dash=[7, 5] if pend else None, glow=0.5 * alpha if hot else 0)
        if labels:
            cx, cy = ox + (x + w / 2) * u, oy - (y + h / 2) * u
            fr.text(bid, cx, cy + sz * 0.3 - (9 if coords and h * u > 60 else 0), sz, IVORY, alpha, role="serif", anchor="c")
            if coords and h * u > 60:
                fr.text(f"({x:g}, {'?' if pend else f'{y:g}'})", cx, cy + sz * 0.3 + 16, 15, MUTED, alpha, role="mono", anchor="c")
    for a_, b_ in red:
        ra = next(r for r in rects if r[0] == a_)
        rb = next(r for r in rects if r[0] == b_)
        x0, x1 = max(ra[1], rb[1]), min(ra[1] + ra[3], rb[1] + rb[3])
        y0, y1 = max(ra[2], rb[2]), min(ra[2] + ra[4], rb[2] + rb[4])
        if x1 > x0 and y1 > y0:
            fr.rect(ox + x0 * u, oy - y1 * u, (x1 - x0) * u, (y1 - y0) * u, fill=ROSE, alpha=0.75 * alpha, r=0, glow=0.5 * alpha)


def chip(fr, x, y, bid, alpha=1.0, size=30, hot=False, w=58):
    c = COL.get(bid, IVORY)
    fr.rect(x - w / 2, y - w / 2, w, w, fill=NODE_BG, stroke=GOLD if hot else c, width=3 if hot else 2.2, alpha=alpha, r=8, glow=0.5 * alpha if hot else 0)
    fr.rect(x - w / 2, y - w / 2, w, w, fill=c, alpha=0.18 * alpha, r=8)
    fr.text(bid, x, y + size * 0.34, size, IVORY, alpha, role="serif", anchor="c")


def ribbon(fr, pos, neg, x0, y_top, y_bot, gap, alpha=1.0, pair=None, lines=1.0, labels=True, size=30, w=58, show_neg=1.0):
    """pos on top, neg below, each block joined by a line: parallel = left/right, crossing = below/above."""
    if alpha <= 0:
        return
    if labels:
        fr.text("pos", x0 - 70, y_top + 8, 22, GOLD, alpha, role="mono", anchor="r")
        fr.text("neg", x0 - 70, y_bot + 8, 22, GOLD, alpha * show_neg, role="mono", anchor="r")
    for bid in pos:
        if bid not in neg:
            continue
        a = (x0 + pos.index(bid) * gap, y_top + w / 2)
        b = (x0 + neg.index(bid) * gap, y_bot - w / 2)
        hot = pair and bid in pair
        fr.line(a, b, COL[bid], 3.2 if hot else 2, alpha * lines * show_neg * (1.0 if hot or not pair else 0.25), glow=0.4 * alpha if hot else 0)
    for i, bid in enumerate(pos):
        chip(fr, x0 + i * gap, y_top, bid, alpha, size, bool(pair and bid in pair), w)
    for i, bid in enumerate(neg):
        chip(fr, x0 + i * gap, y_bot, bid, alpha * show_neg, size, bool(pair and bid in pair), w)


def opos(pos, neg, bid, cx, cy, s):
    p, n = pos.index(bid), neg.index(bid)
    return (cx + (p + n) * s, cy - (p - n) * s)


def graphs(fr, pos, neg, Hs, Vs, cx, cy, s, alpha=1.0, show="both", active=None, reveal=None, r=34, dim_implied=True):
    """Constraint graphs on the oblique grid (block at (pos index + neg index, pos index − neg index)): H edges point
    right (teal), V edges point up (gold). reveal: how many edges (H first, then V) are drawn."""
    if alpha <= 0:
        return
    edges = [("H", e["from"], e["to"]) for e in Hs] + [("V", e["from"], e["to"]) for e in Vs]
    implied = {(k, a, b) for k, a, b in edges if any((k, a, m) in set(edges) and (k, m, b) in set(edges) for m in pos)}
    n = len(edges) if reveal is None else reveal
    for i, (k, a, b) in enumerate(edges):
        if i >= n or (show != "both" and k != show):
            continue
        p, q = opos(pos, neg, a, cx, cy, s), opos(pos, neg, b, cx, cy, s)
        on = active and (a, b) == tuple(active)
        col = GOLD if on else (TEAL if k == "H" else AMBER)
        imp = dim_implied and (k, a, b) in implied
        fr.arrow(p, q, col, 3.4 if on else 2.2, alpha * (0.45 if imp and not on else 0.95), head=14, shorten=r + 4, glow=0.5 * alpha if on else 0)
    for bid in pos:
        p = opos(pos, neg, bid, cx, cy, s)
        hot = active and bid in active
        fr.dot(p, r, NODE_BG, alpha)
        fr.ring(p, r, GOLD if hot else COL[bid], 3 if hot else 2.4, alpha, glow=0.5 * alpha if hot else 0)
        fr.text(bid, p[0], p[1] + 11, 30, IVORY, alpha, role="serif", anchor="c")


def cand_panel(fr, x, y, ev, alpha, shown=99, chosen=True, w=520, title=None, size=28):
    """DP candidates for one block: 'pred: coord + size = value', the maximum in gold."""
    ax, sz = ev["axis"], ("w" if ev["axis"] == "x" else "h")
    rows = ev["candidates"]
    h = 120 + max(1, len(rows)) * 52
    panel(fr, x, y, w, h, alpha, title or L(f"{ax}[{ev['block']}] 的候选", f"candidates for {ax}[{ev['block']}]"))
    yy = y + 100
    for i, cd in enumerate(rows[:shown]):
        win = chosen and cd["from"] == ev["chosen"]["from"]
        col = GOLD if win else IVORY
        fr.text(f"{cd['from']}:  {ax}[{cd['from']}] + {sz}[{cd['from']}] = {cd['coord']:g} + {cd['size']:g}", x + 30, yy + i * 52, size - 4, col, alpha, role="mono")
        fr.text(f"{cd['value']:g}", x + w - 30, yy + i * 52, size + 2, col, alpha, role="mono", anchor="r", glow=0.4 * alpha if win else 0)
    if chosen and shown >= len(rows):
        fr.line((x + 24, y + h - 46), (x + w - 24, y + h - 46), FAINT, 1.2, alpha)
        fr.text(L("取最大", "maximum"), x + 30, y + h - 14, size - 4, GOLD, alpha)
        fr.text(f"{ax}[{ev['block']}] = {ev['value']:g}", x + w - 30, y + h - 12, size + 4, GOLD, alpha, role="mono", anchor="r", glow=0.3 * alpha)
    return h


def rel_text(a, rel, b):
    zh = {"left": "在左边", "right": "在右边", "below": "在下边", "above": "在上边"}[rel]
    en = {"left": "left of", "right": "right of", "below": "below", "above": "above"}[rel]
    return L(f"{a} {zh.replace('在', '在 ' + b + ' ', 1)}", f"{a} {en} {b}")


def pairs_list(fr, x, y, alpha, n_shown, size=26, lh=46, hot=None):
    for i, e in enumerate(REL[:n_shown]):
        col = TEAL if e["graph"] == "H" else AMBER
        on = hot is not None and i == hot
        fr.text(f"{e['a']}, {e['b']}", x, y + i * lh, size, GOLD if on else IVORY, alpha, role="mono")
        fr.text(rel_text(e["a"], e["rel"], e["b"]), x + 110, y + i * lh, size, GOLD if on else IVORY, alpha)
        fr.text(f"{e['graph']}: {e['a']} → {e['b']}", x + 420, y + i * lh, size, col, alpha, role="mono")


def slide_in(rects_to, ids_done, k):
    """Blocks that have a coordinate drop in from above as k goes 0 → 1."""
    return [(bid, x, y + (1 - ease(k)) * 6, w, h) for bid, x, y, w, h in rects_to if bid in ids_done]


# ====================================================================== popular film (story)
DIE = (520, 1400, 820)  # x0, x1 (screen), baseline y of the die picture


def p_die(fr, c):
    a = c.p(0, 0.8)
    substrate(fr, 0.5 * a)
    u = 62
    ox, oy = 420, 800
    n = count_hits(c.T, INTRO_HITS)
    shown = [r for i, r in enumerate(GOLD_R) if i < max(1, n)]
    drop = [(bid, x, y + (1 - landed(c.T, INTRO_HITS, i)) * 5, w, h) for i, (bid, x, y, w, h) in enumerate(GOLD_R) if i < max(1, n)]
    plan(fr, drop, ox, oy, u, a, coords=False)
    if c.on(1):
        b = c.p(1)
        fr.text(L("十个数", "ten numbers"), 1420, 300, 26, MUTED, b, anchor="c", spacing=2)
        for i, (bid, x, y, w, h) in enumerate(GOLD_R):
            fr.text(f"{bid}  ({x}, {y})", 1420, 370 + i * 64, 38, COL[bid], b * clamp(c.since(1) * 2 - i * 0.3), role="mono", anchor="c")


def p_words(fr, c):
    k = c.p(0, 2.2)
    u = 62
    plan(fr, GOLD_R, 420, 800, u, 1 - 0.75 * k, coords=False)
    for i, (bid, x, y, w, h) in enumerate(GOLD_R):
        fr.text(f"{bid}  ({x}, {y})", 1420, 370 + i * 64, 38, COL[bid], 1 - k, role="mono", anchor="c")
    if c.on(0):
        ribbon(fr, POS, NEG, 1150, 420, 640, 110, ease(c.since(0) / 1.6 - 0.4), lines=c.p(1, 1.2) if c.on(1) else 0)


def p_why(fr, c):
    a = c.p(0)
    u = 50
    # left: random coordinates (mostly overlapping) · right: permutations (always legal)
    fr.text(L("改坐标", "edit coordinates"), 520, 230, 28, MUTED, a, anchor="c", spacing=2)
    jit = int(c.t * 2.2) % 4
    bad = [("A", 0, 0, 3, 2), ("B", 2 + jit % 2, 1, 2, 3), ("C", 4, 0, 2, 2), ("E", 3 + jit % 3, 1, 2, 2), ("D", 1, 2 + jit % 2, 3, 1)]
    over = REF.metrics(MODS, {"w": 10, "h": 8}, {b: (x, y) for b, x, y, _, _ in bad})["overlaps"]
    plan(fr, bad, 230, 760, u, a, coords=False, red=[(p[0], p[1]) for p in over], axes=False)
    if c.on(1):
        b = c.p(1)
        fr.text(L("改排列", "edit permutations"), 1400, 230, 28, MUTED, b, anchor="c", spacing=2)
        seq = [list("ABCED"), list("BACED"), list("ABECD"), list("ABCDE")][int(c.since(1) * 1.2) % 4]
        r = REF.pack(seq, NEG, MODS)
        rr = [(m["id"], r[m["id"]][0], r[m["id"]][1], m["w"], m["h"]) for m in MODS]
        plan(fr, rr, 1110, 760, u, b, coords=False, axes=False)
        fr.text(" ".join(seq) + "   /   " + " ".join(NEG), 1400, 830, 26, IVORY, b, anchor="c", role="mono")
    if c.on(2):
        fr.text("Murata · Fujiyoshi · Nakatake · Kajitani, 1995", W / 2, 180, 22, GOLD, c.p(2), anchor="c", spacing=1)


def p_title(fr, c):
    title_assemble(fr, c, L("两行字母", "Two Rows of Letters"), L("序列对 · SEQUENCE PAIR", "THE SEQUENCE PAIR"), "FLOORPLANNING · LESSON 6")


TWO_POS = ["A", "B"]


def p_rule(fr, c):
    a = c.p(0)
    neg = ["A", "B"] if c.T < FILL1[0] else ["B", "A"]
    k = ease((c.T - FILL1[0]) / 0.5) if c.T >= FILL1[0] else 0
    ribbon(fr, TWO_POS, neg, 330, 340, 560, 130, a, lines=c.p(1) if c.on(1) else 0)
    two = {m: DIMS[m] for m in "AB"}
    if neg == ["A", "B"]:
        rr = [("A", 0, 0, 3, 2), ("B", 3, 0, 2, 3)]
        lab = L("次序相同 → A 在 B 左边", "same order → A left of B")
    else:
        rr = [("A", 0, 0, 3, 2), ("B", 0, 2, 2, 3)]
        lab = L("次序相反 → pos 里在前的 A 在下面", "opposite → A, first in pos, is below")
    if c.on(1):
        plan(fr, rr, 1060, 780, 66, c.p(1) * (1 if neg == ["A", "B"] else k), outline=None, extent=(6, 6), coords=True)
        fr.text(lab, 1260, 250, 30, GOLD, c.p(1) * (1 if neg == ["A", "B"] or k > 0 else 0), anchor="c", role="serif")


def p_pairs(fr, c):
    a = c.p(0)
    ribbon(fr, POS, NEG, 330, 250, 430, 100, a, pair=(REL[min(9, int(c.since(0) * 1.1))]["a"], REL[min(9, int(c.since(0) * 1.1))]["b"]))
    n = min(10, 1 + int(c.since(0) * 1.1))
    pairs_list(fr, 950, 230, a, n, size=24, lh=50, hot=n - 1)


def p_graphs(fr, c):
    a = c.p(0)
    n = 0
    if c.T >= FILL2[0]:
        n = min(10, 2 + count_hits(c.T, FILL2) * 2)
    elif c.on(0):
        n = min(6, int(c.since(0) * 2))
    graphs(fr, POS, NEG, G["H"], G["V"], 520, 600, 92, a, reveal=n)
    fr.text(L("H：在左边 → 向右", "H: left of → points right"), 1440, 380, 28, TEAL, a, anchor="c")
    fr.text(L("V：在下边 → 向上", "V: below → points up"), 1440, 440, 28, AMBER, a * (1 if n > 6 else 0.3), anchor="c")
    if c.on(1):
        fr.text("x[j] ≥ x[i] + w[i]", 1440, 560, 34, IVORY, c.p(1), anchor="c", role="serif")
        fr.text("y[j] ≥ y[i] + h[i]", 1440, 620, 34, IVORY, c.p(1), anchor="c", role="serif")
    if c.on(2):
        fr.text(L("箭头都顺着 pos：不会绕成圈", "every arrow follows pos: no cycle"), 1440, 740, 26, GOLD, c.p(2), anchor="c")


def p_dp(fr, c):
    a = c.p(0)
    done = ["A", "B", "C"]
    shown = 0 if c.T < PHRASE[0] else min(3, count_hits(c.T, PHRASE))
    if c.on(1):
        shown = 3
    rr = [r for r in GOLD_R if r[0] in done] + ([r for r in GOLD_R if r[0] == "E"] if c.on(1) else [])
    plan(fr, [(b, x, 0, w, h) for b, x, _, w, h in rr], 220, 760, 64, a, focus="E" if c.on(1) else None, pending=())
    cand_panel(fr, 1100, 300, DPX["E"], a, shown=max(shown, 1 if c.on(0) else 0), chosen=c.on(1))
    if c.on(0) and not c.on(1):
        for i, cd in enumerate(DPX["E"]["candidates"][:shown]):
            xx = 220 + cd["value"] * 64
            fr.line((xx, 760), (xx, 360), COL[cd["from"]], 2, 0.8 * a, dash=[6, 6])


def p_pack(fr, c):
    a = c.p(0)
    k = c.p(0, 1.6)
    rr = [(b, x, (y if b != "D" else lerp(0.0, 3.0, k) if c.on(0) else 0), w, h) for b, x, y, w, h in GOLD_R]
    plan(fr, rr, 220, 760, 64, 1.0, focus="D" if not c.on(1) else None)
    cand_panel(fr, 1100, 250, DPY["D"], a, chosen=True, w=560)
    if c.on(1):
        b = c.p(1)
        fr.rect(220, 760 - 4 * 64, 9 * 64, 4 * 64, stroke=TEAL, width=3, alpha=b, r=0, glow=0.4 * b)
        fr.text(L("包围盒 9 × 4，装进 10 × 8", "box 9 × 4, inside 10 × 8"), 1380, 760, 32, TEAL, b, anchor="c", role="serif")


def p_breath(fr, c):
    a = c.p(0, 1.4)
    fr.text(L("为什么取最大，不取最小？", "Why the maximum, not the minimum?"), W / 2, 500, 52, GOLD, a, anchor="c", role="serif", glow=0.25 * a)


THREE_RECTS = [("A", 0, 0, 3, 2), ("C", 0, 2, 2, 2), ("B", 3, 0, 2, 3)]
assert [(r["id"], r["x"], r["y"]) for r in THREE_R["rects"]] == [(b, x, y) for b, x, y, _, _ in THREE_RECTS]


def p_max(fr, c):
    a = c.p(0)
    ribbon(fr, THREE_R["pos"], THREE_R["neg"], 330, 260, 420, 110, a, labels=True, size=26, w=52)
    after = c.T >= FILL3[0] or c.on(2)
    bx = 3 if after else (2 if c.on(1) else 3)
    rr = [("A", 0, 0, 3, 2), ("C", 0, 2, 2, 2), ("B", bx, 0, 2, 3)]
    plan(fr, rr, 260, 820, 64, a, outline=None, extent=(6, 5), red=[("A", "B")] if bx == 2 else (), focus="B")
    cand_panel(fr, 1100, 330, THREE_B, a, chosen=after or not c.on(1))
    if c.on(1) and not after:
        fr.text(L("取最小 2：B 压在 A 上", "minimum 2: B sits on A"), 1360, 680, 30, ROSE, c.p(1), anchor="c", role="serif")
    if after:
        fr.text(L("取最大 3：两条都满足", "maximum 3: both hold"), 1360, 680, 30, TEAL, c.p(2, 0.5), anchor="c", role="serif")


def p_overflow(fr, c):
    a = c.p(0)
    show_stack = c.on(2)
    res = STACK if show_stack else ROW
    rr = rects_of(res)
    u = 44 if not show_stack else 50
    plan(fr, rr, 260 if not show_stack else 360, 800, u, a, coords=False)
    fr.text(" ".join(res["pos"]) + "  /  " + " ".join(res["neg"]), 1420, 280, 28, IVORY, a, anchor="c", role="mono")
    m = res["metrics"]
    fr.text(L(f"包围盒 {m['bbox']['w']} × {m['bbox']['h']}", f"box {m['bbox']['w']} × {m['bbox']['h']}"), 1420, 360, 34, ROSE, a, anchor="c", role="serif")
    fr.text(L("不重叠：是　　装得下：否", "no overlap: yes    fits: no"), 1420, 420, 30, IVORY, a, anchor="c")
    if c.on(3):
        b = c.p(3)
        fr.text(L("边界空余 80 − 23 = 57：永远不变", "outline unused 80 − 23 = 57: never changes"), 1420, 560, 26, GOLD, b, anchor="c")
        fr.text(L("会变的：包围盒", "what changes: the bounding box"), 1420, 610, 26, TEAL, b, anchor="c")


def p_search(fr, c):
    a = c.p(0)
    hits = FILL4 or [c.at(0) + i * 0.3 for i in range(6)]
    k = count_hits(c.T, hits)
    seqs = [(list("ABCED"), list("DABCE")), (list("BACED"), list("DABCE")), (list("ABECD"), list("DABCE")), (list("ACDEB"), list("CEABD")),
            (list("ABCDE"), list("ABCDE")), (list("ACDEB"), list("CEABD"))]
    p, n = seqs[min(k, len(seqs) - 1)]
    r = REF.pack(p, n, MODS)
    mt = REF.metrics(MODS, {"w": 10, "h": 8}, r)
    rr = [(m["id"], r[m["id"]][0], r[m["id"]][1], m["w"], m["h"]) for m in MODS]
    plan(fr, rr, 300, 800, 44, a, coords=False)
    fr.text(" ".join(p) + "  /  " + " ".join(n), 1380, 330, 28, IVORY, a, anchor="c", role="mono")
    fr.text(L(f"包围盒面积 {mt['bbox_area']:g}", f"box area {mt['bbox_area']:g}"), 1380, 420, 34, TEAL if mt["fits"] else ROSE, a, anchor="c", role="serif",
            glow=0.4 * pulse(c.T, hits, 0.4))


def p_twin(fr, c):
    a = c.p(0)
    plan(fr, GOLD_R, 200, 720, 46, a, coords=False)
    fr.text("A B C E D  /  D A B C E", 200 + 5 * 46, 800, 24, IVORY, a, anchor="c", role="mono")
    if c.on(1):
        b = c.p(1)
        plan(fr, rects_of(TWIN), 1050, 720, 46, b, coords=False)
        fr.text("A B C D E  /  D A B C E", 1050 + 5 * 46, 800, 24, IVORY, b, anchor="c", role="mono")
        fr.text("=", 870, 560, 80, GOLD, b, anchor="c", role="serif")
    if c.on(2):
        fr.text(L("14,400 种写法 · 9,056 种布局", "14,400 encodings · 9,056 packings"), W / 2, 260, 34, GOLD, c.p(2), anchor="c", role="serif")


def p_end(fr, c):
    if not c.on(1):
        a = c.p(0, 1.0)
        ribbon(fr, POS, NEG, 330, 380, 560, 100, a)
        fr.text(L("改排列 · 单步看关系、约束、取最大", "edit the letters · step through relations, constraints, maxima"), 1360, 480, 26, GOLD, a, anchor="c")
    else:
        credits(fr, c, [(L("两行字母", "Two Rows of Letters"), GOLD, 44),
                        (L("Floorplanning · Lesson 6 · 序列对", "Floorplanning · Lesson 6 · Sequence-Pair"), IVORY, 24),
                        (L("例子与约定来自教师课程 learn_floorplanning（CC BY 4.0）", "Example and convention from the instructor's learn_floorplanning course (CC BY 4.0)"), MUTED, 20),
                        (L("所有数值由本课程引擎 site/engines/sequence-pair.js 计算", "Every value is computed by this lesson's engine, site/engines/sequence-pair.js"), MUTED, 20),
                        (MUSIC_LINE, MUTED, 18)], k=1)


STORY = Film(
    "story", "popular", L("两行字母", "Two Rows of Letters"), None, BRAND, poster_at=36.5, music=TRACK, seed=7,
    why=L("五个模块落在一块芯片上，十个坐标化成两行字母。为什么搜坐标很难；两块之间的规则；十对关系、两张约束图；E 取 3、5、7 中的最大值 7，D 被 B 顶到 3；为什么取最大；一个合法却装不下的序列对；不变的量与会变的量；在序列对上搜索；同一布局的不同写法。",
          "Five blocks land on a die and their ten coordinates turn into two rows of letters. Why searching coordinates is hard; the rule for two blocks; ten pairs and two constraint graphs; E takes the largest of 3, 5, 7, and B pushes D up to 3; why the maximum; a valid pair that does not fit; what never changes and what does; searching over pairs; and different encodings of one packing."),
    scenes=[
        Scene("p-die", p_die, [Beat(L("一块芯片上，要摆五个模块。", "Five blocks have to go on a chip."), 4.4), Beat(L("每块写下左下角：十个数。", "Write each lower-left corner: ten numbers."), 5.0)],
              chapter=L("序 · 十个数", "PROLOGUE · TEN NUMBERS"), until=S["intro_end"]),
        Scene("p-words", p_words, [Beat(None, 1.2), Beat(L("其实，两行字母就够了。", "Two rows of letters are enough."), 4.6)], until=S["groove"]),
        Scene("p-why", p_why, [Beat(L("随便改一个坐标，块就可能压在一起。", "Change a coordinate and blocks may pile up."), 4.8),
                               Beat(L("改两行字母，永远不会重叠。", "Change the letters and nothing ever overlaps."), 4.8),
                               Beat(L("这就是序列对。", "That is the sequence pair."), 3.6)],
              chapter=L("序 · 两行字母", "PROLOGUE · TWO ROWS"), until=S["roll"]),
        Scene("p-title", p_title, [Beat(None, 4.5)], fade=False, until=37.0),
        Scene("p-rule", p_rule, [Beat(L("任取两块，看它们在两行里的先后。", "Take two blocks; look at their order in each row."), 4.6),
                                 Beat(L("次序相同：在前的在左边。", "Same order: the first one is on the left."), 4.2),
                                 Beat(L("次序相反：pos 里在前的在下面。", "Opposite: the one first in pos is below."), 4.6)],
              chapter=L("一 · 规则", "I · THE RULE"), until=S["fill1_end"]),
        Scene("p-pairs", p_pairs, [Beat(L("五块，十对，每对恰好一种关系。", "Five blocks, ten pairs, one relation each."), 4.6),
                                   Beat(L("六对左右，四对上下。", "Six side by side, four above and below."), 4.2)],
              until=S["accent"]),
        Scene("p-graphs", p_graphs, [Beat(L("左右连成 H，上下连成 V。", "Left/right forms H; below/above forms V."), 4.2),
                                     Beat(L("每条边：后面的块要让开前面的块。", "Each edge: the later block clears the earlier one."), 5.0),
                                     Beat(L("箭头都顺着 pos，不会绕成圈。", "Every arrow follows pos, so no cycle."), 4.4)],
              chapter=L("二 · 两张图", "II · TWO GRAPHS"), until=S["phrase"]),
        Scene("p-dp", p_dp, [Beat(L("E 要让开 A、B、C：候选 3、5、7。", "E must clear A, B, C: candidates 3, 5, 7."), 5.4),
                             Beat(L("取最大：x = 7。", "Take the maximum: x = 7."), 3.4)],
              chapter=L("三 · 取最大", "III · THE MAXIMUM"), until=89.1),
        Scene("p-pack", p_pack, [Beat(L("D 要让开四块：最高的 B 把它顶到 3。", "D clears four blocks: the tallest, B, lifts it to 3."), 4.6),
                                 Beat(L("9 × 4，装进边界。", "9 × 4, inside the outline."), 3.0)],
              until=S["breath"]),
        Scene("p-breath", p_breath, [Beat(None, 4.6)], until=S["reentry"]),
        Scene("p-max", p_max, [Beat(L("三块：B 要同时让开 A 和 C。", "Three blocks: B must clear both A and C."), 4.4),
                               Beat(L("取最小 2，B 压在 A 上。", "With the minimum, 2, B sits on A."), 4.0),
                               Beat(L("取最大 3，两条都满足。", "With the maximum, 3, both hold."), 4.0)],
              chapter=L("四 · 为什么", "IV · WHY"), until=S["fill3_end"]),
        Scene("p-overflow", p_overflow, [Beat(L("两行一模一样：五块排成一行。", "Identical rows: five blocks in one line."), 3.6),
                                         Beat(L("宽 12，装不下 10 × 8。", "12 wide: it does not fit 10 × 8."), 3.2),
                                         Beat(L("反过来，高 10，也装不下。", "Reversed: 10 tall, no fit either."), 3.6),
                                         Beat(L("合法只保证不重叠。", "Valid only means no overlap."), 3.0)],
              chapter=L("五 · 装得下吗", "V · DOES IT FIT"), until=S["fill4"]),
        Scene("p-search", p_search, [Beat(L("布图工具就在这些写法之间搜索。", "Floorplanners search among these encodings."), 5.0)],
              until=141.5),
        Scene("p-twin", p_twin, [Beat(L("换一个字母，布局可能一点不变。", "Change one letter and the packing may not move."), 6.0),
                                 Beat(L("D 在左上，E 在右下：两种关系都成立。", "D top-left, E bottom-right: both relations hold."), 7.0),
                                 Beat(L("14,400 种写法，只有 9,056 种布局。", "14,400 encodings, only 9,056 packings."), 7.0),
                                 Beat(L("哪些改动，真的会移动块？", "Which changes really move a block?"), 8.0)],
              chapter=L("尾声", "CODA"), until=S["quiet"]),
        Scene("p-end", p_end, [Beat(L("下面的实验里，亲手改两行字母。", "In the lab below, edit the two rows yourself."), 6.0),
                               Beat(None, 10.0)], until=S["end"]),
    ])


# ====================================================================== concise film
def k_title(fr, c):
    title_card(fr, L("序列对 · 精讲", "Sequence-Pair · The Essentials"), L("从两个排列到坐标", "FROM TWO PERMUTATIONS TO COORDINATES"), c.p(0, 1.0),
               kicker="FLOORPLANNING · LESSON 6")


def k_problem(fr, c):
    a = c.p(0)
    plan(fr, GOLD_R if c.on(2) else [], 200, 800, 60, a, coords=c.on(2))
    rows = [[L("块", "Block"), "w", "h"]] + [[m["id"], str(m["w"]), str(m["h"])] for m in MODS]
    table(fr, 900, 290, [120, 90, 90], rows, a, size=28, lh=52, colors={(i + 1, 0): COL[m["id"]] for i, m in enumerate(MODS)})
    if c.on(1):
        fr.text(L("边界 10 × 8 · 原点左下 · y 向上", "outline 10 × 8 · origin lower-left · y up"), 1580, 330, 26, GOLD, c.p(1), anchor="c")
        fr.text(L("输入：块、边界、pos、neg", "input: blocks, outline, pos, neg"), 1580, 400, 26, IVORY, c.p(1), anchor="c")
        fr.text(L("输出：每块的 (x, y)", "output: (x, y) of every block"), 1580, 450, 26, IVORY, c.p(1), anchor="c")
    if c.on(2):
        fr.text("pos = A B C E D   neg = D A B C E", 1300, 600, 28, IVORY, c.p(2), anchor="c", role="mono")


def k_rule(fr, c):
    a = c.p(0)
    rows = [[L("pos 中", "in pos"), L("neg 中", "in neg"), L("关系", "relation")],
            [L("a 在前", "a first"), L("a 在前", "a first"), L("a 在 b 左边", "a left of b")],
            [L("a 在前", "a first"), L("a 在后", "a second"), L("a 在 b 下边", "a below b")]]
    table(fr, 260, 300, [240, 240, 320], rows, a, size=32, lh=70, colors={(1, 2): TEAL, (2, 2): AMBER})
    if c.on(1):
        ribbon(fr, ["A", "B"], ["A", "B"], 1200, 290, 440, 120, c.p(1), size=26, w=52)
        plan(fr, [("A", 0, 0, 3, 2), ("B", 3, 0, 2, 3)], 1520, 470, 40, c.p(1), outline=None, extent=(5, 3), coords=False, axes=False, grid=False)
    if c.on(2):
        ribbon(fr, ["A", "B"], ["B", "A"], 1200, 600, 750, 120, c.p(2), size=26, w=52)
        plan(fr, [("A", 0, 0, 3, 2), ("B", 0, 2, 2, 3)], 1520, 830, 40, c.p(2), outline=None, extent=(3, 5), coords=False, axes=False, grid=False)
    if c.on(3):
        fr.text(L("另一种约定把“下”写成“上”：等于交换 pos 与 neg", "the other convention says 'above': same as swapping pos and neg"), 560, 620, 22, MUTED, c.p(3), anchor="c")


def k_graphs(fr, c):
    a = c.p(0)
    n = min(10, int(c.since(0) * 1.6) + 1)
    pairs_list(fr, 140, 240, a, n, size=22, lh=44, hot=n - 1 if n < 10 else None)
    graphs(fr, POS, NEG, G["H"], G["V"], 1120, 640, 84, c.p(1) if c.on(1) else 0)
    if c.on(2):
        fr.text(L("H 6 条 · V 4 条 · 每对恰好一条", "H 6 · V 4 · exactly one per pair"), 1120 + 4 * 84, 220, 26, GOLD, c.p(2), anchor="c")


def k_dpx(fr, c):
    a = c.p(0)
    order = ["A", "B", "C", "E", "D"]
    k = min(5, int(c.since(0) / 1.9) + 1) if not c.on(3) else 5
    if c.on(1):
        k = max(k, 4)
    done = order[:k]
    cur = order[k - 1]
    rr = [(b, x, (5 if b == "D" else 0), w, h) for b, x, _, w, h in GOLD_R if b in done]
    plan(fr, rr, 180, 780, 60, a, focus=cur, pending=done, coords=True, extent=(10, 8))
    ev = DPX[cur] if not c.on(1) or c.on(3) else DPX["E"]
    if c.on(1) and not c.on(3):
        ev = DPX["E"]
    hh = cand_panel(fr, 1060, 230, ev, a, title=L(f"第 6 行 · x[{ev['block']}]", f"line 6 · x[{ev['block']}]")) if ev["candidates"] else 0
    if not ev["candidates"]:
        panel(fr, 1060, 230, 520, 150, a, L(f"第 6 行 · x[{ev['block']}]", f"line 6 · x[{ev['block']}]"))
        fr.text(L("没有水平前驱 → 0", "no horizontal predecessor → 0"), 1090, 340, 26, IVORY, a)
    if c.on(2):
        fr.text(L("加前驱的宽 · 取最大 · 与 0 比较", "add the predecessor's width · maximum · at least 0"), 1320, 140, 24, GOLD, c.p(2), anchor="c")


def k_dpy(fr, c):
    a = c.p(0)
    k = c.p(1, 1.4) if c.on(1) else 0
    rr = [(b, x, (lerp(0, 3, k) if b == "D" else y), w, h) for b, x, y, w, h in GOLD_R]
    plan(fr, rr, 180, 780, 60, 1.0, focus="D", pending=("D",) if not c.on(1) else (), coords=True)
    cand_panel(fr, 1060, 230, DPY["D"], a, chosen=c.on(1), title=L("第 7 行 · y[D]", "line 7 · y[D]"), w=600)
    if c.on(2):
        fr.text(L("A、B、C、E 没有竖直前驱：y = 0", "A, B, C, E have no vertical predecessor: y = 0"), 1360, 640, 24, MUTED, c.p(2), anchor="c")


def k_metrics(fr, c):
    a = c.p(0)
    plan(fr, GOLD_R, 160, 760, 54, a, coords=False)
    fr.rect(160, 760 - 4 * 54, 9 * 54, 4 * 54, stroke=TEAL, width=3, alpha=a, r=0)
    rows = [[L("问题", "Question"), L("答案", "Answer")],
            [L("完整？", "Complete?"), L("是，5 块各一次", "yes, each block once")],
            [L("重叠？", "Overlap?"), L("没有（序列对保证）", "none (guaranteed)")],
            [L("装得下？", "Fits?"), L("是：9 × 4 ≤ 10 × 8", "yes: 9 × 4 ≤ 10 × 8")],
            [L("紧凑？", "Compact?"), L("36，利用率 63.89 %", "36, utilisation 63.89 %")]]
    table(fr, 900, 280, [220, 560], rows[:1 + min(4, 1 + int(c.since(0) * 0.9))], a, size=28, lh=58)
    if c.on(2):
        fr.text(L("边界空余 57 · 密度 28.75 %：对所有排列都一样", "outline unused 57 · density 28.75 %: the same for every pair"), 1270, 640, 24, GOLD, c.p(2), anchor="c")


def k_overflow(fr, c):
    a = c.p(0)
    plan(fr, rects_of(ROW), 140, 760, 44, a, coords=False)
    fr.text("A B C D E  /  A B C D E", 140 + 6 * 44, 866, 24, IVORY, a, anchor="c", role="mono")
    if c.on(1):
        plan(fr, rects_of(STACK), 1080, 820, 46, c.p(1), coords=False, outline=OUT)
        fr.text("A B C D E  /  E D C B A", 1080 + 5 * 46, 866, 24, IVORY, c.p(1), anchor="c", role="mono")
    if c.on(2):
        fr.text(L("12 × 3 与 3 × 10：都不重叠，都装不下", "12 × 3 and 3 × 10: no overlap, no fit"), W / 2, 200, 30, ROSE, c.p(2), anchor="c", role="serif")


def k_summary(fr, c):
    lines = [L("次序相同 → 左右；相反 → 上下", "same order → left/right; opposite → below/above"),
             L("每对一条边：H 或 V，都顺着 pos", "one edge per pair, H or V, all along pos"),
             L("坐标 = 最长路径：加前驱尺寸，取最大", "coordinate = longest path: add the predecessor's size, take the max"),
             L("不重叠有保证；装得下要单独检查", "no overlap is guaranteed; fit must be checked")]
    for i, s in enumerate(lines):
        if c.on(i):
            fr.text(s, W / 2, 320 + i * 100, 36, GOLD if i == 2 else IVORY, c.p(i, 1.0), anchor="c", role="serif")


CONCISE = Film(
    "concise", "concise", L("精讲：从两个排列到坐标", "Essentials: from two permutations to coordinates"), None, BRAND, poster_at=60, music="score:calm", seed=11,
    why=L("用教师的五块例子从头走一遍：问题与坐标约定、四种关系、十对块与两张约束图、x 与 y 两遍最长路径、四个分开回答的问题、一个合法却装不下的序列对。",
          "The instructor's five blocks from start to finish: the problem and the convention, the four relations, ten pairs and two constraint graphs, the two longest-path passes for x and y, four separate questions, and a valid pair that does not fit."),
    scenes=[
        Scene("k00-title", k_title, [Beat(None, 3.0)]),
        Scene("k01-problem", k_problem, [Beat(L("五个矩形块，固定尺寸，不旋转。", "Five rectangles, fixed sizes, no rotation."), 3.6),
                                         Beat(L("固定边界 10 × 8；原点在左下，y 向上。", "Fixed outline 10 × 8; origin lower-left, y up."), 4.6),
                                         Beat(L("给定 pos 与 neg，求每块的坐标。", "Given pos and neg, find every block's coordinates."), 4.6)],
              chapter=L("1 · 问题", "1 · THE PROBLEM")),
        Scene("k02-rule", k_rule, [Beat(L("每一对块，看它们在两个排列里的先后。", "For each pair, compare its order in the two permutations."), 4.8),
                                   Beat(L("两边都在前：在左边。", "First in both: on the left."), 3.6),
                                   Beat(L("pos 在前、neg 在后：在下边。", "First in pos, second in neg: below."), 4.2),
                                   Beat(L("别的教材若规定为“上”，就把两个序列交换。", "If a book says 'above', swap the two sequences."), 4.8)],
              chapter=L("2 · 规则", "2 · THE RULE")),
        Scene("k03-graphs", k_graphs, [Beat(L("十对块，逐对写出关系。", "Ten pairs, each relation written down."), 5.2),
                                       Beat(L("左右进 H，上下进 V。", "Left/right goes into H, below/above into V."), 4.0),
                                       Beat(L("每对只进一张图：H 六条，V 四条。", "Each pair goes into one graph: six in H, four in V."), 4.6)],
              chapter=L("3 · 约束图", "3 · CONSTRAINT GRAPHS")),
        Scene("k04-dpx", k_dpx, [Beat(L("按 pos 的顺序，逐块算 x。", "In pos order, compute x block by block."), 5.6),
                                 Beat(L("E 的前驱 A、B、C：候选 3、5、7。", "E's predecessors A, B, C: candidates 3, 5, 7."), 5.0),
                                 Beat(L("加的是前驱的宽；取最大，x[E] = 7。", "Add the predecessor's width; the maximum, x[E] = 7."), 5.0),
                                 Beat(L("D 没有水平前驱：x[D] = 0。", "D has no horizontal predecessor: x[D] = 0."), 4.4)],
              chapter=L("4 · 算 x", "4 · COMPUTING x")),
        Scene("k05-dpy", k_dpy, [Beat(L("再算 y：D 的竖直前驱是另外四块。", "Now y: D's vertical predecessors are the other four."), 4.6),
                                 Beat(L("最高的是 B：y[D] = 0 + 3 = 3。", "The tallest is B: y[D] = 0 + 3 = 3."), 4.4),
                                 Beat(L("其余四块都在 y = 0。", "The other four stay at y = 0."), 3.6)],
              chapter=L("5 · 算 y", "5 · COMPUTING y")),
        Scene("k06-metrics", k_metrics, [Beat(L("算完后，四个问题分开回答。", "Then answer four separate questions."), 5.0),
                                         Beat(L("包围盒 9 × 4，装进 10 × 8。", "Box 9 × 4, inside 10 × 8."), 3.6),
                                         Beat(L("边界空余与密度是常量，不随排列变。", "Outline unused and density are constants."), 4.6)],
              chapter=L("6 · 指标", "6 · METRICS")),
        Scene("k07-overflow", k_overflow, [Beat(L("两个排列相同：五块排成一行，宽 12。", "Identical permutations: one row, 12 wide."), 4.6),
                                           Beat(L("neg 反过来：叠成一列，高 10。", "Reverse neg: one column, 10 tall."), 4.0),
                                           Beat(L("都合法、不重叠，却都装不下。", "Both valid and overlap-free, neither fits."), 4.4)],
              chapter=L("7 · 合法 ≠ 装得下", "7 · VALID ≠ FITS")),
        Scene("k08-summary", k_summary, [Beat(L("次序相同是左右，相反是上下。", "Same order is left/right; opposite is below/above."), 4.0),
                                         Beat(L("每对一条边，都顺着 pos。", "One edge per pair, all along pos."), 3.6),
                                         Beat(L("坐标是最长路径：加前驱尺寸，取最大。", "A coordinate is a longest path: add the size, take the max."), 4.6),
                                         Beat(L("不重叠有保证，装得下要另查。", "No overlap is guaranteed; fit is checked separately."), 5.0)],
              chapter=L("小结", "SUMMARY")),
    ])


# ====================================================================== advanced film
def a_title(fr, c):
    title_card(fr, L("序列对 · 进阶", "Sequence-Pair · The Whys"), L("七个为什么", "SEVEN QUESTIONS"), c.p(0, 1.0), kicker="FLOORPLANNING · LESSON 6")


def a_longest(fr, c):
    a = c.p(0)
    fr.text("x[E] ≥ x[A] + 3", 520, 300, 36, IVORY, a, anchor="c", role="serif")
    fr.text("x[E] ≥ x[B] + 2", 520, 360, 36, IVORY, a, anchor="c", role="serif")
    fr.text("x[E] ≥ x[C] + 2", 520, 420, 36, IVORY, a, anchor="c", role="serif")
    fr.text("x[E] ≥ 0", 520, 480, 36, IVORY, a, anchor="c", role="serif")
    if c.on(1):
        b = c.p(1)
        x0, y0, u = 1000, 600, 70
        fr.line((x0, y0), (x0 + 10 * u, y0), DIM, 2, b)
        for i in range(11):
            fr.text(str(i), x0 + i * u, y0 + 34, 18, MUTED, b, anchor="c", role="mono")
        for cd in DPX["E"]["candidates"]:
            fr.line((x0 + cd["value"] * u, y0 - 140), (x0 + cd["value"] * u, y0), COL[cd["from"]], 3, b)
            fr.text(f"{cd['from']} {cd['value']}", x0 + cd["value"] * u, y0 - 156, 22, COL[cd["from"]], b, anchor="c", role="mono")
        k = c.p(2, 1.2) if c.on(2) else 0
        fr.rect(x0 + 7 * u, y0 - 100, 10 * u - 7 * u, 60, fill=TEAL, alpha=0.25 * b * k, r=4)
        fr.text(L("允许的 x[E]", "allowed x[E]"), x0 + 8.5 * u, y0 - 60, 22, TEAL, b * k, anchor="c")
    if c.on(3):
        fr.text(L("最小合法值 = 最大下界 = 到 E 的最长路径", "smallest feasible value = largest bound = longest path into E"), W / 2, 780, 30, GOLD, c.p(3), anchor="c", role="serif")


def a_max(fr, c):
    p_max_like(fr, c)


def p_max_like(fr, c):
    a = c.p(0)
    after = c.on(2)
    bx = 3 if after else (2 if c.on(1) else 3)
    rr = [("A", 0, 0, 3, 2), ("C", 0, 2, 2, 2), ("B", bx, 0, 2, 3)]
    plan(fr, rr, 260, 800, 72, a, outline=None, extent=(6, 5), red=[("A", "B")] if bx == 2 else (), focus="B")
    cand_panel(fr, 1100, 300, THREE_B, a, chosen=after or not c.on(1))
    if c.on(1) and not after:
        fr.text(L("取最小：只满足 C 那一条，B 与 A 重叠 1 × 2", "minimum: only C's bound holds; B overlaps A by 1 × 2"), 1360, 680, 26, ROSE, c.p(1), anchor="c")
    if after:
        fr.text(L("取最大：A、C 两条都满足", "maximum: both A's and C's bounds hold"), 1360, 680, 26, TEAL, c.p(2), anchor="c")


def a_acyclic(fr, c):
    a = c.p(0)
    ribbon(fr, POS, NEG, 330, 250, 400, 100, a, size=26, w=52)
    graphs(fr, POS, NEG, G["H"], G["V"], 960, 760, 70, c.p(1) if c.on(1) else 0, r=28)
    if c.on(1):
        for i, bid in enumerate(POS):
            fr.text(str(i + 1), 330 + i * 100, 200, 22, GOLD, c.p(1), anchor="c", role="mono")
    if c.on(2):
        fr.text(L("左边：两个序列都在前 → pos 在前", "left of: first in both → first in pos"), 1420, 330, 24, TEAL, c.p(2), anchor="c")
        fr.text(L("下边：pos 在前", "below: first in pos"), 1420, 380, 24, AMBER, c.p(2), anchor="c")
    if c.on(3):
        fr.text(L("沿任何边走，pos 位置只增不减：无环，pos 就是拓扑序", "along any edge the pos position grows: no cycle, and pos is a topological order"), W / 2, 830, 26, GOLD, c.p(3), anchor="c")


def a_fit(fr, c):
    a = c.p(0)
    areas = sorted((int(k), v) for k, v in ST["bboxAreas"].items())
    x0, y0, bw = 220, 760, 56
    mx = max(v for _, v in areas)
    for i, (ar, v) in enumerate(areas):
        hgt = 380 * v / mx
        fr.rect(x0 + i * (bw + 10), y0 - hgt, bw, hgt, fill=TEAL, alpha=0.75 * a * c.p(0, 1.5), r=3)
        fr.text(str(ar), x0 + i * (bw + 10) + bw / 2, y0 + 28, 16, MUTED, a, anchor="c", role="mono")
    fr.text(L("14,400 个序列对的包围盒面积", "bounding-box area over all 14,400 pairs"), x0 + 8 * (bw + 10), 300, 24, MUTED, a, anchor="c", spacing=1)
    if c.on(1):
        fr.text(L("全部不重叠", "all overlap-free"), 1520, 420, 30, TEAL, c.p(1), anchor="c", role="serif")
    if c.on(2):
        fr.text(L(f"{ST['fit']:,} 装得下 · {ST['overflow']} 装不下", f"{ST['fit']:,} fit · {ST['overflow']} do not"), 1520, 480, 30, ROSE, c.p(2), anchor="c", role="serif")
    if c.on(3):
        fr.text(L("边界空余始终 57，密度始终 28.75 %", "outline unused always 57, density always 28.75 %"), 1520, 560, 24, GOLD, c.p(3), anchor="c")


def a_twins(fr, c):
    a = c.p(0)
    plan(fr, GOLD_R, 160, 700, 44, a, coords=False)
    fr.text("A B C E D / D A B C E", 160 + 5 * 44, 780, 22, IVORY, a, anchor="c", role="mono")
    if c.on(1):
        plan(fr, rects_of(TWIN), 760, 700, 44, c.p(1), coords=False)
        fr.text("A B C D E / D A B C E", 760 + 5 * 44, 780, 22, IVORY, c.p(1), anchor="c", role="mono")
    if c.on(2):
        r2 = REF.pack(POS, list("ADBCE"), MODS)
        plan(fr, [(m["id"], r2[m["id"]][0], r2[m["id"]][1], m["w"], m["h"]) for m in MODS], 1360, 700, 44, c.p(2), coords=False)
        fr.text("A B C E D / A D B C E", 1360 + 5 * 44, 780, 22, IVORY, c.p(2), anchor="c", role="mono")
        fr.text(L("包围盒同为 9 × 4，布局不同", "same 9 × 4 box, different packing"), 1360 + 5 * 44, 830, 20, ROSE, c.p(2), anchor="c")
    if c.on(3):
        fr.text(L(f"{ST['pairs']:,} 个序列对 → {ST['distinctPackings']:,} 种布局；教师示例的布局有 {ST['sameAsGolden']} 种写法", f"{ST['pairs']:,} pairs → {ST['distinctPackings']:,} packings; the instructor's packing has {ST['sameAsGolden']} encodings"),
                W / 2, 240, 28, GOLD, c.p(3), anchor="c", role="serif")


def a_mirror(fr, c):
    a = c.p(0)
    rows = [[L("约定", "Convention"), L("pos 在前、neg 在后", "first in pos, second in neg")],
            [L("本课（教师）", "this lesson (instructor)"), L("下边", "below")],
            [L("部分教材", "some textbooks"), L("上边", "above")]]
    table(fr, 300, 300, [420, 520], rows, a, size=30, lh=64, colors={(1, 1): TEAL, (2, 1): AMBER})
    if c.on(1):
        fr.text(L("教材约定下的 (P, N)  =  本课约定下的 (N, P)", "textbook (P, N)  =  this lesson's (N, P)"), W / 2, 600, 36, GOLD, c.p(1), anchor="c", role="serif")
    if c.on(2):
        fr.text(L("测试在 400 个随机序列对上逐块验证", "tested block by block on 400 random pairs"), W / 2, 680, 24, MUTED, c.p(2), anchor="c")


def a_cost(fr, c):
    a = c.p(0)
    code_panel(fr, 160, 230, 900, [
        tr(L("检查 pos、neg（全部问题）", "check pos, neg (every problem)")),
        tr(L("对 pos 中每一对 (i, j)：", "for each pair (i, j) in pos:")),
        tr(L("  neg 也在前 → H 边", "  first in neg too → H edge")),
        tr(L("  否则 → V 边", "  else → V edge")),
        tr(L("order ← pos", "order ← pos")),
        "x[j] ← max(0, x[i] + w[i])",
        "y[j] ← max(0, y[i] + h[i])",
        tr(L("报告", "report"))], active=(2, 6, 7) if c.on(1) else (), alpha=a, size=24, lh=44)
    if c.on(1):
        fr.text("n(n − 1) / 2", 1420, 360, 40, GOLD, c.p(1), anchor="c", role="serif")
        fr.text(L("对 · 边 · DP 步", "pairs · edges · DP looks"), 1420, 410, 22, MUTED, c.p(1), anchor="c")
        fr.text("O(n²)", 1420, 500, 56, TEAL, c.p(1), anchor="c", role="serif")
    if c.on(2):
        fr.text(L("搜索：交换一个序列里的两块，或两个序列一起换", "search: swap two blocks in one sequence, or in both"), 1420, 640, 22, IVORY, c.p(2), anchor="c")
        fr.text(L("(n!)² 个序列对：五块 14,400，十块约 1.3 × 10¹³", "(n!)² pairs: 14,400 for five, about 1.3 × 10¹³ for ten"), 1420, 690, 22, MUTED, c.p(2), anchor="c")


def a_summary(fr, c):
    lines = [L("最长路径 = 满足全部约束的最小坐标", "longest path = smallest coordinate meeting every constraint"),
             L("取最大，因为每条边都要成立", "take the max because every edge must hold"),
             L("边都顺着 pos：无环", "edges follow pos: no cycle"),
             L("不重叠 ≠ 装得下；包围盒会变，边界空余不变", "no overlap ≠ fits; the box changes, outline unused does not"),
             L("一种布局可以有多种写法", "one packing can have several encodings")]
    for i, s in enumerate(lines):
        if c.on(i):
            fr.text(s, W / 2, 290 + i * 92, 32, GOLD if i == 0 else IVORY, c.p(i, 1.0), anchor="c", role="serif")


assert round((3628800 ** 2) / 1e13, 1) == 1.3
ADVANCED = Film(
    "advanced", "advanced", L("进阶：七个为什么", "The whys: seven questions"), None, BRAND, poster_at=40, music="score:curious", seed=23,
    why=L("为什么最长路径就是最紧凑的坐标、为什么取最大、为什么约束图没有环、为什么不重叠却装不下（14,400 中 720）、为什么多个序列对给出同一布局（9,056 种）、另一种约定怎样换算，以及代价与搜索。",
          "Why the longest path is the most compact coordinate, why the maximum, why the graphs have no cycle, why overlap-free pairs can overflow (720 of 14,400), why several pairs share one packing (9,056 packings), how to convert the other convention, and cost and search."),
    scenes=[
        Scene("a00-title", a_title, [Beat(None, 3.0)]),
        Scene("a01-longest", a_longest, [Beat(L("E 的每条入边都是一个下界。", "Every edge into E is a lower bound."), 4.6),
                                         Beat(L("把下界画在数轴上：3、5、7。", "Put the bounds on a line: 3, 5, 7."), 4.4),
                                         Beat(L("同时满足三条，x[E] 只能在 7 以右。", "To meet all three, x[E] must be 7 or more."), 4.8),
                                         Beat(L("最小的可行值就是最长路径。", "The smallest feasible value is the longest path."), 4.6)],
              chapter=L("一 · 最长路径", "I · LONGEST PATH")),
        Scene("a02-max", a_max, [Beat(L("三块：A 在 C 下边，A、C 都在 B 左边。", "Three blocks: A below C; A and C left of B."), 4.8),
                                 Beat(L("取最小 2：只满足 C 那一条，B 压在 A 上。", "The minimum, 2, meets only C's bound; B lands on A."), 5.6),
                                 Beat(L("取最大 3：两条都满足。", "The maximum, 3, meets both."), 4.0)],
              chapter=L("二 · 为什么取最大", "II · WHY THE MAXIMUM")),
        Scene("a03-acyclic", a_acyclic, [Beat(L("约束图会不会有环？", "Could a constraint graph have a cycle?"), 3.6),
                                         Beat(L("给每块标上它在 pos 里的位置。", "Label every block with its place in pos."), 4.2),
                                         Beat(L("左边和下边，都要求在 pos 里在前。", "Both 'left of' and 'below' need first in pos."), 4.6),
                                         Beat(L("沿边走，位置只增不减：没有环。", "Along any edge the place grows: no cycle."), 4.6)],
              chapter=L("三 · 为什么无环", "III · WHY NO CYCLE")),
        Scene("a04-fit", a_fit, [Beat(L("把全部 14,400 个序列对都算一遍。", "Compute all 14,400 pairs."), 4.2),
                                 Beat(L("没有一个重叠。", "Not one overlaps."), 3.0),
                                 Beat(L("但 720 个装不进 10 × 8。", "But 720 do not fit 10 × 8."), 3.8),
                                 Beat(L("边界空余与密度从不变化，不能用来比较。", "Outline unused and density never change; they cannot compare pairs."), 5.0)],
              chapter=L("四 · 不重叠 ≠ 装得下", "IV · NO OVERLAP ≠ FITS")),
        Scene("a05-twins", a_twins, [Beat(L("pos 中交换 E、D：E–D 的关系变了。", "Swap E and D in pos: the E–D relation changes."), 4.6),
                                     Beat(L("坐标却完全相同：两种关系都成立。", "Yet the coordinates are identical: both relations hold."), 4.8),
                                     Beat(L("反过来，包围盒相同，布局可以不同。", "Conversely, the same box can hide a different packing."), 4.8),
                                     Beat(L("14,400 个序列对，只有 9,056 种布局。", "14,400 pairs, only 9,056 packings."), 4.6)],
              chapter=L("五 · 一种布局，多种写法", "V · ONE PACKING, MANY ENCODINGS")),
        Scene("a06-mirror", a_mirror, [Beat(L("有的教材把“下”定义成“上”。", "Some textbooks define 'below' as 'above'."), 4.2),
                                       Beat(L("那只是竖直方向的镜像：交换 pos 与 neg 即可。", "It is a vertical mirror: swap pos and neg."), 5.0),
                                       Beat(L("读资料时先看约定。", "Check the convention before you read on."), 3.6)],
              chapter=L("六 · 另一种约定", "VI · THE OTHER CONVENTION")),
        Scene("a07-cost", a_cost, [Beat(L("代价：n(n−1)/2 对，两遍 DP，O(n²)。", "Cost: n(n−1)/2 pairs, two DP passes, O(n²)."), 4.6),
                                   Beat(L("建图与 DP 是主要的工作。", "Building the graphs and the DP do the work."), 3.8),
                                   Beat(L("搜索靠交换；排列对的数量增长极快。", "Search uses swaps; the number of pairs explodes."), 4.6)],
              chapter=L("七 · 代价与搜索", "VII · COST AND SEARCH")),
        Scene("a08-summary", a_summary, [Beat(L("最长路径给出最紧凑的坐标。", "The longest path gives the most compact coordinates."), 4.0),
                                         Beat(L("取最大，因为每条边都要成立。", "Take the maximum: every edge must hold."), 3.6),
                                         Beat(L("边顺着 pos，所以无环。", "Edges follow pos, so there is no cycle."), 3.4),
                                         Beat(L("不重叠不等于装得下。", "No overlap does not mean it fits."), 3.4),
                                         Beat(L("一种布局，可以有多种写法。", "One packing can have several encodings."), 4.0)],
              chapter=L("小结", "SUMMARY")),
    ])

FILMS = [STORY, CONCISE, ADVANCED]
ORDER = ["story", "concise", "advanced", "lab"]
