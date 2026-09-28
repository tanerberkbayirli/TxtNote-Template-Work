/**
 * Snapshot the live academic article so export matches what is on screen:
 * fields, punto, images, math, code, and positions. No reconstructed stub.
 */

import { ACADEMIC_CSS, PAGE_GAP_ATTR, stripAcademicPageGaps, tightenAcademicFlow } from "./academicLayout.js";
import { flattenCodeBlocksForAcademic } from "./codeBlock.js";

const CHROME = [
  ".academic-image-controls",
  ".academic-bibliography-remove",
  ".academic-bibliography-add",
  ".math-formula__toolbar",
  ".math-formula__catalog",
  ".math-formula__editor",
  ".math-formula__copy",
  ".math-formula__search",
  ".code-block__toolbar",
  ".code-block__editor",
  "button",
].join(",");

const TYPE_STYLE_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "lineHeight",
  "letterSpacing",
  "wordSpacing",
  "textAlign",
  "textDecoration",
  "textDecorationLine",
  "textDecorationStyle",
  "textUnderlineOffset",
  "textTransform",
  "color",
  "whiteSpace",
  "overflowWrap",
  "wordBreak",
  "verticalAlign",
  "listStyleType",
  "listStylePosition",
];

/** Extra CSS so widgets look like the editor without toolbars / placeholders. */
export const EXPORT_WIDGET_CSS = `
.academic-document [contenteditable] { outline:none !important; caret-color:transparent !important; }
.academic-document [data-empty="true"]:before { content:none !important; display:none !important; }
.academic-document ::placeholder { color:transparent !important; opacity:0 !important; }
.math-formula__toolbar,.math-formula__catalog,.math-formula__editor,.math-formula__copy,.math-formula__search,
.code-block__toolbar,.code-block__editor,.code-block__copy,
.academic-image-controls,.academic-bibliography-remove,.academic-bibliography-add { display:none !important; }
.math-formula { white-space:normal; background:transparent !important; border:0 !important; box-shadow:none !important; }
.math-formula--block { display:block; margin:10pt 0; padding:0 !important; text-align:center; border-radius:0 !important; }
.math-formula--inline { display:inline-flex; align-items:center; padding:0 !important; vertical-align:middle; border-radius:0 !important; }
.math-formula__render { overflow:visible; text-align:center; color:#111; }
.math-formula .katex, .math-formula .katex * { color:#111 !important; }
.math-formula .katex-display { margin:0; }
.math-formula .katex-display>.katex { text-align:center; }
.code-block { display:block; margin:10pt 0; padding:0; max-width:100%; overflow:hidden; background:transparent; border:0; border-radius:0 !important; white-space:normal; font-family:Consolas,"Courier New",monospace; }
.code-block__toolbar,.code-block__copy,.code-block__lang { display:none !important; }
.code-block__render { margin:0; padding:0; max-width:100%; overflow:hidden; text-align:left; background:transparent; }
.code-block__source { display:block; max-width:100%; font:10.5pt/1.55 Consolas,"Courier New",monospace; white-space:pre-wrap !important; overflow-wrap:anywhere !important; word-break:break-word; color:#111; }
.code-block__source * { white-space:inherit; overflow-wrap:inherit; word-break:inherit; color:#111 !important; }
.academic-code { display:block; max-width:100%; margin:10pt 0; padding:0; border:0; background:transparent; color:#111; font:10.5pt/1.55 Consolas,"Courier New",monospace; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; tab-size:4; text-align:left; overflow:hidden; }
.academic-export-stack { position:relative; width:210mm; min-width:210mm; background:#fff; }
.academic-export-stack .academic-sheet { box-shadow:none !important; background:#fff !important; }
.academic-export-stack .academic-page { background:transparent !important; box-shadow:none !important; }
.academic-document .academic-table-wrap { display:block; width:100%; max-width:100%; margin:12pt 0; overflow:visible; white-space:normal; }
.academic-document table { display:table; width:100%; table-layout:fixed; border-collapse:collapse; margin:10pt 0; white-space:normal; background:#fff; }
.academic-document th,.academic-document td { display:table-cell; border:1px solid #737373; padding:6pt 8pt; vertical-align:top; white-space:normal; color:#111; }
.academic-bibliography-list { list-style:none; padding:0; margin:0; }
.academic-bibliography-list li { position:relative; display:block; padding-left:18pt; margin:0 0 10pt; }
.academic-bibliography-list li::before { content:""; position:absolute; left:0; top:0.55em; width:5.5pt; height:5.5pt; border-radius:50%; background:#000; }
`;

export function cssPxToHalfPoints(px) {
  const n = parseFloat(px);
  if (!Number.isFinite(n) || n <= 0) return 24;
  return Math.max(8, Math.round(((n * 72) / 96) * 2));
}

export function cssColorToHex(color) {
  const value = String(color ?? "").trim();
  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const raw = hex[1];
    if (raw.length === 3) return raw.split("").map((ch) => `${ch}${ch}`).join("").toUpperCase();
    return raw.slice(0, 6).toUpperCase();
  }
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgb) return "111111";
  return [rgb[1], rgb[2], rgb[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function printInkColor(color) {
  const hex = cssColorToHex(color);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 210 ? "111111" : hex;
}

export function widgetExportKind(el) {
  if (!el?.classList) return "none";
  if (el.classList.contains("math-formula--inline")) return "inline";
  if (el.classList.contains("math-formula") || el.classList.contains("code-block") || el.classList.contains("academic-code")) return "block";
  return "none";
}

function fieldValue(el) {
  if (!el) return "";
  if ("value" in el && el.value != null) return String(el.value);
  return String(el.textContent ?? "");
}

function copyTypeStyles(from, to) {
  const view = from?.ownerDocument?.defaultView;
  if (!from || !to || !view) return;
  try {
    const cs = view.getComputedStyle(from);
    for (const prop of TYPE_STYLE_PROPS) {
      const value = cs[prop];
      if (value) to.style[prop] = value;
    }
    to.style.color = `#${printInkColor(cs.color)}`;
    if (!/italic|oblique/i.test(cs.fontStyle) && from.classList?.contains("institution")) {
      to.style.fontStyle = "italic";
    }
  } catch {
    /* keep class styles */
  }
}

function copyLiveControlValues(liveRoot, cloneRoot) {
  const liveControls = [...liveRoot.querySelectorAll("textarea, input")];
  const cloneControls = [...cloneRoot.querySelectorAll("textarea, input")];
  cloneControls.forEach((cloneEl, index) => {
    const liveEl = liveControls[index];
    if (!liveEl || !("value" in cloneEl)) return;
    cloneEl.value = liveEl.value;
    cloneEl.setAttribute("value", liveEl.value);
  });
}

function freezeImages(clone, liveRoot) {
  const live = [...liveRoot.querySelectorAll("img")];
  [...clone.querySelectorAll("img")].forEach((img, index) => {
    const source = live[index];
    if (!source) return;
    const rect = source.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || source.width || 0));
    const height = Math.max(1, Math.round(rect.height || source.height || 0));
    img.setAttribute("width", String(width));
    img.setAttribute("height", String(height));
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.maxWidth = "100%";
    img.style.objectFit = "contain";
    if (source.src && img.src !== source.src) img.src = source.src;
  });
}

function freezeControls(liveRoot, cloneRoot) {
  const liveControls = [...liveRoot.querySelectorAll("textarea, input")].filter(
    (el) => !el.closest(".math-formula, .code-block"),
  );
  const cloneControls = [...cloneRoot.querySelectorAll("textarea, input")].filter(
    (el) => !el.closest(".math-formula, .code-block"),
  );
  cloneControls.forEach((cloneEl, index) => {
    const liveEl = liveControls[index];
    const next = cloneRoot.ownerDocument.createElement(cloneEl.classList.contains("document-title") ? "h1" : "div");
    next.className = cloneEl.className;
    next.textContent = liveEl ? fieldValue(liveEl) : fieldValue(cloneEl);
    if (liveEl) copyTypeStyles(liveEl, next);
    const rect = liveEl?.getBoundingClientRect?.();
    if (rect?.height > 0) next.style.minHeight = `${Math.round(rect.height)}px`;
    next.style.border = "0";
    next.style.outline = "none";
    next.style.background = "transparent";
    next.style.display = "block";
    next.style.width = "100%";
    next.style.boxSizing = "border-box";
    next.style.whiteSpace = "pre-wrap";
    next.style.resize = "none";
    cloneEl.replaceWith(next);
  });
}

function cleanWidgets(root, { keepPageGaps = false } = {}) {
  root.querySelectorAll(CHROME).forEach((el) => el.remove());
  if (!keepPageGaps) stripAcademicPageGaps(root);
  root.querySelectorAll("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.removeAttribute("role");
    el.removeAttribute("aria-label");
    el.removeAttribute("data-placeholder");
    el.removeAttribute("data-empty");
  });
  root.querySelectorAll("[data-undo-app]").forEach((el) => el.removeAttribute("data-undo-app"));
  root.querySelectorAll(".academic-bibliography-list li").forEach((el) => {
    el.style.display = "block";
  });
}

function forcePrintSurface(root) {
  root.style.background = root.classList.contains("academic-page") ? "transparent" : "#fff";
  root.style.color = "#111";
  root.querySelectorAll(".math-formula").forEach((el) => {
    el.style.background = "transparent";
    el.style.border = "0";
    el.style.color = "#111";
  });
  root.querySelectorAll(".code-block, .academic-code").forEach((el) => {
    el.style.background = "transparent";
    el.style.border = "0";
    el.style.color = "#111";
    el.style.maxWidth = "100%";
    el.style.overflow = "hidden";
    el.style.whiteSpace = el.classList.contains("academic-code") ? "pre-wrap" : "normal";
    el.style.overflowWrap = "anywhere";
    el.style.wordBreak = "break-word";
    el.style.fontFamily = 'Consolas, "Courier New", monospace';
  });
  root.querySelectorAll(".code-block__render, .code-block__source, .academic-code").forEach((el) => {
    el.style.maxWidth = "100%";
    el.style.overflow = "hidden";
    el.style.whiteSpace = "pre-wrap";
    el.style.overflowWrap = "anywhere";
    el.style.wordBreak = "break-word";
    el.style.color = "#111";
  });
}

function syncWidgetSources(liveRoot, cloneRoot) {
  const liveBlocks = [...liveRoot.querySelectorAll(".code-block")];
  [...cloneRoot.querySelectorAll(".code-block")].forEach((cloneEl, index) => {
    const liveEl = liveBlocks[index];
    if (!liveEl) return;
    const editor = liveEl.querySelector("[data-code-editor], .code-block__editor");
    const code =
      (editor && "value" in editor ? String(editor.value) : null) ?? liveEl.getAttribute("data-code") ?? "";
    cloneEl.setAttribute("data-code", code);
    cloneEl.setAttribute("data-language", liveEl.getAttribute("data-language") || "auto");
    if (editor) {
      const source = cloneEl.querySelector(".code-block__source");
      if (source) source.textContent = code;
    }
  });
}

function hydrateExportClone(liveArticle, cloneArticle, { keepPageGaps = false } = {}) {
  copyLiveControlValues(liveArticle, cloneArticle);
  freezeImages(cloneArticle, liveArticle);
  freezeControls(liveArticle, cloneArticle);
  syncWidgetSources(liveArticle, cloneArticle);
  flattenCodeBlocksForAcademic(cloneArticle);
  cleanWidgets(cloneArticle, { keepPageGaps });
  cloneArticle.querySelectorAll(".math-formula textarea, .math-formula input, .math-formula select, .code-block textarea, .code-block input, .code-block select").forEach((el) => el.remove());
  cloneArticle.querySelectorAll("textarea, input, select").forEach((el) => {
    if (el.closest(".math-formula, .code-block")) return;
    el.remove();
  });
  tightenAcademicFlow(cloneArticle);
  forcePrintSurface(cloneArticle);
  return cloneArticle;
}

/** Deep-clone the on-screen article into a static print tree. */
export function prepareAcademicExportRoot(article, { keepPageGaps = false } = {}) {
  if (!article) return null;
  const clone = article.cloneNode(true);
  hydrateExportClone(article, clone, { keepPageGaps });
  if (!keepPageGaps) {
    clone.classList.remove("academic-page");
    clone.classList.add("academic-document", "paper");
  }
  return clone;
}

export async function snapshotAcademicArticle(article) {
  return prepareAcademicExportRoot(article, { keepPageGaps: false });
}

export async function snapshotAcademicStack(article) {
  if (!article) return null;
  const stack = article.closest(".academic-stack");
  if (!stack) {
    const paper = await snapshotAcademicArticle(article);
    return paper ? { root: paper, article: paper, sheetCount: 1 } : null;
  }
  const cloneStack = stack.cloneNode(true);
  cloneStack.classList.add("academic-export-stack");
  const cloneArticle = cloneStack.querySelector("article.academic-document, article.academic-page, article");
  if (!cloneArticle) return null;
  hydrateExportClone(article, cloneArticle, { keepPageGaps: true });
  const sheetCount = Math.max(1, cloneStack.querySelectorAll(".academic-sheet").length);
  return { root: cloneStack, article: cloneArticle, sheetCount };
}

export function buildWysiwygPrintHtml(article, extraCss = "") {
  const clone = prepareAcademicExportRoot(article);
  if (!clone) return "";
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <style>
    ${ACADEMIC_CSS}
    ${EXPORT_WIDGET_CSS}
    ${extraCss}
    html,body { margin:0; padding:0; background:#fff; }
    @page { size:A4; margin:0; }
    .academic-document { margin:0 auto; background:#fff; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`;
}

export { PAGE_GAP_ATTR };
