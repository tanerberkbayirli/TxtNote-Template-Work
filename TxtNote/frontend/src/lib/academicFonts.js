/**
 * Tinos (Times-metric, SIL OFL) for selectable Turkish text in academic PDFs.
 * Font bytes are inlined (browser) or read from disk (Node) — never fetched,
 * because Tauri CSP connect-src does not allow loading .ttf over HTTP.
 */

export const ACADEMIC_PDF_FONT = "Tinos";
import { loadSystemFontFamily, systemPdfFontFamily } from "./systemPdfFonts.js";

/** pdf → { default: family, families: { [family]: { normal, bold, italic, bolditalic } } } */
const registeredFaces = new WeakMap();
/**
 * Registered PDF font name of `style`. With `family` given, the genuine system family
 * embedded for it (if any) wins; otherwise the document's default embedded family
 * (the first system family, else Tinos).
 */
export function academicPdfFont(pdf, style = "normal", family) {
  const registry = registeredFaces.get(pdf);
  if (!registry) return ACADEMIC_PDF_FONT;
  const canonical = family ? systemPdfFontFamily(family) : null;
  return (canonical && registry.families[canonical]?.[style]) || registry.families[registry.default]?.[style] || ACADEMIC_PDF_FONT;
}
/** Is `family` embedded as a genuine system font in this PDF? */
export const hasSystemPdfFont = (pdf, family) => Boolean(registeredFaces.get(pdf)?.families[systemPdfFontFamily(family)]);
/** MCBÜ v1 notes predate template-driven font lists; they keep requiring Times New Roman. */
export const requiresTimesNewRoman = (templateId) => /^mcbu-lee-/.test(templateId || "");

const FONT_FILES = {
  normal: "Tinos-Regular.ttf",
  bold: "Tinos-Bold.ttf",
  italic: "Tinos-Italic.ttf",
  bolditalic: "Tinos-BoldItalic.ttf",
};

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

/**
 * Embed the PDF fonts. `systemFonts` lists families (e.g. ["Times New Roman", "Arial"]) an
 * official template requires: their genuine system programs are embedded and a missing
 * font fails the export visibly instead of silently substituting. Without it, Tinos
 * (metric-compatible, bundled) is embedded as before.
 */
export async function embedAcademicPdfFonts(pdf, { templateId, systemFonts = [] } = {}) {
  const families = [...new Set([...(requiresTimesNewRoman(templateId) ? ["Times New Roman"] : []), ...systemFonts].map(systemPdfFontFamily).filter(Boolean))];
  if (families.length) {
    const registry = { default: families[0], families: {} };
    for (const family of families) {
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
      registry.families[family] = faces;
    }
    registeredFaces.set(pdf, registry);
    pdf.setFont(registry.families[registry.default].normal, "normal");
    return;
  }
  for (const [style, fileName] of Object.entries(FONT_FILES)) {
    pdf.addFileToVFS(`Tinos-${style}.ttf`, await readFontFile(fileName));
    pdf.addFont(`Tinos-${style}.ttf`, ACADEMIC_PDF_FONT, style);
  }
  pdf.setFont(ACADEMIC_PDF_FONT, "normal");
}

export function pdfFontStyle({ bold, italic } = {}) {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}
