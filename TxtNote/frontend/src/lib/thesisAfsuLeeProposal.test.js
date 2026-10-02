import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileThesisDocument } from "../thesis/engine.js";
import { resolveThesisTemplate } from "../thesis/registry.js";
import { walkSpecialPage } from "../thesis/specialPages.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { afsuLeeProposalMaster, afsuLeeProposalPhd } from "../thesis/templates/afsu-lee-proposal.js";

describe("AFSÜ LEE tez önerisi (afsu-lee-proposal-{master,phd}-tr-v1)", () => {
  it("is valid and registered for both degrees", async () => {
    for (const template of [afsuLeeProposalMaster, afsuLeeProposalPhd]) {
      assert.deepEqual(validateThesisTemplate(template), []);
      const { fallback, template: resolved } = await resolveThesisTemplate({ templateId: template.id });
      assert.equal(fallback, false);
      assert.equal(resolved.id, template.id);
    }
    assert.equal(afsuLeeProposalMaster.degreeType, "master");
    assert.equal(afsuLeeProposalPhd.degreeType, "phd");
  });

  it("keeps the source outline and cover example values", () => {
    const ids = afsuLeeProposalPhd.sections.map((section) => section.id);
    assert.deepEqual(ids, ["cover", "purpose-scope", "general-information", "method", "success-criteria", "originality", "impact", "facilities", "schedule", "other-projects", "ethics-permits", "budget"]);
    const model = compileThesisDocument(afsuLeeProposalPhd, { values: { DEPARTMENT_NAME: "Fizyoterapi", THESIS_YEAR: "2026" } }, "Test", "<p>Metin</p>");
    const texts = [...walkSpecialPage(model.sections.find((section) => section.id === "cover").layout)].filter((node) => node.type === "text");
    assert.ok(texts.some((node) => node.text === "Fizyoterapi ANABİLİM DALI"));
    assert.ok(texts.some((node) => node.text === "(Doktora Tez Önerisi)" && node.style.fontSizePt === 12 && node.style.fontWeight === 700));
    assert.ok(texts.some((node) => node.field === "THESIS_TITLE" && node.style.fontSizePt === 14 && node.style.fontWeight === 700));
    assert.ok(texts.some((node) => node.text === "2026 –AFYONKARAHİSAR" && node.style.fontWeight === 400));
  });
});
