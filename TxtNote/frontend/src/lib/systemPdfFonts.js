// Licensed system fonts are read at runtime, never bundled with the application.
export const TIMES_NEW_ROMAN_FACES = {
  normal: { file: "times.ttf", postscript: "TimesNewRomanPSMT" },
  bold: { file: "timesbd.ttf", postscript: "TimesNewRomanPS-BoldMT" },
  italic: { file: "timesi.ttf", postscript: "TimesNewRomanPS-ItalicMT" },
  bolditalic: { file: "timesbi.ttf", postscript: "TimesNewRomanPS-BoldItalicMT" },
};

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

let cachedFonts;
export async function loadSystemTimesNewRoman() {
  if (!cachedFonts) {
    cachedFonts = readSystemFonts().then((fonts) => {
      for (const [style, face] of Object.entries(TIMES_NEW_ROMAN_FACES)) {
        const font = fonts[style];
        const identity = systemFontIdentity(font.bytes);
        if (identity.family !== "Times New Roman" || identity.postscript !== face.postscript) {
          throw new Error(`Gerçek Times New Roman ${style} fontu bulunamadı (${font.source}).`);
        }
        // jsPDF embeds subsets; reject restricted, bitmap-only or no-subsetting fonts.
        if (identity.fsType & (0x0002 | 0x0100 | 0x0200)) throw new Error("Times New Roman fontunun PDF embedding izni yok.");
        font.identity = identity;
      }
      return fonts;
    }).catch((error) => { cachedFonts = null; throw error; });
  }
  return cachedFonts;
}

async function readSystemFonts() {
  if (typeof document === "undefined") {
    if (process.platform !== "win32") throw new Error("MCBÜ PDF için sistemde Times New Roman gerekli.");
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const root = process.env.SystemRoot || process.env.WINDIR;
    if (!root) throw new Error("Windows font dizini bulunamadı.");
    return Object.fromEntries(await Promise.all(Object.entries(TIMES_NEW_ROMAN_FACES).map(async ([style, face]) => {
      const source = join(root, "Fonts", face.file);
      return [style, { source, bytes: new Uint8Array(await readFile(source)) }];
    })));
  }
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    const fonts = await invoke("read_times_new_roman_fonts").catch((error) => {
      throw new Error(typeof error === "string" ? error : error?.message || "Times New Roman sistem fontu yüklenemedi.");
    });
    return Object.fromEntries(fonts.map((font) => [font.style, { source: font.source, bytes: new Uint8Array(font.bytes) }]));
  }
  // Chromium's local-font API is the browser equivalent of the desktop IPC.
  if (typeof window.queryLocalFonts !== "function") throw new Error("MCBÜ PDF için Times New Roman sistem fontuna erişim gerekli. Masaüstü uygulamasını kullanın.");
  const fonts = await window.queryLocalFonts({ postscriptNames: Object.values(TIMES_NEW_ROMAN_FACES).map((face) => face.postscript) });
  return Object.fromEntries(await Promise.all(Object.entries(TIMES_NEW_ROMAN_FACES).map(async ([style, face]) => {
    const font = fonts.find((item) => item.postscriptName === face.postscript);
    if (!font) throw new Error(`Times New Roman ${style} sistemde bulunamadı.`);
    return [style, { source: `local-font:${font.postscriptName}`, bytes: new Uint8Array(await (await font.blob()).arrayBuffer()) }];
  })));
}
