import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { mcbuMaster } from "../thesis/templates/mcbu.js";
import { buildThesisCss, compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { generatedLabelX } from "../thesis/layoutPdf.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { specialPageBoxCss } from "../thesis/specialPages.js";
import generic from "../thesis/templates/generic.js";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMr8AAAAASUVORK5CYII=";
const main = `<h1>Bölüm</h1><p>Metin</p><table data-kind="table"><caption>Bir tablo</caption><tr><td>a</td></tr></table><figure><img src="${image}" width="120" height="80"><figcaption>Bir şekil</figcaption></figure>`;
const values = { YEAR: "2026", STUDENT_NAME: "Ad SOYAD", DEPARTMENT_NAME: "Eğitim Bilimleri", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "Ali VELİ", KEYWORDS: "a, b, c, d, e" };
const compile = (template = mcbuMaster) => compileThesisDocument(template, { values, enabledSections: ["appendices"] }, "Başlık", main, []);
const section = (model, id) => model.sections.find((item) => item.id === id);
const docx = async (model) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);

describe("MCBÜ LEE fix 1: engine", () => {
  it("F1: special-page block rules are scoped to their own section, never to the shared page paper", () => {
    const css = buildThesisCss(compile());
    const blockRules = css.split("\n").filter((line) => line.includes("[data-thesis-block="));
    assert.ok(blockRules.length > 20);
    assert.ok(blockRules.every((line) => !line.includes(".thesis-paper[data-thesis-section=")), "no paper-scoped block rule (it would reach the later static sections of the same page)");
    // abstract-header and abstract-footer share one page; block 1 is a spacer in the first and a text in the second.
    const header = blockRules.find((line) => line.includes('data-thesis-flow-section="abstract-header"') && line.includes('[data-thesis-block="1"]'));
    const footer = blockRules.find((line) => line.includes('data-thesis-flow-section="abstract-footer"') && line.includes('[data-thesis-block="1"]'));
    assert.match(header, /\{height:/);
    assert.doesNotMatch(footer, /(?:^|[;{])height:/, "a wrapped text must keep its natural height");
  });

  it("F13: a generated label of a justified line goes to the line start, not next to the stretched first word", () => {
    const base = { firstTextX: 120, labelWidth: 40, boxLeft: 100, paddingLeft: 0, textIndent: 0 };
    assert.equal(generatedLabelX({ ...base, textAlign: "justify" }), 100, "justified: line start");
    assert.equal(generatedLabelX({ ...base, textAlign: "justify", paddingLeft: 6, textIndent: -6 }), 100, "hanging padding and negative indent cancel");
    assert.equal(generatedLabelX({ ...base, textAlign: "justify", textIndent: 12 }), 112, "first-line indent");
    assert.equal(generatedLabelX({ ...base, textAlign: "center" }), 80, "centred/left lines keep text start minus label");
    assert.equal(generatedLabelX({ ...base, textAlign: "left" }), 80);
    assert.equal(generatedLabelX({ ...base, textAlign: "justify", hang: 25 }), 95, "a measured hang wins");
  });

  it("generatedIndex.hanging accepts a length (mm): CSS hang in the editor/PDF and w:hanging in Word", async () => {
    const model = compile();
    assert.deepEqual(validateThesisTemplate(mcbuMaster), []);
    const withIndex = (hanging) => ({ ...mcbuMaster, sections: mcbuMaster.sections.map((item) => (item.id === "index-tables" ? { ...item, generatedIndex: { ...item.generatedIndex, hanging } } : item)) });
    assert.ok(validateThesisTemplate(withIndex(-3)).some((error) => /hanging/.test(error)));
    assert.ok(validateThesisTemplate(withIndex("mm")).some((error) => /hanging/.test(error)));
    assert.deepEqual(validateThesisTemplate(withIndex("label")), []);
    const tables = section(model, "index-tables");
    assert.equal(tables.generatedIndex.hanging, 20.74);
    const css = buildThesisCss(model).split("\n").find((line) => line.includes('data-thesis-flow-section="index-tables"') && line.includes(".thesis-index-text{padding-left"));
    assert.match(css, /\.thesis-index-text\{padding-left:20\.74mm;text-indent:-20\.74mm\}/);
    assert.doesNotMatch(buildThesisCss(compile(withIndex(undefined))).split("\n").filter((line) => line.includes('data-thesis-flow-section="index-tables"')).join("\n"), /padding-left:20\.74mm/);
    const xml = await docx(model);
    assert.match(xml, /<w:ind [^>]*w:left="1176"[^>]*w:hanging="1176"/, "guide G[247]: left=1176 hanging=1176 twips");
  });

  it("a positioned layout frame paints above in-flow siblings that the Word baseline lift positions", () => {
    const z = (node) => specialPageBoxCss({ type: "text", marginTopMm: 0, marginBottomMm: 0, widthPercent: null, ...node }, null).match(/z-index:(-?\d+)/)?.[1];
    assert.equal(z({ zIndex: 0 }), "0", "in-flow node unchanged");
    assert.equal(z({ zIndex: 0, layoutMode: "absolute" }), "1");
    assert.equal(z({ zIndex: 3, layoutMode: "anchored" }), "4", "order among frames kept");
    assert.equal(z({ zIndex: -2, layoutMode: "absolute" }), "-2", "send-to-back frames stay behind");
    assert.equal(z({ zIndex: 5 }), "5", "an in-flow node with its own z-index is unchanged");
  });

  it("figures.box.align sets the DOCX figure paragraph alignment (default centred as before)", async () => {
    const jc = async (template) => (await docx(compile(template))).match(/<w:p>(?:(?!<\/w:p>).)*?<w:drawing>.*?<\/w:p>/gs).map((p) => p.match(/<w:jc w:val="(\w+)"/)?.[1]).slice(-1);
    assert.deepEqual(await jc(mcbuMaster), ["center"], "template box.align center");
    const noBox = { ...mcbuMaster, figures: { ...mcbuMaster.figures, box: undefined } };
    assert.deepEqual(await jc(noBox), ["center"], "without a box the figure stays centred");
    const left = { ...mcbuMaster, figures: { ...mcbuMaster.figures, box: { align: "left", spaceBeforePt: 15, spaceAfterPt: 15 } } };
    const right = { ...mcbuMaster, figures: { ...mcbuMaster.figures, box: { align: "right", spaceBeforePt: 15, spaceAfterPt: 15 } } };
    assert.deepEqual(await jc(left), ["left"]);
    assert.deepEqual(await jc(right), ["right"]);
    assert.deepEqual(await jc({ ...generic }), ["center"]);
  });
});

describe("MCBÜ LEE fix 1: template values (guide DOCX XML)", () => {
  const model = compile();
  it("F2: İÇİNDEKİLER entries single spaced (G[290]-G[297] line=240), bold", () => {
    const toc = section(model, "toc").generatedIndex;
    assert.equal(toc.style.lineHeight, 1);
    assert.equal(toc.style.fontWeight, 700);
  });
  it("F3: front-matter titles single spaced (style Title line=240), centred; one empty line after (13.8 pt; SİMGELER 1.5-spaced 20.7 pt per G[146])", () => {
    for (const id of ["preface", "index-figures", "index-tables", "toc", "symbols"]) {
      const h1 = section(model, id).rules.headings["1"];
      assert.equal(h1.lineHeight, 1, id);
      assert.equal(h1.align, "center", id);
    }
    assert.equal(section(model, "preface").rules.headings["1"].spaceAfterPt, 13.8);
    assert.equal(section(model, "toc").rules.headings["1"].spaceAfterPt, 13.8);
    assert.equal(section(model, "symbols").rules.headings["1"].spaceAfterPt, 20.7);
    assert.equal(section(model, "appendices").rules.headings["1"].lineHeight, 1, "EKLER: 'bir satır aralığı ile yazılır'");
    assert.equal(section(model, "main").rules.headings["1"].lineHeight, 1.5, "chapter headings stay 1.5 lines");
  });
  it("F4 (evidence): Simgeler entries keep 0 pt after because style ListeParagraf has contextualSpacing", () => {
    assert.equal(section(model, "symbols").rules.body.spaceAfterPt, 0);
  });
  it("F9: list labels are bold; long entries hang 1176 twips", () => {
    for (const id of ["index-figures", "index-tables"]) {
      const index = section(model, id).generatedIndex;
      assert.equal(index.labelStyle.fontWeight, 700);
      assert.equal(index.hanging, 20.74);
    }
  });
  it("F10: İmza centred inside ind left=6372 firstLine=708 (centre ~175 mm), Ad SOYAD bold right", () => {
    const blocks = section(model, "declaration").layout.filter((node) => node.type === "text");
    const sign = blocks.find((node) => node.text === "İmza");
    assert.equal(sign.style.align, "center");
    assert.ok(Math.abs(sign.style.leftIndentMm - 112.39) < 0.01);
    assert.ok(Math.abs(sign.style.firstLineIndentMm - 12.49) < 0.01);
    const name = blocks.find((node) => node.field === "STUDENT_NAME");
    assert.equal(name.style.align, "right");
    assert.equal(name.style.fontWeight, 700);
  });
  it("F5: figures are centred (box.align) with the editor's 15 pt outer margin kept", () => {
    assert.deepEqual(mcbuMaster.figures.box, { align: "center", spaceBeforePt: 15, spaceAfterPt: 15 });
  });
  it("F8: source metadata points at the repository DOCX", () => {
    assert.match(mcbuMaster.source.documentName, /MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025\.docx/);
    assert.equal(mcbuMaster.source.revisionDate, "2025-10-22");
    assert.equal(mcbuMaster.source.verifiedAt, "2026-10-02");
  });
});
