<p class="eyebrow">Credits</p>

## Credits

This lesson answers [yongfu-li/eda-learning issue #22](https://github.com/yongfu-li/eda-learning/issues/22), “Floorplanning - Lesson 6”. Its topic is the sixth lab of the instructor’s learn_floorplanning course: the sequence pair (catalogue id `module02-05-sequence-pair`, lab id `sequence-pair`).

### The instructor’s course (CC BY 4.0)

| Item | Detail |
| --- | --- |
| Author | Yongfu Li · learn_floorplanning |
| Source | [module02-05-sequence-pair (pinned at 003bcd4)](https://github.com/yongfu-li/eda-learning/tree/003bcd49e3794e6cfd2680181cdbd347d673ad07/courses/learn_floorplanning/module02-05-sequence-pair) |
| Licence | CC BY 4.0 |
| Kept | the five blocks A–E and their sizes, the 10 × 8 outline, the pair pos = A B C E D / neg = D A B C E; the coordinate convention; the pseudocode outline; the two tracks “browser lab + implement it yourself” |
| Changed | the outline spelling `{W, H}` is normalised to `{w, h}`; the `GOLDEN_PACK` layout (D at y = 2), which is not this pair’s output, is not taught; fit and non-overlap are reported separately; recall-only quiz items are replaced |

The lesson, engine, lab, challenges, films, slides and Python exercises are new. The instructor’s platform JavaScript was read only to understand the original lab’s behaviour and was not copied. Itemised changes are in the repository’s [NOTICE.md](https://github.com/Su3037/floorplanning-lesson6-sequence-pair/blob/main/NOTICE.md).

### Paper and further reading

- H. Murata, K. Fujiyoshi, S. Nakatake, Y. Kajitani. VLSI module placement based on rectangle-packing by the sequence-pair. *IEEE TCAD*, 15(12):1518–1524, 1996. The original sequence-pair paper. Cited only; none of its figures are reproduced.
- X. Tang, D. F. Wong. FAST-SP: a fast algorithm for block placement based on sequence pair. *ASP-DAC*, 2001. O(n log n) evaluation, not implemented here.
- S. N. Adya, I. L. Markov. Fixed-outline floorplanning: enabling hierarchical design. *IEEE TVLSI*, 11(6), 2003. Sequence-pair search under a fixed outline (Parquet).

### This lesson’s licences

| Part | Licence |
| --- | --- |
| Code (`site/`, `scripts/`, `python/`, `tests/`) | MIT |
| Lesson text, slides, film visuals, example data | CC BY 4.0 (the example data is adapted from the instructor’s course, also CC BY 4.0) |
| Font subsets | their own open font licences, see THIRD_PARTY_NOTICES.md |
| In-browser Python (Pyodide), code editor (CodeMirror) | their own licences, see THIRD_PARTY_NOTICES.md |
| Explainer-film music | see below |

### Music

The concise, advanced and lab-walkthrough films use music synthesised by this lesson’s scripts, released with the visuals under CC BY 4.0. If the explainer film uses a third-party recording chosen by the author, that recording is **outside this lesson’s licences**: no rights to it are granted, and no audio file of it is in the repository. To reuse the visuals, use the version without music.

### Production

Course author Su3037. Production was assisted by Claude (Anthropic), which drafted text and code and generated the films and slides; the author chose the topic, reviewed and published. Every number is computed by the engine and re-checked by tests, logged in `docs/verification.md`.
