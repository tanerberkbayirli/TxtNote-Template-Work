import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatListNumber, importedContentCss, importedHeadingNumberRules } from "../../../../engine/src/docx/projection.js";

const heading = (id, tag, list, extra = {}) => ({ id, type: "paragraph", tag, children: [], properties: { direct: {}, resolvedSource: {}, list, ...extra } });
const item = (id, numId, level, ordinal, children) => ({ id, type: "listItem", tag: "li", children, properties: { numId, level, ordinal } });
const ol = (id, children) => ({ id, type: "list", tag: "ol", children, properties: {} });
const def = (level, text, extra = {}) => ({ level, start: 1, format: "decimal", text, suffix: "tab", paragraph: { leftIndentMm: 10, hangingIndentMm: 10 }, run: {}, ...extra });
const doc = (nodes) => ({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes, properties: { rules: { body: { fontFamily: "Times New Roman", fontSizePt: 12 } } } }] });

describe("imported Word heading numbers", () => {
  it("formats counters per numFmt", () => {
    assert.equal(formatListNumber(4, "upperRoman"), "IV");
    assert.equal(formatListNumber(3, "lowerLetter"), "c");
    assert.equal(formatListNumber(27, "upperLetter"), "AA");
    assert.equal(formatListNumber(5, "decimalZero"), "05");
    assert.equal(formatListNumber(7, undefined), "7");
  });
  it("numbers nested headings from lvlText with level counters", () => {
    const nodes = [
      ol("o1", [item("i1", "5", 0, 3, [heading("h1", "h1", def(0, "%1."))])]),
      ol("o2", [item("i2", "5", 1, 1, [heading("h2", "h2", def(1, "%1.%2."))]), item("i3", "5", 1, 2, [heading("h3", "h2", def(1, "%1.%2.", { suffix: "space" }))])]),
    ];
    const css = importedHeadingNumberRules(doc(nodes)).join("\n");
    assert.match(css, /\[data-txt-node-id="i1"\]\[data-txt-node-id\]\{list-style:none\}/);
    assert.match(css, /h1\[data-txt-node-id="h1"\][^{]*::before\{content:"3\.";display:inline-block;min-width:10mm;margin-left:-10mm/);
    assert.match(css, /h2\[data-txt-node-id="h2"\][^{]*::before\{content:"3\.1\."/);
    assert.match(css, /h2\[data-txt-node-id="h3"\][^{]*::before\{content:"3\.2\. ";\}?/);
    assert.ok(importedContentCss(doc(nodes)).includes('content:"3.2. "'));
  });
  it("leaves plain list items, bullets, empty text and hidden numbers alone", () => {
    const plain = { id: "p1", type: "paragraph", tag: "p", children: [], properties: { list: def(0, "%1.") } };
    const rules = importedHeadingNumberRules(doc([ol("o", [
      item("a", "1", 0, 1, [plain]),
      item("b", "1", 0, 2, [heading("hb", "h2", def(0, "%1.", { run: { hidden: true } }))]),
      item("c", "1", 0, 3, [heading("hc", "h2", def(0, ""))]),
      item("d", "1", 0, 4, [heading("hd", "h2", def(0, "\u2022", { format: "bullet" }))]),
    ])])).join("\n");
    assert.doesNotMatch(rules, /"a"/);
    assert.doesNotMatch(rules, /::before/);
    assert.match(rules, /"b"/);
  });
});
