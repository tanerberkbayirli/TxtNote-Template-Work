import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, templateFontFamilies, thesisSectionCss } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { derivedThesisValues, generatedIndexHtml } from "../thesis/generatedIndex.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { resolveSpecialPage, specialPageBlockVisible, validateSpecialPageBlocks } from "../thesis/specialPages.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuFbeMaster, akuFbePhd } from "../thesis/templates/aku-fbe.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""}><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Ada YILMAZ", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Can KAYA", DEPARTMENT_NAME: "Biyoloji", YEAR: "2026", DEFENSE_YEAR: "2026", DEFENSE_MONTH: "Ocak", KEYWORDS: "a, b, c, d" };
const main = `<h1>Materyal ve Metot</h1><p>Metin.</p><h2>Alt başlık ve konu</h2><h3>Üç</h3><h4>Dört</h4>${figure("Şekil başlığı")}${figure("Fotoğraf", "photo")}${table("Tablo başlığı")}`;
const compile = (template = akuFbeMaster, extra = {}) => compileThesisDocument(template, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş metni.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", main, ["Yazar, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ FBE template (aku-fbe-master-tr-v1, aku-fbe-phd-tr-v1)", () => {
  it("is valid, registered and differs between the degrees only in its degree strings", async () => {
    for (const template of [akuFbeMaster, akuFbePhd]) {
      assert.deepEqual(validateThesisTemplate(template), []);
      const { fallback, template: resolved } = await resolveThesisTemplate({ templateId: template.id });
      assert.equal(fallback, false, template.id);
      assert.equal(resolved.status, "official");
      assert.match(resolved.source.documentName, /Kılavuzu.*2020/);
      assert.ok(resolved.source.verifiedAt && resolved.source.revisionDate && resolved.source.notes.length >= 8);
    }
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "aku-fbe-phd-tr-v1").displayName, "Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · Doktora");
    assert.equal(akuFbeMaster.displayName, "Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · Yüksek Lisans");
    const normalise = (template, [cover, tr, en]) => JSON.stringify({ ...template, id: "x", degreeType: "x", displayName: "x" }).replaceAll(cover, "C").replaceAll(tr, "T").replaceAll(en, "E");
    assert.equal(normalise(akuFbeMaster, ["YÜKSEK LİSANS TEZİ", "Yüksek Lisans Tezi", "M.Sc. Thesis"]), normalise(akuFbePhd, ["DOKTORA TEZİ", "Doktora Tezi", "Ph.D. Thesis"]));
    assert.deepEqual(templateFontFamilies(akuFbeMaster), ["Times New Roman"]);
    assert.deepEqual(compile().systemFonts, ["Times New Roman"]);
  });

  it("page, body and heading values of the guide (3 cm, 12 pt, 1.5 lines, 20.7 pt gaps, page number 10 pt)", () => {
    const t = akuFbeMaster;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 });
    assert.equal(t.page.footer.distanceMm, 12.5);
    assert.deepEqual(t.page.numbering.style, { fontFamily: "Times New Roman", fontSizePt: 10 });
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive" });
    assert.equal(t.typography.body.spaceAfterPt, 20.7);
    assert.equal(t.typography.body.firstLineIndentMm, 0);
    for (const level of ["1", "2", "3", "4"]) {
      const h = t.typography.headings[level];
      assert.deepEqual([h.fontSizePt, h.fontWeight, h.align, h.spaceBeforePt, h.spaceAfterPt, h.lineHeight], [12, 700, "left", 0, 20.7, 1.5]);
    }
    assert.deepEqual(t.typography.headings["1"].textTransformExceptions, ["ve", "veya", "ile"]);
    assert.equal(t.bibliography.style.hangingIndentMm, 12.5);
    assert.deepEqual([t.bibliography.style.spaceBeforePt, t.bibliography.style.spaceAfterPt], [6, 0]);
  });

  it("numbers 1. GİRİŞ, chapters, 2.1 / 2.1.1 / 2.1.1.1, captions, equations and the last chapter KAYNAKLAR", () => {
    const model = compile();
    const labels = model.headings.map((h) => `${h.label} ${h.title}`);
    assert.deepEqual(labels.filter((l) => /^\d/.test(l)), ["1. GİRİŞ", "2. Materyal ve Metot", "2.1 Alt başlık ve konu", "2.1.1 Üç", "2.1.1.1 Dört", "3. KAYNAKLAR"]);
    const captions = model.indexSources.filter((entry) => entry.kind !== "toc");
    assert.deepEqual(captions.map((c) => c.label), ["Şekil 2.1", "Resim 2.1", "Çizelge 2.1"]);
    const toc = model.sections.find((s) => s.id === "toc");
    assert.match(toc.html, />2\.<\/span> <span class="thesis-index-title">MATERYAL ve METOT</, "TOC rows follow the heading transform, conjunctions stay lower case");
    assert.match(toc.html, /Alt Başlık ve Konu/, "level 2 is Title Case with lower-case conjunctions");
    assert.match(toc.html, /ÖZET/);
    assert.match(toc.html, /ÖZGEÇMİŞ/);
  });

  it("page numbering: covers/onay/etik unnumbered, roman from ÖZET, Arabic from GİRİŞ; abstract line is derived", () => {
    const model = compile();
    const rule = (id) => section(model, id).rules.page.numbering;
    for (const id of ["outer-cover", "inner-cover", "approval", "ethics"]) assert.equal(rule(id).enabled, false, id);
    assert.deepEqual([rule("abstract-tr").format, rule("abstract-tr").startAt, rule("abstract-tr").restart], ["roman-lower", 1, true]);
    assert.deepEqual([rule("introduction").format, rule("introduction").startAt, rule("introduction").restart], ["arabic", 1, true]);
    assert.equal(model.derivedFields.FRONT_PAGES_ROMAN, "frontLastLabel");
    assert.equal(model.derivedFields.MAIN_PAGES, "mainPageCount");
    const derived = derivedThesisValues(model, {});
    assert.match(derived.FRONT_PAGES_ROMAN, /^[ivx]+$/);
    assert.match(section(compile(), "abstract-footer").layoutBlocks.map((b) => b.text || "").join("|"), /2026, [ivx]+ \+ \d+ sayfa/);
  });

  it("special pages: measured spacers, optional lines through visibleWhen, jury rows 6-7 only when filled", () => {
    const withCo = compile(akuFbePhd, { values: { CO_ADVISOR_NAME: "Deniz AY", CO_ADVISOR_TITLE: "Dr. Öğr. Üyesi", JURY_6_TITLE_NAME: "Prof. Dr. Ali", JURY_7_TITLE_NAME: "Prof. Dr. Veli", PROJECT_NUMBER: "1", PROJECT_FUNDER: "BAP" } });
    const without = compile(akuFbeMaster);
    const text = (model, id) => JSON.stringify(section(model, id).layout);
    assert.match(text(withCo, "inner-cover"), /İkinci Danışman/);
    assert.match(text(withCo, "inner-cover"), /desteklenmiştir/);
    assert.doesNotMatch(text(without, "inner-cover"), /İkinci Danışman|desteklenmiştir/);
    assert.match(text(withCo, "approval"), /JURY_7_AFFILIATION/);
    assert.doesNotMatch(text(without, "approval"), /JURY_6_AFFILIATION|JURY_7_AFFILIATION/);
    assert.match(text(without, "approval"), /JURY_5_AFFILIATION/);
    // The empty line above the institute frame stays with five jurors and goes with seven.
    const spacers = (model) => section(model, "approval").layout.filter((node) => node.type === "spacer" || (node.type === "group" && node.blocks.every((b) => b.type === "spacer"))).length;
    assert.equal(spacers(without) - spacers(withCo), 1);
    // inner cover: 14 pt bold, gaps of whole 14 pt @ 1.5 lines (24.15 pt = 8.519 mm)
    const spacer = section(without, "inner-cover").layout.find((node) => node.type === "spacer");
    assert.ok(Math.abs(spacer.heightMm - 24.15 * 25.4 / 72) < 1e-6);
    assert.equal(section(without, "inner-cover").rules.body.fontSizePt, 14);
    // outer cover: text area x 55-155, first baseline 215.53 mm = top margin + 0.9336 em
    const cover = section(without, "outer-cover").rules.page;
    assert.deepEqual([cover.margins.leftMm, cover.margins.rightMm], [55, 55]);
    assert.ok(Math.abs(cover.margins.topMm + 0.9336 * 12 * 25.4 / 72 - 215.53) < 1e-6);
    // approval: cell x 28.1-178.1, frame is a thick-thin double border
    const approval = section(without, "approval");
    assert.deepEqual([approval.rules.page.margins.leftMm, approval.rules.page.margins.rightMm], [28.1, 31.9]);
    assert.equal(approval.layout.find((node) => node.border)?.border.docx.style, "thickThinSmallGap");
  });

  it("CSS: three-rule table on row cells, bold caption labels with hanging, figure box, table note, first-baseline placement", () => {
    const css = buildThesisCss(compile());
    assert.match(css, /table>thead:first-of-type>tr:first-child>\*[^{]*\{border-top:0\.5pt solid #000 !important;\}/);
    assert.doesNotMatch(css, /\.thesis-body table\{border-top/, "the table box must not carry the rule (it would enclose the caption)");
    assert.match(css, /figcaption\[data-thesis-caption\]::before\{font-weight:700;\}/);
    assert.match(css, /figure\[data-caption-kind="photo"\] img\{display:block;margin-left:auto;margin-right:auto;\}/);
    assert.match(css, /figure\[data-caption-kind="photo"\]\{margin:0pt 0 0pt;\}/);
    assert.match(css, /p\[data-thesis-style="tableNote"\]\{[^}]*font-size:10pt;/);
    assert.match(css, /--thesis-wb-/, "Word baseline placement is active");
    assert.match(css, /caption\{caption-side:top;[^}]*font-size:11pt/);
  });

  it("a paragraph hanging indent does not pad the section container (symbols list)", () => {
    const model = compile(akuFbeMaster, { enabledSections: ["symbols"] });
    const css = thesisSectionCss(section(model, "symbols"));
    assert.match(css, /\.thesis-body p\{[^}]*text-indent:-40\.69mm;padding-left:40\.69mm;tab-size:40\.69mm;/);
    const container = css.split("\n").find((line) => line.includes("thesis-flow-section[data-thesis-flow-section=\"symbols\"]") && line.startsWith(":is(") === false && /^\.thesis-flow-section/.test(line.replace(/^:is\(.*?\)/, ".thesis-flow-section")));
    assert.ok(!/padding-left:40\.69mm/.test(css.split("\n").find((line) => /^\.thesis-paper\[data-thesis-section="symbols"\]\{/.test(line))), "page container is not indented");
    assert.ok(container === undefined || !/padding-left:40\.69mm/.test(container));
  });

  it("lists of figures/tables/photos appear only with captions of that kind; dotted leaders are long enough", () => {
    const empty = compileThesisDocument(akuFbeMaster, { values }, "T", "<h1>Bir</h1><p>x</p>");
    assert.ok(!empty.sections.some((s) => s.id.startsWith("list-")));
    const full = compile();
    for (const id of ["list-figures", "list-tables", "list-photos"]) assert.ok(section(full, id), id);
    const rows = section(full, "list-figures").indexRows;
    assert.match(generatedIndexHtml(rows, section(full, "list-figures").generatedIndex), /\.{300}/);
    assert.equal(section(full, "list-photos").generatedIndex.title, "RESİMLER DİZİNİ");
  });

  it("DOCX carries the Word values: margins, footer distance, 1.5 lines, 20.7 pt spacing, cover margins", async () => {
    const xml = await docxXml(compile());
    assert.match(xml, /<w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="1701" w:header="709" w:footer="709"/);
    assert.match(xml, /<w:pgMar w:top="11995" w:right="3118" w:bottom="567" w:left="3118"/);
    assert.match(xml, /w:spacing[^>]*w:after="414"[^>]*w:line="360" w:lineRule="auto"/);
    assert.match(xml, /w:val="Times New Roman"|w:ascii="Times New Roman"/);
    assert.match(xml, /thickThinSmallGap/);
  });
});

describe("generic special-page condition noneFilled", () => {
  it("shows a block only while all of its fields are empty", () => {
    const block = { type: "spacer", heightMm: 1, visibleWhen: { noneFilled: ["A", "B"] } };
    assert.equal(specialPageBlockVisible(block, {}), true);
    assert.equal(specialPageBlockVisible(block, { A: " " }), true);
    assert.equal(specialPageBlockVisible(block, { B: "x" }), false);
    const placeholders = { A: { label: "a", type: "text" }, B: { label: "b", type: "text" } };
    assert.deepEqual(validateSpecialPageBlocks([block], { path: "b", placeholders }), []);
    assert.ok(validateSpecialPageBlocks([{ ...block, visibleWhen: { noneFilled: ["C"] } }], { path: "b", placeholders }).length);
    assert.ok(validateSpecialPageBlocks([{ ...block, visibleWhen: { noneFilled: ["A"], anyFilled: ["B"] } }], { path: "b", placeholders }).length);
    assert.equal(resolveSpecialPage([block], { definitions: placeholders, values: { A: "x" } }).blocks.length, 0);
  });
});

describe("additive paragraph spacing at forced page breaks", () => {
  it("a page-starting heading is not pushed down by the previous paragraph's space-after", () => {
    const css = buildThesisCss(compile());
    const rules = css.split("\n").filter((line) => /"main"\]\) \.thesis-body p\+h/.test(line));
    assert.ok(rules.some((line) => /p\+h2\{margin-top:20\.7pt\}/.test(line)), "ordinary headings keep the sum");
    assert.ok(!rules.some((line) => /p\+h1\{/.test(line)), "chapter headings (pageBreakBefore) get no summed margin");
  });
});
