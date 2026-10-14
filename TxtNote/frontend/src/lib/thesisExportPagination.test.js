import assert from "node:assert/strict";
import { it } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { collectThesisBlockPageBreaks } from "../../../../engine/src/exportPagination.js";
import { pageMetrics } from "../../../../engine/src/pageLayout.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import generic from "../../../../engine/src/templates/generic.js";
import { asBlocks } from "../../../../engine/src/docx/xml.js";

it("preserves measured whole-block page transitions independently of editor zoom", () => {
  const group = { id: "main", rules: { page: generic.page } };
  const m = pageMetrics(generic.page);
  for (const scale of [.5, 1, 1.75]) {
    const base = 100 + m.topMarginPx * scale;
    const block = (id, first, previous) => ({
      dataset: { academicId: id },
      closest: () => null,
      querySelector: () => null,
      previousElementSibling: { getClientRects: () => [{ bottom: base + previous * scale }] },
      getClientRects: () => [{ top: base + first * scale }],
    });
    const nodes = [block("same", 200, 180), block("moved", m.stridePx + 2, m.contentHeightPx - 5)];
    const paper = { dataset: { thesisSection: "main" }, getBoundingClientRect: () => ({ top: 100, width: m.widthPx * scale }), querySelectorAll: () => nodes };
    assert.deepEqual(collectThesisBlockPageBreaks({ querySelectorAll: () => [paper] }, [group]), ["moved"]);
  }
});

it("writes a Word page break on the table caption only when the live editor moved it", async () => {
  const model = compileThesisDocument(generic, {}, "Test", '<p>Before table</p><table data-academic-id="target"><caption>Measured boundary</caption><tr><td>Editable cell</td></tr></table>');
  const xml = async options => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, options)).arrayBuffer()))["word/document.xml"]);
  const caption = value => value.match(/<w:p>[^]*?Measured boundary[^]*?<\/w:p>/)?.[0].split("<w:p>").at(-1);
  assert.match(caption(await xml({ blockPageBreaks: ["target"] })), /<w:pageBreakBefore\s*\/>/);
  assert.doesNotMatch(caption(await xml({})), /<w:pageBreakBefore\s*\/>/);
  assert.match(await xml({}), /<w:trHeight[^>]*w:hRule="atLeast"/, "table rows retain the CSS line-box and padding minimum without clipping taller cells");
});

it("preserves a measured heading transition without changing authored heading rules", async () => {
  const model = compileThesisDocument(generic, {}, "Test", '<p>Before</p><h2>Moved heading</h2><p>After</p>');
  const section = model.sections.find((entry) => entry.type === "mainContent");
  const heading = asBlocks(section).find((block) => block.type === "heading" && block.level === 2);
  assert.ok(heading.thesisAnchor);
  const bytes = new Uint8Array(await (await buildThesisDocx(model, { blockPageBreaks: [heading.thesisAnchor] })).arrayBuffer());
  const xml = strFromU8(unzipSync(bytes)["word/document.xml"]);
  const paragraph = [...xml.matchAll(/<w:p>[^]*?<\/w:p>/g)].map(([value]) => value).filter((value) => value.includes("Moved heading")).at(-1);
  assert.match(paragraph, /<w:pageBreakBefore\s*\/>/);
  assert.equal(Boolean(section.rules.headings[2].pageBreakBefore), false);
});

it("drops the editor's table wrap margin from the caption space-before when the table starts a page", async () => {
  const model = compileThesisDocument(generic, {}, "Test", '<p>Before table</p><table data-academic-id="target"><caption>Measured boundary</caption><tr><td>Editable cell</td></tr></table>');
  const xml = async options => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, options)).arrayBuffer()))["word/document.xml"]);
  const before = value => Number(value.match(/<w:p>[^]*?Measured boundary[^]*?<\/w:p>/)[0].split("<w:p>").at(-1).match(/<w:spacing[^>]*w:before="(\d+)"/)?.[1] ?? 0);
  const mid = before(await xml({})), top = before(await xml({ blockPageBreaks: ["target"] }));
  assert.ok(mid - top >= 12 * 20 - 1, `mid-page keeps the 12 pt wrap margin (${mid} vs ${top})`);
});
