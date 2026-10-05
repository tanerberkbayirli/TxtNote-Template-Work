import assert from "node:assert/strict";
import { describe, it } from "node:test";
import generic from "../thesis/templates/generic.js";
import { fixtureC as demoC } from "./thesisFixtures.js";
import { fixtureA as demoA } from "./thesisFixtures.js";
import { createThesisDocument, isThesisSectionEditable, orderedThesisSections, THESIS_METADATA_FIELDS, setThesisTextOverride, thesisSectionMode, thesisTextOverride, updateThesisMetadata, updateThesisNoteSection } from "../thesis/document.js";
import { fixtureB as demoB } from "./thesisFixtures.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { validateThesisTemplate } from "../thesis/validation.js";
import { migrateAcademicNote } from "./researchMigrate.js";
import { buildNotePayload, noteFromPayload } from "../features/sync/payload.js";
import { footnotesFromHtml } from "./academicDocument.js";

const section = (template, id) => template.sections.find((item) => item.id === id);

function freezeDeep(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

describe("thesis document state", () => {
  it("creates an empty document referencing a template without copying its content", () => {
    const selection = { universityId: "fixture-university-c", language: "en" };
    const thesis = createThesisDocument(demoC, selection, 2026);
    selection.language = "tr";
    assert.equal(thesis.templateId, demoC.id);
    assert.equal(thesis.templateVersion, demoC.templateVersion);
    assert.equal(thesis.selection.language, "en");
    assert.deepEqual(thesis.values, { YEAR: "2026" });
    assert.deepEqual(thesis.sectionContent, {});
    assert.doesNotMatch(JSON.stringify(thesis), /I declare that this work is my own|Yazmaya başla|Yeni başlık/);
  });

  it("updates editable rich-text sections and the ordinary note body without mutating the template", () => {
    const template = freezeDeep(structuredClone(generic));
    const original = { title: "", content: "", researchData: { thesis: createThesisDocument(template, {}, 2026) } };
    const withAbstract = updateThesisNoteSection(original, section(template, "abstract"), "<p><strong>ABC123</strong></p>");
    const withMain = updateThesisNoteSection(withAbstract, section(template, "main"), "<h1>Giriş</h1><p>XYZ789</p>");
    assert.deepEqual(original.researchData.thesis.sectionContent, {});
    assert.equal(original.content, "");
    assert.equal(withMain.researchData.thesis.sectionContent.abstract, "<p><strong>ABC123</strong></p>");
    assert.equal(withMain.content, "<h1>Giriş</h1><p>XYZ789</p>");
    assert.equal(section(template, "abstract").content, undefined);
    assert.equal(section(template, "main").content, undefined);
    const compiled = compileThesisDocument(template, withMain.researchData.thesis, "Tez", withMain.content);
    assert.match(compiled.sections.find((item) => item.id === "abstract").html, /ABC123/);
    assert.match(compiled.sections.find((item) => item.id === "main").html, /XYZ789/);
  });

  it("replaces a section title and fixed text per document without touching the template", () => {
    const base = createThesisDocument(demoC, {});
    const abstract = compileThesisDocument(demoC, base, "Tez", "").sections.find((item) => item.id === "abstract");
    const edited = setThesisTextOverride(setThesisTextOverride(base, "abstract", "title", "ÖZ"), "abstract", "fixed", "Not satırı");
    const after = compileThesisDocument(demoC, edited, "Tez", "").sections.find((item) => item.id === "abstract");
    assert.match(after.prefixHtml, /<h1[^>]*>ÖZ<\/h1>/);
    assert.match(after.prefixHtml, /<p class="thesis-fixed">Not satırı<\/p>/);
    assert.notEqual(after.prefixHtml, abstract.prefixHtml);
    assert.equal(thesisTextOverride(base, "abstract", "title"), undefined);
    const reset = setThesisTextOverride(setThesisTextOverride(edited, "abstract", "title", undefined), "abstract", "fixed", undefined);
    assert.equal(compileThesisDocument(demoC, reset, "Tez", "").sections.find((item) => item.id === "abstract").prefixHtml, abstract.prefixHtml);
    assert.deepEqual(reset.textOverrides, {});
  });

  it("keeps static template text read-only even if an old note contains user HTML for it", () => {
    const note = { content: "", researchData: { thesis: { ...createThesisDocument(demoC, {}), sectionContent: { declaration: "<p>HACK</p>" } } } };
    const declaration = section(demoC, "declaration");
    assert.equal(isThesisSectionEditable(declaration), false);
    assert.equal(updateThesisNoteSection(note, declaration, "<p>Changed</p>"), note);
    const compiled = compileThesisDocument(demoC, note.researchData.thesis, "Title", note.content);
    const rendered = compiled.sections.find((item) => item.id === "declaration");
    assert.equal(rendered.editable, false);
    assert.equal(rendered.editableHtml, "");
    assert.match(rendered.html, /I declare that this work is my own/);
    assert.doesNotMatch(rendered.html, /HACK|Changed/);
  });

  it("uses the section flag rather than its type to combine static and editable content", () => {
    const template = structuredClone(demoC);
    // Legacy templates without `mode` still decide by the editable flag.
    // Ordinary fixed introductions may accompany editable text; special-page blocks cannot.
    section(template, "declaration").content = section(template, "declaration").blocks[1].value;
    delete section(template, "declaration").blocks;
    delete section(template, "declaration").mode;
    section(template, "declaration").editable = true;
    const thesis = { ...createThesisDocument(template, {}), sectionContent: { declaration: "<p>Student note</p>" } };
    const rendered = compileThesisDocument(template, thesis, "Title", "").sections.find((item) => item.id === "declaration");
    assert.equal(rendered.editable, true);
    assert.match(rendered.prefixHtml, /I declare that this work is my own/);
    assert.equal(rendered.editableHtml, "<p>Student note</p>");
    assert.match(rendered.html, /Student note/);
    section(template, "declaration").editable = "yes";
    assert.match(validateThesisTemplate(template).join(" "), /declaration\.editable/);
  });

  it("survives a note switch and rehydration through the existing note payload", () => {
    const thesis = createThesisDocument(generic, {}, 2026);
    const note = { title: "Tez", content: "", researchData: { thesis } };
    const edited = updateThesisNoteSection(
      updateThesisNoteSection(note, section(generic, "abstract"), "<p>ABC123</p>"),
      section(generic, "main"), "<p>XYZ789</p>",
    );
    const notes = { thesis: edited, other: { title: "Başka not", content: "" } };
    assert.equal(notes.other.title, "Başka not");
    assert.equal(notes.thesis.researchData.thesis.sectionContent.abstract, "<p>ABC123</p>");
    const saved = buildNotePayload({ noteId: "thesis", workspaceId: "ws", note: notes.thesis, deviceId: "test" });
    const rehydrated = migrateAcademicNote(noteFromPayload(JSON.parse(JSON.stringify(saved))));
    const compiled = compileThesisDocument(generic, rehydrated.researchData.thesis, rehydrated.title, rehydrated.content);
    assert.match(compiled.sections.find((item) => item.id === "abstract").html, /ABC123/);
    assert.match(compiled.sections.find((item) => item.id === "main").html, /XYZ789/);
  });

  it("binds thesis metadata to template placeholders and keeps it through save/load", () => {
    const template = freezeDeep(structuredClone(demoA));
    let thesis = createThesisDocument(template, {}, 2026);
    const cover = (state, title) => compileThesisDocument(template, state, title, "").sections.find((item) => item.id === "cover").html;
    assert.doesNotMatch(cover(thesis, ""), /\{\{[A-Z_]+\}\}/);
    for (const [key, value] of [["STUDENT_NAME", "TEST STUDENT"], ["ADVISOR_NAME", "TEST ADVISOR"], ["CITY", "MANISA"], ["YEAR", "2026"]]) thesis = updateThesisMetadata(thesis, key, value);
    const html = cover(thesis, "TEST TITLE");
    for (const value of ["TEST TITLE", "TEST STUDENT", "TEST ADVISOR", "MANISA", "2026", "YÜKSEK LİSANS TEZİ"]) assert.match(html, new RegExp(value));
    const note = { title: "TEST TITLE", content: "", researchData: { thesis } };
    const loaded = noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({ noteId: "n1", workspaceId: "w1", note, deviceId: "d1" }))));
    assert.equal(cover(loaded.researchData.thesis, loaded.title), html);
    assert.equal(updateThesisMetadata(thesis, "CO_ADVISOR_NAME", "X").values.SECOND_ADVISOR_NAME, "X");
    assert.deepEqual(Object.keys(THESIS_METADATA_FIELDS).sort(), ["ADVISOR_NAME", "CITY", "CO_ADVISOR_NAME", "DATE", "DEPARTMENT_NAME", "STUDENT_NAME", "STUDENT_NUMBER", "THESIS_TITLE_EN", "YEAR"]);
  });
});

describe("thesis section system", () => {
  const ids = (model) => model.sections.map((item) => item.id);
  const rendered = (model, id) => model.sections.find((item) => item.id === id);
  const noteWith = (template, patch = {}) => ({ title: "Tez", content: "", researchData: { thesis: { ...createThesisDocument(template, {}, 2026), ...patch } } });
  const compile = (template, note) => compileThesisDocument(template, note.researchData.thesis, note.title, note.content);

  it("takes section existence and order from the template, not the editor", () => {
    assert.deepEqual(ids(compile(demoA, noteWith(demoA))), ["cover", "abstract", "toc", "main", "bibliography"]);
    assert.deepEqual(ids(compile(demoC, noteWith(demoC))), ["cover", "declaration", "abstract", "toc", "main", "appendices", "bibliography"]);
    const titles = compile(demoC, noteWith(demoC)).sections.map((item) => item.title);
    assert.deepEqual(titles, ["Title page", "Declaration", "Abstract", "Contents", "Research chapters", "Appendices", "References"]);
    assert.deepEqual(compile(demoC, noteWith(demoC)).sections.map((item) => item.order), [0, 1, 2, 3, 4, 5, 6]);
  });

  it("honours an explicit numeric order and keeps array order for ties", () => {
    const template = structuredClone(generic);
    section(template, "bibliography").order = -1;
    section(template, "toc").order = 99;
    assert.deepEqual(orderedThesisSections(template).map((item) => item.id), ["bibliography", "cover", "abstract", "index-figures", "index-tables", "main", "appendices", "toc"]);
    assert.deepEqual(ids(compile(template, noteWith(template))), ["bibliography", "cover", "abstract", "main", "toc"]);
    section(template, "toc").order = "last";
    assert.match(validateThesisTemplate(template).join(" "), /toc\.order/);
  });

  it("classifies every bundled section as editable, static or generated", () => {
    for (const template of [generic, demoA, demoB, demoC]) {
      for (const item of template.sections) assert.ok(["editable", "static", "generated"].includes(thesisSectionMode(item)), `${template.id}:${item.id}`);
      assert.deepEqual(validateThesisTemplate(template), []);
    }
    assert.equal(thesisSectionMode(section(demoC, "declaration")), "static");
    assert.equal(thesisSectionMode(section(demoC, "abstract")), "editable");
    assert.equal(thesisSectionMode(section(demoC, "toc")), "generated");
    assert.equal(thesisSectionMode({ id: "lof", type: "listOfFigures" }), "generated");
    assert.equal(thesisSectionMode({ id: "x", type: "custom" }), "editable");
    assert.equal(thesisSectionMode({ id: "x", type: "custom", content: "Fixed" }), "static");
    const bad = structuredClone(demoC);
    section(bad, "abstract").mode = "writable";
    section(bad, "main").mode = "static";
    const errors = validateThesisTemplate(bad).join(" ");
    assert.match(errors, /abstract\.mode geçersiz/);
    assert.match(errors, /mainContent düzenlenebilir/);
  });

  it("stores editable text and refuses static and generated sections", () => {
    const note = noteWith(demoC);
    const withText = updateThesisNoteSection(note, section(demoC, "abstract"), "<p>TEST123</p>");
    assert.equal(withText.researchData.thesis.sectionContent.abstract, "<p>TEST123</p>");
    assert.equal(updateThesisNoteSection(note, section(demoC, "declaration"), "<p>X</p>"), note);
    assert.equal(updateThesisNoteSection(note, section(demoC, "toc"), "<p>X</p>"), note);
    const hacked = noteWith(demoC, { sectionContent: { toc: "<p>HACK</p>", declaration: "<p>HACK</p>" } });
    const model = compile(demoC, hacked);
    for (const id of ["toc", "declaration"]) {
      assert.equal(rendered(model, id).editable, false);
      assert.equal(rendered(model, id).editableHtml, "");
      assert.doesNotMatch(rendered(model, id).html, /HACK/);
    }
    assert.equal(rendered(model, "toc").mode, "generated");
    assert.equal(rendered(model, "declaration").mode, "static");
    assert.equal(rendered(model, "abstract").mode, "editable");
  });

  it("renders a generated list section from template data without user content", () => {
    const template = structuredClone(generic);
    template.sections.splice(3, 0, { id: "figures", type: "listOfFigures", title: "Şekiller Listesi", status: "required", group: "front", mode: "generated" });
    const model = compile(template, noteWith(template, { sectionContent: { figures: "<p>HACK</p>" } }));
    const figures = rendered(model, "figures");
    assert.equal(figures.editable, false);
    assert.match(figures.html, /Şekiller Listesi/);
    assert.match(figures.html, /data-thesis-generated="figures"/);
    assert.doesNotMatch(figures.html, /HACK/);
  });

  it("does not render disabled sections and shows optional ones only when enabled", () => {
    const template = structuredClone(demoC);
    section(template, "declaration").status = "disabled";
    assert.ok(!ids(compile(template, noteWith(template))).includes("declaration"));
    assert.ok(!ids(compile(demoA, noteWith(demoA))).includes("appendices"));
    assert.ok(ids(compile(demoA, noteWith(demoA, { enabledSections: ["appendices"] }))).includes("appendices"));
    section(template, "declaration").status = "hidden";
    assert.match(validateThesisTemplate(template).join(" "), /declaration status/);
  });

  it("compiles malformed stored thesis state instead of throwing (no error boundary above the editor)", () => {
    for (const enabledSections of [0, true, {}, { appendices: 1 }, "appendices"]) {
      assert.ok(!ids(compile(demoA, noteWith(demoA, { enabledSections }))).includes("appendices"), String(enabledSections));
    }
    assert.deepEqual(ids(compileThesisDocument(demoA, null, "T", "")), ids(compileThesisDocument(demoA, {}, "T", "")));
  });

  it("keys content by stable section id, so reordering never moves it", () => {
    let note = noteWith(generic, { enabledSections: ["appendices"] });
    note = updateThesisNoteSection(note, section(generic, "abstract"), "<p>TEST123</p>");
    note = updateThesisNoteSection(note, section(generic, "appendices"), "<p>APPENDIX456</p>");
    note = updateThesisNoteSection(note, section(generic, "main"), "<p>MAIN789</p>");
    const reversed = { ...structuredClone(generic), sections: structuredClone(generic.sections).reverse() };
    for (const template of [generic, reversed]) {
      const model = compile(template, note);
      assert.equal(rendered(model, "abstract").editableHtml, "<p>TEST123</p>");
      assert.equal(rendered(model, "appendices").editableHtml, "<p>APPENDIX456</p>");
      assert.equal(rendered(model, "main").editableHtml, "<p>MAIN789</p>");
      assert.equal(model.sections.filter((item) => /TEST123/.test(item.html)).length, 1);
    }
  });

  it("keeps each section's text in place across a template switch and a note switch", () => {
    let note = noteWith(demoA);
    note = updateThesisNoteSection(note, section(demoA, "abstract"), "<p>TEST123</p>");
    note = updateThesisNoteSection(note, section(demoA, "bibliography"), "<p>REF1</p>");
    const toC = { ...note, researchData: { ...note.researchData, thesis: { ...note.researchData.thesis, templateId: demoC.id } } };
    const saved = buildNotePayload({ noteId: "t", workspaceId: "w", note: toC, deviceId: "d" });
    const other = { title: "Başka not", content: "<p>other</p>" };
    assert.equal(other.content, "<p>other</p>");
    const loaded = migrateAcademicNote(noteFromPayload(JSON.parse(JSON.stringify(saved))));
    const modelC = compile(demoC, loaded);
    assert.equal(rendered(modelC, "abstract").editableHtml, "<p>TEST123</p>");
    assert.equal(rendered(modelC, "bibliography").editableHtml, "<p>REF1</p>");
    assert.equal(modelC.sections.filter((item) => /TEST123/.test(item.html)).map((item) => item.id).join(), "abstract");
    assert.doesNotMatch(rendered(modelC, "declaration").html, /TEST123/);
    const modelA = compile(demoA, loaded);
    assert.equal(rendered(modelA, "abstract").editableHtml, "<p>TEST123</p>");
  });

  it("keeps editor formatting (headings, marks, lists, table, image, citation) by section id through save/load and template switches", () => {
    const abstractHtml = '<span class="fmt-bold">TEST</span> <span class="fmt-italic">ital</span> <span class="fmt-underline">alt</span>';
    const mainHtml = '<h1 class="academic-h academic-h1" data-academic-heading="1">Giriş</h1><h2 class="academic-h academic-h2" data-academic-heading="2">Yöntem</h2>'
      + '<ul><li>madde</li></ul><ol><li>bir</li><li>iki</li></ol>'
      + '<div class="academic-table-wrap"><table class="academic-table" data-kind="table"><tbody><tr><td>a</td><td>b</td></tr></tbody></table></div>'
      + '<figure class="academic-figure" data-kind="figure" contenteditable="false"><img width="40" height="20" src="data:image/png;base64,AA=="><figcaption>Şekil 1. </figcaption></figure>'
      + 'Metin<sup class="academic-footnote" contenteditable="false" data-fn-id="fn-1" data-fn-text="Yazar (2020) &amp; B" data-fn-index="1">1</sup>';
    let note = noteWith(demoA);
    note = updateThesisNoteSection(note, section(demoA, "abstract"), abstractHtml);
    note = updateThesisNoteSection(note, section(demoA, "main"), mainHtml);
    assert.equal(note.content, mainHtml);
    assert.equal(note.researchData.thesis.sectionContent.abstract, abstractHtml);
    assert.equal(updateThesisNoteSection(note, section(demoC, "declaration"), "<b>X</b>"), note);
    assert.equal(updateThesisNoteSection(note, section(demoA, "toc"), "<b>X</b>"), note);
    const saved = buildNotePayload({ noteId: "t", workspaceId: "w", note, deviceId: "d" });
    const loaded = migrateAcademicNote(noteFromPayload(JSON.parse(JSON.stringify(saved))));
    for (const template of [demoC, demoA]) {
      const model = compile(template, loaded);
      assert.equal(rendered(model, "abstract").editableHtml, abstractHtml);
      assert.equal(rendered(model, "main").editableHtml, mainHtml);
      assert.deepEqual(model.headings.map((item) => [item.level, item.title]), [[1, "Giriş"], [2, "Yöntem"]]);
      assert.match(rendered(model, "toc").html, /Giriş/);
    }
    assert.deepEqual(footnotesFromHtml(mainHtml), [{ index: "1", text: "Yazar (2020) & B" }]);
  });

  it("uses the same id for the same section type across bundled templates", () => {
    const byType = new Map();
    for (const template of [generic, demoA, demoB, demoC]) {
      for (const item of template.sections) {
        if (item.type === "custom") continue;
        const known = byType.get(item.type);
        if (known) assert.equal(item.id, known, `${template.id}: ${item.type}`);
        else byType.set(item.type, item.id);
      }
    }
  });
});
