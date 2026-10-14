/** Source-independent evidence of the operations actually painted by layoutPdf. */
const round = (n) => Math.round(n * 10000) / 10000;
const SELECTOR = '[data-thesis-block],[data-layout-id],[data-thesis-anchor],[data-thesis-caption],[data-index-target],h1,h2,h3,h4,h5,h6,p,li,caption,figcaption,tr,td,th,.thesis-footnote,.thesis-footnote-area,.thesis-page-number';

export function layoutLandmarkIndex(stack, groupId) {
  const nodes = new WeakMap(), counters = new Map(), ids = new Map();
  for (const element of stack.querySelectorAll(SELECTOR)) {
    if (element.closest('[data-export-ignore],[data-thesis-editor-only]')) continue;
    const sectionId = element.closest('[data-thesis-flow-section]')?.getAttribute('data-thesis-flow-section') || groupId;
    const kind = element.matches('.thesis-page-number') ? 'page-number'
      : element.matches('.thesis-footnote-area') ? 'footnote-area'
        : element.matches('tr') ? 'table-row'
          : element.matches('td,th') ? 'table-cell'
          : element.matches('h1,h2,h3,h4,h5,h6') ? 'heading'
            : element.matches('caption,figcaption,[data-thesis-caption]') ? 'caption'
              : element.matches('[data-index-target]') ? 'index-row'
                : element.matches('.thesis-footnote') ? 'footnote'
              : element.hasAttribute('data-thesis-block') ? 'special-block' : 'paragraph';
    const key = `${sectionId}:${kind}`, ordinal = (counters.get(key) || 0) + 1;
    counters.set(key, ordinal);
    const anchor = element.getAttribute('data-thesis-anchor') || element.getAttribute('data-index-target') || element.getAttribute('data-layout-id') || element.getAttribute('data-thesis-block');
    const base = `${sectionId}:${kind}:${anchor || ordinal}`;
    const occurrence = (ids.get(base) || 0) + 1;
    ids.set(base, occurrence);
    nodes.set(element, { id: occurrence === 1 ? base : `${base}:instance:${occurrence}`, kind, sectionId });
  }
  return {
    forElement(element) {
      for (let node = element; node && node !== stack; node = node.parentElement) {
        if (nodes.has(node)) {
          const ancestors = [];
          for (let parent = node.parentElement; parent && parent !== stack; parent = parent.parentElement) {
            const meta = nodes.get(parent);
            if (meta && ['table-row', 'table-cell', 'special-block', 'footnote-area', 'footnote'].includes(meta.kind)) ancestors.push(meta);
          }
          return { ...nodes.get(node), ancestors };
        }
      }
      return { id: `${groupId}:chrome`, kind: 'chrome', sectionId: groupId };
    },
    boxes(local) {
      return [...stack.querySelectorAll('[data-thesis-block],tr,.thesis-footnote-area')].flatMap((element) => {
        const meta = nodes.get(element);
        if (!meta || getComputedStyle(element).display === 'none' || getComputedStyle(element).visibility === 'hidden') return [];
        return [...element.getClientRects()].filter((rect) => rect.width && rect.height).map((rect) => ({ ...meta, text: element.textContent?.trim().slice(0, 300) || '', ...local(rect) }));
      });
    },
  };
}

/** Keep every visible fragment of a box spanning physical pages, excluding the page gap. */
export function layoutPageBoxes(boxes, pageTop, pageHeight) {
  return boxes.flatMap((box) => {
    const top = Math.max(box.top, pageTop);
    const bottom = Math.min(box.top + box.height, pageTop + pageHeight);
    return bottom > top ? [{ ...box, top, height: bottom - top }] : [];
  });
}

/** Pure conversion: report coordinates share the PDF writer's page origin. Units mm/pt. */
export function layoutPageReport({ ops, boxes = [], pageTop, mmPerPx, page, groupId, label, widthMm, heightMm }) {
  const landmarks = new Map();
  const runCounters = new Map();
  const get = (meta) => {
    if (!landmarks.has(meta.id)) landmarks.set(meta.id, { id: meta.id, kind: meta.kind, sectionId: meta.sectionId, text: meta.text || '', lines: [], fragments: [] });
    return landmarks.get(meta.id);
  };
  const textOps = ops.filter((op) => op.type === 'text').map((op, index) => {
    const baselineMm = round((op.baseline - pageTop) * mmPerPx);
    const landmarkId = op.landmark?.id || groupId + ':text';
    const ordinal = (runCounters.get(landmarkId) || 0) + 1;
    runCounters.set(landmarkId, ordinal);
    const entry = { id: `${landmarkId}:page:${page}:run:${ordinal}`, landmarkId,
      text: op.exportText ?? op.text, spaceAfter: Boolean(op.spaceAfter), xMm: round(op.x * mmPerPx), yMm: round((op.top - pageTop) * mmPerPx),
      widthMm: round(op.width * mmPerPx), heightMm: round((op.baseline - op.top) * mmPerPx), baselineMm,
      fontFamily: String(op.style.fontFamily).split(',')[0].replace(/["']/g, '').trim(),
      exportedFont: op.exportedFont || null, fontSizePt: round(parseFloat(op.style.fontSize) * .75), clipped: Boolean(op.clip && (op.baseline < op.clip.top || op.baseline > op.clip.top + op.clip.height)) };
    const meta = op.landmark || { id: `${groupId}:text`, kind: 'text', sectionId: groupId };
    const mark = get(meta);
    mark.lines.push(entry);
    for (const ancestor of meta.ancestors || []) get(ancestor).lines.push(entry);
    entry.ancestorIds = (meta.ancestors || []).map(ancestor => ancestor.id);
    return entry;
  });
  for (const box of boxes) get(box).fragments.push({ xMm: round(box.left * mmPerPx), yMm: round((box.top - pageTop) * mmPerPx), widthMm: round(box.width * mmPerPx), heightMm: round(box.height * mmPerPx) });
  for (const mark of landmarks.values()) {
    const rects = [...mark.fragments, ...mark.lines];
    mark.xMm = round(Math.min(...rects.map((r) => r.xMm)));
    mark.yMm = round(Math.min(...rects.map((r) => r.yMm)));
    mark.widthMm = round(Math.max(...rects.map((r) => r.xMm + r.widthMm)) - mark.xMm);
    mark.heightMm = round(Math.max(...rects.map((r) => r.yMm + r.heightMm)) - mark.yMm);
    const lines = [...mark.lines].sort((a, b) => a.baselineMm - b.baselineMm || a.xMm - b.xMm);
    if (lines.length) mark.text = lines.map((r) => r.text).join(' ').slice(0, 300);
    const baselines = [...new Set(lines.map((r) => Math.round(r.baselineMm * 100) / 100))];
    mark.firstBaselineMm = baselines[0] ?? null;
    mark.lastBaselineMm = baselines.at(-1) ?? null;
    const pitches = baselines.slice(1).map((v, i) => round(v - baselines[i])).filter((v) => v > .5);
    mark.linePitchMm = pitches.length ? [...pitches].sort((a, b) => a - b)[Math.floor(pitches.length / 2)] : null;
    mark.fontFamily = lines[0]?.fontFamily ?? null;
    mark.exportedFonts = [...new Set(lines.map(line => line.exportedFont).filter(Boolean))];
    mark.fontSizePt = lines[0]?.fontSizePt ?? null;
    mark.lineCount = baselines.length;
    delete mark.lines;
  }
  const body = textOps.filter((op) => landmarks.get(op.landmarkId)?.kind === 'paragraph' && !op.ancestorIds.length);
  return { page, groupId, sectionIds: [...new Set([...landmarks.values()].map(mark => mark.sectionId))], label: label || '', widthMm, heightMm, landmarks: [...landmarks.values()], textOps,
    firstBodyBaselineMm: body.length ? Math.min(...body.map((op) => op.baselineMm)) : null,
    lastBodyBaselineMm: body.length ? Math.max(...body.map((op) => op.baselineMm)) : null };
}
