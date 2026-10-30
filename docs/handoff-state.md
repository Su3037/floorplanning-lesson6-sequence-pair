# Handoff state

Last updated: 2026-10-30 (session building the lesson from the research pack).

## Done
- Engine `site/engines/sequence-pair.js`, fixture `fixtures/sequence-pair.json`, traces `site/data/m06-sequence-pair/traces.json`.
- Lesson, lab, challenges (7), concept checks (6), code lab, glossary, foundations, guide, credits, progress pages; zh and en.
- Python pack zh + en (`python/m06-sequence-pair/`), zips in `site/downloads/`.
- Slides zh + en: 14 pages, PDF + PPTX + previews (`site/slides/m06-sequence-pair/`).
- Films zh + en: popular 189.8 s (We Never), concise 129.9 s, advanced 140.9 s, lab walkthrough 170.7 s / 156.5 s (`site/media/m06-sequence-pair/`).
- Licences and notices: `LICENSE`, `LICENSE-CONTENT.md`, `NOTICE.md`, `THIRD_PARTY_NOTICES.md`; docs in `docs/`; CI in `.github/workflows/pages.yml`.

## Checks (exact commands; results in `verification.md`)
- `node --test tests/engines.test.mjs tests/challenges.test.mjs tests/site.test.mjs`
- `python3 tests/crosscheck.py`
- `python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/reference.py` (and `en/reference.py`)
- `node tests/browser-acceptance.mjs <base>` at the Pages subpath and at the root (28 / 28 each).

## Unresolved
- The popular film needs the uncommitted audio file to re-render (`docs/BUILD.md`).
- The submission reply is a draft only (`submission-draft.md`); not posted.

- Live-site browser automation was not possible from the build container (host blocked); see `verification.md`.

## Published
- https://github.com/Su3037/floorplanning-lesson6-sequence-pair (Pages source: GitHub Actions)
- https://su3037.github.io/floorplanning-lesson6-sequence-pair/

## Next action
Post `submission-draft.md` on issue #22 only when the author says so.
