import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { floatsOutOfFlow, importedShapeCss, readDrawingShape } from "../thesis/docx/shapes.js";
import { importedContentCss } from "../thesis/docx/projection.js";
import { thesisSourceHtml } from "../thesis/sourceHtml.js";
import { importThesisDocx } from "../thesis/importDocx.js";
import { docxImportFixture } from "./fixtures/docxImportFixture.js";

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:v="urn:schemas-microsoft-com:vml"';
const parse = (xml) => new DOMParser().parseFromString(`<w:r ${NS}>${xml}</w:r>`, "text/xml").documentElement.getElementsByTagName("*")[0];
const textBox = `<w:drawing><wp:anchor behindDoc="0"><wp:positionH relativeFrom="column"><wp:posOffset>3075830</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>217142</wp:posOffset></wp:positionV><wp:extent cx="532130" cy="341630"/><wp:wrapSquare wrapText="bothSides"/><a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:spPr><a:prstGeom prst="ellipse"/><a:solidFill><a:srgbClr val="FFEE00"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></wps:spPr><wps:txbx><w:txbxContent><w:p><w:r><w:t>Paydaş</w:t></w:r></w:p></w:txbxContent></wps:txbx><wps:bodyPr lIns="0" anchor="ctr"/></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing>`;
const chart = `<w:drawing><wp:inline><wp:extent cx="5270500" cy="3175000"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"/></a:graphic></wp:inline></w:drawing>`;

describe("imported Word shapes", () => {
  it("resizes a spAutoFit text frame while retaining its source extent", () => {
    const shape=readDrawingShape(parse(textBox.replace('anchor="ctr"/>','anchor="ctr"><a:spAutoFit/></wps:bodyPr>')));
    assert.equal(shape.autoFit,'shape');assert.equal(shape.heightPt,26.9);
    const doc={source:{format:'docx'},sections:[{nodes:[{id:'fit',type:'drawing',properties:{shape},children:[]}]}]};
    assert.match(importedShapeCss(doc).join('\n'),/height:26\.9pt;height:auto/);
    const fixed=readDrawingShape(parse(textBox));assert.equal(fixed.autoFit,undefined);
  });
  it("selects supported Word 2010 shapes and retains the hidden VML fallback", async () => {
    const body=`<w:p><w:r><mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><mc:Choice Requires="wps">${textBox.replace('<w:drawing>',`<w:drawing ${NS}>`)}</mc:Choice><mc:Fallback><w:pict xmlns:v="urn:schemas-microsoft-com:vml"><v:shape style="width:10pt;height:10pt"/></w:pict></mc:Fallback></mc:AlternateContent></w:r></w:p>`;
    const doc=await importThesisDocx(docxImportFixture({body}));
    const found=[];const visit=n=>{if(n.type==='alternative')found.push(n);(n.children||[]).forEach(visit);};doc.sections.forEach(s=>s.nodes.forEach(visit));
    assert.equal(found[0].children[0].properties.selected,true);
    assert.equal(found[0].children[1].attributes.hidden,"");
    const css=importedShapeCss(doc).join('\n');
    assert.match(css,/border-radius:50%/);
    const drawings=[];const collect=n=>{if(n.type==='drawing')drawings.push(n);(n.children||[]).forEach(collect);};found[0].children[1].children.forEach(collect);
    for(const drawing of drawings)assert.ok(!css.includes(`"${drawing.id}"`),'hidden fallback must not produce a second frame');
  });
  it("honors explicit overflow and suppression of outer text-box paragraph spacing", () => {
    const shape=readDrawingShape(parse(textBox.replace('anchor="ctr"','anchor="ctr" vertOverflow="overflow" spcFirstLastPara="0"')));
    assert.equal(shape.textOverflow,'overflow');assert.equal(shape.spaceFirstLastParagraph,false);
    const doc={source:{format:'docx'},sections:[{nodes:[{id:'box',type:'drawing',properties:{shape},children:[]}]}]};
    const css=importedShapeCss(doc).join('\n');
    assert.match(css,/overflow:visible/);assert.match(css,/:first-child\{margin-top:0!important\}/);assert.match(css,/:last-child\{margin-bottom:0!important\}/);
    shape.textOverflow='clip';assert.match(importedShapeCss(doc).join('\n'),/overflow:hidden/);
  });
  it("reads the frame of a floating DrawingML text box (extent, offsets, wrap, fill, line, insets)", () => {
    const shape = readDrawingShape(parse(textBox));
    assert.equal(shape.kind, "anchor");
    assert.equal(shape.widthPt, 41.9); assert.equal(shape.heightPt, 26.9);
    assert.deepEqual(shape.horizontal, { relativeFrom: "column", offsetPt: 242.19 });
    assert.deepEqual(shape.vertical, { relativeFrom: "paragraph", offsetPt: 17.1 });
    assert.equal(shape.wrap, "square"); assert.equal(shape.fill, "#ffee00"); assert.equal(shape.line, "#000000"); assert.equal(shape.lineWidthPt, 1);
    assert.equal(shape.geometry, "ellipse"); assert.equal(shape.textAnchor, "ctr"); assert.deepEqual(shape.insetPt, [3.6, 7.2, 3.6, 0]);
    assert.equal(floatsOutOfFlow(shape), true);
  });
  it("reads inline charts and VML text boxes", () => {
    assert.deepEqual(readDrawingShape(parse(chart)), { kind: "inline", widthPt: 415, heightPt: 250, graphic: "chart", shapes: 0, hasText: false });
    const vml = readDrawingShape(parse(`<w:pict><v:shape style="position:absolute;margin-left:10pt;margin-top:2pt;width:1in;height:36pt" fillcolor="#FF0000"><v:textbox><w:txbxContent><w:p/></w:txbxContent></v:textbox></v:shape></w:pict>`));
    assert.equal(vml.kind, "anchor"); assert.equal(vml.widthPt, 72); assert.equal(vml.heightPt, 36); assert.equal(vml.horizontal.offsetPt, 10); assert.equal(vml.fill, "#ff0000");
    assert.equal(readDrawingShape(parse(`<w:drawing><wp:inline/></w:drawing>`)), null);
  });
  it("draws floating shapes out of flow, keeps their anchor paragraph one line and reserves inline extents", () => {
    const floating = { id: "d1", type: "drawing", children: [{ id: "bp", type: "paragraph", tag: "span", attributes: { "data-docx-box-block": "" }, children: [{ type: "text", text: "Paydaş" }] }], properties: { shape: readDrawingShape(parse(textBox)) } };
    const inline = { id: "d2", type: "drawing", children: [], properties: { shape: readDrawingShape(parse(chart)) } };
    const doc = { source: { format: "docx" }, formatMode: "source", sections: [{ nodes: [
      { id: "p1", type: "paragraph", children: [{ id: "r1", type: "run", children: [floating], properties: { resolvedSource: { fontSizePt: 12 } } }], properties: { resolvedSource: { lineSpacing: { rule: "auto", value: 1.5 } }, paragraphMarkRun: { fontSizePt: 9 } } },
      { id: "p2", type: "paragraph", children: [{ id: "r2", type: "run", children: [inline] }], properties: {} },
    ], properties: { rules: { body: { fontFamily: "Times New Roman", fontSizePt: 12 } } } }] };
    const css = importedShapeCss(doc).join("\n");
    assert.match(css, /"d1"\]\[data-txt-node-id\]\{position:absolute;display:block;left:242\.19pt;top:17\.1pt;[^}]*background-color:#ffee00;border:1pt solid #000000;border-radius:50%[^}]*width:41\.9pt;height:26\.9pt\}/);
    assert.match(css, /"d1"\]\[data-txt-node-id\] \[data-docx-box-block\]\{display:block\}/);
    // the only run holds the floating shape: the line is sized from the 9 pt paragraph mark (1.5 x 1.15 x 9 pt)
    assert.match(css, /"p1"\]\[data-txt-node-id\]\{position:relative;line-height:15\.5\dpt\}/);
    assert.match(css, /\[data-txt-node-id="p1"\]::before\{content:"\\200b"\}/);
    assert.doesNotMatch(css, /"p2"\]::before/);
    assert.match(css, /"d2"\]\[data-txt-node-id\]\{display:inline-block;[^}]*width:415pt;height:250pt\}/);
    assert.ok(importedContentCss(doc).includes(css.split("\n")[0]), "imported content CSS carries the shape rules");
  });
  it("resolves theme colours of a shape and of its style references", () => {
    const themed = textBox.replace('<a:solidFill><a:srgbClr val="FFEE00"/></a:solidFill><a:ln w="12700"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln>', '<a:solidFill><a:schemeClr val="bg1"/></a:solidFill>')
      .replace("<wps:txbx>", '<wps:style><a:lnRef idx="2"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="1"><a:schemeClr val="accent2"/></a:fillRef></wps:style><wps:txbx>');
    const shape = readDrawingShape(parse(themed), { lt1: "#ffffff", accent1: "#4472c4", accent2: "#ed7d31" });
    assert.equal(shape.fill, "#ffffff"); assert.equal(shape.line, "#4472c4");
    assert.equal(readDrawingShape(parse(themed)).line, "style", "without a theme the style line keeps the default");
  });
  it("keeps a top-and-bottom shape in flow at its paragraph offset with its bottom distance", () => {
    const xml = textBox.replace("<wp:anchor ", '<wp:anchor distT="0" distB="127000" ').replace(/<wp:wrapSquare[^>]*\/>/, "<wp:wrapTopAndBottom/>").replace("217142", "254000");
    const shape = readDrawingShape(parse(xml));
    assert.equal(shape.wrap, "topAndBottom"); assert.deepEqual(shape.distPt, [0, 0, 10, 0]);
    const doc = { source: { format: "docx" }, formatMode: "source", sections: [{ nodes: [{ id: "p1", type: "paragraph", children: [{ id: "d1", type: "drawing", children: [], properties: { shape } }] }] }] };
    const rule = importedShapeCss(doc).find((r) => r.includes('"d1"'));
    assert.match(rule, /display:block;position:relative/); assert.match(rule, /margin-top:20pt/); assert.match(rule, /margin-bottom:10pt/);
    assert.doesNotMatch(rule, /position:absolute/);
  });
  it("is presentation only: the stored HTML does not change", () => {
    const html = '<p data-txt-node-id="p1"><span data-native-object="drawing" data-txt-node-id="d1"><span data-docx-box-block="">Paydaş</span></span></p>';
    assert.equal(thesisSourceHtml(html), html);
    assert.deepEqual(importedShapeCss({ source: { format: "pdf" }, sections: [] }), []);
  });
});
