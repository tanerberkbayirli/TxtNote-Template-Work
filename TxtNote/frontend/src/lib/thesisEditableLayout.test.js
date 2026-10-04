import test from "node:test";
import assert from "node:assert/strict";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, groupThesisSections, thesisSectionCss } from "../thesis/engine.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { thesisSectionMode } from "../thesis/document.js";
import { refreshThesisFieldHtml, resolveSpecialPage, specialPageSeedHtml } from "../thesis/specialPages.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";
import { parseAcademicHtml } from "./academicDocument.js";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** The generic cover made editable, plus an optional co-advisor line, a rule and a jury row. */
function editableCoverTemplate() {
  const cover = generic.sections.find((section) => section.id === "cover");
  const blocks = [
    ...cover.blocks,
    { type: "group", visibleWhen: { anyFilled: ["CO_ADVISOR_NAME"] }, blocks: [{ type: "text", value: "İkinci Danışman" }, { type: "metadata", field: "CO_ADVISOR_NAME" }] },
    { type: "separator", widthPercent: 40, thicknessPt: 1, align: "left", marginTopMm: 3 },
    { type: "group", direction: "row", gapMm: 4, blocks: [{ type: "text", value: "Üye", widthPercent: 50 }, { type: "text", value: "Üye" }] },
    { type: "image", source: PNG, widthMm: 20, heightMm: 10, align: "center" },
  ];
  return { ...generic, sections: generic.sections.map((section) => section.id === "cover" ? { ...cover, blocks, mode: "editable", layoutMode: "editable" } : section) };
}

test("layoutMode editable: the section is editable, validates, and still owns its page", () => {
  const template = editableCoverTemplate();
  assert.deepEqual(validateThesisTemplate(template), []);
  const cover = template.sections[0];
  assert.equal(thesisSectionMode(cover), "editable");
  assert.ok(validateThesisTemplate({ ...template, sections: [{ ...cover, layoutMode: "editable", mode: "static" }, ...template.sections.slice(1)] }).some((error) => /mode editable olmalı/.test(error)));
  assert.ok(validateThesisTemplate({ ...template, sections: [{ ...cover, layoutMode: "sometimes" }, ...template.sections.slice(1)] }).some((error) => /layoutMode geçersiz/.test(error)));
  const model = compileThesisDocument(template, { values: { STUDENT_NAME: "Ayşe Yılmaz" } }, "Başlık");
  const section = model.sections[0];
  assert.equal(section.editable, true);
  assert.equal(section.editableLayout, true);
  assert.equal(section.seeded, true);
  assert.equal(section.specialPage, false);
  assert.equal(section.layout, null, "the static block renderer/exporter is not used");
  assert.equal(section.prefixHtml, "", "no section heading above the seeded page");
  const groups = groupThesisSections(model.sections);
  assert.equal(groups[0].sections.length, 1, "the editable cover never shares a page flow");
});

test("seed HTML carries the editor's own marks and live field chips", () => {
  const template = editableCoverTemplate();
  const model = compileThesisDocument(template, { values: { STUDENT_NAME: "Ayşe Yılmaz", CITY: "Manisa" } }, "Tez Başlığı");
  const html = model.sections[0].editableHtml;
  assert.match(html, /<p class="fmt-align-center"[^>]*><span class="fmt-pt-18"><strong><span class="thesis-field" data-field="THESIS_TITLE" contenteditable="false">Tez Başlığı<\/span><\/strong><\/span><\/p>/);
  assert.match(html, /data-field="STUDENT_NAME"[^>]*>Ayşe Yılmaz</);
  assert.match(html, /<p class="thesis-gap" data-gap="12" contenteditable="false"><\/p>/, "spacer → gap paragraph in mm");
  assert.match(html, /data-pt="15"/, "a size outside the menu list is kept as data-pt");
  assert.match(html, /<div class="thesis-optional" data-thesis-optional="CO_ADVISOR_NAME" data-thesis-hidden="true">/, "unfilled optional block is kept but hidden");
  assert.match(html, /<hr class="thesis-rule fmt-align-left" data-length="40" data-thickness="1">/);
  assert.match(html, /<table class="thesis-layout-row" data-gap="4"><tbody><tr><td data-width="50">/);
  assert.match(html, /<figure class="academic-figure fmt-align-center" data-kind="image" contenteditable="false"><img src="data:image\/png;base64,[^"]+" width="76" height="38" alt=""><\/figure>/);
  assert.doesNotMatch(html, /style=/, "CSP: no inline styles");
  // Empty metadata shows the chip's fallback; the chip stays addressable.
  assert.match(html, /data-field="ADVISOR_NAME"[^>]*><\/span>|data-field="ADVISOR_NAME" data-fallback/);
});

test("stored text wins over the seed; chips and optional blocks follow the metadata; the stored copy is clean", () => {
  const template = editableCoverTemplate();
  const first = compileThesisDocument(template, { values: { STUDENT_NAME: "Ayşe Yılmaz" } }, "Başlık");
  const edited = first.sections[0].editableHtml.replace("</p>", "</p><p class=\"fmt-align-right\">Kendi satırım</p>");
  const thesis = { values: { STUDENT_NAME: "Mehmet Kaya", CO_ADVISOR_NAME: "Dr. Can" }, sectionContent: { cover: thesisSourceHtml(edited) } };
  const second = compileThesisDocument(template, thesis, "Başlık");
  const html = second.sections[0].editableHtml;
  assert.equal(second.sections[0].seeded, false);
  assert.match(html, /Kendi satırım/);
  assert.match(html, /data-field="STUDENT_NAME"[^>]*>Mehmet Kaya</, "chip text follows the current value");
  assert.match(html, /data-field="CO_ADVISOR_NAME"[^>]*>Dr\. Can</);
  assert.doesNotMatch(html, /data-thesis-optional="CO_ADVISOR_NAME" data-thesis-hidden/, "filled optional block is shown again");
  assert.doesNotMatch(thesis.sectionContent.cover, /data-thesis-hidden/, "hidden flags are presentation, never stored");
  // Refresh is idempotent.
  assert.equal(refreshThesisFieldHtml(html, { definitions: template.placeholders, values: second.values }), html);
});

test("the parsed block model reads sizes, spacing, gaps, rules, hidden blocks and layout rows", () => {
  const html = [
    '<p class="fmt-align-center" data-space-before="6" data-space-after="3"><span class="fmt-pt-14"><strong>T.C.</strong></span> düz</p>',
    '<p class="thesis-gap" data-gap="12.5" contenteditable="false"></p>',
    '<hr class="thesis-rule fmt-align-left" data-length="33" data-thickness="0.5">',
    '<div class="thesis-optional" data-thesis-optional="X" data-thesis-hidden="true"><p>gizli</p></div>',
    '<table class="thesis-layout-row"><tbody><tr><td data-width="50"><p class="fmt-align-center">Sol</p></td><td><p>Sağ</p></td></tr></tbody></table>',
    '<p data-pt="15">On beş</p>',
  ].join("");
  const blocks = parseAcademicHtml(html);
  assert.deepEqual(blocks.map((block) => block.type), ["paragraph", "gap", "rule", "table", "paragraph"]);
  assert.equal(blocks[0].spaceBeforePt, 6);
  assert.equal(blocks[0].spaceAfterPt, 3);
  assert.equal(blocks[0].runs[0].sizePt, 14);
  assert.equal(blocks[0].runs[0].bold, true);
  assert.equal(blocks[0].runs.at(-1).sizePt, undefined, "size applies to its span only");
  assert.deepEqual(blocks[1], { type: "gap", heightMm: 12.5 });
  assert.deepEqual(blocks[2], { type: "rule", lengthPercent: 33, thicknessPt: 0.5, align: "left" });
  assert.match(blocks[3].className, /thesis-layout-row/);
  assert.equal(blocks[3].rows[0][0].widthPercent, 50);
  assert.equal(blocks[3].rows[0][0].blocks[0].align, "center");
  assert.equal(blocks[4].sizePt, 15);
});

test("thesis CSS draws the marks without inline styles", () => {
  const template = editableCoverTemplate();
  const model = compileThesisDocument(template, {}, "Başlık");
  const css = thesisSectionCss(model.sections[0]);
  for (const rule of [".fmt-pt-14{font-size:14pt;}", "[data-pt]{font-size:attr(data-pt pt);}", "p.thesis-gap{height:attr(data-gap mm);", "hr.thesis-rule{", "table.thesis-layout-row td{", '[data-thesis-hidden="true"]{display:none;}', ".fmt-align-justify{text-align:justify;}"]) {
    assert.ok(css.includes(rule), rule);
  }
});

test("resolveSpecialPage keepOptional keeps hidden optional nodes flagged instead of dropping them", () => {
  const blocks = [{ type: "text", value: "A" }, { type: "group", visibleWhen: { anyFilled: ["CITY"] }, blocks: [{ type: "metadata", field: "CITY", prefix: "Yer: ", fallback: "—" }] }];
  const dropped = resolveSpecialPage(blocks, { definitions: generic.placeholders, values: {} });
  assert.equal(dropped.blocks.length, 1);
  const kept = resolveSpecialPage(blocks, { definitions: generic.placeholders, values: {}, keepOptional: true });
  assert.equal(kept.blocks.length, 2);
  assert.deepEqual([kept.blocks[1].hidden, kept.blocks[1].optionalFields], [true, ["CITY"]]);
  assert.deepEqual([kept.blocks[1].blocks[0].prefix, kept.blocks[1].blocks[0].value, kept.blocks[1].blocks[0].fallback], ["Yer: ", "", "—"]);
  const seed = specialPageSeedHtml(kept.blocks);
  assert.match(seed, /data-fallback="—"/);
});
