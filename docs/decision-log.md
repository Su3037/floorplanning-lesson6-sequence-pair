# Decision log

`D-AREA-n`: decision · reason · source · can it change?

## Scope
- **D-SCOPE-1** One standalone module (Sequence-Pair), not the floorplanning syllabus. · The issue assigns Lesson 6 only. · prompt §1 · No.
- **D-SCOPE-2** Public title "Module 06 · 序列对 Sequence-Pair"; upstream id `module02-05-sequence-pair` kept in metadata. · Course position ≠ hierarchical number. · prompt §3 · No.
- **D-SCOPE-3** Fixed dimensions; rotation offered in the lab as a labelled extension; soft sizing mentioned only. · Keeps the golden numbers stable. · prompt §4 · Yes.
- **D-SCOPE-4** Simulated annealing appears only as neighbour moves (lab "random neighbour", advanced film §VII). · prompt §1 · Yes.

## Structure and style
- **D-STYLE-1** Follow the Learning Clustering course playbook (`Su3037/learning-clustering/course-playbook`, merged Oct 2026): same site machinery, design tokens, page anatomy, four films, slides with notes below, graded challenges, in-browser code lab, bilingual. · The author asked for "the same style". · thread request · No.
- **D-STYLE-2** With a single module, the home page is the overview (outcomes, time, prerequisites, entry to the lab) and plays the popular film; there is no separate home intro film. · The intro film's job (the field's background) is done by the popular film's first minute here. · playbook §1 adapted · Yes.
- **D-STYLE-3** Visual identity: block geometry, permutation ribbons, H graph teal, V graph gold, chip grid. One fixed colour per block across lab, films and slides: A teal, B blue, C amber, D rose, E lilac. · prompt §6 · No.
- **D-STYLE-4** Captions without voice-over by default. · author's earlier preference, prompt §6 · Yes.

## Algorithm
- **D-ALG-1** Instructor's convention (lower-left origin, y up; before-in-pos-after-in-neg → below). · `common/pack.py` · No.
- **D-ALG-2** DP in pos order (a topological order of both graphs) in JS; Kahn's algorithm in Python, so the two are independent. · cross-check value · No.
- **D-ALG-3** Tie rule: among predecessors with equal bound, the one earliest in pos is reported as "chosen"; the coordinate is the same. · deterministic traces · No.
- **D-ALG-4** Constraint graphs keep implied (transitive) edges; drawings dim them. · The DP is defined over all pairs; O(n²). · No.
- **D-ALG-5** Input normalised once (`{W,H}` or `{w,h}`, conflict = error); validity, completeness, overlap and fit reported separately. · audit A2, A5 · No.

## Media
- **D-MEDIA-1** Popular film music: asked the author (decision card, 2026-10-30); working default We Never (Remix) as in the clustering course, applied only at render time, never committed. · playbook §5 vs prompt §6 caution · Yes, re-render one film.
- **D-MEDIA-2** Concise, advanced and walkthrough films use the course's own NumPy score (CC BY 4.0). · playbook · Yes.
