import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { describe, it } from "node:test";
import { academicFileStem, buildAcademicDocx, buildPrintDocument } from "./academicExport.js";
import { academicExportQaDoc } from "./academicQaDocument.js";

function zipText(bytes, fileName) {
  const buf = Buffer.from(bytes);
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const start = offset + 30 + nameLen + extraLen;
    const data = buf.subarray(start, start + compressedSize);
    if (name === fileName) {
      if (method === 0) return data.toString("utf8");
      return inflateRawSync(data).toString("utf8");
    }
    offset = start + compressedSize;
  }
  throw new Error(`zip missing ${fileName}`);
}

describe("academicFileStem", () => {
  it("slugifies a title", () => {
    assert.equal(academicFileStem("Yapay Zeka ve Eğitim"), "Yapay-Zeka-ve-Eğitim");
  });

  it("falls back when the title is empty", () => {
    assert.equal(academicFileStem(""), "akademik-yazi");
    assert.equal(academicFileStem("<p></p>"), "akademik-yazi");
  });
});

describe("buildPrintDocument", () => {
  it("builds an A4 HTML paper without app chrome or auto bibliography", () => {
    const html = buildPrintDocument({
      title: "Tez taslağı",
      html: "<span class=\"fmt-size-heading\">Giriş</span>",
      docAuthors: "Ada Lovelace",
      institution: "Üniversite",
      keywords: "eğitim, yapay zeka",
      docAbstract: "Kısa özet",
      sources: [{ authors: "Ada", year: "1843", title: "Notes" }],
    });
    assert.match(html, /width:\s*210mm/);
    assert.match(html, /Tez taslağı/);
    assert.match(html, /Ada Lovelace/);
    assert.match(html, /Üniversite/);
    assert.match(html, /eğitim, yapay zeka/);
    assert.match(html, /Kısa özet/);
    assert.equal(/Kaynakça/.test(html), false);
  });

  it("includes Kaynakça when bibliography is enabled", () => {
    const html = buildPrintDocument({
      title: "Tez",
      html: "<p>Giriş</p>",
      bibliographyEnabled: true,
      docBibliographyItems: ["Ada, A. (2020). Makale.", "Kaya, B. (2021). Kitap."],
    });
    assert.match(html, /Kaynakça/);
    assert.match(html, /<ul>/);
    assert.match(html, /<li>Ada, A/);
    assert.match(html, /<li>Kaya, B/);
  });
});

describe("buildAcademicDocx", () => {
  it("writes a Word zip with headings, footnotes and images", async () => {
    const blob = await buildAcademicDocx(academicExportQaDoc());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
    assert.ok(bytes.length > 4000);
    const latin = Buffer.from(bytes).toString("latin1");
    assert.match(latin, /word\/document\.xml/);
    const styles = zipText(bytes, "word/styles.xml");
    const documentXml = zipText(bytes, "word/document.xml");
    const footnotes = zipText(bytes, "word/footnotes.xml");
    assert.match(styles, /Heading1|heading1/i);
    assert.match(documentXml, /Heading1|heading1/i);
    assert.match(documentXml, /TOC \\o|w:instrText|fldChar/i);
    assert.match(footnotes, /Dipnot/);
  });
});
