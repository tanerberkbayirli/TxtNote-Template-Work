import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { drawingAnchorOffset, drawingPageIndex } from "../thesis/docx/drawingAnchors.js";

const page = { widthMm: 210, heightMm: 297, margins: { leftMm: 30, rightMm: 20, topMm: 25, bottomMm: 25 } };
const pt = (mm) => mm * 72 / 25.4;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);
describe("page and margin relative drawing anchors", () => {
  it("keeps a first line above the nominal text margin on its actual sheet", () => {
    assert.equal(drawingPageIndex(13*1150+90,1150),13);
    assert.equal(drawingPageIndex(12*1150+960,1150),12);
    assert.equal(drawingPageIndex(90,1150),0);
  });
  it("resolves a page offset independently of the paragraph's position on its sheet", () => {
    const shape = { widthPt: 100, heightPt: 40, horizontal: { relativeFrom: "page", offsetPt: 20 }, vertical: { relativeFrom: "page", offsetPt: 80 } };
    const first = drawingAnchorOffset(shape, page, { paragraphLeftPt: pt(30), paragraphTopPt: 200 });
    const later = drawingAnchorOffset(shape, page, { paragraphLeftPt: pt(30), paragraphTopPt: 600 });
    close(first.leftPt + pt(30), 20); close(first.topPt + 200, 80); close(later.topPt + 600, 80);
  });
  it("uses nominal Word margins for centered/bottom anchors and physical sheet parity for inside", () => {
    const shape = { widthPt: 100, heightPt: 40, horizontal: { relativeFrom: "margin", align: "inside" }, vertical: { relativeFrom: "margin", align: "bottom" } };
    const odd = drawingAnchorOffset(shape, { ...page, margins: { ...page.margins, topMm: 40 }, docxMargins: page.margins }, { paragraphLeftPt: 0, paragraphTopPt: 0 });
    const even = drawingAnchorOffset(shape, page, { paragraphLeftPt: 0, paragraphTopPt: 0, evenPage: true });
    close(odd.leftPt, pt(30)); close(even.leftPt, pt(190) - 100); close(odd.topPt, pt(272) - 40);
  });
  it("leaves paragraph/column offsets to the ordinary shape CSS", () => {
    assert.deepEqual(drawingAnchorOffset({ widthPt: 100, heightPt: 40, horizontal: { relativeFrom: "column", offsetPt: 15 }, vertical: { relativeFrom: "paragraph", offsetPt: 7 } }, page, { paragraphLeftPt: 0, paragraphTopPt: 0 }), { leftPt: undefined, topPt: undefined });
  });
});
