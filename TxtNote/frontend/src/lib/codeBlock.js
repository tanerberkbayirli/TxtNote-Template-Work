/**
 * Detect source code in the note body and turn it into a highlighted,
 * copyable block with a language picker.
 */

export const CODE_BLOCK_CLASS = "code-block";
export const ACADEMIC_CODE_CLASS = "academic-code";

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

const ZWSP = "\u200B";

/** Fifteen widely used languages plus an unset option. */
export const CODE_LANGUAGES = [
  { id: "auto", label: "seçilmedi", short: "seçilmedi", aliases: [] },
  { id: "javascript", label: "JavaScript", short: "Js", aliases: ["js", "jsx", "node"] },
  { id: "typescript", label: "TypeScript", short: "Ts", aliases: ["ts", "tsx"] },
  { id: "python", label: "Python", short: "Py", aliases: ["py"] },
  { id: "java", label: "Java", short: "Java", aliases: [] },
  { id: "c", label: "C", short: "C", aliases: [] },
  { id: "cpp", label: "C++", short: "C++", aliases: ["c++", "cc", "cxx"] },
  { id: "csharp", label: "C#", short: "C#", aliases: ["cs", "c#"] },
  { id: "go", label: "Go", short: "Go", aliases: ["golang"] },
  { id: "rust", label: "Rust", short: "Rust", aliases: ["rs"] },
  { id: "php", label: "PHP", short: "PHP", aliases: [] },
  { id: "html", label: "HTML", short: "html", aliases: ["xml", "htm"] },
  { id: "css", label: "CSS", short: "css", aliases: [] },
  { id: "sql", label: "SQL", short: "SQL", aliases: [] },
  { id: "json", label: "JSON", short: "JSON", aliases: [] },
  { id: "bash", label: "Bash", short: "Bash", aliases: ["sh", "shell", "zsh"] },
];

const LANGUAGE_IDS = CODE_LANGUAGES.filter((item) => item.id !== "auto").map((item) => item.id);
const DETECT_IDS = [...LANGUAGE_IDS, "xml"];

const ALIAS_TO_ID = new Map();
for (const item of CODE_LANGUAGES) {
  ALIAS_TO_ID.set(item.id, item.id);
  for (const alias of item.aliases) ALIAS_TO_ID.set(alias.toLowerCase(), item.id);
}

export const CODE_MARK = "##code##";
const FENCE_RE = /##code##(?:[ \t]*\n)?([\s\S]*?)##code##/g;

let hljsLoader = null;

function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function normalizeLanguage(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!key) return "auto";
  return ALIAS_TO_ID.get(key) ?? "auto";
}

export function languageShort(value) {
  const id = normalizeLanguage(value);
  const item = CODE_LANGUAGES.find((entry) => entry.id === id);
  return item?.short ?? item?.label ?? id;
}

/** Unset picker text, or `oto-Js` / `oto-html` when detection succeeded. */
export function autoLanguageLabel(detected) {
  const id = normalizeLanguage(detected);
  if (id === "auto") return "seçilmedi";
  return `oto-${languageShort(id)}`;
}

export function hasCodeFence(text) {
  return String(text ?? "").includes(CODE_MARK);
}

/** Strong one-liners that are still clearly source, not prose. */
const STRONG_ONE_LINER =
  /^(?:const|let|var|function|async function|export|import|def|class|fn|func|print|console|SELECT|INSERT|UPDATE|CREATE|DELETE|#include|using|package|public|private)\b|=>|:=|<\/?[a-zA-Z][^>]*>/;

/** Conservative: ordinary notes should not become code blocks. */
export function looksLikeSourceCode(text) {
  const value = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!value || hasCodeFence(value)) return false;

  const lines = value.split("\n");
  if (lines.length < 2 && !STRONG_ONE_LINER.test(value)) return false;

  let score = 0;
  if (/^\s*(import |from |export )/m.test(value)) score += 2;
  if (/^\s*(def |class |function |async function |fn |func )/m.test(value)) score += 3;
  if (/^\s*(public |private |protected |package |using |namespace )/m.test(value)) score += 3;
  if (/^\s*#include\b/m.test(value)) score += 3;
  if (/^\s*(SELECT |INSERT |UPDATE |CREATE |FROM )/im.test(value)) score += 3;
  if (/^\s*(const |let |var )\w+/m.test(value)) score += 3;
  if (/\b(print|console)\s*\./.test(value) || /^\s*print\s*\(/.test(value)) score += 2;
  if (/=>|===|!==|::|:=/.test(value)) score += 1;
  if (/[{};]/.test(value)) score += 1;
  if (/<\/?[a-zA-Z][^>]*>/.test(value)) score += 2;
  if (/^\s*(\/\/|#|\/\*|--)\s/m.test(value)) score += 1;
  if (/\b(if|for|while|return)\b[\s\S]{0,40}[({]/.test(value)) score += 2;
  if (lines.filter((line) => /^\s{2,}|\t/.test(line)).length >= 2) score += 2;

  const letters = (value.match(/\p{L}/gu) ?? []).length;
  const symbols = (value.match(/[{}();=<>[\]]/g) ?? []).length;
  if (letters > 80 && symbols < 3) return false;

  const oneLiner = lines.length < 2;
  return score >= (oneLiner ? 2 : 4);
}

/**
 * Guess a language from short, high-signal snippets.
 * highlight.js often scores these below its usual cutoff.
 */
export function guessLanguage(code) {
  const value = String(code ?? "").trim();
  if (!value) return "auto";

  if (/^\s*[{\[]/.test(value) && /["'][^"']+["']\s*:/.test(value)) {
    try {
      JSON.parse(value);
      return "json";
    } catch {
      /* not JSON */
    }
  }

  if (/<\?php\b/i.test(value)) return "php";
  if (/<(html|head|body|div|span|p|a|img|ul|li|table|form|input|button|h[1-6]|script|style)\b/i.test(value)) {
    return "html";
  }
  if (/[.#]?[\w-]+\s*\{[^}]*[a-z-]+\s*:[^;}]+[;}]/.test(value)) return "css";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/im.test(value)) return "sql";
  if (/^\s*#include\b/m.test(value)) return /\b(iostream|vector|string|std::)/.test(value) ? "cpp" : "c";
  if (/\b(std::|nullptr|cout|cin)\b/.test(value)) return "cpp";
  if (/\b(using System|Console\.|async Task)\b/.test(value)) return "csharp";
  if (/\b(public class |System\.out|@Override)\b/.test(value)) return "java";
  if (/\b(package main\b|fmt\.|func \w+\()/.test(value) || /:=/.test(value)) return "go";
  if (/\b(fn |let mut |impl |println!)/.test(value)) return "rust";
  if (
    /^\s*(def |class |from \w+ import |print\s*\()/m.test(value) ||
    (/\b(elif |None\b|self\.)/.test(value) && !/\b(function |const |let |var )/.test(value))
  ) {
    return "python";
  }
  if (/\b(interface |type \w+\s*=|:\s*(string|number|boolean|void)\b)/.test(value)) return "typescript";
  if (/\b(const |let |var |function |=>|console\.|document\.|export )/.test(value)) return "javascript";
  if (/^\s*(import .+ from ['"`]|import\s*\{)/m.test(value)) return "javascript";
  if (/^\s*#!/.test(value) || /^\s*(echo |export \w+=|sudo |npm |git |chmod )/m.test(value)) return "bash";
  return "auto";
}

export function splitCodeSegments(text) {
  const input = String(text ?? "");
  const hits = [];
  const re = new RegExp(FENCE_RE.source, "g");
  let match;
  while ((match = re.exec(input))) {
    const start = match.index;
    const end = match.index + match[0].length;
    const code = match[1].replace(/^\n/, "").replace(/\n$/, "");
    if (!code.trim()) continue;
    hits.push({
      start,
      end,
      code,
      language: "auto",
    });
  }

  const segments = [];
  let index = 0;
  for (const hit of hits) {
    if (hit.start > index) segments.push({ type: "text", text: input.slice(index, hit.start) });
    segments.push({ type: "code", code: hit.code, language: hit.language });
    index = hit.end;
  }
  if (index < input.length) segments.push({ type: "text", text: input.slice(index) });
  if (segments.length === 0) segments.push({ type: "text", text: input });
  return segments;
}

/**
 * A ##code## opener sitting immediately before `offset` (Enter opens the block).
 */
export function codeOpenAt(text, offset) {
  const head = String(text ?? "").slice(0, offset);
  const match = /##code##[ \t\u200B]*$/.exec(head);
  if (!match) return null;
  return { start: match.index, end: offset };
}

/**
 * A ##code## pair that just closed immediately before `offset`.
 */
export function codeMarkerAt(text, offset) {
  const head = String(text ?? "").slice(0, offset);
  const match = /##code##(?:[ \t]*\n)?([\s\S]*?)##code##$/.exec(head);
  if (!match) return null;
  const code = match[1].replace(/^\n/, "").replace(/\n$/, "");
  if (!code.trim()) return null;
  return {
    start: match.index,
    end: offset,
    code,
    language: "auto",
  };
}

export function codeBlockHtml(code, language) {
  const lang = normalizeLanguage(language);
  return `<span class="${CODE_BLOCK_CLASS}" data-code="${escapeAttr(code)}" data-language="${escapeAttr(lang)}" contenteditable="false" spellcheck="false"></span>`;
}

export function academicCodeHtml(code) {
  return `<pre class="${ACADEMIC_CODE_CLASS}">${escapeHtml(code)}</pre>`;
}

function normalizeCodeText(value) {
  return String(value ?? "").replace(/\u200B/g, "").replace(/\r\n/g, "\n").replace(/\t/g, "    ");
}

export function createAcademicCodeElement(code = "") {
  const el = document.createElement("pre");
  el.className = ACADEMIC_CODE_CLASS;
  el.setAttribute("spellcheck", "false");
  el.textContent = normalizeCodeText(code);
  return el;
}

export function codeFromElement(el) {
  if (el?.classList?.contains(ACADEMIC_CODE_CLASS)) return normalizeCodeText(el.textContent);
  const attr = el?.getAttribute?.("data-code");
  if (attr != null && attr !== "") return normalizeCodeText(attr);
  const editor = el?.querySelector?.("[data-code-editor], .code-block__editor");
  if (editor && "value" in editor && editor.value) return normalizeCodeText(editor.value);
  const source = el?.querySelector?.(".code-block__source");
  if (source) return normalizeCodeText(source.textContent);
  if (el?.tagName === "PRE") return normalizeCodeText(el.textContent);
  return "";
}

export function codeSource(el) {
  const code = codeFromElement(el);
  return `${CODE_MARK}\n${code}\n${CODE_MARK}`;
}

export function isAcademicCodeEl(node) {
  return node instanceof HTMLElement && node.classList.contains(ACADEMIC_CODE_CLASS);
}

export function isCodeBlockEl(node) {
  return node instanceof HTMLElement && (node.classList.contains(CODE_BLOCK_CLASS) || isAcademicCodeEl(node));
}

/** Turn highlighted widgets into a monospace listing for academic papers. */
export function flattenCodeBlocksForAcademic(root) {
  if (!root?.querySelectorAll) return false;
  let changed = false;
  root.querySelectorAll(`.${CODE_BLOCK_CLASS}`).forEach((el) => {
    el.replaceWith(createAcademicCodeElement(codeFromElement(el)));
    changed = true;
  });
  return changed;
}

function loadHljs() {
  if (!hljsLoader) {
    hljsLoader = (async () => {
      const hljs = (await import("highlight.js/lib/core")).default;
      const loaders = [
        ["javascript", () => import("highlight.js/lib/languages/javascript")],
        ["typescript", () => import("highlight.js/lib/languages/typescript")],
        ["python", () => import("highlight.js/lib/languages/python")],
        ["java", () => import("highlight.js/lib/languages/java")],
        ["c", () => import("highlight.js/lib/languages/c")],
        ["cpp", () => import("highlight.js/lib/languages/cpp")],
        ["csharp", () => import("highlight.js/lib/languages/csharp")],
        ["go", () => import("highlight.js/lib/languages/go")],
        ["rust", () => import("highlight.js/lib/languages/rust")],
        ["php", () => import("highlight.js/lib/languages/php")],
        ["xml", () => import("highlight.js/lib/languages/xml")],
        ["css", () => import("highlight.js/lib/languages/css")],
        ["sql", () => import("highlight.js/lib/languages/sql")],
        ["json", () => import("highlight.js/lib/languages/json")],
        ["bash", () => import("highlight.js/lib/languages/bash")],
        ["markdown", () => import("highlight.js/lib/languages/markdown")],
        ["yaml", () => import("highlight.js/lib/languages/yaml")],
      ];
      const loaded = await Promise.all(loaders.map(async ([name, load]) => [name, (await load()).default]));
      for (const [name, def] of loaded) hljs.registerLanguage(name, def);
      const xml = loaded.find(([name]) => name === "xml")?.[1];
      if (xml) hljs.registerLanguage("html", xml);
      return hljs;
    })();
  }
  return hljsLoader;
}

function detectLanguage(hljs, code) {
  const hinted = guessLanguage(code);
  const trimmed = String(code ?? "").trim();
  const short = trimmed.length < 96 || trimmed.split("\n").length <= 2;

  try {
    const result = hljs.highlightAuto(code, DETECT_IDS);
    const hlLang = normalizeLanguage(result.language);
    const relevance = result.relevance ?? 0;

    if (hinted !== "auto") {
      if (short || relevance < 8 || hlLang === "auto" || hlLang === hinted) return hinted;
      return hlLang;
    }

    const minRel = short ? 1 : 4;
    if (hlLang !== "auto" && relevance >= minRel) return hlLang;
    return "auto";
  } catch {
    return hinted;
  }
}

function highlightCode(hljs, code, language) {
  if (language === "plaintext") return { html: escapeHtml(code), language: "plaintext" };
  if (language === "markdown" || language === "yaml") {
    try {
      const result = hljs.highlight(code, { language, ignoreIllegals: true });
      return { html: result.value, language };
    } catch {
      return { html: escapeHtml(code), language };
    }
  }
  let lang = normalizeLanguage(language);
  if (lang === "auto") lang = detectLanguage(hljs, code);
  if (lang === "auto") return { html: escapeHtml(code), language: "auto" };
  try {
    const result = hljs.highlight(code, { language: lang === "html" ? "xml" : lang, ignoreIllegals: true });
    return { html: result.value, language: lang };
  } catch {
    return { html: escapeHtml(code), language: lang };
  }
}

export async function highlightSource(code, language) {
  try {
    const hljs = await loadHljs();
    return highlightCode(hljs, code, language);
  } catch {
    return { html: escapeHtml(code), language: language || "auto" };
  }
}

function fillLangSelect(select, picked, detected) {
  const chosen = normalizeLanguage(picked);
  select.replaceChildren();
  for (const item of CODE_LANGUAGES) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.id === "auto" ? autoLanguageLabel(chosen === "auto" ? detected : "auto") : item.label;
    select.appendChild(option);
  }
  select.value = chosen;
}

function mountChrome(el) {
  const language = normalizeLanguage(el.getAttribute("data-language"));
  const code = el.getAttribute("data-code") ?? "";

  const toolbar = document.createElement("div");
  toolbar.className = "code-block__toolbar";

  const select = document.createElement("select");
  select.className = "code-block__lang";
  select.setAttribute("data-code-lang", "");
  select.setAttribute("tabindex", "-1");
  select.setAttribute("aria-label", "Kod dili");
  fillLangSelect(select, language, "auto");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "code-block__copy";
  btn.setAttribute("data-code-copy", "");
  btn.setAttribute("tabindex", "-1");
  btn.setAttribute("aria-label", "Kodu kopyala");
  btn.innerHTML = `${COPY_ICON}<span class="code-block__copy-label"></span>`;

  toolbar.append(select, btn);

  const pre = document.createElement("pre");
  pre.className = "code-block__render";
  const codeEl = document.createElement("code");
  codeEl.className = "code-block__source";
  codeEl.textContent = code;
  pre.appendChild(codeEl);

  el.replaceChildren(toolbar, pre);
  return { select, codeEl };
}

export function prepareCodeElement(el) {
  if (!(el instanceof HTMLElement)) return null;
  el.className = CODE_BLOCK_CLASS;
  el.setAttribute("contenteditable", "false");
  el.setAttribute("spellcheck", "false");
  return mountChrome(el);
}

export function createCodeElement(code, language) {
  const el = document.createElement("span");
  el.setAttribute("data-code", code);
  el.setAttribute("data-language", normalizeLanguage(language));
  prepareCodeElement(el);
  return el;
}

export async function renderCodeElement(el) {
  if (!(el instanceof HTMLElement)) return;
  if (el.dataset.editing === "true") return;
  const code = el.getAttribute("data-code") ?? "";
  const stored = normalizeLanguage(el.getAttribute("data-language"));
  const chrome = prepareCodeElement(el);
  if (!chrome) return;

  try {
    const hljs = await loadHljs();
    const { html, language } = highlightCode(hljs, code, stored);
    fillLangSelect(chrome.select, stored, stored === "auto" ? language : "auto");
    chrome.codeEl.className = `code-block__source hljs language-${language === "auto" ? "plaintext" : language}`;
    chrome.codeEl.innerHTML = html;
  } catch {
    chrome.codeEl.textContent = code;
  }
}

function hoistCodeBlocks(root) {
  root.querySelectorAll(`.${CODE_BLOCK_CLASS}`).forEach((el) => {
    let parent = el.parentElement;
    while (
      parent &&
      parent.tagName === "SPAN" &&
      !parent.isContentEditable &&
      !parent.classList.contains(CODE_BLOCK_CLASS)
    ) {
      const host = parent.parentNode;
      if (!host) break;
      host.insertBefore(el, parent.nextSibling);
      parent = el.parentElement;
    }
  });
}

function isCaretPad(node) {
  if (!node) return false;
  if (node.nodeType === Node.TEXT_NODE) return true;
  return node.nodeName === "BR";
}

export function ensureCodeCaretPads(root) {
  if (!root || typeof document === "undefined") return false;
  let changed = false;
  root.querySelectorAll(`.${CODE_BLOCK_CLASS}, .${ACADEMIC_CODE_CLASS}`).forEach((el) => {
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

export function convertRawCodeInRoot(root, { plain = false } = {}) {
  if (!root || typeof document === "undefined") return false;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest(`.${CODE_BLOCK_CLASS}, .${ACADEMIC_CODE_CLASS}, .math-formula`)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!(node.textContent ?? "").includes(CODE_MARK)) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let changed = false;
  for (const node of nodes) {
    if (!node.parentNode) continue;
    const segments = splitCodeSegments(node.textContent ?? "");
    if (segments.every((seg) => seg.type === "text")) continue;

    const frag = document.createDocumentFragment();
    for (const seg of segments) {
      if (seg.type === "text") {
        if (seg.text) frag.appendChild(document.createTextNode(seg.text));
        continue;
      }
      frag.appendChild(plain ? createAcademicCodeElement(seg.code) : createCodeElement(seg.code, seg.language));
    }
    node.parentNode.replaceChild(frag, node);
    changed = true;
  }

  if (changed && !plain) hoistCodeBlocks(root);
  if (ensureCodeCaretPads(root)) changed = true;
  return changed;
}

export async function renderCodeInRoot(root) {
  if (!root) return false;
  const nodes = root.querySelectorAll(`.${CODE_BLOCK_CLASS}`);
  if (nodes.length === 0) return false;
  await Promise.all([...nodes].map((el) => renderCodeElement(el)));
  return true;
}

function readLiveCode(el) {
  const editor = el?.querySelector?.("[data-code-editor]");
  if (editor) return editor.value;
  return el?.getAttribute?.("data-code") ?? "";
}

function autosizeEditor(editor) {
  if (!editor) return;
  editor.style.height = "auto";
  editor.style.height = `${Math.max(editor.scrollHeight, 72)}px`;
}

function insertInEditor(editor, text) {
  const start = editor.selectionStart ?? editor.value.length;
  const end = editor.selectionEnd ?? start;
  editor.value = `${editor.value.slice(0, start)}${text}${editor.value.slice(end)}`;
  const caret = start + text.length;
  editor.selectionStart = caret;
  editor.selectionEnd = caret;
}

export function beginCodeEdit(box) {
  if (!(box instanceof HTMLElement) || box.dataset.editing === "true") return;
  const pre = box.querySelector(".code-block__render");
  if (!pre) return;
  box.dataset.editing = "true";
  const editor = document.createElement("textarea");
  editor.className = "code-block__editor";
  editor.setAttribute("data-code-editor", "");
  editor.setAttribute("spellcheck", "false");
  editor.setAttribute("aria-label", "Kod düzenle");
  editor.value = box.getAttribute("data-code") ?? "";
  pre.replaceChildren(editor);
  autosizeEditor(editor);
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
}

function finishEdit(box, { onChange, onFit } = {}) {
  if (!(box instanceof HTMLElement) || box.dataset.editing !== "true") return;
  const editor = box.querySelector("[data-code-editor]");
  const next = editor ? editor.value : (box.getAttribute("data-code") ?? "");
  box.setAttribute("data-code", next);
  delete box.dataset.editing;
  renderCodeElement(box).then(() => onFit?.());
  onChange?.();
}

export async function copyCodeSource(el) {
  const payload = readLiveCode(el);
  if (!payload) return false;
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
    btn.setAttribute("aria-label", "Kodu kopyala");
  }, 1600);
}

/** Copy, language pick, in-place edit, and caret-after-click for code blocks. */
export function bindCodeBlockEvents(root, { onChange, onFit } = {}) {
  if (!root) return () => {};

  const onMouseDown = (event) => {
    if (
      event.target.closest?.(
        "select.code-block__lang, .code-block__editor, .code-block__source, .code-block__render",
      )
    ) {
      return;
    }
    if (event.target.closest?.("[data-code-copy]")) event.preventDefault();
  };

  const onClick = (event) => {
    const btn = event.target.closest?.("[data-code-copy]");
    if (btn && root.contains(btn)) {
      event.preventDefault();
      event.stopPropagation();
      const box = btn.closest(`.${CODE_BLOCK_CLASS}`);
      if (box) {
        copyCodeSource(box).then((ok) => {
          if (ok) markCopied(btn);
        });
      }
      return;
    }

    if (event.target.closest?.("select.code-block__lang, [data-code-editor]")) return;

    const render = event.target.closest?.(".code-block__source, .code-block__render");
    if (render && root.contains(render)) {
      event.preventDefault();
      event.stopPropagation();
      beginCodeEdit(render.closest(`.${CODE_BLOCK_CLASS}`));
      onFit?.();
      return;
    }
  };

  const onLangChange = (event) => {
    const select = event.target.closest?.("select.code-block__lang");
    if (!select || !root.contains(select)) return;
    const box = select.closest(`.${CODE_BLOCK_CLASS}`);
    if (!box) return;
    if (box.dataset.editing === "true") {
      const editor = box.querySelector("[data-code-editor]");
      if (editor) box.setAttribute("data-code", editor.value);
    }
    box.setAttribute("data-language", normalizeLanguage(select.value));
    if (box.dataset.editing === "true") return;
    renderCodeElement(box);
    onChange?.();
  };

  const onFocusOut = (event) => {
    const box = event.target.closest?.(`.${CODE_BLOCK_CLASS}`);
    if (!box || !root.contains(box) || box.dataset.editing !== "true") return;
    if (box.contains(event.relatedTarget)) return;
    finishEdit(box, { onChange, onFit });
  };

  const onEditorInput = (event) => {
    const editor = event.target.closest?.("[data-code-editor]");
    if (!editor || !root.contains(editor)) return;
    event.stopPropagation();
    const box = editor.closest(`.${CODE_BLOCK_CLASS}`);
    if (box) box.setAttribute("data-code", editor.value);
    autosizeEditor(editor);
    onFit?.();
  };

  const onEditorKeyDown = (event) => {
    const editor = event.target.closest?.("[data-code-editor]");
    if (!editor || !root.contains(editor)) return;
    event.stopPropagation();
    if (event.key === "Tab") {
      event.preventDefault();
      insertInEditor(editor, "\t");
      const box = editor.closest(`.${CODE_BLOCK_CLASS}`);
      if (box) box.setAttribute("data-code", editor.value);
      autosizeEditor(editor);
      onFit?.();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      editor.blur();
    }
  };

  const onEditorPaste = (event) => {
    if (!event.target.closest?.("[data-code-editor]")) return;
    event.stopPropagation();
  };

  root.addEventListener("mousedown", onMouseDown);
  root.addEventListener("click", onClick);
  root.addEventListener("change", onLangChange);
  root.addEventListener("focusout", onFocusOut);
  root.addEventListener("input", onEditorInput);
  root.addEventListener("keydown", onEditorKeyDown);
  root.addEventListener("paste", onEditorPaste);
  return () => {
    root.removeEventListener("mousedown", onMouseDown);
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onLangChange);
    root.removeEventListener("focusout", onFocusOut);
    root.removeEventListener("input", onEditorInput);
    root.removeEventListener("keydown", onEditorKeyDown);
    root.removeEventListener("paste", onEditorPaste);
  };
}

export function isEventInCodeBlock(event) {
  return Boolean(event.target.closest?.(".code-block, .academic-code"));
}
