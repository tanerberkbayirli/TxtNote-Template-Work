import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { afsuTipUzmanlik, afsuDisHekimligiUzmanlik } from "../../../../engine/src/templates/afsu-tip.js";
import { compileThesisDocument, templateFontFamilies } from "../../../../engine/src/engine.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../../../../engine/src/registry.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";

describe("AFSÜ Tıp / Diş Hekimliği uzmanlık tezi (one joint guide, Temmuz 2021)", () => {
  it("both variants are valid, registered, official and differ only in faculty/degree wording", async () => {
    for (const template of [afsuTipUzmanlik, afsuDisHekimligiUzmanlik]) {
      assert.deepEqual(validateThesisTemplate(template), []);
      const { fallback, template: resolved } = await resolveThesisTemplate({ templateId: template.id });
      assert.equal(fallback, false, template.id);
      assert.equal(resolved.status, "official");
      assert.equal(resolved.universityId, "afsu");
      assert.equal(resolved.degreeType, "specialization");
    }
    assert.deepEqual(THESIS_TEMPLATE_REGISTRY.filter((e) => e.id.startsWith("afsu-tip") || e.id.startsWith("afsu-dis")).map((e) => e.id), ["afsu-tip-uzmanlik-tr-v1", "afsu-dis-hekimligi-uzmanlik-tr-v1"]);
    // The two guide copies print DIFFERENT example-page geometry (recorded conflict): special-page blocks and the İÇİNDEKİLER title/Sayfa spacing follow each copy's own examples, so they are excluded from this wording-only comparison.
    const geometryFree = (template) => ({ ...template, sections: template.sections.map((s) => (s.id === "toc" ? { ...s, overrides: undefined, generatedIndex: { ...s.generatedIndex, pageHeadingStyle: undefined } } : s.blocks ? { ...s, blocks: undefined } : s)) });
    const normalise = (template, words) => words.reduce((json, [from, to]) => json.replaceAll(from, to), JSON.stringify({ ...geometryFree(template), id: "x", instituteId: "x", instituteName: "x", displayName: "x", source: null }));
    const tip = normalise(afsuTipUzmanlik, [["TIPTA UZMANLIK TEZİ", "DEGREE"], ["Tıpta Uzmanlık Tezi", "Degree"], ["TIP FAKÜLTESİ", "FAC"], ["Tıp Fakültesi", "Fac"], ["Faculty of Medicine", "FacEn"]]);
    const dhf = normalise(afsuDisHekimligiUzmanlik, [["DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ", "DEGREE"], ["Diş Hekimliğinde Uzmanlık Tezi", "Degree"], ["DİŞ HEKİMLİĞİ FAKÜLTESİ", "FAC"], ["Diş Hekimliği Fakültesi", "Fac"]]);
    // the DHF English faculty has no default (UNKNOWN in the guide); every other value is shared
    assert.equal(dhf.replace(/"FACULTY_EN":\{[^}]*\}/, "FE"), tip.replace(/"FACULTY_EN":\{[^}]*\}/, "FE"));
    assert.deepEqual(afsuTipUzmanlik.source, afsuDisHekimligiUzmanlik.source, "one joint guide, one source record");
    assert.deepEqual(templateFontFamilies(afsuTipUzmanlik), ["Times New Roman"]);
  });

  it("carries the source values: A4, 25/25/40/25 mm, TNR 12, 1.5 lines, 12.5 mm indent, centred bottom Roman/Arabic numbers", () => {
    const t = afsuTipUzmanlik;
    assert.deepEqual(t.page.margins, { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 });
    assert.equal(t.page.numbering.position, "bottom");
    assert.equal(t.page.numbering.align, "center");
    assert.equal(t.typography.body.fontFamily, "Times New Roman");
    assert.equal(t.typography.body.fontSizePt, 12);
    assert.equal(t.typography.body.lineHeight, 1.5);
    assert.equal(t.typography.body.align, "justify");
    assert.equal(t.typography.body.firstLineIndentMm, 12.5);
    assert.equal(t.typography.body.spaceBeforePt, 0);
    const h = t.typography.headings;
    assert.equal(h["1"].fontSizePt, 14); assert.equal(h["1"].align, "center"); assert.equal(h["1"].textTransform, "uppercase"); assert.equal(h["1"].pageBreakBefore, true);
    for (const level of ["2", "3", "4"]) { assert.equal(h[level].fontSizePt, 12); assert.equal(h[level].fontWeight, 700); assert.equal(h[level].firstLineIndentMm, 12.5); assert.equal(h[level].spaceBeforePt, 12); assert.equal(h[level].spaceAfterPt, 12); }
    assert.equal(h["1"].spaceAfterPt, 12);
    assert.equal(h["2"].textTransform, "uppercase", "EK 1 / EK 13 example wins over the prose for H2 (recorded conflict)");
    assert.equal(h["3"].textTransform, "capitalize");
    assert.deepEqual(h["3"].textTransformExceptions, ["ve", "veya", "ile"]);
    assert.equal(t.bibliography.citationStyle, "Vancouver");
    assert.equal(t.bibliography.style.lineHeight, 1);
    assert.equal(t.bibliography.style.spaceAfterPt, 6);
    assert.equal(t.typography.paragraphStyles.tableNote.fontSizePt, 10);
    assert.equal(t.typography.paragraphStyles.tableNote.lineHeight, 1);
  });

  it("keeps the source page order and numbering transitions; no invented ethics page", () => {
    const ids = afsuTipUzmanlik.sections.map((s) => s.id);
    assert.deepEqual(ids, ["outer-cover", "blank-page", "inner-cover", "approval", "acknowledgements", "abstract-header", "abstract-tr", "abstract-tr-footer", "abstract-en-header", "abstract-en", "abstract-en-footer", "toc", "abbreviations", "index-tables", "index-figures", "main", "bibliography", "appendices"]);
    const sec = (id) => afsuTipUzmanlik.sections.find((s) => s.id === id);
    assert.equal(sec("outer-cover").overrides.page.numbering.enabled, false);
    assert.equal(sec("blank-page").overrides.page.numbering.enabled, false);
    assert.deepEqual([sec("inner-cover").overrides.page.numbering.format, sec("inner-cover").overrides.page.numbering.startAt, sec("inner-cover").overrides.page.numbering.restart], ["roman-lower", 1, true]);
    assert.deepEqual([sec("main").overrides.page.numbering.format, sec("main").overrides.page.numbering.startAt, sec("main").overrides.page.numbering.restart], ["arabic", 1, true]);
    assert.equal(sec("bibliography").titleNumbering, "continueH1");
    assert.equal(sec("toc").generatedIndex.pageHeading, "Sayfa");
  });

  it("variants print only their own faculty strings on the special pages", () => {
    const texts = (template) => {
      const model = compileThesisDocument(template, { values: { DEPARTMENT_NAME: "Çocuk Sağlığı ve Hastalıkları", THESIS_TITLE: "Başlık", FACULTY_EN: template.placeholders.FACULTY_EN.defaultValue || "Faculty of Dentistry" } }, "Test", "<h1>Giriş</h1><p>Metin.</p>");
      return JSON.stringify(model.sections.filter((s) => ["outer-cover", "inner-cover", "approval"].includes(s.id)).map((s) => s.layout));
    };
    const tip = texts(afsuTipUzmanlik), dhf = texts(afsuDisHekimligiUzmanlik);
    assert.match(tip, /TIP FAKÜLTESİ/); assert.match(tip, /TIPTA UZMANLIK TEZİ/); assert.doesNotMatch(tip, /DİŞ HEKİMLİĞİ/);
    assert.match(dhf, /DİŞ HEKİMLİĞİ FAKÜLTESİ/); assert.match(dhf, /DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ/); assert.doesNotMatch(dhf, /TIP FAKÜLTESİ|TIPTA/);
  });
  it("each registry entry follows its OWN guide copy's example geometry (EK 7, EK 9, EK 13) and centres special-page lines on the sheet", () => {
    const mm = (pt) => pt * 25.4 / 72;
    for (const [template, , spacer, titleToSayfa, sayfaToRow] of [[afsuTipUzmanlik, 52.95, 22.05, 7.65, 9.41], [afsuDisHekimligiUzmanlik, 59.10, 63.30 - 13.8 * 25.4 / 72, 6.94, 9.44]]) {
      const inner = template.sections.find((s) => s.id === "inner-cover").blocks;
      const tc = inner.find((b) => b.value === "T.C.");
      assert.equal(tc.xMm + tc.widthMm / 2, 105.5, "centred on the sheet");
      const approval = template.sections.find((s) => s.id === "approval").blocks;
      assert.ok(Math.abs(approval[approval.findIndex((b) => b.type === "group") + 1].heightMm - spacer) < 0.05, `${template.id} EK 9 Üye->ONAY spacer`);
      const toc = template.sections.find((s) => s.id === "toc");
      const titleAfter = toc.overrides.headings["1"].spaceAfterPt;
      assert.ok(Math.abs(mm(12 * 1.15 + titleAfter) - titleToSayfa) < 0.01, `${template.id} EK 13 title->Sayfa`);
      assert.ok(Math.abs(mm(12 * 1.15 * toc.generatedIndex.pageHeadingStyle.lineHeight) - sayfaToRow) < 0.01, `${template.id} EK 13 Sayfa->first row`);
    }
    const tcY = (template) => template.sections.find((s) => s.id === "inner-cover").blocks.find((b) => b.value === "T.C.").yMm;
    assert.ok(Math.abs(tcY(afsuDisHekimligiUzmanlik) - tcY(afsuTipUzmanlik) - (59.10 - 52.95)) < 0.1, "EK 7 first baseline: Tıp 52.95 mm, DHF 59.10 mm");
  });
});
