import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { doubleStruckMathText } from "./layoutPdf.js";

describe("mathbb PDF character mapping", () => {
  it("maps KaTeX's ordinary text letters to Unicode double-struck characters", () => {
    assert.equal(doubleStruckMathText("R"), "ℝ");
    assert.equal(doubleStruckMathText("CHNPQZ"), "ℂℍℕℙℚℤ");
    assert.equal(doubleStruckMathText("ahz"), "𝕒ℎ𝕫");
    assert.equal(doubleStruckMathText("012"), "𝟘𝟙𝟚");
    assert.equal(doubleStruckMathText("R+"), "ℝ+");
  });
});
