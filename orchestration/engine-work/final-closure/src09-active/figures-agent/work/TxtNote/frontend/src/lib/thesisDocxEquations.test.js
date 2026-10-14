import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { importThesisDocx } from "../thesis/importDocx.js";
import { contentNodesToHtml } from "../thesis/contentModel.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { nativeEquationXml } from "../thesis/docx/equations.js";
import generic from "../thesis/templates/generic.js";
import { docxImportFixture } from "./fixtures/docxImportFixture.js";

const run = (t) => `<m:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t>${t}</m:t></m:r>`;
const matrix = `<m:m><m:mr><m:e>${run("a")}</m:e><m:e>${run("b")}</m:e></m:mr><m:mr><m:e>${run("c")}</m:e><m:e>${run("d")}</m:e></m:mr></m:m>`;
const integral = `<m:nary><m:naryPr><m:chr m:val="∫"/></m:naryPr><m:sub>${run("0")}</m:sub><m:sup>${run("1")}</m:sup><m:e>${run("x")}</m:e></m:nary>`;
const vector = `<m:acc><m:accPr><m:chr m:val="→"/></m:accPr><m:e>${run("v")}</m:e></m:acc>`;
const inline = `<m:oMath><m:f><m:num>${run("x")}</m:num><m:den>${run("y")}</m:den></m:f></m:oMath>`;
const block = `<m:oMathPara><m:oMath>${matrix}${integral}${vector}</m:oMath></m:oMathPara>`;
const walk = (nodes, type) => nodes.flatMap((n) => [...(n.type === type ? [n] : []), ...walk(n.children || [], type)]);

describe("native Word equations preserve editable OMML", () => {
  it("round-trips inline fractions and block matrices, integrals, vectors and math fonts after a text edit", async () => {
    const imported = await importThesisDocx(docxImportFixture({ body: `<w:p><w:r><w:t>Önce </w:t></w:r>${inline}<w:r><w:t> sonra</w:t></w:r></w:p><w:p>${block}</w:p>` }));
    const nodes = imported.sections[0].nodes;
    assert.deepEqual(walk(nodes, "equation").map((n) => n.properties.display), ["inline", "block"]);
    const html = contentNodesToHtml(nodes, { stampIds: false }).replace("Önce", "Düzenlendi");
    assert.match(html, /<mfrac>/); assert.match(html, /<mtable>/); assert.match(html, /<mover accent="true">/);
    const model = compileThesisDocument(generic, {}, "T", html);
    const blob = await buildThesisDocx(model, {});
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    for (const tag of ["f", "m", "nary", "acc"]) assert.match(xml, new RegExp(`<m:${tag}[ >]`));
    assert.match(xml, /w:ascii="Cambria Math"/);
    assert.match(xml, /Düzenlendi/); assert.doesNotMatch(xml, /empty equation/);
    assert.equal((xml.match(/<m:oMath[ >]/g) || []).length, 2);
    // The display equation is alone in its paragraph: Word's m:oMathPara is kept, so it reopens as block math.
    assert.equal((xml.match(/<m:oMathPara[ >]/g) || []).length, 1);
    const reopened = await importThesisDocx(new Uint8Array(await blob.arrayBuffer()));
    assert.deepEqual(walk(reopened.sections.flatMap((s) => s.nodes), "equation").map((n) => n.properties.display), ["inline", "block"]);
  });
  it("keeps significant m:t spaces and writes a numbered equation's oMath inline beside its tab and number", async () => {
    const spaced = `<m:oMath>${run("a")}<m:r><m:t xml:space="preserve"> </m:t></m:r>${run("b")}</m:oMath>`;
    const numbered = `<w:p><w:r><w:tab/></w:r><m:oMathPara><m:oMath>${run("y")}</m:oMath></m:oMathPara><w:r><w:tab/></w:r><w:r><w:t>(2.1)</w:t></w:r></w:p>`;
    const imported = await importThesisDocx(docxImportFixture({ body: `<w:p>${spaced}</w:p>${numbered}` }));
    const html = contentNodesToHtml(imported.sections[0].nodes, { stampIds: false });
    const blob = await buildThesisDocx(compileThesisDocument(generic, {}, "T", html), {});
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))["word/document.xml"]);
    assert.match(xml, /<m:t xml:space="preserve"> <\/m:t>/);
    assert.match(xml, /<m:oMath[ >](?:(?!<\/w:p>).)*<\/m:oMath>(?:(?!<\/w:p>).)*\(2\.1\)/);
    assert.doesNotMatch(xml, /<m:oMathPara|<rootKey/);
  });
  it("rejects malformed and non-math native payloads instead of silently exporting plain text", () => {
    for (const xml of ["<m:oMath>", "<!DOCTYPE x><m:oMath/>", "<m:oMath><w:drawing/></m:oMath>", "<m:oMath/><m:oMath/>"]) assert.throws(() => nativeEquationXml(xml), /Word denklem/);
  });
});
