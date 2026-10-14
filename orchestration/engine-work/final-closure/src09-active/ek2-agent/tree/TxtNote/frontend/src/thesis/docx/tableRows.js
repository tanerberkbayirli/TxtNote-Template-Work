/**
 * Row-level page behaviour of an imported Word table (kept out of projection.js, which several writers edit).
 *
 * Word splits a row across pages unless its `w:trPr` carries `w:cantSplit`; the editor's paged layout keeps every `tr` whole
 * (`tr{break-inside:avoid}`), so a tall row jumps to the next page and leaves a gap Word does not have (SRC09 tables, Word 104-121).
 * Repeating `w:tblHeader` rows is done by tableContinuation.js (Chrome's multicol fragmentation repeats neither a thead nor a
 * `display:table-header-group` row: measured, so no CSS rule is emitted for it).
 */
const SAFE_ID = /^[\w:-]+$/;
const flagOn = (xml, name) => {
  const m = new RegExp(`<w:${name}\\b([^>]*?)/?>`).exec(xml || "");
  return Boolean(m) && !/w:val="(?:false|0|off)"/.test(m[1]);
};
const sel = (id) => `.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]`;

export const rowCantSplit = (row) => flagOn(row?.properties?.rowPropertiesXml, "cantSplit");
export const rowRepeatsAsHeader = (row) => flagOn(row?.properties?.rowPropertiesXml, "tblHeader");

/** Rows of this table only (nested tables own theirs), in document order. */
export function ownRows(table) {
  const rows = [];
  const collect = (node) => { if (node.type === "row") rows.push(node); else if (node.type !== "cell" && node.type !== "table") (node.children || []).forEach(collect); };
  (table.children || []).forEach(collect);
  return rows;
}

/** CSS rules of one imported table's rows: split behaviour. */
export function importedRowRules(table, { split = true } = {}) {
  if (!table || table.type !== "table") return [];
  const rows = ownRows(table).filter((row) => row.id && SAFE_ID.test(row.id));
  const rules = rows.filter((row) => split || rowCantSplit(row)).map((row) => `${sel(row.id)}{break-inside:${rowCantSplit(row) ? "avoid" : "auto"} !important}`);
  return rules;
}
