import assert from "node:assert/strict";
import { describe, it } from "node:test";
import generic from "../../../../engine/src/templates/generic.js";
import { fixtureB as demoB } from "./thesisFixtures.js";
import { fixtureC as demoC } from "./thesisFixtures.js";
import { akuFbeMaster } from "../../../../engine/src/templates/aku-fbe.js";
import { compileThesisDocument, groupThesisSections } from "../../../../engine/src/engine.js";
import { buildThesisPageModel, pageCountFromFlowHeight, pageMetrics, pageStackHeightPx, PX_PER_MM, THESIS_MAX_PAGES, THESIS_PAGE_GAP_PX, thesisPagedCss, thesisGroupHasPageContent } from "../../../../engine/src/pageLayout.js";

const groupsOf = (template, thesis = {}, content = "<p>Body content</p>") => groupThesisSections(compileThesisDocument(template, thesis, "Tez", content).sections);
const flowHeight = (pages, metrics) => pages * metrics.contentHeightPx + (pages - 1) * metrics.rowGapPx;
const labelsOf = (model) => Object.fromEntries(model.map((entry) => [entry.groupId, entry.pages.map((page) => page.label)]));

describe("thesis pagination page model", () => {
  it("does not allocate sheets or consume numbering for empty scaffolds, but keeps explicit blank pages and media", () => {
    for (const html of ["", "<p><br></p>", "<div><p>&nbsp;\u200b</p></div>", '<span data-pagination-sentinel="true"></span>']) {
      const groups = groupsOf(generic, {}, html);
      const main = groups.find(group => group.id === "main");
      assert.equal(thesisGroupHasPageContent(main), false);
      const pages = labelsOf(buildThesisPageModel(groups, { main: 7 }));
      assert.deepEqual(pages.main, []);
      assert.deepEqual(pages.bibliography, ["1"]);
    }
    for (const html of ['<div class="academic-page-break"></div>', '<div data-academic-page-break="true"></div>', '<img src="x">', '<table><tr><td></td></tr></table>', '<h1>A chapter</h1>']) {
      const groups = groupsOf(generic, {}, html);
      assert.equal(thesisGroupHasPageContent(groups.find(group => group.id === "main")), true);
      assert.deepEqual(labelsOf(buildThesisPageModel(groups)).main, ["1"]);
    }
  });
  it("derives content box, row gap and sheet stride from the template margins", () => {
    const a = pageMetrics(groupsOf(generic)[1].rules.page);
    assert.ok(Math.abs(a.contentHeightPx - 247 * PX_PER_MM) < 1e-9);
    assert.ok(Math.abs(a.rowGapPx - ((25 + 25) * PX_PER_MM + THESIS_PAGE_GAP_PX)) < 1e-9);
    assert.ok(Math.abs(a.stridePx - (297 * PX_PER_MM + THESIS_PAGE_GAP_PX)) < 1e-9);
    const tall = structuredClone(generic);
    tall.page.margins = { topMm: 40, bottomMm: 35, leftMm: 30, rightMm: 20 };
    const b = pageMetrics(groupsOf(tall)[1].rules.page);
    assert.ok(Math.abs(b.contentHeightPx - 222 * PX_PER_MM) < 1e-9);
    assert.ok(Math.abs(b.rowGapPx - (75 * PX_PER_MM + THESIS_PAGE_GAP_PX)) < 1e-9);
    // Content box + row gap is always one sheet stride, so text boxes line up with sheets.
    assert.ok(Math.abs(b.contentHeightPx + b.rowGapPx - b.stridePx) < 1e-9);
  });

  it("maps the fragmented flow height back to an exact, noise-free page count", () => {
    const metrics = pageMetrics(groupsOf(generic)[3].rules.page);
    for (const pages of [1, 2, 3, 10, 50, 150]) {
      const height = flowHeight(pages, metrics);
      for (const noise of [-3, -0.5, 0, 0.5, 3]) assert.equal(pageCountFromFlowHeight(height + noise, metrics), pages);
      assert.ok(Math.abs(pageStackHeightPx(pages, metrics) - (pages * metrics.heightPx + (pages - 1) * THESIS_PAGE_GAP_PX)) < 1e-9);
    }
    // Empty flow still has one page; pathological sizes are clamped instead of looping.
    for (const bad of [0, -100, NaN, undefined, null, Infinity]) assert.ok(pageCountFromFlowHeight(bad, metrics) >= 1);
    assert.equal(pageCountFromFlowHeight(0, metrics), 1);
    assert.equal(pageCountFromFlowHeight(1e12, metrics), THESIS_MAX_PAGES);
    assert.equal(pageCountFromFlowHeight(Infinity, metrics), 1);
  });

  it("numbers pages as none, roman and arabic with template restarts, not by physical index", () => {
    const groups = groupsOf(generic);
    const model = buildThesisPageModel(groups, { abstract: 2, main: 3, bibliography: 2 });
    assert.deepEqual(labelsOf(model), { cover: [""], abstract: ["i", "ii"], toc: ["iii"], main: ["1", "2", "3"], bibliography: ["4", "5"] });
    assert.deepEqual(model.flatMap((entry) => entry.pages.map((page) => page.physicalIndex)), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    // Unmeasured groups count as one page.
    assert.deepEqual(labelsOf(buildThesisPageModel(groups)).main, ["1"]);
    const main = model.find((entry) => entry.groupId === "main").pages[0];
    assert.equal(main.numberPosition, "bottom");
    assert.equal(main.numberAlign, "center");
  });

  it("keeps position, alignment, format and header omission template-driven", () => {
    const c = buildThesisPageModel(groupsOf(demoC), { declaration: 2 });
    const declaration = c.find((entry) => entry.groupId === "declaration");
    assert.deepEqual(declaration.pages.map((page) => page.label), ["I", "II"]);
    assert.equal(declaration.pages[0].numberPosition, "top");
    assert.equal(declaration.pages[0].numberAlign, "right");
    const b = buildThesisPageModel(groupsOf(demoB), { main: 2 });
    assert.equal(b.find((entry) => entry.groupId === "main").pages[0].numberAlign, "right");
    const cover = b.find((entry) => entry.groupId === "cover").pages[0];
    assert.equal(cover.label, "");
    assert.equal(cover.showHeader, false);
    const pages = b.find((entry) => entry.groupId === "main").pages;
    assert.deepEqual(pages.map((page) => page.showHeader), [true, true]);
    const startAt = structuredClone(generic);
    startAt.sections.find((section) => section.id === "main").overrides.page.numbering.startAt = 5;
    assert.deepEqual(labelsOf(buildThesisPageModel(groupsOf(startAt), { main: 2 })).main, ["5", "6"]);
  });

  it("starts template page-break sections on new pages and keeps template order", () => {
    assert.deepEqual(groupsOf(generic).map((group) => group.id), ["cover", "abstract", "toc", "main", "bibliography"]);
    assert.deepEqual(groupsOf(generic, { enabledSections: ["appendices"] }).map((group) => group.id), ["cover", "abstract", "toc", "main", "bibliography", "appendices"]);
    // demo-c: the abstract has pageBreakBefore:false, but the declaration is a special page and never shares its sheet.
    const c = groupsOf(demoC);
    assert.deepEqual(c.map((group) => group.sections.map((section) => section.id)), [["cover"], ["declaration"], ["abstract"], ["toc"], ["main"], ["appendices"], ["bibliography"]]);
  });

  it("starts oddPage sections on the next odd physical sheet and counts the blank before a restart", () => {
    const group = (id, pageBreakBefore) => ({ id, pageBreakBefore, rules: { page: { numbering: { enabled: true, format: "arabic", position: "bottom", align: "center", restart: false }, header: { content: "H", firstContent: "FIRST HEADER" }, footer: { content: "F", firstContent: "FIRST FOOTER" } } }, sections: [{ specialPage: true }] });
    const prior = group("prior", false);
    const odd = group("odd", "oddPage");
    assert.deepEqual(buildThesisPageModel([odd], { odd: 1 })[0].pages.map((page) => page.label), ["1"], "the first physical page is already odd, so it needs no padding");
    let numbers = buildThesisPageModel([prior, odd], { prior: 1, odd: 1 });
    assert.deepEqual(numbers.map((entry) => entry.pages.map((page) => page.label)), [["1"], ["", "3"]]);
    assert.deepEqual(numbers.flatMap((entry) => entry.pages.map((page) => page.physicalIndex)), [0, 1, 2]);
    assert.deepEqual(numbers[1].pages.map((page) => page.blank), [true, false]);
    assert.equal(numbers[1].pages[0].showHeader, false);
    assert.equal(numbers[1].pages[0].showFooter, false);
    assert.equal(numbers[1].pages[1].index, 1, "an unmeasured one-page default still reserves the content page after the blank");
    assert.equal(numbers[1].pages[0].headerContent, undefined);
    assert.equal(numbers[1].pages[1].headerContent, "FIRST HEADER");
    assert.equal(numbers[1].pages[1].footerContent, "FIRST FOOTER");
    const omitFirstContent = { ...odd, rules: { page: { ...odd.rules.page, header: { ...odd.rules.page.header, firstPage: "omit" } } } };
    numbers = buildThesisPageModel([prior, omitFirstContent], { prior: 1, odd: 1 });
    assert.equal(numbers[1].pages[0].showHeader, false, "the parity sheet never receives chrome");
    assert.equal(numbers[1].pages[1].showHeader, false, "first-page omission applies to the first content page after padding");

    numbers = buildThesisPageModel([prior, odd], { prior: 2, odd: 1 });
    assert.deepEqual(numbers.map((entry) => entry.pages.map((page) => page.label)), [["1", "2"], ["3"]], "an even number of preceding sheets needs no padding");

    numbers = buildThesisPageModel([prior, odd], { prior: 3, odd: 2 });
    assert.deepEqual(numbers[1].pages.map((page) => page.label), ["", "5"], "a multi-page predecessor gets one blank after its final odd sheet");

    const restarted = { ...odd, rules: { page: { numbering: { ...odd.rules.page.numbering, restart: true, startAt: 1 }, header: {}, footer: {} } } };
    numbers = buildThesisPageModel([prior, restarted], { prior: 1, [restarted.id]: 2 });
    assert.deepEqual(numbers[1].pages.map((page) => page.label), ["", "1"], "the parity sheet is counted before, not under, the new numbering sequence");
  });

  it("adds odd-page start to the first flow column without changing legacy breaks", () => {
    const template = structuredClone(generic);
    template.sections.find((section) => section.id === "main").pageBreakBefore = "oddPage";
    const groups = groupsOf(template);
    assert.equal(groups.find((group) => group.id === "main").pageBreakBefore, "oddPage");
    assert.match(thesisPagedCss(groups), /\.thesis-page-flow > \[data-thesis-odd-page-spacer\]\{display:block;width:0;height:calc\(247mm \+ 0mm\);margin:0;padding:0;break-after:column/);
  });

  it("never lets another section share the cover's page flow", () => {
    const template = structuredClone(generic);
    template.sections[0].overrides = { body: { align: "center" } };
    template.sections.splice(1, 0, { id: "note", type: "custom", title: "Not", status: "required", group: "front", mode: "static", pageBreakBefore: false, content: "Devam" });
    const groups = groupsOf(template);
    assert.deepEqual(groups[0].sections.map((section) => section.id), ["cover"]);
    assert.equal(groups[1].id, "note");
  });

  it("emits browser fragmentation CSS from template geometry, scoped per page group", () => {
    const tall = structuredClone(generic);
    tall.page.margins = { topMm: 40, bottomMm: 35, leftMm: 30, rightMm: 20 };
    const css = thesisPagedCss(groupsOf(tall));
    assert.match(css, /\[data-thesis-section="main"\] > \.thesis-page-flow\{column-height:222mm;row-gap:calc\(35mm \+ 28px \+ 40mm\)\}/);
    assert.match(css, /column-fill:auto/);
    assert.match(css, /column-wrap:wrap/);
    assert.match(css, /table\{break-inside:avoid\}/);
    assert.match(css, /overflow:visible/);
    assert.doesNotMatch(css, /h\d\{break-before:column\}/);
    const c =thesisPagedCss(groupsOf(demoC));
    assert.match(c, /\[data-thesis-flow-section="main"\] \.thesis-body h1\{break-before:column\}/);
    assert.match(c, /h1\[data-unnumbered\]\{break-before:auto\}/);
    assert.doesNotMatch(c, /h2\{break-before:column\}/);
  });

  it("trims only the opted-in special page's terminal text leading", () => {
    const groups = groupsOf(akuFbeMaster);
    const css = thesisPagedCss(groups);
    const trimRules = css.split("\n").filter((rule) => rule.includes("text-box-trim"));
    assert.equal(trimRules.length, 1);
    assert.match(trimRules[0], /@supports \(text-box-trim:trim-end\)/);
    assert.match(trimRules[0], /data-thesis-flow-section="inner-cover"/);
    assert.match(trimRules[0], /data-thesis-block="\d+"\]\.thesis-layout-text/);
    assert.doesNotMatch(trimRules[0], /outer-cover|approval|ethics/);

    const withoutOptIn = structuredClone(akuFbeMaster);
    delete withoutOptIn.sections.find((section) => section.id === "inner-cover").overrides.page.trimTerminalTextLeading;
    assert.doesNotMatch(thesisPagedCss(groupsOf(withoutOptIn)), /text-box-trim/);
  });

  it("is presentation-only: computing pages never changes the stored thesis document", () => {
    const thesis = Object.freeze({ templateId: generic.id, values: Object.freeze({ YEAR: "2026" }), sectionContent: Object.freeze({ abstract: "<p>Özet</p>" }), enabledSections: Object.freeze([]) });
    const content = "<h1>Giriş</h1>" + "Uzun paragraf. ".repeat(4000) + "<ol><li>bir</li><li>iki</li></ol>";
    const model = compileThesisDocument(generic, thesis, "Tez", content);
    const groups = groupThesisSections(model.sections);
    const before = JSON.stringify({ thesis, content, sections: model.sections.map((section) => section.editableHtml) });
    buildThesisPageModel(groups, { main: 120 });
    thesisPagedCss(groups);
    assert.equal(JSON.stringify({ thesis, content, sections: model.sections.map((section) => section.editableHtml) }), before);
    assert.equal(model.sections.find((section) => section.id === "main").editableHtml, content);
    assert.equal(Object.keys(thesis).some((key) => /page/i.test(key)), false);
  });
});
