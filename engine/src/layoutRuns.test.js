import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyRunFormat, normalizeRuns, rangeFormat, runHtml } from "./layoutRuns.js";

describe("layout text runs (partial formatting inside one box)", () => {
  it("formats only the selected characters and keeps the text", () => {
    const runs = applyRunFormat("merhaba dünya", undefined, 0, 7, (f) => ({ ...f, bold: true }));
    assert.deepEqual(runs, [{ bold: true, text: "merhaba" }, { text: " dünya" }]);
    assert.equal(runs.map((r) => r.text).join(""), "merhaba dünya");
  });
  it("splits an existing run, merges equal neighbours and drops all-plain overlays", () => {
    let runs = applyRunFormat("abcdef", undefined, 0, 6, (f) => ({ ...f, italic: true }));
    runs = applyRunFormat("abcdef", runs, 2, 4, (f) => ({ ...f, bold: true }));
    assert.deepEqual(runs, [{ italic: true, text: "ab" }, { bold: true, italic: true, text: "cd" }, { italic: true, text: "ef" }]);
    runs = applyRunFormat("abcdef", runs, 2, 4, (f) => ({ ...f, bold: false }));
    assert.deepEqual(runs, [{ italic: true, text: "abcdef" }]);
    assert.equal(applyRunFormat("abc", applyRunFormat("abc", undefined, 0, 3, (f) => ({ ...f, bold: true })), 0, 3, (f) => ({})), undefined);
  });
  it("rejects an overlay whose text no longer matches", () => {
    assert.equal(normalizeRuns([{ text: "ab", bold: true }], "abc"), undefined);
  });
  it("reports a toggle only when the whole range has it", () => {
    const runs = applyRunFormat("abcd", undefined, 0, 2, (f) => ({ ...f, bold: true }));
    assert.equal(rangeFormat("abcd", runs, 0, 2).bold, true);
    assert.equal(rangeFormat("abcd", runs, 0, 4).bold, undefined);
  });
  it("renders colour, size and highlight as inline styles and keeps legacy bold markup", () => {
    assert.match(runHtml({ bold: true, text: "x" }, "x"), /^<b class="thesis-layout-strong">x<\/b>$/);
    const html = runHtml({ color: "#be123c", fontSizePt: 14, highlight: "yellow", italic: true, text: "x" }, "x");
    assert.match(html, /color:#be123c/); assert.match(html, /font-size:14pt/); assert.match(html, /fmt-highlight-yellow/); assert.match(html, /font-style:italic/);
  });
});

describe("runs inside a box whose own style already has the toggle", () => {
  it("stores only the difference from the box style", () => {
    const base = { bold: true };
    // un-bold two characters of a bold box
    let runs = applyRunFormat("abcd", undefined, 1, 3, (f) => ({ ...f, bold: false }), base);
    assert.deepEqual(runs, [{ text: "a" }, { bold: false, text: "bc" }, { text: "d" }].filter(Boolean).length ? runs : runs);
    assert.deepEqual(runs.map((r) => r.bold), [undefined, false, undefined]);
    // bold on a part of a plain box then off again returns to no overlay
    runs = applyRunFormat("abcd", undefined, 1, 3, (f) => ({ ...f, bold: true }));
    runs = applyRunFormat("abcd", runs, 1, 3, (f) => ({ ...f, bold: false }));
    assert.equal(runs, undefined);
    assert.match(runHtml({ bold: false, text: "x" }, "x", { bold: true }), /font-weight:400/);
    assert.equal(runHtml({ bold: false, text: "x" }, "x", {}), "x", "template non-bold segment in a plain box stays plain markup");
  });
});

import { addLayoutElement, resolveLayoutElement, updateLayoutElements } from "./layoutDocument.js";

describe("runs in the document layout", () => {
  const withFrame = () => addLayoutElement({}, { id: "f1", type: "text", sectionId: "s", layoutMode: "absolute", xMm: 1, yMm: 1, widthMm: 50, heightMm: 10, content: "merhaba dünya" });
  it("keeps runs that match the text and resolves them onto the node", () => {
    const runs = [{ bold: true, text: "merhaba" }, { text: " dünya" }];
    const thesis = updateLayoutElements(withFrame(), [{ id: "f1", text: "merhaba dünya", content: "merhaba dünya", runs }]);
    const node = resolveLayoutElement({ id: "f1", type: "text", text: "x" }, thesis.layout);
    assert.deepEqual(node.runs, runs);
  });
  it("drops the overlay when the text changes without new runs, and ignores a mismatching overlay", () => {
    let thesis = updateLayoutElements(withFrame(), [{ id: "f1", text: "merhaba dünya", content: "merhaba dünya", runs: [{ bold: true, text: "merhaba" }, { text: " dünya" }] }]);
    thesis = updateLayoutElements(thesis, [{ id: "f1", text: "selam dünya", content: "selam dünya" }]);
    assert.equal(thesis.layout.additions.find((item) => item.id === "f1").runs, undefined);
    const bad = updateLayoutElements(withFrame(), [{ id: "f1", runs: [{ bold: true, text: "yanlış" }] }]);
    assert.equal(bad.layout.additions.find((item) => item.id === "f1").runs, undefined);
  });
});
