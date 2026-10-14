import assert from "node:assert/strict";
import { test } from "node:test";
import { cssColorToHex, cssPxToHalfPoints, EXPORT_WIDGET_CSS, printInkColor, widgetExportKind } from "./academicSnapshot.js";
import { serializeAcademicBody } from "./academicExport.js";

test("cssPxToHalfPoints maps 12pt (16px) to Word half-points", () => {
  assert.equal(cssPxToHalfPoints("16px"), 24);
  assert.equal(cssPxToHalfPoints("21.3333px"), 32);
  assert.equal(cssPxToHalfPoints("0"), 24);
});

test("cssColorToHex reads rgb, hex and fallback", () => {
  assert.equal(cssColorToHex("rgb(190, 18, 60)"), "BE123C");
  assert.equal(cssColorToHex("#0369a1"), "0369A1");
  assert.equal(cssColorToHex("#abc"), "AABBCC");
  assert.equal(cssColorToHex("navy"), "111111");
});

test("export widget CSS hides editor chrome and keeps code as a listing", () => {
  assert.match(EXPORT_WIDGET_CSS, /math-formula__toolbar/);
  assert.match(EXPORT_WIDGET_CSS, /display:none/);
  assert.match(EXPORT_WIDGET_CSS, /data-empty/);
  assert.match(EXPORT_WIDGET_CSS, /katex/);
  assert.match(EXPORT_WIDGET_CSS, /academic-code/);
  assert.match(EXPORT_WIDGET_CSS, /pre-wrap/);
  assert.match(EXPORT_WIDGET_CSS, /overflow-wrap:\s*anywhere/);
});

test("printInkColor keeps dark ink and replaces near-white", () => {
  assert.equal(printInkColor("rgb(17, 17, 17)"), "111111");
  assert.equal(printInkColor("#ffffff"), "111111");
  assert.equal(printInkColor("rgb(190, 18, 60)"), "BE123C");
});

test("widgetExportKind distinguishes inline math from block widgets", () => {
  const inline = { classList: { contains: (name) => name === "math-formula--inline" } };
  const block = { classList: { contains: (name) => name === "math-formula" || name === "code-block" } };
  const code = { classList: { contains: (name) => name === "code-block" } };
  assert.equal(widgetExportKind(inline), "inline");
  assert.equal(widgetExportKind(block), "block");
  assert.equal(widgetExportKind(code), "block");
  assert.equal(widgetExportKind(null), "none");
});

test("serializeAcademicBody keeps math and code, drops page gaps", () => {
  const html = `<span class="math-formula" data-latex="x^2"><span class="katex">x</span></span><div data-academic-page-gap="true"></div><pre class="code-block">a</pre>`;
  const next = serializeAcademicBody(html);
  assert.match(next, /katex/);
  assert.match(next, /code-block/);
  assert.equal(next.includes("data-academic-page-gap"), false);
});
