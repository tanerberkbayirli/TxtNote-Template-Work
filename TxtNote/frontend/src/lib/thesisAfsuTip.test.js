import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { afsuTipUzmanlik, afsuDisHekimligiUzmanlik } from "../thesis/templates/afsu-tip.js";
import { compileThesisDocument, templateFontFamilies } from "../thesis/engine.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";

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
    const normalise = (template, words) => words.reduce((json, [from, to]) => json.replaceAll(from, to), JSON.stringify({ ...template, id: "x", instituteId: "x", instituteName: "x", displayName: "x", source: null }));
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
});
