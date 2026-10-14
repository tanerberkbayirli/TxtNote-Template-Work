import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { importThesisDocx } from "../thesis/importDocx.js";
import { contentNodesToHtml } from "../thesis/contentModel.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { docxImportFixture } from "./fixtures/docxImportFixture.js";
import generic from "../thesis/templates/generic.js";

const C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const drawing = `<w:drawing><wp:inline><wp:extent cx="5080000" cy="3175000"/><a:graphic><a:graphicData uri="${C}"><c:chart xmlns:c="${C}" r:id="rChart"/></a:graphicData></a:graphic></wp:inline></w:drawing>`;
const chart = (kind = "barChart") => `<c:chartSpace xmlns:c="${C}"><c:chart><c:plotArea><c:${kind}><c:ser><c:tx><c:v>Katılımcı</c:v></c:tx><c:cat><c:strLit><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt></c:strLit></c:cat><c:val><c:numLit><c:pt idx="0"><c:v>12</c:v></c:pt><c:pt idx="1"><c:v>23</c:v></c:pt></c:numLit></c:val></c:ser></c:${kind}></c:plotArea></c:chart></c:chartSpace>`;
const fixture = ({ kind, external = false } = {}) => docxImportFixture({ body: `<w:p><w:r><w:t>Kaynak</w:t></w:r>${drawing}${drawing}</w:p>`, relationships: `<Relationship Id="rChart" Type="${R}/chart" Target="charts/chart1.xml"/>`, parts: {
  "word/charts/chart1.xml": chart(kind),
  "word/charts/_rels/chart1.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rData" Type="${R}/package" Target="${external ? "https://invalid.example/data.xlsx" : "../embeddings/data.xlsx"}"${external ? ' TargetMode="External"' : ""}/></Relationships>`,
  "word/embeddings/data.xlsx": new Uint8Array([1, 2, 3, 4]),
  "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/><Override PartName="/word/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>',
} });
const exported = async (input) => {
  const document = await importThesisDocx(input);
  const html = contentNodesToHtml(document.sections[0].nodes, { stampIds: false }).replace("Kaynak", "Düzenlendi");
  const blob = await buildThesisDocx(compileThesisDocument(generic, { document }, "T", html), {});
  return { document, html, files: unzipSync(new Uint8Array(await blob.arrayBuffer())) };
};

describe("native drawings remain editable Word objects with relationship dependencies", () => {
  it("gives repeated VML names distinct story IDs and keeps editable shapes without obsolete gfxdata", async () => {
    const pict = '<w:pict xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><v:shapetype id="sourceType"/><v:shape id="sameShape" type="#sourceType" o:gfxdata="opaque-cache" style="width:20pt;height:10pt"><v:textbox><w:txbxContent><w:p><w:r><w:t>Şekil metni</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape></w:pict>';
    const input = docxImportFixture({ body: `<w:p><w:r><w:t>Kaynak</w:t></w:r><w:r>${pict}</w:r><w:r>${pict}</w:r></w:p>` });
    const { document, files } = await exported(input);
    const xml = strFromU8(files["word/document.xml"]);
    const ids = [...xml.matchAll(/<v:(?:shape|shapetype)\b[^>]* id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(ids.length, 3); assert.equal(new Set(ids).size, 3);
    assert.equal((xml.match(/type="#txnVMLType1"/g) || []).length, 2);
    assert.equal((xml.match(/Şekil metni/g) || []).length, 2); assert.doesNotMatch(xml, /gfxdata/);
    const original = unzipSync(Uint8Array.from(atob(document.source.packageBase64), (c) => c.charCodeAt(0)));
    assert.match(strFromU8(original["word/document.xml"]), /gfxdata="opaque-cache"/);
  });
  it("renders cached chart data and retains chart/workbook parts for two copies without overwriting edits", async () => {
    const { html, files } = await exported(fixture());
    assert.match(html, /<svg/); assert.match(html, />Katılımcı<|>Katılımcı<\/text>/);
    const xml = strFromU8(files["word/document.xml"]), rels = strFromU8(files["word/_rels/document.xml.rels"]);
    assert.equal((xml.match(/<c:chart /g) || []).length, 2);
    assert.match(xml, /Düzenlendi/); assert.doesNotMatch(xml, />Kaynak</);
    assert.match(xml, /<w:r><w:drawing[ >]/);
    assert.match(xml, /r:id="txnDrawing1_1"/); assert.match(xml, /r:id="txnDrawing2_1"/);
    assert.match(rels, /txnNative\/source\/word\/charts\/chart1.xml/);
    assert.deepEqual([...files["word/txnNative/source/word/embeddings/data.xlsx"]], [1, 2, 3, 4]);
    assert.equal(Object.keys(files).filter((n) => /txnNative.*chart1.xml$/.test(n)).length, 1);
    assert.match(strFromU8(files["[Content_Types].xml"]), /PartName="\/word\/txnNative\/source\/word\/charts\/chart1.xml" ContentType="application\/vnd.openxmlformats-officedocument.drawingml.chart\+xml"/);
  });
  it("renders horizontal cached bars with full category labels and keeps the editable chart on export", async () => {
    const {zipSync,strToU8}=await import("fflate");
    const input=unzipSync(fixture());
    const source=chart().replace('<c:barChart>','<c:barChart><c:barDir val="bar"/><c:grouping val="clustered"/><c:dLbls><c:showVal val="1"/></c:dLbls>').replace('<c:v>A</c:v>','<c:v>Uzun kategori &amp; güvenli metin</c:v>').replace('<c:v>12</c:v>','<c:v>-12</c:v>');
    input['word/charts/chart1.xml']=strToU8(source);
    const {document,html,files}=await exported(zipSync(input));
    assert.match(html,/<svg/);assert.doesNotMatch(html,/yerleşim önizlemesi desteklenmiyor/);
    assert.match(html,/Uzun kategori &amp; güvenli metin/);assert.match(html,/>-12<\/text>/);assert.match(html,/>23<\/text>/);
    assert.doesNotMatch(html,/width="-|NaN|Infinity/);
    assert.ok(!document.source.unsupported.some(i=>i.code==='chart-preview'&&i.message.includes('desteklenmiyor')));
    const original=strFromU8(files['word/txnNative/source/word/charts/chart1.xml']);
    assert.match(original,/<c:barDir val="bar"/);assert.match(original,/<c:v>-12<\/c:v>/);assert.match(original,/Uzun kategori &amp; güvenli metin/);
  });
  it("does not misrepresent stacked horizontal bars as clustered bars", async () => {
    const {zipSync,strToU8}=await import("fflate");
    const input=unzipSync(fixture());
    input['word/charts/chart1.xml']=strToU8(chart().replace('<c:barChart>','<c:barChart><c:barDir val="bar"/><c:grouping val="stacked"/>'));
    const {html}=await exported(zipSync(input));
    assert.match(html,/yerleşim önizlemesi desteklenmiyor/);assert.match(html,/Katılımcı · A · B · 12 · 23/);
  });
  it("keeps a chart title, zero value labels and rotated category text visible in the preview", async () => {
    const {zipSync,strToU8}=await import("fflate");
    const input=unzipSync(fixture());
    const source=chart().replace('<c:chart>','<c:chart><c:title><c:tx><c:rich xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r><a:t>Kaynak başlığı</a:t></a:r></a:p></c:rich></c:tx></c:title>').replace('<c:barChart>','<c:barChart><c:dLbls><c:showVal val="1"/></c:dLbls>').replace('<c:v>12</c:v>','<c:v>0</c:v>').replace('</c:plotArea>','<c:catAx><c:txPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:bodyPr rot="-5400000"/></c:txPr></c:catAx></c:plotArea>');
    input['word/charts/chart1.xml']=strToU8(source);
    const {html}=await exported(zipSync(input));
    assert.match(html,/>Kaynak başlığı<\/text>/);assert.match(html,/>0<\/text>/);assert.match(html,/>23<\/text>/);
    assert.match(html,/transform="rotate\(-90/);assert.doesNotMatch(html,/NaN|Infinity/);
  });
  it("resolves a VML type declared in a different imported run", async () => {
    const v = 'xmlns:v="urn:schemas-microsoft-com:vml"';
    const input = docxImportFixture({ body: `<w:p><w:r><w:t>Kaynak</w:t></w:r><w:r><w:pict ${v}><v:shapetype id="shared"/><v:shape id="first" type="#shared" style="width:10pt;height:10pt"/></w:pict></w:r></w:p><w:p><w:r><w:pict ${v}><v:shape id="second" type="#shared" style="width:10pt;height:10pt"/></w:pict></w:r></w:p>` });
    const { files } = await exported(input);
    const xml = strFromU8(files["word/document.xml"]);
    assert.equal((xml.match(/<v:shapetype\b/g) || []).length, 1);
    assert.equal((xml.match(/type="#txnVMLType1"/g) || []).length, 2);
    assert.match(xml, /id="txnVMLType1"/);
  });
  it("makes unsupported chart layouts explicit while keeping cached data visible", async () => {
    const { document, html } = await exported(fixture({ kind: "radarChart" }));
    assert.match(html, /yerleşim önizlemesi desteklenmiyor/); assert.match(html, /Katılımcı · A · B · 12 · 23/);
    assert.ok(document.source.unsupported.some((i) => i.code === "chart-preview" && i.message.includes("desteklenmiyor")));
  });
  it("rejects external dependencies instead of turning them into Word network links", async () => {
    await assert.rejects(() => exported(fixture({ external: true })), /dış ilişki desteklenmiyor/);
  });
  it("normalizes source chart child order and extension slots while preserving every payload and URI", async () => {
    const input = unzipSync(fixture());
    const { strToU8, zipSync } = await import("fflate");
    const extension = '<c:extLst><c:ext uri="source-extensions" xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"><c15:showLeaderLines val="1"/><c15:leaderLines><c:spPr data-proof="kept"/></c15:leaderLines><c15:customPayload key="third">Özgün içerik</c15:customPayload></c:ext></c:extLst><c:showDLblsOverMax val="0"/>';
    input["word/charts/chart1.xml"] = strToU8(chart().replace("</c:chart>", `${extension}</c:chart>`));
    const { files } = await exported(zipSync(input));
    const output = strFromU8(files["word/txnNative/source/word/charts/chart1.xml"]);
    assert.equal((output.match(/uri="source-extensions"/g) || []).length, 3);
    assert.equal((output.match(/<c15:showLeaderLines val="1"\/>/g) || []).length, 1);
    assert.equal((output.match(/<c15:leaderLines>/g) || []).length, 1);
    assert.equal((output.match(/<c:spPr data-proof="kept"\/>/g) || []).length, 1);
    assert.equal((output.match(/<c15:customPayload key="third">Özgün içerik<\/c15:customPayload>/g) || []).length, 1);
    assert.ok(output.indexOf("showDLblsOverMax") < output.indexOf("<c:extLst>"));
    assert.ok(output.indexOf("showLeaderLines") < output.indexOf("<c15:leaderLines>") && output.indexOf("<c15:leaderLines>") < output.indexOf("customPayload"));
    assert.doesNotMatch(output, /Ignorable/);
  });
  it("emits ChartEx only inside mc:AlternateContent Requires=cx1 and drops the source-machine workbook link", async () => {
    const CX = "http://schemas.microsoft.com/office/drawing/2014/chartex", CX1 = "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex", MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
    const inline = `<w:drawing><wp:inline><wp:extent cx="5080000" cy="3175000"/><a:graphic><a:graphicData uri="${CX}"><cx:chart xmlns:cx="${CX}" r:id="rEx"/></a:graphicData></a:graphic></wp:inline></w:drawing>`;
    const parts = {
      "word/charts/chartEx1.xml": `<cx:chartSpace xmlns:cx="${CX}" xmlns:r="${R}"><cx:chartData><cx:externalData r:id="rLink" cx:autoUpdate="0"/><cx:data id="0"><cx:strDim type="cat"><cx:lvl ptCount="1"><cx:pt idx="0">A</cx:pt></cx:lvl></cx:strDim><cx:numDim type="val"><cx:lvl ptCount="1"><cx:pt idx="0">3</cx:pt></cx:lvl></cx:numDim></cx:data></cx:chartData><cx:chart/></cx:chartSpace>`,
      "word/charts/_rels/chartEx1.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rLink" Type="${R}/oleObject" Target="file:///C:/x/book.xlsx" TargetMode="External"/></Relationships>`,
      "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/charts/chartEx1.xml" ContentType="application/vnd.ms-office.chartex+xml"/></Types>',
    };
    const relationships = '<Relationship Id="rEx" Type="http://schemas.microsoft.com/office/2014/relationships/chartEx" Target="charts/chartEx1.xml"/>';
    // Bare Choice drawing (what the importer keeps) and the original wrapped form must both export wrapped exactly once.
    for (const body of [`<w:p><w:r><w:t>Kaynak</w:t></w:r><w:r>${inline}</w:r></w:p>`, `<w:p><w:r><w:t>Kaynak</w:t></w:r><w:r><mc:AlternateContent xmlns:mc="${MC}" xmlns:cx1="${CX1}"><mc:Choice Requires="cx1">${inline}</mc:Choice><mc:Fallback><w:r><w:t>yedek</w:t></w:r></mc:Fallback></mc:AlternateContent></w:r></w:p>`]) {
      const { files } = await exported(docxImportFixture({ body, relationships, parts }));
      const xml = strFromU8(files["word/document.xml"]);
      assert.equal((xml.match(/uri="[^"]*drawing\/2014\/chartex"/g) || []).length, 1);
      const wrapped = xml.match(/<mc:AlternateContent[^>]*>\s*<mc:Choice Requires="cx1">\s*<w:drawing[\s\S]*?<\/w:drawing>\s*<\/mc:Choice>/);
      assert.ok(wrapped, "ChartEx drawing must sit in mc:Choice Requires=cx1");
      assert.match(wrapped[0], new RegExp(`xmlns:cx1="${CX1.replace(/\./g, "\.")}"`)); assert.match(wrapped[0], /xmlns:mc=/);
      assert.equal((xml.match(/<mc:AlternateContent/g) || []).length, 1);
      const part = strFromU8(files["word/txnNative/source/word/charts/chartEx1.xml"]);
      assert.doesNotMatch(part, /externalData/); assert.match(part, /<cx:pt idx="0">3<\/cx:pt>/);
      assert.doesNotMatch(strFromU8(files["word/txnNative/source/word/charts/_rels/chartEx1.xml.rels"]), /TargetMode="External"|book\.xlsx/);
    }
  });
  it("does not export the cached Fallback picture of a ChartEx as a second figure", async () => {
    const CX = "http://schemas.microsoft.com/office/drawing/2014/chartex", CX1 = "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex", MC = "http://schemas.openxmlformats.org/markup-compatibility/2006", PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture";
    const choice = `<w:drawing><wp:inline><wp:extent cx="5080000" cy="3175000"/><a:graphic><a:graphicData uri="${CX}"><cx:chart xmlns:cx="${CX}" r:id="rEx"/></a:graphicData></a:graphic></wp:inline></w:drawing>`;
    const fallback = `<w:drawing><wp:inline><wp:extent cx="5080000" cy="3175000"/><a:graphic><a:graphicData uri="${PIC}"><pic:pic xmlns:pic="${PIC}"><pic:blipFill><a:blip r:embed="rImg"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
    const body = `<w:p><w:r><w:t>Kaynak</w:t></w:r><w:r><mc:AlternateContent xmlns:mc="${MC}" xmlns:cx1="${CX1}"><mc:Choice Requires="cx1">${choice}</mc:Choice><mc:Fallback>${fallback}</mc:Fallback></mc:AlternateContent></w:r></w:p>`;
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const parts = {
      "word/charts/chartEx1.xml": `<cx:chartSpace xmlns:cx="${CX}"><cx:chartData><cx:data id="0"><cx:numDim type="val"><cx:lvl ptCount="1"><cx:pt idx="0">3</cx:pt></cx:lvl></cx:numDim></cx:data></cx:chartData><cx:chart/></cx:chartSpace>`,
      "word/media/chart.png": png,
      "[Content_Types].xml": '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/charts/chartEx1.xml" ContentType="application/vnd.ms-office.chartex+xml"/></Types>',
    };
    const relationships = `<Relationship Id="rEx" Type="http://schemas.microsoft.com/office/2014/relationships/chartEx" Target="charts/chartEx1.xml"/><Relationship Id="rImg" Type="${R}/image" Target="media/chart.png"/>`;
    const { files } = await exported(docxImportFixture({ body, relationships, parts }));
    const xml = strFromU8(files["word/document.xml"]);
    assert.equal((xml.match(/uri="[^"]*drawing\/2014\/chartex"/g) || []).length, 1);
    assert.equal((xml.match(/drawingml\/2006\/picture"/g) || []).length, 0, "Fallback picture must not become a separate figure");
  });
});
