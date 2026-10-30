#!/usr/bin/env python3
"""JS engine (site/engines/sequence-pair.js) ↔ independent Python reference (python/m06-sequence-pair/reference.py).

Compares, case by case: the H and V edge lists, every DP value with the predecessor that set it (both axes), the
bounding box and outline fit; and, for invalid inputs, the set of error codes. Cases: the shared fixtures, all 14,400
pairs of the five-block example, and 600 seeded random instances (1–9 blocks, mixed sizes, mixed outlines), plus
seeded malformed pairs.
"""
import importlib.util
import itertools
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ref", ROOT / "python/m06-sequence-pair/reference.py")
REF = importlib.util.module_from_spec(spec)
spec.loader.exec_module(REF)
DATA = json.loads((ROOT / "fixtures/sequence-pair.json").read_text(encoding="utf-8"))


def py_case(c):
    ids = [m["id"] for m in c["modules"]]
    probs = REF.validate_pair(c["pos"], c["neg"], ids)
    if probs:
        return {"status": "invalid", "codes": sorted(p[0] for p in probs)}
    t = REF.trace(c["pos"], c["neg"], c["modules"])
    dp = [["x", b, t["x"][b], t["chosen_x"][b]] for b in c["pos"]] + [["y", b, t["y"][b], t["chosen_y"][b]] for b in c["pos"]]
    pl = {b: (t["x"][b], t["y"][b]) for b in ids}
    m = REF.metrics(c["modules"], c["outline"], pl)
    return {"status": "ok", "H": [list(e) for e in t["H"]], "V": [list(e) for e in t["V"]], "dp": dp, "fits": m["fits"], "bbox": list(m["bbox"])}


def main():
    cases = []
    fx = DATA["fixture"]
    for p in DATA["presets"]:
        cases.append({"outline": fx["outline"], "modules": fx["modules"], "pos": p["pos"], "neg": p["neg"]})
    for s in DATA["small"]:
        cases.append({"outline": s["outline"], "modules": s["modules"], "pos": s["pos"], "neg": s["neg"]})
    ids = [m["id"] for m in fx["modules"]]
    for a in itertools.permutations(ids):
        for b in itertools.permutations(ids):
            cases.append({"outline": fx["outline"], "modules": fx["modules"], "pos": list(a), "neg": list(b)})
    rnd = random.Random(20261030)
    for _ in range(600):
        n = rnd.randint(1, 9)
        names = [chr(65 + k) for k in range(n)]
        mods = [{"id": b, "w": rnd.choice([1, 2, 3, 4, 5, 1.5, 2.5]), "h": rnd.choice([1, 2, 3, 4, 0.5, 3.5])} for b in names]
        pos, neg = names[:], names[:]
        rnd.shuffle(pos); rnd.shuffle(neg)
        cases.append({"outline": {"w": rnd.randint(4, 14), "h": rnd.randint(4, 14)}, "modules": mods, "pos": pos, "neg": neg})
    for _ in range(60):  # malformed pairs
        pos, neg = ids[:], ids[:]
        rnd.shuffle(pos); rnd.shuffle(neg)
        kind = rnd.choice(["drop", "dup", "unknown", "both"])
        if kind in ("drop", "both"):
            pos = pos[:-1]
        if kind in ("dup", "both"):
            neg[0] = neg[1]
        if kind == "unknown":
            pos[2] = "Z"
        cases.append({"outline": fx["outline"], "modules": fx["modules"], "pos": pos, "neg": neg})
    js = json.loads(subprocess.run(["node", str(ROOT / "tests/js-pack.mjs")], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
    bad = 0
    steps = 0
    for k, (c, j) in enumerate(zip(cases, js)):
        p = py_case(c)
        if p != j:
            bad += 1
            if bad <= 5:
                print("MISMATCH", k, json.dumps(c)[:200], "\n  js:", j, "\n  py:", p)
        steps += len(p.get("dp", [])) or 1
    print(f"crosscheck: {len(cases)} cases, {steps} DP steps / error sets compared, {bad} mismatches")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
