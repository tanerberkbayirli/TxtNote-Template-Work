import { resolveLineSpacing } from "../typography.js";
import { WORD_FONT_METRICS } from "../wordBaseline.js";
import { importedShapeCss } from "./shapes.js";
import { importedRowRules } from "./tableRows.js";
/** Word draws notes in the document's footnote paragraph style (else Normal) and never caps the note area, so an imported
 * .docx takes that style plus the schema-maximum cap instead of the authored defaults (9 pt, 50 %). */
export function importedFootnoteRule(document) {
  const chain = (id, seen = new Set()) => {
    const style = id && !seen.has(id) ? document.styles?.[id] : null;
    if (!style) return {};
    seen.add(id);
    return { ...chain(style.basedOn, seen), ...style.properties };
  };
  const first = Object.values(document.notes || {}).find(n => n?.kind === "footnote" && n.type === "normal" && n.nodes?.[0]?.type === "paragraph")?.nodes[0];
  const styleId = first?.properties?.styleId || (document.styles?.FootnoteText ? "FootnoteText" : Object.keys(document.styles || {}).find(k => document.styles[k]?.default));
  // The note's own first paragraph (direct spacing included) wins over its style chain.
  const base = { ...document.styles?.default?.properties, ...chain(styleId), ...first?.properties?.resolvedSource };
  const rule = { maxAreaPercent: 100 }; // Word has no cap on the note area; authored templates stay limited to 10-90 by validation
  if (typeof base.fontFamily === "string") rule.fontFamily = base.fontFamily;
  if (Number.isFinite(base.fontSizePt) && base.fontSizePt > 0) rule.fontSizePt = base.fontSizePt;
  for (const key of ["spaceBeforePt", "spaceAfterPt"]) if (Number.isFinite(base[key]) && base[key] >= 0) rule[key] = base[key];
  if (base.lineSpacing && typeof base.lineSpacing === "object") rule.lineSpacing = { ...base.lineSpacing, ...(base.lineSpacing.rule === "auto" ? { singleLineEm: 1.15 } : {}) };
  return rule;
}

/** Imported Word sections are document data, never university-specific rules. */
export function withImportedSections(template, thesis) {
  const document = thesis.document;
  if (!["docx", "pdf"].includes(document?.source?.format)) return template;
  const main = template.sections.find(s => s.type === "mainContent");
  if (!main) return template;
  const imported = document.sections.filter(s => s.properties?.nativeSectionIndex !== undefined);
  if (!imported.length) return template;
  const source = document.formatMode === "source";
  const definitions = imported.map((s, i) => ({ ...(i === 0 ? main : {}), id: i === 0 ? main.id : s.id,
    type: i === 0 ? "mainContent" : "custom", title: "", showTitle: false, group: "body", mode: "editable", status: "required",
    order: i, pageBreakBefore: i === 0 || s.properties.breakType !== "continuous",
    // Word imposes no cap on the note area (notes may fill whole pages), so an imported .docx takes the schema maximum, not the authored default 50.
    ...(source ? { overrides: { page: { numbering: { enabled: false, restart: false } }, ...(document.source.format === "docx" ? { footnotes: importedFootnoteRule(document) } : {}) } } : {}),
    ...(["oddPage", "evenPage"].includes(s.properties.breakType) ? { pageBreakBefore: s.properties.breakType } : {}) }));
  if (source) {
    const headings = Object.fromEntries(Object.entries(template.typography.headings).map(([key, value]) => [key, { ...value, numbering: { ...value.numbering, enabled: false }, textTransform: "none", pageBreakBefore: false }]));
    return { ...template, sections: definitions, typography: { ...template.typography, headings } };
  }
  let order = 0;
  return { ...template, sections: template.sections.flatMap(s => s.id === main.id ? definitions.map(d => ({ ...d, order: order++ })) : [{ ...s, order: order++ }]) };
}

const numeric = (value, unit) => Number.isFinite(value) ? value+unit : null;
const font = value => typeof value === "string" && value.length < 150 && /^[\p{L}\p{N} _.,-]+$/u.test(value) ? '"'+value.replaceAll('"', '')+'"' : null;
function declarations(style, base = {}) {
  const result = [];
  const add = (key, value) => { if (value !== null && value !== undefined) result.push(key+":"+value); };
  add("font-family", font(style.fontFamily)); add("font-size", numeric(style.fontSizePt, "pt"));
  if (style.bold !== undefined) add("font-weight", style.bold ? "700" : "400");
  if (style.italic !== undefined) add("font-style", style.italic ? "italic" : "normal");
  if (style.underline !== undefined || style.strike !== undefined) add("text-decoration", [style.underline && "underline", style.strike && "line-through"].filter(Boolean).join(" ") || "none");
  if (/^#[\da-f]{6}$/i.test(style.color || "")) add("color", style.color);
  if (/^(?:transparent|yellow|green|cyan|magenta|blue|red|darkBlue|darkCyan|darkGreen|darkMagenta|darkRed|darkYellow|darkGray|lightGray|black|white)$/.test(style.highlight || "")) add("background-color", style.highlight);
  if (["left", "right", "center", "justify"].includes(style.align)) add("text-align", style.align);
  for (const [key, css, unit] of [["spaceBeforePt", "margin-top", "pt"], ["spaceAfterPt", "margin-bottom", "pt"], ["firstLineIndentMm", "text-indent", "mm"], ["leftIndentMm", "margin-left", "mm"], ["rightIndentMm", "margin-right", "mm"], ["characterSpacingPt", "letter-spacing", "pt"]]) add(css, numeric(style[key], unit));
  // OOXML w:ind left is the body edge and hanging pulls only the first line out of it: margin-left stays leftIndentMm.
  if (style.hangingIndentMm !== undefined) { add("text-indent", numeric(-style.hangingIndentMm, "mm")); }
  if (style.lineSpacing) { try { add("line-height", numeric(resolveLineSpacing({ ...base, ...style }, { mode: "word", ...style.lineSpacing }).pitchPt, "pt")); } catch { const s = style.lineSpacing; add("line-height", numeric(s.value, s.rule === "auto" ? "" : "pt")); } }
  if (style.caps !== undefined) add("text-transform", style.caps ? "uppercase" : "none");
  if (style.smallCaps !== undefined) add("font-variant", style.smallCaps ? "small-caps" : "normal");
  if (style.hidden) add("visibility", "hidden");
  if (style.bidi !== undefined) add("direction", style.bidi ? "rtl" : "ltr");
  if (style.pageBreakBefore) add("break-before", "column");
  if (style.keepWithNext) add("break-after", "avoid");
  if (style.keepLines) add("break-inside", "avoid");
  if (style.verticalAlign === "superscript") { add("vertical-align", "super"); add("font-size", "smaller"); }
  if (style.verticalAlign === "subscript") { add("vertical-align", "sub"); add("font-size", "smaller"); }
  return result.join(";");
}
const CONTENT_LEAVES = new Set(["tab", "break", "image", "drawing", "equation"]);
/** True when the paragraph draws something: visible text (non-collapsible characters), a tab, break, image, drawing or equation. */
function paragraphHasContent(node) {
  if (node.type === "text") return /[^ \t\r\n\f]/.test(node.text || "");
  if (CONTENT_LEAVES.has(node.type)) return true;
  if (node.type === "bookmark" || node.type === "annotation" || node.type === "field") return false;
  return (node.children || []).some(paragraphHasContent);
}
const ANCHOR_TYPES = new Set(["bookmark", "annotation"]);
/** A paragraph with a hidden paragraph mark and no content besides anchors (bookmarks, comment marks). */
function vanishesInWord(node) {
  if (node.type !== "paragraph" || node.properties?.paragraphMarkRun?.hidden !== true) return false;
  const anchorsOnly = (children) => (children || []).every((child) => ANCHOR_TYPES.has(child.type) && anchorsOnly(child.children));
  return anchorsOnly(node.children);
}
/** Such a paragraph, or a list / list item that holds nothing else (a list item would still draw its marker line). */
function vanishesDeep(node) {
  if (node.type === "paragraph") return vanishesInWord(node);
  return (node.type === "list" || node.type === "listItem") && node.children?.length > 0 && node.children.every(vanishesDeep);
}
/**
 * Word indents a list paragraph by its numbering level (`w:ind left/hanging`): the text starts at `left`, the marker hangs `hanging` before it.
 * HTML adds the list's own padding on top of the paragraph margin, so imported lists place the marker column on the list element
 * (`padding-left = left - hanging`, relative to the enclosing item edge) and the text edge on the paragraph (`margin-left = hanging`).
 */
/**
 * Effective single-line height (em) of marker fonts that make the first line of a list item taller than the body font does. Measured in the
 * real Word render of SRC10 (p.31): a 12 pt Symbol bullet item advances 21.55 pt at 1.5 lines against 20.70 pt for Times New Roman, i.e.
 * 1.1972 em (the Symbol font program says 1.2251 em; Word's own rounding is what the page flow follows). Other marker fonts: UNKNOWN, 0.
 */
const MARKER_SINGLE_LINE_EM = Object.freeze({ symbol: 21.55 / 1.5 / 12 });
/**
 * Word sizes the first line of a list item by its tallest run, the marker included. HTML never sees the marker font, so the difference
 * to the body line is added to the item's first line (pt, 0 when not applicable).
 */
function markerLeadingPt(node, base) {
  const run = node.properties?.list?.run;
  const markerEm = MARKER_SINGLE_LINE_EM[String(run?.fontFamily || "").toLowerCase()];
  const style = node.properties?.resolvedSource || {};
  const spacing = style.lineSpacing;
  const family = String(style.fontFamily || base?.fontFamily || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const metrics = WORD_FONT_METRICS[family];
  if (!markerEm || !metrics || spacing?.rule !== "auto" || !(spacing.value > 0)) return 0;
  const size = run.fontSizePt ?? style.fontSizePt ?? base?.fontSizePt ?? 12;
  const bodySize = style.fontSizePt ?? base?.fontSizePt ?? 12;
  const extra = spacing.value * (markerEm * size - (metrics.ascent + metrics.descent + metrics.lineGap) * bodySize);
  return extra > 0.01 ? Math.round(extra * 100) / 100 : 0;
}
const mmText = (value) => `${Math.round(value * 1000) / 1000}mm`;
function listLevelIndent(listNode) {
  const find = (nodes) => { for (const node of nodes || []) { const level = node.type === "paragraph" ? node.properties?.list?.paragraph : null; if (level) return level; const found = node.type === "list" ? null : find(node.children); if (found) return found; } return null; };
  const level = find(listNode.children);
  const left = level?.leftIndentMm, hanging = level?.hangingIndentMm ?? 0;
  return Number.isFinite(left) && left > 0 && hanging >= 0 && hanging <= left ? { left, hanging } : null;
}
/**
 * Word sizes an "auto" line from the tallest run on it, not from the paragraph's default font: a 16 pt heading in a 12 pt, 1.5-line body
 * advances 27.6 pt, not 20.7 pt. The paragraph pitch therefore uses the largest run size (and that run's family) as its font.
 */
export function largestRunBase(paragraph, base, formatMode) {
  let best = null, unsized = false;
  const visit = (nodes) => {
    for (const child of nodes || []) {
      if (child.type === "run") {
        const run = formatMode === "source" ? child.properties?.resolvedSource : child.properties?.direct;
        if (run?.fontSizePt > 0) { if (!best || run.fontSizePt > best.fontSizePt) best = { fontSizePt: run.fontSizePt, fontFamily: run.fontFamily }; }
        else unsized = true;
      } else if (child.type === "textRun") {
        const run = formatMode === "source" ? child.properties?.resolvedSource : child.properties?.direct;
        if (run?.fontSizePt > 0 && (!best || run.fontSizePt > best.fontSizePt)) best = { fontSizePt: run.fontSizePt, fontFamily: run.fontFamily };
      }
      if (child.type !== "paragraph") visit(child.children);
    }
  };
  visit(paragraph.children);
  // Every run carries its own (resolved) size and none reaches the body size: the line follows the runs (a 11 pt table-of-contents
  // line in a 12 pt body advances 11 pt metrics), not the body strut. Runs without a size inherit the body, so they keep it.
  const sizeBase = base?.fontSizePt || 12;
  if (best && !unsized && best.fontFamily && paragraph.properties?.styleId && best.fontSizePt < sizeBase) return { ...base, fontSizePt: best.fontSizePt, fontFamily: best.fontFamily };
  if (!best || best.fontSizePt <= sizeBase) return base;
  return { ...base, fontSizePt: best.fontSizePt, ...(best.fontFamily ? { fontFamily: best.fontFamily } : {}) };
}
/** True when every paragraph of the table's first row keeps with next (the usual way to hold a whole table together in Word). */
export function tableChainsWithNext(table, formatMode) {
  const paragraphs = [];
  const collect = (node) => { if (node.type === "paragraph") paragraphs.push(node); else (node.children || []).forEach(collect); };
  const firstRow = (node) => node.type === "row" ? node : (node.children || []).map(firstRow).find(Boolean);
  const row = firstRow(table);
  if (!row) return false;
  collect(row);
  return paragraphs.length > 0 && paragraphs.every((p) => (formatMode === "source" ? p.properties?.resolvedSource : p.properties?.direct)?.keepWithNext === true);
}
const TWIP_MM = 25.4 / 1440;
const xmlBlock = (xml, name) => new RegExp(`<w:${name}\\b[^>]*?(?:/>|>([\\s\\S]*?)</w:${name}>)`).exec(xml || "");
const xmlTwips = (xml, name) => { const m = new RegExp(`<w:${name}\\b([^>]*)/?>`).exec(xml || ""); if (!m) return undefined; const w = /w:w="(-?\d+)"/.exec(m[1]), type = /w:type="(\w+)"/.exec(m[1])?.[1]; return w && (!type || type === "dxa") ? Number(w[1]) * TWIP_MM : undefined; };
/** Cell margins (mm) of a `w:tblCellMar` / `w:tcMar` block; a missing edge is undefined. */
function cellMarginsMm(xml, block) {
  const inner = xmlBlock(xml, block)?.[1];
  if (!inner) return {};
  return { top: xmlTwips(inner, "top"), bottom: xmlTwips(inner, "bottom"), left: xmlTwips(inner, "left") ?? xmlTwips(inner, "start"), right: xmlTwips(inner, "right") ?? xmlTwips(inner, "end") };
}
const mm3 = (value) => `${Math.round(value * 1000) / 1000}mm`;
const PT_MM = 25.4 / 72;
/** Borders of a `w:tblBorders` / `w:tcBorders` block keyed by side (start/end folded into left/right; insideH / insideV kept). */
function bordersOf(xml, block) {
  const out = {};
  for (const m of (xmlBlock(xml, block)?.[1] || "").matchAll(/<w:(top|left|bottom|right|start|end|insideH|insideV)\b([^>]*?)\/?>/g)) {
    const val = /w:val="(\w+)"/.exec(m[2])?.[1];
    if (val) out[m[1] === "start" ? "left" : m[1] === "end" ? "right" : m[1]] = { val, sz: Number(/w:sz="(\d+)"/.exec(m[2])?.[1] ?? 4), color: /w:color="(\w+)"/.exec(m[2])?.[1] || "auto" };
  }
  return out;
}
const noBorder = (b) => !b || b.val === "nil" || b.val === "none";
const borderWidthPt = (b) => (noBorder(b) ? 0 : Math.max(b.sz, 2) / 8);
function borderDecl(side, b) {
  if (noBorder(b)) return `border-${side}:0 none !important`;
  const style = { double: "double", dotted: "dotted", dashed: "dashed", dashSmallGap: "dashed", dotDash: "dashed", dotDotDash: "dashed", inset: "inset", outset: "outset" }[b.val] || "solid";
  return `border-${side}:${borderWidthPt(b)}pt ${style} ${/^[0-9a-f]{6}$/i.test(b.color) ? `#${b.color}` : "#000000"} !important`;
}
/** Table-level borders: the table style (and its basedOn chain) overlaid by the table's own w:tblBorders. */
function tableBorders(tblPr, styleId, styles) {
  const chain = [];
  for (let id = styleId, guard = 0; id && styles?.[id] && guard < 8; id = styles[id].basedOn, guard++) chain.unshift(styles[id].ooxml || "");
  return Object.assign({}, ...chain.map((xml) => bordersOf(xml, "tblBorders")), bordersOf(tblPr, "tblBorders"));
}
/** `w:trHeight` of a row: the minimum (atLeast, the default) or fixed (exact) content height in mm. */
function rowHeight(row) {
  const m = /<w:trHeight\b([^>]*)\/?>/.exec(row?.properties?.rowPropertiesXml || "");
  const twips = Number(/w:val="(\d+)"/.exec(m?.[1] || "")?.[1]);
  return twips > 0 ? { mm: twips * TWIP_MM, exact: /w:hRule="exact"/.test(m[1]) } : null;
}
/**
 * Word lays an imported table out on its own grid (w:tblGrid / w:gridCol) with its own cell margins (w:tblCellMar, w:tcMar; Word's
 * default table style: 0 top/bottom, 108 twips left/right), not the template's 100 % width and authored cell padding. Without this, a
 * 7 x 20 mm grid at 3.5 pt margins becomes 7 equal columns with 8 pt padding, cell words wrap and every row grows to two or three lines.
 */
export function importedTableCss(table, styles) {
  if (!table?.id || !/^[\w:-]+$/.test(table.id)) return [];
  const sel = (id) => `.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]`;
  const tblPr = table.properties?.tablePropertiesXml || "";
  const grid = (table.properties?.gridWidthsMm || []).filter((w) => Number.isFinite(w) && w >= 0);
  const rules = [];
  const gridSum = grid.reduce((a, b) => a + b, 0);
  const tblW = /<w:tblW\b([^>]*)\/?>/.exec(tblPr)?.[1] || "";
  const tblWType = /w:type="(\w+)"/.exec(tblW)?.[1], tblWValue = Number(/w:w="(\d+)"/.exec(tblW)?.[1]);
  const width = tblWType === "pct" && tblWValue > 0 ? `${Math.min(100, tblWValue / 50)}%` : gridSum > 0 ? mm3(gridSum) : null;
  const fixed = /<w:tblLayout\b[^>]*w:type="fixed"/.test(tblPr) || table.properties?.gridIrregular === true;
  const align = /<w:jc\b[^>]*w:val="(\w+)"/.exec(tblPr.replace(/<w:tblCellMar[\s\S]*?<\/w:tblCellMar>/, ""))?.[1];
  const indent = xmlTwips(tblPr, "tblInd");
  const tableCss = [width ? `width:${width}` : "", fixed ? "table-layout:fixed" : "", align === "center" ? "margin-left:auto;margin-right:auto" : align === "right" || align === "end" ? "margin-left:auto;margin-right:0" : Number.isFinite(indent) && indent !== 0 ? `margin-left:${mm3(indent)}` : ""].filter(Boolean).join(";");
  if (tableCss) rules.push(`${sel(table.id)}{${tableCss}}`);
  const tableMar = { top: 0, bottom: 0, left: 108 * TWIP_MM, right: 108 * TWIP_MM, ...Object.fromEntries(Object.entries(cellMarginsMm(tblPr, "tblCellMar")).filter(([, v]) => v !== undefined)) };
  const tblBorders = tableBorders(tblPr, table.properties?.styleId, styles);
  const rowNodes = [];
  const collectRows = (node) => { if (node.type === "row") rowNodes.push(node); else if (node.type !== "cell" && node.type !== "table") (node.children || []).forEach(collectRows); };
  (table.children || []).forEach(collectRows);
  const lastCol = Math.max(0, grid.length);
  const visit = (node, row) => {
    if (node.type === "row") { (node.children || []).forEach((child) => visit(child, node)); return; }
    if (node.type === "cell" && node.id && /^[\w:-]+$/.test(node.id)) {
      const own = Object.fromEntries(Object.entries(cellMarginsMm(node.properties?.cellPropertiesXml, "tcMar")).filter(([, v]) => v !== undefined));
      const m = { ...tableMar, ...own };
      const col = node.properties?.gridColumn, span = node.properties?.gridSpan || 1;
      const cellWidth = Number.isInteger(col) && col + span <= grid.length ? grid.slice(col, col + span).reduce((a, b) => a + b, 0) : xmlTwips(node.properties?.cellPropertiesXml, "tcW");
      // Borders: the cell's w:tcBorders over the table's (outer edges at the table boundary, insideH / insideV between cells); none otherwise.
      const rowAt = rowNodes.indexOf(row), spans = Number(node.attributes?.rowspan) > 1 ? Number(node.attributes.rowspan) : 1;
      const cellBorders = bordersOf(node.properties?.cellPropertiesXml, "tcBorders");
      const edge = { top: rowAt <= 0 ? tblBorders.top : tblBorders.insideH, bottom: rowAt + spans >= rowNodes.length ? tblBorders.bottom : tblBorders.insideH, left: !(col > 0) ? tblBorders.left : tblBorders.insideV, right: Number.isInteger(col) && col + span >= lastCol ? tblBorders.right : tblBorders.insideV };
      const sides = ["top", "right", "bottom", "left"].map((side) => cellBorders[side] ?? edge[side]);
      const heightRule = rowHeight(row);
      if (heightRule && !heightRule.exact && row?.id) rules.push(`${sel(row.id)}{--thesis-source-row-min:${mm3(heightRule.mm)}}`, `${sel(row.id)}[data-thesis-row-min-break]{break-before:column !important}`);
      // Word's trHeight is the content height: cell margins and the borders add on top (tables.js, measured in Word).
      const height = heightRule && spans === 1 ? `;height:${mm3(heightRule.mm + m.top + m.bottom + (borderWidthPt(sides[0]) + borderWidthPt(sides[2])) / 2 * PT_MM)};box-sizing:border-box${heightRule.exact ? ";overflow:hidden" : ""}` : "";
      const valign = /<w:vAlign\b[^>]*w:val="(top|center|bottom)"/.exec(node.properties?.cellPropertiesXml || "")?.[1];
      // Exact row: a cell's CSS height is only a minimum, so the row's cells hold a presentation wrapper (tableSemantics.js decorates it,
      // thesisSourceHtml strips it) whose height clips the content at the declared text-area edge like Word.
      // Vertical cell text (w:textDirection btLr / tbRl): the wrapper turns the text and wraps it at the row height (Word breaks the
      // lines at the declared row height instead of growing the row to the full text length), the lines stack across the cell width.
      const direction = node.attributes?.["data-docx-text-dir"];
      if ((direction === "btLr" || direction === "tbRl") && spans === 1) rules.push(`${sel(node.id)}>txt-table-cell-content{display:block;writing-mode:${direction === "btLr" ? "sideways-lr" : "vertical-rl"};${heightRule ? `height:${mm3(heightRule.mm)};` : ""}${heightRule?.exact ? "overflow:hidden;" : ""}box-sizing:border-box}`);
      else if (heightRule?.exact && spans === 1) rules.push(`${sel(node.id)}>txt-table-cell-content{display:${valign === "center" || valign === "bottom" ? "flex;flex-direction:column;justify-content:safe " + (valign === "center" ? "center" : "flex-end") : "block"};height:${mm3(heightRule.mm)};overflow:hidden;box-sizing:border-box}`);
      const bottomPadding = heightRule && !heightRule.exact && spans === 1 ? `calc(${mm3(m.bottom)} + var(--thesis-source-row-tail,0px))` : mm3(m.bottom);
      rules.push(`${sel(node.id)}{padding:${mm3(m.top)} ${mm3(m.right)} ${bottomPadding} ${mm3(m.left)} !important${cellWidth > 0 ? `;width:${mm3(cellWidth)};box-sizing:border-box` : ""}${height}${valign ? `;vertical-align:${valign === "center" ? "middle" : valign}` : ""};${["top", "right", "bottom", "left"].map((side, at) => borderDecl(side, sides[at])).join(";")}}`);
      // w:hideMark: a cell holding only its (empty) end-of-cell mark adds no height, so an empty spacer row is as tall as its trHeight.
      const paragraphs = (node.children || []).filter((child) => child.type === "paragraph");
      if (/<w:hideMark\b/.test(node.properties?.cellPropertiesXml || "") && paragraphs.length === 1 && (node.children || []).length === 1 && paragraphs[0].id && /^[\w:-]+$/.test(paragraphs[0].id) && !paragraphHasContent(paragraphs[0])) rules.push(`${sel(paragraphs[0].id)}{display:none !important}`);
      return;
    }
    if (node.type !== "table") (node.children || []).forEach((child) => visit(child, row));
  };
  (table.children || []).forEach((child) => visit(child, null));
  return rules;
}
/** Word sizes a cell paragraph's lines from its runs and paragraph mark; the HTML strut must use the mark's size, not the body's. */
function cellParagraphBase(node, base) {
  const mark = node.properties?.paragraphMarkRun?.fontSizePt;
  return mark > 0 ? { ...base, fontSizePt: mark } : base;
}
const ROMAN = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
/** One counter value in a w:numFmt (decimal when the format is unknown). */
export function formatListNumber(value, format) {
  const n = Math.max(0, Math.trunc(Number(value) || 0));
  if (format === "decimalZero") return String(n).padStart(2, "0");
  if (format === "lowerLetter" || format === "upperLetter") {
    if (n < 1) return String(n);
    const letter = String.fromCharCode(97 + ((n - 1) % 26)).repeat(Math.floor((n - 1) / 26) + 1);
    return format === "upperLetter" ? letter.toUpperCase() : letter;
  }
  if (format === "lowerRoman" || format === "upperRoman") {
    let rest = n, out = "";
    for (const [size, symbol] of ROMAN) while (rest >= size) { out += symbol; rest -= size; }
    return format === "upperRoman" ? out.toUpperCase() : out;
  }
  if (format === "none") return "";
  return String(n);
}
/**
 * Word draws a heading's automatic number (numPr / style-linked numbering, `lvlText` like "%1.%2.") before the text. The importer nests such
 * headings in <ol><li>, whose native marker only knows the item's own level counter ("1." instead of "3.1."). For list items that hold a
 * heading, the marker is replaced by the Word number text on the heading's ::before (counters per numId and level in document order,
 * restarting below a higher level); `suff` picks tab (hanging box) / space / nothing, and the numbering run formats the number.
 * Plain (non-heading) list items keep their native marker. A hidden mark, an empty level text or a bullet level draws no generated number.
 */
export function importedHeadingNumberRules(document) {
  const rules = [], state = new Map();
  const safe = (id) => typeof id === "string" && /^[\w:-]+$/.test(id);
  const visit = (nodes) => {
    for (const node of nodes || []) {
      if (node.type === "listItem" && node.properties?.numId !== undefined) {
        const entry = state.get(node.properties.numId) || { ordinals: {}, formats: {}, starts: {} };
        const level = node.properties.level;
        entry.ordinals[level] = node.properties.ordinal;
        for (const key of Object.keys(entry.ordinals)) if (Number(key) > level) delete entry.ordinals[key];
        state.set(node.properties.numId, entry);
        const heading = (node.children || []).find((child) => child.type === "paragraph" && /^h[1-6]$/.test(child.tag) && child.properties?.list);
        if (heading) {
          const list = heading.properties.list;
          entry.formats[level] = list.format; entry.starts[level] = list.start;
          if (safe(node.id) && safe(heading.id) && list.format !== "bullet") {
            rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{list-style:none}`);
            const hidden = list.run?.hidden === true || heading.properties.paragraphMarkRun?.hidden === true;
            const text = String(list.text ?? "").replace(/%([1-9])/g, (_, k) => { const at = Number(k) - 1; return formatListNumber(entry.ordinals[at] ?? entry.starts[at] ?? 1, entry.formats[at]); });
            if (!hidden && text.trim()) {
              const hanging = list.paragraph?.hangingIndentMm, suffix = list.suffix || "tab";
              const { hidden: _hidden, ...run } = list.run || {};
              const decl = declarations(run, {});
              const box = suffix === "tab" && hanging > 0 ? `display:inline-block;min-width:${mmText(hanging)};margin-left:-${mmText(hanging)};text-indent:0;` : "";
              const content = suffix === "nothing" ? text : suffix === "tab" && box ? text : `${text} `;
              rules.push(`.thesis-paper .thesis-body ${heading.tag}[data-txt-node-id="${heading.id}"][data-txt-node-id]::before{content:"${content.replace(/[\\"]/g, "\\$&").replace(/[\r\n]/g, " ")}";${box}${decl}}`);
            }
          }
        }
      }
      visit(node.children);
    }
  };
  for (const section of document?.sections || []) visit(section.nodes);
  return rules;
}
/** Rewrites node-id attribute selectors to the display-only `txn-<id>` classes stamped by contentNodesToHtml: same specificity and order,
 * but Blink hashes class selectors, so style recalculation no longer scans every rule for every stamped element. */
export function classKeyedNodeCss(css) {
  const cls = (id) => `.txn-${id.replace(/:/g, "\\:")}`;
  return css.replace(/\[data-txt-node-id="([\w:-]+)"\]\[data-txt-node-id\]/g, (_, id) => cls(id) + cls(id)).replace(/\[data-txt-node-id="([\w:-]+)"\]/g, (_, id) => cls(id));
}
export function importedContentCss(document) {
  if (!["docx", "pdf"].includes(document?.source?.format)) return "";
  // Word gives an empty paragraph a full line (paragraph mark height + spacing); an empty <p> has no line box in HTML, so a zero-width strut
  // restores it. Only paragraphs without a visible element child match (bookmarks and hidden markers are not content; text-only paragraphs
  // already have lines, so it changes nothing there).
  const emptyParagraphs = [];
  const rules = [".thesis-body [data-docx-vmerge=continue]{display:none !important}.thesis-body [data-docx-break=page]{break-after:column}",
    // Word shows no space before on the first plain paragraph of an imported group (SRC09 s.87: first text line at 98.0 pt, not 104.7 pt).
    '.thesis-paper[data-thesis-layout="paged"] .thesis-page-flow > .thesis-flow-section:first-child .rich-text-body > p:first-child{margin-top:0 !important}'];
  // "Don't add space between paragraphs of the same style" (w:contextualSpacing): consecutive paragraphs of one style, either of which has
  // the property, lose the space between them. Adjacency follows document order through lists; tables and containers break the chain.
  const contextual = new Map();
  let previousParagraph = null;
  const markContextual = (node) => {
    const style = document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
    const current = { id: node.id, styleId: node.properties?.styleId ?? "", contextual: style?.contextualSpacing === true };
    if (previousParagraph && previousParagraph.styleId === current.styleId && (previousParagraph.contextual || current.contextual)) {
      contextual.set(previousParagraph.id, { ...contextual.get(previousParagraph.id), bottom: true });
      contextual.set(current.id, { ...contextual.get(current.id), top: true });
    }
    previousParagraph = current;
  };
  const BREAKS_CHAIN = new Set(["table", "tableBody", "row", "cell", "container"]);
  const walk = (nodes, base, itemEdge = null, inCell = false) => {
    for (const node of nodes) {
      if (BREAKS_CHAIN.has(node.type)) previousParagraph = null;
      if (node.type === "paragraph" && node.id && /^[\w:-]+$/.test(node.id) && !vanishesInWord(node)) markContextual(node);
      if (node.type === "paragraph" && node.id && /^[\w:-]+$/.test(node.id) && !vanishesInWord(node) && !paragraphHasContent(node)) emptyParagraphs.push(node.id);
      // A paragraph whose mark is hidden and that holds nothing but anchors vanishes with its spacing in Word.
      if (node.id && /^[\w:-]+$/.test(node.id) && vanishesDeep(node)) { rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]${node.type === "paragraph" ? "[data-docx-style]" : ""}{display:none !important}`); continue; }
      if (node.id && /^[\w:-]+$/.test(node.id)) {
        const style = document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
        const cellMark = inCell && node.type === "paragraph" && !(style?.fontSizePt > 0) ? node.properties?.paragraphMarkRun?.fontSizePt : undefined;
        const lineBase = node.type === "paragraph" ? largestRunBase(node, inCell ? cellParagraphBase(node, base) : base, document.formatMode) : base;
        // Runs all smaller than the body: the paragraph (strut) takes their size too, or the 12 pt strut and the 11 pt runs share
        // one fixed line height on different baselines and the line box grows by the difference (about 1 px per line).
        const smallRuns = node.type === "paragraph" && !inCell && !(style?.fontSizePt > 0) && lineBase.fontSizePt > 0 && lineBase.fontSizePt < (base?.fontSizePt || 12) ? `font-size:${lineBase.fontSizePt}pt` : "";
        const css = [style ? declarations(style, lineBase) : "", cellMark > 0 ? `font-size:${cellMark}pt` : "", smallRuns].filter(Boolean).join(";");
        if (css) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{${css}}`);
      }
      // Word splits a table between rows wherever the page ends unless its paragraphs chain with keep-with-next; the editor's
      // `table{break-inside:avoid}` (whole-table moves) is a template-authoring rule and must not apply to imported tables.
      if (node.type === "table" && node.id && /^[\w:-]+$/.test(node.id) && !tableChainsWithNext(node, document.formatMode)) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{break-inside:auto}`);
      if (node.type === "table") rules.push(...importedTableCss(node, document.styles), ...importedRowRules(node, { split: !tableChainsWithNext(node, document.formatMode) }));
      if (node.type === "listItem" && node.id && /^[\w:-]+$/.test(node.id)) {
        const paragraph = (node.children || []).find((child) => child.type === "paragraph");
        const style = document.formatMode === "source" ? paragraph?.properties?.resolvedSource : paragraph?.properties?.direct;
        if (paragraph && style?.lineSpacing) {
          // A block paragraph inside <li> has its own Word pitch, but Blink also
          // lays out the outside marker's line using the <li>'s inherited body
          // strut. A 10 pt single-spaced table list otherwise advances by the
          // 12 pt, 1.5-spaced body line even though its paragraph is only 11.5 pt.
          const markBase = inCell ? cellParagraphBase(paragraph, base) : base;
          const lineBase = largestRunBase(paragraph, markBase, document.formatMode);
          const lineCss = declarations({ lineSpacing: style.lineSpacing, ...(style.fontSizePt > 0 ? { fontSizePt: style.fontSizePt } : {}) }, lineBase);
          rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{${lineCss}${inCell && paragraph.properties?.paragraphMarkRun?.fontSizePt > 0 && !(style.fontSizePt > 0) ? `;font-size:${paragraph.properties.paragraphMarkRun.fontSizePt}pt` : ""}}`);
        }
      }
      let childEdge = itemEdge;
      if (node.type === "list" && node.id && /^[\w:-]+$/.test(node.id)) {
        const indent = listLevelIndent(node);
        if (indent) {
          const edge = indent.left - indent.hanging;
          rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{padding-left:${mmText(Math.max(0, edge - (itemEdge ?? 0)))};margin-left:0}`);
          childEdge = edge;
        }
      } else if (node.type === "paragraph" && itemEdge !== null && node.id && /^[\w:-]+$/.test(node.id) && node.properties?.list?.paragraph) {
        const textEdge = node.properties?.direct?.leftIndentMm ?? node.properties.list.paragraph.leftIndentMm;
        const lead = markerLeadingPt(node, base);
        if (Number.isFinite(textEdge)) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{margin-left:${mmText(Math.max(0, textEdge - itemEdge))};text-indent:0${lead ? `;padding-top:${lead}pt` : ""}}`);
      }
      walk(node.children || [], base, childEdge, inCell || node.type === "cell");
      if (BREAKS_CHAIN.has(node.type)) previousParagraph = null;
    }
  };
  document.sections.forEach(s => { previousParagraph = null; walk(s.nodes, s.properties?.rules?.body || {}); });
  for (let at = 0; at < emptyParagraphs.length; at += 200) rules.push(`${emptyParagraphs.slice(at, at + 200).map((id) => `.thesis-body p[data-txt-node-id="${id}"]::before`).join(",")}{content:"\\200b"}`);
  for (const [id, edge] of contextual) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]{${edge.top ? "margin-top:0;" : ""}${edge.bottom ? "margin-bottom:0;" : ""}}`);
  rules.push(...importedHeadingNumberRules(document));
  rules.push(...importedShapeCss(document));
  return rules.join("\n");
}
