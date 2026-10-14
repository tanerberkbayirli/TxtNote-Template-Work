/**
 * Note silhouettes. The hexagon is a long capsule-like hex: three corners on
 * the left, three on the right, so it stays wide rather than stretching into
 * a regular honeycomb cell.
 */

import { NOTE_SHAPE } from "./constants.js";

export const pointsAttr = (points) =>
  points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

export const hexWing = (width, height, pad = 1.5) => {
  const innerW = Math.max(8, width - pad * 2);
  const innerH = Math.max(8, height - pad * 2);
  return Math.min(innerH / 2, innerW * 0.26);
};

/** Long hexagon: left point + two flanks, right point + two flanks. */
export const elongatedHexagon = (width, height, pad = 1.5) => {
  const wing = hexWing(width, height, pad);
  const left = pad;
  const right = width - pad;
  const top = pad;
  const bottom = height - pad;
  const midY = height / 2;

  return [
    [left + wing, top],
    [right - wing, top],
    [right, midY],
    [right - wing, bottom],
    [left + wing, bottom],
    [left, midY],
  ];
};

const KNOWN_SHAPES = new Set(Object.values(NOTE_SHAPE));

export const resolveNoteShape = (shape) => (KNOWN_SHAPES.has(shape) ? shape : NOTE_SHAPE.RECTANGLE);

/** Flowchart input/output: leans right, slant capped so it stays a parallelogram. */
export const parallelogramSkew = (width, height, pad = 1.5) =>
  Math.min((width - pad * 2) * 0.2, (height - pad * 2) * 0.4);

export const parallelogram = (width, height, pad = 1.5) => {
  const skew = parallelogramSkew(width, height, pad);
  const left = pad;
  const right = width - pad;
  const top = pad;
  const bottom = height - pad;
  return [
    [left + skew, top],
    [right, top],
    [right - skew, bottom],
    [left, bottom],
  ];
};

/** Flowchart decision. */
export const diamond = (width, height, pad = 1.5) => [
  [width / 2, pad],
  [width - pad, height / 2],
  [width / 2, height - pad],
  [pad, height / 2],
];

/** Wave depth of the document symbol's bottom edge. */
export const documentWave = (height) => Math.min(height * 0.12, 14);

/** Flowchart document: flat top, wavy bottom. Returns an SVG path. */
export const documentPath = (width, height, pad = 1.5) => {
  const left = pad;
  const right = width - pad;
  const top = pad;
  const amp = documentWave(height);
  const base = height - pad - amp;
  const span = right - left;
  const mid = (left + right) / 2;
  const f = (n) => n.toFixed(2);
  return (
    `M${f(left)},${f(top)} H${f(right)} V${f(base)} ` +
    `Q${f(right - span / 4)},${f(base + amp * 2)} ${f(mid)},${f(base)} ` +
    `Q${f(left + span / 4)},${f(base - amp * 2)} ${f(left)},${f(base)} Z`
  );
};

export const shapePoints = (shape, width, height, pad = 1.5) => {
  switch (resolveNoteShape(shape)) {
    case NOTE_SHAPE.HEXAGON:
      return elongatedHexagon(width, height, pad);
    case NOTE_SHAPE.PARALLELOGRAM:
      return parallelogram(width, height, pad);
    case NOTE_SHAPE.DIAMOND:
      return diamond(width, height, pad);
    case NOTE_SHAPE.DOCUMENT: {
      const bottom = height - pad - documentWave(height) * 0.5;
      return [
        [pad, pad],
        [width - pad, pad],
        [width - pad, bottom],
        [pad, bottom],
      ];
    }
    default:
      return null;
  }
};

export const isPolygonalNote = (shape) => shapePoints(shape, 100, 100) !== null;

/** Shapes whose text area is narrow and need a wider-than-tall box. */
export const minAspect = (shape) => {
  const resolved = resolveNoteShape(shape);
  if (resolved === NOTE_SHAPE.HEXAGON) return 1.45;
  if (resolved === NOTE_SHAPE.DIAMOND) return 1.6;
  if (resolved === NOTE_SHAPE.PARALLELOGRAM) return 1.5;
  return 0;
};

/** Padding so text sits inside the silhouette, not in the pointed corners. */
export const contentInset = (shape, width = 176, height = 128) => {
  const resolved = resolveNoteShape(shape);
  if (resolved === NOTE_SHAPE.HEXAGON) {
    const side = Math.ceil(hexWing(width, height) + 12);
    return { top: 10, right: side, bottom: 12, left: side };
  }
  if (resolved === NOTE_SHAPE.PARALLELOGRAM) {
    const side = Math.ceil(parallelogramSkew(width, height) + 10);
    return { top: 8, right: side, bottom: 8, left: side };
  }
  if (resolved === NOTE_SHAPE.DIAMOND) {
    return {
      top: Math.round(height * 0.24),
      right: Math.round(width * 0.24),
      bottom: Math.round(height * 0.24),
      left: Math.round(width * 0.24),
    };
  }
  if (resolved === NOTE_SHAPE.DOCUMENT) {
    return { top: 8, right: 10, bottom: Math.ceil(documentWave(height) * 2 + 4), left: 10 };
  }
  if (resolved === NOTE_SHAPE.OVAL) {
    return {
      top: Math.max(16, Math.round(height * 0.18)),
      right: Math.max(18, Math.round(width * 0.16)),
      bottom: Math.max(16, Math.round(height * 0.18)),
      left: Math.max(18, Math.round(width * 0.16)),
    };
  }
  return { top: 6, right: 8, bottom: 8, left: 8 };
};

/** Clip the writing surface to the same outline as the drawn symbol. */
export const contentClip = (shape, width, height) => {
  const resolved = resolveNoteShape(shape);
  if (resolved === NOTE_SHAPE.HEXAGON) {
    return `polygon(${pointsAttr(elongatedHexagon(width, height, 2.5))})`;
  }
  if (resolved === NOTE_SHAPE.PARALLELOGRAM || resolved === NOTE_SHAPE.DIAMOND) {
    return `polygon(${pointsAttr(shapePoints(resolved, width, height, 2.5))})`;
  }
  if (resolved === NOTE_SHAPE.DOCUMENT) {
    return `inset(2px 2px ${Math.ceil(documentWave(height) * 1.5)}px 2px)`;
  }
  if (resolved === NOTE_SHAPE.OVAL) {
    return "ellipse(47% 46% at 50% 50%)";
  }
  return "inset(2px round 14px)";
};

/**
 * Ray from the centre through `target` to the first polygon edge.
 * `points` are local to the node box; result is world-space.
 */
export const polygonBoundary = (node, target, points) => {
  const origin = [target.x - node.x, target.y - node.y];
  const cx = (node.width ?? 0) / 2;
  const cy = (node.height ?? 0) / 2;
  const dx = origin[0] - cx;
  const dy = origin[1] - cy;
  if (dx === 0 && dy === 0) return { x: node.x + cx, y: node.y + cy };

  let best = null;
  let bestT = Infinity;

  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 0.0001) continue;
    const t = ((a[0] - cx) * ey - (a[1] - cy) * ex) / denom;
    const u = ((a[0] - cx) * dy - (a[1] - cy) * dx) / denom;
    if (t > 0 && u >= 0 && u <= 1 && t < bestT) {
      bestT = t;
      best = { x: node.x + cx + dx * t, y: node.y + cy + dy * t };
    }
  }

  return best ?? { x: node.x + cx, y: node.y + cy };
};
