# NOTICE

Floorplanning · Lesson 6 · 序列对 Sequence-Pair
Copyright (c) 2026 Su3037. Code: MIT (`LICENSE`). Original educational content: CC BY 4.0 (`LICENSE-CONTENT.md`).

## Attribution of adapted material (CC BY 4.0)

This lesson answers issue [yongfu-li/eda-learning#22](https://github.com/yongfu-li/eda-learning/issues/22)
("Floorplanning - Lesson 6") and is adapted from the instructor's course:

- **Source:** `courses/learn_floorplanning`, module `module02-05-sequence-pair` (lab `sequence-pair`), in
  [yongfu-li/eda-learning](https://github.com/yongfu-li/eda-learning/tree/003bcd49e3794e6cfd2680181cdbd347d673ad07/courses/learn_floorplanning)
  at commit `003bcd49e3794e6cfd2680181cdbd347d673ad07`.
- **Copyright:** contributors to learn_floorplanning / the learning monorepo.
- **Licence:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

### What was taken

- The five-block example (A 3×2, B 2×3, C 2×2, D 3×1, E 2×2), the 10 × 8 fixed outline and the pair ABCED / DABCE
  (`examples/tiny_modules.json`, `EXAMPLES.md`, `common/goldens.py`).
- The coordinate convention of `common/pack.py` (origin lower-left, y up; before in pos and after in neg → below).
- The topic list and learning goals of the module `README.md`, `outline.yaml`, `CHECKLIST.md` and `quiz.json`.

### Changes made

- Everything is rewritten: lesson text, Chinese and English editions, slide deck, four films, challenges, concept checks,
  JavaScript engine (`site/engines/sequence-pair.js`), Python starter / reference / checker. No upstream code, video,
  slide file or image is copied.
- The golden coordinates were recomputed: the pair ABCED / DABCE places D at (0, 3). `common/goldens.py`'s
  `GOLDEN_PACK` shows D at y = 2, which is a different illustration, not the result of this pair; the lesson says so
  (see `docs/source-audit.md`).
- Added: exhaustive check of all 14,400 pairs, a second encoding of the golden packing, overflow presets,
  rotation as a labelled extension, an in-browser code lab.
- Displayed as "Module 06" (the lesson's position); the hierarchical upstream id is kept as metadata.

## Reference

H. Murata, K. Fujiyoshi, S. Nakatake, Y. Kajitani, “VLSI Module Placement Based on Rectangle-Packing by the
Sequence-Pair,” *IEEE Trans. CAD*, 15(12):1518–1524, 1996. Concepts only; no figures or text reproduced.

## Third-party components

Fonts, Pyodide, CodeMirror, build tools and the popular film's music: see `THIRD_PARTY_NOTICES.md`.
