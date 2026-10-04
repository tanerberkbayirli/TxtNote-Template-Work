import assert from "node:assert/strict";
import { test } from "node:test";
import { paginationDiagnostics } from "./export-diagnostics.mjs";

test("a hung page cannot hang timeout diagnostics", async () => {
  const result = await paginationDiagnostics({ evaluate: () => new Promise(() => {}) }, { timeoutMs: 20 });
  assert.deepEqual(result, { diagnostics: "page unresponsive" });
});

test("a closed page produces a diagnostic instead of masking the export failure", async () => {
  assert.deepEqual(await paginationDiagnostics({ evaluate: async () => { throw new Error("closed"); } }), { diagnostics: "page unavailable" });
});

test("diagnostics finish when animation frames stop", async () => {
  const original = { document: globalThis.document, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  globalThis.document = { visibilityState: "hidden", querySelector: () => null, querySelectorAll: () => [] };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  try {
    const result = await paginationDiagnostics({ evaluate: (fn, duration) => fn(duration) }, { sampleMs: 10, timeoutMs: 200 });
    assert.equal(result.frames500ms, 0);
    assert.equal(result.visibility, "hidden");
    assert.equal(result.ready, "missing");
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
