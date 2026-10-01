import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { academicPdfFont, academicPdfFontFace, embedAcademicPdfFonts, hasSystemPdfFont } from "./academicFonts.js";
import { ARIAL_FACES, CAMBRIA_MATH_FACES, loadSystemFontFamily, systemPdfFontFamily, TIMES_NEW_ROMAN_FACES } from "./systemPdfFonts.js";
import { embeddedPdfFonts } from "../../tests/pdf-font-compliance.mjs";
import { compileThesisDocument, templateFontFamilies } from "../thesis/engine.js";
import { mcbuMaster } from "../thesis/templates/mcbu.js";
import generic from "../thesis/templates/generic.js";

const turkish = "İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç";
const haveCoreFonts = process.platform === "win32" || existsSync("/usr/share/fonts/truetype/msttcorefonts/arial.ttf");
const haveCambriaMath = process.platform === "win32" && existsSync("C:/Windows/Fonts/cambria.ttc");

describe("template-driven genuine PDF fonts", () => {
  it("maps template family names to known system families", () => {
    assert.equal(systemPdfFontFamily('"Times New Roman", serif'), "Times New Roman");
    assert.equal(systemPdfFontFamily("arial"), "Arial");
    assert.equal(systemPdfFontFamily("Cambria Math"), "Cambria Math");
    assert.equal(systemPdfFontFamily("Tinos"), null);
  });

  it("lists every family an official template names; demo/generic templates request none", () => {
    assert.deepEqual(templateFontFamilies(mcbuMaster), ["Times New Roman"]);
    assert.deepEqual(compileThesisDocument(mcbuMaster, {}, "T", "").systemFonts, ["Times New Roman"]);
    assert.deepEqual(compileThesisDocument(generic, {}, "T", "").systemFonts, []);
    const mixed = { ...mcbuMaster, sections: [...mcbuMaster.sections, { id: "x", type: "custom", title: "X", status: "required", group: "front", mode: "static", blocks: [{ type: "text", value: "a", style: { fontFamily: "Arial", fontSizePt: 12 } }] }] };
    assert.deepEqual(templateFontFamilies(mixed).sort(), ["Arial", "Times New Roman"]);
    assert.deepEqual(templateFontFamilies({ ...generic, equations: { style: { fontFamily: "Cambria Math" } } }).sort(), ["Cambria Math", "Times New Roman"]);
  });

  it("embeds the genuine programs of every requested family and draws each family with its own face", { skip: !haveCoreFonts }, async () => {
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: "any-official-v1", systemFonts: ["Times New Roman", "Arial"] });
    assert.ok(hasSystemPdfFont(pdf, "Arial") && hasSystemPdfFont(pdf, "times new roman"));
    assert.equal(academicPdfFont(pdf, "bold", "Arial"), ARIAL_FACES.bold.postscript);
    assert.equal(academicPdfFont(pdf, "italic", "Times New Roman"), TIMES_NEW_ROMAN_FACES.italic.postscript);
    assert.equal(academicPdfFont(pdf, "normal"), TIMES_NEW_ROMAN_FACES.normal.postscript, "first family is the default");
    for (const [index, family] of ["Times New Roman", "Arial"].entries()) {
      pdf.setFont(academicPdfFont(pdf, "normal", family), "normal");
      pdf.text(turkish, 20, 30 + index * 20);
    }
    const fonts = embeddedPdfFonts(new Uint8Array(pdf.output("arraybuffer")));
    assert.deepEqual(fonts.map((font) => font.family).sort(), ["Arial", "Times New Roman"]);
    assert.ok(fonts.every((font) => font.name === font.postscript));
  });

  it("MCBÜ v1 ids still require Times New Roman without a family list", { skip: !haveCoreFonts }, async () => {
    const pdf = new jsPDF({ compress: true });
    await embedAcademicPdfFonts(pdf, { templateId: mcbuMaster.id });
    assert.equal(academicPdfFont(pdf, "normal"), TIMES_NEW_ROMAN_FACES.normal.postscript);
    assert.equal((await loadSystemFontFamily("Times New Roman")).normal.identity.family, "Times New Roman");
  });

  it("extracts and embeds the installed Cambria Math TTC face for math symbols", { skip: !haveCambriaMath }, async () => {
    const fonts = await loadSystemFontFamily("Cambria Math");
    assert.deepEqual(Object.keys(fonts), ["normal"]);
    assert.equal(fonts.normal.identity.family, "Cambria Math");
    assert.equal(fonts.normal.identity.postscript, CAMBRIA_MATH_FACES.normal.postscript);
    assert.equal(fonts.normal.identity.fsType, 0x0008);
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { systemFonts: ["Cambria Math"] });
    assert.ok(hasSystemPdfFont(pdf, "Cambria Math"));
    assert.equal(academicPdfFont(pdf, "normal", "Cambria Math"), "CambriaMath");
    assert.equal(academicPdfFont(pdf, "bold", "Cambria Math"), "CambriaMath", "one math face covers KaTeX token styles");
    const boldRequest = academicPdfFontFace(pdf, "bold", "Cambria Math");
    assert.deepEqual(boldRequest, { name: "CambriaMath", style: "normal" });
    pdf.setFont(boldRequest.name, boldRequest.style);
    assert.ok(pdf.getFont().metadata?.glyIdsUsed, "single-face math family selects its registered regular program");
    pdf.text("x ∈ ℝ ⇒ ∀", 20, 30);
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    assert.ok(embeddedPdfFonts(bytes).some((font) => font.postscript === "CambriaMath"));
    const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
    const doc = await task.promise;
    try {
      const text = (await (await doc.getPage(1)).getTextContent()).items.map((item) => item.str).join("");
      assert.match(text, /x ∈ ℝ ⇒ ∀/);
    } finally { await task.destroy(); }
  });

  it("templates without system fonts keep Tinos", async () => {
    const pdf = new jsPDF({ compress: true });
    await embedAcademicPdfFonts(pdf, { templateId: generic.id });
    assert.equal(academicPdfFont(pdf, "bold", "Arial"), "Tinos");
  });
});
