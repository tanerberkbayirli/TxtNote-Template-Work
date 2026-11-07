import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { DOMParser } from "@xmldom/xmldom";
import { thesisSourceHtml } from "../../../../engine/src/sourceHtml.js";
import { buildThesisCss, compileThesisDocument, templateFontFamilies, thesisSectionCss } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { derivedThesisValues, equationPadAfter, generatedIndexHtml } from "../../../../engine/src/generatedIndex.js";
import { resolveThesisTemplate, THESIS_TEMPLATE_REGISTRY } from "../../../../engine/src/registry.js";
import { positionedFlowTextBoxDocx } from "../../../../engine/src/layoutDocx.js";
import { resolveSpecialPage, specialPageBlockVisible, validateSpecialPageBlocks } from "../../../../engine/src/specialPages.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { akuFbeMaster, akuFbePhd } from "../../../../engine/src/templates/aku-fbe.js";

const docxXml = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
const figure = (caption, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""}><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<div class="academic-table-wrap"><table class="academic-table"><caption>${caption}</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const values = { STUDENT_NAME: "Ada YILMAZ", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Can KAYA", DEPARTMENT_NAME: "Biyoloji", YEAR: "2026", DEFENSE_YEAR: "2026", DEFENSE_MONTH: "Ocak", KEYWORDS: "a, b, c, d" };
const main = `<h1>Materyal ve Metot</h1><p>Metin.</p><h2>Alt başlık ve konu</h2><h3>Üç</h3><h4>Dört</h4>${figure("Şekil başlığı")}${figure("Fotoğraf", "photo")}${table("Tablo başlığı")}`;
const compile = (template = akuFbeMaster, extra = {}) => compileThesisDocument(template, { values: { ...values, ...extra.values }, sectionContent: { introduction: "<p>Giriş metni.</p>", ...extra.sectionContent }, enabledSections: extra.enabledSections || [] }, "Test Başlığı", main, ["Yazar, A. (2020). Eser."]);
const section = (model, id) => model.sections.find((item) => item.id === id);

describe("AKÜ FBE template (aku-fbe-master-tr-v1, aku-fbe-phd-tr-v1)", () => {
  it("is valid, registered and shares rules outside degree strings and approval jury rows", async () => {
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
    const normalise = (template, [cover, tr, en]) => JSON.stringify({ ...template, id: "x", degreeType: "x", displayName: "x", sections: template.sections.filter((s) => s.id !== "approval") }).replaceAll(cover, "C").replaceAll(tr, "T").replaceAll(en, "E");
    assert.equal(normalise(akuFbeMaster, ["YÜKSEK LİSANS TEZİ", "Yüksek Lisans Tezi", "M.Sc. Thesis"]), normalise(akuFbePhd, ["DOKTORA TEZİ", "Doktora Tezi", "Ph.D. Thesis"]));
    assert.deepEqual(templateFontFamilies(akuFbeMaster), ["Times New Roman", "Cambria Math"]);
    assert.deepEqual(compile().systemFonts, ["Times New Roman", "Cambria Math"]);
  });

  it("page, body and heading values of the guide (3 cm, 12 pt, 1.5 lines, 20.7 pt gaps, page number 10 pt)", () => {
    const t = akuFbeMaster;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 });
    assert.equal(t.page.footer.distanceMm, 12.5);
    assert.deepEqual(t.page.numbering.style, { fontFamily: "Times New Roman", fontSizePt: 10 });
    assert.deepEqual(t.typography.lineSpacing, { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "additive", blockGap: "paragraphPitch" });
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

  it("special pages: optional lines and seven doctoral jurors with a second advisor", () => {
    const withCo = compile(akuFbePhd, { values: { CO_ADVISOR_NAME: "Deniz AY", CO_ADVISOR_TITLE: "Dr. Öğr. Üyesi", JURY_6_TITLE_NAME: "Prof. Dr. Ali", JURY_7_TITLE_NAME: "Prof. Dr. Veli", PROJECT_NUMBER: "1", PROJECT_FUNDER: "BAP" } });
    const without = compile(akuFbeMaster);
    const text = (model, id) => JSON.stringify(section(model, id).layout);
    assert.match(text(withCo, "inner-cover"), /İkinci Danışman/);
    assert.match(text(withCo, "inner-cover"), /desteklenmiştir/);
    assert.doesNotMatch(text(without, "inner-cover"), /İkinci Danışman|desteklenmiştir/);
    assert.match(text(withCo, "approval"), /JURY_7_AFFILIATION/);
    const coWithoutNames = compile(akuFbePhd, { values: { CO_ADVISOR_NAME: "Deniz AY" } });
    assert.match(text(coWithoutNames, "approval"), /JURY_6_AFFILIATION/);
    assert.match(text(coWithoutNames, "approval"), /JURY_7_AFFILIATION/);
    assert.doesNotMatch(text(compile(akuFbePhd), "approval"), /JURY_6_AFFILIATION|JURY_7_AFFILIATION/);
    assert.doesNotMatch(text(without, "approval"), /JURY_6_AFFILIATION|JURY_7_AFFILIATION/);
    assert.match(text(without, "approval"), /JURY_3_AFFILIATION/);
    assert.doesNotMatch(text(without, "approval"), /JURY_4_AFFILIATION|JURY_5_AFFILIATION/);
    // The source blank line above the institute frame remains for both jury counts.
    const spacers = (model) => section(model, "approval").layout.filter((node) => node.type === "spacer" || (node.type === "group" && node.blocks.every((b) => b.type === "spacer"))).length;
    assert.equal(spacers(without), spacers(withCo));
    // inner cover: 14 pt bold, gaps of whole 14 pt @ 1.5 lines (24.15 pt = 8.519 mm)
    const spacer = section(without, "inner-cover").layout.find((node) => node.type === "spacer");
    assert.ok(Math.abs(spacer.heightMm - 24.15 * 25.4 / 72) < 1e-6);
    assert.equal(section(without, "inner-cover").rules.body.fontSizePt, 14);
    // outer cover: existing first-baseline placement is preserved; the Word flow frame ends at source y=275 mm.
    const cover = section(without, "outer-cover").rules.page;
    assert.deepEqual([cover.margins.leftMm, cover.margins.rightMm], [55, 55]);
    assert.ok(Math.abs(cover.margins.topMm + 0.9336 * 12 * 25.4 / 72 - 215.53) < 1e-6);
    assert.equal(cover.margins.bottomMm, 22, "the guide's printed cover box ends at y=275 mm on A4");
    assert.deepEqual(cover.docxContentFrame, { xMm: 55, yMm: cover.margins.topMm, widthMm: 100, heightMm: 275 - cover.margins.topMm });
    for (const id of ["inner-cover", "approval", "ethics"]) {
      assert.equal(section(without, id).rules.page.margins.bottomMm, 30, `${id} follows the official 30 mm page margin`);
    }
    assert.equal(section(without, "inner-cover").rules.page.trimTerminalTextLeading, true);
    assert.equal(section(without, "approval").rules.page.trimTerminalTextLeading, undefined);
    // approval: cell x 28.1-178.1, frame is a thick-thin double border
    const approval = section(without, "approval");
    assert.ok(Math.abs(approval.rules.page.margins.leftMm - 27.32) < 1e-9 && Math.abs(approval.rules.page.margins.rightMm - 31.09) < 1e-9, "frame outer edges x 27.32 / 178.91");
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
    const coverFrame = section(compile(), "outer-cover").rules.page.docxContentFrame;
    assert.match(xml, new RegExp(`<wp:posOffset>${Math.round(coverFrame.xMm * 36000)}</wp:posOffset>`));
    assert.match(xml, new RegExp(`<wp:posOffset>${Math.round(coverFrame.yMm * 36000)}</wp:posOffset>`));
    assert.match(xml, /<wp:extent cx="3600000" cy="\d+"/);
    const bodyProperties = xml.match(/<wps:bodyPr[^>]*>/)?.[0] || "";
    for (const inset of ["lIns", "tIns", "rIns", "bIns"]) assert.match(bodyProperties, new RegExp(`${inset}="0"`), `${inset} is zero`);
    assert.match(xml, /txbxContent/);
    assert.match(xml, /<w:t[^>]*>YÜKSEK LİSANS TEZİ<\/w:t>/);
    assert.match(xml, /<w:t[^>]*>Danışman<\/w:t>/);
    const approvalPage = section(compile(), "approval").rules.page;
    const approvalIndent = Math.round((approvalPage.docxContentFrame.xMm - approvalPage.docxMargins.leftMm) * 1440 / 25.4);
    assert.match(xml, new RegExp(`<w:tblInd w:type="dxa" w:w="${approvalIndent}"/>`), "page-top approval content keeps its page-origin position in normal flow");
    const sectionMargins = [...xml.matchAll(/<w:pgMar\b[^>]*>/g)].map((match) =>
      ["top", "right", "bottom", "left"].map((side) => Number(match[0].match(new RegExp(`w:${side}="(\\d+)"`))?.[1])));
    assert.ok(sectionMargins.length >= 4);
    assert.ok(sectionMargins.every((sides) => sides.every((twips) => twips === 1701)), "official DOCX uses 30 mm on all sides of every section");
    assert.match(xml, /w:spacing[^>]*w:after="414"[^>]*w:line="360" w:lineRule="auto"/);
    assert.match(xml, /w:val="Times New Roman"|w:ascii="Times New Roman"/);
    assert.match(xml, /thickThinSmallGap/);
  });
});

describe("generic special-page condition noneFilled", () => {
  it("fixed-height flow text boxes reject non-paragraph content instead of dropping it", () => {
    assert.throws(() => positionedFlowTextBoxDocx([{ type: "image" }], { xMm: 0, yMm: 0, widthMm: 10, heightMm: 10 }), /yalnızca paragraf akışı/);
  });

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

describe("index rows with leaderFlow inline", () => {
  it("puts leader and page number inside the title box; the default flow is unchanged", () => {
    const model = compile();
    const toc = section(model, "toc");
    assert.equal(toc.generatedIndex.leaderFlow, "inline");
    assert.match(toc.html, /<span class="thesis-index-title">GİRİŞ<span class="thesis-index-leader">\.+<\/span><span class="thesis-index-page"[^>]*>/);
    assert.match(toc.html, /<span class="thesis-index-title">ÖZET<span class="thesis-index-leader">/, "rows without a label get a title box too");
    const css = buildThesisCss(model);
    assert.match(css, /\.thesis-index-title>\.thesis-index-leader\{position:absolute;/);
    assert.match(css, /\.thesis-index-title>\.thesis-index-page\{float:right;/);
    const flex = generatedIndexHtml([{ kind: "toc", level: 1, label: "1.", rowTitle: "A", text: "1. A", anchor: "a", page: "3" }], { kind: "toc", title: "T", includePageNumbers: true, leader: "dots" });
    assert.match(flex, /<span class="thesis-index-title">A<\/span><\/span><span class="thesis-index-leader">/);
  });
});

describe("aku-fbe validation attempt 1 fixes", () => {
  const table3 = `<div class="academic-table-wrap"><table class="academic-table"><caption>T</caption><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
  const note = `<p data-thesis-style="tableNote">Not.</p>`;

  it("blockGap: ONE table gives the gap between any two block kinds; CSS and DOCX both read it", async () => {
    const { blockDescriptors, gapBetween } = await import("../../../../engine/src/blockGap.js");
    const rules = section(compile(), "main").rules;
    const d = Object.fromEntries(blockDescriptors(rules).map((x) => [x.key, x]));
    const gap = (a, b) => gapBetween(rules, d[a], d[b]);
    // pitch check: bottom-of-line-to-baseline + gap + ascent = 41.4 pt for text after every block kind that ends in a line
    const pitch = (a, b) => d[a].exit.bottomBase + gap(a, b) + d[b].entry.ascent;
    for (const from of ["p", "h2", "figure", "figure:photo", "table", "p:tableNote", "list", "eq"]) assert.ok(Math.abs(pitch(from, "p") - 41.4) < 0.01 || from === "h2" && Math.abs(pitch(from, "p") - 41.4) < 0.01, `${from} -> p`);
    assert.equal(gap("table", "p:tableNote"), 6, "a table note follows its table at its own space-before (guide p.14: 5.46 mm rule to baseline)");
    assert.ok(Math.abs(pitch("p:tableNote", "h2") - 41.4) < 0.01);
    assert.equal(gap("p", "figure"), 20.7, "a box after a paragraph: one empty body line");
    assert.equal(gap("eq", "table"), 20.7);
    for (const from of ["p", "h2", "figure", "table", "p:tableNote", "list", "eq"]) assert.ok(Math.abs(pitch(from, "eq") - 41.4) < 0.01, `${from} -> eq`);
    assert.equal(gap("h2", "h1"), null, "page-starting headings keep their own margin");
    const css = buildThesisCss(compile());
    assert.match(css, /\.thesis-body p\[data-thesis-style="tableNote"\]\+h2\{margin-top:28\.0\d+pt\}/);
    assert.match(css, /\.academic-table-wrap\+p\[data-thesis-style="tableNote"\]\{margin-top:6pt\}/);
    assert.match(css, /table:not\(\.academic-table-wrap table,table table\)\+p\[data-thesis-style="tableNote"\]\{margin-top:6pt\}/, "native source tables receive the same evidenced note gap as wrapped tables without an inner-table gap");
    assert.match(css, /\.thesis-body table\{margin-bottom:0\}/, "the editor's default table margin must not override the shared block gap");
    assert.doesNotMatch(css, /tableNote"\]\+h1\{/);
    const model = compileThesisDocument(akuFbeMaster, { values }, "T", `<h1>A</h1>${table3}${note}<h2>Sonra</h2><p>x</p>`);
    const xml = await docxXml(model);
    assert.match(xml, /w:spacing w:after="120" w:before="120"[^>]*\/>[\s\S]{0,900}Not\./, "note: 6 pt before, right under the table");
    assert.match(xml, /w:spacing w:after="414" w:before="561"/, "heading after the note: the whole gap 28.04 pt on space-before (Word renders max(after, before), the note's 6 pt after stays)");
    // equation in Word: its own 1.5 line, the blank line comes from the previous block's spacing
    const eqXml = await docxXml(compileThesisDocument(akuFbeMaster, { values }, "T", `<h1>A</h1>${table3}<span class="math-formula math-formula--block" data-display="block" data-latex="a=b" data-eq-numbered="true">(a=b)</span><p>x</p>`));
    assert.match(eqXml, /w:spacing w:after="414" w:before="537" w:line="360"[\s\S]{0,900}Cambria Math/, "equation after a table: gap 26.85 pt (baseline pitch 41.4 pt), 20.7 pt after");
  });

  it("TOC and list rows are PAGEREF fields (cached = the editor's label) whose bookmarks exist", async () => {
    const xml = await docxXml(compile());
    const refs = [...xml.matchAll(/<w:instrText[^>]*>PAGEREF (\w+) \\h<\/w:instrText>/g)];
    const names = new Set([...xml.matchAll(/<w:bookmarkStart[^>]*w:name="(\w+)"/g)].map((m) => m[1]));
    assert.ok(refs.length >= 8);
    for (const [, name] of refs) assert.ok(names.has(name), `${name} has a bookmark`);
    assert.match(xml, /PAGEREF _ref_abstract_tr_source_title \\h<\/w:instrText>/, "ÖZET row points at the bookmark of its title");
    assert.doesNotMatch(xml, /<w:fldSimple\b/);
    for (const match of refs) {
      const tail = xml.slice(match.index + match[0].length);
      assert.match(tail, /^<w:fldChar w:fldCharType="separate"\/><\/w:r><w:r>[\s\S]*?<w:t[^>]*>[\s\S]*?<\/w:t>[\s\S]*?<w:fldChar w:fldCharType="end"/, "each PAGEREF carries a cached editor label before its end marker");
    }
    assert.equal(names.size, [...xml.matchAll(/<w:bookmarkStart/g)].length, "bookmark names are unique");
  });

  it("list rows of the index sections are single spaced with 6 pt after in Word too", async () => {
    const xml = await docxXml(compile());
    const rows = [...xml.matchAll(/<w:p>((?:(?!<\/w:p>).)*?)<\/w:p>/gs)].map((m) => m[1]).filter((p) => /<w:tab\/>/.test(p) && /(Şekil|Çizelge|Resim) \d\.\d/.test(p.replace(/<[^>]+>/g, "")));
    assert.ok(rows.length >= 3);
    for (const row of rows) assert.match(row, /w:spacing w:after="120" w:before="0" w:line="240"/);
  });

  it("footnotes are numbered 1, 2, 3 in reading order across sections (document numbering), whatever the stored marks say", async () => {
    assert.equal(akuFbeMaster.typography.footnotes.numbering, "document");
    const { thesisPresentationHtml } = await import("../../../../engine/src/generatedIndex.js");
    const fn = (id) => `<sup class="academic-footnote" data-fn-id="${id}" data-fn-text="t">1</sup>`;
    const model = compileThesisDocument(akuFbeMaster, { values, sectionContent: { introduction: `<p>a${fn("a")}</p>` } }, "T", `<h1>X</h1><p>b${fn("b")} c${fn("c")}</p>`);
    const html = thesisPresentationHtml(section(model, "main"), "tr");
    assert.deepEqual([...html.matchAll(/data-fn-index="(\d+)">(\d+)</g)].map((m) => [m[1], m[2]]), [["2", "2"], ["3", "3"]]);
  });

  it("caption label is an inline box as wide as the hang (no justification stretch)", () => {
    const css = buildThesisCss(compile());
    assert.match(css, /figcaption\[data-thesis-caption-hang\]::before\{display:inline-block;width:attr\(data-thesis-caption-hang px, 0px\);text-indent:0;white-space:nowrap\}/);
    assert.match(css, /caption\[data-thesis-caption-hang\]::before\{display:inline-block/);
  });

  it("approval frame: thin outside, gap, thick inside; Word styles per side; outer edges 27.32 / 178.91 mm", async () => {
    const model = compile();
    const frame = section(model, "approval").layout.find((node) => node.border).border;
    assert.deepEqual([frame.outerPt, frame.gapPt, frame.innerPt], [0.75, 0.75, 3]);
    assert.deepEqual(frame.docx.sides, { top: "thickThinSmallGap", left: "thickThinSmallGap", bottom: "thinThickSmallGap", right: "thinThickSmallGap" });
    const xml = await docxXml(model);
    assert.match(xml, /<w:top w:val="thickThinSmallGap"[^>]*w:sz="24"/);
    assert.match(xml, /<w:bottom w:val="thinThickSmallGap"[^>]*w:sz="24"/);
    assert.match(xml, /<w:right w:val="thinThickSmallGap"/);
    const page = section(model, "approval").rules.page;
    assert.ok(Math.abs(210 - page.margins.rightMm - 178.91) < 1e-9);
  });

  it("additional jurors retain the official five-row pitch without unsupported compression", () => {
    const rows = (model) => JSON.stringify(section(model, "approval").layout);
    const many = compile(akuFbePhd, { values: { JURY_6_TITLE_NAME: "A", JURY_7_TITLE_NAME: "B" } });
    assert.match(rows(many), /JURY_7_AFFILIATION/);
    const afters = (model) => [...rows(model).matchAll(/"JURY_1_AFFILIATION"[\s\S]*?"spaceAfterPt":(\d+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(afters(many), [6]);
    assert.deepEqual(afters(compile()), [6]);
    assert.ok(akuFbeMaster.source.notes.some((n) => /6-7\. satırlara/.test(n) && /INFERRED/.test(n)));
  });

  it("equations: 12 pt formula, Cambria Math in Word, caret pads cancelled through measured attributes, wrapping gutters, presentation attributes never stored", async () => {
    const css = buildThesisCss(compile());
    assert.match(css, /\.math-formula--block \.katex\{font-size:1em\}/);
    assert.match(css, /math-formula--block\[data-thesis-eq-pad-before\]\{margin-top:calc\(0pt - attr\(data-thesis-eq-pad-before px, 0px\)\)\}/);
    assert.match(css, /math-formula--block\[data-thesis-eq-pad-after\]\{margin-bottom:calc\(0pt - attr\(data-thesis-eq-pad-after px, 0px\)\)\}/);
    assert.match(css, /math-formula--block\{padding-top:attr\(data-thesis-eq-lift px, 0px\);padding-bottom:attr\(data-thesis-eq-drop px, 0px\)\}/);
    assert.match(css, /math-formula--block \.math-formula__render\{padding:0 3\.6em\}/);
    assert.match(css, /math-formula--block \.katex\{white-space:normal\}/);
    assert.match(css, /p\+\.math-formula--block\[data-thesis-eq-pad-before\]\{margin-top:calc\(0pt - attr\(data-thesis-eq-pad-before px, 0px\)\)\}/, "after a paragraph: its own 20.7 pt space-after is the blank line");
    assert.match(css, /data-thesis-eq\]::after\{[^}]*font-family:"Cambria Math","Times New Roman"/);
    assert.equal(thesisSourceHtml('<span data-thesis-eq="(1.1)" data-thesis-eq-pad-before="31.6" data-thesis-eq-pad-after="23.5" data-thesis-eq-lift="1" data-thesis-eq-drop="2" data-thesis-eq-base="14.9" data-thesis-eq-fit="0.8">x<span data-thesis-eq-probe="" style="display:inline-block"></span></span>'), "<span>x</span>");
    const xml = await docxXml(compileThesisDocument(akuFbeMaster, { values }, "T", `<h1>A</h1><span class="math-formula math-formula--block" data-display="block" data-latex="E=mc^2" data-eq-numbered="true">(E)</span>`));
    const word = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const math = "http://schemas.openxmlformats.org/officeDocument/2006/math";
    const parsed = new DOMParser().parseFromString(xml, "application/xml");
    const formula = parsed.getElementsByTagNameNS(math, "oMath")[0];
    assert.ok(formula, "equation is editable OMML");
    const paragraph = formula.parentNode;
    assert.equal(paragraph.namespaceURI, word); assert.equal(paragraph.localName, "p");
    const spacing = paragraph.getElementsByTagNameNS(word, "spacing")[0];
    assert.deepEqual(["after", "before", "line"].map((name) => spacing.getAttributeNS(word, name)), ["414", "414", "360"]);
    assert.equal(spacing.getAttributeNS(word, "lineRule"), "auto");
    // Persistent bookmark names may change XML length; inspect the actual math
    // run rather than imposing a character distance between unrelated XML tags.
    const mathRuns = Array.from(formula.getElementsByTagNameNS(math, "r"));
    assert.equal(mathRuns.length, 5, "E=mc² retains all five editable math runs");
    for (const run of mathRuns) {
      assert.equal(run.getElementsByTagNameNS(word, "rFonts")[0].getAttributeNS(word, "ascii"), "Cambria Math");
      assert.equal(run.getElementsByTagNameNS(word, "sz")[0].getAttributeNS(word, "val"), "24");
    }
  });

  it("layout PDF glyph aliases replace symbols Times New Roman lacks by look-alikes it has", async () => {
    const { PDF_GLYPH_ALIASES } = await import("../../../../engine/src/layoutPdf.js");
    assert.equal(PDF_GLYPH_ALIASES["⋅"], "∙");
  });
  it("stamps the equation's caret pad from the flow's line height whenever the layout measurement is meaningless", () => {
    const most = 82.8, line = 27.6;
    assert.equal(equationPadAfter(27.588, line, most), 27.588, "a plausible measurement wins");
    // The next block in another column/page (measured 300-1100 px away), no next block, or a NaN must not leave the pad unset:
    // that made the gap after (and before) an equation depend on where it landed on the page (eq baseline 238.38 mm, +20 pt).
    for (const measured of [377.87, 1122.9, 0, -3, null, NaN]) assert.equal(equationPadAfter(measured, line, most), line, String(measured));
    assert.equal(equationPadAfter(null, NaN, most), 0, "no line height, nothing to cancel");
  });
});
