import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localPackageSource, nextNoteRevision } from "./packageSource.js";

describe("localPackageSource", () => {
  it("extracts workspace + root note (fileUUID null)", () => {
    const source = localPackageSource({
      workspace: { id: "ws-a", name: "Okul İşleri", createdAt: 1, updatedAt: 2 },
      item: { id: "itm-n", title: "Ders", parentId: null, createdAt: 3, updatedAt: 4 },
      note: { title: "Ders", content: "hello", createdAt: 3, updatedAt: 5, revision: 2 },
    });

    assert.deepEqual(source.workspace, {
      workspaceUUID: "ws-a",
      workspaceName: "Okul İşleri",
      createdAt: 1,
      updatedAt: 2,
    });
    assert.deepEqual(source.file, { exists: false, fileUUID: null, fileName: null });
    assert.deepEqual(source.note, {
      noteUUID: "itm-n",
      noteName: "Ders",
      content: "hello",
      createdAt: 3,
      updatedAt: 5,
      revision: 2,
    });
  });

  it("links a note to its folder File by UUID, not by name", () => {
    const source = localPackageSource({
      workspace: { id: "ws-a", name: "Okul İşleri" },
      file: { id: "itm-folder", title: "Klasör" },
      item: { id: "itm-n", title: "Ders", parentId: "itm-folder" },
      note: { title: "Ders", content: "x", revision: 1 },
    });

    assert.equal(source.file.exists, true);
    assert.equal(source.file.fileUUID, "itm-folder");
    assert.equal(source.file.fileName, "Klasör");
    assert.equal(source.note.noteUUID, "itm-n");
    assert.notEqual(source.note.noteUUID, source.file.fileUUID);
  });

  it("keeps package identity conceptually separate from note identity", () => {
    const source = localPackageSource({
      item: { id: "itm-n", title: "A" },
      note: { title: "A", content: "1" },
    });
    assert.equal(source.note.noteUUID, "itm-n");
    assert.equal("packageUUID" in source, false);
    assert.equal("deviceUUID" in source, false);
  });
});

describe("nextNoteRevision", () => {
  it("increments research-only changes and preserves unchanged revisions", () => {
    const existing = { title: "Araştırma", revision: 4, researchData: { abstract: "Özet", quotes: [] } };
    assert.equal(nextNoteRevision(existing, JSON.parse(JSON.stringify(existing))), 4);
    assert.equal(nextNoteRevision(existing, { ...existing, researchData: { ...existing.researchData, abstract: "Yeni özet" } }), 5);
    assert.equal(nextNoteRevision(existing, { ...existing, researchData: { ...existing.researchData, quotes: [{ id: "quote-uuid", text: "Alıntı" }] } }), 5);
  });

  it("starts at 1 and increments only when the body changes", () => {
    assert.equal(nextNoteRevision(null, { title: "A", content: "1" }), 1);
    assert.equal(
      nextNoteRevision({ title: "A", content: "1", revision: 3 }, { title: "A", content: "1" }),
      3,
    );
    assert.equal(
      nextNoteRevision({ title: "A", content: "1", revision: 3 }, { title: "A", content: "2" }),
      4,
    );
  });
});
