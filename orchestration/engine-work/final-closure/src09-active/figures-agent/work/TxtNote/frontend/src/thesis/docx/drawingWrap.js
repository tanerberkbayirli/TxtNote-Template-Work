import { layoutImportedDrawingAnchors, drawingPageIndex } from './drawingAnchors.js';
import { pageMetrics, flowPagePitchPx } from '../pageLayout.js';
import { blocksTextBeside } from './shapes.js';
const applied = new WeakMap();
function geometryKey(root) {
  return [...root.querySelectorAll('.thesis-page-flow [data-native-object="drawing"]')].filter(el => !el.closest('[hidden],table') && getComputedStyle(el).position === 'absolute').map(el => {
    const p = el.closest('p'), article = el.closest('.thesis-paper');
    if (!p || !article) return '';
    const r = el.getBoundingClientRect(), b = p.getBoundingClientRect(), a = article.getBoundingClientRect();
    return [el.dataset.txtNodeId,b.top-a.top,b.left-a.left,b.width,b.height,r.left-b.left,r.top-b.top,r.width,r.height,getComputedStyle(p).lineHeight].map(v => typeof v === 'number' ? v.toFixed(3) : v).join(':');
  }).join(';');
}

/** Earliest line band with a usable text corridor. A line must fit over its
 * entire height: rectangles intersecting different parts of it all exclude
 * their horizontal intervals. Coordinates use the caller's units. */
export function firstShapeLineY(rectangles, width, lineHeight, minimumRoom) {
  if (!(width > 0 && lineHeight > 0 && minimumRoom > 0)) return 0;
  const rects = rectangles.filter(r => r.right > r.left && r.bottom > r.top && r.right > 0 && r.left < width);
  let y = 0;
  for (let n = 0; n <= rects.length; n++) {
    const active = rects.filter(r => r.bottom > y + .01 && r.top < y + lineHeight - .01).sort((a,b) => a.left-b.left);
    let edge = 0, room = 0;
    for (const r of active) { room = Math.max(room, Math.max(0,r.left)-edge); edge = Math.max(edge, Math.min(width,r.right)); }
    room = Math.max(room,width-edge);
    if (!active.length || room >= Math.min(width,minimumRoom)) return y;
    y = Math.min(...active.map(r => r.bottom));
  }
  return y;
}

export function anchorOverflowsPage(anchorY, extentBelowAnchor, pageTop, pageBottom) {
  const height = pageBottom-pageTop;
  return extentBelowAnchor > 0 && extentBelowAnchor <= height && anchorY > pageTop+.5 && anchorY+extentBelowAnchor > pageBottom+.5;
}

/** Word keeps a drawing's paragraph anchor at the paragraph top even when its
 * lines wrap below the drawing. Reserve those displaced lines INSIDE the
 * paragraph; moving its margin would incorrectly move the drawing with it.
 * Rules are presentation-only. Partial-width text wrapping needs individual
 * line fragments; this pass handles empty marks and fully blocked text lines. */
export function layoutImportedShapeLines(root, groups, nativeDocument) {
  if (!root) return '';
  let sheet = root.querySelector('style[data-thesis-shape-lines]');
  if (nativeDocument?.source?.format !== 'docx') { sheet?.remove(); applied.delete(root); return ''; }
  const last = applied.get(root);
  // Re-reading an unchanged flow must not transiently remove its clearance:
  // the incremental footnote/index allocator also observes these geometries.
  if (sheet && last?.document === nativeDocument && last.key === geometryKey(root)) return last.css;
  if (sheet) sheet.textContent = '';
  layoutImportedDrawingAnchors(root,groups,nativeDocument);
  const shapes = new Map();
  const walk = nodes => { for (const n of nodes || []) { if (n.attributes && Object.hasOwn(n.attributes,'hidden')) continue; if (n.type === 'drawing' && n.properties?.shape) shapes.set(n.id,n.properties.shape); walk(n.children); } };
  nativeDocument.sections.forEach(s => walk(s.nodes));
  const rules = [];
  for (const body of root.querySelectorAll('.thesis-page-flow .thesis-body')) {
    const scale = body.offsetWidth ? body.getBoundingClientRect().width/body.offsetWidth : 1;
    if (!(scale > 0)) continue;
    const article = body.closest('.thesis-paper'), group = groups.find(g => g.id === article?.dataset.thesisSection);
    const metrics = group && pageMetrics(group.rules.page), pitch = metrics && flowPagePitchPx(metrics);
    let preceding = [];
    for (const p of body.querySelectorAll('p')) {
      if (p.closest('table,[data-native-object="drawing"],[hidden]')) continue;
      const drawings = [...p.querySelectorAll('[data-native-object="drawing"]')].filter(el => !el.closest('[hidden]') && shapes.has(el.dataset.txtNodeId));
      const clone = p.cloneNode(true);
      clone.querySelectorAll('[data-native-object="drawing"],[hidden]').forEach(n => n.remove());
      const emptyMark = !clone.textContent.trim() && !clone.textContent.includes('\t') && !clone.querySelector('img,math,br,[data-native-object],[data-docx-tab]');
      if (emptyMark && metrics && pitch) {
        const a = article.getBoundingClientRect(), box = p.getBoundingClientRect(), y = (box.top-a.top)/scale;
        const pageIndex = drawingPageIndex(y,pitch);
        const top = pageIndex*pitch+metrics.topMarginPx, bottom = top+metrics.contentHeightPx-metrics.trailingLeadingPx;
        const overflows = drawings.some(el => {
          const s = shapes.get(el.dataset.txtNodeId), v = s.vertical || {};
          return s.kind === 'anchor' && (s.graphic === 'picture' || !s.hasText || blocksTextBeside(s,box.width/scale*.75)) && !s.behind && ['paragraph','line','text',''].includes(v.relativeFrom || '') && !v.align && getComputedStyle(el).position === 'absolute'
            && anchorOverflowsPage(y,(el.getBoundingClientRect().bottom-box.top)/scale,top,bottom);
        });
        if (overflows && /^[\w:-]+$/.test(p.dataset.txtNodeId || '')) {
          rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${p.dataset.txtNodeId}"][data-txt-node-id]{break-before:column!important;margin-top:0!important}`);
          if (!sheet) { sheet = root.ownerDocument.createElement('style'); sheet.setAttribute('data-thesis-shape-lines',''); root.append(sheet); }
          sheet.textContent = rules.join('\n');
        }
      }
      const own = drawings.filter(el => {
        const s = shapes.get(el.dataset.txtNodeId);
        return s?.kind === 'anchor' && ['square','tight','through'].includes(s.wrap) && !el.closest('[hidden]') && getComputedStyle(el).position === 'absolute';
      });
      if (!own.length && !preceding.length) continue;
      const box = p.getBoundingClientRect();
      const frames = [];
      preceding = [...preceding,...own].filter(el => {
        const s = shapes.get(el.dataset.txtNodeId), r = el.getBoundingClientRect(), d = (s.distPt || [0,0,0,0]).map(n => n*4/3);
        if (r.bottom+d[2]*scale <= box.top || !(r.width > 0)) return false;
        frames.push({left:(r.left-box.left)/scale-d[3],right:(r.right-box.left)/scale+d[1],top:(r.top-box.top)/scale-d[0],bottom:(r.bottom-box.top)/scale+d[2]});
        return true;
      });
      if (!frames.length) continue;
      // Text can also be displaced as a whole when a full band excludes it.
      // Partial-width wrapping needs individual line fragments instead.
      if (!emptyMark && !frames.some(r => r.left <= 0 && r.right >= box.width/scale && r.bottom > 0 && r.top < parseFloat(getComputedStyle(p).lineHeight))) continue;
      const style = getComputedStyle(p), line = parseFloat(style.lineHeight);
      // Same 24 pt usable corridor as the imported full-width shape test.
      const clearance = firstShapeLineY(frames,box.width/scale,line,32);
      if (clearance > .5 && /^[\w:-]+$/.test(p.dataset.txtNodeId || '')) {
        rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${p.dataset.txtNodeId}"][data-txt-node-id]{padding-top:${((parseFloat(style.paddingTop)||0)+clearance).toFixed(3)}px!important}`);
        if (!sheet) { sheet = root.ownerDocument.createElement('style'); sheet.setAttribute('data-thesis-shape-lines',''); root.append(sheet); }
        // Later paragraphs and their anchors must be measured after this line
        // has found its corridor, rather than all against the unwrapped flow.
        sheet.textContent = rules.join('\n');
      }
    }
  }
  const css = rules.join('\n');
  applied.set(root,{document:nativeDocument,key:geometryKey(root),css});
  return css;
}
