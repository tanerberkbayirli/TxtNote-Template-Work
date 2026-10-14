import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { walkSpecialPage } from "../../../../engine/src/specialPages.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { afsuLeeProposalMaster, afsuLeeProposalPhd } from "../../../../engine/src/templates/afsu-lee-proposal.js";

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

  it("applies the AFSÜ LEE guide rules the proposal guide refers to (§1.1/§1.2)", () => {
    const t = afsuLeeProposalPhd;
    assert.deepEqual(t.page.margins, { topMm: 25, leftMm: 40, bottomMm: 25, rightMm: 25 });
    assert.equal(t.typography.body.lineHeight, 1.5);
    assert.equal(t.typography.body.spaceBeforePt, 6);
    assert.equal(t.typography.body.spaceAfterPt, 6);
    assert.equal(t.typography.headings["1"].fontSizePt, 14);
    assert.equal(t.typography.headings["1"].textTransform, "uppercase");
    assert.equal(t.typography.headings["3"].fontSizePt, 12);
    assert.equal(t.typography.footnotes.fontSizePt, 10);
    assert.equal(t.bibliography.style.fontSizePt, 10);
    assert.equal(t.page.numbering.align, "right");
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
