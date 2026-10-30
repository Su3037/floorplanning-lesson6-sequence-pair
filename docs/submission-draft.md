# Submission draft (NOT posted)

Draft reply for [yongfu-li/eda-learning#22](https://github.com/yongfu-li/eda-learning/issues/22). It has **not** been posted, and
the issue has not been closed; that waits for the author's explicit instruction. Fill in the links only after the deployment is verified.

---

Hi Prof. Li,

Lesson 6 (Sequence-Pair) is done as a standalone open-source lesson:

- Repository: https://github.com/Su3037/floorplanning-lesson6-sequence-pair
- Website: https://su3037.github.io/floorplanning-lesson6-sequence-pair/ (Chinese first; English edition at `/en/`)

What it contains: a lesson page; an interactive lab where you edit pos/neg and step through every relation, constraint edge and
longest-path maximum; four films (popular, concise, advanced, lab walkthrough) with Chinese and English captions; a 14-page deck
(PDF and editable PPTX with notes); 7 graded challenges and 6 concept checks; an in-browser Python code lab and a downloadable
Python pack. It uses your `common/pack.py` convention and the five-block example, and is credited under CC BY 4.0.
All numbers come from the engine and are tested: ABCED / DABCE gives a 9 × 4 packing with D at (0, 3); all 14,400 pairs are
overlap-free and 13,680 fit the 10 × 8 outline; the JS engine is cross-checked against an independent Python reference.

Note: `common/goldens.py`'s `GOLDEN_PACK` draws D at y = 2; that is a different illustration, not the packing of ABCED / DABCE, and the lesson says so.

Limitations: fixed block sizes (rotation only as a labelled extension); no search/annealing beyond neighbour moves; the popular
film's music is a third-party track used at the author's choice and is not covered by the repository's licences.

Thank you!
Su3037
