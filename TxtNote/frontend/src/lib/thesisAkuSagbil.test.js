import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileThesisDocument, templateFontFamilies } from "../thesis/engine.js";
import { resolveThesisTemplate } from "../thesis/registry.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { akuSagbilMaster, akuSagbilPhd } from "../thesis/templates/aku-sagbil.js";

describe("AKÜ Sağlık Bilimleri template (2022 guide)", () => {
  it("is valid, registered and differs between degrees only in degree strings", async () => {
    for (const t of [akuSagbilMaster, akuSagbilPhd]) {
      assert.deepEqual(validateThesisTemplate(t), []);
      const { fallback } = await resolveThesisTemplate({ templateId: t.id });
      assert.equal(fallback, false);
    }
    const norm = (t, a, b) => JSON.stringify({ ...t, id: "x", degreeType: "x", displayName: "x" }).replaceAll(a, "C").replaceAll(b, "T");
    assert.equal(norm(akuSagbilMaster, "YÜKSEK LİSANS TEZİ", "Yüksek Lisans Tezi"), norm(akuSagbilPhd, "DOKTORA TEZİ", "Doktora Tezi"));
    assert.deepEqual(templateFontFamilies(akuSagbilMaster), ["Times New Roman"]);
  });
  it("carries the explicit guide values", () => {
    const t = akuSagbilMaster;
    assert.deepEqual(t.page.margins, { topMm: 30, bottomMm: 30, leftMm: 30, rightMm: 30 });
    assert.deepEqual([t.page.numbering.position, t.page.numbering.align, t.page.numbering.style.fontSizePt], ["bottom", "center", 11]);
    assert.equal(t.typography.body.fontSizePt, 12);
    assert.equal(t.typography.body.lineHeight, 1.5);
    assert.equal(t.typography.body.firstLineIndentMm, 0);
    assert.deepEqual(Object.keys(t.typography.headings), ["1", "2", "3"]);
    assert.deepEqual(t.typography.headings["1"].numbering.format, "{1}.");
    assert.equal(t.typography.headings["3"].numbering.format, "{1}.{2}.{3}.");
    assert.equal(t.bibliography.style.fontSizePt, 11);
    assert.equal(t.bibliography.style.hangingIndentMm, 12.5);
    assert.equal(t.bibliography.style.spaceAfterPt, 6);
    assert.equal(t.tables.labelFormat, "{label} {number}:");
    assert.equal(t.tables.continuation.format, "{label} {number}. Devam.");
    assert.equal(t.tables.label, "Çizelge");
    assert.equal(t.typography.paragraphStyles.tableNote.fontSizePt, 8);
    assert.equal(t.typography.footnotes.separator.widthPercent, 50);
  });
  it("counts the hidden front pages so ÖZET is iv and GİRİŞ restarts at 1", () => {
    const m = compileThesisDocument(akuSagbilMaster, { values: { STUDENT_NAME: "A" }, sectionContent: {}, enabledSections: [] }, "T", "<h1>Bulgular</h1><p>x</p>", []);
    const num = (id) => m.sections.find((s) => s.id === id).rules.page.numbering;
    assert.equal(num("inner-cover").enabled, false);
    assert.equal(num("inner-cover").restart, true);
    assert.equal(num("approval").enabled, false);
    assert.equal(num("abstract-tr").enabled, true);
    assert.equal(num("abstract-tr").format, "roman-lower");
    assert.equal(num("introduction").startAt, 1);
  });
});
