// Licensed system fonts are read at runtime, never bundled with the application.
// Paths remain allowlisted here and in the native IPC; callers can request a
// family name, never an arbitrary filesystem path.
export const SYSTEM_PDF_FAMILIES = Object.freeze({
  "Times New Roman": Object.freeze({
    normal: { file: "times.ttf", postscript: "TimesNewRomanPSMT" },
    bold: { file: "timesbd.ttf", postscript: "TimesNewRomanPS-BoldMT" },
    italic: { file: "timesi.ttf", postscript: "TimesNewRomanPS-ItalicMT" },
    bolditalic: { file: "timesbi.ttf", postscript: "TimesNewRomanPS-BoldItalicMT" },
  }),
  Arial: Object.freeze({
    normal: { file: "arial.ttf", postscript: "ArialMT" },
    bold: { file: "arialbd.ttf", postscript: "Arial-BoldMT" },
    italic: { file: "ariali.ttf", postscript: "Arial-ItalicMT" },
    bolditalic: { file: "arialbi.ttf", postscript: "Arial-BoldItalicMT" },
  }),
});

export const TIMES_NEW_ROMAN_FACES = SYSTEM_PDF_FAMILIES["Times New Roman"];

const familyKey = value => String(value ?? "").trim().toLocaleLowerCase("en-US");
const canonicalSystemFamily = value => Object.keys(SYSTEM_PDF_FAMILIES).find(name => familyKey(name) === familyKey(value)) || null;
const cachedFamilies = new Map();

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

async function validatedSystemFamily(family) {
  const faces = SYSTEM_PDF_FAMILIES[family];
  const fonts = await readSystemFonts(family);
  const result = {};
  for (const [style, face] of Object.entries(faces)) {
    const font = fonts[style];
    if (!font) throw new Error("System font family " + family + " is missing its " + style + " face.");
    const identity = systemFontIdentity(font.bytes);
    if (identity.family !== family || identity.postscript !== face.postscript) {
      throw new Error("Expected actual " + family + " " + style + " font; found " + String(identity.family) + " / " + String(identity.postscript) + " (" + font.source + ").");
    }
    // jsPDF subsets the embedded face: reject restricted, bitmap-only and no-subsetting fonts.
    if (identity.fsType & (0x0002 | 0x0100 | 0x0200)) throw new Error(family + " " + style + " font does not permit PDF embedding.");
    result[style] = { ...font, family, identity };
  }
  return result;
}

/** Load and SFNT-validate each requested allowlisted native family. */
export async function loadSystemPdfFonts(families = []) {
  const canonical = [...new Set(families.map(value => {
    const name = canonicalSystemFamily(value);
    if (!name) throw new Error("PDF font family " + String(value) + " is not allowlisted.");
    return name;
  }))];
  return Object.fromEntries(await Promise.all(canonical.map(async family => {
    if (!cachedFamilies.has(family)) {
      const pending = validatedSystemFamily(family).catch(error => {
        cachedFamilies.delete(family);
        throw error;
      });
      cachedFamilies.set(family, pending);
    }
    return [family, await cachedFamilies.get(family)];
  })));
}

export async function loadSystemTimesNewRoman() {
  return (await loadSystemPdfFonts(["Times New Roman"]))["Times New Roman"];
}

async function readSystemFonts(family) {
  const faces = SYSTEM_PDF_FAMILIES[family];
  if (typeof document === "undefined") {
    if (process.platform !== "win32") throw new Error("PDF export requires the installed Windows " + family + " font.");
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const root = process.env.SystemRoot || process.env.WINDIR;
    if (!root) throw new Error("Windows font directory was not found.");
    return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
      const source = join(root, "Fonts", face.file);
      return [style, { source, bytes: new Uint8Array(await readFile(source)) }];
    })));
  }
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    const fonts = await invoke("read_system_pdf_fonts", { families: [family] }).catch(error => {
      throw new Error(typeof error === "string" ? error : error?.message || "System " + family + " font could not be loaded.");
    });
    return Object.fromEntries(fonts.filter(font => font.family === family).map(font => [font.style, { source: font.source, bytes: new Uint8Array(font.bytes) }]));
  }
  if (typeof window.queryLocalFonts !== "function") throw new Error("Browser access to the installed " + family + " font is required. Use the desktop application.");
  const fonts = await window.queryLocalFonts({ postscriptNames: Object.values(faces).map(face => face.postscript) });
  return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
    const font = fonts.find(item => item.postscriptName === face.postscript);
    if (!font) throw new Error(family + " " + style + " system font was not found.");
    return [style, { source: "local-font:" + font.postscriptName, bytes: new Uint8Array(await (await font.blob()).arrayBuffer()) }];
  })));
}
