/**
 * Manual bibliography entries for academic papers (one item per source).
 */

export function bibliographyItemsFromResearch(data) {
  if (Array.isArray(data?.docBibliographyItems)) {
    return data.docBibliographyItems.map((item) => String(item ?? ""));
  }
  const legacy = String(data?.docBibliography ?? "");
  if (!legacy.trim()) return [""];
  return legacy.split(/\r?\n/).map((line) => line.trimEnd());
}

export function normalizeBibliographyItems(items) {
  const list = Array.isArray(items) ? items.map((item) => String(item ?? "")) : [""];
  return list.length ? list : [""];
}

export function bibliographyItemsForExport(doc) {
  const raw = Array.isArray(doc?.docBibliographyItems)
    ? doc.docBibliographyItems
    : bibliographyItemsFromResearch(doc);
  return normalizeBibliographyItems(raw)
    .map((item) => item.trim())
    .filter(Boolean);
}
