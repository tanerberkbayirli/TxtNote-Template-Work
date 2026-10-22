// Licensed system fonts are read at runtime, never bundled with the application.
export const TIMES_NEW_ROMAN_FACES = {
  normal: { file: "times.ttf", mac: "Times New Roman.ttf", postscript: "TimesNewRomanPSMT" },
  bold: { file: "timesbd.ttf", mac: "Times New Roman Bold.ttf", postscript: "TimesNewRomanPS-BoldMT" },
  italic: { file: "timesi.ttf", mac: "Times New Roman Italic.ttf", postscript: "TimesNewRomanPS-ItalicMT" },
  bolditalic: { file: "timesbi.ttf", mac: "Times New Roman Bold Italic.ttf", postscript: "TimesNewRomanPS-BoldItalicMT" },
};
// Liberation Serif (SIL OFL) is read from the user's installed fonts, never bundled; it is not a Times alias.
export const LIBERATION_SERIF_FACES = {
  normal: { file: "LiberationSerif-Regular.ttf", postscript: "LiberationSerif" },
  bold: { file: "LiberationSerif-Bold.ttf", postscript: "LiberationSerif-Bold" },
  italic: { file: "LiberationSerif-Italic.ttf", postscript: "LiberationSerif-Italic" },
  bolditalic: { file: "LiberationSerif-BoldItalic.ttf", postscript: "LiberationSerif-BoldItalic" },
};
export const ARIAL_FACES = {
  normal: { file: "arial.ttf", mac: "Arial.ttf", postscript: "ArialMT" },
  bold: { file: "arialbd.ttf", mac: "Arial Bold.ttf", postscript: "Arial-BoldMT" },
  italic: { file: "ariali.ttf", mac: "Arial Italic.ttf", postscript: "Arial-ItalicMT" },
  bolditalic: { file: "arialbi.ttf", mac: "Arial Bold Italic.ttf", postscript: "Arial-BoldItalicMT" },
};
export const CALIBRI_FACES = {
  normal: { file: "calibri.ttf", postscript: "Calibri" },
  bold: { file: "calibrib.ttf", postscript: "Calibri-Bold" },
  italic: { file: "calibrii.ttf", postscript: "Calibri-Italic" },
  bolditalic: { file: "calibriz.ttf", postscript: "Calibri-BoldItalic" },
};
export const CAMBRIA_MATH_FACES = {
  // Cambria Math is face 1 in Windows' installed cambria.ttc collection.
  normal: { file: "cambria.ttc", postscript: "CambriaMath", collectionIndex: 1 },
};
export const CONSOLAS_FACES = {
  normal: { file: "consola.ttf", postscript: "Consolas" },
  bold: { file: "consolab.ttf", postscript: "Consolas-Bold" },
  italic: { file: "consolai.ttf", postscript: "Consolas-Italic" },
  bolditalic: { file: "consolaz.ttf", postscript: "Consolas-BoldItalic" },
};
export const COURIER_NEW_FACES = {
  normal: { file: "cour.ttf", mac: "Courier New.ttf", postscript: "CourierNewPSMT" },
  bold: { file: "courbd.ttf", mac: "Courier New Bold.ttf", postscript: "CourierNewPS-BoldMT" },
  italic: { file: "couri.ttf", mac: "Courier New Italic.ttf", postscript: "CourierNewPS-ItalicMT" },
  bolditalic: { file: "courbi.ttf", mac: "Courier New Bold Italic.ttf", postscript: "CourierNewPS-BoldItalicMT" },
};
// Symbol-encoded (Microsoft "symbol" cmap 3,0) fonts: one face, text lives at U+F020..U+F0FF.
export const WINGDINGS_FACES = { normal: { file: "wingding.ttf", mac: "Wingdings.ttf", postscript: "Wingdings-Regular" } };
export const WINGDINGS_2_FACES = { normal: { file: "WINGDNG2.TTF", mac: "Wingdings 2.ttf", postscript: "Wingdings2" } };
export const WINGDINGS_3_FACES = { normal: { file: "WINGDNG3.TTF", mac: "Wingdings 3.ttf", postscript: "Wingdings3" } };
export const SYMBOL_FACES = { normal: { file: "symbol.ttf", postscript: "SymbolMT" } };
export const WEBDINGS_FACES = { normal: { file: "webdings.ttf", mac: "Webdings.ttf", postscript: "Webdings" } };
export const MS_MINCHO_FACES = { normal: { file: 'msmincho.ttc', postscript: 'MS-Mincho', collectionIndex: 0 } };
/**
 * Families an official template may require in its PDF, keyed by their exact family name.
 * The PDF then embeds these genuine programs (never a metric-compatible substitute).
 */
export const SYSTEM_PDF_FONT_FAMILIES = Object.freeze({ "Times New Roman": TIMES_NEW_ROMAN_FACES, Arial: ARIAL_FACES, Calibri: CALIBRI_FACES, "Cambria Math": CAMBRIA_MATH_FACES, Consolas: CONSOLAS_FACES, "Courier New": COURIER_NEW_FACES, Wingdings: WINGDINGS_FACES, "Wingdings 2": WINGDINGS_2_FACES, "Wingdings 3": WINGDINGS_3_FACES, Symbol: SYMBOL_FACES, Webdings: WEBDINGS_FACES, 'MS Mincho': MS_MINCHO_FACES, 'Liberation Serif': LIBERATION_SERIF_FACES });
/** Families whose glyphs are addressed through the symbol cmap (code points U+F020..U+F0FF). */
export const SYMBOL_ENCODED_FAMILIES = Object.freeze(new Set(["Wingdings", "Wingdings 2", "Wingdings 3", "Symbol", "Webdings"]));
export const isSymbolEncodedFamily = (value) => SYMBOL_ENCODED_FAMILIES.has(systemPdfFontFamily(value));
/**
 * Word stores symbol-font characters at U+F0xx, but plain 0x20..0xFF characters in such a run select the same glyphs.
 * Map both to the PUA code points the font's symbol cmap declares; anything else is left untouched.
 */
export function symbolFontText(text) {
  return String(text).replace(/[ -ÿ]/g, (char) => String.fromCharCode(0xF000 + char.charCodeAt(0)));
}
/** Canonical family name for a CSS/template family (case-insensitive), or null when not a system PDF family. */
export function systemPdfFontFamily(value) {
  const name = String(value || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  return Object.keys(SYSTEM_PDF_FONT_FAMILIES).find((family) => family.toLowerCase() === name) || null;
}
/** Allowlisted family table under its earlier name. */
export const SYSTEM_PDF_FAMILIES = SYSTEM_PDF_FONT_FAMILIES;

/** Read the original SFNT name table; a PDF font alias alone cannot prove identity. */
export function systemFontIdentity(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 12) throw new Error("System font file is incomplete.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x00010000) throw new Error("A TrueType SFNT font is required.");
  const tables = new Map();
  for (let i = 0; i < view.getUint16(4); i += 1) {
    const offset = 12 + i * 16;
    const tag = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    tables.set(tag, view.getUint32(offset + 8));
  }
  const nameOffset = tables.get("name");
  if (nameOffset == null) throw new Error("Font identity was not found.");
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

const TTC_TAG = 0x74746366;
const SFNT_TRUETYPE = 0x00010000;
const CHECKSUM_MAGIC = 0xb1b0afba;
const align4 = (value) => (value + 3) & ~3;

/** Extract one standalone TrueType face from a TTC. Plain SFNT files pass through unchanged. */
export function extractTrueTypeCollectionFace(input, faceIndex) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < 4) throw new Error("Font verisi eksik.");
  const source = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (source.getUint32(0) !== TTC_TAG) return bytes;
  if (bytes.byteLength < 16 || (source.getUint32(4) !== 0x00010000 && source.getUint32(4) !== 0x00020000)) {
    throw new Error("Desteklenmeyen TrueType koleksiyon başlığı.");
  }
  const count = source.getUint32(8);
  if (!Number.isInteger(faceIndex) || faceIndex < 0 || faceIndex >= count) throw new Error(`TrueType koleksiyon yüzü geçersiz (${faceIndex}).`);
  const faceOffset = source.getUint32(12 + faceIndex * 4);
  if (faceOffset + 12 > bytes.byteLength || source.getUint32(faceOffset) !== SFNT_TRUETYPE) throw new Error("TrueType koleksiyonunda desteklenmeyen font yüzü.");
  const tableCount = source.getUint16(faceOffset + 4);
  const directoryEnd = faceOffset + 12 + tableCount * 16;
  if (!tableCount || directoryEnd > bytes.byteLength) throw new Error("TrueType koleksiyonunun tablo dizini bozuk.");

  const tables = [];
  let outputLength = 12 + tableCount * 16;
  for (let index = 0; index < tableCount; index += 1) {
    const record = faceOffset + 12 + index * 16;
    const tag = String.fromCharCode(...bytes.subarray(record, record + 4));
    const checksum = source.getUint32(record + 4);
    const offset = source.getUint32(record + 8);
    const length = source.getUint32(record + 12);
    if (offset + length > bytes.byteLength) throw new Error(`TrueType koleksiyonunda ${tag} tablosu bozuk.`);
    outputLength = align4(outputLength);
    tables.push({ tag, checksum, offset, length, outputOffset: outputLength });
    outputLength += length;
  }
  const output = new Uint8Array(outputLength);
  const target = new DataView(output.buffer);
  target.setUint32(0, SFNT_TRUETYPE);
  target.setUint16(4, tableCount);
  target.setUint16(6, source.getUint16(faceOffset + 6));
  target.setUint16(8, source.getUint16(faceOffset + 8));
  target.setUint16(10, source.getUint16(faceOffset + 10));
  tables.forEach((table, index) => {
    const record = 12 + index * 16;
    for (let i = 0; i < 4; i += 1) output[record + i] = table.tag.charCodeAt(i);
    target.setUint32(record + 4, table.checksum);
    target.setUint32(record + 8, table.outputOffset);
    target.setUint32(record + 12, table.length);
    output.set(bytes.subarray(table.offset, table.offset + table.length), table.outputOffset);
  });
  const head = tables.find((table) => table.tag === "head");
  if (!head || head.length < 12) throw new Error("TrueType koleksiyonunda head tablosu bulunamadı.");
  target.setUint32(head.outputOffset + 8, 0);
  let checksum = 0;
  for (let offset = 0; offset < output.length; offset += 4) {
    const remaining = Math.min(4, output.length - offset);
    let word = 0;
    for (let index = 0; index < remaining; index += 1) word |= output[offset + index] << (24 - index * 8);
    checksum = (checksum + word) >>> 0;
  }
  target.setUint32(head.outputOffset + 8, (CHECKSUM_MAGIC - checksum) >>> 0);
  return output;
}

/**
 * jsPDF only accepts a Unicode cmap (platform 3, encoding 1). Symbol fonts declare (3,0) with the same format-4 subtable,
 * so re-label that record as (3,1); glyph mapping is unchanged and the cmap table checksum is refreshed.
 */
export function symbolCmapAsUnicode(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tableCount = view.getUint16(4);
  for (let i = 0; i < tableCount; i += 1) {
    const record = 12 + i * 16;
    if (String.fromCharCode(...bytes.subarray(record, record + 4)) !== "cmap") continue;
    const offset = view.getUint32(record + 8), length = view.getUint32(record + 12);
    const count = view.getUint16(offset + 2);
    let has31 = false, symbolRecord = -1;
    for (let k = 0; k < count; k += 1) {
      const entry = offset + 4 + k * 8;
      const platform = view.getUint16(entry), encoding = view.getUint16(entry + 2);
      if (platform === 3 && encoding === 1) has31 = true;
      if (platform === 3 && encoding === 0) symbolRecord = entry;
    }
    if (has31 || symbolRecord < 0) return bytes;
    const output = new Uint8Array(bytes);
    const target = new DataView(output.buffer);
    target.setUint16(symbolRecord + 2, 1);
    let checksum = 0;
    for (let at = 0; at < length; at += 4) {
      let word = 0;
      for (let j = 0; j < 4; j += 1) word = (word << 8) | (at + j < length ? output[offset + at + j] : 0);
      checksum = (checksum + (word >>> 0)) >>> 0;
    }
    target.setUint32(record + 4, checksum);
    return output;
  }
  return bytes;
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
        if (!font) throw new Error(`${family} sistem fontunun ${style} yüzü eksik.`);
        font.bytes = extractTrueTypeCollectionFace(font.bytes, face.collectionIndex);
        const identity = systemFontIdentity(font.bytes);
        if (identity.family !== family || identity.postscript !== face.postscript) {
          throw new Error(`Gerçek ${family} ${style} fontu bulunamadı (${font.source}).`);
        }
        // jsPDF embeds subsets; reject restricted, bitmap-only or no-subsetting fonts.
        if (identity.fsType & (0x0002 | 0x0100 | 0x0200)) throw new Error(`${family} fontunun PDF embedding izni yok.`);
        font.identity = identity;
        if (SYMBOL_ENCODED_FAMILIES.has(family)) font.bytes = symbolCmapAsUnicode(font.bytes);
      }
      return fonts;
    }).catch((error) => { cachedFamilies.delete(family); throw error; }));
  }
  return cachedFamilies.get(family);
}

/** Load and SFNT-validate each requested allowlisted family: { [canonical family]: faces }. */
export async function loadSystemPdfFonts(families = []) {
  const canonical = [...new Set(families.map((value) => {
    const name = systemPdfFontFamily(value);
    if (!name) throw new Error(`PDF yazı tipi ${String(value)} izin verilen font ailelerinden biri değil (not allowlisted).`);
    return name;
  }))];
  return Object.fromEntries(await Promise.all(canonical.map(async (family) => [family, await loadSystemFontFamily(family)])));
}

export const loadSystemTimesNewRoman = () => loadSystemFontFamily("Times New Roman");

/** Font directories searched outside Windows (tests, Linux/macOS builds). macOS ships its fonts under their full names (`mac`). */
const UNIX_FONT_DIRS = ["/usr/share/fonts/truetype/msttcorefonts", "/usr/share/fonts/truetype/mscorefonts", "/usr/share/fonts/truetype/liberation", "/usr/share/fonts/truetype/liberation2", "/usr/local/share/fonts", "/Library/Fonts", "/System/Library/Fonts/Supplemental"];

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
        for (const name of [face.file, face.file.replace(/^./, (c) => c.toUpperCase()), ...(face.mac ? [face.mac] : [])]) {
          const source = join(dir, name);
          try { return [style, { source, bytes: new Uint8Array(await readFile(source)) }]; } catch { /* next */ }
        }
      }
      if (process.platform === 'win32' && family === 'MS Mincho' && process.env.LOCALAPPDATA) {
        const { readdir } = await import('node:fs/promises');
        const dir = join(process.env.LOCALAPPDATA, 'Microsoft', 'FontCache', '4', 'CloudFonts', 'MS Mincho');
        for (const name of (await readdir(dir).catch(() => [])).sort()) {
          if (!/\.ttf$/i.test(name)) continue;
          const source = join(dir, name), bytes = new Uint8Array(await readFile(source));
          const identity = systemFontIdentity(bytes);
          if (identity.family === family && identity.postscript === face.postscript) return [style, { source, bytes }];
        }
      }
      throw new Error(`Sistemde ${family} (${face.file}) gerekli.`);
    })));
  }
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    const fonts = await invoke("read_system_font_family", { family }).catch((error) => {
      throw new Error(typeof error === "string" ? error : error?.message || `${family} sistem fontu yüklenemedi.`);
    });
    return Object.fromEntries(fonts.filter(font => font.family === family).map(font => [font.style, { source: font.source, bytes: new Uint8Array(font.bytes) }]));
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
