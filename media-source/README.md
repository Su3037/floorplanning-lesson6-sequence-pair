# Media sources

Every film frame and slide is drawn by code from the same engine data the website uses
(`site/data/m06-sequence-pair/traces.json`), so the media cannot drift from the lab.

| Output | Source | Renderer |
| --- | --- | --- |
| Popular, concise, advanced films (`site/media/m06-sequence-pair/{story,concise,advanced}.{zh,en}.*`) | `video/m06-sequence-pair/films.py` (scenes, captions, timings) + `scripts/film/story.py` (music sections) | `scripts/film/cinema.py` with the `cine.py` drawing kit |
| Lab walkthrough (`lab.{zh,en}.*`) | `video/m06-sequence-pair/walkthrough.mjs` (script driving the real page) + `walkthrough.json` (titles) | `scripts/film/recorder.mjs` → `scripts/film/walkthrough.py` |
| Slide deck (`site/slides/m06-sequence-pair/`) | `content/modules/m06-sequence-pair/slides.json` / `slides.en.json` (text and speaker notes) + `video/m06-sequence-pair/figures.py` (figures) | `scripts/slides/build_slides.py` |
| Original score (concise, advanced, lab) | `scripts/film/music.py` | NumPy synthesis |
| Music cue map for the popular film | `scripts/film/cues/wenever.json` (measured onsets; no audio) | — |

Not in the repository: the third-party recording used under the popular film (see `THIRD_PARTY_NOTICES.md`).
Commands: `docs/BUILD.md`.
