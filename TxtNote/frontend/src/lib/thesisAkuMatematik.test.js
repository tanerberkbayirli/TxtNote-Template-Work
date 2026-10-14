import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, groupThesisSections, templateFontFamilies } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { numberThesisPages } from "../../../../engine/src/pageLayout.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../../../../engine/src/registry.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { blockDescriptors, gapBetween } from "../../../../engine/src/blockGap.js";
import { akuMatematikLisans } from "../../../../engine/src/templates/aku-matematik.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""}><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Ayşe DEMİR", THESIS_TITLE: "Başlık", THESIS_TITLE_EN: "Title", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_TITLE_EN: "Prof.", ADVISOR_NAME: "Ali VELİ", SUBMISSION_MONTH: "Haziran", SUBMISSION_YEAR: "2025", DEFENSE_YEAR: "2025", YEAR: "2025", KEYWORDS_TR: "a, b, c, d", KEYWORDS_EN: "a, b, c, d" };
const main = `<h1>Literatür Bilgileri</h1><p>Metin.</p><h2>Alt Başlık</h2><h3>Üç</h3><h4>Dört</h4><h2>İki</h2><h1>Materyal ve Metot</h1><h2>Yine</h2>${figure("Şekil başlığı")}${figure("Resim başlığı", "photo")}${table("Çizelge başlığı")}`;
const compile = (html = main, extra = {}) => compileThesisDocument(akuMatematikLisans, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", html, ["Soyad, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ Matematik lisans tezi template (aku-matematik-lisans-tr-v1)", () => {
  it("is valid, registered and resolves with its source evidence", async () => {
    assert.deepEqual(validateThesisTemplate(akuMatematikLisans), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: "aku-matematik-lisans-tr-v1" });
    assert.equal(fallback, false);
    assert.equal(template.status, "official");
    assert.deepEqual([template.universityId, template.instituteId, template.degreeType, template.language], ["aku", "fef-matematik", "undergraduate", "tr"]);
    assert.match(template.source.documentName, /AKU_Matematik_Lisans_Tez_Sablonu_2025\.docx/);
    assert.ok(template.source.verifiedAt && template.source.revisionDate && template.source.notes.length >= 8);
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "aku-matematik-lisans-tr-v1").displayName, "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Matematik Bölümü · Lisans Tezi");
    assert.ok(templateFontFamilies(akuMatematikLisans).includes("Times New Roman"));
  });

  it("page, body and heading values of the template XML (30 mm all sides, 12 pt, 1.5 lines, no indent, blank line between blocks)", () => {
    const t = akuMatematikLisans;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 }, "sectPr pgMar 1701 twips");
    assert.deepEqual([t.page.footer.distanceMm, t.page.header.distanceMm], [12.5, 12.5], "sectPr footer/header 709 twips");
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.style], ["bottom", "center", { fontFamily: "Times New Roman", fontSizePt: 10 }]);
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.spaceBeforePt, b.firstLineIndentMm], ["Times New Roman", 12, 1.5, "justify", 0, 0]);
    assert.ok(Math.abs(b.spaceAfterPt - 20.7) < 1e-9, "one empty 12 pt / 1.5 line = 20.7 pt");
    const h = t.typography.headings;
    for (const level of ["1", "2", "3", "4"]) {
      assert.deepEqual([h[level].fontSizePt, h[level].fontWeight, h[level].align, h[level].lineHeight, h[level].spaceBeforePt, h[level].firstLineIndentMm], [12, 700, "left", 1.5, 0, 0], level);
      assert.ok(Math.abs(h[level].spaceAfterPt - 20.7) < 1e-9, level);
    }
    assert.deepEqual([h["1"].textTransform, h["1"].pageBreakBefore, h["1"].textTransformExceptions], ["uppercase", true, ["ve", "veya", "ile"]]);
    assert.equal(h["2"].textTransform, undefined, "H2-H4 letter case is UNKNOWN (as typed)");
    assert.deepEqual(["1", "2", "3", "4"].map((l) => h[l].numbering.format), ["{1}.", "{1}.{2}", "{1}.{2}.{3}", "{1}.{2}.{3}.{4}"]);
    assert.deepEqual([t.bibliography.style.spaceBeforePt, t.bibliography.style.spaceAfterPt, t.bibliography.style.hangingIndentMm, t.bibliography.style.lineHeight, t.bibliography.style.fontSizePt], [6, 0, 12.5, 1.5, 12]);
    assert.equal(t.tables.continuation.format, "{label} {number} (Devam) {title}", "template page: 'Çizelge 4.1 (Devam) …'");
    assert.deepEqual(t.tables.borders, { preset: "threeRule", widthPt: 0.5 });
    assert.deepEqual(t.typography.paragraphStyles.tableNote, { fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 6, spaceAfterPt: 6, firstLineIndentMm: 0 });
    assert.equal(t.equations.numberAlign, "right");
  });

  it("captions: Çizelge above, Şekil and Resim below, chapter numbers, bold label, 11 pt single, hanging under the text", () => {
    const t = akuMatematikLisans;
    const rules = { tables: t.tables, figures: t.figures, photo: t.captionKinds.photo };
    assert.deepEqual([rules.tables.label, rules.figures.label, rules.photo.label], ["Çizelge", "Şekil", "Resim"]);
    assert.deepEqual([rules.tables.position, rules.figures.position, rules.photo.position], ["above", "below", "below"]);
    for (const [key, rule] of Object.entries(rules)) {
      assert.deepEqual(rule.numbering, { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" });
      assert.deepEqual([rule.labelFormat, rule.labelStyle, rule.hangingIndent, rule.captionAlignment], ["{label} {number}", { fontWeight: 700 }, "label", "justify"]);
      assert.deepEqual([rule.style.fontSizePt, rule.style.lineHeight, rule.style.align, rule.style.spaceBeforePt, rule.style.spaceAfterPt], [11, 1, "justify", 0, key === "tables" ? 6 : 0], "the 6 pt after of Şekil/Resim captions is carried by blockGap (Word takes the larger of after/before)");
    }
    const model = compile();
    assert.deepEqual(model.headings.map((x) => `${x.label}|${x.title}`).slice(0, 8), ["1.|GİRİŞ", "2.|Literatür Bilgileri", "2.1|Alt Başlık", "2.1.1|Üç", "2.1.1.1|Dört", "2.2|İki", "3.|Materyal ve Metot", "3.1|Yine"]);
    assert.deepEqual(model.indexSources.filter((entry) => entry.kind !== "toc").map((entry) => entry.label), ["Şekil 3.1", "Resim 3.1", "Çizelge 3.1"]);
  });

  it("sections: only what the template defines; covers unnumbered, TEŞEKKÜR = i, GİRİŞ = 1, KAYNAKLAR numbered as the next chapter", () => {
    const model = compile(main, { enabledSections: ["symbols", "cv", "appendices"] });
    const ids = model.sections.map((s) => s.id);
    assert.deepEqual(ids.slice(0, 3), ["outer-cover", "inner-cover", "acknowledgements"]);
    for (const absent of ["ethics", "approval", "abstract-tr", "abstract-en-header"]) assert.ok(!ids.includes(absent), `${absent} is not in the template`);
    const order = ["acknowledgements", "toc", "symbols", "introduction", "main", "bibliography", "cv", "appendices"].map((id) => ids.indexOf(id));
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    assert.ok(order.every((index) => index >= 0));
    const rule = (id) => section(model, id).rules.page.numbering;
    assert.deepEqual([rule("outer-cover").enabled, rule("inner-cover").enabled], [false, false]);
    assert.deepEqual([rule("acknowledgements").format, rule("acknowledgements").startAt, rule("acknowledgements").restart], ["roman-lower", 1, true]);
    assert.deepEqual([rule("introduction").format, rule("introduction").startAt, rule("introduction").restart], ["arabic", 1, true]);
    const labels = Object.fromEntries(numberThesisPages(groupThesisSections(model.sections), {}).map((n) => [n.sectionId, n.labels]));
    assert.equal(labels.acknowledgements[0], "i");
    assert.equal(labels.introduction[0], "1");
    const toc = section(model, "toc").html;
    for (const title of ["TEŞEKKÜR", "İÇİNDEKİLER DİZİNİ", "SİMGELER ve KISALTMALAR DİZİNİ", "ÖZGEÇMİŞ", "EKLER", "GİRİŞ", "KAYNAKLAR", "LİTERATÜR BİLGİLERİ", "MATERYAL ve METOT"]) assert.ok(toc.includes(title), title);
    assert.doesNotMatch(toc, /KAPAK/);
    assert.equal(section(compile(), "cv"), undefined);
    assert.equal(section(compile(), "symbols"), undefined);
  });

  it("lists: ŞEKİLLER, ÇİZELGELER, RESİMLER DİZİNİ with the template XML rule (left, 1.5 lines, 0 pt after = 7.30 mm per line) and centred bold titles", () => {
    const model = compile();
    assert.deepEqual(model.sections.filter((s) => s.id.startsWith("list-")).map((s) => s.generatedIndex.title), ["ŞEKİLLER DİZİNİ", "ÇİZELGELER DİZİNİ", "RESİMLER DİZİNİ"]);
    for (const id of ["toc", "list-figures", "list-tables", "list-photos"]) {
      const s = section(model, id);
      assert.equal(s.rules.headings["1"].align, "center", id);
      assert.equal(s.generatedIndex.pageHeading, "Sayfa", id);
      assert.equal(s.generatedIndex.hanging, "label", id);
    }
    assert.deepEqual([section(model, "toc").generatedIndex.style.lineHeight, section(model, "toc").generatedIndex.style.spaceAfterPt], [1.5, 0]);
    const l = section(model, "list-figures").generatedIndex.style;
    assert.deepEqual([l.lineHeight, l.spaceBeforePt, l.spaceAfterPt, l.align], [1.5, 0, 0, "left"]);
    assert.ok(Math.abs(12 * 1.15 * l.lineHeight * 25.4 / 72 - 7.30) < 0.01, "line=360 of 12 pt TNR = 7.30 mm incl. wrapped lines");
    assert.equal(section(compile("<h1>Bir</h1>"), "list-figures"), undefined);
  });

  it("symbols table: template XML rules (header-only rows + last row), no top rule, cell margin 1.9 mm, no tab/hanging model", async () => {
    const sym = compile(main, { enabledSections: ["symbols"], sectionContent: { symbols: "<table><tbody><tr><th>Simgeler</th><th></th></tr><tr><td>a</td><td>b</td></tr><tr><th>Kısaltmalar</th><th></th></tr><tr><td>c</td><td>d</td></tr></tbody></table>" } });
    const s = section(sym, "symbols");
    assert.deepEqual(s.rules.tables.borders, { preset: "headerRules", widthPt: 0.5 });
    assert.equal(s.rules.body.tabStopMm, undefined);
    assert.equal(s.rules.body.hangingIndentMm, undefined);
    const css = buildThesisCss(sym);
    assert.match(css, /tr:not\(:has\(>td\)\)>\*\{border-bottom:0\.5pt solid #000 !important;\}/);
    assert.match(css, /last-child>tr:last-child>\*\{border-bottom:0\.5pt solid #000 !important;\}/);
    const xml = await docxXml(sym);
    const tbl = xml.slice(xml.indexOf("<w:tbl>"), xml.indexOf("</w:tbl>"));
    assert.equal((tbl.match(/<w:tcBorders><w:bottom w:val="single" w:color="000000" w:sz="4"\/>/g) || []).length, 4, "two header rows x 2 cells carry the rule");
    assert.match(tbl, /<w:tblBorders><w:top w:val="none"[^>]*\/><w:left w:val="none"[^>]*\/><w:bottom w:val="single" w:color="000000" w:sz="4"\/>/);
  });

  it("cover pages: Dış Kapak 12 pt single, İç Kapak 14 pt bold 1.5, no seals, placeholders", () => {
    const model = compile();
    const text = (id) => JSON.stringify(section(model, id).layout);
    const outer = section(model, "outer-cover");
    assert.deepEqual([outer.rules.body.fontSizePt, outer.rules.body.lineHeight, outer.rules.body.align], [12, 1, "center"]);
    assert.match(text("outer-cover"), /LİSANS TEZİ[\s\S]*Danışman[\s\S]*ANABİLİM DALI[\s\S]*Haziran 2025/);
    const inner = section(model, "inner-cover");
    assert.deepEqual([inner.rules.body.fontSizePt, inner.rules.body.fontWeight, inner.rules.body.lineHeight, inner.rules.body.align], [14, 700, 1.5, "center"]);
    assert.match(text("inner-cover"), /AFYON KOCATEPE ÜNİVERSİTESİ[\s\S]*FEN EDEBİYAT FAKÜLTESİ[\s\S]*LİSANS TEZİ[\s\S]*MATEMATİK BÖLÜMÜ[\s\S]*Haziran 2025/);
    assert.doesNotMatch(text("inner-cover"), /data:image/, "the template has no seals");
  });

  it("DOCX carries the Word values: 30 mm margins, 1.5 lines, 20.7 pt after, roman/arabic page number sections", async () => {
    const xml = await docxXml(compile());
    assert.match(xml, /<w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="1701" w:header="709" w:footer="709"/);
    assert.match(xml, /w:spacing w:after="414" w:before="0" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="lowerRoman"\/>/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="decimal"\/>/);
  });

  it("table note -> heading gap is note after + empty line (official p13 14.09 mm), pitch rule stays default elsewhere", () => {
    const rules = section(compile(), "introduction").rules;
    const d = Object.fromEntries(blockDescriptors(rules).map((x) => [x.key, x]));
    const gap = gapBetween(rules, d["p:tableNote"], d.h2);
    assert.equal(gap, 6 + rules.body.spaceAfterPt + (rules.headings["2"].spaceBeforePt || 0));
    const pitch = structuredClone(rules);
    delete pitch.lineSpacing.noteExitGap;
    assert.ok(gapBetween(pitch, d["p:tableNote"], d.h2) > gap, "default stays the paragraph-pitch rule");
  });
});
