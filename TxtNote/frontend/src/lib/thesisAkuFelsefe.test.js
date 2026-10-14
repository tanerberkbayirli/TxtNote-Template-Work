import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { akuFelsefeLisans, akuFelsefeSeminer } from "../../../../engine/src/templates/aku-felsefe.js";

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

  it("generates the source-required covers (measured rows) and numbers from the preface / first page after the cover", () => {
    const covers = (t) => t.sections.filter((section) => section.group === "cover");
    assert.deepEqual(covers(akuFelsefeLisans).map((section) => section.id), ["outer-cover", "inner-cover"]);
    assert.deepEqual(covers(akuFelsefeSeminer).map((section) => section.id), ["cover"]);
    for (const [t, purpose] of [[akuFelsefeLisans, "LİSANS BİTİRME TEZİ"], [akuFelsefeSeminer, "FELSEFE SEMİNERİ"]]) {
      for (const section of covers(t)) {
        assert.equal(section.overrides.page.numbering.enabled, false);
        const texts = section.blocks.filter((block) => block.type === "text").map((block) => block.value);
        assert.deepEqual(texts.slice(0, 5), ["T.C.", "AFYON KOCATEPE ÜNİVERSİTESİ", "FEN EDEBİYAT FAKÜLTESİ", "FELSEFE BÖLÜMÜ", purpose]);
        assert.equal(section.blocks.find((block) => block.field === "THESIS_TITLE").style.fontSizePt, 18);
        assert.ok(section.blocks.some((block) => block.value === "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}"));
        assert.ok(section.blocks.some((block) => block.field === "SUBMISSION_YEAR"));
      }
    }
    assert.deepEqual(akuFelsefeLisans.sections.find((section) => section.id === "preface").overrides.page.numbering, { startAt: 1, restart: true });
    assert.deepEqual(akuFelsefeSeminer.sections[0].overrides.page.numbering, { enabled: false, startAt: 0, restart: true });
  });

  it("covers carry the placeholder values into the DOCX and the seminar cover leaves page 1 for the introduction (startAt 0)", async () => {
    const values = { THESIS_TITLE: "Platon", STUDENT_NAME: "Beyza BURSALİOĞLU", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Kasım TURHAN", SUBMISSION_YEAR: "2017" };
    const model = compileThesisDocument(akuFelsefeSeminer, { values, sectionContent: {} }, "Test", "<h1>Bir</h1><p>x</p>", []);
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
    for (const text of ["FELSEFE SEMİNERİ", "Beyza BURSALİOĞLU", "Prof. Dr. Kasım TURHAN", "AFYONKARAHİSAR", "2017"]) assert.ok(xml.includes(text), text);
    assert.match(xml, /<w:pgNumType w:start="0"/);
  });
});
