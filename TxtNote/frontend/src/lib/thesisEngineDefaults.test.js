import { describe, it } from "node:test";
import assert from "node:assert/strict";
import generic from "../../../../engine/src/templates/generic.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { withEngineDefaults } from "../../../../engine/src/engineDefaults.js";

const minimal = () => {
  const t = structuredClone(generic);
  delete t.tables; delete t.figures; delete t.bibliography;
  delete t.typography.headings; t.toc.levels = [1, 2, 3];
  t.page.header = { firstPage: "same" };
  return t;
};

describe("engine defaults for rules a source does not define", () => {
  it("returns a fully specified template unchanged", () => {
    assert.equal(withEngineDefaults(generic), generic);
  });
  it("accepts a template without heading styles, caption rules, bibliography style and header distance", () => {
    assert.deepEqual(validateThesisTemplate(minimal()), []);
    const model = compileThesisDocument(minimal(), {}, "T", "<h1>Bir</h1><h2>İki</h2>", ["Yazar, A. (2026). Eser."]);
    assert.equal(model.headings.length, 2);
  });
  it("fills only absent parts: a given caption rule keeps its values, an absent numbering gets the default", () => {
    const t = structuredClone(generic);
    delete t.tables.numbering;
    const filled = withEngineDefaults(t);
    assert.equal(filled.tables.label, "Tablo");
    assert.equal(filled.tables.style, t.tables.style);
    assert.deepEqual(filled.tables.numbering, { scope: "document", format: "{n}", sequence: "arabic" });
    assert.deepEqual(validateThesisTemplate(t), []);
  });
  it("fills an omitted position on a partial caption rule, but preserves explicit invalid positions", () => {
    const t = structuredClone(generic);
    t.tables = { label: "Tablo", style: structuredClone(generic.tables.style), numbering: structuredClone(generic.tables.numbering) };
    const filled = withEngineDefaults(t);
    assert.equal(filled.tables.position, "above");
    assert.equal(filled.figures.position, generic.figures.position);
    assert.deepEqual(validateThesisTemplate(t), []);

    const invalid = { ...t, tables: { ...t.tables, position: "top" } };
    assert.equal(withEngineDefaults(invalid).tables.position, "top");
    assert.ok(validateThesisTemplate(invalid).some((e) => /tables\.position geçersiz/.test(e)));
  });
  it("preserves the identity of fully specified caption rules", () => {
    const t = structuredClone(generic);
    const filled = withEngineDefaults(t);
    assert.equal(filled.tables, t.tables);
    assert.equal(filled.figures, t.figures);
  });
  it("still rejects a malformed value the template does set", () => {
    const t = structuredClone(generic);
    t.page.header = { heightMm: -1 };
    assert.ok(validateThesisTemplate(t).some((e) => /header/.test(e)));
  });
});
