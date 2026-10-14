import test from "node:test";
import assert from "node:assert/strict";
import { importedContentCss } from "../../../../engine/src/docx/projection.js";

// Task 7: imported Word paragraphs flow like Word (empty lines, hidden marks, contextual spacing, hanging indents).
const doc = (nodes, formatMode = "source") => ({ formatMode, source: { format: "docx" }, sections: [{ properties: { rules: { body: {} } }, nodes }] });
const para = (id, properties = {}, children = []) => ({ id, type: "paragraph", tag: "p", properties, children });

test("an empty imported paragraph keeps a line through a zero-width strut", () => {
  const text = (value) => ({ type: "text", text: value });
  const withText = para("full", {}, [{ id: "r", type: "run", children: [{ id: "tr", type: "textRun", children: [text("Metin")] }] }]);
  const blank = para("blank", {}, [{ id: "b", type: "bookmark", children: [] }, { id: "r2", type: "run", children: [{ id: "tr2", type: "textRun", children: [text("  ")] }] }]);
  const tabbed = para("tab", {}, [{ id: "t", type: "tab", children: [] }]);
  const css = importedContentCss(doc([withText, blank, tabbed, para("none")]));
  assert.ok(css.includes('.thesis-body p[data-txt-node-id="blank"]::before,.thesis-body p[data-txt-node-id="none"]::before{content:"\\200b"}'));
  assert.ok(!css.includes('"full"]::before'));
  assert.ok(!css.includes('"tab"]::before'));
  assert.ok(!css.includes(":has("));
});

test("a paragraph with a hidden mark and only anchors vanishes with its spacing", () => {
  const hidden = para("h1", { paragraphMarkRun: { hidden: true }, resolvedSource: { spaceBeforePt: 72 } }, [{ id: "b1", type: "bookmark", children: [] }]);
  const shown = para("s1", { paragraphMarkRun: { hidden: true } }, [{ id: "t1", type: "textRun", children: [] }]);
  const css = importedContentCss(doc([hidden, shown]));
  assert.match(css, /\[data-txt-node-id="h1"\]\[data-txt-node-id\]\[data-docx-style\]\{display:none !important\}/);
  assert.doesNotMatch(css, /"h1"\]\[data-txt-node-id\]\{[^}]*margin-top/);
  assert.doesNotMatch(css, /"s1"\]\[data-txt-node-id\]\[data-docx-style\]\{display:none/);
});

test("contextual spacing removes the gap between neighbours of one style only", () => {
  const style = (styleId, contextualSpacing) => ({ styleId, resolvedSource: contextualSpacing ? { contextualSpacing: true } : {} });
  const css = importedContentCss(doc([para("a", style("L", true)), para("b", style("L", true)), para("c", style("L", true)), para("d", style("N", false)), para("e", style("L", true))]));
  assert.match(css, /"a"\]\[data-txt-node-id\]\{margin-bottom:0;\}/);
  assert.match(css, /"b"\]\[data-txt-node-id\]\{margin-top:0;margin-bottom:0;\}/);
  assert.match(css, /"c"\]\[data-txt-node-id\]\{margin-top:0;\}/);
  assert.doesNotMatch(css, /"d"\]\[data-txt-node-id\]\{margin/);
  assert.doesNotMatch(css, /"e"\]\[data-txt-node-id\]\{margin/);
});

test("a table breaks the contextual chain", () => {
  const style = { styleId: "L", resolvedSource: { contextualSpacing: true } };
  const table = { id: "t", type: "table", tag: "table", properties: {}, children: [] };
  const css = importedContentCss(doc([para("a", style), table, para("b", style)]));
  assert.doesNotMatch(css, /"[ab]"\]\[data-txt-node-id\]\{margin/);
});

test("a hanging indent keeps the left indent as the body edge", () => {
  const css = importedContentCss(doc([para("r", { resolvedSource: { leftIndentMm: 8, hangingIndentMm: 8 } })]));
  assert.match(css, /"r"\]\[data-txt-node-id\]\{[^}]*margin-left:8mm/);
  assert.match(css, /"r"\]\[data-txt-node-id\]\{[^}]*text-indent:-8mm/);
  assert.doesNotMatch(css, /margin-left:16mm/);
});

test("a list level keeps the Word text edge: marker column on the list, text edge on the paragraph", () => {
  const level = { leftIndentMm: 12.7, hangingIndentMm: 6.35 };
  const nested = { leftIndentMm: 25.4, hangingIndentMm: 6.35 };
  const item = (id, pid, lvl, children = []) => ({ id, type: "listItem", children: [{ id: pid, type: "paragraph", properties: { resolvedSource: { leftIndentMm: lvl.leftIndentMm }, list: { paragraph: lvl } }, children: [] }, ...children] });
  const inner = { id: "ul2", type: "list", children: [item("li2", "p2", nested)] };
  const css = importedContentCss(doc([{ id: "ul1", type: "list", children: [item("li1", "p1", level, [inner])] }]));
  assert.match(css, /"ul1"\]\[data-txt-node-id\]\{padding-left:6\.35mm;margin-left:0\}/);
  assert.match(css, /"p1"\]\[data-txt-node-id\]\{margin-left:6\.35mm;text-indent:0\}/);
  // The nested list continues from the outer item edge (6.35 mm), so its marker column is 19.05 - 6.35 mm in.
  assert.match(css, /"ul2"\]\[data-txt-node-id\]\{padding-left:12\.7mm;margin-left:0\}/);
  assert.match(css, /"p2"\]\[data-txt-node-id\]\{margin-left:6\.35mm;text-indent:0\}/);
});

test("lists without a real indent are left to the default list layout", () => {
  const css = importedContentCss(doc([{ id: "ul", type: "list", children: [{ id: "li", type: "listItem", children: [{ id: "p", type: "paragraph", properties: { list: { paragraph: { leftIndentMm: 0, firstLineIndentMm: 0 } } }, children: [] }] }] }]));
  assert.doesNotMatch(css, /"ul"\]\[data-txt-node-id\]\{padding-left/);
});

test("a Symbol bullet makes the item's first line as tall as Word does (21.55 pt vs 20.70 pt at 1.5 lines)", () => {
  const body = { fontFamily: "Times New Roman", fontSizePt: 12 };
  const item = (run) => ({ id: "ul", type: "list", children: [{ id: "li", type: "listItem", children: [{ id: "p", type: "paragraph", properties: { resolvedSource: { leftIndentMm: 12.7, lineSpacing: { rule: "auto", value: 1.5 } }, list: { run, paragraph: { leftIndentMm: 12.7, hangingIndentMm: 6.35 } } }, children: [] }] }] });
  const withBody = (list) => ({ formatMode: "source", source: { format: "docx" }, sections: [{ properties: { rules: { body } }, nodes: [list] }] });
  assert.match(importedContentCss(withBody(item({ fontFamily: "Symbol" }))), /"p"\]\[data-txt-node-id\]\{margin-left:6\.35mm;text-indent:0;padding-top:0\.85pt\}/);
  assert.doesNotMatch(importedContentCss(withBody(item({ fontFamily: "Times New Roman" }))), /padding-top/);
});

test("a list item holding only a vanishing paragraph vanishes with it", () => {
  const hidden = (id) => ({ id, type: "paragraph", properties: { paragraphMarkRun: { hidden: true } }, children: [{ id: `${id}b`, type: "bookmark", children: [] }] });
  const css = importedContentCss(doc([{ id: "ol", type: "list", children: [{ id: "li", type: "listItem", children: [hidden("h")] }] }, { id: "ol2", type: "list", children: [{ id: "li2", type: "listItem", children: [hidden("h2"), { id: "p", type: "paragraph", properties: {}, children: [{ id: "t", type: "textRun", children: [] }] }] }] }]));
  assert.match(css, /"ol"\]\[data-txt-node-id\]\{display:none !important\}/);
  assert.doesNotMatch(css, /"li2?"\]\[data-txt-node-id\]\{display:none/);
  assert.match(css, /"h2"\]\[data-txt-node-id\]\[data-docx-style\]\{display:none !important\}/);
});
