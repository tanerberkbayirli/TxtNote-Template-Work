import { loadSystemFontFamily } from './systemPdfFonts.js';
const loaded = new Map();
/** Register the same validated installed font program in preview and PDF. */
export function ensureSourceScriptFonts(families, doc = document) {
  return Promise.all(families.map(family => {
    if (!loaded.has(family)) loaded.set(family, loadSystemFontFamily(family).then(async faces => {
      const face = new FontFace(family, faces.normal.bytes, { style: 'normal', weight: '400' });
      doc.fonts.add(face);
      await face.load();
    }).catch(error => { loaded.delete(family); throw error; }));
    return loaded.get(family);
  }));
}
