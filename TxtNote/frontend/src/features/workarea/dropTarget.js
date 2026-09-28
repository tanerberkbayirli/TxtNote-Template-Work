/**
 * Decide which node a drop should split. Outer strips of a group or of the
 * whole work area wrap that larger region; the inner edge of a pane splits
 * only that pane. This is what lets two side-by-side notes take a full-width
 * neighbour underneath.
 */

export const GUTTER_PX = 4;
export const PANE_EDGE_BAND = 0.38;

const outerBandPx = (size) => Math.max(36, Math.min(size * 0.22, 120));

export const hitEdgeFromRect = (point, rect, band = PANE_EDGE_BAND) => {
  if (!rect || rect.width < 8 || rect.height < 8) return "center";
  const x = (point.x - rect.x) / rect.width;
  const y = (point.y - rect.y) / rect.height;
  const left = x;
  const right = 1 - x;
  const top = y;
  const bottom = 1 - y;
  const nearest = Math.min(left, right, top, bottom);
  if (nearest > band) return "center";
  if (nearest === left) return "left";
  if (nearest === right) return "right";
  if (nearest === top) return "top";
  return "bottom";
};

export const halfRect = (rect, edge) => {
  if (!rect) return rect;
  if (edge === "left") return { ...rect, width: rect.width / 2 };
  if (edge === "right") return { ...rect, x: rect.x + rect.width / 2, width: rect.width / 2 };
  if (edge === "top") return { ...rect, height: rect.height / 2 };
  if (edge === "bottom") return { ...rect, y: rect.y + rect.height / 2, height: rect.height / 2 };
  return { ...rect };
};

const edgeDistance = (point, rect, edge) => {
  if (edge === "left") return point.x - rect.x;
  if (edge === "right") return rect.x + rect.width - point.x;
  if (edge === "top") return point.y - rect.y;
  return rect.y + rect.height - point.y;
};

const pathToNode = (tree, nodeId, acc = []) => {
  if (!tree) return null;
  const next = [...acc, tree];
  if (tree.id === nodeId) return next;
  if (tree.kind === "leaf") return null;
  return pathToNode(tree.a, nodeId, next) ?? pathToNode(tree.b, nodeId, next);
};

const sharesParentEdge = (parent, childSide, edge) => {
  if (!parent || parent.kind === "leaf") return false;
  if (edge === "left") return parent.axis === "y" || childSide === "a";
  if (edge === "right") return parent.axis === "y" || childSide === "b";
  if (edge === "top") return parent.axis === "x" || childSide === "a";
  return parent.axis === "x" || childSide === "b";
};

/** Leaf first, then parents, then the highest group that still owns this edge. */
export const ancestorsSharingEdge = (tree, leafId, edge) => {
  const path = pathToNode(tree, leafId);
  if (!path?.length) return [];
  const shared = [path[path.length - 1]];
  for (let i = path.length - 1; i > 0; i -= 1) {
    const child = path[i];
    const parent = path[i - 1];
    const side = parent.a.id === child.id ? "a" : "b";
    if (!sharesParentEdge(parent, side, edge)) break;
    shared.push(parent);
  }
  return shared;
};

export const nodeBounds = (tree, nodeId, workRect, gutter = GUTTER_PX) => {
  if (!tree || !workRect) return null;
  if (tree.id === nodeId) return { x: workRect.x, y: workRect.y, width: workRect.width, height: workRect.height };
  if (tree.kind === "leaf") return null;
  const ratio = tree.ratio ?? 0.5;
  if (tree.axis === "x") {
    const inner = Math.max(0, workRect.width - gutter);
    const aW = inner * ratio;
    const aRect = { x: workRect.x, y: workRect.y, width: aW, height: workRect.height };
    const bRect = {
      x: workRect.x + aW + gutter,
      y: workRect.y,
      width: inner - aW,
      height: workRect.height,
    };
    return nodeBounds(tree.a, nodeId, aRect, gutter) ?? nodeBounds(tree.b, nodeId, bRect, gutter);
  }
  const inner = Math.max(0, workRect.height - gutter);
  const aH = inner * ratio;
  const aRect = { x: workRect.x, y: workRect.y, width: workRect.width, height: aH };
  const bRect = {
    x: workRect.x,
    y: workRect.y + aH + gutter,
    width: workRect.width,
    height: inner - aH,
  };
  return nodeBounds(tree.a, nodeId, aRect, gutter) ?? nodeBounds(tree.b, nodeId, bRect, gutter);
};

const scopeFor = (tree, leafId, nodeId) => {
  if (nodeId === leafId) return "pane";
  if (nodeId === tree.id) return "area";
  return "group";
};

export const resolveDropTarget = (tree, leafId, point, workRect, gutter = GUTTER_PX) => {
  const leafRect = nodeBounds(tree, leafId, workRect, gutter);
  if (!tree || !leafRect) {
    return { nodeId: leafId, edge: "center", scope: "pane", preview: leafRect };
  }

  const edge = hitEdgeFromRect(point, leafRect);
  if (edge === "center") {
    return { nodeId: leafId, edge: "center", scope: "pane", preview: leafRect };
  }

  const chain = ancestorsSharingEdge(tree, leafId, edge);
  for (let i = chain.length - 1; i >= 1; i -= 1) {
    const ancestor = chain[i];
    const rect = nodeBounds(tree, ancestor.id, workRect, gutter);
    if (!rect) continue;
    const size = edge === "left" || edge === "right" ? rect.width : rect.height;
    if (edgeDistance(point, rect, edge) <= outerBandPx(size)) {
      return {
        nodeId: ancestor.id,
        edge,
        scope: scopeFor(tree, leafId, ancestor.id),
        preview: halfRect(rect, edge),
      };
    }
  }

  return {
    nodeId: leafId,
    edge,
    scope: "pane",
    preview: halfRect(leafRect, edge),
  };
};
