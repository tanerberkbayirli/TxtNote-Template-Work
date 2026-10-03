import assert from "node:assert/strict";
import { describe, it } from "node:test";
import generic from "../thesis/templates/generic.js";
import { FIXTURE_REGISTRY } from "./thesisFixtures.js";
import { THESIS_TEMPLATE_REGISTRY, findThesisTemplateDescriptor, resolveThesisTemplate } from "../thesis/registry.js";
import { buildThesisCss, buildThesisPrintHtml, compileThesisDocument, formatNumber, groupThesisSections, resolvePlaceholders, resolveSectionRules } from "../thesis/engine.js";
import { buildThesisPdf, buildThesisDocx } from "../thesis/export.js";
import { numberThesisPages, pageMetrics, PX_PER_MM } from "../thesis/pageLayout.js";
import { pageSlices } from "./academicLayout.js";
import { normalizeLengthMm, validateThesisRegistry, validateThesisTemplate } from "../thesis/validation.js";
import { migrateAcademicNote } from "./researchMigrate.js";
import { strFromU8, unzipSync } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const choose = (id) => FIXTURE_REGISTRY.find((entry) => entry.id === id);

describe("thesis template validation", () => {
  it("accepts the generic template and rejects invalid dimensions, sections and placeholders", () => {
    assert.deepEqual(validateThesisTemplate(generic), []);
    const bad = structuredClone(generic);
    bad.page.margins.leftMm = 200;
    bad.sections.push({ ...bad.sections[0] });
    bad.sections[0].content += "{{UNKNOWN_FIELD}}";
    bad.typography.body.fontSizePt = 0;
    bad.page.numbering.format = "invalid";
    const errors = validateThesisTemplate(bad).join(" ");
    for (const word of ["kenar boşlukları", "duplicate section", "UNKNOWN_FIELD", "fontSizePt", "format"]) assert.match(errors, new RegExp(word));
  });
  it("checks unique registry IDs and normalizes units", () => {
    assert.deepEqual(validateThesisRegistry(THESIS_TEMPLATE_REGISTRY), []);
    assert.match(validateThesisRegistry([choose("fixture-university-a-master-tr-v1"), choose("fixture-university-a-master-tr-v1")]).join(" "), /duplicate template id/);
    assert.equal(normalizeLengthMm(2.5, "cm"), 25);
    assert.ok(Math.abs(normalizeLengthMm(72, "pt") - 25.4) < 0.0001);
  });
});

describe("thesis registry and fallback", () => {
  it("resolves by university, institute, degree and language", async () => {
    const result = await resolveThesisTemplate({ universityId: "fixture-university-c", instituteId: "research", degreeType: "phd", language: "en" }, FIXTURE_REGISTRY);
    assert.equal(result.fallback, false);
    assert.equal(result.template.id, "fixture-university-c-phd-en-v1");
    const old = choose("fixture-university-a-master-tr-v1");
    const newer = { ...old, id: "fixture-university-a-master-tr-v2", templateVersion: "2.0.0" };
    assert.equal(findThesisTemplateDescriptor({ universityId: old.universityId, instituteId: old.instituteId, degreeType: old.degreeType, language: old.language }, [old, newer]).id, newer.id);
    assert.equal(findThesisTemplateDescriptor({ templateId: old.id }, [old, newer]).id, old.id);
  });
  it("returns a visibly generic template for unknown or malformed entries", async () => {
    const missing = await resolveThesisTemplate({ universityId: "unknown", instituteId: "none", degreeType: "master", language: "tr" });
    assert.equal(missing.fallback, true);
    assert.equal(missing.template.status, "generic");
    const badRegistry = [{ ...choose("fixture-university-a-master-tr-v1"), load: async () => ({ default: { id: "bad" } }) }];
    const bad = await resolveThesisTemplate({ templateId: badRegistry[0].id }, badRegistry);
    assert.equal(bad.fallback, true);
  });
});

describe("thesis engine", () => {
  it("builds covers from template blocks and updates placeholders in the resolved page", async () => {
    const a = (await resolveThesisTemplate({ templateId: "fixture-university-a-master-tr-v1" }, FIXTURE_REGISTRY)).template;
    const b = (await resolveThesisTemplate({ templateId: "fixture-university-b-master-tr-v1" }, FIXTURE_REGISTRY)).template;
    const first = compileThesisDocument(a, { values: { STUDENT_NAME: "Ada", YEAR: "2026" } }, "Eski başlık", "").sections[0];
    const changed = compileThesisDocument(a, { values: { STUDENT_NAME: "Ada", YEAR: "2026" } }, "Yeni başlık", "").sections[0];
    const other = compileThesisDocument(b, { values: { STUDENT_NAME: "Ada" } }, "Yeni başlık", "").sections[0];
    assert.equal(first.layoutBlocks[0].type, "spacer");
    assert.match(first.html, /Eski başlık/);
    assert.match(changed.html, /Yeni başlık/);
    assert.match(changed.html, /Ada/);
    assert.notEqual(changed.html, other.html);
    assert.doesNotMatch(other.html, /\sstyle=/);
    const coverCss = buildThesisCss({ sections: [other] });
    assert.match(coverCss, /data-thesis-block="1"\]\{font-family:"Arial";/);
    assert.match(coverCss, /text-align:left/);
    assert.match(buildThesisCss(compileThesisDocument(b, {}, "Tez", "")), /35mm/);
  });
  it("uses exact A4 geometry and counts roman/front and arabic/body continuation pages", () => {
    const model = compileThesisDocument(generic, {}, "Tez", "<p>Body content</p>");
    const metrics = pageMetrics(model.sections[0].rules.page);
    assert.ok(Math.abs(metrics.widthPx - 210 * PX_PER_MM) < 1e-9);
    assert.ok(Math.abs(metrics.heightPx - 297 * PX_PER_MM) < 1e-9);
    assert.ok(Math.abs(metrics.contentWidthPx - 155 * PX_PER_MM) < 1e-9);
    assert.ok(Math.abs(metrics.contentHeightPx - 247 * PX_PER_MM) < 1e-9);
    const labels = Object.fromEntries(numberThesisPages(model.sections, { abstract: 2, main: 3 }).map((item) => [item.sectionId, item.labels]));
    assert.deepEqual(labels.cover, [""]);
    assert.deepEqual(labels.abstract, ["i", "ii"]);
    assert.deepEqual(labels.toc, ["iii"]);
    assert.deepEqual(labels.main, ["1", "2", "3"]);
    assert.deepEqual(labels.bibliography, ["4"]);
  });
  it("splits long flow before a protected line and a forced heading break", () => {
    assert.deepEqual(pageSlices(1250, [{ top: 480, bottom: 520 }], 500, [800]), [
      { start: 0, height: 480 },
      { start: 480, height: 320 },
      { start: 800, height: 450 },
    ]);
  });
  it("resolves section page and typography overrides without changing global rules", async () => {
    const { template } = await resolveThesisTemplate({ templateId: "fixture-university-b-master-tr-v1" }, FIXTURE_REGISTRY);
    const cover = resolveSectionRules(template, template.sections[0]);
    const main = resolveSectionRules(template, template.sections.find((section) => section.type === "mainContent"));
    assert.equal(cover.page.numbering.enabled, false);
    assert.equal(main.page.numbering.format, "arabic");
    assert.equal(main.page.margins.leftMm, 35);
    assert.equal(main.body.fontFamily, "Arial");
    assert.equal(template.page.numbering.enabled, true);
  });
  it("substitutes custom placeholders and detects required values", () => {
    const definitions = { CUSTOM_FIELD: { label: "Custom", type: "text", required: true } };
    assert.deepEqual(resolvePlaceholders("X {{CUSTOM_FIELD}}", definitions, {}), { text: "X ", missing: ["CUSTOM_FIELD"] });
    assert.deepEqual(resolvePlaceholders("X {{CUSTOM_FIELD}}", definitions, { CUSTOM_FIELD: "Y" }), { text: "X Y", missing: [] });
  });
  it("resolves legacy advisor and department keys through the new placeholder aliases", () => {
    const template = structuredClone(generic);
    template.sections[0].blocks.push({ type: "text", value: "{{SECOND_ADVISOR_NAME}} · {{DEPARTMENT}}" });
    const model = compileThesisDocument(template, { values: { CO_ADVISOR_NAME: "Dr. Ece", DEPARTMENT_NAME: "Bilgisayar" } }, "Tez", "");
    assert.match(model.sections[0].html, /Dr\. Ece · Bilgisayar/);
    assert.equal(model.values.SECOND_ADVISOR_NAME, "Dr. Ece");
    assert.equal(model.values.DEPARTMENT, "Bilgisayar");
  });
  it("shares a physical page only when pageBreakBefore is false and page rules agree", () => {
    const template = structuredClone(generic);
    template.sections.splice(2, 0, { id: "front-note", type: "custom", title: "Ön not", status: "required", group: "front", pageBreakBefore: false, content: "Devam metni", overrides: { page: { numbering: { format: "roman-lower" } } } });
    const model = compileThesisDocument(template, {}, "Tez", "<p>Body content</p>");
    const groups = groupThesisSections(model.sections);
    assert.deepEqual(groups.find((group) => group.id === "abstract").sections.map((section) => section.id), ["abstract", "front-note"]);
    assert.deepEqual(numberThesisPages(groups).find((item) => item.sectionId === "abstract").labels, ["i"]);
    assert.equal((buildThesisPrintHtml(model).match(/class="thesis-paper"/g) || []).length, groups.length);
    template.sections[2].pageBreakBefore = true;
    assert.equal(groupThesisSections(compileThesisDocument(template, {}, "Tez", "").sections).some((group) => group.id === "front-note"), true);
  });
  it("numbers roman, arabic and letter sequences", () => {
    assert.equal(formatNumber(4, "roman-lower"), "iv");
    assert.equal(formatNumber(4, "roman-upper"), "IV");
    assert.equal(formatNumber(4, "arabic"), "4");
    assert.equal(formatNumber(27, "alpha-upper"), "AA");
  });
  it("compiles structural order, optional sections and a heading based TOC", () => {
    const model = compileThesisDocument(generic, { enabledSections: ["appendices"], values: { STUDENT_NAME: "Ada" } }, "Çalışma", "<h1>Giriş</h1><h2>Amaç</h2>");
    assert.deepEqual(model.sections.map((section) => section.id), ["cover", "abstract", "toc", "main", "bibliography", "appendices"]);
    assert.match(model.sections[0].html, /Ada/);
    assert.match(model.sections[2].html, /Giriş/);
    assert.match(model.sections[2].html, /Amaç/);
    const noOptional = compileThesisDocument(generic, {}, "", "");
    assert.equal(noOptional.sections.some((section) => section.id === "appendices"), false);
  });
  it("styles every editor line as a template paragraph, in the editor and in print", () => {
    const model = compileThesisDocument(generic, {}, "T", "Bir\nİki");
    const css = buildThesisCss(model);
    // Print has no .rich-text-body: without pre-wrap the lines ran together into one paragraph.
    assert.match(css, /\[data-thesis-flow-section="main"\]\) \.thesis-body\{[^}]*text-indent:10mm each-line;white-space:pre-wrap;/);
    assert.match(css, /"main"\]\) \.thesis-body :is\(ul,ol,table[^}]*\{text-indent:0;\}/);
    assert.match(css, /"bibliography"\]\) \.thesis-body\{font-family:"Times New Roman";font-size:12pt;line-height:1\.5;text-align:left;[^}]*text-indent:0mm each-line/);
  });
  it("gives every bundled template distinct H1/H2/H3 numbers", async () => {
    // A fixture used "{1}.{2}" for H3 too, so H2 and H3 both read 1.1 (editor, TOC, PDF, DOCX).
    for (const entry of THESIS_TEMPLATE_REGISTRY) {
      const { template } = await resolveThesisTemplate({ templateId: entry.id });
      // Only templates that enable heading numbering (a source may define none; the engine then renders unnumbered headings).
      if (!Object.values(template.typography.headings).some((style) => style.numbering)) continue;
      const model = compileThesisDocument(template, {}, "T", "<h1>Bir</h1><h2>İki</h2><h3>Üç</h3><h3>Dört</h3>");
      const labels = model.headings.map((heading) => heading.label);
      assert.equal(new Set(labels).size, labels.length, `${entry.id}: ${labels}`);
      // A template may end its labels with a period (MCBÜ: "1.1.1."), number an introduction section first (AKÜ: "1. GİRİŞ", so this H1 is chapter 2) or restart the sub-headings in every chapter without the chapter number (AKÜ SBE: "1.1." for H3).
      assert.match(model.headings.find((heading) => heading.level === 3).label, /^(?:[12]\.)?1\.1\.?$/, entry.id);
    }
    const early = compileThesisDocument(generic, {}, "T", "<h2>Önce</h2><h1>Bir</h1>");
    assert.deepEqual(early.headings.map((heading) => heading.label), ["0.1", "1"]);
  });
  it("uses the existing manual bibliography entries in the bibliography section", () => {
    const model = compileThesisDocument(generic, {}, "Tez", "", ["Yazar, A. (2026). Eser."]);
    const section = model.sections.find((item) => item.type === "bibliography");
    assert.match(section.html, /Yazar, A\. \(2026\)\. Eser\./);
    assert.match(section.suffixHtml, /thesis-bibliography/);
  });
  it("produces different editor and print geometry for fixture templates", async () => {
    const a = (await resolveThesisTemplate({ templateId: "fixture-university-a-master-tr-v1" }, FIXTURE_REGISTRY)).template;
    const b = (await resolveThesisTemplate({ templateId: "fixture-university-b-master-tr-v1" }, FIXTURE_REGISTRY)).template;
    const c = (await resolveThesisTemplate({ templateId: "fixture-university-c-phd-en-v1" }, FIXTURE_REGISTRY)).template;
    const docs = [a, b, c].map((template) => compileThesisDocument(template, {}, "Test", "<h1>Test</h1>"));
    const css = docs.map(buildThesisCss);
    assert.match(css[0], /Times New Roman/);
    assert.match(css[1], /Arial/);
    assert.match(css[1], /35mm/);
    assert.notDeepEqual(docs[0].sections.map((section) => section.id), docs[2].sections.map((section) => section.id));
    assert.match(css[2], /break-before:page/);
    assert.match(buildThesisPrintHtml(docs[1]), /@page thesis_main/);
  });
  it("keeps thesis data when the existing research migration runs", () => {
    const thesis = { templateId: "demo", sectionContent: { abstract: "<p>Metin</p>" } };
    const note = migrateAcademicNote({ title: "", content: "", researchData: { thesis } });
    assert.deepEqual(note.researchData.thesis, thesis);
  });
});

describe("thesis export", () => {
  it("exports paragraph indentation to thesis PDF and inline formatting to DOCX", async () => {
    const html = '<p>Normal</p><p data-txt-indent="1"><span class="fmt-color-red fmt-highlight-yellow fmt-pt-16">Indented</span></p>';
    const model = compileThesisDocument(generic, {}, "Tez", html);
    const css = buildThesisCss(model);
    assert.match(css, /\.thesis-body \[data-txt-indent="1"\]\{margin-left:5mm\}/);

    const docx = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
    const xml = strFromU8(unzipSync(docx)["word/document.xml"]);
    assert.match(xml, /<w:color w:val="E8A0A0"\s*\/>/);
    assert.match(xml, /<w:shd[^>]*w:fill="FFF2A8"/);
    assert.match(xml, /<w:sz w:val="32"\s*\/>/);
    assert.match(xml, /<w:ind[^>]*w:left="283"/);

    const pdf = new Uint8Array(await (await buildThesisPdf(model)).arrayBuffer());
    const task = getDocument({ data: pdf, useSystemFonts: true, disableFontFace: true });
    const parsed = await task.promise;
    const items = [];
    for (let page = 1; page <= parsed.numPages; page += 1) items.push(...(await (await parsed.getPage(page)).getTextContent()).items);
    const normal = items.find((item) => item.str === "Normal");
    const indented = items.find((item) => item.str === "Indented");
    assert.ok(normal && indented);
    assert.ok(indented.transform[4] - normal.transform[4] > 12, "5 mm paragraph indent should move PDF text right by about 14 pt");
    await task.destroy();
  });

  it("preserves safe external links in thesis DOCX and keeps invalid destinations as text", async () => {
    const model = compileThesisDocument(generic, {}, "Tez", '<p><a href="https://example.org/source?q=1">Kaynak bağlantısı</a> <a href="javascript:alert(1)">güvensiz bağlantı</a></p>');
    const bytes = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
    const files = unzipSync(bytes);
    const xml = strFromU8(files["word/document.xml"]);
    const relationships = strFromU8(files["word/_rels/document.xml.rels"]);
    assert.match(xml, /<w:hyperlink\b/);
    assert.match(xml, /Kaynak bağlantısı/);
    assert.match(xml, /güvensiz bağlantı/);
    assert.match(relationships, /Target="https:\/\/example\.org\/source\?q=1" TargetMode="External"/);
    assert.doesNotMatch(relationships, /javascript:/i);
  });

  it("starts a new PDF page before a heading when the template requires it", async () => {
    const content = "<p>Girişten önceki metin.</p><h1>Birinci bölüm</h1><p>Bölüm metni.</p>";
    const forcedTemplate = structuredClone(generic);
    forcedTemplate.typography.headings["1"].pageBreakBefore = true;
    const ordinary = compileThesisDocument(generic, {}, "Tez", content);
    const forced = compileThesisDocument(forcedTemplate, {}, "Tez", content);
    const ordinaryTask = getDocument({ data: new Uint8Array(await (await buildThesisPdf(ordinary)).arrayBuffer()), useSystemFonts: true, disableFontFace: true });
    const forcedTask = getDocument({ data: new Uint8Array(await (await buildThesisPdf(forced)).arrayBuffer()), useSystemFonts: true, disableFontFace: true });
    const [ordinaryPdf, forcedPdf] = await Promise.all([ordinaryTask.promise, forcedTask.promise]);
    assert.equal(forcedPdf.numPages, ordinaryPdf.numPages + 1);
    await Promise.all([ordinaryTask.destroy(), forcedTask.destroy()]);
  });
  it("applies cover text transformation to both PDF and DOCX", async () => {
    const { template } = await resolveThesisTemplate({ templateId: "fixture-university-a-master-tr-v1" }, FIXTURE_REGISTRY);
    const model = compileThesisDocument(template, { values: { STUDENT_NAME: "Ada" } }, "Yapay Zeka Sistemleri", "");
    const pdf = new Uint8Array(await (await buildThesisPdf(model)).arrayBuffer());
    const docx = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
    const task = getDocument({ data: pdf, useSystemFonts: true, disableFontFace: true });
    const parsed = await task.promise;
    const coverText = (await (await parsed.getPage(1)).getTextContent()).items.map((item) => item.str).join(" ");
    assert.match(coverText, /YAPAY ZEKA/);
    assert.match(strFromU8(unzipSync(docx)["word/document.xml"]), /YAPAY ZEKA SİSTEMLERİ/);
    await task.destroy();
  });
  it("writes PDF and DOCX files from the same compiled page rules", async () => {
    const model = compileThesisDocument(generic, { values: { STUDENT_NAME: "Ada" } }, "Tez", "<h1>Giriş</h1><p>Metin</p>");
    const pdf = new Uint8Array(await (await buildThesisPdf(model)).arrayBuffer());
    const docx = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
    assert.equal(Buffer.from(pdf.subarray(0, 5)).toString(), "%PDF-");
    assert.equal(Buffer.from(docx.subarray(0, 2)).toString(), "PK");
    assert.ok(pdf.length > 10000 && docx.length > 10000);
    const xml = strFromU8(unzipSync(docx)["word/document.xml"]);
    assert.match(xml, /Giriş/);
    assert.match(xml, /pgNumType/);
    assert.match(xml, /pgMar/);
    // Word's own A4 and 25/25/30/25 mm, rounded (docx's converter floors to 11905 × 16837).
    assert.match(xml, /<w:pgSz w:w="11906" w:h="16838"/);
    assert.match(xml, /<w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1701"/);
    const pdfTask = getDocument({ data: pdf, useSystemFonts: true, disableFontFace: true });
    const parsedPdf = await pdfTask.promise;
    const frontPage = await parsedPdf.getPage(2);
    const tocPage = await parsedPdf.getPage(3);
    const mainPage = await parsedPdf.getPage(4);
    assert.ok((await frontPage.getTextContent()).items.some((item) => item.str === "i"));
    assert.ok((await tocPage.getTextContent()).items.some((item) => item.str === "ii"));
    const pageText = (await mainPage.getTextContent()).items.map((item) => item.str).join(" ");
    assert.match(pageText, /Giriş/);
    assert.match(pageText, /Metin/);
    await pdfTask.destroy();
  });
  it("writes a live Word TOC field with a cached result and only selected thesis headings mapped into it", async () => {
    const template = structuredClone(generic);
    const hidden = { id: "hidden-outline", type: "custom", title: "Hidden outline", status: "required", group: "body", mode: "editable", tocEntry: "none", content: "<h1>Hidden section heading</h1>", order: 8 };
    template.sections.push(hidden);
    const model = compileThesisDocument(template, {}, "Tez", "<h1>Chapter title</h1><h2>Subchapter title</h2><h1 data-unnumbered=\"true\">Unnumbered body heading</h1>");
    const data = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
    const entries = unzipSync(data);
    const documentXml = strFromU8(entries["word/document.xml"]);
    const settingsXml = strFromU8(entries["word/settings.xml"]);
    const stylesXml = strFromU8(entries["word/styles.xml"]);
    assert.match(documentXml, /w:fldCharType="begin"[^>]*w:dirty="true"/);
    assert.match(documentXml, /TOC \\h \\f &quot;A&quot; \\t &quot;ThesisHeading1Index,1,ThesisHeading2Index,2,Heading 1,1,Heading 2,2/);
    assert.match(documentXml, /Chapter title/);
    assert.match(documentXml, /Subchapter title/);
    assert.match(documentXml, /Unnumbered body heading/);
    assert.match(documentXml, /Hidden section heading/);
    assert.match(documentXml, /w:pStyle w:val="ThesisHeading1Excluded"/);
    assert.doesNotMatch(documentXml, /ThesisHeading1Excluded,1/);
    assert.match(documentXml, /w:bookmarkStart w:name="_ref_main_source_0"/);
    assert.match(settingsXml, /<w:updateFields\s*\/>/);
    assert.match(stylesXml, /w:styleId="ThesisHeading1Excluded"[\s\S]*w:outlineLvl w:val="0"/);
    assert.match(stylesXml, /w:styleId="TOC1"/);
  });
  it("keeps continuous sections on one PDF/Word page and paginates long main text", async () => {
    const template = structuredClone(generic);
    template.sections.splice(2, 0, { id: "front-note", type: "custom", title: "Ön not", status: "required", group: "front", pageBreakBefore: false, content: "Kısa devam", overrides: { page: { numbering: { format: "roman-lower" } } } });
    const mainText = `<p>BAŞLANGIÇ İŞARET ${"Uzun tez metni sayfa içinde okunur kalır. ".repeat(500)} SON İŞARET</p>`;
    const continuous = compileThesisDocument(template, {}, "Tez", mainText);
    const continuousPdf = new Uint8Array(await (await buildThesisPdf(continuous)).arrayBuffer());
    const task = getDocument({ data: continuousPdf, useSystemFonts: true, disableFontFace: true });
    const pdf = await task.promise;
    assert.ok(pdf.numPages >= 6);
    const text = (await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => (await (await pdf.getPage(index + 1)).getTextContent()).items.map((item) => item.str).join(" ")))).join(" ");
    assert.match(text, /BAŞLANGIÇ İŞARET/);
    assert.match(text, /SON İŞARET/);
    const firstPage = await pdf.getPage(1);
    assert.ok(Math.abs(firstPage.view[2] - 595.28) < 1 && Math.abs(firstPage.view[3] - 841.89) < 1);
    await task.destroy();
    const docx = new Uint8Array(await (await buildThesisDocx(continuous)).arrayBuffer());
    assert.match(strFromU8(unzipSync(docx)["word/document.xml"]), /w:val="continuous"/);
    template.sections[2].pageBreakBefore = true;
    const separatedPdf = new Uint8Array(await (await buildThesisPdf(compileThesisDocument(template, {}, "Tez", mainText))).arrayBuffer());
    const otherTask = getDocument({ data: separatedPdf, useSystemFonts: true, disableFontFace: true });
    const separated = await otherTask.promise;
    assert.equal(separated.numPages, pdf.numPages + 1);
    await otherTask.destroy();
  });
  it("keeps the fixture C declaration special page on its own sheet despite numbered chapter breaks", async () => {
    const { template } = await resolveThesisTemplate({ templateId: "fixture-university-c-phd-en-v1" }, FIXTURE_REGISTRY);
    const model = compileThesisDocument(template, {}, "Thesis", "<p>Body content</p>");
    assert.deepEqual(groupThesisSections(model.sections).find((group) => group.id === "declaration").sections.map((section) => section.id), ["declaration"]);
    const task = getDocument({ data: new Uint8Array(await (await buildThesisPdf(model)).arrayBuffer()), useSystemFonts: true, disableFontFace: true });
    const pdf = await task.promise;
    assert.equal(pdf.numPages, 7);
    await task.destroy();
  });
});
