import test from "node:test";
import assert from "node:assert/strict";
import { hyphenBreakOffsets, fitWordLines } from "../thesis/wordLineFit.js";

// Task 7: Word may break a line after a hyphen that joins two letters or digits.
test("hyphen break offsets only join letters and digits", () => {
  const text = "damage-related 10-20 -5 a- b x-";
  const token = (from) => { const to = text.indexOf(" ", from) === -1 ? text.length : text.indexOf(" ", from); return hyphenBreakOffsets(text, from, to); };
  assert.deepEqual(token(0), [7]);
  assert.deepEqual(token(15), [18]);
  assert.deepEqual(token(21), []);
  assert.deepEqual(token(24), []);
  assert.deepEqual(token(27), []);
});

test("a hyphen piece starts the next line when it no longer fits and adds no justification gap", () => {
  const words = [
    { start: 0, end: 4, width: 40, space: 0 },
    { start: 5, end: 12, width: 60, space: 10 },
    { start: 12, end: 19, width: 50, space: 0 },
  ];
  const lines = fitWordLines(words, 115, 0);
  assert.deepEqual(lines.map((l) => [l.start, l.end]), [[0, 2], [2, 3]]);
});
