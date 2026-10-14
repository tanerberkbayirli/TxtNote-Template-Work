/**
 * Tinos (Times-metric, SIL OFL) for selectable Turkish text in academic PDFs.
 * Font bytes are inlined (browser) or read from disk (Node) — never fetched,
 * because Tauri CSP connect-src does not allow loading .ttf over HTTP.
 */

export const ACADEMIC_PDF_FONT = "Tinos";
import { loadSystemPdfFonts, systemPdfFontFamily } from "./systemPdfFonts.js";

/** pdf → { default: family, families: { [family]: { normal, bold, italic, bolditalic } } } */
const registeredFaces = new WeakMap();
export const requiresTimesNewRoman = (templateId) => /^mcbu-lee-/.test(templateId || "");

const FAMILY_NAMES = new Map([["tinos", ACADEMIC_PDF_FONT]]);
export function normalizeAcademicPdfFamily(value) {
  const first = String(value || "").split(",")[0].replace(/[\"']/g, "").trim().toLocaleLowerCase("en-US");
  return FAMILY_NAMES.get(first) || systemPdfFontFamily(first);
}

/** Explicit custom document styles and resolved positioned nodes need their stated face. */
export function collectAcademicPdfFontRequests(documentLayout, sections = []) {
  const requested = new Map();
  const addStyle = style => {
    if (typeof style?.fontFamily !== "string" || !style.fontFamily.trim()) return;
    const family = normalizeAcademicPdfFamily(style.fontFamily) || style.fontFamily.trim();
    requested.set(family.toLocaleLowerCase("en-US"), family);
  };
  addStyle(documentLayout?.typography?.document);
  for (const style of Object.values(documentLayout?.typography?.sections || {})) addStyle(style);
  for (const override of Object.values(documentLayout?.elements || {})) addStyle(override?.style);
  for (const addition of documentLayout?.additions || []) addStyle(addition?.style);
  const visit = nodes => {
    for (const node of nodes || []) {
      if (node?.layoutMode === "absolute" || node?.layoutMode === "anchored") addStyle(node.style);
      if (node?.type === "group") visit(node.blocks);
    }
  };
  for (const section of sections || []) visit(section.layout);
  return [...requested.values()];
}

/** Registered PDF font name of `style` in `family` (its regular face when the family has one face), else the document default. */
export function academicPdfFont(pdf, style = "normal", family) {
  return academicPdfFontFace(pdf, style, family).name;
}
/** Exact face of an explicitly requested family; fails instead of substituting another family. */
export function exactAcademicPdfFont(pdf, style, family) {
  const canonical = normalizeAcademicPdfFamily(family);
  const faces = canonical && registeredFaces.get(pdf)?.families.get(canonical);
  const name = faces?.[style] || faces?.normal;
  if (!name) throw new Error(`PDF için ${String(family)} ${style} yazı tipi gerçek bir yüz olarak yüklenmedi.`);
  return name;
}

/** Registered font name and style; a family without the variant (Cambria Math) uses its regular face. */
export function academicPdfFontFace(pdf, style = "normal", family) {
  const state = registeredFaces.get(pdf);
  if (!state) return { name: ACADEMIC_PDF_FONT, style };
  const canonical = family ? normalizeAcademicPdfFamily(family) : null;
  const faces = canonical && state.families.get(canonical);
  if (faces?.[style]) return { name: faces[style], style };
  if (faces?.normal) return { name: faces.normal, style: "normal" };
  const fallback = state.families.get(state.defaultFamily);
  return fallback?.[style] ? { name: fallback[style], style } : { name: ACADEMIC_PDF_FONT, style };
}
/** Is `family` embedded as a genuine system font in this PDF? */
export const hasSystemPdfFont = (pdf, family) => {
  const canonical = systemPdfFontFamily(family);
  return Boolean(canonical && registeredFaces.get(pdf)?.families.get(canonical));
};

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
 * Embed the PDF fonts. `systemFonts` lists families an official template requires (e.g.
 * ["Times New Roman", "Cambria Math"]); `extraFontFamilies` are families the user's layout
 * styles name explicitly. Genuine system programs are embedded and a missing font fails the
 * export visibly instead of silently substituting. Otherwise Tinos (bundled) is the default.
 */
export async function embedAcademicPdfFonts(pdf, { templateId, extraFontFamilies = [], systemFonts = [] } = {}) {
  const canonical = (value) => {
    const family = normalizeAcademicPdfFamily(value);
    if (!family) throw new Error(`PDF yazı tipi ${String(value)} izin verilen font ailelerinden biri değil.`);
    return family;
  };
  const templateFamilies = systemFonts.map(canonical);
  const defaultFamily = requiresTimesNewRoman(templateId) ? "Times New Roman" : templateFamilies[0] || ACADEMIC_PDF_FONT;
  const required = new Set([defaultFamily, ...templateFamilies, ...extraFontFamilies.map(canonical)]);
  const families = new Map();
  for (const family of required) {
    if (family === ACADEMIC_PDF_FONT) {
      const faces = {};
      for (const [style, fileName] of Object.entries(FONT_FILES)) {
        const file = `Tinos-${style}.ttf`;
        pdf.addFileToVFS(file, await readFontFile(fileName));
        pdf.addFont(file, ACADEMIC_PDF_FONT, style);
        faces[style] = ACADEMIC_PDF_FONT;
      }
      families.set(family, faces);
      continue;
    }
    const nativeFonts = (await loadSystemPdfFonts([family]))[family];
    const faces = {};
    for (const [style, font] of Object.entries(nativeFonts)) {
      const name = font.identity.postscript;
      const file = `${name}.ttf`;
      pdf.addFileToVFS(file, bufferToBinary(font.bytes));
      pdf.addFont(file, name, style);
      pdf.setFont(name, style);
      if (!pdf.getFont().metadata?.glyIdsUsed) throw new Error(`${family} ${style} PDF font registration failed.`);
      faces[style] = name;
    }
    families.set(family, faces);
  }
  registeredFaces.set(pdf, { families, defaultFamily });
  pdf.setFont(academicPdfFont(pdf, "normal"), "normal");
}

export function pdfFontStyle({ bold, italic } = {}) {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}
