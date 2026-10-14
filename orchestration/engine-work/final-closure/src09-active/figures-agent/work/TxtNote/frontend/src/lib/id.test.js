import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createId } from "./id.js";

const UUID_TAIL = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("createId", () => {
  it("produces local UUIDs without a server", () => {
    const id = createId("itm");
    assert.ok(id.startsWith("itm-"));
    assert.match(id.slice(4), UUID_TAIL);
  });

  it("never reuses an id for two creates", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createId("ws")));
    assert.equal(ids.size, 20);
  });
});
