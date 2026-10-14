import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { importThesisDocx } from "../thesis/importDocx.js";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const documentXml = async (html) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(compileThesisDocument(structuredClone(generic), {}, "Tez", html))).arrayBuffer()))["word/document.xml"]);
const walk = (nodes, visit) => { for (const n of nodes || []) { visit(n); walk(n.children, visit); } };
const images = (doc) => { const out = []; walk((doc.sections || []).flatMap((x) => x.nodes || []), (n) => { if (n.tag === "img") out.push(n); }); return out; };

describe("DOCX pictures keep size, crop, wrap, position and alt text", () => {
  it("writes an inline picture of an ordinary paragraph with its size, alt text and a:srcRect crop", async () => {
    const xml = await documentXml(`<p>Önce <img src="${PNG}" width="96" height="48" alt="Kırpılmış resim" title="Başlık" data-img-crop="10000,20000,5000,0"> sonra</p>`);
    assert.match(xml, /<wp:inline[\s\S]*?<wp:extent cx="914400" cy="457200"\/>/);
    assert.match(xml, /<wp:docPr [^>]*name="Picture"[^>]*descr="Kırpılmış resim"/);
    assert.match(xml, /<a:srcRect l="10000" t="20000" r="5000"\/>/);
    assert.equal((xml.match(/<a:srcRect[ />]/g) || []).length, 1, "exactly one srcRect per blipFill (Word rejects a second)");
    assert.doesNotMatch(xml, /txnCrop/);
    assert.match(xml, /Önce[\s\S]*<w:drawing>[\s\S]*sonra/);
  });

  it("writes an anchored picture with square wrap, page-relative offset and distances", async () => {
    const xml = await documentXml(`<p>Metin <img src="${PNG}" width="96" height="96" alt="x" data-img-wrap="square" data-img-h="page:offset:72" data-img-v="paragraph:align:center" data-img-distL="9"></p>`);
    assert.match(xml, /<wp:anchor[^>]*distL="114300"/);
    assert.match(xml, /<wp:positionH relativeFrom="page">\s*<wp:posOffset>914400<\/wp:posOffset>/);
    assert.match(xml, /<wp:positionV relativeFrom="paragraph">\s*<wp:align>center<\/wp:align>/);
    assert.match(xml, /<wp:wrapSquare wrapText="bothSides"/);
  });

  it("round-trips crop, wrap, position and alt text through DOCX import", async () => {
    const xml = await documentXml(`<p>Metin <img src="${PNG}" width="96" height="96" alt="Dönüş" data-img-crop="10000,0,0,20000" data-img-wrap="topAndBottom" data-img-h="margin:offset:36" data-img-v="paragraph:offset:12"></p>`);
    assert.match(xml, /<wp:wrapTopAndBottom\b/);
    const bytes = await (await buildThesisDocx(compileThesisDocument(structuredClone(generic), {}, "Tez", `<p>Metin <img src="${PNG}" width="96" height="96" alt="Dönüş" data-img-crop="10000,0,0,20000" data-img-wrap="topAndBottom" data-img-h="margin:offset:36" data-img-v="paragraph:offset:12"></p>`))).arrayBuffer();
    const imported = await importThesisDocx(new Uint8Array(bytes));
    const [img] = images(imported);
    assert.ok(img, "picture imported");
    assert.equal(img.attributes.alt, "Dönüş");
    assert.equal(img.attributes["data-img-crop"], "10000,0,0,20000");
    assert.equal(img.attributes["data-img-wrap"], "topAndBottom");
    assert.equal(img.attributes["data-img-h"], "margin:offset:36");
    assert.equal(img.attributes["data-img-v"], "paragraph:offset:12");
    assert.equal(img.attributes.width, "96");
  });
});
