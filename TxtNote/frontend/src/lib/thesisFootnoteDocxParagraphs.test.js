import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { strFromU8, unzipSync } from "fflate";
import generic from "../../../../engine/src/templates/generic.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { importThesisDocx } from "../../../../engine/src/importDocx.js";
import { installContentDocument } from "../../../../engine/src/contentModel.js";

const note = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}" data-fn-index="1">1</sup>`;
const notesXml = async (html) => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(compileThesisDocument(structuredClone(generic), {}, "Tez", html))).arrayBuffer()))["word/footnotes.xml"]);
const noteBodies = (xml) => [...xml.matchAll(/<w:footnote (?![^>]*w:type=)[^>]*>([\s\S]*?)<\/w:footnote>/g)].map((m) => m[1]);

describe("DOCX footnotes keep imported note paragraphs", () => {
  it("writes one Word paragraph per newline-separated paragraph, with the reference mark only in the first", async () => {
    const bodies = noteBodies(await notesXml(`<p>A${note("fn-1", "Tek paragraf")} B${note("fn-2", ["Birinci", "İkinci", "Üçüncü"].join("\n"))}</p>`));
    assert.equal(bodies.length, 2);
    assert.equal((bodies[0].match(/<w:p[ >]/g) || []).length, 1);
    assert.equal((bodies[1].match(/<w:p[ >]/g) || []).length, 3);
    assert.match(bodies[1], /Birinci[\s\S]*İkinci[\s\S]*Üçüncü/);
    for (const body of bodies) for (const p of body.match(/<w:p[ >][\s\S]*?<\/w:p>/g)) assert.match(p, /<w:pStyle w:val="ThesisFootnote\d+"\/>/);
    assert.equal((bodies[1].match(/<w:footnoteRef\/>/g) || []).length, (bodies[0].match(/<w:footnoteRef\/>/g) || []).length);
  });

  const input = fileURLToPath(new URL("../../../../orchestration/engine-work/mission01/inputs/edge-long-notes-final.docx", import.meta.url));
  it("round-trips the EDGE_NOTES Word fixture", { skip: !existsSync(input) }, async () => {
    const d = await importThesisDocx(readFileSync(input));
    const multi = Object.values(d.notes || {}).filter((n) => n?.kind === "footnote" && n.type === "normal");
    const n = installContentDocument({ title: "Tez", content: "", researchData: { thesis: { templateId: generic.id } } }, d);
    const model = compileThesisDocument(generic, n.researchData.thesis, n.title, n.content);
    const blob = await buildThesisDocx(model);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (process.env.FN_DOCX_OUT) writeFileSync(process.env.FN_DOCX_OUT, bytes);
    const bodies = noteBodies(strFromU8(unzipSync(bytes)["word/footnotes.xml"]));
    assert.equal(bodies.length, multi.length);
    const expected = multi.map((x) => (x.nodes || []).filter((p) => p.type === "paragraph").length || 1);
    assert.deepEqual(bodies.map((b) => (b.match(/<w:p[ >]/g) || []).length), expected);
  });
});

describe("DOCX endnotes and note numbering", () => {
  const end = (id, text) => `<sup class="academic-endnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}" data-fn-index="1">1</sup>`;
  it("writes endnotes as real Word endnotes in their own stream", async () => {
    const blob = await buildThesisDocx(compileThesisDocument(structuredClone(generic), {}, "Tez", `<p>A${note("f1", "Dip")} B${end("e1", "Son not bir")} C${end("e2", "Son not iki")}</p>`));
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const en = strFromU8(files["word/endnotes.xml"]);
    assert.match(en, /Son not bir/); assert.match(en, /Son not iki/);
    const doc = strFromU8(files["word/document.xml"]);
    assert.equal((doc.match(/<w:endnoteReference /g) || []).length, 2);
    assert.equal((doc.match(/<w:footnoteReference /g) || []).length, 1);
    assert.doesNotMatch(strFromU8(files["word/footnotes.xml"]), /Son not/);
  });
  it("computes document and section offsets from the current HTML", async () => {
    const { noteOffsets, renumberEndnoteRefs } = await import("../../../../engine/src/footnotes.js");
    const a = `<p>${note("a", "x")}${note("b", "y")}</p>`, b = `<p>${note("c", "z")}</p>`;
    assert.deepEqual(noteOffsets([a, b, a]), [0, 2, 3]);
    assert.deepEqual(noteOffsets([a, b, a], "section"), [0, 0, 0]);
    assert.deepEqual(noteOffsets([`<p>${end("e", "q")}</p>`, a, `<p>${end("f", "r")}</p>`], "document", "endnote"), [0, 1, 1]);
    assert.match(renumberEndnoteRefs(`<p>${end("e", "q")}</p>`, 4), /data-fn-index="5">5</);
  });
});

describe("note restart and endnote editing", () => {
  it("writes numRestart eachSect into every section for numbering:section", async () => {
    const t = structuredClone(generic);
    t.typography.footnotes = { ...(t.typography.footnotes || {}), numbering: "section" };
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(compileThesisDocument(t, {}, "Tez", `<p>A${note("f1", "Dip")}</p>`))).arrayBuffer()));
    const doc = strFromU8(files["word/document.xml"]);
    const sects = doc.match(/<w:sectPr\b/g).length;
    assert.equal((doc.match(/<w:footnotePr><w:numRestart w:val="eachSect"\/>/g) || []).length, sects);
  });
  it("numbers endnotes independently of footnotes in editor HTML helpers", async () => {
    const { endnoteHtml, endnotesFromHtml } = await import("./academicDocument.js");
    assert.match(endnoteHtml("x"), /class="academic-endnote"/);
    assert.deepEqual(endnotesFromHtml(`<sup class="academic-endnote" data-fn-index="2" data-fn-text="q">2</sup>`), [{ index: "2", text: "q" }]);
  });
});
