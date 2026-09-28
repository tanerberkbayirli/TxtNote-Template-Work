import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildThesisCss, compileThesisDocument, thesisWordBaselineProbes } from "../thesis/engine.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { WORD_FONT_METRICS, wordBaselineCss, wordBaselineProbe } from "../thesis/wordBaseline.js";
import { mcbuMaster } from "../thesis/templates/mcbu.js";

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
    const plain = compileThesisDocument(mcbuMaster, {}, "T", "<p>a</p>");
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
});
