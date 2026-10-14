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
/**
 * Word grants the last line of a page only its own extra leading (single-spaced 0, exact/atLeast 0, auto multiples (n-1) single lines;
 * engine.js wordLastLineLeadingMm). The paged flow column carries the body's allowance, so a paragraph with less is guarded by
 * pad-bottom = column allowance - own (pageLayout.js, custom property --thesis-col-lead). null when the font metrics are UNKNOWN.
 */
function ownTerminalLeadingMm(merged) {
  const spacing = merged.lineSpacing;
  if (!spacing?.rule) return null;
  if (spacing.rule !== "auto" || !(spacing.value > 1)) return 0;
  const metrics = WORD_FONT_METRICS[String(merged.fontFamily || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase()];
  const single = spacing.singleLineEm ?? (metrics ? metrics.ascent + metrics.descent + metrics.lineGap : null);
  if (!(single > 0)) return null;
  return Math.round((spacing.value - 1) * single * (merged.fontSizePt || 12) * 25.4 / 72 * 1000) / 1000;
}
/** True when the last content of the paragraph is a manual page break (w:br w:type="page"). */
function endsWithPageBreak(node) {
  let last = null;
  const visit = (child) => { if (child.type === "break") last = child.attributes?.["data-docx-break"] === "page"; else if (paragraphHasContent(child)) last = false; (child.children || []).forEach(visit); };
  (node.children || []).forEach(visit);
  return last === true;
}
const CONTENT_LEAVES = new Set(["tab", "break", "image", "drawing", "equation"]);
/** True when the paragraph draws something: visible text (non-collapsible characters), a tab, break, image, drawing or equation. */
function paragraphHasContent(node) {
  if (node.type === "text") return /[^ \t\r\n\f]/.test(node.text || "");
  if (CONTENT_LEAVES.has(node.type)) return true;
  if (node.type === "bookmark" || node.type === "annotation" || node.type === "field") return false;
  return (node.children || []).some(paragraphHasContent);
}
/** True when the paragraph's only content is INLINE pictures (no visible text, tab, break, equation or floating drawing): the editor stacks it as a block image. */
function pictureOnlyParagraph(node) {
  let picture = false, other = false;
  const visit = (child) => {
    if (child.type === "image" && child.tag === "img" && !child.attributes?.["data-img-wrap"]) { picture = true; return; }
    if (child.type === "drawing") { const had = picture; picture = false; (child.children || []).forEach(visit); if (!picture) other = true; picture ||= had; return; }
    if (child.type === "image") { other = true; return; }
    if (child.type === "text") { if (/[^ \t\r\n\f]/.test(child.text || "")) other = true; return; }
    if (child.type === "tab" || child.type === "break" || child.type === "equation") { other = true; return; }
    (child.children || []).forEach(visit);
  };
  (node.children || []).forEach(visit);
  return picture && !other;
}
/**
 * Word ends every line of an "auto" (multiple) paragraph with the extra leading (pitch minus the single-line height), a picture line
 * included (MEASURED in the real Word render of SRC09 p.44: the 180.4 pt picture is followed by 7.0 pt before the 6 pt space,
 * 6.9 pt for a 12 pt, 1.5-line Times New Roman paragraph). A block image box has no such tail in HTML, so it is added as padding (pt, 0 when not applicable).
 */
function pictureTailPt(node, style, base) {
  const spacing = style?.lineSpacing;
  if (!pictureOnlyParagraph(node) || spacing?.rule !== "auto" || !(spacing.value > 1)) return 0;
  const merged = { ...base, ...style };
  const metrics = WORD_FONT_METRICS[String(merged.fontFamily || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase()];
  if (!metrics) return 0;
  const size = node.properties?.paragraphMarkRun?.fontSizePt > 0 && !(style?.fontSizePt > 0) ? node.properties.paragraphMarkRun.fontSizePt : merged.fontSizePt || 12;
  const extra = (spacing.value - 1) * (metrics.ascent + metrics.descent + metrics.lineGap) * size;
  return extra > 0.01 ? Math.round(extra * 100) / 100 : 0;
}
/** Largest `wp:effectExtent` edge (pt) above and below the paragraph's inline pictures (`data-img-effect="l,t,r,b"`, see images.js). */
function pictureEffectPt(node) {
  const edge = { top: 0, bottom: 0 };
  const visit = (child) => {
    const effect = child.type === "image" ? String(child.attributes?.["data-img-effect"] || "").split(",").map(Number) : null;
    if (effect?.length === 4 && effect.every(Number.isFinite)) { edge.top = Math.max(edge.top, effect[1]); edge.bottom = Math.max(edge.bottom, effect[3]); }
    (child.children || []).forEach(visit);
  };
  (node.children || []).forEach(visit);
  return edge;
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
  // A list of numbered headings whose level has no indent at all (w:ind left=0 firstLine=0) still has to drop the UA's list padding.
  const headings = (nodes) => (nodes || []).some((node) => node.type === "paragraph" ? /^h[1-6]$/.test(node.tag) : node.type !== "list" && headings(node.children));
  if (left === 0 && hanging === 0 && headings(listNode.children)) return { left: 0, hanging: 0 };
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
/** The one font size (pt) shared by every sized run of the paragraph, or 0 when sizes differ or a run inherits its size. */
function uniformRunSize(paragraph, formatMode) {
  let size = null, mixed = false;
  const visit = (nodes) => {
    for (const child of nodes || []) {
      if (child.type === "run") {
        const run = formatMode === "source" ? child.properties?.resolvedSource : child.properties?.direct;
        if (!(run?.fontSizePt > 0) || (size !== null && size !== run.fontSizePt)) mixed = true; else size = run.fontSizePt;
      }
      if (child.type !== "paragraph") visit(child.children);
    }
  };
  visit(paragraph.children);
  return mixed || size === null ? 0 : size;
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
/** Chrome draws a border a whole number of CSS px wide (at least 1 px): the width the browser really lays out, in pt. */
const snappedBorderPt = (widthPt) => (widthPt > 0 ? Math.max(1, Math.floor(widthPt * 4 / 3 + 1e-6)) * 0.75 : 0);
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
  // `!important`: the app's table rule (`.rich-text-body table{width:100% !important}`) would otherwise stretch every Word table to the text width.
  const tableCss = [width ? `width:${width} !important` : "", fixed ? "table-layout:fixed" : "", align === "center" ? "margin-left:auto;margin-right:auto" : align === "right" || align === "end" ? "margin-left:auto;margin-right:0" : Number.isFinite(indent) && indent !== 0 ? `margin-left:${mm3(indent)}` : ""].filter(Boolean).join(";");
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
      // w:noWrap: in an autofit table the cell text never wraps and the column grows to hold it (SRC09 Tablo 3.2: the 33.8 pt "Literatür"
      // header); a fixed-layout table keeps its column widths and wraps anyway (Word ignores noWrap there, SRC09 Tablo 2.8).
      const noWrap = /<w:noWrap\b(?![^>]*w:val="(?:0|false|off)")/.test(node.properties?.cellPropertiesXml || "") && !fixed;
      if (noWrap) rules.push(`${sel(node.id)} p{white-space:nowrap !important}`);
      // Exact row: a cell's CSS height is only a minimum, so the row's cells hold a presentation wrapper (tableSemantics.js decorates it,
      // thesisSourceHtml strips it) whose height clips the content at the declared text-area edge like Word.
      // Vertical cell text (w:textDirection btLr / tbRl): the wrapper turns the text and wraps it at the row height (Word breaks the
      // lines at the declared row height instead of growing the row to the full text length), the lines stack across the cell width.
      const direction = node.attributes?.["data-docx-text-dir"];
      if ((direction === "btLr" || direction === "tbRl") && spans === 1) rules.push(`${sel(node.id)}>txt-table-cell-content{display:block;writing-mode:${direction === "btLr" ? "sideways-lr" : "vertical-rl"};${heightRule ? `height:${mm3(heightRule.mm)};` : ""}${heightRule?.exact ? "overflow:hidden;" : ""}box-sizing:border-box}`);
      else if (heightRule?.exact && spans === 1) rules.push(`${sel(node.id)}>txt-table-cell-content{display:${valign === "center" || valign === "bottom" ? "flex;flex-direction:column;justify-content:safe " + (valign === "center" ? "center" : "flex-end") : "block"};height:${mm3(heightRule.mm)};overflow:hidden;box-sizing:border-box}`);
      rules.push(`${sel(node.id)}{padding:${mm3(m.top)} ${mm3(m.right)} ${mm3(m.bottom)} ${mm3(m.left)} !important${cellWidth > 0 ? `;width:${mm3(cellWidth)};box-sizing:border-box` : ""}${height}${valign ? `;vertical-align:${valign === "center" ? "middle" : valign}` : ""}${noWrap ? ";white-space:nowrap !important" : ""};${["top", "right", "bottom", "left"].map((side, at) => borderDecl(side, sides[at])).join(";")}}`);
      // Word adds the border at its declared width (0.5 pt) to the row; the browser rounds it to a whole CSS px (0.75 pt). The last paragraph
      // of the cell gives the difference back so every row advances like Word's (31.47 pt, not 31.72 pt, for a 11 pt line + 6 pt spaces).
      const rule0 = borderWidthPt(sides[2]), tail = snappedBorderPt(rule0) - rule0;
      const lastParagraph = [...(node.children || [])].reverse().find((child) => child.type !== "paragraph" || child.id) ;
      if (spans === 1 && Math.abs(tail) > 0.01 && lastParagraph?.type === "paragraph" && /^[\w:-]+$/.test(lastParagraph.id)) {
        const after = Number(lastParagraph.properties?.resolvedSource?.spaceAfterPt ?? lastParagraph.properties?.direct?.spaceAfterPt ?? 0) || 0;
        rules.push(`${sel(lastParagraph.id)}{margin-bottom:${Math.round((after - tail) * 100) / 100}pt !important}`);
      }
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
/**
 * Word starts the text of a list item (suffix "tab") at the first tab stop after the marker: an explicit stop between the marker's end and
 * the hanging indent wins over the indent (SRC10 "GvdeMetni1": stop at 28.1 pt, indent at 36 pt, so the first line is 7.9 pt wider than
 * the lines below it). Returns the marker and how far the first line starts left of the text edge (mm), or null when it starts at the edge.
 * Marker widths are estimated in em (digits/letters 0.5, punctuation 0.3, bullets 0.46); only the choice of stop depends on them.
 */
function listTabShift(node, style, textEdge, base) {
  const list = node.properties?.list;
  const hanging = node.properties?.direct?.hangingIndentMm ?? list?.paragraph?.hangingIndentMm;
  if (!list || (list.suffix || "tab") !== "tab" || !(hanging > 0) || !Number.isFinite(textEdge) || !Array.isArray(style?.tabStops)) return null;
  const level = Number(list.level) || 0;
  let text = String(list.text ?? "");
  if (list.format !== "bullet") {
    const ordinal = node.properties?.ordinal ?? list.start;
    if (!Number.isFinite(Number(ordinal)) || [...text.matchAll(/%([1-9])/g)].some((m) => Number(m[1]) !== level + 1)) return null;
    text = text.replace(/%[1-9]/g, formatListNumber(ordinal, list.format));
  }
  if (!text.trim() || list.run?.hidden === true) return null;
  const size = list.run?.fontSizePt > 0 ? list.run.fontSizePt : (style.fontSizePt > 0 ? style.fontSizePt : base?.fontSizePt || 12);
  const em = list.format === "bullet" ? 0.46 * [...text].length : [...text].reduce((sum, ch) => sum + (/[\p{L}\p{N}]/u.test(ch) ? 0.5 : 0.3), 0);
  const markerEnd = textEdge - hanging + em * size * 25.4 / 72;
  const stop = style.tabStops.filter((tab) => (tab.align || "left") === "left" && tab.positionMm > markerEnd + 0.05 && tab.positionMm < textEdge - 0.2).map((tab) => tab.positionMm).sort((a, b) => a - b)[0];
  if (stop === undefined) return null;
  return { shiftMm: textEdge - stop, hangingMm: hanging, text, run: list.run || {} };
}
const cssText = (text) => [...text].map((ch) => { const code = ch.codePointAt(0); return code < 32 || code > 126 || ch === '"' || ch === "\\" ? `\\${code.toString(16)} ` : ch; }).join("");
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
/** First and last paragraph (document order, tables and containers skipped) of a section's node list. */
function edgeParagraphs(nodes) {
  let first = null, last = null;
  const visit = (list) => {
    for (const node of list || []) {
      if (node.type === "paragraph") { first ||= node; last = node; continue; }
      if (node.type === "table" || node.type === "container") { if (!first) first = false; last = null; continue; }
      visit(node.children);
    }
  };
  visit(nodes);
  return { first: first || null, last };
}
/**
 * A section that starts a new page (next/odd/even page break) puts its first paragraph at the top of the page with the paragraph's
 * space before reduced by the space after of the previous section's last paragraph (MEASURED in real Word: 72 pt before after a 6 pt
 * after lands 66 pt below the margin, 60 pt after 12 pt, 72 pt after 0; a natural page break drops the space entirely). The browser
 * keeps the full margin after a forced break, so the difference is taken off that paragraph's margin-top (node id -> pt).
 */
function sectionStartMargins(document) {
  const margins = new Map();
  const spacingOf = (node) => (document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct) || {};
  let previous = null;
  for (const section of document.sections || []) {
    const { first, last } = edgeParagraphs(section.nodes);
    const breaks = section.properties?.breakType;
    if (previous && breaks && breaks !== "continuous" && first?.id && /^[\w:-]+$/.test(first.id)) {
      const after = Number(spacingOf(previous).spaceAfterPt), before = Number(spacingOf(first).spaceBeforePt);
      if (after > 0 && before > 0) margins.set(first.id, Math.max(0, Math.round((before - after) * 100) / 100));
    }
    previous = last;
  }
  return margins;
}
export function importedContentCss(document) {
  if (!["docx", "pdf"].includes(document?.source?.format)) return "";
  // Word gives an empty paragraph a full line (paragraph mark height + spacing); an empty <p> has no line box in HTML, so a zero-width strut
  // restores it. Only paragraphs without a visible element child match (bookmarks and hidden markers are not content; text-only paragraphs
  // already have lines, so it changes nothing there).
  const emptyParagraphs = [];
  const startMargins = sectionStartMargins(document);
  const rules = [".thesis-body [data-docx-vmerge=continue]{display:none !important}.thesis-body [data-docx-break=page]{break-after:column}",
    // Word shows no space before on the first plain paragraph of an imported group (SRC09 s.87: first text line at 98.0 pt, not 104.7 pt).
    '.thesis-paper[data-thesis-layout="paged"] .thesis-page-flow > .thesis-flow-section:first-child .rich-text-body > p:first-child{margin-top:0 !important}'];
  // "Don't add space between paragraphs of the same style" (w:contextualSpacing): consecutive paragraphs of one style, either of which has
  // the property, lose the space between them. Adjacency follows document order through lists; tables and containers break the chain.
  const contextual = new Map();
  const listItemIds = new Map();
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
  // `inDrawing`: paragraphs of a text box belong to the shape, not to the body's paragraph chain (contextual spacing, adjacency).
  const walk = (nodes, base, itemEdge = null, inCell = false, inDrawing = false) => {
    for (const node of nodes) {
      if (BREAKS_CHAIN.has(node.type) && !inDrawing) previousParagraph = null;
      if (node.type === "paragraph" && !inDrawing && node.id && /^[\w:-]+$/.test(node.id) && !vanishesInWord(node)) markContextual(node);
      if (node.type === "paragraph" && node.id && /^[\w:-]+$/.test(node.id) && !vanishesInWord(node) && !paragraphHasContent(node)) emptyParagraphs.push(node.id);
      // A paragraph whose mark is hidden and that holds nothing but anchors vanishes with its spacing in Word.
      if (node.id && /^[\w:-]+$/.test(node.id) && vanishesDeep(node)) { rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]${node.type === "paragraph" ? "[data-docx-style]" : ""}{display:none !important}`); continue; }
      if (node.id && /^[\w:-]+$/.test(node.id)) {
        const style = document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
        const cellMark = inCell && node.type === "paragraph" && !(style?.fontSizePt > 0) ? node.properties?.paragraphMarkRun?.fontSizePt : undefined;
        const lineBase = node.type === "paragraph" ? largestRunBase(node, inCell ? cellParagraphBase(node, base) : base, document.formatMode) : base;
        // Runs all smaller than the body: the paragraph (strut) takes their size too, or the 12 pt strut and the 11 pt runs share
        // one fixed line height on different baselines and the line box grows by the difference (about 1 px per line).
        // Runs LARGER than the body and all of one size (a 13 pt heading under the template's 14 pt heading strut): the strut takes the run
        // size too, or the strut and the runs sit on different baselines and the line box grows (a heading pitch of 23.1 pt instead of Word's 22.4 pt).
        const largeMark = node.type === "paragraph" && !inCell && !(style?.fontSizePt > 0) && lineBase.fontSizePt > (base?.fontSizePt || 12) && uniformRunSize(node, document.formatMode) === lineBase.fontSizePt;
        const smallRuns = node.type === "paragraph" && !inCell && !(style?.fontSizePt > 0) && lineBase.fontSizePt > 0 && (lineBase.fontSizePt < (base?.fontSizePt || 12) || largeMark) ? `font-size:${lineBase.fontSizePt}pt` : "";
        const pictureLine = node.type === "paragraph" && !inCell && pictureOnlyParagraph(node);
        const tail = pictureLine ? pictureTailPt(node, style, base) : 0;
        const effect = pictureLine ? pictureEffectPt(node) : null;
        const bottom = Math.round(((effect?.bottom || 0) + tail) * 100) / 100, top = effect?.top || 0;
        const css = [style ? declarations(style, lineBase) : "", cellMark > 0 ? `font-size:${cellMark}pt` : "", smallRuns, top ? `padding-top:${top}pt` : "", bottom ? `padding-bottom:${bottom}pt` : "", startMargins.has(node.id) ? `margin-top:${startMargins.get(node.id)}pt` : ""].filter(Boolean).join(";");
        if (css) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{${css}}`);
        // A <br> is inline and Blink ignores break-after on it: the paragraph that holds a manual page break ends its page (compat 15 keeps the
        // paragraph mark with the break). A per-node rule, not :has(), which would be matched against every element of a long document.
        if (node.type === "paragraph" && !inDrawing && endsWithPageBreak(node)) rules.push(`.thesis-paper .thesis-body p[data-txt-node-id="${node.id}"][data-txt-node-id]{break-after:column}`);
        // Own terminal leading smaller than the column's (a single-spaced caption/source line in a 1.5-spaced body): the paragraph needs
        // the difference as extra room before its lines may sit at the page end. Body paragraphs only: cells (td::after guards the cell end), list items, text boxes and pictures keep theirs.
        if (node.type === "paragraph" && !inDrawing && itemEdge === null && !inCell && !pictureOnlyParagraph(node) && style) {
          const own = ownTerminalLeadingMm({ ...lineBase, ...style });
          if (own !== null) {
            const guard = `max(0mm,calc(var(--thesis-col-lead,0mm) - ${own}mm))`;
            const target = `.thesis-paper .thesis-body p[data-txt-node-id="${node.id}"][data-txt-node-id]:not([data-thesis-fn-stamp="reserve"])`;
            rules.push(`${target}{box-decoration-break:clone;padding-bottom:${guard} !important}`, `${target}::after{content:"";display:block;height:0;margin:0 0 calc(-1 * ${guard});break-before:avoid}`);
          }
        }
      }
      // Word splits a table between rows wherever the page ends unless its paragraphs chain with keep-with-next; the editor's
      // `table{break-inside:avoid}` (whole-table moves) is a template-authoring rule and must not apply to imported tables.
      if (node.type === "table" && node.id && /^[\w:-]+$/.test(node.id) && !tableChainsWithNext(node, document.formatMode)) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{break-inside:auto}`);
      // Word draws an inline picture at its declared extent whatever the pixel aspect of the bitmap (a stretched picture stays stretched);
      // the engine's `height:auto` would follow the bitmap. A <ratio> without `auto` overrides the natural ratio of the replaced element.
      // (A stylesheet rule, not a style attribute: the app's CSP forbids inline style attributes.)
      if (node.type === "image" && node.tag === "img" && node.id && /^[\w:-]+$/.test(node.id) && !node.attributes?.["data-img-wrap"] && !node.attributes?.["data-img-crop"]) {
        const w = Number(node.attributes?.width), h = Number(node.attributes?.height);
        if (w > 0 && h > 0) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{aspect-ratio:${w} / ${h};object-fit:fill}`);
      }
      if (node.type === "table") rules.push(...importedTableCss(node, document.styles), ...importedRowRules(node, { split: !tableChainsWithNext(node, document.formatMode) }));
      if (node.type === "listItem" && node.id && /^[\w:-]+$/.test(node.id)) {
        const paragraph = (node.children || []).find((child) => child.type === "paragraph");
        if (paragraph?.id) listItemIds.set(paragraph.id, node.id);
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
        const tabShift = listTabShift(node, document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct, textEdge, base);
        if (Number.isFinite(textEdge)) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${node.id}"][data-txt-node-id]{margin-left:${mmText(Math.max(0, textEdge - itemEdge))};text-indent:${tabShift ? mmText(-tabShift.shiftMm) : "0"}${tabShift ? ";position:relative" : ""}${lead ? `;padding-top:${lead}pt` : ""}}`);
        // The native outside marker sits at the text edge, where the shifted first line now starts: draw it at the hanging position instead.
        if (tabShift && listItemIds.has(node.id)) {
          const { hidden: _hidden, ...run } = tabShift.run;
          rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${listItemIds.get(node.id)}"][data-txt-node-id]{list-style:none}`,
            `.thesis-paper .thesis-body p[data-txt-node-id="${node.id}"][data-txt-node-id]::before{content:"${cssText(tabShift.text)}";position:absolute;left:-${mmText(tabShift.hangingMm)};text-indent:0;white-space:nowrap;${declarations(run, {})}}`);
        }
      }
      walk(node.children || [], base, childEdge, inCell || node.type === "cell", inDrawing || node.type === "drawing");
      if (BREAKS_CHAIN.has(node.type) && !inDrawing) previousParagraph = null;
    }
  };
  document.sections.forEach(s => { previousParagraph = null; walk(s.nodes, s.properties?.rules?.body || {}); });
  for (let at = 0; at < emptyParagraphs.length; at += 200) rules.push(`${emptyParagraphs.slice(at, at + 200).map((id) => `.thesis-body p[data-txt-node-id="${id}"]::before`).join(",")}{content:"\\200b"}`);
  for (const [id, edge] of contextual) rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]{${edge.top ? "margin-top:0;" : ""}${edge.bottom ? "margin-bottom:0;" : ""}}`);
  rules.push(...importedHeadingNumberRules(document));
  rules.push(...importedShapeCss(document));
  return rules.join("\n");
}
