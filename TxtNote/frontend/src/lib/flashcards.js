/**
 * Flashcard deck helpers. Cards live on the note (`flashcards.cards`) and
 * travel with the existing sync payload — this module only shapes that slice.
 */

const IMAGE_SRC = /^data:image\//i;

export function createCard(id) {
  return {
    id,
    front: "",
    back: "",
    image: null,
  };
}

const cardId = (raw, index, seen) => {
  const base = typeof raw?.id === "string" && raw.id.trim() ? raw.id.trim() : `card-${index + 1}`;
  if (!seen.has(base)) return base;
  return `${base}-${index + 1}`;
};

export function sanitizeCard(raw, index = 0, seen = new Set()) {
  if (!raw || typeof raw !== "object") return null;
  const id = cardId(raw, index, seen);
  seen.add(id);
  const front = typeof raw.front === "string" ? raw.front : "";
  const back = typeof raw.back === "string" ? raw.back : "";
  const image = typeof raw.image === "string" && IMAGE_SRC.test(raw.image) ? raw.image : null;
  return { id, front, back, image };
}

/** Null when the note has no deck. An empty deck is `{ cards: [] }`. */
export function sanitizeDeck(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  if (!Array.isArray(value.cards)) return null;
  const seen = new Set();
  const cards = [];
  value.cards.forEach((raw, index) => {
    const card = sanitizeCard(raw, index, seen);
    if (card) cards.push(card);
  });
  return { cards };
}

export function cardHasFront(card) {
  return Boolean(String(card?.front ?? "").trim() || card?.image);
}

export function cardHasBack(card) {
  return Boolean(String(card?.back ?? "").trim());
}

export function isCardEmpty(card) {
  return !cardHasFront(card) && !cardHasBack(card);
}

export function deckStatus(cards) {
  const list = Array.isArray(cards) ? cards : [];
  let empty = 0;
  let incomplete = 0;
  let playable = 0;
  for (const card of list) {
    if (isCardEmpty(card)) {
      empty += 1;
      continue;
    }
    playable += 1;
    if (!cardHasFront(card) || !cardHasBack(card)) incomplete += 1;
  }
  return { total: list.length, empty, incomplete, playable };
}

export function clampIndex(index, length) {
  if (length <= 0) return 0;
  const numeric = Number.isFinite(index) ? index : 0;
  return Math.min(Math.max(0, numeric), length - 1);
}

export function sameFlashcardDeck(prev, next) {
  const left = prev?.cards ?? [];
  const right = next?.cards ?? [];
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    if (a === b) continue;
    if (!a || !b) return false;
    if (a.id !== b.id || a.front !== b.front || a.back !== b.back) return false;
    if ((a.image ?? null) !== (b.image ?? null)) return false;
  }
  return true;
}

/** Text edits coalesce; adding, deleting or changing a picture is one step. */
export function flashcardsChangeKind(prev, next) {
  const left = prev?.cards ?? [];
  const right = next?.cards ?? [];
  if (left.length !== right.length) return "action";
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    if (!a || !b || a.id !== b.id || (a.image ?? null) !== (b.image ?? null)) return "action";
  }
  return "type";
}

export function createStudySession(cards, now = Date.now()) {
  const source = Array.isArray(cards) ? cards : [];
  const playable = [];
  for (const card of source) {
    if (!card || isCardEmpty(card)) continue;
    playable.push({
      id: card.id,
      front: card.front ?? "",
      back: card.back ?? "",
      image: card.image ?? null,
    });
  }
  return {
    cards: playable,
    queue: playable.map((card) => card.id),
    index: 0,
    revealed: false,
    pass: playable.length > 0 ? "first" : "done",
    known: {},
    attempts: {},
    shownAt: playable.length > 0 ? now : null,
    skipped: source.length - playable.length,
  };
}

export function sessionCard(session) {
  if (!session || session.pass === "done") return null;
  const id = session.queue[session.index];
  if (!id) return null;
  return session.cards.find((card) => card.id === id) ?? null;
}

export function flipSession(session) {
  if (!session || session.pass === "done") return session;
  return { ...session, revealed: !session.revealed };
}

export function moveSession(session, delta, now = Date.now()) {
  if (!session || session.pass === "done" || session.queue.length === 0) return session;
  const index = Math.min(session.queue.length - 1, Math.max(0, session.index + delta));
  if (index === session.index) return session;
  return { ...session, index, revealed: false, shownAt: now };
}

const withAttempt = (session, id, mark, now) => {
  const started = Number.isFinite(session.shownAt) ? session.shownAt : now;
  const ms = Math.max(0, now - started);
  const previous = session.attempts?.[id] ?? [];
  return {
    ...(session.attempts ?? {}),
    [id]: [...previous, { mark, ms }],
  };
};

const passFor = (session, attempts) => {
  const seen = session.cards.every((card) => (attempts[card.id] ?? []).length > 0);
  return seen ? "repeat" : "first";
};

export function markSession(session, mark, now = Date.now()) {
  if (!session || session.pass === "done") return session;
  if (mark !== "know" && mark !== "again") return session;
  const id = session.queue[session.index];
  if (!id) return session;

  const attempts = withAttempt(session, id, mark, now);
  const known = { ...(session.known ?? {}) };

  if (mark === "know") {
    known[id] = true;
    const queue = session.queue.filter((cardId) => cardId !== id);
    if (queue.length === 0) {
      return {
        ...session,
        attempts,
        known,
        queue,
        index: 0,
        revealed: false,
        pass: "done",
        shownAt: null,
      };
    }
    const index = session.index >= queue.length ? 0 : session.index;
    return {
      ...session,
      attempts,
      known,
      queue,
      index,
      revealed: false,
      shownAt: now,
      pass: passFor(session, attempts),
    };
  }

  delete known[id];
  const queue = session.queue.slice();
  const at = session.index;
  const wasLast = at >= queue.length - 1;
  const [current] = queue.splice(at, 1);
  queue.push(current);
  return {
    ...session,
    attempts,
    known,
    queue,
    index: wasLast ? 0 : at,
    revealed: false,
    shownAt: now,
    pass: passFor(session, attempts),
  };
}

export function knownCount(session) {
  if (!session?.known) return 0;
  return Object.keys(session.known).length;
}

export function studyResults(session) {
  const list = session?.cards ?? [];
  const cards = list.map((card) => {
    const attempts = session?.attempts?.[card.id] ?? [];
    const last = attempts[attempts.length - 1];
    const knownOn = last?.mark === "know" ? attempts.length : null;
    const totalMs = attempts.reduce((sum, attempt) => sum + (attempt.ms || 0), 0);
    return {
      id: card.id,
      front: card.front ?? "",
      image: card.image ?? null,
      knownOn,
      totalMs,
      attempts: attempts.map((attempt) => ({ mark: attempt.mark, ms: attempt.ms })),
    };
  });
  const firstTry = cards.filter((card) => card.knownOn === 1).length;
  const later = cards.filter((card) => card.knownOn != null && card.knownOn >= 2).length;
  const known = cards.filter((card) => card.knownOn != null).length;
  return {
    total: list.length,
    known,
    again: list.length - known,
    firstTry,
    later,
    skipped: session?.skipped ?? 0,
    cards,
  };
}
