import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { finalizeThesisDocx } from "../thesis/docx/package.js";
import { complexFieldRuns } from "../thesis/docx/fields.js";
import { Document, Packer, Paragraph } from "docx";

const packageOf = (xml, extra = {}) => new Blob([zipSync({ "word/document.xml": strToU8(xml), ...extra })]);
const unpack = async (blob) => unzipSync(new Uint8Array(await blob.arrayBuffer()));

describe("DOCX package integrity", () => {
  it("assigns unique IDs, pairs nested bookmarks and preserves named field targets", async () => {
    const input = '<w:bookmarkStart w:id="1" w:name="outer"/><w:bookmarkStart w:id="1" w:name="inner"/><w:bookmarkEnd w:id="1"/><w:bookmarkEnd w:id="1"/><w:bookmarkStart w:id="1" w:name="next"/><w:bookmarkEnd w:id="1"/><wp:docPr id="1"/><wp:docPr id="1"/><w:instrText>PAGEREF outer</w:instrText>';
    const files = await unpack(await finalizeThesisDocx(packageOf(input, { "word/header1.xml": strToU8('<wp:docPr id="1"/>'), "word/media/a.png": new Uint8Array([1, 2, 3]) })));
    const xml = strFromU8(files["word/document.xml"]);
    assert.deepEqual([...xml.matchAll(/w:bookmark(?:Start|End) w:id="(\d+)"/g)].map((m) => m[1]), ["1", "2", "2", "1", "3", "3"]);
    const drawings = [xml, strFromU8(files["word/header1.xml"])].flatMap((part) => [...part.matchAll(/wp:docPr id="(\d+)"/g)].map((m) => m[1]));
    assert.equal(new Set(drawings).size, 3);
    assert.match(xml, /PAGEREF outer/);
    assert.deepEqual(files["word/media/a.png"], new Uint8Array([1, 2, 3]));
  });
  it("emits numeric percent widths and on/off values without changing geometry", async () => {
    const xml = strFromU8((await unpack(await finalizeThesisDocx(packageOf('<w:tblW w:type="pct" w:w="100%"/><w:tcW w:w="25.5%" w:type="pct"/><w:qFormat w:val="false"/><w:tblHeader w:val="true"/>'))))["word/document.xml"]);
    assert.match(xml, /w:w="5000"/);
    assert.match(xml, /w:w="1275"/);
    assert.doesNotMatch(xml, /qFormat/);
    assert.match(xml, /tblHeader w:val="1"/);
  });
  it("rejects unmatched bookmark boundaries instead of exporting corrupt references", async () => {
    await assert.rejects(finalizeThesisDocx(packageOf('<w:bookmarkEnd w:id="1"/>')), /Unpaired bookmark/);
    await assert.rejects(finalizeThesisDocx(packageOf('<w:bookmarkStart w:id="1"/>')), /Unclosed bookmark/);
  });
  it("omits disabled OnOffOnly flags while retaining an ordinary explicit off value", async () => {
    const xml = strFromU8((await unpack(await finalizeThesisDocx(packageOf('<w:trPr><w:tblHeader w:val="false"/><w:cantSplit w:val="0"/></w:trPr><w:qFormat w:val="off"/><w:widowControl w:val="false"/>'))))["word/document.xml"]);
    assert.equal(xml, '<w:trPr></w:trPr><w:widowControl w:val="0"/>');
  });
  it("writes field typography in schema order and preserves bold-only marker styles", async () => {
    const doc = new Document({ sections: [{ children: [new Paragraph({ children: complexFieldRuns("PAGE", "1", { font: "Arial", bold: true, italics: true, size: 24 }) }), new Paragraph({ children: complexFieldRuns("NUMPAGES", "2", { bold: true }) })] }] });
    const xml = strFromU8((await unpack(await Packer.toBlob(doc)))["word/document.xml"]);
    assert.match(xml, /<w:rFonts[^>]*\/><w:b\/><w:i\/><w:sz w:val="24"\/><w:szCs w:val="24"\/>/);
    assert.match(xml, /<w:rPr><w:b\/><\/w:rPr><w:fldChar/);
  });
});
