import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, groupThesisSections, templateFontFamilies } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { mcbuTipUzmanlik } from "../thesis/templates/mcbu-tip.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption) => `<figure class="academic-figure" data-kind="figure"><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { DEPARTMENT_NAME: "Kulak Burun Boğaz Hastalıkları", THESIS_TITLE: "TEZİN BAŞLIĞI", STUDENT_NAME: "Ayşe DEMİR", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Ali VELİ", YEAR: "2026" };
const main = `<h1>Giriş</h1><p>Metin.</p><h2>Alt Başlık</h2><h3>Üç</h3><h4>Dört</h4><h2>İki</h2><h1>Gereç ve Yöntem</h1>${figure("Şekil başlığı")}${table("Tablo başlığı")}`;
const compile = (html = main, extra = {}) => compileThesisDocument(mcbuTipUzmanlik, { values: { ...values, ...extra.values }, sectionContent: { preface: "<p>Önsöz.</p>", abstract: "<p>Özet.</p>", "abstract-en": "<p>Abstract.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", html, ["Soyad A. Eser. 2020."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("MCBÜ Tıp Fakültesi tıpta uzmanlık tezi template (mcbu-tip-uzmanlik-tr-v1)", () => {
  it("is valid, registered after the LEE entries and resolves with its source evidence", async () => {
    assert.deepEqual(validateThesisTemplate(mcbuTipUzmanlik), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: "mcbu-tip-uzmanlik-tr-v1" });
    assert.equal(fallback, false);
    assert.equal(template.status, "official");
    assert.deepEqual([template.universityId, template.instituteId, template.degreeType, template.language], ["mcbu", "tip", "specialization", "tr"]);
    assert.match(template.source.documentName, /MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu\.pdf/);
    assert.ok(template.source.verifiedAt && template.source.revisionDate && template.source.notes.length >= 8);
    const ids = THESIS_TEMPLATE_REGISTRY.map((entry) => entry.id);
    assert.ok(ids.indexOf("mcbu-tip-uzmanlik-tr-v1") > ids.indexOf("mcbu-lee-phd-tr-v1"));
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "mcbu-tip-uzmanlik-tr-v1").displayName, "Manisa Celal Bayar Üniversitesi · Tıp Fakültesi · Tıpta Uzmanlık Tezi");
    assert.deepEqual(templateFontFamilies(mcbuTipUzmanlik), ["Arial"], "Arial only (genuine system font, no Times New Roman)");
  });

  it("page and body values of the guide (4 cm / 2.5 cm, 30 mm top/bottom, Arial 12, left, 1.5 lines, 5-space indent)", () => {
    const t = mcbuTipUzmanlik;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 40, rightMm: 25 });
    assert.deepEqual([t.page.widthMm, t.page.heightMm], [210, 297]);
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.format], ["bottom", "center", "arabic"]);
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.align, b.lineHeight, b.spaceBeforePt, b.spaceAfterPt, b.firstLineIndentMm], ["Arial", 12, "left", 1.5, 0, 0, 5.88]);
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive" });
  });

  it("headings: Roman H1 centred 50 mm from the top with a 3 cm gap, '1.1.' sub-headings", () => {
    const h = mcbuTipUzmanlik.typography.headings;
    assert.deepEqual(Object.keys(h), ["1", "2", "3", "4"]);
    assert.deepEqual([h["1"].align, h["1"].textTransform, h["1"].pageBreakBefore, h["1"].numbering.sequence, h["1"].numbering.format], ["center", "uppercase", true, "roman-upper", "{1}."]);
    assert.ok(Math.abs(h["1"].spaceBeforePt * 25.4 / 72 - 20) < 1e-6, "30 mm margin + 20 mm = title 50 mm below the page top");
    assert.ok(Math.abs(h["1"].spaceAfterPt * 25.4 / 72 - 30) < 1e-6, "3 cm before the text");
    assert.deepEqual(["2", "3", "4"].map((l) => h[l].numbering.format), ["{1}.{2}.", "{1}.{2}.{3}.", "{1}.{2}.{3}.{4}."]);
    const model = compile();
    assert.deepEqual(model.headings.map((x) => `${x.label}|${x.title}`).slice(0, 7), ["I.|Giriş", "1.1.|Alt Başlık", "1.1.1.|Üç", "1.1.1.1.|Dört", "1.2.|İki", "II.|Gereç ve Yöntem", "III.|ÖZET"]);
  });

  it("captions: consecutive Arabic numbers, Tablo above / Şekil below; bibliography per the Ek-2 examples", () => {
    const t = mcbuTipUzmanlik;
    assert.deepEqual([t.tables.label, t.tables.position, t.figures.label, t.figures.position], ["Tablo", "above", "Şekil", "below"]);
    for (const rule of [t.tables, t.figures]) assert.deepEqual([rule.numbering, rule.labelFormat, rule.style.fontSizePt], [{ scope: "document", format: "{n}", sequence: "arabic" }, "{label} {number}", 12]);
    const model = compile();
    assert.deepEqual(model.indexSources.filter((entry) => entry.kind !== "toc").map((entry) => entry.label), ["Şekil 1", "Tablo 1"]);
    assert.match(buildThesisCss(model), /caption\{caption-side:top;/);
    const s = t.bibliography.style;
    assert.deepEqual([s.fontFamily, s.fontSizePt, s.lineHeight, s.hangingIndentMm, s.spaceAfterPt, t.bibliography.citationStyle], ["Arial", 12, 1, 6.35, 17.7, "numeric"]);
  });

  it("sections in the guide's order; front matter unnumbered; GİRİŞ = 1; ÖZET ... KAYNAKLAR continue the Roman chapter numbers", () => {
    const model = compile(main, { enabledSections: ["appendices"] });
    const ids = model.sections.map((s) => s.id);
    assert.deepEqual(ids, ["outer-cover", "inner-cover", "preface", "toc", "main", "abstract", "abstract-en", "appendices", "bibliography"]);
    const numbering = (id) => section(model, id).rules.page.numbering;
    for (const id of ["outer-cover", "inner-cover", "preface", "toc"]) assert.equal(numbering(id).enabled, false, id);
    assert.deepEqual([numbering("main").enabled, numbering("main").format, numbering("main").startAt, numbering("main").restart], [true, "arabic", 1, true]);
    for (const id of ["abstract", "abstract-en", "appendices", "bibliography"]) assert.equal(mcbuTipUzmanlik.sections.find((s) => s.id === id).titleNumbering, "continueH1", id);
    const labels = Object.fromEntries(numberThesisPages(groupThesisSections(model.sections), {}).map((n) => [n.sectionId, n.labels]));
    assert.deepEqual([labels["inner-cover"][0], labels.preface[0], labels.main[0]], ["", "", "1"]);
    const toc = section(model, "toc").html;
    assert.match(toc, /thesis-index-label">I\.<\/span> <span class="thesis-index-title">GİRİŞ/);
    assert.match(toc, /KAYNAKLAR/);
    assert.doesNotMatch(toc, /ÖNSÖZ|DIŞ KAPAK|İÇ KAPAK/, "preface, contents and covers are not listed (Ek-2)");
    assert.deepEqual([section(model, "toc").generatedIndex.leader, section(model, "toc").generatedIndex.pageHeading, section(model, "toc").generatedIndex.indentMm], ["none", "Sayfa", 0]);
    assert.equal(section(compile(), "appendices"), undefined, "EKLER is optional ('Gerekiyorsa')");
  });

  it("covers: outer and inner cover share the Ek-1 layout (measured gaps, 14 pt title, capitals, centred)", () => {
    const model = compile();
    for (const id of ["outer-cover", "inner-cover"]) {
      const cover = section(model, id);
      assert.deepEqual([cover.rules.body.fontFamily, cover.rules.body.align, cover.rules.page.margins.leftMm], ["Arial", "center", 40]);
      const text = JSON.stringify(cover.layout);
      for (const part of ["CELAL BAYAR ÜNİVERSİTESİ TIP FAKÜLTESİ", "Kulak Burun Boğaz Hastalıkları Anabilim Dalı", "Test Başlığı", "UZMANLIK TEZİ", "Ayşe DEMİR", "Tez Danışmanı", "Prof. Dr. Ali VELİ", "Manisa, 2026"]) assert.ok(text.includes(part), `${id}: ${part}`);
    }
    const gaps = mcbuTipUzmanlik.sections[0].blocks.filter((b) => b.type === "spacer").map((b) => b.heightMm);
    assert.deepEqual(gaps, [5.372, 41.72, 35.04, 0.492, 33.482, 3.852, 36.622], "baseline-to-baseline 10.24 / 47.25 / 43.56 / 5.51 / 38.35 / 8.72 / 41.49 mm in the guide example");
    assert.deepEqual(mcbuTipUzmanlik.sections[1].blocks, mcbuTipUzmanlik.sections[0].blocks, "dış ve iç kapak birbirinin benzeri");
    assert.equal(mcbuTipUzmanlik.sections[0].blocks.find((b) => b.field === "THESIS_TITLE").style.fontSizePt, 14);
  });

  it("DOCX: Arial only, page margins 30/25/30/40 mm, first-page heading spacing 20 mm before / 30 mm after", async () => {
    const xml = await docxXml(compile());
    assert.ok(xml.includes('w:left="2268"') && xml.includes('w:right="1417"') && xml.includes('w:top="1701"') && xml.includes('w:bottom="1701"'));
    assert.doesNotMatch(xml, /Times New Roman/);
    const zip = unzipSync(new Uint8Array(await (await buildThesisDocx(compile())).arrayBuffer()));
    const styles = strFromU8(zip["word/styles.xml"]);
    assert.match(styles, /w:styleId="Heading1"[\s\S]*?<w:spacing w:after="1701" w:before="1134"\/>/);
  });
});
