# Verification log

Run on 2026-10-30 in the build container (Node 22.22.0, Python 3.13.17, Chromium via Playwright). Each line says whether a check
**passed**, **failed** or **was not run**. Source-audit numbers are not used as evidence here: everything below ran against this
repository's own code.

## Automated tests: passed

| Command | Result |
| --- | --- |
| `node --test tests/engines.test.mjs tests/challenges.test.mjs tests/site.test.mjs` | 27 / 27 passed |
| `python3 tests/crosscheck.py` | 15,068 cases, 150,066 DP steps / error sets compared, 0 mismatches (JS engine vs independent Python reference) |
| `python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/reference.py` | PASS 7, FAIL 0 |
| `python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/en/reference.py` | PASS 7, FAIL 0 |
| `python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/starter.py` | 7 INCOMPLETE, as intended for the unfilled starter |

The engine tests cover: the four pairwise relations under the declared convention; the golden coordinates and metrics; one edge per
pair with implied edges kept; DP takes the maximum and adds the predecessor's size; trace shape; touching edges vs positive-area
overlap; empty = incomplete; overflow; two encodings of one packing; all 14,400 pairs (all overlap-free, 13,680 fit, outline metrics
constant); the mirrored textbook convention = pos/neg swapped; malformed inputs with specific error codes; neighbour moves stay valid.
The challenge tests check every challenge against the engine with right and wrong answers. The site tests cover links, no CDN, fonts
and their licences, the font subset, `.nojekyll`, the subpath (no root-absolute paths), translation, films (four, zh + en, reading
time 0 violations, crosswalk scenes), slides (numbered, notes, PDF + PPTX) and licences / no committed audio.

## Browser acceptance: passed (28 / 28 at the Pages subpath, 28 / 28 at the root)

`node tests/browser-acceptance.mjs <base>` against `python3 scripts/serve.py 8800 floorplanning-lesson6-sequence-pair`
(subpath `/floorplanning-lesson6-sequence-pair/`) and against `python3 -m http.server 8801` in `site/` (root). Subpath run:

```text
PASS  page loads: /  — 序列对 · Floorplanning · Lesson 6
PASS  page loads: /en/  — Sequence-Pair · Floorplanning · Lesson 6
PASS  page loads: /modules/m06-sequence-pair/  — Module 06 序列对 · Floorplanning · Lesson 6
PASS  page loads: /en/modules/m06-sequence-pair/  — Module 06 Sequence-Pair · Floorplanning · Lesson 6
PASS  page loads: /glossary/  — 术语表 · Floorplanning · Lesson 6
PASS  page loads: /foundations/  — 基础速查 · Floorplanning · Lesson 6
PASS  page loads: /guide/  — 如何挑战 · Floorplanning · Lesson 6
PASS  page loads: /credits/  — 资源与贡献 · Floorplanning · Lesson 6
PASS  page loads: /progress/  — 学习记录 · Floorplanning · Lesson 6
PASS  lab initial result 9 × 4 fits  — 完整 / ✓ 5 块各一次 / 不重叠
PASS  keyboard: Alt+→ moves the selected block  — A B C D E
PASS  undo restores the previous pair  — A B C E D
PASS  editing during playback starts a new run (old events dropped)  — run 4, tag "第 4 次运行 · 输入了 pos"
PASS  invalid input shows an error listing every problem  — 序列对不合法： pos 里 B 出现了 2 次。 pos 缺少模块 C。 pos 缺少模块 D。 pos 有 4 项，neg 有 5 项。
PASS  invalid input has no metrics
PASS  reset returns to the preset
PASS  clicking block E explains x[E] = 7 from C
PASS  slides viewer numbers pages (1/14)  — 1/14
PASS  film player present with subtitle tracks  — 1 video, 2 tracks
PASS  subtitle loads: story.zh.vtt
PASS  subtitle loads: story.en.vtt
PASS  downloads respond (6 links)
PASS  refresh: page re-renders the lab
PASS  language switch goes to the English edition  — http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/en/index.html → http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/modules/m06-sequence-pair/
PASS  mobile 390 px: no horizontal page scroll on /  — scrollWidth 390
PASS  mobile 390 px: no horizontal page scroll on /modules/m06-sequence-pair/  — scrollWidth 390
PASS  reduced motion: transitions off and no smooth scrolling  — transition 0s, scroll-behavior auto
PASS  no page errors, console errors or failed requests

28/28 passed
```

The code lab was also exercised end to end while recording the walkthrough film (both languages): the starter reports INCOMPLETE,
the typed `relation()` and `longest_path()` plus the three reference-filled tasks pass 7 / 7, and "Run my code" matches the engine on
8 / 8 cases.

## Media: passed

- Films (`site/media/m06-sequence-pair/film.json`): popular 189.83 s, concise 129.87 s, advanced 140.87 s in zh and en; lab
  walkthrough 170.73 s (zh) and 156.50 s (en). H.264 + AAC; caption reading-time violations 0 for every version.
- Stills and frames of every film were inspected visually; overlaps found earlier were fixed before the final render.
- Slides: 14 pages zh + en, PDF and PPTX; previews inspected; three figure overlaps (pages 7, 11, 12) fixed and rebuilt.
- I did not listen to any audio. The popular film's soundtrack was placed by the cue map in `scripts/film/cues/wenever.json`.

## Not run

- Real devices (phones, Safari, Firefox): only Chromium with a 390 px mobile viewport was used.
- Screen-reader testing.
- Browser automation against the deployed site: the build container cannot open `su3037.github.io` (egress proxy refuses the host),
  so the 28 browser checks above ran on local servers that mimic the subpath and the root, not on the live site.

## Deployment: passed

- Workflow `pages` on `main` (commit `3826e62`): `test` job passed (the same node, cross-check and Python commands as above);
  `deploy` job passed on its second attempt, after Pages was switched to "GitHub Actions" in the repository settings
  (the first attempt stopped at `configure-pages` because Pages was not yet enabled).
- Live responses checked by fetching (2026-10-30): home page (title “序列对 · Floorplanning · Lesson 6”), the English module page
  (all nine sections), `media/m06-sequence-pair/film.json` (four films × zh/en with the durations above),
  `story.zh.vtt` (valid WebVTT), `story.zh.mp4` (served as binary), the zh slide PDF (14 pages, “两行字母”).
