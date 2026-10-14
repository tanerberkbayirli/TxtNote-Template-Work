import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { importThesisDocx } from "../../../../engine/src/importDocx.js";
import { docxImportFixture } from "./fixtures/docxImportFixture.js";
const walk = nodes => nodes.flatMap(n => [n, ...walk(n.children || [])]);
const items = d => walk(d.sections.flatMap(s => s.nodes)).filter(n => n.type === "listItem");
const abs = id => `<w:abstractNum w:abstractNumId="${id}">` + [0, 1, 2].map(l => `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="${Array.from({ length: l + 1 }, (_, i) => "%" + (i + 1)).join(".")}."/></w:lvl>`).join("") + "</w:abstractNum>";
const num = (numId, absId, over = "") => `<w:num w:numId="${numId}"><w:abstractNumId w:val="${absId}"/>${over}</w:num>`;
const p = (numId, level, text) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="${numId}"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
const ord = (list, text) => list.find(i => JSON.stringify(i.children[0]).includes(`"${text}"`))?.properties.ordinal;

describe("imported list ordinals follow Word counters", () => {
  const numbering = abs(1) + abs(2) + abs(3) + num(2, 1) + num(7, 2) + num(9, 3);
  it("keeps per-numId counters across foreign-list interruptions and restarts only below a shallower level of the same list", async () => {
    const body = p(2, 0, "C1") + p(2, 1, "A") + p(9, 0, "x") + p(9, 1, "y") + p(7, 0, "z") + p(2, 1, "B") + p(9, 0, "w") + p(2, 1, "C") + p(2, 0, "C2") + p(2, 1, "D") + p(7, 1, "E");
    const list = items(await importThesisDocx(docxImportFixture({ numbering, body })));
    assert.equal(ord(list, "A"), 1); assert.equal(ord(list, "B"), 2); assert.equal(ord(list, "C"), 3);
    assert.equal(ord(list, "C2"), 2); assert.equal(ord(list, "D"), 1);
    assert.equal(ord(list, "y"), 1); assert.equal(ord(list, "w"), 2); assert.equal(ord(list, "E"), 1);
  });
  it("counts a level used without its parent as a first occurrence of that parent", async () => {
    const body = p(2, 0, "Ch") + p(7, 1, "M") + p(2, 2, "S1") + p(2, 2, "S2") + p(2, 1, "Perf") + p(2, 2, "Acc");
    const d = await importThesisDocx(docxImportFixture({ numbering, body })), list = items(d);
    assert.equal(ord(list, "S1"), 1); assert.equal(ord(list, "S2"), 2);
    assert.equal(ord(list, "Perf"), 2); assert.equal(ord(list, "Acc"), 1);
    const perf = walk(d.sections.flatMap(s => s.nodes)).filter(n => n.type === "list" && n.properties.level === 1 && n.properties.numId === "2");
    assert.equal(perf.at(-1).attributes.start, "2");
  });
  it("honours startOverride only on first use", async () => {
    const n2 = abs(1) + num(5, 1, '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="7"/></w:lvlOverride>');
    const list = items(await importThesisDocx(docxImportFixture({ numbering: n2, body: p(5, 0, "a") + p(5, 0, "b") + p(5, 1, "c") + p(5, 0, "d") })));
    assert.deepEqual(["a", "b", "d"].map(t => ord(list, t)), [7, 8, 9]);
  });
});
