import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { buildThesisCss, compileThesisDocument, groupThesisSections, thesisFootnoteCss, wordLastLineLeadingMm } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { resolveFootnoteRule } from "../thesis/footnotes.js";
import { flowPagePitchPx, pageMetrics, thesisPagedCss } from "../thesis/pageLayout.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";
import { validateThesisTemplate } from "../thesis/validation.js";

const note = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}" data-fn-index="1">1</sup>`;
const template = () => structuredClone(generic);
const mainOf = (model) => model.sections.find((section) => section.id === "main");

describe("Task 10A.1 page-bottom footnotes (generic)", () => {
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

  it("stamp rules live in the paged CSS and the flow pitch follows browser layout units", () => {
    const css = thesisPagedCss(groupThesisSections(compileThesisDocument(template(), {}, "Tez", "").sections));
    assert.match(css, /\[data-thesis-fn-stamp="reserve"\]\{box-decoration-break:clone;padding-bottom:attr\(data-thesis-fn-reserve px\) !important;margin-bottom:attr\(data-thesis-fn-margin px\) !important\}/);
    assert.match(css, /\[data-thesis-fn-spacer\]\{display:block;float:left !important;clear:none;width:100% !important;height:attr\(data-thesis-fn-spacer px\) !important/);
    assert.match(css, /\[data-thesis-fn-stamp="break"\]\{break-before:column !important\}/);
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
