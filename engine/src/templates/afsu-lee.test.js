import test from "node:test";
import assert from "node:assert/strict";
import master from "./afsu-lee.js";
import { afsuLeePhd } from "./afsu-lee.js";
import { compileThesisDocument } from "../engine.js";
import { walkSpecialPage } from "../specialPages.js";

test("AFSÜ LEE variants share source-backed thesis rules and expose the supported degrees", () => {
  assert.equal(master.id, "afsu-lee-master-tr-v1");
  assert.equal(afsuLeePhd.id, "afsu-lee-phd-tr-v1");
  assert.equal(master.language, "tr");
  assert.equal(afsuLeePhd.language, "tr");
  assert.equal(master.typography.body.fontFamily, "Times New Roman");
  assert.equal(master.typography.body.fontSizePt, 12);
  assert.equal(master.typography.body.lineHeight, 1.5);
  assert.equal(master.typography.body.spaceBeforePt, 6);
  assert.equal(master.typography.body.spaceAfterPt, 6);
  assert.equal(master.typography.lineSpacing.paragraphSpacing, "collapse");
  assert.deepEqual(master.page.margins, { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 });
  assert.deepEqual(afsuLeePhd.page.margins, master.page.margins);
  assert.equal(master.typography.headings["4"].numbering.enabled, false);
  assert.equal(master.typography.headings["4"].italic, true);
  assert.equal(master.typography.headings["3"].textTransform, "none");
  assert.deepEqual(master.typography.headings["2"].textTransformExceptions, ["ve", "veya", "ile"]);
});

test("degree variants retain source order, abstract pages, CV, and total jury counts", () => {
  const ids = master.sections.map((section) => section.id);
  assert.deepEqual(ids, ["outer-cover", "inner-cover", "ethics", "approval", "acknowledgements", "abstract-header", "abstract-tr", "abstract-tr-footer", "abstract-en-header", "abstract-en", "abstract-en-footer", "toc", "abbreviations", "index-tables", "index-figures", "main", "bibliography", "appendices", "cv"]);
  assert.equal(master.metadata.juryMembers, 3);
  assert.equal(afsuLeePhd.metadata.juryMembers, 5);
  assert.ok(master.sections.some((section) => section.id === "cv" && section.status === "required"));
  assert.ok(afsuLeePhd.sections.some((section) => section.id === "cv" && section.status === "required"));
  assert.equal(master.sections.find((section) => section.id === "abstract-header").standalone, false);
  assert.equal(master.sections.find((section) => section.id === "abstract-en-header").standalone, false);
});

test("department and program fields contain only names; fixed source suffixes are supplied by the template", () => {
  assert.match(master.placeholders.DEPARTMENT_NAME.label, /yalnız adı/);
  assert.match(master.placeholders.PROGRAM_NAME.label, /yalnız adı/);
  const model = compileThesisDocument(master, { values: { DEPARTMENT_NAME: "Eğitim Bilimleri", PROGRAM_NAME: "Eğitim Programları ve Öğretim" } }, "Test Tezi", "<p>Metin</p>");
  const texts = (id) => [...walkSpecialPage(model.sections.find((section) => section.id === id).layout)].filter((node) => node.type === "text");
  assert.equal(texts("outer-cover").find((node) => node.field === "DEPARTMENT_NAME").text, "Eğitim Bilimleri ANABİLİM DALI");
  assert.equal(texts("inner-cover").find((node) => node.field === "DEPARTMENT_NAME").text, "Eğitim Bilimleri ANABİLİM DALI");
  assert.equal(texts("inner-cover").find((node) => node.field === "PROGRAM_NAME").text, "Eğitim Programları ve Öğretim PROGRAMI");
  const approval = texts("approval").map((node) => node.text).join(" ");
  assert.match(approval, /Eğitim Bilimleri Anabilim Dalı Eğitim Programları ve Öğretim Programında/);
});

test("self-4 geometry: ethics bullets, approval frame, English abstract positions follow the official Word render", () => {
  const model = compileThesisDocument(master, { values: {} }, "Test Tezi", "<p>Metin</p>");
  const section = (id) => model.sections.find((entry) => entry.id === id);
  const approvalMargins = master.sections.find((entry) => entry.id === "approval").overrides.page.margins;
  assert.ok(Math.abs(approvalMargins.leftMm - 100.7 * 25.4 / 72) < 1e-6);
  assert.ok(Math.abs(approvalMargins.rightMm - 69.05 * 25.4 / 72) < 1e-6);
  const ethics = [...walkSpecialPage(section("ethics").layout)].filter((node) => node.type === "text" && node.text.startsWith("•"));
  assert.equal(ethics.length, 6);
  const english = [...walkSpecialPage(section("abstract-en-header").layout)].find((node) => node.text === "ABSTRACT");
  assert.ok(english.yMm > ([...walkSpecialPage(section("abstract-header").layout)].find((node) => node.text === "ÖZET").yMm));
});
