/**
 * Shared geometry for mindmap nodes and the arrows that thread between them.
 */

import { NODE_KIND, NODE_SIZE, NOTE_SHAPE } from "./constants";
import { isPolygonalNote, polygonBoundary, shapePoints } from "./noteShape";

export const sizeOf = (node) => {
  const fallback = NODE_SIZE[node.kind] ?? { width: 0, height: 0 };
  return {
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  };
};

export const centerOf = (node) => {
  const size = sizeOf(node);
  return { x: node.x + size.width / 2, y: node.y + size.height / 2 };
};

/** Axis-aligned box from two world-space corners. */
export const rectFromPoints = (a, b) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
});

export const nodeIntersectsRect = (node, rect) => {
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  const size = sizeOf(node);
  return (
    node.x < rect.x + rect.width &&
    node.x + size.width > rect.x &&
    node.y < rect.y + rect.height &&
    node.y + size.height > rect.y
  );
};

/** Walks a node's centre out to its own border, facing `target`. */
export const boundaryPoint = (node, target) => {
  const center = centerOf(node);
  const size = sizeOf(node);
  const dx = target.x - center.x;
  const dy = target.y - center.y;

  if (node.kind === NODE_KIND.DOT || node.kind === NODE_KIND.PIN) {
    const distance = Math.hypot(dx, dy) || 1;
    const radius = size.width / 2 + (node.kind === NODE_KIND.PIN ? 1 : 3);
    return { x: center.x + (dx / distance) * radius, y: center.y + (dy / distance) * radius };
  }

  if (node.kind === NODE_KIND.NOTE && (node.shape ?? NOTE_SHAPE.RECTANGLE) === NOTE_SHAPE.OVAL) {
    const rx = size.width / 2 || 1;
    const ry = size.height / 2 || 1;
    const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
    return { x: center.x + dx * t, y: center.y + dy * t };
  }

  if (node.kind === NODE_KIND.NOTE && isPolygonalNote(node.shape)) {
    const points = shapePoints(node.shape, size.width, size.height);
    if (points) return polygonBoundary({ ...node, ...size }, target, points);
  }

  const scale = Math.min(
    Math.abs(size.width / 2 / (dx || 0.0001)),
    Math.abs(size.height / 2 / (dy || 0.0001)),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
};

const distToSegment = (point, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  if (length === 0) return Math.hypot(point.x - a.x, point.y - a.y);

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
};

const cubicPoint = (p0, c1, c2, p1, t) => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};

const sCurveControls = (start, end) => {
  const dx = end.x - start.x;
  const reach = Math.min(90, Math.max(24, Math.abs(dx) * 0.4)) * Math.sign(dx || 1);
  return {
    c1: { x: start.x + reach, y: start.y },
    c2: { x: end.x - reach, y: end.y },
  };
};

/** Dense polyline that follows the same curves the SVG draws. */
export const sampleRoute = (points) => {
  if (points.length < 2) return points;

  const samples = [];
  const pushCubic = (p0, c1, c2, p1, skipFirst) => {
    for (let step = skipFirst ? 1 : 0; step <= 8; step += 1) {
      samples.push(cubicPoint(p0, c1, c2, p1, step / 8));
    }
  };

  if (points.length === 2) {
    const { c1, c2 } = sCurveControls(points[0], points[1]);
    pushCubic(points[0], c1, c2, points[1], false);
    return samples;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    pushCubic(p1, c1, c2, p2, index > 0);
  }
  return samples;
};

/**
 * Nearest arrow to a world-space point. `ignoreEdgeIds` lets a pin look past
 * the rope it is already sitting on, so it can jump to another one.
 */
export const closestEdgeMatch = (point, edges, nodes, { maxDist, ignoreEdgeIds, onlyEdgeIds, ignorePinId } = {}) => {
  const ignore = new Set(ignoreEdgeIds ?? []);
  const only = onlyEdgeIds ? new Set(onlyEdgeIds) : null;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  let bestId = null;
  let bestDist = maxDist ?? Infinity;

  for (const edge of edges) {
    if (ignore.has(edge.id)) continue;
    if (only && !only.has(edge.id)) continue;
    const source = nodeMap.get(edge.sourceId);
    const target = nodeMap.get(edge.targetId);
    if (!source || !target) continue;

    const waypointNodes = (edge.waypointIds ?? [])
      .filter((id) => id !== ignorePinId)
      .map((id) => nodeMap.get(id))
      .filter(Boolean);
    const samples = sampleRoute(routePoints(source, target, waypointNodes));
    for (let index = 0; index < samples.length - 1; index += 1) {
      const distance = distToSegment(point, samples[index], samples[index + 1]);
      if (distance < bestDist) {
        bestDist = distance;
        bestId = edge.id;
      }
    }
  }

  return bestId ? { id: bestId, dist: bestDist } : null;
};

export const closestEdgeId = (point, edges, nodes, options) =>
  closestEdgeMatch(point, edges, nodes, options)?.id ?? null;

export const edgesHoldingPin = (edges, pinId) =>
  edges.filter((edge) => (edge.waypointIds ?? []).includes(pinId)).map((edge) => edge.id);

/** Ordered dots an arrow should pass through, including the node borders. */
export const routePoints = (source, target, waypointNodes) => {
  if (!waypointNodes.length) {
    return [boundaryPoint(source, centerOf(target)), boundaryPoint(target, centerOf(source))];
  }

  const first = centerOf(waypointNodes[0]);
  const last = centerOf(waypointNodes[waypointNodes.length - 1]);
  return [
    boundaryPoint(source, first),
    ...waypointNodes.map(centerOf),
    boundaryPoint(target, last),
  ];
};

/**
 * Where a new pin belongs on an existing route: the closest segment, so
 * wrapping around a card inserts between the two ends it sits nearest to.
 */
export const insertIndexAlongPath = (points, position) => {
  if (points.length < 2) return 0;

  let best = 0;
  let bestDist = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    const distance = distToSegment(position, points[index], points[index + 1]);
    if (distance < bestDist) {
      bestDist = distance;
      best = index;
    }
  }
  return best;
};

const sCurve = (start, end) => {
  const { c1, c2 } = sCurveControls(start, end);
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
};

/**
 * Two points keep the original horizontal S-curve. Extra pins become a
 * Catmull-Rom spline so the arrow actually travels through each sphere.
 */
export const pathThrough = (points) => {
  if (points.length < 2) return "";
  if (points.length === 2) return sCurve(points[0], points[1]);

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export const midpointOf = (points) => {
  if (points.length === 0) return { x: 0, y: 0 };
  const middle = points[Math.floor(points.length / 2)];
  if (points.length === 2) {
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }
  return middle;
};
