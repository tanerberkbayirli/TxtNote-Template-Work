/**
 * File type recognition for uploads.
 *
 * MIME first, extension as the fallback: browsers leave `File.type` empty for
 * plenty of everyday files (.md, .csv on Windows, anything the OS has no
 * registration for), and then the extension is all we have left.
 */

import { normalizeName } from "./text.js";

/** The kinds the interface knows how to draw. Everything else lands on DOCUMENT. */
export const FILE_KIND = {
  PDF: "pdf",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  SHEET: "sheet",
  ARCHIVE: "archive",
  CODE: "code",
  DOCUMENT: "document",
  BINARY: "binary",
};

/** Turkish labels, used for tooltips and screen-reader text. */
export const FILE_KIND_LABEL = {
  [FILE_KIND.PDF]: "PDF",
  [FILE_KIND.IMAGE]: "Görsel",
  [FILE_KIND.VIDEO]: "Video",
  [FILE_KIND.AUDIO]: "Ses",
  [FILE_KIND.SHEET]: "Tablo",
  [FILE_KIND.ARCHIVE]: "Arşiv",
  [FILE_KIND.CODE]: "Kod",
  [FILE_KIND.DOCUMENT]: "Belge",
  [FILE_KIND.BINARY]: "İkili dosya",
};

/* -- lookup tables ---------------------------------------------------------- */

/** Written kind → extensions, then inverted below: one list to keep in order. */
const EXTENSIONS_BY_KIND = {
  [FILE_KIND.PDF]: ["pdf"],
  [FILE_KIND.IMAGE]: [
    "png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "bmp", "svg",
    "heic", "heif", "ico", "tif", "tiff",
  ],
  [FILE_KIND.VIDEO]: [
    "mp4", "m4v", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "wmv", "3gp", "ogv", "flv",
  ],
  [FILE_KIND.AUDIO]: [
    "mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus", "wma", "aiff", "mid", "midi",
  ],
  [FILE_KIND.SHEET]: ["xls", "xlsx", "xlsm", "xlsb", "csv", "tsv", "ods", "numbers"],
  [FILE_KIND.ARCHIVE]: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "iso", "dmg"],
  [FILE_KIND.CODE]: [
    "js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts", "json", "html", "htm", "css", "scss", "less",
    "py", "pyw", "rb", "go", "rs", "java", "kt", "kts", "c", "h", "cpp", "cc", "cxx", "hpp", "hh", "hxx",
    "cs", "php", "swift", "dart", "lua", "r", "scala", "groovy", "ps1", "psm1", "bat", "cmd",
    "sh", "bash", "zsh", "yml", "yaml", "toml", "ini", "xml", "sql", "graphql", "vue", "svelte",
    "cshtml", "razor", "gradle", "properties", "conf", "cfg", "gitignore", "editorconfig", "env",
    // Dotfiles whose “extension” is the whole basename after the leading dot (.eslintrc → eslintrc).
    "eslintrc", "eslintignore", "babelrc", "prettierrc", "prettierignore", "stylelintrc", "stylelintignore",
    "npmrc", "nvmrc", "yarnrc", "dockerignore", "npmignore", "browserslistrc",
  ],
  [FILE_KIND.DOCUMENT]: [
    "doc", "docx", "odt", "rtf", "txt", "md", "markdown", "pages",
    "ppt", "pptx", "odp", "key", "epub", "mobi",
  ],
  [FILE_KIND.BINARY]: [
    "exe", "dll", "sys", "com", "msi", "scr", "pif", "cpl", "drv", "ocx",
    "so", "dylib", "a", "lib", "o", "obj", "class", "wasm", "bin", "dat", "app", "apk",
  ],
};

/** extension → kind. Built once at module load. */
const KIND_BY_EXTENSION = Object.entries(EXTENSIONS_BY_KIND).reduce((map, [kind, extensions]) => {
  extensions.forEach((extension) => {
    map[extension] = kind;
  });
  return map;
}, {});

/**
 * Exact MIME types that the `image/` `video/` `audio/` prefix checks below
 * cannot catch. Office and archive types are all `application/…`.
 */
const KIND_BY_MIME = {
  "application/pdf": FILE_KIND.PDF,
  "application/x-pdf": FILE_KIND.PDF,
  "application/acrobat": FILE_KIND.PDF,

  "application/zip": FILE_KIND.ARCHIVE,
  "application/x-zip-compressed": FILE_KIND.ARCHIVE,
  "application/vnd.rar": FILE_KIND.ARCHIVE,
  "application/x-rar-compressed": FILE_KIND.ARCHIVE,
  "application/x-7z-compressed": FILE_KIND.ARCHIVE,
  "application/gzip": FILE_KIND.ARCHIVE,
  "application/x-tar": FILE_KIND.ARCHIVE,

  "text/csv": FILE_KIND.SHEET,
  "text/tab-separated-values": FILE_KIND.SHEET,
  "application/vnd.ms-excel": FILE_KIND.SHEET,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FILE_KIND.SHEET,
  "application/vnd.oasis.opendocument.spreadsheet": FILE_KIND.SHEET,

  "application/json": FILE_KIND.CODE,
  "application/xml": FILE_KIND.CODE,
  "text/xml": FILE_KIND.CODE,
  "text/html": FILE_KIND.CODE,
  "text/css": FILE_KIND.CODE,
  "text/javascript": FILE_KIND.CODE,
  "application/javascript": FILE_KIND.CODE,
  "application/x-msdownload": FILE_KIND.BINARY,
  "application/x-msdos-program": FILE_KIND.BINARY,
  "application/vnd.microsoft.portable-executable": FILE_KIND.BINARY,
  "application/x-executable": FILE_KIND.BINARY,
  "application/x-dosexec": FILE_KIND.BINARY,
};

/* -- detection -------------------------------------------------------------- */

/** Lowercased extension without the dot, or "" when the name has none. */
export const getFileExtension = (fileName = "") => {
  const match = /\.([^./\\]+)$/.exec(String(fileName).trim());
  return match ? match[1].toLowerCase() : "";
};

/**
 * Works on a real `File` and on anything shaped like one, so a saved item can
 * be re-classified from `{ name, type }` without the original File around.
 */
export const detectFileKind = ({ name = "", type = "" } = {}) => {
  const mime = String(type).toLowerCase().split(";")[0].trim();

  if (KIND_BY_MIME[mime]) return KIND_BY_MIME[mime];
  if (mime.startsWith("image/")) return FILE_KIND.IMAGE;
  if (mime.startsWith("video/")) return FILE_KIND.VIDEO;
  if (mime.startsWith("audio/")) return FILE_KIND.AUDIO;
  if (mime.includes("pdf")) return FILE_KIND.PDF;

  // MIME said nothing useful — the file name usually still does.
  const byExtension = KIND_BY_EXTENSION[getFileExtension(name)];
  if (byExtension) return byExtension;

  return FILE_KIND.DOCUMENT;
};

/**
 * The kind a list row should draw. New uploads carry `fileKind`; the fixtures
 * and anything created before this feature only have the old `type`, so those
 * keep resolving exactly the way they used to.
 */
export const resolveItemKind = (item) => {
  if (!item) return FILE_KIND.DOCUMENT;
  if (item.fileKind && FILE_KIND_LABEL[item.fileKind]) return item.fileKind;
  return item.type === "media" ? FILE_KIND.IMAGE : FILE_KIND.DOCUMENT;
};

/* -- presentation helpers --------------------------------------------------- */

/** "Q3 raporu.pdf" → "Q3 raporu". The extension is noise once the icon says it. */
export const titleFromFileName = (fileName = "") => {
  const base = String(fileName).replace(/\.[^./\\]+$/, "");
  return normalizeName(base) || normalizeName(String(fileName)) || "Adsız dosya";
};

/** Keep the original extension if the user typed it again in the new name. */
export const stemFromRenameLabel = (label, fileName = "") => {
  const next = normalizeName(label);
  const ext = getFileExtension(fileName);
  if (!ext || !next) return next;
  const suffix = `.${ext}`;
  if (next.toLowerCase().endsWith(suffix.toLowerCase())) {
    return normalizeName(next.slice(0, -suffix.length)) || next;
  }
  return next;
};

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];

/** Human file size with Turkish decimal separator: 1536 → "1,5 KB". */
export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const decimals = exponent === 0 || value >= 10 ? 0 : 1;

  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${SIZE_UNITS[exponent]}`;
};

/** Folder names keep their dots (`.github`) and Turkish letters. */
export const folderTitleFromName = (name = "") =>
  normalizeName(String(name)) || "Adsız klasör";

const MIME_BY_EXTENSION = {
  js: "text/javascript",
  mjs: "text/javascript",
  cjs: "text/javascript",
  jsx: "text/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  json: "application/json",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  scss: "text/x-scss",
  py: "text/x-python",
  java: "text/x-java-source",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-c++",
  cs: "text/plain",
  go: "text/x-go",
  rs: "text/x-rust",
  php: "text/php",
  xml: "application/xml",
  svg: "image/svg+xml",
  sql: "application/sql",
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  yml: "text/yaml",
  yaml: "text/yaml",
  zip: "application/zip",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  exe: "application/vnd.microsoft.portable-executable",
  dll: "application/vnd.microsoft.portable-executable",
};

export const mimeFromExtension = (fileName = "") => MIME_BY_EXTENSION[getFileExtension(fileName)] || "";

const TEXT_EDIT_EXTENSIONS = new Set([
  ...EXTENSIONS_BY_KIND[FILE_KIND.CODE],
  "txt",
  "md",
  "markdown",
  "log",
  "csv",
  "tsv",
  "rst",
  "tex",
  "bib",
]);

export const isExtractableArchive = ({ name = "", type = "" } = {}) => {
  const mime = String(type).toLowerCase();
  if (mime === "application/zip" || mime === "application/x-zip-compressed") return true;
  return getFileExtension(name) === "zip";
};

export const isTextEditableFile = (item) => {
  if (!item || item.type === "folder" || item.noteType === "folder") return false;
  if (item.type === "document") return false;
  if (item.type !== "file" && item.type !== "media" && !item.fileName) return false;
  const ext = getFileExtension(item.fileName || item.title || "");
  if (TEXT_EDIT_EXTENSIONS.has(ext)) return true;
  return resolveItemKind(item) === FILE_KIND.CODE;
};

export const isExternalBinaryFile = (item) => {
  if (!item) return false;
  const kind = resolveItemKind(item);
  return kind === FILE_KIND.BINARY || kind === FILE_KIND.ARCHIVE || kind === FILE_KIND.VIDEO;
};