import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { academicPdfFont, academicPdfFontOutcome, embedAcademicPdfFonts } from "./academicFonts.js";
import { loadSystemFontFamily, loadSystemTimesNewRoman, SYSTEM_FONT_FAMILIES, TIMES_NEW_ROMAN_FACES } from "./systemPdfFonts.js";
import { assertTimesNewRomanEmbedded } from "../../tests/pdf-font-compliance.mjs";
import { buildThesisPdf } from "../thesis/export.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { mcbuMaster, mcbuPhd } from "../thesis/templates/mcbu.js";

const turkish = "İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç";
const systemFonts = ["win32", "darwin"].includes(process.platform);
describe("MCBÜ system Times New Roman PDF", { skip: !systemFonts }, () => {
  it("embeds actual regular/bold/italic/bolditalic programs and preserves searchable Turkish in every face", async () => {
    const fonts = await loadSystemTimesNewRoman();
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: mcbuMaster.id });
    for (const [index, style] of Object.keys(TIMES_NEW_ROMAN_FACES).entries()) {
      assert.equal(fonts[style].identity.family, "Times New Roman");
      assert.equal(fonts[style].identity.postscript, TIMES_NEW_ROMAN_FACES[style].postscript);
      assert.match(fonts[style].source, /[\\/]Fonts[\\/](Supplemental[\\/])?times.*\.ttf$/i);
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

describe("generated templates: system font when present, bundled metric twin otherwise", () => {
  it("embeds the machine's Arial for a sans template and reports the source", { skip: !systemFonts }, async () => {
    const fonts = await loadSystemFontFamily("Arial");
    assert.equal(fonts.bold.identity.postscript, SYSTEM_FONT_FAMILIES.Arial.bold.postscript);
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: "x-lee-master-tr-test", families: ["Arial", "Times New Roman"] });
    assert.equal(academicPdfFont(pdf, "normal"), "ArialMT");
    assert.equal(academicPdfFont(pdf, "bold", "Arial, sans-serif"), "Arial-BoldMT");
    assert.equal(academicPdfFont(pdf, "italic", "Times New Roman"), "TimesNewRomanPS-ItalicMT");
    assert.deepEqual(academicPdfFontOutcome(pdf), { sans: { requested: "Arial", family: "Arial", source: "system" }, serif: { requested: "Times New Roman", family: "Times New Roman", source: "system" } });
  });

  it("falls back to Liberation Sans / Tinos for families the system cannot supply", async () => {
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: "x-lee-master-tr-test", families: ["Calibri", "Garamond"] });
    assert.equal(academicPdfFont(pdf, "normal"), "LiberationSans");
    assert.equal(academicPdfFont(pdf, "bold", "Garamond"), "Tinos");
    assert.deepEqual(academicPdfFontOutcome(pdf), { sans: { requested: "Calibri", family: "LiberationSans", source: "bundled" }, serif: { requested: "Garamond", family: "Tinos", source: "bundled" } });
    pdf.setFont("LiberationSans", "bold");
    pdf.text(turkish, 20, 30);
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true });
    const doc = await task.promise;
    try {
      assert.deepEqual((await (await doc.getPage(1)).getTextContent()).items.map((item) => item.str).filter(Boolean), [turkish]);
    } finally { await task.destroy(); }
  });

  it("keeps the real Times New Roman as MCBÜ's default face whatever other families the text uses", { skip: !systemFonts }, async () => {
    const pdf = new jsPDF({ compress: true, putOnlyUsedFonts: true });
    await embedAcademicPdfFonts(pdf, { templateId: mcbuMaster.id, families: ["Arial"] });
    assert.equal(academicPdfFont(pdf, "normal"), "TimesNewRomanPSMT");
    assert.equal(academicPdfFontOutcome(pdf).serif.source, "system");
  });
});
