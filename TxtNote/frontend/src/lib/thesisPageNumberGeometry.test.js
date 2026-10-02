import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, groupThesisSections, resolvePageNumberStyle } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { buildThesisPageModel } from "../thesis/pageLayout.js";
import { validateThesisTemplate } from "../thesis/validation.js";

describe("page-number baseline and text-box geometry", () => {
  it("keeps absent header/footer rules optional when section page overrides are validated", () => {
    const t = structuredClone(generic);
    delete t.page.header;
    delete t.page.footer;
    t.sections.find((section) => section.id === "main").overrides.page = { margins: { leftMm: 32 }, numbering: { restart: true, startAt: 1 } };
    assert.deepEqual(validateThesisTemplate(t), []);

    const malformed = structuredClone(t);
    malformed.sections.find((section) => section.id === "main").overrides.page.header = { heightMm: 8, distanceMm: -1 };
    malformed.sections.find((section) => section.id === "abstract").overrides.page.footer = { heightMm: 8, distanceMm: "12" };
    const errors = validateThesisTemplate(malformed).join("\n");
    assert.match(errors, /section main\.page\.header/);
    assert.match(errors, /section abstract\.page\.footer/);
  });

  it("applies the runtime 12.5 mm chrome distance only to omitted values and preserves explicit zero", () => {
    const omitted = structuredClone(generic);
    delete omitted.page.header;
    delete omitted.page.footer;
    const omittedModel = compileThesisDocument(omitted, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>");
    const omittedPage = omittedModel.sections.find((section) => section.id === "main").rules.page;
    assert.equal(omittedPage.header.distanceMm, 12.5);
    assert.equal(omittedPage.footer.distanceMm, 12.5);

    const zero = structuredClone(omitted);
    zero.page.footer = { heightMm: 0, distanceMm: 0 };
    const zeroPage = compileThesisDocument(zero, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>").sections.find((section) => section.id === "main").rules.page;
    assert.equal(zeroPage.footer.distanceMm, 0);
  });

  it("preserves legacy default numbering and resolves distinct front/body baselines and centered boxes", () => {
    assert.deepEqual(
      (({ fontFamily, fontSizePt, fontWeight, italic }) => ({ fontFamily, fontSizePt, fontWeight, italic }))(resolvePageNumberStyle({ fontFamily: "Times New Roman", fontSizePt: 12, fontWeight: 400 }, {})),
      { fontFamily: "Times New Roman", fontSizePt: 12, fontWeight: 400, italic: false },
      "an explicit baseline with no number style inherits body typography",
    );
    assert.deepEqual(
      (({ fontFamily, fontSizePt, fontWeight, italic }) => ({ fontFamily, fontSizePt, fontWeight, italic }))(resolvePageNumberStyle({ fontFamily: "Times New Roman", fontSizePt: 12, fontWeight: 400 }, { style: { fontFamily: "Arial", fontSizePt: 11, italic: true } })),
      { fontFamily: "Arial", fontSizePt: 11, fontWeight: 400, italic: true },
      "an explicit number style is shared by the page chrome renderers",
    );
    const defaults = buildThesisPageModel([{ id: "default", rules: { page: { numbering: { enabled: true, position: "bottom", align: "right", format: "arabic" }, header: {}, footer: {} } }, sections: [{ id: "default", specialPage: true, html: "", rules: { page: { numbering: { enabled: true, position: "bottom", align: "right", format: "arabic" } } } }] }], { default: 1 });
    assert.equal(defaults[0].pages[0].numberBaselineFromTopMm, undefined);
    assert.equal(defaults[0].pages[0].numberXmm, undefined);
    assert.equal(defaults[0].pages[0].numberAlign, "right");

    const t = structuredClone(generic);
    t.page.numbering = { ...t.page.numbering, align: "center", baselineFromTopMm: 281.178, xMm: 175.66, widthMm: 19.84 };
    t.sections.find((section) => section.id === "abstract").overrides.page.numbering = {
      align: "center", format: "roman-lower", restart: true, baselineFromTopMm: 270.52, xMm: 175.66, widthMm: 19.84,
    };
    t.sections.find((section) => section.id === "main").overrides.page.numbering = {
      align: "center", format: "arabic", restart: true, baselineFromTopMm: 282.58, xMm: 174.05, widthMm: 13.03,
    };
    assert.deepEqual(validateThesisTemplate(t), []);
    const model = compileThesisDocument(t, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>");
    const front = model.sections.find((section) => section.id === "abstract").rules.page.numbering;
    const body = model.sections.find((section) => section.id === "main").rules.page.numbering;
    assert.deepEqual([front.baselineFromTopMm, front.xMm, front.widthMm, front.align], [270.52, 175.66, 19.84, "center"]);
    assert.deepEqual([body.baselineFromTopMm, body.xMm, body.widthMm, body.align], [282.58, 174.05, 13.03, "center"]);
    const pageModel = buildThesisPageModel(groupThesisSections(model.sections), { abstract: 1, main: 1 });
    assert.ok(pageModel.some((group) => group.pages.some((page) => page.numberBaselineFromTopMm === 270.52 && page.numberAlign === "center")));
    assert.ok(pageModel.some((group) => group.pages.some((page) => page.numberBaselineFromTopMm === 282.58 && page.numberWidthMm === 13.03)));
  });

  it("writes a live PAGE field inside the page-anchored DOCX text box when configured", async () => {
    const t = structuredClone(generic);
    t.page.numbering = { ...t.page.numbering, align: "center", baselineFromTopMm: 281.178, xMm: 175.66, widthMm: 19.84 };
    const model = compileThesisDocument(t, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>");
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const footers = Object.entries(files).filter(([name]) => /^word\/footer\d+\.xml$/.test(name));
    assert.ok(footers.length > 0);
    const xml = footers.map(([, bytes]) => strFromU8(bytes)).join("\n");
    assert.match(xml, /<w:txbxContent>/);
    assert.match(xml, /PAGE/);
    assert.match(xml, /<wp:positionH relativeFrom="page">/);
    assert.match(xml, /<wp:positionV relativeFrom="page">/);
  });

  it("groups adjacent sections only when their page-number geometry matches", () => {
    const t = structuredClone(generic);
    const model = compileThesisDocument(t, {}, "Test", "<p>Text.</p>");
    const source = model.sections.find((section) => section.id === "main");
    const first = { ...source, id: "first", pageBreakBefore: false, rules: structuredClone(source.rules) };
    const second = { ...source, id: "second", pageBreakBefore: false, rules: structuredClone(source.rules) };
    first.rules.page.numbering.restart = true;
    second.rules.page.numbering.restart = false;
    first.rules.page.numbering.startAt = 1;
    second.rules.page.numbering.startAt = 2;
    assert.equal(groupThesisSections([first, second]).length, 1, "matching or absent geometry retains legacy grouping");

    second.rules.page.numbering.baselineFromTopMm = 281.178;
    assert.equal(groupThesisSections([first, second]).length, 2, "different number placement cannot share page chrome");
    second.rules.page.numbering.baselineFromTopMm = first.rules.page.numbering.baselineFromTopMm;
    second.rules.page.numbering.style = { fontFamily: "Times New Roman", fontSizePt: 10 };
    first.rules.page.numbering.style = { fontFamily: "Times New Roman", fontSizePt: 11 };
    assert.equal(groupThesisSections([first, second]).length, 2, "different number typography cannot share page chrome");
  });

  it("centerOnPage centres the number on the physical page (editor box, DOCX indent) and is opt-in", async () => {
    const t = structuredClone(generic);
    t.page.margins = { ...t.page.margins, leftMm: 40, rightMm: 20 };
    t.page.numbering = { ...t.page.numbering, align: "center", centerOnPage: true };
    assert.deepEqual(validateThesisTemplate(t), []);
    const bad = structuredClone(t);
    bad.page.numbering.centerOnPage = "yes";
    assert.match(validateThesisTemplate(bad).join(" "), /centerOnPage/);
    const docx = async (tpl) => {
      const model = compileThesisDocument(tpl, {}, "Test", "<h1>Giriş</h1><p>Metin.</p>");
      const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
      return Object.entries(files).filter(([name]) => /^word\/footer\d+\.xml$/.test(name)).map(([, b]) => strFromU8(b)).join(" ");
    };
    // left 40 - right 20 = 20 mm = 1134 twips of right indent => centre of text region = 105 mm
    assert.match(await docx(t), /<w:ind w:right="1134"/);
    const off = structuredClone(t);
    delete off.page.numbering.centerOnPage;
    assert.doesNotMatch(await docx(off), /<w:ind /);
    const a = compileThesisDocument(t, {}, "Test", "<p>x</p>").sections.find((s) => s.id === "main");
    const b = compileThesisDocument(off, {}, "Test", "<p>x</p>").sections.find((s) => s.id === "main");
    const c = structuredClone(a); c.rules.page.numbering.centerOnPage = false;
    assert.equal(a.rules.page.numbering.centerOnPage, true);
    assert.equal(groupThesisSections([a, { ...b, id: "o", pageBreakBefore: false }]).length, 2, "different centring cannot share page chrome");
  });
});
