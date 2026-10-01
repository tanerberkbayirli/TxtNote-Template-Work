import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument, templateFontFamilies } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { generatedIndexHtml, indexEntries, indexRowStyle } from "../thesis/generatedIndex.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../thesis/registry.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { groupThesisSections } from "../thesis/engine.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuSbeMaster, akuSbePhd } from "../thesis/templates/aku-sbe.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""}><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Yusuf GÖKÇE", THESIS_TITLE: "Başlık", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Elbeyi PELİT", DEPARTMENT_NAME: "Turizm İşletmeciliği", DEFENSE_MONTH: "Ekim", DEFENSE_YEAR: "2016", YEAR: "2016", KEYWORDS: "a, b" };
const main = `<h1>Kuram</h1><p>Metin.</p><h2>Alt</h2><h3>Üç</h3><h4>Dört</h4><h5>Beş</h5><h2>İki</h2><h1>Yöntem</h1><h2>Yine</h2>${figure("Şekil başlığı")}${figure("Fotoğraf", "photo")}${table("Tablo başlığı")}`;
const compile = (template = akuSbeMaster, html = main, extra = {}) => compileThesisDocument(template, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş.</p>", conclusion: "<p>Sonuç.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", html, ["Yazar, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ SBE template (aku-sbe-master-tr-v1, aku-sbe-phd-tr-v1)", () => {
  it("is valid, registered and differs between the degrees only in its degree strings", async () => {
    for (const template of [akuSbeMaster, akuSbePhd]) {
      assert.deepEqual(validateThesisTemplate(template), []);
      const { fallback, template: resolved } = await resolveThesisTemplate({ templateId: template.id });
      assert.equal(fallback, false, template.id);
      assert.equal(resolved.status, "official");
      assert.equal(resolved.instituteId, "sbe");
      assert.match(resolved.source.documentName, /Tez Hazırlama Yazım ve Basım Kılavuzu \(2026\)/);
      assert.ok(resolved.source.verifiedAt && resolved.source.revisionDate && resolved.source.notes.length >= 8);
    }
    assert.equal(THESIS_TEMPLATE_REGISTRY.find((entry) => entry.id === "aku-sbe-phd-tr-v1").displayName, "Afyon Kocatepe Üniversitesi · Sosyal Bilimler Enstitüsü · Doktora");
    assert.equal(akuSbeMaster.displayName, "Afyon Kocatepe Üniversitesi · Sosyal Bilimler Enstitüsü · Yüksek Lisans");
    assert.deepEqual(THESIS_TEMPLATE_REGISTRY.filter((entry) => entry.id.startsWith("aku-sbe")).map((entry) => entry.id), ["aku-sbe-master-tr-v1", "aku-sbe-phd-tr-v1"], "Sanatta Yeterlik and English variants stay unregistered (missing wording)");
    const normalise = (template, [cover, tanitim, ethics]) => JSON.stringify({ ...template, id: "x", degreeType: "x", displayName: "x" }).replaceAll(cover, "C").replaceAll(tanitim, "T").replaceAll(ethics, "E");
    assert.equal(normalise(akuSbeMaster, ["YÜKSEK LİSANS TEZİ", "Yüksek Lisans Tezi", "Yüksek Lisans tezi"]), normalise(akuSbePhd, ["DOKTORA TEZİ", "Doktora Tezi", "Doktora tezi"]));
    assert.deepEqual(templateFontFamilies(akuSbeMaster), ["Times New Roman"]);
    assert.deepEqual(compile().systemFonts, ["Times New Roman"], "the genuine installed Times New Roman is embedded by the export");
  });

  it("page, body and heading values of the guide (25/25/30/30 mm, 12 pt, 1.5 lines, 6/6 pt additive, 12.5 mm indent)", () => {
    const t = akuSbeMaster;
    assert.deepEqual(t.page.margins, { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 });
    assert.equal(t.page.numbering.position, "bottom");
    assert.equal(t.page.numbering.align, "center");
    assert.deepEqual(t.page.numbering.style, { fontFamily: "Times New Roman", fontSizePt: 12 });
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive" });
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.firstLineIndentMm, b.spaceBeforePt, b.spaceAfterPt], ["Times New Roman", 12, 1.5, "justify", 12.5, 6, 6]);
    const h = t.typography.headings;
    assert.deepEqual([h["1"].align, h["1"].fontWeight, h["1"].textTransform, h["1"].spaceBeforePt, h["1"].spaceAfterPt, h["1"].lineHeight, h["1"].pageBreakBefore], ["center", 700, "uppercase", 12, 12, 1.5, true]);
    assert.deepEqual(h["1"].numbering, { enabled: true, format: "{1} BÖLÜM", sequence: "ordinal-tr-upper", placement: "ownLine" });
    for (const level of ["2", "3", "4", "5"]) assert.deepEqual([h[level].lineHeight, h[level].spaceBeforePt, h[level].spaceAfterPt, h[level].align, h[level].keepWithNext], [1, 6, 6, "left", true], level);
    assert.deepEqual(["2", "3", "4", "5"].map((l) => h[l].fontWeight), [700, 400, 700, 400]);
    assert.deepEqual(["2", "3", "4", "5"].map((l) => h[l].textTransform ?? "none"), ["uppercase", "uppercase", "none", "none"]);
    assert.deepEqual(t.typography.footnotes, { placement: "pageBottom", numbering: "document", fontFamily: "Times New Roman", fontSizePt: 9, lineHeight: 1, firstLineIndentMm: 0, align: "left", separator: { widthPercent: 26.67 } });
    assert.deepEqual([t.bibliography.style.spaceBeforePt, t.bibliography.style.spaceAfterPt, t.bibliography.style.hangingIndentMm, t.bibliography.style.lineHeight], [0, 0, 5, 1]);
    assert.deepEqual([t.tables.style.fontSizePt, t.tables.style.lineHeight, t.tables.style.align, t.tables.position, t.figures.position, t.captionKinds.photo.position], [11, 1, "center", "above", "above", "above"]);
    assert.deepEqual(t.tables.numbering, { scope: "document", format: "{n}", sequence: "arabic" });
    assert.equal(t.tables.cellStyle.fontSizePt, 11);
  });

  it("numbers BİRİNCİ BÖLÜM chapters with per-chapter sub-headings, document-wide captions and an unnumbered KAYNAKÇA", () => {
    const model = compile();
    assert.deepEqual(model.headings.map((x) => `${x.label}|${x.title}`), ["BİRİNCİ BÖLÜM|Kuram", "1.|Alt", "1.1.|Üç", "1.1.1.|Dört", "1.1.1.1.|Beş", "2.|İki", "İKİNCİ BÖLÜM|Yöntem", "1.|Yine"]);
    assert.deepEqual(model.headings.filter((x) => x.labelLine).map((x) => x.label), ["BİRİNCİ BÖLÜM", "İKİNCİ BÖLÜM"], "the ordinal label is a line of its own above the title");
    assert.deepEqual(model.indexSources.filter((entry) => entry.kind !== "toc").map((entry) => entry.label), ["Şekil 1.", "Resim 1.", "Tablo 1."], "no chapter prefix, one counter per caption kind");
    const css = buildThesisCss(model);
    assert.match(css, /h1\[data-thesis-number\]::before\{content:attr\(data-thesis-number\);display:block\}/);
    assert.match(css, /figcaption\[data-thesis-caption\]::before\{font-weight:700;\}/);
    assert.match(css, /caption\{caption-side:top;[^}]*font-size:11pt/);
    assert.doesNotMatch(model.sections.map((s) => s.title).join("|"), /GENİŞLETİLMİŞ/, "no extended Turkish summary in the Turkish variants");
    for (const id of ["introduction", "conclusion", "bibliography", "appendices"]) assert.ok(section(compile(akuSbeMaster, main, { enabledSections: ["appendices"] }), id), id);
  });

  it("section order, page numbering (sheet before the inner cover is not counted, inner cover i, ethics ii, GİRİŞ 1) and TOC rows", () => {
    const model = compile(akuSbeMaster, main, { enabledSections: ["symbols"] });
    const ids = model.sections.map((s) => s.id);
    assert.deepEqual(ids.slice(0, 9), ["outer-cover", "inner-cover", "ethics", "approval", "abstract-tr", "abstract", "abstract-footer", "abstract-en-header", "abstract-en"]);
    assert.ok(ids.indexOf("preface") < ids.indexOf("toc") && ids.indexOf("toc") < ids.indexOf("symbols") && ids.indexOf("symbols") < ids.indexOf("introduction") && ids.indexOf("introduction") < ids.indexOf("main") && ids.indexOf("conclusion") < ids.indexOf("bibliography"));
    const rule = (id) => section(model, id).rules.page.numbering;
    assert.deepEqual([rule("inner-cover").enabled, rule("inner-cover").format, rule("inner-cover").startAt, rule("inner-cover").restart], [false, "roman-lower", 1, true]);
    assert.deepEqual([rule("outer-cover").enabled, rule("outer-cover").restart], [false, false]);
    assert.deepEqual([rule("ethics").enabled, rule("ethics").format, rule("ethics").restart], [true, "roman-lower", false]);
    assert.deepEqual([rule("introduction").format, rule("introduction").startAt, rule("introduction").restart], ["arabic", 1, true]);
    const groups = groupThesisSections(model.sections);
    const labels = Object.fromEntries(numberThesisPages(groups, {}).map((n) => [n.sectionId, n.labels]));
    assert.deepEqual([labels["outer-cover"], labels["inner-cover"], labels.ethics, labels.approval], [[""], [""], ["ii"], ["iii"]]);
    assert.equal(labels.introduction[0], "1");
    const toc = section(model, "toc").html;
    for (const title of ["ETİK VE BİLİMSEL İLKELER SORUMLULUK BEYANI", "ENSTİTÜ ONAYI", "ÖZET", "ABSTRACT", "ÖN SÖZ", "İÇİNDEKİLER", "SİMGELER VE KISALTMALAR DİZİNİ", "GİRİŞ", "TARTIŞMA, SONUÇ VE ÖNERİLER", "KAYNAKÇA"]) assert.match(toc, new RegExp(`thesis-index-title">${title}<`), title);
    assert.doesNotMatch(toc, /BAŞLIK SAYFASI/, "the inner cover is not listed");
    assert.match(toc, /data-index-level="1"[^>]*data-index-label-line="true"><span class="thesis-index-text"><span class="thesis-index-label">BİRİNCİ BÖLÜM<\/span> <span class="thesis-index-title">KURAM<\/span>/);
  });

  it("TOC rows: chapter rows centred without page number, title rows (levelStyles.unnumbered) bold from the left with a number", async () => {
    const model = compile();
    const css = buildThesisCss(model);
    assert.match(css, /\.thesis-toc li\[data-index-level="1"\]\{font-weight:700;margin-top:12pt;margin-bottom:12pt;text-align:center;display:block;\}/);
    assert.match(css, /\.thesis-toc li\[data-index-unnumbered\]\{font-weight:700;margin-top:0pt;margin-bottom:0pt;text-align:left;\}/);
    assert.ok(css.indexOf('li[data-index-unnumbered]') > css.indexOf('li[data-index-level="5"]'), "the unnumbered rule comes last and wins");
    const toc = section(model, "toc");
    assert.match(toc.html, /<li data-index-level="1" data-index-target="[^"]+" data-index-unnumbered="true"><span class="thesis-index-text"><span class="thesis-index-title">ÖZET<span class="thesis-index-leader">/);
    const chapterRow = toc.indexRows.find((row) => row.labelLine);
    assert.equal(indexRowStyle(toc.generatedIndex, chapterRow).includePageNumber, false);
    assert.equal(indexRowStyle(toc.generatedIndex, toc.indexRows.find((row) => row.unnumbered)).includePageNumber, true);
    assert.match(css, /\.thesis-toc li:not\(\[data-index-unnumbered\]\) \+ li\[data-index-unnumbered\]\{margin-top:13\.8pt;\}/, "one empty single line before the back-matter rows (§2.6 vii)");
    const xml = await docxXml(model);
    assert.match(xml, /BİRİNCİ BÖLÜM<\/w:t>[\s\S]{0,400}KURAM/);
    const tailRow = xml.split("<w:p>").find((p) => p.includes("TARTIŞMA, SONUÇ VE ÖNERİLER") && p.includes("PAGEREF"));
    assert.match(tailRow, /w:spacing w:after="0" w:before="276" w:line="240"/, "Word: 13.8 pt before the first back-matter row");
    const keywordRow = xml.split("<w:p>").find((p) => p.includes(">GİRİŞ<") && p.includes("PAGEREF"));
    assert.match(keywordRow, /w:spacing w:after="0" w:before="0"/, "other title rows have none");
  });

  it("generic levelStyles.unnumbered: validated, per-row lookup, opt-in", () => {
    const rule = { kind: "toc", levelStyles: { 1: { includePageNumber: false }, unnumbered: { fontWeight: 700 } } };
    assert.equal(indexRowStyle(rule, { level: 1, unnumbered: true }).fontWeight, 700);
    assert.equal(indexRowStyle(rule, { level: 1 }).includePageNumber, false);
    assert.equal(indexRowStyle({ kind: "toc", levelStyles: { 1: { fontWeight: 700 } } }, { level: 1, unnumbered: true }).fontWeight, 700, "without the key the level style applies as before");
    const html = generatedIndexHtml(indexEntries([{ kind: "toc", level: 1, unnumbered: true, tocTitle: true, title: "ÖZET", label: "", anchor: "a" }], { kind: "toc", maxDepth: Infinity }, { a: { label: "iv" } }), { kind: "toc", title: "T", includePageNumbers: true, leader: "dots", levelStyles: { 1: { includePageNumber: false }, unnumbered: {} } });
    assert.match(html, /data-index-unnumbered="true"><span class="thesis-index-text">ÖZET<\/span><span class="thesis-index-leader">/, "title rows keep their page number although level 1 rows do not");
    const rule2 = structuredClone(akuSbeMaster); rule2.sections.find((s) => s.id === "toc").generatedIndex.unnumberedAfterNumberedSpaceBeforePt = -1;
    assert.match(validateThesisTemplate(rule2).join(), /unnumberedAfterNumberedSpaceBeforePt/);
    const bad = structuredClone(akuSbeMaster); bad.sections.find((s) => s.id === "toc").generatedIndex.levelStyles.unnumbered.includePageNumber = "yes";
    assert.match(validateThesisTemplate(bad).join(), /levelStyles\.unnumbered\.includePageNumber/);
    const worse = structuredClone(akuSbeMaster); worse.sections.find((s) => s.id === "toc").generatedIndex.levelStyles.bogus = { fontWeight: 700 };
    assert.match(validateThesisTemplate(worse).join(), /levelStyles\.bogus/);
  });

  it("special pages: tanıtım sheet at the EK 1 baseline, inner cover, ethics wording per degree, ÖZET without indent, hanging keywords", () => {
    const master = compile();
    const phd = compile(akuSbePhd);
    const outer = section(master, "outer-cover").rules.page;
    assert.ok(Math.abs(outer.margins.topMm + 0.9336 * 12 * 25.4 / 72 - 228.34) < 1e-6, "first baseline 228.34 mm");
    assert.deepEqual([outer.margins.leftMm, outer.margins.rightMm], [65, 65], "lines stay within 80 mm");
    assert.equal(outer.numbering.enabled, false);
    const text = (model, id) => JSON.stringify(section(model, id).layout);
    assert.match(text(master, "inner-cover"), /YÜKSEK LİSANS TEZİ/);
    assert.match(text(phd, "inner-cover"), /DOKTORA TEZİ/);
    assert.doesNotMatch(text(master, "inner-cover"), /İkinci Danışman|desteklenmiştir/);
    assert.match(text(compile(akuSbeMaster, main, { values: { CO_ADVISOR_NAME: "Deniz AY", CO_ADVISOR_TITLE: "Prof. Dr.", PROJECT_FUNDER: "BAPK", PROJECT_NUMBER: "1" } }), "inner-cover"), /İkinci Danışman[\s\S]*desteklenmiştir/);
    const innerCover = section(master, "inner-cover").layout;
    const title = innerCover.find((node) => node.style?.fontSizePt === 16);
    assert.ok(title && title.style.fontWeight === 700 && title.style.textTransform === "uppercase", "16 pt bold caps title");
    assert.equal(section(master, "inner-cover").rules.body.fontSizePt, 12);
    assert.equal(section(master, "inner-cover").rules.body.lineHeight, 1.5);
    assert.match(text(master, "ethics"), /Yüksek Lisans tezi olarak sunduğum/);
    assert.match(text(phd, "ethics"), /Doktora tezi olarak sunduğum/);
    assert.equal(section(master, "ethics").rules.body.lineHeight, 1.5);
    assert.match(text(master, "approval"), /ENSTİTÜ ONAYI/);
    const abstract = section(master, "abstract");
    assert.equal(abstract.rules.body.firstLineIndentMm, 0, "no first-line indent in the abstract (EK 5)");
    assert.equal(abstract.rules.body.lineHeight, 1);
    assert.equal(section(master, "preface").rules.body.firstLineIndentMm, 12.5);
    assert.equal(section(master, "preface").rules.body.lineHeight, 1, "ön söz is single spaced (§2.5)");
    assert.match(text(master, "abstract-footer"), /"hangingIndentMm":35\.62/);
    assert.match(text(master, "abstract-en-footer"), /"hangingIndentMm":19\.75/);
  });

  it("lists exist only for three or more tables / figures / pictures", () => {
    const few = compile(akuSbeMaster, `<h1>Bir</h1>${table("A")}${table("B")}${figure("F")}${figure("G")}${figure("R", "photo")}`);
    assert.ok(!few.sections.some((s) => s.id.startsWith("list-")));
    const many = compile(akuSbeMaster, `<h1>Bir</h1>${[1, 2, 3].map((n) => table(`T${n}`) + figure(`F${n}`) + figure(`R${n}`, "photo")).join("")}`);
    assert.deepEqual(many.sections.filter((s) => s.id.startsWith("list-")).map((s) => s.generatedIndex.title), ["TABLOLAR LİSTESİ", "ŞEKİLLER LİSTESİ", "RESİMLER LİSTESİ"]);
    const rows = section(many, "list-tables").indexRows;
    assert.deepEqual(rows.map((r) => r.label), ["Tablo 1.", "Tablo 2.", "Tablo 3."]);
  });

  it("DOCX carries the Word values: margins, 1.5 lines, 6/6 pt, 12.5 mm indent, chapter heading with line break, footer", async () => {
    const model = compile();
    const xml = await docxXml(model);
    assert.match(xml, /<w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701" w:header="709" w:footer="709"/);
    assert.match(xml, /w:spacing w:after="120" w:before="120" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /w:ind w:left="0" w:right="0" w:firstLine="709"/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="lowerRoman"\/>/);
    assert.match(xml, /<w:pgNumType w:start="1" w:fmt="decimal"\/>/);
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const footers = Object.entries(files).filter(([name]) => /footer\d+\.xml$/.test(name)).map(([, data]) => strFromU8(data)).join("");
    assert.match(footers, /<w:sz w:val="24"\/>/, "page numbers are 12 pt");
    const heading = xml.split("<w:p>").find((p) => /<w:pStyle w:val="Heading1"\/>/.test(p) && p.includes("BÖLÜM"));
    assert.ok(heading, "Heading1 paragraph for the chapter");
    assert.match(heading, /BİRİNCİ BÖLÜM<\/w:t>[\s\S]*<w:br\/>[\s\S]*KURAM/);
    assert.match(heading, /w:spacing w:after="240" w:before="240" w:line="360" w:lineRule="auto"/);
    assert.match(xml, /<w:pStyle w:val="Heading5"\/>/);
  });
});
