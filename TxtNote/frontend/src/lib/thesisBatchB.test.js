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

import { clearTableContinuations, continuationParts, continuationText } from "../thesis/tableContinuation.js";

describe("Batch B2 continuation captions", () => {
  const tableRule = (format) => ({ label: "Çizelge", continuation: { format } });
  const rows = (n) => Array.from({ length: n }, (_, i) => `<tr><td>Madde ${i + 1}</td><td>${i}</td></tr>`).join("");
  const longTable = `<table><caption>Ölçek maddeleri</caption><thead><tr><th>Değişken</th><th>f</th></tr></thead><tbody>${rows(6)}</tbody></table>`;
  it("formats the documented caption variants", () => {
    const entry = { number: "3.1", title: "Ölçek" };
    assert.equal(continuationText(tableRule("{label} {number} (Devam) {title}"), entry), "Çizelge 3.1 (Devam) Ölçek");
    assert.equal(continuationText(tableRule("{label} {number}. (Devam) {title}"), { number: "1", title: "Başlık" }), "Çizelge 1. (Devam) Başlık");
    assert.equal(continuationText(tableRule("{label} {number}. Devam."), { number: "4", title: "x" }), "Çizelge 4. Devam.");
    assert.deepEqual(continuationParts(tableRule("{label} {number} (Devamı) {title}"), entry), [{ text: "Çizelge 3.1 (Devamı) ", title: false }, { text: "Ölçek", title: true }]);
    assert.deepEqual(continuationParts(tableRule("{label} {number}. Devam."), entry).map((p) => p.title), [false]);
  });
  it("validates the rule (tables only, caption above, {number})", () => {
    const t = template(); t.tables.continuation = { format: "{label} {number} (Devam) {title}" }; t.tables.position = "above";
    assert.deepEqual(validateThesisTemplate(t), []);
    t.tables.position = "below"; assert.match(validateThesisTemplate(t).join(), /position above/);
    t.tables.position = "above"; t.tables.continuation = { format: "Devam" }; assert.match(validateThesisTemplate(t).join(), /tables\.continuation/);
    const f = template(); f.figures.continuation = { format: "{number}" }; assert.match(validateThesisTemplate(f).join(), /figures\.continuation/);
    const o = template(); o.tables.position = "above"; o.sections.find((s) => s.id === "main").overrides = { tables: { continuation: { format: "{label} {number} Devam" } } };
    assert.deepEqual(validateThesisTemplate(o), []);
  });
  it("emits continuation row CSS only for templates that opt in, with the caption typography", () => {
    const plain = template(); plain.tables.position = "above";
    assert.doesNotMatch(buildThesisCss(compile(plain, longTable)), /thesis-cont/);
    const t = template(); t.tables.position = "above"; t.tables.continuation = { format: "{label} {number} (Devam) {title}" }; t.tables.labelStyle = { fontWeight: 700 }; t.tables.hangingIndent = "label";
    const css = buildThesisCss(compile(t, longTable));
    assert.match(css, /tr\[data-thesis-cont="caption"\]\{break-before:column\}/);
    assert.match(css, /td\.thesis-cont-caption\{[^}]*font-size:10pt[^}]*border:0 !important;padding:0 0 6pt !important/);
    assert.match(css, /\.thesis-cont-label\{font-weight:700;\}/);
    assert.match(css, /thesis-cont-caption\[data-thesis-caption-hang\]\{padding-left:attr\(data-thesis-caption-hang px, 0px\) !important/);
  });
  it("never stores presentation rows: saved HTML strips them, clearing removes them", () => {
    const injected = longTable.replace("<tr><td>Madde 4", '<tr data-thesis-cont="caption" contenteditable="false" data-thesis-cont-at="4"><td colspan="2" class="thesis-cont-caption"><span class="thesis-cont-label">Çizelge 1.1 (Devam) </span><span>Ölçek maddeleri</span></td></tr><tr data-thesis-cont="head" contenteditable="false"><th>Değişken</th><th>f</th></tr><tr><td>Madde 4');
    assert.equal(thesisSourceHtml(injected), longTable);
    assert.equal(thesisSourceHtml(thesisSourceHtml(injected)), longTable);
    assert.equal(compile(template(), injected).sections.find((s) => s.id === "main").editableHtml, longTable);
    assert.equal(typeof clearTableContinuations, "function");
  });
  it("DOCX splits a table at the measured rows: caption paragraph and header row repeat, first page does not", async () => {
    const t = template(); t.tables.position = "above"; t.tables.continuation = { format: "{label} {number} (Devam) {title}" }; t.tables.labelStyle = { fontWeight: 700 };
    const model = compile(t, `<h1>Bir</h1>${longTable}`);
    const measured = { [model.indexSources.find((s) => s.kind === "tables").anchor]: { rows: [4, 7], hang: 0 } }; // thead row 0, body rows 1..6 => starts at rows 4, (7 = past the end: ignored)
    const resolved = resolveGeneratedIndexes(model, {});
    const xml = (await (async () => { const files = unzipSync(new Uint8Array(await (await buildThesisDocx(resolved, { tableContinuations: measured })).arrayBuffer())); return strFromU8(files["word/document.xml"]); })());
    const flow = [...xml.matchAll(/<w:tbl>|<\/w:tbl>|<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[0] === "<w:tbl>" ? "[T" : m[0] === "</w:tbl>" ? "T]" : m[1]).join("|");
    // fragment 1: caption, header, Madde 1..3; then the continuation caption; fragment 2: header again, Madde 4..6
    assert.match(flow, /Tablo 1\.1\. \|Ölçek maddeleri\|\[T\|Değişken\|f\|Madde 1\|0\|Madde 2\|1\|Madde 3\|2\|T\]\|Tablo 1\.1 \(Devam\) \|Ölçek maddeleri\|\[T\|Değişken\|f\|Madde 4/);
    assert.equal((xml.match(/\(Devam\)/g) || []).length, 1);
    // without measurements the table stays one Word table with no continuation caption
    const plain = unzipSync(new Uint8Array(await (await buildThesisDocx(resolved)).arrayBuffer()));
    assert.equal((strFromU8(plain["word/document.xml"]).match(/<w:tbl>/g) || []).length, 1);
    assert.doesNotMatch(strFromU8(plain["word/document.xml"]), /Devam/);
  });
});

describe("Batch B3 equation numbering", () => {
  const eq = (latex, numbered = true) => `<span class="math-formula math-formula--block" data-display="block" data-latex="${latex}"${numbered ? ' data-eq-numbered="true"' : ""}><div class="math-formula__render"><span class="katex"><span>${latex}</span></span></div></span>`;
  const withEq = (t, rule = { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "right", style: { fontFamily: "Cambria Math", fontSizePt: 12 } }) => { t.equations = rule; return t; };
  const html = `<h1>Bir</h1>${eq("a")}${eq("b", false)}${eq("c")}<h1>İki</h1>${eq("d")}`;
  it("numbers only numbered display equations, per chapter (or document wide), in document order", () => {
    const sources = (t) => compile(t, html).indexSources.filter((s) => s.kind === "equations").map((s) => s.label);
    assert.deepEqual(sources(withEq(template())), ["(1.1)", "(1.2)", "(2.1)"]);
    assert.deepEqual(sources(withEq(template(), { numbering: { scope: "document", format: "({n})" } })), ["(1)", "(2)", "(3)"]);
    assert.deepEqual(sources(template()), []);   // opt-in: no equations key, no counters
    // before the first numbered chapter no made-up "0.1"
    const intro = compile(withEq(template()), `${eq("z")}<h1>Bir</h1>${eq("y")}`).indexSources.filter((s) => s.kind === "equations").map((s) => s.label);
    assert.deepEqual(intro, ["(1)", "(1.1)"]);
  });
  it("equation entries do not disturb caption pairing or the TOC", () => {
    const model = compile(withEq(template()), `<h1>Bir</h1>${eq("a")}${figure("Şema")}${eq("b")}${table("Veri")}`);
    assert.deepEqual(model.indexSources.filter((s) => s.kind !== "equations" && s.label).map((s) => s.label), ["1", "Şekil 1.1.", "Tablo 1.1."]);
    assert.equal(model.sections.find((s) => s.id === "toc").indexRows.length, 1);
  });
  it("validates the equations rule and emits the number CSS only for opting templates", () => {
    assert.deepEqual(validateThesisTemplate(withEq(template())), []);
    assert.match(validateThesisTemplate(withEq(template(), { numbering: { scope: "page", format: "({n})" } })).join(), /equations\.numbering/);
    assert.match(validateThesisTemplate(withEq(template(), { numbering: { scope: "chapter", format: "(x)" } })).join(), /equations\.numbering/);
    assert.match(validateThesisTemplate(withEq(template(), { numbering: { scope: "chapter", format: "{n}" }, numberAlign: "center" })).join(), /numberAlign/);
    const css = buildThesisCss(compile(withEq(template()), html));
    assert.match(css, /math-formula--block\[data-thesis-eq\]::after\{content:attr\(data-thesis-eq\);position:absolute;top:50%;[^}]*font-family:"Cambria Math"/);
    assert.match(css, /\[data-thesis-eq-side="right"\]::after\{right:0\}/);
    assert.match(css, /math-formula__render\{padding:0\}/);
    assert.doesNotMatch(buildThesisCss(compile(template(), html)), /data-thesis-eq/);
  });
  it("print HTML carries the numbers; saved HTML never does", () => {
    const model = compile(withEq(template()), html);
    const print = buildThesisPrintHtml(model);
    assert.deepEqual([...print.matchAll(/data-thesis-eq="([^"]+)"/g)].map((m) => m[1]), ["(1.1)", "(1.2)", "(2.1)"]);
    const stamped = html.replace('data-eq-numbered="true"', 'data-eq-numbered="true" data-thesis-eq="(9)" data-thesis-eq-side="right"');
    assert.equal(thesisSourceHtml(stamped), html);
  });
  it("DOCX: centered formula, number at the right tab stop; left variant puts the number first", async () => {
    const model = resolveGeneratedIndexes(compile(withEq(template()), html), {});
    const { xml } = await docx(model);
    assert.match(xml, /<w:tab w:val="center" w:pos="4394"\/><w:tab w:val="right" w:pos="8787"\/>/);
    const flow = [...xml.matchAll(/<w:tab\/>|<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1] ?? "\\t").join("");
    assert.match(flow, /\\ta\\t\(1\.1\)/); assert.match(flow, /\\tc\\t\(1\.2\)/); assert.match(flow, /\\td\\t\(2\.1\)/);
    assert.match(flow, /\\tb(?!\\t\()/); // the unnumbered one has no number
    const left = resolveGeneratedIndexes(compile(withEq(template(), { numbering: { scope: "chapter", format: "({chapter}.{n})" }, numberAlign: "left" }), html), {});
    const leftXml = (await docx(left)).xml;
    assert.match([...leftXml.matchAll(/<w:tab\/>|<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1] ?? "\\t").join(""), /\(1\.1\)\\ta/);
    const paragraph = leftXml.split("<w:p>").find((p) => p.includes("(1.1)") && p.includes("<w:tabs>"));
    assert.match(paragraph, /<w:tab w:val="center"/); assert.doesNotMatch(paragraph, /w:val="right" w:pos/);
  });
});
