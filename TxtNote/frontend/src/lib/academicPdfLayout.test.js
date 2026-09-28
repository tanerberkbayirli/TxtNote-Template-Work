import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approximateWidth, boxesFromBlocks, paginateBoxes, toRoman, wrapText } from "./academicPdfLayout.js";
import { academicExportQaDoc } from "./academicQaDocument.js";
import { numberAcademicBlocks, parseAcademicHtml } from "./academicDocument.js";

describe("academicPdfLayout", () => {
  it("wraps long Turkish lines to the content width", () => {
    const text = "çğıöşü ".repeat(40);
    const lines = wrapText(text, 160, 12, (value, size) => approximateWidth(value, size), {});
    assert.ok(lines.length > 1);
    for (const line of lines) {
      assert.ok(approximateWidth(line, 12) <= 170);
    }
  });

  it("paginates a long article into at least five A4 pages", () => {
    const doc = academicExportQaDoc();
    const numbered = numberAcademicBlocks(parseAcademicHtml(doc.html));
    const boxes = boxesFromBlocks(numbered.blocks, (text, size, style) => approximateWidth(text, size, style));
    const pages = paginateBoxes(boxes);
    assert.ok(pages.length >= 5, `expected >=5 pages, got ${pages.length}`);
    assert.equal(toRoman(4), "iv");
  });
});
