import { normalizeThesisLayout, resolveLayoutElement } from './layoutDocument.js';
import { plainThesisText } from './sourceHtml.js';

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const presentationId = (sectionId, kind, key) => `${sectionId}:presentation:${kind}:${encodeURIComponent(key)}`;

function textSpan(body) {
  const opening = '<span class="thesis-index-text">';
  const start = body.indexOf(opening);
  if (start < 0) return null;
  const contentStart = start + opening.length;
  let depth = 1;
  const spans = /<span\b[^>]*>|<\/span>/g; spans.lastIndex = contentStart;
  for (let match; (match = spans.exec(body));) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return { contentStart, end: match.index, inner: body.slice(contentStart, match.index) };
  }
  return null;
}
const indexFields = /<span class="thesis-index-(?:leader|page)"[^>]*>[\s\S]*?<\/span>/g;
const PAGE_SPAN = /<span class="thesis-index-page"([^>]*)>([\s\S]*?)<\/span>/;

/** Register non-editor paragraphs with the same document-local layout model as
 * cover blocks. Generated row anchors, rather than their order, identify rows.
 * Keep the original HTML (leaders, page fields and inline formatting) intact.
 */
export function resolvePresentationHtml(html, section, thesisLayout, kind = 'static') {
  const layout = normalizeThesisLayout(thesisLayout);
  const elements = [];
  let ordinal = 0;
  const result = String(html || '').replace(/<(h[1-6]|p|li|div(?=\s+class="thesis-index-page-heading"))\b([^>]*)>([\s\S]*?)<\/\1>/gi, (whole, tag, attrs, inner) => {
    // Only paragraph divs explicitly emitted by the index renderer are leaves.
    if (tag.toLowerCase() === 'div' && !/class="thesis-index-page-heading"/.test(attrs)) return whole;
    if (/data-layout-id=|data-layout-frame-line=/.test(attrs) || !plainThesisText(inner)) return whole;
    const anchor = attrs.match(/data-index-target="([^"]*)"/)?.[1];
    const key = anchor ? `row:${anchor}` : `${tag.toLowerCase()}:${ordinal++}`;
    const id = presentationId(section.id, kind, key);
    const row = Boolean(anchor);
    const span = row ? textSpan(inner) : null;
    const content = row ? span?.inner.replace(indexFields, '') : inner;
    const base = { id, sectionId: section.id, type: 'text', layoutMode: 'flow',
      text: plainThesisText(content), editableLayout: true, editableContent: true, locked: false,
      style: /^h/i.test(tag) ? (section.rules.headings?.[tag.slice(1)] || section.rules.body) : section.generatedIndex?.style || section.rules.body,
      presentation: true };
    const node = resolveLayoutElement(base, layout);
    if (!node) return '';
    node.override = layout.elements[id] || {};
    elements.push(node);
    const override = typeof node.override.content === 'string' ? node.override.content : node.override.text;
    let body = inner;
    if (row) {
      // Replace only the row label. Its page number remains a live generated field.
      if (override !== undefined && span) body = body.slice(0, span.contentStart) + escape(override)
        + (span.inner.match(indexFields) || []).join('') + body.slice(span.end);
      const editableSpan = textSpan(body);
      if (editableSpan) {
        const fields = editableSpan.inner.match(indexFields) || [];
        const label = editableSpan.inner.replace(indexFields, '');
        body = body.slice(0, editableSpan.contentStart)
          + `<span data-layout-content="">${label}</span>` + fields.join('')
          + body.slice(editableSpan.end);
      }
      // The page number (or the row's "Sayfa" heading) is its own object: its typography is set apart from the row text,
      // its value stays the live generated field (not editable as text).
      const page = body.match(PAGE_SPAN);
      const pageNode = page && resolveLayoutElement({ id: presentationId(section.id, kind, `page:${anchor}`), sectionId: section.id, type: 'text', layoutMode: 'flow',
        text: plainThesisText(page[2]), editableLayout: true, editableContent: false, locked: false,
        style: section.generatedIndex?.style || section.rules.body, presentation: true }, layout);
      if (pageNode) {
        pageNode.override = layout.elements[pageNode.id] || {};
        elements.push(pageNode);
        body = body.replace(PAGE_SPAN, `<span class="thesis-index-page"$1 data-layout-id="${escape(pageNode.id)}" data-layout-section="${escape(section.id)}" data-layout-type="text" data-layout-locked="false" data-layout-editable-content="false" data-layout-presentation="true">$2</span>`);
      }
    } else if (override !== undefined) body = escape(override).replace(/\n/g, '<br>');
    const slotHeight = node.override.flowHeightMm;
    const positioned = ['absolute', 'anchored'].includes(node.layoutMode);
    const slotTag = tag.toLowerCase() === 'li' ? 'li' : 'div';
    const slot = positioned && slotHeight > 0 ? `<${slotTag} data-layout-flow-slot="${escape(id)}" aria-hidden="true"></${slotTag}>` : '';
    return `${slot}<${tag}${attrs} data-layout-id="${escape(id)}" data-layout-section="${escape(section.id)}" data-layout-type="text" data-layout-locked="${Boolean(node.locked)}" data-layout-presentation="true">${body}</${tag}>`;
  });
  return { html: result, elements };
}

/** Only authored overrides are emitted: untouched template typography and list
 * structure keep their original CSS and pagination. Scoped selectors win over
 * generated-index rules without rewriting their source definitions.
 */
export function presentationLayoutCss(elements = []) {
  return elements.flatMap(node => {
    const id = JSON.stringify(node.id);
    const selector = `.thesis-paper [data-layout-id=${id}][data-layout-presentation]`;
    const declarations = [];
    const override = node.override || {};
    const css = (name, value, important = true) => declarations.push(`${name}:${value}${important ? ' !important' : ''}`);
    const style = override.style || {};
    const fields = { fontFamily: ['font-family', v => JSON.stringify(v)], fontSizePt: ['font-size', v => `${v}pt`],
      fontWeight: ['font-weight', String], italic: ['font-style', v => v ? 'italic' : 'normal'], align: ['text-align', String],
      decoration: ['text-decoration', String], color: ['color', String], lineHeight: ['line-height', String],
      characterSpacingPt: ['letter-spacing', v => `${v}pt`], firstLineIndentMm: ['text-indent', v => `${v}mm`],
      leftIndentMm: ['padding-left', v => `${v}mm`], rightIndentMm: ['padding-right', v => `${v}mm`],
      spaceBeforePt: ['margin-top', v => `${v}pt`], spaceAfterPt: ['margin-bottom', v => `${v}pt`] };
    for (const [key, value] of Object.entries(style)) if (fields[key]) css(fields[key][0], fields[key][1](value));
    if (['absolute', 'anchored'].includes(node.layoutMode)) {
      for (const [name, value] of Object.entries({ position: 'absolute', left: `calc(${node.xMm}mm - var(--thesis-layout-origin-x,${node.originXMm || 0}mm))`, top: `calc(${node.yMm}mm - var(--thesis-layout-origin-y,${node.originYMm || 0}mm))`, margin: '0', 'box-sizing': 'border-box', 'z-index': (node.zIndex || 0) + 1 })) css(name, value);
    }
    if (Number.isFinite(override.widthMm)) css('width', `${override.widthMm}mm`, false);
    if (Number.isFinite(override.heightMm)) css('min-height', `${override.heightMm}mm`, false);
    const rows = declarations.length ? [`${selector}{${declarations.join(';')}}`] : [];
    if (style.align && node.id.includes(':generated:')) rows.push(`${selector} .thesis-index-text{flex:1;text-align:${style.align}}`);
    if (override.flowHeightMm > 0) rows.push(`.thesis-paper [data-layout-flow-slot=${id}]{display:block;height:${override.flowHeightMm}mm;flex:none;list-style:none;margin:${override.flowMarginTopMm || 0}mm 0 ${override.flowMarginBottomMm || 0}mm !important;padding:0}`);
    return rows;
  }).join('\n');
}

/** Presentation props for automatic page text. Its value remains generated;
 * position and typography use the same saved overrides as every other object.
 */
export function chromePresentationProps(id, sectionId, baseStyle, layout, pageTopMm = 0) {
  const node = layout?.elements?.[id] || {};
  const s = node.style || {};
  const style = { ...baseStyle, pointerEvents: 'auto' };
  for (const [key, value] of Object.entries(s)) {
    const names = { fontFamily: 'fontFamily', fontWeight: 'fontWeight', align: 'textAlign', color: 'color', decoration: 'textDecoration', lineHeight: 'lineHeight' };
    if (names[key]) style[names[key]] = value;
    if (key === 'italic') style.fontStyle = value ? 'italic' : 'normal';
    const lengths = { fontSizePt: ['fontSize','pt'], characterSpacingPt: ['letterSpacing','pt'], spaceBeforePt: ['marginTop','pt'], spaceAfterPt: ['marginBottom','pt'], firstLineIndentMm: ['textIndent','mm'], leftIndentMm: ['paddingLeft','mm'], rightIndentMm: ['paddingRight','mm'] };
    if (lengths[key]) style[lengths[key][0]] = `${value}${lengths[key][1]}`;
  }
  if (Number.isFinite(node.xMm)) style.left = `${node.xMm}mm`;
  if (Number.isFinite(node.yMm)) { style.top = `${node.yMm - pageTopMm}mm`; style.bottom = 'auto'; }
  if (Number.isFinite(node.widthMm)) style.width = `${node.widthMm}mm`;
  if (Number.isFinite(node.heightMm)) style.minHeight = `${node.heightMm}mm`;
  if (Number.isFinite(node.zIndex)) style.zIndex = node.zIndex;
  return { 'data-layout-id': id, 'data-layout-section': sectionId, 'data-layout-type': 'text',
    'data-layout-mode': 'absolute', 'data-layout-locked': Boolean(node.locked),
    'data-layout-editable-content': 'false', style: node.deleted ? { ...style, display: 'none' } : style };
}

/** Page coordinates must be converted to the actual containing block. Word
 * baseline correction can make an index list positioned; nested table cells
 * and generated lists therefore do not necessarily use the paper as origin.
 */
export function measurePresentationOrigins(root) {
  for (const node of root?.querySelectorAll('[data-layout-presentation]') || []) {
    if (getComputedStyle(node).position !== 'absolute') continue;
    const paper = node.closest('.thesis-paper'), parent = node.offsetParent;
    if (!paper || !parent) continue;
    const pageRect = paper.getBoundingClientRect(), parentRect = parent.getBoundingClientRect();
    const scale = pageRect.width / parseFloat(getComputedStyle(paper).width) * 96 / 25.4;
    const border = getComputedStyle(parent);
    const x = (parentRect.left - pageRect.left) / scale + (parseFloat(border.borderLeftWidth) || 0) * 25.4 / 96;
    const y = (parentRect.top - pageRect.top) / scale + (parseFloat(border.borderTopWidth) || 0) * 25.4 / 96;
    node.style.setProperty('--thesis-layout-origin-x', `${x}mm`);
    node.style.setProperty('--thesis-layout-origin-y', `${y}mm`);
  }
}
