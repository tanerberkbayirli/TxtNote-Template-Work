/**
 * Canonical, document-local layout overrides for thesis documents.
 * Geometry is stored in millimetres and text style uses schema.d.ts TextStyle keys.
 * This module only resolves data; renderers remain responsible for presentation.
 */

import { MM_PER_PT } from "./units.js";

const LAYOUT_VERSION = 1;
const LAYOUT_MODES = new Set(["flow", "anchored", "absolute"]);
const ELEMENT_TYPES = new Set(["text", "image", "separator"]);
const SAFE_ALIGNMENTS = new Set(["left", "center", "right"]);
const SAFE_TEXT_DECORATIONS = new Set([
  "none", "underline", "overline", "line-through",
  "underline line-through", "underline overline", "overline line-through",
]);
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const STYLE_NUMBER_KEYS = new Set([
  "fontSizePt", "fontWeight", "lineHeight", "characterSpacingPt",
  "spaceBeforePt", "spaceAfterPt", "firstLineIndentMm", "leftIndentMm", "rightIndentMm",
]);
const STYLE_BOOLEAN_KEYS = new Set(["italic", "pageBreakBefore", "keepWithNext"]);
const STYLE_KEYS = new Set([
  ...STYLE_NUMBER_KEYS, ...STYLE_BOOLEAN_KEYS, "fontFamily", "decoration", "align", "textTransform", "color",
]);
const TEXT_TRANSFORMS = new Set(["none", "uppercase", "lowercase", "capitalize"]);
const PAGE_KEYS = new Set(["size", "widthMm", "heightMm", "orientation", "margins", "header", "footer", "numbering"]);
const NUMBER_FORMATS = new Set(["arabic", "roman-lower", "roman-upper", "alpha-lower", "alpha-upper"]);

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const safeId = (value) => typeof value === "string" && value.trim() && !FORBIDDEN_KEYS.has(value.trim()) ? value.trim() : "";
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const cloneRecord = (value) => isRecord(value) ? { ...value } : {};
const safeText = (value) => typeof value === "string" ? value : undefined;

export function normalizeLayoutTextStyle(style) {
  if (!isRecord(style)) return {};
  const result = {};
  for (const [key, value] of Object.entries(style)) {
    if (!STYLE_KEYS.has(key)) continue;
    if (STYLE_NUMBER_KEYS.has(key) && finite(value) && (!(key === "fontSizePt" || key === "lineHeight") || value > 0)) result[key] = value;
    else if (STYLE_BOOLEAN_KEYS.has(key) && typeof value === "boolean") result[key] = value;
    else if (key === "fontFamily" && typeof value === "string" && value.trim()) result.fontFamily = value.trim().slice(0, 256);
    else if (key === "decoration" && SAFE_TEXT_DECORATIONS.has(value)) result.decoration = value;
    else if (key === "align" && new Set(["left", "center", "right", "justify"]).has(value)) result.align = value;
    else if (key === "textTransform" && TEXT_TRANSFORMS.has(value)) result.textTransform = value;
    else if (key === "color" && typeof value === "string" && /^#[0-9a-f]{6}$/iu.test(value)) result.color = value.toLowerCase();
  }
  return result;
}

const normalizeStyle = normalizeLayoutTextStyle;

function normalizeMargins(value) {
  if (!isRecord(value)) return undefined;
  const margins = {};
  for (const key of ["topMm", "bottomMm", "leftMm", "rightMm"]) {
    if (finite(value[key]) && value[key] >= 0) margins[key] = value[key];
  }
  return margins;
}

function normalizeHeaderFooter(value) {
  if (!isRecord(value)) return undefined;
  const result = {};
  for (const key of ["heightMm", "distanceMm"]) if (finite(value[key]) && value[key] >= 0) result[key] = value[key];
  if (typeof value.content === "string") result.content = value.content;
  if (["same", "omit"].includes(value.firstPage)) result.firstPage = value.firstPage;
  return result;
}

function normalizeNumbering(value) {
  if (!isRecord(value)) return undefined;
  const result = {};
  if (typeof value.enabled === "boolean") result.enabled = value.enabled;
  if (["top", "bottom"].includes(value.position)) result.position = value.position;
  if (SAFE_ALIGNMENTS.has(value.align)) result.align = value.align;
  if (NUMBER_FORMATS.has(value.format)) result.format = value.format;
  if (finite(value.startAt) && Number.isInteger(value.startAt) && value.startAt >= 1) result.startAt = value.startAt;
  if (typeof value.restart === "boolean") result.restart = value.restart;
  return result;
}

/** Keep only known page fields and finite, correctly typed values from imported JSON. */
function normalizePageOverride(value) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const key of PAGE_KEYS) {
    const field = value[key];
    if (key === "widthMm" || key === "heightMm") {
      if (finite(field) && field > 0) result[key] = field;
    } else if (key === "orientation" && ["portrait", "landscape"].includes(field)) result.orientation = field;
    else if (key === "size" && typeof field === "string" && /^[\w -]{1,40}$/u.test(field)) result.size = field;
    else if (key === "margins") {
      const margins = normalizeMargins(field);
      if (margins) result.margins = margins;
    } else if (key === "header" || key === "footer") {
      const box = normalizeHeaderFooter(field);
      if (box) result[key] = box;
    } else if (key === "numbering") {
      const numbering = normalizeNumbering(field);
      if (numbering) result.numbering = numbering;
    }
  }
  return result;
}

function normalizeElementFields(value, { addition = false } = {}) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const key of ["xMm", "yMm"]) if (finite(value[key])) result[key] = value[key];
  for (const key of ["widthMm", "heightMm"]) if (finite(value[key]) && value[key] > 0) result[key] = value[key];
  if (finite(value.flowHeightMm) && value.flowHeightMm >= 0) result.flowHeightMm = value.flowHeightMm;
  if (LAYOUT_MODES.has(value.layoutMode)) result.layoutMode = value.layoutMode;
  const style = normalizeStyle(value.style);
  if (Object.keys(style).length) result.style = style;
  for (const key of ["editableContent", "editableLayout", "locked", "deleted", "lockAspectRatio"]) {
    if (typeof value[key] === "boolean") result[key] = value[key];
  }
  if (Number.isSafeInteger(value.zIndex)) result.zIndex = value.zIndex;
  if (typeof value.content === "string") result.content = value.content;
  if (typeof value.text === "string") result.text = value.text;

  if (addition) {
    const id = safeId(value.id);
    const type = ELEMENT_TYPES.has(value.type) ? value.type : "";
    if (id) result.id = id;
    if (type) result.type = type;
    if (type === "text") {
      const text = typeof value.text === "string" ? value.text : typeof value.content === "string" ? value.content : undefined;
      if (text !== undefined) { result.text = text; result.content = text; }
    }
    const sectionId = safeId(value.sectionId);
    if (sectionId) result.sectionId = sectionId;
    if (type === "image" && typeof value.source === "string" && /^data:image\/(?:png|jpe?g);base64,[A-Za-z0-9+/]+={0,2}$/u.test(value.source)) result.source = value.source;
    if (type === "separator") {
      if (finite(value.thicknessPt) && value.thicknessPt > 0 && value.thicknessPt <= 12) result.thicknessPt = value.thicknessPt;
      if (finite(value.lengthPercent) && value.lengthPercent > 0 && value.lengthPercent <= 100) result.lengthPercent = value.lengthPercent;
      if (SAFE_ALIGNMENTS.has(value.align)) result.align = value.align;
    }
  }
  return result;
}

function normalizeElementMap(value) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const [rawId, rawOverride] of Object.entries(value)) {
    const id = safeId(rawId);
    if (!id || !isRecord(rawOverride)) continue;
    const override = normalizeElementFields(rawOverride);
    if (Object.keys(override).length) result[id] = override;
  }
  return result;
}

function normalizeAdditionList(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const raw of value) {
    const addition = normalizeElementFields(raw, { addition: true });
    if (!addition.id || !addition.sectionId || !ELEMENT_TYPES.has(addition.type)) continue;
    if (addition.type === "image" && !addition.source) continue;
    if (!addition.layoutMode) addition.layoutMode = "absolute";
    result.push(addition);
  }
  return result;
}

function normalizeGuideList(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((guide) => {
    const id = safeId(guide?.id);
    const axis = ({ vertical: "x", horizontal: "y" })[guide?.axis] || guide?.axis;
    if (!id || !["x", "y"].includes(axis) || !finite(guide.positionMm) || guide.positionMm < 0) return [];
    return [{ id, axis, positionMm: guide.positionMm, ...(typeof guide.locked === "boolean" ? { locked: guide.locked } : {}),
      ...(safeId(guide.sectionId) ? { sectionId: guide.sectionId } : {}),
      ...(Number.isInteger(guide.pageIndex) && guide.pageIndex >= 0 ? { pageIndex: guide.pageIndex } : {}) }];
  });
}

function normalizePageMap(value) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const [key, page] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    result[key] = normalizePageOverride(page);
  }
  return result;
}

/** Normalize persisted layout data without trusting imported objects or CSS fields. */
export function normalizeThesisLayout(value) {
  const source = isRecord(value?.layout) && value.version === undefined ? value.layout : value;
  const layout = isRecord(source) ? source : {};
  const sections = {};
  if (isRecord(layout.sections)) {
    for (const [sectionId, page] of Object.entries(layout.sections)) {
      if (safeId(sectionId)) sections[sectionId] = normalizePageOverride(page);
    }
  }
  return {
    version: LAYOUT_VERSION,
    elements: normalizeElementMap(layout.elements),
    additions: normalizeAdditionList(layout.additions),
    guides: normalizeGuideList(layout.guides),
    page: normalizePageOverride(layout.page),
    sections,
    pages: normalizePageMap(layout.pages),
    typography: {
      document: normalizeStyle(layout.typography?.document),
      sections: Object.fromEntries(Object.entries(isRecord(layout.typography?.sections) ? layout.typography.sections : {})
        .filter(([id]) => safeId(id)).map(([id, style]) => [id, normalizeStyle(style)])),
    },
  };
}

function mergePageRules(basePage, override) {
  const page = { ...cloneRecord(basePage), ...override };
  for (const key of ["margins", "header", "footer", "numbering"]) {
    if (isRecord(basePage?.[key]) || isRecord(override?.[key])) {
      page[key] = { ...cloneRecord(basePage?.[key]), ...cloneRecord(override?.[key]) };
    }
  }
  return page;
}

/** Resolve template → document → section → individual-page page geometry. */
export function resolveLayoutPage(templatePage, sectionId, pageIndex, thesisLayout) {
  const layout = normalizeThesisLayout(thesisLayout);
  const section = layout.sections[sectionId] || {};
  const page = layout.pages[`${sectionId}:${pageIndex}`] || {};
  return mergePageRules(mergePageRules(mergePageRules(templatePage, layout.page), section), page);
}

function elementId(element) {
  if (safeId(element?.id)) return safeId(element.id);
  if (safeId(element?.sectionId) && typeof element?.path === "string") {
    return `${element.sectionId}:block:${element.path.replace(/-/g, ".")}`;
  }
  return "";
}

function applyElementOverride(base, id, override) {
  const node = { ...base };
  if (override?.deleted) return null;
  if (override) {
    Object.assign(node, override);
    if (override.style) node.style = { ...cloneRecord(base.style), ...override.style };
    const text = typeof override.content === "string" ? override.content : override.text;
    if (typeof text === "string" && node.type === "text") node.text = text;
  }
  node.id = id;
  return node;
}

/** Resolve one template or addition element with its document override. */
export function resolveLayoutElement(base, thesisLayout) {
  if (!isRecord(base)) return base;
  const id = elementId(base);
  if (!id) return { ...base };
  const layout = normalizeThesisLayout(thesisLayout);
  const addition = layout.additions.find((entry) => entry.id === id);
  const override = layout.elements[id] || (addition ? Object.fromEntries(Object.entries(addition).filter(([key]) => !["id", "type", "sectionId", "source", "thicknessPt", "lengthPercent", "align"].includes(key))) : undefined);
  const resolved = applyElementOverride(base, id, override);
  return resolved || null;
}

function resolvedBaseNode(node, id, sectionId, override) {
  const resolved = applyElementOverride(node, id, override);
  if (!resolved) return null;
  resolved.sectionId = sectionId;
  resolved.layoutMode = override?.layoutMode || "flow";
  resolved.locked = override?.locked ?? false;
  resolved.editableLayout = override?.editableLayout ?? true;
  resolved.editableContent = override?.editableContent ?? (resolved.type === "text");
  resolved.lockAspectRatio = override?.lockAspectRatio ?? false;
  resolved.zIndex = override?.zIndex ?? 0;
  return resolved;
}

function normalizeAdditionForNode(addition, baseStyle, override) {
  const style = { ...cloneRecord(baseStyle), ...cloneRecord(addition.style), ...cloneRecord(override?.style) };
  const content = typeof override?.content === "string" ? override.content : typeof override?.text === "string" ? override.text : addition.text ?? addition.content;
  const node = {
    ...addition,
    path: `layout-addition-${encodeURIComponent(addition.id)}`,
    ...(addition.type === "text" ? { text: content ?? "", style } : {}),
    ...(addition.type === "image" ? { source: addition.source } : {}),
    ...(addition.type === "separator" ? { thicknessPt: addition.thicknessPt ?? 0.75, lengthPercent: addition.lengthPercent ?? 100, align: addition.align || "center" } : {}),
  };
  if (override?.style && addition.type === "text") node.style = { ...style, ...override.style };
  if (override) Object.assign(node, override);
  const text = typeof override?.content === "string" ? override.content : override?.text;
  if (typeof text === "string" && node.type === "text") node.text = text;
  node.id = addition.id;
  node.sectionId = addition.sectionId;
  node.layoutMode = override?.layoutMode || addition.layoutMode || "absolute";
  node.locked = override?.locked ?? addition.locked ?? false;
  node.editableLayout = override?.editableLayout ?? addition.editableLayout ?? true;
  node.editableContent = override?.editableContent ?? addition.editableContent ?? (node.type === "text");
  node.lockAspectRatio = override?.lockAspectRatio ?? addition.lockAspectRatio ?? false;
  node.zIndex = override?.zIndex ?? addition.zIndex ?? 0;
  return node;
}

/**
 * A template block taken out of the flow (absolute/anchored) keeps its original
 * slot as an unselectable spacer, so the blocks after it do not slide up under it.
 */
function flowSlot(node, positioned, override) {
  if (!["absolute", "anchored"].includes(positioned.layoutMode) || node.type === "group") return null;
  const heightMm = finite(override?.flowHeightMm) ? override.flowHeightMm : override?.heightMm ?? node.heightMm;
  if (!finite(heightMm) || heightMm <= 0) return null;
  const style = node.type === "text" ? node.style || {} : {};
  const marginTopMm = node.type === "text" ? (finite(style.spaceBeforePt) ? style.spaceBeforePt * MM_PER_PT : 0) : finite(node.marginTopMm) ? node.marginTopMm : 0;
  const marginBottomMm = node.type === "text" ? (finite(style.spaceAfterPt) ? style.spaceAfterPt * MM_PER_PT : 0) : finite(node.marginBottomMm) ? node.marginBottomMm : 0;
  return { type: "spacer", path: `${node.path ?? ""}-slot`, heightMm, marginTopMm, marginBottomMm, widthPercent: node.widthPercent ?? null, flowSlotFor: positioned.id };
}

/** Clone and annotate a resolved special-page tree; template objects stay immutable. */
export function resolveLayoutNodes(nodes, sectionId, thesisLayout, baseStyle = {}) {
  const layout = normalizeThesisLayout(thesisLayout);
  const resolved = [];
  const visit = (list) => (list || []).flatMap((node, index) => {
    if (!isRecord(node)) return [];
    if (node.flowSlotFor) return [{ ...node }];
    const path = typeof node.path === "string" ? node.path : String(index);
    const id = `${sectionId}:block:${path.replace(/-/g, ".")}`;
    const override = layout.elements[id];
    const next = resolvedBaseNode(node, id, sectionId, override);
    if (!next) return [];
    if (node.type === "group") next.blocks = visit(node.blocks);
    else if (Array.isArray(node.blocks)) next.blocks = visit(node.blocks);
    const slot = flowSlot(node, next, override);
    return slot ? [slot, next] : [next];
  });
  resolved.push(...visit(nodes));
  for (const addition of layout.additions) {
    if (addition.sectionId !== sectionId) continue;
    if (addition.deleted) continue;
    resolved.push(normalizeAdditionForNode(addition, baseStyle, layout.elements[addition.id]));
  }
  return resolved;
}

function withLayout(thesis, layout) {
  return { ...(isRecord(thesis) ? thesis : {}), layout };
}

/** Apply immutable `{ id, ...override }` editor patches to template nodes or additions. */
export function updateLayoutElements(thesis, patches) {
  const layout = normalizeThesisLayout(thesis?.layout);
  if (!Array.isArray(patches)) return withLayout(thesis, layout);
  const elements = { ...layout.elements };
  const additions = [...layout.additions];
  for (const patch of patches) {
    const id = safeId(patch?.id);
    if (!id || !isRecord(patch)) continue;
    const data = { ...patch };
    delete data.id;
    if (typeof data.text === "string" && typeof data.content !== "string") data.content = data.text;
    const normalized = normalizeElementFields(data);
    const additionIndex = additions.findIndex((entry) => entry.id === id);
    if (additionIndex >= 0) {
      const prior = additions[additionIndex];
      const merged = normalizeElementFields({ ...prior, ...normalized, style: { ...prior.style, ...normalized.style } }, { addition: true });
      if (merged.id && merged.sectionId && ELEMENT_TYPES.has(merged.type)) additions[additionIndex] = { ...prior, ...merged };
    } else {
      elements[id] = { ...elements[id], ...normalized, ...(normalized.style ? { style: { ...elements[id]?.style, ...normalized.style } } : {}) };
    }
  }
  return withLayout(thesis, { ...layout, elements, additions });
}

function nextAdditionId(layout) {
  const used = new Set([...Object.keys(layout.elements), ...layout.additions.map((entry) => entry.id)]);
  let index = 1;
  while (used.has(`layout-addition-${index}`)) index += 1;
  return `layout-addition-${index}`;
}

/** Add a supported text, embedded image, or separator element and return new thesis state. */
export function addLayoutElement(thesis, element) {
  const layout = normalizeThesisLayout(thesis?.layout);
  if (!isRecord(element) || !ELEMENT_TYPES.has(element.type)) return withLayout(thesis, layout);
  const requestedId = safeId(element.id);
  const occupied = layout.additions.some((entry) => entry.id === requestedId) || hasOwn(layout.elements, requestedId);
  const id = requestedId && !occupied ? requestedId : nextAdditionId(layout);
  const addition = normalizeElementFields({ ...element, id }, { addition: true });
  if (!addition.id || !addition.sectionId || !ELEMENT_TYPES.has(addition.type) || (addition.type === "image" && !addition.source)) return withLayout(thesis, layout);
  if (!addition.layoutMode) addition.layoutMode = "absolute";
  return withLayout(thesis, { ...layout, additions: [...layout.additions, addition] });
}

/** Delete a template element by recording a tombstone, or remove a user-created addition. */
export function deleteLayoutElement(thesis, idValue) {
  const id = safeId(idValue);
  const layout = normalizeThesisLayout(thesis?.layout);
  if (!id) return withLayout(thesis, layout);
  const additions = layout.additions.filter((entry) => entry.id !== id);
  if (additions.length !== layout.additions.length) return withLayout(thesis, { ...layout, additions });
  return withLayout(thesis, { ...layout, elements: { ...layout.elements, [id]: { ...layout.elements[id], deleted: true } } });
}

/** Copy a resolved node as a new editable addition with a fresh stable id. */
export function duplicateLayoutElement(thesis, element) {
  if (!isRecord(element) || !ELEMENT_TYPES.has(element.type)) return withLayout(thesis, normalizeThesisLayout(thesis?.layout));
  const copy = {
    type: element.type,
    sectionId: element.sectionId,
    xMm: element.xMm,
    yMm: element.yMm,
    widthMm: element.widthMm,
    heightMm: element.heightMm,
    layoutMode: element.layoutMode,
    style: element.style,
    editableContent: element.editableContent,
    editableLayout: element.editableLayout,
    locked: element.locked,
    lockAspectRatio: element.lockAspectRatio,
    zIndex: element.zIndex,
    content: element.text ?? element.content,
    source: element.source,
    thicknessPt: element.thicknessPt,
    lengthPercent: element.lengthPercent,
    align: element.align,
  };
  return addLayoutElement(thesis, copy);
}
