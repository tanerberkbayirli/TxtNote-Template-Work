import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FORMAT, formatClassName, mergeFormatClassName, parsePartialFormat } from "../config/format.js";

describe("persistent rich-text formatting classes", () => {
  it("round-trips highlight swatches alongside size, color and emphasis", () => {
    const classes = formatClassName({ ...DEFAULT_FORMAT, size: "pt14", color: "blue", highlight: "yellow", bold: true });
    assert.equal(parsePartialFormat(classes).highlight, "yellow");
    assert.equal(parsePartialFormat(classes).color, "blue");
    assert.equal(parsePartialFormat(classes).size, "pt14");
    assert.equal(parsePartialFormat(classes).bold, true);
  });

  it("clears only the previous highlight when the user chooses none", () => {
    const classes = mergeFormatClassName("fmt-size-heading fmt-color-red fmt-highlight-green fmt-bold", { highlight: "none" });
    assert.match(classes, /fmt-size-heading/);
    assert.match(classes, /fmt-color-red/);
    assert.match(classes, /fmt-bold/);
    assert.doesNotMatch(classes, /fmt-highlight-/);
  });
});
