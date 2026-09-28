import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { academicPdfFont, embedAcademicPdfFonts } from "./academicFonts.js";
import { loadSystemTimesNewRoman, TIMES_NEW_ROMAN_FACES } from "./systemPdfFonts.js";
import { assertTimesNewRomanEmbedded } from "../../tests/pdf-font-compliance.mjs";
import { buildThesisPdf } from "../thesis/export.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { mcbuMaster, mcbuPhd } from "../thesis/templates/mcbu.js";

const turkish = "İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç";
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
