/**
 * Programming-language labels for uploaded source files.
 *
 * Extension wins until the user picks otherwise. Content is only a check: when
 * it clearly disagrees with the extension we show a quiet choice, still using
 * the extension in the meantime.
 */

import { guessLanguage, languageShort, normalizeLanguage } from "./codeBlock.js";
import { getFileExtension } from "./fileType.js";

export const FILE_CODE_LANGUAGES = [
  { id: "plaintext", label: "Düz metin", short: "Metin" },
  { id: "javascript", label: "JavaScript", short: "JavaScript" },
  { id: "typescript", label: "TypeScript", short: "TypeScript" },
  { id: "python", label: "Python", short: "Python" },
  { id: "java", label: "Java", short: "Java" },
  { id: "c", label: "C", short: "C" },
  { id: "cpp", label: "C++", short: "C++" },
  { id: "csharp", label: "C#", short: "C#" },
  { id: "go", label: "Go", short: "Go" },
  { id: "rust", label: "Rust", short: "Rust" },
  { id: "php", label: "PHP", short: "PHP" },
  { id: "html", label: "HTML", short: "HTML" },
  { id: "css", label: "CSS", short: "CSS" },
  { id: "sql", label: "SQL", short: "SQL" },
  { id: "json", label: "JSON", short: "JSON" },
  { id: "bash", label: "Bash", short: "Bash" },
  { id: "markdown", label: "Markdown", short: "Markdown" },
  { id: "yaml", label: "YAML", short: "YAML" },
  { id: "xml", label: "XML", short: "XML" },
];

const LANGUAGE_BY_EXTENSION = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  py: "python",
  pyw: "python",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hh: "cpp",
  hxx: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  html: "html",
  htm: "html",
  cshtml: "html",
  vue: "html",
  svelte: "html",
  css: "css",
  scss: "css",
  less: "css",
  sql: "sql",
  json: "json",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "bash",
  bat: "bash",
  cmd: "bash",
  md: "markdown",
  markdown: "markdown",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  svg: "xml",
  rb: "plaintext",
  kt: "java",
  kts: "java",
  swift: "plaintext",
  dart: "plaintext",
  lua: "plaintext",
  r: "plaintext",
  toml: "plaintext",
  ini: "plaintext",
  graphql: "plaintext",
  txt: "plaintext",
  log: "plaintext",
  csv: "plaintext",
  tsv: "plaintext",
  env: "plaintext",
  gitignore: "plaintext",
  editorconfig: "plaintext",
  eslintrc: "json",
  babelrc: "json",
  prettierrc: "json",
  yarnrc: "json",
  stylelintrc: "json",
  eslintignore: "plaintext",
  prettierignore: "plaintext",
  stylelintignore: "plaintext",
  dockerignore: "plaintext",
  npmignore: "plaintext",
  npmrc: "plaintext",
  nvmrc: "plaintext",
  browserslistrc: "plaintext",
};

const COMPATIBLE_GROUPS = [
  new Set(["javascript", "typescript", "json"]),
  new Set(["html", "xml"]),
  new Set(["c", "cpp"]),
  new Set(["css"]),
  new Set(["bash"]),
  new Set(["yaml", "plaintext"]),
  new Set(["markdown", "html", "plaintext"]),
  new Set(["plaintext"]),
];

const KNOWN_IDS = new Set(FILE_CODE_LANGUAGES.map((item) => item.id));

export function languageFromExtension(fileName = "") {
  const ext = getFileExtension(fileName);
  return LANGUAGE_BY_EXTENSION[ext] || "";
}

export function languageLabel(id) {
  const key = normalizeFileLanguage(id);
  const item = FILE_CODE_LANGUAGES.find((entry) => entry.id === key);
  return item?.label ?? languageShort(key) ?? "Düz metin";
}

export function normalizeFileLanguage(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!key || key === "auto") return "plaintext";
  if (KNOWN_IDS.has(key)) return key;
  const aliased = normalizeLanguage(key);
  if (aliased && aliased !== "auto" && KNOWN_IDS.has(aliased)) return aliased;
  if (aliased === "xml") return "html";
  return "plaintext";
}

export function languagesCompatible(left, right) {
  const a = normalizeFileLanguage(left);
  const b = normalizeFileLanguage(right);
  if (!a || !b) return true;
  if (a === b) return true;
  if (a === "plaintext" || b === "plaintext") return true;
  return COMPATIBLE_GROUPS.some((group) => group.has(a) && group.has(b));
}

export function detectContentLanguage(content) {
  const hinted = guessLanguage(content);
  if (!hinted || hinted === "auto") return "";
  return normalizeFileLanguage(hinted);
}

/**
 * Manual choice always wins. Otherwise the extension is the default, and a
 * content mismatch only produces a conflict object — it never silently
 * overrides the extension.
 */
export function resolveFileLanguage({
  fileName = "",
  content = "",
  manualLanguage = "",
  languageLocked = false,
} = {}) {
  const manual = languageLocked || manualLanguage ? normalizeFileLanguage(manualLanguage) : "";
  if (manual && (languageLocked || manualLanguage)) {
    return {
      language: manual || languageFromExtension(fileName) || "plaintext",
      source: "manual",
      conflict: null,
    };
  }

  const fromExt = languageFromExtension(fileName) || "plaintext";
  const fromContent = detectContentLanguage(content);
  if (fromContent && fromExt !== "plaintext" && !languagesCompatible(fromExt, fromContent)) {
    return {
      language: fromExt,
      source: "extension",
      conflict: {
        extension: fromExt,
        content: fromContent,
        extensionLabel: languageLabel(fromExt),
        contentLabel: languageLabel(fromContent),
      },
    };
  }

  return {
    language: fromExt || fromContent || "plaintext",
    source: fromExt !== "plaintext" ? "extension" : fromContent ? "content" : "default",
    conflict: null,
  };
}

export function conflictMessage(conflict) {
  if (!conflict) return "";
  return `Dosyanın uzantısı ${conflict.extensionLabel}, ancak içeriği ${conflict.contentLabel}'e benziyor. Hangi dili kullanmak istersiniz?`;
}
