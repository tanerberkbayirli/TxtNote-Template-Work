import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  delayForReason,
  diffSnapshots,
  isRedoHotkey,
  isUndoHotkey,
  mindmapChangeKind,
  noteHistoryKey,
  shouldHandleUndoHotkey,
  sliceFromPatch,
  todosChangeKind,
  TYPE_DELAY_MS,
  ACTION_DELAY_MS,
} from "./undoHistory.js";

const shell = (overrides = {}) => ({
  workspaces: [],
  items: [],
  trash: [],
  notes: {},
  tabs: [],
  tabHistory: [],
  paneTrees: {},
  activeTabId: null,
  currentWorkspaceId: "ws1",
  activeNavId: null,
  isTrashEnabled: true,
  retiredWorkspaces: [],
  ...overrides,
});

describe("diffSnapshots", () => {
  it("returns null when every slice is the same reference", () => {
    const items = [{ id: "a" }];
    const snap = shell({ items });
    assert.equal(diffSnapshots(snap, { ...snap }), null);
  });

  it("stores only the notes that actually changed", () => {
    const keep = { title: "A", content: "one" };
    const beforeNote = { title: "B", content: "old" };
    const afterNote = { title: "B", content: "new" };
    const base = shell();
    const before = { ...base, notes: { keep, edit: beforeNote } };
    const after = { ...base, notes: { keep, edit: afterNote } };
    const patch = diffSnapshots(before, after);
    assert.deepEqual(Object.keys(patch.notes), ["edit"]);
    assert.equal(patch.notes.edit.before, beforeNote);
    assert.equal(patch.notes.edit.after, afterNote);
    assert.equal(patch.items, undefined);
  });

  it("records a created note as before: undefined", () => {
    const created = { title: "Yeni", content: "" };
    const base = shell();
    const patch = diffSnapshots(base, { ...base, notes: { n1: created } });
    assert.equal(patch.notes.n1.before, undefined);
    assert.equal(patch.notes.n1.after, created);
  });

  it("ignores retired workspace lists with the same ids in a new array", () => {
    const base = shell({ retiredWorkspaces: ["ws-a"] });
    const after = { ...base, retiredWorkspaces: ["ws-a"] };
    assert.equal(diffSnapshots(base, after), null);
  });

  it("records an item list swap as a shell change", () => {
    const beforeItems = [{ id: "a" }];
    const afterItems = [];
    const base = shell();
    const patch = diffSnapshots(
      { ...base, items: beforeItems },
      { ...base, items: afterItems },
    );
    assert.equal(patch.items.before, beforeItems);
    assert.equal(patch.items.after, afterItems);
  });
});

describe("sliceFromPatch", () => {
  it("picks the before side so undo can restore it", () => {
    const items = [{ id: "a" }];
    const patch = {
      items: { before: items, after: [] },
      notes: { n1: { before: { content: "old" }, after: { content: "new" } } },
    };
    assert.deepEqual(sliceFromPatch(patch, "before"), {
      items,
      notes: { n1: { content: "old" } },
    });
    assert.deepEqual(sliceFromPatch(patch, "after"), {
      items: [],
      notes: { n1: { content: "new" } },
    });
  });
});

describe("noteHistoryKey and delay", () => {
  it("keeps format and typing on separate bursts", () => {
    assert.equal(noteHistoryKey("n1", "content", "input"), "note:n1:content:type");
    assert.equal(noteHistoryKey("n1", "content", "format"), "note:n1:content:format");
    assert.equal(delayForReason("format"), ACTION_DELAY_MS);
    assert.equal(delayForReason("input"), TYPE_DELAY_MS);
  });
});

describe("todosChangeKind", () => {
  it("treats typing as type and checking as action", () => {
    const a = [{ id: "t1", text: "x", done: false }];
    const b = [{ id: "t1", text: "xy", done: false }];
    const c = [{ id: "t1", text: "xy", done: true }];
    assert.equal(todosChangeKind(a, b), "type");
    assert.equal(todosChangeKind(a, c), "action");
    assert.equal(todosChangeKind(a, []), "action");
  });

  it("treats a persistent-mark flip as an action", () => {
    const list = [{ id: "t1", text: "diş", done: false }];
    const off = { persistent: false, days: { "2026-09-20": list }, marks: {} };
    const on = { persistent: true, days: {}, marks: { "2026-09-20": { t1: { done: true } } } };
    assert.equal(todosChangeKind(list, list, off, on), "action");
  });

  it("treats progress logs as actions", () => {
    const a = [{ id: "t1", kind: "progress", text: "koşu", target: 100, logs: [] }];
    const typed = [{ id: "t1", kind: "progress", text: "koşu 5k", target: 100, logs: [] }];
    const logged = [
      { id: "t1", kind: "progress", text: "koşu 5k", target: 100, logs: [{ date: "2026-09-09", amount: 70 }] },
    ];
    assert.equal(todosChangeKind(a, typed), "type");
    assert.equal(todosChangeKind(typed, logged), "action");
  });
});

describe("mindmapChangeKind", () => {
  const node = (patch) => ({ id: "n", kind: "note", x: 0, y: 0, text: "", ...patch });

  it("coalesces label/text edits and splits structural edits", () => {
    const prev = { nodes: [node({ text: "a" })], edges: [] };
    const typed = { nodes: [node({ text: "ab" })], edges: [] };
    const moved = { nodes: [node({ text: "ab", x: 10 })], edges: [] };
    const added = { nodes: [node({ text: "ab" }), node({ id: "n2" })], edges: [] };
    assert.equal(mindmapChangeKind(prev, typed), "type");
    assert.equal(mindmapChangeKind(typed, moved), "action");
    assert.equal(mindmapChangeKind(typed, added), "action");
  });
});

describe("hotkeys", () => {
  it("recognises Ctrl+Z / Ctrl+Y / Shift+Z", () => {
    assert.equal(isUndoHotkey({ ctrlKey: true, key: "z", shiftKey: false }), true);
    assert.equal(isUndoHotkey({ ctrlKey: true, key: "z", shiftKey: true }), false);
    assert.equal(isRedoHotkey({ ctrlKey: true, key: "y" }), true);
    assert.equal(isRedoHotkey({ metaKey: true, key: "z", shiftKey: true }), true);
    assert.equal(isUndoHotkey({ ctrlKey: true, altKey: true, key: "z" }), false);
  });

  it("leaves dialogs and unmarked inputs to the browser", () => {
    const dialog = {
      closest(selector) {
        return selector.includes("dialog") ? this : null;
      },
    };
    assert.equal(shouldHandleUndoHotkey({ target: dialog }), false);

    const search = {
      closest(sel) {
        if (sel === "input, textarea, select") return this;
        return null;
      },
      getAttribute: () => null,
    };
    assert.equal(shouldHandleUndoHotkey({ target: search }), false);

    const appField = {
      closest(sel) {
        if (sel === "input, textarea, select") return this;
        return null;
      },
      getAttribute: (name) => (name === "data-undo-app" ? "true" : null),
    };
    assert.equal(shouldHandleUndoHotkey({ target: appField }), true);
  });
});
