/** Pure page-layout geometry. All coordinates and dimensions are millimetres. */

const EPSILON = 1e-7;

function copyRect(rect, updates = {}) {
  return { ...rect, ...updates };
}

function rectRight(rect) { return rect.xMm + rect.widthMm; }
function rectBottom(rect) { return rect.yMm + rect.heightMm; }
function rectCenterX(rect) { return rect.xMm + rect.widthMm / 2; }
function rectCenterY(rect) { return rect.yMm + rect.heightMm / 2; }

function pageFeatures(page, axis) {
  if (!page) return [];
  if (axis === 'x') {
    const left = page.margins?.leftMm ?? 0;
    const right = page.widthMm - (page.margins?.rightMm ?? 0);
    return [
      { value: 0, kind: 'edge' },
      { value: page.widthMm, kind: 'edge' },
      { value: page.widthMm / 2, kind: 'center' },
      { value: left, kind: 'edge' },
      { value: right, kind: 'edge' },
    ];
  }
  const top = page.margins?.topMm ?? 0;
  const bottom = page.heightMm - (page.margins?.bottomMm ?? 0);
  return [
    { value: 0, kind: 'edge' },
    { value: page.heightMm, kind: 'edge' },
    { value: page.heightMm / 2, kind: 'center' },
    { value: top, kind: 'edge' },
    { value: bottom, kind: 'edge' },
  ];
}

function objectFeatures(rect, axis) {
  return axis === 'x'
    ? [
        { value: rect.xMm, kind: 'edge' },
        { value: rectRight(rect), kind: 'edge' },
        { value: rectCenterX(rect), kind: 'center' },
      ]
    : [
        { value: rect.yMm, kind: 'edge' },
        { value: rectBottom(rect), kind: 'edge' },
        { value: rectCenterY(rect), kind: 'center' },
      ];
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return Math.min(aEnd, bEnd) - Math.max(aStart, bStart) > EPSILON;
}

function axisCandidates(rect, others, page, guides, axis) {
  const own = objectFeatures(rect, axis);
  const candidates = [];
  for (const target of pageFeatures(page, axis)) {
    for (const feature of own) {
      candidates.push({ delta: target.value - feature.value, positionMm: target.value, kind: target.kind, priority: 0 });
    }
  }
  for (const other of others) {
    for (const target of objectFeatures(other, axis)) {
      for (const feature of own) {
        candidates.push({ delta: target.value - feature.value, positionMm: target.value, kind: target.kind, priority: 1 });
      }
    }
  }
  for (const guide of guides) {
    if (guide.axis !== axis) continue;
    for (const feature of own) {
      candidates.push({ delta: guide.positionMm - feature.value, positionMm: guide.positionMm, kind: feature.kind, priority: 0 });
    }
  }

  // When there is room between two aligned neighbours, offer the position that
  // leaves equal clearances on both sides. This is deliberately one candidate
  // per bounding pair, avoiding a dense collection of speculative gap snaps.
  for (const first of others) {
    for (const second of others) {
      if (first === second) continue;
      let start, end, size, crossOverlap;
      if (axis === 'x') {
        if (first.xMm >= second.xMm) continue;
        start = rectRight(first); end = second.xMm; size = rect.widthMm;
        crossOverlap = rangesOverlap(rect.yMm, rectBottom(rect), first.yMm, rectBottom(first)) &&
          rangesOverlap(rect.yMm, rectBottom(rect), second.yMm, rectBottom(second));
      } else {
        if (first.yMm >= second.yMm) continue;
        start = rectBottom(first); end = second.yMm; size = rect.heightMm;
        crossOverlap = rangesOverlap(rect.xMm, rectRight(rect), first.xMm, rectRight(first)) &&
          rangesOverlap(rect.xMm, rectRight(rect), second.xMm, rectRight(second));
      }
      const gap = end - start - size;
      if (crossOverlap && gap >= -EPSILON) {
        const value = start + gap / 2;
        const origin = axis === 'x' ? rect.xMm : rect.yMm;
        candidates.push({ delta: value - origin, positionMm: value, kind: 'gap', gapMm: gap / 2, fromMm: start, toMm: end, priority: 2 });
      }
      const sharedGap = axis === 'x' ? second.xMm - rectRight(first) : second.yMm - rectBottom(first);
      if (crossOverlap && sharedGap > EPSILON) {
        const beforePosition = axis === 'x' ? first.xMm - sharedGap - rect.widthMm : first.yMm - sharedGap - rect.heightMm;
        const afterPosition = axis === 'x' ? rectRight(second) + sharedGap : rectBottom(second) + sharedGap;
        const origin = axis === 'x' ? rect.xMm : rect.yMm;
        candidates.push({ delta: beforePosition - origin, positionMm: beforePosition, kind: 'gap', gapMm: sharedGap,
          fromMm: beforePosition + (axis === 'x' ? rect.widthMm : rect.heightMm), toMm: first[axis === 'x' ? 'xMm' : 'yMm'], priority: 2 });
        candidates.push({ delta: afterPosition - origin, positionMm: afterPosition, kind: 'gap', gapMm: sharedGap,
          fromMm: axis === 'x' ? rectRight(second) : rectBottom(second), toMm: afterPosition, priority: 2 });
      }
    }
  }
  return candidates;
}

/**
 * Snap a proposed rectangle to page geometry, other objects, and user guides.
 * Only the nearest candidate on each axis within thresholdMm is applied.
 */
export function snapLayoutRect(rect, others = [], page, guides = [], thresholdMm = 1.25) {
  const peers = others.filter((item) => item.id !== rect.id);
  const result = { ...rect };
  const feedback = [];
  const snappedAxes = {};
  for (const axis of ['x', 'y']) {
    if (rect.locked) continue;
    const candidates = axisCandidates(rect, peers, page, guides, axis)
      .filter((candidate) => Math.abs(candidate.delta) <= thresholdMm + EPSILON)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || a.priority - b.priority);
    const best = candidates[0];
    if (!best) continue;
    if (axis === 'x') result.xMm += best.delta;
    else result.yMm += best.delta;
    snappedAxes[axis] = best.delta;
    feedback.push({ axis, positionMm: best.positionMm, kind: best.kind,
      ...(best.gapMm === undefined ? {} : { gapMm: best.gapMm, fromMm: best.fromMm, toMm: best.toMm }) });
  }
  return { rect: result, guides: feedback, snappedAxes };
}

const ALIGNMENTS = {
  left: ['xMm', 'left'], right: ['xMm', 'right'], top: ['yMm', 'top'], bottom: ['yMm', 'bottom'],
  centerX: ['xMm', 'centerX'], centerY: ['yMm', 'centerY'],
  'center-horizontal': ['xMm', 'centerX'], 'center-vertical': ['yMm', 'centerY'],
  pageLeft: ['xMm', 'pageLeft'], pageRight: ['xMm', 'pageRight'],
  pageTop: ['yMm', 'pageTop'], pageBottom: ['yMm', 'pageBottom'],
  pageCenterX: ['xMm', 'pageCenterX'], pageCenterY: ['yMm', 'pageCenterY'],
};

/** Return aligned copies of elements. Locked objects remain fixed and are excluded as drivers. */
export function alignLayoutElements(elements, alignment, page) {
  const normalized = ALIGNMENTS[alignment] ? alignment : ({ 'horizontal-center': 'centerX', 'vertical-center': 'centerY' }[alignment]);
  const [coordinate, mode] = ALIGNMENTS[normalized] || [];
  if (!coordinate || !elements.length) return elements.map((element) => ({ ...element }));
  const movable = elements.filter((element) => !element.locked);
  if (!movable.length) return elements.map((element) => ({ ...element }));
  const pageMode = mode.startsWith('page') || alignment.startsWith('page');
  const edgeMode = pageMode
    ? ({ pageLeft: 'left', pageRight: 'right', pageTop: 'top', pageBottom: 'bottom', pageCenterX: 'centerX', pageCenterY: 'centerY' }[mode] || mode)
    : mode;
  let target;
  if (pageMode && page) {
    const pageModeName = mode.replace(/^page/, '').toLowerCase();
    if (coordinate === 'xMm') {
      target = pageModeName === 'right' ? page.widthMm - (page.margins?.rightMm ?? 0) :
        pageModeName.includes('center') ? page.widthMm / 2 : page.margins?.leftMm ?? 0;
    } else {
      target = pageModeName === 'bottom' ? page.heightMm - (page.margins?.bottomMm ?? 0) :
        pageModeName.includes('center') ? page.heightMm / 2 : page.margins?.topMm ?? 0;
    }
  } else {
    const positions = movable.map((element) => mode === 'right' ? rectRight(element) : mode === 'bottom' ? rectBottom(element) : mode === 'centerX' ? rectCenterX(element) : mode === 'centerY' ? rectCenterY(element) : element[coordinate]);
    target = mode === 'left' || mode === 'top' ? Math.min(...positions) :
      mode === 'right' || mode === 'bottom' ? Math.max(...positions) : positions.reduce((sum, value) => sum + value, 0) / positions.length;
  }
  return elements.map((element) => {
    if (element.locked) return { ...element };
    const edge = edgeMode === 'right' ? rectRight(element) : edgeMode === 'bottom' ? rectBottom(element) : edgeMode === 'centerX' ? rectCenterX(element) : edgeMode === 'centerY' ? rectCenterY(element) : element[coordinate];
    return copyRect(element, { [coordinate]: element[coordinate] + target - edge });
  });
}

/** Distribute unlocked elements evenly by their outer edges, preserving order and size. */
export function distributeLayoutElements(elements, axis = 'x') {
  const coordinate = axis === 'y' || axis === 'vertical' ? 'yMm' : 'xMm';
  const size = coordinate === 'xMm' ? 'widthMm' : 'heightMm';
  const end = (element) => element[coordinate] + element[size];
  const movable = elements.filter((element) => !element.locked).slice().sort((a, b) => a[coordinate] - b[coordinate]);
  if (movable.length < 3) return elements.map((element) => ({ ...element }));
  const totalGaps = end(movable[movable.length - 1]) - movable[0][coordinate] - movable.reduce((sum, element) => sum + element[size], 0);
  const gap = totalGaps / (movable.length - 1);
  const positions = new Map();
  let cursor = movable[0][coordinate];
  movable.forEach((element, index) => {
    positions.set(element.id, cursor);
    cursor += element[size] + (index < movable.length - 1 ? gap : 0);
  });
  return elements.map((element) => element.locked ? { ...element } : copyRect(element, { [coordinate]: positions.get(element.id) }));
}

export default { snapLayoutRect, alignLayoutElements, distributeLayoutElements };
