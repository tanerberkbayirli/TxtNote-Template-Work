/**
 * Bounded undo/redo history of editor states ({ html, sel }).
 * `base` is the state after the latest committed edit; `past` holds the states before it.
 * Typing commits coalesce: edits within `windowMs` of the previous typing edit share one step.
 */
export function createTextHistory({ limit = 100, windowMs = 500 } = {}) {
  let past = [];
  let future = [];
  let base = null;
  let lastTypingAt = -Infinity;

  return {
    reset(state) { past = []; future = []; base = state; lastTypingAt = -Infinity; },
    /** Selection before the next edit (no-op while a typing group is open). */
    setSelection(sel, now = Date.now()) {
      if (base && sel && now - lastTypingAt >= windowMs) base = { ...base, sel };
    },
    /** Record a new state after an edit. Returns true when it changed the document. */
    commit(next, { typing = false, now = Date.now() } = {}) {
      if (!base) { base = next; return false; }
      if (base.html === next.html) { base = { ...base, sel: next.sel ?? base.sel }; return false; }
      const joinGroup = typing && now - lastTypingAt < windowMs && past.length > 0;
      if (!joinGroup) {
        past.push(base);
        if (past.length > limit) past.shift();
      }
      lastTypingAt = typing ? now : -Infinity;
      future = [];
      base = next;
      return true;
    },
    undo() {
      if (!past.length || !base) return null;
      future.push(base);
      base = past.pop();
      lastTypingAt = -Infinity;
      return base;
    },
    redo() {
      if (!future.length || !base) return null;
      past.push(base);
      base = future.pop();
      lastTypingAt = -Infinity;
      return base;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}
