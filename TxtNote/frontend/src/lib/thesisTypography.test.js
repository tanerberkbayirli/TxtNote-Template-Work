import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, buildThesisCss } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { resolveIndent, resolveLineSpacing, paragraphGap } from "../thesis/typography.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";

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
    assert.deepEqual(resolveIndent({ indent }, true), { first: -4, left: 3, right: 10, mirror: true });
    const t = template({ indent, keepLines: true, widowControl: false, tabStops: [{ positionMm: 100, align: "right", leader: "dots" }] }, { rule: "exact", value: 14 });
    const xml = strFromU8((await xmlParts(t, "<p>AAA\t7</p>"))["word/document.xml"]);
    assert.match(xml, /<w:mirrorIndents\/>/);
    assert.match(xml, /<w:keepLines\/>/);
    assert.match(xml, /<w:widowControl w:val="false"\/>/);
    assert.match(xml, /<w:tab w:val="right" w:pos="5669" w:leader="dot"\/>/);
    assert.match(xml, /<w:tab\/>/);
  });

  it("requires real font faces for canonical demo templates and keeps exact inline line boxes absolute", () => {
    const canonical = template({}, { rule: "exact", value: 17 });
    const model = compileThesisDocument(canonical, {}, "T", '<p>gjpqy <span class="fmt-size-heading">gjpqy</span></p>');
    assert.ok(model.systemFonts.includes("Times New Roman"));
    const css = buildThesisCss(model);
    assert.match(css, /line-height:17pt/);
    assert.match(css, /p:not\(\[data-thesis-style\]\)\{overflow:clip\}/);
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
