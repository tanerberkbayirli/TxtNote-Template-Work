import test from "node:test";
import assert from "node:assert/strict";
import { buildThesisGuide, headingNumberExample } from "./thesisGuide.js";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";

test("guide reads rules from the template", () => {
  const entries = [mcbuMaster];
  const guide = buildThesisGuide(entries[0]);
  assert.ok(guide.title.includes("Manisa"));
  assert.equal(guide.headingRules[0].value.includes("BİRİNCİ BÖLÜM"), true);
  assert.ok(guide.layout.some(row => row.label === "Kenar boşlukları" && row.value.includes("sol 40")));
  assert.ok(guide.citation.heading);
});

test("heading number examples", () => {
  assert.equal(headingNumberExample({ numbering: { enabled: true, format: "{1}.{2}." } }), "1.1.");
  assert.equal(headingNumberExample({ numbering: { enabled: false } }), null);
});
