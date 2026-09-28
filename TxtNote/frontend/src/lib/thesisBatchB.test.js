import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { buildThesisCss, buildThesisPrintHtml, compileThesisDocument } from "../thesis/engine.js";
import { resolveGeneratedIndexes, thesisSourceHtml } from "../thesis/generatedIndex.js";
import { buildThesisDocx } from "../thesis/export.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { parseAcademicHtml } from "./academicDocument.js";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMr8AAAAASUVORK5CYII=";
const figure = (caption, kind = "") => `<figure${kind ? ` data-caption-kind="${kind}"` : ""}><img src="${image}" width="120" height="120"><figcaption>${caption}</figcaption></figure>`;
const table = (caption) => `<table><caption>${caption}</caption><tr><th>A</th></tr><tr><td>1</td></tr></table>`;
const template = () => structuredClone(generic);
const docx = async (model) => { const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer())); return { xml: strFromU8(files["word/document.xml"]), styles: strFromU8(files["word/styles.xml"]), files }; };
const withResim = (t) => {
  t.captionKinds = { photo: { ...structuredClone(t.figures), label: "Resim", position: "below", numbering: { scope: "chapter", format: "{chapter}.{n}", sequence: "arabic" }, labelFormat: "{label} {number}", labelStyle: { fontWeight: 700 }, hangingIndent: 12 } };
  t.sections.push({ id: "index-photos", type: "listOfPhotos", title: "RESİMLER DİZİNİ", status: "optional", group: "front", mode: "generated", generatedIndex: { kind: "photo" } });
  return t;
};
const compile = (t, html, state = {}) => compileThesisDocument(t, { enabledSections: ["index-figures", "index-tables", "index-photos"], ...state }, "Tez", html);

describe("Batch B1 caption kinds", () => {
  const html = `<h1>Bir</h1>${figure("Şema")}${figure("Portre", "photo")}${figure("Manzara", "photo")}<h1>İki</h1>${figure("Grafik")}${figure("Bina", "photo")}${table("Veri")}`;
  it("counts each kind separately per chapter and lists photos in their own index", () => {
    const model = compile(withResim(template()), html);
    const by = (kind) => model.indexSources.filter((s) => s.kind === kind).map((s) => s.label);
    assert.deepEqual(by("figures"), ["Şekil 1.1.", "Şekil 2.1."]);
    assert.deepEqual(by("photo"), ["Resim 1.1", "Resim 1.2", "Resim 2.1"]);
    assert.deepEqual(by("tables"), ["Tablo 2.1."]);
    const list = model.sections.find((s) => s.id === "index-photos");
    assert.deepEqual(list.indexRows.map((r) => r.text), ["Resim 1.1 Portre", "Resim 1.2 Manzara", "Resim 2.1 Bina"]);
    assert.match(list.html, /RESİMLER DİZİNİ/);
    assert.equal(model.sections.find((s) => s.id === "index-figures").indexRows.length, 2);
  });
  it("an unknown kind or a template without kinds treats the figure as a plain figure", () => {
    const plain = compile(template(), html);
    assert.deepEqual(plain.indexSources.filter((s) => s.kind === "figures").map((s) => s.label), ["Şekil 1.1.", "Şekil 1.2.", "Şekil 1.3.", "Şekil 2.1.", "Şekil 2.2."]);
    assert.equal(plain.sections[0].rules.captionKinds, undefined);
  });
  it("validates captionKinds and index kinds", () => {
    assert.deepEqual(validateThesisTemplate(withResim(template())), []);
    const bad = withResim(template()); bad.sections.at(-1).generatedIndex.kind = "unknown";
    assert.match(validateThesisTemplate(bad).join(), /generatedIndex\.kind/);
    const clash = withResim(template()); clash.captionKinds.figures = clash.captionKinds.photo;
    assert.match(validateThesisTemplate(clash).join(), /captionKinds\.figures/);
    const broken = withResim(template()); broken.captionKinds.photo.numbering = {};
    assert.match(validateThesisTemplate(broken).join(), /captionKinds\.photo\.numbering/);
  });
  it("emits kind-scoped caption CSS that keeps figure rules out of the kind and survives as source markup", () => {
    const t = withResim(template()); t.figures.labelStyle = { fontStyle: "x", fontWeight: 400, italic: true };
    const model = compile(t, html);
    const css = buildThesisCss(model);
    assert.match(css, /figure\[data-caption-kind="photo"\] figcaption\{/);
    assert.match(css, /figure\[data-caption-kind="photo"\] figcaption\[data-thesis-caption\]::before\{font-weight:700;\}/);
    assert.match(css, /figure:not\(:is\(\[data-caption-kind="photo"\]\)\) figcaption\[data-thesis-caption\]::before/);
    assert.match(css, /figure\[data-caption-kind="photo"\] figcaption\[data-thesis-caption\]\{padding-left:12mm/);
    assert.match(thesisSourceHtml(html), /data-caption-kind="photo"/);
    assert.match(model.sections.find((s) => s.id === "main").editableHtml, /data-caption-kind="photo"/);
    assert.match(buildThesisPrintHtml(model), /data-thesis-caption="Resim 1.1 "/);
  });
  it("parses the kind and writes DOCX captions with the kind's rule and numbering", async () => {
    assert.equal(parseAcademicHtml(figure("A", "photo"), { lines: true })[0].captionKind, "photo");
    const t = withResim(template()); t.captionKinds.photo.position = "above";
    const model = compile(t, html);
    const { xml } = await docx(resolveGeneratedIndexes(model, Object.fromEntries(model.indexSources.map((s) => [s.anchor, { label: "5" }]))));
    // body order: text runs and drawings as they appear in the document
    const flow = [...xml.matchAll(/<w:drawing>|<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1] === undefined ? "[img]" : m[1]).join("|");
    assert.match(flow, /Resim 1\.1 \|Portre\|\[img\]/);            // photo caption above its image (kind rule)
    assert.match(flow, /\[img\]\|Şekil 1\.1\. Şema|\[img\]\|Şekil 1\.1\. \|Şema/); // plain figure caption below (default rule)
    assert.match(flow, /Resim 2\.1/); assert.match(flow, /RESİMLER DİZİNİ/);
  });
});
