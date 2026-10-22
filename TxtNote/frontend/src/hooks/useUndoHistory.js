/**
 * App-wide undo/redo. `begin` is called at the start of a user action; after
 * React commits, the hook diffs the shell and pushes one stack entry. Typing
 * coalesces by key until the delay elapses (or a different action starts).
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  ACTION_DELAY_MS,
  HISTORY_LIMIT,
  diffSnapshots,
  isRedoHotkey,
  isUndoHotkey,
  shouldHandleUndoHotkey,
  sliceFromPatch,
} from "../lib/undoHistory";

export function useUndoHistory({ getSnapshot, applySlice, enabled = true }) {
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const pendingRef = useRef(null);
  const applyingRef = useRef(false);
  const getSnapshotRef = useRef(getSnapshot);
  const applySliceRef = useRef(applySlice);
  getSnapshotRef.current = getSnapshot;
  applySliceRef.current = applySlice;

  /** @returns {boolean} false when React has not committed the action yet. */
  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return true;
    const timer = pending.timer;
    window.clearTimeout(pending.timer);
    if (applyingRef.current) {
      pending.timer = timer;
      return false;
    }
    const patch = diffSnapshots(pending.before, getSnapshotRef.current());
    if (!patch) {
      if (pending.delay > 0) {
        pending.timer = window.setTimeout(flushPending, pending.delay);
      }
      return false;
    }
    pendingRef.current = null;
    pastRef.current.push(patch);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
    return true;
  }, []);

  const begin = useCallback(
    (key, delay = ACTION_DELAY_MS) => {
      if (!enabled || applyingRef.current) return;
      const pending = pendingRef.current;
      if (pending && pending.key === key) {
        window.clearTimeout(pending.timer);
        pending.timer = delay > 0 ? window.setTimeout(flushPending, delay) : null;
        return;
      }
      if (pending && !flushPending()) {
        queueMicrotask(() => begin(key, delay));
        return;
      }
      pendingRef.current = {
        key,
        before: getSnapshotRef.current(),
        delay,
        timer: delay > 0 ? window.setTimeout(flushPending, delay) : null,
      };
    },
    [enabled, flushPending],
  );

  // Immediate actions (format, paste, delete) call setState in the same turn.
  // Flushing on setTimeout(0) runs before React commits, so the patch is lost.
  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pending.delay > 0 || applyingRef.current) return;
    flushPending();
  });

  const applyPatch = useCallback((patch, side) => {
    applyingRef.current = true;
    applySliceRef.current(sliceFromPatch(patch, side));
    // After this event's React commit (child effects included), allow new actions.
    window.setTimeout(() => {
      applyingRef.current = false;
    }, 0);
  }, []);

  const undo = useCallback(() => {
    flushPending();
    const patch = pastRef.current.pop();
    if (!patch) return false;
    futureRef.current.push(patch);
    applyPatch(patch, "before");
    return true;
  }, [applyPatch, flushPending]);

  const redo = useCallback(() => {
    flushPending();
    const patch = futureRef.current.pop();
    if (!patch) return false;
    pastRef.current.push(patch);
    applyPatch(patch, "after");
    return true;
  }, [applyPatch, flushPending]);

  const isApplying = useCallback(() => applyingRef.current, []);

  /**
   * Forget every step. Used after an irreversible action (permanent delete): each step holds whole item/trash lists,
   * so undoing any earlier one would bring the deleted entry back without the text and files storage has already
   * dropped (HE-VB-04).
   */
  const reset = useCallback(() => {
    if (pendingRef.current) window.clearTimeout(pendingRef.current.timer);
    pendingRef.current = null;
    pastRef.current = [];
    futureRef.current = [];
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (!isUndoHotkey(event) && !isRedoHotkey(event)) return;
      if (!shouldHandleUndoHotkey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (isRedoHotkey(event)) redo();
      else undo();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, redo, undo]);

  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (pending) window.clearTimeout(pending.timer);
    },
    [],
  );

  return { begin, undo, redo, isApplying, flushPending, reset };
}
