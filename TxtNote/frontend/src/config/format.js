/**
 * Rich-text format options for the note editor.
 * Each pick (size, color, style) is applied on its own — never as a bundle.
 * Classes live on inline spans; styles live in index.css.
 */

/** @typedef {"heading" | "subheading" | "body"} FormatSize */
/** @typedef {"black" | "red" | "blue" | "green"} FormatColor */
/** @typedef {"left" | "center" | "right" | "justify"} FormatAlign */

/** @type {{ id: FormatSize, label: string, className: string }[]} */
export const FORMAT_SIZES = [
  { id: "heading", label: "Başlık", className: "fmt-size-heading" },
  { id: "subheading", label: "Alt başlık", className: "fmt-size-subheading" },
  { id: "body", label: "Normal", className: "fmt-size-body" },
];

/** @type {{ id: FormatColor, label: string, className: string, swatch: string }[]} */
export const FORMAT_COLORS = [
  { id: "black", label: "Siyah", className: "fmt-color-black", swatch: "#000000" },
  { id: "red", label: "Kırmızı", className: "fmt-color-red", swatch: "#be123c" },
  { id: "blue", label: "Mavi", className: "fmt-color-blue", swatch: "#0369a1" },
  { id: "green", label: "Yeşil", className: "fmt-color-green", swatch: "#047857" },
];

/** Stable highlight colors stored as span classes, so markup survives note reloads and exports. */
export const FORMAT_HIGHLIGHTS = [
  { id: "yellow", className: "fmt-highlight-yellow", swatch: "#fff2a8" },
  { id: "green", className: "fmt-highlight-green", swatch: "#c9f2d0" },
  { id: "cyan", className: "fmt-highlight-cyan", swatch: "#bdefff" },
  { id: "magenta", className: "fmt-highlight-magenta", swatch: "#f5c8ee" },
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
  { id: "justify", label: "İki yana yasla", className: "fmt-align-justify" },
];

/** Untouched text is always Normal + black, left aligned, with no emphasis. */
export const DEFAULT_FORMAT = /** @type {const} */ ({
  size: "body",
  color: "black",
  highlight: "none",
  align: "left",
  bold: false,
  italic: false,
  strike: false,
  underline: false,
  overline: false,
});

/**
 * Custom (non-preset) values are stored as attributes — `data-fmt-pt="13.5"`, `data-fmt-color="#rrggbb"`,
 * `data-fmt-bg="#rrggbb"` — and travel through the class-string pipeline as pseudo tokens "@pt:13.5",
 * "@color:#rrggbb", "@bg:#rrggbb" (see spanFormatTokens / setSpanFormatTokens).
 */
export const CUSTOM_PT_MIN = 1;
export const CUSTOM_PT_MAX = 400;

/** Point size clamped to 1–400 and rounded to 0.5, or null when not numeric. Accepts 13.5, "13,5", "pt13.5". */
export function normalizePt(value) {
  if (String(value ?? "").trim() === "") return null;
  const raw = typeof value === "number" ? value : Number(String(value).trim().replace(/^pt/i, "").replace(",", "."));
  if (!Number.isFinite(raw)) return null;
  return Math.min(CUSTOM_PT_MAX, Math.max(CUSTOM_PT_MIN, Math.round(raw * 2) / 2));
}

/** "#rgb" / "#rrggbb" to lowercase "#rrggbb", or null. */
export function normalizeHex(value) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${hex.toLowerCase()}`;
}

/** Size id accepted by the editor API: preset ids pass through; numbers / "pt13.5" / "13.5" become `pt<n>`. */
export function coerceSizeId(value) {
  if (FORMAT_SIZES.some((item) => item.id === value) || FORMAT_POINTS.some((item) => item.id === value)) return value;
  const pt = normalizePt(value);
  return pt == null ? null : `pt${pt}`;
}

/** @param {string|number} size */
export function sizeClass(size) {
  const preset =
    FORMAT_POINTS.find((item) => item.id === size)?.className ??
    FORMAT_SIZES.find((item) => item.id === size)?.className;
  if (preset) return preset;
  if (typeof size === "number" || /^pt\d/i.test(String(size))) {
    const pt = normalizePt(size);
    if (pt != null) return FORMAT_POINT_VALUES.includes(pt) ? `fmt-pt-${pt}` : `@pt:${pt}`;
  }
  return "fmt-size-body";
}

/** @param {FormatColor|string} color */
export function colorClass(color) {
  const preset = FORMAT_COLORS.find((c) => c.id === color)?.className;
  if (preset) return preset;
  const hex = normalizeHex(color);
  return hex ? `@color:${hex}` : "fmt-color-black";
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
const HIGHLIGHT_CLASSES = FORMAT_HIGHLIGHTS.map((c) => c.className);
const isCustomToken = (token, prefix) => token.startsWith(prefix);

/** Tokens actually present on a span — missing ones stay unset (inherit). */
export function parsePartialFormat(className) {
  const tokens = new Set((className ?? "").split(/\s+/).filter(Boolean));
  /** @type {{ size?: FormatSize, color?: FormatColor, highlight?: string, bold?: boolean, italic?: boolean, strike?: boolean }} */
  const partial = {};

  for (const size of FORMAT_SIZES) {
    if (tokens.has(size.className)) partial.size = size.id;
  }
  for (const size of FORMAT_POINTS) {
    if (tokens.has(size.className)) {
      partial.size = size.id;
      partial.sizePt = size.pt;
    }
  }
  for (const color of FORMAT_COLORS) {
    if (tokens.has(color.className)) partial.color = color.id;
  }
  for (const highlight of FORMAT_HIGHLIGHTS) {
    if (tokens.has(highlight.className)) partial.highlight = highlight.id;
  }
  for (const token of tokens) {
    if (token.startsWith("@pt:")) {
      const pt = normalizePt(token.slice(4));
      if (pt != null) {
        partial.size = `pt${pt}`;
        partial.sizePt = pt;
      }
    } else if (token.startsWith("@color:")) {
      const hex = normalizeHex(token.slice(7));
      if (hex) partial.color = hex;
    } else if (token.startsWith("@bg:")) {
      const hex = normalizeHex(token.slice(4));
      if (hex) partial.highlight = hex;
    }
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
    next = without(SIZE_CLASSES).filter((token) => !isCustomToken(token, "@pt:"));
    next.push(sizeClass(patch.size));
  }
  if (patch.color) {
    next = without(COLOR_CLASSES).filter((token) => !isCustomToken(token, "@color:"));
    next.push(colorClass(patch.color));
  }
  if (patch.highlight !== undefined) {
    next = without(HIGHLIGHT_CLASSES).filter((token) => !isCustomToken(token, "@bg:"));
    const highlight = FORMAT_HIGHLIGHTS.find((item) => item.id === patch.highlight);
    const customHex = highlight ? null : normalizeHex(patch.highlight);
    if (highlight) next.push(highlight.className);
    else if (customHex) next.push(`@bg:${customHex}`);
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
    highlight: format.highlight ?? DEFAULT_FORMAT.highlight,
    bold: Boolean(format.bold),
    italic: Boolean(format.italic),
    strike: Boolean(format.strike),
    underline: Boolean(format.underline),
    overline: Boolean(format.overline),
  });
}

const ATTR_TOKENS = [
  ["data-fmt-pt", "@pt:", (v) => (/^\d{1,3}(\.5)?$/.test(v) ? normalizePt(v) : null)],
  ["data-fmt-color", "@color:", (v) => (/^#[0-9a-f]{6}$/i.test(v) ? normalizeHex(v) : null)],
  ["data-fmt-bg", "@bg:", (v) => (/^#[0-9a-f]{6}$/i.test(v) ? normalizeHex(v) : null)],
];

/** True when the element carries any custom format attribute. */
export function hasCustomFormatAttr(el) {
  return ATTR_TOKENS.some(([name]) => el?.hasAttribute?.(name));
}

/** Canonical value of a custom format attribute, or null when it is not valid. */
export function validCustomFormatAttr(name, value) {
  const row = ATTR_TOKENS.find(([attr]) => attr === name);
  const result = row ? row[2](String(value ?? "")) : null;
  return result == null ? null : String(result);
}

/** className plus pseudo tokens for valid data-fmt-* attributes, so the class-string pipeline sees every format. */
export function spanFormatTokens(el) {
  const tokens = String(el?.className ?? "").split(/\s+/).filter(Boolean);
  for (const [name, prefix, check] of ATTR_TOKENS) {
    const value = el?.getAttribute?.(name);
    const ok = value == null ? null : check(value);
    if (ok != null) tokens.push(`${prefix}${ok}`);
  }
  return tokens.join(" ");
}

/** Write a class-string (with pseudo tokens) onto a span: real classes to className, custom values to data-fmt-*. */
export function setSpanFormatTokens(el, tokens) {
  const all = String(tokens ?? "").split(/\s+/).filter(Boolean);
  el.className = all.filter((token) => !token.startsWith("@")).join(" ");
  for (const [name, prefix] of ATTR_TOKENS) {
    const token = all.findLast((t) => t.startsWith(prefix));
    if (token) el.setAttribute(name, token.slice(prefix.length));
    else el.removeAttribute(name);
  }
  registerCustomFormatRules(el.outerHTML);
}

/**
 * CSS rules for the custom values found in `source` (an HTML string). Inline style attributes are stripped
 * app-wide (CSP), so custom values are styled through attribute selectors generated per value.
 */
export function customFormatRules(source, scope = "") {
  const text = String(source ?? "");
  if (!text.includes("data-fmt-")) return [];
  const prefix = scope ? `${scope} ` : "";
  const rules = new Set();
  for (const m of text.matchAll(/data-fmt-pt=\\?["'](\d{1,3}(?:\.5)?)/g)) {
    const pt = validCustomFormatAttr("data-fmt-pt", m[1]);
    if (pt) rules.add(`${prefix}[data-fmt-pt="${pt}"]{font-size:${pt}pt}`);
  }
  for (const m of text.matchAll(/data-fmt-color=\\?["'](#[0-9a-fA-F]{6})/g)) {
    const hex = normalizeHex(m[1]);
    if (hex) rules.add(`${prefix}[data-fmt-color="${hex}"]{color:${hex}}`);
  }
  for (const m of text.matchAll(/data-fmt-bg=\\?["'](#[0-9a-fA-F]{6})/g)) {
    const hex = normalizeHex(m[1]);
    if (hex) rules.add(`${prefix}[data-fmt-bg="${hex}"]{background-color:${hex}}`);
  }
  return [...rules];
}

export const customFormatCss = (source, scope = "") => customFormatRules(source, scope).join("\n");

let customSheet = null;
const registeredRules = new Set();

/** Add the rules for custom values in `source` to the live document (CSSOM only, so CSP-safe). */
export function registerCustomFormatRules(source) {
  if (typeof document === "undefined" || typeof CSSStyleSheet === "undefined") return;
  const fresh = customFormatRules(source).filter((rule) => !registeredRules.has(rule));
  if (!fresh.length) return;
  try {
    if (!customSheet) {
      customSheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, customSheet];
    }
    for (const rule of fresh) {
      customSheet.insertRule(rule, customSheet.cssRules.length);
      registeredRules.add(rule);
    }
  } catch {
    /* adoptedStyleSheets unsupported: exports still carry per-document rules */
  }
}
