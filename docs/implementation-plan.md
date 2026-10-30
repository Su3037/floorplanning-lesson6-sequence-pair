# Implementation plan · Module 06 Sequence-Pair

Order of work (playbook phases), with where each piece lives. Status as of 2026-10-30; the live status is in `handoff-state.md`.

| # | Phase | Output | Status |
| --- | --- | --- | --- |
| 1 | Source audit, outline, golden fixture | `docs/source-audit.md`, `docs/outline.md`, `fixtures/sequence-pair.json` | done |
| 2 | Engine and trace schema | `site/engines/sequence-pair.js`: validate → relations → graphs → DP in pos order → report; events `validate`, `relation`, `order`, `dp`, `report` with pseudocode line numbers | done |
| 3 | Independent reference + cross-check | `python/m06-sequence-pair/reference.py` (Kahn order), `tests/crosscheck.py` (15,068 cases) | done |
| 4 | Engine tests | `tests/engines.test.mjs`: four relations, golden, graphs, DP max + predecessor size, trace shape, touching/overlap/incomplete, overflow, twin encodings, exhaustive 14,400, mirrored convention, malformed input, neighbour moves | done |
| 5 | Lesson text zh + en | `content/modules/m06-sequence-pair/lesson.md`, `lesson.en.md`, `module(.en).json` | done |
| 6 | Interactive lab | `site/modules/m06-sequence-pair/lab.js`: editors (buttons, Alt+←/→, drag, text), ribbons, oblique constraint graphs, floorplan, step player synced to pseudocode, metrics judged separately, presets, undo, random neighbour, rotation extension, run export; stale results dropped by run number | done |
| 7 | Challenges + concept checks | `challenges.js` (7, two hints each, engine-judged), `tests/challenges.test.mjs`; quiz in `module.json` | done |
| 8 | Code lab + Python pack | `site/assets/codelab.js` (Pyodide), `visualize.js` (your functions vs the engine on 8 cases), zips in `site/downloads/` | done |
| 9 | Slides | 14 pages zh + en, PDF + PPTX with notes; `slides(.en).json`, `video/m06-sequence-pair/figures.py` | done |
| 10 | Films | popular (We Never, author's choice), concise, advanced: `video/m06-sequence-pair/films.py`; lab walkthrough: `walkthrough.mjs` | done |
| 11 | Crosswalk | `crosswalk.json`: objectives ↔ lesson sections ↔ film scenes ↔ slides | done |
| 12 | Docs, licences, CI | README, NOTICE, LICENSE(-CONTENT), THIRD_PARTY_NOTICES, BUILD, verification, handoff, submission draft, `.github/workflows/pages.yml` | done |
| 13 | Publish | push to `Su3037/floorplanning-lesson6-sequence-pair`, Pages from Actions, verify deployed pages and media | done (deployed 2026-10-30) |

Risks and responses: the popular film depends on a local, uncommitted audio file (documented; other films unaffected);
live upstream URLs were not reachable from the build environment (site works without them); Pages size is well within limits
(no Git LFS).
