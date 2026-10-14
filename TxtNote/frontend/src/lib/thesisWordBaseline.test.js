import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildThesisCss, compileThesisDocument, thesisWordBaselineProbes } from "../../../../engine/src/engine.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { WORD_FONT_METRICS, wordBaselineCss, wordBaselineProbe } from "../../../../engine/src/wordBaseline.js";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";

const word = { mode: "word", singleLineEm: 1.15, baseline: "word" };
const withBaseline = { ...mcbuMaster, typography: { ...mcbuMaster.typography, lineSpacing: word } };

describe("opt-in Word baseline placement", () => {
  it("targets line top + lineGap + ascent and falls back to the metric offset", () => {
    const probe = wordBaselineProbe({ fontFamily: "Times New Roman", fontSizePt: 12, lineHeight: 1.5 }, word, 1.725);
    const m = WORD_FONT_METRICS["times new roman"];
    assert.ok(Math.abs(probe.targetPt - (m.lineGap + m.ascent) * 12) < 1e-3);
    assert.ok(Math.abs(probe.targetPt - 11.2031) < 1e-3, "0.9336 em at 12 pt");
    assert.ok(Math.abs(probe.fallbackPt - 3.196) < 1e-2, "CSS centres 1.5-line leading, Word puts it below");
    assert.match(wordBaselineCss(probe), /^position:relative;top:calc\(-1 \* var\(--thesis-wb-[0-9a-z]+, 3\.\d+pt\)\);$/);
  });

  it("is off unless the template opts in, and for fonts without known metrics", () => {
    assert.equal(wordBaselineProbe({ fontFamily: "Times New Roman", fontSizePt: 12 }, { mode: "word", singleLineEm: 1.15 }, 1.725), null);
    assert.equal(wordBaselineProbe({ fontFamily: "Garamond", fontSizePt: 12 }, word, 1.725), null);
    // MCBÜ opts in (Word measured model); the engine default stays off for a template without the key.
    const plain = compileThesisDocument({ ...mcbuMaster, typography: { ...mcbuMaster.typography, lineSpacing: { mode: "word", singleLineEm: 1.15 } } }, {}, "T", "<p>a</p>");
    assert.deepEqual(thesisWordBaselineProbes(plain), []);
    assert.doesNotMatch(buildThesisCss(plain), /--thesis-wb-/);
  });

  it("gives every text-bearing element of an opted-in template a paint-only offset", () => {
    assert.deepEqual(validateThesisTemplate(withBaseline), []);
    assert.ok(validateThesisTemplate({ ...mcbuMaster, typography: { ...mcbuMaster.typography, lineSpacing: { mode: "multiplier", baseline: "word" } } }).some((e) => /baseline/.test(e)));
    const model = compileThesisDocument(withBaseline, { values: { STUDENT_NAME: "A" } }, "T", "<h1>Bir</h1><p>a</p><ul><li>x</li></ul>");
    const css = buildThesisCss(model);
    const probes = thesisWordBaselineProbes(model);
    assert.ok(probes.length >= 3, "body 1.5, single-spaced pages, headings");
    for (const selector of [".thesis-body p{", ".thesis-body h1{", "[data-thesis-block=", ".thesis-body figcaption{", ".thesis-toc{"]) {
      const rule = css.split("\n").find((line) => line.includes(selector) && line.includes("--thesis-wb-"));
      assert.ok(rule, `${selector} lifted`);
    }
    assert.match(css, /:is\(li,td,th,figcaption,caption\) p\{top:0\}/, "nested paragraphs are not lifted twice");
    for (const probe of probes) assert.match(css, new RegExp(`--thesis-wb-${probe.id}`));
  });

  it("additive paragraph spacing puts after(prev) + before(next) between paragraphs and headings", () => {
    const additive = { ...mcbuMaster, typography: { ...mcbuMaster.typography, lineSpacing: { ...word, paragraphSpacing: "additive" }, paragraph: { ...mcbuMaster.typography.paragraph, spaceBeforePt: 6, spaceAfterPt: 6 } } };
    assert.deepEqual(validateThesisTemplate(additive), []);
    const css = buildThesisCss(compileThesisDocument(additive, {}, "T", "<p>a</p><p>b</p>"));
    assert.match(css, /\.thesis-body p\+p\{margin-top:12pt\}/);
    assert.doesNotMatch(buildThesisCss(compileThesisDocument(withBaseline, {}, "T", "<p>a</p>")), /p\+p\{margin-top/);
  });
});

describe("Word baseline target by line-spacing rule (measured in engine-word-parity)", () => {
  const style = { fontFamily: "Times New Roman", fontSizePt: 10 };
  const probe = (spacing) => wordBaselineProbe(style, { ...spacing, baseline: "word" }, spacing.value / 10);
  it("exact puts the baseline at 0.8 x value whatever the glyph size", () => {
    assert.equal(probe({ rule: "exact", value: 14 }).targetPt, 11.2);
    assert.equal(wordBaselineProbe({ ...style, fontSizePt: 24 }, { rule: "exact", value: 14, baseline: "word" }, 14 / 24).targetPt, 11.2);
  });
  it("atLeast adds the shortfall above the text and equals auto when the text is taller", () => {
    const m = WORD_FONT_METRICS["times new roman"];
    const natural = (m.lineGap + m.ascent) * 10;
    assert.ok(Math.abs(probe({ rule: "atLeast", value: 14 }).targetPt - (natural + 14 - (m.lineGap + m.ascent + m.descent) * 10)) < 1e-3);
    assert.ok(Math.abs(probe({ rule: "atLeast", value: 5 }).targetPt - natural) < 1e-3);
  });
  it("exact and atLeast of the same pitch never share a custom property", () => {
    assert.notEqual(probe({ rule: "exact", value: 14 }).id, probe({ rule: "atLeast", value: 14 }).id);
  });
});
