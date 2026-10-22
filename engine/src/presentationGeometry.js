import { cssLineBaselineOffset } from './wordBaseline.js';
const MM = 25.4 / 96;
/** Freeze the visible geometry at the export epoch; never store DOM scaffolding. */
export function measurePresentationGeometry(root) {
  const result = {};
  for (const node of root?.querySelectorAll('[data-layout-presentation],.thesis-page-number[data-layout-id]') || []) {
    const stack = node.closest('.thesis-page-stack');
    if (!stack || getComputedStyle(node).display === 'none') continue;
    const style = getComputedStyle(node), rect = node.getBoundingClientRect(), origin = stack.getBoundingClientRect();
    const scale = origin.width / parseFloat(getComputedStyle(stack).width);
    const sheets = [...stack.querySelectorAll('.thesis-sheet')];
    const sheet = sheets.find(sheet => { const box = sheet.getBoundingClientRect(); return rect.top >= box.top - 1 && rect.top < box.bottom; });
    if (!sheet || !scale) continue;
    const box = sheet.getBoundingClientRect();
    const baseline = cssLineBaselineOffset(style, node.ownerDocument);
    result[node.dataset.layoutId] = { groupId: stack.querySelector('.thesis-paper')?.dataset.thesisSection,
      pageIndex: sheets.indexOf(sheet), page: Number(sheet.dataset.thesisPage), label: sheet.dataset.thesisPageLabel || '',
      xMm: (rect.left-box.left)/scale*MM, yMm: (rect.top-box.top)/scale*MM,
      widthMm: rect.width/scale*MM, heightMm: rect.height/scale*MM,
      ...(Number.isFinite(baseline) ? { baselineMm: (rect.top-box.top)/scale*MM + baseline*MM } : {}),
      style: { fontFamily: style.fontFamily.split(',')[0].replace(/["']/g,''), fontSizePt: parseFloat(style.fontSize)*.75,
        fontWeight: Number(style.fontWeight), italic: style.fontStyle === 'italic', align: style.textAlign, lineHeight: parseFloat(style.lineHeight)/parseFloat(style.fontSize) } };
  }
  return result;
}
