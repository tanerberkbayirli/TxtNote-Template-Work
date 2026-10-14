import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { importedContentCss, importedTableCss } from "../../../../engine/src/docx/projection.js";

const run = (id) => ({ id, type: "run", children: [{ type: "text", text: "x" }], properties: { resolvedSource: { fontFamily: "Times New Roman", fontSizePt: 12 }, direct: {} } });
const para = (id, resolvedSource = {}, extra = {}) => ({ id, type: "paragraph", children: [run(`${id}r`)], properties: { resolvedSource: { fontFamily: "Times New Roman", fontSizePt: 12, ...resolvedSource }, direct: {}, ...extra } });
const doc = (nodes) => ({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes, properties: { rules: { body: { fontFamily: "Times New Roman", fontSizePt: 12 } } } }] });
const rules = (css, id) => css.split("\n").filter((line) => line.includes(`"${id}"`));

describe("imported paragraph terminal leading (Word grants a last line only its own extra leading)", () => {
  it("guards a single-spaced paragraph by the full column allowance", () => {
    const css = importedContentCss(doc([para("single", { lineSpacing: { rule: "auto", value: 1 } })]));
    const [padding, after] = rules(css, "single").filter((line) => line.includes("--thesis-col-lead"));
    assert.match(padding, /padding-bottom:max\(0mm,calc\(var\(--thesis-col-lead,0mm\) - 0mm\)\) !important/);
    assert.match(padding, /:not\(\[data-thesis-fn-stamp="reserve"\]\)/);
    assert.match(after, /::after\{content:"";display:block;height:0;margin:0 0 calc\(-1 \* max\(0mm,calc\(var\(--thesis-col-lead,0mm\) - 0mm\)\)\);break-before:avoid\}/);
  });
  it("guards a 1.5-spaced paragraph by the column allowance minus its own (one half Times New Roman line)", () => {
    const css = importedContentCss(doc([para("one-half", { lineSpacing: { rule: "auto", value: 1.5 } })]));
    assert.match(rules(css, "one-half").join("\n"), /- 2\.4\d*mm\)\)/);
  });
  it("treats exact lines as no allowance and skips unknown fonts", () => {
    assert.match(rules(importedContentCss(doc([para("exact", { lineSpacing: { rule: "exact", value: 14 } })])), "exact").join("\n"), /- 0mm\)\)/);
    assert.ok(!importedContentCss(doc([para("mystery", { fontFamily: "Zapfino Imaginary", lineSpacing: { rule: "auto", value: 1.5 } })])).includes("--thesis-col-lead"));
  });
});

describe("imported table cell w:noWrap", () => {
  const cell = (xml) => ({ id: "c", type: "cell", children: [], properties: { cellPropertiesXml: xml, gridColumn: 0, gridSpan: 1 } });
  const table = (layout, noWrap) => ({ id: "t", type: "table", children: [{ type: "tableBody", children: [{ id: "r", type: "row", children: [cell(`<w:tcPr xmlns:w="w">${noWrap ? "<w:noWrap/>" : ""}</w:tcPr>`)] }] }], properties: { tablePropertiesXml: `<w:tblPr xmlns:w="w">${layout ? '<w:tblLayout w:type="fixed"/>' : ""}</w:tblPr>`, gridWidthsMm: [30] } });
  it("keeps the text of an autofit table cell on one line, also against the app's wrapping rule", () => {
    const css = importedTableCss(table(false, true)).join("\n");
    assert.match(css, /white-space:nowrap !important/);
    assert.match(css, /\[data-txt-node-id="c"\]\[data-txt-node-id\] p\{white-space:nowrap !important\}/);
  });
  it("ignores noWrap in a fixed-layout table (Word keeps the column widths and wraps)", () => {
    assert.ok(!importedTableCss(table(true, true)).join("\n").includes("nowrap"));
    assert.ok(!importedTableCss(table(false, false)).join("\n").includes("nowrap"));
  });
});

describe("imported list item first line starts at an explicit tab stop before the hanging indent", () => {
  const item = (tabStops) => {
    const paragraph = para("lp", { tabStops, lineSpacing: { rule: "auto", value: 1.5 } }, { list: { level: 0, start: 1, format: "bullet", text: "", suffix: "tab", run: { fontFamily: "Symbol" }, paragraph: { leftIndentMm: 12.7, hangingIndentMm: 6.35 } } });
    return { id: "li", type: "listItem", children: [paragraph], properties: {} };
  };
  const list = (tabStops) => ({ id: "ul", type: "list", children: [item(tabStops)], properties: { list: { paragraph: { leftIndentMm: 12.7, hangingIndentMm: 6.35 } } } });
  it("shifts the first line left to the stop and draws the marker at the hanging position", () => {
    const css = importedContentCss(doc([list([{ positionMm: 9.913, align: "left", leader: "none" }])]));
    assert.match(css, /\[data-txt-node-id="lp"\]\[data-txt-node-id\]\{[^}]*text-indent:-2\.787mm;position:relative/);
    assert.match(css, /\[data-txt-node-id="li"\]\[data-txt-node-id\]\{list-style:none\}/);
    assert.ok(css.includes('p[data-txt-node-id="lp"][data-txt-node-id]::before{content:"\\f0b7 ";position:absolute;left:-6.35mm'));
  });
  it("keeps the text edge without a stop between the marker and the indent", () => {
    const css = importedContentCss(doc([list([{ positionMm: 20, align: "left", leader: "none" }])]));
    assert.ok(!css.includes("list-style:none"));
    assert.ok(!css.includes('::before{content:"\\f0b7'));
  });
});

describe("imported paragraph that ends with a manual page break", () => {
  const withBreak = (id, children) => ({ id, type: "paragraph", tag: "p", children, properties: { resolvedSource: {}, direct: {} } });
  const brk = { id: "brk", type: "break", tag: "br", attributes: { "data-docx-break": "page" }, children: [] };
  const text = (value) => ({ id: `t-${value}`, type: "run", children: [{ type: "text", text: value }] });
  it("ends its page (a <br> is inline, so break-after on it never applied) without a :has() selector", () => {
    const css = importedContentCss(doc([withBreak("only", [{ id: "r", type: "run", children: [brk] }]), withBreak("after", [text("Text")])]));
    assert.match(css, /p\[data-txt-node-id="only"\]\[data-txt-node-id\]\{break-after:column\}/);
    assert.ok(!css.includes(":has("));
    assert.ok(!css.includes('p[data-txt-node-id="after"][data-txt-node-id]{break-after:column}'));
  });
  it("does not end the page when text follows the break inside the paragraph", () => {
    const css = importedContentCss(doc([withBreak("mixed", [{ id: "r", type: "run", children: [brk] }, text("tail")])]));
    assert.ok(!css.includes('p[data-txt-node-id="mixed"][data-txt-node-id]{break-after:column}'));
  });
});

describe("imported table cell paragraphs (measured in Word: a cell line gets no terminal leading, its space after must fit too)", () => {
  const cellOf = (id, children) => ({ id, type: "cell", children, properties: { gridColumn: 0, gridSpan: 1 } });
  const table = (cell) => ({ id: "tbl", type: "table", children: [{ type: "tableBody", children: [{ id: "row", type: "row", children: [cell] }] }], properties: { gridWidthsMm: [30] } });
  const cellPara = (id) => para(id, { lineSpacing: { rule: "auto", value: 1 }, spaceAfterPt: 6 });
  it("guards every paragraph of a long (4+ paragraph) cell with the whole column allowance plus its space after", () => {
    const css = importedContentCss(doc([table(cellOf("long", ["a", "b", "c", "d"].map(cellPara)))]));
    assert.match(rules(css, "d").join("\n"), /::after\{content:"";display:block;height:calc\(var\(--thesis-col-lead,0mm\) \+ 6pt\);margin:0 0 calc\(-1 \* calc\(var\(--thesis-col-lead,0mm\) \+ 6pt\)\);break-before:avoid;break-inside:avoid\}/);
  });
  it("leaves short cells to the cell-end guard (a result-table row that fits must not move)", () => {
    const css = importedContentCss(doc([table(cellOf("short", ["a", "b", "c"].map(cellPara)))]));
    assert.ok(!rules(css, "c").join("\n").includes("--thesis-col-lead"));
  });
  it("gives the single empty paragraph that ends a cell after a nested table no height (Word measurement)", () => {
    const inner = { id: "inner", type: "table", children: [{ type: "tableBody", children: [{ id: "irow", type: "row", children: [cellOf("icell", [cellPara("ip")])] }] }], properties: { gridWidthsMm: [20] } };
    const empty = { id: "tail", type: "paragraph", children: [], properties: { resolvedSource: {}, direct: {} } };
    const css = importedContentCss(doc([table(cellOf("outer", [cellPara("lead"), inner, empty]))]));
    assert.match(rules(css, "tail").join("\n"), /height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;line-height:0 !important/);
  });
});
