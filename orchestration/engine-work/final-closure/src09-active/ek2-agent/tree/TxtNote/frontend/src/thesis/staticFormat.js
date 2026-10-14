/**
 * Document-local character formatting for template-owned text (a section title, its fixed paragraphs).
 * Stored as a plain object in thesis.textOverrides[sectionId][`${kind}Format`] and rendered as one inline
 * span with the same fmt-* classes / data-fmt-* attributes the body text uses, so the editor CSS, the PDF
 * and the DOCX run parser all read it without any extra path.
 */
import { FORMAT_COLORS, FORMAT_HIGHLIGHTS, normalizeHex } from "../config/format.js";

const TOGGLES = ["bold", "italic", "underline", "strike"];
const colorValue = (value) => FORMAT_COLORS.some((item) => item.id === value) ? value : normalizeHex(value) || undefined;
const highlightValue = (value) => FORMAT_HIGHLIGHTS.some((item) => item.id === value) ? value : normalizeHex(value) || undefined;

/** Keep only valid keys; an empty result means "template formatting". */
export function normalizeStaticFormat(format) {
  const result = {};
  if (!format || typeof format !== "object") return result;
  for (const key of TOGGLES) if (format[key] === true) result[key] = true;
  const color = colorValue(format.color);
  if (color) result.color = color;
  const highlight = highlightValue(format.highlight);
  if (highlight) result.highlight = highlight;
  const size = Number(format.sizePt);
  if (Number.isFinite(size) && size >= 1 && size <= 400) result.sizePt = Math.round(size * 2) / 2;
  return result;
}

/** Opening `<span ...>` for a format, or "" when it is empty. */
export function staticFormatOpenTag(format) {
  const value = normalizeStaticFormat(format);
  if (!Object.keys(value).length) return "";
  const classes = TOGGLES.filter((key) => value[key]).map((key) => `fmt-${key}`);
  const attrs = [];
  if (value.color) {
    if (FORMAT_COLORS.some((item) => item.id === value.color)) classes.push(`fmt-color-${value.color}`);
    else attrs.push(`data-fmt-color="${value.color}"`);
  }
  if (value.highlight) {
    if (FORMAT_HIGHLIGHTS.some((item) => item.id === value.highlight)) classes.push(`fmt-highlight-${value.highlight}`);
    else attrs.push(`data-fmt-bg="${value.highlight}"`);
  }
  if (value.sizePt) attrs.push(`data-fmt-pt="${value.sizePt}"`);
  return `<span${classes.length ? ` class="${classes.join(" ")}"` : ""}${attrs.length ? ` ${attrs.join(" ")}` : ""}>`;
}

/** Wrap already-escaped inline HTML in the format span. */
export const wrapStaticFormat = (html, format) => {
  const open = staticFormatOpenTag(format);
  return open ? `${open}${html}</span>` : html;
};
