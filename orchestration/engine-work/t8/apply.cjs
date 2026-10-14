const fs=require('fs');const p='C:/Users/CASPER/Desktop/TxtNote-Template-Work/TxtNote/frontend/src/thesis/docx/projection.js';
let s=fs.readFileSync(p,'utf8');
const rep=(a,b)=>{if(s.split(a).length!==2)throw new Error('anchor '+a.slice(0,60));s=s.replace(a,()=>b);};
rep('const mm3 = (value) => `${Math.round(value * 1000) / 1000}mm`;\n', `const mm3 = (value) => \`\${Math.round(value * 1000) / 1000}mm\`;
const PT_MM = 25.4 / 72;
/** Borders of a \`w:tblBorders\` / \`w:tcBorders\` block keyed by side (start/end folded into left/right; insideH / insideV kept). */
function bordersOf(xml, block) {
  const out = {};
  for (const m of (xmlBlock(xml, block)?.[1] || "").matchAll(/<w:(top|left|bottom|right|start|end|insideH|insideV)\\b([^>]*?)\\/?>/g)) {
    const val = /w:val="(\\w+)"/.exec(m[2])?.[1];
    if (val) out[m[1] === "start" ? "left" : m[1] === "end" ? "right" : m[1]] = { val, sz: Number(/w:sz="(\\d+)"/.exec(m[2])?.[1] ?? 4), color: /w:color="(\\w+)"/.exec(m[2])?.[1] || "auto" };
  }
  return out;
}
const noBorder = (b) => !b || b.val === "nil" || b.val === "none";
const borderWidthPt = (b) => (noBorder(b) ? 0 : Math.max(b.sz, 2) / 8);
function borderDecl(side, b) {
  if (noBorder(b)) return \`border-\${side}:0 none\`;
  const style = { double: "double", dotted: "dotted", dashed: "dashed", dashSmallGap: "dashed", dotDash: "dashed", dotDotDash: "dashed", inset: "inset", outset: "outset" }[b.val] || "solid";
  return \`border-\${side}:\${borderWidthPt(b)}pt \${style} \${/^[0-9a-f]{6}$/i.test(b.color) ? \`#\${b.color}\` : "#000000"}\`;
}
/** Table-level borders: the table style (and its basedOn chain) overlaid by the table's own w:tblBorders. */
function tableBorders(tblPr, styleId, styles) {
  const chain = [];
  for (let id = styleId, guard = 0; id && styles?.[id] && guard < 8; id = styles[id].basedOn, guard++) chain.unshift(styles[id].ooxml || "");
  return Object.assign({}, ...chain.map((xml) => bordersOf(xml, "tblBorders")), bordersOf(tblPr, "tblBorders"));
}
/** \`w:trHeight\` of a row: the minimum (atLeast, the default) or fixed (exact) content height in mm. */
function rowHeight(row) {
  const m = /<w:trHeight\\b([^>]*)\\/?>/.exec(row?.properties?.rowPropertiesXml || "");
  const twips = Number(/w:val="(\\d+)"/.exec(m?.[1] || "")?.[1]);
  return twips > 0 ? { mm: twips * TWIP_MM, exact: /w:hRule="exact"/.test(m[1]) } : null;
}
`);
rep('export function importedTableCss(table) {','export function importedTableCss(table, styles) {');
rep(`  const visit = (node) => {
    if (node.type === "cell" && node.id && /^[\\w:-]+$/.test(node.id)) {
      const own =`, `  const tblBorders = tableBorders(tblPr, table.properties?.styleId, styles);
  const rowNodes = [];
  const collectRows = (node) => { if (node.type === "row") rowNodes.push(node); else if (node.type !== "cell" && node.type !== "table") (node.children || []).forEach(collectRows); };
  (table.children || []).forEach(collectRows);
  const lastCol = Math.max(0, grid.length);
  const visit = (node, row) => {
    if (node.type === "row") { (node.children || []).forEach((child) => visit(child, node)); return; }
    if (node.type === "cell" && node.id && /^[\\w:-]+$/.test(node.id)) {
      const own =`);
rep(`      rules.push(\`\${sel(node.id)}{padding:\${mm3(m.top)} \${mm3(m.right)} \${mm3(m.bottom)} \${mm3(m.left)} !important\${cellWidth > 0 ? \`;width:\${mm3(cellWidth)};box-sizing:border-box\` : ""}}\`);
      return;
    }
    if (node.type !== "table") (node.children || []).forEach(visit);`, `      // Borders: the cell's w:tcBorders over the table's (outer edges at the table boundary, insideH / insideV between cells); none otherwise.
      const rowAt = rowNodes.indexOf(row), spans = Number(node.attributes?.rowspan) > 1 ? Number(node.attributes.rowspan) : 1;
      const cellBorders = bordersOf(node.properties?.cellPropertiesXml, "tcBorders");
      const edge = { top: rowAt <= 0 ? tblBorders.top : tblBorders.insideH, bottom: rowAt + spans >= rowNodes.length ? tblBorders.bottom : tblBorders.insideH, left: !(col > 0) ? tblBorders.left : tblBorders.insideV, right: Number.isInteger(col) && col + span >= lastCol ? tblBorders.right : tblBorders.insideV };
      const sides = ["top", "right", "bottom", "left"].map((side) => cellBorders[side] ?? edge[side]);
      const heightRule = rowHeight(row);
      // Word's trHeight is the content height: cell margins and the borders add on top (tables.js, measured in Word).
      const height = heightRule && spans === 1 ? \`;height:\${mm3(heightRule.mm + m.top + m.bottom + (borderWidthPt(sides[0]) + borderWidthPt(sides[2])) / 2 * PT_MM)};box-sizing:border-box\${heightRule.exact ? ";overflow:hidden" : ""}\` : "";
      rules.push(\`\${sel(node.id)}{padding:\${mm3(m.top)} \${mm3(m.right)} \${mm3(m.bottom)} \${mm3(m.left)} !important\${cellWidth > 0 ? \`;width:\${mm3(cellWidth)};box-sizing:border-box\` : ""}\${height};\${["top", "right", "bottom", "left"].map((side, at) => borderDecl(side, sides[at])).join(";")} !important}\`);
      // w:hideMark: a cell holding only its (empty) end-of-cell mark adds no height, so an empty spacer row is as tall as its trHeight.
      const paragraphs = (node.children || []).filter((child) => child.type === "paragraph");
      if (/<w:hideMark\\b/.test(node.properties?.cellPropertiesXml || "") && paragraphs.length === 1 && (node.children || []).length === 1 && paragraphs[0].id && /^[\\w:-]+$/.test(paragraphs[0].id) && !paragraphHasContent(paragraphs[0])) rules.push(\`\${sel(paragraphs[0].id)}{display:none !important}\`);
      return;
    }
    if (node.type !== "table") (node.children || []).forEach((child) => visit(child, row));`);
rep('(table.children || []).forEach(visit);\n  return rules;','(table.children || []).forEach((child) => visit(child, null));\n  return rules;');
rep('rules.push(...importedTableCss(node));','rules.push(...importedTableCss(node, document.styles));');
fs.writeFileSync(p,s);
