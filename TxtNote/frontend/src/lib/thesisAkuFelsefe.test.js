import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveThesisTemplate } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuFelsefeLisans, akuFelsefeSeminer } from "../thesis/templates/aku-felsefe.js";

describe("AKÜ Felsefe templates (lisans bitirme tezi, seminer)", () => {
  for (const [t, left, inst] of [[akuFelsefeLisans, 35, "fef-felsefe"], [akuFelsefeSeminer, 30, "fef-felsefe-seminer"]]) {
    it(`${t.id} validates, is registered and carries the guide values`, async () => {
      assert.deepEqual(validateThesisTemplate(t), []);
      const { fallback, template } = await resolveThesisTemplate({ templateId: t.id });
      assert.equal(fallback, false);
      assert.equal(template.instituteId, inst);
      assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: left, rightMm: 20 });
      const b = t.typography.body;
      assert.deepEqual([b.fontFamily, b.fontSizePt, b.lineHeight, b.align, b.firstLineIndentMm, b.spaceBeforePt, b.spaceAfterPt], ["Times New Roman", 12, 1.5, "justify", 12.5, 6, 6]);
      assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.format, t.page.numbering.startAt], ["bottom", "center", "arabic", 1]);
      const q = t.typography.paragraphStyles.blockQuote;
      assert.deepEqual([q.fontSizePt, q.lineHeight, q.leftIndentMm, q.rightIndentMm], [11, 1, 10, 10]);
      assert.equal(t.bibliography.citationStyle, "author-year");
      assert.ok(t.source.notes.length >= 6);
    });
  }
});
