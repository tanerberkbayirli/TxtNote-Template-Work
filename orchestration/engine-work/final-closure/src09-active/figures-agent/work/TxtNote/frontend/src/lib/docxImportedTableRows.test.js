import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { importedRowRules } from "../thesis/docx/tableRows.js";
import { importedContentCss } from "../thesis/docx/projection.js";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const row = (id, trPr = "", cells = [{ id: `${id}c`, type: "cell", children: [], properties: {} }]) => ({ id, type: "row", children: cells, properties: { rowPropertiesXml: trPr ? `<w:trPr ${W}>${trPr}</w:trPr>` : "" } });
const table = (rows) => ({ id: "t", type: "table", properties: {}, children: [{ type: "tableBody", children: rows }] });

describe("imported Word table rows", () => {
  it("splits a row unless w:cantSplit is set", () => {
    const css = importedRowRules(table([row("a"), row("b", "<w:cantSplit/>"), row("c", '<w:cantSplit w:val="0"/>')])).join("\n");
    assert.match(css, /"a"\]\[data-txt-node-id\]\{break-inside:auto !important\}/);
    assert.match(css, /"b"\]\[data-txt-node-id\]\{break-inside:avoid !important\}/);
    assert.match(css, /"c"\]\[data-txt-node-id\]\{break-inside:auto !important\}/);
  });
  it("reaches the document CSS, nested tables included", () => {
    const inner = table([row("ir", "<w:cantSplit/>")]); inner.id = "inner";
    const outer = table([row("or", "", [{ id: "oc", type: "cell", children: [inner], properties: {} }])]);
    const css = importedContentCss({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes: [outer], properties: { rules: { body: {} } } }] });
    assert.match(css, /"or"\][^{]*\{break-inside:auto !important\}/);
    assert.match(css, /"ir"\][^{]*\{break-inside:avoid !important\}/);
  });
});
