import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { akuSagbilMaster } from "../../../../engine/src/templates/aku-sagbil.js";
import { createThesisDocument } from "../../../../engine/src/document.js";
import { buildThesisCss, compileThesisDocument } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { resolveSpecialPage, specialPageBoxCss, specialPageCss, specialPageElasticCss, specialPageGroupDissolves, specialPageSpacerMinMm } from "../../../../engine/src/specialPages.js";

describe("elastic special-page spacers", () => {
  it("spacers shrink (never grow) down to minHeightMm, default 35%", () => {
    const { blocks } = resolveSpecialPage([{ type: "spacer", heightMm: 20 }, { type: "spacer", heightMm: 20, minHeightMm: 0 }, { type: "spacer", heightMm: 20, minHeightMm: 8 }]);
    assert.deepEqual(blocks.map((node) => specialPageSpacerMinMm(node)), [7, 0, 8]);
    assert.match(specialPageBoxCss(blocks[0], null), /flex:0 1 20mm;min-height:7mm;/);
    assert.match(specialPageBoxCss(blocks[1], null), /min-height:0mm;/);
    assert.doesNotMatch(specialPageBoxCss(blocks[0], { type: "group", direction: "column" }), /flex:0 1 20mm/);
  });
  it("column flow gets exactly the content-box height; other blocks keep their size", () => {
    const rules = specialPageElasticCss(".x", [{}], 247);
    assert.equal(rules[0], ".x>.thesis-body{display:flex;flex-direction:column;height:247mm;}");
    assert.match(rules[1], /:not\(\.thesis-layout-spacer\)\{flex:none;\}/);
    assert.deepEqual(specialPageElasticCss(".x", [], 247), []);
    assert.ok(rules.some((rule) => rule.includes("display:contents")));
  });
  it("is emitted for standalone static special pages only", () => {
    const doc = compileThesisDocument(akuSagbilMaster, createThesisDocument(akuSagbilMaster, {}), "T", "");
    const css = buildThesisCss(doc);
    assert.ok(css.includes(">.thesis-body{display:flex;flex-direction:column;height:"));
  });
  it("DOCX writes the measured (shrunk) spacer height, never above nominal", async () => {
    const doc = compileThesisDocument(akuSagbilMaster, createThesisDocument(akuSagbilMaster, {}), "T", "");
    const cover = doc.sections.find((section) => section.layoutBlocks && section.standalone);
    const spacer = cover.layout.find((node) => node.type === "spacer");
    assert.ok(spacer, "cover has a top-level spacer");
    const read = async (elasticSpacers) => {
      const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(doc, { elasticSpacers })).arrayBuffer()))["word/document.xml"]);
      return xml;
    };
    const lines = (xml) => (xml.match(/w:line="(\d+)" w:lineRule="exact"/g) || []);
    const nominal = lines(await read({}));
    const shrunk = lines(await read({ [`${cover.id}:${spacer.path}`]: spacer.heightMm / 2 }));
    const grown = lines(await read({ [`${cover.id}:${spacer.path}`]: spacer.heightMm * 3 }));
    assert.notDeepEqual(shrunk, nominal);
    assert.deepEqual(grown, nominal);
  });
});

describe("elastic special pages: overflow and floating frame rules", () => {
  it("the page flow has a definite height, never clips, and content overflows visibly", () => {
    const rules = specialPageElasticCss(".x", [{}], 63).join("");
    assert.ok(rules.includes("height:63mm"));
    assert.doesNotMatch(rules, /overflow\s*:\s*(hidden|clip|auto|scroll)/);
  });
  it("dissolves only pure wrapper column groups and makes top margins of text elastic", () => {
    const { blocks } = resolveSpecialPage([
      { type: "group", blocks: [{ type: "spacer", heightMm: 10 }, { type: "text", value: "x", marginTopMm: 12 }] },
      { type: "group", gapMm: 2, blocks: [{ type: "spacer", heightMm: 10 }] },
      { type: "group", direction: "row", blocks: [] },
    ]);
    assert.equal(specialPageGroupDissolves(blocks[0]), true);
    assert.equal(specialPageGroupDissolves(blocks[1]), false);
    assert.equal(specialPageGroupDissolves(blocks[2]), false);
    const css = specialPageCss(".s", blocks, () => "").join("\n");
    assert.match(css, /\[data-thesis-block="0"\]\{[^}]*display:contents/);
    assert.match(css, /\[data-thesis-block="0-1~m"\]\{display:block;height:12mm;flex:0 1 12mm;min-height:4\.2mm;\}/);
    assert.doesNotMatch(css, /\[data-thesis-block="1-0"\]\{[^}]*flex:0 1/);
  });
  it("Word floating outer-cover table moves up by the measured excess and stays put when it fits", async () => {
    const { default: sbe } = await import("../../../../engine/src/templates/aku-sbe.js").catch(() => ({}));
    const template = sbe || (await import("../../../../engine/src/templates/aku-sbe.js")).akuSbeMaster;
    const doc = compileThesisDocument(template, createThesisDocument(template, {}), "T", "");
    const cover = doc.sections.find((section) => section.page?.docxContentFrame || section.rules.page.docxContentFrame);
    assert.ok(cover, "template has a floating frame section");
    const y = async (mm) => {
      const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(doc, { elasticContentMm: mm === null ? {} : { [cover.id]: mm } })).arrayBuffer()))["word/document.xml"]);
      return (xml.match(/w:tblpY="(\d+)"/g) || []).join(",");
    };
    const nominal = await y(null);
    assert.equal(await y(5), nominal);
    assert.notEqual(await y(200), nominal);
  });
});
