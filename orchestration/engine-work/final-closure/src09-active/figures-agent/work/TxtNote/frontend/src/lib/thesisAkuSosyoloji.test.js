import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, groupThesisSections, templateFontFamilies } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuSosyolojiLisans } from "../thesis/templates/aku-sosyoloji.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const values = { STUDENT_NAME: "Ayşe DEMİR", STUDENT_NUMBER: "140110006", THESIS_TITLE: "Kentleşme", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Ali VELİ", SUBMISSION_YEAR: "2024" };
const main = "<h1>Kentleşme</h1><p>Metin.</p><h2>Orta Başlık</h2><h3>Yan Başlık</h3><h4>Alt başlık</h4><h1>Sorunlar</h1><h2>Yine</h2>";
const compile = (html = main, extra = {}) => compileThesisDocument(akuSosyolojiLisans, { values, sectionContent: { introduction: "<p>Giriş.</p>", preface: "<p>Önsöz.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test", html, ["Soyad, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ Sosyoloji lisans bitirme tezi template (aku-sosyoloji-lisans-tr-v1)", () => {
  it("is valid, registered, Times New Roman only", async () => {
    assert.deepEqual(validateThesisTemplate(akuSosyolojiLisans), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: "aku-sosyoloji-lisans-tr-v1" });
    assert.equal(fallback, false);
    assert.deepEqual([template.universityId, template.instituteId, template.degreeType, template.language, template.status], ["aku", "fef-sosyoloji", "undergraduate", "tr", "official"]);
    assert.ok(THESIS_TEMPLATE_REGISTRY.some((e) => e.id === "aku-sosyoloji-lisans-tr-v1"));
    assert.deepEqual(templateFontFamilies(akuSosyolojiLisans), ["Times New Roman"]);
  });

  it("explicit guide values: margins 45/45/45/30 mm, 12 pt, 1.5 lines, 6/6 pt, 12.5 mm indent, justified, bottom-centre number", () => {
    const t = akuSosyolojiLisans;
    assert.deepEqual(t.page.margins, { topMm: 45, bottomMm: 45, leftMm: 45, rightMm: 30 });
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align], ["bottom", "center"]);
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.spaceBeforePt, b.spaceAfterPt, b.firstLineIndentMm], ["Times New Roman", 12, 1.5, "justify", 6, 6, 12.5]);
    assert.deepEqual(t.typography.paragraphStyles.blockQuote, { fontSizePt: 11, lineHeight: 1, leftIndentMm: 10, rightIndentMm: 10 });
  });

  it("sections: only the guide's parts; covers unnumbered, ÖNSÖZ = i, GİRİŞ = 1; chapter headings BİRİNCİ BÖLÜM with per-chapter numbers", () => {
    const model = compile(main, { enabledSections: ["preface", "symbols", "appendices"] });
    const ids = model.sections.map((s) => s.id);
    for (const id of ["outer-cover", "inner-cover", "preface", "toc", "introduction", "main", "conclusion", "bibliography"]) assert.ok(ids.includes(id), id);
    assert.ok(!ids.some((id) => /abstract|approval|ethics/.test(id)), "özet/onay/bildirim are not defined by the guide");
    assert.equal(section(model, "inner-cover").rules.page.numbering.enabled, false);
    const labels = Object.fromEntries(numberThesisPages(groupThesisSections(model.sections), {}).map((n) => [n.sectionId, n.labels]));
    assert.equal(labels.preface[0], "i");
    assert.equal(labels.introduction[0], "1");
    assert.deepEqual(model.headings.map((h) => `${h.label}|${h.title}`).slice(0, 6), ["BİRİNCİ BÖLÜM|Kentleşme", "1.|Orta Başlık", "1.1.|Yan Başlık", "1.1.1.|Alt başlık", "İKİNCİ BÖLÜM|Sorunlar", "1.|Yine"]);
  });

  it("cover pages follow the example pages (14/18 pt dış kapak, 12/14 pt iç kapak with öğrenci numarası)", () => {
    const model = compile();
    const text = (id) => JSON.stringify(section(model, id).layout);
    assert.match(text("outer-cover"), /SOSYOLOJİ BÖLÜMÜ[\s\S]*LİSANS BİTİRME TEZİ/);
    assert.match(text("outer-cover"), /"fontSizePt":18/);
    assert.match(text("inner-cover"), /T\.C\./);
    assert.match(text("inner-cover"), /140110006/);
    assert.match(text("inner-cover"), /AFYONKARAHİSAR 2024/);
  });

  it("DOCX carries the margins and paragraph values", async () => {
    const xml = await docxXml(compile());
    assert.match(xml, /<w:pgMar w:top="2551" w:right="1701" w:bottom="2551" w:left="2551"/);
    assert.match(xml, /w:spacing w:after="120" w:before="120" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /w:firstLine="709"/);
  });
});
