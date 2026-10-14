import { parseAcademicHtml } from "../lib/academicDocument.js";
import { FRAG_FIRST_ROW, HEADER_BREAK_ROW, LIST_FLUSH } from "./tableContinuation.js";

const MM_PER_PT = 25.4 / 72;
const MM_PER_PX = 25.4 / 96;
// Word draws a border at its declared width; Chrome lays borders out in whole device pixels
// (min 1 px when nonzero). Row geometry corrections in tableSemanticsCss() absorb the difference.
const chromeBorderMm = (widthMm) => (widthMm > 0 ? Math.max(1, Math.floor(widthMm / MM_PER_PX)) * MM_PER_PX : 0);

/**
 * Collapsed rule thickness above a row (mm): interior rows meet `insideHorizontal`, the first
 * row the table's `top` edge. A `double` rule paints at three times its declared width in Word
 * (two lines plus a gap; measured from the Word render), so the CSS width is tripled too.
 * `{ declared }` is Word's thickness, `{ rendered }` Chrome's whole-pixel one.
 */
export function tableRowBorders(rule) {
  const measure = (border) => {
    const widthMm = border && border.style !== "none" ? (border.widthPt ?? 0.5) * MM_PER_PT * (border.style === "double" ? 3 : 1) : 0;
    return { declared: widthMm, rendered: chromeBorderMm(widthMm) };
  };
  const custom = rule.borders || {};
  // No explicit interior rule: preset tables are stripped to `border: 0`; every other table
  // keeps the editor's default 1 px rule, which equals Word's 0.75 pt cell border.
  const interior = custom.insideHorizontal ? measure(custom.insideHorizontal)
    : custom.preset ? measure(null)
      : measure({ style: "single", widthPt: 0.75 });
  const top = custom.top ? measure(custom.top)
    : custom.preset === "threeRule" ? measure({ style: "single", widthPt: custom.widthPt ?? 0.5 })
      : custom.preset ? measure(null)
        : measure({ style: "single", widthPt: 0.75 });
  return { interior, top };
}

/** Shared, opt-in table properties. Row value is Word's trHeight (content mm). */
export function tableSemanticsCss(scope, section) {
  const rule = section.rules.tables;
  const table = `${scope} .thesis-body table`;
  const out = [];
  // Cell selectors whose top edge is the table's `top` border (mirrors the border selectors below).
  const topCells = [
    `${table}>thead>tr:first-child>*`,
    `${table}:not(:has(>thead))>tbody:first-of-type>tr:first-child>*`,
    `${table} tr[${FRAG_FIRST_ROW}]>`,
  ].map((selector) => `${selector}*`);
  out.push(`${table} :is(td,th)>:is(ul,ol)[${LIST_FLUSH}]{margin-bottom:0 !important}`);
  if (rule.cantSplit !== undefined) out.push(`${table} tr{break-inside:${rule.cantSplit ? "avoid" : "auto"}}`);
  if (rule.repeatHeader === false) out.push(`${table} thead{display:table-row-group}`);
  else out.push(`${table} tr[${HEADER_BREAK_ROW}]{break-before:column}`);
  if (rule.verticalAlign) out.push(`${table} :is(td,th){vertical-align:${rule.verticalAlign === "center" ? "middle" : rule.verticalAlign}}`);
  // Cell top padding as the CSS model sees it. Word's row height adds the declared
  // (whole-point) rule widths; Chrome rounds borders to whole pixels, so a rounded interior
  // rule is taken back out of the top padding — rows then advance exactly as Word's do.
  const topMm = typeof rule.cellPadding === "string" ? 0 : rule.cellPadding ? (rule.cellPadding.topMm || 0) : rule.borders?.preset ? 0 : 6 * MM_PER_PT;
  const borders = tableRowBorders(rule);
  if (typeof rule.cellPadding !== "string") {
    for (const [cells, edge] of [[`${table} :is(td,th)`, borders.interior], [topCells.join(","), borders.top]]) {
      const correction = edge.rendered - edge.declared;
      if (Math.abs(correction) > 0.005) out.push(`${cells}{padding-top:${Math.max(0, topMm - correction)}mm !important}`);
    }
    // A repeated header row starts mid-table: the collapsed rule above it straddles two rows and
    // only its lower half falls inside its own cells (a table's outer edge keeps the full rule), so
    // the missing half joins the top padding to place the text where Word starts the fragment.
    const straddle = borders.top.rendered / 2;
    if (straddle > 0.005) out.push(`${table} tr[${FRAG_FIRST_ROW}]>*{padding-top:${Math.max(0, topMm - (borders.top.rendered - borders.top.declared) + straddle)}mm !important}`);
  }
  if (rule.rowHeight) {
    const { rule: mode, valueMm } = rule.rowHeight;
    // Word's exact trHeight spans the row top (its rule and top margin included) to the text
    // area's bottom; only the bottom margin hangs below (row pitch = trHeight + tcMar.bottom,
    // measured per tcMar side). The wrapper is that text area, so its height is the row value
    // minus the top margin and the rule above the row. Oversized content starts at the top
    // (`safe` alignment) and is clipped at the text area's edge, exactly as Word renders it.
    const wrapper = (edge) => `${mode === "exact" ? "height" : "min-height"}:${mode === "exact" ? Math.max(0, valueMm - topMm - edge.declared) : valueMm}mm`;
    const box = (edge) => `txt-table-cell-content{display:${rule.verticalAlign ? "flex" : "block"};${rule.verticalAlign ? `flex-direction:column;justify-content: safe ${{ top: "flex-start", center: "center", bottom: "flex-end" }[rule.verticalAlign]};` : ""}${wrapper(edge)};${mode === "exact" ? "overflow:hidden;" : ""}}`;
    if (mode !== "auto") {
      out.push(`${table} ${box(borders.interior)}`);
      if (mode === "exact") out.push(`${topCells.map((cells) => `${cells} txt-table-cell-content`).join(",")}{${wrapper(borders.top)}}`);
    }
  }
  const edge = (name) => {
    const b = rule.borders?.[name];
    if (!b) {
      // Interior overrides touch both sides of collapsed borders; restore the
      // existing outer edge so an omitted edge keeps its previous meaning.
      const restore = ["top", "bottom"].includes(name) ? rule.borders?.insideHorizontal : ["left", "right"].includes(name) ? rule.borders?.insideVertical : false;
      if (!restore) return null;
      const preset = rule.borders?.preset;
      if (!preset) return "1px solid #888";
      const visible = (name === "top" && preset === "threeRule") || (name === "bottom" && ["threeRule", "headerRules"].includes(preset));
      return visible ? `${rule.borders.widthPt || 0.5}pt solid #000` : "0pt none #000";
    }
    return `${(b.widthPt ?? 0.5) * (b.style === "double" ? 3 : 1)}pt ${b.style === "single" ? "solid" : b.style || "solid"} #${(b.color || "000000").replace(/^#/, "")}`;
  };
  const selectors = {
    insideHorizontal: `${table} tr>*`, insideVertical: `${table} tr>*`,
    top: `${table}>thead>tr:first-child>*,${table}:not(:has(>thead))>tbody:first-of-type>tr:first-child>*,${table} tr[${FRAG_FIRST_ROW}]>*`,
    bottom: `${table}>tfoot>tr:last-child>*,${table}:not(:has(>tfoot))>tbody:last-of-type>tr:last-child>*`,
    left: `${table} tr>*:first-child`, right: `${table} tr>*:last-child`,
  };
  for (const [name, selector] of Object.entries(selectors)) {
    const border = edge(name);
    if (border) {
      const sides = name === "insideHorizontal" ? ["top", "bottom"] : name === "insideVertical" ? ["left", "right"] : [name];
      out.push(`${selector}{${sides.map((side) => `border-${side}:${border} !important;`).join("")}}`);
    }
  }
  // Literal percentages avoid typed attr(), which Firefox and Safari lack.
  // Width rules only inspect tables. Parsing all surrounding thesis paragraphs here
  // repeated the full semantic import on every keystroke in long documents.
  const html = section.html || "";
  let tableHtml = html;
  if (!/<table\b/i.test(html)) tableHtml = "";
  else if (typeof document !== "undefined") {
    const host = document.createElement("template");
    host.innerHTML = html;
    tableHtml = [...host.content.querySelectorAll("table")].filter((node) => !node.parentElement?.closest("table")).map((node) => node.outerHTML).join("");
  }
  for (const block of (tableHtml ? parseAcademicHtml(tableHtml) : []).filter((b) => b.type === "table" && b.colWidths?.length)) {
    const total = block.colWidths.reduce((a, b) => a + b, 0);
    const match = block.colWidths.map((width, i) => `:has(>colgroup>col:nth-child(${i + 1})[data-col-width="${width}"])`).join("");
    block.colWidths.forEach((width, i) => out.push(`${table}${match}>colgroup>col:nth-child(${i + 1}){width:${width / total * 100}%}`));
  }
  return out;
}

/** Presentation-only wrapper: CSS table-cell heights alone cannot clip exact rows. */
export function decorateTableSemantics(host, rule) {
  for (const table of host.querySelectorAll("table")) {
    const cols = [...table.querySelectorAll(":scope>colgroup>col[data-col-width]")];
    const widths = cols.map((col) => Number(col.getAttribute("data-col-width")));
    const total = widths.reduce((a, b) => a + b, 0);
    if (cols.length && widths.every((width) => Number.isFinite(width) && width > 0)) cols.forEach((col, i) => {
      const width = `${widths[i] / total * 100}%`;
      if (col.style.width !== width) col.style.width = width;
    });
  }
  const active = rule.rowHeight && rule.rowHeight.rule !== "auto";
  for (const cell of host.querySelectorAll("table td,table th")) {
    // An imported Word row with an exact trHeight (data-docx-exact) clips its cells the same way, without the template's rowHeight rule.
    const wanted = active || cell.hasAttribute("data-docx-text-dir") || (cell.parentElement?.hasAttribute("data-docx-exact") && !(Number(cell.getAttribute("rowspan")) > 1));
    let wrapper = [...cell.children].find((node) => node.tagName === "TXT-TABLE-CELL-CONTENT");
    if (wanted && !wrapper) {
      wrapper = cell.ownerDocument.createElement("txt-table-cell-content");
      while (cell.firstChild) wrapper.appendChild(cell.firstChild);
      cell.appendChild(wrapper);
    } else if (!wanted && wrapper) wrapper.replaceWith(...wrapper.childNodes);
  }
}

const MARK_LEAVES = new Set(["tab", "break", "image", "drawing", "equation"]);
const drawsSomething = (node) => {
  if (node.type === "text") return /[^ \t\r\n\f]/.test(node.text || "");
  if (MARK_LEAVES.has(node.type)) return true;
  if (node.type === "bookmark" || node.type === "annotation" || node.type === "field") return false;
  return (node.children || []).some(drawsSomething);
};
const endMarkCache = new WeakMap();

/**
 * w:hideMark ("ignore end-of-cell marker when calculating row height"): Word gives the cell's last, empty
 * paragraph no height at all. SRC09 EK-2 "Chowdury" row: the author column holds 16 paragraphs, the last
 * one empty, and Word ends the row where its list column ends (357 pt) while 16 full paragraphs would need
 * 22 pt more; the editor's longer row pushed the next header row to the following page. Returns the ids of
 * those trailing empty paragraphs (cells with more than one paragraph; the single-paragraph case is
 * handled in docx/projection.js).
 */
export function hideMarkTailParagraphIds(nativeDocument) {
  if (!nativeDocument) return [];
  const cached = endMarkCache.get(nativeDocument);
  if (cached) return cached;
  const ids = [];
  const walk = (node) => {
    if (node.attributes && Object.hasOwn(node.attributes, "hidden")) return;
    if (node.type === "cell" && /<w:hideMark\b(?![^>]*w:val="(?:0|false|off)")/.test(node.properties?.cellPropertiesXml || "")) {
      const paragraphs = (node.children || []).filter((child) => child.type === "paragraph");
      const last = paragraphs.at(-1);
      if (paragraphs.length > 1 && (node.children || []).at(-1) === last && last.id && /^[\w:-]+$/.test(last.id) && !drawsSomething(last)) ids.push(last.id);
    }
    (node.children || []).forEach(walk);
  };
  for (const section of nativeDocument.sections || []) (section.nodes || []).forEach(walk);
  endMarkCache.set(nativeDocument, ids);
  return ids;
}
