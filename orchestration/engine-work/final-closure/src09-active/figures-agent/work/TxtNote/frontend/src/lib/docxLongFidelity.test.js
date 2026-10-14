import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { importedContentCss, importedTableCss } from "../thesis/docx/projection.js";
import { importedShapeCss, readDrawingShape } from "../thesis/docx/shapes.js";
import { readPictureAttributes } from "../thesis/docx/images.js";

// Long-document fidelity against the real Word render of SRC09 / SRC10 (see orchestration/engine-work/final-closure/long/verify_pages.py).
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const parse = (xml) => new DOMParser().parseFromString(`<w:r ${NS}>${xml}</w:r>`, "text/xml").documentElement.getElementsByTagName("*")[0];
const body = { fontFamily: "Times New Roman", fontSizePt: 12, lineSpacing: { rule: "auto", value: 1.5 } };
const run = (id, fontSizePt) => ({ id, type: "run", children: [{ type: "text", text: "x" }], properties: { resolvedSource: { fontSizePt, fontFamily: "Times New Roman" }, direct: {} } });
const para = (id, children, resolvedSource = {}, extra = {}) => ({ id, type: "paragraph", children, properties: { resolvedSource, direct: {}, ...extra } });
const picture = (id, attributes) => ({ id, type: "image", tag: "img", attributes, children: [] });
const doc = (sections) => ({ source: { format: "docx" }, formatMode: "source", sections: sections.map(({ nodes, breakType }) => ({ nodes, properties: { breakType, rules: { body } } })) });
const rule = (css, id) => [...css.matchAll(new RegExp(`"${id}"\\]\\[data-txt-node-id\\]\\{([^}]*)\\}`, "g"))].map((m) => m[1]).join(";");

describe("long imported documents: pagination geometry measured against Word", () => {
  it("takes the previous section's space after off the first paragraph of a section that starts a new page", () => {
    const last = para("last", [run("lr", 12)], { spaceAfterPt: 6, spaceBeforePt: 6, lineSpacing: { rule: "auto", value: 1.5 } });
    const heading = para("h", [run("hr", 13)], { spaceBeforePt: 72, spaceAfterPt: 18, lineSpacing: { rule: "auto", value: 1.5 } });
    const css = importedContentCss(doc([{ nodes: [last] }, { nodes: [heading], breakType: "oddPage" }]));
    assert.match(rule(css, "h"), /margin-top:66pt/);
    assert.ok(!/margin-top:66pt/.test(rule(importedContentCss(doc([{ nodes: [last] }, { nodes: [heading], breakType: "continuous" }])), "h")), "a continuous section keeps the paragraph's own space");
  });

  it("gives a picture-only paragraph Word's extra line leading and its effectExtent room", () => {
    const style = { lineSpacing: { rule: "auto", value: 1.5 }, spaceBeforePt: 6, spaceAfterPt: 6 };
    const inline = para("p", [picture("i", { width: "540", height: "303", "data-img-effect": "1.5,1.5,1.1,1.8" })], style);
    const decl = rule(importedContentCss(doc([{ nodes: [inline] }])), "p");
    assert.match(decl, /padding-top:1\.5pt/);
    assert.match(decl, /padding-bottom:8\.7pt/); // 1.8 pt effect + 6.9 pt (1.5 lines of a 12 pt Times New Roman line = 0.5 x 13.8 pt)
    const floating = para("f", [picture("i2", { width: "540", height: "303", "data-img-wrap": "square" })], style);
    assert.ok(!/padding-bottom/.test(rule(importedContentCss(doc([{ nodes: [floating] }])), "f")), "a floating picture adds nothing to its line");
    const withText = para("t", [picture("i3", { width: "10", height: "10" }), run("tr", 12)], style);
    assert.ok(!/padding-bottom/.test(rule(importedContentCss(doc([{ nodes: [withText] }])), "t")), "a line that also holds text keeps its own height");
  });

  it("draws an inline picture at its declared extent, not at the bitmap's pixel aspect", () => {
    const css = importedContentCss(doc([{ nodes: [para("p", [picture("img1", { width: "540.53", height: "303.6" })])] }]));
    assert.match(rule(css, "img1"), /aspect-ratio:540\.53 \/ 303\.6;object-fit:fill/);
    const cropped = importedContentCss(doc([{ nodes: [para("p", [picture("img2", { width: "540", height: "300", "data-img-crop": "0,0,1000,0" })])] }]));
    assert.equal(rule(cropped, "img2"), "");
  });

  it("reads wp:effectExtent of inline pictures only", () => {
    const inline = parse(`<w:drawing><wp:inline><wp:extent cx="5148580" cy="2891790"/><wp:effectExtent l="19050" t="19050" r="13970" b="22860"/><wp:docPr id="1" name="x"/></wp:inline></w:drawing>`);
    assert.equal(readPictureAttributes(inline, null)["data-img-effect"], "1.5,1.5,1.1,1.8");
    const anchor = parse(`<w:drawing><wp:anchor><wp:extent cx="5148580" cy="2891790"/><wp:effectExtent l="19050" t="19050" r="13970" b="22860"/><wp:docPr id="1" name="x"/></wp:anchor></w:drawing>`);
    assert.equal(readPictureAttributes(anchor, null)["data-img-effect"], undefined);
  });

  it("uses a heading's 13 pt run size for its strut when every run has it", () => {
    const heading = para("h", [run("r1", 13), run("r2", 13)], { lineSpacing: { rule: "auto", value: 1.5 } });
    assert.match(rule(importedContentCss(doc([{ nodes: [heading] }])), "h"), /font-size:13pt/);
    const mixed = para("m", [run("r3", 13), run("r4", 16)], { lineSpacing: { rule: "auto", value: 1.5 } });
    assert.ok(!/font-size:1[36]pt/.test(rule(importedContentCss(doc([{ nodes: [mixed] }])), "m")), "mixed sizes keep the template strut");
  });

  it("drops the UA list padding of numbered headings whose level has no indent (w:ind left=0)", () => {
    const heading = { ...para("hp", [run("hr", 13)], { lineSpacing: { rule: "auto", value: 1.5 } }, { list: { paragraph: { leftIndentMm: 0, hangingIndentMm: 0 } } }), tag: "h2" };
    const css = importedContentCss(doc([{ nodes: [{ id: "L", type: "list", children: [{ id: "li", type: "listItem", children: [heading], properties: {} }] }] }]));
    assert.match(rule(css, "L"), /padding-left:0mm;margin-left:0/);
  });

  it("keeps the paragraph chain of the body out of text boxes (contextual spacing across anchor paragraphs)", () => {
    const lp = (id, children = []) => para(id, children, { contextualSpacing: true, spaceBeforePt: 6, spaceAfterPt: 6 }, { styleId: "ListeParagraf" });
    const box = { id: "d", type: "drawing", children: [{ id: "inner", type: "paragraph", children: [], properties: { resolvedSource: {}, styleId: "Normal" } }], properties: {} };
    const css = importedContentCss(doc([{ nodes: [lp("a", [box]), lp("b")] }]));
    assert.match(rule(css, "a"), /margin-bottom:0/);
    assert.match(rule(css, "b"), /margin-top:0/);
  });

  it("compensates the browser's rounding of a 0.5 pt table border to a whole CSS px (0.75 pt) on the cell's last paragraph", () => {
    const b = 'w:val="single" w:sz="4" w:space="0" w:color="auto"';
    const cellParagraph = para("cp", [run("cr", 11)], { spaceAfterPt: 6, spaceBeforePt: 6 });
    const cell = { id: "c", type: "cell", children: [cellParagraph], properties: { gridColumn: 0, gridSpan: 1, cellPropertiesXml: `<w:tcPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tcBorders><w:top ${b}/><w:left ${b}/><w:bottom ${b}/><w:right ${b}/></w:tcBorders></w:tcPr>` } };
    const table = { id: "t", type: "table", properties: { gridWidthsMm: [50], tablePropertiesXml: '<w:tblPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>' }, children: [{ type: "tableBody", children: [{ id: "r", type: "row", properties: {}, children: [cell] }] }] };
    assert.ok(importedTableCss(table).some((r) => /"cp"\]\[data-txt-node-id\]\{margin-bottom:5\.75pt !important\}/.test(r)));
  });

  it("keeps an imported table at its own width against the app's 100 % table rule", () => {
    const table = { id: "t", type: "table", properties: { gridWidthsMm: [40, 30], tablePropertiesXml: '<w:tblPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tblW w:w="3969" w:type="dxa"/></w:tblPr>' }, children: [] };
    assert.ok(importedTableCss(table).some((r) => /\{width:70mm !important/.test(r)));
  });
});

describe("long imported documents: floating drawings", () => {
  const anchor = `<w:drawing><wp:anchor behindDoc="0"><wp:positionH relativeFrom="column"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>234950</wp:posOffset></wp:positionV><wp:extent cx="748030" cy="1404620"/><wp:wrapNone/></wp:anchor></w:drawing>`;
  const page = { widthMm: 210, heightMm: 297, margins: { leftMm: 40, rightMm: 25, topMm: 25, bottomMm: 25 } };
  const make = (inner) => ({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes: [para("p", [{ id: "r", type: "run", children: inner, properties: { resolvedSource: { fontSizePt: 12 } } }], { lineSpacing: { rule: "auto", value: 1.5 }, spaceAfterPt: 6 })], properties: { rules: { body, page } } }] });

  it("counts the unreadable visible fallback of a floating shape as no in-flow content, so the paragraph keeps its one line", () => {
    const floating = { id: "d", type: "drawing", children: [], properties: { shape: readDrawingShape(parse(anchor)) } };
    const fallback = { id: "d2", type: "drawing", children: [], properties: {} };
    const css = importedShapeCss(make([floating, fallback])).join("\n");
    assert.match(css, /\[data-txt-node-id="p"\]::before\{content:"\\200b"\}/);
  });
});
