// Licensed system fonts are read at runtime, never bundled with the application.
// Each family lists its four faces: the PostScript name that proves identity, the
// Windows font file and the macOS file under /System/Library/Fonts/Supplemental.
export const SYSTEM_FONT_FAMILIES = {
  "Times New Roman": {
    normal: { file: "times.ttf", mac: "Times New Roman.ttf", postscript: "TimesNewRomanPSMT" },
    bold: { file: "timesbd.ttf", mac: "Times New Roman Bold.ttf", postscript: "TimesNewRomanPS-BoldMT" },
    italic: { file: "timesi.ttf", mac: "Times New Roman Italic.ttf", postscript: "TimesNewRomanPS-ItalicMT" },
    bolditalic: { file: "timesbi.ttf", mac: "Times New Roman Bold Italic.ttf", postscript: "TimesNewRomanPS-BoldItalicMT" },
  },
  Arial: {
    normal: { file: "arial.ttf", mac: "Arial.ttf", postscript: "ArialMT" },
    bold: { file: "arialbd.ttf", mac: "Arial Bold.ttf", postscript: "Arial-BoldMT" },
    italic: { file: "ariali.ttf", mac: "Arial Italic.ttf", postscript: "Arial-ItalicMT" },
    bolditalic: { file: "arialbi.ttf", mac: "Arial Bold Italic.ttf", postscript: "Arial-BoldItalicMT" },
  },
};
export const TIMES_NEW_ROMAN_FACES = SYSTEM_FONT_FAMILIES["Times New Roman"];

/** Read the original SFNT name table; a PDF font alias alone cannot prove identity. */
export function systemFontIdentity(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== 0x00010000) throw new Error("TrueType font gerekli.");
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
/** The four faces of an installed family, identity-checked and embeddable, or a thrown reason. */
export async function loadSystemFontFamily(family) {
  const faces = SYSTEM_FONT_FAMILIES[family];
  if (!faces) throw new Error(`${family} sistem fontu desteklenmiyor.`);
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

async function readSystemFonts(family, faces) {
  if (typeof document === "undefined") {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    let directory;
    if (process.platform === "win32") {
      const root = process.env.SystemRoot || process.env.WINDIR;
      if (!root) throw new Error("Windows font dizini bulunamadı.");
      directory = join(root, "Fonts");
    } else if (process.platform === "darwin") {
      directory = "/System/Library/Fonts/Supplemental";
    } else throw new Error(`${family} için sistem fontu yalnız Windows ve macOS'ta okunur.`);
    return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
      const source = join(directory, process.platform === "darwin" ? face.mac : face.file);
      return [style, { source, bytes: new Uint8Array(await readFile(source)) }];
    })));
  }
  if (window.__TAURI_INTERNALS__) {
    // The desktop command reads the four Times New Roman files only; other families use the browser path below.
    if (family !== "Times New Roman") throw new Error(`${family} masaüstü uygulamasında sistemden okunmuyor.`);
    const { invoke } = await import("@tauri-apps/api/core");
    const fonts = await invoke("read_times_new_roman_fonts").catch((error) => {
      throw new Error(typeof error === "string" ? error : error?.message || "Times New Roman sistem fontu yüklenemedi.");
    });
    return Object.fromEntries(fonts.map((font) => [font.style, { source: font.source, bytes: new Uint8Array(font.bytes) }]));
  }
  // Chromium's local-font API is the browser equivalent of the desktop IPC.
  if (typeof window.queryLocalFonts !== "function") throw new Error(`${family} için sistem fontuna erişim gerekli. Masaüstü uygulamasını kullanın.`);
  const fonts = await window.queryLocalFonts({ postscriptNames: Object.values(faces).map((face) => face.postscript) });
  return Object.fromEntries(await Promise.all(Object.entries(faces).map(async ([style, face]) => {
    const font = fonts.find((item) => item.postscriptName === face.postscript);
    if (!font) throw new Error(`${family} ${style} sistemde bulunamadı.`);
    return [style, { source: `local-font:${font.postscriptName}`, bytes: new Uint8Array(await (await font.blob()).arrayBuffer()) }];
  })));
}
