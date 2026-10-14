import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { academicPdfFont, collectAcademicPdfFontRequests, embedAcademicPdfFonts } from "./academicFonts.js";
import { loadSystemPdfFonts, loadSystemTimesNewRoman, SYSTEM_PDF_FAMILIES, TIMES_NEW_ROMAN_FACES } from "./systemPdfFonts.js";
import { assertTimesNewRomanEmbedded, embeddedPdfFonts } from "../../tests/pdf-font-compliance.mjs";
import { buildThesisDocx, buildThesisPdf } from "../../../../engine/src/export.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { mcbuMaster, mcbuPhd } from "../../../../engine/src/templates/mcbu.js";
import generic from "../../../../engine/src/templates/generic.js";

const turkish = "İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç";
describe("allowlisted installed PDF fonts", () => {
  it("rejects caller-supplied paths and unsupported font families before reading files", async () => {
    await assert.rejects(loadSystemPdfFonts(["../arial.ttf"]), /not allowlisted/i);
    const pdf = new jsPDF();
    await assert.rejects(embedAcademicPdfFonts(pdf, { extraFontFamilies: ["Arial Narrow"] }), /izin verilen|allowlisted/i);
  });

  it("rejects DOCX font sizes that require rounding to an unsupported tenth point", async () => {
    const template = structuredClone(generic);
    template.typography.body.fontSizePt = 12.1;
    const model = compileThesisDocument(template, { values: {} }, "Font size fidelity", "<p>Body text.</p>");
    await assert.rejects(buildThesisDocx(model), /yarım punto/i);
  });
});

describe("Windows system Arial PDF", { skip: process.platform !== "win32" }, () => {
  it("validates all real Arial faces from their SFNT names and embedding flags", async () => {
    const fonts = await loadSystemPdfFonts(["Arial"]);
    for (const [style, expected] of Object.entries(SYSTEM_PDF_FAMILIES.Arial)) {
      assert.equal(fonts.Arial[style].identity.family, "Arial");
      assert.equal(fonts.Arial[style].identity.postscript, expected.postscript);
      assert.equal(fonts.Arial[style].identity.fsType & (0x0002 | 0x0100 | 0x0200), 0, "font permits subsetting and embedding");
      assert.match(fonts.Arial[style].source, /[\\/]Fonts[\\/]arial.*\.ttf$/i);
    }
  });

  it("embeds real Arial and Times New Roman simultaneously and keeps Turkish searchable", async () => {
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { extraFontFamilies: ["Arial", "Times New Roman"] });
    for (const family of ["Arial", "Times New Roman"]) {
      for (const [index, style] of Object.keys(SYSTEM_PDF_FAMILIES[family]).entries()) {
        const name = academicPdfFont(pdf, style, family);
        assert.equal(name, SYSTEM_PDF_FAMILIES[family][style].postscript);
        pdf.setFont(name, style);
        pdf.text(family + " " + style + " " + turkish, 18, 25 + (family === "Arial" ? 0 : 90) + index * 16);
      }
    }
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    const fonts = embeddedPdfFonts(bytes);
    for (const family of ["Arial", "Times New Roman"]) {
      const expected = Object.values(SYSTEM_PDF_FAMILIES[family]).map(face => face.postscript).sort();
      const actual = fonts.filter(font => font.family === family).map(font => font.postscript).sort();
      assert.deepEqual(actual, expected);
      assert.ok(fonts.filter(font => font.family === family).every(font => font.name === font.postscript));
    }
    const doc = await getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true }).promise;
    try {
      const text = (await (await doc.getPage(1)).getTextContent()).items.map(item => item.str).join(" ");
      assert.ok(text.includes("Arial normal " + turkish));
      assert.ok(text.includes("Times New Roman normal " + turkish));
    } finally { await doc.cleanup?.(); }
  });

  it("uses actual Arial for a positioned layout addition on a generic template", async () => {
    const thesis = {
      values: {},
      layout: {
        version: 1,
        elements: {},
        additions: [
          { id: "arial-layout-text", sectionId: "cover", type: "text", layoutMode: "absolute", xMm: 30, yMm: 40, widthMm: 100, heightMm: 12, text: "Positioned Arial text", style: { fontFamily: "Arial", fontSizePt: 12 } },
          { id: "tnr-layout-text", sectionId: "cover", type: "text", layoutMode: "absolute", xMm: 30, yMm: 58, widthMm: 100, heightMm: 12, text: "Positioned Times New Roman text", style: { fontFamily: "Times New Roman", fontSizePt: 12 } },
        ],
      },
    };
    const model = compileThesisDocument(generic, thesis, "Layout fonts", "<p>Legacy body text.</p>");
    assert.deepEqual(collectAcademicPdfFontRequests(model.documentLayout, model.sections).sort(), ["Arial", "Times New Roman"]);
    const bytes = new Uint8Array(await (await buildThesisPdf(model)).arrayBuffer());
    const fonts = embeddedPdfFonts(bytes);
    assert.ok(fonts.some(font => font.family === "Arial" && font.postscript === "ArialMT"));
    assert.ok(fonts.some(font => font.family === "Times New Roman" && font.postscript === "TimesNewRomanPSMT"));
    const doc = await getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true }).promise;
    try {
      const text = (await (await doc.getPage(1)).getTextContent()).items.map(item => item.str).join(" ");
      assert.ok(text.includes("Positioned Arial text"));
      assert.ok(text.includes("Positioned Times New Roman text"));
    } finally { await doc.cleanup?.(); }
  });
});

describe("MCBÜ system Times New Roman PDF", { skip: process.platform !== "win32" }, () => {
  it("embeds actual regular/bold/italic/bolditalic programs and preserves searchable Turkish in every face", async () => {
    const fonts = await loadSystemTimesNewRoman();
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: mcbuMaster.id });
    for (const [index, style] of Object.keys(TIMES_NEW_ROMAN_FACES).entries()) {
      assert.equal(fonts[style].identity.family, "Times New Roman");
      assert.equal(fonts[style].identity.postscript, TIMES_NEW_ROMAN_FACES[style].postscript);
      assert.match(fonts[style].source, /[\\/]Fonts[\\/]times.*\.ttf$/i);
      pdf.setFont(academicPdfFont(pdf, style), style);
      pdf.text(turkish, 20, 30 + index * 20);
    }
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    const embedded = assertTimesNewRomanEmbedded(bytes);
    assert.deepEqual(embedded.map((font) => font.postscript).sort(), Object.values(TIMES_NEW_ROMAN_FACES).map((font) => font.postscript).sort());
    for (const font of embedded) assert.ok(font.bytes < fonts[Object.keys(fonts).find((style) => fonts[style].identity.postscript === font.postscript)].bytes.length, "Actual font subsetting");
    const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
    const doc = await task.promise;
    try {
      const text = (await (await doc.getPage(1)).getTextContent()).items.map((item) => item.str).filter(Boolean);
      assert.deepEqual(text, Array(4).fill(turkish));
    } finally { await task.destroy(); }
  });

  it("uses system fonts in both MCBÜ model-based export variants", async () => {
    for (const template of [mcbuMaster, mcbuPhd]) {
      const model = compileThesisDocument(template, { values: {}, sectionContent: { introduction: `<p>${turkish}</p>` } }, "Font doğrulaması", `<h1>${turkish}</h1><p>${turkish}</p>`);
      const blob = await buildThesisPdf(model);
      assertTimesNewRomanEmbedded(new Uint8Array(await blob.arrayBuffer()));
    }
  });
});
