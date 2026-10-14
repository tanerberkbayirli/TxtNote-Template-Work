import test from "node:test";
import assert from "node:assert/strict";
import { parseAcademicHtml } from "./academicDocument.js";
import { runFormatAttributes, fieldMarkerAttributes, safeFieldInstruction } from "../../../../engine/src/docx/runFormat.js";

test("Node regex fallback keeps nested lists nested (13-B)", () => {
  const html = "<ul><li>A<ul><li>A1</li><li>A2<ol><li>deep</li></ol></li></ul></li><li>B</li></ul><p>after</p>";
  const [list, para] = parseAcademicHtml(html);
  assert.equal(list.type, "list");
  assert.deepEqual(list.items.map((i) => i.text), ["A", "B"]);
  assert.deepEqual(list.items[0].lists[0].items.map((i) => i.text), ["A1", "A2"]);
  assert.equal(list.items[0].lists[0].items[1].lists[0].ordered, true);
  assert.equal(list.items[0].lists[0].items[1].lists[0].items[0].text, "deep");
  assert.equal(para.type, "paragraph");
});

test("imported run formatting travels as exporter-readable markup and parses to runs (13-B)", () => {
  const attrs = runFormatAttributes({ color: "#FF0000", highlight: "yellow", underline: true, verticalAlign: "superscript", bold: false });
  assert.deepEqual(attrs, { class: "fmt-underline", "data-fmt-color": "#ff0000", "data-fmt-bg": "#ffff00", "data-fmt-valign": "super" });
  const html = `<p><span class="fmt-underline" data-fmt-color="#ff0000" data-fmt-bg="#ffff00" data-fmt-valign="super">x</span></p>`;
  const [block] = parseAcademicHtml(html);
  const run = block.runs.find((r) => r.type === "text");
  assert.equal(run.underline, true); assert.equal(run.color, "#ff0000"); assert.equal(run.highlight, "#ffff00"); assert.equal(run.valign, "superscript");
});

test("field markers carry kind/instruction; unsafe field codes become inert (13-B)", () => {
  const node = (localName, extra = {}) => ({ localName, textContent: extra.text || "", ...extra });
  const attr = (n, name) => n.attrs?.[name] || "";
  assert.deepEqual(fieldMarkerAttributes(node("fldChar", { attrs: { fldCharType: "begin" } }), attr), { "data-docx-fldchar": "begin" });
  assert.equal(fieldMarkerAttributes(node("instrText", { text: " PAGEREF _Toc1 \h " }), attr)["data-docx-instruction"], " PAGEREF _Toc1 \h ");
  assert.match(safeFieldInstruction("HYPERLINK javascript:evil()"), /BlockedField/);
  assert.match(safeFieldInstruction(' INCLUDETEXT "x"'), /BlockedField/);
  assert.equal(safeFieldInstruction(String.raw` HYPERLINK \l _Toc1 `), String.raw` HYPERLINK \l _Toc1 `);
});
