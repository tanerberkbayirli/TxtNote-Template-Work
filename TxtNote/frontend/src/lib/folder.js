/**
 * Classification folders ("Dosya"): grouping notes, not writing them.
 *
 * Folders nest inside folders, so every read here walks the parent chain
 * instead of assuming a single level. Sibling order is the order of the
 * items array — moving a row up or down rewrites that array, nothing else.
 */

export const FOLDER_NOTE_TYPE = "folder";

/** How far the sidebar keeps indenting before it stops adding padding. */
export const MAX_FOLDER_DEPTH = 8;

export const isFolderItem = (item) =>
  item?.type === "folder" || item?.noteType === FOLDER_NOTE_TYPE;

const asList = (items) => (Array.isArray(items) ? items.filter(Boolean) : []);

const indexById = (list) => new Map(list.map((item) => [item.id, item]));

const pinnedFirst = (rows) => [
  ...rows.filter((row) => row.isPinned),
  ...rows.filter((row) => !row.isPinned),
];

/**
 * The folders above an item, nearest first. A parentId that loops back on
 * itself ends the walk rather than spinning: a broken chain must not hang
 * the sidebar.
 */
export function ancestorIdsOf(items, itemId) {
  const byId = indexById(asList(items));
  const chain = [];
  const seen = new Set([itemId]);
  let cursor = byId.get(itemId)?.parentId ?? null;

  while (cursor && byId.has(cursor) && !seen.has(cursor)) {
    seen.add(cursor);
    chain.push(cursor);
    cursor = byId.get(cursor).parentId ?? null;
  }

  return chain;
}

export const isDescendantOf = (items, itemId, ancestorId) =>
  Boolean(ancestorId) && ancestorIdsOf(items, itemId).includes(ancestorId);

/**
 * Returns an item and every descendant beneath it, in the order they occur in
 * the source list.  Keeping this in the folder module gives deletion, restore
 * and the trash the same definition of a folder's contents.
 */
export function collectSubtree(items, rootId) {
  const list = asList(items);
  if (!rootId || !list.some((item) => item.id === rootId)) return [];

  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    list.forEach((item) => {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    });
  }

  return list.filter((item) => ids.has(item.id));
}

/**
 * A folder accepts notes and other folders. What it refuses is itself and
 * anything already inside it — that would cut the subtree loose from the tree.
 */
export function canMoveIntoFolder(item, folder, items = []) {
  if (!item || !folder) return false;
  if (item.id === folder.id) return false;
  if (!isFolderItem(folder)) return false;
  if (isFolderItem(item) && isDescendantOf(items, folder.id, item.id)) return false;
  return true;
}

/** Roots first (pinned, then the rest); children keyed by folder id, any depth. */
export function nestWorkspaceItems(items) {
  const list = asList(items);
  const byId = indexById(list);
  const childrenByParent = new Map();
  const roots = [];

  // An item whose chain never reaches a root is standing in a cycle; showing
  // it at the top level keeps it reachable instead of hiding it forever.
  const parentIdOf = (item) => {
    const parentId = item.parentId;
    if (!parentId || parentId === item.id || !byId.has(parentId)) return null;
    const seen = new Set([item.id]);
    let cursor = parentId;
    while (cursor && byId.has(cursor)) {
      if (seen.has(cursor)) return null;
      seen.add(cursor);
      cursor = byId.get(cursor).parentId ?? null;
    }
    return parentId;
  };

  for (const item of list) {
    const parentId = parentIdOf(item);
    if (parentId) {
      const kids = childrenByParent.get(parentId) ?? [];
      kids.push(item);
      childrenByParent.set(parentId, kids);
    } else {
      roots.push(item);
    }
  }

  for (const [parentId, kids] of childrenByParent) {
    childrenByParent.set(parentId, pinnedFirst(kids));
  }

  const orderedRoots = pinnedFirst(roots);

  return {
    roots: orderedRoots,
    childrenByParent,
    pinnedRootCount: roots.filter((item) => item.isPinned).length,
    depthById: depthMap(orderedRoots, childrenByParent),
  };
}

function depthMap(roots, childrenByParent) {
  const depthById = new Map();
  const walk = (rows, depth) => {
    rows.forEach((row) => {
      depthById.set(row.id, depth);
      walk(childrenByParent.get(row.id) ?? [], depth + 1);
    });
  };
  walk(roots, 0);
  return depthById;
}

/** The siblings a row sits among, in the order they are drawn. */
export function siblingsOf(tree, itemId) {
  const childrenByParent = tree?.childrenByParent instanceof Map ? tree.childrenByParent : new Map();
  for (const kids of childrenByParent.values()) {
    if (kids.some((row) => row.id === itemId)) return kids;
  }
  return Array.isArray(tree?.roots) ? tree.roots : [];
}

/**
 * Keep a folder visible when something inside it matches the title query.
 * A folder that matches on its own name brings its whole subtree along.
 */
export function filterFolderTree(tree, itemMatches) {
  const roots = Array.isArray(tree?.roots) ? tree.roots : [];
  const childrenByParent = tree?.childrenByParent instanceof Map ? tree.childrenByParent : new Map();
  const nextChildren = new Map();

  const keepWholeSubtree = (item) => {
    const kids = childrenByParent.get(item.id) ?? [];
    if (kids.length > 0) nextChildren.set(item.id, kids);
    kids.forEach(keepWholeSubtree);
  };

  const keep = (item) => {
    if (itemMatches(item)) {
      keepWholeSubtree(item);
      return true;
    }
    const keptKids = (childrenByParent.get(item.id) ?? []).filter((kid) => keep(kid));
    if (keptKids.length === 0) return false;
    nextChildren.set(item.id, keptKids);
    return true;
  };

  const nextRoots = roots.filter((root) => keep(root));

  return {
    roots: nextRoots,
    childrenByParent: nextChildren,
    pinnedRootCount: nextRoots.filter((item) => item.isPinned).length,
    depthById: depthMap(nextRoots, nextChildren),
  };
}

export function moveItemIntoFolder(items, itemId, folderId) {
  if (!Array.isArray(items)) return [];
  const item = items.find((row) => row.id === itemId);
  const folder = items.find((row) => row.id === folderId);
  if (!canMoveIntoFolder(item, folder, items)) return items;
  if (item.parentId === folderId) return items;
  const updatedAt = Date.now();
  return items.map((row) =>
    row.id === itemId ? { ...row, parentId: folderId, updatedAt } : row,
  );
}

/**
 * Drops an item just before or just after another one, adopting that row's
 * folder. This is the only writer for "move it up" / "move it down": order
 * is array order, so the row is lifted out and put back in one pass.
 */
export function moveItemBeside(items, itemId, targetId, place = "before") {
  if (!Array.isArray(items)) return [];
  if (!itemId || !targetId || itemId === targetId) return items;

  const item = items.find((row) => row.id === itemId);
  const target = items.find((row) => row.id === targetId);
  if (!item || !target) return items;

  const parentId = target.parentId ?? null;
  // Landing next to a row that lives inside the dragged folder would make the
  // folder its own ancestor.
  if (parentId === itemId || isDescendantOf(items, parentId, itemId)) return items;

  const without = items.filter((row) => row.id !== itemId);
  const targetIndex = without.findIndex((row) => row.id === targetId);
  if (targetIndex < 0) return items;

  const insertAt = place === "after" ? targetIndex + 1 : targetIndex;
  const moved = { ...item, parentId, updatedAt: Date.now() };

  return [...without.slice(0, insertAt), moved, ...without.slice(insertAt)];
}

export function removeItemFromFolder(items, itemId) {
  if (!Array.isArray(items)) return [];
  const updatedAt = Date.now();
  return items.map((row) =>
    row.id === itemId && row.parentId ? { ...row, parentId: null, updatedAt } : row,
  );
}

/** Deleting a folder returns what it held to the root list. */
export function detachChildrenOf(items, folderId) {
  if (!Array.isArray(items)) return [];
  const updatedAt = Date.now();
  return items.map((row) =>
    row.parentId === folderId ? { ...row, parentId: null, updatedAt } : row,
  );
}
