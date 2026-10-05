/**
 * PDF text faces. A template's family is embedded from the system when it is a licensed
 * font the machine has (Times New Roman, Arial — read at runtime, never bundled); when the
 * system font is unavailable the metric-compatible OFL face ships with the app: Tinos for
 * serif families, Liberation Sans for sans families. Font bytes are inlined (browser) or
 * read from disk (Node) — never fetched, because Tauri CSP connect-src does not allow
 * loading .ttf over HTTP.
 */

export const ACADEMIC_PDF_FONT = "Tinos";
import { loadSystemFontFamily } from "./systemPdfFonts.js";

export const PDF_FALLBACK_FAMILIES = {
  serif: { family: "Tinos", files: { normal: "Tinos-Regular.ttf", bold: "Tinos-Bold.ttf", italic: "Tinos-Italic.ttf", bolditalic: "Tinos-BoldItalic.ttf" } },
  sans: { family: "LiberationSans", files: { normal: "LiberationSans-Regular.ttf", bold: "LiberationSans-Bold.ttf", italic: "LiberationSans-Italic.ttf", bolditalic: "LiberationSans-BoldItalic.ttf" } },
};
// Families the writer can read from the operating system (see systemPdfFonts.js).
const SYSTEM_FAMILY = { "times new roman": "Times New Roman", arial: "Arial" };

/** First family of a CSS font-family list, unquoted. */
export const primaryFontFamily = (value) => String(value || "").split(",")[0].replace(/["']/g, "").trim();
/** Which fallback a family maps to: sans faces or serif faces (monospace has no bundled face; serif stands in). */
export function fontClassOf(family) {
  const name = primaryFontFamily(family).toLowerCase();
  return /^(arial|helvetica|sans-serif|liberation sans|arimo|calibri|verdana|tahoma|segoe ui|open sans|roboto)$/.test(name) ? "sans" : "serif";
}

const registeredFaces = new WeakMap();
/** Registered PDF font name for a style, in the family's class (default: the first family embedded). */
export function academicPdfFont(pdf, style = "normal", family) {
  const registry = registeredFaces.get(pdf);
  if (!registry) return ACADEMIC_PDF_FONT;
  const entry = (family && registry[fontClassOf(family)]) || registry[registry.default];
  return entry?.faces[style] || entry?.faces.normal || ACADEMIC_PDF_FONT;
}
/** What was embedded: { serif?: { requested, family, source }, sans?: … } — the gate reads the PDF itself; this is for the UI. */
export function academicPdfFontOutcome(pdf) {
  const registry = registeredFaces.get(pdf) || {};
  return Object.fromEntries(Object.entries(registry).filter(([key]) => key !== "default").map(([key, entry]) => [key, { requested: entry.requested, family: entry.family, source: entry.source }]));
}
export const requiresTimesNewRoman = (templateId) => /^mcbu-lee-/.test(templateId || "");

const fontCache = new Map();

function bufferToBinary(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < data.length; offset += chunk) {
    binary += String.fromCharCode(...data.subarray(offset, offset + chunk));
  }
  return binary;
}

export function decodeFontAsset(asset) {
  const value = asset && typeof asset === "object" && "default" in asset ? asset.default : asset;
  if (value instanceof ArrayBuffer) return bufferToBinary(new Uint8Array(value));
  if (ArrayBuffer.isView(value)) {
    return bufferToBinary(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  const text = String(value ?? "");
  if (text.startsWith("data:")) {
    const comma = text.indexOf(",");
    if (comma < 0) throw new Error("PDF yazı tipi yüklenemedi");
    return atob(text.slice(comma + 1));
  }
  throw new Error("PDF yazı tipi yüklenemedi");
}

function isNodeRuntime() {
  return typeof document === "undefined";
}

async function importBrowserFont(fileName) {
  switch (fileName) {
    case "Tinos-Regular.ttf":
      return import("../assets/fonts/Tinos-Regular.ttf?inline");
    case "Tinos-Bold.ttf":
      return import("../assets/fonts/Tinos-Bold.ttf?inline");
    case "Tinos-Italic.ttf":
      return import("../assets/fonts/Tinos-Italic.ttf?inline");
    case "Tinos-BoldItalic.ttf":
      return import("../assets/fonts/Tinos-BoldItalic.ttf?inline");
    case "LiberationSans-Regular.ttf":
      return import("../assets/fonts/LiberationSans-Regular.ttf?inline");
    case "LiberationSans-Bold.ttf":
      return import("../assets/fonts/LiberationSans-Bold.ttf?inline");
    case "LiberationSans-Italic.ttf":
      return import("../assets/fonts/LiberationSans-Italic.ttf?inline");
    case "LiberationSans-BoldItalic.ttf":
      return import("../assets/fonts/LiberationSans-BoldItalic.ttf?inline");
    default:
      throw new Error("PDF yazı tipi yüklenemedi");
  }
}

async function readFontFromDisk(fileName) {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { join } = await import("node:path");
  const dir = fileURLToPath(new URL(/* @vite-ignore */ ".", import.meta.url));
  return bufferToBinary(await readFile(join(dir, "../assets/fonts", fileName)));
}

async function readFontFile(fileName) {
  const cached = fontCache.get(fileName);
  if (cached) return cached;
  const binary = isNodeRuntime()
    ? await readFontFromDisk(fileName)
    : decodeFontAsset(await importBrowserFont(fileName));
  fontCache.set(fileName, binary);
  return binary;
}

async function embedSystemFamily(pdf, family) {
  const fonts = await loadSystemFontFamily(family);
  const faces = {};
  for (const [style, font] of Object.entries(fonts)) {
    const name = font.identity.postscript;
    const file = `${name}.ttf`;
    pdf.addFileToVFS(file, bufferToBinary(font.bytes));
    pdf.addFont(file, name, style);
    pdf.setFont(name, style);
    if (!pdf.getFont().metadata?.glyIdsUsed) throw new Error(`${family} ${style} PDF kaydı başarısız.`);
    faces[style] = name;
  }
  return faces;
}

async function embedBundledFamily(pdf, fallback) {
  const faces = {};
  for (const [style, fileName] of Object.entries(fallback.files)) {
    const file = `${fallback.family}-${style}.ttf`;
    pdf.addFileToVFS(file, await readFontFile(fileName));
    pdf.addFont(file, fallback.family, style);
    faces[style] = fallback.family;
  }
  return faces;
}

/**
 * Embed the faces a document needs. `families`: the CSS families its text uses (the first is the
 * body family and becomes the default); `fontFamily` is the one-family shorthand. MCBÜ (official
 * status) requires the real Times New Roman and fails without it; every other template takes the
 * system font when the machine has it and the bundled metric-compatible face otherwise.
 */
export async function embedAcademicPdfFonts(pdf, { templateId, fontFamily, families } = {}) {
  const wanted = [...new Set((families?.length ? families : [fontFamily || "Times New Roman"]).map(primaryFontFamily).filter(Boolean))];
  if (!wanted.length) wanted.push("Times New Roman");
  const strict = requiresTimesNewRoman(templateId);
  if (strict && !wanted.includes("Times New Roman")) wanted.unshift("Times New Roman");
  const registry = registeredFaces.get(pdf) || {};
  for (const requested of wanted) {
    const cls = fontClassOf(requested);
    if (registry[cls]) continue;
    const system = SYSTEM_FAMILY[requested.toLowerCase()];
    let entry = null;
    if (system) {
      try {
        entry = { requested, family: system, source: "system", faces: await embedSystemFamily(pdf, system) };
      } catch (error) {
        if (strict) throw error;
        entry = null;
      }
    }
    if (!entry) {
      const fallback = PDF_FALLBACK_FAMILIES[cls];
      entry = { requested, family: fallback.family, source: "bundled", faces: await embedBundledFamily(pdf, fallback) };
    }
    registry[cls] = entry;
    registry.default ||= cls;
  }
  registeredFaces.set(pdf, registry);
  pdf.setFont(registry[registry.default].faces.normal, "normal");
}

export function pdfFontStyle({ bold, italic } = {}) {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}
