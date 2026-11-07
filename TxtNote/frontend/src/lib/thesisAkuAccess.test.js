import assert from "node:assert/strict";
import test from "node:test";
import { createThesisDocument } from "../../../../engine/src/document.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../../../engine/src/registry.js";

const entries = THESIS_TEMPLATE_REGISTRY.filter(entry => entry.universityId === "aku");

test("AKÜ exposes all 17 reviewed programme variants", () => {
  assert.equal(entries.length, 17);
});

for (const entry of entries) {
  test(`${entry.id}: create by selector and reopen the saved document`, async () => {
    const selection = Object.fromEntries(["universityId", "instituteId", "degreeType", "language"].map(key => [key, entry[key]]));
    const created = await resolveThesisTemplate(selection);
    assert.equal(created.fallback, false, created.reason);
    assert.equal(created.template.id, entry.id);
    const saved = JSON.parse(JSON.stringify(createThesisDocument(created.template, selection, 2026)));
    const reopened = await resolveThesisTemplate({ ...saved.selection, templateId: saved.templateId });
    assert.equal(reopened.fallback, false, reopened.reason);
    assert.equal(reopened.template.id, entry.id);
    const model = compileThesisDocument(reopened.template, saved, "AKÜ erişim kontrolü", "<p>Deneme metni.</p>");
    assert.ok(model.sections.length > 0);
    assert.equal(reopened.template.universityId, "aku");
  });
}
