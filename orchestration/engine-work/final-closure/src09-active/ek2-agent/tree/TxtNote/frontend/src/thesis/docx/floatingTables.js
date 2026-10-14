import { pageMetrics } from '../pageLayout.js';
import { hideMarkTailParagraphIds } from '../tableSemantics.js';

/** Source floating tables are anchored at the following text, rather than an
 * extra body block. Keep short tables measurable/editable as native tables and
 * cancel their flow height; absolute tables cannot fragment in Blink. Long
 * tables retain their existing paginated layout until fragment anchors exist. */
export function floatingTablePosition(xml = '') {
  const tag = /<w:tblpPr\b([^>]*)\/?\s*>/.exec(xml)?.[1];
  if (!tag) return null;
  const attr = name => new RegExp(`w:${name}="([^"]*)"`).exec(tag)?.[1];
  if ((attr('vertAnchor') || 'text') !== 'text' || attr('tblpYSpec')) return null;
  const y = Number(attr('tblpY') || 0), x = Number(attr('tblpX') || 0);
  if (!Number.isFinite(y) || !Number.isFinite(x)) return null;
  return { topPt:y/20, leftPt:x/20, horizontal:attr('horzAnchor') || 'margin', align:attr('tblpXSpec') || '' };
}

export function layoutImportedFloatingTables(root, groups, nativeDocument) {
  if (!root) return '';
  let sheet = root.querySelector('style[data-thesis-floating-tables]');
  if (nativeDocument?.source?.format !== 'docx') { sheet?.remove(); return ''; }
  const positions = new Map();
  const walk = nodes => { for (const n of nodes || []) {
    if (n.attributes && Object.hasOwn(n.attributes,'hidden')) continue;
    if (n.type === 'table') {
      const p = floatingTablePosition(n.properties?.tablePropertiesXml);
      if (p) positions.set(n.id,p);
    }
    walk(n.children);
  } };
  nativeDocument.sections.forEach(s=>walk(s.nodes));
  const rules=[];
  for (const t of root.querySelectorAll('.thesis-page-flow table[data-txt-node-id]')) {
    const id=t.dataset.txtNodeId, position=positions.get(id);
    if (!position || !/^[\w:-]+$/.test(id) || t.parentElement.closest('table,[data-native-object="drawing"],[hidden]') || [...t.rows].some(r=>[...r.cells].some(c=>c.rowSpan>1))) continue;
    const article=t.closest('.thesis-paper'), group=groups.find(g=>g.id===article?.dataset.thesisSection);
    if (!group || !['margin','text'].includes(position.horizontal)) continue;
    const scale=article.getBoundingClientRect().width/article.offsetWidth;
    const h=t.getBoundingClientRect().height/scale;
    // A fragmented table's bounding height includes page gaps. Do not replace
    // that existing continuation layout with an unfragmentable absolute box.
    if (!(h>0 && h+Math.max(0,position.topPt*4/3)<=pageMetrics(group.rules.page).contentHeightPx)) continue;
    const horizontal=position.align==='center'?'margin-left:auto!important;margin-right:auto!important':position.align==='right'?'margin-left:auto!important;margin-right:0!important':!position.align?`left:${position.leftPt}pt!important`:'';
    if (position.align && !['center','right','left'].includes(position.align)) continue;
    rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]{position:relative;top:${position.topPt}pt!important;margin-bottom:-${h.toFixed(3)}px!important;${horizontal}}`);
  }
  for (const id of hideMarkTailParagraphIds(nativeDocument)) rules.push(`.thesis-paper .thesis-body p[data-txt-node-id="${id}"][data-txt-node-id]{display:none!important}`);
  const css=rules.join('\n');
  if (!sheet && css) { sheet=root.ownerDocument.createElement('style');sheet.setAttribute('data-thesis-floating-tables','');root.append(sheet); }
  if (sheet && sheet.textContent!==css) sheet.textContent=css;
  return css;
}
