import test from "node:test";
import assert from "node:assert/strict";
import demoD from "../thesis/templates/demo-d.js";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, groupThesisSections } from "../thesis/engine.js";
import { checkThesisCompliance, layoutParagraphRecords } from "../thesis/compliance.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";

const codes = (audit) => audit.findings.map((finding) => finding.code);
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("a seeded, untouched document with its metadata filled has no findings", () => {
  const model = compileThesisDocument(demoD, { values: { STUDENT_NAME: "Ayşe Yılmaz", CITY: "Manisa" } }, "Başlık", "<p>Giriş metni.</p>");
  const audit = checkThesisCompliance(model, { groups: groupThesisSections(model.sections), pageCounts: { cover: 1 } });
  assert.deepEqual(codes(audit).filter((code) => code !== "section.empty"), []);
  assert.equal(audit.errors, 0);
});

test("seeded layout edits are compared with the fresh seed: alignment, size, removed fields, extra lines", () => {
  const first = compileThesisDocument(demoD, { values: { STUDENT_NAME: "Ayşe Yılmaz" } }, "Başlık");
  let html = first.sections[0].editableHtml;
  // The title line is left-aligned and shrunk, the student line is deleted, a free line is added.
  html = html.replace(/<p class="fmt-align-center"([^>]*)><span class="fmt-pt-18">/, '<p class="fmt-align-left"$1><span class="fmt-pt-12">');
  html = html.replace(/<p class="fmt-align-center"[^>]*><span class="fmt-pt-12"><span class="thesis-field" data-field="STUDENT_NAME"[^>]*>[^<]*<\/span><\/span><\/p>/, "");
  html += '<p class="fmt-align-left">Serbest satır</p>';
  const model = compileThesisDocument(demoD, { values: { STUDENT_NAME: "Ayşe Yılmaz" }, sectionContent: { cover: thesisSourceHtml(html) } }, "Başlık");
  const audit = checkThesisCompliance(model);
  const cover = audit.findings.filter((finding) => finding.sectionId === "cover");
  const found = Object.fromEntries(cover.map((finding) => [finding.code, finding]));
  assert.equal(found["layout.align"].actual, "sola yaslı"); assert.equal(found["layout.align"].expected, "ortalı");
  assert.equal(found["layout.size"].actual, "12 pt"); assert.equal(found["layout.size"].expected, "18 pt");
  assert.equal(found["layout.fieldRemoved"].severity, "error", "STUDENT_NAME is required in the template");
  assert.match(found["layout.fieldRemoved"].message, /Öğrenci/);
  assert.equal(found["layout.extraLines"].severity, "info");
  assert.ok(cover.every((finding) => finding.source.includes("cover › blocks")));
  assert.ok(audit.findings.some((finding) => finding.code === "section.empty"), "other empty required sections are still listed");
});

test("body text: alignment and size marks, pseudo headings, skipped heading levels, missing captions", () => {
  const main = [
    '<h1>1. Giriş</h1>',
    '<p class="fmt-align-center"><span class="fmt-pt-10">Ortalı küçük paragraf</span></p>',
    '<p><span class="fmt-size-heading">Büyütülmüş sahte başlık</span></p>',
    '<h3>Atlanmış düzey</h3>',
    `<figure class="academic-figure"><img src="${PNG}" width="10" height="10"></figure>`,
    '<table><tbody><tr><td>a</td></tr></tbody></table>',
  ].join("");
  const model = compileThesisDocument(generic, {}, "Başlık", main);
  const audit = checkThesisCompliance(model);
  const mainFindings = audit.findings.filter((finding) => finding.sectionId === "main");
  const found = Object.fromEntries(mainFindings.map((finding) => [finding.code, finding]));
  assert.equal(found["paragraph.align"].expected, "iki yana yaslı"); assert.equal(found["paragraph.align"].actual, "ortalı");
  assert.equal(found["paragraph.size"].expected, "12 pt"); assert.equal(found["paragraph.size"].actual, "10 pt");
  assert.ok(found["heading.pseudo"]);
  assert.match(found["heading.skip"].message, /Başlık 3 doğrudan Başlık 1/);
  assert.equal(found["figure.caption"].expected, "Şekil yazısı (altta)");
  assert.equal(found["table.caption"].expected, "Tablo yazısı (üstte)");
  assert.ok(mainFindings.every((finding) => finding.severity === "warning"));
  assert.ok(audit.findings.some((finding) => finding.code === "metadata.missing" && finding.severity === "error"), "required metadata missing on the cover");
});

test("empty required sections, page overflow of standalone pages and template validation rules are reported", () => {
  const template = { ...generic, validation: { KEYWORDS: { minItems: 3, severity: "warning", message: "En az üç anahtar kelime" } } };
  const model = compileThesisDocument(template, { values: { KEYWORDS: "bir" } }, "Başlık", "");
  const groups = groupThesisSections(model.sections);
  const audit = checkThesisCompliance(model, { groups, pageCounts: { cover: 2 } });
  const found = Object.fromEntries(audit.findings.map((finding) => [finding.code, finding]));
  assert.equal(found["page.overflow"].severity, "error"); assert.equal(found["page.overflow"].actual, "2 sayfa");
  assert.ok(audit.findings.some((finding) => finding.code === "section.empty" && finding.sectionId === "abstract"));
  assert.equal(found["validation.minItems"].message, "En az üç anahtar kelime");
  assert.ok(!audit.findings.some((finding) => finding.sectionId === "main" && finding.code === "section.empty"), "the main body is not nagged for being empty");
  assert.deepEqual(audit.findings.map((finding) => finding.severity).slice(0, 1), ["error"], "errors first");
});

test("layoutParagraphRecords reads the template-decided properties of seeded paragraphs", () => {
  const records = layoutParagraphRecords('<p class="thesis-gap" data-gap="5"></p><p class="fmt-align-center" data-pt="15"><strong>T.C.</strong></p><p class="fmt-align-right"><span class="fmt-pt-14"><span class="thesis-field" data-field="CITY" contenteditable="false">Manisa</span></span></p>');
  assert.deepEqual(records, [
    { align: "center", pt: 15, bold: true, fields: [], text: "T.C.", hidden: false },
    { align: "right", pt: 14, bold: false, fields: ["CITY"], text: "Manisa", hidden: false },
  ]);
});
