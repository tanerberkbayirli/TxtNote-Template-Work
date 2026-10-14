import assert from "node:assert/strict";
import { it } from "node:test";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../thesis/registry.js";
import { compileThesisDocument } from "../thesis/engine.js";

it("uses one primary English title throughout every English template and preserves legacy titles", async () => {
  for (const descriptor of THESIS_TEMPLATE_REGISTRY.filter(item => item.language === "en")) {
    const { template } = await resolveThesisTemplate(descriptor);
    const state = { values: { THESIS_TITLE_EN: "Legacy English title" } };
    const current = compileThesisDocument(template, state, "New English title", "<p>Body</p>");
    assert.equal(current.values.THESIS_TITLE, "New English title", template.id);
    assert.equal(current.values.THESIS_TITLE_EN, "New English title", template.id);
    const legacy = compileThesisDocument(template, state, "", "<p>Body</p>");
    assert.equal(legacy.values.THESIS_TITLE, "Legacy English title", template.id);
    assert.equal(legacy.values.THESIS_TITLE_EN, "Legacy English title", template.id);
  }
});

it("keeps the Turkish primary title and its English translation independent", async () => {
  const descriptor = THESIS_TEMPLATE_REGISTRY.find(item => item.language === "tr");
  const { template } = await resolveThesisTemplate(descriptor);
  const model = compileThesisDocument(template, { values: { THESIS_TITLE_EN: "English translation" } }, "Türkçe başlık", "<p>Body</p>");
  assert.equal(model.values.THESIS_TITLE, "Türkçe başlık");
  assert.equal(model.values.THESIS_TITLE_EN, "English translation");
});
