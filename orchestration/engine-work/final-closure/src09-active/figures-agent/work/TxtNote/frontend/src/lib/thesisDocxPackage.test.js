import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { finalizeThesisDocx } from "../thesis/docx/package.js";

describe("per-section Word note numbering", () => {
  it("allows a later section to return to document numbering", async () => {
    const model = compileThesisDocument(generic, {}, "Tez", "<p>Gövde</p>");
    assert.ok(model.sections.length > 1);
    model.sections = model.sections.map((section, index) => ({ ...section, rules: { ...section.rules, footnotes: { ...section.rules.footnotes, numbering: index === 0 ? "section" : "document" } } }));
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const sections = strFromU8(files["word/document.xml"]).match(/<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g);
    assert.match(sections[0], /<w:footnotePr><w:numRestart w:val="eachSect"\/>/);
    assert.match(sections[0], /<w:endnotePr><w:numRestart w:val="eachSect"\/>/);
    for (const section of sections.slice(1)) {
      assert.doesNotMatch(section, /eachSect/);
      assert.match(section, /<w:footnotePr><w:numRestart w:val="continuous"\/>/);
      assert.match(section, /<w:endnotePr><w:numRestart w:val="continuous"\/>/);
    }
  });

  it("preserves note properties and puts restart after references, before section geometry", async () => {
    const source = '<w:document><w:body><w:sectPr><w:headerReference w:type="default" r:id="rId1"/><w:footnotePr><w:pos w:val="pageBottom"/><w:numStart w:val="3"/><w:numRestart w:val="continuous"/></w:footnotePr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>';
    const blob = await finalizeThesisDocx(new Blob([zipSync({ "word/document.xml": strToU8(source) })]), { noteRestarts: ["section"] });
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    assert.match(xml, /headerReference[^>]*\/><w:footnotePr><w:pos w:val="pageBottom"\/><w:numStart w:val="3"\/><w:numRestart w:val="eachSect"\/><\/w:footnotePr><w:endnotePr><w:numRestart w:val="eachSect"\/><\/w:endnotePr><w:pgSz/);
    assert.doesNotMatch(xml, /continuous/);
  });
});
