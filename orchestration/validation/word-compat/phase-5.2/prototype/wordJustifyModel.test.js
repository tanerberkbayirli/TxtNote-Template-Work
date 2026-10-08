import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { wordJustifyFitBudget, wordJustifyLineFits, wordJustifyLines } from './wordJustifyModel.js';

describe('experimental Word line-local fit model', () => {
  it('keeps a nonbreaking sequence together even when it overflows', () => {
    const lines = wordJustifyLines([{ width: 20 }, { width: 15 }, { width: 10 }], {
      availableWidth: 30, spaceWidth: 5, breakBefore: [false, false, true],
    });
    assert.deepEqual(lines.map(({ start, end, overflow }) => ({ start, end, overflow })), [
      { start: 0, end: 2, overflow: true }, { start: 2, end: 3, overflow: false },
    ]);
  });
  it('honors hard breaks without dropping the first token of the next line', () => {
    const lines = wordJustifyLines([{ width: 10 }, { width: 10 }, { width: 10 }], {
      availableWidth: 30, spaceWidth: 5, breakBefore: [false, true, true], hardBreakBefore: [false, false, true],
    });
    assert.deepEqual(lines.map(({ start, end, hardBreakAfter }) => ({ start, end, hardBreakAfter })), [
      { start: 0, end: 2, hardBreakAfter: true }, { start: 2, end: 3, hardBreakAfter: false },
    ]);
  });
});
