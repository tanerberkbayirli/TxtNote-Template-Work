import test from "node:test";
import assert from "node:assert/strict";
import { normalizeThesisLayout } from "../thesis/layoutDocument.js";
import { applyLayoutPage, applyLayoutTypography, resolveLayoutTypography } from "../thesis/layoutProperties.js";

test("page rules preserve nested siblings and apply document, section, and page scope immutably", () => {
  const thesis = { layout: { page: { margins: { leftMm: 35, rightMm: 20 }, numbering: { enabled: true } }, sections: { body: { margins: { topMm: 28 } } }, pages: {} } };
  const documentPatch = applyLayoutPage(thesis, { margins: { rightMm: 25 } });
  assert.deepEqual(documentPatch.layout.page.margins, { leftMm: 35, rightMm: 25 });
  assert.deepEqual(documentPatch.layout.page.numbering, { enabled: true });
  const sectionPatch = applyLayoutPage(documentPatch, { margins: { bottomMm: 30 } }, { scope: "section", sectionId: "body" });
  const pagePatch = applyLayoutPage(sectionPatch, { orientation: "landscape" }, { scope: "page", sectionId: "body", pageIndex: 2 });
  assert.equal(pagePatch.layout.sections.body.margins.topMm, 28);
  assert.deepEqual(pagePatch.layout.pages["body:2"], { orientation: "landscape" });
  assert.deepEqual(thesis.layout.page.margins, { leftMm: 35, rightMm: 20 });
});

test("page updates reject non-finite values and margins that consume the page", () => {
  assert.throws(() => applyLayoutPage({}, { widthMm: Infinity }), /positive finite/);
  assert.throws(() => applyLayoutPage({}, { widthMm: 200, margins: { leftMm: 120, rightMm: 90 } }), /content width/);
  assert.throws(() => applyLayoutPage({}, { margins: { topMm: -1 } }), /non-negative/);
});

test("typography overrides inherit base then document then section while preserving omitted style fields", () => {
  const base = { fontFamily: "Tinos", fontSizePt: 12, lineHeight: 1.5, align: "left", spaceAfterPt: 6 };
  const original = {};
  const doc = applyLayoutTypography(original, { fontSizePt: 25, fontFamily: "Arial" });
  const section = applyLayoutTypography(doc, { align: "center" }, { scope: "section", sectionId: "abstract" });
  assert.deepEqual(resolveLayoutTypography(base, "abstract", section.layout), { fontFamily: "Arial", fontSizePt: 25, lineHeight: 1.5, align: "center", spaceAfterPt: 6 });
  assert.equal(resolveLayoutTypography(base, "body", section.layout).align, "left");
  assert.equal(section.layout.typography.document.fontSizePt, 25);
  assert.deepEqual(original, {});
});

test("normalized typography overrides round-trip through the layout normalizer", () => {
  const thesis = applyLayoutTypography({}, { fontSizePt: 25, fontWeight: 700, italic: true, decoration: "underline", color: "#112233", characterSpacingPt: 0.25, firstLineIndentMm: 8 });
  const imported = normalizeThesisLayout(thesis.layout);
  assert.deepEqual(imported.typography.document, thesis.layout.typography.document);
  assert.equal(resolveLayoutTypography({ fontFamily: "Tinos", fontSizePt: 12 }, "body", imported).fontSizePt, 25);
});
