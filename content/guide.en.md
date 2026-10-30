<p class="eyebrow">How challenges work</p>

## How challenges work

The 7 challenges follow the same steps. They check whether you can compute a result from the rules and explain it, not whether you watched the film.

1. **Read the task**: each opens with `[category] title`, a level, and what it checks.
2. **Predict first**: write down your answer before acting. Many tasks target a tempting mistake, such as taking the minimum instead of the maximum.
3. **Act**: enter numbers, tick relations or edges, arrange letters. Step through the lab above whenever you want to check.
4. **Submit**: the verdict comes from the same sequence-pair engine as the lab, not a hand-typed answer table.
5. **Read the explanation**: a correct answer shows why; a wrong one names the rule it breaks, for example “A comes first in both pos and neg”.
6. **Try again**: hints come in two levels, a direction then a concrete relation. “Reset” clears the record for that task.

### How the record works

| Status | Meaning |
| --- | --- |
| Not started | never submitted |
| Trying | submitted but not yet correct |
| Solved | correct without viewing the answer |
| Solved after answer | correct after viewing the answer and explanation |

Viewing the answer costs nothing and locks nothing; the two kinds of completion are kept apart only so you know what you did yourself. The record lives in this browser (`localStorage`) and can be exported or imported on [My progress](../progress/index.html). If the browser blocks storage the page still works, it just forgets on close.

### Category and level are different things

The category says what a task is for: **trace** (compute one step by the rule), **debug** (find every problem), **build** (turn relations into edges), **implement** (matches the Python exercise), **constraint** (make an example that meets a condition), **compare** (are two encodings equivalent). The level is marked separately as Intro / Practice / Stretch.

### Two operations that need a word

- **Arranging letters** (c6, c7): each letter has ↑ ↓ buttons (or Tab to a button and press Enter) to change the order, then submit; the preview on the right always shows the packing of that pair. Every arrangement is checked for validity first.
- **Concept checks**: six single-choice questions below the challenges. The explanation appears at once; they do not count toward the challenge record.
