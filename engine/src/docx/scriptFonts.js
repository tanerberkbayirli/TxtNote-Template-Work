/** Word rFonts slots: resolve isolated General Punctuation runs carrying the
 * East Asian hint. Unresolved East Asian slots use Word's Windows Mincho face.
 * Mixed-script runs retain their original face until per-character projection
 * is available; never switch their Latin text to a CJK font wholesale. */
export function sourceScriptRunFont(node) {
  if (node?.type !== 'run') return null;
  const style = node.properties?.resolvedSource || {};
  const hint = style.fontHint || /w:hint="([^"]+)"/.exec(node.properties?.runPropertiesXml || '')?.[1];
  if (hint !== 'eastAsia') return null;
  const text = n => n.type === 'text' ? n.text : (n.children || []).map(text).join('');
  if (!/^[\u2000-\u206f]+$/.test(text(node))) return null;
  const family = style.eastAsiaFontFamily || 'MS Mincho';
  if (family === 'Times New Roman' && style.fontFamily) return style.fontFamily;
  return family;
}

export function sourceScriptFontRequests(document) {
  if (document?.formatMode !== 'source' || document.source?.format !== 'docx') return [];
  const families = new Set();
  const walk = nodes => { for (const n of nodes || []) { const font = sourceScriptRunFont(n); if (font) families.add(font); walk(n.children); } };
  for (const section of document.sections || []) walk(section.nodes);
  return [...families];
}
