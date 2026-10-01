/**
 * Command-stack helpers for app-wide undo/redo. Snapshots are cheap: only
 * slices that actually changed are stored, and note bodies are kept per id.
 */

export const TYPE_DELAY_MS = 500;
export const ACTION_DELAY_MS = 0;
export const HISTORY_LIMIT = 100;
export const UNDO_APP_ATTR = "data-undo-app";

const SHELL_KEYS = [
  "workspaces",
  "items",
  "trash",
  "notes",
  "tabs",
  "tabHistory",
  "paneTrees",
  "activeTabId",
  "currentWorkspaceId",
  "activeNavId",
  "isTrashEnabled",
  "retiredWorkspaces",
];

const sameIdList = (left = [], right = []) => {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
};

const diffNotes = (before = {}, after = {}) => {
  const notes = {};
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  ids.forEach((id) => {
    if (before[id] === after[id]) return;
    notes[id] = { before: before[id], after: after[id] };
  });
  return Object.keys(notes).length > 0 ? notes : null;
};

/** Compact patch of two shell snapshots, or null when nothing changed. */
export function diffSnapshots(before, after) {
  if (!before || !after || before === after) return null;

  const changes = {};
  for (const key of SHELL_KEYS) {
    if (key === "notes") {
      const notes = diffNotes(before.notes, after.notes);
      if (notes) changes.notes = notes;
      continue;
    }
    if (key === "retiredWorkspaces") {
      if (sameIdList(before.retiredWorkspaces, after.retiredWorkspaces)) continue;
      changes.retiredWorkspaces = {
        before: before.retiredWorkspaces ?? [],
        after: after.retiredWorkspaces ?? [],
      };
      continue;
    }
    if (before[key] === after[key]) continue;
    changes[key] = { before: before[key], after: after[key] };
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/** Pull the `before` or `after` side of a patch into a slice App can apply. */
export function sliceFromPatch(patch, side) {
  const slice = {};
  if (!patch) return slice;

  for (const [key, value] of Object.entries(patch)) {
    if (key === "notes") {
      const notes = {};
      for (const [id, pair] of Object.entries(value)) {
        notes[id] = pair[side];
      }
      slice.notes = notes;
      continue;
    }
    slice[key] = value[side];
  }

  return slice;
}

export function noteHistoryKey(noteId, field, reason) {
  const burst =
    reason === "format" || reason === "paste" || reason === "action" ? reason : "type";
  return `note:${noteId}:${field}:${burst}`;
}

export function delayForReason(reason) {
  if (reason === "format" || reason === "paste" || reason === "action") return ACTION_DELAY_MS;
  return TYPE_DELAY_MS;
}

const todosListChangeKind = (prev = [], next = []) => {
  if (prev.length !== next.length) return "action";
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (a?.id !== b?.id) return "action";
    if (Boolean(a?.done) !== Boolean(b?.done)) return "action";
    if (Boolean(a?.failed) !== Boolean(b?.failed)) return "action";
    if ((a?.kind ?? "classic") !== (b?.kind ?? "classic")) return "action";
    if (Number(a?.target ?? 0) !== Number(b?.target ?? 0)) return "action";
    if (JSON.stringify(a?.logs ?? []) !== JSON.stringify(b?.logs ?? [])) return "action";
  }
  return "type";
};

const todoPlanChangeKind = (prevPlan, nextPlan) => {
  if (prevPlan == null && nextPlan == null) return null;
  const prev = prevPlan && typeof prevPlan === "object" ? prevPlan : {};
  const next = nextPlan && typeof nextPlan === "object" ? nextPlan : {};
  if (Boolean(prev.persistent) !== Boolean(next.persistent)) return "action";
  if (JSON.stringify(prev.marks ?? {}) !== JSON.stringify(next.marks ?? {})) return "action";
  const daysA = prev.days && typeof prev.days === "object" ? prev.days : {};
  const daysB = next.days && typeof next.days === "object" ? next.days : {};
  const keys = new Set([...Object.keys(daysA), ...Object.keys(daysB)]);
  let typed = false;
  for (const key of keys) {
    const sub = todosListChangeKind(daysA[key] ?? [], daysB[key] ?? []);
    if (sub === "action") return "action";
    if (sub === "type") typed = true;
  }
  return typed ? "type" : null;
};

/** Typing in a row vs adding/removing/checking a task. */
export function todosChangeKind(prev = [], next = [], prevPlan, nextPlan) {
  const planKind = todoPlanChangeKind(prevPlan, nextPlan);
  if (planKind === "action") return "action";
  const listKind = todosListChangeKind(prev, next);
  if (listKind === "action") return "action";
  return "type";
}

/**
 * Text/url/label edits coalesce; adding a node, dragging, or recolouring
 * is a discrete step so Ctrl+Z peels them off one at a time.
 */
export function mindmapChangeKind(prev, next) {
  if (!prev || !next) return "action";
  const prevNodes = prev.nodes ?? [];
  const nextNodes = next.nodes ?? [];
  const prevEdges = prev.edges ?? [];
  const nextEdges = next.edges ?? [];
  if (prevNodes.length !== nextNodes.length || prevEdges.length !== nextEdges.length) {
    return "action";
  }

  for (let i = 0; i < prevNodes.length; i += 1) {
    const a = prevNodes[i];
    const b = nextNodes[i];
    if (!a || !b || a.id !== b.id || a.kind !== b.kind) return "action";
    if (a.x !== b.x || a.y !== b.y) return "action";
    if (a.color !== b.color || a.shape !== b.shape) return "action";
    if (a.width !== b.width || a.height !== b.height) return "action";
    if (a.files !== b.files || a.image !== b.image) return "action";
  }

  for (let i = 0; i < prevEdges.length; i += 1) {
    const a = prevEdges[i];
    const b = nextEdges[i];
    if (!a || !b || a.id !== b.id || a.kind !== b.kind) return "action";
    if (a.sourceId !== b.sourceId || a.targetId !== b.targetId) return "action";
    if (a.waypointIds !== b.waypointIds) {
      if (JSON.stringify(a.waypointIds ?? []) !== JSON.stringify(b.waypointIds ?? [])) {
        return "action";
      }
    }
  }

  return "type";
}

export function isUndoHotkey(event) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  if (event.isComposing) return false;
  return event.key?.toLowerCase() === "z" && !event.shiftKey;
}

export function isRedoHotkey(event) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  if (event.isComposing) return false;
  const key = event.key?.toLowerCase();
  return key === "y" || (key === "z" && event.shiftKey);
}

/**
 * Native fields (search, dialogs, uncommitted drafts) keep the browser undo.
 * contentEditable note bodies and `data-undo-app` fields use the app stack.
 */
export function shouldHandleUndoHotkey(event) {
  const target = event.target;
  if (!target || typeof target.closest !== "function") return true;
  // An object controller or transient text editor can explicitly own its undo.
  // Only the event target opts in; ordinary note bodies inside it still use app history.
  if (target.getAttribute?.("data-undo-owner") === "local") return false;
  if (target.closest('[role="dialog"], [role="alertdialog"]')) return false;
  const field = target.closest("input, textarea, select");
  if (!field) return true;
  return field.getAttribute(UNDO_APP_ATTR) === "true";
}
