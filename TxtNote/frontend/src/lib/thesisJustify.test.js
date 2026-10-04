import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { justifyWordSpacing } from "../thesis/engineCss.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import generic from "../thesis/templates/generic.js";

describe("Word justified-line fitting", () => {
  it("compresses justified known fonts by a fraction of their space width", () => {
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: "Times New Roman" }), /font-kerning:none;word-spacing:-0\.06250em;/);
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: '"Arial", sans-serif' }), /word-spacing:-0\.06112em;/);
    assert.match(justifyWordSpacing({ align: "justify", fontFamily: "Calibri" }), /word-spacing:-0\.05652em;/);
  });
  it("leaves left-aligned, unknown-font and browser-mode text alone; resets non-justified styles inside a justified body", () => {
    assert.equal(justifyWordSpacing({ align: "left", fontFamily: "Times New Roman" }), "");
    assert.equal(justifyWordSpacing({ align: "justify", fontFamily: "Garamond" }), "");
    assert.equal(justifyWordSpacing({ align: "justify", fontFamily: "Times New Roman" }, "browser"), "");
    assert.equal(justifyWordSpacing({ align: "left", fontFamily: "Times New Roman" }, "word", true), "word-spacing:0;");
  });
  it("validates typography.justify", () => {
    assert.deepEqual(validateThesisTemplate({ ...generic, typography: { ...generic.typography, justify: "browser" } }), []);
    assert.ok(validateThesisTemplate({ ...generic, typography: { ...generic.typography, justify: "x" } }).some((e) => /justify/.test(e)));
  });
});
