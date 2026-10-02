import assert from "node:assert/strict";
import { describe, it } from "node:test";
import demoA from "../thesis/templates/demo-a.js";
import demoB from "../thesis/templates/demo-b.js";
import demoC from "../thesis/templates/demo-c.js";
import generic from "../thesis/templates/generic.js";
import { buildThesisCss, compileThesisDocument, groupThesisSections } from "../thesis/engine.js";
import { buildThesisPageModel } from "../thesis/pageLayout.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { resolveSpecialPage, specialPageCss, specialPageHtml, specialPageRowWidths, validateSpecialPageBlocks, walkSpecialPage } from "../thesis/specialPages.js";
import { splitLayoutNodes } from "../thesis/layoutDocx.js";

const page = (template, id, values = {}, extra = {}) => compileThesisDocument(template, { values, ...extra }, "Tez Başlığı", "").sections.find((section) => section.id === id);

describe("data-driven special pages", () => {
  it("validates embedded image sources/dimensions and emits scoped CSP-safe geometry", () => {
    const template = structuredClone(generic);
    template.sections[0].blocks = [{ type: "image", source: "data:image/png;base64,aGVsbG8=", widthMm: 30, heightMm: 35, align: "center" }];
    assert.deepEqual(validateThesisTemplate(template), []);
    const cover = page(template, "cover");
    assert.match(cover.html, /class="thesis-layout-image"/);
    assert.doesNotMatch(cover.html, / style=/);
    assert.match(buildThesisCss({ sections: [cover] }), /width:30mm;height:35mm/);
    template.sections[0].blocks[0].source = "javascript:alert(1)";
    template.sections[0].blocks[0].heightMm = -1;
    assert.match(validateThesisTemplate(template).join(" "), /source/);
    assert.match(validateThesisTemplate(template).join(" "), /heightMm/);
  });
  it("preserves page-positioned special-page leaves through HTML and DOCX splits", () => {
    const template = structuredClone(generic);
    template.sections[0].blocks = [
      { type: "metadata", field: "STUDENT_NAME", layoutMode: "absolute", xMm: 12.7, yMm: 61.3, widthMm: 90, heightMm: 7, zIndex: 2, style: { fontFamily: "Times New Roman", fontSizePt: 12 } },
      { type: "image", source: "data:image/png;base64,aGVsbG8=", layoutMode: "anchored", xMm: 2, yMm: 278, widthMm: 206, heightMm: 12 },
    ];
    assert.deepEqual(validateThesisTemplate(template), []);
    const cover = page(template, "cover", { STUDENT_NAME: "Page anchored" });
    const positioned = cover.layout.filter((node) => ["text", "image", "separator"].includes(node.type) && node.layoutMode !== "flow");
    assert.deepEqual(positioned.map(({ layoutMode, xMm, yMm, widthMm, heightMm, zIndex }) => [layoutMode, xMm, yMm, widthMm, heightMm, zIndex]), [
      ["absolute", 12.7, 61.3, 90, 7, 2], ["anchored", 2, 278, 206, 12, 0],
    ]);
    assert.match(buildThesisCss({ sections: [cover] }), /position:absolute;left:12\.7mm;top:61\.3mm/);
    assert.match(cover.html, /data-thesis-field="STUDENT_NAME">Page anchored/);
    const split = splitLayoutNodes(positioned);
    assert.equal(split.flow.length, 0);
    assert.equal(split.positioned.length, 2);
    assert.equal(split.positioned[0].xMm, 12.7);
    assert.equal(split.positioned[1].layoutMode, "anchored");
    template.sections[0].blocks = [{ type: "group", layoutMode: "absolute", xMm: 1, yMm: 1, widthMm: 10, blocks: [] }];
    assert.match(validateThesisTemplate(template).join(" "), /pozisyonlu grup desteklenmiyor/);
    template.sections[0].blocks = [{ type: "text", value: "missing geometry", layoutMode: "absolute", xMm: 1 }];
    assert.match(validateThesisTemplate(template).join(" "), /yMm geçersiz/);
  });
  it("renders the cover from template data and follows metadata changes", () => {
    const before = page(demoA, "cover", { STUDENT_NAME: "Ster" });
    const after = page(demoA, "cover", { STUDENT_NAME: "Ahmet Yılmaz" });
    assert.equal(before.specialPage, true);
    assert.match(before.html, /data-thesis-field="STUDENT_NAME">Ster</);
    assert.match(after.html, /data-thesis-field="STUDENT_NAME">Ahmet Yılmaz</);
    assert.match(after.html, /YÜKSEK LİSANS TEZİ/);
    assert.doesNotMatch(after.html, /\sstyle=|\{\{/);
  });

  it("builds approval and declaration pages with the same renderer and inherited typography", () => {
    const approval = page(demoB, "approval", { JURY_MEMBER_2: "Prof. Dr. Ece Kaya", DEFENSE_DATE: "2026-09-26" });
    assert.match(approval.html, /data-thesis-layout-direction="row"/);
    assert.match(approval.html, /Prof\. Dr\. Ece Kaya/);
    assert.match(approval.html, /26\.09\.2026/);
    assert.match(approval.html, /……………………………/); // empty jury fields use the fallback
    assert.equal(approval.rules.page.margins.topMm, 35);
    const ethics = page(demoB, "ethics", { STUDENT_NAME: "Ster" });
    assert.match(ethics.html, /ETİK BEYAN[\s\S]*beyan ederim[\s\S]*Ster/);
    const css = buildThesisCss({ sections: [approval] });
    // body → overrides.body (left, no indent) → group → block
    assert.match(css, /data-thesis-block="2-0"\]\{font-family:"Arial";font-size:11pt;font-weight:700;[^}]*text-align:left;[^}]*flex:0 1 28%/);
    const declaration = page(demoC, "declaration", { STUDENT_NAME: "Ada" });
    assert.match(declaration.html, /I declare that this work is my own[\s\S]*Name: Ada/);
    const spaced = structuredClone(generic);
    spaced.sections[0].blocks = [{ type: "spacer", heightMm: 5, marginTopMm: 2, marginBottomMm: 3 }];
    assert.match(buildThesisCss({ sections: [page(spaced, "cover")] }), /height:5mm;margin:2mm 0 3mm/);
    delete spaced.sections[0].mode;
    spaced.sections[0].blocks = [];
    assert.equal(page(spaced, "cover").editable, false);
  });

  it("keeps order, optional pages and numbering template-driven", () => {
    const labels = (template, thesis) => Object.fromEntries(buildThesisPageModel(groupThesisSections(compileThesisDocument(template, thesis, "T", "<p>Body content</p>").sections)).map((entry) => [entry.groupId, entry.pages.map((item) => item.label).join(",")]));
    assert.deepEqual(labels(demoB, {}), { cover: "", approval: "", ethics: "ii", abstract: "iii", toc: "iv", main: "1", bibliography: "2" });
    assert.deepEqual(labels(demoA, {}), { cover: "", abstract: "i", toc: "ii", main: "1", bibliography: "2" });
    assert.deepEqual(Object.keys(labels(demoC, { enabledSections: ["approval"] })).slice(0, 4), ["cover", "declaration", "approval", "abstract"]);
    assert.equal(labels(demoC, {}).approval, undefined);
    assert.equal(labels(demoC, { enabledSections: ["approval"] }).approval, "II");
  });

  it("keeps row separators and fixed row shares inside the content width", () => {
    // Demo C approval: [examiner 55%, separator] with an 8 mm gap. The separator's default
    // line length (100%) used to become its row share: flex 0 0 100% ran 64.7 mm off the page.
    const approval = page(demoC, "approval", {}, { enabledSections: ["approval"] });
    const row = approval.layout.find((node) => node.type === "group" && node.direction === "row");
    const separator = row.blocks.find((node) => node.type === "separator");
    assert.equal(separator.widthPercent, null);
    assert.equal(separator.lengthPercent, 100);
    const css = buildThesisCss({ sections: [approval] });
    assert.match(css, new RegExp(`data-thesis-block="${separator.path}"\\]\\{flex:1 1 0;min-width:0;[^}]*width:100%;`));
    assert.doesNotMatch(css, /flex:0 0 /);
    const contentMm = 210 - 28 - 28;
    const widths = specialPageRowWidths(row, contentMm);
    assert.ok(Math.abs(widths[0] - contentMm * 0.55) < 1e-9);
    assert.ok(Math.abs(widths.reduce((sum, value) => sum + value, 0) + row.gapMm - contentMm) < 1e-9);
    // Shares plus gaps that exceed the row shrink in proportion instead of overflowing.
    const crowded = { gapMm: 10, blocks: [{ widthPercent: 60 }, { widthPercent: 60 }, { widthPercent: null }] };
    const squeezed = specialPageRowWidths(crowded, 100);
    assert.deepEqual(squeezed.map((value) => Math.round(value * 1000) / 1000), [40, 40, 0]);
    // A column separator keeps its own line length and alignment.
    const ethics = page(demoB, "ethics");
    const signature = [...walkSpecialPage(ethics.layout)].find((node) => node.type === "separator");
    assert.deepEqual([signature.lengthPercent, signature.align], [40, "right"]);
  });

  it("applies row shares to framed flex children and stretches their borders with the row", () => {
    const template = structuredClone(generic);
    template.sections[0].blocks = [{ type: "group", direction: "row", gapMm: 2, blocks: [
      { type: "group", direction: "column", widthPercent: 30, border: { outerPt: 0.5, paddingMm: 1 }, blocks: [{ type: "text", value: "Chair" }] },
      { type: "group", direction: "column", widthPercent: 70, border: { outerPt: 0.5, paddingMm: 1 }, blocks: [{ type: "text", value: "Members" }] },
    ] }];
    assert.deepEqual(validateThesisTemplate(template), []);
    const cover = page(template, "cover");
    const html = cover.html;
    assert.match(html, /data-thesis-frame="0-0"[^>]*>[^]*data-thesis-block="0-0"/);
    const css = buildThesisCss({ sections: [cover] });
    assert.match(css, /data-thesis-block="0"\]\{[^}]*display:flex;flex-direction:row;column-gap:2mm;align-items:stretch;/);
    assert.match(css, /data-thesis-frame="0-0"\]\{[^}]*flex:0 1 30%;min-width:0;box-sizing:border-box;align-self:stretch;/);
    assert.match(css, /data-thesis-frame="0-1"\]\{[^}]*flex:0 1 70%;min-width:0;box-sizing:border-box;align-self:stretch;/);
  });

  it("rejects invalid layout data instead of rendering it", () => {
    const template = structuredClone(generic);
    template.sections[0].blocks.push({ type: "metadata", field: "UNKNOWN_FIELD" }, { type: "group", direction: "diagonal", blocks: [{ type: "html", value: "<b>x</b>" }] });
    const errors = validateThesisTemplate(template).join(" ");
    assert.match(errors, /UNKNOWN|field/);
    assert.match(errors, /direction geçersiz/);
    assert.match(errors, /type geçersiz/);
    template.sections[0].mode = "editable";
    assert.match(validateThesisTemplate(template).join(" "), /özel sayfa blocks düzenlenemez/);
  });
});

describe("opt-in table rows (border.collapse, minHeightMm, verticalAlign)", () => {
  const cell = (extra = {}) => ({ type: "group", widthPercent: 50, border: { outerPt: 0.5, ...extra }, blocks: [{ type: "text", value: "A" }] });
  const resolve = (blocks) => resolveSpecialPage(blocks, {});
  it("carries the new properties only when declared", () => {
    const plain = resolve([{ type: "group", direction: "row", blocks: [cell()] }]).blocks[0];
    assert.equal("minHeightMm" in plain, false);
    assert.equal(plain.blocks[0].border.collapse, false);
    assert.equal("verticalAlign" in plain.blocks[0], false);
    const table = resolve([{ type: "group", direction: "row", minHeightMm: 10, blocks: [{ ...cell({ collapse: true }), verticalAlign: "center" }] }]).blocks[0];
    assert.equal(table.minHeightMm, 10);
    assert.equal(table.blocks[0].border.collapse, true);
    assert.equal(table.blocks[0].verticalAlign, "center");
  });
  it("emits overlap margins and centring css only for opt-in frames", () => {
    const css = (blocks) => specialPageCss(".s", resolve(blocks).blocks, () => "").join("\n");
    const plain = css([{ type: "group", direction: "row", blocks: [cell()] }]);
    assert.doesNotMatch(plain, /calc\(|justify-content/);
    const table = css([{ type: "group", direction: "row", blocks: [{ ...cell({ collapse: true }), verticalAlign: "center" }] }]);
    assert.match(table, /margin:calc\(0mm - 0\.75pt\) 0 0mm -0\.75pt/);
    assert.match(table, /justify-content:center/);
  });
  it("validates the new properties", () => {
    const errors = (block) => validateSpecialPageBlocks([block], { path: "x", placeholders: {} });
    assert.deepEqual(errors({ type: "group", minHeightMm: 5, verticalAlign: "center", border: { collapse: true }, blocks: [] }), []);
    assert.ok(errors({ type: "group", verticalAlign: "middle", blocks: [] }).length);
    assert.ok(errors({ type: "group", minHeightMm: -1, blocks: [] }).length);
  });
  it("marks collapsed frames with their declared rule width for the PDF only", () => {
    const html = (blocks) => specialPageHtml(resolve(blocks).blocks);
    assert.doesNotMatch(html([{ type: "group", border: { outerPt: 0.5 }, blocks: [] }]), /data-thesis-rule-pt/);
    assert.match(html([{ type: "group", border: { outerPt: 0.5, collapse: true }, blocks: [] }]), /data-thesis-rule-pt="0\.5"/);
  });
});
