import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { importedContentCss, importedTableCss } from "../../../../engine/src/docx/projection.js";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const run = (id, fontSizePt) => ({ id, type: "run", children: [{ type: "text", text: "0.899" }], properties: { resolvedSource: { fontSizePt, fontFamily: "Times New Roman" }, direct: {} } });
const para = (id, children, markSize) => ({ id, type: "paragraph", children, properties: { resolvedSource: { spaceBeforePt: 6, spaceAfterPt: 6, lineSpacing: { rule: "auto", value: 1.5 } }, direct: {}, ...(markSize ? { paragraphMarkRun: { fontSizePt: markSize } } : {}) } });
const cell = (id, gridColumn, gridSpan, paras, tcPr = "") => ({ id, type: "cell", children: paras, properties: { gridColumn, gridSpan, cellPropertiesXml: `<w:tcPr ${W}>${tcPr}</w:tcPr>` } });
const table = (tblPr, rows) => ({ id: "t1", type: "table", properties: { gridWidthsMm: [20.108, 20.108, 30], tablePropertiesXml: `<w:tblPr ${W}>${tblPr}</w:tblPr>` }, children: [{ type: "tableBody", children: rows.map((cells, i) => ({ id: `r${i}`, type: "row", children: cells })) }] });
const doc = (nodes) => ({ source: { format: "docx" }, formatMode: "source", sections: [{ nodes, properties: { rules: { body: { fontFamily: "Times New Roman", fontSizePt: 12 } } } }] });

describe("imported Word table geometry", () => {
  it("guards each paragraph of a short multi-paragraph cell at a physical page end", () => {
    const paragraphs = [para("empty1", [], 10), para("empty2", [], 10), para("year", [run("year-run", 10)], 10)];
    const css = importedContentCss(doc([table("", [[cell("a", 0, 1, paragraphs)]])]));
    for (const id of ["empty1", "empty2", "year"]) assert.match(css, new RegExp(`p\\[data-txt-node-id="${id}"\\][^\\n]*::after\\{content:"";display:block;height:calc\\(var\\(--thesis-col-lead,0mm\\) \\+ 6pt\\)`));
    const single = importedContentCss(doc([table("", [[cell("only", 0, 1, [para("single", [run("r", 10)], 10)])]])]));
    assert.doesNotMatch(single, /p\[data-txt-node-id="single"\][^\n]*::after/);
  });
  it("keeps exact row borders inside the declared height and adds only bottom cell padding",()=>{
    const t=table('<w:tblBorders><w:insideH w:val="single" w:sz="4"/></w:tblBorders>',[[cell('a',0,1,[],'<w:tcBorders><w:bottom w:val="single" w:sz="4"/></w:tcBorders>')],[cell('b',0,1,[],'<w:tcBorders><w:top w:val="nil"/><w:bottom w:val="single" w:sz="4"/></w:tcBorders><w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/></w:tcMar>')]]);
    t.children[0].children.forEach(r=>r.properties={rowPropertiesXml:'<w:trPr><w:trHeight w:val="800" w:hRule="exact"/></w:trPr>'});
    const css=importedTableCss(t).join('\n');
    assert.match(css,/"a"\][^{]*\{[^}]*;height:14\.111mm;box-sizing:border-box;overflow:hidden/);
    assert.match(css,/"b"\][^>]*>txt-table-cell-content\{[^}]*height:10\.319mm/);
    assert.match(css,/"b"\][^{]*\{[^}]*;height:17\.639mm;box-sizing:border-box;overflow:hidden/);
    assert.doesNotMatch(css,/--thesis-source-row-min/);
  });
  it("fits the physical minimum of the tallest padded cell before starting a row", () => {
    const t=table('<w:tblBorders><w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/></w:tblBorders>',[[
      cell('padded',0,1,[],'<w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/></w:tcMar>'),
      cell('plain',1,1,[]),
    ]]);
    t.children[0].children[0].properties={rowPropertiesXml:'<w:trPr><w:trHeight w:val="800"/></w:trPr>'};
    const css=importedTableCss(t).join('\n');
    // 40 pt content + 20 pt cell margins + 0.5 pt border = 60.5 pt.
    assert.match(css,/"r0"\]\[data-txt-node-id\]\{--thesis-source-row-min:21\.343mm\}/);
    assert.equal((css.match(/--thesis-source-row-min:/g)||[]).length,1);
    assert.match(css,/"t1"\]\[data-txt-node-id\]:has\(\[data-txt-node-id="r0"\]\[data-thesis-row-min-break\]\)\{break-before:column !important\}/);
  });
  it("lays the table on its w:tblGrid with w:tblCellMar margins (default 0 / 108 twips)", () => {
    const t = table('<w:tblW w:w="7980" w:type="dxa"/><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar>',
      [[cell("a", 0, 2, [para("p", [run("r", 10)])]), cell("b", 2, 1, [para("q", [run("s", 10)])], '<w:tcMar><w:top w:w="57" w:type="dxa"/></w:tcMar>')]]);
    const css = importedTableCss(t).join("\n");
    assert.match(css, /"t1"\]\[data-txt-node-id\]\{width:70\.216mm !important\}/);
    // A Word "double" border is two sz/8 lines around a gap of the same width (measured sz 6: 0.7+0.7+0.7 pt), so sz 12 occupies 4.5 pt.
    assert.match(css, /"a"\]\[data-txt-node-id\]\{padding:0mm 1\.235mm 0mm 1\.235mm !important;width:40\.216mm;box-sizing:border-box[;}]/);
    assert.match(css, /"b"\]\[data-txt-node-id\]\{padding:1\.005mm 1\.235mm 0mm 1\.235mm !important;width:30mm/);
    const plain = importedTableCss(table("", [[cell("c", 0, 1, [])]])).join("\n");
    assert.match(plain, /"c"\]\[data-txt-node-id\]\{padding:0mm 1\.905mm 0mm 1\.905mm !important/);
  });
  it("draws only the borders Word defines: tcBorders over tblBorders, none by default", () => {
    const b = (v, sz = 8) => `w:val="${v}" w:sz="${sz}" w:color="FF0000"`;
    const t = table(`<w:tblBorders><w:top ${b("single")}/><w:left ${b("single")}/><w:bottom ${b("single")}/><w:right ${b("single")}/><w:insideH ${b("single", 4)}/></w:tblBorders>`, [
      [cell("a", 0, 1, [], `<w:tcBorders><w:right w:val="nil"/><w:bottom ${b("double", 12)}/></w:tcBorders>`), cell("b", 1, 2, [])], [cell("c", 0, 1, []), cell("d", 1, 1, []), cell("e", 2, 1, [])]]);
    const css = importedTableCss(t).join("\n");
    assert.match(css, /"a"\][^{]*\{[^}]*border-top:1pt solid #FF0000 !important;border-right:0 none !important;border-bottom:4\.5pt double #FF0000 !important;border-left:1pt solid #FF0000 !important/);
    assert.match(css, /"d"\][^{]*\{[^}]*border-top:0\.5pt solid #FF0000 !important;border-right:0 none !important;border-bottom:1pt solid/);
    const plain = importedTableCss(table("", [[cell("p", 0, 1, [])]])).join("\n");
    assert.match(plain, /border-top:0 none !important;border-right:0 none !important;border-bottom:0 none !important;border-left:0 none !important/);
    const styled = importedTableCss({ ...table("", [[cell("s", 0, 1, [])]]), properties: { ...table("", []).properties, styleId: "G" } }, { G: { ooxml: `<w:style><w:tblPr><w:tblBorders><w:top ${b("single", 4)}/></w:tblBorders></w:tblPr></w:style>` } }).join("\n");
    assert.match(styled, /border-top:0\.5pt solid #FF0000 !important;border-right:0 none/);
  });
  it("turns w:trHeight into a minimum cell height (content + margins + borders) and honours hideMark on empty cells", () => {
    const t = table('<w:tblCellMar><w:top w:w="57" w:type="dxa"/></w:tblCellMar>', [[cell("h", 0, 1, [para("p", [])], "<w:hideMark/>")]]);
    t.children[0].children[0].properties = { rowPropertiesXml: `<w:trPr ${W}><w:trHeight w:val="330" w:hRule="exact"/></w:trPr>` };
    const css = importedTableCss(t).join("\n");
    assert.match(css, /"h"\][^{]*\{[^}]*;height:(\d+\.\d+)mm;box-sizing:border-box;overflow:hidden;/);
    assert.match(css, /"p"\]\[data-txt-node-id\]\{display:none !important\}/);
    const text = importedTableCss(table("", [[cell("k", 0, 1, [para("q", [run("r", 10)])], "<w:hideMark/>")]])).join("\n");
    assert.ok(!/display:none/.test(text));
  });
  it("honours percent width, fixed layout and centring", () => {
    const css = importedTableCss(table('<w:tblW w:w="2500" w:type="pct"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/>', [])).join("\n");
    assert.match(css, /\{width:50% !important;table-layout:fixed;margin-left:auto;margin-right:auto\}/);
  });
  it("aligns each imported cell's content vertically as Word specifies", () => {
    const css = importedTableCss(table("", [[cell("a", 0, 1, [], '<w:vAlign w:val="bottom"/>'), cell("b", 1, 1, [], '<w:vAlign w:val="center"/>')]])).join("\n");
    assert.match(css, /"a"\][^{]*\{[^}]*vertical-align:bottom;/);
    assert.match(css, /"b"\][^{]*\{[^}]*vertical-align:middle;/);
  });
  it("sizes a cell paragraph's strut and auto line from its paragraph mark, not the 12 pt body", () => {
    const css = importedContentCss(doc([table("", [[cell("a", 0, 1, [para("p", [run("r", 9)], 9)])]])]));
    // 9 pt Times New Roman at 1.5 lines = 15.5 pt (not 20.7 pt from the 12 pt body), and the strut font is 9 pt.
    assert.match(css, /"p"\]\[data-txt-node-id\]\{[^}]*line-height:15\.5\d*pt[^}]*;font-size:9pt\}/);
    // Body paragraphs outside tables keep the body size.
    const body = importedContentCss(doc([para("x", [run("y", 9)], 9)]));
    assert.match(body, /"x"\]\[data-txt-node-id\]\{[^}]*line-height:20\.\d+pt/);
    assert.ok(!/"x"\]\[data-txt-node-id\]\{[^}]*font-size/.test(body));
  });
  it("sizes the outside list marker strut from its cell paragraph's single spacing", () => {
    const p = para("lp", [run("lr", 10)], 10);
    p.properties.resolvedSource.lineSpacing = { rule: "auto", value: 1 };
    const item = { id: "li", type: "listItem", children: [p] };
    const list = { id: "list", type: "list", children: [item] };
    const css = importedContentCss(doc([table("", [[cell("a", 0, 1, [list])]])]));
    assert.match(css, /"li"\]\[data-txt-node-id\]\{line-height:11\.\d+pt;font-size:10pt\}/);
  });
});

describe("imported Word cell shading", () => {
  it("paints a solid w:shd fill behind the cell and ignores auto/nil or patterned shading", () => {
    const t = table("", [[cell("a", 0, 1, [], '<w:shd w:val="clear" w:color="auto" w:fill="BDD6EE" w:themeFill="accent1" w:themeFillTint="66"/>'), cell("b", 1, 1, [], '<w:shd w:val="clear" w:color="auto" w:fill="auto"/>'), cell("c", 2, 1, [], '<w:shd w:val="pct25" w:color="000000" w:fill="FFFF00"/>')]]);
    const css = importedTableCss(t).join("\n");
    assert.match(css, /"a"\]\[data-txt-node-id\]\{[^}]*background-color:#BDD6EE/);
    assert.doesNotMatch(css, /"b"\]\[data-txt-node-id\]\{[^}]*background-color/);
    assert.doesNotMatch(css, /"c"\]\[data-txt-node-id\]\{[^}]*background-color/);
  });
});

describe("table style conditional borders", () => {
  const b = (v, sz) => `w:val="${v}" w:sz="${sz}" w:color="auto"`;
  const style = { T: { ooxml: `<w:style><w:tblPr><w:tblBorders><w:top ${b("single", 18)}/></w:tblBorders></w:tblPr><w:tblStylePr w:type="lastRow"><w:tcPr><w:tcBorders><w:top ${b("double", 6)}/><w:bottom ${b("single", 18)}/></w:tcBorders></w:tcPr></w:tblStylePr></w:style>` } };
  const make = (look) => ({ ...table(`<w:tblBorders><w:bottom ${b("single", 4)}/></w:tblBorders>${look}`, [[cell("h", 0, 1, [])], [cell("l", 0, 1, [])]]), properties: { ...table("", []).properties, styleId: "T", tablePropertiesXml: `<w:tblPr ${W}><w:tblBorders><w:bottom ${b("single", 4)}/></w:tblBorders>${look}</w:tblPr>` } });
  it("lets the last row's style rule override the table's own bottom border when tblLook enables it", () => {
    const css = importedTableCss(make('<w:tblLook w:val="0460" w:firstRow="1" w:lastRow="1" w:firstColumn="0" w:lastColumn="0"/>'), style).join("\n");
    assert.match(css, /"l"\]\[data-txt-node-id\]\{[^}]*border-top:2\.25pt double[^;]*;[^}]*border-bottom:2\.25pt solid/);
    assert.match(css, /"h"\]\[data-txt-node-id\]\{[^}]*border-top:2\.25pt solid[^}]*border-bottom:0 none/);
  });
  it("ignores conditional rules the table does not switch on", () => {
    const css = importedTableCss(make('<w:tblLook w:val="0420" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0"/>'), style).join("\n");
    assert.match(css, /"l"\]\[data-txt-node-id\]\{[^}]*border-bottom:0\.5pt solid/);
  });
});
