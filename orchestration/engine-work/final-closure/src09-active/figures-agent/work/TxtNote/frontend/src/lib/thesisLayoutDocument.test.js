import assert from "node:assert/strict";
import test from "node:test";
import {
  addLayoutElement,
  deleteLayoutElement,
  duplicateLayoutElement,
  normalizeThesisLayout,
  resolveLayoutNodes,
  resolveLayoutPage,
  updateLayoutElements,
} from "../thesis/layoutDocument.js";
import { convertLength, MM_PER_PT, mmToTwip, ptToTwip } from "../thesis/units.js";

test("convertLength uses physical CSS pixel, point, Word and EMU definitions", () => {
  assert.equal(convertLength(96, "px", "mm"), 25.4);
  assert.equal(convertLength(72, "pt", "inch"), 1);
  assert.equal(convertLength(1, "inch", "twip"), 1440);
  assert.equal(convertLength(914400, "emu", "inch"), 1);
  const original = 123.456;
  const converted = convertLength(convertLength(original, "cm", "pt"), "pt", "cm");
  assert.ok(Math.abs(converted - original) < 1e-10);
  assert.throws(() => convertLength(Number.NaN, "mm", "pt"), TypeError);
  assert.throws(() => convertLength(2, "furlong", "mm"), RangeError);
});

test("legacy unit exports keep their previous conversions", () => {
  assert.equal(MM_PER_PT, 25.4 / 72);
  assert.equal(mmToTwip(25.4), 1440);
  assert.equal(ptToTwip(12), 240);
});

test("normalizeThesisLayout retains valid fields and drops unsafe imported values", () => {
  const normalized = normalizeThesisLayout({
    version: 99,
    elements: {
      "cover:block:0": {
        xMm: 3.5,
        yMm: Number.POSITIVE_INFINITY,
        widthMm: -4,
        style: { fontSizePt: 12, lineHeight: 0, color: "#12aBcD", highlight: "yellow", background: "url(javascript:alert(1))", align: "center" },
        content: "Thesis title",
        arbitraryCss: "position:fixed",
      },
      "cover:block:1": { style: { highlight: "url(javascript:alert(1))" } },
    },
    additions: [
      { id: "txt-1", sectionId: "cover", type: "text", text: "Safe", style: { color: "#123456" } },
      { id: "img-1", sectionId: "cover", type: "image", source: "https://example.test/bad.png" },
    ],
    guides: [{ id: "g1", axis: "vertical", positionMm: 40 }, { id: "g2", axis: "sideways", positionMm: 10 }],
  });
  assert.equal(normalized.version, 1);
  assert.deepEqual(normalized.elements["cover:block:0"], {
    xMm: 3.5,
    style: { fontSizePt: 12, color: "#12abcd", highlight: "yellow", align: "center" },
    content: "Thesis title",
  });
  assert.equal(normalized.elements["cover:block:1"], undefined);
  assert.equal(normalized.additions.length, 1);
  assert.equal(normalized.additions[0].text, "Safe");
  assert.equal(normalized.additions[0].layoutMode, "absolute");
  assert.deepEqual(normalized.guides, [{ id: "g1", axis: "x", positionMm: 40 }]);
});

test("layout updates, additions, deletion and duplication are immutable and persist through JSON", () => {
  const original = { values: { YEAR: "2026" }, layout: { elements: { "cover:block:0": { xMm: 1 } } } };
  const updated = updateLayoutElements(original, [{ id: "cover:block:0", xMm: 8, style: { fontSizePt: 14 } }]);
  assert.equal(original.layout.elements["cover:block:0"].xMm, 1);
  assert.equal(updated.layout.elements["cover:block:0"].xMm, 8);
  assert.equal(updated.layout.elements["cover:block:0"].style.fontSizePt, 14);

  const withAddition = addLayoutElement(updated, { id: "title", sectionId: "cover", type: "text", xMm: 12, yMm: 30, text: "Hello" });
  assert.equal(withAddition.layout.additions[0].id, "title");
  const duplicated = duplicateLayoutElement(withAddition, { ...withAddition.layout.additions[0], text: "Copy" });
  assert.equal(duplicated.layout.additions.length, 2);
  assert.notEqual(duplicated.layout.additions[1].id, "title");
  assert.equal(duplicated.layout.additions[1].content, "Copy");
  const deleted = deleteLayoutElement(duplicated, "title");
  assert.equal(deleted.layout.additions.some((item) => item.id === "title"), false);
  assert.equal(duplicated.layout.additions.length, 2);

  const persisted = JSON.parse(JSON.stringify(deleted));
  assert.deepEqual(normalizeThesisLayout(persisted.layout), normalizeThesisLayout(deleted.layout));
  assert.deepEqual(original.values, { YEAR: "2026" });
});

test("page rules inherit deeply from template through document, section and physical page", () => {
  const template = {
    widthMm: 210,
    heightMm: 297,
    orientation: "portrait",
    margins: { topMm: 20, bottomMm: 20, leftMm: 30, rightMm: 20 },
    header: { heightMm: 10, distanceMm: 5, content: "Template header" },
    numbering: { enabled: true, position: "bottom", align: "center", format: "arabic", startAt: 1 },
  };
  const resolved = resolveLayoutPage(template, "body", 2, {
    page: { widthMm: 200, margins: { leftMm: 25 }, header: { content: "Document header" } },
    sections: { body: { margins: { topMm: 15 }, numbering: { format: "roman-lower" } } },
    pages: { "body:2": { orientation: "landscape", margins: { rightMm: 18 }, header: { distanceMm: 8 } } },
  });
  assert.equal(resolved.widthMm, 200);
  assert.equal(resolved.orientation, "landscape");
  assert.deepEqual(resolved.margins, { topMm: 15, bottomMm: 20, leftMm: 25, rightMm: 18 });
  assert.deepEqual(resolved.header, { heightMm: 10, distanceMm: 8, content: "Document header" });
  assert.deepEqual(resolved.numbering, { enabled: true, position: "bottom", align: "center", format: "roman-lower", startAt: 1 });
  assert.equal(template.margins.leftMm, 30);
});

test("a template block taken out of the flow leaves its slot so later blocks do not move up", () => {
  const nodes = [
    { path: "0", type: "text", text: "First", style: { fontSizePt: 14, spaceBeforePt: 6 } },
    { path: "1", type: "text", text: "Second", style: { fontSizePt: 14 } },
  ];
  const layout = { elements: { "cover:block:0": { layoutMode: "absolute", xMm: 30, yMm: 40, widthMm: 150, heightMm: 20, flowHeightMm: 8.5 } } };
  const resolved = resolveLayoutNodes(nodes, "cover", layout);
  assert.deepEqual(resolved.map((node) => node.id ?? node.path), ["0-slot", "cover:block:0", "cover:block:1"]);
  assert.equal(resolved[0].type, "spacer");
  assert.equal(resolved[0].heightMm, 8.5);
  assert.ok(Math.abs(resolved[0].marginTopMm - 6 * MM_PER_PT) < 1e-9);
  assert.equal(resolved[0].marginBottomMm, 0);
  // Re-resolving keeps the slot unselectable, and a block back in the flow has no slot.
  assert.equal(resolveLayoutNodes(resolved.slice(0, 1), "cover", layout)[0].id, undefined);
  assert.equal(resolveLayoutNodes(nodes, "cover", { elements: { "cover:block:0": { layoutMode: "flow" } } }).length, 2);
});

test("resolved nodes keep stable identities, preserve template data and apply text and geometry overrides", () => {
  const templateNodes = [
    { path: "0", type: "group", direction: "column", blocks: [{ path: "0-1", type: "text", field: "STUDENT_NAME", text: "Student", style: { fontSizePt: 11 } }] },
    { path: "2", type: "text", text: "Static", style: { fontSizePt: 10 } },
  ];
  const layout = {
    elements: {
      "cover:block:0.1": { xMm: 15, yMm: 30, content: "Edited student", style: { fontSizePt: 14 } },
      "cover:block:2": { deleted: true },
    },
    additions: [{ id: "title-added", sectionId: "cover", type: "text", xMm: 20, yMm: 10, text: "Added", style: { color: "#123456" } }],
  };
  const resolved = resolveLayoutNodes(templateNodes, "cover", layout, { fontFamily: "Times New Roman", fontSizePt: 12 });
  assert.deepEqual(templateNodes[0].blocks[0], { path: "0-1", type: "text", field: "STUDENT_NAME", text: "Student", style: { fontSizePt: 11 } });
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, "cover:block:0");
  assert.equal(resolved[0].sectionId, "cover");
  assert.equal(resolved[0].blocks[0].id, "cover:block:0.1");
  assert.equal(resolved[0].blocks[0].path, "0-1");
  assert.equal(resolved[0].blocks[0].field, "STUDENT_NAME");
  assert.equal(resolved[0].blocks[0].text, "Edited student");
  assert.equal(resolved[0].blocks[0].xMm, 15);
  assert.equal(resolved[0].blocks[0].editableContent, true);
  assert.equal(resolved[0].blocks[0].locked, false);
  assert.equal(resolved[1].id, "title-added");
  assert.equal(resolved[1].path, "layout-addition-title-added");
  assert.equal(resolved[1].text, "Added");
  assert.equal(resolved[1].style.fontFamily, "Times New Roman");
  assert.equal(resolved[1].style.color, "#123456");
});

test("template positioned-node lock flags survive unless the document explicitly overrides them", () => {
  const nodes = [{ path: "0", type: "image", locked: true, lockAspectRatio: true, layoutMode: "absolute", xMm: 3, yMm: 4, widthMm: 20, heightMm: 10 }];
  const sourceDefaults = resolveLayoutNodes(nodes, "cover", {}).find((node) => node.type === "image");
  assert.equal(sourceDefaults.locked, true);
  assert.equal(sourceDefaults.lockAspectRatio, true);
  const overridden = resolveLayoutNodes(nodes, "cover", { elements: { "cover:block:0": { locked: false, lockAspectRatio: false } } }).find((node) => node.type === "image");
  assert.equal(overridden.locked, false);
  assert.equal(overridden.lockAspectRatio, false);
});

test("a template-positioned block may declare flowHeightMm 0 so it keeps no flow slot", () => {
  const nodes = [
    { path: "0", type: "image", widthMm: 20, heightMm: 20, layoutMode: "absolute", xMm: 0, yMm: 0, flowHeightMm: 0 },
    { path: "1", type: "image", widthMm: 20, heightMm: 20, layoutMode: "absolute", xMm: 30, yMm: 0 },
    { path: "2", type: "text", text: "After", style: { fontSizePt: 12 } },
  ];
  const resolved = resolveLayoutNodes(nodes, "cover", {});
  // Without the declaration the slot keeps the block's height (unchanged default).
  assert.deepEqual(resolved.map((node) => node.id ?? node.path), ["cover:block:0", "1-slot", "cover:block:1", "cover:block:2"]);
  assert.equal(resolved[1].heightMm, 20);
});
