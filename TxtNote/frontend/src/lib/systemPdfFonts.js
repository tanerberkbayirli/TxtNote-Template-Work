// Licensed system fonts are read at runtime, never bundled with the application.
export const TIMES_NEW_ROMAN_FACES = {
  normal: { file: "times.ttf", postscript: "TimesNewRomanPSMT" },
  bold: { file: "timesbd.ttf", postscript: "TimesNewRomanPS-BoldMT" },
  italic: { file: "timesi.ttf", postscript: "TimesNewRomanPS-ItalicMT" },
  bolditalic: { file: "timesbi.ttf", postscript: "TimesNewRomanPS-BoldItalicMT" },
};
export const ARIAL_FACES = {
  normal: { file: "arial.ttf", postscript: "ArialMT" },
  bold: { file: "arialbd.ttf", postscript: "Arial-BoldMT" },
  italic: { file: "ariali.ttf", postscript: "Arial-ItalicMT" },
  bolditalic: { file: "arialbi.ttf", postscript: "Arial-BoldItalicMT" },
};
/**
 * Families an official template may require in its PDF, keyed by their exact family name.
 * The PDF then embeds these genuine programs (never a metric-compatible substitute).
 */
export const SYSTEM_PDF_FONT_FAMILIES = Object.freeze({ "Times New Roman": TIMES_NEW_ROMAN_FACES, Arial: ARIAL_FACES });
/** Canonical family name for a CSS/template family (case-insensitive), or null when not a system PDF family. */
export function systemPdfFontFamily(value) {
  const name = String(value || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  return Object.keys(SYSTEM_PDF_FONT_FAMILIES).find((family) => family.toLowerCase() === name) || null;
}

/** Read the original SFNT name table; a PDF font alias alone cannot prove identity. */
export function systemFontIdentity(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x00010000) throw new Error("Times New Roman TrueType fontu gerekli.");
  const tables = new Map();
  for (let i = 0; i < view.getUint16(4); i += 1) {
    const offset = 12 + i * 16;
    const tag = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    tables.set(tag, view.getUint32(offset + 8));
  }
  const nameOffset = tables.get("name");
  if (nameOffset == null) throw new Error("Font kimliği bulunamadı.");
  const strings = nameOffset + view.getUint16(nameOffset + 4);
  const names = new Map();
  for (let i = 0; i < view.getUint16(nameOffset + 2); i += 1) {
    const record = nameOffset + 6 + i * 12;
    const platform = view.getUint16(record);
    if (platform !== 0 && platform !== 3) continue;
    const id = view.getUint16(record + 6);
    const length = view.getUint16(record + 8);
    const start = strings + view.getUint16(record + 10);
    let text = "";
    for (let j = 0; j < length; j += 2) text += String.fromCharCode(view.getUint16(start + j));
    if (!names.has(id) || view.getUint16(record + 4) === 0x409) names.set(id, text);
  }
  const os2 = tables.get("OS/2");
  return { family: names.get(1), subfamily: names.get(2), postscript: names.get(6), fsType: os2 == null ? 0 : view.getUint16(os2 + 8) };
}

const cachedFamilies = new Map();
/** Genuine regular/bold/italic/bolditalic programs of `family`, verified by their name table. */
export async function loadSystemFontFamily(family) {
  const faces = SYSTEM_PDF_FONT_FAMILIES[family];
  if (!faces) throw new Error(`${family} için sistem font tanımı yok.`);
  if (!cachedFamilies.has(family)) {
    cachedFamilies.set(family, readSystemFonts(family, faces).then((fonts) => {
      for (const [style, face] of Object.entries(faces)) {
        const font = fonts[style];
        const identity = systemFontIdentity(font.bytes);
        if (identity.family !== family || identity.postscript !== face.postscript) {
          throw new Error(`Gerçek ${family} ${style} fontu bulunamadı (${font.source}).`);
        }
        // jsPDF embeds subsets; reject restricted, bitmap-only or no-subsetting fonts.
        if (identity.fsType & (0x0002 | 0x0100 | 0x0200)) throw new Error(`${family} fontunun PDF embedding izni yok.`);
        font.identity = identity;
      }
      return fonts;
    }).catch((error) => { cachedFamilies.delete(family); throw error; }));
  }
  return cachedFamilies.get(family);
}

export const loadSystemTimesNewRoman = () => loadSystemFontFamily("Times New Roman");

/** Font directories searched outside Windows (tests, Linux/macOS builds). */
const UNIX_FONT_DIRS = ["/usr/share/fonts/truetype/msttcorefonts", "/usr/share/fonts/truetype/mscorefonts", "/usr/local/share/fonts", "/Library/Fonts", "/System/Library/Fonts/Supplementary"];

async function readSystemFonts(family, faces) {
  if (typeof document === "undefined") {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { homedir } = await import("node:os");
    const root = process.env.SystemRoot || process.env.WINDIR;
    const dirs = process.platform === "win32" ? (root ? [join(root, "Fonts")] : []) : [...UNIX_FONT_DIRS, join(homedir(), ".fonts"), join(homedir(), ".local/share/fonts")];
    if (!dirs.length) throw new Error("Windows font dizini bulunamadı.");
    return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
      for (const dir of dirs) {
        for (const name of [face.file, face.file.replace(/^./, (c) => c.toUpperCase())]) {
          const source = join(dir, name);
          try { return [style, { source, bytes: new Uint8Array(await readFile(source)) }]; } catch { /* next */ }
        }
      }
      throw new Error(`Sistemde ${family} (${face.file}) gerekli.`);
    })));
  }
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    const call = family === "Times New Roman" ? invoke("read_times_new_roman_fonts") : invoke("read_system_font_family", { family });
    const fonts = await call.catch((error) => {
      throw new Error(typeof error === "string" ? error : error?.message || `${family} sistem fontu yüklenemedi.`);
    });
    return Object.fromEntries(fonts.map((font) => [font.style, { source: font.source, bytes: new Uint8Array(font.bytes) }]));
  }
  // Chromium's local-font API is the browser equivalent of the desktop IPC.
  if (typeof window.queryLocalFonts !== "function") throw new Error(`Bu şablonun PDF'i için ${family} sistem fontuna erişim gerekli. Masaüstü uygulamasını kullanın.`);
  const fonts = await window.queryLocalFonts({ postscriptNames: Object.values(faces).map((face) => face.postscript) });
  return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
    const font = fonts.find((item) => item.postscriptName === face.postscript);
    if (!font) throw new Error(`${family} ${style} sistemde bulunamadı.`);
    return [style, { source: `local-font:${font.postscriptName}`, bytes: new Uint8Array(await (await font.blob()).arrayBuffer()) }];
  })));
}
