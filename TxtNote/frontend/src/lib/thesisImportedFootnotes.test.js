import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { importedFootnoteRule, withImportedSections } from "../../../../engine/src/docx/projection.js";
import generic from "../../../../engine/src/templates/generic.js";
import { footnoteAreaNodes, resolveFootnoteRule } from "../../../../engine/src/footnotes.js";

const element = (tag) => ({ tag, className: "", children: [], textContent: "", append(...n) { this.children.push(...n); }, appendChild(n) { this.children.push(n); } });
const fakeDoc = { createElement: element, createTextNode: (text) => ({ text }) };
const importedDoc = (format = "docx") => ({
  formatMode: "source", source: { format },
  sections: [{ id: "main", properties: { nativeSectionIndex: 0 } }],
  styles: { default: { properties: { fontFamily: "Cambria", fontSizePt: 11 } }, Normal: { default: true, properties: { fontFamily: "Times New Roman", fontSizePt: 11, spaceAfterPt: 6 } } },
  notes: { "footnote:1": { kind: "footnote", type: "normal", nodes: [{ type: "paragraph", properties: { styleId: "Normal", resolvedSource: { spaceAfterPt: 2, lineSpacing: { rule: "auto", value: 1.15 } } } }] } },
});

describe("imported DOCX footnotes behave like Word", () => {
  it("lets imported .docx notes use the whole page like Word (no cap) and uses the note paragraph style", () => {
    const rule = importedFootnoteRule(importedDoc());
    assert.equal(rule.maxAreaPercent, 100);
    assert.deepEqual([rule.fontFamily, rule.fontSizePt, rule.spaceAfterPt], ["Times New Roman", 11, 2]);
    const template = withImportedSections(structuredClone(generic), { document: importedDoc() });
    assert.equal(template.sections[0].overrides.footnotes.maxAreaPercent, 100);
  });
  it("keeps the authored default of 50 for non-imported documents and for a docx in template mode", () => {
    assert.equal(resolveFootnoteRule({}, {}, {}).maxAreaPercent, 50);
    const templateMode = withImportedSections(structuredClone(generic), { document: { ...importedDoc(), formatMode: "template" } });
    assert.equal(templateMode.sections.some((s) => s.overrides?.footnotes), false);
    const pdf = withImportedSections(structuredClone(generic), { document: importedDoc("pdf") });
    assert.equal(pdf.sections[0].overrides?.footnotes, undefined);
  });
  it("draws a multi-paragraph note as one block per paragraph and a single paragraph unchanged", () => {
    const rule = resolveFootnoteRule({}, {}, {});
    const list = footnoteAreaNodes(fakeDoc, [{ label: "1", text: "A\nB\nC\n" }, { label: "2", text: "Solo" }], rule).find((n) => n.className === "thesis-footnote-list");
    const [multi, single] = list.children;
    assert.deepEqual(multi.children.map((c) => c.className), ["thesis-footnote-para", "thesis-footnote-para", "thesis-footnote-para"]);
    assert.equal(multi.children[1].textContent, "B");
    assert.equal(single.children.some((c) => c.className === "thesis-footnote-para"), false);
    assert.equal(single.children.at(-1).text, "Solo");
  });
});
