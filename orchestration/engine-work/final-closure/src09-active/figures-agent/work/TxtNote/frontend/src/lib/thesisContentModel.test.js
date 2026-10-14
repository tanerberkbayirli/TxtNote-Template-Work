import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySourceSectionRules, assertContentDocument, contentNodesFromHtml, contentNodesToHtml, createContentDocument, editContentNode, installContentDocument, prepareThesisNote, resolveContentStyle, setDocumentFormatMode } from "../thesis/contentModel.js";
import { buildNotePayload, noteFromPayload } from "../features/sync/payload.js";
import { compileThesisDocument } from "../thesis/engine.js";
import generic from "../thesis/templates/generic.js";
import { sameThesisEditorProjection, thesisSourceHtml } from "../thesis/sourceHtml.js";

const base = (html = "") => ({ title: "Tez", content: html, researchData: { thesis: { templateId: generic.id, sectionContent: {} } } });
const saveLoad = (note) => noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({ noteId: "n", note, deviceId: "test", updatedAt: 0 }))));
const nodes = (note, id = "main") => note.researchData.thesis.document.sections.find((s) => s.id === id).nodes;
const nativeDocument = () => createContentDocument({ formatMode: "source", sections: [{ id: "main", type: "mainContent", properties: { rules: { body: { fontFamily: "Arial", fontSizePt: 11 }, page: { margins: { leftMm: 37 }, orientation: "landscape" } } }, nodes: [{
  id: "native-matrix", type: "equation", tag: "span", attributes: { class: "math-formula", "data-latex": "\\begin{matrix}1&2\\\\3&4\\end{matrix}" }, children: [],
  properties: { ooxml: '<m:oMath><m:m><m:mr><m:e><m:r><m:t>1</m:t></m:r></m:e></m:mr></m:m></m:oMath>', styleId: "Equation", direct: { italic: false }, relationshipIds: ["rId4"] },
}] }], styles: { default: { properties: { fontSizePt: 11 } }, Normal: { properties: { italic: true, fontFamily: "Arial" } }, Equation: { basedOn: "Normal", properties: { fontSizePt: 14 } } },
numbering: { "7": { abstractId: "2", start: 3 } }, notes: { "footnote:1": { kind: "footnote", nodes: [{ type: "text", text: "Uzun not" }], nativeId: "1" } },
resources: { rId4: { target: "word/media/image1.png", contentType: "image/png", bytesBase64: "AAEC" } }, references: { target: { bookmarkId: "17", nodeId: "native-matrix" } },
source: { format: "docx", sha256: "a".repeat(64), parts: { "word/styles.xml": '<w:styles xmlns:w="word" />' }, unsupported: [{ locator: "word/document.xml:/w:document/w:body/w:altChunk", type: "altChunk" }] } });

describe("persistent thesis content model", () => {
  it("hydrates unchanged native projections without rewriting SVG attributes, empty leaves or IDs", () => {
    const document = nativeDocument();
    document.sections[0].nodes.push({ id: "native-svg", type: "element", tag: "svg",
      attributes: { viewBox: "0 0 411 288.6", "data-img-distL": "9" },
      children: [{ id: "native-svg-text", type: "element", tag: "text", attributes: {}, children: [{ type: "text", text: "" }] }],
      properties: { nativePayload: "keep" } });
    const before = installContentDocument(base(), document);
    const hydrated = JSON.parse(JSON.stringify(before));
    const after = saveLoad(hydrated);
    assert.deepEqual(after.researchData.thesis.document, before.researchData.thesis.document);
    const edited = saveLoad({ ...hydrated, content: hydrated.content + "<p>Actual edit</p>" });
    assert.match(edited.content, /Actual edit/);
    assert.deepEqual(nodes(edited).slice(0, 2).map(n => [n.id, n.properties]), nodes(before).map(n => [n.id, n.properties]));
  });

  it("migrates legacy sections without changing authored HTML or template metadata", () => {
    const before = base('<p>A&nbsp;B\t<strong>kalın</strong></p>');
    before.researchData.thesis.sectionContent.abstract = "<p>Özet</p>";
    const after = prepareThesisNote(before);
    assert.equal(after.content, before.content);
    assert.deepEqual(after.researchData.thesis.sectionContent, before.researchData.thesis.sectionContent);
    assert.equal(before.researchData.thesis.document, undefined);
    assert.equal(after.researchData.thesis.document.sections.length, 2);
    assert.equal(prepareThesisNote(after), after);
  });

  it("keeps nested tables, merges, list restarts, images, note links and bookmarks through sync", () => {
    const html = '<ol start="4"><li value="7">item</li></ol><table><tbody><tr><td rowspan="2" colspan="3"><table><tbody><tr><td>inner</td></tr></tbody></table></td></tr></tbody></table>'
      + '<figure data-academic-id="fig"><img src="data:image/png;base64,AAEC" width="40" height="20" data-crop-left="10"></figure>'
      + '<p id="bookmark"><sup class="academic-footnote" data-fn-id="fn1" data-fn-text="A &amp; B">1</sup><span class="academic-xref" data-ref-id="fig">Şekil</span></p>';
    const note = prepareThesisNote(base(html)), after = saveLoad(note);
    assert.deepEqual(after.researchData.thesis.document, note.researchData.thesis.document);
    assert.equal(after.content, html);
    const projected = contentNodesToHtml(nodes(after));
    assert.match(projected, /rowspan="2" colspan="3"/);
    assert.match(projected, /data-ref-id="fig"/);
    assert.match(projected, /A &amp; B/);
    assert.equal((projected.match(/<table/g) || []).length, 2);
  });

  it("keeps native math, styles, numbering, rich notes, relationship bytes and opaque parts after editing", () => {
    const before = installContentDocument(base(), nativeDocument());
    const typed = prepareThesisNote({ ...before, content: before.content + "<p>Yeni metin</p>" });
    const after = saveLoad(typed);
    assert.deepEqual(nodes(after)[0].properties, nodes(before)[0].properties);
    for (const key of ["styles", "numbering", "notes", "resources", "references", "source"]) assert.deepEqual(after.researchData.thesis.document[key], before.researchData.thesis.document[key]);
    assert.match(after.content, /Yeni metin/);
  });

  it("preserves IDs and native properties when an object moves to another section", () => {
    const note = installContentDocument(base(), nativeDocument());
    const html = note.content;
    const moved = prepareThesisNote({ ...note, content: "", researchData: { ...note.researchData, thesis: { ...note.researchData.thesis, sectionContent: { abstract: html } } } });
    assert.equal(nodes(moved).length, 0);
    assert.equal(nodes(moved, "abstract")[0].id, "native-matrix");
    assert.deepEqual(nodes(moved, "abstract")[0].properties, nodes(note)[0].properties);
  });

  it("retains identity through insertion, text edits, deletion and save/reopen", () => {
    let note = prepareThesisNote(base("<p>Bir</p><p>İki</p>"));
    const [first, second] = nodes(note).map((n) => n.id);
    let html = contentNodesToHtml(nodes(note));
    note = prepareThesisNote({ ...note, content: '<p>Yeni</p>' + html.replace("Bir", "Bir değişti") });
    assert.equal(nodes(note)[1].id, first); assert.equal(nodes(note)[2].id, second);
    html = contentNodesToHtml(nodes(note).slice(1));
    note = saveLoad({ ...note, content: html });
    assert.deepEqual(nodes(note).map((n) => n.id), [first, second]);
  });

  it("assigns new IDs to pasted copies without changing the original object", () => {
    const note = prepareThesisNote(base("<p>A</p>")), html = contentNodesToHtml(nodes(note));
    const after = prepareThesisNote({ ...note, content: html + html });
    assert.equal(nodes(after)[0].id, nodes(note)[0].id);
    assert.notEqual(nodes(after)[1].id, nodes(after)[0].id);
  });

  it("edits native data immutably and restores a model-only saved document", () => {
    const before = installContentDocument(base(), nativeDocument());
    const after = editContentNode(before, "native-matrix", { attributes: { ...nodes(before)[0].attributes, "data-latex": "1 < 2" } });
    assert.equal(nodes(before)[0].children.length, 0);
    assert.match(after.content, /1 &lt; 2/);
    const payload = buildNotePayload({ noteId: "n", note: after }); delete payload.content;
    assert.match(noteFromPayload(payload).content, /1 &lt; 2/);
    assert.deepEqual(nodes(saveLoad(after))[0].properties, nodes(before)[0].properties);
    assert.throws(() => editContentNode(before, "missing", {}), /bulunamadı/);
  });

  it("treats empty HTML as intentional deletion, never resurrecting old content", () => {
    const before = installContentDocument(base(), nativeDocument());
    const after = saveLoad({ ...before, content: "" });
    assert.equal(after.content, ""); assert.deepEqual(nodes(after), []);
  });

  it("restores native payloads on HTML undo without rendering deleted objects", () => {
    const before = installContentDocument(base(), nativeDocument());
    const removed = saveLoad({ ...before, content: "" });
    assert.equal(removed.content, ""); assert.equal(nodes(removed).length, 0);
    const restored = saveLoad({ ...removed, content: before.content });
    assert.deepEqual(nodes(restored)[0].properties, nodes(before)[0].properties);
    assert.deepEqual(restored.researchData.thesis.document.retainedNodes, {});
  });

  it("separates source inheritance and direct changes from template adaptation", () => {
    const doc = nativeDocument(), node = doc.sections[0].nodes[0];
    assert.deepEqual(resolveContentStyle(doc, node, { fontFamily: "Times New Roman" }), { fontFamily: "Arial", fontSizePt: 14, italic: false });
    assert.deepEqual(resolveContentStyle({ ...doc, formatMode: "template" }, node, { fontFamily: "Times New Roman", fontSizePt: 12 }), { fontFamily: "Times New Roman", fontSizePt: 12, italic: false });
    doc.styles.Normal.basedOn = "Equation";
    assert.throws(() => resolveContentStyle(doc, node), /Döngüsel/);
  });

  it("applies recorded source section rules only in source mode and retains them across template changes", () => {
    const note = installContentDocument(base(), nativeDocument());
    const model = compileThesisDocument(generic, note.researchData.thesis, "Tez", note.content);
    const main = model.sections.find((s) => s.id === "main");
    assert.equal(main.rules.body.fontFamily, "Arial"); assert.equal(main.rules.page.margins.leftMm, 37);
    const thesis = setDocumentFormatMode(note.researchData.thesis, "template");
    const next = compileThesisDocument(generic, thesis, "Tez", note.content).sections.find((s) => s.id === "main");
    assert.equal(next.rules.body.fontFamily, generic.typography.body.fontFamily);
    assert.deepEqual(thesis.document.sections, note.researchData.thesis.document.sections);
    assert.equal(saveLoad({ ...note, researchData: { thesis } }).researchData.thesis.document.formatMode, "template");
    assert.throws(() => setDocumentFormatMode(thesis, "guess"), /Geçersiz/);
  });

  it("removes page and line presentation at persistence, preserving authored lookalike attributes", () => {
    const html = '<p data-thesis-number="1" data-thesis-style="quote">A<span data-thesis-tab="tab"><i>dots</i></span>B</p>'
      + '<div data-academic-page-gap="true"></div><table><tbody><tr data-thesis-cont="yes"><td>Repeat</td></tr><tr data-thesis-head-break=""><td>Gap</td></tr><tr data-thesis-frag-first="true" data-thesis-cont-at="3"><td>Original</td></tr></tbody></table>'
      + '<span class="math-formula" data-thesis-eq-numbered="true" data-latex="x" data-thesis-eq="1"></span>';
    const clean = saveLoad(base(html));
    assert.doesNotMatch(clean.content, /Repeat|Gap|data-academic-page-gap|data-thesis-number=|data-thesis-frag-first|data-thesis-cont-at/);
    assert.match(clean.content, /A\tB/); assert.match(clean.content, /data-thesis-eq-numbered="true"/); assert.match(clean.content, /data-thesis-style="quote"/);
    assert.doesNotMatch(JSON.stringify(clean.researchData.thesis.document), /Repeat|data-academic-page-gap/);
    assert.equal(thesisSourceHtml(clean.content), clean.content);
  });

  it("handles quoted delimiters, Unicode, NBSP, literal tabs and numeric entities deterministically", () => {
    const html = '<p title="a > b &quot; c">Türkçe Ελληνικά &#x1F600;&nbsp;\t</p><img alt="style= harmless" src="data:image/png;base64,AA==">';
    const parsed = contentNodesFromHtml(html);
    const again = contentNodesFromHtml(contentNodesToHtml(parsed));
    assert.deepEqual(again, parsed);
  });

  it("does not persist measured equation offsets with or without a template equation rule", () => {
    for (const prefix of ["eq", "ieq"]) {
      const stamps = ["pad-before", "pad-after", "lift", "drop", "base", "fit", "shift"]
        .map((name) => ` data-thesis-${prefix}-${name}="12.5"`).join("");
      const html = `<p><span class="math-formula math-formula--block" data-latex="x^2" data-thesis-eq-numbered="true" data-thesis-${prefix}-fit-custom="authored"${stamps}></span></p>`;
      const expected = html.replace(stamps, "");
      assert.equal(thesisSourceHtml(html), expected);
      const clean = saveLoad(base(html));
      assert.doesNotMatch(clean.content, /data-thesis-(?:i?eq)-(?:pad-before|pad-after|lift|drop|base|fit|shift)="/);
      assert.match(clean.content, /data-latex="x\^2"/);
      assert.match(clean.content, /data-thesis-eq-numbered="true"/);
      assert.match(clean.content, new RegExp(`data-thesis-${prefix}-fit-custom="authored"`));
      assert.equal(thesisSourceHtml(clean.content), clean.content);
    }
  });

  it("preserves imported section order and uncommon named attribute entities", () => {
    const document = nativeDocument();
    document.sections.unshift({ id: "front", type: "custom", nodes: [{ type: "text", text: "Ön" }] });
    document.sections.push({ id: "back", type: "custom", nodes: [{ type: "text", text: "Son" }] });
    const note = saveLoad(installContentDocument(base(), document));
    assert.deepEqual(note.researchData.thesis.document.sections.map(s => s.id), ["front", "main", "back"]);
    const nodes = contentNodesFromHtml('<p title="&copy; &alpha; &amp;">A</p>');
    assert.match(contentNodesToHtml(nodes), /title="&copy; &alpha; &amp;"/);
    assert.deepEqual(contentNodesFromHtml(contentNodesToHtml(nodes)), nodes);
  });

  it("binds mainContent by meaning when its template ID differs, preserving shadow section HTML", () => {
    const template = structuredClone(generic);
    template.sections.find(s => s.type === "mainContent").id = "introduction";
    const note = base("<h1>Actual body</h1>");
    note.researchData.thesis.sectionContent = { introduction: "<h1>Shadow text</h1>", main: "<p>Independent main key</p>" };
    const loaded = saveLoad(note);
    const model = compileThesisDocument(template, loaded.researchData.thesis, "Tez", loaded.content);
    const main = model.sections.find(s => s.id === "introduction");
    assert.match(main.editorHtml, /Actual body/); assert.doesNotMatch(main.editorHtml, /Shadow text/);
    assert.equal(loaded.researchData.thesis.sectionContent.main, "<p>Independent main key</p>");
    assert.equal(loaded.researchData.thesis.document.sectionKeys.main, "section:main");
    template.sections.push({ id: "main", type: "custom", title: "Independent", status: "required", group: "body", mode: "editable" });
    const custom = compileThesisDocument(template, loaded.researchData.thesis, "Tez", loaded.content).sections.find(s => s.id === "main");
    assert.match(custom.editorHtml, /Independent main key/); assert.doesNotMatch(custom.editorHtml, /Actual body/);
  });

  it("acknowledges model annotations without masking authored text or format edits", () => {
    assert.equal(sameThesisEditorProjection('<p data-txt-node-id="tn-1">A</p>', '<p>A</p>'), true);
    assert.equal(sameThesisEditorProjection('<p data-txt-node-id="tn-1">B</p>', '<p>A</p>'), false);
    assert.equal(sameThesisEditorProjection('<p class="fmt-bold">A</p>', '<p>A</p>'), false);
  });

  it("persists equation source without reparsing generated block children into the paragraph", () => {
    const authored = '<p>A<span class="math-formula" data-latex="x^2" data-display="inline"><div class="math-formula__toolbar"><span>menu</span></div><div class="math-formula__render"><span class="katex">x²</span></div></span>B</p>';
    const clean = thesisSourceHtml(authored);
    assert.equal(clean, '<p>A<span class="math-formula" data-latex="x^2" data-display="inline"></span>B</p>');
    assert.equal(thesisSourceHtml('<span class="math-formula" data-latex="x">unfinished'), '<span class="math-formula" data-latex="x">unfinished');
  });

  it("rejects unknown versions, duplicate IDs, cycles and non-JSON native data", () => {
    assert.throws(() => assertContentDocument({ ...nativeDocument(), version: 9 }), /sürümü/);
    const duplicate = nativeDocument(); duplicate.sections[0].nodes.push(structuredClone(duplicate.sections[0].nodes[0]));
    assert.throws(() => assertContentDocument(duplicate), /yinelenen/);
    const cycle = nativeDocument(); cycle.source.self = cycle.source;
    assert.throws(() => assertContentDocument(cycle), /döngüsüz/);
    const nan = nativeDocument(); nan.source.width = NaN;
    assert.throws(() => assertContentDocument(nan), /JSON/);
  });

  it("leaves ordinary notes untouched and source rule resolution does not mutate the template", () => {
    const note = { title: "Not", content: "Text" }; assert.equal(prepareThesisNote(note), note);
    const rules = { body: { fontSizePt: 12 }, page: { margins: { leftMm: 30, rightMm: 25 } } }, before = structuredClone(rules);
    applySourceSectionRules(rules, { document: nativeDocument() }, "main");
    assert.deepEqual(rules, before);
  });
});
