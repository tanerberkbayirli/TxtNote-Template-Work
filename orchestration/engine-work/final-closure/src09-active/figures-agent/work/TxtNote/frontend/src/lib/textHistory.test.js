import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTextHistory } from "./textHistory.js";

const s = (html, sel = null) => ({ html, sel });

describe("textHistory", () => {
  it("undoes and redoes discrete edits with selection", () => {
    const h = createTextHistory();
    h.reset(s("a", { start: 0, end: 1 }));
    h.commit(s("<b>a</b>", { start: 0, end: 1 }));
    h.commit(s("<b>a</b>x"));
    assert.equal(h.undo().html, "<b>a</b>");
    assert.deepEqual(h.undo(), s("a", { start: 0, end: 1 }));
    assert.equal(h.undo(), null);
    assert.equal(h.redo().html, "<b>a</b>");
    assert.equal(h.canRedo(), true);
  });

  it("coalesces typing inside the window and splits after it", () => {
    const h = createTextHistory({ windowMs: 500 });
    h.reset(s(""));
    h.commit(s("a"), { typing: true, now: 0 });
    h.commit(s("ab"), { typing: true, now: 100 });
    h.commit(s("abc"), { typing: true, now: 200 });
    h.commit(s("abcd"), { typing: true, now: 900 });
    assert.equal(h.undo().html, "abc");
    assert.equal(h.undo().html, "");
  });

  it("a format edit closes the typing group and clears redo", () => {
    const h = createTextHistory();
    h.reset(s(""));
    h.commit(s("a"), { typing: true, now: 0 });
    h.commit(s("<i>a</i>"));
    h.commit(s("<i>a</i>b"), { typing: true, now: 10 });
    assert.equal(h.undo().html, "<i>a</i>");
    h.undo();
    h.commit(s("z"));
    assert.equal(h.canRedo(), false);
  });

  it("bounds the stack", () => {
    const h = createTextHistory({ limit: 3 });
    h.reset(s("0"));
    for (let i = 1; i <= 10; i += 1) h.commit(s(String(i)));
    let n = 0;
    while (h.undo()) n += 1;
    assert.equal(n, 3);
  });
});
