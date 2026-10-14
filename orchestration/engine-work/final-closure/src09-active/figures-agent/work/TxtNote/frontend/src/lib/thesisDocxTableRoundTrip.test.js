import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { importThesisDocx } from "../thesis/importDocx.js";
import { contentNodesToHtml } from "../thesis/contentModel.js";
import { docxImportFixture } from "./fixtures/docxImportFixture.js";

const tc = (text, pr = "") => `<w:tc><w:tcPr>${pr}</w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const tr = (cells, pr = "") => `<w:tr><w:trPr>${pr}</w:trPr>${cells}</w:tr>`;
const body = `<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="3000"/><w:gridCol w:w="4000"/></w:tblGrid>`
  + tr(tc("A", '<w:gridSpan w:val="2"/>') + tc("B"), "<w:tblHeader/>")
  + tr(tc("C", '<w:vMerge w:val="restart"/>') + tc("D") + tc("E"), "<w:cantSplit/>")
  + tr(tc("", "<w:vMerge/>") + tc("F") + tc("G"))
  + `</w:tbl><w:p><w:r><w:t>Sonra</w:t></w:r></w:p>`;

const roundTrip = async () => {
  const imported = await importThesisDocx(docxImportFixture({ body }));
  const html = contentNodesToHtml(imported.sections[0].nodes, { stampIds: false });
  const blob = await buildThesisDocx(compileThesisDocument(generic, {}, "T", html), {});
  return strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
};

describe("imported Word table -> DOCX keeps content, merges, widths and row flags", () => {
  it("keeps a list inside a cell alongside a nested table", async () => {
    const html = '<table><tr><td><p>Önce</p><ul><li>İç liste</li></ul><table><tr><td>İç tablo</td></tr></table></td></tr></table>';
    const blob = await buildThesisDocx(compileThesisDocument(generic, {}, "T", html), {});
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    assert.equal((xml.match(/<w:tbl>/g) || []).length, 2);
    assert.equal((xml.match(/>İç liste</g) || []).length, 1);
    assert.equal((xml.match(/>İç tablo</g) || []).length, 1);
    assert.match(xml, /<w:numPr>/);
  });
  it("keeps nested tables between the cell paragraphs without flattening or duplicating text", async () => {
    const nested = `<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="1000"/></w:tblGrid>${tr(tc("İç hücre"))}</w:tbl>`;
    const outer = `<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="5000"/></w:tblGrid><w:tr><w:tc><w:tcPr/><w:p><w:r><w:t>Önce</w:t></w:r></w:p>${nested}<w:p><w:r><w:t>Sonra</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>Tablo dışı</w:t></w:r></w:p>`;
    const imported = await importThesisDocx(docxImportFixture({ body: outer }));
    const html = contentNodesToHtml(imported.sections[0].nodes, { stampIds: false });
    const blob = await buildThesisDocx(compileThesisDocument(generic, {}, "T", html), {});
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    assert.equal((xml.match(/<w:tbl>/g) || []).length, 2);
    for (const text of ["Önce", "İç hücre", "Sonra", "Tablo dışı"]) assert.equal((xml.match(new RegExp(`>${text}<`, "g")) || []).length, 1, text);
    assert.match(xml, /Önce[\s\S]*<w:tbl>[\s\S]*İç hücre[\s\S]*<\/w:tbl>[\s\S]*Sonra[\s\S]*<\/w:tbl>[\s\S]*Tablo dışı/);
    const tablesXml = xml.slice(xml.indexOf("<w:tbl>"), xml.lastIndexOf("</w:tbl>") + 8);
    assert.doesNotMatch(tablesXml, /<w:keepNext(?:\s+w:val="(?:1|true)")?\s*\/>/);
  });
  it("writes every cell once, with gridSpan/vMerge and no phantom continuation cell", async () => {
    const xml = await roundTrip();
    const rows = xml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];
    assert.equal(rows.length, 3);
    const cells = rows.map((r) => r.match(/<w:tc>/g).length);
    assert.deepEqual(cells, [2, 3, 3], "row 3 = vMerge continue + F + G (not a 4th cell)");
    assert.match(rows[0], /<w:gridSpan w:val="2"\/>/);
    assert.match(rows[1], /<w:vMerge w:val="restart"\/>/);
    assert.match(rows[2], /<w:vMerge\/>|<w:vMerge w:val="continue"\/>/);
    for (const text of ["A", "B", "C", "D", "E", "F", "G", "Sonra"]) assert.ok(xml.includes(`>${text}<`), `text ${text} kept`);
  });
  it("keeps the Word grid as table/cell widths", async () => {
    const xml = await roundTrip();
    const grid = [...xml.match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)[0].matchAll(/w:w="(\d+)"/g)].map((m) => Number(m[1]));
    assert.equal(grid.length, 3);
    assert.ok(Math.abs(grid[1] / grid[0] - 1.5) < 0.02 && Math.abs(grid[2] / grid[0] - 2) < 0.02, `grid ratios ${grid}`);
    const first = xml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/)[0];
    assert.equal(Number(/<w:tcW[^>]*w:w="(\d+)"/.exec(first)[1]), grid[0] + grid[1], "spanned cell width = sum of its columns");
  });
  it("writes tblHeader only on the Word header row and cantSplit only where Word had it", async () => {
    const rows = (await roundTrip()).match(/<w:tr[ >][\s\S]*?<\/w:tr>/g);
    assert.match(rows[0], /<w:tblHeader\/>/); assert.doesNotMatch(rows[0], /<w:cantSplit/);
    assert.match(rows[1], /<w:cantSplit\/>/); assert.doesNotMatch(rows[1], /<w:tblHeader/);
    assert.doesNotMatch(rows[2], /<w:cantSplit|<w:tblHeader/);
  });
});
