import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { akuIsgTezsizProje as t } from "../../../../engine/src/templates/aku-isg.js";
import { buildThesisCss, compileThesisDocument } from "../../../../engine/src/engine.js";

describe("AKÜ FBE İş Güvenliği tezsiz dönem projesi template", () => {
  it("validates, is registered and carries the template values", async () => {
    assert.deepEqual(validateThesisTemplate(t), []);
    const { fallback, template } = await resolveThesisTemplate({ templateId: t.id });
    assert.equal(fallback, false);
    assert.equal(template.instituteId, "fbe-isg-proje");
    assert.equal(t.degreeType, "master");
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 });
    const front = t.sections.find((s) => s.id === "ethics").overrides.page.margins;
    assert.deepEqual(front, { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 30 });
    assert.deepEqual(t.sections.find((s) => s.id === "outer-cover").overrides.page.margins, { topMm: 30, bottomMm: 30, leftMm: 40, rightMm: 25 });
    const b = t.typography.body;
    assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.firstLineIndentMm, b.spaceBeforePt, b.spaceAfterPt], ["Times New Roman", 12, 1.5, "justify", 0, 0, 0]);
    assert.equal(t.page.numbering.style.fontSizePt, 11);
    assert.equal(t.page.footer.distanceMm, 12.506); // source pgMar=709 twips
    assert.equal(t.page.footer.trailingBlankLines, 1);
    assert.equal(t.page.numbering.baselineFromTopMm, undefined); // source ordinary PAGE paragraph + trailing blank, not an anchored textbox
    const intro = t.sections.find((s) => s.id === "introduction").overrides.page.numbering;
    assert.deepEqual([intro.format, intro.startAt, intro.restart], ["arabic", 1, true]);
    assert.equal(t.sections.find((s) => s.id === "inner-cover").overrides.page.numbering.enabled, false);
    assert.equal(t.bibliography.citationStyle, "author-year");
    assert.ok(t.source.notes.length >= 6);
  });
});

describe("AKÜ İSG inline hanging TOC clipping", () => {
  it("reveals unlabelled first letters and keeps labelled titles clear of their numbers", () => {
    const model = compileThesisDocument(t, { values: {} }, "Test Başlığı", "<h1>GİRİŞ</h1><p>Metin.</p>");
    const css = buildThesisCss(model);
    assert.match(css, /\.thesis-index-text>\.thesis-index-title\{flex:1 1 0;min-width:0;overflow:hidden;position:relative\}/);
    assert.match(css, /\.thesis-index-text>\.thesis-index-title\{margin-left:-6\.3mm;padding-left:6\.3mm\}/);
    const toc = model.sections.find((section) => section.id === "toc");
    assert.match(toc.html, /<span class="thesis-index-title"><span class="thesis-index-label">1\.<\/span> GİRİŞ/);
    assert.match(css, /\.thesis-index-title>\.thesis-index-label\{white-space:nowrap\}/);
  });
});
