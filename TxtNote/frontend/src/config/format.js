/**
 * Rich-text format options for the note editor.
 * Each pick (size, color, style) is applied on its own — never as a bundle.
 * Classes live on inline spans; styles live in index.css.
 */

/** @typedef {"heading" | "subheading" | "body"} FormatSize */
/** @typedef {"black" | "red" | "blue" | "green"} FormatColor */
/** @typedef {"left" | "center" | "right"} FormatAlign */

/** @type {{ id: FormatSize, label: string, className: string }[]} */
export const FORMAT_SIZES = [
  { id: "heading", label: "Başlık", className: "fmt-size-heading" },
  { id: "subheading", label: "Alt başlık", className: "fmt-size-subheading" },
  { id: "body", label: "Normal", className: "fmt-size-body" },
];

/** @type {{ id: FormatColor, label: string, className: string, swatch: string }[]} */
export const FORMAT_COLORS = [
  { id: "black", label: "Siyah", className: "fmt-color-black", swatch: "#171717" },
  { id: "red", label: "Kırmızı", className: "fmt-color-red", swatch: "#e8a0a0" },
  { id: "blue", label: "Mavi", className: "fmt-color-blue", swatch: "#9bb8de" },
  { id: "green", label: "Yeşil", className: "fmt-color-green", swatch: "#9cc9ae" },
];

/** Point sizes for academic papers (Times, A4). */
export const FORMAT_POINT_VALUES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24];

/** @type {{ id: string, pt: number, label: string, className: string }[]} */
export const FORMAT_POINTS = FORMAT_POINT_VALUES.map((pt) => ({
  id: `pt${pt}`,
  pt,
  label: `${pt} pt`,
  className: `fmt-pt-${pt}`,
}));

/** Independent toggles — they never ride along with size or colour. */
export const FORMAT_STYLES = [
  { id: "bold", label: "Kalın", className: "fmt-bold" },
  { id: "italic", label: "İtalik", className: "fmt-italic" },
  { id: "underline", label: "Altı çizili", className: "fmt-underline" },
  { id: "overline", label: "Üstünden çiz", className: "fmt-overline" },
  { id: "strike", label: "Üstü çizili", className: "fmt-strike" },
];

/** Block-level alignment — lives on a wrapping div, not on the inline span. */
/** @type {{ id: FormatAlign, label: string, className: string }[]} */
export const FORMAT_ALIGNS = [
  { id: "left", label: "Sola hizala", className: "fmt-align-left" },
  { id: "center", label: "Ortaya hizala", className: "fmt-align-center" },
  { id: "right", label: "Sağa hizala", className: "fmt-align-right" },
];

/** Untouched text is always Normal + black, left aligned, with no emphasis. */
export const DEFAULT_FORMAT = /** @type {const} */ ({
  size: "body",
  color: "black",
  align: "left",
  bold: false,
  italic: false,
  strike: false,
  underline: false,
  overline: false,
});

/** @param {string} size */
export function sizeClass(size) {
  return (
    FORMAT_POINTS.find((item) => item.id === size)?.className ??
    FORMAT_SIZES.find((item) => item.id === size)?.className ??
    "fmt-size-body"
  );
}

/** @param {FormatColor} color */
export function colorClass(color) {
  return FORMAT_COLORS.find((c) => c.id === color)?.className ?? "fmt-color-black";
}

/** @param {FormatAlign} align */
export function alignClass(align) {
  return FORMAT_ALIGNS.find((item) => item.id === align)?.className ?? "fmt-align-left";
}

/** @param {string} className */
export function parseAlign(className) {
  const tokens = new Set((className ?? "").split(/\s+/).filter(Boolean));
  for (const align of FORMAT_ALIGNS) {
    if (tokens.has(align.className)) return align.id;
  }
  return "left";
}

const SIZE_CLASSES = [...FORMAT_SIZES.map((s) => s.className), ...FORMAT_POINTS.map((s) => s.className)];
const COLOR_CLASSES = FORMAT_COLORS.map((c) => c.className);

/** Tokens actually present on a span — missing ones stay unset (inherit). */
export function parsePartialFormat(className) {
  const tokens = new Set((className ?? "").split(/\s+/).filter(Boolean));
  /** @type {{ size?: FormatSize, color?: FormatColor, bold?: boolean, italic?: boolean, strike?: boolean }} */
  const partial = {};

  for (const size of FORMAT_SIZES) {
    if (tokens.has(size.className)) partial.size = size.id;
  }
  for (const size of FORMAT_POINTS) {
    if (tokens.has(size.className)) partial.size = size.id;
  }
  for (const color of FORMAT_COLORS) {
    if (tokens.has(color.className)) partial.color = color.id;
  }
  for (const style of FORMAT_STYLES) {
    if (tokens.has(style.className)) partial[style.id] = true;
  }
  return partial;
}

/** Merge a single user pick into an existing class list; other attributes stay. */
export function mergeFormatClassName(className, patch) {
  let next = (className ?? "").split(/\s+/).filter(Boolean);
  const without = (drop) => next.filter((token) => !drop.includes(token));

  if (patch.size) {
    next = without(SIZE_CLASSES);
    next.push(sizeClass(patch.size));
  }
  if (patch.color) {
    next = without(COLOR_CLASSES);
    next.push(colorClass(patch.color));
  }
  for (const style of FORMAT_STYLES) {
    if (patch[style.id] === undefined) continue;
    next = next.filter((token) => token !== style.className);
    if (patch[style.id]) next.push(style.className);
  }

  return [...new Set(next)].join(" ");
}

/** Classes for a complete format — used when inserting a fresh typing span. */
export function formatClassName(format) {
  return mergeFormatClassName("", {
    size: format.size ?? DEFAULT_FORMAT.size,
    color: format.color ?? DEFAULT_FORMAT.color,
    bold: Boolean(format.bold),
    italic: Boolean(format.italic),
    strike: Boolean(format.strike),
    underline: Boolean(format.underline),
    overline: Boolean(format.overline),
  });
}
