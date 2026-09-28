import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  captionLabel,
  headingNumberSequence,
  headingHtml,
  isBlankAcademicNote,
  joinCaptionText,
  parseAcademicHtml,
  tableHtml,
  tocEntries,
  xrefText,
  numberAcademicBlocks,
} from "./academicDocument.js";
import { ACADEMIC_TEMPLATES, academicTemplateById, instantiateAcademicTemplate } from "./academicTemplates.js";
import { academicExportQaHtml } from "./academicQaDocument.js";

describe("academicTemplates", () => {
  it("lists six named outlines with real headings", () => {
    assert.equal(ACADEMIC_TEMPLATES.length, 6);
    const ids = ACADEMIC_TEMPLATES.map((item) => item.id);
    assert.deepEqual(ids, ["article", "thesis", "report", "review", "lab", "free"]);
    for (const item of ACADEMIC_TEMPLATES) {
      assert.ok(item.label);
      assert.ok(item.hint);
      assert.ok(Array.isArray(item.preview));
      if (item.id === "free") {
        assert.equal(item.html, "");
        assert.equal(item.bibliography, false);
        continue;
      }
      assert.match(item.html, /<h1 class="academic-h academic-h1"/);
      assert.doesNotMatch(item.html, /fmt-size-subheading/);
    }
  });

  it("keeps cover fields out of the article body", () => {
    const article = academicTemplateById("article");
    assert.doesNotMatch(article.html, />Başlık</);
    assert.doesNotMatch(article.html, /Yazar\(lar\)/);
    assert.doesNotMatch(article.html, /Üniversite \/ Kurum/);
    assert.match(article.html, /Abstract/);
    assert.match(article.html, /Giriş/);
    assert.match(article.html, /academic-h2/);
  });

  it("gives the thesis roman/arabic numbering scaffolding", () => {
    const thesis = academicTemplateById("thesis");
    assert.equal(thesis.pageNumbering.front, "roman");
    assert.match(thesis.html, /academic-toc/);
    assert.match(thesis.html, /data-academic-page-break/);
    const seeded = instantiateAcademicTemplate(thesis);
    assert.equal(seeded.researchData.pageNumbering.front, "roman");
    assert.equal(seeded.researchData.bibliographyEnabled, true);
  });
});

describe("academicDocument numbering", () => {
  it("numbers nested headings", () => {
    assert.deepEqual(
      headingNumberSequence([
        { level: 1 },
        { level: 2 },
        { level: 2 },
        { level: 1 },
        { level: 1, unnumbered: true },
      ]),
      ["1", "1.1", "1.2", "2", ""],
    );
  });

  it("builds caption and xref labels in Turkish", () => {
    assert.equal(captionLabel("figure", 2), "Şekil 2");
    assert.equal(captionLabel("table", 3), "Tablo 3");
    assert.equal(captionLabel("equation", 1), "(1)");
    assert.equal(xrefText("figure", 2), "Şekil 2");
    assert.equal(xrefText("equation", 3), "Denklem (3)");
  });

  it("parses template html into heading blocks", () => {
    const article = academicTemplateById("article");
    const blocks = parseAcademicHtml(article.html);
    const headings = blocks.filter((block) => block.type === "heading");
    assert.ok(headings.length >= 8);
    const numbered = numberAcademicBlocks(blocks);
    const giris = numbered.blocks.find((block) => block.text === "Giriş");
    assert.equal(giris?.number, "1");
    const toc = tocEntries(numbered.blocks);
    assert.ok(toc.some((item) => item.title.startsWith("1 ")));
  });

  it("detects a blank academic note", () => {
    assert.equal(isBlankAcademicNote({ title: "", content: "", researchData: {} }), true);
    assert.equal(isBlankAcademicNote({ title: "Tez", content: "", researchData: {} }), false);
    assert.equal(headingHtml(1, "Özet", { numbered: true }).includes("data-unnumbered"), true);
  });

  it("parses footnotes, captions and math from HTML", () => {
    const blocks = parseAcademicHtml(
      '<h1 class="academic-h academic-h1">Giriş</h1><p>Metin<sup class="academic-footnote" data-fn-id="fn-1" data-fn-text="Dipnot örneği.">1</sup></p><table><caption>Tablo 1. Katılımcı</caption><tr><th>A</th></tr></table><span class="math-formula math-formula--block" data-display="block" data-latex="E=mc^2" data-eq-numbered="true"></span>',
    );
    const numbered = numberAcademicBlocks(blocks);
    assert.equal(numbered.footnoteCount, 1);
    assert.ok(numbered.blocks.some((block) => block.type === "math" && block.numbered));
    const table = numbered.blocks.find((block) => block.type === "table");
    assert.equal(table?.label, "Tablo 1");
    assert.equal(table?.caption, "Katılımcı");
    assert.equal(joinCaptionText(table.label, table.caption), "Tablo 1. Katılımcı");
    assert.equal(joinCaptionText("Tablo 1", "Tablo 1. Katılımcı"), "Tablo 1. Katılımcı");
  });

  it("builds an editable table with padded cells and a caption", () => {
    const html = tableHtml(3, 2, "Örnek");
    assert.match(html, /academic-table-wrap/);
    assert.match(html, /<table class="academic-table"/);
    assert.match(html, /<td>\u200B<\/td>/);
    assert.match(html, /academic-caption-text">Örnek</);
    assert.equal((html.match(/<th>/g) || []).length, 2);
    assert.equal((html.match(/<tr>/g) || []).length, 3);
  });

  it("keeps QA fixture footnotes and code blocks", () => {
    const numbered = numberAcademicBlocks(parseAcademicHtml(academicExportQaHtml()));
    assert.equal(numbered.footnoteCount, 1);
    assert.equal(numbered.blocks.filter((block) => block.type === "code").length, 2);
    assert.ok(numbered.blocks.some((block) => block.type === "math"));
  });
});
