import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createId } from "./id.js";
import { fileUuidForItem, isFileEntity, stampCreated, stampUpdated } from "./entity.js";

describe("entity identity", () => {
  it("gives two same-named workspaces different UUIDs", () => {
    const a = stampCreated({ id: createId("ws"), name: "Okul İşleri" });
    const b = stampCreated({ id: createId("ws"), name: "Okul İşleri" });
    assert.equal(a.name, b.name);
    assert.notEqual(a.id, b.id);
    assert.ok(a.id.startsWith("ws-"));
    assert.ok(b.id.startsWith("ws-"));
    assert.equal(typeof a.createdAt, "number");
    assert.equal(typeof b.updatedAt, "number");
  });

  it("treats parentId as the File UUID and allows a null root note", () => {
    assert.equal(fileUuidForItem({ parentId: null }), null);
    assert.equal(fileUuidForItem({ parentId: "folder-1" }), "folder-1");
    assert.equal(isFileEntity({ type: "folder" }), true);
    assert.equal(isFileEntity({ type: "document" }), false);
  });

  it("preserves createdAt when touching updatedAt", () => {
    const created = stampCreated({ id: "n1" }, 10);
    const updated = stampUpdated(created, 20);
    assert.equal(updated.createdAt, 10);
    assert.equal(updated.updatedAt, 20);
  });
});
