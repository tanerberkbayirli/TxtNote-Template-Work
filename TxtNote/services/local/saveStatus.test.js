import assert from "node:assert/strict";
import { describe, it } from "node:test";

// The desktop runtime as @tauri-apps/api/core sees it, with a database that refuses (or accepts) every write.
let refuse = true;
const calls = [];
globalThis.isTauri = true;
globalThis.window = {
  __TAURI_INTERNALS__: {
    invoke: async (command) => {
      calls.push(command);
      if (refuse) throw new Error("database is locked");
      return null;
    },
    transformCallback: () => 0,
  },
};

const { saveSnapshot, onSaveStatus } = await import("./index.ts");

const snapshot = { workspaces: [{ id: "w1", name: "A" }], items: [], trash: [], notes: {}, trashEnabled: true, session: {}, profile: {} };

describe("local save status (HE-VB-05)", () => {
  it("rejects and reports a snapshot the database refused, then clears once a save succeeds", async () => {
    const seen = [];
    const stop = onSaveStatus((status) => seen.push(status));
    await assert.rejects(saveSnapshot(snapshot), /Veritabanına yazılamadı: database is locked/);
    assert.deepEqual(calls.slice(-2), ["save_snapshot", "save_snapshot_json"]);
    assert.equal(seen.at(-1).ok, false);
    assert.match(seen.at(-1).error, /database is locked/);

    // The queue keeps going after a failure: the next write is attempted and succeeds.
    refuse = false;
    await saveSnapshot(snapshot);
    assert.equal(seen.at(-1).ok, true);
    stop();
  });
});
