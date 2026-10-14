import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { Document, Packer } from "docx";
import { docxParagraph } from "../../../../engine/src/docx/paragraphs.js";
import { auditDocxFields, foldFieldMarkup, targetBookmarkName } from "../../../../engine/src/docx/fields.js";
import { collectIndexSources } from "../../../../engine/src/generatedIndex.js";
import { compileThesisDocument, extractThesisHeadings } from "../../../../engine/src/engine.js";
import { asBlocks } from "../../../../engine/src/docx/xml.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import generic from "../../../../engine/src/templates/generic.js";
import { approximateWidth, boxesFromBlocks, paginateBoxes } from "./academicPdfLayout.js";
import { endnotesFromHtml } from "./academicDocument.js";
import { sectionEndnoteViews } from "../../../../engine/src/footnotes.js";

describe("resumed note and reference integrity", () => {
  it("gathers document endnotes at the last body and keeps section endnotes with their source", () => {
    const body = (id, numbering, texts) => ({ id, editable: true, rules: { footnotes: { numbering } }, editableHtml: texts.map((text) => `<sup class="academic-endnote" data-fn-text="${text}">99</sup>`).join("") });
    const a=body("a","document",["Bir","İki"]), b=body("b","section",["Yerel"]), c=body("c","document",["Üç"]);
    const generated={id:"index",mode:"generated",editable:false};
    const before=sectionEndnoteViews([a,b,c,generated],endnotesFromHtml);
    assert.deepEqual(before.a,[]);
    assert.deepEqual(before.b.map((note)=>[note.index,note.text]),[["1","Yerel"]]);
    assert.deepEqual(before.c.map((note)=>[note.index,note.text]),[["1","Bir"],["2","İki"],["3","Üç"]]);
    const moved=sectionEndnoteViews([c,b,a,generated],endnotesFromHtml);
    assert.deepEqual(moved.c,[]);
    assert.deepEqual(moved.a.map((note)=>[note.index,note.text]),[["1","Üç"],["2","Bir"],["3","İki"]]);
    const removed=sectionEndnoteViews([b,c],endnotesFromHtml);
    assert.deepEqual(removed.c.map((note)=>[note.index,note.text]),[["1","Üç"]]);
    assert.match(a.editableHtml,/>99</); // presentation never rewrites saved source
  });
  it("detects reversed and duplicate field delimiters even when counts match", () => {
    const mark = (kind) => `<w:r><w:fldChar w:fldCharType="${kind}"/></w:r>`;
    assert.equal(auditDocxFields(mark("end") + mark("begin")).unbalanced, true);
    assert.equal(auditDocxFields(mark("begin") + mark("separate") + mark("separate") + mark("end")).unbalanced, true);
    assert.equal(auditDocxFields([mark("begin"), mark("end")]).unbalanced, true);
    assert.equal(auditDocxFields(mark("begin") + mark("begin") + mark("end") + mark("separate") + mark("end")).unbalanced, false);
  });
  it("reports malformed imported field order instead of exporting broken fields", () => {
    const mark = (kind) => `<span data-docx-field="fldChar" data-docx-fldchar="${kind}"></span>`;
    const issues = [];
    const html = foldFieldMarkup(`<p>${mark("end")}Cached${mark("begin")}</p>`, issues);
    assert.equal(html, "<p>Cached</p>");
    assert.equal(issues[0].code, "field-unbalanced");
  });
  it("keeps non-ASCII target identities distinct and stable when moved", () => {
    const model = compileThesisDocument(structuredClone(generic), {}, "Tez", "<p>x</p>");
    const base = model.sections.find((section) => section.id === "main");
    const first = { ...base, html: '<h1 data-target-id="ş">Bir</h1>' };
    const second = { ...base, id: "other", html: '<h1 data-target-id="ç">İki</h1>' };
    const before = collectIndexSources([first, second], extractThesisHeadings);
    const after = collectIndexSources([second, first], extractThesisHeadings);
    assert.notEqual(before[0].anchor, before[1].anchor);
    assert.equal(before[0].anchor, after[1].anchor);
    assert.notEqual(targetBookmarkName(before[0].anchor), targetBookmarkName(before[1].anchor));
  });
  it("writes the semantic appendix title bookmark into the exported DOCX", async () => {
    const model = compileThesisDocument(structuredClone(generic), {}, "Tez", "<p>x</p>");
    const base = model.sections.find((section) => section.id === "main");
    const appendix = { ...base, id: "appendices", type: "appendices", html: '<p data-target-id="ek-a"><strong>EK 1.</strong> Test soruları</p>' };
    appendix.indexSources = collectIndexSources([appendix], extractThesisHeadings);
    assert.equal(appendix.indexSources.length, 1);
    assert.equal(asBlocks(appendix)[0].appendixAnchor, appendix.indexSources[0].anchor);
    model.sections = [appendix];
    model.indexSources = appendix.indexSources;
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const xml = strFromU8(files["word/document.xml"]);
    assert.match(xml, new RegExp(`w:name="${targetBookmarkName(appendix.indexSources[0].anchor)}"`));
    assert.deepEqual(auditDocxFields(xml).dangling, []);
  });
  it("keeps target anchors when a table before them is deleted or an appendix is added", () => {
    const model = compileThesisDocument(structuredClone(generic), {}, "Tez", "<p>x</p>");
    const base = model.sections.find((section) => section.id === "main");
    const table = '<table data-target-id="t1"><caption>Birinci</caption><tbody><tr><td>a</td></tr></tbody></table>';
    const heading = '<h1 data-target-id="h1">Bir</h1><table data-target-id="t2"><caption>İkinci</caption><tbody><tr><td>a</td></tr></tbody></table>';
    const find = (list, key) => list.find((entry) => entry.targetKeys?.includes(key));
    const before = collectIndexSources([{ ...base, html: table + heading }], extractThesisHeadings);
    const appendix = { ...base, id: "appendices", type: "appendices", html: '<p data-target-id="ek-b"><strong>EK 2.</strong> Yeni ek</p>' };
    const after = collectIndexSources([{ ...base, html: heading }, appendix], extractThesisHeadings);
    for (const key of ["h1", "t2"]) assert.equal(find(after, key).anchor, find(before, key).anchor);
    assert.equal(find(after, "t1"), undefined);
    assert.ok(find(after, "ek-b"));
  });
  it("exports cross references as live fields to persistent targets and reports what it cannot resolve", async () => {
    const model = compileThesisDocument(structuredClone(generic), {}, "Tez", "<p>x</p>");
    const base = model.sections.find((section) => section.id === "main");
    const xref = (id, text) => `<span class="academic-xref" data-ref-kind="heading" data-ref-id="${id}">${text}</span>`;
    const body = `<h1 data-target-id="giris">Giriş</h1><p>Bkz ${xref("giris", "Giriş")} ve ${xref("silinmis", "Silinmiş")}.</p>`
      + '<p><span data-docx-field="fldChar" data-docx-fldchar="begin"></span><span data-docx-field="instrText" data-docx-instruction=" FOOBAR x "></span><span data-docx-field="fldChar" data-docx-fldchar="separate"></span>önbellek<span data-docx-field="fldChar" data-docx-fldchar="end"></span></p>';
    const section = { ...base, html: body };
    const sources = collectIndexSources([section], extractThesisHeadings);
    section.indexSources = sources;
    model.sections = [section];
    model.indexSources = sources;
    const blob = await buildThesisDocx(model);
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    const bookmark = targetBookmarkName(sources[0].anchor);
    assert.match(xml, new RegExp(`HYPERLINK \\\\l &quot;${bookmark}&quot;|HYPERLINK \\\\l "${bookmark}"`));
    assert.match(xml, /ADDIN TxtNote\.Xref/);
    assert.match(xml, /FOOBAR x/);
    const codes = blob.exportIssues.fieldIssues.map((record) => record.code);
    assert.ok(codes.includes("xref-target-missing") && codes.includes("field-unknown-preserved"), codes.join());
    assert.deepEqual(blob.exportIssues.fieldAudit.dangling, []);
    assert.equal(blob.exportIssues.fieldAudit.unbalanced, false);
  });
  it("flows long legacy PDF endnotes after document text instead of reserving footnote space", () => {
    const blocks = [
      { type: "paragraph", runs: [{ type: "text", text: "İlk " }, { type: "footnote", index: 1, text: "Dipnot" }, { type: "endnote", index: 1, text: "Sonnot ".repeat(3000) }] },
      { type: "paragraph", runs: [{ type: "text", text: "Son paragraf" }] },
    ];
    const boxes = boxesFromBlocks(blocks, approximateWidth);
    assert.equal(boxes[0].footnotes.length, 1);
    assert.equal(boxes.at(-1).type, "endnote");
    const pages = paginateBoxes(boxes);
    assert.ok(pages.length > 2);
    assert.ok(pages.flatMap((page) => page.footnotes).every((note) => note.text === "Dipnot"));
    assert.equal(pages.flatMap((page) => page.items).filter((item) => item.type === "endnote").flatMap((item) => item.lines).join(" ").split("Sonnot").length - 1, 3000);
  });
  it("serializes nested imported bookmarks inside a generated heading target as flat XML markers", async () => {
    const style = { fontFamily: "Times New Roman", fontSizePt: 12 };
    const paragraph = docxParagraph([{ type: "bookmark", name: "NativeOuter", children: [{ type: "bookmark", name: "NativeInner", children: [{ type: "text", text: "Başlık" }] }] }], style, { language: "tr", body: style }, { anchor: ["heading", "appendix"] });
    const files = unzipSync(new Uint8Array(await (await Packer.toBlob(new Document({ sections: [{ children: [paragraph] }] }))).arrayBuffer()));
    const xml = strFromU8(files["word/document.xml"]);
    assert.doesNotMatch(xml, /bookmarkUniqueNumericId|<start>|<children>|<end>/);
    for (const name of ["NativeOuter", "NativeInner"]) assert.match(xml, new RegExp(`w:bookmarkStart w:name="${name}"`));
    const report = auditDocxFields(xml);
    assert.deepEqual(report.duplicates, []);
    assert.deepEqual(report.dangling, []);
    assert.equal(report.unbalanced, false);
  });
});
