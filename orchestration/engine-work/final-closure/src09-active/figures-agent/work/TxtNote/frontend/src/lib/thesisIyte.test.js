import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { iyteMaster, iytePhd, iyteArticlesMaster, iyteArticlesPhd, iyteEee } from "../thesis/templates/iyte.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { findThesisTemplateDescriptor, resolveThesisTemplate } from "../thesis/registry.js";
import { compileThesisDocument, groupThesisSections } from "../thesis/engine.js";
import { numberThesisPages } from "../thesis/pageLayout.js";
import { buildThesisDocx } from "../thesis/export.js";
import { walkSpecialPage } from "../thesis/specialPages.js";

const templates = [iyteMaster, iytePhd, iyteArticlesMaster, iyteArticlesPhd, iyteEee];
describe("İYTE local source-backed templates", () => {
  it("exposes all five choices through the existing four UI selectors without fallback", async () => {
    for (const template of templates) {
      assert.deepEqual(validateThesisTemplate(template), []);
      const selection = Object.fromEntries(["universityId", "instituteId", "degreeType", "language"].map(key => [key, template[key]]));
      assert.equal(findThesisTemplateDescriptor(selection).id, template.id);
      const resolved = await resolveThesisTemplate(selection);
      assert.equal(resolved.fallback, false);
      assert.equal(resolved.template.id, template.id);
    }
  });
  it("keeps undergraduate Letter / Arial independent of graduate A4 / TNR rules", () => {
    assert.deepEqual([iyteEee.page.widthMm, iyteEee.page.heightMm], [215.9, 279.4]);
    assert.deepEqual(iyteEee.page.margins, { topMm: 25.4, bottomMm: 25.4, leftMm: 25.4, rightMm: 25.4 });
    assert.equal(iyteEee.typography.body.fontFamily, "Arial");
    assert.equal(iyteEee.tables.position, "below");
    for (const template of templates.slice(0, 4)) {
      assert.deepEqual(template.page.margins, { topMm: 25, bottomMm: 25, leftMm: 35, rightMm: 25 });
      assert.equal(template.typography.body.firstLineIndentMm, 12.7);
      assert.equal(template.typography.body.spaceAfterPt, 0);
      assert.equal(template.typography.body.fontFamily, "Times New Roman");
      assert.equal(template.tables.position, "above");
    }
  });
  it("uses the 2026 article directive for both degrees, with three chapters and a separate conclusion", () => {
    for (const template of [iyteArticlesMaster, iyteArticlesPhd]) {
      const sections = template.sections;
      assert.ok(sections.findIndex(s => s.id === "preface") < sections.findIndex(s => s.id === "acknowledgements"));
      const chapters = sections.filter(s => s.group === "body" && s.status === "required");
      assert.deepEqual(chapters.map(s => s.id), ["introduction", "main", "article-2", "article-3", "conclusions"]);
      assert.ok(chapters.every(s => s.titleNumbering === "continueH1"));
      assert.equal(template.sections.find(s => s.id === "vita").status, "required");
      const model = compileThesisDocument(template, { values: { ARTICLE_DOIS: "10.test/one;10.test/two" } }, "Title", "<p>Article</p>");
      assert.ok(model.validation.warnings.some(w => w.field === "ARTICLE_DOIS" && w.actual === 2));
      const complete = compileThesisDocument(template, { values: { ARTICLE_DOIS: "10.test/one;10.test/two;10.test/three" } }, "Title", "<p>Article</p>");
      assert.ok(!complete.validation.warnings.some(w => w.field === "ARTICLE_DOIS"));
    }
    assert.ok(!iyteMaster.sections.some(s => s.id === "vita"));
    assert.ok(iytePhd.sections.some(s => s.id === "vita"));
  });
  it("keeps English and Turkish abstracts editable below their source-required heading blocks", () => {
    const model = compileThesisDocument(iyteMaster, { values: { THESIS_TITLE_TR: "TÜRKÇE BAŞLIK" }, sectionContent: { abstract: "<p>English abstract.</p>", ozet: "<p>Türkçe özet.</p>" } }, "English title", "<h1>INTRODUCTION</h1><p>Body</p>");
    assert.match(model.sections.find(s => s.id === "abstract").html, /English abstract/);
    assert.match(model.sections.find(s => s.id === "ozet").html, /Türkçe özet/);
    for (const [id, heading, title] of [["abstract-heading", "ABSTRACT", "English title"], ["ozet-heading", "ÖZET", "TÜRKÇE BAŞLIK"]]) {
      const nodes = [...walkSpecialPage(model.sections.find(s => s.id === id).layout)];
      assert.ok(nodes.some(n => n.text === heading && n.style.fontSizePt === 16 && n.style.fontWeight === 700));
      assert.ok(nodes.some(n => n.text === title && n.style.fontSizePt === 14 && n.style.textTransform === "uppercase"));
    }
  });
  it("counts hidden preliminary pages and restarts Arabic numbering in the body", () => {
    const model = compileThesisDocument(iyteMaster, { enabledSections: ["acknowledgements"] }, "Title", "<h1>INTRODUCTION</h1><p>Body</p>");
    const groups = groupThesisSections(model.sections);
    const pages = numberThesisPages(groups.map(g => ({ ...g, pageCount: 1 })));
    assert.ok(pages.length > 0);
    // Numbering restart/visibility is owned by rules; hidden pages must retain Roman format.
    assert.equal(model.sections.find(s => s.id === "title-page").rules.page.numbering.startAt, 1);
    assert.equal(model.sections.find(s => s.id === "approval").rules.page.numbering.format, "roman-lower");
    assert.equal(model.sections.find(s => s.id === "approval").rules.page.numbering.enabled, false);
    assert.equal(model.sections.find(s => s.id === "main").rules.page.numbering.restart, true);
    assert.equal(pages.find(s => s.sectionId === "abstract-heading").labels[0], "iv");
    assert.equal(pages.find(s => s.sectionId === "main").labels[0], "1");
    for (const template of templates.slice(0, 4)) {
      assert.ok(template.sections.filter(s => ["body", "back"].includes(s.group)).every(s => s.overrides.page.numbering.format === "arabic"));
    }
  });
  it("does not print absent additional committee members / co-supervisor and never copies source signatures", () => {
    const model = compileThesisDocument(iytePhd, { values: { STUDENT_NAME: "Test AUTHOR" } }, "Title", "<p>Body</p>");
    const nodes = [...walkSpecialPage(model.sections.find(s => s.id === "approval").layout)];
    assert.ok(!nodes.some(n => ["JURY_4_NAME", "JURY_5_NAME", "CO_ADVISOR_NAME"].includes(n.field)));
    assert.ok(!nodes.some(n => n.type === "image"));
    assert.ok(nodes.some(n => n.text?.includes("Test AUTHOR")));
  });
  it("exports genuine Letter geometry and the department logo without broken sample bookmark text", async () => {
    const model = compileThesisDocument(iyteEee, { sectionContent: { introduction: "<p>Introduction</p>" } }, "Project title", "<p>Solution</p>");
    const blob = await buildThesisDocx(model);
    const zip = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const xml = strFromU8(zip["word/document.xml"]);
    assert.match(xml, /w:w="12240"/);
    assert.match(xml, /w:h="15840"/);
    assert.ok(Object.keys(zip).some(k => k.startsWith("word/media/")));
    assert.ok(!xml.includes("Yer işareti tanımlanmamış"));
  });
  it("never mutates shared rules or another degree variant when compiling metadata", () => {
    const before = JSON.stringify(templates);
    for (const template of templates) compileThesisDocument(template, { values: { STUDENT_NAME: "Different AUTHOR" } }, "Changed title", "<p>Editable body</p>");
    assert.equal(JSON.stringify(templates), before);
  });
  it("includes conventional body headings and both abstracts in the generated contents", () => {
    const model = compileThesisDocument(iyteMaster, {}, "Title", "<h1>INTRODUCTION</h1><h2>Research Method</h2><p>Body</p><h1>CONCLUSIONS</h1>");
    const sources = model.indexSources.filter(s => s.kind === "toc" && !s.tocHidden);
    for (const title of ["ABSTRACT", "ÖZET", "INTRODUCTION", "Research Method", "CONCLUSIONS"]) assert.ok(sources.some(s => s.title === title), title);
    assert.equal(iyteMaster.typography.footnotes.leftIndentMm, 10);
    assert.equal((210 - 35 - 25) * iyteMaster.typography.footnotes.separator.widthPercent / 100, 50);
  });
  it("exports the source title-page submission statement as four Word paragraphs", async () => {
    const model = compileThesisDocument(iyteMaster, {}, "Title", "<p>Body</p>");
    const blob = await buildThesisDocx(model);
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
    for (const line of ["A Thesis Submitted to", "the Graduate School of Engineering and Sciences of", "İzmir Institute of Technology", "in Partial Fulfillment of the Requirements for the Degree of"]) assert.ok(paragraphs.some(p => p.includes(line) && !p.includes("Submitted to the Graduate")), line);
  });
});
