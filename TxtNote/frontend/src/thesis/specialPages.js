/**
 * Special pages (cover, approval, declaration, ...) are template sections whose
 * `blocks` describe a deterministic page layout. This module is the one generic
 * interpreter of that data: it knows block types, never universities.
 *
 * Block types:
 * - text      static template text; `{{KEY}}` placeholders are still accepted
 * - metadata  one thesis metadata value (`field`), with optional prefix/suffix/fallback
 * - image     embedded PNG/JPEG (`source`), size in mm, and alignment
 * - spacer    fixed vertical gap (`heightMm`)
 * - separator horizontal rule (`widthPercent` line length, `thicknessPt`, `align`); in a row it fills its share
 * - group     `direction: "column" | "row"` container; its `style` is inherited by children
 *
 * Any block may declare `visibleWhen: { anyFilled: ["FIELD", ...] }`: it (with its children)
 * is left out when none of those metadata values is filled, e.g. an optional co-advisor line.
 *
 * Typography inherits template body → section `overrides.body` → group `style` → block `style`.
 * Page geometry and numbering stay in the section's existing `overrides.page`.
 */
import { resolvePlaceholders } from "./engine.js";
import { convertLength } from "./units.js";

export const SPECIAL_PAGE_BLOCK_TYPES = Object.freeze(["text", "metadata", "image", "spacer", "separator", "group"]);
export const SPECIAL_PAGE_MAX_DEPTH = 4;
const PT_PER_MM = convertLength(1, "mm", "pt");

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const finite = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);
const filled = (value) => String(value ?? "").trim().length > 0;

/** Declarative block condition; a block without one is always shown. */
export function specialPageBlockVisible(block, values = {}) {
  const fields = block?.visibleWhen?.anyFilled;
  return !Array.isArray(fields) || fields.some((field) => filled(values[field]));
}

/** A section with a block layout is a standalone physical page, never part of a body flow. */
export function isSpecialPageSection(section) {
  return Array.isArray(section?.blocks);
}

/** ISO dates from the date input read as a date in the template language. */
function formatMetadataValue(value, definition, language) {
  const text = String(value ?? "");
  const iso = definition?.type === "date" && text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return text;
  const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  try {
    return new Intl.DateTimeFormat(language || "tr", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
  } catch {
    return `${iso[3]}.${iso[2]}.${iso[1]}`;
  }
}

/** Block `marginTopMm/marginBottomMm` on text are a millimetre shorthand for paragraph spacing. */
function textStyle(inherited, block) {
  const style = { ...inherited, ...block.style };
  if (Number.isFinite(block.marginTopMm)) style.spaceBeforePt = block.marginTopMm * PT_PER_MM;
  if (Number.isFinite(block.marginBottomMm)) style.spaceAfterPt = block.marginBottomMm * PT_PER_MM;
  return style;
}

/**
 * Resolve template blocks against document metadata into a render tree. Every
 * node carries its final style and text, so the editor, print HTML and later
 * exporters read the same model. Nothing here is written to the document.
 */
export function resolveSpecialPage(blocks, { definitions = {}, values = {}, baseStyle = {}, language = "tr" } = {}) {
  const missing = new Set();
  // `widthPercent` is a node's share of a row; a separator's line length is `lengthPercent`
  // of its own box (in a row the line fills the box, which has the share).
  const resolveList = (list, inherited, prefix, inRow = false) => (list || []).map((block, index) => {
    if (!specialPageBlockVisible(block, values)) return null;
    const path = prefix ? `${prefix}-${index}` : String(index);
    const box = { path, marginTopMm: finite(block.marginTopMm), marginBottomMm: finite(block.marginBottomMm), widthPercent: Number.isFinite(block.widthPercent) ? block.widthPercent : null };
    if (block.type === "image") return { ...box, type: "image", source: block.source, widthMm: block.widthMm, heightMm: block.heightMm, align: block.align || "center" };
    if (block.type === "spacer") return { ...box, type: "spacer", heightMm: finite(block.heightMm) };
    if (block.type === "separator") {
      return { ...box, type: "separator", lengthPercent: inRow ? 100 : finite(block.widthPercent, 100), thicknessPt: finite(block.thicknessPt, 0.75), align: block.align || "center" };
    }
    if (block.type === "group") {
      const style = { ...inherited, ...block.style };
      const direction = block.direction === "row" ? "row" : "column";
      return { ...box, type: "group", direction, gapMm: finite(block.gapMm), blocks: resolveList(block.blocks, style, path, direction === "row") };
    }
    const style = textStyle(inherited, block);
    if (block.type === "metadata") {
      const definition = definitions[block.field];
      if (!definition) missing.add(block.field);
      const raw = values[block.field] ?? definition?.defaultValue ?? "";
      if (definition?.required && !String(raw).trim()) missing.add(block.field);
      const value = formatMetadataValue(raw, definition, language);
      const text = String(value).trim() ? `${block.prefix || ""}${value}${block.suffix || ""}` : block.fallback ?? `${block.prefix || ""}${block.suffix || ""}`;
      return { ...box, type: "text", field: block.field, text, style };
    }
    const value = resolvePlaceholders(block.value, definitions, values);
    value.missing.forEach((key) => missing.add(key));
    return { ...box, type: "text", text: value.text, style };
  }).filter(Boolean);
  return { blocks: resolveList(blocks, baseStyle, ""), missing: [...missing] };
}

/** Depth-first walk over a resolved tree (groups before their children). */
export function* walkSpecialPage(nodes) {
  for (const node of nodes || []) {
    yield node;
    if (node.type === "group") yield* walkSpecialPage(node.blocks);
  }
}

/** Static HTML only; every visual rule lives in the scoped stylesheet (CSP: no style attributes). */
export function specialPageHtml(nodes) {
  return (nodes || []).map((node) => {
    const attrs = `data-thesis-block="${escapeHtml(node.path)}"${node.id ? ` data-layout-id="${escapeHtml(node.id)}" data-layout-section="${escapeHtml(node.sectionId)}" data-layout-type="${node.type}" data-layout-locked="${Boolean(node.locked)}" data-layout-aspect="${Boolean(node.lockAspectRatio)}"` : ""}`;
    if (node.type === "image") return `<img class="thesis-layout-image" ${attrs} src="${escapeHtml(node.source)}" alt="">`;
    if (node.type === "spacer") return `<div class="thesis-layout-spacer" ${attrs} aria-hidden="true"></div>`;
    if (node.type === "separator") return `<div class="thesis-layout-separator" ${attrs} role="presentation"></div>`;
    if (node.type === "group") return `<div class="thesis-layout-group" data-thesis-layout-direction="${node.direction}" ${attrs}>${specialPageHtml(node.blocks)}</div>`;
    return `<div class="thesis-layout-text" ${attrs}${node.field ? ` data-thesis-field="${escapeHtml(node.field)}"` : ""}>${escapeHtml(node.text).replace(/\n/g, "<br>") || "&nbsp;"}</div>`;
  }).join("");
}

/**
 * Widths (mm) of a row's children inside `widthMm`, exactly as the CSS flex row lays
 * them out: gaps come first, `widthPercent` children take that share of the row, the
 * others split what is left, and shares that do not fit shrink in proportion rather
 * than pushing past the content edge. DOCX uses it for its fixed table columns.
 */
export function specialPageRowWidths(node, widthMm) {
  const children = node.blocks || [];
  const free = Math.max(0, widthMm - node.gapMm * Math.max(0, children.length - 1));
  const fixed = children.map((child) => (child.widthPercent === null ? 0 : widthMm * child.widthPercent / 100));
  const fixedTotal = fixed.reduce((sum, value) => sum + value, 0);
  const scale = fixedTotal > free ? free / fixedTotal : 1;
  const flexible = children.filter((child) => child.widthPercent === null).length;
  const share = flexible ? (free - fixedTotal * scale) / flexible : 0;
  return children.map((child, index) => (child.widthPercent === null ? share : fixed[index] * scale));
}

/** Box geometry of one node; text typography is added by the caller's style serializer. */
export function specialPageBoxCss(node, parent) {
  const rules = [];
  if (node.type === "image") rules.push(`display:block;object-fit:contain;width:${node.widthMm}mm;height:${node.heightMm}mm;max-width:100%;margin:${node.marginTopMm}mm ${node.align === "right" ? "0" : "auto"} ${node.marginBottomMm}mm ${node.align === "left" ? "0" : "auto"};`);
  // Shares may shrink (never grow) so a row never exceeds its content box; see specialPageRowWidths.
  if (parent?.direction === "row") rules.push(node.widthPercent !== null ? `flex:0 1 ${node.widthPercent}%;` : "flex:1 1 0;", "min-width:0;");
  if (node.type === "spacer") rules.push(`height:${node.heightMm}mm;margin:${node.marginTopMm}mm 0 ${node.marginBottomMm}mm;`);
  if (node.type === "separator") {
    const left = node.align === "left" ? "0" : "auto";
    const right = node.align === "right" ? "0" : "auto";
    rules.push(`height:0;border:0;border-top:${node.thicknessPt}pt solid currentColor;width:${node.lengthPercent}%;margin:${node.marginTopMm}mm ${right} ${node.marginBottomMm}mm ${left};`);
  }
  if (node.type === "group") {
    rules.push(`display:flex;flex-direction:${node.direction};${node.direction === "row" ? "column-gap" : "row-gap"}:${node.gapMm}mm;align-items:${node.direction === "row" ? "flex-start" : "stretch"};margin:${node.marginTopMm}mm 0 ${node.marginBottomMm}mm;`);
  }
  if (Number.isFinite(node.zIndex)) rules.push(`${node.zIndex !== 0 ? "position:relative;" : ""}z-index:${node.zIndex};`);
  if (node.layoutMode === "absolute" || node.layoutMode === "anchored") {
    rules.push(`position:absolute;left:${finite(node.xMm)}mm;top:${finite(node.yMm)}mm;margin:0;max-width:none;box-sizing:border-box;`);
  }
  if (Number.isFinite(node.widthMm) && node.type !== "image") rules.push(`width:${node.widthMm}mm;max-width:none;overflow-wrap:break-word;`);
  if (Number.isFinite(node.heightMm) && node.type === "text") rules.push(`min-height:${node.heightMm}mm;`);
  if (Number.isFinite(node.minHeightMm)) rules.push(`min-height:${node.minHeightMm}mm;`);
  if (node.style?.color) rules.push(`color:${node.style.color};`);
  return rules.join("");
}

/** CSS for a resolved tree inside `scope`, one rule per node keyed by its path. */
export function specialPageCss(scope, nodes, styleCss) {
  const rules = [];
  const visit = (list, parent) => {
    for (const node of list || []) {
      rules.push(`${scope} [data-thesis-block="${node.path}"]{${node.type === "text" ? styleCss(node.style) : ""}${specialPageBoxCss(node, parent)}}`);
      if (node.type === "group") visit(node.blocks, node);
    }
  };
  visit(nodes, null);
  return rules;
}

/**
 * Linear text/spacer view of the tree for the current PDF/DOCX writers: group and
 * separator margins become spacers, row children are stacked. The tree remains
 * the canonical model for a later layout-accurate export.
 */
export function flattenSpecialPage(nodes) {
  const flat = [];
  const gap = (heightMm) => { if (heightMm > 0) flat.push({ type: "spacer", heightMm }); };
  const visit = (list) => {
    for (const node of list || []) {
      if (node.type === "image") { gap(node.marginTopMm); flat.push(node); gap(node.marginBottomMm); }
      else if (node.type === "text") flat.push({ type: "text", text: node.text, style: node.style });
      else if (node.type === "spacer") gap(node.heightMm);
      else if (node.type === "separator") gap(node.marginTopMm + node.marginBottomMm);
      else { gap(node.marginTopMm); visit(node.blocks); gap(node.marginBottomMm); }
    }
  };
  visit(nodes);
  return flat;
}

/** Structural validation; styles are checked by the caller's text-style validator. */
export function validateSpecialPageBlocks(blocks, { path, placeholders = {}, baseStyle = {}, validateStyle }, depth = 1) {
  const errors = [];
  if (!Array.isArray(blocks)) return [`${path} liste olmalı`];
  if (depth > SPECIAL_PAGE_MAX_DEPTH) return [`${path} en fazla ${SPECIAL_PAGE_MAX_DEPTH} seviye iç içe olabilir`];
  const nonnegative = (value) => Number.isFinite(value) && value >= 0;
  for (const [index, block] of blocks.entries()) {
    const at = `${path}.${index}`;
    if (!SPECIAL_PAGE_BLOCK_TYPES.includes(block?.type)) { errors.push(`${at}.type geçersiz`); continue; }
    for (const key of ["marginTopMm", "marginBottomMm"]) if (block[key] !== undefined && !nonnegative(block[key])) errors.push(`${at}.${key} geçersiz`);
    if (block.visibleWhen !== undefined) {
      const fields = block.visibleWhen?.anyFilled;
      if (!Array.isArray(fields) || !fields.length || Object.keys(block.visibleWhen).length !== 1 || fields.some((field) => !placeholders[field])) errors.push(`${at}.visibleWhen geçersiz`);
    }
    if (block.widthPercent !== undefined && !(Number.isFinite(block.widthPercent) && block.widthPercent > 0 && block.widthPercent <= 100)) errors.push(`${at}.widthPercent geçersiz`);
    const style = { ...baseStyle, ...block.style };
    if (block.style && validateStyle) errors.push(...validateStyle(style, `${at}.style`));
    if (block.type === "image") {
      if (!/^data:image\/(png|jpe?g);base64,[A-Za-z0-9+/]+={0,2}$/.test(block.source || "")) errors.push(`${at}.source gömülü PNG/JPEG olmalı`);
      for (const key of ["widthMm", "heightMm"]) if (!(Number.isFinite(block[key]) && block[key] > 0)) errors.push(`${at}.${key} geçersiz`);
      if (block.align !== undefined && !["left", "center", "right"].includes(block.align)) errors.push(`${at}.align geçersiz`);
    } else if (block.type === "text") {
      if (typeof block.value !== "string") errors.push(`${at}.value gerekli`);
      for (const match of String(block.value || "").matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)) {
        if (!placeholders[match[1]]) errors.push(`${at}: ${match[1]} placeholder tanımı eksik`);
      }
    } else if (block.type === "metadata") {
      if (typeof block.field !== "string" || !placeholders[block.field]) errors.push(`${at}.field tanımlı bir metadata alanı olmalı`);
      for (const key of ["prefix", "suffix", "fallback"]) if (block[key] !== undefined && typeof block[key] !== "string") errors.push(`${at}.${key} metin olmalı`);
    } else if (block.type === "spacer") {
      if (!nonnegative(block.heightMm)) errors.push(`${at}.heightMm geçersiz`);
    } else if (block.type === "separator") {
      if (block.thicknessPt !== undefined && !(Number.isFinite(block.thicknessPt) && block.thicknessPt > 0 && block.thicknessPt <= 12)) errors.push(`${at}.thicknessPt geçersiz`);
      if (block.align !== undefined && !["left", "center", "right"].includes(block.align)) errors.push(`${at}.align geçersiz`);
    } else if (block.type === "group") {
      if (block.direction !== undefined && !["column", "row"].includes(block.direction)) errors.push(`${at}.direction geçersiz`);
      if (block.gapMm !== undefined && !nonnegative(block.gapMm)) errors.push(`${at}.gapMm geçersiz`);
      errors.push(...validateSpecialPageBlocks(block.blocks, { path: `${at}.blocks`, placeholders, baseStyle: style, validateStyle }, depth + 1));
    }
  }
  return errors;
}
