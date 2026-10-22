/**
 * Canonical sync payload + checksum.
 *
 * BACKEND ENTEGRASYON NOKTASI — `buildNotePayload` is what both mock and
 * HTTP send. If the server needs another field, add it here (and to
 * `NoteSyncPayload` in types/) so every lane stays in lockstep.
 */

import { sanitizeDeck } from "../../lib/flashcards.js";
import { pickTodoDailyFields } from "../../lib/todoDaily.js";
import { prepareThesisNote } from "../../../../../engine/src/contentModel.js";

const DEVICE_KEY = "txtnote.deviceId";

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

/** Fast non-crypto checksum. The server should prefer SHA-256 of the same body. */
export const checksum = (value) => {
  const json = typeof value === "string" ? value : stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const getDeviceId = () => {
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `dev-${crypto.randomUUID()}`
        : `dev-${Date.now().toString(36)}`;
    window.localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return "dev-session";
  }
};

/**
 * Fields of a note opened from a text/code file (HE-VB-03). They ride in `extras` so every lane that rebuilds a note
 * from its payload (the local SQLite/IndexedDB backup among them) keeps the file's encoding and chosen language.
 * The folder link (`fileId`) is not one of them: storage derives it from the item tree.
 */
const pickNoteFileFields = (note) => ({
  ...(typeof note?.encoding === "string" ? { encoding: note.encoding } : {}),
  ...(typeof note?.languageId === "string" ? { languageId: note.languageId } : {}),
  ...(typeof note?.languageLocked === "boolean" ? { languageLocked: note.languageLocked } : {}),
});

export const noteFromPayload = (payload) => {
  const flashcards = sanitizeDeck(payload.extras?.flashcards);
  return prepareThesisNote({
    title: payload.title ?? "",
    content: payload.content ?? (payload.extras?.researchData?.thesis?.document ? undefined : ""),
    todos: payload.extras?.todos ?? [],
    entries: payload.extras?.entries ?? {},
    mindmap: payload.extras?.mindmap ?? { nodes: [], edges: [] },
    ...(payload.extras?.researchData != null ? { researchData: payload.extras.researchData } : {}),
    ...(flashcards ? { flashcards } : {}),
    ...pickTodoDailyFields(payload.extras ?? {}),
    ...pickNoteFileFields(payload.extras),
  });
};

export const buildNotePayload = ({ noteId, workspaceId, note, deviceId, updatedAt = Date.now() }) => {
  note = prepareThesisNote(note);
  const flashcards = sanitizeDeck(note?.flashcards);
  const extras = {
    todos: note?.todos ?? [],
    entries: note?.entries ?? {},
    mindmap: note?.mindmap ?? { nodes: [], edges: [] },
    ...(note?.researchData != null ? { researchData: note.researchData } : {}),
    ...(flashcards ? { flashcards } : {}),
    ...pickTodoDailyFields(note),
    ...pickNoteFileFields(note),
  };
  const body = {
    noteId,
    workspaceId: workspaceId ?? "",
    title: note?.title ?? "",
    content: note?.content ?? "",
    extras,
  };
  return {
    ...body,
    updatedAt,
    hash: checksum(body),
    deviceId,
  };
};

export const hashNote = (noteId, workspaceId, note) =>
  buildNotePayload({ noteId, workspaceId, note, deviceId: "", updatedAt: 0 }).hash;
