// Every challenge must accept its official answer and reject plausible wrong answers.
// Answers are written in the same shape the page controls produce (choice → value or array, fields → object,
// combine → array of parts with null for headings, pairBuilder → { pos, neg }).
import test from 'node:test';
import assert from 'node:assert/strict';

const P = s => s.split('');
const CASES = {
  c1: { right: [null, 'left', null, 'below'], wrong: [[null, 'right', null, 'below'], [null, 'left', null, 'above'], [null, 'below', null, 'below']] },
  c2: { right: ['pos-repeat-E', 'pos-missing-D', 'neg-missing-E', 'length'], wrong: [['pos-repeat-E'], ['pos-repeat-E', 'pos-missing-D', 'neg-missing-E', 'length', 'neg-unknown']] },
  c3: { right: ['H:A→E', 'H:B→E', 'H:C→E', 'V:A→D', 'V:B→D', 'V:C→D', 'V:E→D'], wrong: [['H:B→E', 'H:C→E', 'V:A→D', 'V:B→D', 'V:C→D', 'V:E→D'], ['H:A→E', 'H:B→E', 'H:C→E', 'V:A→D', 'V:B→D', 'V:C→D', 'H:E→D']] },
  c4: { right: { xE: 7, yD: 3 }, wrong: [{ xE: 3, yD: 3 }, { xE: 9, yD: 3 }, { xE: 7, yD: 2 }, { xE: 7, yD: 4 }] },
  c5: { right: { xA: 0, yA: 0, xB: 4, yB: 1, xC: 0, yC: 2, xD: 3, yD: 0, xE: 2, yE: 2 }, wrong: [{ xA: 0, yA: 0, xB: 4, yB: 0, xC: 0, yC: 2, xD: 3, yD: 0, xE: 2, yE: 2 }] },
  c6: { right: [{ pos: P('ABCDE'), neg: P('ABCDE') }, null, 'x'], wrong: [[{ pos: P('ABCDE'), neg: P('ABCDE') }, null, 'y'], [{ pos: P('ABCED'), neg: P('DABCE') }, null, 'x'], [{ pos: P('ABCEE'), neg: P('DABCE') }, null, 'x']] },
  c7: { right: { pos: P('ABCDE'), neg: P('DABCE') }, wrong: [{ pos: P('ABCED'), neg: P('DABCE') }, { pos: P('ABCED'), neg: P('ADBCE') }] }
};
const MORE_RIGHT = { c6: [[{ pos: P('ABCDE'), neg: P('EDCBA') }, null, 'y']], c7: [{ pos: P('ABDCE'), neg: P('DABCE') }] };

test('every challenge accepts its answer and rejects wrong ones with a message', async () => {
  const { challenges } = await import('../site/modules/m06-sequence-pair/challenges.js');
  assert.deepEqual(challenges.map(c => c.id), Object.keys(CASES), 'test covers every challenge, in order');
  for (const c of challenges) {
    for (const right of [CASES[c.id].right, ...(MORE_RIGHT[c.id] || [])]) {
      const ok = c.check(right);
      assert.equal(ok.ok, true, `${c.id} should accept ${JSON.stringify(right)}: ${ok.message}`);
    }
    for (const wrong of CASES[c.id].wrong) {
      const no = c.check(wrong);
      assert.equal(no.ok, false, `${c.id} should reject ${JSON.stringify(wrong)}`);
      assert.ok(no.message && no.message.length > 8, `${c.id}: a rejection explains itself`);
    }
    assert.equal(c.hints.length, 2, `${c.id}: two hints`);
    assert.ok(typeof c.answer === 'string' && c.answer.length > 3, `${c.id}: the answer is text`);
  }
});

test('c5 answer text matches the engine (no hand-typed coordinates)', async () => {
  const { challenges } = await import('../site/modules/m06-sequence-pair/challenges.js');
  assert.equal(challenges.find(c => c.id === 'c5').answer, 'A(0, 0) B(4, 1) C(0, 2) D(3, 0) E(2, 2)');
});
