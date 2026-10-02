import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, groupThesisSections, templateFontFamilies } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuMbgLisans } from "../thesis/templates/aku-mbg.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""}><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Ayşe DEMİR", THESIS_TITLE: "Başlık", THESIS_TITLE_EN: "Title", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_TITLE_EN: "Prof.", ADVISOR_NAME: "Ali VELİ", SUBMISSION_MONTH: "Haziran", SUBMISSION_YEAR: "2025", DEFENSE_YEAR: "2025", YEAR: "2025", KEYWORDS_TR: "a, b, c, d", KEYWORDS_EN: "a, b, c, d" };
const main = `<h1>Literatür Bilgileri</h1><p>Metin.</p><h2>Alt Başlık</h2><h3>Üç</h3><h4>Dört</h4><h2>İki</h2><h1>Materyal ve Metot</h1><h2>Yine</h2>${figure("Şekil başlığı")}${figure("Resim başlığı", "photo")}${table("Çizelge başlığı")}`;
const compile = (html = main, extra = {}) => compileThesisDocument(akuMbgLisans, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", html, ["Soyad, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ MBG lisans bitirme tezi template (aku-mbg-lisans-tr-v1)", () => {
  it("is valid, registered and resolves with its source evidence", async () => {
    assert.deepEqual(validateThesisTemplate(akuMbgLisans), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: "aku-mbg-lisans-tr-v1" });
    assert.equal(fallback, false);
    assert.equal(template.status, "official");
    assert.deepEqual([template.universityId, template.instituteId, template.degreeType, template.language], ["aku", "fef-mbg", "undergraduate", "tr"]);
    assert.match(template.source.documentName, /Lisans Tezi Yazım Kılavuzu \(2025\)/);
    assert.ok(template.source.verifiedAt && template.source.revisionDate && template.source.notes.length >= 8);
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "aku-mbg-lisans-tr-v1").displayName, "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü · Bitirme Tezi");
    assert.deepEqual(templateFontFamilies(akuMbgLisans), ["Times New Roman", "Cambria Math"].filter((family) => templateFontFamilies(akuMbgLisans).includes(family)));
    assert.ok(templateFontFamilies(akuMbgLisans).includes("Times New Roman"));
  });

  it("page, body and heading values of the guide and template (30 mm, 12 pt, 1.5 lines, 20.7 pt after, no indent)", () => {
    const t = akuMbgLisans;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 });
    assert.deepEqual([t.page.footer.distanceMm, t.page.header.distanceMm], [12.51, 12.51]);
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.style], ["bottom", "center", { fontFamily: "Times New Roman", fontSizePt: 10 }]);
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" });
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.firstLineIndentMm], ["Times New Roman", 12, 1.5, "justify", 0]);
    assert.ok(Math.abs(b.spaceAfterPt - 20.7) < 1e-9 && b.spaceBeforePt === 0);
    const h = t.typography.headings;
    assert.deepEqual(Object.keys(h), ["1", "2", "3", "4"]);
    for (const level of ["1", "2", "3", "4"]) assert.deepEqual([h[level].fontSizePt, h[level].fontWeight, h[level].align, h[level].lineHeight, h[level].keepWithNext], [12, 700, "left", 1.5, true], level);
    assert.deepEqual([h["1"].textTransform, h["1"].pageBreakBefore, h["1"].textTransformExceptions], ["uppercase", true, ["ve", "veya", "ile"]]);
    assert.deepEqual([h["2"].textTransform, h["2"].pageBreakBefore], ["capitalize", undefined]);
    assert.deepEqual([h["3"].textTransform, h["4"].textTransform], [undefined, undefined], "H3/H4 case is not prescribed");
    assert.deepEqual(["1", "2", "3", "4"].map((l) => h[l].numbering.format), ["{1}.", "{1}.{2}", "{1}.{2}.{3}", "{1}.{2}.{3}.{4}"]);
    assert.deepEqual([t.bibliography.style.spaceBeforePt, t.bibliography.style.spaceAfterPt, t.bibliography.style.hangingIndentMm, t.bibliography.style.lineHeight, t.bibliography.style.align], [6, 0, 12.5, 1.5, "justify"]);
    assert.equal(t.bibliography.citationStyle, "author-year");
    assert.deepEqual(t.tables.borders, { preset: "threeRule", widthPt: 0.5 });
    assert.equal(t.tables.continuation.format, "{label} {number} (Devam) {title}");
    assert.deepEqual(t.typography.paragraphStyles.tableNote, { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 });
    assert.deepEqual([t.equations.style.fontFamily, t.equations.style.fontSizePt, t.equations.numberAlign, t.equations.numbering.format], ["Cambria Math", 12, "right", "({chapter}.{n})"]);
  });

  it("captions: Çizelge above, Şekil and Resim below, chapter numbers, bold label, 11 pt single, hanging under the text", () => {
    const t = akuMbgLisans;
    const rules = { tables: t.tables, figures: t.figures, photo: t.captionKinds.photo };
    assert.deepEqual([rules.tables.label, rules.figures.label, rules.photo.label], ["Çizelge", "Şekil", "Resim"]);
    assert.deepEqual([rules.tables.position, rules.figures.position, rules.photo.position], ["above", "below", "below"]);
    for (const rule of Object.values(rules)) {
      assert.deepEqual(rule.numbering, { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" });
      assert.deepEqual([rule.labelFormat, rule.labelStyle, rule.hangingIndent, rule.captionAlignment], ["{label} {number}", { fontWeight: 700 }, "label", "justify"]);
      assert.deepEqual([rule.style.fontSizePt, rule.style.lineHeight, rule.style.align, rule.style.spaceBeforePt, rule.style.spaceAfterPt], [11, 1, "justify", 0, 6]);
    }
    const model = compile();
    assert.deepEqual(model.headings.map((x) => `${x.label}|${x.title}`).slice(0, 8), ["1.|GİRİŞ", "2.|Literatür Bilgileri", "2.1|Alt Başlık", "2.1.1|Üç", "2.1.1.1|Dört", "2.2|İki", "3.|Materyal ve Metot", "3.1|Yine"]);
    assert.deepEqual(model.indexSources.filter((entry) => entry.kind !== "toc").map((entry) => entry.label), ["Şekil 3.1", "Resim 3.1", "Çizelge 3.1"]);
    const css = buildThesisCss(model);
    assert.match(css, /caption\{caption-side:top;[^}]*font-size:11pt/);
  });

  it("sections: no Dış Kapak, İç Kapak and ethics unnumbered, ÖZET = i, GİRİŞ = 1, KAYNAKLAR numbered as the next chapter, TOC lists front titles", () => {
    const model = compile(main, { enabledSections: ["symbols", "cv", "appendices"] });
    const ids = model.sections.map((s) => s.id);
    assert.ok(!ids.includes("outer-cover"), "the Dış Kapak is not defined by the sources");
    assert.deepEqual(ids.slice(0, 7), ["inner-cover", "ethics", "abstract-tr", "abstract", "abstract-footer", "abstract-en-header", "abstract-en"]);
    const order = ["acknowledgements", "toc", "symbols", "introduction", "main", "bibliography", "cv", "appendices"].map((id) => ids.indexOf(id));
    assert.deepEqual([...order].sort((a, b) => a - b), order, "front matter, symbols, body, KAYNAKLAR, ÖZGEÇMİŞ, EKLER");
    assert.ok(order.every((index) => index >= 0));
    const rule = (id) => section(model, id).rules.page.numbering;
    assert.deepEqual([rule("inner-cover").enabled, rule("ethics").enabled], [false, false]);
    assert.deepEqual([rule("abstract-tr").format, rule("abstract-tr").startAt, rule("abstract-tr").restart], ["roman-lower", 1, true]);
    assert.deepEqual([rule("introduction").format, rule("introduction").startAt, rule("introduction").restart], ["arabic", 1, true]);
    assert.equal(section(model, "bibliography").rules.page.numbering.format, "arabic");
    const groups = groupThesisSections(model.sections);
    const labels = Object.fromEntries(numberThesisPages(groups, {}).map((n) => [n.sectionId, n.labels]));
    assert.equal(labels["abstract-tr"][0], "i");
    assert.equal(labels.introduction[0], "1");
    const toc = section(model, "toc").html;
    for (const title of ["ÖZET", "ABSTRACT", "TEŞEKKÜR", "İÇİNDEKİLER DİZİNİ", "SİMGELER ve KISALTMALAR DİZİNİ", "ÖZGEÇMİŞ", "EKLER"]) assert.ok(toc.includes(title), title);
    assert.match(toc, /GİRİŞ/);
    assert.match(toc, /KAYNAKLAR/);
    assert.doesNotMatch(toc, /İÇ KAPAK|BİLİMSEL ETİK/, "covers and the ethics page are not listed");
    assert.match(toc, /LİTERATÜR BİLGİLERİ/, "H1 is listed in capitals");
    assert.match(toc, /MATERYAL ve METOT/, "ve/veya/ile stay lower-case");
    assert.equal(section(compile(), "cv"), undefined, "ÖZGEÇMİŞ is optional");
    assert.equal(section(compile(), "symbols"), undefined, "SİMGELER is optional");
  });

  it("lists: ŞEKİLLER, ÇİZELGELER and RESİMLER DİZİNİ appear with their items, centred titles and a bold-label hanging row", () => {
    const model = compile();
    assert.deepEqual(model.sections.filter((s) => s.id.startsWith("list-")).map((s) => s.generatedIndex.title), ["ŞEKİLLER DİZİNİ", "ÇİZELGELER DİZİNİ", "RESİMLER DİZİNİ"]);
    assert.deepEqual(section(model, "list-photos").indexRows.map((r) => r.label), ["Resim 3.1"]);
    for (const id of ["toc", "list-figures", "list-tables", "list-photos"]) {
      const s = section(model, id);
      assert.equal(s.rules.headings["1"].align, "center", id);
      assert.equal(s.generatedIndex.pageHeading, "Sayfa", id);
      assert.deepEqual([s.generatedIndex.style.lineHeight, s.generatedIndex.style.spaceAfterPt], [1.5, 0], id);
    }
    assert.equal(section(compile("<h1>Bir</h1>"), "list-figures"), undefined, "no list without items");
  });

  it("special pages: İç Kapak (14 pt bold, 10.02 mm top, two seals), ethics wording, ÖZET/ABSTRACT lines and keyword order", () => {
    const model = compile();
    const text = (id) => JSON.stringify(section(model, id).layout);
    const cover = section(model, "inner-cover");
    assert.equal(cover.rules.page.margins.topMm, 10.02);
    assert.deepEqual([cover.rules.body.fontSizePt, cover.rules.body.fontWeight, cover.rules.body.lineHeight, cover.rules.body.align], [14, 700, 1.5, "center"]);
    assert.match(text("inner-cover"), /AFYON KOCATEPE ÜNİVERSİTESİ[\s\S]*FEN EDEBİYAT FAKÜLTESİ[\s\S]*MOLEKÜLER BİYOLOJİ ve GENETİK BÖLÜMÜ[\s\S]*BİTİRME TEZİ/);
    assert.equal((text("inner-cover").match(/data:image\/(jpeg|png);base64/g) || []).length, 2, "AKÜ and Fen-Edebiyat Fakültesi seals");
    assert.match(text("inner-cover"), /Haziran, 2025/);
    assert.match(text("ethics"), /Moleküler Biyoloji ve Genetik Bölümü, bitirme tezi yazım kurallarına uygun olarak/);
    assert.equal((text("ethics").match(/"value":"•"|"text":"•"/g) || []).length, 6, "six bullet items");
    assert.match(text("ethics"), /beyan ederim\./);
    assert.match(text("abstract-tr"), /Bitirme Tezi/);
    assert.match(text("abstract-en-header"), /Graduation Thesis/);
    assert.match(text("abstract-en-header"), /Supervisor:/);
    assert.equal(section(model, "abstract").rules.body.firstLineIndentMm, 0);
    assert.match(text("abstract-footer"), /"hangingIndentMm":37\.52/);
    assert.match(text("abstract-en-footer"), /"hangingIndentMm":22/);
    const footer = section(model, "abstract-footer").layout.map((node) => node.text || "");
    assert.ok(footer.findIndex((line) => line.startsWith("Anahtar Kelimeler:")) < footer.findIndex((line) => /sayfa$/.test(line)), "guide order: keywords before the year + page count line");
    assert.match(footer.join("|"), /2025, .+ \+ .+ sayfa/);
  });

  it("DOCX carries the Word values: 30 mm margins, 1.5 lines, 20.7 pt after, heading numbers, footer 12.51 mm", async () => {
    const xml = await docxXml(compile());
    assert.match(xml, /<w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="1701" w:header="709" w:footer="709"/);
    assert.match(xml, /<w:pgMar w:top="568"/, "İç Kapak top margin 10.02 mm = 568 twips");
    assert.match(xml, /w:spacing w:after="414" w:before="0" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="lowerRoman"\/>/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="decimal"\/>/);
  });
});
