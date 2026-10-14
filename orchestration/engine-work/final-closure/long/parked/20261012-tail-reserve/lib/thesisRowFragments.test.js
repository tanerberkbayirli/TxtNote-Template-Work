import assert from "node:assert/strict";
import { it } from "node:test";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";
import { importedTableCss } from "../thesis/docx/projection.js";

it("strips measured continuation reserve while retaining authored row style and text", () => {
  assert.equal(thesisSourceHtml('<tr style="color:red; --thesis-source-row-tail: 81.75px; background:blue" data-thesis-row-min-break=""><td>Retained</td></tr>'), '<tr style="color:red; background:blue"><td>Retained</td></tr>');
  assert.equal(thesisSourceHtml('<tr style="--thesis-source-row-tail: 81.75px;"><td>Retained</td></tr>'), '<tr><td>Retained</td></tr>');
});

it("reserves continuation minimum only for minimum-height unmerged source cells", () => {
  const cell = (id, attrs = {}) => ({ id, type: "cell", attributes: attrs, properties: {}, children: [] });
  const row = (id, rule, cells) => ({ id, type: "row", properties: { rowPropertiesXml: `<w:trPr><w:trHeight w:val="2000" w:hRule="${rule}"/></w:trPr>` }, children: cells });
  const table = { id: "table", type: "table", properties: {}, children: [row("a", "atLeast", [cell("plain"), cell("merged", { rowspan: "2" })]), row("b", "exact", [cell("fixed")])] };
  const css = importedTableCss(table).join("\n");
  assert.match(css, /"plain"\][^{]*\{[^}]*var\(--thesis-source-row-tail,0px\)/);
  for (const id of ["merged", "fixed"]) assert.doesNotMatch(css.match(new RegExp(`"${id}"\\][^{]*\\{[^}]*\\}`))?.[0] || "", /var\(--thesis-source-row-tail/);
});
