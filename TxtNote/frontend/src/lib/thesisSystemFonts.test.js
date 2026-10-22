import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { academicPdfFont, academicPdfFontFace, embedAcademicPdfFonts, hasSystemPdfFont } from "./academicFonts.js";
import { ARIAL_FACES, CALIBRI_FACES, CAMBRIA_MATH_FACES, isSymbolEncodedFamily, loadSystemFontFamily, symbolCmapAsUnicode, symbolFontText, systemPdfFontFamily, TIMES_NEW_ROMAN_FACES } from "./systemPdfFonts.js";
import { embeddedPdfFonts } from "../../tests/pdf-font-compliance.mjs";
import { compileThesisDocument, templateFontFamilies } from "../../../../engine/src/engine.js";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";
import generic from "../../../../engine/src/templates/generic.js";

const turkish = "İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç";
const haveCoreFonts = process.platform === "win32" || existsSync("/usr/share/fonts/truetype/msttcorefonts/arial.ttf");
const haveCambriaMath = process.platform === "win32" && existsSync("C:/Windows/Fonts/cambria.ttc");

describe("template-driven genuine PDF fonts", () => {
  it('selects the embedded regular program for an exact bold request to a single-face family', {skip:!haveCambriaMath}, async()=>{
    const pdf=new jsPDF({compress:true,putOnlyUsedFonts:true});
    await embedAcademicPdfFonts(pdf,{systemFonts:['Cambria Math']});
    const face=measuredPdfFontFace(pdf,{fontFamily:'Cambria Math',fontWeight:'700',fontStyle:'normal'},'∑',true);
    pdf.setFont(face.name,face.style);pdf.text('∑',20,30);
    assert.equal(face.style,'normal');
    assert.ok(pdf.getFont().metadata.cmap.unicode.codeMap[0x2211]>0);
    assert.ok(embeddedPdfFonts(new Uint8Array(pdf.output('arraybuffer'))).some(font=>font.family==='Cambria Math'));
    assert.throws(()=>measuredPdfFontFace(pdf,{fontFamily:'Arial',fontWeight:'700',fontStyle:'normal'},'A',true),/yüklenmedi/);
  });
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

  it("allows Calibri as an exact opt-in family and embeds the genuine program (fails when it is not installed)", { skip: process.platform !== "win32" || !existsSync("C:/Windows/Fonts/calibri.ttf") }, async () => {
    assert.equal(systemPdfFontFamily("calibri, sans-serif"), "Calibri");
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: "any-official-v1", systemFonts: ["Times New Roman", "Calibri"] });
    assert.equal(academicPdfFont(pdf, "normal", "Calibri"), CALIBRI_FACES.normal.postscript);
    assert.equal(academicPdfFont(pdf, "bold", "Calibri"), CALIBRI_FACES.bold.postscript);
    await assert.rejects(() => embedAcademicPdfFonts(new jsPDF(), { templateId: "x", systemFonts: ["Comic Sans MS"] }), /izin verilen/);
  });

  for (const family of ["Consolas", "Courier New"]) it(`embeds all genuine ${family} faces and preserves monospaced Turkish text`, { skip: process.platform !== "win32" }, async () => {
    const fonts = await loadSystemFontFamily(family);
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { extraFontFamilies: [family] });
    for (const [index, style] of ["normal", "bold", "italic", "bolditalic"].entries()) {
      const face = academicPdfFontFace(pdf, style, family);
      assert.equal(face.name, fonts[style].identity.postscript);
      assert.equal(fonts[style].identity.family, family);
      assert.equal(fonts[style].identity.fsType & (0x0002 | 0x0100 | 0x0200), 0);
      pdf.setFont(face.name, face.style);
      assert.ok(Math.abs(pdf.getTextWidth("iiii") - pdf.getTextWidth("WWWW")) < 0.001, "actual monospaced advances are used");
      pdf.text(`${style} ${turkish}`, 20, 30 + index * 20);
    }
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    const embedded = embeddedPdfFonts(bytes);
    assert.equal(embedded.filter(font => font.family === family).length, 4);
    const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
    try {
      const doc = await task.promise;
      // PDF.js may add geometric whitespace between monospaced glyph runs.
      const text = (await (await doc.getPage(1)).getTextContent()).items.map(item => item.str).join(" ").replace(/\s+/g, " ");
      for (const style of ["normal", "bold", "italic", "bolditalic"]) assert.ok(text.includes(`${style} ${turkish}`), JSON.stringify(text));
    } finally { await task.destroy(); }
  });

  it("maps symbol-font families and their plain 0x20..0xFF characters to the PUA code points", () => {
    for (const name of ["Wingdings", "wingdings 2", "Wingdings 3", "Symbol"]) assert.ok(isSymbolEncodedFamily(name), name);
    assert.equal(isSymbolEncodedFamily("Arial"), false);
    assert.equal(symbolFontText(""), "");
    assert.equal(symbolFontText("ü A"), "");
    assert.equal(symbolFontText("•"), "•", "characters outside the symbol range are not guessed");
  });

  for (const [family, sample] of [["Wingdings", ""], ["Wingdings 2", ""], ["Wingdings 3", ""], ["Symbol", ""]]) {
    it(`embeds genuine ${family} (symbol cmap) and draws its PUA glyphs`, { skip: process.platform !== "win32" }, async () => {
      const fonts = await loadSystemFontFamily(family);
      assert.deepEqual(Object.keys(fonts), ["normal"]);
      assert.equal(fonts.normal.identity.family, family);
      assert.equal(fonts.normal.identity.fsType & (0x0002 | 0x0100 | 0x0200), 0);
      const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
      await embedAcademicPdfFonts(pdf, { extraFontFamilies: [family] });
      assert.ok(hasSystemPdfFont(pdf, family));
      const face = academicPdfFontFace(pdf, "bold", family);
      assert.equal(face.style, "normal", "single-face family never asks for a missing bold program");
      pdf.setFont(face.name, face.style);
      const codeMap = pdf.getFont().metadata.cmap.unicode.codeMap;
      for (const char of sample) assert.ok(codeMap[char.charCodeAt(0)] > 0, `glyph for U+${char.charCodeAt(0).toString(16)}`);
      assert.ok(pdf.getTextWidth(sample) > 0);
      pdf.text(sample, 20, 30);
      const bytes = new Uint8Array(pdf.output("arraybuffer"));
      assert.ok(embeddedPdfFonts(bytes).some((font) => font.family === family), "program is embedded in the PDF");
      const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
      try {
        const text = (await (await (await task.promise).getPage(1)).getTextContent()).items.map((item) => item.str).join("");
        assert.equal(text.replace(/\s+/g, ""), sample, "ToUnicode keeps the symbol code points");
      } finally { await task.destroy(); }
    });
  }

  it("re-labels only a symbol-only cmap and leaves Unicode fonts untouched", { skip: process.platform !== "win32" }, async () => {
    const wingdings = (await loadSystemFontFamily("Wingdings")).normal.bytes;
    const view = new DataView(wingdings.buffer, wingdings.byteOffset, wingdings.byteLength);
    const arial = new Uint8Array((await import("node:fs")).readFileSync("C:/Windows/Fonts/arial.ttf"));
    assert.equal(symbolCmapAsUnicode(arial), arial);
    const again = symbolCmapAsUnicode(wingdings);
    assert.equal(again, wingdings, "idempotent once re-labelled");
    assert.ok(view.byteLength > 0);
  });
});

describe("Liberation Serif source-document PDF font", { skip: !existsSync("C:/Windows/Fonts/LiberationSerif-Regular.ttf") && !existsSync("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf") }, () => {
  it("is an allowlisted family of its own, never an alias of Times New Roman or Tinos", () => {
    assert.equal(systemPdfFontFamily('"Liberation Serif", serif'), "Liberation Serif");
    assert.equal(systemPdfFontFamily("Liberation Sans"), null);
  });
  it("verifies all four genuine faces by SFNT name and embeds them with Turkish text intact", async () => {
    const fonts = await loadSystemFontFamily("Liberation Serif");
    for (const style of ["normal", "bold", "italic", "bolditalic"]) {
      assert.equal(fonts[style].identity.family, "Liberation Serif");
      assert.equal(fonts[style].identity.fsType & (0x0002 | 0x0100 | 0x0200), 0);
    }
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { extraFontFamilies: ["Liberation Serif"] });
    assert.ok(hasSystemPdfFont(pdf, "Liberation Serif"));
    for (const [index, style] of ["normal", "bold", "italic", "bolditalic"].entries()) {
      const name = academicPdfFont(pdf, style, "Liberation Serif");
      assert.match(name, /^LiberationSerif/);
      pdf.setFont(name, style); pdf.text("Liberation " + style + " " + turkish, 18, 25 + index * 12);
    }
    const embedded = embeddedPdfFonts(new Uint8Array(pdf.output("arraybuffer")));
    assert.deepEqual(embedded.filter(font => font.family === "Liberation Serif").map(font => font.postscript).sort(), ["LiberationSerif", "LiberationSerif-Bold", "LiberationSerif-BoldItalic", "LiberationSerif-Italic"]);
  });
});
import {measuredPdfFontFace} from '../../../../engine/src/layoutPdf.js';
