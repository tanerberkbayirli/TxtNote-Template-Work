import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../../../../engine/src/templates/generic.js";
import { buildThesisCss, compileThesisDocument, groupThesisSections, thesisFootnoteCss, wordLastLineLeadingMm, wordLastLineLeadings } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { footnoteAreaCap, resolveFootnoteRule } from "../../../../engine/src/footnotes.js";
import { flowPagePitchPx, pageMetrics, thesisPagedCss } from "../../../../engine/src/pageLayout.js";
import { thesisSourceHtml } from "../../../../engine/src/sourceHtml.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";

const note = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}" data-fn-index="1">1</sup>`;
const template = () => structuredClone(generic);
const mainOf = (model) => model.sections.find((section) => section.id === "main");

describe("Task 10A.1 page-bottom footnotes (generic)", () => {
  it("splits notes into the space after a kept reference paragraph before moving that paragraph", () => {
    assert.equal(footnoteAreaCap(247, 50, [219]), 28, "kept block leaves less room than the configured maximum");
    assert.equal(footnoteAreaCap(247, 50, [219, 225]), 22, "all kept references on the page must fit");
    assert.equal(footnoteAreaCap(247, 50, [null, 0, 247, 300]), 123.5, "missing and oversized/fragmented block constraints do not change the default cap");
    assert.equal(footnoteAreaCap(247, 50, [100]), 123.5, "the template maximum still limits notes");
  });
  it("resolves engine defaults from the body font when a template is silent", () => {
    const rule = mainOf(compileThesisDocument(template(), {}, "Tez", "")).rules.footnotes;
    assert.equal(rule.placement, "pageBottom");
    assert.equal(rule.maxAreaPercent, 50);
    assert.deepEqual(rule.separator, { enabled: true, widthPercent: 33, thicknessPt: 0.5, spaceBeforePt: 6, spaceAfterPt: 3 });
    assert.equal(rule.style.fontFamily, generic.typography.body.fontFamily);
    assert.equal(rule.style.fontSizePt, 9);
    assert.equal(rule.style.align, "left");
  });

  it("takes typography, separator and area limit from template data, with section overrides", () => {
    const t = template();
    t.typography.footnotes = { fontFamily: "Arial", fontSizePt: 10, lineHeight: 1, align: "justify", spaceBeforePt: 1, spaceAfterPt: 2, maxAreaPercent: 40, separator: { widthPercent: 50, thicknessPt: 1, spaceBeforePt: 8 } };
    t.sections.find((section) => section.id === "appendices").overrides = { footnotes: { fontSizePt: 8, separator: { enabled: false } } };
    assert.deepEqual(validateThesisTemplate(t), []);
    const model = compileThesisDocument(t, { enabledSections: ["appendices"] }, "Tez", "");
    const rule = mainOf(model).rules.footnotes;
    assert.deepEqual([rule.style.fontFamily, rule.style.fontSizePt, rule.style.lineHeight, rule.style.align, rule.style.spaceBeforePt, rule.style.spaceAfterPt, rule.maxAreaPercent], ["Arial", 10, 1, "justify", 1, 2, 40]);
    assert.deepEqual(rule.separator, { enabled: true, widthPercent: 50, thicknessPt: 1, spaceBeforePt: 8, spaceAfterPt: 3 });
    const appendix = model.sections.find((section) => section.id === "appendices").rules.footnotes;
    assert.equal(appendix.style.fontSizePt, 8); assert.equal(appendix.style.fontFamily, "Arial"); assert.equal(appendix.separator.enabled, false);
    const css = thesisFootnoteCss(groupThesisSections(model.sections).find((group) => group.id === "main"));
    assert.match(css, /data-thesis-footnote-group="main"\]\{position:absolute;[^}]*font-family:"Arial";font-size:10pt;line-height:1;text-align:justify/);
    assert.match(css, /padding:8pt 0 0/);
    assert.match(css, /\.thesis-footnote-separator\{display:block;width:50%;height:0;margin:0 0 3pt;border:0;border-top:1pt solid #111\}/);
    assert.match(css, /\.thesis-footnote\{margin:1pt 0 2pt;/);
    assert.match(buildThesisCss(model), /\.thesis-footnote-layer\{position:absolute;inset:0;pointer-events:none\}/);
  });

  it("rejects malformed footnote rules without blocking valid ones", () => {
    const t = template();
    t.typography.footnotes = { placement: "margin", maxAreaPercent: 95, fontSizePt: -1, separator: { widthPercent: 0, enabled: "yes" }, color: "red" };
    const errors = validateThesisTemplate(t).join("\n");
    for (const expected of ["placement", "maxAreaPercent", "fontSizePt", "separator.widthPercent", "separator.enabled", "color"]) assert.match(errors, new RegExp(`typography\\.footnotes\\.${expected.replace(".", "\\.")}`));
    assert.deepEqual(resolveFootnoteRule({ placement: "sectionEnd" }, {}, {}).placement, "sectionEnd");
  });

  it("strips page-assignment stamps from saved section HTML (idempotent)", () => {
    const stamped = `<p data-thesis-fn-stamp="reserve" data-thesis-fn-reserve="120.5" data-thesis-fn-margin="-112.5">Metin${note("fn-1", "Not")}</p><h2 data-thesis-fn-stamp="break">B</h2>`;
    const clean = thesisSourceHtml(stamped);
    assert.doesNotMatch(clean, /data-thesis-fn-/);
    assert.equal(thesisSourceHtml(clean), clean);
    assert.match(clean, /data-fn-text="Not"/);
    const model = compileThesisDocument(template(), {}, "Tez", stamped);
    assert.doesNotMatch(JSON.stringify(model), /data-thesis-fn-/);
  });

  it("strips the transient first-fragment spacer from saved section HTML", () => {
    const html = `<p data-thesis-fn-stamp="reserve" data-thesis-fn-reserve="0" data-thesis-fn-margin="0">Bir <span data-thesis-fn-spacer="69.67" contenteditable="false"></span>iki</p>`;
    assert.equal(thesisSourceHtml(html), "<p>Bir iki</p>");
  });

  it("page.lastLineFit word: terminal leading enlarges the column, keeps the page pitch and guards non-text blocks", () => {
    const body = { fontFamily: "Times New Roman", fontSizePt: 12, lineHeight: 1.5 };
    const spacing = { mode: "word", singleLineEm: 1.1499, baseline: "word" };
    // 1.5 x 13.799 pt pitch - 13.799 pt single line = 6.8995 pt
    assert.ok(Math.abs(wordLastLineLeadingMm(body, spacing) - 6.8995 * 25.4 / 72) < 0.01);
    assert.equal(wordLastLineLeadingMm({ ...body, lineHeight: 1 }, spacing), 0);
    assert.equal(wordLastLineLeadingMm({ ...body, fontFamily: "Unknown Font" }, null), 0);
    const t = template();
    t.page.lastLineFit = "word";
    t.typography.lineSpacing = spacing;
    t.typography.body = { ...t.typography.body, ...body };
    assert.deepEqual(validateThesisTemplate(t).errors || [], []);
    const model = compileThesisDocument(t, {}, "Tez", "");
    const page = mainOf(model).rules.page;
    assert.ok(page.lastLineLeadingMm > 2);
    const plain = pageMetrics({ ...page, lastLineLeadingMm: 0 }), fit = pageMetrics(page);
    assert.ok(Math.abs(fit.contentHeightPx - plain.contentHeightPx - fit.trailingLeadingPx) < 1e-6);
    assert.ok(Math.abs(fit.contentHeightPx + fit.rowGapPx - plain.contentHeightPx - plain.rowGapPx) < 1e-6);
    assert.equal(fit.stridePx, plain.stridePx);
    const css = thesisPagedCss(groupThesisSections(model.sections));
    assert.match(css, /column-height:calc\(/);
    assert.match(css, /:is\(td,th\)::after\{content:"";display:block;height:[\d.]+mm;margin:0 0 -[\d.]+mm;break-before:avoid/);
    const implicit = structuredClone(t); delete implicit.page.lastLineFit;
    assert.ok(mainOf(compileThesisDocument(implicit, {}, "Tez", "")).rules.page.lastLineLeadingMm > 2, "default under the Word spacing model");
    implicit.page.lastLineFit = "off";
    assert.equal(mainOf(compileThesisDocument(implicit, {}, "Tez", "")).rules.page.lastLineLeadingMm, undefined);
    t.page.lastLineFit = "x";
    assert.match(JSON.stringify(validateThesisTemplate(t)), /lastLineFit/);
    const off = thesisPagedCss(groupThesisSections(compileThesisDocument(template(), {}, "Tez", "").sections));
    assert.doesNotMatch(off, /::after\{content:""/);
  });

  it("gives each paragraph style its own terminal leading (Word: auto multiples only) and guards the smaller ones", () => {
    const body = { fontFamily: "Times New Roman", fontSizePt: 12, lineSpacing: { rule: "auto", value: 1.5 } };
    const spacing = { rule: "auto", value: 1.5, baseline: "word" };
    const styles = {
      single: { lineSpacing: { rule: "auto", value: 1 } },
      double: { lineSpacing: { rule: "auto", value: 2 } },
      exact: { lineSpacing: { rule: "exact", value: 20 } },
      atLeast: { lineSpacing: { rule: "atLeast", value: 20 } },
    };
    const leadings = wordLastLineLeadings(body, styles, spacing);
    const single = 13.799 * 25.4 / 72 / 1; // TNR single line (mm); auto leading = (n - 1) x single
    assert.ok(Math.abs(leadings.body - 0.5 * single) < 0.01);
    assert.equal(leadings.styles.single, 0);
    assert.ok(Math.abs(leadings.styles.double - single) < 0.01);
    assert.equal(leadings.styles.exact, 0, "exact: no overhang in Word");
    assert.equal(leadings.styles.atLeast, 0, "at least: no overhang in Word");
    assert.equal(leadings.max, leadings.styles.double);

    // Template-measured single-line metrics must use the same precedence as resolveLineSpacing.
    const measured = wordLastLineLeadings(body, {
      measuredSingle: { lineSpacing: { rule: "auto", value: 1, singleLineEm: 1.3 } },
      measuredDouble: { lineSpacing: { rule: "auto", value: 2, singleLineEm: 1.3 } },
    }, { ...spacing, singleLineEm: 1.15 });
    assert.equal(measured.styles.measuredSingle, 0);
    assert.ok(Math.abs(measured.styles.measuredDouble - 1.3 * 12 * 25.4 / 72) < 0.001);

    const t = template();
    t.page.lastLineFit = "word";
    t.typography.lineSpacing = spacing;
    t.typography.body = { ...t.typography.body, ...body };
    t.typography.paragraphStyles = { single: styles.single };
    const css = thesisPagedCss(groupThesisSections(compileThesisDocument(t, {}, "Tez", "").sections));
    // Body body lead = column lead: only the single-spaced style is guarded, by the full allowance, on every fragment (clone).
    assert.match(css, /p\[data-thesis-style="single"\][^{]*:not\(\[data-thesis-fn-stamp="reserve"\]\)\{box-decoration-break:clone;padding-bottom:[\d.]+mm\}/, "only reserve stamps replace native padding; break stamps retain their guard");
    assert.doesNotMatch(css, /p\[data-thesis-style="single"\][^{]*:not\(\[data-thesis-fn-stamp\]\)/, "a break stamp must not leave the cancelling margin unbalanced");
    assert.match(css, /p\[data-thesis-style="single"\][^{]*::after\{content:"";display:block;height:0;margin:0 0 -[\d.]+mm\}/);
    assert.doesNotMatch(css, /p:not\(\[data-thesis-style\]\)[^{]*::after\{content:"";display:block;height:0/);
    t.typography.paragraphStyles = { single: styles.single, double: styles.double };
    const withDouble = thesisPagedCss(groupThesisSections(compileThesisDocument(t, {}, "Tez", "").sections));
    assert.match(withDouble, /p:not\(\[data-thesis-style\]\)[^{]*::after\{content:"";display:block;height:0;margin:0 0 -[\d.]+mm\}/, "the body is guarded once a style has a larger lead");
    assert.doesNotMatch(withDouble, /p\[data-thesis-style="double"\][^{]*::after\{content:"";display:block;height:0/);
  });

  it("strips the transient mirror-narrowing float from saved source", () => {
    assert.equal(thesisSourceHtml('<p>a<span data-thesis-mirror-narrow="10" contenteditable="false" style="float:right"></span>b</p>'), "<p>ab</p>");
  });

  it("stamp rules live in the paged CSS and the flow pitch follows browser layout units", () => {
    const css = thesisPagedCss(groupThesisSections(compileThesisDocument(template(), {}, "Tez", "").sections));
    assert.match(css, /\[data-thesis-fn-stamp="reserve"\]\{box-decoration-break:clone;padding-bottom:attr\(data-thesis-fn-reserve px\) !important;margin-bottom:attr\(data-thesis-fn-margin px\) !important\}/);
    assert.match(css, /\[data-thesis-fn-spacer\]\{display:block;float:left !important;clear:none;width:100% !important;height:attr\(data-thesis-fn-spacer px\) !important/);
    assert.match(css, /\[data-thesis-fn-stamp="break"\]\{break-before:column !important;margin-top:0 !important\}/);
    const metrics = pageMetrics(generic.page);
    assert.equal(flowPagePitchPx(metrics), Math.floor(metrics.contentHeightPx * 64) / 64 + Math.floor(metrics.rowGapPx * 64) / 64);
    assert.ok(Math.abs(flowPagePitchPx(metrics) - metrics.stridePx) < 0.05);
  });

  it("keeps real Word footnotes and applies the template footnote typography", async () => {
    const t = template();
    t.typography.footnotes = { fontFamily: "Times New Roman", fontSizePt: 10, align: "justify" };
    const model = compileThesisDocument(t, {}, "Tez", `<p>Metin${note("fn-a", "Birinci not")} ve${note("fn-b", "İkinci not")}</p>`);
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const document = strFromU8(files["word/document.xml"]), notes = strFromU8(files["word/footnotes.xml"]);
    assert.equal((document.match(/<w:footnoteReference /g) || []).length, 2);
    assert.match(notes, /Birinci not/); assert.match(notes, /İkinci not/);
    assert.match(notes, /<w:sz w:val="20"\/>/);
    assert.match(notes, /<w:jc w:val="both"\/>/);
    const defaults = unzipSync(new Uint8Array(await (await buildThesisDocx(compileThesisDocument(template(), {}, "Tez", `<p>A${note("fn-c", "Not")}</p>`))).arrayBuffer()));
    assert.match(strFromU8(defaults["word/footnotes.xml"]), /<w:sz w:val="18"\/>/);
  });
});
