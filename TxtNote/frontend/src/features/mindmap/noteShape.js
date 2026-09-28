/**
 * Note silhouettes. The hexagon is a long capsule-like hex: three corners on
 * the left, three on the right, so it stays wide rather than stretching into
 * a regular honeycomb cell.
 */

import { NOTE_SHAPE } from "./constants";

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

export const resolveNoteShape = (shape) => {
  if (shape === NOTE_SHAPE.HEXAGON || shape === NOTE_SHAPE.OVAL) return shape;
  return NOTE_SHAPE.RECTANGLE;
};

export const shapePoints = (shape, width, height, pad = 1.5) => {
  if (resolveNoteShape(shape) === NOTE_SHAPE.HEXAGON) {
    return elongatedHexagon(width, height, pad);
  }
  return null;
};

export const isPolygonalNote = (shape) => resolveNoteShape(shape) === NOTE_SHAPE.HEXAGON;

/** Padding so text sits inside the silhouette, not in the pointed corners. */
export const contentInset = (shape, width = 176, height = 128) => {
  const resolved = resolveNoteShape(shape);
  if (resolved === NOTE_SHAPE.HEXAGON) {
    const side = Math.ceil(hexWing(width, height) + 12);
    return { top: 10, right: side, bottom: 12, left: side };
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
