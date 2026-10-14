import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildNotePayload, checksum, hashNote, noteFromPayload } from "./payload.js";

describe("checksum", () => {
  it("is stable across object key order", () => {
    assert.equal(checksum({ b: 1, a: 2 }), checksum({ a: 2, b: 1 }));
  });

  it("changes when content changes", () => {
    assert.notEqual(checksum({ title: "a" }), checksum({ title: "b" }));
  });
});

describe("note payload", () => {
  it("round-trips thesis metadata through the existing extras payload", () => {
    const thesis = { templateId: "demo", templateVersion: "1.0.0", values: { STUDENT_NAME: "Ada" }, sectionContent: { abstract: "<p>Özet</p>" } };
    const payload = buildNotePayload({ noteId: "note", workspaceId: "ws", note: { title: "Tez", content: "<h1>Giriş</h1>", researchData: { thesis } }, deviceId: "device" });
    const restored = noteFromPayload(payload).researchData.thesis;
    const { document, ...compatible } = restored;
    assert.deepEqual(compatible, thesis);
    assert.equal(document.version, 1);
    assert.equal(document.sections.length, 2);
  });
  it("preserves research fields and quote edits across JSON sync round-trips", () => {
    const researchData = {
      sourceTitle: "Çalışma", authors: "A. Yazar", publicationYear: "2026",
      publication: "Üniversite", doi: "10.1234/test", url: "https://example.org",
      keywords: "bilim, araştırma", abstract: "<p>Özet</p>",
      researchQuestion: "Soru?", methodology: "Yöntem", findings: "Bulgular",
      quotes: [{ id: "quote-uuid", text: "<p>Alıntı</p>", page: "12–14", comment: "Yorum" }],
      personalNotes: "<p>Notlarım</p>", relatedWorks: "İlgili çalışma",
    };
    const note = { title: "Araştırma", content: "", researchData };
    const payload = buildNotePayload({ noteId: "itm-uuid", workspaceId: "ws-uuid", note });
    assert.deepEqual(noteFromPayload(JSON.parse(JSON.stringify(payload))).researchData, researchData);
    const edited = { ...note, researchData: { ...researchData, quotes: [] } };
    assert.notEqual(hashNote("itm-uuid", "ws-uuid", edited), payload.hash);
    assert.deepEqual(noteFromPayload(buildNotePayload({ noteId: "itm-uuid", note: edited })).researchData.quotes, []);
  });

  it("round-trips a flashcard deck without adding one to other notes", () => {
    const note = {
      title: "Flashcards",
      content: "",
      flashcards: {
        cards: [{ id: "c1", front: "Soru", back: "Cevap", image: "data:image/png;base64,abc" }],
      },
    };
    const payload = buildNotePayload({ noteId: "cards", workspaceId: "w1", note });
    const restored = noteFromPayload(JSON.parse(JSON.stringify(payload)));
    assert.equal(restored.flashcards.cards[0].front, "Soru");
    assert.equal(restored.flashcards.cards[0].image, "data:image/png;base64,abc");
    const changed = {
      ...note,
      flashcards: { cards: [{ ...note.flashcards.cards[0], front: "Soru?" }] },
    };
    assert.notEqual(hashNote("cards", "w1", changed), payload.hash);
    assert.equal(
      noteFromPayload(buildNotePayload({ noteId: "plain", note: { title: "A", content: "B" } })).flashcards,
      undefined,
    );
  });

  it("round-trips extras and ignores missing slices", () => {
    const payload = buildNotePayload({
      noteId: "n1",
      workspaceId: "w1",
      note: { title: "A", content: "B" },
      deviceId: "dev-1",
      updatedAt: 1,
    });
    assert.equal(payload.hash, hashNote("n1", "w1", { title: "A", content: "B" }));
    assert.deepEqual(noteFromPayload(payload), {
      title: "A",
      content: "B",
      todos: [],
      entries: {},
      mindmap: { nodes: [], edges: [] },
    });
  });

  it("does not throw on an empty payload", () => {
    assert.deepEqual(noteFromPayload({}), {
      title: "",
      content: "",
      todos: [],
      entries: {},
      mindmap: { nodes: [], edges: [] },
    });
  });

  it("round-trips daily to-do plans", () => {
    const note = {
      title: "Günlük To-Do",
      content: "",
      todos: [{ id: "t1", text: "diş", done: false }],
      todoDaily: true,
      todoPlan: {
        persistent: true,
        days: {},
        marks: { "2026-09-20": { t1: { done: true, failed: false } } },
      },
    };
    const payload = buildNotePayload({ noteId: "n2", workspaceId: "w1", note });
    const restored = noteFromPayload(JSON.parse(JSON.stringify(payload)));
    assert.equal(restored.todoDaily, true);
    assert.equal(restored.todoPlan.persistent, true);
    assert.equal(restored.todoPlan.marks["2026-09-20"].t1.done, true);
    assert.notEqual(hashNote("n2", "w1", { ...note, todoPlan: { ...note.todoPlan, persistent: false } }), payload.hash);
  });
});
