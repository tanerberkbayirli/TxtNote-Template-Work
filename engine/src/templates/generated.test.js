import test from "node:test";
import assert from "node:assert/strict";
import { GENERATED_THESIS_TEMPLATES } from "./generated/index.js";
import { THESIS_TEMPLATE_REGISTRY, findThesisTemplateDescriptor, resolveThesisTemplate } from "../registry.js";
import { compileThesisDocument } from "../engine.js";

const official = THESIS_TEMPLATE_REGISTRY.filter((entry) => entry.status === "official");

test("every generated draft loads, validates and compiles without falling back", async () => {
  assert.ok(GENERATED_THESIS_TEMPLATES.length > 0);
  for (const entry of GENERATED_THESIS_TEMPLATES) {
    const { template, fallback, reason } = await resolveThesisTemplate({ templateId: entry.id });
    assert.equal(fallback, false, `${entry.id}: ${reason}`);
    assert.equal(template.id, entry.id);
    assert.equal(template.status, "generic", `${entry.id}: a generated draft is never official until reviewed`);
    assert.match(entry.displayName, /\(taslak\)$/);
    // Special pages with blocks are static (edited through layout overrides); the editable-seed form of the old engine is gone.
    for (const section of template.sections) if (Array.isArray(section.blocks)) assert.equal(section.mode, "static", `${entry.id} › ${section.id}`);
    // The review tells the user what the sources left open; a gate result is only kept from this engine's export.
    const review = template.source?.review;
    assert.ok(review && Array.isArray(review.unknown) && Array.isArray(review.inferred) && Array.isArray(review.conflicts), entry.id);
    if (review.gate) assert.equal(review.gate.exportTool, "engine/tools/export.mjs", entry.id);
    const model = compileThesisDocument(template, { values: { THESIS_TITLE: "Deneme" } }, "Deneme", "<h1>Giriş</h1><p>Metin.</p>");
    assert.ok(model.sections.some((section) => section.type === "mainContent"), entry.id);
  }
});

test("a generated draft never displaces an official template of the same selection", () => {
  for (const entry of official) {
    const selection = { universityId: entry.universityId, instituteId: entry.instituteId, degreeType: entry.degreeType, language: entry.language };
    assert.equal(findThesisTemplateDescriptor(selection).status, "official", JSON.stringify(selection));
  }
  const ids = new Set(official.map((entry) => entry.id));
  for (const entry of GENERATED_THESIS_TEMPLATES) assert.ok(!ids.has(entry.id), entry.id);
});
