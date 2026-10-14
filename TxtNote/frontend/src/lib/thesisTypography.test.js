import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../../../../engine/src/templates/generic.js";
import { compileThesisDocument, buildThesisCss } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { resolveIndent, resolveLineSpacing, paragraphGap } from "../../../../engine/src/typography.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { thesisSourceHtml } from "../../../../engine/src/sourceHtml.js";
import { leaderGrid, wordLeaderAdvancePx } from "../../../../engine/src/paragraphTabs.js";
import { emptyParagraphPitchMm } from "../../../../engine/src/wordBaseline.js";

const template = (style, spacing) => {
  const t = structuredClone(generic);
  t.typography.body = { ...t.typography.body, ...style };
  t.typography.paragraph = {};
  t.typography.lineSpacing = spacing;
  t.sections = t.sections.filter((section) => section.type === "mainContent");
  return t;
};
const xmlParts = async (t, html = "<p>AAA</p>") => {
  const blob = await buildThesisDocx(compileThesisDocument(t, {}, "T", html), {});
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
};

describe("canonical typography and Word properties", () => {
  it("uses the actual font metrics and units, preserving legacy pitches", () => {
    const tnr = { fontFamily: "Times New Roman", fontSizePt: 12, lineHeight: 1.5 };
    assert.equal(resolveLineSpacing(tnr, { mode: "word", singleLineEm: 1.15 }).pitchPt, 20.7);
    assert.equal(resolveLineSpacing(tnr).pitchPt, 18);
    assert.equal(resolveLineSpacing(tnr, { rule: "auto", value: 1.5 }).lineTwips, 360);
    assert.equal(resolveLineSpacing(tnr, { rule: "exact", value: 14 }).pitchPt, 14);
    assert.ok(resolveLineSpacing(tnr, { rule: "atLeast", value: 8 }).pitchPt > 13);
    assert.throws(() => resolveLineSpacing({ ...tnr, fontFamily: "UNKNOWN" }, { rule: "auto", value: 1 }), /UNKNOWN/);
  });

  it("writes correct OOXML rule/units and CSS pitch for each canonical rule", async () => {
    for (const [rule, value, line] of [["auto", 1.5, 360], ["exact", 17, 340], ["atLeast", 17, 340]]) {
      const t = template({}, { rule, value });
      assert.deepEqual(validateThesisTemplate(t), []);
      const model = compileThesisDocument(t, {}, "T", "<p>AAA</p>");
      assert.match(buildThesisCss(model), /line-height:\d/);
      const xml = strFromU8((await xmlParts(t))["word/document.xml"]);
      assert.match(xml, new RegExp(`w:line="${line}" w:lineRule="${rule}"`));
    }
  });

  it("normalizes hanging and mirror indents and emits tabs/leaders and keep flags", async () => {
    const indent = { leftMm: 6, rightMm: 3, firstLineMm: 2, hangingMm: 4, mirror: true };
    assert.deepEqual(resolveIndent({ indent }), { first: -4, left: 10, right: 3, mirror: true });
    // Word (measured, MOTOR 2.3): even pages keep the hanging offset on the new left edge; the right limit is the odd page's first-line start.
    assert.deepEqual(resolveIndent({ indent }, true), { first: -4, left: 7, right: 6, mirror: true });
    assert.deepEqual(resolveIndent({ indent: { leftMm: 6, rightMm: 3, firstLineMm: 8, mirror: true } }, true), { first: 8, left: 3, right: 14, mirror: true });
    // The glyph shift between pages is always right - left of the authored values.
    for (const input of [indent, { leftMm: 6, rightMm: 3, firstLineMm: 8, mirror: true }, { leftMm: 14, rightMm: 2, hangingMm: 8, mirror: true }]) {
      assert.equal(resolveIndent({ indent: input }, true).left - resolveIndent({ indent: input }).left, input.rightMm - input.leftMm);
    }
    const t = template({ indent, keepLines: true, widowControl: false, tabStops: [{ positionMm: 100, align: "right", leader: "dots" }] }, { rule: "exact", value: 14 });
    const xml = strFromU8((await xmlParts(t, "<p>AAA\t7</p>"))["word/document.xml"]);
    assert.match(xml, /<w:mirrorIndents\/>/);
    assert.match(xml, /<w:keepLines\/>/);
    assert.match(xml, /<w:widowControl w:val="0"\/>/);
    assert.match(xml, /<w:tab w:val="right" w:pos="5669" w:leader="dot"\/>/);
    assert.match(xml, /<w:tab\/>/);
  });

  it("requires real font faces for canonical demo templates and keeps exact inline line boxes absolute", () => {
    const canonical = template({}, { rule: "exact", value: 17 });
    const model = compileThesisDocument(canonical, {}, "T", '<p>gjpqy <span class="fmt-size-heading">gjpqy</span></p>');
    assert.ok(model.systemFonts.includes("Times New Roman"));
    const css = buildThesisCss(model);
    assert.match(css, /line-height:17pt/);
    assert.doesNotMatch(css, /overflow:clip/); // Word draws oversized exact lines unclipped (measured in the exported PDF)
    assert.match(css, /:is\(span,a,b,strong,i,em,u,s\)\{line-height:inherit\}/);
    const legacy = compileThesisDocument(template({}, { mode: "multiplier" }), {}, "T", "<p>gjpqy</p>");
    assert.deepEqual(legacy.systemFonts, []);
  });

  it("distinguishes named contextual paragraph styles in Word", async () => {
    const t = template({ contextualSpacing: true, spaceBeforePt: 6, spaceAfterPt: 8 }, { rule: "auto", value: 1 });
    t.typography.paragraphStyles = { quote: { italic: true, contextualSpacing: true } };
    const parts = await xmlParts(t, '<p>AAA</p><p data-thesis-style="quote">BBB</p><p data-thesis-style="quote">CCC</p>');
    assert.match(strFromU8(parts["word/document.xml"]), /w:pStyle w:val="ThesisParagraph_/);
    assert.match(strFromU8(parts["word/styles.xml"]), /w:styleId="ThesisParagraph_/);
    assert.equal(paragraphGap(t.typography.body, t.typography.body, {}, true), 0);
    assert.equal(paragraphGap({ spaceAfterPt: 8 }, { spaceBeforePt: 6 }, {}), 8);
    assert.equal(paragraphGap({ spaceAfterPt: 8 }, { spaceBeforePt: 6 }, { paragraphSpacing: "additive" }), 14);
  });

  it("writes landscape pages with the physical width and height Word needs (w > h)", async () => {
    const t = template({}, undefined);
    t.page.orientation = "landscape";
    t.page.widthMm = 297;
    t.page.heightMm = 210;
    t.page.numbering = { ...t.page.numbering, baselineFromTopMm: undefined };
    const xml = strFromU8((await xmlParts(t))["word/document.xml"]);
    const size = /<w:pgSz[^>]*>/.exec(xml)[0];
    assert.match(size, /w:w="16838"/);
    assert.match(size, /w:h="11906"/);
    assert.match(size, /w:orient="landscape"/);
  });
  it("models Word's leader glyph grid and trailing blank footer line pitch (measured)", () => {
    const px = (mm) => mm * 96 / 25.4;
    // 12 pt TNR: hyphen advances 33/600 in (3.96 pt), dot 25/600 in (3 pt) in Word's PDF.
    assert.ok(Math.abs(wordLeaderAdvancePx(4 * 96 / 72) * 72 / 96 - 3.96) < 1e-6);
    assert.ok(Math.abs(wordLeaderAdvancePx(3 * 96 / 72) * 72 / 96 - 3) < 1e-6);
    // Dots start at the first page-grid point after the text and end before the following text (measured: 44.451 mm first dot, 73 dots).
    const advance = wordLeaderAdvancePx(3 * 96 / 72);
    const grid = leaderGrid(px(43.426), px(122.622 - 43.426), advance);
    assert.ok(Math.abs((px(43.426) + grid.offset) / px(1) - 44.45) < 0.01);
    assert.equal(grid.count, 73);
    assert.deepEqual(leaderGrid(10, 5, 0), { offset: 0, count: 0 });
    // One empty 12 pt Times New Roman paragraph is 13.8 pt (1.15 em) high; unknown fonts without singleLineEm are UNKNOWN (0).
    assert.ok(Math.abs(emptyParagraphPitchMm({ fontFamily: "Times New Roman", fontSizePt: 12 }) - 13.8 * 25.4 / 72) < 1e-3);
    assert.equal(emptyParagraphPitchMm({ fontFamily: "Unknown", fontSizePt: 12 }), 0);
    assert.ok(Math.abs(emptyParagraphPitchMm({ fontFamily: "Unknown", fontSizePt: 10 }, { singleLineEm: 1.2 }) - 12 * 25.4 / 72) < 1e-6);
  });
  it("strips measured tab leaders from source without losing typed tabs", () => {
    assert.equal(thesisSourceHtml('<p>A<span data-thesis-tab="tab-0"><i data-thesis-tab-leader="">......</i>\t</span>B</p>'), "<p>A\tB</p>");
  });

  it("suppresses source-defined before spacing after an explicit paragraph page break", () => {
    const t = template({}, { rule: "auto", value: 1, suppressSpaceBeforeAtPageTop: true });
    t.typography.paragraphStyles = { forced: { pageBreakBefore: true, spaceBeforePt: 24 } };
    const model = compileThesisDocument(t, {}, "T", '<p>AAA</p><p data-thesis-style="forced">BBB</p>');
    assert.match(buildThesisCss(model), /p\[data-thesis-style="forced"\]\{margin-top:0 !important\}/);
  });

  it("rejects invalid dimensions/rules instead of accepting a guessed model", () => {
    for (const spacing of [{ rule: "exact", value: -1 }, { rule: "other", value: 1 }, { rule: "auto", value: 1, singleLineEm: 0 }]) assert.ok(validateThesisTemplate(template({}, spacing)).some((e) => e.includes("lineSpacing")));
    assert.ok(validateThesisTemplate(template({ tabStops: [{ positionMm: -1, align: "decimal" }] }, { rule: "auto", value: 1 })).some((e) => e.includes("tabStops")));
  });
});
