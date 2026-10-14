import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { compileThesisDocument, groupThesisSections } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { buildThesisPageModel, numberThesisPages } from "../../../../engine/src/pageLayout.js";
import { mcbuTipUzmanlik } from "../../../../engine/src/templates/mcbu-tip.js";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";

const html = "<h1>Giriş</h1><p>Bir.</p><h1>Genel Bilgiler</h1><p>İki.</p><h1>Bulgular</h1><p>Üç.</p>";
const compile = (template) => compileThesisDocument(template, { values: {}, sectionContent: {}, enabledSections: [] }, "Başlık", html, []);
const docx = async (model) => unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));

describe("page.numbering.omitOnChapterStart", () => {
  it("is validated and enabled by the MCBU Tıp template only", () => {
    assert.deepEqual(validateThesisTemplate(mcbuTipUzmanlik), []);
    assert.equal(mcbuTipUzmanlik.page.numbering.omitOnChapterStart, true);
    assert.equal(mcbuMaster.page.numbering.omitOnChapterStart, undefined);
    const bad = structuredClone(mcbuTipUzmanlik);
    bad.page.numbering.omitOnChapterStart = "yes";
    assert.ok(validateThesisTemplate(bad).some((e) => e.includes("omitOnChapterStart")));
  });

  it("hides the label of chapter-opening pages but keeps counting them", () => {
    const groups = groupThesisSections(compile(mcbuTipUzmanlik).sections);
    const main = groups.find((g) => g.id === "main");
    const plain = numberThesisPages(groups, { main: 4 }).find((n) => n.sectionId === "main");
    assert.deepEqual(plain.labels.length, 4);
    const hidden = numberThesisPages(groups, { main: 4 }, { main: new Set([0, 2]) }).find((n) => n.sectionId === "main");
    assert.deepEqual(hidden.labels, ["", plain.labels[1], "", plain.labels[3]]);
    assert.deepEqual(hidden.indexLabels, plain.indexLabels, "contents keep the counted numbers");
    assert.equal(buildThesisPageModel(groups, { main: 4 }, { main: new Set([0]) }).find((m) => m.groupId === main.id).pages[0].label, "");
  });

  it("does nothing for a template that does not opt in", () => {
    const groups = groupThesisSections(compile(mcbuMaster).sections);
    const id = groups.find((g) => g.rules.page.numbering.enabled).id;
    const normal = numberThesisPages(groups, { [id]: 2 });
    assert.deepEqual(numberThesisPages(groups, { [id]: 2 }, { [id]: new Set([0]) }), normal);
  });

  it("writes one number-free-first-page Word section per chapter in DOCX", async () => {
    const files = await docx(compile(mcbuTipUzmanlik));
    const xml = strFromU8(files["word/document.xml"]);
    const sectPrs = xml.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g) || [];
    const titled = sectPrs.filter((section) => /<w:titlePg\/>/.test(section));
    assert.ok(titled.length >= 3 + 3, "3 chapters in the body plus the opening pages of the back sections get a titlePg section");
    assert.equal(titled.filter((section) => /w:start=/.test(section)).length, 1, "only the GİRİŞ section restarts numbering; later chapters continue it");
    assert.equal(titled.filter((section) => /w:type w:val="nextPage"/.test(section)).length >= 2, true);
    const footers = Object.entries(files).filter(([name]) => /word\/footer\d+\.xml/.test(name)).map(([, data]) => strFromU8(data));
    assert.ok(footers.some((f) => !/PAGE/.test(f)), "a footer without the PAGE field exists (first pages)");
    assert.ok(footers.some((f) => /PAGE/.test(f)), "default footers keep the PAGE field");
    const noChapterBreak = xml.split(/<w:sectPr\b/).length;
    assert.ok(noChapterBreak > 4);
  });

  it("DOCX output is unchanged without the option", async () => {
    const plain = structuredClone(mcbuTipUzmanlik);
    delete plain.page.numbering.omitOnChapterStart;
    const xml = strFromU8((await docx(compile(plain)))["word/document.xml"]);
    const withOption = strFromU8((await docx(compile(mcbuTipUzmanlik)))["word/document.xml"]);
    assert.ok((withOption.match(/<w:sectPr\b/g) || []).length > (xml.match(/<w:sectPr\b/g) || []).length);
    assert.match(xml, /w:pageBreakBefore/);
  });
});

