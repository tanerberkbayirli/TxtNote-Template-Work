import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { importedContentCss, largestRunBase, tableChainsWithNext } from "../thesis/docx/projection.js";

const run = (id, fontSizePt) => ({ id, type: "run", children: [{ type: "text", text: "x" }], properties: { resolvedSource: { fontSizePt, fontFamily: "Times New Roman" }, direct: {} } });
const para = (id, children, resolvedSource = {}) => ({ id, type: "paragraph", children, properties: { resolvedSource, direct: {} } });
const table = (rows) => ({ id: "t1", type: "table", children: [{ type: "tableBody", children: rows.map((paras, i) => ({ id: `r${i}`, type: "row", children: [{ id: `c${i}`, type: "cell", children: paras }] })) }], properties: { resolvedSource: {}, direct: {} } });
const doc = (nodes) => ({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes, properties: { rules: { body: { fontFamily: "Times New Roman", fontSizePt: 12 } } } }] });

describe("imported content pagination CSS", () => {
  it("adds formula leading only for tall native math in automatic lines with known math metrics",()=>{
    const equation=(font="Cambria Math")=>({id:"eq",type:"equation",properties:{mathFont:font},children:[{tag:"math",children:[{tag:"mfrac",children:[]}]}]});
    const css=spacing=>importedContentCss(doc([para("p",[equation()],{lineSpacing:spacing})]));
    assert.match(css({rule:"auto",value:1.5}),/data-txt-node-id="eq"\]\[data-txt-node-id\]\{display:inline-block;line-height:0;padding-top:0\.146484375em;padding-bottom:2\.434mm/);
    assert.doesNotMatch(css({rule:"exact",value:18}),/padding-top:0\.146484375em/);
    const custom=importedContentCss(doc([para("p",[equation("Other Math")],{lineSpacing:{rule:"auto",value:1.5}})]));
    assert.doesNotMatch(custom,/padding-top:0\.146484375em/);
    assert.match(custom,/>math\{font-family:"Other Math"\}/);
  });
  it("sizes an auto line from the largest run (16 pt heading in a 1.5-line body)", () => {
    const base = { fontFamily: "Times New Roman", fontSizePt: 12 };
    assert.equal(largestRunBase(para("p", [run("r", 16)]), base, "source").fontSizePt, 16);
    assert.equal(largestRunBase(para("p", [run("r", 10)]), base, "source"), base);
    const css = importedContentCss(doc([para("h", [run("hr", 16)], { lineSpacing: { rule: "auto", value: 1.5 } })]));
    assert.match(css, /data-txt-node-id="h"\]\[data-txt-node-id\]\{line-height:27\.\d+pt/);
  });
  it("lets an imported table split between rows unless its first row keeps with next", () => {
    const plain = table([[para("a", [run("ar", 12)])], [para("b", [run("br", 12)])]]);
    assert.equal(tableChainsWithNext(plain, "source"), false);
    assert.ok(importedContentCss(doc([plain])).includes('[data-txt-node-id="t1"][data-txt-node-id]{break-inside:auto}'));
    const kept = table([[para("a", [run("ar", 12)], { keepWithNext: true })], [para("b", [run("br", 12)])]]);
    assert.equal(tableChainsWithNext(kept, "source"), true);
    assert.ok(!importedContentCss(doc([kept])).includes("break-inside:auto"));
  });
});
