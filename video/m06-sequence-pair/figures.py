"""Slide figures for Module 06 (drawn with the slide kit, once per language).
Every value is read from site/data/m06-sequence-pair/traces.json."""
import json
from pathlib import Path

from kit import X, table, code, panel, INK, MUTED, FAINT, GOLD, TEAL, RED, BLUE

T = json.loads((Path(__file__).resolve().parents[2] / "site/data/m06-sequence-pair/traces.json").read_text())
RUN = T["runs"]
G = RUN["golden"]["result"]
EV = RUN["golden"]["events"]
POS, NEG = G["pos"], G["neg"]
DPX = {e["block"]: e for e in EV if e["kind"] == "dp" and e["axis"] == "x"}
DPY = {e["block"]: e for e in EV if e["kind"] == "dp" and e["axis"] == "y"}
REL = [e for e in EV if e["kind"] == "relation"]
OUT = (T["fixture"]["outline"]["w"], T["fixture"]["outline"]["h"])
COL = {"A": "#77cdbb", "B": "#8fb1e6", "C": "#d8bb78", "D": "#e39fb8", "E": "#c2a6e6"}
AMBER = "#d8bb78"
ST = T["stats"]


def rects(res):
    return [(r["id"], r["x"], r["y"], r["w"], r["h"]) for r in res["rects"]]


def plan(cv, rs, ox, oy, u, outline=OUT, extent=None, coords=True, red=(), pending=(), focus=None):
    ew, eh = extent or (max([outline[0] if outline else 0] + [x + w for _, x, _, w, _ in rs]), max([outline[1] if outline else 0] + [y + h for _, _, y, _, h in rs]))
    for i in range(int(ew) + 1):
        cv.line(ox + i * u, oy, ox + i * u, oy - eh * u, "#15333b", 1.2)
        cv.text(ox + i * u, oy + 30, str(i), 20, MUTED, align="center")
    for j in range(int(eh) + 1):
        cv.line(ox, oy - j * u, ox + ew * u, oy - j * u, "#15333b", 1.2)
        cv.text(ox - 14, oy - j * u + 7, str(j), 20, MUTED, align="right")
    if outline:
        cv.rect(ox, oy - outline[1] * u, outline[0] * u, outline[1] * u, stroke=GOLD, width=2.5, dash=[10, 8])
    for bid, x, y, w, h in rs:
        c = COL[bid]
        cv.rect(ox + x * u, oy - (y + h) * u, w * u, h * u, fill=c, alpha=0.28)
        cv.rect(ox + x * u, oy - (y + h) * u, w * u, h * u, stroke=GOLD if bid == focus else c, width=4 if bid == focus else 2.5, dash=[8, 6] if bid in pending else None)
        cx, cy = ox + (x + w / 2) * u, oy - (y + h / 2) * u
        cv.text(cx, cy + 6, bid, 34, INK, "bold", "center")
        if coords and h * u >= 70:
            cv.text(cx, cy + 34, f"({x:g}, {y:g})", 18, MUTED, align="center")
    for a_, b_ in red:
        ra = next(r for r in rs if r[0] == a_); rb = next(r for r in rs if r[0] == b_)
        x0, x1 = max(ra[1], rb[1]), min(ra[1] + ra[3], rb[1] + rb[3]); y0, y1 = max(ra[2], rb[2]), min(ra[2] + ra[4], rb[2] + rb[4])
        if x1 > x0 and y1 > y0:
            cv.rect(ox + x0 * u, oy - y1 * u, (x1 - x0) * u, (y1 - y0) * u, fill=RED, alpha=0.8)


def chip(cv, x, y, bid, w=64, hot=False):
    cv.rect(x - w / 2, y - w / 2, w, w, fill="#0b2029", stroke=GOLD if hot else COL[bid], width=4 if hot else 2.5, r=8)
    cv.text(x, y + 11, bid, 32, INK, "bold", "center")


def ribbon(cv, pos, neg, x0, yt, yb, gap, pair=None, w=64):
    cv.text(x0 - 60, yt + 8, "pos", 26, GOLD, "bold", "right")
    cv.text(x0 - 60, yb + 8, "neg", 26, GOLD, "bold", "right")
    for bid in pos:
        hot = pair and bid in pair
        cv.line(x0 + pos.index(bid) * gap, yt + w / 2, x0 + neg.index(bid) * gap, yb - w / 2, COL[bid], 4 if hot else 2.5, 1.0 if (hot or not pair) else 0.3)
    for i, b in enumerate(pos):
        chip(cv, x0 + i * gap, yt, b, w, bool(pair and b in pair))
    for i, b in enumerate(neg):
        chip(cv, x0 + i * gap, yb, b, w, bool(pair and b in pair))


def graphs(cv, cx, cy, s, show="both", r=36):
    def at(b):
        p, n = POS.index(b), NEG.index(b)
        return cx + (p + n) * s, cy - (p - n) * s
    es = [("H", e["from"], e["to"]) for e in G["H"]] + [("V", e["from"], e["to"]) for e in G["V"]]
    S = set(es)
    for k, a, b in es:
        if show != "both" and k != show:
            continue
        imp = any((k, a, m) in S and (k, m, b) in S for m in POS)
        (x1, y1), (x2, y2) = at(a), at(b)
        cv.arrow(x1, y1, x2, y2, TEAL if k == "H" else AMBER, 3, 16, alpha=0.45 if imp else 1.0, dash=[9, 7] if imp else None, shorten=r + 4)
    for b in POS:
        x, y = at(b)
        cv.circle(x, y, r, fill="#0b2029", stroke=COL[b], width=3)
        cv.text(x, y + 12, b, 32, INK, "bold", "center")


def cands(cv, x, y, ev, w=760):
    ax, sz = ev["axis"], "w" if ev["axis"] == "x" else "h"
    rows = [[X("前驱", "Pred."), X("下界", "Bound"), X("值", "Value")]]
    hl = {}
    for i, c in enumerate(ev["candidates"], 1):
        rows.append([c["from"], f"{ax}[{c['from']}] + {sz}[{c['from']}] = {c['coord']:g} + {c['size']:g}", f"{c['value']:g}"])
        if c["from"] == ev["chosen"]["from"]:
            hl[i] = GOLD
    table(cv, x, y, [140, 470, 120], rows, size=30, lh=58, highlight=hl)
    cv.text(x, y + len(rows) * 58 + 20, X(f"取最大：{ax}[{ev['block']}] = {ev['value']:g}", f"maximum: {ax}[{ev['block']}] = {ev['value']:g}"), 34, GOLD, "bold")


# ---- figures referenced by slides.json
def f_problem(cv, a):
    plan(cv, rects(G), 1000, 900, 72)


def f_rule(cv, a):
    ribbon(cv, ["A", "B"], ["A", "B"], 1100, 290, 450, 130)
    plan(cv, [("A", 0, 0, 3, 2), ("B", 3, 0, 2, 3)], 1440, 480, 52, outline=None, coords=False)
    ribbon(cv, ["A", "B"], ["B", "A"], 1100, 640, 800, 130)
    plan(cv, [("A", 0, 0, 3, 2), ("B", 0, 2, 2, 3)], 1520, 960, 52, outline=None, coords=False)


def f_two(cv, a):
    plan(cv, [("A", 0, 0, 3, 2), ("B", 3, 0, 2, 3)], 1000, 560, 62, outline=None, extent=(6, 4))
    plan(cv, [("A", 0, 0, 3, 2), ("B", 0, 2, 2, 3)], 1460, 900, 62, outline=None, extent=(5, 6))


def f_pairs(cv, a):
    ribbon(cv, POS, NEG, 1000, 260, 420, 110)
    rows = [[X("块对", "Pair"), X("关系", "Relation"), X("边", "Edge")]]
    rel = {"left": X("在左边", "left of"), "below": X("在下边", "below")}
    for e in REL:
        rows.append([f"{e['a']}, {e['b']}", f"{e['a']} {rel[e['rel']]} {e['b']}", f"{e['graph']}: {e['a']} → {e['b']}"])
    table(cv, 940, 530, [150, 320, 230], rows, size=26, lh=40, colors={(i + 1, 2): (TEAL if e["graph"] == "H" else AMBER) for i, e in enumerate(REL)})


def f_graphs(cv, a):
    graphs(cv, 980, 720, 100)
    cv.text(1380, 880, X("青：H（向右）· 金：V（向上）· 虚线：可推出", "teal: H (right) · gold: V (up) · dashed: implied"), 24, MUTED, align="center")


def f_why_max(cv, a):
    plan(cv, [("A", 0, 0, 3, 2), ("C", 0, 2, 2, 2), ("B", 3, 0, 2, 3)], 960, 560, 62, outline=None, extent=(6, 4.5))
    cv.text(1140, 640, X("取最大 x[B] = 3：不重叠", "maximum x[B] = 3: no overlap"), 28, TEAL, "bold", "center")
    plan(cv, [("A", 0, 0, 3, 2), ("C", 0, 2, 2, 2), ("B", 2, 0, 2, 3)], 1400, 920, 62, outline=None, extent=(6, 4.5), red=[("A", "B")])
    cv.text(1580, 1000, X("取最小 x[B] = 2：重叠", "minimum x[B] = 2: overlap"), 28, RED, "bold", "center")


def f_dpx(cv, a):
    cands(cv, 960, 300, DPX["E"])
    graphs(cv, 1000, 880, 60, show="H", r=26)


def f_dpy(cv, a):
    cands(cv, 960, 300, DPY["D"])
    plan(cv, rects(G), 1060, 960, 40, coords=False, focus="D")


def f_packing(cv, a):
    plan(cv, rects(G), 1000, 880, 70)
    cv.rect(1000, 880 - 4 * 70, 9 * 70, 4 * 70, stroke=TEAL, width=4)
    cv.text(1000 + 4.5 * 70, 880 - 4 * 70 - 20, X("包围盒 9 × 4", "bounding box 9 × 4"), 28, TEAL, "bold", "center")


def f_overflow(cv, a):
    plan(cv, rects(RUN["row"]["result"]), 940, 560, 42, coords=False)
    cv.text(1190, 640, "A B C D E / A B C D E → 12 × 3", 24, RED, "bold", "center")
    plan(cv, rects(RUN["stack"]["result"]), 1495, 960, 36, coords=False)
    cv.text(1720, 520, "A B C D E / E D C B A", 22, RED, "bold", "center")
    cv.text(1720, 556, "→ 3 × 10", 22, RED, "bold", "center")


def f_encoding(cv, a):
    plan(cv, rects(G), 960, 560, 34, coords=False)
    cv.text(960 + 5 * 34, 636, "A B C E D / D A B C E", 22, INK, align="center")
    plan(cv, rects(RUN["twin"]["result"]), 1420, 560, 34, coords=False)
    cv.text(1420 + 5 * 34, 636, "A B C D E / D A B C E", 22, INK, align="center")
    cv.text(1330, 400, "=", 70, GOLD, "bold", "center")
    rows = [[X("改动", "Change"), X("包围盒", "Box"), X("坐标", "Coords")]]
    for a_ in T["adjacent"][:6]:
        rows.append([f"{a_['seq']} {a_['swap'][0]}↔{a_['swap'][1]}", f"{a_['bbox'][0]} × {a_['bbox'][1]}", X("不变", "same") if a_["same"] else X("改变", "moved")])
    table(cv, 980, 720, [300, 200, 200], rows, size=24, lh=38)


def f_pseudo(cv, a):
    code(cv, 960, 300, [X("检查 pos、neg（全部问题）", "check pos, neg (every problem)"), X("对 pos 中每对 (i, j)：", "for each pair (i, j) in pos:"),
                        X("  neg 中也在前 → H 边", "  first in neg too → H edge"), X("  否则 → V 边", "  else → V edge"), "order ← pos",
                        "x[j] ← max(0, x[i] + w[i])", "y[j] ← max(0, y[i] + h[i])", X("报告四个问题", "report four questions")], active=(6, 7), size=26, lh=56, w=860)


FIGURES = {"problem": f_problem, "rule": f_rule, "two": f_two, "pairs": f_pairs, "graphs": f_graphs, "whymax": f_why_max, "dpx": f_dpx, "dpy": f_dpy,
           "packing": f_packing, "overflow": f_overflow, "encoding": f_encoding, "pseudo": f_pseudo}
