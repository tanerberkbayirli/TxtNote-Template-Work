import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, groupThesisSections, buildThesisCss } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { buildThesisPageModel, thesisPagedCss } from "../thesis/pageLayout.js";
import { tableSemanticsCss } from "../thesis/tableSemantics.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";

const table = '<table><colgroup><col data-col-width="25"><col data-col-width="75"></colgroup><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table>';
const compile = (template, html = table) => compileThesisDocument(template, {}, "T", html);
const parts = async (model) => {
  const zip = unzipSync(new Uint8Array(await (await buildThesisDocx(model, { totalPages: 7 })).arrayBuffer()));
  return Object.fromEntries(Object.entries(zip).filter(([key]) => key.endsWith(".xml")).map(([key, bytes]) => [key, strFromU8(bytes)]));
};

describe("Word structural semantics", () => {
  it("keeps table clipping and resolved column widths out of authored content", () => {
    const source = '<table><colgroup><col data-col-width="25.0" style="width: 25%;"></colgroup><tr><td><txt-table-cell-content><p>A</p><p>B</p></txt-table-cell-content></td></tr></table>';
    assert.equal(thesisSourceHtml(source), '<table><colgroup><col data-col-width="25.0"></colgroup><tr><td><p>A</p><p>B</p></td></tr></table>');
  });
  it("maps row-height, alignment, split/repeat and edge-border choices", async () => {
    const template = structuredClone(generic);
    Object.assign(template.tables, { rowHeight: { rule: "exact", valueMm: 8 }, cantSplit: false, repeatHeader: false, verticalAlign: "bottom", borders: { top: { style: "double", widthPt: 1, color: "123456" } } });
    const model = compile(template);
    const xml = (await parts(model))["word/document.xml"];
    assert.match(xml, /<w:trHeight w:val="454" w:hRule="exact"/);
    assert.match(xml, /<w:tblLayout w:type="fixed"/);
    assert.match(xml, /<w:cantSplit w:val="false"/);
    const cells = [...xml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)];
    assert.ok(cells.length >= 4);
    for (const [cell] of cells) assert.doesNotMatch(cell, /<w:keepNext\/>/, "splittable tables must not acquire an array-valued keep-next chain");
    assert.match(xml, /<w:vAlign w:val="bottom"/);
    assert.match(xml, /<w:top w:val="double" w:color="123456" w:sz="8"/);
    assert.doesNotMatch(xml, /<w:tblHeader\s*\/>/);
    const css = tableSemanticsCss(".test", model.sections.find((section) => section.type === "mainContent")).join("\n");
    assert.match(css, /width:25%/);
    assert.match(css, /width:75%/);
    assert.match(css, /vertical-align:bottom/);
    assert.doesNotMatch(css, /attr\(/);
  });
  it("emits first/even chrome parts, NUMPAGES and source footer distance", async () => {
    const template = structuredClone(generic);
    template.page.differentFirstPage = true;
    template.page.header = { distanceMm: 9, content: "Odd", firstContent: "First", evenContent: "Even {{NUMPAGES}}" };
    template.page.footer = { distanceMm: 12.5, trailingBlankLines: 1 };
    const xml = await parts(compile(template));
    assert.match(xml["word/settings.xml"], /<w:evenAndOddHeaders/);
    assert.match(xml["word/document.xml"], /<w:titlePg/);
    assert.match(xml["word/document.xml"], /w:footer="709"/);
    assert.match(xml["word/document.xml"], /w:type="even"/);
    assert.ok(Object.values(xml).some((part) => /NUMPAGES/.test(part)));
    const totalsPart = Object.values(xml).find((part) => /NUMPAGES/.test(part));
    assert.match(totalsPart, /<w:rPr>[\s\S]*?<w:sz w:val="20"\/>[\s\S]*?<w:fldChar w:fldCharType="begin"[^>]*>[\s\S]*?NUMPAGES/, "Word refresh inherits chrome font size from the field begin run");
    assert.ok(Object.values(xml).some((part) => /<w:t[^>]*>Even /.test(part)));
  });
  it("page model selects physical first/even content and total count", () => {
    const template = structuredClone(generic);
    template.page.header = { content: "Odd", firstContent: "First", evenContent: "Even" };
    const groups = groupThesisSections(compile(template).sections);
    const model = buildThesisPageModel(groups, Object.fromEntries(groups.map((group) => [group.id, 3])));
    const flat = model.flatMap((group) => group.pages);
    assert.equal(flat[0].headerContent, "First");
    assert.equal(flat[1].headerContent, "Even");
    assert.equal(flat[2].headerContent, "Odd");
    assert.equal(flat[0].totalPages, flat.length);
  });
  it("same keep/widow flags reach browser fragmentation and Word", async () => {
    const template = structuredClone(generic);
    template.typography.paragraph = { keepLines: true, widowControl: false, keepWithNext: true };
    const model = compile(template, "<p>First</p><p>Second</p>");
    const css = thesisPagedCss(groupThesisSections(model.sections));
    assert.match(css, /p\{break-inside:avoid;orphans:1;widows:1;break-after:avoid;/);
    const xml = (await parts(model))["word/document.xml"];
    assert.match(xml, /<w:keepLines/);
    assert.match(xml, /<w:widowControl w:val="false"/);
  });
});
