import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAcademicPdf } from "./academicPdf.js";
import { decodeFontAsset } from "./academicFonts.js";
import { academicExportQaDoc } from "./academicQaDocument.js";

describe("decodeFontAsset", () => {
  it("decodes a data URL without fetch", () => {
    const binary = decodeFontAsset("data:font/ttf;base64,QUJD");
    assert.equal(binary, "ABC");
  });
});

describe("buildAcademicPdf", () => {
  it("writes a real-text PDF with an embedded font", async () => {
    const blob = await buildAcademicPdf(academicExportQaDoc());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const head = String.fromCharCode(...bytes.slice(0, 5));
    assert.equal(head, "%PDF-");
    assert.ok(bytes.length > 8000);
    const latin = Buffer.from(bytes).toString("latin1");
    assert.match(latin, /Tinos|Identity-H|ToUnicode/);
    assert.doesNotMatch(latin, /\/Subtype \/Image[\s\S]{0,200}\/Width 794/);
  });
});
