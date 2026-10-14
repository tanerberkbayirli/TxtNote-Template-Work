import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampIndex,
  createStudySession,
  deckStatus,
  flashcardsChangeKind,
  flipSession,
  isCardEmpty,
  markSession,
  moveSession,
  sameFlashcardDeck,
  sanitizeDeck,
  sessionCard,
  studyResults,
} from "./flashcards.js";

const card = (id, front, back, image = null) => ({ id, front, back, image });

describe("sanitizeDeck", () => {
  it("keeps a stable id and drops unsafe image sources", () => {
    const once = sanitizeDeck({
      cards: [{ front: "Soru", back: "Cevap", image: "javascript:alert(1)" }],
    });
    const twice = sanitizeDeck({
      cards: [{ front: "Soru", back: "Cevap", image: "javascript:alert(1)" }],
    });
    assert.equal(once.cards[0].id, "card-1");
    assert.deepEqual(once, twice);
    assert.equal(once.cards[0].image, null);
  });

  it("preserves existing ids and data-url images", () => {
    const deck = sanitizeDeck({
      cards: [{ id: "c1", front: "A", back: "B", image: "data:image/png;base64,abc" }],
    });
    assert.equal(deck.cards[0].id, "c1");
    assert.equal(deck.cards[0].image, "data:image/png;base64,abc");
  });

  it("returns null when the note has no deck", () => {
    assert.equal(sanitizeDeck(undefined), null);
    assert.equal(sanitizeDeck(null), null);
  });
});

describe("deck status", () => {
  it("counts empty and one-sided cards", () => {
    const cards = [
      card("a", "Soru", "Cevap"),
      card("b", "", "", "data:image/png;base64,abc"),
      card("c", "   ", "  "),
    ];
    assert.equal(isCardEmpty(cards[2]), true);
    assert.deepEqual(deckStatus(cards), { total: 3, empty: 1, incomplete: 1, playable: 2 });
  });
});

describe("editing", () => {
  it("clamps the index after the last card is removed", () => {
    assert.equal(clampIndex(4, 2), 1);
    assert.equal(clampIndex(0, 0), 0);
  });

  it("treats text as typing and picture changes as actions", () => {
    const prev = { cards: [card("a", "Soru", "")] };
    assert.equal(flashcardsChangeKind(prev, { cards: [card("a", "Soru!", "")] }), "type");
    assert.equal(
      flashcardsChangeKind(prev, { cards: [card("a", "Soru", "", "data:image/png;base64,x")] }),
      "action",
    );
    assert.equal(flashcardsChangeKind(prev, { cards: [] }), "action");
    assert.equal(sameFlashcardDeck(prev, { cards: [card("a", "Soru", "")] }), true);
  });
});

describe("study session", () => {
  const deck = [card("a", "1", "bir"), card("b", "2", "iki"), card("c", " ", " ")];

  it("skips empty cards and studies a single card", () => {
    const alone = createStudySession([card("a", "Soru", "Cevap")], 0);
    assert.equal(alone.pass, "first");
    const done = markSession(alone, "know", 1000);
    assert.equal(sessionCard(done), null);
    assert.equal(done.pass, "done");
    const results = studyResults(done);
    assert.equal(results.total, 1);
    assert.equal(results.known, 1);
    assert.equal(results.again, 0);
    assert.equal(results.firstTry, 1);
    assert.equal(results.later, 0);
    assert.equal(results.skipped, 0);
    assert.equal(results.cards[0].knownOn, 1);
    assert.equal(results.cards[0].totalMs, 1000);
  });

  it("keeps unknown cards in play until they are known", () => {
    let session = createStudySession(deck, 0);
    assert.equal(session.skipped, 1);
    assert.equal(sessionCard(session).id, "a");
    session = markSession(session, "again", 400);
    assert.equal(sessionCard(session).id, "b");
    assert.equal(session.known.a, undefined);
    session = markSession(session, "know", 700);
    assert.equal(session.pass, "repeat");
    assert.deepEqual(session.queue, ["a"]);
    assert.equal(session.known.b, true);
    session = flipSession(session);
    assert.equal(session.revealed, true);
    session = markSession(session, "again", 900);
    assert.equal(session.pass, "repeat");
    assert.equal(session.known.a, undefined);
    assert.equal(sessionCard(session).id, "a");
    session = markSession(session, "know", 1500);
    assert.equal(session.pass, "done");
    const results = studyResults(session);
    assert.equal(results.total, 2);
    assert.equal(results.known, 2);
    assert.equal(results.again, 0);
    assert.equal(results.firstTry, 1);
    assert.equal(results.later, 1);
    assert.equal(results.skipped, 1);
    assert.equal(results.cards[0].id, "a");
    assert.equal(results.cards[0].knownOn, 3);
    assert.equal(results.cards[0].totalMs, 400 + 200 + 600);
    assert.equal(results.cards[1].knownOn, 1);
    assert.deepEqual(
      results.cards[0].attempts.map((attempt) => attempt.mark),
      ["again", "again", "know"],
    );
  });

  it("moves between cards without wrapping or scoring", () => {
    const session = createStudySession(deck);
    assert.equal(moveSession(session, -1), session);
    const next = moveSession(session, 1);
    assert.equal(next.index, 1);
    assert.equal(next.revealed, false);
    assert.equal(moveSession(next, 1), next);
  });

  it("does not start when every card is empty", () => {
    const session = createStudySession([card("a", " ", "")]);
    assert.equal(session.pass, "done");
    assert.equal(session.cards.length, 0);
  });
});
