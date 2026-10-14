import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import cografya from "../thesis/templates/aku-cografya.js";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";

const docXml = async (template, html) => {
  const blob = await buildThesisDocx(compileThesisDocument(template, {}, "T", html), {});
  return strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
};
const spacingOf = (xml, text) => {
  const at = xml.indexOf(`>${text}<`);
  const start = xml.lastIndexOf("<w:p>", at);
  const m = /<w:spacing ([^>]*)\/>/.exec(xml.slice(start, at));
  return { before: Number(/w:before="(\d+)"/.exec(m[1])[1]), after: Number(/w:after="(\d+)"/.exec(m[1])[1]) };
};
const withSpacing = (mode) => {
  const t = structuredClone(generic);
  t.typography.lineSpacing = { mode: "word", singleLineEm: 1.15, baseline: "word", ...(mode ? { paragraphSpacing: mode } : {}) };
  t.typography.body = { ...t.typography.body, spaceBeforePt: 6, spaceAfterPt: 10 };
  return t;
};

describe("DOCX paragraph spacing (Word renders max(after, before), not the sum)", () => {
  it("additive: the next paragraph carries after(prev) + before(next) so Word's max equals the editor's sum", async () => {
    const xml = await docXml(withSpacing("additive"), "<p>AAA</p><p>BBB</p>");
    assert.deepEqual(spacingOf(xml, "AAA"), { before: 120, after: 200 });
    assert.deepEqual(spacingOf(xml, "BBB"), { before: 320, after: 200 });
  });
  it("collapse (default) is unchanged", async () => {
    const xml = await docXml(withSpacing(null), "<p>AAA</p><p>BBB</p>");
    assert.deepEqual(spacingOf(xml, "BBB"), { before: 120, after: 200 });
  });
  it("the page-top spacing opt-in suppresses the first named paragraph's before space but preserves a forced break", async () => {
    const template = withSpacing("collapse");
    template.typography.lineSpacing.suppressSpaceBeforeAtPageTop = true;
    template.typography.paragraphStyles = { named: { spaceBeforePt: 8, spaceAfterPt: 10 }, forced: { spaceBeforePt: 16, pageBreakBefore: true } };
    const xml = await docXml(template, '<p data-thesis-style="named">FIRST</p><p data-thesis-style="named">SECOND</p><p data-thesis-style="forced">FORCED</p>');
    assert.deepEqual(spacingOf(xml, "FIRST"), { before: 0, after: 200 });
    assert.deepEqual(spacingOf(xml, "SECOND"), { before: 160, after: 200 });
    assert.equal(spacingOf(xml, "FORCED").before, 320);
  });
  it("a caption below a table keeps with the table's last row (keep-with-next on every row)", async () => {
    const t = structuredClone(generic);
    t.tables.position = "below";
    const xml = await docXml(t, "<table><caption>Baslik</caption><tbody><tr><td>a1</td></tr><tr><td>b1</td></tr></tbody></table>");
    const rows = xml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];
    assert.ok(rows.length >= 2 && rows.every((row) => row.includes("<w:keepNext/>")), "all rows keepNext");
  });
});

describe("DOCX table rows and captions (Word adds cell margins on top of trHeight)", () => {
  const table = "<table><caption>Baslik</caption><tbody><tr><td>a1</td></tr><tr><td>b1</td></tr></tbody></table>";
  it("cell paragraphs use the cellStyle exactly and trHeight is the content line box only (margins/border are not counted twice)", async () => {
    assert.equal(cografya.tables.cellStyle.fontSizePt, 11); assert.equal(cografya.tables.cellStyle.lineHeight, 1);
    const xml = await docXml(cografya, table);
    const row = (xml.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).find((r) => r.includes(">a1<"));
    const height = Number(/<w:trHeight[^>]*w:val="(\d+)"/.exec(row)[1]);
    assert.ok(height <= 11 * 1.2 * 20, `trHeight ${height} must be the line box (<= 264 twips), not line box + padding`);
    assert.match(row, /<w:tcMar>[\s\S]*<w:top [^>]*w:w="\d+"/, "cell margins stay (editor padding)");
    const para = /<w:p>[\s\S]*?<\/w:p>/.exec(row)[0];
    assert.match(para, /w:before="0"/); assert.match(para, /w:after="0"/); assert.match(para, /w:firstLine="0"/);
    assert.match(para, /<w:sz w:val="22"\/>/);
  });
  it("a caption above a table keeps with the table and keeps its lines together", async () => {
    const xml = await docXml(cografya, table);
    const at = xml.lastIndexOf(">Baslik<");
    const caption = xml.slice(xml.lastIndexOf("<w:p>", at), at);
    assert.match(caption, /<w:keepNext\/>/); assert.match(caption, /<w:keepLines\/>/);
  });
});

