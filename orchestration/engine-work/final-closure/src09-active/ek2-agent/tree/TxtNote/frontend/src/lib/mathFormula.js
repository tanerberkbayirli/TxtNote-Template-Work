/**
 * Detect LaTeX in the note body and turn it into a rendered, copyable block.
 * KaTeX is loaded only when a formula is actually present.
 */

import { MATH_FORMULA_PRESETS, searchMathFormulas } from "./mathFormulas.js";

export const MATH_FORMULA_CLASS = "math-formula";
export const MATH_MARK = "##math##";
export { MATH_FORMULA_PRESETS, searchMathFormulas };

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

let katexLoader = null;

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** KaTeX math environments that may appear without $$ / \[ wrapping. */
const MATH_ENVS = new Set([
  "equation",
  "equation*",
  "align",
  "align*",
  "aligned",
  "alignat",
  "alignat*",
  "alignedat",
  "gather",
  "gather*",
  "gathered",
  "split",
  "CD",
  "cases",
  "dcases",
  "rcases",
  "drcases",
  "matrix",
  "pmatrix",
  "bmatrix",
  "Bmatrix",
  "vmatrix",
  "Vmatrix",
  "matrix*",
  "pmatrix*",
  "bmatrix*",
  "Bmatrix*",
  "vmatrix*",
  "Vmatrix*",
  "smallmatrix",
  "array",
  "darray",
  "subarray",
]);

const INLINE_ENVS = new Set(["smallmatrix", "subarray"]);

const KATEX_MACROS = {
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\R": "\\mathbb{R}",
  "\\C": "\\mathbb{C}",
  "\\abs": "\\left|#1\\right|",
  "\\norm": "\\left\\|#1\\right\\|",
};

const KATEX_RENDER = {
  throwOnError: false,
  errorColor: "#b91c1c",
  strict: "ignore",
  trust: false,
  output: "html",
  minRuleThickness: 0.05,
  maxSize: 100,
  maxExpand: 1000,
};

const BEGIN_ENV = /^\\begin\{([A-Za-z]+\*?)\}/;

/** True when the slice looks like mathematics rather than ordinary $…$ text. */
export function looksLikeLatex(source) {
  const text = String(source ?? "").trim();
  if (!text) return false;
  if (/\\[a-zA-Z]+/.test(text)) return true;
  if (/[\^_{}]/.test(text)) return true;
  if (/[∑∏∫√∞≈≠≤≥±∂∇]/.test(text)) return true;
  if (/=/.test(text) && /[a-zA-Z]/.test(text) && /[\d+\-*/^()\\]/.test(text)) return true;
  return false;
}

function isEscaped(text, index) {
  let count = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) count += 1;
  return count % 2 === 1;
}

/** Closing delimiter index, skipping escapes and balanced `{…}`. */
function findDelimiterEnd(text, delimiter, from) {
  let braceLevel = 0;
  for (let i = from; i < text.length; i += 1) {
    if (braceLevel <= 0 && text.startsWith(delimiter, i) && !isEscaped(text, i)) {
      return i;
    }
    if (isEscaped(text, i)) continue;
    if (text[i] === "{") braceLevel += 1;
    else if (text[i] === "}") braceLevel -= 1;
  }
  return -1;
}

function findMatchingBraceEnd(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === "{") {
      depth += 1;
      continue;
    }
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function findMatchingEnvEnd(text, envName, from) {
  const begin = `\\begin{${envName}}`;
  const end = `\\end{${envName}}`;
  let depth = 1;
  let i = from;
  while (i < text.length) {
    if (text.startsWith(begin, i) && !isEscaped(text, i)) {
      depth += 1;
      i += begin.length;
      continue;
    }
    if (text.startsWith(end, i) && !isEscaped(text, i)) {
      depth -= 1;
      if (depth === 0) return i;
      i += end.length;
      continue;
    }
    i += 1;
  }
  return -1;
}

function findNextOpener(text, from) {
  for (let i = from; i < text.length; i += 1) {
    if (isEscaped(text, i)) continue;

    if (text.startsWith(MATH_MARK, i)) {
      return {
        start: i,
        left: MATH_MARK,
        right: MATH_MARK,
        display: true,
        keepDelimiters: false,
        requireLatex: false,
      };
    }

    if (text.startsWith("$$", i)) {
      return {
        start: i,
        left: "$$",
        right: "$$",
        display: true,
        keepDelimiters: false,
        requireLatex: false,
      };
    }

    if (text.startsWith("\\[", i)) {
      return {
        start: i,
        left: "\\[",
        right: "\\]",
        display: true,
        keepDelimiters: false,
        requireLatex: false,
      };
    }

    if (text.startsWith("\\(", i)) {
      return {
        start: i,
        left: "\\(",
        right: "\\)",
        display: false,
        keepDelimiters: false,
        requireLatex: true,
      };
    }

    if (text.startsWith("\\begin{", i)) {
      const match = BEGIN_ENV.exec(text.slice(i));
      if (match && MATH_ENVS.has(match[1])) {
        return {
          start: i,
          env: match[1],
          left: match[0],
          right: `\\end{${match[1]}}`,
          display: !INLINE_ENVS.has(match[1]),
          keepDelimiters: true,
          requireLatex: false,
        };
      }
    }

    if (text.startsWith("\\ce{", i) || text.startsWith("\\pu{", i)) {
      return {
        start: i,
        kind: "brace-macro",
        display: false,
        keepDelimiters: true,
        requireLatex: false,
      };
    }

    if (text[i] === "$" && text[i + 1] !== "$") {
      return {
        start: i,
        left: "$",
        right: "$",
        display: false,
        keepDelimiters: false,
        requireLatex: true,
        singleDollar: true,
      };
    }
  }
  return null;
}

function closeOpener(text, opener) {
  if (opener.kind === "brace-macro") {
    const braceAt = text.indexOf("{", opener.start);
    const end = findMatchingBraceEnd(text, braceAt);
    if (end < 0) return null;
    return { innerStart: opener.start, innerEnd: end, end };
  }

  if (opener.env) {
    const closeAt = findMatchingEnvEnd(text, opener.env, opener.start + opener.left.length);
    if (closeAt < 0) return null;
    const end = closeAt + opener.right.length;
    return { innerStart: opener.start, innerEnd: end, end };
  }

  const closeAt = findDelimiterEnd(text, opener.right, opener.start + opener.left.length);
  if (closeAt < 0) return null;
  return {
    innerStart: opener.start + opener.left.length,
    innerEnd: closeAt,
    end: closeAt + opener.right.length,
  };
}

function collectHits(input) {
  const hits = [];
  let cursor = 0;
  while (cursor < input.length) {
    const opener = findNextOpener(input, cursor);
    if (!opener) break;
    const closed = closeOpener(input, opener);
    if (!closed) {
      cursor = opener.start + 1;
      continue;
    }

    const latex = input.slice(closed.innerStart, closed.innerEnd).trim();
    if (!latex) {
      cursor = closed.end;
      continue;
    }
    if (opener.singleDollar && /[\n\r]/.test(latex)) {
      cursor = opener.start + 1;
      continue;
    }
    if (opener.requireLatex && !looksLikeLatex(latex)) {
      cursor = opener.start + 1;
      continue;
    }

    hits.push({
      start: opener.start,
      end: closed.end,
      latex,
      display: opener.display,
    });
    cursor = closed.end;
  }
  return hits;
}

export function mightContainMath(text) {
  const value = String(text ?? "");
  return (
    value.includes(MATH_MARK) ||
    value.includes("$") ||
    value.includes("\\[") ||
    value.includes("\\(") ||
    value.includes("\\begin{") ||
    value.includes("\\ce{") ||
    value.includes("\\pu{")
  );
}

/** Split plain text into ordinary runs and math runs. */
export function splitMathSegments(text) {
  const input = String(text ?? "");
  const hits = collectHits(input);
  const segments = [];
  let index = 0;
  for (const hit of hits) {
    if (hit.start > index) segments.push({ type: "text", text: input.slice(index, hit.start) });
    segments.push({ type: "math", latex: hit.latex, display: hit.display });
    index = hit.end;
  }
  if (index < input.length) segments.push({ type: "text", text: input.slice(index) });
  if (segments.length === 0) segments.push({ type: "text", text: input });
  return segments;
}

const OPENER_AT_END = /(?:##math##|\$\$|\\\[)[ \t\u200B]*$/;

/**
 * An unmatched display opener (`##math##`, `$$`, `\[`) sitting at the caret.
 * Enter opens an empty formula block.
 */
export function mathOpenAt(text, offset) {
  const head = String(text ?? "").slice(0, offset);
  const match = OPENER_AT_END.exec(head);
  if (!match) return null;
  if (collectHits(head).some((hit) => match.index >= hit.start && match.index < hit.end)) {
    return null;
  }
  return { start: match.index, end: offset };
}

/**
 * A math delimiter that just closed immediately before `offset`.
 */
export function mathMarkerAt(text, offset) {
  const head = String(text ?? "").slice(0, offset);
  const hits = collectHits(head);
  const last = hits[hits.length - 1];
  if (!last || last.end !== head.length || !last.latex) return null;
  return { start: last.start, end: offset, latex: last.latex, display: last.display };
}

export function mathBlockHtml(latex, display) {
  const mode = display ? "block" : "inline";
  return `<span class="${MATH_FORMULA_CLASS} ${MATH_FORMULA_CLASS}--${mode}" data-latex="${escapeAttr(latex)}" data-display="${mode}" contenteditable="false" spellcheck="false"></span>`;
}

function readLiveLatex(el) {
  const editor = el?.querySelector?.("[data-math-editor]");
  if (editor) return editor.value;
  return el?.getAttribute?.("data-latex") ?? "";
}

export function formulaSource(el) {
  const latex = readLiveLatex(el);
  const display = el?.getAttribute?.("data-display") !== "inline";
  if (!display) return `${MATH_MARK}${latex}${MATH_MARK}`;
  return `${MATH_MARK}\n${latex}\n${MATH_MARK}`;
}

export function isMathFormulaEl(node) {
  return node instanceof HTMLElement && node.classList.contains(MATH_FORMULA_CLASS);
}

function loadKatex() {
  if (!katexLoader) {
    katexLoader = Promise.all([
      import("katex"),
      import("katex/contrib/mhchem"),
      import("katex/dist/katex.min.css"),
    ]).then(([mod]) => mod.default);
  }
  return katexLoader;
}

function mountChrome(el) {
  const latex = el.getAttribute("data-latex") ?? "";
  const display = el.getAttribute("data-display") !== "inline";

  const toolbar = document.createElement("div");
  toolbar.className = "math-formula__toolbar";

  if (display) {
    const search = document.createElement("input");
    search.type = "text";
    search.className = "math-formula__search";
    search.setAttribute("data-math-search", "");
    search.setAttribute("tabindex", "0");
    search.setAttribute("aria-label", "Formül ara");
    search.setAttribute("placeholder", "Formül ara");
    search.setAttribute("autocomplete", "off");
    search.setAttribute("spellcheck", "false");
    search.disabled = MATH_FORMULA_PRESETS.length === 0;
    toolbar.appendChild(search);
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "math-formula__copy";
  btn.setAttribute("data-math-copy", "");
  btn.setAttribute("tabindex", "-1");
  btn.setAttribute("aria-label", "Formülü kopyala");
  btn.innerHTML = `${COPY_ICON}<span class="math-formula__copy-label"></span>`;
  toolbar.appendChild(btn);

  const render = document.createElement("div");
  render.className = "math-formula__render math-formula__render--pending";
  render.textContent = latex;

  el.replaceChildren(toolbar, render);
  return render;
}

export function prepareMathElement(el) {
  if (!(el instanceof HTMLElement)) return null;
  const display = el.getAttribute("data-display") !== "inline";
  el.className = display
    ? `${MATH_FORMULA_CLASS} ${MATH_FORMULA_CLASS}--block`
    : `${MATH_FORMULA_CLASS} ${MATH_FORMULA_CLASS}--inline`;
  el.setAttribute("contenteditable", "false");
  el.setAttribute("spellcheck", "false");
  return mountChrome(el);
}

export function createMathElement(latex, display) {
  const el = document.createElement("span");
  el.setAttribute("data-latex", latex);
  el.setAttribute("data-display", display ? "block" : "inline");
  prepareMathElement(el);
  return el;
}

const ZWSP = "\u200B";

function isCaretPad(node) {
  if (!node) return false;
  if (node.nodeType === Node.TEXT_NODE) return true;
  return node.nodeName === "BR";
}

/** Keep an editable caret sink before/after each block formula so the page cannot lock. */
export function ensureMathCaretPads(root) {
  if (!root || typeof document === "undefined") return false;
  let changed = false;
  root.querySelectorAll(`.${MATH_FORMULA_CLASS}--block`).forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    if (!isCaretPad(el.previousSibling)) {
      parent.insertBefore(document.createTextNode(ZWSP), el);
      changed = true;
    }
    if (!isCaretPad(el.nextSibling)) {
      parent.insertBefore(document.createTextNode(ZWSP), el.nextSibling);
      changed = true;
    }
  });
  return changed;
}

export function placeCaretAfterMath(el) {
  if (!el?.parentNode) return;
  const root = el.closest?.("[contenteditable='true']");
  root?.focus();
  let pad = el.nextSibling;
  if (!pad || pad.nodeType !== Node.TEXT_NODE) {
    pad = document.createTextNode(ZWSP);
    el.parentNode.insertBefore(pad, el.nextSibling);
  }
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(pad, pad.textContent.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function firstMeaningfulChild(root) {
  if (!root) return null;
  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").replace(/\u200B/g, "").trim()) {
      continue;
    }
    if (node.nodeName === "BR") continue;
    return node;
  }
  return null;
}

export async function renderMathElement(el) {
  if (!(el instanceof HTMLElement)) return;
  // Native equations already carry a MathML view and an authoritative OMML payload.
  // Mounting an empty LaTeX widget would erase that view and offer a destructive edit.
  if (el.hasAttribute("data-docx-omml")) return;
  if (el.dataset.editing === "true") return;
  const latex = el.getAttribute("data-latex") ?? "";
  const display = el.getAttribute("data-display") !== "inline";
  const render = prepareMathElement(el);
  if (!render) return;

  try {
    const katex = await loadKatex();
    katex.render(latex, render, {
      ...KATEX_RENDER,
      macros: { ...KATEX_MACROS },
      displayMode: display,
    });
    render.classList.remove("math-formula__render--pending");
    render.classList.remove("math-formula__render--error");
  } catch {
    render.textContent = latex;
    render.classList.remove("math-formula__render--pending");
    render.classList.add("math-formula__render--error");
    render.title = "Denklem görünümü yüklenemedi. Belgeyi yeniden açıp tekrar deneyin.";
  }
}

function hoistBlockFormulas(root) {
  root.querySelectorAll(`.${MATH_FORMULA_CLASS}--block`).forEach((el) => {
    let parent = el.parentElement;
    while (parent && parent.tagName === "SPAN" && !parent.isContentEditable) {
      const host = parent.parentNode;
      if (!host) break;
      host.insertBefore(el, parent.nextSibling);
      parent = el.parentElement;
    }
  });
}

function serializePlainText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest(`.${MATH_FORMULA_CLASS}, .code-block`)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const tokens = [];
  const parts = [];
  let offset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent ?? "";
    if (!text) continue;
    tokens.push({ node, start: offset, length: text.length });
    parts.push(text);
    offset += text.length;
  }
  return { text: parts.join(""), tokens };
}

function tokenAt(tokens, index, isEnd) {
  for (const token of tokens) {
    if (index < token.start) continue;
    if (index < token.start + token.length) return { token, offset: index - token.start };
    if (isEnd && index === token.start + token.length) {
      return { token, offset: token.length };
    }
  }
  return null;
}

function replaceRangeWithMath(tokens, hit) {
  const startAt = tokenAt(tokens, hit.start, false);
  const endAt = tokenAt(tokens, hit.end, true);
  if (!startAt || !endAt) return null;

  try {
    const range = document.createRange();
    range.setStart(startAt.token.node, startAt.offset);
    range.setEnd(endAt.token.node, endAt.offset);
    range.deleteContents();
    const el = createMathElement(hit.latex, hit.display);
    range.insertNode(el);
    return el;
  } catch {
    return null;
  }
}

/** Replace raw LaTeX delimiters and environments with formula wrappers. */
export function convertRawMathInRoot(root) {
  if (!root || typeof document === "undefined") return false;

  let changed = false;
  for (let guard = 0; guard < 200; guard += 1) {
    const { text, tokens } = serializePlainText(root);
    if (!mightContainMath(text)) break;
    const hit = collectHits(text)[0];
    if (!hit) break;
    const el = replaceRangeWithMath(tokens, hit);
    if (!el) break;
    changed = true;
  }

  if (changed) hoistBlockFormulas(root);
  if (ensureMathCaretPads(root)) changed = true;
  return changed;
}

export async function renderMathInRoot(root) {
  if (!root) return false;
  const nodes = root.querySelectorAll(`.${MATH_FORMULA_CLASS}`);
  if (nodes.length === 0) return false;
  await Promise.all([...nodes].map((el) => renderMathElement(el)));
  return true;
}

export async function hydrateMathInRoot(root) {
  const converted = convertRawMathInRoot(root);
  const rendered = await renderMathInRoot(root);
  return converted || rendered;
}

export async function copyFormulaSource(el) {
  const payload = formulaSource(el);
  if (!payload || payload === `${MATH_MARK}${MATH_MARK}` || payload === `${MATH_MARK}\n\n${MATH_MARK}`) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = payload;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

function markCopied(btn) {
  btn.dataset.copied = "true";
  btn.setAttribute("aria-label", "Kopyalandı");
  window.setTimeout(() => {
    delete btn.dataset.copied;
    btn.setAttribute("aria-label", "Formülü kopyala");
  }, 1600);
}

function autosizeEditor(editor) {
  if (!editor) return;
  editor.style.height = "auto";
  editor.style.height = `${Math.max(editor.scrollHeight, 36)}px`;
}

export function beginMathEdit(box) {
  if (!(box instanceof HTMLElement) || box.dataset.editing === "true") return;
  const host = box.querySelector(".math-formula__render");
  if (!host) return;
  box.dataset.editing = "true";
  const editor = document.createElement("textarea");
  editor.className = "math-formula__editor";
  editor.setAttribute("data-math-editor", "");
  editor.setAttribute("spellcheck", "false");
  editor.setAttribute("aria-label", "Formülü düzenle");
  editor.value = box.getAttribute("data-latex") ?? "";
  host.replaceChildren(editor);
  host.classList.add("math-formula__render--editing");
  host.classList.remove("math-formula__render--pending");
  autosizeEditor(editor);
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
}

function finishEdit(box, { onChange, onFit } = {}) {
  if (!(box instanceof HTMLElement) || box.dataset.editing !== "true") return;
  const editor = box.querySelector("[data-math-editor]");
  const next = editor ? editor.value.trim() : (box.getAttribute("data-latex") ?? "");
  box.setAttribute("data-latex", next);
  delete box.dataset.editing;
  renderMathElement(box).then(() => onFit?.());
  onChange?.();
}

function closeCatalog(box) {
  box?.querySelector?.("[data-math-catalog]")?.remove();
}

function catalogItems(panel) {
  return [...(panel?.querySelectorAll?.(".math-formula__catalog-item") ?? [])];
}

function setCatalogActive(panel, index) {
  const items = catalogItems(panel);
  if (items.length === 0) return;
  const next = ((index % items.length) + items.length) % items.length;
  panel.dataset.active = String(next);
  items.forEach((item, i) => {
    item.toggleAttribute("data-active", i === next);
  });
  items[next].scrollIntoView({ block: "nearest" });
}

function openCatalog(box, query) {
  if (!(box instanceof HTMLElement)) return;
  let panel = box.querySelector("[data-math-catalog]");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "math-formula__catalog";
    panel.setAttribute("data-math-catalog", "");
    box.appendChild(panel);
  }

  const hits = searchMathFormulas(query);
  panel.replaceChildren();
  if (hits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "math-formula__catalog-empty";
    empty.textContent = "Formül bulunamadı";
    panel.appendChild(empty);
    delete panel.dataset.active;
    return;
  }

  for (const item of hits) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "math-formula__catalog-item";
    btn.setAttribute("data-math-preset", String(item.index));
    btn.setAttribute("tabindex", "-1");

    const name = document.createElement("span");
    name.className = "math-formula__catalog-name";
    name.textContent = item.name;
    btn.appendChild(name);
    panel.appendChild(btn);
  }

  setCatalogActive(panel, 0);
}

function applyPreset(box, preset, { onChange, onFit } = {}) {
  if (!(box instanceof HTMLElement) || !preset) return;
  box.setAttribute("data-latex", preset.latex);
  delete box.dataset.editing;
  closeCatalog(box);
  renderMathElement(box).then(() => onFit?.());
  onChange?.();
}

/** Copy and in-place LaTeX edit for formula blocks. */
export function bindMathFormulaClicks(root, { onChange, onFit } = {}) {
  if (!root) return () => {};

  const onMouseDown = (event) => {
    if (event.target.closest?.("[data-math-catalog], [data-math-preset]")) {
      event.preventDefault();
      return;
    }
    if (event.target.closest?.(".math-formula__editor, .math-formula__render, .math-formula__search, .katex")) {
      return;
    }
    if (event.target.closest?.("[data-math-copy]")) event.preventDefault();
  };

  const onClick = (event) => {
    const presetBtn = event.target.closest?.("[data-math-preset]");
    if (presetBtn && root.contains(presetBtn)) {
      event.preventDefault();
      event.stopPropagation();
      const box = presetBtn.closest(`.${MATH_FORMULA_CLASS}`);
      const preset = MATH_FORMULA_PRESETS[Number(presetBtn.getAttribute("data-math-preset"))];
      applyPreset(box, preset, { onChange, onFit });
      return;
    }

    const btn = event.target.closest?.("[data-math-copy]");
    if (btn && root.contains(btn)) {
      event.preventDefault();
      event.stopPropagation();
      const box = btn.closest(`.${MATH_FORMULA_CLASS}`);
      if (box) {
        closeCatalog(box);
        copyFormulaSource(box).then((ok) => {
          if (ok) markCopied(btn);
        });
      }
      return;
    }

    if (event.target.closest?.("[data-math-editor], [data-math-search], [data-math-catalog]")) return;

    const render = event.target.closest?.(".math-formula__render, .katex");
    if (render && root.contains(render)) {
      event.preventDefault();
      event.stopPropagation();
      const box = render.closest(`.${MATH_FORMULA_CLASS}`);
      closeCatalog(box);
      beginMathEdit(box);
      onFit?.();
    }
  };

  const onFocusIn = (event) => {
    const search = event.target.closest?.("[data-math-search]");
    if (!search || !root.contains(search)) return;
    const box = search.closest(`.${MATH_FORMULA_CLASS}`);
    if (box) openCatalog(box, search.value);
  };

  const onFocusOut = (event) => {
    const box = event.target.closest?.(`.${MATH_FORMULA_CLASS}`);
    if (!box || !root.contains(box)) return;
    if (box.contains(event.relatedTarget)) return;
    closeCatalog(box);
    if (box.dataset.editing === "true") finishEdit(box, { onChange, onFit });
  };

  const onEditorInput = (event) => {
    const search = event.target.closest?.("[data-math-search]");
    if (search && root.contains(search)) {
      event.stopPropagation();
      const box = search.closest(`.${MATH_FORMULA_CLASS}`);
      if (box) openCatalog(box, search.value);
      return;
    }
    const editor = event.target.closest?.("[data-math-editor]");
    if (!editor || !root.contains(editor)) return;
    event.stopPropagation();
    const box = editor.closest(`.${MATH_FORMULA_CLASS}`);
    if (box) box.setAttribute("data-latex", editor.value);
    autosizeEditor(editor);
    onFit?.();
  };

  const onEditorKeyDown = (event) => {
    const search = event.target.closest?.("[data-math-search]");
    if (search && root.contains(search)) {
      event.stopPropagation();
      const box = search.closest(`.${MATH_FORMULA_CLASS}`);
      if (!box) return;
      const panel = box.querySelector("[data-math-catalog]");
      if (event.key === "Escape") {
        event.preventDefault();
        closeCatalog(box);
        search.blur();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!panel) openCatalog(box, search.value);
        const list = box.querySelector("[data-math-catalog]");
        const items = catalogItems(list);
        if (items.length === 0) return;
        const current = Number(list.dataset.active ?? 0);
        setCatalogActive(list, current + (event.key === "ArrowDown" ? 1 : -1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!panel) openCatalog(box, search.value);
        const list = box.querySelector("[data-math-catalog]");
        const items = catalogItems(list);
        const active = items[Number(list?.dataset.active ?? 0)] ?? items[0];
        if (!active) return;
        const preset = MATH_FORMULA_PRESETS[Number(active.getAttribute("data-math-preset"))];
        applyPreset(box, preset, { onChange, onFit });
      }
      return;
    }

    const editor = event.target.closest?.("[data-math-editor]");
    if (!editor || !root.contains(editor)) return;
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      editor.blur();
    }
  };

  const onEditorPaste = (event) => {
    if (!event.target.closest?.("[data-math-editor], [data-math-search]")) return;
    event.stopPropagation();
  };

  root.addEventListener("mousedown", onMouseDown);
  root.addEventListener("click", onClick);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("input", onEditorInput);
  root.addEventListener("keydown", onEditorKeyDown);
  root.addEventListener("paste", onEditorPaste);
  return () => {
    root.removeEventListener("mousedown", onMouseDown);
    root.removeEventListener("click", onClick);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("input", onEditorInput);
    root.removeEventListener("keydown", onEditorKeyDown);
    root.removeEventListener("paste", onEditorPaste);
  };
}

export function isEventInMathBlock(event) {
  return Boolean(event.target.closest?.(".math-formula"));
}
