# ---- 自包含检查框架（每个练习包各复制一份，不依赖外部 common/）----
# Self-contained checker framework (copied into every pack). Language: --lang en or COURSE_LANG=en.
# --json prints one machine-readable line (used by the in-browser code lab).
import importlib.util
import json
import os
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent if "__file__" in globals() else Path.cwd()
LANG = "en" if ("--lang" in sys.argv and sys.argv[sys.argv.index("--lang") + 1:][:1] == ["en"]) or os.environ.get("COURSE_LANG") == "en" else "zh"
JSON_MODE = "--json" in sys.argv


def T(zh, en):
    """Pick the message for the current language."""
    return en if LANG == "en" else zh


def load_impl(argv):
    args = [a for i, a in enumerate(argv[1:], 1) if not a.startswith("--") and argv[i - 1] != "--lang"]
    target = Path(args[0]) if args else HERE / "starter.py"
    if not target.is_absolute():
        target = (Path.cwd() / target).resolve()
    spec = importlib.util.spec_from_file_location("impl", target)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return target, mod


def fixture(name):
    return json.loads((HERE / "fixtures" / name).read_text(encoding="utf-8"))


class Fail(Exception):
    pass


class Skip(Exception):
    """可选检查因环境缺少依赖而未运行；不计为通过。 / An optional check did not run; it does not count as a pass."""


def expect(cond, message):
    if not cond:
        raise Fail(message)


def run_one(fn, impl):
    try:
        fn(impl)
        return "PASS", ""
    except NotImplementedError as e:
        return "INCOMPLETE", (T(f"尚未实现：{e}", f"not implemented yet: {e}") if str(e) else T("尚未实现", "not implemented yet"))
    except Skip as e:
        return "SKIP", str(e)
    except Fail as e:
        return "FAIL", str(e)
    except Exception as e:  # 代码本身抛错，给出最后一行位置 / the code itself raised: show where
        tb = traceback.extract_tb(e.__traceback__)[-1]
        return "ERROR", f"{type(e).__name__}: {e} ({Path(tb.filename).name}:{tb.lineno})"


def run_checks(checks, argv=sys.argv):
    target, impl = load_impl(argv)
    results = []
    for name, fn in checks:
        status, note = run_one(fn, impl)
        results.append({"name": name, "status": status, "note": note})
    counts = {k: sum(r["status"] == k for r in results) for k in ("PASS", "FAIL", "INCOMPLETE", "ERROR", "SKIP")}
    ok = counts["PASS"] + counts["SKIP"] == len(checks) and counts["PASS"] > 0
    if JSON_MODE:
        print("@@CHECK@@" + json.dumps({"results": results, "counts": counts, "ok": ok}, ensure_ascii=False))
        return 0 if ok else 1
    print(T(f"检查对象：{target.name}", f"Checking: {target.name}"))
    for r in results:
        print(f"{r['status']:<10} {r['name']}" + (f"\n           {r['note']}" if r["note"] else ""))
    print(T("—— 合计：", "—— Total: ") + T("，", ", ").join(f"{k} {v}" for k, v in counts.items()))
    if counts["INCOMPLETE"]:
        print(T("INCOMPLETE 不等于通过：补全对应函数后再运行。", "INCOMPLETE is not a pass: finish the function and run again."))
    if counts["SKIP"]:
        print(T("SKIP 表示该项没有运行（缺少可选依赖），不是通过。", "SKIP means the check did not run (an optional dependency is missing); it is not a pass."))
    return 0 if ok else 1
# ---- 框架结束 ----
import itertools
import random

DATA = fixture("sequence-pair.json")
FX = DATA["fixture"]
MODS, OUTLINE = FX["modules"], FX["outline"]
IDS = [m["id"] for m in MODS]
PRESET = {p["id"]: p for p in DATA["presets"]}
SMALL = {p["id"]: p for p in DATA["small"]}
GOLD = PRESET["golden"]


def c_validate(impl):
    expect(impl.validate_pair(GOLD["pos"], GOLD["neg"], IDS) == [], T("教师示例是合法序列对，应返回 []", "the instructor's pair is valid, so the result should be []"))
    codes = lambda r: sorted((c, s, i) for c, s, i in r)
    r = impl.validate_pair(list("ABCE"), GOLD["neg"], IDS)
    expect(("seq-missing", "pos", "D") in codes(r), T(f"pos 缺 D：应报 ('seq-missing','pos','D')，得到 {r}", f"pos lacks D: expected ('seq-missing','pos','D'); got {r}"))
    expect(("seq-length", None, None) in codes(r), T("pos 4 项、neg 5 项：还应报 seq-length", "pos has 4 entries and neg 5: seq-length should be reported too"))
    r = impl.validate_pair(list("ABCED"), list("DABCA"), IDS)
    expect(("seq-repeat", "neg", "A") in codes(r) and ("seq-missing", "neg", "E") in codes(r), T(f"neg 里 A 重复、缺 E：两个问题都要列出，得到 {r}", f"neg repeats A and lacks E: both problems should be listed; got {r}"))
    r = impl.validate_pair(list("ABCEZ"), GOLD["neg"], IDS)
    expect(("seq-unknown", "pos", "Z") in codes(r), T(f"Z 不是模块：应报 seq-unknown，得到 {r}", f"Z is not a module: expected seq-unknown; got {r}"))


def c_relation(impl):
    for sid, a, b, want in [("two-left", "A", "B", "left"), ("two-left", "B", "A", "right"), ("two-below", "A", "B", "below"), ("two-below", "B", "A", "above")]:
        p = SMALL[sid]
        got = impl.relation(p["pos"], p["neg"], a, b)
        expect(got == want, T(f"pos={''.join(p['pos'])} neg={''.join(p['neg'])}：{a} 相对 {b} 应为 {want}，得到 {got}", f"pos={''.join(p['pos'])} neg={''.join(p['neg'])}: {a} relative to {b} should be {want}; got {got}"))
    got = impl.relation(GOLD["pos"], GOLD["neg"], "A", "D")
    expect(got == "below", T(f"教师示例里 A 在 pos 中先于 D、在 neg 中晚于 D → A 在 D 下边，得到 {got}", f"in the instructor's pair A comes before D in pos and after D in neg → A is below D; got {got}"))


def c_graphs(impl):
    H, V = impl.build_graphs(GOLD["pos"], GOLD["neg"])
    H, V = sorted(map(tuple, H)), sorted(map(tuple, V))
    expect(len(H) + len(V) == 10, T(f"5 块有 10 对，每对恰好一条边；得到 {len(H)} + {len(V)}", f"5 blocks make 10 pairs, one edge each; got {len(H)} + {len(V)}"))
    expect(V == [("A", "D"), ("B", "D"), ("C", "D"), ("E", "D")], T(f"竖直边应是 A、B、C、E 各指向 D（D 在它们上面），得到 {V}", f"the vertical edges should run from A, B, C and E to D (D sits above them); got {V}"))
    expect(("A", "E") in H and ("C", "E") in H, T("水平边要包括能由更长路径推出的边，例如 A→E", "the horizontal edges must include implied ones such as A→E"))
    rnd = random.Random(6)
    for case in range(60):
        n = rnd.randint(2, 7)
        ids = [chr(65 + k) for k in range(n)]
        pos, neg = ids[:], ids[:]
        rnd.shuffle(pos); rnd.shuffle(neg)
        H, V = impl.build_graphs(pos, neg)
        pairs = {frozenset(e) for e in list(H) + list(V)}
        expect(len(pairs) == len(list(H)) + len(list(V)) == n * (n - 1) // 2, T(f"案例 {case}：每对块恰好一条边", f"case {case}: exactly one edge per pair of blocks"))
        for i, j in H:
            expect(pos.index(i) < pos.index(j) and neg.index(i) < neg.index(j), T(f"案例 {case}：水平边 {i}→{j} 要求两个序列里 {i} 都在前", f"case {case}: H edge {i}→{j} needs {i} first in both sequences"))
        for i, j in V:
            expect(pos.index(i) < pos.index(j) and neg.index(i) > neg.index(j), T(f"案例 {case}：竖直边 {i}→{j} 要求 pos 里 {i} 在前、neg 里 {i} 在后", f"case {case}: V edge {i}→{j} needs {i} first in pos and later in neg"))


def c_dp(impl):
    p = SMALL["three-max"]
    w = {m["id"]: m["w"] for m in p["modules"]}
    rank = {b: k for k, b in enumerate(p["pos"])}.get
    x, chosen = impl.longest_path([m["id"] for m in p["modules"]], [("A", "B"), ("C", "B")], w, rank)
    expect(x["B"] == 3, T(f"B 的两个前驱给出 0+3 与 0+2：取最大 3，不是最小 2；得到 {x['B']}", f"B's predecessors give 0+3 and 0+2: take the maximum 3, not the minimum 2; got {x['B']}"))
    expect(chosen["B"] == "A" and chosen["A"] is None, T("chosen[B] 应为 A（最远的前驱），没有前驱的 A 为 None", "chosen[B] should be A (the farthest predecessor); A has none, so None"))
    pl = impl.pack(GOLD["pos"], GOLD["neg"], MODS)
    want = {b: (GOLD["expect"]["x"][b], GOLD["expect"]["y"][b]) for b in IDS}
    expect({b: tuple(v) for b, v in pl.items()} == want, T(f"教师示例的坐标应为 {want}，得到 {pl}", f"the instructor's pair should give {want}; got {pl}"))


def c_metrics(impl):
    pl = {b: (GOLD["expect"]["x"][b], GOLD["expect"]["y"][b]) for b in IDS}
    m = impl.metrics(MODS, OUTLINE, pl)
    expect(m["complete"] and not m["overlaps"] and m["fits"], T("教师示例：完整、不重叠、装得下", "the instructor's pair: complete, no overlap, fits"))
    expect(tuple(m["bbox"]) == (9, 4) and m["bbox_area"] == 36 and m["bbox_unused"] == 13, T(f"包围盒 9×4、面积 36、空余 13；得到 {m['bbox']} {m['bbox_area']} {m['bbox_unused']}", f"bounding box 9×4, area 36, unused 13; got {m['bbox']} {m['bbox_area']} {m['bbox_unused']}"))
    expect(m["block_area"] == 23 and m["outline_unused"] == 57 and abs(m["outline_density"] - 0.2875) < 1e-12, T("块面积 23、边界空余 57、边界密度 28.75%", "block area 23, outline unused 57, outline density 28.75%"))
    two = {"A": (0, 0), "B": (3, 0)}
    m2 = impl.metrics(SMALL["two-left"]["modules"], SMALL["two-left"]["outline"], two)
    expect(not m2["overlaps"], T("A 的右边 x=3 与 B 的左边 x=3 只是贴边，不算重叠", "A's right edge x=3 touching B's left edge x=3 is not an overlap"))
    m3 = impl.metrics(SMALL["two-left"]["modules"], SMALL["two-left"]["outline"], {"A": (0, 0), "B": (2, 0)})
    expect(len(m3["overlaps"]) == 1, T("B 放在 x=2 时与 A 有 1×2 的正面积相交", "with B at x=2 it overlaps A by a 1×2 area"))
    m4 = impl.metrics(MODS, OUTLINE, {})
    expect(not m4["complete"] and not m4["fits"], T("空摆放没有重叠也不能算“完整且合法”", "an empty placement has no overlaps but must not count as complete and valid"))
    row = PRESET["row"]
    m5 = impl.metrics(MODS, OUTLINE, impl.pack(row["pos"], row["neg"], MODS))
    expect(m5["complete"] and not m5["overlaps"] and not m5["fits"] and tuple(m5["bbox"]) == (12, 3), T("一字排开：合法不重叠，但宽 12 > 10，装不下", "all in a row: valid, no overlap, but 12 wide > 10, so it does not fit"))
    expect(m5["outline_unused"] == m["outline_unused"], T("边界空余面积不随序列对变化（57）", "the outline's unused area does not depend on the sequence pair (57)"))


def c_random(impl):
    rnd = random.Random(20261030)
    for case in range(300):
        n = rnd.randint(1, 8)
        ids = [chr(65 + k) for k in range(n)]
        mods = [{"id": b, "w": rnd.randint(1, 6), "h": rnd.randint(1, 6)} for b in ids]
        pos, neg = ids[:], ids[:]
        rnd.shuffle(pos); rnd.shuffle(neg)
        pl = impl.pack(pos, neg, mods)
        d = {m["id"]: m for m in mods}
        H, V = impl.build_graphs(pos, neg)
        for i, j in H:
            expect(pl[j][0] >= pl[i][0] + d[i]["w"], T(f"案例 {case}：水平边 {i}→{j} 没有满足", f"case {case}: H edge {i}→{j} is violated"))
        for i, j in V:
            expect(pl[j][1] >= pl[i][1] + d[i]["h"], T(f"案例 {case}：竖直边 {i}→{j} 没有满足", f"case {case}: V edge {i}→{j} is violated"))
        for b in ids:  # compact: each coordinate is 0 or sits exactly on a predecessor's far edge
            xs = [0] + [pl[i][0] + d[i]["w"] for i, j in H if j == b]
            ys = [0] + [pl[i][1] + d[i]["h"] for i, j in V if j == b]
            expect(pl[b][0] == max(xs) and pl[b][1] == max(ys), T(f"案例 {case}：{b} 的坐标不是最小可行值（应为前驱约束的最大值）", f"case {case}: {b} is not at its smallest feasible coordinate (the maximum over its predecessors)"))
        m = impl.metrics(mods, {"w": 100, "h": 100}, pl)
        expect(m["complete"] and not m["overlaps"], T(f"案例 {case}：合法序列对的布局必须完整且不重叠", f"case {case}: a valid pair's packing must be complete and overlap-free"))


def c_all(impl):
    fit = 0
    for pos in itertools.permutations(IDS):
        for neg in itertools.permutations(IDS):
            pl = impl.pack(list(pos), list(neg), MODS)
            bw = max(pl[m["id"]][0] + m["w"] for m in MODS)
            bh = max(pl[m["id"]][1] + m["h"] for m in MODS)
            fit += bw <= OUTLINE["w"] and bh <= OUTLINE["h"]
    expect(fit == 13680, T(f"14,400 对里应有 13,680 对装进 10×8，得到 {fit}", f"13,680 of the 14,400 pairs should fit 10×8; got {fit}"))


CHECKS = [
    (T("[合法性] 序列对校验：缺、重、未知、长度", "[validity] pair validation: missing, repeated, unknown, length"), c_validate),
    (T("[推演] 四种相对位置", "[trace] the four relations"), c_relation),
    (T("[构图] 水平 / 竖直约束图（含 60 个随机例）", "[graphs] horizontal / vertical constraint graphs (plus 60 random cases)"), c_graphs),
    (T("[推演] 最长路径 DP：取最大，加前驱尺寸", "[trace] longest-path DP: take the max, add the predecessor's size"), c_dp),
    (T("[约束] 指标：贴边、重叠、完整、溢出、常量", "[constraint] metrics: touching, overlap, completeness, overflow, constants"), c_metrics),
    (T("[实现] 300 个随机序列对：约束成立、紧凑、不重叠", "[implement] 300 random pairs: constraints hold, compact, no overlap"), c_random),
    (T("[探索] 全部 14,400 对：13,680 对装得下", "[explore] all 14,400 pairs: 13,680 fit"), c_all),
]

if __name__ == "__main__":
    sys.exit(run_checks(CHECKS))
