import { normalizeLayoutTextStyle } from "./layoutDocument.js";

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const clone = (value) => record(value) ? { ...value } : {};

function mergeNested(base, patch, keys) {
  const result = { ...clone(base), ...patch };
  for (const key of keys) if (record(base?.[key]) || record(patch[key])) result[key] = { ...clone(base?.[key]), ...clone(patch[key]) };
  return result;
}

function validatePage(page) {
  for (const key of ["widthMm", "heightMm"]) {
    if (page[key] !== undefined && (!finite(page[key]) || page[key] <= 0)) throw new TypeError(`${key} must be a positive finite number`);
  }
  for (const key of ["topMm", "bottomMm", "leftMm", "rightMm"]) {
    const value = page.margins?.[key];
    if (value !== undefined && (!finite(value) || value < 0)) throw new TypeError(`margins.${key} must be a non-negative finite number`);
  }
  if (page.widthMm !== undefined && page.margins && page.widthMm - (page.margins.leftMm ?? 0) - (page.margins.rightMm ?? 0) <= 0) {
    throw new TypeError("Page content width must be positive");
  }
  if (page.heightMm !== undefined && page.margins && page.heightMm - (page.margins.topMm ?? 0) - (page.margins.bottomMm ?? 0) <= 0) {
    throw new TypeError("Page content height must be positive");
  }
  for (const area of ["header", "footer"]) {
    for (const key of ["heightMm", "distanceMm"]) {
      const value = page[area]?.[key];
      if (value !== undefined && (!finite(value) || value < 0)) throw new TypeError(`${area}.${key} must be a non-negative finite number`);
    }
  }
  if (page.orientation !== undefined && !["portrait", "landscape"].includes(page.orientation)) throw new TypeError("orientation must be portrait or landscape");
  if (page.size !== undefined && (typeof page.size !== "string" || !page.size.trim())) throw new TypeError("size must be a non-empty string");
}

/** Apply a page-rule patch immutably at document, section, or physical-page scope. */
export function applyLayoutPage(thesis, patch, { scope = "document", sectionId, pageIndex = 0 } = {}) {
  if (!record(patch)) throw new TypeError("Page patch must be an object");
  if (!["document", "section", "page"].includes(scope)) throw new TypeError("Unknown page scope");
  if (scope !== "document" && (typeof sectionId !== "string" || !sectionId.trim())) throw new TypeError("sectionId is required for section and page scope");
  if (scope === "page" && (!Number.isInteger(pageIndex) || pageIndex < 0)) throw new TypeError("pageIndex must be a non-negative integer");
  const layout = clone(thesis?.layout);
  const key = scope === "document" ? "page" : scope === "section" ? "sections" : "pages";
  const target = scope === "document" ? "" : scope === "section" ? sectionId : `${sectionId}:${pageIndex}`;
  const current = scope === "document" ? clone(layout.page) : clone(layout[key]?.[target]);
  const next = mergeNested(current, patch, ["margins", "header", "footer", "numbering"]);
  validatePage(next);
  const updatedLayout = scope === "document"
    ? { ...layout, page: next }
    : { ...layout, [key]: { ...clone(layout[key]), [target]: next } };
  return { ...(record(thesis) ? thesis : {}), layout: updatedLayout };
}

/** Resolve base/template typography plus document and section overrides. */
export function resolveLayoutTypography(baseStyle, sectionId, layout) {
  const documentStyle = normalizeLayoutTextStyle(layout?.typography?.document);
  const sectionStyle = normalizeLayoutTextStyle(layout?.typography?.sections?.[sectionId]);
  return { ...clone(baseStyle), ...documentStyle, ...sectionStyle };
}

/** Apply a typography patch immutably at document or section scope. */
export function applyLayoutTypography(thesis, patch, { scope = "document", sectionId } = {}) {
  if (!record(patch)) throw new TypeError("Typography patch must be an object");
  if (!["document", "section"].includes(scope)) throw new TypeError("Typography scope must be document or section");
  if (scope === "section" && (typeof sectionId !== "string" || !sectionId.trim())) throw new TypeError("sectionId is required for section scope");
  const style = normalizeLayoutTextStyle(patch);
  if (Object.keys(style).length !== Object.keys(patch).length) throw new TypeError("Typography patch contains unsupported values");
  const layout = clone(thesis?.layout);
  const typography = clone(layout.typography);
  if (scope === "document") typography.document = { ...normalizeLayoutTextStyle(typography.document), ...style };
  else typography.sections = { ...clone(typography.sections), [sectionId]: { ...normalizeLayoutTextStyle(typography.sections?.[sectionId]), ...style } };
  return { ...(record(thesis) ? thesis : {}), layout: { ...layout, typography } };
}
