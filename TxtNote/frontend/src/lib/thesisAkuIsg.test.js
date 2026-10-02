import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveThesisTemplate } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuIsgTezsizProje as t } from "../thesis/templates/aku-isg.js";

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
    assert.equal(t.page.footer.distanceMm, 17.4); // 12.5 mm (709 twips) + the template footer's trailing empty paragraph (4.87 mm)
    const intro = t.sections.find((s) => s.id === "introduction").overrides.page.numbering;
    assert.deepEqual([intro.format, intro.startAt, intro.restart], ["arabic", 1, true]);
    assert.equal(t.sections.find((s) => s.id === "inner-cover").overrides.page.numbering.enabled, false);
    assert.equal(t.bibliography.citationStyle, "author-year");
    assert.ok(t.source.notes.length >= 6);
  });
});
