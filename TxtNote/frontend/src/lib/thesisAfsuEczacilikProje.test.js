import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blockDescriptors, gapBetween } from "../thesis/blockGap.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { afsuEczacilikProje } from "../thesis/templates/afsu-eczacilik-proje.js";
import { validateThesisTemplate } from "../thesis/validation.js";

describe("AFSÜ Eczacılık research project template", () => {
  it("validates and centres every page number on the physical page", () => {
    assert.deepEqual(validateThesisTemplate(afsuEczacilikProje), []);
    const model = compileThesisDocument(afsuEczacilikProje, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>");
    for (const section of model.sections.filter((s) => s.rules.page.numbering.enabled)) {
      assert.equal(section.rules.page.numbering.centerOnPage, true, section.id);
      assert.equal(section.rules.page.numbering.align, "center", section.id);
    }
  });

  it("keeps 12 pt between a captioned figure and the next text, 6 pt before the caption", () => {
    const [model] = [compileThesisDocument(afsuEczacilikProje, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>")];
    const rules = model.sections.find((s) => s.id === "introduction").rules;
    const d = Object.fromEntries(blockDescriptors(rules).map((x) => [x.key, x]));
    assert.equal(gapBetween(rules, d.figure, d.p), 12);
    assert.equal(gapBetween(rules, d.p, d.figure), 12);
    assert.equal(rules.figures.spacingBeforePt, 6);
    assert.equal(rules.tables.spacingAfterPt, 6);
    const pitch = structuredClone(rules);
    delete pitch.lineSpacing.figureExitGap;
    assert.ok(gapBetween(pitch, d.figure, d.p) > 19, "default stays the paragraph-pitch rule");
  });
});
