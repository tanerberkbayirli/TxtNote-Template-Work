import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { justifyWordSpacing } from "../../../../engine/src/engineCss.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import generic from "../../../../engine/src/templates/generic.js";

describe("Word justified-line fitting", () => {
  it("compresses justified known fonts by a fraction of their space width", () => {
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: "Times New Roman" }), /font-kerning:none;word-spacing:-0\.06250em;/);
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: '"Arial", sans-serif' }), /word-spacing:-0\.06112em;/);
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: "Calibri" }), /word-spacing:-0\.05652em;/);
  });
  it("leaves left-aligned, unknown-font and browser-mode text alone; resets non-justified styles inside a justified body", () => {
    assert.equal(justifyWordSpacing({ align: "left", fontFamily: "Times New Roman" }), "font-kerning:none;");
    assert.equal(justifyWordSpacing({ align: "justify", fontFamily: "Garamond" }), "");
    assert.equal(justifyWordSpacing({ align: "justify", fontFamily: "Times New Roman" }, "browser"), "");
    assert.equal(justifyWordSpacing({ align: "left", fontFamily: "Times New Roman" }, "word", true), "font-kerning:none;word-spacing:0;");
  });
  it("validates typography.justify", () => {
    assert.deepEqual(validateThesisTemplate({ ...generic, typography: { ...generic.typography, justify: "browser" } }), []);
    assert.ok(validateThesisTemplate({ ...generic, typography: { ...generic.typography, justify: "x" } }).some((e) => /justify/.test(e)));
  });
});

import { lastLineShifts } from "../../../../engine/src/justifyLastLine.js";
describe("Natural spacing on the last line of a justified paragraph", () => {
  const w = (start, top, lastTop = top) => ({ start, end: start + 3, top, lastTop });
  it("shifts the k-th word of the last line by k gaps and leaves other lines alone", () => {
    const shifts = lastLineShifts([w(0, 10), w(4, 10), w(8, 30), w(12, 30), w(16, 30)], 0.8);
    assert.deepEqual([...shifts.entries()].map(([i, v]) => [i, +v.toFixed(3)]), [[2, 0], [3, 0.8], [4, 1.6]]);
  });
  it("has no shifts for a one-word last line, a one-line paragraph without compression, or an empty block", () => {
    assert.equal(lastLineShifts([w(0, 10), w(4, 10), w(8, 30)], 0.8).size, 0);
    assert.equal(lastLineShifts([w(0, 10), w(4, 10)], 0).size, 0);
    assert.equal(lastLineShifts([], 0.8).size, 0);
  });
  it("restores the gap after the last-line suffix of a wrapped word", () => {
    const shifts = lastLineShifts([w(0, 10), { start: 4, end: 9, top: 10, lastTop: 30 }, w(10, 30)], 1);
    assert.deepEqual([...shifts.entries()], [[1, 0], [2, 1]]);
  });
  it("a one-line paragraph is shifted (Word draws a single-line paragraph with natural spaces)", () => {
    assert.deepEqual([...lastLineShifts([w(0, 10), w(4, 10), w(8, 10)], 1).values()], [0, 1, 2]);
  });
});
