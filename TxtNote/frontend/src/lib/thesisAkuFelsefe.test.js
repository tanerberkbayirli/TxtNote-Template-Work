import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { resolveThesisTemplate } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuFelsefeLisans, akuFelsefeSeminer } from "../thesis/templates/aku-felsefe.js";

describe("AKÜ Felsefe templates (lisans bitirme tezi, seminer)", () => {
  for (const [t, left, inst] of [[akuFelsefeLisans, 35, "fef-felsefe"], [akuFelsefeSeminer, 30, "fef-felsefe-seminer"]]) {
    it(`${t.id} validates, is registered and carries the guide values`, async () => {
      assert.deepEqual(validateThesisTemplate(t), []);
      const { fallback, template } = await resolveThesisTemplate({ templateId: t.id });
      assert.equal(fallback, false);
      assert.equal(template.instituteId, inst);
      assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: left, rightMm: 20 });
      const b = t.typography.body;
      assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.firstLineIndentMm, b.spaceBeforePt, b.spaceAfterPt], ["Times New Roman", 12, 1.5, "justify", 12.5, 6, 6]);
      assert.equal(t.typography.lineSpacing.paragraphSpacing, "collapse");
      assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.format, t.page.numbering.startAt], ["bottom", "center", "arabic", 1]);
      const q = t.typography.paragraphStyles.blockQuote;
      assert.deepEqual([q.fontSizePt, q.lineHeight, q.leftIndentMm, q.rightIndentMm], [11, 1, 10, 10]);
      assert.equal(t.bibliography.citationStyle, "author-year");
      assert.ok(t.source.notes.length >= 6);
    });
  }

  it("lisans TOC follows the fourth level shown in the official example and requires the symbols/abbreviations sequence entry", () => {
    assert.deepEqual(akuFelsefeLisans.toc.levels, [1, 2, 3, 4]);
    assert.equal(akuFelsefeLisans.sections.find((section) => section.id === "symbols").status, "required");
    assert.deepEqual(akuFelsefeSeminer.toc.levels, [1, 2, 3]);
    assert.equal(akuFelsefeSeminer.sections.some((section) => section.id === "symbols"), false);
  });

  it("DOCX retains literal 6/6 pt body properties and exports a fourth-level heading into the TOC", async () => {
    const content = "<h1>Birinci</h1><p>Gövde bir.</p><p>Gövde iki.</p><h2>İkinci</h2><h3>Üçüncü</h3><h4>Dördüncü düzey</h4>";
    const model = compileThesisDocument(akuFelsefeLisans, { sectionContent: { preface: "<p>Önsöz metni.</p>", symbols: "<p>α — simge</p>" } }, "Test Tezi", content, []);
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const xml = strFromU8(files["word/document.xml"]);
    for (const text of ["Gövde bir.", "Gövde iki."]) {
      const index = xml.indexOf(text);
      assert.notEqual(index, -1, `expected DOCX body paragraph ${text}`);
      const paragraphStart = xml.lastIndexOf("<w:p>", index);
      const properties = xml.slice(paragraphStart, index);
      assert.match(properties, /<w:spacing[^>]*w:before="120"[^>]*w:after="120"|<w:spacing[^>]*w:after="120"[^>]*w:before="120"/, text);
    }
    const fourthLevelRow = xml.indexOf("1 Dördüncü düzey");
    assert.notEqual(fourthLevelRow, -1, "expected a generated TOC row for the source-demonstrated fourth level");
    const rowStart = xml.lastIndexOf("<w:p>", fourthLevelRow);
    assert.match(xml.slice(rowStart, fourthLevelRow), /<w:ind[^>]*w:left="850"/, "the fourth TOC level is emitted at its deeper indent");
  });
});
