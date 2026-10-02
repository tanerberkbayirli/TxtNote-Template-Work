import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
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
  it("a caption below a table keeps with the table's last row (keep-with-next on every row)", async () => {
    const t = structuredClone(generic);
    t.tables.position = "below";
    const xml = await docXml(t, "<table><caption>Baslik</caption><tbody><tr><td>a1</td></tr><tr><td>b1</td></tr></tbody></table>");
    const rows = xml.match(/<w:tr>[\s\S]*?<\/w:tr>/g) || [];
    assert.ok(rows.length >= 2 && rows.every((row) => row.includes("<w:keepNext/>")), "all rows keepNext");
  });
});
