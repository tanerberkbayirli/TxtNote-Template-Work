import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { finalizeThesisDocx, noteSeparatorXml } from "../../../../engine/src/docx/package.js";

const separator = { enabled: true, widthPercent: 33, thicknessPt: 0.5, spaceBeforePt: 6, spaceAfterPt: 3 };
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const packageWith = (parts) => new Blob([zipSync(Object.fromEntries(Object.entries(parts).map(([name, xml]) => [name, strToU8(xml)])))]);

test("note separator keeps the editor's reserved height: before + rule + after", () => {
  const xml = noteSeparatorXml({ separator, widthPt: 400 });
  assert.match(xml, /w:before="120"/);
  assert.match(xml, /w:line="60" w:lineRule="exact"/);
  assert.match(xml, /<w:top w:val="single" w:sz="4"/);
  assert.match(xml, /w:right="5360"/);
});

test("Word is told to use the package separator, otherwise it draws its taller built-in one", async () => {
  const blob = await finalizeThesisDocx(packageWith({
    "word/document.xml": `<w:document ${W}><w:body/></w:document>`,
    "word/footnotes.xml": `<w:footnotes ${W}><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote><w:footnote w:id="1"><w:p/></w:footnote></w:footnotes>`,
    "word/settings.xml": `<w:settings ${W}><w:updateFields w:val="0"/><w:compat/></w:settings>`,
  }), { noteSeparator: { separator, widthPt: 400 } });
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const settings = strFromU8(files["word/settings.xml"]);
  assert.match(settings, /<w:footnotePr><w:footnote w:id="-1"\/><w:footnote w:id="0"\/><\/w:footnotePr><w:compat/);
  const notes = strFromU8(files["word/footnotes.xml"]);
  assert.equal((notes.match(/w:lineRule="exact"/g) || []).length, 2);
  assert.match(notes, /<w:footnote w:id="1"><w:p\/>/);
});

test("documents without notes or without a separator rule are left untouched", async () => {
  const parts = { "word/document.xml": `<w:document ${W}><w:body/></w:document>`, "word/settings.xml": `<w:settings ${W}><w:compat/></w:settings>` };
  const blob = await finalizeThesisDocx(packageWith(parts), { noteSeparator: { separator, widthPt: 400 } });
  assert.doesNotMatch(strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/settings.xml"]), /footnotePr/);
});
