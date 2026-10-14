/**
 * services/mock/sync.ts — in-memory peer fan-out and cloud backup.
 *
 * BACKEND ENTEGRASYON NOKTASI
 * These four functions are the entire server surface for sync. Replace the
 * bodies with real HTTP / WebSocket calls; keep the argument and return
 * shapes. The UI already speaks `NoteSyncPayload`.
 *
 *   mockSocketEmit     → WebSocket `note.sync` (or POST /api/sync/peer)
 *   mockApiSaveToCloud → POST /api/notes/:noteId/backup
 *   listHistory        → GET  /api/notes/:noteId/history
 *   getVersion         → GET  /api/notes/:noteId/history/:versionId
 */

import type { SyncService } from "../contracts";
import type { ItemId, NoteSyncPayload, NoteVersion, ServiceError } from "../../types";

const LATENCY_MS = 180;
const HISTORY_KEY = "txtnote.mock.cloudHistory";

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

const fail = (error: ServiceError): never => {
  throw error;
};

const nextId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const readHistoryStore = (): Record<string, NoteVersion[]> => {
  try {
    const raw = globalThis.localStorage?.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NoteVersion[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeHistoryStore = (store: Record<string, NoteVersion[]>) => {
  try {
    globalThis.localStorage?.setItem(HISTORY_KEY, JSON.stringify(store));
  } catch {
    // Private mode — history lives in the Map for this session only.
  }
};

const history = new Map<ItemId, NoteVersion[]>();
const peerInbox: Array<NoteSyncPayload & { receivedAt: number }> = [];

const hydrateHistory = () => {
  if (history.size > 0) return;
  const stored = readHistoryStore();
  Object.entries(stored).forEach(([noteId, versions]) => {
    history.set(noteId, versions);
  });
};

const persistHistory = () => {
  const store: Record<string, NoteVersion[]> = {};
  history.forEach((versions, noteId) => {
    store[noteId] = versions;
  });
  writeHistoryStore(store);
};

hydrateHistory();

/** Test helper. Called from `__resetMockDb`. */
export const __resetMockSync = () => {
  history.clear();
  peerInbox.length = 0;
  try {
    globalThis.localStorage?.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
};

/**
 * BACKEND ENTEGRASYON NOKTASI — mockSocketEmit
 *
 * Real implementation:
 *   const socket = getAccountSocket(); // already authenticated
 *   socket.send(JSON.stringify({ type: "note.sync", payload }));
 *
 * The payload is already hashed and timestamped by the client. The server
 * should fan it out to the account's other live sessions and not echo it
 * back to the sender.
 */
export const mockSocketEmit = async (payload: NoteSyncPayload): Promise<void> => {
  if (!payload?.noteId) fail({ code: "VALIDATION", field: "noteId", message: "noteId gerekli." });
  peerInbox.push({ ...payload, receivedAt: Date.now() });
  return delay(undefined);
};

/**
 * BACKEND ENTEGRASYON NOKTASI — mockApiSaveToCloud
 *
 * Real implementation:
 *   POST /api/notes/:noteId/backup
 *   body: NoteSyncPayload
 *   201 { id, noteId, createdAt, hash, payload, source: "cloud" }
 *
 * Skip creating a new version when `hash` matches the latest stored version
 * for that note (the client already does this, the server should too).
 */
export const mockApiSaveToCloud = async (payload: NoteSyncPayload): Promise<NoteVersion> => {
  if (!payload?.noteId) fail({ code: "VALIDATION", field: "noteId", message: "noteId gerekli." });
  if (!payload.hash) fail({ code: "VALIDATION", field: "hash", message: "hash gerekli." });

  const current = history.get(payload.noteId) ?? [];
  if (current[0]?.hash === payload.hash) {
    return delay({ ...current[0], payload: { ...current[0].payload } });
  }

  const version: NoteVersion = {
    id: nextId("ver"),
    noteId: payload.noteId,
    createdAt: Date.now(),
    hash: payload.hash,
    payload: { ...payload, extras: { ...payload.extras } },
    source: "cloud",
  };

  history.set(payload.noteId, [version, ...current]);
  persistHistory();
  return delay({ ...version, payload: { ...version.payload } });
};

export const mockSyncService: SyncService = {
  emitToPeers: mockSocketEmit,
  saveToCloud: mockApiSaveToCloud,

  async listHistory(noteId: ItemId) {
    const versions = history.get(noteId) ?? [];
    return delay(versions.map((row) => ({ ...row, payload: { ...row.payload } })));
  },

  async getVersion(noteId: ItemId, versionId: string) {
    const found = (history.get(noteId) ?? []).find((row) => row.id === versionId) ?? null;
    return delay(found ? { ...found, payload: { ...found.payload } } : null);
  },
};
