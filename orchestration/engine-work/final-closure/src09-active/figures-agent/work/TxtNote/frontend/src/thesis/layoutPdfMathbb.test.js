import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipPageRect, doubleStruckMathText } from "./layoutPdf.js";

describe("mathbb PDF character mapping", () => {
  it("maps KaTeX's ordinary text letters to Unicode double-struck characters", () => {
    assert.equal(doubleStruckMathText("R"), "ℝ");
    assert.equal(doubleStruckMathText("CHNPQZ"), "ℂℍℕℙℚℤ");
    assert.equal(doubleStruckMathText("ahz"), "𝕒ℎ𝕫");
    assert.equal(doubleStruckMathText("012"), "𝟘𝟙𝟚");
    assert.equal(doubleStruckMathText("R+"), "ℝ+");
  });
});

describe("paged PDF highlight clipping", () => {
  it("clips a text highlight rectangle to the physical page bounds", () => {
    assert.deepEqual(clipPageRect({ x: 4, top: 90, width: 20, height: 20 }, 100, 800), { x: 4, top: 100, width: 20, height: 10 });
    assert.equal(clipPageRect({ x: 4, top: 10, width: 20, height: 5 }, 100, 800), null);
  });
});
