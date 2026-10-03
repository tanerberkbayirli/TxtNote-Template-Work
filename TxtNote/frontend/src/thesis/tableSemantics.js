import { parseAcademicHtml } from "../lib/academicDocument.js";

/** Shared, opt-in table properties. Row value is Word's trHeight (content mm). */
export function tableSemanticsCss(scope, section) {
  const rule = section.rules.tables;
  const table = `${scope} .thesis-body table`;
  const out = [];
  if (rule.cantSplit !== undefined) out.push(`${table} tr{break-inside:${rule.cantSplit ? "avoid" : "auto"}}`);
  if (rule.repeatHeader === false) out.push(`${table} thead{display:table-row-group}`);
  if (rule.verticalAlign) out.push(`${table} :is(td,th){vertical-align:${rule.verticalAlign === "center" ? "middle" : rule.verticalAlign}}`);
  if (rule.rowHeight) {
    const { rule: mode, valueMm } = rule.rowHeight;
    // Exact trHeight includes cell padding; unlike atLeast, padding cannot grow
    // the row. Oversized content starts at the top instead of hiding its start.
    const padding = rule.cellPadding ? (rule.cellPadding.topMm || 0) + (rule.cellPadding.bottomMm || 0) : rule.borders?.preset ? 0 : 12 * 25.4 / 72;
    const contentHeight = mode === "exact" ? Math.max(0, valueMm - padding) : valueMm;
    if (mode !== "auto") out.push(`${table} txt-table-cell-content{display:${rule.verticalAlign ? "flex" : "block"};${rule.verticalAlign ? `flex-direction:column;justify-content:safe ${{ top: "flex-start", center: "center", bottom: "flex-end" }[rule.verticalAlign]};` : ""}${mode === "exact" ? "height" : "min-height"}:${contentHeight}mm;${mode === "exact" ? "overflow:hidden;" : ""}}`);
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
    return `${b.widthPt ?? 0.5}pt ${b.style === "single" ? "solid" : b.style || "solid"} #${(b.color || "000000").replace(/^#/, "")}`;
  };
  const selectors = {
    insideHorizontal: `${table} tr>*`, insideVertical: `${table} tr>*`,
    top: `${table}>thead>tr:first-child>*,${table}:not(:has(>thead))>tbody:first-of-type>tr:first-child>*`,
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
  for (const block of parseAcademicHtml(section.html || "").filter((b) => b.type === "table" && b.colWidths?.length)) {
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
    let wrapper = [...cell.children].find((node) => node.tagName === "TXT-TABLE-CELL-CONTENT");
    if (active && !wrapper) {
      wrapper = cell.ownerDocument.createElement("txt-table-cell-content");
      while (cell.firstChild) wrapper.appendChild(cell.firstChild);
      cell.appendChild(wrapper);
    } else if (!active && wrapper) wrapper.replaceWith(...wrapper.childNodes);
  }
}
