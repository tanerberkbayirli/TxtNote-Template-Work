import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "@xmldom/xmldom";
import { chartPreview, chartUserShapesPreview } from "./docx/drawingPreview.js";

const C = "http://schemas.openxmlformats.org/drawingml/2006/chart", A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const view = (xml, shape = { widthPt: 388, heightPt: 272 }, theme = { accent1: "#5b9bd5", dk1: "#000000", lt1: "#ffffff" }) =>
  chartPreview(new DOMParser().parseFromString(xml, "text/xml").documentElement, shape, theme);
const walk = (n, tag) => [...(n.tag === tag ? [n] : []), ...(n.children || []).flatMap((c) => walk(c, tag))];
const texts = (v) => walk(v, "text").map((n) => n.children[0]?.text);
const cache = (kind, values, start = 0) => `<c:${kind}><c:ptCount val="${values.length + start}"/>${values.map((v, i) => `<c:pt idx="${i + start}"><c:v>${v}</c:v></c:pt>`).join("")}</c:${kind}>`;
it('places chart connector overlays by relative anchors, including zero-width lines',()=>{
 const xml='<c:userShapes xmlns:c="'+C+'" xmlns:cdr="http://schemas.openxmlformats.org/drawingml/2006/chartDrawing" xmlns:a="'+A+'"><cdr:relSizeAnchor><cdr:from><cdr:x>0.1</cdr:x><cdr:y>0.2</cdr:y></cdr:from><cdr:to><cdr:x>0.1</cdr:x><cdr:y>0.9</cdr:y></cdr:to><cdr:cxnSp><cdr:spPr><a:ln w="15875"><a:solidFill><a:srgbClr val="FFC000"/></a:solidFill></a:ln></cdr:spPr></cdr:cxnSp></cdr:relSizeAnchor></c:userShapes>';
 const root=new DOMParser().parseFromString(xml,'text/xml').documentElement;
 const [line]=chartUserShapesPreview(root,{widthPt:400,heightPt:200});
 assert.deepEqual(line.attributes,{x1:'40',y1:'40',x2:'40',y2:'180',stroke:'#ffc000','stroke-width':'1.25',fill:'none'});
 root.getElementsByTagName('cdr:x')[0].textContent='NaN';assert.deepEqual(chartUserShapesPreview(root,{widthPt:400,heightPt:200}),[]);
});
const bar = ({ dir = "col", cats = ["a", "b"], vals = [5, 51], start = 0, gap = 219, deleted = true, fill = '<a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>' } = {}) =>
  `<c:chartSpace xmlns:c="${C}" xmlns:a="${A}"><c:chart><c:title><c:tx><c:rich><a:p><a:r><a:t>Title</a:t></a:r></a:p></c:rich></c:tx><c:txPr><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr></a:p></c:txPr></c:title><c:plotArea><c:layout/><c:barChart><c:barDir val="${dir}"/><c:grouping val="clustered"/><c:ser><c:spPr><a:solidFill>${fill}</a:solidFill></c:spPr><c:dLbls><c:showVal val="1"/></c:dLbls><c:cat><c:strRef><c:strCache><c:ptCount val="${cats.length + start}"/>${cats.map((v, i) => `<c:pt idx="${i + start}"><c:v>${v}</c:v></c:pt>`).join("")}</c:strCache></c:strRef></c:cat><c:val><c:numRef>${cache("numCache", vals, start)}</c:numRef></c:val></c:ser><c:gapWidth val="${gap}"/></c:barChart><c:catAx><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/></c:catAx><c:valAx><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="${deleted ? 1 : 0}"/></c:valAx></c:plotArea></c:chart></c:chartSpace>`;

describe("styled cached bar and column charts", () => {
  it("applies lumMod to the series colour, honours gapWidth and keeps a blank leading category slot", () => {
    const v = view(bar({ start: 1, cats: ["x", "y"], vals: [4, 8] })), bars = walk(v, "rect").slice(1);
    assert.equal(bars.length, 2);
    assert.equal(bars[0].attributes.fill, "#2e75b6");
    const widths = bars.map((b) => Number(b.attributes.width)), positions = bars.map((b) => Number(b.attributes.x));
    assert.ok(Math.abs(widths[0] - 374 / 3 / 3.19) < 1, "bar width follows the 219 % gap");
    assert.ok(positions[0] > 7 + 374 / 3, "the empty idx 0 category keeps its slot");
    assert.ok(texts(v).includes("Title"));
  });
  it("draws no value-axis labels when the value axis is deleted and picks Excel's automatic maximum otherwise", () => {
    assert.ok(!texts(view(bar())).includes("60"));
    const shown = texts(view(bar({ deleted: false, vals: [5, 51] })));
    assert.ok(shown.includes("60"), "51 scales to 60");
  });
  it("lists the first category of a horizontal chart at the bottom", () => {
    const v = view(bar({ dir: "bar", cats: ["first", "second"], vals: [1, 2] })), labels = walk(v, "text").filter((n) => ["first", "second"].includes(n.children[0]?.text));
    assert.ok(Number(labels.find((n) => n.children[0].text === "first").attributes.y) > Number(labels.find((n) => n.children[0].text === "second").attributes.y));
  });
  it("labels every second category when the lines would touch", () => {
    const cats = Array.from({ length: 50 }, (_, i) => `c${i}`), v = view(bar({ dir: "bar", cats, vals: cats.map((_, i) => i + 1) }), { widthPt: 388, heightPt: 160 });
    const shown = texts(v).filter((t) => /^c\d+$/.test(t));
    assert.ok(shown.length > 0 && shown.length < 50);
    assert.ok(shown.includes("c0") && !shown.includes("c1"));
  });
});

describe("styled cached pie and scatter charts", () => {
  const pie = `<c:chartSpace xmlns:c="${C}" xmlns:a="${A}"><c:chart><c:plotArea><c:pieChart><c:ser><c:dLbls><c:showCatName val="1"/><c:showPercent val="1"/></c:dLbls><c:cat><c:strRef><c:strCache><c:ptCount val="3"/><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt><c:pt idx="2"><c:v>C</c:v></c:pt></c:strCache></c:strRef></c:cat><c:val><c:numRef>${cache("numCache", [303, 279, 607])}</c:numRef></c:val></c:ser></c:pieChart></c:plotArea></c:chart></c:chartSpace>`;
  it("rounds percent labels by largest remainder so they add up to 100", () => {
    const v = view(pie, { widthPt: 388, heightPt: 300 }), percents = texts(v).filter((t) => /%$/.test(t)).map((t) => parseInt(t, 10));
    assert.equal(percents.length, 3);
    assert.equal(percents.reduce((a, b) => a + b, 0), 100);
    assert.equal(walk(v, "path").length, 3);
  });
  const scatter = `<c:chartSpace xmlns:c="${C}" xmlns:a="${A}"><c:chart><c:plotArea><c:layout/><c:scatterChart><c:ser><c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:marker><c:size val="6"/></c:marker><c:xVal><c:numRef>${cache("numCache", [9.2, 12.02])}</c:numRef></c:xVal><c:yVal><c:numRef>${cache("numCache", [2.1, -0.7])}</c:numRef></c:yVal></c:ser></c:scatterChart><c:valAx><c:scaling><c:orientation val="minMax"/><c:min val="8"/></c:scaling><c:axPos val="b"/><c:majorUnit val="1"/></c:valAx><c:valAx><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/></c:valAx></c:plotArea></c:chart></c:chartSpace>`;
  it("draws unconnected markers on the explicit and automatic scales", () => {
    const v = view(scatter);
    assert.equal(walk(v, "circle").length, 2);
    assert.equal(walk(v, "polyline").length, 0);
    const labels = texts(v);
    assert.ok(labels.includes("13") && labels.includes("2,5") && labels.includes("-1"));
  });
});
