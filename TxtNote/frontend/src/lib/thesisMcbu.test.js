import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { mcbuMaster, mcbuPhd } from "../thesis/templates/mcbu.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../thesis/registry.js";
import { buildThesisCss, compileThesisDocument, groupThesisSections } from "../thesis/engine.js";
import demoUniversityA from "../thesis/templates/demo-a.js";
import { buildThesisPageModel } from "../thesis/pageLayout.js";
import { resolveGeneratedIndexes } from "../thesis/generatedIndex.js";
import { buildThesisDocx } from "../thesis/export.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { mmToTwip } from "../thesis/units.js";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMr8AAAAASUVORK5CYII=";
const main = `<h1>Kuramsal Çerçeve</h1><p>Metin<sup class="academic-footnote" data-fn-id="a" data-fn-text="Dipnot metni.">1</sup></p><h2>Alt</h2><h3>Alt alt</h3><h4>Dört</h4><figure><img src="${image}" width="120" height="60"><figcaption>Bir şekil</figcaption></figure><table><caption>Bir tablo</caption><tr><th>A</th></tr><tr><td>1</td></tr></table><h1>Yöntem</h1><figure><img src="${image}" width="120" height="60"><figcaption>İkinci şekil</figcaption></figure>`;
const values = { YEAR: "2026", STUDENT_NAME: "Çağrı ÖZDOĞAN", DEPARTMENT_NAME: "Eğitim Bilimleri", DEPARTMENT_NAME_EN: "Educational Sciences", PROGRAM_NAME: "Eğitim Programları ve Öğretim", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "İlknur ÇİÇEK", KEYWORDS: "a, b, c, d, e", KEYWORDS_EN: "a, b, c, d, e", PAGE_COUNT: "48" };
const thesis = (extra = {}) => ({ values, sectionContent: { introduction: "<p>Giriş</p>", cv: "<p>Özgeçmiş metni</p>" }, enabledSections: ["cv", "appendices"], ...extra });
const compile = (template = mcbuPhd, state = thesis()) => compileThesisDocument(template, state, "Çevrimiçi öğrenme", main, []);
const section = (model, id) => model.sections.find((item) => item.id === id);
const texts = (nodes) => nodes.flatMap((node) => node.type === "group" ? texts(node.blocks) : node.type === "text" ? [node.text] : []);
const mm = (pt) => pt * 25.4 / 72;

describe("Task 10B.2 final details", () => {
  it("old metadata without English department opens with an advisory warning and neutral placeholder", () => {
    const legacy = { ...values }; delete legacy.DEPARTMENT_NAME_EN;
    const model = compile(mcbuMaster, thesis({ values: legacy }));
    assert.deepEqual(model.validation.warnings.map((w) => w.field), ["DEPARTMENT_NAME_EN"]);
    assert.ok(texts(section(model, "abstract-en-header").layout).includes("Department of [English department required]"));
    assert.ok(texts(section(model, "abstract-header").layout).includes("Eğitim Bilimleri Anabilim Dalı"));
    assert.ok(!section(compile(demoUniversityA), "cover").html.includes("thesis-layout-image"));
  });
  it("program condition omits the whole empty block and treats every filled value literally", async () => {
    for (const value of [undefined, null, "", "   ", "TxtNote", "yokprogram", "none", "-"]) {
      const model = compile(mcbuMaster, thesis({ values: { ...values, USED_PROGRAMS: value } }));
      const declaration = section(model, "declaration");
      const filled = Boolean(String(value ?? "").trim());
      assert.equal(declaration.html.includes('data-thesis-field="USED_PROGRAMS"'), filled);
      if (filled) assert.ok(texts(declaration.layout).includes(`Kullanılan program: ${value}`));
      const zip = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
      const xml = strFromU8(zip["word/document.xml"]);
      assert.equal(xml.includes("Kullanılan program: "), filled);
      assert.ok(Object.keys(zip).some((key) => key.startsWith("word/media/")), "official cover logo in DOCX");
    }
  });
});

describe("Task 10B: Manisa Celal Bayar Üniversitesi, Lisansüstü Eğitim Enstitüsü template", () => {
  it("A: both variants are valid official templates, registered and selectable by degree", async () => {
    for (const template of [mcbuMaster, mcbuPhd]) assert.deepEqual(validateThesisTemplate(template), []);
    assert.equal(mcbuMaster.universityName, "Manisa Celal Bayar Üniversitesi");
    assert.equal(mcbuMaster.instituteName, "Lisansüstü Eğitim Enstitüsü");
    assert.equal(mcbuMaster.status, "official");
    assert.match(mcbuMaster.source.documentName, /ShareFileGallery-GTSM221020251445\.pdf/);
    const entries = THESIS_TEMPLATE_REGISTRY.filter((entry) => entry.universityId === "mcbu");
    assert.deepEqual(entries.map((entry) => [entry.id, entry.degreeType, entry.displayName]), [
      ["mcbu-lee-master-tr-v1", "master", "Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · Yüksek Lisans"],
      ["mcbu-lee-phd-tr-v1", "phd", "Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · Doktora"],
    ]);
    for (const degreeType of ["master", "phd"]) {
      const resolved = await resolveThesisTemplate({ universityId: "mcbu", instituteId: "lee", degreeType, language: "tr" });
      assert.equal(resolved.fallback, false); assert.equal(resolved.template.degreeType, degreeType);
    }
    // Existing templates keep their ids and still resolve.
    for (const id of ["demo-university-a-master-tr-v1", "demo-university-b-master-tr-v1", "demo-university-c-phd-en-v1"]) assert.equal((await resolveThesisTemplate({ templateId: id })).fallback, false);
  });

  it("B/C/D: A4, 40/25/25/25 mm, TNR 12 / 1.5 / justify, 12.5 mm first line, 6 pt after", () => {
    const model = compile();
    for (const item of model.sections) {
      const { page } = item.rules;
      assert.deepEqual([page.widthMm, page.heightMm, page.orientation], [210, 297, "portrait"]);
      assert.deepEqual(page.margins, { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 });
    }
    const body = section(model, "main").rules.body;
    assert.deepEqual([body.fontFamily, body.fontSizePt, body.lineHeight, body.align, body.firstLineIndentMm, body.spaceAfterPt], ["Times New Roman", 12, 1.5, "justify", 12.5, 6]);
    const css = buildThesisCss(model);
    assert.match(css, /data-thesis-flow-section="main"\]\) \.thesis-body p\{margin:0pt 0 6pt;text-indent:12\.5mm;\}/);
  });

  it("E: inner cover is data (metadata, order, typography, spacers); no visible number", () => {
    const cover = section(compile(), "inner-cover");
    assert.equal(cover.specialPage, true); assert.equal(cover.rules.page.numbering.enabled, false);
    assert.deepEqual(texts(cover.layout), ["T.C.", "MANİSA CELAL BAYAR ÜNİVERSİTESİ", "LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ", "DOKTORA TEZİ", "Eğitim Bilimleri ANABİLİM DALI", "Eğitim Programları ve Öğretim PROGRAMI", "Çevrimiçi öğrenme", "Çağrı ÖZDOĞAN", "Danışman", "Doç. Dr. İlknur ÇİÇEK", "Manisa–2026"]);
    const nodes = cover.layout;
    const spacers = nodes.filter((node) => node.type === "spacer").map((node) => Math.round(node.heightMm * 100) / 100);
    // "n satır boşluk" = n empty Word lines (1.15 em per line of Times New Roman).
    assert.deepEqual(spacers, [13.8, 16.1, 13.8, 98, 80.5, 69, 96.6].map((pt) => Math.round(mm(pt) * 100) / 100));
    const logo = nodes.find((node) => node.type === "image");
    assert.ok(logo.source.startsWith("data:image/png;base64,"));
    assert.ok(Math.abs(logo.heightMm - mm(105.74)) < 1e-9);
    const text = nodes.filter((node) => node.type === "text");
    assert.ok(text.every((node) => node.style.fontFamily === "Times New Roman" && node.style.fontWeight === 700 && node.style.align === "center"));
    assert.deepEqual(text.map((node) => node.style.fontSizePt), [14, 14, 14, 12, 12, 12, 14, 12, 12, 12, 12]);
    assert.deepEqual(text.filter((node) => node.style.textTransform === "uppercase").map((node) => node.text), ["Eğitim Bilimleri ANABİLİM DALI", "Eğitim Programları ve Öğretim PROGRAMI", "Çevrimiçi öğrenme", "Manisa–2026"]);
    assert.equal(texts(section(compile(mcbuMaster), "inner-cover").layout)[3], "YÜKSEK LİSANS TEZİ");
  });

  it("F: Taahhütname carries the official text with the department as the only dynamic part", () => {
    const page = section(compile(), "declaration");
    const lines = texts(page.layout);
    assert.equal(lines[0], "TAAHHÜTNAME");
    assert.equal(lines[1], "Bu tezin Manisa Celal Bayar Üniversitesi Lisansüstü Eğitim Enstitüsü Eğitim Bilimleri Ana Bilim Dalında akademik ve etik kurallara uygun olarak yazıldığını ve kullanılan tüm literatür bilgilerinin referans gösterilerek tezde yer aldığını, tamamen kendi çalışmam olduğunu, her alıntıya kaynak gösterdiğimi, tezin yazımında akademik ve etik kurallara aykırı herhangi bir yapay zeka ve program kullanmadığımı beyan ederim.");
    assert.deepEqual(lines.slice(2, 4), ["İmza", "Çağrı ÖZDOĞAN"]);
    assert.equal(page.rules.page.numbering.enabled, false);
  });

  it("G: ÖZET/ABSTRACT pages: header, editable text and keywords share one page; min 5 keywords is advisory", () => {
    const model = compile();
    const groups = groupThesisSections(model.sections).map((group) => group.sections.map((item) => item.id));
    assert.ok(groups.some((ids) => ids.join() === "abstract-header,abstract,abstract-footer"));
    assert.ok(groups.some((ids) => ids.join() === "abstract-en-header,abstract-en,abstract-en-footer"));
    assert.deepEqual(texts(section(model, "abstract-header").layout), ["ÖZET", "Doktora Tezi", "Çağrı ÖZDOĞAN", "Manisa Celal Bayar Üniversitesi", "Lisansüstü Eğitim Enstitüsü", "Eğitim Bilimleri Anabilim Dalı", "Danışman: Doç. Dr. İlknur ÇİÇEK"]);
    // Unmeasured, every page group counts one page; the stored PAGE_COUNT "48" is ignored.
    const groupCount = groupThesisSections(model.sections).length;
    assert.deepEqual(texts(section(model, "abstract-footer").layout), ["Anahtar Kelimeler: a, b, c, d, e", `2026, ${groupCount} sayfa`]);
    assert.deepEqual(texts(section(model, "abstract-en-header").layout).slice(0, 6), ["ABSTRACT", "PhD Thesis", "Çağrı ÖZDOĞAN", "Manisa Celal Bayar University", "Graduate School of Education", "Department of Educational Sciences"]);
    assert.equal(section(model, "abstract").editable, true); assert.equal(section(model, "abstract-en").editable, true);
    assert.deepEqual(model.validation, { errors: [], warnings: [] });
    const few = compile(mcbuPhd, thesis({ values: { ...values, KEYWORDS: "bir, iki; üç", KEYWORDS_EN: "" } }));
    assert.deepEqual(few.validation.warnings.map((w) => [w.field, w.expected, w.actual]), [["KEYWORDS", 5, 2], ["KEYWORDS_EN", 5, 0]]);
    assert.deepEqual(few.validation.errors, []);
  });

  it("H: cover and Taahhütname unnumbered, front matter Roman from ÖZET = I, GİRİŞ restarts Arabic 1", () => {
    const model = compile();
    const groups = groupThesisSections(model.sections);
    const labels = buildThesisPageModel(groups, {}).flatMap((group) => group.pages.map((page) => [group.groupId, page.label]));
    assert.deepEqual(labels.slice(0, 10), [["inner-cover", ""], ["declaration", ""], ["abstract-header", "I"], ["abstract-en-header", "II"], ["preface", "III"], ["symbols", "IV"], ["index-figures", "V"], ["index-tables", "VI"], ["toc", "VII"], ["introduction", "1"]]);
    assert.equal(labels[10][1], "2");
  });

  it("I/K: H1–H4 numbering, chapter headings uppercase on a new page; TOC and indexes are derived", () => {
    const model = compile();
    assert.deepEqual(model.headings.map((h) => h.label), ["1.", "1.1.", "1.1.1.", "1.1.1.1.", "2."]);
    const h1 = section(model, "main").rules.headings[1];
    assert.deepEqual([h1.fontSizePt, h1.fontWeight, h1.align, h1.textTransform, h1.pageBreakBefore, h1.spaceAfterPt], [12, 700, "justify", "uppercase", true, 20.7]);
    const pages = Object.fromEntries(model.indexSources.map((entry, i) => [entry.anchor, { label: String(i + 1) }]));
    const resolved = resolveGeneratedIndexes(model, pages);
    assert.deepEqual(section(resolved, "toc").indexRows.map((row) => row.text), ["ÖZET", "ABSTRACT", "ÖNSÖZ VE TEŞEKKÜR", "SİMGELER VE KISALTMALAR DİZİNİ", "ŞEKİLLER DİZİNİ", "TABLOLAR DİZİNİ", "İÇİNDEKİLER", "GİRİŞ", "1. KURAMSAL ÇERÇEVE", "1.1. Alt", "1.1.1. Alt alt", "1.1.1.1. Dört", "2. YÖNTEM", "KAYNAKÇA", "EKLER"]);
    assert.ok(section(resolved, "toc").indexRows.every((row) => row.page === pages[row.anchor].label));
    assert.deepEqual(section(resolved, "index-figures").indexRows.map((row) => row.text), ["Şekil 1. Bir şekil", "Şekil 2. İkinci şekil"]);
    assert.deepEqual(section(resolved, "index-tables").indexRows.map((row) => row.text), ["Tablo 1. Bir tablo"]);
    assert.match(section(resolved, "index-figures").html, /<div class="thesis-index-page-heading">Sayfa<\/div>/);
    assert.equal(section(resolved, "toc").generatedIndex.leader, "none");
  });

  it("J: figure caption below, table caption above, auto alignment; numbering is a document-wide choice", () => {
    const model = compile();
    const rules = section(model, "main").rules;
    assert.deepEqual([rules.figures.label, rules.figures.position, rules.figures.captionAlignment], ["Şekil", "below", "auto"]);
    assert.deepEqual([rules.tables.label, rules.tables.position, rules.tables.captionAlignment], ["Tablo", "above", "auto"]);
    assert.deepEqual(rules.tables.cellStyle, { align: "center", lineHeight: 1 });
    assert.equal(rules.tables.cellStyle.fontSizePt, undefined, "table type size stays the author's choice");
    const chapter = compile(mcbuPhd, thesis({ captionNumbering: "chapter" }));
    assert.deepEqual(chapter.indexSources.filter((s) => s.kind !== "toc").map((s) => s.label), ["Şekil 1.1.", "Tablo 1.1.", "Şekil 2.1."]);
    assert.deepEqual(model.indexSources.filter((s) => s.kind !== "toc").map((s) => s.label), ["Şekil 1.", "Tablo 1.", "Şekil 2."]);
    assert.ok(model.sections.every((item) => item.rules.figures.numbering.scope === "document"));
    assert.ok(chapter.sections.every((item) => item.rules.tables.numbering.scope === "chapter"));
  });

  it("L: page-bottom footnotes in Times New Roman 10 pt", () => {
    const rule = section(compile(), "main").rules.footnotes;
    assert.deepEqual([rule.placement, rule.style.fontFamily, rule.style.fontSizePt], ["pageBottom", "Times New Roman", 10]);
  });

  it("M: ÖZGEÇMİŞ only for doctorates, unnumbered, not in the TOC, centered 14 pt bold", () => {
    assert.equal(section(compile(mcbuMaster), "cv"), undefined);
    const model = compile();
    const cv = section(model, "cv");
    assert.match(cv.html, /<h1 data-unnumbered="true">ÖZGEÇMİŞ<\/h1>/);
    assert.deepEqual([cv.rules.headings[1].align, cv.rules.headings[1].fontSizePt, cv.rules.headings[1].fontWeight], ["center", 14, 700]);
    assert.ok(!resolveGeneratedIndexes(model).sections.find((item) => item.id === "toc").indexRows.some((row) => /ÖZGEÇMİŞ/.test(row.text)));
    const withHeading = compileThesisDocument(mcbuPhd, thesis({ sectionContent: { cv: "<h2>Eğitim</h2><p>x</p>" } }), "T", main);
    assert.equal(withHeading.indexSources.find((s) => s.title === "Eğitim").tocHidden, true);
    assert.equal(withHeading.indexSources.find((s) => s.title === "Eğitim").label, "");
  });

  it("DOCX: exact A4, margins, TNR, paragraph geometry, Heading4, Roman/Arabic restarts, footnotes, captions", async () => {
    const model = compile();
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const xml = strFromU8(files["word/document.xml"]);
    const notes = strFromU8(files["word/footnotes.xml"]);
    const styles = strFromU8(files["word/styles.xml"]);
    assert.ok([...xml.matchAll(/<w:pgSz [^>]*>/g)].every((m) => /w:w="11906"/.test(m[0]) && /w:h="16838"/.test(m[0])));
    assert.ok([...xml.matchAll(/<w:pgMar [^>]*>/g)].every((m) => m[0].includes(`w:left="${mmToTwip(40)}"`) && m[0].includes(`w:top="${mmToTwip(25)}"`) && m[0].includes(`w:right="${mmToTwip(25)}"`) && m[0].includes(`w:bottom="${mmToTwip(25)}"`)));
    const has = (text, pattern, label) => assert.ok(pattern.test(text), label);
    has(xml, /<w:ind [^>]*w:firstLine="709"/, "1.25 cm first-line indent");
    has(xml, /<w:spacing (?=[^>]*w:after="120")(?=[^>]*w:before="0")(?=[^>]*w:line="360")(?=[^>]*w:lineRule="auto")[^>]*\/>/, "6 pt after, Word 1.5 lines");
    has(xml, /w:ascii="Times New Roman"/, "Times New Roman runs");
    has(styles, /w:styleId="Heading4"/, "Heading4 style");
    const numbering = [...xml.matchAll(/<w:pgNumType([^>]*)\/>/g)].map((m) => m[1]);
    assert.ok(numbering.some((attrs) => /w:start="1"/.test(attrs) && /upperRoman/.test(attrs)));
    assert.ok(numbering.some((attrs) => /w:start="1"/.test(attrs) && /decimal/.test(attrs)));
    has(notes, /Dipnot metni\./, "footnote text"); has(notes, /<w:sz w:val="20"\/>/, "footnote 10 pt"); has(notes, /Times New Roman/, "footnote font");
    // Captions also appear as index rows; compare positions inside the main body.
    const start = xml.indexOf("1. KURAMSAL ÇERÇEVE");
    const order = (a, b) => assert.ok(start > 0 && xml.indexOf(a, start) >= 0 && xml.indexOf(a, start) < xml.indexOf(b, start), `${a} before ${b}`);
    order("Tablo 1. Bir tablo", "<w:tbl>"); order("<w:drawing>", "Şekil 1. Bir şekil");
    for (const text of ["TAAHHÜTNAME", "Anahtar Kelimeler: a, b, c, d, e", ">Sayfa<", "ÇEVRİMİÇİ ÖĞRENME"]) assert.ok(xml.includes(text), text);
  });
});

describe("Task 10B.1: MCBÜ final polish", () => {
  const groupsOf = (model) => groupThesisSections(model.sections);
  const measured = (model, pagesPerGroup) => Object.fromEntries(groupsOf(model).map((group) => [group.id, pagesPerGroup(group)]));
  const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);

  it("A: Word line spacing: 1.5 → 20.7 pt and single → 13.8 pt in editor/PDF CSS; DOCX keeps Word's own lines", async () => {
    const model = compile();
    const css = buildThesisCss(model);
    const lineHeight = (selector) => Number(css.match(new RegExp(`data-thesis-flow-section="main"\\]\\) ${selector}\\{[^}]*line-height:([\\d.]+)`))?.[1]);
    assert.equal(Math.round(lineHeight("\\.thesis-body") * 12 * 100) / 100, 20.7, "body 1.5 lines = 20.7 pt (official PDF)");
    assert.equal(Math.round(lineHeight("\\.thesis-body h1") * 12 * 100) / 100, 20.7, "headings 1.5 lines");
    assert.match(css, /data-thesis-flow-section="inner-cover"\]\) \[data-thesis-block="1"\]\{[^}]*line-height:1\.15;/, "special page single line = 1.15 em");
    assert.equal(section(model, "main").rules.body.lineHeight, 1.5, "stored semantics unchanged");
    const xml = await docxXml(model);
    assert.match(xml, /w:line="240" w:lineRule="auto"/, "single lines are Word's auto 240");
    const textParagraphs = [...xml.matchAll(/<w:p>[\s\S]*?<\/w:p>/g)].map((m) => m[0]).filter((p) => !p.includes("<w:drawing>"));
    assert.ok(textParagraphs.every((p) => !p.includes('w:lineRule="atLeast"')), "MCBÜ text uses Word line pitch; an image paragraph may grow to fit its logo");
    // Other templates keep the CSS multiplier and the 'at least' pitch.
    const demo = compileThesisDocument(demoUniversityA, { values: {} }, "T", "<p>x</p>");
    assert.equal(demo.sections[0].rules.lineSpacing, undefined);
    assert.doesNotMatch(buildThesisCss(demo), /line-height:1\.725/);
    const demoXml = await docxXml(demo);
    assert.match(demoXml, /w:lineRule="atLeast"/); assert.doesNotMatch(demoXml, /w:lineRule="auto"/);
  });

  it("B: per-chapter captions never read 0.x; an unnumbered introduction numbers without a chapter", () => {
    const intro = `<p>Giriş</p><figure><img src="${image}"><figcaption>Giriş şekli</figcaption></figure><table><caption>Giriş tablosu</caption><tr><td>1</td></tr></table><figure><img src="${image}"><figcaption>Giriş şekli 2</figcaption></figure>`;
    const state = (captionNumbering) => thesis({ captionNumbering, sectionContent: { introduction: intro, cv: "<p>x</p>" } });
    const labels = (model) => model.indexSources.filter((s) => s.kind !== "toc").map((s) => s.label);
    const chapter = compile(mcbuPhd, state("chapter"));
    assert.deepEqual(labels(chapter), ["Şekil 1.", "Tablo 1.", "Şekil 2.", "Şekil 1.1.", "Tablo 1.1.", "Şekil 2.1."]);
    assert.ok(labels(chapter).every((label) => !/ 0\./.test(label)));
    assert.deepEqual(labels(compile(mcbuPhd, state("document"))), ["Şekil 1.", "Tablo 1.", "Şekil 2.", "Şekil 3.", "Tablo 2.", "Şekil 4."]);
    // The lists read the same labels; chapter headings are unchanged.
    const resolved = resolveGeneratedIndexes(chapter);
    assert.deepEqual(section(resolved, "index-figures").indexRows.map((row) => row.text), ["Şekil 1. Giriş şekli", "Şekil 2. Giriş şekli 2", "Şekil 1.1. Bir şekil", "Şekil 2.1. İkinci şekil"]);
    assert.deepEqual(section(resolved, "index-tables").indexRows.map((row) => row.text), ["Tablo 1. Giriş tablosu", "Tablo 1.1. Bir tablo"]);
    assert.deepEqual(chapter.headings.map((h) => h.label), ["1.", "1.1.", "1.1.1.", "1.1.1.1.", "2."]);
  });

  it("C: İkinci Danışman / Co-Supervisor lines appear only when a title or name is given", () => {
    const header = (model, id) => texts(section(model, id).layout);
    const empty = compile();
    assert.ok(!header(empty, "abstract-header").some((line) => /İkinci Danışman/.test(line)));
    assert.ok(!header(empty, "abstract-en-header").some((line) => /Co-Supervisor/.test(line)));
    const filled = compile(mcbuPhd, thesis({ values: { ...values, CO_ADVISOR_TITLE: "Prof. Dr.", CO_ADVISOR_NAME: "Ayşe YILMAZ" } }));
    assert.equal(header(filled, "abstract-header").at(-1), "İkinci Danışman: Prof. Dr. Ayşe YILMAZ");
    assert.equal(header(filled, "abstract-en-header").at(-1), "Co-Supervisor: Prof. Dr. Ayşe YILMAZ");
    // The empty line above it goes with it.
    const gaps = (model, id) => section(model, id).layoutBlocks.reduce((sum, block) => sum + (block.type === "spacer" ? block.heightMm : 0), 0);
    assert.ok(Math.abs(gaps(filled, "abstract-header") - gaps(empty, "abstract-header") - mm(12 * 1.15)) < 1e-9);
    // Old notes storing the name under the alias still show it.
    const alias = compile(mcbuPhd, thesis({ values: { ...values, SECOND_ADVISOR_NAME: "Ali VELİ" } }));
    assert.equal(header(alias, "abstract-header").at(-1), "İkinci Danışman:  Ali VELİ");
  });

  it("D: total pages is derived from the current pagination, never stored", () => {
    const state = thesis();
    const before = JSON.stringify(state);
    const model = compile(mcbuPhd, state);
    const counts = measured(model, (group) => (group.id === "main" ? 14 : group.id === "introduction" ? 3 : 1));
    const total = buildThesisPageModel(groupsOf(model), counts).reduce((sum, group) => sum + group.pages.length, 0);
    const resolved = resolveGeneratedIndexes(model, {}, counts);
    assert.equal(texts(section(resolved, "abstract-footer").layout).at(-1), `2026, ${total} sayfa`);
    assert.equal(texts(section(resolved, "abstract-en-footer").layout).at(-1), `2026, ${total} pages`);
    assert.match(section(resolved, "abstract-footer").html, new RegExp(`2026, ${total} sayfa`));
    assert.equal(resolved.values.PAGE_COUNT, String(total));
    // Reflow: more pages → the displayed total follows.
    const grown = resolveGeneratedIndexes(model, {}, { ...counts, main: 95 });
    assert.equal(texts(section(grown, "abstract-footer").layout).at(-1), `2026, ${total + 81} sayfa`);
    // Nothing is written back: the thesis state is untouched and the field is not an input.
    assert.equal(JSON.stringify(state), before);
    assert.equal(mcbuPhd.placeholders.PAGE_COUNT.derived, "totalPages");
    assert.deepEqual(section(resolved, "abstract-footer").missingPlaceholders, []);
  });

  it("E/F: DOCX carries the same derived snapshot", async () => {
    const model = compile();
    const resolved = resolveGeneratedIndexes(model, {}, measured(model, (group) => (group.id === "main" ? 20 : 1)));
    const total = resolved.values.PAGE_COUNT;
    const xml = await docxXml(resolved);
    assert.ok(xml.includes(`2026, ${total} sayfa`)); assert.ok(xml.includes(`2026, ${total} pages`));
    assert.ok(!xml.includes("48 sayfa"));
  });
});
