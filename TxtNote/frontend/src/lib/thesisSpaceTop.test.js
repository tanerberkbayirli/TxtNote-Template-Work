import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import generic from "../../../../engine/src/templates/generic.js";
import { compileThesisDocument, buildThesisCss } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";

// engine-word-structure SPACE_* checks (real Word): the first paragraph of a section that starts a page keeps its space before
// (SPACE_A_FIRST: Word 31.757 mm = editor/PDF), a style with pageBreakBefore loses it (SPACE_FORCED_TOP 28.914 mm), and a natural
// page top loses it through CSS fragmentation. Editor, PDF and DOCX must agree on all three.
const template = () => {
  const t = structuredClone(generic);
  t.typography.lineSpacing = { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse", suppressSpaceBeforeAtPageTop: true };
  t.typography.body = { ...t.typography.body, spaceBeforePt: 6, spaceAfterPt: 10 };
  t.typography.paragraphStyles = { named: { spaceBeforePt: 8, spaceAfterPt: 10 }, forced: { spaceBeforePt: 16, pageBreakBefore: true } };
  return t;
};
const html = '<p data-thesis-style="named">FIRST</p><p data-thesis-style="named">SECOND</p><p data-thesis-style="forced">FORCED</p>';
const model = () => compileThesisDocument(template(), {}, "T", html);
const spacing = (xml, text) => {
  const at = xml.indexOf(`>${text}<`), start = xml.lastIndexOf("<w:p>", at), paragraph = xml.slice(start, at);
  return { before: Number(/w:before="(\d+)"/.exec(paragraph)[1]), pageBreakBefore: /<w:pageBreakBefore\b/.test(paragraph) };
};

describe("space before at the top of a page (suppressSpaceBeforeAtPageTop)", () => {
  it("DOCX keeps the first paragraph's space before and leaves a forced break to Word (which drops it after pageBreakBefore)", async () => {
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model(), {})).arrayBuffer()))["word/document.xml"]);
    // FIRST opens the section: its own space before. SECOND carries the collapsed gap max(previous after 10, own before 8) on
    // space-before; Word renders max(after, before) = the same 10 pt.
    assert.deepEqual(spacing(xml, "FIRST"), { before: 160, pageBreakBefore: false });
    assert.deepEqual(spacing(xml, "SECOND"), { before: 200, pageBreakBefore: false });
    assert.deepEqual(spacing(xml, "FORCED"), { before: 320, pageBreakBefore: true });
  });

  it("editor/PDF CSS zeroes the forced-break style, and never the first paragraph behind the editor's extra wrapper", () => {
    const css = buildThesisCss(model());
    assert.match(css, /p\[data-thesis-style="forced"\]\{margin-top:0 !important\}/);
    // The page-top rules are limited to direct .thesis-body / .rich-text-body children. A rule reaching the editor's real
    // `.thesis-body > div > .rich-text-body > p` would strip the 8 pt Word keeps after a section break (SPACE_A_FIRST).
    const zeroing = css.split("}").filter((rule) => /first-child\{margin-top:0/.test(`${rule}}`));
    assert.ok(zeroing.length > 0);
    for (const rule of zeroing) assert.ok(!/\.thesis-body>div/.test(rule), rule);
  });
});
