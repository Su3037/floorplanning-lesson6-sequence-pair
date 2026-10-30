# Source audit · Module 06 Sequence-Pair

Audit of the instructor's material, done before any page, slide or film (playbook phase 1). Four kinds of statement are kept
apart: **verified** (checked here, with the command), **author claim** (stated in a source, not re-checked), **design decision**
(ours, logged in `decision-log.md`) and **reconstruction** (none in this module).

## 1. Assignment

| Item | Value | Kind |
| --- | --- | --- |
| Issue | [yongfu-li/eda-learning#22](https://github.com/yongfu-li/eda-learning/issues/22) "Floorplanning - Lesson 6", assignee Su3037, opened 2026-10-27 | verified from the research pack snapshot `issue-22.json` (2026-10-30) |
| Issue body / comments | empty / none at snapshot time | verified (snapshot). No deadline, rubric or duration is implied. |
| Topic | Sequence-pair representation | verified by three sources: `docs/MODULES.md`, the platform page `labs/sequence-pair/index.html` (breadcrumb `Lab 06`), the module README |
| Upstream ids | module `module02-05-sequence-pair`, lab `sequence-pair` | verified |
| Pinned commit | `003bcd49e3794e6cfd2680181cdbd347d673ad07` | verified (`upstream-commit.json`) |
| Course position vs upstream number | position 6 (Lab 06) vs hierarchical 02-05 | design decision D-SCOPE-2: display "Module 06", record `module02-05-sequence-pair` as metadata |

Live URLs (`yongfu-li.github.io/eda-learning/...`, the older `universal-verification-methodology.github.io` host, the Murata PDF on
`limsk.ece.gatech.edu`) could **not** be fetched from the build environment: its network policy refused the connection (HTTP 403 at
the proxy, 2026-10-30). Their current accessibility is therefore **unverified**; the site links to them as references only and no
essential function depends on them.

## 2. Files read (from the pinned snapshot in the research pack, SHA-256 in `source-manifest.json`)

`docs/MODULES.md`, `docs/SCOPE.md`, `docs/TWO_TRACKS.md`, course `README.md`, `LICENSE` (CC BY 4.0);
`module02-05-sequence-pair/` `README.md`, `EXAMPLES.md`, `CHECKLIST.md`, `transcript.md`, `slides.md`, `outline.yaml`, `quiz.json`,
`assets/STEPS.md`, `examples/tiny_modules.json`; `common/pack.py`, `metrics.py`, `goldens.py`, `solvers.py`;
`platform/.../labs/sequence-pair/index.html`, `platform/assets/catalog.json`, `platform/assets/floorplanning-core.js`,
`platform/tools/sequence-pair/sequence-pair.js`. The original `video.mp4`, `slides.pptx`, `slides.pdf` and step PNGs were not in the
pack and were not downloaded; nothing from them is reused.

## 3. What to keep

- **Two tracks** (browser lab + implement in Python): kept as the lab and the code lab, sharing one engine and one fixture.
- **The five-block fixture and the golden pair** (pos A B C E D, neg D A B C E, outline 10 × 8): kept as the main worked example.
- **The convention** in `common/pack.py`: lower-left origin, y up, "before in pos, after in neg → below". Kept and stated everywhere.
- **The pseudocode sketch** in `EXAMPLES.md` (relations → H/V → longest paths): kept and expanded line by line.
- **"SP neighbours are permutation moves"** (STEPS step 5): kept as a short preview of annealing, not a full course.

## 4. What is wrong, ambiguous or thin (and what this module does)

| # | Finding | Evidence | Action |
| --- | --- | --- | --- |
| A1 | `GOLDEN_PACK` in `goldens.py` places D at (0, 2); the golden pair packs D at (0, 3). They are different examples. | `common/goldens.py` vs `pack_sequence_pair` output | Only the computed (0, 3) is taught; `tests/engines.test.mjs` asserts y[D] ≠ 2. |
| A2 | `tiny_modules.json` writes the outline `{W, H}`; `metrics.py` reads `outline["w"]`. Reading the raw file with the helper would fail or read undefined in JS. | the two files | `normalizeInput()` accepts either spelling once, rejects a conflict, and the rest of the engine sees `{w, h}`. Tested. |
| A3 | "Deadspace = 80 − Σ(w·h)" is constant: with fixed areas and a fixed outline, 57 and 28.75 % never change. | `tiny_modules.json` notes, `metrics.py` | Taught as a constant; the variable quantities are bbox area, bbox utilisation and overflow. Exhaustively tested over 14,400 pairs. |
| A4 | The packer guarantees non-overlap, not fit. 720 of 14,400 pairs overflow 10 × 8. | research pack `source-verification.json`; re-run here | Fit is reported separately; two overflowing presets. |
| A5 | `is_legal_packing` checks geometry of what is present; an empty or partial pack is not flagged as incomplete. | `metrics.py` | `checkPlacement()` reports `complete`, `missing`, `extra`, `repeated` separately; empty → `incomplete`. |
| A6 | `quiz.json` asks which letter the golden sequence starts with. | `quiz.json` q1, q2 | Replaced by concept checks on relations, fit, constants, max vs min and encodings. |
| A7 | Module A is marked `soft` with an aspect range; nothing in the lab uses it. | `tiny_modules.json` | Dimensions fixed; rotation is an explicitly labelled extension in the lab; soft sizing is mentioned only. |
| A8 | The older README host `universal-verification-methodology.github.io` | module README | Not copied; links point to the pinned GitHub source. |
| A9 | The browser lab builds pos/neg by "pos+X" buttons and accepts partial sequences into `sameSet`; the result is shown only as text metrics. | `tools/sequence-pair/sequence-pair.js` | New lab: full validation, both graphs, the DP trace and geometry from one computed state. |
| A10 | Other references use the mirrored vertical rule ("before in pos, after in neg → above"). | several textbooks and lecture notes | Stated in the lesson; proved by test that it equals this convention with pos and neg swapped. |

## 5. Verified numbers (re-run on the new engine, not taken from the pack)

`node --test tests/engines.test.mjs` and `python3 tests/crosscheck.py` (see `verification.md` for the run log):
golden coordinates A(0,0) B(3,0) C(5,0) E(7,0) D(0,3); bbox 9 × 4 = 36; block area 23; outline unused 57; density 28.75 %;
bbox unused 13; utilisation 63.89 %; 14,400 pairs all overlap-free, 13,680 fit, 720 overflow; 9,056 distinct packings;
3 pairs give the golden packing; smallest bbox 24 (6 × 4).

## 6. Licences

The course material is CC BY 4.0 (`courses/learn_floorplanning/LICENSE`): the fixture values, the golden pair, the convention and the
pseudocode outline are reused with attribution and a modification notice (`NOTICE.md`). No upstream code is copied: the engine, the
Python reference, the lab, the films and the slides are new. The platform JS has no separate licence statement in the snapshot, so it
was read for behaviour only. The Murata et al. paper is cited and linked; none of its figures are reproduced.
