import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, cellPaddingCss } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { validateThesisTemplate } from "../thesis/validation.js";

const docXml = async (template, html) => {
  const blob = await buildThesisDocx(compileThesisDocument(template, {}, "T", html), {});
  return strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
};
const table = '<table><colgroup><col data-col-width="25"><col data-col-width="75"></colgroup><tbody><tr><td>a1</td><td>a2</td></tr></tbody></table>';

describe("tables.cellPadding and authored column widths", () => {
  it("cellPaddingCss: object in mm, missing edges 0, string passthrough, absent -> fallback", () => {
    assert.equal(cellPaddingCss({ topMm: 1, bottomMm: 2, leftMm: 3 }, "x"), "1mm 0mm 2mm 3mm");
    assert.equal(cellPaddingCss("0 1mm", "x"), "0 1mm");
    assert.equal(cellPaddingCss(undefined, "fb"), "fb");
  });
  it("DOCX: default tcMar unchanged (6 pt = 120 tw), cellPadding replaces it", async () => {
    const plain = await docXml(generic, table);
    assert.match(plain, /<w:tcMar>[\s\S]*?<w:top [^>]*w:w="120"/);
    const t = structuredClone(generic);
    t.tables.cellPadding = { topMm: 0, bottomMm: 0, leftMm: 1.905, rightMm: 1.905 };
    const xml = await docXml(t, table);
    assert.match(xml, /<w:tcMar>[\s\S]*?<w:top [^>]*w:w="0"[\s\S]*?<w:left [^>]*w:w="108"/);
  });
  it("DOCX: col widths become tblGrid/gridCol and tcW in the 25/75 ratio", async () => {
    const xml = await docXml(generic, table);
    const cols = [...xml.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => Number(m[1]));
    assert.equal(cols.length, 2, JSON.stringify(cols));
    assert.ok(Math.abs(cols[0] / (cols[0] + cols[1]) - 0.25) < 0.002, JSON.stringify(cols));
    const tcw = [...xml.matchAll(/<w:tcW [^>]*w:w="(\d+)"/g)].map((m) => Number(m[1]));
    assert.deepEqual(tcw, cols);
  });
  it("validation accepts cellPadding on tables only and rejects bad values", () => {
    const ok = structuredClone(generic); ok.tables.cellPadding = { topMm: 0, leftMm: 1.9 };
    assert.equal(validateThesisTemplate(ok).filter((e) => /cellPadding/.test(e)).length, 0);
    const bad = structuredClone(generic); bad.tables.cellPadding = { topMm: -1 };
    assert.ok(validateThesisTemplate(bad).some((e) => /cellPadding/.test(e)));
  });
});
