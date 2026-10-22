import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";
import { compileThesisDocument, groupThesisSections } from "../../../../engine/src/engine.js";
import { tableCellBottomExtraMm, thesisPagedCss } from "../../../../engine/src/pageLayout.js";

const groupsOf = (template) => groupThesisSections(compileThesisDocument(template, {}, "Tez", "<p>Metin</p>").sections);
const mainRule = (css, selector) => css.split("\n").find((rule) => rule.includes("data-thesis-flow-section=\"main\"") && rule.includes(selector));

// Measured against real Word (parity.mjs, MCBÜ, last row of a table at the page bottom): the editor kept a row whose text ended inside the
// room Word needs for the row's bottom padding and rule, Word moved it to the next page, and every following row sat one row apart.
describe("table rows and captions at a page bottom", () => {
  it("a table cell keeps room below its text for the row's bottom padding and rule", () => {
    assert.equal(tableCellBottomExtraMm(undefined), 2.3812, "default: 6 pt padding + 1 px rule");
    assert.equal(tableCellBottomExtraMm({ cellPadding: { bottomMm: 0 } }), 0.2646, "no padding, default rule");
    assert.equal(tableCellBottomExtraMm({ borders: { preset: "threeRule" } }), 2.1167, "rule-only presets draw no cell rule");
    assert.equal(tableCellBottomExtraMm({ cellPadding: "1mm 2mm 3mm" }), 3.2646, "shorthand: the third value is the bottom");
    assert.equal(tableCellBottomExtraMm({ cellPadding: "0 1.9mm" }), 0.2646, "shorthand: the first value is top and bottom");
    assert.equal(tableCellBottomExtraMm({ cellPadding: { bottomMm: 1 }, borders: { bottom: { widthPt: 0.5 } } }), 1.1764, "a per-edge rule uses its own width");
  });

  it("the paged stylesheet asks a cell for the leading plus that room, and cancels it in the height", () => {
    const groups = groupsOf(mcbuMaster);
    const lead = groups.find((g) => g.sections.some((s) => s.id === "main")).rules.page.lastLineLeadingMm;
    assert.ok(lead > 0, "MCBÜ uses the Word last-line fit");
    const rule = mainRule(thesisPagedCss(groups), ":is(td,th)::after");
    assert.ok(rule, "a per-section cell guard exists");
    assert.match(rule, new RegExp(`height:calc\\(${lead}mm \\+ 2\\.3812mm\\)`));
    assert.match(rule, new RegExp(`margin:0 0 calc\\(-1 \\* \\(${lead}mm \\+ 2\\.3812mm\\)\\)`));
  });

  it("without the Word last-line fit no cell guard is added", () => {
    const off = structuredClone(mcbuMaster);
    off.page.lastLineFit = "off";
    assert.equal(mainRule(thesisPagedCss(groupsOf(off)), ":is(td,th)::after"), undefined);
  });

  it("a header row never ends a page, and a caption above its table stays with it", () => {
    const css = thesisPagedCss(groupsOf(mcbuMaster));
    assert.match(css, /:is\(thead,thead>tr\)\{break-after:avoid\}/);
    assert.ok(mainRule(css, "table>caption{break-after:avoid}"), "caption above");
    const below = structuredClone(mcbuMaster);
    below.tables.position = "below";
    assert.equal(mainRule(thesisPagedCss(groupsOf(below)), "table>caption{break-after:avoid}"), undefined, "a caption below its table is not kept with what follows");
  });
});
