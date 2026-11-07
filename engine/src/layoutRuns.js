/**
 * Partial character formatting inside one layout text box (template text block or user text frame).
 * The box keeps its plain `text`; `runs` is an overlay of consecutive segments whose texts join back to `text`.
 * Run fields: bold, italic, underline, strike (true), color, highlight (preset id or "#rrggbb"), fontSizePt, fontFamily.
 * Rendering (editor + PDF read the DOM) and Word export read the same run objects.
 */
import { FORMAT_COLORS, FORMAT_HIGHLIGHTS, normalizeHex } from "../../TxtNote/frontend/src/config/format.js";

const TOGGLES = ["bold", "italic", "underline", "strike"];
const colorValue = (value) => (FORMAT_COLORS.some((item) => item.id === value) ? value : normalizeHex(value) || undefined);
const highlightValue = (value) => (FORMAT_HIGHLIGHTS.some((item) => item.id === value) ? value : normalizeHex(value) || undefined);

/** Format part of a run (no text); empty object = plain. */
export function runFormat(run) {
  const result = {};
  if (!run || typeof run !== "object") return result;
  for (const key of TOGGLES) if (run[key] === true || run[key] === false) result[key] = run[key]; // false = explicitly off inside a box whose own style has it on
  const color = colorValue(run.color);
  if (color) result.color = color;
  const highlight = highlightValue(run.highlight);
  if (highlight) result.highlight = highlight;
  const size = Number(run.fontSizePt);
  if (Number.isFinite(size) && size >= 1 && size <= 400) result.fontSizePt = Math.round(size * 2) / 2;
  if (typeof run.fontFamily === "string" && run.fontFamily && run.fontFamily.length <= 80) result.fontFamily = run.fontFamily;
  return result;
}

const sameFormat = (a, b) => JSON.stringify(runFormat(a)) === JSON.stringify(runFormat(b));
const isPlain = (run) => !Object.keys(runFormat(run)).length;

function merge(runs) {
  const out = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = out[out.length - 1];
    if (last && sameFormat(last, run)) last.text += run.text;
    else out.push({ ...runFormat(run), text: run.text });
  }
  return out;
}

/** Valid runs for `text` (texts must join to it), merged; `undefined` when nothing is formatted or the overlay does not match. */
export function normalizeRuns(runs, text) {
  if (!Array.isArray(runs) || typeof text !== "string") return undefined;
  const clean = runs.filter((run) => run && typeof run.text === "string").map((run) => ({ ...runFormat(run), text: run.text }));
  if (clean.map((run) => run.text).join("") !== text) return undefined;
  const merged = merge(clean);
  return merged.some((run) => !isPlain(run)) ? merged : undefined;
}

/** Runs of `text` after `change(format)` is applied to the characters [start, end). Plain parts stay plain. */
/** `base` = the toggles the box itself has ({bold, italic, underline, strike}); runs only store what differs from it. */
export function applyRunFormat(text, runs, start, end, change, base = {}) {
  const from = Math.max(0, Math.min(start, end)), to = Math.min(text.length, Math.max(start, end));
  if (to <= from) return normalizeRuns(runs, text);
  const source = normalizeRuns(runs, text) || [{ text }];
  const pieces = [];
  let offset = 0;
  for (const run of source) {
    const runStart = offset, runEnd = offset + run.text.length;
    offset = runEnd;
    const cutA = Math.max(runStart, from), cutB = Math.min(runEnd, to);
    if (cutB <= cutA) { pieces.push(run); continue; }
    if (cutA > runStart) pieces.push({ ...run, text: run.text.slice(0, cutA - runStart) });
    pieces.push({ ...simplify(runFormat(change(runFormat(run))), base), text: run.text.slice(cutA - runStart, cutB - runStart) });
    if (cutB < runEnd) pieces.push({ ...run, text: run.text.slice(cutB - runStart) });
  }
  return normalizeRuns(merge(pieces), text);
}

function simplify(format, base) {
  const result = { ...format };
  for (const key of TOGGLES) if (key in result && Boolean(result[key]) === Boolean(base[key])) delete result[key];
  return result;
}

/** Format of the whole [start, end) range: a toggle key is true only if every character has it. */
export function rangeFormat(text, runs, start, end) {
  const base = normalizeRuns(runs, text) || [{ text }];
  let offset = 0, result = null;
  for (const run of base) {
    const runStart = offset, runEnd = offset + run.text.length;
    offset = runEnd;
    if (Math.min(runEnd, end) <= Math.max(runStart, start)) continue;
    const format = runFormat(run);
    if (!result) result = { ...format };
    else for (const key of Object.keys(result)) if (JSON.stringify(result[key]) !== JSON.stringify(format[key])) delete result[key];
  }
  return result || {};
}

const escapeAttr = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Inline CSS of a run (kept inline so the editor, the PDF writer and the preview need no registered class). */
export function runCss(format) {
  const css = [];
  if (format.bold === true) css.push("font-weight:700"); else if (format.bold === false) css.push("font-weight:400");
  if (format.italic === true) css.push("font-style:italic"); else if (format.italic === false) css.push("font-style:normal");
  const lines = [format.underline && "underline", format.strike && "line-through"].filter(Boolean);
  if (lines.length) css.push(`text-decoration:${lines.join(" ")}`);
  if (format.color) css.push(`color:${FORMAT_COLORS.find((item) => item.id === format.color)?.swatch || format.color}`);
  if (format.highlight) css.push(`background-color:${FORMAT_HIGHLIGHTS.find((item) => item.id === format.highlight)?.swatch || format.highlight}`);
  if (format.fontSizePt) css.push(`font-size:${format.fontSizePt}pt`);
  if (format.fontFamily) css.push(`font-family:${JSON.stringify(format.fontFamily).replace(/"/g, "&quot;")}`);
  return css.join(";");
}

/** HTML of one run's escaped text. A run with only template bold/font keeps the template markup. */
export function runHtml(run, escapedText, base = {}) {
  const format = simplify(runFormat(run), base);
  const keys = Object.keys(format);
  if (!keys.length) return escapedText;
  if (keys.every((key) => key === "bold" || key === "fontFamily") && format.bold !== false) {
    const strong = format.bold ? `<b class="thesis-layout-strong">${escapedText}</b>` : escapedText;
    return format.fontFamily ? `<span style="font-family:${escapeAttr(JSON.stringify(format.fontFamily))}">${strong}</span>` : strong;
  }
  const preset = format.highlight && FORMAT_HIGHLIGHTS.some((item) => item.id === format.highlight);
  const extra = preset ? `fmt-highlight-${format.highlight}` : "";
  const bg = format.highlight && !preset ? ` data-fmt-bg="${escapeAttr(format.highlight)}"` : "";
  return `<span data-run="${escapeAttr(JSON.stringify(format))}"${extra ? ` class="${extra}"` : ""}${bg} style="${runCss(format)}">${escapedText}</span>`;
}

/** Reads runs back from an edited box (text nodes, <br>, b/i/u/s tags, data-run spans). Browser DOM only. */
export function readRunsFromDom(root) {
  const runs = [];
  const push = (text, format) => { if (text) runs.push({ ...format, text }); };
  const walk = (node, format) => {
    if (node.nodeType === 3) { push(node.data, format); return; }
    if (node.nodeType !== 1) return;
    if (node.nodeName === "BR") { push("\n", format); return; }
    let next = format;
    const name = node.nodeName;
    if (name === "B" || name === "STRONG") next = { ...next, bold: true };
    if (name === "I" || name === "EM") next = { ...next, italic: true };
    if (name === "U") next = { ...next, underline: true };
    if (name === "S" || name === "STRIKE" || name === "DEL") next = { ...next, strike: true };
    const family = node.style?.fontFamily;
    if (family && node.dataset?.run === undefined) next = { ...next, fontFamily: family.replace(/^["']|["']$/g, "") };
    if (node.dataset?.run) { try { next = { ...next, ...runFormat(JSON.parse(node.dataset.run)) }; } catch { /* keep the inherited format */ } }
    const block = /^(DIV|P|LI|UL|OL)$/.test(name);
    if (block && runs.length && !runs[runs.length - 1].text.endsWith("\n")) push("\n", format);
    for (const child of node.childNodes) walk(child, next);
  };
  walk(root, {});
  return merge(runs.map((run) => ({ ...run, text: run.text.replace(/\r\n?/g, "\n") })));
}
