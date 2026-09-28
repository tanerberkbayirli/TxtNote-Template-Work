/**
 * Binary tree of editor panes. Leaves hold a tab id; splits cut the space
 * left/right (`x`) or top/bottom (`y`).
 */

import { createId } from "../../lib/id.js";

export const MAX_PANES = 9;

export const makeLeaf = (tabId, id = createId("pane")) => ({
  kind: "leaf",
  id,
  tabId,
});

export const countLeaves = (node) => {
  if (!node) return 0;
  if (node.kind === "leaf") return 1;
  return countLeaves(node.a) + countLeaves(node.b);
};

export const collectTabIds = (node, out = []) => {
  if (!node) return out;
  if (node.kind === "leaf") {
    out.push(node.tabId);
    return out;
  }
  collectTabIds(node.a, out);
  collectTabIds(node.b, out);
  return out;
};

export const findLeafById = (node, leafId) => {
  if (!node) return null;
  if (node.kind === "leaf") return node.id === leafId ? node : null;
  return findLeafById(node.a, leafId) ?? findLeafById(node.b, leafId);
};

export const findLeafByTab = (node, tabId) => {
  if (!node || !tabId) return null;
  if (node.kind === "leaf") return node.tabId === tabId ? node : null;
  return findLeafByTab(node.a, tabId) ?? findLeafByTab(node.b, tabId);
};

export const firstLeaf = (node) => {
  if (!node) return null;
  if (node.kind === "leaf") return node;
  return firstLeaf(node.a) ?? firstLeaf(node.b);
};

const mapLeaves = (node, mapFn) => {
  if (!node) return node;
  if (node.kind === "leaf") return mapFn(node);
  return { ...node, a: mapLeaves(node.a, mapFn), b: mapLeaves(node.b, mapFn) };
};

export const replaceLeafTab = (node, leafId, tabId) =>
  mapLeaves(node, (leaf) => (leaf.id === leafId ? { ...leaf, tabId } : leaf));

/**
 * Wrap any node (a single pane or a whole group) in a new split.
 * `edge` is where the incoming note lands: left/top first, right/bottom second.
 */
export const splitNode = (node, nodeId, edge, newTabId) => {
  const incoming = makeLeaf(newTabId);
  const wrap = (current) => {
    const axis = edge === "left" || edge === "right" ? "x" : "y";
    const incomingFirst = edge === "left" || edge === "top";
    return {
      kind: "split",
      id: createId("split"),
      axis,
      ratio: 0.5,
      a: incomingFirst ? incoming : current,
      b: incomingFirst ? current : incoming,
    };
  };
  const walk = (current) => {
    if (!current) return current;
    if (current.id === nodeId) return wrap(current);
    if (current.kind === "leaf") return current;
    return { ...current, a: walk(current.a), b: walk(current.b) };
  };
  return walk(node);
};

export const splitLeaf = (node, leafId, edge, newTabId) =>
  splitNode(node, leafId, edge, newTabId);

/**
 * Put a tab into the work area. A tab that is already on screen stays
 * unique — dropping it again never opens a second copy.
 */
export const placeTabInTree = (tree, tabId, payload = {}) => {
  if (!tabId) return tree ?? null;
  if (!tree) return makeLeaf(tabId);
  if (findLeafByTab(tree, tabId)) return tree;

  const leafId = payload.leafId;
  const nodeId = payload.nodeId ?? leafId;
  const edge = payload.edge;
  const wantsSplit = Boolean(edge && edge !== "center");
  const room = countLeaves(tree) < MAX_PANES;

  if (wantsSplit && room) return splitNode(tree, nodeId ?? leafId, edge, tabId);

  const targetId = findLeafById(tree, leafId)?.id ?? firstLeaf(tree)?.id;
  return replaceLeafTab(tree, targetId, tabId);
};

export const removeTabFromTree = (node, tabId) => {
  if (!node) return null;
  if (node.kind === "leaf") return node.tabId === tabId ? null : node;
  const a = removeTabFromTree(node.a, tabId);
  const b = removeTabFromTree(node.b, tabId);
  if (!a) return b;
  if (!b) return a;
  return { ...node, a, b };
};

export const setSplitRatio = (node, splitId, ratio) => {
  if (!node || node.kind === "leaf") return node;
  const numeric = Number(ratio);
  const clamped = Math.min(0.78, Math.max(0.22, Number.isFinite(numeric) ? numeric : 0.5));
  if (node.id === splitId) return { ...node, ratio: clamped };
  return { ...node, a: setSplitRatio(node.a, splitId, clamped), b: setSplitRatio(node.b, splitId, clamped) };
};

export const pruneMissingTabs = (node, allowedIds) => {
  const allowed = new Set(allowedIds);
  const walk = (current) => {
    if (!current) return null;
    if (current.kind === "leaf") return allowed.has(current.tabId) ? current : null;
    const a = walk(current.a);
    const b = walk(current.b);
    if (!a) return b;
    if (!b) return a;
    return { ...current, a, b };
  };
  return walk(node);
};

/** Clicking a tab that is not on screen opens it in the focused pane. */
export const showTabInFocusedPane = (node, tabId, focusedTabId) => {
  if (!tabId) return node;
  if (findLeafByTab(node, tabId)) return node;
  if (!node) return makeLeaf(tabId);
  const focused = findLeafByTab(node, focusedTabId) ?? firstLeaf(node);
  if (!focused) return makeLeaf(tabId);
  return replaceLeafTab(node, focused.id, tabId);
};
