import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeLivingNotes } from "./notesMerge.js";

describe("mergeLivingNotes", () => {
  it("keeps unloaded bodies for items that still exist", () => {
    const merged = mergeLivingNotes(
      { a: { content: "old-a" }, b: { content: "old-b" } },
      { a: { content: "new-a" } },
      [{ id: "a" }, { id: "b" }],
      [],
    );
    assert.deepEqual(merged, { a: { content: "new-a" }, b: { content: "old-b" } });
  });

  it("does not resurrect a note that was deleted from items and trash", () => {
    const merged = mergeLivingNotes(
      { a: { content: "gone" }, b: { content: "keep" } },
      { b: { content: "keep" } },
      [{ id: "b" }],
      [],
    );
    assert.equal(merged.a, undefined);
    assert.deepEqual(merged.b, { content: "keep" });
  });

  it("keeps trash bodies until they are purged", () => {
    const merged = mergeLivingNotes(
      { a: { content: "binned" } },
      {},
      [],
      [{ id: "a" }],
    );
    assert.deepEqual(merged, { a: { content: "binned" } });
  });

  it("does not keep incoming bodies for ids that are gone", () => {
    const merged = mergeLivingNotes({}, { ghost: { content: "x" } }, [{ id: "live" }], []);
    assert.equal(merged.ghost, undefined);
  });
});
