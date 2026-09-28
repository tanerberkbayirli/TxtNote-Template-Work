import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisCss, compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { derivedThesisValues, formatCaptionLabel, generatedIndexHtml, indexEntries } from "../thesis/generatedIndex.js";
import { specialPageHtml, resolveSpecialPage } from "../thesis/specialPages.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { mcbuMaster } from "../thesis/templates/mcbu.js";

const docxXml = async (model, options) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, options)).arrayBuffer()))["word/document.xml"]);
const footerXml = async (model) => { const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer())); return Object.entries(files).filter(([name]) => /footer\d*\.xml$/.test(name)).map(([, data]) => strFromU8(data)).join("\n"); };
const withTemplate = (patch) => ({ ...mcbuMaster, ...patch });

describe("generic engine extensions (batch A)", () => {
  it("page numbers use numbering.style in the DOCX footer", async () => {
    const template = withTemplate({ page: { ...mcbuMaster.page, numbering: { ...mcbuMaster.page.numbering, style: { fontSizePt: 10 } } } });
    assert.deepEqual(validateThesisTemplate(template), []);
    assert.ok(validateThesisTemplate(withTemplate({ page: { ...mcbuMaster.page, numbering: { ...mcbuMaster.page.numbering, style: { fontSizePt: -1 } } } })).length);
    assert.match(await footerXml(compileThesisDocument(template, {}, "T", "<p>a</p>")), /<w:sz w:val="20"\/>/);
  });

  it("caption label format, bold label and hanging indent (CSS, index rows, DOCX runs)", async () => {
    const figures = { ...mcbuMaster.figures, labelFormat: "{label} {number}", labelStyle: { fontWeight: 700 }, hangingIndent: "label", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" } };
    const template = withTemplate({ figures });
    assert.deepEqual(validateThesisTemplate(template), []);
    assert.equal(formatCaptionLabel(figures, "2.1"), "Şekil 2.1");
    assert.equal(formatCaptionLabel(mcbuMaster.figures, "3"), "Şekil 3.", "default keeps the trailing dot");
    const model = compileThesisDocument(template, {}, "T", `<h1>Bir</h1><figure class="academic-figure" data-kind="figure"><img src="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"><figcaption>Başlık metni</figcaption></figure>`);
    const css = buildThesisCss(model);
    assert.match(css, /figcaption\[data-thesis-caption\]::before\{font-weight:700;\}/);
    assert.match(css, /figcaption\[data-thesis-caption-hang\]\{padding-left:attr\(data-thesis-caption-hang px, 0px\);text-indent:calc\(-1 \* attr\(data-thesis-caption-hang px, 0px\)\)\}/);
    const caption = model.indexSources.find((entry) => entry.kind === "figures");
    assert.equal(caption.label, "Şekil 1.1");
    const xml = await docxXml(model, { captionHangs: { [caption.anchor]: 80 } });
    assert.match(xml, /<w:b\/><w:bCs\/>[\s\S]*?<w:t xml:space="preserve">Şekil 1\.1 <\/w:t>/);
    assert.match(xml, /w:hanging="1200"/, "80 px = 21.17 mm = 1200 twip");
    assert.equal(thesisSourceHtml('<figcaption data-thesis-caption="Şekil 1 " data-thesis-caption-hang="80">x</figcaption>'), "<figcaption>x</figcaption>");
  });

  it("index rows keep their text; label span, hanging and level styles are opt-in", () => {
    const rows = indexEntries([{ kind: "figures", label: "Şekil 2.1", title: "Bir şekil", anchor: "a" }], { kind: "figures" });
    const html = generatedIndexHtml(rows, { kind: "figures", title: "ŞEKİLLER", includePageNumbers: true, leader: "dots" });
    assert.match(html, /<span class="thesis-index-text"><span class="thesis-index-label">Şekil 2\.1<\/span> <span class="thesis-index-title">Bir şekil<\/span><\/span>/);
    const template = withTemplate({ sections: mcbuMaster.sections.map((section) => section.id === "toc" ? { ...section, generatedIndex: { ...section.generatedIndex, labelStyle: { fontWeight: 700 }, hanging: "label", levelStyles: { 1: { fontWeight: 700, spaceBeforePt: 12 } } } } : section) });
    assert.deepEqual(validateThesisTemplate(template), []);
    const css = buildThesisCss(compileThesisDocument(template, {}, "T", "<h1>a</h1>"));
    assert.match(css, /\.thesis-index-label\{font-weight:700;\}/);
    assert.match(css, /\.thesis-toc li\[data-index-level="1"\]\{font-weight:700;margin-top:12pt;\}/);
  });

  it("three-rule tables: rules above, below the header row and below; no grid", async () => {
    const template = withTemplate({ tables: { ...mcbuMaster.tables, borders: { preset: "threeRule", widthPt: 0.5 } } });
    const model = compileThesisDocument(template, {}, "T", `<div class="academic-table-wrap"><table class="academic-table"><caption>Tablo</caption><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>`);
    const css = buildThesisCss(model);
    assert.match(css, /\.thesis-body table\{border-top:0\.5pt solid #000;border-bottom:0\.5pt solid #000;\}/);
    assert.match(css, /thead tr:last-child>\*\{border-bottom:0\.5pt solid #000;\}/);
    assert.doesNotMatch(css.split("\n").filter((line) => line.includes("mcbu") || true).join(""), /td,[^{]*th\{border:1px solid #888/);
    const xml = await docxXml(model);
    assert.match(xml, /<w:tblBorders><w:top w:val="single" w:color="000000" w:sz="4"\/><w:left w:val="none"/);
    assert.match(xml, /<w:tcBorders><w:bottom w:val="single" w:color="000000" w:sz="4"\/><\/w:tcBorders>/);
  });

  it("numbered section title continues the chapter numbers and is listed with its number", () => {
    const template = withTemplate({ sections: mcbuMaster.sections.map((section) => section.id === "bibliography" ? { ...section, titleNumbering: "continueH1", tocEntry: "headings" } : section) });
    assert.deepEqual(validateThesisTemplate(template), []);
    const model = compileThesisDocument(template, { sectionContent: { bibliography: "<p>Ref</p>" } }, "T", "<h1>Bir</h1><h1>İki</h1>");
    const entry = model.headings.find((heading) => heading.title === "KAYNAKÇA");
    assert.equal(entry.label, "3.");
  });

  it("special pages: inline bold runs, frames, colour", async () => {
    const blocks = [
      { type: "text", markup: "inline", value: "**Danışman:** {{ADVISOR_NAME}}" },
      { type: "group", border: { outerPt: 2.25, gapPt: 1.5, innerPt: 0.75, paddingMm: 2, docx: { style: "thickThinSmallGap", sizePt: 3 } }, blocks: [{ type: "text", value: "Onay", style: { color: "#bfbfbf" } }] },
    ];
    const layout = resolveSpecialPage(blocks, { definitions: { ADVISOR_NAME: { label: "a", type: "text" } }, values: { ADVISOR_NAME: "**Ad**" }, baseStyle: mcbuMaster.typography.body });
    assert.deepEqual(layout.blocks[0].runs, [{ text: "Danışman:", bold: true }, { text: " **Ad**", bold: false }], "metadata values are never markup");
    const html = specialPageHtml(layout.blocks);
    assert.match(html, /<b class="thesis-layout-strong">Danışman:<\/b> \*\*Ad\*\*/);
    assert.match(html, /<div class="thesis-layout-frame" data-thesis-frame="1"><div class="thesis-layout-frame-inner" data-thesis-frame-inner="1"><div class="thesis-layout-group"/);
    const template = withTemplate({ sections: [{ id: "p", type: "custom", title: "P", status: "required", group: "front", mode: "static", blocks }, ...mcbuMaster.sections.filter((s) => s.id === "main")] });
    assert.deepEqual(validateThesisTemplate(template), []);
    const model = compileThesisDocument(template, { values: { ADVISOR_NAME: "Ad" } }, "T", "<p>a</p>");
    const css = buildThesisCss(model);
    assert.match(css, /\[data-thesis-frame="1"\]\{border:2\.25pt solid #000000;padding:1\.5pt;/);
    assert.match(css, /\[data-thesis-frame-inner="1"\]\{border:0\.75pt solid #000000;padding:2mm;\}/);
    assert.match(css, /color:#bfbfbf;/);
    const xml = await docxXml(model);
    assert.match(xml, /<w:b\/><w:bCs\/>[\s\S]*?Danışman:/);
    assert.match(xml, /w:val="thickThinSmallGap" w:color="000000" w:sz="24"/);
    assert.match(xml, /<w:color w:val="BFBFBF"\/>/);
  });

  it("derived front/main page counts from the page model", () => {
    const template = withTemplate({ placeholders: { ...mcbuMaster.placeholders, FRONT: { label: "f", type: "text", derived: "frontLastLabel" }, MAIN: { label: "m", type: "number", derived: "mainPageCount" } } });
    assert.deepEqual(validateThesisTemplate(template), []);
    const model = compileThesisDocument(template, { sectionContent: { introduction: "<p>x</p>" } }, "T", "<p>a</p>");
    const counts = Object.fromEntries(model.sections.map((section) => [section.id, section.id === "main" ? 5 : 1]));
    const values = derivedThesisValues(model, counts);
    assert.equal(values.FRONT, "VII", "ÖZET = I … İÇİNDEKİLER = VII");
    assert.ok(Number(values.MAIN) >= 6, `GİRİŞ + 5 main pages + back matter: ${values.MAIN}`);
  });

  it("tab stops, hanging indents and first-after-heading paragraphs", async () => {
    const template = withTemplate({ typography: { ...mcbuMaster.typography, paragraph: { ...mcbuMaster.typography.paragraph, tabStopMm: 40, firstAfterHeading: { firstLineIndentMm: 0 } } } });
    assert.deepEqual(validateThesisTemplate(template), []);
    const model = compileThesisDocument(template, {}, "T", "<h1>Bir</h1><p>İlk\tparagraf</p><p>İkinci</p>");
    const css = buildThesisCss(model);
    assert.match(css, /tab-size:40mm;/);
    assert.match(css, /:is\(h1,h2,h3,h4,h5,h6\)\+p\{text-indent:0mm\}/);
    const xml = await docxXml(model);
    assert.match(xml, /<w:tab w:val="left" w:pos="\d+"\/>/);
    assert.match(xml, /İlk<\/w:t><\/w:r><w:r><w:tab\/><\/w:r>/);
    const paragraphs = xml.split("<w:p>").filter((p) => /İlk|İkinci/.test(p));
    assert.doesNotMatch(paragraphs[0], /w:firstLine="709"/, "first paragraph after the heading has no indent");
    assert.match(paragraphs[1], /w:firstLine="709"/);
  });
});
