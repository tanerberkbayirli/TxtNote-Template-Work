import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, groupThesisSections, templateFontFamilies } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuCografyaLisans } from "../thesis/templates/aku-cografya.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption) => `<figure class="academic-figure" data-kind="figure"><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Ayşe DEMİR", THESIS_TITLE: "Başlık", THESIS_TITLE_EN: "Title", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_TITLE_EN: "Prof.", ADVISOR_NAME: "Ali VELİ", SUBMISSION_YEAR: "2024", DEFENSE_YEAR: "2024", YEAR: "2024", KEYWORDS_TR: "a, b, c, d", KEYWORDS_EN: "a, b, c, d" };
const main = `<h1>Literatür Bilgileri</h1><p>Metin.</p><h2>Alt Başlık</h2><h3>Üç</h3><h4>Dört</h4><h2>İki</h2><h1>Materyal ve Metot</h1><h2>Yine</h2>${figure("Şekil başlığı")}${table("Tablo başlığı")}`;
const compile = (html = main, extra = {}) => compileThesisDocument(akuCografyaLisans, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", html, ["Soyad, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ Coğrafya lisans bitirme tezi template (aku-cografya-lisans-tr-v1)", () => {
  it("is valid, registered and resolves with its source evidence", async () => {
    assert.deepEqual(validateThesisTemplate(akuCografyaLisans), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: "aku-cografya-lisans-tr-v1" });
    assert.equal(fallback, false);
    assert.equal(template.status, "official");
    assert.deepEqual([template.universityId, template.instituteId, template.degreeType, template.language], ["aku", "fef-cografya", "undergraduate", "tr"]);
    assert.match(template.source.documentName, /Bitirme Tezi Yazım Kılavuzu \(2024\)/);
    assert.match(template.source.documentName, /Sablonu_2024\.docx/);
    assert.ok(template.source.verifiedAt && template.source.revisionDate && template.source.notes.length >= 8);
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "aku-cografya-lisans-tr-v1").displayName, "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Coğrafya Bölümü · Bitirme Tezi");
    assert.deepEqual(templateFontFamilies(akuCografyaLisans), ["Times New Roman"]);
  });

  it("page, body and heading values of the guide and template (25/30 mm, 12 pt, 1.5 lines, 6/6 pt, 12.5 mm indent)", () => {
    const t = akuCografyaLisans;
    assert.deepEqual(t.page.margins, { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 });
    assert.deepEqual([t.page.footer.distanceMm, t.page.header.distanceMm], [12.5, 12.5], "template sectPr footer/header 708-709 twips");
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.style], ["bottom", "center", { fontFamily: "Times New Roman", fontSizePt: 10 }]);
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive" });
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.spaceBeforePt, b.spaceAfterPt, b.firstLineIndentMm], ["Times New Roman", 12, 1.5, "justify", 6, 6, 12.5]);
    const h = t.typography.headings;
    assert.deepEqual(Object.keys(h), ["1", "2", "3", "4"]);
    for (const level of ["1", "2", "3", "4"]) assert.deepEqual([h[level].fontSizePt, h[level].fontWeight, h[level].align, h[level].lineHeight, h[level].keepWithNext, h[level].firstLineIndentMm], [12, 700, "left", 1.5, true, 0], level);
    assert.deepEqual([h["1"].textTransform, h["1"].pageBreakBefore, h["1"].textTransformExceptions, h["1"].spaceBeforePt], ["uppercase", true, ["ve", "veya", "ile"], 0]);
    assert.deepEqual([h["2"].textTransform, h["2"].pageBreakBefore], ["capitalize", undefined]);
    assert.deepEqual([h["3"].textTransform, h["4"].textTransform], ["capitalize", "capitalize"]);
    for (const level of ["2", "3", "4"]) assert.ok(Math.abs(h[level].spaceBeforePt - 14.7) < 1e-9 && Math.abs(h[level].spaceAfterPt - 14.7) < 1e-9, "one empty 1.5 line = 14.7 pt + 6 pt paragraph spacing");
    assert.deepEqual(["1", "2", "3", "4"].map((l) => h[l].numbering.format), ["{1}.", "{1}.{2}", "{1}.{2}.{3}", "{1}.{2}.{3}.{4}"]);
    assert.deepEqual([t.bibliography.style.spaceBeforePt, t.bibliography.style.spaceAfterPt, t.bibliography.style.hangingIndentMm, t.bibliography.style.lineHeight, t.bibliography.style.fontSizePt, t.bibliography.style.align], [6, 0, 12.5, 1, 12, "justify"]);
    assert.equal(t.bibliography.citationStyle, "author-year");
    assert.equal(t.tables.continuation.format, "{label} {number} (Devamı) {title}");
    assert.deepEqual(t.typography.paragraphStyles.tableNote, { fontSizePt: 11, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 });
  });

  it("captions: Tablo above, Şekil below, chapter numbers without period, bold label, 11 pt single, hanging under the text", () => {
    const t = akuCografyaLisans;
    const rules = { tables: t.tables, figures: t.figures };
    assert.deepEqual([rules.tables.label, rules.figures.label], ["Tablo", "Şekil"]);
    assert.deepEqual([rules.tables.position, rules.figures.position], ["above", "below"]);
    for (const rule of Object.values(rules)) {
      assert.deepEqual(rule.numbering, { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" });
      assert.deepEqual([rule.labelFormat, rule.labelStyle, rule.hangingIndent, rule.captionAlignment], ["{label} {number}", { fontWeight: 700 }, "label", "justify"]);
      assert.deepEqual([rule.style.fontSizePt, rule.style.lineHeight, rule.style.align, rule.style.spaceBeforePt], [11, 1, "justify", 0]);
    }
    assert.equal(rules.figures.style.spaceAfterPt, 6);
    assert.equal(t.captionKinds, undefined, "the guide calls every map/photo/graph a Şekil; no Resim list");
    const model = compile();
    assert.deepEqual(model.headings.map((x) => `${x.label}|${x.title}`).slice(0, 8), ["1.|GİRİŞ", "2.|Literatür Bilgileri", "2.1|Alt Başlık", "2.1.1|Üç", "2.1.1.1|Dört", "2.2|İki", "3.|Materyal ve Metot", "3.1|Yine"]);
    assert.deepEqual(model.indexSources.filter((entry) => entry.kind !== "toc").map((entry) => entry.label), ["Şekil 3.1", "Tablo 3.1"]);
    assert.match(buildThesisCss(model), /caption\{caption-side:top;[^}]*font-size:11pt/);
  });

  it("sections: no Dış Kapak, cover/approval/ethics unnumbered, ÖZET = i, GİRİŞ = 1, KAYNAKLAR numbered as the next chapter, TOC lists front titles", () => {
    const model = compile(main, { enabledSections: ["symbols", "appendices"] });
    const ids = model.sections.map((s) => s.id);
    assert.ok(!ids.includes("outer-cover"), "the Dış Kapak is not defined by the sources");
    assert.ok(!ids.includes("cv") && !ids.includes("list-photos"), "ÖZGEÇMİŞ and RESİMLER DİZİNİ occur only in the template's stale cached TOC");
    assert.deepEqual(ids.slice(0, 8), ["inner-cover", "approval", "ethics", "abstract-tr", "abstract", "abstract-footer", "abstract-en-header", "abstract-en"]);
    const order = ["acknowledgements", "toc", "symbols", "introduction", "main", "bibliography", "appendices"].map((id) => ids.indexOf(id));
    assert.deepEqual([...order].sort((a, b) => a - b), order, "front matter, symbols, body, KAYNAKLAR, EKLER");
    assert.ok(order.every((index) => index >= 0));
    const rule = (id) => section(model, id).rules.page.numbering;
    assert.deepEqual([rule("inner-cover").enabled, rule("approval").enabled, rule("ethics").enabled], [false, false, false]);
    assert.deepEqual([rule("abstract-tr").format, rule("abstract-tr").startAt, rule("abstract-tr").restart], ["roman-lower", 1, true]);
    assert.deepEqual([rule("introduction").format, rule("introduction").startAt, rule("introduction").restart], ["arabic", 1, true]);
    assert.equal(section(model, "bibliography").rules.page.numbering.format, "arabic");
    const labels = Object.fromEntries(numberThesisPages(groupThesisSections(model.sections), {}).map((n) => [n.sectionId, n.labels]));
    assert.equal(labels["abstract-tr"][0], "i");
    assert.equal(labels.introduction[0], "1");
    const toc = section(model, "toc").html;
    for (const title of ["ÖZET", "ABSTRACT", "TEŞEKKÜR", "İÇİNDEKİLER DİZİNİ", "SİMGELER ve KISALTMALAR DİZİNİ", "EKLER"]) assert.ok(toc.includes(title), title);
    assert.match(toc, /GİRİŞ/);
    assert.match(toc, /KAYNAKLAR/);
    assert.doesNotMatch(toc, /İÇ KAPAK|BİLİMSEL ETİK|ONAY SAYFASI/, "covers, approval and ethics are not listed");
    assert.match(toc, /LİTERATÜR BİLGİLERİ/, "H1 is listed in capitals");
    assert.match(toc, /MATERYAL ve METOT/, "ve/veya/ile stay lower-case");
    assert.equal(section(compile(), "symbols"), undefined, "SİMGELER is optional");
  });

  it("lists: ŞEKİLLER and TABLOLAR DİZİNİ (template page title) appear with their items, centred bold titles and a Sayfa heading", () => {
    const model = compile();
    assert.deepEqual(model.sections.filter((s) => s.id.startsWith("list-")).map((s) => s.generatedIndex.title), ["ŞEKİLLER DİZİNİ", "TABLOLAR DİZİNİ"]);
    for (const id of ["toc", "list-figures", "list-tables"]) {
      const s = section(model, id);
      assert.equal(s.rules.headings["1"].align, "center", id);
      assert.equal(s.rules.headings["1"].lineHeight, 1, id);
      assert.equal(s.generatedIndex.pageHeading, "Sayfa", id);
    }
    assert.deepEqual([section(model, "toc").generatedIndex.style.lineHeight, section(model, "toc").generatedIndex.style.spaceAfterPt], [1.5, 0]);
    assert.deepEqual([section(model, "list-figures").generatedIndex.style.lineHeight, section(model, "list-figures").generatedIndex.levelStyles["1"].spaceAfterPt], [1, 10]);
    assert.equal(section(compile("<h1>Bir</h1>"), "list-figures"), undefined, "no list without items");
  });

  it("special pages: İç Kapak (14 pt bold, 25 mm top, two seals), approval, ethics wording, ÖZET/ABSTRACT lines and keyword order", () => {
    const model = compile();
    const text = (id) => JSON.stringify(section(model, id).layout);
    const cover = section(model, "inner-cover");
    assert.equal(cover.rules.page.margins.topMm, 25);
    assert.deepEqual([cover.rules.body.fontSizePt, cover.rules.body.fontWeight, cover.rules.body.lineHeight, cover.rules.body.align], [14, 700, 1.5, "center"]);
    assert.match(text("inner-cover"), /AFYON KOCATEPE ÜNİVERSİTESİ[\s\S]*FEN EDEBİYAT FAKÜLTESİ[\s\S]*COĞRAFYA BÖLÜMÜ[\s\S]*BİTİRME TEZİ/);
    assert.equal((text("inner-cover").match(/data:image\/(jpeg|png);base64/g) || []).length, 2, "AKÜ and Fen-Edebiyat Fakültesi seals");
    assert.match(text("inner-cover"), /2024/);
    assert.match(text("approval"), /BİTİRME TEZİ ONAY SAYFASI/);
    assert.match(text("approval"), /Coğrafya Bölümü’nde lisans/);
    assert.match(text("approval"), /Bitirme Tezi Danışmanı: Prof\. Dr\. Ali VELİ/);
    assert.match(text("ethics"), /Coğrafya Bölümü, bitirme tezi yazım kurallarına uygun olarak/);
    assert.equal((text("ethics").match(/"value":"•"|"text":"•"/g) || []).length, 6, "six bullet items");
    assert.match(text("ethics"), /beyan ederim\./);
    assert.match(text("abstract-tr"), /Bitirme Tezi/);
    assert.match(text("abstract-tr"), /Coğrafya Bölümü/);
    assert.match(text("abstract-en-header"), /Graduation Thesis/);
    assert.match(text("abstract-en-header"), /Department of Geography/);
    assert.match(text("abstract-en-header"), /Supervisor:/);
    assert.equal(section(model, "abstract").rules.body.firstLineIndentMm, 0);
    assert.match(text("abstract-footer"), /"hangingIndentMm":37\.52/);
    assert.match(text("abstract-en-footer"), /"hangingIndentMm":22/);
    const footer = section(model, "abstract-footer").layout.map((node) => node.text || "");
    assert.ok(footer.findIndex((line) => line.startsWith("Anahtar Kelimeler:")) < footer.findIndex((line) => /sayfa$/.test(line)), "guide order: keywords before the year + page count line");
    assert.match(footer.join("|"), /2024, .+ \+ .+ sayfa/);
  });

  it("DOCX carries the Word values: 25/30 mm margins, 1.5 lines, 6/6 pt, 12.5 mm indent, heading gaps, footer 12.5 mm", async () => {
    const xml = await docxXml(compile());
    assert.match(xml, /<w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701" w:header="709" w:footer="709"/);
    assert.match(xml, /w:spacing w:after="120" w:before="120" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /w:firstLine="709"/);
    assert.match(xml, /w:spacing w:after="294" w:before="294" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="lowerRoman"\/>/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="decimal"\/>/);
  });
});
