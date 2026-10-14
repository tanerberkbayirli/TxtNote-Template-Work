import assert from "node:assert/strict";
import { test } from "node:test";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument, buildThesisCss } from "../thesis/engine.js";
import { walkSpecialPage } from "../thesis/specialPages.js";
import { resolveGeneratedIndexes } from "../thesis/generatedIndex.js";

test("template layout overrides drive canonical compiler and CSP-safe rendering", () => {
  const original = JSON.stringify(generic);
  const base = compileThesisDocument(generic, {}, "Layout test", "<p>Flow stays editable</p>");
  const node = [...walkSpecialPage(base.sections[0].layout)].find(n => n.type === "text");
  const state = { layout: { version: 1, elements: { [node.id]: {
    layoutMode: "absolute", xMm: 40, yMm: 42, widthMm: 140,
    style: { fontSizePt: 12, fontWeight: 700, spaceAfterPt: 6 }, text: "Canonical text",
  } }, page: { margins: { bottomMm: 25, leftMm: 30 } } } };
  const model = compileThesisDocument(generic, JSON.parse(JSON.stringify(state)), "Layout test", "<p>Flow stays editable</p>");
  const resolved = [...walkSpecialPage(model.sections[0].layout)].find(n => n.id === node.id);
  assert.equal(resolved.xMm, 40);
  assert.equal(resolved.style.fontSizePt, 12);
  assert.equal(resolved.style.spaceAfterPt, 6);
  assert.match(model.sections[0].html, /data-layout-id=/);
  assert.doesNotMatch(model.sections[0].html, /\sstyle=/);
  assert.match(buildThesisCss(model), /left:40mm;top:42mm/);
  assert.ok(model.sections.every(s => s.rules.page.margins.bottomMm === 25));
  assert.match(model.sections.find(s => s.type === "mainContent").editableHtml, /Flow stays editable/);
  assert.equal(JSON.stringify(generic), original);
  assert.equal([...walkSpecialPage(resolveGeneratedIndexes(model).sections[0].layout)].find(n => n.id === node.id).xMm, 40);
});

test("layout additions do not suppress ordinary document content", () => {
  const model = compileThesisDocument(generic, { layout: { version: 1, additions: [{
    id: "custom-text", sectionId: "main", type: "text", text: "Independent frame",
    layoutMode: "absolute", xMm: 40, yMm: 42, widthMm: 100,
    style: { fontSizePt: 12 },
  }] } }, "Test", "<p>Original paragraph</p>");
  const main = model.sections.find(s => s.id === "main");
  assert.match(main.html, /Original paragraph/);
  assert.match(main.html, /Independent frame/);
  assert.equal(main.layoutBlocks, null);
});
